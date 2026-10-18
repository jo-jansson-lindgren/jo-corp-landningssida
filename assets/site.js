(function () {
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- mobile nav toggle ----------
  var nav = document.querySelector('.nav');
  var toggle = document.querySelector('.nav-toggle');
  var navMenu = document.getElementById('navmenu');
  if (nav && toggle && navMenu) {
    function closeMenu() {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
    function openMenu() {
      nav.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
    }
    toggle.addEventListener('click', function () {
      if (nav.classList.contains('open')) closeMenu(); else openMenu();
    });
    navMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 820) closeMenu();
    });
  }

  // ---------- scroll reveal ----------
  var items = document.querySelectorAll('.reveal');
  if (items.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
      items.forEach(function (el) { io.observe(el); });
    }
  }

  // ---------- timeline fills as you scroll ----------
  var tl = document.querySelector('[data-timeline]');
  if (tl && !reduceMotion) {
    var ticking = false;
    var updateTl = function () {
      var r = tl.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var p = (vh * 0.75 - r.top) / (r.height + vh * 0.1);
      tl.style.setProperty('--tl', Math.max(0, Math.min(1, p)).toFixed(3));
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(updateTl); }
    }, { passive: true });
    window.addEventListener('resize', updateTl);
    updateTl();
  } else if (tl) {
    tl.style.setProperty('--tl', '1');
  }

  // ---------- cookie notice ----------
  // Cloudflare Web Analytics, Metricool and Umami are cookie-free (no personal data stored), and the
  // fonts are served from our own domain. We still show a short, honest notice with
  // a link to the full cookie policy, and remember the choice so it only shows once.
  try {
    var CONSENT_KEY = 'jo-cookie-consent';
    var already = window.localStorage.getItem(CONSENT_KEY);
    if (!already) {
      var bar = document.createElement('div');
      bar.className = 'cookie-bar';
      bar.setAttribute('role', 'region');
      bar.setAttribute('aria-label', 'Om kakor på den här webbplatsen');
      bar.innerHTML =
        '<p>Vi använder inga spårande kakor. Sidan använder bara kakfri besöksstatistik (Cloudflare Web Analytics, Metricool och Umami). ' +
        '<a href="cookies.html">Läs mer i vår cookiepolicy</a>.</p>' +
        '<div class="cookie-bar-actions">' +
        '<button type="button" class="btn-primary" data-cookie-accept>Jag förstår</button>' +
        '</div>';
      document.body.appendChild(bar);
      window.setTimeout(function () { bar.classList.add('show'); }, 500);
      bar.querySelector('[data-cookie-accept]').addEventListener('click', function () {
        try { window.localStorage.setItem(CONSENT_KEY, 'acknowledged'); } catch (e) {}
        bar.classList.remove('show');
        window.setTimeout(function () { bar.remove(); }, 500);
      });
    }
  } catch (e) {
    // localStorage unavailable (private browsing etc.) — fail silently, no banner.
  }

  // ---------- Umami: cookie-free visit + click statistics ----------
  // Paste the Website ID from Umami (Settings → Websites → Edit) below. Empty = Umami is off.
  var UMAMI_ID = 'abd0c4ee-d6bd-4f78-8da4-59212f03ae7c';
  if (UMAMI_ID) {
    var um = document.createElement('script');
    um.defer = true;
    um.src = 'https://cloud.umami.is/script.js';
    um.setAttribute('data-website-id', UMAMI_ID);
    um.setAttribute('data-domains', 'jo-corp-landningssida.pages.dev');
    document.head.appendChild(um);
  }

  // Sends a named event to Umami. Never sends what people type — only which button was used and where.
  function track(name, data) {
    try {
      if (window.umami && typeof window.umami.track === 'function') window.umami.track(name, data);
    } catch (e) {}
  }
  function page() {
    var p = location.pathname.replace(/^\//, '').replace(/\.html$/, '');
    return p || 'index';
  }
  function placeOf(el) {
    if (el.closest('header, .nav')) return 'meny';
    if (el.closest('footer')) return 'sidfot';
    if (el.closest('.hero')) return 'toppen';
    return 'innehåll';
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : null;
    if (!t) return;

    if (t.closest('.jo-chat-launcher')) { track('Chatt öppnad', { sida: page() }); return; }
    if (t.closest('[data-news-open]')) { track('Film spelad', { sida: page() }); return; }

    var a = t.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';

    if (href.indexOf('mailto:') === 0) {
      track('Mejl-klick', { sida: page(), plats: placeOf(a) });
    } else if (href.indexOf('tel:') === 0) {
      track('Ring-klick', { sida: page(), plats: placeOf(a) });
    } else if (a.closest('.tier')) {
      var tierName = a.closest('.tier').querySelector('.tier-name');
      track('Paket valt', { paket: tierName ? tierName.textContent.trim() : 'okänt' });
    } else if (/kontakt\.html/.test(href) && a.matches('.btn-primary, .btn-ghost, .nav-cta')) {
      track('Knapp till kontakt', { sida: page(), plats: placeOf(a), text: a.textContent.trim().slice(0, 40) });
    } else if (/^https?:/.test(href) && a.hostname !== location.hostname) {
      track('Extern länk', { till: a.hostname, sida: page() });
    }
  });

  document.addEventListener('submit', function (e) {
    if (e.target.closest && e.target.closest('[class*="jo-chat"]')) track('Chattfråga skickad', { sida: page() });
  });

})();
