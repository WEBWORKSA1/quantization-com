/* Quantization.com — formats atlas filter and sort */
(function () {
  'use strict';
  var $ = QZ.$, $$ = QZ.$$;
  var tbody = $('#atlas tbody'); if (!tbody) return;
  var rows = $$('tr', tbody), search = $('#atlasSearch'), fam = $('#atlasFamily'), count = $('#atlasCount');
  function apply() {
    var q = (search.value || '').trim().toLowerCase(), f = fam.value, shown = 0;
    rows.forEach(function (r) {
      var ok = (!f || r.getAttribute('data-family') === f) && (!q || q.split(/\s+/).every(function (t) { return r.getAttribute('data-text').indexOf(t) > -1 || r.textContent.toLowerCase().indexOf(t) > -1; }));
      r.hidden = !ok; if (ok) shown++;
    });
    count.textContent = shown + ' of ' + rows.length + ' formats';
  }
  search.addEventListener('input', apply); fam.addEventListener('change', apply);
  $$('[data-sort]').forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.getAttribute('data-sort');
      $$('[data-sort]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      rows.sort(function (a, c) {
        if (k === 'bpw') return parseFloat(a.getAttribute('data-bpw')) - parseFloat(c.getAttribute('data-bpw'));
        return a.textContent.localeCompare(c.textContent);
      }).forEach(function (r) { tbody.appendChild(r); });
    });
  });
  var q0 = new URLSearchParams(location.search).get('q'); if (q0) search.value = q0;
  apply();
})();
