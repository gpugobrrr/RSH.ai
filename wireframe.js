/**
 * BUILD SOMETHING — NFRSTCT HIGH PRECISION LAB
 * Stylised 3D Wireframe Model: Oxford Radcliffe Camera
 * Continuous 4-Phase Architectural Transformation Cycle
 * 
 * 4-Phase Cycle:
 * 1. Assembled building rotates slowly around vertical axis
 * 2. Architectural layers separate and expand toward fixed outer boundary
 * 3. Components turn inward and fold toward the centre while rotation continues
 * 4. Components unfold and reassemble into the recognisable building (seamless loop)
 */

(function () {
  'use strict';

  const canvas = document.getElementById('wireframe-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const container = document.getElementById('wireframe-mount');

  // Build Parametric 3D Radcliffe Camera with Layer Metadata
  function buildRadcliffeCameraModel() {
    const rawVerts = [];
    const edges = [];

    function addVertex(x, y, z, layer) {
      const idx = rawVerts.length;
      const r = Math.sqrt(x * x + z * z);
      const phi = Math.atan2(z, x);
      rawVerts.push({
        pos: [x, y, z],
        layer: layer, // 0: Base, 1: Drum/Columns, 2: Balustrade, 3: Dome, 4: Lantern
        r: r,
        phi: phi,
        y: y
      });
      return idx;
    }

    function addRing(y, radius, segments, layer) {
      const startIdx = rawVerts.length;
      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        addVertex(radius * Math.cos(angle), y, radius * Math.sin(angle), layer);
      }
      for (let i = 0; i < segments; i++) {
        edges.push([startIdx + i, startIdx + ((i + 1) % segments)]);
      }
      return startIdx;
    }

    function addCylinder(yBottom, yTop, radius, segments, layer, connectStruts = true) {
      const bStart = addRing(yBottom, radius, segments, layer);
      const tStart = addRing(yTop, radius, segments, layer);
      if (connectStruts) {
        for (let i = 0; i < segments; i++) {
          edges.push([bStart + i, tStart + i]);
        }
      }
      return { bStart, tStart };
    }

    // --- Layer 0: Rusticated Base Plinth & Portals (y: -0.65 to 0.0) ---
    addCylinder(-0.65, 0.0, 1.0, 16, 0);
    addRing(-0.32, 1.02, 16, 0); // Mid rustication ring

    // 8 Base Arched Portal Entrances
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = 1.01;
      const x = r * Math.cos(angle);
      const z = r * Math.sin(angle);
      const tx = -Math.sin(angle) * 0.09;
      const tz = Math.cos(angle) * 0.09;

      const p0 = addVertex(x - tx, -0.65, z - tz, 0);
      const p1 = addVertex(x + tx, -0.65, z + tz, 0);
      const p2 = addVertex(x - tx, -0.22, z - tz, 0);
      const p3 = addVertex(x + tx, -0.22, z + tz, 0);
      const p4 = addVertex(x, -0.08, z, 0); // Arch apex

      edges.push([p0, p2]);
      edges.push([p1, p3]);
      edges.push([p2, p4]);
      edges.push([p3, p4]);
    }

    // --- Layer 1: Colonnade Drum & 12 Columns (y: 0.0 to 0.58) ---
    addCylinder(0.0, 0.58, 0.82, 16, 1);
    addRing(0.28, 0.84, 16, 1); // Mid drum band

    // 12 Evenly Spaced Columns
    const numColumns = 12;
    for (let i = 0; i < numColumns; i++) {
      const angle = (i / numColumns) * Math.PI * 2;
      const colR = 0.89;
      const cx = colR * Math.cos(angle);
      const cz = colR * Math.sin(angle);

      const c0 = addVertex(cx, 0.0, cz, 1);
      const c1 = addVertex(cx, 0.58, cz, 1);
      edges.push([c0, c1]);

      // Column capital cross tick
      const tx = -Math.sin(angle) * 0.035;
      const tz = Math.cos(angle) * 0.035;
      const cap0 = addVertex(cx - tx, 0.55, cz - tz, 1);
      const cap1 = addVertex(cx + tx, 0.55, cz + tz, 1);
      edges.push([cap0, cap1]);
    }

    // 12 Arched Windows
    for (let i = 0; i < 12; i++) {
      const angle = ((i + 0.5) / 12) * Math.PI * 2;
      const winR = 0.83;
      const wx = winR * Math.cos(angle);
      const wz = winR * Math.sin(angle);
      const tx = -Math.sin(angle) * 0.065;
      const tz = Math.cos(angle) * 0.065;

      const w0 = addVertex(wx - tx, 0.12, wz - tz, 1);
      const w1 = addVertex(wx + tx, 0.12, wz + tz, 1);
      const w2 = addVertex(wx - tx, 0.38, wz - tz, 1);
      const w3 = addVertex(wx + tx, 0.38, wz + tz, 1);
      const w4 = addVertex(wx, 0.45, wz, 1);

      edges.push([w0, w2]);
      edges.push([w1, w3]);
      edges.push([w2, w4]);
      edges.push([w3, w4]);
    }

    // --- Layer 2: Upper Balustrade & Cornice (y: 0.58 to 0.66) ---
    addCylinder(0.58, 0.66, 0.86, 24, 2);
    const balustradeStart = rawVerts.length - 48;
    for (let i = 0; i < 24; i += 2) {
      edges.push([balustradeStart + i, balustradeStart + 24 + i]);
    }

    // --- Layer 3: Ribbed Dome Structure (y: 0.66 to 1.38) ---
    const domeRings = 7;
    const domeRingInfos = [];
    for (let k = 0; k <= domeRings; k++) {
      const t = k / domeRings; // 0 to 1
      const domeY = 0.66 + 0.72 * Math.sin(t * (Math.PI / 2));
      const domeRadius = 0.82 * Math.cos(t * (Math.PI / 2));
      const effectiveR = Math.max(domeRadius, 0.20);
      const startIdx = addRing(domeY, effectiveR, 16, 3);
      domeRingInfos.push({ startIdx });
    }

    // 16 Vertical Meridian Ribs
    for (let i = 0; i < 16; i++) {
      for (let k = 0; k < domeRings; k++) {
        const u = domeRingInfos[k].startIdx + i;
        const v = domeRingInfos[k + 1].startIdx + i;
        edges.push([u, v]);
      }
    }

    // --- Layer 4: Cupola / Lantern & Finial (y: 1.38 to 2.08) ---
    addCylinder(1.38, 1.72, 0.20, 8, 4);

    // Lantern Roof Cone Apex
    const apexIdx = addVertex(0.0, 1.90, 0.0, 4);
    const lanternTopStart = rawVerts.length - 10;
    for (let i = 0; i < 8; i++) {
      edges.push([lanternTopStart + i, apexIdx]);
    }

    // Apex Finial Cross
    const f0 = addVertex(0.0, 1.90, 0.0, 4);
    const f1 = addVertex(0.0, 2.08, 0.0, 4);
    const f2 = addVertex(-0.07, 2.00, 0.0, 4);
    const f3 = addVertex(0.07, 2.00, 0.0, 4);
    edges.push([f0, f1]);
    edges.push([f2, f3]);

    return { verts: rawVerts, edges };
  }

  const model = buildRadcliffeCameraModel();
  const vertices = model.verts;
  const edges = model.edges;

  // Cycle Parameters
  const CYCLE_DURATION = 18.0; // Seconds per complete continuous 4-phase loop

  // State
  let width = 0;
  let height = 0;
  let dpr = 1;
  let isRunning = true;
  let isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Continuous rotation around vertical Y-axis
  let angleY = 0.45;
  let totalElapsed = 0;

  // Touch drag
  let isDragging = false;
  let lastMouseX = 0;
  let dragVelocity = 0;

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

  // Compute 4-Phase Transformation for a given vertex
  function computeVertexTransform(vObj, tau) {
    const v0 = vObj.pos;
    const layer = vObj.layer;
    const phi0 = vObj.phi;
    const r0 = vObj.r;
    const y0 = vObj.y;

    // Fixed Outer Boundary Expansion Limits per Layer
    let drMax = 0;
    let dyMax = 0;
    if (layer === 0) { drMax = 0.38; dyMax = -0.28; }
    else if (layer === 1) { drMax = 0.55; dyMax = -0.06; }
    else if (layer === 2) { drMax = 0.50; dyMax = 0.16; }
    else if (layer === 3) { drMax = 0.42; dyMax = 0.48; }
    else if (layer === 4) { drMax = 0.12; dyMax = 0.82; }

    const rBound = r0 * (1 + drMax);
    const yBound = y0 + dyMax;

    // Folded Target Coordinates at the inflection of Phase 3
    let p3R = rBound;
    let p3Y = yBound;
    let p3Phi = phi0;

    if (layer === 3) {
      // Dome: iris flower inward curl
      p3R = rBound * 0.42;
      p3Y = yBound - 0.38;
      p3Phi = phi0 + 0.65;
    } else if (layer === 1) {
      // Drum & Columns: radial inward tilt
      p3R = rBound * 0.48;
      p3Y = yBound + 0.18;
      p3Phi = phi0 + 0.45;
    } else if (layer === 4) {
      // Lantern: core descent through dome iris
      p3R = rBound * 0.75;
      p3Y = yBound - 1.05;
      p3Phi = phi0 - 0.30;
    } else if (layer === 0) {
      // Base: compact upward contraction
      p3R = rBound * 0.62;
      p3Y = yBound + 0.28;
      p3Phi = phi0 + 0.22;
    } else {
      // Balustrade
      p3R = rBound * 0.55;
      p3Y = yBound - 0.12;
      p3Phi = phi0 - 0.40;
    }

    // Quadrant Partition:
    if (tau < 0.25) {
      // 1. Assembled building rotates slowly around vertical axis
      return [v0[0], v0[1], v0[2]];
    } else if (tau < 0.50) {
      // 2. Architectural layers separate and expand toward fixed outer boundary
      const p = (tau - 0.25) / 0.25;
      const E = 0.5 * (1 - Math.cos(p * Math.PI)); // Smooth cosine ease

      const curR = r0 * (1 + drMax * E);
      const curY = y0 + dyMax * E;
      return [curR * Math.cos(phi0), curY, curR * Math.sin(phi0)];
    } else if (tau < 0.75) {
      // 3. At outer boundary, components turn inward and fold toward the centre
      const p = (tau - 0.50) / 0.25;
      const F = 0.5 * (1 - Math.cos(p * Math.PI)); // Smooth cosine ease

      // Coordinated folding motion: pitch tilt around tangent + radial contraction + twist
      const curR = rBound + (p3R - rBound) * F;
      const curY = yBound + (p3Y - yBound) * F;
      const curPhi = phi0 + (p3Phi - phi0) * F;
      return [curR * Math.cos(curPhi), curY, curR * Math.sin(curPhi)];
    } else {
      // 4. Unfold and reassemble into recognisable building (seamless loop)
      const p = (tau - 0.75) / 0.25;
      const U = 0.5 * (1 - Math.cos(p * Math.PI)); // Smooth cosine ease

      const curR = p3R + (r0 - p3R) * U;
      const curY = p3Y + (y0 - p3Y) * U;
      const curPhi = p3Phi + (phi0 - p3Phi) * U;
      return [curR * Math.cos(curPhi), curY, curR * Math.sin(curPhi)];
    }
  }

  // 3D Rotations
  function rotateY(v, theta) {
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    return [
      v[0] * cos - v[2] * sin,
      v[1],
      v[0] * sin + v[2] * cos
    ];
  }

  function pitchTilt(v, phi) {
    const cos = Math.cos(phi);
    const sin = Math.sin(phi);
    return [
      v[0],
      v[1] * cos - v[2] * sin,
      v[1] * sin + v[2] * cos
    ];
  }

  function project3Dto2D(p3, scale, centerX, centerY) {
    const cameraDist = 4.4;
    const factor = scale / (cameraDist - p3[2]);
    const x = centerX + p3[0] * factor;
    const y = centerY - p3[1] * factor;
    return [x, y];
  }

  function render(forceStatic = false) {
    if (!width || !height) return;

    ctx.clearRect(0, 0, width, height);

    const pitchAngle = 0.32; // Elevated viewpoint (~18.5 deg)
    const isMobile = width < 640;
    const scale = Math.min(width, height) * (isMobile ? 0.32 : 0.36);

    const centerX = isMobile ? width * 0.50 : width * 0.56;
    const centerY = isMobile ? height * 0.54 : height * 0.55;

    // Normalised cycle position tau in [0, 1)
    const tau = isReducedMotion || forceStatic
      ? 0.0 // Canonical assembled view for reduced motion
      : (totalElapsed % CYCLE_DURATION) / CYCLE_DURATION;

    const projected2D = [];
    const projected3D = [];

    for (let i = 0; i < vertices.length; i++) {
      // 1. Compute layer transformation (expansion, inward folding, reassembly)
      let v = computeVertexTransform(vertices[i], tau);
      // 2. Rotate upright around vertical Y-axis
      v = rotateY(v, angleY);
      // 3. Elevated camera pitch tilt for architectural depth
      v = pitchTilt(v, pitchAngle);

      projected3D.push(v);
      const p2 = project3Dto2D(v, scale, centerX, centerY);
      projected2D.push(p2);
    }

    const strokeColor = '#FF2600';
    const strokeFaint = 'rgba(255, 38, 0, 0.16)';

    // Ground & Structural Datum Circles
    ctx.beginPath();
    ctx.strokeStyle = strokeFaint;
    ctx.lineWidth = 1;
    ctx.arc(centerX, centerY + scale * 0.28, scale * 0.90, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.setLineDash([3, 4]);
    ctx.arc(centerX, centerY + scale * 0.28, scale * 0.52, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Architectural Wireframe Edges
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

    // Node Markers on Key Structural Vertices
    for (let i = 0; i < projected2D.length; i += 4) {
      const [x, y] = projected2D[i];
      const nodeSize = projected3D[i][2] > 0 ? 3 : 2;
      ctx.fillStyle = strokeColor;
      ctx.fillRect(x - nodeSize / 2, y - nodeSize / 2, nodeSize, nodeSize);
    }
  }

  // Animation Loop
  let lastTimestamp = 0;

  function step(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const delta = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
    lastTimestamp = timestamp;

    if (isRunning && !isReducedMotion) {
      totalElapsed += delta;
      // Steady rotation around vertical Y-axis continues uninterrupted
      angleY += 0.20 * delta;

      if (!isDragging) {
        angleY += dragVelocity * 0.08;
        dragVelocity *= 0.92;
      }

      render();
    }

    requestAnimationFrame(step);
  }

  // Touch and Mouse Drag Interaction (non-blocking touch pan-y)
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

      dragVelocity = dx * 0.012;
      angleY += dragVelocity;

      if (isReducedMotion) render(true);
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
    render(isReducedMotion);
  });

  resize();
  requestAnimationFrame(step);
})();
