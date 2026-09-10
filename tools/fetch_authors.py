#!/usr/bin/env python3
"""arXiv API에서 저자·제목·게재일을 모아 content/meta.json 을 만든다.
도서관 랜딩 페이지가 '책등'에 저자를 찍으려면 이 데이터가 필요하다.

`--audit` 서브커맨드: content/fields.js 의 WIKI.INDEX 와 content/meta.json 을
맞대어 놓고 품질 문제(커버리지 누락, 제목 불일치, 연도 불일치, 저자 표기 이상)를
출력한다. 새 논문을 meta.json 에 추가할 때마다 돌려서 검수하는 용도."""
import json, os, re, sys, time, unicodedata, urllib.request, urllib.parse, xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NS = {'a': 'http://www.w3.org/2005/Atom'}
OUT = os.path.join(ROOT, 'content', 'meta.json')


def load_ids():
    ids = {}
    for s in sorted(os.listdir('/data/papers')):
        p = f'/data/papers/{s}/meta.json'
        if not os.path.exists(p):
            continue
        try:
            m = json.load(open(p))
        except Exception:
            continue
        if m.get('arxiv'):
            ids[s] = str(m['arxiv'])
    return ids


def fetch(batch):
    url = 'http://export.arxiv.org/api/query?' + urllib.parse.urlencode(
        {'id_list': ','.join(batch), 'max_results': len(batch)})
    with urllib.request.urlopen(url, timeout=60) as r:
        return ET.fromstring(r.read())


def main():
    ids = load_ids()
    have = {}
    if os.path.exists(OUT):
        have = json.load(open(OUT))
    todo = [(s, i) for s, i in ids.items() if s not in have]
    print(f'{len(ids)} known · {len(have)} cached · {len(todo)} to fetch')
    B = 40
    for k in range(0, len(todo), B):
        chunk = todo[k:k + B]
        by_id = {}
        for s, i in chunk:
            by_id.setdefault(i.split('v')[0], []).append(s)
        try:
            root = fetch(list(by_id))
        except Exception as e:
            print('  ! batch failed:', e); time.sleep(5); continue
        for e in root.findall('a:entry', NS):
            aid = (e.findtext('a:id', '', NS) or '').rsplit('/', 1)[-1].split('v')[0]
            slugs = by_id.get(aid) or []
            rec = {
                'title': ' '.join((e.findtext('a:title', '', NS) or '').split()),
                'authors': [' '.join((a.findtext('a:name', '', NS) or '').split())
                            for a in e.findall('a:author', NS)],
                'published': (e.findtext('a:published', '', NS) or '')[:10],
                'arxiv': aid,
            }
            for s in slugs:
                have[s] = rec
        print(f'  {min(k+B,len(todo))}/{len(todo)}')
        time.sleep(3)
    json.dump(have, open(OUT, 'w'), ensure_ascii=False, indent=0, sort_keys=True)
    print('wrote', OUT, len(have), 'records')


def load_index():
    """content/fields.js 의 WIKI.INDEX 를 파싱해 [ [slug, year, title, ko, field, track, parents], ... ] 로 돌려준다.
    fields.js 는 순수 JS 배열 리터럴(문자열은 작은따옴표, 이스케이프 \\' 포함)이라
    node 를 이용해 실제로 평가한다. node 가 없으면 정규식 기반 폴백을 쓴다."""
    path = os.path.join(ROOT, 'content', 'fields.js')
    src = open(path, encoding='utf-8').read()
    try:
        import subprocess
        js = (
            "const src=require('fs').readFileSync(process.argv[1],'utf8');"
            "const sandbox={};sandbox.window=sandbox;"
            "require('vm').createContext(sandbox);"
            "require('vm').runInContext(src, sandbox);"
            "process.stdout.write(JSON.stringify(sandbox.WIKI.INDEX));"
        )
        out = subprocess.run(['node', '-e', js, path], capture_output=True, timeout=30, check=True)
        return json.loads(out.stdout)
    except Exception:
        pass
    # 폴백: 정규식으로 한 줄짜리 항목만 파싱 (node 가 없는 환경용, slug/year/title만 신뢰)
    rows = []
    str_re = r"'(?:\\.|[^'\\])*'"
    row_re = re.compile(
        r"\[\s*(" + str_re + r")\s*,\s*(\d+)\s*,\s*(" + str_re + r")\s*,\s*(" + str_re + r")\s*,\s*("
        + str_re + r")\s*,\s*(" + str_re + r")\s*,\s*(\[[^\]]*\])\s*\]")

    def unq(s):
        return s[1:-1].replace("\\'", "'")

    for m in row_re.finditer(src):
        slug, year, title, ko, field, track, parents = m.groups()
        rows.append([unq(slug), int(year), unq(title), unq(ko), unq(field), unq(track), []])
    return rows


def _title_words(t):
    t = re.sub(r'\([^)]*\)', ' ', t).lower()
    t = re.sub(r"[^a-z0-9 ]", ' ', t)
    stop = {'the', 'and', 'for', 'with', 'using', 'via', 'from', 'through', 'of', 'to', 'in', 'on', 'are', 'a', 'an'}
    return {w for w in t.split() if len(w) > 2 and w not in stop}


def audit():
    """1) 커버리지 2) 제목 불일치 3) 연도 불일치(>=2년) 4) 저자 표기 이상 을 검사해 출력한다."""
    index = load_index()
    meta = json.load(open(OUT)) if os.path.exists(OUT) else {}
    slugs = [r[0] for r in index]
    idx_map = {r[0]: r for r in index}

    print(f'=== 커버리지 ===')
    have = [s for s in slugs if s in meta]
    missing = [s for s in slugs if s not in meta]
    empty_authors = [s for s in have if not meta[s].get('authors')]
    print(f'인덱스 {len(slugs)}편 · 메타데이터 있음 {len(have)}편 · 없음 {len(missing)}편 · 저자 비어있음 {len(empty_authors)}편')
    if missing:
        print('  누락:', ', '.join(missing))
    if empty_authors:
        print('  저자 없음:', ', '.join(empty_authors))

    extra = [s for s in meta if s not in idx_map]
    if extra:
        print(f'  (주의) 인덱스에 없는 meta.json 항목 {len(extra)}개:', ', '.join(extra))

    print(f'\n=== 제목 대조 (단어 중복도 낮은 순) ===')
    title_rows = []
    for slug in have:
        iw = _title_words(idx_map[slug][2])
        mw = _title_words(meta[slug].get('title', ''))
        if not iw:
            continue
        overlap = len(iw & mw) / len(iw)
        title_rows.append((overlap, slug))
    title_rows.sort()
    flagged = [r for r in title_rows if r[0] < 0.9]
    if flagged:
        for overlap, slug in flagged:
            print(f'  {overlap:.2f}  {slug:25s} IDX: {idx_map[slug][2][:55]!r:57s} META: {meta[slug].get("title","")[:55]!r}')
    else:
        print('  이상 없음 (모두 단어 중복도 >= 0.9)')

    print(f'\n=== 연도 대조 (인덱스와 2년 이상 차이) ===')
    year_rows = []
    for slug in have:
        idx_year = idx_map[slug][1]
        pub = meta[slug].get('published', '') or ''
        try:
            my = int(pub[:4])
        except Exception:
            year_rows.append((slug, idx_year, pub, None))
            continue
        if abs(my - idx_year) >= 2:
            year_rows.append((slug, idx_year, pub, my - idx_year))
    if year_rows:
        for slug, idx_year, pub, diff in year_rows:
            print(f'  {slug:25s} idx={idx_year}  meta.published={pub!r}  diff={diff}')
    else:
        print('  이상 없음')

    print(f'\n=== 저자 표기 이상 ===')
    issues = []
    for slug in have:
        authors = meta[slug].get('authors', [])
        seen = set()
        for a in authors:
            stripped = a.strip()
            if stripped != a:
                issues.append((slug, '앞뒤 공백', repr(a)))
            if re.search(r'\s{2,}', a):
                issues.append((slug, '중복 공백', repr(a)))
            if re.match(r'(?i)^and\s+', stripped):
                issues.append((slug, "'and' 로 시작", repr(a)))
            if any(ch in a for ch in ('Ã', 'Â', '�')):
                issues.append((slug, '깨진 유니코드(mojibake) 의심', repr(a)))
            if unicodedata.normalize('NFC', stripped) != stripped:
                issues.append((slug, 'NFC 비정규화', repr(a)))
            key = stripped.lower()
            if key in seen:
                issues.append((slug, '중복 저자', repr(a)))
            seen.add(key)
    if issues:
        for slug, kind, val in issues:
            print(f'  {slug:25s} {kind:20s} {val}')
    else:
        print('  이상 없음')

    print(f'\n=== 요약 ===')
    print(f'커버리지: {len(have)}/{len(slugs)}, 저자 없음: {len(empty_authors)}, '
          f'제목 의심: {len(flagged)}, 연도 의심: {len(year_rows)}, 저자 표기 이상: {len(issues)}')


if __name__ == '__main__':
    if '--audit' in sys.argv:
        audit()
    else:
        main()

# --- Semantic Scholar 보강 -------------------------------------------------
# arXiv 에 없는 논문(Nature/Science/저널·학회 전용)은 제목으로 찾는다.
def s2_backfill(titles):
    """titles: {slug: title}. 반환: {slug: rec}"""
    import urllib.error
    out = {}
    for slug, t in titles.items():
        q = urllib.parse.urlencode({'query': t, 'limit': 3,
                                    'fields': 'title,authors,year,venue,externalIds'})
        url = 'https://api.semanticscholar.org/graph/v1/paper/search?' + q
        for attempt in range(4):
            try:
                with urllib.request.urlopen(url, timeout=60) as r:
                    d = json.loads(r.read())
                break
            except urllib.error.HTTPError as e:
                if e.code == 429:
                    time.sleep(8 + attempt * 8); continue
                d = None; break
            except Exception:
                d = None; break
        else:
            d = None
        hits = (d or {}).get('data') or []
        if not hits:
            print('  ? no hit:', slug); time.sleep(3); continue
        h = hits[0]
        out[slug] = {
            'title': h.get('title') or t,
            'authors': [a.get('name') for a in (h.get('authors') or []) if a.get('name')],
            'published': str(h.get('year') or ''),
            'venue': h.get('venue') or '',
            'arxiv': (h.get('externalIds') or {}).get('ArXiv') or '',
        }
        print('  +', slug, '·', len(out[slug]['authors']), 'authors')
        time.sleep(3)
    return out
