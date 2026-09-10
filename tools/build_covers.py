#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_covers.py — 서재 표지 썸네일 빌더

446편 논문의 원문 1페이지 렌더(/data/papers/<slug>/pages/p-01.png, 수백KB~MB)를
그대로 홈에 쓰면 첫 렌더가 죽는다. 이 스크립트는 각 페이지의 "상단 25%"
(제목·저자가 있는 영역)만 잘라 카드 표지 크기(레티나 800px 폭)로 축소하고
WebP로 압축해 content/covers/<slug>.webp 를 만든다. 렌더가 없는 논문은
건너뛰고 content/covers/_missing.json 에 슬러그를 남겨, 프론트엔드가
조판된 대체 표지를 그릴 수 있게 한다.
"""

import argparse
import json
import os
import re
import sys

from PIL import Image

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIELDS_JS = os.path.join(REPO_ROOT, "content", "fields.js")
COVERS_DIR = os.path.join(REPO_ROOT, "content", "covers")
PAPERS_ROOT = "/data/papers"

# --- 파라미터 (샘플 실측으로 결정) ---------------------------------------
# 카드 표지 폭은 실사용 시 ~400px. 레티나(2x) 대응을 위해 800px로 렌더링.
TARGET_WIDTH = 800
# 원문 1페이지 최상단 25% 영역에 제목+저자가 대부분 들어온다.
# (transformer/resnet/bert/alphago/gpt3/clip/vit 7편 실측: 20%는 2단 조판
#  논문(transformer)에서 제목이 중간에 잘리고, 25%면 저자 줄까지 대체로 확보됨)
TOP_FRACTION = 0.25
# 20KB 예산. 기본 품질 70에서 시작해, 넘으면 5씩 낮춰 재인코딩(하드 캡).
BASE_QUALITY = 70
MIN_QUALITY = 30
QUALITY_STEP = 5
BYTE_BUDGET = 20 * 1024


def load_slugs():
    """content/fields.js 의 WIKI.INDEX 배열에서 슬러그 목록을 뽑는다."""
    with open(FIELDS_JS, "r", encoding="utf-8") as f:
        src = f.read()
    start = src.index("WIKI.INDEX")
    end = src.index("WIKI.META") if "WIKI.META" in src else len(src)
    block = src[start:end]
    # 각 행: ['slug', year, ...  형태에서 슬러그만 추출
    slugs = re.findall(r"\[\s*'([a-zA-Z0-9_-]+)'\s*,\s*\d+", block)
    return slugs


def build_one(slug, force=False):
    """slug 하나에 대해 표지를 만든다. 반환: (status, info)
    status in {"built", "skipped", "missing"}"""
    # pdftoppm 의 0 패딩 폭은 총 페이지 수에 따라 달라진다(p-1 / p-01 / p-001).
    # 한 가지 이름만 찾으면 52편이 통째로 누락되므로 폭 1~4 를 모두 시도한다.
    pages_dir = os.path.join(PAPERS_ROOT, slug, "pages")
    src_path = None
    for w in (2, 1, 3, 4):
        cand = os.path.join(pages_dir, "p-" + "1".rjust(w, "0") + ".png")
        if os.path.exists(cand):
            src_path = cand
            break
    if src_path is None:
        src_path = os.path.join(pages_dir, "p-01.png")
    out_path = os.path.join(COVERS_DIR, f"{slug}.webp")

    if not os.path.isfile(src_path):
        return "missing", None

    if os.path.isfile(out_path) and not force:
        with Image.open(out_path) as existing:
            w, h = existing.size
        return "skipped", {"w": w, "h": h, "bytes": os.path.getsize(out_path)}

    with Image.open(src_path) as im:
        im = im.convert("RGB")
        w, h = im.size
        crop = im.crop((0, 0, w, max(1, int(h * TOP_FRACTION))))
        cw, ch = crop.size
        new_h = max(1, round(TARGET_WIDTH * ch / cw))
        resized = crop.resize((TARGET_WIDTH, new_h), Image.LANCZOS)

        # 1차: 품질을 낮춰 예산에 맞춘다. 그래도 안 되면(사진/컬러 헤더 등)
        # 2차로 폭을 단계적으로 줄여 재시도한다 — 20KB 하드 캡을 지키기 위해서다.
        cur = resized
        out_w, out_h = TARGET_WIDTH, new_h
        while True:
            quality = BASE_QUALITY
            while True:
                cur.save(out_path, "WEBP", quality=quality, method=6)
                size = os.path.getsize(out_path)
                if size <= BYTE_BUDGET or quality <= MIN_QUALITY:
                    break
                quality -= QUALITY_STEP
            if size <= BYTE_BUDGET or out_w <= 320:
                break
            out_w = int(out_w * 0.85)
            out_h = max(1, round(out_w * ch / cw))
            cur = crop.resize((out_w, out_h), Image.LANCZOS)

    return "built", {"w": out_w, "h": out_h, "bytes": os.path.getsize(out_path)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--force", action="store_true", help="이미 만든 표지도 다시 생성")
    args = parser.parse_args()

    os.makedirs(COVERS_DIR, exist_ok=True)

    slugs = load_slugs()
    if not slugs:
        print("WIKI.INDEX 에서 슬러그를 하나도 못 찾았습니다.", file=sys.stderr)
        sys.exit(1)

    index = {}
    missing = []
    built_count = 0
    skipped_count = 0

    for slug in slugs:
        status, info = build_one(slug, force=args.force)
        if status == "missing":
            missing.append(slug)
        elif status == "skipped":
            skipped_count += 1
            index[slug] = info
        elif status == "built":
            built_count += 1
            index[slug] = info

    # 표지가 있는 슬러그만 index.json 에 기록 (없는 건 _missing.json 이 담당)
    with open(os.path.join(COVERS_DIR, "index.json"), "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=0, sort_keys=True)

    with open(os.path.join(COVERS_DIR, "_missing.json"), "w", encoding="utf-8") as f:
        json.dump(sorted(missing), f, ensure_ascii=False, indent=0)

    sizes = [v["bytes"] for v in index.values()]
    total = sum(sizes)
    sizes_sorted = sorted(sizes)
    n = len(sizes_sorted)
    median = sizes_sorted[n // 2] if n else 0
    mx = sizes_sorted[-1] if n else 0

    print(f"total slugs       : {len(slugs)}")
    print(f"built              : {built_count}")
    print(f"skipped (existing) : {skipped_count}")
    print(f"missing (no page)  : {len(missing)}")
    print(f"covers total bytes : {total} ({total/1024:.1f} KB / {total/1024/1024:.2f} MB)")
    print(f"cover size median  : {median} bytes")
    print(f"cover size max     : {mx} bytes")


if __name__ == "__main__":
    main()
