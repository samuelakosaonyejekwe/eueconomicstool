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

// A quote is "units of cur per euro". For a member with its own currency a rise means that
// currency lost value; for the euro (quoted in dollars) a rise means the euro gained value.
export function homeLoss(move, own) { return num(move) ? (own ? move : (1 / (1 + move / 100) - 1) * 100) : null; }
export const WAGE_NORM = 3; // pay growth consistent with 2% inflation plus about 1% productivity growth

// Percentage move of the `cur`-per-euro quote over roughly `days` trading days.
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
  s.own = !meta.euro && !meta.agg;
  s.fxRate = val(D, 'fx', cur);
  s.fxVol = fxVol(series(D, 'fx', cur), 90);
  // dep12 / dep1: percentage fall in the value of the home currency (positive = weaker).
  // Non-euro members are measured against the euro, euro members against the US dollar.
  s.dep12 = homeLoss(fxChange(D, cur, 252), s.own);
  s.dep1 = homeLoss(fxChange(D, cur, 21), s.own);
  s.uneGap = num(s.une) && num(s.uneAvg) ? s.uneAvg - s.une : null;
  s.wageGap = num(s.wage) ? s.wage - WAGE_NORM : null;
  // Category detail is published later than the headline flash estimate, so keep the
  // headline for the same month as the category data for like-for-like comparisons.
  const dv = latest(D, 'hicpd', 'CP01|' + c);
  s.divT = dv ? dv.t : '';
  const hi = D.hicp && dv ? D.hicp.t.indexOf(dv.t) : -1, tot = series(D, 'hicp', 'TOTAL|' + c);
  s.piDiv = hi >= 0 && tot && num(tot[hi]) ? tot[hi] : null;
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

// Gauge definitions: the single source for both the calculation and the Method page.
// Each term is [weight, [[indicator, value scoring 0, value scoring 100, label, unit], ...]];
// a term with two indicators scores their product.
export const GAUGES = {
  dem: [[0.40, [['core', 2, 6, 'core inflation', '%']]], [0.25, [['serv', 2.5, 7, 'services inflation', '%']]], [0.20, [['gdp', 1, 4, 'real GDP growth', '%']]],
    [0.15, [['uneGap', 0, 2, 'unemployment below its five-year average', ' points']]]],
  cost: [[0.40, [['nrg', 2, 20, 'energy inflation', '%']]], [0.30, [['ppi', 2, 15, 'producer price inflation', '%']]], [0.30, [['food', 2, 10, 'food inflation', '%']]]],
  imp: [[0.35, [['dep12', 0, 10, 'twelve-month fall in the home currency', '%']]],
    [0.35, [['nrgdep', 30, 90, 'energy import dependency', '%'], ['nrg', 2, 20, 'energy inflation', '%']]],
    [0.30, [['mGdp', 30, 90, 'imports as a share of GDP', '%'], ['ppi', 2, 15, 'producer price inflation', '%']]]],
  wage: [[0.60, [['wageGap', 0, 6, 'wage growth above ' + WAGE_NORM + '%', ' points']]], [0.40, [['serv', 2.5, 7, 'services inflation', '%']]]],
  hou: [[0.50, [['rent', 2, 8, 'rent inflation', '%']]], [0.50, [['hpi', 3, 12, 'house price growth', '%']]]],
  exp: [[1, [['expZ', 0, 2, 'household price expectations above their own average since 2015', ' standard deviations']]]]
};
export const HEAT_WEIGHTS = { dem: 0.25, cost: 0.25, imp: 0.15, wage: 0.15, hou: 0.10, exp: 0.10 };
export const BANDS = [33, 66]; // below the first: Low; from the second: High

export function diagnose(s) {
  const p = {};
  Object.keys(GAUGES).forEach(function (k) {
    let w = 0, x = 0;
    GAUGES[k].forEach(function (term) {
      let v = 1;
      term[1].forEach(function (f) { v = v === null || !num(s[f[0]]) ? null : v * lin(s[f[0]], f[1], f[2]); });
      if (v !== null) { w += term[0]; x += term[0] * v; }
    });
    p[k] = w ? Math.round(100 * x / w) : null; // missing indicators: remaining weights are rescaled
  });
  let tw = 0, tx = 0, top = null;
  Object.keys(p).forEach(function (k) {
    if (p[k] === null) return;
    tw += HEAT_WEIGHTS[k]; tx += HEAT_WEIGHTS[k] * p[k];
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

export function level(score) { return score === null ? 'n/a' : score >= BANDS[1] ? 'High' : score >= BANDS[0] ? 'Moderate' : 'Low'; }

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
// Every coefficient lives in K. simulate() reads it and the Method page prints it,
// so the published assumptions cannot drift from the calculation. Triples are
// [low, central, high].
export const K = {
  vatCut: [0.45, 0.75, 1.00], taxRise: [0.35, 0.80, 1.00], energyPass: [0.50, 0.85, 1.00], energyFloor: 5,
  demand: [0.03, 0.10, 0.30], spendTransfer: 0.55, bondDivert: 0.05,
  reserve: [0.1, 0.8, 1.5], reserveBase: 0.30, reserveCarry: 0.02,
  supply: [0, 0, 0.10], supplyDemand: 0.50, wage: [0.05, 0.15, 0.30],
  rate: [0.10, 0.30, 0.70], rateGdp: [0.20, 0.40, 0.80],
  lowShare: 0.20, gdpTransfer: 0.6, gdpSupply: 0.8, gdpBonds: 0.05, gdpTax: 0.3, consumptionDefault: 53
};
const f2 = function (x) { return x.toFixed(2); };
const rng = function (t, unit, sign) { return (sign || '') + f2(t[0]) + ' – ' + (sign || '') + f2(t[2]) + (unit || ''); };
// Each row: [assumption, central value, range used, what the evidence says]. The published
// studies behind each row are attached from EVIDENCE below.
export const ASSUMPTIONS = [
  ['Food VAT cut: share passed on to shelf prices', f2(K.vatCut[1]), rng(K.vatCut), 'Food VAT cuts in 2020–23 were largely passed on: about 70% in German supermarkets, almost fully in Spain and Portugal, and 44–58% at first in Poland, rising to about 95% within five months.'],
  ['Consumption-tax increase: share passed on', f2(K.taxRise[1]), rng(K.taxRise), 'Standard-rate rises are passed on almost fully; reduced-rate changes and reversals of temporary cuts much less (about 30–50%).'],
  ['Energy support: share reaching consumer bills', f2(K.energyPass[1]), rng(K.energyPass), 'Direct bill discounts and regulated caps pass through fully; tax-based support 75–100%. The threshold of ' + K.energyFloor + '% is a design choice of this tool. The price effect reverses when support ends: ECB staff put euro-area measures at −1.1 pp on inflation in 2022 and +0.7 pp in 2024.'],
  ['Inflation response to a demand change of 1% of GDP', f2(K.demand[1]) + ' pp', rng(K.demand, ' pp'), 'First-year effect. ECB models give about 0.07 pp after two years for spending of 1% of GDP; the top of the range is the high-inflation case.'],
  ['Share of a targeted transfer that is spent', f2(K.spendTransfer), '—', 'Euro-area surveys put the share spent at about 0.46 on average and about 0.59 for households with the least cash on hand. Range in the literature 0.40–0.80.'],
  ['Share of retail-bond purchases diverted from spending', f2(K.bondDivert), '—', 'An assumption: no study measures it. Belgian and Italian retail issues in 2022–24 were financed almost entirely from bank deposits, not from spending. Plausible range 0–0.20.'],
  ['Strategic stock release: staple price fall per 1% of annual use released', f2(K.reserve[1]) + '%', rng(K.reserve, '%'), 'A placeholder with a wide range: the only quantified episode is the 2022 coordinated oil release, itself based on assumed elasticities. One country acting alone moves prices far less. Applied to ' + Math.round(K.reserveBase * 100) + '% of the food and energy basket; lasts only while the release continues. Carrying cost ' + f2(K.reserveCarry) + '% of GDP per 1% released.'],
  ['Supply-side incentives: first-year price fall per 1% of GDP', f2(K.supply[1]) + ' pp', rng(K.supply, ' pp'), 'ECB modelling of public investment and reforms finds no price fall in the first year; the supply benefit arrives later. Half of the outlay adds to demand in year one.'],
  ['Wage indexation second-round effect', f2(K.wage[1]), rng(K.wage), 'Not estimated directly; consistent with ECB findings that wages pass about 50% into producer prices over three years. Automatic indexation covers only about 3% of euro-area private-sector employees.'],
  ['Policy rate: inflation fall per +100 basis points', f2(K.rate[1]) + ' pp', rng(K.rate, ' pp'), 'A peak effect after 12–18 months, so the first-year effect is smaller. Derived from ECB staff estimates of the 2021–23 tightening.'],
  ['Policy rate: GDP fall per +100 basis points', f2(K.rateGdp[1]) + '%', rng(K.rateGdp, '%'), 'ECB staff estimates; output responds earlier than inflation.'],
  ['Low-income households (bottom 30%) share of consumption', Math.round(K.lowShare * 100) + '%', '—', 'Eurostat: the lowest income fifth accounts for 12.0% of household consumption in the EU and the second fifth for 16.0%.'],
  ['First-year GDP effect per 1% of GDP: targeted transfers / supply incentives', '+' + f2(K.gdpTransfer) + '% / +' + f2(K.gdpSupply) + '%', '—', 'European Commission model: 0.66–0.89 for transfers targeted at cash-constrained households, about 0.9–1.1 for public investment.'],
  ['First-year GDP effect per 1% of GDP: bond take-up / higher consumption tax', '−' + f2(K.gdpBonds) + '% / −' + f2(K.gdpTax) + '%', '—', 'Consumption-tax multipliers of 0.0–0.5 across fifteen European central bank models. The bond effect follows from the small share diverted from spending.'],
  ['Household consumption as a share of GDP when not published', K.consumptionDefault + '%', '—', 'EU average in 2025: 52.8%. Otherwise the country’s own figure from Eurostat is used.']
];
// Published studies and official statistics behind each assumption, in the same order.
export const EVIDENCE = [
 [
  [
   "Fuest, Neumeier, Stöhlker, The pass-through of temporary VAT rate cuts: evidence from German supermarket retail, International Tax and Public Finance, 2024",
   "https://link.springer.com/article/10.1007/s10797-023-09824-7"
  ],
  [
   "Banco de España, Documento de Trabajo 2417, Analysing the VAT cut pass-through in Spain using web-scraped supermarket data and machine learning, 2024",
   "https://www.bde.es/f/webbe/SES/Secciones/Publicaciones/PublicacionesSeriadas/DocumentosTrabajo/24/Files/dt2417e.pdf"
  ],
  [
   "Cutting VAT rate on food products in a high-inflation environment. Does it work out? (Poland 2022), Food Policy, 2025",
   "https://www.sciencedirect.com/science/article/pii/S030691922500020X"
  ]
 ],
 [
  [
   "Benedek, De Mooij, Keen, Wingender, Estimating VAT Pass Through, IMF Working Paper 15/214, 2015",
   "https://www.imf.org/external/pubs/cat/longres.aspx?sk=43322.0"
  ],
  [
   "Benzarti, Carloni, Harju, Kosonen, What Goes Up May Not Come Down: Asymmetric Incidence of Value-Added Taxes, NBER Working Paper 23849, 2017",
   "https://www.nber.org/system/files/working_papers/w23849/w23849.pdf"
  ],
  [
   "Fuest, Neumeier, Stöhlker, The pass-through of temporary VAT rate cuts: evidence from German supermarket retail, 2024",
   "https://link.springer.com/article/10.1007/s10797-023-09824-7"
  ]
 ],
 [
  [
   "ECB Economic Bulletin 1/2023, box on climate-related fiscal measures in the staff projections (reports the -1.1 pp / -0.5 pp / +0.7 pp / +0.4 pp HICP effect of energy compensation measures)",
   "https://www.ecb.europa.eu/pub/economic-bulletin/focus/2023/html/ecb.ebbox202301_05~d8e33ee7ac.en.html"
  ],
  [
   "Bańkowski, Bouabdallah, Checherita-Westphal, Freier, Jacquinot, Muggenthaler, Fiscal policy and high inflation, ECB Economic Bulletin 2/2023",
   "https://www.ecb.europa.eu/press/economic-bulletin/articles/2023/html/ecb.ebart202302_01~2bd46eff8f.en.html"
  ],
  [
   "Dovern et al., Estimating pass-through rates for the 2022 tax reduction on fuel prices in Germany, Energy Economics, 2023",
   "https://www.sciencedirect.com/science/article/abs/pii/S0140988323004462"
  ]
 ],
 [
  [
   "ECB Economic Bulletin 6/2025, Macroeconomic impacts of higher defence spending: a model-based assessment",
   "https://www.ecb.europa.eu/press/economic-bulletin/articles/2025/html/ecb.ebart202506_01~d41c118e13.en.html"
  ],
  [
   "Eser, Karadi, Lane, Moretti, Osbat, The Phillips Curve at the ECB, ECB Working Paper 2400, 2020",
   "https://www.ecb.europa.eu/pub/pdf/scpwps/ecb.wp2400~6e8bfb6fd2.en.pdf"
  ],
  [
   "Dao, Dizioli, Jackson, Gourinchas, Leigh, Unconventional Fiscal Policy in Times of High Inflation, IMF Working Paper 2023/178",
   "https://www.imf.org/en/publications/wp/issues/2023/08/31/unconventional-fiscal-policy-in-times-of-high-inflation-537454"
  ]
 ],
 [
  [
   "Albacete, Fessler, Pekanov, The role of MPC heterogeneity for fiscal and monetary policy in the euro area, SUERF Policy Brief 965, 2024",
   "https://www.suerf.org/publications/suerf-policy-notes-and-briefs/the-role-of-mpc-heterogeneity-for-fiscal-and-monetary-policy-in-the-euro-area/"
  ],
  [
   "Drescher, Fessler, Lindner, Helicopter money in Europe: New evidence on the marginal propensity to consume across European households, Economics Letters, 2020",
   "https://www.sciencedirect.com/science/article/abs/pii/S0165176520302603"
  ],
  [
   "Roeger and in 't Veld, Fiscal stimulus and exit strategies in the EU: a model-based analysis, European Economy Economic Papers 426, 2010 (Table 2)",
   "https://ec.europa.eu/economy_finance/publications/economic_paper/2010/pdf/ecp426_en.pdf"
  ]
 ],
 [
  [
   "National Bank of Belgium, Where did the EUR 22 billion released from the 2023 State note go?, blog, 2024",
   "https://nbb.be/en/blog/where-did-eu22-billion-released-2023-state-note-go"
  ],
  [
   "Colabella, Nunnari, Spadafora, Italian households' investments in sovereign securities in the post-pandemic period, Banca d'Italia Occasional Paper 987, 2025",
   "https://ideas.repec.org/p/bdi/opques/qef_987_25.html"
  ]
 ],
 [
  [
   "US Department of the Treasury, The Price Impact of the Strategic Petroleum Reserve Release, July 2022",
   "https://home.treasury.gov/news/press-releases/jy0887"
  ]
 ],
 [
  [
   "Bańkowski et al., The economic impact of Next Generation EU: a euro area perspective, ECB Occasional Paper 291, 2022",
   "https://www.ecb.europa.eu/pub/pdf/scpops/ecb.op291~18b5f6e6a4.en.pdf"
  ],
  [
   "ECB Economic Bulletin 6/2025, Macroeconomic impacts of higher defence spending: a model-based assessment",
   "https://www.ecb.europa.eu/press/economic-bulletin/articles/2025/html/ecb.ebart202506_01~d41c118e13.en.html"
  ]
 ],
 [
  [
   "Koester and Grapow, The prevalence of private sector wage indexation in the euro area and its potential role for the impact of inflation on wages, ECB Economic Bulletin 7/2021",
   "https://www.ecb.europa.eu/press/economic-bulletin/focus/2021/html/ecb.ebbox202107_07~f555b70c47.en.html"
  ],
  [
   "ECB Occasional Paper 371, A strategic view on the economic and inflation environment in the euro area, 2025 (wage-price pass-through, citing Ampudia et al. 2024)",
   "https://www.ecb.europa.eu/pub/pdf/scpops/ecb.op371.en.pdf"
  ],
  [
   "ECB Working Paper 3137, Inflation and monetary policy in medium-sized New Keynesian DSGE models, 2025",
   "https://www.ecb.europa.eu/pub/pdf/scpwps/ecb.wp3137~e458bce069.en.pdf"
  ]
 ],
 [
  [
   "Darracq Pariès, Motto, Montes-Galdón, Ristiniemi, Saint Guilhem, Zimic, A model-based assessment of the macroeconomic impact of the ECB's monetary policy tightening since December 2021, ECB Economic Bulletin 3/2023",
   "https://www.ecb.europa.eu/press/economic-bulletin/focus/2023/html/ecb.ebbox202303_06~b2bdff5cda.en.html"
  ],
  [
   "ECB Occasional Paper 372, Report on monetary policy tools, strategy and communication, 2025",
   "https://www.ecb.europa.eu/pub/pdf/scpops/ecb.op372.en.pdf"
  ],
  [
   "Zlobins, Monetary policy transmission in the euro area: is this time different?, 2025",
   "https://www.ecb.europa.eu/pub/research-networks/shared/pdf/champ/20250808_Zlobins_paper.pdf"
  ]
 ],
 [
  [
   "ECB Occasional Paper 344, ECB macroeconometric models for forecasting and policy analysis, 2024 (sacrifice ratio, Chart 18)",
   "https://www.ecb.europa.eu/pub/pdf/scpops/ecb.op344~53b9e2aa4d.en.pdf"
  ],
  [
   "Darracq Pariès et al., A model-based assessment of the macroeconomic impact of the ECB's monetary policy tightening since December 2021, ECB Economic Bulletin 3/2023",
   "https://www.ecb.europa.eu/press/economic-bulletin/focus/2023/html/ecb.ebbox202303_06~b2bdff5cda.en.html"
  ]
 ],
 [
  [
   "Eurostat, Share of households and economic resources by income, consumption and wealth quantiles - experimental statistics (icw_res_01)",
   "https://ec.europa.eu/eurostat/databrowser/view/ICW_RES_01/default/table?lang=en"
  ],
  [
   "Eurostat Statistics Explained, Joint distribution of household income, consumption and wealth - main indicators",
   "https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Joint_distribution_of_household_income%2C_consumption_and_wealth_-_main_indicators"
  ]
 ],
 [
  [
   "Roeger and in 't Veld, Fiscal stimulus and exit strategies in the EU: a model-based analysis, European Economy Economic Papers 426, 2010 (Table 2)",
   "https://ec.europa.eu/economy_finance/publications/economic_paper/2010/pdf/ecp426_en.pdf"
  ],
  [
   "ECB Economic Bulletin 6/2025, Macroeconomic impacts of higher defence spending: a model-based assessment",
   "https://www.ecb.europa.eu/press/economic-bulletin/articles/2025/html/ecb.ebart202506_01~d41c118e13.en.html"
  ],
  [
   "Bańkowski et al., The economic impact of Next Generation EU: a euro area perspective, ECB Occasional Paper 291, 2022 (Box 5)",
   "https://www.ecb.europa.eu/pub/pdf/scpops/ecb.op291~18b5f6e6a4.en.pdf"
  ]
 ],
 [
  [
   "Kilponen et al., Comparing fiscal multipliers across models and countries in Europe, ECB Working Paper 1760, 2015",
   "https://www.ecb.europa.eu/pub/pdf/scpwps/ecbwp1760.en.pdf"
  ],
  [
   "Roeger and in 't Veld, Fiscal stimulus and exit strategies in the EU: a model-based analysis, European Economy Economic Papers 426, 2010 (Table 2)",
   "https://ec.europa.eu/economy_finance/publications/economic_paper/2010/pdf/ecp426_en.pdf"
  ],
  [
   "National Bank of Belgium, Where did the EUR 22 billion released from the 2023 State note go?, blog, 2024",
   "https://nbb.be/en/blog/where-did-eu22-billion-released-2023-state-note-go"
  ]
 ],
 [
  [
   "Eurostat, Gross domestic product (GDP) and main components (nama_10_gdp), P31_S14_S15 and P31_S14, percentage of GDP",
   "https://ec.europa.eu/eurostat/databrowser/view/nama_10_gdp/default/table?lang=en"
  ]
 ]
];
ASSUMPTIONS.forEach(function (row, i) { row.push(EVIDENCE[i] || []); });
export const EVIDENCE_REVIEWED = '6 October 2026';

export const LEVERS = [
  { k: 'vatFood', who: ['gov'], n: 'Cut VAT on food essentials', unit: ' pp', max: 10, step: 0.5, grp: 'Prices',
    d: 'Lower the VAT rate on basic foodstuffs.', law: 'Allowed: the VAT Directive (as amended by Directive (EU) 2022/542) permits reduced and zero rates on foodstuffs.', ref: ["Council Directive 2006/112/EC (consolidated), Article 98(1)–(2) and Annex III, point (1)", "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02006L0112-20250101"] },
  { k: 'energy', who: ['gov'], n: 'Absorb energy price growth above ' + K.energyFloor + '%', unit: '%', max: 100, step: 5, grp: 'Prices',
    d: 'The state covers this share of energy price growth above ' + K.energyFloor + '% a year, through a bill cap or rebate.', law: 'Directive (EU) 2019/944, Article 5, allows below-cost regulated electricity prices only for energy-poor or vulnerable households; Article 66a extends this to other households (up to 80% of median consumption) if the Council declares a price crisis. Aid to firms must respect State-aid rules.', ref: ["Directive (EU) 2019/944 as amended by Directive (EU) 2024/1711, Articles 5 and 66a", "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019L0944-20240716"] },
  { k: 'rent', who: ['gov', 'local'], n: 'Limit annual rent increases', unit: '% cap', max: 8, step: 0.5, off: 8, grp: 'Prices',
    d: 'Rents may rise by at most this much a year. 8% means no cap.', law: 'National competence. Tight caps can reduce rental supply over time.', ref: ["Commission proposal COM(2026) 599 final (Affordable Housing Act), explanatory memorandum", "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52026PC0599"] },
  { k: 'reserve', who: ['gov', 'eu'], n: 'Release strategic stocks', unit: '% of use', max: 10, step: 0.5, grp: 'Supply',
    d: 'Release food and energy reserves equal to this share of annual consumption.', law: 'Directive 2009/119/EC requires oil stocks of at least 90 days of net imports or 61 days of consumption, whichever is greater, and ties releases to supply disruptions (Article 20). Article 35 TFEU prohibits export restrictions between member states, subject to the Article 36 exceptions.', ref: ["Council Directive 2009/119/EC, Articles 3 and 20; Articles 35 and 36 TFEU", "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32009L0119"] },
  { k: 'supply', who: ['gov', 'eu'], n: 'Supply-side incentives', unit: '% GDP', max: 1.5, step: 0.1, grp: 'Supply',
    d: 'Incentives for producers that expand output or cut resource use in food, energy and housing.', law: 'Aid must be notified to the Commission before it is granted (Article 108(3) TFEU) unless it is block-exempted, chiefly under Regulation (EU) No 651/2014, which applies until 31 December 2026, or is de minimis aid under Regulation (EU) 2023/2831.', ref: ["Commission Regulation (EU) No 651/2014 (consolidated), Article 59; Article 108(3) TFEU", "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02014R0651-20230701"] },
  { k: 'transfer', who: ['gov', 'local'], n: 'Targeted relief to low-income households', unit: '% GDP', max: 2, step: 0.1, grp: 'Households',
    d: 'Payments restricted to the bottom 30% of households.', law: 'Counts as net expenditure under Article 2(2) of Regulation (EU) 2024/1263, which nets out only interest, discretionary revenue measures, EU-funded programme spending and national co-financing, cyclical unemployment benefit spending, and one-offs and other temporary measures.', ref: ["Regulation (EU) 2024/1263, Article 2(2)", "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1263"] },
  { k: 'bonds', who: ['gov'], n: 'Inflation-linked retail savings bonds', unit: '% GDP', max: 2, step: 0.1, grp: 'Households',
    d: 'Household take-up of government bonds whose return tracks inflation.', law: 'National debt-management decision. Indexation cost rises with inflation.', ref: ["Italian Treasury (MEF), BTP Italia Sì announcement, May 2026", "https://www.dt.mef.gov.it/en/news/2026/btp_italia_20052026.html"] },
  { k: 'wageIdx', who: ['gov', 'biz'], n: 'Automatic wage indexation coverage', unit: '% of pay', max: 100, step: 5, grp: 'Households',
    d: 'Share of the wage bill that rises automatically with inflation.', law: 'Social partners’ and national competence. Belgium, Luxembourg, Malta and Cyprus run such systems.', ref: ["ECB Economic Bulletin 7/2021, box on private sector wage indexation in the euro area", "https://www.ecb.europa.eu/press/economic-bulletin/focus/2021/html/ecb.ebbox202107_07~f555b70c47.en.html"] },
  { k: 'vatLux', who: ['gov'], n: 'Raise consumption tax on non-essentials', unit: ' pp', max: 5, step: 0.5, grp: 'Revenue',
    d: 'Higher tax on clothing, leisure and restaurants; helps fund relief.', law: 'The VAT Directive allows only one standard rate, so a separate luxury rate is not available: move items out of reduced rates or use excise duties.', ref: ["Council Directive 2006/112/EC (consolidated), Articles 96–98", "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02006L0112-20250101"] },
  { k: 'rate', who: ['cb'], n: 'Change the policy interest rate', unit: ' bp', min: -200, max: 200, step: 25, grp: 'Monetary',
    d: 'Tighten or loosen monetary policy.', law: 'Decided independently by the central bank (Article 130 TFEU). In the euro area this is the ECB, for all members at once.', ref: ["Article 130 TFEU; ECB press release of 1 January 2026 on Bulgaria", "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:12016E130"] }
];
// Legal basis of the fiscal reference values used in the warnings below.
export const REFERENCE_VALUES = ["The reference values of 3% of GDP for the government deficit and 60% of GDP for government debt are set in Article 1 of Protocol (No 12) on the excessive deficit procedure, annexed to the Treaties, for the purposes of Article 126(2) TFEU.", "Protocol (No 12) on the excessive deficit procedure, Article 1", "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:12016E/PRO/12"];
export const NO_POLICY = {};
LEVERS.forEach(function (l) { NO_POLICY[l.k] = l.off === undefined ? 0 : l.off; });

export function simulate(s, L) {
  const w = s.w, c = (num(s.cGdp) ? s.cGdp : K.consumptionDefault) / 100, pi = num(s.pi) ? s.pi : 2;
  const rows = [], flags = [];
  // t: [low, central, high] effect on inflation in percentage points.
  const add = function (k, t, cost, gdp, note) {
    rows.push({ k: k, lo: Math.min(t[0], t[1], t[2]), mid: t[1], hi: Math.max(t[0], t[1], t[2]), cost: cost, gdp: gdp || 0, note: note || '' });
  };
  const times = function (t, x) { return t.map(function (v) { return v * x; }); };
  const nonEss = w.CP03 + w.CP09 + w.CP11;
  if (L.vatFood > 0) add('vatFood', times(K.vatCut, -L.vatFood * w.CP01), L.vatFood * w.CP01 * c, 0, 'Food is ' + (w.CP01 * 100).toFixed(1) + '% of the basket.');
  if (L.energy > 0) {
    const bind = Math.max(0, (num(s.nrg) ? s.nrg : 0) - K.energyFloor) * L.energy / 100;
    add('energy', times(K.energyPass, -w.NRG * bind), w.NRG * bind * c, 0,
      bind > 0 ? 'Energy inflation is ' + s.nrg.toFixed(1) + '%; ' + bind.toFixed(1) + ' points absorbed. Prices rebound when support ends.' : 'Not binding: energy inflation is at or below ' + K.energyFloor + '%.');
  }
  if (num(L.rent) && L.rent < NO_POLICY.rent) {
    const bind = Math.max(0, (num(s.rent) ? s.rent : 0) - L.rent), e = -w.CP041 * bind;
    add('rent', [e, e, e], 0, 0, bind > 0 ? 'Rents are rising ' + s.rent.toFixed(1) + '%; the cap removes ' + bind.toFixed(1) + ' points.' : 'Not binding: rents are rising more slowly than the cap.');
    if (bind > 2) flags.push('A rent cap this far below market growth risks shrinking rental supply.');
  }
  if (L.reserve > 0) add('reserve', times(K.reserve, -L.reserve * K.reserveBase * (w.FOOD + w.NRG)), L.reserve * K.reserveCarry, 0, 'Temporary: stocks must be rebuilt later.');
  if (L.supply > 0) add('supply', [0, 1, 2].map(function (i) { return L.supply * (K.supplyDemand * K.demand[i] - K.supply[i]); }), L.supply, K.gdpSupply * L.supply, 'No price relief in the first year; the supply benefit arrives in years two and three.');
  if (L.transfer > 0) add('transfer', times(K.demand, L.transfer * K.spendTransfer), L.transfer, K.gdpTransfer * L.transfer,
    'Equals ' + (L.transfer / (K.lowShare * c * 100) * 100).toFixed(1) + '% of low-income households’ annual spending.');
  if (L.bonds > 0) add('bonds', times(K.demand, -L.bonds * K.bondDivert), L.bonds * Math.max(0, pi - 2) / 100, -K.gdpBonds * L.bonds, 'Protects savers; bought mostly out of bank deposits, so it cools spending only a little.');
  if (L.wageIdx > 0) {
    add('wageIdx', times(K.wage, Math.max(0, pi - 2) * L.wageIdx / 100), 0, 0, 'Protects real pay but slows the return to target.');
    if (L.wageIdx >= 50 && pi > 4) flags.push('Broad wage indexation with inflation above 4% raises the risk of a wage–price spiral.');
  }
  if (L.vatLux > 0) {
    const rev = L.vatLux * nonEss * c * 0.9;
    add('vatLux', times(K.taxRise, L.vatLux * nonEss), -rev, -K.gdpTax * rev, 'Raises the measured index mechanically while cooling discretionary demand.');
  }
  if (L.rate) {
    const r = L.rate / 100;
    add('rate', times(K.rate, -r), 0, -K.rateGdp[1] * r, s.meta.euro || s.meta.agg ? 'Set by the ECB for the whole euro area — not a national lever.' : 'Set by the national central bank.');
  }
  const sum = function (f) { return rows.reduce(function (a, r) { return a + r[f]; }, 0); };
  const cost = sum('cost'), bal = num(s.bal) ? s.bal - cost : null;
  if (bal !== null && bal < -3 && cost > 0.05) flags.push('The package takes the government balance to ' + bal.toFixed(1) + '% of GDP, beyond the 3% Treaty reference value.');
  if (num(s.debt) && s.debt > 60 && cost > 0.5) flags.push('Public debt is ' + s.debt.toFixed(0) + '% of GDP, above the 60% reference value; fund the package with offsetting revenue.');
  if (L.energy >= 80 && !(L.transfer >= 0.2)) flags.push('Untargeted energy support is costly and weakens the incentive to save energy; consider shifting part to targeted relief.');
  return {
    rows: rows, flags: flags, lo: sum('lo'), mid: sum('mid'), hi: sum('hi'), cost: cost, gdp: sum('gdp'), bal: bal,
    costEur: num(s.gdpEur) ? cost / 100 * s.gdpEur : null, pi: pi
  };
}

// --- Currency calculators ----------------------------------------------------
export function exportBond(a) {
  const steps = a.per > 0 ? Math.max(0, Math.floor(a.growth / a.per)) : 0;
  const y = Math.max(a.base, Math.min(a.base + steps * a.bonus, a.cap));
  return { yield: y, bonus: y - a.base, annual: a.size * y / 100, extra: a.size * (y - a.base) / 100 };
}
export function fxLock(a) {
  const mkt = a.spot * (1 + a.move / 100);
  const locked = a.bill * a.lock, open = a.bill * mkt;
  return { market: mkt, locked: locked, open: open, saving: open - locked, pct: open ? (open - locked) / open * 100 : 0 };
}
export function voucher(a) {
  const ex = Math.max(0, a.exports), im = Math.max(0, a.imports);
  const kept = ex * clamp(a.share, 0, 100) / 100, converted = ex - kept;
  const covered = Math.min(kept, im);
  return { kept: kept, converted: converted, covered: covered, gross: ex + im, grossAfter: converted + im - covered };
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
