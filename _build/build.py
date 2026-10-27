#!/usr/bin/env python3
"""Quantization.com static site builder.

Sources:  _build/pages/**.html  (fragments with a small front-matter header)
          _build/data/*.json     (formats atlas)
Output:   repository root (plain HTML that GitHub Pages serves as-is)

Run:  python3 _build/build.py
"""
import html
import json
import os
import re
import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "_build" / "pages"
DATA = ROOT / "_build" / "data"
DOMAIN = "https://quantization.com"
SITE = "Quantization.com"
TODAY = datetime.date.today().isoformat()
ADSENSE = "ca-pub-6620975821265271"
OWNER_URL = "https://web.works/contact"
# The 404 page is served at any missing path, so its relative links need a <base> pointing at the site root
# (custom domain: "/", GitHub project URL: "/quantization-com/").
BASE404 = "<script>document.write('<base href=\"'+(location.hostname.slice(-10)==='github.io'?'/quantization-com/':'/')+'\">')</script>\n"

# --------------------------------------------------------------------------------------
# Navigation
# --------------------------------------------------------------------------------------
NAV = [
    ("index.html", "Home"),
    ("tools/index.html", "Tools"),
    ("learn/index.html", "Learn"),
    ("formats.html", "Formats"),
    ("videos.html", "Videos"),
    ("resources.html", "Resources"),
    ("challenge.html", "Challenge"),
    ("support.html", "Support"),
]

TRACKS = {
    "ai": "AI models",
    "signal": "Signals & audio",
    "music": "Music timing",
    "physics": "Physics",
    "general": "Foundations",
}

TOOLS = [
    {"slug": "vram-calculator", "name": "LLM VRAM calculator", "desc": "Weights, KV cache and overhead for any model, quant and context length — with a fit check across 20 GPUs and Macs.", "out": "GB needed · fit verdict · format comparison", "glyph": "mem"},
    {"slug": "quantization-playground", "name": "Quantization playground", "desc": "Quantize a signal or a weight distribution to 1–16 bits and watch the error, histogram and SQNR change live.", "out": "MSE · SQNR · levels used", "glyph": "wave"},
    {"slug": "adc-calculator", "name": "ADC and bit-depth calculator", "desc": "LSB size, ideal SNR, ENOB from measured SINAD, oversampling gain and audio file size in one panel.", "out": "LSB · SQNR · ENOB · MB", "glyph": "adc"},
    {"slug": "music-quantizer", "name": "MIDI quantize and swing lab", "desc": "Play a loose drum loop, then quantize it with strength and swing and hear the difference in the browser.", "out": "Offsets in ms · audio A/B", "glyph": "grid"},
    {"slug": "energy-levels", "name": "Energy levels calculator", "desc": "Hydrogen transitions with photon wavelength and colour, plus particle-in-a-box energies.", "out": "eV · nm · THz", "glyph": "atom"},
]

GLYPHS = {
    "mem": '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="7" width="20" height="14" rx="2" stroke="var(--signal)"/><path d="M8 11v6M12 11v6M16 11v6M20 11v6" stroke="var(--step)"/><path d="M7 21v3M21 21v3M7 4v3M21 4v3" stroke="var(--ink-3)"/></svg>',
    "wave": '<svg viewBox="0 0 28 28" fill="none" stroke-width="1.8"><path d="M2 16c3-9 6-9 9 0s6 9 9 0 4-7 6-4" stroke="var(--signal)"/><path d="M2 18h3v-5h3v-4h3v7h3v5h3v-3h3v-8h3v4h3" stroke="var(--step)"/></svg>',
    "adc": '<svg viewBox="0 0 28 28" fill="none" stroke-width="1.8"><path d="M3 22L25 6" stroke="var(--signal)"/><path d="M3 22h4v-3h4v-3h4v-3h4v-3h4v-3h2" stroke="var(--step)"/></svg>',
    "grid": '<svg viewBox="0 0 28 28" fill="none" stroke-width="1.6"><path d="M4 4v20M10 4v20M16 4v20M22 4v20" stroke="var(--rule-2)"/><rect x="4" y="7" width="5" height="3" fill="var(--step)" stroke="none"/><rect x="11" y="13" width="5" height="3" fill="var(--signal)" stroke="none"/><rect x="16" y="18" width="5" height="3" fill="var(--step)" stroke="none"/></svg>',
    "atom": '<svg viewBox="0 0 28 28" fill="none" stroke-width="1.8"><path d="M4 23h20M4 17h20M4 13h20M4 11h20" stroke="var(--ink-3)"/><path d="M14 11v12" stroke="var(--error)"/><path d="M11 20l3 3 3-3" stroke="var(--error)"/></svg>',
}

# --------------------------------------------------------------------------------------
# Curated YouTube videos (IDs verified via search results, Oct 2026)
# --------------------------------------------------------------------------------------
VIDEOS = [
    ("K75j8MkwgJ0", "Optimize your AI: quantization explained", "Matt Williams", "ai", "A friendly walkthrough of why quantized models run on ordinary hardware and what the Q-numbers mean."),
    ("0VdNflU08yA", "Quantization explained with PyTorch: PTQ and QAT", "Umar Jamil", "ai", "Long-form lecture that builds symmetric and asymmetric quantization from scratch, then shows post-training quantization and quantization-aware training."),
    ("qoQJq5UwV1c", "How LLMs survive in low precision", "Julia Turc", "ai", "Number formats and quantization fundamentals for large language models, with clear visuals."),
    ("kw7S-3s50uk", "Deep dive: quantizing large language models, part 1", "Julien Simon", "ai", "Survey of the main LLM quantization techniques and the trade-offs between them."),
    ("fXBBwCIA0Ds", "Deep dive: quantizing large language models, part 2", "Julien Simon", "ai", "Continues with hands-on examples of popular quantization methods."),
    ("TSc_BibWRhM", "EfficientML.ai lecture 5: quantization (part I)", "MIT HAN Lab", "ai", "University lecture from MIT 6.5940 covering numeric data types and linear quantization."),
    ("TPcXVJ1VSRI", "Understanding 4-bit quantization: QLoRA explained", "Discover AI", "ai", "How 4-bit NormalFloat and double quantization make fine-tuning possible on a single GPU."),
    ("Bi93r3gStOw", "LLM quantization explained: INT4, INT8, FP8 and NVFP4", "YouTube", "ai", "Compares integer and low-precision floating-point formats used for modern inference."),
    ("c3MT2qV5f9w", "Deep dive on PyTorch quantization", "PyTorch", "ai", "Conference talk on eager-mode quantization workflows in PyTorch."),
    ("Q1oBXdizXwI", "Inside TensorFlow: quantization-aware training", "TensorFlow", "ai", "The TensorFlow team explains how fake-quantization nodes are trained into a model."),
    ("j7DTlHNu5qs", "Quantization part 4: bit depth", "YouTube", "signal", "What each extra bit buys you in resolution and noise."),
    ("_cRFBBnUFug", "Quantization part 6: quantization noise demo", "YouTube", "signal", "Hear quantization noise as bit depth drops."),
    ("zC5KFnSUPNo", "Sampling rate and bit depth explained", "Music Technology 101", "signal", "Sample rate versus bit depth for audio, with practical recording advice."),
    ("Y09DuqDXVz0", "Dither explained (with sound examples)", "YouTube", "signal", "Audio examples of truncation distortion and how dither removes it."),
    ("U2mwXiJqAgA", "Dithering explained 1/2: quantization noise", "Music Technology 101", "signal", "Why low-level signals turn into distortion without dither."),
    ("KkZkjzEYOI0", "Intro to noise-shaping ADCs", "YouTube", "signal", "Delta-sigma modulators and noise shaping from first principles."),
    ("q9ctxOALtA8", "How to quantize your MIDI recordings", "YouTube", "music", "Grid, strength and swing applied to real MIDI parts."),
    ("txaMR0PTfEw", "How to quantize in Ableton", "YouTube", "music", "Quantize settings and real-time quantizing in a popular DAW."),
    ("rDniqRoM7Z0", "MIDI quantization (time correction)", "YouTube", "music", "Time quantize options walk-through for Logic users."),
    ("tPzJ9RYDWQY", "How to quantize MIDI in REAPER and most DAWs", "YouTube", "music", "The quantize concepts that carry across every DAW."),
    ("bChNhy1prD4", "Quantum 101 episode 2: quantization explained", "YouTube", "physics", "Why energy comes in discrete packets."),
    ("_-oPDWE5iCc", "Bohr model: quantized energy states", "Michel van Biezen", "physics", "Worked derivation of hydrogen's energy levels."),
    ("VLc20TF9jZw", "Quantized energy and photons", "Chemistry tutorial", "physics", "Planck's relation and photon energy problems step by step."),
    ("SsmygUIy2Tg", "Particle in a box explained", "YouTube", "physics", "Standing waves and quantized energies for a confined particle."),
]

RESOURCES = {
    "Foundational papers": [
        ("GPTQ: accurate post-training quantization for generative pre-trained transformers", "https://arxiv.org/abs/2210.17323", "Second-order, layer-wise weight quantization to 3–4 bits."),
        ("AWQ: activation-aware weight quantization", "https://arxiv.org/abs/2306.00978", "Protects salient channels found from activation statistics."),
        ("LLM.int8(): 8-bit matrix multiplication for transformers at scale", "https://arxiv.org/abs/2208.07339", "Mixed-precision decomposition that isolates outlier features."),
        ("QLoRA: efficient finetuning of quantized LLMs", "https://arxiv.org/abs/2305.14314", "4-bit NormalFloat, double quantization and paged optimizers."),
        ("SmoothQuant: accurate and efficient post-training quantization", "https://arxiv.org/abs/2211.10438", "Migrates activation outliers into weights to enable W8A8."),
        ("The era of 1-bit LLMs: all large language models are in 1.58 bits", "https://arxiv.org/abs/2402.17764", "Ternary-weight models trained from scratch (BitNet b1.58)."),
        ("A survey of quantization methods for efficient neural network inference", "https://arxiv.org/abs/2103.13630", "Broad survey of uniform, non-uniform, PTQ and QAT methods."),
        ("Quantizing deep convolutional networks for efficient inference: a whitepaper", "https://arxiv.org/abs/1806.08342", "Classic practical guide to integer quantization and QAT."),
        ("Neural network quantization for efficient inference: a survey", "https://arxiv.org/abs/2112.06126", "Survey covering granularity, calibration and hardware."),
    ],
    "Libraries and runtimes": [
        ("llama.cpp", "https://github.com/ggml-org/llama.cpp", "C/C++ inference engine and home of the GGUF format and quantize tool."),
        ("bitsandbytes", "https://github.com/bitsandbytes-foundation/bitsandbytes", "8-bit and 4-bit quantization used across the Hugging Face stack."),
        ("Hugging Face Transformers quantization docs", "https://huggingface.co/docs/transformers/main/en/quantization/overview", "Overview and support matrix for every integrated method."),
        ("vLLM quantization docs", "https://docs.vllm.ai/en/latest/features/quantization/", "Which quantized formats the vLLM server supports, by hardware."),
        ("LLM Compressor", "https://github.com/vllm-project/llm-compressor", "Library for producing GPTQ, AWQ, FP8 and other compressed checkpoints for vLLM."),
        ("PyTorch torchao", "https://github.com/pytorch/ao", "PyTorch-native quantization and sparsity for training and inference."),
        ("NVIDIA Model Optimizer", "https://github.com/NVIDIA/TensorRT-Model-Optimizer", "PTQ, QAT, FP8 and NVFP4 tooling for NVIDIA deployment stacks."),
        ("ONNX Runtime quantization", "https://onnxruntime.ai/docs/performance/model-optimizations/quantization.html", "Static and dynamic INT8 quantization for ONNX models."),
        ("Intel Neural Compressor", "https://github.com/intel/neural-compressor", "Quantization and compression toolkit for Intel hardware and beyond."),
        ("Apple MLX", "https://github.com/ml-explore/mlx", "Array framework for Apple silicon with built-in quantized model support."),
        ("Ollama", "https://ollama.com", "Runs GGUF models locally with a simple CLI and API."),
    ],
    "Courses and long reads": [
        ("MIT 6.5940 EfficientML.ai", "https://efficientml.ai", "University course on efficient deep learning, with full lecture videos."),
        ("DeepLearning.AI short courses", "https://www.deeplearning.ai/short-courses/", "Free short courses, including quantization fundamentals and in-depth tracks."),
        ("A visual guide to quantization", "https://newsletter.maartengrootendorst.com/p/a-visual-guide-to-quantization", "Diagram-heavy explainer of LLM quantization concepts."),
        ("Hugging Face Optimum: quantization concept guide", "https://huggingface.co/docs/optimum/concept_guides/quantization", "Affine quantization maths, calibration and granularity."),
    ],
    "Signals, audio and physics": [
        ("Analog Devices MT-001: the SNR = 6.02N + 1.76 dB formula", "https://www.analog.com/media/en/training-seminars/tutorials/MT-001.pdf", "Derivation and limits of the ideal quantization-noise formula."),
        ("The Scientist and Engineer's Guide to DSP, chapter 3", "https://www.dspguide.com/ch3.htm", "ADC and DAC: quantization, dither and sampling."),
        ("TI Precision Labs: ADCs", "https://www.ti.com/precisionlabs", "Free video training series on converter specs and noise."),
        ("PhET: models of the hydrogen atom", "https://phet.colorado.edu/en/simulations/models-of-the-hydrogen-atom", "Interactive simulation of atomic models and spectra."),
        ("NIST CODATA fundamental constants", "https://physics.nist.gov/cuu/Constants/", "Authoritative values for h, e, m_e and the Rydberg constant."),
    ],
}

# --------------------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------------------
def esc(s):
    return html.escape(str(s), quote=True)


def read_fragment(path):
    raw = path.read_text(encoding="utf-8")
    meta = {}
    body = raw
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n", raw, re.S)
    if m:
        for line in m.group(1).splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip()
        body = raw[m.end():]
    return meta, body


def rel_prefix(out_rel):
    depth = out_rel.count("/")
    return "../" * depth


def logo_svg():
    return ('<svg viewBox="0 0 32 32" aria-hidden="true"><rect x=".5" y=".5" width="31" height="31" rx="8" fill="#121A2E" stroke="var(--rule-2)"/>'
            '<path d="M5 20c3-11 7-11 11 0s7 11 11 0" fill="none" stroke="var(--signal)" stroke-width="2" opacity=".9"/>'
            '<path d="M5 22h4v-6h4v-5h6v5h4v6h4" fill="none" stroke="var(--step)" stroke-width="2.4" stroke-linejoin="round"/></svg>')


CTA_LEAD = """<div class="cta-box lead"><div><h3>Want this done for your model?</h3><p>Tell us your model, hardware and target. We send back a free optimization plan: recommended format, expected memory and a quality-check method.</p></div><a class="btn btn-primary" href="{root}get-optimized.html">Get the free plan</a></div>"""

CTA_NEWS = """<div class="cta-box"><div><h3>One clear explainer a week</h3><p>New tools, guides and formats across AI, signals, audio and physics. No spam; unsubscribe any time.</p></div>
<form class="js-form inline-form" data-subject="Newsletter signup" data-ok="You're subscribed. The next issue lands next week."><input type="email" name="email" required placeholder="you@example.com" aria-label="Email address"><input class="hp" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true"><input type="hidden" name="list" value="Weekly explainer"><button class="btn btn-primary" type="submit">Subscribe</button><div class="form-msg" role="status"></div></form></div>"""


def cta_tool(slug, root):
    t = next((x for x in TOOLS if x["slug"] == slug), TOOLS[0])
    return (f'<div class="cta-box"><div><h3>Try it: {esc(t["name"])}</h3><p>{esc(t["desc"])}</p></div>'
            f'<a class="btn btn-ghost" href="{root}tools/{t["slug"]}.html">Open the tool</a></div>')


def apply_ctas(body, root):
    body = body.replace('<div data-cta="lead"></div>', CTA_LEAD.format(root=root))
    body = body.replace('<div data-cta="newsletter"></div>', CTA_NEWS)
    body = re.sub(r'<div data-cta="tool" data-tool="([a-z0-9-]+)"></div>', lambda m: cta_tool(m.group(1), root), body)
    return body


def jsonld(obj):
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False, separators=(",", ":")) + "</script>"


def faq_schema(body):
    faq = re.search(r'<section class="faq">(.*?)</section>', body, re.S)
    if not faq:
        return None
    items = re.findall(r"<details>\s*<summary>(.*?)</summary>(.*?)</details>", faq.group(1), re.S)
    if not items:
        return None
    def strip(s):
        return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", s)).strip()
    return {"@context": "https://schema.org", "@type": "FAQPage",
            "mainEntity": [{"@type": "Question", "name": html.unescape(strip(q)),
                            "acceptedAnswer": {"@type": "Answer", "text": html.unescape(strip(a))}} for q, a in items]}


def breadcrumb_schema(trail):
    return {"@context": "https://schema.org", "@type": "BreadcrumbList",
            "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": DOMAIN + "/" + u.replace("index.html", "")}
                                for i, (u, n) in enumerate(trail)]}


def crumbs_html(trail, root):
    parts = []
    for i, (u, n) in enumerate(trail):
        if i == len(trail) - 1:
            parts.append(f'<span aria-current="page">{esc(n)}</span>')
        else:
            parts.append(f'<a href="{root}{u}">{esc(n)}</a>')
    return '<nav class="crumbs wrap" aria-label="Breadcrumb">' + ' <span aria-hidden="true">/</span> '.join(parts) + "</nav>"


# --------------------------------------------------------------------------------------
# Layout
# --------------------------------------------------------------------------------------
def layout(out_rel, meta, main_html, extra_schema=None, extra_js=None):
    root = rel_prefix(out_rel)
    title = meta.get("title", SITE)
    desc = meta.get("description", "")
    canon_path = out_rel.replace("index.html", "")
    canon = DOMAIN + "/" + canon_path
    robots = meta.get("robots", "index,follow,max-image-preview:large")
    schemas = [{"@context": "https://schema.org", "@type": "Organization", "name": SITE, "url": DOMAIN + "/",
                "logo": DOMAIN + "/assets/img/icon.svg"}]
    if extra_schema:
        schemas.extend([s for s in extra_schema if s])

    nav_items = []
    for href, label in NAV:
        active = ""
        sect = href.split("/")[0] if "/" in href else None
        if out_rel == href or (sect and out_rel.startswith(sect + "/")) or (href == "learn/index.html" and out_rel == "glossary.html"):
            active = ' class="active" aria-current="page"'
        nav_items.append(f'<li><a href="{root}{href}"{active}>{label}</a></li>')
    js = "".join(f'<script src="{root}assets/js/{j}" defer></script>' for j in (extra_js or []))

    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
{BASE404 if out_rel == "404.html" else ""}<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{canon}">
<meta name="robots" content="{robots}">
<meta name="theme-color" content="#121A2E">
<meta property="og:type" content="{'article' if meta.get('_kind') == 'article' else 'website'}">
<meta property="og:site_name" content="{SITE}">
<meta property="og:title" content="{esc(meta.get('h1') or title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{canon}">
<meta property="og:image" content="{DOMAIN}/assets/img/og.svg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="{root}assets/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="{root}assets/img/icon.svg">
<link rel="manifest" href="{root}site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Instrument+Sans:wdth,wght@75..100,400..700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{root}assets/css/site.css">
<script>try{{var t=localStorage.getItem('qz-theme');if(t)document.documentElement.setAttribute('data-theme',t);if(localStorage.getItem('qz-consent')==='essential'){{(window.adsbygoogle=window.adsbygoogle||[]).requestNonPersonalizedAds=1}}}}catch(e){{}}</script>
{'' if meta.get('noads') else f'<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={ADSENSE}" crossorigin="anonymous"></script>'}
{''.join(jsonld(s) for s in schemas)}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="ownerbar" role="note"><a href="{OWNER_URL}" target="_blank" rel="noopener">Contact, if you are interested in this website/domain name/Sponsorship/Advertisement/Partnership</a></div>
<header class="site"><div class="wrap nav">
<a class="logo" href="{root}index.html" aria-label="Quantization.com home">{logo_svg()}<span>Quantization<span class="tld">.com</span></span></a>
<ul class="menu" id="menu">{''.join(nav_items)}</ul>
<div class="nav-cta"><a class="btn btn-primary btn-sm btn-head" href="{root}get-optimized.html">Free optimization plan</a>
<button class="icon-btn" id="themeBtn" type="button" aria-label="Switch light or dark theme"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><path d="M12 4v16" /><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg></button>
<button class="icon-btn burger" id="burger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="menu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button></div>
</div></header>
<main id="main">
{main_html}
</main>
<footer class="site"><div class="wrap">
<div class="foot-grid">
<div><a class="logo" href="{root}index.html">{logo_svg()}<span>Quantization<span class="tld">.com</span></span></a>
<p class="muted small" style="margin-top:12px;max-width:40ch">Calculators, visual explainers and format guides for representing models, signals and sound with fewer bits — and measuring what it costs.</p>
<form class="js-form inline-form" data-subject="Newsletter signup" data-ok="You're subscribed. The next issue lands next week." style="margin-top:14px">
<input type="email" name="email" required placeholder="you@example.com" aria-label="Email for the weekly newsletter"><input class="hp" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true"><input type="hidden" name="list" value="Weekly explainer"><button class="btn btn-primary btn-sm" type="submit">Subscribe</button><div class="form-msg" role="status"></div></form></div>
<div><h4>Tools</h4><ul>{''.join(f'<li><a href="{root}tools/{t["slug"]}.html">{esc(t["name"])}</a></li>' for t in TOOLS)}</ul></div>
<div><h4>Learn</h4><ul><li><a href="{root}learn/index.html">All guides</a></li><li><a href="{root}learn/llm-quantization-guide.html">LLM quantization guide</a></li><li><a href="{root}formats.html">Formats atlas</a></li><li><a href="{root}glossary.html">Glossary</a></li><li><a href="{root}cheat-sheet.html">Cheat sheet</a></li><li><a href="{root}videos.html">Videos</a></li><li><a href="{root}resources.html">Resources</a></li></ul></div>
<div><h4>Get involved</h4><ul><li><a href="{root}get-optimized.html">Free optimization plan</a></li><li><a href="{root}challenge.html">Quantization Challenge</a></li><li><a href="{root}support.html">Support the project</a></li><li><a href="{root}careers.html">Careers and talent</a></li><li><a href="{root}advertise.html">Advertise and sponsor</a></li></ul></div>
<div><h4>Company</h4><ul><li><a href="{root}about.html">About and editorial policy</a></li><li><a href="{root}contact.html">Contact</a></li><li><a href="{OWNER_URL}" target="_blank" rel="noopener">Buy, partner or sponsor</a></li><li><a href="{root}privacy.html">Privacy policy</a></li><li><a href="{root}terms.html">Terms of use</a></li><li><a href="{root}cookies.html">Cookie policy</a></li><li><a href="{root}disclaimer.html">Disclaimer</a></li><li><a href="{root}trademark.html">Trademark and copyright</a></li><li><a href="{root}sitemap.html">Sitemap</a></li></ul></div>
</div>
<div class="legal">
<p><b>Trademark and copyright disclosure.</b> “Quantization” is a generic scientific and engineering term. Quantization.com claims no exclusive rights in the word and is an independent educational publication, not affiliated with, endorsed by or sponsored by any company, project, product or person that uses the term. Product names, model names and logos mentioned on this site (for example llama.cpp, GGUF, PyTorch, TensorFlow, NVIDIA, Apple, Hugging Face) are trademarks of their respective owners and are used for identification only. <a href="{root}trademark.html">Read the full disclosure</a>.</p>
<p>Content is for general education and is not professional engineering, legal or financial advice. This site shows advertising served by Google AdSense. © <span class="year">2026</span> Quantization.com. Original text, tools, code and graphics © Quantization.com unless otherwise credited.</p>
</div></div></footer>
<div class="mcta"><a class="btn btn-ghost" href="{root}tools/vram-calculator.html">VRAM calculator</a><a class="btn btn-primary" href="{root}get-optimized.html">Free plan</a></div>
<div class="cookie" id="cookie" role="dialog" aria-label="Cookie choices"><p>We use essential browser storage for site settings and, with your consent, cookies from Google to personalise and measure ads. Choose “Essential only” to receive non-personalised ads. Details in our <a href="{root}cookies.html">cookie policy</a>.</p>
<div class="acts"><button class="btn btn-primary btn-sm" type="button" data-consent="all">Accept all</button><button class="btn btn-ghost btn-sm" type="button" data-consent="essential">Essential only</button></div></div>
<script src="{root}assets/js/site.js" defer></script>{js}
</body>
</html>
"""


# --------------------------------------------------------------------------------------
# Article template
# --------------------------------------------------------------------------------------
def build_toc(body):
    heads = re.findall(r'<h2 id="([^"]+)">(.*?)</h2>', body, re.S)
    if not heads:
        return ""
    items = "".join(f'<li><a href="#{hid}">{re.sub("<[^>]+>", "", t)}</a></li>' for hid, t in heads)
    return f'<nav class="toc" aria-label="On this page"><h2>On this page</h2><ol>{items}</ol></nav>'


def word_count(body):
    return len(re.sub(r"<[^>]+>", " ", body).split())


def render_article(out_rel, meta, body, articles):
    root = rel_prefix(out_rel)
    body = body.replace("{{root}}", root)
    body = apply_ctas(body, root)
    track = meta.get("track", "general")
    is_glossary = out_rel == "glossary.html"
    trail = [("index.html", "Home"), ("learn/index.html", "Learn"), (out_rel, meta.get("h1", ""))]
    toc = "" if is_glossary else build_toc(body)
    side_cta = (f'<div class="side-cta"><h3>Free optimization plan</h3><p>Send your model and hardware; get a recommended format and memory estimate back.</p><a class="btn btn-primary btn-sm" href="{root}get-optimized.html">Request the plan</a></div>'
                if track == "ai" else
                f'<div class="side-cta"><h3>Try the tools</h3><p>Every formula on this page has a live calculator.</p><a class="btn btn-ghost btn-sm" href="{root}tools/index.html">Open the tools</a></div>')
    if is_glossary:
        letters = re.findall(r'<h2 id="(letter-[a-z])">(.*?)</h2>', body)
        if letters:
            body = '<nav class="letters" aria-label="Jump to letter">' + "".join(f'<a href="#{i}">{t}</a>' for i, t in letters) + "</nav>" + body
    related = [a for a in articles if a["out"] != out_rel and a["track"] == track and a["out"] != "glossary.html"]
    related += [a for a in articles if a["out"] != out_rel and a not in related and a["out"] != "glossary.html"]
    related = related[:4]
    rel_html = "".join(f'<li><a href="{root}{a["out"]}"><span class="track track-{a["track"]}">{TRACKS.get(a["track"], "")}</span><h3>{esc(a["h1"])}</h3><p>{esc(a["summary"])}</p><span class="meta">{a["read"]} min</span></a></li>' for a in related)
    words = word_count(body)
    read = meta.get("read") or str(max(3, round(words / 230)))
    main = f"""{crumbs_html(trail, root)}
<article class="wrap">
<header class="art-head">
<span class="track track-{track}">{TRACKS.get(track, '')}</span>
<h1>{esc(meta.get('h1', ''))}</h1>
<div class="art-meta"><span>By the Quantization.com editorial team</span><span>Updated <time datetime="{TODAY}">{datetime.date.today().strftime('%B %-d, %Y')}</time></span><span>{read} min read</span></div>
</header>
<div class="art-layout">
<div class="prose">
{body}
<div class="byline"><div><b>About this guide.</b> Written and fact-checked by the Quantization.com editorial team against the primary sources listed above. Spotted an error or an outdated command? <a href="{root}contact.html?topic=Correction">Send a correction</a> — we fix verified issues within a few days. See our <a href="{root}about.html#editorial-policy">editorial policy</a>.</div></div>
<div class="share" aria-label="Share this page"><a class="btn btn-ghost btn-sm" data-share="copy" href="#">Copy link</a><a class="btn btn-ghost btn-sm" data-share="x" href="#">Post on X</a><a class="btn btn-ghost btn-sm" data-share="linkedin" href="#">LinkedIn</a><a class="btn btn-ghost btn-sm" data-share="reddit" href="#">Reddit</a><a class="btn btn-ghost btn-sm" data-share="hn" href="#">Hacker News</a></div>
</div>
<aside class="art-side">{toc}{side_cta}</aside>
</div>
<section class="related"><h2>Keep reading</h2><ul class="alist">{rel_html}</ul></section>
</article>"""
    schema = [{"@context": "https://schema.org", "@type": "TechArticle" if track == "ai" else "Article",
               "headline": meta.get("h1", ""), "description": meta.get("description", ""),
               "datePublished": TODAY, "dateModified": TODAY, "wordCount": words,
               "author": {"@type": "Organization", "name": "Quantization.com editorial team", "url": DOMAIN + "/about.html"},
               "publisher": {"@type": "Organization", "name": SITE, "logo": {"@type": "ImageObject", "url": DOMAIN + "/assets/img/icon.svg"}},
               "mainEntityOfPage": DOMAIN + "/" + out_rel, "image": DOMAIN + "/assets/img/og.svg"},
              breadcrumb_schema(trail), faq_schema(body)]
    meta = dict(meta, _kind="article")
    return layout(out_rel, meta, main, schema)


# --------------------------------------------------------------------------------------
# Generated pages
# --------------------------------------------------------------------------------------
def page_head(h1, sub, trail, root):
    return crumbs_html(trail, root) + f'<section class="page-head"><div class="wrap"><h1>{h1}</h1><p class="sub">{sub}</p></div></section>'


def render_learn_index(articles):
    out_rel = "learn/index.html"
    root = rel_prefix(out_rel)
    trail = [("index.html", "Home"), (out_rel, "Learn")]
    chips = '<button class="chip" type="button" data-filter="all" aria-pressed="true">All</button>' + "".join(
        f'<button class="chip" type="button" data-filter="{k}" aria-pressed="false">{v}</button>' for k, v in TRACKS.items())
    order = ["general", "ai", "signal", "music", "physics"]
    seq = ["what-is-quantization", "llm-quantization-guide", "gguf-quant-types", "gptq-vs-awq-vs-gguf", "number-formats", "ptq-vs-qat",
           "kv-cache-quantization", "hardware-for-local-llms", "quantize-a-model", "adc-quantization-error", "audio-bit-depth-dither",
           "music-quantize-guide", "quantization-in-physics"]
    def rank(a):
        slug = a["out"].split("/")[-1].replace(".html", "")
        return (order.index(a["track"]) if a["track"] in order else 9, seq.index(slug) if slug in seq else 99)
    arts = sorted([a for a in articles if a["out"] != "glossary.html"], key=rank)
    items = "".join(f'<li data-tags="{a["track"]}"><a href="{root}{a["out"]}"><span class="track track-{a["track"]}">{TRACKS.get(a["track"], "")}</span><h3>{esc(a["h1"])}</h3><p>{esc(a["summary"])}</p><span class="meta">{a["read"]} min</span></a></li>' for a in arts)
    main = page_head("Learn quantization, one field at a time",
                     "Practical guides with the formulas worked out. Start with the foundations, then follow the track you need: AI models, signals and audio, music timing or physics.",
                     trail, root) + f"""
<section class="section-tight"><div class="wrap">
<div class="atlas-tools"><input type="search" id="learnSearch" placeholder="Search guides" aria-label="Search guides"><div class="filters" data-filter-group="learnList" style="margin:0">{chips}</div></div>
<ul class="alist" id="learnList">{items}</ul>
<p class="muted small" style="margin-top:18px">Looking for a term? The <a href="{root}glossary.html">glossary</a> defines more than 80 of them. Prefer one page? Print the <a href="{root}cheat-sheet.html">quantization cheat sheet</a>.</p>
</div></section>"""
    meta = {"title": "Quantization Guides: AI, Audio, DSP, Physics | Quantization.com",
            "description": "Free in-depth guides to quantization: LLM formats like GGUF, GPTQ and AWQ, ADC noise and SQNR, audio bit depth and dither, MIDI quantize and energy levels."}
    return layout(out_rel, meta, main, [breadcrumb_schema(trail),
                                        {"@context": "https://schema.org", "@type": "CollectionPage", "name": "Learn quantization", "url": DOMAIN + "/learn/"}])


def render_videos():
    out_rel = "videos.html"
    root = ""
    trail = [("index.html", "Home"), (out_rel, "Videos")]
    chips = '<button class="chip" type="button" data-filter="all" aria-pressed="true">All</button>' + "".join(
        f'<button class="chip" type="button" data-filter="{k}" aria-pressed="false">{v}</button>' for k, v in TRACKS.items() if k != "general")
    cards = "".join(f"""<div class="vcard" data-tags="{tr}"><div class="video" data-yt="{vid}" data-title="{esc(t)}"></div><span class="track track-{tr}">{TRACKS[tr]}</span><h3>{esc(t)}</h3><p class="muted small" style="margin:0">{esc(d)}</p><span class="src">{(esc(ch) + " · ") if ch != "YouTube" else ""}<a href="https://www.youtube.com/watch?v={vid}" target="_blank" rel="noopener">Watch on YouTube</a></span></div>""" for vid, t, ch, tr, d in VIDEOS)
    main = page_head("Watch: the best quantization explainers",
                     f"{len(VIDEOS)} hand-picked videos from educators and engineering teams, grouped by field. Each one loads only when you press play, so the page stays fast.",
                     trail, root) + f"""
<section class="section-tight"><div class="wrap">
<div class="filters" data-filter-group="videoGrid">{chips}</div>
<div class="grid g3" id="videoGrid">{cards}</div>
<p class="muted small" style="margin-top:26px">Videos are embedded from YouTube in privacy-enhanced mode and remain the property of their creators. Inclusion is editorial and does not imply endorsement in either direction. Made a great explainer? <a href="contact.html?topic=Video%20suggestion">Suggest it</a>.</p>
</div></section>
<section class="section-tight"><div class="wrap">{CTA_NEWS}</div></section>"""
    meta = {"title": "Quantization Videos: LLMs, Audio, MIDI, Physics | Quantization.com",
            "description": "Curated video explainers on quantization: LLM formats and QLoRA, PTQ vs QAT, ADC quantization noise, dither, MIDI quantize and quantized energy levels."}
    vids = {"@context": "https://schema.org", "@type": "ItemList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "url": f"https://www.youtube.com/watch?v={v[0]}", "name": v[1]} for i, v in enumerate(VIDEOS)]}
    return layout(out_rel, meta, main, [breadcrumb_schema(trail), vids])


def render_resources():
    out_rel = "resources.html"
    root = ""
    trail = [("index.html", "Home"), (out_rel, "Resources")]
    secs = ""
    for title, items in RESOURCES.items():
        lis = "".join(f'<li><a href="{u}" target="_blank" rel="noopener"><span class="track track-general">{esc(u.split("/")[2])}</span><h3>{esc(n)}</h3><p>{esc(d)}</p></a></li>' for n, u, d in items)
        secs += f'<section class="section-tight"><div class="wrap"><div class="section-head"><h2>{esc(title)}</h2></div><ul class="alist">{lis}</ul></div></section>'
    main = page_head("Quantization resources worth your time",
                     "Primary sources first: the papers that introduced each method, the libraries that implement them, and courses that teach the maths properly.",
                     trail, root) + secs + f'<section class="section-tight"><div class="wrap">{CTA_LEAD.format(root=root)}</div></section>'
    meta = {"title": "Quantization Resources: Papers, Libraries and Courses | Quantization.com",
            "description": "Curated quantization resources: GPTQ, AWQ, QLoRA and SmoothQuant papers, llama.cpp, bitsandbytes, vLLM and torchao, plus courses and DSP references."}
    return layout(out_rel, meta, main, [breadcrumb_schema(trail)])


def render_formats():
    out_rel = "formats.html"
    root = ""
    trail = [("index.html", "Home"), (out_rel, "Formats atlas")]
    fp = DATA / "formats.json"
    data = json.loads(fp.read_text(encoding="utf-8")) if fp.exists() else []
    fams = sorted({d.get("family", "") for d in data})
    rows = ""
    for d in data:
        bpw = d.get("bpw")
        bpw_txt = f"{bpw:g}" if isinstance(bpw, (int, float)) else "varies"
        width = int(min(100, (bpw or 0) / 16 * 100)) if isinstance(bpw, (int, float)) else 0
        src = d.get("source") or {}
        src_html = f'<a href="{esc(src.get("url"))}" target="_blank" rel="noopener">{esc(src.get("title", "Source"))}</a>' if src.get("url") else "—"
        rows += (f'<tr data-family="{esc(d.get("family", ""))}" data-bpw="{bpw if isinstance(bpw, (int, float)) else 99}" data-text="{esc((d.get("name", "") + " " + d.get("family", "") + " " + " ".join(d.get("runtimes", [])) + " " + " ".join(d.get("hardware", []))).lower())}">'
                 f'<td><b>{esc(d.get("name", ""))}</b><br><small>{esc(d.get("family", ""))}</small></td>'
                 f'<td class="n" style="white-space:nowrap"><span class="bpw-bar" style="width:{width * 0.6:.0f}px"></span>{bpw_txt}</td>'
                 f'<td>{esc(d.get("type", ""))}<br><small>Calibration: {esc(d.get("calibration", "—"))}</small></td>'
                 f'<td>{esc(", ".join(d.get("hardware", [])) or "—")}<br><small>{esc(", ".join(d.get("runtimes", [])) or "—")}</small></td>'
                 f'<td>{esc(d.get("how", ""))}<br><small><b>Best for:</b> {esc(d.get("best_for", ""))}</small><br><small><b>Bits:</b> {esc(d.get("bpw_note", ""))}</small></td>'
                 f'<td>{src_html}</td></tr>')
    opts = "".join(f'<option value="{esc(f)}">{esc(f)}</option>' for f in fams)
    main = page_head("The quantization formats atlas",
                     f"{len(data)} formats and methods in one sortable table: effective bits per weight, what needs calibration, where each one runs and the primary source behind it.",
                     trail, root) + f"""
<section class="section-tight"><div class="wrap">
<div class="atlas-tools">
<input type="search" id="atlasSearch" placeholder="Filter: e.g. Apple, vLLM, 4-bit" aria-label="Filter formats">
<select id="atlasFamily" aria-label="Family" style="max-width:240px"><option value="">All families</option>{opts}</select>
<div class="seg" role="group" aria-label="Sort"><button type="button" data-sort="bpw" aria-pressed="false">Sort by bits</button><button type="button" data-sort="name" aria-pressed="false">Sort by name</button></div>
<span class="muted small" id="atlasCount"></span>
</div>
<div class="table-wrap atlas"><table id="atlas"><thead><tr><th>Format</th><th class="n">Bits / weight</th><th>Type</th><th>Hardware and runtimes</th><th>How it works</th><th>Source</th></tr></thead><tbody>{rows}</tbody></table></div>
<p class="tool-note">Bits per weight are approximate effective values including scales and, for GGUF k-quants, the higher-precision tensors the mix keeps. Real file sizes vary by architecture. Plug any value into the <a href="tools/vram-calculator.html">VRAM calculator</a> to size a model.</p>
</div></section>
<section class="section-tight"><div class="wrap">{CTA_LEAD.format(root=root)}</div></section>"""
    meta = {"title": "Quantization Formats Atlas: GGUF, GPTQ, AWQ, FP8, NVFP4 | Quantization.com",
            "description": "Compare 32 LLM quantization formats side by side: bits per weight, calibration, hardware, runtimes and primary sources for GGUF, GPTQ, AWQ, FP8, MXFP4 and more."}
    ds = {"@context": "https://schema.org", "@type": "Dataset", "name": "Quantization formats atlas", "description": meta["description"],
          "url": DOMAIN + "/formats.html", "creator": {"@type": "Organization", "name": SITE}, "license": DOMAIN + "/terms.html"}
    return layout(out_rel, meta, main, [breadcrumb_schema(trail), ds], ["atlas.js"])


def render_sitemap_page(pages):
    out_rel = "sitemap.html"
    trail = [("index.html", "Home"), (out_rel, "Sitemap")]
    groups = {}
    for p in pages:
        if p["out"] in ("404.html",):
            continue
        g = p["out"].split("/")[0] if "/" in p["out"] else "Site"
        groups.setdefault({"learn": "Learn", "tools": "Tools"}.get(g, "Site"), []).append(p)
    secs = ""
    for g in ["Site", "Tools", "Learn"]:
        lis = "".join(f'<li><a href="{p["out"]}">{esc(p["label"])}</a></li>' for p in sorted(groups.get(g, []), key=lambda x: x["label"]))
        secs += f'<div><h2 style="font-size:1.2rem">{g}</h2><ul>{lis}</ul></div>'
    main = page_head("Sitemap", "Every page on Quantization.com.", trail, "") + f'<section class="section-tight"><div class="wrap grid g3">{secs}</div></section>'
    return layout(out_rel, {"title": "Sitemap | Quantization.com", "description": "A complete list of pages on Quantization.com: tools, guides, formats, videos, resources and site policies."}, main, [breadcrumb_schema(trail)])


# --------------------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------------------
def main():
    outputs = {}
    articles = []
    fragments = sorted(SRC.rglob("*.html"))
    # first pass: collect article metadata
    for f in fragments:
        rel = f.relative_to(SRC).as_posix()
        meta, body = read_fragment(f)
        if rel.startswith("learn/"):
            out_rel = "glossary.html" if rel == "learn/glossary.html" else rel
            words = word_count(body)
            articles.append({"out": out_rel, "h1": meta.get("h1", ""), "summary": meta.get("summary", meta.get("description", "")),
                             "track": meta.get("track", "general"), "read": meta.get("read") or str(max(3, round(words / 230))), "src": f})
    pages = []
    for f in fragments:
        rel = f.relative_to(SRC).as_posix()
        meta, body = read_fragment(f)
        if rel.startswith("learn/"):
            out_rel = "glossary.html" if rel == "learn/glossary.html" else rel
            outputs[out_rel] = render_article(out_rel, meta, body, articles)
            pages.append({"out": out_rel, "label": meta.get("h1", out_rel), "prio": "0.8"})
        else:
            out_rel = rel
            root = rel_prefix(out_rel)
            body = body.replace("{{root}}", root)
            body = apply_ctas(body, root)
            # generic page replacements
            body = body.replace("{{tool_rows}}", "".join(
                f'<a class="rack-row" href="{root}tools/{t["slug"]}.html"><span class="glyph">{GLYPHS[t["glyph"]]}</span><div><h3>{esc(t["name"])}</h3><p>{esc(t["desc"])}</p></div><span class="out">{esc(t["out"])}</span><span class="go">Open</span></a>' for t in TOOLS))
            body = body.replace("{{featured_articles}}", "".join(
                f'<li><a href="{root}{a["out"]}"><span class="track track-{a["track"]}">{TRACKS.get(a["track"], "")}</span><h3>{esc(a["h1"])}</h3><p>{esc(a["summary"])}</p><span class="meta">{a["read"]} min</span></a></li>'
                for a in [x for x in articles if x["out"] in ("learn/llm-quantization-guide.html", "learn/gguf-quant-types.html", "learn/what-is-quantization.html", "learn/kv-cache-quantization.html", "learn/adc-quantization-error.html", "learn/music-quantize-guide.html")]))
            body = body.replace("{{home_videos}}", "".join(
                f'<div class="vcard"><div class="video" data-yt="{v[0]}" data-title="{esc(v[1])}"></div><h3>{esc(v[1])}</h3><span class="src">{esc(v[2]) if v[2] != "YouTube" else "On YouTube"}</span></div>' for v in [VIDEOS[0], VIDEOS[2], VIDEOS[11]]))
            trail = None
            extra = []
            if meta.get("crumb"):
                parts = [("index.html", "Home")]
                if out_rel.startswith("tools/") and out_rel != "tools/index.html":
                    parts.append(("tools/index.html", "Tools"))
                parts.append((out_rel, meta["crumb"]))
                trail = parts
                body = crumbs_html(trail, root) + body
                extra.append(breadcrumb_schema(trail))
            if meta.get("schema") == "webapp":
                extra.append({"@context": "https://schema.org", "@type": "WebApplication", "name": meta.get("crumb", ""), "url": DOMAIN + "/" + out_rel,
                              "applicationCategory": "EducationalApplication", "operatingSystem": "Any (web browser)",
                              "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"}, "description": meta.get("description", "")})
            if out_rel == "index.html":
                extra.append({"@context": "https://schema.org", "@type": "WebSite", "name": SITE, "url": DOMAIN + "/"})
            fs = faq_schema(body)
            if fs:
                extra.append(fs)
            js = [j.strip() for j in meta.get("js", "").split(",") if j.strip()]
            outputs[out_rel] = layout(out_rel, meta, body, extra, js)
            if out_rel != "404.html":
                pages.append({"out": out_rel, "label": meta.get("crumb") or meta.get("h1") or meta.get("title", out_rel).split("|")[0].strip(), "prio": "1.0" if out_rel == "index.html" else "0.7"})
    outputs["learn/index.html"] = render_learn_index(articles)
    pages.append({"out": "learn/index.html", "label": "Learn: all guides", "prio": "0.9"})
    outputs["videos.html"] = render_videos(); pages.append({"out": "videos.html", "label": "Videos", "prio": "0.7"})
    outputs["resources.html"] = render_resources(); pages.append({"out": "resources.html", "label": "Resources", "prio": "0.6"})
    outputs["formats.html"] = render_formats(); pages.append({"out": "formats.html", "label": "Formats atlas", "prio": "0.9"})
    pages.append({"out": "sitemap.html", "label": "Sitemap", "prio": "0.3"})
    outputs["sitemap.html"] = render_sitemap_page(pages)

    for out_rel, content in outputs.items():
        p = ROOT / out_rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content, encoding="utf-8")

    # sitemap.xml
    urls = "".join(f"<url><loc>{DOMAIN}/{p['out'].replace('index.html', '')}</loc><lastmod>{TODAY}</lastmod><priority>{p['prio']}</priority></url>" for p in sorted(pages, key=lambda x: x["out"]))
    (ROOT / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>\n', encoding="utf-8")
    print(f"Built {len(outputs)} pages ({len(articles)} learn pages). Sitemap: {len(pages)} URLs.")


if __name__ == "__main__":
    main()
