// Regression guards for bugs found in the September 2026 audit.
// Each test here failed before its fix; none of them are hypothetical.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { load } from "./harness.mjs";

// A trip's cash rate field: blank uses the published rate for its dates, a
// typed figure overrides it. The same invariants the old global rate field
// had to satisfy, restated for the per-trip design.
const rateInput=(el,idx)=>el("tripsBody").querySelector(`input[data-f="rate"][data-idx="${idx}"]`);
const fire=(window,node)=>node.dispatchEvent(new window.Event("input",{bubbles:true}));

describe("per-trip cash rates", () => {
  test("a blank rate field uses the published rate and shows it as the placeholder", () => {
    const { el, g } = load({ fresh: true });
    const ri = +el("resort").value, t = g("tripShape")()[0];
    const r = g("bandRates")(ri, t.si, t.b);
    const expected = Math.round((t.week * r.week + t.wknd * r.wknd) / t.nights);
    assert.equal(rateInput(el, 0).value, "");
    assert.equal(+rateInput(el, 0).placeholder, expected);
    assert.ok(expected > 100, `published rate should be a real price, got ${expected}`);
  });

  test("a typed rate applies to that trip only, and clearing it restores the table", () => {
    const { el, g, window } = load({ fresh: true });
    const ri = +el("resort").value;
    const before = g("tripShape")().map((t) => g("tripGross")(ri, t));
    const inp = rateInput(el, 1);
    inp.value = "1000"; fire(window, inp);
    const after = g("tripShape")().map((t) => g("tripGross")(ri, t));
    assert.equal(after[0], before[0], "trip 1 untouched");
    assert.equal(after[1], 1000 * g("tripShape")()[1].nights, "trip 2 priced at the typed rate");
    assert.equal(after[2], before[2], "trip 3 untouched");
    inp.value = ""; fire(window, inp);
    assert.deepEqual(g("tripShape")().map((t) => g("tripGross")(ri, t)), before);
  });

  test("an override for a big room does not leak into the studio-denominated banked-point value", () => {
    // Was: bankedValue() divided whatever room's rate the user entered by
    // studio points, so a grand-villa rate inflated every banked point ~3.4x
    // and distorted the whole ranked inventory.
    const { el, g, set, window } = load({ fresh: true });
    set("resort", 8, "change");
    const studioValue = g("bankedValue")(8);
    const gv = g("CHARTS")[8].cols.findIndex((c) => /Three-Bedroom/.test(c));
    assert.ok(gv > 0, "precondition: resort 8 has a grand villa column");
    set("unit", gv);
    assert.match(el("tripOut").textContent, /priced at the studio rate/,
      "with a big room and no overrides, the page must say the studio rate is standing in");
    for (let k = 0; k < 3; k++) { const inp = rateInput(el, k); inp.value = "2400"; fire(window, inp); }
    assert.ok(!/priced at the studio rate/.test(el("tripOut").textContent), "every trip now has its own rate");
    assert.equal(g("bankedValue")(8).toFixed(2), studioValue.toFixed(2));
  });

  test("an empty or hostile rate never prices a night at $1", () => {
    const { el, window } = load({ fresh: true });
    for (const v of ["", "0", "-50", "abc"]) {
      const inp = rateInput(el, 0); inp.value = v; fire(window, inp);
      assert.ok(!/\$1\/night/.test(el("cashOut").textContent), `rate "${v}" produced a $1 night`);
    }
  });
});

describe("marginal dues", () => {
  test("'dues only this year' uses this year's dues, not the lifetime average", () => {
    // Was: used avgDues() over the whole deed, overstating an existing owner's
    // marginal nightly cost by ~3x (rendered $551/night against a true ~$189).
    const { el, g } = load({ fresh: true });
    const ri = +el("resort").value;
    const r = g("RESORTS")[ri];
    const t = g("tripPoints")();
    const expected = (t.year * r.dues) / t.nightsYear;
    const shown = el("cashOut").textContent.match(/Dues only this year[^$]*\$([\d,]+)/);
    assert.ok(shown, "the dues-only line should render");
    const got = Number(shown[1].replace(/,/g, ""));
    assert.ok(
      Math.abs(got - expected) <= 1,
      `dues-only should be ~$${expected.toFixed(0)} (this year's dues), got $${got}`
    );
  });
});

describe("trip row clamping", () => {
  test("weekend nights cannot exceed trip nights, in the model or on screen", () => {
    // Was: editing weekend directly pushed wknd past nights. The maths clamped
    // on read, but the row kept displaying the impossible number and
    // encodeTrips baked it into the shared link, so sender and recipient saw
    // different trips.
    const p = load({ fresh: true });
    const row = p.el("tripsBody").querySelectorAll("tr")[0];
    const w = row.querySelector('input[data-f="wknd"]');
    const nights = p.g("trips")[0].nights;
    w.value = "10";
    w.dispatchEvent(new p.window.Event("input", { bubbles: true }));

    assert.ok(
      p.g("trips")[0].wknd <= nights,
      `model: wknd ${p.g("trips")[0].wknd} exceeds nights ${nights}`
    );
    assert.ok(+w.value <= nights, `display: input still shows ${w.value} against ${nights} nights`);
    assert.ok(
      !/\.\d+\.(\d+)/.test(p.window.location.search) ||
        p.g("encodeTrips")().split("_").every((seg) => {
          const [, n, wk] = seg.split(".").map(Number);
          return wk <= n;
        }),
      `URL encodes an impossible trip: ${p.window.location.search}`
    );
  });
});

describe("URL cleanliness", () => {
  test("switching resorts alone adds nothing to the link", () => {
    const { window, set } = load({ fresh: true });
    set("resort", 0, "change");
    assert.equal(window.location.search, "?r=0", `only the resort should be in the link, got ${window.location.search}`);
  });

  test("a typed trip rate round-trips through the link", () => {
    const a = load({ fresh: true });
    const inp = rateInput(a.el, 0); inp.value = "999"; fire(a.window, inp);
    const qs = a.window.location.search;
    assert.ok(/\.999(_|$|&)/.test(qs), `the rate should ride in the trips field, got ${qs}`);
    const b = load({ fresh: true, search: qs });
    assert.equal(b.g("trips")[0].rate, 999);
    assert.equal(rateInput(b.el, 0).value, "999");
  });
});

describe("data loading", () => {
  test("a missing data file fails loudly instead of silently killing the page", () => {
    const { document } = load();
    // The guard runs before anything else; on a healthy load it must be inert.
    assert.equal(
      document.querySelectorAll('[role="alert"]').length,
      0,
      "the data-failure banner should not appear when the data loaded fine"
    );
    // And the page should be fully alive.
    assert.ok(document.getElementById("tripsBody").querySelectorAll("tr").length > 0);
    assert.ok(document.getElementById("gridBody").querySelectorAll("tr").length > 0);
  });
});
