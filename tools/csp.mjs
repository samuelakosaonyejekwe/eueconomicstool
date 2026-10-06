// index.html and acts.html each allow only their own inline scripts, identified by SHA-256
// hashes in the page's Content-Security-Policy tag. After editing a script in either file run
//   node tools/csp.mjs          to write the new hashes
//   node tools/csp.mjs --check  to confirm they are current (used by rebuild-shell.sh)
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const check = process.argv.includes('--check');
let stale = false;
for (const name of ['index.html', 'acts.html']) {
  const file = new URL('../' + name, import.meta.url);
  const html = readFileSync(file, 'utf8');
  const hashes = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]).filter(Boolean)
    .map(src => "'sha256-" + createHash('sha256').update(src).digest('base64') + "'");
  const next = html.replace(/(?: 'sha256-[^']+')+/, ' ' + hashes.join(' '));
  if (next === html) console.log(name + ': script hashes are current.');
  else if (check) { console.error(name + ': script hashes are out of date. Run: node tools/csp.mjs'); stale = true; }
  else { writeFileSync(file, next); console.log(name + ': script hashes updated.'); }
}
if (stale) process.exit(1);
