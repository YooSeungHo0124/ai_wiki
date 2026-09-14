WIKI.paper({
slug:'does-kd-work',
venue:'NeurIPS 2021',
authors:'Stanton, Izmailov, Kirichenko, Alemi & Wilson (NYU · Google Research)',
arxiv:'2106.05945',

tldr:'증류가 "학생이 교사의 함수를 닮게 만드는" 절차라는 통념을 실험으로 해체한다. 학생이 교사와 **똑같이 예측할 능력이 있어도**(용량 충분, 같은 초기화) 실제로는 거의 닮지 않으며, 그 원인은 데이터가 아니라 **최적화 자체가 그 해에 도달하지 못하는 것**이다. 게다가 더 닮은 학생이 꼭 더 잘 일반화하지도 않는다.',

context:'[Hinton의 원 논문](#/p/distillation)은 "교사의 지식이 학생에게 전달된다"는 서술로 증류를 설명했고, 이는 학생이 교사의 예측 함수를 높은 **fidelity**(일치도)로 복제한다는 그림을 전제한다. 그런데 self-distillation(같은 구조끼리)에서는 학생이 교사와 다르게 예측하면서도 오히려 더 잘 일반화한다는 보고가 이미 있었다[13,36]. 이 논문은 이 어긋남을 정면으로 다룬다 — **fidelity**(교사를 얼마나 닮았나)와 **generalization**(테스트 성능)을 명시적으로 분리하고, 왜 fidelity가 낮은지, 낮은 fidelity가 언제 문제가 되는지를 체계적으로 진단한다.',

ideas:[
 {h:'fidelity와 generalization은 다른 축이다',
  lead:'교사를 닮는 것과 테스트를 잘 맞추는 것은 서로 독립적으로 변한다.',
  d:'self-distillation(ResNet-56→ResNet-56)에서는 CIFAR-100 증류 데이터를 GAN 샘플로 늘릴수록 student-teacher agreement(fidelity)는 계속 오르는데 **테스트 정확도는 오히려 떨어진다**. 반대로 3개 앙상블을 교사로 쓰면 fidelity가 오를 때 정확도도 소폭 오른다. 즉 두 지표의 관계는 교사·학생 구성에 따라 달라지며, "fidelity가 오르면 성능도 오른다"는 가정 자체가 무너진다.'},
 {h:'식별가능성 가설: 데이터가 부족해서 안 닮는 게 아니다',
  lead:'증류 데이터를 늘리고 aggressive [mixup](#/p/mixup)까지 써봐도 test agreement는 86%를 못 넘는다.',
  d:'"분포 밖 입력까지 커버해야 함수 전체가 일치한다"는 identifiability 가설을 검증하려고 여러 데이터 증강 전략(Mixup 포함)을 비교했다. 최선의 정책(Mixup, τ=4)도 86% test agreement에 그치고, 기본 정책(Baseline, τ=4)도 84.5%로 꽤 경쟁력이 있다. 데이터를 늘리는 것만으로는 fidelity 격차가 거의 좁혀지지 않는다.'},
 {h:'최적화 가설: 애초에 손실을 못 줄인다',
  lead:'ResNet-20 self-distillation에서 SGD를 5000에폭 돌려도 train agreement가 85%를 못 넘는다.',
  d:'BatchNorm을 LayerNorm으로 바꿔(교사·학생 가중치가 같으면 예측도 반드시 같아지도록) self-distillation을 단순화한 뒤, 300에폭 기준 78.95%였던 train agreement가 5000에폭에서야 83.3%가 된다. 1000→5000에폭 구간에서 겨우 2%p 개선되는 추세라 100% 근처에 가려면 수만 에폭이 필요하다는 계산이 나온다 — **더 오래 학습하는 것만으로는 해결이 안 된다.**'},
 {h:'교사 가중치 근처에서 시작해야 그 basin에 수렴한다',
  lead:'학생을 교사 가중치와 랜덤의 볼록결합으로 초기화하면 λ=0.375에서 급격히 fidelity가 튄다.',
  d:'$\\theta_s=\\lambda\\theta_t+(1-\\lambda)\\theta_r$로 초기화를 바꿔가며 실험하면, $\\lambda\\le 0.25$에서는 별개의 suboptimal한 손실 basin에 갇히지만 $\\lambda=0.375$부터 교사와 같은 basin에 수렴해 거의 100% agreement에 도달한다. 즉 **최적화의 궤적**이 문제이지, 손실 표면에 좋은 해가 없는 게 아니다. 다만 단순히 교사의 **초기** 가중치(학습 시작점)에서 학생을 출발시키는 것만으로는 이 효과가 재현되지 않는다 — 활성 공간(CKA)에서는 살짝 더 비슷해지지만 함수(정확도·agreement·KL)로는 무작위 초기화와 구분이 안 된다.'},
 {h:'fidelity는 그래도 쓸모가 있다: 보정과 압축률 통제',
  lead:'앙상블 증류에서는 fidelity가 높을수록 student가 더 잘 보정된다(calibration).',
  d:'앙상블을 교사로 쓰는 설정에서는 가장 정확한 학생이 항상 가장 fidelity 높은 학생은 아니지만, **가장 잘 보정된 학생은 항상 fidelity가 가장 높다.** 또한 여러 다른 방법(정규화, 아키텍처 변경)이 "일반화 개선"이라는 이름으로 뭉뚱그려지는데, 정말 필요한 게 압축(같은 예측을 더 작은 모델로)인지 아니면 그냥 일반화 개선인지 구분하려면 fidelity를 별도로 봐야 한다.'}
],

diagram:{type:'compare', cap:'"증류가 잘 되면 학생이 교사를 닮는다"는 통념과 이 논문의 진단.',
 left:{t:'통념', items:['fidelity ↑ ⇒ 일반화 ↑','데이터만 늘리면 닮는다','오래 학습하면 수렴한다']},
 right:{t:'진단', items:['self-distill: fidelity↑인데 정확도↓','증강해도 agreement 86%가 한계','5000에폭도 agreement 85% 미만']}
},

math:[
 {expr:'agreement = P[argmax pₜ(x) = argmax pₛ(x)]',
  tex:'\\text{Agreement}=\\mathbb{E}_x\\big[\\mathbb{1}\\{\\arg\\max p_t(x)=\\arg\\max p_s(x)\\}\\big]',
  d:'논문이 쓰는 fidelity의 1차 지표. top-1 예측이 교사와 학생 사이에서 얼마나 일치하는지를 잰다 — 정답과 일치하는지가 아니라 **둘이 서로** 일치하는지를 잰다는 점이 핵심.'},
 {expr:'θ_s = λθ_t + (1-λ)θ_r',
  tex:'\\theta_s=\\lambda\\theta_t+(1-\\lambda)\\theta_r',
  d:'초기화 실험에 쓰인 볼록결합. $\\lambda=0$은 완전 무작위 초기화, $\\lambda=1$은 교사의 최종 가중치에서 그대로 출발하는 것.'}
],

numbers:[
 {k:'self-distill 교사 정확도', v:'84~86%', d:'ResNet-56 teacher, CIFAR-100 부분집합 학습 (100 epochs)'},
 {k:'self-distill test agreement', v:'>99%', d:'모델 용량·데이터가 거의 이상적인 LeNet-5/MNIST 설정에서만 도달'},
 {k:'ResNet-56/CIFAR-100 최선 augmentation', v:'86% test agreement', d:'Mixup(τ=4) 조건, 그래도 100%와 거리가 큼'},
 {k:'SGD 300 vs 5000 epochs', v:'78.95% → 83.3%', d:'train agreement 개선폭이 작아 선형 추세로도 100%까지 수만 epoch 필요'},
 {k:'초기화 임계값', v:'λ=0.375', d:'이 지점을 넘어야 학생이 교사와 같은 손실 basin에 수렴 (Fig.6b)'}
],

impact:'"증류 = 교사를 닮기"라는 직관적 서사에 실증적 반례를 제시하고, fidelity와 generalization을 분리해서 보는 평가 관행을 남겼다. 증류를 압축 수단으로 쓸 때는 fidelity를, 정규화 수단으로 쓸 때는 generalization을 봐야 한다는 구분이 이후 연구의 기본 틀이 되었다. [patient-consistent](#/p/patient-consistent)가 강조하는 "함수 매칭"이라는 관점도 이 논문이 던진 최적화 문제의 연장선에 있다.',

legacy:[
 '[efficacy-kd](#/p/efficacy-kd)의 "용량 부족" 진단에 "충분한 용량에서도 최적화가 안 된다"는 또 다른 원인을 추가',
 '[patient-consistent](#/p/patient-consistent) — 일관된 증강과 훨씬 긴 학습으로 이 논문이 지적한 최적화 문제를 실무적으로 우회',
 '보정(calibration)과 압축률 평가에서 fidelity를 별도 지표로 보고하는 관행 확산'
],

pitfalls:[
 '**"학생 정확도가 좋으면 증류가 성공했다"는 판단은 fidelity를 안 본 것이다.** self-distillation에서는 fidelity가 낮아도(심지어 낮을수록) 정확도가 좋을 수 있다.',
 '**BatchNorm이 있으면 가중치가 같아도 예측이 다를 수 있다.** 이 논문이 LayerNorm으로 바꿔 실험을 단순화한 이유이며, 실무에서 fidelity를 측정할 때 이 함정을 놓치기 쉽다.',
 '**"데이터를 늘리면 해결된다"는 짐작은 이 논문에서 기각됐다.** 증강을 아무리 강화해도 test agreement가 86%를 넘지 못했다 — 문제의 축이 데이터가 아니라 최적화라는 뜻이다.'
],

figures:[
 {f:'fig1-fidelity-vs-accuracy.png',
  cap:'CIFAR-100 증류 데이터를 GAN 샘플로 늘려갈 때(왼쪽=self-distillation, 오른쪽=3-앙상블 증류) teacher-student agreement(파랑)와 student accuracy(초록)의 변화. 왼쪽은 fidelity가 오르는데 정확도가 내려가고, 오른쪽은 둘 다 소폭 오른다 — 같은 "fidelity 증가"가 교사 종류에 따라 반대 결과를 낳는다는 것이 이 논문의 핵심 관찰.',
  src:'원문 Figure 1, p.2'}
],

links:[
 {t:'arXiv 2106.05945 — Does Knowledge Distillation Really Work?', u:'https://arxiv.org/abs/2106.05945'}
]
});
