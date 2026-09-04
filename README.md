# DVC Decision Tool

A free calculator for Disney Vacation Club at Walt Disney World. Answers three
questions in order: whether to own at all, whether to buy resale or direct, and
which contract to buy.

**Live: https://cenzoroni.github.io/dvc-decision-tool/**

Not affiliated with, endorsed by, or connected to The Walt Disney Company or
Disney Vacation Development, Inc. Informational only — not financial advice.

## How it works

`index.html` is the whole application: no build step, no dependencies, no
backend. It is deployed to GitHub Pages exactly as it sits in the repo.

Resale listings are **not** bundled. Brokers' terms prohibit republishing their
inventory, so the tool ships with an empty listing set and users paste in
listings from whatever broker they are browsing. That keeps this a calculator
rather than a redistributor, and means nobody is served a stale snapshot.

## Tests

```
npm install
npm test
```

Tests run against `index.html` itself — the shipped file is the tested file,
loaded into jsdom by `test/harness.mjs`. There is no separate copy of the logic
to drift out of sync.

- `test/data.test.mjs` — chart/season/parallel-array integrity
- `test/calc.test.mjs` — cost model and point arithmetic
- `test/functional.test.mjs` — render sweep and hostile inputs

CI runs the suite on every push and pull request.

## Known limitations

- Point charts end 31 Dec 2027; 2028 charts publish around Dec 2026.
- Old Key West's two deeds (2042 original, 2057 extended) are modelled as one
  at the 2057 figure. Extended contracts trade at a premium.
- Rack rates and cash seasonality multipliers are rough estimates, not sourced
  Disney figures. They are disclosed as such in the UI and should be replaced
  with real looked-up rates.
- Charts cover Walt Disney World only — Aulani, Disneyland Hotel, Grand
  Californian, Vero Beach and Hilton Head are absent.
- No deep-linkable state; scenarios cannot yet be shared by URL.
