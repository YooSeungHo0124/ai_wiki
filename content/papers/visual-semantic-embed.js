WIKI.paper({
slug:'visual-semantic-embed',
venue:'arXiv 2014 (NeurIPS 2014 workshop 계열)',
authors:'Kiros, Salakhutdinov, Zemel (University of Toronto)',
arxiv:'1411.2539',

tldr:'이미지와 문장을 **같은 벡터 공간**에 넣고 랭킹 손실로 정렬해서, 검색(랭킹)과 캡션 생성(디코딩)을 한 파이프라인의 encoder·decoder로 통일한 논문. 이미지-문장 임베딩 공간에서 [word2vec](#/p/word2vec) 스타일의 벡터 산술이 그대로 성립함을 처음 보였다.',

context:'2014년의 이미지 캡셔닝은 크게 세 갈래였다 — 템플릿 채우기, 기존 캡션 조각을 짜깁는 조합 방식, 그리고 [word2vec](#/p/word2vec)식 분포 표현을 조건으로 문장을 생성하는 신경망 방식. 신경망 쪽에서도 랭킹(이미지·문장이 얼마나 어울리는지 점수 매기기)과 생성(문장을 새로 만들기)은 서로 다른 논문·다른 목적함수로 따로 연구되고 있었다. 이 논문은 두 문제를 하나의 encoder-decoder로 묶는다 — encoder가 이미지와 문장을 같은 공간에 넣어 랭킹을 풀고, 그 공간의 벡터를 조건으로 decoder(SC-NLM)가 문장을 새로 생성한다. 문장 인코더로는 [LSTM](#/p/lstm)을 썼고, 당시 막 기계번역에서 성공하던 encoder-decoder 구도를 그대로 "이미지를 문장으로 번역하는 문제"로 재해석했다.',

ideas:[
 {h:'이미지·문장을 하나의 벡터 공간에, 쌍별 랭킹 손실로 정렬',
  lead:'맞는 이미지-문장 쌍의 코사인 유사도를 올리고 무작위로 섞은 오답 쌍은 마진 이상 벌린다.',
  d:'이미지는 ImageNet으로 학습한 CNN의 마지막 레이어(4096차원)를 선형 투영해 임베딩 $x$로, 문장은 [LSTM](#/p/lstm)의 마지막 hidden state를 임베딩 $v$로 만든다. 둘 다 단위 노름으로 정규화해 내적이 곧 코사인 유사도가 되게 한다. 정답 쌍 $(x,v)$의 점수는 올리고, 같은 배치에서 무작위로 뽑은 오답(contrastive) 이미지·문장의 점수는 마진 $\\alpha$ 이하로 누르는 hinge 손실을 이미지→문장, 문장→이미지 양방향으로 더한다.'},
 {h:'SC-NLM: 문장을 구조와 내용으로 분리해 생성',
  lead:'문법적 뼈대(구조)와 실제 단어 선택(내용)을 분리된 벡터로 두고 곱셈적으로 결합한다.',
  d:'기존 언어모델은 문맥 단어들로 다음 단어를 바로 예측하지만, structure-content neural language model(SC-NLM)은 "문장이 어떤 문법적 자리인가"를 나타내는 structure 벡터와 "그 자리에 어떤 의미가 들어가는가"를 나타내는 content 벡터를 따로 두고, 인코더가 만든 멀티모달 벡터 $u$로 content 쪽을 조건화한다. 곱셈적 언어모델(multiplicative neural language model)의 3차 텐서를 세 행렬로 인수분해해 계산량을 줄였다.'},
 {h:'랭킹이 생성보다 먼저 와야 한다는 실험 설계',
  lead:'생성 품질 자동평가가 못 미더우니, 잘 정의된 랭킹 성능으로 encoder를 먼저 검증한다.',
  d:'이미지 캡션 생성은 BLEU·ROUGE 같은 자동 지표가 사람 평가와 잘 안 맞는다는 문제가 있었다. 이 논문은 랭킹(Recall@K)을 생성 품질의 대리 지표로 삼는 관점을 받아들여, encoder가 이미지·문장을 얼마나 잘 정렬하는지를 먼저 확인한 뒤에 그 표현으로 decoder를 조건화한다. 좋은 채점 함수(scoring function)가 있어야 좋은 생성도 가능하다는 논리다.'},
 {h:'멀티모달 공간에서의 벡터 산술',
  lead:'*파란 차 이미지* − "파랑" + "빨강" 이 실제로 빨간 차 이미지들 근처에 온다.',
  d:'단어 벡터를 그냥 더해 문장 벡터를 만드는 **선형 인코더**를 따로 학습시키면, [word2vec](#/p/word2vec)의 "king - man + woman ≈ queen" 같은 유추가 이미지-문장 공간에서도 성립한다. 이미지 임베딩 $I_{bcar}$가 "파랑"+"차" 단어 벡터의 합에 가깝다면, 거기서 "파랑"을 빼고 "빨강"을 더한 벡터로 최근접 이미지를 찾으면 빨간 차 이미지가 나온다. 단, 이 성질은 **선형 인코더**에서만 관찰됐고, 문장을 비선형으로 압축하는 LSTM 인코더에서는 잘 나타나지 않는다고 논문이 직접 밝힌다.'}
],

diagram:{type:'flow', cap:'encoder가 이미지·문장을 멀티모달 공간에 정렬하고, 그 공간의 점을 SC-NLM decoder가 받아 문장을 생성한다.',
 nodes:[
  {t:'이미지', s:'CNN 4096d'},
  {t:'문장', s:'LSTM 마지막 hidden'},
  {t:'멀티모달 공간', s:'같은 K차원', acc:true, note:'랭킹 손실로 정렬'},
  {t:'SC-NLM decoder', s:'구조+내용 결합'},
  {t:'생성된 캡션', s:'단어 순차 생성'}
 ]},

math:[
 {expr:'min_θ ΣΣ max(0, α − s(x,v) + s(x,vk)) + ΣΣ max(0, α − s(v,x) + s(v,xk))',
  tex:'\\min_{\\theta}\\ \\sum_{x}\\sum_{k}\\max\\{0,\\ \\alpha - s(x,v) + s(x,v_k)\\} + \\sum_{v}\\sum_{k}\\max\\{0,\\ \\alpha - s(v,x) + s(v,x_k)\\}',
  d:'쌍별 랭킹 손실. $s(x,v)=x\\cdot v$는 정규화된 이미지·문장 임베딩의 코사인 유사도, $v_k$·$x_k$는 매 epoch 무작위로 다시 뽑는 대조(오답) 샘플이다. 마진 $\\alpha$는 실험에서 0.2로 고정했다.'},
 {expr:'x* = argmax_x (q − w_neg + w_pos)ᵀx / ||q − w_neg + w_pos||',
  tex:'x^{*} = \\underset{x}{\\arg\\max}\\ \\frac{(q - w_{neg} + w_{pos})^{\\top}x}{\\lVert q - w_{neg} + w_{pos}\\rVert}',
  d:'벡터 산술 검색 규칙. 쿼리 이미지 $q$에서 부정 단어 $w_{neg}$를 빼고 긍정 단어 $w_{pos}$를 더한 방향에 가장 가까운 이미지 $x$를 찾는다.'}
],

numbers:[
 {k:'Flickr30K R@1 · 이미지→문장', v:'23.0%', d:'OxfordNet(19층 VGG) 특징 사용 시. AlexNet급 특징만 쓰면 14.8%'},
 {k:'Flickr30K R@1 · 문장→이미지', v:'16.8%', d:'같은 OxfordNet 설정, 검색 방향 반대'},
 {k:'Flickr8K R@1 · 이미지→문장', v:'18.0%', d:'OxfordNet 특징, Med rank 8'},
 {k:'마진 α', v:'0.2', d:'두 데이터셋 모두 동일하게 잘 작동'},
 {k:'단어 임베딩', v:'300d CBOW', d:'word2vec류 continuous bag-of-words로 사전학습 후 고정'},
 {k:'캡션 생성 정성평가', v:'약 800장', d:'SBU 데이터셋에서 샘플링, 환각·모순·성별 오류 등 실패 사례도 직접 공개'}
],

impact:'이미지-텍스트 정렬을 **명시적 공유 임베딩 공간 + 대조/랭킹 손실**로 푸는 틀을 정착시켰다. 이 틀은 이후 [CLIP](#/p/clip)·[ALIGN](#/p/align)이 스케일만 수백만~수십억 쌍으로 키워 재사용한 것과 뼈대가 같다 — CNN·RNN 대신 각각 ViT·Transformer 텍스트 인코더로, hinge 랭킹 손실 대신 InfoNCE로 바뀌었을 뿐이다. 벡터 산술이 멀티모달 공간에서도 성립한다는 관찰은 임베딩 공간이 단순 검색 인덱스가 아니라 **의미가 선형적으로 구조화된 공간**이라는 인식을 심었고, 이는 훗날 텍스트-이미지 조작·CLIP 임베딩 편집 연구의 출발점이 된다.',

legacy:[
 '**공유 임베딩 + 대조학습이라는 CLIP 계열의 뿌리** — [CLIP](#/p/clip)이 데이터·인코더·손실을 전부 키운 것이 사실상 이 논문의 확장판',
 '**의료 도메인 이식** — [ConVIRT](#/p/convirt)가 같은 이미지-텍스트 대조 정렬을 영상-판독문 쌍에 적용',
 '**랭킹을 생성의 대리 지표로 쓰는 관행** — encoder-decoder를 분리해 평가하는 실험 설계가 이후 캡셔닝·VQA 연구에 정착',
 '**임베딩 공간 벡터 산술** — 텍스트-이미지 모델의 잠재공간 편집·스타일 조합 연구 계열로 이어짐'
],

pitfalls:[
 '**벡터 산술(빨간 차 예시)은 LSTM 인코더가 아니라 별도로 학습한 선형(단어합) 인코더에서만 관찰됐다.** 논문이 직접 "LSTM 인코더에서는 이 규칙성이 잘 나타나지 않는다"고 명시한다 — 메인 랭킹 결과와 이 정성 실험은 서로 다른 모델이다.',
 '**m-RNN 같은 log-likelihood 기반 모델과 직접 비교가 애매하다.** m-RNN은 명시적 임베딩 공간을 만들지 않고 perplexity로 검색하므로, 랭킹 속도(행렬곱 한 번 vs 전체 perplexity 계산)에서 이 논문의 방법이 유리하지만 정확도는 지표별로 엇갈린다.',
 '**object detection을 쓰지 않는 순수 전역(global) 특징 모델이다.** DeFrag처럼 R-CNN 검출 결과를 쓰는 방법과 비교하면 해석 가능한 지역 정렬은 없고, 이미지 전체 벡터 하나로만 비교한다.'
],

figures:[
 {f:'fig1-encoder-decoder.png',
  cap:'왼쪽 CNN이 이미지를, 아래 LSTM이 단어열("Steam ship at the dock")을 각각 벡터로 압축해 가운데 Multimodal space(보라색 상자)의 두 점(빨간 원)으로 정렬한다. 오른쪽 SC-NLM decoder는 그 공간의 벡터를 받아 구조(structure)와 내용(content) 벡터를 결합(가운데 삼각형)해 단어를 하나씩 생성한다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'*image of a blue car* - "blue" + "red" results in a vector that is near images of red cars.',
  src:'Abstract / Section 1, p.1'}
],

links:[
 {t:'arXiv 1411.2539 — Unifying Visual-Semantic Embeddings with Multimodal Neural Language Models', u:'https://arxiv.org/abs/1411.2539'},
 {t:'저자 공개 샘플 (Kiros, U. Toronto)', u:'http://www.cs.toronto.edu/~rkiros/lstm_scnlm.html'}
]
});
