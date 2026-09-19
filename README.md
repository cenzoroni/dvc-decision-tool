# DVC Decision Tool

A free calculator for Disney Vacation Club at Walt Disney World. Answers three
questions in order: whether to own at all, whether to buy resale or direct, and
which contract to buy — worked out from how your family actually travels.

**Live: https://dvc.altavilla.dev/**

Not affiliated with, endorsed by, or connected to The Walt Disney Company or
Disney Vacation Development, Inc. Informational only — not financial advice.

## What it does

Everything starts from the trips you enter: resort, room, and a list of stays
with dates, nights and any resident or passholder discount. Each trip's cash
rate is filled in from Disney's published 2026 rate tables for those dates and
can be overridden. From there the page is four views:

- **Decide** — own or book, priced four ways (own resale, own direct, rent
  points, book cash) with a break-even ledger for both routes in; every resort
  priced for your trips; resale versus direct; cost per point-year.
- **Explore** — what a contract buys across every room and season, and what a
  specific stay costs by check-in date.
- **Shop** — score a single resale listing, or paste a broker's board to rank it.
- **Read** — resort reference, what the model leaves out, the resale fine
  print, and where every number comes from.

All figures are in today's dollars. The one escalation assumption is how fast
dues rise relative to room rates; equal rates (the default) keep every figure
flat. Scenarios are shareable: the inputs and the current view ride in the URL.

## How it is built

Four plain files and a data directory, deployed exactly as they sit in the
repo — no build step, no framework, no backend:

- `index.html` — the page
- `styles.css` — the stylesheet; light and dark token blocks at the top
- `app.js` — the model and rendering
- `data/` — point charts, resort facts, market snapshot and cash rates, each
  file declaring its own provenance (sourced or estimated, when, from where)

Resale listings are **not** bundled. Brokers' terms prohibit republishing their
inventory, so the tool ships with an empty listing set and users paste in
listings from whatever broker they are browsing.

## Deploying

A push to `main` deploys. `.github/workflows/deploy.yml` runs the tests,
stamps the commit hash and time into the footer, authenticates to Google Cloud
through Workload Identity Federation (no stored keys), and runs
`firebase deploy --only hosting:dvc`. It takes about a minute. The footer of
the live page says which commit it is — compare it to `git log --oneline -1`.

Hosting is the `altavilla-dvc` site in the `altavilla-dev` Firebase project,
mapped to dvc.altavilla.dev; `firebase.json` and `.firebaserc` carry the
config. HTML is served `no-cache` so a deploy is visible on the next reload;
CSS, JS and data cache for five minutes.

To deploy by hand — only if CI is unavailable — run
`npx firebase-tools deploy --only hosting:dvc --project altavilla-dev` after
`npx firebase-tools login`. The footer will read "dev", since the stamp is
applied by the workflow.

## Tests

```
npm install
npm test
```

The suite runs against the shipped files themselves — `test/harness.mjs`
loads `index.html` into jsdom with the stylesheet, script and data inlined, so
there is no separate copy of the logic to drift out of sync. `test.yml` runs it
on every push and pull request, and the deploy workflow runs it again before
shipping.

- `data.test.mjs` — chart, season, cash-rate and parallel-array integrity
- `chart-anomalies.test.mjs` — transcription sanity: season and room ordering
- `calc.test.mjs` — cost model and point arithmetic
- `functional.test.mjs` — full render sweep, hostile inputs, multi-trip model
- `decision-support.test.mjs` — verdict language, per-trip discounts,
  break-even, section order and layout
- `escalation.test.mjs` — today's-dollars invariants and the room tax
- `audit-regressions.test.mjs` — guards for bugs found in the September 2026
  audit, per-trip cash rates and URL cleanliness
- `urlstate.test.mjs` — scenarios round-trip through the link; hostile links
  degrade to defaults
- `theme.test.mjs` — dark-mode token coverage and WCAG contrast in both themes
- `provenance.test.mjs` — every dataset declares its provenance; every linked
  file exists

## Known limitations

- Point charts end 31 Dec 2027; 2028 charts publish around Dec 2026. Only
  Animal Kingdom Villas and Polynesian have separately transcribed 2027 charts;
  the rest reuse 2026 values.
- Cash rates are Disney's published 2026 tables for the studio at each resort,
  applied to 2027 by day of year. Other rooms are not tabulated; type the rate
  on the trip.
- Old Key West's two deeds (2042 original, 2057 extended) are modelled as one
  at the 2057 figure. Extended contracts trade at a premium.
- Financing, selling costs and special assessments are not modelled. The page
  lists them rather than guessing at them.
- Walt Disney World only — Aulani, Disneyland Hotel, Grand Californian, Vero
  Beach and Hilton Head are absent.
