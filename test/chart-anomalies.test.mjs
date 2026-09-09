// Chart transcription sanity.
//
// The point charts are hand-transcribed from Disney's published figures, and
// the published weekly totals that would let us verify each cell are not in
// this dataset. What we can do is police the patterns the real charts always
// follow, so a future typo fails loudly instead of silently mispricing a stay.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { load } from "./harness.mjs";

const { g } = load();
const CHARTS = g("CHARTS");
const RESORTS = g("RESORTS");

const chartYears = () => {
  const out = [];
  CHARTS.forEach((c, ri) => {
    for (const yr of ["y26", "y27"]) if (c[yr]) out.push({ ri, yr, chart: c[yr], cols: c.cols });
  });
  return out;
};

/* Seasons are ordered cheapest to priciest, so a later season should never
   cost fewer points than an earlier one for the same room. Exactly one cell in
   the shipped data breaks this, found in the September 2026 audit:
   BoardWalk Villas "Two-Bedroom|Resort" drops 32 -> 31 from season 1 to 2 on
   Sun-Thu. It is almost certainly a transcription typo, but correcting it
   needs the real chart rather than a guess, so it is pinned here as a known
   exception. Any NEW inversion fails this test. */
const KNOWN_INVERSIONS = [
  { resort: "BoardWalk Villas", yr: "y26", col: "Two-Bedroom|Resort", wknd: 0, from: 1, to: 2 },
];

const keyOf = (x) => `${x.resort}|${x.yr}|${x.col}|${x.wknd}|${x.from}->${x.to}`;

describe("season ordering", () => {
  test("points never fall as the season gets more expensive", () => {
    const found = [];
    for (const { ri, yr, chart, cols } of chartYears()) {
      for (let w = 0; w < 2; w++) {
        for (let ci = 0; ci < cols.length; ci++) {
          for (let si = 1; si < chart.length; si++) {
            const prev = chart[si - 1][w][ci], cur = chart[si][w][ci];
            if (cur < prev) {
              found.push({
                resort: RESORTS[ri].name.replace(/&amp;/g, "&"), yr, col: cols[ci],
                wknd: w, from: si - 1, to: si, prev, cur,
              });
            }
          }
        }
      }
    }
    const known = new Set(KNOWN_INVERSIONS.map(keyOf));
    const fresh = found.filter((f) => !known.has(keyOf(f)));
    assert.deepEqual(fresh.map((f) =>
      `${f.resort} ${f.yr} "${f.col}" ${f.wknd ? "Fri-Sat" : "Sun-Thu"} season ${f.from}->${f.to}: ${f.prev} -> ${f.cur}`),
      [], "new season-ordering inversions appeared in the chart data");
  });

  test("the known BoardWalk anomaly is still there, and still alone", () => {
    // If someone corrects it against the real chart, this test tells them to
    // drop it from KNOWN_INVERSIONS rather than leaving a stale exemption that
    // would mask a future typo in the same cell.
    const bw = CHARTS[3];
    const ci = bw.cols.indexOf("Two-Bedroom|Resort");
    assert.ok(ci >= 0, "the BoardWalk column should still exist");
    const s1 = bw.y26[1][0][ci], s2 = bw.y26[2][0][ci];
    assert.ok(s2 < s1,
      `BoardWalk "Two-Bedroom|Resort" now reads ${s1} -> ${s2}; if this was corrected ` +
      "against Disney's chart, remove it from KNOWN_INVERSIONS");
  });
});

describe("room ordering", () => {
  test("a bigger room never costs fewer points than a smaller one", () => {
    const rank = (c) => {
      const room = c.split("|")[0];
      if (/Three-Bedroom|Grand Villa/.test(room)) return 4;
      if (/Two-Bedroom|Cabin/.test(room)) return 3;
      if (/One-Bedroom/.test(room)) return 2;
      return 1; // studios, duo studios, tower studios
    };
    const bad = [];
    for (const { ri, yr, chart, cols } of chartYears()) {
      // Compare only within the same view, so a standard 1BR is not held
      // against a theme-park-view studio.
      const byView = {};
      cols.forEach((c, ci) => { (byView[c.split("|")[1] || ""] ||= []).push(ci); });
      for (const idxs of Object.values(byView)) {
        for (let w = 0; w < 2; w++) {
          for (let si = 0; si < chart.length; si++) {
            const sorted = idxs.slice().sort((a, b) => rank(cols[a]) - rank(cols[b]));
            for (let k = 1; k < sorted.length; k++) {
              const a = sorted[k - 1], b = sorted[k];
              if (rank(cols[a]) === rank(cols[b])) continue;
              if (chart[si][w][b] < chart[si][w][a]) {
                bad.push(`${RESORTS[ri].name.replace(/&amp;/g, "&")} ${yr} season ${si} ` +
                  `${cols[b]} (${chart[si][w][b]}) < ${cols[a]} (${chart[si][w][a]})`);
              }
            }
          }
        }
      }
    }
    assert.deepEqual(bad, [], "a larger room prices below a smaller one");
  });
});

describe("weekend premium", () => {
  test("Fri-Sat is never cheaper than Sun-Thu", () => {
    const bad = [];
    for (const { ri, yr, chart, cols } of chartYears()) {
      for (let si = 0; si < chart.length; si++) {
        for (let ci = 0; ci < cols.length; ci++) {
          if (chart[si][1][ci] < chart[si][0][ci]) {
            bad.push(`${RESORTS[ri].name.replace(/&amp;/g, "&")} ${yr} season ${si} "${cols[ci]}": ` +
              `weekend ${chart[si][1][ci]} < weekday ${chart[si][0][ci]}`);
          }
        }
      }
    }
    assert.deepEqual(bad, [], "a weekend night prices below a weeknight");
  });
});

describe("2027 coverage", () => {
  test("provenance discloses which resorts actually have a 2027 chart", () => {
    const withY27 = CHARTS.map((c, i) => (c.y27 ? RESORTS[i].name.replace(/&amp;/g, "&") : null)).filter(Boolean);
    assert.equal(withY27.length, 2, "expected exactly two separately transcribed 2027 charts");
    const meta = g("CHARTS_META");
    for (const name of withY27) {
      const short = name.split(" ")[0];
      assert.ok(meta.source.includes(short) || meta.note.includes(short),
        `provenance should name ${name} as having its own 2027 chart`);
    }
    assert.match(meta.note, /reuse their 2026|assumption of no change/i,
      "provenance must disclose that the other resorts reuse 2026 for 2027");
  });

  test("chartFor falls back to 2026 where no 2027 chart exists", () => {
    const chartFor = g("chartFor");
    const noY27 = CHARTS.findIndex((c) => !c.y27);
    assert.ok(noY27 >= 0);
    assert.deepEqual(
      Array.from(chartFor(noY27, 2027)[0][0]),
      Array.from(CHARTS[noY27].y26[0][0]),
      "a resort without a 2027 chart should reuse its 2026 values"
    );
  });
});

describe("paste parser", () => {
  test("a listing pasted twice is counted once", () => {
    // Overlapping pastes (two broker pages, or the same block grabbed twice)
    // used to inflate the ranked table with duplicate rows.
    const parseListings = g("parseListings");
    const row = "AKA6373 150 0 1 Aug 115";
    const one = parseListings(row);
    const two = parseListings(row + "\n" + row);
    assert.equal(one.out.length, 1, "precondition: the row parses");
    assert.equal(two.out.length, 1, "the repeat should be merged, not appended");
    assert.equal(two.dupes, 1, "and reported so the user knows why the count differs");
  });

  test("distinct listings are still both kept", () => {
    const parseListings = g("parseListings");
    const r = parseListings("AKA6373 150 0 1 Aug 115\nAKC6372 250 0 500 Aug 111");
    assert.equal(r.out.length, 2);
    assert.equal(r.dupes, 0);
  });
});
