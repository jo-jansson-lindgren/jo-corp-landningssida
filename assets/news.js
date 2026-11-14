// Nyhetsruta om lanseringsfilmen + filmspelare (öppnas från rutan eller med #film i adressen)
// + stor lanseringsruta för Turbinable.

// PÅ/AV för Turbinable-rutan. false = den gamla filmrutan visas precis som förut.
// Sätt till true på lanseringsdagen. Förhandsvisa när den är av: lägg till ?turbinable=1 i adressen (bara på localhost).
var TURBINABLE_LAUNCH = false;

(function () {
  var SEEN_KEY = 'jo-news-seen';
  var NEWS_ID = 'launch-2026-10-v2'; // ny film 2026-10-24 – visas även för den som stängt den förra
  var VIDEO = 'media/jo-launch-1x1.mp4';
  var POSTER = 'media/jo-launch-1x1-poster.jpg';

  function seen() {
    try { return localStorage.getItem(SEEN_KEY) === NEWS_ID; } catch (e) { return false; }
  }
  function markSeen() {
    try { localStorage.setItem(SEEN_KEY, NEWS_ID); } catch (e) {}
  }

  var playIcon = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>';
  var closeIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  // ---------- filmspelaren ----------
  var film = null;
  function buildFilm() {
    film = document.createElement('dialog');
    film.className = 'jo-film';
    film.setAttribute('aria-label', 'JO Marketing Solutions – vår nya film');
    film.innerHTML =
      '<button type="button" class="jo-film-close" aria-label="Stäng filmen">' + closeIcon + '</button>' +
      '<video controls playsinline preload="none" poster="' + POSTER + '">' +
      '<source src="' + VIDEO + '" type="video/mp4" />' +
      'Din webbläsare kan inte spela upp filmen.</video>' +
      '<div class="jo-film-bar"><p>37 sekunder om hur vi håller ditt företags sociala medier igång.</p>' +
      '<a class="btn-primary" href="kontakt.html">Kontakta oss ' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></div>';
    document.body.appendChild(film);
    var video = film.querySelector('video');
    film.querySelector('.jo-film-close').addEventListener('click', function () { film.close(); });
    // klick utanför filmen stänger
    film.addEventListener('click', function (e) { if (e.target === film) film.close(); });
    film.addEventListener('close', function () {
      video.pause();
      if (location.hash === '#film') history.replaceState(null, '', location.pathname + location.search);
    });
  }
  function openFilm() {
    if (!film) buildFilm();
    if (typeof film.showModal !== 'function') { location.href = VIDEO; return; }
    hideNews();
    markSeen();
    film.showModal();
    var video = film.querySelector('video');
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }

  // ---------- nyhetsrutan ----------
  var news = null;
  function hideNews() {
    if (news) news.classList.remove('show');
  }
  function buildNews() {
    news = document.createElement('aside');
    news.className = 'jo-news';
    news.setAttribute('aria-label', 'Nyhet');
    news.innerHTML =
      '<button type="button" class="jo-news-thumb" data-news-open aria-label="Spela filmen">' +
      '<img src="' + POSTER + '" alt="" width="84" height="84" loading="lazy" /><span class="play">' + playIcon + '</span></button>' +
      '<div class="jo-news-body">' +
      '<span class="jo-news-tag">Nyhet</span>' +
      '<p class="jo-news-title">Se vår nya film</p>' +
      '<p class="jo-news-text">37 sekunder om vad vi gör, med vår egen röst.</p>' +
      '<button type="button" class="btn-primary" data-news-open>Se filmen ' + playIcon + '</button>' +
      '</div>' +
      '<button type="button" class="jo-news-close" aria-label="Stäng nyheten">' + closeIcon + '</button>';
    document.body.appendChild(news);
    news.querySelectorAll('[data-news-open]').forEach(function (b) { b.addEventListener('click', openFilm); });
    news.querySelector('.jo-news-close').addEventListener('click', function () {
      markSeen();
      hideNews();
    });
  }

  // ---------- Turbinable-lanseringen ----------
  var LAUNCH_KEY = 'jo-turbinable-seen';
  var LAUNCH_ID = 'turbinable-launch-2026-11';
  var LAUNCH_URL = 'https://turbinable.com/sv/?utm_source=jo&ref=jo';
  var LAUNCH_SKIP = /\/(404|integritetspolicy|anvandarvillkor|cookies)(\.html)?\/?$/;

  function launchPreview() {
    // Förhandsvisningen fungerar bara på den egna datorn, så att ingen besökare ser rutan före lanseringen.
    if (!/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return false;
    try { return new URLSearchParams(location.search).get('turbinable') === '1'; } catch (e) { return false; }
  }
  function launchSeen() {
    try { return localStorage.getItem(LAUNCH_KEY) === LAUNCH_ID; } catch (e) { return false; }
  }
  function launchMarkSeen() {
    try { localStorage.setItem(LAUNCH_KEY, LAUNCH_ID); } catch (e) {}
  }

  var arrowIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  function openLaunch(preview) {
    if (document.querySelector('.jo-launch')) return;
    var d = document.createElement('dialog');
    if (typeof d.showModal !== 'function') return; // mycket gamla webbläsare: ingen ruta alls
    d.className = 'jo-launch';
    d.setAttribute('aria-labelledby', 'jo-launch-title');
    d.setAttribute('aria-describedby', 'jo-launch-text');
    d.innerHTML =
      '<div class="jo-launch-box" tabindex="-1" autofocus>' +
      '<div class="jo-launch-main">' +
      '<p class="jo-launch-tag">Nyhet från JO Marketing Solutions</p>' +
      '<h2 class="jo-launch-title" id="jo-launch-title">Vi släpper Turbinable</h2>' +
      '<div id="jo-launch-text">' +
      '<p class="jo-launch-text">Turbinable är en AI-agent som skriver, designar och publicerar dina inlägg. Varje vecka.</p>' +
      '<p class="jo-launch-text">Vi öppnar snart. Skriv upp dig nu. De 200 första får 30 % rabatt de första tre månaderna.</p>' +
      '</div>' +
      '<div class="jo-launch-actions">' +
      '<a class="jo-launch-go" href="' + LAUNCH_URL + '">Skriv upp mig ' + arrowIcon + '</a>' +
      '<button type="button" class="jo-launch-later">Inte nu</button>' +
      '</div>' +
      '</div>' +
      '<div class="jo-launch-offer" aria-hidden="true">' +
      '<span class="jo-launch-logo">Turbinable</span>' +
      '<span class="jo-launch-pct">30&nbsp;%</span>' +
      '<span class="jo-launch-offer-text">rabatt i tre månader för de 200 första</span>' +
      '</div>' +
      '<button type="button" class="jo-launch-close" aria-label="Stäng">' + closeIcon + '</button>' +
      '</div>';
    document.body.appendChild(d);

    var opener = document.activeElement;
    function shut() { d.close(); }
    d.querySelector('.jo-launch-close').addEventListener('click', shut);
    d.querySelector('.jo-launch-later').addEventListener('click', shut);
    // klick på den mörka bakgrunden stänger
    d.addEventListener('click', function (e) { if (e.target === d) shut(); });
    d.querySelector('.jo-launch-go').addEventListener('click', function () { if (!preview) launchMarkSeen(); });
    d.addEventListener('close', function () {
      if (!preview) launchMarkSeen();
      d.remove();
      if (opener && opener.focus && document.contains(opener)) { try { opener.focus({ preventScroll: true }); } catch (e) {} }
    });
    d.showModal();
  }

  function initLaunch() {
    if (launchPreview()) { setTimeout(function () { openLaunch(true); }, 600); return; }
    if (LAUNCH_SKIP.test(location.pathname) || launchSeen()) return;
    // Visas strax efter att sidan laddats, även på startsidan (väntar inte på turen).
    // Cookie-rutan är ingen modal: den göms medan lanseringsrutan är öppen (se news.css)
    // och syns igen när rutan stängs, med sin vanliga logik.
    var go = function () {
      setTimeout(function () {
        if (document.querySelector('dialog[open]')) return; // filmen eller något annat är öppet
        openLaunch(false);
      }, 1500);
    };
    if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
  }

  function init() {
    if (location.hash === '#film') { openFilm(); return; }
    if (TURBINABLE_LAUNCH || launchPreview()) { initLaunch(); return; }
    if (seen()) return;
    buildNews();
    var show = function () { setTimeout(function () { news.classList.add('show'); }, 1200); };
    if (window.joAfterTour) window.joAfterTour(show); else show();
  }

  window.addEventListener('hashchange', function () { if (location.hash === '#film') openFilm(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
