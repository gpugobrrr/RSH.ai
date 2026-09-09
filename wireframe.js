/**
 * BUILD SOMETHING — NFRSTCT HIGH PRECISION LAB
 * Mathematical 4D Tesseract Fullscreen Engine
 */

(function () {
  'use strict';

  const canvas = document.getElementById('wireframe-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const container = document.getElementById('wireframe-mount');

  // Mathematical 4D Tesseract Vertices & Edges
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

  const edges = [];
  for (let i = 0; i < vertices4D.length; i++) {
    for (let j = i + 1; j < vertices4D.length; j++) {
      let diff = 0;
      for (let k = 0; k < 4; k++) {
        if (vertices4D[i][k] !== vertices4D[j][k]) diff++;
      }
      if (diff === 1) edges.push([i, j]);
    }
  }

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

  // Drag state
  let isDragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let dragVelocityX = 0;
  let dragVelocityY = 0;

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

  function rotateXW(v, theta) {
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    return [v[0] * cos - v[3] * sin, v[1], v[2], v[0] * sin + v[3] * cos];
  }

  function rotateYZ(v, theta) {
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    return [v[0], v[1] * cos - v[2] * sin, v[1] * sin + v[2] * cos, v[3]];
  }

  function rotateXZ(v, theta) {
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    return [v[0] * cos - v[2] * sin, v[1], v[0] * sin + v[2] * cos, v[3]];
  }

  function rotateYW(v, theta) {
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    return [v[0], v[1] * cos - v[3] * sin, v[2], v[1] * sin + v[3] * cos];
  }

  function project4Dto3D(v, distance) {
    const factor = 1 / (distance - v[3]);
    return [v[0] * factor, v[1] * factor, v[2] * factor];
  }

  function project3Dto2D(p3, scale, centerX, centerY) {
    const isoAngle = Math.PI / 6;
    const x = (p3[0] - p3[1]) * Math.cos(isoAngle);
    const y = (p3[0] + p3[1]) * Math.sin(isoAngle) - p3[2];
    return [centerX + x * scale, centerY + y * scale];
  }

  function render() {
    if (!width || !height) return;

    ctx.clearRect(0, 0, width, height);

    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const scale = Math.min(width, height) * 0.42;

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

    const strokeColor = '#FF2600';
    const strokeFaint = 'rgba(255, 38, 0, 0.22)';

    // Datum Circles
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

    // Inner Chords
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

    // Primary Edges
    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';

    for (let i = 0; i < edges.length; i++) {
      const [u, v] = edges[i];
      ctx.moveTo(projected2D[u][0], projected2D[u][1]);
      ctx.lineTo(projected2D[v][0], projected2D[v][1]);
    }
    ctx.stroke();

    // Vertices & Crosshair Ticks
    for (let i = 0; i < projected2D.length; i++) {
      const [x, y] = projected2D[i];
      const zDepth = projected3D[i][2];
      const nodeSize = zDepth > 0 ? 3.5 : 2.5;

      ctx.fillStyle = strokeColor;
      ctx.fillRect(x - nodeSize / 2, y - nodeSize / 2, nodeSize, nodeSize);

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

  let lastTimestamp = 0;

  function step(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const delta = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
    lastTimestamp = timestamp;

    if (isRunning && !isReducedMotion) {
      angleXW += 0.22 * delta;
      angleYZ += 0.16 * delta;
      angleXZ += 0.11 * delta;
      angleYW += 0.08 * delta;

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

  if (container) {
    container.addEventListener('pointerdown', (e) => {
      isDragging = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      if (e.pointerType !== 'touch') {
        try { container.setPointerCapture(e.pointerId); } catch (_) {}
      }
    }, { passive: true });

    container.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;

      dragVelocityX = dx * 0.015;
      dragVelocityY = dy * 0.015;

      angleXZ += dragVelocityX;
      angleYZ += dragVelocityY;

      if (isReducedMotion) render();
    }, { passive: true });

    const stopDrag = (e) => {
      isDragging = false;
      if (e && e.pointerType !== 'touch') {
        try { container.releasePointerCapture(e.pointerId); } catch (_) {}
      }
    };

    container.addEventListener('pointerup', stopDrag, { passive: true });
    container.addEventListener('pointercancel', stopDrag, { passive: true });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      isRunning = false;
    } else {
      isRunning = !isReducedMotion;
      lastTimestamp = performance.now();
    }
  });

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  motionQuery.addEventListener('change', (e) => {
    isReducedMotion = e.matches;
    render(true);
  });

  resize();
  requestAnimationFrame(step);
})();
