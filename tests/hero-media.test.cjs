// Run: node tests/hero-media.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('assets/hero-media.js', 'utf8');

function fixture({ mobile = false, reduced = false, hidden = false, rejectPlay = false, throwPlay = false } = {}) {
  const media = new Map();
  for (const [query, matches] of [
    ['(max-width: 768px)', mobile],
    ['(prefers-reduced-motion: reduce)', reduced]
  ]) {
    media.set(query, {
      matches,
      addEventListener(name, callback) { this.handler = callback; },
      change(value) { this.matches = value; this.handler(); }
    });
  }

  class Element {
    constructor() {
      this.classes = new Set();
      this.attributes = new Set();
      this.classList = {
        add: name => this.classes.add(name),
        remove: name => this.classes.delete(name),
        contains: name => this.classes.has(name),
        toggle: (name, force) => {
          const shouldAdd = force === undefined ? !this.classes.has(name) : force;
          if (shouldAdd) this.classes.add(name);
          else this.classes.delete(name);
          return shouldAdd;
        }
      };
      this.listeners = {};
    }
    addEventListener(name, callback) {
      (this.listeners[name] ||= []).push(callback);
    }
    dispatch(name) {
      (this.listeners[name] || []).forEach(callback => callback());
    }
    setAttribute(name) { this.attributes.add(name); }
    removeAttribute(name) {
      this.attributes.delete(name);
      if (name === 'src') {
        this._src = '';
        this.currentSrc = '';
        this.readyState = 0;
      }
    }
    hasAttribute(name) { return this.attributes.has(name); }
    load() {
      if (this._src) {
        this.readyState = 4;
        this.dispatch('canplay');
      }
    }
    pause() { this.paused = true; }
    play() {
      this.playCalls++;
      if (throwPlay) throw new Error('playback unavailable');
      if (rejectPlay) return Promise.reject(new Error('autoplay blocked'));
      this.paused = false;
      this.dispatch('playing');
      return Promise.resolve();
    }
    set src(value) {
      this._src = value;
      this.currentSrc = value;
    }
    get src() { return this._src || ''; }
  }

  const hero = new Element();
  const video = new Element();
  const copy = new Element();
  Object.assign(video, {
    muted: false, playsInline: false, autoplay: true, loop: true, preload: 'none',
    readyState: 0, duration: 10, currentTime: 0, paused: true, playCalls: 0
  });
  hero.querySelector = selector => {
    if (selector === '.hero-video') return video;
    if (selector === '[data-hero-copy]') return copy;
    return null;
  };

  const documentEvents = {};
  const document = {
    hidden,
    querySelector: selector => selector === '.hero' ? hero : null,
    addEventListener: (name, callback) => { documentEvents[name] = callback; }
  };
  const observers = [];
  class IntersectionObserver {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() {}
    intersect(isIntersecting) {
      this.callback([{ isIntersecting, intersectionRatio: isIntersecting ? 1 : 0 }]);
    }
  }
  const window = { IntersectionObserver };
  const context = {
    document,
    window,
    matchMedia: query => media.get(query),
    HTMLMediaElement: { HAVE_CURRENT_DATA: 2 },
    IntersectionObserver
  };
  vm.runInNewContext(source, context);
  return { hero, video, copy, document, documentEvents, observers, media };
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

(async () => {
  {
    const f = fixture({ mobile: true, hidden: true });
    assert.equal(f.video.poster, 'assets/hero/mvtj-mobile-hero-final.jpg');
    assert.equal(f.copy.hasAttribute('inert'), true, 'mobile copy is not focusable during the intro');
    assert.equal(f.video.src, '', 'a hidden tab does not load the mobile video');

    f.observers[0].intersect(true);
    assert.equal(f.video.src, '');
    f.document.hidden = false;
    f.documentEvents.visibilitychange();
    assert.equal(f.video.src, 'assets/hero/mvtj-pool-walk-mobile.mp4');
    assert.equal(f.video.muted, true);
    assert.equal(f.video.playsInline, true);
    assert.equal(f.video.loop, false);
    assert.equal(f.video.playCalls, 1);
    assert.equal(f.hero.classList.contains('hero-video-active'), true);

    f.observers[0].intersect(false);
    assert.equal(f.video.paused, true, 'video pauses outside the hero');
    f.video.currentTime = 3;
    f.observers[0].intersect(true);
    assert.equal(f.video.currentTime, 3, 'returning to the hero resumes from the paused frame');
    assert.equal(f.video.playCalls, 2);

    f.video.currentTime = 3.49;
    f.video.dispatch('timeupdate');
    assert.equal(f.copy.hasAttribute('inert'), true, 'copy stays pending before 3.5 seconds');
    f.video.currentTime = 3.5;
    f.video.dispatch('timeupdate');
    assert.equal(f.copy.hasAttribute('inert'), false, 'copy is accessible at 3.5 seconds');
    assert.equal(f.copy.hasAttribute('aria-hidden'), false);
    assert.equal(f.hero.classList.contains('hero-copy-pending'), false);
    assert.equal(f.hero.classList.contains('hero-video-active'), true, 'video stays visible after copy appears');
    assert.equal(f.video.paused, false, 'video keeps playing behind the revealed copy');

    f.video.currentTime = 9.6;
    f.video.dispatch('timeupdate');
    assert.equal(f.hero.classList.contains('hero-video-active'), false, 'the still crossfades during the final 420ms');
    assert.equal(f.copy.hasAttribute('inert'), false, 'copy becomes available as the transition begins');
    f.video.dispatch('ended');
    assert.equal(f.hero.classList.contains('hero-video-final'), true);
    assert.equal(f.video.paused, true);
    assert.equal(f.video.src, '', 'the video source is released when the still takes over');

    const playsAfterFinish = f.video.playCalls;
    f.document.hidden = true;
    f.documentEvents.visibilitychange();
    f.document.hidden = false;
    f.documentEvents.visibilitychange();
    f.observers[0].intersect(false);
    f.observers[0].intersect(true);
    assert.equal(f.video.playCalls, playsAfterFinish, 'the mobile sequence never replays after the final still');
    assert.equal(f.copy.hasAttribute('inert'), false, 'copy stays accessible after the intro');
  }

  {
    const f = fixture();
    f.observers[0].intersect(true);
    assert.equal(f.video.src, 'assets/hero/mvtj-pool-walk-web.mp4');
    assert.equal(f.video.poster, 'assets/hero/mvtj-cinematic-hero.jpg');
    assert.equal(f.copy.hasAttribute('inert'), true, 'desktop copy starts hidden and unfocusable');
    assert.equal(f.video.loop, false);
    assert.equal(f.video.playCalls, 1);

    f.video.currentTime = 3.49;
    f.video.dispatch('timeupdate');
    assert.equal(f.copy.hasAttribute('inert'), true, 'copy stays pending before 3.5 seconds');
    f.video.currentTime = 3.5;
    f.video.dispatch('timeupdate');
    assert.equal(f.copy.hasAttribute('inert'), false, 'copy is accessible at 3.5 seconds');
    assert.equal(f.copy.hasAttribute('aria-hidden'), false);
    assert.equal(f.hero.classList.contains('hero-copy-pending'), false);
    assert.equal(f.hero.classList.contains('hero-video-active'), true, 'video stays visible after copy appears');
    assert.equal(f.video.paused, false, 'video keeps playing behind the revealed copy');

    f.video.currentTime = 9.6;
    f.video.dispatch('timeupdate');
    assert.equal(f.copy.hasAttribute('inert'), false, 'desktop copy is revealed as the still crossfades in');
    f.video.dispatch('ended');
    const playsAfterFinish = f.video.playCalls;
    f.document.hidden = true;
    f.documentEvents.visibilitychange();
    f.document.hidden = false;
    f.documentEvents.visibilitychange();
    f.observers[0].intersect(false);
    f.observers[0].intersect(true);
    assert.equal(f.video.playCalls, playsAfterFinish, 'desktop also remains on its final still');
  }

  for (const options of [{ mobile: true, reduced: true }, { reduced: true }]) {
    const f = fixture(options);
    assert.equal(f.video.src, '', 'reduced motion never attaches a video source');
    assert.equal(f.copy.hasAttribute('inert'), false, 'reduced motion reveals copy immediately');
    assert.equal(f.hero.classList.contains('hero-video-final'), true);
  }

  {
    const f = fixture({ mobile: true, rejectPlay: true });
    f.observers[0].intersect(true);
    await flushPromises();
    assert.equal(f.video.src, '', 'blocked autoplay unloads the video');
    assert.equal(f.copy.hasAttribute('inert'), false, 'autoplay failure reveals copy immediately');
    assert.equal(f.hero.classList.contains('hero-video-final'), true);
  }

  {
    const f = fixture({ mobile: true, throwPlay: true });
    f.observers[0].intersect(true);
    assert.equal(f.video.src, '', 'synchronous playback failures unload the video');
    assert.equal(f.copy.hasAttribute('inert'), false, 'synchronous failures reveal copy immediately');
  }

  {
    const f = fixture({ mobile: true });
    f.observers[0].intersect(true);
    f.video.dispatch('error');
    assert.equal(f.video.src, '', 'media errors fall back to the mobile still');
    assert.equal(f.copy.hasAttribute('inert'), false);
  }

  {
    const f = fixture();
    f.observers[0].intersect(true);
    f.media.get('(max-width: 768px)').change(true);
    assert.equal(f.video.src, '', 'a breakpoint change does not start a second cinematic sequence');
    assert.equal(f.copy.hasAttribute('inert'), false);
    f.observers[0].intersect(true);
    assert.equal(f.video.playCalls, 1);
  }

  console.log('PASS: mobile and desktop single-play sequences, crossfade, copy accessibility, pause/resume, and fallbacks.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
