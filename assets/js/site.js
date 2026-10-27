/* Quantization.com — shared site script (no dependencies) */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  window.QZ = window.QZ || {};
  QZ.$ = $; QZ.$$ = $$; QZ.store = store;

  /* ---------- Private inbox routing: the address is never written into any page ---------- */
  var _q = [122, 119, 122, 52, 119, 126, 121, 116, 125, 91, 38, 121, 106, 113, 105, 120, 111, 123, 127, 108];
  function inbox() { return _q.map(function (v, i) { return String.fromCharCode(v ^ (23 + (i % 5))); }).join('').split('').reverse().join(''); }
  function endpoint() { return 'https://formsubmit.co/ajax/' + inbox(); }

  $$('[data-mail]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var s = a.getAttribute('data-mail') || 'Inquiry from Quantization.com';
      window.location.href = 'mai' + 'lto:' + inbox() + '?subject=' + encodeURIComponent(s);
    });
  });

  /* ---------- Theme ---------- */
  var root = document.documentElement;
  var tb = $('#themeBtn');
  if (tb) tb.addEventListener('click', function () {
    var dark = root.getAttribute('data-theme') ? root.getAttribute('data-theme') === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    var next = dark ? 'light' : 'dark';
    root.setAttribute('data-theme', next); store('qz-theme', next);
    document.dispatchEvent(new CustomEvent('qz:theme'));
  });

  /* ---------- Mobile menu ---------- */
  var bg = $('#burger'), menu = $('#menu');
  if (bg && menu) {
    bg.addEventListener('click', function () { var o = menu.classList.toggle('open'); bg.setAttribute('aria-expanded', o); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) { menu.classList.remove('open'); bg.setAttribute('aria-expanded', 'false'); bg.focus(); } });
  }

  /* ---------- Cookie notice (choice also controls ad personalisation, see head script) ---------- */
  var ck = $('#cookie');
  if (ck && !store('qz-consent')) ck.classList.add('show');
  $$('[data-consent]').forEach(function (b) {
    b.addEventListener('click', function () {
      store('qz-consent', b.getAttribute('data-consent'));
      ck.classList.remove('show');
    });
  });

  var rc = $('#resetConsent');
  if (rc) rc.addEventListener('click', function (e) { e.preventDefault(); try { localStorage.removeItem('qz-consent'); } catch (err) { } if (ck) ck.classList.add('show'); });

  /* ---------- Preselect options from links (support tiers, job roles) ---------- */
  $$('[data-amount]').forEach(function (a) {
    a.addEventListener('click', function () { var r = $('input[name="amount"][value="' + a.getAttribute('data-amount') + '"]'); if (r) r.checked = true; });
  });
  $$('[data-role]').forEach(function (a) {
    a.addEventListener('click', function () { var s = $('select[name="role"]'); if (s) s.value = a.getAttribute('data-role'); });
  });

  /* ---------- Year ---------- */
  $$('.year').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Forms → private inbox via FormSubmit ---------- */
  function collect(f) {
    var data = {};
    new FormData(f).forEach(function (v, k) {
      if (k === '_honey' || v === '') return;
      data[k] = data[k] ? data[k] + ', ' + v : v;
    });
    return data;
  }
  function groupsValid(scope) {
    var ok = true;
    $$('[data-required-group]', scope).forEach(function (g) {
      var name = g.getAttribute('data-required-group');
      var any = $$('input[name="' + name + '"]', g).some(function (i) { return i.checked; });
      var msg = $('.group-msg', g);
      if (!any) { ok = false; if (msg) msg.textContent = 'Choose at least one option to continue.'; }
      else if (msg) msg.textContent = '';
    });
    return ok;
  }
  $$('form.js-form').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = $('.form-msg', f);
      if (f._honey && f._honey.value) return;
      if (!f.checkValidity() || !groupsValid(f)) { f.reportValidity(); return; }
      var btn = $('button[type=submit]', f), old = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      var data = collect(f);
      data._subject = '[Quantization.com] ' + (f.getAttribute('data-subject') || 'Form') + ' — ' + (data.name || data.email || 'visitor');
      data._template = 'table';
      data._captcha = 'false';
      data.form = f.getAttribute('data-subject') || 'Form';
      data.page = location.href;
      if (data.email) data._replyto = data.email;
      fetch(endpoint(), { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function () {
          if (msg) { msg.className = 'form-msg ok'; msg.textContent = f.getAttribute('data-ok') || 'Received. We reply within two business days.'; }
          var go = f.getAttribute('data-reveal'); if (go) { var el = document.getElementById(go); if (el) el.hidden = false; }
          f.reset(); resetSteps(f);
          if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead', { form: data.form });
        })
        .catch(function () {
          if (msg) { msg.className = 'form-msg err'; msg.textContent = 'The form could not be sent. Check your connection and press the button again.'; }
        })
        .then(function () { if (btn) { btn.disabled = false; btn.textContent = old; } });
    });
  });

  /* ---------- Multi-step forms ---------- */
  function resetSteps(f) {
    var st = $$('.step', f); if (!st.length) return;
    st.forEach(function (s, i) { s.classList.toggle('active', i === 0); });
    $$('.steps-ind span', f).forEach(function (s, i) { s.classList.toggle('on', i === 0); });
    f._step = 0;
  }
  $$('form.multistep').forEach(function (f) {
    var steps = $$('.step', f), ind = $$('.steps-ind span', f);
    f._step = 0;
    function go(n) {
      var i = f._step;
      if (n > i) {
        var cur = steps[i];
        var bad = $$('input,select,textarea', cur).filter(function (x) { return !x.checkValidity(); });
        if (bad.length) { bad[0].reportValidity(); return; }
        if (!groupsValid(cur)) return;
      }
      f._step = Math.max(0, Math.min(steps.length - 1, n));
      steps.forEach(function (s, k) { s.classList.toggle('active', k === f._step); });
      ind.forEach(function (s, k) { s.classList.toggle('on', k <= f._step); });
      var first = $('input:not([type=hidden]),select,textarea', steps[f._step]);
      if (first && n > i) first.focus({ preventScroll: true });
      f.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    $$('[data-next]', f).forEach(function (b) { b.addEventListener('click', function () { go(f._step + 1); }); });
    $$('[data-prev]', f).forEach(function (b) { b.addEventListener('click', function () { go(f._step - 1); }); });
  });

  /* ---------- Prefill forms from URL (e.g. VRAM calculator → lead form) ---------- */
  try {
    var qs = new URLSearchParams(location.search);
    qs.forEach(function (v, k) {
      var el = document.querySelector('form.js-form [name="' + k.replace(/"/g, '') + '"]');
      if (!el) return;
      if (el.type === 'radio' || el.type === 'checkbox') {
        $$('form.js-form [name="' + k + '"]').forEach(function (r) { if (r.value === v) r.checked = true; });
      } else { el.value = v.slice(0, 500); }
    });
  } catch (e) { }

  /* ---------- YouTube facades ---------- */
  $$('.video[data-yt]').forEach(function (v) {
    var id = v.getAttribute('data-yt');
    var t = v.getAttribute('data-title') || 'YouTube video';
    v.setAttribute('role', 'button'); v.setAttribute('tabindex', '0'); v.setAttribute('aria-label', 'Play video: ' + t);
    v.innerHTML = '<img loading="lazy" alt="" src="https://i.ytimg.com/vi/' + id + '/hqdefault.jpg" width="480" height="360"><div class="play"><span>▶</span></div>';
    function play() { v.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0" title="' + t.replace(/"/g, '&quot;') + '" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe>'; }
    v.addEventListener('click', play, { once: true });
    v.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); } });
  });

  /* ---------- Filter chips (videos, learn) ---------- */
  $$('[data-filter-group]').forEach(function (grp) {
    var target = grp.getAttribute('data-filter-group');
    $$('.chip', grp).forEach(function (c) {
      c.addEventListener('click', function () {
        $$('.chip', grp).forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
        var f = c.getAttribute('data-filter');
        $$('[data-tags]', document.getElementById(target)).forEach(function (it) {
          it.hidden = !(f === 'all' || (' ' + it.getAttribute('data-tags') + ' ').indexOf(' ' + f + ' ') > -1);
        });
      });
    });
  });
  var ls = $('#learnSearch');
  if (ls) ls.addEventListener('input', function () {
    var q = ls.value.trim().toLowerCase();
    $$('#learnList [data-tags]').forEach(function (li) { li.hidden = q && li.textContent.toLowerCase().indexOf(q) === -1; });
  });

  /* ---------- TOC scroll spy ---------- */
  var tocLinks = $$('.toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    tocLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) { tocLinks.forEach(function (a) { a.classList.remove('on'); }); var a = map[en.target.id]; if (a) a.classList.add('on'); }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    Object.keys(map).forEach(function (id) { var h = document.getElementById(id); if (h) io.observe(h); });
  }

  /* ---------- Copy buttons on code blocks ---------- */
  $$('.prose pre').forEach(function (pre) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'btn btn-sm btn-ghost'; b.textContent = 'Copy';
    b.style.cssText = 'float:right;margin:-4px -6px 6px 10px;color:#E3E8F3;border-color:#3a4766';
    b.addEventListener('click', function () {
      var txt = pre.querySelector('code') ? pre.querySelector('code').innerText : pre.innerText;
      try { navigator.clipboard.writeText(txt); b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1600); } catch (e) { }
    });
    pre.insertBefore(b, pre.firstChild);
  });

  /* ---------- Share ---------- */
  $$('[data-share]').forEach(function (a) {
    var kind = a.getAttribute('data-share'), u = encodeURIComponent(location.href), t = encodeURIComponent(document.title);
    var href = { x: 'https://x.com/intent/post?url=' + u + '&text=' + t, linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + u, reddit: 'https://www.reddit.com/submit?url=' + u + '&title=' + t, hn: 'https://news.ycombinator.com/submitlink?u=' + u + '&t=' + t }[kind];
    if (href) { a.href = href; a.target = '_blank'; a.rel = 'noopener'; }
    if (kind === 'copy') a.addEventListener('click', function (e) { e.preventDefault(); try { navigator.clipboard.writeText(location.href); a.textContent = 'Link copied'; } catch (err) { } });
  });

  /* ---------- Countdown (challenge) ---------- */
  var cd = $('[data-countdown]');
  if (cd) {
    var target = new Date(cd.getAttribute('data-countdown'));
    (function tick() {
      var ms = Math.max(0, target - new Date());
      var d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4), s = Math.floor(ms % 6e4 / 1e3);
      cd.textContent = d + 'd ' + String(h).padStart(2, '0') + 'h ' + String(m).padStart(2, '0') + 'm ' + String(s).padStart(2, '0') + 's';
      if (ms > 0) setTimeout(tick, 1000);
    })();
  }

  /* ---------- Theme-aware colour helper for canvases ---------- */
  QZ.colors = function () {
    var cs = getComputedStyle(document.documentElement);
    function g(n) { return cs.getPropertyValue(n).trim(); }
    return { signal: g('--signal'), step: g('--step'), error: g('--error'), ink: g('--ink'), ink3: g('--ink-3'), rule: g('--rule'), surface: g('--surface'), gold: g('--gold') };
  };
  QZ.fitCanvas = function (cv) {
    var r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr));
    var ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: r.width, h: r.height };
  };

  /* ---------- Home: live quantizer scope ---------- */
  var scope = $('#scope');
  if (scope) {
    var bits = $('#scopeBits'), reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var progress = reduce ? 1 : 0, t0 = null;
    function sig(x) { return 0.62 * Math.sin(2 * Math.PI * 1.15 * x) + 0.26 * Math.sin(2 * Math.PI * 3.1 * x + 0.7) + 0.08 * Math.sin(2 * Math.PI * 7.3 * x); }
    function draw() {
      var c = QZ.colors(), f = QZ.fitCanvas(scope), ctx = f.ctx, w = f.w, h = f.h;
      var n = +bits.value, L = Math.pow(2, n), lo = -1, hi = 1, d = (hi - lo) / L;
      var mid = h * 0.42, amp = h * 0.36, eBase = h * 0.88, N = Math.max(200, Math.floor(w));
      ctx.clearRect(0, 0, w, h);
      var mse = 0, ps = 0;
      // error band
      ctx.beginPath(); ctx.moveTo(0, eBase);
      for (var i = 0; i <= N; i++) {
        var x = i / N, v = sig(x), q = Math.min(hi - d / 2, Math.max(lo + d / 2, lo + (Math.floor((v - lo) / d) + 0.5) * d));
        var e = v - q; mse += e * e; ps += v * v;
        ctx.lineTo(x * w, eBase - e * (h * 0.09) / (d / 2 + 1e-9) * Math.min(1, progress * 1.5));
      }
      ctx.lineTo(w, eBase); ctx.strokeStyle = c.error; ctx.lineWidth = 1.2; ctx.stroke();
      // original
      var drawTo = Math.min(1, progress * 2);
      ctx.beginPath();
      for (i = 0; i <= N * drawTo; i++) { x = i / N; var y = mid - sig(x) * amp; i ? ctx.lineTo(x * w, y) : ctx.moveTo(x * w, y); }
      ctx.strokeStyle = c.signal; ctx.lineWidth = 2; ctx.stroke();
      // staircase
      if (progress > 0.5) {
        ctx.save(); ctx.globalAlpha = Math.min(1, (progress - 0.5) * 2);
        ctx.beginPath();
        var prev = null;
        for (i = 0; i <= N; i++) {
          x = i / N; v = sig(x); q = Math.min(hi - d / 2, Math.max(lo + d / 2, lo + (Math.floor((v - lo) / d) + 0.5) * d));
          y = mid - q * amp;
          if (prev === null) ctx.moveTo(0, y); else if (y !== prev) { ctx.lineTo(x * w, prev); ctx.lineTo(x * w, y); }
          prev = y;
        }
        ctx.lineTo(w, prev); ctx.strokeStyle = c.step; ctx.lineWidth = 2.4; ctx.stroke(); ctx.restore();
      }
      var sqnr = 10 * Math.log10(ps / Math.max(mse, 1e-12));
      $('#roBits').textContent = n; $('#roLevels').textContent = L.toLocaleString(); $('#roSqnr').textContent = sqnr.toFixed(1) + ' dB';
    }
    function anim(ts) { if (t0 === null) t0 = ts; progress = Math.min(1, (ts - t0) / 1600); draw(); if (progress < 1) requestAnimationFrame(anim); }
    bits.addEventListener('input', draw);
    window.addEventListener('resize', draw);
    document.addEventListener('qz:theme', draw);
    if (reduce) draw(); else requestAnimationFrame(anim);
  }

  /* ---------- Home: will-it-fit quick check ---------- */
  var qf = $('#quickFit');
  if (qf) {
    function upd() {
      var p = parseFloat($('#qfParams').value) || 0, bpw = parseFloat($('#qfBits').value), vram = parseFloat($('#qfVram').value);
      var w = p * 1e9 * bpw / 8 / 1e9, total = w * 1.15 + 1.0;
      $('#qfWeights').textContent = w.toFixed(1) + ' GB';
      $('#qfTotal').textContent = total.toFixed(1) + ' GB';
      var v = $('#qfVerdict');
      if (total <= vram * 0.92) { v.textContent = 'Fits, with ' + (vram - total).toFixed(1) + ' GB to spare for longer context.'; v.style.color = 'var(--step)'; }
      else if (total <= vram) { v.textContent = 'Tight fit. Keep context short or drop one quant level.'; v.style.color = 'var(--gold)'; }
      else { v.textContent = 'Does not fit. Needs ' + (total - vram).toFixed(1) + ' GB more, or a smaller quant.'; v.style.color = 'var(--error)'; }
      var a = $('#qfMore'); if (a) a.href = a.getAttribute('data-base') + '?params=' + p + '&bpw=' + bpw;
    }
    $$('select,input', qf).forEach(function (el) { el.addEventListener('input', upd); el.addEventListener('change', upd); });
    upd();
  }

  /* ---------- Savings estimator (lead page + home band) ---------- */
  $$('.savings').forEach(function (box) {
    function v(n) { var el = $('[data-s="' + n + '"]', box); return el ? parseFloat(el.value) || 0 : 0; }
    function calc() {
      var spend = v('spend'), red = v('reduction') / 100;
      var save = spend * red, year = save * 12;
      $('[data-o="month"]', box).textContent = '$' + Math.round(save).toLocaleString();
      $('[data-o="year"]', box).textContent = '$' + Math.round(year).toLocaleString();
      var h = $('input[name="est_monthly_savings"]'); if (h) h.value = '$' + Math.round(save).toLocaleString() + '/mo (estimate)';
    }
    $$('input,select', box).forEach(function (el) { el.addEventListener('input', calc); });
    calc();
  });
})();
