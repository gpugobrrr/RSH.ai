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

  // Cycle Parameters:
  // Complete period for a full twist-and-unwind cycle
  const CYCLE_DURATION = 14.0; // Seconds per continuous twist/unwind cycle

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

  // Compute Continuous Twisting & Contorting Deformation for a given vertex
  // Deforms as ONE connected structure, keeping wireframe lines attached.
  // Upper sections twist progressively further than the base (spiral deformation).
  // The structure bows inward (necking/radial pinch) as twist intensifies,
  // then smoothly unwinds along the same path back to the original architectural shape.
  function computeVertexTransform(vObj, tau) {
    const v0 = vObj.pos;
    const r0 = vObj.r;
    const phi0 = vObj.phi;
    const y0 = vObj.y;

    // Normalised height hNorm in [0, 1] from bottom of base (-0.65) to apex (2.08)
    const yMin = -0.65;
    const yMax = 2.08;
    const hNorm = Math.max(0, Math.min(1, (y0 - yMin) / (yMax - yMin)));

    // Continuous deformation cycle intensity D in [0, 1]:
    // D = 0 at start, peaks at D = 1 at midpoint (tau = 0.5), returns smoothly to D = 0 at tau = 1.0.
    // Uses smooth cosine envelope (0.5 * (1 - cos(2 * pi * tau))) ensuring C1 continuity and seamless looping.
    const D = 0.5 * (1 - Math.cos(tau * Math.PI * 2));

    // 1. Progressive Spiral Twist Angle:
    // Base stays grounded (twist near 0), upper drum, dome and lantern twist progressively further.
    // Quadratic easing along height (hNorm^1.35) provides a realistic structural torsion spiral.
    // Maximum twist at the summit is ~1.75 radians (~100 degrees).
    const maxTwistAtApex = 1.75;
    const twistAngle = D * maxTwistAtApex * Math.pow(hNorm, 1.35);

    // 2. Inward Bowing (Radial Pinching / Contortion):
    // Bowing is most pronounced in the mid-body (drum and spring of the dome, hNorm ~ 0.45 - 0.70),
    // creating a graceful hour-glass / waisted contortion while preserving the structural integrity.
    // Inward pinch factor reaches up to 28% radial reduction at maximum twist.
    const pinchProfile = Math.sin(hNorm * Math.PI); // 0 at base and apex, peaks at mid-height
    const bowFactor = 1.0 - (D * 0.28 * Math.pow(pinchProfile, 1.2));
    const curR = r0 * bowFactor;

    // 3. Subtle Vertical Contortion (Torsional Compression):
    // As the structure twists and bows, it experiences slight vertical compression / flexure.
    const compressionFactor = 1.0 - (D * 0.05 * Math.pow(hNorm, 1.5));
    const curY = y0 * compressionFactor;

    const curPhi = phi0 + twistAngle;

    return [
      curR * Math.cos(curPhi),
      curY,
      curR * Math.sin(curPhi)
    ];
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
    const scale = Math.min(width, height) * (isMobile ? 0.28 : 0.34);

    // Positioned above the SOMETHING text so it is prominent and visible
    const centerX = isMobile ? width * 0.50 : width * 0.62;
    const centerY = isMobile ? height * 0.38 : height * 0.33;

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
