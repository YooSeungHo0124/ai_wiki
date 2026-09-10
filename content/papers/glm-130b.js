WIKI.paper({
slug:'glm-130b',
venue:'ICLR 2023',
authors:'Zeng, Liu et al. (Tsinghua University · Zhipu AI)',
arxiv:'2210.02414',

tldr:'GPT 스타일 디코더 대신 **자기회귀 빈칸 채우기**(GLM) 구조로 만든 1300억 파라미터 중·영 이중언어 오픈 모델. 학습 불안정을 극복한 전 과정을 공개했고, 사후 보정 없이 INT4 양자화가 돼 소비자용 GPU 4장으로 추론이 가능하다.',

context:'2022년 시점 100B급 오픈 모델은 [GPT-NeoX](#/p/gpt-neox)(20B)를 제외하면 OPT-175B·BLOOM-176B 정도였는데, 두 모델 다 [GPT-3](#/p/gpt3)의 디코더-전용 자기회귀 구조를 그대로 따랐고 영어(OPT) 또는 다국어(BLOOM) 위주였다. 중국어를 영어와 동등하게 다루는 100B급 오픈 모델은 없었다. 더 근본적인 문제는 **학습 안정성**이었다 — [OPT](#/p/opt)와 BLOOM의 학습 로그에서 이미 잦은 loss spike와 발산이 보고됐지만, 그것을 어떻게 극복했는지 상세한 공학적 기록은 공개되지 않았다. GLM-130B는 이 두 구멍 — 아키텍처의 대안과 안정화 과정의 투명한 공개 — 을 동시에 겨눈다.',

ideas:[
 {h:'GLM: 양방향 attention + 자기회귀 빈칸 채우기',
  lead:'문장 일부를 [MASK]로 지우고 그 빈칸을 자기회귀로 순서를 섞어 복원하며 학습한다.',
  d:'입력 시퀀스에서 여러 구간을 뽑아 하나의 마스크 토큰으로 치환한 뒤, 마스크되지 않은 문맥에는 **양방향** attention을, 채워 넣는 순서 자체는 무작위로 섞어 **자기회귀**로 예측하게 한다. 짧은 빈칸([MASK])을 쓰면 [BERT](#/p/bert)·[T5](#/p/t5)처럼 이해에, 문장 끝의 긴 빈칸([gMASK])을 쓰면 PrefixLM처럼 생성에 가깝게 동작해 한 목적함수로 이해·생성을 함께 학습한다.'},
 {h:'DeepNorm: 30번 넘게 실패한 끝에 찾은 안정화',
  lead:'Pre-LN·Post-LN·Sandwich-LN이 전부 발산해 DeepNorm 기반 Post-LN으로 정착했다.',
  d:'100B 규모에서 기존 LayerNorm 배치를 30여 차례 시도했지만 전부 학습 중 gradient norm이 튀며 무너졌다. 층수 $N$ 에 따라 residual 크기를 $\\alpha=(2N)^{1/2}$ 로 스케일하고 FFN·value·output projection 초기화를 $(2N)^{-1/2}$ 로 줄이는 DeepNorm 기반 Post-LN을 적용하자 gradient norm이 낮게 유지되며 3000스텝 넘게 발산 없이 학습이 진행됐다.'},
 {h:'Embedding Gradient Shrink: 남은 불안정의 원인은 임베딩',
  lead:'단어 임베딩 층의 gradient만 줄여 후반부 loss spike의 근본 원인을 제거한다.',
  d:'DeepNorm 이후에도 학습 후반에 이따금 loss spike가 남았는데, 원인을 추적한 결과 임베딩 층의 gradient norm이 다른 층보다 몇 자릿수 크게 튀는 것을 확인했다. 임베딩 층의 gradient만 별도 계수로 줄이는 Embedding Gradient Shrink(EGS)를 적용해 이 spike를 억제했다.'},
 {h:'INT4 양자화: 사후 보정 없이 성능 손실 거의 0',
  lead:'가중치 분포가 좁은 GLM 구조 덕에 추가 학습 없는 INT4 변환에도 성능이 거의 유지된다.',
  d:'OPT·BLOOM은 INT8까지만 성능 저하 없이 양자화됐지만, GLM-130B는 별도의 post-training 보정 없이 INT4로 낮춰도 LAMBADA는 -0.74%p, MMLU는 오히려 +0.05%p로 사실상 손실이 없었다. 그 결과 130B 모델을 RTX 3090 4장(24GB×4) 또는 RTX 2080 Ti 8장(11GB×8)이라는, 100B급 모델치고는 이례적으로 저렴한 하드웨어에서 돌릴 수 있게 됐다.'}
],

diagram:{type:'compare', cap:'GPT류의 단방향 자기회귀와 GLM의 양방향+빈칸채우기 목적을 대비한다.', left:{t:'GPT-3·PaLM·OPT·BLOOM', items:['디코더 전용 단방향 attention','왼쪽 문맥만 보고 다음 토큰 예측']}, right:{t:'GLM-130B', items:['비마스크 구간엔 양방향 attention','[MASK]/[gMASK] 빈칸을 자기회귀 복원','BERT류 이해 + GPT류 생성 겸용']}},

math:[
 {expr:'DeepNorm(x) = LayerNorm(α·x + Network(x)),  α = (2N)^(1/2)',
  tex:'\\text{DeepNorm}(x) = \\text{LayerNorm}\\big(\\alpha \\cdot x + \\text{Network}(x)\\big),\\quad \\alpha = (2N)^{1/2}',
  d:'층수 $N$(GLM-130B는 70층)이 커질수록 residual 경로의 비중 $\\alpha$ 를 키우고, 반대로 서브층 초기화 스케일을 $(2N)^{-1/2}$ 로 줄여 깊은 네트워크에서도 활성값이 폭주하지 않게 만든다.'}
],

numbers:[
 {k:'파라미터', v:'130B', d:'70층, A100 40GB 1대에 파이프라인 병렬로 올라가는 상한에 맞춘 크기'},
 {k:'학습 데이터', v:'≈400B 토큰', d:'96대 DGX-A100(8×40G) 클러스터, 60일간 학습'},
 {k:'LAMBADA(zero-shot)', v:'80.2%', d:'GPT-3 175B(+5.0%p)·OPT-175B(+6.5%p)·BLOOM-176B(+13.0%p) 상회, 당시 기록'},
 {k:'MMLU(5-shot)', v:'GPT-3 대비 +0.9%p', d:'BLOOM-176B 대비는 +12.7%p'},
 {k:'INT4 양자화 손실', v:'LAMBADA -0.74%p · MMLU +0.05%p', d:'사후 보정(post-training calibration) 없이'},
 {k:'INT4 추론 하드웨어', v:'RTX 3090×4 또는 2080 Ti×8', d:'100B급 모델을 소비자용 GPU로 돌린 최초 사례로 소개'}
],

impact:'GPT류 디코더-전용 구조가 사실상 유일한 선택지처럼 보이던 100B급 오픈 모델 시장에, 양방향 attention을 살린 대안 아키텍처가 GPT-3급 성능에 도달할 수 있음을 보였다. 더 크게는 **학습이 왜, 어떻게 무너지는지**를 실패 사례까지 상세히 공개한 것 자체가 이후 오픈소스 LLM 학습팀들이 참고하는 공학 문서가 됐다. INT4 양자화로 100B급 모델의 추론 진입장벽을 소비자용 GPU 수준까지 낮춘 것도, 이후 양자화 연구가 "성능을 얼마나 지키며 비트를 낮출 수 있는가"를 130B 규모에서 검증하는 기준점이 되었다.',

legacy:[
 '**학습 안정화 레시피의 표준화** — DeepNorm과 임베딩 gradient 제어라는 조합이 이후 대형 모델 학습 보고서에서 반복 인용되는 공학 지식이 됐다',
 '**INT4 양자화의 실증** — 사후 보정 없는 INT4가 100B급에서 통한다는 것을 보여, 이후 [GPTQ](#/p/gptq) 등 사후 보정 양자화 연구와 나란히 비교되는 기준이 됐다',
 '**중국어 오픈 LLM 생태계의 출발점** — Zhipu AI의 ChatGLM 계열로 이어지며 중국 학계·산업의 오픈 LLM 계보를 열었다',
 '**빈칸 채우기 목적함수의 재조명** — GPT식 순수 자기회귀가 아닌 목적함수로도 100B 규모에서 경쟁력이 있다는 사례가, 이후 아키텍처 다양성 논의에 근거로 쓰였다'
],

pitfalls:[
 '**"GLM-130B가 모든 벤치마크에서 GPT-3를 이긴다"는 과장이다.** 초록에서도 밝히듯 영어 벤치마크 우위는 OPT-175B·BLOOM-176B에서는 재현되지 않았고, GLM 고유의 목적함수·아키텍처 조합에 의한 효과다.',
 '**GLM의 양방향 attention 이점은 unidirectional 모드로 전환하면 사라진다.** 논문 스스로 attention mask를 단방향으로 바꾸면 GPT-3·OPT-175B 수준으로 떨어진다고 보고한다 — 성능 차이의 근원이 양방향성에 있다는 뜻이다.',
 '**INT4 무손실은 GLM 구조에 특화된 성질이다.** 논문은 이것이 GLM 특유의 가중치 분포에서 나온 성질이라고 명시하며, 다른 아키텍처(GPT류)에 그대로 일반화된다고 주장하지 않는다.'
],

figures:[
 {f:'fig2-lambada.png',
  cap:'zero-shot LAMBADA 정확도 막대그래프. GLM-130B-bi(양방향)가 80.2%로 GPT-3·OPT·BLOOM을 모두 앞서지만, 같은 모델의 GLM-130B-uni(단방향으로 attention mask만 바꾼 것)는 75.3%로 뚝 떨어진다 — 차이가 파라미터가 아니라 양방향 attention 자체에서 온다는 것을 보여준다.',
  src:'원문 Figure 2, p.3'},
 {f:'fig3-instability.png',
  cap:'왼쪽(a)은 Pre-LN 등 30여 차례의 실패한 시도 — gradient norm이 불규칙하게 치솟는다. 오른쪽(b)은 최종 채택안 비교로, Sandwich-LN(파랑)은 2500스텝 근처에서 다시 치솟지만 DeepNorm 기반 Post-LN(주황)은 낮은 값으로 안정적으로 수렴한다.',
  src:'원문 Figure 3, p.3'}
],

quotes:[
 {t:'Over the course of this effort, we face numerous unexpected technical and engineering challenges, particularly on loss spikes and divergence.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2210.02414 — GLM-130B: An Open Bilingual Pre-trained Model', u:'https://arxiv.org/abs/2210.02414'},
 {t:'THUDM/GLM-130B (GitHub)', u:'https://github.com/THUDM/GLM-130B/'}
]
});
