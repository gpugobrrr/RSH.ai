/**
 * BUILD SOMETHING — NFRSTCT HIGH PRECISION LAB
 * Stylised 3D Wireframe Model: Oxford Radcliffe Camera
 * 
 * Features:
 * - Parametric 3D Architectural Model (Dome, Lantern, Colonnade Drum, Base Plinth)
 * - Slow rotation around vertical Y-axis (upright technical architectural model)
 * - Elevated viewpoint (pitch angle ~18.5 degrees) for architectural depth
 * - Razor-sharp thin red-orange vector lines against flat acid-yellow canvas
 * - Non-blocking touch pan-y & reduced-motion support
 */

(function () {
  'use strict';

  const canvas = document.getElementById('wireframe-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const container = document.getElementById('wireframe-mount');

  // Generate 3D Radcliffe Camera Architectural Mesh
  function buildRadcliffeCamera3D() {
    const verts = [];
    const edg = [];

    // Helper: Add circular ring at Y height
    function addRing(y, radius, segments) {
      const startIdx = verts.length;
      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        verts.push([radius * Math.cos(angle), y, radius * Math.sin(angle)]);
      }
      for (let i = 0; i < segments; i++) {
        edg.push([startIdx + i, startIdx + ((i + 1) % segments)]);
      }
      return startIdx;
    }

    // Helper: Add cylindrical level with vertical wall struts
    function addCylinder(yBottom, yTop, radius, segments, connectStruts = true) {
      const bStart = addRing(yBottom, radius, segments);
      const tStart = addRing(yTop, radius, segments);
      if (connectStruts) {
        for (let i = 0; i < segments; i++) {
          edg.push([bStart + i, tStart + i]);
        }
      }
      return { bStart, tStart };
    }

    // 1. Rusticated Base Plinth (16-sided, y = -0.65 to 0.0, radius = 1.0)
    addCylinder(-0.65, 0.0, 1.0, 16);
    addRing(-0.32, 1.02, 16); // Intermediate rustication cornice

    // 8 Base Portal Arch Entrances
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = 1.01;
      const x = r * Math.cos(angle);
      const z = r * Math.sin(angle);
      const tangentX = -Math.sin(angle) * 0.1;
      const tangentZ = Math.cos(angle) * 0.1;

      const pBase = verts.length;
      verts.push([x - tangentX, -0.65, z - tangentZ]);
      verts.push([x + tangentX, -0.65, z + tangentZ]);
      verts.push([x - tangentX, -0.22, z - tangentZ]);
      verts.push([x + tangentX, -0.22, z + tangentZ]);
      verts.push([x, -0.08, z]); // Arch apex

      edg.push([pBase, pBase + 2]);
      edg.push([pBase + 1, pBase + 3]);
      edg.push([pBase + 2, pBase + 4]);
      edg.push([pBase + 3, pBase + 4]);
    }

    // 2. Main Colonnade Drum (16-sided, y = 0.0 to 0.58, radius = 0.82)
    addCylinder(0.0, 0.58, 0.82, 16);
    addRing(0.28, 0.84, 16); // Mid-drum band

    // 12 Classical Columns around the Drum
    const numColumns = 12;
    for (let i = 0; i < numColumns; i++) {
      const angle = (i / numColumns) * Math.PI * 2;
      const colR = 0.89;
      const cx = colR * Math.cos(angle);
      const cz = colR * Math.sin(angle);

      const colStart = verts.length;
      verts.push([cx, 0.0, cz]);
      verts.push([cx, 0.58, cz]);
      edg.push([colStart, colStart + 1]);

      // Column capital detail
      const capStart = verts.length;
      const tx = -Math.sin(angle) * 0.035;
      const tz = Math.cos(angle) * 0.035;
      verts.push([cx - tx, 0.55, cz - tz]);
      verts.push([cx + tx, 0.55, cz + tz]);
      edg.push([capStart, capStart + 1]);
    }

    // 12 Arched Windows in Drum
    for (let i = 0; i < 12; i++) {
      const angle = ((i + 0.5) / 12) * Math.PI * 2;
      const winR = 0.83;
      const wx = winR * Math.cos(angle);
      const wz = winR * Math.sin(angle);
      const tx = -Math.sin(angle) * 0.07;
      const tz = Math.cos(angle) * 0.07;

      const wBase = verts.length;
      verts.push([wx - tx, 0.12, wz - tz]);
      verts.push([wx + tx, 0.12, wz + tz]);
      verts.push([wx - tx, 0.38, wz - tz]);
      verts.push([wx + tx, 0.38, wz + tz]);
      verts.push([wx, 0.45, wz]); // Window arch top

      edg.push([wBase, wBase + 2]);
      edg.push([wBase + 1, wBase + 3]);
      edg.push([wBase + 2, wBase + 4]);
      edg.push([wBase + 3, wBase + 4]);
    }

    // 3. Upper Balustrade & Cornice (y = 0.58 to 0.66, radius = 0.86)
    addCylinder(0.58, 0.66, 0.86, 24);
    // Balustrade vertical posts
    const balustradeStart = verts.length - 48;
    for (let i = 0; i < 24; i += 2) {
      edg.push([balustradeStart + i, balustradeStart + 24 + i]);
    }

    // 4. Ribbed Dome Structure (y = 0.66 to 1.38)
    const domeRings = 7;
    const domeRingInfos = [];
    for (let k = 0; k <= domeRings; k++) {
      const t = k / domeRings; // 0 to 1
      const domeY = 0.66 + 0.72 * Math.sin(t * (Math.PI / 2));
      const domeRadius = 0.82 * Math.cos(t * (Math.PI / 2));
      const effectiveR = Math.max(domeRadius, 0.20);
      const startIdx = addRing(domeY, effectiveR, 16);
      domeRingInfos.push({ y: domeY, radius: effectiveR, startIdx });
    }

    // Vertical Meridian Ribs
    for (let i = 0; i < 16; i++) {
      for (let k = 0; k < domeRings; k++) {
        const u = domeRingInfos[k].startIdx + i;
        const v = domeRingInfos[k + 1].startIdx + i;
        edg.push([u, v]);
      }
    }

    // 5. Cupola / Lantern (y = 1.38 to 1.72, radius = 0.20)
    addCylinder(1.38, 1.72, 0.20, 8);

    // Cupola Roof Cone Apex
    const apexIdx = verts.length;
    verts.push([0.0, 1.90, 0.0]);
    const lanternTopStart = verts.length - 9; // Top ring of lantern
    for (let i = 0; i < 8; i++) {
      edg.push([lanternTopStart + i, apexIdx]);
    }

    // Apex Finial / Cross
    const finialStart = verts.length;
    verts.push([0.0, 1.90, 0.0]);
    verts.push([0.0, 2.08, 0.0]);
    verts.push([-0.07, 2.00, 0.0]);
    verts.push([0.07, 2.00, 0.0]);
    edg.push([finialStart, finialStart + 1]);
    edg.push([finialStart + 2, finialStart + 3]);

    return { verts, edg };
  }

  const model3D = buildRadcliffeCamera3D();
  const vertices = model3D.verts;
  const edges = model3D.edg;

  // State
  let width = 0;
  let height = 0;
  let dpr = 1;
  let isRunning = true;
  let isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Upright rotation around vertical Y-axis
  let angleY = 0.45;

  // Drag interaction velocity
  let isDragging = false;
  let lastMouseX = 0;
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

  // Rotate point around vertical Y-axis (keeps building upright)
  function rotateY(v, theta) {
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    return [
      v[0] * cos - v[2] * sin,
      v[1],
      v[0] * sin + v[2] * cos
    ];
  }

  // Pitch tilt for slightly elevated camera viewpoint (~18.5 degrees)
  function pitchTilt(v, phi) {
    const cos = Math.cos(phi);
    const sin = Math.sin(phi);
    return [
      v[0],
      v[1] * cos - v[2] * sin,
      v[1] * sin + v[2] * cos
    ];
  }

  // Project 3D point to 2D screen coordinates with slight perspective depth
  function project3Dto2D(p3, scale, centerX, centerY) {
    const cameraDist = 4.2;
    const factor = scale / (cameraDist - p3[2]);
    const x = centerX + p3[0] * factor;
    const y = centerY - p3[1] * factor; // Flip Y for screen space
    return [x, y];
  }

  function render() {
    if (!width || !height) return;

    ctx.clearRect(0, 0, width, height);

    // Camera Parameters: Slightly elevated viewpoint (~18.5 deg)
    const pitchAngle = 0.32;
    const scale = Math.min(width, height) * 0.40;

    // Desktop vs Mobile positioning: center offset
    const isMobile = width < 640;
    const centerX = isMobile ? width * 0.5 : width * 0.58;
    const centerY = isMobile ? height * 0.55 : height * 0.56;

    const projected2D = [];
    const projected3D = [];

    for (let i = 0; i < vertices.length; i++) {
      let v = vertices[i];
      // 1. Rotate upright around vertical Y-axis
      v = rotateY(v, angleY);
      // 2. Apply elevated camera pitch tilt
      v = pitchTilt(v, pitchAngle);

      projected3D.push(v);
      const p2 = project3Dto2D(v, scale, centerX, centerY);
      projected2D.push(p2);
    }

    const strokeColor = '#FF2600';
    const strokeFaint = 'rgba(255, 38, 0, 0.18)';

    // Ground & Structural Datum Circles
    ctx.beginPath();
    ctx.strokeStyle = strokeFaint;
    ctx.lineWidth = 1;
    ctx.arc(centerX, centerY + scale * 0.28, scale * 0.92, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.setLineDash([3, 4]);
    ctx.arc(centerX, centerY + scale * 0.28, scale * 0.55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Primary Architectural 3D Edges
    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.25;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';

    for (let i = 0; i < edges.length; i++) {
      const [u, v] = edges[i];
      const p1 = projected2D[u];
      const p2 = projected2D[v];
      if (p1 && p2) {
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
      }
    }
    ctx.stroke();

    // Draw Node Markers on Key Architectural Vertices
    for (let i = 0; i < projected2D.length; i += 4) {
      const [x, y] = projected2D[i];
      const nodeSize = projected3D[i][2] > 0 ? 3 : 2;
      ctx.fillStyle = strokeColor;
      ctx.fillRect(x - nodeSize / 2, y - nodeSize / 2, nodeSize, nodeSize);
    }
  }

  // Animation Loop: Steady, upright rotation
  let lastTimestamp = 0;

  function step(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const delta = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
    lastTimestamp = timestamp;

    if (isRunning && !isReducedMotion) {
      // Slow, steady rotation around vertical Y-axis
      angleY += 0.18 * delta;

      if (!isDragging) {
        angleY += dragVelocityY * 0.08;
        dragVelocityY *= 0.92;
      }

      render();
    }

    requestAnimationFrame(step);
  }

  // Pointer & Touch handling (unblocked vertical page scrolling)
  if (container) {
    container.addEventListener('pointerdown', (e) => {
      isDragging = true;
      lastMouseX = e.clientX;
      if (e.pointerType !== 'touch') {
        try { container.setPointerCapture(e.pointerId); } catch (_) {}
      }
    }, { passive: true });

    container.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - lastMouseX;
      lastMouseX = e.clientX;

      dragVelocityY = dx * 0.012;
      angleY += dragVelocityY;

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
