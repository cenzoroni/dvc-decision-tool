// Dues, cash rates and rental rates must all span the same horizon.
//
// The ownership figures average dues across the whole remaining deed. Cash and
// rental were held at today's rate, flat, forever. That was not a conservative
// simplification — it asked a different question of one side of the comparison,
// and over a 40-year deed at 4.5% it understated the cash side roughly 3x,
// which was enough to decide the verdict on its own.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { load } from "./harness.mjs";

const annual = (page, label) => {
  const m = page.el("cashOut").textContent.match(
    new RegExp(label + "[\\s\\S]*?\\$([\\d,]+) a year")
  );
  assert.ok(m, `could not read the annual figure for "${label}"`);
  return Number(m[1].replace(/,/g, ""));
};

describe("the escalation control is actually wired", () => {
  test("changing room-rate escalation changes the comparison", () => {
    // Regression guard: escRoom was added to inputs() but not to the listener
    // list, so it looked live and did nothing — the same defect the audit found
    // on the discount-rate field.
    const p = load({ fresh: true });
    const before = p.el("cashOut").textContent;
    p.set("escRoom", 0);
    assert.notEqual(p.el("cashOut").textContent, before,
      "the room-rate escalation input has no effect on the output");
  });

  test("it round-trips through a shared link", () => {
    const a = load({ fresh: true });
    a.set("escRoom", 2.5);
    const qs = a.window.location.search;
    assert.ok(qs.includes("er=2.5"), `escalation should be shareable, got "${qs}"`);
    assert.equal(load({ fresh: true, search: qs }).el("escRoom").value, "2.5");
  });
});

describe("both sides span the same horizon", () => {
  test("cash escalates when room rates do", () => {
    const flat = load({ fresh: true });
    flat.set("escRoom", 0);
    const a = annual(flat, "Book it");

    const rising = load({ fresh: true });
    rising.set("escRoom", 4.5);
    const b = annual(rising, "Book it");

    assert.ok(b > a * 1.5,
      `cash should compound over a multi-decade deed: flat ${a}, escalating ${b}`);
  });

  test("rental escalates too", () => {
    const flat = load({ fresh: true });
    flat.set("escRoom", 0);
    const a = annual(flat, "Rent points from an owner");

    const rising = load({ fresh: true });
    rising.set("escRoom", 4.5);
    const b = annual(rising, "Rent points from an owner");

    assert.ok(b > a * 1.5, `rental should compound too: flat ${a}, escalating ${b}`);
  });

  test("ownership does not move with room rates — only its own dues do", () => {
    // The purchase is locked in today's dollars; only dues escalate. This is
    // the actual economic argument for owning, and it should be visible as
    // ownership holding steady while the alternatives climb.
    const a = load({ fresh: true }); a.set("escRoom", 0);
    const b = load({ fresh: true }); b.set("escRoom", 6);
    assert.equal(annual(a, "Own it &mdash; bought resale".replace("&mdash;", "—")),
                 annual(b, "Own it —"),
      "ownership cost should be independent of room-rate inflation");
  });

  test("zero escalation reproduces the plain year-one figure", () => {
    const p = load({ fresh: true });
    p.set("escRoom", 0);
    p.set("tRent", 20);
    const t = p.g("tripPoints")();
    assert.ok(Math.abs(annual(p, "Rent points from an owner") - t.year * 20) <= 1,
      "with no escalation the lifetime average must equal the year-one cost");
  });

  test("the default holds neither side frozen", () => {
    // Equal default rates encode "no view on which outruns the other", which is
    // the neutral prior. Zero on one side is not neutral — it is a claim.
    const { el } = load({ fresh: true });
    assert.ok(+el("escRoom").value > 0,
      "room rates must not default to frozen while dues compound");
    assert.equal(+el("escRoom").value, +el("esc").value,
      "the neutral default is for both to escalate at the same rate");
  });
});

describe("sensitivity strip", () => {
  test("it prices the decision across a range of assumptions", () => {
    const { el } = load({ fresh: true });
    const cells = el("cashOut").querySelectorAll(".sens-cell");
    assert.equal(cells.length, 5, "expected five assumption columns");
    for (const c of cells) {
      assert.match(c.textContent, /%\/yr/, "each column should name its rate");
      assert.match(c.textContent, /\$[\d,]+/, "each column should price the outcome");
    }
  });

  test("the current assumption is marked", () => {
    const { el } = load({ fresh: true });
    assert.equal(el("cashOut").querySelectorAll(".sens-cell.now").length, 1,
      "exactly one column should be marked as the current setting");
  });

  test("a verdict that flips inside the range says so", () => {
    // Some scenario is always borderline — cash wins if room rates never rise,
    // owning wins if they rise at all — and that the answer turns entirely on
    // an unknowable assumption is the most useful thing the page can say.
    // The scenario is searched for rather than hardcoded so that updating the
    // rack rates cannot silently retire this test.
    let straddled = null;
    outer:
    for (const rack of [250, 300, 350, 400, 450]) {
      for (const disc of [0, 20, 40]) {
        const p = load({ fresh: true });
        p.g("trips").length = 0;
        p.g("trips").push({ si: 4, nights: 3, wknd: 0, disc });
        p.g("renderTripRows")();
        p.set("tRack", rack);
        p.g("renderAll")();
        const cells = Array.from(p.el("cashOut").querySelectorAll(".sens-cell"));
        const owns = cells.filter((c) => c.classList.contains("owns")).length;
        const cash = cells.filter((c) => c.classList.contains("cash")).length;
        if (owns > 0 && cash > 0) { straddled = { p, rack, disc, owns, cash }; break outer; }
      }
    }
    assert.ok(straddled,
      "no scenario in the swept range straddled the escalation assumptions — " +
      "either the sensitivity strip stopped working or the sweep needs widening");
    assert.match(straddled.p.el("cashOut").textContent, /answer flips/,
      `rack=${straddled.rack} disc=${straddled.disc}% straddles ` +
      `(${straddled.owns} own / ${straddled.cash} cash) but is not labelled as assumption-dependent`);
  });

  test("a robust verdict is not labelled as flipping", () => {
    const p = load({ fresh: true });
    p.g("trips").length = 0;
    p.g("trips").push({ si: 4, nights: 7, wknd: 2, disc: 0 },
                      { si: 4, nights: 7, wknd: 2, disc: 0 });
    p.g("renderTripRows")(); p.g("renderAll")();
    const cells = Array.from(p.el("cashOut").querySelectorAll(".sens-cell"));
    if (cells.every((c) => c.classList.contains("owns"))) {
      assert.ok(!/answer flips/.test(p.el("cashOut").textContent),
        "a verdict that holds across the range should not claim to flip");
    }
  });
});

describe("year-one figures remain visible", () => {
  test("each option shows its first-year cost alongside the average", () => {
    // The lifetime average is the right basis for the decision but is abstract;
    // the year-one number is what someone actually recognises.
    const { el } = load({ fresh: true });
    const yr1 = el("cashOut").querySelectorAll(".yr1");
    assert.ok(yr1.length >= 3, `expected a year-one figure per option, got ${yr1.length}`);
    for (const n of yr1) assert.match(n.textContent, /\$[\d,]+ a night in year one/);
  });

  test("the averaging window is stated, not implied", () => {
    const { el } = load({ fresh: true });
    assert.match(el("cashOut").textContent, /averaged over \d+ years/,
      "the comparison must say what span it averages over");
  });
});
