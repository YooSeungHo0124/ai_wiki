WIKI.paper({
slug:'slowfast',
venue:'ICCV 2019',
authors:'Feichtenhofer, Fan, Malik, He (Facebook AI Research)',
arxiv:'1812.03982',

tldr:'하나의 RGB 비디오를 낮은 프레임률·많은 채널의 **Slow 경로**(무엇이 있는지)와 높은 프레임률·적은 채널의 **Fast 경로**(어떻게 움직이는지)로 비대칭 분리해 lateral connection으로 묶은 구조. [Two-Stream](#/p/two-stream)/[I3D](#/p/i3d)가 계속 의존하던 **optical flow를 완전히 없애고**, 순수 3D CNN 두 경로만으로 비슷하거나 더 나은 정확도를 end-to-end로 얻는다.',

context:'[I3D](#/p/i3d)는 2D 필터를 3D로 부풀리는 아이디어로 시공간 학습의 문을 열었지만, 여전히 RGB 스트림 하나만으로는 부족해 **optical flow 스트림을 별도로 계산해 붙여야** 최고 성능이 나왔다. optical flow는 TV-L1 같은 손으로 설계한 반복 최적화 알고리즘의 출력이라 end-to-end 학습이 아니고, 계산 비용도 커서 two-stream 구조는 추론 비용이 거의 두 배가 된다. 저자들은 여기서 다른 질문을 던진다 — flow가 주는 것이 정말 "별도의 모달리티"인가, 아니면 **같은 RGB 신호를 다른 시간 해상도로 보는 것**만으로도 대체할 수 있는가? 영장류 망막의 P-cell(공간 디테일에 민감, 저속 반응)과 M-cell(공간 디테일엔 둔감, 고속 반응) 이중 구조에서 착안해, 이 질문에 "RGB만으로도 된다"고 답한다.',

ideas:[
 {h:'Slow 경로 — 느리지만 채널이 두터운 의미 인식기',
  lead:'낮은 프레임률로 샘플링해 공간적 의미(무엇이 보이는지)를 담당한다.',
  d:'64프레임 원본 클립에서 성긴 간격으로 $T$ 프레임만 뽑아(전형적으로 $\\tau=16$, 즉 16프레임마다 1장) 3D ResNet에 넣는다. 프레임 수는 적지만 채널 수(공간 표현력)는 많이 유지해, "사람"·"공"처럼 시간에 걸쳐 거의 변하지 않는 카테고리 정보를 깊게 인식한다.',
  },
 {h:'Fast 경로 — 빠르지만 가벼운 움직임 인식기',
  lead:'Slow보다 α배 많은 프레임을, 채널은 β배(보통 1/8)로 줄여서 처리한다.',
  d:'같은 클립에서 Slow보다 $\\alpha$ 배 촘촘하게(기본값 $\\alpha{=}8$) 프레임을 뽑되, 채널 수는 $\\beta{=}1/8$ 로 크게 줄인 얇은 3D ResNet에 넣는다. 채널이 적어 공간 디테일은 거의 표현하지 못하지만, 프레임이 촘촘해 손이 흔들리는지 발이 구르는지 같은 **빠른 시간 변화**를 잡아낸다. 전체 연산의 약 20%만 차지할 만큼 가볍다.'},
 {h:'Lateral connection — Fast의 정보를 Slow에 주입',
  lead:'매 단계마다 Fast 경로의 시간 정보를 채널 방향으로 접어 Slow 경로에 더한다.',
  d:'두 경로는 시간 차원의 크기가 달라(Fast가 $\\alpha$ 배 더 촘촘) 그대로 합칠 수 없다. Fast 경로의 특징을 시간-스트라이드 conv 등으로 변환해 채널 수를 $\\alpha\\beta C$ 로 맞춘 뒤 `pool1, res2, res3, res4` 네 지점에서 Slow 경로에 단방향(Fast→Slow)으로 주입한다. Slow→Fast 역방향 연결은 시도하지 않았다 — Fast는 저수준 시간 신호만 다루면 충분하다는 설계.'},
 {h:'채널 비율 β가 핵심 설계 변수',
  lead:'β를 1/32까지 줄여도 Slow-only보다 항상 낫고, 1/6~1/8에서 최적이다.',
  d:'Fast 경로의 채널 비율 $\\beta$ 를 1/32부터 1/4까지 바꿔가며 실험한 결과, 모든 값에서 Slow 단독보다 나았고 최적은 $\\beta{=}1/6$~$1/8$ 부근이었다. $\\beta{=}1/32$ 처럼 극단적으로 얇게 만들어도(연산량 +5%) 1.6%p 향상이 나온다는 사실은, Fast 경로가 필요로 하는 것이 "많은 채널"이 아니라 "많은 시간 샘플"임을 보여준다.'},
 {h:'optical flow 없이 end-to-end 학습',
  lead:'flow 계산이 아예 파이프라인에서 빠져, 전체가 순수 RGB만으로 한 번에 학습된다.',
  d:'Fast 경로 입력을 grayscale·시간 차분·실제 optical flow 등으로 바꿔보는 ablation에서도 RGB 입력이 가장 낫거나 그에 준했다(표 5c). 이는 Fast 경로가 이미 "flow와 비슷한 역할"을 스스로 학습한다는 뜻이며, 별도의 flow 계산·저장·비동기 학습이라는 [Two-Stream](#/p/two-stream)/[I3D](#/p/i3d)의 병목을 근본적으로 제거한다.'}
],

diagram:{type:'compare', cap:'I3D까지 이어지던 "RGB 스트림 + flow 스트림" 이중 구조를 "RGB 두 경로(느림/빠름)"로 바꾼 것이 SlowFast의 핵심.',
 left:{t:'I3D (RGB + Flow)', items:['RGB 스트림: 3D-inflated CNN','Flow 스트림: 3D-inflated CNN','flow는 TV-L1 사전계산, 비-end-to-end']},
 right:{t:'SlowFast (RGB만)', items:['Slow 경로: 저프레임률·고채널','Fast 경로: 고프레임률·저채널(β)','lateral connection으로 단방향 융합']}},

math:[
 {expr:'Slow: T frames at stride τ.  Fast: αT frames, channel width βC (β≈1/8, α≈8)',
  tex:'\\text{Slow: } T \\text{ frames}, \\text{stride } \\tau \\qquad \\text{Fast: } \\alpha T \\text{ frames}, \\text{width } \\beta C\\ (\\beta\\approx\\tfrac{1}{8},\\ \\alpha\\approx 8)',
  d:'Slow 경로는 원본 클립에서 $\\tau$ 프레임마다 하나씩 골라 총 $T$ 프레임을 쓰고, Fast 경로는 같은 구간에서 $\\alpha$ 배 촘촘히 $\\alpha T$ 프레임을 쓰되 채널 폭은 $\\beta C$ 로 줄인다. $\\alpha,\\beta$ 는 각각 시간 해상도와 채널 용량을 맞바꾸는 트레이드오프 손잡이다.'}
],

numbers:[
 {k:'Kinetics-400 top-1 (SlowFast 16×8, R101+NL)', v:'79.8%', d:'표 2, 당시 SOTA — I3D(71.6%)를 큰 차이로 상회'},
 {k:'AVA v2.1 mAP (SlowFast, +NL, Kinetics-600)', v:'27.3', d:'표 7, I3D+flow(15.6) 대비 큰 향상, flow 없이 달성'},
 {k:'Fast 경로 전용 연산 비중', v:'약 20%', d:'Fast 경로가 채널을 줄인 덕에 전체 FLOPs의 일부만 차지'},
 {k:'채널 비율 β 최적값', v:'1/6 ~ 1/8', d:'표 5b, β=1/32까지 줄여도 Slow-only보다 항상 우수'},
 {k:'lateral connection 유무 효과', v:'72.6% → 75.6%', d:'표 5a, Slow-only 대비 T-conv 방식 lateral 연결 시 top-1 +3.0%p'},
 {k:'Fast 입력을 실제 optical flow로 교체', v:'73.8%', d:'표 5c, RGB 입력(75.6%)보다 오히려 낮음 — flow가 필수가 아님을 시사'}
],

impact:'비디오 인식에서 optical flow라는 "손으로 만든 모달리티"를 완전히 걷어내고도 더 나은 정확도를 낼 수 있음을 보여, 이후 비디오 백본 설계의 기본 전제를 바꿨다. 동시에 "시간 해상도와 채널 용량은 서로 다른 자원이며 분리해서 배분할 수 있다"는 관찰은 이후 다양한 멀티-경로/멀티-해상도 비디오·이미지 아키텍처 설계에 재사용되는 일반적인 설계 원칙이 됐다. Kinetics·AVA·Charades 세 벤치마크 모두에서 동시에 SOTA를 갱신하며, "느림/빠름 분리"가 특정 데이터셋에 국한된 트릭이 아님을 보였다.',

legacy:[
 '**optical flow 시대의 사실상 종료** — 이후 비디오 인식 논문 다수가 flow 스트림 없이 순수 RGB 3D/attention 백본만으로 설계됨',
 '**시공간 attention으로의 전환** — [TimeSformer](#/p/timesformer)는 SlowFast의 3D conv 대신 [ViT](#/p/vit) 스타일 self-attention으로 같은 문제(시공간 정보를 어떻게 효율적으로 섞을지)에 접근',
 '**AVA 행동 탐지 벤치마크의 강력한 베이스라인 정착** — 이후 시공간 행동 탐지 연구 다수가 SlowFast를 기본 백본으로 채택',
 '**비대칭 다중 경로 설계 원칙의 확산** — "해상도/용량이 다른 여러 경로를 병렬로 두고 lateral하게 섞는다"는 아이디어가 이후 다른 시공간·다중 스케일 아키텍처 설계에도 영향을 줌'
],

pitfalls:[
 '**"Fast 경로가 움직임을, Slow 경로가 의미를 각각 전담한다"는 편의적 서술이지 엄밀한 분리는 아니다.** 둘 다 RGB를 보는 3D CNN이고 최종적으로 정보가 섞이므로, 두 경로가 정말 서로 다른 표상을 학습하는지는 ablation으로 간접 확인한 것이지 별도 지도(supervision)로 강제한 것이 아니다.',
 '**optical flow를 없앴다고 "움직임 계산이 공짜"가 된 것은 아니다.** Fast 경로가 고프레임률 입력을 받는 만큼 여전히 많은 프레임을 디코딩·로드해야 하고, 학습 자체는 32~64 GPU급 대규모 분산 환경을 전제로 설계됐다(원문 실험 세팅).',
 '**Kinetics류 벤치마크에서의 SOTA가 곧 "진짜 시간적 추론"을 뜻하지 않는다.** [I3D](#/p/i3d) 저자들도 지적했듯 Kinetics 클래스 다수는 배경·장면 정보만으로도 상당 부분 맞힐 수 있어(외형 편향), SlowFast의 향상분 중 일부는 여전히 공간 표현 개선에서 온 것일 수 있다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'위쪽 회색 프레임 4장이 Slow 경로(저프레임률, 채널 C 유지), 아래쪽 촘촘한 프레임들이 Fast 경로(αT 프레임, 채널 βC로 축소). 세로 화살표가 lateral connection으로, Fast의 특징을 Slow 쪽에 단방향으로 주입한 뒤 마지막에 합쳐 prediction을 낸다.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'Our model involves (i) a Slow pathway, operating at low frame rate, to capture spatial semantics, and (ii) a Fast pathway, operating at high frame rate, to capture motion at fine temporal resolution.',
  src:'Abstract, p.1'},
 {t:'Our method does not compute optical flow, and therefore, our models are learned end-to-end from the raw data.',
  src:'Section 2, p.2'}
],

links:[
 {t:'arXiv 1812.03982 — SlowFast Networks for Video Recognition', u:'https://arxiv.org/abs/1812.03982'},
 {t:'facebookresearch/SlowFast (공식 코드)', u:'https://github.com/facebookresearch/SlowFast'}
]
});
