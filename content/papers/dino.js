WIKI.paper({
slug:'dino',
venue:'ICCV 2021',
authors:'Caron, Touvron, Misra, Jégou, Mairal, Bojanowski, Joulin (Facebook AI Research · Inria · Sorbonne)',
arxiv:'2104.14294',

tldr:'라벨 없는 자기증류(**self-di**stillation with **no** labels)로 [ViT](#/p/vit)를 학습시키자, 아무도 시키지 않은 성질이 나타났다 — **attention 맵이 객체의 경계를 그린다.** 게다가 이 표현은 파인튜닝이나 선형 분류기 없이 단순 k-NN만으로도 ImageNet에서 78.3%를 낸다.',

context:'[BYOL](#/p/byol)이 negative 없는 자기지도를 성립시켰지만, 당시 자기지도 연구는 여전히 ResNet 백본 위에서 벌어지고 있었다. 한편 [ViT](#/p/vit)는 지도학습에서 대량 데이터가 있으면 CNN을 이긴다는 것을 보였지만, 계산량이 크고 데이터를 많이 먹는데다 CNN 대비 뚜렷한 고유 이점이 없다는 평도 있었다. 그런데 원래 트랜스포머가 NLP에서 폭발한 계기는 **자기지도 사전학습**([BERT](#/p/bert), [GPT](#/p/gpt1))이었으니, 시각 트랜스포머에도 아직 열지 않은 문이 있는 것 아닌가 하는 것이 이 논문의 출발점이다. 저자들은 BYOL 계열의 자기증류 구조를 ViT에 얹고 무슨 일이 벌어지는지 보는데, 결과는 정확도 갱신보다 **관찰**로 기억된다.',

ideas:[
 {h:'구조: teacher와 student가 같은 네트워크의 두 시점',
  lead:'student는 gradient로, teacher는 student의 EMA로 갱신되는 [BYOL](#/p/byol)형 골격에 분포 증류를 얹는다.',
  d:'student $\\theta_s$ 는 gradient로 학습하고, teacher $\\theta_t$ 는 student의 EMA로만 갱신된다 — [MoCo](#/p/moco)·[BYOL](#/p/byol)과 같은 골격이다. 다른 점은 출력의 해석으로, 두 네트워크 모두 $K$ 차원 로짓을 내고 softmax를 씌워 **확률분포**로 만든 뒤 student 분포가 teacher 분포를 따라가도록 cross-entropy를 최소화한다. 즉 [지식 증류](#/p/distillation)와 형태가 같은데 teacher가 미리 학습된 큰 모델이 아니라 **자기 자신의 과거**라는 점만 달라서 self-distillation이라 부른다. BYOL과 달리 predictor가 없고, 대신 centering·sharpening이 붕괴를 막는다.'},
 {h:'centering + sharpening: 두 붕괴를 서로 상쇄시킨다',
  lead:'출력 쏠림은 centering이, 균등분포로의 붕괴는 sharpening이 막아 둘을 함께 써야 균형이 잡힌다.',
  d:'negative가 없을 때 붕괴는 두 가지 모양으로 온다. **(a)** 한 차원이 모든 것을 독식해 출력이 상수가 되거나, **(b)** 출력이 균등분포로 뭉개져 아무 정보도 없게 되거나다. 여기에 정확히 하나씩 대응하는 장치를 거는데, **centering**은 teacher 로짓에서 출력의 이동평균 $c$ 를 빼서 특정 차원 독식을 막고(균등 쪽으로 민다), **sharpening**은 teacher의 온도를 student보다 낮게(0.04 대 0.1) 잡아 분포를 뾰족하게 만든다(독식 쪽으로 민다). 둘 중 하나만 쓰면 각각의 방향으로 무너지고 **함께 쓸 때만 균형이 잡히는데**, BYOL이 비대칭 구조로 풀었던 문제를 여기서는 통계적 균형으로 푸는 셈이다.'},
 {h:'multi-crop: local-to-global 대응을 강요한다',
  lead:'teacher는 전역 crop만, student는 전역+국소 crop 전부를 보고 같은 목표를 맞추게 한다.',
  d:'한 이미지에서 큰 crop 2개(224², 원본의 50% 이상)와 작은 crop 여러 개(96², 50% 미만)를 뽑는다. **teacher는 큰 crop만 보고, student는 전부 본다.** 그리고 작은 crop을 본 student가 큰 crop을 본 teacher의 출력을 맞춰야 하므로, 결국 "개의 귀 한 조각만 보고 이미지 전체의 표현을 예측하라"는 요구가 되어 부분과 전체를 잇는 표현을 강제한다. 작은 crop은 계산량이 적어 뷰를 많이 늘려도 비용이 감당된다.'},
 {h:'창발: 라벨 없이 학습한 attention이 객체를 분할한다',
  lead:'라벨 없이 학습된 마지막 층 attention이 head별로 객체 경계에 가까운 마스크를 그린다.',
  d:'이 논문이 기억되는 이유다. 학습이 끝난 ViT의 마지막 층에서 [CLS] 토큰의 attention을 그려보면, 각 head가 서로 다른 객체나 부분에 붙어 **분할 마스크에 가까운 그림**이 나온다 — 분할 라벨은커녕 어떤 라벨도 주지 않았는데 그렇다. 같은 조건의 **지도학습 ViT에서는 이만큼 선명하게 나타나지 않고, CNN에서도 나오지 않아서**, 자기지도 목표와 ViT 아키텍처의 조합에서 나온 성질임을 시사한다. 실제로 이 attention 맵만으로 DAVIS-2017 비디오 객체 분할을 파인튜닝 없이 수행할 수 있다.'},
 {h:'k-NN이 그냥 된다는 것의 의미',
  lead:'분류기 학습 없이 최근접 이웃 투표만으로도 표현 공간의 거리 구조가 의미론적으로 정렬돼 있음을 보인다.',
  d:'학습된 특징을 저장해두고 최근접 이웃 투표만 해도 ImageNet 78.3%가 나온다. 선형 분류기조차 학습하지 않는다는 뜻이다. 이것은 표현 공간의 **거리 구조 자체가 이미 의미론적으로 정렬되어 있다**는 강한 증거이며, 이후 DINO 특징이 검색·복사 탐지·클러스터링 같은 "학습 없는" 용도로 널리 쓰이는 근거가 된다.'}
],

diagram:{type:'split', cap:'multi-crop. teacher는 전역만, student는 전역+국소 전부를 본다 — 이 비대칭이 부분에서 전체를 추론하게 만든다.',
 from:{t:'이미지 1장', s:'라벨 없음'},
 branches:[
  {t:'global crop ×2', s:'224² · 면적 >50%'},
  {t:'local crop ×8', s:'96² · 면적 <50%'},
  {t:'teacher (EMA)', s:'global만 · τ=0.04'},
  {t:'student (SGD)', s:'전부 입력 · τ=0.1'}
 ],
 join:'모든 (student 뷰 → teacher 전역뷰) 쌍에 cross-entropy'},

math:[
 {expr:'min_θs  Σ_{x∈{x1g,x2g}} Σ_{x\'≠x}  − P_t(x) · log P_s(x\')',
  tex:'\\min_{\\theta_s}\\ \\sum_{x\\in\\{x_1^g,x_2^g\\}}\\ \\sum_{x\'\\ne x} -P_t(x)\\cdot\\log P_s(x\')',
  d:'teacher가 본 두 전역 뷰 각각에 대해, 그것과 다른 모든 뷰를 본 student의 분포가 맞추도록 한다. 밀어내는 항은 없고 오직 맞추는 항뿐이다.'},
 {expr:'P_t(x) = softmax( (g_θt(x) − c) / τ_t ),   c ← m·c + (1−m)·mean_batch(g_θt)',
  tex:'\\begin{aligned}P_t(x) &= \\text{softmax}\\!\\left(\\frac{g_{\\theta_t}(x)-c}{\\tau_t}\\right)\\\\ c &\\leftarrow m\\cdot c+(1-m)\\cdot\\text{mean}_{batch}(g_{\\theta_t})\\end{aligned}',
  d:'teacher 출력에서 이동평균 중심 $c$ 를 빼는 것이 centering, 낮은 온도 $\\tau_t=0.04$ 로 나누는 것이 sharpening이다. $c$ 는 배치 평균의 EMA라서 배치 크기에 거의 의존하지 않는다.'},
 {expr:'θ_t ← λ·θ_t + (1 − λ)·θ_s,   λ: 0.996 → 1 (cosine)',
  tex:'\\theta_t \\leftarrow \\lambda\\theta_t+(1-\\lambda)\\theta_s,\\quad \\lambda: 0.996 \\to 1\\ (\\text{cosine})',
  d:'teacher는 student의 지수이동평균이다. 학습 중 teacher의 성능이 student보다 **꾸준히 앞선다**는 점이 논문에서 관찰되며, 이것이 자기증류가 정보를 잃지 않고 굴러가는 이유로 해석된다.'}
],

numbers:[
 {k:'k-NN 분류 top-1', v:'78.3%', d:'작은 ViT 기준. 분류기를 **학습하지 않고** 최근접 이웃 투표만'},
 {k:'선형 평가 top-1', v:'80.1%', d:'ViT-Base(패치 8). 당시 자기지도 최고'},
 {k:'출력 차원 K', v:'65536', d:'클래스가 아니라 프로토타입에 가까운 개념. 마지막 층은 weight normalization'},
 {k:'온도 (teacher / student)', v:'0.04 / 0.1', d:'teacher를 더 뾰족하게 — sharpening. centering과 짝을 이뤄야 붕괴를 막는다'},
 {k:'crop 구성', v:'224² ×2 + 96² ×8', d:'teacher는 전역 2개만, student는 10개 전부'}
],

figures:[
 {f:'fig1-attention-map.png',
  cap:'각 쌍의 왼쪽이 원본, 오른쪽이 [CLS] 토큰이 마지막 층에서 이미지 패치들에 준 self-attention을 그대로 색으로 칠한 것(밝을수록 attention이 크다). 라벨도 마스크 정답도 준 적이 없는데 새·giraffe·보트·개 같은 전경 객체의 윤곽만 밝게 뜬다 — 분류 학습으로는 잘 나오지 않는 성질이라는 점이 이 그림의 핵심 주장.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-self-distillation.png',
  cap:'같은 이미지 x에서 만든 두 augmentation(x1, x2)이 각각 student와 teacher에 들어간다. 두 네트워크는 구조는 같고 파라미터만 다르다. teacher 출력에는 centering을 거친 뒤 stop-gradient(sg)를 걸어 gradient가 student 쪽으로만 흐르게 하고, teacher의 파라미터는 역전파가 아니라 student의 지수이동평균(ema)으로만 갱신된다 — 레이블도 negative pair도 없이 붕괴를 막는 장치가 이 그림 안의 centering·sharpening·ema 세 가지다.',
  src:'원문 Figure 2, p.2'}
],

quotes:[
 {t:'Self-supervised ViT features explicitly contain the scene layout and, in particular, object boundaries, as shown in Figure 1. This information is directly accessible in the self-attention modules of the last block.',
  src:'Section 1, p.2'},
 {t:'We implement our findings into a simple self-supervised method, called DINO, which we interpret as a form of self-distillation with no labels.',
  src:'Abstract, p.1'}
],

impact:'세 가지가 바뀌었다 — **(1) ViT의 정체성**은 "데이터만 많으면 CNN을 이기는 대안"에서 "자기지도와 결합했을 때 CNN에 없는 성질이 나오는 구조"로 재평가됐다. **(2) 특징의 용도** — 파인튜닝 없이 그대로 쓰는 범용 시각 특징이라는 개념이 실용 단계로 올라왔고, 이미지 검색·클러스터링·약지도 분할에서 DINO 특징이 기본 선택지가 됐다. **(3) 해석 가능성** — attention 맵이 라벨 없이 객체 구조를 담는다는 관찰은 [Segment Anything](#/p/sam)류의 클래스 무관 분할 연구와 시각 표현 해석 연구 양쪽에 인용됐다. 이 레시피를 데이터 규모로 밀어붙인 것이 2년 뒤 [DINOv2](#/p/dinov2)다.',

legacy:[
 '**[DINOv2](#/p/dinov2)** — DINO 손실에 iBOT의 패치 마스킹 목표를 더하고 데이터 큐레이션을 붙여 범용 시각 인코더로 확장',
 '**학습 없는 활용** — 이미지 검색, 복사 탐지, 비디오 객체 추적, 의미론적 대응(semantic correspondence)에서 DINO 특징을 그대로 쓰는 연구군이 형성',
 '**분할과의 접점** — 라벨 없는 객체 발견(unsupervised object discovery)과 클래스 무관 분할의 표준 시작점이 되며 [SAM](#/p/sam) 이후에도 프롬프트 없는 분할의 기반으로 사용',
 '**자기증류 계열의 정착** — centering/sharpening 균형이라는 붕괴 방지 방식이 [BYOL](#/p/byol)의 predictor 방식과 나란히 두 갈래로 자리잡음'
],

pitfalls:[
 '**"attention 맵 = 분할 마스크"는 과장이다.** 선명하게 나오는 것은 주로 마지막 층 [CLS] 토큰의 일부 head이며, head마다 품질이 크게 다르고 배경이 복잡하거나 객체가 여럿이면 흐트러진다. 논문도 시각화에서 attention의 상위 일정 비율만 남겨 그린다.',
 '**centering과 sharpening은 세트다.** 하나만 켜면 각각 균등분포 붕괴와 상수 붕괴로 무너진다. 하이퍼파라미터 중 teacher 온도는 특히 예민해서, 학습 초반에 워밍업으로 서서히 낮추지 않으면 발산하기 쉽다.',
 '**k-NN 78.3%를 아무 ViT나 낸다고 보면 안 된다.** 이 수치는 작은 패치 크기(8)와 multi-crop, 긴 학습 스케줄이 함께 있을 때의 값이고, 패치를 16으로 키우면 계산은 크게 줄지만 정확도와 attention 맵의 해상도가 모두 떨어진다.'
],

links:[
 {t:'arXiv 2104.14294 — Emerging Properties in Self-Supervised Vision Transformers', u:'https://arxiv.org/abs/2104.14294'},
 {t:'facebookresearch/dino (공식 구현 · 사전학습 가중치)', u:'https://github.com/facebookresearch/dino'},
 {t:'DINO: Self-supervised Vision Transformers (Meta AI Blog)', u:'https://ai.meta.com/blog/dino-paws-computer-vision-with-self-supervised-transformers-and-10x-more-efficient-training/'}
]
});
