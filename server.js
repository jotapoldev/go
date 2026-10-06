// Taplog: visitas a los sitios de jotapol, links cortos por post y tablero (hoy en jotapol.com/r). Node 24, sin dependencias.
// Guarda solo datos agregados (día, hora, página, origen, dispositivo); nunca IP ni datos de la persona.
import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cleanHost, device, isBot, originMatches, source, validCode, validTarget, visitSource } from "./lib.js";
import { dashboard, esc, login, notFound, page, tokenShown } from "./views.js";
import { demoLinks, demoRaw } from "./demo.js";
import { SITES, lastDays, model } from "./model.js";

const PORT = Number(process.env.PORT ?? 3300);
const DATA = process.env.DATA_DIR ?? "./data";
const TOKEN = process.env.ADMIN_TOKEN ?? "";
const HOME = process.env.HOME_URL ?? "https://jotapol.com";
// Prefijo cuando el servicio vive detrás de otra web (jotapol.com/r/09 → BASE_PATH=/r). Vacío si tiene dominio propio.
const BASE = (process.env.BASE_PATH ?? "").replace(/\/+$/, "");
const P = (p) => BASE + p;
const RESERVED = new Set(["admin", "health", "demo", "hit"]);
const TZ = process.env.TZ_NAME ?? "America/El_Salvador";
mkdirSync(DATA, { recursive: true });

const db = new DatabaseSync(join(DATA, "go.db"));
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS links (code TEXT PRIMARY KEY, target TEXT NOT NULL, label TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS clicks (id INTEGER PRIMARY KEY, code TEXT NOT NULL, day TEXT NOT NULL, hour INTEGER NOT NULL, source TEXT NOT NULL, device TEXT NOT NULL);
  CREATE INDEX IF NOT EXISTS clicks_code_day ON clicks (code, day);
  CREATE TABLE IF NOT EXISTS visits (id INTEGER PRIMARY KEY, site TEXT NOT NULL, day TEXT NOT NULL, hour INTEGER NOT NULL, path TEXT NOT NULL, source TEXT NOT NULL, device TEXT NOT NULL);
  CREATE INDEX IF NOT EXISTS visits_day ON visits (day, site);
  CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, name TEXT NOT NULL, token_hash TEXT UNIQUE, created_at TEXT NOT NULL DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS sites (id TEXT PRIMARY KEY, account TEXT NOT NULL, name TEXT NOT NULL, host TEXT NOT NULL UNIQUE, note TEXT, color TEXT NOT NULL, ini TEXT NOT NULL);
  CREATE INDEX IF NOT EXISTS sites_account ON sites (account);
  CREATE TABLE IF NOT EXISTS ig (code TEXT PRIMARY KEY, reach INTEGER, saves INTEGER, shares INTEGER, likes INTEGER, comments INTEGER, updated_at TEXT);
`);
// La cuenta dueña (jotapol) entra con ADMIN_TOKEN y sus sitios son los de SITES. Los clientes tienen su propia clave (se guarda solo el hash).
const OWNER = "jotapol";
db.prepare("INSERT OR IGNORE INTO accounts (id, name) VALUES (?, 'jotapol')").run(OWNER);
for (const x of SITES) db.prepare("INSERT OR IGNORE INTO sites (id, account, name, host, note, color, ini) VALUES (?, ?, ?, ?, ?, ?, ?)").run(x.id, OWNER, x.name, x.host, x.note, x.color, x.ini);

const q = {
  account: db.prepare("SELECT id, name FROM accounts WHERE token_hash = ?"),
  accountById: db.prepare("SELECT id FROM accounts WHERE id = ?"),
  accounts: db.prepare("SELECT a.id, a.name, a.created_at, COUNT(s.id) AS sites FROM accounts a LEFT JOIN sites s ON s.account = a.id WHERE a.id <> ? GROUP BY a.id ORDER BY a.created_at DESC"),
  addAccount: db.prepare("INSERT INTO accounts (id, name, token_hash) VALUES (?, ?, ?)"),
  site: db.prepare("SELECT * FROM sites WHERE id = ?"),
  sitesOf: db.prepare("SELECT * FROM sites WHERE account = ? ORDER BY rowid"),
  hostTaken: db.prepare("SELECT 1 FROM sites WHERE host = ?"),
  addSite: db.prepare("INSERT INTO sites (id, account, name, host, note, color, ini) VALUES (?, ?, ?, ?, ?, ?, ?)"),
  link: db.prepare("SELECT * FROM links WHERE code = ?"),
  click: db.prepare("INSERT INTO clicks (code, day, hour, source, device) VALUES (?, ?, ?, ?, ?)"),
  upsertLink: db.prepare("INSERT INTO links (code, target, label) VALUES (?, ?, ?) ON CONFLICT(code) DO UPDATE SET target = excluded.target, label = excluded.label"),
  upsertIg: db.prepare("INSERT INTO ig (code, reach, saves, shares, likes, comments, updated_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now')) ON CONFLICT(code) DO UPDATE SET reach = excluded.reach, saves = excluded.saves, shares = excluded.shares, likes = excluded.likes, comments = excluded.comments, updated_at = excluded.updated_at"),
  summary: db.prepare(`SELECT l.code, l.target, l.label, l.created_at, COUNT(c.id) AS clicks, i.reach, i.saves, i.shares, i.likes, i.comments
    FROM links l LEFT JOIN clicks c ON c.code = l.code LEFT JOIN ig i ON i.code = l.code GROUP BY l.code ORDER BY l.created_at DESC`),
  bySource: db.prepare("SELECT code, source, COUNT(*) AS n FROM clicks GROUP BY code, source ORDER BY n DESC"),
  visit: db.prepare("INSERT INTO visits (site, day, hour, path, source, device) VALUES (?, ?, ?, ?, ?, ?)"),
  vDaily: db.prepare("SELECT site, day, COUNT(*) AS n FROM visits WHERE day >= ? GROUP BY site, day"),
  vPages: db.prepare("SELECT site, path, COUNT(*) AS n FROM visits WHERE day >= ? GROUP BY site, path ORDER BY n DESC LIMIT 60"),
  vPageDaily: db.prepare("SELECT site, path, day, COUNT(*) AS n FROM visits WHERE day >= ? GROUP BY site, path, day"),
  vSources: db.prepare("SELECT site, source, COUNT(*) AS n FROM visits WHERE day >= ? AND source <> 'interno' GROUP BY site, source"),
  vDevices: db.prepare("SELECT site, device, COUNT(*) AS n FROM visits WHERE day >= ? GROUP BY site, device"),
};

// Día y hora en El Salvador, para que "hoy" en el tablero sea el hoy de aquí.
const today = (d = new Date()) => d.toLocaleDateString("en-CA", { timeZone: TZ });
const hourNow = (d = new Date()) => Number(d.toLocaleString("en-US", { timeZone: TZ, hour: "numeric", hourCycle: "h23" }));
const shortTarget = (t) => { try { const u = new URL(t); return u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/$/, ""); } catch { return t; } };

/** Agregados de visitas en el formato de model(): 60 días de serie; páginas, orígenes y dispositivos del período. */
function realRaw(day, period) {
  const from = lastDays(day, period)[0];
  return { daily: q.vDaily.all(lastDays(day, 60)[0]), pages: q.vPages.all(from), pageDaily: q.vPageDaily.all(lastDays(day, 14)[0]), sources: q.vSources.all(from), devices: q.vDevices.all(from) };
}

function realLinks() {
  const src = new Map();
  for (const r of q.bySource.all()) src.set(r.code, [...(src.get(r.code) ?? []), { source: r.source, n: r.n }]);
  return q.summary.all().map((r) => ({ ...r, targetShort: shortTarget(r.target), sources: src.get(r.code) ?? [] }));
}

/** Visita que manda el fragmento de un sitio: {s: sitio, p: ruta, r: referer, q: query}. */
async function hit(req) {
  const body = await new Promise((ok) => { let b = ""; req.on("data", (d) => { b += d; if (b.length > 4e3) req.destroy(); }); req.on("end", () => ok(b)); });
  let m; try { m = JSON.parse(body); } catch { return; }
  const site = q.site.get(String(m?.s ?? "").slice(0, 40));
  const ua = req.headers["user-agent"] ?? "";
  // ponytail: Origin + sitio conocido frena el ruido de navegadores; alguien con curl igual podría inflar números.
  let origin = ""; try { origin = new URL(req.headers.origin ?? "").hostname; } catch {}
  if (!site || !originMatches(origin, site.host) || isBot(ua)) return;
  const path = (String(m.p ?? "/").split(/[?#]/)[0] || "/").slice(0, 120);
  const now = new Date();
  q.visit.run(site.id, today(now), hourNow(now), path, visitSource(ua, String(m.r ?? ""), String(m.q ?? ""), site.host), device(ua));
}

const send = (res, status, body, headers = {}) => { res.writeHead(status, { "content-type": "text/html; charset=utf-8", "x-frame-options": "DENY", "referrer-policy": "no-referrer", ...headers }); res.end(body); };
const redirect = (res, to, status = 302) => { res.writeHead(status, { location: to, "cache-control": "no-store" }); res.end(); };
const cookie = (req, name) => (req.headers.cookie ?? "").split(/;\s*/).find((c) => c.startsWith(name + "="))?.slice(name.length + 1);
const same = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };
const sha = (t) => createHash("sha256").update(t).digest("hex");
/** Cuenta de una clave: ADMIN_TOKEN es la dueña; cualquier otra se busca por su hash. */
function accountFor(t) {
  if (t.length < 12) return null;
  if (TOKEN.length >= 12 && same(t, TOKEN)) return { id: OWNER, name: "jotapol", owner: true };
  const a = q.account.get(sha(t));
  return a ? { ...a, owner: false } : null;
}
const whoami = (req) => accountFor(decodeURIComponent(cookie(req, "t") ?? ""));
const PALETTE = ["#3B2FD6", "#0E9F92", "#C2458F", "#DB7429", "#2F6BFF", "#7A2BC9", "#2BC48A"];
const initials = (name) => {
  const w = name.replace(/[^\p{L}\p{N} ]/gu, "").trim().split(/\s+/).filter(Boolean);
  const ini = w.length > 1 ? w[0][0] + w[1][0] : (w[0] ?? "S").slice(0, 2);
  return ini[0].toUpperCase() + ini.slice(1).toLowerCase();
};
const form = (req) => new Promise((ok) => { let b = ""; req.on("data", (d) => { b += d; if (b.length > 1e4) req.destroy(); }); req.on("end", () => ok(Object.fromEntries(new URLSearchParams(b)))); });
const int = (v) => (v === "" || v == null || isNaN(Number(v)) ? null : Math.max(0, Math.round(Number(v))));
const oops = (msg, tab = "links") => page("Error en Taplog", `<section class="win solo" style="max-width:520px"><p style="margin:0 0 16px">${msg}</p><a class="btn" style="display:inline-grid;place-items:center;text-decoration:none" href="${P("/admin?tab=" + tab)}">Volver</a></section>`);
const COOKIE = (v, age) => `t=${v}; Path=${BASE || "/"}; Max-Age=${age}; HttpOnly; Secure; SameSite=Strict`;
/** Opciones del tablero en la URL: ?site=web&p=30&tab=links. */
const view = (url, sites) => {
  const p = Number(url.searchParams.get("p")), tab = url.searchParams.get("tab"), site = url.searchParams.get("site");
  return { period: [1, 7, 30].includes(p) ? p : 7, site: sites.some((s) => s.id === site) ? site : null, tab: ["links", "ajustes"].includes(tab) ? tab : "resumen" };
};

createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  let path = url.pathname.replace(/\/+$/, "") || "/";
  if (BASE && (path === BASE || path.startsWith(BASE + "/"))) path = path.slice(BASE.length) || "/";
  const host = req.headers["x-forwarded-host"] ?? req.headers.host ?? "jotapol.com";
  try {
    if (path === "/") return redirect(res, HOME);
    if (path === "/health") return send(res, 200, "ok", { "content-type": "text/plain" });
    if (path === "/hit" && req.method === "POST") { await hit(req); res.writeHead(204, { "cache-control": "no-store" }); return res.end(); }
    if (path === "/demo") {
      const v = view(url, SITES), day = today();
      return send(res, 200, dashboard(model(demoRaw(day, v.period), { today: day, ...v }), { base: BASE, host, demo: true, owner: true, tab: v.tab, links: demoLinks, sites: SITES }), { "cache-control": "public, max-age=300" });
    }

    if (path === "/admin/login" && req.method === "POST") {
      const f = await form(req);
      const t = String(f.token ?? "").trim();
      if (!accountFor(t)) return send(res, 401, login(BASE, "Esa clave no corresponde a ninguna cuenta. Revisá que esté completa y sin espacios."));
      res.setHeader("set-cookie", COOKIE(encodeURIComponent(t), 2592000));
      return redirect(res, P("/admin"), 303);
    }
    if (path.startsWith("/admin")) {
      const me = whoami(req);
      if (!me) return send(res, 401, login(BASE));
      const mine = q.sitesOf.all(me.id);
      if (path === "/admin" && req.method === "GET") {
        const v = view(url, mine), day = today();
        if (!me.owner && v.tab === "links") v.tab = "resumen";
        return send(res, 200, dashboard(model(realRaw(day, v.period), { today: day, ...v, sites: mine }), {
          base: BASE, host, owner: me.owner, tab: v.tab, sites: mine,
          links: me.owner && v.tab === "links" ? realLinks() : [],
          accounts: me.owner && v.tab === "ajustes" ? q.accounts.all(OWNER) : [],
        }), { "cache-control": "no-store" });
      }
      if (req.method !== "POST") return send(res, 405, notFound(HOME));
      const f = await form(req);
      if (path === "/admin/logout") { res.setHeader("set-cookie", COOKIE("", 0)); return redirect(res, P("/admin"), 303); }
      if (path === "/admin/sites") {
        // Cada cuenta agrega sus sitios; la dueña puede elegir a qué cuenta va.
        const account = me.owner && f.account ? f.account : me.id;
        const name = String(f.name ?? "").trim().slice(0, 60), siteHost = cleanHost(f.host);
        if (!name) return send(res, 400, oops("Falta el nombre del sitio: poné cómo querés verlo en el tablero, por ejemplo Tienda.", "ajustes"));
        if (!siteHost) return send(res, 400, oops(`"${esc(f.host ?? "")}" no es un dominio válido. Escribilo como tienda.com o blog.tienda.com.`, "ajustes"));
        if (q.hostTaken.get(siteHost)) return send(res, 400, oops(`${esc(siteHost)} ya está registrado en Taplog.`, "ajustes"));
        if (!q.accountById.get(account)) return send(res, 400, oops("Esa cuenta no existe.", "ajustes"));
        const n = q.sitesOf.all(account).length;
        q.addSite.run(randomBytes(5).toString("hex"), account, name, siteHost, siteHost, PALETTE[n % PALETTE.length], initials(name));
        return redirect(res, P("/admin?tab=ajustes"), 303);
      }
      if (!me.owner) return send(res, 403, oops("Esa acción es solo para la cuenta de jotapol.", "ajustes"));
      if (path === "/admin/clients") {
        const name = String(f.name ?? "").trim().slice(0, 80);
        if (!name) return send(res, 400, oops("Falta el nombre del cliente.", "ajustes"));
        // ponytail: la clave se ve una sola vez y se guarda solo su hash; si el cliente la pierde, hoy toca crear otra cuenta.
        const token = "tl_" + randomBytes(24).toString("base64url");
        q.addAccount.run(randomBytes(5).toString("hex"), name, sha(token));
        return send(res, 200, tokenShown(BASE, name, token), { "cache-control": "no-store" });
      }
      if (path === "/admin/links") {
        const code = (f.code ?? "").trim().toLowerCase();
        if (!validCode(code) || RESERVED.has(code)) return send(res, 400, oops(`El código "${esc(code)}" no sirve: usá minúsculas, números y guiones (por ejemplo 09 o reel-tradelearn). "admin", "demo", "health" y "hit" están reservados.`));
        if (!validTarget(f.target)) return send(res, 400, oops("El destino tiene que empezar con https:// o http://."));
        q.upsertLink.run(code, f.target.trim(), (f.label ?? "").trim().slice(0, 120) || null);
        return redirect(res, P("/admin?tab=links"), 303);
      }
      if (path === "/admin/ig") {
        const code = (f.code ?? "").trim().toLowerCase();
        if (!q.link.get(code)) return send(res, 400, oops(`No hay un link con el código "${esc(code)}". Crealo primero.`));
        q.upsertIg.run(code, int(f.reach), int(f.saves), int(f.shares), int(f.likes), int(f.comments));
        return redirect(res, P("/admin?tab=links"), 303);
      }
      return send(res, 404, notFound(HOME));
    }

    // Link corto: cuenta el clic (si no es un bot ni una previsualización) y redirige.
    const code = path.slice(1).toLowerCase();
    const link = validCode(code) ? q.link.get(code) : null;
    if (!link) return send(res, 404, notFound(HOME));
    const ua = req.headers["user-agent"] ?? "";
    if (!isBot(ua)) { const now = new Date(); q.click.run(code, today(now), hourNow(now), source(ua, req.headers.referer), device(ua)); }
    return redirect(res, link.target);
  } catch (e) {
    console.error(e);
    return send(res, 500, page("Error en Taplog", "<p>Algo falló en el servidor. Probá de nuevo en un momento.</p>"));
  }
}).listen(PORT, () => console.log(`taplog escuchando en :${PORT}`));
