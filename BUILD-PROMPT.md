# Quantization.com — phase-wise build prompt

A reusable, phase-by-phase prompt for building (or rebuilding) Quantization.com as a modern, interactive, responsive, AdSense-ready website with lead generation, reader support, contests, hiring and sponsorship. Paste one phase at a time into your AI builder, or hand the whole file to a developer.

---

## Phase 0 — The idea and why it makes money

**Concept:** *Quantization.com — "Fewer bits, measured."* The reference site for quantization: the act of representing values with fewer discrete levels. AI model quantization is the commercial core; signals/audio, music timing and physics are traffic tracks that share the same idea and widen the audience.

**Why AI quantization is the core**
- Every person running an open-weight LLM locally faces the same questions: *Which file do I download? Will it fit on my GPU? How much quality do I lose?* Those are high-frequency, tool-shaped searches (VRAM calculators, Q4_K_M vs Q5_K_M, GGUF vs GPTQ vs AWQ).
- Teams serving models in production spend real money on GPUs. Moving from 16-bit to 8-bit or 4-bit typically halves weight memory or better, which is a direct line to lead generation (optimization plans, consulting referrals) and sponsorship (GPU clouds, inference platforms, hardware).
- Advertisers in AI, cloud and developer tooling are among the higher-paying AdSense categories.

**Honest weaknesses to design around**
- Developer audiences block ads at high rates, so AdSense alone under-monetizes. Leads and sponsorships must carry more of the revenue.
- The field moves monthly. Content needs dated updates and a correction workflow.
- AI-written text is scrutinized by AdSense reviewers; every page must have original analysis, worked numbers and primary sources.

**Revenue model (illustrative assumptions, not forecasts)**

| Stream | Mechanism | Key assumption to validate |
|---|---|---|
| AdSense | Auto ads on content and tool pages | RPM varies widely by geography and ad-block rate; measure in month 1–2 |
| Lead generation | Free optimization plan → paid implementation via partner engineers or referral fees | 0.5–1% of tool users request a plan; a fraction convert to paid work |
| Sponsorship | Tool "presented by", newsletter slots, challenge title sponsor, directory listings | Sold monthly once traffic data exists |
| Reader support | Pledges with secure payment link, monthly tiers | Small but loyal; also funds the prize pool |
| Talent | Featured jobs, introductions from the talent network | Follows audience growth |

---

## Phase 1 — Research (completed for v1)

Visit at least 35 leading sites across four groups and extract features, forms, content structures, design and monetization patterns. v1 research covered ~90 pages including: Hugging Face Transformers & Optimum quantization docs, llama.cpp (README, quantize README, quantize.cpp), bitsandbytes, PyTorch torchao, TensorFlow Model Optimization, NVIDIA Model Optimizer, ONNX Runtime, vLLM, Unsloth, Ollama, LM Studio, Maarten Grootendorst's visual guide, apxml / devtk / incoherency / flaviocopes VRAM calculators, DeepLearning.AI, Qualcomm AI Hub, Intel Neural Compressor, Analog Devices MT-001, TI Precision Labs, MathWorks, All About Circuits, Sound On Sound, iZotope, Ableton manual & Learning Music, Splice, Native Instruments, Physics Classroom, PhET, 3Blue1Brown, BetterExplained, DSPGuide, Electronics-Tutorials, Apex Waves, CalculatorSoup, Brilliant, DrivenData, AIcrowd, Devpost, MLCommons, Open Collective, GitHub Sponsors, Buy Me a Coffee, Ko-fi, Patreon, Wikimedia, Mozilla, Raspberry Pi Foundation, Khan Academy, PSF, Blender Development Fund, Lambda, Hugging Face sales, Together AI, Fireworks, Red Hat AI, RunPod, YC Jobs, Wellfound, Greenhouse, Toptal, TLDR, Product Hunt, Changelog, Cooperpress, Unbounce, HubSpot. See `RESEARCH.md` for the findings.

**Prompt:** "Research [N] leading sites in [niche]. For each, record concrete features, interactive tools (inputs/outputs), content structure, forms (exact fields and order), CTAs, design, monetization and community features. Consolidate into a must-have feature list and a sourced facts/formulas sheet. Do not copy text."

---

## Phase 2 — Information architecture

Build these pages (static HTML, relative links, no server):

```
/                          Home: live quantizer hero, track chooser, quick fit check, tools, guides, lead band, videos, challenge, support, FAQ, newsletter
/tools/                    Tools hub ("instrument rack" rows) + tool suggestion form
/tools/vram-calculator     LLM memory: weights + KV cache + overhead, 22-device fit check, format comparison, tokens/s ceiling, shareable URL, lead CTA
/tools/quantization-playground  Signal/weight quantization 1–16 bits: symmetric/asymmetric, clipping, per-group, rounding, dither, SQNR
/tools/adc-calculator      LSB/SQNR, ENOB, oversampling & noise shaping, audio file size
/tools/music-quantizer     Web Audio drum loop with grid, strength, swing; piano roll; ms offsets
/tools/energy-levels       Hydrogen transitions (λ, colour, series) + particle in a box
/learn/                    Guide index with track filters and search
/learn/<13 guides>         See Phase 6
/glossary                  80+ terms, A–Z jump links
/formats                   Formats atlas: 32 formats, filter/sort, sources
/videos                    24 curated YouTube explainers with click-to-load facades and track filters
/resources                 Papers, libraries, courses, DSP/physics references
/cheat-sheet               Printable formulas (also the email lead magnet)
/get-optimized             Dedicated lead-generation page (multi-step form)
/challenge                 Contest: brief, timeline, scoring, rules, registration, sponsor form
/support                   Allocation, tiers, pledge form, other ways to help
/careers                   Roles + 2-step talent application
/advertise                 Placements, standards, inquiry form, owner contact for acquisition
/about  /contact  /privacy  /cookies  /terms  /disclaimer  /trademark  /sitemap  /404
```

---

## Phase 3 — Design system

- **Concept:** an instrument panel for precision. Colour encodes meaning everywhere: **cobalt = original/continuous**, **teal = quantized**, **magenta = error/cost**. Charts, readouts and legends all use this mapping.
- **Palette (light):** paper `#F2F5FA`, surface `#FFFFFF`, ink `#121A2E`, rule `#D6DDEA`, signal `#2747F5`, step `#0A8F7F`, error `#D42A66`, gold `#B7791F`. Dark theme via `prefers-color-scheme` and a manual toggle.
- **Type:** Instrument Sans (variable width; condensed for headlines) + IBM Plex Mono for live numbers and code only.
- **Layout:** left-aligned, 1180 px max, 68ch prose measure. Rows with hairline rules for lists of tools/guides; cards only where content is truly card-like (videos, tiers). One memorable moment: the hero oscilloscope where a smooth curve snaps into a staircase.
- **Quality floor:** responsive to 360 px, visible focus, reduced-motion respected, AA contrast, no layout shift from ads.

---

## Phase 4 — Global layout and compliance (every page)

1. Top bar on every page, first element in `<body>`: "Contact, if you are interested in this website/domain name/Sponsorship/Advertisement/Partnership" linked to `https://web.works/contact`.
2. AdSense loader in `<head>` of every content page: `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6620975821265271" crossorigin="anonymous"></script>`. Omit it on the 404 page.
3. `ads.txt` at the root: `google.com, pub-6620975821265271, DIRECT, f08c47fec0942fa0`.
4. Cookie notice with "Accept all" / "Essential only"; "Essential only" sets `requestNonPersonalizedAds=1` before ads load. In AdSense → Privacy & messaging, enable Google's certified CMP for EEA/UK/Switzerland.
5. **Private inbox routing:** all forms post via JavaScript to FormSubmit's AJAX endpoint. The owner's address is stored only as an obfuscated numeric array inside `assets/js/site.js` and assembled at submit time; it never appears in HTML, page text, links, README or docs. "Email us" buttons build a `mailto:` on click. Honeypot field on every form.
6. Footer: tools, learn, get involved, company and legal columns, newsletter form, and the trademark/copyright disclosure: "Quantization" is a generic technical term; no exclusive rights claimed; no affiliation with any company or product using the word; third-party marks belong to their owners.
7. JSON-LD on every page: Organization; plus WebSite (home), TechArticle/Article + BreadcrumbList + FAQPage (guides), WebApplication (tools), Dataset (atlas), ItemList (videos).

---

## Phase 5 — Tools (interactive, client-side, formulas shown)

- **VRAM calculator:** presets with layers / KV heads / head_dim from public configs (Llama 3.x, Qwen2.5/3, Gemma 2/3, Mistral, Mixtral, Phi, gpt-oss) + custom; 21 formats with effective bits per weight (GGUF values from the llama.cpp quantize README); KV precision FP16/8-bit/4-bit; context presets; concurrent sequences; 22 GPUs and Macs with bandwidth; outputs weights/KV/overhead/total (GiB), stacked bar, verdict, tokens/s ceiling (bandwidth ÷ bytes per token), comparison bars, fit grid, "show the working", shareable URL, CTA that pre-fills the lead form.
  - weights = params × bpw ÷ 8; KV = 2 × layers × kv_heads × head_dim × tokens × seqs × bytes; overhead = 1 GB + 5% of weights; Macs: GPU-usable ≈ ⅔ (≤36 GB) or ¾ of unified memory.
- **Playground:** five sources (full-scale sine, two-tone, quiet sine, Gaussian weights, outlier weights), 1–16 bits, symmetric/asymmetric, percentile clipping, per-group (32/64/128), round vs truncate, TPDF dither; MSE, measured vs ideal SQNR, levels used, clipped %, scale/zero-point, value table, contextual hints.
- **ADC calculator:** LSB = FSR/2^N, noise rms = LSB/√12, SQNR = 6.02N + 1.76, dynamic range, ENOB = (SINAD − 1.76)/6.02, required bits, oversampling gain and ideal L-th order noise shaping, audio file size.
- **Music quantizer:** 2-bar drum loop with seeded human timing, grid 1/4–1/16T, strength, MPC-style swing, tempo, looseness; Web Audio playback A/B; piano roll; average timing error before/after.
- **Energy levels:** Eₙ = −13.6057·Z²/n² eV, λ = 1239.84/ΔE nm, spectral series, colour swatch, ladder diagram; particle in a box Eₙ = n²h²/(8mL²) with CODATA constants.

---

## Phase 6 — Content (AdSense-grade, original, sourced)

Write 13 guides of 1,400–2,200 words plus an 80+ term glossary. Each guide: answer-first lede, 5–9 sections with ids, worked example with arithmetic, one CTA placeholder, takeaways, 4–6 FAQs, 4–10 primary sources. No invented benchmarks, testimonials or statistics; quotes under 15 words and at most one per source.

Guides: what-is-quantization · llm-quantization-guide · gguf-quant-types · gptq-vs-awq-vs-gguf · ptq-vs-qat · number-formats · kv-cache-quantization · hardware-for-local-llms · quantize-a-model · adc-quantization-error · audio-bit-depth-dither · music-quantize-guide · quantization-in-physics.

Videos page: verified YouTube IDs, privacy-enhanced embeds loaded on click, credits and "Watch on YouTube" link.

---

## Phase 7 — Conversion sections

- **Lead generation (`/get-optimized`):** promise-first headline; "your plan includes" list; inline savings estimator; 3-step form (goal cards + model + current format → hardware, runtime, spend band, timeline, context, concurrency → name, work email, company, role, notes, consent, optional newsletter); hidden fields for estimator output and pre-fill from the VRAM calculator; "what happens next" sequence; clearly labelled illustrative example plan; email-gated cheat sheet as a secondary magnet; FAQ handling cost, data access, vendor neutrality, confidentiality.
- **Donations/support (`/support`):** planned allocation bar (30% operations, 30% hiring talent, 20% contests and prizes, 20% promotion); four tiers ($5/$25/$100/$500 monthly); pledge form (amount chips, other amount, frequency, where to direct it, recognition, message) → secure payment link by email; not tax-deductible notice; other ways to help.
- **Contest (`/challenge`):** Season 1 "Fit in 8 GB" — memory gate + quality score vs BF16, tie-breakers, timeline with countdown, prize split (50/25/15/10 of a sponsor-funded pool published before submissions open), rules summary + full rules (no purchase necessary, eligibility, originality, reproducibility, verification, IP, skill-based contest, local registration where required), registration form, sponsor-a-prize form, propose-a-challenge form.
- **Hiring (`/careers`):** six remote roles; 2-step application (role, skills chips, experience, time zone, availability, rate → contact, links, best work, consent); employer "post a role" route.
- **Advertising (`/advertise`):** audience description without inflated numbers, placements table, standards, booking form, owner contact for acquisition/partnership.

---

## Phase 8 — SEO and AdSense readiness checklist

- Unique title (≤ 62 chars) and meta description (140–158 chars) per page; canonical URLs; Open Graph image (1200×630); favicon set and web manifest.
- `sitemap.xml`, HTML sitemap, `robots.txt` allowing all and `Mediapartners-Google`.
- About (with editorial policy), Contact, Privacy (Google cookie disclosures, opt-out links, processors, rights), Cookies, Terms, Disclaimer, Trademark pages linked from every footer.
- No placeholder or "coming soon" pages; every link resolves; 404 page has no ads and `noindex`.
- Ads only via Auto ads; never encourage clicks; keep pages fast (no heavy frameworks, lazy video facades).

---

## Phase 9 — QA

- Build, then crawl every page: zero broken internal links, AdSense loader present on every content page, owner bar on every page, owner email string absent from every published file and from the repository.
- Headless browser screenshots at 1360 px and 390 px, light and dark; zero console errors; all tools respond to input.
- Fact-check pass on every number in tools and guides against the cited sources.

---

## Phase 10 — Deploy (GitHub Pages, free plan)

1. Push to `WEBWORKSA1/quantization-com` (public repository). The site is prebuilt static HTML, so GitHub Pages serves it directly with no build step.
2. Settings → Pages → Source: *Deploy from a branch*, Branch: `main` (or `gh-pages`), folder `/ (root)`. The site goes live at `https://webworksa1.github.io/quantization-com/`; all internal links are relative, so it works at that address too.
3. Custom domain: point DNS first, then connect it. At the registrar: `A` records for `@` → 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153 (optional `AAAA` 2606:50c0:8000::153 … 2606:50c0:8003::153) and `CNAME` `www` → `webworksa1.github.io`. Then Settings → Pages → Custom domain: `quantization.com` (GitHub writes the `CNAME` file) and tick **Enforce HTTPS** once the certificate is issued. Adding the domain before DNS points to GitHub would redirect visitors to whatever the domain currently shows.
4. Submit one form yourself and click FormSubmit's one-time activation email so submissions start arriving.
5. Add the site in AdSense, confirm `ads.txt` is found at `https://quantization.com/ads.txt`, request review. Add Google Search Console and submit the sitemap.

---

## Phase 11 — After launch (first 90 days)

- Publish two dated guide updates per week; add model presets as new open-weight models ship.
- Add a measured benchmark table (quality vs size) for 3–5 popular models using reproducible scripts — the strongest originality signal for AdSense and search.
- Open challenge submissions on 1 December 2026 with the published prize pool.
- After 30 days of analytics, publish sponsorship rates and line up the first tool sponsor.
- Expand: Hugging Face config auto-import in the VRAM calculator, quant-name decoder, method-picker wizard, model directory pages.

To rebuild the HTML after editing sources: `python3 _build/build.py`.
