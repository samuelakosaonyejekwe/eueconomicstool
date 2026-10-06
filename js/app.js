import { COUNTRIES, BY_CODE, CODES, NON_EURO, nameOf } from './countries.js';
import { DATASETS, CORE_IDS, ALL_IDS, COICOP, DIVISIONS, fetchDataset, isStale, sourceUrl } from './data.js';
import * as M from './model.js';
import { STRATEGIES, CATEGORIES, ROLES, GUIDE, REVIEWED, REVIEWED_ISO, celexOf, actsIn, recommend, applies } from './strategies.js';
import { STATUS, STATUS_CHECKED } from './legal-status.js';
import { lineChart, spark, barList, meter, fmt, esc, periodLabel } from './charts.js';
import { PAGE_METHOD } from './method.js';

const BASE = new URL('../', import.meta.url).href;
const BUILD = (BASE.match(/@([0-9a-f]{7})[0-9a-f]*\//) || [])[1] || (BASE.indexOf('@main/') > 0 ? 'latest' : 'stored copy');
const VERSION = '1.8.0'; // the only place the release number is written
window.__escStarted = true;
const PAGES = [
  { k: 'overview', n: 'Overview' }, { k: 'country', n: 'Country' }, { k: 'inflation', n: 'Inflation Lab' },
  { k: 'currency', n: 'Currency & Trade' }, { k: 'simulator', n: 'Policy Simulator' }, { k: 'strategies', n: 'Strategies' },
  { k: 'compare', n: 'Compare' }, { k: 'method', n: 'Data & Method' }
];
const SUBS = {
  inflation: [['diag', 'Diagnosis'], ['parts', 'Components'], ['personal', 'Personal inflation'], ['outlook', 'Early warning']],
  currency: [['monitor', 'Monitor'], ['lock', 'Rate lock'], ['bond', 'Export-linked bond'], ['basket', 'Currency basket'], ['voucher', 'Export vouchers']],
  method: [['sources', 'Live sources'], ['how', 'Method'], ['install', 'Install & offline'], ['about', 'About']]
};
const LS = {
  get: function (k) { try { return JSON.parse(localStorage.getItem('esc.' + k)); } catch (e) { return null; } },
  set: function (k, v) { try { localStorage.setItem('esc.' + k, JSON.stringify(v)); } catch (e) { /* storage full or blocked */ } }
};

const st = Object.assign({
  page: 'overview', c: 'DE', role: 'all', sub: { inflation: 'diag', currency: 'monitor', method: 'sources' },
  cmp: { ind: 'pi', sel: ['DE', 'FR', 'IT', 'ES'] }, L: Object.assign({}, M.NO_POLICY), shares: null, parts: ['TOTAL', 'TOT_X_NRG_FOOD', 'NRG', 'FOOD'],
  lib: { q: '', cat: '', fit: true }, calc: {}, theme: ''
}, LS.get('state') || {});
const D = {}, STATE = {};
// Settings saved by an earlier release may lack newer entries; fill them in.
st.L = Object.assign({}, M.NO_POLICY, st.L);
st.sub = Object.assign({ inflation: 'diag', currency: 'monitor', method: 'sources' }, st.sub);
let jobs = [], snapMemo = {}, busy = 0, deferredInstall = null, online = navigator.onLine !== false;
const $ = function (id) { return document.getElementById(id); };
const pct = function (x, dp) { return typeof x === 'number' && isFinite(x) ? fmt(x, dp) + '%' : '–'; };
const unit = function (x, u) { return typeof x === 'number' && isFinite(x) ? fmt(x) + u : '–'; };
const rate = function (x) { return typeof x === 'number' && isFinite(x) ? signed(x, 1) + '%' : '–'; };
// Change in a currency's value from a loss figure (positive loss = weaker currency).
const gain = function (loss, dp) { return typeof loss === 'number' && isFinite(loss) ? signed(-loss, dp === undefined ? 1 : dp) + '%' : '–'; };
const signed = function (x, dp) { return typeof x === 'number' && isFinite(x) ? (x > 0 ? '+' : x < 0 ? '−' : '') + fmt(Math.abs(x), dp) : '–'; };
function save() { LS.set('state', st); }
function snap(c) { if (!snapMemo[c]) { const s = M.snapshot(D, c); s.diag = M.diagnose(s); snapMemo[c] = s; } return snapMemo[c]; }
function chart(fn) { const id = 'ch' + jobs.length; jobs.push({ id: id, fn: fn }); return '<div class="chart" id="' + id + '"></div>'; }
function period(id, key) { const o = M.latest(D, id, key); return o ? periodLabel(o.t) : ''; }

// ---------- building blocks ----------
function card(title, body, o) {
  o = o || {};
  return '<section class="card' + (o.cls ? ' ' + o.cls : '') + '"><header><h2>' + title + '</h2>' + (o.sub ? '<p>' + o.sub + '</p>' : '') + '</header><div class="cb">' + body + '</div>' +
    (o.src ? '<footer>' + src(o.src) + '</footer>' : '') + '</section>';
}
function src(ids) {
  return 'Source: ' + [].concat(ids).map(function (id) {
    const d = DATASETS[id], per = D[id] ? periodLabel(D[id].t[D[id].t.length - 1]) : '';
    return '<a href="' + sourceUrl(id) + '" target="_blank" rel="noopener">' + esc(d.src.split(' via ')[0]) + (d.code ? ' ' + d.code : '') + '</a>' + (per ? ' · to ' + per : '');
  }).join('; ');
}
function tile(label, value, sub, o) {
  o = o || {};
  return '<div class="tile' + (o.tone ? ' t-' + o.tone : '') + '"><span class="tl">' + label + '</span><b class="tv">' + value + '</b><span class="ts">' + (sub || '&nbsp;') + '</span>' + (o.spark || '') + '</div>';
}
// Legal notes look after themselves: each cited EU act carries the last day it applies, taken
// from the EU Publications Office database, and the note is flagged once that day has passed.
function isoToday() { return new Date().toISOString().slice(0, 10); }
// Every EU regulation or directive the tool cites, by document number.
const ACT_IDS = (function () {
  const ids = [], add = function (c) { if (/^3\d{4}[RLD]\d{4}$/.test(c) && ids.indexOf(c) < 0) ids.push(c); };
  STRATEGIES.forEach(function (x) { if (x.src) add(celexOf(x.src[1])); actsIn(x.eu).forEach(add); });
  M.LEVERS.forEach(function (l) { if (l.ref) add(celexOf(l.ref[1])); actsIn(l.law).forEach(add); });
  return ids;
})();
// Each visitor's browser asks the EU Publications Office database directly whether those acts are
// still in force, once a day. That database does not accept ordinary cross-site requests but does
// answer in script-callback form, so the reply arrives through a script element. Until a live reply
// arrives, and whenever the database cannot be reached, the dates stored with the tool are used.
let LIVE = LS.get('acts');
if (!LIVE || !LIVE.s || typeof LIVE.at !== 'number') LIVE = null;
function actOf(c) { return LIVE && LIVE.s[c] ? LIVE.s[c] : STATUS[c]; }
function refreshActs() {
  if (!online || window.__escActsBusy || (LIVE && Date.now() - LIVE.at < 24 * 3600000) || !/^https?:$/.test(location.protocol)) return;
  window.__escActsBusy = true;
  const tag = document.createElement('script');
  const done = function () { window.__escActsBusy = false; clearTimeout(timer); tag.remove(); };
  const timer = setTimeout(done, 40000);
  window.__escActs = function (j) {
    try {
      const out = {};
      j.results.bindings.forEach(function (b) {
        const c = b.celex ? String(b.celex.value) : '';
        if (ACT_IDS.indexOf(c) < 0) return;
        const end = b.end && /^\d{4}-\d{2}-\d{2}/.test(b.end.value) ? b.end.value.slice(0, 10) : '';
        const inforce = b.inforce ? /^(1|true)$/.test(b.inforce.value) : null;
        if (end || inforce !== null) out[c] = [end || '9999-12-31', inforce !== false];
      });
      if (Object.keys(out).length >= ACT_IDS.length / 2) {
        LIVE = { at: Date.now(), s: out }; LS.set('acts', LIVE);
        const act = document.activeElement;
        if (['strategies', 'simulator', 'method'].indexOf(st.page) >= 0 && !(act && /INPUT|SELECT/.test(act.tagName) && $('app').contains(act))) render(true);
      }
    } catch (e) { /* unexpected reply: keep the stored dates */ }
    done();
  };
  const query = 'PREFIX cdm: <http://publications.europa.eu/ontology/cdm#> PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> SELECT ?celex ?inforce ?end WHERE { VALUES ?celex { ' +
    ACT_IDS.map(function (c) { return '"' + c + '"^^xsd:string'; }).join(' ') + ' } ?w cdm:resource_legal_id_celex ?celex . OPTIONAL { ?w cdm:resource_legal_in-force ?inforce } OPTIONAL { ?w cdm:resource_legal_date_end-of-validity ?end } }';
  tag.src = 'https://publications.europa.eu/webapi/rdf/sparql?query=' + encodeURIComponent(query) + '&format=' + encodeURIComponent('application/sparql-results+json') + '&callback=__escActs';
  tag.onerror = done;
  document.head.appendChild(tag);
}
function actsNote() {
  return LIVE ? 'In-force status of the ' + ACT_IDS.length + ' EU acts cited was read live from the EU Publications Office database ' + ago(LIVE.at) + '.'
    : 'In-force status of the ' + ACT_IDS.length + ' EU acts cited is as stored on ' + periodLabel(STATUS_CHECKED) + '; a live reading is made whenever the EU Publications Office database can be reached.';
}
function actStatus(url, today, text) {
  today = today || isoToday();
  // the act behind the source link, plus every regulation or directive the note itself names
  const ids = [celexOf(url)].concat(actsIn(text)).filter(function (c, i, a) { return c && actOf(c) && a.indexOf(c) === i; });
  let ended = null, until = null;
  ids.forEach(function (c) {
    const st = actOf(c);
    if (!st[1] || st[0] < today) { if (!ended || st[0] < ended[0]) ended = [st[0], c]; }
    else if (st[0] !== '9999-12-31' && (!until || st[0] < until[0])) until = [st[0], c];
  });
  const name = function (c) { return (c[5] === 'R' ? 'Regulation ' : 'Directive ') + (+c.slice(1, 5) >= 2015 ? c.slice(1, 5) + '/' + (+c.slice(6)) : (+c.slice(6)) + '/' + c.slice(1, 5)); };
  if (ended) return ' ' + badge(name(ended[1]) + ' has not applied since ' + periodLabel(ended[0]) + ': see the source for what replaced it', 'crit');
  return until ? ' ' + badge(name(until[1]) + ' applies until ' + periodLabel(until[0]), 'warn') : '';
}
function reviewAge(today) {
  const days = (Date.parse(today || isoToday()) - Date.parse(REVIEWED_ISO)) / 86400000;
  return days > 365 ? '<p class="note warnline">These legal notes were last checked on ' + REVIEWED + ', more than a year ago. Follow the linked sources for the current law.</p>' : '';
}
window.__legal = { actStatus: actStatus, reviewAge: reviewAge, live: function () { return LIVE; }, ids: ACT_IDS }; // exposed for the automated tests
function badge(text, tone) { return '<span class="badge b-' + (tone || 'mute') + '">' + esc(text) + '</span>'; }
function subtabs(page) {
  return '<div class="subtabs" role="group" aria-label="Sections of this page">' + SUBS[page].map(function (s) {
    return '<button aria-pressed="' + (st.sub[page] === s[0]) + '" data-sub="' + s[0] + '">' + s[1] + '</button>';
  }).join('') + '</div>';
}
function link(target) { return target === 'overview' ? './' : '#' + target; }
const ARROW_L = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5l-7 7 7 7"/></svg>', ARROW_R = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 5l7 7-7 7"/></svg>';
function neighbours() {
  const i = PAGES.map(function (p) { return p.k; }).indexOf(st.page);
  return { i: i, prev: PAGES[(i + PAGES.length - 1) % PAGES.length], next: PAGES[(i + 1) % PAGES.length] };
}
function head(title, lead, extra) {
  const nb = neighbours();
  return '<div class="ph"><div class="pht"><h1 id="title" tabindex="-1">' + title + '</h1><p>' + lead + '</p>' + (extra || '') + '</div><div class="hop">' +
    '<a class="hopb" href="' + link(nb.prev.k) + '" data-go="' + nb.prev.k + '" aria-label="Back to ' + nb.prev.n + '">' + ARROW_L + '</a>' +
    '<span><span class="sr">Page ' + (nb.i + 1) + ' of ' + PAGES.length + '</span><span aria-hidden="true">' + (nb.i + 1) + ' / ' + PAGES.length + '</span></span>' +
    '<a class="hopb" href="' + link(nb.next.k) + '" data-go="' + nb.next.k + '" aria-label="Forward to ' + nb.next.n + '">' + ARROW_R + '</a></div></div>' + lens();
}
function roleName(k) { return ROLES.filter(function (x) { return x.k === k; })[0].n; }
// The chosen viewpoint is always visible: what this page offers that reader, and a way back.
function lens() {
  if (st.role === 'all' || !GUIDE[st.role]) return '';
  return '<div class="lens" role="note"><p><b>Viewpoint: ' + roleName(st.role) + '.</b> ' + GUIDE[st.role][st.page] + '</p><button class="btn" data-act="lensoff">Show for all stakeholders</button></div>';
}
function heatStep(pi) {
  if (typeof pi !== 'number') return 'hx';
  return pi < 0 ? 'h0' : pi < 1 ? 'h1' : pi < 1.5 ? 'h2' : pi <= 2.5 ? 'h3' : pi <= 3.5 ? 'h4' : pi <= 5 ? 'h5' : pi <= 7 ? 'h6' : 'h7';
}
function trend(now, before) {
  if (typeof now !== 'number' || typeof before !== 'number') return '';
  const d = now - before, dir = d > 0.05 ? 'up' : d < -0.05 ? 'down' : 'flat';
  return '<span class="tr ' + dir + '"><span aria-hidden="true">' + (dir === 'up' ? '▲' : dir === 'down' ? '▼' : '■') + ' ' + signed(d, 1) + ' pp</span><span class="sr">' +
    (dir === 'flat' ? 'unchanged' : dir + ' ' + fmt(Math.abs(d), 1) + ' points') + '</span></span>';
}
function list(rows) {
  return '<ul class="rank">' + rows.map(function (r) {
    return '<li>' + (r.c ? '<a href="#country/' + r.c + '" data-go="country/' + r.c + '">' + esc(r.n) + '</a>' : '<span>' + esc(r.n) + '</span>') + '<b>' + r.v + '</b></li>';
  }).join('') + '</ul>';
}
function range(k, v, min, max, step, group, text, name) {
  return '<input type="range" data-' + group + '="' + k + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + v + '" aria-label="' + esc(name) + '" aria-describedby="d-' + group + '-' + k + '" aria-valuetext="' + esc(text) + '">';
}

// ---------- Overview ----------
function pageOverview() {
  const eu = snap('EU'), ea = snap('EA'), dfr = M.latest(D, 'ecb', 'DFR');
  const all = CODES.map(snap);
  const by = function (f, n, desc) {
    return all.filter(function (s) { return typeof f(s) === 'number'; }).sort(function (a, b) { return desc ? f(b) - f(a) : f(a) - f(b); }).slice(0, n);
  };
  const row = function (f, dp, u) { return function (s) { return { c: s.c, n: s.meta.n, v: fmt(f(s), dp) + u }; }; };
  const map = '<div class="tilemap">' + COUNTRIES.map(function (m) {
    const s = snap(m.c);
    return '<button class="mt ' + heatStep(s.pi) + (m.c === st.c ? ' sel' : '') + '" style="grid-column:' + (m.g[0] + 1) + ';grid-row:' + (m.g[1] + 1) + '" data-country="' + m.c + '" data-open="1" ><span class="sr">' + esc(m.n) + ', inflation </span><b aria-hidden="true">' + m.c + '</b><span>' + fmt(s.pi) + '</span><span class="sr"> per cent</span></button>';
  }).join('') + '</div><div class="scale"><span>Below target</span><i class="h1"></i><i class="h2"></i><i class="h3"></i><i class="h4"></i><i class="h5"></i><i class="h6"></i><i class="h7"></i><span>Far above</span></div>' +
    '<p class="note">Each square is a member state, placed roughly where it sits on the map. Grey means inflation is within half a point of 2%. Select a square to open the country.</p>';
  const rank = barList(all.slice().sort(function (a, b) { return (b.pi === null ? -99 : b.pi) - (a.pi === null ? -99 : a.pi); }).map(function (s) {
    return { label: s.meta.n, value: s.pi, code: s.c, hl: s.c === st.c };
  }), { unit: '%', ref: 2, refLabel: 'ECB target of 2%' });
  const fxRows = NON_EURO.map(function (m) {
    const ch = M.fxChange(D, m.cur, 252);
    return { c: m.c, n: m.cur + ' · ' + m.n, v: fmt(M.val(D, 'fx', m.cur), m.cur === 'HUF' ? 1 : 3) + ' <small class="' + (ch > 0 ? 'neg' : 'pos') + '">' + gain(ch) + '</small>' };
  });
  const hs = D.hicp;
  return head('The EU economy today', 'Live official figures for all 27 member states. Start here, then open a country or a tool.',
    '<div class="pha">' + badge(eu.piT ? 'Prices to ' + periodLabel(eu.piT) : 'Loading', 'info') + '</div>') +
    '<div class="tiles six">' +
    tile('EU inflation', pct(eu.pi), trend(eu.pi, eu.pi12) + ' on a year ago', { spark: spark(M.series(D, 'hicp', 'TOTAL|EU'), 1), tone: eu.diag.regime.tone }) +
    tile('Euro area inflation', pct(ea.pi), trend(ea.pi, ea.pi12) + ' on a year ago', { spark: spark(M.series(D, 'hicp', 'TOTAL|EA'), 1), tone: ea.diag.regime.tone }) +
    tile('Euro area core inflation', pct(ea.core), 'Excludes energy and food', { spark: spark(M.series(D, 'hicp', 'TOT_X_NRG_FOOD|EA'), 2) }) +
    tile('EU unemployment', pct(eu.une), period('une', 'EU'), { spark: spark(M.series(D, 'une', 'EU'), 3) }) +
    tile('EU real GDP growth', pct(eu.gdp), period('gdpq', 'EU') + ', year on year', { spark: spark(M.series(D, 'gdpq', 'EU'), 3) }) +
    tile('ECB deposit rate', dfr ? pct(dfr.v, 2) : '–', dfr ? 'Since ' + periodLabel(dfr.t) : '', {}) +
    '</div><div class="grid two">' +
    card('Inflation across the Union', map, { sub: 'Annual HICP rate, %, compared with the 2% target', src: 'hicp' }) +
    card('Ranking', rank, { sub: 'Annual HICP rate by member state', src: 'hicp' }) +
    '</div><div class="grid four">' +
    card('Highest inflation', list(by(function (s) { return s.pi; }, 5, true).map(row(function (s) { return s.pi; }, 1, '%')))) +
    card('Lowest inflation', list(by(function (s) { return s.pi; }, 5, false).map(row(function (s) { return s.pi; }, 1, '%')))) +
    card('Rising fastest', list(by(function (s) { return s.pi !== null && s.pi3 !== null ? s.pi - s.pi3 : null; }, 5, true).map(function (s) { return { c: s.c, n: s.meta.n, v: signed(s.pi - s.pi3, 1) + ' pp' }; })), { sub: 'Change over three months' }) +
    card('Currencies against the euro', list(fxRows), { sub: 'Units per euro · 12-month gain or loss' }) +
    '</div>' +
    card('Euro area inflation and what drives it', chart(function (el) {
      lineChart(el, { t: hs.t, unit: '%', refs: [{ y: 2, label: '2% target' }], height: 300, label: 'Euro area inflation by component', series: [
        { name: 'All items', values: hs.s['TOTAL|EA'], color: 1 }, { name: 'Core', values: hs.s['TOT_X_NRG_FOOD|EA'], color: 2 },
        { name: 'Food', values: hs.s['FOOD|EA'], color: 3 }, { name: 'Energy', values: hs.s['NRG|EA'], color: 4 }] });
    }), { sub: 'Annual rate of change, %. Point at the chart to read any month.', src: 'hicp' });
}

// ---------- Country ----------
function regimeChip(m) {
  if (m.agg) return '';
  return m.euro ? badge('Euro since ' + m.euro, 'info') : badge(m.cur + ' · ' + m.regime, 'info');
}
function pressures(s, withText) {
  return '<div class="press">' + M.PRESSURES.map(function (p) {
    const v = s.diag.p[p.k];
    return '<div class="pr"><div class="prh"><b>' + p.n + '</b></div>' + meter(v, M.level(v)) + (withText ? '<p>' + p.d + '</p>' : '') + '</div>';
  }).join('') + '</div>';
}
function stratCard(r, compact) {
  const s = r.s, sp = ['', 'Weeks', 'Months', 'Years'][s.speed], co = ['No budget cost', 'Low cost', 'Medium cost', 'High cost'][s.fisc];
  const fe = { '-1': ['Not workable as proposed', 'crit'], 0: ['EU-level decision', 'serious'], 1: ['Needs careful legal design', 'warn'], 2: ['Usable under current EU rules', 'good'] }[s.feas];
  const source = s.src ? ' <a class="srcl" href="' + esc(s.src[1]) + '" target="_blank" rel="noopener">Source: ' + esc(s.src[0]) + '</a>' : '';
  return '<article class="strat"><header><' + (compact ? 'h3' : 'h2') + ' class="st">' + esc(s.n) + '</' + (compact ? 'h3' : 'h2') + '><span class="cat">' + esc(s.cat) + '</span></header><p>' + esc(s.d) + '</p>' +
    (compact ? '' : '<p class="eu"><b>EU fit.</b> ' + esc(s.eu) + source + actStatus(s.src ? s.src[1] : '', '', s.eu) + '</p>') +
    '<div class="chips">' + badge(fe[0], fe[1]) + badge('Takes effect in: ' + sp.toLowerCase(), 'mute') + badge(co, 'mute') +
    (s.scope === 'noneuro' ? badge('Own-currency members', 'info') : s.scope === 'eu' ? badge('Union level', 'info') : '') + '</div>' +
    (compact ? '' : '<p class="who">For: ' + s.who.map(roleName).join(', ') + ' · Source framework: ' + esc(s.ac) + '</p>') +
    (typeof r.score === 'number' && r.score > 0 ? '<div class="fit" title="Match with the current diagnosis"><i style="width:' + Math.min(100, r.score / 3.2 * 100).toFixed(0) + '%"></i></div>' : '') + '</article>';
}
function pageCountry() {
  const s = snap(st.c), m = s.meta, ea = D.hicp, r = s.diag.regime;
  const sp = function (id, key, col) { return { spark: spark(M.series(D, id, key), col || 1) }; };
  const div = DIVISIONS.map(function (k) { return { label: COICOP[k], value: M.val(D, 'hicpd', k + '|' + st.c) }; }).sort(function (a, b) { return (b.value === null ? -99 : b.value) - (a.value === null ? -99 : a.value); });
  const top = s.diag.top ? M.PRESSURES.filter(function (p) { return p.k === s.diag.top; })[0] : null;
  const recs = recommend(s.diag, m, st.role).slice(0, 4);
  return head(esc(m.n), 'Inflation is <b>' + r.n.toLowerCase() + '</b> at ' + pct(s.pi) + ' (' + periodLabel(s.piT) + ')' + (top && s.diag.p[top.k] >= M.BANDS[0] ? '. The strongest pressure is <b>' + top.n.toLowerCase() + '</b>.' : '. No pressure gauge is above moderate.'),
    '<div class="pha">' + regimeChip(m) + badge(r.n, r.tone) + (s.pop ? badge(fmt(s.pop / 1e6, 1) + ' million people', 'mute') : '') + (s.gdpEur ? badge('GDP €' + fmt(s.gdpEur / 1000, 0) + ' bn', 'mute') : '') + '</div>') +
    '<div class="tiles eight">' +
    tile('Inflation', pct(s.pi), trend(s.pi, s.pi12) + ' on a year ago', Object.assign(sp('hicp', 'TOTAL|' + st.c), { tone: r.tone })) +
    tile('Core inflation', pct(s.core), 'Excludes energy and food', sp('hicp', 'TOT_X_NRG_FOOD|' + st.c, 2)) +
    tile('Unemployment', pct(s.une), period('une', st.c), sp('une', st.c, 3)) +
    tile('Real GDP growth', pct(s.gdp), period('gdpq', st.c) + ', year on year', sp('gdpq', st.c, 3)) +
    tile('Wage growth', pct(s.wage), period('wages', st.c) + ', year on year', sp('wages', st.c, 5)) +
    tile('Government balance', pct(s.bal), '% of GDP, ' + period('fiscal', 'B9|' + st.c), { tone: s.bal !== null && s.bal < -3 ? 'warn' : '' }) +
    tile('Government debt', pct(s.debt, 0), '% of GDP, ' + period('fiscal', 'GD|' + st.c), { tone: s.debt !== null && s.debt > 90 ? 'warn' : '' }) +
    tile('Current account', pct(s.ca), '% of GDP, last four quarters', {}) +
    '</div><div class="grid two">' +
    card('Inflation path', chart(function (el) {
      lineChart(el, { t: ea.t, unit: '%', refs: [{ y: 2, label: '2% target' }], height: 300, label: 'Inflation in ' + m.n, series: [
        { name: m.n + ', all items', values: ea.s['TOTAL|' + st.c] || [], color: 1 }, { name: m.n + ', core', values: ea.s['TOT_X_NRG_FOOD|' + st.c] || [], color: 2 }]
        .concat(st.c === 'EA' ? [] : [{ name: 'Euro area, all items', values: ea.s['TOTAL|EA'], color: 7, dash: true }]) });
    }), { sub: 'Annual HICP rate, %', src: 'hicp' }) +
    card('Where the pressure comes from', pressures(s) + '<p class="note">Each gauge runs from 0 to 100 and is built from the official indicators named on the Data & Method page. <a href="#inflation/diag" data-go="inflation/diag">See the full diagnosis</a>.</p>', { sub: 'Six sources of inflation pressure' }) +
    '</div><div class="grid two">' +
    card('Prices by spending category', barList(div, { unit: '%', ref: s.piDiv, refLabel: 'Overall inflation in ' + periodLabel(s.divT) + ', ' + pct(s.piDiv) }) + '<h3 class="grp" style="margin-top:18px">Also watch</h3><div class="kv one">' + [['Rents', s.rent], ['Electricity, gas and fuels', M.val(D, 'hicpd', 'CP045|' + st.c)], ['Administered prices', s.admin], ['Producer prices', s.ppi], ['House prices', s.hpi]].map(function (r) { return '<div><span>' + r[0] + '</span><b>' + pct(r[1]) + '</b></div>'; }).join('') + '</div>', { sub: 'Annual rate of change, %, ' + periodLabel(s.divT), src: 'hicpd' }) +
    card('Best-matched strategies', '<div class="strats compact">' + recs.map(function (x) { return stratCard(x, true); }).join('') + '</div><p class="note"><a href="#strategies" data-go="strategies">Open the full library of ' + STRATEGIES.length + ' strategies</a></p>', { sub: 'Ranked against this diagnosis' + (st.role !== 'all' ? ' for ' + roleName(st.role).toLowerCase() : '') }) +
    '</div>';
}

// ---------- Inflation Lab ----------
function contributions(s) {
  const w = s.w, rows = [['Services', w.SERV, s.serv], ['Non-energy goods', w.IGD_NNRG, s.goods], ['Food, alcohol & tobacco', w.FOOD, s.food], ['Energy', w.NRG, s.nrg]];
  return rows.map(function (r) { return { label: r[0], value: typeof r[2] === 'number' ? r[1] * r[2] : null, w: r[1], rate: r[2] }; });
}
function labDiag(s) {
  const con = contributions(s), w = s.w;
  const sens = w.FOOD + w.NRG && typeof s.food === 'number' && typeof s.nrg === 'number' ? (w.FOOD * s.food + w.NRG * s.nrg) / (w.FOOD + w.NRG) : null;
  const inputs = [['Core inflation', pct(s.core)], ['Services inflation', pct(s.serv)], ['Energy inflation', pct(s.nrg)], ['Food inflation', pct(s.food)],
    ['Producer prices', pct(s.ppi)], ['Wage growth', pct(s.wage)], ['Unemployment vs 5-year average', pct(s.une) + ' vs ' + pct(s.uneAvg)],
    ['Real GDP growth', pct(s.gdp)], ['Rents', pct(s.rent)], ['House prices', pct(s.hpi)], ['Price expectations vs own history', typeof s.expZ === 'number' ? signed(s.expZ, 1) + ' st. dev.' : '–'],
    [(s.own ? s.meta.cur : 'Euro') + ' value over 12 months, against the ' + (s.own ? 'euro' : 'US dollar'), gain(s.dep12)], ['Energy import dependency', pct(s.nrgdep, 0)]];
  return '<div class="grid two">' +
    card('Pressure diagnosis', pressures(s, true), { sub: 'Scores from 0 (none) to 100 (severe)' }) +
    '<div class="stack">' +
    card('What makes up the headline rate', barList(con, { unit: ' pp', dp: 2 }) + '<p class="note">Each bar is the category’s share of the basket multiplied by its price change. Together they come to about ' + fmt(con.reduce(function (a, r) { return a + (r.value || 0); }, 0), 1) + ' points; the published rate is ' + pct(s.pi) + '.</p>', { sub: 'Contribution in percentage points', src: ['hicp', 'hicpw'] }) +
    card('Hybrid index', '<div class="tiles two">' + tile('Shock-sensitive prices', pct(sens), 'Energy and food · ' + fmt((w.FOOD + w.NRG) * 100, 0) + '% of the basket', { tone: sens > 4 ? 'warn' : '' }) +
      tile('Slow-moving prices', pct(s.core), 'Services and goods · ' + fmt((w.SERV + w.IGD_NNRG) * 100, 0) + '% of the basket', { tone: s.core > 3 ? 'warn' : '' }) + '</div>' +
      '<p class="note">A wide gap means the problem sits in volatile items, where targeted, temporary measures work best. When slow-moving prices run high, pressure is broad and takes longer to fade.</p>', { sub: 'The basket split by how quickly prices react' }) +
    '</div></div>' +
    card('The figures behind the gauges', '<div class="kv">' + inputs.map(function (r) { return '<div><span>' + r[0] + '</span><b>' + r[1] + '</b></div>'; }).join('') + '</div>', { sub: 'Latest official readings for ' + esc(s.meta.n), src: ['hicp', 'ppi', 'wages', 'une', 'expect'] });
}
const PART_KEYS = ['TOTAL', 'TOT_X_NRG_FOOD', 'FOOD', 'NRG', 'SERV', 'IGD_NNRG'];
function labParts(s) {
  const h = D.hicp, hd = D.hicpd;
  const rows = DIVISIONS.map(function (k) {
    return '<tr><td>' + COICOP[k] + '</td><td>' + pct(M.val(D, 'hicpd', k + '|' + s.c)) + '</td><td>' + pct(M.val(D, 'hicpd', k + '|' + s.c, 12)) + '</td><td>' + fmt(s.w[k] * 100, 1) + '%</td><td>' + spark(hd && hd.s[k + '|' + s.c], 1) + '</td></tr>';
  }).join('');
  return card('Components over time', '<div class="chipset">' + PART_KEYS.map(function (k, i) {
    return '<button class="chip' + (st.parts.indexOf(k) >= 0 ? ' on' : '') + '" data-act="part" data-k="' + k + '"><i style="background:var(--s' + (i + 1) + ')"></i>' + COICOP[k] + '</button>';
  }).join('') + '</div>' + chart(function (el) {
    lineChart(el, { t: h.t, unit: '%', height: 320, refs: [{ y: 2, label: '2% target' }], label: 'Inflation components', series: PART_KEYS.map(function (k, i) {
      return { name: COICOP[k], values: h.s[k + '|' + s.c] || [], color: i + 1 };
    }).filter(function (x, i) { return st.parts.indexOf(PART_KEYS[i]) >= 0; }) });
  }), { sub: 'Annual rate of change, %. Choose the lines to show.', src: 'hicp' }) +
    card('All thirteen spending categories', '<div class="tw"><table aria-label="Price change by spending category"><thead><tr><th scope="col">Category</th><th scope="col">Now</th><th scope="col">A year ago</th><th scope="col">Share of basket</th><th scope="col">Two years</th></tr></thead><tbody>' + rows + '</tbody></table></div>', { sub: 'Annual rate of change and weight in the consumer basket', src: ['hicpd', 'hicpw'] });
}
function defaultShares(c) { const w = M.weights(D, c), o = {}; M.BUDGET.forEach(function (b) { o[b.k] = Math.round(w[b.k] * 100); }); return o; }
function personalOut() {
  const sh = st.shares || defaultShares(st.c), p = M.personal(D, st.c, sh), s = snap(st.c);
  const tot = M.BUDGET.reduce(function (a, b) { return a + (sh[b.k] || 0); }, 0);
  const worst = p.rows.filter(function (r) { return r.contrib !== null; }).sort(function (a, b) { return b.contrib - a.contrib; }).slice(0, 2);
  const gap = p.rate !== null && s.piDiv !== null ? p.rate - s.piDiv : null;
  return '<div class="tiles two">' + tile('Your inflation rate', pct(p.rate), 'Category prices for ' + periodLabel(s.divT), { tone: gap > 0.3 ? 'warn' : gap < -0.3 ? 'good' : '' }) +
    tile('Official rate, ' + esc(s.meta.n), pct(s.piDiv), gap === null ? '' : Math.abs(gap) < 0.05 ? 'The same as yours' : 'Yours is ' + fmt(Math.abs(gap), 1) + ' points ' + (gap > 0 ? 'higher' : 'lower'), {}) + '</div>' +
    barList(p.rows.filter(function (r) { return r.share > 0; }).sort(function (a, b) { return (b.contrib || 0) - (a.contrib || 0); }).map(function (r) { return { label: r.n, value: r.contrib }; }), { unit: ' pp', dp: 2 }) +
    '<p class="note">' + (worst.length ? 'Most of your rate comes from <b>' + worst.map(function (r) { return r.n.toLowerCase() + ' (' + pct(r.rate) + ')'; }).join('</b> and <b>') + '</b>. Substituting or timing purchases in these areas has the most effect. ' : '') +
    'Your shares add up to ' + tot + '%; they are rescaled to 100%.</p>';
}
function labPersonal(s) {
  const sh = st.shares || defaultShares(st.c);
  return '<div class="grid two">' + card('Your monthly spending', '<div class="sliders">' + M.BUDGET.map(function (b) {
    return '<label><span>' + b.n + '<small id="d-share-' + b.k + '">prices ' + rate(M.val(D, 'hicpd', b.k + '|' + st.c)) + '</small></span>' + range(b.k, sh[b.k] || 0, 0, 60, 1, 'share', (sh[b.k] || 0) + '%', b.n) + '<output aria-hidden="true">' + (sh[b.k] || 0) + '%</output></label>';
  }).join('') + '</div><button class="btn" data-act="resetShares">Reset to the national average</button>', { sub: 'Set the share of your budget that goes to each category' }) +
    card('Your result', '<div id="out">' + personalOut() + '</div>', { sub: 'How price changes hit your own basket', src: ['hicpd', 'hicpw'] }) + '</div>';
}
function labOutlook(s) {
  const a = M.series(D, 'hicp', 'TOTAL|' + s.c), pr = M.project(a), t = D.hicp.t;
  let body = '<p class="empty">Not enough history to project.</p>', tiles = '';
  if (pr) {
    const from = Math.max(0, pr.end - 35), tt = t.slice(from, pr.end + 1), vals = a.slice(from, pr.end + 1), proj = vals.map(function () { return null; }), lo = proj.slice(), hi = proj.slice();
    proj[proj.length - 1] = lo[lo.length - 1] = hi[hi.length - 1] = a[pr.end];
    let y = +t[pr.end].slice(0, 4), mo = +t[pr.end].slice(5);
    pr.path.forEach(function (v, k) {
      mo++; if (mo > 12) { mo = 1; y++; }
      tt.push(y + '-' + (mo < 10 ? '0' : '') + mo); vals.push(null); proj.push(v); lo.push(v - pr.rmse[k]); hi.push(v + pr.rmse[k]);
    });
    body = chart(function (el) {
      lineChart(el, { t: tt, unit: '%', height: 300, refs: [{ y: 2, label: '2% target' }], band: { from: pr.end - from, lo: lo, hi: hi }, label: 'Inflation projection',
        series: [{ name: 'Published', values: vals, color: 1 }, { name: 'Projection', values: proj, color: 1, dash: true }] });
    });
    tiles = '<div class="tiles three">' + tile('Direction', pr.dir, 'Next six months', { tone: pr.dir === 'Rising' ? 'warn' : pr.dir === 'Easing' ? 'good' : '' }) +
      tile('In six months', pct(pr.path[5]), 'Central path', {}) + tile('Likely range', fmt(pr.path[5] - pr.rmse[5]) + ' – ' + fmt(pr.path[5] + pr.rmse[5]) + '%', 'From this rule’s past errors', {}) + '</div>';
  }
  const pipe = [['Producer prices', s.ppi, M.val(D, 'ppi', s.c, 3), '%', 'Factory-gate prices reach shops within months.'],
    ['Energy prices', s.nrg, M.val(D, 'hicp', 'NRG|' + s.c, 3), '%', 'Energy feeds transport, food and services costs.'],
    ['Wage growth', s.wage, M.val(D, 'wages', s.c, 1), '%', 'Pay growth sustains services inflation.'],
    ['Price expectations', s.exp, M.val(D, 'expect', s.c, 3), '', 'Survey balance of households expecting faster price rises.'],
    ['Rents', s.rent, M.val(D, 'hicpd', 'CP041|' + s.c, 3), '%', 'Rents move slowly and keep services inflation up.'],
    ['House prices', s.hpi, M.val(D, 'hpi', s.c, 1), '%', 'Rising house prices feed into rents with a delay.']];
  return '<div class="grid two">' + card('Six-month projection', tiles + body + '<p class="note">The shaded band is how far this simple rule has missed in the past for ' + esc(s.meta.n) + '. It is a momentum signal, not an official forecast.</p>', { sub: 'Annual HICP rate, %', src: 'hicp' }) +
    card('Pressure in the pipeline', '<div class="tw"><table aria-label="Leading indicators"><thead><tr><th scope="col">Leading indicator</th><th scope="col">Now</th><th scope="col">Earlier</th><th scope="col">Signal</th></tr></thead><tbody>' + pipe.map(function (r) {
      const d = typeof r[1] === 'number' && typeof r[2] === 'number' ? r[1] - r[2] : null;
      return '<tr><td><b>' + r[0] + '</b><br><small>' + r[4] + '</small></td><td>' + unit(r[1], r[3]) + '</td><td>' + unit(r[2], r[3]) + '</td><td>' + (d === null ? '–' : d > 0.2 ? badge('Building', 'warn') : d < -0.2 ? badge('Easing', 'good') : badge('Steady', 'mute')) + '</td></tr>';
    }).join('') + '</tbody></table></div><p class="note">“Earlier” is three months back, or one quarter for wages and house prices. Signals show direction only.</p>', { sub: 'Indicators that tend to move before consumer prices', src: ['ppi', 'wages', 'expect'] }) + '</div>';
}
function pageInflation() {
  const s = snap(st.c), sub = st.sub.inflation;
  return head('Inflation Lab · ' + esc(s.meta.n), 'Find out what is driving prices, how they affect a given household, and where they are heading.') + subtabs('inflation') +
    (sub === 'parts' ? labParts(s) : sub === 'personal' ? labPersonal(s) : sub === 'outlook' ? labOutlook(s) : labDiag(s));
}

// ---------- Currency & Trade ----------
function calcState(k, def) { if (!st.calc[k] || st.calc[k]._c !== st.c) { st.calc[k] = Object.assign({ _c: st.c }, def); } return st.calc[k]; }
function field(calc, k, label, v, o) {
  o = o || {};
  return '<label class="fld"><span>' + label + '</span><span class="inp"><input type="number" inputmode="decimal" data-calc="' + calc + '" data-k="' + k + '" value="' + v + '" step="' + (o.step || 'any') + '"' + (o.min !== undefined ? ' min="' + o.min + '"' : '') + '><em>' + (o.unit || '') + '</em></span></label>';
}
function curMonitor(s) {
  const m = s.meta, own = s.own, fx = D.fx, arr = fx ? fx.s[s.fxCur] : null;
  let peg = '';
  if (m.peg && s.fxRate) {
    const dev = (s.fxRate / m.peg - 1) * 100;
    peg = '<p class="note">Central rate ' + m.peg + ' with a ±' + m.band + '% band. The krone is now ' + fmt(Math.abs(dev), 2) + '% ' + (dev > 0 ? 'weaker' : 'stronger') + ' than the central rate, using ' + fmt(Math.abs(dev) / m.band * 100, 0) + '% of the band.</p>';
  }
  const ext = [['Current account', s.ca, '% of GDP'], ['Exports of goods and services', s.xGdp, '% of GDP'], ['Imports of goods and services', s.mGdp, '% of GDP'], ['Export growth, latest year', s.xGrowth, '%'], ['Energy import dependency', s.nrgdep, '%']];
  const tbl = NON_EURO.map(function (x) {
    const c1 = M.fxChange(D, x.cur, 21), c12 = M.fxChange(D, x.cur, 252), v = M.fxVol(M.series(D, 'fx', x.cur), 90);
    return '<tr data-country="' + x.c + '" tabindex="0"><td><b>' + x.n + '</b><br><small>' + x.regime + '</small></td><td>' + x.cur + '</td><td>' + fmt(M.val(D, 'fx', x.cur), 3) + '</td><td>' + gain(c1) + '</td><td>' + gain(c12) + '</td><td>' + pct(v) + '</td></tr>';
  }).join('');
  return '<div class="tiles four">' +
    tile('Currency', m.cur || 'EUR', own ? m.regime : m.agg ? 'Single currency' : 'Euro area member since ' + m.euro, {}) +
    tile(own ? s.fxCur + ' per euro' : 'US dollars per euro', fmt(s.fxRate, s.fxRate > 100 ? 1 : 4), fx ? periodLabel(fx.t[fx.t.length - 1]) : '', {}) +
    tile((own ? m.cur : 'Euro') + ' over 12 months', gain(s.dep12), 'Against ' + (own ? 'the euro' : 'the US dollar') + ' · 1 month ' + gain(s.dep1), { tone: s.dep12 > 5 ? 'warn' : '' }) +
    tile('Volatility', pct(s.fxVol), 'Annualised, last 90 trading days', { tone: s.fxVol > 10 ? 'warn' : '' }) +
    '</div><div class="grid two">' +
    card(own ? s.fxCur + ' per euro' : 'US dollars per euro', chart(function (el) {
      lineChart(el, { t: fx.t, height: 300, dp: s.fxRate > 100 ? 1 : 4, series: [{ name: s.fxCur + ' per EUR', values: arr || [], color: 1 }], refs: m.peg ? [{ y: m.peg, label: 'Central rate' }] : [], label: 'Exchange rate' });
    }) + peg + '<p class="note">' + (own ? 'A rising line means the ' + m.cur + ' is losing value against the euro, which makes imports dearer.' : 'A falling line means the euro is losing value against the dollar, which makes dollar-priced imports such as energy dearer.') + '</p>', { sub: 'Daily ECB reference rate, two years', src: 'fx' }) +
    card('External position', '<div class="kv one">' + ext.map(function (r) { return '<div><span>' + r[0] + '</span><b>' + fmt(r[1]) + ' <small>' + r[2] + '</small></b></div>'; }).join('') + '</div><p class="note">A deficit on the current account and high import dependence make a country more exposed to currency and commodity swings.</p>', { sub: 'Trade and payments with the rest of the world', src: ['ca', 'gdpa', 'nrgdep'] }) +
    '</div>' + card('The six EU currencies outside the euro', '<div class="tw"><table aria-label="Currencies of the six members outside the euro"><thead><tr><th scope="col">Member state</th><th scope="col">Currency</th><th scope="col">Per euro</th><th scope="col">1 month</th><th scope="col">12 months</th><th scope="col">Volatility</th></tr></thead><tbody>' + tbl + '</tbody></table></div><p class="note">Changes show the gain (+) or loss (−) in the currency’s value against the euro.</p>', { sub: 'Select a row to switch country', src: 'fx' });
}
function lockOut() {
  const a = st.calc.lock, r = M.fxLock(a);
  return '<div class="tiles two">' + tile('Cost with the lock', fmt(r.locked, 2) + ' m', a.home, {}) + tile('Cost without it', fmt(r.open, 2) + ' m', a.home + ' at ' + fmt(r.market, 4), { tone: r.saving > 0 ? 'warn' : '' }) + '</div>' +
    '<div class="tiles two">' + tile(r.saving >= 0 ? 'Importer saves' : 'Importer overpays', fmt(Math.abs(r.saving), 2) + ' m', fmt(Math.abs(r.pct), 1) + '% of the bill', { tone: r.saving >= 0 ? 'good' : 'serious' }) +
    tile('Provider’s exposure', fmt(Math.max(0, r.saving), 2) + ' m', 'Loss carried by whoever grants the lock', {}) + '</div>' +
    '<p class="note">The saving to the importer is exactly the cost to the provider. A central bank or promotional bank offering locks must price them at market or cap the volume, otherwise the currency risk moves to the public balance sheet.</p>';
}
function curLock(s) {
  const own = s.own, spot = own ? s.fxRate : s.fxRate ? 1 / s.fxRate : 1;
  const a = calcState('lock', { bill: 10, spot: +(spot || 1).toFixed(4), lock: +(spot || 1).toFixed(4), move: 10, home: own ? s.meta.cur : 'EUR', fcy: own ? 'EUR' : 'USD' });
  return '<div class="grid two">' + card('Set up the lock', '<div class="form">' + field('lock', 'bill', 'Import bill', a.bill, { unit: 'm ' + a.fcy, min: 0 }) + field('lock', 'spot', 'Today’s rate', a.spot, { unit: a.home + ' per ' + a.fcy }) +
    field('lock', 'lock', 'Locked rate', a.lock, { unit: a.home + ' per ' + a.fcy }) + field('lock', 'move', 'Scenario: ' + a.home + ' weakens by', a.move, { unit: '%' }) + '</div><p class="note">An importer agrees today the rate it will pay for foreign currency over the coming year. Today’s rate is filled in from the live ECB reference rate.</p>', { sub: 'Exchange rate lock for an importer in ' + esc(s.meta.n) }) +
    card('Result', '<div id="out">' + lockOut() + '</div>', { sub: 'What the lock is worth in the scenario' }) + '</div>';
}
function bondOut() {
  const a = st.calc.bond, r = M.exportBond(a);
  return '<div class="tiles two">' + tile('Coupon this year', pct(r.yield, 2), 'Base ' + pct(a.base, 2) + ' plus ' + pct(r.bonus, 2) + ' export bonus', {}) + tile('Annual interest', '€' + fmt(r.annual, 1) + ' m', 'Of which bonus €' + fmt(r.extra, 1) + ' m', {}) + '</div>' +
    '<p class="note">The issuer pays more only in years when exports, and with them tax revenue and foreign earnings, are strong. Investors share in export success, which draws foreign capital towards the economy without a higher policy rate. The cap limits the issuer’s cost.</p>';
}
function curBond(s) {
  const a = calcState('bond', { size: 1000, base: 3, per: 5, bonus: 0.5, cap: 6, growth: typeof s.xGrowth === 'number' ? +s.xGrowth.toFixed(1) : 4 });
  return '<div class="grid two">' + card('Design the bond', '<div class="form">' + field('bond', 'size', 'Issue size', a.size, { unit: '€ m', min: 0 }) + field('bond', 'base', 'Base coupon', a.base, { unit: '%' }) + field('bond', 'bonus', 'Bonus coupon', a.bonus, { unit: 'pp' }) +
    field('bond', 'per', 'For every … of export growth', a.per, { unit: '%', min: 0.1 }) + field('bond', 'cap', 'Coupon cap', a.cap, { unit: '%' }) + field('bond', 'growth', 'Export growth this year', a.growth, { unit: '%' }) + '</div><p class="note">Export growth is filled in with the latest annual figure for ' + esc(s.meta.n) + '.</p>', { sub: 'A government bond whose coupon follows export performance', src: 'gdpa' }) +
    card('Result', '<div id="out">' + bondOut() + '</div>', { sub: 'Coupon and cost at this export growth' }) + '</div>';
}
const BASKET = ['CZK', 'DKK', 'HUF', 'PLN', 'RON', 'SEK', 'USD', 'GBP', 'CHF'];
function basketOut() {
  const r = M.basket(D, st.calc.basket);
  if (!r) return '<p class="empty">Give at least one currency a weight.</p>';
  jobs = jobs.filter(function (j) { return j.id !== 'bch'; });
  jobs.push({ id: 'bch', fn: function (el) { lineChart(el, { t: r.t, height: 200, dp: 1, series: [{ name: 'Basket value in euro, start = 100', values: r.level, color: 1 }], refs: [{ y: 100, label: 'Start' }], label: 'Basket value' }); } });
  return '<div class="tiles three">' + tile('Basket volatility', pct(r.vol), 'Against the euro, one year', { tone: 'good' }) + tile('Average of its members', pct(r.avg), 'Weighted', {}) + tile('Volatility removed', pct(r.gain, 0), 'By pooling', {}) + '</div>' +
    '<div class="chart" id="bch"></div>' + barList(r.parts.map(function (p) { return { label: p.k + ' · ' + fmt(p.w * 100, 0) + '%', value: p.vol }; }), { unit: '%', ref: r.vol, refLabel: 'Basket volatility' });
}
function curBasket() {
  const a = calcState('basket', { CZK: 20, DKK: 0, HUF: 15, PLN: 30, RON: 15, SEK: 20, USD: 0, GBP: 0, CHF: 0 });
  return '<div class="grid two">' + card('Build a basket', '<div class="sliders">' + BASKET.map(function (k) {
    return '<label><span>' + k + '<small id="d-basket-' + k + '">volatility ' + pct(M.fxVol(M.series(D, 'fx', k), 252)) + '</small></span>' + range(k, a[k] || 0, 0, 100, 5, 'basket', String(a[k] || 0), k + ' weight') + '<output aria-hidden="true">' + (a[k] || 0) + '</output></label>';
  }).join('') + '</div><p class="note">Give each currency a weight. A unit built from several currencies moves less than its members because their swings partly cancel out. This is the principle behind a regional settlement unit.</p>', { sub: 'Weights are rescaled to 100%' }) +
    card('Result', '<div id="out">' + basketOut() + '</div>', { sub: 'Computed from daily ECB reference rates over the past year', src: 'fx' }) + '</div>';
}
function voucherOut() {
  const a = st.calc.voucher, r = M.voucher(a);
  return '<div class="tiles two">' + tile('Market conversions before', '€' + fmt(r.gross, 1) + ' bn', 'Exporters sell, importers buy', {}) + tile('Market conversions after', '€' + fmt(r.grossAfter, 1) + ' bn', fmt(r.gross ? (1 - r.grossAfter / r.gross) * 100 : 0, 0) + '% less', { tone: 'good' }) + '</div>' +
    '<div class="tiles two">' + tile('Held as vouchers', '€' + fmt(r.kept, 1) + ' bn', 'Fully backed by foreign currency', {}) + tile('Import bill met directly', '€' + fmt(r.covered, 1) + ' bn', 'Paid with vouchers, no conversion', {}) + '</div>' +
    '<p class="note">Fewer and smaller conversions mean smaller day-to-day swings in the exchange rate and less call on official reserves. The scheme must stay voluntary to respect free movement of capital.</p>';
}
function curVoucher(s) {
  const x = M.val(D, 'gdpa', 'CP_MEUR|P6|' + s.c), im = M.val(D, 'gdpa', 'CP_MEUR|P7|' + s.c);
  const a = calcState('voucher', { exports: x ? Math.round(x / 100) / 10 : 100, imports: im ? Math.round(im / 100) / 10 : 100, share: 50 });
  return '<div class="grid two">' + card('Set the scheme', '<div class="form">' + field('voucher', 'exports', 'Annual export earnings', a.exports, { unit: '€ bn', min: 0 }) + field('voucher', 'imports', 'Annual import bill', a.imports, { unit: '€ bn', min: 0 }) +
    field('voucher', 'share', 'Share of export earnings kept as vouchers', a.share, { unit: '%', min: 0 }) + '</div><p class="note">Exporters keep part of their foreign earnings as tradable vouchers and pass them to importers, so the two flows meet without each crossing the currency market. Figures are filled in from the latest national accounts for ' + esc(s.meta.n) + '.</p>' +
    (s.meta.euro || s.meta.agg ? '<p class="note warnline">' + esc(s.meta.n) + ' uses the euro, so this applies only to trade settled in other currencies. The tool is most relevant to the six members with their own currency.</p>' : ''), { sub: 'Matching export earnings with import needs', src: 'gdpa' }) +
    card('Result', '<div id="out">' + voucherOut() + '</div>', { sub: 'Effect on currency-market turnover' }) + '</div>';
}
function pageCurrency() {
  const s = snap(st.c), sub = st.sub.currency;
  return head('Currency & Trade · ' + esc(s.meta.n), 'Track exchange rates and the external balance, then test stabilisation tools with live figures.') + subtabs('currency') +
    (sub === 'lock' ? curLock(s) : sub === 'bond' ? curBond(s) : sub === 'basket' ? curBasket() : sub === 'voucher' ? curVoucher(s) : curMonitor(s));
}

// ---------- Policy Simulator ----------
const PRESETS = {
  shield: { n: 'Cost-of-living shield', L: { vatFood: 5, energy: 50, transfer: 0.5, rent: 4 } },
  supply: { n: 'Supply first', L: { reserve: 4, supply: 0.8, bonds: 0.5 } },
  balanced: { n: 'Funded and targeted', L: { transfer: 0.6, vatLux: 2, bonds: 1, reserve: 2 } }
};
function leverLabel(l, v) { return l.off !== undefined && v >= l.off ? 'No cap' : (l.min < 0 && v > 0 ? '+' : '') + v + l.unit; }
function simOut() {
  const s = snap(st.c), r = M.simulate(s, st.L), after = r.pi + r.mid;
  const names = {}; M.LEVERS.forEach(function (l) { names[l.k] = l; });
  if (!r.rows.length) return '<p class="empty">Move a slider or choose a package to see its estimated effect.</p>';
  return '<div class="tiles two">' + tile('Inflation after one year', pct(after), 'Now ' + pct(r.pi) + ' · change ' + signed(r.mid, 2) + ' pp', { tone: M.regime(after).tone }) +
    tile('Range', fmt(r.pi + r.lo) + ' – ' + fmt(r.pi + r.hi) + '%', 'Low and high assumptions', {}) + '</div><div class="tiles two">' +
    tile('Budget cost', signed(r.cost, 2) + '% GDP', r.costEur !== null ? '€' + fmt(Math.abs(r.costEur) / 1000, 1) + ' bn a year' + (r.cost < 0 ? ' raised' : '') : '', { tone: r.cost > 1 ? 'warn' : '' }) +
    tile('Government balance', r.bal === null ? '–' : pct(r.bal), 'Was ' + pct(s.bal) + ' of GDP · GDP effect ' + signed(r.gdp, 1) + '%', { tone: r.bal !== null && r.bal < -3 ? 'serious' : '' }) + '</div>' +
    '<div class="tw"><table aria-label="Estimated effect of each measure"><thead><tr><th scope="col">Measure</th><th scope="col">Inflation</th><th scope="col">Range</th><th scope="col">Cost, % GDP</th></tr></thead><tbody>' + r.rows.map(function (x) {
      return '<tr><td><b>' + names[x.k].n + '</b><br><small>' + esc(x.note) + '</small></td><td>' + signed(x.mid, 2) + ' pp</td><td>' + signed(x.lo, 2) + ' to ' + signed(x.hi, 2) + '</td><td>' + signed(x.cost, 2) + '</td></tr>';
    }).join('') + '</tbody></table></div>' +
    (r.flags.length ? '<ul class="flags">' + r.flags.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' : '') +
    '<details class="law" aria-label="Legal notes" open><summary>EU legal and institutional notes for this package</summary><ul>' + r.rows.map(function (x) { const l = names[x.k]; return '<li><b>' + l.n + '.</b> ' + esc(l.law) + (l.ref && l.ref[1] ? ' <a class="srcl" href="' + esc(l.ref[1]) + '" target="_blank" rel="noopener">Source: ' + esc(l.ref[0]) + '</a>' : '') + actStatus(l.ref ? l.ref[1] : '', '', l.law) + '</li>'; }).join('') +
    '</ul>' + reviewAge() + '<p class="note">Notes checked against the linked official texts on ' + REVIEWED + '. ' + actsNote() + ' They summarise the law in general terms and are not legal advice.</p></details>';
}
function owner(l) {
  if (st.role === 'all' || st.role === 'res') return '';
  return l.who.indexOf(st.role) >= 0 ? ' ' + badge('Yours to decide', 'good') : ' ' + badge('Decided by ' + l.who.map(roleName).join(' or ').toLowerCase(), 'mute');
}
function pageSimulator() {
  const s = snap(st.c), groups = {};
  M.LEVERS.forEach(function (l) { (groups[l.grp] = groups[l.grp] || []).push(l); });
  const left = Object.keys(groups).map(function (g) {
    return '<h3 class="grp">' + g + '</h3><div class="sliders wide">' + groups[g].map(function (l) {
      const v = st.L[l.k];
      return '<label><span>' + l.n + owner(l) + '<small id="d-lever-' + l.k + '">' + l.d + '</small></span>' + range(l.k, v, l.min || 0, l.max, l.step, 'lever', leverLabel(l, v), l.n) + '<output aria-hidden="true">' + leverLabel(l, v) + '</output></label>';
    }).join('') + '</div>';
  }).join('');
  return head('Policy Simulator · ' + esc(s.meta.n), 'Combine measures and see their estimated first-year effect on inflation, the budget and growth.') +
    '<div class="chipset">' + Object.keys(PRESETS).map(function (k) { return '<button class="chip" data-act="preset" data-k="' + k + '">' + PRESETS[k].n + '</button>'; }).join('') + '<button class="chip" data-act="preset" data-k="">Clear all</button></div>' +
    '<div class="grid two">' + card('Measures', left, { sub: 'Set the size of each measure' }) +
    card('Estimated effect', '<div id="out">' + simOut() + '</div><p class="note">These are stylised estimates from published rules of thumb, shown with a range. They are a guide for comparing options, not a forecast. Every assumption is listed under <a href="#method/how" data-go="method/how">Data & Method</a>.</p>', { sub: 'Starting from live figures for ' + esc(s.meta.n), src: ['hicp', 'hicpw', 'fiscal'], cls: 'sticky' }) + '</div>';
}

// ---------- Strategies ----------
function stratList() {
  const s = snap(st.c), q = st.lib.q.trim().toLowerCase();
  let rows = recommend(s.diag, s.meta, st.role);
  if (!st.lib.fit) rows = rows.slice().sort(function (a, b) { return STRATEGIES.indexOf(a.s) - STRATEGIES.indexOf(b.s); });
  rows = rows.filter(function (r) {
    return (!st.lib.cat || r.s.cat === st.lib.cat) && (!q || (r.s.n + ' ' + r.s.d + ' ' + r.s.ac + ' ' + r.s.cat + ' ' + r.s.eu).toLowerCase().indexOf(q) >= 0) &&
      (st.role === 'all' || r.s.who.indexOf(st.role) >= 0) && (!st.lib.fit || applies(r.s, s.meta));
  });
  return '<p class="count">' + rows.length + ' of ' + STRATEGIES.length + ' strategies' + (st.lib.fit ? ', best match for ' + esc(s.meta.n) + ' first' : '') + '</p>' +
    (rows.length ? '<div class="strats">' + rows.map(function (r) { return stratCard(r); }).join('') + '</div>' : '<p class="empty">No strategy matches these filters.</p>');
}
function pageStrategies() {
  return head('Strategy Library', STRATEGIES.length + ' policy and market-design options for price and currency stability. Each EU note links to the official text it rests on, last checked on ' + REVIEWED + '.') +
    '<div class="filters"><label class="fld grow"><span>Search</span><input type="search" id="q" value="' + esc(st.lib.q) + '" placeholder="For example rent, energy, reserves"></label>' +
    '<label class="fld"><span>Category</span><select id="cat"><option value="">All categories</option>' + CATEGORIES.map(function (c) { return '<option' + (st.lib.cat === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></label>' +
    '<label class="chk"><input type="checkbox" id="fitc"' + (st.lib.fit ? ' checked' : '') + '> Rank by match with ' + esc(nameOf(st.c)) + '</label></div>' + reviewAge() + '<p class="note" style="margin:0 0 10px">' + actsNote() + '</p><div id="out">' + stratList() + '</div>';
}

// ---------- Compare ----------
const IND = {
  pi: { n: 'Inflation, all items', u: '%', f: 'pi', ser: ['hicp', 'TOTAL|'], ref: 2, rl: 'ECB target of 2%', short: '2% target' },
  core: { n: 'Core inflation', u: '%', f: 'core', ser: ['hicp', 'TOT_X_NRG_FOOD|'] }, food: { n: 'Food inflation', u: '%', f: 'food', ser: ['hicp', 'FOOD|'] },
  nrg: { n: 'Energy inflation', u: '%', f: 'nrg', ser: ['hicp', 'NRG|'] }, serv: { n: 'Services inflation', u: '%', f: 'serv', ser: ['hicp', 'SERV|'] },
  une: { n: 'Unemployment rate', u: '%', f: 'une', ser: ['une', ''] }, gdp: { n: 'Real GDP growth', u: '%', f: 'gdp', ser: ['gdpq', ''] },
  wage: { n: 'Wage growth', u: '%', f: 'wage', ser: ['wages', ''] }, hpi: { n: 'House price growth', u: '%', f: 'hpi', ser: ['hpi', ''] },
  ppi: { n: 'Producer price inflation', u: '%', f: 'ppi', ser: ['ppi', ''] }, debt: { n: 'Government debt, % of GDP', u: '%', f: 'debt', ref: 60, rl: 'Treaty reference value of 60%', short: '60% reference', dp: 0 },
  bal: { n: 'Government balance, % of GDP', u: '%', f: 'bal', ref: -3, rl: 'Treaty reference value of −3%', short: '−3% reference' }, ca: { n: 'Current account, % of GDP', u: '%', f: 'ca' },
  nrgdep: { n: 'Energy import dependency', u: '%', f: 'nrgdep', dp: 0 }, heat: { n: 'Overall pressure score (0–100)', u: '', f: 'heat', dp: 0 }
};
function pageCompare() {
  const ind = IND[st.cmp.ind] || IND.pi, get = function (s) { return ind.f === 'heat' ? s.diag.heat : s[ind.f]; };
  const rows = CODES.concat(['EU', 'EA']).map(function (c) { const s = snap(c); return { label: s.meta.n, value: get(s), code: s.meta.agg ? '' : c, hl: st.cmp.sel.indexOf(c) >= 0, agg: !!s.meta.agg }; })
    .sort(function (a, b) { return (b.value === null ? -1e9 : b.value) - (a.value === null ? -1e9 : a.value); });
  const d = ind.ser ? D[ind.ser[0]] : null;
  const right = d ? chart(function (el) {
    lineChart(el, { t: d.t, unit: ind.u, height: 440, refs: typeof ind.ref === 'number' ? [{ y: ind.ref, label: ind.short }] : [], label: ind.n,
      series: st.cmp.sel.map(function (c, i) { return { name: nameOf(c), values: d.s[ind.ser[1] + c] || [], color: i + 1 }; }) });
  }) : '<p class="empty">This indicator is published once a year, so only the latest ranking is shown.</p>';
  return head('Compare member states', 'Rank all 27 countries on one indicator and follow up to four of them over time.') +
    '<div class="filters"><label class="fld grow"><span>Indicator</span><select id="ind">' + Object.keys(IND).map(function (k) { return '<option value="' + k + '"' + (k === st.cmp.ind ? ' selected' : '') + '>' + IND[k].n + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="grid two">' + card('Ranking', barList(rows, { unit: ind.u, dp: ind.dp, ref: ind.ref, refLabel: ind.rl }), { sub: ind.n + ' · EU and euro area shown for reference', src: ind.ser ? ind.ser[0] : ind.f === 'heat' ? 'hicp' : ['debt', 'bal'].indexOf(ind.f) >= 0 ? 'fiscal' : ind.f === 'ca' ? 'ca' : 'nrgdep' }) +
    card('Over time', '<div class="chipset small">' + CODES.map(function (c) {
      const i = st.cmp.sel.indexOf(c);
      return '<button class="chip' + (i >= 0 ? ' on' : '') + '" data-act="cmp" data-k="' + c + '" title="' + esc(nameOf(c)) + '">' + (i >= 0 ? '<i style="background:var(--s' + (i + 1) + ')"></i>' : '') + c + '</button>';
    }).join('') + '</div>' + right + '<p class="note">Choose up to four countries. Selecting a fifth replaces the first.</p>', { sub: ind.n, src: ind.ser ? ind.ser[0] : undefined }) + '</div>';
}

// ---------- Data & Method ----------
function ago(ts) {
  if (!ts) return 'bundled baseline';
  const m = Math.round((Date.now() - ts) / 60000);
  return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago';
}
function pageMethod() {
  const sub = st.sub.method;
  let body;
  if (sub === 'sources') {
    body = card('Live data feeds', '<div class="tw"><table aria-label="Live data feeds"><thead><tr><th scope="col">Dataset</th><th scope="col">Publisher</th><th scope="col">Frequency</th><th scope="col">Latest period</th><th scope="col">Fetched by this device</th><th scope="col">Status</th></tr></thead><tbody>' + ALL_IDS.map(function (id) {
      const d = DATASETS[id], e = D[id], stt = STATE[id];
      const b = stt === 'live' ? badge('Live', 'good') : stt === 'error' ? badge(e ? 'Using saved copy' : 'Unavailable', e ? 'warn' : 'crit') : stt === 'loading' ? badge('Updating', 'info') : badge(e && e.at ? 'Saved copy' : 'Baseline', 'mute');
      return '<tr><td><a href="' + sourceUrl(id) + '" target="_blank" rel="noopener"><b>' + d.label + '</b></a>' + (d.code ? '<br><small>' + d.code + '</small>' : e && e.via ? '<br><small>via ' + esc(e.via) + '</small>' : '') + '</td><td>' + esc(d.src) + '</td><td>' + d.freq + '</td><td>' + (e ? periodLabel(e.t[e.t.length - 1]) : '–') + '</td><td>' + (e ? ago(e.at) : '–') + '</td><td>' + b + '</td></tr>';
    }).join('') + '</tbody></table></div><div class="actions"><button class="btn primary" data-act="refresh">Refresh all now</button><button class="btn" data-act="print">Print or save as PDF</button><button class="btn" data-act="download">Download the data (JSON)</button><button class="btn" data-act="csv">Download ' + esc(nameOf(st.c)) + ' summary (CSV)</button></div>' +
      '<p class="note">Your browser fetches every figure directly from the publisher each time you open the tool and again while it stays open: exchange rates hourly, monthly statistics every six hours. Nothing passes through a private server. When you are offline the tool shows the copy saved on this device.</p>', { sub: ALL_IDS.length + ' official feeds, updated automatically' });
  } else body = PAGE_METHOD(sub, { VERSION: VERSION + ' · build ' + BUILD, REVIEWED: REVIEWED, ACTS_NOTE: actsNote(), card: card, badge: badge, chart: chart, M: M, standalone: isStandalone() });
  return head('Data & Method', 'Where every number comes from, how the gauges and estimates are built, and how to install the tool.') + subtabs('method') + body;
}

// ---------- shell, routing, events ----------
const RENDER = { overview: pageOverview, country: pageCountry, inflation: pageInflation, currency: pageCurrency, simulator: pageSimulator, strategies: pageStrategies, compare: pageCompare, method: pageMethod };
function draw(printing) { jobs.forEach(function (j) { const el = $(j.id); if (el) { el.printWidth = printing ? (el.closest('.grid.two') ? 330 : 700) : 0; try { j.fn(el); } catch (e) { el.innerHTML = '<p class="empty">Chart unavailable.</p>'; } } }); }
function render(keepScroll) {
  jobs = [];
  const app = $('app'), y = window.pageYOffset;
  let html;
  try { html = D.hicp ? RENDER[st.page]() : '<div class="loading"><div class="spin"></div><p>Fetching the latest official figures…</p></div>'; }
  catch (e) { html = '<div class="card"><div class="cb"><p class="empty">This view could not be drawn with the data currently available. Try “Refresh all now” under Data & Method.</p></div></div>'; if (window.console) console.error(e); }
  app.innerHTML = html;
  draw();
  const nb = neighbours(), i = nb.i, prev = nb.prev, next = nb.next;
  $('nav').innerHTML = PAGES.map(function (p, j) { return '<a href="' + link(p.k) + '" data-go="' + p.k + '"' + (p.k === st.page ? ' aria-current="page"' : '') + '><i aria-hidden="true">' + (j + 1) + '</i>' + p.n + '</a>'; }).join('');
  $('pager').innerHTML = '<a class="pg prev" href="' + link(prev.k) + '" data-go="' + prev.k + '" ><span class="arr" aria-hidden="true">' + ARROW_L + '</span><span class="pgl"><small>Back</small><b>' + prev.n + '</b></span></a>' +
    '<span class="dots" aria-hidden="true">' + PAGES.map(function (p, j) { return '<a href="' + link(p.k) + '" data-go="' + p.k + '" title="' + p.n + '" tabindex="-1"' + (j === i ? ' class="on"' : '') + '></a>'; }).join('') + '</span>' +
    '<a class="pg next" href="' + link(next.k) + '" data-go="' + next.k + '" ><span class="pgl"><small>Next</small><b>' + next.n + '</b></span><span class="arr" aria-hidden="true">' + ARROW_R + '</span></a>';
  const cur = $('nav').querySelector('[aria-current]');
  if (cur && cur.scrollIntoView && !keepScroll) { try { cur.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) { /* older browsers */ } }
  $('csel').value = st.c; $('rsel').value = st.role;
  document.title = PAGES[i].n + ' · EU Stability Compass';
  window.scrollTo(0, keepScroll ? y : 0);
  save();
}
function out() { const o = $('out'); if (!o) return; const fn = OUT[st.page + (st.sub[st.page] ? '.' + st.sub[st.page] : '')]; if (fn) { o.innerHTML = fn(); draw(); save(); } }
const OUT = { 'simulator': simOut, 'strategies': stratList, 'inflation.personal': personalOut, 'currency.lock': lockOut, 'currency.bond': bondOut, 'currency.basket': basketOut, 'currency.voucher': voucherOut };

// Navigation. The address bar follows the page (for example …/#inflation/personal or
// …/#country/PL) so any view can be bookmarked or shared. The overview is the bare address.
function addr() {
  const sub = st.page === 'country' ? st.c : SUBS[st.page] ? st.sub[st.page] : '';
  return location.pathname + location.search + (st.page === 'overview' ? '' : '#' + st.page + (sub ? '/' + sub : ''));
}
function fromHash() { const p = location.hash.replace(/^#\/?/, '').split('/'); return { p: p[0] || 'overview', s: p[1] || '' }; }
function show(page, sub) {
  if (!RENDER[page]) page = 'overview';
  st.page = page;
  if (sub) { if (page === 'country' && BY_CODE[sub]) { st.c = sub; st.shares = null; } else if (SUBS[page] && SUBS[page].some(function (x) { return x[0] === sub; })) st.sub[page] = sub; }
  render();
}
function go(page, sub) {
  show(page, sub);
  const h = $('title');
  if (h) { try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } }
  try { if (addr() !== location.pathname + location.search + location.hash) history.pushState(null, '', addr()); } catch (e) { /* history unavailable */ }
}
function syncAddr() { try { history.replaceState(null, '', addr()); } catch (e) { /* history unavailable */ } }
window.addEventListener('popstate', function () { const x = fromHash(); show(x.p, x.s); });
function setCountry(c, quiet) { if (!BY_CODE[c]) return; st.c = c; st.shares = null; if (!quiet) { render(true); syncAddr(); } }

document.addEventListener('click', function (e) {
  let t = e.target;
  while (t && t !== document && !(t.dataset && (t.dataset.go || t.dataset.sub || t.dataset.act || t.dataset.country))) t = t.parentNode;
  if (!t || t === document) return;
  const ds = t.dataset;
  if (ds.go) { e.preventDefault(); const g = ds.go.split('/'); go(g[0], g[1]); return; }
  if (ds.sub) { go(st.page, ds.sub); return; }
  if (ds.country) { if (ds.open) { st.c = ds.country; st.shares = null; go('country', ds.country); } else if (st.page === 'compare') { toggleCmp(ds.country); } else setCountry(ds.country); return; }
  const a = ds.act;
  if (t.tagName === 'A') e.preventDefault();
  if (a === 'skip') { $('app').focus(); return; }
  if (a === 'preset') { st.L = Object.assign({}, M.NO_POLICY, ds.k ? PRESETS[ds.k].L : {}); render(true); }
  else if (a === 'part') { const i = st.parts.indexOf(ds.k); if (i >= 0) { if (st.parts.length > 1) st.parts.splice(i, 1); } else st.parts.push(ds.k); render(true); }
  else if (a === 'cmp') toggleCmp(ds.k);
  else if (a === 'resetShares') { st.shares = null; render(true); }
  else if (a === 'refresh') refresh(ALL_IDS, true);
  else if (a === 'download') download('eu-stability-compass-data.json', JSON.stringify({ exported: new Date().toISOString(), datasets: D }), 'application/json');
  else if (a === 'csv') download('summary-' + st.c + '.csv', csvSummary(), 'text/csv');
  else if (a === 'lensoff') { st.role = 'all'; render(true); }
  else if (a === 'install') install();
  else if (a === 'print') window.print();
  else if (a === 'close') closeModal();
  else if (a === 'reload') location.reload();
});
function toggleCmp(c) { const s = st.cmp.sel, i = s.indexOf(c); if (i >= 0) { if (s.length > 1) s.splice(i, 1); } else { s.push(c); if (s.length > 4) s.shift(); } render(true); }
document.addEventListener('keydown', function (e) {
  const t = e.target;
  if (e.key === 'Escape' && !$('modal').hidden) { closeModal(); return; }
  if (e.key === 'Enter' && t.dataset && t.dataset.country) { t.click(); return; }
  if (/INPUT|SELECT|TEXTAREA/.test(t.tagName) || e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.key === 'ArrowRight') go(neighbours().next.k);
  if (e.key === 'ArrowLeft') go(neighbours().prev.k);
});
document.addEventListener('input', function (e) {
  const t = e.target, ds = t.dataset, v = parseFloat(t.value);
  const label = function (txt) { const o = t.parentNode.querySelector('output'); if (o) o.textContent = txt; t.setAttribute('aria-valuetext', txt); };
  if (ds.lever) { st.L[ds.lever] = v; label(leverLabel(M.LEVERS.filter(function (l) { return l.k === ds.lever; })[0], v)); out(); }
  else if (ds.share) { if (!st.shares) st.shares = defaultShares(st.c); st.shares[ds.share] = v; label(v + '%'); out(); }
  else if (ds.basket) { st.calc.basket[ds.basket] = v; label(v); out(); }
  else if (ds.calc) { if (isFinite(v)) { st.calc[ds.calc][ds.k] = v; out(); } }
  else if (t.id === 'q') { st.lib.q = t.value; out(); }
});
document.addEventListener('change', function (e) {
  const t = e.target;
  if (t.id === 'csel') { if (st.page === 'overview') { st.c = t.value; st.shares = null; go('country', t.value); } else setCountry(t.value); }
  else if (t.id === 'rsel') { st.role = t.value; render(true); }
  else if (t.id === 'cat') { st.lib.cat = t.value; out(); }
  else if (t.id === 'fitc') { st.lib.fit = t.checked; out(); }
  else if (t.id === 'ind') { st.cmp.ind = t.value; render(true); }
});
// Printed pages carry their date and address, and charts are redrawn at paper width.
window.addEventListener('beforeprint', function () {
  const n = $('printnote');
  if (n) n.textContent = 'Printed ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + ' · ' + location.href.replace(/^https?:\/\//, '');
  draw(true);
});
window.addEventListener('afterprint', function () { draw(); });
let rz = 0;
window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { draw(); }, 150); });

function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: type }));
  a.download = name; document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function csvSummary() {
  const s = snap(st.c), rows = [['Indicator', 'Value', 'Unit'], ['Country', s.meta.n, ''], ['Inflation period', s.piT, '']];
  Object.keys(IND).forEach(function (k) { const v = IND[k].f === 'heat' ? s.diag.heat : s[IND[k].f]; rows.push([IND[k].n, v === null || v === undefined ? '' : v, IND[k].u]); });
  M.PRESSURES.forEach(function (p) { rows.push(['Pressure: ' + p.n, s.diag.p[p.k] === null ? '' : s.diag.p[p.k], '0-100']); });
  return rows.map(function (r) { return r.map(function (x) { return '"' + String(x).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n');
}

// ---------- data loading ----------
function status() {
  const el = $('status'), errs = ALL_IDS.filter(function (id) { return STATE[id] === 'error'; }).length, live = ALL_IDS.filter(function (id) { return STATE[id] === 'live'; }).length;
  let cls = 'info', txt = 'Updating…';
  if (!online) { cls = 'warn'; txt = 'Offline · saved data'; }
  else if (busy) { cls = 'info'; txt = 'Updating…'; }
  else if (live === ALL_IDS.length) { cls = 'good'; txt = 'Live data'; }
  else if (live) { cls = errs ? 'warn' : 'good'; txt = errs ? 'Live · ' + errs + ' feed' + (errs > 1 ? 's' : '') + ' on saved copy' : 'Live data'; }
  else if (errs) { cls = 'warn'; txt = 'Saved data'; }
  el.className = 'status s-' + cls; el.textContent = txt;
}
function refresh(ids, force) {
  const todo = ids.filter(function (id) { return STATE[id] !== 'loading' && (force || isStale(id, D[id])); });
  if (!todo.length) { status(); return Promise.resolve(); }
  busy++; todo.forEach(function (id) { STATE[id] = 'loading'; }); status();
  return Promise.all(todo.map(function (id) {
    return fetchDataset(id).then(function (o) { D[id] = o; STATE[id] = 'live'; LS.set('d.' + id, o); }, function () { STATE[id] = 'error'; });
  })).then(function () {
    busy--; snapMemo = {}; status();
    const act = document.activeElement;
    if (act && /INPUT|SELECT/.test(act.tagName) && $('app').contains(act)) { if (st.page === 'method') render(true); return; }
    render(true);
  });
}
function boot() {
  ALL_IDS.forEach(function (id) { const c = LS.get('d.' + id); if (c && c.t && c.s) { D[id] = c; if (!isStale(id, c)) STATE[id] = 'live'; } });
  const missing = ALL_IDS.filter(function (id) { return !D[id]; });
  const base = missing.length ? fetch(BASE + 'data/snapshot.json').then(function (r) { return r.json(); }).then(function (j) {
    missing.forEach(function (id) { if (j.d[id] && !D[id]) D[id] = j.d[id]; });
  }).catch(function () { /* first visit while offline: wait for live data */ }) : Promise.resolve();
  $('csel').innerHTML = '<optgroup label="Member states">' + COUNTRIES.map(function (c) { return '<option value="' + c.c + '">' + c.n + '</option>'; }).join('') + '</optgroup><optgroup label="Aggregates"><option value="EU">European Union</option><option value="EA">Euro area</option></optgroup>';
  $('rsel').innerHTML = ROLES.map(function (r) { return '<option value="' + r.k + '">' + r.n + '</option>'; }).join('');
  const first = fromHash();
  base.then(function () {
    show(first.p, first.s);
    syncAddr();
    refresh(CORE_IDS).then(function () { refresh(ALL_IDS); refreshActs(); });
  });
  setInterval(function () { if (!document.hidden && online) { refresh(ALL_IDS); refreshActs(); } }, 15 * 60000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden && online) refresh(ALL_IDS); });
  window.addEventListener('online', function () { online = true; refresh(ALL_IDS, true); refreshActs(); });
  window.addEventListener('offline', function () { online = false; status(); });
}

// ---------- theme, install, service worker ----------
function applyTheme() { if (st.theme) document.documentElement.setAttribute('data-theme', st.theme); else document.documentElement.removeAttribute('data-theme'); }
$('theme').addEventListener('click', function () {
  const dark = st.theme ? st.theme === 'dark' : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  st.theme = dark ? 'light' : 'dark'; applyTheme(); save();
});
function isStandalone() { return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; }
function install() {
  if (deferredInstall) { deferredInstall.prompt(); deferredInstall.userChoice.then(function () { deferredInstall = null; }); return; }
  const ua = navigator.userAgent, ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document), android = /Android/.test(ua);
  const steps = ios ? ['Open this page in <b>Safari</b>.', 'Tap the <b>Share</b> button (the square with an arrow).', 'Choose <b>Add to Home Screen</b>, then <b>Add</b>.']
    : android ? ['Open the browser menu (<b>⋮</b>).', 'Tap <b>Install app</b> or <b>Add to Home screen</b>.', 'Confirm with <b>Install</b>.']
      : ['In <b>Chrome</b> or <b>Edge</b>, select the install icon at the right of the address bar, or open the menu and choose <b>Install EU Stability Compass</b>.', 'In <b>Safari</b> on a Mac, choose <b>File → Add to Dock</b>.', 'Firefox on desktop cannot install web apps; the tool still works there and offline once visited.'];
  $('modal').innerHTML = '<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="mh"><h2 id="mh">' + (isStandalone() ? 'Already installed' : 'Install on this device') + '</h2>' +
    (isStandalone() ? '<p>You are using the installed app. It opens without a browser and works offline.</p>' : '<ol>' + steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol><p class="note">Once installed, the tool opens from your home screen or desktop and keeps working in aeroplane mode with the last data it fetched.</p>') +
    '<button class="btn primary" data-act="close">Close</button></div>';
  $('modal').hidden = false;
  $('modal').querySelector('.btn').focus();
}
window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredInstall = e; $('install').classList.add('ready'); });
window.addEventListener('appinstalled', function () { deferredInstall = null; $('install').hidden = true; });
$('install').addEventListener('click', install);
$('modal').addEventListener('click', function (e) { if (e.target === $('modal')) closeModal(); });
function closeModal() { $('modal').hidden = true; $('install').focus(); }
if (isStandalone()) $('install').hidden = true;

if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  navigator.serviceWorker.register('sw.js').then(function (reg) {
    reg.addEventListener('updatefound', function () {
      const w = reg.installing;
      if (!w) return;
      w.addEventListener('statechange', function () {
        if (w.state === 'installed' && navigator.serviceWorker.controller) announceUpdate();
      });
    });
    setInterval(function () { reg.update().catch(function () { /* offline */ }); }, 60 * 60000);
  }).catch(function () { /* unsupported context */ });
}

function announceUpdate() { const t = $('toast'); t.innerHTML = 'A new version is ready. <button class="btn" data-act="reload">Update now</button>'; t.hidden = false; }
window.addEventListener('esc-update', announceUpdate);
if (window.__escUpdate) announceUpdate();

applyTheme();
boot();
