WIKI.paper({
slug:'ucf101',
venue:'CRCV-TR-12-01 (arXiv-only 기술보고서)',
authors:'Soomro, Zamir, Shah (University of Central Florida, CRCV)',
arxiv:'1212.0402',

tldr:'유튜브에서 모은 101개 행동 클래스·13,320개 클립을 묶은 데이터셋. 통제된 환경에서 배우가 연기하던 기존 행동 인식 데이터셋을 **실제 웹 영상**으로 옮기고 클래스 수를 두 배로 늘려, 이후 10년간 비디오 이해 모델의 사실상 표준 벤치마크가 됐다.',

context:'2012년 이전 행동 인식 데이터셋은 두 문제를 안고 있었다. 하나는 **클래스 수가 너무 적다**는 것 — KTH는 6개, Weizmann은 9개, IXMAS는 11개뿐이라 사람이 실제로 하는 행동의 다양성을 대표하지 못했다. 다른 하나는 **비현실적으로 통제된 촬영**이다 — KTH·Weizmann·IXMAS는 배우가 스튜디오에서 연기했고, HOHA·UCF Sports는 영화·TV의 전문 촬영 클립이라 카메라 흔들림·어수선한 배경 같은 실제 조건이 빠져 있었다. 저자들의 이전 데이터셋인 UCF50(50클래스, 6,681클립)이 첫 문제를 부분적으로 풀었지만, [ImageNet](#/p/imagenet)이 이미지 분류에서 그랬듯 비디오 쪽에도 **규모와 현실성을 동시에 키운** 데이터셋이 필요했다.',

ideas:[
 {h:'유튜브 원본 영상 그대로 사용',
  lead:'배우 연기가 아니라 사용자가 올린 실제 웹 영상을 그대로 수집한다.',
  d:'모든 클립을 유튜브에서 다운로드하고 관련 없는 것만 수동으로 걸러냈다. 카메라 흔들림, 다양한 조명, 부분 가림, 저화질 프레임이 그대로 포함되어 — 스튜디오 데이터셋과 달리 **실제 배포 환경의 잡음**을 재현한다.'},
 {h:'101개 클래스를 5가지 상위 유형으로 조직화',
  lead:'Human-Object/Body-Motion/Human-Human/악기연주/스포츠 5범주로 클래스를 나눠 다양성을 설계한다.',
  d:'Human-Object Interaction, Body-Motion Only, Human-Human Interaction, Playing Musical Instruments, Sports 다섯 유형에 클래스를 배분했다. 단순 동작(Body-Motion)부터 도구 사용, 상호작용, 스포츠까지 포괄해 한 종류의 행동에 편중되지 않게 했다.'},
 {h:'클립을 25개 그룹으로 묶어 배경 편향을 통제',
  lead:'같은 배경·인물을 공유하는 클립을 그룹으로 묶어, 그룹 단위 교차검증을 표준 프로토콜로 못박는다.',
  d:'클래스당 클립을 25개 그룹(그룹당 4~7클립)으로 나눴고, 한 그룹 안의 클립들은 배경이나 등장인물 같은 공통 요소를 공유한다. 저자들은 **25-fold leave-one-group-out** 교차검증을 권장 프로토콜로 제시해, 같은 배경이 학습·평가 양쪽에 섞여 점수가 부풀려지는 것을 막으려 했다.'},
 {h:'표준 Bag-of-Words 베이스라인으로 난이도를 실측',
  lead:'Harris3D+HOG/HOF 특징을 4000단어 코드북으로 양자화해 SVM으로 분류, 44.5% 정확도를 기준선으로 제시한다.',
  d:'클립마다 Harris3D 시공간 코너를 뽑아 162차원 HOG/HOF 기술자를 계산하고, k=4000 코드북으로 히스토그램화한 뒤 histogram-intersection 커널 SVM으로 101개 클래스를 분류했다. 결과 44.5%는 당시로선 **가장 어려운 행동 인식 벤치마크**임을 스스로 증명하는 숫자였다.'}
],

diagram:{type:'compare', cap:'기존 스튜디오/영화 데이터셋과 UCF101의 근본적 차이.',
 left:{t:'기존: 통제된 촬영', items:['배우가 스튜디오에서 연기(KTH·Weizmann)','영화·TV 전문 촬영(HOHA)','6~11개 클래스로 다양성 부족']},
 right:{t:'UCF101: 실제 웹 영상', items:['유튜브 사용자 업로드 그대로 수집','카메라 흔들림·잡음 배경 포함','101개 클래스 · 13,320클립']}},

math:[],

numbers:[
 {k:'행동 클래스', v:'101개', d:'직전 최대였던 HMDB51(51개)의 약 2배'},
 {k:'클립 수', v:'13,320개', d:'HMDB51(6,766) · UCF50(6,681) 대비 약 2배'},
 {k:'총 영상 길이', v:'27시간 (약 1,600분)', d:'평균 클립 길이 7.21초 · 최대 71.04초'},
 {k:'해상도 · 프레임레이트', v:'320×240 · 25fps', d:'DivX 코덱 .avi'},
 {k:'그룹 구조', v:'클래스당 25그룹 · 그룹당 4~7클립', d:'같은 배경/인물을 공유 — 그룹 단위 25-fold 교차검증 권장'},
 {k:'BoW 베이스라인 정확도', v:'44.5%', d:'Harris3D+HOG/HOF, k=4000 코드북, SVM'}
],

impact:'행동 인식 연구가 스튜디오 데이터에서 **웹 규모의 현실적 영상**으로 옮겨가는 전환점이 됐다. [Two-Stream](#/p/two-stream) 네트워크 이후 딥러닝 기반 행동 인식 모델들이 하나같이 UCF101을 1차 벤치마크로 채택했고, 클래스 101개·클립 13,320개라는 규모는 이후 몇 년간 "행동 인식판 [ImageNet](#/p/imagenet)"으로 불릴 만큼 표준 지위를 얻었다. 다만 이 지위는 오래가지 못했는데, 클립 대부분이 배경이나 정지 프레임만으로도 분류 가능한 **외형 편향**을 갖고 있다는 것이 곧 드러났기 때문이다.',

legacy:[
 '**딥러닝 행동 인식의 표준 벤치마크** — [Two-Stream](#/p/two-stream)(2014), [I3D](#/p/i3d)(2017), [SlowFast](#/p/slowfast)(2019)가 모두 UCF101에서 성능을 보고하며 계보를 이었다',
 '**외형 편향 비판이 Kinetics를 낳음** — 한 프레임만 봐도 상당수 클래스를 맞힐 수 있다는 지적이 이어지며, 시간적 동작 자체를 요구하는 더 큰 규모의 [Kinetics](#/p/kinetics) 데이터셋(2017)이 그 대안으로 제시됐다',
 '**사전학습 전이의 표준 타깃** — [I3D](#/p/i3d)의 ImageNet-Kinetics 사전학습이나 [VideoMAE](#/p/videomae)의 self-supervised 사전학습 모두 UCF101 fine-tuning 정확도로 성능을 검증한다',
 '**생성 모델 평가에도 재사용** — [Stable Video Diffusion](#/p/svd)류의 비디오 생성 모델은 UCF101 클래스 분포·FVD 계산에 이 데이터셋을 그대로 활용한다'
],

pitfalls:[
 '**단일 프레임 외형만으로도 상당수를 맞힐 수 있다.** "Playing Guitar"는 기타가 보이는 것만으로, "Sky Diving"은 하늘 배경만으로 분류가 되는 클래스가 많아, 모델이 실제 **시간적 동작**을 학습했는지 검증하기 어렵다. 이 한계가 Kinetics 등장의 직접적 계기다.',
 '**그룹 단위 분할을 무시하면 점수가 부풀려진다.** 같은 그룹의 클립은 배경·인물을 공유하므로, 그룹을 섞어 무작위 분할하면 모델이 배경을 외워 실제보다 높은 정확도가 나온다. 저자가 권장한 25-fold leave-one-group-out을 지켜야 공정한 비교가 된다.',
 '**규모가 이미지 데이터셋보다 훨씬 작다.** 13,320클립은 이미지 수백만 장 규모의 [ImageNet](#/p/imagenet)에 비하면 작아서, 대형 비디오 모델을 처음부터(from scratch) 학습시키기엔 부족하며 대개 이미지·다른 비디오 데이터로 사전학습한 뒤 fine-tuning용으로 쓴다.'
],

figures:[
 {f:'fig1-samples.png',
  cap:'6개 클래스의 샘플 프레임. 배경·조명·카메라 앵글이 서로 완전히 다른 실제 유튜브 영상 그대로라는 점이 스튜디오 데이터셋과의 차이다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'We introduce UCF101 which is currently the largest dataset of human actions. It consists of 101 action classes, over 13k clips and 27 hours of video data.',
  src:'Abstract, p.1'},
 {t:'The database consists of realistic user-uploaded videos containing camera motion and cluttered background.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1212.0402 — UCF101', u:'https://arxiv.org/abs/1212.0402'},
 {t:'UCF101 공식 데이터셋 페이지', u:'https://www.crcv.ucf.edu/data/UCF101.php'}
]
});
