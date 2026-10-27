# Quantization.com

Static website for **Quantization.com — "Fewer bits, measured."** Tools and guides for quantization in AI models, signals and audio, music timing and physics. Monetized with Google AdSense, a dedicated lead-generation page, reader support, the Quantization Challenge, a talent network and labelled sponsorships.

## Structure

```
index.html, *.html        Generated pages (served by GitHub Pages as-is)
tools/, learn/            Generated tool and guide pages
assets/css/site.css       Design system
assets/js/site.js         Shared behaviour, forms (private inbox routing), video facades
assets/js/*.js            One script per tool + formats atlas
_build/build.py           Builder: wraps fragments in the layout, adds SEO/schema/CTAs, writes sitemap.xml
_build/pages/             Page fragments (edit these, then rebuild)
_build/data/formats.json  Formats atlas data
ads.txt, robots.txt, site.webmanifest
BUILD-PROMPT.md           Phase-wise build prompt
RESEARCH.md               Summary of the reference-site research
```

## Edit and rebuild

```bash
python3 _build/build.py
```

## Forms

All forms send through FormSubmit's AJAX endpoint to the owner's private inbox. The address is stored only in obfuscated form inside `assets/js/site.js` and is never written into any page. After the first deployment, submit any form once and confirm the one-time FormSubmit activation email.

## Hosting (GitHub Pages, free plan)

Settings → Pages → Deploy from a branch → `main` (or `gh-pages`) / root. Live at `https://webworksa1.github.io/quantization-com/` immediately. For the custom domain, first set DNS — `A` @ → 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153 and `CNAME` www → webworksa1.github.io — then enter `quantization.com` under Settings → Pages → Custom domain and enable "Enforce HTTPS". AdSense needs the custom domain, because `ads.txt` must sit at the domain root.

## Legal

"Quantization" is a generic technical term; no exclusive rights are claimed and the site is not affiliated with any company or product using the word. Third-party trademarks belong to their owners. Original content © Quantization.com. For acquisition, sponsorship, advertising or partnership: https://web.works/contact
