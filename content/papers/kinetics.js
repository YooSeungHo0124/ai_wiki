WIKI.paper({
slug:'kinetics',
venue:'arXiv 2017 (DeepMind)',
authors:'Kay, Carreira, Simonyan, Zisserman et al. (DeepMind · Google)',
arxiv:'1705.06950',

tldr:'YouTube에서 사람 행동 400종을 클래스당 최소 400개 클립씩 모은 대규모 영상 데이터셋. [UCF101](#/p/ucf101)·HMDB-51의 규모·다양성 한계를 정면으로 겨냥해 만들었다.',

context:'2017년까지 영상 행동 인식의 표준 벤치마크는 [UCF101](#/p/ucf101)(101클래스, 13,320클립)과 HMDB-51(51클래스, 6,766클립)이었다. 문제는 규모가 아니라 **다양성**이었다 — UCF101의 클립은 단 2,500개의 원본 영상에서 나왔고, 예컨대 같은 사람이 머리를 빗는 클립이 한 영상에서 7개나 나오는 식이었다. 딥러닝이 [ImageNet](#/p/imagenet)으로 이미지 인식을 밀어붙인 것처럼, 영상에서도 처음부터 대규모로 학습할 수 있는 데이터가 필요했다. Kinetics는 각 클립을 **서로 다른 영상**에서만 뽑아 이 편향을 원천적으로 피했다.',

ideas:[
 {h:'클립마다 다른 원본 영상',
  lead:'400클래스 × 클래스당 400개 이상 클립을 전부 서로 다른 YouTube 영상에서 뽑았다.',
  d:'306,245개 클립이 306,245개의 서로 다른 영상에서 나왔다. UCF101처럼 같은 배경·같은 사람이 여러 클립에 반복 등장하는 일이 없어서, 모델이 "누가 어디서 찍었는지"가 아니라 실제 동작을 배우도록 강제한다. 각 클립은 약 10초로 잘랐다.'},
 {h:'영상 검색 분류기로 후보 위치 탐색',
  lead:'Google 이미지 검색 신호로 학습한 프레임 분류기를 돌려 클립을 자를 위치를 자동으로 찾는다.',
  d:'먼저 클래스 이름으로 YouTube 제목을 매칭해 후보 영상을 모은다. 그다음 "climbing tree" 같은 검색어의 이미지 검색 피드백으로 학습한 이미지 분류기를 프레임 단위로 돌려, confidence가 높은 지점 앞뒤 5초를 잘라 클립 후보를 만든다. 사람이 전체 영상을 처음부터 보지 않고도 후보를 효율적으로 좁힐 수 있게 하는 장치다.'},
 {h:'사람이 검증하는 라벨링 루프',
  lead:'Mechanical Turk 작업자가 "이 동작이 실제로 보이는가"를 답하고, 최소 3표 이상 동의해야 채택한다.',
  d:'분류기가 찾은 후보 클립을 Amazon Mechanical Turk 작업자에게 보여주고 "Yes/No/Unsure/영상 문제"로 답하게 했다. 최대 5명까지 물어보되 3명 이상이 "Yes"로 동의해야 클립이 채택된다. 워커 정확도를 정답이 알려진 클립(groundtruth)으로 실시간 추적해 50% 미만이면 경고를 띄우는 등 품질 관리 장치를 여러 겹 뒀다.'},
 {h:'라벨 노이즈와 클래스 혼동의 실측',
  lead:'클래스 간 혼동률과 flow/RGB 정확도 비율을 직접 측정해 데이터셋의 한계를 스스로 드러냈다.',
  d:'"riding mule"과 "riding or walking with horse"는 40% 혼동됐고, "hockey stop"과 "ice skating"은 36% 혼동됐다. 또 flow(움직임) 스트림과 RGB(외형) 스트림의 정확도 비율을 클래스별로 비교해, "rock scissors paper"처럼 움직임이 결정적인 클래스와 "eating cake"처럼 외형만으로 거의 다 맞히는 클래스를 구분해 보였다. 데이터셋 자체의 편향을 투명하게 공개한 드문 사례다.'}
],

diagram:{type:'flow', cap:'클립 하나가 만들어지기까지의 4단계 파이프라인. 자동 탐지와 사람 검증이 번갈아 들어간다.',
 nodes:[
  {t:'행동 목록 수집', s:'기존 데이터셋+MTurk'},
  {t:'영상·위치 탐색', s:'이미지 분류기', acc:true, note:'자동 후보 생성'},
  {t:'사람 검증', s:'MTurk 3/5표 동의'},
  {t:'중복·혼동 정리', s:'클래스별 de-noise'}
 ]},

numbers:[
 {k:'클래스 수', v:'400', d:'UCF101(101)의 약 4배, HMDB-51(51)에서 시작한 계보의 8배'},
 {k:'클립당 최소 개수', v:'400개', d:'클래스당 400~1150개, 학습 250~1000 / 검증 50 / 테스트 100개로 분할'},
 {k:'총 클립·영상 수', v:'306,245', d:'클립 수 = 영상 수 — 한 영상에서 클립 하나만 뽑는 원칙'},
 {k:'클립 길이', v:'약 10초', d:'탐지된 위치 앞뒤 5초씩'},
 {k:'베이스라인 Kinetics top-1/top-5', v:'61.0 / 81.3 (Two-Stream RGB+Flow)', d:'ConvNet+LSTM 57.0/79.0, 3D-ConvNet 56.1/79.5보다 높음'},
 {k:'학습 규모', v:'64 GPU 동기 병렬, 최대 100k 스텝', d:'ResNet-50 기반 Two-Stream·ConvNet+LSTM, C3D 변형 3D-ConvNet 세 아키텍처를 베이스라인으로 학습'}
],

impact:'행동 인식 연구가 "작은 데이터셋에서 손으로 설계한 특징을 겨루는" 단계에서 "[ImageNet](#/p/imagenet)처럼 대규모 사전학습 후 전이"하는 단계로 넘어가는 전환점이 됐다. 논문과 동시에 발표된 [I3D](#/p/i3d)(Carreira & Zisserman, 동일 저자 그룹)가 Kinetics 사전학습만으로 기존 UCF101·HMDB-51 SOTA를 크게 갱신하면서, "영상도 이미지처럼 대규모 사전학습이 통한다"는 것을 증명하는 짝 논문 역할을 했다.',

legacy:[
 '**I3D와 함께 발표** — [I3D](#/p/i3d)가 이 데이터셋에서 사전학습한 3D ConvNet으로 행동 인식 SOTA를 갱신하며, Kinetics 사전학습이 사실상 영상 모델의 기본 관행이 됨',
 '**표준 사전학습·평가 셋** — [SlowFast](#/p/slowfast)의 주 학습·평가 데이터셋이자, [TimeSformer](#/p/timesformer)·[VideoMAE](#/p/videomae) 등 이후 영상 트랜스포머 계열의 공통 벤치마크로 굳어짐',
 '**버전 확장** — Kinetics-400 이후 Kinetics-600·Kinetics-700으로 클래스와 클립 수를 늘린 후속 버전이 계속 나옴',
 '**데이터셋 문서화 관행에 영향** — 라벨 노이즈·클래스 혼동률·편향을 논문 안에서 직접 정량화해 공개하는 방식이 이후 대규모 데이터셋 논문의 참고 사례가 됨'
],

pitfalls:[
 '**비배타적(non-exhaustive) 라벨링이다.** 한 클립에 여러 행동이 동시에 있어도(운전하며 문자하기 등) 하나의 클래스로만 등록되므로, top-1보다 top-5 평가가 더 적절하다고 논문 스스로 명시한다.',
 '**오디오는 라벨링에 쓰이지 않았다.** MTurk 작업자는 소리 없이 영상만 보고 판단했으므로, 데이터셋에 오디오 트랙이 있어도 "행동" 라벨이 소리 정보를 보장하지 않는다.',
 '**클래스 간 경계가 사람 눈에도 모호하다.** "shooting basketball"과 "playing basketball"처럼 32% 넘게 혼동되는 클래스 쌍이 다수 존재해, 낮은 정확도가 반드시 모델의 결함만은 아니다.'
],

figures:[
 {f:'fig1-example-classes.png',
  cap:'같은 클래스(headbanging) 안에서도 배경·인물·조명이 전부 다른 두 영상. 이렇게 클래스마다 서로 다른 원본 영상만 쓴 것이 UCF101과의 핵심 차이다.',
  src:'원문 Figure 1, p.3'},
 {f:'fig3-architectures.png',
  cap:'논문이 비교한 세 베이스라인 구조. (a) 프레임별 ConvNet 특징을 LSTM으로 순차 결합, (b) RGB와 optical flow를 각각 ConvNet에 넣고 점수를 더하는 Two-Stream, (c) 여러 프레임을 한 번에 넣는 3D ConvNet.',
  src:'원문 Figure 3, p.8'}
],

quotes:[
 {t:'We describe the DeepMind Kinetics human action video dataset. The dataset contains 400 human action classes, with at least 400 video clips for each action.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1705.06950 — The Kinetics Human Action Video Dataset', u:'https://arxiv.org/abs/1705.06950'},
 {t:'DeepMind Kinetics 데이터셋 페이지', u:'https://www.deepmind.com/open-source/kinetics'}
]
});
