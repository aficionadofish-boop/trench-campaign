(function () {
  "use strict";

  var D = window.CAMPAIGN;
  var CVP = { win: 15, loss: 7, draw: 10 };
  var byId = {};
  D.warbands.forEach(function (w) { byId[w.id] = w; });

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- storage (optional, per viewer) ---------- */
  function load(key, fallback) {
    try { var v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  }

  /* ---------- clacky sound (Web Audio, no files) ---------- */
  var soundOn = load("tc-sound", true);
  var actx = null;
  function audio() {
    if (!actx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      actx = new AC();
    }
    if (actx.state === "suspended") actx.resume();
    return actx;
  }
  function clack(down) {
    if (!soundOn) return;
    var ctx = audio();
    if (!ctx) return;
    var t = ctx.currentTime;
    var len = Math.floor(ctx.sampleRate * 0.035);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = down ? 2600 : 3800;
    bp.Q.value = 1.4;
    var g = ctx.createGain();
    g.gain.setValueAtTime(down ? 0.9 : 0.45, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    src.connect(bp).connect(g).connect(ctx.destination);
    src.start(t);
    if (down) {
      var o = ctx.createOscillator();
      var og = ctx.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(220, t);
      o.frequency.exponentialRampToValueAtTime(90, t + 0.03);
      og.gain.setValueAtTime(0.35, t);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      o.connect(og).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.06);
    }
  }
  var CLICKY = "button, .tab, select";
  document.addEventListener("pointerdown", function (e) {
    var b = e.target.closest(CLICKY);
    if (b) { clack(true); b.classList.add("down"); }
  });
  document.addEventListener("pointerup", function (e) {
    var had = $all(".down");
    had.forEach(function (b) { b.classList.remove("down"); });
    if (had.length) clack(false);
  });
  document.addEventListener("pointercancel", function () {
    $all(".down").forEach(function (b) { b.classList.remove("down"); });
  });

  function setSound(on) {
    soundOn = on;
    save("tc-sound", on);
    document.body.classList.toggle("muted-sound", !on);
    $("#sm-sound").textContent = "Sound: " + (on ? "On" : "Off");
  }

  /* ---------- stats ---------- */
  function sumField(games, field, id) {
    var total = 0, known = 0, missing = 0;
    games.forEach(function (g) {
      var v = g[field] && g[field][id];
      if (v == null) missing++; else { total += v; known++; }
    });
    return { total: total, known: known, missing: missing };
  }
  function fmtSum(s, suffix) {
    if (s.known === 0 && s.missing === 0) return "—";
    if (s.known === 0 && s.missing > 0) return "?";
    if (s.known === 0) return "0" + (suffix || "");
    return s.total + (s.missing ? "+" : "") + (suffix || "");
  }
  function resultFor(g, id) {
    if (g.winner === "draw" || g.winner == null) return "draw";
    return g.winner === id ? "win" : "loss";
  }
  function statsFor(id) {
    var games = D.games.filter(function (g) { return g.players.indexOf(id) !== -1; });
    var s = { id: id, games: games, w: 0, l: 0, d: 0, cvp: 0, h2h: {} };
    games.forEach(function (g) {
      var r = resultFor(g, id);
      if (r === "win") s.w++; else if (r === "loss") s.l++; else s.d++;
      s.cvp += CVP[r] + ((g.cvpBonus && g.cvpBonus[id]) || 0);
      g.players.forEach(function (o) {
        if (o === id) return;
        var h = s.h2h[o] || (s.h2h[o] = { w: 0, l: 0, d: 0, vpFor: 0, vpAgainst: 0 });
        if (r === "win") h.w++; else if (r === "loss") h.l++; else h.d++;
        if (g.vp) { h.vpFor += g.vp[id] || 0; h.vpAgainst += g.vp[o] || 0; }
      });
    });
    s.glory = sumField(games, "glory", id);
    s.xp = sumField(games, "xp", id);
    s.ducats = sumField(games, "ducats", id);
    return s;
  }
  var STATS = D.warbands.map(function (w) { return statsFor(w.id); });
  var statsById = {};
  STATS.forEach(function (s) { statsById[s.id] = s; });

  function nm(w) { return (w && (w.name || w.player || w.id)) || "?"; }
  function swatch(w) { return '<span class="swatch" style="background:' + esc(w.color || "#888") + '"></span>'; }
  function fmtDate(iso) {
    var d = new Date(iso + "T12:00:00");
    if (isNaN(d)) return esc(iso);
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  }

  /* ---------- render: standings ---------- */
  function renderStandings() {
    $("#campaign-name").textContent = D.name;
    $("#campaign-sub").textContent = D.warbands.length + " players · started " + fmtDate(D.started).replace(/<[^>]+>/g, "");
    // The campaign ends when every player has played all their games (11 + the final Great War game).
    var per = D.gamesPerPlayer || 12;
    var needed = Math.ceil(D.warbands.length * per / 2);
    var playerGames = STATS.reduce(function (t, s) { return t + Math.min(s.games.length, per); }, 0);
    var share = D.warbands.length ? playerGames / (D.warbands.length * per) : 0;
    $("#progress-label").textContent = "Campaign progress: " + D.games.length + " of " + needed + " games (" + per + " per player)";
    requestAnimationFrame(function () { $("#progress-fill").style.width = Math.min(100, share * 100) + "%"; });

    var rows = STATS.slice().sort(function (a, b) { return b.cvp - a.cvp || b.w - a.w; });
    var rank = 0, lastCvp = null;
    $("#standings-body").innerHTML = rows.map(function (s, i) {
      if (s.cvp !== lastCvp) { rank = i + 1; lastCvp = s.cvp; }
      var w = byId[s.id];
      return '<tr data-wb="' + esc(s.id) + '">' +
        "<td>" + rank + "</td>" +
        "<td class=\"wb\">" + swatch(w) + "<strong>" + esc(nm(w)) + "</strong><br><span class=\"muted\">" + (w.name ? esc(w.player || "") + (w.faction ? " · " + esc(w.faction) : "") + (w.variant ? " · " + esc(w.variant) : "") : "warband not chosen yet") + "</span></td>" +
        '<td class="num">' + s.games.length + "/" + (D.gamesPerPlayer || 12) + "</td>" +
        '<td class="num">' + s.w + "-" + s.l + "-" + s.d + "</td>" +
        '<td class="num"><strong>' + s.cvp + "</strong></td>" +
        '<td class="num">' + fmtSum(s.glory) + "</td>" +
        '<td class="num">' + xpText(w, s) + "</td>" +
        '<td class="num">' + fmtSum(s.ducats, " d") + "</td>" +
        "</tr>";
    }).join("") || '<tr><td colspan="8" class="empty">No warbands yet.</td></tr>';

    $("#status-left").textContent = D.games.length + " battle" + (D.games.length === 1 ? "" : "s") + " fought";
    $all("#standings-body tr[data-wb]").forEach(function (tr) {
      tr.addEventListener("click", function () { selectRow(tr); });
      tr.addEventListener("dblclick", function () { showWarband(tr.dataset.wb); });
    });
  }

  function selectRow(tr) {
    $all("tr.sel", tr.parentNode).forEach(function (r) { r.classList.remove("sel"); });
    tr.classList.add("sel");
  }

  /* ---------- render: battle log ---------- */
  function renderLog() {
    var sel = $("#log-filter");
    sel.innerHTML = '<option value="">All warbands</option>' + D.warbands.map(function (w) {
      return '<option value="' + esc(w.id) + '">' + esc(nm(w)) + "</option>";
    }).join("");
    sel.addEventListener("change", drawLog);
    drawLog();
  }
  function drawLog() {
    var f = $("#log-filter").value;
    var games = D.games.filter(function (g) { return !f || g.players.indexOf(f) !== -1; })
      .slice().sort(function (a, b) { return b.n - a.n; });
    $("#log-body").innerHTML = games.map(function (g) {
      var names = g.players.map(function (p) { return swatch(byId[p] || {}) + esc(nm(byId[p]) || p); }).join(" vs ");
      var res;
      if (f) {
        var r = resultFor(g, f);
        res = '<span class="res-' + r + '">' + r.charAt(0).toUpperCase() + r.slice(1) + "</span>";
      } else if (g.winner === "draw" || g.winner == null) {
        res = '<span class="res-draw">Draw</span>';
      } else {
        res = '<span class="res-win">' + esc(nm(byId[g.winner])) + "</span>";
      }
      var vp = g.vp ? g.players.map(function (p) { return g.vp[p] == null ? "?" : g.vp[p]; }).join("-") : "";
      return "<tr><td>" + g.n + "</td><td>" + fmtDate(g.date) + "</td><td>" + esc(g.scenario) +
        "</td><td>" + names + "</td><td>" + res + '</td><td class="num">' + vp + "</td></tr>";
    }).join("") || '<tr><td colspan="6" class="empty">No battles yet.</td></tr>';
    $("#log-status").textContent = games.length + " of " + D.games.length + " battles shown";
    $all("#log-body tr").forEach(function (tr) { tr.addEventListener("click", function () { selectRow(tr); }); });
  }

  /* ---------- render: warband properties ---------- */
  var currentWb = D.warbands.length ? D.warbands[0].id : null;
  function renderTabs() {
    $("#wb-tabs").innerHTML = D.warbands.map(function (w) {
      return '<button class="tab" role="tab" data-wb="' + esc(w.id) + '" aria-selected="' + (w.id === currentWb) + '">' + esc(nm(w)) + "</button>";
    }).join("");
    $all("#wb-tabs .tab").forEach(function (t) {
      t.addEventListener("click", function () { currentWb = t.dataset.wb; renderTabs(); renderPanel(); });
    });
  }
  function renderPanel() {
    var w = byId[currentWb];
    if (!w) { $("#wb-panel").innerHTML = '<p class="empty">No warbands yet.</p>'; return; }
    var s = statsById[w.id];
    var h2h = Object.keys(s.h2h).map(function (o) {
      var h = s.h2h[o], ow = byId[o] || { name: o };
      return "<tr><td>" + swatch(ow) + esc(nm(ow)) + '</td><td class="num">' + h.w + '</td><td class="num">' + h.l +
        '</td><td class="num">' + h.d + '</td><td class="num">' + h.vpFor + "-" + h.vpAgainst + "</td></tr>";
    }).join("") || '<tr><td colspan="5" class="empty">No battles yet.</td></tr>';
    $("#wb-panel").innerHTML =
      '<fieldset><legend>General</legend><dl class="kv">' +
        "<dt>Player</dt><dd>" + esc(w.player || "?") + "</dd>" +
        "<dt>Warband</dt><dd>" + esc(w.name || "not chosen yet") + "</dd>" +
        "<dt>Faction</dt><dd>" + esc(w.faction || "?") + (w.variant ? " (" + esc(w.variant) + ")" : "") + "</dd>" +
        "<dt>Patron</dt><dd>" + esc(w.patron || "?") + "</dd>" +
      "</dl></fieldset>" +
      '<fieldset><legend>Campaign</legend><div class="statgrid">' +
        stat("Campaign VP", s.cvp) +
        stat("Record", s.w + "-" + s.l + "-" + s.d) +
        stat("Glory earned", fmtSum(s.glory)) +
        stat("XP", xpText(w, s)) +
        stat("Ducats earned", fmtSum(s.ducats)) +
        stat("Strongbox now", w.strongbox == null ? "?" : w.strongbox) +
        stat("Glory now", w.glory == null ? "?" : w.glory) +
      "</div></fieldset>" +
      '<fieldset><legend>Head to head</legend><div class="listview"><table><thead><tr><th>Opponent</th><th class="num">W</th><th class="num">L</th><th class="num">D</th><th class="num">VP</th></tr></thead><tbody>' +
        h2h + "</tbody></table></div></fieldset>";
  }
  function xpText(w, s) { return (s.xp.missing && w.xpNow != null) ? String(w.xpNow) : fmtSum(s.xp); }
  function stat(k, v) { return '<div class="stat"><div class="k">' + esc(k) + '</div><div class="v">' + esc(v) + "</div></div>"; }
  function showWarband(id) { currentWb = id; renderTabs(); renderPanel(); openWin("warbands"); }

  /* ---------- window manager ---------- */
  var z = 10;
  var titles = {};
  $all(".window").forEach(function (win) {
    var id = win.dataset.win;
    titles[id] = $(".title", win).textContent;
    win.addEventListener("pointerdown", function () { focusWin(id); });
    $(".ctl.close", win).addEventListener("click", function (e) { e.stopPropagation(); closeWin(id); });
    $(".ctl.min", win).addEventListener("click", function (e) { e.stopPropagation(); minimizeWin(id); });
    makeDraggable(win);
  });

  function winEl(id) { return $('.window[data-win="' + id + '"]'); }
  var state = {}; // id -> "open" | "min" | "closed"
  function openWin(id) {
    var w = winEl(id); if (!w) return;
    w.hidden = false; state[id] = "open";
    keepOnScreen(w);
    focusWin(id); drawTasks();
  }
  function closeWin(id) { var w = winEl(id); w.hidden = true; state[id] = "closed"; drawTasks(); focusTop(); }
  function minimizeWin(id) { var w = winEl(id); w.hidden = true; state[id] = "min"; drawTasks(); focusTop(); }
  function focusWin(id) {
    $all(".window").forEach(function (w) { w.classList.toggle("inactive", w.dataset.win !== id); });
    var w = winEl(id); if (w) w.style.zIndex = ++z;
    $all(".task").forEach(function (t) { t.classList.toggle("active", t.dataset.win === id); });
  }
  function focusTop() {
    var open = $all(".window:not([hidden])").sort(function (a, b) { return (+b.style.zIndex || 0) - (+a.style.zIndex || 0); });
    if (open[0]) focusWin(open[0].dataset.win);
  }
  function drawTasks() {
    var ids = Object.keys(state).filter(function (id) { return state[id] !== "closed"; });
    $("#tasks").innerHTML = ids.map(function (id) {
      return '<button class="task" data-win="' + id + '">' + esc(titles[id]) + "</button>";
    }).join("");
    $all(".task").forEach(function (t) {
      t.addEventListener("click", function () {
        var id = t.dataset.win, w = winEl(id);
        if (state[id] === "min") openWin(id);
        else if (!w.classList.contains("inactive")) minimizeWin(id);
        else focusWin(id);
      });
    });
    focusTop();
  }
  function keepOnScreen(w) {
    if (window.innerWidth <= 720) return;
    var r = w.getBoundingClientRect(), maxX = window.innerWidth - 80, maxY = window.innerHeight - 70;
    if (r.left > maxX) w.style.left = Math.max(0, maxX - 200) + "px";
    if (r.top > maxY) w.style.top = Math.max(0, maxY - 200) + "px";
  }
  function makeDraggable(win) {
    var bar = $(".titlebar", win), sx, sy, ox, oy, dragging = false;
    bar.addEventListener("pointerdown", function (e) {
      if (e.target.closest(".ctl") || window.innerWidth <= 720) return;
      dragging = true; sx = e.clientX; sy = e.clientY; ox = win.offsetLeft; oy = win.offsetTop;
      bar.setPointerCapture(e.pointerId);
    });
    bar.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var nx = Math.min(Math.max(ox + e.clientX - sx, -win.offsetWidth + 80), window.innerWidth - 80);
      var ny = Math.min(Math.max(oy + e.clientY - sy, 0), window.innerHeight - 60);
      win.style.left = nx + "px"; win.style.top = ny + "px";
    });
    bar.addEventListener("pointerup", function () { dragging = false; });
    bar.addEventListener("dblclick", function () { if (!win.style.width.endsWith("vw")) { win.dataset.w = win.style.width; win.style.left = "0px"; win.style.top = "0px"; win.style.width = "100vw"; } else { win.style.width = win.dataset.w; } });
  }

  /* ---------- openers, start menu, icons ---------- */
  document.addEventListener("click", function (e) {
    var o = e.target.closest("[data-open]");
    if (o && !o.classList.contains("icon")) { openWin(o.dataset.open); hideStart(); }
    var c = e.target.closest("[data-close]");
    if (c) closeWin(c.dataset.close);
    if (!e.target.closest("#startmenu") && !e.target.closest("#start")) hideStart();
  });
  $all(".icon").forEach(function (ic) {
    ic.addEventListener("click", function () {
      $all(".icon").forEach(function (i) { i.classList.toggle("selected", i === ic); });
      // single click opens on touch screens; desktop uses double-click like XP
      if (window.matchMedia("(hover: none)").matches) openWin(ic.dataset.open);
    });
    ic.addEventListener("dblclick", function () { openWin(ic.dataset.open); });
    ic.addEventListener("keydown", function (e) { if (e.key === "Enter") openWin(ic.dataset.open); });
  });

  var startBtn = $("#start"), menu = $("#startmenu");
  function hideStart() { menu.hidden = true; startBtn.setAttribute("aria-expanded", "false"); }
  startBtn.addEventListener("click", function () {
    var open = menu.hidden;
    menu.hidden = !open; startBtn.setAttribute("aria-expanded", String(open));
  });
  $("#sm-user").textContent = D.name;
  $("#sm-sound").addEventListener("click", function () { setSound(!soundOn); });
  $("#tray-sound").addEventListener("click", function () { setSound(!soundOn); });
  $("#sm-shutdown").addEventListener("click", function () {
    Object.keys(state).forEach(function (id) { if (state[id] !== "closed") closeWin(id); });
    hideStart();
  });
  $("#threshold-note").textContent = D.thresholdNote || "";

  /* ---------- clock ---------- */
  function tick() {
    $("#clock").textContent = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  tick(); setInterval(tick, 15000);

  /* ---------- boot ---------- */
  setSound(soundOn);
  renderStandings();
  renderLog();
  renderTabs();
  renderPanel();
  $all(".window").forEach(function (w) {
    var id = w.dataset.win;
    state[id] = w.hidden ? "closed" : "open";
  });
  // stack the battle log under the standings on desktop
  var st = winEl("standings"), lg = winEl("log");
  if (window.innerWidth > 720 && st && lg) lg.style.top = (st.offsetTop + st.offsetHeight + 16) + "px";
  drawTasks();
  focusWin("standings");
})();
