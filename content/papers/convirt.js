WIKI.paper({
slug:'convirt',
venue:'Machine Learning for Healthcare (MLHC) 2022 · arXiv 2020',
authors:'Zhang, Jiang, Miura, Manning, Langlotz (Stanford University)',
arxiv:'2010.00747',

tldr:'흉부 X-ray 이미지와 판독문(radiology report)을 **이미지-이미지가 아니라 이미지-텍스트 쌍**으로 양방향 InfoNCE 대조학습해서, 라벨 없이도 ImageNet 사전학습보다 훨씬 데이터 효율적인 의료 영상 인코더를 만든 논문. 2020년 10월 arXiv 공개로 [CLIP](#/p/clip)보다 약 3개월 앞섰고, 이후 [CLIP](#/p/clip) 논문이 "ConVIRT 접근을 단순화한 버전"이라고 직접 자기 위치를 밝힌다.',

context:'의료 영상 분류는 라벨이 극도로 비싸다 — 판독은 전문의만 할 수 있고, 데이터셋마다 수천~수만 장이 한계다. 그래서 실무에서는 자연 이미지로 사전학습한 ImageNet 가중치를 가져다 쓰거나, 판독문에서 규칙 기반으로 라벨(예: "폐렴 있음/없음")을 추출해 지도학습한다. 둘 다 한계가 뚜렷하다. ImageNet은 도메인이 완전히 다른 사진이고, 규칙 기반 라벨 추출은 부정확하고 질환마다 새로 만들어야 한다. 한편 같은 시기 [SimCLR](#/p/simclr)·[MoCo](#/p/moco) 같은 자연 이미지 대조학습이 라벨 없이도 강력한 표현을 만들고 있었지만, 이 논문은 그 방법을 흉부 X-ray에 그대로 적용하면 **거의 도움이 안 된다**는 것을 먼저 확인한다 — 서로 다른 두 환자의 정상 흉부 X-ray는 이미지로서 서로 너무 비슷해서(high inter-class similarity), 같은 이미지의 두 augmentation만 가깝게 당기는 view-기반 대조학습이 판별력 있는 신호를 거의 못 만든다. 그런데 X-ray에는 자연 이미지에 없는 자원이 있다 — 거의 모든 촬영에 **판독문이 함께 딸려 있다**. 이 논문은 이미지끼리가 아니라 **이미지와 그 판독문을 대조**시킨다.',

ideas:[
 {h:'이미지-이미지 대신 이미지-텍스트를 대조한다',
  lead:'같은 이미지의 두 뷰 대신, 같은 스캔의 이미지와 판독문을 양성 쌍으로 삼는다.',
  d:'[SimCLR](#/p/simclr)식 대조학습은 한 이미지의 두 augmentation을 양성 쌍으로 쓰는데, X-ray는 이미지 간 구조적 유사도가 너무 높아 이 신호가 약하다. ConVIRT는 대신 같은 스캔에서 나온 이미지 $x_v$와 판독문 $x_u$를 양성 쌍으로 삼는다. 판독문은 "심장이 커져 있다", "경화 소견 없음" 같은 문장들로, 이미지에 없는 **판별적 의미 정보**를 이미 담고 있다.'},
 {h:'양방향 InfoNCE: image→text 와 text→image 를 함께 최소화',
  lead:'이미지가 텍스트를 맞히는 방향과 텍스트가 이미지를 맞히는 방향, 두 손실을 가중합한다.',
  d:'배치 안의 $N$개 쌍 $(v_i, u_i)$에 대해, $v_i$가 $N$개의 후보 텍스트 중 정답 $u_i$를 고르는 InfoNCE 손실 $\\ell^{(v\\to u)}$과 그 반대 방향 $\\ell^{(u\\to v)}$를 계산해 가중치 $\\lambda$로 합친다. 두 모달리티 사이의 손실이 **비대칭적으로 정의**된다는 점을 논문이 강조한다 — 기존 대조학습은 같은 모달리티 안에서만 비교했다.'},
 {h:'인코더는 도메인 표준을 그대로 쓴다',
  lead:'이미지는 ResNet50, 텍스트는 ClinicalBERT — 새 아키텍처가 아니라 대조 목적함수가 기여다.',
  d:'이미지 인코더 $f_v$는 [ResNet50](#/p/resnet), 텍스트 인코더 $f_u$는 MIMIC 임상노트로 사전학습된 ClinicalBERT([BERT](#/p/bert) 계열)를 쓰고 출력에 max-pooling을 더한다. 각 인코더 위에 비선형 projection head $g_v$, $g_u$를 얹어 같은 $d$차원 공간으로 보낸다. 학습 시 BERT의 임베딩과 앞 6개 층은 얼리고 뒤 6개 층만 미세조정한다.'},
 {h:'augmentation도 도메인에 맞춰 단순화',
  lead:'X-ray는 흑백이라 색상 augmentation을 밝기·대비로만 줄이고, 텍스트는 문장 단위로 샘플링한다.',
  d:'이미지 쪽은 crop·flip·affine·색상 jitter(밝기·대비만, 채도·색조는 흑백이라 제외)·가우시안 블러를 쓴다. 텍스트 쪽은 판독문 전체가 아니라 매 배치마다 **문장 하나를 무작위로 샘플링**해 의미가 깨지지 않는 선에서 다양성을 준다.'}
],

diagram:{type:'split', cap:'같은 스캔에서 나온 이미지와 판독문을 각자 인코더·투영을 거쳐 같은 공간으로 보낸 뒤 양방향 대조손실로 정렬한다.',
 from:{t:'같은 스캔', s:'이미지+판독문 쌍'},
 branches:[
  {t:'이미지 경로', s:'ResNet50 → 투영 v', acc:true},
  {t:'텍스트 경로', s:'ClinicalBERT → 투영 u'}
 ],
 join:'양방향 InfoNCE로 정렬'},

math:[
 {expr:'ℓ_i^(v→u) = −log[ exp(⟨v_i,u_i⟩/τ) / Σ_k exp(⟨v_i,u_k⟩/τ) ]',
  tex:'\\ell_i^{(v\\to u)} = -\\log\\frac{\\exp(\\langle v_i,u_i\\rangle/\\tau)}{\\sum_{k=1}^{N}\\exp(\\langle v_i,u_k\\rangle/\\tau)}',
  d:'이미지→텍스트 InfoNCE. $\\langle v,u\\rangle$는 코사인 유사도, $\\tau$는 온도. 배치 안 $N$개 텍스트 중 진짜 짝을 고르는 $N$-way 분류의 log loss와 같다.'},
 {expr:'L = (1/N) Σ_i [ λ·ℓ_i^(v→u) + (1−λ)·ℓ_i^(u→v) ]',
  tex:'\\mathcal{L} = \\frac{1}{N}\\sum_{i=1}^{N}\\Big[\\lambda\\,\\ell_i^{(v\\to u)} + (1-\\lambda)\\,\\ell_i^{(u\\to v)}\\Big]',
  d:'최종 손실은 image→text와 text→image 두 방향을 가중치 $\\lambda\\in[0,1]$로 합친 것. [CLIP](#/p/clip)의 대칭 대조손실과 형태는 같고 $\\lambda$로 비대칭을 허용하는 점만 다르다.'}
],

numbers:[
 {k:'사전학습 쌍', v:'MIMIC-CXR 약 21.7만', d:'쌍당 평균 이미지 1.7장·문장 6.0개, 골격 영상은 별도로 4.8만 쌍'},
 {k:'RSNA 폐렴 분류 · 1% 라벨(선형)', v:'AUC 90.7', d:'ImageNet 사전학습은 같은 조건에서 82.8'},
 {k:'CheXpert · 10% 라벨(미세조정)', v:'AUC 88.1', d:'ImageNet 100% 전체 라벨 사용 시 87.6과 대등'},
 {k:'제로샷 텍스트→이미지 검색', v:'CheXpert 8×200', d:'8개 이상소견 범주 × 검증 10장/후보 200장, 전문의가 직접 작성한 질의문으로 평가'},
 {k:'데이터 효율성', v:'라벨 10%로 ImageNet 100% 수준', d:'4개 분류 과제 전부에서 재현되는 패턴이라고 저자들이 강조'}
],

impact:'"이미지끼리 대조" 대신 "이미지와 그에 자연히 달린 텍스트를 대조"하는 이 구도는 이후 자연 이미지-텍스트 스케일로 그대로 확장됐다. 논문 자신이 밝히듯 [CLIP](#/p/clip)은 이 접근을 단순화해(비대칭 λ 없이 대칭 손실로, ClinicalBERT 대신 처음부터 학습하는 텍스트 인코더로) 4억 쌍 규모로 키운 것이고, [ALIGN](#/p/align) 역시 같은 구도를 더 큰 노이즈 데이터로 반복했다. 의료 AI 쪽에서는 "라벨 대신 이미 존재하는 판독문을 감독 신호로 쓴다"는 발상이 이후 다수의 의료 비전-언어 모델(PubMedCLIP 등)의 표준 출발점이 됐다.',

legacy:[
 '**[CLIP](#/p/clip)이 직접 인용하며 "단순화한 버전"이라 밝히는 선행 연구** — 같은 이미지-텍스트 양방향 대조 구조를 의료 도메인에서 1년 먼저 검증',
 '**의료 비전-언어 모델의 표준 사전학습 레시피로 정착** — PubMedCLIP 등 다수 후속 연구가 같은 프레임을 인용',
 '**제로샷 검색 평가 관행** — CheXpert 8×200처럼 "라벨 없이 텍스트 질의로 이미지 검색"하는 평가 설계가 의료 벤치마크로 자리잡음',
 '**뷰 기반 대조학습의 한계 지적** — [SimCLR](#/p/simclr)류가 고-클래스간-유사도 도메인(의료 영상)에서 약하다는 실증이 이후 도메인 특화 대조학습 연구의 근거로 인용됨'
],

pitfalls:[
 '**ConVIRT가 처음 제안한 "이미지-텍스트 대조학습" 자체는 아니다.** [visual-semantic-embed](#/p/visual-semantic-embed) 같은 이미지-문장 공유 임베딩 연구가 이미 있었다. ConVIRT의 기여는 InfoNCE 기반 대조 목적함수를 **의료 영상-판독문 쌍**에 적용해 SimCLR류 view-기반 방법의 실패를 실증하고 대안을 제시한 것이다.',
 '**Contrastive-Binary-Loss 베이스라인과 혼동하지 말 것.** 표 2에서 이 베이스라인은 image-image 검색은 ConVIRT에 근접하지만 text-image 검색은 크게 뒤처진다 — 논문은 이를 "명시적 유사도 기반 손실이 없어 두 모달리티 표현이 정렬되지 않기 때문"이라고 설명한다. 즉 대조손실의 구체적 형태(코사인 유사도 기반 InfoNCE)가 이진 분류 손실보다 낫다는 것이 핵심 논거 중 하나다.',
 '**두 개의 서로 다른 사전학습 인코더(흉부용·골격용)가 있다.** 표의 수치를 볼 때 어느 인코더로 어느 다운스트림 과제를 평가했는지 데이터셋 이름(RSNA/CheXpert/COVIDx는 흉부, MURA는 골격)으로 반드시 구분해야 한다.'
],

figures:[
 {f:'fig2-convirt-framework.png',
  cap:'위(파란 배경)가 이미지 경로: 원본 이미지에서 뷰를 샘플링(t_v)해 ResNet 인코더 f_v와 투영 g_v를 거쳐 벡터 v. 아래(초록 배경)가 텍스트 경로: 판독문에서 문장 하나를 샘플링(t_u)해 텍스트 인코더 f_u와 투영 g_u를 거쳐 벡터 u. 오른쪽 점선 삼각형이 양방향 손실 ℓ(v→u)·ℓ(u→v)이 v·u 사이에서 계산됨을 나타낸다.',
  src:'원문 Figure 2, p.6'}
],

quotes:[
 {t:'we find these methods help little on medical images because of their high inter-class similarity',
  src:'Abstract, p.1'},
 {t:'the CLIP model (Radford et al., 2021), which uses a simplified version of the ConVIRT approach',
  src:'Section 2 (Related Work), p.2'}
],

links:[
 {t:'arXiv 2010.00747 — Contrastive Learning of Medical Visual Representations from Paired Images and Text', u:'https://arxiv.org/abs/2010.00747'},
 {t:'PMLR 182 — MLHC 2022 논문 페이지', u:'https://proceedings.mlr.press/v182/'}
]
});
