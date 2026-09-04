// Data extraction and provenance.
//
// The other suites run against index.html with its data scripts inlined, which
// is byte-equivalent but does NOT prove the <script src="data/..."> tags
// actually resolve. That wiring is verified here against the real files on
// disk, so a renamed or deleted data file fails loudly instead of silently
// leaving the app with undefined globals.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { load, dataScriptPaths } from "./harness.mjs";

const { g, el } = load();
const root = new URL("../", import.meta.url);

describe("data files", () => {
  test("every <script src> in index.html resolves to a real file", () => {
    const paths = dataScriptPaths();
    assert.ok(paths.length >= 3, `expected the data scripts to be linked, found ${paths.length}`);
    for (const p of paths) {
      assert.ok(existsSync(new URL(p, root)), `index.html references ${p}, which does not exist`);
    }
  });

  test("the data files are the ones actually carrying the data", () => {
    const paths = dataScriptPaths();
    const combined = paths.map((p) => readFileSync(new URL(p, root), "utf8")).join("\n");
    for (const name of ["RESORTS", "CHARTS", "SEASONS", "RACK", "MARKET", "ROFR", "CASH_SEASON"]) {
      assert.ok(
        new RegExp(`\\bconst ${name}\\b`).test(combined),
        `${name} should be declared in a data file, not inline in index.html`
      );
    }
  });

  test("index.html no longer declares the extracted data itself", () => {
    const html = readFileSync(new URL("index.html", root), "utf8");
    // Strip the <script src> lines so we are only looking at inline content.
    const inline = html.replace(/<script src="[^"]+"><\/script>/g, "");
    for (const name of ["RESORTS", "CHARTS", "SEASONS", "RACK", "MARKET"]) {
      assert.ok(
        !new RegExp(`\\bconst ${name}\\s*=\\s*[[{]`).test(inline),
        `${name} is still declared inline in index.html — extraction did not take`
      );
    }
  });

  test("the data survived extraction intact", () => {
    assert.equal(g("RESORTS").length, 12, "12 resorts");
    assert.equal(g("CHARTS").length, 12, "12 charts");
    assert.equal(g("RACK").length, 12);
    assert.equal(g("MARKET").length, 12);
    assert.equal(g("ROFR").length, 12);
    assert.equal(g("CASH_SEASON").length, 7);
    assert.deepEqual(Object.keys(g("SEASONS")), ["2026", "2027"]);
  });
});

describe("provenance", () => {
  const REQUIRED = ["label", "source", "captured", "estimated"];

  test("every dataset declares complete provenance", () => {
    const sets = g("DATASETS");
    assert.ok(sets.length >= 6, `expected provenance for each dataset, got ${sets.length}`);
    sets.forEach((m, i) => {
      for (const key of REQUIRED) {
        assert.ok(
          Object.prototype.hasOwnProperty.call(m, key),
          `DATASETS[${i}] (${m.label || "unlabelled"}) is missing "${key}"`
        );
      }
      assert.equal(typeof m.estimated, "boolean", `${m.label}: estimated must be a boolean`);
      assert.match(m.captured, /^\d{4}-\d{2}-\d{2}$/, `${m.label}: captured must be ISO yyyy-mm-dd`);
      assert.ok(String(m.source).length > 0, `${m.label}: source must not be empty`);
    });
  });

  test("the rack rates and seasonality are flagged estimated", () => {
    // These are the two the handoff singled out: they are the author's guesses
    // and they render alongside sourced figures, so mislabelling them is the
    // specific failure this test exists to prevent.
    const byLabel = Object.fromEntries(g("DATASETS").map((m) => [m.label, m]));
    const rack = byLabel["Published nightly rack rates"];
    const seasonality = byLabel["Cash rate seasonality"];
    assert.ok(rack, "rack rate provenance should be present");
    assert.ok(seasonality, "seasonality provenance should be present");
    assert.equal(rack.estimated, true, "rack rates must be flagged as estimated");
    assert.equal(seasonality.estimated, true, "cash seasonality must be flagged as estimated");
  });

  test("the point charts are flagged sourced", () => {
    const charts = g("DATASETS").find((m) => /point charts/i.test(m.label));
    assert.ok(charts, "chart provenance should be present");
    assert.equal(charts.estimated, false, "transcribed Disney charts are sourced, not estimated");
  });

  test("the provenance table renders a row per dataset", () => {
    const rows = el("provBody").querySelectorAll("tr");
    assert.equal(rows.length, g("DATASETS").length, "one row per dataset");
  });

  test("estimated rows are visually distinguished from sourced ones", () => {
    const body = el("provBody").innerHTML;
    assert.ok(body.includes("ESTIMATED"), "estimated datasets should be labelled in the table");
    assert.ok(body.includes("SOURCED"), "sourced datasets should be labelled in the table");
    assert.ok(
      el("provBody").querySelectorAll(".prov-tag.est").length > 0,
      "estimated rows should carry the distinguishing class"
    );
  });
});
