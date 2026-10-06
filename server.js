// Taplog: links cortos por post y tablero de alcance (hoy en jotapol.com/r). Node 24, sin dependencias.
// Guarda solo datos agregados del clic (día, hora, origen, dispositivo); nunca IP ni datos de la persona.
import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { timingSafeEqual } from "node:crypto";
import { device, isBot, source, validCode, validTarget } from "./lib.js";
import { dashboard, esc, login, notFound, page } from "./views.js";
import { demoData } from "./demo.js";

const PORT = Number(process.env.PORT ?? 3300);
const DATA = process.env.DATA_DIR ?? "./data";
const TOKEN = process.env.ADMIN_TOKEN ?? "";
const HOME = process.env.HOME_URL ?? "https://jotapol.com";
// Prefijo cuando el servicio vive detrás de otra web (jotapol.com/r/09 → BASE_PATH=/r). Vacío si tiene dominio propio.
const BASE = (process.env.BASE_PATH ?? "").replace(/\/+$/, "");
const P = (p) => BASE + p;
const RESERVED = new Set(["admin", "health", "demo"]);
mkdirSync(DATA, { recursive: true });

const db = new DatabaseSync(join(DATA, "go.db"));
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS links (code TEXT PRIMARY KEY, target TEXT NOT NULL, label TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS clicks (id INTEGER PRIMARY KEY, code TEXT NOT NULL, day TEXT NOT NULL, hour INTEGER NOT NULL, source TEXT NOT NULL, device TEXT NOT NULL);
  CREATE INDEX IF NOT EXISTS clicks_code_day ON clicks (code, day);
  CREATE TABLE IF NOT EXISTS ig (code TEXT PRIMARY KEY, reach INTEGER, saves INTEGER, shares INTEGER, likes INTEGER, comments INTEGER, updated_at TEXT);
`);
const q = {
  link: db.prepare("SELECT * FROM links WHERE code = ?"),
  click: db.prepare("INSERT INTO clicks (code, day, hour, source, device) VALUES (?, ?, ?, ?, ?)"),
  upsertLink: db.prepare("INSERT INTO links (code, target, label) VALUES (?, ?, ?) ON CONFLICT(code) DO UPDATE SET target = excluded.target, label = excluded.label"),
  upsertIg: db.prepare("INSERT INTO ig (code, reach, saves, shares, likes, comments, updated_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now')) ON CONFLICT(code) DO UPDATE SET reach = excluded.reach, saves = excluded.saves, shares = excluded.shares, likes = excluded.likes, comments = excluded.comments, updated_at = excluded.updated_at"),
  summary: db.prepare(`SELECT l.code, l.target, l.label, l.created_at, COUNT(c.id) AS clicks, i.reach, i.saves, i.shares, i.likes, i.comments
    FROM links l LEFT JOIN clicks c ON c.code = l.code LEFT JOIN ig i ON i.code = l.code GROUP BY l.code ORDER BY l.created_at DESC`),
  daily: db.prepare("SELECT code, day, COUNT(*) AS n FROM clicks WHERE day >= ? GROUP BY code, day"),
  bySource: db.prepare("SELECT code, source, COUNT(*) AS n FROM clicks GROUP BY code, source ORDER BY n DESC"),
  sources: db.prepare("SELECT source, COUNT(*) AS n FROM clicks GROUP BY source ORDER BY n DESC"),
  devices: db.prepare("SELECT device, COUNT(*) AS n FROM clicks GROUP BY device ORDER BY n DESC"),
};

const today = (d = new Date()) => d.toISOString().slice(0, 10);
const shortTarget = (t) => { try { const u = new URL(t); return u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/$/, ""); } catch { return t; } };

/** Mismos datos que demoData(), pero desde la base. */
function realData() {
  const days = Array.from({ length: 30 }, (_, i) => today(new Date(Date.now() - (29 - i) * 864e5)));
  const daily = new Map();
  for (const r of q.daily.all(days[0])) daily.set(`${r.code}|${r.day}`, r.n);
  const src = new Map();
  for (const r of q.bySource.all()) src.set(r.code, [...(src.get(r.code) ?? []), { source: r.source, n: r.n }]);
  const rows = q.summary.all().map((r) => ({
    ...r, targetShort: shortTarget(r.target), sources: src.get(r.code) ?? [],
    daily14: days.slice(-14).map((d) => daily.get(`${r.code}|${d}`) ?? 0),
  }));
  const daily30 = days.map((d) => rows.reduce((s, r) => s + (daily.get(`${r.code}|${d}`) ?? 0), 0));
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  return {
    days30: days, daily30, rows, total: sum(rows.map((r) => r.clicks)),
    week: sum(daily30.slice(-7)), prevWeek: sum(daily30.slice(-14, -7)),
    reach: sum(rows.map((r) => r.reach ?? 0)), sources: q.sources.all(), devices: q.devices.all(),
  };
}

const send = (res, status, body, headers = {}) => { res.writeHead(status, { "content-type": "text/html; charset=utf-8", "x-frame-options": "DENY", "referrer-policy": "no-referrer", ...headers }); res.end(body); };
const redirect = (res, to, status = 302) => { res.writeHead(status, { location: to, "cache-control": "no-store" }); res.end(); };
const cookie = (req, name) => (req.headers.cookie ?? "").split(/;\s*/).find((c) => c.startsWith(name + "="))?.slice(name.length + 1);
const same = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };
const authed = (req) => TOKEN.length >= 12 && same(decodeURIComponent(cookie(req, "t") ?? ""), TOKEN);
const form = (req) => new Promise((ok) => { let b = ""; req.on("data", (d) => { b += d; if (b.length > 1e4) req.destroy(); }); req.on("end", () => ok(Object.fromEntries(new URLSearchParams(b)))); });
const int = (v) => (v === "" || v == null || isNaN(Number(v)) ? null : Math.max(0, Math.round(Number(v))));
const oops = (msg) => page("Error · Taplog", `<section class="panel glass" style="max-width:520px;margin:16vh auto 0"><p style="margin:0 0 14px">${msg}</p><a class="btn-ghost glass" style="display:inline-flex;align-items:center;text-decoration:none" href="${P("/admin")}">Volver al tablero</a></section>`);
const COOKIE = (v, age) => `t=${v}; Path=${BASE || "/"}; Max-Age=${age}; HttpOnly; Secure; SameSite=Strict`;

createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  let path = url.pathname.replace(/\/+$/, "") || "/";
  if (BASE && (path === BASE || path.startsWith(BASE + "/"))) path = path.slice(BASE.length) || "/";
  const host = req.headers["x-forwarded-host"] ?? req.headers.host ?? "jotapol.com";
  try {
    if (path === "/") return redirect(res, HOME);
    if (path === "/health") return send(res, 200, "ok", { "content-type": "text/plain" });
    if (path === "/demo") return send(res, 200, dashboard(demoData(), { base: BASE, host, demo: true }), { "cache-control": "public, max-age=300" });

    if (path === "/admin/login" && req.method === "POST") {
      const f = await form(req);
      if (TOKEN.length < 12) return send(res, 500, login(BASE, "Falta ADMIN_TOKEN (12 caracteres o más) en el servidor."));
      if (!same(f.token ?? "", TOKEN)) return send(res, 401, login(BASE, "Clave incorrecta."));
      res.setHeader("set-cookie", COOKIE(encodeURIComponent(TOKEN), 2592000));
      return redirect(res, P("/admin"), 303);
    }
    if (path.startsWith("/admin")) {
      if (!authed(req)) return send(res, 401, login(BASE));
      if (path === "/admin" && req.method === "GET") return send(res, 200, dashboard(realData(), { base: BASE, host }), { "cache-control": "no-store" });
      if (req.method !== "POST") return send(res, 405, notFound(HOME));
      const f = await form(req);
      if (path === "/admin/logout") { res.setHeader("set-cookie", COOKIE("", 0)); return redirect(res, P("/admin"), 303); }
      if (path === "/admin/links") {
        const code = (f.code ?? "").trim().toLowerCase();
        if (!validCode(code) || RESERVED.has(code)) return send(res, 400, oops(`El código "${esc(code)}" no sirve: usá minúsculas, números y guiones (por ejemplo 09 o reel-tradelearn). "admin", "demo" y "health" están reservados.`));
        if (!validTarget(f.target)) return send(res, 400, oops("El destino tiene que empezar con https:// o http://."));
        q.upsertLink.run(code, f.target.trim(), (f.label ?? "").trim().slice(0, 120) || null);
        return redirect(res, P("/admin"), 303);
      }
      if (path === "/admin/ig") {
        const code = (f.code ?? "").trim().toLowerCase();
        if (!q.link.get(code)) return send(res, 400, oops(`No hay un link con el código "${esc(code)}". Crealo primero.`));
        q.upsertIg.run(code, int(f.reach), int(f.saves), int(f.shares), int(f.likes), int(f.comments));
        return redirect(res, P("/admin"), 303);
      }
      return send(res, 404, notFound(HOME));
    }

    // Link corto: cuenta el clic (si no es un bot ni una previsualización) y redirige.
    const code = path.slice(1).toLowerCase();
    const link = validCode(code) ? q.link.get(code) : null;
    if (!link) return send(res, 404, notFound(HOME));
    const ua = req.headers["user-agent"] ?? "";
    if (!isBot(ua)) { const now = new Date(); q.click.run(code, today(now), now.getUTCHours(), source(ua, req.headers.referer), device(ua)); }
    return redirect(res, link.target);
  } catch (e) {
    console.error(e);
    return send(res, 500, page("Error · Taplog", "<p>Algo falló en el servidor. Probá de nuevo en un momento.</p>"));
  }
}).listen(PORT, () => console.log(`taplog escuchando en :${PORT}`));
