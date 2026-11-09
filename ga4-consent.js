/* KIAA: basic consent mode. No Google tag is loaded before an explicit opt-in. */
(function () {
    'use strict';
    if (window.KIAAConsent) return;
    const ID = 'G-SH839K2LD3';
    const KEY = 'kiaa-analytics-consent-v1';
    const VERSION = 1;
    const MAX_AGE = 180 * 24 * 60 * 60 * 1000;
    const PRIVATE_PAGE = /^\/portal(?:[-/.]|$)/i.test(location.pathname);
    let allowed = false;
    let started = false;
    let panel, status, settings, close;
    window['ga-disable-' + ID] = true;

    function readChoice() {
        try {
            // A stored opt-in is not reused if this browser can no longer save a withdrawal.
            localStorage.setItem(KEY + '-check', '1');
            localStorage.removeItem(KEY + '-check');
            const value = JSON.parse(localStorage.getItem(KEY));
            const age = Date.now() - value.updatedAt;
            return value.version === VERSION && typeof value.analytics === 'boolean' &&
                Number.isFinite(value.updatedAt) && age >= 0 && age < MAX_AGE ? value : null;
        } catch (_) { return null; }
    }

    function clearAnalyticsCookies() {
        const names = document.cookie.split(';').map(c => c.trim().split('=')[0])
            .filter(name => /^(_ga(?:_|$)|_gid$|_gat(?:_|$))/.test(name));
        const parts = location.hostname.split('.');
        const domains = [''];
        if (!/^\d+(\.\d+){3}$/.test(location.hostname)) {
            for (let i = 0; i < parts.length - 1; i++) domains.push(parts.slice(i).join('.'));
        }
        const paths = ['/'];
        const segments = location.pathname.split('/').filter(Boolean);
        for (let i = 1; i <= segments.length; i++) paths.push('/' + segments.slice(0, i).join('/'));
        for (const name of names) for (const domain of domains) for (const path of paths) {
            document.cookie = name + '=; Max-Age=0; path=' + path +
                (domain ? '; domain=' + domain : '') + '; SameSite=Lax';
        }
    }

    function enable() {
        if (PRIVATE_PAGE || started) return;
        allowed = true;
        started = true;
        window['ga-disable-' + ID] = false;
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { if (allowed) window.dataLayer.push(arguments); };
        const denied = {analytics_storage:'denied', ad_storage:'denied',
            ad_user_data:'denied', ad_personalization:'denied'};
        window.gtag('consent', 'default', denied);
        window.gtag('consent', 'update', Object.assign({}, denied, {analytics_storage:'granted'}));
        window.gtag('js', new Date());
        window.gtag('config', ID, {
            allow_google_signals:false,
            allow_ad_personalization_signals:false,
            page_location:location.origin + location.pathname,
            page_referrer:'',
            cookie_path:'/'
        });
        const script = document.createElement('script');
        script.id = 'kiaa-google-tag';
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
        script.onerror = function () {
            if (status) status.textContent = 'Não foi possível carregar as métricas. O acesso ao site continua disponível.';
        };
        document.head.appendChild(script);
    }

    function disable() {
        allowed = false;
        window['ga-disable-' + ID] = true;
        clearAnalyticsCookies();
        // Unload a previously accepted tag. No denied-state Google ping is requested.
        if (started) location.reload();
    }

    function save(analytics) {
        let stored = true;
        try { localStorage.setItem(KEY, JSON.stringify({version:VERSION, analytics, updatedAt:Date.now()})); }
        catch (_) { stored = false; }
        if (analytics) enable(); else disable();
        panel.hidden = true;
        settings.focus();
        status.textContent = (analytics ? 'Métricas permitidas.' : 'Métricas recusadas.') +
            (stored ? '' : ' Sua escolha não pôde ser salva neste navegador; será solicitada novamente na próxima página.');
    }

    function init() {
        const css = document.createElement('link');
        css.rel = 'stylesheet'; css.href = '/ga4-consent.css'; document.head.appendChild(css);
        const root = document.createElement('div');
        root.id = 'kiaa-consent';
        root.innerHTML = '<button type="button" id="kiaa-consent-settings" aria-controls="kiaa-consent-panel">Privacidade e métricas</button>' +
            '<section id="kiaa-consent-panel" aria-labelledby="kiaa-consent-title" hidden>' +
            '<h2 id="kiaa-consent-title" tabindex="-1">Você permite métricas de navegação?</h2>' +
            '<p>Com sua permissão, usamos o Google Analytics para medir visitas e navegação. Recusar não impede o acesso ao site nem o contato com o escritório. Esta escolha não habilita publicidade.</p>' +
            '<details><summary>O que será usado</summary><p>O Google Analytics pode usar cookies, identificadores e informações do dispositivo para medir o uso do site. A escolha fica salva neste navegador por até 180 dias e pode ser alterada neste botão. Não inclua informações pessoais em endereços de páginas. As páginas do portal não usam esta medição.</p>' +
            '<p>Dúvidas: <a href="mailto:advogados@kairoicaro.com.br">advogados@kairoicaro.com.br</a>. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacidade do Google</a>.</p></details>' +
            '<div class="kiaa-consent-actions"><button type="button" id="kiaa-consent-reject">Recusar métricas</button><button type="button" id="kiaa-consent-accept">Aceitar métricas</button></div>' +
            '<button type="button" id="kiaa-consent-close" hidden>Fechar preferências</button></section>' +
            '<p id="kiaa-consent-status" role="status" aria-live="polite"></p>';
        document.body.appendChild(root);
        panel = document.getElementById('kiaa-consent-panel');
        status = document.getElementById('kiaa-consent-status');
        settings = document.getElementById('kiaa-consent-settings');
        close = document.getElementById('kiaa-consent-close');
        settings.addEventListener('click', function () {
            panel.hidden = false; close.hidden = !readChoice();
            document.getElementById('kiaa-consent-title').focus();
        });
        close.addEventListener('click', function () { panel.hidden = true; settings.focus(); });
        document.getElementById('kiaa-consent-reject').addEventListener('click', function () { save(false); });
        document.getElementById('kiaa-consent-accept').addEventListener('click', function () { save(true); });
        const choice = readChoice();
        if (choice && choice.analytics) enable(); else { disable(); panel.hidden = !(!choice && !PRIVATE_PAGE); }
        function reconcile() {
            const next = readChoice();
            if (next && next.analytics) enable(); else disable();
            panel.hidden = Boolean(next) || PRIVATE_PAGE;
        }
        window.addEventListener('storage', function (event) {
            if (event.key === KEY || event.key === null) reconcile();
        });
        window.addEventListener('pageshow', reconcile);
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'visible') reconcile();
        });
    }

    window.KIAAConsent = Object.freeze({version:VERSION});
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
    else init();
}());
