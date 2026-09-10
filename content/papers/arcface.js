WIKI.paper({
slug:'arcface',
venue:'CVPR 2019',
authors:'Deng, Guo, Yang, Xue, Kotsia, Zafeiriou (Imperial College London · InsightFace)',
arxiv:'1801.07698',

tldr:'얼굴 인식의 학습 손실을 **triplet 샘플링 없이** softmax 한 줄로 바꾼 논문. 정규화된 코사인 로짓의 각도 자체에 마진을 더해 `cos(θ+m)`을 만들며, 이 마진이 초구면 위의 측지 거리와 정확히 대응한다는 점을 핵심 근거로 든다.',

context:'[FaceNet](#/p/facenet)류의 triplet loss는 같은 사람의 두 이미지와 다른 사람의 한 이미지를 묶어 거리를 비교하는 방식인데, 학습 데이터가 커질수록 만들 수 있는 triplet 조합이 조합폭발적으로 늘고, 그중 학습에 유효한 semi-hard triplet을 고르는 마이닝 자체가 별도의 난제였다. 반대편의 표준 softmax 분류 손실은 마이닝이 필요 없지만, 닫힌 집합 분류에는 맞아도 학습 때 못 본 신원을 여는 open-set 검증에는 판별력이 부족했고, 클래스 수 `N`이 늘수록 마지막 선형층 `W`의 크기도 그대로 커졌다. SphereFace와 CosFace는 이미 가중치·특징을 정규화해 로짓을 각도만의 함수 `s·cosθ`로 만들고 그 위에 마진을 얹는 접근을 시도했지만, 마진을 넣는 위치가 달라 학습 안정성과 기하학적 해석이 서로 달랐다. 이 논문은 그 마진을 어디에 넣을지의 선택지를 명확히 하고, 그중 각도 자체에 더하는 방식이 가장 단순하고 안정적이라고 주장한다.',

ideas:[
 {h:'세 방법은 마진을 넣는 위치가 다르다',
  lead:'곱셈형(SphereFace)·코사인 뺄셈형(CosFace)·각도 덧셈형(ArcFace)으로 나뉜다.',
  d:'셋 다 목표 클래스의 로짓을 낮춰 학습을 어렵게 만들어 마진을 강제한다는 점은 같지만 수식이 다르다. SphereFace는 각도 자체에 정수 배율 `m`을 곱해 `cos(mθ)`, CosFace는 코사인 값에서 `m`을 그대로 빼서 `cos(θ)-m`, ArcFace는 각도에 `m`을 더한 뒤 코사인을 취해 `cos(θ+m)`을 만든다. 곱셈은 각도가 클수록 마진 효과가 커지는 비선형이고, 코사인 뺄셈도 각도 공간에서 보면 비선형인데, 각도 덧셈만 전 구간에서 일정한 선형 마진을 만든다.'},
 {h:'정규화로 로짓을 순수 각도의 함수로 만든다',
  lead:'‖W‖=1, ‖x‖=1 후 스케일 `s`를 곱해 로짓이 `s·cosθ`만 남게 한다.',
  d:'원래 로짓은 `W_j^T x_i = ‖W_j‖‖x_i‖cosθ_j`로, 벡터 크기와 각도가 뒤섞여 있다. bias를 0으로 고정하고 `‖W_j‖=1`로 정규화하면 크기 항이 하나 사라지고, `‖x_i‖`도 정규화한 뒤 고정 스케일 `s`로 다시 키우면 로짓은 순전히 각도 `θ`에만 의존한다. 이 한 단계가 있어야 "각도에 마진을 더한다"는 조작이 의미를 갖는다.'},
 {h:'각도 마진은 측지 거리와 정확히 대응한다',
  lead:'초구면 위에서 `θ+m`의 마진은 실제 호(arc) 길이 마진과 같다.',
  d:'정규화된 특징은 반지름 `s`인 초구면 위에 놓인다. 이 위에서 두 점 사이의 최단 경로(측지선) 길이는 각도에 정비례하므로, 각도에 더한 마진은 곧 그 구면 위의 거리 마진이 된다. 이름 ArcFace(Additive Angular Margin)도 여기서 왔다. CosFace의 코사인 뺄셈은 이런 기하학적 대응이 없어 각도 구간마다 실질 마진 크기가 달라진다.'},
 {h:'SphereFace는 곱셈형이라 학습이 불안정하다',
  lead:'정수 배율 마진은 목표 로짓 곡선을 가파르게 만들어 수렴이 어렵다.',
  d:'`cos(mθ)`는 `θ`가 커질수록 진동·비단조 구간이 생겨 근사와 이중각 공식이 필요했고, 원 논문은 발산을 막으려 표준 softmax와 결합한 하이브리드 손실과 어닐링 전략을 썼다. 저자들은 정수 제약을 없앤 SphereFace 변형(`m=1.35`)도 시험했지만, 그래도 각도 덧셈형만큼 매끈하게 학습되지는 않았다고 보고한다.'},
 {h:'Sub-center ArcFace: 노이즈 데이터로의 확장',
  lead:'클래스마다 `K`개의 서브센터를 두고 최댓값만 취해 라벨 노이즈에 견디게 한다.',
  d:'ArcFace는 학습 데이터가 깨끗하다고 가정하는데, 대규모로 크롤링한 얼굴 데이터셋에는 오분류 라벨이 섞이기 마련이다. 이 확장판은 클래스당 하나였던 중심 `W_{y_i}`를 `K`개의 서브센터로 늘리고, 각 샘플은 그중 코사인 유사도가 가장 높은 서브센터와만 비교한다. 이렇게 하면 다수 서브클래스가 깨끗한 지배적 클러스터를 형성하고 오라벨 샘플은 소수 서브센터로 밀려나, 나중에 그 서브센터를 통째로 버려 자동으로 데이터를 정제할 수 있다.'}
],

diagram:{type:'flow', cap:'특징과 가중치를 정규화해 로짓을 각도만의 함수로 만든 뒤, 정답 클래스의 각도에만 마진 m을 더하고 다시 코사인·스케일을 거쳐 softmax에 넣는다.',
 nodes:[
  {t:'특징 정규화', s:'‖x‖=1, s배'},
  {t:'arccos', s:'θ 계산'},
  {t:'각도+m', s:'θ_yi + m', acc:true},
  {t:'cos, ×s', s:'다시 로짓으로'},
  {t:'softmax', s:'cross-entropy'}
 ]},

math:[
 {expr:'L3 = -log[ e^(s·cos(θyi+m)) / (e^(s·cos(θyi+m)) + Σ_{j≠yi} e^(s·cosθj)) ]',
  tex:'L_3=-\\log\\frac{e^{s\\cos(\\theta_{y_i}+m)}}{e^{s\\cos(\\theta_{y_i}+m)}+\\sum_{j=1,j\\neq y_i}^{N}e^{s\\cos\\theta_j}}',
  d:'ArcFace 손실 전체 형태. 분모에 나머지 모든 클래스의 로짓이 그대로 들어가는 softmax 구조는 유지하면서, 분자의 정답 클래스 항에만 `θyi+m`을 넣는다.'},
 {expr:'SphereFace: cos(m·θ)   CosFace: cosθ - m   ArcFace: cos(θ + m)',
  tex:'\\begin{aligned}\\text{SphereFace}&:\\ \\cos(m\\theta)\\\\ \\text{CosFace}&:\\ \\cos\\theta-m\\\\ \\text{ArcFace}&:\\ \\cos(\\theta+m)\\end{aligned}',
  d:'세 방법이 정답 클래스 로짓에서 목표 각도 `θ`를 어떻게 바꾸는지 나란히 놓은 것. 곱셈은 각도 안에서, 뺄셈은 코사인 값에, 덧셈은 각도 안에서 일어나되 부호가 다르다는 것이 표에 정리된 논문 자신의 구분이다.'},
 {expr:'L4 = -log[ e^(s(cos(m1·θyi+m2)-m3)) / (e^(s(cos(m1·θyi+m2)-m3)) + Σ_{j≠yi} e^(s·cosθj)) ]',
  tex:'L_4=-\\log\\frac{e^{s(\\cos(m_1\\theta_{y_i}+m_2)-m_3)}}{e^{s(\\cos(m_1\\theta_{y_i}+m_2)-m_3)}+\\sum_{j=1,j\\neq y_i}^{N}e^{s\\cos\\theta_j}}',
  d:'세 마진을 `m1`(곱셈, SphereFace), `m2`(각도 덧셈, ArcFace), `m3`(코사인 뺄셈, CosFace)로 한데 묶은 통합 식. 이 논문은 `m2`만 켠 조합(`m1=1, m3=0`)이 곧 ArcFace임을 보인다.'}
],

numbers:[
 {k:'스케일 s', v:'64', d:'특징 벡터를 정규화한 뒤 다시 키우는 고정 반지름'},
 {k:'각도 마진 m', v:'0.5', d:'ArcFace의 기본 설정값. 0.4~0.55 사이에서는 LFW·AgeDB 성능 차가 크지 않았다'},
 {k:'LFW 검증 정확도', v:'99.83%', d:'ResNet100 기반 최종 모델'},
 {k:'YTF 검증 정확도', v:'98.01%', d:'비디오 프레임 벤치마크'},
 {k:'MegaFace 식별(정제판)', v:'Id 91.12% / Ver 93.56%', d:'CASIA 학습, ResNet50, refined MegaFace 기준'},
 {k:'IJB-C TPR@FPR=1e-4', v:'96.83%', d:'MS1MV3 학습, ResNet100 기준'}
],

impact:'ArcFace 이후 대규모 얼굴 인식 학습은 사실상 "정규화된 softmax + 각도 마진" 레시피로 수렴했다. triplet 마이닝이라는 공학적 병목이 사라지면서 학습 파이프라인이 단순한 분류 문제로 환원됐고, 저자들이 공개한 [InsightFace](https://github.com/deepinsight/insightface) 구현은 산업계 얼굴 인식 시스템의 사실상 표준 베이스라인이 되었다. 같은 프레임워크 위에서 마진 위치나 형태만 바꾼 후속 손실(CurricularFace, MV-Softmax 등)이 줄줄이 나왔고, 이 논문 자체도 이후 판에서 Sub-center ArcFace를 더해 대규모 웹 크롤링 데이터의 라벨 노이즈 문제까지 같은 각도-마진 틀 안에서 흡수했다.',

legacy:[
 '**margin-softmax 계열의 표준 어휘 확립** — SphereFace(곱셈)·CosFace(뺄셈)·ArcFace(덧셈)라는 3분류가 이후 논문들의 공통 비교축이 됨',
 '**CurricularFace·MV-Softmax·GroupFace** 등이 같은 정규화-마진 구조 위에서 난이도별 샘플 가중치, 서브클래스 구조 등을 추가로 얹음',
 '**Sub-center ArcFace** — 클래스당 다중 서브센터로 라벨 노이즈에 강건한 대규모 데이터 자동 정제 파이프라인으로 확장',
 '**얼굴 생성·역추론 연구의 기반** — 학습된 ArcFace 임베딩과 BN 통계를 이용해 신원 보존 이미지를 복원하는 모델 역전 연구로 이어짐'
],

pitfalls:[
 '**마진 m과 스케일 s는 서로 얽혀 있다.** s가 너무 작으면(Norm-Softmax에서 `s=20`) 마진 없이도 수렴이 잘 안 되고, s가 고정된 채로 m만 키우면 목표 로짓 곡선이 지나치게 가팔라진다. 둘을 독립적으로 튜닝할 수 있는 값처럼 다루면 안 된다.',
 '**"깨끗한 데이터"를 전제로 한다.** 원래 ArcFace는 각 샘플이 정확한 신원 라벨을 가졌다는 가정 위에 서 있어서, 대규모 웹 크롤링 데이터의 오라벨에 취약하다. 저자들 스스로도 이 문제 때문에 별도로 Sub-center ArcFace를 제안했다.',
 '**SphereFace와의 "수치적 유사성"과 "기하학적 차이"를 혼동하기 쉽다.** 논문은 세 손실이 통합 프레임워크(`L4`) 안에서 비슷한 목표 로짓 곡선을 낼 수 있다고 인정하면서도, 그 곡선을 만드는 방식(선형 vs 비선형 마진)은 다르다고 명확히 구분한다. "결국 다 비슷한 손실"이라고 뭉뚱그리면 이 논문의 핵심 주장을 놓친다.'
],

figures:[
 {f:'fig2-pipeline.png',
  cap:'왼쪽부터: 정규화된 특징 x와 (서브센터 포함) 가중치 W를 곱해 코사인 유사도 S를 얻고, arccos로 각도 θ를 구한 뒤 정답 클래스 각도에만 마진 m을 더해 θ+m을 만든다. 다시 cos을 취하고 스케일 s를 곱한 로짓이 softmax·cross-entropy로 들어간다. K=1이면 원래 ArcFace, K>1이면 Sub-center ArcFace다.',
  src:'원문 Figure 2, p.4'},
 {f:'fig5-decision-boundary.png',
  cap:'이진 분류 상황에서 각 손실의 결정 경계(점선)와 마진(회색 영역)을 θ1-θ2 평면에 그린 것. Softmax는 마진이 아예 없고, SphereFace·CosFace는 구간에 따라 마진 폭이 휘어지는 반면 ArcFace는 경계를 따라 폭이 일정한 회색 띠를 유지한다.',
  src:'원문 Figure 5, p.5'}
],

quotes:[
 {t:'Since the proposed additive angular margin penalty is equal to the geodesic distance margin penalty in the normalized hypersphere, we name our method as ArcFace.',
  src:'Section 3.1, p.4'},
 {t:'The proposed ArcFace has a constant linear angular margin throughout the whole interval. By contrast, SphereFace and CosFace only have a nonlinear angular margin.',
  src:'Section 3.1 (Geometric Difference), p.4-5'}
],

links:[
 {t:'arXiv 1801.07698 — ArcFace: Additive Angular Margin Loss for Deep Face Recognition', u:'https://arxiv.org/abs/1801.07698'},
 {t:'InsightFace (공식 구현)', u:'https://github.com/deepinsight/insightface'}
]
});
