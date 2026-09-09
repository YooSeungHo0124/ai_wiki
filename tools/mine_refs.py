#!/usr/bin/env python3
"""이미 받아 둔 논문 원문에서 참고문헌을 캐내, 다음에 쓸 논문 큐를 만든다.

    python3 tools/mine_refs.py [--top 60]

원리
  /data/papers/<slug>/text.txt 에는 참고문헌 목록이 그대로 들어 있다.
  거기서 arXiv ID 를 뽑아, **우리 위키의 몇 편이 그 논문을 참조하는지** 센다.
  여러 논문이 공통으로 인용하는데 우리에게 없는 것 = 계보의 빈 자리다.

  절대 인용수가 아니라 **우리 코퍼스 안에서의 참조 빈도**를 쓰는 이유:
  우리가 다루는 주제와 무관한 유명 논문이 아니라, 우리가 이미 쌓은
  계보가 실제로 기대고 있는 논문을 찾기 위해서다.
"""
import os, re, sys, json, collections, urllib.request, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if not os.path.isdir(os.path.join(ROOT,"content")): ROOT = "/data/try/wiki"
PAPERS = "/data/papers"

def have_arxiv_ids():
    """이미 위키에 있는 논문의 arXiv ID"""
    ids = set()
    pdir = os.path.join(ROOT, "content", "papers")
    for fn in os.listdir(pdir):
        if not fn.endswith(".js"): continue
        src = open(os.path.join(pdir, fn), encoding="utf-8").read()
        m = re.search(r"arxiv\s*:\s*'([^']+)'", src)
        if m: ids.add(m.group(1).split("v")[0])
    return ids

ARXIV = re.compile(r"arxiv[.:\s/]*(?:abs/)?(\d{4}\.\d{4,5})", re.I)

def mine():
    have = have_arxiv_ids()
    # ID -> 그 ID를 참조한 우리 논문 slug 집합
    cited = collections.defaultdict(set)
    n_src = 0
    for slug in sorted(os.listdir(PAPERS)):
        t = os.path.join(PAPERS, slug, "text.txt")
        if not os.path.isfile(t): continue
        n_src += 1
        txt = open(t, encoding="utf-8", errors="ignore").read()
        # 참고문헌 절만 보면 좋지만 형식이 제각각이라 전문에서 뽑되,
        # 자기 자신의 arXiv ID 는 제외한다
        for aid in set(m.group(1) for m in ARXIV.finditer(txt)):
            cited[aid].add(slug)
    # 이미 가진 것 제외
    cand = {a: s for a, s in cited.items() if a not in have}
    ranked = sorted(cand.items(), key=lambda kv: -len(kv[1]))
    return ranked, n_src, len(have)

def title_of(aid):
    """arXiv API 로 제목·연도를 가져온다 (예의상 3초 간격)"""
    url = "http://export.arxiv.org/api/query?id_list=" + aid
    try:
        x = urllib.request.urlopen(url, timeout=20).read().decode("utf-8", "ignore")
        t = re.search(r"<title>(.*?)</title>", x, re.S)
        d = re.search(r"<published>(\d{4})", x)
        ti = re.sub(r"\s+", " ", t.group(1)).strip() if t else "?"
        # 첫 <title> 은 피드 제목인 경우가 있어 두 번째를 우선
        ts = re.findall(r"<title>(.*?)</title>", x, re.S)
        if len(ts) > 1: ti = re.sub(r"\s+", " ", ts[1]).strip()
        return ti, (d.group(1) if d else "?")
    except Exception:
        return "?", "?"

if __name__ == "__main__":
    top = 40
    if "--top" in sys.argv: top = int(sys.argv[sys.argv.index("--top") + 1])
    ranked, n_src, n_have = mine()
    print("원문 %d편을 훑어 참고문헌을 캤다. 이미 보유 %d편." % (n_src, n_have))
    print("우리 위키의 여러 논문이 공통으로 참조하는데 아직 없는 논문 상위 %d개:\n" % top)
    out = []
    for aid, srcs in ranked[:top]:
        ti, yr = title_of(aid)
        out.append({"arxiv": aid, "year": yr, "title": ti,
                    "cited_by": sorted(srcs), "n": len(srcs)})
        print("%2d편이 참조  arXiv:%-11s (%s)  %s" % (len(srcs), aid, yr, ti[:80]))
        print("            ← %s" % ", ".join(sorted(srcs)[:8]))
        time.sleep(3)
    json.dump(out, open(os.path.join(ROOT, "tools", "candidates.json"), "w"),
              ensure_ascii=False, indent=1)
    print("\ntools/candidates.json 에 저장했다.")
