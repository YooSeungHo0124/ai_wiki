WIKI.paper({
slug:'electra',
venue:'ICLR 2020',
authors:'Clark, Luong, Le, Manning (Stanford · Google Brain)',
arxiv:'2003.10555',

tldr:'[BERT](#/p/bert)식 마스킹 대신 **모든 토큰이 원본인지 대체됐는지 판별**하게 학습시키는 새 사전학습 목적함수. 15%만 보던 MLM과 달리 전체 토큰에서 학습 신호를 얻어, 같은 연산량으로 훨씬 좋은 성능을 낸다.',

context:'[BERT](#/p/bert)의 masked language modeling(MLM)은 입력의 15%만 마스킹하고 그 자리만 예측하므로, 한 번의 forward pass에서 **나머지 85%의 토큰은 학습 신호에 전혀 기여하지 않는다**. 이는 곧 같은 연산량 대비 학습 효율이 낮다는 뜻이고, 더 큰 모델·더 많은 데이터로 이를 메우는 것이 당시 사전학습 연구([RoBERTa](#/p/roberta), XLNet)의 방향이었다. 문제는 이 방향이 계속 더 많은 연산을 요구한다는 점이었다 — 성능이 아니라 **연산 효율**을 목적함수 설계로 개선할 여지가 남아 있었다.',

ideas:[
 {h:'Replaced Token Detection: 마스크가 아니라 대체',
  lead:'토큰을 [MASK]로 지우는 대신 그럴듯한 다른 단어로 바꿔놓고 어느 것이 바뀌었는지 맞힌다.',
  d:'작은 생성기(generator)가 마스킹된 자리에 그럴듯한 토큰을 채워 넣어 "오염된" 문장을 만든다. 그 문장을 받은 판별기(discriminator, 이것이 ELECTRA 본체)가 **각 위치마다** 원본인지 생성기가 바꾼 것인지를 이진 분류한다. 예측 대상이 15%의 마스크 자리가 아니라 **전체 시퀀스**이므로 같은 문장 하나에서 훨씬 많은 학습 신호가 나온다.'},
 {h:'GAN처럼 생겼지만 적대적이지 않다',
  lead:'생성기는 판별기를 속이려 학습하지 않고 그냥 최대우도로 마스크를 채운다.',
  d:'구조는 생성기-판별기 쌍이라는 점에서 [GAN](#/p/gan)과 닮았다. 하지만 결정적 차이가 있다 — 생성기는 판별기를 속이도록 적대적으로 학습하지 않고, 그냥 표준 MLM 손실(최대우도)로 학습한다. 이유는 공학적이다: 생성기의 샘플링 과정을 통과해 역전파할 수 없어 텍스트에 GAN을 적용하기 어렵기 때문이다. 그래서 논문은 "GAN을 닮았지만 적대적 학습은 아니다"라고 명시한다.'},
 {h:'생성기가 우연히 원본을 맞히면 그것도 real 취급',
  lead:'생성기 출력이 원문과 우연히 같아도 replaced가 아니라 original로 라벨링한다.',
  d:'토큰 판별 라벨은 "생성기가 만든 토큰이냐"가 아니라 "원본 문장의 그 토큰과 같냐"로 정의된다. 생성기가 마스크 자리에 원래 단어를 그대로 맞혀도 판별기 입장에서는 "real"이 정답이 된다. 이 처리 하나가 다운스트림 성능을 소폭 개선했다고 논문은 보고한다.'},
 {h:'생성기는 판별기보다 작게, 파라미터는 일부 공유',
  lead:'생성기를 판별기의 1/4~1/2 크기로 두고 임베딩을 공유해 연산을 아낀다.',
  d:'생성기가 판별기와 같은 크기면 학습이 오히려 나빠지고 연산 낭비도 커진다. 실험적으로 생성기 hidden size를 판별기의 1/4~1/2로 둘 때 가장 좋았다. 또한 토큰·위치 임베딩을 두 네트워크가 공유해(weight tying) 추가 파라미터 없이 학습 신호를 늘렸다.'},
 {h:'사전학습 후 생성기는 버리고 판별기만 파인튜닝',
  lead:'다운스트림에는 판별기(ELECTRA)만 남기고 생성기는 통째로 폐기한다.',
  d:'생성기는 오직 판별기를 위한 그럴듯한 오염 문장을 만드는 도구일 뿐이다. 사전학습이 끝나면 생성기는 버리고, 토큰 판별을 학습한 판별기 인코더만 떼어내 [BERT](#/p/bert)와 동일한 방식으로 분류·QA 과제에 파인튜닝한다.'}
],

diagram:{type:'flow', cap:'생성기가 마스크 자리를 그럴듯한 단어로 채워 오염된 문장을 만들면, 판별기(ELECTRA)가 위치마다 원본/대체 여부를 이진 분류한다.',
 nodes:[
  {t:'마스킹', s:'15% [MASK]'},
  {t:'생성기', s:'작은 MLM'},
  {t:'오염 문장', s:'그럴듯한 대체어'},
  {t:'판별기 ELECTRA', s:'토큰별 이진분류', acc:true},
  {t:'전체 토큰 학습', s:'100% 신호'}
 ]},

math:[
 {expr:'L_Disc = E[ Σ_t -1(x_corrupt_t = x_t) log D(x_corrupt, t) - 1(x_corrupt_t ≠ x_t) log(1 - D(x_corrupt, t)) ]',
  tex:'\\mathcal{L}_{\\text{Disc}}(\\boldsymbol{x},\\theta_D)=\\mathbb{E}\\!\\left(\\sum_{t=1}^{n} -\\mathbb{1}(x_t^{\\text{corrupt}}\\!=\\!x_t)\\log D(\\boldsymbol{x}^{\\text{corrupt}},t) - \\mathbb{1}(x_t^{\\text{corrupt}}\\!\\neq\\! x_t)\\log\\big(1-D(\\boldsymbol{x}^{\\text{corrupt}},t)\\big)\\right)',
  d:'판별기 손실은 시퀀스의 **모든 위치** $t$ 에 대한 이진 cross-entropy의 합이다. MLM의 손실이 마스크된 $k$ 개 위치에만 걸리는 것과 달리, 여기서는 $n$개 전체 위치가 기여한다.'},
 {expr:'D(x, t) = sigmoid(wᵀ h_D(x)_t)',
  tex:'D(\\boldsymbol{x},t)=\\text{sigmoid}\\!\\big(w^{\\top}h_D(\\boldsymbol{x})_t\\big)',
  d:'판별기는 각 위치의 문맥 표현 $h_D(x)_t$ 를 스칼라로 투영해 시그모이드를 통과시키는 것만으로 "이 토큰이 원본인가"를 판단한다. 구조상 추가 비용은 출력층 하나뿐이다.'}
],

numbers:[
 {k:'ELECTRA-Small vs BERT-Small', v:'GLUE +5점', d:'1 GPU로 4일 학습, BERT-Small보다 5점 높고 GPT보다도 나음'},
 {k:'ELECTRA-Base FLOPs 대비 GLUE', v:'89.0 (7.1e20 FLOPs)', d:'같은 FLOPs의 자체 재현 BERT(87.2) 대비 우위'},
 {k:'ELECTRA-Large 컴퓨트', v:'RoBERTa·XLNet 대비 1/4', d:'같은 학습량(400K 스텝, ELECTRA-400K)에서 GLUE 89.0 기록'},
 {k:'SQuAD 2.0 dev F1 (ELECTRA-1.75M)', v:'90.6', d:'RoBERTa(89.4)·ALBERT(90.2) 상회, 당시 최신 수준'},
 {k:'BERT-Large 대비 연산 절감(Small)', v:'파라미터 1/20 · 사전학습 연산 1/135', d:'ELECTRA-Small의 효율성 수치'},
 {k:'생성기 최적 크기', v:'판별기의 1/4~1/2', d:'같은 크기로 두면 오히려 성능 저하'}
],

impact:'ELECTRA는 "더 큰 모델·더 많은 데이터"가 아니라 **더 조밀한 학습 신호**로 사전학습 효율을 올릴 수 있음을 보였다. 같은 연산 예산에서 BERT·XLNet·RoBERTa를 능가하면서도, 저비용 환경(1 GPU, 4일)에서도 실용적인 모델을 만들 수 있다는 점을 증명해 사전학습 연구의 초점을 "얼마나 크게"에서 "얼마나 효율적으로"로 일부 옮겼다.',

legacy:[
 '**전체-토큰 학습이라는 아이디어의 재사용** — 이후 비전의 [MAE](#/p/mae)류를 포함해 "일부만 마스킹"의 비효율을 지적하는 논의에 참조점이 됨',
 '**GAN 유사 구조의 텍스트 적용 사례** — 적대적 학습 없이 생성기-판별기 쌍을 쓰는 절충안으로, 텍스트에 [GAN](#/p/gan)을 직접 적용하기 어려운 이유(이산 샘플링·역전파 불가)를 재확인시킴',
 '**경량 인코더의 표준 후보** — 판별기만 남기는 구조가 이후 경량화·증류 연구에서 BERT 대체 백본으로 자주 인용됨',
 '**효율 대 규모 논쟁** — GPT-3 이후의 "무조건 스케일" 흐름과 대비되는, 목적함수 설계로 효율을 얻는 방향성의 대표 사례로 남음'
],

pitfalls:[
 '**"GAN이다"는 정확하지 않다.** 구조는 생성기-판별기 쌍이지만 생성기는 적대적으로 학습되지 않는다. 판별기를 속이려는 목적함수가 없다는 점이 GAN과의 결정적 차이다.',
 '**작을수록 좋은 게 아니다.** 생성기를 판별기와 같은 크기로 키우면 오히려 GLUE 성능이 떨어진다 — 논문은 생성기가 너무 강하면 판별 과제가 지나치게 어려워져 학습이 힘들어진다고 분석한다.',
 '**SQuAD 2.0에서 유독 강한 것은 우연이 아니다.** 논문은 replaced token detection이 "답 없음"을 구분하는 이진 판별과 유사한 성격이라, SQuAD 1.1보다 2.0에서 상대적으로 더 큰 이득을 준다고 추정한다.'
],

figures:[
 {f:'fig1-compute.png',
  cap:'x축이 사전학습에 쓴 FLOPs, y축이 GLUE 점수. 빨간 선(Replaced Token Detection)이 파란 선(MLM, BERT류)보다 항상 위에 있다 — 같은 연산량이면 ELECTRA가 항상 더 높은 점수를 낸다는 뜻. 오른쪽은 왼쪽 점선 박스를 확대한 것.',
  src:'원문 Figure 1, p.2'},
 {f:'fig2-overview.png',
  cap:'왼쪽 생성기가 마스크된 "chef"·"cooked" 자리를 각각 "chef"(우연히 원본과 일치)·"ate"로 채운다. 오른쪽 판별기(ELECTRA)는 다섯 토큰 전부에 대해 original/replaced를 판정한다 — "ate"만 replaced로 잡혔고, 우연히 원본과 같은 "chef"는 original로 라벨링된다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'Instead of masking the input, our approach corrupts it by replacing some tokens with plausible alternatives sampled from a small generator network.',
  src:'Abstract, p.1'},
 {t:'Although the models are structured like in a GAN, we train the generator with maximum likelihood rather than adversarially due to the difficulty of applying GANs to text.',
  src:'Figure 2 caption, p.3'}
],

links:[
 {t:'arXiv 2003.10555 — ELECTRA', u:'https://arxiv.org/abs/2003.10555'},
 {t:'공식 코드 (google-research/electra)', u:'https://github.com/google-research/electra'}
]
});
