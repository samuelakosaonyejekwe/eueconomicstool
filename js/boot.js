// Start-up and self-update. The page's small loader imports this file from the
// newest published commit and calls run(). Everything about how the tool starts
// and keeps itself current lives here, so it can change without touching the loader.
const FILES = ['js/app.js', 'js/shell.js', 'js/data.js', 'js/model.js', 'js/charts.js', 'js/countries.js', 'js/strategies.js', 'js/legal-status.js', 'js/method.js'];
const MIN = 60000;
const started = Date.now();
let touched = false, lastTry = 0;
['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, function () { touched = true; }, { once: true, passive: true }); });
const SHA = /@([0-9a-f]{40})\//;
// Switch to a freshly downloaded version without asking, but only while nobody has started working.
function quietSwitch(sha) {
  let done = '';
  try { done = sessionStorage.getItem('esc.auto') || ''; } catch (e) { /* storage blocked */ }
  if (touched || Date.now() - started > 12000 || done === sha) return false;
  try { sessionStorage.setItem('esc.auto', sha); } catch (e) { /* storage blocked */ }
  setTimeout(function () { location.reload(); }, 600);
  return true;
}

function warm(base) {
  // Ask for every file at once so a first load needs one round trip, not a chain.
  FILES.forEach(function (f) { const l = document.createElement('link'); l.rel = 'modulepreload'; l.href = base + f; document.head.appendChild(l); });
}
function style(base) {
  return new Promise(function (done) {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'css/app.css';
    l.onload = function () { done(l); };
    l.onerror = function () { l.remove(); done(null); };
    setTimeout(function () { if (!l.sheet) { l.remove(); done(null); } }, 7000);
    document.head.appendChild(l);
  });
}

export async function run(base) {
  // The loader may start two copies at once (newest and stored). The first one
  // ready to draw claims the page; the other backs out without a trace.
  if (window.__escClaim) return;
  base = new URL(base, document.baseURI).href;
  const x = window.__esc;
  // Download every file of this version first, so the page is claimed only by a
  // copy that can start at once.
  const got = await Promise.all([style(base)].concat(FILES.map(function (f) {
    return fetch(base + f).then(function (r) { return r.ok; }, function () { return false; });
  })));
  const sheet = got[0];
  if (!sheet || got.indexOf(false) >= 0) { if (sheet) sheet.remove(); throw new Error('version unavailable'); }
  if (window.__escClaim) {
    // An older copy is already on screen. If this is the newest version, now fully downloaded, move to it.
    sheet.remove();
    const mine = (base.match(SHA) || [])[1];
    if (mine && !SHA.test(window.__escClaim)) quietSwitch(mine);
    return;
  }
  window.__escClaim = base;
  const frame = await import(base + 'js/shell.js');
  document.getElementById('root').innerHTML = frame.SHELL;
  await import(base + 'js/app.js');
  if (x.dev) return;
  const running = (base.match(SHA) || [])[1] || '';
  if (running && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(function (reg) { if (reg.active) reg.active.postMessage({ rev: running }); }).catch(function () { /* unsupported */ });
  }
  const tick = function () { check(x, running); };
  tick();
  setInterval(tick, 20 * MIN);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });
}

function save(x) { try { localStorage.setItem(x.key, JSON.stringify(x.rev)); } catch (e) { /* storage blocked */ } }

// --- Finding the newest commit ------------------------------------------------
// GitHub's own lookup is asked first. It allows 60 requests an hour per network
// address, so when that allowance is used up a second, independent service is
// asked instead. An answer from that service is never taken on trust: every file
// of the commit it names must be identical to what GitHub's own file server
// holds for the main branch before the commit is accepted.
async function askGitHub(x) {
  try {
    const r = await fetch('https://api.github.com/repos/' + x.repo + '/commits/main', { headers: { Accept: 'application/vnd.github.sha' }, cache: 'no-store' });
    if (r.status === 403 || r.status === 429) {
      const reset = +r.headers.get('X-RateLimit-Reset') * 1000;
      return { wait: reset > Date.now() ? reset : Date.now() + 30 * MIN };
    }
    const sha = r.ok ? (await r.text()).trim() : '';
    return { sha: /^[0-9a-f]{40}$/.test(sha) ? sha : '' };
  } catch (e) { return {}; }
}
async function askMirror(x) {
  try {
    const r = await fetch('https://ungh.cc/repos/' + x.repo + '/branches', { cache: 'no-store' });
    if (!r.ok) return '';
    const main = ((await r.json()).branches || []).filter(function (b) { return b.name === 'main'; })[0];
    const sha = main && main.commit ? main.commit.sha : '';
    return /^[0-9a-f]{40}$/.test(sha) ? sha : '';
  } catch (e) { return ''; }
}
async function text(url) { const r = await fetch(url, { cache: 'no-cache' }); if (!r.ok) throw new Error('unavailable'); return r.text(); }
async function verified(x, sha) {
  try {
    const raw = 'https://raw.githubusercontent.com/' + x.repo + '/main/', cdn = x.cdn + sha + '/';
    const boot = await text(raw + 'js/boot.js');
    const m = boot.match(/const FILES = (\[[^\]]*\]);/);
    if (!m) return false;
    const list = JSON.parse(m[1].replace(/'/g, '"')).concat(['js/boot.js', 'css/app.css']);
    const same = await Promise.all(list.map(function (f) {
      return Promise.all([text(raw + f), text(cdn + f)]).then(function (pair) { return pair[0] === pair[1]; });
    }));
    return same.indexOf(false) < 0;
  } catch (e) { return false; }
}

// Runs at most once every ten minutes per device.
async function check(x, running) {
  const now = Date.now();
  if (now - lastTry < 10 * MIN || (x.rev && now - (x.rev.at || 0) < 10 * MIN)) return;
  lastTry = now;
  const known = x.rev ? x.rev.sha : '';
  let sha = '', wait = x.rev ? x.rev.wait || 0 : 0;
  if (now >= wait) {
    const g = await askGitHub(x);
    if (g.sha) sha = g.sha; else if (g.wait) wait = g.wait;
  }
  if (!sha) {
    sha = await askMirror(x);
    if (sha && sha !== known && !(await verified(x, sha))) sha = '';
  }
  if (!sha) { if (x.rev && wait !== x.rev.wait) { x.rev.wait = wait; save(x); } return; }
  x.rev = { sha: sha, at: now, wait: wait };
  save(x);
  if (sha === running) return;
  // Fetch the new version straight away so it is ready, also offline.
  const next = x.cdn + sha + '/';
  warm(next);
  fetch(next + 'css/app.css').catch(function () { /* offline */ });
  fetch(next + 'js/boot.js').catch(function () { /* offline */ });
  if (!running) return; // running an older stored copy: the newest version is now ready for the next start
  if (quietSwitch(sha)) return;
  window.__escUpdate = true;
  window.dispatchEvent(new Event('esc-update'));
}
