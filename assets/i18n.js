/* Static locale pages and ordinary links remain usable without JavaScript. */
(() => {
  'use strict';
  const config = window.MVTJI18N;
  if (!config) return;
  const supported = ['en', 'es', 'ru', 'el'];
  const key = 'mvtj-language';
  const explicit = location.pathname.match(/^\/(en|es|ru|el)(?:\/|$)/);
  try {
    if (explicit) localStorage.setItem(key, explicit[1]);
    else {
      const saved = localStorage.getItem(key);
      if (supported.includes(saved) && saved !== 'en') {
        location.replace('/' + saved + '/' + (config.route ? config.route + '/' : '') + location.search + location.hash);
        return;
      }
    }
  } catch { /* Blocked storage must not prevent language selection. */ }
  const selectors = [...document.querySelectorAll('.language-selector')];
  document.querySelectorAll('[data-language]').forEach(link => {
    const update = () => {
      link.href = '/' + link.dataset.language + '/' + (config.route ? config.route + '/' : '') + location.search + location.hash;
    };
    update();
    addEventListener('hashchange', update);
    link.addEventListener('click', () => {
      try { localStorage.setItem(key, link.dataset.language); } catch { /* Optional persistence. */ }
    });
  });
  document.addEventListener('click', event => selectors.forEach(selector => {
    if (!selector.contains(event.target)) selector.open = false;
  }));
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    selectors.forEach(selector => {
      if (selector.open) { selector.open = false; selector.querySelector('summary').focus(); }
    });
  });
})();
