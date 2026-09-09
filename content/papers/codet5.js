WIKI.paper({
slug:'codet5',
venue:'EMNLP 2021',
authors:'Wang et al. (Salesforce Research Asia · NTU Singapore)',
arxiv:'2109.00859',

tldr:'코드용 사전학습 모델을 encoder-only([CodeBERT](#/p/codebert))도 decoder-only도 아닌 **[T5](#/p/t5) 스타일 encoder-decoder**로 통일하고, 여기에 소스코드 특유의 **식별자(identifier)** 정보를 노이즈 제거 목표에 직접 녹여 넣은 모델이다. 이해(understanding)와 생성(generation) 과제를 **하나의 모델**로 동시에 잘 푼다.',

context:'2021년 초 코드 사전학습은 두 갈래로 갈라져 있었다. [CodeBERT](#/p/codebert)·CuBERT 같은 encoder-only 모델은 코드 이해(결함 탐지, 클론 탐지)에는 강하지만 생성 과제에는 별도의 decoder를 새로 붙여야 했고, 그 decoder는 사전학습의 혜택을 전혀 받지 못했다. GPT 계열 decoder-only 모델은 반대로 생성에는 맞지만 양방향 문맥을 보는 이해 과제에 불리했다. 게다가 기존 코드 모델들은 대부분 소스코드를 **자연어와 똑같은 토큰 시퀀스**로 취급해, 코드에만 있는 구조적 정보 — 특히 변수명·함수명 같은 개발자가 직접 지은 **식별자**가 코드 의미를 강하게 담고 있다는 사실 — 를 사전학습 단계에서 그냥 흘려보냈다. CodeT5는 "encoder-decoder로 통일하면 이해와 생성을 둘 다 잘할 수 있지 않을까"와 "식별자를 명시적으로 가르치면 코드 의미를 더 잘 배우지 않을까"라는 두 질문에서 출발한다.',

ideas:[
 {h:'T5 그대로의 encoder-decoder, 코드+자연어 이어붙이기',
  lead:'[T5](#/p/t5) 아키텍처를 그대로 가져와 NL과 PL을 한 시퀀스로 합쳐 넣는다.',
  d:'[T5](#/p/t5)와 동일한 encoder-decoder Transformer를 쓰되, 입력을 `([CLS], w1...wn, [SEP], c1...cm, [SEP])` 형태로 구성한다. `w`는 자연어 토큰, `c`는 코드 토큰이며 NL이 없는 PL-only 입력에서는 NL 부분이 비워진다. encoder가 이해(분류·태깅)를, decoder가 생성(요약·번역·수정)을 맡아 **하나의 가중치 집합**으로 열네 개 하위 과제를 전부 처리한다.'},
 {h:'Masked Identifier Prediction: 식별자만 통째로 지운다',
  lead:'변수·함수명을 전부 마스킹해 코드 의미를 식별자만으로 복원하게 만든다.',
  d:'T5식 [Masked Span Prediction](#/p/t5)이 무작위 구간을 지우는 것과 달리, MIP는 AST에서 뽑은 식별자 전부를 골라 같은 식별자에는 같은 sentinel 토큰을 붙여 지운다. 이는 소프트웨어공학의 **obfuscation(난독화)**과 같은 조작이다. 모델은 난독화된 코드에서 어떤 sentinel이 어떤 식별자였는지 자기회귀적으로 복원해야 하므로, 변수명이 아니라 **코드 흐름과 문맥**으로 의미를 추론하도록 강제된다.'},
 {h:'Identifier Tagging: 이 토큰이 식별자인가',
  lead:'encoder 위에 이진 분류기를 얹어 각 코드 토큰이 식별자인지 맞히게 한다.',
  d:'AST에서 추출한 노드 타입으로 각 코드 토큰 $c_i$ 에 이진 라벨 $y_i\\in\\{0,1\\}$ 을 만들고, encoder의 마지막 은닉 상태에 시퀀스 라벨링 손실을 건다. decoder를 쓰지 않는 encoder 전용 보조 과제라서 학습 비용이 작고, 개발 도구의 syntax highlighting과 같은 역할을 사전학습 신호로 바꾼 것이다.'},
 {h:'Bimodal Dual Generation: NL↔PL을 쌍대 과제로',
  lead:'주석-코드 쌍을 양방향(NL→PL, PL→NL)으로 동시에 학습한다.',
  d:'개발자가 남긴 주석과 코드를 한 쌍으로 보고, 방향을 뒤집은 두 개의 학습 인스턴스를 만들어 `<java>`·`<en>` 같은 언어 태그와 함께 동시에 최적화한다. 이는 T5의 스팬 마스킹에서 NL 또는 PL 전체를 지우는 극단적인 경우로 볼 수 있고, fine-tuning 때 실제로 필요한 "자연스러운 문장/코드 생성"과 사전학습 목표 사이의 간극을 줄인다.'},
 {h:'세 목표를 번갈아 학습 + downstream 멀티태스크',
  lead:'MSP·IT·MIP를 동일 확률로 번갈아 최적화하고 fine-tuning도 멀티태스크로 한다.',
  d:'사전학습 단계에서는 MSP, IT, MIP 세 손실을 균등한 확률로 번갈아 최적화해 노이즈 제거·태깅·식별자 복원을 한 모델에 동시에 새긴다. fine-tuning에서는 태스크마다 다른 모델을 만드는 대신, 태스크 제어 코드를 프롬프트로 주고 클론 탐지를 제외한 대부분의 과제를 **하나의 모델로 멀티태스크 학습**시킬 수 있음을 보였다.'}
],

diagram:{type:'flow', cap:'CodeT5는 태스크 프롬프트만 바꿔 이해·생성 열네 과제를 한 모델로 처리한다.',
 nodes:[
  {t:'NL+PL 입력', s:'CLS·NL·SEP·PL·SEP'},
  {t:'CodeT5 encoder', s:'양방향, T5 구조'},
  {t:'식별자 인식', s:'AST 기반 태깅·복원', acc:true},
  {t:'CodeT5 decoder', s:'자기회귀 생성'},
  {t:'출력', s:'요약/코드/라벨'}
 ]},

math:[
 {expr:'L_MSP(θ) = Σ_t -log P_θ(x_t^mask | x^\\mask, x_<t^mask)',
  tex:'\\mathcal{L}_{MSP}(\\theta)=\\sum_{t=1}^{k}-\\log P_\\theta\\!\\left(x_t^{mask}\\mid x^{\\backslash mask}, x_{<t}^{mask}\\right)',
  d:'T5와 동일한 스팬 복원 손실. 마스킹 비율 15%, 평균 스팬 길이 3으로 T5 설정을 그대로 따른다.'},
 {expr:'L_IT(θ_e) = Σ_i -[y_i log p_i + (1-y_i) log(1-p_i)]',
  tex:'\\mathcal{L}_{IT}(\\theta_e)=\\sum_{i=1}^{m}-\\left[y_i\\log p_i+(1-y_i)\\log(1-p_i)\\right]',
  d:'encoder 파라미터 $\\theta_e$ 만 쓰는 토큰별 이진 교차 엔트로피. $y_i$ 는 토큰 $c_i$ 가 식별자인지 여부.'},
 {expr:'L_MIP(θ) = Σ_j -log P_θ(I_j | x\\I, I_<j)',
  tex:'\\mathcal{L}_{MIP}(\\theta)=\\sum_{j=1}^{|I|}-\\log P_\\theta\\!\\left(I_j\\mid x_{\\backslash I}, I_{<j}\\right)',
  d:'난독화된 입력 $x_{\\backslash I}$ 에서 식별자 시퀀스 $I$ 를 자기회귀적으로 복원한다. MSP·IT·MIP 세 손실을 동일 확률로 번갈아 최적화한다.'}
],

numbers:[
 {k:'사전학습 데이터', v:'CodeSearchNet 약 8.35M', d:'6개 언어(Ruby·JS·Go·Python·Java·PHP) + 추가로 수집한 C/C# 유니모달·바이모달 데이터'},
 {k:'모델 크기', v:'small 60M · base 220M', d:'PLBART(140M)보다 CodeT5-small이 더 작으면서도 코드 요약 전체 점수를 앞섬'},
 {k:'코드 생성(Concode)', v:'EM 22.30 · CodeBLEU 43.20', d:'CodeT5-base 기준, 이전 SOTA PLBART 대비 CodeBLEU +4.7점'},
 {k:'코드 정제(medium)', v:'EM 13.96', d:'GraphCodeBERT의 9.10 대비 +4.8점, 긴 버그 함수 수정에서 특히 강함'},
 {k:'결함 탐지 정확도', v:'65.78', d:'CodeT5-base, PLBART(63.18) 대비 +2.6점으로 전체 baseline 중 최고'},
 {k:'토큰화 압축', v:'길이 30~45% 감소', d:'BPE 대신 코드 특화 tokenizer(Feng et al. 방식)를 써서 시퀀스 길이를 줄여 학습·생성 속도를 개선'}
],

impact:'CodeT5는 CodeXGLUE 벤치마크 14개 하위 과제 대부분에서 발표 당시 SOTA를 세웠고, "코드 사전학습 모델은 encoder-decoder로 통일하는 것이 정답"이라는 흐름을 굳히는 계기가 되었다. 이해 전용이던 [CodeBERT](#/p/codebert) 계열과 생성 전용 GPT 계열의 절충안이 아니라, **하나의 사전학습 목표(identifier-aware denoising)로 둘 다 잘하는 모델**을 실증한 것이 핵심이다. 특히 CodeT5-small이 3배 큰 PLBART를 능가한 결과는 아키텍처 선택보다 사전학습 목표 설계가 더 중요할 수 있음을 보여줬다. GitHub에 공개된 코드와 체크포인트는 이후 코드 LLM 연구의 표준 baseline이 되었다.',

legacy:[
 '**멀티태스크 코드 모델의 표준화** — 태스크 제어 코드를 프롬프트로 주는 방식이 이후 [StarCoder](#/p/starcoder) 등 대규모 코드 LLM의 프롬프트 설계에 영향을 줌',
 '**CodeT5+로 확장** — 저자들이 후속 연구에서 decoder-only 생성, contrastive learning, 더 큰 스케일을 결합해 CodeT5의 한계(고정된 인코더-디코더 균형)를 보완',
 '**식별자 인식 사전학습의 확산** — 코드 구조 정보를 노이즈 제거 목표에 녹이는 아이디어가 이후 GraphCodeBERT류의 data-flow 활용 연구와 함께 코드 특화 사전학습의 표준 재료가 됨',
 '**decoder-only 코드 LLM 시대로의 과도기** — Codex·[StarCoder](#/p/starcoder) 같은 대규모 decoder-only 모델이 등장하며 encoder-decoder 구조 자체의 비중은 줄었지만, "코드는 자연어와 다르게 다뤄야 한다"는 문제의식은 그대로 계승됨'
],

pitfalls:[
 '**BLEU 점수가 코드 생성 품질을 잘못 대변할 수 있다.** 논문 자체가 C#→Java 번역 예시에서 BLEU 50.23%인데도 의미상 완전히 올바른 출력을 보여주며, 코드 정제 과제에서는 naive copy만으로도 BLEU가 매우 높게 나와 exact match를 별도로 봐야 한다고 지적한다.',
 '**바이모달 이중 생성(dual-gen)이 항상 도움이 되지 않는다.** NL-PL 과제(요약·생성)는 개선되지만 PL-PL 과제(번역·결함 탐지)는 오히려 성능이 소폭 떨어지는 경향이 실험으로 확인됐다 — 사전학습 목표를 늘린다고 모든 downstream이 좋아지진 않는다.',
 '**"identifier-aware"가 변수명 그대로 예측을 의미하지 않는다.** MIP는 난독화된 코드에서 동일 식별자의 위치를 서로 연결하는 것이 핵심이지, 실제 변수 이름 문자열을 맞히는 것이 목표가 아니다.'
],

figures:[
 {f:'fig1-unified-model.png',
  cap:'같은 CodeT5 하나가 태스크 접두 프롬프트(Summarize/Generate/Defect/Refine/Translate)만 바꿔 요약·생성·결함탐지·수정·번역을 전부 처리한다. 왼쪽이 encoder 입력, 오른쪽이 decoder 출력.',
  src:'원문 Figure 1, p.2'},
 {f:'fig2-pretraining-tasks.png',
  cap:'(a) 임의 구간을 지우고 복원하는 T5식 Masked Span Prediction. (b) 각 코드 토큰이 식별자인지 0/1로 태깅. (c) 식별자를 전부 sentinel로 바꾸고(난독화) 원래 이름을 순서대로 복원. (d) 주석↔코드를 양방향으로 생성하는 바이모달 이중 생성.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'We present CodeT5, a unified pre-trained encoder-decoder Transformer model that better leverages the code semantics conveyed from the developer-assigned identifiers.',
  src:'Abstract, p.1'},
 {t:'This reveals that CodeT5 has a good generalization ability instead of memorizing and repeating what it has seen before. On the other hand, it also suggests that BLEU score is not a perfect evaluation metric for code generation tasks.',
  src:'§5.1, p.6'}
],

links:[
 {t:'arXiv 2109.00859 — CodeT5', u:'https://arxiv.org/abs/2109.00859'},
 {t:'GitHub — salesforce/CodeT5', u:'https://github.com/salesforce/CodeT5'},
 {t:'CodeXGLUE benchmark (Lu et al., 2021)', u:'https://github.com/microsoft/CodeXGLUE'}
]
});
