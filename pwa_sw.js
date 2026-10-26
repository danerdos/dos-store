// Basic offline cache for this Flutter web PWA. Does not cache Firebase requests.
const CACHE = 'dos-web-static-v1';
const HOME = ['./', './index.html'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(HOME)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('dos-web-static-') && key !== CACHE).map(key => caches.delete(key)))),
    self.clients.claim(),
  ]));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(c => c.put('./', copy)); }
      return response;
    }).catch(() => caches.match('./')));
    return;
  }
  event.respondWith(caches.match(request).then(cached => {
    const online = fetch(request).then(response => {
      if (response.ok && response.type === 'basic') {
        const copy = response.clone(); caches.open(CACHE).then(c => c.put(request, copy));
      }
      return response;
    });
    if (cached) { event.waitUntil(online.catch(() => {})); return cached; }
    return online;
  }));
});
