WIKI.paper({
slug:'data2vec',
venue:'ICML 2022',
authors:'Baevski, Hsu, Xu, Babu, Gu, Auli (Meta AI)',
arxiv:'2202.03555',

tldr:'음성·비전·언어 세 모달리티를 **같은 학습 알고리즘 하나**로 자기지도 학습하는 프레임워크. 픽셀이나 이산 토큰이 아니라 교사 모델(파라미터 EMA)의 **문맥화된 잠재 표현**을 마스크 예측 타깃으로 삼는다.',

context:'2022년 초 시점, 자기지도 학습은 모달리티마다 완전히 다른 설계로 갈라져 있었다. [BERT](#/p/bert)류는 어휘 단위 토큰을 가리고 맞추고, [wav2vec2](#/p/wav2vec2)는 음성 신호를 양자화해 이산 speech unit을 만들어 맞추고, [BEiT](#/p/beit)는 별도로 학습한 discrete VAE 토크나이저로 이미지 패치를 이산 토큰으로 바꿔 맞춘다. 각각의 "타깃 사전"을 손으로 설계해야 했다는 뜻이다. 같은 시기의 [MAE](#/p/mae)는 훨씬 단순하게 픽셀 자체를 복원했지만, 픽셀은 지역적이고 고주파 디테일에 학습 용량을 낭비한다는 한계가 있었다. data2vec의 질문은 단순하다 — 모달리티마다 다른 것은 입력을 토큰화하는 방식뿐이고, 그 뒤의 **학습 목표와 손실 함수는 하나로 통일할 수 있지 않은가?**',

ideas:[
 {h:'교사(EMA)가 만드는 연속 타깃',
  lead:'마스크되지 않은 전체 입력을 본 교사 모델이 예측 타깃 자체를 만든다.',
  d:'학생 모델은 마스크된 입력을 보고, 교사 모델은 마스크 없는 원본 전체를 본다. 교사의 가중치는 학습 대상이 아니라 학생 가중치의 **지수이동평균(EMA)**이다. 사전에 정해둔 어휘·클러스터가 없고, 교사가 그때그때 만들어내는 벡터를 그대로 타깃으로 쓰므로 타깃 집합이 열린 채로 움직인다는 것이 핵심이다.'},
 {h:'타깃은 문맥화된 표현이지 픽셀·토큰이 아니다',
  lead:'self-attention을 거친 상위 K개 레이어 평균을 회귀하지, 로컬 픽셀·이산 토큰을 맞추지 않는다.',
  d:'[BEiT](#/p/beit)는 패치 하나에 대응하는 이산 토큰을, [MAE](#/p/mae)는 패치의 원본 픽셀 값을 타깃으로 쓴다. 둘 다 그 패치 자체에 갇힌 **지역(local) 정보**다. data2vec은 교사 네트워크 상위 K개 Transformer 블록 출력을 정규화한 뒤 평균 낸 벡터를 타깃으로 쓰는데, 이 벡터는 self-attention을 거치며 입력 전체의 문맥을 이미 흡수한 상태다. 그래서 "타깃이 문맥화(contextualized)되어 있다"는 게 저자들이 반복해서 강조하는 차별점이다.'},
 {h:'입력 처리만 모달리티별, 목표와 손실은 공통',
  lead:'feature encoder·마스킹 전략만 갈아끼우고 EMA 타깃·Smooth L1 손실은 그대로 쓴다.',
  d:'비전은 16×16 패치를 선형 투영, 음성은 7층의 시간축 conv encoder(16kHz 파형 → 50Hz 프레임), 언어는 BPE 임베딩을 쓴다. 마스킹 방식도 비전은 [BEiT](#/p/beit) 식 블록 마스킹, 음성은 [wav2vec2](#/p/wav2vec2) 식 연속 구간 마스킹, 언어는 [BERT](#/p/bert) 식 15% 토큰 마스킹으로 제각각이다. 그러나 이후 단계 — 표준 Transformer, 교사 EMA, 상위 K층 평균 타깃, Smooth L1 손실 — 는 세 모달리티에서 완전히 동일하다.'},
 {h:'τ 스케줄: 학습 초반엔 교사가 빨리 따라온다',
  lead:'τ를 초반에 작게 뒀다가 점점 키워, 교사가 처음엔 빠르게 뒤따르고 나중엔 거의 고정된다.',
  d:'EMA 계수 τ를 $\\tau_0$ 에서 $\\tau_e$ 까지 처음 $\\tau_n$ 스텝 동안 선형 증가시킨 뒤 그 값을 고정한다. 학습 초반, 즉 학생이 아직 랜덤에 가까울 때는 교사도 빠르게 갱신되어야 의미 있는 타깃을 만들 수 있고, 학습이 진행돼 좋은 파라미터가 쌓이면 교사를 천천히 바꿔 타깃을 안정시키는 것이 낫다는 관찰에서 나온 설계다.'},
 {h:'BYOL·DINO와의 차이 — 마스크 예측 + 다층 평균',
  lead:'같은 EMA 자기증류 구조지만 데이터 증강이 아닌 마스킹을 쓰고, 최종층 하나가 아니라 여러 층을 평균한다.',
  d:'BYOL과 DINO도 모멘텀 인코더(EMA 교사)가 만든 표현을 학생이 맞추는 자기증류 구조다. 그러나 둘 다 이미지 두 증강 버전을 입력으로 쓰고 최종 층 표현 하나만 타깃으로 삼는다. data2vec은 대신 마스크된 입력 대 마스크 안 된 입력이라는 **마스크 예측** 과제를 쓰고, 최종 층 하나가 아니라 **상위 K개 층의 평균**을 타깃으로 써서 더 풍부한 신호를 만든다.'}
],

diagram:{type:'flow', cap:'세 모달리티 모두 같은 학습 루프: 원본을 본 교사(EMA)가 타깃을 만들고, 마스크된 입력을 본 학생이 그 타깃을 회귀한다.',
 nodes:[
  {t:'원본 입력', s:'이미지/음성/텍스트'},
  {t:'교사(EMA)', s:'마스크 없음', acc:true, a:'상위K평균'},
  {t:'타깃 벡터', s:'연속·문맥화'},
  {t:'학생(θ)', s:'마스크된 입력'},
  {t:'Smooth L1', s:'타깃 회귀'}
 ]},

math:[
 {expr:'Δ ← τΔ + (1 − τ)θ',
  tex:'\\Delta \\leftarrow \\tau \\Delta + (1-\\tau)\\theta',
  d:'교사 파라미터 $\\Delta$ 를 학생 파라미터 $\\theta$ 쪽으로 매 스텝 조금씩 끌어오는 EMA 업데이트. $\\tau$ 는 $\\tau_0$ 에서 $\\tau_e$ 까지 처음 $\\tau_n$ 스텝 동안 선형 증가한 뒤 고정된다.'},
 {expr:'y_t = (1/K) Σ_{l=L-K+1}^{L} â_t^l',
  tex:'y_t = \\frac{1}{K}\\sum_{l=L-K+1}^{L} \\hat a_t^{\\,l}',
  d:'전체 $L$개 블록 중 상위 $K$개 블록의 (정규화된) 출력 $\\hat a_t^l$ 을 평균해 시간 스텝 $t$의 학습 타깃 $y_t$ 를 만든다. 비전은 $K=6$, 음성은 $K=8$, 언어는 $K=10$을 쓴다.'},
 {expr:'L(y_t, f_t(x)) = 0.5(y_t−f_t(x))²/β  (오차≤β),  |y_t−f_t(x)|−0.5β  (그 외)',
  tex:'L(y_t,f_t(x))=\\begin{cases}\\dfrac{1}{2}(y_t-f_t(x))^2/\\beta & |y_t-f_t(x)|\\le\\beta\\\\[4pt] \\left(|y_t-f_t(x)|-\\dfrac{1}{2}\\beta\\right) & \\text{otherwise}\\end{cases}',
  d:'타깃 $y_t$ 와 학생 예측 $f_t(x)$ 사이의 Smooth L1 손실. 오차가 작을 때는 제곱 손실, 클 때는 L1로 전환돼 이상치(outlier)에 덜 민감하다. $\\beta$ 는 비전 2, 언어 4를 쓴다.'}
],

numbers:[
 {k:'비전 fine-tuning · ImageNet-1K top-1 (ViT-B)', v:'84.2%', d:'단일 모델(별도 토크나이저 없음) 기준 [BEiT](#/p/beit) 83.2%, [MAE](#/p/mae) 83.6%, [iBOT](#/p/ibot) 83.8%를 앞섬 — **fine-tuning 값, linear probing 아님**'},
 {k:'비전 fine-tuning · ImageNet-1K top-1 (ViT-L)', v:'86.6%', d:'단일 모델 기준 최고, MAE 85.9%·MaskFeat 85.7% 상회'},
 {k:'음성 · LibriSpeech test-other WER (Base, 10분 라벨)', v:'12.3', d:'같은 10분 설정의 wav2vec2 15.6, HuBERT 15.3 대비 20%가량 상대적 개선'},
 {k:'음성 · LibriSpeech test-other WER (Base, 960시간 라벨)', v:'5.5', d:'라벨이 충분한 설정에서는 wav2vec2 6.1보다 소폭 우위'},
 {k:'언어 · GLUE 평균 (dev set, single-task fine-tuning)', v:'82.7', d:'동일 설정으로 재학습한 RoBERTa 베이스라인 82.5, BERT 80.7 대비 우세'},
 {k:'비전 마스킹 비율', v:'60%', d:'BEiT의 40%보다 크게 늘렸을 때 더 정확했다고 보고'}
],

impact:'data2vec은 "모달리티마다 다른 자기지도 알고리즘이 필요하다"는 통념에, **입력 처리만 갈아끼우면 학습 목표는 하나로 통일된다**는 반례를 냈다. 픽셀 복원([MAE](#/p/mae))이나 이산 토큰 복원([BEiT](#/p/beit))과 달리 교사의 연속·문맥화 표현을 타깃으로 삼는 방식이 세 모달리티 모두에서 경쟁력 있는 결과를 냈다는 점이 핵심 증거다. 이후 저자들은 data2vec 2.0에서 학습 효율을 크게 높였고, 이 "EMA 교사의 문맥화 표현을 마스크 예측으로 회귀"하는 레시피는 이후 여러 모달리티 통합 자기지도 연구의 참조점이 됐다.',

legacy:[
 '**data2vec 2.0(2022)** — 같은 알고리즘을 유지한 채 교사 표현 재사용, 효율적 디코더로 학습 속도를 최대 16배까지 개선',
 '**모달리티 통일 흐름과 합류** — ImageBind류의 다중 모달 임베딩 통일 연구와 "하나의 레시피, 여러 입력"이라는 문제의식을 공유',
 '**BYOL/DINO 계열과의 수렴** — 마스크 예측 + EMA 교사라는 조합이 [iBOT](#/p/ibot) 등 비전 자기증류 연구의 설계 선택지에 편입',
 '**타깃 설계 논쟁의 재점화** — "픽셀이냐 토큰이냐 잠재표현이냐"라는 질문이 이후 마스크 예측 계열 논문들의 단골 비교축이 됨'
],

pitfalls:[
 '**비전 수치는 fine-tuning 값이다.** 논문 Table 1의 ImageNet-1K 84.2%/86.6%는 전부 지도 fine-tuning 후 top-1 정확도이며, linear probing 수치가 아니다. DINO·iBOT 계열 논문과 비교할 때 어느 프로토콜인지 반드시 확인해야 한다.',
 '**"공통 알고리즘"이지 "공통 가중치"가 아니다.** 세 모달리티가 같은 학습 절차(EMA 교사 + 마스크 예측 + Smooth L1)를 공유할 뿐, 실제로는 모달리티별로 **별도의 모델을 각각 학습**한다. 하나의 가중치로 세 모달리티를 동시에 처리하는 멀티모달 모델이 아니다.',
 '**하이퍼파라미터가 모달리티마다 다르다.** $K$(비전 6·음성 8·언어 10), $\\beta$(비전 2·언어 4), 마스킹 비율(비전 60%) 등은 각 모달리티에서 별도로 튜닝된 값이라, "하나의 설정을 그대로 복붙"하면 재현되지 않는다.'
],

figures:[
 {f:'fig1-framework.png',
  cap:'왼쪽부터 이미지·음성·언어의 원본(위)과 마스크된 버전(아래). 오른쪽은 같은 Transformer 하나를 교사 모드(위, 마스크 없는 입력, 파란 블록이 타깃으로 쓰이는 상위 K층)와 학생 모드(아래, 마스크된 입력)로 번갈아 쓰는 구조. 점선이 "교사가 학생 파라미터의 EMA를 추적"하는 경로.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'Instead of predicting modality-specific targets such as words, visual tokens or units of human speech which are local in nature, data2vec predicts contextualized latent representations that contain information from the entire input.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2202.03555 — data2vec', u:'https://arxiv.org/abs/2202.03555'},
 {t:'Meta AI: data2vec 공식 코드', u:'https://github.com/facebookresearch/fairseq/tree/main/examples/data2vec'}
]
});
