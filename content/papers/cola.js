WIKI.paper({
slug:'cola',
venue:'arXiv 2018 (TACL 2019 게재)',
authors:'Warstadt, Singh, Bowman (New York University)',
arxiv:'1805.12471',

tldr:'문장이 "문법적으로 말이 되는가(acceptability)"를 이진 분류하는 과제와 데이터셋 CoLA를 소개한 논문. 의미 이해가 아니라 **문법 지식 그 자체**를 측정하려 했고, 이 과제는 곧 [GLUE](#/p/glue) 9개 과제 중 하나로 편입되었다.',

context:'2018년 무렵 NLU 벤치마크는 대부분 감정분류·함의·유사도처럼 "의미"를 다뤘다. 하지만 이런 과제에서 높은 점수를 받았다고 해서 모델이 문법을 안다는 뜻은 아니다 — 표면적인 어휘 단서만으로도 점수를 딸 수 있기 때문이다. 언어학에서는 오래전부터 문장의 **acceptability**(원어민이 자연스럽다고 느끼는가)를 통해 문법 지식을 검증해 왔다(Chomsky, 1957). 저자들은 이 방법론을 신경망에 그대로 적용하기로 했다 — 언어학 논문들이 이미 예시로 든 문법적/비문법적 문장 쌍을 모아, 신경망이 사람처럼 "이 문장은 이상하다"를 판정할 수 있는지 본 것이다.',

ideas:[
 {h:'언어학 문헌 자체를 데이터로 재활용',
  lead:'문법책·논문 속 예시 문장 10,657개를 그대로 긁어 이진 라벨을 붙였다.',
  d:'비문법적 문장은 자연 발화에서 거의 나오지 않아 수집이 어렵다. 저자들은 이를 새로 만들지 않고, 통사론 교과서·논문 23종에서 저자가 이미 문법성 판정을 달아 둔 예시 문장을 그대로 수집했다. 언어학자가 특정 구문 하나를 부각하려고 만든 문장이라 **군더더기 없이 한 가지 문법 현상만 담고 있다**는 것이 장점이다.'},
 {h:'문법성과 수용성을 분리하되 좁게 정의',
  lead:'의미 이상·화용 이상·조어 규칙 위반은 과제에서 제외해 순수 문법 판단만 남긴다.',
  d:'문법성(grammaticality)은 이론이 정하는 것이고 수용성(acceptability)은 원어민의 직관적 판단이다. CoLA는 도덕률처럼 배우는 규범 규칙, 실재하지 않는 의미를 요구하는 예문, 화용적으로만 어색한 문장, 신조어 형태소 등 네 범주를 제외했다(Table 1). 남은 것은 형태·통사·의미 결합의 위반뿐이라 **모델이 무엇을 틀렸는지 해석하기 쉽다**.'},
 {h:'평가지표로 정확도 대신 MCC를 쓴다',
  lead:'클래스 불균형(70.5%가 acceptable)에서 accuracy·F1은 다수 클래스로 치우친 모델을 과대평가한다.',
  d:'CoLA는 전체 문장의 70.5%가 acceptable이라 무조건 "acceptable"만 찍어도 정확도가 높게 나온다. 저자들은 Matthews Correlation Coefficient(MCC)를 채택했는데, 이는 두 이진 분포의 상관계수라서 무관한 두 분포는 항상 0에 수렴하고 다수 클래스 편향에 영향받지 않는다. 이 선택은 이후 [GLUE](#/p/glue)가 CoLA를 채점하는 방식 그대로 남았다.'},
 {h:'ELMo 스타일 표현 + real/fake 사전학습으로 최고 성능',
  lead:'양방향 [LSTM](#/p/lstm) 인코더를 진짜/가짜 문장 판별로 먼저 학습시킨 뒤 CoLA로 전이한다.',
  d:'가장 좋은 모델은 문장 인코더를 CoLA로 직접 학습하지 않는다. 대신 BNC 실제 문장과, LSTM LM이 생성했거나 단어를 뒤섞어 만든 "가짜" 문장을 구분하는 real/fake 과제로 먼저 인코더를 학습시키고, 그 위에 가벼운 분류기만 CoLA로 얹는다. 라벨 있는 데이터(CoLA)가 1만 문장뿐인 저자원 상황에서 대량의 비지도 신호로 문법 지식을 먼저 흡수시키는 전략이다.'},
 {h:'현상별 진단 세트로 "무엇을 못 배우는가"를 콕 집는다',
  lead:'주어-동사 일치·wh-추출 등 5개 인공 테스트셋으로 특정 문법 현상만 따로 측정한다.',
  d:'CoLA 전체 점수만으로는 모델이 어순은 배웠는데 장거리 의존은 못 배웠는지 알 수 없다. 그래서 주어-동사-목적어 어순, wh-이동, 사동-기동 교대, 주어-동사 수 일치, 재귀대명사 호응이라는 5개의 통제된 인공 데이터셋을 따로 만들어 같은 모델을 채점했다. 결과는 극명하게 갈렸다 — 어순은 거의 완벽히 배우지만 재귀대명사 호응과 수 일치는 사람 수준에 한참 못 미쳤다.'}
],

diagram:{type:'stack', cap:'풀링 분류기 구조. 문장을 고정 길이 벡터로 압축한 뒤 그 위에 가벼운 분류기 하나만 얹는다.',
 layers:[
  {t:'단어 임베딩', s:'w1…wn'},
  {t:'양방향 LSTM', s:'정방향 f · 역방향 b', acc:true, note:'문맥 정보 압축'},
  {t:'Max-pooling', s:'시퀀스 → 고정 벡터', note:'문장 임베딩 생성'},
  {t:'Sigmoid 분류기', s:'(0,1) 확률', note:'문법적/비문법적'}
 ]},

math:[
 {expr:'MCC = (TP·TN − FP·FN) / sqrt((TP+FP)(TP+FN)(TN+FP)(TN+FN))',
  tex:'\\text{MCC}=\\frac{TP\\cdot TN-FP\\cdot FN}{\\sqrt{(TP+FP)(TP+FN)(TN+FP)(TN+FN)}}',
  d:'이진 분류의 상관계수. 값은 -1(완전 불일치)부터 1(완전 일치) 사이이며, 무작위 추측은 클래스 비율과 무관하게 기댓값 0이 된다. CoLA와 이후 [GLUE](#/p/glue)의 공식 채점 지표다.'},
 {expr:'WordLPMin1(s) = min{ -log pLM(w) / log pu(w) : w ∈ s }',
  tex:'\\text{WordLP\\_Min1}(s)=\\min_{w\\in s}\\left\\{-\\frac{\\log p_{LM}(w)}{\\log p_u(w)}\\right\\}',
  d:'비교 대상인 Lau et al. (2016)의 비지도 채점식. 언어모델 확률 $p_{LM}$ 을 유니그램 확률 $p_u$ 로 정규화해, 문장 중 가장 "놀라운" 단어 하나의 점수로 전체 문장을 대표시킨다. 라벨 없이 임계값만 교차검증으로 맞춘다.'}
],

numbers:[
 {k:'CoLA 문장 수', v:'10,657', d:'23개 언어학 출처에서 수집. 이런 종류의 데이터셋 중 최대 규모라고 주장'},
 {k:'in-domain 분할', v:'8,551 / 527 / 530', d:'train / dev / test. 같은 17개 출처에서 추출'},
 {k:'acceptable 비율', v:'70.5%', d:'클래스 불균형 때문에 accuracy 대신 MCC를 쓰는 이유'},
 {k:'최고 모델 MCC (in-domain)', v:'0.341', d:'ELMo식 임베딩 + real/fake 인코더 + CoLA 분류기, 저자 최고 성능'},
 {k:'사람 평균 MCC', v:'0.697', d:'언어학 박사 5명의 판정, CoLA 라벨과 비교. 모델과 사람 사이에 여전히 큰 격차'},
 {k:'LSTM LM 퍼플렉서티', v:'56.1', d:'BNC(1억 토큰) 학습 기준, 모든 후속 실험에 재사용되는 기반 LM'}
],

impact:'CoLA는 "이 모델이 문장을 이해하는가"를 "문법적으로 옳은가"라는 좁고 검증 가능한 질문으로 바꿔 놓았다. 곧이어 [GLUE](#/p/glue) 벤치마크의 9개 과제 중 하나로 채택되면서, 이후 등장한 거의 모든 사전학습 언어모델([BERT](#/p/bert) 포함)이 CoLA MCC 점수를 성능표에 올리게 되었다. 문법성이라는 좁은 축을 하나 넣음으로써 GLUE 리더보드가 의미 과제로만 채워지는 것을 막았고, 모델이 순수 통사 지식을 얼마나 흡수하는지를 별도로 추적할 수 있게 했다.',

legacy:[
 '**[GLUE](#/p/glue) 9개 과제 중 하나로 편입** — 이후 모든 언어모델 벤치마킹 관행에 CoLA MCC가 표준 항목으로 들어갔다',
 '**진단 세트 방법론의 원형** — 특정 문법 현상만 통제해 떼어 보는 방식이 이후 BLiMP 등 더 큰 규모의 언어학 기반 평가셋으로 확장됐다',
 '**"attention/확률이 곧 문법 지식은 아니다"라는 회의론의 출발점** — CoLA에서 드러난 사람-모델 격차는 이후 언어모델의 통사 능력을 둘러싼 논쟁에 계속 인용됐다',
 '**[ELMo](#/p/elmo)식 문맥 표현의 실용성 입증** — 저자원 문법 과제에서도 문맥화 임베딩이 고정 임베딩보다 뚜렷이 낫다는 사례를 하나 더 추가했다'
],

pitfalls:[
 '**"acceptability = grammaticality"가 아니다.** 논문 스스로 이 둘을 구분한다 — CoLA는 화용적 어색함·불가능한 의미·규범 규칙 위반을 의도적으로 제외해, 순수하게 통사·형태·의미 결합 위반만 남긴 좁은 정의를 쓴다.',
 '**out-of-domain 성능 하락을 "일반화 실패"로 단순화하면 안 된다.** 논문은 여러 분할 실험(Table 5)에서 이 하락 폭이 특정 출처의 특성에 크게 좌우된다는 것을 보였다 — 항상 같은 크기로 나타나는 안정적 현상이 아니다.',
 '**높은 CoLA 점수가 문법 전반의 숙달을 뜻하지 않는다.** 저자들의 진단 세트 실험에서 어순은 거의 완벽했지만 재귀대명사 호응·wh-추출 같은 장거리 의존은 사람 수준에 크게 못 미쳐, 현상별 편차가 크다.'
],

figures:[
 {f:'fig2-pooling-classifier.png',
  cap:'네 단어(Jones/buttered/the/toast)의 임베딩 wᵢ가 정방향 LSTM(fᵢ)과 역방향 LSTM(bᵢ)을 통과해 각 위치에서 concat되고, 그 위에서 max-pooling으로 하나의 sentence embedding을 뽑는다. 이 벡터가 classifier를 지나 (0,1) 확률 하나로 나온다.',
  src:'원문 Figure 2, p.7'},
 {f:'fig1-phenomena.png',
  cap:'dev set 문장에 나타난 8개 문법 현상의 비율. x축은 Simple(단순 구조)부터 Violations(형태/의미 위반)까지 8개 범주, y축은 그 현상을 포함한 문장의 비율(%). Argument alternation(논항 교대)이 40% 이상으로 가장 흔하고, Simple이 가장 드물어 CoLA가 복잡한 구문 쪽으로 치우쳐 있음을 보여준다.',
  src:'원문 Figure 1, p.5'}
],

quotes:[
 {t:'This paper investigates the ability of artificial neural networks to judge the grammatical acceptability of a sentence, with the goal of testing their linguistic competence.',
  src:'Abstract, p.1'},
 {t:'We find that our models do not show evidence of learning non-local dependencies related to agreement and questions, but do appear to acquire knowledge about basic subject-verb-object word order and verbal argument structure.',
  src:'Abstract/Introduction, p.1'}
],

links:[
 {t:'arXiv 1805.12471 — Neural Network Acceptability Judgments', u:'https://arxiv.org/abs/1805.12471'},
 {t:'CoLA 데이터셋 홈페이지 (NYU MLL)', u:'https://nyu-mll.github.io/CoLA/'},
 {t:'GLUE Benchmark', u:'https://gluebenchmark.com/tasks'}
]
});
