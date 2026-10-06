// Datos inventados para la demo pública (jotapol.com/r/demo). Deterministas: la demo siempre se ve igual.
const POSTS = [
  { code: "09", label: "09 · Shiplog v0.2.0", target: "github.com/jotapoldev/shiplog", start: 4, peak: 34, reach: 2310, saves: 96, shares: 41, mix: { instagram: 0.62, linkedin: 0.18, x: 0.08, directo: 0.12 } },
  { code: "reel-tl", label: "Reel · TradeLearn", target: "trading.jotapol.com", start: 9, peak: 51, reach: 4870, saves: 132, shares: 77, mix: { instagram: 0.71, tiktok: 0.19, directo: 0.1 } },
  { code: "02", label: "02 · Mi git me delató", target: "github.com/jotapoldev/shiplog", start: 22, peak: 27, reach: 1640, saves: 88, shares: 23, mix: { instagram: 0.8, x: 0.06, directo: 0.14 } },
  { code: "bio", label: "Link de la bio", target: "jotapol.com", start: 29, peak: 9, reach: null, saves: null, shares: null, mix: { instagram: 0.9, directo: 0.1 } },
];

function rnd(seed) { let h = 2166136261; for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 2 ** 32); }

export function demoData(now = new Date()) {
  const days = Array.from({ length: 30 }, (_, i) => new Date(now.getTime() - (29 - i) * 864e5).toISOString().slice(0, 10));
  const rows = POSTS.map((p) => {
    const r = rnd(p.code);
    // Pico el día que sale el post (hace `start` días) y cola que baja; ruido pequeño.
    const series = days.map((_, i) => { const t = 29 - p.start; const k = i - t; return k < 0 ? 0 : Math.round(p.peak * Math.exp(-k / 4) + r() * 2); });
    const clicks = series.reduce((a, b) => a + b, 0);
    // El último origen se lleva el resto, así la suma siempre da el total.
    const entries = Object.entries(p.mix);
    let left = clicks;
    const sources = entries.map(([source, f], i) => { const n = i === entries.length - 1 ? left : Math.round(clicks * f); left -= n; return { source, n }; }).sort((a, b) => b.n - a.n);
    return { code: p.code, label: p.label, targetShort: p.target, clicks, daily14: series.slice(-14), series, sources, reach: p.reach, saves: p.saves, shares: p.shares };
  });
  const daily30 = days.map((_, i) => rows.reduce((s, r) => s + r.series[i], 0));
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const bySrc = new Map();
  for (const r of rows) for (const s of r.sources) bySrc.set(s.source, (bySrc.get(s.source) ?? 0) + s.n);
  const total = sum(rows.map((r) => r.clicks));
  return {
    days30: days, daily30, rows, total,
    week: sum(daily30.slice(-7)), prevWeek: sum(daily30.slice(-14, -7)),
    reach: sum(rows.map((r) => r.reach ?? 0)),
    sources: [...bySrc].map(([source, n]) => ({ source, n })).sort((a, b) => b.n - a.n),
    devices: [{ device: "celular", n: Math.round(total * 0.83) }, { device: "computadora", n: total - Math.round(total * 0.83) }],
  };
}
