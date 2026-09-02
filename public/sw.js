const CACHE_NAME = "my-webapp-shell-v4";

// 설치 정보(매니페스트)는 /api/ 아래에 있지만, 이것이 없으면 안드로이드가
// 인터넷 없이 '앱 설치'를 띄우지 못합니다. 다른 /api/는 그대로 두고 이것만 담습니다.
const MANIFEST_PATH = "/api/webapp-manifest";
const APP_SHELL = [
  "/",
  "/app-icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
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

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) {
    if (url.pathname !== MANIFEST_PATH) return;
    // 이름이나 색을 바꾸면 새 것을 받아야 하니 인터넷을 먼저 봅니다.
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, copy))
              .catch(() => undefined);
          }
          return response;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!url.searchParams.has("project")) {
            const copy = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, copy))
              .catch(() => undefined);
          }
          return response;
        })
        .catch(
          () =>
            caches.match(request).then(
              (cached) => cached || caches.match("/"),
            ),
        ),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, copy))
              .catch(() => undefined);
          }
          return response;
        }),
    ),
  );
});

/**
 * 화면이 "이 파일들을 미리 담아 달라"고 부탁할 때입니다.
 *
 * 학교망이 이 주소를 막는 곳이 있습니다. 막히지 않는 곳에서 한 번 담아 두면,
 * 그 뒤로는 인터넷이 막혀도 위의 fetch 처리가 담아 둔 것을 꺼내 주어 앱이
 * 열립니다. 다 담았는지 답을 돌려주어 화면이 초록불을 켤 수 있게 합니다.
 */
self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "precache" || !Array.isArray(data.urls)) return;
  const port = event.ports && event.ports[0];
  const reply = (message) => port && port.postMessage(message);

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        const failed = [];
        await Promise.all(
          data.urls.map(async (url) => {
            try {
              const response = await fetch(url, { cache: "no-cache" });
              if (!response.ok) throw new Error(String(response.status));
              await cache.put(url, response);
            } catch {
              failed.push(url);
            }
          }),
        );
        reply({ ok: failed.length === 0, failed });
      })
      .catch(() => reply({ ok: false, failed: data.urls })),
  );
});
