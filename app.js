/**
 * BUILD SOMETHING — NFRSTCT HIGH PRECISION LAB
 * Application Controller & Skyline Parallax
 */

(function () {
  'use strict';

  const skyline = document.querySelector('.skyline-graphic');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (skyline && !prefersReducedMotion.matches) {
    let targetX = 0;
    let currentX = 0;
    let ticking = false;

    window.addEventListener('pointermove', function (e) {
      const normX = (e.clientX / window.innerWidth) - 0.5;
      targetX = normX * -20; // Subtle horizontal parallax
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateParallax);
      }
    }, { passive: true });

    function updateParallax() {
      currentX += (targetX - currentX) * 0.08;
      const isMobile = window.innerWidth <= 640;
      const baseY = isMobile ? 0 : -2;
      skyline.style.transform = `translate3d(${currentX.toFixed(2)}px, ${baseY}%, 0)`;

      if (Math.abs(targetX - currentX) > 0.05) {
        requestAnimationFrame(updateParallax);
      } else {
        ticking = false;
      }
    }
  }
})();




