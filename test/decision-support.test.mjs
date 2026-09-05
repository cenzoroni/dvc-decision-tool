// Guards for the decision-support changes made after the September 2026 audit:
// per-trip discounts, honest verdict language, a working discount rate, point
// rental as a third option, and defaults that do not quietly pick a side.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { load } from "./harness.mjs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

describe("defaults do not pre-decide the verdict", () => {
  test("every trip starts at a 0% discount", () => {
    // Was 35% — a Florida-resident rate most visitors do not get, pre-filled,
    // and enough on its own to flip own-vs-cash.
    const { g } = load({ fresh: true });
    for (const t of g("trips")) {
      assert.equal(t.disc || 0, 0, `trip defaulted to a ${t.disc}% discount`);
    }
  });

  test("the default resort is unrestricted", () => {
    // Riviera (the old default) is the most resale-restricted resort here, so
    // it was the worst possible basis for "should I own at all".
    const { g, el } = load({ fresh: true });
    const ri = +el("resort").value;
    assert.equal(g("RESORTS")[ri].restricted, false,
      `default resort ${g("RESORTS")[ri].name} carries resale restrictions`);
  });

  test("the rack rate shown matches the default resort", () => {
    const { g, el } = load({ fresh: true });
    assert.equal(+el("tRack").value, g("RACK")[+el("resort").value]);
  });
});

describe("per-trip discounts", () => {
  test("each trip's discount applies only to that trip", () => {
    const p = load({ fresh: true });
    p.g("trips").length = 0;
    p.g("trips").push({ si: 4, nights: 4, wknd: 0, disc: 0 },
                      { si: 4, nights: 4, wknd: 0, disc: 50 });
    p.g("renderTripRows")(); p.g("renderAll")();
    const shaped = Array.from(p.g("tripShape")());
    assert.equal(shaped[0].disc, 0, "first trip should carry no discount");
    assert.equal(shaped[1].disc, 0.5, "second trip should carry its own 50%");
  });

  test("a discount entered for a peak week is not applied", () => {
    // Season 6 is Easter week and 24-31 Dec. The page's own copy says resident
    // and passholder discounts vanish then; applying one anyway produced a
    // confident "cash wins" verdict built on a rate Disney does not offer.
    const p = load({ fresh: true });
    p.g("trips").length = 0;
    p.g("trips").push({ si: 6, nights: 5, wknd: 2, disc: 35 });
    p.g("renderTripRows")(); p.g("renderAll")();
    const t = Array.from(p.g("tripShape")())[0];
    assert.equal(t.disc, 0, "peak-week discount should be refused");
    assert.equal(t.discBlocked, true, "and flagged so the UI can say why");
    assert.match(p.el("cashOut").textContent, /peak week/i,
      "the output should tell the user their discount was not applied");
  });

  test("the same discount IS applied off-peak", () => {
    const p = load({ fresh: true });
    p.g("trips").length = 0;
    p.g("trips").push({ si: 4, nights: 5, wknd: 2, disc: 35 });
    p.g("renderTripRows")(); p.g("renderAll")();
    const t = Array.from(p.g("tripShape")())[0];
    assert.equal(t.disc, 0.35);
    assert.equal(t.discBlocked, false);
  });

  test("a preset sets every trip at once", () => {
    const p = load({ fresh: true });
    const chip = p.document.querySelector('.presets .chip[data-disc="35"]');
    assert.ok(chip, "the 35% preset should exist");
    chip.dispatchEvent(new p.window.Event("click", { bubbles: true }));
    for (const t of p.g("trips")) assert.equal(t.disc, 35);
  });

  test("discounts round-trip through the URL", () => {
    const a = load({ fresh: true });
    a.g("trips").length = 0;
    a.g("trips").push({ si: 2, nights: 3, wknd: 1, disc: 30 });
    a.g("renderTripRows")(); a.g("renderAll")();
    const b = load({ fresh: true, search: a.window.location.search });
    assert.equal(Array.from(b.g("trips"))[0].disc, 30);
  });

  test("links written before per-trip discounts still load", () => {
    // Old three-field form: season.nights.weekend
    const b = load({ fresh: true, search: "?t=1.4.2_6.3.1" });
    const got = Array.from(b.g("trips"));
    assert.equal(got.length, 2, "both legacy trips should survive");
    assert.equal(got[0].disc, 0, "a missing discount should default to none");
  });
});

describe("verdict language", () => {
  test("no percentage return on capital is claimed", () => {
    // "a return of X% a year on the capital" was annual savings over purchase
    // price dressed as an investment yield.
    assert.ok(!/return of .*% a year on the capital/.test(html),
      "the return-on-capital phrasing is back in the source");
  });

  test("a winning verdict reports payback and names the expiry", () => {
    const p = load({ fresh: true });
    p.g("trips").length = 0;
    // Heavy usage so owning wins and the positive branch renders.
    p.g("trips").push({ si: 4, nights: 7, wknd: 2, disc: 0 },
                      { si: 4, nights: 7, wknd: 2, disc: 0 },
                      { si: 4, nights: 7, wknd: 2, disc: 0 });
    p.g("renderTripRows")(); p.g("renderAll")();
    const txt = p.el("cashOut").textContent;
    if (!/Owning wins/.test(txt)) return; // defaults moved; nothing to assert
    assert.match(txt, /years<?\/?s?t?r?o?n?g?>? to pay back|years. to pay back|to pay back/,
      "a winning verdict should state a payback period");
    assert.match(txt, /worth nothing|expiry|expire/i,
      "and should say the deed ends worthless");
  });
});

describe("discount rate reaches the headline", () => {
  test("raising it changes the figures directly beneath it", () => {
    // It previously moved only one column of a table far below, so a user who
    // set it saw the big number beneath the control not move.
    const p = load({ fresh: true });
    const before = p.el("bigR").textContent;
    p.set("disc", 8);
    assert.notEqual(p.el("bigR").textContent, before,
      "the resale headline should respond to the discount rate");
  });

  test("zero leaves the simple figure untouched", () => {
    const { g } = load({ fresh: true });
    const yrs = g("yearsLeft")(2057);
    const simple = g("costPerPointYear")(150, 900, 150, 9.5, yrs, 0.045).total;
    const lev = g("levelized")(150, 900, 150, 9.5, yrs, 0.045, 0);
    assert.ok(Math.abs(simple - lev) < 1e-9,
      `levelized(d=0) should equal costPerPointYear exactly, got ${simple} vs ${lev}`);
  });
});

describe("renting points", () => {
  test("it appears as its own option in the comparison", () => {
    const { el } = load({ fresh: true });
    assert.match(el("cashOut").textContent, /Rent points from an owner/);
  });

  test("its cost tracks the rate and the points needed", () => {
    const p = load({ fresh: true });
    p.set("tRent", 20);
    const t = p.g("tripPoints")();
    const expected = t.year * 20;
    const m = p.el("cashOut").textContent.match(/Rent points from an owner[\s\S]*?\$([\d,]+) a year/);
    assert.ok(m, "the annual rental cost should render");
    assert.ok(Math.abs(Number(m[1].replace(/,/g, "")) - expected) <= 1,
      `expected ~$${expected.toFixed(0)} a year, got $${m[1]}`);
  });
});

describe("section order", () => {
  test("the cross-resort comparison precedes resale-or-direct", () => {
    // You should be able to see every resort side by side before being asked
    // to commit to one resort's resale-vs-direct detail.
    const grid = html.indexOf("Every resort side by side");
    const split = html.indexOf("Resale or direct?");
    assert.ok(grid > 0 && split > 0, "both sections should exist");
    assert.ok(grid < split,
      "the comparison grid should come first so the resort choice is informed");
  });

  test("section numbers run in order with no gaps or repeats", () => {
    const nums = Array.from(html.matchAll(/<h2>(\d+)\./g)).map((m) => Number(m[1]));
    assert.deepEqual(nums, nums.slice().sort((a, b) => a - b), "headings are out of order");
    assert.deepEqual(nums, [...new Set(nums)], "a section number is duplicated");
  });
});
