(function () {
  // ---------- BibTeX copy ----------
  var copyBtn = document.getElementById('surfnehf-copy-bibtex');
  var bibBlock = document.getElementById('surfnehf-bibtex');
  if (copyBtn && bibBlock) {
    copyBtn.addEventListener('click', function () {
      var text = bibBlock.innerText || bibBlock.textContent || '';
      var label = copyBtn;
      function done(ok) {
        var prev = label.textContent;
        label.textContent = ok ? 'Copied' : 'Failed';
        window.setTimeout(function () { label.textContent = prev; }, 1400);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }).catch(function () { done(false); });
      } else {
        var ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { done(document.execCommand('copy')); } catch (e) { done(false); }
        document.body.removeChild(ta);
      }
    });
  }

  // ---------- Shared helpers ----------
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smoothstep(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var motionRate = reduceMotion ? 0.45 : 1;

  // =========================================================
  // 01 Scenario: simultaneous direct and surface-interaction paths
  // =========================================================
  (function scenarioAnim() {
    var sat = document.getElementById('sc-sat');
    var los = document.getElementById('sc-los');
    var nlosA = document.getElementById('sc-nlos-a');
    var nlosB = document.getElementById('sc-nlos-b');
    var hit = document.getElementById('sc-hit');
    var person = document.getElementById('sc-person');
    var losPacket = document.getElementById('sc-los-packet');
    var nlosPacket = document.getElementById('sc-nlos-packet');
    var diffA = document.getElementById('sc-diff-a');
    var diffB = document.getElementById('sc-diff-b');
    var diffHit = document.getElementById('sc-diff-hit');
    var diffPacket = document.getElementById('sc-diff-packet');
    var source = document.getElementById('sc-source');
    var satLabel = document.getElementById('sc-sat-label');
    var ueLabel = document.getElementById('sc-ue-label');
    if (!sat || !person) return;

    var t0 = performance.now();
    function setPoint(el, x, y, opacity) {
      if (!el) return;
      el.setAttribute('cx', x);
      el.setAttribute('cy', y);
      el.setAttribute('opacity', opacity);
    }

    function setBrokenPathPacket(el, ax, ay, bx, by, cx, cy, phase, opacity) {
      var lenA = Math.hypot(bx - ax, by - ay);
      var lenB = Math.hypot(cx - bx, cy - by);
      var travel = phase * (lenA + lenB);
      if (travel <= lenA) {
        var first = travel / Math.max(lenA, 0.001);
        setPoint(el, lerp(ax, bx, first), lerp(ay, by, first), opacity);
      } else {
        var second = (travel - lenA) / Math.max(lenB, 0.001);
        setPoint(el, lerp(bx, cx, second), lerp(by, cy, second), opacity);
      }
    }

    function tick(now) {
      var t = ((now - t0) / 1000) * motionRate;
      var cycle = (t % 10) / 10;
      var walk = cycle < 0.78 ? smoothstep(cycle / 0.78) : 1;
      var sceneOpacity = cycle < 0.055 ? smoothstep(cycle / 0.055) :
        cycle > 0.9 ? 1 - smoothstep((cycle - 0.9) / 0.1) : 1;
      // Quadratic Bezier coordinates match the dashed dome path in the SVG.
      var arcPhase = (Math.sin(t * 0.24 - Math.PI / 2) + 1) / 2;
      var arcU = 0.07 + 0.86 * arcPhase;
      var arcV = 1 - arcU;
      var satX = arcV * arcV * 34 + 2 * arcV * arcU * 210 + arcU * arcU * 386;
      var satY = arcV * arcV * 236 + 2 * arcV * arcU * -150 + arcU * arcU * 236;
      sat.setAttribute('transform', 'translate(' + satX + ',' + satY + ')');
      sat.setAttribute('opacity', sceneOpacity);
      if (source) source.setAttribute('r', 1.85 + 0.45 * Math.sin(t * 3.4));
      if (satLabel) {
        var labelX = satX < 250 ? satX + 21 : satX - 153;
        satLabel.setAttribute('transform', 'translate(' + labelX + ',' + (satY - 14.5) + ')');
        satLabel.setAttribute('opacity', 0.88 * sceneOpacity);
      }

      // The image is centered on the orbit; RF paths originate at the red
      // lower-left feed corner inside the 34 × 34 transparent icon canvas.
      var sx = satX - 12;
      var sy = satY + 11.5;

      var px = lerp(52, 352, walk);
      var py = 267 - (px - 52) * 0.07;
      person.setAttribute('transform', 'translate(' + px + ',' + py + ')');
      person.setAttribute('opacity', sceneOpacity);
      if (ueLabel) {
        var ueX = px < 286 ? px + 19 : px - 131;
        ueLabel.setAttribute('transform', 'translate(' + ueX + ',' + (py - 53) + ')');
        ueLabel.setAttribute('opacity', 0.9 * sceneOpacity);
      }

      // Approximate the right-hand position inside the transparent PNG canvas.
      var hx = px + 8;
      var hy = py - 24;
      var surfaceSide = smoothstep((walk - 0.4) / 0.24);
      var hitX = lerp(174, 257, surfaceSide) + 2 * Math.sin(t * 0.9);
      var hitY = 183 + 7 * Math.sin(t * 0.72 + 0.6);
      var directOpacity = (1 - smoothstep((walk - 0.37) / 0.14)) * sceneOpacity;
      var diffractionOpacity = smoothstep((walk - 0.38) / 0.16) * sceneOpacity;

      los.setAttribute('x1', sx); los.setAttribute('y1', sy);
      los.setAttribute('x2', hx); los.setAttribute('y2', hy);
      los.setAttribute('opacity', 0.82 * directOpacity);
      nlosA.setAttribute('x1', sx); nlosA.setAttribute('y1', sy);
      nlosA.setAttribute('x2', hitX); nlosA.setAttribute('y2', hitY);
      nlosA.setAttribute('opacity', 0.88 * sceneOpacity);
      nlosB.setAttribute('x1', hitX); nlosB.setAttribute('y1', hitY);
      nlosB.setAttribute('x2', hx); nlosB.setAttribute('y2', hy);
      nlosB.setAttribute('opacity', 0.88 * sceneOpacity);
      hit.setAttribute('cx', hitX); hit.setAttribute('cy', hitY);
      hit.setAttribute('opacity', (0.72 + 0.28 * Math.sin(t * 3.2)) * sceneOpacity);

      var edgeX = 267, edgeY = 133;
      diffA.setAttribute('x1', sx); diffA.setAttribute('y1', sy);
      diffA.setAttribute('x2', edgeX); diffA.setAttribute('y2', edgeY);
      diffA.setAttribute('opacity', 0.78 * diffractionOpacity);
      diffB.setAttribute('x1', edgeX); diffB.setAttribute('y1', edgeY);
      diffB.setAttribute('x2', hx); diffB.setAttribute('y2', hy);
      diffB.setAttribute('opacity', 0.9 * diffractionOpacity);
      diffHit.setAttribute('opacity', diffractionOpacity);

      var directPhase = (t * 0.38) % 1;
      setPoint(losPacket, lerp(sx, hx, directPhase), lerp(sy, hy, directPhase), 0.95 * directOpacity);
      var pathPhase = (t * 0.31 + 0.35) % 1;
      setBrokenPathPacket(nlosPacket, sx, sy, hitX, hitY, hx, hy, pathPhase, 0.95 * sceneOpacity);
      var diffractionPhase = (t * 0.29 + 0.68) % 1;
      setBrokenPathPacket(diffPacket, sx, sy, edgeX, edgeY, hx, hy, diffractionPhase, 0.95 * diffractionOpacity);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  // =========================================================
  // 02 NeHF: noisy height samples converge to a flat-roof cuboid
  // =========================================================
  (function nehfAnim() {
    var root = document.getElementById('nehf-surface');
    if (!root) return;

    var NS = 'http://www.w3.org/2000/svg';
    var scan = document.getElementById('nehf-scan');
    var netLayers = document.querySelectorAll('.nehf-layer');
    var netPacket = document.getElementById('nehf-net-packet');
    var outputLink = document.getElementById('nehf-output-link');
    var heightLine = document.getElementById('nehf-height-line');
    var queryTop = document.getElementById('nehf-query-top');
    var heightLabel = document.getElementById('nehf-height-label');
    var faces = [];
    var faceColors = ['#17385f', '#214b79', '#3976b7'];
    for (var f = 0; f < 3; f++) {
      var face = document.createElementNS(NS, 'path');
      face.setAttribute('fill', faceColors[f]);
      face.setAttribute('stroke', '#72b2f8');
      face.setAttribute('stroke-width', f === 2 ? '1.1' : '0.8');
      root.appendChild(face);
      faces.push(face);
    }

    function project(ix, iy, h) {
      return { x: 70 + ix * 13 + iy * 7, y: 240 + ix * 3.4 - iy * 3.4 - h * 91 };
    }

    var samples = [];
    for (var iy = 1; iy <= 9; iy++) {
      for (var ix = 1; ix <= 13; ix++) {
        if ((ix + iy) % 2) continue;
        var inside = ix >= 4 && ix <= 10 && iy >= 3 && iy <= 7;
        var basePoint = project(ix, iy, 0);
        var tip = document.createElementNS(NS, 'circle');
        tip.setAttribute('r', inside ? '2' : '1.35');
        tip.setAttribute('fill', inside ? '#8bc1ff' : '#42688f');
        root.appendChild(tip);
        samples.push({ el: tip, x: basePoint.x, y: basePoint.y, target: inside ? 0.82 : 0, ix: ix, iy: iy });
      }
    }

    function path(points) {
      return points.map(function (p, i) { return (i ? 'L' : 'M') + p.x + ',' + p.y; }).join(' ') + ' Z';
    }

    var t0 = performance.now();
    function tick(now) {
      var t = ((now - t0) / 1000) * motionRate;
      var cycle = (t % 7.5) / 7.5;
      var fit;
      if (cycle < 0.12) fit = 0;
      else if (cycle < 0.58) fit = smoothstep((cycle - 0.12) / 0.46);
      else if (cycle < 0.84) fit = 1;
      else fit = 1 - smoothstep((cycle - 0.84) / 0.16);
      // The recovered mass stays upright; residual noise lives in the samples,
      // rather than tilting the four structural corners independently.
      var height = 0.82 * fit + (reduceMotion ? 0.004 : 0.009) * fit * Math.sin(t * 2.05);
      var b00 = project(4, 3, 0), b10 = project(10, 3, 0), b11 = project(10, 7, 0), b01 = project(4, 7, 0);
      var t00 = project(4, 3, height), t10 = project(10, 3, height), t11 = project(10, 7, height), t01 = project(4, 7, height);
      var queryBase = project(7, 5, 0);
      var querySurface = project(7, 5, height);
      faces[0].setAttribute('d', path([b00, b10, t10, t00]));
      faces[1].setAttribute('d', path([b10, b11, t11, t10]));
      faces[2].setAttribute('d', path([t00, t10, t11, t01]));
      faces.forEach(function (face, index) {
        face.setAttribute('opacity', clamp(fit * (index === 2 ? 0.9 : 0.74), 0, 1));
      });

      for (var i = 0; i < samples.length; i++) {
        var n = samples[i];
        var noiseScale = (1 - fit) * 0.16 + fit * (reduceMotion ? 0.018 : 0.045);
        var noise = noiseScale * Math.sin(t * 2.4 + n.ix * 1.7 + n.iy * 0.9);
        noise += noiseScale * 0.35 * Math.cos(t * 3.1 - n.ix * 0.6 + n.iy);
        var h = clamp(n.target * fit + noise, 0, 1);
        var lateral = (1 - fit) * 1.4 * Math.sin(t * 1.7 + n.iy);
        n.el.setAttribute('cx', n.x + lateral);
        n.el.setAttribute('cy', n.y - h * 91);
        n.el.setAttribute('opacity', n.target ? 0.78 : 0.26 + 0.3 * (1 - fit));
      }
      if (scan) {
        scan.setAttribute('transform', 'translate(' + (fit * 142) + ',' + (fit * 48) + ')');
        scan.setAttribute('opacity', fit > 0.04 && fit < 0.97 ? 0.78 : 0.12);
      }
      var netPhase = (t * 0.27) % 1;
      if (netPacket) {
        netPacket.setAttribute('cx', lerp(102, 307, netPhase));
        netPacket.setAttribute('opacity', 0.3 + 0.7 * Math.sin(netPhase * Math.PI));
      }
      for (var layerIndex = 0; layerIndex < netLayers.length; layerIndex++) {
        var learningPulse = 0.5 + 0.5 * Math.sin(t * 2.2 - layerIndex * 0.75);
        netLayers[layerIndex].setAttribute('stroke-width', 1 + learningPulse * 0.8);
        netLayers[layerIndex].setAttribute('fill-opacity', 0.68 + learningPulse * 0.26);
      }
      if (outputLink) {
        outputLink.setAttribute('d', 'M 340,51 C 356,108 270,147 ' + querySurface.x + ',' + querySurface.y);
      }
      if (heightLine) {
        heightLine.setAttribute('x1', queryBase.x); heightLine.setAttribute('y1', queryBase.y);
        heightLine.setAttribute('x2', querySurface.x); heightLine.setAttribute('y2', querySurface.y);
        heightLine.setAttribute('opacity', 0.25 + 0.75 * fit);
      }
      if (queryTop) {
        queryTop.setAttribute('cx', querySurface.x);
        queryTop.setAttribute('cy', querySurface.y);
        queryTop.setAttribute('opacity', 0.3 + 0.7 * fit);
      }
      if (heightLabel) {
        heightLabel.setAttribute('x', querySurface.x + 8);
        heightLabel.setAttribute('y', (queryBase.y + querySurface.y) / 2);
        heightLabel.setAttribute('opacity', fit);
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  // =========================================================
  // 03 Export: the same cuboid represented as points and occupied voxels
  // =========================================================
  (function exportAnim() {
    var pointsG = document.getElementById('ex-points');
    var voxelsG = document.getElementById('ex-voxels');
    var pointScan = document.getElementById('ex-point-scan');
    if (!pointsG || !voxelsG) return;

    var NS = 'http://www.w3.org/2000/svg';
    var pts = [], vox = [];
    var NX = 7, NY = 5, NZ = 5;
    function iso(baseX, ix, iy, iz) {
      return { x: baseX + ix * 11 + iy * 6, y: 222 + ix * 3 - iy * 3 - iz * 12 };
    }
    function addPoint(ix, iy, iz) {
      var p = iso(65, ix, iy, iz);
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', p.x); c.setAttribute('cy', p.y);
      c.setAttribute('r', '1.75'); c.setAttribute('fill', '#72b2f8');
      pointsG.appendChild(c);
      pts.push({ el: c, x: p.x, y: p.y, ix: ix, iy: iy, iz: iz });
    }
    for (var iy = 0; iy < NY; iy++) {
      for (var ix = 0; ix < NX; ix++) addPoint(ix, iy, NZ);
    }
    for (var iz = 0; iz < NZ; iz++) {
      for (var fx = 0; fx < NX; fx++) addPoint(fx, 0, iz);
      for (var fy = 1; fy < NY; fy++) addPoint(NX - 1, fy, iz);
    }

    function cubePath(p) {
      var x = p.x, y = p.y;
      return 'M' + x + ',' + (y - 12) + ' l11,3 l-6,3 l-11,-3 z ' +
        'M' + x + ',' + (y - 12) + ' l11,3 l0,9 l-11,-3 z ' +
        'M' + x + ',' + (y - 12) + ' l-6,3 l0,9 l6,3 z';
    }
    for (var sum = 0; sum <= NX + NY + NZ; sum++) {
      for (var vz = 0; vz < NZ; vz++) {
        for (var vy = NY - 1; vy >= 0; vy--) {
          for (var vx = 0; vx < NX; vx++) {
            if (vx + (NY - 1 - vy) + vz !== sum) continue;
            var origin = iso(268, vx, vy, vz);
            var cube = document.createElementNS(NS, 'path');
            cube.setAttribute('d', cubePath(origin));
            cube.setAttribute('fill', '#54bd83');
            cube.setAttribute('fill-opacity', '0.72');
            cube.setAttribute('stroke', '#246443');
            cube.setAttribute('stroke-width', '0.55');
            cube.setAttribute('stroke-linejoin', 'round');
            voxelsG.appendChild(cube);
            vox.push({ el: cube, order: vx + vy + vz, ix: vx, iy: vy, iz: vz });
          }
        }
      }
    }

    var t0 = performance.now();
    function tick(now) {
      var t = ((now - t0) / 1000) * motionRate;
      var cycle = (t % 7.2) / 7.2;
      var progress = cycle < 0.06 ? 0 : cycle < 0.7 ? smoothstep((cycle - 0.06) / 0.64) : 1;
      var fade = cycle < 0.91 ? 1 : 1 - smoothstep((cycle - 0.91) / 0.09);

      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        var pointOrder = i / Math.max(1, pts.length - 1);
        var appeared = progress + 0.12 >= pointOrder;
        var pulse = reduceMotion ? 0.86 : 0.72 + 0.28 * Math.sin(t * 2.4 + p.ix * 0.7 + p.iy * 0.5);
        p.el.setAttribute('opacity', appeared ? pulse * fade : 0.06);
        p.el.setAttribute('r', appeared ? 1.75 + 0.35 * Math.sin(t * 2 + i * 0.18) : 1.2);
      }
      for (var j = 0; j < vox.length; j++) {
        var v = vox[j];
        var threshold = (v.ix + v.iy + v.iz) / (NX + NY + NZ - 3);
        v.el.setAttribute('opacity', progress + 0.1 >= threshold ? 0.92 * fade : 0.045);
      }
      if (pointScan) {
        pointScan.setAttribute('transform', 'translate(' + (progress * 67) + ',' + (progress * 20) + ')');
        pointScan.setAttribute('opacity', progress > 0.02 && progress < 0.98 ? 0.78 : 0.08);
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();
})();
