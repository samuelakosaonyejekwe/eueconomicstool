// Live data layer. Every request goes straight from the user's browser to the
// official statistical APIs; nothing is proxied through a private server.
import { CODES, FX_CODES } from './countries.js';

const ESTAT = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/';
const ECB = 'https://data-api.ecb.europa.eu/service/data/';
const FRANK = 'https://api.frankfurter.dev/v1/';
const GEO = CODES.concat(['EU27_2020', 'EA', 'EA21', 'EA20']);
const HOUR = 3600000;

export const DIVISIONS = ['CP01', 'CP02', 'CP03', 'CP04', 'CP05', 'CP06', 'CP07', 'CP08', 'CP09', 'CP10', 'CP11', 'CP12', 'CP13'];
export const COICOP = {
  TOTAL: 'All items', TOT_X_NRG_FOOD: 'Core (excl. energy & food)', FOOD: 'Food, alcohol & tobacco', NRG: 'Energy',
  SERV: 'Services', IGD_NNRG: 'Non-energy industrial goods', AP: 'Administered prices', CP041: 'Rents', CP045: 'Electricity, gas & fuels',
  CP01: 'Food & non-alcoholic drinks', CP02: 'Alcohol & tobacco', CP03: 'Clothing & footwear', CP04: 'Housing, water & energy',
  CP05: 'Furnishings & household', CP06: 'Health', CP07: 'Transport', CP08: 'Information & communication',
  CP09: 'Recreation & culture', CP10: 'Education', CP11: 'Restaurants & hotels', CP12: 'Insurance & finance', CP13: 'Personal care & other'
};

function es(code, params, key) { return { kind: 'estat', code: code, params: params, key: key || [] }; }

// id -> definition. `ttl` is how long a cached copy counts as fresh, in hours.
export const DATASETS = {
  hicp: Object.assign(es('prc_hicp_minr', { unit: 'RCH_A', coicop18: ['TOTAL', 'TOT_X_NRG_FOOD', 'FOOD', 'NRG', 'SERV', 'IGD_NNRG'], sinceTimePeriod: '2019-01' }, ['coicop18']),
    { label: 'HICP inflation, annual rate', src: 'Eurostat', freq: 'Monthly', ttl: 6, core: true }),
  une: Object.assign(es('une_rt_m', { s_adj: 'SA', age: 'TOTAL', sex: 'T', unit: 'PC_ACT', sinceTimePeriod: '2019-01' }),
    { label: 'Unemployment rate', src: 'Eurostat', freq: 'Monthly', ttl: 6, core: true }),
  gdpq: Object.assign(es('namq_10_gdp', { unit: 'CLV_PCH_SM', s_adj: 'SCA', na_item: 'B1GQ', sinceTimePeriod: '2019-Q1' }),
    { label: 'Real GDP growth, year on year', src: 'Eurostat', freq: 'Quarterly', ttl: 12, core: true }),
  fx: { kind: 'fx', label: 'Euro reference exchange rates', src: 'European Central Bank', freq: 'Daily', ttl: 1, core: true },
  ecb: { kind: 'ecb', label: 'ECB deposit facility rate', src: 'European Central Bank', freq: 'On change', ttl: 6, core: true },
  hicpd: Object.assign(es('prc_hicp_minr', { unit: 'RCH_A', coicop18: DIVISIONS.concat(['CP041', 'CP045', 'AP']), lastTimePeriod: 25 }, ['coicop18']),
    { label: 'HICP by consumption division', src: 'Eurostat', freq: 'Monthly', ttl: 6 }),
  hicpw: Object.assign(es('prc_hicp_iw', { coicop18: DIVISIONS.concat(['FOOD', 'NRG', 'SERV', 'IGD_NNRG', 'CP041']), lastTimePeriod: 1 }, ['coicop18']),
    { label: 'HICP household spending weights', src: 'Eurostat', freq: 'Annual', ttl: 72 }),
  gdpa: Object.assign(es('nama_10_gdp', { unit: ['CP_MEUR', 'PC_GDP'], na_item: ['B1GQ', 'P6', 'P7', 'P31_S14_S15'], lastTimePeriod: 6 }, ['unit', 'na_item']),
    { label: 'GDP, trade and consumption', src: 'Eurostat', freq: 'Annual', ttl: 24 }),
  fiscal: Object.assign(es('gov_10dd_edpt1', { unit: 'PC_GDP', sector: 'S13', na_item: ['GD', 'B9'], lastTimePeriod: 8 }, ['na_item']),
    { label: 'Government debt and balance', src: 'Eurostat', freq: 'Annual', ttl: 24 }),
  ca: Object.assign(es('bop_gdp6_q', { freq: 'Q', unit: 'PC_GDP', s_adj: 'NSA', bop_item: 'CA', stk_flow: 'BAL', partner: 'WRL_REST', lastTimePeriod: 12 }),
    { label: 'Current account balance', src: 'Eurostat', freq: 'Quarterly', ttl: 24 }),
  wages: Object.assign(es('lc_lci_r2_q', { nace_r2: 'B-S', lcstruct: 'D11', s_adj: 'SCA', unit: 'PCH_SM', sinceTimePeriod: '2019-Q1' }),
    { label: 'Wage growth (labour cost index)', src: 'Eurostat', freq: 'Quarterly', ttl: 24 }),
  hpi: Object.assign(es('prc_hpi_q', { purchase: 'TOTAL', unit: 'RCH_A', sinceTimePeriod: '2019-Q1' }),
    { label: 'House price growth', src: 'Eurostat', freq: 'Quarterly', ttl: 24 }),
  ppi: Object.assign(es('sts_inppd_m', { indic_bt: 'PRC_PRR_DOM', nace_r2: 'B-E36', s_adj: 'NSA', unit: 'PCH_SM', sinceTimePeriod: '2019-01' }),
    { label: 'Producer price inflation', src: 'Eurostat', freq: 'Monthly', ttl: 12 }),
  expect: Object.assign(es('ei_bsco_m', { indic: 'BS-PT-NY', s_adj: 'SA', unit: 'BAL', sinceTimePeriod: '2015-01' }),
    { label: 'Consumer price expectations', src: 'European Commission survey via Eurostat', freq: 'Monthly', ttl: 12 }),
  nrgdep: Object.assign(es('nrg_ind_id', { siec: 'TOTAL', lastTimePeriod: 3 }),
    { label: 'Energy import dependency', src: 'Eurostat', freq: 'Annual', ttl: 72 }),
  pop: Object.assign(es('demo_gind', { indic_de: 'JAN', lastTimePeriod: 2 }),
    { label: 'Population on 1 January', src: 'Eurostat', freq: 'Annual', ttl: 72 })
};
export const CORE_IDS = Object.keys(DATASETS).filter(function (k) { return DATASETS[k].core; });
export const ALL_IDS = Object.keys(DATASETS);

export function sourceUrl(id) {
  const d = DATASETS[id];
  if (d.kind === 'estat') return 'https://ec.europa.eu/eurostat/databrowser/view/' + d.code + '/default/table';
  if (d.kind === 'fx') return 'https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html';
  return 'https://www.ecb.europa.eu/stats/policy_and_exchange_rates/key_ecb_interest_rates/html/index.en.html';
}

function estatUrl(d) {
  const q = ['format=JSON', 'lang=EN'];
  Object.keys(d.params).forEach(function (k) {
    [].concat(d.params[k]).forEach(function (v) { q.push(k + '=' + encodeURIComponent(v)); });
  });
  GEO.forEach(function (g) { q.push('geo=' + g); });
  return ESTAT + d.code + '?' + q.join('&');
}

function getJson(url, ms) { return get(url, ms).then(function (r) { return r.json(); }); }
function getText(url, ms) { return get(url, ms).then(function (r) { return r.text(); }); }
function get(url, ms) {
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctl ? setTimeout(function () { ctl.abort(); }, ms || 30000) : 0;
  return fetch(url, ctl ? { signal: ctl.signal, cache: 'no-store' } : { cache: 'no-store' }).then(function (r) {
    clearTimeout(timer);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r;
  }, function (e) { clearTimeout(timer); throw e; });
}

// JSON-stat 2.0 -> { t: [periods], s: { 'KEY|GEO': [values aligned to t] }, upd }
export function parseJsonStat(j, keyDims) {
  const ids = j.id, size = j.size, n = ids.length, stride = new Array(n), codes = [];
  let acc = 1;
  for (let i = n - 1; i >= 0; i--) { stride[i] = acc; acc *= size[i]; }
  ids.forEach(function (dim, i) {
    const idx = j.dimension[dim].category.index, arr = new Array(size[i]);
    Object.keys(idx).forEach(function (k) { arr[idx[k]] = k; });
    codes.push(arr);
  });
  const ti = ids.indexOf('time'), gi = ids.indexOf('geo');
  const kis = keyDims.map(function (k) { return ids.indexOf(k); });
  const t = codes[ti], s = {};
  Object.keys(j.value).forEach(function (flat) {
    const v = j.value[flat];
    if (v === null || typeof v !== 'number') return;
    let rest = +flat;
    const pos = new Array(n);
    for (let i = 0; i < n; i++) { pos[i] = Math.floor(rest / stride[i]); rest -= pos[i] * stride[i]; }
    const key = kis.map(function (ki) { return codes[ki][pos[ki]]; }).concat([codes[gi][pos[gi]]]).join('|');
    if (!s[key]) { s[key] = new Array(t.length); for (let i = 0; i < t.length; i++) s[key][i] = null; }
    s[key][pos[ti]] = v;
  });
  return { t: t, s: normaliseGeo(s, t.length), upd: j.updated || '' };
}

// Fold the Eurostat aggregate codes into plain 'EU' and 'EA'.
function normaliseGeo(s, len) {
  const out = {};
  Object.keys(s).forEach(function (key) {
    const parts = key.split('|'), geo = parts.pop();
    if (geo === 'EU27_2020') out[parts.concat(['EU']).join('|')] = s[key];
    else if (geo.slice(0, 2) !== 'EA' || geo.length === 2 && CODES.indexOf(geo) >= 0) out[key] = s[key];
  });
  Object.keys(s).forEach(function (key) {
    const parts = key.split('|'), geo = parts.pop();
    if (geo !== 'EA21' && geo !== 'EA' && geo !== 'EA20') return;
    const k = parts.concat(['EA']).join('|');
    if (out[k]) return;
    const merged = new Array(len);
    for (let i = 0; i < len; i++) {
      merged[i] = null;
      ['EA21', 'EA', 'EA20'].some(function (g) {
        const a = s[parts.concat([g]).join('|')];
        if (a && a[i] !== null && a[i] !== undefined) { merged[i] = a[i]; return true; }
        return false;
      });
    }
    out[k] = merged;
  });
  return out;
}

function isoDaysAgo(days) { return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10); }

// Daily euro reference rates. Three independent routes, tried in turn.
function fetchFx() {
  const start = isoDaysAgo(760);
  return getJson(FRANK + start + '..?base=EUR&symbols=' + FX_CODES.join(','), 20000).then(function (j) {
    const t = Object.keys(j.rates).sort(), s = {};
    FX_CODES.forEach(function (c) { s[c] = t.map(function (d) { const v = j.rates[d][c]; return typeof v === 'number' ? v : null; }); });
    if (t.length < 50) throw new Error('short series');
    return { t: t, s: s, upd: t[t.length - 1], via: 'frankfurter.dev (ECB reference rates)' };
  }).catch(function () {
    return getText(ECB + 'EXR/D.' + FX_CODES.join('+') + '.EUR.SP00.A?startPeriod=' + start + '&format=csvdata&detail=dataonly', 30000).then(function (csv) {
      const rows = parseEcbCsv(csv), set = {}, by = {};
      rows.forEach(function (r) { set[r.t] = 1; (by[r.key] = by[r.key] || {})[r.t] = r.v; });
      const t = Object.keys(set).sort(), s = {};
      FX_CODES.forEach(function (c) { const m = by[c] || {}; s[c] = t.map(function (d) { return d in m ? m[d] : null; }); });
      if (t.length < 50) throw new Error('short series');
      return { t: t, s: s, upd: t[t.length - 1], via: 'ECB Data Portal' };
    });
  }).catch(function () {
    const d = es('ert_bil_eur_d', { statinfo: 'AVG', unit: 'NAC', currency: FX_CODES, sinceTimePeriod: start });
    const q = ['format=JSON'];
    Object.keys(d.params).forEach(function (k) { [].concat(d.params[k]).forEach(function (v) { q.push(k + '=' + v); }); });
    return getJson(ESTAT + d.code + '?' + q.join('&'), 40000).then(function (j) {
      const ids = j.id, ci = ids.indexOf('currency'), ti = ids.indexOf('time');
      const cur = [], tt = [];
      Object.keys(j.dimension.currency.category.index).forEach(function (k) { cur[j.dimension.currency.category.index[k]] = k; });
      Object.keys(j.dimension.time.category.index).forEach(function (k) { tt[j.dimension.time.category.index[k]] = k; });
      const s = {};
      cur.forEach(function (c) { s[c] = tt.map(function () { return null; }); });
      const nT = j.size[ti];
      Object.keys(j.value).forEach(function (f) { const i = +f; s[cur[Math.floor(i / nT) % j.size[ci]]][i % nT] = j.value[f]; });
      return { t: tt, s: s, upd: tt[tt.length - 1], via: 'Eurostat' };
    });
  });
}

function parseEcbCsv(csv) {
  const lines = csv.trim().split(/\r?\n/), head = lines[0].split(',');
  const ti = head.indexOf('TIME_PERIOD'), vi = head.indexOf('OBS_VALUE'), ci = head.indexOf('CURRENCY');
  return lines.slice(1).map(function (l) {
    const p = l.split(',');
    return { t: p[ti], v: parseFloat(p[vi]), key: ci >= 0 ? p[ci] : '' };
  }).filter(function (r) { return r.t && !isNaN(r.v); });
}

function fetchEcbRate() {
  return getText(ECB + 'FM/B.U2.EUR.4F.KR.DFR.LEV?startPeriod=2019-01-01&format=csvdata&detail=dataonly', 25000).then(function (csv) {
    const rows = parseEcbCsv(csv);
    if (!rows.length) throw new Error('empty');
    return { t: rows.map(function (r) { return r.t; }), s: { DFR: rows.map(function (r) { return r.v; }) }, upd: rows[rows.length - 1].t };
  });
}

// Fetch one dataset from its source. Resolves to the compact form or rejects.
export function fetchDataset(id) {
  const d = DATASETS[id];
  const p = d.kind === 'fx' ? fetchFx() : d.kind === 'ecb' ? fetchEcbRate()
    : getJson(estatUrl(d), 45000).then(function (j) {
      if (!j.value || !j.id) throw new Error('unexpected response');
      const out = parseJsonStat(j, d.key);
      if (!Object.keys(out.s).length) throw new Error('no observations');
      return out;
    });
  return p.then(function (o) { o.at = Date.now(); return o; });
}

export function isStale(id, entry) { return !entry || !entry.at || Date.now() - entry.at > DATASETS[id].ttl * HOUR; }
