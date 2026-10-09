/* Restrained, optional motion on the existing HTML. No pinning, hidden projects,
   injected controls, dependencies or scroll interception. */
(() => {
  'use strict';
  const root = document.documentElement;
  if (getComputedStyle(root).getPropertyValue('--spatial-experience-ready').trim() !== '1') return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 1200px) and (min-height: 700px) and (hover: hover) and (pointer: fine)');
  const sections = ['services', 'ways-to-work', 'about', 'care', 'process', 'work', 'experience', 'contact']
    .map(id => document.getElementById(id));
  const hero = document.querySelector('.hero');
  if (!hero || sections.some(section => !section) || !window.IntersectionObserver || !window.ResizeObserver) return;
  const projects = [...sections[5].querySelectorAll('.work-card')];
  const planes = [], near = new Set(), bounds = new Map();
  const clamp = value => Math.max(0, Math.min(1, value));
  let frame = 0, needsMeasure = true, enabled = false, full = false, printing = false;
  let sectionObserver, sizeObserver;

  function plane(selector, distance, stagger = 2) {
    document.querySelectorAll(selector).forEach((element, index) => {
      element.classList.add('spatial-plane');
      planes.push({ element, section: element.closest('section'), distance: distance + (index % 3) * stagger });
    });
  }

  function measure() {
    // Normalize the small applied translation so repeated measures cannot drift.
    const read = element => {
      const rect = element.getBoundingClientRect();
      const offset = parseFloat(element.style.getPropertyValue('--plane-y')) || 0;
      return { top: rect.top + window.scrollY - offset, height: rect.height };
    };
    [hero, ...sections, ...projects].forEach(element => bounds.set(element, read(element)));
    planes.forEach(item => Object.assign(item, read(item.element)));
    needsMeasure = false;
  }

  function render() {
    frame = 0;
    if (!enabled || document.hidden) return;
    if (needsMeasure) measure();
    const y = window.scrollY, height = window.innerHeight;
    if (full && near.has(hero)) {
      const p = clamp(y / bounds.get(hero).height);
      hero.style.setProperty('--hero-background-y', `${p * 20}px`);
      hero.style.setProperty('--hero-image-scale', String(1.018 - p * .013));
      hero.style.setProperty('--hero-copy-y', `${-p * 12}px`);
    }
    const about = sections[2];
    if (full && near.has(about)) {
      const box = bounds.get(about);
      const p = clamp((y + height - box.top) / (height + box.height));
      about.style.setProperty('--portrait-y', `${(1 - p) * 6}px`);
      about.style.setProperty('--portrait-scale', String(1.015 - p * .015));
    }
    if (full) projects.forEach(project => {
      if (!near.has(project) || project.contains(document.activeElement)) return;
      const box = bounds.get(project);
      const p = clamp((y + height - box.top) / (height + box.height));
      // Only the image plane moves. Project text, links and layout stay put.
      project.style.setProperty('--project-image-y', `${(.5 - p) * 12}px`);
      project.style.setProperty('--project-image-scale', String(1.04 - p * .02));
    });
    planes.forEach(({ element, section, top, height: elementHeight, distance }) => {
      if (!near.has(section) || element.contains(document.activeElement)) return;
      const entry = clamp((y + height - top) / (height * .65 + Math.min(elementHeight, 240)));
      element.style.setProperty('--plane-y', `${(1 - entry) * distance * (full ? 1 : .25)}px`);
    });
  }

  function requestUpdate() {
    if (enabled && !frame) frame = requestAnimationFrame(render);
  }
  function requestMeasure() { needsMeasure = true; requestUpdate(); }

  function disable() {
    enabled = false;
    cancelAnimationFrame(frame);
    frame = 0;
    sectionObserver?.disconnect();
    sizeObserver?.disconnect();
    root.classList.remove('spatial-enabled', 'spatial-desktop');
    planes.splice(0).forEach(({ element }) => {
      element.classList.remove('spatial-plane');
      element.style.removeProperty('--plane-y');
    });
    projects.forEach(project => {
      project.classList.remove('spatial-project');
      project.style.removeProperty('--project-image-y');
      project.style.removeProperty('--project-image-scale');
    });
    [hero, ...sections, ...projects].forEach(element => {
      element.classList.remove('is-near');
      ['--hero-background-y', '--hero-image-scale', '--hero-copy-y', '--portrait-y', '--portrait-scale']
        .forEach(key => element.style.removeProperty(key));
    });
    near.clear();
    full = false;
  }

  function configure() {
    disable();
    if (reduced.matches || printing) return;
    enabled = true;
    full = desktop.matches;
    root.classList.add('spatial-enabled');
    plane('#services .side-copy', 6);
    plane('#services .card', 10);
    plane('.about-copy', 6);
    plane('.cred-item', 4);
    plane('#care .card', 4);
    plane('#work .work-card', 8);
    plane('#experience .experience-card', 4);
    if (full) {
      root.classList.add('spatial-desktop');
      projects.forEach(project => project.classList.add('spatial-project'));
    }
    sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) near.add(entry.target);
        else near.delete(entry.target);
        entry.target.classList.toggle('is-near', entry.isIntersecting);
      });
      requestUpdate();
    }, { rootMargin: '120px 0px' });
    [hero, ...sections, ...projects].forEach(element => sectionObserver.observe(element));
    sizeObserver = new ResizeObserver(requestMeasure);
    [hero, ...sections].forEach(section => sizeObserver.observe(section));
    needsMeasure = true;
    requestUpdate();
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestMeasure, { passive: true });
  window.addEventListener('pageshow', requestMeasure);
  document.addEventListener('visibilitychange', requestUpdate);
  document.addEventListener('focusin', requestUpdate);
  document.addEventListener('focusout', requestUpdate);
  document.addEventListener('load', requestMeasure, true);
  window.addEventListener('beforeprint', () => { printing = true; configure(); });
  window.addEventListener('afterprint', () => { printing = false; configure(); });
  reduced.addEventListener('change', configure);
  desktop.addEventListener('change', configure);
  document.fonts?.ready.then(requestMeasure);
  configure();
})();
