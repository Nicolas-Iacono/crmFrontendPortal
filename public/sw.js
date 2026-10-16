/* Service worker mínimo para que el portal se pueda instalar.
   No cachea el listado: las fichas tienen que seguir saliendo frescas. */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {});
