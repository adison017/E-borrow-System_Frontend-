// Minimal Service Worker compatible with Vite build output
const CACHE_NAME = 'equipment-app-v1';

self.addEventListener('install', (event) => {
	event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
	event.waitUntil((async () => {
		const keys = await caches.keys();
		await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
		await self.clients.claim();
	})());
});

// Cache-first for same-origin GET requests to built assets; network-first otherwise
self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);
	const isSameOrigin = url.origin === self.location.origin;
	const isAsset = isSameOrigin && (/\/assets\//.test(url.pathname) || /\.(css|js|png|jpg|jpeg|gif|svg|ico|webp|mp3|woff2?)$/i.test(url.pathname));

	if (isAsset) {
		event.respondWith((async () => {
			const cache = await caches.open(CACHE_NAME);
			const cached = await cache.match(request);
			if (cached) return cached;
			const response = await fetch(request);
			if (response.ok && response.status !== 206) {
				cache.put(request, response.clone());
			}
			return response;
		})());
	} else {
		event.respondWith(fetch(request).catch(() => caches.match('/')));
	}
});