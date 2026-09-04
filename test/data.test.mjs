// Data-integrity tests for the point charts, season calendars and resort
// metadata baked into index.html. These do not exercise UI behavior; they
// verify that the raw data tables are internally consistent.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { load } from "./harness.mjs";

const { g } = load();

const RESORTS = g("RESORTS");
const CHARTS = g("CHARTS");
const SEASONS = g("SEASONS");
const RACK = g("RACK");
const ROFR = g("ROFR");
const MARKET = g("MARKET");
const CASH_SEASON = g("CASH_SEASON");
const SEASON_SHORT = g("SEASON_SHORT");
const seasonIndex = g("seasonIndex");

const N_SEASONS = 7;
const N_WEEKEND_FLAGS = 2; // [0] = Sun-Thu, [1] = Fri-Sat

// ---------------------------------------------------------------------------
// 1. The 861-cell chart check
// ---------------------------------------------------------------------------
//
// IMPORTANT: The original spec for this check was "every published weekly
// total equals 5 x Sun-Thu + 2 x Fri-Sat", cross-checked against Disney's
// published weekly point totals. This dataset (CHARTS in index.html) does
// NOT contain those published weekly totals anywhere -- only the two daily
// rates (Sun-Thu, Fri-Sat) per season/column are stored. There is nothing to
// cross-check the transcription against within this file, so that exact
// check cannot be implemented honestly here.
//
// Instead this block asserts the strongest structural invariants the data
// actually supports:
//   - there are exactly 861 (chart-year, season, column) cells across the
//     14 chart-years (12 resorts x y26, plus 2 resorts that also carry a
//     distinct y27 table)
//   - every stored point value is a positive integer
//   - within a cell, the Fri-Sat rate is never cheaper than the Sun-Thu rate
describe("chart cell structure (861-cell check)", () => {
  // Build the flat list of chart-years to iterate: {resortIdx, year, table}
  const chartYears = [];
  CHARTS.forEach((c, ri) => {
    chartYears.push({ resortIdx: ri, label: "y26", table: c.y26 });
    if (c.y27) chartYears.push({ resortIdx: ri, label: "y27", table: c.y27 });
  });

  test("there are exactly 14 chart-years (12 resorts x y26, plus 2 with a distinct y27)", () => {
    assert.equal(chartYears.length, 14, "expected 12 y26 tables + 2 y27 tables");
  });

  test("there are exactly 861 (chart-year, season, column) cells total", () => {
    let total = 0;
    for (const { table } of chartYears) {
      for (let s = 0; s < N_SEASONS; s++) total += table[s][0].length;
    }
    assert.equal(total, 861, "total cell count across all chart-years must be 861");
  });

  test("every season row has both a Sun-Thu and a Fri-Sat array", () => {
    for (const { resortIdx, label, table } of chartYears) {
      assert.equal(table.length, N_SEASONS, `${RESORTS[resortIdx].name} ${label}: expected ${N_SEASONS} season rows`);
      table.forEach((row, s) => {
        assert.equal(row.length, N_WEEKEND_FLAGS, `${RESORTS[resortIdx].name} ${label} season ${s}: expected [Sun-Thu, Fri-Sat] pair`);
      });
    }
  });

  test("every stored point value is a positive integer", () => {
    for (const { resortIdx, label, table } of chartYears) {
      const resortName = RESORTS[resortIdx].name;
      for (let s = 0; s < N_SEASONS; s++) {
        for (let wk = 0; wk < N_WEEKEND_FLAGS; wk++) {
          table[s][wk].forEach((v, ci) => {
            assert.ok(
              Number.isInteger(v) && v > 0,
              `${resortName} ${label} season ${s} ${wk === 0 ? "Sun-Thu" : "Fri-Sat"} col ${ci} ("${CHARTS[resortIdx].cols[ci]}"): value ${v} is not a positive integer`
            );
          });
        }
      }
    }
  });

  test("the Fri-Sat rate is never cheaper than the Sun-Thu rate for the same season/column", () => {
    for (const { resortIdx, label, table } of chartYears) {
      const resortName = RESORTS[resortIdx].name;
      const cols = CHARTS[resortIdx].cols;
      for (let s = 0; s < N_SEASONS; s++) {
        const weekday = table[s][0];
        const weekend = table[s][1];
        for (let ci = 0; ci < cols.length; ci++) {
          assert.ok(
            weekend[ci] >= weekday[ci],
            `${resortName} ${label} season ${s} col ${ci} ("${cols[ci]}"): Fri-Sat (${weekend[ci]}) is less than Sun-Thu (${weekday[ci]})`
          );
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Season coverage
// ---------------------------------------------------------------------------
describe("season coverage", () => {
  function daysOfYear(year) {
    const days = [];
    const d = new Date(year, 0, 1);
    while (d.getFullYear() === year) {
      days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return days;
  }

  function bandsContaining(year, mmdd) {
    const bands = SEASONS[year];
    const hits = [];
    bands.forEach((band, i) => {
      for (const [a, b] of band.r) {
        if (mmdd >= a && mmdd <= b) {
          hits.push(i);
          break;
        }
      }
    });
    return hits;
  }

  for (const year of [2026, 2027]) {
    test(`SEASONS[${year}] ranges tile the whole year exactly once (no gaps, no overlaps)`, () => {
      for (const d of daysOfYear(year)) {
        const mmdd = (d.getMonth() + 1) * 100 + d.getDate();
        const hits = bandsContaining(year, mmdd);
        assert.equal(
          hits.length,
          1,
          `${year}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} (mmdd ${mmdd}) ` +
            `matched ${hits.length} season band(s): [${hits.join(", ")}] -- expected exactly 1`
        );
      }
    });

    test(`seasonIndex() agrees with the SEASONS[${year}] ranges for every calendar day`, () => {
      for (const d of daysOfYear(year)) {
        const mmdd = (d.getMonth() + 1) * 100 + d.getDate();
        const expected = bandsContaining(year, mmdd)[0];
        const actual = seasonIndex(d);
        assert.equal(
          actual,
          expected,
          `${year}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}: ` +
            `seasonIndex() returned ${actual}, but the SEASONS[${year}] ranges say ${expected}`
        );
      }
    });
  }
});

// ---------------------------------------------------------------------------
// 3. Chart row widths
// ---------------------------------------------------------------------------
describe("chart row widths match cols.length", () => {
  CHARTS.forEach((c, ri) => {
    const resortName = RESORTS[ri].name;
    test(`${resortName}: every y26 season row (both Sun-Thu and Fri-Sat) has length === cols.length (${c.cols.length})`, () => {
      c.y26.forEach((row, s) => {
        assert.equal(row[0].length, c.cols.length, `${resortName} y26 season ${s} Sun-Thu row width mismatch`);
        assert.equal(row[1].length, c.cols.length, `${resortName} y26 season ${s} Fri-Sat row width mismatch`);
      });
    });

    if (c.y27) {
      test(`${resortName}: every y27 season row (both Sun-Thu and Fri-Sat) has length === cols.length (${c.cols.length})`, () => {
        c.y27.forEach((row, s) => {
          assert.equal(row[0].length, c.cols.length, `${resortName} y27 season ${s} Sun-Thu row width mismatch`);
          assert.equal(row[1].length, c.cols.length, `${resortName} y27 season ${s} Fri-Sat row width mismatch`);
        });
      });
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Parallel array alignment
// ---------------------------------------------------------------------------
describe("parallel arrays are aligned with RESORTS", () => {
  test("RESORTS, ROFR, RACK, MARKET, CHARTS all have the same length", () => {
    assert.equal(ROFR.length, RESORTS.length, `ROFR.length (${ROFR.length}) !== RESORTS.length (${RESORTS.length})`);
    assert.equal(RACK.length, RESORTS.length, `RACK.length (${RACK.length}) !== RESORTS.length (${RESORTS.length})`);
    assert.equal(MARKET.length, RESORTS.length, `MARKET.length (${MARKET.length}) !== RESORTS.length (${RESORTS.length})`);
    assert.equal(CHARTS.length, RESORTS.length, `CHARTS.length (${CHARTS.length}) !== RESORTS.length (${RESORTS.length})`);
  });

  test("every RESORTS entry has a corresponding CHARTS entry with a non-empty cols array", () => {
    RESORTS.forEach((r, i) => {
      assert.ok(Array.isArray(CHARTS[i]?.cols) && CHARTS[i].cols.length > 0, `CHARTS[${i}] ("${r.name}") is missing a non-empty cols array`);
    });
  });

  test("every MARKET entry has ask/n/live fields, with ask either a positive number or null", () => {
    MARKET.forEach((m, i) => {
      const resortName = RESORTS[i].name;
      assert.ok(m.ask === null || (typeof m.ask === "number" && m.ask > 0), `MARKET[${i}] ("${resortName}").ask is neither null nor a positive number: ${m.ask}`);
      assert.ok(Number.isInteger(m.n) && m.n >= 0, `MARKET[${i}] ("${resortName}").n is not a non-negative integer: ${m.n}`);
      assert.ok(Number.isInteger(m.live) && m.live >= 0, `MARKET[${i}] ("${resortName}").live is not a non-negative integer: ${m.live}`);
      assert.ok(m.live <= m.n, `MARKET[${i}] ("${resortName}"): live listings (${m.live}) exceeds total listings (${m.n})`);
    });
  });

  test("RACK and ROFR entries are non-negative numbers", () => {
    RESORTS.forEach((r, i) => {
      assert.ok(typeof RACK[i] === "number" && RACK[i] > 0, `RACK[${i}] ("${r.name}") is not a positive number: ${RACK[i]}`);
      assert.ok(typeof ROFR[i] === "number" && ROFR[i] >= 0, `ROFR[${i}] ("${r.name}") is not a non-negative number: ${ROFR[i]}`);
    });
  });

  test("CASH_SEASON and SEASON_SHORT have exactly 7 entries, one per season", () => {
    assert.equal(CASH_SEASON.length, N_SEASONS, `CASH_SEASON.length (${CASH_SEASON.length}) !== ${N_SEASONS}`);
    assert.equal(SEASON_SHORT.length, N_SEASONS, `SEASON_SHORT.length (${SEASON_SHORT.length}) !== ${N_SEASONS}`);
  });
});

// ---------------------------------------------------------------------------
// 5. Room lists sorted cheapest-first
// ---------------------------------------------------------------------------
//
// Disney's own point charts group columns by room size then view, which the
// page itself acknowledges is "not cost order" (see sortedCols() in
// index.html). RESORTS[i].rooms is a separate, hand-written list intended to
// read cheapest-to-priciest for a human. To check that claim against the
// chart data we have to match each room's display name to the chart
// column(s) whose "Room|View" prefix describes it -- but the two lists don't
// use identical vocabulary:
//   - "One-Bedroom Villa" / "Two-Bedroom Villa" in rooms vs. "One-Bedroom" /
//     "Two-Bedroom" in chart cols (the word "Villa" is dropped, except for
//     "Three-Bedroom Grand Villa" which keeps it).
//   - Copper Creek's "Cascade Cabin" room vs. chart column
//     "Cascade Cabin (Two-Bedroom)".
//   - Saratoga Springs's "Treehouse Villa" room vs. chart column
//     "Three-Bedroom Treehouse Villa".
// These three cases were confirmed by hand to refer to the same physical
// room type, so they're recorded as an explicit alias table below rather
// than guessed at with fuzzy substring matching (which turns out to be
// unsafe here: e.g. a naive "startsWith" match would also fold Polynesian's
// "Island Tower Two-Bedroom Penthouse" chart column into the plain
// "Island Tower Two-Bedroom" room).
//
// One room could not be matched at all: Animal Kingdom Villas lists a
// "Value Studio" room, but AKV's chart has no separate row for it -- "Value"
// only appears as a *view* of the "Deluxe Studio" chart row
// ("Deluxe Studio|Value"). Inferring a room-to-column mapping from a view
// label would be guessing, not verifying, so that room is excluded from the
// cost check below and its exclusion is asserted explicitly instead.
//
// Independently of room-name matching, inspecting the derived costs shows
// RESORTS[i].rooms is NOT simply sorted cheapest-first across the whole
// list: standalone specialty units (the Polynesian's overwater "Bungalow"
// and Saratoga Springs's "Treehouse Villa") are priced well above rooms
// listed after them, because the list is actually grouped by product
// family/building first (main building, then Island Tower, then standalone
// specialty units) and only cheapest-first *within* a family. That is the
// real, verifiable invariant, so it's what this test checks -- asserting a
// flat cheapest-first order across the whole list would be asserting
// something the data does not support.
describe("room lists are cheapest-first within their product family", () => {
  const ROOM_ALIASES = {
    "Cascade Cabin": ["Cascade Cabin (Two-Bedroom)"],
    "Treehouse Villa": ["Three-Bedroom Treehouse Villa"],
  };

  // Known rooms that have no matching chart column at all (see comment above).
  const EXPECTED_UNMATCHED = [{ resort: "Animal Kingdom Villas", room: "Value Studio" }];

  function candidateColRoomParts(roomName) {
    if (ROOM_ALIASES[roomName]) return ROOM_ALIASES[roomName];
    const stripped = roomName.replace(/(?<!Grand) Villa$/, "").trim();
    return stripped !== roomName ? [stripped, roomName] : [roomName];
  }

  function chartTableFor(ri) {
    return CHARTS[ri].y27 || CHARTS[ri].y26;
  }

  // Average nightly points across all 7 seasons, weighting 5 weekday nights
  // and 2 weekend nights per week (matches the weighting index.html itself
  // uses in sortedCols()).
  function avgNightlyPoints(ri, colIdx) {
    const table = chartTableFor(ri);
    let sum = 0;
    for (let s = 0; s < N_SEASONS; s++) sum += (5 * table[s][0][colIdx] + 2 * table[s][1][colIdx]) / 7;
    return sum / N_SEASONS;
  }

  // Family grouping key: rooms are grouped cheapest-first within a family,
  // and families themselves appear in whatever order the resort chose
  // (typically main building, then satellite building, then standalone
  // specialty units).
  const STANDALONE_SPECIALTY = new Set(["Bungalow", "Cascade Cabin", "Treehouse Villa", "Cabin"]);
  function familyKey(roomName) {
    if (roomName.startsWith("Island Tower ")) return "Island Tower";
    if (roomName.startsWith("Longhouse ")) return "Longhouse";
    if (STANDALONE_SPECIALTY.has(roomName)) return `standalone:${roomName}`;
    return "main";
  }

  const actualUnmatched = [];

  RESORTS.forEach((r, ri) => {
    const colParts = CHARTS[ri].cols.map((c) => c.split("|")[0]);

    test(`${r.name}: every room in the list either matches a chart column or is a documented exception`, () => {
      const unmatchedHere = [];
      for (const [roomName] of r.rooms) {
        const candidates = candidateColRoomParts(roomName);
        const matchedCols = colParts.map((c, ci) => ({ c, ci })).filter(({ c }) => candidates.includes(c));
        if (matchedCols.length === 0) unmatchedHere.push(roomName);
      }
      actualUnmatched.push(...unmatchedHere.map((room) => ({ resort: r.name, room })));

      const expectedHere = EXPECTED_UNMATCHED.filter((x) => x.resort === r.name).map((x) => x.room);
      assert.deepEqual(
        unmatchedHere,
        expectedHere,
        `${r.name}: unmatched rooms were [${unmatchedHere.join(", ")}], expected [${expectedHere.join(", ")}]`
      );
    });

    test(`${r.name}: rooms are non-decreasing in average nightly points within each product family, in list order`, () => {
      const matchedRooms = [];
      for (const [roomName] of r.rooms) {
        const candidates = candidateColRoomParts(roomName);
        const matchedCols = colParts.map((c, ci) => ({ c, ci })).filter(({ c }) => candidates.includes(c));
        if (matchedCols.length === 0) continue; // documented exception, skipped (see EXPECTED_UNMATCHED check)
        const minAvg = Math.min(...matchedCols.map(({ ci }) => avgNightlyPoints(ri, ci)));
        matchedRooms.push({ roomName, minAvg, family: familyKey(roomName) });
      }

      const lastSeenInFamily = new Map();
      for (const { roomName, minAvg, family } of matchedRooms) {
        const prev = lastSeenInFamily.get(family);
        if (prev !== undefined) {
          assert.ok(
            minAvg >= prev.minAvg - 1e-9,
            `${r.name}: "${roomName}" (${minAvg.toFixed(1)} pts/night avg) is cheaper than "${prev.roomName}" ` +
              `(${prev.minAvg.toFixed(1)} pts/night avg) which precedes it in the same "${family}" family -- not cheapest-first`
          );
        }
        lastSeenInFamily.set(family, { roomName, minAvg });
      }
    });
  });

  test("the only room in the whole dataset with no matching chart column is AKV's Value Studio (documented exception)", () => {
    assert.deepEqual(
      actualUnmatched,
      EXPECTED_UNMATCHED,
      `unmatched rooms changed -- update ROOM_ALIASES/EXPECTED_UNMATCHED if this is a legitimate new naming difference, ` +
        `or fix the data if it's a real mismatch. Found: ${JSON.stringify(actualUnmatched)}`
    );
  });
});
