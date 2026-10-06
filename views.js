// Vista del tablero de Taplog. Recibe datos ya calculados (de la base o de la demo) y devuelve HTML.
// Sin dependencias: SVG a mano para las gráficas, tokens de color con modo claro y oscuro.

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const fmt = (n) => (n == null ? "–" : Number(n).toLocaleString("es"));
const pct = (a, b) => (b ? `${((a / b) * 100).toFixed(1)} %` : "–");
const dayLabel = (d) => new Date(d + "T12:00:00Z").toLocaleDateString("es", { day: "numeric", month: "short", timeZone: "UTC" });

// Orden fijo de colores por origen (validado contra el fondo en claro y oscuro); el resto va en gris.
const SOURCE_SLOT = { instagram: 1, tiktok: 2, linkedin: 3, x: 4, directo: 5 };
const srcVar = (s) => (SOURCE_SLOT[s] ? `var(--s${SOURCE_SLOT[s]})` : "var(--s-other)");

const STYLE = `
:root{--bg:#F7F6FB;--card:#FFFFFF;--fg:#0E0B2A;--muted:#5B5875;--faint:#8A87A3;--line:#E7E5F2;--soft:#F1F0F9;--accent:#3B2FD6;--accent-soft:rgba(59,47,214,.10);--good:#0F9D6B;--bad:#D6364A;
--s1:#3B2FD6;--s2:#0E9F92;--s3:#E0731F;--s4:#C2458F;--s5:#A87F00;--s-other:#8A87A3;color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#0B0920;--card:#13112E;--fg:#E9E7F7;--muted:#A7A3C4;--faint:#7C78A0;--line:#26244A;--soft:#1B1940;--accent:#7B72FF;--accent-soft:rgba(123,114,255,.16);--good:#2BC48A;--bad:#F0566E;
--s1:#7B72FF;--s2:#1FA394;--s3:#DB7429;--s4:#CC5596;--s5:#A9830F;--s-other:#6E6A92;color-scheme:dark}}
*{box-sizing:border-box}html,body{margin:0}body{background:var(--bg);color:var(--fg);font:15px/1.5 "Geist","Bricolage Grotesque",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.wrap{max-width:1180px;margin:0 auto;padding-inline:20px;padding-block:0 72px}
.top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-block:18px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:10px;font-family:"Bricolage Grotesque",system-ui,sans-serif;font-weight:800;font-size:22px;letter-spacing:-.03em;color:var(--fg);text-decoration:none}
.brand svg{width:30px;height:30px}
.pill{font:600 12px/1 "Geist",system-ui,sans-serif;padding:6px 10px;border-radius:999px;background:var(--accent-soft);color:var(--accent)}
.ghost{font:600 14px/1 "Geist",system-ui,sans-serif;color:var(--muted);background:transparent;border:1px solid var(--line);border-radius:10px;min-height:40px;padding:0 14px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}
.ghost:hover{color:var(--fg);border-color:var(--faint)}
.banner{background:var(--accent);color:#fff;border-radius:14px;padding:12px 16px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center;font-weight:500}
.banner a{color:#fff;font-weight:700}
h1{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-size:clamp(30px,4vw,44px);letter-spacing:-.035em;line-height:1.05;margin:26px 0 6px;text-wrap:balance}
.sub{color:var(--muted);margin:0 0 22px}
.grid{display:grid;gap:16px}
.kpis{grid-template-columns:repeat(4,minmax(0,1fr))}
@media (max-width:860px){.kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
.card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:18px 20px;min-width:0}
.kpi .k{font-size:13px;color:var(--muted)}.kpi .v{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-size:34px;font-weight:800;letter-spacing:-.03em;font-variant-numeric:tabular-nums;line-height:1.15}
.delta{font-size:13px;font-weight:600}.delta.up{color:var(--good)}.delta.down{color:var(--bad)}.delta.flat{color:var(--faint)}
.two{grid-template-columns:minmax(0,2fr) minmax(0,1fr)}@media (max-width:960px){.two{grid-template-columns:minmax(0,1fr)}}
h2{font-size:16px;margin:0 0 14px;letter-spacing:-.01em;display:flex;justify-content:space-between;align-items:baseline;gap:8px}
h2 small{font-weight:500;color:var(--faint);font-size:13px}
.chart svg{width:100%;height:auto;display:block}.chart text{font:11px "Geist",system-ui,sans-serif;fill:var(--faint)}
@media (max-width:600px){.chart text{font-size:22px}}
.chart .hit:hover+.tip,.chart .hit:focus+.tip{opacity:1}.tip{opacity:0;pointer-events:none;transition:opacity .12s}
.tip rect{fill:var(--fg)}.tip text{fill:var(--bg);font-weight:600}
.list{display:grid;gap:10px}.li{display:grid;grid-template-columns:12px minmax(0,1fr) auto;gap:10px;align-items:center;font-size:14px}
.dot{width:10px;height:10px;border-radius:3px}.li .n{font-variant-numeric:tabular-nums;color:var(--muted)}
.stack{display:flex;height:10px;border-radius:99px;overflow:hidden;background:var(--soft);gap:2px}
.tbl{overflow-x:auto}table{border-collapse:collapse;width:100%;min-width:780px}
th,td{text-align:left;padding:12px 10px;border-bottom:1px solid var(--line);vertical-align:middle}tr:last-child td{border-bottom:0}
th{white-space:nowrap;font-size:12px;font-weight:600;color:var(--faint);text-transform:uppercase;letter-spacing:.05em}td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
.post b{display:block;font-weight:600}.post span{font-size:12px;color:var(--faint);font-family:"Geist Mono",ui-monospace,monospace}
.code{font-family:"Geist Mono",ui-monospace,monospace;font-size:13px;color:var(--accent);text-decoration:none}
.empty{padding:28px;text-align:center;color:var(--muted)}
details.card summary{cursor:pointer;font-weight:600;list-style:none;display:flex;justify-content:space-between;align-items:center;min-height:28px}
details.card summary::after{content:"+";font-size:20px;color:var(--faint)}details[open].card summary::after{content:"–"}
form.row{display:flex;flex-wrap:wrap;gap:12px;align-items:end;margin-top:14px}label{display:grid;gap:5px;font-size:13px;color:var(--muted)}
input{font:inherit;color:var(--fg);background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:8px 11px;min-height:42px;min-width:0}
input:focus,button:focus-visible,a:focus-visible,summary:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.btn{font:600 14px "Geist",system-ui,sans-serif;min-height:42px;padding:0 18px;border-radius:10px;border:0;background:var(--accent);color:#fff;cursor:pointer}
.btn[disabled]{opacity:.5;cursor:not-allowed}
`;

const MARK = `<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--accent)"/><path d="M11 8v11a5 5 0 0 0 10 0v-3" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="21" cy="12" r="2.6" fill="#5EEAD4"/></svg>`;

export const page = (title, body) => `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${esc(title)}</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@500&display=swap"><style>${STYLE}</style></head><body><div class="wrap">${body}</div></body></html>`;

function delta(now, prev) {
  if (!prev && !now) return `<span class="delta flat">sin cambios</span>`;
  if (!prev) return `<span class="delta up">nuevo esta semana</span>`;
  const d = Math.round(((now - prev) / prev) * 100);
  return `<span class="delta ${d > 0 ? "up" : d < 0 ? "down" : "flat"}">${d > 0 ? "+" : ""}${d} % vs. semana anterior</span>`;
}

/** Área de clics por día con eje, grilla suave, punto final y tooltip por día. */
function areaChart(days, values) {
  const W = 720, H = 240, L = 34, R = 12, T = 16, B = 28, n = days.length;
  const max = Math.max(4, ...values), nice = Math.ceil(max / 4) * 4;
  const x = (i) => L + (i * (W - L - R)) / (n - 1), y = (v) => T + (H - T - B) * (1 - v / nice);
  const line = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const grid = [0, .5, 1].map((f) => { const v = Math.round(nice * f); return `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`; }).join("");
  const ticks = days.map((d, i) => ((i % 7 === 0 && n - 1 - i >= 4) || i === n - 1 ? `<text x="${x(i)}" y="${H - 8}" text-anchor="${i === n - 1 ? "end" : "middle"}">${dayLabel(d)}</text>` : "")).join("");
  const last = values[n - 1];
  const hits = days.map((d, i) => {
    const tx = Math.min(Math.max(x(i) - 54, 0), W - 108);
    return `<rect class="hit" x="${x(i) - (W - L - R) / (2 * (n - 1))}" y="${T}" width="${(W - L - R) / (n - 1)}" height="${H - T - B}" fill="transparent" tabindex="0" aria-label="${dayLabel(d)}: ${values[i]} clics"/>
      <g class="tip"><line x1="${x(i)}" x2="${x(i)}" y1="${T}" y2="${H - B}" stroke="var(--faint)" stroke-dasharray="3 3"/><rect x="${tx}" y="0" width="108" height="24" rx="6"/><text x="${tx + 54}" y="16" text-anchor="middle">${dayLabel(d)} · ${values[i]}</text></g>`;
  }).join("");
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Clics por día, últimos ${n} días">
    <defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".22"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
    ${grid}${ticks}
    <polygon points="${L},${y(0)} ${line} ${x(n - 1)},${y(0)}" fill="url(#fill)"/>
    <polyline points="${line}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${x(n - 1)}" cy="${y(last)}" r="5" fill="var(--accent)" stroke="var(--card)" stroke-width="2"/>
    ${hits}</svg>`;
}

function spark(values) {
  const w = 110, h = 30, max = Math.max(1, ...values), step = w / (values.length - 1);
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(h - 3 - (v / max) * (h - 6)).toFixed(1)}`).join(" ");
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}

const stack = (sources, total) => `<div class="stack" role="img" aria-label="${esc(sources.map((s) => `${s.source} ${s.n}`).join(", "))}">${sources.map((s) => `<span style="width:${(s.n / total) * 100}%;background:${srcVar(s.source)}"></span>`).join("")}</div>`;

/** El tablero completo. `d` trae los números; `opts.demo` lo deja de solo lectura con aviso. */
export function dashboard(d, { base = "", host = "", demo = false } = {}) {
  const P = (p) => base + p;
  const totalSrc = d.sources.reduce((s, x) => s + x.n, 0) || 1;
  const totalDev = d.devices.reduce((s, x) => s + x.n, 0) || 1;
  const off = demo ? " disabled" : "";
  const rows = d.rows.length
    ? `<div class="tbl"><table><thead><tr><th>Post</th><th>Link</th><th class="n">Clics</th><th>14 días</th><th>De dónde</th><th class="n">Alcance</th><th class="n">Guardados</th><th class="n">Compartidos</th><th class="n">Clic/alc.</th></tr></thead><tbody>
      ${d.rows.map((r) => `<tr>
        <td class="post"><b>${esc(r.label || r.code)}</b><span>${esc(r.targetShort)}</span></td>
        <td><a class="code" href="${P("/" + esc(r.code))}" target="_blank" rel="noreferrer" title="${esc(host)}${esc(base)}/${esc(r.code)}">${esc(base)}/${esc(r.code)}</a></td>
        <td class="n"><b>${fmt(r.clicks)}</b></td>
        <td>${spark(r.daily14)}</td>
        <td style="min-width:140px">${r.clicks ? stack(r.sources, r.clicks) : '<span style="color:var(--faint)">sin clics</span>'}</td>
        <td class="n">${fmt(r.reach)}</td><td class="n">${fmt(r.saves)}</td><td class="n">${fmt(r.shares)}</td>
        <td class="n">${r.reach ? pct(r.clicks, r.reach) : "–"}</td></tr>`).join("")}
      </tbody></table></div>`
    : `<div class="empty">Todavía no hay links. Creá el primero, por ejemplo <span class="code">09</span> para el post 09.</div>`;

  return page(demo ? "Taplog · demo" : "Taplog", `
  <header class="top">
    <a class="brand" href="${P(demo ? "/demo" : "/admin")}">${MARK}Taplog</a>
    <div style="display:flex;gap:10px;align-items:center">${demo ? '<span class="pill">Demo · datos de ejemplo</span>' : `<span class="pill">${esc(host)}${esc(base)}</span><form method="post" action="${P("/admin/logout")}"><button class="ghost" type="submit">Salir</button></form>`}</div>
  </header>
  ${demo ? `<div class="banner"><span>Esta es una demo con datos inventados. Taplog cuenta los clics de cada link corto sin guardar datos de nadie.</span><a href="https://jotapol.com" target="_blank" rel="noreferrer">Hecho por jotapol</a></div>` : ""}
  <h1>¿Qué post trae gente?</h1>
  <p class="sub">Clics de tus links cortos y las métricas de Instagram de cada post, en un solo lugar.</p>

  <section class="grid kpis">
    <div class="card kpi"><div class="k">Clics, últimos 7 días</div><div class="v">${fmt(d.week)}</div>${delta(d.week, d.prevWeek)}</div>
    <div class="card kpi"><div class="k">Clics totales</div><div class="v">${fmt(d.total)}</div><span class="delta flat">${d.rows.length} ${d.rows.length === 1 ? "link" : "links"}</span></div>
    <div class="card kpi"><div class="k">Alcance anotado</div><div class="v">${d.reach ? fmt(d.reach) : "–"}</div><span class="delta flat">de Instagram</span></div>
    <div class="card kpi"><div class="k">Clic / alcance</div><div class="v">${d.reach ? pct(d.total, d.reach) : "–"}</div><span class="delta flat">cuánto alcance se vuelve visita</span></div>
  </section>

  <section class="grid two" style="margin-top:16px">
    <div class="card chart"><h2>Clics por día <small>últimos 30 días</small></h2>${areaChart(d.days30, d.daily30)}</div>
    <div class="card"><h2>De dónde vienen <small>${fmt(totalSrc)} clics</small></h2>
      <div class="list">${d.sources.length ? d.sources.map((s) => `<div class="li"><span class="dot" style="background:${srcVar(s.source)}"></span><span>${esc(s.source)}</span><span class="n">${fmt(s.n)} · ${Math.round((s.n / totalSrc) * 100)} %</span></div>`).join("") : '<p class="sub">Sin clics todavía.</p>'}</div>
      <h2 style="margin-top:22px">Dispositivo</h2>
      <div class="list">${d.devices.map((s, i) => `<div class="li"><span class="dot" style="background:var(--s${i === 0 ? 1 : 2})"></span><span>${esc(s.device)}</span><span class="n">${Math.round((s.n / totalDev) * 100)} %</span></div>`).join("") || '<p class="sub">Sin datos.</p>'}</div>
    </div>
  </section>

  <section class="card" style="margin-top:16px"><h2>Por post <small>clic / alcance = visitas por cada 100 personas que vieron el post</small></h2>${rows}</section>

  <section class="grid two" style="margin-top:16px;align-items:start">
    <details class="card"${demo ? "" : " open"}><summary>Nuevo link o cambiar uno</summary>
      <form class="row" method="post" action="${P("/admin/links")}">
        <label>Código<input name="code" required pattern="[a-z0-9][a-z0-9-]{0,39}" placeholder="09" style="width:110px;font-family:'Geist Mono',monospace"${off}></label>
        <label>Post<input name="label" placeholder="09 · Shiplog v0.2.0" style="width:200px"${off}></label>
        <label style="flex:1;min-width:220px">Destino<input name="target" type="url" required placeholder="https://github.com/jotapoldev/shiplog"${off}></label>
        <button class="btn" type="submit"${off}>Guardar link</button>
      </form></details>
    <details class="card"><summary>Métricas de Instagram</summary>
      <form class="row" method="post" action="${P("/admin/ig")}">
        <label>Código<input name="code" required style="width:110px;font-family:'Geist Mono',monospace" list="codes"${off}></label>
        ${["reach:Alcance", "saves:Guardados", "shares:Compartidos", "likes:Me gusta", "comments:Comentarios"].map((f) => { const [n, l] = f.split(":"); return `<label>${l}<input name="${n}" type="number" min="0" inputmode="numeric" style="width:104px"${off}></label>`; }).join("")}
        <button class="btn" type="submit"${off}>Guardar</button>
        <datalist id="codes">${d.rows.map((r) => `<option value="${esc(r.code)}">${esc(r.label ?? "")}</option>`).join("")}</datalist>
      </form></details>
  </section>`);
}

export const login = (base, msg = "") => page("Entrar · Taplog", `<section class="card" style="max-width:400px;margin:14vh auto 0;padding:28px">
  <div class="brand" style="margin-bottom:14px">${MARK}Taplog</div>
  ${msg ? `<p style="color:var(--bad);margin:0 0 12px">${esc(msg)}</p>` : '<p class="sub">Entrá con la clave del tablero.</p>'}
  <form method="post" action="${base}/admin/login" style="display:grid;gap:12px"><label>Clave<input name="token" type="password" required autocomplete="current-password"></label><button class="btn" type="submit">Entrar</button></form>
  <p class="sub" style="margin:16px 0 0;font-size:13px">¿Solo querés ver cómo funciona? <a href="${base}/demo" style="color:var(--accent)">Abrí la demo</a>.</p></section>`);

export const notFound = (home) => page("No existe · Taplog", `<section style="text-align:center;margin-top:22vh"><h1>Este link no existe.</h1><p class="sub">Revisá que esté bien escrito o andá a <a href="${esc(home)}" style="color:var(--accent)">${esc(home.replace(/^https?:\/\//, ""))}</a>.</p></section>`);
