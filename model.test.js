import assert from "node:assert/strict";
import { test } from "node:test";
import { model, trend } from "./model.js";

test("trend: subiendo, estable, bajando", () => {
  assert.equal(trend(120, 100).key, "up");
  assert.equal(trend(105, 100).key, "flat");
  assert.equal(trend(70, 100).key, "down");
  assert.equal(trend(5, 0).key, "up");
  assert.equal(trend(0, 0).key, "quiet");
});

test("model: suma por período, compara con el anterior y filtra por sitio", () => {
  const raw = {
    daily: [
      { site: "web", day: "2026-10-06", n: 10 }, { site: "web", day: "2026-10-05", n: 5 },
      { site: "web", day: "2026-09-29", n: 4 }, // semana anterior
      { site: "shiplog", day: "2026-10-06", n: 3 },
    ],
    pages: [{ site: "web", path: "/", n: 15 }, { site: "shiplog", path: "/ramas", n: 3 }],
    pageDaily: [{ site: "web", path: "/", day: "2026-10-06", n: 10 }],
    sources: [{ site: "web", source: "instagram", n: 9 }, { site: "web", source: "directo", n: 3 }, { site: "shiplog", source: "github", n: 2 }],
    devices: [{ site: "web", device: "celular", n: 12 }],
  };
  const all = model(raw, { today: "2026-10-06", period: 7 });
  assert.equal(all.total, 18);
  assert.equal(all.prev, 4);
  assert.equal(all.sites.find((s) => s.id === "web").visits, 15);
  assert.equal(all.topSource.source, "instagram");
  const web = model(raw, { today: "2026-10-06", period: 7, site: "web" });
  assert.equal(web.total, 15);
  assert.deepEqual(web.pages.map((p) => p.path), ["/"]);
  assert.equal(web.entries, 12);
});
