WIKI.paper({
slug:'codebert',
venue:'EMNLP 2020 (Findings)',
authors:'Feng, Guo et al. (Harbin Institute of Technology · Microsoft Research Asia)',
arxiv:'2002.08155',

tldr:'[BERT](#/p/bert)/[RoBERTa](#/p/roberta)의 사전학습 레시피를 프로그래밍 언어로 옮긴 논문. 자연어와 코드를 **같은 시퀀스**에 넣고 함께 학습시켜, 코드 검색·코드 요약처럼 자연어와 코드를 넘나드는 작업에 쓸 수 있는 범용 표현을 얻는다.',

context:'2020년 초 NLP 사전학습은 [BERT](#/p/bert)·[RoBERTa](#/p/roberta) 이후 텍스트 단일 모달에서는 성숙했지만, 코드는 여전히 텍스트의 한 종류로만 취급되거나 각 작업(코드 검색, 요약, 완성)마다 따로 모델을 학습했다. 코드에는 자연어에 없는 구조(변수명, 함수 시그니처, 코드-주석 쌍)가 있는데도 이를 활용하는 범용 사전학습 모델이 없었다. 동시대의 ViLBERT·VideoBERT가 이미지-언어, 비디오-언어처럼 서로 다른 모달을 함께 사전학습하는 흐름을 보여줬고, 이 논문은 **자연어(NL)와 프로그래밍 언어(PL)를 두 모달로 보고** 같은 방식을 적용한다.',

ideas:[
 {h:'NL-PL 쌍을 하나의 시퀀스로',
  lead:'함수 docstring과 함수 코드를 `[CLS] NL [SEP] PL [EOS]`로 이어붙여 함께 인코딩한다.',
  d:'입력은 `[CLS], w1..wn, [SEP], c1..cm, [EOS]` 형태로, 앞부분은 자연어 문서화 문자열, 뒷부분은 그 함수의 코드다. 자연어는 [BERT](#/p/bert)와 같은 WordPiece로, 코드는 토큰 시퀀스로 그대로 처리한다. `[CLS]` 위치의 최종 표현이 코드-자연어 쌍 전체의 관련도를 나타내는 벡터가 된다.'},
 {h:'RoBERTa-base 그대로 물려받은 아키텍처',
  lead:'구조는 새로 만들지 않고 [RoBERTa](#/p/roberta)-base와 동일한 125M 파라미터 Transformer를 그대로 쓴다.',
  d:'CodeBERT는 아키텍처 혁신이 아니다. 층 수·은닉 차원·헤드 수까지 RoBERTa-base와 동일하며, 실제로 RoBERTa의 학습된 가중치로 초기화(`INIT=R`)하면 처음부터 학습(`INIT=S`)하는 것보다 항상 성능이 높다. 바뀐 것은 입력 데이터의 구성과 학습 목적함수뿐이다.'},
 {h:'이중 목적: MLM + RTD',
  lead:'양방향 쌍 데이터엔 MLM을, 짝 없는 대량 코드엔 RTD를 적용해 두 데이터를 모두 쓴다.',
  d:'NL-PL 쌍(bimodal, 210만 개)에는 [BERT](#/p/bert)식 마스킹 언어모델(MLM)을 적용한다. 하지만 짝이 없는 순수 코드(unimodal, 640만 개)는 MLM만으로는 버려진다. 이를 살리기 위해 ELECTRA의 replaced token detection(RTD)을 코드에 맞게 가져와, 마스킹 없이도 대량의 비페어 코드를 학습에 태운다.'},
 {h:'RTD: 생성기가 만든 대체 토큰을 판별기가 잡아낸다',
  lead:'작은 n-gram 생성기가 그럴듯한 대체 토큰을 채우면, 판별기가 원본인지 아닌지를 맞춘다.',
  d:'NL 생성기 $p^{G_w}$ 와 PL 생성기 $p^{G_c}$ (양방향 문맥을 쓰는 효율적인 n-gram 언어모델)가 마스킹된 자리마다 그럴듯한 토큰을 샘플링해 채워 넣는다. 그렇게 만든 오염된 시퀀스를 NL-Code discriminator(=CodeBERT 본체)에 넣어, 위치마다 "원본이냐 대체됐냐"를 이진 분류로 맞히게 한다. 생성기가 우연히 원래 토큰과 같은 걸 뽑으면 라벨은 여전히 "원본"으로 취급해 GAN과 구분된다. 파인튜닝 단계에서는 두 생성기를 버리고 discriminator만 남긴다.'},
 {h:'NL-PL 프로빙: 파인튜닝 없이 지식을 측정',
  lead:'파라미터를 고정한 채 cloze 형태 빈칸 채우기로 모델이 실제로 무엇을 아는지 확인한다.',
  d:'파인튜닝 성능만으로는 모델이 무엇을 학습했는지 알기 어렵다. 그래서 max/min처럼 의미가 반대인 후보들 중 정답을 고르는 NL-PL 프로빙 데이터셋을 직접 만들어, 파라미터 고정 상태(zero-shot)로 평가한다. CodeBERT는 이 설정에서도 [RoBERTa](#/p/roberta)를 일관되게 앞서, 사전학습 자체가 코드-자연어 대응 지식을 실제로 담고 있음을 보여준다.'}
],

diagram:{type:'flow', cap:'RTD 목적함수의 데이터 흐름. NL·PL 각각 별도 생성기가 대체 토큰을 만들고, 하나의 discriminator가 두 모달을 함께 판별한다 (원문 Figure 2 요약).',
 nodes:[
  {t:'NL/PL 마스킹', s:'15% 위치 [MASK]'},
  {t:'생성기', s:'n-gram, NL·PL 별도'},
  {t:'대체 토큰 샘플링', s:'그럴듯한 오답 생성'},
  {t:'NL-Code 판별기', s:'CodeBERT 본체', acc:true},
  {t:'원본/대체 분류', s:'위치별 이진분류'}
 ]},

math:[
 {expr:'L_MLM(θ) = Σ_{i∈m_w∪m_c} -log p_D1(x_i | w_masked, c_masked)',
  tex:'\\mathcal{L}_{\\text{MLM}}(\\theta)=\\sum_{i\\in m^{w}\\cup m^{c}} -\\log p^{D_1}\\!\\left(x_i \\mid w^{\\text{masked}}, c^{\\text{masked}}\\right)',
  d:'마스킹된 NL·PL 위치 전체에 대해 원래 토큰을 맞히는 표준 MLM 손실. bimodal 쌍 데이터에만 적용된다.'},
 {expr:'L_RTD(θ) = Σ_i [ δ(i) log p_D2(x_corrupt, i) + (1-δ(i)) (1 - log p_D2(x_corrupt, i)) ]',
  tex:'\\mathcal{L}_{\\text{RTD}}(\\theta)=\\sum_{i=1}^{|w|+|c|}\\Big(\\delta(i)\\log p^{D_2}(x^{\\text{corrupt}},i) + \\big(1-\\delta(i)\\big)\\big(1-\\log p^{D_2}(x^{\\text{corrupt}},i)\\big)\\Big)',
  d:'$\\delta(i)=1$ 은 위치 $i$ 가 실제로 원본 토큰과 같을 때. 판별기 $p^{D_2}$ 는 매 위치에서 원본/대체 여부를 이진 분류하며, MLM과 달리 unimodal 코드에도 적용할 수 있다.'},
 {expr:'min_θ  L_MLM(θ) + L_RTD(θ)',
  tex:'\\min_{\\theta}\\; \\mathcal{L}_{\\text{MLM}}(\\theta) + \\mathcal{L}_{\\text{RTD}}(\\theta)',
  d:'두 손실을 단순히 더해 하나의 판별기 파라미터 $\\theta$ 를 동시에 최적화한다. bimodal과 unimodal 데이터가 같은 파라미터를 공유하며 학습된다.'}
],

numbers:[
 {k:'파라미터', v:'125M', d:'`RoBERTa-base`와 동일한 구조 크기'},
 {k:'사전학습 데이터', v:'210만 bimodal + 640만 unimodal', d:'6개 언어(Go·Java·JS·PHP·Python·Ruby) GitHub 코드'},
 {k:'코드 검색 MRR', v:'0.7603', d:'MLM+RTD, RoBERTa 초기화 — RoBERTa 단독(0.6972) 대비 우위'},
 {k:'코드 문서 생성 BLEU', v:'17.83', d:'6개 언어 평균, RoBERTa(16.57) 대비 **+1.3**'},
 {k:'미학습 언어(C#) BLEU', v:'22.36', d:'사전학습에 없던 언어로 일반화, RoBERTa(19.81) 대비 **+2.55**'},
 {k:'학습 설정', v:'batch 2048 · lr 5e-4 · 100K step', d:'NVIDIA DGX-2, V100 16장, FP16'}
],

impact:'코드 이해·생성을 별개 태스크별 모델이 아니라 **하나의 사전학습된 표현**으로 통일하는 흐름을 코드 분야에 정착시켰다. RTD를 자연어 전용 기법([ELECTRA](https://arxiv.org/abs/2003.10555))에서 가져와 짝 없는 대량 코드까지 학습에 태운 것이 실질적 기여이며, 이후 코드 특화 사전학습 모델들이 "무엇을 목적함수로 쓸지, 무엇을 입력 모달로 넣을지"를 놓고 경쟁하는 하나의 연구 계열을 열었다. NL-PL 프로빙 방법론도 이후 코드 모델이 실제로 구조를 이해하는지 검증하는 표준적인 진단 도구가 되었다.',

legacy:[
 '**인코더 전용의 한계** — CodeBERT는 인코더만 있어 생성에는 간접적으로만 쓰이는데, 이 한계를 [CodeT5](#/p/codet5)가 인코더-디코더 구조로 직접 메운다',
 '**구조 정보의 부재** — 저자들 스스로 AST를 넣어봤지만 개선이 없었다고 밝혔고, 이후 GraphCodeBERT류 연구가 데이터플로우 그래프를 명시적으로 넣는 방향으로 이어졌다',
 '**스케일의 시대** — [AlphaCode](#/p/alphacode), [StarCoder](#/p/starcoder), [Code Llama](#/p/codellama)로 가면서 125M급 인코더 모델은 수십억 파라미터의 디코더 전용 코드 생성 모델로 대체됐다',
 '**RTD의 재활용** — 마스킹 없이 판별 학습으로 비페어 데이터를 태우는 아이디어는 코드 도메인을 넘어 다른 저자원 모달 사전학습에서도 반복적으로 재사용됐다'
],

pitfalls:[
 '**"CodeBERT가 코드를 생성한다"는 오해.** 사전학습 목적함수(MLM·RTD)는 둘 다 판별/복원이지 생성이 아니다. 코드 문서 생성 실험은 CodeBERT를 인코더로만 쓰고 디코더는 별도로 얹은 것이며, 논문도 이를 "생성 목적함수가 없는데도" 성능이 나온 부가 실험으로 설명한다.',
 '**AST를 넣으면 무조건 좋아질 거라는 기대는 논문 결과와 다르다.** 저자들이 AST 순회 순서를 입력에 추가한 버전을 실제로 학습시켰지만 생성 태스크에서 개선이 없었다고 명시한다 — 구조 정보 활용은 이 논문에서 아직 풀리지 않은 문제로 남았다.',
 '**코드를 그냥 토큰 시퀀스로 본다.** 변수 스코프, 제어 흐름 같은 코드 고유 구조를 반영하는 장치가 없이 자연어와 동일한 Transformer 인코더로 처리하므로, 사실상 "코드도 텍스트처럼 토큰화하면 BERT가 통한다"는 것을 보인 것이지 코드 전용 귀납편향을 설계한 것은 아니다.'
],

figures:[
 {f:'fig1-nlpl-pair.png',
  cap:'bimodal 학습 데이터 한 건의 실제 예시. 빨간 박스가 함수 docstring 첫 문단(=NL), 그 아래가 함수 본문(=PL)이다. docstring의 나머지 부분(예제 실행 결과)은 학습 입력에서 제외되고 첫 문단만 NL로 쓰인다는 점이 보인다.',
  src:'원문 Figure 1, p.3'},
 {f:'fig2-rtd.png',
  cap:'위쪽 행이 NL 마스킹·생성·판별, 아래쪽 행이 PL 마스킹·생성·판별. 두 흐름 모두 오른쪽의 같은 NL-Code discriminator로 모인다 — 이 판별기 하나가 곧 CodeBERT 본체이고, 왼쪽의 두 생성기는 학습이 끝나면 버려진다.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'We present CodeBERT, a bimodal pre-trained model for programming language (PL) and natural language (NL).',
  src:'Abstract, p.1'},
 {t:'CodeBERT is the first large NL-PL pre-trained model for multiple programming languages.',
  src:'Introduction, p.2 (contributions)'}
],

links:[
 {t:'arXiv 2002.08155 — CodeBERT', u:'https://arxiv.org/abs/2002.08155'},
 {t:'GitHub — microsoft/CodeBERT', u:'https://github.com/microsoft/CodeBERT'},
 {t:'CodeSearchNet Challenge (평가 데이터 출처)', u:'https://arxiv.org/abs/1909.09436'}
]
});
