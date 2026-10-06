// Small dependency-free SVG charts. Colours come from CSS custom properties so
// light and dark themes are handled in the stylesheet.
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function num(x) { return typeof x === 'number' && isFinite(x); }
export function fmt(x, dp) {
  if (!num(x)) return '–';
  const d = dp === undefined ? 1 : dp;
  return x.toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d }).replace('-', '\u2212');
}

function niceTicks(lo, hi, n) {
  if (lo === hi) { lo -= 1; hi += 1; }
  const raw = (hi - lo) / n, mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), r = raw / mag;
  const stepv = (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag;
  const out = [];
  const first = Math.floor(lo / stepv + 1e-9) * stepv, count = Math.ceil((hi - first) / stepv - 1e-9);
  for (let i = 0; i <= count; i++) { const v = first + i * stepv; out.push(Math.abs(v) < 1e-9 ? 0 : v); } // last tick is at or above the largest value
  out.dp = Math.max(0, -Math.floor(Math.log(stepv) / Math.LN10 + 1e-9)); // decimals needed so neighbouring ticks never read the same
  return out;
}

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function periodLabel(p) {
  if (!p) return '';
  p = esc(p); // period codes come from outside; never let them carry markup
  if (/^\d{4}-\d{2}-\d{2}$/.test(p)) return +p.slice(8) + ' ' + MON[+p.slice(5, 7) - 1] + ' ' + p.slice(0, 4);
  if (/^\d{4}-\d{2}$/.test(p)) return MON[+p.slice(5) - 1] + ' ' + p.slice(0, 4);
  return p.replace('-', ' ');
}
function xTicks(t, maxN) {
  const idx = [];
  let prev = '';
  t.forEach(function (p, i) { const y = p.slice(0, 4); if (y !== prev) { if (prev) idx.push({ i: i, l: y }); prev = y; } });
  if (idx.length >= 2 && idx.length <= maxN) return idx;
  if (idx.length > maxN) { const k = Math.ceil(idx.length / maxN); return idx.filter(function (_, j) { return j % k === 0; }); }
  const out = [], n = Math.min(maxN, 5), st = Math.max(1, Math.floor(t.length / n));
  for (let i = st; i < t.length - 1; i += st) out.push({ i: i, l: periodLabel(t[i]).replace(/ \d{4}$/, function (m) { return /^\d{4}-\d{2}-\d{2}$/.test(t[i]) ? '' : m; }) });
  return out;
}

/* Line chart.
   o = { t: [periods], series: [{ name, values, color (1-8), dash }], unit, refs: [{ y, label }],
         band: { from, lo: [], hi: [] }, height, dp, label } */
export function lineChart(el, o) {
  if (!el) return;
  const W = el.printWidth || Math.max(280, el.clientWidth || 600), Hh = el.printWidth ? Math.min(o.height || 260, 240) : o.height || 260;
  const refs = o.refs || [], longest = refs.reduce(function (a, r) { return Math.max(a, r.label.length); }, 0);
  const m = { l: 40, r: refs.length ? Math.min(96, 12 + longest * 5.8) : 14, t: 12, b: 26 }, iw = W - m.l - m.r, ih = Hh - m.t - m.b;
  const n = o.t.length;
  let lo = Infinity, hi = -Infinity;
  o.series.forEach(function (s) { s.values.forEach(function (v) { if (num(v)) { if (v < lo) lo = v; if (v > hi) hi = v; } }); });
  if (o.band) o.band.lo.concat(o.band.hi).forEach(function (v) { if (num(v)) { if (v < lo) lo = v; if (v > hi) hi = v; } });
  (o.refs || []).forEach(function (r) { if (r.y < lo) lo = r.y; if (r.y > hi) hi = r.y; });
  if (!isFinite(lo)) { el.innerHTML = '<p class="empty">No data available for this selection.</p>'; return; }
  const pad = (hi - lo) * 0.04 || 0.5;
  const ticks = niceTicks(lo - pad, hi + pad, 4);
  lo = ticks[0]; hi = ticks[ticks.length - 1];
  const X = function (i) { return m.l + (n > 1 ? i / (n - 1) : 0.5) * iw; };
  const Y = function (v) { return m.t + (1 - (v - lo) / (hi - lo)) * ih; };
  const dp = ticks.dp;
  let g = '';
  ticks.forEach(function (v) {
    g += '<line class="grid' + (v === 0 ? ' zero' : '') + '" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/>' +
      '<text class="tick" x="' + (m.l - 6) + '" y="' + (Y(v) + 3.5).toFixed(1) + '" text-anchor="end">' + fmt(v, dp) + '</text>';
  });
  xTicks(o.t, W < 420 ? 4 : 8).forEach(function (k) {
    g += '<text class="tick" x="' + X(k.i).toFixed(1) + '" y="' + (Hh - 7) + '" text-anchor="middle">' + k.l + '</text>';
  });
  (o.refs || []).forEach(function (r) {
    g += '<line class="ref" x1="' + m.l + '" x2="' + (W - m.r + 4) + '" y1="' + Y(r.y).toFixed(1) + '" y2="' + Y(r.y).toFixed(1) + '"/>' +
      '<text class="reflab" x="' + (W - m.r + 7) + '" y="' + (Y(r.y) + 3.5).toFixed(1) + '">' + esc(r.label) + '</text>';
  });
  if (o.band) {
    let up = '', dn = '';
    for (let i = o.band.from; i < n; i++) {
      if (!num(o.band.hi[i])) continue;
      up += (up ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(o.band.hi[i]).toFixed(1);
      dn = 'L' + X(i).toFixed(1) + ' ' + Y(o.band.lo[i]).toFixed(1) + dn;
    }
    if (up) g += '<path class="band" d="' + up + dn + 'Z"/>';
  }
  o.series.forEach(function (s) {
    let d = '', pen = false;
    s.values.forEach(function (v, i) {
      if (!num(v)) { pen = false; return; }
      d += (pen ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1);
      pen = true;
    });
    g += '<path class="line" style="stroke:var(--s' + s.color + ')"' + (s.dash ? ' stroke-dasharray="5 4"' : '') + ' d="' + d + '"/>';
  });
  g += '<line class="cross" y1="' + m.t + '" y2="' + (m.t + ih) + '" style="display:none"/><g class="dots"></g>';
  const legend = o.series.length > 1 ? '<div class="legend">' + o.series.map(function (s) {
    return '<span><i style="background:var(--s' + s.color + ')"' + (s.dash ? ' class="dash"' : '') + '></i>' + esc(s.name) + '</span>';
  }).join('') + '</div>' : '';
  // Text alternative: a one-line summary for screen readers and a table anyone can open.
  const vdp = o.dp === undefined ? 1 : o.dp, unit = o.unit || '';
  const lastIdx = function (v) { for (let i = v.length - 1; i >= 0; i--) if (num(v[i])) return i; return -1; };
  const summary = o.series.map(function (s) {
    const i = lastIdx(s.values), v = s.values.filter(num);
    return i < 0 ? '' : s.name + ': ' + fmt(s.values[i], vdp) + unit + ' in ' + periodLabel(o.t[i]) + ', range ' + fmt(Math.min.apply(null, v), vdp) + ' to ' + fmt(Math.max.apply(null, v), vdp) + unit;
  }).filter(Boolean).join('. ');
  const rowsIdx = [];
  for (let i = n - 1; i >= 0 && rowsIdx.length < 36; i--) if (o.series.some(function (s) { return num(s.values[i]); })) rowsIdx.push(i);
  const tbl = '<details class="astable" aria-label="Chart data as a table"><summary>Show as table</summary><div class="tw"><table><caption>' + esc(o.label || 'Chart data') + (rowsIdx.length < n ? ', latest ' + rowsIdx.length + ' periods' : '') +
    '</caption><thead><tr><th scope="col">Period</th>' + o.series.map(function (s) { return '<th scope="col">' + esc(s.name) + '</th>'; }).join('') + '</tr></thead><tbody>' +
    rowsIdx.map(function (i) { return '<tr><th scope="row">' + periodLabel(o.t[i]) + '</th>' + o.series.map(function (s) { return '<td>' + (num(s.values[i]) ? fmt(s.values[i], vdp) + unit : '–') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div></details>';
  const wasOpen = el.querySelector('details[open]');
  el.innerHTML = legend + '<div class="plot"><svg viewBox="0 0 ' + W + ' ' + Hh + '" width="' + W + '" height="' + Hh + '" role="img" aria-label="' + esc((o.label || 'Line chart') + '. ' + summary) + '">' + g +
    '</svg><div class="tip" hidden></div></div>' + tbl;
  if (wasOpen) el.querySelector('details').open = true;
  const svg = el.querySelector('svg'), tip = el.querySelector('.tip'), cross = el.querySelector('.cross'), dots = el.querySelector('.dots');
  const move = function (ev) {
    const pt = ev.touches ? ev.touches[0] : ev, box = svg.getBoundingClientRect();
    const i = Math.round(clampN((pt.clientX - box.left - m.l) / iw, 0, 1) * (n - 1));
    let rows = '', dd = '';
    o.series.forEach(function (s) {
      const v = s.values[i];
      if (!num(v)) return;
      rows += '<div><i style="background:var(--s' + s.color + ')"></i>' + esc(s.name) + '<b>' + fmt(v, o.dp === undefined ? 1 : o.dp) + (o.unit || '') + '</b></div>';
      dd += '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(v).toFixed(1) + '" r="4" style="fill:var(--s' + s.color + ')"/>';
    });
    if (!rows) { leave(); return; }
    cross.setAttribute('x1', X(i)); cross.setAttribute('x2', X(i)); cross.style.display = '';
    dots.innerHTML = dd;
    tip.innerHTML = '<strong>' + periodLabel(o.t[i]) + (o.band && i > o.band.from ? ' · projection' : '') + '</strong>' + rows;
    tip.hidden = false;
    const left = X(i) > W / 2 ? X(i) - tip.offsetWidth - 10 : X(i) + 10;
    tip.style.left = Math.max(0, left) + 'px';
  };
  const leave = function () { tip.hidden = true; cross.style.display = 'none'; dots.innerHTML = ''; };
  svg.addEventListener('mousemove', move);
  svg.addEventListener('touchstart', move, { passive: true });
  svg.addEventListener('touchmove', move, { passive: true });
  svg.addEventListener('mouseleave', leave);
}
function clampN(x, a, b) { return Math.max(a, Math.min(b, x)); }

// Inline sparkline, returned as an SVG string.
export function spark(values, color) {
  const v = (values || []).filter(num).slice(-36);
  if (v.length < 2) return '';
  const lo = Math.min.apply(null, v), hi = Math.max.apply(null, v), W = 96, Hh = 28;
  const d = v.map(function (y, i) {
    return (i ? 'L' : 'M') + (2 + i / (v.length - 1) * (W - 4)).toFixed(1) + ' ' + (Hh - 3 - (hi === lo ? 0.5 : (y - lo) / (hi - lo)) * (Hh - 6)).toFixed(1);
  }).join('');
  return '<svg class="spark" viewBox="0 0 ' + W + ' ' + Hh + '" width="' + W + '" height="' + Hh + '" preserveAspectRatio="none" aria-hidden="true"><path d="' + d + '" style="stroke:var(--s' + (color || 1) + ')"/></svg>';
}

/* Ranked horizontal bars built from HTML so they reflow on any screen.
   rows = [{ label, value, code, hl }]; o = { unit, dp, ref, refLabel } */
export function barList(rows, o) {
  o = o || {};
  const vals = rows.map(function (r) { return r.value; }).filter(num);
  if (!vals.length) return '<p class="empty">No data available for this selection.</p>';
  let lo = Math.min(0, Math.min.apply(null, vals)), hi = Math.max(0, Math.max.apply(null, vals));
  if (num(o.ref)) { lo = Math.min(lo, o.ref); hi = Math.max(hi, o.ref); }
  const span = hi - lo || 1, zero = (0 - lo) / span * 100;
  const refx = num(o.ref) ? (o.ref - lo) / span * 100 : null;
  return '<div class="bars' + ((o.unit || '').length > 1 ? ' wide' : '') + '">' + rows.map(function (r) {
    if (!num(r.value)) return '<div class="bar-row mute"' + (r.code ? ' data-country="' + r.code + '"' : '') + '><span class="bl">' + esc(r.label) + '</span><span class="bt"></span><span class="bv">–</span></div>';
    const w = Math.abs(r.value) / span * 100, left = r.value >= 0 ? zero : zero - w;
    return '<div class="bar-row' + (r.hl ? ' hl' : '') + (r.agg ? ' agg' : '') + '"' + (r.code ? ' data-country="' + r.code + '" tabindex="0" role="button"' : '') + '>' +
      '<span class="bl">' + esc(r.label) + '</span><span class="bt"><i class="' + (r.value < 0 ? 'neg' : '') + '" style="left:' + left.toFixed(2) + '%;width:' + Math.max(w, 0.6).toFixed(2) + '%"></i>' +
      (refx !== null ? '<u style="left:' + refx.toFixed(2) + '%"></u>' : '') + '</span><span class="bv">' + fmt(r.value, o.dp) + (o.unit || '') + '</span></div>';
  }).join('') + '</div>' + (refx !== null && o.refLabel ? '<p class="note"><u class="refkey"></u> ' + esc(o.refLabel) + '</p>' : '');
}

// 0–100 meter with a status label.
export function meter(score, label) {
  if (!num(score)) return '<div class="meter na"><span class="track"><i style="width:0"></i></span><b>n/a</b><span class="lv">Not published</span></div>';
  const tone = label === 'High' ? 'crit' : label === 'Moderate' ? 'warn' : 'good';
  return '<div class="meter ' + tone + '"><span class="track" aria-hidden="true"><i style="width:' + Math.max(2, score) + '%"></i></span><b>' + Math.round(score) + '<span class="sr"> out of 100,</span></b><span class="lv">' + esc(label) + '</span></div>';
}
export { esc };
