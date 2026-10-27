# Research summary — reference sites reviewed for Quantization.com

About 90 pages across 60+ sites were reviewed in October 2026. Findings are paraphrased; no text was copied into the site.

## A. AI quantization docs, tools and calculators

| Site | What we took from it |
|---|---|
| Hugging Face Transformers quantization overview | Method × hardware support matrix; scenario-to-method "selecting" table; embedded quantization picker → our formats atlas + VRAM calculator |
| Hugging Face Optimum concept guide | Affine maths, calibration methods, granularity → playground + PTQ/QAT guide |
| llama.cpp README, quantize README, quantize.cpp | Effective bits per weight and file sizes for Llama 3.1 8B (Q2_K 3.16 … Q8_0 8.50) → calculator values and home table |
| bitsandbytes docs | LLM.int8 / NF4 / QLoRA positioning |
| PyTorch torchao | PyTorch-native quantization workflows |
| TensorFlow Model Optimization | Post-training float16 / int8 / full-integer recipes |
| NVIDIA Model Optimizer | FP8/NVFP4 PTQ, QAT, dated news list |
| ONNX Runtime quantization | Static vs dynamic, QDQ format, method selection guidance |
| vLLM quantization | Method × GPU architecture matrix; "start with LLM Compressor" guidance |
| Unsloth docs | Dynamic per-layer GGUF quants; KL divergence as quality metric |
| Ollama, LM Studio | Tag tables with sizes, size-bucket filters, social proof strips |
| Maarten Grootendorst visual guide | Diagram-led explanation; formulas only as images → we publish copyable formulas |
| apxml, devtk, incoherency, flaviocopes VRAM calculators | Inputs/outputs; "show your work" table; consistency lessons (one calculator contradicted itself) |
| DeepLearning.AI short courses | Lesson-list course pages |
| Qualcomm AI Hub, Intel Neural Compressor | On-device workflow framing; hardware support tiers |

## B. Signals, audio, music, physics and education

| Site | What we took from it |
|---|---|
| Analog Devices MT-001 | SNR = 6.02N + 1.76 dB derivation and limits; process gain |
| TI Precision Labs | Video + quiz training format; calculator lead magnets |
| MathWorks "What is quantization" | Cross-domain explainer structure |
| All About Circuits | Quantization-noise article structure; gap: no ADC calculator → our ADC tool |
| Sound On Sound, iZotope | Dither practice, TPDF level, noise shaping, myth-busting sections |
| Ableton manual, Learning Music | Groove parameters; in-browser interactive sequencers → our music quantizer |
| Splice, Native Instruments blog | Quantize strength and swing worked examples |
| Physics Classroom, PhET, LibreTexts, GaTech PhysicsBook | Bohr levels, Balmer lines, learning goals → energy calculator |
| 3Blue1Brown, BetterExplained, Brilliant | Intuition-first lessons with inline interactives |
| DSPGuide ch.3, Electronics-Tutorials | ±½ LSB error, rms 0.29 LSB, LSB convention pitfalls |
| Apex Waves, CalculatorSoup | Calculator SEO pattern: tool above the fold, formula, assumptions, FAQ |

## C. Monetization, lead generation, contests, hiring, sponsorship

| Site | What we took from it |
|---|---|
| DrivenData, AIcrowd, Devpost, MLH, DEV | Contest header facts, timeline, rules order, judging rubric, verification, IP licence |
| MLCommons | Published membership tiers; benchmark positioning |
| Open Collective, GitHub Sponsors, Buy Me a Coffee, Ko-fi, Patreon | Tier ladders, monthly/one-time toggle, recognition perks |
| Wikimedia, Mozilla, Raspberry Pi, Khan Academy, PSF, Blender Fund | Impact framing, use-of-funds transparency, "not tax-deductible" honesty |
| Lambda, Hugging Face, Together AI, Fireworks, Baseten, Red Hat AI | Talk-to-an-engineer forms; "prove it on your workload" positioning |
| RunPod | Referral/affiliate structure for GPU clouds |
| YC Jobs, Wellfound, Greenhouse, Toptal, Lever | Job cards and application field order |
| TLDR, Product Hunt, Changelog, Cooperpress, The Neuron | Media-kit structure, placement specs, standards |
| Unbounce, Econsultancy, HubSpot | Multi-step forms, plain-language copy, lead-magnet presentation |
| Google AdSense Help Center | Eligibility, site readiness, ads.txt, privacy disclosures, certified CMP for EEA/UK/CH |

## Decisions that came out of the research
1. Lead with tools (VRAM calculator, playground) because search intent is tool-shaped.
2. Show the working on every calculator; keep numbers consistent site-wide.
3. Publish primary sources on every guide; no invented statistics.
4. Multi-step lead form with an easy first step and contact details last.
5. Use-of-funds transparency and honest "not tax-deductible" labelling for support.
6. Skill-based contest with published scoring, rules and verification.
7. Media kit without inflated audience numbers; share real analytics on request.
