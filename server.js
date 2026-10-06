// go.jotapol.com: links cortos por post y tablero de alcance. Node 24, sin dependencias.
// Guarda solo datos agregados del clic (día, hora, origen, dispositivo); nunca IP ni datos de la persona.
import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { timingSafeEqual } from "node:crypto";
import { device, isBot, source, validCode, validTarget } from "./lib.js";

const PORT = Number(process.env.PORT ?? 3300);
const DATA = process.env.DATA_DIR ?? "./data";
const TOKEN = process.env.ADMIN_TOKEN ?? "";
const HOME = process.env.HOME_URL ?? "https://jotapol.com";
// Prefijo cuando el servicio vive detrás de otra web (jotapol.com/r/09 → BASE_PATH=/r). Vacío si tiene dominio propio.
const BASE = (process.env.BASE_PATH ?? "").replace(/\/+$/, "");
const P = (p) => BASE + p;
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
  delLink: db.prepare("DELETE FROM links WHERE code = ?"),
  upsertIg: db.prepare("INSERT INTO ig (code, reach, saves, shares, likes, comments, updated_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now')) ON CONFLICT(code) DO UPDATE SET reach = excluded.reach, saves = excluded.saves, shares = excluded.shares, likes = excluded.likes, comments = excluded.comments, updated_at = excluded.updated_at"),
  summary: db.prepare(`SELECT l.code, l.target, l.label, l.created_at, COUNT(c.id) AS clicks, i.reach, i.saves, i.shares, i.likes, i.comments
    FROM links l LEFT JOIN clicks c ON c.code = l.code LEFT JOIN ig i ON i.code = l.code GROUP BY l.code ORDER BY l.created_at DESC`),
  daily: db.prepare("SELECT code, day, COUNT(*) AS n FROM clicks WHERE day >= ? GROUP BY code, day"),
  bySource: db.prepare("SELECT code, source, COUNT(*) AS n FROM clicks GROUP BY code, source ORDER BY n DESC"),
  sources: db.prepare("SELECT source, COUNT(*) AS n FROM clicks GROUP BY source ORDER BY n DESC"),
  devices: db.prepare("SELECT device, COUNT(*) AS n FROM clicks GROUP BY device ORDER BY n DESC"),
};

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const today = (d = new Date()) => d.toISOString().slice(0, 10);
const send = (res, status, body, headers = {}) => { res.writeHead(status, { "content-type": "text/html; charset=utf-8", "x-frame-options": "DENY", "referrer-policy": "no-referrer", ...headers }); res.end(body); };
const redirect = (res, to, status = 302) => { res.writeHead(status, { location: to, "cache-control": "no-store" }); res.end(); };
const cookie = (req, name) => (req.headers.cookie ?? "").split(/;\s*/).find((c) => c.startsWith(name + "="))?.slice(name.length + 1);
const authed = (req) => {
  const t = Buffer.from(decodeURIComponent(cookie(req, "t") ?? "")), k = Buffer.from(TOKEN);
  return TOKEN.length >= 12 && t.length === k.length && timingSafeEqual(t, k);
};
const form = (req) => new Promise((ok) => { let b = ""; req.on("data", (d) => { b += d; if (b.length > 1e4) req.destroy(); }); req.on("end", () => ok(Object.fromEntries(new URLSearchParams(b)))); });
const int = (v) => (v === "" || v == null || isNaN(Number(v)) ? null : Math.max(0, Math.round(Number(v))));

// ---------- vistas ----------
const STYLE = `
:root{--bg:#F7F6FB;--card:#FFFFFF;--fg:#0E0B2A;--muted:#5B5875;--line:#E2E0EE;--accent:#3B2FD6;--menta:#0E9F92;--soft:#F1F0F9}
@media (prefers-color-scheme:dark){:root{--bg:#0E0B2A;--card:#13112E;--fg:#E9E7F7;--muted:#A7A3C4;--line:#26244A;--accent:#7B72FF;--menta:#5EEAD4;--soft:#1B1940;color-scheme:dark}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 "Bricolage Grotesque",system-ui,sans-serif}
main{max-width:1100px;margin:0 auto;padding:32px 16px 64px;display:grid;gap:28px}
h1{margin:0;font-size:32px;letter-spacing:-.03em}h2{margin:0 0 12px;font-size:19px;letter-spacing:-.01em}
.mono{font-family:"JetBrains Mono",ui-monospace,monospace}.muted{color:var(--muted)}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}
.kpi b{display:block;font-size:30px;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.wrap{overflow-x:auto}table{border-collapse:collapse;width:100%;min-width:760px}th,td{text-align:left;padding:10px 8px;border-bottom:1px solid var(--line);vertical-align:middle}
th{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);font-weight:600}td.n{text-align:right;font-variant-numeric:tabular-nums}
.chip{display:inline-block;padding:2px 8px;border-radius:999px;background:var(--soft);font-size:12px;margin:0 4px 4px 0}
form.row{display:flex;flex-wrap:wrap;gap:10px;align-items:end}label{display:grid;gap:4px;font-size:13px;color:var(--muted)}
input{font:inherit;color:var(--fg);background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:8px 10px;min-height:40px;min-width:0}
button{font:inherit;font-weight:600;min-height:40px;padding:0 16px;border-radius:10px;border:0;background:var(--accent);color:#fff;cursor:pointer}
button.ghost{background:transparent;color:var(--muted);border:1px solid var(--line)}
a{color:var(--accent)}.bar{height:8px;border-radius:99px;background:var(--soft);overflow:hidden}.bar i{display:block;height:100%;background:var(--accent)}
`;
const page = (title, body) => `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${esc(title)}</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@500;700&family=JetBrains+Mono:wght@500&display=swap"><style>${STYLE}</style></head><body><main>${body}</main></body></html>`;

function spark(days, counts) {
  const max = Math.max(1, ...counts), w = 112, h = 28, step = w / (days.length - 1);
  const pts = counts.map((n, i) => `${(i * step).toFixed(1)},${(h - 2 - (n / max) * (h - 4)).toFixed(1)}`).join(" ");
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Clics de los últimos ${days.length} días"><polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/></svg>`;
}

function dashboard(host) {
  const days = Array.from({ length: 14 }, (_, i) => today(new Date(Date.now() - (13 - i) * 864e5)));
  const daily = new Map();
  for (const r of q.daily.all(days[0])) daily.set(`${r.code}|${r.day}`, r.n);
  const srcByCode = new Map();
  for (const r of q.bySource.all()) srcByCode.set(r.code, [...(srcByCode.get(r.code) ?? []), r]);
  const rows = q.summary.all();
  const total = rows.reduce((s, r) => s + r.clicks, 0);
  const reach = rows.reduce((s, r) => s + (r.reach ?? 0), 0);
  const week = days.slice(7).reduce((s, d) => s + rows.reduce((t, r) => t + (daily.get(`${r.code}|${d}`) ?? 0), 0), 0);
  const sources = q.sources.all(), devices = q.devices.all();
  const pct = (n, of) => (of ? Math.round((n / of) * 100) : 0);

  const table = rows.length ? `<div class="wrap"><table>
    <thead><tr><th>Post</th><th>Link</th><th class="n">Clics</th><th>14 días</th><th>De dónde</th><th class="n">Alcance</th><th class="n">Guard.</th><th class="n">Comp.</th><th class="n">Clic / alcance</th></tr></thead><tbody>
    ${rows.map((r) => `<tr>
      <td><b>${esc(r.label || r.code)}</b><div class="muted mono" style="font-size:12px">${esc(new URL(r.target).hostname + new URL(r.target).pathname)}</div></td>
      <td class="mono"><a href="${P("/" + esc(r.code))}" target="_blank" rel="noreferrer">${esc(host)}${BASE}/${esc(r.code)}</a></td>
      <td class="n"><b>${r.clicks}</b></td>
      <td>${spark(days, days.map((d) => daily.get(`${r.code}|${d}`) ?? 0))}</td>
      <td>${(srcByCode.get(r.code) ?? []).slice(0, 3).map((s) => `<span class="chip">${esc(s.source)} ${s.n}</span>`).join("") || '<span class="muted">sin clics</span>'}</td>
      <td class="n">${r.reach ?? "–"}</td><td class="n">${r.saves ?? "–"}</td><td class="n">${r.shares ?? "–"}</td>
      <td class="n">${r.reach ? (r.clicks / r.reach * 100).toFixed(1) + " %" : "–"}</td>
    </tr>`).join("")}</tbody></table></div>` : `<p class="muted">Todavía no hay links. Creá el primero abajo, por ejemplo <span class="mono">09</span> para el post 09.</p>`;

  const breakdown = (title, list, key) => `<div class="card"><h2>${title}</h2>${list.length ? list.map((r) => `<div style="display:grid;grid-template-columns:120px 1fr 48px;gap:10px;align-items:center;margin:6px 0"><span>${esc(r[key])}</span><span class="bar"><i style="width:${pct(r.n, total)}%"></i></span><span class="mono" style="text-align:right">${r.n}</span></div>`).join("") : '<p class="muted">Sin datos todavía.</p>'}</div>`;

  return page("Alcance · jotapol", `
  <header style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap">
    <div><div class="mono muted">${esc(host)}${BASE}</div><h1>Alcance</h1></div>
    <form method="post" action="${P("/admin/logout")}"><button class="ghost" type="submit">Salir</button></form>
  </header>
  <section class="kpis">
    <div class="card kpi"><span class="muted">Clics totales</span><b>${total}</b></div>
    <div class="card kpi"><span class="muted">Clics últimos 7 días</span><b>${week}</b></div>
    <div class="card kpi"><span class="muted">Alcance anotado</span><b>${reach || "–"}</b></div>
    <div class="card kpi"><span class="muted">Clic / alcance</span><b>${reach ? (total / reach * 100).toFixed(1) + " %" : "–"}</b></div>
  </section>
  <section class="card"><h2>Por post</h2>${table}</section>
  <section class="kpis" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr))">${breakdown("De dónde vienen", sources, "source")}${breakdown("Dispositivo", devices, "device")}</section>
  <section class="card"><h2>Nuevo link o cambiar uno</h2>
    <form class="row" method="post" action="${P("/admin/links")}">
      <label>Código<input name="code" required pattern="[a-z0-9][a-z0-9-]{0,39}" placeholder="09" class="mono" style="width:120px"></label>
      <label>Post<input name="label" placeholder="09 · Shiplog v0.2.0" style="width:220px"></label>
      <label style="flex:1;min-width:220px">Destino<input name="target" type="url" required placeholder="https://github.com/jotapoldev/shiplog"></label>
      <button type="submit">Guardar link</button>
    </form>
  </section>
  <section class="card"><h2>Métricas de Instagram del post</h2>
    <p class="muted" style="margin:0 0 12px">Copialas de "Ver estadísticas" en Instagram. Se guardan por código de link.</p>
    <form class="row" method="post" action="${P("/admin/ig")}">
      <label>Código<input name="code" required class="mono" style="width:120px" list="codes"></label>
      ${["reach:Alcance", "saves:Guardados", "shares:Compartidos", "likes:Me gusta", "comments:Comentarios"].map((f) => { const [n, l] = f.split(":"); return `<label>${l}<input name="${n}" type="number" min="0" inputmode="numeric" style="width:110px"></label>`; }).join("")}
      <button type="submit">Guardar métricas</button>
      <datalist id="codes">${rows.map((r) => `<option value="${esc(r.code)}">${esc(r.label ?? "")}</option>`).join("")}</datalist>
    </form>
  </section>`);
}

const login = (msg = "") => page("Entrar · alcance", `<section class="card" style="max-width:380px;margin:12vh auto 0"><h1 style="font-size:24px">Alcance</h1>
  ${msg ? `<p style="color:#D6364A">${esc(msg)}</p>` : '<p class="muted">Entrá con la clave del tablero (variable ADMIN_TOKEN).</p>'}
  <form method="post" action="${P("/admin/login")}" style="display:grid;gap:12px"><label>Clave<input name="token" type="password" required autocomplete="current-password"></label><button type="submit">Entrar</button></form></section>`);

const notFound = () => page("No existe · jotapol", `<section style="text-align:center;margin-top:20vh"><h1>Este link no existe.</h1><p class="muted">Revisá que esté bien escrito o andá a <a href="${esc(HOME)}">${esc(HOME.replace(/^https?:\/\//, ""))}</a>.</p></section>`);

// ---------- rutas ----------
createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  let path = url.pathname.replace(/\/+$/, "") || "/";
  if (BASE && (path === BASE || path.startsWith(BASE + "/"))) path = path.slice(BASE.length) || "/";
  const host = req.headers["x-forwarded-host"] ?? req.headers.host ?? "go.jotapol.com";
  try {
    if (path === "/") return redirect(res, HOME);
    if (path === "/health") return send(res, 200, "ok", { "content-type": "text/plain" });

    if (path === "/admin/login" && req.method === "POST") {
      const f = await form(req);
      if (TOKEN.length < 12) return send(res, 500, login("Falta ADMIN_TOKEN (12 caracteres o más) en el servidor."));
      const t = Buffer.from(f.token ?? ""), k = Buffer.from(TOKEN);
      if (t.length !== k.length || !timingSafeEqual(t, k)) return send(res, 401, login("Clave incorrecta."));
      res.setHeader("set-cookie", `t=${encodeURIComponent(TOKEN)}; Path=${BASE || "/"}; Max-Age=2592000; HttpOnly; Secure; SameSite=Strict`);
      return redirect(res, P("/admin"), 303);
    }
    if (path.startsWith("/admin")) {
      if (!authed(req)) return send(res, 401, login());
      if (path === "/admin" && req.method === "GET") return send(res, 200, dashboard(host), { "cache-control": "no-store" });
      if (req.method !== "POST") return send(res, 405, notFound());
      const f = await form(req);
      if (path === "/admin/logout") { res.setHeader("set-cookie", `t=; Path=${BASE || "/"}; Max-Age=0; HttpOnly; Secure; SameSite=Strict`); return redirect(res, P("/admin"), 303); }
      if (path === "/admin/links") {
        const code = (f.code ?? "").trim().toLowerCase();
        if (!validCode(code) || code === "admin" || code === "health") return send(res, 400, page("Error", `<p>El código "${esc(code)}" no sirve: usá minúsculas, números y guiones (por ejemplo 09 o reel-tradelearn). <a href="${P("/admin")}">Volver</a></p>`));
        if (!validTarget(f.target)) return send(res, 400, page("Error", `<p>El destino tiene que empezar con https:// o http://. <a href="${P("/admin")}">Volver</a></p>`));
        q.upsertLink.run(code, f.target.trim(), (f.label ?? "").trim().slice(0, 120) || null);
        return redirect(res, P("/admin"), 303);
      }
      if (path === "/admin/ig") {
        const code = (f.code ?? "").trim().toLowerCase();
        if (!q.link.get(code)) return send(res, 400, page("Error", `<p>No hay un link con el código "${esc(code)}". Crealo primero. <a href="${P("/admin")}">Volver</a></p>`));
        q.upsertIg.run(code, int(f.reach), int(f.saves), int(f.shares), int(f.likes), int(f.comments));
        return redirect(res, P("/admin"), 303);
      }
      return send(res, 404, notFound());
    }

    // Link corto: cuenta el clic (si no es un bot ni una previsualización) y redirige.
    const code = path.slice(1).toLowerCase();
    const link = validCode(code) ? q.link.get(code) : null;
    if (!link) return send(res, 404, notFound());
    const ua = req.headers["user-agent"] ?? "";
    if (!isBot(ua)) { const now = new Date(); q.click.run(code, today(now), now.getUTCHours(), source(ua, req.headers.referer), device(ua)); }
    return redirect(res, link.target);
  } catch (e) {
    console.error(e);
    return send(res, 500, page("Error", "<p>Algo falló en el servidor. Probá de nuevo en un momento.</p>"));
  }
}).listen(PORT, () => console.log(`go escuchando en :${PORT}`));
