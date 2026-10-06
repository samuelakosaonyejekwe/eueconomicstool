// Offline support. The app shell is stored on the device at install time and
// served from there first, then refreshed in the background, so the tool opens
// instantly and keeps working with no connection. Live statistics are fetched by
// the page itself and are not intercepted here.
const CACHE = 'esc-shell-v1.0.1';
const SHELL = ['./', 'index.html', 'css/app.css', 'js/app.js', 'js/data.js', 'js/model.js', 'js/charts.js', 'js/countries.js',
  'js/strategies.js', 'js/method.js', 'data/snapshot.json', 'manifest.webmanifest', 'mirrors.json', 'version.json',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/icon.svg'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(SHELL.map(function (u) { return c.add(new Request(u, { cache: 'reload' })).catch(function () { /* keep installing */ }); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('esc-shell-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(function (cache) {
    const key = req.mode === 'navigate' ? 'index.html' : req;
    return cache.match(key, { ignoreSearch: req.mode === 'navigate' }).then(function (hit) {
      const net = fetch(req).then(function (res) {
        if (res && res.ok) cache.put(key, res.clone());
        return res;
      });
      if (hit) { e.waitUntil(net.catch(function () { /* offline */ })); return hit; }
      return net.catch(function () { return cache.match('index.html'); });
    });
  }));
});
