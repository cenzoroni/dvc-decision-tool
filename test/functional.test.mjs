// Functional/render tests for the DVC calculator (index.html).
//
// These run the shipped page in jsdom via test/harness.mjs and drive the
// real form controls, exactly as a user would. There is no separate copy
// of the pricing logic to test against — the page IS the thing under test.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { load, assertNoBadNumbers, BAD_NUMBERS } from "./harness.mjs";

// Render targets checked throughout. `verdict`, `tripOut`, `cashOut`, `gridBody`,
// `rankBody`, `mtxHead`, `mtxBody`, `stayOut`, `whenBody` and `#rooms` (the
// "resort reference"/resortList area) cover every section of the page that
// renders numbers derived from user input.
const TARGETS = [
  "tripOut", "cashOut", "gridBody", "rankBody",
  "mtxHead", "mtxBody", "stayOut", "whenHead", "whenBody", "verdict",
];

function assertPageClean(el, context) {
  for (const id of TARGETS) {
    const node = el(id);
    if (!node) continue;
    assertNoBadNumbers(node.innerHTML, `${context} -> #${id}`);
  }
  const rooms = el("rooms");
  if (rooms) assertNoBadNumbers(rooms.innerHTML, `${context} -> #rooms`);
}

// ---------------------------------------------------------------------------
// 1. Render sweep: every resort x every room/view column, plus every
//    mMode x mPat display-mode combination, plus a sampled wMode/wCols pass.
//
// Coverage actually achieved:
//   - Resort x column: FULL sweep. All 12 resorts, all 92 room/view columns
//     total (14+11+3+7+3+5+4+17+8+9+10+1), driven through the real `resort`
//     and `unit` selects. After each, every render target above (which
//     includes the "What the contract buys" matrix, covering every column
//     and every one of the 7 seasons in a single render) is checked.
//   - mMode x mPat: FULL cross product (5 x 3 = 15) for every one of the 12
//     resorts (180 renders total) — cheap enough not to need sampling.
//   - wMode x wCols (the "When to go" section): sampled. Full 4 x 2 = 8
//     cross product is driven, but only for 3 representative resorts
//     (index 0 Animal Kingdom Villas, index 8 Riviera Resort — the default,
//     and index 11 The Cabins at Fort Wilderness — the one resort with
//     resale:null, which exercises the "no resale market" code paths).
//     wStart is left at its default ("weekday of my date") for this pass
//     rather than crossed in, since it does not gate a distinct code path
//     from wCols/wMode — it only changes which rows are populated.
// ---------------------------------------------------------------------------
describe("render sweep: resort x room column x display mode", () => {
  test("every resort x every room/view column renders with no bad numbers", () => {
    const { el, g, set } = load({ fresh: true });
    const RESORTS = g("RESORTS");
    const CHARTS = g("CHARTS");
    assert.equal(RESORTS.length, 12, "expected 12 resorts");

    let comboCount = 0;
    for (let ri = 0; ri < RESORTS.length; ri++) {
      set("resort", ri, "change");
      const cols = CHARTS[ri].cols;
      for (let ci = 0; ci < cols.length; ci++) {
        set("unit", ci);
        comboCount++;
        assertPageClean(el, `resort=${ri}(${RESORTS[ri].name}) col=${ci}(${cols[ci]})`);
      }
    }
    assert.equal(comboCount, 92, "expected 92 total resort x column combinations swept");
  });

  test("every resort x every mMode x mPat combination renders with no bad numbers", () => {
    const { el, g, set } = load({ fresh: true });
    const RESORTS = g("RESORTS");
    const mModes = [...el("mMode").options].map((o) => o.value);
    const mPats = [...el("mPat").options].map((o) => o.value);
    assert.equal(mModes.length, 5, "expected 5 mMode options");
    assert.equal(mPats.length, 3, "expected 3 mPat options");

    let comboCount = 0;
    for (let ri = 0; ri < RESORTS.length; ri++) {
      set("resort", ri, "change");
      for (const mMode of mModes) {
        for (const mPat of mPats) {
          set("mMode", mMode);
          set("mPat", mPat);
          comboCount++;
          assertNoBadNumbers(
            el("mtxHead").innerHTML + el("mtxBody").innerHTML,
            `resort=${ri} mMode=${mMode} mPat=${mPat} -> #mtxHead/#mtxBody`
          );
        }
      }
    }
    assert.equal(comboCount, 12 * 5 * 3, "expected full 180-combination mode sweep");
  });

  test("sampled wMode x wCols sweep for 3 representative resorts renders with no bad numbers", () => {
    const { el, g, set } = load({ fresh: true });
    const wModes = [...el("wMode").options].map((o) => o.value);
    const wCols = [...el("wCols").options].map((o) => o.value);
    assert.equal(wModes.length, 4, "expected 4 wMode options");
    assert.equal(wCols.length, 2, "expected 2 wCols options");

    // Index 0: Animal Kingdom Villas. Index 8: Riviera Resort (page default).
    // Index 11: The Cabins at Fort Wilderness, the only resale:null resort.
    const sampleResorts = [0, 8, 11];
    for (const ri of sampleResorts) {
      set("resort", ri, "change");
      for (const wMode of wModes) {
        for (const wc of wCols) {
          set("wMode", wMode);
          set("wCols", wc);
          assertNoBadNumbers(
            el("whenHead").innerHTML + el("whenBody").innerHTML,
            `resort=${ri} wMode=${wMode} wCols=${wc} -> #whenHead/#whenBody`
          );
          assertNoBadNumbers(el("stayOut").innerHTML, `resort=${ri} wMode=${wMode} wCols=${wc} -> #stayOut`);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Hostile inputs.
// ---------------------------------------------------------------------------
describe("hostile inputs", () => {
  const numericControls = {
    tRack: ["0", "-50", "", "abc", "1e10", "-1e10"],
    tRent: ["0", "-50", "", "abc", "1e10", "-1e10"],
    points: ["0", "-50", "", "abc", "1e10", "-1e10"],
    closeD: ["0", "-50", "", "abc", "1e10", "-1e10"],
    closeR: ["0", "-50", "", "abc", "1e10", "-1e10"],
    disc: ["0", "-50", "", "abc", "1e10", "-1e10"],
    nights: ["0", "-5", "", "abc", "1e10", "-1e10"],
    wMax: ["0", "-5", "", "abc", "1e10", "-1e10"],
    fMin: ["0", "-50", "", "abc", "1e10", "-1e10"],
    fMax: ["0", "-50", "", "abc", "1e10", "-1e10"],
    wBal: ["0", "-50", "", "abc", "1e10", "-1e10"],
  };

  for (const [id, values] of Object.entries(numericControls)) {
    for (const v of values) {
      test(`#${id}="${v}" renders cleanly and does not throw`, () => {
        const { el, set } = load({ fresh: true });
        // points is auto-sized while ptsAuto is checked (the default), which
        // would immediately overwrite any manual value — uncheck it first so
        // the hostile value actually reaches the model.
        if (id === "points") set("ptsAuto", false);
        assert.doesNotThrow(() => set(id, v), `setting #${id}="${v}" should not throw`);
        assertPageClean(el, `${id}=${JSON.stringify(v)}`);
      });
    }
  }

  // Dedicated test for the one hostile value that DOES break the page: see
  // the "known bug" section below for the full repro and explanation.

  const dateValues = ["not-a-date", "2027-02-30", "", "1900-01-01", "2099-12-31"];
  for (const v of dateValues) {
    test(`#checkin="${v}" renders cleanly and does not throw`, () => {
      const { el, set } = load({ fresh: true });
      assert.doesNotThrow(() => set("checkin", v), `setting #checkin="${v}" should not throw`);
      assertPageClean(el, `checkin=${JSON.stringify(v)}`);
    });
  }

  test("hostile checkin value clears to empty rather than a garbage date", () => {
    const { el, set } = load({ fresh: true });
    set("checkin", "not-a-date");
    assert.equal(el("checkin").value, "", "a date input rejects a non-date string and reverts to empty");
    // With no check-in date, the stay calculator should fall back to its
    // prompt message rather than render points for an undefined date.
    assert.match(
      el("stayOut").innerHTML,
      /Pick a check-in date/,
      "with checkin cleared, #stayOut should show the pick-a-date prompt"
    );
  });

  test("negative published rate is clamped to a floor rather than producing negative costs", () => {
    const { el, set } = load({ fresh: true });
    set("tRack", "-9999");
    // renderCash clamps rack to Math.max(1, ...), so cash-side figures must
    // never go negative even when the raw input is deeply negative.
    assertPageClean(el, "tRack=-9999");
    const text = el("cashOut").textContent;
    assert.ok(!/-\$\d/.test(text), "no negative dollar figure should appear in #cashOut for a negative rack rate");
  });

  test("negative discount percent is clamped rather than inflating costs above 100%", () => {
    const { el, set } = load({ fresh: true });
    set("tRent", "-9999");
    assertPageClean(el, "tRent=-9999");
  });
});

// ---------------------------------------------------------------------------
// KNOWN BUG (found by the hostile-input sweep above): the `esc` (dues
// increase per year) field has no upper clamp in JS, even though its HTML
// attribute says max="12". avgDues() compounds `dues * Math.pow(1+g, t)`
// for every year left on the deed; at extreme g this overflows to Infinity
// for both the direct and resale total-cost figures, and renderCalc() then
// computes `D.total - R.total`, i.e. `Infinity - Infinity`, which is NaN.
// That NaN reaches the DOM as the literal text "$NaN" inside #verdict.
//
// Repro:
//   const { el, set } = load({ fresh: true });
//   set("esc", "1e10");   // "far above max" hostile value, valid number format
//   el("verdict").innerHTML  // contains "$NaN" three times
//
// This is left FAILING per instructions — do not weaken or skip it.
// ---------------------------------------------------------------------------
test("BUG: esc=\"1e10\" (far above the documented max of 12) must not leak NaN into #verdict", () => {
  const { el, set } = load({ fresh: true });
  set("esc", "1e10");
  assertNoBadNumbers(el("verdict").innerHTML, 'esc="1e10" -> #verdict');
});

// ---------------------------------------------------------------------------
// 3. Multi-trip model.
// ---------------------------------------------------------------------------
describe("multi-trip model", () => {
  function tripPointsFromDOM(el) {
    // Each .cline is two <span>s: a label and a value. Reading the second
    // <span> directly (rather than the merged textContent) avoids
    // ambiguity when a season label itself ends in digits (e.g. a date
    // range like "Dec 24-31" butting up against a points figure).
    const rows = [...el("tripOut").querySelectorAll(".cline")].map((n) => {
      const spans = n.querySelectorAll("span");
      return { label: spans[0].textContent, value: spans[1].textContent };
    });
    const perTrip = rows
      .filter((r) => /^Trip \d/.test(r.label))
      .map((r) => Number(r.value.replace(/\s*pts$/, "")));
    const totalRow = rows.find((r) => r.label === "Total points per year");
    const total = Number(totalRow.value);
    return { perTrip, total };
  }

  test("adding a trip via #addTrip increases trip count and total points", () => {
    const { el, g, set } = load({ fresh: true });
    set("resort", 8, "change");
    const before = tripPointsFromDOM(el);
    const tripsBefore = g("trips").length;

    el("addTrip").click();

    const after = tripPointsFromDOM(el);
    assert.equal(g("trips").length, tripsBefore + 1, "#addTrip should push exactly one trip onto the trips array");
    assert.equal(after.perTrip.length, tripsBefore + 1, "#tripOut should render one more trip line");
    assert.ok(after.total > before.total, "total points per year should increase after adding a trip");
  });

  test("points-per-year total always equals the sum of per-trip points", () => {
    const { el, g, window, set } = load({ fresh: true });
    set("resort", 8, "change");

    el("addTrip").click();
    el("addTrip").click();

    // Edit the first trip row's season and nights via the real controls.
    const row0 = el("tripsBody").querySelectorAll("tr")[0];
    const seasonSelect = row0.querySelector('select[data-f="si"]');
    seasonSelect.value = "6";
    seasonSelect.dispatchEvent(new window.Event("input", { bubbles: true }));

    const nightsInput = el("tripsBody").querySelectorAll("tr")[0].querySelector('input[data-f="nights"]');
    nightsInput.value = "9";
    nightsInput.dispatchEvent(new window.Event("input", { bubbles: true }));

    const { perTrip, total } = tripPointsFromDOM(el);
    const sum = perTrip.reduce((a, b) => a + b, 0);
    assert.equal(total, sum, `#tripOut total (${total}) must equal the sum of its per-trip lines (${sum})`);
  });

  test("changing a trip's weekend-nights input via its row is reflected in trips[] and totals shift", () => {
    const { el, g, window, set } = load({ fresh: true });
    set("resort", 8, "change");
    const before = tripPointsFromDOM(el).total;

    const row0 = el("tripsBody").querySelectorAll("tr")[0];
    const wkndInput = row0.querySelector('input[data-f="wknd"]');
    const originalWknd = g("trips")[0].wknd;
    const newWknd = originalWknd === 0 ? 1 : 0;
    wkndInput.value = String(newWknd);
    wkndInput.dispatchEvent(new window.Event("input", { bubbles: true }));

    assert.equal(g("trips")[0].wknd, newWknd, "trips[0].wknd should reflect the row input's new value");
    const after = tripPointsFromDOM(el).total;
    assert.notEqual(after, before, "changing weekend nights on a trip should change the rendered total points");
  });

  test("removing a trip via .btn-remove drops it from trips[] and lowers the total", () => {
    const { el, g, set } = load({ fresh: true });
    set("resort", 8, "change");
    el("addTrip").click();
    const tripsBefore = g("trips").length;
    const totalBefore = tripPointsFromDOM(el).total;

    el("tripsBody").querySelector(".btn-remove").click();

    assert.equal(g("trips").length, tripsBefore - 1, "removing a trip should shrink the trips array by one");
    assert.equal(
      el("tripsBody").querySelectorAll("tr").length,
      tripsBefore - 1,
      "#tripsBody should re-render with one fewer row"
    );
    const totalAfter = tripPointsFromDOM(el).total;
    assert.ok(totalAfter <= totalBefore, "total points per year should not increase after removing a trip");
  });

  test("removing the last remaining trip is prevented (trips.length <= 1 guard)", () => {
    const { el, g, set } = load({ fresh: true });
    set("resort", 8, "change");

    while (g("trips").length > 1) {
      el("tripsBody").querySelector(".btn-remove").click();
    }
    assert.equal(g("trips").length, 1, "test setup should reach exactly one trip");

    el("tripsBody").querySelector(".btn-remove").click();

    assert.equal(g("trips").length, 1, "clicking remove on the sole remaining trip must be a no-op");
    assert.equal(el("tripsBody").querySelectorAll("tr").length, 1, "#tripsBody must still show exactly one row");
    assertPageClean(el, "after attempting to remove the last trip");
  });
});

// ---------------------------------------------------------------------------
// 4. Contract auto-sizing (#ptsAuto).
// ---------------------------------------------------------------------------
describe("contract auto-sizing", () => {
  test("#ptsAuto is checked by default and #points is disabled", () => {
    const { el } = load({ fresh: true });
    assert.equal(el("ptsAuto").checked, true, "ptsAuto should default to checked");
    assert.equal(el("points").disabled, true, "#points should be disabled while auto-sizing");
  });

  test("#points tracks the computed trip size while #ptsAuto is checked", () => {
    const { el, g, set } = load({ fresh: true });
    set("resort", 8, "change");
    const computedSize = g("tripPoints()").size;
    assert.equal(Number(el("points").value), computedSize, "#points should equal tripPoints().size while auto");

    // Adding a trip changes the required size, and #points should follow.
    el("addTrip").click();
    const newComputedSize = g("tripPoints()").size;
    assert.equal(Number(el("points").value), newComputedSize, "#points should re-track after the trip shape changes");
  });

  test("unchecking #ptsAuto enables #points and lets a manual value stick", () => {
    const { el, set } = load({ fresh: true });
    set("resort", 8, "change");
    const autoValue = el("points").value;

    set("ptsAuto", false);
    assert.equal(el("points").disabled, false, "#points should become editable once auto-sizing is off");

    const manualValue = String(Number(autoValue) + 777);
    set("points", manualValue);
    assert.equal(el("points").value, manualValue, "a manually entered value should stick immediately");

    // Trigger an unrelated re-render (renderAll runs on many other inputs)
    // and confirm the manual value is not silently overwritten.
    set("tRack", "900");
    assert.equal(el("points").value, manualValue, "manual #points value must survive further renders while ptsAuto is off");
  });

  test("re-checking #ptsAuto snaps #points back to the computed size and re-disables it", () => {
    const { el, g, set } = load({ fresh: true });
    set("resort", 8, "change");
    set("ptsAuto", false);
    set("points", "999");
    assert.equal(el("points").value, "999");

    set("ptsAuto", true);
    assert.equal(el("points").disabled, true, "#points should be disabled again once auto-sizing is back on");
    assert.equal(Number(el("points").value), g("tripPoints()").size, "#points should snap back to the auto-computed size");
  });
});
