WIKI.concept({
slug:'repetition-penalty',

tldr:'이미 등장한 토큰의 logit 을 깎아 같은 단어·구절 반복을 줄이는 디코딩 기법의 총칭으로, 실제로는 서로 다른 수식을 쓰는 세 가지(repetition/frequency/presence penalty)가 섞여 불린다.',

why:'API 문서에 `frequency_penalty`, `presence_penalty`, `repetition_penalty` 가 동시에 나오는데 셋의 수식을 모르면 "반복을 줄이려고 다 올렸더니 문장이 이상해졌다"는 상황을 디버깅할 수 없다. 셋은 로짓을 건드리는 방식이 근본적으로 달라서, 같은 값(예: 1.3)을 넣어도 전혀 다른 세기로 작동한다.',

sections:[
 {h:'세 벌의 서로 다른 수식', d:'repetition penalty(CTRL·많은 오픈소스 구현이 쓰는 방식)는 이미 등장한 토큰의 logit 을 **나눈다**: $z_i > 0$ 이면 $z_i/\\theta$, $z_i<0$ 이면 $z_i\\times\\theta$ 로 바꿔 값의 부호에 따라 다르게 작동한다. 반면 OpenAI 계열 API 의 frequency_penalty 와 presence_penalty 는 logit 에서 값을 **뺀다**: $z_i - \\alpha\\cdot c_i - \\beta\\cdot\\mathbb{1}[c_i>0]$ 형태다. 여기서 $c_i$ 는 지금까지 그 토큰이 등장한 횟수다.'},
 {h:'등장 횟수에 비례하는가', d:'frequency penalty 는 등장 횟수 $c_i$ 에 **비례**해서 깎는다 — 열 번 나온 단어는 한 번 나온 단어보다 열 배 더 깎인다. presence penalty 는 등장했는지 여부만 보는 **이진(0/1)** 페널티다 — 한 번이든 열 번이든 나온 적이 있으면 똑같이 한 번만 깎인다. repetition penalty(나눗셈형)는 등장 횟수를 아예 세지 않고 "등장했는가 안 했는가"만 반영하되, 나눗셈이라 logit 의 원래 크기에 비례해 효과가 달라진다는 점에서 또 다르다. 이 셋을 "반복 억제"라는 한 단어로 뭉뚱그리면 어떤 게 누적형이고 어떤 게 1회성인지 헷갈리기 쉽다.'},
 {h:'보통 쓰는 값', d:'repetition_penalty(나눗셈형)는 보통 1.0(효과 없음)~1.3 사이를 쓰는 것이 관행이다 — 1.0 이 "페널티 없음"이고, 값이 커질수록 억제가 강해진다. frequency_penalty·presence_penalty(뺄셈형, OpenAI 계열)는 보통 -2.0~2.0 범위를 받으며 0 이 "없음"이고 실무에서는 0.1~0.6 정도의 작은 양수로 시작하는 경우가 흔하다. 두 체계는 "0이 없음"이냐 "1이 없음"이냐부터 다르므로 API 를 바꿔 쓸 때 값을 그대로 복사하면 안 된다.'},
 {h:'과하게 걸면 생기는 일', d:'값을 너무 올리면 흔한 기능어(조사, "the", "그리고" 같은 것)까지 억제되어 문법이 깨지거나, 모델이 반복을 피하려고 점점 낯설고 부자연스러운 단어를 고르는 방향으로 밀려난다. 극단적으로 크면 이미 쓴 어휘를 아예 못 쓰게 만들어 문장이 뜬금없는 방향으로 새거나 반복은 사라지지만 의미가 통하지 않는 텍스트가 나온다. 코드 생성처럼 같은 토큰(`)`, `;`, 변수명)이 문법상 반복돼야 하는 작업에서는 repetition penalty 를 걸면 오히려 문법을 깨뜨리므로 끄거나 아주 약하게 쓰는 것이 관행이다.'},
 {h:'다른 손잡이와 함께 쓸 때', d:'세 페널티는 [temperature](#/c/temperature)·[top-k·top-p](#/c/top-k-top-p) 와 독립적으로 적용되고, 적용 순서는 보통 logit_bias·penalty 류를 먼저 logit 에 반영한 뒤 temperature 로 나누고 마지막에 top-k/top-p 로 후보를 자르는 순서를 따르는 구현이 흔하다. 순서가 바뀌면 같은 값을 넣어도 체감 강도가 달라질 수 있으므로, 여러 파라미터를 동시에 튜닝할 때는 하나씩 고정하고 나머지를 바꿔가며 확인하는 것이 안전하다. 예를 들어 temperature 를 낮게 고정한 채로는 repetition penalty 의 효과가 과장되어 보일 수 있는데, 낮은 temperature 자체가 이미 분포를 뾰족하게 만들어 페널티의 상대적 영향력을 키우기 때문이다.'}
],

math:[
 {tex:'z_i \\leftarrow \\begin{cases} z_i/\\theta & z_i>0\\\\ z_i\\times\\theta & z_i\\le 0\\end{cases}', expr:'repetition penalty (나눗셈형, CTRL)', d:'$\\theta>1$ 이 페널티 세기다. logit 이 양수면 나눠서 줄이고, 음수면 곱해서(절댓값을 키워) 더 음수로 만든다 — 부호를 바꾸지 않으면서 크기만 줄이려는 설계다.'},
 {tex:'z_i \\leftarrow z_i - \\alpha c_i - \\beta\\,\\mathbb{1}[c_i>0]', expr:'frequency + presence penalty (뺄셈형)', d:'$c_i$ 는 지금까지 생성된 텍스트에서 토큰 $i$ 가 등장한 횟수, $\\alpha$ 는 frequency_penalty, $\\beta$ 는 presence_penalty 계수다. $\\alpha$ 항은 등장 횟수에 비례해 계속 커지고, $\\beta$ 항은 한 번이라도 나오면 고정된 값만 깎는다.'}
],

diagram:{type:'compare', cap:'같은 목적, 다른 수식.',
 left:{t:'나눗셈형 (repetition)', items:['logit 을 θ로 나눔/곱함','횟수 무관, 부호만 봄','θ=1.0~1.3 관행']},
 right:{t:'뺄셈형 (freq/presence)', items:['logit 에서 α·c 또는 β 를 뺌','frequency 는 횟수 비례','presence 는 등장 여부 이진']}},

confuse:[
 {a:'frequency_penalty', b:'presence_penalty', d:'frequency 는 등장 횟수 $c_i$ 에 비례해 계속 깎이는 반면 presence 는 등장했는지(0/1)만 보고 딱 한 번 깎인다. "이미 나온 단어를 아예 다시 쓰지 못하게" 하고 싶으면 presence, "너무 자주 나오는 것만" 줄이고 싶으면 frequency 쪽을 올리는 게 맞다.'},
 {a:'repetition_penalty(나눗셈형)', b:'frequency/presence_penalty(뺄셈형)', d:'전자는 logit 을 나누거나 곱하고 후자는 logit 에서 값을 뺀다. 나눗셈형은 원래 logit 크기에 비례해 효과가 달라지고(큰 logit 일수록 절대량으로 더 많이 깎임), 뺄셈형은 logit 크기와 무관하게 고정폭으로 깎인다. 같은 "1.3"이라는 숫자도 어느 쪽 파라미터인지에 따라 전혀 다른 세기다.'},
 {a:'repetition penalty', b:'[temperature](#/c/temperature)', d:'temperature 는 전체 분포의 뾰족함을 조절하고 repetition penalty 는 이미 등장한 특정 토큰만 선택적으로 깎는다. 둘 다 softmax 전에 작동하지만 독립적인 손잡이라 같이 쓸 수 있다.'},
 {a:'repetition penalty', b:'no_repeat_ngram_size', d:'repetition penalty 는 확률을 낮출 뿐 완전히 막지는 않는 연속적인(soft) 억제고, no_repeat_ngram_size 는 특정 n-gram 이 이미 나왔으면 그 다음 토큰 후보를 아예 후보군에서 제거하는(hard) 규칙이다. 후자는 정당하게 반복해야 하는 표현(사람 이름, 코드 키워드)까지 강제로 막을 수 있어 더 위험하다.'}
],

pitfalls:[
 '값의 스케일이 API 마다 다르다는 것을 모르고 repetition_penalty=1.3 과 frequency_penalty=1.3 을 같은 세기로 착각하는 경우가 흔하다 — 후자는 훨씬 강한 값이다.',
 '코드·JSON·표처럼 같은 토큰의 반복이 문법적으로 필요한 출력에 반복 억제를 걸면 문법이 깨진다 — 자유 텍스트 생성에만 켜는 것이 안전하다.',
 '반복이 계속 나온다고 페널티만 올리면, 실제 원인(프롬프트 자체가 반복을 유도하거나 EOS 를 못 만나는 것)을 놓치고 증상만 억누르게 된다.',
 'greedy·낮은 temperature 조합에서는 반복 억제가 없으면 같은 문장이 무한 루프처럼 반복되기 쉬운데, 이를 temperature 문제로 착각해 temperature 만 올리는 경우가 있다 — 둘은 독립적인 원인이다.'
],

papers:['gpt2','ctrl'],
terms:['sampling','temperature','top-k-top-p']
});
