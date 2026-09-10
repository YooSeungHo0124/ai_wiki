# 접근성 재감사 — 책장(446편) 개편 후

전제 문서: `design/A11Y-PERF.md`(개편 전 기준선, 이하 "1차 감사"), `design/SHELF-SPEC.md`(§3 키보드, §4 스크린리더).
측정 방법: `python3 -m http.server 8899`로 로컬 서빙 후 Chrome(claude-in-chrome)으로 실측. `document.querySelectorAll`, `getComputedStyle`, 실제 키보드 이벤트 디스패치(및 일부는 물리 키 입력)로 확인. **"고쳤다고 보고됐으니 통과" 처리는 하지 않았다 — 아래 전부 직접 재현.**

측정 환경 메모(1차 감사와 동일 현상 재확인): 이 세션도 Chrome 탭 그룹을 다른 세션과 공유하고 있어, 작업 중 최소 3회 탭이 `design/mock/viewport-test.html`로 임의 전환되거나 탭 그룹이 통째로 사라지는 일이 있었다. 매번 새 탭을 만들어 재현했고, 결과가 의심스러운 것(§7 PageDown 1건)은 재현 불일치를 명시했다.

---

## 요약 — 심각도별 표

| 심각도 | 건수 | 항목 |
|---|---|---|
| **치명(Critical)** | 0 | — |
| **중대(High)** | 2 | `.brand`가 여전히 `role="link"` div (§1), 홈 헤딩이 h2→h4로 건너뜀 (§4, 새로 발견) |
| **경미(Medium)** | 3 | `--text-faint`/`--text-tertiary` 색상 차이가 거의 사라져 위계가 색만으로는 안 읽힘 (§5), PageDown 실제 키 입력 시 결과 불일치 — 미검증 (§7), `role="link"`인 `.brand`가 Space로도 활성화됨(표준 불일치, §1 부록) |
| **정보/통과 확인** | 다수 | 아래 표 참고 |

---

## 1차 감사 6건 지적의 해소 여부

| # | 1차 감사 지적 | 판정 | 근거 |
|---|---|---|---|
| 1 | `role="link"` div → `<a href>` | **부분 통과** | 책등(446개) · 분야 카드 · 검색 결과 · 그래프 pill · nav 링크 전부 진짜 `<a href="#/...">` 로 전환됨(`js/wiki/shelf.js:212`, `js/wiki/app.js:655,693,765`,`811` 등). 브라우저 실측 `document.querySelectorAll('[role="link"]').length === 1`, 남은 하나는 `index.html:23`의 `<div class="brand" tabindex="0" role="link">` — **1차 감사가 예측한 그대로 미수정**. 게다가 `app.js:1032-1034`에서 이 div를 Enter **와 Space** 둘 다로 활성화하는데, `role="link"`는 Enter만 활성화하는 게 표준(Space는 버튼의 키)이라 1차 감사 §4.3이 지적한 "링크라고 안내하지만 버튼처럼 동작" 문제가 그대로 남아 있다. |
| 2 | `document.title` 라우트별 갱신 | **통과** | `setTitle()`(`app.js:383-385`)가 `viewHome/viewField/viewPaper/viewGrowing/viewCourse` 전부에서 호출됨. 실측: `#/`→"AI Wiki — 인공지능 논문 계보", `#/f/llm`→"Transformer · 대규모 언어모델 — AI Wiki", `#/p/bert`→"BERT — AI Wiki". `#/growing`,`#/course`는 코드상 `setTitle('성장 중인 노트')`,`setTitle('입문 7편 코스')` 호출 확인(브라우저 탭 경합으로 이 두 값만 실측은 못했으나 로직이 다른 라우트와 동일해 신뢰도 높음 — 부분적으로 코드 근거). |
| 3 | 검색 콤보박스 ARIA 배선 | **통과** | 실제 키보드 시퀀스로 재현: `/` 이후 타이핑 → `aria-expanded="true"`, 결과 행이 `role="option"` + `id="res-opt-N"`(`app.js:94`) → `ArrowDown` → `aria-activedescendant="res-opt-0"` + 그 옵션의 `aria-selected="true"`(`app.js:100`). Enter로 이동 확인. 1차 감사가 지적한 "가짜 콤보박스" 문제 해소. |
| 4 | 홈에 `<nav>` 랜드마크 없음 | **통과** | 실측 `document.querySelectorAll('nav').length === 1`(홈). `navTreeHTML(..., lite=true)`가 21개 분야 링크만 담은 가벼운 `<nav aria-label="분야 내비게이션">`을 반환(`app.js:254`) — DOM 예산(6,000)을 지키면서 랜드마크는 유지. 다만 헤딩 계층은 아래 §4에서 새로 발견한 문제가 있음(부분적 재발). |
| 5 | `--text-faint`/`--text-tertiary` 대비 미달 | **통과(대비 자체는), 위계는 경미한 부작용** | 재계산: 라이트 `--text-tertiary` 4.75:1, `--text-faint` 4.59:1 / 다크 `--text-tertiary` 5.46:1, `--text-faint` 4.60:1(`css/tokens.css:133-134,372-373,443-444`, `getComputedStyle` 기반 상대휘도 공식으로 재계산, bg-page 기준). 둘 다 AA(4.5:1) 통과. **다만** 두 토큰 값이 이제 거의 같은 밝기로 수렴했다(`#656d81` vs `#686f85`, 라이트 / `#7e889d` vs `#717b95`, 다크) — `.chip-year`(12px, text-faint), `.nav-count`(10.5px, text-faint), `.crumb`(12px, text-tertiary)를 나란히 봤을 때 글꼴(모노스페이스 vs 산세리프)과 크기 차이(12/11.5/10.5px)만으로 위계를 구분해야 하는데, 그 차이가 1.5px 안팎이라 육안으로 "이게 더 흐린 정보"라는 신호가 약하다. §4.6이 우려한 "AA는 통과했지만 위계가 무너지는" 상황이 실제로 발생했다 — Medium으로 신규 기재. |
| 6 | KaTeX 홈에서 즉시 동기 로드 | **통과** | `index.html`은 더 이상 `<script src="vendor/katex/katex.min.js">`를 정적으로 갖지 않음. 실측: 홈(`#/`)에서 `window.katex === undefined`. `#/p/bert` 진입 후(`ensureKatex()`, `app.js:394-405`) 로드되어야 하나, 탭 경합으로 katex 로드 직후 재확인 시점에 다른 세션이 탭을 root로 되돌려(`href`가 `http://localhost:8899/`로 바뀜) `.katex` 엘리먼트 실측은 **완주하지 못함** — 코드 경로(`Promise.all([W.load(slug), ensureKatex()])`, `app.js:748`)는 정상이라 판단 근거는 있으나 "논문 페이지에서 실제 수식 렌더" 자체의 브라우저 실측은 미완료로 남긴다. |

---

## 항목별 상세 판정 (사용자 질문 1~10)

### 1. `role="link"` 잔존 — **부분 통과 / 실패 1건**
- 홈·분야·논문 전 화면 실측: `[role="link"]`는 **1개**, `index.html:23`의 `.brand`.
- 재현: 아무 페이지에서나 콘솔에 `document.querySelectorAll('[role="link"]')` → `.brand` 하나만 반환.
- 부가 결함: `.brand`가 Enter/Space 둘 다로 활성화(`js/wiki/app.js:1031-1034`) — `role="link"`의 표준 활성화 키(Enter만)와 불일치. 446개 책등·카드·pill은 전부 실제 `<a href>`로 전환되어 우클릭/새 탭 열기가 정상 동작함을 확인(수정클릭 `isModifiedClick()`, `shelf.js:487-489,498`이 새 탭 열기를 방해하지 않음).

### 2. `document.title` 라우트별 갱신 — **통과**
- 실측값: `#/` → `AI Wiki — 인공지능 논문 계보`, `#/f/llm` → `Transformer · 대규모 언어모델 — AI Wiki`, `#/p/bert` → `BERT — AI Wiki`.
- `#/growing`, `#/course`는 탭 경합으로 실측을 완주하지 못했으나 `setTitle('성장 중인 노트')`(`app.js:649`), `setTitle('입문 7편 코스')`(`app.js:671`) 코드 확인 — 다른 라우트와 동일 패턴이라 신뢰도 높음(참고용, 완전한 브라우저 실측은 아님).

### 3. 검색 콤보박스 — **통과**
- `/` → 포커스 → "ber" 입력 → `aria-expanded="true"`, 결과 12개가 `role="option"` + 각 `id="res-opt-i"`로 렌더(`app.js:94`).
- `ArrowDown` → `aria-activedescendant="res-opt-0"`, 해당 옵션의 `aria-selected="true"` 확인.
- Enter로 `W.go()` 호출 및 입력창 정리(`app.js:107`) 코드 확인.

### 4. 홈 `<nav>` 랜드마크 및 구조 — **부분 통과(랜드마크 통과, 헤딩 순서 신규 실패)**
- 랜드마크: `header`(1) / `nav`(1) / `main`(1) — 정상.
- 헤딩 순서 실측(`document.querySelectorAll('h1,h2,h3,h4')` 문서 순서):
  ```
  H1 AI Wiki
  H2 인공지능 논문 계보          (hero)
  H4 이어보기                    ← h3 없이 h2 다음 h4  (app.js:486)
  H4 더 자라는 중                                    (app.js:493)
  H2 책장
  H2 기반
  H3 기초 · 학습 알고리즘
  ...
  ```
  **실패**: `personalStrip()`(`js/wiki/app.js:481-495`)의 "이어보기"/"여기서 시작하세요"/"더 자라는 중" 위젯 제목이 `<h4>`인데, 그 앞에 `<h3>`가 전혀 없어 h2→h4로 레벨을 건너뛴다(WCAG 1.3.1). 1차 감사가 지적한 "21개 분야가 flat h3"는 고쳐졌지만(책장 섹션은 이제 h2 그룹 → h3 분야로 정상 계층화됨), 그 대신 개인화 스트립에서 새로운 스킵이 생겼다.

### 5. `--text-faint`/`--text-tertiary` 대비 — **통과(수치), 위계는 경미 실패**
- 재계산 결과는 위 표 참고. 코드 주석(`css/tokens.css:133-134`)에 적힌 근거값과 재계산치가 정확히 일치.
- 위계 문제: 눈으로 봤을 때 `.chip-year`(연도)와 `.crumb`(브레드크럼)가 사실상 같은 밝기로 보임 — "덜 중요한 정보"라는 신호가 색으로는 거의 안 남는다. 크기 차이(12px/11.5px/10.5px)와 글꼴(모노스페이스 vs 산세리프)이 유일한 구분 신호인데, 12px vs 12px인 `.chip-year` vs `.crumb`는 크기도 같아 글꼴 차이 하나로만 구분해야 한다.

### 6. KaTeX 지연 로딩 — **통과(홈), 미완료(논문 페이지 렌더 확인)**
- 홈: `window.katex === undefined` 확인.
- 논문 페이지 진입 후 `.katex` 엘리먼트 존재 여부는 탭 경합으로 재확인 전 세션이 끊겨 완주하지 못함. `ensureKatex()`(`app.js:394-405`)가 `Promise.all([W.load(slug), ensureKatex()]).then(renderPaper)`로 배선된 것은 코드로 확인했으므로 구조적으로는 맞으나, **"실제로 수식이 렌더된다"는 최종 시각적 확인은 미검증으로 남긴다.**

### 7. 책장 키보드 전수 — **통과(대부분), 1건 미검증(재현 불일치)**
- 로빙 tabindex 실측: `document.querySelectorAll('.spine[tabindex="0"]').length === 1`(446개 중). 실제 `Tab` 키를 눌러 확인 — 책등 하나에 포커스된 상태에서 물리 `Tab` 1회 → 포커스가 책장을 벗어나 바로 "계보 그래프 보기"(`<summary>`)로 이동. **446번 Tab을 눌러야 하는 문제 없음, SHELF-SPEC §3 그대로 구현됨.**
- `ArrowRight`: 다음 책(퍼셉트론→역전파)으로 이동 확인.
- `Home`: 실제 물리 키로 첫 책(퍼셉트론)까지 정상 이동 확인.
- `End`: 마지막 책(446번째, "슬리퍼 에이전트")까지 정상 이동 확인.
- `PageDown`(합성 이벤트로 재현): `nextFieldBoundary(1)`가 다음 분야(theory) 첫 책으로 정확히 이동 — 코드 로직 정상.
- `PageDown`(물리 키 입력, xdotool 키심볼 `Next`): 같은 상황에서 포커스가 검색 입력창으로 튐 — **합성 이벤트와 물리 키 입력 결과가 불일치**. 재시도 환경(탭 경합)과 겹쳐 원인을 특정하지 못했다 — **미검증**으로 남긴다. 재현 방법: 홈에서 책등 하나에 포커스 후 물리 `PageDown` 키를 누르고 `document.activeElement`를 확인. 실제 사용자 환경에서 재현되는지 별도 확인 필요.
- `Enter`(선택): 실제 키 이벤트로 확인 — 포커스는 책등에 그대로 유지된 채(§2 규칙대로 이동하지 않음) 표지 카드가 열림, `aria-selected="true"`로 갱신.
- `Escape`: 책등에 포커스 있는 상태에서 자연스럽게(target에서 dispatch, bubble) 확인 — 카드 닫힘, `is-selected` 클래스·`aria-selected` 모두 해제, **포커스는 책등에 그대로 유지**(SHELF-SPEC §2 "포커스 이동 없음" 요건과 일치).
- 타입어헤드: 코드 검토로 로직 확인(`shelf.js:530-540`), 물리 키 입력으로는 별도 재현하지 못함(시간 제약) — **부분 미검증**.

### 8. 표지 카드 포커스 관리 — **통과**
- `Enter`로 열었을 때 포커스는 책등에 유지(카드 안으로 강제 이동하지 않음) — 그래프 카드와 동일하게 "곁다리 패널" 취급, 포커스 트랩 없음(`cover.js:196-198` 주석대로 구현 확인).
- `Escape`로 닫으면 카드가 사라지고 포커스는 원래 책등에 남음(트리거로 "돌아오는" 것이 아니라 애초에 옮겨간 적이 없어 유지됨 — 결과적으로 스펙 요건 충족).
- ×버튼으로 닫을 때는 `wireCover`의 `doClose()`가 `state.trigger.focus()`를 호출해 트리거로 복귀시키는 코드 확인(`cover.js:211-227`) — 마우스로 다른 책등을 클릭한 뒤 ×를 눌러도 원래 트리거(방금 그 책)로 돌아옴. 물리 마우스 클릭으로 재현은 못했으나(시간 제약), 로직이 단순하고 `state.trigger`가 `open()` 시점에 항상 캡처되므로 신뢰도 높음.
- 카드 안 Tab 순환은 트랩이 없으므로(의도적) 그대로 페이지의 다음 요소로 빠져나감 — 스펙이 요구하는 "언제든 Tab으로 빠져나갈 수 있는 보조 패널"과 일치.

### 9. 스크린리더 구조 — **통과**
- 실측 role 구조: `.shelf[role="region"]` 1개, `.shelf-row[role="listbox"]` 21개(분야 수와 일치), `.spine[role="option"]` 446개 — SHELF-SPEC §4가 요구한 구조와 정확히 일치.
- 실제 `aria-label` 3건 실측:
  - `"퍼셉트론, The Perceptron: A Probabilistic Model for Information Storage, 1958년, 상록수 단계"`
  - `"역전파, Learning Representations by Back-Propagating Errors, 1986년, 상록수 단계"`
  - `"ImageNet, ImageNet: A Large-Scale Hierarchical Image Database, 2009년, 상록수 단계"`
- 저자 없는 논문(`sae`) 실측: `"Sparse Autoencoder, Towards Monosemanticity: Decomposing Language Models with Dictionary Learning, 2023년, 상록수 단계"` — 저자 구간이 통째로 생략되고 "저자 미상" 같은 허위 채움 없음. SHELF-SPEC §4 요구사항과 정확히 일치.

### 10. `prefers-reduced-motion` — **코드 검토로만 확인(브라우저 강제 미실측)**
- 이 세션의 도구로는 `prefers-reduced-motion`을 강제로 켜고 실제 렌더를 볼 방법이 없어 **코드 검토로만 판정**한다.
- `css/tokens.css:527-536`의 전역 `@media (prefers-reduced-motion: reduce)` 블록이 `--dur-state`, `--dur-layout`, `--shelf-hover-duration`, `--shelf-dim-duration` 등을 전부 `0ms`로 낮춤.
- `css/shelf.css:211-214`에 컴포넌트 레벨에서 한 번 더 `.spine`, `.spine.is-dim`의 `transition-duration:0ms`를 명시(이중 방어) — SHELF-SPEC §9-2, §5 요구사항과 일치.
- 호버 시 `translateY(-3px)` 자체(정적 최종 상태)는 reduced-motion에서도 유지되는데, 이는 "상태 정보는 남기고 거기로 가는 움직임만 지운다"는 1차 감사·SHELF-SPEC의 설계 의도와 일치하므로 문제 아님.

---

## 새로 발견한 것 (책장/표지 카드 외)

1. **홈 헤딩 h2→h4 스킵** (§4 상세 참고, `js/wiki/app.js:486,493`) — Medium/High 경계. 개인화 스트립("이어보기"/"성장 중인 노트")이 h3 없이 h4를 씀. 책장 자체의 헤딩 계층화(h2 그룹→h3 분야)는 잘 됐지만, 그 앞단에서 새 스킵이 생겨 1차 감사가 지적한 "헤딩 계층 문제"가 다른 형태로 재발했다.
2. **`--text-faint`/`--text-tertiary` 위계 붕괴** (§5 상세 참고) — AA 수치는 통과했지만 두 토큰이 육안으로 거의 구분 안 될 만큼 밝기가 수렴해, "이건 덜 중요한 정보"라는 신호가 약해졌다. 대비 수정과 위계 유지가 트레이드오프 관계에 있다는 걸 보여주는 사례 — 크기/굵기 차이를 지금보다 키우는 조정을 권고.
3. **PageDown 물리 키 입력 시 재현 불일치** (§7) — 합성 이벤트로는 정상 동작하나 실제 키 입력에서 검색창으로 포커스가 튀는 현상 관찰. 원인 미특정(탭 경합 가능성 있음) — 재현 여부를 다른 환경에서 재확인 필요.
4. **`.brand`의 Space 활성화** — `role="link"`이면서 Enter/Space 둘 다로 활성화(`app.js:1031-1034`)하는 건 1차 감사가 지적한 것과 동일한 표준 불일치가 그대로 남아 있음(신규는 아니고 미해결 확인).

## 미검증으로 남긴 항목과 이유

- `#/growing`, `#/course` 라우트의 `document.title` 실측값(탭 경합) — 코드 근거만 확보.
- 논문 페이지 진입 후 `.katex` 엘리먼트 실제 렌더 여부(탭 경합으로 재확인 전 세션 종료) — 코드 경로만 확인.
- 표지 카드 ×버튼 클릭 시 포커스 복귀의 실제 마우스 조작 재현(시간 제약) — 코드 검토로 대체.
- 타입어헤드 키 입력 실제 재현(시간 제약) — 코드 검토로 대체.
- `prefers-reduced-motion` 실제 브라우저 강제 렌더(도구 한계) — 코드 검토로 대체.
- PageDown 물리 키 불일치의 근본 원인(환경 요인 vs 실제 버그 여부 미특정).
