/**
 * BUILD SOMETHING — High Precision Lab
 * Downward Scrolling & Seamless Tiled Typography Stream
 */

(function () {
  'use strict';

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  const groupA = document.getElementById('group-a');
  if (!groupA) return;

  let groupHeight = groupA.offsetHeight || 1000;

  function updateHeight() {
    if (groupA && groupA.offsetHeight > 0) {
      groupHeight = groupA.offsetHeight;
    }
  }

  function initScroll() {
    updateHeight();
    // Start centered at group-b so we can smoothly scroll downward (decrement scrollY)
    if (window.scrollY === 0 && groupHeight > 0) {
      window.scrollTo(0, groupHeight);
    }
  }

  initScroll();
  window.addEventListener('resize', updateHeight, { passive: true });
  window.addEventListener('load', initScroll);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(initScroll);
  }

  const pixelsPerSecond = 65; // Steady, fluid downward movement
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

  // Allow intuitive manual user interaction
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
      // Negative delta scrolls up in document -> causes text to visually move DOWN
      window.scrollBy(0, -pixelsPerSecond * dt);
    }

    // Seamless infinite wrap in both directions
    if (groupHeight > 0) {
      // When scrolling down, scrollY decreases. Wrap before hitting 0 so there is never a boundary hitch.
      if (window.scrollY <= 100) {
        window.scrollTo(0, window.scrollY + groupHeight);
      } else if (window.scrollY >= groupHeight * 2) {
        window.scrollTo(0, window.scrollY - groupHeight);
      }
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();





