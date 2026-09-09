WIKI.paper({
slug:'detr',
venue:'ECCV 2020',
authors:'Nicolas Carion, Francisco Massa, Gabriel Synnaeve, Nicolas Usunier, Alexander Kirillov, Sergey Zagoruyko (Facebook AI Research)',
arxiv:'2005.12872',

tldr:'객체 검출을 "박스를 잔뜩 뽑고 후처리로 추리는 문제"가 아니라 **집합(set)을 한 번에 예측하는 문제**로 다시 정의한 논문. anchor, region proposal, NMS 같은 손으로 설계한 부품을 전부 없애고 [Transformer](#/p/transformer) 인코더-디코더와 Hungarian matching 손실만으로 진짜 end-to-end 검출기를 만들었다.',

context:'2020년까지의 검출기는 [Faster R-CNN](#/p/faster-rcnn)이든 [RetinaNet](#/p/focal-loss)이든 [YOLO](#/p/yolo)든 공통된 골격을 공유했다 — 이미지 위에 미리 정해둔 **anchor를 촘촘히 깔고**, 각 anchor에 정답 박스를 IoU 임계값으로 **할당**하고, 학습이 끝나면 겹치는 예측을 **NMS로 지운다**. 이 파이프라인은 잘 작동했지만 성능이 anchor 스케일·비율, IoU 임계값, NMS 임계값 같은 사람이 고른 상수에 민감했고, 무엇보다 **NMS가 미분 불가능**해서 손실이 최종 출력에 직접 닿지 못했다. 즉 "end-to-end 학습"이라 부르면서도 실제로는 앞뒤로 수작업 규칙이 붙어 있었다. 중복 제거가 필요한 근본 이유는 손실 정의에 있다 — 각 anchor가 독립적으로 학습되니 이웃한 여러 anchor가 같은 물체를 동시에 예측하는 것을 막을 방법이 없었다.',

ideas:[
 {h:'검출 = 집합 예측. 중복은 손실에서 막는다',
  lead:'항상 N개를 예측해 정답과 일대일 매칭하고, 나머지 중복엔 벌점을 준다.',
  d:'DETR은 항상 고정된 개수 $N$ 개(논문 기본 100)의 예측을 내놓고, 이를 정답 박스 집합과 **일대일로 매칭**한다. 한 정답에는 정확히 하나의 예측만 배정되므로, 두 예측이 같은 물체를 가리키면 하나는 반드시 "물체 없음(∅)"으로 벌점을 받는다. **중복 억제가 후처리가 아니라 손실 함수의 성질**이 되면서 NMS가 필요 없어진다.'},
 {h:'Hungarian matching: 순열을 최적으로 정한다',
  lead:'예측-정답 대응을 이분 매칭 문제로 보고 헝가리안 알고리즘으로 최적 순열을 찾는다.',
  d:'예측과 정답의 대응을 정하는 것은 이분 매칭 문제이고, 헝가리안 알고리즘으로 매칭 비용의 총합을 최소화하는 순열 $\\hat{\\sigma}$ 를 $O(N^3)$ 에 정확히 푼다. 매칭 비용은 클래스 확률과 박스 유사도(L1 + GIoU)로 구성된다. 매칭은 **forward마다 다시 계산**되고 gradient는 흐르지 않는다 — 매칭은 "누가 누구를 담당할지"를 정하는 할당 단계일 뿐이고, 학습은 그 할당 아래에서 이뤄진다.'},
 {h:'Object query: 학습되는 100개의 "슬롯"',
  lead:'anchor 대신 학습되는 임베딩이 담당 영역을 스스로 나눠 갖는다.',
  d:'디코더 입력은 이미지가 아니라 **학습 가능한 $N$ 개의 임베딩**이다. 각 query는 self-attention으로 서로를 보며 "네가 저 사람을 맡았으니 나는 다른 걸 맡겠다"는 식으로 역할을 나누고, cross-attention으로 인코더 feature를 조회한다. 학습이 끝나면 각 슬롯이 특정 영역·크기에 특화되는 것이 관찰된다 — 즉 **anchor를 사람이 고르는 대신 모델이 배운다**.'},
 {h:'디코더는 병렬, 그리고 auxiliary loss',
  lead:'모든 query를 한 번에 디코딩하고, 매 층 출력에도 손실을 걸어 수렴을 돕는다.',
  d:'언어 모델의 디코더와 달리 causal mask가 없다 — 집합에는 순서가 없으므로 $N$ 개 query를 **한 번에** 디코딩한다. 대신 6개 디코더 층 **각각의 출력에 동일한 손실을 붙이는**(auxiliary loss) 것이 수렴에 중요하다고 보고한다. 층마다 예측을 점점 다듬는 반복 정제 구조가 자연스럽게 생긴다.'},
 {h:'박스 회귀는 GIoU를 함께 쓴다',
  lead:'스케일에 민감한 L1에 스케일 불변인 GIoU를 더해 균형을 맞춘다.',
  d:'L1 손실만 쓰면 같은 상대 오차라도 큰 박스에서 값이 커져 스케일에 편향된다. 그래서 L1과 **스케일 불변**인 GIoU를 선형 결합한다. 이 조합은 매칭 비용과 최종 손실 양쪽에 같은 형태로 쓰인다.'}
],

figures:[
 {f:'fig1-set-prediction.png',
  cap:'DETR의 전체 흐름을 한 장으로. CNN이 뽑은 특징이 transformer encoder-decoder를 지나면 고정 개수(그림에서는 4개)의 박스 예측이 색깔별로 나온다. 맨 오른쪽 "bipartite matching loss"가 이 논문의 핵심 — 정답 박스(사진 위 테두리)와 예측을 선으로 일대일 연결하고, 짝을 못 찾은 예측은 "no object(∅)"로 벌점을 받는다. NMS 같은 후처리 화살표가 그림 어디에도 없다는 점을 확인하라.',
  src:'원문 Figure 1, p.2'},
 {f:'fig2-architecture.png',
  cap:'backbone → encoder → decoder → prediction heads 4단 구성. 왼쪽 encoder는 이미지 특징(회색 사각형 행)에 위치 인코딩을 더해 self-attention만 수행한다. decoder 입력의 색깔 있는 4개 박스가 **object query** — 학습되는 슬롯이며, 이미지 자체가 아니라 이 슬롯 개수만큼 병렬로 디코딩이 일어난다(원 논문 Transformer의 순차 생성과 다른 지점). 각 query가 독립적으로 FFN을 거쳐 class+box 또는 no-object를 낸다.',
  src:'원문 Figure 2, p.7'}
],

quotes:[
 {t:'We present a new method that views object detection as a direct set prediction problem.',
  src:'Abstract, p.1'}
],

diagram:{type:'compare', cap:'같은 백본, 다른 문제 정의. DETR은 파이프라인의 앞뒤에 붙어 있던 수작업 부품을 손실 함수 안으로 흡수했다.',
 left:{t:'기존: anchor 기반 검출', items:[
  '스케일·비율을 사람이 고른 anchor를 촘촘히 배치',
  'IoU 임계값으로 anchor ↔ 정답 할당',
  '수천~수만 개의 중복 예측',
  'NMS 후처리 (미분 불가)',
  '성능이 임계값 하이퍼파라미터에 민감']},
 right:{t:'DETR: 집합 예측', items:[
  '학습되는 object query 100개',
  'Hungarian matching으로 일대일 할당',
  '정확히 N개 예측, 나머지는 ∅',
  'NMS 없음 — 손실이 중복을 금지',
  'end-to-end로 미분 가능']}},

math:[
 {expr:'σ̂ = argmin over σ ∈ S_N  Σ_i  L_match( y_i , ŷ_σ(i) )',
  tex:'\\hat{\\sigma} = \\underset{\\sigma \\in S_N}{\\text{argmin}} \\sum_i L_{\\text{match}}(y_i, \\hat{y}_{\\sigma(i)})',
  d:'정답 $y$ (∅로 패딩해 크기 $N$)와 예측 $\\hat{y}$ 사이의 최적 이분 매칭. 헝가리안 알고리즘으로 푼다. 이 한 줄이 NMS를 대체한다.'},
 {expr:'L_Hungarian = Σ_i [ -log p̂_σ̂(i)(c_i)  +  1{c_i ≠ ∅} · L_box( b_i , b̂_σ̂(i) ) ]',
  tex:'\\mathcal{L}_{\\text{Hungarian}} = \\sum_i \\Big[-\\log \\hat{p}_{\\hat{\\sigma}(i)}(c_i) + \\mathbb{1}_{\\{c_i \\neq \\varnothing\\}}\\, L_{\\text{box}}(b_i, \\hat{b}_{\\hat{\\sigma}(i)})\\Big]',
  d:'매칭이 정해진 뒤의 실제 손실. 클래스는 negative log-likelihood, 박스는 매칭된 쌍에만 적용한다. ∅ 클래스는 등장 빈도가 압도적이므로 로그 확률에 가중치 1/10을 곱해 균형을 맞춘다.'},
 {expr:'L_box(b, b̂) = λ_L1 · ||b - b̂||₁  +  λ_giou · L_giou(b, b̂)',
  tex:'L_{\\text{box}}(b,\\hat{b}) = \\lambda_{L1}\\lVert b-\\hat{b}\\rVert_1 + \\lambda_{\\text{giou}} L_{\\text{giou}}(b,\\hat{b})',
  d:'L1은 좌표를 직접 맞추고 GIoU는 스케일 불변으로 겹침 정도를 본다. 둘 다 없으면 큰 물체와 작은 물체 사이의 손실 크기가 불균형해진다.'}
],

numbers:[
 {k:'DETR-R50', v:'42.0 AP · 41M params · 86 GFLOPS · 28 FPS', d:'같은 조건의 Faster R-CNN-R50-FPN+ 42.0 AP와 **동률**'},
 {k:'DETR-DC5-R101', v:'44.9 AP', d:'COCO val. 최고 구성'},
 {k:'큰 물체 (APl)', v:'61.1 vs 53.4', d:'Faster R-CNN 대비 **+7.7** — 전역 attention의 이점'},
 {k:'작은 물체 (APs)', v:'20.5 vs 26.6', d:'Faster R-CNN 대비 **-6.1** — 이 논문의 가장 큰 약점'},
 {k:'object query 수', v:'N = 100', d:'COCO 이미지당 최대 물체 수보다 충분히 큰 값'},
 {k:'학습 스케줄', v:'500 epoch · 16× V100 · 3일', d:'Faster R-CNN의 일반적인 스케줄보다 **10~20배 김**'},
 {k:'구조', v:'인코더 6층 · 디코더 6층 · d=256 · head 8', d:'[Transformer](#/p/transformer) 원본과 사실상 같은 규격'}
],

impact:'첫째, **검출 파이프라인에서 손수 만든 부품을 지워도 된다**는 것이 실증되면서, 이후 검출·세그멘테이션·추적·자세추정까지 "집합 예측 + 이분 매칭"이 하나의 범용 레시피가 되었다. 둘째, 같은 코드에 마스크 헤드만 붙여 panoptic segmentation까지 처리한 것을 보이면서, 검출과 세그멘테이션이 서로 다른 파이프라인이어야 할 이유가 사라졌다. 셋째, [Transformer](#/p/transformer)가 [ViT](#/p/vit)와 함께 비전 전반의 기본 골격이 되는 흐름을 가속했다. 다만 500 epoch라는 수렴 속도와 작은 물체 성능은 명백한 약점으로 남았고, 이 두 지점을 고치는 것이 곧바로 후속 연구의 주제가 됐다.',

legacy:[
 '**수렴 속도 개선 계열** — Deformable DETR이 전역 attention을 소수의 샘플링 지점으로 바꿔 학습 epoch를 한 자릿수 배로 줄였고, 이후 DETR 변종들이 쏟아졌다',
 '**집합 예측의 확산** — 같은 매칭 손실이 [Mask R-CNN](#/p/mask-rcnn) 계열을 대체하는 통합 세그멘테이션 모델, 다중 객체 추적, 자세 추정으로 이식됐다',
 '**"NMS 없는 검출"의 표준화** — 이후 YOLO 계열까지 학습 시 일대일 할당을 도입해 추론 단계의 NMS를 없애는 방향으로 수렴했다',
 '**비전에서의 query 패러다임** — 학습되는 query로 무언가를 조회한다는 발상이 [SAM](#/p/sam)의 프롬프트 디코더 등 이후 모델 설계에 반복해서 등장한다'
],

pitfalls:[
 '**"Transformer를 썼더니 좋아졌다"는 이 논문의 요지가 아니다.** 핵심 기여는 **Hungarian matching 기반 집합 손실**이고, Transformer는 query끼리 상호작용시키기에 편리한 도구로 쓰인 것이다. 같은 손실을 CNN 헤드에 붙여도 NMS는 사라진다.',
 '**작은 물체에 그대로 쓰면 실망한다.** 인코더가 백본의 마지막 스테이지 feature 하나만 쓰기 때문에 해상도가 낮다. 소형 객체가 중요한 문제라면 원본 DETR이 아니라 다중 스케일을 쓰는 후속 변종을 골라야 한다.',
 '**$N$은 넉넉히 잡아야 한다.** 이미지 내 물체 수가 $N$ 에 근접하면 성능이 급격히 떨어진다. 반대로 $N$ 을 과하게 키우면 ∅ 예측이 늘어 학습이 느려진다.'
],

links:[
 {t:'arXiv 2005.12872 — End-to-End Object Detection with Transformers', u:'https://arxiv.org/abs/2005.12872'},
 {t:'facebookresearch/detr — 공식 구현 (핵심 모델 코드 ~50줄)', u:'https://github.com/facebookresearch/detr'},
 {t:'Deformable DETR — 수렴 속도와 소형 객체 문제 해결', u:'https://arxiv.org/abs/2010.04159'}
]
});
