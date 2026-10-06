// Offline support. Everything the tool needs is stored on the device as it is
// used and served from there first, so it opens instantly and keeps working
// with no connection. Live statistics are fetched by the page itself and are
// not intercepted here.
const CACHE = 'esc-v3';
const CDN = 'https://cdn.jsdelivr.net/gh/samuelakosaonyejekwe/eueconomicstool@';
const SHELL = ['./', 'index.html', 'acts.html', 'css/app.css', 'js/boot.js', 'js/app.js', 'js/shell.js', 'js/data.js', 'js/model.js', 'js/charts.js', 'js/countries.js',
  'js/strategies.js', 'js/legal-status.js', 'js/method.js', 'data/snapshot.json', 'manifest.webmanifest', 'mirrors.json',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/icon.svg'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(SHELL.map(function (u) { return c.add(new Request(u, { cache: 'reload' })).catch(function () { /* keep installing */ }); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('esc-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

// The page reports which published version it runs; older versions are dropped.
self.addEventListener('message', function (e) {
  const rev = e.data && e.data.rev;
  if (!rev) return;
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.keys().then(function (reqs) {
      return Promise.all(reqs.filter(function (r) { return r.url.indexOf(CDN) === 0 && r.url.indexOf(CDN + rev + '/') !== 0 && r.url.indexOf(CDN + 'main/') !== 0; }).map(function (r) { return c.delete(r); }));
    });
  }));
});

self.addEventListener('fetch', function (e) {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (req.url.indexOf(CDN + 'main/') === 0) {
    // The CDN's moving "latest" copy: prefer the network, keep a copy for offline.
    e.respondWith(caches.open(CACHE).then(function (cache) {
      return fetch(req.url, { mode: 'cors' }).then(function (res) { if (res && res.ok) cache.put(req.url, res.clone()); return res; })
        .catch(function () { return cache.match(req.url); });
    }));
    return;
  }
  if (req.url.indexOf(CDN) === 0) {
    // A published version never changes, so a stored copy is always valid.
    e.respondWith(caches.open(CACHE).then(function (cache) {
      return cache.match(req.url).then(function (hit) {
        return hit || fetch(req.url, { mode: 'cors' }).then(function (res) { if (res && res.ok) cache.put(req.url, res.clone()); return res; });
      });
    }));
    return;
  }
  if (url.origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(function (cache) {
    // Opening the tool itself always resolves to its one page; any other document keeps its own address.
    const home = req.mode === 'navigate' && /\/(index\.html)?$/.test(url.pathname);
    const key = home ? 'index.html' : req;
    return cache.match(key, { ignoreSearch: req.mode === 'navigate' }).then(function (hit) {
      const net = fetch(req).then(function (res) {
        if (res && res.ok) cache.put(key, res.clone());
        return res;
      });
      if (hit) { e.waitUntil(net.catch(function () { /* offline */ })); return hit; }
      return net.catch(function () { return home ? cache.match('index.html') : Response.error(); });
    });
  }));
});
