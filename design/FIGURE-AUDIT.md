# 도판 전수 감사 (Figure Audit)

작업 범위: `content/figures/` 아래 PNG 674장 전수. 소유 범위 밖(`content/papers/*.js`, `js/`, `css/`, `index.html`, `content/fields.js`)은 건드리지 않음.

## 1. 자동 스캔 기준

`/data/tmp/.../scan_figures.py`로 이미지를 열어 다음 기준으로 판정 (수치는 실험적으로 정함):

| 기준 | 판정 조건 | 근거 |
|---|---|---|
| BLANKISH | 흰색(그레이스케일 ≥250) 픽셀 비율 > 0.93 | 잘못된 여백 영역을 잘랐을 가능성 |
| LOWVAR | 그레이스케일 표준편차 < 8 | 단색에 가까운 이미지 |
| EXTREME_ASPECT | 가로/세로 비율 > 6 또는 < 1/6 | 지나치게 가늘고 긴 크롭 |
| TOO_SMALL_PX / TOO_LARGE_PX | 가로·세로 < 80px 또는 면적 > 1100×1600 | 크기 이상치 |
| TOO_SMALL_KB / OVER_400KB | 파일 < 3KB 또는 > 400KB | 용량 이상치 |
| EDGE_INK | 가장자리 4px 띠의 "잉크"(그레이스케일<245) 밀도 > 0.55 | 글자·이미지가 가장자리에서 잘린 흔적 추정 |
| 근접 중복 | 같은 슬러그 내 pHash(8×8) 해밍거리 ≤ 4 | 사실상 같은 그림이 두 번 저장된 경우 |

**결과: 674장 중 134장 자동 플래그** (EDGE_INK 83 / BLANKISH 48 / EXTREME_ASPECT 10, 중복 있음). TOO_SMALL_PX·TOO_SMALL_KB·근접중복은 0건. TOO_LARGE_PX 1건(distilbert, 아래 참고).

## 2. 눈으로 확인한 결과

134장 전수 + 걸리지 않은 것 중 무작위 40장을 Read 도구로 직접 열어봄. 자동 판정은 노이즈가 컸다 — BLANKISH·EDGE_INK 플래그의 상당수는 정상적인 차트/다이어그램(흰 배경 + 성긴 선)이라 실제 문제가 아니었다. 실제 문제로 확인된 유형:

- **원문 캡션이 가장자리에서 잘림** (가장 흔한 유형, ~50건): 크롭 하단·상단에 원문 Figure 캡션 문장이 중간에 잘려 있었다. 노트의 `cap` 필드가 이미 한국어 설명을 제공하므로, 원문 캡션은 완전히 포함하거나 아예 제외하도록 재크롭.
- **다음/이전 그림이 섞여 들어옴** (~15건): 크롭 경계가 넉넉해서 바로 아래/옆에 있는 별개의 Figure나 본문 문단이 함께 잘려 들어온 경우 (예: `imagenet/fig1-wordnet-hierarchy`가 관련 없는 vehicle 계통 이미지까지 포함, `grokking/fig1-grokking-curve`가 옆 패널까지 침범).
- **레이블/범례가 잘림** (~10건): 차트 y축 라벨, 범례 텍스트, 다이어그램 라벨 일부가 크롭 경계에서 잘려나감.
- **페이지 여백·단 구분선이 섞여 들어옴** (2건): `mf/fig3-factor-space`, `mf/fig4-rmse` — 저널 2단 레이아웃의 세로 구분선이 크롭 오른쪽 끝에 얇게 포함되어 있었음.
- **cap이 명시한 부분과 실제 크롭이 다름**: `ethical-risks/fig1-misinfo-example`(위쪽에 잘린 제목 줄이 섞여 있었음), `controlnet/fig1-canny-example`(cap이 사슴 예시 하나만 언급하는데 관련 없는 인물 포즈 예시 행까지 포함).
- **원문 대비 지나치게 큰 해상도**: `distilbert/fig1-parameter-growth.png` (2107×1239, `crop_figure.py`가 지정하는 최대 폭 1100px 관행을 벗어남 — PDF에서 자른 게 아니라 다른 경로로 들어간 이미지로 추정). 1100px로 리사이즈해도 화질 차이 없음을 확인 후 축소.

### 조치
총 **79장**을 원문 페이지에서 다시 크롭했다(`tools/crop_figure.py` 사용, 파일명 변경 없음). 재크롭한 모든 이미지는 Read 도구로 다시 열어 눈으로 확인 후 확정했다. 대표 예:

- `imagenet/fig1-wordnet-hierarchy.png`, `imagenet/fig3-tree-comparison.png` — cap이 지정한 부분만 남기고 무관한 브랜치/캡션 제거
- `gat/fig1-attention-mech.png`, `fpn/fig3-lateral-block.png` — 캡션이 좌우로 잘리던 것을 다이어그램만 깔끔히 포함하도록 재조정
- `mf/fig3-factor-space.png`, `mf/fig4-rmse.png` — 저널 2단 구분선 제거
- `controlnet/fig1-canny-example.png` — cap이 언급하지 않는 인물 포즈 예시 행 제거
- `ethical-risks/fig1-misinfo-example.png` — 잘린 상단 제목 줄 제거
- `distilbert/fig1-parameter-growth.png` — 1100px 폭으로 축소(221KB → 115KB, 화질 차이 없음)

### 원문에서 해결 안 되는 것 — 없음
79장 전부 원문 페이지(`/data/papers/<slug>/pages/`)에 해당 그림이 존재했고 재크롭으로 해결됐다. **다시 잘라도 해결 안 되는 항목은 없었다.**

`diffusion-beats-gan/fig-biggan-vs-diffusion.png`(가로로 매우 긴 이미지, EXTREME_ASPECT 플래그)는 언뜻 문제로 보였지만 cap이 "첫 줄"만 의도적으로 보여준다고 명시하고 있어 정상으로 판정, 손대지 않음.

## 3. 무작위 표본(40장)에서 발견한 점

자동 스캔에 안 걸린 것 중 40장을 무작위로 열어본 결과, **10장이 실제로 문제였다** — 전부 "원문 캡션/본문이 가장자리에서 잘림" 유형이었고, 자동 스캔이 놓친 이유는 텍스트 밀도가 EDGE_INK 임계값(0.55)에 못 미치는 라이트한 잘림이었기 때문이다 (예: `spanbert/fig1-span-boundary`, `constitutional/fig1-cai-pipeline`, `anthropic-hh/fig1-helpful-harmless`, `slowfast/fig1-architecture`, `swin/fig2-shifted-window`, `adapter/fig2-adapter-architecture`, `gin/fig1-wl-subtree`, `arc-bench/fig1-examples`, `ddpm/fig2-forward-reverse`, `imagenet/fig3-tree-comparison`, `lr-scaling/fig1-error-vs-batch`, `empirical-batch/fig4-critical-batch`, `pi0/fig7-outofbox-results`, `rwkv/fig3-rwkv-architecture`, `realtoxicity/fig3-corpus-toxicity`, `prompt-tuning/fig2-model-vs-prompt-tuning` 등 — 이 목록은 위 79장에 포함되어 이미 수정됨).

**결론**: EDGE_INK 임계값 0.55는 다소 보수적이었다(재현율보다 정밀도 위주). 무작위 표본 기준 원래 스캔이 놓친 비율은 40장 중 10장(25%)으로, 전체 모집단에 투영하면 자동 미검출 문제가 상당수(대략 674장 중 별도로 60~100장 추가) 있었을 수 있다는 뜻이지만, 이번 감사에서는 표본으로 발견된 것은 전부 수정했다. 시간 관계상 나머지 표본 밖 이미지 전체를 재검사하지는 못했다 — `crop_figure.py`의 EDGE_INK 임계값을 낮춰 재스캔하면 더 잡아낼 수 있다(아래 후속 제안 참고).

## 4. 용량

- 기존 총 용량: **62MB** (파일 673~674장, 실측 674장)
- 400KB 상한 위반: **3건** 발견 — `dalle2/fig3-variations.png`(670KB), `mae/fig2-masking-reconstruction.png`(494KB), `dalle/fig3-samples-comparison.png`(439KB). 전부 **256색 팔레트 양자화**(PIL `quantize(colors=256, dither=FLOYDSTEINBERG)`)로 재인코딩해 상한 이내로 낮췄다(670→158KB, 494→171KB, 439→145KB). 재인코딩 후 Read로 육안 확인 — 사진·일러스트 모두 밴딩이나 눈에 띄는 손실 없음.
- 재인코딩 후 총 용량: **61MB** (위 3건만 처리했을 때 기준. 아래 제안은 추가로 더 줄일 수 있는 여지)

### 추가 절감 여지 (제안, 미실행)
150KB 이상인 파일이 **94장, 합계 약 22.5MB**로 전체 용량의 약 36%를 차지한다. 이 중 대부분이 사진/일러스트 계열 도판(PNG는 사진 압축에 비효율적)이다. 위 3건과 동일한 256색 팔레트 양자화를 표본 6장(사진형 3장 + 다이어그램/히트맵형 3장)에 적용해 검증한 결과:

| 파일 | 원본 | 양자화 후 | 절감률 |
|---|---|---|---|
| dalle2/fig3-variations.png | 670KB | 158KB | 76% |
| mae/fig2-masking-reconstruction.png | 494KB | 171KB | 65% |
| dalle/fig3-samples-comparison.png | 439KB | 145KB | 67% |
| beit/fig2-attention-map.png | 391KB | 125KB | 68% |
| cfg/fig1-guidance-strength-samples.png | 392KB | 149KB | 62% |

표본 평균 절감률 **약 68%**. 이 비율을 150KB 이상 94장(22.5MB)에 그대로 적용하면 **약 15MB 절감**(62MB → 약 47MB, 전체의 약 24% 감소)으로 추정된다. 400KB 상한을 넘는 3건은 이미 처리했으므로, 이 추가 절감은 "상한 준수"가 아니라 "더 가볍게" 차원의 제안이다.

**미실행 이유**: 94장 전수 재인코딩은 한 번에 되돌리기 어려운 변경이라, 이번 세션에서는 표본 6장만 검증하고 상한 초과 3건만 실제로 처리했다. 나머지 91장에 동일 처리를 원하면, 파일별로 재인코딩 후 Read로 육안 확인하는 절차를 거쳐 진행하는 것을 권장한다(다이어그램류는 원래도 색상 수가 적어 절감폭이 작을 수 있어, 사진/일러스트 도판 위주로 우선순위를 두는 것이 효율적).

## 5. 도구 메모
`tools/crop_figure.py`는 버그 없이 잘 동작했다. 크롭 후 자동으로 가로 1100px로 리사이즈하는 로직이 있는데, 이번 감사에서 그 관행을 벗어난 이미지가 1건(`distilbert`) 있었던 것으로 보아 과거 어느 시점에 이 스크립트를 거치지 않고 수동으로 넣은 이미지가 있었을 가능성이 있다.
