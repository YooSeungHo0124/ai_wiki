WIKI.paper({
slug:'transtrack',
venue:'arXiv 2020 (arXiv-only)',
authors:'Sun et al. (HKU · CMU · ByteDance AI Lab · Tongji)',
arxiv:'2012.15460',

tldr:'이전 프레임에서 찾은 객체의 feature를 **track query**로 삼아 현재 프레임에서 같은 객체를 찾고, 새로 등장한 객체는 학습된 object query로 따로 찾는 Transformer MOT. 두 갈래 상자를 IoU 매칭 한 번으로 합쳐 칼만 필터·Re-ID 없이 MOT17 test에서 MOTA 74.5를 냈다.',

context:'2020년 말의 MOT는 검출기 뒤에 Re-ID, 칼만 필터, 헝가리안 매칭을 줄줄이 붙이는 tracking-by-detection 파이프라인이 주류였다. [Tracktor](#/p/tracktor)와 [CenterTrack](#/p/centertrack)은 이전 프레임 정보를 검출에 직접 넣는 joint-detection-and-tracking 쪽으로 단계를 줄였다. 한편 [DETR](#/p/detr)는 object query가 이미지 feature를 key로 조회해 NMS 없이 집합을 예측하는 구조를 보였다. 저자들은 SOT에서 쓰는 query-key 방식(대상이 query, 이미지 영역이 key)을 MOT로 옮기려 했지만, 새로 등장한 객체는 이전 프레임에 feature가 없어 query가 없다는 문제가 곧바로 드러났다.',

ideas:[
 {h:'Track query: 이전 프레임 객체 feature를 query로',
  lead:'직전 프레임에서 디코딩된 객체 feature를 다음 프레임의 query로 넣어 같은 객체의 위치를 찾는다.',
  d:'프레임 $t-1$ 의 객체 feature(decoder 출력)가 프레임 $t$ 의 track query가 된다. 이 query가 현재 프레임 feature map(공통 key)을 조회해 같은 객체의 현재 위치, 즉 tracking box를 출력한다. 같은 객체의 feature는 프레임 사이에 매우 비슷하다는 SOT의 직관을 그대로 가져온 것이다. 별도의 모션 모델 없이 query가 위치와 외형 정보를 함께 나른다.'},
 {h:'Object query: 신생 객체 전담',
  lead:'DETR식 학습된 object query가 현재 프레임의 모든 객체를 검출해 새로 들어온 객체를 잡는다.',
  d:'track query만 쓰면 첫 프레임에 있던 객체만 추적되고 이후 등장한 객체는 전부 놓친다. Table 3에서 track query만 쓴 설정은 FN이 93.8%까지 치솟는다. 그래서 학습된 object query 세트를 두어 매 프레임 detection box를 따로 낸다. 두 query 세트는 같은 구조의 decoder 두 개에 각각 들어가고, 같은 encoder 출력을 key로 공유한다.'},
 {h:'두 상자 집합을 IoU 매칭으로 합친다',
  lead:'detection box와 tracking box를 IoU 비용의 헝가리안 알고리즘으로 맞춰 최종 ID를 정한다.',
  d:'매칭된 쌍은 기존 트랙으로 이어지고, 매칭되지 않은 detection box는 새 트랙을 만든다. 매칭 안 된 tracking box는 "inactive"로 두었다가 최대 $K=32$ 프레임 안에 detection box와 매칭되면 ID를 되찾는다(track rebirth). Table 5에서 헝가리안과 NMS는 둘 다 MOTA 65.0으로 같았다. 결국 association은 query가 맡고, 이 매칭은 가벼운 마무리 단계다.'},
 {h:'학습: 두 decoder를 같은 집합 손실로',
  lead:'detection box와 tracking box는 같은 이미지의 같은 객체를 예측하므로 DETR식 손실로 함께 학습한다.',
  d:'손실은 focal loss, L1, GIoU의 가중합이고 이분 매칭으로 정답과 짝지은 뒤 계산한다. 학습 입력은 비디오의 인접(또는 임의) 두 프레임이고, 정지 이미지는 무작위로 확대·이동해 인접 프레임을 흉내 낸다. 백본은 ResNet-50이고 기본 구조는 Deformable DETR이다.'}
],

diagram:{type:'split', cap:'현재 프레임 feature를 두 decoder가 공유 key로 쓰고, 한쪽은 신생 객체를 검출하고 다른 쪽은 이전 객체를 추적한 뒤 상자를 합친다.',
 from:{t:'프레임 t feature', s:'인코더 출력 (공통 key)'},
 branches:[
  {t:'object query', s:'→ detection box'},
  {t:'track query', s:'→ tracking box', acc:true}
 ],
 join:'IoU 헝가리안 매칭으로 ID 부여'},

math:[
 {tex:'\\mathcal{L}=\\lambda_{cls}\\mathcal{L}_{cls}+\\lambda_{L1}\\mathcal{L}_{L1}+\\lambda_{giou}\\mathcal{L}_{giou}',
  expr:'L = λcls·Lcls + λL1·LL1 + λgiou·Lgiou',
  d:'DETR 계열의 집합 예측 손실. 분류는 focal loss, 박스는 L1과 generalized IoU. 이분 매칭으로 짝지은 쌍에만 적용하고 배치 안 객체 수로 정규화한다. detection box와 tracking box 두 출력에 같은 손실을 쓴다.'},
 {tex:'\\text{match}(D,T)=\\arg\\max_{\\pi}\\sum_i \\text{IoU}(d_{\\pi(i)},\\,t_i)',
  expr:'match = argmax_π Σ IoU(d_π(i), t_i)',
  d:'추론 때 detection box 집합 $D$ 와 tracking box 집합 $T$ 를 IoU 유사도로 헝가리안(KM) 매칭한다. 매칭 결과가 곧 프레임 간 ID 연결이다.'}
],

numbers:[
 {k:'MOT17 test (private) · MOTA / IDF1 / IDs', v:'74.5 / 63.9 / 3663', d:'CrowdHuman 병행 학습. MOTP 80.6, FN 112137로 검출 쪽 지표는 강하고 ID 지표는 평범'},
 {k:'MOT20 test (private) · MOTA / IDF1', v:'64.5 / 59.2', d:'더 혼잡한 데이터셋. 같은 표의 FairMOT는 MOTA 61.8, CorrTracker는 65.2'},
 {k:'MOT17 val 아키텍처 ablation · MOTA', v:'Transformer 55.4 → Deformable 65.0', d:'DETR 원형은 해상도가 낮아 부족하고 multi-scale Deformable Transformer가 기본값(Table 2)'},
 {k:'입력 query ablation · MOTA', v:'object만 58.3 / 둘 다 65.0', d:'object query만 쓰면 출력 인덱스로 연결해 58.3, 둘을 같이 쓴 기본 설정이 65.0 (Table 3)'},
 {k:'track query만 쓸 때 FN', v:'93.8%', d:'새로 등장한 객체를 못 잡아 FN이 폭증. object query가 필요한 이유(Table 3)'}
],

impact:'TransTrack은 DETR의 query 개념을 "검출용"과 "추적용" 둘로 나눠 MOT에 처음 들여온 사례 중 하나다. 저자들은 자신들이 Transformer를 MOT에 처음 도입했다고 쓴다. 칼만 필터, Re-ID, 별도 NMS 없이 단일 모델로 경쟁력 있는 MOTA를 냈지만 IDF1과 ID switch는 SOTA에 못 미쳤다. 이 한계, 즉 association이 여전히 IoU 매칭에 기대는 점이 곧바로 다음 논문들의 출발점이 됐다.',

legacy:[
 '**동시기 TrackFormer와 MOTR** — 같은 시기에 query를 프레임 사이로 전달하는 방식이 독립적으로 나왔다. [MOTR](#/p/motr)은 TransTrack이 두 프레임 안에서 짧은 tracklet을 IoU로 잇는 점을 차이로 짚는다.',
 '**IoU 매칭 의존의 한계** — [TrackFormer](#/p/trackformer)와 MOTR은 매칭 단계를 줄이거나 없애는 방향으로 갔다.',
 '**비교 기준점으로 정착** — [ByteTrack](#/p/bytetrack)은 BYTE를 끼워 넣는 대상 트래커 중 하나로 TransTrack을 포함하고, MOTR 계열 논문은 비교표에 계속 올린다.',
 '**query 전파 계열의 출발** — track query 개념은 [MOTRv2](#/p/motrv2)를 거쳐 이후 end-to-end MOT로 이어진다.'
],

pitfalls:[
 '**"end-to-end"라고 부르기엔 절반이다.** 두 box 집합을 합치는 IoU 헝가리안 매칭이 추론에 남아 있다. 이 점이 MOTR이 말하는 "IoU 매칭이 필요 없는" end-to-end와 다르다.',
 '**MOTA가 높다고 추적 품질이 좋은 것은 아니다.** MOT17 test에서 MOTA 74.5는 경쟁력 있지만 IDF1 63.9와 IDs 3663은 같은 표의 상위 방법들보다 약하다. 논문도 ID switch 쪽이 열세임을 인정한다.',
 '**아키텍처 선택이 결과를 크게 좌우한다.** 같은 query 설계라도 원형 Transformer로는 MOTA 55.4에 그치고 Deformable로 바꿔야 65.0이 나온다. DETR 구조만 가져다 쓰면 재현이 안 될 수 있다.'
],

figures:[
 {f:'fig3-architecture.png',
  cap:'오른쪽 두 decoder를 비교해서 읽는다. 왼쪽 decoder는 object query(학습된 벡터)를, 오른쪽 decoder는 이전 프레임의 track query를 받는다. 둘 다 왼쪽 encoder 출력(두 프레임 feature)을 cross-attention의 key로 공유하고, 위쪽 Matching 블록이 detection box와 tracking box를 IoU로 맞춘다.',
  src:'원문 Figure 3, p.3'}
],

quotes:[
 {t:'It applies object features from the previous frame as a query of the current frame and introduces a set of learned object queries to enable detecting new-coming objects.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2012.15460 — TransTrack', u:'https://arxiv.org/abs/2012.15460'},
 {t:'GitHub — PeizeSun/TransTrack', u:'https://github.com/PeizeSun/TransTrack'}
]
});
