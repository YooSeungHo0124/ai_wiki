WIKI.paper({
slug:'two-stream',
venue:'NeurIPS 2014',
authors:'Simonyan & Zisserman (Visual Geometry Group, Oxford)',
arxiv:'1406.2199',

tldr:'단일 CNN에 비디오 프레임을 쌓아 넣는 대신, **외형을 보는 CNN**과 **미리 계산한 optical flow를 보는 CNN**을 완전히 분리해 각각 학습하고 점수만 합치는 구조. "움직임을 모델이 배우게" 하는 대신 손으로 계산해 떠먹였더니 행동인식 정확도가 크게 뛰었다.',

context:'2014년 시점 이미지 분류는 [AlexNet](#/p/alexnet) 이후 CNN이 압도했지만, 행동인식(action recognition)에서는 CNN이 손으로 만든 특징(dense trajectories 등)을 못 이겼다. 비디오 프레임을 그대로 쌓아 3D 필터로 학습시킨 시도들은 오히려 기존 shallow 방법보다 성능이 낮았다. 원인은 두 가지다. 하나는 **데이터 부족** — 당시 행동인식 데이터셋(UCF-101 9.5K개, HMDB-51 3.7K개)은 ImageNet 백만 장에 비해 턱없이 작아 시공간 필터를 처음부터 학습시키기 어려웠다. 다른 하나는 **과제 자체의 난이도**다. 단일 프레임 CNN은 "무엇이 보이는가"는 잘 배우지만 "무엇이 어떻게 움직이는가"는 프레임 몇 장을 이어 붙인다고 저절로 학습되지 않는다. 이 논문은 움직임 추정을 모델에 맡기지 말고, 이미 잘 작동하는 **optical flow 알고리즘**으로 미리 계산해 CNN 입력으로 떠먹이자는 실용적인 선택을 한다.',

ideas:[
 {h:'외형과 움직임을 아예 다른 네트워크로 분리',
  lead:'RGB 한 프레임을 보는 공간 스트림과 optical flow 스택을 보는 시간 스트림을 따로 학습한다.',
  d:'인간 시각피질의 복측/배측 경로 가설에서 착안해, 장면·물체를 보는 **공간(spatial) 스트림**과 움직임을 보는 **시간(temporal) 스트림**을 완전히 독립된 ConvNet으로 구성한다. 두 스트림은 서로 다른 입력, 다른 가중치를 갖고 마지막에 softmax 점수만 합쳐진다(late fusion). 이렇게 분리하면 공간 스트림은 [ImageNet](#/p/imagenet)으로 사전학습한 [AlexNet](#/p/alexnet) 계열 지식을 그대로 재활용할 수 있다.'},
 {h:'Optical flow 스택 — 움직임을 채널로 떠먹이기',
  lead:'연속 L프레임의 flow의 x·y 변위를 2L개 채널로 쌓아 한 번에 입력한다.',
  d:'프레임 $t$ 와 $t+1$ 사이의 dense optical flow는 각 픽셀의 수평·수직 변위 $d^x_t, d^y_t$ 로 이루어진 벡터장이다. 이걸 이미지처럼 취급해 $L$ 개 연속 프레임의 flow를 쌓으면 $2L$ 채널의 입력 볼륨이 만들어진다. 단일 프레임 쌍의 flow($L{=}1$)보다 여러 프레임을 쌓을수록($L{=}10$) 장기적인 움직임 패턴이 담겨 정확도가 오른다.'},
 {h:'궤적 기반 스태킹과 양방향 flow는 옵션일 뿐',
  lead:'같은 좌표에서 쌓는 방식과 궤적을 따라가며 쌓는 방식을 비교했지만 차이는 작았다.',
  d:'flow를 고정된 좌표 $(u,v)$ 에서 쌓는 "optical flow stacking"과, 움직이는 점의 궤적 $p_k$ 를 따라가며 쌓는 "trajectory stacking"을 모두 시도했다. 실험 결과 둘의 차이는 미미했고 단순한 optical flow stacking이 오히려 근소하게 더 나았다. 카메라 자체 움직임을 지우기 위해 flow의 평균 벡터를 빼는 **mean flow subtraction**도 소폭 도움이 됐다.'},
 {h:'멀티태스크 학습으로 작은 데이터셋을 보강',
  lead:'UCF-101과 HMDB-51 두 데이터셋의 분류 헤드를 공유 네트워크 위에 동시에 올려 학습한다.',
  d:'HMDB-51은 학습 스플릿이 3.7K개뿐이라 시간 스트림을 처음부터 학습시키기 매우 어렵다. 공유된 특징 위에 데이터셋별 softmax 헤드 두 개를 올리고 동시에 학습시키는 멀티태스크 구조로 두 데이터셋의 데이터를 함께 활용해, HMDB-51 정확도를 46.6%에서 55.4%로 끌어올렸다.'},
 {h:'점수 융합 — SVM이 단순 평균보다 낫다',
  lead:'두 스트림의 softmax 점수를 특징으로 보고 선형 SVM으로 다시 분류하면 더 정확하다.',
  d:'두 네트워크의 완전연결층을 합쳐 함께 학습하는 것은 과적합 때문에 실패했다. 대신 각 스트림이 낸 softmax 점수 벡터를 L2 정규화한 뒤 이어 붙여 선형 SVM의 입력으로 쓰는 방식이 단순 평균보다 나은 결과(86.2% → 87.0%, UCF-101 split 1)를 냈다.'}
],

diagram:{type:'compare', cap:'단일 CNN이 프레임을 통째로 씹어 움직임까지 배우려는 접근과, 이 논문처럼 움직임을 미리 계산해 별도 스트림에 넣는 접근의 차이.',
 left:{t:'단일 스트림 CNN', items:['RGB 프레임 여러 장을 그대로 쌓아 입력','움직임 추정을 모델이 암묵적으로 학습','작은 데이터셋에선 과적합·저성능']},
 right:{t:'Two-Stream (이 논문)', items:['공간 스트림: RGB 한 프레임','시간 스트림: optical flow 스택 입력','두 softmax 점수를 SVM/평균으로 융합']}},

math:[
 {expr:'I_τ(u,v,2k-1) = dx_{τ+k-1}(u,v),  I_τ(u,v,2k) = dy_{τ+k-1}(u,v),  k=1..L',
  tex:'I_{\\tau}(u,v,2k{-}1)=d^{x}_{\\tau+k-1}(u,v),\\quad I_{\\tau}(u,v,2k)=d^{y}_{\\tau+k-1}(u,v),\\quad k=1,\\dots,L',
  d:'$L$ 개 연속 프레임의 flow 수평·수직 성분을 번갈아 쌓아 $2L$ 채널짜리 입력 $I_\\tau \\in \\mathbb{R}^{w\\times h\\times 2L}$ 을 만든다. 시간 스트림 ConvNet은 이 입력을 받는다.'},
 {expr:'p_1=(u,v),  p_k = p_{k-1} + d_{τ+k-2}(p_{k-1}),  k>1',
  tex:'p_1=(u,v),\\qquad p_k=p_{k-1}+d_{\\tau+k-2}(p_{k-1}),\\ \\ k>1',
  d:'trajectory stacking에서는 고정 좌표가 아니라 flow를 따라 이동하는 점 $p_k$ 위치에서 변위를 샘플링한다. 결과적으로 optical flow stacking과 성능 차이는 크지 않았다.'}
],

numbers:[
 {k:'시간 스트림 단독 · UCF-101', v:'83.7%', d:'공간 스트림 단독(73.0%)보다 훨씬 높음 — 움직임 신호의 힘'},
 {k:'Two-Stream 융합(SVM) · UCF-101', v:'87.0%', d:'split 1 기준, 단순 평균(85.9~86.2%)보다 SVM 융합이 더 나음'},
 {k:'평균 정확도(3-split) · UCF-101 / HMDB-51', v:'88.0% / 59.4%', d:'표 4, 당시 손수 설계 특징(IDT 85.9%/57.2%)과 대등하거나 상회'},
 {k:'멀티태스크 효과 · HMDB-51', v:'46.6% → 55.4%', d:'UCF-101 데이터를 함께 학습에 활용했을 때의 개선폭'},
 {k:'"slow fusion" 3D 베이스라인 · UCF-101', v:'65.4%', d:'프레임을 그대로 쌓아 학습한 이전 시도, two-stream보다 크게 낮음'},
 {k:'optical flow 저장 용량 · UCF-101', v:'1.5TB → 27GB', d:'flow를 [0,255] 정수로 재양자화 압축해 저장한 결과'}
],

impact:'행동인식에서 CNN이 손으로 만든 특징을 처음으로 확실히 앞서기 시작한 논문이다. 핵심은 "시간 정보를 어떻게 넣을 것인가"라는 질문에 **미리 계산한 optical flow를 별도 스트림에 넣는다**는 실용적 답을 준 것이고, 이 레시피(RGB 스트림 + flow 스트림 + late fusion)는 이후 수년간 비디오 인식의 사실상 표준 구조가 되었다. 동시에 "단일 프레임만으로도 상당한 정확도가 나온다"는 관찰은 이후 비디오 벤치마크의 외형 편향 문제를 예고하는 첫 신호이기도 했다.',

legacy:[
 '**3D 커널로 확장** — [I3D](#/p/i3d)가 두 스트림 구조는 유지한 채 각 스트림을 2D에서 3D-inflated Inception으로 바꿔 flow 계산 없이도 시공간 필터를 직접 학습하는 방향으로 발전',
 '**optical flow 자체를 없앰** — [SlowFast](#/p/slowfast)는 순수 RGB 두 경로(느린 경로/빠른 경로)만으로 움직임을 포착해, 비싼 flow 사전계산이라는 병목을 완전히 제거',
 '**대규모 비디오 프리트레인 데이터셋의 필요성 부각** — UCF-101/HMDB-51의 데이터 부족 문제가 이후 [I3D](#/p/i3d)와 함께 제안된 Kinetics 데이터셋으로 이어짐',
 '**단일 프레임 베이스라인 논쟁의 시작점** — 이 논문의 공간 스트림 단독 73%라는 수치가, 이후 비디오 데이터셋의 "정지 프레임만으로 얼마나 맞히나"를 따지는 연구 흐름의 초기 근거가 됨'
],

pitfalls:[
 '**optical flow는 사전 계산이며 end-to-end가 아니다.** flow 자체는 학습 가능한 파라미터가 아니라 TV-L1류 고전 알고리즘의 출력이라, 시간 스트림이 배우는 것은 "flow를 어떻게 해석할지"이지 "움직임을 어떻게 관측할지"가 아니다. flow 계산 자체가 프레임마다 무겁고 저장 공간도 크다(위 UCF-101 27GB).',
 '**단일 프레임(공간 스트림)만으로도 73%라는 꽤 높은 정확도가 나온다.** 이는 UCF-101 같은 데이터셋의 상당수 클래스가 배경·장면만으로 구분 가능함을 시사하며, 훗날 Kinetics류 대규모 벤치마크에서도 "장면이 곧 클래스 힌트"라는 **외형 편향(appearance bias)** 논쟁으로 이어진다.',
 '**두 스트림을 완전연결층 단계에서 합치는 것은 이 논문에서 실패했다.** 데이터가 작아 과적합이 심해 softmax 점수만 사후 융합했다는 점을 놓치면, "당연히 특징을 합치는 게 낫다"고 오해하기 쉽다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'위: 공간(RGB 단일 프레임) 스트림, 아래: 시간(multi-frame optical flow) 스트림. 두 ConvNet은 층 구성(conv1~conv5, full6, full7, softmax)이 동일하지만 입력과 가중치가 완전히 다르고, 오른쪽 "class score fusion"에서 두 softmax만 합쳐진다 — 특징 레벨이 아니라 점수 레벨 융합인 점이 핵심.',
  src:'원문 Figure 1, p.3'},
 {f:'fig2-opticalflow.png',
  cap:'(a)(b) 연속 두 프레임, (c) 그 영역의 dense optical flow 벡터장 확대, (d)(e) 각각 수평·수직 변위 성분을 이미지 채널처럼 시각화한 것. (d)(e)에서 밝기 변화가 움직이는 손과 활만 도드라지게 잡아내는 것을 볼 수 있다 — 이것이 시간 스트림이 실제로 받는 입력의 형태다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'We investigate architectures of discriminatively trained deep Convolutional Networks (ConvNets) for action recognition in video. The challenge is to capture the complementary information on appearance from still frames and motion between frames.',
  src:'Abstract, p.1'},
 {t:'Such input explicitly describes the motion between video frames, which makes the recognition easier, as the network does not need to estimate motion implicitly.',
  src:'Section 3, p.3'}
],

links:[
 {t:'arXiv 1406.2199 — Two-Stream Convolutional Networks for Action Recognition in Videos', u:'https://arxiv.org/abs/1406.2199'},
 {t:'UCF-101 Dataset', u:'https://www.crcv.ucf.edu/data/UCF101.php'}
]
});
