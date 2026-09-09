WIKI.paper({
slug:'bahdanau',
venue:'ICLR 2015',
authors:'Bahdanau, Cho & Bengio (Jacobs University Bremen · Université de Montréal)',
arxiv:'1409.0473',

tldr:'encoder가 문장을 벡터 하나로 압축하는 대신, **소스의 모든 위치를 그대로 남겨 두고 decoder가 매 출력 스텝마다 어디를 볼지 스스로 가중치를 계산**하게 만든 논문. 고정 길이 벡터 병목을 제거했고, 부산물로 "정렬(alignment)"을 미분 가능한 형태로 학습해 attention이라는 부품을 만들어냈다.',

context:'[seq2seq](#/p/seq2seq)는 소스 문장 전체를 `<EOS>` 시점의 은닉 상태 하나로 눌러 담는다. 문장이 10단어든 60단어든 그 벡터의 차원은 같으므로, 길어질수록 정보가 손실되는 것은 구조상 필연이다. 실제로 학습 문장 길이를 넘어서는 입력에서 성능이 급격히 무너졌고, seq2seq 저자들이 소스를 뒤집어 넣는 트릭을 쓴 것도 이 압축이 최적화를 얼마나 어렵게 만드는지를 보여준다. 한편 전통 SMT는 원래 **정렬 모델**을 명시적으로 두고 소스 구절과 타깃 구절을 대응시켰다. 이 논문의 질문은 두 세계를 잇는다 — **정렬을 별도 모듈로 두지 말고, 번역 모델 안에서 함께 학습할 수는 없는가?**',

ideas:[
 {h:'문맥 벡터를 스텝마다 새로 만든다',
  lead:'매 출력 스텝마다 소스 위치별 가중합으로 문맥 벡터를 새로 만든다.',
  d:'encoder의 출력은 벡터 하나가 아니라 위치별 annotation 수열 $h_1 \\dots h_S$ 다. decoder는 $i$ 번째 단어를 낼 때마다 자신의 이전 상태 $s_{i-1}$ 을 기준으로 모든 $h_j$ 에 점수를 매기고, softmax로 정규화한 가중치로 **그 스텝 전용 문맥 벡터 $c_i$** 를 만든다. 소스 정보의 총량이 문장 길이에 비례해 유지되므로 병목이 사라진다.'},
 {h:'soft alignment: 정렬을 확률 분포로 푼다',
  lead:'정렬을 이산 결정 대신 소스 위치에 대한 확률 분포로 완화한다.',
  d:'전통적 정렬은 소스 단어와 타깃 단어를 1:1로 잇는 이산적 결정이라 미분이 불가능했고, EM 같은 별도 절차가 필요했다. 여기서는 정렬을 **소스 위치에 대한 확률 분포**로 완화한다. 하드한 선택 대신 부드러운 가중합을 쓰기 때문에 번역 loss만으로 정렬 모델까지 함께 역전파된다. 별도의 정렬 감독 신호는 전혀 없다.'},
 {h:'additive score: 작은 MLP가 매기는 점수',
  lead:'작은 MLP로 디코더 상태와 소스 위치의 궁합 점수를 매긴다.',
  d:'점수 $e_{ij} = v_a^{\\top} \\tanh(W_a s_{i-1} + U_a h_j)$ 는 은닉층 하나짜리 MLP다. 내적이 아니라 덧셈 후 tanh를 쓰기 때문에 **additive(concat) attention**이라 부른다. $s$ 와 $h$ 의 차원이 달라도 되고, 저차원에서 안정적이다. 훗날 [Transformer](#/p/transformer)가 이것을 내적으로 바꾼 이유는 표현력이 아니라 **행렬곱 한 번으로 GPU에서 병렬 처리되기 때문**이다.'},
 {h:'양방향 encoder: annotation에 좌우 문맥을 모두 담는다',
  lead:'양방향 RNN으로 각 위치의 annotation에 좌우 문맥을 함께 담는다.',
  d:'$h_j$ 가 $j$ 번째 단어를 대표하려면 그 단어의 앞뒤 문맥이 다 필요하다. 그래서 정방향 RNN과 역방향 RNN을 따로 돌려 두 상태를 이어 붙인다. 각 annotation이 "해당 위치 주변에 집중된 문장 전체의 요약"이 되고, decoder가 위치를 골라 읽는 것이 의미를 갖게 된다.'},
 {h:'attention 가중치가 그대로 해석 가능한 정렬표가 된다',
  lead:'attention 가중치를 그리면 그대로 사람이 읽는 정렬표가 된다.',
  d:'$\\alpha_{ij}$ 를 행렬로 그리면 영어–프랑스어 사이의 단어 대응이 육안으로 보인다. 어순이 뒤집히는 형용사–명사 구간에서 대각선이 꺾이고, 관사처럼 대응이 없는 단어에서는 가중치가 퍼진다. 모델 내부를 사람이 읽을 수 있는 형태로 노출한 첫 사례에 가깝다.'}
],

diagram:{type:'compare', cap:'같은 encoder–decoder 골격에서, decoder가 무엇을 조건으로 받는가만 바뀌었다.',
 left:{t:'seq2seq (RNNencdec)', items:[
  '소스 전체 → 벡터 v 하나',
  '모든 출력 스텝이 같은 v를 참조',
  '정보량이 문장 길이와 무관하게 고정',
  '길이 30 넘어가면 BLEU 급락',
  '소스 역순 입력 같은 트릭이 필요']},
 right:{t:'Bahdanau (RNNsearch)', items:[
  '소스 위치별 annotation h_1…h_S 유지',
  '스텝마다 c_i = Σ α_ij h_j 재계산',
  '정보량이 문장 길이에 비례',
  '길이 50+ 에서도 성능 유지',
  'α_ij 가 정렬표로 시각화됨']}},

math:[
 {expr:'e_ij = v_aᵀ tanh(W_a s_{i-1} + U_a h_j)',
  tex:'e_{ij} = v_a^{\\top}\\tanh(W_a s_{i-1} + U_a h_j)',
  d:'decoder의 직전 상태와 소스 $j$ 위치 annotation의 궁합 점수. 학습되는 파라미터는 $W_a, U_a, v_a$ 뿐이며, 전체 모델과 함께 역전파된다.'},
 {expr:'α_ij = exp(e_ij) / Σ_k exp(e_ik),   c_i = Σ_j α_ij h_j',
  tex:'\\alpha_{ij}=\\dfrac{\\exp(e_{ij})}{\\sum_k \\exp(e_{ik})},\\quad c_i=\\sum_j \\alpha_{ij} h_j',
  d:'softmax로 정규화한 뒤 annotation을 가중합한다. **이 두 줄이 오늘날 attention의 원형이다** — [Transformer](#/p/transformer)의 $\\text{softmax}(QK^{\\top}/\\sqrt{d})V$ 는 점수 함수만 내적으로 바꾼 같은 식이다.'},
 {expr:'p(y_i | y_1…y_{i-1}, x) = g(y_{i-1}, s_i, c_i),   s_i = f(s_{i-1}, y_{i-1}, c_i)',
  tex:'p(y_i \\mid y_1,\\dots,y_{i-1},x) = g(y_{i-1}, s_i, c_i),\\quad s_i = f(s_{i-1}, y_{i-1}, c_i)',
  d:'seq2seq와 비교하면 조건부에 **스텝마다 다른 $c_i$** 가 들어간 것이 유일한 차이다. 구조를 새로 만든 것이 아니라 병목 한 곳을 바꿨다.'}
],

numbers:[
 {k:'BLEU · 길이 30 학습', v:'13.93 → 21.50', d:'RNNencdec-30 → RNNsearch-30. 같은 조건에서 attention만 추가'},
 {k:'BLEU · 길이 50 학습', v:'17.82 → 26.75', d:'RNNencdec-50 → RNNsearch-50 (WMT14 EN→FR, 전체 문장 기준)'},
 {k:'RNNsearch-50*', v:'28.45', d:'수렴까지 더 학습한 모델. UNK 없는 문장만 보면 **36.15** 로 Moses(35.63)를 상회'},
 {k:'Moses 베이스라인', v:'33.30', d:'전체 문장 기준 phrase-based SMT. 어휘를 3만 단어로 제한한 신경망 모델은 여기엔 못 미쳤다'},
 {k:'어휘 크기', v:'30,000', d:'양쪽 언어 각각 빈도 상위 3만 단어. 나머지는 전부 `UNK` — 이 제약이 성능 비교를 왜곡한다'},
 {k:'정렬 계산량', v:'O(S × T)', d:'소스 길이 × 타깃 길이만큼 점수 계산이 필요. 길이에 대한 제곱 비용이 여기서 처음 등장한다'}
],

impact:'고정 길이 벡터라는 가정이 깨지자 번역 품질이 문장 길이에 대해 평평해졌고, 신경망 기계번역이 SMT를 대체하는 흐름이 결정됐다(구글 번역의 NMT 전환이 2016년). 하지만 더 큰 결과는 **attention이 하나의 재사용 가능한 부품이 된 것**이다. "점수를 매기고, softmax로 정규화하고, 값을 가중합한다"는 연산은 번역과 무관해서 곧바로 이미지 캡셔닝·음성 인식·요약·메모리 네트워크로 옮겨 갔다. 동시에 이 논문은 결정적인 한계도 함께 남겼다 — attention은 소스와 타깃 **사이**에만 쓰였고, 그 양쪽은 여전히 순차적인 RNN이었다. 2년 뒤 [Transformer](#/p/transformer)는 "attention이 이미 임의의 두 위치를 한 홉에 잇는다면 RNN을 통째로 버리고 시퀀스가 자기 자신을 보게 하면 되지 않는가"라는 질문으로 이 계보를 마무리한다.',

legacy:[
 '**self-attention으로의 전개** — [Transformer](#/p/transformer)가 score를 내적으로 바꾸고 RNN을 제거하면서, 이 논문의 두 줄이 현대 모든 대형 모델의 중심 연산이 되었다',
 '**부품의 이식** — attention은 이미지 캡셔닝, 음성 인식, [RAG](#/p/rag)의 문서 참조까지 "가변 개수의 후보 중 무엇을 볼까"라는 문제 전반의 기본 도구가 됐다',
 '**어휘 제약의 노출** — 3만 단어 제한과 UNK 문제가 [BPE 서브워드](#/p/bpe)를 실무 표준으로 밀어 올렸다',
 '**해석 연구의 출발** — attention 가중치를 근거로 읽는 관행이 여기서 시작됐고, 그 타당성을 둘러싼 논쟁은 [Induction Heads](#/p/induction-heads) 같은 후대 기계적 해석 연구로 이어진다'
],

pitfalls:[
 '**"attention을 발명한 논문"이라는 요약은 반만 맞다.** 이 논문의 기여는 정렬을 미분 가능한 soft 가중합으로 만든 것이고, self-attention도 multi-head도 여기엔 없다. attention은 여전히 decoder→encoder 한 방향에만 붙어 있다.',
 '**BLEU 26.75와 Moses 33.30을 나란히 놓고 "이겼다"고 말하면 틀린다.** 신경망 모델은 어휘 3만 단어 제약을 받았고, 논문이 SMT를 넘어선 것은 UNK가 없는 부분집합(36.15 vs 35.63)에서다. 전체 문장 기준으로는 여전히 뒤졌다.',
 '**attention은 병목을 옮겼지 비용을 없애지 않았다.** 소스 길이 × 타깃 길이만큼 점수를 계산해야 하므로, 훗날 [Transformer](#/p/transformer)의 $O(n^2)$ 문제와 [FlashAttention](#/p/flashattention)·[희소 attention](#/p/sparse-attn) 계열 연구의 씨앗이 이미 여기에 있다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'점선 상자가 양방향 encoder. 정방향 $\\overrightarrow{h}_j$ 와 역방향 $\\overleftarrow{h}_j$ 를 이어 붙인 것이 annotation $h_j$ 다. 위쪽 화살표 $\\alpha_{t,j}$ 가 decoder 스텝 $t$ 에서 각 $h_j$ 에 매기는 attention 가중치이고, $\\oplus$ 에서 가중합돼 그 스텝의 문맥 벡터가 된다.',
  src:'원문 Figure 1, p.3'},
 {f:'fig3-alignment-heatmap.png',
  cap:'세로축이 생성된 프랑스어 단어, 가로축이 원문 영어 단어. 칸의 밝기가 $\\alpha_{ij}$ (흰색=1, 검정=0)다. 대각선을 따라 밝은 칸이 이어지는 것이 정렬이고, "European Economic Area"→"la zone économique européenne" 구간처럼 어순이 살짝 바뀌는 곳에서 대각선이 꺾인다. 정렬 감독 신호 없이 번역 loss만으로 이 대응이 나왔다.',
  src:'원문 Figure 3(a), p.6'}
],

quotes:[
 {t:'In this paper, we conjecture that the use of a fixed-length vector is a bottleneck in improving the performance of this basic encoder–decoder architecture, and propose to extend this by allowing a model to automatically (soft-)search for parts of a source sentence that are relevant to predicting a target word, without having to form these parts as a hard segment explicitly.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1409.0473 — Neural Machine Translation by Jointly Learning to Align and Translate', u:'https://arxiv.org/abs/1409.0473'},
 {t:'Luong et al., Effective Approaches to Attention-based NMT (dot-product 계열 비교)', u:'https://arxiv.org/abs/1508.04025'},
 {t:'Attention and Augmented Recurrent Neural Networks (Distill)', u:'https://distill.pub/2016/augmented-rnns/'}
]
});
