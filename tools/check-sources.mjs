// Checks every legal source cited in the tool against the EU's own records.
//   node tools/check-sources.mjs
// 1. Asks the EU Publications Office database whether each cited act is in force
//    and until when, and writes the answers to js/legal-status.js. The tool uses
//    those dates to flag a note by itself once the act behind it stops applying.
// 2. Fetches the official text of each source and confirms that the passage
//    recorded in data/legal-quotes.json really appears in it.
// Run it before each release and whenever a note is edited.
import { readFileSync, writeFileSync } from 'node:fs';
import { STRATEGIES, celexOf, actsIn } from '../js/strategies.js';
import { LEVERS, REFERENCE_VALUES } from '../js/model.js';

const quotes = JSON.parse(readFileSync(new URL('../data/legal-quotes.json', import.meta.url)));
const items = STRATEGIES.filter(s => s.src).map(s => ({ id: s.id, title: s.src[0], url: s.src[1] }))
  .concat(LEVERS.filter(l => l.ref && l.ref[1]).map(l => ({ id: 'lever:' + l.k, title: l.ref[0], url: l.ref[1] })))
  .concat([{ id: 'reference_values', title: REFERENCE_VALUES[1], url: REFERENCE_VALUES[2] }]);

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const norm = s => s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;|&#xA0;/gi, ' ').replace(/&amp;/g, '&').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&[a-z]+;/gi, ' ').replace(/[‘’“”'"`]/g, '').replace(/[‐-―]/g, '-').replace(/\s*([(),.;:%])\s*/g, '$1').replace(/\s+/g, ' ').toLowerCase().trim();
async function get(url, headers) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 60000);
  try {
    const r = await fetch(url, { headers: Object.assign({ 'User-Agent': UA }, headers || {}), signal: ctl.signal, redirect: 'follow' });
    if (r.status === 300) { // a document in several parts: read them all
      const parts = [...(await r.text()).matchAll(/href="(https?:\/\/publications\.europa\.eu\/resource\/cellar\/[^"]+)"/g)].map(m => m[1].replace(/^http:/, 'https:'));
      let all = '';
      for (const u of parts.slice(0, 4)) { const rr = await fetch(u, { headers: { 'User-Agent': UA }, signal: ctl.signal }); if (rr.ok) all += await rr.text(); }
      return all;
    }
    return r.ok ? await r.text() : '';
  }
  catch (e) { return ''; } finally { clearTimeout(t); }
}
const cache = {};
async function officialText(url) {
  if (cache[url] !== undefined) return cache[url];
  const m = /CELEX:([^&]+)/.exec(url); const full = m ? decodeURIComponent(m[1]) : '';
  const base = celexOf(url);
  let text = '';
  const tries = [];
  if (full) tries.push(full);
  if (base && base !== full) tries.push(base);
  for (const id of tries) {
    text = await get('https://publications.europa.eu/resource/celex/' + encodeURIComponent(id).replace(/\(/g, '%28').replace(/\)/g, '%29'), { Accept: 'text/html, application/xhtml+xml', 'Accept-Language': 'en' });
    if (text.length > 800) break;
  }
  if (text.length <= 800) text = await get(url, { Accept: 'text/html' });
  return (cache[url] = text);
}

// 1. In-force status and end of validity.
const named = STRATEGIES.flatMap(s => actsIn(s.eu)).concat(LEVERS.flatMap(l => actsIn(l.law)));
const ids = [...new Set(items.map(i => celexOf(i.url)).concat(named).filter(c => /^3\d{4}[RLD]\d{4}$/.test(c)))].sort();
const IDS = ids;
const query = 'PREFIX cdm: <http://publications.europa.eu/ontology/cdm#> PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> SELECT ?celex ?inforce ?end (MAX(?d) AS ?changed) WHERE { VALUES ?celex { ' + IDS.map(function (c) { return '"' + c + '"^^xsd:string'; }).join(' ') + ' } ?w cdm:resource_legal_id_celex ?celex . OPTIONAL { ?w cdm:resource_legal_in-force ?inforce } OPTIONAL { ?w cdm:resource_legal_date_end-of-validity ?end } OPTIONAL { VALUES ?rel { cdm:resource_legal_amends_resource_legal cdm:resource_legal_repeals_resource_legal cdm:resource_legal_implicitly_repeals_resource_legal cdm:resource_legal_partially_repeals_resource_legal cdm:resource_legal_extends_validity_of_resource_legal cdm:resource_legal_replaces_resource_legal cdm:resource_legal_suspends_resource_legal cdm:resource_legal_partially_suspends_resource_legal } ?a ?rel ?w . ?a cdm:work_date_document ?d } } GROUP BY ?celex ?inforce ?end';
const sparql = await get('https://publications.europa.eu/webapi/rdf/sparql?query=' + encodeURIComponent(query), { Accept: 'application/sparql-results+json' });
const status = {};
if (sparql) for (const b of JSON.parse(sparql).results.bindings) {
  const end = b.end ? b.end.value.slice(0, 10) : '', inforce = b.inforce ? /^(1|true)$/.test(b.inforce.value) : null, changed = b.changed ? b.changed.value.slice(0, 10) : '';
  if (!end && inforce === null) continue;
  // An act can appear more than once; keep the reading that is in force with the latest end date.
  const cur = status[b.celex.value], next = [end || '9999-12-31', inforce !== false, changed];
  if (!cur || (next[1] && !cur[1]) || (next[1] === cur[1] && next[0] > cur[0])) status[b.celex.value] = [next[0], next[1], cur && cur[2] > changed ? cur[2] : changed];
  else if (changed > cur[2]) cur[2] = changed;
}
const today = new Date().toISOString().slice(0, 10);
if (Object.keys(status).length) {
  const lines = Object.keys(status).sort().map(c => "  '" + c + "': ['" + status[c][0] + "', " + status[c][1] + ", '" + status[c][2] + "']");
  writeFileSync(new URL('../js/legal-status.js', import.meta.url),
    "// Written by tools/check-sources.mjs from the EU Publications Office database.\n// For each cited EU act: [last day it applies ('9999-12-31' = no end date), in force when checked,\n// date of the latest act amending, repealing or extending it].\n" +
    "export const STATUS_CHECKED = '" + today + "';\nexport const STATUS = {\n" + lines.join(',\n') + '\n};\n');
}
console.log('EU acts cited:', ids.length, '| status found for', Object.keys(status).length);
for (const c of Object.keys(status).sort()) if (status[c][0] !== '9999-12-31' || !status[c][1]) console.log('  ' + c + (status[c][1] ? ' applies until ' : ' NOT IN FORCE, ended ') + status[c][0]);
const { REVIEWED_ISO } = await import('../js/strategies.js');
for (const c of Object.keys(status).sort()) if (status[c][2] > REVIEWED_ISO) console.log('  ' + c + ' CHANGED on ' + status[c][2] + ', after the notes were last read (' + REVIEWED_ISO + '): re-read the notes citing it');
const noStatus = ids.filter(c => !status[c]); if (noStatus.length) console.log('  no status returned for:', noStatus.join(', '));

// 2. Is the recorded passage in the official text?
// An entry in legal-quotes.json is normally the passage itself. Where the source cannot be read
// automatically (a PDF, or a site that refuses automated requests) the entry is
// { quote, confirmed: 'YYYY-MM-DD', how } recording when and how a person confirmed it.
let ok = 0; const bad = [], unreachable = [], noQuote = [], byHand = [], overdue = [];
for (const it of items) {
  const entry = quotes[it.id];
  if (!entry) { noQuote.push(it.id); continue; }
  const q = typeof entry === 'string' ? entry : entry.quote;
  const isPdf = /\.pdf(\?|$)|filename=[^&]*\.pdf/i.test(it.url);
  const text = isPdf ? '' : await officialText(it.url);
  if (text.length > 800) {
    const hay = norm(text), needle = norm(q).replace(/[.,;:]+$/, '');
    // Accept the whole passage, or at least two of three long pieces of it (start, middle, end):
    // official texts differ from the recorded passage in footnote marks, line breaks and lead-in words.
    const n = needle.length, mid = Math.max(0, Math.floor(n / 2) - 30);
    const pieces = [needle.slice(0, 60), needle.slice(mid, mid + 60), needle.slice(Math.max(0, n - 60))];
    if (hay.includes(needle) || (n > 90 && pieces.filter(p => hay.includes(p)).length >= 2) || (n <= 90 && hay.includes(needle.slice(Math.max(0, n - 45))))) { ok++; continue; }
    if (typeof entry === 'string') { bad.push(it.id + ' <' + it.url + '>\n      recorded passage: ' + q.slice(0, 110)); continue; }
  }
  if (typeof entry === 'object' && entry.confirmed) {
    byHand.push(it.id + ' (' + entry.how + ', ' + entry.confirmed + ')');
    if (Date.parse(today) - Date.parse(entry.confirmed) > 365 * 86400000) overdue.push(it.id);
  } else unreachable.push(it.id + ' <' + it.url + '>');
}
console.log('\nPassage found in the official text by this check:', ok, 'of', items.length, 'sourced notes');
if (byHand.length) console.log('  confirmed by reading, because the source cannot be read automatically:\n    ' + byHand.join('\n    '));
if (overdue.length) console.log('  HAND CONFIRMATION OVER A YEAR OLD, read again:', overdue.join(', '));
if (bad.length) console.log('  NOT FOUND:\n    ' + bad.join('\n    '));
if (unreachable.length) console.log('  source could not be opened:\n    ' + unreachable.join('\n    '));
if (noQuote.length) console.log('  no passage recorded:', noQuote.join(', '));
if (bad.length || unreachable.length || noQuote.length || overdue.length) process.exitCode = 1;
