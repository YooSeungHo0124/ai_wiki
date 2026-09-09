WIKI.paper({
slug:'bart',
venue:'ACL 2020',
authors:'Lewis, Liu, Goyal et al. (Facebook AI)',
arxiv:'1910.13461',

tldr:'인코더는 [BERT](#/p/bert)처럼 양방향, 디코더는 [GPT](#/p/gpt1)처럼 자기회귀인 **encoder-decoder 구조를 denoising autoencoder로 사전학습**한 논문. 입력에 임의의 노이즈를 가하고 원문을 복원하게 학습시켜, 이해(GLUE·SQuAD)와 생성(요약·번역·대화) 양쪽에서 동시에 강한 성능을 냈다.',

context:'2019년 사전학습은 두 갈래로 갈라져 있었다. [BERT](#/p/bert) 계열은 마스크된 토큰을 채우는 방식이라 이해 과제(분류·QA)에 강했지만, 양방향 문맥을 쓰기 때문에 텍스트를 왼쪽에서 오른쪽으로 순서대로 생성하는 과제에는 그대로 쓰기 어려웠다. [GPT](#/p/gpt1) 계열은 반대로 자기회귀 생성에는 자연스러웠지만 왼쪽 문맥만 보므로 양방향 이해가 필요한 과제에서는 손해를 봤다. 이해와 생성을 하나의 모델로 동시에 잘하는 사전학습 방식이 아직 없었다.',

ideas:[
 {h:'BERT 인코더 + GPT 디코더 = seq2seq denoising',
  lead:'양방향 인코더와 자기회귀 디코더를 이어 붙여 노이즈 낀 입력에서 원문을 복원한다.',
  d:'구조는 [Transformer](#/p/transformer)의 표준 encoder-decoder 그대로다. 인코더는 노이즈가 낀 문서 전체를 양방향으로 읽고, 디코더는 그 표현을 참고해 원문을 왼쪽부터 자기회귀로 복원한다. 인코더가 BERT처럼 문맥을 보고, 디코더가 GPT처럼 순차 생성을 하므로 두 계열의 장점을 한 모델에 담는다.'},
 {h:'노이즈 함수를 자유롭게 고를 수 있다',
  lead:'토큰 마스킹뿐 아니라 삭제·순열·회전까지 어떤 노이즈든 적용해 원문만 맞히면 된다.',
  d:'BERT는 마스크된 자리만 예측하므로 노이즈 종류가 사실상 "치환" 하나로 고정된다. BART는 디코더가 원문 전체의 우도를 계산하므로, 인코더 입력에 **어떤 변형이든** 가할 수 있다. 극단적으로 입력 정보를 전부 지우면 BART는 그냥 언어모델이 된다.'},
 {h:'Text Infilling: 길이까지 감추는 마스킹',
  lead:'포아송 분포로 뽑은 길이의 스팬을 통째로 [MASK] 하나로 치환해 길이 추론까지 학습시킨다.',
  d:'스팬 길이를 $\\lambda=3$ 인 포아송 분포에서 뽑고, 그 구간 전체(0길이 포함)를 마스크 토큰 **하나**로 바꾼다. 몇 개의 토큰이 사라졌는지 개수를 알려주지 않으므로, 모델은 "몇 단어가 빠졌는지"까지 추론해야 한다. [SpanBERT](#/p/bpe)류의 스팬 마스킹과 비슷하지만 길이 분포와 마스크 개수 처리가 다르다.'},
 {h:'문장 순열과 문서 회전으로 전역 구조도 학습',
  lead:'문장을 통째로 섞거나 문서를 임의 지점에서 회전시켜 국소 패턴을 넘어선 재구성을 강제한다.',
  d:'토큰 단위 노이즈만으로는 지역적인 빈칸 채우기만 배운다. 문장을 마침표 기준으로 나눠 무작위로 재배열하거나(Sentence Permutation), 임의 토큰을 문서의 시작으로 삼아 나머지를 뒤로 돌리는(Document Rotation) 노이즈를 섞으면, 모델이 문서 전체 순서와 시작점을 재구성하는 능력까지 학습한다.'},
 {h:'파인튜닝은 노이즈 없이, 인코더·디코더 모두에 원문 입력',
  lead:'다운스트림 과제에서는 노이즈를 빼고 같은 입력을 인코더·디코더 양쪽에 넣는다.',
  d:'분류 과제는 인코더·디코더에 동일한(노이즈 없는) 문장을 넣고 디코더 마지막 토큰의 은닉 상태를 분류기에 쓴다. 생성 과제는 표준 seq2seq처럼 입력을 인코더에, 목표 출력을 디코더에서 자기회귀로 생성하게 한다. 기계번역에서는 BART 전체를 사전학습된 디코더로 얼리고 새 인코더만 처음부터 학습시켜, 대상 언어의 언어모델 지식을 번역에 재사용한다.'}
],

diagram:{type:'compare', cap:'세 모델이 입력을 처리하는 방향의 차이. BART는 인코더의 양방향성과 디코더의 자기회귀성을 그대로 이어 붙인다.',
 left:{t:'BERT · 인코더만', items:['마스크 자리만 독립 예측','생성에 그대로 쓰기 어려움','양방향 문맥은 강함']},
 right:{t:'BART · enc-dec', items:['임의 노이즈 → 원문 전체 복원','이해·생성 과제 모두 파인튜닝','디코더는 GPT처럼 자기회귀']}
},

math:[
 {expr:'L = -log P(x | corrupt(x))  (디코더의 negative log-likelihood)',
  tex:'\\mathcal{L}=-\\log P_{\\theta}\\big(x \\mid \\tilde{x}\\big),\\quad \\tilde{x}=\\text{corrupt}(x)',
  d:'손실은 노이즈 낀 입력 $\\tilde{x}$ 를 인코더에 넣고, 디코더가 원문 $x$ 를 토큰 단위 자기회귀로 복원하는 표준 cross-entropy다. 노이즈 함수 $\\text{corrupt}$ 가 무엇이든 이 식은 그대로 적용된다.'},
 {expr:'span length ~ Poisson(λ=3), 스팬을 [MASK] 토큰 1개로 치환 (Text Infilling)',
  tex:'\\ell \\sim \\text{Poisson}(\\lambda=3),\\quad \\text{span}(\\ell)\\rightarrow \\texttt{[MASK]}',
  d:'각 스팬 길이 $\\ell$ 을 포아송 분포에서 독립적으로 뽑고, 길이에 상관없이 마스크 토큰 하나로 치환한다. $\\ell=0$ 이면 원래 위치에 마스크 토큰을 삽입하는 것과 같다.'}
],

numbers:[
 {k:'SQuAD 2.0 (EM/F1)', v:'86.1 / 89.2', d:'RoBERTa(86.5/89.4)와 거의 동률, 판별 과제에서도 손해가 없음을 보임'},
 {k:'CNN/DailyMail ROUGE-L', v:'40.90', d:'UniLM(40.51)·BERTSUM(38.76~39.18) 대비 우위'},
 {k:'XSum ROUGE-1', v:'45.14', d:'이전 최고 대비 **+6점대**, 더 추상적인 데이터셋에서 격차가 큼'},
 {k:'WMT16 RO→EN BLEU', v:'37.96', d:'단일 언어 영어 사전학습만으로 back-translation 기준선 대비 **+1.1 BLEU**'},
 {k:'파라미터', v:'BERT 대비 약 +10%', d:'디코더의 cross-attention과 인코더-디코더 분리 구조 때문'},
 {k:'대형 모델 구성', v:'12층 인코더 + 12층 디코더, hidden 1024', d:'배치 8000, 500K 스텝, RoBERTa와 동일 학습 규모'}
],

impact:'BART는 사전학습을 "노이즈를 없애는 seq2seq" 문제로 일반화해, BERT의 마스킹과 GPT의 언어모델링이 이 틀의 특수한 경우임을 보였다. 요약·대화·추상적 QA 같은 생성 과제에서 BERT 계열보다 뚜렷이 앞서면서도 GLUE·SQuAD 판별 과제에서는 RoBERTa와 대등해, "이해 전용 vs 생성 전용" 이분법을 흐렸다. 이 encoder-decoder + denoising 조합은 이후 [T5](#/p/t5)와 함께 사전학습 seq2seq의 표준 레시피로 자리 잡았다.',

legacy:[
 '**다국어 확장** — mBART가 같은 목적함수를 다국어 코퍼스에 적용해 사전학습된 번역 백본을 만듦',
 '**요약 모델의 사실상 표준 초기값** — PEGASUS 이후로도 BART 계열 체크포인트가 추상적 요약 파인튜닝의 기본 출발점으로 널리 쓰임',
 '**[T5](#/p/t5)와의 수렴** — 같은 시기 등장한 T5의 span-corruption과 목표가 사실상 같은 방향으로, "encoder-decoder denoising"이 하나의 학파로 정착',
 '**노이즈 설계라는 새 축** — 이후 사전학습 연구에서 "어떤 목적함수"뿐 아니라 "어떤 노이즈를 섞는가"가 별도의 튜닝 대상이 됨'
],

pitfalls:[
 '**"디코더가 있으니 항상 생성이 낫다"는 아님.** SQuAD 같은 추출형 과제에서는 논문 스스로 "양방향 인코더가 결정적"이라 명시했고, 순수 좌→우 디코더만으로는 성능이 떨어진다.',
 '**노이즈 조합이 과제마다 다르게 최적이다.** 논문 4장의 ablation에서 Text Infilling + Sentence Permutation 조합이 가장 좋았지만, 이는 특정 과제 묶음에서의 결과이며 모든 노이즈가 모든 과제에 똑같이 유리하지 않다.',
 '**BERT 대비 파라미터가 늘어난 것은 구조 때문이지 "더 좋은 목적함수라서"가 아니다.** 인코더-디코더 분리와 cross-attention이 약 10%의 파라미터를 추가로 요구한다.'
],

figures:[
 {f:'fig1-comparison.png',
  cap:'(a) BERT는 마스크된 자리(B, D)만 독립적으로 예측 — 양방향이지만 생성에 부적합. (b) GPT는 왼쪽 문맥만 보고 순차 생성 — 생성엔 맞지만 양방향 문맥을 못 씀. (c) BART는 노이즈 낀 입력(A_B_E)을 양방향 인코더가 읽고, 자기회귀 디코더가 원문(ABCDE)을 복원 — 인코더 입력과 디코더 출력의 길이·정렬이 달라도 된다는 점이 핵심.',
  src:'원문 Figure 1, p.2'},
 {f:'fig2-noising.png',
  cap:'다섯 가지 노이즈 방식. Token Masking·Deletion은 BERT류 국소 변형, Text Infilling은 스팬 하나를 마스크 하나로 눌러 길이 정보를 지움, Sentence Permutation·Document Rotation은 문서 전역 순서를 흩뜨림 — 이들을 조합해 쓸 수 있다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'BART is trained by (1) corrupting text with an arbitrary noising function, and (2) learning a model to reconstruct the original text.',
  src:'Abstract, p.1'},
 {t:'Bidirectional encoders are crucial for SQuAD; just left-to-right decoder performs poorly on SQuAD, because future context is crucial in classification decisions.',
  src:'Section 5.2, p.5'}
],

links:[
 {t:'arXiv 1910.13461 — BART', u:'https://arxiv.org/abs/1910.13461'},
 {t:'Facebook AI 공식 블로그 — BART', u:'https://ai.meta.com/blog/bart-denoising-sequence-to-sequence-pre-training-for-natural-language-generation-translation-and-comprehension/'}
]
});
