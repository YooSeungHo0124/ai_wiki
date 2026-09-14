WIKI.concept({
slug:'ffn',

tldr:'Transformer 블록마다 attention 뒤에 오는 position-wise 2층 MLP로, 중간 차원을 보통 4배로 넓혔다가 되돌리며 각 토큰을 독립적으로 변환한다.',

why:'FFN은 [Transformer](#/p/transformer) 전체 파라미터의 약 3분의 2를 차지하는 가장 큰 단일 구성 요소인데도, "attention이 전부"라는 인상 때문에 실무에서 가장 과소평가된다. 파라미터 예산·추론 비용·[MoE](#/c/moe) 설계 판단이 전부 이 자리에서 갈린다.',

sections:[
 {h:'숫자로 보는 비중', d:'hidden size를 $d$, FFN 중간 차원을 $4d$라 하면 FFN 파라미터는 두 개의 $d\\times 4d$ 행렬, 즉 $8d^2$개다. attention 쪽은 $Q,K,V,O$ 네 개의 $d\\times d$ 투영으로 $4d^2$개다. 둘을 더하면 블록당 $12d^2$이고 그중 FFN이 $8/12 \\approx 67\\%$ — "약 3분의 2가 FFN에 있다"는 말은 비유가 아니라 이 계산에서 바로 나온다. $d$가 커질수록(모델이 커질수록) 이 비율은 그대로 유지되므로, 모델을 키울 때 늘어나는 파라미터의 대부분은 FFN 몫이다.'},
 {h:'구조와 역할', d:'FFN은 $x\\to \\sigma(xW_1+b_1)W_2+b_2$ 형태의 2층 MLP를 시퀀스의 **각 위치에 독립적으로** 적용한다 — 위치 간 정보 교환은 없다(그 일은 attention이 이미 끝냈다). [multi-head](#/c/multi-head) attention이 "토큰들 사이에서 정보를 섞는" sub-layer라면, FFN은 섞인 결과를 위치마다 "가공·저장"하는 sub-layer다. FFN을 학습된 key-value 메모리로 보는 해석에서는 $W_1$의 각 행이 특정 입력 패턴을 감지하는 key, $W_2$의 각 행이 그에 대응해 더해줄 value로 기능한다고 본다 — 실제로 사실 지식(factual knowledge)의 상당 부분이 특정 FFN 뉴런에 국소화돼 저장된다는 해석 연구 결과가 있다.'},
 {h:'왜 4배 폭인가', d:'4라는 배율은 원 논문의 경험적 선택이었고 이후 대부분의 모델이 그대로 따랐다 — 이론적으로 유도된 최적값이 아니라 관행이다. 직관적으로는, $d$차원으로 압축된 표현을 그대로 비선형 변환하면 표현할 수 있는 함수 공간이 좁으니, 일단 더 넓은 공간($4d$)으로 투영해 비선형 활성을 통과시킨 뒤 다시 $d$차원으로 되돌려 "이 층에서만 쓸 임시 작업 공간"을 넉넉히 준다는 것. 활성 함수도 원 논문의 ReLU에서 GELU·SwiGLU 등으로 바뀌면서, 배율을 4보다 살짝 줄여 전체 파라미터 수를 맞추는 모델도 있다(GLU 계열은 게이트용 행렬이 하나 더 필요해서 그만큼 폭을 줄인다).'},
 {h:'SwiGLU의 변화', d:'기본 FFN은 $W_1$ 하나로 값을 만들고 $\\sigma$로 비선형을 준다. GLU(Gated Linear Unit) 계열 변형은 $W_1$과 별도의 게이트 행렬 $V$를 각각 통과시킨 뒤 하나를 활성화해 다른 하나에 곱한다 — SwiGLU는 그 활성 함수로 SiLU(Swish)를 쓴 버전이다. 바뀌는 것은 "얼마나 통과시킬지"를 입력 자체가 위치별·차원별로 조절할 수 있게 된다는 점(곱셈적 게이팅)이고, 그 대가로 행렬이 하나 더 필요해 같은 파라미터 예산에서는 중간 차원을 줄여 맞춘다. LLaMA·PaLM 등 최근 대형 LLM 대부분이 SwiGLU를 기본값으로 쓴다.'},
 {h:'MoE가 쪼개는 자리', d:'FFN이 파라미터의 다수를 차지하고 위치마다 독립적으로 적용된다는 성질 때문에, [MoE](#/c/moe)는 정확히 이 FFN sub-layer 하나를 여러 개의 "전문가(expert)" FFN으로 복제하고 라우터가 토큰마다 그중 몇 개만 골라 계산하게 만든다. attention sub-layer는 그대로 공유하고 FFN만 쪼개는 이유는, FFN이 위치별 독립 변환이라 토큰마다 다른 전문가를 태워도 구조적으로 자연스럽기 때문이다 — 총 파라미터는 늘리되 토큰당 실제 계산량(활성 파라미터)은 거의 그대로 유지하는 스케일링 전략이 여기서 나온다.'}
],

math:[
 {tex:'\\text{FFN}(x)=\\sigma(xW_1+b_1)W_2+b_2,\\qquad W_1\\in\\mathbb{R}^{d\\times 4d},\\ W_2\\in\\mathbb{R}^{4d\\times d}',
  expr:'표준 FFN', d:'$x\\in\\mathbb{R}^d$는 한 토큰의 표현, $\\sigma$는 비선형 활성(ReLU/GELU). 파라미터 수는 $W_1,W_2$ 합쳐 $8d^2$개(bias 제외) — attention의 $4d^2$보다 크다.'},
 {tex:'\\text{SwiGLU}(x)=\\big(\\text{SiLU}(xW_1)\\odot xV\\big)W_2',
  expr:'SwiGLU 변형', d:'$W_1,V\\in\\mathbb{R}^{d\\times d_{ff}}$는 각각 값·게이트 투영, $\\odot$는 원소별 곱. 행렬이 세 개($W_1,V,W_2$)로 늘어난 만큼 같은 파라미터 예산에서는 $d_{ff}$를 $4d$보다 작게(흔히 $\\tfrac{8}{3}d$ 근처) 잡아 맞춘다.'}
],

diagram:{type:'flow', cap:'FFN 한 sub-layer: 확장 → 비선형 → 축소, 위치마다 독립.',
 nodes:[
  {t:'x', s:'토큰당 d차원'},
  {t:'×W1', s:'d→4d 확장'},
  {t:'σ', s:'비선형'},
  {t:'×W2', s:'4d→d 축소'},
  {t:'출력', s:'+잔차'}
 ]},

code:{lang:'python', d:'표준 FFN과 SwiGLU FFN의 forward 비교 — 행렬이 두 개냐 세 개냐가 핵심 차이다.',
 src:`# 표준 FFN (원 Transformer, d_ff = 4*d)
def ffn(x, W1, W2):
    return relu(x @ W1) @ W2

# SwiGLU FFN (같은 파라미터 예산이면 d_ff는 더 작게)
def swiglu_ffn(x, W1, V, W2):
    gate = silu(x @ W1)      # 게이트 경로
    value = x @ V            # 값 경로
    return (gate * value) @ W2`},

confuse:[
 {a:'FFN', b:'attention', d:'attention은 시퀀스 차원으로 작동해 토큰들 사이에서 정보를 섞는다(가중치가 입력에 따라 매번 달라지는 동적 연산). FFN은 위치 차원으로는 섞지 않고 같은 가중치를 모든 위치에 독립적으로 적용하는 정적 변환이다.'},
 {a:'FFN 확장 배율(4배)', b:'MoE 전문가 수', d:'4배는 전문가 하나(FFN 하나) 안의 중간 차원 배율이고, 전문가 수는 그 FFN을 몇 벌 복제해 라우터로 나눠 쓸지의 문제다. 둘은 독립적인 설계 축이다 — 전문가 수를 늘려도 전문가 하나의 4배 확장 자체는 그대로인 경우가 많다.'},
 {a:'GELU/ReLU 활성', b:'GLU/SwiGLU 게이팅', d:'전자는 단일 경로에 비선형을 씌우는 활성 함수 선택 문제다. 후자는 아예 두 번째 선형 경로(게이트)를 추가해 곱셈적으로 값을 조절하는 구조 변경이다 — 활성 함수를 무엇으로 쓰든 GLU 구조 자체가 별도의 설계 결정이다.'}
],

pitfalls:[
 '"attention이 Transformer의 핵심이니 파라미터도 대부분 거기 있을 것"이라 가정하면 틀린다 — 실제로는 FFN이 블록 파라미터의 약 3분의 2를 차지한다.',
 'FFN의 4배 확장을 이론적 필연으로 여기면 안 된다. 경험적 관행이며, SwiGLU처럼 구조가 바뀌면 배율도 함께 조정된다.',
 'MoE를 "attention까지 포함해 전부 복제하는 것"으로 오해하기 쉽다. 실제로는 대개 FFN sub-layer만 여러 전문가로 쪼개고 attention은 공유한다.'
],

papers:['transformer','switch','glu-variants'],
terms:['transformer-block','self-attention','moe']
});
