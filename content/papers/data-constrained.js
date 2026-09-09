WIKI.paper({
slug:'data-constrained',
venue:'NeurIPS 2023',
authors:'Muennighoff, Rush, Barak, Le Scao, Piktus, Tazi, Pyysalo, Wolf, Raffel (Hugging Face · Harvard · U. Turku)',
arxiv:'2305.16264',

tldr:'[Chinchilla](#/p/chinchilla) 스케일링 법칙은 유니크 데이터가 무한하다고 가정한다. 이 논문은 유니크 텍스트가 바닥났을 때 — 즉 같은 데이터를 여러 epoch 반복해야 할 때 — 손실이 어떻게 움직이는지 400개 이상의 모델로 실측하고, 반복 데이터의 가치 감쇠를 반영한 스케일링 법칙을 새로 제안한다.',

context:'[스케일링 법칙](#/p/scaling-laws)과 [Chinchilla](#/p/chinchilla)는 파라미터 수 $N$ 과 학습 토큰 수 $D$ 를 어떻게 배분해야 손실이 최소가 되는지를 정리했지만, 두 법칙 모두 필요한 만큼 유니크 데이터를 계속 구할 수 있다고 전제한다. 문제는 그 전제가 곧 깨진다는 데 있다. Chinchilla 스케일링을 5300억 파라미터 모델로 외삽하면 11조 토큰, 즉 30TB가 넘는 텍스트가 필요한데, 영어를 제외한 대부분 언어는 물론 영어조차 고품질 데이터가 2024년경 소진될 것이라는 추정이 있었다. 그런데도 당시 대형 LLM은 거의 전부 데이터를 1 epoch만 쓰도록 학습됐고, 일부 연구는 데이터 재사용 자체를 권장하지 않았다. 이 논문은 질문을 뒤집는다 — 데이터가 떨어지면 같은 데이터를 몇 번 더 돌리는 것이 실제로 얼마나 손해인가?',

ideas:[
 {h:'반복은 절벽이 아니라 완만한 감쇠 곡선',
  lead:'반복 데이터의 가치는 epoch가 늘수록 서서히 줄지, 특정 지점에서 갑자기 무너지지 않는다.',
  d:'1000만~90억 파라미터, 최대 1500 epoch까지 400개 이상의 모델을 학습해 최종 검증 손실을 기록했다. 결과는 완만한 곡선이다. 유니크 데이터로 1 epoch만 돈 모델이 항상 손실이 가장 낮지만, 소수의 반복 epoch까지는 그 차이가 무시할 만하고 이후 반복이 늘수록 추가 compute의 가치가 서서히 0으로 수렴한다. "몇 번 반복하면 못 쓴다"는 절벽이 아니라 반복 횟수에 따라 매끈하게 꺾이는 곡선이라는 것이 핵심 관찰이다.'},
 {h:'Chinchilla 공식을 유효 데이터·유효 파라미터로 확장',
  lead:'$D$, $N$ 대신 반복 가치가 반영된 유효 토큰 $D\\prime$·유효 파라미터 $N\\prime$ 을 손실식에 넣는다.',
  d:'Chinchilla의 파라메트릭 손실식 $L(N,D)=A/N^{\\alpha}+B/D^{\\beta}+E$ 에서, 반복 데이터를 유니크 토큰 $U_D$ 와 반복 횟수 $R_D$(= epoch − 1)로 쪼갠 뒤 지수 감쇠로 "유효 토큰 수" $D\\prime$ 을 정의해 $D$ 자리에 대입한다. 모델 크기가 데이터 대비 지나치게 클 때도 같은 논리(초과 파라미터의 가치 감쇠)를 대칭적으로 적용해 유효 파라미터 $N\\prime$ 을 정의한다. 이렇게 만든 data-constrained 스케일링 법칙이 이 논문의 중심 기여다.'},
 {h:'반값이 되는 지점을 실측으로 고정',
  lead:'반복 토큰의 가치가 $1-1/e$로 줄어드는 "반감기"를 실측으로 피팅해 약 15회 반복(16 epoch)로 확인했다.',
  d:'유효 토큰 감쇠식의 학습 상수 $R_D^{*}$ 를 실제 학습 곡선들에 피팅한 결과 약 15, 즉 16 epoch 부근이 반복 토큰이 절반가량의 가치를 잃는 지점으로 나온다. 반대로 최대 약 4 epoch까지는 반복이 새 데이터와 거의 같은 값을 낸다. 이 두 숫자(4와 16)가 논문 전체의 실무 가이드라인을 이룬다.'},
 {h:'데이터 제약일 때는 파라미터보다 epoch를 더 늘려라',
  lead:'같은 compute라도 유니크 데이터가 부족하면 모델을 더 키우기보다 더 작은 모델을 더 여러 epoch 돌리는 쪽이 낫다.',
  d:'Chinchilla식으로 반복 데이터를 "새 데이터와 동등하다"고 가정하고 compute를 배분하면 최적 배분이 실제보다 큰 모델을 요구하게 된다. data-constrained 법칙으로 다시 계산하면, 데이터가 고정된 상황에서는 파라미터와 epoch 모두 늘리되 epoch 쪽을 더 빠르게 늘리는 배분이 손실을 더 낮춘다. 이는 [Chinchilla](#/p/chinchilla)가 암묵적으로 전제한 "1 epoch, 무한 데이터" 세계와 다른 배분 규칙이다.'},
 {h:'반복을 대체·보완하는 방법: 코드 데이터 섞기, 필터링 완화',
  lead:'텍스트가 부족하면 Python 코드를 섞거나 중복 제거·퍼플렉시티 필터를 느슨하게 풀어 데이터를 늘릴 수 있다.',
  d:'자연어 데이터 예산의 최대 50%를 The Stack의 Python 코드로 채워도 자연어 태스크 성능이 떨어지지 않았고, bAbI 같은 상태 추적 과제는 오히려 향상됐다. 필터링 쪽에서는 퍼플렉시티 필터링이 다운스트림 성능에 도움이 됐지만 중복 제거는 (C4 기준) 도움이 되지 않아, [Dedup](#/p/dedup)이 보고한 손실 개선이 다운스트림 성능으로는 잘 이어지지 않을 수 있음을 보였다.'}
],

diagram:{type:'compare', cap:'Chinchilla는 유니크 데이터가 무한하다고 가정하지만, data-constrained 법칙은 반복된 데이터의 가치가 epoch에 따라 감쇠한다고 본다.',
 left:{t:'Chinchilla 가정', items:['유니크 토큰 무제한 공급','D는 항상 새 데이터','N·D를 동일 비중 배분','반복 시나리오 미고려']},
 right:{t:'data-constrained 법칙', items:['유니크 예산 $D_C$ 로 제한','반복 토큰은 지수적으로 가치 감쇠','유효 토큰·유효 파라미터 도입','제약 시 epoch를 더 빠르게 증가']}},

math:[
 {expr:'D\' = U_D + U_D · R_D* · (1 - e^(-R_D / R_D*))',
  tex:'D\\prime = U_D + U_D R_D^{*}\\left(1-e^{-R_D/R_D^{*}}\\right)',
  d:'반복 데이터의 "유효 토큰 수"다. $U_D$ 는 실제 유니크 토큰, $R_D$ 는 반복 횟수(epoch − 1), $R_D^{*}$ 는 학습으로 피팅한 반감기 상수. $R_D=0$(1 epoch)이면 $D\\prime=U_D$ 가 되어 원래 Chinchilla 식으로 돌아간다.'},
 {expr:'L(N, D) = A / N\'^α + B / D\'^β + E',
  tex:'L(N,D)=\\frac{A}{N\\prime^{\\alpha}}+\\frac{B}{D\\prime^{\\beta}}+E',
  d:'Chinchilla 손실식(식 2)에서 $N$, $D$ 를 유효값 $N\\prime$, $D\\prime$ 로 바꿔치기한 것이 이 논문의 파라메트릭 스케일링 법칙 전체다. 피팅 결과 $R_D^{*}\\approx15.4$, $R_N^{*}\\approx5.3$ 을 얻었다.'}
],

numbers:[
 {k:'실험 규모', v:'모델 400개+ / 1000만~90억 파라미터', d:'최대 1500 epoch·9000억 토큰까지 학습해 손실 기록'},
 {k:'거의 손해 없는 반복', v:'최대 약 4 epoch', d:'8.7B 모델을 4 epoch(유니크 44B 토큰) 학습 시 1 epoch(178B 토큰) 대비 검증 손실이 **0.5%**만 높음'},
 {k:'반복 가치의 반감기', v:'$R_D^{*}\\approx15$ (16 epoch)', d:'이 지점에서 반복 토큰이 새 토큰 가치의 $1-1/e$ 만큼만 남는다고 피팅됨'},
 {k:'코드 데이터 혼합', v:'최대 50%까지 무손실', d:'텍스트 예산의 절반을 Python(The Stack)으로 채워도 자연어 태스크 성능 저하 없음; 전체적으로 유효 토큰 **2배** 효과'},
 {k:'40 epoch 이상', v:'반복 사실상 무의미', d:'Figure 1에서 이 지점부터 추가 compute의 손실 개선 효과가 거의 사라짐'}
],

impact:'이 논문 이후 "얼마나 반복해도 되는가"가 막연한 금기에서 정량적 가이드라인으로 바뀌었다. 4 epoch까지는 사실상 공짜, 16 epoch 근방이 반감기, 40 epoch는 무의미하다는 구체적 숫자가 이후 LLM 사전학습 데이터 계획의 기본 참고치가 되었다. 동시에 데이터 제약을 코드 혼합·필터링 조정 같은 보완 수단으로 완화할 수 있다는 실증도 제공해, [Chinchilla](#/p/chinchilla) 최적 배분을 곧이곧대로 따르기 어려운 저자원 상황에서의 실무 기준을 세웠다.',

legacy:[
 '**"epoch 예산" 관행 정착** — 이후 LLM 학습 보고서에서 데이터 반복 횟수를 명시하고 이 논문의 4~16 epoch 기준을 참조하는 것이 관례가 됨',
 '**데이터 큐레이션 계열과 연결** — [The Pile](#/p/the-pile), [RefinedWeb](#/p/refinedweb), [Dedup](#/p/dedup) 등 데이터 품질·중복 제거 연구와 함께 "품질 좋은 데이터를 어떻게 확보·재사용할까"라는 흐름의 한 축을 이룸',
 '**코드 혼합의 근거 자료화** — 자연어 전용 모델에 코드 데이터를 섞는 관행(PaLM, Gopher 등에서 이미 하던 것)에 처음으로 체계적 벤치마크 근거를 제공',
 '**공개 리소스** — 400개 학습 실행의 모델·데이터셋을 공개(datablations)해 후속 스케일링 법칙 연구의 재현·검증 기준점이 됨'
],

pitfalls:[
 '**4/16이라는 숫자는 이 논문의 실험 세팅(C4 기반, 특정 모델·토크나이저 규모)에 대한 실측 피팅값이지 보편 상수가 아니다.** 다른 데이터 분포·모델 규모에서는 $R_D^{*}$ 가 달라질 수 있다.',
 '**반복이 "언제나 안전"하다는 뜻이 아니다.** 곡선은 완만하지만 우하향이며, 지나친 반복(수십~수백 epoch)은 과적합으로 이어져 학습 도중 손실이 다시 증가하는 실패 사례도 관측됐다(부록).',
 '**손실 개선이 다운스트림 성능 개선과 항상 일치하지 않는다.** 중복 제거는 검증 손실을 낮추는 데는 도움이 됐던 선행 연구와 달리, 이 논문의 다운스트림 19개 과제 평가에서는 뚜렷한 이득을 보이지 않았다.'
],

figures:[
 {f:'fig1-return-on-repeat.png',
  cap:'x축은 총 학습 토큰(괄호 안은 epoch 수), y축은 최종 검증 손실. 점선(반복=새 데이터 가정)과 실선(이 논문의 예측)이 약 48B 토큰(4 epoch) 부근까지는 거의 겹치다가 이후 벌어지며, 480B~1.2T(40~100 epoch) 구간에서는 실선이 평평해져 반복의 효과가 사실상 사라짐을 보여준다.',
  src:'원문 Figure 1 (좌), p.1'},
 {f:'fig6-strategies.png',
  cap:'왼쪽: 반복(Repeating) vs 코드로 채우기(Filling with Code) vs 필터링 완화(Filtering) 세 전략의 개념도. 오른쪽: 데이터 예산(x축, 100%→10%)을 줄여가며 19개 과제 평균 성능(y축)을 비교 — 보라(반복)와 빨강(코드 채우기) 곡선이 50%까지는 거의 동일하게 유지되다가 10% 부근에서 함께 급락한다.',
  src:'원문 Figure 6, p.8'}
],

quotes:[
 {t:'We find that with constrained data for a fixed compute budget, training with up to 4 epochs of repeated data yields negligible changes to loss compared to having unique data.',
  src:'Abstract, p.1'},
 {t:'Meaningful gains from repeating data can be made up to around 16 epochs beyond which returns diminish extremely fast.',
  src:'§6, p.7'}
],

links:[
 {t:'arXiv 2305.16264 — Scaling Data-Constrained Language Models', u:'https://arxiv.org/abs/2305.16264'},
 {t:'GitHub — huggingface/datablations', u:'https://github.com/huggingface/datablations'}
]
});
