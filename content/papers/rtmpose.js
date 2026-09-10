WIKI.paper({
slug:'rtmpose',
venue:'arXiv 2023 (MMPose / OpenMMLab)',
authors:'Jiang et al. (Shanghai AI Laboratory)',
arxiv:'2303.07399',

tldr:'새 이론을 제시하는 논문이 아니라, **실시간·실배포**를 목표로 자세 추정 파이프라인의 모든 선택지(패러다임·백본·좌표 인코딩·학습 기법·추론 파이프라인)를 하나씩 실험해 최적 조합을 찾은 엔지니어링 레시피다. CPU·모바일까지 실측한 속도-정확도 수치로 오픈소스 라이브러리들을 능가한다.',

context:'2023년 초 자세 추정 연구는 대부분 공개 벤치마크의 AP 1위 경쟁에 집중돼 있었고, [HRNet](#/p/hrnet)류의 고해상도 백본이나 무거운 transformer 디코더로 정확도를 밀어붙였다. 그런데 산업 현장(HCI, 스포츠 분석, VTuber)에 필요한 것은 CPU·모바일에서도 실시간으로 도는 가벼운 모델이었다. 기존 경량화 시도(TinyPose, LiteHRNet)는 속도는 챙겼지만 정확도 손실이 커서 실무에 못 미쳤다. RTMPose는 [MMDetection](#/p/mmdetection)과 같은 OpenMMLab 생태계(MMPose) 안에서, "어떤 설계가 실제로 지연시간을 줄이는가"를 표 단위로 통제 실험한 결과물이다.',

ideas:[
 {h:'SimCC: 히트맵 대신 좌표를 분류 문제로 푼다',
  lead:'x축·y축 각각을 독립된 1D 분류로 풀어 업샘플링 없이 서브픽셀 정밀도를 얻는다.',
  d:'기존 히트맵 방식은 저해상도 특징맵을 다시 입력 해상도로 업샘플링해야 하고, 그 자체가 연산 비용의 큰 부분을 차지한다. SimCC는 각 키포인트의 x·y 좌표를 각각 등간격 bin으로 나눠 **분류** 문제로 바꾼다. RTMPose는 이 SimCC에서 업샘플링 계층을 통째로 제거한 "SimCC*"를 기준선으로 삼아 head FLOPs를 `1.472G→0.002G`로 줄이면서도 AP 손실을 71.3%로 억제했다.'},
 {h:'CSPNeXt 백본 + GAU 정제',
  lead:'검출기용 경량 백본을 가져오고 Gated Attention Unit으로 키포인트 표현을 한 번 더 다듬는다.',
  d:'이미지 분류용 백본은 밀집 예측 과제에 최적이 아니라는 판단 아래, 객체 검출기 RTMDet의 백본 **CSPNeXt**를 그대로 가져왔다. 여기에 `Gated Attention Unit`(GAU, 일반 transformer 대비 빠르고 메모리 적음)로 self-attention을 한 겹 얹어 키포인트 간 전역·지역 관계를 보정한다. GAU 한 겹 추가만으로 69.7%→71.9% AP로 오른다.'},
 {h:'학습 기법을 통째로 갈아끼운다',
  lead:'UDP 사전학습·EMA·2단계 증강·soft label을 순서대로 더해 정확도를 단계별로 쌓는다.',
  d:'UDP 방식 백본 사전학습(+0.6%p), EMA(+0.1%p), flat cosine annealing(+0.3%p), strong→weak 2단계 데이터 증강(180+30 에폭), SORD 기반 soft label 인코딩까지 — 개별로는 작지만 합치면 baseline 대비 5%p 이상을 끌어올린다. 새 손실 함수나 새 구조가 아니라 **기존 기법의 조합과 순서**가 성능을 만든다는 점이 이 논문의 성격을 보여준다.'},
 {h:'추론 파이프라인 전체를 최적화 대상으로 삼는다',
  lead:'검출을 매 프레임 하지 않고, NMS·필터까지 지연시간 예산에 포함해 설계한다.',
  d:'모델 하나의 속도가 아니라 **검출→포즈→후처리**로 이어지는 전체 파이프라인을 최적화 단위로 본다. BlazePose 식으로 K프레임마다만 검출기를 돌리고 중간 프레임은 직전 포즈 결과로 바운딩박스를 대체하는 skip-frame 기법, OKS 기반 pose NMS, OneEuro 필터로 프레임 간 흔들림을 줄인다. 논문은 이를 "Pipeline AP"·"Pipeline latency"로 따로 표로 보고한다.'},
 {h:'PyTorch부터 ncnn까지, 배포 스택 전체를 실측한다',
  lead:'ONNX Runtime·TensorRT·ncnn 세 백엔드와 CPU·GPU·모바일 세 하드웨어를 교차 실측한다.',
  d:'논문 절반은 사실상 배포 벤치마크다. Intel i7-11700(ONNX Runtime, CPU), GTX 1660 Ti(TensorRT FP16, GPU), Snapdragon 865(ncnn, 모바일 4스레드)까지 **동일 모델을 세 경로로 변환해 각각 실측**했다. 이 실측 습관 자체가 학술 벤치마크에만 머물던 이전 자세 추정 논문들과 다른 지점이다.'}
],

diagram:{type:'flow', cap:'RTMPose 헤드 구조. 백본 특징을 7×7 conv→FC→GAU로 정제한 뒤, x축·y축을 별도 분류기로 예측해 좌표쌍을 만든다.',
 nodes:[
  {t:'백본', s:'CSPNeXt'},
  {t:'7×7 conv', s:'특징 정제'},
  {t:'FC + GAU', s:'256d, self-attn', acc:true, note:'← 전역 관계 보정'},
  {t:'X축 분류기', s:'bin 단위 좌표'},
  {t:'Y축 분류기', s:'bin 단위 좌표'}
 ]},

math:[
 {expr:'y_i = softmax_i( φ(r_t, r_i) / τ ),   φ(r_t, r_i) = exp(-(r_t - r_i)² / 2σ²)',
  tex:'y_i=\\frac{e^{\\phi(r_t,r_i)/\\tau}}{\\sum_{k=1}^{K}e^{\\phi(r_t,r_k)/\\tau}},\\quad \\phi(r_t,r_i)=e^{-\\frac{(r_t-r_i)^2}{2\\sigma^2}}',
  d:'정답 bin 하나만 1인 one-hot 대신, 정답 위치를 중심으로 한 가우시안 분포를 soft label로 쓴다. 온도 $\\tau$ 로 분포의 뾰족함을 조절하며, $\\tau=0.1$ 일 때 71.9%→72.7% AP로 가장 크게 개선됐다.'},
 {expr:'A = (1/n)·relu(QKᵀ/√s)²,   O = (U ⊙ AV) W_o',
  tex:'A=\\frac{1}{n}\\,\\mathrm{relu}^2\\!\\left(\\frac{Q(X)K(Z)^{\\top}}{\\sqrt{s}}\\right),\\quad O=(U\\odot AV)W_o',
  d:'GAU의 attention 식. $s=128$ 이고 softmax 대신 ReLU 제곱을 쓰는 것이 표준 transformer와 다른 부분 — 연산이 가볍고 이 논문의 실험에서 0.5%p 성능 이득을 냈다.'}
],

numbers:[
 {k:'RTMPose-m · COCO AP', v:'75.8%', d:'Intel i7-11700 CPU(ONNX Runtime, 1스레드) 90+ FPS, GTX 1660 Ti(TensorRT FP16) 430+ FPS — flip test 포함'},
 {k:'RTMPose-s · Snapdragon 865', v:'72.2% AP · 70+ FPS', d:'ncnn, 4스레드, 모바일 칩 실측'},
 {k:'RTMPose-t · CPU 지연시간', v:'3.2ms', d:'입력 256×192, GFLOPs 0.36, batch=1, ONNX Runtime(warmup 50·측정 200회 평균)'},
 {k:'HRNet-w32+UDP 대비', v:'CPU 37.7ms → RTMPose-m 11.1ms', d:'같은 256×192 입력에서 AP는 75.1%→75.3%로 유지하며 지연시간만 대폭 단축'},
 {k:'COCO-WholeBody AP', v:'65.3%(x 모델) / 66.1%(l, 384×288)', d:'HRNet-w48+DARK(384×288, 65.3% AP, GPU 14.0ms) 대비 RTMPose-l은 7.7ms로 동일 정확도대에서 2배 가까이 빠름'},
 {k:'SimCC 업샘플 제거 효과', v:'Head FLOPs 1.472G → 0.002G', d:'AP는 72.1%→71.3%로 0.8%p만 하락 — 이 트레이드오프가 이후 모든 개선의 출발점'}
],

impact:'RTMPose는 자세 추정을 "더 높은 AP"가 아니라 "주어진 지연시간 예산 안에서 최대 AP"라는 산업 문제로 재정의했다. MMPose 프로젝트에 통합돼 오픈소스 배포 표준 경량 자세 추정기로 자리 잡았고, CPU·모바일 실측치를 논문에 정식으로 싣는 관행을 자세 추정 분야에 정착시켰다. SimCC 기반 좌표 분류는 이후 경량 자세 추정 모델들의 기본 선택지가 되었다.',

legacy:[
 '**MMPose 공식 프로젝트로 편입** — OpenMMLab 생태계 안에서 [MMDetection](#/p/mmdetection) 계열 검출기와 결합해 즉시 배포 가능한 top-down 파이프라인으로 쓰임',
 '**좌표 분류 패러다임의 확산** — 히트맵 회귀 대신 SimCC류 분류 방식을 쓰는 경량 자세 추정 모델들이 이후 뒤따름',
 '**배포 벤치마크 관행** — ONNX/TensorRT/ncnn 다중 백엔드·다중 하드웨어 실측 보고가 후속 실시간 비전 논문들의 표준 표 형식이 됨',
 '**"논문 = 로드맵" 서술 방식** — Figure 3처럼 기준선에서 최종 모델까지 각 트릭의 개별 기여도를 단계별로 표시하는 ablation 서술이 실무 지향 논문들에서 자주 재사용됨'
],

pitfalls:[
 '**RTMPose는 top-down 방식이다.** COCO AP에는 자세 추정 모델 자체의 성능뿐 아니라 별도 사람 검출기(RTMDet 등)의 성능이 섞여 들어간다. Table 4·5의 AP를 비교할 때는 "Detector"·"Det. Input Size" 열을 같이 봐야 하며, 검출기가 다르면 공정한 비교가 아니다.',
 '**"실시간"의 기준이 하드웨어마다 다르다.** 90+ FPS(CPU), 430+ FPS(GPU), 70+ FPS(모바일)는 서로 다른 모델(m/s)·다른 입력 해상도·다른 배포 스택(ONNX/TensorRT/ncnn)에서 나온 수치라 하나로 뭉뚱그려 인용하면 오해를 부른다.',
 '**군중 장면에서는 가정이 깨진다.** 저자들도 "6명 이내 시나리오"를 전제로 top-down이 유리하다고 명시한다. 사람 수가 많아지면 검출·크롭·개별 forward 비용이 선형으로 늘어 실시간성이 무너질 수 있다.'
],

figures:[
 {f:'fig2-architecture.png',
  cap:'백본 출력을 7×7 conv→FC→GAU로 정제한 뒤(가운데 보라색 GAU 블록), 히트맵을 거치지 않고 곧바로 X축·Y축 좌표 분류기 두 갈래로 나눈다. 가운데 파란/히트맵 이미지는 개념 설명용 시각화이며 실제로는 1D 분포만 예측한다.',
  src:'원문 Figure 2, p.3'},
 {f:'fig1-speedaccuracy.png',
  cap:'x축이 로그스케일 지연시간(ms), y축이 COCO AP. 원의 크기는 파라미터 수. 빨간 RTMPose 계열이 같은 지연시간대에서 다른 오픈소스 라이브러리(파란 TinyPose, 주황 FastPose 등)보다 왼쪽 위(더 빠르고 더 정확한 쪽)에 몰려 있다. 점선 원은 CPU, 실선 원은 GPU(TensorRT FP16) 측정치.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:"Top-down algorithms have been stereotyped as accurate but slow, due to the extra detection process and increasing workload in crowd scenes.",
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 2303.07399 — RTMPose', u:'https://arxiv.org/abs/2303.07399'},
 {t:'MMPose RTMPose (공식 구현)', u:'https://github.com/open-mmlab/mmpose/tree/main/projects/rtmpose'}
]
});
