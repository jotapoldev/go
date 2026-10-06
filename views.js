// Vista del tablero de Taplog. Recibe datos ya calculados (de la base o de la demo) y devuelve HTML.
// Estética: "agua de noche" (resplandores que se mueven apenas) y paneles de vidrio esmerilado.
// Lo memorable es un solo panel: la pregunta, el número de la semana y el hilo de luz de los clics.

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const fmt = (n) => (n == null ? "–" : Number(n).toLocaleString("es"));
const pct = (a, b) => (b ? `${((a / b) * 100).toFixed(1)} %` : "–");
const dayLabel = (d) => new Date(d + "T12:00:00Z").toLocaleDateString("es", { day: "numeric", month: "short", timeZone: "UTC" });

// Color fijo por red (validado en claro y oscuro); el resto va en gris.
const SOURCE_SLOT = { instagram: 1, tiktok: 2, linkedin: 3, x: 4, directo: 5 };
const srcVar = (s) => (SOURCE_SLOT[s] ? `var(--s${SOURCE_SLOT[s]})` : "var(--s-other)");
const SOURCE_NAME = { instagram: "Instagram", tiktok: "TikTok", linkedin: "LinkedIn", x: "X", directo: "Directo", facebook: "Facebook", whatsapp: "WhatsApp", github: "GitHub" };
const srcName = (s) => SOURCE_NAME[s] ?? s;

const STYLE = `
:root{
  --ink:#191541;--muted:#5B5875;--faint:#8A87A3;
  --base:#E9EAFF;--blob1:rgba(59,47,214,.30);--blob2:rgba(94,234,212,.45);--blob3:rgba(194,69,143,.16);
  --glass:rgba(255,255,255,.52);--glass-strong:rgba(255,255,255,.72);--edge:rgba(255,255,255,.85);--edge-soft:rgba(25,21,65,.08);
  --shadow:0 20px 50px -24px rgba(59,47,214,.45);
  --accent:#3B2FD6;--line:#3B2FD6;--line2:#0E9F92;--good:#0F9D6B;--bad:#D6364A;--track:rgba(25,21,65,.08);
  --s1:#3B2FD6;--s2:#0E9F92;--s3:#E0731F;--s4:#C2458F;--s5:#A87F00;--s-other:#8A87A3;color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){
  --ink:#F1EFFF;--muted:#B3AFD3;--faint:#8984B0;
  --base:#07051C;--blob1:rgba(59,47,214,.55);--blob2:rgba(94,234,212,.20);--blob3:rgba(194,69,143,.18);
  --glass:rgba(255,255,255,.055);--glass-strong:rgba(255,255,255,.09);--edge:rgba(255,255,255,.16);--edge-soft:rgba(255,255,255,.07);
  --shadow:0 30px 70px -30px rgba(0,0,0,.8);
  --accent:#9A93FF;--line:#5EEAD4;--line2:#7B72FF;--good:#2BC48A;--bad:#F0566E;--track:rgba(255,255,255,.08);
  --s1:#7B72FF;--s2:#1FA394;--s3:#DB7429;--s4:#CC5596;--s5:#A9830F;--s-other:#6E6A92;color-scheme:dark}}
*{box-sizing:border-box}html,body{margin:0;min-height:100%}
body{background:var(--base);color:var(--ink);font:15px/1.55 "Geist",system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}
.sea{position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none}
.sea i{position:absolute;border-radius:50%;filter:blur(70px);will-change:transform}
.sea i:nth-child(1){width:62vmax;height:62vmax;left:-18vmax;top:-26vmax;background:var(--blob1);animation:drift 26s ease-in-out infinite alternate}
.sea i:nth-child(2){width:48vmax;height:48vmax;right:-14vmax;top:30vh;background:var(--blob2);animation:drift 32s ease-in-out infinite alternate-reverse}
.sea i:nth-child(3){width:40vmax;height:40vmax;left:20vw;bottom:-22vmax;background:var(--blob3);animation:drift 38s ease-in-out infinite alternate}
@keyframes drift{to{transform:translate(4vmax,3vmax) scale(1.06)}}
@media (prefers-reduced-motion:reduce){.sea i{animation:none}}
.glass{background:var(--glass);border:1px solid var(--edge-soft);box-shadow:inset 0 1px 0 var(--edge),var(--shadow);backdrop-filter:blur(22px) saturate(1.4);-webkit-backdrop-filter:blur(22px) saturate(1.4)}
.wrap{max-width:1160px;margin:0 auto;padding-inline:20px;padding-block:0 80px;display:grid;gap:20px}
.top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-block:22px 6px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:10px;font-family:"Bricolage Grotesque",system-ui,sans-serif;font-weight:800;font-size:23px;letter-spacing:-.035em;color:var(--ink);text-decoration:none}
.brand svg{width:32px;height:32px;filter:drop-shadow(0 6px 14px rgba(59,47,214,.45))}
.chip{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:500;padding:8px 14px;border-radius:999px;color:var(--muted)}
.chip b{width:7px;height:7px;border-radius:50%;background:var(--line);box-shadow:0 0 10px var(--line)}
.btn-ghost{font:500 14px "Geist",system-ui,sans-serif;color:var(--muted);border-radius:999px;min-height:40px;padding:0 16px;cursor:pointer}
.btn-ghost:hover{color:var(--ink)}

.hero{border-radius:32px;padding:30px 30px 18px;display:grid;gap:8px;position:relative;overflow:hidden}
.hero-head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap}
h1{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-weight:700;font-size:clamp(30px,4.2vw,48px);letter-spacing:-.04em;line-height:1;margin:0;max-width:13ch;text-wrap:balance}
.lede{color:var(--muted);margin:10px 0 0;max-width:42ch}
.big{text-align:right}
.big .n{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-weight:800;font-size:clamp(64px,9vw,112px);letter-spacing:-.06em;line-height:.9;font-variant-numeric:tabular-nums}
.big .u{color:var(--muted);font-size:15px}
.delta{font-weight:600;font-size:14px}.delta.up{color:var(--good)}.delta.down{color:var(--bad)}.delta.flat{color:var(--faint)}
.chart svg{width:100%;height:auto;display:block;overflow:visible}.chart text{font:11px "Geist",system-ui,sans-serif;fill:var(--faint)}
@media (max-width:640px){.chart text{font-size:22px}.big{text-align:left}}
.hit:hover+.tip,.hit:focus+.tip{opacity:1}.tip{opacity:0;pointer-events:none;transition:opacity .15s}
.tip rect{fill:var(--ink)}.tip text{fill:var(--base);font-weight:600}
.facts{display:flex;flex-wrap:wrap;gap:8px 28px;padding-top:14px;border-top:1px solid var(--edge-soft);color:var(--muted);font-size:14px}
.facts strong{color:var(--ink);font-family:"Bricolage Grotesque",system-ui,sans-serif;font-size:20px;letter-spacing:-.02em;margin-right:6px;font-variant-numeric:tabular-nums}

.split{display:grid;grid-template-columns:minmax(0,1.75fr) minmax(0,1fr);gap:20px;align-items:start}
@media (max-width:940px){.split{grid-template-columns:minmax(0,1fr)}}
.panel{border-radius:26px;padding:24px}
h2{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-weight:700;font-size:21px;letter-spacing:-.025em;margin:0 0 4px}
.hint{color:var(--faint);font-size:13px;margin:0 0 16px}

.rank{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.post{display:grid;grid-template-columns:28px minmax(0,1.7fr) 110px minmax(70px,.7fr) 64px 104px;gap:14px;align-items:center;padding:12px 14px;border-radius:18px;background:var(--glass-strong);border:1px solid var(--edge-soft)}
.post .pos{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-weight:700;color:var(--faint);font-size:18px;text-align:center}
.post .name b{display:block;font-weight:600;letter-spacing:-.01em}
.post .name{min-width:0}.post .name small{display:block;font-size:12.5px;color:var(--faint);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.post .name a{color:var(--accent);text-decoration:none;font-weight:500}.post .name a:hover{text-decoration:underline}
.post .clicks{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-weight:800;font-size:24px;letter-spacing:-.03em;text-align:right;font-variant-numeric:tabular-nums}
.post .rate{text-align:right;font-size:13px;color:var(--muted);line-height:1.3}.post .rate b{display:block;color:var(--ink);font-size:15px}
.mix{display:flex;height:8px;border-radius:99px;overflow:hidden;gap:2px;background:var(--track)}
@media (max-width:720px){.post{grid-template-columns:22px minmax(0,1fr) auto;grid-template-areas:"pos name clicks" "pos mix mix" "pos rate rate";row-gap:10px}.post .pos{grid-area:pos;align-self:start}.post .name{grid-area:name}.post .clicks{grid-area:clicks}.post .mix,.post>.hint{grid-area:mix}.post .rate{grid-area:rate;text-align:left}.post .spark{display:none}.post .rate b{display:inline;margin-right:6px}}

.donut{display:grid;place-items:center;margin:4px 0 18px;position:relative}
.donut .c{position:absolute;text-align:center}.donut .c strong{display:block;font-family:"Bricolage Grotesque",system-ui,sans-serif;font-size:30px;font-weight:800;letter-spacing:-.04em}
.donut .c span{font-size:12px;color:var(--faint)}
.legend{list-style:none;margin:0;padding:0;display:grid;gap:9px}
.legend li{display:grid;grid-template-columns:10px minmax(0,1fr) auto;gap:10px;align-items:center;font-size:14px}
.legend i{width:10px;height:10px;border-radius:50%}.legend em{font-style:normal;color:var(--muted);font-variant-numeric:tabular-nums}
.devices{display:flex;gap:10px;margin-top:18px}
.dev{flex:1;border-radius:16px;padding:12px 14px;background:var(--glass-strong);border:1px solid var(--edge-soft)}
.dev strong{display:block;font-family:"Bricolage Grotesque",system-ui,sans-serif;font-size:22px;letter-spacing:-.03em}.dev span{font-size:13px;color:var(--muted)}

.tools{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}@media (max-width:940px){.tools{grid-template-columns:minmax(0,1fr)}}
details.panel summary{cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;font-weight:600;min-height:28px}
details.panel summary::after{content:"";width:9px;height:9px;border-right:2px solid var(--faint);border-bottom:2px solid var(--faint);transform:rotate(45deg) translateY(-3px);transition:transform .2s}
details[open].panel summary::after{transform:rotate(225deg)}
form.row{display:flex;flex-wrap:wrap;gap:12px;align-items:end;margin-top:16px}label{display:grid;gap:6px;font-size:13px;color:var(--muted)}
input{font:inherit;color:var(--ink);background:var(--glass-strong);border:1px solid var(--edge-soft);border-radius:12px;padding:9px 12px;min-height:44px;min-width:0}
input::placeholder{color:var(--faint)}
.btn{font:600 14px "Geist",system-ui,sans-serif;min-height:44px;padding:0 20px;border-radius:12px;border:0;background:linear-gradient(135deg,#3B2FD6,#5B4FF0);color:#fff;cursor:pointer;box-shadow:0 10px 24px -10px rgba(59,47,214,.8)}
.btn[disabled],input[disabled]{opacity:.5;cursor:not-allowed}
input:focus,button:focus-visible,a:focus-visible,summary:focus-visible,.hit:focus{outline:2px solid var(--accent);outline-offset:2px}
.note{border-radius:20px;padding:14px 18px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center;font-size:14px;color:var(--muted)}
.note a{color:var(--accent);font-weight:600;text-decoration:none}.note a:hover{text-decoration:underline}
.empty{padding:26px;text-align:center;color:var(--muted)}
`;

const MARK = `<svg viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="mk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5B4FF0"/><stop offset="1" stop-color="#3B2FD6"/></linearGradient></defs><rect width="32" height="32" rx="10" fill="url(#mk)"/><path d="M11 8v11a5 5 0 0 0 10 0v-3" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="21" cy="12" r="2.6" fill="#5EEAD4"/></svg>`;

export const page = (title, body) => `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${esc(title)}</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Geist:wght@400;500;600&display=swap"><style>${STYLE}</style></head>
<body><div class="sea" aria-hidden="true"><i></i><i></i><i></i></div><div class="wrap">${body}</div></body></html>`;

function delta(now, prev) {
  if (!prev && !now) return `<span class="delta flat">igual que la semana anterior</span>`;
  if (!prev) return `<span class="delta up">primera semana con clics</span>`;
  const d = Math.round(((now - prev) / prev) * 100);
  if (!d) return `<span class="delta flat">igual que la semana anterior</span>`;
  return `<span class="delta ${d > 0 ? "up" : "down"}">${d > 0 ? "+" : "−"}${Math.abs(d)} % que la semana anterior</span>`;
}

/** Curva suave (Catmull-Rom → Bézier) para que la línea se lea como un hilo, no como picos. */
function smooth(pts) {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${Math.min(c1[1], 999).toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

function lightChart(days, values) {
  const W = 1000, H = 230, L = 6, R = 6, T = 20, B = 30, n = days.length;
  const max = Math.max(4, ...values) * 1.12;
  const x = (i) => L + (i * (W - L - R)) / (n - 1), y = (v) => T + (H - T - B) * (1 - v / max);
  const pts = values.map((v, i) => [x(i), Math.min(y(v), H - B)]);
  const path = smooth(pts), base = H - B;
  const ticks = days.map((d, i) => ((i % 7 === 0 && n - 1 - i >= 4) || i === n - 1 ? `<text x="${x(i)}" y="${H - 6}" text-anchor="${i === 0 ? "start" : i === n - 1 ? "end" : "middle"}">${dayLabel(d)}</text>` : "")).join("");
  const peak = values.indexOf(Math.max(...values)), last = n - 1;
  const hits = days.map((d, i) => {
    const tx = Math.min(Math.max(x(i) - 62, 0), W - 124), w = (W - L - R) / (n - 1);
    return `<rect class="hit" x="${(x(i) - w / 2).toFixed(1)}" y="0" width="${w.toFixed(1)}" height="${base}" fill="transparent" tabindex="0" aria-label="${dayLabel(d)}: ${values[i]} clics"/>
      <g class="tip"><line x1="${x(i)}" x2="${x(i)}" y1="${T}" y2="${base}" stroke="var(--faint)" stroke-dasharray="3 4"/><circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="5" fill="var(--line)"/><rect x="${tx}" y="-8" width="124" height="26" rx="13"/><text x="${tx + 62}" y="9" text-anchor="middle">${dayLabel(d)}, ${values[i]} clics</text></g>`;
  }).join("");
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Clics por día en los últimos ${n} días; máximo ${values[peak]} el ${dayLabel(days[peak])}">
    <defs>
      <linearGradient id="ln" x1="0" x2="1"><stop offset="0" stop-color="var(--line2)"/><stop offset="1" stop-color="var(--line)"/></linearGradient>
      <linearGradient id="ar" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--line)" stop-opacity=".28"/><stop offset="1" stop-color="var(--line)" stop-opacity="0"/></linearGradient>
      <filter id="glow" x="-5%" y="-30%" width="110%" height="160%"><feGaussianBlur stdDeviation="7"/></filter>
    </defs>
    <path d="${path} L${x(last)},${base} L${x(0)},${base} Z" fill="url(#ar)"/>
    <path d="${path}" fill="none" stroke="url(#ln)" stroke-width="7" opacity=".55" filter="url(#glow)"/>
    <path d="${path}" fill="none" stroke="url(#ln)" stroke-width="3" stroke-linecap="round"/>
    <circle cx="${pts[last][0]}" cy="${pts[last][1]}" r="11" fill="var(--line)" opacity=".25"/><circle cx="${pts[last][0]}" cy="${pts[last][1]}" r="5.5" fill="var(--line)"/>
    ${ticks}${hits}</svg>`;
}

function spark(values) {
  const w = 110, h = 34, max = Math.max(1, ...values);
  const pts = values.map((v, i) => [(i * w) / (values.length - 1), h - 5 - (v / max) * (h - 10)]);
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${smooth(pts)}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"/></svg>`;
}

function donut(sources, total) {
  const r = 70, c = 2 * Math.PI * r, gap = sources.length > 1 ? 4 : 0;
  let acc = 0;
  const arcs = sources.map((s) => {
    const len = (s.n / total) * c, arc = `<circle cx="90" cy="90" r="${r}" fill="none" stroke="${srcVar(s.source)}" stroke-width="18" stroke-dasharray="${Math.max(0.5, len - gap).toFixed(1)} ${c.toFixed(1)}" stroke-dashoffset="${(-acc).toFixed(1)}" transform="rotate(-90 90 90)"/>`;
    acc += len; return arc;
  }).join("");
  return `<div class="donut"><svg width="180" height="180" viewBox="0 0 180 180" role="img" aria-label="${esc(sources.map((s) => `${srcName(s.source)} ${s.n}`).join(", "))}"><circle cx="90" cy="90" r="${r}" fill="none" stroke="var(--track)" stroke-width="18"/>${arcs}</svg>
    <div class="c"><strong>${fmt(total)}</strong><span>clics</span></div></div>`;
}

const mix = (sources, total) => `<div class="mix" role="img" aria-label="${esc(sources.map((s) => `${srcName(s.source)} ${s.n}`).join(", "))}">${sources.map((s) => `<span style="flex:${s.n / total};background:${srcVar(s.source)}"></span>`).join("")}</div>`;

/** El tablero completo. `d` trae los números; con `demo` queda de solo lectura y con aviso. */
export function dashboard(d, { base = "", host = "", demo = false } = {}) {
  const P = (p) => base + p;
  const totalSrc = d.sources.reduce((s, x) => s + x.n, 0);
  const totalDev = d.devices.reduce((s, x) => s + x.n, 0) || 1;
  const off = demo ? " disabled" : "";
  const ranked = [...d.rows].sort((a, b) => b.clicks - a.clicks);
  const list = ranked.length
    ? `<ol class="rank">${ranked.map((r, i) => `<li class="post">
        <span class="pos">${i + 1}</span>
        <div class="name"><b>${esc(r.label || r.code)}</b><small><a href="${P("/" + esc(r.code))}" target="_blank" rel="noreferrer" title="${esc(host)}${esc(base)}/${esc(r.code)}">${esc(base)}/${esc(r.code)}</a> lleva a ${esc(r.targetShort)}</small></div>
        <span class="spark">${spark(r.daily14)}</span>
        ${r.clicks ? mix(r.sources, r.clicks) : '<span class="hint" style="margin:0">sin clics</span>'}
        <span class="clicks">${fmt(r.clicks)}</span>
        <span class="rate">${r.reach ? `<b>${pct(r.clicks, r.reach)}</b>de ${fmt(r.reach)} que lo vieron` : "sin alcance anotado"}</span>
      </li>`).join("")}</ol>`
    : `<div class="empty">Todavía no hay links. Creá el primero abajo, por ejemplo <b>09</b> para el post 09.</div>`;

  return page(demo ? "Taplog, demo" : "Taplog", `
  <header class="top">
    <a class="brand" href="${P(demo ? "/demo" : "/admin")}">${MARK}Taplog</a>
    ${demo ? '<span class="chip glass"><b></b>Demo con datos de ejemplo</span>' : `<form method="post" action="${P("/admin/logout")}"><button class="btn-ghost glass" type="submit">Salir</button></form>`}
  </header>

  <section class="hero glass">
    <div class="hero-head">
      <div><h1>¿Qué post trae gente?</h1><p class="lede">Cada link corto cuenta quién lo toca y desde dónde, sin guardar datos de nadie.</p></div>
      <div class="big"><div class="n">${fmt(d.week)}</div><div class="u">clics en los últimos 7 días</div>${delta(d.week, d.prevWeek)}</div>
    </div>
    <div class="chart">${lightChart(d.days30, d.daily30)}</div>
    <div class="facts">
      <span><strong>${fmt(d.total)}</strong>clics en total</span>
      <span><strong>${d.rows.length}</strong>${d.rows.length === 1 ? "link" : "links"}</span>
      <span><strong>${d.reach ? fmt(d.reach) : "–"}</strong>personas alcanzadas en Instagram</span>
      <span><strong>${d.reach ? pct(d.total, d.reach) : "–"}</strong>del alcance se volvió visita</span>
    </div>
  </section>

  <div class="split">
    <section class="panel glass"><h2>Los posts que más traen</h2><p class="hint">El porcentaje es cuántas de las personas que vieron el post tocaron el link.</p>${list}</section>
    <section class="panel glass"><h2>De dónde vienen</h2><p class="hint">Según la app desde la que abren el link.</p>
      ${totalSrc ? donut(d.sources, totalSrc) : ""}
      <ul class="legend">${d.sources.map((s) => `<li><i style="background:${srcVar(s.source)}"></i><span>${esc(srcName(s.source))}</span><em>${fmt(s.n)}, ${Math.round((s.n / totalSrc) * 100)} %</em></li>`).join("") || '<li class="hint">Sin clics todavía.</li>'}</ul>
      <div class="devices">${d.devices.map((s) => `<div class="dev"><strong>${Math.round((s.n / totalDev) * 100)} %</strong><span>desde ${esc(s.device)}</span></div>`).join("")}</div>
    </section>
  </div>

  <div class="tools">
    <details class="panel glass"${demo ? "" : " open"}><summary>Crear o cambiar un link</summary>
      <form class="row" method="post" action="${P("/admin/links")}">
        <label>Código<input name="code" required pattern="[a-z0-9][a-z0-9-]{0,39}" placeholder="09" style="width:110px"${off}></label>
        <label>Post<input name="label" placeholder="Shiplog v0.2.0" style="width:190px"${off}></label>
        <label style="flex:1;min-width:220px">Lleva a<input name="target" type="url" required placeholder="https://github.com/jotapoldev/shiplog"${off}></label>
        <button class="btn" type="submit"${off}>Guardar link</button>
      </form></details>
    <details class="panel glass"><summary>Anotar métricas de Instagram</summary>
      <form class="row" method="post" action="${P("/admin/ig")}">
        <label>Código<input name="code" required style="width:110px" list="codes"${off}></label>
        ${["reach:Alcance", "saves:Guardados", "shares:Compartidos", "likes:Me gusta", "comments:Comentarios"].map((f) => { const [n, l] = f.split(":"); return `<label>${l}<input name="${n}" type="number" min="0" inputmode="numeric" style="width:104px"${off}></label>`; }).join("")}
        <button class="btn" type="submit"${off}>Guardar métricas</button>
        <datalist id="codes">${d.rows.map((r) => `<option value="${esc(r.code)}">${esc(r.label ?? "")}</option>`).join("")}</datalist>
      </form></details>
  </div>
  ${demo ? `<div class="note glass"><span>Los números de esta demo son inventados. Taplog es parte de los proyectos de jotapol.</span><a href="https://jotapol.com" target="_blank" rel="noreferrer">Ver jotapol.com</a></div>` : ""}`);
}

export const login = (base, msg = "") => page("Entrar a Taplog", `<section class="panel glass" style="max-width:420px;width:100%;margin:16vh auto 0;padding:30px">
  <div class="brand" style="margin-bottom:18px">${MARK}Taplog</div>
  ${msg ? `<p style="color:var(--bad);margin:0 0 14px">${esc(msg)}</p>` : '<p class="hint" style="font-size:14px">Entrá con la clave del tablero.</p>'}
  <form method="post" action="${base}/admin/login" style="display:grid;gap:14px"><label>Clave<input name="token" type="password" required autocomplete="current-password"></label><button class="btn" type="submit">Entrar</button></form>
  <p class="hint" style="margin:18px 0 0">¿Solo querés ver cómo funciona? <a href="${base}/demo" style="color:var(--accent)">Abrí la demo</a>.</p></section>`);

export const notFound = (home) => page("Este link no existe", `<section class="panel glass" style="max-width:520px;margin:20vh auto 0;text-align:center"><h1 style="margin:0 auto 10px">Este link no existe.</h1><p class="lede" style="margin:0 auto">Revisá que esté bien escrito o andá a <a href="${esc(home)}" style="color:var(--accent)">${esc(home.replace(/^https?:\/\//, ""))}</a>.</p></section>`);
