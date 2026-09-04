// Loads index.html into a jsdom window so tests run against the SHIPPED file.
// There is no build step and no duplicated copy of the logic: if index.html is
// the thing deployed, it is also the thing tested.
//
// Top-level `function` declarations land on `window`, but top-level `const`/`let`
// go to the global lexical scope instead — reachable only through `window.eval`.
// `g()` papers over that difference so callers do not have to care which is which.

import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

let cached = null;

const SRC_TAG = /<script src="([^"]+)"><\/script>/g;

// The data files are classic scripts that only declare top-level consts, so
// inlining them produces byte-identical global state to letting jsdom fetch
// them — but synchronously, which keeps every test free of async plumbing.
// The real <script src> resolution is covered separately in data.test.mjs.
export function inlineDataScripts(html, baseUrl) {
  return html.replace(SRC_TAG, (whole, src) => {
    const body = readFileSync(new URL("../" + src, baseUrl), "utf8");
    return "<script>\n" + body + "\n</script>";
  });
}

export function dataScriptPaths() {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  return Array.from(html.matchAll(SRC_TAG)).map((m) => m[1]);
}

export function load({ fresh = false, search = "" } = {}) {
  if (cached && !fresh && !search) return cached;

  const html = inlineDataScripts(
    readFileSync(new URL("../index.html", import.meta.url), "utf8"),
    import.meta.url
  );
  const dom = new JSDOM(html, {
    // history.replaceState needs a real origin; about:blank throws SecurityError.
    url: "https://dvc.test/" + search,
    runScripts: "dangerously",
    // The page pulls Google Fonts; tests neither need them nor should hit the network.
    resources: undefined,
    pretendToBeVisual: true,
  });

  const w = dom.window;
  const g = (expr) => w.eval(expr);

  const api = {
    dom,
    window: w,
    document: w.document,
    g,
    el: (id) => w.document.getElementById(id),
    // Set a form control's value and fire the event the page listens for.
    set(id, value, event = "input") {
      const node = w.document.getElementById(id);
      if (!node) throw new Error(`no element #${id}`);
      if (node.type === "checkbox") node.checked = !!value;
      else node.value = String(value);
      node.dispatchEvent(new w.Event(event, { bubbles: true }));
      return node;
    },
  };

  if (!fresh && !search) cached = api;
  return api;
}

// Every string that reaches the DOM should be free of these.
export const BAD_NUMBERS = ["NaN", "undefined", "Infinity", "-Infinity", "null"];

export function assertNoBadNumbers(text, context) {
  for (const bad of BAD_NUMBERS) {
    // Word-boundary match so "undefined" inside a longer word does not false-positive.
    const re = new RegExp(`\\b${bad.replace("-", "\\-")}\\b`);
    if (re.test(text)) {
      throw new Error(`${context}: rendered output contains "${bad}"`);
    }
  }
}
