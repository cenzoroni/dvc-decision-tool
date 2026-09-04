// Shareable-URL state: scenario inputs round-trip through the query string,
// and a hand-edited or hostile link degrades to defaults rather than rendering
// garbage.
//
// Each `load({fresh, search})` builds a brand-new jsdom page, so these tests
// are slower than the pure-function ones. Resort coverage is sampled rather
// than swept for that reason — the full resort x column sweep already lives in
// functional.test.mjs, which does not need a page rebuild per case.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { load, assertNoBadNumbers } from "./harness.mjs";

const TARGETS = ["tripOut", "cashOut", "verdict", "gridBody", "mtxBody"];

const assertClean = (page, context) => {
  for (const id of TARGETS) {
    const node = page.el(id);
    if (!node) continue;
    assertNoBadNumbers(node.innerHTML, `${context} -> #${id}`);
  }
};

describe("URL state — writing", () => {
  test("an untouched page leaves the query string empty", () => {
    const p = load({ fresh: true });
    assert.equal(
      p.window.location.search,
      "",
      `a clean load should not write params, got "${p.window.location.search}"`
    );
  });

  test("only changed values are written", () => {
    const p = load({ fresh: true });
    p.set("tDisc", 20);
    const params = new URLSearchParams(p.window.location.search);
    assert.deepEqual(
      Array.from(params.keys()),
      ["dc"],
      `only the changed discount should appear, got "${p.window.location.search}"`
    );
    assert.equal(params.get("dc"), "20");
  });

  test("#points is not pinned while auto-sizing is on", () => {
    const p = load({ fresh: true });
    assert.equal(p.el("ptsAuto").checked, true, "precondition: auto-size defaults on");
    // Changing the trips changes the derived #points value; it must stay out
    // of the link so the recipient's own trip list recomputes it.
    p.set("tDisc", 25);
    assert.ok(
      !new URLSearchParams(p.window.location.search).has("p"),
      `#points must not be serialised while auto-sizing, got "${p.window.location.search}"`
    );
  });

  test("#points IS pinned once auto-sizing is off", () => {
    const p = load({ fresh: true });
    p.set("ptsAuto", false);
    p.set("points", 375);
    const params = new URLSearchParams(p.window.location.search);
    assert.equal(params.get("p"), "375", `expected p=375, got "${p.window.location.search}"`);
    assert.equal(params.get("pa"), "0", "auto-size flag should be recorded as off");
  });
});

describe("URL state — round trip", () => {
  // One representative resort per pricing tier, rather than all 12, since each
  // case rebuilds the page.
  for (const resortIdx of [0, 3, 8, 11]) {
    test(`resort ${resortIdx} survives a round trip`, () => {
      const a = load({ fresh: true });
      a.set("resort", resortIdx, "change");
      a.set("tDisc", 15);
      a.set("esc", 5.5);
      const qs = a.window.location.search;

      const b = load({ fresh: true, search: qs });
      assert.equal(
        b.window.location.search,
        qs,
        `re-serialising resort ${resortIdx} should reproduce the same link`
      );
      assert.equal(b.el("resort").value, String(resortIdx), "resort should be restored");
      assert.equal(b.el("tDisc").value, "15", "discount should be restored");
      assert.equal(b.el("esc").value, "5.5", "dues escalation should be restored");
      assertClean(b, `round trip resort=${resortIdx}`);
    });
  }

  test("a custom rack rate survives the resort being applied first", () => {
    // Regression guard: selecting a resort resets #tRack to that resort's
    // default, so a shared rack rate is clobbered unless it is applied after.
    const b = load({ fresh: true, search: "?r=2&rk=888" });
    assert.equal(b.el("resort").value, "2");
    assert.equal(b.el("tRack").value, "888", "shared rack rate must outlive the resort default");
    assert.equal(
      b.g("RACK")[2],
      888,
      "the per-resort RACK entry render reads from should carry the shared value"
    );
  });

  test("a multi-trip list survives a round trip", () => {
    const a = load({ fresh: true });
    a.g("trips").length = 0;
    a.g("trips").push({ si: 0, nights: 2, wknd: 1 }, { si: 5, nights: 7, wknd: 2 });
    a.g("renderTripRows")();
    a.g("renderAll")();
    const qs = a.window.location.search;
    assert.ok(qs.includes("t="), `trips should be serialised, got "${qs}"`);

    const b = load({ fresh: true, search: qs });
    // Array.from re-homes the jsdom-realm array into this realm; deepStrictEqual
    // compares prototypes, and a cross-realm Array fails that even when the
    // contents match.
    const got = Array.from(b.g("trips")).map((t) => `${t.si}.${t.nights}.${t.wknd}`);
    assert.deepEqual(got, ["0.2.1", "5.7.2"], "both trips should be restored exactly");
    assertClean(b, "multi-trip round trip");
  });

  test("trip rows render for a restored link", () => {
    const b = load({ fresh: true, search: "?t=1.4.2_6.3.1" });
    assert.equal(b.document.querySelectorAll("#tripsBody tr").length, 2);
  });
});

describe("URL state — hostile and malformed links", () => {
  const HOSTILE = [
    ["?r=999", "resort index far past the end"],
    ["?r=-5", "negative resort index"],
    ["?r=abc", "non-numeric resort"],
    ["?t=abc", "unparseable trips"],
    ["?t=", "empty trips"],
    ["?t=9.99.99", "trip values past every bound"],
    ["?t=1.2", "truncated trip tuple"],
    ["?p=-1", "negative points"],
    ["?p=1e10", "absurd points"],
    ["?rk=notanumber", "non-numeric rack rate"],
    ["?rk=-500", "negative rack rate"],
    ["?es=1e10", "dues escalation past the compounding overflow"],
    ["?di=999", "discount rate past its max"],
    ["?u=4242", "room column the resort does not have"],
    ["?ci=not-a-date", "unparseable check-in date"],
    ["?n=-3", "negative nights"],
    ["?r=999&t=abc&p=-1&rk=x&u=99&ci=nope", "everything wrong at once"],
  ];

  for (const [search, label] of HOSTILE) {
    test(`${label} (${search}) renders without garbage`, () => {
      const p = load({ fresh: true, search });
      assertClean(p, `hostile ${search}`);
      // The page must still be functional, not just non-crashing.
      assert.ok(
        p.el("tripOut").innerHTML.length > 0,
        `${search}: #tripOut should still render content`
      );
      assert.ok(p.g("trips").length >= 1, `${search}: at least one trip must survive`);
    });
  }

  test("an out-of-range resort clamps into the real list", () => {
    const p = load({ fresh: true, search: "?r=999" });
    const n = p.g("RESORTS").length;
    const got = Number(p.el("resort").value);
    assert.ok(got >= 0 && got < n, `resort should clamp into 0..${n - 1}, got ${got}`);
  });

  test("an unknown room column is ignored rather than selected", () => {
    const p = load({ fresh: true, search: "?u=4242" });
    const unit = p.el("unit");
    const valid = Array.from(unit.options).map((o) => o.value);
    assert.ok(
      valid.includes(unit.value),
      `#unit fell to an option that does not exist: "${unit.value}"`
    );
  });
});
