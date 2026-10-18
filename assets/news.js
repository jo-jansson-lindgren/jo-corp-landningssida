// Nyhetsruta om lanseringsfilmen + filmspelare (öppnas från rutan eller med #film i adressen)
(function () {
  var SEEN_KEY = 'jo-news-seen';
  var NEWS_ID = 'launch-2026-10';
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
      '<div class="jo-film-bar"><p>46 sekunder om hur vi håller ditt företags sociala medier igång.</p>' +
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
      '<p class="jo-news-text">46 sekunder om vad vi gör, med vår egen röst.</p>' +
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

  function init() {
    if (location.hash === '#film') { openFilm(); return; }
    if (seen()) return;
    buildNews();
    setTimeout(function () { news.classList.add('show'); }, 1200);
  }

  window.addEventListener('hashchange', function () { if (location.hash === '#film') openFilm(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
