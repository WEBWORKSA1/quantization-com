/* Quantization.com — MIDI quantize and swing lab */
(function () {
  'use strict';
  var $ = QZ.$, $$ = QZ.$$;
  var BARS = 2, STEPS = 16 * BARS;
  var PATTERN = { hat: [], snare: [4, 12, 20, 28], kick: [0, 7, 8, 10, 16, 23, 24, 26] };
  for (var i = 0; i < STEPS; i++) PATTERN.hat.push(i);
  var ROWS = ['hat', 'snare', 'kick'];
  var seed = 11;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function gauss() { var u = 1 - rnd(), v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  var notes = [];

  function take() {
    notes = [];
    var sloppy = +$('#mSloppy').value;
    ROWS.forEach(function (r) {
      PATTERN[r].forEach(function (s) {
        var off = Math.max(-2.2 * sloppy, Math.min(2.2 * sloppy, gauss() * sloppy));
        var vel = r === 'hat' ? (s % 2 ? 0.45 : 0.75) + (rnd() - 0.5) * 0.2 : 0.85 + (rnd() - 0.5) * 0.2;
        notes.push({ row: r, step: s, offMs: off, vel: vel });
      });
    });
  }

  function params() {
    var bpm = +$('#mBpm').value;
    var beat = 60000 / bpm, step = beat / 4;
    var g = $('#mGrid').value;
    var grid = { '1/4': beat, '1/8': beat / 2, '1/16': beat / 4, '1/8T': beat / 3, '1/16T': beat / 6 }[g];
    return { bpm: bpm, beat: beat, step: step, grid: grid, triplet: g.indexOf('T') > -1, strength: +$('#mStrength').value / 100, swing: +$('#mSwing').value / 100, total: beat * 4 * BARS };
  }
  function gridPoints(p) {
    var pts = [], k = 0;
    for (var t = 0; t <= p.total + 1e-6; t += p.grid, k++) {
      var pos = t;
      if (!p.triplet && k % 2 === 1) pos = (t - p.grid) + p.swing * 2 * p.grid; // MPC-style swing on every second grid point
      pts.push(pos);
    }
    return pts;
  }
  function quantized(p) {
    var pts = gridPoints(p);
    return notes.map(function (n) {
      var t0 = n.step * p.step + n.offMs;
      var best = pts[0], bd = Infinity;
      for (var i = 0; i < pts.length; i++) { var d = Math.abs(pts[i] - t0); if (d < bd) { bd = d; best = pts[i]; } }
      var t1 = t0 + p.strength * (best - t0);
      return { n: n, t0: t0, t1: t1, target: best };
    });
  }

  function draw() {
    var p = params(), q = quantized(p), pts = gridPoints(p);
    var c = QZ.colors(), f = QZ.fitCanvas($('#mRoll')), ctx = f.ctx, w = f.w, h = f.h;
    var padL = 54, rowH = (h - 24) / 3, x = function (t) { return padL + t / p.total * (w - padL - 10); };
    ctx.clearRect(0, 0, w, h);
    ctx.font = '12px "Instrument Sans", sans-serif'; ctx.fillStyle = c.ink3;
    ROWS.forEach(function (r, i) { ctx.fillText(r === 'hat' ? 'Hi-hat' : r === 'snare' ? 'Snare' : 'Kick', 6, 18 + i * rowH + rowH / 2); });
    // grid
    pts.forEach(function (t) { ctx.strokeStyle = c.rule; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x(t), 6); ctx.lineTo(x(t), h - 18); ctx.stroke(); });
    for (var b = 0; b <= 4 * BARS; b++) { ctx.strokeStyle = b % 4 === 0 ? c.ink : c.ink3; ctx.lineWidth = b % 4 === 0 ? 1.4 : 1; ctx.beginPath(); ctx.moveTo(x(b * p.beat), 6); ctx.lineTo(x(b * p.beat), h - 18); ctx.stroke(); }
    for (b = 0; b < 4 * BARS; b++) { ctx.fillStyle = c.ink3; ctx.fillText((Math.floor(b / 4) + 1) + '.' + (b % 4 + 1), x(b * p.beat) + 3, h - 4); }
    q.forEach(function (o) {
      var ri = ROWS.indexOf(o.n.row), y = 10 + ri * rowH + rowH / 2;
      ctx.strokeStyle = c.error; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x(o.t0), y); ctx.lineTo(x(o.t1), y); ctx.stroke();
      ctx.strokeStyle = c.signal; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x(o.t0), y, 4.5, 0, 6.283); ctx.stroke();
      ctx.fillStyle = c.step; ctx.globalAlpha = 0.4 + 0.6 * o.n.vel; ctx.fillRect(x(o.t1) - 3, y - 8, 6, 16); ctx.globalAlpha = 1;
    });
    var before = 0, after = 0;
    q.forEach(function (o) { before += Math.abs(o.t0 - o.n.step * p.step); after += Math.abs(o.t1 - o.target); });
    $('#mBefore').textContent = (before / q.length).toFixed(1) + ' ms';
    $('#mAfter').textContent = (after / q.length).toFixed(1) + ' ms';
    $('#mStep').textContent = p.grid.toFixed(1) + ' ms';
    var swingMs = p.triplet ? 0 : (p.swing - 0.5) * 2 * p.grid;
    $('#mSwingMs').textContent = p.triplet ? 'n/a for triplets' : '+' + swingMs.toFixed(1) + ' ms';
    $('#mWork').innerHTML = 'one beat = 60,000 ÷ ' + p.bpm + ' BPM = ' + p.beat.toFixed(1) + ' ms · grid ' + $('#mGrid').value + ' = ' + p.grid.toFixed(1) + ' ms · moved = original + ' + Math.round(p.strength * 100) + '% × (grid − original)' + (p.triplet ? '' : ' · swing ' + Math.round(p.swing * 100) + '% delays every second grid point by ' + swingMs.toFixed(1) + ' ms');
    $('#mStrengthOut').textContent = Math.round(p.strength * 100) + '%';
    $('#mSwingOut').textContent = Math.round(p.swing * 100) + '%';
    $('#mBpmOut').textContent = p.bpm;
    $('#mSloppyOut').textContent = $('#mSloppy').value + ' ms';
    return q;
  }

  // ---------- Audio ----------
  var ac = null, noiseBuf = null, playing = [];
  function audio() {
    if (!ac) {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      ac = new AC();
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
      var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return ac;
  }
  function hit(row, when, vel) {
    var out = ac.createGain(); out.connect(ac.destination);
    if (row === 'kick') {
      var o = ac.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(150, when); o.frequency.exponentialRampToValueAtTime(45, when + 0.18);
      out.gain.setValueAtTime(0.9 * vel, when); out.gain.exponentialRampToValueAtTime(0.001, when + 0.35);
      o.connect(out); o.start(when); o.stop(when + 0.4); playing.push(o);
    } else {
      var s = ac.createBufferSource(); s.buffer = noiseBuf;
      var fl = ac.createBiquadFilter();
      if (row === 'hat') { fl.type = 'highpass'; fl.frequency.value = 7000; out.gain.setValueAtTime(0.35 * vel, when); out.gain.exponentialRampToValueAtTime(0.001, when + 0.05); }
      else { fl.type = 'bandpass'; fl.frequency.value = 1800; fl.Q.value = 0.8; out.gain.setValueAtTime(0.7 * vel, when); out.gain.exponentialRampToValueAtTime(0.001, when + 0.18); }
      s.connect(fl); fl.connect(out); s.start(when); s.stop(when + 0.25); playing.push(s);
    }
  }
  function stop() { playing.forEach(function (n) { try { n.stop(); } catch (e) { } }); playing = []; $$('[data-play]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); }); }
  function play(which) {
    var a = audio(); if (!a) { alert('Your browser does not support Web Audio.'); return; }
    if (a.state === 'suspended') a.resume();
    stop();
    var p = params(), q = quantized(p), t = a.currentTime + 0.08;
    for (var loop = 0; loop < 2; loop++) {
      q.forEach(function (o) { var ms = which === 'loose' ? o.t0 : o.t1; hit(o.n.row, t + loop * p.total / 1000 + Math.max(0, ms) / 1000, o.n.vel); });
    }
    var b = $('[data-play="' + which + '"]'); if (b) b.setAttribute('aria-pressed', 'true');
  }

  $$('[data-play]').forEach(function (b) { b.addEventListener('click', function () { play(b.getAttribute('data-play')); }); });
  $('#mStop').addEventListener('click', stop);
  $('#mNew').addEventListener('click', function () { seed = Math.floor(Math.random() * 1e6) + 1; take(); draw(); });
  $('#mSloppy').addEventListener('input', function () { seed = 11; take(); draw(); });
  ['#mBpm', '#mGrid', '#mStrength', '#mSwing'].forEach(function (id) { $(id).addEventListener('input', draw); $(id).addEventListener('change', draw); });
  window.addEventListener('resize', draw);
  document.addEventListener('qz:theme', draw);
  take(); draw();
})();
