/* Хронология /destiny/ — фильтр слоёв, панель события, карта-маршрут, адрес состояния, клавиатура.
   Данные вшиты в страницу (#destiny-data). Без библиотек. См. .docs/destiny-concept.md */
(function () {
  "use strict";
  var raw = document.getElementById("destiny-data");
  if (!raw) return;
  var D = JSON.parse(raw.textContent);
  var lang = D.lang, ui = D.ui, layers = D.layers;
  var byLayer = {}; layers.forEach(function (l) { byLayer[l.id] = l; });
  var L = function (v) { return (v && typeof v === "object") ? (v[lang] || v.en || "") : (v || ""); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  // сортировка: новое сверху; год без месяца ставим в середину года
  function key(d) { d = String(d); var p = d.split("-"); return (p[0] || "0000") + "-" + (p[1] || "06") + "-" + (p[2] || "15"); }
  var events = D.events.slice().filter(function (e) { return e && e.date; });
  events.forEach(function (e) { e.year = parseInt(String(e.date).slice(0, 4), 10); e.k = key(e.date); });
  events.sort(function (a, b) { return a.k < b.k ? 1 : a.k > b.k ? -1 : 0; });
  var byId = {}; events.forEach(function (e) { byId[e.id] = e; });
  // обратные связи: кто ссылается на меня (книга ← отклики)
  events.forEach(function (e) { e.inbound = []; });
  events.forEach(function (e) { (e.related || []).forEach(function (r) { if (byId[r]) byId[r].inbound.push(e.id); }); });

  var state = { layer: null, q: "", event: null };
  var $tl = document.getElementById("d-timeline"), $layers = document.getElementById("d-layers"),
      $panel = document.getElementById("d-panel"), $count = document.getElementById("d-count"),
      $search = document.getElementById("d-search"), $app = document.getElementById("d-app"),
      $map = document.getElementById("d-map");

  function fmtDate(d) {
    d = String(d); var p = d.split("-");
    if (p.length === 1) return p[0];
    var m = new Date(Date.UTC(+p[0], +p[1] - 1, +(p[2] || 1)));
    var opt = p.length === 2 ? { year: "numeric", month: "short" } : { year: "numeric", month: "short", day: "numeric" };
    try { return m.toLocaleDateString(lang === "so" ? "so" : lang, opt); } catch (err) { return d; }
  }
  function spanLabel(e) { return e.end ? (e.year + " — " + e.end) : fmtDate(e.date); }

  // ---------- слои
  function renderLayers() {
    var html = '<button class="d-layer all' + (state.layer ? "" : " active") + '" data-layer=""><span class="dot"></span><span>' + esc(ui.all) + '</span><span class="n">' + events.length + '</span></button>';
    layers.forEach(function (l, i) {
      var n = events.filter(function (e) { return e.layer === l.id; }).length;
      html += '<button class="d-layer' + (state.layer === l.id ? " active" : (state.layer ? " dim" : "")) + '" style="--c:' + l.color + '" data-layer="' + l.id + '" title="' + (i + 1) + '"><span class="dot"></span><span>' + esc(l.label) + '</span><span class="n">' + n + '</span></button>';
    });
    $layers.innerHTML = html;
  }
  $layers.addEventListener("click", function (ev) {
    var b = ev.target.closest(".d-layer"); if (!b) return;
    var id = b.getAttribute("data-layer") || null;
    state.layer = (state.layer === id) ? null : id;
    apply(); pushHash();
  });

  // ---------- лента
  function visible(e) {
    if (state.layer && e.layer !== state.layer) return false;
    if (state.q) {
      var hay = (L(e.title) + " " + (e.place ? L(e.place.name) : "") + " " + L(e.note) + " " + e.year).toLowerCase();
      if (hay.indexOf(state.q) < 0) return false;
    }
    return true;
  }
  var spans = events.filter(function (e) { return e.end; });
  function renderTimeline() {
    var html = "", decade = null;
    events.forEach(function (e) {
      var dec = Math.floor(e.year / 10) * 10;
      if (dec !== decade) { decade = dec; html += '<li class="d-decade" data-decade="' + dec + '">' + dec + '</li>'; }
      var l = byLayer[e.layer] || { color: "#999", label: e.layer };
      var meta = [];
      if (e.place) meta.push('<span class="pl">' + esc(L(e.place.name)) + '</span>');
      if (e.kind === "note") meta.push('<span class="pl">' + esc(L(e.note)) + '</span>');
      var dev = "";
      if (e.layer === "reviews" && e.related && e.related.length && byId[e.related[0]]) {
        dev = '<div class="dev">↳ ' + esc(ui.on) + ': <b>' + esc(L(byId[e.related[0]].title)) + '</b></div>';
      } else if (e.inbound.length && e.layer !== "reviews") {
        var revs = e.inbound.filter(function (id) { return byId[id].layer === "reviews"; });
        if (revs.length) dev = '<div class="dev">' + esc(ui.responses) + ': <b>' + revs.length + '</b> · ' + revs.map(function (id) { return byId[id].year; }).join(", ") + '</div>';
      }
      var thumb = e.image ? '<img class="thumb' + (/\/photos\//.test(e.image) ? " wide" : "") + '" src="' + esc(e.image) + '" alt="" loading="lazy">' : "";
      var bars = "";
      spans.forEach(function (s, k) { if (s.id !== e.id && e.year >= +s.date.slice(0, 4) && e.year <= +s.end) bars += '<span class="d-spanbar" style="--c:' + byLayer[s.layer].color + ';--k:' + k + '" title="' + esc(L(s.title)) + '"></span>'; });
      html += '<li class="d-stop' + (e.status === "unconfirmed" ? " unconfirmed" : "") + '" style="--c:' + l.color + '" data-id="' + esc(e.id) + '" data-layer="' + e.layer + '" tabindex="0">' +
        bars + '<span class="y">' + (e.end ? e.year + "–" : e.year) + '</span><span class="pin"></span>' +
        '<div class="t"><span class="tag">' + esc(l.label) + '</span>' + esc(L(e.title)) + (e.end ? ' <span class="m">' + esc(ui.span_to) + ' ' + e.end + '</span>' : "") + '</div>' +
        (meta.length ? '<div class="m">' + meta.join("") + '</div>' : "") + dev + thumb + '</li>';
    });
    $tl.innerHTML = html;
  }
  $tl.addEventListener("click", function (ev) {
    var li = ev.target.closest(".d-stop"); if (!li) return;
    select(li.getAttribute("data-id"));
  });
  $tl.addEventListener("keydown", function (ev) {
    var li = ev.target.closest(".d-stop"); if (!li) return;
    if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); select(li.getAttribute("data-id")); }
  });

  function apply() {
    var shown = 0, decadeHas = {};
    Array.prototype.forEach.call($tl.querySelectorAll(".d-stop"), function (li) {
      var e = byId[li.getAttribute("data-id")], v = visible(e);
      li.hidden = !v; if (v) { shown++; decadeHas[Math.floor(e.year / 10) * 10] = true; }
      // развитие: выбранная книга подсвечивает свои отклики, остальное приглушено
      var sel = state.event && byId[state.event];
      var focus = sel && (sel.inbound.length || (sel.related || []).length) ? [sel.id].concat(sel.inbound, sel.related || []) : null;
      li.classList.toggle("dim", !!(focus && focus.indexOf(e.id) < 0));
      li.classList.toggle("sel", state.event === e.id);
    });
    Array.prototype.forEach.call($tl.querySelectorAll(".d-decade"), function (li) { li.hidden = !decadeHas[li.getAttribute("data-decade")]; });
    $count.textContent = ui.stops.replace("{n}", shown) + (state.layer ? " · " + byLayer[state.layer].label : "") + (state.q ? ' · «' + state.q + '»' : "");
    renderLayers(); drawMap();
    if (shown === 0) $count.textContent += " — " + ui.nothing;
  }

  // ---------- панель
  function select(id) {
    state.event = (state.event === id) ? null : id;
    renderPanel(); apply(); pushHash();
    if (state.event) { var li = $tl.querySelector('[data-id="' + CSS.escape(id) + '"]'); if (li && li.scrollIntoView) li.scrollIntoView({ block: "nearest" }); }
  }
  function renderPanel() {
    var e = state.event && byId[state.event];
    if (!e) { $panel.hidden = true; $panel.innerHTML = ""; $app.classList.remove("has-panel"); return; }
    var l = byLayer[e.layer];
    var h = '<div class="hd" style="--c:' + l.color + '"><div><div class="layerlbl">' + esc(l.label) + '</div><h2>' + esc(L(e.title)) + '</h2><div class="date">' + esc(spanLabel(e)) + (e.place ? ' · ' + esc(L(e.place.name)) : "") + '</div></div><button class="close" aria-label="' + esc(ui.close) + '" data-close>×</button></div>';
    if (e.image) h += '<a href="' + esc(e.image.replace("/photos/z", "/photos/")) + '"><img class="big" src="' + esc(e.image) + '" alt=""></a>';
    if (L(e.note)) h += '<p class="note">' + esc(L(e.note)) + '</p>';
    if (e.status === "unconfirmed") h += '<p class="warn">' + esc(ui.unconfirmed) + '</p>';
    if (e.url) h += '<p class="src">' + esc(ui.source) + ': <a href="' + esc(e.url) + '">' + esc(e.source && e.source.label ? L(e.source.label) : ui.reviews_page) + '</a>' + (e.link ? ' · <a href="' + esc(e.link) + '">' + esc(ui.full_text) + '</a>' : "") + '</p>';
    var rel = (e.related || []).concat(e.inbound).filter(function (id, i, a) { return byId[id] && a.indexOf(id) === i; });
    if (rel.length) {
      h += '<h3>' + esc(ui.related) + '</h3><ol>';
      rel.forEach(function (id) { var r = byId[id]; h += '<li style="--c:' + byLayer[r.layer].color + '"><button data-go="' + esc(id) + '"><span class="yy">' + r.year + '</span>' + esc(L(r.title)) + '</button></li>'; });
      h += '</ol>';
    }
    var same = events.filter(function (x) { return x.layer === e.layer; });
    h += '<h3>' + esc(ui.in_layer) + ' — ' + esc(l.label) + ' (' + same.length + ')</h3><ol style="--c:' + l.color + '">';
    same.forEach(function (x) { h += '<li' + (x.id === e.id ? ' class="cur"' : "") + '><button data-go="' + esc(x.id) + '"><span class="yy">' + x.year + '</span>' + esc(L(x.title)) + '</button></li>'; });
    h += '</ol>';
    var vis = events.filter(visible), i = vis.indexOf(e);
    h += '<div class="nav">' + (i > 0 ? '<button data-go="' + esc(vis[i - 1].id) + '">↑ ' + esc(ui.prev) + '</button>' : "") + (i >= 0 && i < vis.length - 1 ? '<button data-go="' + esc(vis[i + 1].id) + '">↓ ' + esc(ui.next) + '</button>' : "") + '</div>';
    $panel.innerHTML = h; $panel.hidden = false; $app.classList.add("has-panel"); $panel.scrollTop = 0;
  }
  $panel.addEventListener("click", function (ev) {
    var go = ev.target.closest("[data-go]"); if (go) { select(go.getAttribute("data-go")); return; }
    if (ev.target.closest("[data-close]")) { select(state.event); }
  });

  // ---------- поиск, клавиши, адрес
  var qt; $search.addEventListener("input", function () { clearTimeout(qt); qt = setTimeout(function () { state.q = $search.value.trim().toLowerCase(); apply(); pushHash(); }, 120); });
  document.addEventListener("keydown", function (ev) {
    if (ev.target === $search && ev.key !== "Escape") return;
    if (ev.key === "Escape") { if (state.event) select(state.event); else if (state.q) { $search.value = ""; state.q = ""; apply(); pushHash(); } return; }
    if (/^[1-8]$/.test(ev.key) && !ev.ctrlKey && !ev.metaKey && !ev.altKey) { var l = layers[+ev.key - 1]; state.layer = state.layer === l.id ? null : l.id; apply(); pushHash(); return; }
    if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
      var vis = events.filter(visible); if (!vis.length) return;
      var i = state.event ? vis.findIndex(function (x) { return x.id === state.event; }) : -1;
      var n = ev.key === "ArrowDown" ? Math.min(vis.length - 1, i + 1) : Math.max(0, i - 1);
      ev.preventDefault(); select(vis[n].id);
    }
  });
  function pushHash() {
    var p = [];
    if (state.layer) p.push("layer=" + state.layer);
    if (state.event) p.push("event=" + encodeURIComponent(state.event));
    if (state.q) p.push("q=" + encodeURIComponent(state.q));
    var h = p.length ? "#" + p.join("&") : location.pathname + location.search;
    if (location.hash !== (p.length ? h : "")) history.replaceState(null, "", h);
  }
  function readHash() {
    var m = {}; location.hash.replace(/^#/, "").split("&").forEach(function (kv) { var i = kv.indexOf("="); if (i > 0) m[kv.slice(0, i)] = decodeURIComponent(kv.slice(i + 1)); });
    state.layer = byLayer[m.layer] ? m.layer : null;
    state.event = byId[m.event] ? m.event : null;
    state.q = (m.q || "").toLowerCase(); $search.value = m.q || "";
  }
  window.addEventListener("hashchange", function () { readHash(); renderPanel(); apply(); });

  // ---------- карта: геометки и пунктирный маршрут (без береговых линий)
  function drawMap() {
    if (!$map || !$map.getContext) return;
    var ctx = $map.getContext("2d"), dpr = window.devicePixelRatio || 1;
    var cssW = $map.clientWidth || 300, cssH = cssW; $map.width = cssW * dpr; $map.height = cssH * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    var pts = events.filter(function (e) { return e.place && visible(e); }).map(function (e) { return { e: e, lat: e.place.lat, lon: e.place.lon }; });
    if (!pts.length) return;
    var minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
    pts.forEach(function (p) { minLat = Math.min(minLat, p.lat); maxLat = Math.max(maxLat, p.lat); minLon = Math.min(minLon, p.lon); maxLon = Math.max(maxLon, p.lon); });
    var padLat = Math.max(4, (maxLat - minLat) * .15), padLon = Math.max(4, (maxLon - minLon) * .15);
    minLat -= padLat; maxLat += padLat; minLon -= padLon; maxLon += padLon;
    var pad = 14, w = cssW - pad * 2, h = cssH - pad * 2;
    var sx = w / (maxLon - minLon), sy = h / (maxLat - minLat), s = Math.min(sx, sy * 1); // равнопромежуточная проекция
    var ox = pad + (w - (maxLon - minLon) * s) / 2, oy = pad + (h - (maxLat - minLat) * s) / 2;
    var X = function (lon) { return ox + (lon - minLon) * s; }, Y = function (lat) { return oy + (maxLat - lat) * s; };
    // сетка
    ctx.strokeStyle = "#e3e6e0"; ctx.lineWidth = 1;
    for (var lon = Math.ceil(minLon / 10) * 10; lon <= maxLon; lon += 10) { ctx.beginPath(); ctx.moveTo(X(lon), pad); ctx.lineTo(X(lon), cssH - pad); ctx.stroke(); }
    for (var lat = Math.ceil(minLat / 10) * 10; lat <= maxLat; lat += 10) { ctx.beginPath(); ctx.moveTo(pad, Y(lat)); ctx.lineTo(cssW - pad, Y(lat)); ctx.stroke(); }
    // маршрут во времени (старое → новое), без повторов подряд
    var route = pts.slice().sort(function (a, b) { return a.e.k < b.e.k ? -1 : 1; }), last = null;
    ctx.setLineDash([2, 4]); ctx.strokeStyle = "#8a929b"; ctx.lineWidth = 1.2; ctx.beginPath();
    route.forEach(function (p) { var k = p.lat + "," + p.lon; if (k === last) return; if (last === null) ctx.moveTo(X(p.lon), Y(p.lat)); else ctx.lineTo(X(p.lon), Y(p.lat)); last = k; });
    ctx.stroke(); ctx.setLineDash([]);
    // метки: одна на место, цвет первого события в месте; выбранное — кольцо
    var seen = {}; var selE = state.event && byId[state.event];
    pts.forEach(function (p) {
      var k = p.lat + "," + p.lon; var isSel = selE && selE.place && selE.place.lat === p.lat && selE.place.lon === p.lon;
      if (seen[k] && !isSel) return; seen[k] = true;
      var c = (byLayer[p.e.layer] || {}).color || "#666";
      ctx.beginPath(); ctx.arc(X(p.lon), Y(p.lat), isSel ? 6 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = isSel ? "#fff" : c; ctx.fill(); ctx.lineWidth = isSel ? 2.5 : 1; ctx.strokeStyle = c; ctx.stroke();
      ctx.fillStyle = "#3c454f"; ctx.font = (isSel ? "600 " : "") + "10px system-ui, sans-serif";
      ctx.fillText(L(p.e.place.name), X(p.lon) + 7, Y(p.lat) + 3.5);
    });
  }
  window.addEventListener("resize", drawMap);

  // ---------- старт
  renderTimeline(); readHash(); renderPanel(); apply();
})();
