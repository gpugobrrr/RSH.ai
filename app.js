/**
 * BUILD SOMETHING — High Precision Lab
 * Seamless Continuous Autoscroll & Tiled Typography Stream
 */

(function () {
  'use strict';

  const groupA = document.getElementById('group-a');
  if (!groupA) return;

  let groupHeight = groupA.offsetHeight;

  function updateHeight() {
    if (groupA) groupHeight = groupA.offsetHeight;
  }
  window.addEventListener('resize', updateHeight, { passive: true });

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (prefersReducedMotion.matches) return;

  const pixelsPerSecond = 60; // Clean, steady downward scroll
  let lastTime = performance.now();
  let isPaused = false;
  let resumeTimer = null;

  function pauseScroll() {
    isPaused = true;
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      isPaused = false;
      lastTime = performance.now();
    }, 1200);
  }

  // Allow intuitive manual user scrolling without fighting the autoscroll
  window.addEventListener('wheel', pauseScroll, { passive: true });
  window.addEventListener('touchstart', pauseScroll, { passive: true });
  window.addEventListener('touchmove', pauseScroll, { passive: true });
  window.addEventListener('pointerdown', pauseScroll, { passive: true });
  window.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Space'].includes(e.code)) {
      pauseScroll();
    }
  }, { passive: true });

  function tick(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    if (!isPaused && dt > 0) {
      window.scrollBy(0, pixelsPerSecond * dt);
    }

    // Seamless infinite wrap
    if (groupHeight > 0) {
      if (window.scrollY >= groupHeight) {
        window.scrollTo(0, window.scrollY - groupHeight);
      } else if (window.scrollY <= 0 && isPaused) {
        window.scrollTo(0, window.scrollY + groupHeight);
      }
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();




