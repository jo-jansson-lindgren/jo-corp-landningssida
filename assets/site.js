(function () {
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // the start page (body class "calm") skips the flying-block effects below
  var calm = document.body.classList.contains('calm');

  // ---------- a page opened from a link always starts at the top ----------
  try {
    var navEntry = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    if (navEntry && navEntry.type === 'navigate' && !location.hash) {
      window.scrollTo(0, 0);
      window.addEventListener('load', function () { window.scrollTo(0, 0); });
    }
  } catch (e) {}

  // ---------- sub pages: the same space backdrop as the start page, drifting slowly as you scroll ----------
  if (document.body.classList.contains('dark') && !document.querySelector('[data-tour]') && !calm) {
    var space = document.createElement('div');
    space.className = 'space-bg';
    space.setAttribute('aria-hidden', 'true');
    space.innerHTML = '<div class="space-stars"></div><div class="space-stars far"></div><div class="space-glow"></div>';
    document.body.insertBefore(space, document.body.firstChild);
    if (!reduceMotion) {
      var spaceTick = false;
      window.addEventListener('scroll', function () {
        if (spaceTick) return;
        spaceTick = true;
        window.requestAnimationFrame(function () {
          space.style.setProperty('--sy', String(Math.round(window.scrollY)));
          spaceTick = false;
        });
      }, { passive: true });
    }
  }

  // ---------- light "cloud" pages: soft light from above and two slow warm glows ----------
  if (document.body.classList.contains('cloud') && !document.querySelector('.l-backdrop')) {
    var backdrop = document.createElement('div');
    backdrop.className = 'l-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    backdrop.innerHTML = '<span class="l-beam"></span><span class="l-aura a1"></span><span class="l-aura a2"></span>';
    document.body.insertBefore(backdrop, document.body.firstChild);
  }

  // ---------- top bar: slides away while you scroll down, comes back as soon as you scroll up ----------
  var bar = document.querySelector('.nav');
  if (bar && document.body.classList.contains('cloud')) {
    var lastY = window.scrollY, barTick = false;
    var updateBar = function () {
      barTick = false;
      var y = window.scrollY;
      bar.classList.toggle('is-scrolled', y > 8);
      // a few pixels of slack so a trackpad's tiny jitters do not make it flicker
      if (Math.abs(y - lastY) < 6) return;
      bar.classList.toggle('is-hidden', y > lastY && y > 160);
      lastY = y;
    };
    window.addEventListener('scroll', function () {
      if (!barTick) { barTick = true; window.requestAnimationFrame(updateBar); }
    }, { passive: true });
    // keyboard users always see it: focus inside the bar brings it back
    bar.addEventListener('focusin', function () { bar.classList.remove('is-hidden'); });
    updateBar();
  }

  // ---------- keep the start-page tour quiet: no pop-ups until the visitor reaches its last chapter ----------
  var quietTour = document.querySelector('[data-tour]') || (calm ? document.querySelector('main') : null);
  var afterTourQueue = [];
  window.joAfterTour = function (fn) {
    if (!quietTour || window.joTourDone) { fn(); return; }
    afterTourQueue.push(fn);
  };
  if (quietTour) {
    document.documentElement.classList.add('tour-quiet');
    var checkTour = function () {
      var last = document.getElementById('kontakt');
      var at = last ? last.offsetTop : quietTour.offsetTop + quietTour.offsetHeight - window.innerHeight;
      if (window.scrollY < at - 10) return;
      window.joTourDone = true;
      window.removeEventListener('scroll', checkTour);
      document.documentElement.classList.remove('tour-quiet');
      afterTourQueue.splice(0).forEach(function (fn) { fn(); });
    };
    window.addEventListener('scroll', checkTour, { passive: true });
    window.addEventListener('load', checkTour);
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

  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  var useGsap = !!(gsap && ST) && !reduceMotion;
  if (useGsap) {
    gsap.registerPlugin(ST);
    document.documentElement.classList.add('gsap-on');
  }

  // ---------- smooth scrolling (Lenis): the page glides to a stop instead of jumping per wheel step ----------
  if (!reduceMotion && window.Lenis) {
    var lenis = new window.Lenis({
      // lerp: the page keeps easing toward where the wheel points, so several wheel steps blend into one glide
      // (the start page glides a little longer)
      lerp: calm ? 0.07 : 0.085,
      wheelMultiplier: calm ? 1 : 1.15,
      smoothWheel: true,
      prevent: function (node) { return !!(node.closest && node.closest('.jo-chat-panel, [data-lenis-prevent]')); }
    });
    window.joLenis = lenis;
    if (useGsap) {
      lenis.on('scroll', ST.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      var lenisRaf = function (time) { lenis.raf(time); window.requestAnimationFrame(lenisRaf); };
      window.requestAnimationFrame(lenisRaf);
    }
  }

  // ---------- every other section: the content bursts out from the middle of the screen ----------
  // Sections that fit on one screen are held still while their blocks fly out from the centre to
  // their places. Taller ones (long texts, mobile) let each block slide out from the centre line.
  function pickBlocks(sec) {
    var list = sec.querySelectorAll('.reveal');
    if (!list.length) list = sec.querySelectorAll(':scope > .wrap > *');
    var picked = Array.prototype.slice.call(list);
    return picked.filter(function (el) {
      for (var a = el.parentElement; a && a !== sec; a = a.parentElement) { if (picked.indexOf(a) > -1) return false; }
      return el.offsetHeight > 0;
    });
  }
  function offsetIn(el, root) {
    var x = 0, y = 0, e = el;
    while (e && e !== root) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    return { x: x, y: y };
  }
  // When a block has landed, hand its transform back to the stylesheet so hover lifts work again.
  // Blocks that already sit a little raised in CSS (the featured package) land exactly there.
  function release(els) { gsap.set(els, { clearProps: 'transform,translate,rotate,scale' }); }
  function baseY(el) {
    var t = window.getComputedStyle(el).transform;
    if (!t || t === 'none' || !window.DOMMatrix) return 0;
    return new DOMMatrix(t).m42;
  }
  if (useGsap && !calm) {
    // the page's opening section is already on screen at load, so it keeps its own simple entrance
    document.querySelectorAll('main > section:not(.page-hero)').forEach(function (sec) {
      var blocks = pickBlocks(sec);
      if (!blocks.length) return;
      blocks.forEach(function (el) { el._baseY = baseY(el); });
      var dx = function (el) { return sec.offsetWidth / 2 - (offsetIn(el, sec).x + el.offsetWidth / 2); };
      var dy = function (el) { return sec.offsetHeight / 2 - (offsetIn(el, sec).y + el.offsetHeight / 2); };
      if (sec.offsetHeight <= window.innerHeight * 0.95) {
        gsap.timeline({
          scrollTrigger: {
            trigger: sec, start: 'center center', end: '+=' + Math.round(window.innerHeight * 0.8),
            pin: true, scrub: 0.6, invalidateOnRefresh: true
          }
        })
          // fromTo, not from: with invalidateOnRefresh a from() would re-read its end state
          // while the blocks are still hidden, and they would stay hidden
          .fromTo(blocks, {
            x: function (i, el) { return dx(el); }, y: function (i, el) { return dy(el); },
            scale: 0.25, opacity: 0
          }, {
            x: 0, y: function (i, el) { return el._baseY; }, scale: 1, opacity: 1,
            duration: 1, stagger: 0.08, ease: 'power3.out',
            onComplete: function () { release(blocks); }
          })
          .to({}, { duration: 0.35 });
      } else {
        blocks.forEach(function (el) {
          gsap.fromTo(el, { x: function () { return dx(el) * 0.7; }, y: el._baseY, scale: 0.6, opacity: 0 }, {
            x: 0, y: el._baseY, scale: 1, opacity: 1, ease: 'power2.out',
            onComplete: function () { release(el); },
            scrollTrigger: { trigger: el, start: 'clamp(top 98%)', end: 'clamp(top 62%)', scrub: 0.5, invalidateOnRefresh: true }
          });
        });
      }
    });
    window.addEventListener('load', function () { ST.refresh(); });
  }

  // ---------- flow: every block drifts out from the middle of the screen as you scroll ----------
  // Blocks start bunched toward the centre line and slide out to their place (left ones left,
  // right ones right). Blocks already on screen at load just fade in, so nothing sits half-visible.
  if (!useGsap && !calm && !reduceMotion && 'requestAnimationFrame' in window) {
    var picked = [];
    document.querySelectorAll('main section:not(.chapter)').forEach(function (sec) {
      var list = sec.querySelectorAll('.reveal');
      if (!list.length) list = sec.querySelectorAll(':scope > .wrap > *, :scope > .wrap > * > *:not(h1):not(h2):not(p):not(span)');
      list.forEach(function (el) { picked.push(el); });
    });
    var flowItems = picked.filter(function (el) {
      if (el.closest('.tour, .marquee')) return false;
      for (var a = el.parentElement; a; a = a.parentElement) { if (picked.indexOf(a) > -1) return false; }
      return el.offsetHeight > 0;
    });
    if (flowItems.length) {
      var measureFlow = function () {
        document.documentElement.classList.remove('flow');
        var vw = window.innerWidth;
        var vhm = window.innerHeight;
        var maxScroll = document.documentElement.scrollHeight - vhm;
        flowItems.forEach(function (el) {
          var r = el.getBoundingClientRect();
          var dx = (r.left + r.width / 2) - vw / 2;
          el.style.setProperty('--fx', (-dx * 0.6).toFixed(1) + 'px');
          // where the block's top sits once the page is scrolled to the very bottom: the motion
          // must be finished by then, or blocks near the end would stay half-visible
          el._flowTop = r.top + window.scrollY;
          var lowest = el._flowTop - maxScroll;
          el._flowEnd = Math.min(vhm * 0.55, Math.max(0, lowest) - 2);
        });
        document.documentElement.classList.add('flow');
      };
      var vh0 = window.innerHeight;
      flowItems.forEach(function (el) {
        el.classList.add('flow-item');
        if (el.getBoundingClientRect().top < vh0 * 0.95) el.classList.add('flow-settled');
      });
      measureFlow();
      var flowTick = false;
      var updateFlow = function () {
        flowTick = false;
        var vh = window.innerHeight;
        var sy = window.scrollY;
        flowItems.forEach(function (el) {
          if (el.classList.contains('flow-settled')) return;
          var top = el._flowTop - sy;
          var p = (vh - top) / Math.max(40, vh - el._flowEnd);
          el.style.setProperty('--fp', Math.max(0, Math.min(1, p)).toFixed(3));
        });
      };
      updateFlow();
      window.addEventListener('scroll', function () {
        if (!flowTick) { flowTick = true; window.requestAnimationFrame(updateFlow); }
      }, { passive: true });
      // re-measure whenever the page changes size (fonts, images, the chat or news box loading in)
      var flowResize;
      var remeasure = function () {
        clearTimeout(flowResize);
        flowResize = setTimeout(function () { measureFlow(); updateFlow(); }, 150);
      };
      window.addEventListener('resize', remeasure);
      window.addEventListener('load', remeasure);
      if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(document.body);
    }
  }

  // ---------- end menu: mark the page you are on ----------
  var here = location.pathname.split('/').pop().replace(/\.html$/, '') || 'index';
  document.querySelectorAll('.endmenu a[data-page]').forEach(function (a) {
    if (a.getAttribute('data-page') === here) a.setAttribute('aria-current', 'page');
  });

  // ---------- cookie notice ----------
  // Cloudflare Web Analytics, Metricool and Umami are cookie-free (no personal data stored), and the
  // fonts are served from our own domain. We still show a short, honest notice with
  // a link to the full cookie policy, and remember the choice so it only shows once.
  window.joAfterTour(function () { try {
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
  } });

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
