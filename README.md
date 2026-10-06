# EU Stability Compass

Economic decision support for the 27 EU member states.

**Open the tool:** https://samuelakosaonyejekwe.github.io/eueconomicstool/

## What it does

- **Overview** – live inflation map and ranking for all 27 member states, EU and euro-area headline figures.
- **Country** – inflation, core, unemployment, growth, wages, public finances and external balance, with a six-gauge pressure diagnosis.
- **Inflation Lab** – drivers of the headline rate, every spending category, a personal inflation calculator and a six-month early-warning projection.
- **Currency & Trade** – exchange-rate monitor for the six non-euro currencies, plus rate-lock, export-linked bond, currency-basket and export-voucher calculators.
- **Policy Simulator** – combine ten measures and see the estimated effect on inflation, the budget and growth, with EU legal notes.
- **Strategies** – a library of policy and market-design options, each assessed against EU rules and ranked against the country's diagnosis.
- **Compare** – rank member states on any indicator and follow up to four over time.
- **Data & Method** – every source, every formula and every assumption.

## Data

Each visitor's browser fetches the figures directly from the publishers' open APIs:

- Eurostat dissemination API (prices, labour market, national accounts, public finances, balance of payments, energy)
- European Central Bank Data Portal (key interest rate, reference exchange rates)
- frankfurter.dev (ECB reference exchange rates; first of three routes)

There is no private server. `data/snapshot.json` is a bundled baseline shown on a first visit until the live fetch completes; refresh it with `node tools/snapshot.mjs`.

## Install and offline use

The tool is a progressive web app. Use the **Install app** button, or the browser's "Install" / "Add to Home Screen" option. After the first visit it opens and works without a connection, showing the last figures it fetched.

## Updating the live site

Commit to `main` — with `git push` from any computer, or by editing a file on github.com. Nothing else is needed: the page looks up the newest commit and runs that exact version through the jsDelivr CDN, so changes are live within about five minutes, with no build step.

The only exception is the small loader that GitHub Pages serves directly (`index.html`, `sw.js`, `manifest.webmanifest`, `icons/`). After changing one of those, run `tools/rebuild-shell.sh` once.

## Hosting it elsewhere

The site is plain static files with relative paths and no build step. Copy the folder to any static host and it runs as is. `tools/mirror.sh <git-remote-url>` pushes the current version to an additional git host; add the new address to `mirrors.json`.

## Independence

An independent tool, not affiliated with the European Union or the European Central Bank. Calculated gauges, projections and simulator results are illustrative and are documented in the tool under Data & Method.

© 2026 Samuel Akosa Onyejekwe
