/* Productivity Hub service worker — PWA installability + offline shell + push */

const STATIC_CACHE = "ph-static-v1";
const PAGE_CACHE = "ph-pages-v1";

// Pre-cache the app shell and core icons/fonts on install.
const SHELL_URLS = [
  "/",
  "/app",
  "/auth/login",
  "/manifest.webmanifest",
  "/icons/icon_192.png",
  "/icons/icon_512.png",
  "/icons/icon_maskable_512.png",
  "/icons/icon_180.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PAGE_CACHE);
      await Promise.all(
        SHELL_URLS.map((url) =>
          fetch(url, { cache: "reload" })
            .then((res) => {
              if (res.ok) cache.put(url, res);
            })
            .catch(() => {})
        )
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== PAGE_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// Stale-while-revalidate for navigations: serve cached shell instantly, then
// refresh it in the background so the next load is current.
async function handleNavigate(request) {
  const cached = await caches.match(request, { ignoreSearch: true });
  const network = fetch(request)
    .then((res) => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(PAGE_CACHE).then((cache) => cache.put(request, clone));
      }
      return res;
    })
    .catch(() => null);

  if (cached) {
    network.then((fresh) => {
      if (fresh) {
        // If the fresh response differs, re-render is handled by the page itself
      }
    });
    return cached;
  }
  return network;
}

// Static hashed assets (fonts, JS, CSS under /_next/static) are immutable —
// cache first, never hit the network on repeat visits.
async function handleStatic(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const res = await fetch(request);
  if (res.ok) {
    const clone = res.clone();
    caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
  }
  return res;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.origin !== location.origin) return;

  // API calls: never cache — always go to network.
  if (url.pathname.startsWith("/api/")) return;

  if (url.pathname.startsWith("/_next/static")) {
    event.respondWith(handleStatic(request));
    return;
  }

  // Only handle document navigations (app shell). Images/fonts from /_next
  // are covered by handleStatic.
  if (request.mode === "navigate") {
    event.respondWith(handleNavigate(request));
  }
});

/* ── Push notifications ─────────────────────────────────────────────────── */

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Productivity Hub", body: "You have a notification" };
  }

  const title = data.title || "Productivity Hub";
  const options = {
    body: data.body || "",
    icon: data.icon || "/icons/icon_192.png",
    badge: data.badge || "/icons/icon_192.png",
    tag: data.tag || "productivity-hub",
    data: { url: data.url || "/app" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/app";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});