/**
 * NFRSTCT — High Precision Lab
 * Mathematical 4D Tesseract (Hypercube) Wireframe Engine
 * 
 * Features:
 * - 16 Vertices in R^4 with 32 continuous 4D-edges
 * - Dual-plane 4D rotation matrices: SO(4) rotations in XW, YZ, and XZ planes
 * - Orthographic & stereographic 3D projection onto high-DPI 2D Canvas
 * - Razor-sharp line rasterization with pixel-ratio compensation
 * - Respects prefers-reduced-motion and document visibility
 * - Subtle interactive tactile drag & drift
 */

(function () {
  'use strict';

  const canvas = document.getElementById('wireframe-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const container = document.getElementById('wireframe-mount');

  // Mathematical 4D Tesseract Vertices (-1 or +1 for each coordinate x, y, z, w)
  const vertices4D = [];
  for (let x = -1; x <= 1; x += 2) {
    for (let y = -1; y <= 1; y += 2) {
      for (let z = -1; z <= 1; z += 2) {
        for (let w = -1; w <= 1; w += 2) {
          vertices4D.push([x, y, z, w]);
        }
      }
    }
  }

  // 4D Edges: Connect pairs of vertices that differ by exactly one coordinate
  const edges = [];
  for (let i = 0; i < vertices4D.length; i++) {
    for (let j = i + 1; j < vertices4D.length; j++) {
      let diff = 0;
      for (let k = 0; k < 4; k++) {
        if (vertices4D[i][k] !== vertices4D[j][k]) diff++;
      }
      if (diff === 1) {
        edges.push([i, j]);
      }
    }
  }

  // Secondary Internal Cross-Chords to enhance architectural tension (8 central chords)
  const innerChords = [];
  for (let i = 0; i < 8; i++) {
    innerChords.push([i, 15 - i]);
  }

  // State
  let width = 0;
  let height = 0;
  let dpr = 1;
  let isRunning = true;
  let isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Rotation angles
  let angleXW = 0.45;
  let angleYZ = 0.35;
  let angleXZ = 0.25;
  let angleYW = 0.15;

  // Interactive drag state
  let isDragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let dragVelocityX = 0;
  let dragVelocityY = 0;

  let isIntersecting = true;

  function resize() {
    if (!container) return;
    const rect = container.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2.0);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render(true);
  }

  window.addEventListener('resize', resize);

  // 4D Rotation in XW plane
  function rotateXW(v, theta) {
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const x = v[0] * cos - v[3] * sin;
    const w = v[0] * sin + v[3] * cos;
    return [x, v[1], v[2], w];
  }

  // 4D Rotation in YZ plane
  function rotateYZ(v, theta) {
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const y = v[1] * cos - v[2] * sin;
    const z = v[1] * sin + v[2] * cos;
    return [v[0], y, z, v[3]];
  }

  // 4D Rotation in XZ plane
  function rotateXZ(v, theta) {
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const x = v[0] * cos - v[2] * sin;
    const z = v[0] * sin + v[2] * cos;
    return [x, v[1], z, v[3]];
  }

  // 4D Rotation in YW plane
  function rotateYW(v, theta) {
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const y = v[1] * cos - v[3] * sin;
    const w = v[1] * sin + v[3] * cos;
    return [v[0], y, v[2], w];
  }

  // Project 4D point to 3D via stereographic projection
  function project4Dto3D(v, distance) {
    const w = v[3];
    const factor = 1 / (distance - w);
    return [v[0] * factor, v[1] * factor, v[2] * factor];
  }

  // Project 3D point to 2D screen coordinates
  function project3Dto2D(p3, scale, centerX, centerY) {
    // Isometric angle tilt
    const isoAngle = Math.PI / 6; // 30 degrees
    const x = (p3[0] - p3[1]) * Math.cos(isoAngle);
    const y = (p3[0] + p3[1]) * Math.sin(isoAngle) - p3[2];

    return [
      centerX + x * scale,
      centerY + y * scale
    ];
  }

  function render(forceStatic = false) {
    if (!width || !height) return;

    ctx.clearRect(0, 0, width, height);

    const centerX = width * 0.52;
    const centerY = height * 0.48;
    const scale = Math.min(width, height) * 0.42;

    // Transform and project all 16 vertices
    const projected2D = [];
    const projected3D = [];

    for (let i = 0; i < vertices4D.length; i++) {
      let v = vertices4D[i];
      v = rotateXW(v, angleXW);
      v = rotateYZ(v, angleYZ);
      v = rotateXZ(v, angleXZ);
      v = rotateYW(v, angleYW);

      const p3 = project4Dto3D(v, 2.3);
      projected3D.push(p3);

      const p2 = project3Dto2D(p3, scale, centerX, centerY);
      projected2D.push(p2);
    }

    // Color definitions matching CSS variables
    const strokeColor = '#FF2600';
    const strokeFaint = 'rgba(255, 38, 0, 0.28)';

    // 1. Draw subtle coordinate reference axes & datum circle
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 38, 0, 0.15)';
    ctx.lineWidth = 1;
    ctx.arc(centerX, centerY, scale * 0.95, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.setLineDash([3, 4]);
    ctx.arc(centerX, centerY, scale * 0.55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Draw Secondary Inner Diagonal Chords (faint dashed lines)
    ctx.beginPath();
    ctx.strokeStyle = strokeFaint;
    ctx.lineWidth = 0.9;
    ctx.setLineDash([4, 4]);
    for (let i = 0; i < innerChords.length; i++) {
      const [a, b] = innerChords[i];
      ctx.moveTo(projected2D[a][0], projected2D[a][1]);
      ctx.lineTo(projected2D[b][0], projected2D[b][1]);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Draw Primary 32 Tesseract Edges
    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.35;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';

    for (let i = 0; i < edges.length; i++) {
      const [u, v] = edges[i];
      ctx.moveTo(projected2D[u][0], projected2D[u][1]);
      ctx.lineTo(projected2D[v][0], projected2D[v][1]);
    }
    ctx.stroke();

    // 4. Draw Vertex Nodes & Precision Ticks
    for (let i = 0; i < projected2D.length; i++) {
      const [x, y] = projected2D[i];
      const zDepth = projected3D[i][2]; // for subtle size depth

      // Square vertex marker
      const nodeSize = zDepth > 0 ? 3.5 : 2.5;
      ctx.fillStyle = strokeColor;
      ctx.fillRect(x - nodeSize / 2, y - nodeSize / 2, nodeSize, nodeSize);

      // Selected key vertices get high-precision crosshair ticks
      if (i % 4 === 0) {
        ctx.beginPath();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        const tick = 4;
        ctx.moveTo(x - tick, y);
        ctx.lineTo(x + tick, y);
        ctx.moveTo(x, y - tick);
        ctx.lineTo(x, y + tick);
        ctx.stroke();
      }
    }
  }

  // Animation Loop: Controlled, steady, and tension-building
  let lastTimestamp = 0;

  function step(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const delta = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
    lastTimestamp = timestamp;

    if (isRunning && !isReducedMotion && isIntersecting) {
      // Coherent, slow multi-axis rotation rates
      angleXW += 0.22 * delta;
      angleYZ += 0.16 * delta;
      angleXZ += 0.11 * delta;
      angleYW += 0.08 * delta;

      // Apply tactile inertia decay if user dragged
      if (!isDragging) {
        angleXZ += dragVelocityX * 0.08;
        angleYZ += dragVelocityY * 0.08;
        dragVelocityX *= 0.92;
        dragVelocityY *= 0.92;
      }

      render();
    }

    requestAnimationFrame(step);
  }

  // Interactive mouse/touch handling with zero scroll-jacking
  if (container) {
    container.addEventListener('pointerdown', (e) => {
      isDragging = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      // On mouse, capture pointer. On touch, do not capture so vertical scroll is native & unblocked
      if (e.pointerType !== 'touch') {
        try {
          container.setPointerCapture(e.pointerId);
        } catch (_) {}
      }
    }, { passive: true });

    container.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;

      // For touch, only apply horizontal rotation to leave vertical gesture to natural page scroll
      if (e.pointerType === 'touch' && Math.abs(dy) > Math.abs(dx) * 1.5) {
        return; // Allow natural vertical scroll without inertia interference
      }

      dragVelocityX = dx * 0.015;
      dragVelocityY = dy * 0.015;

      angleXZ += dragVelocityX;
      angleYZ += dragVelocityY;

      if (isReducedMotion) render();
    }, { passive: true });

    const stopDrag = (e) => {
      isDragging = false;
      if (e && e.pointerType !== 'touch') {
        try {
          container.releasePointerCapture(e.pointerId);
        } catch (_) {}
      }
    };

    container.addEventListener('pointerup', stopDrag, { passive: true });
    container.addEventListener('pointercancel', stopDrag, { passive: true });

    // IntersectionObserver to pause rendering when scrolled out of view (saves mobile battery)
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isIntersecting = entry.isIntersecting;
        });
      }, { threshold: 0.05 });
      observer.observe(container);
    }
  }

  // Document visibility optimization
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      isRunning = false;
    } else {
      isRunning = !isReducedMotion;
      lastTimestamp = performance.now();
    }
  });

  // Reduced motion media query listener
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  motionQuery.addEventListener('change', (e) => {
    isReducedMotion = e.matches;
    const motionToggleBtn = document.getElementById('motion-toggle');
    if (motionToggleBtn) {
      motionToggleBtn.setAttribute('aria-pressed', isReducedMotion ? 'true' : 'false');
      const text = motionToggleBtn.querySelector('.toggle-text');
      if (text) text.textContent = isReducedMotion ? 'WIRE-ROTATION: PAUSED' : 'WIRE-ROTATION: ACTIVE';
    }
    render(true);
  });

  // Expose control API for app.js
  window.NFRSTCT_WIREFRAME = {
    setReducedMotion: (val) => {
      isReducedMotion = val;
      render(true);
    },
    isPaused: () => isReducedMotion || !isRunning,
    renderStatic: () => render(true)
  };

  // Initial setup
  resize();
  requestAnimationFrame(step);
})();
