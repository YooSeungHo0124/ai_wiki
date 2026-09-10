WIKI.paper({
slug:'retro',
venue:'ICML 2022',
authors:'Borgeaud, Mensch, Hoffmann et al. (DeepMind)',
arxiv:'2112.04426',

tldr:'2조 토큰짜리 외부 데이터베이스에서 이웃 문서를 검색해 **chunked cross-attention**으로 붙여주면, 25배 작은 모델이 [GPT-3](#/p/gpt3)·[Gopher](#/p/gopher) 급 언어모델링 성능을 낸다는 것을 보인 논문. **사전학습 단계 자체를 검색에 조건화**한 것이 핵심이다.',

context:'2021년 언어모델 성능 개선은 사실상 파라미터 수를 늘리는 것과 같은 말이었다. 하지만 파라미터가 늘어나는 이유는 두 가지가 뒤섞여 있다 — 더 많은 연산을 할 수 있어서, 그리고 학습 데이터를 더 많이 **암기**할 수 있어서. 이 둘을 분리할 수 있다면 암기는 외부 저장소에 맡기고 모델은 연산에만 집중시킬 수 있다. [REALM](#/p/realm)과 [RAG](#/p/rag)이 이미 검색-증강 생성을 시도했지만, 두 방법 모두 **사전학습이 끝난 뒤 검색을 덧붙이거나**, 검색기를 모델과 함께 학습시키는 방식이었고 데이터베이스 규모도 수십억 토큰 수준에 머물렀다. RETRO의 질문은 — 데이터베이스를 조 단위로 키우고, 처음부터 검색에 조건화해서 모델을 사전학습하면 어디까지 갈 수 있는가?',

ideas:[
 {h:'청크 단위 검색: 토큰이 아니라 64토큰 덩어리로 찾는다',
  lead:'입력을 64토큰 청크로 쪼개고 각 청크마다 얼려둔 BERT 임베딩으로 최근접 이웃을 찾는다.',
  d:'시퀀스(길이 2048)를 $l$개의 청크로 나누고, 청크 $C_u$마다 그 직전 내용의 BERT 임베딩과 $L_2$ 거리가 가까운 이웃 청크들을 데이터베이스에서 가져온다. 검색기(BERT)는 **학습되지 않고 고정**되어 있다 — [REALM](#/p/realm)처럼 검색기를 end-to-end로 학습시키지 않는 대신, SCaNN으로 2조 토큰 데이터베이스를 10ms 안에 질의할 수 있게 미리 인덱싱해 둔다.'},
 {h:'Chunked cross-attention(CCA): 검색 결과를 국소적으로만 섞는다',
  lead:'각 청크는 오직 자신의 이웃만 cross-attention으로 참조해 검색 비용을 청크 길이에 대해 선형으로 유지한다.',
  d:'검색된 이웃 텍스트는 별도의 인코더 Transformer를 통과해 인코딩된 뒤, 디코더의 CCA 레이어에서 **그 이웃을 가져온 청크(및 다음 청크의 시작)에만** cross-attention으로 연결된다. 이전 청크의 이웃 정보는 self-attention을 타고 이후 토큰까지 전파되므로, 매 토큰마다 전체 데이터베이스에 $O(n^2)$로 attention하지 않고도 인과성을 유지한 채 정보가 흐른다.'},
 {h:'사전학습 자체를 검색에 조건화한다',
  lead:'RAG·REALM과 달리 검색 조건화를 파인튜닝이 아니라 사전학습 단계부터 넣는다.',
  d:'`[RAG](#/p/rag)`와 `[REALM](#/p/realm)`은 사전학습된 언어모델(또는 QA 모델)에 검색을 얹거나 파인튜닝 단계에서 결합했고, 데이터베이스도 수십억 토큰 규모였다. RETRO는 150M~7B 파라미터 모델을 **처음부터 2조 토큰 검색과 함께 처음부터 학습**시킨다. 이 덕분에 모델은 "검색된 이웃이 항상 곁에 있다"는 것을 전제로 파라미터 안에 무엇을 저장할지 배분하는 법 자체를 학습한다.'},
 {h:'RETRO-fitting: 기존 모델에 검색만 나중에 붙이기',
  lead:'사전학습된 Transformer를 얼리고 CCA와 인코더만 새로 학습시켜도 처음부터 학습한 것에 근접한다.',
  d:'전체 가중치를 처음부터 다시 학습하지 않고, 이미 학습된 baseline Transformer의 가중치는 고정한 채 새로 추가된 chunked cross-attention과 이웃 인코더만(7B 모델 기준 전체 가중치의 10% 미만) 학습시킨다. 사전학습 시퀀스의 3%(600만 시퀀스)만으로 baseline을 빠르게 능가하고, RETRO를 처음부터 학습한 것과 비슷한 수준에 도달한다.'},
 {h:'오염 검사: 검색이 답을 "베끼는" 것과 실제로 아는 것을 구분한다',
  lead:'평가-학습 데이터 간 n-gram 중복도를 직접 통제해 성능 향상이 단순 복붙이 아님을 보인다.',
  d:'검색 모델은 학습 데이터를 평가 시점에도 그대로 열람할 수 있으므로, 성능 향상이 "일반화"가 아니라 "정답이 포함된 문서를 그대로 베낀 것"일 위험이 RAG류 모델 전반에 있다. 저자들은 13-gram Jaccard 유사도로 학습-평가 문서 간 중복을 제거하고, 평가 청크와 가장 가까운 학습 청크 사이에 **8토큰 이하로만 겹치는** 경우로 한정해도 RETRO가 여전히 baseline을 이긴다는 것을 별도로 검증했다.'}
],

diagram:{type:'flow', cap:'RETRO의 한 청크 처리 경로. 검색은 학습되지 않고, CCA만 청크 국소적으로 검색 결과를 섞는다.',
 nodes:[
  {t:'입력 청크', s:'64토큰'},
  {t:'BERT 임베딩', s:'고정(frozen)'},
  {t:'SCaNN 검색', s:'2조 토큰 DB · k개 이웃'},
  {t:'이웃 인코더', s:'비인과적 Transformer'},
  {t:'CCA', s:'chunked cross-attn', acc:true, note:'이 청크만 참조'},
  {t:'다음 토큰 예측'}
 ]},

math:[
 {expr:'RETRO(H, E) = FFW(CCA(ATTN(H), E)),   LM(H) = FFW(ATTN(H))',
  tex:'\\text{RETRO}(H,E) \\triangleq \\text{FFW}\\big(\\text{CCA}(\\text{ATTN}(H), E)\\big),\\quad \\text{LM}(H) \\triangleq \\text{FFW}(\\text{ATTN}(H))',
  d:'RETRO 블록은 표준 Transformer 블록(LM)에 chunked cross-attention 레이어 CCA 하나를 끼워 넣은 것이다. 어느 레이어에서 RETRO 블록을 쓸지는 하이퍼파라미터 $P$로 정한다.'},
 {expr:'d(C, N) = ||BERT(C) - BERT(N)||^2',
  tex:'d(C,N) = \\lVert \\text{BERT}(C) - \\text{BERT}(N) \\rVert_2^2',
  d:'청크 $C$의 이웃을 고를 때 쓰는 거리 함수. 청크와 후보 이웃을 각각 고정된 BERT로 임베딩(시간 축 평균)한 뒤 $L_2$ 거리가 가장 가까운 것부터 $k$개를 가져온다.'}
],

numbers:[
 {k:'검색 데이터베이스', v:'최대 2T 토큰', d:'MultiligualMassiveText 기반, 평가 시 1.75T 토큰 사용'},
 {k:'모델 크기 대비 이득', v:'7.5B RETRO ≈ GPT-3·Jurassic-1급', d:'파라미터 수는 **약 1/25**(178B 대비)'},
 {k:'검색 없는 것 대비 이득', v:'파라미터 ~10배 확장과 동등', d:'Fig. 1: 검색 이득이 모델 크기 전 구간에서 일정하게 유지됨'},
 {k:'Wikitext103 perplexity', v:'MassiveText 100% 검색 시 3.92(test)', d:'검색 없는 baseline은 22.96 — 순위가 뒤집힐 정도로 큰 차이'},
 {k:'검색 질의 지연', v:'2조 토큰 DB에서 약 10ms', d:'SCaNN 근사 최근접 이웃, $O(\\log T)$'},
 {k:'RETRO-fitting 비용', v:'사전학습 시퀀스의 3%(600만개)', d:'가중치 10% 미만만 새로 학습해도 처음부터 학습한 것에 근접'}
],

impact:'RETRO는 "모델을 키워서 더 외우게 하는 대신, 외우는 일 자체를 외부 데이터베이스에 떼어 준다"는 시맨틱-파라메트릭 절충을 사전학습 규모에서 실증했다. [RAG](#/p/rag)·[REALM](#/p/realm)이 수십억 토큰·파인튜닝 단계의 검색-증강이었다면, RETRO는 **조 단위 데이터베이스 + 사전학습부터 검색 조건화**로 규모를 두 자릿수 이상 끌어올렸고, chunked cross-attention이라는 청크 국소적 결합 방식으로 계산 비용을 시퀀스 길이에 선형으로 묶어 두었다. 다만 저자들 스스로 지적하듯, 이 이득의 일부는 평가-학습 데이터 중복(누수)에서 온다 — 그래서 이 논문은 검색-증강 모델을 평가할 때 누수를 얼마나 통제했는지가 결과 해석에 필수적이라는 방법론적 기준도 함께 남겼다.',

legacy:[
 '**시맨틱 파라메트릭 절충의 실증** — "암기는 데이터베이스에, 연산은 파라미터에"라는 구도가 이후 검색-증강 LLM 설계의 기본 논거로 자리잡았다',
 '**청크 국소 cross-attention** — 전체 시퀀스에 매번 attention하지 않고 청크 단위로만 검색 결과를 섞는 설계가 이후 검색-증강 아키텍처의 계산량 절충안으로 재사용된다',
 '**평가 누수 정량화 방법론** — n-gram 중복도 기준으로 "베끼는 이득"과 "일반화 이득"을 분리해 보고하는 방식이 이후 검색-증강 모델 평가의 관행이 됐다',
 '**RETRO-fitting** — 처음부터 다시 학습하지 않고 기존 사전학습 모델에 검색 모듈만 붙이는 저비용 경로를 제시해, 이후 기존 LLM에 검색을 사후 결합하는 연구들의 선례가 됐다'
],

pitfalls:[
 '**"25배 작은 모델이 GPT-3를 이겼다"는 무조건적 우위가 아니다.** 비교는 The Pile 언어모델링 손실(bits-per-byte) 기준이며, 검색 데이터베이스 자체가 조 단위 텍스트에 대한 접근권이라는 추가 자원을 쓴 것이다. 순수 파라미터 대 파라미터 비교가 아니다.',
 '**검색기(BERT)는 이 논문에서 학습되지 않는다.** [REALM](#/p/realm)처럼 검색기를 end-to-end로 미세조정하는 구조와 헷갈리기 쉬운데, RETRO는 고정된 임베딩으로 최근접 이웃만 찾고 CCA·인코더만 학습한다.',
 '**성능 향상 중 일부는 데이터 누수다.** dm_mathematics·ubuntu_irc처럼 검색이 오히려 도움이 안 되거나 baseline보다 못한 서브셋도 있어, "검색은 항상 이득"이라고 일반화할 수 없다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'왼쪽: 시퀀스가 3개 청크로 나뉘고 각 청크가 얼려둔 BERT+Transformer 인코더로 이웃을 인코딩해 CCA에 공급한다(위쪽 검색 경로, 아래쪽 RETRO 블록). 오른쪽: CCA 내부 — H₁⁺(청크1의 마지막 토큰+청크2 시작)가 청크1의 인코딩된 이웃 E₁만 cross-attention으로 참조한다. 이 국소성 때문에 계산량이 시퀀스 길이에 선형으로 유지된다.',
  src:'원문 Figure 2, p.3'},
 {f:'fig2-pile-comparison.png',
  cap:'The Pile의 서브셋별로 baseline 7B 대비 상대 개선율(%). 주황(RETRO 7.5B)이 대부분의 서브셋에서 파란(Jurassic-1 178B)·초록(Gopher 280B)보다도 높다. dm_mathematics·ubuntu_irc(맨 왼쪽 두 막대)에서만 RETRO가 오히려 열세인 것에 주목.',
  src:'원문 Figure 4, p.12'}
],

quotes:[
 {t:'With a 2 trillion token database, our Retrieval-Enhanced Transformer (Retro) obtains comparable performance to GPT-3 and Jurassic-1 on the Pile, despite using 25× fewer parameters.',
  src:'Abstract, p.1'},
 {t:'To our knowledge, our work is the first to show the benefits of scaling the retrieval database to trillions of tokens for large parametric language models.',
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 2112.04426 — Improving Language Models by Retrieving from Trillions of Tokens', u:'https://arxiv.org/abs/2112.04426'}
]
});
