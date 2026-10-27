/* Quantization.com — quantization playground */
(function () {
  'use strict';
  var $ = QZ.$, $$ = QZ.$$;
  var N = 1024;
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function gauss() { var u = 1 - rnd(), v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  var state = { src: 'sine', bits: 4, scheme: 'sym', clip: 'none', gran: 'tensor', group: 64, round: 'nearest', dither: 'none' };

  function makeSource(kind) {
    seed = 7; var x = new Float64Array(N), i;
    if (kind === 'sine') for (i = 0; i < N; i++) x[i] = 0.98 * Math.sin(2 * Math.PI * 3 * i / N);
    else if (kind === 'twotone') for (i = 0; i < N; i++) x[i] = 0.6 * Math.sin(2 * Math.PI * 3 * i / N) + 0.35 * Math.sin(2 * Math.PI * 17 * i / N + 0.4);
    else if (kind === 'quiet') for (i = 0; i < N; i++) x[i] = 0.08 * Math.sin(2 * Math.PI * 3 * i / N);
    else if (kind === 'gauss') for (i = 0; i < N; i++) x[i] = 0.02 * gauss();
    else if (kind === 'outlier') { for (i = 0; i < N; i++) { var s = rnd() < 0.5 ? -1 : 1; x[i] = s * 0.015 * -Math.log(1 - rnd()); } x[137] = 0.42; x[611] = -0.37; x[903] = 0.31; }
    return x;
  }
  function isWeights() { return state.src === 'gauss' || state.src === 'outlier'; }

  function percentileAbs(arr, p) {
    var a = Array.prototype.slice.call(arr).map(Math.abs).sort(function (m, n) { return m - n; });
    return a[Math.min(a.length - 1, Math.floor(p * (a.length - 1)))];
  }

  function quantizeBlock(x, start, end, out, codes, info) {
    var bits = state.bits, i, lo = Infinity, hi = -Infinity;
    var seg = x.subarray(start, end);
    for (i = start; i < end; i++) { if (x[i] < lo) lo = x[i]; if (x[i] > hi) hi = x[i]; }
    if (!isWeights()) { lo = -1; hi = 1; } // signals: fixed converter full scale of ±1, like an ADC
    if (state.clip !== 'none') {
      var p = state.clip === 'p999' ? 0.999 : 0.99;
      var c = percentileAbs(seg, p);
      if (state.scheme === 'sym') { lo = -c; hi = c; } else { lo = Math.max(lo, -c); hi = Math.min(hi, c); }
    }
    var qmin, qmax, scale, zp = 0;
    if (state.scheme === 'sym') {
      var amax = Math.max(Math.abs(lo), Math.abs(hi)) || 1e-12;
      qmax = Math.pow(2, bits - 1) - 1; qmin = -qmax; if (bits === 1) { qmax = 0; qmin = -1; }
      scale = bits === 1 ? amax : amax / qmax;
    } else {
      qmin = 0; qmax = Math.pow(2, bits) - 1;
      scale = (hi - lo) / qmax || 1e-12;
      zp = Math.round(-lo / scale);
    }
    var clipped = 0;
    for (i = start; i < end; i++) {
      var v = x[i] / scale + zp;
      if (state.dither === 'tpdf') v += (rnd() - rnd());
      var q = state.round === 'nearest' ? Math.round(v) : Math.floor(v);
      if (q > qmax) { q = qmax; clipped++; } else if (q < qmin) { q = qmin; clipped++; }
      if (bits === 1 && state.scheme === 'sym') { q = x[i] >= 0 ? 0 : -1; out[i] = q === 0 ? scale / 2 : -scale / 2; }
      else out[i] = (q - zp) * scale;
      codes[i] = q;
    }
    info.clipped += clipped; info.scales.push(scale); info.zps.push(zp); info.qmin = qmin; info.qmax = qmax;
  }

  function run() {
    var x = makeSource(state.src), y = new Float64Array(N), codes = new Int32Array(N);
    var info = { clipped: 0, scales: [], zps: [] };
    seed = 99;
    if (isWeights() && state.gran === 'group') {
      for (var s = 0; s < N; s += state.group) quantizeBlock(x, s, Math.min(N, s + state.group), y, codes, info);
    } else quantizeBlock(x, 0, N, y, codes, info);
    var mse = 0, ps = 0, maxe = 0, used = {};
    for (var i = 0; i < N; i++) { var e = x[i] - y[i]; mse += e * e; ps += x[i] * x[i]; maxe = Math.max(maxe, Math.abs(e)); used[codes[i]] = 1; }
    mse /= N; ps /= N;
    return { x: x, y: y, codes: codes, info: info, mse: mse, sqnr: 10 * Math.log10(ps / Math.max(mse, 1e-300)), maxe: maxe, used: Object.keys(used).length };
  }

  function drawTime(r) {
    var c = QZ.colors(), f = QZ.fitCanvas($('#pgCanvas')), ctx = f.ctx, w = f.w, h = f.h;
    ctx.clearRect(0, 0, w, h);
    var top = h * 0.72, mid = top / 2, amp = top * 0.44, eBase = h * 0.86, eAmp = h * 0.1;
    var maxAbs = 0; for (var i = 0; i < N; i++) maxAbs = Math.max(maxAbs, Math.abs(r.x[i]));
    var k = 1 / (maxAbs || 1);
    ctx.strokeStyle = c.rule; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.moveTo(0, eBase); ctx.lineTo(w, eBase); ctx.stroke();
    ctx.beginPath(); for (i = 0; i < N; i++) { var px = i / (N - 1) * w, py = mid - r.x[i] * k * amp; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.strokeStyle = c.signal; ctx.lineWidth = 1.8; ctx.stroke();
    ctx.beginPath(); var prev = null;
    for (i = 0; i < N; i++) { px = i / (N - 1) * w; py = mid - r.y[i] * k * amp; if (prev === null) ctx.moveTo(px, py); else { ctx.lineTo(px, prev); ctx.lineTo(px, py); } prev = py; }
    ctx.strokeStyle = c.step; ctx.lineWidth = 2; ctx.stroke();
    var emax = r.maxe || 1;
    ctx.beginPath(); for (i = 0; i < N; i++) { px = i / (N - 1) * w; py = eBase - (r.x[i] - r.y[i]) / emax * eAmp; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.strokeStyle = c.error; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = c.ink3; ctx.font = '12px "IBM Plex Mono", monospace';
    ctx.fillText('error (scaled to ±' + emax.toPrecision(2) + ')', 8, h - 6);
  }

  function drawHist(r) {
    var c = QZ.colors(), f = QZ.fitCanvas($('#pgCanvas')), ctx = f.ctx, w = f.w, h = f.h;
    ctx.clearRect(0, 0, w, h);
    var lo = Infinity, hi = -Infinity, i;
    for (i = 0; i < N; i++) { lo = Math.min(lo, r.x[i]); hi = Math.max(hi, r.x[i]); }
    var span = Math.max(Math.abs(lo), Math.abs(hi)); lo = -span; hi = span;
    var B = 120, bins = new Array(B).fill(0);
    for (i = 0; i < N; i++) bins[Math.min(B - 1, Math.floor((r.x[i] - lo) / (hi - lo) * B))]++;
    var mx = Math.max.apply(null, bins), base = h * 0.82;
    ctx.fillStyle = c.signal; ctx.globalAlpha = 0.85;
    for (i = 0; i < B; i++) { var bh = bins[i] / mx * base * 0.9; ctx.fillRect(i / B * w + 1, base - bh, w / B - 2, bh); }
    ctx.globalAlpha = 1;
    // quantization levels (per-tensor only, draw the first block's grid)
    var sc = r.info.scales[0], zp = r.info.zps[0];
    ctx.strokeStyle = c.step; ctx.lineWidth = 1.4;
    var levels = 0;
    if (state.gran !== 'group' || !isWeights()) {
      for (var q = r.info.qmin; q <= r.info.qmax && levels < 300; q++) {
        var v = (q - zp) * sc; if (v < lo || v > hi) continue; levels++;
        var px = (v - lo) / (hi - lo) * w; ctx.beginPath(); ctx.moveTo(px, base + 4); ctx.lineTo(px, base + 18); ctx.stroke();
      }
    }
    ctx.fillStyle = c.ink3; ctx.font = '12px "IBM Plex Mono", monospace';
    ctx.fillText(state.gran === 'group' && isWeights() ? 'per-group: each block of ' + state.group + ' weights has its own grid' : 'teal ticks = representable values in range (' + levels + ')', 8, h - 6);
    ctx.fillText(lo.toPrecision(2), 4, base - 4); var t = hi.toPrecision(2); ctx.fillText(t, w - ctx.measureText(t).width - 4, base - 4);
  }

  function render() {
    var r = run();
    $('#pmMse').textContent = r.mse.toExponential(2);
    $('#pmSqnr').textContent = isFinite(r.sqnr) ? r.sqnr.toFixed(1) : '∞';
    $('#pmTheory').textContent = state.src === 'sine' && state.scheme === 'sym' ? (6.02 * state.bits + 1.76).toFixed(1) + ' dB' : '—';
    $('#pmUsed').textContent = r.used + ' / ' + Math.pow(2, state.bits).toLocaleString();
    $('#pmClip').textContent = (r.info.clipped / N * 100).toFixed(2) + '%';
    $('#pmScale').textContent = r.info.scales.length > 1 ? r.info.scales.length + ' scales (one per group)' : r.info.scales[0].toPrecision(4) + (state.scheme === 'asym' ? ', zero-point ' + r.info.zps[0] : '');
    $('#pmBitsOut').textContent = state.bits;
    var rows = '';
    var start = state.src === 'outlier' ? 134 : 0;
    for (var i = start; i < start + 6; i++) rows += '<tr><td class="n">' + r.x[i].toFixed(5) + '</td><td class="n">' + r.codes[i] + '</td><td class="n">' + r.y[i].toFixed(5) + '</td><td class="n" style="color:var(--error)">' + (r.x[i] - r.y[i]).toExponential(2) + '</td></tr>';
    $('#pgRows').innerHTML = rows;
    (isWeights() && $('#pgView').value === 'auto') || $('#pgView').value === 'hist' ? drawHist(r) : drawTime(r);
    $('#pgGroupWrap').hidden = !isWeights();
    var hint = $('#pgHint');
    if (state.src === 'outlier' && state.gran === 'tensor' && state.clip === 'none' && state.bits <= 4) hint.textContent = 'Notice: a few outliers stretch the range, so almost every weight lands on the few levels near zero. Try per-group granularity or percentile clipping.';
    else if (state.src === 'quiet' && state.dither === 'none' && state.bits <= 6) hint.textContent = 'A quiet signal uses only a handful of levels, so the error looks like distortion that follows the signal. Turn on TPDF dither to trade it for steady noise.';
    else if (state.round === 'floor') hint.textContent = 'Truncation always rounds down, so the error has a non-zero average (a DC offset). Round-to-nearest removes it.';
    else hint.textContent = 'Each added bit doubles the number of levels and, for a full-scale sine, adds about 6.02 dB of SQNR.';
  }

  $('#pgBits').addEventListener('input', function () { state.bits = +this.value; render(); });
  [['#pgSrc', 'src'], ['#pgScheme', 'scheme'], ['#pgClip', 'clip'], ['#pgGran', 'gran'], ['#pgRound', 'round'], ['#pgDither', 'dither']].forEach(function (p) {
    $(p[0]).addEventListener('change', function () { state[p[1]] = this.value; render(); });
  });
  $('#pgGroup').addEventListener('change', function () { state.group = +this.value; render(); });
  $('#pgView').addEventListener('change', render);
  window.addEventListener('resize', render);
  document.addEventListener('qz:theme', render);
  render();
})();
