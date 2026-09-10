WIKI.paper({
slug:'yolov4',
venue:'arXiv 2020',
authors:'Bochkovskiy, Wang, Liao (Academia Sinica · Intel)',
arxiv:'2004.10934',

tldr:'새 아키텍처를 제안하는 논문이 아니라, 당시 흩어져 있던 학습 기법 수십 개를 **bag of freebies(학습 비용만 늘리는 것)**와 **bag of specials(추론 비용을 조금 늘리는 것)**로 분류해 대규모 절제 실험으로 "무엇이 실제로 효과가 있는지" 검증한 논문이다. 그렇게 골라낸 조합이 [YOLOv3](#/p/yolov3) 대비 AP 10%·FPS 12%를 동시에 올렸다.',

context:'2020년 초 시점에서 실시간 검출기의 정확도를 올리는 기법들은 논문마다 흩어져 있었고, 서로 다른 백본·다른 GPU·다른 학습 조건에서 보고돼 어떤 조합이 실제로 효과가 있는지 알기 어려웠다. 두 갈래로 정체돼 있었다 — 정확도를 올리려면 [EfficientDet](#/p/efficientdet)처럼 느려지거나, 속도를 지키려면 [YOLOv3](#/p/yolov3) 이후 큰 진전이 없었다. 저자들의 질문은 단순하다. **여러 GPU와 큰 배치가 없어도, 1080Ti·2080Ti 한 장으로 재현 가능한 조합 중 최선은 무엇인가?** 이 논문은 그 답을 찾기 위해 분류 실험과 검출 실험을 각각 별도로 돌려 수십 개 기법의 기여도를 표로 남겼다.',

ideas:[
 {h:'Bag of Freebies vs Bag of Specials',
  lead:'추론 비용을 안 늘리는 기법(BoF)과 조금 늘리는 기법(BoS)을 나눠 따로 절제 실험한다.',
  d:'BoF는 데이터 증강·손실 함수처럼 **학습 방식만 바꾸고 추론 비용은 그대로**인 기법이다(Mosaic, CIoU loss, label smoothing 등). BoS는 SPP·SAM·PANet처럼 **추론 연산을 조금 늘리는 대신 정확도를 올리는** 모듈이다. 이 이분법 자체가 이 논문의 핵심 틀이고, 이후 실시간 검출기 논문들이 공통으로 쓰는 어휘가 됐다.'},
 {h:'CSPDarknet53: 백본의 gradient 중복 제거',
  lead:'CSP 구조로 특징맵을 절반은 그대로, 절반만 블록에 통과시켜 gradient 경로를 분리한다.',
  d:'Cross-Stage-Partial 연결은 입력 특징맵을 둘로 나눠 한쪽만 dense block(또는 residual block)을 통과시키고 나머지와 다시 합친다. 같은 gradient 정보가 여러 층에서 중복 역전파되는 것을 줄여 연산량 대비 표현력을 높인다. 분류 정확도만 보면 CSPResNeXt50이 더 좋지만, **검출 정확도는 CSPDarknet53이 더 높다** — 저자들이 강조하는, "분류에 최적인 백본이 검출에도 최적은 아니다"라는 관찰의 근거다.'},
 {h:'Neck: SPP + PANet, 그리고 shortcut을 concat으로',
  lead:'SPP로 수용영역을 넓히고 PANet 경로를 손봐 저수준 특징이 최상위까지 짧게 도달하게 한다.',
  d:'SPP는 CSPDarknet53 출력 위에 서로 다른 커널 크기의 max-pooling 결과를 이어붙여, 속도 저하 없이 수용영역만 늘린다. Neck은 [YOLOv3](#/p/yolov3)의 FPN 대신 PANet(경로 집계 네트워크)을 쓰는데, 원래 PANet의 shortcut 덧셈을 **concatenation으로 교체**해 병목 없이 여러 스케일 특징을 합친다. SAM도 spatial attention에서 point-wise attention으로 바꿔 저자들 방식에 맞게 수정했다.'},
 {h:'Mosaic + SAT: 새로 제안한 두 데이터 증강',
  lead:'이미지 4장을 이어붙이는 Mosaic과 스스로를 속이도록 학습하는 SAT를 새로 제안한다.',
  d:'Mosaic은 4장의 학습 이미지를 한 장으로 합성해, 한 번의 배치 통계 계산으로 4가지 맥락을 동시에 보게 하고 큰 mini-batch 없이도 배치정규화 통계를 안정시킨다. [CutMix](#/p/cutmix)가 2장을 섞는 것의 확장이다. SAT(Self-Adversarial Training)는 2단계로 진행된다 — 1단계에서 네트워크가 **자기 가중치 대신 입력 이미지를 공격**해 물체가 없는 것처럼 왜곡하고, 2단계에서 그 왜곡된 이미지로 정상 학습한다.',
 },
 {h:'CIoU loss + CmBN + DropBlock의 조합',
  lead:'절제 실험으로 CIoU loss·CmBN·DropBlock·grid sensitivity 제거 조합이 최선임을 확인한다.',
  d:'박스 회귀 손실을 MSE 대신 CIoU로 바꾸면 겹침 면적·중심점 거리·종횡비를 동시에 반영해 수렴이 빨라진다. CmBN은 여러 GPU 없이 한 배치 안의 mini-batch들 사이에서만 통계를 누적하는 절충안이고, DropBlock은 픽셀 단위가 아니라 특징맵의 사각 영역을 통째로 지우는 정규화다. Table 4의 절제 실험에서 이 조합(S+M+IT+GA+CIoU)이 39.6% → 41.5% AP로 가장 크게 기여했다.'}
],

diagram:{type:'stack', cap:'YOLOv4 구성: CSPDarknet53(backbone) + SPP·PANet(neck) + YOLOv3 head(dense prediction). 새 구조라기보다 기존 요소의 최적 조합이다.',
 layers:[
  {t:'입력 이미지', s:'Mosaic·SAT 증강'},
  {t:'CSPDarknet53', s:'backbone · 27.6M', acc:true, note:'CSP로 gradient 중복 절감'},
  {t:'SPP', s:'다중 커널 max-pool concat', note:'수용영역 확장, 속도 유지'},
  {t:'PANet', s:'shortcut→concat 수정', note:'저수준 특징 최단 경로'},
  {t:'YOLOv3 Head', s:'anchor 기반 dense pred'},
  {t:'출력', s:'bbox + class + conf'}
 ]},

math:[
 {expr:'L_CIoU = 1 - IoU + ρ²(b, b_gt)/c² + αv',
  tex:'\\mathcal{L}_{CIoU} = 1 - IoU + \\frac{\\rho^{2}(b,b^{gt})}{c^{2}} + \\alpha v',
  d:'IoU 항 외에 중심점 거리 $\\rho$ 를 감싸는 최소 박스의 대각선 $c$ 로 정규화한 항, 그리고 종횡비 일치도 $v$ 를 더한다. YOLOv4는 박스 회귀 손실로 MSE 대신 이 CIoU를 채택해 Table 4에서 가장 큰 단일 개선을 얻었다.'}
],

numbers:[
 {k:'COCO AP · test-dev2017', v:'43.5% (AP50 65.7%)', d:'608×608 입력, 단일 모델, TTA 없음'},
 {k:'FPS · Tesla V100', v:'약 65 FPS', d:'초록에 제시된 대표값. 논문 Table 10 실측치는 608 입력 기준 62 FPS(batch=1, TensorRT 미사용)'},
 {k:'FPS · RTX 2080Ti/1080Ti', v:'학습 가능', d:'여러 GPU·대형 배치 없이 **GPU 한 장**으로 학습 재현 가능하다는 것이 핵심 주장 중 하나'},
 {k:'YOLOv3 대비 개선', v:'AP +10% · FPS +12%', d:'Figure 1 캡션의 수치(같은 계열 내 비교)'},
 {k:'CIoU 조합 절제 효과', v:'39.6% → 41.5% AP', d:'Table 4, CSPResNeXt50-PANet-SPP 512×512에서 grid sensitivity 제거+Mosaic+IoU threshold+유전 알고리즘+CIoU 조합'},
 {k:'백본 파라미터', v:'CSPDarknet53 27.6M', d:'CSPResNeXt50(20.6M)보다 많지만 검출 정확도는 더 높음(Table 6)'}
],

impact:'이 논문은 "새 구조"가 아니라 "검증된 조합"을 팔았다. Mosaic·CIoU loss·CSP 구조·DropBlock 같은 기법들은 이후 [YOLOv7](#/p/yolov7)을 비롯한 실시간 검출기 계열, 그리고 Ultralytics 계열 구현들의 사실상 기본값이 됐다. 무엇보다 **하나의 GPU로 재현 가능한 SOTA**라는 전제를 지켜서, 학계뿐 아니라 실무에서 바로 재현·응용할 수 있는 검출기라는 실용적 위치를 굳혔다. bag of freebies/specials라는 분류법 자체도 이후 논문들이 새 기법을 소개할 때 쓰는 공통 어휘가 됐다.',

legacy:[
 '**bag of freebies/specials 어휘의 정착** — 이후 실시간 검출기 논문들이 새 기법을 이 틀로 분류해 보고하는 관행이 생겼다',
 '**Mosaic·CIoU·CSP가 사실상 표준 구성요소화** — Ultralytics 계열 구현을 포함해 이후 YOLO 계열 대부분이 기본값으로 채택',
 '**"어디에 무엇을 쓸지" 계열로 분화** — 앵커 제거·재파라미터화·NAS 도입 등으로 [YOLOX](#/p/yolox), [YOLOv7](#/p/yolov7), [YOLOv9](#/p/yolov9)로 이어지고, 그 뒤로 [YOLOv10](#/p/yolov10)·[RT-DETR](#/p/rt-detr)까지 실시간 검출기 계보가 계속됨',
 '**단일 GPU 재현성이라는 기준** — 논문의 실험 재현 가능성 문제 의식이 이후 효율성 지표(FPS/GPU 조건 명시)를 표에 함께 싣는 관행에 영향을 줌'
],

pitfalls:[
 '**측정 조건에 따라 순위가 뒤집힌다.** 이 논문 자체가 Table 8~10에서 Maxwell/Pascal/Volta GPU별로 다른 표를 따로 낸다. FPS를 비교할 때 GPU 세대·batch size·TensorRT/FP16 사용 여부가 다르면 숫자를 직접 비교할 수 없다 — 초록의 "~65 FPS"와 본문 표의 "62 FPS(batch=1, TensorRT 없음)"조차 이 논문 안에서도 다르다.',
 '**"완전히 새로운 아키텍처"로 오해하기 쉽다.** CSPDarknet53·SPP·PANet·YOLOv3 head는 전부 기존 연구에서 가져온 요소이고, 이 논문의 기여는 새 모듈이 아니라 **어떤 조합이 실제로 작동하는지의 대규모 검증**이다.',
 '**분류기 성능과 검출기 성능은 별개다.** Table 6이 보여주듯 ImageNet 분류 정확도가 더 높은 CSPResNeXt50이 검출에서는 CSPDarknet53보다 못하다 — 백본을 고를 때 분류 벤치마크만 보면 틀린 결론에 이른다.'
],

figures:[
 {f:'fig1-speed-accuracy.png',
  cap:'x축이 FPS(Tesla V100), y축이 COCO AP. 오른쪽 위 하늘색 영역이 "real-time"(FPS 30 이상) 구간이며, YOLOv4(초록)가 이 구간에서 EfficientDet(파랑)·ASFF(주황)·YOLOv3(남색)보다 위쪽(더 높은 AP)에 위치한다.',
  src:'원문 Figure 1, p.1'},
 {f:'fig3-mosaic.png',
  cap:'각 칸이 4장의 원본 이미지를 잘라 이어붙인 결과 한 장이다. 파일명이 그대로 찍혀 있어 어떤 원본들이 섞였는지 보인다 — 한 번의 순전파에서 4가지 배경·객체 조합을 동시에 학습한다.',
  src:'원문 Figure 3, p.6'}
],

quotes:[
 {t:"We use new features: WRC, CSP, CmBN, SAT, Mish activation, Mosaic data augmentation, CmBN, DropBlock regularization, and CIoU loss, and combine some of them to achieve state-of-the-art results: 43.5% AP (65.7% AP50) for the MS COCO dataset at a real-time speed of ∼65 FPS on Tesla V100.",
  src:'Abstract, p.1'},
 {t:"It makes everyone can use a 1080 Ti or 2080 Ti GPU to train a super fast and accurate object detector.",
  src:'Introduction (Contributions), p.1'}
],

links:[
 {t:'arXiv 2004.10934 — YOLOv4: Optimal Speed and Accuracy of Object Detection', u:'https://arxiv.org/abs/2004.10934'},
 {t:'공식 구현 (AlexeyAB/darknet)', u:'https://github.com/AlexeyAB/darknet'}
]
});
