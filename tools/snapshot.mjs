// Refreshes data/snapshot.json, the bundled baseline the app shows on a first
// visit before its own live fetch completes. Run: node tools/snapshot.mjs
import { writeFileSync } from 'node:fs';
import { ALL_IDS, fetchDataset } from '../js/data.js';

const out = { built: new Date().toISOString(), d: {} };
for (const id of ALL_IDS) {
  try {
    const o = await fetchDataset(id);
    o.at = 0; // always counts as stale, so browsers refresh it on load
    out.d[id] = o;
    console.log(id.padEnd(8), 'ok ', o.t.length, 'periods,', Object.keys(o.s).length, 'series, last', o.t[o.t.length - 1]);
  } catch (e) {
    console.log(id.padEnd(8), 'FAILED', e.message);
  }
}
const file = new URL('../data/snapshot.json', import.meta.url);
writeFileSync(file, JSON.stringify(out));
console.log('wrote', JSON.stringify(out).length, 'bytes');
