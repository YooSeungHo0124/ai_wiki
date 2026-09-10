WIKI.paper({
slug:'ctrl',
venue:'arXiv 2019 (Salesforce Research)',
authors:'Keskar, McCann et al. (Salesforce Research)',
arxiv:'1909.05858',

tldr:'문서 맨 앞에 도메인·스타일을 지정하는 **제어 코드(control code)** 토큰을 붙여 학습시킨 1.63B 언어모델. 생성 시 그 코드 하나로 문체·주제·태스크를 골라 쓸 수 있게 해, 프롬프트만으로는 불안정했던 생성 제어를 명시적인 손잡이로 바꿨다.',

context:'2019년 [GPT-2](#/p/gpt2) 는 사람 같은 글을 생성했지만, 원하는 스타일이나 주제로 유도하려면 프롬프트 문구를 이리저리 바꿔가며 시행착오를 거치는 수밖에 없었다. 같은 시기 [nucleus-sampling](#/p/nucleus-sampling) 이 지적했듯, 분포에서 샘플링하는 생성은 다양성을 주는 대신 정답이 명확한 경우(예: 사실 질의응답)에는 오히려 틀린 답을 낼 위험을 키운다. 이 논문은 "생성을 통제하고 싶다면 프롬프트를 다듬기보다, 애초에 학습 데이터에 이미 존재하는 구조(도메인·URL·서브레딧)를 명시적인 조건 변수로 만들어 학습시키자"는 방향을 택한다. 비지도 학습의 장점(라벨링 불필요)을 유지하면서 명시적 제어를 더하려는 시도다.',

ideas:[
 {h:'제어 코드: 원문 앞에 붙는 조건 토큰',
  lead:'문서 시작에 도메인 토큰 c를 붙여 학습해, 생성 시 그 토큰으로 스타일을 고정한다.',
  d:'일반 언어모델은 $p(x)$ 를 학습하지만 CTRL은 $p(x\\vert c)$ 를 학습한다. 여기서 $c$ 는 `Wikipedia`, `Reviews`, `r/keto` 같은 제어 코드로, 각 학습 시퀀스의 맨 앞에 프리펜드된다. 사람이 라벨을 새로 달 필요 없이, **Wikipedia·Project Gutenberg·서브레딧·뉴스·Amazon 리뷰처럼 수집한 텍스트에 이미 자연스럽게 따라오는 출처 구조**를 그대로 조건 변수로 재활용한 것이 핵심이다.'},
 {h:'URL을 제어 코드로 — 구조를 그대로 재사용',
  lead:'OpenWebText 문서 앞에 원본 URL을 그대로 붙여, 도메인·엔티티·날짜까지 URL 패턴으로 조건화한다.',
  d:'URL은 도메인·서브도메인·엔티티·날짜 등 풍부한 메타정보를 문자열 하나에 담고 있다. CTRL은 이를 그대로 학습에 사용해서, 추론 시에도 실제로 존재하지 않는 새 URL을 조건으로 주면 그 URL이 암시하는 스타일의 글을 생성한다. 또 서로 다른 도메인 코드를 조합하면(예: `r/keto` + 번역 코드) 학습 때 본 적 없는 조합도 어느 정도 그럴듯하게 섞인다(zero-shot code-mixing).'},
 {h:'태스크도 결국 하나의 제어 코드다',
  lead:'질의응답·번역 같은 태스크를 템플릿화된 제어 코드로 취급해 같은 모델 안에 욱여넣는다.',
  d:'`Translation`, `Question` 같은 코드는 프롬프트를 특정 템플릿에 맞춰 감싸는 역할을 하며, 질의응답용 데이터(SQuAD, TriviaQA 등)와 번역용 병렬 코퍼스를 다른 도메인 텍스트와 함께 같은 스트림에 섞어 학습시킨다. 모델 구조를 바꾸지 않고도 태스크별 동작을 유도할 수 있다는 점에서, 태스크와 스타일 제어를 같은 메커니즘으로 통일한 것이다.'},
 {h:'페널티 샘플링: 정확도가 중요할 땐 그리디에 반복 억제만 더한다',
  lead:'이미 나온 토큰의 점수를 θ≈1.2배 낮춰서, 그리디 생성의 정확성은 유지하면서 반복만 억제한다.',
  d:'Figure 1이 보여주듯, "호주의 수도는?"처럼 정답이 명확한 프롬프트에서 확률적 샘플링은 오히려 오답(멜버른·시드니)을 뽑을 위험이 있다. CTRL은 [nucleus-sampling](#/p/nucleus-sampling) 식의 분포 자르기 대신, 그리디 선택을 기본으로 하되 이미 생성된 토큰의 점수만 할인해 반복을 억제하는 **penalized sampling** 을 쓴다. 학습에는 관여하지 않는 순수 추론 시점 트릭이다.'},
 {h:'제어 코드 자체가 출처 귀속(source attribution) 도구가 된다',
  lead:'베이즈 정리로 $p(c|x)$ 를 뒤집어, 임의의 문장이 어느 학습 도메인에서 나왔을 법한지 순위를 매긴다.',
  d:'도메인 코드가 학습 데이터를 상호배타적 집합으로 나누므로, $p_\\theta(x\\vert c)$ 에 $c$ 에 대한 균등 사전분포를 곱해 $p_\\theta(c\\vert x)$ 를 계산하면 임의의 문장이 어떤 도메인의 말투와 가장 가까운지 순위를 매길 수 있다. 저자들은 이를 규범적 판단이 아니라 **"이 모델이 어떤 상관관계를 학습했는가"를 들여다보는 서술적 분석 도구**라고 명확히 선을 긋는다.'}
],

diagram:{type:'flow', cap:'학습 시퀀스 맨 앞의 제어 코드 하나가 이후 전체 시퀀스의 스타일을 조건화한다.',
 nodes:[
  {t:'제어 코드', s:'도메인 · 서브레딧 · URL', acc:true},
  {t:'원문 텍스트', s:'해당 도메인에서 수집'},
  {t:'Transformer', s:'48층 디코더 · d=1280'},
  {t:'다음 토큰 분포', s:'p(x|c)'}
 ]},

math:[
 {expr:'p(x|c) = Π_i p(xi | x<i, c),   L(D) = -Σ log p_θ(xi^k | x<i^k, c^k)',
  tex:'p(x\\mid c)=\\prod_{i=1}^{n} p(x_i\\mid x_{<i}, c) \\qquad \\mathcal{L}(D) = -\\sum_{k=1}^{|D|} \\log p_\\theta\\!\\left(x_i^{k}\\mid x_{<i}^{k}, c^{k}\\right)',
  d:'일반 언어모델링의 체인룰 분해에 제어 코드 $c$ 를 조건으로 추가한 것이 전부다. 구조 변경 없이 조건화만 더했다.'},
 {expr:'p_i = exp(x_i/(T·I(i∈g))) / Σ_j exp(x_j/(T·I(j∈g))),  I(c)=θ if True else 1',
  tex:"p_i = \\frac{\\exp\\!\\big(x_i/(T\\cdot I(i\\in g))\\big)}{\\sum_j \\exp\\!\\big(x_j/(T\\cdot I(j\\in g))\\big)}, \\quad I(c)=\\begin{cases}\\theta & c\\text{ true}\\\\ 1 & \\text{else}\\end{cases}",
  d:'이미 생성된 토큰 집합 $g$ 에 속하는 후보의 온도를 $\\theta$ 배로 낮춰(할인) 반복을 억제하는 penalized sampling. $\\theta\\approx1.2$, $T\\to0$(그리디)와 함께 쓴다.'},
 {expr:'p_θ(c|x) ∝ p_θ(x|c) p(c)',
  tex:'p_\\theta(c\\mid x) \\propto p_\\theta(x\\mid c)\\,p(c)',
  d:'베이즈 정리로 조건부를 뒤집어, 주어진 문장 $x$ 가 어느 도메인 $c$ 에서 나왔을 가능성이 큰지 순위를 매긴다(source attribution). $p(c)$ 는 도메인 크기 편향을 피하려 균등분포를 사용.'}
],

numbers:[
 {k:'파라미터 수', v:'1.63B', d:'논문 시점 "공개된 언어모델 중 최대"라고 주장'},
 {k:'학습 데이터', v:'140GB', d:'전체 수집량 180GB 중 필터링 후 사용'},
 {k:'구조', v:'48층 · d=1280 · head 16 · FFN 8192', d:'Transformer 디코더(causal mask)'},
 {k:'어휘 크기', v:'약 250K BPE', d:'비교 대상보다 약 4배 큰 어휘로 평균 토큰 수를 줄임'},
 {k:'학습 규모', v:'배치 1024 · TPU v3 Pod 256코어 · 80만 스텝', d:'약 2주 학습, Adagrad 사용'},
 {k:'페널티 샘플링', v:'θ≈1.2', d:'그리디 + 반복 토큰 점수 할인의 균형점'}
],

impact:'CTRL은 "프롬프트 엔지니어링"이 아니라 "학습 시점에 조건 변수를 명시적으로 박아 넣는다"는 대안 경로를 보여줬다. 하지만 이 접근은 오래 주류가 되지 못했다 — 제어 코드는 **사전에 정의된 유한한 어휘**(도메인 이름, URL 패턴)로만 스타일을 지정할 수 있는 반면, 이후 [InstructGPT](#/p/instructgpt) 류의 **지시학습(instruction tuning)** 은 자연어 문장 자체로 임의의 의도를 표현하게 해 훨씬 유연했다. 결과적으로 CTRL의 "고정 코드 어휘로 스타일 선택" 패러다임은 "자연어로 무엇이든 지시" 패러다임에 자리를 내줬고, 지금 남은 것은 주로 출처 귀속 아이디어와 페널티 샘플링 같은 부속 기법들이다.',

legacy:[
 '**제어 코드 패러다임은 지시학습에 자리를 내줌** — 고정 어휘 코드 대신 자연어 지시문으로 원하는 행동을 기술하는 [InstructGPT](#/p/instructgpt) 이후의 흐름이 훨씬 유연해 주류가 됨',
 '**반복 억제 아이디어의 확산** — 이미 나온 토큰을 할인하는 penalized sampling 은 이후 여러 디코딩 구현의 `repetition_penalty` 파라미터로 흔적이 남음',
 '**출처 귀속(source attribution)** 문제의식은 이후 데이터 계보·저작권 논쟁에서 재등장하는 초기 사례',
 '**"메타데이터를 조건으로 재활용"이라는 발상** — 순수 텍스트만이 아니라 URL·서브레딧 같은 부수 정보를 학습 신호로 쓰는 접근은 이후 데이터 큐레이션 연구에 영향'
],

pitfalls:[
 '**제어 코드는 자연어 지시가 아니다.** `Reviews Rating: 1.0` 같은 고정 템플릿 코드이지, "부정적인 리뷰를 써줘" 같은 임의의 자연어 명령을 받아들이는 것이 아니다. 이 논문을 InstructGPT류 지시학습의 직접 조상으로 오해하기 쉽지만, 제어의 표현력 자체가 다르다.',
 '**source attribution은 사실 검증 도구가 아니다.** 논문이 명시하듯 이 방법은 "이 문장이 어느 도메인 말투와 비슷한가"를 보여줄 뿐, 그 문장이 참인지 거짓인지는 전혀 판단하지 않는다. 상반된 주장이 같은 서브레딧에 함께 귀속되는 사례가 실제로 보고됐다.',
 '**penalized sampling과 [nucleus-sampling](#/p/nucleus-sampling)의 top-p는 다른 문제를 푼다.** 전자는 그리디 기반에 반복만 억제하는 후처리이고, 후자는 분포 자체의 신뢰 가능한 꼬리를 동적으로 잘라내는 방법이다. 둘 다 "더 나은 디코딩"을 다루지만 서로 대체재가 아니라 다른 트레이드오프를 가진 별개 기법이다.'
],

figures:[
 {f:'fig1-sampling-risk.png',
  cap:'"호주의 수도는?" 질문 다음 토큰 확률 분포(왼쪽)와 "달에 처음 간 사람은?"(오른쪽). 정답(Canberra, Neil)이 최고 확률이지만 1위가 아닌 경우도 있어, 분포에서 그대로 샘플링하면 오답이 나올 위험이 실제로 존재함을 보여준다 — 이것이 CTRL이 정답이 중요한 상황엔 그리디+반복억제를 쓰는 이유다.',
  src:'원문 Figure 1, p.5'}
],

quotes:[
 {t:'We release CTRL, a 1.63 billion-parameter conditional transformer language model, trained to condition on control codes that govern style, content, and task-specific behavior.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1909.05858 — CTRL: A Conditional Transformer Language Model for Controllable Generation', u:'https://arxiv.org/abs/1909.05858'},
 {t:'GitHub — salesforce/ctrl', u:'https://github.com/salesforce/ctrl'}
]
});
