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

  // ---------- animated stat counters + bars in the hero impact card ----------
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-target'));
    var decimals = parseInt(el.getAttribute('data-decimal') || '0', 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) {
      el.textContent = target.toFixed(decimals) + suffix;
      return;
    }
    var start = null;
    var duration = 1200;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = target * eased;
      el.textContent = value.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var impactEl = document.querySelector('.impact');
  if (impactEl) {
    var counted = false;
    function triggerImpact() {
      if (counted) return;
      counted = true;
      impactEl.querySelectorAll('.js-count').forEach(animateCount);
      impactEl.querySelectorAll('.stat-bar i').forEach(function (bar) {
        var target = bar.getAttribute('data-target');
        requestAnimationFrame(function () { bar.style.width = target + '%'; });
      });
    }
    if (reduceMotion || !('IntersectionObserver' in window)) {
      triggerImpact();
    } else {
      var impactIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { triggerImpact(); impactIo.disconnect(); }
        });
      }, { threshold: 0.4 });
      impactIo.observe(impactEl);
    }
  }
})();
