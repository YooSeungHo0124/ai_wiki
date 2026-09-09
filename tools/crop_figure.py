#!/usr/bin/env python3
"""논문 페이지에서 그림 영역을 잘라 위키에 넣는다 (개인 학습용 발췌).

    python3 tools/crop_figure.py <slug> <page> <x0> <y0> <x1> <y1> <name>

  page          1부터. /data/papers/<slug>/pages/p-NN.png 를 쓴다
  x0 y0 x1 y1   페이지 좌상단 기준 **비율**(0~1). 예: 0.10 0.32 0.92 0.58
  name          저장 이름 (확장자 없이). 예: fig1-architecture

  → content/figures/<slug>/<name>.png 로 저장하고, 노트에 넣을 코드 조각을 출력한다.

페이지 PNG를 Read 도구로 먼저 눈으로 보고 대략의 비율을 정한 뒤 자르면 된다.
잘린 결과도 Read 로 확인해서 여백이 크면 다시 자른다.
"""
import os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC  = "/data/papers"

def main():
    if len(sys.argv) != 8:
        print(__doc__); sys.exit(1)
    slug, page = sys.argv[1], int(sys.argv[2])
    x0, y0, x1, y1 = map(float, sys.argv[3:7])
    name = sys.argv[7].replace("/", "-")

    src = os.path.join(SRC, slug, "pages", "p-%02d.png" % page)
    if not os.path.exists(src):
        alt = os.path.join(SRC, slug, "pages", "p-%d.png" % page)
        src = alt if os.path.exists(alt) else src
    if not os.path.exists(src):
        print("페이지 이미지 없음: %s — 먼저 tools/fetch_paper.py %s" % (src, slug)); sys.exit(1)

    im = Image.open(src); W, H = im.size
    box = (int(x0*W), int(y0*H), int(x1*W), int(y1*H))
    if box[2] <= box[0] or box[3] <= box[1]:
        print("좌표가 뒤집혔다: %s" % (box,)); sys.exit(1)
    crop = im.crop(box)

    # 가로 1100px 를 넘으면 줄인다 (위키 본문 폭보다 크면 낭비)
    if crop.width > 1100:
        crop = crop.resize((1100, int(crop.height * 1100 / crop.width)), Image.LANCZOS)

    outdir = os.path.join(ROOT, "content", "figures", slug)
    os.makedirs(outdir, exist_ok=True)
    out = os.path.join(outdir, name + ".png")
    crop.save(out, optimize=True)

    kb = os.path.getsize(out)/1024
    print("저장: %s  (%dx%d, %.0fKB)" % (out, crop.width, crop.height, kb))
    print("\n노트에 넣을 코드:")
    print("figures:[{f:'%s.png', cap:'설명', src:'원문 Figure N, p.%d'}]" % (name, page))

if __name__ == "__main__":
    main()
