WIKI.paper({
slug:'lars',
venue:'arXiv (Technical Report) 2017',
authors:'You, Gitman, Ginsburg (UC Berkeley · CMU · NVIDIA)',
arxiv:'1708.03888',

tldr:'배치를 키우면 학습이 깨지는 문제를, **레이어마다 가중치 노름 대비 기울기 노름의 비율에 맞춰 학습률을 따로 정해서** 푼 논문. AlexNet을 배치 8K, ResNet-50을 배치 32K까지 정확도 손실 없이 밀어붙였다.',

context:'2017년 대규모 학습은 데이터 병렬 SGD로 GPU를 늘려 처리량을 올리는 방식이었는데, 워커 수를 늘릴수록 전역 배치 크기도 커진다는 부작용이 있었다. [Krizhevsky의 선형 스케일링](#/p/one-weird-trick)은 배치를 $k$배 키우면 학습률도 $k$배 키우라고 제안했고, Goyal et al.(2017)의 warm-up이 이를 보강해 [ResNet](#/p/resnet)-50을 배치 8K까지 끌어올렸다. 하지만 저자들이 [AlexNet](#/p/alexnet)에 같은 레시피를 적용하자 배치 2K를 넘기면서 발산했고, 4K에서 정확도가 57.6%에서 53.1%로, 8K에서는 44.8%로 무너졌다. 문제는 레이어마다 가중치 노름과 기울기 노름의 비율이 크게 달라서, 전체 네트워크에 단일 학습률을 쓰면 어떤 레이어는 너무 빨리 어떤 레이어는 너무 느리게 움직인다는 데 있었다.',

ideas:[
 {h:'가중치/기울기 노름 비율이 불안정성의 신호',
  lead:'||w||/||∇L(w)||가 레이어마다 수십~수천 배 차이 나고, 이 비율이 클수록 불안정해진다.',
  d:'논문은 AlexNet-BN 첫 반복에서 이 비율을 실측한다. 첫 conv 레이어("conv1.w")는 5.76인데 마지막 완전연결 레이어("fc6.w")는 1345다. 학습률이 이 비율에 비해 크면 그 레이어의 업데이트 크기 $||\\lambda\\nabla L(w)||$가 가중치 크기 $||w||$를 넘어서고, 이는 초기화와 초기 학습률에 학습이 극도로 민감해지는 원인이 된다.'},
 {h:'LARS: 레이어별 local learning rate',
  lead:'전역 학습률 위에 레이어마다 "신뢰 계수" η로 정한 local LR을 곱해 적용한다.',
  d:'각 레이어 $l$에 대해 $\\lambda^l = \\eta \\cdot ||w^l|| / ||\\nabla L(w^l)||$ 를 계산하고, 실제 업데이트는 전역 LR $\\gamma$와 이 local LR을 곱해서 적용한다. $\\eta < 1$은 한 번의 업데이트로 레이어를 얼마나 바꿀지 정하는 상수이고, 논문 실험에서는 0.001을 썼다. 가중치 감쇠 항까지 포함하면 분모가 $||\\nabla L(w^l)|| + \\beta ||w^l||$ 로 확장된다.'},
 {h:'ADAM/RMSProp과의 차이 — 가중치별이 아니라 레이어별',
  lead:'ADAM은 가중치마다 다른 스케일을 쓰지만 LARS는 레이어 단위로만 나눠 안정성을 지킨다.',
  d:'ADAM·RMSProp도 적응적 학습률이지만 파라미터 하나하나에 개별 스케일을 매겨 노이즈에 민감하다. LARS는 레이어 전체의 노름 비율만 보기 때문에 통계가 훨씬 안정적이고, 큰 배치·큰 학습률 구간에서 발산을 피하는 데 유리하다고 저자들은 설명한다.'},
 {h:'BatchNorm과의 상호작용',
  lead:'Local Response Normalization을 BatchNorm으로 바꾸는 것만으로도 큰 LR 구간이 크게 넓어졌다.',
  d:'AlexNet 원본은 warm-up을 걸어도 LR>0.06에서 발산했지만, AlexNet-BN은 warm-up 없이도 LR=0.3까지 견뎠다. LARS는 이 위에서 작동해 레이어별 미세조정을 더한 것이지, BatchNorm을 대체하는 것이 아니다.'},
 {h:'큰 배치는 정보가 아니라 스텝 수를 깎을 뿐',
  lead:'배치를 키워 잃은 정확도는 결국 더 오래 학습시키면 대부분 회복된다.',
  d:'AlexNet-BN을 배치 32K로 100 에폭 학습하면 57.8%지만, 200 에폭까지 늘리면 59.9%로 베이스라인에 근접한다. 저자들은 배치가 매우 커지면 확률적 기울기가 참 기울기에 가까워져, 배치를 더 키워도 얻는 기울기 정보량 자체는 늘지 않는다고 해석한다.'}
],

diagram:{type:'compare', cap:'같은 선형 스케일링 레시피가 BatchNorm 유무·LARS 유무에 따라 완전히 다른 결과를 낸다.',
 left:{t:'기존: 전역 단일 LR', items:['warm-up + 선형 스케일링','AlexNet B=8K → 44.8%(붕괴)','레이어별 노름 차이 무시']},
 right:{t:'LARS: 레이어별 local LR', items:['||w||/||∇L|| 비율로 자동 조절','AlexNet B=8K → 베이스라인과 동일','ResNet-50 B=32K → -0.7%p']}},

math:[
 {expr:'λ_l = η × ||w_l|| / ||∇L(w_l)||',
  tex:'\\lambda^{l}=\\eta\\times\\frac{\\lVert w^{l}\\rVert}{\\lVert \\nabla L(w^{l})\\rVert}',
  d:'레이어 $l$의 local learning rate. $\\eta$는 "신뢰 계수"로 한 번의 업데이트에서 가중치를 얼마나 바꿀지 정한다. 실험에서는 $\\eta=0.001$.'},
 {expr:'λ_l = η × ||w_l|| / (||∇L(w_l)|| + β||w_l||)',
  tex:'\\lambda^{l}=\\eta\\times\\frac{\\lVert w^{l}\\rVert}{\\lVert \\nabla L(w^{l})\\rVert+\\beta\\lVert w^{l}\\rVert}',
  d:'가중치 감쇠 계수 $\\beta$를 포함한 확장형. 실제 구현(Algorithm 1)은 이 식을 쓴다.'}
],

numbers:[
 {k:'AlexNet, 기존 선형 스케일링 B=8K', v:'44.8%', d:'베이스라인 B=512 대비 **-13.2%p**, 논문이 지적한 붕괴 사례'},
 {k:'AlexNet-BN + LARS, B=8K', v:'베이스라인과 동일', d:'BN 교체 + LARS로 정확도 손실 완전히 제거'},
 {k:'ResNet-50 + LARS, B=32K', v:'72.3%', d:'베이스라인 B=256의 73.0% 대비 **-0.7%p**'},
 {k:'AlexNet-BN + LARS, B=32K', v:'57.8% → 59.9%', d:'100 에폭에서 200 에폭으로 늘리면 회복 (베이스라인 60.2%)'},
 {k:'||w||/||∇L(w)|| 비율 범위', v:'5.76 ~ 1345', d:'AlexNet-BN 1차 반복, conv1.w 대 fc6.w'},
 {k:'LARS 계수 η', v:'0.001', d:'전 실험 공통 적용값'}
],

impact:'대배치 학습의 병목이 "통신"이 아니라 "레이어마다 다른 최적화 지형"이라는 것을 수치로 보여줬다. 이후 초대형 모델 학습에서 레이어별/파라미터그룹별로 학습률을 스케일링하는 관행이 표준이 됐고, 특히 자기지도학습처럼 배치를 극단적으로 키워야 하는 세팅에서 LARS와 그 후속인 LAMB가 사실상 기본 옵티마이저로 쓰이게 됐다.',

legacy:[
 '**[BYOL](#/p/byol)·[SimCLR](#/p/simclr)** — 대조학습/자기지도학습은 배치를 수천~수만으로 키워야 음성 샘플이 충분해지는데, 이 배치 스케일링을 LARS 없이는 안정적으로 달성하기 어려웠다',
 '**[MAE](#/p/mae)** — 사전학습 단계에서 큰 배치·큰 학습률 구성에 LARS 계열 옵티마이저를 사용',
 '**LAMB (You et al. 2019)** — LARS의 아이디어를 ADAM에 결합해 [BERT](#/p/bert) 사전학습을 배치 32K/64K로 끌어올린 직계 후속 연구',
 '**[Megatron](#/p/megatron) 등 초대형 모델 학습** — 데이터 병렬 규모가 커질수록 배치도 커지므로, 레이어별 학습률 스케일링이라는 사고방식 자체가 이후 대규모 학습 레시피의 기본 구성요소가 됨'
],

pitfalls:[
 '**LARS는 학습률 스케줄을 없애는 기술이 아니다.** 논문의 모든 실험은 여전히 warm-up과 polynomial decay 위에 LARS를 얹은 것이고, LARS 단독으로 warm-up을 대체하지 않는다.',
 '**"배치를 키우면 무조건 더 빨리 끝난다"가 아니다.** 6절 실험이 보여주듯 B=32K에서 100 에폭은 베이스라인보다 낮은 정확도이고, 이를 회복하려면 200 에폭까지 늘려야 한다 — 스텝당 시간은 줄어도 총 에폭 수 요구가 늘 수 있다.',
 '**논문 자체가 "32K 이상은 미해결"이라고 명시한다.** 결론에서 "Training of these networks with batch above 32K without accuracy loss is still open problem"이라고 밝혀, 이 논문이 배치 확장의 끝이 아니라 32K까지의 결과임을 분명히 한다.'
],

figures:[
 {f:'fig3-lars-comparison.png',
  cap:'왼쪽(LARS 없음): 배치 8192(주황)가 배치 512(파랑)보다 20 에폭 내내 뚜렷이 낮은 정확도로 수렴한다. 오른쪽(LARS 적용): 같은 두 배치 곡선이 학습 후반부에 거의 겹친다 — 배치를 늘렸는데 곡선 모양이 달라진 것이 아니라 같은 궤적을 따라가게 된 것이 LARS의 효과다.',
  src:'원문 Figure 3, p.6'}
],

quotes:[
 {t:'We argue that the current recipe for large batch training (linear learning rate scaling with warm-up) is not general enough and training may diverge.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1708.03888 — Large Batch Training of Convolutional Networks', u:'https://arxiv.org/abs/1708.03888'},
 {t:'NVIDIA nvcaffe LARS 구현', u:'https://github.com/borisgin/nvcaffe-0.16'}
]
});
