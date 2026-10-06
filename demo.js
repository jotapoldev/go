// Datos inventados para la demo pública (jotapol.com/r/demo), en el mismo formato que salen de la base.
// Deterministas: la demo siempre se ve igual.
import { lastDays } from "./model.js";

const PAGES = {
  web: [["/", 0.62], ["/#proyectos", 0.24], ["/#contacto", 0.08], ["/#clientes", 0.06]],
  shiplog: [["/", 0.56], ["/ramas", 0.3], ["/pendientes", 0.08], ["/buscar", 0.06]],
  trading: [["/", 0.44], ["/portfolio", 0.26], ["/learn", 0.18], ["/bot", 0.12]],
  llaves: [["/", 0.7], ["/sala/AB12", 0.3]],
};
const MIX = {
  web: [["instagram", 0.58], ["directo", 0.2], ["linkedin", 0.12], ["google", 0.1]],
  shiplog: [["github", 0.38], ["instagram", 0.34], ["directo", 0.16], ["google", 0.12]],
  trading: [["instagram", 0.62], ["directo", 0.22], ["google", 0.16]],
  llaves: [["directo", 0.7], ["instagram", 0.3]],
};
// Base diaria y picos (días atrás → visitas extra), como cuando sale un post.
const SHAPE = { web: [22, { 2: 30, 9: 18 }], shiplog: [9, { 3: 34, 4: 18, 16: 12 }], trading: [7, { 6: 21, 7: 11 }], llaves: [3, { 12: 9 }] };

function rnd(seed) { let h = 2166136261; for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 2 ** 32); }

export function demoRaw(today, period = 30) {
  const days = lastDays(today, 60);
  const raw = { daily: [], pages: [], pageDaily: [], sources: [], devices: [] };
  for (const [site, [base, peaks]] of Object.entries(SHAPE)) {
    const r = rnd(site);
    const series = days.map((_, i) => { const ago = days.length - 1 - i; return Math.round(base * (0.75 + r() * 0.5) + (peaks[ago] ?? 0) + (peaks[ago + 1] ?? 0) * 0.4); });
    days.forEach((day, i) => raw.daily.push({ site, day, n: series[i] }));
    const recent = series.slice(-period).reduce((a, b) => a + b, 0);
    for (const [path, f] of PAGES[site]) {
      raw.pages.push({ site, path, n: Math.round(recent * f) });
      days.slice(-14).forEach((day, i) => raw.pageDaily.push({ site, path, day, n: Math.round(series[series.length - 14 + i] * f) }));
    }
    for (const [source, f] of MIX[site]) raw.sources.push({ site, source, n: Math.round(recent * 0.7 * f) });
    raw.devices.push({ site, device: "celular", n: Math.round(recent * 0.81) }, { site, device: "computadora", n: Math.round(recent * 0.19) });
  }
  return raw;
}

export const demoLinks = [
  { code: "09", label: "09 · Shiplog v0.2.0", targetShort: "github.com/jotapoldev/shiplog", clicks: 116, reach: 2310, saves: 96, shares: 41, sources: [{ source: "instagram", n: 102 }, { source: "directo", n: 14 }] },
  { code: "reel-tl", label: "Reel TradeLearn", targetShort: "trading.jotapol.com", clicks: 223, reach: 4870, saves: 132, shares: 77, sources: [{ source: "instagram", n: 170 }, { source: "tiktok", n: 53 }] },
];
