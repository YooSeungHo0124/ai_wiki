# QA-VIEWPORT — 좁은 화면 실측 보고

**작성자**: QA (읽기 전용 검증, 제품 파일 미수정)
**방법**: `design/mock/viewport-test.html`(iframe 하네스, `python3 -m http.server 8899`로 서빙) +
claude-in-chrome으로 iframe 내부 `contentDocument`/`contentWindow`를 직접 측정.
브라우저 창 리사이즈가 이 환경에서 실제 뷰포트를 바꾸지 못하는 문제를 iframe으로 우회함
(iframe 자신의 CSS 폭이 곧 뷰포트이므로 `@media`가 정상 동작).

**측정 환경의 제약(중요)**: 이 브라우저 세션의 `devicePixelRatio`가 **1.25**로 고정되어
있었다(변경 불가). 정수 배율(DPR=1) 환경에서의 재현 여부는 아래 항목별로 명시했다.
또한 세션 중 `localhost:8899` 탭이 몇 차례 예고 없이 최상위 경로(`/`)로 자동 새로고침되는
현상이 있었다(추정: 파일 변경 감시 확장 프로그램 — 우리 하네스가 이 리로드를 유발한
증거는 없음). 이 때문에 계획했던 전체 폭 스크린샷 세트를 다 못 찍었고, 해당 항목은
"미측정"으로 명시했다.

---

## 요약 표 (심각도 순)

| # | 심각도 | 영역 | 폭 | 상태 |
|---|--------|------|-----|------|
| 1 | **Critical** | 논문 페이지(#/p/transformer) 전체 | 390/767/768/1099/1100/1440 **전부** | ❌ 실패 |
| 2 | **High** | 상단바 검색창(모든 페이지 공통) | 390 | ❌ 실패 |
| 3 | **Medium** (DPR 의존) | 책장 767px 데드존 | 767 (DPR 1.25) | ❌ 실패 |
| 4 | Low (죽은 코드) | 표지 카드 모바일 스타일 | ≤700 | ⚠️ 도달 불가(N/A) |
| 5 | — | 홈/분야 페이지 전반 | 390 제외 전부 | ✅ 통과 |
| 6 | — | 좌측 내비(☰) 표시·토글·Esc·스크림 | 전 폭 | ✅ 통과(홈에서 실측) |
| 7 | — | 계보 그래프 접힘·컨테인먼트 | 전 폭 | ✅ 통과 |
| 8 | — | 모바일 리스트 터치 타깃 | 390 | ✅ 통과(44px) |

---

## 1. [Critical] 논문 페이지 — 모든 폭에서 가로 스크롤 (KaTeX 수식 SVG 폭 폭주)

**증상**: `#/p/transformer` 는 테스트한 6개 폭(390/767/768/1099/1100/1440) **전부**에서
`document.documentElement.scrollWidth > clientWidth` 였다.

| 폭 | clientWidth | scrollWidth | 초과분 |
|---|---|---|---|
| 390 | 378 | 1102 | +724px |
| 767 | 755 | 1102 | +347px |
| 768 | 756 | 1102 | +346px |
| 1099 | 1087 | 1382 | +295px |
| 1100 | 1088 | 1382 | +294px |
| 1440 | 1428 | 1620 | +192px |

**원인(확인됨)**: `getBoundingClientRect()`로 우측 끝이 뷰포트를 넘는 요소를 역추적하면
1위~3위가 전부 `<path>` 태그이고 폭이 **6304~7915px** 에 달한다. 조상 체인이
`svg > span.hide-tail > span > span.vlist > span.vlist-r` — KaTeX가 근호(√)·큰 델리미터
(`\left ... \right`)를 그릴 때 쓰는 "스트레치 SVG" 구조다. 이 페이지에는 KaTeX 인스턴스가
25개 있고(`document.querySelectorAll('.katex').length === 25`), 그중 스트레치 델리미터를
포함한 수식이 정상 크기(수십 px)가 아니라 수천 px 폭으로 렌더된다.

- 유력 발원지: `content/papers/transformer.js:41`
  ```
  tex:'\\text{Attention}(Q,K,V)=\\text{softmax}\\!\\left(\\frac{QK^{\\top}}{\\sqrt{d_k}}\\right)V'
  ```
  (`\left(\frac{...}{\sqrt{d_k}}\right)` — 근호+분수를 감싸는 스트레치 괄호 조합)
- 렌더 경로: `js/wiki/core.js` `W.tex()` → `window.katex.renderToString(src, {displayMode, throwOnError:false, strict:false, output:'html', trust:false})`
- KaTeX CSS(`vendor/katex/katex.min.css`)는 정상 로드됨을 확인했음(6개 스타일시트 모두
  `link.sheet` 존재) — CSS 누락이 원인은 아니다.
- 1099/1100/1440px에서는 관련 논문 패널(`aside.side`, 폭 250px)도 컬프릿 목록에 같이
  잡히는데, 이는 별도 버그가 아니라 문서 전체 폭이 이미 KaTeX 때문에 넓어진 상태에서
  그 오른쪽 끝에 떠밀려 앉은 것으로 보인다(같은 근본 원인).

**미확인/추가 조사 필요**:
- 25개 KaTeX 인스턴스 중 정확히 몇 번째가, 어떤 하위 표현(근호 vs `\left\right` 델리미터
  자체)이 범인인지까지는 못 좁혔다 — `content/papers/transformer.js:41`(Attention 공식)과
  `:47`(위치 인코딩 aligned 블록) 둘 다 sqrt/첨자를 포함하므로 우선 의심 대상이다.
- 다른 논문 페이지(수식이 있는 다른 slug)에서도 재현되는지는 이번 범위(`#/p/transformer`
  만 지정됨) 밖이라 확인하지 않았다. `js/wiki/core.js`의 `W.tex()` 설정(`output:'html'`)이
  전역 공통 경로이므로, 비슷한 `\left...\right`+`\sqrt` 조합이 있는 다른 논문도 같은
  증상일 가능성이 있다 — 재현 확인 권장.
- 표/그림(figure) 자체가 "추가로" 넘치는지는 이미 KaTeX가 문서를 1100~1600px대로
  늘려놓은 상태라 개별적으로 분리 측정하지 못했다.

---

## 2. [High] 상단바 검색창 — 390px에서 페이지 전체 공통 오버플로

**증상**: 홈(`#/`)과 분야 페이지(`#/f/llm`) 둘 다 **390px**에서
`scrollWidth 434 vs clientWidth 378` (56px 초과). (논문 페이지는 위 1번 버그가 훨씬 커서
가려져 있지만 같은 상단바를 공유하므로 동일 결함이 잠재해 있을 가능성이 높다 — 별도
확인 못함.)

**원인(확인됨)**: `getBoundingClientRect()`로 실측하면 `#themeBtn`(다크모드 토글)의
우측 끝이 정확히 `right:433.8px`로 `scrollWidth 434`와 일치한다. 역추적 결과:

- `css/wiki.css:31` `.searchbox input{width:260px; ...}` — **고정폭 260px**, 반응형
  오버라이드 전혀 없음(전체 CSS에 `.searchbox` 관련 `@media` 규칙 없음, grep 확인).
- `.topbar`(`css/wiki.css:21`)는 `display:flex; gap:16px`이고 `flex-wrap` 지정이 없다
  (기본값 `nowrap`). 실측 치수: 브랜드(`.brand`) 71px + gap16 + 검색창 260px(고정) +
  gap16 + 테마 버튼 35px + 좌우 패딩 40px ≈ 422px+ — 390px 뷰포트에 안 들어간다.

**재현 폭**: 390px에서 확인. 767px 이상에서는 재발생하지 않음(정상). 정확히 몇 px부터
넘치기 시작하는지(예: 420/450/500px)는 이번 지정 폭 목록에 없어 측정하지 않았다.

**고칠 사람이 볼 파일/선택자**: `css/wiki.css:31` `.searchbox input` — 좁은 화면에서
`width:260px`를 줄이거나(`max-width:100%` 등) `.topbar`에 `flex-wrap` 또는 검색창을
별도 행으로 내리는 모바일 레이아웃이 필요.

---

## 3. [Medium, DPR 의존] 767px 정확히에서 책장이 통째로 사라짐

**증상**: 폭 정확히 **767px**(DPR 1.25 환경)에서 데스크톱 책장(`.shelf`)도 모바일
드릴다운 리스트(`.shelf-mobile`)도 **둘 다 보이지 않는다**. `shelfWrap` 안에는
`.shelf-mobile` 엘리먼트만 DOM에 남아 있는데(JS가 `.shelf`를 제거했으므로), 그 계산된
`display`가 `none`이다(446개 `.mobile-item` 전부 `getBoundingClientRect().height === 0`).

**원인(확인됨, 근거 포함)**: 두 개의 서로 다른 소스가 같은 767/768 경계를 각자
판정하는데, DPR 1.25에서 서브픽셀 반올림 때문에 두 쿼리가 동시에 false가 되는
"데드존"이 생긴다.

- `js/wiki/app.js:599` — `var wide = window.matchMedia('(min-width:768px)').matches;`
  (`.shelf` vs `.shelf-mobile` 중 안 쓰는 쪽을 DOM에서 **영구 제거**하는 판정 기준)
- `css/shelf.css:220` — `@media (max-width:767px){ .shelf{display:none} .shelf-mobile{display:block} }`
  (실제 화면 표시 판정 기준)

실측(iframe 폭 767px, DPR 1.25):
```
matchMedia('(max-width:767px)').matches === false
matchMedia('(min-width:768px)').matches === false   // 둘 다 false! (정수 산술로는 불가능)
```
정수 픽셀 산술로는 `767 < 768`이므로 위 두 값 중 정확히 하나는 항상 true여야 하는데,
비정수 DPR(1.25 = Windows 125% 배율, 매우 흔한 설정)에서 브라우저 내부의 CSS px ↔
디바이스 px 변환 반올림 오차 때문에 둘 다 false가 되는 구간이 생긴다. 그 결과:
- JS 쪽(`min-width:768px` false) → "wide 아님" → `.shelf`를 DOM에서 제거 (`.shelf-mobile`만 남음, 이 판단 자체는 맞음)
- CSS 쪽(`max-width:767px` false) → `.shelf-mobile{display:none}` 베이스 규칙이 오버라이드되지 않음 → 안 보임

**같은 방식으로 확인해본 좌측 내비(1100px) 경계는 이 문제가 없음**: 좌측 내비는
`css/wiki.css:333` 의 `@media(max-width:1100px)` **단일 소스**만 쓰기 때문에(JS 쪽에서
따로 다른 값으로 matchMedia 판정을 하지 않음), 1099/1100px 둘 다 `.nav-tree`가 정상적으로
`display:none`(모바일 취급)이었다. 즉 이 버그는 "이중 소스(JS matchMedia + CSS
`@media`)가 서로 다른 767/768 값을 쓰는" 책장 특유의 구조적 문제다.

**고칠 사람이 볼 파일**: `js/wiki/app.js:599`(matchMedia 기준)과
`css/shelf.css:220`(CSS 미디어 쿼리 기준) — 두 곳이 정확히 같은 단일 소스(같은 값,
가능하면 같은 메커니즘)를 참조하도록 통합 필요. 예: 둘 다 `max-width:767.98px`로
맞추거나, JS 판정을 없애고 CSS 클래스 존재 여부만으로 DOM 정리 시점을 결정.

**미확인**: DPR=1(정수 배율, 예: 100% 화면 배율)에서 이 데드존이 재현되는지 여부 —
이 브라우저 세션은 DPR을 1.25로 고정할 수밖에 없어 비교 불가. 다만 125% 배율은 Windows
노트북에서 매우 흔한 기본값이라, 실사용자 영향 범위가 작지 않을 것으로 추정된다.

---

## 4. [Low, 죽은 코드] 표지 카드의 "좁은 화면 전체폭" 스타일이 실제로 도달 불가

`css/wiki.css:412` `@media(max-width:700px){.cover-panel{left:10px;right:10px;bottom:10px;width:auto}}`
는 SHELF-SPEC §2가 요구한 "좁은 화면에서 카드 전체 폭" 대응인데, 실측 결과 이 코드가
**실행될 경로가 없다**:

- 표지 카드는 오직 데스크톱 책장(`.shelf`) 책등 클릭 → `shelf:select` 이벤트
  (`js/wiki/app.js:629`)로만 열린다.
- `.shelf`는 768px 이상에서만 DOM에 존재한다(`css/shelf.css:220` 기준, §3 참고).
- `.shelf-mobile`(모바일 리스트)의 항목은 카드를 거치지 않고 바로
  `<a href="#/p/slug">`로 논문 페이지로 이동한다(`js/wiki/shelf.js:361`).

즉 표지 카드가 열릴 수 있는 최소 폭(768px)이 이미 `.cover-panel`의 모바일 분기 기준
(700px)보다 크므로, 700px 이하에서 카드가 뜨는 상황 자체가 발생하지 않는다.
**item 4 요구사항("좁은 화면에서 카드가 화면을 벗어나지 않는가")은 정상 사용자
흐름으로는 검증 대상 자체가 없다(N/A)** — 버그라기보다 죽은 CSS 규칙에 가깝다.
768px에서는 정상 동작 확인함(아래 통과 항목 참고).

---

## 통과(Pass) 항목 — 실측 상세

### 5. 홈 / 분야 페이지(`#/f/llm`) — 가로 스크롤
- 홈: 767/768/1099/1100/1440px에서 `scrollWidth === clientWidth` (초과 없음). 390px만
  위 §2 버그로 실패.
- 분야 페이지: 동일 패턴(390px만 §2, 나머지 통과).
- **논문 페이지(`#/p/transformer`)는 위 §1로 전 폭 실패** — 홈/분야와 대조됨.

### 6. 좌측 내비(☰)
- `css/wiki.css:333` `@media(max-width:1100px)` 기준으로 1099px·1100px 둘 다
  `.nav-tree{display:none}` + `.nav-toggle{display:...}` 노출, 1440px에서
  `.nav-tree{display:block}` + 토글 숨김 — 홈/분야 페이지 양쪽에서 확인.
  **주의**: 실제 경계는 "1099/1100" 이 아니라 "1100/1101"이다(`max-width:1100px`이므로
  1100px 자체는 아직 모바일 취급). 과제 지시문의 "1100px = 경계 위"라는 라벨은
  실제 CSS와 맞지 않으니 참고.
- 논문 페이지(`#/p/transformer`)에서는 `navTreeDisplay`/`navToggleDisplay` 값 자체를
  별도로 측정하지 않았다(시간 제약) — **미측정**. 다만 nav 관련 마크업/CSS가 3개 라우트
  공용(`shell()`, `navToggleBtn()`)이므로 동일하게 동작할 것으로 추정되나 실측 확인은
  아니다.
- **기능 테스트**(390px, 홈에서 실측): 햄버거 클릭 → `.nav-tree`에 `nav-open` 클래스,
  `display:block`, 폭 300px(390px 안에 정상적으로 들어감), `.nav-scrim`에 `on` 클래스,
  `aria-expanded="true"`. `Escape` 키 → 전부 원복. 스크림 클릭으로도 정상적으로 닫힘.
  **분야/논문 페이지에서는 클릭 기능을 별도로 재실측하지 않았다(미측정)** — display
  상태만 확인.

### 7. 홈 계보 그래프
- 390px(< 700px)에서 `#homeGraph`(`<details>`)가 기본 닫힘(`open` 속성 없음) 확인.
- 767/768/1099/1100/1440px(≥ 700px)에서는 기본 열림 확인.
- 그래프 SVG 자체는 3138px로 매우 넓지만(`#gbox` 내부 `scrollWidth 3138` vs
  `clientWidth`가 뷰포트에 따라 321~1142), **문서 전체 `hasHScroll`은 모든 폭에서
  false** — 그래프가 자기 컨테이너(`#gbox`) 안에서만 스크롤되고 페이지를 밀지 않음을
  확인(홈 페이지 한정, §5 참고).

### 8. 모바일 리스트 터치 타깃 (390px)
- `.mobile-item` 446개 중 샘플 20개 전량 `getBoundingClientRect().height === 44`(px) —
  SHELF-SPEC §7의 "행당 44px 이상" 요구 충족.
- 767px에서는 §3 버그로 `.mobile-item`이 안 보여(`height:0`) 측정 불가 — 이건 별도
  터치타깃 결함이 아니라 §3의 결과다.

### 9. 표지 카드 (768px, 홈)
- 데스크톱 책등(`.spine`) 클릭 → `.cover-panel` 생성, `hidden` 속성 없음,
  `getBoundingClientRect()` = `{left:333, right:733, width:400}` — 768px 뷰포트 안에
  완전히 들어감(넘침 없음).
- `Escape` 키 → `hidden` 속성 다시 붙음(정상 닫힘).
- 1099/1100/1440px에서는 별도 재실측하지 않았음(768px에서 이미 고정폭 400px + 우측
  20px 고정 위치이므로 더 넓은 화면에서도 문제 없을 것으로 추정되나 확인은 안 함).

---

## 종합 미측정 목록 (추측 없이 명시)

- DPR=1(정수 배율) 환경에서 §3(767px 데드존) 재현 여부 — 이 세션 DPR 고정(1.25)으로 비교 불가.
- 분야(`#/f/llm`)·논문(`#/p/transformer`) 페이지의 좌측 내비 실제 클릭 인터랙션(열기/Esc/스크림) — display 상태만 확인, 클릭 동작 미실측.
- 논문 페이지에서 표지 카드 관련 항목 — 애초에 해당 페이지엔 책장/책등이 없으므로 해당 없음(N/A).
- 각 폭별 전체 페이지 스크린샷(텍스트 잘림·겹침 육안 확인, 요구사항 §7) — 세션 중 반복된 탭 자동 새로고침으로 계획한 스크린샷 세트를 다 확보하지 못함. 상단 영역 1장(390/767/768/1099/1100 비교)만 확보했고, 논문 페이지 하단(수식·표·그림)의 개별 스크린샷은 못 찍음 — 대신 `getBoundingClientRect` 정밀 측정으로 대체함.
- 논문 페이지 KaTeX 폭주(§1)가 `transformer` 외 다른 논문 slug에서도 재현되는지 — 이번 지정 범위 밖이라 미확인.
- §1에서 25개 KaTeX 인스턴스 중 정확히 어느 하위 표현이 범인인지 — 근호+`\left\right` 조합이 있는 두 수식(`content/papers/transformer.js:41`, `:47`)을 유력 후보로 지목했으나 개별 격리 테스트는 안 함.
- 검색창 오버플로(§2)가 정확히 몇 px부터 시작되는지(예: 420~500px 구간) — 과제 지정 폭(390/767/768/1099/1100/1440)에는 그 구간이 없어 미측정.

---

## 산출물
- `design/mock/viewport-test.html` — iframe 6개(390/767/768/1099/1100/1440) 동시 로드,
  라우트 선택(홈/분야/논문), "전체 측정 실행" 버튼으로 `scrollWidth`/컬프릿 요소/책장·
  내비·그래프·터치타깃/표지카드 유무를 JSON으로 리포트. 브라우저로 직접 열어 재현/
  재검증 가능.
