WIKI.paper({
slug:'seq-kd',
venue:'EMNLP 2016',
authors:'Kim & Rush (Harvard NLP)',
arxiv:'1606.07947',

tldr:'교사 모델이 낸 **소프트 확률 분포를 단어마다 맞추는** 기존 증류 대신, 교사가 빔서치로 만든 **출력 문장 자체**를 학생의 학습 데이터로 쓰자는 제안. 이 sequence-level KD가 오늘날 "교사 출력으로 SFT한다"는 LLM 증류 방식의 원형이다.',

context:'2016년 신경망 기계번역(NMT)은 번역 품질을 얻으려면 모델이 커야 했고, 이를 압축하려는 지식 증류는 이미 있었지만 전부 분류 문제에서 나온 방법이었다 — 각 클래스에 대한 교사의 소프트맥스 분포를 학생이 [교차엔트로피](#/p/distillation)로 맞추는 식이다. NMT도 매 위치에서 다음 단어를 고르는 다중클래스 분류처럼 보이므로 그대로 적용할 수 있었다. 그런데 NMT가 실제로 풀어야 하는 것은 단어 하나가 아니라 **길이 J의 완전한 문장**이고, 문장 하나의 확률은 $|V|^J$개 후보에 걸친 분포다. 이 논문의 질문은 단어 단위로 분포를 맞추는 것이, 정말 문장 단위의 교사 행동을 옮기는 올바른 방법이냐는 것이다.',

ideas:[
 {h:'Word-KD: 매 위치의 소프트 분포를 맞춘다',
  lead:'각 타임스텝에서 교사의 어휘 분포를 학생이 교차엔트로피로 모방한다.',
  d:'표준 지식 증류를 NMT에 그대로 옮긴 버전이다. 위치 $j$마다 교사 분포 $q(t_j|s,t_{<j})$와 학생 분포 $p(t_j|s,t_{<j})$ 사이의 교차엔트로피 `L_WORD-KD`를 최소화한다. 정답 원-핫 라벨보다 더 많은 정보(예: "beautiful [MASK]" 다음 단어 후보들의 상대적 확률)를 주지만, 여전히 **한 스텝씩 독립적으로** 맞출 뿐 문장 전체의 결합 분포는 건드리지 않는다.'},
 {h:'Seq-KD: 교사가 생성한 문장으로 학생을 학습시킨다',
  lead:'교사 분포를 그 최빈값(모드) 하나로 근사해, 교사가 빔서치로 만든 문장을 정답처럼 학습한다.',
  d:'문장 전체에 대한 교사 분포 $q(t|s)$를 직접 다루는 건 $|V|^J$ 크기라 불가능하다. 이 논문은 이를 **단일 최빈값**으로 근사한다 — 교사에 빔서치(K=5)를 돌려 가장 점수가 높은 문장 $\\hat y$ 하나를 뽑고, 학생은 $(s, \\hat y)$ 쌍으로 그냥 보통의 단어 단위 negative log-likelihood를 학습한다. 즉 **정답 라벨을 사람이 쓴 원문 대신 교사가 생성한 문장으로 통째로 교체**하는 것이다. 실험적으로 빔 크기 1일 때 교사의 그리디 출력이 전체 확률질량의 1.3~2.3%밖에 차지하지 않는데도, 이 근사가 word-level KD보다 더 나은 결과를 낸다.'},
 {h:'Seq-Interpolation: 학생이 낼 법한 문장으로 정답을 보정한다',
  lead:'교사 출력 중 정답과 가장 유사한(BLEU 최대) 문장을 골라 학습 타깃으로 쓴다.',
  d:'Seq-KD는 사람이 쓴 원문(y)을 아예 버리는데, 실제로 $y$와 $\\hat y$(교사 최빈값)는 상당히 다를 때가 많다. 대신 local updating에서 영감을 얻어, 교사의 K-best 빔(K=35) 중 **정답과 BLEU가 가장 높은 문장** $\\tilde y$를 골라 그것으로 학습한다. 이는 "관측된 정답이 어떤 잠재적 진짜 시퀀스에 노이즈가 섞여 나온 것"이라는 생성 모델 관점에서, 데이터 분포와 교사 분포의 혼합 분포에 대한 근사로 정당화된다.'},
 {h:'Word-KD는 지역적, Seq-KD는 전역적 — 상호보완적',
  lead:'두 손실은 서로 다른 축의 지식을 옮기므로 더하면 추가 이득이 난다.',
  d:'Word-KD는 각 스텝에서 "그 자리에 어떤 단어들이 그럴듯한가"라는 지역적 지식을, Seq-KD는 "전체 문장으로 어떤 시퀀스가 그럴듯한가"라는 전역적 지식을 옮긴다. 실험에서 Seq-KD + Word-KD를 같이 쓰면 2×300, 2×100 학생에서 추가 성능 향상이 나온다(단 2×500에서는 아님) — 두 방법이 겹치지 않는 정보를 전달한다는 뜻이다.'},
 {h:'그리디 디코딩만으로 충분해진다는 부수 효과',
  lead:'Seq-KD로 학습한 학생은 분포가 뾰족해져 빔서치 없이도 성능이 유지된다.',
  d:'Seq-KD 학생은 교사의 최빈값 근처만 모델링하도록 학습되므로, 그리디 디코딩(빔=1)이 뽑는 문장이 전체 확률질량에서 차지하는 비중이 훨씬 커진다(EN→DE 2×500 기준 0.9%→16.9%). 그 결과 빔서치 없는 그리디 디코딩만으로 4×1000 교사의 빔서치 성능에 필적하면서 **10배 빠른 추론**이 가능해진다.'}
],

diagram:{type:'compare', cap:'같은 교사 지식을 옮기는 두 축 — 단어 하나(word-level)냐 문장 전체(sequence-level)냐.',
 left:{t:'Word-KD', items:[
   '매 위치 소프트 분포 모방','교차엔트로피로 학습','문장 결합 분포는 안 봄']},
 right:{t:'Seq-KD', items:[
   '교사가 빔서치로 낸 문장 자체가 정답','학생은 보통의 NLL로 학습','오늘날 LLM SFT 증류의 원형']}},

math:[
 {expr:'L_WORD-KD = − Σ_j Σ_k q(t_j=k|s,t<j) log p(t_j=k|s,t<j)',
  tex:'\\mathcal{L}_{\\text{WORD-KD}} = -\\sum_{j=1}^{J}\\sum_{k=1}^{|V|} q(t_j\\!=\\!k\\mid s,t_{<j})\\,\\log p(t_j\\!=\\!k\\mid s,t_{<j})',
  d:'매 타임스텝에서 교사·학생 분포 간 교차엔트로피. 표준 [지식 증류](#/p/distillation)를 시퀀스의 각 위치에 그대로 적용한 것.'},
 {expr:'L_SEQ-KD ≈ − log p(t = ŷ | s),   ŷ = argmax_t q(t|s) (빔서치로 근사)',
  tex:'\\mathcal{L}_{\\text{SEQ-KD}} \\approx -\\log p(t=\\hat y \\mid s), \\qquad \\hat y \\approx \\operatorname*{argmax}_{t\\in\\mathcal{T}} q(t\\mid s)',
  d:'문장 전체 분포 $q(t|s)$를 그 최빈값 하나로 근사한다. 최빈값 자체도 지수적으로 큰 탐색 공간이라 빔서치로 근사해서 찾는다.'},
 {expr:'L = (1−α) L_SEQ-NLL + α L_SEQ-KD,   ỹ = argmax_{t∈T_K} sim(t, y)',
  tex:'\\mathcal{L} = (1-\\alpha)\\mathcal{L}_{\\text{SEQ-NLL}} + \\alpha\\,\\mathcal{L}_{\\text{SEQ-KD}}, \\qquad \\tilde y \\approx \\operatorname*{argmax}_{t \\in \\mathcal{T}_K} \\text{sim}(t,y)',
  d:'Seq-Interpolation. 원 데이터 손실과 교사 손실을 섞되, intractable한 두 번째 항을 "정답과 가장 유사한 빔 후보" $\\tilde y$ 하나로 근사해 단일 시퀀스로 학습한다. $\\text{sim}$은 smoothed sentence-level BLEU.'}
],

numbers:[
 {k:'EN→DE BLEU (그리디, 2×500)', v:'14.7 → 18.9', d:'Seq-KD 적용 시 **+4.2** — 같은 학생에 Word-KD만 적용하면 +0.7에 그침'},
 {k:'교사 대비 파라미터', v:'84M vs 221M', d:'2×500 학생이 4×1000 교사(EN→DE) 대비 약 2.6배 작음'},
 {k:'그리디 vs 빔서치 속도', v:'10배', d:'GPU 기준, Seq-KD 학생의 그리디 디코딩이 교사의 빔서치(K=5)와 비슷한 성능을 내면서 10배 빠름 (1051.3 vs 101.9 단어/초)'},
 {k:'가중치 프루닝 후 압축률', v:'13× / 26×', d:'2×500 Seq-KD 모델에서 80%/90% 가중치 제거 시 BLEU 손실 각각 0.4 / 1.0'},
 {k:'교사 최빈값의 확률질량', v:'0.9% → 16.9%', d:'EN→DE 베이스라인 학생 대비 Seq-KD 학생에서, 그리디 출력이 차지하는 확률질량이 크게 증가 — 분포가 뾰족해졌다는 근거'},
 {k:'Thai→English BLEU (그리디)', v:'10.6 → 12.8', d:'저자원 언어쌍에서도 Seq-KD가 베이스라인 대비 +2.2'}
],

impact:'이 논문이 나눈 word-level 대 sequence-level이라는 축은, "교사의 출력 분포를 어떻게 흉내낼까"에서 "교사가 만든 데이터로 그냥 학습하면 된다"로 증류의 개념 자체를 바꿨다. 이 아이디어는 거의 그대로 오늘날 LLM 증류의 표준 절차가 됐다 — 강력한 교사 LLM에게 프롬프트를 주고 응답을 받아, 그 (입력, 응답) 쌍으로 학생을 지도 미세조정(SFT)하는 방식이다. [LLM 증류 서베이](#/p/llm-distill-survey)는 이 SFT 기반 증류를 사실상 이 논문의 Seq-KD와 동일한 방법으로 분류하며 Kim & Rush를 직접 인용한다.',

legacy:[
 '**LLM 시대 SFT 증류의 뿌리** — 교사가 생성한 텍스트로 학생을 지도학습시키는 오늘날의 "distillation via SFT"가 이 논문의 Seq-KD와 형식적으로 동일하다',
 '**분포 대 표본이라는 논쟁의 시작** — 이후 [MiniLLM](#/p/minillm)이 forward KL(mode-covering) 대신 reverse KL을 쓰자고 제안하며 Seq-KD가 쓰는 "단일 표본으로 분포를 근사"하는 접근의 한계를 파고든다',
 '**온폴리시 증류로의 발전** — [GKD](#/p/gkd)는 Seq-KD처럼 고정된 교사 출력에 학습하는 대신, 학생이 직접 생성한 시퀀스에 교사가 피드백을 주는 온폴리시 방식으로 이 노선을 확장한다',
 '**압축과 증류의 직교성** — 가중치 프루닝을 증류 위에 얹어도 손실이 거의 없다는 관찰은, 이후 양자화·프루닝·증류를 함께 쓰는 압축 파이프라인의 근거가 됐다'
],

pitfalls:[
 '**"교사 최빈값 하나로 근사하는 게 조잡하다"는 생각과 달리 잘 작동한다.** 빔 크기 1의 교사 출력이 전체 분포의 1~2%밖에 차지하지 않는데도 Seq-KD가 Word-KD보다 나은 결과를 내는 것은, 학생이 "관련된 부분만" 모델링하도록 돕는 것이 오히려 유리하기 때문이다.',
 '**낮은 perplexity가 더 나은 번역을 뜻하지 않는다.** Seq-KD 학생의 perplexity(22.7)는 베이스라인(8.2)보다 훨씬 나쁘지만 BLEU는 더 높다 — perplexity를 증류 품질의 대리 지표로 쓰면 오판할 수 있다.',
 '**Word-KD와 Seq-KD를 합치면 항상 좋아지는 것은 아니다.** 2×300, 2×100에서는 추가 이득이 있었지만 2×500에서는 오히려 이득이 없었다 — 두 손실의 상호작용은 학생 크기에 따라 달라진다.'
],

figures:[
 {f:'fig1-three-approaches.png',
  cap:'왼쪽부터 Word-KD, Seq-KD, Seq-Interpolation. 가운데 Seq-KD는 교사에 빔서치를 돌려 최고 점수 문장(ACF)을 학생의 학습 타깃으로 바로 쓴다. 오른쪽 Seq-Interpolation은 빔 후보 중 정답(Ground Truth)과 가장 유사한 문장(ECE)을 고른다는 점이 다르다.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'We run experiments to compress a large state-of-the-art 4 x 1000 LSTM model, and find that with sequence-level knowledge distillation we are able to learn a 2 x 500 LSTM that roughly matches the performance of the full system.',
  src:'Section 1, p.1'}
],

links:[
 {t:'arXiv 1606.07947 — Sequence-Level Knowledge Distillation', u:'https://arxiv.org/abs/1606.07947'},
 {t:'GitHub — harvardnlp/seq2seq-attn', u:'https://github.com/harvardnlp/seq2seq-attn'}
]
});
