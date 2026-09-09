WIKI.paper({
slug:'codellama',
venue:'arXiv 2023 (Meta AI)',
authors:'Rozière, Gehring, Gloeckle et al. (Meta AI)',
arxiv:'2308.12950',

tldr:'[Llama 2](#/p/llama2)에서 시작해 코드 데이터로 이어 학습(500B~1T 토큰)한 모델 계열. **infilling(FIM) 목적함수**로 코드 중간을 채우는 능력을 얻고, RoPE 기저 주기를 조정하는 **장문맥 fine-tuning**으로 문맥을 4K에서 최대 100K 토큰까지 늘렸다. 7B·13B·34B·70B 크기에 기본형·Python 특화형·Instruct형 세 갈래를 낸다.',

context:'2023년 여름 시점, 공개 코드 모델의 두 축은 [StarCoder](#/p/starcoder)(The Stack로 처음부터 학습, FIM 지원)와 범용 [Llama 2](#/p/llama2)(코드 능력은 부수적)였다. StarCoder는 코드 전용이라 15.5B가 상한이었고, Llama 2는 일반 텍스트 위주라 HumanEval 성능이 낮았다. Code Llama의 질문은 단순하다 — **이미 2T 토큰으로 잘 학습된 범용 모델을 처음부터 다시 만들 필요 없이, 코드로 이어 학습(continued pretraining)하면 되지 않는가.** 여기에 실무에서 요구되는 두 기능, 즉 IDE 자동완성에 필요한 **중간 채우기(infilling)**와 저장소 전체를 보는 **긴 문맥**이 빠져 있었다는 것이 이 논문의 출발점이다.',

ideas:[
 {h:'코드로 이어 학습(continued pretraining)',
  lead:'Llama 2 가중치에서 시작해 코드 비중 85%의 데이터로 500B~1T 토큰을 더 학습한다.',
  d:'7B·13B·34B는 500B 토큰, 70B는 1T 토큰을 추가로 학습한다. 데이터의 8%는 코드 관련 자연어(토론·설명)이고 나머지는 근접중복 제거한 공개 코드다. 처음부터 코드만으로 학습한 [StarCoder](#/p/starcoder)와 달리, Llama 2가 이미 가진 자연어 이해·지시 따르기 능력을 그대로 물려받는 것이 핵심 차이다.'},
 {h:'FIM: 중간을 채우는 학습',
  lead:'문서를 무작위로 세 조각 내 (prefix, suffix, middle) 순서로 재배열해 causal LM으로 학습한다.',
  d:'IDE 자동완성은 "커서 앞뒤 코드가 모두 있고 커서 위치를 채우는" 문제인데, 일반 autoregressive 학습은 이를 지원하지 못한다. [StarCoder](#/p/starcoder)와 같은 PSM(prefix-suffix-middle) 방식의 FIM을 7B·13B·70B에 적용하고 34B는 제외했다. FIM은 autoregressive 성능에는 거의 영향이 없지만 HumanEval/MBPP pass@k를 소폭 깎는 트레이드오프가 있다.'},
 {h:'RoPE 기저 주기 조정으로 문맥 확장',
  lead:'RoPE의 회전 기저 $\\theta$ 를 10,000에서 1,000,000으로 올려 16K 문맥에 맞춰 재학습한다.',
  d:'Llama 2는 4,096 토큰까지만 학습됐다. Code Llama는 이를 16,384 토큰 시퀀스로 별도의 장문맥 fine-tuning(LCFT) 단계를 두고, position interpolation처럼 주파수를 선형으로 낮추는 대신 **회전의 기저 주기 자체를 늘린다.** 그 결과 학습에 쓴 16K를 넘어 100K 토큰까지도 perplexity가 계속 낮아지는 외삽 능력을 보였다.'},
 {h:'세 갈래 특화: 기본형 · Python · Instruct',
  lead:'같은 파이프라인에서 Python 전용 100B 토큰 추가 학습과 지시 fine-tuning으로 갈라진다.',
  d:'Code Llama - Python은 범용 코드 500B 위에 Python 편중 데이터 100B를 더 학습해 단일 언어 특화의 이득을 검증한다. Code Llama - Instruct는 사람이 작성한 지시 데이터에 더해, Llama 2로 문제를 만들고 Code Llama로 유닛테스트·정답을 생성해 자체 검증하는 **self-instruct** 데이터(약 14,000개)로 안전성·정렬을 개선한다.'},
 {h:'70B는 별도 계보',
  lead:'70B는 다른 세 크기보다 몇 달 늦게, 2배 토큰(1T)으로 학습됐고 LCFT는 기본형에만 적용됐다.',
  d:'Code Llama - Instruct 70B는 34B 이하와 달리 Code Llama가 아니라 **Code Llama - Python 70B에서 이어 학습**됐는데, Python 70B가 MultiPL-E 평균에서 기본형 70B보다 오히려 더 나았기 때문이다. 크기가 커질수록 학습 레시피가 균일하지 않다는 점을 보여준다.'}
],

diagram:{type:'flow', cap:'Code Llama 특화 파이프라인(논문 Figure 2 요약). 화살표를 따라 토큰 수만큼 이어 학습하며 세 갈래로 갈라진다.',
 nodes:[
  {t:'Llama 2', s:'7B/13B/34B'},
  {t:'코드 학습 + FIM', s:'500B 토큰', acc:true},
  {t:'장문맥 FT', s:'20B, RoPE θ↑'},
  {t:'Instruct FT', s:'5B, self-instruct'},
  {t:'Python 학습', s:'100B → 장문맥 20B'}
 ]},

math:[
 {expr:'R(theta,n) = [[cos nθ_i, -sin nθ_i], [sin nθ_i, cos nθ_i]],  θ_i = θ^(-2i/d)',
  tex:'R_{\\Theta,n}^{d}\\big|_i=\\begin{pmatrix}\\cos n\\theta_i & -\\sin n\\theta_i\\\\ \\sin n\\theta_i & \\cos n\\theta_i\\end{pmatrix},\\quad \\theta_i=\\theta^{-2i/d}',
  d:'RoPE는 위치 $n$ 마다 쿼리·키 벡터를 이 블록 대각 회전행렬로 돌린다. 회전 속도를 정하는 기저 $\\theta$ 를 원래 Llama 2의 10,000에서 **1,000,000으로 늘리면** 같은 위치 차이에도 회전각이 작아져, 먼 거리 토큰 사이의 attention 감쇠가 줄고 짧은 거리에 치우치던 편향이 완화된다.'}
],

numbers:[
 {k:'모델 크기', v:'7B / 13B / 34B / 70B', d:'세 갈래(기본·Python·Instruct) 전부 동일 크기 라인업'},
 {k:'추가 학습 토큰', v:'500B (70B는 1T)', d:'Llama 2 가중치에서 이어 학습, 코드 비중 약 85%'},
 {k:'문맥 길이', v:'16,384 → 100,000', d:'장문맥 fine-tuning은 16K로 학습, 100K까지 perplexity 감소 확인'},
 {k:'RoPE 기저 θ', v:'10,000 → 1,000,000', d:'장문맥 fine-tuning 시 회전 기저 주기를 100배로'},
 {k:'HumanEval pass@1', v:'53.0% (70B) / 33.5% (7B)', d:'Llama 2 70B(30.5%)를 7B 모델조차 앞섬(Python 34.8%)'},
 {k:'MBPP pass@1 최고', v:'65.0%', d:'초록에서 밝힌 HumanEval 67% · MBPP 65% 최고 스코어(Unnatural/Instruct 계열 포함)'}
],

impact:'Code Llama는 "코드 모델은 처음부터 코드로만 학습해야 한다"는 전제를 깨고, **범용 LLM을 코드로 이어 학습하는 것이 더 싸고 강하다**는 것을 보였다. 이후 오픈소스 코드 모델 다수가 이 레시피 — 범용 기반 모델 위에 코드 continued pretraining + FIM + 장문맥 fine-tuning — 를 그대로 따랐다. RoPE 기저 주기 조정은 이후 여러 장문맥 LLM의 표준 기법이 되었고, self-instruct로 코드 문제·정답·테스트를 자체 생성해 검증하는 데이터 파이프라인은 이후 코드 Instruct 모델들의 기본 패턴이 됐다.',

legacy:[
 '**이어 학습 레시피의 표준화** — 범용 모델 + 코드 continued pretraining 방식이 이후 [DeepSeek-Coder](#/p/deepseek-coder) 등 여러 코드 모델의 출발점이 됨',
 '**RoPE 기저 조정** — θ를 늘려 문맥을 늘리는 기법이 Code Llama 이후 장문맥 LLM 전반의 표준 관행으로 정착',
 '**FIM의 정착** — [StarCoder](#/p/starcoder)가 처음부터 학습에 넣었던 FIM을, 이어 학습 단계에서도 별도 손실 없이 끼워 넣을 수 있음을 보여 IDE 통합 코드 모델의 기본 요건이 됨',
 '**self-instruct 코드 데이터** — 모델이 문제·테스트·정답을 스스로 만들고 검증하는 파이프라인이 이후 코드 Instruct 모델 학습의 관행으로 확산'
],

pitfalls:[
 '**"코드 전용으로 학습한 StarCoder보다 항상 우월하다"는 아니다.** 같은 크기대에서 비교하면 이득이 있지만, Code Llama는 Llama 2의 2T 토큰 사전학습 비용을 이미 깔고 가는 모델이라 총 학습 비용 비교가 아니다.',
 '**34B는 FIM이 없다.** 세 갈래(7B/13B/70B)만 infilling을 지원하고 34B 기본형과 Python 계열은 지원하지 않는다는 점을 놓치기 쉽다.',
 '**장문맥은 공짜가 아니다.** 장문맥 fine-tuning(LCFT)은 짧은 시퀀스에서 HumanEval pass@1 −0.52%p, MBPP −1.9%p 정도의 성능 손실을 대가로 한다.'
],

figures:[
 {f:'fig2-pipeline.png',
  cap:'왼쪽 Llama 2에서 시작해 "코드 학습(500B, infilling 포함)" 이후 위쪽 경로는 장문맥 fine-tuning(20B) → Instruct fine-tuning(5B)으로 이어져 Code Llama와 Code Llama - Instruct가 되고, 아래쪽 경로는 Python 코드 학습(100B) → 장문맥 fine-tuning(20B)으로 이어져 Code Llama - Python이 된다. 상자 아래 숫자가 해당 단계에서 본 토큰 수.',
  src:'원문 Figure 2, p.3'},
 {f:'fig4a-longctx-ppl.png',
  cap:'x축이 문맥 길이(×1000 토큰), y축이 perplexity. 점선이 장문맥 fine-tuning에 쓴 16K 지점. 세 크기(7B/13B/34B) 모두 16K를 훨씬 넘어 100K 근처까지 perplexity가 계속 낮아진다 — 학습 길이를 넘어서면 성능이 무너지는 일반적인 transformer 외삽 실패와 대비된다.',
  src:'원문 Figure 4(a), p.12'}
],

quotes:[
 {t:'We release Code Llama, a family of large language models for code based on Llama 2 providing state-of-the-art performance among open models, infilling capabilities, support for large input contexts, and zero-shot instruction following ability for programming tasks.',
  src:'Abstract, p.1'},
 {t:'Rotation frequencies are computed as θi = θ−2i/d, and we increase the base period θ from 10,000 to 1,000,000 for fine-tuning.',
  src:'Section 2.4, p.2'}
],

links:[
 {t:'arXiv 2308.12950 — Code Llama: Open Foundation Models for Code', u:'https://arxiv.org/abs/2308.12950'},
 {t:'Meta AI — Code Llama 발표', u:'https://ai.meta.com/blog/code-llama-large-language-model-coding/'},
 {t:'GitHub — facebookresearch/codellama', u:'https://github.com/facebookresearch/codellama'}
]
});
