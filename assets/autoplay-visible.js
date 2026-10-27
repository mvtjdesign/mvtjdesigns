/* Muted showcase videos ([data-autoplay-visible]) play only while on screen, and never when motion is reduced. */
(() => {
  "use strict";
  const vids = document.querySelectorAll("video[data-autoplay-visible]");
  if (!vids.length || !("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { vids.forEach(v => { v.controls = true; }); return; }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) e.target.play().catch(() => { e.target.controls = true; });
    else e.target.pause();
  }), { threshold: 0.4 });
  vids.forEach(v => io.observe(v));
})();
