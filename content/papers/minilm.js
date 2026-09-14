WIKI.paper({
slug:'minilm',
venue:'NeurIPS 2020',
authors:'Wang, Wei, Dong, Bao, Yang, Zhou (Microsoft Research)',
arxiv:'2002.10957',

tldr:'교사의 **마지막 층** self-attention 모듈만 깊게 흉내내면 충분하다는 것을 보인 논문. 어텐션 **분포**(softmax 이후)뿐 아니라 **value들 사이의 관계**까지 맞추는 대신, 층 수나 은닉 차원을 교사와 맞출 필요가 아예 없어졌다.',

context:'[TinyBERT](#/p/tinybert)는 교사·학생의 여러 층을 함수로 매핑해 층 대 층으로 증류하고, [MobileBERT](#/p/mobilebert)는 학생이 교사와 같은 층 수를 갖도록 요구하며 bottleneck으로 은닉 차원을 맞춘다. 두 접근 모두 "교사의 몇 번째 층이 학생의 몇 번째 층에 대응하는가"라는 층 매핑 문제와, 은닉 차원이 다르면 별도 변환 행렬이 필요하다는 제약을 안고 있었다. 이 논문은 굳이 여러 층을 다 맞추지 않고 **교사의 마지막 층 하나**만 깊게 모방해도 되는지, 그리고 그 모방을 층 수·차원에 구애받지 않는 형태로 만들 수 있는지를 묻는다.',

ideas:[
 {h:'마지막 층 하나만 증류 대상으로 삼는다',
  lead:'교사의 마지막 Transformer 층 self-attention만 모방해 층 매핑 문제 자체를 없앤다.',
  d:'TinyBERT나 MobileBERT처럼 여러 층을 층별로 매핑하는 대신, 교사의 **마지막** self-attention 모듈만 학생의 마지막 층이 흉내내도록 한다. 이로써 학생의 층 수를 교사와 다르게, 자유롭게 선택할 수 있다 — 매핑 함수를 설계할 필요가 없어진다.'},
 {h:'Self-Attention Distribution Transfer: 분포를 KL로 맞춘다',
  lead:'Q·K의 스케일드 닷프로덕트(softmax 이후 분포)를 KL divergence로 맞춘다.',
  d:'기존 연구들이 쓰던 어텐션 정렬과 유사하게, 교사·학생의 헤드별 attention 분포(softmax(QKᵀ/√d_k)) 사이 KL divergence를 최소화한다. 이때 학생과 교사의 어텐션 헤드 수가 달라도 무방하다.'},
 {h:'Self-Attention Value-Relation Transfer: value들끼리의 관계를 맞춘다',
  lead:'value 벡터들 사이의 스케일드 닷프로덕트(관계 행렬)를 새로운 지식으로 추가한다.',
  d:'이 논문의 핵심 기여다. attention 분포뿐 아니라 **value 벡터들 사이의 관계**(다중헤드 스케일드 닷프로덕트로 계산한 |x|×|x| 관계 행렬)도 KL divergence로 맞춘다. Value-relation은 서로 다른 은닉 차원의 벡터를 **같은 크기의 관계 행렬로 변환**하므로, 학생의 은닉 차원이 교사와 달라도 별도의 선형변환 파라미터 없이 그대로 증류할 수 있다 — TinyBERT의 $W_h$ 같은 변환 행렬이 필요 없다.'},
 {h:'Teacher Assistant: 크기 차이가 클 때 중간 다리를 놓는다',
  lead:'교사와 학생의 크기 차이가 클 때, 중간 크기의 조교 모델을 거쳐 두 단계로 증류한다.',
  d:'학생이 교사보다 훨씬 작을 때($M \\le L/2$, $d_h\\prime \\le d_h/2$) 곧바로 증류하면 성능이 떨어지는 문제를, [teacher assistant](#/p/teacher-assistant)(Mirzadeh et al., 2019) 아이디어를 빌려 완화한다 — 먼저 교사를 중간 크기 조교로 증류하고, 조교를 다시 최종 학생으로 증류하는 2단계를 쓴다.'}
],

diagram:{type:'compare', cap:'무엇을 맞추느냐 — 층 전체를 매핑할 것인가, 마지막 층의 관계만 볼 것인가.',
 left:{t:'TinyBERT·MobileBERT', items:[
   '여러 층을 매핑해서 증류','은닉 차원 다르면 변환행렬 필요','층 수·차원을 맞춰야 함']},
 right:{t:'MiniLM', items:[
   '마지막 층 self-attention만','value 관계로 차원 문제 해결','층 수·은닉 차원 자유']}},

math:[
 {expr:'A_l,a = softmax(Q_l,a K_l,a^T / √d_k)',
  tex:'\\mathbf{A}_{l,a} = \\text{softmax}\\!\\left(\\frac{\\mathbf{Q}_{l,a}\\mathbf{K}_{l,a}^{\\top}}{\\sqrt{d_k}}\\right)',
  d:'self-attention distribution. 교사·학생 사이 이 분포의 KL divergence를 최소화하는 것이 첫 번째 전이 목표.'},
 {expr:'VR_l,a = softmax(V_l,a V_l,a^T / √d_k)',
  tex:'\\text{VR}_{l,a} = \\text{softmax}\\!\\left(\\frac{\\mathbf{V}_{l,a}\\mathbf{V}_{l,a}^{\\top}}{\\sqrt{d_k}}\\right)',
  d:'value-relation: value 벡터들 사이의 스케일드 닷프로덕트를 다시 softmax한 관계 행렬. 은닉 차원과 무관하게 항상 |x|×|x| 크기라, 교사·학생의 차원이 달라도 그대로 비교 가능하다.'}
],

numbers:[
 {k:'MiniLM(6층·768d) SQuAD2 F1', v:'76.4', d:'같은 크기 DistilBERT(70.7), TinyBERT(73.1) 대비 우위, BERT-Base 교사(76.8)에 근접'},
 {k:'GLUE 평균(동일 조건)', v:'80.4', d:'DistilBERT(75.2), TinyBERT(79.1) 대비 최고, 교사(81.5)의 약 98.6%'},
 {k:'SQuAD 2.0 정확도 유지율', v:'99% 이상', d:'50% 파라미터로 교사 성능의 99%+ 유지(Abstract)'},
 {k:'12층 384d 모델 학습 배치', v:'2048 · 40만 스텝', d:'6층 384d 모델은 batch 512로 동일 스텝 학습 (하이퍼파라미터, 재현용 기록)'}
],

impact:'TinyBERT·MobileBERT가 "교사와 학생의 층·차원을 어떻게 맞출까"를 구조적으로 해결하려 한 반면, MiniLM은 "마지막 층 관계만 보면 차원·층 수를 맞출 필요가 아예 없다"는 관점 전환으로 같은 문제를 우회했다. Value-relation transfer는 이후 과제 비의존 압축 연구에서 "차원에 불변인 지식 표현"을 만드는 방법의 예시로 자주 인용된다.',

legacy:[
 '**차원 불변 지식 전이의 사례** — value-relation처럼 관계 행렬로 변환해 차원 제약을 없애는 방식이 이후 압축 연구의 설계 옵션으로 자리잡음',
 '**MiniLMv2 등 후속 연구** — 여러 헤드의 관계를 더 유연하게 다루는 방향으로 이어짐',
 '**teacher assistant의 재사용** — 크기 차이가 큰 증류에서 중간 모델을 두는 전략이 이후 다양한 압축 파이프라인에서 반복 채택'
],

pitfalls:[
 '**"모든 층을 맞추는 것보다 마지막 층만 맞추는 게 항상 낫다"는 뜻은 아니다.** 이 논문의 주장은 마지막 층만으로도 경쟁력 있는 결과를 얻을 수 있고 그 대가로 매핑 문제가 사라진다는 것이지, 다층 정렬이 열등하다는 증명은 아니다.',
 '**Value-relation은 attention distribution transfer를 대체하는 게 아니라 추가하는 것이다.** 두 손실을 함께 쓰는 것이 이 논문의 제안이며, value-relation만 쓰는 것은 별도로 검증되지 않았다.',
 '**Teacher assistant는 학생이 충분히 작을 때만 쓰인다.** 조건($M \\le L/2$ 등)을 만족하지 않는 일반적인 크기 차이에서는 바로 증류한다 — 모든 경우에 조교를 거치는 것은 아니다.'
],

figures:[
 {f:'fig1-attn-value-transfer.png',
  cap:'교사(왼쪽)·학생(오른쪽) 모두 마지막 층의 Q·K·V만 사용한다. 위쪽 Attention Transfer는 Queries-Keys 스케일드 닷프로덕트(분포)를, 아래쪽 Value-Relation Transfer는 Values-Values 스케일드 닷프로덕트(관계)를 KL divergence로 맞춘다. 두 전이 모두 층 번호나 은닉 차원에 의존하지 않는다.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'We propose distilling the self-attention module of the last Transformer layer of the teacher, which is effective and flexible for the student.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2002.10957 — MiniLM', u:'https://arxiv.org/abs/2002.10957'},
 {t:'GitHub — microsoft/unilm (minilm)', u:'https://github.com/microsoft/unilm/tree/master/minilm'}
]
});
