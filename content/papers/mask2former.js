WIKI.paper({
slug:'mask2former',
venue:'CVPR 2022',
authors:'Cheng, Misra, Schwing, Kirillov, Girdhar (FAIR · UIUC)',
arxiv:'2112.01527',

tldr:'[MaskFormer](#/p/maskformer)의 트랜스포머 디코더에서 표준 교차 어텐션을 **마스크 어텐션**(직전 레이어가 예측한 마스크 영역 안으로만 attend)으로 바꿔, 같은 구조로 의미·인스턴스·파놉틱 세 과제 모두에서 전용 모델을 이겼다. 학습은 **6배 빨리 수렴**했다.',

context:'[MaskFormer](#/p/maskformer)는 픽셀별 분류 대신 마스크 분류로 의미·[파놉틱](#/p/panoptic) 분할을 통일했지만, 세 가지 한계가 있었다. **(1) 인스턴스 분할에서는 [Mask R-CNN](#/p/mask-rcnn) 같은 전용 모델에 밀렸고**, **(2) 300 에폭이라는 긴 학습이 필요했으며**, **(3) 고해상도 마스크 예측이 GPU 메모리를 32GB짜리 한 대에 이미지 한 장밖에 못 올릴 정도로 잡아먹었다.** 원인은 표준 교차 어텐션에 있었다 — 쿼리가 이미지 전체를 attend하다 보니, 지역적인 객체 영역에 집중하는 법을 배우는 데만 많은 에폭이 든다. 이 논문의 질문은 — **쿼리가 처음부터 "어디를 볼지"를 알고 있다면 어떨까?**',

ideas:[
 {h:'마스크 어텐션: 예측된 영역 안에서만 교차 어텐션',
  lead:'직전 레이어의 마스크 예측을 attention 이진 마스크로 써서 전경만 본다.',
  d:'표준 교차 어텐션 $X_l = \\text{softmax}(Q_l K_l^T) V_l + X_{l-1}$ 대신, 직전 레이어가 예측한 마스크 $M_{l-1}$을 attention logit에 더해 배경 위치를 $-\\infty$로 막는다. 쿼리가 이미지 전체를 훑는 대신 **자신이 이미 찾은 전경 영역 안에서만** 특징을 모은다. 문맥 정보는 뒤따르는 self-attention이 쿼리 사이에서 교환하도록 역할을 나눈다.'},
 {h:'효율적 멀티스케일: 레이어마다 다른 해상도를 순환시킨다',
  lead:'1/32·1/16·1/8 해상도 특징을 3개 디코더 레이어에 라운드로빈으로 먹인다.',
  d:'작은 객체를 잡으려면 고해상도 특징이 필요하지만, 모든 레이어에 고해상도를 먹이면 계산량이 폭발한다. 픽셀 디코더의 특징 피라미드에서 세 해상도를 뽑아 연속된 3개 레이어에 순서대로 하나씩 배정하고, 이 3레이어 블록을 $L$번 반복해 총 $3L$개 레이어를 만든다. 기본 픽셀 디코더로는 [Deformable DETR](#/p/deformable-detr)의 멀티스케일 변형 가능 어텐션(MSDeformAttn)을 쓰는데, ablation에서 다른 피라미드 설계보다 세 과제 전부에서 가장 좋은 결과를 냈다.'},
 {h:'학습 효율화 3종: 순서 교체·학습 가능 쿼리·드롭아웃 제거',
  lead:'self-attention을 먼저 태우고 쿼리를 학습 가능하게 하며 드롭아웃을 없앤다.',
  d:'self-attention을 교차 어텐션보다 앞에 둔다 — 첫 self-attention 시점의 쿼리는 아직 이미지 정보가 없어 굳이 나중에 배치할 이유가 없기 때문이다. 쿼리 위치 임베딩뿐 아니라 쿼리 특징 자체도 학습 가능하게 만들어 $M_0$(첫 마스크 예측)를 직접 감독한다. 실험적으로 드롭아웃이 성능을 깎는다는 것을 확인하고 디코더에서 완전히 제거했다.'},
 {h:'포인트 샘플링 손실로 메모리 3배 절감',
  lead:'PointRend처럼 전체 마스크 대신 K개 샘플 포인트에만 손실을 계산한다.',
  d:'헝가리안 매칭 비용과 최종 마스크 손실을 전체 $H \\times W$ 픽셀이 아니라 $K=12544$($112\\times112$)개의 샘플 포인트에서만 계산한다. 매칭 단계에서는 모든 예측·정답 쌍에 같은 포인트 집합을, 최종 손실 단계에서는 중요도 샘플링으로 쌍마다 다른 포인트 집합을 쓴다. 이미지당 학습 메모리가 **18GB → 6GB**로 줄었다.'},
 {h:'세 과제 모두에서 전용 모델을 이긴다',
  lead:'구조를 바꾸지 않고 파놉틱·인스턴스·의미 분할 각각 SOTA를 갱신했다.',
  d:'[MaskFormer](#/p/maskformer)는 파놉틱·의미에서는 경쟁력이 있었지만 인스턴스 분할에서는 전용 아키텍처에 못 미쳤다. Mask2Former는 세 과제 전부에서 각 과제 전용 SOTA 모델을 앞선 **첫 범용 아키텍처**다. 저자들은 이를 "연구 노력을 최소 3배 줄인다"고 표현한다 — 과제마다 새 아키텍처를 설계할 필요가 없어졌기 때문이다.'}
],

diagram:{type:'compare', cap:'같은 메타 구조(백본→픽셀 디코더→트랜스포머 디코더)를 공유하지만, 디코더 내부의 어텐션 순서와 범위가 바뀌었다.',
 left:{t:'MaskFormer 디코더', items:['교차 어텐션이 이미지 전체를 attend','self→cross 순서 고정','쿼리 특징은 0으로 초기화','단일 해상도 특징만 사용']},
 right:{t:'Mask2Former 디코더', items:['교차 어텐션이 예측 마스크 영역만 attend','cross→self로 순서 교체','쿼리 특징도 학습·직접 감독','3해상도를 레이어마다 순환']}
},

math:[
 {expr:'X_l = softmax(M_{l-1} + Q_l K_l^T) V_l + X_{l-1}',
  tex:'X_l=\\text{softmax}\\big(M_{l-1}+Q_lK_l^{\\top}\\big)V_l+X_{l-1}',
  d:'마스크 어텐션의 핵심 한 줄. 직전 레이어의 이진 마스크 $M_{l-1}$을 attention logit에 더해, 전경(1)이면 0을 더하고 배경(0)이면 $-\\infty$를 더해 softmax에서 완전히 배제한다.'}
],

numbers:[
 {k:'PQ · COCO panoptic (R50, 50 epoch)', v:'51.9', d:'[MaskFormer](#/p/maskformer) R50(46.5, 300 epoch) 대비 **+5.4 PQ, 6배 적은 에폭**'},
 {k:'PQ · COCO panoptic (Swin-L)', v:'57.8', d:'[MaskFormer](#/p/maskformer) 대비 **+5.1 PQ**, K-Net 대비 +3.2 PQ, SOTA'},
 {k:'AP · COCO instance (Swin-L)', v:'50.1', d:'Swin-HTC++(전용 인스턴스 분할 모델) 49.5 능가, 경계 정확도(APboundary)는 더 크게 앞섬'},
 {k:'mIoU · ADE20K (Swin-L)', v:'57.7', d:'전용 SOTA인 BEiT-L(57.0)보다 높음'},
 {k:'학습 메모리', v:'18GB → 6GB', d:'포인트 샘플링 손실로 이미지당 메모리 **약 1/3**'},
 {k:'마스크 어텐션 제거 시', v:'AP -5.9 / PQ -4.8', d:'ablation에서 가장 큰 단일 기여 요소'}
],

impact:'[MaskFormer](#/p/maskformer)가 연 "마스크 분류로 통일" 노선을 세 과제 모두에서 실제로 SOTA로 만들었다. 특히 **더 좋은 성능을 더 적은 학습 비용**으로 달성했다는 점이 중요하다 — 마스크 어텐션이라는 국소화 제약 하나가 수렴 속도(6배)와 최종 성능을 동시에 올렸다는 것은, "attention이 전역적일수록 좋다"는 통념에 대한 반례였다. 이후 범용 분할 아키텍처 연구는 사실상 Mask2Former의 디코더를 베이스라인으로 삼게 됐다.',

legacy:[
 '**[SAM](#/p/sam)의 마스크 디코더 설계에 영향** — 가벼운 디코더가 무거운 인코더 특징에 attend하는 비대칭 구조가 이어짐',
 '**비디오·3D로 확장** — Mask2Former의 마스크 어텐션 디코더가 이후 비디오 파놉틱 분할, 3D 인스턴스 분할 등으로 그대로 이식됨',
 '**[SAM 2](#/p/sam2)와의 계보 합류** — Mask2Former가 정착시킨 마스크 분류 디코더 계열과 [SAM](#/p/sam)의 프롬프트 가능 분할 계열이 이후 같은 저자 그룹의 연구에서 서로 참고됨',
 '**포인트 샘플링 손실의 표준화** — 고해상도 마스크를 다루는 이후 연구 대부분이 전체 픽셀 손실 대신 샘플 포인트 손실을 기본값으로 채택'
],

pitfalls:[
 '**마스크 어텐션은 첫 레이어부터 완전한 정보를 갖지 않는다.** $M_0$는 학습 가능한 쿼리 특징에서 나온 초기 추정치이고, 레이어를 거치며 점진적으로 정교해진다 — 첫 레이어부터 정답 마스크로 어텐션이 제한된다고 오해하면 안 된다.',
 '**"메모리를 아낀다"는 포인트 손실이지 포인트 예측이 아니다.** 추론 시에는 여전히 전체 해상도 마스크를 dense하게 예측한다. 학습 손실 계산에서만 포인트를 샘플링한다.',
 '**인스턴스 AP의 개선폭(+0.6, Swin-HTC++ 대비)은 크지 않다.** 대신 경계 정확도(APboundary, +2.1)가 크게 개선됐는데, 이는 고해상도 마스크 예측 덕분이지 AP 자체가 압도적으로 앞선 것은 아니다.'
],

figures:[
 {f:'fig2-decoder.png',
  cap:'왼쪽은 [MaskFormer](#/p/maskformer)와 동일한 백본→픽셀 디코더→트랜스포머 디코더 메타 구조. 오른쪽이 이 논문이 바꾼 디코더 내부 — 아래에서 위로 masked attention(빨강, mask를 입력으로 받음) → self-attention → FFN 순서다. self-attention이 masked attention "다음"에 온다는 점(cross→self 순서 교체)이 핵심.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'In addition to reducing the research effort by at least three times, it outperforms the best specialized architectures by a significant margin on four popular datasets.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2112.01527 — Masked-attention Mask Transformer for Universal Image Segmentation', u:'https://arxiv.org/abs/2112.01527'},
 {t:'Mask2Former 프로젝트 페이지', u:'https://bowenc0221.github.io/mask2former'}
]
});
