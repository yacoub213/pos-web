// ============================================================
// SERVICE WORKER — نظام المبيعات PWA
// ============================================================
const CACHE_NAME = 'pos-v1';
const ASSETS = [
  './pos.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&family=Tajawal:wght@300;400;500;700;800&display=swap',
];

// ── تثبيت: حفظ الملفات في Cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(() => {
        // إذا فشل تحميل الخط (أوفلاين) نكمل بدونه
        return cache.add('./pos.html');
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

// ── الطلبات: Cache First ثم الشبكة
self.addEventListener('fetch', event => {
  // تجاهل طلبات Chrome extensions وغيرها
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // حفظ الملفات الجديدة في Cache
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // أوفلاين وغير موجود في Cache → رجّع الصفحة الرئيسية
        return caches.match('./pos.html');
      });
    })
  );
});

// ── رسائل من التطبيق
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
