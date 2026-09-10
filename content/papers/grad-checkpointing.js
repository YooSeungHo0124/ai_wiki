WIKI.paper({
slug:'grad-checkpointing',
venue:'arXiv 2016 (NIPS 2016 workshop)',
authors:'Chen, Xu, Zhang, Guestrin (U. Washington · Dato · MIT)',
arxiv:'1604.06174',

tldr:'순전파의 중간 활성값을 전부 들고 있지 않고, 일부만 남긴 뒤 역전파 때 **다시 계산**해서 `n`층 네트워크의 메모리를 $O(\\sqrt{n})$ 으로 줄이는 방법. 추가 비용은 순전파 한 번뿐이라, 오늘날 거의 모든 대규모 학습이 기본으로 켜 두는 옵션이 됐다.',

context:'2016년의 [ResNet](#/p/resnet) 이후 네트워크는 계속 깊어졌는데, 표준 backprop은 역전파에서 각 층의 순전파 출력을 다시 써야 하므로 **모든 중간 활성값을 forward 내내 GPU에 들고 있어야** 한다. `n`층이면 메모리도 $O(n)$ 으로 늘어 GPU 메모리 한계가 곧 모델 깊이의 한계였다. 당시 Theano·TensorFlow는 참조 카운트 기반 런타임 가비지 컬렉션으로, MXNet은 정적 메모리 계획으로 이 문제를 완화했지만 둘 다 활성값 자체를 줄이지는 못했다. 이 논문의 질문은 단순하다 — **역전파에 필요한 값을 어차피 순전파로 다시 만들 수 있다면, 왜 전부 저장해 두는가?**',

ideas:[
 {h:'계산 그래프의 메모리 공유 — inplace와 sharing',
  lead:'생명주기가 겹치지 않는 노드끼리 메모리 태그를 재활용해 기본 메모리 비용부터 줄인다.',
  d:'재계산에 들어가기 전에, 저자들은 먼저 계산 그래프 분석만으로 얻을 수 있는 절감을 짚는다. 한 연산의 출력을 입력 자리에 그대로 덮어쓰는 **inplace**, 그리고 더는 쓰이지 않는 노드의 메모리를 다른 노드가 재활용하는 **sharing**이다. 그래프를 위상 순서로 훑으며 각 노드에 살아있는 참조 수(counter)를 매기는 $O(n)$ 휴리스틱으로 처리하며, 실험에서 이것만으로도 메모리를 2~3배 줄인다.'},
 {h:'segment 단위로 활성값을 버리고 다시 계산한다',
  lead:'네트워크를 세그먼트로 나눠 경계값만 남기고, 안쪽은 역전파 때 순전파를 재실행해 복원한다.',
  d:'`n`층 네트워크를 `k`개 세그먼트로 나눈다. 순전파에서는 **세그먼트 경계의 출력만 기억**하고 내부 중간값은 버린다. 역전파가 어떤 세그먼트에 도달하면, 그 직전 경계값에서 순전파를 다시 돌려 내부 활성값을 복원한 뒤 정상적으로 역전파한다(Algorithm 1). 사용자는 어떤 노드를 몇 번 재계산할지를 `mirror count` 함수 하나로 지정하면 되고, 전부 0으로 두면 일반 backprop으로 되돌아간다.'},
 {h:'k를 √n으로 두면 총 비용이 O(√n)',
  lead:'세그먼트 크기와 개수를 모두 √n으로 맞추는 균형점에서 메모리가 최소가 된다.',
  d:'총 메모리 비용은 "세그먼트 하나를 역전파하는 비용" $O(n/k)$ 과 "세그먼트 경계를 저장하는 비용" $O(k)$ 의 합이다. 이 둘은 트레이드오프 관계라서, $k=\\sqrt{n}$ 으로 두면 두 항이 같은 크기가 되어 총합이 $O(2\\sqrt{n})$ 으로 최소화된다. 대가는 순전파를 세그먼트 안에서 한 번 더 도는 것뿐이라, 실측으로는 실행 시간이 약 30% 늘어나는 정도다.'},
 {h:'극단적으로는 O(log n)까지도 가능하다',
  lead:'재계산을 재귀적으로 한 번 더 적용하면 메모리를 로그 스케일까지 낮출 수 있다.',
  d:'세그먼트 안에서 또 재귀적으로 재계산을 적용하면(재계산의 재계산), 메모리 비용을 $O(\\log n)$ 까지 낮출 수 있음을 보인다. 다만 대가로 순전파 비용이 $O(n\\log n)$ 으로 늘어나 실용적이지는 않다고 저자들도 인정한다 — 실제 실험은 전부 $O(\\sqrt{n})$ 버전으로 이뤄졌다.'},
 {h:'프레임워크가 갖춰야 할 인터페이스로 제안',
  lead:'특정 라이브러리 트릭이 아니라 계산 그래프 위의 일반 알고리즘으로 정식화한다.',
  d:'이 아이디어를 MXNet 위에 구현해 사용자가 그래프에 `mirror` 속성을 지정하면 자동으로 재계산 계획을 짜 주는 형태로 제공했다. 특정 아키텍처 전용 트릭이 아니라 **어떤 계산 그래프에도 적용되는 일반 기법**으로 제시한 것이 이후 딥러닝 프레임워크들이 이를 표준 옵션(`torch.utils.checkpoint` 등)으로 흡수하게 만든 핵심이다.'}
],

diagram:{type:'compare', cap:'표준 backprop과 sublinear 재계산의 메모리-연산 트레이드오프.',
 left:{t:'표준 backprop', items:['모든 층 활성값을 순전파 내내 보관','메모리 O(n), 역전파는 저장값만 사용','n이 크면 GPU 메모리에 바로 부딪힘']},
 right:{t:'재계산(checkpointing)', items:['세그먼트 경계 √n개만 보관','역전파 때 세그먼트 내부를 다시 순전파','메모리 O(√n), 순전파 약 2배·시간 +30%']}
},

math:[
 {expr:'cost-total = max_i cost-of-segment(i) + O(k) = O(n/k) + O(k)',
  tex:'\\text{cost-total}=\\max_{i=1,\\dots,k}\\text{cost-of-segment}(i)+O(k)=O\\!\\left(\\frac{n}{k}\\right)+O(k)',
  d:'`n`층을 `k`개 세그먼트로 나눴을 때의 총 메모리 비용. 첫 항은 한 세그먼트를 역전파하는 데 필요한 메모리, 둘째 항은 세그먼트 경계값을 저장하는 비용이다.'},
 {expr:'k = √n  →  cost-total = O(2√n)',
  tex:'k=\\sqrt{n}\\ \\Longrightarrow\\ \\text{cost-total}=O(2\\sqrt{n})',
  d:'두 항이 같아지는 지점이 최소값이다. 세그먼트를 √n개로, 세그먼트 크기도 √n으로 맞추면 메모리가 $O(\\sqrt{n})$ 로 떨어진다.'},
 {expr:'g(n) = log2(n)  (k=1일 때, 재귀 적용의 극단)',
  tex:'g(n)=\\log_2 n\\quad(\\text{재귀적 재계산의 극단, }k=1)',
  d:'재계산을 재귀적으로 한 번 더 적용하면 메모리를 $O(\\log n)$ 까지 낮출 수 있지만, 순전파 비용이 $O(n\\log n)$ 으로 늘어 논문도 "일반적으로는 안 쓸 것"이라 밝힌다.'}
],

numbers:[
 {k:'1000층 ResNet 메모리', v:'48GB → 7GB', d:'ImageNet 학습 기준, 활성값만 계산한 수치(파라미터·연산 임시 메모리 제외)'},
 {k:'기본 메모리 절감(inplace+sharing)', v:'2~3배', d:'재계산 없이 그래프 분석만으로 얻는 절감'},
 {k:'재계산 추가 절감(sublinear plan)', v:'LSTM 기준 4배 이상', d:'그래프 최적화된 plan 대비 sublinear plan의 추가 절감'},
 {k:'런타임 오버헤드', v:'약 +30%', d:'Titan X GPU, 20배치 실측 — 순전파를 세그먼트마다 한 번 더 도는 대가'},
 {k:'복잡도', v:'O(√n) 메모리 · O(2n) 연산', d:'극단적으로는 O(log n) 메모리 · O(n log n) 연산까지(비실용적)'}
],

impact:'"메모리가 부족하면 배치를 줄이거나 모델을 줄인다"는 통념 대신, **연산을 조금 더 쓰고 메모리를 사는** 선택지를 표준화했다. 저자들이 MXNet 위에 구현한 이 아이디어는 이후 PyTorch의 `torch.utils.checkpoint`, TensorFlow의 `tf.recompute_grad`로 각 프레임워크에 내장됐다. [ZeRO](#/p/zero)의 activation 재계산 옵션, [QLoRA](#/p/qlora) 등 제한된 GPU 메모리로 큰 모델을 학습·미세조정하는 모든 파이프라인이 이 트릭을 기본값처럼 깔고 간다.',

legacy:[
 '**프레임워크 표준 기능화** — `torch.utils.checkpoint`, `tf.recompute_grad`로 흡수되어 옵션 하나로 켜는 기능이 됨',
 '**대규모 분산학습과 결합** — [ZeRO](#/p/zero) 등 메모리 최적화 시스템이 activation checkpointing을 파티셔닝과 나란히 기본 구성요소로 채택',
 '**PEFT/QLoRA 시대의 전제** — 제한된 GPU 한 대로 거대 모델을 미세조정하는 [QLoRA](#/p/qlora) 류 레시피에서도 그레디언트 체크포인팅이 기본 설정으로 들어감',
 '**"메모리 vs 연산" 트레이드오프의 원형** — 이후 FlashAttention의 재계산 전략 등 "다시 계산하는 게 저장보다 싸다"는 사고방식의 초기 사례'
],

pitfalls:[
 '**"공짜로 메모리를 아낀다"가 아니다.** 순전파를 세그먼트 안에서 다시 돌리는 비용이 실측으로 약 30% 추가 시간이며, 세그먼트를 잘못 나누면 오버헤드가 더 커진다.',
 '**O(log n) 버전은 이론적 극단이지 실용 레시피가 아니다.** 논문 자체가 순전파 비용이 $O(n\\log n)$ 이라 "일반적으로 쓰이지 않을 것"이라 명시했다. 실험은 전부 $O(\\sqrt{n})$ 버전으로만 이뤄졌다.',
 '**activation checkpointing은 [ZeRO](#/p/zero)의 파라미터/옵티마이저 상태 파티셔닝과 별개 기법이다.** 둘 다 메모리를 줄이지만 대상이 다르며(활성값 vs 파라미터), 실무에서는 둘을 함께 켠다.'
],

figures:[
 {f:'fig1-graph.png',
  cap:'가운데가 표준 backprop의 계산 그래프(회색 상자마다 별도 메모리). 오른쪽이 색으로 표시된 메모리 할당 계획 — 같은 색 상자는 메모리를 공유한다. 노란/빨강 쌍이 inplace 재사용, 점선 화살표가 sharing(수명이 끝난 노드의 메모리를 다른 노드가 재활용)의 예다. 이것이 재계산 이전에 그래프 분석만으로 얻는 절감(2~3배)이다.',
  src:'원문 Figure 1, p.3'},
 {f:'fig5-memory.png',
  cap:'왼쪽(a): x축이 ResNet 층 수, y축이 활성값 메모리(GB, 로그 스케일). 위쪽 점선(no optimization)은 기울기가 1인 직선 — O(n)이 그대로 보인다. 맨 아래 파란 선(sublinear plan)만 기울기가 완만해지는데, 이것이 O(√n)의 시각적 증거다. 오른쪽(b)은 같은 경향이 실제 GPU 메모리 측정치(nvidia-smi)에서도 재현됨을 보여준다.',
  src:'원문 Figure 5, p.9'}
],

quotes:[
 {t:'We design an algorithm that costs O(√n) memory to train a n layer network, with only the computational cost of an extra forward pass per mini-batch.',
  src:'Abstract, p.1'},
 {t:'By paying the small price, we are now able to train a much wider range of deep learning models.',
  src:'Section 5.4, p.9'}
],

links:[
 {t:'arXiv 1604.06174 — Training Deep Nets with Sublinear Memory Cost', u:'https://arxiv.org/abs/1604.06174'},
 {t:'PyTorch torch.utils.checkpoint 문서', u:'https://pytorch.org/docs/stable/checkpoint.html'}
]
});
