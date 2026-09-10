WIKI.paper({
slug:'donut',
venue:'ECCV 2022',
authors:'Kim et al. (NAVER CLOVA · NAVER AI Lab · Upstage · Tmax · Google · LBox)',
arxiv:'2111.15664',

tldr:'문서 이해에서 **OCR 단계 자체를 없앤** 모델. 문서 이미지를 [Swin Transformer](#/p/swin) 인코더에 바로 넣고 [BART](#/p/bart) 디코더가 JSON 형태의 구조화된 텍스트를 직접 생성한다 — 중간에 "글자를 읽어낸 문자열"이 따로 존재하지 않는다.',

context:'[LayoutLM](#/p/layoutlm)류 문서 이해 모델은 모두 같은 전제 위에 서 있었다 — **OCR이 먼저 텍스트와 좌표를 뽑아주고, 모델은 그 결과를 이해만 한다.** 이 논문은 이 전제 자체를 문제 삼는다. OCR 엔진을 돌리는 데는 별도의 연산 비용이 들고, 언어·문서 종류가 바뀔 때마다 OCR 모델도 다시 손봐야 하고, 무엇보다 **OCR이 틀리면 그 오류가 그대로 다음 단계로 전파**된다. 저자들의 질문은 명확하다 — **"텍스트를 읽는 것"과 "문서를 이해하는 것"을 굳이 두 단계로 나눌 이유가 있는가?** 답으로 제시한 것이 OCR 엔진 없이 이미지에서 바로 구조화된 출력을 내는 end-to-end Transformer, Donut(**Do**cume**n**t **U**nderstanding **T**ransformer)이다.',

ideas:[
 {h:'OCR 모듈을 통째로 들어낸다',
  lead:'텍스트 검출·인식 없이 이미지 인코더 → 텍스트 디코더로 바로 이어 붙인다.',
  d:'구조는 단순하다. [Swin Transformer](#/p/swin) 인코더가 문서 이미지를 패치 임베딩으로 바꾸고, [BART](#/p/bart) 디코더가 그 임베딩을 조건으로 토큰을 하나씩 생성한다. 이 사이 어디에도 "OCR이 인식한 문자열"이라는 중간 산출물이 없다 — 이 점이 OCR 결과를 입력으로 **전제**하는 [LayoutLM](#/p/layoutlm)이나, 텍스트 줄 인식만 담당하는 [TrOCR](#/p/trocr)과 근본적으로 다른 지점이다.'},
 {h:'사전학습 과제는 "읽는 순서대로 다 받아쓰기"',
  lead:'이미지 전체의 글자를 좌상단→우하단 순서로 그대로 생성하는 의사-OCR 과제로 사전학습한다.',
  d:'IIT-CDIP의 스캔 문서 1,100만 장에 상용 OCR로 얻은 텍스트를 정답 삼아, "이미지를 보고 그 안의 모든 텍스트를 읽는 순서대로 토큰 생성"하는 cross-entropy 손실로 사전학습한다. 이 단계에서는 모델이 OCR 결과를 **모방**하지만, 학습이 끝나면 별도 OCR 엔진 없이 그 능력을 내재화한다.'},
 {h:'JSON을 토큰 시퀀스로 직렬화한다',
  lead:'중첩된 키-값 구조를 `<s_key>값</s_key>` 형태의 특수 토큰열로 바꿔 자기회귀 생성 문제로 만든다.',
  d:'출력은 JSON이지만, 디코더는 결국 토큰 시퀀스를 순차 생성할 뿐이다. 각 필드마다 `[START_필드]...[END_필드]` 형태의 특수 토큰 쌍을 두고, 태스크별 프롬프트(`<classification>`, `<parsing>`, `<vqa>` 등)를 입력 앞에 붙여 같은 모델이 분류·정보추출·질의응답을 전부 처리하게 한다. 짝이 맞지 않는 토큰이 나오면 해당 필드를 추출 실패로 간주하는 단순한 규칙으로 파싱한다.'},
 {h:'SynthDoG: 언어별 실제 데이터가 없어도 합성으로 채운다',
  lead:'ImageNet 배경 + Wikipedia 텍스트 + 규칙 기반 레이아웃으로 다국어 합성 문서를 대량 생성한다.',
  d:'IIT-CDIP는 영어 문서뿐이라 다른 언어로 확장하기 어렵다. SynthDoG는 배경 이미지(ImageNet), 종이 질감, Wikipedia에서 뽑은 단어·문구, 규칙 기반 그리드 레이아웃을 조합해 문서 이미지를 자동 생성한다. 이 방식으로 영어·중국어·일본어·한국어 각 50만 장을 만들어, 실제 스캔 문서 없이도 새 언어로 사전학습을 확장할 수 있음을 보였다.'}
],

diagram:{type:'compare', cap:'OCR을 전제하는 기존 문서 이해 파이프라인과 Donut의 OCR-free 파이프라인 대비.',
 left:{t:'기존: OCR 의존', items:['OCR 엔진이 텍스트+좌표 추출','LayoutLM류가 결과를 이해','OCR 오류가 그대로 전파','언어·문서마다 OCR 재정비 필요']},
 right:{t:'Donut: OCR-free', items:['Swin 인코더가 이미지를 직접 인코딩','BART 디코더가 JSON 토큰 직접 생성','중간 텍스트 산출물 없음','SynthDoG로 언어 확장 용이'],acc:true}},

math:[
 {expr:'p(y_i | y_<i, x) — 이미지 x를 조건으로 다음 토큰 y_i 생성, cross-entropy로 학습',
  tex:'\\mathcal{L} = -\\sum_{i=1}^{m}\\log p_\\theta\\left(y_i \\mid y_{<i}, \\mathbf{x}\\right)',
  d:'인코더가 만든 이미지 임베딩 $\\mathbf{x}$ 를 조건으로, 디코더가 다음 토큰 $y_i$ 를 이전 토큰들과 함께 예측하는 표준 자기회귀 언어모델 목적함수다. 사전학습·파인튜닝 모두 같은 형태를 쓴다.'}
],

numbers:[
 {k:'RVL-CDIP 분류 정확도', v:'95.30%', d:'LayoutLMv2(OCR 필요) 95.25% 를 근소하게 앞서면서 파라미터 143M로 더 적고 속도는 약 2배(752ms vs 1489ms)'},
 {k:'CORD 파싱 정확도', v:'F1 84.1 / TED-Acc 90.9', d:'OCR 기반 LayoutLMv2 F1 78.9 / Acc 82.4 대비 우세, 추론 0.7~1.2초'},
 {k:'사전학습 데이터', v:'IIT-CDIP 1,100만 장 + SynthDoG 언어당 50만 장', d:'영어는 실제 스캔 문서, 중·일·한은 합성 데이터로 보완'},
 {k:'모델 크기', v:'143M', d:'Swin-B 인코더 + BART 디코더(앞쪽 4개 레이어만 사용)'},
 {k:'저자원 강건성', v:'CORD 10%(80장)만으로 LayoutLM 100% 데이터 성능 도달', d:'Fig.9, OCR 기반 모델은 데이터 양에 성능이 크게 흔들리는 반면 Donut은 안정적'}
],

impact:'"문서를 이해하려면 먼저 글자를 읽어야 한다"는 당연해 보이던 전제를 깨고, OCR을 거치지 않고도 OCR 기반 SOTA(LayoutLMv2)와 대등하거나 더 나은 정확도를 더 적은 파라미터·더 빠른 속도로 달성했다. 특히 RVL-CDIP·CORD처럼 OCR 기반 모델이 표준이던 벤치마크에서 OCR 없이도 경쟁력을 입증하면서, 문서 AI 연구의 한 축이 "OCR 결과를 얼마나 잘 이해하는가"에서 "OCR 자체가 필요한가"로 옮겨갔다. SynthDoG는 이후 다국어·저자원 도메인으로의 확장 비용을 낮추는 표준 도구가 되었다.',

legacy:[
 '**[Nougat](#/p/nougat)** — Donut과 같은 Swin 인코더+자기회귀 디코더 구조를 그대로 가져와 학술 PDF의 수식·표를 마크업으로 복원하는 데 적용',
 '**OCR-free VDU 계열의 시작점** — Pix2Struct, Kosmos-2.5 등 이후 이미지→구조화 텍스트를 직접 생성하는 모델들이 같은 노선을 따름',
 '**합성 데이터 생성기의 재사용** — SynthDoG류 렌더링 파이프라인이 저자원 언어·도메인 문서 이해 연구의 표준 출발점이 됨',
 '**속도·비용 이점의 산업 적용** — 별도 OCR 인프라 없이 단일 모델로 서빙 가능하다는 점이 영수증·티켓·명함 파싱 실무에 흡수됨'
],

pitfalls:[
 '**"OCR 없이 SOTA를 앞섰다"는 비교는 조건이 다른 두 진영을 나란히 놓은 것이다.** Table 1·2의 LayoutLM·LayoutLMv2 수치는 별도 OCR 엔진(파라미터 α, 지연시간 포함)을 돌린 뒤의 결과이고, Donut 수치는 그 OCR 비용이 아예 빠져 있다. 파라미터 수·속도를 그대로 한 줄에 놓고 비교하려면 "OCR 열"이 있는지부터 확인해야 한다.',
 '**사전학습 정답 자체가 상용 OCR(CLOVA OCR API) 출력이다.** Donut이 "OCR 없이" 작동하는 것은 추론 시점의 이야기이고, 사전학습 단계에서는 여전히 OCR이 만든 pseudo-label에 의존한다. "OCR을 아예 쓰지 않았다"는 서술은 정확하지 않다.',
 '**출력이 통째로 자기회귀 생성이라 긴 문서·복잡한 표에서 필드 누락·순서 뒤섞임이 발생할 수 있다.** 짝 안 맞는 `[START]/[END]` 토큰은 자동으로 실패 처리되므로, 구조가 복잡할수록 recall이 떨어지는 경향이 있다(이 한계는 후속 [Nougat](#/p/nougat)에서 환각·반복 생성 문제로 더 뚜렷하게 나타난다).'
],

figures:[
 {f:'fig3-pipeline.png',
  cap:'왼쪽 "transformer encoder"가 문서 이미지를 바로 임베딩으로 바꾸고, 아래 프롬프트(`<classification>`/`<vqa>`/`<parsing>`)에 따라 "transformer decoder"가 오른쪽 JSON 토큰 시퀀스를 생성한다. 중간에 별도의 OCR 텍스트 출력 단계가 없다는 점이 이 그림의 핵심.',
  src:'원문 Figure 3, p.4'}
],

quotes:[
 {t:'Donut does not rely on any modules related to OCR functionality but uses a visual encoder for extracting features from a given document image.',
  src:'Section 2.2, p.4'}
],

links:[
 {t:'arXiv 2111.15664 — Donut', u:'https://arxiv.org/abs/2111.15664'},
 {t:'Donut (NAVER CLOVA, code & models)', u:'https://github.com/clovaai/donut'}
]
});
