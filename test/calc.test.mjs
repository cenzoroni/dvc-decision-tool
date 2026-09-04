// Calculation tests for the DVC decision tool.
// Runs against the shipped index.html via the jsdom harness — there is no
// separate copy of the pricing logic to drift out of sync with.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { load } from "./harness.mjs";

const { g } = load();

const costPerPointYear = g("costPerPointYear");
const levelized = g("levelized");
const avgDues = g("avgDues");
const yearsLeft = g("yearsLeft");
const seasonIndex = g("seasonIndex");
const chartFor = g("chartFor");
const stayPoints = g("stayPoints");
const parseListings = g("parseListings");
const studioCol = g("studioCol");
const scoreListings = g("scoreListings");
const RESORTS = g("RESORTS");
const CHARTS = g("CHARTS");

// Tolerance for floating-point dollar/point comparisons throughout this file.
// Chosen because every quantity here is a dollar-ish figure with at most a
// few significant digits of precision expected from the app; 1e-9 catches
// real arithmetic bugs while ignoring binary floating-point noise.
const EPS = 1e-9;

function closeTo(actual, expected, eps, msg) {
  assert.ok(
    Math.abs(actual - expected) <= eps,
    `${msg}: expected ${expected}, got ${actual} (diff ${Math.abs(actual - expected)}, tolerance ${eps})`
  );
}

describe("costPerPointYear", () => {
  test("$100/pt over 10 years, no dues or closing, amortizes to exactly $10/pt-yr", () => {
    const inputs = [100, 0, 100, 0, 10, 0];
    const r = costPerPointYear(...inputs);
    closeTo(r.acq, 10, EPS, `acq for costPerPointYear(${inputs})`);
    closeTo(r.dues, 0, EPS, `dues for costPerPointYear(${inputs})`);
    closeTo(r.total, 10, EPS, `total for costPerPointYear(${inputs})`);
  });
});

describe("levelized", () => {
  test("with discount rate 0, equals costPerPointYear's total", () => {
    // Realistic-ish inputs: $150/pt, $900 closing, 160-pt contract, $9.50
    // dues escalating at 4%/yr over a 15-year horizon.
    const inputs = [150, 900, 160, 9.5, 15, 0.04];
    const cpy = costPerPointYear(...inputs);
    const lev = levelized(...inputs, 0);
    closeTo(
      lev,
      cpy.total,
      1e-6,
      `levelized(${inputs}, d=0) vs costPerPointYear(${inputs}).total`
    );
  });

  test("with discount rate 0 and no escalation, matches a second set of inputs too", () => {
    const inputs = [113.14, 1200, 100, 10.1608, 31, 0];
    const cpy = costPerPointYear(...inputs);
    const lev = levelized(...inputs, 0);
    closeTo(
      lev,
      cpy.total,
      1e-6,
      `levelized(${inputs}, d=0) vs costPerPointYear(${inputs}).total`
    );
  });
});

describe("avgDues", () => {
  test("with 0% growth, equals the flat dues rate regardless of years", () => {
    closeTo(avgDues(9.5, 20, 0), 9.5, EPS, "avgDues(9.5, 20, 0)");
  });

  test("with positive growth, average exceeds the starting rate", () => {
    const avg = avgDues(10, 10, 0.05);
    assert.ok(
      avg > 10,
      `avgDues(10, 10, 0.05) should exceed the starting rate of 10, got ${avg}`
    );
  });
});

describe("yearsLeft", () => {
  test("never returns less than the 0.5-year floor, even for an already-expired deed", () => {
    const yrs = yearsLeft(2020);
    assert.equal(yrs, 0.5, `yearsLeft(2020) (expired) should floor at 0.5, got ${yrs}`);
  });

  test("returns a positive figure for a real deed expiration far in the future", () => {
    const yrs = yearsLeft(2057);
    assert.ok(yrs > 20, `yearsLeft(2057) should be well over 20 years out, got ${yrs}`);
  });
});

describe("seasonIndex", () => {
  test("returns -1 for a date outside the published chart years", () => {
    const idx = seasonIndex(new Date(2028, 0, 1));
    assert.equal(idx, -1, "seasonIndex(2028-01-01) should be -1: no 2028 chart published");
  });

  test("returns -1 for a date before the earliest published chart year", () => {
    const idx = seasonIndex(new Date(2025, 5, 15));
    assert.equal(idx, -1, "seasonIndex(2025-06-15) should be -1: no 2025 chart published");
  });

  test("finds the correct season for a known 2027 date (Oct 1, season index 4)", () => {
    const idx = seasonIndex(new Date(2027, 9, 1));
    assert.equal(idx, 4, "seasonIndex(2027-10-01) should land in season band 4 (Oct 1 – Nov 23)");
  });
});

describe("chartFor", () => {
  test("resort with a distinct y27 chart (Animal Kingdom Villas) returns y27 for booking year 2027", () => {
    const chart = chartFor(0, 2027);
    assert.equal(chart, CHARTS[0].y27, "chartFor(0, 2027) should return CHARTS[0].y27");
  });

  test("resort with a distinct y27 chart returns y26 for booking year 2026", () => {
    const chart = chartFor(0, 2026);
    assert.equal(chart, CHARTS[0].y26, "chartFor(0, 2026) should return CHARTS[0].y26");
  });

  test("resort with no y27 override (Bay Lake Tower) falls back to y26 even for booking year 2027", () => {
    assert.equal(CHARTS[1].y27, undefined, "precondition: CHARTS[1] has no y27 chart");
    const chart = chartFor(1, 2027);
    assert.equal(chart, CHARTS[1].y26, "chartFor(1, 2027) should fall back to CHARTS[1].y26");
  });
});

describe("stayPoints — known stays at Animal Kingdom Villas (resort index 0)", () => {
  // "Standard studio" at AKV maps to CHARTS[0].cols[1] = "Deluxe Studio|Resort".
  // Verified against CHARTS[0].cols: index 0 is "Deluxe Studio|Value" (the
  // cheap no-balcony Jambo-only studio), index 2 is "...|Savanna" (a premium
  // view upcharge) and index 3 is "...|Club Level" (a further upcharge).
  // Only index 1, "Deluxe Studio|Resort", reproduces all three pinned point
  // totals below — the other three columns are off by several points on
  // every one of them.
  const AKV = 0;
  const STANDARD_STUDIO_CI = 1;

  test("Friday 2-night stay, October 2027, standard studio = 32 points", () => {
    const start = new Date(2027, 9, 1); // Fri Oct 1, 2027
    assert.equal(start.getDay(), 5, "precondition: Oct 1 2027 must be a Friday");
    const pts = stayPoints(AKV, STANDARD_STUDIO_CI, start, 2);
    assert.equal(
      pts,
      32,
      `stayPoints(AKV, ci=${STANDARD_STUDIO_CI}, ${start.toDateString()}, 2 nights) should be 32, got ${pts}`
    );
  });

  test("Friday 3-night stay, October 2027, standard studio = 47 points", () => {
    const start = new Date(2027, 9, 1); // Fri Oct 1, 2027
    const pts = stayPoints(AKV, STANDARD_STUDIO_CI, start, 3);
    assert.equal(
      pts,
      47,
      `stayPoints(AKV, ci=${STANDARD_STUDIO_CI}, ${start.toDateString()}, 3 nights) should be 47, got ${pts}`
    );
  });

  test("Sunday 5-night stay, October 2027, standard studio = 75 points", () => {
    const start = new Date(2027, 9, 3); // Sun Oct 3, 2027
    assert.equal(start.getDay(), 0, "precondition: Oct 3 2027 must be a Sunday");
    const pts = stayPoints(AKV, STANDARD_STUDIO_CI, start, 5);
    assert.equal(
      pts,
      75,
      `stayPoints(AKV, ci=${STANDARD_STUDIO_CI}, ${start.toDateString()}, 5 nights) should be 75, got ${pts}`
    );
  });
});

describe("stayPoints — season boundary crossing", () => {
  test("a stay spanning a real 2027 season boundary prices each night on its own side", () => {
    // SEASONS[2027] band 1 ("Jan 1–31 · May 1–14") ends 0131; band 3
    // ("Feb 1–15 · Jun 11–Aug 31") begins 0201 — a clean back-to-back
    // boundary with no gap. Jan 31, 2027 is a Sunday; Feb 1, 2027 a Monday,
    // so this also avoids any weekend-rate complication.
    const ri = 0, ci = 1; // AKV, standard studio (see column note above)
    const d1 = new Date(2027, 0, 31); // Jan 31, 2027
    const d2 = new Date(2027, 1, 1); // Feb 1, 2027
    assert.equal(seasonIndex(d1), 1, "precondition: Jan 31 2027 is season band 1");
    assert.equal(seasonIndex(d2), 3, "precondition: Feb 1 2027 is season band 3");

    const wknd1 = d1.getDay() === 5 || d1.getDay() === 6;
    const wknd2 = d2.getDay() === 5 || d2.getDay() === 6;
    const expectedNight1 = chartFor(ri, d1.getFullYear())[seasonIndex(d1)][wknd1 ? 1 : 0][ci];
    const expectedNight2 = chartFor(ri, d2.getFullYear())[seasonIndex(d2)][wknd2 ? 1 : 0][ci];
    const expectedTotal = expectedNight1 + expectedNight2;

    const actual = stayPoints(ri, ci, d1, 2);
    assert.equal(
      actual,
      expectedTotal,
      `stayPoints(0, 1, ${d1.toDateString()}, 2 nights) should equal per-night sum ` +
        `${expectedNight1} (Jan 31, season 1) + ${expectedNight2} (Feb 1, season 3) = ${expectedTotal}, got ${actual}`
    );
  });
});

describe("stayPoints — past the last published chart year", () => {
  test("returns null, not a number, when a stay crosses past Dec 31 2027", () => {
    const start = new Date(2027, 11, 30); // Dec 30, 2027
    const pts = stayPoints(0, 1, start, 3); // 3 nights runs through Jan 1, 2028
    assert.equal(
      pts,
      null,
      `stayPoints(0, 1, ${start.toDateString()}, 3 nights) crosses into 2028 and should be null, got ${pts}`
    );
  });

  test("returns null for a stay entirely within 2028", () => {
    const start = new Date(2028, 0, 1);
    const pts = stayPoints(0, 1, start, 2);
    assert.equal(
      pts,
      null,
      `stayPoints(0, 1, ${start.toDateString()}, 2 nights) is entirely in 2028 and should be null, got ${pts}`
    );
  });

  test("last valid night (Dec 31, 2027) still resolves to a real number", () => {
    const start = new Date(2027, 11, 31); // Dec 31, 2027, single night
    const pts = stayPoints(0, 1, start, 1);
    assert.notEqual(pts, null, "the last published night, Dec 31 2027, should not be null");
    assert.ok(Number.isFinite(pts), `expected a finite point value, got ${pts}`);
  });
});

describe("studioCol", () => {
  test("picks a column whose label matches a Deluxe Studio at Animal Kingdom Villas", () => {
    const ci = studioCol(0);
    const label = CHARTS[0].cols[ci];
    assert.match(label, /^Deluxe Studio/, `studioCol(0) picked "${label}" at index ${ci}`);
  });

  test("falls back to a Cabin column at The Cabins at Fort Wilderness (no Deluxe Studio there)", () => {
    const ri = RESORTS.findIndex((r) => r.name === "The Cabins at Fort Wilderness");
    assert.ok(ri >= 0, "precondition: Fort Wilderness cabins must exist in RESORTS");
    const ci = studioCol(ri);
    const label = CHARTS[ri].cols[ci];
    assert.match(label, /Cabin/, `studioCol(${ri}) picked "${label}" at index ${ci}`);
  });
});

describe("parseListings", () => {
  // The listing-ID regex is /\b[A-Z]{2}[A-Z0-9]\d{4}\b/, i.e. two letters,
  // one more alphanumeric, then exactly four digits (7 chars total) — a
  // plain "AK1234" (6 chars) does NOT match, so every fixture here uses the
  // 7-char form "AK01234". The two-letter prefix ("AK") is what resolves to
  // a resort via PREFIX.
  test("parses a well-formed listing row into the expected tuple", () => {
    const text = "AK01234 100 pts | 100 / 140 | Jan UY | $130 pt";
    const { out, skipped, pending, foreign } = parseListings(text);
    assert.equal(skipped, 0, `expected 0 skipped, got ${skipped}`);
    assert.equal(pending, 0, `expected 0 pending, got ${pending}`);
    assert.equal(foreign, 0, `expected 0 foreign, got ${foreign}`);
    assert.equal(out.length, 1, `expected 1 parsed listing, got ${out.length}`);
    const [ri, id, pts, a26, a27, uy, ppp] = out[0];
    assert.equal(ri, 0, "resort index should resolve AK -> 0 (Animal Kingdom Villas)");
    assert.equal(id, "AK01234");
    assert.equal(pts, 100);
    assert.equal(a26, 100);
    assert.equal(a27, 140);
    assert.equal(uy, "Jan");
    assert.equal(ppp, 130);
  });

  test("skips a listing marked pending / under contract", () => {
    const text = "AK01234 100 pts | 100 / 140 | Jan UY | $130 pt PENDING";
    const { out, pending } = parseListings(text);
    assert.equal(out.length, 0, "a pending listing should not appear in out[]");
    assert.equal(pending, 1, `expected pending count of 1, got ${pending}`);
  });

  test("counts an unrecognized resort prefix as foreign", () => {
    const text = "ZZ01234 100 pts | 100 / 140 | Jan UY | $130 pt";
    const { out, foreign } = parseListings(text);
    assert.equal(out.length, 0, "unrecognized resort prefix should not appear in out[]");
    assert.equal(foreign, 1, `expected foreign count of 1, got ${foreign}`);
  });

  test("returns all-zero counts and an empty out[] for text with no listing IDs", () => {
    // `out` is an Array constructed inside the jsdom realm, so it is not
    // deepStrictEqual to a same-realm [] literal (different Array
    // constructor); compare length and the scalar counts individually instead.
    const { out, skipped, pending, foreign } = parseListings("no listings here at all");
    assert.equal(out.length, 0, `expected empty out[], got ${out.length} entries`);
    assert.equal(skipped, 0, `expected 0 skipped, got ${skipped}`);
    assert.equal(pending, 0, `expected 0 pending, got ${pending}`);
    assert.equal(foreign, 0, `expected 0 foreign, got ${foreign}`);
  });
});

describe("scoreListings", () => {
  test("a normal-allotment listing (no bonus or missing points) prices at exactly its asking price", () => {
    // delta = (a26-pts) + (a27-pts) = 0 when a26 and a27 both equal pts, so
    // the banked-point credit is exactly zero and effective price collapses
    // to the raw asking price with no rounding error.
    g('LISTINGS = [[0,"AK9999",100,100,100,"Jan",125]]');
    try {
      const rows = scoreListings();
      assert.equal(rows.length, 1, "expected exactly one scored row");
      closeTo(
        rows[0].eff,
        125,
        EPS,
        "effective price for a normal-allotment (delta=0) listing at $125/pt"
      );
    } finally {
      g("LISTINGS = []");
    }
  });

  test("a loaded contract (extra banked points) scores better than a cheaper stripped one", () => {
    // Same resort, same point size, same use year. AK1111 is "loaded": it
    // carries 40 more points than a normal 2-year allotment (delta=+40) and
    // asks a HIGHER headline price ($130/pt). AK2222 is "stripped": it is
    // short 40 points against a normal allotment (delta=-40) and asks a
    // LOWER headline price ($110/pt). Crediting/debiting those points at
    // this resort's banked-point value should still make the loaded
    // contract the better (higher-scoring) buy despite its higher ask.
    g(`LISTINGS = [
      [0,"AK1111",100,100,140,"Jan",130],
      [0,"AK2222",100,100,60,"Jan",110]
    ]`);
    try {
      const rows = scoreListings();
      const loaded = rows.find((r) => r.id === "AK1111");
      const stripped = rows.find((r) => r.id === "AK2222");
      assert.ok(loaded && stripped, "both listings should be scored");

      assert.ok(
        loaded.eff < stripped.eff,
        `loaded contract's effective price (${loaded.eff}) should undercut the stripped contract's (${stripped.eff}) ` +
          `despite asking more per point ($130 vs $110)`
      );
      assert.ok(
        loaded.score > stripped.score,
        `loaded contract's score (${loaded.score}) should exceed the stripped contract's (${stripped.score}); ` +
          `eff: loaded=${loaded.eff} stripped=${stripped.eff}`
      );
    } finally {
      g("LISTINGS = []");
    }
  });
});
