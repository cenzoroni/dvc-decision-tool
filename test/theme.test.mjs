// Dark mode. The rules never change between themes — only the tokens do — so
// these tests police the tokens and the switching, not individual components.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { load } from "./harness.mjs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];

const block = (re) => {
  const m = css.match(re);
  assert.ok(m, `could not find token block ${re}`);
  return Object.fromEntries(
    Array.from(m[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)).map((x) => [x[1], x[2].trim()])
  );
};

const LIGHT = block(/:root\{([\s\S]*?)\n\}/);
const DARK = block(/:root\[data-theme="dark"\]\{([\s\S]*?)\n\}/);
const DARK_MEDIA = block(/@media \(prefers-color-scheme:dark\)\{\s*:root:not\(\[data-theme="light"\]\)\{([\s\S]*?)\n  \}/);

// WCAG relative luminance / contrast ratio.
const lum = (hex) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

describe("token coverage", () => {
  test("dark redefines every colour token light defines", () => {
    // A token defined only in light silently keeps its light value in dark,
    // which is how a white card ends up on a dark page.
    const colour = (k) => !["--radius"].includes(k);
    for (const k of Object.keys(LIGHT).filter(colour)) {
      assert.ok(k in DARK, `[data-theme="dark"] never redefines ${k}`);
      assert.ok(k in DARK_MEDIA, `the prefers-color-scheme block never redefines ${k}`);
    }
  });

  test("the toggle block and the media block agree", () => {
    // These are two spellings of the same theme; drift between them means the
    // toggle and the OS setting produce different-looking pages.
    for (const k of Object.keys(DARK)) {
      assert.equal(DARK[k], DARK_MEDIA[k], `${k} differs between the two dark branches`);
    }
  });

  test("dark actually inverts the ground", () => {
    assert.ok(lum(DARK["--paper"]) < 0.2, "dark --paper should be dark");
    assert.ok(lum(DARK["--surface"]) < 0.25, "dark --surface should be dark");
    assert.ok(lum(DARK["--ink"]) > 0.6, "dark --ink should be light text");
    assert.ok(lum(LIGHT["--paper"]) > 0.8, "light --paper should be light");
  });
});

describe("contrast", () => {
  const AA = 4.5;
  for (const [name, tokens] of [["light", LIGHT], ["dark", DARK]]) {
    test(`${name}: body text clears AA on both grounds`, () => {
      for (const ground of ["--paper", "--surface"]) {
        const c = contrast(tokens["--ink"], tokens[ground]);
        assert.ok(c >= AA, `${name} --ink on ${ground} is ${c.toFixed(2)}:1, need ${AA}`);
      }
    });

    test(`${name}: secondary text clears AA on the page ground`, () => {
      const c = contrast(tokens["--ink-soft"], tokens["--paper"]);
      assert.ok(c >= AA, `${name} --ink-soft on --paper is ${c.toFixed(2)}:1, need ${AA}`);
    });

    test(`${name}: accent text clears AA on its own tint`, () => {
      // The verdict banners and stat cells put accent-coloured text on the
      // matching tint, which is the pairing most likely to fail.
      for (const [fg, bg] of [["--lagoon", "--lagoon-tint"], ["--rust", "--rust-tint"], ["--amber", "--amber-tint"]]) {
        const c = contrast(tokens[fg], tokens[bg]);
        assert.ok(c >= AA, `${name} ${fg} on ${bg} is ${c.toFixed(2)}:1, need ${AA}`);
      }
    });

    test(`${name}: text on filled buttons and table headers clears AA`, () => {
      assert.ok(contrast(tokens["--on-lagoon"], tokens["--lagoon"]) >= AA,
        `${name} --on-lagoon on --lagoon is ${contrast(tokens["--on-lagoon"], tokens["--lagoon"]).toFixed(2)}:1`);
      assert.ok(contrast(tokens["--on-ink"], tokens["--ink"]) >= AA,
        `${name} --on-ink on --ink is ${contrast(tokens["--on-ink"], tokens["--ink"]).toFixed(2)}:1`);
    });
  }
});

describe("no component hardcodes a light-mode colour", () => {
  test("every hex outside the token blocks is inside a print rule", () => {
    let stripped = css
      .replace(/:root[^{]*\{[\s\S]*?\n\}/g, "")
      .replace(/@media \(prefers-color-scheme:dark\)\{[\s\S]*?\n\}\n\}/g, "")
      .replace(/@media print\{[\s\S]*?\n\}/g, "");
    const leaks = Array.from(stripped.matchAll(/[^\n]*#[0-9A-Fa-f]{3,6}[^\n]*/g)).map((m) => m[0].trim());
    assert.deepEqual(leaks, [], `these rules hardcode a colour instead of using a token:\n${leaks.join("\n")}`);
  });
});

describe("switching", () => {
  test("the toggle stamps the theme and remembers it", () => {
    const p = load({ fresh: true });
    const root = p.document.documentElement;
    const btn = p.el("themeToggle");
    assert.ok(btn, "the theme toggle should exist");

    btn.dispatchEvent(new p.window.Event("click", { bubbles: true }));
    assert.equal(root.getAttribute("data-theme"), "dark");
    assert.equal(btn.getAttribute("aria-pressed"), "true");
    assert.match(btn.textContent, /Light mode/, "the button should offer the other direction");
    assert.equal(p.window.localStorage.getItem("dvc-theme"), "dark");

    btn.dispatchEvent(new p.window.Event("click", { bubbles: true }));
    assert.equal(root.getAttribute("data-theme"), "light");
    assert.equal(p.window.localStorage.getItem("dvc-theme"), "light");
  });

  test("no stored choice leaves the system in charge", () => {
    const p = load({ fresh: true });
    assert.equal(p.document.documentElement.getAttribute("data-theme"), null,
      "an untouched page must not stamp a theme, or it overrides the OS setting");
  });

  test("the pre-paint script runs before the stylesheet's first paint", () => {
    // If this moved below <body> a stored dark preference would flash light.
    const headEnd = html.indexOf("</head>");
    const applier = html.indexOf('localStorage.getItem("dvc-theme")');
    assert.ok(applier > 0 && applier < headEnd,
      "the theme applier must be in <head> to avoid a flash of the wrong theme");
  });
});
