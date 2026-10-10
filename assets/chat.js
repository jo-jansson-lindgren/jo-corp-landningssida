/* Chattassistent – JO Marketing Solutions */
(function () {
  'use strict';

  var API = '/api/chat';
  var STORE_KEY = 'jo-chat-history';
  var MAX_LEN = 500;
  var MAX_USER_MSGS = 15; // per besök, ihop med serverns gräns
  var GREETING = 'Hej! Jag är en AI-assistent och svarar på frågor om vad JO Marketing Solutions gör, paketen och priserna. Vad undrar du?';
  var CHIPS = ['Vad kostar det?', 'Vad ingår i paketen?', 'Finns det bindningstid?', 'Hur kommer vi igång?'];

  var SCRIPT = document.currentScript;
  var history = [];
  var busy = false;
  var open = false;

  function load() {
    try {
      var raw = sessionStorage.getItem(STORE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) history = parsed.slice(-20);
    } catch (e) { history = []; }
  }
  function save() {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(history.slice(-20))); } catch (e) { /* inget lagringsutrymme – ok */ }
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  // ---- bygg gränssnittet ----
  var launcher = el('button', 'jo-chat-launcher');
  launcher.type = 'button';
  launcher.setAttribute('aria-haspopup', 'dialog');
  launcher.setAttribute('aria-expanded', 'false');
  launcher.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>' +
    '<span>Ställ en fråga</span>';

  var panel = el('div', 'jo-chat-panel');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Chatt med JO Marketing Solutions');
  panel.setAttribute('aria-hidden', 'true');
  panel.setAttribute('inert', '');

  var head = el('div', 'jo-chat-head');
  var title = el('div');
  title.appendChild(el('strong', null, 'JO Marketing Solutions'));
  title.appendChild(el('span', null, 'AI-assistent · svarar på frågor om oss'));
  var closeBtn = el('button', 'jo-chat-close', '×');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Stäng chatten');
  head.appendChild(title);
  head.appendChild(closeBtn);

  var log = el('div', 'jo-chat-log');
  log.setAttribute('role', 'log');
  log.setAttribute('aria-live', 'polite');

  var form = el('form', 'jo-chat-form');
  var input = el('textarea');
  input.rows = 1;
  input.maxLength = MAX_LEN;
  input.placeholder = 'Skriv din fråga…';
  input.setAttribute('aria-label', 'Din fråga');
  var send = el('button', null, 'Skicka');
  send.type = 'submit';
  form.appendChild(input);
  form.appendChild(send);

  var foot = el('div', 'jo-chat-foot');
  foot.innerHTML = 'Svaren skapas av en AI och kan vara fel. För bindande besked, <a href="kontakt.html">kontakta oss</a>.';

  panel.appendChild(head);
  panel.appendChild(log);
  panel.appendChild(form);
  panel.appendChild(foot);

  // ---- meddelanden ----
  function addMsg(role, text, extraClass) {
    var m = el('div', 'jo-chat-msg ' + role + (extraClass ? ' ' + extraClass : ''), text);
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
    return m;
  }

  function addChips() {
    var wrap = el('div', 'jo-chat-chips');
    CHIPS.forEach(function (c) {
      var b = el('button', null, c);
      b.type = 'button';
      b.addEventListener('click', function () { wrap.remove(); ask(c); });
      wrap.appendChild(b);
    });
    log.appendChild(wrap);
  }

  function render() {
    log.textContent = '';
    addMsg('bot', GREETING);
    if (!history.length) addChips();
    history.forEach(function (m) { addMsg(m.role === 'user' ? 'user' : 'bot', m.content); });
  }

  function setBusy(v) {
    busy = v;
    send.disabled = v;
    input.disabled = v;
  }

  var FALLBACK = 'Det gick inte att svara just nu. Mejla oss gärna på jack.walter.jansson@gmail.com så återkommer vi.';

  function ask(text) {
    text = (text || '').trim().slice(0, MAX_LEN);
    if (!text || busy) return;
    var userCount = history.filter(function (m) { return m.role === 'user'; }).length;
    var chips = log.querySelector('.jo-chat-chips');
    if (chips) chips.remove();
    addMsg('user', text);
    history.push({ role: 'user', content: text });
    save();

    if (userCount >= MAX_USER_MSGS) {
      addMsg('bot', 'Nu har vi pratat en stund. För fler frågor, mejla oss på jack.walter.jansson@gmail.com.');
      return;
    }

    setBusy(true);
    var typing = addMsg('bot', 'Skriver', 'typing');

    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history.slice(-8) }),
    })
      .then(function (r) {
        return r.json().then(function (d) { return { ok: r.ok, status: r.status, data: d }; });
      })
      .then(function (res) {
        typing.remove();
        if (res.ok && res.data && res.data.reply) {
          history.push({ role: 'assistant', content: res.data.reply });
          save();
          addMsg('bot', res.data.reply);
        } else if (res.status === 429) {
          addMsg('bot', 'Många frågor på kort tid. Vänta en stund, eller mejla oss på jack.walter.jansson@gmail.com.');
        } else {
          addMsg('bot', FALLBACK);
        }
      })
      .catch(function () {
        typing.remove();
        addMsg('bot', FALLBACK);
      })
      .then(function () {
        setBusy(false);
        if (open) input.focus();
      });
  }

  // ---- öppna / stäng ----
  function setOpen(v) {
    open = v;
    panel.classList.toggle('open', v);
    panel.setAttribute('aria-hidden', v ? 'false' : 'true');
    if (v) panel.removeAttribute('inert'); else panel.setAttribute('inert', '');
    launcher.hidden = v;
    launcher.setAttribute('aria-expanded', v ? 'true' : 'false');
    if (v) { input.focus(); log.scrollTop = log.scrollHeight; }
    else launcher.focus();
  }

  launcher.addEventListener('click', function () { setOpen(true); });
  closeBtn.addEventListener('click', function () { setOpen(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && open) setOpen(false);
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = input.value;
    input.value = '';
    ask(v);
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  function init() {
    // Ladda stilen relativt scriptets plats.
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    var me = SCRIPT || document.querySelector('script[src$="chat.js"]');
    link.href = me && me.src ? me.src.replace(/chat\.js(\?.*)?$/, 'chat.css') : 'assets/chat.css';
    document.head.appendChild(link);

    load();
    render();
    document.body.appendChild(launcher);
    document.body.appendChild(panel);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
