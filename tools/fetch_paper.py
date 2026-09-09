#!/usr/bin/env python3
"""논문 원문 수집 파이프라인 (개인 학습용 로컬 캐시)

    python3 tools/fetch_paper.py <slug> [<slug> ...]
    python3 tools/fetch_paper.py <slug> --arxiv 2205.06175   # 노트가 아직 없을 때
    python3 tools/fetch_paper.py --all          # arxiv 필드가 있는 논문 전부
    python3 tools/fetch_paper.py --missing      # 아직 안 받은 것만

arXiv ID 는 보통 content/papers/<slug>.js 의 arxiv 필드에서 읽는다.
새 논문이라 노트가 아직 없으면 --arxiv 로 직접 준다.

산출물 (/data/papers/<slug>/):
    paper.pdf      원문
    meta.json      slug·arxiv·제목·페이지수·수집일
    text.txt       pdftotext -layout (인용문 검색용)
    pages/p01.png  150dpi 페이지 렌더 (그림 위치를 눈으로 찾을 때)
    images/        pdfimages 로 뽑은 삽입 이미지 (충분히 큰 것만)

여기는 저장소가 아니라 로컬 캐시다. 위키에 실을 그림은
tools/crop_figure.py 로 잘라 content/figures/<slug>/ 에 넣는다.
"""
import json, os, re, subprocess, sys, time, urllib.request, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT  = "/data/papers"
UA   = "Mozilla/5.0 (personal-study-notes; contact: local)"

def papers_meta():
    """content/papers/*.js 에서 slug -> arxiv id 를 뽑는다."""
    out = {}
    pdir = os.path.join(ROOT, "content", "papers")
    for fn in sorted(os.listdir(pdir)):
        if not fn.endswith(".js"): continue
        slug = fn[:-3]
        src = open(os.path.join(pdir, fn), encoding="utf-8").read()
        m = re.search(r"arxiv\s*:\s*'([^']+)'", src)
        t = re.search(r"slug\s*:\s*'([^']+)'", src)
        out[slug] = {"arxiv": m.group(1) if m else None,
                     "ok": bool(t and t.group(1) == slug)}
    return out

def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)

def fetch(slug, arxiv):
    d = os.path.join(OUT, slug)
    os.makedirs(d, exist_ok=True)
    pdf = os.path.join(d, "paper.pdf")

    if not os.path.exists(pdf) or os.path.getsize(pdf) < 20000:
        url = "https://arxiv.org/pdf/%s" % arxiv
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=60) as r, open(pdf, "wb") as f:
                shutil.copyfileobj(r, f)
        except Exception as e:
            return "실패 %s: %s" % (slug, e)
        time.sleep(3)          # arXiv 예의 (초당 1회 미만)

    if os.path.getsize(pdf) < 20000:
        os.remove(pdf); return "실패 %s: 내용이 너무 작음" % slug

    # 본문 텍스트
    run(["pdftotext", "-layout", pdf, os.path.join(d, "text.txt")])
    # 페이지 렌더 (앞 14쪽이면 본문 그림은 거의 다 들어온다)
    pages = os.path.join(d, "pages"); os.makedirs(pages, exist_ok=True)
    if not os.listdir(pages):
        run(["pdftoppm", "-png", "-r", "150", "-f", "1", "-l", "14",
             pdf, os.path.join(pages, "p")])
    # 삽입 이미지
    imgs = os.path.join(d, "images"); os.makedirs(imgs, exist_ok=True)
    if not os.listdir(imgs):
        run(["pdfimages", "-png", "-f", "1", "-l", "14", pdf, os.path.join(imgs, "im")])
        for fn in list(os.listdir(imgs)):            # 아이콘·수식 조각 제거
            p = os.path.join(imgs, fn)
            if os.path.getsize(p) < 12000: os.remove(p)

    npages = 0
    r = run(["pdfinfo", pdf])
    m = re.search(r"Pages:\s+(\d+)", r.stdout or "")
    if m: npages = int(m.group(1))

    json.dump({"slug": slug, "arxiv": arxiv, "pages": npages,
               "fetched": time.strftime("%Y-%m-%d"),
               "page_png": sorted(os.listdir(pages)),
               "images": sorted(os.listdir(imgs))},
              open(os.path.join(d, "meta.json"), "w"), ensure_ascii=False, indent=1)
    return "완료 %s (%s, %d쪽, 페이지PNG %d, 이미지 %d)" % (
        slug, arxiv, npages, len(os.listdir(pages)), len(os.listdir(imgs)))

def main():
    meta = papers_meta()
    args = sys.argv[1:]
    if not args:
        print(__doc__); return
    if args[0] in ("--all", "--missing"):
        todo = [(s, v["arxiv"]) for s, v in meta.items() if v["arxiv"]]
        if args[0] == "--missing":
            todo = [(s, a) for s, a in todo
                    if not os.path.exists(os.path.join(OUT, s, "paper.pdf"))]
        skipped = [s for s, v in meta.items() if not v["arxiv"]]
        print("대상 %d편 / arXiv ID 없음 %d편: %s" % (len(todo), len(skipped), " ".join(skipped)))
    elif "--arxiv" in args:
        i = args.index("--arxiv")
        aid = args[i + 1] if i + 1 < len(args) else None
        slugs = [a for j, a in enumerate(args) if j not in (i, i + 1)]
        if not aid or len(slugs) != 1:
            print("사용법: fetch_paper.py <slug> --arxiv <arXiv ID>"); return
        todo = [(slugs[0], aid)]
    else:
        todo = [(s, meta.get(s, {}).get("arxiv")) for s in args]
    for slug, arxiv in todo:
        if not arxiv:
            print("건너뜀 %s: arXiv ID 없음" % slug); continue
        print(fetch(slug, arxiv), flush=True)

if __name__ == "__main__":
    main()
