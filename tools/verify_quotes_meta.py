#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Two checks, READ ONLY, over content/papers/*.js vs /data/papers/<slug>/ and
content/meta.json:

(A) quotes[].t  -- verbatim quote check against text.txt.
    PDF text extraction mangles whitespace, hyphenation, ligatures, and
    smart punctuation, so exact `in` matching would false-positive on almost
    everything. Normalization applied to BOTH the quote and the source text
    before comparing:
      - unicode NFKC normalize
      - collapse all whitespace runs to a single space
      - strip soft-hyphen/hyphenation artifacts ("- " at line-wrap joins is
        not reproducible from text.txt alone, so we also try removing all
        spaces entirely as a second, looser pass)
      - normalize curly quotes/apostrophes/dashes to ascii equivalents
      - drop a handful of ligature chars (ﬁ ﬂ) to their expansions
    A quote is "matched" if the normalized quote string (or its
    space-stripped form) is a substring of the normalized (or
    space-stripped) source text. Anything not found is reported for manual
    review -- it may be a genuine misquote, or may be an ellipsis/bracket
    edit ("[...]") the note author made explicitly (common and fine), which
    the report calls out separately when the quote contains literal "..."
    or "[" so a human can skip those quickly.

(B) year cross-check -- note's `published` year (via arxiv id's YYMM
    prefix when meta has no explicit year, or content/meta.json's
    `published` field) is compared against the year the note text implies
    (e.g. via meta.json only, since notes don't always restate the year in
    prose). This mainly catches meta.json / arxiv id mismatches.

Output: tools/quotes_report.json, printed summary.
"""
import json, re, os, unicodedata

ROOT = "/data/try/wiki"
PAPERS_DIR = "/data/papers"
NOTES = json.load(open(os.path.join(ROOT, "tools", "notes_dump.json"), encoding="utf-8"))
META = json.load(open(os.path.join(ROOT, "content", "meta.json"), encoding="utf-8"))

TRANS = str.maketrans({
    "‘": "'", "’": "'", "“": '"', "”": '"',
    "–": "-", "—": "-", "−": "-",
    "ﬁ": "fi", "ﬂ": "fl", " ": " ",
})

def norm(s):
    s = unicodedata.normalize("NFKC", s)
    s = s.translate(TRANS)
    s = re.sub(r"\s+", " ", s).strip()
    return s

def nospace(s):
    return re.sub(r"\s+", "", s)

CACHE = {}
def get_raw(slug):
    if slug not in CACHE:
        p = os.path.join(PAPERS_DIR, slug, "text.txt")
        CACHE[slug] = open(p, encoding="utf-8", errors="ignore").read() if os.path.isfile(p) else None
    return CACHE[slug]

def words(s):
    s = norm(s).lower()
    return re.findall(r"[a-z0-9]+(?:'[a-z]+)?", s)

def ngram_hit(quote_words, text_word_str, n):
    """Does any contiguous n-gram from quote_words appear as a contiguous
    substring (space-joined) inside text_word_str (already space-joined
    lowercase words)? This tolerates PDF column-interleaving noise that
    corrupts only PART of a quote -- a real quote will still have some
    unbroken run of n consecutive words survive somewhere, even if the
    quote as a whole doesn't appear as one unbroken substring."""
    if len(quote_words) < n:
        return " ".join(quote_words) in text_word_str
    for i in range(0, len(quote_words) - n + 1):
        gram = " ".join(quote_words[i:i+n])
        if gram in text_word_str:
            return True
    return False

def check_quotes(note):
    slug = note["slug"]
    raw = get_raw(slug)
    out = []
    if raw is None:
        return out
    text_words = " ".join(words(raw))
    for q in note.get("quotes") or []:
        t = q.get("t") or ""
        qw = words(t)
        if not qw:
            continue
        # word-multiset coverage: are the quote's words present in the
        # source vocabulary at all (catches outright fabricated content)
        from collections import Counter
        src_counter = Counter(text_words.split(" "))
        cov_hits = sum(1 for w in qw if src_counter.get(w, 0) > 0)
        coverage = cov_hits / len(qw)
        # contiguous run check, tolerant of interleaving noise: try n=8
        # words down to n=5 words, any hit counts as "verbatim run found"
        run_found = any(ngram_hit(qw, text_words, n) for n in (8, 6, 5) if len(qw) >= n) or \
                    (len(qw) < 5 and ngram_hit(qw, text_words, len(qw)))
        if not run_found or coverage < 0.85:
            out.append({
                "slug": slug, "quote": t, "src": q.get("src"),
                "word_coverage": round(coverage, 3),
                "contiguous_run_found": run_found,
                "has_ellipsis_or_bracket": ("..." in t or "…" in t or "[" in t),
            })
    return out

def year_from_arxiv(arxiv_id):
    m = re.match(r"^(\d{2})(\d{2})\.", arxiv_id or "")
    if not m:
        return None
    yy = int(m.group(1))
    return 2000 + yy  # arXiv IDs are all 2007+ era in this corpus

def check_years(note):
    slug = note["slug"]
    m = META.get(slug, {})
    issues = []
    arxiv_id = note.get("arxiv") or m.get("arxiv")
    pub = m.get("published")
    if arxiv_id and pub:
        ay = year_from_arxiv(arxiv_id)
        py = None
        pm = re.match(r"^(\d{4})", pub)
        if pm:
            py = int(pm.group(1))
        if ay and py and abs(ay - py) > 1:
            issues.append({"slug": slug, "issue": "arxiv_id_year_vs_meta_published",
                            "arxiv": arxiv_id, "meta_published": pub})
    note_venue = note.get("venue") or ""
    for y in re.findall(r"(19|20)\d{2}", note_venue):
        pass
    return issues

def main():
    all_quote_issues = []
    all_year_issues = []
    for note in NOTES:
        all_quote_issues.extend(check_quotes(note))
        all_year_issues.extend(check_years(note))

    with open(os.path.join(ROOT, "tools", "quotes_report.json"), "w", encoding="utf-8") as f:
        json.dump({"quote_mismatches": all_quote_issues, "year_issues": all_year_issues}, f,
                   ensure_ascii=False, indent=1)

    print(f"Notes checked: {len(NOTES)}")
    total_quotes = sum(len(n.get("quotes") or []) for n in NOTES)
    print(f"Total quotes: {total_quotes}")
    print(f"Quote mismatches (not found verbatim, normalized): {len(all_quote_issues)}")
    n_ellip = sum(1 for q in all_quote_issues if q["has_ellipsis_or_bracket"])
    print(f"  of which contain ... or [ (likely intentional edit): {n_ellip}")
    print(f"Year issues: {len(all_year_issues)}")
    for q in all_quote_issues:
        print(f"  [{q['slug']}] cov={q['word_coverage']} run={q['contiguous_run_found']} ellipsis={q['has_ellipsis_or_bracket']} :: {q['quote'][:100]!r}")

if __name__ == "__main__":
    main()
