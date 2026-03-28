const CACHE_NAME = "xthex-v1";
const ICON_PATH = "/icons/icon-192x192.png";
const PRECACHE_URLS = ["/offline.html", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return undefined;
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("/offline.html").then((cached) => {
          if (cached) {
            return cached;
          }
          return new Response("Offline", {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        })
      )
    );
    return;
  }

  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

self.addEventListener("push", (event) => {
  let title = "XtheX";
  let body = "";
  let url = "/";

  if (event.data) {
    try {
      const payload = event.data.json();
      title = payload.title || title;
      body = payload.body || payload.message || "";
      if (typeof payload.url === "string") {
        url = payload.url;
      }
    } catch {
      const text = event.data.text();
      if (text) {
        body = text;
      }
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body || "새 알림이 있습니다 · New notification",
      icon: ICON_PATH,
      badge: ICON_PATH,
      tag: "xthex-notification",
      renotify: true,
      data: { url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const raw =
    event.notification.data && event.notification.data.url
      ? String(event.notification.data.url)
      : "/";
  const origin = self.location.origin;
  const fullUrl = raw.startsWith("http") ? raw : `${origin}${raw.startsWith("/") ? "" : "/"}${raw}`;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          try {
            if (new URL(client.url).origin === origin && "focus" in client) {
              return client.focus().then(() => {
                if (typeof client.navigate === "function") {
                  return client.navigate(fullUrl);
                }
                return undefined;
              });
            }
          } catch {
            /* ignore invalid client url */
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(fullUrl);
        }
        return undefined;
      })
  );
});
