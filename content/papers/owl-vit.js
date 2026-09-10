WIKI.paper({
slug:'owl-vit',
venue:'ECCV 2022',
authors:'Minderer, Gritsenko et al. (Google Research)',
arxiv:'2205.06230',

tldr:'[CLIP](#/p/clip)처럼 이미지-텍스트를 대조학습으로 사전학습한 [ViT](#/p/vit)에서 토큰 풀링을 떼어내고 토큰마다 박스·분류 헤드를 붙여 탐지 데이터로 미세조정하면, 텍스트만으로 처음 보는 카테고리까지 찾아내는 open-vocabulary 탐지기가 된다는 것을 보인 논문.',

context:'2022년 이전의 object detection은 여전히 **고정된 카테고리 집합**을 가정했다. 새 클래스를 추가하려면 그 클래스의 박스 라벨을 다시 모아야 했고, 이는 LVIS처럼 카테고리가 1000개를 넘는 long-tail 데이터셋에서 특히 비쌌다. 한편 CLIP·ALIGN·LiT 같은 이미지-텍스트 대조학습 모델은 웹에서 거저 얻는 (이미지, 캡션) 쌍만으로 강력한 zero-shot 분류를 보여주고 있었다. ViLD·RegionCLIP·MDETR·GLIP 등은 이 언어 능력을 탐지로 옮기려 했지만, region proposal 증류나 이미지-텍스트 fusion, phrase grounding처럼 **탐지 전용의 복잡한 장치**를 추가했다. 이 논문의 질문은 그런 장치 없이, ViT를 거의 그대로 쓰면서 대조 사전학습 + 탐지 미세조정 두 단계만으로 충분한지였다.',

ideas:[
 {h:'토큰 풀링을 떼고 헤드만 붙인다',
  lead:'ViT의 최종 풀링·투영층을 제거하고 각 출력 토큰에 분류·박스 헤드를 직접 붙인다.',
  d:'표준 ViT는 여러 패치 토큰을 하나로 풀링해 이미지 하나의 벡터를 만든다. OWL-ViT는 이 풀링을 없애고, 마지막 층의 **토큰 하나당 객체 하나**를 예측하게 한다. 토큰 수(예: 768×768 입력에서 576개)가 곧 한 이미지에서 예측 가능한 객체 수의 상한이 되는데, LVIS의 이미지당 최대 인스턴스 수(294개)보다 커서 실무상 병목이 아니다. [DETR](#/p/detr)과 달리 별도 decoder나 query 토큰 없이 인코더 토큰 자체가 예측을 담당해 구조가 한층 더 단순하다.'},
 {h:'분류 가중치를 텍스트 임베딩으로 대체',
  lead:'고정된 클래스 가중치 대신 카테고리 이름을 텍스트 인코더에 통과시킨 임베딩을 분류기로 쓴다.',
  d:'각 토큰의 이미지 임베딩과 쿼리(카테고리 이름) 임베딩을 대응시켜 "이 토큰이 이 쿼리에 해당하는 객체일 확률"을 계산한다. 쿼리는 이미지마다 다르게 줄 수 있어, 사실상 이미지마다 별도의 레이블 공간을 갖는 셈이다. 텍스트 전체 집합을 한 시퀀스로 합쳐 넣는 GLIP·MDETR과 달리, 쿼리마다 독립적으로 텍스트 인코더를 통과시키고 이미지-텍스트 사이에 fusion을 두지 않는다. 그 덕분에 쿼리 임베딩을 이미지와 무관하게 미리 계산해 둘 수 있어 한 이미지에 수천 개 쿼리를 동시에 물어볼 수 있다.'},
 {h:'두 단계뿐인 학습 레시피',
  lead:'대규모 이미지-텍스트 대조 사전학습 다음에 중간 규모 탐지 데이터로 미세조정하는 두 단계가 전부다.',
  d:'1단계는 LiT와 동일한 36억 쌍 이미지-텍스트 데이터로 이미지·텍스트 인코더를 처음부터 대조학습한다(공개 CLIP 가중치를 그대로 쓰는 버전도 실험). 2단계에서 헤드를 붙이고 COCO·O365·Visual Genome 같은 탐지 데이터로 이미지·텍스트 인코더를 **끝까지 함께** 미세조정한다. 탐지 전용 헤드가 차지하는 파라미터는 전체의 최대 1.1%뿐이라, 대부분의 파라미터가 여전히 이미지 수준 사전학습의 혜택을 그대로 이어받는다.'},
 {h:'federated 라벨에 맞춘 손실 조정',
  lead:'DETR의 이분매칭 손실을 쓰되 softmax 대신 focal sigmoid cross-entropy로 다중 라벨을 다룬다.',
  d:'LVIS 같은 federated 데이터셋은 이미지마다 모든 카테고리를 다 라벨링하지 않고, 한 객체가 여러 라벨을 가질 수도 있다. 이를 위해 [DETR](#/p/detr)의 이분매칭 손실은 유지하되 분류 손실을 focal sigmoid cross-entropy(α=0.3, γ=2.0)로 바꿔 클래스 간 배타성을 가정하지 않는다. 또 이미지당 positive·negative뿐 아니라 빈도에 비례해 무작위로 뽑은 "pseudo-negative"를 최소 50개 추가해 학습한다.'},
 {h:'같은 모델이 one-shot 탐지기가 된다',
  lead:'텍스트 쿼리 대신 이미지 패치의 임베딩을 쿼리로 넣으면 수정 없이 이미지 조건부 탐지가 된다.',
  d:'이미지·텍스트 인코더 사이에 fusion이 없다는 설계가 뜻밖의 보너스를 준다. 쿼리 임베딩이 텍스트에서 왔는지 이미지에서 왔는지 모델은 구분하지 않으므로, 예시 이미지 패치 하나의 임베딩을 쿼리로 주면 그대로 "이것과 비슷하게 생긴 객체를 찾아라"는 one-shot 탐지가 된다. 텍스트로 설명하기 어려운 특수 부품 같은 대상에 특히 유용하다.'}
],

diagram:{type:'flow', cap:'대조 사전학습된 ViT/텍스트 인코더에서 풀링을 떼고 헤드를 붙여 탐지로 전이한다.',
 nodes:[
  {t:'ViT+텍스트인코더', s:'이미지-텍스트 대조학습'},
  {t:'풀링 제거+헤드부착', s:'토큰별 박스·분류', acc:true},
  {t:'탐지 데이터 미세조정', s:'이분매칭+focal loss'},
  {t:'텍스트/이미지 쿼리', s:'open-vocab·one-shot'}
 ]},

math:[
 {expr:'FL(p_t) = -α (1 - p_t)^γ log(p_t)',
  tex:'FL(p_t) = -\\alpha\\,(1-p_t)^{\\gamma}\\log(p_t)',
  d:'분류 손실로 softmax 대신 쓰는 focal sigmoid cross-entropy. 논문은 α=0.3, γ=2.0을 사용한다. 각 쿼리-토큰 쌍을 독립적인 이진분류로 다뤄, 한 객체가 여러 라벨을 가질 수 있는 federated 데이터셋(LVIS)에 맞춘다.'}
],

numbers:[
 {k:'LVIS APrare (zero-shot)', v:'31.2%', d:'최고 모델(ViT-L/14, 공개 CLIP 백본, O365+VG로 미세조정). 학습에서 LVIS rare 카테고리의 박스 라벨을 전부 제거한 뒤 측정한 진짜 zero-shot 수치'},
 {k:'LVIS APLVIS (open-vocab)', v:'34.6%', d:'같은 최고 모델의 LVIS 전체 카테고리 AP. rare뿐 아니라 학습에 본 카테고리도 섞여 있어 zero-shot 수치와 **혼동하면 안 된다**'},
 {k:'COCO 미분류(unseen) one-shot AP50', v:'41.8', d:'학습에서 제외한 COCO 카테고리에 대한 이미지 조건부(one-shot, k=1) 탐지. 기존 최고(AIT) 대비 절대값 기준 종전 26.0에서 개선, 저자 표현으로 +72%'},
 {k:'COCO unseen few-shot(k=10) AP50', v:'46.8', d:'같은 unseen 분할에서 쿼리 이미지를 10장으로 늘렸을 때(Table 2 마지막 행)'},
 {k:'COCO AP (open-vocab transfer)', v:'43.5%', d:'ViT-L/14 CLIP 최고 모델. COCO 카테고리 다수가 학습 데이터(OI+VG)에 이미 포함돼 있어 **zero-shot이 아니라** open-vocabulary 전이 성능으로 명시됨'},
 {k:'탐지 헤드 파라미터 비중', v:'≤1.1%', d:'분류·박스 헤드가 전체 파라미터에서 차지하는 최대 비중. 나머지는 전부 이미지 수준 사전학습의 혜택을 받는 인코더'}
],

impact:'탐지 전용 아키텍처 없이도 "대조 사전학습 + 표준 탐지 손실로 미세조정"이라는 두 단계만으로 강력한 open-vocabulary 탐지가 된다는 것을 보여, 이후 open-vocabulary detection 연구의 기본 레시피가 되었다. 텍스트·이미지 인코더를 fusion 없이 분리한 설계는 쿼리를 사전 계산해 수천 개를 동시에 처리하는 실용성과, 텍스트·이미지 쿼리를 모두 받는 유연성을 동시에 얻었다. 이 모델은 Google의 [SigLIP](#/p/siglip) 계열과 함께 실제 제품(예: Grounding SAM 파이프라인)의 텍스트 조건부 탐지 백본으로 널리 재사용되었다.',

legacy:[
 '**Grounding DINO** 등 이후 open-vocabulary 탐지기들이 OWL-ViT가 확립한 "사전학습된 ViT/텍스트 인코더 + 경량 탐지 헤드" 레시피를 그대로 계승·확장',
 '[grounding-dino](#/p/grounding-dino)류의 텍스트-이미지 fusion 강화 계열과, OWL-ViT류의 fusion-없는 경량 계열로 open-vocabulary 탐지 연구가 두 갈래로 갈라짐',
 'OWL-ViT2(2023) 등 후속 연구가 self-training으로 탐지 라벨 자체를 늘려 이 레시피의 데이터 병목을 완화',
 '탐지 커뮤니티에서 "새 아키텍처보다 대조 사전학습 규모"가 성능을 좌우한다는 인식이 자리잡는 계기가 됨'
],

pitfalls:[
 '**APLVIS(open-vocab, 34.6%)와 APLVISrare(zero-shot, 31.2%)를 혼동하기 쉽다.** 같은 표(Table 1) 같은 행에 나란히 나오지만 전자는 학습에 본 카테고리를 포함한 전체 AP이고, 후자만이 진짜 unseen 카테고리 성능이다.',
 '**COCO/O365 수치(43.5%, 15.8%)는 zero-shot이 아니다.** 논문이 명시적으로 "not zero-shot, but open-vocabulary transfer"라고 밝힌다 — 학습 데이터(OI+VG)에 해당 카테고리 대부분이 이미 포함돼 있기 때문이다.',
 '**one-shot 성능(41.8 AP50)은 텍스트 쿼리 성능이 아니다.** Figure 2 예시에서도 보이듯, 같은 대상에 대해 텍스트 쿼리는 실패하는데 이미지 쿼리는 성공하는 경우가 있다 — 두 쿼리 방식의 성능을 같은 표로 착각하면 안 된다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'왼쪽: 이미지·텍스트 인코더를 대조손실로 사전학습(토큰 풀링 있음). 오른쪽: 풀링을 제거하고 토큰마다 선형투영(분류)과 MLP head(박스)를 붙여 탐지로 전이. 쿼리(giraffe/tree/car)의 텍스트 임베딩과 각 토큰 임베딩의 유사도가 곧 분류 점수다.',
  src:'원문 Figure 1, p.3'},
 {f:'fig2-oneshot.png',
  cap:'가운데 작은 이미지가 쿼리(swallowtail butterfly, luna moth). 좌우 큰 이미지에서 초록 박스가 쿼리와 같은 종을 가장 높은 점수로 찾아낸 것. 캡션에 따르면 같은 대상을 텍스트로 물으면 luna moth 쪽은 실패한다 — 이미지 쿼리와 텍스트 쿼리 성능이 다를 수 있음을 보여주는 예시.',
  src:'원문 Figure 2, p.9'}
],

quotes:[
 {t:'We use a standard Vision Transformer architecture with minimal modifications, contrastive image-text pre-training, and end-to-end detection fine-tuning.',
  src:'Abstract, p.1'},
 {t:'Our COCO and O365 results are therefore not "zero-shot", but test the open-vocabulary transfer ability of our model.',
  src:'Section 4.3, p.9'}
],

links:[
 {t:'arXiv 2205.06230 — Simple Open-Vocabulary Object Detection with Vision Transformers', u:'https://arxiv.org/abs/2205.06230'},
 {t:'GitHub — google-research/scenic (owl_vit)', u:'https://github.com/google-research/scenic/tree/main/scenic/projects/owl_vit'}
]
});
