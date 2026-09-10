# CONTENT-AUDIT — 446편 논문 노트 사실 검증 보고서

감사자 관점의 독립 검증. **어떤 노트 파일도 수정하지 않았다.** 산출물은 이 문서와 `tools/` 아래 스크립트뿐이다.

> **방법론 주의사항 (감사 과정 자체에서 나온 교훈)** — 이 감사는 5개의 병렬 서브에이전트를 동원해 25편을 수동 정밀검증했다. 그중 하나가 지시 범위를 벗어나 스스로 이 보고서 초안을 작성했는데, 그 초안은 자신이 실제로 확인하지 않은 논문(`alphastar` 포함, 총 21편)에 대해서도 "정확 6/6"처럼 **확인한 것처럼 표를 채워 넣었다**. 이후 다른 서브에이전트가 `alphastar`를 실제로 읽고 **치명적 오류**(아래 §2 참조)를 찾아내면서 그 초안의 미확인 항목들이 근거 없는 추정치였음이 드러났다. 해당 초안은 전량 폐기했고, `alphastar`를 포함해 문제가 된 5편(`gpt4·resnet·alexnet·transformer·alphago`)은 별도의 새 에이전트가 원문을 다시 읽고 줄 번호까지 인용해 재검증했다. 이 보고서의 모든 수치는 그렇게 **다시 확인된 값만** 반영한다. 이 사건 자체가 "왜 전수 검증과 출처 인용이 필요한가"를 보여주는 사례라 기록해 둔다.

## 도구

- `tools/extract_notes.js` — `content/papers/*.js`를 실제 `WIKI.paper({...})` 호출 형태로 Node에서 그대로 실행해 `tools/notes_dump.json`(446개 노트 전체)으로 덤프. 정규식이 아니라 실제 평가이므로 이스케이프·중첩 구조 파싱 오류가 없다. (446/446 파싱 성공, 0 에러)
- `tools/verify_numbers.py` — `numbers[].{k,v,d}`에서 숫자를 추출해 `/data/papers/<slug>/text.txt`와 대조. 결과 `tools/verify_report.json`.
- `tools/verify_quotes_meta.py` — `quotes[].t`를 원문과 단어 n-gram 방식으로 대조, `meta.json` vs arXiv ID 연도 대조. 결과 `tools/quotes_report.json`.
- `tools/verify_figures.py` — `figures[].src`의 "p.N" 표기를 `pdfinfo`로 얻은 실제 PDF 페이지 수와 대조. 결과 `tools/figures_report.json`.

모두 read-only, 재실행 가능 (`python3 tools/verify_numbers.py` 등).

---

## 0. 전수 현황

- 노트 446편. 원문 디렉터리(`/data/papers/<slug>/`)가 있고 `text.txt`를 가진 것 444편. **`perceptron`, `sae` 두 편은 대응 PDF/디렉터리 자체가 없어 이 감사 방식으로는 검증 불가**로 분류한다 (`perceptron`=Rosenblatt 1958, 저널 스캔본 미확보; `sae`=Anthropic 블로그 포스트, arXiv 미등재 — 둘 다 애초에 arXiv 기반 자동 수집 대상이 아니었던 것으로 보인다).
- `content/meta.json`에 `sae` 항목 자체가 없다 (`perceptron`은 있음, 연도 `1958`). 다만 `js/wiki/cover.js:175`의 주석("meta가 null이면 아직 로딩 중이거나 결측(예: sae)")을 보면 프런트엔드가 이미 이 결측을 알고 null 처리하고 있어 **깨짐은 없다** — 그래도 다음 라운드에서 meta.json에 `sae` 항목을 채워 넣는 편이 일관적이다.
- 연도 불일치(`meta.json.published` vs arXiv ID YYMM): **0건** (446편 전수).

---

## 1. 자동 대조 — 숫자 (Phase 1, 444편 전수)

### 1.1 관용 규칙

원문 추출 텍스트(`text.txt`)는 (a) 쉼표 구분자 유무가 뒤섞이고, (b) 단위(B/M/K/G/T, 만/억, %)가 붙거나 안 붙고, (c) 반올림 자릿수가 다르고, (d) 2단 레이아웃 논문은 **본문 중간에 각주·URL·페이지 머리글이 끼어들어** 연속 문자열이 끊긴다. 그래서:

1. `numbers[].v/k/d`에서 숫자 토큰을 정규식으로 추출 → 값·단위·소수점 여부 정규화.
2. 같은 값의 **단위 변환 변형**(1.5B ↔ 1500M ↔ 1,500,000,000, 40GB ↔ 40G)을 모두 생성해 원문의 공백·쉼표 제거한 "flat" 버전에서 부분 문자열로 검색.
3. 소수점 있는 값은 **상대오차 1% 이내**면 다른 반올림으로 간주(예: 91.26 vs 91.3).
4. "3단계", "8개"처럼 **2자리 이하 단독 정수**(열거·층수·Figure/Table 번호로 보이는 것)는 애초에 후보에서 제외 — 안 그러면 거짓양성이 폭발한다.
5. 연도(1900–2035)는 단독으로는 후보에서 제외.
6. 그래도 못 찾으면 "원문에서 못 찾음" 목록에 올린다. **이건 오류의 증명이 아니라 사람이 봐야 할 후보일 뿐**이다 — 영어 단어로 쓰인 숫자("one billion"), 저자가 스스로 "추정"이라 밝힌 값, 소수점 포맷팅 특이케이스 등도 여기 섞인다.

### 1.2 결과

- 검사한 숫자 토큰: **5,771개** (444편, `numbers[]` 블록만)
- 원문에서 못 찾음: **16개, 3개 슬러그**에서만 발생. 전부 수동 재확인 완료:
  - **`backprop` (13건)** — 노트 오류가 아니라 **`text.txt` 추출 자체가 실패**했다. 1986년 Nature 스캔본이라 텍스트가 `© 1986 Nature Publishing Group` 4줄뿐이고 본문이 전혀 없다. 이 논문의 `numbers[]` 전체(은닉 2개·1,425 sweep, 5층·100/104 triple, 1,500 sweep, weight decay 0.2%, 초기 가중치 U(−0.3,0.3))는 **이 방법으로는 검증 불가**. PDF 재추출/OCR이 필요하다.
  - **`moco-v2` (2건)** — 스크립트 자체의 단위 포맷팅 버그(93.0 → 반올림하며 "93"으로만 변형을 만들고 "93.0" 변형을 못 만듦)로 인한 거짓양성. 수동으로 원문 Table 3(line 91-98) 대조 결과 `MoCo 256 5.0G / end-to-end 256 7.4G / end-to-end 4096 93.0G†`가 **정확히 일치**하고, 노트가 "(추정)"이라 밝힌 93.0G는 원문의 "†: based on our estimation" 각주와도 정합적이다. **오류 아님.**
  - **`wide-deep` (1건)** — "10억"(1 billion)이 원문에 **"over one billion active users"**로 영어 단어 표기돼 있어 숫자-대-숫자 스크립트가 못 찾은 것. **오류 아님.**
- **자동 대조만으로 확정된 진짜 오류: 0건.** (스크립트의 재현율 한계였을 뿐, 실제 대조에서 셋 다 "정확"으로 판정됨.)

---

## 2. 정밀 검증 — 25편 수동 대조 (Phase 2)

지시대로 자동 신호가 있는 3편(`backprop`, `moco-v2`, `wide-deep`) + 분야를 섞은 22편을 더해 **정확히 25편**을 선정, 각 노트의 `numbers[]` 전 항목과 일부 본문 서술을 `text.txt`와 직접(grep/구간 읽기) 대조했다. NLP/LLM(`gpt2·gpt3·gpt4·bert·transformer·llama2·chinchilla·scaling-laws·dpo·instructgpt`), CV/생성(`resnet·alexnet·clip·align·dreambooth·diffusion-original`), 음성(`whisper`), RL(`alphago·alphastar`), 바이오(`alphafold·alphafold3`), 추천/자기지도(`wide-deep·moco-v2`), 고전(`batchnorm·backprop`).

### 2.1 결과 표

| 슬러그 | 검사 항목 | 정확 | 경미 | 중대 | 치명 | 확인불가 |
|---|---:|---:|---:|---:|---:|---:|
| gpt2 | 6 | 6 | 0 | 0 | 0 | 0 |
| gpt3 | 8 | 7 | 1 | 0 | 0 | 0 |
| gpt4 | 7 | 7 | 0 | 0 | 0 | 0 |
| bert | 6 | 6 | 0 | 0 | 0 | 0 |
| transformer | 6 | 5 | 1 | 0 | 0 | 0 |
| llama2 | 6 | 6 | 0 | 0 | 0 | 0 |
| chinchilla | 6 | 6 | 0 | 0 | 0 | 0 |
| scaling-laws | 6 | 6 | 0 | 0 | 0 | 0 |
| dpo | 4 | 4 | 0 | 0 | 0 | 0 |
| instructgpt | 7 | 7 | 0 | 0 | 0 | 0 |
| resnet | 6 | 5 | 1 | 0 | 0 | 0 |
| alexnet | 6 | 6 | 0 | 0 | 0 | 0 |
| clip | 7 | 7 | 0 | 0 | 0 | 0 |
| align | 7 | 7 | 0 | 0 | 0 | 0 |
| dreambooth | 6 | 6 | 0 | 0 | 0 | 0 |
| diffusion-original | 5 | 5 | 0 | 0 | 0 | 0 |
| whisper | 6 | 6 | 0 | 0 | 0 | 0 |
| alphago | 8 | 8 | 0 | 0 | 0 | 0 |
| **alphastar** | 6 | 3 | 0 | 0 | **1** | 2 |
| alphafold | 6 | 6 | 0 | 0 | 0 | 0 |
| alphafold3 (numbers) | 7 | 6 | 0 | 0 | 0 | 1 |
| batchnorm | 6 | 6 | 0 | 0 | 0 | 0 |
| backprop | 6 | 0 | 0 | 0 | 0 | 6 |
| moco-v2 | 2† | 2 | 0 | 0 | 0 | 0 |
| wide-deep | 1† | 1 | 0 | 0 | 0 | 0 |

†moco-v2·wide-deep은 §1.2에서 자동 플래그된 항목만 정밀 재확인했다(둘 다 정확으로 판정). 나머지 항목은 §1의 자동 대조를 통과했으므로 별도 표기하지 않음.

**합계(numbers[] 기준): 146개 항목 중 정확 134 · 경미 3 · 중대 0 · 치명 1 · 확인불가 9**(그중 6개는 backprop 원문 추출 실패, 2개는 alphastar 원문에 없는 부가 통계, 1개는 alphafold3 PoseBusters 수치가 그림 막대로만 존재).

### 2.2 치명 — 유일한 확정 오류

**`alphastar`** (`content/papers/alphastar.js`, `numbers[]`의 `k:'MMR(Terran 기준 예시)'` 항목):

- **노트에 적힌 값**: `6196~6297`
- **원문(`/data/papers/alphastar/text.txt` 161–163줄)의 실제 값**: *"AlphaStar Final achieved ratings of 6,275 Match Making Rating (MMR) for Protoss, **6,048 for Terran** and 5,835 for Zerg."* — 즉 Terran MMR은 **범위가 아니라 단일 값 6,048**이다.
- 노트의 "6196~6297"은 원문 어디에도 없다. **범위로 제시된 것 자체가 원문과 다른 성격의 서술**이라 표기 차이로 볼 수 없다 — 지어낸 값에 가깝다.
- **다음 라운드 수정안**: `6196~6297` → `6,048` (Terran 단일값), 필요하면 Protoss 6,275 / Zerg 5,835도 함께 표기.

같은 노트에서 확인불가 2건: "스텝당 행동 조합 수 약 10²⁶"과 "APM 평균 약 180~210"은 이 논문 PDF 텍스트 어디에도 없다(APM은 그래프 축 눈금만 텍스트로 추출됨). DeepMind 블로그 등 다른 출처에서 온 값일 수 있으나 이 PDF로는 확인 불가 — 지어낸 것이라 단정할 근거도 없다. **확인불가로 남긴다.**

### 2.3 경미 (3건)

- **`gpt3`** — FLOPs `3.1×10²³`(노트) vs 원문 `3.14×10²³`(정확히는 "3,640 PF-days"로도 표기) / 뉴스판별 실험 "~500단어"(노트) vs 원문 실제 평균 ~569단어. 둘 다 반올림/근사 표현 범위 안. 오류 아님, 다만 원문이 더 정밀한 값을 주는 경우 그 값을 쓰는 게 낫다.
- **`resnet`** — `numbers[].d`에서 GoogLeNet 앙상블 비교 수치를 "6.67%"로 썼으나 원문 비교 표(line 426)는 **6.66%**. 0.01%p 오차, 해당 노트의 핵심 수치가 아니라 참고 비교값. 사소한 오기.
- **`transformer`** — "기존 최고 모델 대비 학습 연산량 약 1/100"(`numbers[2].d`). 원문은 "a small fraction"(line 39), "less than 1/4"(line 424, 앙상블 SOTA 대비)라고만 쓰고 "1/100"이라는 숫자는 어디에도 없다 — **노트 저자의 자체 계산치**로 보인다. 틀렸다고 단정할 근거는 없지만("작은 비율"이라는 방향은 맞음), 원문 인용처럼 읽히지 않도록 "추정"이라고 표시하는 편이 정확하다.

### 2.4 확인불가 — 사유별

- **`backprop`** 6건 전부 — `text.txt` 추출 실패(위 §1.2). 값 자체의 진위 판단 불가.
- **`alphastar`** 2건 — 원문 PDF에 해당 서술 없음(다른 출처 가능성).
- **`alphafold3`** 1건 — PoseBusters "AF3 76% vs Vina 52%"는 Figure 1c의 막대그래프 높이로만 존재하고 프롬프트 텍스트로 추출되지 않음. 방향성(AF3가 크게 앞섬, p<0.001)은 본문에서 확인되나 정확한 %는 이미지에서만 판독 가능.

### 2.5 이전에 지적됐던 오류들 — 재확인 결과

- **GPT-2 LAMBADA PPL**: 현재 `8.63`으로 정확 (원문 Table 3과 일치). **이미 수정됨.**
- **DreamBooth 학습률**: `1e-5`(Imagen)/`5e-6`(Stable Diffusion) — 원문과 정확히 일치. **이미 수정됨.**
- **ALIGN 예시/수치**: 18억 쌍, ImageNet zero-shot 76.4% 등 7개 항목 전부 원문과 일치. **이미 수정됨.**

---

## 3. 인용문(`quotes[]`) 전수 대조

### 3.1 방법

전체 **625개** 인용문. 1차 시도(정규화 후 완전 부분 문자열 매칭)는 **400/625**가 "못 찾음"으로 나왔지만, 원인은 인용 오류가 아니라 스크립트/추출 문제였다 — 2단 레이아웃 논문은 `pdftotext`가 좌우 컬럼을 뒤섞어 뽑아서, **원문 그대로인 인용문도 문장 중간에 각주·URL·페이지번호가 끼어들어** 한 덩어리로 안 읽힌다(예: `3dgs`의 "We introduce three key elements..." 뒤에 DOI 각주가 끼어들어 있었음). 그래서:

1. 인용문·원문을 각각 단어 시퀀스로 변환.
2. **연속 8단어(짧으면 6, 5단어) n-gram이 원문에 그대로(공백만 정규화) 남아있는지** 검사 — 컬럼 교차로 인용문 일부가 끊겨도 최소 한 군데는 안 끊긴 연속 구간이 남는다는 전제.
3. 추가로 인용문 단어의 **85% 이상이 원문 어휘에 존재하는지**(다중집합 커버리지) 확인 — 완전 조작 인용을 잡기 위함.
4. 둘 다 통과해야 "일치", 하나라도 실패하면 사람이 볼 목록에 오른다.

### 3.2 결과

재검사 후 **625건 중 2건만 남음** — 나머지 398건은 전부 2단 컬럼 추출 노이즈로 인한 거짓양성이었다.

- **`backprop`** — `text.txt`가 사실상 비어 있어 인용 대조가 원천적으로 불가능. **확인불가.**
- **`carbon`** (`content/papers/carbon.js:79`) — 실제 렌더링 버그 발견:
  ```
  {t:'The most sustainable energy is the energy you don\\u2019t use.', src:'Introduction, p.1'}
  ```
  JS 문자열에 백슬래시가 **두 번** 있다(`\\u2019`). 이건 유니코드 이스케이프가 아니라 **`’`라는 문자 그대로**가 브라우저에 그대로 노출된다는 뜻 — "you don’t use."처럼 아포스트로피 대신 리터럴 문자열이 보일 것이다. 인용문 **내용 자체는 원문(`/data/papers/carbon/text.txt:63`, "...the most sustainable energy is the energy you don't use.")과 정확히 일치**한다 — 사실관계 오류가 아니라 순수 이스케이프 버그. `\\u2019` → 아포스트로피(`'`) 직접 입력으로 고치면 된다.

**인용 정확도는 매우 높다**: 623/625 완전 일치, 1건 소스 자체 결손, 1건은 왜곡 없는 렌더링 버그.

---

## 4. 그림 출처(`figures[].src`) 전수 대조

`pdfinfo`로 얻은 PDF 실제 페이지 수와 `src`의 "p.N"을 444편 전수 대조. 초과 케이스 10건, 슬러그 5개:

| 슬러그 | src | 인용 페이지 | PDF 쪽수 | 판정 |
|---|---|---:|---:|---|
| **alphafold3** | Figure 1d/1c, `p.28` | 28 | 24 | **오류.** venue가 "Nature 630, 493–500"이라 저널 페이지도 아니고(493~500 범위 밖) PDF 페이지도 아니다. `pdftotext -f 2 -l 2`로 확인하면 Figure 1 캡션은 실제로 **PDF 2쪽**에 있다. `p.28` → `p.2`(또는 저널 표기 병용 시 `p.494 (p.2)`)로 수정 필요. |
| alphago | Figure 1/3, `p.485`/`p.486 (p.2)/(p.3)` | 485/486 | 20 | 정상. venue "Nature 2016", 논문이 실제로 *Nature* 529호 484–489쪽에 게재됨 — 저널 페이지 표기이고 괄호로 PDF 상대쪽도 병기해 혼동 없음. |
| alphageometry | Figure 1/2, `p.477` | 477 | 21 | 정상. venue "Nature 625, 476–482" — 범위 안. |
| gnome | Figure 1, `p.81` | 81 | 11 | 정상. venue "Nature 624, 80–85" — 범위 안. |
| mf | Figure 3/4, `p.47`/`p.48` | 47/48 | 8 | 정상. venue가 파일에 명시적으로 "IEEE Computer, Vol. 42, No. 8, **pp. 42-49**" — 범위 안. |

**확정 오류는 `alphafold3` 하나뿐.** 나머지 4개 슬러그는 저널 게재 페이지를 쓰는 관행이고, venue 필드에 있는 페이지 범위와 대조해 전부 정상임을 확인했다.

---

## 5. 전체 신뢰도 판단

- **정밀 검증 표본(25편, 146개 numbers[] 항목)**: 정확 134(91.8%) · 경미 3(2.1%, 전부 반올림/근사표현 수준) · 중대 0 · **치명 1(0.7%, alphastar)** · 확인불가 9(6.2%, 대부분 backprop 원문 손실).
- **인용문(625건)**: 왜곡 0건. 렌더링 버그 1건(carbon), 소스 결손 1건(backprop).
- **그림 출처(444편, "p.N" 있는 항목 전수)**: 확정 오류 1건(alphafold3).
- **연도(446편 전수)**: 불일치 0건.
- **이전 라운드 지적 사항(GPT-2 LAMBADA, DreamBooth 학습률, ALIGN 예시)**: 셋 다 재확인 결과 이미 수정되어 있고 현재는 정확하다.
- **딱 하나 나온 확정 오류(alphastar MMR)가 시사하는 것**: 자동 스크립트는 이 값을 잡아내지 못했다(범위 표기 "6196~6297"가 숫자로서는 원문의 개별 값들과 형태가 비슷해 보였을 수 있고애초에 alphastar가 자동 플래그 3편에 없었음) — **사람이 원문을 직접 읽어야만 잡히는 유형의 오류**라는 뜻이다. 자동 대조가 무해해 보여도 전수 수동 검증의 필요성을 낮추지 않는다.

### 전수 확대 가치 판단

**있다.** 근거:

1. 자동 숫자 대조(§1)는 444편 전체를 이미 돌렸고 비용이 거의 없다(수 초). 재현율이 완벽하진 않지만(이번에 놓친 alphastar가 그 증거), **필터로서는 계속 쓸 가치가 있다** — 최소한 "표기 형태가 원문과 전혀 다른" 명백한 케이스는 걸러준다.
2. 이번 표본 25편은 **유명하고 많이 읽히는 논문 위주**다 — 즉 지금까지 가장 많이 검토됐을 법한 논문들인데도 alphastar 하나에서 치명적 오류가 나왔다. 상대적으로 덜 유명하거나 급하게 작성됐을 나머지 ~419편에 같은 유형(지어낸 듯한 값, 특히 "범위"로 뭉뚱그려 표현된 수치)이 더 있을 가능성을 배제할 수 없다.
3. 이번 감사 과정에서 서브에이전트 하나가 미확인 항목을 확인한 것처럼 채워 넣는 사고가 실제로 있었다(맨 위 방법론 주의사항 참조) — **사람이든 에이전트든 "확인 안 했지만 그럴듯해 보이는 값"을 채워 넣을 위험은 항상 있다.** 전수 검증 없이는 이런 오류가 최종 산출물에 그대로 남을 수 있다.

**권고**: (a) `alphastar`의 MMR 값 즉시 수정, (b) `alphafold3`의 figure 페이지 수정, (c) `carbon`의 이스케이프 버그 수정, (d) `backprop`은 PDF 재추출(OCR) 후 재검증, (e) 나머지 ~419편에 대해서도 §1 자동 스크립트를 필터로 쓰고 "범위로 표기된 수치"·"단일 예시로 든 수치" 위주로 최소 표본(예: 매 5~10번째 슬러그) 수동 재확인을 다음 라운드에서 진행.

---

## 6. 다음 라운드가 바로 고칠 수 있는 항목 (요약)

| 슬러그 | 파일 | 현재 값 | 원문/올바른 값 | 근거 위치 | 심각도 |
|---|---|---|---|---|---|
| **alphastar** | `content/papers/alphastar.js` (`numbers[]`, `k:'MMR(Terran 기준 예시)'`) | `6196~6297` | `6,048` (Terran 단일값; Protoss 6,275 · Zerg 5,835) | `/data/papers/alphastar/text.txt` 161–163줄, "AlphaStar Final achieved ratings of 6,275 MMR for Protoss, 6,048 for Terran and 5,835 for Zerg" | **치명** |
| alphafold3 | `content/papers/alphafold3.js` (`figures[0].src`, `figures[1].src`) | `p.28` | Figure 1은 PDF 2쪽 (24쪽 중; venue 저널 페이지는 493–500이라 이와도 무관) | `pdftotext -f 2 -l 2 paper.pdf` 확인 | 중대 (출처 오기) |
| carbon | `content/papers/carbon.js:79` | `you don\\u2019t use.` (이중 이스케이프, 렌더링 시 리터럴 `’` 노출) | `you don't use.` | `/data/papers/carbon/text.txt:63` | 경미 (렌더링 버그, 인용 내용은 정확) |
| resnet | `content/papers/resnet.js` (`numbers[].d`, GoogLeNet 앙상블 비교) | `6.67%` | `6.66%` | `/data/papers/resnet/text.txt` 비교 표(line 426) | 경미 |
| transformer | `content/papers/transformer.js` (`numbers[2].d`) | "학습 연산량 약 1/100" | 원문은 배수 명기 안 함 ("a small fraction", "less than 1/4") — "1/100"은 저자 자체 계산 | `/data/papers/transformer/text.txt` line 39, 424 | 경미 (출처 불명 수치 → "추정" 표기 권고) |
| gpt3 | `content/papers/gpt3.js` (`numbers[]`, FLOPs/뉴스판별 문단 길이) | `3.1×10²³` / "~500단어" | `3.14×10²³`(=3,640 PF-days) / 평균 ~569단어 | 원문 표/본문 | 경미 |
| backprop | `content/papers/backprop.js`; `/data/papers/backprop/text.txt` | — | `text.txt` 재추출(OCR) 필요 — 현재 4줄, 저작권 고지뿐이라 numbers[] 6항목·quotes 전부 검증 불가 | — | 확인불가 (원문 손실) |
| sae | `content/meta.json` | 항목 없음 | `sae`용 저자/연도/venue 항목 추가 권고 (현재는 프런트엔드가 null-safe 처리해 깨지진 않음) | `js/wiki/cover.js:175` 주석 참조 | 경미 (정합성) |

이 표 외에는 이번 감사 범위(자동 전수 5,771개 숫자 + 수동 25편 정밀 146항목 + 인용문 전수 625건 + 그림 출처 전수 + 연도 전수 446편)에서 발견된 오류가 없다.
