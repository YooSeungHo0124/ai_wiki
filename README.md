# Attention 시각화 — LLM은 어떻게 다음 단어를 고르는가

GPT(decoder-only Transformer)의 forward pass를 **단계별 애니메이션 + 한국어 설명**으로
따라가는 인터랙티브 학습 사이트입니다.

1. **모든 숫자가 진짜입니다.** 데모용으로 꾸며 넣은 값이 하나도 없습니다.
   이 저장소에 포함된 초소형 GPT(`TinyGPT`, 파라미터 15,168개)를 실제로 학습시킨 뒤,
   그 가중치로 브라우저에서 forward pass를 그대로 다시 계산해 화면에 그립니다.
2. **해석 가능한 attention을 보여주는 예시 문장**을 쓰도록 학습 데이터를 설계했습니다.

## 무엇을 볼 수 있나

예시 문장:

> 고양이가 · 부엌에서 · 생선을 · 맛있게 → **?**

모델은 마지막 자리의 동사를 맞혀야 합니다. 학습 코퍼스는 **동사가 목적어로만 결정되고
주어로는 결정되지 않도록** 설계되어 있어서, 모델은 문제를 풀기 위해 반드시
"생선을"이라는 목적어를 다시 쳐다봐야 합니다.

실제로 **layer 0 · head 2**가 마지막 위치에서 주의력의 **86%**를 "생선을"에 씁니다.
attention이 무슨 일을 하는지 숫자로 직접 확인할 수 있습니다.

## 목차 (18장)

| # | 장 | 다루는 것 |
|---|---|---|
| 01 | 전체 흐름 | 파이프라인 조감도 |
| 02 | Tokenization | 문장 → 토큰 → token ID |
| 03 | Embedding | token embedding + positional embedding, residual stream |
| 04 | LayerNorm | 평균/분산 정규화, γ·β, pre-LN |
| 05 | Query · Key · Value | `x @ W_qkv` 행렬곱 (셀 hover 인터랙션) |
| 06 | Multi-Head | 24차원 → 8차원 × 3 head |
| 07 | Attention Score | `Q·Kᵀ / √d_head` (셀 클릭 시 내적 분해) |
| 08 | Causal Mask | 미래 토큰 −∞ 마스킹 |
| 09 | Softmax | 점수 → attention weight, 히트맵 |
| 10 | Value 가중합 | attention의 본체 한 줄 |
| 11 | Head 합치기 · Residual | concat → `W_o` → `x ← x + attn_out` |
| 12 | MLP | 24 → 96 (GELU) → 24 |
| 13 | Block 쌓기 | layer 0 vs layer 1 비교, 실제 GPT 규모 비교표 |
| 14 | Unembedding | weight tying, logits |
| 15 | Temperature | softmax와 확신의 세기 (슬라이더) |
| 16 | Sampling | greedy / pure / top-k / top-p (주사위 굴리기) |
| 17 | KV Cache | autoregressive 생성과 캐시 재사용 |
| 18 | 종합 실습 | 문장을 바꿔 가며 attention과 예측 관찰 |

## 로컬에서 보기

정적 파일뿐이라 빌드가 필요 없습니다. 다만 브라우저 보안 정책 때문에
`file://` 대신 간단한 HTTP 서버로 여는 것을 권합니다.

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## GitHub Pages 로 배포하기

```bash
git init
git add .
git commit -m "Attention 시각화 사이트"
git branch -M main
git remote add origin https://github.com/<사용자명>/<저장소명>.git
git push -u origin main
```

그 다음 저장소 **Settings → Pages → Build and deployment**에서
Source를 `Deploy from a branch`, 브랜치를 `main` / `(root)`로 지정하면
`https://<사용자명>.github.io/<저장소명>/` 에서 열립니다.

`.nojekyll` 파일이 포함되어 있어 Jekyll 처리를 건너뜁니다.

> 정적 파일을 수정한 뒤 브라우저에 반영이 안 되면 `index.html` 안의
> `?v=3` 쿼리 값을 올려 주세요. 캐시 무효화용입니다.

## 모델을 다시 학습시키려면

`numpy`만 있으면 됩니다 (PyTorch 불필요 — 학습에 필요한 최소한의 autograd를 직접 구현했습니다).

```bash
cd train
python3 train_tiny_gpt.py     # 약 40초, data/weights.js 를 다시 생성
```

어휘·문장 틀·모델 크기는 `train/train_tiny_gpt.py` 상단에서 바꿀 수 있습니다.
`d_model`, `n_head`, `n_layer`를 바꾸면 사이트는 자동으로 새 설정을 따라갑니다
(다만 챕터별 그림 좌표는 4토큰 / 3head 기준으로 맞춰져 있어 조정이 필요할 수 있습니다).

## 파일 구조

```
index.html            페이지 뼈대
css/style.css         테마(다크/라이트) · 레이아웃 · SVG 스타일
data/weights.js       학습된 가중치 (자동 생성, 약 125KB)
js/model.js           forward pass — 모든 중간 텐서를 기록해서 반환
js/viz.js             SVG 프리미티브 (행렬 · 막대 · 칩 · 화살표 · 색상 스케일)
js/chapters1.js       1~10장
js/chapters2.js       11~18장
js/app.js             챕터 이동 · 컨트롤 · 상태 관리
train/autograd.py     numpy 기반 미니 autograd
train/train_tiny_gpt.py  학습 스크립트 + 가중치 내보내기
```

## 조작

- `←` / `→` 방향키로 챕터 이동
- 오른쪽 위 `◐` 버튼으로 라이트/다크 테마 전환
- URL 해시(`#softmax` 등)로 특정 장에 바로 링크 가능

## 라이선스

MIT
