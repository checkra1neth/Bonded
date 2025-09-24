const CACHE_NAME = "bonded-pwa-v1";
const OFFLINE_URL = "/offline";
const PRECACHE_URLS = [
  "/",
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icon.png",
  "/logo.png",
  "/splash.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
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
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

async function cacheResponse(request, response) {
  if (!response || response.status !== 200 || response.type === "opaque") {
    return response;
  }

  const cache = await caches.open(CACHE_NAME);
  cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const acceptHeader = request.headers.get("accept") ?? "";
  const isHTMLRequest = acceptHeader.includes("text/html");

  if (isHTMLRequest) {
    event.respondWith(
      fetch(request)
        .then((response) => cacheResponse(request, response))
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match(request);
          return cached ?? cache.match(OFFLINE_URL);
        }),
    );
    return;
  }

  const shouldPrioritizeNetwork =
    request.url.includes("/_next/") ||
    ["script", "style", "font"].includes(request.destination);

  if (shouldPrioritizeNetwork) {
    event.respondWith(
      fetch(request)
        .then((response) => cacheResponse(request, response))
        .catch(() => caches.match(request)),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        fetch(request)
          .then((response) => cacheResponse(request, response))
          .catch(() => undefined);
        return cached;
      }

      return fetch(request)
        .then((response) => cacheResponse(request, response))
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const offlineFallback = await cache.match(OFFLINE_URL);
          return offlineFallback ?? Response.error();
        });
    }),
  );
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (error) {
    payload = {};
  }

  const title = payload.title ?? "Bonded";
  const options = {
    body: payload.body,
    icon: payload.icon ?? "/icon.png",
    badge: payload.badge ?? "/icon.png",
    tag: payload.tag,
    data: { ...(payload.data ?? {}), url: payload.url ?? payload.data?.url },
    actions: payload.actions,
    renotify: payload.renotify ?? true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  const notification = event.notification;
  const data = notification.data ?? {};
  notification.close();

  const targetUrl = typeof data.url === "string" ? data.url : "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.postMessage({ type: "notification:click", data });
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
        return undefined;
      }),
  );
});
