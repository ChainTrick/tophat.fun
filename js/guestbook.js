/* ═══════════════════════════════════════════
   TopHat.fun — Guestbook
   Static guestbook backed by restful-api.dev (no account, no API key).
   Object id below is the shared "tophat-guestbook" record.
   ═══════════════════════════════════════════ */
(function () {
  'use strict';

  var OBJECT_ID = 'ff808181a09d98f701a0c3ce67d460e6';
  var API_URL = 'https://api.restful-api.dev/objects/' + OBJECT_ID;
  var MAX_ENTRIES = 200;      // keep the book from growing forever
  var MAX_NAME = 40;
  var MAX_MESSAGE = 500;

  var listEl = document.getElementById('gbEntries');
  var formEl = document.getElementById('gbForm');
  var nameInput = document.getElementById('gbName');
  var msgInput = document.getElementById('gbMessage');
  var statusEl = document.getElementById('gbStatus');
  var countEl = document.getElementById('gbCount');
  var submitBtn = document.getElementById('gbSubmit');

  if (!listEl || !formEl) return; // not the guestbook page

  /* ── helpers ─────────────────────────────── */

  function setStatus(kind, text) {
    statusEl.className = 'gb-status gb-status-' + kind;
    statusEl.textContent = text;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function timeAgo(ts) {
    var diff = Date.now() - ts;
    if (diff < 60e3) return 'just now';
    var m = Math.floor(diff / 60e3);
    if (m < 60) return m + ' min ago';
    var h = Math.floor(m / 60);
    if (h < 24) return h + (h === 1 ? ' hour ago' : ' hours ago');
    var d = Math.floor(h / 24);
    if (d < 30) return d + (d === 1 ? ' day ago' : ' days ago');
    return new Date(ts).toLocaleDateString();
  }

  function entryHtml(e) {
    var name = escapeHtml(e.name || 'Anonymous');
    var msg = escapeHtml(e.message || '');
    var ts = Number(e.ts) || Date.now();
    return (
      '<article class="gb-entry">' +
        '<div class="gb-entry-head">' +
          '<span class="gb-entry-name">🎩 ' + name + '</span>' +
          '<time class="gb-entry-time" datetime="' + new Date(ts).toISOString() + '">' + timeAgo(ts) + '</time>' +
        '</div>' +
        '<p class="gb-entry-msg">' + msg.replace(/\n/g, '<br>') + '</p>' +
      '</article>'
    );
  }

  function renderEntries(entries) {
    if (!entries.length) {
      listEl.innerHTML = '<p class="gb-empty">No signatures yet — be the first to sign the book ✦</p>';
    } else {
      listEl.innerHTML = entries.map(entryHtml).join('');
    }
    countEl.textContent = String(entries.length);
  }

  /* ── load ─────────────────────────────────── */

  function load() {
    setStatus('loading', 'Opening the guestbook…');
    fetch(API_URL, { headers: { Accept: 'application/json' } })
      .then(function (r) {
        if (!r.ok) throw new Error('http ' + r.status);
        return r.json();
      })
      .then(function (obj) {
        var entries = (obj && obj.data && Array.isArray(obj.data.entries)) ? obj.data.entries : [];
        renderEntries(entries);
        setStatus('ok', '');
      })
      .catch(function () {
        setStatus('error', 'The guestbook is unreachable right now. Please try again in a moment.');
      });
  }

  /* ── sign ─────────────────────────────────── */

  function sign(e) {
    e.preventDefault();
    var name = nameInput.value.trim().slice(0, MAX_NAME);
    var message = msgInput.value.trim().slice(0, MAX_MESSAGE);
    if (!message) {
      setStatus('error', 'Write a little something first ✦');
      return;
    }

    submitBtn.disabled = true;
    setStatus('loading', 'Signing the book…');

    // Read-modify-write: fetch current entries, prepend ours, PUT back.
    fetch(API_URL)
      .then(function (r) {
        if (!r.ok) throw new Error('http ' + r.status);
        return r.json();
      })
      .then(function (obj) {
        var entries = (obj && obj.data && Array.isArray(obj.data.entries)) ? obj.data.entries : [];
        entries.unshift({ id: Date.now() + '-' + Math.random().toString(36).slice(2, 8), name: name || 'Anonymous', message: message, ts: Date.now() });
        if (entries.length > MAX_ENTRIES) entries = entries.slice(0, MAX_ENTRIES);

        return fetch(API_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'tophat-guestbook', data: { entries: entries } })
        }).then(function (r) {
          if (!r.ok) throw new Error('http ' + r.status);
          return r.json();
        });
      })
      .then(function () {
        formEl.reset();
        setStatus('ok', '✦ Signed! Thank you for stopping by.');
        load(); // refresh so the new entry shows at the top
      })
      .catch(function (err) {
        var msg = err && err.message === 'http 405' || err && err.message === 'http 429'
          ? 'The guestbook is taking a short break (daily limit reached). Please try again tomorrow.'
          : 'Could not sign the book just now. Please try again in a moment.';
        setStatus('error', msg);
      })
      .finally(function () {
        submitBtn.disabled = false;
      });
  }

  formEl.addEventListener('submit', sign);
  load();
})();
