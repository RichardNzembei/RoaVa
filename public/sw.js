/*
  Roava service worker — skeleton (M0).
  Goals for v1: installability + offline TICKET VIEWING. Tickets are scanned at
  meeting points where signal is poor, so a confirmed ticket must render with no
  network (Section 8). This is intentionally minimal; it will grow with M5.
*/
const VERSION = "roava-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const TICKET_CACHE = `${VERSION}-tickets`;

// App-shell assets safe to precache. Keep this lean (performance budget).
const SHELL_ASSETS = ["/", "/offline", "/icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(VERSION))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isTicketRequest(url) {
  return url.pathname.startsWith("/tickets/");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle same-origin GETs; never cache payment or API mutations.
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Tickets: cache-first so they survive offline, refresh in the background.
  if (isTicketRequest(url)) {
    event.respondWith(staleWhileRevalidate(request, TICKET_CACHE));
    return;
  }

  // Navigations: network-first, fall back to cache, then the offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/offline")),
        ),
    );
    return;
  }

  // Static assets: cache-first.
  if (["style", "script", "image", "font"].includes(request.destination)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
  }
});

function staleWhileRevalidate(request, cacheName) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.status === 200) cache.put(request, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
}
