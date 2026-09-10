#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sanity-check figures[].src page references ("Figure 3, p.4" etc.) against
the actual PDF page count (via `pdfinfo`), and flag any p.N where N exceeds
the paper's page count, or where no page number is given at all.
READ ONLY. Writes tools/figures_report.json.
"""
import json, os, re, subprocess

ROOT = "/data/try/wiki"
PAPERS_DIR = "/data/papers"
NOTES = json.load(open(os.path.join(ROOT, "tools", "notes_dump.json"), encoding="utf-8"))

PAGE_RE = re.compile(r"p\.?\s*(\d+)")

def page_count(slug):
    pdf = os.path.join(PAPERS_DIR, slug, "paper.pdf")
    if not os.path.isfile(pdf):
        return None
    try:
        out = subprocess.run(["pdfinfo", pdf], capture_output=True, text=True, timeout=20).stdout
    except Exception:
        return None
    m = re.search(r"^Pages:\s*(\d+)", out, re.MULTILINE)
    return int(m.group(1)) if m else None

CACHE = {}
def get_pages(slug):
    if slug not in CACHE:
        CACHE[slug] = page_count(slug)
    return CACHE[slug]

def main():
    issues = []
    no_pdf = []
    for note in NOTES:
        slug = note["slug"]
        pages = get_pages(slug)
        if pages is None:
            no_pdf.append(slug)
        for fig in note.get("figures") or []:
            src = fig.get("src") or ""
            m = PAGE_RE.search(src)
            if not m:
                issues.append({"slug": slug, "src": src, "issue": "no_page_number", "pdf_pages": pages})
                continue
            p = int(m.group(1))
            if pages is not None and p > pages:
                issues.append({"slug": slug, "src": src, "issue": "page_exceeds_pdf",
                                "cited_page": p, "pdf_pages": pages})
    with open(os.path.join(ROOT, "tools", "figures_report.json"), "w", encoding="utf-8") as f:
        json.dump({"issues": issues, "no_pdf": no_pdf}, f, ensure_ascii=False, indent=1)
    print(f"Notes: {len(NOTES)}  no_pdf: {len(no_pdf)} -> {no_pdf}")
    print(f"Figure src issues: {len(issues)}")
    for i in issues:
        print(" ", i)

if __name__ == "__main__":
    main()
