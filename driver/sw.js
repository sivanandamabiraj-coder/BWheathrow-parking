// ParkDesk Driver — service worker. Caches the app shell only; never touches Supabase calls.
const CACHE = 'parkdesk-driver-v2';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './badge-96.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;               // Supabase etc. — pass through untouched
  const scopePath = new URL(self.registration.scope).pathname;
  if (!url.pathname.startsWith(scopePath)) return;
  // Stale-while-revalidate for shell files
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const net = fetch(req).then(res => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      return cached || (await net) || (req.mode === 'navigate' ? cache.match('./index.html') : Response.error());
    })
  );
});

// ---------- Push alerts ----------
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil((async () => {
    await self.registration.showNotification(d.title || 'ParkDesk Driver', {
      body: d.body || '',
      tag: d.tag || 'parkdesk',          // same tag = replaces the previous notification instead of stacking
      renotify: true,                    // …but still buzzes
      icon: 'icon-192.png',
      badge: 'badge-96.png',
      vibrate: [250, 100, 250],
      data: { url: d.url || './' }
    });
    const wins = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    wins.forEach(c => c.postMessage({ type: 'push' }));      // an open app refreshes its list straight away
  })());
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    const wins = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const mine = wins.find(c => c.url.startsWith(self.registration.scope));
    if (mine) { await mine.focus(); mine.postMessage({ type: 'push' }); }
    else await clients.openWindow(self.registration.scope);
  })());
});
