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

  // ---------- cookie notice ----------
  // Cloudflare Web Analytics and Metricool are cookie-free (no personal data stored), and Google
  // Fonts is loaded on every page load. We still show a short, honest notice with
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
        '<p>Vi använder inga spårande kakor. Sidan laddar typsnitt från Google Fonts och kakfri besöksstatistik (Cloudflare Web Analytics och Metricool). ' +
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

})();
