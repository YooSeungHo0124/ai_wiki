WIKI.concept({
slug:'negative-prompt',

tldr:'[Classifier-Free Guidance](#/c/guidance)의 무조건부(unconditional) 항을 "아무 조건 없음" 대신 원하지 않는 개념으로 바꿔치기해, 그 방향에서 멀어지도록 유도하는 확산 모델 기법이다.',

why:'Stable Diffusion 류 UI 에 있는 negative prompt 칸을 "하지 말라고 적는 곳"으로만 알고 쓰면, guidance scale 을 낮게 잡았을 때 negative prompt 가 왜 안 먹히는지 설명할 수 없다. 이건 실수가 아니라 수식 구조상 당연한 결과이며, 이를 알아야 실무에서 파라미터를 제대로 맞출 수 있다.',

sections:[
 {h:'CFG는 두 예측을 섞는다', d:'[Classifier-Free Guidance](#/p/cfg)는 확산 모델이 매 스텝마다 잡음을 예측할 때, 텍스트 조건 $c$ 를 준 예측 $\\epsilon_\\theta(x_t,c)$ 와 조건을 비운(null, $\\varnothing$) 무조건부 예측 $\\epsilon_\\theta(x_t,\\varnothing)$ 을 둘 다 구해서, 그 차이 방향으로 guidance scale $w$ 만큼 밀어낸 값을 최종 예측으로 쓴다. 이 차이 $\\epsilon_\\theta(x_t,c)-\\epsilon_\\theta(x_t,\\varnothing)$ 이 "조건 $c$ 가 없을 때와 있을 때의 차이", 즉 $c$ 방향으로의 이동 벡터 역할을 한다.'},
 {h:'무엇을 바꾸는가', d:'negative prompt 는 이 수식에서 "무조건부" 자리를 $\\varnothing$ 대신 원하지 않는 조건 $n$(예: "blurry, extra fingers")으로 바꾼다. 그러면 밀어내는 방향이 "아무 조건도 없는 상태에서 멀어지는 것"이 아니라 "$n$ 이 나타내는 방향에서 멀어지고 $c$ 가 나타내는 방향으로 가는 것"이 된다. 즉 CFG 의 원래 목적(무조건부에서 멀어지기)을 그대로 재활용해서, 비교 기준점만 "없음"에서 "원치 않는 것"으로 바꿔치기한 것이다.'},
 {h:'스케일 0·1의 함정', d:'$w=1$ 을 대입하면 $\\hat\\epsilon = \\epsilon_\\theta(x_t,n) + 1\\cdot(\\epsilon_\\theta(x_t,c)-\\epsilon_\\theta(x_t,n)) = \\epsilon_\\theta(x_t,c)$ 로 $n$ 항이 정확히 상쇄되어 사라진다 — negative prompt 를 아무리 채워도 결과는 순수 조건부 예측과 같아진다. $w=0$ 을 대입하면 $\\hat\\epsilon=\\epsilon_\\theta(x_t,n)$ 만 남아 이번엔 반대로 $c$(원하는 프롬프트) 항이 통째로 사라지고 negative prompt 조건만 남는다. 즉 $w=1$ 에서는 negative 항이 소거되고, $w=0$ 에서는 positive 항이 소거된다 — 어느 쪽이든 "밀어내는 효과"를 만드는 계수 $(w-1)$ 이 0이 되기 때문이다. negative prompt 가 실제로 작동하려면 $w$ 가 1에서 충분히 떨어진 값(보통 7~12 범위)이어야 한다.'},
 {h:'실무에서', d:'Stable Diffusion 계열 UI 의 guidance scale(흔히 CFG scale 이라 표기)은 관행적으로 7~12 사이를 쓰는데, 이 범위에서 negative prompt 가 뚜렷하게 작동한다. scale 을 지나치게 높이면(예: 20 이상) 대비가 과해져 이미지가 채도 과다·질감 뭉개짐 같은 부작용을 보이는 것으로 흔히 보고된다. negative prompt 는 한 번의 추론에서 조건부 예측을 두 번(또는 배치로 한 번) 계산해야 하므로 순수 무조건부 CFG 대비 추가 계산 비용은 거의 없다 — 어차피 무조건부 예측도 매 스텝 계산해야 했기 때문이다.'}
],

math:[
 {tex:'\\hat\\epsilon = \\epsilon_\\theta(x_t,\\varnothing) + w\\big(\\epsilon_\\theta(x_t,c)-\\epsilon_\\theta(x_t,\\varnothing)\\big)', expr:'기본 Classifier-Free Guidance', d:'$\\varnothing$ 은 조건 없음(null), $c$ 는 텍스트 조건, $w$ 는 guidance scale. $w>1$ 이면 조건 방향으로 더 세게 밀어낸다.'},
 {tex:'\\hat\\epsilon = \\epsilon_\\theta(x_t,n) + w\\big(\\epsilon_\\theta(x_t,c)-\\epsilon_\\theta(x_t,n)\\big)', expr:'negative prompt 를 쓴 guidance', d:'$\\varnothing$ 자리에 원치 않는 조건 $n$(negative prompt) 을 넣은 것. $w=1$ 이면 $n$ 항이 상쇄되어 사라지고, $w=0$ 이면 $c$ 항이 사라져 negative prompt 만 남는다 — 그래서 $w$ 가 1이나 0에 가까우면 negative prompt 의 효과가 없어진다.'}
],

diagram:{type:'compare', cap:'무조건부 자리를 무엇으로 채우는가.',
 left:{t:'기본 CFG', items:['비교 기준: 빈 조건 ∅','c 방향으로만 밀어냄']},
 right:{t:'negative prompt', items:['비교 기준: 원치 않는 조건 n','n 에서 멀어지고 c 로 다가감']}},

confuse:[
 {a:'negative prompt', b:'[guidance scale(CFG scale)](#/c/guidance)', d:'negative prompt 는 "무엇에서 멀어질지"를 정하는 조건이고, guidance scale 은 "얼마나 세게 멀어질지"를 정하는 계수다. 서로 다른 손잡이라 둘 다 조절해야 원하는 효과가 난다 — negative prompt 만 채우고 scale 이 1이면 아무 효과가 없다.'},
 {a:'negative prompt', b:'프롬프트에 "no ~", "without ~" 라고 쓰기', d:'긍정 프롬프트 안에 부정어를 넣는 것은 텍스트 인코더가 그 부정어를 제대로 반영하지 못하는 경우가 흔해(확산 모델의 텍스트 인코더는 부정을 다루도록 학습되지 않는 경우가 많다) 오히려 그 단어가 나타내는 대상이 그려지는 역효과가 자주 보고된다. negative prompt 칸은 별도의 조건부 예측 $\\epsilon_\\theta(x_t,n)$ 을 만들어 수식 차원에서 밀어내므로 원리가 다르다.'},
 {a:'negative prompt', b:'[repetition penalty](#/c/repetition-penalty)류 텍스트 디코딩 페널티', d:'둘 다 "원치 않는 것을 억제한다"는 목적은 비슷하지만 작동 공간이 다르다 — repetition penalty 는 언어모델의 logit 을 직접 깎는 이산 토큰 공간의 기법이고, negative prompt 는 확산 모델의 잡음 예측 벡터를 조건별로 비교해 방향을 바꾸는 연속 공간의 기법이다.'}
],

pitfalls:[
 'guidance scale 을 1에 가깝게 낮춰놓고 negative prompt 가 안 먹힌다고 여기는 경우가 있는데, 이는 버그가 아니라 $w=1$ 에서 negative 항이 수식적으로 정확히 상쇄되기 때문이다.',
 'negative prompt 를 지나치게 길고 포괄적으로("나쁜 것 전부") 채우면 밀어내는 방향이 뭉개져 이미지 품질을 오히려 떨어뜨릴 수 있다 — 구체적인 결함 키워드 위주로 쓰는 것이 낫다.',
 'positive 프롬프트 안에 부정어로 쓴 표현("no watermark")과 같은 단어를 negative prompt 칸에도 중복해서 넣으면 상쇄 효과가 아니라 단순 중복이라 기대한 만큼 세지지 않는다.',
 'guidance scale 을 과도하게 올리면 negative prompt 의 억제 효과도 같이 과도해져 이미지가 부자연스럽게 대비되거나 뭉개지는 부작용이 커진다.'
],

papers:['cfg','ldm'],
terms:['guidance','sampler-steps','repetition-penalty']
});
