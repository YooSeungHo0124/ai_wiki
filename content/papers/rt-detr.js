WIKI.paper({
slug:'rt-detr',
venue:'CVPR 2024',
authors:'Zhao, Lv et al. (Baidu Inc · Peking University)',
arxiv:'2304.08069',

tldr:'제목이 곧 주장이다 — **실시간 검출에서 DETR 계열이 YOLO를 이긴다.** 느린 인코더와 불안정한 쿼리 선택이라는 `[DETR](#/p/detr)` 계보의 약점을 하이브리드 인코더와 불확실성 최소 질의 선택으로 풀어, NMS 없이도 YOLO보다 빠르고 정확한 최초의 실시간 end-to-end 검출기를 만들었다.',

context:'2023년 실시간 검출은 여전히 YOLO 계열의 독무대였다. YOLO는 앵커 기반이든 앵커프리든 결국 밀집 후보를 예측한 뒤 **NMS(Non-Maximum Suppression)**로 중복 박스를 걸러내는 구조인데, NMS는 신뢰도·IoU 두 임계값에 민감하고 그 실행 시간이 입력마다 달라 지연시간을 불안정하게 만든다. `[DETR](#/p/detr)`은 이분 매칭으로 NMS 자체를 없앴지만 인코더 연산량이 너무 커서 실시간과는 거리가 멀었다. `[Deformable DETR](#/p/deformable-detr)`이 attention을 희소화해 수렴 속도와 연산량을 크게 줄였지만, 그럼에도 멀티스케일 feature를 다루는 인코더는 여전히 전체 GFLOPs의 49%를 차지하면서 AP 기여는 11%뿐이었다(Lin et al. 인용). 질문은 단순하다 — **NMS를 없앤 DETR이 YOLO보다 느릴 이유가 있는가?**',

ideas:[
 {h:'하이브리드 인코더: intra-scale과 cross-scale을 분리',
  lead:'스케일 내부 상호작용은 attention으로, 스케일 간 융합은 CNN으로 나눠 처리한다.',
  d:'저자들은 변형 실험(A→E)으로 문제를 해부한다. 멀티스케일 feature 전체에 Transformer attention을 거는 것은 중복이 크다 — 저수준 feature는 의미 개념이 빈약해 attention으로 상호작용시켜도 이득이 적다. 그래서 **AIFI**(Attention-based Intra-scale Feature Interaction)는 가장 고수준인 $S_5$에만 self-attention을 걸고, **CCFF**(CNN-based Cross-scale Fusion)는 $S_3, S_4, S_5$ 사이의 융합을 RepBlock 기반 CNN 경로(PANet 스타일)로 처리한다. 변형 D→E(하이브리드 인코더 적용)에서 파라미터가 20% 늘었는데도 지연시간은 24% 줄고 AP는 1.5%p 올랐다.'},
 {h:'불확실성 최소 질의 선택',
  lead:'분류 점수와 위치 예측의 불일치(불확실성)를 손실에 넣어 쿼리 품질을 높인다.',
  d:'기존 DETR 계열 쿼리 선택은 인코더 feature의 분류 신뢰도만으로 top-K를 골라 디코더 초기 쿼리로 쓴다. 문제는 신뢰도가 높다고 위치 예측(박스)까지 정확하다는 보장이 없다는 것 — 분류와 위치는 서로 다른 잠재변수인데 신뢰도 하나로 뭉뚱그린 셈이다. 이 논문은 feature의 불확실성 $U$를 위치 분포 $\\mathcal{P}$와 분류 분포 $\\mathcal{C}$의 차이로 명시적으로 정의하고, 이를 분류 손실에 결합해 학습 중 불확실성 자체를 최소화하도록 만든다.'},
 {h:'NMS가 원천적으로 없다 — 지연시간이 입력에 흔들리지 않는다',
  lead:'후처리 단계 자체가 없어 지연시간이 신뢰도·IoU 임계값과 무관하게 일정하다.',
  d:'저자들은 YOLOv5(앵커 기반)와 YOLOv8(앵커프리)로 NMS 실행시간이 신뢰도 임계값에 얼마나 민감한지 직접 측정해 보인다. 임계값을 낮추면 남는 박스 수가 늘어 NMS 시간이 늘고, 앵커 기반 검출기는 앵커프리보다 박스를 3배 더 뱉어내 NMS가 더 오래 걸린다. RT-DETR은 end-to-end 예측이라 이 변동 자체가 없다.'},
 {h:'디코더 층 수로 재학습 없이 속도를 조절한다',
  lead:'디코더의 다층 구조를 이용해 학습된 모델 그대로 층 수만 줄여 속도-정확도를 조정한다.',
  d:'DETR 디코더는 여러 층을 반복해 쿼리를 점진적으로 정제하는데, 각 층마다 보조 예측 헤드(auxiliary head)를 붙여 학습하면 추론 시 임의의 층에서 멈춰도 유효한 예측을 낼 수 있다. 부록 실험에서 디코더를 6층에서 3~5층으로 줄이면 AP는 소폭 떨어지지만 FPS가 눈에 띄게 오른다(예: R50 6층 대비 Dec5 구성). 하나의 체크포인트로 여러 지연시간 요구사항에 대응할 수 있다는 뜻이다.'},
 {h:'스케일 패밀리로 S/M급 YOLO와도 정면 대결',
  lead:'백본과 인코더·디코더를 축소한 scaled RT-DETR-R18/R34로 경량 YOLO 구간까지 커버한다.',
  d:'L/X급 YOLO만 비교하면 불공정하다는 지적을 피하려고, 저자들은 R18/R34 백본에 인코더 채널·디코더 층 수를 줄인 scaled 버전을 만들어 YOLOv6-S 등 경량 모델과 직접 겨룬다. Scaled RT-DETR-R18-Dec2가 기존 S급 YOLO를 속도·정확도 모두에서 앞선다고 보고한다.'}
],

diagram:{type:'stack', cap:'RT-DETR 파이프라인. 하이브리드 인코더(AIFI+CCFF)가 핵심 기여이고, 그 출력에서 쿼리를 뽑는 지점이 두 번째 기여다.',
 layers:[
  {t:'백본', s:'S3·S4·S5 멀티스케일'},
  {t:'AIFI', s:'S5에만 self-attention', acc:true, note:'고수준만 attention'},
  {t:'CCFF', s:'RepBlock CNN 융합', note:'S3·S4·F5 스케일 간 융합'},
  {t:'불확실성 질의 선택', s:'top-K, 분류+IoU 불확실성'},
  {t:'디코더', s:'보조 헤드로 층별 예측', note:'층 수로 속도 조절'},
  {t:'박스+클래스 출력', s:'NMS 없음'}
 ]},

math:[
 {expr:'U(X) = ||P(X) - C(X)||,  X ∈ R^D',
  tex:'\\mathcal{U}(\\hat{\\mathcal{X}}) = \\lVert \\mathcal{P}(\\hat{\\mathcal{X}}) - \\mathcal{C}(\\hat{\\mathcal{X}}) \\rVert,\\ \\hat{\\mathcal{X}} \\in \\mathbb{R}^D',
  d:'인코더 feature $\\hat{\\mathcal{X}}$ 하나에 대해, 위치 예측 분포 $\\mathcal{P}$와 분류 분포 $\\mathcal{C}$가 얼마나 어긋나는지를 불확실성 $\\mathcal{U}$로 정의한다. 둘이 일치할수록(둘 다 같은 객체를 가리킬수록) 불확실성이 낮다.'},
 {expr:'L(X,Y,Ŷ) = L_box(b̂,b) + L_cls(U(X), ĉ, c)',
  tex:'\\mathcal{L}(\\hat{\\mathcal{X}},\\hat{\\mathcal{Y}},\\mathcal{Y}) = \\mathcal{L}_{box}(\\hat{b},b) + \\mathcal{L}_{cls}(\\mathcal{U}(\\hat{\\mathcal{X}}),\\hat{c},c)',
  d:'분류 손실 $\\mathcal{L}_{cls}$ 안에 불확실성 $\\mathcal{U}$를 직접 끼워 넣어, 학습이 진행되면서 분류와 위치 예측이 서로를 검증하도록 만든다. 결과적으로 top-K로 뽑히는 쿼리가 분류 점수만 높은 게 아니라 위치까지 믿을 만한 feature가 된다.'}
],

numbers:[
 {k:'COCO val2017 AP · RT-DETR-R50', v:'53.1%', d:'T4 GPU·TensorRT FP16·NMS 없음, 108 FPS(batch=1)'},
 {k:'COCO val2017 AP · RT-DETR-R101', v:'54.3%', d:'같은 조건, 74 FPS(batch=1)'},
 {k:'vs DINO-Deformable-DETR-R50', v:'+2.2%p AP, 21배 FPS', d:'53.1% vs 50.9% AP, 108 FPS vs 5 FPS(같은 800×1333 입력, TensorRT FP16)'},
 {k:'Objects365 사전학습 후 AP', v:'55.3% / 56.2%', d:'R50 / R101, fine-tune 후 COCO val2017 기준'},
 {k:'하이브리드 인코더 효과 (변형 D→E)', v:'지연 -24%, AP +1.5%p', d:'파라미터는 20% 늘었지만 latency 12.2ms→9.3ms로 감소'},
 {k:'YOLOv8-L / YOLOv8-X 대비', v:'AP +1.9%p / +0.2%p, FPS +96.4% / +52.1%', d:'RT-DETR-R50 기준, 저자가 동일 T4·TensorRT FP16으로 재측정'}
],

impact:'실시간 검출의 기준선이 YOLO 단일 계열에서 "YOLO vs end-to-end DETR" 경쟁 구도로 바뀌었다. 인코더의 연산 병목을 스케일별로 분해해 해결한 하이브리드 인코더 아이디어는 이후 실시간 Transformer 검출기 설계의 표준 분석 틀이 되었고, 불확실성 기반 쿼리 선택은 "confidence만으로 쿼리를 고르면 위치 품질을 못 담보한다"는 문제의식을 이후 연구에 남겼다. 무엇보다 저자들이 직접 만든 **T4·TensorRT FP16·NMS 포함** end-to-end 속도 벤치마크는, 서로 다른 논문이 서로 다른 GPU·정밀도로 보고하던 실시간 검출 비교를 한 기준으로 재는 시도였다.',

legacy:[
 '**NMS-free 계보의 실전 증명** — DETR이 이론적으로만 우아한 게 아니라 실시간에서도 이긴다는 것을 처음 수치로 보였다',
 '**`[YOLOv10](#/p/yolov10)`과의 경쟁** — 같은 시기 YOLO 계열도 "NMS 없는 실시간 검출"을 정면 목표로 내걸었다. RT-DETR은 Transformer 계보에서, YOLOv10은 CNN 계보에서 같은 문제(후처리 지연 제거)에 도달한 셈이다',
 '**하이브리드 인코더 설계 패턴 확산** — attention은 고수준 semantic에만, 저수준 스케일 융합은 CNN에 맡기는 분업이 이후 경량 Transformer 검출기들의 공통 레시피가 되었다',
 '**Baidu PaddleDetection 생태계로 실용화** — 산업 배포용 실시간 검출기 옵션으로 자리잡으며 이후 RT-DETRv2 등 후속 개선판이 나왔다'
],

pitfalls:[
 '**YOLO 계열 수치는 측정 조건에 따라 순위가 뒤집힌다.** 이 논문의 Table 2 수치는 저자들이 YOLOv5·YOLOv6·YOLOv7·YOLOv8·PP-YOLOE를 **전부 같은 T4 GPU·TensorRT FP16·배치 1**로 재측정하고 동일한 end-to-end NMS 플러그인을 붙여 만든 값이다. 각 YOLO 원 논문이 보고한 FPS(V100, 다른 정밀도, NMS 제외 등)를 그대로 가져와 RT-DETR과 비교하면 이 논문의 비교와 다른 숫자가 나온다 — 인용할 때 반드시 "RT-DETR 논문이 재측정한 값"인지 명시해야 한다.',
 '**AP만 인용하고 지연시간 조건을 빼면 의미가 없다.** "RT-DETR이 53.1% AP로 YOLOv8-L(52.9%)을 이겼다"는 문장만 보면 근소한 차이지만, 이 논문의 핵심은 **같은 정확도 구간에서 지연시간이 더 짧다**는 것이다(Figure 1의 x축이 지연시간). AP 수치만 떼어 인용하면 이 논문의 주장 자체를 놓친다.',
 '**Objects365 사전학습 결과(55.3%/56.2%)와 COCO 단독 학습 결과(53.1%/54.3%)를 혼동하지 않는다.** 같은 R50/R101 모델이라도 사전학습 데이터가 다르면 AP가 다르다.'
],

figures:[
 {f:'fig4-architecture.png', cap:'왼쪽부터: 백본 → S3·S4·S5 멀티스케일 feature → AIFI(가장 위 초록 격자, S5에만 attention) → CCFF(Fusion 블록 3개가 스케일 간 정보를 섞음) → 점선 상자의 불확실성 질의 선택 → Decoder & Head. 오른쪽 아래는 최종 박스 예측.',
  src:'원문 Figure 4, p.5'},
 {f:'fig1-latency-ap.png', cap:'x축이 T4·TensorRT FP16 기준 end-to-end 지연시간(ms), y축이 COCO AP. 빨간 선(RT-DETR)이 같은 지연시간에서 항상 다른 계열보다 위에 있고, 같은 AP라면 항상 왼쪽(더 빠름)에 있다 — 이것이 논문 제목의 근거 그래프다.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'We propose the Real-Time DEtection TRansformer (RT-DETR), the first real-time end-to-end object detector to our best knowledge that addresses the above dilemma.',
  src:'Abstract, p.1'},
 {t:'the encoder accounts for 49% of the GFLOPs but contributes only 11% of the AP in Deformable-DETR',
  src:'Section 4.2, p.4'}
],

links:[
 {t:'arXiv 2304.08069 — DETRs Beat YOLOs on Real-time Object Detection', u:'https://arxiv.org/abs/2304.08069'},
 {t:'RT-DETR 공식 프로젝트 페이지', u:'https://zhao-yian.github.io/RTDETR/'},
 {t:'PaddleDetection RT-DETR 구현', u:'https://github.com/PaddlePaddle/PaddleDetection'}
]
});
