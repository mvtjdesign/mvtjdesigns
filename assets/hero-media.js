(() => {
  'use strict';

  const hero = document.querySelector('.hero');
  const video = hero?.querySelector('.hero-video');
  const copy = hero?.querySelector('[data-hero-copy]');
  if (!hero || !video || !copy) return;

  const mobile = matchMedia('(max-width: 768px)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const fadeBeforeEnd = 0.42;
  const copyRevealTime = 3.5;
  const sources = {
    desktop: {
      video: 'assets/hero/mvtj-pool-walk-web.mp4',
      poster: 'assets/hero/mvtj-cinematic-hero.jpg'
    },
    mobile: {
      video: 'assets/hero/mvtj-pool-walk-mobile.mp4',
      poster: 'assets/hero/mvtj-mobile-hero-final.jpg'
    }
  };

  let mode = mobile.matches ? 'mobile' : 'desktop';
  let enabled = false;
  let failed = false;
  let completed = false;
  let transitioning = false;
  let inView = !('IntersectionObserver' in window);
  let mediaLoaded = false;

  function canPlay() {
    return enabled && !completed && !document.hidden && inView;
  }

  function setCopyVisible(visible) {
    hero.classList.toggle('hero-copy-pending', !visible);
    if (visible) {
      copy.removeAttribute('inert');
      copy.removeAttribute('aria-hidden');
    } else {
      copy.setAttribute('inert', '');
      copy.setAttribute('aria-hidden', 'true');
    }
  }

  function stopAndUnload() {
    video.pause();
    video.removeAttribute('src');
    video.load();
    mediaLoaded = false;
  }

  function showStill() {
    hero.classList.remove('hero-video-active');
    hero.classList.add('hero-video-final');
  }

  function finishSequence() {
    if (completed) return;
    completed = true;
    enabled = false;
    showStill();
    setCopyVisible(true);
    stopAndUnload();
  }

  function failToStill() {
    if (failed || completed) return;
    failed = true;
    enabled = false;
    showStill();
    setCopyVisible(true);
    stopAndUnload();
  }

  function startPlayback() {
    if (!canPlay()) return;
    if (!mediaLoaded) {
      mediaLoaded = true;
      video.autoplay = false;
      video.loop = false;
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.src = sources[mode].video;
      video.load();
      return;
    }
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    try {
      video.play()?.catch(failToStill);
    } catch {
      failToStill();
    }
  }

  function pauseWhenUnavailable() {
    if (completed || failed) return;
    if (canPlay()) {
      startPlayback();
      return;
    }
    video.pause();
  }

  function configure() {
    const nextMode = mobile.matches ? 'mobile' : 'desktop';
    video.poster = sources[nextMode].poster;

    if (nextMode !== mode) {
      mode = nextMode;
      completed = true;
      enabled = false;
      showStill();
      setCopyVisible(true);
      stopAndUnload();
      return;
    }

    if (reducedMotion.matches) {
      completed = true;
      enabled = false;
      showStill();
      setCopyVisible(true);
      stopAndUnload();
      return;
    }

    if (completed || failed) {
      setCopyVisible(true);
      return;
    }

    enabled = true;
    hero.classList.remove('hero-video-final');
    setCopyVisible(false);
    pauseWhenUnavailable();
  }

  video.addEventListener('canplay', startPlayback);
  video.addEventListener('playing', () => {
    if (canPlay()) hero.classList.add('hero-video-active');
  });
  video.addEventListener('timeupdate', () => {
    if (!enabled || completed) return;
    if (video.currentTime >= copyRevealTime) setCopyVisible(true);
    if (transitioning || !Number.isFinite(video.duration)) return;
    if (video.duration - video.currentTime <= fadeBeforeEnd) {
      transitioning = true;
      hero.classList.remove('hero-video-active');
      setCopyVisible(true);
    }
  });
  video.addEventListener('ended', finishSequence);
  video.addEventListener('error', () => {
    if (enabled) failToStill();
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting && entry.intersectionRatio > 0;
      pauseWhenUnavailable();
    }, { threshold: 0.01 });
    observer.observe(hero);
  }

  document.addEventListener('visibilitychange', pauseWhenUnavailable);
  mobile.addEventListener('change', configure);
  reducedMotion.addEventListener('change', configure);
  configure();
})();
