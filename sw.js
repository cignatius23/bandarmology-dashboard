// Service Worker sederhana untuk BDM Index
// Fungsi: bikin dashboard bisa install sebagai app,
// dan cache halaman utama biar bisa dibuka tanpa internet.

const CACHE_NAME = 'bdm-index-v1';
const URLS_TO_CACHE = [
  '/bandarmology-dashboard/',
  '/bandarmology-dashboard/index.html',
  '/bandarmology-dashboard/manifest.json',
];

// Saat install: cache halaman utama
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(URLS_TO_CACHE).catch(() => {
        // Kalau gagal cache (misal offline saat install), lanjut aja
      });
    })
  );
  self.skipWaiting();
});

// Saat activate: hapus cache lama
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Saat fetch: network-first, kalau gagal ambil dari cache
self.addEventListener('fetch', event => {
  // Cuma handle GET
  if (event.request.method !== 'GET') return;

  // Skip request ke Apps Script (biar data selalu fresh)
  if (event.request.url.includes('script.google.com') ||
      event.request.url.includes('googleusercontent.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Kalau berhasil, update cache untuk file utama
        if (response.ok && URLS_TO_CACHE.some(u => event.request.url.endsWith(u.split('/').pop()))) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Kalau gagal fetch (offline), ambil dari cache
        return caches.match(event.request);
      })
  );
});
