// The page allows only two inline scripts, identified by their SHA-256 hashes in
// the Content-Security-Policy tag of index.html. After editing either script run
//   node tools/csp.mjs          to write the new hashes into index.html
//   node tools/csp.mjs --check  to confirm they are current (used by rebuild-shell.sh)
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const file = new URL('../index.html', import.meta.url);
const html = readFileSync(file, 'utf8');
const hashes = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]).filter(Boolean)
  .map(src => "'sha256-" + createHash('sha256').update(src).digest('base64') + "'");
const next = html.replace(/(script-src 'self' https:\/\/cdn\.jsdelivr\.net\/gh\/[^ ;]+)((?: 'sha256-[^']+')*)/, (_, head) => head + ' ' + hashes.join(' '));
if (process.argv.includes('--check')) {
  if (next !== html) { console.error('index.html: script hashes are out of date. Run: node tools/csp.mjs'); process.exit(1); }
  console.log('index.html: script hashes are current.');
} else if (next !== html) { writeFileSync(file, next); console.log('index.html: script hashes updated.'); } else console.log('index.html: script hashes already current.');
