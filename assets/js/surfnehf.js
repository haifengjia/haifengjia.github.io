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

  // =========================================================
  // 01 Scenario: satellite + walker + LOS / NLOS reflection
  // =========================================================
  (function scenarioAnim() {
    var sat = document.getElementById('sc-sat');
    var los = document.getElementById('sc-los');
    var nlosA = document.getElementById('sc-nlos-a');
    var nlosB = document.getElementById('sc-nlos-b');
    var hit = document.getElementById('sc-hit');
    var person = document.getElementById('sc-person');
    var badge = document.getElementById('sc-badge');
    if (!sat || !person) return;

    var t0 = performance.now();
    var BX0 = 255, BY0 = 118, BX1 = 318, BY1 = 228;

    function blocked(x0, y0, x1, y1) {
      for (var s = 0; s <= 1; s += 0.025) {
        var x = lerp(x0, x1, s);
        var y = lerp(y0, y1, s);
        if (x >= BX0 && x <= BX1 && y >= BY0 && y <= BY1) return true;
      }
      return false;
    }

    function tick(now) {
      var t = (now - t0) / 1000;
      // satellite along arc
      var u = (Math.sin(t * 0.55) + 1) / 2;
      var sx = lerp(48, 372, u);
      var sy = 52 + 70 * Math.sin(Math.PI * u);
      sat.setAttribute('transform', 'translate(' + sx + ',' + sy + ')');

      // person walks
      var px = 95 + 170 * (0.5 - 0.5 * Math.cos(t * 0.7));
      var py = 236;
      person.setAttribute('transform', 'translate(' + px + ',' + py + ')');

      var hx = px;
      var hy = py - 26;
      var occluded = blocked(sx, sy, hx, hy);

      if (!occluded) {
        los.setAttribute('x1', sx); los.setAttribute('y1', sy);
        los.setAttribute('x2', hx); los.setAttribute('y2', hy);
        los.setAttribute('opacity', '0.9');
        nlosA.setAttribute('opacity', '0');
        nlosB.setAttribute('opacity', '0');
        hit.setAttribute('opacity', '0');
        if (badge) {
          badge.textContent = 'LOS';
          badge.setAttribute('fill', '#5fd08a');
        }
      } else {
        var hitX = BX0;
        var hitY = lerp(BY0 + 20, BY1 - 20, 0.45 + 0.1 * Math.sin(t * 2));
        los.setAttribute('opacity', '0');
        nlosA.setAttribute('x1', sx); nlosA.setAttribute('y1', sy);
        nlosA.setAttribute('x2', hitX); nlosA.setAttribute('y2', hitY);
        nlosA.setAttribute('opacity', '0.95');
        nlosB.setAttribute('x1', hitX); nlosB.setAttribute('y1', hitY);
        nlosB.setAttribute('x2', hx); nlosB.setAttribute('y2', hy);
        nlosB.setAttribute('opacity', '0.95');
        hit.setAttribute('cx', hitX); hit.setAttribute('cy', hitY);
        hit.setAttribute('opacity', '1');
        if (badge) {
          badge.textContent = 'NLOS · reflect';
          badge.setAttribute('fill', '#ef6b6b');
        }
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  // =========================================================
  // 02 NeHF: height field rising with residual noise
  // =========================================================
  (function nehfAnim() {
    var root = document.getElementById('nehf-surface');
    if (!root) return;

    var gx = 16, gy = 11;
    var nodes = [];
    var ox = 36, oy = 210;
    var sx = 16.5, sy = 9.5, sz = 92;

    for (var iy = gy - 1; iy >= 0; iy--) {
      for (var ix = 0; ix < gx; ix++) {
        var nx = (ix / (gx - 1)) * 2 - 1;
        var ny = (iy / (gy - 1)) * 2 - 1;
        var base = 0.12 + 0.78 * Math.exp(-((nx - 0.12) * (nx - 0.12)) / 0.22 - ((ny + 0.05) * (ny + 0.05)) / 0.4);
        base *= 1 / (1 + Math.exp(-9 * (nx + 0.55)));
        var noise = 0.1 * Math.sin(ix * 1.7 + iy * 2.3) + 0.07 * Math.cos(ix * 0.9 - iy * 1.4);
        var target = clamp(base + noise, 0, 1);

        var x = ox + ix * sx + iy * sy * 0.85;
        var y0 = oy - iy * sy;

        var stem = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        stem.setAttribute('x1', x);
        stem.setAttribute('y1', y0);
        stem.setAttribute('x2', x);
        stem.setAttribute('y2', y0);
        stem.setAttribute('stroke', '#3d7fd9');
        stem.setAttribute('stroke-width', '1.6');
        stem.setAttribute('stroke-linecap', 'round');
        root.appendChild(stem);

        var tip = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        tip.setAttribute('cx', x);
        tip.setAttribute('cy', y0);
        tip.setAttribute('r', '2.1');
        tip.setAttribute('fill', '#5aa2ff');
        root.appendChild(tip);

        nodes.push({ stem: stem, tip: tip, x: x, y0: y0, target: target, ix: ix, iy: iy });
      }
    }

    var t0 = performance.now();
    function tick(now) {
      var t = (now - t0) / 1000;
      var cycle = (t % 6.5) / 6.5;
      var grow = cycle < 0.72
        ? 0.5 - 0.5 * Math.cos(Math.PI * (cycle / 0.72))
        : 1;

      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        var wobble = (1 - grow) * 0.14 * Math.sin(t * 3.2 + n.ix * 0.7 + n.iy * 0.9);
        var h = clamp(grow * n.target + wobble, 0, 1.15);
        var y = n.y0 - h * sz;
        n.stem.setAttribute('y2', y);
        n.tip.setAttribute('cy', y);
        var c = Math.floor(lerp(90, 255, h));
        n.tip.setAttribute('fill', 'rgb(' + Math.floor(c * 0.35) + ',' + Math.floor(c * 0.65) + ',255)');
        n.stem.setAttribute('stroke', 'rgba(90,162,255,' + (0.35 + 0.55 * h) + ')');
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  // =========================================================
  // 03 Export: morph between point cloud and voxel map
  // =========================================================
  (function exportAnim() {
    var pointsG = document.getElementById('ex-points');
    var voxelsG = document.getElementById('ex-voxels');
    var modeLabel = document.getElementById('ex-mode');
    if (!pointsG || !voxelsG) return;

    var gx = 14, gy = 10;
    var pts = [];
    var vox = [];

    for (var iy = 0; iy < gy; iy++) {
      for (var ix = 0; ix < gx; ix++) {
        var nx = (ix / (gx - 1)) * 2 - 1;
        var ny = (iy / (gy - 1)) * 2 - 1;
        var h = 0.1 + 0.8 * Math.exp(-((nx - 0.1) * (nx - 0.1)) / 0.2 - ((ny) * (ny)) / 0.38);
        h *= 1 / (1 + Math.exp(-9 * (nx + 0.5)));
        h = clamp(h + 0.06 * Math.sin(ix * 1.3 + iy), 0, 1);
        if (h < 0.12) continue;

        var x = 42 + ix * 11 + iy * 5.5;
        var y = 205 - iy * 6 - h * 95;
        var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('cx', x);
        c.setAttribute('cy', y);
        c.setAttribute('r', '2.15');
        c.setAttribute('fill', '#5aa2ff');
        pointsG.appendChild(c);
        pts.push({ el: c, x: x, y: y, ix: ix, iy: iy });

        var stacks = Math.max(1, Math.round(h * 5));
        for (var iz = 0; iz < stacks; iz++) {
          var vx = 230 + ix * 8.2 + iy * 4.2;
          var vy = 205 - iy * 4.2 - iz * 9.5;
          var r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          r.setAttribute('x', vx);
          r.setAttribute('y', vy - 8);
          r.setAttribute('width', '7.2');
          r.setAttribute('height', '8');
          r.setAttribute('rx', '1');
          r.setAttribute('fill', 'rgba(95,208,138,0.85)');
          r.setAttribute('stroke', 'rgba(40,90,70,0.9)');
          r.setAttribute('stroke-width', '0.5');
          voxelsG.appendChild(r);
          vox.push({ el: r, iz: iz, stacks: stacks, ix: ix, iy: iy });
        }
      }
    }

    var t0 = performance.now();
    function tick(now) {
      var t = (now - t0) / 1000;
      var phase = (Math.sin(t * 0.7) + 1) / 2; // 0 points -> 1 voxels
      var pointAlpha = clamp(1.15 - phase * 1.35, 0.08, 1);
      var voxelAlpha = clamp(phase * 1.35 - 0.15, 0.05, 1);

      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        var jx = 1.2 * Math.sin(t * 2 + p.ix);
        var jy = 1.2 * Math.cos(t * 1.7 + p.iy);
        p.el.setAttribute('cx', p.x + jx * (1 - phase));
        p.el.setAttribute('cy', p.y + jy * (1 - phase));
        p.el.setAttribute('opacity', pointAlpha);
      }
      for (var j = 0; j < vox.length; j++) {
        var v = vox[j];
        var appear = v.iz / v.stacks <= phase + 0.08;
        v.el.setAttribute('opacity', appear ? voxelAlpha : 0.04);
      }
      if (modeLabel) {
        modeLabel.textContent = phase < 0.5 ? 'surface point cloud' : 'voxel occupancy map';
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();
})();
