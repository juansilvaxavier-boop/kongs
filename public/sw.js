const CACHE_NAME = "kongs-shell-v1";
const PRECACHE_URLS = ["/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Passthrough de rede (o site é dinâmico — não faz sentido servir
// páginas antigas do cache); só intercepta os ícones pré-cacheados
// acima. Para qualquer outra requisição, nem chama respondWith —
// assim o navegador trata a requisição normalmente (com seu próprio
// retry/erro de rede), em vez de o service worker cair num
// caches.match() vazio e devolver `undefined` pro respondWith, o que
// quebra a página inteira com "This page couldn't load" mesmo numa
// simples instabilidade momentânea de rede.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (!PRECACHE_URLS.includes(url.pathname)) return;

  event.respondWith(
    fetch(event.request).catch(async () => (await caches.match(event.request)) ?? fetch(event.request))
  );
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Kongs Campeonatos", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Kongs Campeonatos";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => c.url.includes(url));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
