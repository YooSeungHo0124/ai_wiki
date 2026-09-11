# 개념 사전 집필 규약

논문 노트(`AUTHORING.md`)와 **다른 종류의 글**이다. 논문 노트는 "이 논문이 무엇을
했는가"를 쓰지만, 개념 노트는 **"이 말이 무슨 뜻인가"** 에 답한다.

독자는 인공지능을 개발하는 사람이다. 학부 강의를 옮겨 적지 말고, **실무에서
그 단어를 만났을 때 바로 쓸 수 있는 이해**를 주는 것이 목표다.

## 파일

`content/concepts/<slug>.js` 하나에 `WIKI.concept({...})` 호출 하나.
슬러그·이름·그룹·난이도·관련 논문은 `content/concepts.js` 의 `WIKI.CONCEPTS` 에
이미 정해져 있다. **그 행을 고치지 말고 그대로 따른다.**

## 스키마

```js
WIKI.concept({
  slug:'temperature',

  /* 한 문장 정의. 비유 말고 정의. 40~90자. */
  tldr:'다음 토큰 확률분포를 softmax 전에 나누는 값으로, 클수록 분포가 평평해져 다양한 토큰이 뽑힌다.',

  /* 왜 알아야 하는가 — 이 개념을 모르면 실무에서 무엇을 못 하는가. 2~3문장. */
  why:'...',

  /* 본문. 3~6개. h 는 14자 이내, d 는 2~5문장. */
  sections:[
    {h:'무엇인가', d:'...'},
    {h:'어떻게 동작하나', d:'...'},
    {h:'실무에서', d:'...'}
  ],

  /* 수식 — 있으면 반드시 tex 로. 없으면 통째로 생략. */
  math:[{tex:'p_i=\\dfrac{\\exp(z_i/T)}{\\sum_j \\exp(z_j/T)}', expr:'softmax with temperature', d:'T가 1보다 크면 ...'}],

  /* 다이어그램 — 논문 노트와 같은 선언형 6종(flow/stack/compare/loop/split/matrix).
     라벨 길이 상한도 같다. 없으면 생략. */
  diagram:{...},

  /* 헷갈리는 것 구분 — 이 사전의 핵심 가치. 2~4개 권장. */
  confuse:[
    {a:'temperature', b:'top-p', d:'전자는 분포 모양을 바꾸고 후자는 후보 집합을 자른다. 둘은 함께 쓴다.'}
  ],

  /* 짧은 코드/의사코드. 10줄 이내. 없으면 생략. */
  code:{lang:'python', d:'무엇을 보여주는 코드인지', src:'...'},

  /* 흔한 오해 — 2~4개. */
  pitfalls:['...','...'],

  /* 더 읽을 것: 이 개념을 실제로 만든/바꾼 논문. concepts.js 의 papers 를 기본으로
     하되, 본문에서 실제로 기댄 것만 남기고 필요하면 더한다. */
  papers:['nucleus-sampling','temperature-scaling'],

  /* 관련 개념 슬러그 — 개념끼리 잇는다. */
  terms:['sampling','top-k-top-p','perplexity']
})
```

## 글쓰기 규칙

1. **정의를 먼저, 비유는 나중에.** 비유로 시작하면 정확도가 먼저 무너진다.
   비유를 쓸 거면 그 비유가 **어디서 깨지는지**도 같이 써라.
2. **수식을 피하지 마라.** 대신 수식을 쓴 뒤 반드시 말로 한 번 더 풀어라.
   기호 하나하나가 무엇인지 밝혀라.
3. **실무 감각을 넣어라.** "보통 어떤 값을 쓰는가", "언제 문제가 되는가",
   "무엇을 먼저 의심하는가". 이게 없으면 위키백과 복사본이다.
4. **헷갈리는 짝을 반드시 다뤄라** — temperature vs top-p, 정규화(regularization)
   vs 정규화(normalization), 배치 vs 에폭, 검증 vs 시험. 한국어 번역어가 겹치는
   경우가 특히 많으니 **원어를 병기**하라.
5. 논문 링크는 `[이름](#/p/slug)`, 개념 링크는 `[이름](#/c/slug)`.
   **인덱스에 없는 슬러그로 링크하지 마라** — 죽은 링크가 된다.
6. 길이: 본문 4~9KB. 너무 짧으면 사전으로 쓸모가 없고, 너무 길면 논문 노트와
   구분이 안 된다.
7. **모르는 것을 지어내지 마라.** 수치를 쓸 거면 근거가 있는 것만 쓰고,
   "보통 0.7~1.0을 쓴다" 같은 관행은 관행이라고 밝혀라.

## 검증

```bash
node --check content/concepts/<slug>.js
node tools/check-concepts.js 2>&1 | grep <slug>   # 아무것도 안 나와야 한다
```

## 금지

담당 슬러그의 `content/concepts/<slug>.js` 만 만든다.
`content/concepts.js`, `content/fields.js`, `content/papers/`, `js/`, `css/`,
`index.html`, `tools/` — 전부 수정 금지.
