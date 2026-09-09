/**
 * NFRSTCT — High Precision Lab
 * Mathematical 4D Wireframe Synthesis Engine
 * 
 * Multi-Geometry Preset Modes:
 * - 4D Tesseract (Hypercube)
 * - Stellated Octahedron (Dual 4D Simplex)
 * - Toroidal Geodesic Lattice
 */

(function () {
  'use strict';

  const canvas = document.getElementById('wireframe-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const container = document.getElementById('wireframe-mount');

  // Multi-Geometry Generators
  function generateTesseract() {
    const verts = [];
    for (let x = -1; x <= 1; x += 2) {
      for (let y = -1; y <= 1; y += 2) {
        for (let z = -1; z <= 1; z += 2) {
          for (let w = -1; w <= 1; w += 2) {
            verts.push([x, y, z, w]);
          }
        }
      }
    }
    const edg = [];
    for (let i = 0; i < verts.length; i++) {
      for (let j = i + 1; j < verts.length; j++) {
        let diff = 0;
        for (let k = 0; k < 4; k++) {
          if (verts[i][k] !== verts[j][k]) diff++;
        }
        if (diff === 1) edg.push([i, j]);
      }
    }
    const chd = [];
    for (let i = 0; i < 8; i++) chd.push([i, 15 - i]);
    return { verts, edg, chd };
  }

  function generateStellatedOctahedron() {
    const verts = [
      [1, 1, 1, 0.8], [-1, -1, 1, 0.8], [-1, 1, -1, 0.8], [1, -1, -1, 0.8],
      [1, 1, -1, -0.8], [-1, -1, -1, -0.8], [-1, 1, 1, -0.8], [1, -1, 1, -0.8],
      [1.4, 0, 0, 0], [-1.4, 0, 0, 0], [0, 1.4, 0, 0], [0, -1.4, 0, 0],
      [0, 0, 1.4, 0], [0, 0, -1.4, 0]
    ];
    const edg = [];
    for (let i = 0; i < 8; i++) {
      for (let j = i + 1; j < 8; j++) {
        let diff = 0;
        for (let k = 0; k < 4; k++) {
          if (verts[i][k] !== verts[j][k]) diff++;
        }
        if (diff <= 2) edg.push([i, j]);
      }
    }
    for (let i = 8; i < 14; i++) {
      for (let j = 0; j < 8; j += 2) edg.push([i, j]);
    }
    const chd = [];
    for (let i = 8; i < 14; i += 2) chd.push([i, i + 1]);
    return { verts, edg, chd };
  }

  function generateToroidalLattice() {
    const verts = [];
    const R = 1.1, r = 0.55;
    const uSteps = 8, vSteps = 6;
    for (let i = 0; i < uSteps; i++) {
      const u = (i / uSteps) * Math.PI * 2;
      for (let j = 0; j < vSteps; j++) {
        const v = (j / vSteps) * Math.PI * 2;
        const x = (R + r * Math.cos(v)) * Math.cos(u);
        const y = (R + r * Math.cos(v)) * Math.sin(u);
        const z = r * Math.sin(v);
        const w = Math.sin(u + v) * 0.75;
        verts.push([x, y, z, w]);
      }
    }
    const edg = [];
    for (let i = 0; i < uSteps; i++) {
      for (let j = 0; j < vSteps; j++) {
        const curr = i * vSteps + j;
        const nextV = i * vSteps + ((j + 1) % vSteps);
        const nextU = ((i + 1) % uSteps) * vSteps + j;
        edg.push([curr, nextV]);
        edg.push([curr, nextU]);
      }
    }
    const chd = [];
    for (let i = 0; i < verts.length; i += vSteps) {
      chd.push([i, (i + 24) % verts.length]);
    }
    return { verts, edg, chd };
  }

  // Active geometry state
  let currentPresetName = 'TESSERACT 4D';
  let activeGeo = generateTesseract();
  let speedMultiplier = 1.0;
  let lineWeight = 1.35;

  // Render metrics
  let fps = 60;
  let frameCount = 0;
  let lastFpsCalcTime = performance.now();

  // Canvas State
  let width = 0;
  let height = 0;
  let dpr = 1;
  let isRunning = true;
  let isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let isIntersecting = true;

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

  // SO(4) 4D Rotation Matrices
  function rotateXW(v, theta) {
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const x = v[0] * cos - v[3] * sin;
    const w = v[0] * sin + v[3] * cos;
    return [x, v[1], v[2], w];
  }

  function rotateYZ(v, theta) {
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const y = v[1] * cos - v[2] * sin;
    const z = v[1] * sin + v[2] * cos;
    return [v[0], y, z, v[3]];
  }

  function rotateXZ(v, theta) {
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const x = v[0] * cos - v[2] * sin;
    const z = v[0] * sin + v[2] * cos;
    return [x, v[1], z, v[3]];
  }

  function rotateYW(v, theta) {
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const y = v[1] * cos - v[3] * sin;
    const w = v[1] * sin + v[3] * cos;
    return [v[0], y, v[2], w];
  }

  function project4Dto3D(v, distance) {
    const w = v[3];
    const factor = 1 / (distance - w);
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

    const centerX = width * 0.52;
    const centerY = height * 0.48;
    const scale = Math.min(width, height) * 0.42;

    const projected2D = [];
    const projected3D = [];

    const verts = activeGeo.verts;
    const edg = activeGeo.edg;
    const chd = activeGeo.chd;

    for (let i = 0; i < verts.length; i++) {
      let v = verts[i];
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
    const strokeFaint = 'rgba(255, 38, 0, 0.25)';

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

    // Secondary Inner Chords
    ctx.beginPath();
    ctx.strokeStyle = strokeFaint;
    ctx.lineWidth = 0.9;
    ctx.setLineDash([4, 4]);
    for (let i = 0; i < chd.length; i++) {
      const [a, b] = chd[i];
      if (projected2D[a] && projected2D[b]) {
        ctx.moveTo(projected2D[a][0], projected2D[a][1]);
        ctx.lineTo(projected2D[b][0], projected2D[b][1]);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Primary Edges
    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWeight;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';

    for (let i = 0; i < edg.length; i++) {
      const [u, v] = edg[i];
      if (projected2D[u] && projected2D[v]) {
        ctx.moveTo(projected2D[u][0], projected2D[u][1]);
        ctx.lineTo(projected2D[v][0], projected2D[v][1]);
      }
    }
    ctx.stroke();

    // Vertex Markers
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

  // Animation Loop
  let lastTimestamp = 0;

  function step(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const delta = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
    lastTimestamp = timestamp;

    // Calculate FPS
    frameCount++;
    if (timestamp - lastFpsCalcTime >= 500) {
      fps = Math.round((frameCount * 1000) / (timestamp - lastFpsCalcTime));
      frameCount = 0;
      lastFpsCalcTime = timestamp;
    }

    if (isRunning && !isReducedMotion && isIntersecting) {
      angleXW += 0.22 * delta * speedMultiplier;
      angleYZ += 0.16 * delta * speedMultiplier;
      angleXZ += 0.11 * delta * speedMultiplier;
      angleYW += 0.08 * delta * speedMultiplier;

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

  // Touch & Pointer interaction
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

      if (e.pointerType === 'touch' && Math.abs(dy) > Math.abs(dx) * 1.5) {
        return;
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
        try { container.releasePointerCapture(e.pointerId); } catch (_) {}
      }
    };

    container.addEventListener('pointerup', stopDrag, { passive: true });
    container.addEventListener('pointercancel', stopDrag, { passive: true });

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

  // Public Benchmark API
  window.NFRSTCT_WIREFRAME = {
    setReducedMotion: (val) => {
      isReducedMotion = val;
      render(true);
    },
    setSpeed: (val) => {
      speedMultiplier = parseFloat(val) || 1.0;
    },
    setLineWeight: (val) => {
      lineWeight = parseFloat(val) || 1.35;
      render(true);
    },
    setPreset: (presetKey) => {
      if (presetKey === 'STELLATED') {
        activeGeo = generateStellatedOctahedron();
        currentPresetName = 'STELLATED OCTAHEDRON';
      } else if (presetKey === 'TOROIDAL') {
        activeGeo = generateToroidalLattice();
        currentPresetName = 'TOROIDAL LATTICE';
      } else {
        activeGeo = generateTesseract();
        currentPresetName = 'TESSERACT 4D';
      }
      render(true);
      return currentPresetName;
    },
    getTelemetry: () => {
      return {
        preset: currentPresetName,
        fps: fps,
        vertices: activeGeo.verts.length,
        edges: activeGeo.edg.length,
        chords: activeGeo.chd.length,
        speed: speedMultiplier.toFixed(1) + 'x',
        angles: {
          XW: angleXW.toFixed(2),
          YZ: angleYZ.toFixed(2),
          XZ: angleXZ.toFixed(2),
          YW: angleYW.toFixed(2)
        }
      };
    },
    renderStatic: () => render(true)
  };

  resize();
  requestAnimationFrame(step);
})();
