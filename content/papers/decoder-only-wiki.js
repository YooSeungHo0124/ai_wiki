WIKI.paper({
slug:'decoder-only-wiki',
venue:'ICLR 2018',
authors:'Liu, Saleh, Pot, Goodrich, Sepassi, Kaiser, Shazeer (Google Brain)',
arxiv:'1801.10198',

tldr:'여러 참고 문서를 요약해 위키백과 문서를 생성하는 과제를 풀면서, `[Transformer](#/p/transformer)`에서 **encoder를 통째로 버리고 decoder만으로 언어모델을 만든 첫 사례**. 입력과 출력을 한 시퀀스로 이어붙여 학습시키는 이 레시피가 `[GPT-1](#/p/gpt1)`보다 먼저 나왔다.',

context:'2018년 초의 텍스트 요약 연구는 뉴스 기사 한 편을 짧게 줄이는 단일 문서 요약에 머물러 있었고, 학습 가능한 병렬 데이터(원문-요약 쌍)가 충분치 않다는 것이 병목이었다. 이 논문은 관점을 바꿔, **위키백과 문서 생성 자체를 다중 문서 요약 문제로** 재정의한다 — 입력은 문서 제목과 그 문서가 인용한 출처들 + 검색 결과, 출력은 위키백과 문서의 첫 섹션(lead)이다. 이렇게 하면 위키백과 전체가 곧 대규모 지도학습 데이터셋이 된다. 문제는 입력 길이다. 인용 문서와 검색 결과를 모두 합치면 시퀀스가 수천~1만 토큰을 넘고, `Transformer`의 encoder-decoder 구조는 이런 길이에서 곧바로 메모리 한계에 부딪힌다.',

ideas:[
 {h:'입력과 출력을 하나의 시퀀스로 이어붙인다',
  lead:'참고 문서와 목표 문서를 구분 토큰으로 이어 붙여 표준 언어모델로 학습한다.',
  d:'번역 같은 sequence-to-sequence 과제는 보통 encoder가 입력을, decoder가 출력을 맡는 비대칭 구조를 쓴다. 이 논문은 참고 문서 $m^1,...,m^n$ 과 목표 문서 $y^1,...,y^\\eta$ 를 구분자 $\\delta$ 로 이어 하나의 문장 $(m^1,...,m^n,\\delta,y^1,...,y^\\eta)$ 으로 만들고, 다음 토큰 예측이라는 단일 목적함수로 학습한다. encoder가 사라지므로 같은 하이퍼파라미터 기준 파라미터 수가 거의 절반이 된다.'},
 {h:'Decoder만 남기면 attention이 입력·출력을 함께 본다',
  lead:'출력 토큰 생성 시 self-attention이 입력 구간과 이미 만든 출력 구간을 동시에 참조한다.',
  d:'encoder-decoder 구조에서는 encoder self-attention, decoder self-attention, cross-attention 세 종류가 따로 있었다. decoder 하나로 합치면 이 세 종류가 **하나의 causal self-attention**으로 통합된다. 다음 토큰을 생성할 때 입력 $m$ 구간과 지금까지 생성한 $y$ 구간을 구분 없이 같은 attention이 참조하고, 학습 중에는 입력 부분의 다음 토큰 예측 손실도 함께 역전파되어 언어 자체를 다시 배우는 비용을 줄인다.'},
 {h:'Memory-Compressed Attention으로 시퀀스 길이를 늘린다',
  lead:'Key·Value를 strided convolution으로 압축해 attention 메모리를 줄이고 더 긴 입력을 처리한다.',
  d:'긴 시퀀스에서 self-attention의 $O(n^2)$ 메모리가 한계였다. 이 논문은 두 방법을 섞는다 — **local attention**은 시퀀스를 256토큰 블록으로 쪼개 블록 안에서만 attention을 계산해 메모리를 시퀀스 길이에 선형으로 만들고, **memory-compressed attention**은 Key·Value를 커널 크기 3·stride 3의 합성곱으로 압축해 개수를 줄이되 전역 정보 교환은 유지한다. 두 층을 LMLML 순서로 번갈아 쌓은 것이 최종 T-DMCA 구조다.'},
 {h:'MoE 층으로 용량을 늘린다',
  lead:'Mixture-of-Experts 층 하나를 추가해 파라미터를 늘리되 계산량은 억제한다.',
  d:'긴 입력을 처리할 여유가 생기자, 다음 병목은 모델 용량이었다. `[MoE](#/p/moe-shazeer)` 층 하나를 끼워 넣어 실질 파라미터 수를 늘리면서도 토큰당 활성화되는 전문가 수는 제한해 계산 비용을 억제했다. 실험적으로 전문가 수를 늘릴수록 perplexity가 더 떨어졌다.'},
 {h:'추출(extractive) 단계로 입력을 먼저 걸러낸다',
  lead:'tf-idf로 문서 관련 문단을 먼저 골라낸 뒤에만 생성 모델에 넣는다.',
  d:'수백 개 참고 문서를 통째로 넣을 수는 없으므로, 생성 전에 tf-idf 점수로 목표 문서와 관련된 문단만 추출하는 1단계(extractive)를 둔다. 이 추출 단계의 품질이 최종 생성 품질을 크게 좌우한다는 것을 논문이 직접 확인했다 — 무작위 입력(identity)과 tf-idf 추출 사이의 격차가, tf-idf와 이상적인 추출(cheating) 사이의 격차보다 컸다.'}
],

diagram:{type:'compare', cap:'번역용 encoder-decoder 구조를 그대로 긴 문서 요약에 쓸 수 없어, decoder 하나로 입력·출력을 합친다.',
 left:{t:'Transformer E-D', items:['encoder가 입력을, decoder가 출력을 처리','cross-attention으로 연결','긴 입력에서 메모리 한계']},
 right:{t:'T-DMCA', items:['입력+출력을 한 시퀀스로 결합','self-attention 하나로 통합','압축 attention으로 L=11000까지 처리']}},

math:[
 {expr:'p(w¹,...,w^(n+η)) = Π p(wʲ | w¹,...,w^(j-1))',
  tex:'p(w^1,\\dots,w^{n+\\eta})=\\prod_{j=1}^{n+\\eta} p\\!\\left(w^j \\mid w^1,\\dots,w^{j-1}\\right)',
  d:'입력 $m$ 과 목표 $y$ 를 이어 붙인 시퀀스 $w=(m,\\delta,y)$ 전체에 대한 표준 언어모델 목적함수. encoder/decoder 구분이 사라지고 하나의 자기회귀 확률만 남는다.'},
 {expr:'Attention(Q, K, V) = softmax(QKᵀ/√d_k) V,  K,V ← Conv(K,V)',
  tex:'\\text{Attention}(Q,K,V)=\\text{softmax}\\!\\left(\\frac{QK^{\\top}}{\\sqrt{d_k}}\\right)V',
  d:'`Transformer`의 attention 식은 그대로 쓰되, memory-compressed attention에서는 $K,V$ 를 strided convolution으로 미리 압축해 넣는다. Query 개수는 그대로라 출력 길이는 변하지 않는다.'}
],

numbers:[
 {k:'최고 성능(perplexity/ROUGE-L)', v:'1.90 / 38.8', d:'T-DMCA + MoE-256, L=7500 — combined corpus 기준 최고'},
 {k:'MoE 유무 비교', v:'2.05 → 1.93', d:'같은 L=11000에서 MoE-128 층 하나 추가만으로 log-perplexity 개선'},
 {k:'처리 가능 입력 길이', v:'T-D 4000 → T-DMCA 11000', d:'16GB GPU(P100) 메모리 한도 내에서 압축 attention이 약 **3배** 더 긴 입력 처리'},
 {k:'seq2seq 대비 개선', v:'ROUGE-L 12.7 → 38.8', d:'RNN attention 베이스라인 대비 최고 T-DMCA 모델'},
 {k:'WikiSum 데이터 규모', v:'문서 약 100만 편', d:'입력 10²~10⁶ 단어, 출력 10¹~10³ 단어 — 기존 요약 데이터셋보다 몇 자릿수 큼'}
],

impact:'`Transformer`가 처음부터 encoder+decoder 세트로 제안됐던 것과 달리, 이 논문은 **decoder만으로도 시퀀스를 처리할 수 있고 오히려 긴 입력에서 더 유리하다**는 것을 실증했다. 입력·출력을 한 시퀀스로 잇는 레시피와 memory-compressed/local attention으로 $O(n^2)$ 문제를 우회하는 아이디어는 이후 순수 decoder 기반 언어모델 계열의 초기 사례가 되었다. 다만 이 논문 자체는 요약 과제에 특화된 것이었고, 범용 사전학습·미세조정으로 일반화하는 것은 같은 해 뒤에 나온 `[GPT-1](#/p/gpt1)`의 몫이었다.',

legacy:[
 '**decoder-only 계보의 원형** — `GPT-1`, `GPT-2`, 이후 대부분의 대형 언어모델이 encoder 없이 decoder만 쌓는 이 구조를 표준으로 삼음',
 '**긴 문맥 attention 압축의 초기 시도** — local·memory-compressed attention은 이후 `[희소 attention](#/p/sparse-attn)`, `[FlashAttention](#/p/flashattention)` 계열이 다시 다루게 되는 문제를 먼저 제기함',
 '**MoE를 Transformer 계열에 처음 접목** — `[MoE](#/p/moe-shazeer)` 층을 attention 스택에 끼워 넣는 조합이 이후 대형 모델의 표준 확장 축 중 하나가 됨',
 '**"입력+출력을 한 시퀀스로"라는 프레이밍** — 이후 `[T5](#/p/t5)`류의 text-to-text 통일 관점, 그리고 in-context learning의 프롬프트+생성 결합 방식과 정신적으로 이어짐'
],

pitfalls:[
 '**"decoder만 쓴다"가 곧 "GPT와 같다"는 뜻은 아니다.** 이 논문의 decoder는 여전히 지도학습(참고 문서 → 목표 문서)을 위한 것이었고, `GPT-1`처럼 비지도 사전학습 후 다양한 과제에 미세조정하는 범용 언어모델 개념은 아직 없었다.',
 '**ROUGE·perplexity 개선이 곧 사실적 정확성을 뜻하지 않는다.** 논문 스스로 사람 평가에서 유창성·일관성은 크게 개선됐지만 문구 반복(non-redundancy 저하) 문제가 남아 있다고 보고한다.',
 '**추출 단계(tf-idf)의 품질이 병목이다.** 생성 모델을 아무리 개선해도 관련 없는 문단이 입력되면 최종 품질이 크게 떨어지므로, 이 논문의 파이프라인은 추출과 생성 두 단계 모두를 함께 봐야 한다.'
],

figures:[
 {f:'fig1-attention-variants.png',
  cap:'세 가지 attention 변형 비교. 왼쪽(Decoder Self-Attention)이 원본 Transformer decoder의 표준 attention. 가운데(Memory-compressed Attention)는 K·V를 Conv로 압축한 뒤 attention을 계산해 메모리를 줄인다. 오른쪽(Local Attention)은 시퀀스를 여러 조각으로 Split해 각각 독립적으로 attention을 계산한 뒤 Merge한다.',
  src:'원문 Figure 1, p.6'}
],

quotes:[
 {t:'We introduce a new, decoder-only sequence transduction model for the abstractive stage, capable of handling very long sequences much better than the standard Transformer.',
  src:'Conclusion, p.9'}
],

links:[
 {t:'arXiv 1801.10198 — Generating Wikipedia by Summarizing Long Sequences', u:'https://arxiv.org/abs/1801.10198'},
 {t:'tensor2tensor (구현 라이브러리)', u:'https://github.com/tensorflow/tensor2tensor'}
]
});
