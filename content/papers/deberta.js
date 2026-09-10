WIKI.paper({
slug:'deberta',
venue:'ICLR 2021',
authors:'He, Liu, Gao, Chen (Microsoft)',
arxiv:'2006.03654',

tldr:'단어를 내용(content)과 위치(position) 두 벡터로 분리해 attention을 계산하는 **disentangled attention**과, 절대 위치를 디코딩 직전에만 주입하는 **강화된 마스크 디코더(EMD)**로 [RoBERTa](#/p/roberta)를 개선한 모델. 논문에서 스케일업한 15억 파라미터 버전이 SuperGLUE에서 처음으로 사람 기준선을 넘었다.',

context:'[BERT](#/p/bert)와 [RoBERTa](#/p/roberta)는 각 토큰을 "단어 임베딩 + 절대 위치 임베딩"을 **더한 하나의 벡터**로 표현한다. 하지만 두 단어 사이의 attention은 내용뿐 아니라 **서로 얼마나 떨어져 있는가**에도 크게 좌우된다 — "deep"과 "learning"이 붙어 있을 때와 다른 문장에 따로 있을 때는 관계가 다르다. 상대 위치 임베딩을 쓰는 [XLNet](#/p/xlnet), Transformer-XL류도 있었지만, 이들은 상대 위치 항을 attention 수식의 일부에만 넣었다. DeBERTa는 "내용과 위치가 서로 다른 벡터 공간에서 각자 온전한 attention 항을 가져야 한다"는 쪽으로 더 밀고 나간다.',

ideas:[
 {h:'내용과 위치를 분리한 attention',
  lead:'단어 하나를 내용 벡터 $H$와 상대위치 벡터 $P$ 두 개로 표현해 attention을 네 항으로 쪼갠다.',
  d:'토큰 $i,j$ 사이의 attention 점수를 $\\{H_i,P_{i|j}\\}\\times\\{H_j,P_{j|i}\\}$ 로 전개하면 content-to-content, content-to-position, position-to-content, position-to-position 네 항이 나온다. 상대 위치만 쓰므로 position-to-position 항은 버리고, **content-to-content + content-to-position + position-to-content** 세 항의 합으로 attention 행렬을 계산한다. 기존 상대위치 인코딩들이 흔히 빠뜨리던 position-to-content(쿼리의 위치가 키의 내용에 미치는 영향) 항까지 살린 것이 핵심이다.'},
 {h:'위치 임베딩은 모든 층이 공유',
  lead:'최대 상대거리 $k$로 자른 상대위치 임베딩 하나를 전 층이 재사용한다.',
  d:'상대거리 $\\delta(i,j)\\in[0,2k)$ 로 정의된 위치 임베딩 행렬 $P\\in\\mathbb{R}^{2k\\times d}$ 를 모든 Transformer 층이 공유한다. 사전학습 시 $k=512$ 로 두며, 상대거리별 키·쿼리를 미리 한 번만 계산해 재사용하는 효율적 알고리즘(Algorithm 1)으로 계산량을 줄인다. 최종 attention 점수는 $\\sqrt{3d}$ 로 나누는데, 항이 3개로 늘어난 만큼 분산이 커지는 것을 다시 안정시키기 위해서다.'},
 {h:'절대 위치는 디코딩 직전에만 — Enhanced Mask Decoder',
  lead:'절대 위치 정보를 입력층이 아니라 마지막 Transformer 층 뒤, softmax 직전에 넣는다.',
  d:'"a new store opened beside the new mall"에서 store와 mall을 모두 마스킹하면 상대 위치만으로는 둘을 구별할 수 없다 — 둘 다 앞 단어 "new"에 대해 상대거리가 같기 때문이다. BERT는 절대 위치를 **입력층**에서 바로 섞어 넣지만, DeBERTa는 전체 층이 상대 위치만으로 표현을 학습하게 두고, 마스크 토큰을 예측하는 마지막 단계에서만 절대 위치를 보조 정보로 주입한다. 저자들은 이 늦은 주입(EMD)이 입력층 주입보다 실험적으로 더 낫다고 보고한다.'},
 {h:'스케일 불변 적대적 학습(SiFT)으로 파인튜닝을 안정화',
  lead:'단어 임베딩을 정규화한 뒤 섭동을 가해, 큰 모델에서 커지는 임베딩 노름 편차를 상쇄한다.',
  d:'가상 적대적 학습(virtual adversarial training)은 입력 임베딩에 작은 섭동을 줘 출력이 흔들리지 않도록 정규화하는 기법인데, 모델이 커질수록 임베딩 벡터의 노름 편차가 커져 학습이 불안정해진다. SiFT는 LayerNorm에서 착안해 섭동을 **정규화된** 임베딩에 가한다. 15억 파라미터 모델의 SuperGLUE 파인튜닝에만 적용됐다.'}
],

diagram:{type:'compare', cap:'절대 위치를 섞는 시점의 차이가 BERT류와 DeBERTa를 가른다.',
 left:{t:'BERT: 입력층에서 결합', items:['단어+절대위치를 더해 한 벡터로','전 층이 이 벡터로 attention','내용·위치가 뒤섞여 분리 불가']},
 right:{t:'DeBERTa: 디코딩 직전 결합', items:['전 층은 내용+상대위치로 attention','C2C+C2P+P2C 세 항을 합산','절대위치는 EMD에서 마지막에만',], },
},

math:[
 {expr:'A_ij = Qc_i Kc_jᵀ + Qc_i Kr_δ(i,j)ᵀ + Kc_j Qr_δ(j,i)ᵀ',
  tex:'\\tilde{A}_{i,j}=\\underbrace{Q_i^cK_j^{c\\top}}_{\\text{c2c}}+\\underbrace{Q_i^cK_{\\delta(i,j)}^{r\\top}}_{\\text{c2p}}+\\underbrace{K_j^cQ_{\\delta(j,i)}^{r\\top}}_{\\text{p2c}}',
  d:'세 항의 합이 disentangled attention 점수다. c2c는 보통의 content attention, c2p는 "내 위치에서 저 내용까지의 거리", p2c는 "저 위치의 내용이 내 위치를 얼마나 보는가"를 각각 별도의 투영 행렬로 계산한다.'},
 {expr:'H_o = softmax( Ã / √(3d) ) Vc',
  tex:'H_o=\\text{softmax}\\!\\left(\\frac{\\tilde{A}}{\\sqrt{3d}}\\right)V^c',
  d:'항이 3개로 늘어나 점수의 분산이 커지므로, [Transformer](#/p/transformer)의 $\\sqrt{d}$ 대신 $\\sqrt{3d}$ 로 나눈다. 저자들은 이 스케일링이 대규모 모델 학습 안정성에 특히 중요하다고 밝힌다.'}
],

numbers:[
 {k:'GLUE 평균 (large)', v:'90.0', d:'`RoBERTa-large` 88.82, `ELECTRA-large` 89.46 대비 우위(Table 1)'},
 {k:'MNLI-m/mm (large)', v:'91.1 / 91.1', d:'`RoBERTa-large` 90.2/90.2 대비 **+0.9**'},
 {k:'SQuAD v2.0 F1 (large)', v:'90.7', d:'`RoBERTa-large` 88.4 대비 **+2.3**, 학습 데이터는 절반(78G vs 160G)'},
 {k:'RACE 정확도 (large)', v:'86.8', d:'`RoBERTa-large` 83.2 대비 **+3.6**'},
 {k:'스케일업 모델', v:'48층 · 1.5B 파라미터', d:'`DeBERTa_1.5B`, SiFT 적용'},
 {k:'SuperGLUE 매크로 평균', v:'89.9 (단일) / 90.3 (앙상블)', d:'사람 기준선 89.8을 단일 모델로 처음 추월(2020-12-29 기준), 앙상블은 그 위(2021-01-06 리더보드)'}
],

impact:'상대 위치 인코딩을 "attention 항 하나를 더 넣는" 정도가 아니라 **content-to-position과 position-to-content를 모두 갖춘 완전한 분해**로 밀어붙였고, 위치 정보를 넣는 시점(EMD)까지 따로 설계했다. 결과적으로 학습 데이터가 [RoBERTa](#/p/roberta)의 절반(78G)인데도 GLUE·SQuAD·RACE 전반에서 앞섰다. 가장 상징적인 결과는 이 논문에서 스케일업한 15억 파라미터 버전(`DeBERTa_1.5B`, SiFT 적용)이 **SuperGLUE 매크로 평균에서 처음으로 사람 기준선(89.8)을 단일 모델로 넘었다**(89.9, 2020-12-29 리더보드 기준)는 것이다 — 이는 본 논문(arXiv v6) 안의 결과이며, 이름이 비슷한 후속 모델 DeBERTaV3(별도 논문, ELECTRA식 판별 학습 도입)와는 다른 모델이라는 점에 주의해야 한다.',

legacy:[
 '**disentangled attention**은 이후 등장한 `DeBERTaV2`·`DeBERTaV3`(별도 논문)의 기반이 되며 HuggingFace `microsoft/deberta-v3` 계열로 널리 쓰임',
 '위치 정보를 attention 전 과정이 아니라 **디코딩 직전에만 주입**하는 설계는 상대/절대 위치를 분리해 쓰는 이후 인코더 설계에 참고 사례가 됨',
 '스케일업만으로 사람 기준선을 넘겼다는 결과는 SuperGLUE 리더보드가 이후 대형 [T5](#/p/t5)류·앙상블 경쟁으로 빠르게 넘어가는 계기가 됨',
 'SiFT류 정규화된 적대적 섭동은 대형 모델 파인튜닝 안정화 기법으로 이후 여러 연구에 재사용됨'
],

pitfalls:[
 '**"DeBERTa가 사람을 이겼다"는 이 논문의 base/large 모델이 아니라 48층·1.5B 파라미터로 스케일업하고 SiFT까지 적용한 `DeBERTa_1.5B`(단일)/`DeBERTa_Ensemble` 결과**다(Table 5). Table 1·2의 large 모델(GLUE·SQuAD·RACE) 결과와 혼동하지 않아야 한다.',
 '**이름이 같은 후속 논문 DeBERTaV2/V3와 다른 논문이다.** 이 노트가 다루는 arXiv 2006.03654(ICLR 2021, v6까지 개정)는 disentangled attention + EMD 원 논문이고, ELECTRA식 판별 사전학습을 추가한 DeBERTaV3는 별도로 발표됐다.',
 '학습 데이터가 RoBERTa의 절반(78G vs 160G)이라는 것은 강점으로 강조되지만, 그만큼 데이터 구성(Wikipedia+BookCorpus+OpenWebText+Stories)이 다르다는 점도 성능 차이의 한 요인일 수 있다.'
],

figures:[
 {f:'fig2-emd.png',
  cap:'왼쪽 (a) BERT: 입력 H에 이미 절대 위치가 섞여 있고 Q·K·V가 그 위에서 바로 계산된다. 오른쪽 (b) EMD: Transformer 층들은 내용 H만으로 K·V를 계산하고(하단 실선), 절대 위치 정보 I는 점선 경로를 따라 마지막 층을 n번 통과한 뒤 Query 계산에만 늦게 합류한다 — "위치는 디코딩 직전에"라는 설계를 그림으로 보여준다.',
  src:'원문 Figure 2, p.20'}
],

quotes:[
 {t:'DeBERTa1.5B surpass the human performance on SuperGLUE for the first time in terms of macro-average score (89.9 versus 89.8)',
  src:'Section 5.3, p.8'}
],

links:[
 {t:'arXiv 2006.03654 — DeBERTa', u:'https://arxiv.org/abs/2006.03654'},
 {t:'microsoft/DeBERTa (GitHub)', u:'https://github.com/microsoft/DeBERTa'}
]
});
