WIKI.paper({
slug:'yolov9',
venue:'arXiv 2024 (ECCV 2024)',
authors:'Wang, Yeh & Liao (Academia Sinica · NTUT · Chung Yuan Christian Univ.)',
arxiv:'2402.13616',

tldr:'깊은 네트워크는 순전파를 거치며 예측에 필요한 정보를 조금씩 잃는다는 **[정보 병목](#/p/information-bottleneck)** 문제를 정면으로 다루고, 추론 비용 없이 "더 신뢰할 수 있는 gradient"를 주입하는 **PGI**와 이를 얹을 경량 백본 **GELAN**을 제안해 학습 비용 대비 정확도에서 당시 모든 train-from-scratch 검출기를 앞섰다.',

context:'2022~2023년의 실시간 검출기들([YOLOv7](#/p/yolov7), YOLOv8, DAMO-YOLO 등)은 이미 재파라미터화·비anchor 헤드 등 아키텍처 트릭을 거의 소진한 상태였다. 저자들은 다른 각도에서 문제를 본다. 네트워크가 깊어질수록 각 층의 변환 $f_\\theta$ 를 거치며 원본 데이터 $X$ 와의 상호정보량이 단조 감소한다는 **정보 병목** 원리를 데이터에 적용하면, 깊은 층에서 계산된 손실은 이미 손실된 정보 위에서 만들어진 부정확한 gradient로 역전파된다. 기존에 이 문제를 우회하는 방법은 두 갈래였다 — (1) 모델을 키워 파라미터 여유로 손실을 버티거나, (2) [RevCol](https://arxiv.org/abs/2212.11696) 같은 완전 가역(reversible) 아키텍처로 정보를 원리적으로 보존하는 것. 그런데 가역 구조를 추론에도 그대로 쓰면 연산량이 크게 늘고, 얕은 모델에서는 오히려 성능이 떨어진다. 즉 "정보를 안 잃는 것"과 "가볍고 빠른 것"이 정면으로 부딪히는 상태였다.',

ideas:[
 {h:'정보 병목을 gradient 신뢰도 문제로 재정식화',
  lead:'정보 손실 자체보다, 그 손실이 만드는 부정확한 gradient가 진짜 문제라고 본다.',
  d:'저자들은 $I(X,X) \\ge I(X,f_\\theta(X)) \\ge I(X,g_\\phi(f_\\theta(X)))$ 라는 정보 병목 부등식에서 출발해, 이를 예측 목표 $Y$ 에 대한 형태로 확장한다: $I(X,X) \\ge I(Y,X) \\ge I(Y,f_\\theta(X)) \\ge \\cdots \\ge I(Y,\\hat{Y})$. 깊은 층으로 갈수록 $I(Y,X)$ 를 지키기 어려워지고, 손실 함수는 이미 불완전한 정보 위에서 gradient를 계산하게 되어 학습이 불안정해진다는 것이다. 모델을 키우는 것은 이 부등식 자체를 없애지 못하는 임시방편일 뿐이라고 지적한다.'},
 {h:'PGI: 추론에는 없고 학습에만 존재하는 보조 gradient 경로',
  lead:'main branch는 그대로 두고, 학습 때만 붙는 auxiliary reversible branch로 신뢰할 gradient를 공급한다.',
  d:'Programmable Gradient Information(PGI)은 세 부분으로 구성된다 — (1) 추론에 실제 쓰이는 main branch, (2) 학습 때만 붙어 가역 변환으로 신뢰할 수 있는 gradient를 만들어 main branch에 역전파해 주는 auxiliary reversible branch, (3) 여러 예측 헤드의 gradient를 통합하는 multi-level auxiliary information. (2)는 추론 시 완전히 제거되므로 **추론 비용이 전혀 늘지 않는다** — RevCol처럼 가역 구조를 main branch 자체에 박아 넣으면 추론 시간이 최대 2배까지 늘어난다는 사실을 저자들이 직접 실험으로 확인했다.'},
 {h:'"가역"보다 중요한 건 "완전한 정보 매핑"',
  lead:'main branch가 원본 정보를 다 보존하도록 강제하지 않고, 유용한 gradient만 만들어 주도록 설계했다.',
  d:'RevCol의 가역 함수 $X = v_\\zeta(r_\\psi(X))$ 는 정보를 이론적으로 완전 보존하지만, 저경량 모델에서는 파라미터가 부족해 원본 데이터를 다 담을 그릇이 안 된다. PGI는 auxiliary branch가 매 층마다 완전한 원본을 복원하도록 강제하지 않고, 목표 $Y$ 로의 매핑에 필요한 gradient만 생성해 main branch를 갱신하도록 완화했다. 이 덕분에 얕고 가벼운 모델에도 같은 프레임워크를 적용할 수 있다.'},
 {h:'GELAN: CSPNet과 ELAN을 합쳐 "아무 블록이나" 끼우게 규격화',
  lead:'CSPNet의 gradient 경로 설계와 ELAN의 층 쌓기를 결합해 계산 블록을 자유롭게 교체 가능하게 만들었다.',
  d:'ELAN은 원래 합성곱 층만 순서대로 쌓는 구조였다. GELAN은 이를 CSPNet처럼 분기(split)-계산-합류(concatenation) 구조로 감싸, `any block` 자리에 RepConv든 CSP 블록이든 임의의 연산을 꽂을 수 있게 일반화했다. 실험적으로는 depth-wise convolution 기반 설계(YOLO MS 등)보다 일반 convolution만으로 더 높은 파라미터 효율을 낸다.'},
 {h:'GELAN은 깊이에 둔감하다',
  lead:'ELAN/CSP 깊이를 바꿔도 파라미터-연산량-정확도가 선형 관계를 유지해 설계가 안정적이다.',
  d:'ablation에서 ELAN 깊이를 1→2로 늘리면 정확도가 크게 오르지만, 2 이상부터는 깊이를 얼마로 두든 파라미터·FLOPs·AP가 예측 가능한 선형 관계를 그린다. 즉 특정 깊이 조합을 조심스레 튜닝할 필요 없이 목표 연산량에 맞춰 아무 지점이나 골라도 안정적인 성능이 나온다는 뜻이다.'}
],

diagram:{type:'split', cap:'main branch(추론용)는 그대로 두고, 학습 때만 auxiliary reversible branch를 붙여 gradient를 공급한다. 추론 시 오른쪽 갈래는 제거된다.',
 from:{t:'백본 특징', s:'main branch'},
 branches:[
  {t:'main branch', s:'추론에 사용', acc:true},
  {t:'보조 가역 갈래', s:'학습 때만 존재'},
  {t:'다단계 통합', s:'헤드별 gradient 합류', off:true}
 ],
 join:'추론 시 보조 갈래 전부 제거 — 비용 0'},

math:[
 {expr:'I(X,X) ≥ I(X, f_θ(X)) ≥ I(X, g_φ(f_θ(X))) ≥ ...',
  tex:'I(X,X) \\ge I(X,f_\\theta(X)) \\ge I(X,g_\\phi(f_\\theta(X))) \\ge \\cdots',
  d:'정보 병목의 기본 부등식(Eq. 1). $f,g$ 는 연속된 두 층의 변환이다. 층을 거칠 때마다 원본 $X$ 와의 상호정보량이 늘어날 수 없다는 뜻 — 딥러닝의 "깊이"가 공짜가 아니라는 정식화다.'},
 {expr:'I(X,X) ≥ I(Y,X) ≥ I(Y, f_θ(X)) ≥ ... ≥ I(Y, Ŷ)',
  tex:'I(X,X) \\ge I(Y,X) \\ge I(Y,f_\\theta(X)) \\ge \\cdots \\ge I(Y,\\hat{Y})',
  d:'논문이 실제로 쓰는 확장형(Eq. 6). 목표 $Y$ 를 넣어, 층을 거칠수록 예측에 쓸 수 있는 정보가 줄어드는 과정을 직접 겨냥한다. $I(Y,X)$ 자체는 $I(X,X)$ 의 작은 일부일 뿐이지만, 이 부분을 얼마나 지키느냐가 학습 품질을 좌우한다고 본다.'},
 {expr:'X = v_ζ(r_ψ(X))',
  tex:'X = v_{\\zeta}\\!\\left(r_{\\psi}(X)\\right)',
  d:'가역 함수의 정의(Eq. 2). $r$ 에 역함수 $v$ 가 존재하면 변환 후에도 정보 손실이 없다($I(X,X)=I(X,r_\\psi(X))$). PreAct ResNet의 $X^{l+1}=X^l+f_\\theta^{l+1}(X^l)$ 형태가 이 조건을 만족하는 예다.'}
],

numbers:[
 {k:'YOLOv9-C vs YOLOv7 AF', v:'AP 53.0% 동일, 파라미터 -42%', d:'25.3M/102.1G(YOLOv9-C) vs 43.6M/130.5G(YOLOv7 AF) — 같은 AP를 42% 적은 파라미터·22% 적은 FLOPs로 달성 (COCO val, train-from-scratch, 500 epoch)'},
 {k:'YOLOv9-E vs YOLOv8-X', v:'AP 55.6% (+1.7%p)', d:'57.3M/189.0G(YOLOv9-E) vs 68.2M/257.8G(YOLOv8-X) — 파라미터 16%·연산량 27% 적으면서 AP는 오히려 높다'},
 {k:'GELAN(PGI 없이)', v:'AP 52.5% (GELAN-C)', d:'같은 백본에 PGI만 추가하면 YOLOv9-C는 53.0%로 +0.5%p — PGI 단독 기여분'},
 {k:'YOLOv9-S', v:'AP 46.8%, 7.1M / 26.4G', d:'경량급. RT DETR-R18(20M/60G, AP 46.5%)보다 3배 적은 파라미터로 근접한 정확도'},
 {k:'GELAN vs YOLOv8 (딥 모델)', v:'파라미터 -49%, 연산량 -43%, AP +0.6%p', d:'논문 결론부의 요약 수치(Sec. 6) — PGI+GELAN 조합의 전체 효과'}
],

impact:'YOLOv9는 "이미지넷 프리트레인 없이, 순수 train-from-scratch로 프리트레인 모델을 이긴다"는 것을 파라미터·FLOPs 대비 정확도 곡선으로 명확히 보여줬다. 정보 병목이라는 이론적 틀을 실시간 검출기 설계에 끌어들여, 이후 경량 검출기 설계가 "블록을 더 파자"에서 "gradient 경로를 어떻게 프로그래밍할까"로 한 축을 넓혔다. GELAN은 depth-wise convolution 없이도 파라미터 효율을 확보할 수 있음을 보여, 모바일이 아닌 GPU/서버 추론에서는 depth-wise가 항상 유리하지 않다는 근거를 남겼다.',

legacy:[
 '**[YOLOv10](#/p/yolov10)** — GELAN류의 효율적 블록 설계를 계승하면서 NMS 자체를 없애는 end-to-end 방향으로 나아감',
 '**auxiliary branch 설계 계열** — 학습 때만 존재하고 추론 비용이 0인 보조 경로라는 아이디어는 이후 경량 검출기의 학습 트릭으로 재사용됨',
 '**정보 병목 관점의 재유행** — 아키텍처 논문이 순수 공학적 트릭 대신 정보이론적 근거를 정식으로 앞세운 사례로 자주 인용됨',
 '**GPL-3.0 라이선스 논쟁** — Ultralytics 계열과 달리 GPL로 공개되어, 상용 임베딩 시 라이선스 검토가 별도로 필요하다는 실무적 흔적을 남김'
],

pitfalls:[
 '**이 논문에는 FPS·지연시간 수치가 전혀 없다.** Table 1·4와 Figure 5 전부 파라미터 수(M)와 FLOPs(G) 대비 AP만 비교하며, GPU 모델명·TensorRT·배치 크기 같은 실측 latency 조건은 어디에도 등장하지 않는다. "FLOPs가 적다 = 실제로 더 빠르다"로 바로 등치하면 안 된다 — 같은 FLOPs라도 메모리 접근 패턴·연산 종류에 따라 실제 GPU/엣지 지연시간 순위는 뒤집힐 수 있다.',
 '**PGI의 "gradient 정보"는 gradient 값 자체를 프로그래밍한다는 뜻이 아니다.** 실제로는 auxiliary reversible branch가 별도의 손실을 계산해 역전파 경로를 하나 더 만드는 것이며, 학습이 끝나면 그 갈래는 통째로 버려진다. "PGI가 추론 시에도 gradient를 계산해 뭔가 보정한다"는 식으로 오해하기 쉽다.',
 '**Table 1의 YOLOv9 수치는 전부 train-from-scratch·500 epoch·COCO 2017 기준이다.** ImageNet 프리트레인 모델(RT DETR 등)과 같은 표에 놓고 파라미터만 비교하는 Figure 5는 훈련 방식이 다른 모델을 나란히 비교한 것이므로, "학습 조건이 다른 SOTA를 이겼다"는 주장은 프리트레인 데이터 이점을 감안하고 읽어야 한다.'
],

figures:[
 {f:'fig3-pgi.png',
  cap:'왼쪽부터 (a) PAN, (b) RevCol, (c) 기존 deep supervision, (d) PGI. (a)의 주황 점선이 "정보 병목"이 실제로 생기는 지점, (b)의 노란 점선은 RevCol이 지불하는 "무거운 비용"이다. (d)에서 회색 상자(auxiliary branch)는 학습 때만 존재하고, 파란 main branch만 추론에 쓰인다.',
  src:'원문 Figure 3, p.5'},
 {f:'fig1-params-ap.png',
  cap:'x축이 파라미터 수(M), y축이 COCO AP. 빨간 선(YOLOv9/GELAN, train-from-scratch)이 왼쪽 위로 갈수록 다른 곡선보다 위에 있다는 것은 같은 파라미터 수에서 더 높은 AP를 낸다는 뜻 — ImageNet 프리트레인을 쓴 RT DETR(녹색)까지 파라미터 효율에서 앞선다.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'This paper will delve into the important issues of data loss when data is transmitted through deep networks, namely information bottleneck and reversible functions.',
  src:'Abstract, p.1'},
 {t:'Network deepening will cause information bottleneck, which will make the loss function unable to generate reliable gradients.',
  src:'Sec. 4.1, p.5'}
],

links:[
 {t:'arXiv 2402.13616 — YOLOv9', u:'https://arxiv.org/abs/2402.13616'},
 {t:'GitHub — WongKinYiu/yolov9', u:'https://github.com/WongKinYiu/yolov9'}
]
});
