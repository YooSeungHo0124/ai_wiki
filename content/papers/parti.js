WIKI.paper({
slug:'parti',
venue:'arXiv 2022 (Google Research)',
authors:'Yu et al. (Google Research, Brain Team)',
arxiv:'2206.10789',

tldr:'텍스트→이미지 생성을 **확산이 아니라 기계번역과 같은 시퀀스-투-시퀀스 문제**로 풀어, 인코더-디코더 Transformer를 20B 파라미터까지 키운 논문. "모델을 키우면 이미지 품질이 계속 좋아진다"는 스케일링 곡선을 자기회귀 노선에서도 보였다.',

context:'2021~2022년 텍스트-이미지 생성은 두 노선으로 갈렸다. 하나는 [DALL·E](#/p/dalle)·[VQGAN](#/p/vqgan)이 연 **이산 토큰 자기회귀** 노선이고, 다른 하나는 같은 시기 [Imagen](#/p/imagen)이 보여준 **확산모델** 노선이다. 확산 쪽은 빠르게 사실적인 이미지 품질로 주목받았지만, 자기회귀 쪽이 정말 한계에 도달한 것인지는 검증되지 않은 채 남아 있었다. Parti는 이 질문에 정면으로 답한다 — 언어모델처럼 데이터와 파라미터를 계속 늘리면 자기회귀 이미지 생성도 계속 좋아지는가? 저자들은 350M에서 20B까지 네 단계로 같은 아키텍처를 그대로 키워 이 질문을 실험으로 검증했다.',

ideas:[
 {h:'텍스트→이미지를 번역 문제로 재정의',
  lead:'이미지 토큰 시퀀스를 "다른 언어의 문장"처럼 다루는 seq2seq 문제로 취급한다.',
  d:'Parti는 텍스트-이미지 생성을 기계번역과 똑같은 형태로 본다. 입력은 텍스트 토큰 시퀀스, 출력은 이미지 토큰 시퀀스이고, 그 사이를 표준 encoder-decoder [Transformer](#/p/transformer)가 잇는다. 이렇게 정의하면 언어모델 스케일링에서 쌓인 노하우(데이터·파라미터·인프라)를 그대로 이미지 생성에 가져다 쓸 수 있다는 것이 저자들의 핵심 통찰이다.'},
 {h:'ViT-VQGAN: 이미지를 이산 토큰으로 압축',
  lead:'256×256 이미지를 32×32=1024개의 이산 토큰으로 양자화해 언어처럼 다룬다.',
  d:'픽셀을 직접 다루면 256×256×3 이미지가 196,608개의 값이 되어 자기회귀로는 감당이 안 된다. 그래서 Transformer 기반 VQGAN 변형인 ViT-VQGAN으로 이미지를 8192개 코드북 항목 중 하나씩을 고르는 1024개 토큰 시퀀스로 먼저 압축한다. 2단계 학습에서는 이 토크나이저의 인코더와 코드북만 고정해서 쓰고, 디코더(이미지 복원)는 더 큰 용량으로 따로 미세조정한다.'},
 {h:'자기회귀 디코더가 토큰을 한 개씩 예측',
  lead:'디코더가 8192-vocab 이미지 토큰을 이전 토큰들에 조건부로 하나씩 순차 생성한다.',
  d:'인코더가 텍스트를, 디코더가 `<sos>` 다음부터 이미지 토큰 $i_1, i_2, \\dots, i_{1024}$ 를 다음-토큰 예측(softmax cross-entropy) 방식으로 순서대로 뽑는다. 학습·추론 모두 언어모델과 동일한 방식이라, 텍스트 인코더를 언어모델 데이터로 사전학습해서 넘겨받는 것도 가능하다.'},
 {h:'스케일링: 350M → 20B, 품질이 꾸준히 개선',
  lead:'같은 아키텍처를 그대로 20B까지 키우자 zero-shot FID가 단조롭게 낮아졌다.',
  d:'350M·750M·3B·20B 네 모델을 동일한 데이터·토크나이저·구성으로 학습시켰다. 크기가 커질수록 MS-COCO zero-shot FID가 꾸준히 낮아졌고, 특히 750M→3B 구간에서 품질이 크게 도약했다. 20B 모델은 텍스트 렌더링처럼 어려운 프롬프트에서 3B보다 뚜렷이 나았다 — 파라미터를 늘리는 것 자체가 여전히 유효한 레버라는 증거다.'},
 {h:'CoCa 리랭킹과 classifier-free guidance',
  lead:'프롬프트당 16장을 샘플링해 CoCa로 순위를 매기고 최적 이미지를 고른다.',
  d:'디코더는 확률적으로 샘플링하므로 한 프롬프트에 대해 16개 후보 이미지를 만든 뒤, 별도의 이미지-텍스트 정합 모델(CoCa)로 점수를 매겨 상위 이미지를 고른다. 여기에 classifier-free guidance도 함께 써서 텍스트 충실도를 높인다 — 확산모델 쪽에서 쓰이던 기법이 자기회귀 파이프라인에도 그대로 이식된 것이다.'}
],

diagram:{type:'flow', cap:'Parti 파이프라인. 왼쪽 encoder-decoder가 텍스트→이미지토큰을 자기회귀로 생성하고, 오른쪽 ViT-VQGAN이 토큰↔이미지를 오간다.',
 nodes:[
  {t:'텍스트', s:'토큰 시퀀스', a:'인코딩'},
  {t:'Tx 인코더', s:'텍스트 표현'},
  {t:'Tx 디코더', s:'자기회귀 생성', acc:true, a:'토큰 1024개'},
  {t:'이미지 토큰', s:'8192-vocab'},
  {t:'ViT-VQGAN 복원', s:'토큰→픽셀'},
  {t:'256×256 이미지', s:'CoCa로 리랭킹'}
 ]},

math:[
 {expr:'p(image_tokens | text) = Π p(i_t | i_<t, text)',
  tex:'p(i_1,\\dots,i_M \\mid t_1,\\dots,t_N)=\\prod_{m=1}^{M} p\\!\\left(i_m \\mid i_{<m},\\, t_1,\\dots,t_N\\right)',
  d:'이미지 토큰 시퀀스의 결합 확률을 텍스트에 조건부인 자기회귀 곱으로 분해한다. 언어모델의 다음-토큰 예측과 수식 형태가 완전히 같다 — 이미지가 "다른 언어의 문장"으로 취급되는 이유다.'},
 {expr:'L = -(1/M) Σ log p(i_m | i_<m, text)',
  tex:'\\mathcal{L}=-\\frac{1}{M}\\sum_{m=1}^{M}\\log p\\!\\left(i_m \\mid i_{<m},\\,\\text{text}\\right)',
  d:'8192-vocab 이미지 코드북에 대한 softmax cross-entropy 손실을 출력 길이 $M{=}1024$ 로 평균한다. 표준 언어모델 학습 손실과 동일하다.'}
],

numbers:[
 {k:'최대 파라미터', v:'20B', d:'350M·750M·3B·20B 네 단계로 스케일링 실험'},
 {k:'zero-shot FID · MS-COCO', v:'7.23', d:'20B 모델, 당시 SOTA. 파인튜닝 시 3.22'},
 {k:'파라미터별 zero-shot FID', v:'14.10 → 10.71 → 8.10 → 7.23', d:'350M→750M→3B→20B, 크기와 함께 단조 개선'},
 {k:'이미지 토큰 시퀀스 길이', v:'1024', d:'256×256 이미지 → 32×32 토큰, 코드북 크기 8192'},
 {k:'사람 선호도 · 이미지 사실성', v:'91.7%', d:'20B Parti vs 파인튜닝된 XMC-GAN, MS-COCO 1000개 프롬프트'},
 {k:'PartiPrompts(P2)', v:'1600여 개', d:'12개 카테고리 × 11개 난이도 축의 신규 평가 벤치마크'}
],

impact:'Parti는 확산모델이 텍스트-이미지 생성을 사실상 평정하던 시기에, **자기회귀 노선도 스케일만 충분하면 경쟁력이 있다**는 반례를 실험으로 제시했다. [DALL·E](#/p/dalle)가 연 "이미지를 토큰으로, 생성은 언어모델처럼"이라는 레시피가 350M이 아니라 20B까지 가면 무엇을 얻는지 보여준 첫 대규모 검증이었다. 동시에 PartiPrompts라는 어려운 프롬프트 벤치마크를 남겨, 이후 텍스트-이미지 모델 평가가 MS-COCO FID 하나에 의존하던 관행에서 벗어나게 했다.',

legacy:[
 '**노선 논쟁의 기준점** — 이후 비교 연구들이 "확산 vs 자기회귀" 트레이드오프(샘플링 속도, 텍스트 충실도, 구성 능력)를 논할 때 Parti를 자기회귀 쪽 대표로 인용',
 '**토크나이저 계열의 개선 압력** — ViT-VQGAN의 코드북 활용률·재구성 품질 문제(격자무늬 아티팩트 등)가 이후 [VQGAN](#/p/vqgan) 계열 개선 연구의 동기가 됨',
 '**대형 멀티모달 생성 모델로 이어짐** — 텍스트·이미지를 같은 토큰 공간에서 다루는 접근은 이후 [Chameleon](#/p/chameleon) 같은 early-fusion 멀티모달 모델로 계승',
 '**평가 관행 변화** — PartiPrompts 이후 텍스트-이미지 모델 논문들이 단일 FID 대신 다각도 프롬프트 세트로 평가하는 것이 관례가 됨'
],

pitfalls:[
 '**Parti는 확산모델이 아니다.** 같은 시기·같은 분야의 [Imagen](#/p/imagen)과 자주 묶여 언급되지만 노이즈 제거 과정이 전혀 없다 — 이산 토큰을 하나씩 순차 예측하는 자기회귀 모델이다.',
 '**추론이 본질적으로 순차적이다.** 1024개 이미지 토큰을 하나씩 생성해야 하므로, 병렬로 노이즈를 한 번에 제거하는 확산모델보다 샘플링이 느리다는 구조적 단점이 있다(논문도 이를 명시적 한계로 인정).',
 '**FID만으로 우열을 판단하면 안 된다는 것을 저자들이 직접 경고한다.** 검색 기반 베이스라인이 실제 이미지를 반환함에도 다양성 부족으로 FID가 나쁘게 나오는 사례를 본문에서 예로 든다.'
],

figures:[
 {f:'fig3-architecture.png',
  cap:'왼쪽: 텍스트 토큰 $t_1..t_N$ 을 인코더가 읽고, 디코더가 `<sos>` 이후 이미지 토큰 $i_1..i_M$ 을 하나씩 자기회귀로 생성(위쪽 Inference 경로)한다. 오른쪽 ViT-VQGAN 블록이 이미지↔토큰 변환을 맡는다 — 학습 때는 Image Tokenizer로 정답 토큰을 얻고(아래 Train 화살표), 추론 때는 Image Detokenizer로 생성된 토큰을 다시 픽셀로 복원한다.',
  src:'원문 Figure 3, p.4'},
 {f:'fig9-scaling.png',
  cap:'왼쪽 표: 파라미터를 350M→20B로 키울수록 MS-COCO zero-shot FID가 14.10에서 7.23으로 단조 감소. 오른쪽 그래프: 네 모델의 학습 손실 곡선도 같은 순서로 계속 낮게 깔린다 — 스케일이 학습 안정성과 최종 품질 모두를 함께 개선한다는 근거.',
  src:'원문 Figure 9, p.15'}
],

quotes:[
 {t:'Parti treats text-to-image generation as a sequence-to-sequence modeling problem, akin to machine translation, with sequences of image tokens as the target outputs rather than text tokens in another language.',
  src:'Abstract, p.1'},
 {t:'We note that the retrieval baseline is worse than using 30,000 random samples from MS-COCO real training set images.',
  src:'Section 5.3, p.13'}
],

links:[
 {t:'arXiv 2206.10789 — Scaling Autoregressive Models for Content-Rich Text-to-Image Generation', u:'https://arxiv.org/abs/2206.10789'},
 {t:'Parti 프로젝트 페이지 (parti.research.google)', u:'https://parti.research.google/'}
]
});
