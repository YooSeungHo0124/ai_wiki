WIKI.paper({
slug:'deeper-self-attention',
venue:'AAAI 2019',
authors:'Al-Rfou, Choe, Constant, Guo, Jones (Google AI Language)',
arxiv:'1808.04444',

tldr:'[Transformer](#/p/transformer) decoder를 **64층**까지 쌓아 문자 단위 언어모델에서 LSTM 계열을 큰 격차로 앞선 논문. 층을 그렇게 깊게 쌓으면 학습이 무너지는데, 중간 층·중간 위치마다 보조 손실(auxiliary loss)을 추가해 그 문제를 풀었다.',

context:'2018년까지 문자 단위 언어모델의 표준은 [LSTM](#/p/lstm) 계열을 절단 시간역전파(truncated BPTT)로 학습하는 것이었다 — 배치 사이에 은닉 상태를 넘겨 짧은 배치 길이로도 긴 문맥을 흉내낸다. 그런데 후속 분석은 이런 모델이 실제로는 약 200 토큰 정도의 문맥만 유효하게 쓰고, 어순의 영향은 마지막 50 토큰 안에서만 나타난다고 지적했다. Transformer는 이미 [attention으로 임의 거리를 한 홉에 잇는다](#/p/transformer)는 것을 번역에서 보였지만, 이 논문 이전에는 10층을 넘는 깊이에서 학습이 느려지고 정확도가 떨어지는 문제 때문에 아무도 순수 self-attention만으로 깊은 언어모델을 성공시키지 못했다.',

ideas:[
 {h:'배치 경계 없이 고정 길이 문맥을 통째로 처리',
  lead:'RNN처럼 상태를 배치 간에 넘기지 않고, 512자 고정 문맥을 매번 처음부터 causal attention으로 처리한다.',
  d:'학습 시퀀스는 코퍼스의 임의 위치에서 뽑은 512자이고, 배치 사이에 어떤 정보도 넘기지 않는다. [Transformer](#/p/transformer) decoder의 causal(좌측만 보는) mask를 그대로 써서, $t_i$ 예측이 $t_0,\\dots,t_{i-1}$ 에만 의존하게 만든다. 저자들은 이 구조의 성공 이유를 RNN처럼 정보를 한 스텝씩 전달하는 대신 attention이 임의 거리를 "빠르게" 전파하기 때문이라고 본다.'},
 {h:'Multiple Positions: 매 위치마다 예측 손실을 준다',
  lead:'마지막 위치 하나가 아니라 시퀀스의 모든 위치에서 다음 문자를 예측하게 해 손실을 늘린다.',
  d:'배치 간 정보 전달이 없으므로 시퀀스 앞쪽 위치는 문맥이 한두 글자뿐이다. 이 위치들에도 예측 과제를 강제로 부여하면 유효 문맥이 짧아 원래 목표(전체 문맥 예측)에 방해될 것 같지만, 실제로는 학습을 크게 가속하고 최종 성능도 올린다. 이 손실을 빼면 bpc가 1.06→2.48로 폭등한다.'},
 {h:'Intermediate Layer Losses: 중간 층에도 예측을 붙인다',
  lead:'각 중간 층 출력에서도 다음 문자를 예측시키되, 학습이 진행되며 그 가중치를 점점 줄인다.',
  d:'64층 전부에 예측 head를 달아 하위 층도 유용한 표현을 일찍부터 학습하도록 강제한다. $n$층 중 $l$번째 중간 층의 손실은 전체 학습의 $l/2n$ 지점에서 완전히 꺼지도록 스케줄링해서, 학습 후반부에는 최종 층 손실만 남는다. 이 손실 없이 학습하면 bpc가 1.06→1.16으로 나빠져, 얕은 층 붕괴를 막는 핵심 장치임을 보여준다.'},
 {h:'Multiple Targets: 한 걸음 너머의 문자도 같이 예측',
  lead:'다음 문자뿐 아니라 그 다음 문자까지 별도 분류기로 동시에 예측하게 한다.',
  d:'각 위치에서 $t_{i+1}$ 뿐 아니라 $t_{i+2}$ 도 별도 classifier로 예측시키고, 이 추가 타깃의 손실에는 0.5 가중치를 곱한다. 더 먼 목표를 억지로 예측하게 하는 것 자체가 표현을 정규화하는 효과를 낸다.'},
 {h:'층마다 다른 learned positional embedding',
  lead:'sin/cos 위치 인코딩 대신 층마다 독립적인 학습형 위치 임베딩을 매 층 입력에 더한다.',
  d:'원 [Transformer](#/p/transformer)는 첫 층 입력에만 sin/cos 위치 인코딩을 한 번 더한다. 64층까지 내려가면 그 위치 정보가 층을 거치며 희석될 것을 우려해, 층마다 별도의 $L\\times 512$ 학습형 임베딩을 만들어 **매 층의 입력**에 반복해서 더한다. 대신 이 모델은 학습 때 본 길이(512)보다 긴 문맥으로 일반화할 필요가 없다는 전제 위에 서 있다.'}
],

diagram:{type:'stack', cap:'낮은 층일수록 학습 후반부에 손실이 꺼진다(점선 부분). 실제로는 이 예시(2층)의 32배인 64층까지 쌓는다.',
 layers:[
  {t:'입력 문자', s:'512자 고정 문맥'},
  {t:'층별 위치임베딩', s:'층마다 별도 학습'},
  {t:'Self-Attention', s:'causal, 64층 반복', acc:true, note:'좌측만 참조'},
  {t:'중간층 손실', s:'모든 위치서 예측', note:'학습 후반 감쇠'},
  {t:'최종층 손실', s:'모든 위치서 예측', note:'추론엔 이것만 사용'}
 ]},

math:[
 {expr:'Pr(t0:L) = P(t0) · Π_{i=1}^{L} Pr(ti | t0:i-1)',
  tex:'\\Pr(t_{0:L}) = P(t_0)\\prod_{i=1}^{L}\\Pr(t_i \\mid t_{0:i-1})',
  d:'표준 자기회귀 언어모델 분해. 이 논문의 기여는 우변의 $\\Pr(t_i\\mid t_{0:i-1})$ 을 계산하는 함수를 RNN 대신 causal self-attention 64층으로 바꾼 것뿐이다.'},
 {expr:'중간층 l의 손실 가중치는 학습 진행률이 l/(2n)을 넘으면 0',
  tex:'w_l(\\text{step}) = \\begin{cases}1 & \\text{step}/\\text{steps}_{\\text{total}} < l/(2n)\\\\ 0 & \\text{otherwise}\\end{cases}',
  d:'$n$은 전체 층 수(64). 하위 층일수록 더 빨리 손실이 꺼지고, 전체 학습의 절반이 지나면 중간층 손실은 모두 사라져 최종층 손실만 남는다.'}
],

numbers:[
 {k:'층 수 (T64)', v:'64층 · head 2 · d 512', d:'FFN 필터 크기 2048'},
 {k:'입력 시퀀스 길이', v:'512자', d:'text8·enwik8 모두 동일'},
 {k:'파라미터', v:'약 235M', d:'train 기준, inference 기준으로는 219M — text8 코퍼스 글자 수보다 많다'},
 {k:'text8 test bpc', v:'1.13', d:'T64, 기존 SOTA(mLSTM 등 1.27) 대비 큰 격차'},
 {k:'enwik8 test bpc', v:'1.06', d:'같은 하이퍼파라미터를 재튜닝 없이 그대로 적용'},
 {k:'ablation: Multiple Positions 제거', v:'1.06→2.48 bpc', d:'Table 4, 가장 큰 손실 요인'},
 {k:'ablation: Intermediate Layer Losses 제거', v:'1.06→1.16 bpc', d:'Table 4, 두 번째로 큰 손실 요인'}
],

impact:'이 논문은 RNN의 순차 전달 없이도, 심지어 상태를 배치 사이에 전혀 넘기지 않고도 긴 문맥의 문자 단위 언어모델링에서 RNN을 능가할 수 있음을 처음 실증했다. 핵심 기여는 아키텍처 자체가 아니라 **깊이를 버티게 하는 학습 기법**(중간 층·중간 위치 보조 손실)이었고, 이것이 없으면 10층만 넘어도 학습이 잘 안 됐다는 점이 저자들 스스로의 관찰이다. 이후 문맥 길이를 늘리려는 시도들은 이 논문의 "고정 길이·문맥 재사용 없음"이라는 근본적 한계 — 문맥 경계를 넘어가는 의존성을 전혀 못 본다는 점 — 를 정면으로 겨냥하게 된다.',

legacy:[
 '**[Transformer-XL](#/p/transformer-xl)이 이 논문을 개선 대상으로 직접 지목** — 세그먼트 경계마다 문맥이 끊기는 문제를 recurrence와 relative positional encoding으로 해결',
 '깊은 self-attention 학습을 위한 보조 손실 아이디어는 이후 다양한 deep supervision 기법의 선례로 인용됨',
 '문자 단위·바이트 단위 언어모델링이 서브워드 토크나이저 없이도 강력한 성능을 낼 수 있다는 것을 보여, 이후 바이트 단위 모델링 연구에 근거를 제공'
],

pitfalls:[
 '**"긴 문맥을 잘 쓴다"는 주장과 헷갈리기 쉽다.** 실제로는 학습에 쓴 512자보다 긴 문맥으로는 일반화하지 못하며(학습형 위치 임베딩이 그 길이에 고정), 배치(세그먼트) 경계를 넘는 의존성은 아예 볼 수 없다.',
 '**추론이 RNN보다 비싸다.** 상태를 재사용하지 않으므로 문자 하나를 예측할 때마다 전체 문맥을 처음부터 다시 forward해야 한다.',
 '**"enwik8 bits per character"라는 표현에 주의하라고 저자들이 직접 지적한다** — 여러 선행 연구가 실제로는 bits per **byte** 를 bpc로 잘못 표기했다고 밝힌다.'
],

figures:[
 {f:'fig2-aux-loss.png',
  cap:'화살표가 causal self-attention 연결. 위 예시(2층)에서 마지막 위치($t_4$)뿐 아니라 $t_1,t_2,t_3$ 에서도 빨간 화살표로 예측 손실을 추가한다 — 실제 모델은 이 구조를 64층까지 반복한다.',
  src:'원문 Figure 2, p.2'}
],

quotes:[
 {t:'we show that a non-recurrent model can achieve strong results on character-level language modeling',
  src:'Abstract/Introduction, p.1'}
],

links:[
 {t:'arXiv 1808.04444 — Character-Level Language Modeling with Deeper Self-Attention', u:'https://arxiv.org/abs/1808.04444'}
]
});
