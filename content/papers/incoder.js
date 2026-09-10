WIKI.paper({
slug:'incoder',
venue:'ICLR 2023',
authors:'Daniel Fried, Armen Aghajanyan et al. (Meta AI · UW · UC Berkeley · CMU)',
arxiv:'2204.05999',

tldr:'코드를 **왼쪽에서 오른쪽으로만** 생성하는 대신, 학습 때부터 문서 중간 한 조각을 통째로 **뒤로 옮겨 붙이고** 그 자리를 채우도록 훈련한 6.7B 디코더 전용 모델. 실제 개발이 파일 한가운데를 고치는 일이라는 문제의식에서, 별도 인코더 없이 하나의 자기회귀 모델로 코드 생성과 편집(타입 추론·변수명·docstring·빈 줄 채우기)을 동시에 해낸다.',

context:'2022년 초 코드 생성 모델은 크게 두 갈래였다. [Codex](#/p/humaneval)류의 왼쪽→오른쪽 자기회귀 모델은 문서 전체를 자연스럽게 생성할 수 있지만 **왼쪽 문맥밖에 못 본다** — 함수 중간에 줄을 끼워 넣거나 이미 있는 코드의 타입을 추론하는 일에 구조적으로 불리하다. 반대로 [BERT](#/p/bert)류의 마스크 언어모델은 양쪽 문맥을 다 보지만 학습 시 문서의 **15%만** 예측하도록 훈련돼 전체 문서를 생성하는 능력이 약하다. 그런데 실제 개발자는 파일을 한 번에 처음부터 끝까지 쓰지 않는다 — 이미 있는 코드 사이사이를 반복해서 고치고 채운다. 이 논문은 "생성"과 "편집"을 별도 모델 없이 하나의 자기회귀 모델로 통합하려 한다.',

ideas:[
 {h:'Causal masking: 중간 조각을 문서 끝으로 옮겨 붙이는 학습',
  lead:'문서에서 span을 뽑아 sentinel로 표시하고 문서 끝으로 이동시킨 뒤 그대로 자기회귀 학습한다.',
  d:'학습 문서에서 몇 개의 연속 토큰 구간(span)을 포아송 분포로 뽑아, 원래 자리에는 `<Mask:k>` 라는 sentinel 토큰만 남기고 그 span 텍스트 자체는 문서 맨 끝으로 옮긴다(끝에는 `<EOM>` 토큰을 붙인다). 그리고 이 **재배열된 문서 전체**를 표준 자기회귀 목적함수로 학습한다. 별도 인코더나 디노이징 목적함수 없이, 데이터를 순서만 바꿔서 넣는 것으로 양방향 문맥 조건화를 얻는다.'},
 {h:'추론 때는 sentinel만 심으면 어떤 자리든 채운다',
  lead:'문서 어디든 `<Mask:k>`를 심고 문서 끝에서 계속 생성시키면 그 자리가 채워진다.',
  d:'학습 절차와 대칭적으로, 기존 코드의 원하는 위치에 sentinel 토큰을 넣고 문서 끝에 그 sentinel을 다시 등장시켜 생성을 이어가면, 모델이 `<EOM>` 이 나올 때까지 그 자리에 들어갈 텍스트를 만들어낸다. sentinel 없이 생성하면 그냥 보통의 좌→우 생성이 되므로, **하나의 모델이 두 모드를 공짜로 겸한다.**'},
 {h:'sentinel을 여러 개 심으면 여러 구멍을 동시에 채운다',
  lead:'`<Mask:0>`, `<Mask:1>`처럼 번호를 매겨 한 문서 안 여러 빈칸을 한 번에 채운다(multi-region infilling).',
  d:'span을 여러 개 샘플링해 각각 다른 번호의 sentinel로 표시하고, 문서 끝에는 그 번호 순서대로 채워 넣을 텍스트가 이어진다. 이 덕분에 import 문 추가와 함수 본문 수정처럼 파일 안의 서로 떨어진 여러 지점을 한 번의 생성으로 동시에 고칠 수 있다.'},
 {h:'GitHub 코드뿐 아니라 StackOverflow도 학습 데이터로',
  lead:'159GB 코드(52GB Python)에 57GB의 StackOverflow 텍스트를 더해 학습한다.',
  d:'허가적 오픈소스 라이선스의 GitHub·GitLab 코드 28개 언어와, 질문·답변·댓글을 포함한 StackOverflow 컨텐츠를 함께 학습에 넣었다. 뒤의 ablation에서 이 StackOverflow 데이터를 빼면 HumanEval·MBPP 성능이 크게 떨어지는 것으로 확인된다 — 코드와 자연어가 섞인 데이터가 도움이 된다는 근거다.'},
 {h:'양방향 문맥을 얻어도 좌→우 생성 능력을 잃지 않는다',
  lead:'같은 크기·데이터에서 causal masking 모델이 표준 LM보다 HumanEval 성능이 오히려 근소하게 높았다.',
  d:'1.3B 파라미터로 데이터를 고정하고 목적함수만 causal masking vs 표준 언어모델링으로 바꿔 비교한 ablation에서, causal masking 쪽이 HumanEval·MBPP pass@1이 살짝 더 높게 나왔다. 즉 문서를 재배열해 양방향 편집 능력을 얻는 대가로 순수 생성 능력을 깎아먹지 않는다는 것이며, 저자들은 이 결과가 이후 나온 [FIM](#/p/fim) 논문의 결론과 같은 방향이라고 직접 언급한다.'}
],

diagram:{type:'flow', cap:'학습 시 문서 중간 span을 sentinel로 표시하고 문서 끝으로 옮겨 붙인 뒤, 재배열된 문서 전체를 표준 자기회귀 목적함수로 학습한다.',
 nodes:[
  {t:'원본 코드 문서', s:'파일 하나'},
  {t:'span 샘플링', s:'포아송 분포', a:'몇 군데'},
  {t:'span→끝으로 이동', s:'자리엔 sentinel만', acc:true, note:'재배열된 문서'},
  {t:'자기회귀 학습', s:'순서 그대로 다음 토큰 예측'}
 ]},

math:[
 {expr:'maximize log P(Left, <Mask:0>, Right, <Mask:0>, Span, <EOM>)',
  tex:'\\max \\; \\log P\\big(\\text{Left},\\ \\texttt{<Mask:0>},\\ \\text{Right},\\ \\texttt{<Mask:0>},\\ \\text{Span},\\ \\texttt{<EOM>}\\big)',
  d:'문서 $D$ 에서 span $D_{i:j}$ 를 뽑으면 $\\text{Left}=D_{0:i}$, $\\text{Right}=D_{j:N}$ 이다. 원래 span 자리에 sentinel만 남기고, 문서 끝에 같은 sentinel과 함께 실제 span 텍스트를 이어붙인 뒤, 이 순서 그대로의 시퀀스를 표준 자기회귀 cross-entropy로 학습한다 — sentinel 토큰 자체는 손실 계산에서 제외한다.'}
],

numbers:[
 {k:'모델 크기', v:'6.7B (보조 1.3B)', d:'디코더 전용 Transformer, 인코더 없음'},
 {k:'학습 코드량', v:'159GB (Python 52GB)', d:'28개 언어의 허가적 오픈소스 라이선스 코드'},
 {k:'추가 데이터', v:'StackOverflow 57GB', d:'질문·답변·댓글 — 빼면 HumanEval·MBPP 성능 크게 하락'},
 {k:'HumanEval pass@1/10/100', v:'15.2% / 27.8% / 47.0%', d:'zero-shot 좌→우 함수 합성, 동급 GPT-J(11.6%/15.7%/27.7%) 상회'},
 {k:'단일 줄 인필링 통과율', v:'CM 69.0% vs L-R 48.2%', d:'HumanEval 기반 자체 구성 벤치마크, exact match도 56.3% vs 38.7%'},
 {k:'여러 줄 인필링 통과율', v:'CM 38.6% vs L-R 24.9%', d:'오른쪽 문맥이 많을수록 CM의 우위가 더 커짐(Figure 2)'}
],

impact:'왼쪽 문맥만 보는 자기회귀 모델도 데이터 재배열만으로 양방향 편집 능력을 얻을 수 있음을 대규모(6.7B)로 처음 보였다. 타입 추론·변수명 예측 같은 과제에서 지도학습된 전용 모델에 근접하는 zero-shot 성능을 냈고, 그러면서도 [HumanEval](#/p/humaneval)·MBPP 같은 표준 좌→우 합성 벤치마크 성능을 희생하지 않았다. "생성"과 "편집"을 하나의 모델·하나의 목적함수로 통합했다는 점이 핵심이며, 별도의 인코더나 디노이징 목적함수를 쓰는 [T5](#/p/t5)/PLBART 계열 인필링과 뚜렷이 다른 길을 제시했다.',

legacy:[
 '**[FIM](#/p/fim)** — 같은 해 OpenAI가 이 데이터 재배열 레시피를 더 단순화하고 "왼쪽→오른쪽 성능 손실 없이 공짜로 얻는다(FIM-for-free)"는 주장을 더 큰 스케일로 체계적으로 검증',
 '**StarCoder·SantaCoder·Code Llama** 등 이후 공개 코드 모델 대부분이 사전학습 단계에 FIM/causal masking을 기본 옵션으로 채택',
 '**IDE 자동완성·코드 편집 도구**의 "커서 위치에서 채우기" 기능이 이 인필링 학습 방식을 실제 제품 요구사항과 직접 연결한 초기 사례'
],

pitfalls:[
 '**causal masking 자체를 이 논문이 처음 제안한 것은 아니다.** 저자들도 이 목적함수를 Aghajanyan et al. (2022a, CM3)에서 가져왔다고 명시한다. InCoder의 기여는 이를 코드에 적용해 6.7B 규모로 학습하고, sentinel 다중화로 multi-region infilling API를 만든 것이다.',
 '**T5/PLBART식 인필링과 다른 메커니즘이다.** 그쪽은 인코더-디코더 구조로 스팬을 직접 디노이징하지만, InCoder는 디코더 전용 모델이 문서를 재배열한 시퀀스를 그대로 자기회귀로 학습한다. 구조 자체가 다르다.',
 '"좌→우 성능 손실 없음"은 **이 논문 안에서는 1.3B 규모까지만 검증됐다.** 더 큰 스케일과 다양한 설정에서 이 "공짜" 주장을 정면으로 검증한 것은 뒤이은 [FIM](#/p/fim) 논문이다.'
],

figures:[
 {f:'fig1-training.png',
  cap:'왼쪽이 원본 문서, 오른쪽이 학습용으로 재배열된 문서. `<MASK:0>` 이 원래 span 자리에 남고, 같은 sentinel과 함께 실제 코드(주황 배경)가 문서 맨 끝, `<EOM>` 앞으로 옮겨 붙는다.',
  src:'원문 Figure 1 상단, p.2'},
 {f:'fig1-docstring.png',
  cap:'zero-shot 추론 예시(docstring 생성). 함수 시그니처 바로 아래에 sentinel을 심어 두면, 모델이 그 함수 본문(오른쪽 문맥)까지 보고 docstring(주황 배경)을 만들어 채운다.',
  src:'원문 Figure 1 하단, p.2'}
],

quotes:[
 {t:'Code is seldom written in a single left-to-right pass and is instead repeatedly edited and refined.',
  src:'Abstract, p.1'},
 {t:'Our model is the first large generative code model that is able to infill arbitrary regions of code',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2204.05999 — InCoder: A Generative Model for Code Infilling and Synthesis', u:'https://arxiv.org/abs/2204.05999'},
 {t:'공식 모델/데모 페이지', u:'https://sites.google.com/view/incoder-code-models/'}
]
});
