WIKI.paper({
slug:'openvla',
venue:'CoRL 2024',
authors:'Kim, Pertsch, Karamcheti et al. (Stanford · UC Berkeley · Toyota Research Institute · Google DeepMind · Physical Intelligence)',
arxiv:'2406.09246',

tldr:'가중치·데이터·코드를 전부 공개한 7B VLA. Open X-Embodiment 97만 에피소드로 학습해 55B [RT-2](#/p/rt2)-X를 절대 성공률 16.5%p 앞섰고, [LoRA](#/p/lora)와 양자화로 소비자 GPU에서 파인튜닝·서빙이 가능함을 보였다.',

context:'[RT-2](#/p/rt2)가 웹 규모 VLM을 행동 토큰 출력기로 개조할 수 있음을 증명했지만, RT-2와 RT-2-X는 가중치도 학습 코드도 공개하지 않는 **closed** 모델이었다. 로봇 학계가 이 레시피를 검증하거나 개선하려 해도 재현할 방법이 없었고, Octo 같은 오픈소스 대안은 사전학습된 언어모델·비전 인코더를 처음부터 붙여 학습시키는 방식이라 인터넷 지식의 전이가 제한적이었다. 또 기존 VLA 연구는 새 로봇에 맞춰 이 거대 모델을 어떻게 값싸게 재학습시킬지를 다루지 않았다 — 전체 파인튜닝은 A100 여러 장과 수십 시간을 요구해, 개인 연구자나 작은 랩이 VLA를 실제로 자기 로봇에 적용하기 어려웠다. OpenVLA는 이 두 문제 — **폐쇄성**과 **파인튜닝 비용** — 를 동시에 겨냥한다.',

ideas:[
 {h:'완전 오픈소스 VLA',
  lead:'가중치·970k 학습 데이터·PyTorch 학습 코드를 모두 공개해 재현과 개조를 가능하게 했다.',
  d:'HuggingFace `AutoModel`로 바로 불러쓸 수 있는 형태로 체크포인트를 배포하고, 학습에 쓴 Open X-Embodiment 데이터 믹스처와 학습 파이프라인 코드까지 공개했다. RT-2-X가 "결과만 발표"였다면 OpenVLA는 "과정 전체를 검증 가능하게" 만든 것이 핵심 차별점이다.'},
 {h:'DINOv2 + SigLIP 융합 비전 인코더',
  lead:'공간 정보에 강한 DINOv2와 의미 정보에 강한 SigLIP 특징을 이어붙여 시각 입력을 표현한다.',
  d:'[CLIP](#/p/clip)류의 단일 대조학습 인코더는 고수준 의미는 잘 잡지만 공간적 정확도(물체 위치·자세)에는 약하다. Prismatic VLM의 설계를 따라 DINOv2(공간)와 SigLIP(의미) 두 인코더의 패치 특징을 concat해 language embedding 공간으로 투영하는 "patch-as-token" 방식을 쓴다. 이 융합이 특히 다중 물체·언어 그라운딩이 필요한 과제에서 성능을 끌어올렸다.'},
 {h:'Llama 2 7B 백본에 행동을 토큰으로 이식',
  lead:'RT-2와 같은 256-bin 이산화를 쓰되, Llama 토크나이저의 최소 사용 256개 토큰을 행동 토큰으로 덮어쓴다.',
  d:'연속 행동 각 차원을 학습 데이터의 1~99 분위수 구간에서 256개 bin으로 균등 이산화한다. min-max 대신 분위수를 쓴 것이 [RT-2](#/p/rt2)와의 작은 차이인데, 이상치 행동이 구간 폭을 왜곡해 유효 해상도를 떨어뜨리는 문제를 줄인다. Llama 토크나이저는 새 토큰용 특수 슬롯이 100개뿐이라 256개가 부족하므로, 가장 적게 쓰이는 기존 어휘 256개를 그대로 행동 토큰 자리로 재활용한다.'},
 {h:'LoRA로 소비자 GPU 파인튜닝',
  lead:'전체 파라미터의 1.4%만 학습하는 LoRA가 전체 파인튜닝과 동등한 성능을 낸다.',
  d:'last-layer-only, frozen-vision, sandwich fine-tuning 등 여러 효율화 전략을 비교한 결과, rank 32 LoRA가 전체 파인튜닝(69.7%)과 거의 같은 성공률(68.2%)을 단 1.4% 파라미터 학습으로 달성했다. 이는 A100 1장으로 10~15시간 만에 새 작업에 적응시킬 수 있다는 뜻이며, 전체 파인튜닝 대비 **약 8배** 연산 절감이다.'},
 {h:'4-bit 양자화로 추론 메모리 절반 이하',
  lead:'4-bit 양자화가 정확도 손실 없이 메모리를 절반 이하로 줄이고 처리 속도까지 높인다.',
  d:'bfloat16 서빙은 16.8GB VRAM이 필요해 소비자 GPU에 부담이지만, int4 양자화는 7.0GB로 줄이면서 성공률(71.9%)이 bfloat16(71.3%)과 사실상 동일했다. 반면 int8은 양자화 연산 오버헤드로 오히려 속도가 떨어져 1.2Hz까지 낮아지고 성공률도 58.1%로 하락한다 — "낮은 정밀도 = 항상 빠름"이 아니라는 반례다.'}
],

diagram:{type:'stack', cap:'DINOv2·SigLIP 융합 인코더가 패치 토큰을 만들고, Llama 2 7B가 그 토큰과 언어 지시문을 받아 행동 토큰을 자기회귀로 예측한다.',
 layers:[
  {t:'이미지 입력', s:'로봇 카메라 관측'},
  {t:'DINOv2 인코더', s:'공간 특징'},
  {t:'SigLIP 인코더', s:'의미 특징', note:'두 특징을 concat'},
  {t:'프로젝터', s:'→ LLM 임베딩 차원'},
  {t:'Llama 2 7B', s:'자기회귀 디코더', acc:true, note:'다음 토큰 예측'},
  {t:'행동 토큰', s:'256bin × N차원'}
 ]},

math:[
 {expr:'bin_i = quantize( (a_i - q1_i) / (q99_i - q1_i) × 255 ), i번째 차원을 1~99분위 구간에서 이산화',
  tex:'a_i^{\\text{tok}} = \\left\\lfloor 255 \\cdot \\frac{a_i - Q_{1\\%}(a_i)}{Q_{99\\%}(a_i) - Q_{1\\%}(a_i)} \\right\\rfloor',
  d:'[RT-2](#/p/rt2)의 min-max 이산화 대신 1~99 분위수를 경계로 쓴다. 이상치 행동 몇 개가 전체 구간을 넓혀 나머지 정상 행동들의 유효 해상도를 낮추는 문제를 줄이는 실용적 수정이다.'}
],

numbers:[
 {k:'학습 데이터', v:'970k 로봇 에피소드', d:'Open X-Embodiment 기반, RT-2-X의 350k보다 큼'},
 {k:'모델 크기', v:'7B (Llama 2 backbone)', d:'RT-2-X(55B) 대비 **7배 작음**'},
 {k:'29개 과제 평균 성공률', v:'RT-2-X 대비 +16.5%p', d:'여러 로봇 embodiment에 걸친 절대 성공률 개선'},
 {k:'LoRA 파인튜닝', v:'파라미터 1.4%만 학습, 성공률 68.2%', d:'전체 파인튜닝 69.7%와 사실상 동등, 연산 **약 1/8**'},
 {k:'4-bit 양자화 성공률', v:'71.9% (VRAM 7.0GB)', d:'bfloat16 71.3%(16.8GB)와 동등하거나 근소 우세'},
 {k:'bfloat16 추론 속도', v:'약 6Hz (RTX 4090, 배치 압축 없음)', d:'컴파일·추측 디코딩 등 추가 최적화 미적용 상태'}
],

impact:'OpenVLA는 VLA를 "구글·딥마인드만 학습·평가할 수 있는 모델"에서 "누구나 내려받아 자기 로봇에 파인튜닝할 수 있는 체크포인트"로 바꿨다. 특히 LoRA·양자화 조합이 실제로 성능 손실 없이 작동함을 보여, 로봇공학자가 아닌 개인 개발자도 VLA를 실험할 수 있는 문턱을 낮췄다. 이후 다수의 오픈 VLA·파인튜닝 연구가 OpenVLA 체크포인트를 기본 출발점으로 삼는다.',

legacy:[
 '**오픈 VLA 생태계의 기준점 확립** — 이후 로봇 VLA 논문 다수가 baseline이자 파인튜닝 출발점으로 OpenVLA 체크포인트를 사용',
 '**PEFT가 VLA 표준 관행이 됨** — LoRA rank 32 기본값이 이후 VLA 파인튜닝 레시피에서 흔히 재사용됨',
 '**연속 행동 생성으로의 전환을 촉발** — 256bin 이산화의 한계(저빈도·저해상도 행동)가 [π0](#/p/pi0)의 flow matching 기반 연속 행동 생성으로 이어지는 배경이 됨',
 '**데이터 큐레이션의 중요성 부각** — 같은 Open X-Embodiment 기반이어도 정제 방식(이상치 제거, quantile 이산화)이 성능을 크게 좌우한다는 것을 실증'
],

pitfalls:[
 '**"7B가 55B를 이겼다"는 전 과제 우위가 아니다.** 논문 스스로 밝히듯 RT-2-X는 의미적 일반화(semantic generalization) 과제에서 여전히 더 강했다 — OpenVLA의 우위는 BridgeData V2 등 특정 벤치마크·과제군에 한정된다.',
 '**8-bit 양자화가 4-bit보다 항상 나은 것은 아니다.** 양자화 연산 자체의 오버헤드 때문에 int8이 오히려 int4보다 느려지고 성능도 떨어지는 역전 현상이 실측됐다 — "비트 수가 낮을수록 무조건 빠르다"는 가정은 틀리기 쉽다.',
 '**단일 이미지 입력만 지원.** 논문이 스스로 명시한 한계로, 여러 카메라 뷰나 과거 프레임 히스토리를 쓰는 설정에는 추가 작업 없이 적용할 수 없다.'
],

figures:[
 {f:'fig1-overview.png',
  cap:'왼쪽 970k 로봇 에피소드가 가운데 OpenVLA(Llama 2 7B + ViT)를 파인튜닝하고, 오른쪽처럼 자연어 지시("Wipe the table")에 대해 [Δx, Δθ, ΔGrip] 행동을 직접 출력해 폐루프 제어를 수행한다. 아래쪽은 여러 로봇 종류에 즉시 적용되는 것과 데이터·가중치·코드가 모두 공개됨을 보여준다.',
  src:'원문 Figure 1, p.1'},
 {f:'fig4-google-robot-results.png',
  cap:'세 그룹(Average / In-Distribution / OOD Generalization)에서 초록(RT-2-X)과 빨강(OpenVLA)이 파랑(RT-1-X)·주황(Octo)을 큰 차이로 앞선다. In-Distribution에서는 OpenVLA가 RT-2-X를 앞서지만 OOD Generalization에서는 RT-2-X가 더 높다는 점이 두 모델의 강점이 다름을 보여준다.',
  src:'원문 Figure 4, p.8'}
],

quotes:[
 {t:'OpenVLA demonstrates strong results for generalist manipulation, outperforming closed models such as RT-2-X (55B) by 16.5% in absolute task success rate across 29 tasks and multiple robot embodiments, with 7x fewer parameters.',
  src:'Abstract, p.1'},
 {t:'We find that the LoRA rank has negligible effect on policy performance and thus recommend using a default rank of r = 32.',
  src:'Section 5.3, p.9'}
],

links:[
 {t:'arXiv 2406.09246 — OpenVLA', u:'https://arxiv.org/abs/2406.09246'},
 {t:'프로젝트 페이지 · 체크포인트', u:'https://openvla.github.io'}
]
});
