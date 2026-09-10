WIKI.paper({
slug:'contriever',
venue:'TMLR 2022',
authors:'Izacard, Caron, Hosseini, Riedel, Bojanowski, Joulin, Grave (Meta AI)',
arxiv:'2112.09118',

tldr:'질의-문서 쌍 라벨 없이, **문서 하나에서 뽑은 두 조각을 양성 쌍으로 삼는 대조학습만으로** 밀집 검색기를 학습한 논문. [DPR](#/p/dpr)이 요구하던 수동 매칭 데이터셋 없이도 BM25와 맞먹는 제로샷 검색기를 만들 수 있음을 보였다.',

context:'[DPR](#/p/dpr) 이후 밀집 검색기는 질의-문서 쌍이 풍부한 데이터셋([MS MARCO](#/p/ms-marco) 등)에서는 강력했지만, 그런 라벨이 없는 새 도메인·새 언어로 옮기면 사정이 달라진다. [BEIR](#/p/splade) 벤치마크가 보여주듯 지도학습된 밀집 검색기는 제로샷 전이에서 오히려 **라벨이 필요 없는 BM25에 밀리는** 경우가 흔했다. 그렇다고 대규모 질의-문서 라벨을 새 도메인마다 만드는 것은 현실적이지 않다. Inverse Cloze Task(ICT)로 라벨 없이 사전학습하는 시도가 있었지만 여전히 BM25에 뒤처졌다. 이 논문은 컴퓨터 비전에서 이미 검증된 대조학습(contrastive learning)을 텍스트 검색에 제대로 밀어붙이면 어디까지 가는지를 묻는다.',

ideas:[
 {h:'같은 문서에서 두 구간을 잘라 양성 쌍으로',
  lead:'무작위로 겹치는 두 텍스트 스팬을 독립적으로 잘라 질의·문서 역할을 시킨다(independent cropping).',
  d:'ICT는 한 문장을 질의로 놓고 그 문장을 제외한 나머지를 문서로 삼는 비대칭 방식이다. 이 논문은 대신 이미지 crop 증강처럼 **하나의 문서에서 두 스팬을 독립적으로 무작위 추출**해 양성 쌍을 만든다. 질의와 문서가 같은 분포에서 나오는 대칭적 구성이고, 두 스팬이 겹칠 수 있어 BM25 같은 어휘 일치 방식과 비슷한 신호도 함께 학습된다. Ablation에서 cropping이 ICT보다 확실히 우수했다(nDCG@10 평균 25.9 → 32.2).'},
 {h:'MoCo로 배치 크기 제약 없이 대량의 음성 샘플',
  lead:'모멘텀 인코더가 이전 배치들의 표현을 큐에 저장해 in-batch negative의 배치 크기 한계를 없앤다.',
  d:'대조학습은 음성 샘플이 많을수록 유리한데, in-batch negative만 쓰면 배치 크기가 그대로 음성 개수가 되어 GPU 메모리에 갇힌다. [MoCo](#/p/moco) 방식을 가져와 질의 인코더는 역전파로, 키 인코더는 지수이동평균으로만 갱신하면서 과거 배치의 표현을 큐에 쌓아 재사용한다.'},
 {h:'질의·문서를 같은 인코더 하나로',
  lead:'bi-encoder이지만 질의용·문서용을 따로 두지 않고 파라미터를 공유한다.',
  d:'[DPR](#/p/dpr)은 질의 인코더와 문서 인코더를 별도로 두었다. 이 논문은 동일한 [BERT](#/p/bert)-base 인코더를 질의·문서 양쪽에 공유해 쓰는 편이 제로샷·few-shot 전이에서 더 안정적이라는 것을 관찰했다. 마지막 층의 hidden state를 평균 풀링해 하나의 벡터로 만들고, 두 벡터의 내적을 관련도 점수로 쓴다.'},
 {h:'라벨 없이도, 라벨을 조금 더해도 이득',
  lead:'완전 비지도 상태로도 BM25와 경쟁하고, MS MARCO로 파인튜닝하면 그 위에 더 강해진다.',
  d:'Contriever는 사전학습만으로 BEIR Recall@100에서 15개 중 11개 데이터셋에서 BM25를 앞섰다. 여기에 MS MARCO로 지도 파인튜닝을 추가하면 BEIR nDCG@10 밀집 bi-encoder 중 최고 성능을 냈고, few-shot(수백~수천 건)만 있어도 BERT를 큰 차이로 이겼다.'}
],

diagram:{type:'flow', cap:'문서 하나에서 겹치는 두 스팬을 잘라 같은 인코더에 통과시키고, 대조손실로 두 표현을 가깝게 당긴다.', acc:true,
 nodes:[
  {t:'원본 문서', s:'긴 텍스트'},
  {t:'무작위 크롭 ×2', s:'겹칠 수 있는 두 스팬', a:'독립 샘플링'},
  {t:'공유 인코더', s:'BERT-base, 평균 풀링', acc:true},
  {t:'InfoNCE 손실', s:'같은 문서 쌍=양성'}
 ]},

math:[
 {expr:'s(q, d) = <f(q), f(d)>',
  tex:'s(q,d)=\\langle f_\\theta(q), f_\\theta(d)\\rangle',
  d:'질의와 문서를 같은 인코더 $f_\\theta$ 로 각각 임베딩한 뒤 내적으로 관련도를 정의한다. 인덱싱 후에는 [FAISS](#/p/faiss) 같은 최근접이웃 탐색으로 검색한다.'},
 {expr:'L(q,k+) = -log[ exp(s(q,k+)/τ) / (exp(s(q,k+)/τ) + Σ exp(s(q,ki)/τ)) ]',
  tex:'\\mathcal{L}(q,k^{+})=-\\log\\frac{\\exp(s(q,k^{+})/\\tau)}{\\exp(s(q,k^{+})/\\tau)+\\sum_{i=1}^{K}\\exp(s(q,k_i)/\\tau)}',
  d:'InfoNCE 손실. 양성 쌍 $(q,k^{+})$의 점수는 높이고, 음성 $(q,k_i)$ 들의 점수는 낮춘다. $\\tau$ 는 온도 파라미터, $K$ 는 큐에 쌓인 음성 개수로 배치 크기와 무관하게 키울 수 있다.'}
],

numbers:[
 {k:'BEIR Recall@100 · 완전 비지도', v:'15개 중 11개서 BM25 능가', d:'라벨 전혀 없이 학습한 상태에서, Figure 1'},
 {k:'BEIR nDCG@10 평균 · MS MARCO 파인튜닝', v:'46.6 (BM25 43.0, DPR 25.5, ANCE 40.5)', d:'14개 데이터셋 평균, 밀집 bi-encoder 중 최고'},
 {k:'BEIR Recall@100 평균 · MS MARCO 파인튜닝', v:'65.0 → 67.1', d:'기존 최고 대비 밀집 검색기 state-of-the-art'},
 {k:'ablation · 양성쌍 구성', v:'ICT 25.9 → Crop 32.2 (nDCG@10 평균)', d:'MS MARCO 파인튜닝 없이, 7개 BEIR 데이터셋 기준'},
 {k:'few-shot · SciFact nDCG@10', v:'BM25 66.5 / BERT 75.2 / Contriever 84.0', d:'질의 729개뿐인 극소 학습셋, 사전학습 없이 파인튜닝 안 한 Contriever 기준'}
],

impact:'Contriever는 "밀집 검색기는 지도학습 없이는 BM25를 못 이긴다"는 통념을 깨고, 라벨 없는 대조학습만으로 실전급 제로샷 검색기를 만들 수 있음을 증명했다. 이후 [HyDE](#/p/hyde)를 비롯한 여러 비지도·약지도 검색 연구가 Contriever를 기본 백본으로 채택했고, 다국어·교차언어 검색(예: 스와힐리 질의로 영어 문서 검색)에서도 강한 전이를 보여 다국어 검색기 학습의 표준 레시피 중 하나가 됐다.',

legacy:[
 '**[HyDE](#/p/hyde)** 가 Contriever를 문서 인코더로 그대로 채택해, LLM이 생성한 가짜 문서를 임베딩하는 데 사용',
 '**mContriever**(다국어판)가 Mr.TyDi·MKQA 등 교차언어 검색 벤치마크의 강력한 비지도 베이스라인으로 정착',
 '독립 크롭핑 기반 대조학습이 이후 GTR·E5 등 범용 텍스트 임베딩 모델의 사전학습 단계에 재사용',
 '"비지도 사전학습 + 소량 파인튜닝"이 새 도메인 검색기를 만드는 표준 절차로 자리잡음'
],

pitfalls:[
 '**완전 비지도 Contriever가 BM25를 모든 지표에서 이긴 것은 아니다.** Recall@100은 15개 중 11개서 앞섰지만, nDCG@10(상위권 정밀도)에서는 TREC-COVID·Touché-2020 두 데이터셋의 큰 격차 때문에 BM25에 여전히 뒤졌다.',
 '**Table 2의 46.6은 비지도 수치가 아니라 MS MARCO로 파인튜닝한 뒤의 값이다.** "Contriever = 완전 비지도"라는 인상과 달리, 논문의 주요 SOTA 비교는 지도 파인튜닝을 거친 버전 기준이라 두 설정을 섞어 인용하면 안 된다.',
 '**긴 문서·시기 특이적 도메인은 취약하다.** TREC-COVID(코로나 이전 데이터로 학습되어 최신 사건 반영 못함)와 Touché-2020(긴 논증 문서)에서 BM25에 크게 밀린 것은 대조학습된 밀집 표현의 일반적 한계로 지적된다.'
],

figures:[
 {f:'fig1-beir-unsupervised.png',
  cap:'막대 4개([REALM](#/p/realm)·[SimCSE](#/p/simcse)·BM25·Contriever)를 데이터셋별로 비교한 Recall@100. 오른쪽 끝 Avg.만 봐도 Contriever(보라)가 BM25(빨강)와 거의 같은 높이이고, 왼쪽 두 데이터셋(Trec-COVID, Touché-2020)에서만 BM25가 확연히 앞선다.',
  src:'원문 Figure 1, p.5'}
],

quotes:[
 {t:'On the BEIR benchmark our unsupervised model outperforms BM25 on 11 out of 15 datasets for the Recall@100.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2112.09118 — Unsupervised Dense Information Retrieval with Contrastive Learning', u:'https://arxiv.org/abs/2112.09118'},
 {t:'facebookresearch/contriever (공식 코드)', u:'https://github.com/facebookresearch/contriever'}
]
});
