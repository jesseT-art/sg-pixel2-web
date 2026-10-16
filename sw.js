const CACHE_NAME = "sg-pixel2-static-v19";
/* 站点可能部署在子路径下（例如 GitHub Pages 的 /sg-pixel2-web/），
   所以静态资源路径统一基于 service worker 的作用域动态计算。
   部署在根目录时 BASE 为 "/"，行为与之前完全一致。 */
var BASE = new URL(self.registration.scope).pathname.replace(/\/+$/, "/");
const CORE_ASSETS = [
  "assets/wiki/wiki.css",
  "assets/app.min.js",
  "assets/logo.png",
  "assets/logo-blue.png",
  "assets/mascot.png",
  "assets/icon-192.png",
  "assets/icon-512.png"
].map(function (p) { return BASE + p; });

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
  if (request.mode === "navigate") return;
  if (url.pathname.indexOf(BASE + "assets/") !== 0 && url.pathname !== BASE + "manifest.json") return;

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
