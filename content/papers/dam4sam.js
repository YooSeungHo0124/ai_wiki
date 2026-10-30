WIKI.paper({
slug:'dam4sam',
venue:'CVPR 2025 (arXiv 2024)',
authors:'Videnovic, Lukezic, Kristan (Univ. of Ljubljana)',
arxiv:'2411.17576',

tldr:'[SAM 2](#/p/sam2)의 메모리를 "최근 모습(RAM)"과 "방해물 해소용 앵커(DRM)"로 기능별로 나누고, SAM 2가 이미 내놓는 대안 마스크를 이용해 방해물이 보이는 프레임만 앵커로 저장하도록 한 학습 없는 추적기 **SAM2.1++**. VOT2022 EAO를 0.692에서 0.753으로 올렸다.',

context:'메모리 기반 추적기는 최근 프레임과 마스크를 메모리에 쌓고 현재 프레임이 그 메모리를 어텐션으로 참조해 표적을 찾는다. SAM 2는 초기 프레임 1장과 최근 6프레임을 FIFO로 유지하며, 표적이 가려져 있는 동안에도 매 프레임 메모리를 갱신한다. 그 결과 짧은 가림에도 표적 없는 프레임이 메모리를 채우고, 표적을 못 찾아 빈 마스크가 들어가면 오류가 쌓인다. 표적과 닮은 영역(방해물)이 있는 장면이 추적 실패의 가장 큰 원인인데 기존 메모리 관리는 이를 명시적으로 다루지 않는다.',

ideas:[
 {h:'메모리를 기능별로 둘로 쪼갠다: RAM + DRM',
  lead:'정확한 분할은 최근 모습 메모리가, 방해물 구분은 앵커 메모리가 맡는다.',
  d:'RAM(Recent Appearance Memory)은 최근 표적 모습을 담는 FIFO로 시간 인코딩을 적용한다. DRM(Distractor-Resolving Memory)은 초기 프레임 1칸과 방해물이 정확히 분할된 앵커 프레임을 저장하는 FIFO이며 시간 인코딩을 쓰지 않는다. 방해물 구분 정보는 "얼마나 최근인가"와 무관한 시간 불문 사전 정보여야 한다는 이유다. 구성 요소는 SAM 2에 이미 있어 추가 학습이 필요 없다.'},
 {h:'표적이 없으면 갱신하지 않고, 매 5프레임만 갱신',
  lead:'예측 마스크가 비면 RAM을 건너뛰고, 연속 프레임의 중복을 피해 5프레임마다 갱신한다.',
  d:'SAM 2는 표적이 없어도 매 프레임 메모리를 갱신해 표적 모습의 다양성을 떨어뜨린다. SAM2.1++는 마스크가 비어 있으면 RAM을 갱신하지 않고, 갱신 간격을 $\\Delta=5$ 프레임으로 둔다. DiDi에서 "빈 마스크 시 갱신 안 함"만으로 Quality가 0.649에서 0.665로, 거기에 5프레임 간격을 더하면 0.667로 올랐다.'},
 {h:'대안 마스크로 방해물을 감지한다',
  lead:'SAM 2의 출력 마스크와 대안 마스크의 박스가 많이 어긋나면 그 프레임을 앵커 후보로 본다.',
  d:'SAM 2가 내놓는 세 마스크 중 선택되지 않은 대안 마스크가 방해물을 잡고 있는 경우가 많다는 예비 관찰에서 출발한다. 출력 마스크의 박스와, 출력 마스크 + 대안 마스크 최대 연결 성분을 합친 박스의 넓이 비가 $\\theta_{anc}=0.7$ 아래로 내려가면 그 프레임을 DRM 갱신 후보로 삼는다. 즉 "다른 해석이 따로 존재한다"는 발산 신호를 방해물 신호로 쓴다.'},
 {h:'추적이 안정적일 때만 앵커를 저장한다',
  lead:'예측 IoU가 높고 마스크 넓이가 안정적인 구간에서만 DRM을 갱신해 오염을 막는다.',
  d:'방해물이 감지되어도 표적 분할이 엉망이면 메모리가 오염된다. 그래서 예측 IoU가 $\\theta_{IoU}=0.8$ 을 넘고 마스크 넓이가 최근 $\\theta_M=10$ 프레임 중앙값의 $\\pm 20\\%$ 안에 있을 때만 앵커를 넣는다. 두 조건 중 하나만 쓴 변형은 Quality가 0.672(안정성만), 0.644(방해물 감지만)로 모두 완성형 0.694보다 낮았다.'}
],

diagram:{type:'compare', cap:'SAM 2의 단일 FIFO 메모리와 DAM의 기능 분리 메모리. DRM은 시간 인코딩 없이 앵커 프레임을 둔다.',
 left:{t:'SAM 2 메모리', items:['초기 프레임 + 최근 6프레임','FIFO로 매 프레임 갱신','표적이 없어도 갱신','방해물 전용 처리 없음']},
 right:{t:'DAM (SAM2.1++)', items:['RAM: 최근 모습 3칸','DRM: 초기 + 앵커 3칸','5프레임마다, 표적 있을 때만','대안 마스크 발산으로 앵커 선별']}},

math:[
 {expr:'area(box(out ∪ alt)) 대비 area(box(out)) < θ_anc = 0.7  →  DRM 갱신 후보',
  tex:'\\frac{\\text{area}\\big(\\text{box}(m_{out})\\big)}{\\text{area}\\big(\\text{box}(m_{out}\\cup m_{alt})\\big)}<\\theta_{anc}=0.7\;\\Rightarrow\;\\text{DRM update candidate}',
  d:'$m_{out}$ 은 선택된 출력 마스크, $m_{alt}$ 는 대안 마스크의 가장 큰 연결 성분이다. 둘의 합집합 박스가 출력 박스보다 훨씬 크면 SAM 2가 다른 후보 영역(방해물)을 따로 보고 있다는 뜻이다.'}
],

numbers:[
 {k:'DiDi · Quality / Accuracy / Robustness', v:'SAM2.1 0.649 / 0.720 / 0.887 → SAM2.1++ 0.694 / 0.727 / 0.944', d:'Table 1·2. 이득의 대부분은 robustness(실패가 줄어듦). SAMURAI는 0.680, SAM2.1Long은 0.646'},
 {k:'VOT2022 · EAO', v:'SAM2.1 0.692 → SAM2.1++ 0.753', d:'Table 4. 챌린지 우승 MS AOT는 0.673. VOT2020은 0.681 → 0.729(Table 3)'},
 {k:'VOTS2024 · Quality', v:'SAM2.1 0.661 → SAM2.1++ 0.711', d:'Table 5. 우승 S3-Track(0.722)에 이은 2위. 우승 트래커는 깊이 특징과 여러 큰 백본을 결합한 복잡한 구성'},
 {k:'박스 추적 · LaSOT AUC / LaSOText AUC / GOT-10k AO', v:'75.1 / 60.9 / 81.1', d:'Table 6. SAM2.1은 70.0 / 56.9 / 80.7. 마스크를 박스로 바꿔 평가'},
 {k:'DiDi 데이터셋', v:'180개 시퀀스, 평균 1.5k 프레임, 총 274,882 프레임', d:'GOT-10k·LaSOT·UTB180·VOT 시퀀스 808개에서 DINOv2 특징 유사도 기준으로 방해물이 많은 것을 추려 만들었다'},
 {k:'속도', v:'11 fps (SAM2.1은 13.3 fps)', d:'결론부. 약 20% 감소. 재학습 없이 고정 파라미터로 7개 벤치마크에 적용'}
],

impact:'DAM4SAM은 "방해물 문제는 더 큰 모델이나 복잡한 연관 모듈이 아니라 메모리를 무엇으로 채우는가의 문제"라는 관점을 제시했다. SAM 2가 이미 출력하는 대안 마스크와 IoU를 활용해, 재학습 없이 VOT2020·VOT2022에서 SAM 2.1을 넘고 VOTS2024에서 2위에 올랐다. 방해물이 많은 장면을 모은 DiDi 데이터셋도 함께 공개해, 기존 벤치마크가 포화되어 가려지는 방해물 대응 능력을 따로 측정하게 했다.',

legacy:[
 '**[SAMURAI](#/p/samurai)와 동시기 연구**: 둘 다 SAM 2.1 위에서 메모리 관리를 손보는 학습 없는 방법이다. 이 논문은 SAMURAI를 같은 시기의 미발표 연구로 보고 DiDi에서 0.694 대 0.680으로 비교한다',
 '**[SAM2Long](#/p/sam2long)과의 대비**: 긴 영상용 트리 메모리가 DiDi의 방해물 장면에서는 SAM2.1과 비슷하다는 비교 결과(0.646 대 0.649)를 제시한다',
 '**학습 가능한 메모리 관리 정책**: 결론에서 효율적인 메모리 설계와 학습 가능한 관리 정책을 후속 방향으로 제안한다'
],

pitfalls:[
 '**DRM은 방해물이 "있다"는 판정과 추적이 "안정적이다"는 판정이 모두 필요하다.** 방해물 감지만으로 갱신하면 오히려 정확도가 떨어진다(SAM2.1 DRM2: accuracy 0.691). 분할 오류가 증폭되기 때문이다.',
 '**DiDi는 저자가 직접 만든 데이터셋이라 SAM2.1++에 유리할 수 있다.** 방해물 위주로 추렸고 DINOv2 특징 기준이 선택 기준이다. 표준 벤치마크(VOT2022 EAO 0.753 등)와 함께 읽어야 한다.',
 '**박스 추적 수치는 마스크를 박스로 바꾼 값이다.** 첫 프레임 박스에서 SAM 2로 마스크를 만들고 min-max로 박스를 뽑는다. 논문은 LaSOT AUC 75.1이 LoRAT(75.1)과 같은 수준이라고 하면서, LoRAT은 LaSOT 학습 분할로 튜닝된 모델이라고 덧붙인다.'
],

figures:[
 {f:'fig2-memory.png',
  cap:'왼쪽이 SAM 2 메모리(초기 프레임 + 최근 6프레임 FIFO, 매 프레임 갱신), 오른쪽이 DAM이다. DAM은 DRM(초록 계열, 시간 인코딩 없음)과 RAM(연두)으로 나뉘고 메모리 관리 규칙이 어느 쪽을 언제 갱신할지 정한다. 두 쪽 모두 맨 왼쪽 Init 슬롯은 항상 고정이다.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'However, even for a very short occlusion, the memory will quickly fill up with frames without the target, which reduces the target appearance diversity in the model, leading to a reduced segmentation accuracy upon target re-appearance.',
  src:'Section 3.2.1, p.3'}
],

links:[
 {t:'arXiv 2411.17576 — DAM4SAM', u:'https://arxiv.org/abs/2411.17576'},
 {t:'GitHub — jovanavidenovic/DAM4SAM', u:'https://github.com/jovanavidenovic/DAM4SAM'}
]
});
