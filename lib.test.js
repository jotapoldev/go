import assert from "node:assert/strict";
import { test } from "node:test";
import { device, isBot, source, validCode, validTarget, visitSource } from "./lib.js";

const IG = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 341.0.0.25.97";
const TT = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36 trill_340 BytedanceWebview/d8a21c6 musical_ly_2023";

test("source: reconoce el navegador de cada app y el referer", () => {
  assert.equal(source(IG), "instagram");
  assert.equal(source(TT), "tiktok");
  assert.equal(source("Mozilla/5.0 Chrome/124", "https://www.linkedin.com/feed/"), "linkedin");
  assert.equal(source("Mozilla/5.0 Chrome/124", "https://news.ycombinator.com/item?id=1"), "news.ycombinator.com");
  assert.equal(source("Mozilla/5.0 Chrome/124", ""), "directo");
});

test("device e isBot", () => {
  assert.equal(device(IG), "celular");
  assert.equal(device("Mozilla/5.0 (Windows NT 10.0) Chrome/124"), "computadora");
  assert.ok(isBot("facebookexternalhit/1.1"));
  assert.ok(isBot("WhatsApp/2.23.20"));
  assert.ok(isBot(""));
  assert.ok(!isBot(IG));
});

test("validación de códigos y destinos", () => {
  assert.ok(validCode("09"));
  assert.ok(validCode("reel-tradelearn"));
  assert.ok(!validCode("Admin"));
  assert.ok(!validCode("-x"));
  assert.ok(validTarget("https://github.com/jotapoldev/shiplog"));
  assert.ok(!validTarget("javascript:alert(1)"));
});

test("visitSource: utm manda, navegación interna aparte, Google por referer", () => {
  assert.equal(visitSource("Mozilla/5.0 Chrome", "", "?utm_source=Newsletter", "jotapol.com"), "newsletter");
  assert.equal(visitSource("Mozilla/5.0 Chrome", "https://jotapol.com/", "", "jotapol.com"), "interno");
  assert.equal(visitSource("Mozilla/5.0 Chrome", "https://www.google.com/", "", "jotapol.com"), "google");
  assert.equal(visitSource(IG, "", "", "shiplog.jotapol.com"), "instagram");
});
