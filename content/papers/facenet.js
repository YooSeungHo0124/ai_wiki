WIKI.paper({
slug:'facenet',
venue:'CVPR 2015',
authors:'Schroff, Kalenichenko, Philbin (Google)',
arxiv:'1503.03832',

tldr:'얼굴 이미지를 곧바로 128차원 유클리드 임베딩으로 매핑하도록 학습시켜, 거리 하나로 얼굴 검증·인식·클러스터링을 전부 푼 논문. 중간 병목층 특징을 재활용하던 기존 방식과 달리 **임베딩 자체를 종단간(end-to-end)으로 직접 최적화**한다.',

context:'2014~2015년의 딥러닝 기반 얼굴 인식은 [GoogLeNet](#/p/googlenet)류의 CNN으로 수천 개 신원(identity)을 분류하는 소프트맥스 분류기를 학습한 뒤, 마지막 분류층 직전의 병목(bottleneck) 층 출력을 얼굴 특징 벡터로 재사용하는 방식이 표준이었다. 이 특징은 보통 수천 차원이라 크고, PCA로 차원을 줄이거나 별도의 SVM·Joint Bayesian 모델을 얹는 후처리가 또 필요했다. 근본적인 문제는 **간접성**이다 — 분류 정확도를 높이도록 학습된 표현이 우연히 거리 비교에도 잘 맞기를 바라는 구조다. 새 신원을 추가하려면 분류기 출력 차원 자체를 바꿔야 해서 재학습 없이 확장하기도 어렵다. FaceNet은 이 병목층을 없애고, "같은 사람이면 가깝고 다른 사람이면 멀다"는 목표를 손실 함수에 직접 넣어 임베딩을 학습한다.',

ideas:[
 {h:'임베딩을 직접 학습, 분류기는 없다',
  lead:'분류 소프트맥스 없이 이미지를 바로 128차원 벡터로 매핑해 거리로 유사도를 표현한다.',
  d:'네트워크는 이미지 $x$ 를 $d$ 차원 구(hypersphere) 위의 벡터 $f(x)$, $\\|f(x)\\|_2=1$ 로 매핑한다. 출력이 곧 최종 표현이라 검증은 거리 임계값, 인식은 최근접 이웃, 클러스터링은 k-means 같은 표준 알고리즘을 **그대로** 얹으면 끝난다. 새 사람이 추가돼도 네트워크를 다시 학습할 필요가 없다.'},
 {h:'Triplet loss: 상대적 거리 제약',
  lead:'anchor-positive는 가깝게, anchor-negative는 margin 이상 멀게 미는 손실이다.',
  d:'anchor $x^a_i$, 같은 사람의 positive $x^p_i$, 다른 사람의 negative $x^n_i$ 세 장을 묶어, anchor-positive 거리에 마진 $\\alpha$ 를 더해도 anchor-negative 거리보다 작도록 강제한다. 같은 신원의 모든 얼굴을 **한 점**으로 모으는 쌍(pair) 기반 손실과 달리, 한 사람이 임베딩 공간에서 매니폴드를 이루도록 허용하면서 다른 사람과의 판별력만 확보한다.'},
 {h:'Semi-hard negative mining이 진짜 기여',
  lead:'무작위 triplet은 대부분 이미 마진을 만족해 gradient가 거의 0이라, 미니배치 안에서 의미 있는 triplet만 골라 써야 한다.',
  d:'가능한 모든 triplet을 다 쓰면 이미 제약을 만족하는 "쉬운" triplet이 태반이라 학습이 느려진다. 그렇다고 매 스텝 가장 어려운(hardest) negative만 고르면 초기 학습에서 $f(x)=0$ 으로 붕괴하는 나쁜 지역해에 빠지기 쉽다. 그래서 논문은 anchor-positive 거리보다는 멀지만 여전히 마진 안쪽인 **semi-hard negative**를 수천 장 단위의 큰 미니배치 안에서 온라인으로 골라 쓴다. loss 수식 자체는 표준적인데, 이 **선택 전략**이 수렴 속도와 최종 성능을 좌우하는 실질적인 공학적 기여다.'},
 {h:'큰 미니배치 + 신원당 고정 인원 샘플링',
  lead:'미니배치를 수천 장으로 키우고 신원당 약 40장씩 뽑아 anchor-positive 거리를 의미 있게 만든다.',
  d:'미니배치가 너무 작으면 anchor-positive 거리 자체가 대표성이 없어 semi-hard negative를 골라도 의미가 없다. 그래서 배치 크기를 약 1,800개로 키우고, 한 신원당 약 40장씩 뽑아 넣은 뒤 나머지를 무작위 negative로 채운다. hard positive 대신 미니배치 내 **모든** anchor-positive 쌍을 쓰는 쪽이 학습 초반 수렴을 더 안정적으로 만들었다고 보고한다.'},
 {h:'128바이트로 압축되는 표현 효율',
  lead:'128차원 float 임베딩을 128바이트로 양자화해도 정확도 손실이 거의 없다.',
  d:'기존 병목층 특징이 수천 차원이던 것과 달리, FaceNet 임베딩은 학습 시 128차원 float이고 이를 얼굴 한 장당 128바이트로 양자화해도 정확도 저하가 미미하다. 표현이 작아지면 대규모 얼굴 데이터베이스에서의 최근접 이웃 검색·클러스터링 비용도 그만큼 줄어든다.'}
],

diagram:{type:'flow', cap:'얼굴 이미지가 CNN을 거쳐 128차원 임베딩이 되고, 학습 중에만 triplet loss가 이를 밀고 당긴다.',
 nodes:[
  {t:'얼굴 이미지', s:'배치 입력'},
  {t:'Deep CNN', s:'ZF 또는 Inception 계열'},
  {t:'L2 정규화', s:'구 위로 투영', a:'‖f(x)‖=1'},
  {t:'임베딩', s:'128-d 벡터', acc:true},
  {t:'Triplet Loss', s:'학습 시에만 작동'}
 ]},

math:[
 {expr:'‖f(xa) − f(xp)‖² + α < ‖f(xa) − f(xn)‖²',
  tex:'\\|f(x_i^a) - f(x_i^p)\\|_2^2 + \\alpha < \\|f(x_i^a) - f(x_i^n)\\|_2^2',
  d:'모든 triplet에 대해 anchor-positive 거리 제곱에 마진 $\\alpha$ 를 더해도 anchor-negative 거리 제곱보다 작아야 한다는 제약. 논문은 $\\alpha=0.2$ 를 쓴다.'},
 {expr:'L = Σ [ ‖f(xa)−f(xp)‖² − ‖f(xa)−f(xn)‖² + α ]+',
  tex:'L=\\sum_{i}^{N}\\Big[\\|f(x_i^a)-f(x_i^p)\\|_2^2-\\|f(x_i^a)-f(x_i^n)\\|_2^2+\\alpha\\Big]_+',
  d:'힌지(hinge) 형태 — 이미 마진을 만족하는 triplet은 $[\\,\\cdot\\,]_+$ 에서 0이 되어 gradient에 기여하지 않는다. 이 때문에 "0이 되지 않는" triplet을 고르는 선택 전략이 중요해진다.'}
],

numbers:[
 {k:'임베딩 차원', v:'128-d', d:'학습 시 float, 배포 시 128바이트로 양자화 가능'},
 {k:'margin α', v:'0.2', d:'anchor-positive와 anchor-negative 사이 강제 거리 여유'},
 {k:'LFW 정확도', v:'99.63%', d:'당시 최고 공개 결과 대비 오류율 30% 감소'},
 {k:'YouTube Faces DB', v:'95.12%', d:'100프레임 평균 유사도 기준'},
 {k:'학습 데이터', v:'1억~2억 장 · 약 800만 신원', d:'얼굴 검출·정렬 후 사용한 얼굴 썸네일 규모'},
 {k:'미니배치 크기', v:'약 1,800장', d:'신원당 약 40장씩 샘플링, semi-hard negative는 이 안에서 온라인 선택'}
],

impact:'얼굴 인식 파이프라인에서 "분류기를 학습하고 병목층을 특징으로 재활용"하는 간접적 방식을 걷어내고, 거리 기반 임베딩을 목적함수로 직접 최적화하는 방식을 표준으로 만들었다. 검증·인식·클러스터링 세 과제를 하나의 임베딩으로 통일해, 새 인물을 추가할 때 재학습이 필요 없는 오픈셋(open-set) 인식이 실용적으로 가능해졌다. 또한 triplet 손실 자체보다 **어떤 triplet을 학습에 쓸지 고르는 전략**이 실제 성능을 좌우한다는 것을 보여줘, 이후 metric learning 연구 전반이 mining 전략에 집중하게 만들었다.',

legacy:[
 '얼굴 인식을 넘어 사람 재식별(re-ID), 이미지 검색 등 metric learning이 필요한 전 분야에서 triplet loss가 기본 도구로 자리잡음',
 'semi-hard mining의 비효율(미니배치 내 탐색 비용, 여전히 불안정한 수렴)을 피하려 [ArcFace](#/p/arcface)처럼 **triplet 샘플링 없이 소프트맥스에 각도 마진을 더하는** 방식이 이후 주류가 됨',
 'triplet/contrastive/각도-마진 손실을 비교·정리하는 metric learning 서베이 연구 계열이 이 논문을 표준 베이스라인으로 인용',
 '128바이트 압축 임베딩이라는 아이디어는 이후 대규모 얼굴 검색 시스템의 인덱싱 비용 설계에 계속 참조됨'
],

pitfalls:[
 '**triplet loss 수식 자체는 어렵지 않다.** 실제로 어려운 것은 논문이 강조하듯 **triplet 선택**이다 — 무작위 샘플링은 학습이 느리고, 가장 어려운 negative만 고르면 초반에 $f(x)=0$ 으로 붕괴할 수 있다. 구현 시 이 mining 로직을 생략하면 논문 성능이 재현되지 않는다.',
 '**online semi-hard mining은 계산 비용이 크다.** 미니배치를 수천 장 단위로 키워야 argmin/argmax가 의미 있어지는데, 이는 곧 배치당 forward 비용이 커진다는 뜻이다. 이후 연구들이 mining을 아예 없애는 방향(소프트맥스 기반 각도 마진)으로 간 이유 중 하나다.',
 '**"128-D면 무조건 충분하다"는 아니다.** 논문 자체가 64차원까지 줄이면 정확도가 떨어지는 것을 보고한다(64-d 86.8% vs 128-d 99%대). 차원은 태스크·데이터 규모에 맞춰 검증해야 하는 하이퍼파라미터다.'
],

figures:[
 {f:'fig2-model-structure.png',
  cap:'배치 입력 → Deep CNN(Zeiler&Fergus 또는 Inception 계열) → L2 정규화 → 임베딩까지가 배포 시 쓰는 전부이고, Triplet Loss(주황) 박스는 학습 때만 붙는다. 추론 시에는 임베딩 벡터 하나만 나온다.',
  src:'원문 Figure 2, p.3'},
 {f:'fig3-triplet-loss.png',
  cap:'왼쪽이 학습 전: negative(빨강)가 positive(초록)보다 anchor(파랑)에 더 가깝게 잘못 배치돼 있다. 오른쪽이 학습 후: anchor-positive는 가까워지고 anchor-negative는 마진만큼 멀어졌다. 가운데 화살표가 "LEARNING", 즉 이 구조 재배치가 곧 triplet loss가 하는 일이다.',
  src:'원문 Figure 3, p.3'}
],

quotes:[
 {t:'In contrast to these approaches, FaceNet directly trains its output to be a compact 128-D embedding using a triplet-based loss function based on LMNN.',
  src:'Section 1, p.2'},
 {t:'We call these negative exemplars semi-hard, as they are further away from the anchor than the positive exemplar, but still hard because the squared distance is close to the anchor-positive distance.',
  src:'Section 3.2, p.3'}
],

links:[
 {t:'arXiv 1503.03832 — FaceNet', u:'https://arxiv.org/abs/1503.03832'},
 {t:'Labeled Faces in the Wild (LFW) benchmark', u:'http://vis-www.cs.umass.edu/lfw/'}
]
});
