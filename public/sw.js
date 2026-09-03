const VERSION = "finora-pwa-2026-09-04-v1";
const SHELL = ["/offline", "/ar/service-point", "/en/service-point", "/manifest.webmanifest", "/finora-icon-192.png", "/finora-icon-512.png", "/finora-icon-maskable-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      const copy = response.clone(); caches.open(VERSION).then((cache) => cache.put(request, copy)); return response;
    }).catch(async () => (await caches.match(request)) || (await caches.match("/offline"))));
    return;
  }
  if (url.pathname.startsWith("/_next/static/") || /\.(?:png|svg|ico|woff2?)$/.test(url.pathname)) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => { const copy = response.clone(); caches.open(VERSION).then((cache) => cache.put(request, copy)); return response; })));
  }
});
