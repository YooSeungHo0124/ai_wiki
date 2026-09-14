WIKI.concept({
slug:'autoregressive',

tldr:'이전에 생성한 토큰들을 조건으로 다음 토큰 하나의 확률분포를 예측하고, 그 토큰을 다시 입력에 이어 붙여 반복하는 생성 방식이다.',

why:'오늘날 대부분의 LLM이 텍스트를 만드는 방식이 이것이고, 이 구조 자체가 생성이 왜 느린지·왜 [추측 디코딩](#/c/speculative)이나 확산 언어모델 같은 대안이 나왔는지를 설명하는 원인이다. 학습 방식(teacher forcing)과 실제 추론 방식이 다르다는 것을 모르면 노출 편향(exposure bias)으로 생기는 오류 누적을 엉뚱한 곳에서 찾게 되고, API 비용·지연시간 산정에서도 입력 토큰과 출력 토큰을 다르게 계산해야 하는 이유를 놓치게 된다.'
,

sections:[
 {h:'정의', d:'autoregressive 모델은 시퀀스의 결합 확률을 조건부 확률의 곱으로 분해한다 — $t$번째 토큰을 예측할 때 $1$부터 $t-1$까지 이미 생성된(또는 주어진) 토큰만 보고 다음 토큰의 분포를 낸다. [causal mask](#/c/causal-mask)로 미래 토큰을 가린 [Transformer](#/p/transformer) 디코더가 이 조건을 정확히 구현한다. 이름의 "auto-"는 "자기 자신의 과거 출력을 입력으로 다시 쓴다"는 뜻이다 — 통계학의 자기회귀 모형(AR)에서 그대로 가져온 이름이다.'},
 {h:'한 스텝씩 순차 생성', d:'추론 시에는 토큰을 하나 뽑아 시퀀스 끝에 붙이고, 늘어난 시퀀스 전체를 다시 모델에 넣어 다음 토큰을 뽑는 과정을 EOS(문장 종료) 토큰이 나오거나 길이 제한에 닿을 때까지 반복한다. 이 반복이 바로 "생성이 느린" 근본 이유다 — $t$번째 토큰은 정의상 $t-1$번째 토큰이 확정돼야만 계산할 수 있으므로, 학습 때처럼 전체 시퀀스를 한 번에 병렬로 처리할 수 없다. 토큰 하나마다 모델 전체를 한 번씩 통과시켜야 하니, 생성 길이에 비례해 순차적인 forward pass가 필요하고 각 스텝이 GPU를 충분히 활용하지 못하는 memory-bound 연산이 된다(연산량보다 가중치·[KV 캐시](#/c/kv-cache)를 읽는 메모리 대역폭이 병목).'},
 {h:'학습과 추론 차이', d:'학습 때는 모델이 직접 생성한 토큰이 아니라 **정답(ground truth) 시퀀스**를 한 스텝 밀어서 입력으로 넣는다 — 이것이 teacher forcing이다. 덕분에 causal mask만 있으면 전체 시퀀스를 한 번에 병렬로 학습할 수 있어 학습은 빠르다. 문제는 이 방식이 "항상 정답만 보고 다음을 예측하는" 조건에서 학습되기 때문에, 추론 때 모델 자신이 만든(때로는 틀린) 토큰을 이어 붙이면 학습 때 보지 못한 입력 분포를 만나 오류가 다음 오류를 부르며 누적될 수 있다는 것 — 이것이 노출 편향(exposure bias)이다. 짧은 생성에서는 잘 드러나지 않지만 긴 생성이나 반복 루프에서 두드러진다.'},
 {h:'속도의 우회로', d:'순차성 자체를 없애지 않으면서 속도를 얻는 방법이 [추측 디코딩(speculative decoding)](#/c/speculative)이다 — 작은 draft 모델이 여러 토큰을 한꺼번에 미리 추측하면 큰 모델이 그것들을 한 번의 forward pass로 검증만 하고, 맞은 만큼을 한 번에 확정한다(생성 자체는 여전히 autoregressive지만 검증을 병렬화). 반대로 순차성 자체를 버리는 접근이 [LLaDA](#/p/llada) 같은 확산 언어모델(diffusion LM)이다 — 마스킹된 토큰들을 한 번에(또는 몇 라운드에 걸쳐 병렬로) 채워나가는 방식으로, autoregressive의 "왼쪽에서 오른쪽으로 하나씩"이라는 제약 자체를 벗어난다.'},
 {h:'실무에서 체감', d:'실무에서 이 구조는 곧바로 지연시간(latency) 설계로 이어진다 — 프롬프트를 한 번에 넣는 prefill 단계는 전체 토큰을 병렬로 처리해 빠르지만, 그 뒤 한 토큰씩 뽑는 decode 단계는 스텝마다 모델 전체를 다시 통과해야 해서 출력 토큰 수에 비례해 시간이 늘어난다. 같은 모델이라도 "짧은 질문에 긴 답"을 요구하면 decode 비중이 커져 체감 속도가 느려지는 이유가 여기에 있고, [KV 캐시](#/c/kv-cache)는 이전 스텝에서 계산해 둔 key·value를 재사용해 이 반복되는 계산의 일부를 줄이는 장치다.'}
],

math:[
 {tex:'p(x_1,\\dots,x_T)=\\prod_{t=1}^{T} p(x_t\\mid x_1,\\dots,x_{t-1})',
  expr:'autoregressive 분해', d:'전체 시퀀스의 결합 확률을 $T$개의 조건부 확률의 곱으로 정확히 분해한다 — 근사가 아니라 확률의 연쇄 법칙(chain rule)이다. 모델은 우변의 각 조건부 $p(x_t\\mid x_{<t})$를 파라미터화한다.'}
],

diagram:{type:'loop', cap:'추론 시 한 스텝: 예측 → 샘플링 → 이어 붙이기 → 반복.',
 nodes:[
  {t:'x_<t 입력'},
  {t:'다음토큰 분포'},
  {t:'샘플링'},
  {t:'x_t 이어붙임'}
 ]},

code:{lang:'python', d:'autoregressive 생성의 핵심 루프 — 매 스텝 전체 forward pass를 다시 돌린다.',
 src:`tokens = prompt_tokens
for _ in range(max_new_tokens):
    logits = model(tokens)          # 전체 시퀀스를 다시 forward
    next_token = sample(logits[-1]) # 마지막 위치 분포에서 샘플링
    if next_token == EOS: break
    tokens.append(next_token)       # 이어 붙여 다음 입력으로`},

confuse:[
 {a:'autoregressive (AR)', b:'diffusion / non-autoregressive', d:'AR은 좌에서 우로 한 토큰씩 순차 예측한다. diffusion 계열([LLaDA](#/p/llada))이나 non-autoregressive 모델은 전체 또는 여러 위치를 동시에 병렬로 채운다 — 병렬성과 속도를 얻는 대신 대개 별도의 반복 정제(iterative refinement) 라운드가 필요하다.'},
 {a:'teacher forcing', b:'실제 추론(free-running)', d:'teacher forcing은 학습 때 정답 토큰을 입력으로 강제하는 절차다. 추론 때는 모델 자신의 출력을 다시 입력으로 쓰는 free-running 방식뿐이라, 학습·추론 사이의 이 불일치가 노출 편향의 원인이다.'},
 {a:'노출 편향(exposure bias)', b:'오버피팅', d:'노출 편향은 학습·추론 조건(정답 vs 자기 출력)의 불일치에서 오는 오류 누적이지 학습 데이터 암기 문제가 아니다. 검증 손실이 낮아도(오버피팅이 없어도) 노출 편향은 발생할 수 있다.'}
],

pitfalls:[
 '"autoregressive"를 RNN 특유의 개념으로 오해하기 쉽다. RNN도 autoregressive하게 쓸 수 있지만, autoregressive는 생성 방식의 이름이지 아키텍처(RNN vs Transformer)의 이름이 아니다 — 오늘날 대부분의 autoregressive 모델은 Transformer 디코더다.',
 '생성이 느린 이유를 "모델이 커서"로만 돌리기 쉽다. 실제로는 순차적 의존성 자체가 병렬화를 막는 구조적 원인이고, 같은 모델이라도 학습(병렬)과 추론(순차)의 속도 차이가 이 때문에 크게 난다.',
 '추측 디코딩이 "다른 알고리즘으로 생성한다"는 오해가 있다. 실제로는 최종 출력 분포는 원본 autoregressive 모델과 동일하게 보장하면서 검증만 병렬화하는 기법이다.',
 'prefill과 decode를 구분하지 않고 "생성이 느리다"고만 말하면 어디를 최적화해야 할지 짚을 수 없다 — 병목은 항상 순차적인 decode 단계이지, 병렬 처리되는 prefill 단계가 아니다.'
],

papers:['gpt1','pixelrnn','llada'],
terms:['causal-mask','speculative','kv-cache','transformer-block']
});
