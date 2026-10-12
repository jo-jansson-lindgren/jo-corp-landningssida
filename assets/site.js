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

  // ---------- hero shapes follow the pointer (desktop only) ----------
  var heroEl = document.querySelector('.hero');
  var orbs = document.querySelector('.hero-orbs');
  if (heroEl && orbs && !reduceMotion && window.matchMedia('(hover:hover)').matches) {
    // spring instead of a CSS transition: the shapes keep their momentum and settle naturally
    var target = { x: 0, y: 0 }, pos = { x: 0, y: 0 }, vel = { x: 0, y: 0 }, raf = 0, last = 0, acc = 0;
    var TICK = 1000 / 60; // fixed 60 Hz physics step, so the feel is the same on 60 and 120 Hz screens
    var step = function (now) {
      acc += Math.min(now - (last || now - TICK), 64); // cap the catch-up after a stalled tab
      last = now;
      for (; acc >= TICK; acc -= TICK) {
        vel.x = (vel.x + (target.x - pos.x) * 0.06) * 0.8; // stiffness, damping
        vel.y = (vel.y + (target.y - pos.y) * 0.06) * 0.8;
        pos.x += vel.x;
        pos.y += vel.y;
      }
      var moving = Math.abs(target.x - pos.x) > 0.05 || Math.abs(vel.x) > 0.05 ||
                   Math.abs(target.y - pos.y) > 0.05 || Math.abs(vel.y) > 0.05;
      orbs.style.transform = 'translate3d(' + pos.x.toFixed(1) + 'px,' + pos.y.toFixed(1) + 'px,0)';
      if (moving) { raf = requestAnimationFrame(step); } else { raf = 0; last = 0; acc = 0; }
    };
    // measure the hero once per entry (in page coordinates, so scrolling doesn't stale it)
    // instead of forcing a layout read on every mousemove
    var box = null;
    var measure = function () {
      var r = heroEl.getBoundingClientRect();
      box = { left: r.left + window.scrollX, top: r.top + window.scrollY, w: r.width, h: r.height };
    };
    heroEl.addEventListener('mouseenter', measure);
    window.addEventListener('resize', function () { box = null; });
    heroEl.addEventListener('mousemove', function (e) {
      if (!box) measure();
      target.x = ((e.pageX - box.left) / box.w - 0.5) * -28;
      target.y = ((e.pageY - box.top) / box.h - 0.5) * -28;
      if (!raf) raf = requestAnimationFrame(step);
    });
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
