// ============================================================
// SERVICE WORKER — نظام المبيعات PWA
// ============================================================
const CACHE_NAME = 'pos-v32';
const ASSETS = [
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&family=Tajawal:wght@300;400;500;700;800&display=swap',
];

// ── تثبيت: حفظ الملفات في Cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(() => {
        // إذا فشل تحميل الخط (أوفلاين) نكمل بدونه
        return cache.add('./index.html');
      });
    })
  );
  self.skipWaiting();
});

// ── تفعيل: حذف الكاش القديم
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── الطلبات: Network First للـ HTML، Cache First للباقي
self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith('http')) return;

  const isHTML = event.request.url.endsWith('.html') || 
                 event.request.url.endsWith('/') ||
                 event.request.headers.get('accept')?.includes('text/html');

  if (isHTML) {
    // Network First للـ HTML — دائماً أحدث نسخة
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
  } else {
    // Cache First للصور والخطوط وغيرها
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200 && response.type !== 'opaque') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => caches.match('./index.html'));
      })
    );
  }
});

// ── رسائل من التطبيق
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
