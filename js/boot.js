// Start-up and self-update. The page's small loader imports this file from the
// newest published commit and calls run(). Everything about how the tool starts
// and keeps itself current lives here, so it can change without touching the loader.
const FILES = ['js/app.js', 'js/shell.js', 'js/data.js', 'js/model.js', 'js/charts.js', 'js/countries.js', 'js/strategies.js', 'js/method.js'];
const MIN = 60000;
const started = Date.now();
let touched = false;

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
  warm(base);
  const sheet = await style(base);
  if (!sheet) throw new Error('stylesheet unavailable');
  let frame;
  try { frame = await import(base + 'js/shell.js'); } catch (e) { sheet.remove(); throw e; }
  if (window.__escClaim) { sheet.remove(); return; }
  window.__escClaim = base;
  document.getElementById('root').innerHTML = frame.SHELL;
  await import(base + 'js/app.js');
  if (x.dev) return;
  const running = (base.match(/@([0-9a-f]{40})\//) || [])[1] || '';
  if (running && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(function (reg) { if (reg.active) reg.active.postMessage({ rev: running }); }).catch(function () { /* unsupported */ });
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, function () { touched = true; }, { once: true, passive: true }); });
  const tick = function () { check(x, running); };
  tick();
  setInterval(tick, 20 * MIN);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });
}

function save(x) { try { localStorage.setItem(x.key, JSON.stringify(x.rev)); } catch (e) { /* storage blocked */ } }

// Looks up the newest commit, at most once every ten minutes per device, and
// backs off completely when GitHub says the hourly allowance is used up.
async function check(x, running) {
  const now = Date.now(), rev = x.rev;
  if (rev && (now - (rev.at || 0) < 10 * MIN || now < (rev.wait || 0))) return;
  try {
    const r = await fetch('https://api.github.com/repos/' + x.repo + '/commits/main', { headers: { Accept: 'application/vnd.github.sha' }, cache: 'no-store' });
    if (r.status === 403 || r.status === 429) {
      const reset = +r.headers.get('X-RateLimit-Reset') * 1000;
      if (rev) { rev.wait = reset > now ? reset : now + 30 * MIN; save(x); }
      return;
    }
    if (!r.ok) return;
    const sha = (await r.text()).trim();
    if (!/^[0-9a-f]{40}$/.test(sha)) return;
    x.rev = { sha: sha, at: now };
    save(x);
    if (sha === running) return;
    // Fetch the new version straight away so it is ready, also offline.
    const next = x.cdn + sha + '/';
    warm(next);
    fetch(next + 'css/app.css').catch(function () { /* offline */ });
    fetch(next + 'js/boot.js').catch(function () { /* offline */ });
    if (!running) return; // running the stored copy: the newest version is now ready for the next start
    let auto = '';
    try { auto = sessionStorage.getItem('esc.auto') || ''; } catch (e) { /* storage blocked */ }
    if (!touched && Date.now() - started < 8000 && auto !== sha) {
      // Nobody has started working yet: switch to the new version silently.
      try { sessionStorage.setItem('esc.auto', sha); } catch (e) { /* storage blocked */ }
      setTimeout(function () { location.reload(); }, 900);
      return;
    }
    window.__escUpdate = true;
    window.dispatchEvent(new Event('esc-update'));
  } catch (e) { /* offline: keep the current version */ }
}
