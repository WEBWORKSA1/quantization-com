/* Quantization.com — LLM VRAM calculator */
(function () {
  'use strict';
  var $ = QZ.$, $$ = QZ.$$;
  var GiB = Math.pow(2, 30);

  // Architecture values from each model's published config (approximate). params in billions.
  var MODELS = [
    { id: 'llama32-1b', name: 'Llama 3.2 1B', p: 1.24, L: 16, kv: 8, hd: 64 },
    { id: 'llama32-3b', name: 'Llama 3.2 3B', p: 3.21, L: 28, kv: 8, hd: 128 },
    { id: 'phi3-mini', name: 'Phi-3 mini 3.8B', p: 3.82, L: 32, kv: 32, hd: 96 },
    { id: 'mistral-7b', name: 'Mistral 7B v0.3', p: 7.25, L: 32, kv: 8, hd: 128 },
    { id: 'qwen25-7b', name: 'Qwen2.5 7B', p: 7.62, L: 28, kv: 4, hd: 128 },
    { id: 'llama31-8b', name: 'Llama 3.1 8B', p: 8.03, L: 32, kv: 8, hd: 128 },
    { id: 'qwen3-8b', name: 'Qwen3 8B', p: 8.19, L: 36, kv: 8, hd: 128 },
    { id: 'gemma2-9b', name: 'Gemma 2 9B', p: 9.24, L: 42, kv: 8, hd: 256 },
    { id: 'phi4-14b', name: 'Phi-4 14B', p: 14.7, L: 40, kv: 10, hd: 128 },
    { id: 'qwen25-14b', name: 'Qwen2.5 14B', p: 14.7, L: 48, kv: 8, hd: 128 },
    { id: 'gptoss-20b', name: 'gpt-oss-20b (MoE)', p: 20.9, L: 24, kv: 8, hd: 64, note: 'Ships with MoE weights in MXFP4 (≈4.25 bits).' },
    { id: 'mistral-small-24b', name: 'Mistral Small 24B', p: 23.6, L: 40, kv: 8, hd: 128 },
    { id: 'gemma3-27b', name: 'Gemma 3 27B', p: 27.4, L: 62, kv: 16, hd: 128, note: 'Uses sliding-window attention on most layers, so real KV cache at long context is smaller than this upper bound.' },
    { id: 'qwen3-30b-a3b', name: 'Qwen3 30B-A3B (MoE)', p: 30.5, L: 48, kv: 4, hd: 128, note: 'Mixture of experts: all 30.5B parameters must be stored even though about 3B are active per token.' },
    { id: 'qwen25-32b', name: 'Qwen2.5 32B', p: 32.8, L: 64, kv: 8, hd: 128 },
    { id: 'mixtral-8x7b', name: 'Mixtral 8x7B (MoE)', p: 46.7, L: 32, kv: 8, hd: 128, note: 'Mixture of experts: all experts must be stored in memory.' },
    { id: 'llama31-70b', name: 'Llama 3.1 / 3.3 70B', p: 70.6, L: 80, kv: 8, hd: 128 },
    { id: 'qwen25-72b', name: 'Qwen2.5 72B', p: 72.7, L: 80, kv: 8, hd: 128 },
    { id: 'gptoss-120b', name: 'gpt-oss-120b (MoE)', p: 116.8, L: 36, kv: 8, hd: 64, note: 'Ships with MoE weights in MXFP4 (≈4.25 bits).' },
    { id: 'llama31-405b', name: 'Llama 3.1 405B', p: 405.9, L: 126, kv: 8, hd: 128 },
    { id: 'custom', name: 'Custom model…', p: 13, L: 40, kv: 8, hd: 128 }
  ];

  // Effective bits per weight. GGUF values: llama.cpp quantize README (Llama 3.1 8B). Others: format arithmetic.
  var FORMATS = [
    { id: 'fp32', name: 'FP32', bpw: 32 },
    { id: 'bf16', name: 'BF16 / FP16', bpw: 16 },
    { id: 'q8_0', name: 'GGUF Q8_0', bpw: 8.5 },
    { id: 'fp8', name: 'FP8 (E4M3)', bpw: 8.0 },
    { id: 'int8', name: 'INT8 (W8A8, LLM.int8)', bpw: 8.0 },
    { id: 'q6_k', name: 'GGUF Q6_K', bpw: 6.56 },
    { id: 'q5_k_m', name: 'GGUF Q5_K_M', bpw: 5.70 },
    { id: 'q4_k_m', name: 'GGUF Q4_K_M', bpw: 4.89 },
    { id: 'q4_k_s', name: 'GGUF Q4_K_S', bpw: 4.67 },
    { id: 'nvfp4', name: 'NVFP4', bpw: 4.5 },
    { id: 'iq4_xs', name: 'GGUF IQ4_XS', bpw: 4.46 },
    { id: 'gptq4', name: 'GPTQ 4-bit (g128)', bpw: 4.25 },
    { id: 'awq4', name: 'AWQ 4-bit (g128)', bpw: 4.25 },
    { id: 'mxfp4', name: 'MXFP4', bpw: 4.25 },
    { id: 'nf4', name: 'bitsandbytes NF4 (double quant)', bpw: 4.13 },
    { id: 'q3_k_m', name: 'GGUF Q3_K_M', bpw: 4.00 },
    { id: 'iq3_m', name: 'GGUF IQ3_M', bpw: 3.76 },
    { id: 'q2_k', name: 'GGUF Q2_K', bpw: 3.16 },
    { id: 'iq2_m', name: 'GGUF IQ2_M', bpw: 2.93 },
    { id: 'iq2_xxs', name: 'GGUF IQ2_XXS', bpw: 2.38 },
    { id: 'iq1_s', name: 'GGUF IQ1_S', bpw: 2.00 },
    { id: 'custom', name: 'Custom bits per weight…', bpw: 4 }
  ];
  var COMPARE = ['bf16', 'q8_0', 'q6_k', 'q5_k_m', 'q4_k_m', 'gptq4', 'q3_k_m', 'q2_k', 'iq2_xxs'];

  var KV = [
    { id: '2', name: 'FP16 / BF16 (2 bytes)', b: 2 },
    { id: '1.0625', name: '8-bit: q8_0 or FP8 (≈1 byte)', b: 1.0625 },
    { id: '0.5625', name: '4-bit: q4_0 (≈0.56 bytes)', b: 0.5625 }
  ];

  // name, memory GiB, bandwidth GB/s, kind
  var DEVICES = [
    ['RTX 4060', 8, 272, 'gpu'], ['RTX 3060', 12, 360, 'gpu'], ['Arc B580', 12, 456, 'gpu'], ['RTX 4060 Ti 16 GB', 16, 288, 'gpu'],
    ['RTX 4070 Ti Super', 16, 672, 'gpu'], ['RTX 5080', 16, 960, 'gpu'], ['RTX 3090', 24, 936, 'gpu'], ['RTX 4090', 24, 1008, 'gpu'],
    ['RX 7900 XTX', 24, 960, 'gpu'], ['RTX 5090', 32, 1792, 'gpu'], ['RTX 6000 Ada', 48, 960, 'gpu'], ['A100 80 GB', 80, 2039, 'gpu'],
    ['H100 SXM 80 GB', 80, 3350, 'gpu'], ['RTX PRO 6000 Blackwell', 96, 1792, 'gpu'], ['H200 141 GB', 141, 4800, 'gpu'], ['MI300X 192 GB', 192, 5300, 'gpu'],
    ['MacBook Air M4 16 GB', 16, 120, 'mac'], ['Mac mini M4 Pro 48 GB', 48, 273, 'mac'], ['Mac Studio M4 Max 64 GB', 64, 546, 'mac'],
    ['MacBook Pro M4 Max 128 GB', 128, 546, 'mac'], ['DGX Spark 128 GB', 128, 273, 'mac'], ['Mac Studio M3 Ultra 512 GB', 512, 819, 'mac']
  ];
  function usable(dev) {
    if (dev[3] === 'mac') return dev[1] * (dev[1] <= 36 ? 0.67 : 0.75);
    return dev[1];
  }

  function fillSelect(sel, list, valKey, txt) {
    sel.innerHTML = list.map(function (x) { return '<option value="' + x[valKey] + '">' + txt(x) + '</option>'; }).join('');
  }
  var mSel = $('#vModel'), fSel = $('#vFormat'), kSel = $('#vKv');
  fillSelect(mSel, MODELS, 'id', function (m) { return m.name + (m.id === 'custom' ? '' : ' (' + m.p + 'B)'); });
  fillSelect(fSel, FORMATS, 'id', function (f) { return f.name + (f.id === 'custom' ? '' : ' — ' + f.bpw + ' bits'); });
  fillSelect(kSel, KV, 'id', function (k) { return k.name; });
  var dSel = $('#vDevice');
  dSel.innerHTML = DEVICES.map(function (d, i) { return '<option value="' + i + '">' + d[0] + ' (' + d[1] + ' GB)</option>'; }).join('');

  function num(id) { var v = parseFloat($(id).value); return isFinite(v) ? v : 0; }
  function setModel(id) {
    var m = MODELS.filter(function (x) { return x.id === id; })[0] || MODELS[5];
    $('#vParams').value = m.p; $('#vLayers').value = m.L; $('#vKvHeads').value = m.kv; $('#vHeadDim').value = m.hd;
    var custom = m.id === 'custom';
    $$('.arch input').forEach(function (i) { i.readOnly = !custom; });
    $('#vModelNote').textContent = m.note || (custom ? 'Enter values from the model’s config.json: num_hidden_layers, num_key_value_heads and head_dim (or hidden_size ÷ num_attention_heads).' : 'Values from the model’s published configuration.');
  }

  // URL state
  var qs = new URLSearchParams(location.search);
  setModel(qs.get('model') || 'llama31-8b');
  mSel.value = qs.get('model') || 'llama31-8b';
  if (qs.get('params')) { mSel.value = 'custom'; setModel('custom'); $('#vParams').value = qs.get('params'); }
  if (qs.get('bpw')) {
    var match = FORMATS.filter(function (f) { return String(f.bpw) === qs.get('bpw'); })[0];
    if (match) fSel.value = match.id; else { fSel.value = 'custom'; $('#vBpw').value = qs.get('bpw'); }
  } else fSel.value = qs.get('fmt') || 'q4_k_m';
  if (qs.get('ctx')) $('#vCtx').value = qs.get('ctx');
  if (qs.get('batch')) $('#vBatch').value = qs.get('batch');
  if (qs.get('kv')) kSel.value = qs.get('kv');
  dSel.value = qs.get('dev') || '7';
  if (qs.get('gpus')) $('#vGpus').value = qs.get('gpus');

  function fmtGB(x) { return x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1) : x.toFixed(2); }

  function calc() {
    var f = FORMATS.filter(function (x) { return x.id === fSel.value; })[0];
    $('#vBpwWrap').hidden = f.id !== 'custom';
    var bpw = f.id === 'custom' ? num('#vBpw') : f.bpw;
    var P = num('#vParams') * 1e9, L = num('#vLayers'), kvh = num('#vKvHeads'), hd = num('#vHeadDim');
    var ctx = Math.max(1, num('#vCtx')), batch = Math.max(1, num('#vBatch'));
    var kvb = parseFloat(kSel.value);
    var weights = P * bpw / 8 / GiB;
    var kvPerTok = 2 * L * kvh * hd * kvb; // bytes per token
    var kv = kvPerTok * ctx * batch / GiB;
    var overhead = 1.0 + 0.05 * weights;
    var total = weights + kv + overhead;
    $('#oWeights').textContent = fmtGB(weights);
    $('#oKv').textContent = fmtGB(kv);
    $('#oOver').textContent = fmtGB(overhead);
    $('#oTotal').textContent = fmtGB(total);
    $('#oKvTok').textContent = (kvPerTok / 1024).toFixed(0) + ' KiB per token';
    var sw = $('#stack');
    sw.querySelector('.w').style.width = (weights / total * 100) + '%';
    sw.querySelector('.kv').style.width = (kv / total * 100) + '%';
    sw.querySelector('.o').style.width = (overhead / total * 100) + '%';

    // selected device
    var gpus = Math.max(1, Math.round(num('#vGpus')));
    var dev = DEVICES[+dSel.value], cap = usable(dev) * gpus;
    var verdict = $('#oVerdict');
    if (total <= cap * 0.95) { verdict.textContent = 'Fits on ' + (gpus > 1 ? gpus + ' × ' : '') + dev[0] + ' with ' + fmtGB(cap - total) + ' GB headroom.'; verdict.style.color = 'var(--step)'; }
    else if (total <= cap) { verdict.textContent = 'Just fits on ' + dev[0] + '. Expect little room for longer context or batching.'; verdict.style.color = 'var(--gold)'; }
    else { verdict.textContent = 'Does not fit on ' + (gpus > 1 ? gpus + ' × ' : '') + dev[0] + ': short by ' + fmtGB(total - cap) + ' GB. Try a smaller format, shorter context or 8-bit KV cache.'; verdict.style.color = 'var(--error)'; }
    var bytesPerTok = P * bpw / 8 + kvPerTok * ctx * batch * 0.5; // weights + average KV read
    var tps = dev[2] * 1e9 * gpus / bytesPerTok;
    $('#oTps').textContent = total <= cap ? '≈ ' + (tps >= 100 ? tps.toFixed(0) : tps.toFixed(1)) + ' tokens/s ceiling' : '—';
    $('#oCapNote').textContent = dev[3] === 'mac' ? 'Assumes about ' + (dev[1] <= 36 ? 'two-thirds' : 'three-quarters') + ' of unified memory (' + fmtGB(usable(dev)) + ' GB) is usable by the GPU, a common rule of thumb; your runtime’s startup log shows the real limit.' : (gpus > 1 ? 'Assumes the model is split evenly across ' + gpus + ' GPUs (tensor or pipeline parallel).' : '');

    // fit list
    $('#fitList').innerHTML = DEVICES.map(function (d) {
      var c = usable(d), cls = total <= c * 0.95 ? 'yes' : total <= c ? 'tight' : 'no';
      return '<div class="fit ' + cls + '"><span>' + d[0] + '</span><b>' + (cls === 'no' ? '✕' : '✓') + ' ' + fmtGB(c) + '</b></div>';
    }).join('');

    // format comparison
    var rows = COMPARE.map(function (id) {
      var ff = FORMATS.filter(function (x) { return x.id === id; })[0];
      var t = P * ff.bpw / 8 / GiB; t = t + kv + 1.0 + 0.05 * t;
      return { n: ff.name.replace('GGUF ', ''), t: t, sel: id === f.id };
    });
    var max = Math.max.apply(null, rows.map(function (r) { return r.t; }));
    $('#cmpBars').innerHTML = rows.map(function (r) {
      return '<div class="bar-row"><span>' + r.n + '</span><span class="track-bar"><span class="fill' + (r.sel ? ' sel' : '') + '" style="width:' + (r.t / max * 100).toFixed(1) + '%"></span></span><span class="val">' + fmtGB(r.t) + ' GB</span></div>';
    }).join('');

    // working
    $('#working').innerHTML =
      'weights = ' + num('#vParams') + 'e9 × ' + bpw + ' bits ÷ 8 = ' + fmtGB(weights) + ' GB<br>' +
      'KV cache = 2 × ' + L + ' layers × ' + kvh + ' KV heads × ' + hd + ' head_dim × ' + ctx.toLocaleString() + ' tokens × ' + batch + ' seq × ' + kvb + ' bytes = ' + fmtGB(kv) + ' GB<br>' +
      'overhead = 1.0 GB + 5% of weights = ' + fmtGB(overhead) + ' GB<br>' +
      'total = ' + fmtGB(total) + ' GB  (1 GB = 2<sup>30</sup> bytes)';

    // share + lead links
    var state = { model: mSel.value, fmt: fSel.value, ctx: ctx, batch: batch, kv: kSel.value, dev: dSel.value, gpus: gpus };
    if (mSel.value === 'custom') state.params = num('#vParams');
    if (fSel.value === 'custom') state.bpw = bpw;
    var q = new URLSearchParams(state).toString();
    history.replaceState(null, '', '?' + q);
    var lead = $('#vLead');
    if (lead) lead.href = lead.getAttribute('data-base') + '?model=' + encodeURIComponent(mSel.options[mSel.selectedIndex].text) + '&format=' + encodeURIComponent(f.name) + '&context=' + ctx + '&hardware=' + encodeURIComponent(dev[0]);
  }

  mSel.addEventListener('change', function () { setModel(mSel.value); calc(); });
  $$('#vramTool input, #vramTool select').forEach(function (el) { el.addEventListener('input', calc); el.addEventListener('change', calc); });
  $$('[data-ctx]').forEach(function (b) { b.addEventListener('click', function () { $('#vCtx').value = b.getAttribute('data-ctx'); calc(); }); });
  var cp = $('#vCopy');
  if (cp) cp.addEventListener('click', function () { try { navigator.clipboard.writeText(location.href); cp.textContent = 'Link copied'; setTimeout(function () { cp.textContent = 'Copy link to this result'; }, 1800); } catch (e) { } });
  calc();
})();
