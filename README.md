# AI Wiki — 인공지능 논문 계보

[![Pages 배포 상태](https://github.com/YooSeungHo0124/ai_wiki/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/YooSeungHo0124/ai_wiki/actions/workflows/pages/pages-build-deployment)
[![사이트](https://img.shields.io/badge/site-yooseungho0124.github.io%2Fai__wiki-2ea44f)](https://yooseungho0124.github.io/ai_wiki/)
[![마지막 커밋](https://img.shields.io/github/last-commit/YooSeungHo0124/ai_wiki)](https://github.com/YooSeungHo0124/ai_wiki/commits/main)
[![라이선스](https://img.shields.io/badge/license-MIT-blue)](#라이선스)

| | |
|---|---|
| **접속** | https://yooseungho0124.github.io/ai_wiki/ |
| **Attention 심층 시각화** | https://yooseungho0124.github.io/ai_wiki/deep/attention/ |
| **배포** | GitHub Pages — `main` 브랜치 `/(root)` 를 그대로 서빙 (GitHub Actions 의 `pages-build-deployment` 가 push 마다 실행) |
| **저장소** | https://github.com/YooSeungHo0124/ai_wiki |

> 인공지능 작업하면서 자주 다시 보지 않으면 흐릿해지는 개념들을, Claude Code 바이브코딩으로
> 시각화하고 예제를 만들어 두면 나중에 확인할 때 이해가 빠를 것 같아서 시작한 저장소입니다.
> 처음엔 Attention 한 편을 시각화하는 테스트였는데, 쓸모가 있어서 인공지능 전 분야의
> 논문 계보를 쌓는 개인 위키로 키우고 있습니다.

정적 파일뿐이고 빌드가 없습니다. `index.html` 을 열면 끝입니다.

## 무엇이 있나

- **전체 계보도** — 논문 수백 편을 연도(가로축) × 분야(레인)에 배치하고, 논문 사이의
  직접적인 영향 관계를 화살표로 그린 지도. 상자를 누르면 해당 논문으로 이동합니다.
- **서가(shelf) 뷰** — 논문을 표지(`content/covers/`)가 있는 책장으로 훑어보는 화면.
- **분야별 페이지** — 분야 안을 다시 트랙(예: `CNN 백본 계보` / `객체 탐지` / `분할` /
  `Vision Transformer` / `자기지도 학습`)으로 나눈 계보도와 논문 목록.
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

- **개념 사전** — "temperature 가 뭔가" 처럼 논문 계보로는 답할 수 없는 용어를 따로 모은
  사전(`#/concepts`). 논문 노트가 "이 논문이 무엇을 했는가"를 쓴다면, 개념 노트는
  "이 말이 무슨 뜻인가"에 답하고 관련 논문으로 연결합니다. 규약은 `AUTHORING-CONCEPTS.md`.
- **원문 그림과 인용** — 대부분의 논문에 원문 PDF에서 직접 잘라낸 그림과 짧은 인용이
  출처(몇 쪽 Figure 몇)와 함께 들어 있습니다. 원문 대신 읽는 개인 학습 노트이므로,
  글로 설명하기 어려운 구조도와 결과 그래프는 원문 그림을 그대로 봅니다.
- **수식** — KaTeX로 조판됩니다. 저장소에 포함돼 있어 외부 CDN에 의존하지 않습니다.
- **Attention 심층 시각화** — `Attention Is All You Need` 페이지에는 별도의
  인터랙티브 사이트(`deep/attention/`)가 연결돼 있습니다. 실제로 학습시킨
  초소형 GPT(파라미터 15,168개)의 forward pass를 18장에 걸쳐 한 단계씩,
  **모든 숫자를 실제 계산 값으로** 보여줍니다.

## 분야 구분

분야 21개, 아래는 각 분야의 트랙입니다. 정의의 원본은 `content/fields.js` 입니다.

| 분야 | 트랙 |
|---|---|
| 기초 · 학습 알고리즘 | 학습의 발명 / 깊게 쌓기 위한 장치 / 데이터와 벤치마크 / 전이 · 도메인 적응 / 메타 학습 · 연속 학습 |
| 컴퓨터 비전 | CNN 백본 계보 / 객체 탐지 / 분할 / Vision Transformer / 자기지도 학습 / 포즈 · 깊이 · 흐름 / 3D 인지 · 자율주행 / 다중 객체 추적 (MOT) / 단일 객체 · 비디오 객체 추적 / 점 추적 (Tracking Any Point) |
| 언어 표현 (Transformer 이전) | 단어 표현 / 시퀀스 모델링 |
| Transformer · 대규모 언어모델 | 아키텍처 원점 / 사전학습 패러다임 / 스케일링 법칙 / 정렬 · 지시 학습 / 오픈 웨이트 모델 / 긴 문맥 |
| 효율 · 시스템 | attention 개조 / 파라미터 효율 미세조정 / 양자화 · 압축 / 지식 증류 / 학습 · 서빙 시스템 / attention 대안 (SSM) / 구조 탐색(NAS) |
| 생성 모델 | GAN 계보 / VAE · 이산 잠재 / Diffusion 계보 / 3D · 뉴럴 렌더링 |
| 멀티모달 · VLM | 대조학습 정렬 / Vision-Language 모델 |
| 강화학습 | 가치 기반 / 정책 경사 / 탐색 + 학습 / 사람 피드백 · LLM RL / 세계 모델 |
| 추론 · 도구 · 검색 | 추론 유도 / 도구 · 에이전트 |
| 해석 · 평가 | 내부 해석 / 벤치마크 / 설명가능성(XAI) / 불확실성 · 분포 밖 탐지 |
| 음성 · 오디오 | 음성 인식 / 음성 합성 / 뉴럴 코덱 · 오디오 LM / 음악 생성 |
| 그래프 신경망 | 그래프 임베딩 / 그래프 합성곱 / 표현력 · Transformer |
| 정형 데이터 · 시계열 | 그래디언트 부스팅 / 표를 위한 딥러닝 / 시계열 예측 |
| 추천 시스템 | 협업 필터링 / 딥러닝 추천 / 순차 추천 |
| 정보검색 · 임베딩 | 밀집 검색 · RAG / 문장 임베딩 / 후기 상호작용 · 희소 / 벡터 인덱스 |
| 코드 AI | 코드 사전학습 / 평가 / 소프트웨어 에이전트 |
| 비디오 · 시공간 | 비디오 이해 / 비디오 생성 |
| 로보틱스 · 구현 AI | 모방학습 정책 / 비전-언어-행동 모델 |
| 과학을 위한 AI | 생명 · 단백질 / 물리 · 기상 / 수학 · 재료 / 의료 영상 |
| 데이터 중심 AI | 대규모 코퍼스 / 정제 · 선별 / 합성 데이터 |

## 배포 (GitHub Pages)

저장소 **Settings → Pages** 에서 Source 를 `Deploy from a branch`, 브랜치를 `main` / `(root)` 로
지정합니다. `.nojekyll` 이 있어 별도 설정 없이 배포되고, 별도 워크플로 파일은 없습니다.
배포 상태는 맨 위 배지(또는 저장소의 **Actions** 탭)에서 확인합니다.

## 로컬에서 보기

```bash
python3 -m http.server 8000
# http://localhost:8000
```

논문 본문은 페이지를 열 때 `content/papers/<slug>.js` 를 그때 불러옵니다
(전부 미리 받지 않습니다). 그래서 `file://` 이 아니라 HTTP 서버로 여세요.

## 파일 구조

```
index.html               셸 (상단바 · 검색 · 라우팅 컨테이너)
css/tokens.css           디자인 토큰 (색·타이포·간격) — 이 파일만 갈아끼우면 전체 톤이 바뀐다
css/wiki.css             레이아웃 · 컴포넌트
css/diagram.css          다이어그램 스타일
content/fields.js        분야·트랙 정의 + 논문 인덱스(계보 그래프의 원본)
content/concepts.js      개념 사전 인덱스 (슬러그·그룹·난이도·관련 논문)
content/papers/<slug>.js 논문 한 편의 내용 (WIKI.paper({...}) 객체 하나)
content/concepts/<slug>.js 개념 한 개의 내용 (WIKI.concept({...}))
content/figures/<slug>/  원문에서 발췌한 그림 (PDF에서 잘라낸 PNG)
content/covers/          서가 뷰용 논문 표지 (webp)
content/graph.json       사전 계산된 인덱스 — 백링크·태그 (tools/build-graph.js 산출물)
content/search-index.json 검색 인덱스 (tools/build-search-index.js 산출물)
content/meta.json        논문별 저자 · arXiv ID · 발표일 (tools/fetch_authors.py 산출물)
js/wiki/core.js          레지스트리 · 지연 로딩 · 인라인 마크업 · KaTeX 래퍼
js/wiki/diagram.js       선언형 다이어그램 → HTML 렌더러
js/wiki/graph.js         계보도(연도축 × 레인) · 논문별 로컬 그래프
js/wiki/graphview.js     전체 그래프 화면
js/wiki/shelf.js         서가 뷰
js/wiki/cover.js         표지 로딩
js/wiki/app.js           해시 라우터 · 홈/분야/논문/개념 뷰 · 검색
vendor/katex/            수식 조판 (저장소에 포함 — 외부 CDN 의존 없음)
tools/                   검증 · 산출물 생성 · 원문 수집 스크립트 (아래 표)
deep/attention/          Attention 인터랙티브 시각화 (독립 사이트)
AUTHORING.md             논문 노트 작성 규격
AUTHORING-CONCEPTS.md    개념 노트 작성 규격
design/                  UX 스펙 · 디자인 시스템 · 그래프 인터랙션 스펙 · 접근성/다크/그림 감사 보고서
```

### tools/

| 스크립트 | 용도 |
|---|---|
| `check.js` | 논문 노트의 문법·스키마·링크·라벨 길이 검증 |
| `check-concepts.js` | 개념 노트 검증 |
| `build-graph.js` | `content/graph.json` 생성 |
| `build-search-index.js` | `content/search-index.json` 생성 |
| `build_covers.py` | 서가용 표지 생성 |
| `fetch_paper.py` | 논문 원문 PDF 수집 → `/data/papers/<slug>/` |
| `fetch_authors.py` | 저자 · arXiv 메타데이터 수집 → `content/meta.json` |
| `crop_figure.py` | 페이지에서 그림 영역을 잘라 `content/figures/` 에 저장 |
| `verify_figures.py` · `verify_numbers.py` · `verify_quotes_meta.py` | 그림 · 수치 · 인용이 원문과 맞는지 대조 |
| `mine_refs.py` · `find_missed_links.js` | 후보 논문 발굴 · 본문에서 놓친 링크 찾기 |

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
   `node tools/check.js && node tools/build-graph.js && node tools/build-search-index.js`

개념 노트는 `content/concepts.js` 의 행을 따라 `content/concepts/<slug>.js` 를 쓰고
`node tools/check-concepts.js` 로 검증합니다.

## 조작

- `/` 키로 검색, `↑` `↓` 로 이동, `Enter` 로 열기
- 검색창에서 필터 문법 사용: `field:llm` `track:attn` `year:>=2023` `parents:0` `children:>=3` `note:no`
  (자유어와 섞어 쓸 수 있고 전부 AND)
- 오른쪽 위 `◐` 버튼으로 라이트/다크 테마 전환 (처음엔 OS 설정을 따름)
- 주소 해시로 바로 링크: `#/f/vision`(분야), `#/p/resnet`(논문), `#/concepts`(개념 사전), `#/graph`(전체 그래프)

## 라이선스

코드와 직접 쓴 해설 문서는 MIT 입니다.
`content/figures/` 의 그림과 인용은 논문 원문에서 가져온 것이라 **MIT 대상이 아니며**,
저작권은 각 논문의 저자와 출판사에 있습니다. 이 위키는 개인 학습용 요약과 해설입니다.
