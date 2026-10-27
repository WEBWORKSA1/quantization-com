/* Quantization.com — energy levels calculator */
(function () {
  'use strict';
  var $ = QZ.$, $$ = QZ.$$;
  var h = 6.62607015e-34, c = 299792458, eV = 1.602176634e-19, hc_eVnm = 1239.841984;
  var me = 9.1093837139e-31, mp = 1.67262192595e-27, RY = 13.605693;
  var SERIES = { 1: 'Lyman', 2: 'Balmer', 3: 'Paschen', 4: 'Brackett', 5: 'Pfund', 6: 'Humphreys' };

  function wlRGB(nm) {
    var r = 0, g = 0, b = 0;
    if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b = 1; }
    else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
    else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
    else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
    else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
    else if (nm <= 780) { r = 1; }
    var f = nm < 420 ? 0.3 + 0.7 * (nm - 380) / 40 : nm > 700 ? 0.3 + 0.7 * (780 - nm) / 80 : 1;
    function ch(x) { return Math.round(255 * Math.pow(Math.max(0, x) * f, 0.8)); }
    return 'rgb(' + ch(r) + ',' + ch(g) + ',' + ch(b) + ')';
  }
  function n(id) { var v = parseFloat($(id).value); return isFinite(v) ? v : 0; }
  function sci(x, d) { return x.toExponential(d || 3).replace('e', ' × 10^').replace(/\^\+?(-?\d+)/, function (m, p) { return '<sup>' + p + '</sup>'; }); }

  function ladder(Z, ni, nf) {
    var col = QZ.colors(), f = QZ.fitCanvas($('#eLadder')), ctx = f.ctx, w = f.w, H = f.h;
    ctx.clearRect(0, 0, w, H);
    var top = 16, bot = H - 22, maxN = 7;
    var Emin = -RY * Z * Z;
    var y = function (E) { return top + (E / Emin) * (bot - top); }; // E = 0 at the top, ground state at the bottom
    ctx.font = '12px "IBM Plex Mono", monospace';
    for (var k = 1; k <= maxN; k++) {
      var E = -RY * Z * Z / (k * k), yy = y(E);
      ctx.strokeStyle = (k === ni || k === nf) ? col.ink : col.rule; ctx.lineWidth = (k === ni || k === nf) ? 2 : 1.2;
      ctx.beginPath(); ctx.moveTo(70, yy); ctx.lineTo(w - 80, yy); ctx.stroke();
      if (k <= 4 || k === ni || k === nf) { ctx.fillStyle = col.ink3; ctx.fillText('n=' + k, 18, yy + 4); ctx.fillText(E.toFixed(2) + ' eV', w - 76, yy + 4); }
    }
    ctx.strokeStyle = col.rule; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(70, top); ctx.lineTo(w - 80, top); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = col.ink3; ctx.fillText('n=∞  0 eV', w - 150, top - 4);
    var y1 = y(-RY * Z * Z / (ni * ni)), y2 = y(-RY * Z * Z / (nf * nf)), x = w / 2;
    ctx.strokeStyle = col.error; ctx.fillStyle = col.error; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
    var dir = y2 > y1 ? 1 : -1;
    ctx.beginPath(); ctx.moveTo(x, y2); ctx.lineTo(x - 6, y2 - 10 * dir); ctx.lineTo(x + 6, y2 - 10 * dir); ctx.closePath(); ctx.fill();
  }

  function hydrogen() {
    var Z = Math.max(1, Math.round(n('#hZ'))), ni = Math.max(1, Math.round(n('#hNi'))), nf = Math.max(1, Math.round(n('#hNf')));
    if (ni === nf) { $('#hOut').textContent = 'Choose two different levels.'; return; }
    var Ei = -RY * Z * Z / (ni * ni), Ef = -RY * Z * Z / (nf * nf), dE = Math.abs(Ef - Ei);
    var lam = hc_eVnm / dE, freq = dE * eV / h;
    var emit = ni > nf;
    $('#hOut').textContent = (emit ? 'Emission' : 'Absorption') + ': n = ' + ni + ' → ' + nf + (SERIES[Math.min(ni, nf)] && Z === 1 ? ' (' + SERIES[Math.min(ni, nf)] + ' series)' : '');
    $('#hDE').textContent = dE.toFixed(4) + ' eV';
    $('#hLam').textContent = lam >= 1000 ? (lam / 1000).toFixed(3) + ' µm' : lam.toFixed(1) + ' nm';
    $('#hFreq').textContent = (freq / 1e12).toFixed(1) + ' THz';
    var region = lam < 10 ? 'X-ray' : lam < 380 ? 'Ultraviolet' : lam <= 780 ? 'Visible' : 'Infrared';
    $('#hRegion').textContent = region;
    var sw = $('#hSwatch');
    if (region === 'Visible') { sw.style.background = wlRGB(lam); sw.textContent = ''; }
    else { sw.style.background = 'repeating-linear-gradient(45deg,var(--sunk),var(--sunk) 8px,var(--surface) 8px,var(--surface) 16px)'; }
    $('#hWork').innerHTML = 'E<sub>n</sub> = −13.6057 eV × Z² ÷ n² · E<sub>' + ni + '</sub> = ' + Ei.toFixed(3) + ' eV, E<sub>' + nf + '</sub> = ' + Ef.toFixed(3) + ' eV · λ = hc ÷ ΔE = 1239.84 eV·nm ÷ ' + dE.toFixed(4) + ' eV';
    ladder(Z, Math.min(ni, 7), Math.min(nf, 7));
  }

  function box() {
    var m = $('#bMass').value === 'e' ? me : $('#bMass').value === 'p' ? mp : n('#bCustom') * me;
    var L = n('#bL') * 1e-9, k = Math.max(1, Math.round(n('#bN')));
    if (!(L > 0) || !(m > 0)) return;
    var E = k * k * h * h / (8 * m * L * L), E1 = h * h / (8 * m * L * L);
    $('#bE').textContent = (E / eV).toPrecision(4) + ' eV';
    $('#bEJ').innerHTML = sci(E, 3) + ' J';
    if (k > 1) {
      var dE = E - (k - 1) * (k - 1) * E1, lam = h * c / dE;
      $('#bLam').textContent = lam * 1e9 >= 1000 ? (lam * 1e6).toFixed(2) + ' µm' : (lam * 1e9).toFixed(1) + ' nm';
    } else $('#bLam').textContent = 'Ground state';
    $('#bWork').innerHTML = 'E<sub>n</sub> = n²h² ÷ (8mL²) · E<sub>1</sub> = ' + (E1 / eV).toPrecision(4) + ' eV · E<sub>' + k + '</sub> = ' + k + '² × E<sub>1</sub>';
    $('#bCustomWrap').hidden = $('#bMass').value !== 'x';
  }

  ['#hZ', '#hNi', '#hNf'].forEach(function (id) { $(id).addEventListener('input', hydrogen); });
  ['#bMass', '#bL', '#bN', '#bCustom'].forEach(function (id) { $(id).addEventListener('input', box); $(id).addEventListener('change', box); });
  $$('[data-trans]').forEach(function (b) { b.addEventListener('click', function () { var t = b.getAttribute('data-trans').split('-'); $('#hNi').value = t[0]; $('#hNf').value = t[1]; $('#hZ').value = 1; hydrogen(); }); });
  window.addEventListener('resize', hydrogen);
  document.addEventListener('qz:theme', hydrogen);
  hydrogen(); box();
})();
