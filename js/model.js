// Analytical engine: indicator snapshot, pressure diagnosis, short-horizon
// projection, policy simulator and currency calculators. Every coefficient used
// here is listed in ASSUMPTIONS and shown to the user on the Method page.
import { BY_CODE } from './countries.js';
import { DIVISIONS } from './data.js';

export function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
function lin(x, lo, hi) { return clamp((x - lo) / (hi - lo), 0, 1); }
function num(x) { return typeof x === 'number' && isFinite(x); }

// Latest non-empty observation of a series, optionally `back` periods earlier on the time axis.
export function latest(D, id, key, back) {
  const d = D[id];
  if (!d || !d.s[key]) return null;
  const a = d.s[key];
  for (let i = a.length - 1; i >= 0; i--) {
    if (num(a[i])) {
      const j = i - (back || 0);
      if (j < 0 || !num(a[j])) return null;
      return { v: a[j], t: d.t[j], i: j };
    }
  }
  return null;
}
export function val(D, id, key, back) { const o = latest(D, id, key, back); return o ? o.v : null; }
export function series(D, id, key) { return D[id] && D[id].s[key] ? D[id].s[key] : null; }

function meanLast(a, n) {
  if (!a) return null;
  const v = a.filter(num).slice(-n);
  return v.length ? v.reduce(function (x, y) { return x + y; }, 0) / v.length : null;
}

// Percentage move of `cur` against the euro over roughly `days` trading days (positive = currency weakened).
export function fxChange(D, cur, days) {
  const a = series(D, 'fx', cur);
  if (!a) return null;
  const v = a.filter(num);
  if (v.length < days + 1) return null;
  return (v[v.length - 1] / v[v.length - 1 - days] - 1) * 100;
}
// Annualised volatility of daily log changes over the last `days` observations, in percent.
export function fxVol(arr, days) {
  if (!arr) return null;
  const v = arr.filter(num).slice(-(days + 1));
  if (v.length < 20) return null;
  const r = [];
  for (let i = 1; i < v.length; i++) r.push(Math.log(v[i] / v[i - 1]));
  const m = r.reduce(function (x, y) { return x + y; }, 0) / r.length;
  const s2 = r.reduce(function (x, y) { return x + (y - m) * (y - m); }, 0) / (r.length - 1);
  return Math.sqrt(s2 * 252) * 100;
}

export function weights(D, c) {
  const w = {};
  DIVISIONS.concat(['FOOD', 'NRG', 'SERV', 'IGD_NNRG', 'CP041']).forEach(function (k) {
    let x = val(D, 'hicpw', k + '|' + c);
    if (!num(x)) x = val(D, 'hicpw', k + '|EU');
    w[k] = num(x) ? x / 1000 : 0;
  });
  return w;
}

// Everything the tool knows about one geography, drawn from the live store.
export function snapshot(D, c) {
  const meta = BY_CODE[c] || {};
  const h = function (k, back) { return val(D, 'hicp', k + '|' + c, back); };
  const s = {
    c: c, meta: meta,
    pi: h('TOTAL'), piT: (latest(D, 'hicp', 'TOTAL|' + c) || {}).t || '', pi3: h('TOTAL', 3), pi12: h('TOTAL', 12),
    core: h('TOT_X_NRG_FOOD'), food: h('FOOD'), nrg: h('NRG'), serv: h('SERV'), goods: h('IGD_NNRG'),
    une: val(D, 'une', c), gdp: val(D, 'gdpq', c), wage: val(D, 'wages', c), hpi: val(D, 'hpi', c), ppi: val(D, 'ppi', c),
    rent: val(D, 'hicpd', 'CP041|' + c), admin: val(D, 'hicpd', 'AP|' + c),
    debt: val(D, 'fiscal', 'GD|' + c), bal: val(D, 'fiscal', 'B9|' + c),
    gdpEur: val(D, 'gdpa', 'CP_MEUR|B1GQ|' + c), xGdp: val(D, 'gdpa', 'PC_GDP|P6|' + c), mGdp: val(D, 'gdpa', 'PC_GDP|P7|' + c),
    cGdp: val(D, 'gdpa', 'PC_GDP|P31_S14_S15|' + c), pop: val(D, 'pop', c), nrgdep: val(D, 'nrgdep', c),
    ca: meanLast(series(D, 'ca', c), 4), w: weights(D, c)
  };
  const x1 = val(D, 'gdpa', 'CP_MEUR|P6|' + c), x0 = val(D, 'gdpa', 'CP_MEUR|P6|' + c, 1);
  s.xGrowth = num(x1) && num(x0) && x0 ? (x1 / x0 - 1) * 100 : null;
  const une = series(D, 'une', c);
  s.uneAvg = meanLast(une, 60);
  const ex = series(D, 'expect', c);
  if (ex) {
    const v = ex.filter(num), m = v.reduce(function (a, b) { return a + b; }, 0) / (v.length || 1);
    const sd = Math.sqrt(v.reduce(function (a, b) { return a + (b - m) * (b - m); }, 0) / Math.max(1, v.length - 1));
    s.exp = v.length ? v[v.length - 1] : null;
    s.expZ = v.length > 12 && sd ? (v[v.length - 1] - m) / sd : null;
  }
  const cur = meta.euro || meta.agg ? 'USD' : meta.cur;
  s.fxCur = cur;
  s.fxRate = val(D, 'fx', cur);
  s.fx12 = fxChange(D, cur, 252);
  s.fxVol = fxVol(series(D, 'fx', cur), 90);
  return s;
}

export const PRESSURES = [
  { k: 'dem', n: 'Demand-pull', d: 'Spending running ahead of what the economy can supply: core and services inflation, growth and a tight labour market.' },
  { k: 'cost', n: 'Cost-push', d: 'Rising input costs passed on to consumers: energy, producer prices and food.' },
  { k: 'imp', n: 'Imported & exchange-rate', d: 'Price pressure arriving from abroad through a weaker currency, energy import dependence and import prices.' },
  { k: 'wage', n: 'Wage–price', d: 'Pay growth above what the 2% target plus productivity can absorb, feeding services prices.' },
  { k: 'hou', n: 'Housing', d: 'Rents and house prices pulling the cost of living up.' },
  { k: 'exp', n: 'Expectations', d: 'Households expecting faster price rises than usual, which can become self-fulfilling.' }
];

function blend(parts) {
  let w = 0, x = 0;
  parts.forEach(function (p) { if (num(p[1])) { w += p[0]; x += p[0] * p[1]; } });
  return w ? Math.round(100 * x / w) : null;
}

export function diagnose(s) {
  const gap = num(s.une) && num(s.uneAvg) ? s.uneAvg - s.une : null;
  const n = function (x, lo, hi) { return num(x) ? lin(x, lo, hi) : null; };
  const mul = function (a, b) { return num(a) && num(b) ? a * b : null; };
  const p = {
    dem: blend([[0.40, n(s.core, 2, 6)], [0.25, n(s.serv, 2.5, 7)], [0.20, n(s.gdp, 1, 4)], [0.15, n(gap, 0, 2)]]),
    cost: blend([[0.40, n(s.nrg, 2, 20)], [0.30, n(s.ppi, 2, 15)], [0.30, n(s.food, 2, 10)]]),
    imp: blend([[0.35, n(s.fx12, 0, 10)], [0.35, mul(n(s.nrgdep, 30, 90), n(s.nrg, 2, 20))], [0.30, mul(n(s.mGdp, 30, 90), n(s.ppi, 2, 15))]]),
    wage: blend([[0.60, n(num(s.wage) ? s.wage - 3 : null, 0, 6)], [0.40, n(s.serv, 2.5, 7)]]),
    hou: blend([[0.50, n(s.rent, 2, 8)], [0.50, n(s.hpi, 3, 12)]]),
    exp: blend([[1, n(s.expZ, 0, 2)]])
  };
  const wts = { dem: 0.25, cost: 0.25, imp: 0.15, wage: 0.15, hou: 0.10, exp: 0.10 };
  let tw = 0, tx = 0, top = null;
  Object.keys(p).forEach(function (k) {
    if (p[k] === null) return;
    tw += wts[k]; tx += wts[k] * p[k];
    if (!top || p[k] > p[top]) top = k;
  });
  return { p: p, heat: tw ? Math.round(tx / tw) : null, top: top, regime: regime(s.pi) };
}

export function regime(pi) {
  if (!num(pi)) return { k: 'na', n: 'No data', tone: 'mute' };
  if (pi < 0) return { k: 'defl', n: 'Falling prices', tone: 'cool' };
  if (pi < 1.5) return { k: 'low', n: 'Below target', tone: 'cool' };
  if (pi <= 2.5) return { k: 'ok', n: 'Near the 2% target', tone: 'good' };
  if (pi <= 4) return { k: 'elev', n: 'Elevated', tone: 'warn' };
  if (pi <= 7) return { k: 'high', n: 'High', tone: 'serious' };
  return { k: 'vhigh', n: 'Very high', tone: 'crit' };
}

export function level(score) { return score === null ? 'n/a' : score >= 66 ? 'High' : score >= 33 ? 'Moderate' : 'Low'; }

// --- Short-horizon projection ------------------------------------------------
// A deliberately simple, fully disclosed rule: recent momentum that fades, plus a
// slow pull towards 2%. The band is this rule's own past error for the country.
const DECAY = 0.7, PULL = 0.03, H = 6;
function step(a, i) {
  const out = [];
  const m = (a[i] - a[i - 3]) / 3;
  let x = a[i];
  for (let k = 1; k <= H; k++) { x = x + m * Math.pow(DECAY, k) - PULL * (x - 2); out.push(x); }
  return out;
}
export function project(arr) {
  if (!arr) return null;
  let end = arr.length - 1;
  while (end >= 0 && !num(arr[end])) end--;
  if (end < 12 || !num(arr[end - 3])) return null;
  const path = step(arr, end);
  const errs = [[], [], [], [], [], []];
  for (let i = Math.max(3, end - 66); i <= end - 1; i++) {
    if (!num(arr[i]) || !num(arr[i - 3])) continue;
    const f = step(arr, i);
    for (let k = 1; k <= H; k++) {
      if (i + k <= end && num(arr[i + k])) errs[k - 1].push(Math.abs(f[k - 1] - arr[i + k]));
    }
  }
  // Typical miss at each horizon: the median absolute error, scaled to be comparable with a standard deviation.
  const rmse = errs.map(function (e, k) {
    if (e.length < 7) return 0.3 * Math.sqrt(k + 1);
    e.sort(function (a, b) { return a - b; });
    return 1.4826 * e[Math.floor(e.length / 2)];
  });
  const d = path[H - 1] - arr[end];
  return { end: end, path: path, rmse: rmse, dir: d > 0.3 ? 'Rising' : d < -0.3 ? 'Easing' : 'Broadly stable', delta: d };
}

// --- Personal inflation ------------------------------------------------------
export const BUDGET = [
  { k: 'CP01', n: 'Food & drinks' }, { k: 'CP04', n: 'Housing & energy' }, { k: 'CP07', n: 'Transport' },
  { k: 'CP11', n: 'Eating out & hotels' }, { k: 'CP09', n: 'Leisure & culture' }, { k: 'CP06', n: 'Health' },
  { k: 'CP03', n: 'Clothing' }, { k: 'CP05', n: 'Household goods' }, { k: 'CP08', n: 'Phone & internet' },
  { k: 'CP02', n: 'Alcohol & tobacco' }, { k: 'CP10', n: 'Education' }, { k: 'CP12', n: 'Insurance & finance' }, { k: 'CP13', n: 'Personal care & other' }
];
export function personal(D, c, shares) {
  let tot = 0, x = 0;
  const rows = BUDGET.map(function (b) {
    const r = val(D, 'hicpd', b.k + '|' + c), sh = shares[b.k] || 0;
    if (num(r)) { tot += sh; x += sh * r; }
    return { k: b.k, n: b.n, rate: r, share: sh };
  });
  rows.forEach(function (r) { r.contrib = num(r.rate) && tot ? r.share * r.rate / tot : null; });
  return { rate: tot ? x / tot : null, rows: rows };
}

// --- Policy simulator --------------------------------------------------------
export const ASSUMPTIONS = [
  ['VAT cut pass-through to shelf prices', '0.60', '0.30 – 0.90', 'Cuts are passed on less fully than increases.'],
  ['VAT / excise increase pass-through', '0.80', '0.60 – 1.00', ''],
  ['Energy support pass-through to consumer bills', '1.00', '0.80 – 1.00', 'Applied only to energy inflation above 5%.'],
  ['Inflation response to a demand change of 1% of GDP', '0.15 pp', '0.05 – 0.30 pp', 'First-year effect; flatter or steeper Phillips curve at the ends of the range.'],
  ['Share of a targeted transfer that is spent', '0.70', '—', 'Low-income households spend most of an extra euro.'],
  ['Share of retail-bond purchases diverted from spending', '0.40', '—', 'The rest replaces other saving.'],
  ['Strategic stock release: staple price effect per 1% of annual use released', '−0.8%', '−0.3% – −1.5%', 'Applied to 30% of the food and energy basket.'],
  ['Supply-side incentives: first-year price effect per 1% of GDP', '−0.10 pp', '0 – −0.25 pp', 'Most of the effect arrives after the first year.'],
  ['Wage indexation second-round effect', '0.15', '0.05 – 0.30', 'Share of above-target inflation fed back per unit of coverage.'],
  ['Policy rate: inflation effect per +100 basis points', '−0.30 pp', '−0.10 – −0.50 pp', 'Peak effect after 12–24 months.'],
  ['Policy rate: GDP effect per +100 basis points', '−0.40%', '−0.20 – −0.60%', ''],
  ['Low-income households (bottom 30%) share of consumption', '15%', '—', 'Used to express transfers as a share of their spending.']
];

export const LEVERS = [
  { k: 'vatFood', n: 'Cut VAT on food essentials', unit: 'pp', max: 10, step: 0.5, grp: 'Prices',
    d: 'Lower the VAT rate on basic foodstuffs.', law: 'Allowed: the VAT Directive (as amended by Directive (EU) 2022/542) permits reduced and zero rates on foodstuffs.' },
  { k: 'energy', n: 'Absorb energy price growth above 5%', unit: '%', max: 100, step: 5, grp: 'Prices',
    d: 'The state covers this share of energy price growth above 5% a year, through a bill cap or rebate.', law: 'Design within State-aid rules and keep an incentive to save energy; target vulnerable users where possible.' },
  { k: 'rent', n: 'Limit annual rent increases', unit: '% cap', max: 8, step: 0.5, off: 8, invert: true, grp: 'Prices',
    d: 'Rents may rise by at most this much a year. 8% means no cap.', law: 'National competence. Tight caps can reduce rental supply over time.' },
  { k: 'reserve', n: 'Release strategic stocks', unit: '% of use', max: 10, step: 0.5, grp: 'Supply',
    d: 'Release food and energy reserves equal to this share of annual consumption.', law: 'Oil stocks are governed by Directive 2009/119/EC. Restricting exports to other member states is barred by Article 35 TFEU.' },
  { k: 'supply', n: 'Supply-side incentives', unit: '% GDP', max: 1.5, step: 0.1, grp: 'Supply',
    d: 'Incentives for producers that expand output or cut resource use in food, energy and housing.', law: 'Notify under State-aid rules unless covered by a block exemption.' },
  { k: 'transfer', n: 'Targeted relief to low-income households', unit: '% GDP', max: 2, step: 0.1, grp: 'Households',
    d: 'Payments restricted to the bottom 30% of households.', law: 'Counts towards the net-expenditure path under Regulation (EU) 2024/1263.' },
  { k: 'bonds', n: 'Inflation-linked retail savings bonds', unit: '% GDP', max: 2, step: 0.1, grp: 'Households',
    d: 'Household take-up of government bonds whose return tracks inflation.', law: 'National debt-management decision. Indexation cost rises with inflation.' },
  { k: 'wageIdx', n: 'Automatic wage indexation coverage', unit: '% of pay', max: 100, step: 5, grp: 'Households',
    d: 'Share of the wage bill that rises automatically with inflation.', law: 'Social partners’ and national competence. Belgium, Luxembourg, Malta and Cyprus run such systems.' },
  { k: 'vatLux', n: 'Raise consumption tax on non-essentials', unit: 'pp', max: 5, step: 0.5, grp: 'Revenue',
    d: 'Higher tax on clothing, leisure and restaurants; helps fund relief.', law: 'The VAT Directive allows only one standard rate, so a separate luxury rate is not available: move items out of reduced rates or use excise duties.' },
  { k: 'rate', n: 'Change the policy interest rate', unit: 'bp', min: -200, max: 200, step: 25, grp: 'Monetary',
    d: 'Tighten or loosen monetary policy.', law: 'Decided independently by the central bank (Article 130 TFEU). In the euro area this is the ECB, for all members at once.' }
];

export function simulate(s, L) {
  const w = s.w, c = (num(s.cGdp) ? s.cGdp : 52) / 100, pi = num(s.pi) ? s.pi : 2;
  const rows = [], flags = [];
  const add = function (k, lo, mid, hi, cost, gdp, note) {
    rows.push({ k: k, lo: Math.min(lo, hi), mid: mid, hi: Math.max(lo, hi), cost: cost, gdp: gdp || 0, note: note || '' });
  };
  const nonEss = w.CP03 + w.CP09 + w.CP11;
  if (L.vatFood) add('vatFood', -L.vatFood * w.CP01 * 0.3, -L.vatFood * w.CP01 * 0.6, -L.vatFood * w.CP01 * 0.9, L.vatFood * w.CP01 * c, 0,
    'Food is ' + (w.CP01 * 100).toFixed(1) + '% of the basket.');
  if (L.energy) {
    const bind = Math.max(0, (num(s.nrg) ? s.nrg : 0) - 5) * L.energy / 100;
    add('energy', -w.NRG * bind * 0.8, -w.NRG * bind, -w.NRG * bind, w.NRG * bind * c, 0,
      bind > 0 ? 'Energy inflation is ' + s.nrg.toFixed(1) + '%; ' + bind.toFixed(1) + ' points absorbed.' : 'Not binding: energy inflation is at or below 5%.');
  }
  if (num(L.rent) && L.rent < 8) {
    const bind = Math.max(0, (num(s.rent) ? s.rent : 0) - L.rent);
    add('rent', -w.CP041 * bind, -w.CP041 * bind, -w.CP041 * bind, 0, 0,
      bind > 0 ? 'Rents are rising ' + s.rent.toFixed(1) + '%; the cap removes ' + bind.toFixed(1) + ' points.' : 'Not binding: rents are rising more slowly than the cap.');
    if (bind > 2) flags.push('A rent cap this far below market growth risks shrinking rental supply.');
  }
  if (L.reserve) {
    const base = 0.3 * (w.FOOD + w.NRG);
    add('reserve', -L.reserve * 0.3 * base, -L.reserve * 0.8 * base, -L.reserve * 1.5 * base, L.reserve * 0.02, 0, 'Temporary: stocks must be rebuilt later.');
  }
  if (L.supply) add('supply', L.supply * 0.5 * 0.05, L.supply * (0.5 * 0.15 - 0.10), L.supply * (0.5 * 0.30 - 0.25) , L.supply, 0.3 * L.supply, 'Main effect arrives in years two and three.');
  if (L.transfer) {
    add('transfer', L.transfer * 0.7 * 0.05, L.transfer * 0.7 * 0.15, L.transfer * 0.7 * 0.30, L.transfer, 0.5 * L.transfer,
      'Equals ' + (L.transfer / (0.15 * c * 100) * 100).toFixed(1) + '% of low-income households’ annual spending.');
  }
  if (L.bonds) add('bonds', -L.bonds * 0.4 * 0.30, -L.bonds * 0.4 * 0.15, -L.bonds * 0.4 * 0.05, L.bonds * Math.max(0, pi - 2) / 100, -0.2 * L.bonds, 'Savers keep their purchasing power.');
  if (L.wageIdx) {
    const gap = Math.max(0, pi - 2) * L.wageIdx / 100;
    add('wageIdx', gap * 0.05, gap * 0.15, gap * 0.30, 0, 0, 'Protects real pay but slows the return to target.');
    if (L.wageIdx >= 50 && pi > 4) flags.push('Broad wage indexation with inflation above 4% raises the risk of a wage–price spiral.');
  }
  if (L.vatLux) add('vatLux', L.vatLux * nonEss * 0.6, L.vatLux * nonEss * 0.8, L.vatLux * nonEss, -L.vatLux * nonEss * c * 0.9, -0.3 * L.vatLux * nonEss * c,
    'Raises the measured index mechanically while cooling discretionary demand.');
  if (L.rate) {
    const r = L.rate / 100;
    add('rate', -0.5 * r, -0.3 * r, -0.1 * r, 0, -0.4 * r, s.meta.euro || s.meta.agg ? 'Set by the ECB for the whole euro area — not a national lever.' : 'Set by the national central bank.');
  }
  const sum = function (f) { return rows.reduce(function (a, r) { return a + r[f]; }, 0); };
  const cost = sum('cost'), bal = num(s.bal) ? s.bal - cost : null;
  if (bal !== null && bal < -3 && cost > 0.05) flags.push('The package takes the government balance to ' + bal.toFixed(1) + '% of GDP, beyond the 3% Treaty reference value.');
  if (num(s.debt) && s.debt > 60 && cost > 0.5) flags.push('Public debt is ' + s.debt.toFixed(0) + '% of GDP, above the 60% reference value; fund the package with offsetting revenue.');
  if (L.energy >= 80 && L.transfer < 0.2) flags.push('Untargeted energy support is costly and weakens the incentive to save energy; consider shifting part to targeted relief.');
  return {
    rows: rows, flags: flags, lo: sum('lo'), mid: sum('mid'), hi: sum('hi'), cost: cost, gdp: sum('gdp'), bal: bal,
    costEur: num(s.gdpEur) ? cost / 100 * s.gdpEur : null, pi: pi
  };
}

// --- Currency calculators ----------------------------------------------------
export function exportBond(a) {
  const bonus = Math.max(0, Math.floor(a.growth / a.per)) * a.bonus;
  const y = Math.min(a.base + bonus, a.cap);
  return { yield: y, bonus: y - a.base, annual: a.size * y / 100, extra: a.size * (y - a.base) / 100 };
}
export function fxLock(a) {
  const mkt = a.spot * (1 + a.move / 100);
  const locked = a.bill * a.lock, open = a.bill * mkt;
  return { market: mkt, locked: locked, open: open, saving: open - locked, pct: locked ? (open - locked) / locked * 100 : 0 };
}
export function voucher(a) {
  const kept = a.exports * a.share / 100, converted = a.exports - kept;
  const covered = Math.min(kept, a.imports);
  return { kept: kept, converted: converted, covered: covered, net: converted - (a.imports - covered), gross: a.exports + a.imports, grossAfter: converted + a.imports - covered };
}
// Volatility of a weighted basket of currencies against the euro versus its members.
export function basket(D, ws) {
  const keys = Object.keys(ws).filter(function (k) { return ws[k] > 0 && series(D, 'fx', k); });
  const tot = keys.reduce(function (a, k) { return a + ws[k]; }, 0);
  if (!keys.length || !tot) return null;
  const n = D.fx.t.length, idx = [];
  for (let i = Math.max(1, n - 253); i < n; i++) {
    if (keys.every(function (k) { return num(D.fx.s[k][i]) && num(D.fx.s[k][i - 1]); })) idx.push(i);
  }
  if (idx.length < 30) return null;
  const level = [100];
  idx.forEach(function (i) {
    let r = 0;
    keys.forEach(function (k) { r += ws[k] / tot * Math.log(D.fx.s[k][i - 1] / D.fx.s[k][i]); });
    level.push(level[level.length - 1] * Math.exp(r));
  });
  const parts = keys.map(function (k) { return { k: k, w: ws[k] / tot, vol: fxVol(D.fx.s[k], 252) }; });
  const avg = parts.reduce(function (a, p) { return a + p.w * p.vol; }, 0);
  const vol = fxVol(level, 252);
  return { vol: vol, avg: avg, parts: parts, level: level, t: [D.fx.t[idx[0] - 1]].concat(idx.map(function (i) { return D.fx.t[i]; })), gain: avg ? (1 - vol / avg) * 100 : 0 };
}
