// Start page (index.html): the start phone straightens as you scroll away, the wall of
// posts drifts while its phone steps through the five posts, and the numbers count up with the scroll.
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // follow the page's own smooth scroll (Lenis) when it runs, so effects move in the same frame as the page
  var onScroll = function (fn) {
    if (window.joLenis) { window.joLenis.on('scroll', fn); return; }
    var queued = false;
    window.addEventListener('scroll', function () {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(function () { queued = false; fn(); });
    }, { passive: true });
  };

  // ---------- phone depth: metal slices behind the front give the frame its thickness ----------
  document.querySelectorAll('[data-tilt]').forEach(function (holder) {
    for (var z = 1; z <= 11; z++) {
      var edge = document.createElement('span');
      edge.className = 'iphone-edge';
      edge.style.setProperty('--z', String(z));
      holder.insertBefore(edge, holder.firstChild);
    }
  });

  // ---------- the phones lean a little toward the mouse, easing in rather than snapping ----------
  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var root = document.documentElement;
    var tx = 0, ty = 0, cx = 0, cy = 0, leaning = false;
    var lean = function () {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      root.style.setProperty('--mx', cx.toFixed(4));
      root.style.setProperty('--my', cy.toFixed(4));
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) window.requestAnimationFrame(lean);
      else leaning = false;
    };
    window.addEventListener('pointermove', function (e) {
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
      if (!leaning) { leaning = true; window.requestAnimationFrame(lean); }
    }, { passive: true });
  }

  // ---------- start screen: phone turns to face you as the hero scrolls out ----------
  var hero = document.querySelector('.l-hero');
  if (hero && !reduceMotion) {
    var update = function () {
      var p = Math.max(0, Math.min(1, window.scrollY / (hero.offsetHeight * 0.8)));
      hero.style.setProperty('--hp', p.toFixed(3));
    };
    onScroll(update);
    update();
  }

  // ---------- posts: build one screen per post, switch as each text reaches the middle ----------
  var screen = document.querySelector('[data-show-screen]');
  var steps = Array.prototype.slice.call(document.querySelectorAll('[data-post]'));
  if (screen && steps.length) {
    var avatar = document.querySelector('.ig-avatar');
    var avatarHtml = avatar ? avatar.outerHTML : '';
    var status = document.querySelector('.ig-status');
    var statusHtml = status ? status.outerHTML : '';
    var icons =
      '<svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-7.5-10.4A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.7c0 5.8-7.5 10.4-7.5 10.4Z" fill="#f4f4f5"/></svg>' +
      '<svg viewBox="0 0 24 24"><path d="M20 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-4.2A8 8 0 1 1 20 11.5Z" fill="none" stroke="#f4f4f5" stroke-width="1.9" stroke-linejoin="round"/></svg>' +
      '<svg viewBox="0 0 24 24"><path d="M21 3 3 10.5l7 2.5 2.5 7L21 3Z" fill="none" stroke="#f4f4f5" stroke-width="1.9" stroke-linejoin="round"/></svg>';
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

    var html = steps.map(function (st, i) {
      var d = st.dataset;
      var comments = parseInt(d.comments, 10) || 0;
      return '<div class="ig-view' + (i === 0 ? ' is-on' : '') + '">' + statusHtml +
        '<div class="ig-post-head">' + avatarHtml + 'studio.i.kalmar</div>' +
        '<img class="ig-photo" src="' + esc(d.src) + '" alt="" />' +
        '<div class="ig-actions">' + icons + '</div>' +
        '<p class="ig-likes">' + esc(d.likes) + ' gillamarkeringar</p>' +
        '<p class="ig-caption"><b>studio.i.kalmar</b>' + esc(d.title) + '</p>' +
        (comments ? '<p class="ig-sub">Visa alla ' + comments + ' kommentarer</p>' : '') +
        '<p class="ig-sub ig-date">' + esc(d.date) + '</p>' +
        '</div>';
    }).join('');
    screen.innerHTML = html + '<span class="iphone-island"></span><span class="iphone-home"></span>';
    var views = screen.querySelectorAll('.ig-view');

    var dots = document.querySelectorAll('.l-wall-dots li');
    var current = -1;
    var show = function (i) {
      if (i === current) return;
      current = i;
      steps.forEach(function (st, k) { st.classList.toggle('is-on', k === i); });
      views.forEach(function (v, k) { v.classList.toggle('is-on', k === i); });
      dots.forEach(function (d, k) { d.classList.toggle('is-on', k === i); });
    };
    show(0);

    // the wall is held still while you scroll through it: the columns drift (CSS reads --wp)
    // and the phone moves on to the next post every fifth of the way
    var wall = document.querySelector('[data-wall]');
    if (wall) {
      var updateWall = function () {
        var r = wall.getBoundingClientRect();
        var span = Math.max(1, wall.offsetHeight - window.innerHeight);
        var p = Math.max(0, Math.min(1, -r.top / span));
        if (!reduceMotion) wall.style.setProperty('--wp', p.toFixed(4));
        show(Math.min(steps.length - 1, Math.floor(p * steps.length)));
      };
      onScroll(updateWall);
      window.addEventListener('resize', updateWall);
      updateWall();
    }
  }

  // ---------- numbers count up with the scroll ----------
  // Scroll slowly and they climb with you; scroll fast and they catch up in a quick glide instead of
  // jumping. They are always finished by the time the numbers sit in the upper half of the screen,
  // and never count back down. The HTML holds the final numbers, so without script nothing is wrong.
  var stats = document.querySelector('[data-stats]');
  if (stats && !reduceMotion) {
    var nums = Array.prototype.slice.call(stats.querySelectorAll('[data-count]')).map(function (el) {
      return { el: el, end: parseFloat(el.getAttribute('data-count')) };
    });
    var goal = 0, shown = 0, gliding = false;
    var paint = function () {
      var k = 1 - Math.pow(1 - shown, 3); // ease-out: fast at first, settling on the real number
      nums.forEach(function (n) { n.el.textContent = String(Math.round(n.end * k)); });
    };
    var glide = function () {
      shown += (goal - shown) * 0.14;
      if (goal - shown < 0.002) shown = goal;
      paint();
      if (shown < goal) window.requestAnimationFrame(glide); else gliding = false;
    };
    var follow = function () {
      var vh = window.innerHeight;
      var p = (vh * 0.92 - stats.getBoundingClientRect().top) / (vh * 0.5);
      p = Math.max(0, Math.min(1, p));
      if (p <= goal) return; // only ever counts up
      goal = p;
      if (!gliding) { gliding = true; window.requestAnimationFrame(glide); }
    };
    // a visitor who lands below the numbers (a link, a reload) sees them finished straight away
    var vh0 = window.innerHeight;
    if (stats.getBoundingClientRect().top < vh0 * 0.42) { goal = shown = 1; } else { follow(); shown = goal; }
    paint();
    onScroll(follow);
  }
})();
