const CACHE_NAME = "yyc3-ai-call-v1";
const STATIC_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/yyc3-icons/pwa/icon-192x192.png",
  "/yyc3-icons/pwa/icon-512x512.png",
  "/yyc3-icons/favicon/favicon.ico",
  "/yyc3-icons/favicon/favicon-32x32.png",
];

const PRECACHE_NAME = "yyc3-precache-v1";
const RUNTIME_CACHE = "yyc3-runtime-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key !== PRECACHE_NAME &&
                key !== RUNTIME_CACHE &&
                key !== CACHE_NAME
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  if (url.origin !== location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => {
            if (request.destination === "image") {
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#1e293b" width="200" height="200"/><text fill="#64748b" font-size="14" x="50%" y="50%" text-anchor="middle" dy=".3em">YYC³</text></svg>',
                { headers: { "Content-Type": "image/svg+xml" } }
              );
            }
            return new Response("Offline", { status: 503 });
          });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetched;
    })
  );
});
