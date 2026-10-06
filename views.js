// Vista del tablero de Taplog. Recibe datos ya calculados (model.js) y devuelve HTML.
// Estética de escritorio: una ventana de vidrio oscuro sobre un fondo con los colores de la marca.
// Adentro: menú lateral (sitios y orígenes), pestañas, banner con el número del período, sitios, páginas y orígenes.

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const fmt = (n) => (n == null ? "–" : Number(n).toLocaleString("es"));
const pct = (a, b) => (b ? `${((a / b) * 100).toFixed(1)} %` : "–");
const dayLabel = (d) => new Date(d + "T12:00:00Z").toLocaleDateString("es", { day: "numeric", month: "short", timeZone: "UTC" });

// Color fijo por origen (no cambia con el ranking); el resto va en gris.
const SOURCE_COLOR = { instagram: "#E0568F", github: "#9A93FF", directo: "#5EEAD4", google: "#F2B33D", linkedin: "#4E8DF5", tiktok: "#2BC4C4", facebook: "#6C8CFF", x: "#C9C6E6" };
const srcColor = (s) => SOURCE_COLOR[s] ?? "#7D78A8";
const SOURCE_NAME = { instagram: "Instagram", tiktok: "TikTok", linkedin: "LinkedIn", x: "X", directo: "Directo", facebook: "Facebook", whatsapp: "WhatsApp", github: "GitHub", google: "Google" };
const srcName = (s) => SOURCE_NAME[s] ?? s;

const ICON = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6"/>',
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/>',
  github: '<path d="M9 19c-4 1.5-4-2-6-2.5m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.8 2.4 5.8 2.7 5.8 2.7a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4.4 9c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
  directo: '<path d="M10 14a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-.5.5M14 10a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l.5-.5"/>',
  google: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  other: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  links: '<path d="M4 7h16M4 12h10M4 17h7"/>',
};
const icon = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[k] ?? ICON.other}</svg>`;
const mini = (s, cls = "mini") => `<span class="${cls}" style="background:${s.color}" aria-hidden="true">${s.ini}</span>`;

// El Gancho de jotapol: el logo dentro del banner y, chico, en el menú.
const GANCHO = (fill = "#fff") => `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 8 H26 V38 C26 44.6 31.4 50 38 50 H56 V56 H38 C28.1 56 20 47.9 20 38 V14 H8 Z" fill="${fill}"/><path d="M34 8 H44 C51.7 8 56 12.3 56 20 C56 27.7 51.7 32 44 32 H34 Z" fill="#5EEAD4"/></svg>`;

// Logo propio de Taplog (dedo que toca + punto menta); el Gancho queda como firma de jotapol en el banner.
const MARK = `<svg viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="mk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5B4FF0"/><stop offset="1" stop-color="#3B2FD6"/></linearGradient></defs><rect width="32" height="32" rx="10" fill="url(#mk)"/><path d="M11 8v11a5 5 0 0 0 10 0v-3" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="21" cy="12" r="2.6" fill="#5EEAD4"/></svg>`;
const STYLE = `
:root{
  --display:"Bricolage Grotesque",system-ui,sans-serif;--body:"Geist",system-ui,sans-serif;
  --ink:#F3F1FF;--muted:#B9B5DA;--faint:#8C87B5;
  --win:rgba(22,18,52,.34);--pane:rgba(255,255,255,.045);--row:rgba(255,255,255,.06);--edge:rgba(255,255,255,.2);--edge2:rgba(255,255,255,.07);
  --blue:#5B7CFF;--menta:#5EEAD4;--good:#2BC48A;--bad:#F0566E;color-scheme:dark}
*{box-sizing:border-box}html,body{margin:0;min-height:100%}
body{font:14px/1.5 var(--body);color:var(--ink);-webkit-font-smoothing:antialiased;overflow-x:hidden;
  background:radial-gradient(120% 90% at 0% 0%,#2B3BD9 0%,transparent 55%),radial-gradient(90% 80% at 100% 10%,#7A2BC9 0%,transparent 55%),
    radial-gradient(80% 70% at 85% 100%,#C2306E 0%,transparent 60%),radial-gradient(70% 60% at 10% 100%,#0E7E86 0%,transparent 60%),#120C3A;
  background-attachment:fixed}
/* Orbes detrás de la ventana: sin algo que difuminar, el vidrio se ve plano. */
body::before,body::after{content:"";position:fixed;z-index:-1;border-radius:50%;filter:blur(8px);pointer-events:none}
body::before{width:420px;height:420px;left:18%;top:12%;background:radial-gradient(circle at 35% 35%,#7FA0FF,#3B2FD6 55%,transparent 72%);animation:drift 22s ease-in-out infinite alternate}
body::after{width:360px;height:360px;right:12%;bottom:6%;background:radial-gradient(circle at 40% 40%,#FF9AC4,#C2306E 55%,transparent 72%);animation:drift 26s ease-in-out infinite alternate-reverse}
@keyframes drift{to{transform:translate(120px,80px) scale(1.15)}}
@media (prefers-reduced-motion:reduce){body::before,body::after{animation:none}}
.desk{padding:16px;min-height:100vh;display:flex;flex-direction:column;gap:16px}
.win{position:relative;border-radius:18px;background:var(--win);border:1px solid var(--edge);
  box-shadow:0 40px 100px -30px rgba(0,0,0,.75),inset 0 1px 0 rgba(255,255,255,.35),inset 1px 0 0 rgba(255,255,255,.12),inset 0 0 40px rgba(255,255,255,.04);
  backdrop-filter:blur(28px) saturate(2) brightness(1.05);-webkit-backdrop-filter:blur(28px) saturate(2) brightness(1.05);overflow:hidden;display:grid;grid-template-columns:240px minmax(0,1fr);flex:1}
.win::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:2;
  background:linear-gradient(135deg,rgba(255,255,255,.16) 0%,rgba(255,255,255,0) 32%,rgba(255,255,255,0) 70%,rgba(255,255,255,.06) 100%)}
a{color:inherit}
a:focus-visible,button:focus-visible,input:focus-visible,.hit:focus{outline:2px solid var(--menta);outline-offset:2px}

.side{padding:16px 12px 20px;background:var(--pane);border-right:1px solid var(--edge2);display:flex;flex-direction:column;gap:2px}
.brand{display:flex;align-items:center;gap:9px;font:800 19px var(--display);letter-spacing:-.03em;text-decoration:none;padding:2px 8px 10px}
.brand svg{width:28px;height:28px;filter:drop-shadow(0 6px 14px rgba(59,47,214,.55))}
.side h4{font:500 11.5px var(--body);color:var(--faint);margin:14px 8px 4px}
.side a,.side .src{display:flex;align-items:center;gap:10px;color:var(--muted);text-decoration:none;font-size:13.5px;min-height:34px;padding:0 8px;border-radius:8px}
.side a:hover{color:var(--ink);background:var(--row)}
.side a[aria-current=page]{background:rgba(255,255,255,.1);color:var(--ink)}
.side .count{margin-left:auto;font-size:12px;color:var(--faint);font-variant-numeric:tabular-nums}
.side svg{width:16px;height:16px;flex:none;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.mini{width:18px;height:18px;border-radius:5px;display:grid;place-items:center;font:700 9.5px var(--body);color:#fff;flex:none}

.main{min-width:0;display:flex;flex-direction:column}
.bar{display:flex;align-items:center;gap:16px;padding:0 20px;border-bottom:1px solid var(--edge2);min-height:58px}
.tabs{display:flex;gap:4px;margin:0 auto}
.tabs a{color:var(--faint);text-decoration:none;font-weight:500;padding:18px 12px 16px;border-bottom:2px solid transparent}
.tabs a[aria-current=page]{color:var(--ink);border-color:var(--ink)}.tabs a:hover{color:var(--ink)}
.chip{font-size:12.5px;color:var(--muted);border:1px solid var(--edge);border-radius:999px;padding:5px 12px;white-space:nowrap}
.out{font:500 13px var(--body);color:var(--muted);background:transparent;border:1px solid var(--edge);border-radius:999px;min-height:32px;padding:0 14px;cursor:pointer}
.out:hover{color:var(--ink)}
.sub{display:flex;align-items:center;gap:10px;padding:12px 24px;border-bottom:1px solid var(--edge2);flex-wrap:wrap}
.sub h1{font:600 15px var(--body);margin:0 auto 0 0;display:flex;align-items:center;gap:10px}
.sub h1 a{font-weight:400;color:var(--faint);font-size:13px}
.seg{display:flex;gap:2px;background:var(--row);border-radius:9px;padding:3px}
.seg a{font:500 12.5px var(--body);color:var(--muted);text-decoration:none;border-radius:7px;min-height:30px;padding:0 14px;display:grid;place-items:center}
.seg a[aria-current=true]{background:rgba(255,255,255,.14);color:var(--ink);box-shadow:0 1px 3px rgba(0,0,0,.3)}
.content{padding:20px 24px 28px;display:grid;gap:24px;align-content:start}

.hero{position:relative;border-radius:14px;overflow:hidden;min-height:200px;padding:24px 26px;display:flex;flex-direction:column;justify-content:center;gap:6px;isolation:isolate;
  background:linear-gradient(115deg,#2A1FB8 0%,#5B3FE0 38%,#B33FD0 72%,#E0568F 100%)}
.hero .tag{display:flex;align-items:center;gap:10px;font-weight:600;font-size:15px}
.hero .tag .mini{width:26px;height:26px;border-radius:7px;font-size:12px;border:1px solid rgba(255,255,255,.25)}
.hero b.n{font:800 58px/1 var(--display);letter-spacing:-.045em;font-variant-numeric:tabular-nums}
.hero p{margin:0;max-width:44ch;color:rgba(255,255,255,.85)}
.hero .cta{margin-top:10px;align-self:flex-start;font:600 13px var(--body);color:#fff;background:#2F6BFF;border-radius:999px;min-height:34px;padding:0 18px;display:grid;place-items:center;text-decoration:none;box-shadow:0 8px 20px -8px rgba(47,107,255,.9)}
.shape{position:absolute;z-index:-1;border-radius:50%}
.s1{width:46px;height:46px;right:300px;top:26px;background:radial-gradient(circle at 30% 30%,#B9A8FF,#5B3FE0 60%,#2A1FB8)}
.s2{width:22px;height:22px;right:200px;top:18px;background:radial-gradient(circle at 30% 30%,#E3D9FF,#7A5CFF)}
.s3{width:34px;height:34px;right:330px;bottom:30px;border-radius:9px;transform:rotate(28deg);background:linear-gradient(135deg,#FF8FB8,#E0568F 60%,#A3236A)}
.s4{width:26px;height:26px;right:180px;bottom:50px;border-radius:7px;transform:rotate(-18deg);background:linear-gradient(135deg,#FFB27A,#E0568F)}
.s5{width:150px;height:150px;right:34px;top:24px;border-radius:38px;transform:rotate(-14deg);background:linear-gradient(145deg,rgba(255,255,255,.35),rgba(255,255,255,.06));border:1px solid rgba(255,255,255,.4);backdrop-filter:blur(14px) saturate(1.6);-webkit-backdrop-filter:blur(14px) saturate(1.6);display:grid;place-items:center;box-shadow:0 30px 60px -20px rgba(20,10,80,.6),inset 0 1px 0 rgba(255,255,255,.55)}
.s5 svg{width:96px;height:96px;transform:rotate(14deg);filter:drop-shadow(0 10px 18px rgba(0,0,0,.35))}

.sec{display:grid;gap:10px}.sec>h2{font:500 12.5px var(--body);color:var(--faint);margin:0}
.box{border-radius:12px;border:1px solid var(--edge2);background:linear-gradient(145deg,rgba(255,255,255,.1),rgba(255,255,255,.025));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 12px 30px -18px rgba(0,0,0,.6);backdrop-filter:blur(14px) saturate(1.5);-webkit-backdrop-filter:blur(14px) saturate(1.5)}
.list{overflow:hidden}
.item{display:grid;grid-template-columns:30px minmax(0,1fr) 150px 70px 104px;align-items:center;gap:14px;padding:10px 14px;border-top:1px solid var(--edge2)}
.item:first-child{border-top:0}
.item .mini{width:28px;height:28px;border-radius:7px;font-size:12px}
.item b{font-weight:600}.item small{display:block;color:var(--faint);font-size:12px}
.state{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--muted)}.state i{width:7px;height:7px;border-radius:50%;flex:none}
.num{text-align:right;font:700 16px var(--display);letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.pill{font:600 12.5px var(--body);color:var(--ink);text-decoration:none;border:1px solid rgba(255,255,255,.35);border-radius:999px;min-height:30px;padding:0 16px;display:grid;place-items:center;justify-self:end;white-space:nowrap}
.pill:hover{background:var(--row)}.pill.solid{background:#2F6BFF;border-color:#2F6BFF}

.chart{padding:14px 16px 8px}.chart svg{width:100%;height:auto;display:block;overflow:visible}
.chart text{font:11px var(--body);fill:var(--faint)}
.hit:hover+.tip,.hit:focus+.tip{opacity:1}.tip{opacity:0;pointer-events:none;transition:opacity .15s}
.tip rect{fill:var(--ink)}.tip text{fill:#120C3A;font-weight:600}

.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}
.duo{display:grid;gap:24px;align-items:start}.duo>.sec{min-width:0}
@media (min-width:1400px){.duo{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.duo .split{grid-template-columns:minmax(0,1fr)}}
.card{padding:16px;display:flex;flex-direction:column;gap:6px;min-height:140px}
.card .t{display:flex;align-items:center;gap:10px;font-weight:600;min-width:0}.card .t span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.card p{margin:0;color:var(--muted);font-size:13px}
.card .f{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:10px}
.card .f b{font:700 20px var(--display);letter-spacing:-.03em;font-variant-numeric:tabular-nums}

.split{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:14px}
.bars{list-style:none;margin:0;padding:16px;display:grid;gap:12px}
.bars li{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 12px;font-size:13.5px}
.bars em{font-style:normal;color:var(--muted);font-variant-numeric:tabular-nums}
.bars .track{grid-column:1/-1;height:6px;border-radius:99px;background:rgba(255,255,255,.06);overflow:hidden}
.bars .track i{display:block;height:100%;border-radius:99px}
.devs{padding:16px;display:grid;gap:12px;align-content:start}
.devs div{display:flex;align-items:baseline;gap:8px;color:var(--muted)}
.devs strong{font:800 28px var(--display);letter-spacing:-.04em;color:var(--ink);font-variant-numeric:tabular-nums}
.empty{padding:22px;color:var(--muted)}
.hint{color:var(--faint);font-size:13px;margin:0}

.links{list-style:none;margin:0;padding:0}
.link{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(80px,.8fr) 70px 130px;gap:14px;align-items:center;padding:12px 14px;border-top:1px solid var(--edge2)}
.link:first-child{border-top:0}
.link b{display:block;font-weight:600}.link small{display:block;font-size:12px;color:var(--faint);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.link small a{color:var(--menta);text-decoration:none}.link small a:hover{text-decoration:underline}
.link .rate{text-align:right;font-size:12.5px;color:var(--muted);line-height:1.3}.link .rate b{color:var(--ink);font-size:14px}
.mix{display:flex;height:6px;border-radius:99px;overflow:hidden;gap:2px;background:rgba(255,255,255,.06)}
form.row{display:flex;flex-wrap:wrap;gap:12px;align-items:end;padding:16px}
label{display:grid;gap:6px;font-size:12.5px;color:var(--muted)}
input,select{font:inherit;color:var(--ink);background:rgba(255,255,255,.07);border:1px solid var(--edge);border-radius:10px;padding:8px 12px;min-height:40px;min-width:0}
input::placeholder{color:var(--faint)}
.btn{font:600 13.5px var(--body);min-height:40px;padding:0 20px;border-radius:999px;border:0;background:#2F6BFF;color:#fff;cursor:pointer}
.btn[disabled],input[disabled]{opacity:.5;cursor:not-allowed}
pre{margin:0;padding:14px 16px;overflow:auto;font:12.5px/1.6 ui-monospace,Consolas,monospace;color:var(--muted);white-space:pre-wrap;word-break:break-all}
.snip{display:grid;gap:8px}.snip h3{display:flex;align-items:center;gap:10px;font:600 14px var(--body);margin:0}
.note{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center;padding:12px 16px;font-size:13px;color:var(--muted)}
.note a{color:var(--menta);font-weight:600;text-decoration:none}

@media (max-width:900px){.cards,.split{grid-template-columns:minmax(0,1fr)}}
@media (max-width:860px){
  .win{grid-template-columns:minmax(0,1fr);min-height:0}
  .side{flex-direction:row;overflow-x:auto;border-right:0;border-bottom:1px solid var(--edge2);padding:10px 12px;gap:4px}
  .side h4,.side .src{display:none}.side a{flex:none}.brand{padding:0 8px 0 4px}
  .bar{padding:0 12px}.tabs{margin:0 auto 0 0}.tabs a{padding:16px 8px 14px}
  .content{padding:16px}.sub{padding:12px 16px}
}
@media (max-width:700px){.item{grid-template-columns:30px minmax(0,1fr) auto auto;gap:10px}.item .state{display:none}.pill{padding:0 12px}.card{min-height:0}
  .link{grid-template-columns:minmax(0,1fr) auto}.link .mix{grid-column:1/-1;grid-row:2}.link .rate{display:none}}
@media (max-width:640px){.shape{display:none}.hero b.n{font-size:44px}.chart text{font-size:22px}.chip{display:none}}
`;

export const page = (title, body) => `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${esc(title)}</title><link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encodeURIComponent(MARK.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" '))}"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Geist:wght@400;500;600&display=swap"><style>${STYLE}</style></head>
<body><div class="desk">${body}</div></body></html>`;

/** Curva suave (Catmull-Rom a Bézier) para que la línea no se vea en picos. */
function smooth(pts) {
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

function chart(days, values) {
  const W = 1000, H = 200, T = 20, B = 30, n = days.length, base = H - B;
  const max = Math.max(4, ...values) * 1.12;
  const x = (i) => 6 + (i * (W - 12)) / (n - 1), y = (v) => Math.min(T + (base - T) * (1 - v / max), base);
  const pts = values.map((v, i) => [x(i), y(v)]), path = smooth(pts);
  const ticks = days.map((d, i) => ((i % 7 === 0 && n - 1 - i >= 4) || i === n - 1 ? `<text x="${x(i)}" y="${H - 6}" text-anchor="${i === 0 ? "start" : i === n - 1 ? "end" : "middle"}">${dayLabel(d)}</text>` : "")).join("");
  const w = (W - 12) / (n - 1);
  const hits = days.map((d, i) => {
    const tx = Math.min(Math.max(x(i) - 66, 0), W - 132);
    return `<rect class="hit" x="${(x(i) - w / 2).toFixed(1)}" y="0" width="${w.toFixed(1)}" height="${base}" fill="transparent" tabindex="0" aria-label="${dayLabel(d)}: ${values[i]} visitas"/>
      <g class="tip"><line x1="${x(i)}" x2="${x(i)}" y1="${T}" y2="${base}" stroke="var(--faint)" stroke-dasharray="3 4"/><circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="5" fill="var(--menta)" stroke="#120C3A" stroke-width="2"/><rect x="${tx}" y="-10" width="132" height="26" rx="13"/><text x="${tx + 66}" y="7" text-anchor="middle">${dayLabel(d)}, ${values[i]} visitas</text></g>`;
  }).join("");
  const peak = values.indexOf(Math.max(...values));
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Visitas por día en los últimos ${n} días; el máximo fue ${values[peak]} el ${dayLabel(days[peak])}">
    <defs><linearGradient id="ar" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#5EEAD4" stop-opacity=".3"/><stop offset="1" stop-color="#5EEAD4" stop-opacity="0"/></linearGradient></defs>
    <line x1="0" x2="${W}" y1="${base}" y2="${base}" stroke="rgba(255,255,255,.08)"/>
    <path d="${path} L${x(n - 1)},${base} L${x(0)},${base} Z" fill="url(#ar)"/>
    <path d="${path}" fill="none" stroke="var(--menta)" stroke-width="2.5" stroke-linecap="round"/>
    ${ticks}${hits}</svg>`;
}

function spark(values) {
  const w = 110, h = 30, max = Math.max(1, ...values);
  const pts = values.map((v, i) => [(i * w) / (values.length - 1), h - 4 - (v / max) * (h - 8)]);
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${smooth(pts)}" fill="none" stroke="var(--menta)" stroke-width="2" stroke-linecap="round"/></svg>`;
}

const mix = (sources, total) => `<div class="mix" role="img" aria-label="${esc(sources.map((s) => `${srcName(s.source)} ${s.n}`).join(", "))}">${sources.map((s) => `<span style="flex:${s.n / total};background:${srcColor(s.source)}"></span>`).join("")}</div>`;

const PERIOD = { 1: ["Hoy", "Hoy", "ayer"], 7: ["7 días", "Esta semana", "la semana anterior"], 30: ["30 días", "Últimos 30 días", "los 30 días anteriores"] };
const TREND_DOT = { up: "var(--good)", flat: "var(--blue)", down: "var(--bad)", quiet: "var(--faint)" };

/** Frase del banner: cuánto cambió y quién trajo más gente. */
function headline(d) {
  const parts = [];
  if (d.delta == null) parts.push(d.total ? "Primeras visitas registradas." : "Todavía no hay visitas en este período.");
  else if (d.delta === 0) parts.push(`Igual que ${PERIOD[d.period][2]}.`);
  else parts.push(`${Math.abs(d.delta)} % ${d.delta > 0 ? "más" : "menos"} que ${PERIOD[d.period][2]}.`);
  if (d.topSource && d.entries >= 5) {
    const tenths = Math.round(d.topSource.share * 10);
    parts.push(tenths >= 10 ? `Casi todas las entradas llegaron desde ${srcName(d.topSource.source)}.` : `${srcName(d.topSource.source)} trajo ${Math.max(1, tenths)} de cada 10 entradas.`);
  }
  return parts.join(" ");
}

/**
 * El tablero. `d` sale de model(); `links` es la lista de links cortos.
 * tab: "resumen" | "links" | "ajustes". Con `demo` todo queda de solo lectura.
 */
export function dashboard(d, { base = "", host = "", demo = false, owner = false, tab = "resumen", links = [], sites = [], accounts = [] } = {}) {
  const root = base + (demo ? "/demo" : "/admin");
  const href = (o = {}) => {
    const p = new URLSearchParams();
    const site = "site" in o ? o.site : d.site?.id, period = o.p ?? d.period, t = o.tab ?? (o.site !== undefined ? "resumen" : tab);
    if (t !== "resumen") p.set("tab", t);
    else { if (site) p.set("site", site); if (period !== 7) p.set("p", period); }
    const s = p.toString();
    return esc(root + (s ? "?" + s : ""));
  };
  const cur = (on) => (on ? ' aria-current="page"' : "");
  const resumen = tab === "resumen";

  const side = `<nav class="side" aria-label="Menú">
    <a class="brand" href="${href({ site: null })}">${MARK}Taplog</a>
    <h4>Resumen</h4>
    <a href="${href({ site: null })}"${cur(resumen && !d.site)}>${icon("grid")}Todos los sitios</a>
    <h4>Sitios</h4>
    ${d.sites.map((s) => `<a href="${href({ site: s.id })}"${cur(resumen && d.site?.id === s.id)}>${mini(s)}${esc(s.name)}<span class="count">${fmt(s.visits)}</span></a>`).join("")}
    ${d.sources.length ? `<h4>De dónde vienen</h4>${d.sources.slice(0, 5).map((s) => `<span class="src">${icon(s.source)}${esc(srcName(s.source))}<span class="count">${fmt(s.n)}</span></span>`).join("")}` : ""}
    ${owner ? `<h4>Links cortos</h4>
    <a href="${href({ tab: "links" })}"${cur(tab === "links")}>${icon("links")}Links por post</a>` : ""}
  </nav>`;

  const bar = `<div class="bar">
    <nav class="tabs" aria-label="Secciones"><a href="${href({ tab: "resumen", site: d.site?.id ?? null })}"${cur(resumen)}>Resumen</a>${owner ? `<a href="${href({ tab: "links" })}"${cur(tab === "links")}>Links</a>` : ""}<a href="${href({ tab: "ajustes" })}"${cur(tab === "ajustes")}>Ajustes</a></nav>
    ${demo ? '<span class="chip">Demo con datos de ejemplo</span>' : `<form method="post" action="${esc(base)}/admin/logout"><button class="out" type="submit">Salir</button></form>`}
  </div>`;

  const body = resumen ? resumenView(d, href) : tab === "links" ? linksView(links, { base, host, demo }) : ajustesView({ base, host, sites, owner, demo, accounts });
  return page(demo ? "Taplog, demo" : "Taplog", `<div class="win">${side}<div class="main">${bar}${body}</div></div>
    ${demo ? `<div class="note box" style="backdrop-filter:blur(20px)"><span>Los números de esta demo son inventados. Taplog es uno de los proyectos de jotapol.</span><a href="https://jotapol.com" target="_blank" rel="noreferrer">Ver jotapol.com</a></div>` : ""}`);
}

function resumenView(d, href) {
  const site = d.site;
  const seg = `<div class="seg" role="group" aria-label="Período">${[1, 7, 30].map((p) => `<a href="${href({ p })}" aria-current="${d.period === p}">${PERIOD[p][0]}</a>`).join("")}</div>`;
  const title = site ? `${mini(site)}${esc(site.name)} <a href="https://${esc(site.host)}" target="_blank" rel="noreferrer">${esc(site.host)}</a>` : "Todos los sitios";

  const hero = `<section class="hero">
    <span class="shape s1"></span><span class="shape s2"></span><span class="shape s3"></span><span class="shape s4"></span>
    <span class="shape s5">${GANCHO()}</span>
    <div class="tag">${site ? mini(site) : ""}${PERIOD[d.period][1]} en ${site ? esc(site.name) : "tus sitios"}</div>
    <b class="n">${fmt(d.total)} ${d.total === 1 ? "visita" : "visitas"}</b>
    <p>${esc(headline(d))}</p>
    ${d.entries ? '<a class="cta" href="#origenes">Ver de dónde vienen</a>' : ""}
  </section>`;

  const sites = site ? "" : `<section class="sec"><h2>Tus sitios</h2><div class="box list">
    ${[...d.sites].sort((a, b) => b.visits - a.visits).map((s) => {
      const peak = s.prev > 0 && s.visits >= s.prev * 1.5;
      return `<div class="item">${mini(s)}<div><b>${esc(s.name)}</b><small>${esc(s.note)}</small></div>
        <span class="state"><i style="background:${TREND_DOT[s.trend.key]}"></i>${esc(s.trend.label)}</span><span class="num">${fmt(s.visits)}</span>
        <a class="pill${peak ? " solid" : ""}" href="${href({ site: s.id })}" aria-label="Ver ${esc(s.name)}">${peak ? "Ver el pico" : "Ver"}</a></div>`;
    }).join("")}</div></section>`;

  const trendBox = `<section class="sec"><h2>Visitas por día, últimos 30 días</h2><div class="box chart">${chart(d.days30, d.series30)}</div></section>`;

  const visitsOf = (s) => d.sites.find((x) => x.id === s.id)?.visits || 0;
  const pages = `<section class="sec"><h2>Páginas más visitadas</h2>${d.pages.length ? `<div class="cards">${d.pages.map((p) => `<div class="box card">
      <div class="t">${mini(p.site)}<span>${esc(site ? p.path : `${p.site.name} ${p.path}`)}</span></div>
      <p>${visitsOf(p.site) ? `${Math.round((p.n / visitsOf(p.site)) * 100)} % de las visitas a ${esc(p.site.name)}` : esc(p.site.host)}</p>
      <div class="f"><b>${fmt(p.n)}</b>${spark(p.spark)}</div></div>`).join("")}</div>` : '<div class="box empty">Cuando alguien abra una página, aparece aquí.</div>'}</section>`;

  const totalDev = d.devices.reduce((s, x) => s + x.n, 0) || 1;
  const origins = `<section class="sec" id="origenes"><h2>De dónde vienen</h2><p class="hint">Solo cuentan las entradas desde fuera. Moverse dentro del sitio no suma.</p>
    <div class="split"><div class="box">${d.sources.length ? `<ul class="bars">${d.sources.map((s) => `<li><span>${esc(srcName(s.source))}</span><em>${fmt(s.n)} (${Math.round((s.n / d.entries) * 100)} %)</em><span class="track"><i style="width:${((s.n / d.sources[0].n) * 100).toFixed(1)}%;background:${srcColor(s.source)}"></i></span></li>`).join("")}</ul>` : '<p class="empty">Sin entradas todavía.</p>'}</div>
    <div class="box devs">${d.devices.map((s) => `<div><strong>${Math.round((s.n / totalDev) * 100)} %</strong>desde ${esc(s.device)}</div>`).join("") || '<p class="hint">Sin datos de dispositivos.</p>'}</div></div></section>`;

  // En pantallas anchas la gráfica va al lado de los sitios (o de los orígenes, viendo un solo sitio) para que no se estire.
  const duo = site ? `<div class="duo">${trendBox}${origins}</div>${pages}` : `<div class="duo">${sites}${trendBox}</div>${pages}${origins}`;
  return `<div class="sub"><h1>${title}</h1>${seg}</div><div class="content">${hero}${duo}</div>`;
}

function linksView(links, { base, host, demo }) {
  const off = demo ? " disabled" : "";
  const ranked = [...links].sort((a, b) => b.clicks - a.clicks);
  const list = ranked.length ? `<ul class="box links">${ranked.map((r) => `<li class="link">
      <div style="min-width:0"><b>${esc(r.label || r.code)}</b><small><a href="${esc(base)}/${esc(r.code)}" target="_blank" rel="noreferrer">${esc(host)}${esc(base)}/${esc(r.code)}</a> lleva a ${esc(r.targetShort)}</small></div>
      ${r.clicks ? mix(r.sources, r.clicks) : '<span class="hint">sin clics</span>'}
      <span class="num">${fmt(r.clicks)}</span>
      <span class="rate">${r.reach ? `<b>${pct(r.clicks, r.reach)}</b><br>de ${fmt(r.reach)} que lo vieron` : "sin alcance anotado"}</span>
    </li>`).join("")}</ul>` : '<div class="box empty">Todavía no hay links. Creá el primero abajo, por ejemplo <b>09</b> para el post 09.</div>';
  return `<div class="sub"><h1>Links cortos por post</h1></div><div class="content">
    <p class="hint">Para cuando querés saber qué post exacto trajo la visita. El porcentaje es cuántas personas de las que vieron el post tocaron el link.</p>
    ${list}
    <section class="sec"><h2>Crear o cambiar un link</h2><form class="box row" method="post" action="${esc(base)}/admin/links">
      <label>Código<input name="code" required pattern="[a-z0-9][a-z0-9-]{0,39}" placeholder="09" style="width:110px"${off}></label>
      <label>Post<input name="label" placeholder="Shiplog v0.2.0" style="width:190px"${off}></label>
      <label style="flex:1;min-width:220px">Lleva a<input name="target" type="url" required placeholder="https://shiplog.jotapol.com"${off}></label>
      <button class="btn" type="submit"${off}>Guardar link</button></form></section>
    <section class="sec"><h2>Anotar métricas de Instagram</h2><form class="box row" method="post" action="${esc(base)}/admin/ig">
      <label>Código<input name="code" required style="width:110px" list="codes"${off}></label>
      ${[["reach", "Alcance"], ["saves", "Guardados"], ["shares", "Compartidos"], ["likes", "Me gusta"], ["comments", "Comentarios"]].map(([n, l]) => `<label>${l}<input name="${n}" type="number" min="0" inputmode="numeric" style="width:104px"${off}></label>`).join("")}
      <button class="btn" type="submit"${off}>Guardar métricas</button>
      <datalist id="codes">${links.map((r) => `<option value="${esc(r.code)}">${esc(r.label ?? "")}</option>`).join("")}</datalist></form></section>
  </div>`;
}

/** Fragmento que va en el <head> de cada sitio. Avisa una vez por página (también al navegar sin recargar). */
export const snippet = (siteId, endpoint) => `<script>(()=>{let l;const h=()=>{const p=location.pathname;if(p===l)return;const r=l?location.origin+"/":document.referrer,q=l?"":location.search;l=p;navigator.sendBeacon("${endpoint}",JSON.stringify({s:"${siteId}",p,r,q}))},w=history.pushState;history.pushState=function(){w.apply(this,arguments);h()};addEventListener("popstate",h);h()})()</script>`;

function ajustesView({ base, host, sites, owner, demo, accounts }) {
  const endpoint = `https://${host}${base}/hit`;
  const off = demo ? " disabled" : "";
  const addSite = `<section class="sec"><h2>Agregar un sitio</h2><form class="box row" method="post" action="${esc(base)}/admin/sites">
      <label>Nombre<input name="name" required maxlength="60" placeholder="Tienda" style="width:180px"${off}></label>
      <label style="flex:1;min-width:220px">Dominio<input name="host" required placeholder="tienda.com"${off}></label>
      ${owner && accounts.length ? `<label>Cuenta<select name="account"${off}><option value="">jotapol</option>${accounts.map((a) => `<option value="${esc(a.id)}">${esc(a.name)}</option>`).join("")}</select></label>` : ""}
      <button class="btn" type="submit"${off}>Agregar sitio</button></form></section>`;
  const clients = owner && !demo ? `<section class="sec"><h2>Clientes</h2>
      ${accounts.length ? `<div class="box list">${accounts.map((a) => `<div class="item"><span class="mini" style="background:var(--blue)">${esc(a.name.slice(0, 2))}</span><div><b>${esc(a.name)}</b><small>desde ${esc(a.created_at.slice(0, 10))}</small></div><span class="state">${a.sites} ${a.sites === 1 ? "sitio" : "sitios"}</span><span></span><span></span></div>`).join("")}</div>` : '<div class="box empty">Todavía no hay clientes.</div>'}
      <form class="box row" method="post" action="${esc(base)}/admin/clients">
        <label style="flex:1;min-width:220px">Nombre del cliente<input name="name" required maxlength="80" placeholder="Tienda La Ceiba"></label>
        <button class="btn" type="submit">Crear cuenta</button></form>
      <p class="hint">Al crearla te mostramos su clave una sola vez. Pasásela al cliente: con ella entra a ${esc(host + base)}/admin y agrega sus sitios.</p></section>` : "";
  return `<div class="sub"><h1>Ajustes</h1></div><div class="content">
    <p class="hint" style="max-width:70ch">Cada sitio lleva este fragmento en el &lt;head&gt;. Avisa qué página se abrió y desde dónde llegó la persona; no guarda IP, cookies ni nada que la identifique. Si el sitio tiene política de seguridad de contenido, agregá ${esc(`https://${host}`)} a connect-src.</p>
    ${sites.length ? sites.map((s) => `<section class="snip"><h3>${mini(s)}${esc(s.name)} <small class="hint">${esc(s.host)}</small></h3><pre class="box">${esc(snippet(s.id, endpoint))}</pre></section>`).join("") : '<div class="box empty">Agregá tu primer sitio abajo y te damos el fragmento para pegar.</div>'}
    ${addSite}
    <p class="hint">Para saber qué campaña o post trajo la visita, agregá ?utm_source=post-09 al link. Ese nombre aparece tal cual en "De dónde vienen".</p>
    ${clients}
  </div>`;
}

/** Clave nueva de un cliente: se muestra una sola vez. */
export const tokenShown = (base, name, token) => page("Clave de " + name, `<section class="win" style="max-width:560px;margin:14vh auto 0;display:block;min-height:0;padding:30px">
  <div class="brand" style="padding:0 0 18px">${MARK}Taplog</div>
  <p style="margin:0 0 12px">Cuenta creada para <b>${esc(name)}</b>. Esta es su clave:</p>
  <pre class="box" style="padding:14px;user-select:all;white-space:pre-wrap;word-break:break-all;margin:0 0 12px">${esc(token)}</pre>
  <p class="hint" style="margin:0 0 18px">Copiala ahora: no se vuelve a mostrar y no la guardamos (solo su huella). Si se pierde, creá otra cuenta.</p>
  <a class="btn" style="display:inline-grid;place-items:center;text-decoration:none" href="${esc(base)}/admin?tab=ajustes">Listo, ya la copié</a></section>`);

export const login = (base, msg = "") => page("Entrar a Taplog", `<section class="win" style="max-width:400px;margin:14vh auto 0;display:block;min-height:0;padding:30px">
  <div class="brand" style="padding:0 0 18px">${MARK}Taplog</div>
  ${msg ? `<p style="color:var(--bad);margin:0 0 14px">${esc(msg)}</p>` : '<p class="hint" style="margin:0 0 14px">Entrá con la clave del tablero.</p>'}
  <form method="post" action="${esc(base)}/admin/login" style="display:grid;gap:14px"><label>Clave<input name="token" type="password" required autocomplete="current-password"></label><button class="btn" type="submit">Entrar</button></form>
  <p class="hint" style="margin:18px 0 0">¿Solo querés ver cómo funciona? <a href="${esc(base)}/demo" style="color:var(--menta)">Abrí la demo</a>.</p></section>`);

export const notFound = (home) => page("Este link no existe", `<section class="win" style="max-width:520px;margin:20vh auto 0;display:block;min-height:0;padding:30px;text-align:center"><h1 style="font:800 30px var(--display);letter-spacing:-.03em;margin:0 0 10px">Este link no existe.</h1><p style="margin:0;color:var(--muted)">Revisá que esté bien escrito o andá a <a href="${esc(home)}" style="color:var(--menta)">${esc(home.replace(/^https?:\/\//, ""))}</a>.</p></section>`);
