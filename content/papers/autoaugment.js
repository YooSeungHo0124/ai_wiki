WIKI.paper({
slug:'autoaugment',
venue:'CVPR 2019 (arXiv 2018)',
authors:'Cubuk, Zoph et al. (Google Brain)',
arxiv:'1805.09501',

tldr:'데이터 증강을 손으로 설계하는 대신, 증강 정책 자체를 [ResNet](#/p/resnet) 계열 child 모델을 반복 학습시켜 **강화학습으로 탐색**한 논문. 정책 하나를 찾는 데 수천~만 GPU-시간이 드는 대가로 [ImageNet](#/p/imagenet)·CIFAR-10에서 당시 SOTA를 갱신했다.',

context:'2018년 이전의 데이터 증강은 대부분 손으로 짠 규칙이었다. MNIST는 elastic distortion, CIFAR·ImageNet은 random crop·mirror·색상 정규화가 관행이었고, 데이터셋마다 어떤 조합이 잘 듣는지는 경험적으로 정해졌다. 한편 같은 시기 Zoph & Le의 신경망 구조 탐색(NAS)은 RNN 컨트롤러가 강화학습으로 신경망 구조 자체를 탐색해 성능을 냈다. 이 논문의 질문은 단순하다 — 아키텍처를 탐색할 수 있다면, **증강 정책도 같은 방식으로 탐색할 수 있지 않을까**? 직전 시도인 GAN 기반 증강 생성(Ratner et al.)은 생성된 이미지가 "진짜 같아 보이는가"를 기준으로 최적화했는데, 이 논문은 그 대신 **분류 정확도 자체**를 직접 최적화 대상으로 삼는다.',

ideas:[
 {h:'탐색 공간: 5개 서브정책 × 2개 연산',
  lead:'정책을 5개 서브정책으로, 각 연산을 16종 × 크기 10단계 × 확률 11단계로 이산화한다.',
  d:'정책 하나는 5개의 서브정책으로 이뤄지고, 각 서브정책은 순서가 있는 2개의 이미지 연산이다. 연산은 ShearX/Y, Rotate, AutoContrast, Invert, Equalize, Solarize, Posterize, Contrast, Color, Brightness, Sharpness, Cutout, SamplePairing 등 **16종**이고, 각 연산은 적용 확률(11단계 이산값)과 크기(magnitude, 10단계 이산값)를 갖는다. 서브정책 하나의 탐색 공간은 $(16\\times10\\times11)^2$, 5개를 동시에 찾으므로 전체 공간은 $(16\\times10\\times11)^{10}\\approx2.9\\times10^{32}$ 가지다.'},
 {h:'컨트롤러-child 루프: 미분 불가능한 보상을 RL로 먹인다',
  lead:'validation accuracy를 보상으로 삼아 [PPO](#/p/ppo)로 컨트롤러 RNN을 학습한다.',
  d:'컨트롤러는 1층 LSTM으로, 매 스텝 softmax로 연산 종류·확률·크기 중 하나를 결정하며 정책 하나당 총 **30번**의 softmax 예측(5개 서브정책 × 2개 연산 × 3개 값)을 내놓는다. 이 정책으로 [Wide ResNet](#/p/wide-resnet) 같은 고정 아키텍처의 child 모델을 처음부터 학습시키고, validation accuracy $R$ 을 보상으로 컨트롤러를 업데이트한다. $R$ 이 미분 불가능하므로 policy gradient(PPO)를 쓴다.'},
 {h:'탐색 비용이 곧 이 방법의 발목',
  lead:'정책 하나를 찾는 데 데이터셋당 GPU-수천~만 시간이 든다.',
  d:'child 모델은 **매번 처음부터** 학습되고, 한 데이터셋에서 컨트롤러가 정책을 약 **15,000개** 샘플링할 때까지 반복한다. 비용을 줄이려고 CIFAR-10은 전체 5만 장 대신 4,000장짜리 "reduced CIFAR-10"으로, ImageNet은 학습 데이터 일부(120클래스, 클래스당 500장)로 탐색했다. 그래도 ImageNet 탐색에는 P100 기준 **15,000 GPU-시간**이 들었다.'},
 {h:'정책은 데이터셋을 넘어 전이된다',
  lead:'ImageNet에서 찾은 정책을 그대로 다른 데이터셋에 옮겨도 통한다.',
  d:'ImageNet 정책을 가져다 Oxford Flowers, Caltech-101, FGVC Aircraft, Stanford Cars 등 **한 번도 탐색에 쓰이지 않은 FGVC 데이터셋**에 적용해도 baseline 대비 에러가 크게 줄었다. 특히 ImageNet pretrain이 별 도움이 안 된다고 알려진 Stanford Cars·FGVC Aircraft에서도 증강 정책 전이는 먹혔다는 점이, 저자들이 "직접 탐색이 너무 비싸면 전이를 쓰라"고 제안하는 근거다.'},
 {h:'랜덤 정책도 어느 정도는 먹힌다 (그런데 학습된 쪽이 낫다)',
  lead:'탐색 공간에서 무작위로 뽑은 정책도 baseline보다 낫지만, 학습된 확률·크기가 성능 차를 만든다.',
  d:'ablation에서 확률·크기를 무작위화한 정책은 CIFAR-10 에러 3.0%, 연산·확률·크기를 전부 무작위화하면 3.1%로, 학습된 정책의 2.6%보다 뚜렷이 나쁘다. 즉 "증강을 다양하게 섞는다"는 아이디어 자체도 효과가 있지만, **어떤 연산을 얼마나 세게, 얼마나 자주 쓸지**를 학습한 값이 성능 차이의 상당 부분을 차지한다.'}
],

diagram:{type:'loop', cap:'컨트롤러 RNN이 정책을 샘플링 → child 모델을 처음부터 학습 → validation accuracy를 보상으로 PPO 업데이트. 데이터셋 하나당 이 루프를 약 15,000번 반복한다.',
 center:'데이터셋당 ~15,000회',
 nodes:[
  {t:'정책 샘플링', s:'컨트롤러 LSTM · 30 softmax'},
  {t:'child 모델 학습', s:'WRN-40-2 · 처음부터', acc:true},
  {t:'검증 정확도 R', s:'reward 신호'},
  {t:'컨트롤러 업데이트', s:'PPO policy gradient'}
 ]},

math:[
 {expr:'J(θc) = E_{P(a1:T; θc)}[R]',
  tex:'J(\\theta_c) = \\mathbb{E}_{P(a_{1:T};\\theta_c)}\\big[R\\big]',
  d:'컨트롤러 파라미터 $\\theta_c$ 가 순서대로 내놓는 결정 $a_{1:T}$(연산·확률·크기 30개)의 기대 보상을 최대화한다. $R$ 은 child 모델의 validation accuracy로, 컨트롤러 입장에서는 블랙박스 함수다.'},
 {expr:'∇θc J = Σ_t E[∇θc log P(at | a(t-1):1; θc) · R]',
  tex:'\\nabla_{\\theta_c} J = \\sum_{t=1}^{T} \\mathbb{E}\\big[\\nabla_{\\theta_c}\\log P(a_t \\mid a_{(t-1):1};\\theta_c)\\,R\\big]',
  d:'$R$ 이 정책(연산 선택)에 대해 미분 불가능하므로 REINFORCE 계열 policy gradient로 우회한다. 실제 구현은 이 추정량을 PPO로 안정화하고, 분산을 줄이기 위해 이전 보상들의 지수이동평균을 baseline으로 뺀다.'}
],

numbers:[
 {k:'탐색 공간 크기', v:'(16×10×11)¹⁰ ≈ 2.9×10³²', d:'연산 16종 × 크기 10단계 × 확률 11단계, 서브정책 5개'},
 {k:'ImageNet 탐색 비용', v:'15,000 GPU-시간', d:'NVIDIA Tesla P100 기준, 컨트롤러가 정책 약 15,000개를 샘플링'},
 {k:'CIFAR-10 탐색 비용', v:'5,000 GPU-시간', d:'reduced CIFAR-10(4,000장)으로 탐색해도 이만큼 듦'},
 {k:'CIFAR-10 에러율', v:'1.5%', d:'기존 SOTA 2.1% 대비 0.6%p 개선'},
 {k:'ImageNet Top-1', v:'83.5%', d:'기존 기록 83.1% 대비 0.4%p 개선(AmoebaNet-C 기준)'},
 {k:'학습 정책 vs 랜덤 정책', v:'2.6% vs 3.0~3.1%', d:'CIFAR-10, Wide-ResNet-28-10 — 무작위 정책도 되지만 학습이 더 낫다'}
],

impact:'증강을 "사람이 고르는 하이퍼파라미터"에서 "탐색으로 학습하는 대상"으로 바꿨다. CIFAR-10·CIFAR-100·SVHN·ImageNet에서 당시 SOTA를 갱신했고, 한 데이터셋에서 찾은 정책이 [ResNet](#/p/resnet)부터 AmoebaNet, Wide-ResNet까지 여러 아키텍처와 여러 데이터셋에 그대로 전이된다는 것을 보였다. 동시에 이 방법의 대가 — child 모델을 수만 번 처음부터 학습시키는 탐색 비용 — 를 숫자로 드러내면서, 이후 연구가 "정확도는 비슷하게 유지하면서 탐색 비용을 어떻게 줄일까"라는 질문에 집중하게 만들었다.',

legacy:[
 '**탐색 비용 절감 계열** — Fast AutoAugment, Population Based Augmentation(PBA) 등이 RL 대신 density matching·population-based training으로 같은 탐색을 훨씬 싸게 하려 했다',
 '**RandAugment의 등장** — 저자 일부가 이후 발표한 RandAugment는 서브정책·컨트롤러를 통째로 버리고 "몇 개의 연산을 얼마나 세게" 두 개의 스칼라 하이퍼파라미터로 grid search하는 것만으로 비슷한 성능을 낼 수 있음을 보여, AutoAugment식 탐색이 필요조건이 아니었음을 드러냈다',
 '**연산 풀의 재사용** — 이 논문이 조합한 Cutout, [mixup](#/p/mixup) 계열 아이디어는 이후 개별 논문으로도, AutoAugment의 부품으로도 계속 쓰인다',
 '**"정책은 전이된다"는 관찰의 재활용** — 도메인 특화 탐색이 비쌀 때 다른 데이터셋의 정책을 그대로 가져다 쓰는 관행이 이후 증강 연구 전반의 기본 baseline이 됐다'
],

pitfalls:[
 '**"AutoAugment = 무조건 최고 성능"이 아니다.** 저자들 스스로 ablation에서 무작위 정책도 baseline보다 낫다는 것을 보였다 — 개선의 상당 부분은 "다양한 증강을 섞어 쓴다"는 구조 자체에서 오고, RL 탐색은 그 위에 추가 이득을 더하는 쪽이다.',
 '**탐색 비용을 실무 비용과 혼동하면 안 된다.** 논문이 보고하는 정확도는 GPU-수천~만 시간을 쓴 탐색 이후의 결과다. 이 비용이 부담스러워서 나온 것이 RandAugment 같은 하이퍼파라미터 축소이므로, 실무에서는 처음부터 탐색을 새로 돌리기보다 이미 찾은 정책을 전이해 쓰는 쪽이 현실적이다.',
 '**서브정책은 이미지당이 아니라 미니배치 안에서 무작위로 골라 적용된다.** 같은 이미지도 미니배치마다 다른 서브정책을 만나 다르게 변형되므로, "이 정책 하나가 결정론적으로 적용된다"고 오해하면 안 된다.'
],

figures:[
 {f:'fig2-svhn-policy.png',
  cap:'SVHN에서 찾은 정책 하나가 같은 원본 숫자 이미지를 미니배치마다 다르게 바꾸는 예. 5개 서브정책 각각이 두 연산과 (확률, 크기) 쌍을 갖고, 미니배치마다 5개 중 하나가 무작위로 뽑혀 적용된다.',
  src:'원문 Figure 2, p.3'},
 {f:'fig4-ablation.png',
  cap:'CIFAR-10에서 학습에 쓰는 서브정책 개수를 늘릴수록(가로축) validation error(세로축)가 떨어지다가 20개 근처부터 완만해진다. 세로 막대는 5회 반복의 편차 범위.',
  src:'원문 Figure 4, p.8'}
],

quotes:[
 {t:'We emphasize again that we trained our controller using RL out of convenience, augmented random search and evolutionary strategies can be used just as well. The main contribution of this paper is in our approach to data augmentation and in the construction of the search space; not in discrete optimization methodology.',
  src:'Section 5, p.7'}
],

links:[
 {t:'arXiv 1805.09501 — AutoAugment: Learning Augmentation Strategies from Data', u:'https://arxiv.org/abs/1805.09501'},
 {t:'AutoAugment 공식 코드 (Google Research)', u:'https://github.com/tensorflow/models/tree/master/research/autoaugment'}
]
});
