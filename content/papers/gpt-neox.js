WIKI.paper({
slug:'gpt-neox',
venue:'BigScience Workshop @ ACL 2022 (arXiv 2022)',
authors:'Black, Biderman, Hallahan et al. (EleutherAI)',
arxiv:'2204.06745',

tldr:'EleutherAI가 만든 200억 파라미터 자기회귀 언어모델. 발표 시점 기준 **가중치가 공개된 가장 큰 dense 언어모델**이었고, 가중치뿐 아니라 학습 코드·[The Pile](#/p/the-pile) 데이터·중간 체크포인트까지 전부 공개해 이후 오픈 LLM 계보의 출발점이 됐다.',

context:'2022년 초, [GPT-3](#/p/gpt3)급 대형 언어모델은 대부분 상업 API 뒤에 잠겨 있었다. 공개 가중치를 가진 dense 모델은 GPT-2 이후로 GPT-Neo(2.7B)·GPT-J-6B·Megatron-11B·PanGu-α(13B) 정도뿐이었고, 그마저도 GPT-3보다 두 자릿수 이상 작았다. 연구자가 대형 모델의 내부 동작·안전성·해석가능성을 직접 실험하려면 자체적으로 그 규모의 모델을 학습시키는 수밖에 없었다. EleutherAI는 비영리 자원(연구용 GPU 클러스터 CoreWeave 제공)으로 이 공백을 메우기로 했다.',

ideas:[
 {h:'가중치·코드·데이터를 전부 공개',
  lead:'모델 가중치뿐 아니라 학습 코드베이스와 평가 코드, 학습 데이터셋까지 함께 공개한다.',
  d:'같은 시기 다른 대형 모델들은 가중치조차 비공개이거나(GPT-3), 가중치만 공개하고 코드·데이터는 비공개인 경우가 많았다. GPT-NeoX-20B는 학습에 쓴 [The Pile](#/p/the-pile) 데이터셋, Megatron+DeepSpeed 기반 학습 코드, 평가 하네스를 모두 permissive 라이선스로 공개했다. 1000스텝 간격의 중간 체크포인트까지 공개해 학습 동역학 연구를 가능하게 했다.'},
 {h:'회전 위치 임베딩(RoPE) 채택',
  lead:'GPT류가 쓰던 학습형 절대 위치 임베딩 대신 [RoPE](#/p/rope)를 쓰되 임베딩의 앞쪽 25%에만 적용한다.',
  d:'회전 위치 임베딩은 두 토큰 $m,n$ 사이의 attention이 상대 거리 $m-n$ 에만 의존하도록 임베딩 공간을 회전시키는 정적 상대 위치 인코딩이다. 원 RoPE 논문은 임베딩 벡터 전체에 적용하지만, 이 논문은 GPT-J의 관례를 따라 차원의 앞쪽 25%에만 적용하는 것이 성능과 계산 효율의 균형점이라고 보고한다.'},
 {h:'Attention과 FFN을 직렬이 아닌 병렬로',
  lead:'attention과 feed-forward를 순서대로 쌓지 않고 병렬로 계산해 더한다.',
  d:'표준 Transformer 블록은 `x + Attn(LN(x))` 를 계산한 뒤 그 결과에 `+ FFN(LN(x))` 를 순서대로 적용한다. 이 모델은 두 서브레이어를 병렬로 계산해 한 번에 더한다 — 텐서 병렬화에서 레이어마다 필요한 all-reduce 통신을 절반으로 줄여 효율을 얻기 위한 선택이며, Mesh Transformer JAX 환경에서 처리량이 15% 늘었다고 보고한다.'},
 {h:'전부 dense 층 — sparse attention을 쓰지 않는다',
  lead:'GPT-3의 dense/sparse attention 교차 배치 대신 구현 단순성을 위해 전 레이어를 dense로 통일한다.',
  d:'GPT-3는 레이어마다 dense attention과 sparse attention을 번갈아 사용했지만, 이 모델은 구현 복잡도를 낮추기 위해 44개 레이어 전부를 dense attention으로 통일했다. 히든 차원 6144, 헤드 64개, 20B 파라미터 중 임베딩을 제외한 "non-embedding" 파라미터는 19.9B다.'},
 {h:'중복 데이터 1 epoch 이상 학습해도 성능 저하 없음',
  lead:'같은 데이터를 한 epoch 넘게 반복 학습해도 검증 손실이 계속 떨어지는 것을 관찰했다.',
  d:'최근 연구들은 데이터 중복 제거(deduplication)가 대형 모델 성능에 중요하다고 주장했지만, 이 논문은 별도 중복 제거 없이 [The Pile](#/p/the-pile)을 그대로 써서 1 epoch 경계를 넘겨 2 epoch째까지 학습했는데도 검증 손실이나 일반화 오차에 뚜렷한 악화가 없었다고 보고한다. 저자들은 이것이 결론이 아니라 "우리 규모에서는 눈에 띄지 않았다"는 관찰이라고 신중하게 못박는다.'}
],

diagram:{type:'stack', cap:'GPT-3 대비 GPT-NeoX-20B의 아키텍처 변경점 — 숫자와 층 구성 자체는 GPT-3를 따르되 부품 세 곳을 바꿨다.',
 layers:[
  {t:'입력 임베딩', s:'vocab 50257 · BPE'},
  {t:'회전 위치 임베딩', s:'차원의 25%에만 적용', acc:true, note:'학습형 절대 위치 대체'},
  {t:'Attn‖FFN 병렬', s:'44층 · d=6144 · head 64', acc:true, note:'all-reduce 절반으로'},
  {t:'전층 Dense Attn', s:'sparse 층 없음', note:'구현 단순화'},
  {t:'출력 (언어모델 헤드)', s:'20B (비임베딩 19.9B)'}
 ]},

math:[
 {expr:'softmax( (1/√d) Σ x_mᵀ Wqᵀ R^d_Θ,(n-m) Wk x_n )',
  tex:'\\text{softmax}\\!\\left(\\frac{1}{\\sqrt{d}}\\sum_{n,m} \\mathbf{x}_m^{\\top}\\mathbf{W}_q^{\\top} R^{d}_{\\Theta,(n-m)}\\mathbf{W}_k \\mathbf{x}_n\\right)',
  d:'회전 위치 임베딩이 적용된 attention. $R^{d}_{\\Theta,x}$ 는 인덱스 $i$ 블록이 각도 $x\\theta_i$ 만큼의 2D 회전인 block-diagonal 행렬이며, $\\theta_i = 10000^{-2i/d}$ 로 정의된다. 표준 attention과 달리 두 토큰의 상대 거리 $n-m$ 이 회전 각도로 직접 들어간다.'}
],

numbers:[
 {k:'파라미터 규모', v:'20B (비임베딩 19.9B)', d:'44층 · 히든 6144 · 헤드 64'},
 {k:'학습 데이터', v:'The Pile · 825GiB+', d:'중복 제거 없이 그대로 사용, 1 epoch 경계 이후도 학습'},
 {k:'배치 크기', v:'약 3.15M 토큰', d:'2048 토큰 컨텍스트 × 1538개, GPT-3 175B와 동일한 값 사용'},
 {k:'학습 스텝', v:'150,000 스텝', d:'cosine 스케줄로 학습률을 최종 10%까지 감쇠'},
 {k:'하드웨어 효율', v:'GPU당 117 TFLOPS', d:'A100 96장(12노드×8장), tensor 병렬 2 × 파이프라인 병렬 4'},
 {k:'0→5-shot 개선폭', v:'+0.0598 (Hendrycks 태스크)', d:'GPT-J-6B +0.0526, FairSeq 6.7B +0.0051·13B +0.0183 대비 훨씬 큰 폭'}
],

impact:'GPT-NeoX-20B 자체의 벤치마크 성능은 동급 GPT-3 모델을 항상 능가하지는 못했지만, 이 논문의 실질적 영향은 성능표가 아니라 **공개 방식**에 있다. "가중치·코드·데이터·중간 체크포인트를 전부 공개한다"는 이 논문의 선례는 이후 [OPT](#/p/opt)·[BLOOM](#/p/bloom)·[OLMo](#/p/olmo)로 이어지는 오픈 LLM 계보의 초기 이정표가 됐다. 또한 few-shot 학습 이득이 모델·데이터에 따라 크게 갈린다는 관찰, 데이터 중복이 반드시 해롭지 않을 수 있다는 관찰은 이후 스케일링 연구에 참고점을 남겼다.',

legacy:[
 '**오픈 가중치 계보의 초기 이정표** — [OPT](#/p/opt)(Meta)·[BLOOM](#/p/bloom)(BigScience)·[OLMo](#/p/olmo)(AI2)로 이어지는 "가중치+코드+데이터 공개" 관행의 선례',
 '**회전 위치 임베딩(RoPE)의 대형 모델 검증 사례** — 이후 [LLaMA](#/p/llama)를 비롯한 대다수 오픈 LLM이 RoPE를 기본값으로 채택',
 '**Attention‖FFN 병렬 블록**은 이후 PaLM 등 일부 대형 모델의 아키텍처 선택에도 등장',
 'EleutherAI는 이 프로젝트의 인프라·노하우를 기반으로 이후 Pythia 스위트(체계적 스케일링 연구용 공개 모델군)로 이어감'
],

pitfalls:[
 '**"20B"라는 이름이 실제로는 19.9B 비임베딩 파라미터를 반올림한 것.** Kaplan et al.의 스케일링 법칙 관례를 따른 표기라 다른 논문의 "20B"와 집계 기준이 다를 수 있다.',
 '**벤치마크에서 항상 GPT-3를 이기는 것이 아니다.** 32개 평가 중 22개에서 앞서고 4개에서 뒤처지며 6개는 오차범위 내 — "오픈 모델이 곧 더 강한 모델"이라는 뜻은 아니다.',
 '**데이터 중복 무해성 관찰을 일반화하면 안 된다.** 저자들 스스로 "우리 규모·데이터에서 눈에 띄지 않았을 뿐"이라 명시했고, 이후 다른 연구들의 중복 제거 효과 보고와 상충하지 않는다는 점을 분명히 한다.'
],

figures:[
 {f:'fig1-rotary.png',
  cap:'왼쪽 점선 박스: 2차원 벡터 $(x_1,x_2)$ 를 위치 $m$ 에 비례한 각도 $m\\theta_1$ 만큼 회전시켜 위치 정보를 주입하는 것이 회전 임베딩의 핵심. 아래: 실제 토큰 시퀀스("Enhanced Transformer with Rotary Position Embedding")의 Query/Key 벡터들이 각 위치(1~6)에 따라 다른 각도로 회전되어 "Position Encoded Query/Key"로 바뀌는 과정.',
  src:'원문 Figure 1, p.2 (Su et al. 2021 인용)'},
 {f:'fig4-loss.png',
  cap:'위: 학습·검증 손실 곡선(로그 스케일 x축). 점선이 1 epoch 지점인데, 그 이후로도 검증 손실(검은 선)이 계속 떨어져 과적합 징후가 없다. 아래: 1 epoch 전후(주황=1 epoch, 초록=2 epoch)의 일반화 오차 산점도 — 두 구간의 추세선이 거의 평평해 중복 학습의 악영향이 관찰되지 않았다는 근거.',
  src:'원문 Figure 4, p.6'}
],

quotes:[
 {t:'We introduce GPT-NeoX-20B, a 20 billion parameter autoregressive language model trained on the Pile, whose weights will be made freely and openly available to the public through a permissive license.',
  src:'Abstract, p.1'},
 {t:'GPT-J-6B and GPT-NeoX-20B benefit substantially more from few-shot evaluations than the FairSeq models do... This result is statistically significant and robust to perturbations of prompting.',
  src:'Section 5.2, p.5-6'}
],

links:[
 {t:'arXiv 2204.06745 — GPT-NeoX-20B', u:'https://arxiv.org/abs/2204.06745'},
 {t:'공식 코드/체크포인트 (EleutherAI/gpt-neox)', u:'https://github.com/EleutherAI/gpt-neox'}
]
});
