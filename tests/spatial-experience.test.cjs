// State/DOM contract tests, not a substitute for rendered-browser QA.
// Run: node tests/spatial-experience.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('assets/spatial-experience.js', 'utf8');

function fixture({ reduced = false, desktop = true, observers = true, inert = true, stylesheet = true } = {}) {
  const frames = new Map(), windowEvents = {}, documentEvents = {};
  const media = [{ matches: reduced, handlers: {} }, { matches: desktop, handlers: {} }];
  media.forEach(item => { item.addEventListener = (name, callback) => { item.handlers[name] = callback; }; });
  let nextFrame = 0, window, document;
  class Element {
    constructor(tag = 'div') {
      this.tagName = tag; this.children = []; this.attrs = {}; this.handlers = {}; this.top = 0; this.height = 500;
      const classes = new Set();
      this.classList = { add: (...names) => names.forEach(name => classes.add(name)),
        remove: (...names) => names.forEach(name => classes.delete(name)), contains: name => classes.has(name),
        toggle(name, force) { const add = force ?? !classes.has(name); if (add) classes.add(name); else classes.delete(name); } };
      const properties = new Map();
      this.style = { setProperty: (key, value) => properties.set(key, value),
        removeProperty: key => properties.delete(key), getPropertyValue: key => properties.get(key) };
      this.selectors = new Map(); this.multiselectors = new Map(); this.textContent = '';
    }
    set className(value) { value.split(' ').forEach(name => this.classList.add(name)); }
    append(child) { child.remove(); child.parent = this; this.children.push(child); }
    before(child) { child.remove(); child.parent = this.parent; this.parent.children.splice(this.parent.children.indexOf(this), 0, child); }
    remove() { if (this.parent) { this.parent.children.splice(this.parent.children.indexOf(this), 1); this.parent = null; } }
    setAttribute(key, value) { this.attrs[key] = value; }
    getAttribute(key) { return this.attrs[key]; }
    removeAttribute(key) { delete this.attrs[key]; }
    addEventListener(name, callback) { this.handlers[name] = callback; }
    querySelector(selector) { return this.selectors.get(selector); }
    querySelectorAll(selector) { return this.multiselectors.get(selector) ?? []; }
    closest() { return this.section; }
    contains(element) { return this === element || this.children.some(child => child.contains(element)); }
    focus() { document.activeElement = this; }
    scrollIntoView() { window.scrollY = this.top; }
    getBoundingClientRect() { return { top: this.top - window.scrollY + (parseFloat(this.style.getPropertyValue('--plane-y')) || 0), height: this.height }; }
    get offsetHeight() { return this.height; }
  }
  if (inert) Element.prototype.inert = false;
  const root = new Element('html'), body = new Element('body');
  const ids = ['services', 'ways-to-work', 'about', 'care', 'process', 'work', 'experience', 'contact'];
  const sections = new Map(ids.map((id, index) => {
    const node = new Element('section'); node.id = id; node.top = 1000 + index * 1000; node.section = node; body.append(node);
    return [id, node];
  }));
  const hero = new Element('section'); hero.top = 0; hero.height = 800; hero.section = hero;
  const processGrid = new Element(); sections.get('process').append(processGrid);
  sections.get('process').selectors.set('.process-grid', processGrid);
  const steps = Array.from({ length: 4 }, () => new Element('article'));
  sections.get('process').multiselectors.set('.process-step', steps);
  steps.forEach(step => processGrid.append(step));
  const workGrid = new Element(); workGrid.height = 680; sections.get('work').append(workGrid);
  sections.get('work').selectors.set('.work-grid', workGrid);
  const heading = new Element('h2'); workGrid.append(heading); sections.get('work').selectors.set('h2', heading);
  const projects = ['Create + Elevate', 'Solidity', 'Chronodike', 'Pendeli'].map((name, index) => {
    const node = new Element('article'), h3 = new Element('h3'), link = new Element('a'); h3.textContent = name;
    node.selectors.set('h3', h3); node.append(h3); node.append(link); workGrid.append(node);
    node.section = sections.get('work'); node.top = node.section.top + index * 360; return node;
  });
  sections.get('work').multiselectors.set('.work-card', projects);
  const planes = new Map([['#work .work-card', projects]]);
  ['#services .side-copy', '#services .card', '.ways-to-work-offer', '.about-copy', '.cred-item', '#care .card', '#experience .experience-card'].forEach(selector => {
    const node = new Element(); node.section = sections.get(selector.includes('services') ? 'services' : selector.includes('care') ? 'care' : selector.includes('experience') ? 'experience' : selector.includes('ways') ? 'ways-to-work' : 'about');
    node.top = node.section.top; planes.set(selector, [node]);
  });
  document = { documentElement: root, body, hidden: false, activeElement: body,
    getElementById: id => sections.get(id), querySelector: selector => selector === '.hero' ? hero : null,
    querySelectorAll: selector => planes.get(selector) ?? [], createElement: tag => new Element(tag),
    addEventListener: (name, callback) => { documentEvents[name] = callback; } };
  window = { innerHeight: 900, scrollY: 0, IntersectionObserver: observers, ResizeObserver: observers,
    addEventListener: (name, callback) => { windowEvents[name] = callback; },
    scrollTo: ({ top }) => { window.scrollY = top; } };
  const intersections = [], sizes = [];
  class IntersectionObserver {
    constructor(callback) { this.callback = callback; this.targets = []; intersections.push(this); }
    observe(target) { this.targets.push(target); }
    disconnect() { this.disconnected = true; }
  }
  class ResizeObserver {
    constructor(callback) { this.callback = callback; sizes.push(this); }
    observe() {} disconnect() { this.disconnected = true; }
  }
  const context = { document, window, HTMLElement: Element, IntersectionObserver, ResizeObserver,
    getComputedStyle: () => ({ getPropertyValue: () => stylesheet ? '1' : '' }),
    matchMedia: query => media[query.includes('reduced') ? 0 : 1],
    requestAnimationFrame: callback => { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: id => frames.delete(id) };
  vm.runInNewContext(source, context);
  function flush() { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback()); }
  function near() { const observer = intersections.at(-1); observer.callback(observer.targets.map(target => ({ target, isIntersecting: true }))); flush(); }
  function preference(index, matches) { media[index].matches = matches; media[index].handlers.change(); flush(); }
  return { root, body, sections, projects, steps, workGrid, processGrid, document, window, windowEvents,
    documentEvents, intersections, sizes, frames, planes, flush, near, preference };
}

for (const options of [{ reduced: true }, { observers: false }, { stylesheet: false }]) {
  const f = fixture(options);
  assert.equal(f.root.classList.contains('spatial-enabled'), false);
  assert.ok(f.projects.every(project => !project.inert));
}

const f = fixture(); f.near();
assert.ok(f.root.classList.contains('spatial-desktop'));
assert.ok(f.projects.every(project => project.classList.contains('spatial-project')));
assert.ok(f.projects.every(project => !project.inert));
assert.equal(f.body.children.length, 8, 'No navigation or controls injected');
assert.equal(f.workGrid.children.length, 5, 'No gallery wrapper or controls injected');
assert.equal(f.processGrid.parent, f.sections.get('process'), 'Process stays in normal flow');
assert.ok([...f.planes.get('.ways-to-work-offer')].every(node => !node.classList.contains('spatial-plane')));
assert.ok(f.steps.every(step => !step.classList.contains('is-current')));

f.window.scrollY = f.sections.get('work').top + 400;
f.windowEvents.scroll(); f.flush();
for (const project of f.projects) {
  assert.ok(Math.abs(Number.parseFloat(project.style.getPropertyValue('--project-image-y'))) <= 6);
  const scale = Number(project.style.getPropertyValue('--project-image-scale'));
  assert.ok(scale >= 1.02 && scale <= 1.04);
  assert.equal(project.inert, false);
}

// Keyboard focus holds the image/entrance values without hiding any other link.
f.document.activeElement = f.projects[0].children[1];
const held = f.projects[0].style.getPropertyValue('--project-image-y');
f.window.scrollY += 300; f.windowEvents.scroll(); f.flush();
assert.equal(f.projects[0].style.getPropertyValue('--project-image-y'), held);
assert.ok(f.projects.every(project => !project.inert));
f.document.activeElement = f.body;

// One scheduled frame per burst; no autonomous animation loop.
for (let i = 0; i < 10; i++) f.windowEvents.scroll();
assert.equal(f.frames.size, 1); f.flush(); assert.equal(f.frames.size, 0);

// A project outside the near-view observer stops receiving image updates.
const observer = f.intersections.at(-1);
observer.callback([{ target: f.projects[0], isIntersecting: false }]); f.flush();
const distant = f.projects[0].style.getPropertyValue('--project-image-y');
f.window.scrollY += 300; f.windowEvents.scroll(); f.flush();
assert.equal(f.projects[0].style.getPropertyValue('--project-image-y'), distant);

// Live reduced-motion switch removes classes and every applied motion property.
f.preference(0, true);
assert.equal(f.root.classList.contains('spatial-enabled'), false);
assert.ok(f.intersections.every(item => item.disconnected));
assert.ok([...f.planes.values()].flat().every(node => !node.classList.contains('spatial-plane')));
assert.ok(f.projects.every(project => !project.classList.contains('spatial-project') && !project.inert));
assert.equal(f.projects[0].style.getPropertyValue('--project-image-y'), undefined);
assert.equal(f.processGrid.parent, f.sections.get('process'));

const resized = fixture(); resized.near(); resized.preference(1, false); resized.near();
assert.equal(resized.root.classList.contains('spatial-desktop'), false);
assert.ok(resized.root.classList.contains('spatial-enabled'));
assert.ok(resized.projects.every(project => !project.classList.contains('spatial-project') && !project.inert));
assert.equal(resized.projects[0].style.getPropertyValue('--project-image-y'), undefined);
assert.equal(resized.processGrid.parent, resized.sections.get('process'));
assert.equal(resized.workGrid.children.length, 5);

const printed = fixture(); printed.near(); printed.windowEvents.beforeprint(); printed.flush();
assert.equal(printed.root.classList.contains('spatial-enabled'), false);
assert.ok(printed.projects.every(project => !project.inert));
printed.windowEvents.afterprint(); printed.near();
assert.ok(printed.root.classList.contains('spatial-desktop'));
assert.equal(printed.workGrid.children.length, 5);
console.log('PASS: missing CSS/observer/reduced-motion fallbacks, normal-flow Process and portfolio, all project links available, flat pricing, bounded image depth, focused link protection, frame batching, distant image updates paused, reduced-motion cleanup, mobile resize and print restoration. DOM mocks only; no rendered-browser testing.');
