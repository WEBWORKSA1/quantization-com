# Quantization.com — article fragment spec (for writers)

Each article is ONE file: `_build/pages/learn/<slug>.html`. It is a fragment (no <html>, <head>, <body>, no <script>, no inline style attributes). The build script wraps it in the site layout, adds the table of contents, schema, ads, CTAs and breadcrumbs.

## File header (required, exact format)

```
---
title: <SEO title, 50–62 chars, ends with " | Quantization.com">
description: <meta description, 140–158 chars, plain text>
h1: <on-page headline, sentence case>
track: <ai | signal | music | physics | general>
read: <estimated minutes, integer>
summary: <one sentence shown on cards, max 150 chars>
---
```

## Body conventions

- First element: `<p class="lede">…</p>` (2–3 sentence intro that answers the search intent immediately).
- Sections: `<h2 id="kebab-id">Sentence case heading</h2>`; sub-sections `<h3>`. 5–9 h2 sections. The build creates the TOC from h2 elements, so every h2 needs a unique id.
- Callouts: `<aside class="note"><p>…</p></aside>` (tip/insight) and `<aside class="warn"><p>…</p></aside>` (pitfall).
- Formulas: `<div class="formula">E<sub>n</sub> = −13.6 eV / n<sup>2</sup></div>`; optional `<p class="formula-note">…</p>` right after explaining symbols.
- Tables: always wrap: `<div class="table-wrap"><table><thead>…</thead><tbody>…</tbody></table></div>`. Optional `<caption>`.
- Code: `<pre><code>…</code></pre>` with HTML-escaped content (&lt; &gt; &amp;). Keep commands accurate to current official docs.
- Worked examples: `<div class="example"><h3>Worked example: …</h3>…</div>`.
- Key takeaways near the end: `<div class="takeaways"><h2 id="takeaways">Key takeaways</h2><ul><li>…</li></ul></div>`.
- Mid-article call-to-action placeholder, put exactly one after the 2nd or 3rd h2 section: `<div data-cta="lead"></div>` (AI-track articles) or `<div data-cta="newsletter"></div>` (other tracks). Put `<div data-cta="tool" data-tool="<tool-slug>"></div>` once where a site tool is relevant.
- FAQ (4–6 questions), at the end before sources:
  `<section class="faq"><h2 id="faq">Frequently asked questions</h2><details><summary>Question?</summary><p>Answer.</p></details>…</section>`
- Sources last: `<section class="sources"><h2 id="sources">Sources and further reading</h2><ol><li><a href="https://…" rel="noopener" target="_blank">Title</a> — one-line note</li>…</ol></section>` (4–10 real, verified URLs; primary sources preferred: arXiv papers, official docs, standards, university pages).
- Internal links use the token `{{root}}` as the site-root prefix, e.g. `<a href="{{root}}tools/vram-calculator.html">VRAM calculator</a>`, `<a href="{{root}}learn/gguf-quant-types.html">GGUF quant types</a>`, `<a href="{{root}}formats.html">formats atlas</a>`, `<a href="{{root}}glossary.html">glossary</a>`.

## Site pages you can link to (all exist)

Tools: `tools/vram-calculator.html` (LLM memory/VRAM calculator), `tools/quantization-playground.html` (interactive bit-depth/quantization visualizer with SQNR), `tools/adc-calculator.html` (ADC/bit-depth/SNR/ENOB/audio file size), `tools/music-quantizer.html` (interactive MIDI quantize/swing demo), `tools/energy-levels.html` (Bohr levels, photon wavelength, particle in a box).
Learn (slugs): `what-is-quantization`, `llm-quantization-guide`, `gguf-quant-types`, `gptq-vs-awq-vs-gguf`, `ptq-vs-qat`, `number-formats`, `kv-cache-quantization`, `hardware-for-local-llms`, `quantize-a-model`, `adc-quantization-error`, `audio-bit-depth-dither`, `music-quantize-guide`, `quantization-in-physics`.
Other: `formats.html` (formats atlas), `glossary.html`, `videos.html`, `resources.html`, `get-optimized.html` (free model optimization plan / lead form), `challenge.html`, `cheat-sheet.html`.

## Quality and policy rules (critical — this site must pass Google AdSense review)

- 100% original writing in your own words. Never copy sentences from sources. Any direct quote must be under 15 words and at most one per source (prefer none).
- Accuracy over flourish: verify every number, formula, command and name against a primary source you actually fetched. If unsure, omit it.
- No invented statistics, testimonials, benchmarks or quotes. Computed examples are fine (show the arithmetic).
- Length: 1,400–2,200 words of real substance per article (not padding). Plain, direct, expert voice; second person is fine. Sentence-case headings. No emoji. No ALL CAPS labels.
- Neutral toward vendors; name products only for identification. Do not imply endorsement or affiliation.
- Write for two readers at once: the beginner who searched the term, and the practitioner who wants the exact numbers.
- UTF-8 text; use real characters (×, −, ≈, ², →) where helpful.
