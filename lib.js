// Lógica pura (sin servidor ni base): de dónde viene un clic y validación de links. Se prueba en lib.test.js.

/** Origen del clic según el navegador que abre el link (las apps abren su propio navegador y se delatan en el user-agent). */
export function source(ua = "", referer = "") {
  const u = ua.toLowerCase();
  if (u.includes("instagram")) return "instagram";
  if (u.includes("musical_ly") || u.includes("tiktok") || u.includes("bytedance")) return "tiktok";
  if (u.includes("fban") || u.includes("fbav") || u.includes("fb_iab")) return "facebook";
  if (u.includes("linkedinapp")) return "linkedin";
  if (u.includes("twitter")) return "x";
  if (u.includes("whatsapp")) return "whatsapp";
  let host = "";
  try { host = new URL(referer).hostname.replace(/^www\./, ""); } catch {}
  if (host) {
    if (/(^|\.)instagram\.com$/.test(host)) return "instagram";
    if (/(^|\.)(t\.co|x\.com|twitter\.com)$/.test(host)) return "x";
    if (/(^|\.)linkedin\.com$|(^|\.)lnkd\.in$/.test(host)) return "linkedin";
    if (/(^|\.)github\.com$/.test(host)) return "github";
    if (/(^|\.)google\.[a-z.]+$/.test(host)) return "google";
    if (/(^|\.)(facebook\.com|l\.facebook\.com|fb\.me)$/.test(host)) return "facebook";
    return host;
  }
  return "directo";
}

export const device = (ua = "") => (/mobile|android|iphone|ipad/i.test(ua) ? "celular" : "computadora");

/** Previsualizaciones de links y crawlers: no son visitas de personas. */
export const isBot = (ua = "") => !ua || /bot|crawl|spider|preview|facebookexternalhit|whatsapp\/|slackbot|discordbot|telegrambot|curl|wget|python|node-fetch|headless/i.test(ua);

/** Código corto: minúsculas, números y guiones, 1 a 40 caracteres. */
export const validCode = (c) => /^[a-z0-9][a-z0-9-]{0,39}$/.test(c);

/** Solo destinos http(s). */
export function validTarget(t) {
  try { return ["http:", "https:"].includes(new URL(t).protocol); } catch { return false; }
}

/**
 * Origen de una visita a uno de los sitios: utm_source del link manda; si no, la app o la página anterior.
 * Navegar dentro del mismo sitio es "interno" (no cuenta como entrada).
 */
export function visitSource(ua = "", referer = "", search = "", siteHost = "") {
  const utm = new URLSearchParams(search).get("utm_source");
  if (utm && /^[\w.-]{1,40}$/.test(utm)) return utm.toLowerCase();
  let host = "";
  try { host = new URL(referer).hostname.replace(/^www\./, ""); } catch {}
  if (host && siteHost && host === siteHost) return "interno";
  return source(ua, referer);
}
