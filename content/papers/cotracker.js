WIKI.paper({
slug:'cotracker',
venue:'ECCV 2024 (arXiv 2023)',
authors:'Karaev et al. (Meta AI · Oxford VGG)',
arxiv:'2307.07635',

tldr:'점들을 하나씩 독립적으로 추적하던 [PIPs](#/p/pips)·[TAPIR](#/p/tapir)와 달리, 시간 × 트랙 격자 위의 transformer로 **많은 점을 함께 추적**하는 CoTracker. 점 사이의 상관(같은 물체에 속함 등)을 attention으로 활용하고, proxy token으로 7만 개 점까지 한 GPU에서 처리한다.',

context:'TAP 계열 추적기들은 점을 서로 독립인 통계적 대상으로 취급했다. TAPIR와 PIPs++ 같은 최신 모델도 transformer를 쓰지만 점마다 따로 추적한다. 그런데 한 물체에 속한 점이나 같은 배경 위의 점은 움직임이 강하게 묶여 있고, 한 점이 가려졌을 때 이웃 점의 움직임이 단서가 될 수 있다. [PIPs](#/p/pips) 원문도 점별 독립 추정을 한계로 적어 두었다. CoTracker의 가설은 "점들 사이의 의존성을 쓰면 정확도가 오른다"는 것이다.',

ideas:[
 {h:'시간 × 트랙 토큰 격자 위의 joint 추적',
  lead:'트랙 $i$ 와 시간 $t$ 마다 토큰 하나를 두고, 시간 attention과 트랙 attention을 번갈아 적용한다.',
  d:'토큰 $G^i_t$ 에는 상대 위치, 가시성, 트랙 외형 특징 $Q$, RAFT식 상관 특징 $C$ 와 위치 인코딩이 들어간다. attention을 시간과 트랙 차원으로 분해하면 복잡도가 $O(N^2T^2)$ 에서 $O(N^2+T^2)$ 로 줄어 현실적이 된다. 트랙 attention 덕에 점들이 정보를 교환한다. Fig. 2에서 독립 추적은 배경 점이 물체를 따라가는 오류를 보인다.'},
 {h:'proxy token으로 attention 비용 축소',
  lead:'학습된 proxy 트랙 $K$개(≪ $N$)를 넣어 트랙 간 self-attention을 proxy와의 cross-attention으로 바꾼다.',
  d:'일반 트랙은 서로가 아니라 proxy에만 cross-attend하므로 트랙 attention 비용이 $O(NK+K^2+T^2)$ 로 준다. proxy는 입력에 이어 붙였다가 출력에서 버린다. 원문은 이를 register와 비슷하게 일반 트랙의 계산을 따라가는 토큰이라고 설명한다. 80GB GPU에서 proxy가 없으면 약 9.4k 트랙이 한계지만 proxy를 쓰면 69.2k 트랙까지 올라간다.'},
 {h:'슬라이딩 윈도 + 펼친(unrolled) 학습',
  lead:'윈도 길이는 8프레임이지만 윈도들을 순환 신경망처럼 이어 학습해 긴 가려짐을 견딘다.',
  d:'긴 영상은 절반씩 겹치는 윈도로 나눠 처리하고, 다음 윈도는 이전 윈도의 최종 추정으로 초기화한다. 학습 때도 여러 윈도를 펼쳐 모든 윈도와 모든 transformer 반복에 걸쳐 손실을 합산한다. 이 방식으로 윈도 8프레임짜리 모델이 가림이 윈도보다 길어도 점을 유지한다. 펼친 학습을 끄면 DAVIS First에서 AJ가 62.2에서 44.6으로 떨어진다.'},
 {h:'서포트 포인트: 요청하지 않은 점을 같이 추적',
  lead:'추적하려는 점이 하나뿐이어도 주변과 전체에 격자 점을 추가로 넣어 문맥을 준다.',
  d:'추론 시에만 쓰는 전략이다. 점을 전체 이미지에 격자로 깔면(global) 카메라 움직임, 대상 주변에 깔면(local) 같은 물체의 움직임을 문맥으로 쓸 수 있다. 원문 실험에서 local이 global보다 훨씬 효과가 크고, 둘을 합친 구성이 가장 좋다. TAP-Vid는 한 번에 한 점만 평가하도록 규정해 정답 점 여러 개가 물체 윤곽을 누설하지 않게 한다.'}
],

diagram:{type:'compare', cap:'독립 추적과 CoTracker의 joint 추적 차이.',
 left:{t:'기존: 점별 독립 추적', items:['점마다 따로 궤적 추정','이웃 점의 단서를 못 씀','배경 점이 물체를 따라가기도','점이 많으면 비용도 선형 증가']},
 right:{t:'CoTracker: joint', items:['시간×트랙 토큰 격자','트랙 간 attention 교환','proxy token으로 7만 점','윈도 8, 펼친 학습']}},

math:[
 {expr:'L1 = Σ_j Σ_m γ^(M−m) ‖P̂^(m,j) − P^(j)‖,  γ=0.8',
  tex:'\\mathcal{L}_1=\\sum_{j=1}^{J}\\sum_{m=1}^{M}\\gamma^{M-m}\\,\\lVert \\hat P^{(m,j)}-P^{(j)}\\rVert,\\quad \\gamma=0.8',
  d:'윈도 $j$ 와 transformer 반복 $m$ 에 걸친 합이다. 초기 반복의 오차에는 $\\gamma$ 로 가중을 낮춘다. 여러 윈도를 이어 학습하는 부분이 펼친(unrolled) 학습이고, 가시성에는 별도의 cross entropy를 쓴다.'},
 {expr:'복잡도: O(N²T²) → O(N²+T²) → O(NK+K²+T²)',
  tex:'O(N^2T^2)\\;\\to\\;O(N^2+T^2)\\;\\to\\;O(NK+K^2+T^2)',
  d:'전체 attention, 시간·트랙 분해 attention, proxy 도입 후의 비용이다. $N$ 은 트랙 수, $T$ 는 윈도 길이, $K$ 는 proxy 수다.'}
],

numbers:[
 {k:'TAP-Vid-DAVIS First · AJ / δvis / OA', v:'CoTracker 62.2 / 75.7 / 89.3, TAPIR 56.2 / 70.0 / 86.5', d:'Table 1. 둘 다 Kubric으로 학습. 같은 표에서 TAP-Net 33.0, PIPs 42.2'},
 {k:'TAP-Vid-DAVIS Strided · AJ', v:'CoTracker 65.9, TAPIR 61.3', d:'Table 1. 5프레임마다 질의하는 양방향 프로토콜. CoTracker는 인과적이라 영상과 역재생 영상에서 두 번 돌린다'},
 {k:'TAP-Vid-RGB-Stacking First · AJ', v:'CoTracker 71.6, OmniMotion 69.5, TAPIR 60.3', d:'Table 1. 5프레임에 하나만 남기는 프레임율 감소를 적용해 평가'},
 {k:'joint 추적 효과 (Dynamic Replica, δocc)', v:'28.8 → 37.6 (δvis 62.4 → 68.9)', d:'Table 4. 같은 크기로 맞춰 트랙 attention만 시간 attention으로 대체해 비교. 가려진 점에서 이득이 더 큼'},
 {k:'proxy token (80GB GPU)', v:'최대 9.4k → 69.2k 트랙, 207.3초 → 27.9초', d:'Table 6. proxy 64개 구성. 원문은 7.4배 많은 점, 약 7배 빠른 추론이라고 요약'},
 {k:'학습 설정', v:'Kubric 6,000 시퀀스, 50,000 iter, A100 32장, 40시간', d:'윈도 T=8, 학습 트랙 수 768. 서포트 점 없이 DAVIS 한 점 추적 AJ 55.6, local+global 서포트 62.2(Table 7)'}
],

impact:'CoTracker는 점 추적을 "독립 점 N개"에서 "서로 의존하는 점 집합"의 문제로 바꿨다. 점이 늘수록 비용이 폭증한다는 장벽을 proxy token으로 낮춰, 준 밀집(quasi-dense) 추적을 한 GPU에서 가능하게 했다. [TAP-Vid](#/p/tap-vid)·PointOdyssey·Dynamic Replica에서 [TAPIR](#/p/tapir)와 PIPs++를 앞섰다. 다만 합성 데이터만으로 학습해 그림자까지 따라가는 한계를 원문이 인정한다.',

legacy:[
 '**CoTracker3**가 같은 구조를 단순화하고 실제 영상 의사 라벨로 학습해 성능과 데이터 효율을 높임',
 '**TAPNext**는 CoTracker의 윈도 방식 대신 순차 토큰 예측으로 추적을 다시 정식화',
 '**서포트 포인트** 평가 방식을 TAPNext가 "CoTracker와 같이" 그대로 채택',
 '**3D 복원과 연결**하는 방향을 원문이 결론에서 후속 과제로 제시'
],

pitfalls:[
 '**CoTracker는 인과(online) 모델이다.** TAP-Vid strided 평가에서는 영상을 정방향과 역방향으로 두 번 돌려야 하고, 느린 움직임의 긴 영상(RGB-Stacking)에서 불리해 프레임율을 낮춰 평가했다.',
 '**joint의 이득은 함께 넣는 점 구성에 달려 있다.** 점 하나만 추적해도 서포트 점을 추가해야 성능이 나오며, 구성(global/local)에 따라 AJ가 56.8에서 62.2까지 달라진다.',
 '**합성 데이터(Kubric) 학습의 한계가 그대로 남는다.** 반사와 그림자가 있는 복잡한 장면에서 그림자를 물체와 함께 따라가는 오류가 생긴다고 원문이 적는다.'
],

figures:[
 {f:'fig2-joint-vs-separate.png',
  cap:'위 줄은 점을 따로 추적한 결과(Separate), 아래 줄은 함께 추적한 결과(Joint)다. 하늘색이 배경 점, 자홍색이 물체 점이다. 위 줄은 뒤 프레임에서 배경 점이 움직이는 물체를 따라 번지지만 아래 줄은 배경이 제자리에 남는다.',
  src:'원문 Figure 2, p.3'},
 {f:'fig3-architecture.png',
  cap:'질의 시작 위치 P를 시간축으로 복제해 초기 트랙을 만들고, 첫 프레임 특징을 샘플해 트랙 특징 Q를 만든다. 아래 점선은 서로 절반씩 겹치는 슬라이딩 윈도 1~3으로, 영상 전체가 윈도 단위로 처리된다.',
  src:'원문 Figure 3, p.5'}
],

quotes:[
 {t:'We hypothesise that accounting for the dependency between tracked points can significantly improve tracking performance.',
  src:'1절 Introduction, p.2'}
],

links:[
 {t:'arXiv 2307.07635 — CoTracker', u:'https://arxiv.org/abs/2307.07635'},
 {t:'GitHub — facebookresearch/co-tracker', u:'https://github.com/facebookresearch/co-tracker'},
 {t:'프로젝트 페이지', u:'https://co-tracker.github.io/'}
]
});
