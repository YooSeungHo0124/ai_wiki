WIKI.paper({
slug:'ulmfit',
venue:'ACL 2018',
authors:'Howard & Ruder (fast.ai · Insight Centre, NUI Galway)',
arxiv:'1801.06146',

tldr:'컴퓨터 비전에서는 당연했던 "ImageNet 사전학습 → 미세조정"을 NLP 텍스트 분류에 그대로 옮긴 논문. 일반 도메인 언어모델을 한 번 학습해 두면, 라벨 100개만으로도 스크래치 학습 대비 100배 많은 데이터를 쓴 것과 맞먹는 성능이 나온다는 것을 보였다.',

context:'2018년 초 NLP의 전이학습은 [word2vec](#/p/word2vec)류의 **사전학습된 단어 임베딩**을 첫 층에 고정해 꽂는 수준에 머물러 있었다. 이는 모델의 나머지 부분은 여전히 처음부터 학습해야 한다는 뜻이다. Dai & Le(2015)가 언어모델(LM)을 미세조정하는 아이디어를 먼저 냈지만, 좋은 성능을 내려면 수백만 개의 도메인 내 문서가 필요해 실용성이 없었다. 문제는 아이디어가 아니라 **학습 방법**이었다 — LM을 작은 데이터셋에 미세조정하면 과적합하거나 분류기를 얹는 순간 이미 배운 것을 잊어버리는 **catastrophic forgetting**이 일어났다. CV처럼 "사전학습 후 그냥 fine-tune"이 NLP에서는 통하지 않았던 이유다.',

ideas:[
 {h:'3단계 파이프라인: 일반 LM → 도메인 LM → 분류기',
  lead:'위키피디아로 배운 LM을 목표 도메인에, 다음 분류 과제에 순서대로 미세조정한다.',
  d:'1) WikiText-103(기사 28,595개·1억 300만 단어)으로 범용 언어모델을 한 번 학습한다. 2) 그 LM을 목표 과제의 (라벨 없는) 텍스트로 한 번 더 미세조정해 도메인 특유의 어휘·문체에 적응시킨다. 3) 그 위에 작은 분류층을 얹어 라벨 데이터로 미세조정한다. 3단계 모두 **같은 3층 [LSTM](#/p/lstm)(AWD-LSTM)**을 쓴다 — 과제마다 새 아키텍처를 설계하지 않는다.'},
 {h:'판별적 미세조정(Discriminative fine-tuning)',
  lead:'층마다 다른 학습률을 써서 낮은 층은 살살, 높은 층은 크게 조정한다.',
  d:'층마다 담는 정보의 종류가 다르므로(낮은 층=일반 문법, 높은 층=과제 특화) 전 층에 같은 학습률 $\\eta$ 를 쓰지 않는다. 마지막 층의 학습률 $\\eta^L$ 을 먼저 정하고 아래층으로 갈수록 $\\eta^{l-1}=\\eta^l/2.6$ 로 줄인다. 미리 배운 일반 지식은 거의 건드리지 않고 과제 특화 부분만 크게 움직이는 효과를 낸다.'},
 {h:'Slanted triangular learning rate(STLR)',
  lead:'학습률을 짧게 급등시켰다가 길게 선형 감소시켜 빠른 수렴과 안정적 정제를 동시에 얻는다.',
  d:'전체 반복의 앞 10%(`cut_frac=0.1`) 동안 학습률을 선형으로 끌어올려 파라미터 공간의 좋은 영역을 빨리 찾고, 나머지 90% 동안 선형으로 감소시켜 그 지점을 정밀하게 다듬는다. 같은 학습률을 유지하거나 단순히 어닐링하는 것보다 이 "짧은 상승, 긴 하강" 비대칭 스케줄이 더 잘 작동했다.'},
 {h:'경사 해동(Gradual unfreezing)',
  lead:'분류기 미세조정 시 맨 위 층부터 한 층씩 순서대로 얼음을 푼다.',
  d:'모든 층을 한꺼번에 미세조정하면 가장 유용한 지식까지 급격히 덮어써 catastrophic forgetting이 일어난다. 그래서 처음엔 마지막 층만 풀어 학습하고, 한 에폭마다 그 아래 층을 하나씩 추가로 해동한다. 낮은 층의 일반 지식을 최대한 오래 보존하면서 높은 층부터 과제에 맞춰 나가는 순서다.'},
 {h:'Concat pooling: 마지막 은닉 상태만으론 부족하다',
  lead:'분류 신호가 문서 어디에 있을지 모르므로 마지막·최대·평균 은닉 상태를 이어붙인다.',
  d:'긴 문서에서 분류에 중요한 단어는 몇 개뿐이고 그 위치가 문서 끝일 필요는 없다. RNN의 마지막 은닉 상태 $h_T$ 만 쓰면 앞쪽 정보가 희석된다. 그래서 $h_T$ 에 시퀀스 전체의 max-pooling·mean-pooling 결과를 이어붙여 분류층 입력으로 쓴다.'}
],

diagram:{type:'flow', cap:'ULMFiT의 세 단계. 같은 3층 LSTM을 그대로 두 번 재사용하고, 마지막 단계에서만 분류층을 얹는다.',
 nodes:[
  {t:'일반 도메인 LM', s:'WikiText-103'},
  {t:'도메인 LM 미세조정', s:'목표 과제 텍스트'},
  {t:'분류기 미세조정', s:'경사 해동 + Discr + STLR', acc:true}
 ]},

math:[
 {expr:'θ_t^l = θ_{t-1}^l - η^l · ∇_{θ^l} J(θ)',
  tex:'\\theta_t^{l}=\\theta_{t-1}^{l}-\\eta^{l}\\cdot\\nabla_{\\theta^{l}}J(\\theta)',
  d:'판별적 미세조정의 갱신식. 층 $l$ 마다 별도의 학습률 $\\eta^l$ 을 쓴다는 것이 전부지만, 이 한 층 분리가 forgetting을 크게 줄인다.'},
 {expr:'η_l/2.6 = 학습률(층 l-1),  η^L = 마지막 층 학습률',
  tex:'\\eta^{l-1}=\\eta^{l}/2.6',
  d:'실험적으로 정한 배율. 마지막 층 학습률을 기준으로 아래로 갈수록 2.6배씩 줄여나간다.'},
 {expr:'η_t = η_max · (1 + p·(ratio-1)) / ratio,  cut = ⌊T·cut_frac⌋',
  tex:'\\eta_t=\\eta_{max}\\cdot\\frac{1+p\\cdot(ratio-1)}{ratio}',
  d:'STLR 스케줄. $p$ 는 $t<cut$ 이면 $t/cut$(상승 구간), 이후엔 선형 감소 구간이 되도록 정의된다. 논문 기본값은 `cut_frac=0.1`, `ratio=32`, $\\eta_{max}=0.01$.'}
],

numbers:[
 {k:'사전학습 코퍼스', v:'WikiText-103', d:'위키 기사 28,595개 · 1억 300만 단어'},
 {k:'IMDb 오류율', v:'4.6%', d:'CoVe 대비 **-43.9%**, 기존 SOTA 대비 **-22%**'},
 {k:'AG News 오류율', v:'5.01%', d:'기존 SOTA 대비 **-23.7%**'},
 {k:'라벨 100개 성능', v:'스크래치 대비 10~100배 데이터', d:'IMDb에서 라벨 100개짜리 supervised ULMFiT ≈ 스크래치 10배 데이터, semi-supervised는 100배'},
 {k:'전체 6개 데이터셋', v:'오류 18~24% 감소', d:'대부분의 데이터셋에서 SOTA 대비'},
 {k:'LM 구성', v:'AWD-LSTM · 3층 · 임베딩 400 · 은닉 1150', d:'attention·shortcut 없는 순수 LSTM'}
],

impact:'CV의 "사전학습 후 미세조정"이 NLP에서도 통한다는 것을 처음으로 재현 가능하게 보였다. 핵심은 새 아키텍처가 아니라 **미세조정을 어떻게 하느냐**였다는 것을 증명했다는 점이다 — 판별적 학습률·STLR·경사 해동은 이후 사전학습 언어모델을 다루는 표준 관행이 되었다. 같은 2018년에 [ELMo](#/p/elmo)가 문맥화 임베딩으로, [GPT-1](#/p/gpt1)이 Transformer 디코더 사전학습으로 각각 다른 경로에서 같은 결론에 도달하면서, "언어모델 사전학습 + 미세조정"이 NLP 연구 전체의 공통 패러다임으로 굳어졌다.',

legacy:[
 '**패러다임 동시 발명** — 같은 해에 [ELMo](#/p/elmo)(문맥화 임베딩)·[GPT-1](#/p/gpt1)(Transformer 디코더)이 각기 다른 아키텍처로 "사전학습 언어모델" 시대를 함께 열었다',
 '**미세조정 기법의 표준화** — 판별적 학습률·warmup 후 선형 감소라는 스케줄 아이디어가 이후 [BERT](#/p/bert) 이후 거의 모든 Transformer 미세조정 레시피에 흡수됨',
 '**아키텍처는 LSTM에서 Transformer로 교체** — [BERT](#/p/bert)·[GPT-1](#/p/gpt1) 이후 사전학습의 백본은 attention 기반으로 넘어갔지만, "일반 → 도메인 → 과제"라는 3단계 전이 구도 자체는 그대로 살아남음',
 '**소량 라벨로도 되는 NLP** — 100개 라벨로 대규모 데이터 성능에 근접한다는 결과가 이후 few-shot·[FLAN](#/p/flan) 계열이 던지는 질문("라벨 없이 얼마나 갈 수 있나")의 출발점 중 하나가 됨'
],

pitfalls:[
 '**ULMFiT은 attention이 없는 순수 LSTM이다.** "사전학습 언어모델"이라는 말만 보고 Transformer 기반이라 착각하기 쉽지만, 이 논문의 기여는 아키텍처가 아니라 **미세조정 절차**에 있다.',
 '**세 단계를 다 거쳐야 효과가 난다.** 1단계(일반 LM)만 하고 2단계(도메인 LM 미세조정)를 생략하면 논문이 보고한 이득의 상당 부분이 사라진다. 특히 목표 도메인이 위키피디아와 이질적일수록 2단계 효과가 크다.',
 '**TREC-6 같은 소규모 데이터셋의 개선폭은 통계적으로 유의하지 않다.** 논문도 500개짜리 테스트셋에서의 개선은 검정력이 부족하다고 스스로 밝히고 있다 — IMDb·AG 같은 대규모 데이터셋의 결과와 같은 신뢰도로 읽으면 안 된다.'
],

figures:[
 {f:'fig1-stages.png',
  cap:'(a) 위키피디아로 일반 LM을 학습, (b) 같은 LM을 목표 과제 텍스트로 다시 미세조정, (c) 그 위에 분류층을 얹어 미세조정. (c)의 회색 음영이 매 에폭 아래로 한 층씩 풀리는 경사 해동을 나타내고, 검은 블록은 아직 얼어 있는 층이다.',
  src:'원문 Figure 1, p.3'},
 {f:'fig3-sampleeff.png',
  cap:'x축이 라벨 훈련 예시 수(로그 스케일), y축이 검증 오류율. 왼쪽부터 IMDb·TREC-6·AG. 파란 선(스크래치 학습)이 라벨 100개에서 급격히 나쁘고, 주황·초록(ULMFiT)은 라벨이 적어도 낮게 유지된다 — 라벨 100개짜리 ULMFiT이 스크래치 학습의 라벨 1,000~10,000개 지점과 맞먹는다.',
  src:'원문 Figure 3, p.7'}
],

quotes:[
 {t:'Our method significantly outperforms the state-of-the-art on six text classification tasks, reducing the error by 18-24% on the majority of datasets.',
  src:'Abstract, p.1'},
 {t:'We show that not the idea of LM fine-tuning but our lack of knowledge of how to train them effectively has been hindering wider adoption.',
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 1801.06146 — Universal Language Model Fine-tuning for Text Classification', u:'https://arxiv.org/abs/1801.06146'},
 {t:'fast.ai ULMFiT', u:'http://nlp.fast.ai/ulmfit'}
]
});
