/* Караван внизу страницы (20.10.2026).
 * Пустыня в перспективе: пастух ведёт двух верблюдов по ложбине между барханами к
 * оазису у горизонта; оазис дрожит в мареве и, когда караван подходит, тает — мираж.
 * Карандашный эскиз на холсте, без библиотек. Рисует только пока полоса видна;
 * при prefers-reduced-motion — один неподвижный кадр. По нажатию на караван —
 * пословица о верблюдах (тексты из data/proverbs.json, см. partials/caravan.html).
 */
(function () {
  "use strict";
  var root = document.getElementById("caravan"), cv = root.querySelector("canvas"),
      ctx = cv.getContext("2d"), bubble = root.querySelector(".cv-bubble");
  var REDUCE = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Пословицы о верблюдах: {so, tr} из data/proverbs.json, кладёт partials/caravan.html */
  var PROVERBS = [];
  try { PROVERBS = JSON.parse(root.getAttribute("data-proverbs") || "[]").map(function (p) { return [p.so, p.tr]; }); } catch (e) {}

  /* ---------- случайность с семенем: штрих не «кипит» от кадра к кадру ---------- */
  function rnd(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function noise(i, s) { var x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x) - .5; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function mix(c1, c2, t) { return "rgb(" + [0, 1, 2].map(function (i) { return Math.round(lerp(c1[i], c2[i], t)); }).join(",") + ")"; }

  /* ---------- фигуры (контуры в условных единицах, 1 ед. ≈ 4,5 см; земля y=0) ---------- */
  var U = 0.045 * 1.5;   // фигуры чуть преувеличены, как на рисунке
  var P = {
    camel: new Path2D("M0,-30 C6,-40 14,-48 22,-48 C30,-48 34,-40 38,-34 C42,-31 46,-33 50,-38 C53,-42 55,-46 59,-46 L66,-44 C67,-42 66,-41 63,-41 C59,-40 57,-36 54,-31 C51,-26 47,-22 42,-20 C34,-18 18,-18 8,-20 C3,-22 1,-25 0,-30 Z"),
    camelX: new Path2D("M14,-44 C18,-46 24,-46 28,-43 M1,-28 C-2,-24 -2,-20 -1,-15"),
    legF: new Path2D("M0,0 L1.5,10 L0.5,20 l2,0"),
    legH: new Path2D("M0,0 L-1,10 L0.5,20 l2,0"),
    manBody: new Path2D("M0,-32 C0.5,-27 0.8,-22 0.5,-17 M-11,-30 L11,-27.5 c1.5,0 2,-1.5 1,-2.5 M0.3,-30 C-3,-29 -6,-29 -8,-29.6 M0.6,-29.5 C3,-28.5 5.5,-28 7.5,-28"),
    manHead: new Path2D("M3.5,-35 A3,3 0 1 1 3.49,-35.2"),
    macawiis: new Path2D("M-3,-18 L3.5,-18 L4.5,-7 L-4,-7 Z"),
    manLeg: new Path2D("M0,0 L0.5,7 l2,0")
  };
  var SAND = [200, 169, 106], INK = [91, 74, 51], FAR = [150, 164, 178];

  /* штрих карандашом: два прохода с небольшим сдвигом */
  function pencil(path, seed, lw, color, alpha, fill) {
    var r = rnd(seed);
    if (fill) { ctx.globalAlpha = alpha * .22; ctx.fillStyle = fill; ctx.fill(path); }
    ctx.strokeStyle = color; ctx.lineWidth = lw;
    ctx.globalAlpha = alpha; ctx.save(); ctx.translate((r() - .5) * .6, (r() - .5) * .6); ctx.stroke(path); ctx.restore();
    ctx.globalAlpha = alpha * .45; ctx.lineWidth = lw * .7;
    ctx.save(); ctx.translate((r() - .5) * 1.4, (r() - .5) * 1.4); ctx.stroke(path); ctx.restore();
    ctx.globalAlpha = 1;
  }

  /* ---------- сцена и перспектива ---------- */
  var W, H, dpr, horizon, vpX, f, HC = 6, camX = 0;
  var Z0 = 8, Z1 = 64, OASIS_Z = 88, track = [], L = 0, oasis = null;
  var RIDGES = [7.4, 10, 14, 20, 29, 42, 62, 95];

  function proj(X, h, z) { return { x: vpX + f * (X - camX) / z, y: horizon + f * (HC - h) / z, s: f / z }; }
  function ridgeH(X, z, k) {
    var amp = Math.min(4.5, 1.1 + .05 * z);
    var v = .5 + .38 * Math.sin(X * .06 + k * 1.7) + .12 * Math.sin(X * .19 + k * 4.1);
    var h = amp * v * v;   // квадрат — острые гребни и пологие ложбины, как у барханов
    var tx = trackX(z);    // вдоль пути каравана — ложбина, чтобы дюны его не заслоняли
    if (tx !== null) { var q = clamp((Math.abs(X - tx) - 2) / (6 + z * .25), 0, 1); h *= .08 + .92 * q * q * (3 - 2 * q); }
    return h;
  }

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = root.clientWidth; H = root.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    horizon = H * .34; vpX = W * (W < 600 ? .74 : .8);
    f = (H - horizon) * 7 / HC;
    buildTrack(); buildOasis();
  }

  /* путь каравана в мире: из ближнего левого края к оазису, с плавными изгибами */
  var Xs = 0, Xe = -5;
  function trackX(z) {
    if (z < Z0 - 3 || z > Z1 + 6) return null;
    var t = clamp((z - Z0) / (Z1 - Z0), 0, 1);
    return Xs + (Xe - Xs) * (1 - Math.pow(1 - t, 1.7)) + 3.2 * Math.sin(t * Math.PI * 3) * (1 - t);
  }
  function buildTrack() {
    Xs = (W * .06 - vpX) * Z0 / f;
    track = []; L = 0;
    for (var i = 0; i <= 300; i++) {
      var t = i / 300, z = lerp(Z0, Z1, t), X = trackX(z);
      if (i) { var p = track[i - 1]; L += Math.hypot(X - p.X, z - p.z); }
      track.push({ X: X, z: z, d: L });
    }
  }
  function at(d) {
    d = clamp(d, 0, L);
    var lo = 0, hi = track.length - 1;
    while (hi - lo > 1) { var m = (lo + hi) >> 1; if (track[m].d < d) lo = m; else hi = m; }
    var a = track[lo], b = track[hi], t = (d - a.d) / ((b.d - a.d) || 1);
    return { X: lerp(a.X, b.X, t), z: lerp(a.z, b.z, t) };
  }

  /* оазис рисуется один раз в отдельный холст, а марево — построчным сдвигом */
  function buildOasis() {
    var s = f / OASIS_Z, oW = Math.ceil(16 * s + 120), oH = Math.ceil(12 * s + 30), base = oH - 12;
    var c = document.createElement("canvas"); c.width = oW * dpr; c.height = oH * dpr;
    var o = c.getContext("2d"); o.scale(dpr, dpr); o.lineCap = "round"; o.strokeStyle = "rgb(140,128,104)";
    function palm(x, hgt, lean, seed) {
      var r = rnd(seed), top = { x: x + lean, y: base - hgt };
      o.lineWidth = 1; o.beginPath(); o.moveTo(x, base); o.quadraticCurveTo(x + lean * .2, base - hgt * .55, top.x, top.y); o.stroke();
      o.lineWidth = .8;
      for (var k = 0; k < 6; k++) {
        var ang = -Math.PI + k * Math.PI / 5 + (r() - .5) * .3, len = hgt * (.42 + r() * .2);
        o.beginPath(); o.moveTo(top.x, top.y);
        o.quadraticCurveTo(top.x + Math.cos(ang) * len * .6, top.y + Math.sin(ang) * len * .6 - len * .25,
                           top.x + Math.cos(ang) * len, top.y + Math.sin(ang) * len * .4 + len * .25);
        o.stroke();
      }
    }
    var cx = oW / 2;
    palm(cx - 4, 10 * s, 2, 11); palm(cx + 12, 8 * s, 3, 12); palm(cx - 20, 6 * s, -2, 13); palm(cx + 26, 5 * s, 1, 14);
    o.lineWidth = .8; o.beginPath(); o.moveTo(cx - 42, base + .5); o.quadraticCurveTo(cx, base - 1, cx + 46, base + .5); o.stroke();
    o.globalAlpha = .6; o.beginPath(); o.moveTo(cx - 30, base + 3); o.lineTo(cx - 8, base + 3); o.moveTo(cx + 2, base + 3.5); o.lineTo(cx + 30, base + 3.5); o.stroke();
    oasis = { c: c, w: oW, h: oH, base: base };
  }

  /* ---------- состояние анимации ---------- */
  var WALK = 80, PAUSE = 6, GAP1 = 4.4, GAP2 = 10;   // метры между пастухом и верблюдами: верблюд с верёвкой ≈ 5 м
  var clock = 0, cycle = 0, last = 0, revealAt = -1, visible = false, steps = [], lastStep = 0, hits = null;

  function frame(now) {
    if (!visible || document.hidden) { last = 0; return; }
    requestAnimationFrame(frame);
    if (last && now - last < 28) return;           // ~35 кадров в секунду хватает
    var dt = last ? Math.min(.1, (now - last) / 1000) : 0; last = now;
    clock += dt; cycle += dt;
    if (cycle > WALK + PAUSE) { cycle = 0; steps = []; lastStep = 0; }
    draw(now / 1000);
  }

  function draw(time) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var reveal = REDUCE ? 1 : revealAt < 0 ? 0 : clamp((clock - revealAt) / 2.6, 0, 1);

    /* параллакс: пока полоса выезжает снизу экрана, «камера» чуть смещается */
    var rect = root.getBoundingClientRect();
    camX = clamp((rect.top + H - innerHeight) / innerHeight, 0, 1) * 4;

    /* небо и земля */
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "rgba(251,247,239,0)"); g.addColorStop(horizon / H, "rgba(251,247,239,1)"); g.addColorStop(1, "rgb(243,232,210)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    /* солнце */
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    var sun = new Path2D(), sr = H * .07, sx = vpX + W * .05 - camX * 2, sy = horizon - H * .16;
    sun.arc(sx, sy, sr, 0, 7);
    for (var k = 0; k < 8; k++) { var a = k * Math.PI / 4; sun.moveTo(sx + Math.cos(a) * sr * 1.35, sy + Math.sin(a) * sr * 1.35); sun.lineTo(sx + Math.cos(a) * sr * 1.7, sy + Math.sin(a) * sr * 1.7); }
    pencil(sun, 5, .8, "rgb(214,190,140)", .55 * reveal);

    /* где караван сейчас */
    var walking = cycle < WALK, dMan = walking ? (cycle / WALK) * (L - 2) + GAP2 : L + 50;
    var tMan = clamp(dMan / L, 0, 1);
    var oasisA = walking ? 1 - clamp((tMan - .66) / .2, 0, 1) : clamp((cycle - WALK) / PAUSE, 0, 1);
    var caravanA = (walking ? clamp(cycle / 3, 0, 1) * (1 - clamp((tMan - .86) / .12, 0, 1)) : 0) * clamp((reveal - .5) * 2, 0, 1);

    /* оазис в мареве и его отражение */
    if (oasis) {
      var op = proj(0, 0, OASIS_Z), x0 = op.x - oasis.w / 2, y0 = op.y - oasis.base;
      var still = REDUCE ? 0 : 1;
      ctx.globalAlpha = .8 * oasisA * reveal;
      for (var r2 = 0; r2 < oasis.h; r2 += 2) {
        var amp = .4 + 2.4 * Math.pow(r2 / oasis.h, 2);
        ctx.drawImage(oasis.c, 0, r2 * dpr, oasis.w * dpr, 2 * dpr, x0 + Math.sin(time * 2.3 + r2 * .45) * amp * still, y0 + r2, oasis.w, 2);
      }
      for (var r3 = 0; r3 < 16; r3++) {
        ctx.globalAlpha = .26 * (1 - r3 / 16) * oasisA * reveal;
        var sy2 = oasis.base - r3 - 1;
        if (sy2 < 0) break;
        ctx.drawImage(oasis.c, 0, sy2 * dpr, oasis.w * dpr, dpr, x0 + Math.sin(time * 3 + r3 * .8) * (1.5 + r3 * .18) * still, y0 + oasis.base + r3 + 1, oasis.w, 1);
      }
      ctx.globalAlpha = 1;
    }

    /* горизонт */
    var hz = new Path2D(); hz.moveTo(0, horizon + 1);
    for (var x = 0; x <= W; x += 12) hz.lineTo(x, horizon + 1 + noise(x, 3) * .8);
    pencil(hz, 9, .6, "rgb(170,160,140)", .5 * reveal);

    /* всё, что стоит на земле, рисуем от дальнего к ближнему */
    var items = [];
    RIDGES.forEach(function (z, k) { items.push({ z: z, f: function () { drawRidge(z, k, reveal); } }); });
    steps.forEach(function (s) { items.push({ z: s.z, f: function () { drawStep(s); } }); });
    hits = null;
    if (caravanA > 0) {
      var man = at(dMan), c1 = at(dMan - GAP1), c2 = at(dMan - GAP2), phase = dMan;
      if (walking && dMan - lastStep > .8) { lastStep = dMan; steps.push({ X: man.X - .3, z: man.z, t: clock }, { X: c1.X + .4, z: c1.z, t: clock }, { X: c2.X + .2, z: c2.z, t: clock }); if (steps.length > 150) steps.splice(0, 3); }
      var fig = [
        { k: "camel", w: c2, seed: 31, ph: phase * 3.9 + 1.3 },
        { k: "camel", w: c1, seed: 32, ph: phase * 3.9 },
        { k: "man", w: man, seed: 33, ph: phase * 5.2 }
      ];
      fig.forEach(function (F) {
        F.p = proj(F.w.X, 0, F.w.z);
        items.push({ z: F.w.z, f: function () { drawFigure(F, caravanA); } });
      });
      items.push({ z: c1.z - .05, f: function () { rope(fig[0], [66, -44], fig[1], [1, -27], caravanA); rope(fig[1], [66, -44], fig[2], [-8, -29.6], caravanA); } });
      var pu = function (F) { return F.p.s * U; };
      hits = {
        x0: fig[0].p.x - 35 * pu(fig[0]), x1: fig[2].p.x + 12 * pu(fig[2]),
        y0: Math.min.apply(null, fig.map(function (F) { return F.p.y - 48 * pu(F); })), y1: fig[0].p.y + 4,
        head: { x: fig[2].p.x, y: fig[2].p.y - 38 * pu(fig[2]) }
      };
    }
    items.sort(function (a, b) { return b.z - a.z; }).forEach(function (it) { it.f(); });
  }

  function depthT(z) { return clamp((z - 8) / 70, 0, 1); }

  function drawRidge(z, k, reveal) {
    var pts = [], n = Math.ceil((W + 40) / 7), upto = Math.ceil(n * clamp(reveal * 1.25 - k * .02, 0, 1));
    for (var i = 0; i <= n; i++) {
      var x = -20 + i * 7, X = (x - vpX) * z / f + camX, p = proj(X, ridgeH(X, z, k), z);
      pts.push({ x: p.x, y: p.y + noise(i, k) * .7, crest: ridgeH(X, z, k) > Math.min(4.5, 1.1 + .05 * z) * .28 });
    }
    /* Гребень не должен подниматься выше ног каравана, идущего за этой дюной:
       ложбина считается в экранных координатах по всему пути (он неподвижен),
       с пологими склонами, чтобы линия не ломалась уступом. */
    var floor = new Array(n + 1).fill(-1e9);
    for (var j = 0; j < track.length; j += 2) {
      var tp = track[j];
      if (tp.z <= z + .3) continue;
      var q = proj(tp.X, 0, tp.z), half = 40 * U * f / tp.z + 4;
      var i0 = Math.max(0, Math.floor((q.x - half + 20) / 7)), i1 = Math.min(n, Math.ceil((q.x + half + 20) / 7));
      for (i = i0; i <= i1; i++) floor[i] = Math.max(floor[i], q.y + 1.5);
    }
    for (i = 1; i <= n; i++) floor[i] = Math.max(floor[i], floor[i - 1] - 2.5);
    for (i = n - 1; i >= 0; i--) floor[i] = Math.max(floor[i], floor[i + 1] - 2.5);
    for (i = 0; i <= n; i++) if (pts[i].y < floor[i]) pts[i].y = floor[i];
    var t = depthT(z), fillC = mix([251, 246, 236], [243, 232, 210], clamp((pts[0].y - horizon) / (H - horizon), 0, 1));
    var body = new Path2D(); body.moveTo(pts[0].x, pts[0].y);
    for (i = 1; i < pts.length; i++) body.lineTo(pts[i].x, pts[i].y);
    body.lineTo(W + 20, H + 2); body.lineTo(-20, H + 2); body.closePath();
    ctx.fillStyle = fillC; ctx.fill(body);
    if (!upto) return;
    var line = new Path2D(), on = false;
    for (i = 0; i < upto; i++) {
      if (pts[i].crest) { if (on) line.lineTo(pts[i].x, pts[i].y); else line.moveTo(pts[i].x, pts[i].y); on = true; }
      else on = false;
    }
    var col = mix([138, 115, 80], FAR, t), lw = lerp(1.25, .5, t), a = lerp(.85, .35, t);
    pencil(line, 50 + k, lw, col, a);
    /* штриховка подветренных склонов — только у ближних барханов */
    if (z < 40) {
      var hatch = new Path2D(), r = rnd(70 + k), len = 2 + 9 * (8 / z);
      for (i = 1; i < upto - 1; i += 2) {
        var slope = (pts[i + 1].y - pts[i].y) / 7;
        if (pts[i].crest && slope > .08 && r() < .8) { hatch.moveTo(pts[i].x, pts[i].y + 1.2); hatch.lineTo(pts[i].x - len * .55, pts[i].y + 1.2 + len); }
      }
      pencil(hatch, 90 + k, lw * .55, col, a * .5);
    }
  }

  function drawStep(s) {
    var age = clock - s.t, a = clamp(1 - age / 14, 0, 1) * .5;
    if (a <= 0) return;
    var p = proj(s.X, 0, s.z), w = Math.max(.6, p.s * .16);
    ctx.globalAlpha = a; ctx.strokeStyle = mix([138, 115, 80], FAR, depthT(s.z)); ctx.lineWidth = Math.max(.4, w * .5);
    ctx.beginPath(); ctx.moveTo(p.x - w, p.y + .5); ctx.lineTo(p.x + w, p.y + .5); ctx.stroke(); ctx.globalAlpha = 1;
  }

  function drawFigure(F, alpha) {
    var p = F.p, ppu = p.s * U, t = depthT(F.w.z);
    if (ppu < .05) return;
    var col = mix(INK, FAR, t), a = alpha * lerp(.9, .45, t), lw = lerp(1.3, .55, t) / ppu, fill = mix(SAND, FAR, t);
    ctx.save(); ctx.translate(p.x, p.y);
    ctx.scale(ppu, ppu);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    var sw = Math.sin(F.ph);
    if (F.k === "camel") {
      ctx.translate(-33, Math.abs(Math.cos(F.ph)) * -.6);
      [[40, -20, 1, P.legF, 1], [11, -20, 1, P.legH, 1], [37, -20, -1, P.legF, .7], [8, -20, -1, P.legH, .7]].forEach(function (L2) {
        ctx.save(); ctx.translate(L2[0], L2[1]); ctx.rotate(sw * .2 * L2[2]); pencil(L2[3], F.seed + L2[0], lw, col, a * L2[4]); ctx.restore();
      });
      pencil(P.camel, F.seed, lw, col, a, fill);
      pencil(P.camelX, F.seed + 5, lw * .75, col, a * .8);
    } else {
      [[-1, -7, 1, 1], [1.5, -7, -1, .7]].forEach(function (L2) {
        ctx.save(); ctx.translate(L2[0], L2[1]); ctx.rotate(sw * .3 * L2[2]); pencil(P.manLeg, F.seed + L2[0], lw, col, a * L2[3]); ctx.restore();
      });
      ctx.translate(0, Math.abs(Math.cos(F.ph)) * -.7);
      pencil(P.macawiis, F.seed + 1, lw * .9, col, a, fill);
      pencil(P.manBody, F.seed + 2, lw, col, a);
      pencil(P.manHead, F.seed + 3, lw, col, a);
    }
    ctx.restore();
  }

  function rope(A, ap, B, bp, alpha) {
    function pt(F, lp) {
      var ppu = F.p.s * U, dx = F.k === "camel" ? -33 : 0;
      return { x: F.p.x + (lp[0] + dx) * ppu, y: F.p.y + lp[1] * ppu };
    }
    var a = pt(A, ap), b = pt(B, bp), t = depthT((A.w.z + B.w.z) / 2), path = new Path2D();
    path.moveTo(a.x, a.y); path.quadraticCurveTo((a.x + b.x) / 2, Math.max(a.y, b.y) + 3 * A.p.s * U * 20 / 20, b.x, b.y);
    pencil(path, 77, lerp(.7, .35, t), mix(INK, FAR, t), alpha * lerp(.6, .3, t));
  }

  /* ---------- пословица по нажатию на караван ---------- */
  var pIdx = 0, hideT = 0;
  function onCaravan(e) {
    if (!hits) return false;
    var r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    return x > hits.x0 - 6 && x < hits.x1 + 6 && y > hits.y0 - 6 && y < hits.y1 + 6;
  }
  cv.addEventListener("mousemove", function (e) { cv.style.cursor = onCaravan(e) ? "pointer" : ""; });
  cv.addEventListener("click", function (e) {
    if (!onCaravan(e) || !PROVERBS.length) return;
    var pr = PROVERBS[pIdx++ % PROVERBS.length];
    bubble.innerHTML = "<i></i><span></span>";
    bubble.querySelector("i").textContent = pr[0]; bubble.querySelector("span").textContent = pr[1] || "";
    var bw = Math.min(300, W - 16);
    bubble.style.left = clamp(hits.head.x - bw / 2, 8, W - bw - 8) + "px";
    bubble.style.width = bw + "px";
    bubble.style.bottom = (H - hits.y0 + 8) + "px";
    bubble.classList.add("on");
    clearTimeout(hideT); hideT = setTimeout(function () { bubble.classList.remove("on"); }, 9000);
  });

  /* ---------- запуск ---------- */
  function start() {
    if (REDUCE) { cycle = WALK * .42; clock = 100; revealAt = 0; draw(0); return; }
    if (!visible) return;
    if (revealAt < 0) revealAt = clock;
    requestAnimationFrame(frame);
  }
  new IntersectionObserver(function (es) {
    var was = visible; visible = es[0].isIntersecting;
    if (visible && !was) start();
  }).observe(root);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) start(); });
  var ro = new ResizeObserver(function () { resize(); if (REDUCE || !visible) draw(0); });
  ro.observe(root);
  resize();
  if (REDUCE) start();

})();
