/* Same toggle, link-close and Escape behavior as the existing MVTJ homepage. */
(() => {
  'use strict';
  const navigationToggle = document.querySelector('.nav-toggle');
  const siteNavigation = document.querySelector('#site-navigation');
  if (!navigationToggle || !siteNavigation) return;
  function setNavigationOpen(isOpen) {
    siteNavigation.classList.toggle('is-open', isOpen);
    navigationToggle.setAttribute('aria-expanded', String(isOpen));
    navigationToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
  }
  navigationToggle.addEventListener('click', () => {
    setNavigationOpen(navigationToggle.getAttribute('aria-expanded') !== 'true');
  });
  siteNavigation.addEventListener('click', event => {
    if (event.target.closest('a')) setNavigationOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navigationToggle.getAttribute('aria-expanded') === 'true') {
      setNavigationOpen(false);
      navigationToggle.focus();
    }
  });
})();
