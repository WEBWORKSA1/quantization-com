/* Quantization.com — ADC and bit-depth calculator */
(function () {
  'use strict';
  var $ = QZ.$, $$ = QZ.$$;
  function n(id) { var v = parseFloat($(id).value); return isFinite(v) ? v : 0; }
  function volts(v) {
    var a = Math.abs(v);
    if (a >= 1) return v.toPrecision(4) + ' V';
    if (a >= 1e-3) return (v * 1e3).toPrecision(4) + ' mV';
    if (a >= 1e-6) return (v * 1e6).toPrecision(4) + ' µV';
    return (v * 1e9).toPrecision(4) + ' nV';
  }
  function bind(ids, fn) { ids.forEach(function (id) { var el = $(id); if (el) { el.addEventListener('input', fn); el.addEventListener('change', fn); } }); fn(); }

  // Resolution
  bind(['#aBits', '#aFsr', '#aPol'], function () {
    var N = Math.max(1, Math.min(32, Math.round(n('#aBits')))), fsr = n('#aFsr');
    var levels = Math.pow(2, N), lsb = fsr / levels;
    $('#rLevels').textContent = levels.toLocaleString();
    $('#rLsb').textContent = volts(lsb);
    $('#rNoise').textContent = volts(lsb / Math.sqrt(12));
    $('#rSqnr').textContent = (6.02 * N + 1.76).toFixed(2) + ' dB';
    $('#rDr').textContent = (20 * Math.log10(levels)).toFixed(2) + ' dB';
    var bip = $('#aPol').value === 'bi';
    $('#rRange').textContent = bip ? '−' + (fsr / 2).toPrecision(4) + ' V to +' + (fsr / 2 - lsb).toPrecision(6) + ' V' : '0 V to ' + (fsr - lsb).toPrecision(6) + ' V';
    $('#rWork').innerHTML = 'LSB = ' + fsr + ' V ÷ 2<sup>' + N + '</sup> = ' + volts(lsb) + ' · noise rms = LSB ÷ √12 · SQNR = 6.02 × ' + N + ' + 1.76';
  });

  // ENOB
  bind(['#eSinad'], function () {
    var s = n('#eSinad'), enob = (s - 1.76) / 6.02;
    $('#eOut').textContent = enob.toFixed(2) + ' bits';
  });
  bind(['#eTarget'], function () {
    var t = n('#eTarget'), b = (t - 1.76) / 6.02;
    $('#eNeed').textContent = Math.ceil(b) + ' bits (' + b.toFixed(2) + ' exact)';
  });

  // Oversampling and noise shaping
  bind(['#oFs', '#oBw', '#oOrder', '#oBits'], function () {
    var fs = n('#oFs'), bw = n('#oBw'), L = Math.round(n('#oOrder')), N = n('#oBits');
    var osr = fs / (2 * bw);
    if (!(osr > 0)) { $('#oOsr').textContent = '—'; return; }
    var gain;
    if (L === 0) gain = 10 * Math.log10(osr);
    else gain = (2 * L + 1) * 10 * Math.log10(osr) - 10 * Math.log10(Math.pow(Math.PI, 2 * L) / (2 * L + 1));
    var base = 6.02 * N + 1.76;
    $('#oOsr').textContent = osr.toFixed(osr < 10 ? 2 : 0) + '×';
    $('#oGain').textContent = (gain >= 0 ? '+' : '') + gain.toFixed(1) + ' dB';
    $('#oBitsGain').textContent = (gain / 6.02 >= 0 ? '+' : '') + (gain / 6.02).toFixed(2) + ' bits';
    $('#oTotal').textContent = (base + gain).toFixed(1) + ' dB';
    $('#oWork').innerHTML = L === 0 ? 'process gain = 10·log<sub>10</sub>(OSR), OSR = f<sub>s</sub> ÷ 2·BW' : 'ideal L-th order shaping: (2L+1)·10·log<sub>10</sub>(OSR) − 10·log<sub>10</sub>(π<sup>2L</sup> ÷ (2L+1)), L = ' + L;
  });

  // Audio file size
  bind(['#fRate', '#fBits', '#fCh', '#fMin'], function () {
    var r = n('#fRate'), b = n('#fBits'), ch = n('#fCh'), sec = n('#fMin') * 60;
    var bytes = r * b * ch * sec / 8, kbps = r * b * ch / 1000;
    $('#fSize').textContent = bytes >= 1e9 ? (bytes / 1e9).toFixed(2) + ' GB' : (bytes / 1e6).toFixed(1) + ' MB';
    $('#fRateOut').textContent = kbps.toLocaleString() + ' kbit/s';
    $('#fDr').textContent = b === 32 ? '≈1,528 dB (float)' : (6.02 * b).toFixed(1) + ' dB';
  });

  $$('.tool-tabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('.tool-tabs button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      $$('.adc-panel').forEach(function (p) { p.hidden = p.id !== b.getAttribute('data-panel'); });
      history.replaceState(null, '', '#' + b.getAttribute('data-panel'));
    });
  });
  if (location.hash) { var hb = $('.tool-tabs button[data-panel="' + location.hash.slice(1) + '"]'); if (hb) hb.click(); }
})();
