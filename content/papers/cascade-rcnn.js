WIKI.paper({
slug:'cascade-rcnn',
venue:'CVPR 2018',
authors:'Cai & Vasconcelos (UC San Diego)',
arxiv:'1712.00726',

tldr:'"IoU 문턱을 그냥 높이면 왜 성능이 나빠지는가"를 정확히 분석하고, 문턱을 단계적으로 높여가는 검출 헤드를 **직렬로 이어** 각 단계가 앞 단계보다 정제된 분포에서 학습·추론하게 만든 2단계 검출기.',

context:'Faster R-CNN 계열은 IoU $u$ 이상인 proposal을 positive로 라벨링해 분류기·회귀기를 학습시키는데, 관행적으로 $u=0.5$를 쓴다. 문제는 $u=0.5$로 학습한 검출기가 뱉는 박스는 사람이 보기엔 "얼추 맞았지만 부정확한" close false positive가 많다는 점이다. 그렇다면 $u$를 0.6, 0.7로 높여 학습하면 되지 않을까 — 이 논문은 바로 그 직관이 왜 틀리는지를 실험으로 규명하는 데서 출발한다. [FPN](#/p/fpn)이 스케일 문제를, RPN이 proposal 생성을 해결한 뒤에도 "고품질(high-IoU) 검출"이라는 문제 자체는 남아 있었다.',

ideas:[
 {h:'왜 문턱을 높이면 오히려 나빠지는가 — 두 가지 원인',
  lead:'양성 표본이 지수적으로 줄어드는 과적합과, 학습·추론 시점의 입력 분포 불일치가 겹친다.',
  d:'첫째, $u$가 커질수록 그 조건을 만족하는 positive 표본 수가 지수적으로 줄어 고품질 분류기일수록 과적합에 취약해진다. 둘째, 추론 시 RPN이 내놓는 proposal 대부분은 여전히 저품질(낮은 IoU)인데, $u=0.7$로 학습된 회귀기는 애초에 고품질 입력에 최적화돼 있어 이 저품질 proposal들에 오히려 취약하다. 논문은 이를 "detector quality"와 "hypothesis quality"의 **불일치(mismatch)**라 부른다.'},
 {h:'회귀기는 자기 학습 IoU 근처에서만 출력을 개선한다',
  lead:'회귀기에 입력한 IoU와 출력 IoU를 그리면, 각 회귀기는 자신의 학습 문턱 부근에서만 대각선(항등함수) 위로 올라간다.',
  d:'$u=0.5, 0.6, 0.7$로 각각 학습한 회귀기의 입력-출력 IoU 곡선을 그려보면, 어떤 회귀기도 전체 IoU 구간에서 고르게 좋지 않다. 오히려 각 회귀기는 자신의 학습 IoU와 비슷한 구간의 입력에서만 출력을 개선하고, 그 범위를 벗어나면 성능이 대각선 아래로 떨어지거나 심지어 입력보다 출력이 나빠질 수 있다. 이것이 "단일 회귀기로 모든 품질 수준을 커버할 수 없다"는 핵심 근거다.'},
 {h:'단계별 재표집(resampling)으로 분포를 맞춘다',
  lead:'한 단계의 출력 박스를 다음 단계의 입력으로 재사용해, 갈수록 고품질 분포를 만들어 그 문턱에 맞는 헤드를 학습시킨다.',
  d:'stage $t$ 의 회귀기 $f_t$ 는 IoU 문턱 $u_t$($u_1<u_2<\\cdots<u_T$)로 학습되는데, 그 학습 입력은 원본 proposal 분포가 아니라 **이전 단계 $f_{t-1}$ 이 만들어낸 출력 분포**다. 각 단계를 거칠수록 박스 품질이 개선되므로, 다음 단계는 이미 정제된-따라서 문턱에 더 가까운-분포를 입력받아 과적합 없이 학습할 수 있다. 추론 시에도 같은 순서로 단계를 통과시켜 학습-추론 분포 불일치를 없앤다.'},
 {h:'기존 iterative bbox·integral loss와의 차이',
  lead:'반복 회귀는 후처리일 뿐이고 앙상블 손실은 여전히 문턱마다 다른 표본 수 문제를 못 푼다 — Cascade R-CNN은 이 둘을 구조적으로 대체한다.',
  d:'iterative bounding box regression(같은 회귀기를 반복 적용)은 학습 때 한 번도 보지 못한 분포에 반복 적용되는 후처리라 학습-추론 불일치가 여전하다. integral loss(여러 IoU 문턱의 손실을 한 번에 더하는 방식, $U=\\{0.5,\\ldots,0.75\\}$)는 문턱마다 분류기를 따로 두지만 입력은 공유해서, 고품질 분류기가 여전히 저품질 proposal 다수를 처리해야 하는 문제를 해결하지 못한다. Cascade R-CNN은 **단계마다 독립된 헤드 + 단계마다 재표집된 입력**이라는 조합으로 두 방식의 한계를 모두 피한다.'}
],

diagram:{type:'stack', cap:'Cascade R-CNN 한 갈래. 각 단계 출력 박스가 다음 단계의 입력 proposal이 된다 — 단계마다 IoU 문턱이 올라간다.',
 layers:[
  {t:'RPN proposal', s:'저품질 다수'},
  {t:'Stage 1: H1', s:'IoU 문턱 0.5', note:'분류+회귀'},
  {t:'재표집', s:'B1 → 다음 입력'},
  {t:'Stage 2: H2', s:'IoU 문턱 0.6', acc:true, note:'더 정제된 분포'},
  {t:'재표집', s:'B2 → 다음 입력'},
  {t:'Stage 3: H3', s:'IoU 문턱 0.7', note:'최종 고품질 박스'}
 ]},

math:[
 {expr:'y = gy if IoU(x,g) ≥ u, else 0',
  tex:'y=\\begin{cases}g_y & IoU(x,g)\\ge u\\\\ 0 & \\text{otherwise}\\end{cases}',
  d:'IoU 문턱 $u$ 가 표본 $x$ 의 클래스 라벨을 결정한다. 이 $u$ 자체가 "검출기의 품질"을 정의한다는 것이 논문의 핵심 관찰이다.'},
 {expr:'f(x,b) = fT ∘ fT-1 ∘ ⋯ ∘ f1(x,b)',
  tex:'f(x,b)=f_T\\circ f_{T-1}\\circ\\cdots\\circ f_1(x,b)',
  d:'전체 cascade는 $T$개 회귀기의 합성함수. 각 $f_t$ 는 이전 단계 출력 $b_{t-1}=f_{t-1}(x_{t-1},b_{t-1})$ 에서 형성된 분포 위에서 학습된다 — 초기 분포 $\\{b_1\\}$ 하나에만 최적화된 단일 회귀기와 다른 점.'},
 {expr:'L(xt,g) = Lcls(ht(xt), yt) + λ[yt≥1]·Lloc(ft(xt,bt), g)',
  tex:'L(x^t,g)=L_{cls}(h_t(x^t),y^t)+\\lambda[y^t\\ge1]L_{loc}(f_t(x^t,b^t),g)',
  d:'단계 $t$ 의 손실. $u_t$ 가 단계마다 커지도록($u_1<u_2<\\cdots<u_T$) 고정해 두고 각 단계를 독립적으로 학습시킨다.'}
],

numbers:[
 {k:'COCO AP · ResNet-101 (test-dev)', v:'42.8', d:'FPN+ 백본, 동일 백본 Faster R-CNN+FPN(38.8) 대비 **+4.0**'},
 {k:'단일 회귀기 AP · u=0.5/0.6/0.7', v:'0.349 / 0.354 / 0.319', d:'문턱을 0.5→0.7로 무작정 높이면 오히려 AP가 떨어짐(Figure 1d) — 이 논문 문제의식의 직접 증거'},
 {k:'추론 속도 · FPN+ ResNet-101', v:'0.115s/img (baseline) → 0.14s/img (cascade)', d:'Titan Xp 기준, cascade 추가로 약 22% 느려지는 대신 AP +4.0~4.3'},
 {k:'cascade 단계 수 실험', v:'3단계가 최적', d:'4단계까지 늘려도 이득이 줄어들거나 정체(Table 4)'}
],

impact:'Cascade R-CNN은 "고품질 검출기를 만들려면 그냥 IoU 문턱을 높이면 된다"는 순진한 접근이 왜 실패하는지를 정량적으로 규명하고, 그 해법으로 **단계별 재표집**이라는 구조를 제시했다. 이 구조는 특정 백본이나 손실 함수에 종속되지 않아 Faster R-CNN·FPN 등 임의의 2단계 베이스라인에 거의 그대로 얹을 수 있었고, 실제로 다양한 베이스라인에서 일관된 AP 향상을 보였다. 이후 고품질 박스가 중요한 과제(Mask R-CNN 계열의 Cascade Mask R-CNN 등)에서 사실상 표준 구성요소가 됐다.',

legacy:[
 '**Cascade Mask R-CNN** — 같은 저자들이 곧바로 인스턴스 분할에 cascade 구조를 이식, 이후 여러 대회 우승 파이프라인의 기본 구성요소가 됨',
 '**"IoU 문턱 = 검출기 품질"이라는 분석 틀** — 이후 검출기 설계 논문들이 문턱을 다룰 때 이 논문의 프레이밍을 그대로 인용',
 '**아키텍처 무관 확장 모듈로 정착** — 백본·헤드에 상관없이 붙일 수 있는 범용 개선 기법으로 여러 검출 프레임워크(mmdetection 등)에 기본 옵션으로 내장',
 '**2단계 검출기 정확도 경쟁의 다음 축** — [FCOS](#/p/fcos)·[CenterNet](#/p/centernet) 같은 anchor-free 1단계 검출기들이 속도를, Cascade R-CNN 계열이 정확도 상한을 놓고 계속 경쟁하는 구도를 만듦'
],

pitfalls:[
 '**"문턱을 단계적으로 올리면 무조건 좋아진다"는 오해가 흔하다.** 실제로는 각 단계가 이전 단계의 재표집된 출력을 입력받기 때문에 효과가 나는 것이지, 문턱을 높이는 것 자체가 이유가 아니다. 재표집 없이 문턱만 높이면 Figure 1(d)처럼 AP가 오히려 떨어진다.',
 '**iterative bbox와 혼동하기 쉽다.** iterative bbox는 같은 회귀기를 반복 적용하는 순수 후처리이고 학습 시점엔 이런 분포를 본 적이 없다. Cascade R-CNN은 단계마다 별도로 학습된 헤드를 쓰고 학습 때도 같은 재표집 절차를 거친다는 점이 본질적으로 다르다.',
 '**추론 속도 저하를 과소평가하기 쉽다.** 단계 수만큼 헤드를 순차 통과하므로 파라미터 수(272M→345M 등)와 추론 시간이 늘어난다 — 정확도 이득과 맞바꾸는 트레이드오프임을 명시해야 한다.'
],

figures:[
 {f:'fig1-quality-mismatch.png',
  cap:'(c) 회귀기 입력 IoU 대 출력 IoU — 각 회귀기(파랑=0.5, 초록=0.6, 빨강=0.7)가 대각선(baseline)보다 위로 올라가는 구간이 자기 학습 문턱 근처로 제한됨을 보여준다. (d) 문턱 u=0.7로 학습한 검출기는 낮은 IoU 구간에서 오히려 AP가 낮다.',
  src:'원문 Figure 1(c)(d), p.1'},
 {f:'fig3-architectures.png',
  cap:'왼쪽부터 (a) 표준 Faster R-CNN, (b) 추론 시에만 반복 적용하는 iterative bbox, (c) 문턱별 손실을 더하는 integral loss, (d) Cascade R-CNN — 단계 t의 박스 출력(B)이 단계 t+1의 pool 입력으로 이어지는 것이 (b)·(c)와의 핵심 차이.',
  src:'원문 Figure 3, p.4'}
],

quotes:[
 {t:'A single detector can only be optimal for a single quality level.',
  src:'Introduction, p.1'},
 {t:'The cascade of R-CNN stages deeper into the cascade are sequentially more selective against close false positives.',
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 1712.00726 — Cascade R-CNN: Delving into High Quality Object Detection', u:'https://arxiv.org/abs/1712.00726'},
 {t:'공식 코드 (zhaoweicai/cascade-rcnn)', u:'https://github.com/zhaoweicai/cascade-rcnn'}
]
});
