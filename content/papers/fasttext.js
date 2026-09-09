WIKI.paper({
slug:'fasttext',
venue:'TACL 2017',
authors:'Bojanowski, Grave, Joulin, Mikolov (Facebook AI Research)',
arxiv:'1607.04606',

tldr:'단어 벡터를 통짜로 학습하지 않고 **문자 n-gram 벡터들의 합**으로 정의한 논문. 이것만으로 어휘 밖 단어(OOV)에 벡터를 줄 수 있게 되고, 굴절·합성어가 많은 언어(독일어·체코어·터키어·한국어)에서 [word2vec](#/p/word2vec)류가 놓치던 형태론 정보를 회수한다.',

context:'[word2vec](#/p/word2vec)과 [GloVe](#/p/glove)는 공통된 가정 위에 서 있다 — **어휘는 유한한 목록이고, 각 항목은 독립적인 벡터를 갖는다.** 영어 위키피디아에서는 그럭저럭 통하지만 두 곳에서 무너진다. 첫째, 학습 때 못 본 단어는 벡터가 아예 없다. 신조어·오타·고유명사·도메인 용어가 전부 여기 걸린다. 둘째, 형태론이 풍부한 언어에서는 어휘 목록 자체가 폭발한다. 핀란드어 명사는 격 변화만 15가지고, 독일어는 명사를 무한히 이어 붙일 수 있으며, 터키어는 하나의 어간에서 수천 개 형태가 나온다. 모델 입장에서 `eat`/`eats`/`eating`/`eaten`은 완전히 무관한 네 개의 인덱스이고, 각각을 **처음부터 따로** 배워야 한다. 철자가 겹친다는 명백한 단서를 통째로 버리고 있는 셈이다.',

ideas:[
 {h:'단어 = 자기 문자 n-gram들의 합',
  lead:'단어를 경계 기호가 붙은 문자 n-gram들의 벡터 합으로 표현한다.',
  d:'단어를 `<`, `>` 로 감싼 뒤 길이 3~6의 모든 문자 n-gram으로 쪼갠다. `where` → `<wh, whe, her, ere, re>` (+ 3-gram 외 4~6gram) 그리고 특수 시퀀스 `<where>` 자체. **벡터를 갖는 것은 단어가 아니라 이 n-gram들**이고, 단어 벡터는 그 합이다. 경계 기호가 중요한데, 단어 `her`의 `<her>` 와 `where` 안의 `her` 를 구분해준다.'},
 {h:'Skip-gram 목적함수는 그대로, 점수 함수만 교체',
  lead:'중심 단어 벡터를 n-gram 벡터 합으로 바꾼 것만 빼면 기존 Skip-gram과 같다.',
  d:'학습 골격은 negative sampling Skip-gram과 동일하다. 바뀌는 건 점수 계산 한 줄뿐 — 중심 단어 벡터 $v_w$ 자리에 $\\sum_{g \\in G_w} z_g$ 를 넣는다. 그래서 word2vec 코드베이스에서 사실상 그대로 갈아끼울 수 있고, 학습 속도도 **1.5배 느려지는 데 그친다**(105k vs 145k words/sec/thread).'},
 {h:'OOV에 벡터를 줄 수 있다',
  lead:'학습 때 못 본 단어도 철자의 n-gram을 합하면 벡터를 얻는다.',
  d:'모델의 실질적 출력은 어휘 목록이 아니라 **n-gram 벡터 테이블**이다. 학습 때 한 번도 못 본 단어라도 철자만 있으면 n-gram으로 쪼개 합하면 벡터가 나온다. 논문은 이 방식(sisg)을 OOV를 널 벡터로 처리하는 방식(sisg-)과 비교해, 항상 같거나 낫다는 것을 보인다. 완전한 신조어라도 형태소가 겹치는 만큼은 의미를 물려받는다.'},
 {h:'n-gram 테이블은 해싱으로 고정 크기에 가둔다',
  lead:'n-gram을 해시 버킷에 담아 어휘 크기와 무관하게 메모리를 고정한다.',
  d:'3~6-gram의 종류는 어휘보다 훨씬 많다. 그래서 FNV-1a 해시로 n-gram을 $1..K$ 에 매핑하고 $K = 2 \\times 10^6$ 개 버킷에 담는다. 충돌이 나면 서로 무관한 n-gram이 벡터를 공유하지만, 실용적으로는 문제가 되지 않는다. 메모리가 **어휘 크기가 아니라 상수로 고정**된다는 점이 배포에서 크다.'},
 {h:'문법은 얻고 의미는 조금 잃는다',
  lead:'문법 유추는 크게 오르지만 의미 유추는 언어에 따라 오히려 떨어진다.',
  d:'효과가 대칭적이지 않다. 체코어 문법 유추는 55.0% → 77.8%, 독일어는 45.0% → 56.4%로 크게 오르지만, **의미 유추는 독일어에서 66.5% → 62.3%로 떨어진다**. 철자가 비슷하다고 의미가 비슷한 건 아니기 때문이다 (`science`/`scientist`는 도움이 되지만 `car`/`card`는 방해가 된다). 논문 자신이 이 트레이드오프를 명시한다.'}
],

diagram:{type:'flow', cap:'단어 하나를 벡터로 바꾸는 경로. 룩업 테이블 대신 n-gram 합산이 들어간다.',
 nodes:[
  {t:'단어', s:'where → <where>'},
  {t:'문자 n-gram 분해', s:'n = 3 … 6 + 단어 자체'},
  {t:'해시 → 버킷', s:'FNV-1a · K = 2×10⁶'},
  {t:'n-gram 벡터 합', s:'v_w = Σ z_g', acc:true},
  {t:'Skip-gram+NEG', s:'점수 = 합벡터ᵀ·문맥벡터'}
 ]},

math:[
 {expr:'s(w, c) = Σ_{g ∈ G_w}  z_gᵀ v_c',
  tex:'s(w,c)=\\sum_{g\\in G_w} z_g^{\\top} v_c',
  d:'논문의 유일한 변경점. 기존 Skip-gram은 $s(w,c)=v_w^T v_c$ 였다. $G_w$ 는 단어 $w$ 의 n-gram 집합, $z_g$ 는 n-gram 벡터, $v_c$ 는 문맥 단어 벡터. 문맥 쪽은 서브워드로 쪼개지 않는다.'},
 {expr:'G_where = { <wh, whe, her, ere, re>, …(4~6gram)…, <where> }',
  tex:'G_{\\text{where}}=\\{\\text{<wh, whe, her, ere, re>},\\ \\dots,\\ \\text{<where>}\\}',
  d:'경계 기호 `<`,`>` 가 접두/접미 정보를 인코딩한다. 단어 자체를 통째로 하나의 항목으로 넣기 때문에, 빈출 단어는 여전히 전용 벡터를 갖는 효과가 있다.'}
],

numbers:[
 {k:'문자 n-gram 길이', v:'3 ~ 6', d:'경계 기호 포함. 길이를 최적화하면 문법과 의미 성능이 반대 방향으로 움직인다'},
 {k:'해시 버킷 수', v:'K = 2 × 10⁶', d:'FNV-1a. 메모리가 어휘 크기와 무관하게 고정된다'},
 {k:'체코어 문법 유추', v:'55.0% → 77.8%', d:'cbow baseline → sisg. 격 변화가 많은 언어에서 가장 큰 이득'},
 {k:'독일어 문법 유추', v:'45.0% → 56.4%', d:'격 4개 + 합성명사. 반면 **의미 유추는 66.5% → 62.3%로 하락**'},
 {k:'영어 문법 유추', v:'70.1% → 74.9%', d:'형태론이 단순한 영어에서는 이득이 작다'},
 {k:'학습 속도', v:'105k vs 145k words/sec/thread', d:'skipgram 대비 약 1.5배 느림. 300차원, negative 5개 기준'}
],

impact:'**"어휘는 닫힌 집합"이라는 전제를 깬 첫 번째 실용적 임베딩**이었다. 배포된 157개 언어 사전학습 벡터는 저자원 언어 NLP의 기본 도구가 되었고, 오타·신조어가 넘치는 실무 텍스트(검색 질의, 상품명, 사용자 로그)에서 word2vec을 대체했다. 더 중요한 것은 방향성이다. 같은 시기 [BPE](#/p/bpe)가 기계번역 쪽에서 독립적으로 서브워드에 도달했고, 두 흐름이 합류하면서 "단어를 원자 단위로 두지 않는다"는 것이 현대 NLP의 기본 설정이 되었다. 다만 갈래는 갈렸다 — fastText는 **표현을 서브워드 합으로 구성**하는 길을, BPE는 **입력 자체를 서브워드 열로 분해**하는 길을 택했고, [Transformer](#/p/transformer) 이후의 모델들은 후자를 채택했다.',

legacy:[
 '**서브워드의 정착** — [BPE](#/p/bpe)·WordPiece·SentencePiece와 함께 "OOV는 서브워드로 푼다"가 표준 답이 됐고, 오늘날 어떤 LLM에도 UNK 토큰이 사실상 없다',
 '**형태론 언어 지원** — 157개 언어 사전학습 벡터 배포로 저자원 언어 NLP의 진입 장벽을 낮췄다',
 '**경량 분류기 계열** — 같은 팀의 fastText 텍스트 분류기(Joulin et al. 2016)가 "선형 모델 + n-gram으로 딥러닝급 정확도를 CPU에서"라는 실무 베이스라인을 만들었다',
 '**정적 임베딩의 마지막 세대** — 이 갈래로 형태론까지 흡수한 뒤, 남은 한계인 다의어·문맥 의존성이 [ELMo](#/p/elmo)와 [BERT](#/p/bert)로 넘어갔다'
],

pitfalls:[
 '**"fastText"라는 이름이 두 논문을 가리킨다.** 이 문서의 단어 벡터 논문(Bojanowski et al., TACL 2017)과 텍스트 분류 논문(Joulin et al., EACL 2017)은 별개다. 라이브러리 이름이 같아서 인용이 자주 뒤섞인다.',
 '**철자 유사 ≠ 의미 유사.** n-gram 공유가 항상 이득은 아니다. 논문 자체가 독일어·이탈리아어 **의미** 유추에서 성능 하락을 보고한다. 어원이 다른데 철자만 겹치는 단어들이 서로 끌어당기기 때문이다.',
 '**한국어·일본어에는 그대로 쓰기 어렵다.** 문자 n-gram은 공백으로 단어가 갈리고 알파벳 조합으로 형태소가 드러나는 언어를 전제한다. 교착어이면서 음절 블록 단위로 표기되는 한국어에서는 n-gram 경계가 형태소 경계와 어긋나기 쉬워, 형태소 분석기나 자모 분해를 앞에 붙이는 전처리가 사실상 필수다.'
],

figures:[
 {f:'fig1-data-size-curve.png',
  cap:'x축은 학습에 쓴 위키피디아 비율(%), y축은 사람 유사도 판단과의 상관(spearman rank). 빨간(sisg, 제안 모델)이 항상 위에 있고, **적은 데이터에서 격차가 가장 크다** — (a) 독일어에서 sisg는 데이터 5%만으로도 cbow의 100% 성능을 넘어선다. 노란(sisg-)은 OOV를 널 벡터로 처리한 대조군으로, sisg보다 항상 아래다.',
  src:'원문 Figure 1, p.7'}
],

quotes:[
 {t:'Popular models that learn such representations ignore the morphology of words, by assigning a distinct vector to each word. This is a limitation, especially for languages with large vocabularies and many rare words.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1607.04606 — Enriching Word Vectors with Subword Information', u:'https://arxiv.org/abs/1607.04606'},
 {t:'fastText 프로젝트 · 157개 언어 사전학습 벡터', u:'https://fasttext.cc/docs/en/crawl-vectors.html'}
]
});
