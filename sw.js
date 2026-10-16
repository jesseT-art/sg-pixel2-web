const CACHE_NAME = "sg-pixel2-static-v18";
const CORE_ASSETS = [
  "/assets/wiki/wiki.css",
  "/assets/app.min.js",
  "/assets/logo.png",
  "/assets/logo-blue.png",
  "/assets/mascot.png",
  "/assets/icon-192.png",
  "/assets/icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(CORE_ASSETS).catch(function () {});
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (key) {
        return key.indexOf("sg-pixel2-static-") === 0 && key !== CACHE_NAME;
      }).map(function (key) {
        return caches.delete(key);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (e) {
  var request = e.request;
  if (request.method !== "GET") return;

  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.indexOf("/api/") === 0 || request.mode === "navigate") return;
  if (url.pathname.indexOf("/assets/") !== 0 && url.pathname !== "/manifest.json") return;

  e.respondWith(
    caches.match(request, { ignoreSearch: true }).then(function (cached) {
      var network = fetch(request).then(function (response) {
        if (response && response.ok) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(request, copy);
          });
        }
        return response;
      }).catch(function () {
        return cached || new Response("", { status: 503, statusText: "Offline" });
      });

      if (cached) {
        e.waitUntil(network.catch(function () {}));
        return cached;
      }
      return network;
    })
  );
});
