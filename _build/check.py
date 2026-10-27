#!/usr/bin/env python3
"""Pre-publish checks for Quantization.com. Run after build.py; exits non-zero on any failure."""
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
ADS = 'pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6620975821265271'
OWNER = 'Contact, if you are interested in this website/domain name/Sponsorship/Advertisement/Partnership'
SECRET_PATTERNS = [re.compile(r"webworksa1\s*@", re.I), re.compile(r"gmail\.com", re.I)]

fails, warns = [], []
pages = [p for p in ROOT.rglob("*.html") if "_build" not in p.parts and ".git" not in p.parts]

for p in pages:
    rel = p.relative_to(ROOT).as_posix()
    s = p.read_text(encoding="utf-8")
    if rel != "404.html" and ADS not in s:
        fails.append(f"{rel}: AdSense loader missing")
    if OWNER not in s or "https://web.works/contact" not in s:
        fails.append(f"{rel}: owner contact bar missing")
    if "{{" in s or "}}" in s and "{{" in s:
        fails.append(f"{rel}: unreplaced template token")
    if re.search(r'data-cta="', s):
        fails.append(f"{rel}: unreplaced CTA placeholder")
    h1 = len(re.findall(r"<h1[\s>]", s))
    if h1 != 1:
        fails.append(f"{rel}: {h1} <h1> elements")
    ids = re.findall(r'\sid="([^"]+)"', s)
    dup = {i for i in ids if ids.count(i) > 1}
    if dup:
        fails.append(f"{rel}: duplicate ids {sorted(dup)[:5]}")
    t = re.search(r"<title>(.*?)</title>", s, re.S)
    d = re.search(r'<meta name="description" content="([^"]*)"', s)
    if t and len(t.group(1)) > 75:
        warns.append(f"{rel}: long title ({len(t.group(1))})")
    if d and not (100 <= len(d.group(1)) <= 170):
        warns.append(f"{rel}: description length {len(d.group(1))}")
    for m in re.finditer(r'(?:href|src)="([^"]+)"', s):
        u = m.group(1)
        if u.startswith(("http://", "https://", "mailto:", "#", "javascript:", "data:", "//", "'+")):
            continue
        path = urlparse(u).path
        if not path:
            continue
        target = (ROOT / path.lstrip("/")) if path.startswith("/") else (p.parent / path)
        target = target.resolve()
        if target.is_dir():
            target = target / "index.html"
        if not target.exists():
            fails.append(f"{rel}: broken link {u}")
        else:
            frag = urlparse(u).fragment
            if frag and target.suffix == ".html":
                ts = target.read_text(encoding="utf-8")
                if f'id="{frag}"' not in ts:
                    warns.append(f"{rel}: anchor #{frag} not found in {target.relative_to(ROOT)}")

for f in ROOT.rglob("*"):
    if f.is_dir() or ".git" in f.parts:
        continue
    if f.suffix.lower() in {".png", ".ico", ".jpg"}:
        continue
    try:
        s = f.read_text(encoding="utf-8")
    except Exception:
        continue
    for pat in SECRET_PATTERNS:
        if pat.search(s):
            fails.append(f"{f.relative_to(ROOT)}: private inbox address exposed ({pat.pattern})")

for need in ["ads.txt", "robots.txt", "sitemap.xml", "site.webmanifest", "404.html"]:
    if not (ROOT / need).exists():
        fails.append(f"missing {need}")

print(f"Checked {len(pages)} pages.")
for w in warns:
    print("WARN ", w)
for f in fails:
    print("FAIL ", f)
print("OK" if not fails else f"{len(fails)} failures")
sys.exit(1 if fails else 0)
