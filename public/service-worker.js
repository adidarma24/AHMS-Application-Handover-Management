// Service worker minimal untuk AHMS. Tujuannya cuma dua: bikin app
// "installable" (butuh SW terdaftar) dan cache app-shell dasar supaya
// tetap bisa dibuka (walau data tidak update) saat koneksi hilang.
// Tidak melakukan caching agresif ke request API/data supaya PIC/Reviewer
// selalu lihat data terbaru saat online.
//
// BASE dihitung dari lokasi file ini sendiri (self.location), bukan
// hardcoded "/", supaya tetap benar kalau app di-deploy ke subpath
// (mis. lewat FIGMA_PUBLIC_URL di vite.config.ts). File statis di public/
// tidak diproses Vite jadi tidak bisa pakai import.meta.env di sini.
const BASE = new URL(".", self.location).pathname;

const CACHE_NAME = "ahms-shell-v1";
const SHELL_ASSETS = [BASE, `${BASE}manifest.json`, `${BASE}icon-192.png`, `${BASE}icon-512.png`];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match(BASE)))
  );
});