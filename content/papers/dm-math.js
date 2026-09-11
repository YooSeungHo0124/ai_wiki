WIKI.paper({
slug:'dm-math',
venue:'ICLR 2019',
authors:'Saxton, Grefenstette, Hill, Kohli (DeepMind)',
arxiv:'1904.01557',

tldr:'수학 문제를 프로그램으로 **절차적으로 생성**해 신경망의 추론 능력을 재는 대규모 데이터셋. 같은 종류의 문제를 새 숫자로 무한히 만들 수 있고, 훈련 분포보다 어려운 문제로 짜인 별도의 **외삽(extrapolation) 테스트**를 둬서 모델이 진짜 규칙을 배웠는지 암기했는지를 갈라본다.',

context:'2019년 시점 신경망은 패턴 매칭에는 강했지만 사람이 자연스럽게 하는 **이산적·조합적 추론**(algebraic generalization)에는 계속 취약했다. 기존 수학 QA 데이터셋은 규모가 작거나 문제 유형이 한정적이어서, 모델이 어디서 왜 실패하는지 세밀하게 분석하기 어려웠다. 저자들은 수학이 **자기완결적이고 표기가 일관된 영역**이라는 점에 착안해, 문제 유형·난이도·구성(composition)을 자유롭게 통제할 수 있는 절차적 생성기를 만들면 모델의 실패 지점을 정밀하게 드러낼 수 있다고 봤다.',

ideas:[
 {h:'모듈 기반 절차적 문제 생성',
  lead:'대수·산술·확률·미적분 등 여러 "모듈"이 서로의 출력을 입력으로 받아 새 문제를 무한히 합성한다.',
  d:'각 모듈은 특정 유형의 문제(예: 1·2변수 선형방정식 풀기, 다항식 전개, 수 나열에서 항 찾기)를 프로그램으로 생성한다. 모듈끼리 타입이 맞으면 연쇄적으로 결합할 수 있어("함수 합성 후 미분하라" 같은 식), 같은 하위 능력을 여러 문제 유형에 걸쳐 반복 요구하는 구성이 가능하다.'},
 {h:'보간(interpolation)과 외삽(extrapolation) 테스트를 분리',
  lead:'훈련 분포와 같은 난이도의 보간 테스트 외에, 더 크거나 더 복잡한 문제로 짠 외삽 테스트를 따로 둔다.',
  d:'모듈마다 $2\\times10^6$개의 훈련 문제와 $10^5$개의 보간 테스트 문제를 생성해, 훈련에서 못 본 정확히 같은 문제는 없지만 **같은 분포**의 문제로 얼마나 잘하는지를 본다. 이와 별도로 더 많은 항의 개수, 더 큰 수, 더 깊은 합성 등 훈련 분포 바깥으로 확장한 외삽 테스트를 둬서, 규칙을 배웠는지 표면적 패턴을 배웠는지를 가른다.'},
 {h:'자유 형식 텍스트 입출력으로 채점을 단순화',
  lead:'문제와 답을 모두 문자 시퀀스로 다뤄 어떤 sequence-to-sequence 모델도 그대로 붙일 수 있게 한다.',
  d:'질문도 답도 순수 텍스트("What is g(h(f(x)))…" → "-70x - 165")이므로 객관식이나 구조화된 출력 형식 없이 문자 단위로 생성·채점한다. 이는 모델이 구문 분석부터 계산까지 전 과정을 스스로 해내야 한다는 뜻이다.'},
 {h:'Transformer와 LSTM 계열을 같은 조건에서 직접 비교',
  lead:'비슷한 파라미터 수의 Simple LSTM·Attentional LSTM·Attentional RMC·Transformer를 나란히 채점한다.',
  d:'모든 모델이 비슷한 규모(18M~39M 파라미터)로 맞춰졌고, [Transformer](#/p/transformer)의 self-attention 인코더와 attentional [LSTM](#/p/lstm)의 encoder-decoder attention을 같은 문제셋으로 비교했다. 결과는 아키텍처 자체가 수학 문제 유형별 강약에 뚜렷한 차이를 만든다는 것을 보였다.'}
],

diagram:{type:'compare', cap:'같은 문제(사칙연산+숫자 나열)를 처리하는 Attentional LSTM과 Transformer의 인코더-디코더 구조 차이.',
 left:{t:'Attentional LSTM', items:['질문을 순환 인코더로 (key,value) 시퀀스화','디코더가 매 스텝 attention으로 조회','정보가 순차적으로만 전달']},
 right:{t:'Transformer', items:['self-attention으로 질문 전체를 동시에 참조','병렬 처리로 다항식 등 다중 계수 조작에 강함','보간 정확도 0.76로 LSTM류를 크게 앞섬']}
},

numbers:[
 {k:'모듈당 훈련 문제 수', v:'2×10⁶개', d:'모듈별로 생성, 다양성을 위해 훈련·테스트 문제가 겹치지 않게 함'},
 {k:'모듈당 보간 테스트', v:'10⁵개', d:'훈련과 같은 분포의 새 문제'},
 {k:'Transformer 정확도', v:'보간 0.76 · 외삽 0.50', d:'전체 모듈 평균, 30M 파라미터'},
 {k:'Simple LSTM 정확도', v:'보간 0.57 · 외삽 0.41', d:'18M 파라미터'},
 {k:'Attentional LSTM(양방향 인코더)', v:'보간 0.58 · 외삽 0.42', d:'26M 파라미터, Transformer보다 크게 낮음'},
 {k:'혼합 산술식 정확도', v:'약 50%', d:'괄호 포함 사칙연산 혼합 — 덧셈/뺄셈 단독(90%+)보다 크게 낮음, 중간값 계산이 필요한 문제의 약점'}
],

impact:'"신경망이 수학을 푼다"는 주장을 세부 능력 단위로 쪼개 검증하는 방법론을 제시했다. 보간/외삽을 나눈 설계는 이후 조합적 일반화(compositional generalization) 벤치마크 전반에 영향을 줬고, 혼합 산술식·다항식 조작에서 드러난 약점(중간값을 유지해야 하는 문제에서 급격히 성능이 떨어짐)은 이후 사고 과정을 명시적으로 출력시키는 [Chain-of-Thought](#/p/cot) 계열 연구의 동기 중 하나가 됐다. 데이터셋 자체는 [GSM8K](#/p/gsm8k) 이전 시기의 대표적인 "생성기 기반 수학 벤치마크"로 남아 있다.',

legacy:[
 '보간/외삽 분할 설계가 이후 조합적 일반화·체계적 일반화(systematic generalization) 벤치마크의 표준 패턴이 됨',
 '"중간값을 명시적으로 계산해야 하는 문제에서 신경망이 급격히 약해진다"는 관찰이 이후 [Chain-of-Thought](#/p/cot) 류의 동기로 재등장',
 'GSM8K·MATH 등 후속 대규모 수학 추론 벤치마크가 등장하며 이 데이터셋은 초기 이정표로 자리매김',
 '절차적 생성기 기반 데이터셋 설계가 이후 알고리즘적 추론 평가(예: 리스트 연산, 프로그램 실행 예측)에도 재사용됨'
],

pitfalls:[
 '**"Transformer가 수학을 이해한다"는 과장이다.** 저자들 스스로 모델이 "그럴듯해 보이는" 오답(235232673을 3,11,13,19,23,1487로 잘못 인수분해)을 낸다는 것을 보여, 알고리즘적 조작이 아니라 얕은 패턴을 학습했을 가능성을 지적했다.',
 '**보간 정확도만 보고하면 안 된다.** 같은 모델도 보간(0.76)과 외삽(0.50) 사이 격차가 크다 — 훈련 분포 안에서의 점수는 일반화 능력을 보장하지 않는다.',
 '**쉬운 모듈과 어려운 모듈을 뭉뚱그려 평균 내면 약점이 가려진다.** 자릿값·반올림·비교는 거의 만점인 반면 소인수분해·소수 판별·혼합 산술은 크게 떨어져, 전체 평균 하나만 보면 이 차이를 놓친다.'
],

figures:[
 {f:'fig2-architectures.png',
  cap:'왼쪽 Attentional LSTM은 질문을 순환 인코더로 처리해 (key,value) 쌍의 시퀀스를 만들고 디코더가 매 스텝 attention으로 조회한다. 오른쪽 Transformer는 self-attention(회색 대각선)으로 질문 표현 전체를 동시에 갱신한다. 두 구조 모두 정답을 한 글자씩 자기회귀적으로 생성한다는 점은 같다.',
  src:'원문 Figure 2, p.6'}
],

quotes:[
 {t:'The structured nature of the mathematics domain...enables the construction of training and test splits designed to clearly illuminate the capabilities and failure-modes of different architectures.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1904.01557 — Analysing Mathematical Reasoning Abilities of Neural Models', u:'https://arxiv.org/abs/1904.01557'},
 {t:'mathematics_dataset GitHub', u:'https://github.com/google-deepmind/mathematics_dataset'}
]
});
