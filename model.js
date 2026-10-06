// Arma lo que muestra el tablero a partir de agregados (de la base o de la demo). Sin I/O: se prueba en model.test.js.

/** Sitios de jotapol (la cuenta dueña). Se siembran en la tabla `sites`; la demo los usa tal cual. */
export const SITES = [
  { id: "web", name: "jotapol.com", host: "jotapol.com", note: "Portafolio del estudio", color: "#3B2FD6", ini: "Jp" },
  { id: "shiplog", name: "Shiplog", host: "shiplog.jotapol.com", note: "shiplog.jotapol.com", color: "#0E9F92", ini: "Sl" },
  { id: "trading", name: "TradeLearn", host: "trading.jotapol.com", note: "trading.jotapol.com", color: "#C2458F", ini: "Tl" },
  { id: "llaves", name: "Llaves", host: "llaves.jotapol.com", note: "llaves.jotapol.com", color: "#DB7429", ini: "Ll" },
];
export const siteById = (id) => SITES.find((s) => s.id === id);

const sum = (a) => a.reduce((x, y) => x + y, 0);
const addDays = (day, n) => new Date(Date.parse(day + "T00:00:00Z") + n * 864e5).toISOString().slice(0, 10);
export const lastDays = (today, n) => Array.from({ length: n }, (_, i) => addDays(today, i - n + 1));

/** Estado de un sitio comparando el período contra el anterior. */
export function trend(now, prev) {
  if (!now && !prev) return { key: "quiet", label: "Sin visitas" };
  if (!prev) return { key: "up", label: "Primeras visitas" };
  const d = (now - prev) / prev;
  if (d >= 0.15) return { key: "up", label: "Subiendo" };
  if (d <= -0.15) return { key: "down", label: "Bajando" };
  return { key: "flat", label: "Estable" };
}

/**
 * raw: { daily: [{site, day, n}], pages: [{site, path, n}], pageDaily: [{site, path, day, n}],
 *        sources: [{site, source, n}], devices: [{site, device, n}] }
 * period: días a mirar (1, 7 o 30). site: id para ver un solo sitio, o null para todos.
 * sites: los sitios de la cuenta; lo de otros sitios en `raw` se ignora.
 */
export function model(raw, { today, period = 7, site = null, sites: list = SITES }) {
  const days = lastDays(today, period), prevDays = lastDays(addDays(today, -period), period);
  const days30 = lastDays(today, 30), days14 = lastDays(today, 14);
  const ids = new Set(list.map((s) => s.id)), byId = (id) => list.find((s) => s.id === id);
  if (site && !ids.has(site)) site = null;
  const inSite = (r) => ids.has(r.site) && (!site || r.site === site);
  const dayMap = new Map(raw.daily.map((r) => [`${r.site}|${r.day}`, r.n]));
  const count = (id, ds) => sum(ds.map((d) => dayMap.get(`${id}|${d}`) ?? 0));

  const sites = list.map((s) => {
    const visits = count(s.id, days), prev = count(s.id, prevDays);
    return { ...s, visits, prev, trend: trend(visits, prev), spark: days14.map((d) => dayMap.get(`${s.id}|${d}`) ?? 0) };
  });
  const shown = site ? sites.filter((s) => s.id === site) : sites;
  const total = sum(shown.map((s) => s.visits)), prev = sum(shown.map((s) => s.prev));
  const series30 = days30.map((d) => sum(shown.map((s) => dayMap.get(`${s.id}|${d}`) ?? 0)));

  const pd = new Map(raw.pageDaily.map((r) => [`${r.site}|${r.path}|${r.day}`, r.n]));
  const pages = raw.pages.filter(inSite).sort((a, b) => b.n - a.n).slice(0, site ? 8 : 6)
    .map((p) => ({ ...p, site: byId(p.site), spark: days14.map((d) => pd.get(`${p.site}|${p.path}|${d}`) ?? 0) }));

  const bySource = new Map();
  for (const r of raw.sources.filter(inSite)) bySource.set(r.source, (bySource.get(r.source) ?? 0) + r.n);
  const sources = [...bySource].map(([source, n]) => ({ source, n })).sort((a, b) => b.n - a.n);
  const entries = sum(sources.map((s) => s.n));
  const byDevice = new Map();
  for (const r of raw.devices.filter(inSite)) byDevice.set(r.device, (byDevice.get(r.device) ?? 0) + r.n);
  const devices = [...byDevice].map(([device, n]) => ({ device, n })).sort((a, b) => b.n - a.n);

  return {
    period, site: site ? byId(site) : null, sites, total, prev,
    delta: prev ? Math.round(((total - prev) / prev) * 100) : null,
    days30, series30, pages, sources, entries, devices,
    topSource: sources[0] ? { ...sources[0], share: entries ? sources[0].n / entries : 0 } : null,
  };
}
