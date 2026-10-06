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
- frankfurter.dev (ECB reference exchange rates; first of three routes, then the ECB Data Portal, then Eurostat)

There is no private server. `data/snapshot.json` is a bundled baseline shown on a first visit until the live fetch completes; refresh it with `node tools/snapshot.mjs`.

## Legal notes and evidence

Every EU legal note links to the official text it rests on, and every simulator coefficient links to the studies behind it. `node tools/check-sources.mjs` re-checks them: it confirms that the passage recorded for each note (`data/legal-quotes.json`) appears in the official text, and reads each cited act's in-force status and last day of application from the EU Publications Office database into `js/legal-status.js`. The tool uses those dates to flag a note by itself once its act stops applying. Run the check before each release; update the review date in `js/strategies.js` only after re-reading the notes.

## Install and offline use

The tool is a progressive web app. Use the **Install app** button, or the browser's "Install" / "Add to Home Screen" option. After the first visit it opens and works without a connection, showing the last figures it fetched.

## Updating the live site

Commit to `main` — with `git push` from any computer, or by editing a file on github.com. Nothing else is needed: the page looks up the newest commit and runs that exact version through the jsDelivr CDN, so changes reach people the next time they open the tool (it re-checks every ten minutes or so), with no build step.

GitHub Pages serves only a small loader, from the `live` branch, so ordinary commits to `main` cause no GitHub build. The one exception: after changing a loader file (`index.html`, `sw.js`, `manifest.webmanifest`, `icons/`), run `tools/rebuild-shell.sh` once to copy `main` to `live`. If you edited a script inside `index.html`, run `node tools/csp.mjs` first so the page's security policy lists the new script.

## Hosting it elsewhere

The site is plain static files with no build step. `tools/mirror.sh <git-remote-url>` copies the `main` and `live` branches to an additional git host; publish the `live` branch there as a static site and add the new address to `mirrors.json`.

## Independence

An independent tool, not affiliated with the European Union or the European Central Bank. Calculated gauges, projections and simulator results are illustrative and are documented in the tool under Data & Method.

© 2026 Samuel Akosa Onyejekwe
