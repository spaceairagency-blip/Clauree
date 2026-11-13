// Never serves an old copy of the app. Every file is fetched fresh from the server (which deploys from GitHub).
// The only thing cached is a tiny static offline page, shown when there is no connection.
const OFFLINE = 'clauree-offline';
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(OFFLINE).then((c) => c.add(new Request('offline.html', { cache: 'reload' }))));
});
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== OFFLINE) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request, { cache: 'no-store' }).catch(() => (e.request.mode === 'navigate' ? caches.match('offline.html') : Response.error())));
});
