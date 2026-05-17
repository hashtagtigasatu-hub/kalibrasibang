const CACHE_NAME = "kalibrasibang-v1";
const ASSETS = [
  "/kalibrasibang/",
  "/kalibrasibang/Index.html",
  "/kalibrasibang/logokbwebapp.png",
  "/kalibrasibang/manifest.json"
];

// Install — cache assets utama
self.addEventListener("install", function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — hapus cache lama
self.addEventListener("activate", function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — network first untuk API, cache first untuk assets
self.addEventListener("fetch", function(e) {
  // API calls ke Apps Script — selalu network
  if (e.request.url.includes("script.google.com")) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Google Fonts — network first, fallback cache
  if (e.request.url.includes("fonts.googleapis.com") ||
      e.request.url.includes("fonts.gstatic.com")) {
    e.respondWith(
      fetch(e.request).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }

  // Assets lokal — cache first, fallback network
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(response) {
        return caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, response.clone());
          return response;
        });
      });
    })
  );
});
