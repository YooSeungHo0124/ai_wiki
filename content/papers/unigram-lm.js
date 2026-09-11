WIKI.paper({
slug:'unigram-lm',
venue:'ACL 2018',
authors:'Taku Kudo (Google Inc.)',
arxiv:'1804.10959',

tldr:'같은 문장도 여러 방식으로 쪼갤 수 있다는 사실을 노이즈가 아니라 **정규화 신호**로 쓴 논문. 확률적 유니그램 언어모델로 서브워드를 학습해, 학습 때마다 분할을 무작위로 바꿔가며 샘플링하는 **서브워드 정규화(subword regularization)** 를 제안했다.',

context:'2018년 NMT의 사실상 표준은 [BPE](#/p/bpe) 서브워드였다. BPE는 문자쌍을 빈도순으로 병합해 어휘를 만들고, 한 문장을 **항상 하나의 고정된 방식**으로만 분할한다. 문제는 "Hello World"조차 `Hell/o/ world`, `He/llo/ world` 등 같은 어휘로 여러 방식으로 쪼갤 수 있다는 점이다 — BPE는 이 모호성 중 단 하나만 골라 쓰고 나머지는 버린다. 저자는 이 버려지는 대안 분할들이 사실 **노이즈로 주입할 수 있는 데이터 증강 신호**라고 봤다. 다만 BPE는 병합 규칙이 결정론적이라 애초에 "이 문장을 이렇게 분할할 확률"이라는 개념이 없고, 그래서 확률 분포를 갖는 새 분할 알고리즘이 필요했다.',

ideas:[
 {h:'유니그램 언어모델: 확률에서 출발하는 분할',
  lead:'각 서브워드가 독립적으로 발생한다고 가정해 문장 분할에 확률을 매긴다.',
  d:'BPE가 "압축을 최소화하는 병합 규칙"이라는 빈도 기반 알고리즘이라면, 이 논문은 **서브워드 $x_i$ 가 서로 독립적으로 나타난다**는 유니그램 가정 아래 $P(x)=\\prod_i p(x_i)$ 로 분할 확률을 정의한다. 문장 $X$의 최적 분할은 $\\arg\\max_{x\\in S(X)} P(x)$ 로 Viterbi 알고리즘으로 구한다. 어휘 $V$가 주어지면 각 서브워드의 출현확률 $p(x_i)$ 는 EM으로 추정한다.'},
 {h:'어휘 구축: 크게 시작해서 깎아낸다',
  lead:'BPE처럼 병합해 키우지 않고 거꾸로 큰 시드 어휘를 EM과 손실 기준으로 축소한다.',
  d:'접미사 배열로 뽑은 큰 시드 어휘에서 출발해, (1) EM으로 $p(x)$ 를 추정하고 (2) 각 서브워드를 제거했을 때 우도 $L$ 이 얼마나 줄어드는지(`loss_i`)를 계산한 뒤 (3) 손실이 작은 하위 서브워드를 상위 η%(예: 80%)만 남기고 버리는 과정을 목표 어휘 크기까지 반복한다. 개별 문자는 OOV 방지를 위해 항상 남긴다.'},
 {h:'서브워드 정규화: 매 학습 스텝마다 다시 분할한다',
  lead:'같은 문장을 고정하지 않고 매 파라미터 업데이트마다 분포 $P(x|X)$ 에서 새로 샘플링한다.',
  d:'l-best 분할을 Forward-DP Backward-A*로 구한 뒤 $P(x_i|X)\\propto P(x_i)^{\\alpha}$ 다항분포로 하나를 샘플링한다. $l\\to\\infty$ 인 경우는 Forward-Filtering Backward-Sampling(FFBS)으로 격자 전체에서 정확히 샘플링한다. $\\alpha$ 가 작을수록 균등에 가깝게, 클수록 Viterbi 분할에 가깝게 샘플링해 정규화 강도를 조절한다.'},
 {h:'BPE와 같은 원리, 다른 정식화',
  lead:'BPE가 사전식 압축이라면 유니그램 LM은 엔트로피 부호화 — 둘 다 압축 원리를 공유한다.',
  d:'BPE는 데이터 압축의 사전(dictionary) 인코더 계열이고, 유니그램 LM은 섀넌 부호화 정리에 따라 기호 $s$ 에 $-\\log p_s$ 만큼의 코드 길이를 배정하는 엔트로피 인코더로 재해석된다. 목적함수의 본질은 같지만, 유니그램 LM만이 **분할마다 확률**을 갖기 때문에 서브워드 정규화에 필요한 분포를 제공할 수 있다.'}
],

diagram:{type:'compare', cap:'같은 어휘로도 여러 분할이 가능하다는 모호성을 BPE는 버리고 유니그램 LM은 학습에 활용한다.',
 left:{t:'BPE', items:['빈도 기반 병합 규칙','문장마다 분할 1개로 고정','분할 확률 개념 없음']},
 right:{t:'유니그램 LM + 정규화', items:['EM으로 서브워드 확률 추정','스텝마다 분할을 재샘플링','온도 파라미터로 강도 조절']}
},

math:[
 {expr:'P(x) = Π p(x_i),   x* = argmax_{x∈S(X)} P(x)',
  tex:'P(\\mathbf{x})=\\prod_i p(x_i),\\qquad \\mathbf{x}^{*}=\\arg\\max_{\\mathbf{x}\\in S(X)}P(\\mathbf{x})',
  d:'서브워드가 서로 독립이라는 유니그램 가정. $S(X)$ 는 문장 $X$ 의 가능한 모든 분할 후보 집합이고, 최적 분할은 Viterbi로 구한다.'},
 {expr:'L = Σ_s log( Σ_{x∈S(X_s)} P(x) )',
  tex:'L=\\sum_{s=1}^{|D|}\\log\\!\\left(\\sum_{\\mathbf{x}\\in S(X^{(s)})}P(\\mathbf{x})\\right)',
  d:'말뭉치 $D$ 전체의 주변 우도. 분할 자체를 잠재변수로 두고 EM으로 $p(x_i)$ 를 추정한다.'},
 {expr:'P(x_i|X) ∝ P(x_i)^α',
  tex:'P(x_i\\mid X)\\;\\propto\\;P(x_i)^{\\alpha},\\qquad \\alpha\\in\\mathbb{R}^{+}',
  d:'서브워드 샘플링에 쓰는 다항분포. $\\alpha$ 가 작을수록 균등 샘플링(강한 정규화), 클수록 Viterbi 분할 하나로 수렴한다(정규화 없음에 가까움).'}
],

numbers:[
 {k:'IWSLT15 en→vi BLEU', v:'25.61 → 27.71', d:'BPE 기준선 대비 서브워드 정규화(l=64, α=0.2) 적용, n-best 디코딩 아님(one-best) 기준 +2.1'},
 {k:'IWSLT17 ar→en BLEU', v:'25.98 → 29.22', d:'저자원 언어쌍에서 가장 큰 폭의 개선(+3.24), one-best 디코딩'},
 {k:'WMT14 en→de out-of-domain(Patent)', v:'15.63 → 25.76', d:'표 4, 도메인 밖(특허) 평가에서 +10 수준의 큰 개선'},
 {k:'WMT14 en→de 세그멘테이션 비교', v:'BPE 24.53 vs 유니그램+SR 25.04', d:'표 5, 같은 조건에서 서브워드 정규화가 BPE보다 근소 우위'},
 {k:'단측 vs 양측 정규화', v:'source+target 27.68 > source only 26.00', d:'표 6, 인코더·디코더 양쪽에 정규화를 걸어야 효과가 최대'}
],

impact:'BPE의 "하나의 정답 분할"이라는 전제를 깨고, 분할 모호성을 데이터 증강으로 전환할 수 있음을 보였다. 유니그램 LM 알고리즘과 서브워드 정규화는 저자가 함께 만든 오픈소스 [SentencePiece](#/p/sentencepiece) 에 구현되어, 이후 언어에 무관하게(공백 유무와 무관하게) 서브워드를 다루는 사실상 표준 도구가 되었다. [mT5](#/p/mt5), [ALBERT](#/p/albert) 등 다국어·대규모 모델이 SentencePiece의 유니그램 모드를 어휘 학습에 채택했다.',

legacy:[
 '**[SentencePiece](#/p/sentencepiece)** — 같은 저자(Kudo)가 이 논문의 유니그램 LM과 BPE를 하나의 라이브러리로 구현, 원문 각주에 깃허브 링크가 직접 언급될 만큼 논문과 구현이 한 몸으로 기획됨',
 '**정규화로서의 토큰화** — 학습 시 입력에 노이즈를 주는 아이디어가 [T5](#/p/t5)·mT5류 대규모 사전학습의 전처리 표준으로 흡수됨',
 '**[BPE-dropout](https://arxiv.org/abs/1910.13267)** 등 후속 연구가 BPE 쪽에도 확률적 분할을 이식하려는 시도로 이어짐',
 '멀티링구얼 모델에서 **한 어휘로 여러 언어를 다루는** 접근이 [바이트 수준 BPE](#/p/byte-level-bpe)와 함께 서브워드 설계의 두 축이 됨'
],

pitfalls:[
 '**"유니그램 LM이 BPE보다 항상 크게 낫다"가 아니다.** 표 5에서 정규화 없이(l=1) 단순 비교하면 BPE(24.53)와 유니그램(24.50)은 거의 동일하다 — 개선의 원천은 알고리즘 자체가 아니라 **서브워드 정규화**(l=64 적용 시 25.04)다.',
 '**대량 데이터에서는 이득이 작다.** WMT14 en→de처럼 데이터가 큰(4.5M) 설정에서는 표 3 기준 개선폭이 0.5 안팎으로 줄어든다. 저자원·도메인 밖(out-of-domain) 설정에서 효과가 가장 크다.',
 '**서브워드 정규화는 학습에만 쓰고 추론은 보통 Viterbi(one-best)로 고정한다.** 원문은 n-best 디코딩도 실험했지만 이는 추가 옵션이지 정규화 자체의 필수 요소가 아니다.'
],

figures:[
 {f:'fig1-hyperparam.png',
  cap:'x축이 샘플링 온도 $\\alpha$, y축이 BLEU. α=0(거의 균등 샘플링)에서는 성능이 오히려 기준선(수평선)보다 낮고, α가 너무 크면(1에 가까움, 정규화 거의 없음) 다시 떨어진다 — 중간 지점(약 0.2)에서 최댓값을 찍는 역U자 곡선이 정규화 강도의 트레이드오프를 보여준다.',
  src:'원문 Figure 1, p.8'}
],

quotes:[
 {t:'The question addressed in this paper is whether it is possible to harness the segmentation ambiguity as a noise to improve the robustness of NMT.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1804.10959 — Subword Regularization', u:'https://arxiv.org/abs/1804.10959'},
 {t:'SentencePiece (GitHub)', u:'https://github.com/google/sentencepiece'}
]
});
