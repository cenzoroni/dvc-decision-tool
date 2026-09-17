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

  test("the page links its own stylesheet and script, and both exist", () => {
    const html = readFileSync(new URL("index.html", root), "utf8");
    assert.match(html, /<link rel="stylesheet" href="styles.css">/, "styles.css should be linked");
    assert.match(html, /<script src="app.js"><\/script>/, "app.js should be linked");
    assert.ok(existsSync(new URL("styles.css", root)) && existsSync(new URL("app.js", root)));
    // The stylesheet must be linked before the pre-paint theme script so a
    // stored preference is applied against real styles, not a bare document.
    assert.ok(html.indexOf('href="styles.css"') < html.indexOf('localStorage.getItem("dvc-theme")'));
  });

  test("the data files are the ones actually carrying the data", () => {
    const paths = dataScriptPaths();
    const combined = paths.map((p) => readFileSync(new URL(p, root), "utf8")).join("\n");
    for (const name of ["RESORTS", "CHARTS", "SEASONS", "CASH_RATES", "MARKET", "ROFR", "ROOM_TAX"]) {
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
    for (const name of ["RESORTS", "CHARTS", "SEASONS", "CASH_RATES", "MARKET"]) {
      assert.ok(
        !new RegExp(`\\bconst ${name}\\s*=\\s*[[{]`).test(inline),
        `${name} is still declared inline in index.html — extraction did not take`
      );
    }
  });

  test("the data survived extraction intact", () => {
    assert.equal(g("RESORTS").length, 12, "12 resorts");
    assert.equal(g("CHARTS").length, 12, "12 charts");
    assert.equal(g("CASH_RATES").length, 12);
    assert.equal(g("MARKET").length, 12);
    assert.equal(g("ROFR").length, 12);
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

  test("the seasonality estimate is gone", () => {
    // Cash seasonality used to be a set of guessed multipliers indexed to the
    // point-chart seasons. It was replaced by Disney's published rate for
    // every date band, so there is no longer an estimated seasonality dataset
    // to disclose — and it must not quietly come back.
    const labels = g("DATASETS").map((m) => m.label);
    assert.ok(!labels.some((l) => /seasonality/i.test(l)), `seasonality should no longer be a dataset: ${labels}`);
  });

  test("cash rates are sourced per date band, and say what they cover", () => {
    const byLabel = Object.fromEntries(g("DATASETS").map((m) => [m.label, m]));
    const rates = byLabel["Nightly cash rates by date"];
    assert.ok(rates, "cash rate provenance should be present");
    assert.equal(rates.estimated, false, "published tables are sourced, not estimated");
    assert.match(rates.note, /tax/i,
      "the tax basis must be stated — published figures include 12.5% and the model needs them net");
    assert.match(rates.note, /studio/i, "must say which room the tables cover");
    assert.match(rates.note, /2027/, "must disclose that 2026 dates stand in for 2027");
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
