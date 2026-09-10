WIKI.paper({
slug:'eagle',
venue:'ICML 2024',
authors:'Li, Wei, Zhang, Zhang (Peking University · Microsoft Research · U. Waterloo · Vector Institute)',
arxiv:'2401.15077',

tldr:'[추측 디코딩](#/p/speculative)의 초안을 토큰이 아니라 LLM의 **두 번째-최상위층 특징(feature)** 수준에서 자기회귀로 예측한다. 특징 시퀀스에 "한 스텝 앞선 토큰"을 함께 넣어 예측의 불확실성을 없애고, 타깃 LLM의 출력 분포를 정확히 보존하면서 2.7~3.5배(그리디, MT-bench) 지연시간을 줄인다.',

context:'[추측 디코딩](#/p/speculative)은 작은 draft 모델이 여러 토큰을 미리 예측하면 원본(target) LLM이 한 번의 forward pass로 병렬 검증해 채택 여부를 정한다. 문제는 적당한 크기의 별도 draft 모델을 구하고 유지하는 비용이다 — 7B 모델을 가속할 draft 모델 자체가 마땅치 않고, [Medusa](#/p/medusa)처럼 토큰을 독립적으로 여러 개 예측하는 방식은 헤드 사이의 의존 관계를 놓친다. EAGLE은 "토큰 대신 무엇을 예측할지"와 "그 예측이 왜 부정확해지는지"를 동시에 다시 묻는다.',

ideas:[
 {h:'토큰이 아니라 특징 수준에서 자기회귀',
  lead:'LM Head 직전의 second-to-top-layer feature 시퀀스를 예측하는 것이 토큰을 직접 예측하는 것보다 규칙적이다.',
  d:'토큰 시퀀스는 샘플링 과정에서 생기는 무작위성 때문에 다음 토큰을 예측하기 어렵다. 반면 LM Head 바로 앞의 feature($f$)는 샘플링 이전의 연속적인 표현이라 시퀀스 간 패턴이 더 일관된다. EAGLE의 draft 모델은 이 feature 시퀀스를 자기회귀로 예측한 뒤, 타깃 LLM과 **같은 LM Head**를 재사용해 토큰 분포로 변환한다.'},
 {h:'특징 예측의 불확실성 문제',
  lead:'같은 feature라도 샘플링 결과에 따라 다음 feature가 갈라지는 본질적 불확실성이 있다.',
  d:'토큰 $t_{always}$와 $t_{am}$이 같은 feature $f_I$("I")에서 나올 수 있지만, 이후 feature($f_{always}$ vs $f_{am}$)는 어느 토큰이 실제로 샘플링됐는지에 따라 갈린다. feature만으로는 이 분기를 구분할 정보가 없어 Medusa 등 feature 기반 방법들이 정확도의 한계에 부딪힌다.'},
 {h:'해결책: 한 스텝 앞선 토큰을 함께 입력',
  lead:'feature 시퀀스에 실제 샘플링된 토큰 시퀀스를 한 스텝 밀어서 이어붙이면 불확실성이 해소된다.',
  d:'$f_{i+1}$을 예측할 때 feature 시퀀스 $(f_1,\\dots,f_i)$뿐 아니라 **이미 샘플링된 토큰 시퀀스** $(t_2,\\dots,t_{i+1})$을 한 스텝 앞서 붙여 함께 입력한다. 어떤 토큰이 실제로 뽑혔는지가 명시되므로 다음 feature의 분기가 결정론적이 되고, 이 한 가지 변경만으로 draft 정확도와 속도가 크게 개선된다(논문 Figure 4의 ablation).'},
 {h:'draft 모델 구조: FC+디코더 레이어 하나, 타깃 LLM의 임베딩·LM Head 재사용',
  lead:'Embedding과 LM Head는 타깃 LLM 것을 그대로 쓰고, 학습되는 부분은 Autoregression Head 하나뿐이다.',
  d:'draft 모델은 (feature, 한 스텝 앞선 토큰 임베딩)을 이어붙여 FC 레이어로 차원을 줄인 뒤 트랜스포머 디코더 레이어 하나로 다음 feature를 예측한다. Embedding layer와 LM Head는 타깃 LLM의 파라미터를 그대로 재사용해 **학습이 필요 없다** — 학습되는 것은 Autoregression Head(FC+디코더 1층)뿐이라 70B 모델 기준 A100 서버에서 1~2일이면 학습이 끝난다.'},
 {h:'Tree attention으로 여러 후보를 한 번에 검증',
  lead:'하나의 체인이 아니라 트리 구조 초안을 만들어 한 번의 forward pass로 여러 경로를 동시 검증한다.',
  d:'m번의 forward pass로 m개보다 많은 토큰(예: 3번 만에 10개)을 담은 트리 초안을 만들고, 타깃 LLM이 tree attention으로 트리의 모든 경로를 한 번에 검증한다. 이는 체인 하나만 검증하는 기존 추측 디코딩보다 채택되는 토큰 수를 늘린다.'}
],

diagram:{type:'flow', cap:'draft 모델이 feature와 한 스텝 앞선 토큰을 함께 입력받아 다음 feature를 예측하고, 같은 LM Head로 토큰을 샘플링한다.',
 nodes:[
  {t:'feature f_i', s:'target LLM 출력'},
  {t:'토큰 t_i+1 결합', s:'한 스텝 앞선 시퀀스', acc:true},
  {t:'자기회귀 헤드', s:'FC + 디코더 1층'},
  {t:'다음 feature 예측', s:'f_i+1'},
  {t:'LM Head', s:'target LLM 것 재사용', a:'토큰 샘플'}
 ]},

math:[
 {expr:'L_reg = SmoothL1(f_{i+1}, DraftModel(T_{2:i+1}, F_{1:i}))',
  tex:'L_{reg} = \\text{SmoothL1}\\big(f_{i+1},\\ \\text{DraftModel}(T_{2:i+1}, F_{1:i})\\big)',
  d:'다음 feature 예측은 회귀 문제이므로 Smooth L1 손실로 학습한다. 입력은 feature 시퀀스 $F_{1:i}$와 한 스텝 앞선 토큰 시퀀스 $T_{2:i+1}$.'},
 {expr:'p̂_{i+2} = Softmax(LM_Head(f̂_{i+1})),   L_cls = CrossEntropy(p_{i+2}, p̂_{i+2})',
  tex:'\\hat p_{i+2}=\\text{Softmax}(\\text{LM\\_Head}(\\hat f_{i+1})),\\qquad L_{cls}=\\text{CrossEntropy}(p_{i+2},\\hat p_{i+2})',
  d:'feature 예측 자체는 중간 목표일 뿐이라, 최종 목표인 토큰 분포에 대한 분류 손실도 함께 쓴다. 전체 손실은 $L=L_{reg}+w_{cls}L_{cls}$이며 분류 손실이 수치상 훨씬 커서 $w_{cls}=0.1$로 가중한다.'}
],

numbers:[
 {k:'속도향상 (LLaMA2-Chat 70B)', v:'2.7~3.5×', d:'MT-bench, greedy(temperature=0), vanilla 자기회귀 대비 지연시간 기준'},
 {k:'속도향상 (Vicuna 13B)', v:'3.01~3.76×', d:'temperature=0 기준. temperature=1에서는 2.66~2.89×로 낮아짐 — 샘플링 무작위성이 클수록 초안 채택률이 떨어짐'},
 {k:'대비 Lookahead/Medusa', v:'1.70~2.08× / 1.47~1.60×', d:'같은 벤치마크에서 EAGLE이 두 대안 추측 디코딩 방법보다 빠른 배수'},
 {k:'draft 트리 구성', v:'3회 forward로 10토큰', d:'depth m의 트리를 m번의 forward pass로 m개보다 많은 토큰까지 생성'},
 {k:'학습 비용', v:'A100 1~2일, 68K 대화 (ShareGPT)', d:'학습 대상은 Autoregression Head 하나뿐. 2~4B 토큰 규모로 학습(Medusa 등 대비 경량)'},
 {k:'출력 분포 보존', v:'이론적으로 정확히 보존', d:'추측 샘플링의 accept/reject 절차 덕분에 EAGLE 사용 여부와 무관하게 타깃 LLM과 동일한 분포에서 샘플링됨 — 품질 평가가 "불필요"하다고 저자들이 명시'}
],

impact:'추측 디코딩의 병목을 "얼마나 좋은 draft 모델을 구하느냐"에서 "무엇을 예측 단위로 삼느냐"로 옮겼다. feature 수준 자기회귀 + 한 스텝 앞선 토큰이라는 단순한 조합으로, 별도의 draft 모델 없이 타깃 LLM의 Embedding·LM Head를 재사용하면서도 Medusa·Lookahead보다 빠른 결과를 냈다. 출력 분포를 수학적으로 정확히 보존한다는 점이 커, 품질 저하 없는 가속이라는 추측 디코딩의 핵심 전제를 유지한 채 실용적인 배포가 가능해졌다.',

legacy:[
 '**feature 기반 초안의 계보** — Medusa가 먼저 feature에서 여러 헤드로 독립 예측을 시도했지만, EAGLE이 자기회귀 + 한 스텝 앞선 토큰으로 그 불확실성 문제를 정면으로 풀며 이후 EAGLE-2·EAGLE-3로 이어짐',
 '**KV 캐시 압축과는 다른 축의 서빙 최적화** — [H2O](#/p/h2o)·[StreamingLLM](#/p/streaming-llm)이 "캐시를 무엇을 남길지"를 다뤘다면, EAGLE은 "한 번의 forward에서 몇 토큰을 만들지"를 다뤄 서빙 스택에서 서로 결합 가능한 별개 축',
 '**타깃 LLM 파라미터 재사용이라는 설계 원칙** — draft 모델을 처음부터 새로 학습하지 않고 target LLM의 Embedding·LM Head를 그대로 빌려 쓰는 방식이 이후 경량 draft 설계의 표준적 선택지가 됨'
],

pitfalls:[
 '**속도향상 배수는 온도·배치 크기에 따라 달라진다.** 논문이 보고하는 2.7~3.76배는 주로 **greedy(temperature=0), 배치=1** 조건이며, temperature=1에서는 채택률이 낮아져 배수가 줄어든다(예: LLaMA2-Chat 13B가 3.01~3.76×에서 2.66~2.89×로). 배치 크기가 커지면 검증 단계의 병렬성 이점이 줄어드는 것도 별도로 고려해야 한다.',
 '**"출력 분포가 보존된다"는 EAGLE 자체의 수학적 보장이지, draft 정확도와 무관하게 항상 빠르다는 뜻이 아니다.** draft가 자주 틀리면 채택률이 낮아져 속도 이득이 줄 뿐 품질은 항상 target LLM과 동일하게 유지된다 — "빠른데 품질도 그대로"가 아니라 "품질은 그대로이고 얼마나 빠른지가 draft 정확도에 달렸다"로 읽어야 한다.',
 '**작은 모델(7B)에는 적당한 기존 추측 디코딩용 draft 모델이 마땅치 않다는 것이 이 논문의 문제의식 중 하나였다.** EAGLE은 이를 자체 draft 모델(파라미터 재사용)로 우회했지만, feature 기반 접근 자체가 항상 별도 draft LLM보다 우월하다는 뜻은 아니며 비교는 태스크·모델별로 갈린다(코드 생성에서 가장 큰 가속을 보인 것도 템플릿이 고정적인 도메인 특성 때문).'
],

figures:[
 {f:'fig6-pipeline.png',
  cap:'왼쪽이 target LLM의 forward, 오른쪽이 draft 모델의 3번의 forward. 주황 f는 feature, 빨간 테두리는 draft 모델의 예측. feature와 "한 스텝 앞선 토큰"(e_help, e_with 등)이 함께 Autoregression Head에 들어가는 것이 핵심.',
  src:'원문 Figure 6, p.4'},
 {f:'fig1-speedup.png',
  cap:'MT-bench, temperature=0 기준 모델별 속도향상. 파란 막대(EAGLE)가 모든 모델 크기에서 Medusa(초록)·Lookahead(빨강)·추측 디코딩(보라)보다 일관되게 높다. N/A는 해당 모델 크기에 적절한 draft 모델이 없어 추측 디코딩을 적용할 수 없었던 경우.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'autoregression at the feature (second-to-top-layer) level is more straightforward than at the token level. Secondly, the inherent uncertainty in feature (second-to-top-layer) level autoregression constrains its performance.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2401.15077 — EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty', u:'https://arxiv.org/abs/2401.15077'},
 {t:'GitHub — SafeAILab/EAGLE', u:'https://github.com/SafeAILab/EAGLE'}
]
});
