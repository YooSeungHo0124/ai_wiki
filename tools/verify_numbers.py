#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Cross-check numeric claims in content/papers/*.js against the original
paper text in /data/papers/<slug>/text.txt.

READ ONLY. Writes only tools/verify_report.json and prints a summary.

Matching strategy (documented here because it drives the whole report):
  1. Pull every note-value field we care about: numbers[].v, numbers[].k,
     numbers[].d, and (separately, for context) prose in ideas[].d,
     context, impact, pitfalls[]. We only *flag* things found in
     numbers[].v / numbers[].k / numbers[].d since that's the block
     explicitly promising precise figures; prose numbers are noisier
     (dates, section numbers, citation counts) and are handled in the
     manual pass instead.
  2. From each numbers[] entry's v/k/d strings, extract numeric tokens:
     - plain decimals/integers: 8.63, 91.26, 1024, 42
     - with thousands separators: 4,500만, 1,542
     - with unit suffixes attached directly: 1.5B, 40GB, 124M, 63.24%
     - Korean 만/억 compounded with a number: 800만, 4,500만
     We normalize each token to a canonical float value in "base units"
     where possible (e.g. "1.5B" -> 1.5e9, "800만" -> 8e6, "63.24%" -> 63.24
     as a percentage number) so that different surface notations of the
     same magnitude can be compared.
  3. For each normalized number, we search text.txt for occurrences of
     the same magnitude allowing:
       - separator variants (comma vs none, space vs none)
       - rounding tolerance: |a-b|/max(|a|,|b|) <= 0.01 (1%) for numbers
         written with a decimal point (e.g. 91.26 vs 91.3), because
         papers/notes commonly round to fewer decimal places.
       - unit-rescaled variants: 1.5B vs 1500M vs 1,500,000,000 vs "1.5
         billion"; 40GB vs "40 GB" vs "40,000 MB" (only when the paper
         plausibly uses that unit family - we just try B/M/K/% chains).
       - percent vs bare number (63.24% vs 63.24).
     If NONE of these variants appear anywhere in text.txt, the number
     is reported as "not found in source" for manual review. This is a
     recall-oriented net, not a proof of error - it will also catch
     numbers that are simply computed/derived by the note author, or
     printed as digits in the PDF's stripped-of-punctuation text
     extraction, or spelled out as words ("forty"), or split across a
     line break the extractor mangled. All of those show up in the
     "not found" bucket and must be adjudicated by a human (Phase 2).
  4. We explicitly SKIP tokens that are years (1900-2035), plain small
     integers <= 12 that look like enumeration/section/figure numbers
     when adjacent to words like '개', '층', '단계', 'Figure', 'Table',
     'Section', '장', '절' etc. This cuts a huge source of false
     positives (e.g. "3단계" is not a fact needing verification).
  5. Known OCR/extraction noise: text.txt files come from PDF text
     extraction and often have NO spaces between tokens, ligature
     issues (fi/fl), hyphenation at line breaks, and no comma grouping.
     So before searching we build a whitespace-stripped, comma-stripped
     "flat" version of text.txt and search the flat form for the flat
     form of each candidate number. This alone fixes most formatting
     false positives from rule (2)/(3).

Output: tools/verify_report.json with one entry per note listing
matched/unmatched numeric claims, plus a per-slug unmatched count for
prioritizing the manual pass.
"""
import json, re, os, sys, unicodedata

ROOT = "/data/try/wiki"
PAPERS_DIR = "/data/papers"
NOTES = json.load(open(os.path.join(ROOT, "tools", "notes_dump.json"), encoding="utf-8"))

NUM_RE = re.compile(
    r"""
    (?<![A-Za-z0-9])
    (\d{1,3}(?:,\d{3})+|\d+)          # integer part, possibly comma-grouped
    (\.\d+)?                          # optional decimal
    \s*
    (만|억|[BbKkMmGgTt](?![A-Za-z]))?  # optional unit suffix directly after (allow one space)
    (%)?
    """,
    re.VERBOSE,
)

YEAR_RE = re.compile(r"^(19|20)\d{2}$")

UNIT_MULT = {
    "": 1, "k": 1e3, "K": 1e3, "m": 1e6, "M": 1e6,
    "b": 1e9, "B": 1e9, "g": 1e9, "G": 1e9, "t": 1e12, "T": 1e12,
    "만": 1e4, "억": 1e8,
}

def normalize_number(int_part, dec_part, unit, pct):
    s = int_part.replace(",", "")
    try:
        base = float(s + (dec_part or ""))
    except ValueError:
        return None
    mult = UNIT_MULT.get(unit or "", 1)
    val = base * mult
    is_pct = bool(pct)
    has_decimal = bool(dec_part)
    return {"value": val, "is_pct": is_pct, "has_decimal": has_decimal,
            "raw": int_part + (dec_part or "") + (unit or "") + (pct or "")}

def extract_candidates(text):
    out = []
    for m in NUM_RE.finditer(text):
        int_part, dec_part, unit, pct = m.groups()
        if not int_part:
            continue
        raw_full = m.group(0)
        # skip bare small integers that are likely section/enum numbers,
        # and skip bare years unless part of a larger figure
        plain = int_part.replace(",", "")
        if not dec_part and not unit and not pct:
            if YEAR_RE.match(plain):
                continue
            if len(plain) <= 2 and int(plain) <= 12:
                # too likely to be an enumeration / layer count, skip standalone
                continue
        norm = normalize_number(int_part, dec_part, unit, pct)
        if norm is None:
            continue
        out.append(norm)
    return out

def flatten(s):
    # remove all whitespace and commas for loose substring search
    s = unicodedata.normalize("NFKC", s)
    return re.sub(r"[\s,]+", "", s)

def number_variants(norm):
    """Generate plausible textual/numeric variants (as flat strings) for a
    normalized number, to search for in the flattened source text."""
    val = norm["value"]
    variants = set()

    def fmt(x, decimals):
        if decimals is None:
            # try integer then a couple decimal precisions
            candidates = []
            if abs(x - round(x)) < 1e-9:
                candidates.append(str(int(round(x))))
            for d in (1, 2, 3):
                candidates.append(f"{x:.{d}f}")
            return candidates
        return [f"{x:.{decimals}f}"]

    # raw value as-is (e.g. 8.63, 91.26, 1024)
    variants.update(fmt(val, None))
    # value/1e3, /1e4, /1e6, /1e8, /1e9, /1e12 with K/M/B/만/억/G/T suffix stripped forms
    for div, suf_list in [
        (1, [""]),
        (1e3, ["k", "K", "K"]),
        (1e4, ["만"]),
        (1e6, ["m", "M"]),
        (1e8, ["억"]),
        (1e9, ["b", "B", "g", "G"]),
        (1e12, ["t", "T"]),
    ]:
        scaled = val / div
        for d in (0, 1, 2):
            if abs(scaled) < 100000:
                sval = f"{scaled:.{d}f}".rstrip("0").rstrip(".") if d > 0 else f"{int(round(scaled))}" if abs(scaled-round(scaled))<1e-6 else f"{scaled:.{d}f}"
                for suf in suf_list:
                    variants.add(sval + suf)
    # percent bare
    if norm["is_pct"]:
        for d in (0, 1, 2):
            variants.add(f"{val:.{d}f}".rstrip("0").rstrip("."))
    return {flatten(v) for v in variants if v}

def rounding_tolerant_search(flat_text, norm):
    """1% relative tolerance search for decimal numbers by scanning all
    decimal numbers present in flat_text near-ish in magnitude. This is
    expensive if done naively per-token, so we only do it for values with
    a decimal point (the common 'rounded differently' case)."""
    if not norm["has_decimal"]:
        return False
    val = norm["value"]
    if val == 0:
        return False
    # find all decimal numbers in flat_text of similar digit length
    for m in re.finditer(r"\d+\.\d+", flat_text):
        try:
            other = float(m.group(0))
        except ValueError:
            continue
        if other == 0:
            continue
        if abs(other - val) / max(abs(other), abs(val)) <= 0.01:
            return True
    return False

def load_flat_text(slug):
    path = os.path.join(PAPERS_DIR, slug, "text.txt")
    if not os.path.isfile(path):
        return None
    try:
        raw = open(path, encoding="utf-8", errors="ignore").read()
    except Exception:
        return None
    return flatten(raw), raw

CACHE = {}
def get_text(slug):
    if slug not in CACHE:
        CACHE[slug] = load_flat_text(slug)
    return CACHE[slug]

def check_note(note):
    slug = note["slug"]
    ft = get_text(slug)
    result = {"slug": slug, "has_source": ft is not None, "unmatched": [], "checked": 0}
    if ft is None:
        return result
    flat_text, raw_text = ft
    nums = note.get("numbers") or []
    for entry in nums:
        for field in ("v", "k", "d"):
            val_str = entry.get(field) or ""
            for cand in extract_candidates(val_str):
                result["checked"] += 1
                variants = number_variants(cand)
                found = any(v in flat_text for v in variants if len(v) >= 1)
                if not found:
                    found = rounding_tolerant_search(flat_text, cand)
                if not found:
                    result["unmatched"].append({
                        "field": field, "entry_k": entry.get("k"),
                        "entry_v": entry.get("v"), "raw_token": cand["raw"],
                        "value": cand["value"],
                    })
    return result

def main():
    reports = []
    for note in NOTES:
        reports.append(check_note(note))
    with open(os.path.join(ROOT, "tools", "verify_report.json"), "w", encoding="utf-8") as f:
        json.dump(reports, f, ensure_ascii=False, indent=1)

    no_source = [r["slug"] for r in reports if not r["has_source"]]
    with_source = [r for r in reports if r["has_source"]]
    total_checked = sum(r["checked"] for r in with_source)
    total_unmatched = sum(len(r["unmatched"]) for r in with_source)
    ranked = sorted(with_source, key=lambda r: -len(r["unmatched"]))

    print(f"Notes total: {len(NOTES)}")
    print(f"No text.txt (unverifiable): {len(no_source)} -> {no_source}")
    print(f"Numeric tokens checked: {total_checked}")
    print(f"Unmatched (candidates for review): {total_unmatched}")
    print()
    print("Top 40 slugs by unmatched count:")
    for r in ranked[:40]:
        print(f"  {r['slug']:30s} unmatched={len(r['unmatched']):3d}  checked={r['checked']:3d}")

if __name__ == "__main__":
    main()
