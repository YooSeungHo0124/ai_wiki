# 큰 계보 그래프를 읽히게 만드는 법 — 레퍼런스 조사

작성: 리서처 · 대상: 프론트엔드 구현자, UX/IA 디자이너, 비주얼 디자이너
범위: 홈 하단 전체 계보도(`W.graph`, `js/wiki/graph.js`)가 446편에서 읽히지 않는 문제.
전제: `GRAPH-INTERACTION.md`(클릭=선택, 이동=카드 버튼)와 `DESIGN-SYSTEM.md` §7(그래프 스타일)은 바꾸지 않는다. 이 문서는 **레이아웃·밀도·탐색**만 다룬다.

제약(권고는 전부 이 안에서만 한다):
빌드 없음 · 순수 vanilla JS · **외부 CDN 신규 의존 금지(d3 도입 불가)** · 라이트/다크 양쪽 · 키보드 접근성 · `prefers-reduced-motion` 준수 · 홈 DOM 예산 6,000노드(`A11Y-PERF.md` §2).

---

## 0. 먼저, 우리 데이터가 실제로 얼마나 빽빽한가 (실측)

감이 아니라 숫자로 시작한다. 아래는 `content/fields.js`의 `WIKI.INDEX`를 그대로 읽어
`graph.js`의 레이아웃 상수(`BW=126, BH=40, VGAP=10, PADL=132, PADT=34, YSCALE=142`)와
행 패킹 알고리즘을 그대로 재현해 계산한 값이다.

### 0.1 전체 규모

| 항목 | 값 |
|---|---|
| 노드 | **446** |
| 계보 엣지 | **797** (브리프의 "740"은 옛 수치 — 현재 `INDEX`의 `parents` 합계는 797이고 **끊어진 참조는 0건**) |
| 연도(축 눈금) | **21개** (1958 … 2025) |
| 분야 레인 | **21개** |
| 트랙 | 70개 |
| 평균 차수 | 3.57 |

### 0.2 현재 SVG가 실제로 만들어내는 캔버스

| 항목 | 값 | 의미 |
|---|---|---|
| SVG 크기 | **3,138 × 5,986 px** | 세로가 6,000px에 육박한다 |
| 캔버스 면적 | 18.8 Mpx² | |
| 노드 잉크 비율 | 12.0% | 88%가 빈 공간·엣지인데도 읽히지 않는다 |
| 뷰포트 | `.graph-viewport{overflow:auto; max-height:74vh}` (`css/wiki.css:256`) | 1440×900 화면에서 대략 1,200×660px |
| **한 뷰포트에 보이는 노드** | **8편 / 446편 = 1.8%** | 좌상단 1200×700 기준 |
| 가장 빽빽한 1000×1000px 창 | **82편** | (x≈1700, y≈200) — 2016~2019 구간 상단 |
| SVG 요소 수 | 약 3,100개 | 홈은 책장만으로 이미 4,226~4,306노드(`A11Y-PERF.md`) → 그래프까지 합치면 예산 6,000 초과 |

**핵심**: 문제는 "노드가 겹쳐서" 가 아니다. **한 화면에 1.8%만 보이는데 축소하면 글자가 사라지는 것**이 문제다.
현재 줌은 `wireZoom`(`app.js:122`)이 SVG의 `width/height` 속성만 바꾸는 **순수 기하학적 줌**이고, 하한이 32%다.
32%에서 노드 폭은 126→40px, 11px 라벨은 **3.5px**가 되어 판독 불가능하다. 즉 지금은
"보이지만 못 읽는 축소" 와 "읽히지만 안 보이는 확대" 둘 중 하나만 고를 수 있다.

### 0.3 어디가 빽빽한가 — 연도

```
1958:1 1986:1 1994:1 1997:1 1998:1 2003:1 2009:2 2012:3 2013:7 2014:16 2015:17
2016:30 2017:39 2018:35 2019:43 2020:40 2021:58 2022:61 2023:65 2024:23 2025:1
```

- 1958~2012 = **10편(2.2%)** 인데 축의 **가로 절반(눈금 8/21)** 을 차지한다.
  "논문이 있는 연도만 등간격"이라는 압축이 여기서는 오히려 **역효과**다 — 1958과 1986 사이가
  2022와 2023 사이와 같은 폭이다.
- 2021~2023 = **184편(41%)** 이 눈금 3칸에 몰린다.

### 0.4 어디가 빽빽한가 — 레인

레인별 (편수, 패킹된 행 수, 높이):

| 레인 | 편수 | 행 | 높이 |
|---|---|---|---|
| **llm** | 66 | **15** | **750px** |
| interp | 45 | 8 | 400px |
| vision | 42 | 7 | 350px |
| generative | 40 | 8 | 400px |
| efficiency | 35 | 8 | 400px |
| privacy | 25 | 5 | 250px |
| agent | 16 | **7** | 350px |
| rl | 19 | 4 | 200px |
| recsys | 9 | 2 | 100px |
| (나머지 12개) | 8~16 | 2~5 | 100~250px |

- `llm` 한 레인이 세로 750px — **뷰포트 높이(≈660px)보다 크다**. 레인 하나가 한 화면에 안 들어온다.
- 21개 레인 중 **12개가 편수 16 이하**인데 각자 100~250px씩 세로를 먹는다. 이들이 세로 6,000px의
  절반가량을 차지하면서 정작 정보 밀도는 낮다.
- (분야, 연도) 셀 155개 중 **26개가 5편 이상**. 최대는 `llm|2022 = 15편`.

### 0.5 엣지가 왜 스파게티가 되는가

| 항목 | 값 |
|---|---|
| 세로 이동거리 \|dy\| 중앙값 | 200px |
| \|dy\| p75 / p90 / max | 2,096 / 3,494 / **5,720px** |
| **\|dy\| > 1000px 인 엣지** | **272 / 797 (34%)** |
| 같은 레인 안에서 닫히는 엣지 | 440 / 797 (55%) |
| **5개 레인 이상 건너뛰는 엣지** | **238 / 797 (30%)**, 최대 20레인 |
| 분야를 넘는 엣지 | 357 / 797 (45%) |
| 같은 해 부모→자식 (좌표상 역방향 분기 `x2<x1`) | **140 / 797 (18%)** |
| 엣지의 연도 간격 중앙값 / p90 / max | 2 / 7 / 35년 |

**핵심**: 엣지의 3분의 1이 화면 높이의 몇 배를 세로로 가로지른다. 이건 레이아웃 튜닝으로
없앨 수 있는 게 아니다 — `backprop`(1986, foundations)이 `mamba`·`nerf`·`moe-shazeer`를
낳는 건 데이터의 진실이다. **긴 엣지는 없애는 게 아니라 "평소엔 안 그리고 선택 시에만 그리는"
대상이다.** (§3.4, §5 권고 2)

또 하나: 같은 해 엣지 140개는 `graph.js:57`의 `if(x2<x1)` 분기를 타서 노드 아래/위로
되꺾이는 곡선이 된다. 전체 엣지의 18%가 이 예외 경로다.

### 0.6 차수 분포 — 허브가 극단적으로 소수다

```
차수 히스토그램: 1:49  2:188  3:101  4:44  5:17  6:10  7:6  8:9  9:3  10:3 …
                 15:3  22:1  27:2  32:1  39:1  48:1  51:1
평균 3.57 · 중앙값 2 · p75 3 · p90 6 · p99 27 · 최대 51
차수 ≤2 인 노드: 237 / 446 (53%) · 고립 노드: 0
```

상위 허브(차수): `transformer=51` `gpt3=48` `bert=39` `backprop=32` `lstm=27` `resnet=27`
`clip=22` `ddpm=17` `t5=16` `alexnet=15` `vit=15` `cot=15` `gpt2=14` `instructgpt=13`

자식 수 상위: `transformer=48` `gpt3=46` `bert=36` `backprop=31` `lstm=26` `resnet=24` `clip=19`
부모 수 상위: 최대 **4** (`ldm`). 즉 **in-degree는 사실상 평평하고, 폭발하는 건 out-degree뿐**이다.

**핵심**: 이 그래프는 "고르게 빽빽한 망"이 아니라 **극소수 허브 + 절반이 차수 2 이하인
얇은 꼬리**다. 상위 14개 노드가 엣지의 상당 부분을 만든다. 이건 좋은 소식이다 —
**밀도를 줄이는 가장 싼 방법이 "허브를 특별 취급"하는 것**이라는 뜻이기 때문이다(§5 권고 2·4).

---

## 1. 논문 인용/계보 시각화 도구들 — 무엇을 포기했나

### 1.1 Connected Papers — 노드 수 자체를 포기한다
- 레이아웃: force-directed. 유사한 논문을 끌어당기고 나머지를 밀어낸다. 노드 크기=피인용수, 색=출판연도.
- **후보 풀은 약 5만 편을 분석하지만, 실제로 그리는 건 origin과 가장 강하게 연결된 "few dozen(수십 편)"** 이다.
- 흔히 인용되는 "500개 캡"은 **공식 출처에서 확인되지 않았다 — 미확인**(지어내지 말 것).
- 엣지를 상시 dim 처리하는지, 라벨을 hover에서만 보이는지는 **미확인**. 확인된 건 "노드 선택 시 origin까지의 최단 경로를 강조"한다는 것뿐이다.
- 출처: https://medium.com/connectedpapers/announcing-connected-papers-a-visual-tool-for-researchers-to-find-and-explore-academic-papers-89146a54c7d4 , https://www.connectedpapers.com/about
- **우리가 배울 점 / 배우면 안 될 점**: "수십 개만 그린다"는 건 **탐색 도구**의 답이지 **아카이브**의 답이 아니다. 우리 사이트는 446편 전체가 콘텐츠이고 "전체를 한 장으로"가 홈 섹션의 제목이다(`app.js:548`). **노드 캡은 채택하지 않는다.** 대신 "선택 시 경로만 강조"는 이미 우리가 `GRAPH-INTERACTION.md`로 채택한 것과 같은 방향이다.

### 1.2 Litmaps — 라벨을 포기한다 (겹치면 덜 중요한 쪽을 지운다)
- 기본 뷰가 **X축=출판연도, Y축=피인용수**. 우리와 같은 "시간축 + 의미 있는 세로축" 계열.
- **라벨 규칙: 두 라벨이 겹치면 피인용수가 더 많은 논문의 라벨만 표시한다.** 출판용으로 전부 강제 표시하는 모드는 따로 둔다.
- 인용선(엣지)은 **show/hide 토글**로 사용자가 끌 수 있다.
- 노드 반지름은 피인용수 로그 스케일. "Compact" 모드는 충돌 회피 + 그룹 유지 + 인용선 길이 최소화를 동시에 최적화.
- 출처: https://medium.com/litmaps/guide-to-litmaps-visualisations-95a9bc2cc9de
- **우리가 배울 점**: 라벨 밀도를 **줌 레벨이 아니라 "겹침 감지 + 중요도 순위"** 로 푸는 방식. 우리는 차수(§0.6)가 그대로 중요도 순위가 된다. 엣지 토글도 우리 상황(34%가 초장거리 엣지)에 직접 맞는다.

### 1.3 Open Knowledge Maps — 100편으로 자른다, 그 근거를 명시한다
- **상위 관련 100개 문서만** 지도로 만든다. 근거를 자원 문제가 아니라 **"인지 부하를 관리 가능한 수준으로 유지"** 라고 명시한 드문 사례.
- 파이프라인: 텍스트 유사도 → Ward's method 클러스터링 → non-metric MDS 배치 → 클러스터 라벨은 TF-IDF 상위 3-gram → 클라이언트에서 force 후처리로 겹침 제거.
- Shneiderman의 "Overview first, zoom and filter, then details-on-demand"를 명시적으로 따른다고 밝힌다.
- 출처: https://openknowledgemaps.org/ , 재인용 https://library.hkust.edu.hk/sc/ok-maps/
- **우리가 배울 점**: 숫자를 UX 원칙에서 역산해 문서화하는 태도. 우리도 "레인 하나를 펼쳤을 때 몇 편까지 보일 것인가"를 근거와 함께 못박아야 한다(우리 데이터에서 그 숫자는 최대 레인 66편 = `llm`).

### 1.4 Paperscape — 캡을 두지 않는 대신 라벨을 전부 줌에 위임한다
- arXiv 전체(철회 제외)를 매일 갱신해 넣는다. **노드 캡이 사실상 없다.**
- 레이아웃: N-body 물리. 모든 쌍에 반발력, 인용 쌍에 Hooke 스프링, 비중첩 제약.
- 원 면적=피인용수, 색=arXiv 카테고리, 밝기=논문 나이 — 다만 **개발자들 스스로 "밝기로는 구분이 어렵다"고 인정**한다.
- **라벨은 줌 레벨에 따라 단계적으로 등장**: 먼저 자동 추출 키워드, 더 확대하면 저자까지.
- 엣지 선을 상시 그리는지는 **미확인**(힘 계산에는 쓰인다).
- 출처: https://blog.paperscape.org/?page_id=2
- **우리가 배울 점**: 전량 수록 + 줌 종속 라벨. 이게 우리가 가야 할 노선이다. **배우면 안 될 점**: force 레이아웃(§4.1)과 "밝기로 시간 인코딩"(스스로 실패로 인정).

### 1.5 VOSviewer — 줌 레벨에 라벨을 종속시키고, 밀도가 높으면 노드-링크를 버린다
- 스스로 "수백~수천 노드 규모 탐색용"이라고 표방.
- **줌인하면 라벨을 표시할 노드 집합이 갱신된다** — 줌 종속 라벨을 매뉴얼 차원에서 공식화.
- 가중치 큰 항목일수록 라벨을 크게. 같은 가중치를 density visualization에도 재사용.
- Network / Overlay / **Density(히트맵)** 3가지 뷰를 모드로 제공 — 밀도가 높으면 **노드-링크 표현 자체를 포기**하고 히트맵으로 전환한다.
- 출처: https://www.vosviewer.com/documentation/Manual_VOSviewer_1.6.19.pdf , https://www.vosviewer.com/download/f-x2.pdf
- **우리가 배울 점**: 줌 종속 라벨의 정석. **다만 히트맵 모드는 우리에게 부적합** — 우리 그래프의 목적은 "누가 무엇을 낳았나"라는 개별 경로 추적이지 밀도 분포가 아니다.

### 1.6 Inciteful / CiteSpace — 캡을 "그리기"가 아니라 "수집·전처리"에 건다
- **Inciteful**: seed → depth-1 → depth-2 확장, **depth-2가 15만 편을 넘으면 탐색 중단**. 관련도는 co-citation + bibliographic coupling을 Adamic/Adar로 스코어링, 중요도는 PageRank. (숫자는 검색 발췌로만 확보 — 원문 직접 재확인 실패, **일부 미확인**) 출처: https://help.inciteful.xyz/paper-disovery-explained.html , https://incitefulmed.com/academic/help/graphs-explained.html
- **CiteSpace**: 시간 슬라이스로 먼저 쪼갠 뒤 **Pathfinder Network Scaling(PFNET)으로 엣지를 가지치기**한다. 매뉴얼상 권장 규모는 **슬라이스당 50~500 노드**. 출처: http://cluster.cis.drexel.edu/~cchen/citespace/doc/JASIST_CiteSpace_preprint.pdf
- **우리가 배울 점**: "시간으로 먼저 자르고 구간별로 다룬다"는 분할정복. 우리 데이터에서는 §0.3의 편중(1958~2012=10편 / 2021~2023=184편)이 정확히 이 문제다 — 전역 하나의 축척으로는 양쪽 다 못 맞춘다.
- **배우면 안 될 점**: PFNET 같은 엣지 가지치기. 우리 엣지 797개는 **저자가 손으로 큐레이션한 계보 주장**이지 통계적 잡음이 아니다. 알고리즘으로 지우면 콘텐츠를 지우는 것이다.

### 1.7 Local Citation Network — 우리와 가장 가까운 미니멀 사례
- 노드를 **출판연도 순으로 세로 정렬**(위=최신), 색=연도(또는 저널), **크기 = in-degree + out-degree 합**.
- 상호작용은 스크롤 줌 + 드래그 팬뿐. 노드 캡·라벨 규칙은 **미확인**.
- 출처: https://localcitationnetwork.github.io/ , https://www.leidenmadtrics.nl/articles/local-citation-network-and-citation-gecko-making-literature-discovery-fun
- **우리가 배울 점**: 복잡한 레이아웃 없이 "시간 한 축 + degree 기반 크기"만으로도 계보가 읽힌다. 우리는 이미 시간축이 있으므로 **degree 기반 강조만 추가하면 된다**(§5 권고 4).

### 1.8 ResearchRabbit / Semantic Scholar
- **ResearchRabbit**: Network 뷰와 **Timeline 뷰(X=연도)** 를 사용자가 전환한다. 레이아웃 알고리즘 이름·노드 캡은 공식 문서 접근 실패로 **미확인**. 색 인코딩(컬렉션 포함=초록 등)은 검색 스니펫 기반 — **정확도 미확인**. https://www.researchrabbit.ai/help/guide
- **Semantic Scholar**: 대규모 노드-링크 그래프 화면을 정식 제품으로 제공하지 않는 것으로 보인다. 대신 인용 유형 분류(Background/Methods/Results)와 리스트/카드 UI로 우회한다. 과거 실험적 그래프 뷰 존재 여부는 **미확인**. https://www.semanticscholar.org/faq
- **우리가 배울 점**: 스케일 문제를 정면돌파하지 않고 **구조화된 리스트로 우회**하는 것도 유효한 답이다. 우리 사이트에는 이미 그 우회로가 있다 — 446편 책장(`shelf.js`)과 분야별 트랙 목록. 그래프는 **책장이 못 보여주는 것(연결)만** 책임지면 된다.

### 1.9 표로 요약 — 캡을 어디에 걸었나

| 도구 | 캡 위치 | 라벨 | 엣지 |
|---|---|---|---|
| Connected Papers | 그리는 노드 수(수십) | 미확인 | 선택 시 경로만 강조 |
| Open Knowledge Maps | 그리는 문서 수(100) | 클러스터 라벨(TF-IDF 3-gram) | 클러스터 표현이라 엣지 없음 |
| Litmaps | 없음(명시 미확인) | **겹치면 저인용 쪽 숨김** | **사용자 토글** |
| Paperscape | **없음** | **줌 종속 단계화** | 미확인 |
| VOSviewer | 없음 | **줌 종속 갱신** | pruning 전제 |
| Inciteful | 수집 단계(15만) | 미확인 | 미확인 |
| CiteSpace | 슬라이스당 50~500 | — | **PFNET 가지치기** |
| Local Citation Network | 없음 | 미확인 | 전부 그림 |
| **우리(현재)** | **없음** | **없음(항상 전부)** | **없음(797개 전부)** |

마지막 줄이 문제의 전부다. 우리는 **세 축 모두에서 아무것도 포기하지 않은 유일한 사례**다.

---

## 2. 정보시각화 고전 기법 — 무엇을 얻고 무엇을 치르나

### 2.1 Shneiderman의 만트라 (1996) — 순서가 틀렸다
"Overview first, zoom and filter, then details-on-demand." (*The Eyes Have It: A Task by Data Type Taxonomy for Information Visualizations*, IEEE VL '96)
출처(해설/재인용): https://faculty.cc.gatech.edu/~john.stasko/8001/craft05.pdf , https://jtr13.github.io/cc21/ben-shneidermans-visualization-mantra.html

- **우리 진단**: 우리는 순서가 뒤집혀 있다. 지금은 **detail(라벨 다 붙은 126px 노드)이 기본값**이고 overview가 없다. 100% 줌에서 1.8%만 보인다는 건 "overview 단계가 아예 존재하지 않는다"는 뜻이다.
- 이 만트라가 이 문서 권고 전체의 골격이다: overview(§5 권고 1·3) → zoom·filter(권고 2·3) → details-on-demand(이미 있음 — `GRAPH-INTERACTION.md`의 선택 카드).

### 2.2 Focus+Context / Fisheye / DOI — **개념만 쓰고 왜곡은 버린다**
- Furnas 1986, *Generalized Fisheye Views*: DOI = **API(사전 중요도) − 초점으로부터의 거리**. 이후 모든 focus+context의 뿌리. https://doi.org/10.1145/22339.22342 (PDF: https://cspages.ucalgary.ca/~saul/581/exer.eps/4furnas86.pdf)
- Card & Nation 2002, *Degree-of-Interest Trees*: 공간 제약 하에서 자동 확장/축소. https://faculty.cc.gatech.edu/~stasko/7450/Papers/card-avi02.pdf
- van Ham & Perer 2009, *"Search, Show Context, Expand on Demand"*: DOI를 일반 그래프로 확장. https://perer.org/papers/adamPerer-DOIGraphs-InfoVis2009.pdf
- **비판**: Gutwin 2002 (CHI'02), *Improving focus targeting in interactive fisheye views* — fisheye의 배율 변화 때문에 **커서 이동거리와 화면상 타겟 이동거리가 불일치해 클릭 실패율이 오른다**. 원본 fisheye의 target acquisition cost가 크다는 것이 실증됨. https://dl.acm.org/doi/10.1145/503376.503424
- **우리 적합성**: **왜곡형 fisheye는 채택 불가.** 우리 가로축은 연도다. x를 왜곡하면 "2017년이 2019년보다 왼쪽"이라는 이 그래프의 유일한 절대 좌표계가 무너진다. 게다가 우리 노드는 126×40px이고 클릭이 곧 선택이라(`GRAPH-INTERACTION.md` §1) Gutwin이 지적한 클릭 실패가 그대로 발생한다.
- **다만 DOI 함수 자체는 왜곡 없이 쓸 수 있다.** 좌표는 그대로 두고 DOI를 **불투명도/테두리/라벨 노출**에 매핑하면 된다. 우리에게 API(사전 중요도)는 이미 있다 — **차수**(§0.6)와 성장 단계(`stage`). 거리는 선택 노드로부터의 홉 수. 구현은 수십 줄.

### 2.3 Semantic zoom (Pad, Pad++) — **가장 확실한 채택 후보**
- Perlin & Fox 1993, *Pad: An Alternative Approach to the Computer Interface* (SIGGRAPH '93). 확대·축소에 따라 **표현 자체가 바뀐다**(기하학적 확대와 구분). https://www.researchgate.net/publication/2456102_Pad_-_An_Alternative_Approach_to_the_Computer_Interface
- Pad++ (Bederson & Hollan): https://www.researchgate.net/publication/221518259_Pad_a_zoomable_graphical_interface_system
- 명시적 "semantic zoom 실패" 논문은 찾지 못함 — **미확인**. 다만 줌 레벨 간 전환이 급격하면 방향 감각을 잃는다는 논의가 Cockburn et al. 서베이(§2.4)에 있다.
- **우리 적합성: 매우 높음.** `DESIGN-SYSTEM.md` §7이 이미 **"밀도가 높을 때는 줌 레벨에 따라 라벨 노출을 단계화한다"** 고 규정해 놓았다 — 즉 **이건 새 제안이 아니라 미구현 스펙**이다. 현재 `wireZoom`은 순수 기하학 줌이라 이 규정을 지키지 않고 있다.
- 구현: 스케일 임계값에 따라 SVG 루트에 클래스를 붙이고 CSS로 `.yr`/제목 텍스트를 끄면 된다. **50줄 이내.**

### 2.4 Overview+detail vs Zooming vs Focus+context — 실증 증거
Cockburn, Karlson & Bederson 2008, *A Review of Overview+Detail, Zooming, and Focus+Context Interfaces*, ACM Computing Surveys 41(1).
https://doi.org/10.1145/1456650.1456652 (PDF: https://faculty.cc.gatech.edu/~stasko/7450/Papers/cockburn-surveys08.pdf)

- **overview+detail**: 맥락 유지에 유리하지만 두 뷰를 오가는 **split-attention 비용**이 있다.
- **zooming**: 애니메이션이 공간 관계 이해를 돕지만 전환마다 시간 비용이 든다.
- **focus+context(왜곡)**: 이론상 가장 효율적일 것 같지만, **실험에서 기대만큼 일관된 이점이 나오지 않았다** — 왜곡이 형태 인식을 떨어뜨리고 방향 감각을 잃게 한다. "화면 공간을 절약하는 대신 인지 비용을 치른다"는 것이 서베이의 결론.
- 만능 해법은 없고 **과제(task)에 따라 갈린다.**
- **우리 적합성**: 우리 과제는 "이 논문의 조상/후손 추적"(경로 추적)과 "이 분야가 언제 터졌나"(분포 파악) 두 가지다. 앞쪽은 이미 선택 강조가 담당한다. 뒤쪽에 필요한 게 **왜곡 없는 overview** — 즉 미니맵 또는 축소 모드다.

### 2.5 Edge bundling — **우리에게는 해롭다**
- Holten 2006, *Hierarchical Edge Bundles*, IEEE TVCG 12(5):741-748. https://research.tue.nl/en/publications/hierarchical-edge-bundles-visualization-of-adjacency-relations-in/
- Holten & van Wijk 2009, *Force-Directed Edge Bundling*, CGF 28(3). https://www.win.tue.nl/vis1/home/dholten/papers/forcebundles_eurovis.pdf
- **비판 1** — Bach, Riche et al. 2016/2017, *Towards Unambiguous Edge Bundling: Investigating Confluent Drawings*, IEEE TVCG 23(1): 전통적 번들링은 **공간적 근접성만으로 묶기 때문에 개별 엣지를 따라가다 실제로 연결되지 않은 노드로 착각하게 되는 모호성(허위 인접성 지각)** 을 만든다. https://doi.org/10.1109/TVCG.2016.2598958
- **비판 2** — *An Information-Theoretic Framework for Evaluating Edge Bundling Visualization*, Entropy 20(9):625 (2018): 기존 번들링이 원본 그래프 대비 **정보 손실(mutual information 저하)** 을 일으킴을 정량 평가. https://www.mdpi.com/1099-4300/20/9/625
- **비판 3** — Luo et al., *Ambiguity-Free Edge-Bundling*, IEEE TVCG (2012): 같은 문제의식. https://ieeexplore.ieee.org/document/5887331/
- **우리 적합성: 없음. 채택하지 않는다.** 우리 그래프에서 개별 엣지 하나하나는 "이 논문이 저 논문을 딛고 섰다"는 **저자의 명시적 주장**이다. 번들링이 만드는 허위 인접성은 곧 **없는 계보를 있다고 보이게 하는 사실 왜곡**이다. 게다가 우리 엣지 30%는 5레인 이상을 건너뛰므로(§0.5) 묶을 만한 공통 경로도 별로 없다. 구현 비용(FDEB는 이차 연산 + 반복 최적화)도 vanilla JS 예산을 넘는다.

### 2.6 Sugiyama 계층 DAG 레이아웃 — **우리 구조와 이미 반쯤 일치한다**
Sugiyama, Tagawa & Toda 1981, *Methods for Visual Understanding of Hierarchical System Structures*, IEEE Trans. SMC 11(2):109-125.
(IEEE Xplore 직링크 미확인 — 요약 페이지: https://www.semanticscholar.org/paper/34c4e6af91b25f426fde84d1c4556256f07e6e81)

4단계: ① 사이클 제거 ② 레이어 배정 ③ **레이어 내 순서로 교차 최소화(barycenter/median 휴리스틱)** ④ 좌표 미세조정.

- **우리는 ①②가 공짜다**: 연도가 x를 고정하고(레이어 배정 완료), 역방향 엣지가 0건(§0.5 — 자식이 부모보다 오래된 경우 0)이라 사이클 제거도 불필요하다.
- **③만 안 하고 있다.** 현재 `graph.js:19`는 레인 안에서 `year → slug 알파벳순`으로 정렬한 뒤 그리디로 행을 채운다. **slug 알파벳순은 그래프 구조와 아무 상관이 없다.** 여기에 barycenter(각 노드를 인접 노드들의 평균 y로 재정렬)를 몇 회 반복하면 교차가 줄어든다.
- **대가**: 교차 최소화는 NP-hard라 barycenter는 근사다. 최적 보장이 없고, 반복 횟수에 따라 결과가 달라진다. 또 하나 — **행 순서가 바뀌면 Tab 순서도 바뀐다**(`GRAPH-INTERACTION.md` §6이 "DOM 렌더 순서 그대로"를 Tab 순서로 쓰고 있다). 연도순 읽기가 깨지지 않도록 **레인 내 y 순서만 바꾸고 DOM 출력 순서는 연도순으로 유지**해야 한다.
- 구현: 100~150줄. 외부 라이브러리 불필요.

### 2.7 노드-링크는 몇 개까지 버티나 — 임계값은 생각보다 훨씬 낮다
Ghoniem, Fekete & Castagliola, *A Comparison of the Readability of Graphs Using Node-Link and Matrix-Based Representations* (InfoVis 2004) / 확장판 *Information Visualization* 4(2):114-135 (2005).
https://dl.acm.org/doi/abs/10.5555/1038262.1038777 , https://doi.org/10.1057/palgrave.ivs.9500092

- 7개 과제 통제 실험 결과: **노드가 20개를 넘고 밀도가 어느 정도 있으면 대부분의 과제에서 매트릭스 표현이 노드-링크를 이긴다.**
- **단 하나의 예외가 경로 찾기(path finding)** — 여기서는 노드-링크가 일관되게 우위.
- **우리 적합성**: 446노드는 임계값의 22배다. 이 결과는 "지금 형태로는 안 된다"는 강력한 근거다. **하지만 매트릭스로 갈아타지는 않는다** — 우리의 핵심 과제가 정확히 그 예외인 경로 찾기(계보 추적)이고, 매트릭스는 연도축을 표현할 수 없다. 이 논문은 **"노드-링크를 유지하되 한 번에 보이는 유효 노드 수를 줄여라"** 는 근거로 쓴다.

### 2.8 라벨 디클러터링
- Fekete & Plaisant 1999, *Excentric Labeling: Dynamic Neighborhood Labeling for Data Visualization* (CHI'99): 커서 주변 객체의 라벨만 겹치지 않게 동적 배치. 8인 파일럿에서 줌 인터페이스보다 빨랐다. https://dl.acm.org/doi/pdf/10.1145/302979.303148 , http://www.cs.umd.edu/projects/hcil/excentric/
- **우리 적합성: 부분적.** 우리 노드는 점이 아니라 라벨을 품은 사각형이라 excentric labeling을 그대로 쓸 순 없다. 다만 "축소 모드에서 라벨을 다 끄고, 커서/포커스 근처만 되살린다"는 형태로는 유효하다. **단 `GRAPH-INTERACTION.md` §5가 "호버=프리뷰 팝오버, 관계 강조는 클릭만"으로 역할을 나눠 놨으므로**, 호버 라벨 되살리기를 넣으면 호버 채널이 팝오버와 충돌한다. 우선순위를 낮게 둔다(§5 "안 쓰는 것").

### 2.9 Motif simplification
Dunne & Shneiderman 2013, *Motif Simplification: Improving Network Visualization Readability with Fan, Connector, and Clique Glyphs* (CHI'13). https://www.cs.umd.edu/~ben/papers/Dunne2013Motif.pdf
- fan(스타)·connector·clique 패턴을 하나의 글리프로 압축.
- **우리 적합성: 이론상 딱 맞는데, 실무상 위험하다.** 우리 데이터의 지배적 패턴이 정확히 fan이다(`transformer`의 자식 48편, `gpt3` 46편 — §0.6). 하지만 이 fan을 글리프로 접으면 **접히는 대상이 곧 "가장 중요한 논문 48편"** 이 된다. 홈 그래프의 목적은 그 48편을 보여주는 것이다. **접기는 자동 글리프가 아니라 사용자가 여는 레인 단위로만** 한다(§5 권고 3).

---

## 3. 시간축 계보를 실제로 읽히게 만든 사례

### 3.1 Musicmap (musicmap.info) — 우리와 가장 구조가 닮았다
- 1870~2016 음악 장르 계보. 약 234개 메인 장르를 **23개 super-genre**로 묶음.
- 공간 문법: **세로축=시간, 가로축=super-genre(카테고리)**. (우리는 축이 90° 돌아간 같은 문법.) 10년 단위 굵은 선 + 2년 단위 얇은 선의 시간 그리드.
- 가독성 전략: **계층적 줌 — 축소 시 super-genre만, 확대해야 메인/서브/형제 장르가 드러난다.** 정적 포스터가 아니라 인터랙티브 줌 지도.
- 포기한 것: 저자가 **"top-down 방법론"** 을 명시적으로 택해 유기적 정확성보다 **구조적 일관성과 항해 가능성**을 우선한다고 문서화.
- 출처: https://musicmap.info/
- **가져올 점**: ① 카테고리 21개(우리 분야 수와 같은 자릿수)를 **상위 묶음으로 한 번 더 접는 것** — 우리에겐 이미 `W.GROUPS`가 있다(`app.js:234`). ② 시간 그리드를 굵기로 이원화. ③ "정확성보다 항해 가능성"을 문서에 남기는 태도.

### 3.2 GNU/Linux Distribution Timeline — **반면교사**
- 가로축=연도, 세로=배포판 계열. 원본 SVG **3,520 × 12,510px**(Wikimedia Commons 파일 정보).
- 즉 저자 스스로 "한 뷰포트에 담을 수 없는 크기"임을 인정하고 초대형 벡터로 배포한다. 인터랙티브 줌 뷰어로 대체된 적 없다.
- 커뮤니티의 구체적 "읽을 수 없다" 인용문은 **미확인**(파일 크기로 간접 추론).
- 출처: https://commons.wikimedia.org/wiki/File:Linux_Distribution_Timeline.svg , https://github.com/FabioLolix/LinuxTimeline
- **우리 위치**: 우리 SVG는 **3,138 × 5,986px**. 가로는 거의 같고 세로만 절반이다. **우리는 이미 이 실패 사례와 같은 부류에 들어와 있다.** 이게 이 문서에서 가장 중요한 한 문장이다.

### 3.3 Éric Lévénez, Computer Languages History — 완전성을 포기한다
- 프로그래밍 언어 계보 포스터. A4/Letter/대형 플로터 여러 크기로 배포 — 화면 스크롤이 아니라 **물리적 인쇄 크기**로 밀도를 해결한다.
- **저자가 직접 인정**: 실존 언어(Kinnersley 리스트 2,500+, HOPL 8,945)를 두고 **50개만** 수록. 완전성을 포기하고 큐레이션.
- 축 방향(가로=시간 여부)은 텍스트만으로 확인 불가 — **미확인**.
- 출처: https://levenez.com/lang/ , https://levenez.com/unix/
- **가져올 점**: 우리는 완전성을 이미 선택했으므로(446편 전부가 콘텐츠) **이 길은 못 간다.** 대신 이 사례는 "전량 수록을 택했으면 반드시 인터랙티브 LOD를 붙여야 한다"는 대우(對偶)를 알려준다.

### 3.4 Wikipedia — Generational list of programming languages
- 그림이 아니라 **들여쓰기 텍스트 트리**. 시간 순서는 암묵적(부모가 항상 먼저).
- 문서가 스스로 고백: **"언어는 여러 소스에서 아이디어를 빌리므로 이런 계보 분류에는 필연적으로 임의적 요소가 크다."** 단일 부모 트리가 다중 영향을 왜곡함을 인정.
- 출처: https://en.wikipedia.org/wiki/Generational_list_of_programming_languages
- **가져올 점**: 우리도 다중 부모다(최대 4, `ldm`). 트리로 접는 유혹을 경계하고, **"이 계보 선택은 저자의 판단"이라는 각주**를 남기는 것이 신뢰도를 높인다. 또한 텍스트 트리는 **접근성 폴백**으로도 유효하다 — SVG를 읽지 못하는 사용자에게 같은 정보를 주는 수단(§5 권고 5 부속).

### 3.5 OneZoom / Lifemap — 초대형 계층의 LOD 극단
- **OneZoom**: 220만+ 종을 하나의 줌 가능한 프랙탈 페이지에. "One page, zoom to reveal". 좌표를 **동적으로 재앵커링**해 부동소수점 정밀도 한계를 넘긴다. 대신 가지 길이가 실제 시간에 비례하지 않는 경우가 있음 — 절대 시간 스케일을 포기하고 위상과 탐색성을 택함. https://www.onezoom.org/ , https://journals.plos.org/plosbiology/article?id=10.1371%2Fjournal.pbio.1001406
- **Lifemap**: OpenStreetMap과 같은 **타일 피라미드(256×256px)** 를 계통수에 적용. 서버가 미리 렌더한 타일을 스트리밍. https://journals.plos.org/plosbiology/article?id=10.1371%2Fjournal.pbio.2001624
- **iTOL**: 원형 레이아웃으로 수천 leaf, v5/v6 엔진 재작성으로 5만~10만 leaf. 대신 leaf가 많아지면 라벨 자체를 포기하고 검색으로 찾게 한다. https://itol.embl.de/ , https://academic.oup.com/nar/article/52/W1/W78/7645242
- **우리 적합성**: **타일링·재앵커링·원형 레이아웃 모두 채택하지 않는다.** 타일링은 서버 프리렌더가 필요한데 우리는 정적 호스팅이고 빌드가 없다. 재앵커링은 10^6배 줌에서나 필요한데 우리 줌 범위는 32~160%다. 원형 레이아웃은 연도축을 각도로 바꿔야 해서 "가로=시간"이라는 이 사이트의 기본 문법을 파괴한다. **다만 "줌 레벨이 곧 정보량"이라는 공통 교훈만 가져온다.**

### 3.6 Histomap (Sparks 1931) / Every Noise at Once
- **Histomap**: 4,000년 세계사를 세로=시간, **띠의 폭=상대적 국력**으로 1.5m 포스터 하나에. 단일 시각 변수(굵기)로 복잡한 개념을 압축, 정밀한 연대는 포기. https://www.visualcapitalist.com/histomap/
- **Every Noise at Once**: 6,291개 장르 산점도. **축 자체에 해석 가능한 의미**(위=기계적/전자적, 아래=유기적 등)를 부여. 대신 **계보(파생 관계)를 아예 표현하지 않는다.** https://everynoise.com
- **가져올 점**: Histomap의 "하나의 시각 변수로 중요도"는 우리 차수 인코딩의 근거가 된다(§0.6의 극단적 분포 덕에 굵기/크기 차이가 잘 보인다). Every Noise는 **"계보를 포기하면 수천 개도 담긴다"** 는 트레이드오프의 반대편 극단 — 우리는 계보가 목적이므로 그쪽으로 못 간다.

### 3.7 스윔레인 타임라인 일반론
- 레인별 색 일관성 + 중요도별 크기 위계가 기본기지만, **대량 데이터에서는 "공간 부족"이라는 근본 한계**에 부딪히며 줌/필터를 반드시 병행해야 한다는 것이 업계 공통 인식. https://miro.com/diagramming/what-is-a-swimlane-diagram/
- **우리 위치**: 정확히 이 한계에 걸려 있다. 21개 레인 × 세로 6,000px.

---

## 4. 안 되는 것들 (비판 모음)

### 4.1 Force-directed 레이아웃 — 이 데이터에는 명백히 나쁘다
- **의미 있는 축의 파괴**: 우리 x축은 연도다. force 레이아웃은 좌표에 아무 의미를 주지 않는다. 46년의 역사를 무작위 초기값에 맡기는 셈.
- **비결정성**: 새로고침할 때마다 그림이 달라지면 "2017년 근처"라는 공간 기억이 형성되지 않는다.
- **hairball**: *Untangling Force-Directed Layouts Using Persistent Homology*, arXiv:2208.06927 — force 레이아웃의 hairball 문제를 정량적으로 다룬다. https://arxiv.org/pdf/2208.06927
- **관계의 모호성**: Venturini, Jacomy & Jensen 2021, *What do we see when we look at networks: Visual network analysis, relational ambiguity, and force-directed layouts*, Big Data & Society — ForceAtlas2류 배치가 만드는 공간 배치가 "관계의 모호성"을 낳는다는 비판적 분석. https://journals.sagepub.com/doi/10.1177/20539517211018488
- **클러스터 가독성**: Noack의 LinLog 모델은 표준 Fruchterman-Reingold류가 균등 밀도의 덩어리를 만들어 클러스터가 구분되지 않는다는 문제의식에서 출발한다. https://www.researchgate.net/publication/228718784_An_Energy_Model_for_Visual_Graph_Clustering_Long_Paper
- Bostock 개인이 "force layout은 최후의 수단"이라고 말했다는 흔한 인용은 **1차 출처 미확인** — 인용하지 말 것.
- **결론**: 이미 연도축을 고정한 현재 선택이 옳다. Connected Papers·Paperscape가 force를 쓰는 건 **그들에겐 시간축이 주요 질문이 아니기 때문**이다. 우리는 다르다.

### 4.2 Edge bundling — §2.5. 허위 인접성 = 없는 계보를 만들어 보여주는 것.

### 4.3 왜곡형 fisheye — §2.2. 연도축 파괴 + 클릭 실패율(Gutwin 2002).

### 4.4 매트릭스 뷰로 전환 — §2.7. Ghoniem et al.의 결과에서 **유일한 노드-링크 우위 과제가 경로 찾기**인데 그게 우리 과제다.

### 4.5 알고리즘 기반 엣지/노드 가지치기 (PFNET 등) — §1.6. 우리 엣지는 통계가 아니라 저자의 주장이다.

### 4.6 노드 수 캡 (Connected Papers식) — §1.1. 홈 섹션 제목이 "전체 계보도 — 446편을 연도축 위에 한 장으로"다. 캡을 걸면 그 약속을 깬다.

### 4.7 애니메이션이 있는 줌 전환 — 조건부로 금지
- WCAG 2.2 SC 2.3.3 *Animation from Interactions*: 사용자 상호작용으로 발생하는 모션 애니메이션은 **비활성화할 수 있어야 한다**(필수적인 경우 제외). https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
- 전정기관 장애 사용자에게 **큰 확대/축소 전환은 실제로 어지럼·구역질을 유발**하는 대표적 패턴이다. 권장 대체는 슬라이드/줌 대신 **불투명도 페이드 또는 즉시 전환**.
- **결론**: 줌 단계 전환에 애니메이션을 넣더라도 `@media (prefers-reduced-motion: reduce)`에서는 **전환 시간 0**으로 즉시 스냅해야 한다. `MOTION.md` 규약과 함께 확인할 것.

### 4.8 d3 / svg-pan-zoom 등 외부 라이브러리 — 제약상 불가
- 참고로 `svg-pan-zoom`은 초기화 성능을 위해 자식 요소를 미리 `<g>`로 감싸라고 권고하고, 요소가 많은 SVG에서는 passive 리스너를 권한다. https://github.com/bumbu/svg-pan-zoom
- **우리는 이 라이브러리를 쓰지 않는다.** 하지만 위 두 조언(단일 변환용 `<g>` 래퍼, `{passive:true}` 휠 리스너)은 **직접 구현할 때 그대로 적용할 만하다.** 지금 `wireZoom`은 `width/height` 속성을 바꾸는데, 이는 브라우저가 매번 전체 레이아웃을 다시 계산하게 한다 — `viewBox` 조작이나 루트 `<g>`의 `transform`이 더 싸다.

---

## 5. 권고 — 우선순위와 근거

전제: 아래 5개는 **모두 `graph.js` + `app.js` + `wiki.css` 안에서 vanilla JS로 구현 가능**하고,
외부 의존을 추가하지 않으며, `GRAPH-INTERACTION.md`의 선택/이동 규약을 바꾸지 않는다.

---

### 권고 1 (P0) — 전체 화면 모드: 뷰포트를 74vh에서 100vh로

**무엇**: 그래프 툴바에 "전체 화면" 버튼을 추가한다. Fullscreen API(`requestFullscreen`)를 쓰되,
실패하거나 미지원이면 **위치 고정 오버레이(`position:fixed; inset:0`)로 폴백**한다.
전체 화면에서는 그래프 뷰포트가 100vh를 쓰고, 툴바·범례·선택 카드는 화면 가장자리에 고정된다.

**근거**:
- 사용자의 직접 요청("전체 화면처럼 키워서 크게").
- 실측: 현재 뷰포트에서 **446편 중 8편(1.8%)** 만 보인다(§0.2). 74vh → 100vh만으로도 세로 가시 영역이 약 1.35배가 된다. 크지 않지만, **아래의 권고 2·3이 얹힐 무대**로서 반드시 먼저 필요하다.
- Shneiderman 만트라의 overview 단계를 만들 물리적 공간이 없으면 나머지 권고가 다 무의미하다(§2.1).

**구현 주의**:
- `requestFullscreen()`은 Promise를 반환하므로 **성공/실패를 반드시 처리**하고, `fullscreenchange` 이벤트를 듣는다(사용자가 Esc로 나가거나 앱을 전환하는 경우). https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen
- **Esc 충돌**: 브라우저는 Esc를 전체 화면 종료에 쓰고, `GRAPH-INTERACTION.md` §4는 Esc를 "선택 해제"로 정해 놨다. **전체 화면 중에는 Esc가 브라우저에 먹히므로**, 선택 해제는 폴백 오버레이에서만 Esc로 동작시키고 전체 화면에서는 카드의 ×와 배경 클릭을 확실히 노출한다. 이 충돌은 스펙에 반드시 적어 둘 것.
- 전체 화면 진입/이탈은 페이드 정도로만, `prefers-reduced-motion`에서는 즉시 전환(§4.7).
- 진입 버튼은 일반 `<button>`, `aria-pressed`로 상태를 알린다.

---

### 권고 2 (P0) — 시맨틱 줌: 줌 레벨 3단계로 라벨과 엣지를 단계화

**무엇**: `wireZoom`의 순수 기하학 줌을 **표현이 바뀌는 줌**으로 교체한다.
스케일 임계값에 따라 SVG 루트에 `.z-far / .z-mid / .z-near` 클래스를 붙이고, CSS로 표현을 바꾼다.

| 단계 | 스케일 | 노드 | 라벨 | 엣지 |
|---|---|---|---|---|
| **far**(조망) | ~55% 이하 | 작은 사각형(또는 도트), 차수 상위만 크게 | **허브(차수 ≥ 8, 32편)만** 한글명 표시 | 같은 레인 내 엣지만(440개) 또는 전부 매우 옅게 |
| **mid**(기본) | 55~110% | 현재 크기 | 한글명만(연도·원제 줄 숨김) | 전부 |
| **near**(정독) | 110% 이상 | 현재 크기 | 한글명 + 연도 + 원제 (현재와 동일) | 전부 |

**근거**:
- **`DESIGN-SYSTEM.md` §7이 이미 이걸 규정해 놓았다** — "밀도가 높을 때는 줌 레벨에 따라 라벨 노출을 단계화한다". 즉 이 권고는 신규 제안이 아니라 **미구현 스펙의 이행**이다.
- 업계 표준: Paperscape(줌 단계별 키워드→저자), VOSviewer(줌 시 라벨 집합 갱신), Litmaps(겹치면 저인용 라벨 숨김) — **라벨을 정적으로 전부 표시하는 도구를 하나도 찾지 못했다**(§1.9).
- 이론: Perlin & Fox 1993의 semantic zoom(§2.3).
- 우리 데이터가 이 방식에 유리하다: 차수 ≥8인 노드가 **32편(7%)** 뿐이다(§0.6). far 단계에서 라벨을 32개만 남기면 밀도가 14분의 1로 떨어지는데, **남는 32개가 정확히 계보의 뼈대**(transformer, gpt3, bert, backprop, lstm, resnet, clip …)다. 정보 손실이 거의 없다.
- far 단계의 임계값 55%가 필요한 이유: 현재 11px 라벨이 55%에서 6px, 32%에서 3.5px다 — 6px 아래는 어차피 못 읽으므로 **읽히지 않는 글자를 그리느라 밀도만 올리고 있다.**

**구현 주의**:
- 줌 하한을 32%보다 더 내려도 된다(far 단계에서는 라벨이 없으므로). 3,138×5,986px를 22%로 축소하면 690×1,317px — 전체 화면 세로에 거의 들어온다. **이게 우리의 overview다.**
- `width/height` 속성 변경 대신 루트 `<g transform="scale(...)">` 또는 `viewBox` 조작 권장(§4.8).
- 라벨 on/off는 CSS `visibility`/`display`로만 — DOM을 다시 만들면 선택 상태와 포커스가 날아간다.
- **키보드**: `+`/`-`/`0`(리셋) 키를 그래프 컨테이너에 바인딩하고, 방향키는 쓰지 않는다(`GRAPH-INTERACTION.md` §6이 방향키를 명시적으로 배제했다 — 팬은 뷰포트의 기본 스크롤에 맡긴다).
- **줌 단계가 바뀌면 `aria-live="polite"`로 "조망 보기 · 라벨은 주요 논문만" 같은 상태를 알린다.** 스크린리더 사용자에게 라벨이 사라진 이유를 알려야 한다.

---

### 권고 3 (P0) — 레인 접기 + 축 압축: 세로 6,000px를 줄인다

**무엇**: 두 가지를 함께 한다.

(a) **레인 접기/펼치기**. 각 분야 레인의 왼쪽 라벨을 버튼으로 만들어 접을 수 있게 한다.
접힌 레인은 **한 줄짜리 요약 스트립**(분야명 + 편수 + 연도별 작은 막대)으로 축소된다.
기본 상태는 `W.GROUPS` 단위(Musicmap의 super-genre) 또는 편수 상위 6개 레인만 펼침.

(b) **연도축 압축 해제**. 현재 "논문이 있는 연도만 등간격"은 1958~2012의 **10편(2.2%)** 에게
가로 절반을 내주고 있다(§0.3). 2013년 이전을 **하나의 "~2012" 압축 칸**으로 묶고,
그 칸 안에서만 편당 간격을 좁힌다. 가로 3,138px → 대략 2,000px 이하로 줄어든다.

**근거**:
- 실측: `llm` 레인 하나가 750px로 **뷰포트 높이보다 크다**. 21개 레인 중 12개는 편수 16 이하인데 각각 100~250px를 먹는다(§0.4). 접기만으로 세로가 절반 이하로 줄어든다.
- Musicmap이 정확히 이 구조를 쓴다 — 축소 시 super-genre만, 확대 시 하위 장르(§3.1).
- Ghoniem et al.(§2.7): 유효 노드 수를 줄이는 것이 노드-링크를 살리는 유일한 길.
- Cockburn et al.(§2.4): 왜곡 없는 필터링이 focus+context보다 실증적으로 안전하다.
- **이미 있는 것과 잘 맞는다**: 홈에는 이미 분야 칩 필터(`data-field-chip`, `app.js:566`)가 있다. 접기는 그 연장이고, `GRAPH-INTERACTION.md` §9가 "필터 변경 시 선택 해제"를 이미 규정해 놨다 — **접기에도 같은 규칙을 적용하면 새 규약이 필요 없다.**
- 연도 압축 해제 근거: CiteSpace의 시간 슬라이싱(§1.6)과 같은 발상. 우리 데이터는 41%가 2021~2023 3칸에 몰려 있어(§0.3) 전역 등간격이 최악의 선택이다.

**구현 주의**:
- 레인 라벨 버튼: `<g role="button" tabindex="0" aria-expanded="true|false">`. Enter/Space로 토글.
- 접힘 상태는 세션 내 메모리로만(URL에 넣지 않는다 — `GRAPH-INTERACTION.md` §9의 원칙).
- **접힌 레인에 걸린 엣지 처리를 반드시 정의할 것**: 우리 엣지의 45%가 분야를 넘는다(§0.5). 접힌 레인으로 들어가는 엣지는 요약 스트립 가장자리에 붙여 "여기로 이어진다"만 보이게 하고, 개별 곡선은 그리지 않는다.
- 연도축 압축은 눈금 라벨에 **"~2012"처럼 압축임을 명시**해야 한다. 축을 말없이 비선형으로 만드는 건 거짓말이다. 압축 칸의 배경을 다르게 칠해 시각적으로도 구분한다.

---

### 권고 4 (P1) — 허브를 특별 취급: 차수 기반 크기·순서

**무엇**: 두 가지.

(a) **차수 기반 시각 위계**. 차수 상위 노드의 테두리를 굵게, far 줌에서 크게 그린다.
`DESIGN-SYSTEM.md` §5.3에 이미 "피인용 스케일"이 있으므로 그 토큰을 쓴다.
색은 쓰지 않는다(§7이 색 채널을 분야/성장단계에 이미 배정했다).

(b) **레인 내 행 배정을 barycenter로 개선**. 현재 `graph.js:19`는 `year → slug 알파벳순`으로
정렬하는데, **slug 알파벳순은 그래프 구조와 무관하다**. Sugiyama 3단계(barycenter/median)를
2~4회 반복해 레인 내 y 순서를 정하면 엣지 교차가 줄어든다.

**근거**:
- 차수 분포가 극단적이라(중앙값 2, 최대 51 — §0.6) 크기 차이가 잘 보인다. Histomap의 "굵기로 중요도"(§3.6), Local Citation Network의 "degree 합으로 크기"(§1.7)와 같은 계열.
- barycenter: Sugiyama et al. 1981(§2.6). 우리는 레이어 배정(연도)과 사이클 제거(역방향 엣지 0건)가 이미 공짜라 **3단계만 구현하면 된다.** 100~150줄.
- 현재 엣지 \|dy\| p90이 3,494px인데(§0.5), 이 중 같은 레인 내 엣지 440개(55%)는 barycenter로 실제로 줄어든다. 레인을 건너뛰는 238개는 안 줄어든다 — **그래서 이게 P1이고, 권고 2의 far 단계 엣지 억제가 P0다.**

**구현 주의**:
- **Tab 순서를 깨지 말 것.** `GRAPH-INTERACTION.md` §6이 "DOM 렌더 순서 = Tab 순서"로 정해 놨고 그건 "레인→연도순"이다. barycenter는 **y 좌표만** 바꾸고 DOM 출력은 연도순을 유지해야 한다.
- 결정론적일 것. 같은 입력에 항상 같은 출력이 나와야 한다(반복 횟수 고정, 동점 시 slug 사전순 tie-break).
- 개선 효과를 **교차 수로 측정해서 남길 것**. 안 줄어들면 도입하지 않는다.

---

### 권고 5 (P1) — 미니맵(왜곡 없는 overview+detail)

**무엇**: 전체 화면 모드 구석에, 전체 그래프를 아주 작게(예: 세로 200px) 그린 미니맵과
현재 뷰포트를 나타내는 사각형을 얹는다. 클릭하면 그 위치로 스크롤한다.

**근거**:
- Cockburn et al.(§2.4)이 정리한 overview+detail. **왜곡을 도입하지 않으므로 연도축이 보존된다** — focus+context를 배제한 우리 상황에서 남는 유일한 overview 수단.
- 세로 6,000px 캔버스에서 "지금 내가 어디를 보고 있나"를 알려주는 값이 크다.

**대가와 완화**:
- Cockburn et al.이 지적한 **split-attention 비용**이 있다. 미니맵을 크게 만들거나 항상 켜 두면 오히려 방해가 된다 → **전체 화면 모드에서만, 작게, 끌 수 있게.**
- DOM 예산: 미니맵을 별도 SVG로 다시 그리면 3,100개 요소가 또 생긴다(§0.2, 예산 6,000). **미니맵은 노드 사각형 없이 레인 띠 + 연도 눈금 + 허브 32개 점 정도로만** 그린다(요소 100개 미만).
- 키보드 사용자에겐 가치가 낮다(Tab이 이미 순서대로 이동시킨다) → `aria-hidden="true"`로 두고, 키보드 대체 수단은 권고 2의 `+/-/0`과 Tab으로 충분하다고 본다.

---

### 권고에 딸린 필수 부속 (별도 항목이 아니라 위 권고들의 전제)

- **DOM 예산 재확인**: 홈은 책장만으로 4,226~4,306노드이고(`A11Y-PERF.md`) 그래프가 약 3,100개를 더한다. 지금도 예산 6,000을 넘고 있을 가능성이 높다. **그래프 SVG를 `<details>`가 열릴 때 처음 그리도록 지연 생성**해야 한다(현재 `app.js:556`은 닫혀 있어도 innerHTML에 이미 들어간다). 이건 권고 1~5 중 무엇을 하든 먼저 해야 한다.
- **접근성 폴백**: SVG 그래프의 대안 텍스트 표현. 복잡한 시각화는 SVG `<title>`/`<desc>` + ARIA만으로 충분하지 않고, **동등한 구조화 텍스트를 함께 제공**하는 것이 권장된다. 우리에겐 이미 분야→트랙→논문 nav 트리(`navTreeHTML`)와 각 논문 페이지의 로컬 그래프가 있으므로, 홈 그래프에 "이 그래프를 목록으로 보기" 링크 하나만 달면 된다. 참고: https://www.w3.org/WAI/ (WAI-ARIA Graphics Module), https://vis.csail.mit.edu/pubs/rich-screen-reader-vis-experiences/ , https://tink.uk/accessible-svg-line-graphs/
- **라이트/다크**: 새로 쓰는 far 단계 스타일·미니맵·압축 축 배경은 전부 `tokens.css` 토큰으로만 색을 잡는다. 하드코딩 금지(`DESIGN-SYSTEM.md`).

---

## 6. 도입하지 않는 것과 그 이유 (한 표로)

| 기법 | 왜 안 쓰나 | 근거 |
|---|---|---|
| force-directed 레이아웃 | 연도축(이 그래프의 유일한 절대 좌표)을 파괴. 비결정적이라 공간 기억이 안 생김. hairball. | §4.1, arXiv:2208.06927, Venturini et al. 2021 |
| edge bundling | 허위 인접성 = 없는 계보를 있는 것처럼 보이게 함. 우리 엣지는 저자의 주장이지 통계가 아님. 엣지 30%가 5레인 이상 건너뛰어 묶을 공통 경로도 없음. 구현 비용도 초과. | §2.5, Bach et al. 2016, Entropy 20(9):625 |
| 왜곡형 fisheye 렌즈 | x 왜곡 = 연도 왜곡. 126×40px 노드에서 클릭 실패율 증가. | §2.2, Gutwin 2002 |
| 매트릭스 뷰 전환 | Ghoniem et al.에서 노드-링크가 이기는 **유일한 과제가 경로 찾기**인데 그게 우리 과제. 연도축 표현 불가. | §2.7 |
| 노드 수 캡(Connected Papers식) | 홈 섹션이 "446편을 한 장으로"를 약속함. 캡은 탐색 도구의 답이지 아카이브의 답이 아님. | §1.1, §4.6 |
| 알고리즘 엣지 가지치기(PFNET) | 797개 엣지는 손으로 큐레이션한 계보 주장. 지우면 콘텐츠를 지우는 것. | §1.6, §4.5 |
| 히트맵/밀도 뷰(VOSviewer식) | 우리 질문은 밀도가 아니라 "누가 무엇을 낳았나". | §1.5 |
| 원형/방사형 레이아웃(iTOL식) | 연도를 각도로 바꾸면 "가로=시간"이라는 사이트 기본 문법이 깨짐. | §3.5 |
| 지도 타일링(Lifemap식) | 서버 프리렌더 필요. 정적 호스팅 + 빌드 없음 제약 위반. | §3.5 |
| 좌표 재앵커링(OneZoom식) | 10^6배 줌에서나 필요. 우리 줌 범위는 22~160%. | §3.5 |
| Motif simplification 자동 접기 | fan을 접으면 접히는 게 곧 `transformer`의 자식 48편 — 홈 그래프가 보여줘야 할 바로 그것. 접기는 사용자가 여는 레인 단위로만. | §2.9 |
| excentric labeling(호버 라벨) | `GRAPH-INTERACTION.md` §5가 호버 채널을 프리뷰 팝오버에 이미 배정. 채널 충돌. | §2.8 |
| d3 / svg-pan-zoom 도입 | 외부 CDN 신규 의존 금지. 필요한 건 barycenter·semantic zoom·미니맵뿐이고 셋 다 수백 줄 vanilla JS로 충분. | 제약, §4.8 |
| 애니메이션 줌 전환(무조건) | WCAG 2.2 SC 2.3.3. 전정기관 장애 유발. reduced-motion에서는 즉시 전환 필수. | §4.7 |

---

## 7. 다음 단계 제안 (이 문서가 정하지 않은 것)

이 문서는 **무엇을 왜 하는가**까지만 정한다. 아래는 UX/비주얼 담당이 이어서 정해야 한다.

1. far 단계의 정확한 스케일 임계값과 허브 기준 차수(초안: 55%, 차수 ≥8 = 32편). 실제 화면에서 눈으로 맞춰야 한다.
2. 접힌 레인 요약 스트립의 시각 형태(연도별 막대? 편수 숫자만?).
3. 연도축 압축 구간의 경계(초안: 2013년 — 2012년 이하가 10편, 2013년부터 7편/년 이상).
4. 전체 화면 모드에서 Esc 충돌(브라우저 종료 vs 선택 해제)의 최종 규칙 — `GRAPH-INTERACTION.md` §4에 예외 항을 추가해야 한다.
5. 권고 4(b) barycenter의 교차 감소 실측치. 개선이 미미하면 도입하지 않는다.
