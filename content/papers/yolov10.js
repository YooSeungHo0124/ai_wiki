WIKI.paper({
slug:'yolov10',
venue:'NeurIPS 2024',
authors:'Wang et al. (Tsinghua University)',
arxiv:'2405.14458',

tldr:'**NMS 후처리를 없앤 YOLO**. 학습 때는 일대다(one-to-many)와 일대일(one-to-one) 두 헤드를 동시에 최적화하고, 추론 때는 일대일 헤드만 남겨 후처리 없이 바로 박스를 낸다. `[DETR](#/p/detr)`이 애초에 노리던 "NMS 없는 end-to-end 검출"을 실시간 속도로 구현한 셈이다.',

context:'`[YOLOv9](#/p/yolov9)`까지의 YOLO 계열은 학습 때 한 물체에 여러 예측을 배정하는 one-to-many 할당(TAL)을 쓴다. 이는 supervisory 신호가 풍부해 성능에는 좋지만, 추론 때 중복 박스를 걸러내는 **NMS가 필수**다. NMS는 입력마다 검출된 물체 수에 따라 지연시간이 달라지고, 하이퍼파라미터(IoU 임계값 등)에 성능이 민감하며, end-to-end 배포(예: TensorRT 그래프 하나로 export)를 방해한다. `[DETR](#/p/detr)` 계열은 애초에 Hungarian 매칭으로 한 물체에 예측 하나만 배정해 NMS 자체가 필요 없었지만, 이분 매칭 자체가 느리고 수렴이 느려 실시간 속도(수 ms급)를 내지 못했다. `RT-DETR`가 하이브리드 인코더로 이 격차를 좁혔지만 여전히 CNN 기반 YOLO보다 무겁다. YOLOv10은 "YOLO의 구조를 유지한 채 NMS만 제거"하는 쪽에서 문제를 푼다.',

ideas:[
 {h:'이중 라벨 할당: 학습은 둘, 추론은 하나',
  lead:'학습 때 일대다·일대일 헤드를 함께 쓰고 추론 땐 일대일 헤드만 남긴다.',
  d:'같은 backbone·neck 위에 구조와 손실이 동일한 두 헤드를 얹는다. 하나는 기존처럼 TAL로 한 물체에 여러 예측을 배정하는 **일대다 헤드**, 다른 하나는 물체당 예측 하나만 배정하는 **일대일 헤드**(top-1 선택, Hungarian 매칭과 성능은 같지만 학습이 더 빠르다)다. 학습 중에는 둘을 동시에 역전파해 backbone이 일대다의 풍부한 신호를 그대로 받고, 추론 때는 일대다 헤드를 버리고 일대일 헤드만 forward한다. 추가 추론 비용 없이 NMS가 사라진다.'},
 {h:'일관 매칭 메트릭으로 두 헤드를 정렬한다',
  lead:'두 헤드의 $\\alpha,\\beta$를 비례시켜 같은 예측을 "최고"로 뽑게 만든다.',
  d:'두 헤드가 서로 다른 기준으로 양성 샘플을 고르면, 일대일 헤드가 일대다가 고른 최선의 예측과 다른 것을 배우게 되는 **감독 격차**가 생긴다. 저자들은 이 격차를 1-Wasserstein 거리로 정식화하고, 격차가 0이 되는 조건이 두 헤드의 매칭 메트릭이 서로의 거듭제곱 관계($m_{o2o}=m_{o2m}^r$)일 때임을 보였다. 실무적으로는 $\\alpha_{o2o}=r\\cdot\\alpha_{o2m}$, $\\beta_{o2o}=r\\cdot\\beta_{o2m}$ (기본값 $r=1$)만 지키면 되고, 이러면 하이퍼파라미터를 따로 튜닝할 필요도 없어진다.'},
 {h:'효율 중심 재설계: 분류 헤드 경량화 + 다운샘플링 분리',
  lead:'분류 헤드를 depthwise separable conv로 줄이고 다운샘플링을 공간·채널로 분리한다.',
  d:'YOLOv8-S에서 분류 헤드는 회귀 헤드보다 FLOPs가 2.5배 무겁지만, 성능에는 회귀 오차가 더 크게 기여한다. 그래서 분류 헤드를 depthwise separable conv 두 개 + 1×1 conv로 가볍게 바꾼다. 다운샘플링도 기존엔 3×3 stride-2 conv 하나로 공간 축소와 채널 확장을 동시에 했는데($O(\\tfrac{9}{2}HWC^2)$), 이를 1×1 conv(채널 확장) 다음 depthwise conv(공간 축소) 순서로 쪼개 계산량을 $O(2HWC^2+\\tfrac{9}{2}HWC)$로 낮춘다. 또한 각 스테이지의 특징 rank(중복도)를 측정해, 중복이 큰 얕은 rank의 스테이지만 골라 가벼운 CIB 블록으로 교체하는 **rank-guided block design**을 쓴다.'},
 {h:'정확도 중심 재설계: 대형 커널 conv + 부분 self-attention(PSA)',
  lead:'작은 모델엔 7×7 depthwise conv를, 마지막 스테이지엔 절반짜리 self-attention을 더한다.',
  d:'수용영역을 키우려고 CIB 안의 depthwise conv 커널을 7×7로 키우되(재파라미터화 분기로 학습 안정화), 이미 수용영역이 넓은 큰 모델(M 이상)에는 이득이 없어 N/S에만 적용한다. 전역 문맥을 위해 self-attention도 쓰지만 $O(n^2)$ 비용이 부담이라, 채널을 절반만 잘라 그 절반에만 MHSA+FFN을 태우고 나머지와 concat하는 **PSA**를 해상도가 가장 낮은 마지막 스테이지 뒤에만 배치한다. Query/Key 차원은 Value의 절반으로 줄이고 LayerNorm 대신 BatchNorm을 써서 추론 속도를 더 확보한다.'}
],

diagram:{type:'split', cap:'학습 때는 backbone·neck을 공유하는 두 헤드를 함께 최적화한다. 추론 때는 일대다 헤드를 버리고(연한 선) 일대일 헤드만 forward해 NMS 없이 바로 박스를 낸다.',
 from:{t:'Backbone+PAN', s:'특징 공유'},
 branches:[
  {t:'일대다 헤드', s:'TAL·다중 양성', off:true},
  {t:'일대일 헤드', s:'top-1 매칭', acc:true}
 ],
 join:'추론: NMS 없이 박스 출력'},

math:[
 {expr:'m(α, β) = s · p^α · IoU(b̂, b)^β',
  tex:'m(\\alpha,\\beta)=s\\cdot p^{\\alpha}\\cdot \\text{IoU}(\\hat{b},b)^{\\beta}',
  d:'두 헤드가 공유하는 매칭 메트릭. $p$는 분류 점수, $\\text{IoU}(\\hat b,b)$는 예측·정답 박스의 겹침, $s$는 예측 anchor가 물체 안에 있는지의 공간 사전. $\\alpha,\\beta$가 분류와 위치 중 무엇을 더 중시할지 정한다.'},
 {expr:'α_o2o = r·α_o2m,  β_o2o = r·β_o2m  ⇒  m_o2o = (m_o2m)^r',
  tex:'\\alpha_{o2o}=r\\cdot\\alpha_{o2m},\\quad \\beta_{o2o}=r\\cdot\\beta_{o2m}\\ \\Rightarrow\\ m_{o2o}=m_{o2m}^{\\,r}',
  d:'일관 매칭 메트릭 조건. 두 메트릭이 서로의 거듭제곱이 되도록 하면 일대다 헤드가 뽑은 최선의 양성 샘플이 일대일 헤드에서도 최선이 되어, 두 헤드가 같은 방향으로 최적화된다. 기본값은 $r=1$, 즉 $\\alpha_{o2o}=\\alpha_{o2m}$, $\\beta_{o2o}=\\beta_{o2m}$.'}
],

numbers:[
 {k:'COCO AP · YOLOv10-S', v:'46.3%', d:'NMS-free(일대일 헤드) 기준. 같은 모델을 원래 one-to-many+NMS로 학습하면 46.8%로, 여전히 소폭 격차가 있다'},
 {k:'End-to-end latency · YOLOv10-S', v:'2.49ms', d:'T4 GPU · TensorRT FP16 · batch=1(RT-DETR와 동일 프로토콜). 후처리 불필요, 모델 forward만은 2.39ms'},
 {k:'같은 모델을 NMS로 학습·측정', v:'7.15ms', d:'부록 Table 16: YOLOv10-S를 원래 one-to-many+NMS 방식으로 학습·측정하면 latency가 2.9배로 뛴다 — NMS-free의 이득 대부분이 후처리 제거에서 온다'},
 {k:'YOLOv10-S vs RT-DETR-R18', v:'46.3AP@2.49ms vs 46.5AP@4.58ms', d:'거의 같은 정확도에서 **1.8배** 빠름(둘 다 T4·TensorRT FP16·NMS-free 측정)'},
 {k:'YOLOv10-X vs RT-DETR-R101', v:'54.4AP@10.70ms vs 54.3AP@13.71ms', d:'파라미터도 29.5M 대 76M(61% 감소)이면서 **1.3배** 빠름'},
 {k:'NMS 제거 단독 효과(ablation)', v:'7.07ms → 2.44ms', d:'YOLOv8-S를 베이스로 이중 할당만 추가해 NMS를 없애면 AP는 44.9→44.3으로 거의 유지되면서 latency가 4.63ms 줄어든다'}
],

impact:'YOLO 계열 최초로 **후처리 없는 추론**을 실현해, latency가 검출 물체 수나 NMS 임계값에 좌우되지 않고 예측 가능해졌다. 이로써 TensorRT 그래프 하나로 export해 배포하는 진짜 end-to-end 파이프라인이 가능해진다. 성능 면에서도 같은 latency 구간에서 `RT-DETR`와 대등하거나 더 빠르다는 것을 보여, "NMS 없는 실시간 검출"이 DETR 계열의 전유물이 아니라 순수 CNN 기반 YOLO로도 달성 가능함을 증명했다. Ultralytics 공식 코드베이스에 편입되며 산업 배포의 사실상 표준 옵션이 되었다.',

legacy:[
 'Ultralytics 공식 레포에 통합돼 `yolo` CLI 한 줄로 NMS-free 학습·추론이 가능한 표준 옵션이 됨',
 '이중 라벨 할당(dual label assignment)이 이후 실시간 검출기들의 "NMS 제거" 표준 레시피로 자리잡음',
 'CNN 계열(YOLO)과 Transformer 계열(`RT-DETR`)이 "NMS 없는 실시간 검출"이라는 같은 목표를 다른 경로로 달성하며 경쟁 구도를 형성',
 'rank-guided block design·CIB·decoupled downsampling 같은 효율화 기법이 이후 경량 detector 설계의 참고 사례가 됨'
],

pitfalls:[
 '**latency 숫자는 측정 조건에 따라 순위가 뒤집힌다.** 같은 YOLOv10-S가 NMS-free로는 2.49ms, one-to-many+NMS로 학습·측정하면 7.15ms(부록 Table 16)다. 다른 논문의 수치와 비교할 때 NMS 포함 여부·GPU·TensorRT/FP16 여부·batch size가 같은지 반드시 확인해야 한다.',
 '**"NMS-free가 항상 더 정확하다"는 아니다.** 같은 모델을 one-to-many+NMS로 학습하면 여전히 AP가 더 높다(작은 모델 YOLOv10-N은 1.0%p, 큰 모델 YOLOv10-X는 격차 거의 없음). 저자들은 이를 소형 모델의 특징 판별력 부족 탓으로 본다.',
 '**Latency와 Latencyf를 혼동하지 말 것.** 원문 Table 1은 후처리 포함 `Latency`와 모델 forward만의 `Latencyf`를 구분해 싣는다. 다른 자료에서 어느 쪽을 인용했는지 확인하지 않으면 비교가 어긋난다.'
],

figures:[
 {f:'fig2a-dual-assign.png',
  cap:'Backbone→PAN 뒤에 구조가 같은 두 헤드가 붙는다. 위(주황)가 TAL로 다중 양성을 배정하는 일대다 헤드, 아래(초록)가 top-1만 뽑는 일대일 헤드. 학습 때는 둘 다 돌지만 추론 때는 아래 일대일 헤드만 쓴다.',
  src:'원문 Figure 2(a), p.4'},
 {f:'fig1-latency-accuracy.png',
  cap:'x축이 T4·TensorRT FP16 end-to-end latency(ms), y축이 COCO AP. YOLOv10(빨간 굵은 선)이 같은 latency에서 다른 YOLO 계열보다 항상 위에 있고, 특히 저지연 구간(2~5ms)에서 격차가 크다.',
  src:'원문 Figure 1(왼쪽), p.1'}
],

quotes:[
 {t:'the reliance on the non-maximum suppression (NMS) for post-processing hampers the end-to-end deployment of YOLOs and adversely impacts the inference latency.',
  src:'Abstract, p.1'},
 {t:'we adopt the top one selection, which achieves the same performance as Hungarian matching [4] with less extra training time.',
  src:'Section 3.1, p.4'}
],

links:[
 {t:'arXiv 2405.14458 — YOLOv10: Real-Time End-to-End Object Detection', u:'https://arxiv.org/abs/2405.14458'},
 {t:'GitHub — THU-MIG/yolov10', u:'https://github.com/THU-MIG/yolov10'},
 {t:'Ultralytics YOLOv10 docs', u:'https://docs.ultralytics.com/models/yolov10/'}
]
});
