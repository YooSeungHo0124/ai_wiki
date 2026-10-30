WIKI.paper({
slug:'cotracker3',
venue:'arXiv 2024',
authors:'Karaev et al. (Meta AI · Oxford VGG)',
arxiv:'2410.11831',

tldr:'[CoTracker](#/p/cotracker)의 구조에서 전역 매칭 단계를 빼고 상관 특징 처리를 단순화한 모델에, 합성 데이터로만 학습한 여러 추적기를 **교사**로 삼아 라벨 없는 실제 영상에 의사 라벨을 붙여 학습하는 간단한 절차를 더했다. 실제 영상 15k개만으로 15M개를 쓴 BootsTAPIR를 TAP-Vid 평균에서 앞선다.',

context:'점 추적기는 실제 영상에 라벨을 달기 어려워 대부분 합성 데이터(Kubric)로만 학습한다. 합성과 실제 사이의 통계적 간극이 남아 있다는 뜻이다. BootsTAPIR는 라벨 없는 실제 영상 1,500만 개로 자기학습(self-training)을 해서 TAP-Vid 최고 성능을 냈지만, 증강·손실 마스크·EMA를 쓰는 복잡한 절차였다. 그 데이터량이 정말 필요한지, 그리고 TAPIR·CoTracker·LocoTrack이 각자 넣은 구성 요소가 모두 필수인지도 불분명했다. 이 논문은 두 질문에 모두 답하려는 시도다.',

ideas:[
 {h:'여러 교사로 의사 라벨을 만드는 단순한 절차',
  lead:'합성 데이터로만 학습한 추적기들이 실제 영상에 만든 궤적을 학생의 정답으로 쓴다.',
  d:'교사는 CoTracker3 온라인·오프라인, CoTracker, TAPIR 네 개이고 모두 Kubric으로만 학습했다. 배치마다 교사를 하나 무작위로 고르고 고정(frozen)한 채 라벨을 만들어 과적합을 막는다. 학생이 교사보다 나아지는 이유로 원문은 더 큰 (잡음 섞인) 데이터, 합성-실제 분포 이동 완화, 여러 교사의 앙상블 효과, 교사별 장점 상속을 든다. BootsTAPIR와 달리 증강, 마스크, EMA, 합성 정답 감독이 필요 없다.'},
 {h:'SIFT로 고른 질의 점',
  lead:'추적하기 좋은 점만 질의로 쓰도록 SIFT 검출기로 키프레임에서 점을 뽑는다.',
  d:'영상에서 무작위로 몇 프레임을 고르고 SIFT로 질의 점을 만든다. SIFT가 충분한 점을 못 찾는 영상은 통째로 학습에서 뺀다. 저자들은 모호한 장면에서 검출이 실패하는 것이 어려운 점을 걸러내는 필터가 된다고 가정한다. Table 6에서 균일·SuperPoint·DISK와 큰 차이는 없으나 SIFT가 데이터셋 전반에서 꾸준히 높았다.'},
 {h:'단순해진 모델: 4D 상관 + MLP, 전역 매칭 제거',
  lead:'LocoTrack의 4D 상관 아이디어를 쓰되 MLP 하나로 처리하고, 전역 매칭 모듈은 없앤다.',
  d:'질의 점 주변 특징과 현재 궤적 주변 특징의 $(2\\Delta+1)^4$ 상관을 4개 스케일에서 뽑아 MLP로 차원을 줄인다. 토큰은 변위의 푸리에 임베딩, 신뢰도, 가시성, 상관 특징만으로 구성한다. 가시성도 매 반복에서 함께 갱신한다. 파라미터는 CoTracker의 45M에서 25M으로 줄었다. 원문은 TAPIR·BootsTAPIR·LocoTrack의 전역 매칭 모듈이 중복이라고 본다.'},
 {h:'온라인·오프라인 두 변형과 joint 추적 유지',
  lead:'같은 구조를 학습 방식만 바꿔 슬라이딩 윈도(온라인)와 단일 윈도(오프라인)로 쓴다.',
  d:'온라인은 윈도를 절반씩 밀며 앞으로만 추적해 실시간으로 무한히 이어 갈 수 있다. 오프라인은 영상 전체를 한 윈도로 보고 양방향으로 추적하며 메모리가 길이를 제한한다. 오프라인은 가려진 점을 앞뒤 프레임으로 보간할 수 있어 가림 구간에서 유리하다. 트랙 간 cross attention으로 이웃 점에서 가려진 점의 위치를 추정하는 CoTracker의 장점도 그대로다.'},
 {h:'데이터 스케일링 관찰',
  lead:'의사 라벨 영상을 100개부터 100k개까지 늘리며 성능 곡선을 처음 그렸다.',
  d:'0.1k 영상만으로도 모든 모델이 좋아지고 CoTracker3와 LocoTrack은 약 30k 이후 정체한다. 학생이 교사를 넘어섰기 때문일 것이라고 원문이 추정한다. 약한 교사들에게 배운 CoTracker는 100k까지 계속 오른다. 학생이 자기 예측으로만 학습하는 self-training도 TAP-Vid 평균 +1.2점을 준다.'}
],

diagram:{type:'flow', cap:'의사 라벨 학습의 흐름. 합성 데이터로 학습한 교사들이 만든 궤적으로 학생을 실제 영상에서 미세조정한다.',
 nodes:[
  {t:'합성 사전학습', s:'Kubric만 사용'},
  {t:'교사 4종', s:'온·오프라인 등'},
  {t:'실제 영상', s:'SIFT 질의 점'},
  {t:'의사 라벨', s:'교사 무작위 선택', acc:true, a:'라벨링'},
  {t:'학생 미세조정', s:'궤적 손실만'}
 ]},

math:[
 {expr:'L_track = Σ_m γ^(M−m) (1_occ/5 + 1_vis) Huber(P^(m), P*),  γ=0.8',
  tex:'\\mathcal{L}_{\\text{track}}=\\sum_{m=1}^{M}\\gamma^{M-m}\\Big(\\tfrac{1}{5}\\mathbb{1}_{occ}+\\mathbb{1}_{vis}\\Big)\\,\\mathrm{Huber}\\big(P^{(m)},P^{\\star}\\big),\\quad \\gamma=0.8',
  d:'Huber 임계값은 6이다. 가려진 점의 손실에는 1/5 가중만 줘 보이는 점을 우선한다. 의사 라벨 학습에서도 이 손실을 그대로 쓰되 신뢰도·가시성은 감독하지 않는다.'},
 {expr:'L_conf = Σ_m γ^(M−m) CE(σ(C^(m)), 1[‖P^(m) − P*‖₂ < 12])',
  tex:'\\mathcal{L}_{\\text{conf}}=\\sum_{m=1}^{M}\\gamma^{M-m}\\,\\mathrm{CE}\\Big(\\sigma(C^{(m)}),\\,\\mathbb{1}\\big[\\lVert P^{(m)}-P^{\\star}\\rVert_2<12\\big]\\Big)',
  d:'신뢰도는 예측이 정답에서 12픽셀 안에 있는지를 맞추도록 학습한다. TAPIR의 불확실도와 같은 역할이다. 평가에서는 예측 가시성에 신뢰도를 곱해 임계값을 적용한다.'}
],

numbers:[
 {k:'TAP-Vid AJ · CoTracker3 온라인(Kub+15k) Kinetics / RGB-S / DAVIS', v:'55.8 / 71.7 / 63.8', d:'Table 1. BootsTAPIR(Kub+15M)는 54.6 / 70.8 / 61.4. 오프라인 Kub+15k는 54.7 / 74.3 / 64.4'},
 {k:'TAP-Vid 평균 δvis', v:'온라인 76.1 · 오프라인 76.6 · BootsTAPIR 75.0', d:'Table 1 마지막 열. 합성(Kub)만 학습한 CoTracker3는 75.1 / 75.9, LocoTrack 75.1'},
 {k:'Dynamic Replica δocc (가려진 점 정확도)', v:'CoTracker3 온라인(Kub) 41.0 · +15k 오프라인 42.3 · LocoTrack 29.8 · BootsTAPIR 28.0', d:'Table 2. 가려진 점은 joint 추적을 하는 모델이 크게 앞선다'},
 {k:'cross-track attention 제거 효과 (δocc)', v:'35.9 → 41.0 (δvis 71.3 → 72.9)', d:'Table 3. 가림 점 +5.1, 보이는 점 +1.6'},
 {k:'교사 구성 (온라인 학생, 10k 영상 TAP-Vid 평균 AJ)', v:'합성만 62.2 → 자기학습 63.5 → 교사 4종 64.0', d:'Table 4·5. δavg는 74.5 → 75.7 → 76.8. 교사를 하나 뺄 때마다 모두 나빠진다고 원문이 설명'},
 {k:'모델 크기·속도', v:'25M 파라미터(CoTracker 45M), 점·프레임당 온라인 405µs · 오프라인 209µs', d:'Table 2. 같은 표의 LocoTrack은 12M, 290µs. 원문 본문은 LocoTrack보다 27% 빠르다고 적는다'}
],

impact:'CoTracker3는 점 추적에서 데이터의 역할을 다시 보게 했다. 라벨 없는 실제 영상을 수만 개 수준으로 쓰는 단순한 증류(distillation)만으로 수천만 개 영상을 쓴 복잡한 자기학습을 넘을 수 있음을 보였다. 동시에 전역 매칭 같은 부품이 필수가 아님을 보이며 [CoTracker](#/p/cotracker) 구조를 가볍게 만들었다. 합성 학습의 한계는 데이터 규모가 아니라 합성-실제 간극에 있다는 해석을 뒷받침한다.',

legacy:[
 '**TAPNext**가 CoTracker3와 TAPIR를 직접 비교 대상으로 삼아 더 단순한 구조로 추적을 재정식화',
 '**TAPNext**가 실제 영상 의사 라벨 학습이 여러 프레임워크에서 유익했다는 근거로 CoTracker3를 인용',
 '**온라인·오프라인 이중 변형**이 실시간 응용과 정밀 후처리 용도를 나눠 쓰는 관행으로 이어짐',
 '**3D 추적, 영상 편집, 동적 3D 복원**의 빌딩 블록으로 쓰일 수 있다고 원문이 결론에서 제시'
],

pitfalls:[
 '**교사가 합성 데이터만으로 학습했는데 학생이 더 낫다고 해서 마법이 아니다.** 원문은 더 큰 데이터, 도메인 간극 완화, 앙상블 효과 같은 이유를 들고, 교사 구성을 줄이면 성능이 내려간다고 보인다.',
 '**온라인·오프라인의 이득이 지표마다 다르다.** 15k 영상 추가 후 오프라인은 DAVIS·RGB-S에서 더 낫지만 Kinetics와 RoboTAP에서는 온라인이 낫다. 가려진 점 개선은 오프라인에서만 나타났다.',
 '**실제 영상 학습에서는 신뢰도·가시성 헤드를 얼려야 한다.** 궤적만 감독하면 이 예측들을 잊는다. 별도 선형 헤드를 두고 고정하면 TAP-Vid 평균 AJ +0.8, OA +3.9 개선(Table 7).'
],

figures:[
 {f:'fig1-scaling.png',
  cap:'왼쪽은 x축이 미세조정에 쓴 실제 영상 수(로그 눈금), y축이 TAP-Vid 평균 정확도다. 삼각형이 의사 라벨로 학습한 모델이고 오른쪽 하늘색 점이 1,500만 영상을 쓴 BootsTAPIR다. 오른쪽 영상은 두 번의 가림을 지나는 궤적으로, BootsTAPIR와 LocoTrack은 가림 뒤에 어긋나지만 오프라인 CoTracker3는 이어 간다.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-architecture.png',
  cap:'트랙·신뢰도·가시성을 질의 값과 0으로 초기화하고, 질의 프레임 특징과 각 프레임 특징의 상관(Corr)을 transformer에 넣어 잔차 갱신을 M번 반복한다. 가시성도 같은 루프에서 갱신되고 마지막에 시그모이드를 거친다.',
  src:'원문 Figure 2, p.5'}
],

quotes:[
 {t:'Our new model and training protocol outperform SoTA by a large margin using only 0.1% of the training data.',
  src:'Figure 1 캡션, p.1'}
],

links:[
 {t:'arXiv 2410.11831 — CoTracker3', u:'https://arxiv.org/abs/2410.11831'},
 {t:'GitHub — facebookresearch/co-tracker', u:'https://github.com/facebookresearch/co-tracker'},
 {t:'프로젝트 페이지', u:'https://cotracker3.github.io'}
]
});
