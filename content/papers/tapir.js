WIKI.paper({
slug:'tapir',
venue:'ICCV 2023',
authors:'Doersch et al. (Google DeepMind · UCL · Oxford VGG)',
arxiv:'2306.08637',

tldr:'TAP-Net의 프레임별 전역 탐색(초기화)과 [PIPs](#/p/pips)의 국소 반복 정제를 합치고, MLP-Mixer 대신 시간축 depthwise convolution과 자기 불확실도 추정을 넣은 점 추적 모델. [TAP-Vid](#/p/tap-vid)에서 DAVIS AJ를 TAP-Net 대비 약 20%p, Kinetics를 PIPs 대비 약 20%p 끌어올렸다.',

context:'[TAP-Vid](#/p/tap-vid)가 문제와 벤치마크를 정의한 직후, 기준 모델 두 개가 서로 반대의 약점을 갖고 있었다. TAP-Net은 프레임마다 독립적으로 전역 매칭을 하므로 가려짐 뒤에도 점을 되찾지만 영상의 연속성을 쓰지 못해 궤적이 떨린다. PIPs는 국소 탐색과 시간 평활화로 정밀하지만 8프레임 청크를 앞 청크의 출력으로 초기화하며 순차 처리해서 가려짐에 약하고 병렬화가 안 된다. 원문은 PIPs로 TAP-Vid-Kinetics를 1 GPU로 평가하는 데 약 1개월이 걸린다고 적는다. TAPIR의 출발점은 이 둘이 상보적이라는 관찰이다.',

ideas:[
 {h:'프레임별 초기화: 전역 비용 볼륨으로 후보 위치 찾기',
  lead:'질의 특징과 모든 프레임의 특징을 내적해, 프레임마다 독립적으로 초기 위치·가림을 얻는다.',
  d:'TSM-ResNet-18의 1/8 해상도 특징맵에서 질의 점 특징 $F_q$ 와 각 프레임 특징의 내적으로 비용 볼륨을 만들고, 작은 ConvNet이 히트맵과 가림 로짓을 낸다. 히트맵은 공간 softmax 뒤 argmax에서 먼 값을 0으로 만든 soft argmax로 위치가 된다. 시간 연속성을 강제하지 않으므로 가려졌다 나타나는 점에 강하고, 8픽셀 stride 때문에 정밀도는 몇 픽셀 수준에 그친다.'},
 {h:'시간축 depthwise conv로 하는 반복 정제',
  lead:'초기 궤적 주변의 국소 점수 맵을 보고 위치·가림·불확실도와 질의 특징을 잔차로 갱신한다.',
  d:'초기 위치 주변 7×7 영역에서 질의 특징과의 내적을 여러 해상도 피라미드로 뽑고, 현재 추정과 질의 특징을 이어 붙여 12블록 네트워크에 넣는다. 각 블록은 1×1 합성곱(채널 혼합)과 depthwise 합성곱(시간 혼합)으로, PIPs의 MLP-Mixer 구조를 그대로 합성곱으로 옮긴 것이다. 청크 단위가 아니라 임의 길이 시퀀스에 적용되고 갱신된 질의 특징이 프레임마다 달라진다. 정제 반복은 4회를 쓴다.'},
 {h:'자기 불확실도 추정',
  lead:'가시로 예측해도 위치가 크게 틀릴 확률 $u_t$ 를 모델이 따로 출력해 신뢰 낮은 예측을 억제한다.',
  d:'AJ에서는 보이는 점의 위치를 크게 틀리면 거짓양성과 거짓음성이 동시에 생기므로, 틀릴 바에야 가림으로 표시하는 편이 낫다. 모델이 자기 위치 예측이 임계 $\\delta$ 밖일지 이진 타깃으로 학습하는 두 번째 로짓을 내고, 추론에서는 $(1-u_t)(1-o_t)>0.5$ 일 때만 가시로 낸다. 타깃이 모델 자신의 출력에 의존하므로 자기지도라고 부른다.'},
 {h:'stride-4 고해상도 특징을 학습 때부터 사용',
  lead:'PIPs는 테스트에서만 stride 4를 써 도메인 간극이 생겼는데, TAPIR는 학습부터 stride 4로 맞춘다.',
  d:'stride 4 입력 합성곱 맵(64채널)에서 0번째 점수 맵을 따로 뽑아 메모리 부담을 줄인다. 여러 stride의 점수 맵을 합치므로 국소 점수 맵 크기는 $7\\cdot7\\cdot L$ 이다. 고해상도 특징을 뺀 ablation에서 DAVIS AJ가 61.3에서 54.0으로 떨어졌다.'},
 {h:'패닝 Kubric과 고해상도 추론',
  lead:'카메라가 움직이는 MOVi-E 변형으로 학습하고, 이미지 피라미드로 원본 해상도까지 확장한다.',
  d:'Kubric 카메라는 항상 작업 공간 중심을 바라봐서 정지 배경이 중심 주위를 도는 것처럼 보인다. 저자들은 시선 점이 선형으로 이동하는 패닝 버전을 만들었다. 추론에서는 256×256부터 원본 해상도까지 로그 간격 피라미드를 만들어 각 수준에서 정제하고 출력을 평균한다. 점수 맵 위주 비교라 학습은 256×256으로만 해도 된다.'}
],

diagram:{type:'flow', cap:'TAPIR의 파이프라인. 전역 초기화로 프레임별 후보를 얻고, 국소 점수 맵과 depthwise conv로 4번 정제한다.',
 nodes:[
  {t:'특징 추출', s:'TSM-ResNet, 1/8'},
  {t:'비용 볼륨', s:'질의 × 전 프레임'},
  {t:'초기 궤적', s:'위치·가림·불확실도'},
  {t:'국소 점수 맵', s:'7×7, 피라미드'},
  {t:'시간 depthwise', s:'12블록', acc:true, a:'4회 반복'}
 ]},

math:[
 {expr:'L = Huber(p̂,p)·(1−ô) + BCE(ô,o) + BCE(û,u)·(1−ô),  û = 1[d(p̂,p)>δ]',
  tex:'L=L_H(\\hat p_t,p_t)(1-\\hat o_t)+\\mathrm{BCE}(\\hat o_t,o_t)+\\mathrm{BCE}(\\hat u_t,u_t)(1-\\hat o_t),\\quad \\hat u_t=\\mathbb{1}[d(\\hat p_t,p_t)>\\delta]',
  d:'원문 식 (1)의 구조다. 표기상 $\\hat{\\cdot}$ 은 원문에서 정답을 가리킨다. 위치는 보이는 프레임에서만 Huber 손실, 가림과 불확실도는 이진 cross entropy다. 불확실도 타깃은 예측이 정답에서 $\\delta$ 보다 멀면 1이다. 같은 손실이 초기화와 모든 정제 반복에 같은 가중으로 걸린다.'},
 {expr:'visible ⇔ (1 − u_t)(1 − o_t) > 0.5',
  tex:'\\text{visible}\\iff(1-u_t)(1-o_t)>0.5',
  d:'추론 시 가시 판정이다. 가림 확률과 위치 오류 확률을 소프트하게 결합해, 가림이 아니면서 위치도 믿을 만할 때만 가시로 내보낸다.'}
],

numbers:[
 {k:'TAP-Vid AJ · TAPIR (Panning MOVi-E) Kinetics / DAVIS / RGB-Stacking', v:'57.2 / 61.3 / 62.7', d:'Table 2(strided 질의). Kubric으로만 학습. MOVi-E 판은 57.1 / 59.8 / 66.2'},
 {k:'같은 표의 TAP-Net / PIPs AJ (Kinetics, DAVIS)', v:'TAP-Net 46.6, 38.4 / PIPs 35.3, 42.0', d:'Table 2. 원문은 Kinetics 최고 기존 모델(TAP-Net) 대비 +10.6, DAVIS 최고 기존 모델(PIPs) 대비 +19.3이라고 적음'},
 {k:'고해상도 추론 AJ (Kinetics / DAVIS)', v:'60.0 / 65.7 (256×256 대비 57.2 / 61.3)', d:'Table 4. 위치 정확도는 오르지만 가림 정확도 OA는 내려간다'},
 {k:'속도 (DAVIS horsejump-high, 점 50개)', v:'TAP-Net 0.1초 · TAPIR 0.3초 · PIPs 34.5초', d:'256×256, JAX JIT. TAPIR는 약 150 FPS. 파라미터는 TAP-Net 2.8M, PIPs 28.7M, TAPIR 29.3M(Table 1)'},
 {k:'구성 요소 제거 시 DAVIS AJ', v:'depthwise conv 제거 53.8 · 고해상도 특징 제거 54.0 · 불확실도 제거 58.6 (전체 61.3)', d:'Table 6. 반복 정제를 없애면 41.6'},
 {k:'단순 결합 대비 (DAVIS AJ)', v:'Chain-free PIPs 43.3 → 단순 결합 50.0 → TAPIR 61.3', d:'Table 5. TAP-Net 초기화와 PIPs 정제의 결합만으로 얻는 이득과 나머지 설계의 이득을 분리'}
],

impact:'TAPIR는 점 추적에서 "전역 매칭으로 후보를 만들고 국소 정제로 다듬는" coarse-to-fine 골격을 확립했다. [TAP-Vid](#/p/tap-vid) 지표를 한 번에 크게 끌어올렸고 병렬 추론 덕에 긴 영상·고해상도에도 현실적인 속도가 나왔다. 원문은 이 궤적으로 이미지에서 움직임을 생성하는 diffusion 개념 증명도 보여 준다. 다만 모델은 점을 독립적으로 추적한다.',

legacy:[
 '**CoTracker**가 TAPIR·PIPs를 비교 대상으로 삼아 점들을 함께 추적하는 방향으로 확장',
 '**CoTracker3**가 실제 영상 의사 라벨링으로 학습해 TAPIR 계열 성능을 다시 갱신',
 '**TAPNext**가 TAPIR의 후속으로 정제 모듈 대신 다음 토큰 예측 구조로 단순화',
 '**TAPNext** 등 후속 논문이 TAPIR를 비교표의 기준선으로 계속 사용'
],

pitfalls:[
 '**고해상도로 돌린다고 모든 지표가 좋아지지 않는다.** Table 4에서 위치 정확도와 AJ는 오르지만 가림 정확도는 87.8에서 86.7로 내려간다. 큰 문맥이 가림 판단에 도움이 되기 때문이라고 원문이 추측한다.',
 '**정제 반복이 많을수록 좋은 것이 아니다.** Table 7에서 4~5회가 최적이고 6회는 RGB-Stacking에서 56.6까지 떨어진다. 원문은 과평활 같은 퇴행을 의심한다.',
 '**질감 없는 물체에는 여전히 약하다.** RGB-Stacking 개선폭이 작다(TAP-Net 59.9 대비 약 6점)는 점을 원문이 한계로 인정한다. 공개 모델은 논문 본문 모델과 백본·상수가 달라 수치가 다르다(Table 8).'
],

figures:[
 {f:'fig2-architecture.png',
  cap:'아래에서 위로 읽는다. 아래쪽은 질의 특징과 전 프레임 특징의 비용 볼륨으로 초기 위치·가림·불확실도를 내는 단계이고, 점선 상자 안은 초기 궤적 주변의 국소 특징으로 점수 맵을 만들어 depthwise conv로 갱신하는 정제 단계다. 정제 상자가 4번 반복되고 내부 블록은 12개다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'TAP-Net performs a global search on every frame independently, providing a coarse track that is robust to occlusions.',
  src:'1절, p.2'}
],

links:[
 {t:'arXiv 2306.08637 — TAPIR', u:'https://arxiv.org/abs/2306.08637'},
 {t:'GitHub — google-deepmind/tapnet', u:'https://github.com/google-deepmind/tapnet'},
 {t:'프로젝트 페이지', u:'https://deepmind-tapir.github.io'}
]
});
