WIKI.paper({
slug:'spanbert',
venue:'TACL 2020 (arXiv 2019)',
authors:'Joshi, Chen, Liu, Weld, Zettlemoyer, Levy (U. Washington · Princeton · AI2 · Facebook AI)',
arxiv:'1907.10529',

tldr:'[BERT](#/p/bert)가 토큰 하나씩 무작위로 가리던 것을 **연속된 구간(span) 전체**를 가리는 방식으로 바꾸고, 구간 경계 표현만으로 내부를 복원하는 목적함수(SBO)를 더했다. 추출형 QA와 상호참조 해결에서 큰 폭으로 개선했다.',

context:'BERT의 MLM은 15%의 토큰을 **독립적으로** 무작위 선택해 가린다. "Denver Broncos"에서 "Broncos"만 가려지면 바로 앞 단어 "Denver"만 보고도 흔히 맞힐 수 있어, 실제로는 얕은 국소 패턴만 배우기 쉽다. 반면 QA·상호참조 같은 실무 과제는 답이 대개 **여러 토큰짜리 구간**(span)이다. 정답을 span 단위로 뽑아야 하는 과제인데, 정작 사전학습은 개별 토큰 예측만 훈련시킨다는 불일치가 이 논문의 출발점이다.',

ideas:[
 {h:'Span masking: 개별 토큰이 아니라 구간을 통째로 가린다',
  lead:'기하분포로 뽑은 길이의 연속 구간을 통째로 마스킹한다.',
  d:'가릴 구간의 길이 $\\ell$ 을 기하분포 $\\ell \\sim \\text{Geo}(p=0.2)$ 에서 뽑고 $\\ell_{max}=10$ 으로 자른다(평균 길이 3.8단어). 시작 위치는 균등하게 뽑되 **완전한 단어 경계**에서 시작한다. 이렇게 뽑은 구간 안의 토큰들을 BERT와 같은 80/10/10 규칙으로 바꾼다. 전체 마스킹 비율은 BERT와 동일하게 15%를 유지한다.'},
 {h:'SBO: 구간 내부를 경계 표현만으로 복원한다',
  lead:'가려진 구간의 각 토큰을 양쪽 경계 표현 + 상대 위치만으로 예측하게 한다.',
  d:'구간 $(x_s,\\dots,x_e)$ 가 가려졌을 때, 내부의 토큰 $x_i$ 를 그 토큰 자신의 표현이 아니라 **바깥쪽 경계 토큰** $x_{s-1}, x_{e+1}$ 과 상대 위치 임베딩만으로 예측한다. 이렇게 하면 경계 표현이 구간 내부 정보를 압축해서 담도록 강제되는데, 이는 실제 span 기반 QA 모델이 "시작·끝 표현만으로 구간 전체를 대표"하는 방식과 정확히 같은 가정이다.'},
 {h:'단일 문장 학습 + NSP 제거',
  lead:'문장 쌍 대신 최대 512토큰짜리 단일 세그먼트로 학습하고 NSP를 없앤다.',
  d:'BERT처럼 두 세그먼트를 이어 붙이는 대신 **하나의 긴 연속 텍스트**만 사용해, NSP 목적함수 자체를 없앴다. 이는 [RoBERTa](#/p/roberta)의 발견과 같은 방향인데, 실험에서 NSP 제거·단일 세그먼트 학습만으로도 이득의 상당 부분(TACRED 기준 +2.6%)이 나왔고 나머지는 span masking + SBO가 기여했다(+0.7~1.8%p).'}
],

diagram:{type:'compare', cap:'같은 MLM을 무엇을 가리고 무엇으로 복원하느냐로 갈랐다.',
 left:{t:'BERT · 토큰 단위', items:[
   '무작위 개별 토큰 마스킹','자기 위치 표현으로 복원','NSP로 문장쌍 학습']},
 right:{t:'SpanBERT · 구간 단위', items:[
   '연속 구간 통째로 마스킹','양쪽 경계 표현(SBO)으로 복원','단일 세그먼트, NSP 제거']}},

math:[
 {expr:'L(x_i) = L_MLM(x_i) + L_SBO(x_i)',
  tex:'\\mathcal{L}(x_i) = \\mathcal{L}_{\\text{MLM}}(x_i) + \\mathcal{L}_{\\text{SBO}}(x_i)',
  d:'가려진 각 토큰의 손실은 보통의 MLM 항과, 경계 표현만으로 예측하는 SBO 항의 합이다.'},
 {expr:'y_i = f(x_{s-1}, x_{e+1}, p_{i-s+1})',
  tex:'\\mathbf{y}_i = f(\\mathbf{x}_{s-1}, \\mathbf{x}_{e+1}, \\mathbf{p}_{i-s+1})',
  d:'구간 내부 토큰 $x_i$ 의 SBO 표현은 왼쪽 경계 $x_{s-1}$, 오른쪽 경계 $x_{e+1}$, 그리고 왼쪽 경계로부터의 상대 위치 임베딩 $p_{i-s+1}$ 로만 만들어진다. $f$ 는 GeLU를 쓰는 2층 FFN.'}
],

numbers:[
 {k:'평균 span 길이', v:'3.8단어', d:'$\\ell \\sim \\text{Geo}(0.2)$, $\\ell_{max}=10$ 에서'},
 {k:'SQuAD 1.1 F1', v:'94.6', d:'자체 재현 BERT 대비 **+2.0%p**, 사람 성능보다 3.4%p 높음'},
 {k:'SQuAD 2.0 F1', v:'88.7', d:'자체 재현 BERT 대비 **+2.8%p**, 오차 27% 감소(1.1 기준)'},
 {k:'OntoNotes 상호참조', v:'79.6% F1', d:'이전 SOTA(73.0%) 대비 **+6.6%p**, 새 SOTA'},
 {k:'TACRED 관계추출', v:'+3.3%p', d:'자체 재현 BERT 대비 F1 향상, 대부분은 단일 세그먼트 효과'},
 {k:'사전학습 규모', v:'32× V100 GPU · 15일', d:'2.4M 스텝, AdamW 사용'}
],

impact:'span masking + SBO는 "사전학습 목적함수를 다운스트림 과제의 출력 형태에 맞춘다"는 설계 원칙을 보여준 사례다. 특히 추출형 QA·상호참조처럼 **구간을 뽑는** 과제에서 이득이 집중된 것은 이 원칙이 실제로 작동함을 뒷받침한다. NSP 제거·단일 세그먼트 학습이라는 부수적 발견은 같은 해 [RoBERTa](#/p/roberta)와 독립적으로 같은 결론에 도달하며, "NSP는 필요 없다"는 합의를 굳히는 데 함께 기여했다.',

legacy:[
 '**span 단위 사전학습** — T5의 span corruption, SpanBERT류 목적함수가 이후 여러 encoder 계열 모델의 기본 마스킹 전략으로 채택됨',
 '**NSP 폐기 흐름** — [RoBERTa](#/p/roberta)와 함께 "다음 문장 예측은 도움이 안 된다"는 결론을 굳혀, 이후 encoder 모델 대부분이 NSP 없이 학습',
 '**경계 표현으로 구간 압축** — 포인터/스팬 추출 헤드 설계에서 "경계 두 개로 구간 전체를 대표한다"는 가정이 사전학습 단계까지 내려온 선례',
 '**실무 추출형 QA·정보추출 파이프라인** — SQuAD류 리더보드와 상호참조 해결 시스템에서 오래도록 강한 기본 encoder로 쓰임'
],

pitfalls:[
 '**"토큰을 더 많이 가려서 어렵게 만든 것"이 핵심이 아니다.** 전체 마스킹 비율(15%)은 BERT와 동일하다 — 바뀐 것은 가리는 **단위**(개별 토큰 → 연속 구간)와 **복원 방식**(자기 위치 → 경계 표현)이다.',
 '**이득이 모든 과제에 균일하지 않다.** GLUE처럼 문장 전체를 보는 분류 과제에서는 개선폭이 작고, span을 직접 뽑는 QA·상호참조·관계추출에서 개선이 집중된다. "SpanBERT가 BERT보다 항상 낫다"는 일반화는 과장이다.',
 '**SBO는 학습 때만 쓰는 보조 손실이다.** 미세조정·추론 시점에는 SBO 헤드를 버리고 일반 encoder처럼 쓰므로, 실무에서 span 경계를 직접 넣어줘야 하는 것은 아니다.'
],

figures:[
 {f:'fig1-span-boundary.png',
  cap:'"Super Bowl 50 was [MASK][MASK][MASK][MASK] to determine the champion"에서 "an American football game"이 통째로 가려졌다. 파란 상자 x4·x9가 구간 양쪽 경계, 분홍 상자 x7이 그 안의 한 토큰(football) — SBO는 x4·x9와 위치 임베딩만으로 x7을 예측한다.',
  src:'원문 Figure 1, p.2'},
 {f:'fig2-span-length-dist.png',
  cap:'x축은 마스킹할 구간 길이(단어 수), y축은 그 길이가 뽑힐 확률. 길이 1이 가장 흔하고(약 22%) 길어질수록 지수적으로 줄어든다 — 짧은 구간 위주로 뽑되 가끔 긴 구간도 섞는 분포.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'Our approach extends BERT by (1) masking contiguous random spans, rather than random tokens, and (2) training the span boundary representations to predict the entire content of the masked span.',
  src:'Abstract, p.1'},
 {t:'SpanBERT consistently outperforms BERT, with the largest gains on span selection tasks such as question answering and coreference resolution.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1907.10529 — SpanBERT', u:'https://arxiv.org/abs/1907.10529'},
 {t:'GitHub — facebookresearch/SpanBERT', u:'https://github.com/facebookresearch/SpanBERT'}
]
});
