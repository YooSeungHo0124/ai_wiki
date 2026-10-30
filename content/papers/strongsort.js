WIKI.paper({
slug:'strongsort',
venue:'IEEE TMM 2023 (arXiv 2022)',
authors:'Du et al. (BUPT · Shanghai AI Lab · Brunel Univ.)',
arxiv:'2202.13514',

tldr:'[DeepSORT](#/p/deepsort)의 뼈대는 그대로 두고 검출기·외형 모델·추론 요령을 최신으로 갈아 끼워 만든 **강한 기준선**. 여기에 외형 정보 없이 트랙릿을 잇는 **AFLink**와 가우시안 과정 회귀 보간 **GSI**를 플러그인으로 붙인 것이 StrongSORT++다.',

context:'2021년 무렵 MOT 리더보드는 [ByteTrack](#/p/bytetrack)처럼 외형 모델을 버리고 검출기 성능과 모션 정보만으로 달리는 트래커가 장악하고 있었다. 저자들은 DeepSORT가 뒤처진 이유가 "연관 패러다임"이 아니라 낡은 부품(Faster R-CNN, 작은 CNN)에 있다고 본다. 게다가 논문마다 검출기·ReID 모델·외부 학습 데이터·추론 요령이 제각각이라 공정한 비교 자체가 어렵다는 문제도 있었다. 저자들은 DeepSORT를 현대화한 기준선을 하나 정하고, 온라인 트래커가 구조적으로 못 푸는 두 가지 "missing" 문제(같은 사람이 여러 트랙으로 갈라지는 missing association, 가려짐으로 놓치는 missing detection)를 별도 플러그인으로 다룬다.',

ideas:[
 {h:'DeepSORT 현대화: 부품 교체와 추론 요령',
  lead:'YOLOX-X 검출기와 BoT 외형 모델로 바꾸고 EMA·ECC·NSA 칼만을 얹는다.',
  d:'검출기는 YOLOX-X, 외형 특징 추출기는 BoT(ResNeSt50 백본)로 교체한다. 특징 뱅크(최근 100프레임 저장)는 EMA $e_i^t=\\alpha e_i^{t-1}+(1-\\alpha)f_i^t$ ($\\alpha=0.9$)로 대체해 검출 노이즈에 덜 민감하면서 더 빠르게 만든다. 카메라 움직임은 ECC 영상 정합으로 보정하고, 칼만 필터의 측정 잡음은 검출 confidence에 따라 $\\tilde R_k=(1-c_k)R_k$ 로 조절한다(NSA Kalman, GIAOTracker에서 차용). 논문은 이 절에서 알고리즘적 새로움을 주장하지 않는다고 명시한다.'},
 {h:'외형+모션 비용 합산, 매칭 캐스케이드 제거',
  lead:'모션을 게이트로만 쓰던 것을 비용에 섞고, 캐스케이드를 일반 전역 할당으로 바꾼다.',
  d:'DeepSORT는 첫 연관 단계에서 외형 거리만 비용으로 쓰고 마할라노비스 거리는 게이트로만 썼다. StrongSORT는 $C=\\lambda A_a+(1-\\lambda)A_m$ ($\\lambda=0.98$)으로 둘을 합친다. 또 자주 보인 트랙에 우선권을 주는 matching cascade가 트래커가 강해질수록 오히려 발목을 잡는다는 것을 확인하고, 단순 헝가리안 전역 할당으로 되돌린다.'},
 {h:'AFLink: 외형 없는 트랙릿 연결 모델',
  lead:'두 트랙릿의 (프레임, x, y) 궤적만 보고 같은 ID인지 분류하는 작은 CNN이다.',
  d:'입력은 각 트랙릿의 최근 $N=30$ 프레임 $\\{f_k,x_k,y_k\\}$ 이다. 시간축 7×1 합성곱 4층(채널 32·64·128·256)과 특징축 1×3 합성곱 1층을 두 가지(가중치 비공유) 거쳐 풀링·결합한 뒤 MLP가 연결 점수를 낸다. 추론에서는 시간 간격 30프레임·거리 75픽셀 이내의 쌍만 후보로 두고, 점수가 0.95를 넘으면 연결한다. 학습은 MOT17에서 10여 초면 끝난다고 한다.'},
 {h:'GSI: 가우시안 과정으로 보간·평활',
  lead:'선형 보간 대신 궤적 전체에 가우시안 과정 회귀를 적용해 빈 구간과 떨림을 함께 고친다.',
  d:'각 좌표 $(x,y,w,h)$ 를 시간의 함수로 보고 RBF 커널의 가우시안 과정으로 적합해 $P^*=K(F^*,F)(K(F,F)+\\sigma^2I)^{-1}P$ 로 예측한다. 평활 정도 $\\lambda=\\tau\\log(\\tau^3/l)$ 은 궤적 길이 $l$ 에 따라 자동으로 정해지며 $\\tau=10$ 이다. 보간 가능한 최대 간격은 20프레임이다. 선형 보간은 속도가 심하게 요동치지만 GSI는 속도 곡선이 안정적이라 저자들은 속도 추정에도 쓸 수 있다고 주장한다.'}
],

diagram:{type:'compare', cap:'DeepSORT에서 StrongSORT로. 구조는 같고 부품과 연관 방식만 바뀐다. 뒤에 AFLink와 GSI가 후처리로 붙으면 StrongSORT++다.',
 left:{t:'DeepSORT', items:['Faster R-CNN + 작은 CNN','특징 뱅크 (100프레임)','칼만은 게이트로만 사용','매칭 캐스케이드']},
 right:{t:'StrongSORT++', items:['YOLOX-X + BoT 외형 모델','EMA 특징 갱신 + ECC','외형+모션 비용 합산','일반 전역 할당 + AFLink + GSI']}},

math:[
 {expr:'C = λ·Aa + (1−λ)·Am,  λ=0.98',
  tex:'C=\\lambda A_a+(1-\\lambda)A_m,\\quad \\lambda=0.98',
  d:'외형 비용 $A_a$ 와 모션 비용 $A_m$ 의 가중합. 외형 비중이 압도적이다. 모션은 비용의 2%만 차지하지만 게이트 역할도 병행한다.'},
 {expr:'R~k = (1 − ck)·Rk',
  tex:'\\tilde R_k=(1-c_k)R_k',
  d:'NSA 칼만. 검출 confidence $c_k$ 가 높을수록 측정 잡음 공분산이 작아져 칼만 이득이 커지고 관측이 상태에 더 크게 반영된다.'},
 {expr:'λ = τ·log(τ³ / l)',
  tex:'\\lambda=\\tau\\log(\\tau^{3}/l)',
  d:'GSI의 RBF 커널 길이 척도. 궤적 길이 $l$ 이 길수록 $\\lambda$ 가 작아진다. $\\tau$ 는 ablation으로 10으로 정했다.'}
],

numbers:[
 {k:'MOT17 val · DeepSORT → StrongSORT (IDF1/MOTA/HOTA)', v:'77.3/76.7/66.3 → 82.3/77.1/69.6', d:'Table I. IDF1 +5.0이 대부분이고 MOTA는 거의 그대로. 속도는 13.8 → 7.5 FPS로 느려졌다'},
 {k:'BoT 외형 모델 교체 효과 (MOT17 val)', v:'IDF1 +2.2', d:'Table I 첫 단계. 이후 EMA +0.4, 모션 비용 +0.8, 캐스케이드 제거 +1.4가 차례로 쌓인다'},
 {k:'캐스케이드 → 일반 매칭 (StrongSORTv5, IDF1)', v:'80.9 → 82.3', d:'Table III. 같은 교체가 원조 DeepSORT에서는 IDF1 77.3 → 76.2로 오히려 손해'},
 {k:'MOT17 test · StrongSORT++ HOTA/IDF1/MOTA', v:'64.4 / 79.5 / 79.6', d:'private detection. IDs 1,194, FPS 7.1. 같은 표의 StrongSORT 단독은 63.5/78.5/78.3'},
 {k:'MOT20 test · StrongSORT++ HOTA/IDF1/MOTA', v:'62.6 / 77.0 / 73.8', d:'IDs 770. 혼잡 장면에서도 IDF1이 StrongSORT 단독(75.9)보다 높다'},
 {k:'DanceTrack test · StrongSORT++ HOTA', v:'55.6', d:'같은 표 OC-SORT 55.1, ByteTrack 47.7. AFLink·GSI 추가 비용은 이미지당 1.7ms·7.1ms (MOT17)'}
],

impact:'StrongSORT는 "외형 모델을 쓰는 트래커는 구식"이라는 분위기에서, 부품만 좋아지면 DeepSORT 계열도 MOT17·MOT20 상위권에 설 수 있음을 보였다. 이후 [BoT-SORT](#/p/botsort)·[Deep OC-SORT](#/p/deepocsort) 등이 ECC 계열 카메라 보정과 EMA 외형 갱신을 기본 부품처럼 쓰게 된다. AFLink와 GSI는 어떤 트래커 뒤에도 붙는 후처리라 CenterTrack·TransTrack·FairMOT에서도 개선을 보였다(Table II). 논문 스스로 공정한 비교용 기준선을 만든다는 것이 첫째 목표였다.',

legacy:[
 '**[DeepSORT](#/p/deepsort)의 직계 후손** — 같은 2-브랜치(외형+모션) 구조를 유지한 채 부품과 연관 규칙만 현대화',
 '**EMA 외형 갱신·ECC 카메라 보정이 이후 ReID 결합 트래커의 표준 부품으로 퍼짐** — [BoT-SORT](#/p/botsort)와 [Deep OC-SORT](#/p/deepocsort)가 대표적',
 '**GSI·선형 보간 후처리는 MOT 리더보드 제출의 관행이 됨** — 보간 유무를 따로 표기하는 표가 늘어남',
 '**[ByteTrack](#/p/bytetrack)의 저점수 상자 재활용과 ReID 활용의 중간 지점** — 외형 기반 계열이 같은 검출기 위에서 어디까지 가는지 보여준 기준점'
],

pitfalls:[
 '**StrongSORT의 이득은 대부분 IDF1·HOTA에서 나오고 MOTA는 거의 그대로다.** Table I에서 MOTA는 76.7 → 77.1이다. MOTA만 보고 평가하면 변화를 놓친다.',
 '**속도가 느리다.** MOT17 val에서 7.5 FPS이고 MOT20 test는 1.4 FPS다. ByteTrack 재현(MOT17 29.6 FPS)과 비교하면 한참 느리며, 논문도 FPS 비교는 장비·검출 시간 제외 여부에 따라 공정하기 어렵다고 단서를 단다.',
 '**리더보드 수치에는 AFLink와 GSI가 포함된다.** StrongSORT 단독(MOT17 test HOTA 63.5)과 StrongSORT++(64.4)를 구분하지 않고 인용하면 다른 트래커와 비교가 어긋난다. 비교 대상도 보간 유무를 맞춰야 한다.'
],

figures:[
 {f:'fig2-deepsort-vs-strongsort.png',
  cap:'위가 DeepSORT, 아래가 StrongSORT. 왼쪽 두 열이 외형 branch와 모션 branch로 바뀐 부품이고, 오른쪽이 매칭 방식과 MOT17 val 성적이다. NSA 칼만의 출력이 cost와 gate 양쪽으로 가는 화살표가 "모션도 비용에 쓴다"는 변화를 보여준다.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'Although the priori assumption in the matching cascade can reduce confusing associations in poor trackers, this additional constraint will limit the performance of stronger trackers instead.',
  src:'V.B Ablation Studies, p.8'}
],

links:[
 {t:'arXiv 2202.13514 — StrongSORT', u:'https://arxiv.org/abs/2202.13514'},
 {t:'GitHub — dyhBUPT/StrongSORT', u:'https://github.com/dyhBUPT/StrongSORT'}
]
});
