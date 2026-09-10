WIKI.paper({
slug:'deformable-detr',
venue:'ICLR 2021',
authors:'Zhu, Su, Lu, Li, Wang, Dai (SenseTime Research · USTC · CUHK)',
arxiv:'2010.04159',

tldr:'[DETR](#/p/detr)의 attention이 이미지 전체 픽셀을 다 쳐다봐서 느리고 작은 물체에 약하다는 문제를, 쿼리마다 **소수의 학습된 샘플링 점**만 보는 deformable attention으로 고친 논문. 학습 epoch을 500에서 50으로 줄이면서 성능도 올렸다.',

context:'DETR은 NMS·앵커 같은 손수 설계 요소를 없애고 Transformer만으로 detection을 푼 첫 end-to-end 모델이지만, 두 가지 약점이 있었다. 첫째, 수렴이 극도로 느리다 — COCO에서 Faster R-CNN이 수십 epoch에 수렴하는데 DETR은 **500 epoch**이 필요하다. 둘째, 작은 물체 탐지 성능이 낮다. 원인은 하나로 좁혀진다: encoder self-attention이 이미지 픽셀 수에 대해 $O(n^2)$ 이라 고해상도·다중 스케일 feature map을 쓸 수 없고, 초기화 시점의 attention은 전체 feature map에 거의 균등하게 퍼져 있어 "어디를 볼지"를 배우는 데 오랜 학습이 걸린다. 이 논문은 이미지 도메인에서 이미 검증된 deformable convolution의 아이디어 — 희소한 위치만 골라서 본다 — 를 attention에 옮겨 쓴다.',

ideas:[
 {h:'Deformable attention: 쿼리마다 K개 점만 본다',
  lead:'참조점 주변의 학습된 K개 샘플링 위치에만 attention을 계산한다.',
  d:'기존 attention은 쿼리 하나가 모든 key(모든 픽셀)와 내적을 계산했다. 여기서는 쿼리 feature에서 선형 투영으로 **오프셋(sampling offset)**과 **가중치(attention weight)**를 바로 예측하고, 참조점 $p_q$ 에 그 오프셋을 더한 소수의 점(기본 K=4)에서만 값을 bilinear interpolation으로 뽑아 가중합한다. key 후보 집합 전체를 스캔하지 않으므로 feature map 크기와 무관하게 계산량이 고정된다.'},
 {h:'선형 복잡도로 다중 스케일 feature map을 그대로 쓴다',
  lead:'attention 하나가 $O(HW C^2)$ 로 feature map 크기에 선형이 되어 다중 스케일 입력이 가능해진다.',
  d:'DETR encoder self-attention은 $O(H^2W^2C)$ 로 픽셀 수의 제곱이라 고해상도 feature map을 넣을 수 없었다. deformable attention은 쿼리당 K개 고정 샘플만 보므로 encoder에 적용하면 $O(HWC^2)$ 로 선형이 된다. 그 덕에 FPN 없이도 4단계 스케일(1/8~1/64) feature map을 통째로 encoder에 넣어 쓸 수 있고, 이것이 작은 물체 성능 개선의 직접적인 이유다.'},
 {h:'학습된 오프셋이 attention을 "어디를 볼지" 문제에서 해방시킨다',
  lead:'attention 가중치를 배우는 대신 볼 위치 자체를 회귀로 예측해 초기화 시 균등 분산 문제를 피한다.',
  d:'DETR이 느린 이유는 attention 가중치가 초기에는 거의 균등($\\approx 1/N_k$)해서 특정 key에 집중하도록 배우는 데 오래 걸리기 때문이다. deformable attention은 "어느 key를 볼지"를 attention 가중치가 아니라 **오프셋 회귀**로 직접 예측하므로, 초기화가 균등해도 문제가 되지 않는다. 이 구조 변화만으로 10배 적은 epoch에 수렴한다.'},
 {h:'Multi-scale deformable attention: 스케일 간 교차도 한 연산으로',
  lead:'참조점을 정규화 좌표로 바꿔 모든 스케일 feature map에서 동시에 K개씩 샘플링한다.',
  d:'단일 스케일 버전을 확장해, 정규화된 참조점 $\\hat p_q \\in [0,1]^2$ 하나를 L개의 서로 다른 해상도 feature map에 동시에 투영하고 각 스케일에서 K개씩 샘플링해 합친다. 별도의 스케일 간 융합 모듈(FPN 같은) 없이 attention 모듈 하나가 스케일 내부·스케일 간 정보를 함께 처리한다.'},
 {h:'반복적 박스 정교화와 2단계 변형',
  lead:'decoder 레이어마다 박스를 조금씩 고쳐 나가고, encoder만으로 region proposal도 만들 수 있다.',
  d:'빠른 수렴 덕에 저자들은 두 가지를 추가로 시도한다. **iterative bounding box refinement**는 각 decoder 레이어가 이전 레이어의 박스 예측을 참조점으로 삼아 상대 오프셋만 예측하게 해, [Cascade R-CNN](#/p/faster-rcnn) 식으로 박스를 단계적으로 정교화한다. **two-stage Deformable DETR**은 decoder 없이 encoder만으로 픽셀마다 박스를 예측해 region proposal을 만든 뒤 그것을 다시 decoder 입력으로 쓴다.'}
],

diagram:{type:'compare', cap:'같은 encoder-decoder 골격에서 attention이 보는 범위만 바뀐다. DETR은 전체 픽셀, Deformable DETR은 참조점 주변 K개 점.',
 left:{t:'DETR', items:['encoder attn: 전체 픽셀, $O(n^2)$','단일 스케일 feature map만 사용','500 epoch에 수렴']},
 right:{t:'Deformable DETR', items:['쿼리마다 학습된 K개 점만 샘플링','다중 스케일 feature map 직접 처리','50 epoch에 수렴, 작은 물체 AP 개선']}},

math:[
 {expr:'DeformAttn(z_q, p_q, x) = Σ_m W_m [ Σ_k A_mqk · W\'_m x(p_q + Δp_mqk) ]',
  tex:'\\text{DeformAttn}(z_q,p_q,x)=\\sum_{m=1}^{M} W_m\\Big[\\sum_{k=1}^{K} A_{mqk}\\cdot W_m^{\\prime}\\,x(p_q+\\Delta p_{mqk})\\Big]',
  d:'$M$ 개 head 각각이 참조점 $p_q$ 주변 $K$ 개 점 $p_q+\\Delta p_{mqk}$ 에서 값을 bilinear interpolation으로 뽑아 attention 가중치 $A_{mqk}$ 로 가중합한다. 오프셋 $\\Delta p_{mqk}$ 와 가중치 $A_{mqk}$ 는 모두 쿼리 feature $z_q$ 하나의 선형 투영에서 나온다.'},
 {expr:'complexity(DeformAttn) = O(2 N_q C² + min(HW C², N_q K C²))',
  tex:'O\\!\\left(2N_qC^{2}+\\min(HWC^{2},\\,N_qKC^{2})\\right)',
  d:'$K \\ll HW$ 이므로 feature map 크기 $HW$ 가 아니라 쿼리 수 $N_q$ 와 고정된 $K$ 에 좌우된다. encoder에 적용하면($N_q=HW$) $O(HWC^2)$ 로 선형, decoder cross-attention에 적용하면($N_q=N$) $O(NKC^2)$ 로 feature map 크기와 무관해진다.'}
],

numbers:[
 {k:'수렴 epoch', v:'500 → 50', d:'DETR 대비 **10배** 적은 epoch. 원문 Table 1, COCO 2017 val 기준'},
 {k:'AP (기본형)', v:'43.8', d:'ResNet-50, single-scale deformable attention, 50 epoch — DETR(500 epoch) 42.0보다 높음'},
 {k:'AP_S / AP_M / AP_L', v:'26.4 / 47.1 / 58.0', d:'DETR(500ep)의 20.5 / 45.8 / 61.1 대비 작은 물체(AP_S)가 크게 개선'},
 {k:'+ iterative box refinement', v:'AP 45.4', d:'decoder 레이어마다 박스를 단계적으로 정교화한 변형, 50 epoch'},
 {k:'++ two-stage', v:'AP 46.2', d:'encoder만으로 region proposal까지 생성하는 최종 변형, 50 epoch'},
 {k:'학습 비용', v:'325 GPU-h', d:'DETR-DC5(500ep) 7000 GPU-h 대비 크게 절감, Faster R-CNN+FPN(380h)과 비슷한 수준'}
],

impact:'DETR을 "느리고 작은 물체에 약한 흥미로운 아이디어"에서 "실전에 쓸 수 있는 detector"로 바꿨다. multi-scale deformable attention은 이후 DETR 계열 거의 전부의 기본 부품이 되어, encoder attention을 $O(n^2)$ 에서 벗어나게 하면서도 다중 스케일을 자연스럽게 다루는 표준 해법으로 자리잡았다. two-stage·iterative refinement 아이디어는 [DINO-DETR](#/p/dino-detr) 등 후속 연구가 그대로 이어받아 발전시켰다.',

legacy:[
 '**DETR 계열의 표준 attention** — [DINO-DETR](#/p/dino-detr)을 비롯한 대부분의 후속 DETR 변형이 deformable attention을 encoder/decoder 기본 모듈로 채택',
 '**분할로 확산** — [Mask2Former](#/p/mask2former)가 multi-scale deformable attention을 masked attention과 결합해 세그멘테이션에 적용',
 '**개방형 탐지로 이어짐** — [Grounding DINO](#/p/grounding-dino)가 DINO-DETR을 통해 이 아키텍처 계보를 이어받아 open-set detection으로 확장',
 '**"학습된 희소 샘플링"이라는 패턴의 재사용** — 전체를 보는 대신 소수의 점을 예측해서 보는 방식이 이후 효율적 attention 설계 전반에서 반복되는 아이디어가 됨'
],

pitfalls:[
 '**"10배 적은 epoch"은 500→50 비교다.** DETR-DC5도 50 epoch만 돌리면 AP 35.3으로 뚝 떨어진다(Table 1) — 즉 DETR 자체가 50 epoch로는 원래 수렴하지 않고, deformable attention의 구조 변화가 그 수렴 속도를 바꾼 것이지 단순히 학습을 짧게 끝낸 게 아니다.',
 '**AP 43.8은 single-scale 기본형 수치다.** iterative bounding box refinement(45.4)나 two-stage(46.2)와 섞어서 인용하면 안 된다. 세 값 모두 같은 Table 1, 50 epoch, COCO 2017 val 기준이지만 서로 다른 변형이다.',
 '**deformable attention은 "attend to all" 자체를 포기한다.** 참조점 근처만 보므로 global receptive field를 self-attention만으로 얻지는 못하고, 여러 encoder 레이어를 쌓아 간접적으로 넓혀야 한다 — 순수 dense attention과는 이 지점에서 근본적으로 다른 선택이다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'왼쪽 위 범례대로 보라색 점선이 encoder 내부 multi-scale deformable self-attention, 빨간 점선이 decoder의 multi-scale deformable cross-attention, 검은 점선이 decoder 내부의 일반 Transformer self-attention. 가운데 4단계 다중 스케일 feature map을 encoder가 그대로 입력받는 것이 DETR과의 핵심 차이.',
  src:'원문 Figure 1, p.2'},
 {f:'fig2-deform-attn.png',
  cap:'쿼리 feature $z_q$ 하나에서 왼쪽 선형층이 head별 sampling offset을, 오른쪽 선형+softmax가 head별 attention weight를 예측한다. 그 오프셋으로 입력 feature map의 K개 점(색칠된 작은 사각형)만 골라 값을 뽑고(Values), 가중치로 합쳐(Aggregate) head별 출력을 만든 뒤 마지막에 concat·linear.',
  src:'원문 Figure 2, p.5'}
],

quotes:[
 {t:'we proposed Deformable DETR, whose attention modules only attend to a small set of key sampling points around a reference.',
  src:'Abstract, p.1'},
 {t:'DETR needs 500 epochs to converge, which is around 10 to 20 times slower than Faster R-CNN',
  src:'Section 1, p.1'}
],

links:[
 {t:'arXiv 2010.04159 — Deformable DETR', u:'https://arxiv.org/abs/2010.04159'},
 {t:'GitHub — fundamentalvision/Deformable-DETR', u:'https://github.com/fundamentalvision/Deformable-DETR'}
]
});
