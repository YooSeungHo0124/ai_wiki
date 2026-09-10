#!/usr/bin/env python3
"""arXiv API에서 저자·제목·게재일을 모아 content/meta.json 을 만든다.
도서관 랜딩 페이지가 '책등'에 저자를 찍으려면 이 데이터가 필요하다."""
import json, os, sys, time, urllib.request, urllib.parse, xml.etree.ElementTree as ET

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


if __name__ == '__main__':
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
