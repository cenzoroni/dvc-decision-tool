// Everything is in today's dollars.
//
// An earlier version inflated cash and rental rates nominally over the deed and
// averaged them, so a Grand Floridian studio showed as "$2,948 a night" — the
// arithmetic was right and every reader took it for a price. Now cash and
// rental sit flat at this year's rate, and the only escalation left in the
// model is the REAL growth of dues: how much faster or slower they rise than
// room rates. The two nominal inputs stay on screen, but only their gap
// reaches the numbers.

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

describe("everything is in today's dollars", () => {
  test("cash does not move with room-rate escalation", () => {
    const flat = load({ fresh: true }); flat.set("escRoom", 0);
    const rising = load({ fresh: true }); rising.set("escRoom", 6);
    assert.equal(annual(flat, "Book it"), annual(rising, "Book it"),
      "cash is this year's price; inflating it nominally produced a number nobody pays");
  });

  test("rental does not move either", () => {
    const flat = load({ fresh: true }); flat.set("escRoom", 0);
    const rising = load({ fresh: true }); rising.set("escRoom", 6);
    assert.equal(annual(flat, "Rent points from an owner"), annual(rising, "Rent points from an owner"));
  });

  test("only the gap between dues and room-rate growth reaches ownership", () => {
    // 3%/3% and 7%/7% are the same real scenario and must render identically;
    // 4.5% dues against 0% rooms is dues outrunning rooms, and must cost more
    // than 4.5% against 4.5%.
    const a = load({ fresh: true }); a.set("esc", 3); a.set("escRoom", 3);
    const b = load({ fresh: true }); b.set("esc", 7); b.set("escRoom", 7);
    assert.equal(annual(a, "Own it —"), annual(b, "Own it —"),
      "equal nominal rates are one scenario regardless of level");

    const neutral = load({ fresh: true }); neutral.set("esc", 4.5); neutral.set("escRoom", 4.5);
    const duesWin = load({ fresh: true }); duesWin.set("esc", 4.5); duesWin.set("escRoom", 0);
    assert.ok(annual(duesWin, "Own it —") > annual(neutral, "Own it —"),
      "dues outrunning room rates should make owning dearer in real terms");
  });

  test("rental is exactly points x rate, whatever the escalation inputs say", () => {
    const p = load({ fresh: true });
    p.set("escRoom", 6);
    p.set("tRent", 20);
    const t = p.g("tripPoints")();
    assert.ok(Math.abs(annual(p, "Rent points from an owner") - t.year * 20) <= 1);
  });

  test("the default is the neutral scenario", () => {
    // Equal rates encode "no view on which outruns the other". Zero on one
    // side is not neutral — it is a claim.
    const { el } = load({ fresh: true });
    assert.ok(+el("escRoom").value > 0);
    assert.equal(+el("escRoom").value, +el("esc").value,
      "the neutral default is for both to escalate at the same rate");
  });

  test("no figure on the page is a nominal multi-decade average", () => {
    const { el } = load({ fresh: true });
    const txt = el("cashOut").textContent;
    assert.ok(!/averaged over \d+ years/.test(txt), "the lifetime-average framing is gone");
    assert.match(txt, /today.s dollars/, "the page says what its dollars are");
  });
});

describe("the cash panel is a checkable price", () => {
  test("the cash figure is exactly this year's rate for the trips, taxed", () => {
    // Read off the per-trip lines, which show each trip's season-adjusted rate
    // before tax, and reconcile against the headline. This is the number a
    // reader compares with a Disney quote, so it has to be a real price.
    const p = load({ fresh: true });
    const ri = +p.el("resort").value, tax = p.g("ROOM_TAX");
    let expected = 0, nights = 0;
    for (const t of p.g("tripShape")()) {
      const r = p.g("bandRates")(ri, t.si, t.b);
      expected += (t.week * r.week + t.wknd * r.wknd) * (1 + tax);
      nights += t.nights;
    }
    const shown = p.el("cashOut").textContent.match(/Book it[\s\S]*?\$([\d,]+)per night/);
    assert.ok(shown, "cash panel should render a per-night figure");
    assert.ok(Math.abs(Number(shown[1].replace(/,/g, "")) - expected / nights) <= 1,
      `expected ~$${(expected / nights).toFixed(0)}, got $${shown[1]}`);
  });

  test("ownership explains where its number comes from", () => {
    const { el } = load({ fresh: true });
    assert.match(el("cashOut").textContent, /purchase spread over \d+ years, plus dues/);
  });
});

describe("room tax falls on cash only", () => {
  test("a cash booking is taxed and a points stay is not", () => {
    // Confirmed Sept 2026: Florida transient rental tax applies to a cash room
    // booking at WDW but not to a DVC stay on points, whether the points are
    // your own or rented from an owner. Omitting it flattered cash by 12.5%
    // against both alternatives.
    const p = load({ fresh: true });
    p.set("escRoom", 0);            // isolate the tax from the escalation factor
    const t = p.g("tripPoints")();
    const tax = p.g("ROOM_TAX");
    assert.equal(tax, 0.125, "the WDW room tax rate");

    // Rental is points-based, so it must be exactly points x rate, untaxed.
    p.set("tRent", 20);
    const rent = Number(p.el("cashOut").textContent
      .match(/Rent points from an owner[\s\S]*?\$([\d,]+) a year/)[1].replace(/,/g, ""));
    assert.ok(Math.abs(rent - t.year * 20) <= 1,
      `renting points must not be taxed: expected ${t.year * 20}, got ${rent}`);
  });

  test("removing the tax would make cash cheaper by exactly the tax", () => {
    const p = load({ fresh: true });
    p.set("escRoom", 0);
    const cash = annual(p, "Book it");
    // Reconstruct the pre-tax figure from the trip shape and check the ratio.
    const ri = +p.el("resort").value;
    let pre = 0;
    for (const tr of p.g("tripShape")()) pre += p.g("tripGross")(ri, tr) * (1 - tr.disc);
    assert.ok(Math.abs(cash / pre - 1.125) < 0.01,
      `cash should sit 12.5% above the pre-tax figure, ratio was ${(cash / pre).toFixed(4)}`);
  });

  test("the tax is disclosed rather than silently applied", () => {
    const { el } = load({ fresh: true });
    assert.match(el("cashOut").textContent, /plus tax/,
      "the cash option should say it includes tax");
    const prov = el("provBody").textContent;
    assert.match(prov, /Room tax on cash bookings/, "the tax needs its own provenance row");
    assert.match(prov, /point stays are exempt|not taxed/i,
      "provenance should state that points stays are exempt");
  });
});
