// ══════════════════════════════════════════════════════════════
// KIAA Portal — Service Worker v1
// ══════════════════════════════════════════════════════════════

const CACHE_VERSION = 'kiaa-site-v5-consentimento-20261109';

const STATIC_ASSETS = [
    '/ga4-consent.js',
    '/ga4-consent.css',
    '/',
    '/index.html',
    '/novo-index.html',
    '/site-3a.html',
    '/site-negocios.html',
    '/site-complexidade.html',
    '/site-desportivo.html',
    '/site-consultoria.html',
    '/site-eleitoral.html',
    '/site-estrategicos.html',
    '/site-governamental.html',
    '/site-auditoria.html',
    '/portal-login.html',
    '/portal-dashboard.html',
    '/portal-kpi.html',
    '/inteligencia.html',
    '/blog.html',
    '/calculadora.html',
    '/esg.html',
    '/cartao-digital.html',
    '/mapa-brasil-kiaa.html',
    '/area-administrativo.html',
    '/area-agrario.html',
    '/area-ambiental.html',
    '/area-civil.html',
    '/area-consumidor.html',
    '/area-empresarial.html',
    '/area-penal.html',
    '/area-trabalhista.html',
    '/area-tributario.html',
    '/area-page.css',
    '/offline.html',
    '/manifest.json',
    '/style.css',
    '/script.js',
    '/img/icone-positivo-verde.png',
    '/img/logo-horizontal-branca.png',
    '/img/logo-horizontal-positiva.png',
    '/data/advbox.json'
];

// ── Install: pre-cache static assets ──
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// ── Activate: clean old caches ──
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_VERSION)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// ── Fetch: strategy based on request type ──
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip cross-origin API calls (e.g., Supabase)
    if (url.origin !== self.location.origin) return;

    // HTML pages: Network-first with offline fallback
    if (request.headers.get('accept')?.includes('text/html') || url.pathname.endsWith('.html')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_VERSION).then(cache => cache.put(request, clone));
                    return response;
                })
                .catch(() =>
                    caches.match(request).then(cached => cached || caches.match('/offline.html'))
                )
        );
        return;
    }

    // Static assets (CSS, JS, images): Cache-first
    if (
        url.pathname.endsWith('.css') ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.jpg') ||
        url.pathname.endsWith('.jpeg') ||
        url.pathname.endsWith('.svg') ||
        url.pathname.endsWith('.webp') ||
        url.pathname.endsWith('.woff2') ||
        url.pathname.endsWith('.woff')
    ) {
        event.respondWith(
            caches.match(request).then(cached => {
                if (cached) return cached;
                return fetch(request).then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_VERSION).then(cache => cache.put(request, clone));
                    return response;
                });
            })
        );
        return;
    }

    // Everything else: Network-first
    event.respondWith(
        fetch(request)
            .then(response => {
                const clone = response.clone();
                caches.open(CACHE_VERSION).then(cache => cache.put(request, clone));
                return response;
            })
            .catch(() => caches.match(request))
    );
});

