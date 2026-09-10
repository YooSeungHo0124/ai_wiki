WIKI.paper({
slug:'animatediff',
venue:'ICLR 2024',
authors:'Guo et al. (Shanghai AI Lab · CUHK · Stanford)',
arxiv:'2307.04725',

tldr:'`[LoRA](#/p/lora)`·DreamBooth로 개인화된 수많은 text-to-image 모델을 **재학습 없이** 애니메이션 생성기로 바꾸는 끼워 넣기형 모션 모듈. 얼린 T2I 이미지 레이어 위에 시간 축 전용 Transformer 하나만 추가해, 한 번 학습한 모션 모듈을 Civitai의 어떤 커스텀 SD 체크포인트에도 그대로 꽂을 수 있다.',

context:'2023년 초 Civitai·HuggingFace에는 `[DreamBooth](#/p/dreambooth)`나 `[LoRA](#/p/lora)`로 파인튜닝된 개인화 [Stable Diffusion](#/p/ldm) 체크포인트가 폭발적으로 쌓였지만, 이들은 전부 **정지 이미지**만 만들었다. 이런 개인화 모델 각각을 비디오 생성용으로 다시 학습시키는 것은 대부분의 아마추어 제작자에게 계산·데이터 비용이 감당 안 되는 일이다. 당시 비디오 생성 접근은 크게 두 갈래였다 — Tune-A-Video처럼 영상 한 편에 전체 파라미터를 파인튜닝하거나, Text2Video-Zero처럼 학습 없이 attention을 조작하는 방식인데, 둘 다 "이미 존재하는 수천 개의 개인화 T2I 각각에 모션을 붙인다"는 문제에는 맞지 않는다. 이 논문의 질문은 명확하다 — **모션 지식을 한 번만 학습해서, 어떤 개인화 T2I에도 꽂아 쓸 수 있게 분리할 수 있는가?**',

ideas:[
 {h:'플러그 앤 플레이 모션 모듈: 이미지 레이어는 건드리지 않는다',
  lead:'T2I의 이미지 레이어는 완전히 얼린 채, 시간 축만 처리하는 Transformer를 별도로 끼워 넣는다.',
  d:'입력 비디오 텐서를 5차원 $b\\times c\\times f\\times h\\times w$ 로 다루되, 기존 이미지 레이어(ResNet·Self/Cross-Attention)를 통과할 때는 프레임 축 $f$ 를 배치 축에 합쳐 **각 프레임을 독립된 이미지처럼** 처리한다. 반대로 새로 삽입한 모션 모듈을 통과할 때는 공간 축 $h,w$ 를 배치 축에 합쳐 **프레임들끼리만** 정보를 교환하게 한다. 이 분리 덕에 이미지 레이어가 가진 콘텐츠 지식이 전혀 손상되지 않는다.'},
 {h:'모션 모듈은 시간 축을 도는 Transformer 하나',
  lead:'sinusoidal 위치 인코딩을 더한 프레임 시퀀스에 self-attention을 몇 겹 돌리는 것이 전부다.',
  d:'재구성된 특징을 길이 $f$ 의 벡터 시퀀스 $\\{z_1,...,z_f\\}$ 로 보고 [Transformer](#/p/transformer)의 self-attention을 그대로 적용한다("temporal Transformer"). 프레임 순서 정보가 없으면 애니메이션이 성립하지 않으므로 sinusoidal 위치 인코딩이 필수다. 출력 투영층은 **zero-initialize**하고 residual을 더해, 학습 시작 시점에 모션 모듈이 항등 함수가 되게 한다 — 이 초기화가 없으면 갓 삽입된 모듈이 사전학습된 이미지 지식을 초반에 망가뜨린다.'},
 {h:'Domain Adapter: 비디오 데이터의 화질 격차를 모션 모듈이 떠안지 않게 격리한다',
  lead:'모션 모듈을 학습시키기 전, 비디오 데이터 특유의 화질 특성만 흡수하는 LoRA 어댑터를 따로 학습시킨다.',
  d:'WebVid 같은 비디오 데이터셋은 모션 블러·압축 손상·워터마크 때문에 고품질 이미지 데이터셋보다 화질이 떨어진다. 이 격차를 모션 모듈이 함께 학습해버리면 나중에 고품질 개인화 T2I에 꽂았을 때 화질이 오염된다. 그래서 먼저 self-/cross-attention의 Q 투영에 $Q = W^Qz + \\alpha\\cdot AB^Tz$ 형태의 [LoRA](#/p/lora) 어댑터를 끼워 비디오의 정지 프레임만으로 화질 특성을 흡수시키고, **추론 시에는 이 어댑터를 빼버린다**(또는 α로 세기 조절). 3단계 학습 중 1단계가 이 어댑터만 학습하는 단계다.'},
 {h:'MotionLoRA: 카메라 움직임 패턴을 20~50개 영상으로 저비용 이식',
  lead:'사전학습된 모션 모듈의 self-attention에 LoRA를 더해 줌·팬 같은 특정 카메라 효과만 소량 데이터로 학습한다.',
  d:'범용 모션 모듈은 일반적인 동작은 잘 배우지만 줌인·팬·롤링 같은 특정 촬영 패턴은 따로 강화해야 한다. 모션 모듈의 self-attention 층에 LoRA를 추가하고, 해당 효과로 룰-베이스 증강한 참조 영상 20~50개·약 2000 스텝(1~2시간)만으로 학습시킨다. 추가 저장 용량이 약 30M에 불과해 사용자끼리 공유하기 쉽고, 여러 MotionLoRA를 선형 결합해 효과를 합성할 수도 있다.'}
],

diagram:{type:'flow', cap:'3단계 학습 — 각 단계는 서로 다른 모듈만 학습하고 나머지는 얼린다.',
 nodes:[
  {t:'Domain Adapter', s:'1단계·LoRA·정지프레임', acc:true, note:'화질 격차 격리'},
  {t:'Motion Module', s:'2단계·시간축 Transformer', a:'영상 학습'},
  {t:'3. MotionLoRA', s:'20~50 참조영상', a:'선택적'},
  {t:'개인화 T2I에 삽입', s:'재학습 없이'}
 ]},

math:[
 {expr:"Q = W^Q z + AdapterLayer(z) = W^Q z + α·AB^T z",
  tex:"Q=\\mathcal{W}^Qz+\\text{AdapterLayer}(z)=\\mathcal{W}^Qz+\\alpha\\cdot AB^{\\top}z",
  d:'Domain Adapter의 형태. $A,B$ 는 저랭크 행렬(LoRA), $\\alpha{=}1$ 이 기본값이며 추론 시 0으로 두면 어댑터 효과가 완전히 사라진다.'},
 {expr:"z_out = Attention(Q,K,V) = softmax(QKᵀ/√c) · V   (시간 축 위에서)",
  tex:"z_{out}=\\text{Attention}(Q,K,V)=\\text{softmax}\\!\\left(\\frac{QK^{\\top}}{\\sqrt{c}}\\right)\\cdot V",
  d:'모션 모듈 내부의 self-attention. 공간 축이 배치로 접혀 있으므로 이 attention은 오직 프레임(시간) 축 사이에서만 계산된다 — 공간적 self-attention과 형태는 같지만 대상이 다르다.'},
 {expr:"L = E[ ||ε − ε_θ(z_t^{1:f}, t, τ_θ(y))||² ]",
  tex:"\\mathcal{L}=\\mathbb{E}_{\\mathcal{E}(x_0^{1:f}),y,\\epsilon^{1:f},t}\\left[\\lVert \\epsilon-\\epsilon_\\theta(z_t^{1:f},t,\\tau_\\theta(y))\\rVert_2^2\\right]",
  d:'모션 모듈·MotionLoRA 학습에 쓰는 손실. 프레임별 잠재 코드 $z_0^{1:f}$ 를 한꺼번에 노이징한 뒤 표준 확산 노이즈 예측 손실을 그대로 쓴다 — 프레임 축이 추가된 것 외에는 SD 학습과 동일하다.'}
],

numbers:[
 {k:'MotionLoRA 저장 용량', v:'약 30M', d:'20~50개 참조 영상 · 약 2000 스텝(1~2시간)으로 학습'},
 {k:'학습 데이터', v:'WebVid-10M', d:'모션 모듈(2단계) 학습에 사용, 기반 모델은 SD v1.5'},
 {k:'사용자 선호도(Smooth.)', v:'2.825', d:'Text2Video-Zero(1.560)·Tune-a-Video(1.615) 대비 AUR 기준 최고'},
 {k:'사용자 선호도(Domain.)', v:'2.280', d:'개인화 도메인 보존 — Tune-a-Video(1.100)를 크게 앞섬'},
 {k:'CLIP Smooth. metric', v:'98.00', d:'Text2Video-Zero(96.57)·Tune-a-Video(97.42)보다 높음'}
],

impact:'모션 지식과 콘텐츠 지식을 아키텍처 수준에서 분리한다는 이 설계가 오픈소스 비디오 생성 생태계의 실질적 표준이 됐다. Civitai에 이미 존재하던 수만 개의 개인화 SD 체크포인트가 **재학습 한 줄 없이** ComfyUI·A1111의 AnimateDiff 확장으로 애니메이션화됐고, MotionLoRA로 카메라 움직임을 나중에 얹는 방식은 `[ControlNet](#/p/controlnet)`·`[IP-Adapter](#/p/ip-adapter)`식 "조건별 소형 모듈"과 같은 철학을 비디오 축으로 확장한 사례다. SDXL·Stage 확장판(AnimateDiff-SDXL, Motion Module v2/v3)이 뒤따르며 이 골격이 백본 세대와 독립적으로 재사용될 수 있음을 보여줬다.',

legacy:[
 '**"모션 모듈 분리"가 오픈소스 비디오 생성의 사실상 표준 패턴이 됨** — 이후 여러 후속 모션 모듈(v2, v3, SDXL판)이 같은 3단계 학습 구조를 유지',
 '**MotionLoRA류의 저비용 카메라 컨트롤이 실무 표준으로 확산** — 줌·팬 등 촬영 효과를 몇십 개 영상으로 이식하는 관행이 다른 비디오 확산 모델에도 이식',
 '**ControlNet/IP-Adapter와의 조합 파이프라인** — AnimateDiff + `[ControlNet](#/p/controlnet)`으로 구조를 고정한 애니메이션, + `[IP-Adapter](#/p/ip-adapter)`로 캐릭터 일관성을 주는 조합이 ComfyUI 표준 워크플로가 됨',
 '**Sora·Stable Video Diffusion 이전 세대의 "저비용 비디오화" 접근을 대표** — 대형 비디오 확산 모델이 나온 이후에도, 기존 이미지 모델 자산을 재사용한다는 점에서 여전히 널리 쓰임'
],

pitfalls:[
 '**모션 모듈은 "범용 모션 사전(motion prior)"이지 임의의 정밀한 카메라 제어가 아니다.** 특정 촬영 기법(줌·팬 등)을 원하면 MotionLoRA를 별도로 학습하거나 커뮤니티 배포본을 써야 한다.',
 '**Domain Adapter를 추론 시 제거하지 않으면 화질이 비디오 데이터셋 쪽으로 끌려간다.** 이 어댑터의 역할은 학습 중 격리이지, 항상 켜두는 기능이 아니다 — 논문은 α로 조절 가능하다고 명시한다.',
 '**"재학습 없이 아무 T2I에나 된다"는 것은 같은 SD 아키텍처 계열(예: SD v1.5 기반 개인화 모델)에 한한다.** 완전히 다른 아키텍처의 T2I 모델에는 이 모션 모듈이 그대로 이식되지 않는다.'
],

figures:[
 {f:'fig3-training-pipeline.png',
  cap:'왼쪽부터 3단계. 1단계(빨강)는 정지 프레임으로 Domain Adapter만, 2단계(하늘색)는 비디오 데이터셋으로 시간축 Transformer(모션 모듈)만, 3단계(초록, 점선 박스 없음)는 20~50개 참조 영상으로 MotionLoRA만 학습한다. 회색 "Pretrained Image Layers"는 세 단계 내내 동결.',
  src:'원문 Figure 3, p.5'}
],

quotes:[
 {t:'Our framework is a plug-and-play motion module that can be trained once and seamlessly integrated into any personalized T2Is originating from the same base T2I.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2307.04725 — AnimateDiff', u:'https://arxiv.org/abs/2307.04725'},
 {t:'GitHub — guoyww/AnimateDiff', u:'https://github.com/guoyww/AnimateDiff'}
]
});
