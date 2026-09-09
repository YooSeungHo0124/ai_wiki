# AI Wiki — 인공지능 논문 계보

> 인공지능 작업하면서 자주 다시 보지 않으면 흐릿해지는 개념들을, claude code 바이브코딩으로
> 시각화하고 예제를 만들어 두면 나중에 확인할 때 이해가 빠를 것 같아서 시작한 repo다.
> 처음엔 Attention 한 편을 시각화하는 테스트였는데, 쓸모가 있어서 인공지능 전 분야의
> 논문 계보를 쌓는 개인 위키로 키우고 있다.

접속 : https://yooseungho0124.github.io/ai_wiki/
Attention 심층 시각화 : https://yooseungho0124.github.io/ai_wiki/deep/attention/

정적 파일뿐이고 빌드가 없습니다. `index.html` 을 열면 끝입니다.

## 무엇이 있나

- **전체 계보도** — 150편을 연도(가로축) × 분야(레인)에 배치하고, 논문 사이의
  직접적인 영향 관계를 화살표로 그린 지도. 상자를 누르면 해당 논문으로 이동합니다.
- **분야별 페이지** — 분야 안을 다시 트랙(예: `CNN 백본` / `객체 탐지` / `분할` / `ViT` /
  `자기지도`)으로 나눈 계보도와 논문 목록.
- **논문 노트** — 논문 한 편당 한 페이지. 아래 순서로 고정된 틀을 씁니다.

  | 절 | 내용 |
  |---|---|
  | 한 줄 요약 | 이 논문이 바꾼 것 |
  | 그 전까지의 문제 | 논문 직전의 기술 상황과 병목 |
  | 핵심 아이디어 | 3~5개, 메커니즘 수준으로 |
  | 구조 한눈에 | 선언형 다이어그램 (flow / stack / compare / loop / split / matrix) |
  | 수식으로 | 논문의 뼈대가 되는 식 1~3개와 해설 |
  | 숫자로 보기 | 논문에 실제로 나오는 수치 |
  | 무엇이 바뀌었나 | 분야에 남긴 영향 |
  | 이후로 이어진 것 | 후속 계보로 가는 링크 |
  | 흔한 오해 · 함정 | 실무자가 자주 틀리는 지점 |
  | 계보 | 부모/자식 논문 (인덱스에서 자동 생성) |

- **원문 그림과 인용** — 논문 한 편당 원문 PDF에서 직접 잘라낸 그림 1~3장과 짧은 인용이
  출처(몇 쪽 Figure 몇)와 함께 들어 있습니다. 원문 대신 읽는 개인 학습 노트이므로,
  글로 설명하기 어려운 구조도와 결과 그래프는 원문 그림을 그대로 봅니다.
  현재 150편 중 145편에 그림 204장이 들어가 있습니다.
- **수식** — KaTeX로 조판됩니다. 저장소에 포함돼 있어 외부 CDN에 의존하지 않습니다.

- **Attention 심층 시각화** — `Attention Is All You Need` 페이지에는 별도의
  인터랙티브 사이트(`deep/attention/`)가 연결돼 있습니다. 실제로 학습시킨
  초소형 GPT(파라미터 15,168개)의 forward pass를 18장에 걸쳐 한 단계씩,
  **모든 숫자를 실제 계산 값으로** 보여줍니다.

## 분야 구분

| 분야 | 트랙 |
|---|---|
| 기초 · 학습 알고리즘 | 학습의 발명 / 깊게 쌓기 위한 장치 / 데이터와 벤치마크 |
| 컴퓨터 비전 | CNN 백본 / 객체 탐지 / 분할 / Vision Transformer / 자기지도 |
| 언어 표현 (Transformer 이전) | 단어 표현 / 시퀀스 모델링 |
| Transformer · LLM | 아키텍처 원점 / 사전학습 / 스케일링 / 정렬 / 오픈 웨이트 |
| 효율 · 시스템 | attention 개조 / PEFT / 양자화 / 학습·서빙 / SSM |
| 생성 모델 | GAN / VAE / Diffusion / 3D |
| 멀티모달 · VLM | 대조학습 / VLM / 음성 |
| 강화학습 | 가치 기반 / 정책 경사 / 탐색+학습 / RLHF |
| 추론 · 도구 · 검색 | 추론 유도 / 에이전트 / RAG |
| 해석 · 평가 · 안전 | 내부 해석 / 벤치마크 / 안전 |

## GitHub Pages

`.nojekyll` 이 있어 별도 설정 없이 배포됩니다. 저장소 **Settings → Pages** 에서
Source 를 `Deploy from a branch`, 브랜치를 `main` / `(root)` 로 지정하면 됩니다.

## 로컬에서 보기

```bash
python3 -m http.server 8000
# http://localhost:8000
```

논문 본문은 페이지를 열 때 `content/papers/<slug>.js` 를 그때 불러옵니다
(150개를 미리 다 받지 않습니다). 그래서 `file://` 이 아니라 HTTP 서버로 여세요.

## 파일 구조

```
index.html               셸 (상단바 · 검색 · 라우팅 컨테이너)
css/tokens.css           디자인 토큰 (색·타이포·간격) — 이 파일만 갈아끼우면 전체 톤이 바뀐다
css/wiki.css             레이아웃 · 컴포넌트
css/diagram.css          다이어그램 스타일
content/fields.js        분야·트랙 정의 + 논문 인덱스(계보 그래프의 원본)
content/papers/<slug>.js 논문 한 편의 내용 (WIKI.paper({...}) 객체 하나)
content/figures/<slug>/  원문에서 발췌한 그림 (PDF에서 잘라낸 PNG)
content/graph.json       사전 계산된 인덱스 — 백링크·성장단계·태그 (tools/build-graph.js 산출물)
js/wiki/core.js          레지스트리 · 지연 로딩 · 인라인 마크업 · KaTeX 래퍼
js/wiki/diagram.js       선언형 다이어그램 → HTML 렌더러
js/wiki/graph.js         계보도(연도축 × 레인) · 논문별 로컬 그래프
js/wiki/app.js           해시 라우터 · 홈/분야/논문 뷰 · 검색
vendor/katex/            수식 조판 (저장소에 포함 — 외부 CDN 의존 없음)
tools/check.js           문법·스키마·링크·라벨 길이 검증
tools/build-graph.js     content/graph.json 생성
tools/fetch_paper.py     논문 원문 PDF 수집 → /data/papers/<slug>/
tools/crop_figure.py     페이지에서 그림 영역을 잘라 content/figures/ 에 저장
deep/attention/          Attention 인터랙티브 시각화 (독립 사이트)
AUTHORING.md             논문 노트 작성 규격 (v2)
design/                  UX 스펙 · 디자인 시스템 · 그래프 인터랙션 스펙
```

## 논문 추가하기

1. `content/fields.js` 의 `WIKI.INDEX` 에 한 줄 추가
   `['slug', 연도, '원제', '통칭', '분야id', '트랙id', ['부모slug', ...]]`
   — 계보도와 부모/자식 링크는 여기서 자동으로 만들어집니다.
2. 원문을 받습니다: `python3 tools/fetch_paper.py <slug>`
   → `/data/papers/<slug>/` 에 PDF · 본문 텍스트 · 페이지 PNG가 생깁니다(저장소 밖 캐시).
3. `content/papers/<slug>.js` 작성. 규격은 `AUTHORING.md`, 예시는 `content/papers/transformer.js`.
4. 그림은 페이지 PNG를 보고 잘라 넣습니다:
   `python3 tools/crop_figure.py <slug> 3 0.10 0.32 0.92 0.58 fig1-architecture`
5. 검증하고 인덱스를 다시 만듭니다:
   `node tools/check.js && node tools/build-graph.js`

## 조작

- `/` 키로 검색, `↑` `↓` 로 이동, `Enter` 로 열기
- 오른쪽 위 `◐` 버튼으로 라이트/다크 테마 전환
- 주소 해시로 바로 링크: `#/f/vision`(분야), `#/p/resnet`(논문)

## 라이선스

MIT. 논문 원문의 저작권은 각 저자에게 있으며, 이 위키는 요약과 해설입니다.
