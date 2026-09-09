WIKI.paper({
slug:'conformer',
venue:'INTERSPEECH 2020',
authors:'Gulati et al. (Google)',
arxiv:'2005.08100',

tldr:'음성 인식에서 합성곱(국소 패턴)과 self-attention(전역 관계)을 **하나의 블록 안에 순서대로** 결합해, 각각을 단독으로 쓴 [Transformer](#/p/transformer)와 CNN 계열 모델을 모두 앞지른 논문. 이후 음성 인식의 표준 인코더 백본이 되었다.',

context:'2020년 ASR은 RNN 시대를 지나 Transformer와 CNN이 경쟁하던 시기였다. Transformer는 self-attention으로 문장 전체의 전역 관계를 한 홉에 포착하지만, 국소적인 미세 패턴(음소 경계처럼 인접 프레임 사이의 변화)을 뽑는 데는 약하다. CNN은 정반대다 — 국소 수용장으로 세밀한 패턴은 잘 잡지만, 전역 맥락을 보려면 층을 아주 깊게 쌓아야 한다. ContextNet 같은 동시대 CNN 모델은 squeeze-and-excitation으로 전역 평균을 끼워 넣어 이 한계를 우회했지만, 여전히 동적인 전역 상호작용은 표현하지 못했다. 질문은 단순했다 — **왜 둘 중 하나를 고르는가, 한 블록 안에서 같이 쓰면 안 되는가?**',

ideas:[
 {h:'Conformer 블록: FFN-Attention-Conv-FFN 샌드위치',
  lead:'Half-step FFN 두 개가 self-attention과 convolution 모듈을 감싸는 4단 구조.',
  d:'하나의 블록에 feed-forward, self-attention, convolution, feed-forward가 순서대로 쌓인다. self-attention이 먼저 전역 관계를 계산하고, 그 출력을 convolution이 국소적으로 다듬는다. 논문의 ablation(Table 4)에서 convolution을 self-attention **뒤에** 두는 순서가 병렬 배치나 앞에 두는 것보다 확실히 낫다는 것을 확인했다.'},
 {h:'Convolution 모듈: GLU 게이팅 + depthwise 컨볼루션',
  lead:'포인트와이즈 컨볼루션과 GLU로 게이팅한 뒤 1D depthwise conv로 국소 패턴을 뽑는다.',
  d:'LayerNorm 다음에 채널을 2배로 확장하는 pointwise conv와 GLU(Gated Linear Unit) 활성화로 게이팅하고, 이어서 1D depthwise convolution(커널 32)이 시간축의 국소 패턴을 뽑는다. 그 뒤 BatchNorm과 Swish 활성화, 다시 pointwise conv로 마무리한다. depthwise 구조라 파라미터는 늘리지 않는다.'},
 {h:'Macaron 스타일 half-step FFN',
  lead:'FFN을 attention 앞뒤에 절반 가중치로 나눠 배치해 성능을 끌어올린다.',
  d:'Transformer는 attention 뒤에 FFN 하나만 둔다. Conformer는 Macaron-Net에서 아이디어를 가져와 FFN을 attention/conv 앞뒤로 **두 번** 배치하되 각각의 residual에 $1/2$ 가중치를 준다. Ablation(Table 5)에서 이 macaron 쌍이 단일 FFN보다, 그리고 half-step이 full-step residual보다 근소하게 낫다.'},
 {h:'상대적 위치 인코딩을 그대로 가져옴',
  lead:'Transformer-XL의 상대 위치 인코딩으로 발화 길이 변화에 강건해진다.',
  d:'MHSA 모듈은 [Transformer](#/p/transformer)의 절대 위치 인코딩 대신 Transformer-XL의 상대적 정현파(sinusoidal) 위치 인코딩을 쓴다. 발화 길이가 학습 때와 달라져도 성능이 잘 유지되고, 이 선택 하나를 빼는 ablation(Table 3)만으로 dev-other WER이 4.4%에서 5.8%로 뛴다 — 다른 어떤 구성 요소 제거보다 큰 손실이다.'},
 {h:'Pre-norm residual 전체 적용',
  lead:'모든 서브모듈에 pre-LN residual을 써서 깊은 인코더(최대 17층)를 안정적으로 학습한다.',
  d:'attention·conv·FFN 모든 서브블록이 `LayerNorm → 서브레이어 → residual` 형태의 pre-norm 구조를 공유한다. [ResNet](#/p/resnet)류 residual 학습 전통을 Transformer 계열 깊은 인코더에 그대로 적용한 것으로, warm-up에 덜 민감하고 파라미터 예산이 다른 S/M/L 세 모델(10M/30M/118M)을 모두 안정적으로 학습시킬 수 있게 했다.'}
],

diagram:{type:'stack', cap:'Conformer 블록 내부. 두 개의 half-step FFN이 self-attention과 convolution을 순서대로 감싼다.',
 layers:[
  {t:'입력', s:'x_i'},
  {t:'Feed Forward', s:'half-step (1/2)', note:'macaron 앞쪽'},
  {t:'Self-Attention', s:'상대 위치 인코딩', acc:true, note:'전역 관계'},
  {t:'Convolution 모듈', s:'GLU + depthwise conv', acc:true, note:'국소 패턴'},
  {t:'Feed Forward', s:'half-step (1/2)', note:'macaron 뒤쪽'},
  {t:'LayerNorm', s:'출력 y_i'}
 ]},

math:[
 {expr:'x~ = x + (1/2)FFN(x);  x\' = x~ + MHSA(x~);  x\'\' = x\' + Conv(x\');  y = LN(x\'\' + (1/2)FFN(x\'\'))',
  tex:'\\begin{aligned}\\tilde{x}_i &= x_i + \\tfrac{1}{2}\\text{FFN}(x_i)\\\\ x_i^{\\prime} &= \\tilde{x}_i + \\text{MHSA}(\\tilde{x}_i)\\\\ x_i^{\\prime\\prime} &= x_i^{\\prime} + \\text{Conv}(x_i^{\\prime})\\\\ y_i &= \\text{Layernorm}\\!\\left(x_i^{\\prime\\prime} + \\tfrac{1}{2}\\text{FFN}(x_i^{\\prime\\prime})\\right)\\end{aligned}',
  d:'블록 하나를 통과하는 전체 식. FFN이 절반 가중치로 두 번, 그 사이에 MHSA와 Conv가 한 번씩 순서대로 들어간다. 이 식 자체가 논문의 유일한 수식이다.'}
],

numbers:[
 {k:'WER · test/testother (L, LM 없음)', v:'2.1% / 4.3%', d:'118.8M 파라미터, 당시 Transformer Transducer(139M) 대비 우수'},
 {k:'WER · test/testother (L, LM 사용)', v:'1.9% / 3.9%', d:'LibriSpeech 최고 성능 갱신 시점 수치'},
 {k:'WER · test/testother (S, 10.3M)', v:'2.7% / 6.3%', d:'동급 파라미터의 ContextNet(S)보다 testother에서 0.7%p 개선'},
 {k:'모델 규모', v:'S 10.3M · M 30.7M · L 118.8M', d:'인코더 층 16~17, 차원 144~512, head 4~8'},
 {k:'상대 위치 인코딩 제거 영향', v:'dev-other 4.4→5.8%', d:'ablation 중 가장 큰 손실 — Transformer-XL 기법의 기여도'},
 {k:'convolution 모듈 제거 영향', v:'dev-other 4.4→4.8%', d:'블록에서 conv를 빼면 사실상 Transformer 인코더로 회귀'}
],

impact:'Conformer는 음성 인식 인코더의 사실상 표준이 됐다. 순수 Transformer나 순수 CNN(ContextNet, QuartzNet)을 쓰던 관행이 "attention과 convolution을 한 블록에 넣는다"는 레시피로 빠르게 수렴했고, 이후 나온 상용·연구용 ASR 시스템 다수가 Conformer 인코더를 기본값으로 채택했다. [wav2vec 2.0](#/p/wav2vec2) 이후의 자기지도 음성 사전학습 계열과 [Whisper](#/p/whisper)의 인코더 설계에도 이 국소+전역 결합 사고방식이 이어졌다. 파라미터를 늘리지 않고도(depthwise conv는 비용이 거의 없다) 정확도를 올렸다는 점에서, 아키텍처 결합이 단순 스케일업보다 효율적일 수 있음을 보여준 사례이기도 하다.',

legacy:[
 '**ASR 인코더의 기본값화** — Google·Meta·NVIDIA 등 이후 산업용 음성 인식 스택 다수가 Conformer 인코더를 채택',
 '**self-supervised 음성 모델과 결합** — [wav2vec 2.0](#/p/wav2vec2) 계열 이후 인코더 백본으로 Conformer 블록을 쓰는 변형이 표준화',
 '**국소+전역 결합 패턴의 일반화** — 비전·시계열 등 다른 도메인에서도 attention과 convolution을 한 블록에 섞는 하이브리드 설계가 뒤따름',
 '**경량화 파생** — Squeezeformer, Efficient Conformer 등 attention 계산량을 줄이거나 블록 순서를 재배치한 후속 변형이 다수 등장'
],

pitfalls:[
 '**"convolution이 self-attention을 대체한다"가 아니다.** 두 모듈은 순차적으로 함께 쓰일 때 최고 성능을 내며, 어느 하나만 빼면 ablation에서 확인되듯 성능이 뚜렷이 떨어진다.',
 '**모듈 순서가 임의가 아니다.** conv를 attention 앞에 두거나 병렬로 배치하면(Table 4) 논문이 제안한 attention→conv 순서보다 성능이 낮다. 구현 시 순서를 바꾸면 재현이 안 될 수 있다.',
 '**depthwise conv 커널 크기는 무조건 클수록 좋지 않다.** 커널 65는 오히려 17·32보다 나빴다(Table 7) — 실무에서 하이퍼파라미터로 새로 튜닝해야 하는 값이다.'
],

figures:[
 {f:'fig1-block.png',
  cap:'왼쪽이 SpecAug → Convolution Subsampling → Linear → Dropout → Conformer Blocks×N으로 이어지는 전체 인코더, 화살표가 가리키는 오른쪽이 Conformer 블록 하나의 내부. 아래에서 위로 FFN(half-step) → Multi-Head Self Attention → Convolution → FFN(half-step) → Layernorm 순서를 눈으로 확인한다.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-conv.png',
  cap:'Convolution 모듈 내부 순서: Layernorm → Pointwise Conv(채널 2배 확장) → GLU 게이팅 → 1D Depthwise Conv → BatchNorm → Swish → Pointwise Conv → Dropout. 채널을 늘렸다가 depthwise로 국소 패턴을 뽑고 다시 줄이는 흐름이 핵심.',
  src:'원문 Figure 2, p.2'}
],

quotes:[
 {t:'Transformer models are good at capturing content-based global interactions, while CNNs exploit local features effectively.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2005.08100 — Conformer', u:'https://arxiv.org/abs/2005.08100'},
 {t:'Google AI Blog — Conformer', u:'https://ai.googleblog.com/2020/11/conformer-convolution-augmented.html'}
]
});
