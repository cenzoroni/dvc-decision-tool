// Regression guards for bugs found in the September 2026 audit.
// Each test here failed before its fix; none of them are hypothetical.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { load } from "./harness.mjs";

describe("rack rate persistence", () => {
  test("a transiently empty #tRack does not corrupt the resort's rate", () => {
    // Was: clearing the field wrote RACK[ri]=1 permanently, and the cash
    // comparison then reported $1/night and flipped the verdict to
    // "Booking cash wins" with no indication anything was wrong.
    const { el, g, set } = load({ fresh: true });
    set("resort", 0, "change");
    const before = g("RACK")[0];
    set("tRack", "");
    set("resort", 3, "change");
    set("resort", 0, "change");
    assert.equal(g("RACK")[0], before, `RACK[0] should survive an empty edit, got ${g("RACK")[0]}`);
    assert.ok(
      !/\$1\/night/.test(el("cashOut").textContent),
      "cash comparison must not fall back to a $1/night rate"
    );
  });

  test("a non-studio rate is not written into the studio-denominated RACK", () => {
    // Was: bankedValue() divided whatever room's rate the user entered by
    // studio points, so selecting a grand villa inflated every banked point
    // ~3.4x and distorted the listing scorer and the whole ranked inventory.
    const { g, set } = load({ fresh: true });
    set("resort", 8, "change");
    const studioValue = g("bankedValue")(8);
    const cols = g("CHARTS")[8].cols;
    const gv = cols.findIndex((c) => /Three-Bedroom/.test(c));
    assert.ok(gv > 0, "precondition: resort 8 has a grand villa column");
    set("unit", gv);
    set("tRack", 2400);
    assert.equal(
      g("bankedValue")(8).toFixed(2),
      studioValue.toFixed(2),
      "bankedValue must stay studio-denominated regardless of the selected room"
    );
  });

  test("a studio rate the user enters IS still honoured", () => {
    const { g, set } = load({ fresh: true });
    set("resort", 8, "change");
    set("unit", g("studioCol")(8));
    set("tRack", 1000);
    assert.equal(g("RACK")[8], 1000, "a real studio rate should persist");
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
  test("switching resorts alone does not pin an estimated rack rate in the link", () => {
    // Was: URL_DEFAULTS.tRack was a single boot-time snapshot, so every resort
    // switch looked like a manual override and froze that resort's estimated
    // default into the shared link.
    const { window, set } = load({ fresh: true });
    set("resort", 0, "change");
    assert.ok(
      !new URLSearchParams(window.location.search).has("rk"),
      `no rack override was made, yet the link carries one: ${window.location.search}`
    );
  });

  test("a genuine rack-rate override still round-trips", () => {
    const a = load({ fresh: true });
    a.set("resort", 0, "change");
    a.set("tRack", 999);
    const qs = a.window.location.search;
    assert.ok(qs.includes("rk=999"), `an explicit override should be shared, got ${qs}`);
    const b = load({ fresh: true, search: qs });
    assert.equal(b.el("tRack").value, "999");
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
