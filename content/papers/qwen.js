WIKI.paper({
slug:'qwen',
venue:'arXiv 2023 (Alibaba)',
authors:'Bai, Bai, Chu, Cui, Dang et al. (Qwen Team, Alibaba Group)',
arxiv:'2309.16609',

tldr:'Qwen 계열의 첫 기술 보고서. 3조 토큰으로 학습한 1.8B/7B/14B 베이스 모델과, [InstructGPT](#/p/instructgpt) 방식의 SFT+RLHF로 정렬한 챗 모델을 함께 내놓으면서, 152K 어휘의 다국어(특히 중국어) 토크나이저 설계를 핵심 기여로 제시한다.',

context:'2023년 하반기 [LLaMA](#/p/llama)·[LLaMA 2](#/p/llama2)가 공개 모델의 표준이 됐지만, 이들의 토크나이저는 영어 위주로 설계돼 중국어 같은 비영어권 언어를 다룰 때 토큰 수가 크게 늘어나는 문제가 있었다. 같은 문장이 더 많은 토큰으로 쪼개지면 같은 컨텍스트 길이에 담을 수 있는 실제 정보량이 줄고, 학습·추론 비용도 커진다. 이 논문은 알리바바가 자체적으로 데이터·토크나이저·아키텍처를 처음부터 설계해 이 문제를 정면으로 다룬 결과물이다.',

ideas:[
 {h:'cl100k 기반에 중국어 어휘를 증강한 152K 토크나이저',
  lead:'GPT-3.5/4와 같은 tiktoken cl100k_base에서 출발해 중국어·기타 언어 토큰을 추가한다.',
  d:'[BPE](#/p/gpt2) 기반 오픈소스 고속 토크나이저 tiktoken의 `cl100k_base` 어휘를 시작점으로 삼고, 중국어에서 자주 쓰이는 문자·단어와 다른 언어의 토큰을 추가해 최종 약 **152K** 어휘를 구성했다. 숫자는 [LLaMA](#/p/llama)를 따라 한 자리씩 쪼갠다. 그 결과 태국어·히브리어·아랍어·한국어·베트남어 등 여러 언어에서 LLaMA·Baichuan·ChatGLM2·InternLM보다 높은 압축률을 보인다(원문 Figure 3).'},
 {h:'LLaMA 골격을 유지하되 세부를 튜닝',
  lead:'RoPE·RMSNorm·SwiGLU는 유지하되, 임베딩 비공유와 QKV bias를 추가했다.',
  d:'[RoPE](#/p/rope) 위치 인코딩, Pre-Norm + RMSNorm, SwiGLU 활성화라는 [LLaMA](#/p/llama)의 기본 골격을 그대로 따르되, 입력 임베딩과 출력 projection의 가중치를 묶지 않는 `untied embedding`을 택해 메모리 비용을 감수하고 성능을 높였다. 또한 대부분의 층에서 bias를 제거하는 PaLM 방식을 따르면서도, attention의 QKV 층에는 오히려 bias를 **추가**해 외삽(extrapolation) 능력을 강화했다.'},
 {h:'추론 전용 컨텍스트 확장: NTK-aware + 동적 스케일링',
  lead:'추가 학습 없이 추론 시점에만 RoPE 베이스를 조정해 컨텍스트를 늘린다.',
  d:'2048(이후 8192) 길이로 학습한 모델을, 학습 없이 추론 시점에만 RoPE의 기본 주파수를 조정하는 `NTK-aware interpolation`으로 확장한다. 위치를 균등하게 늘리는 기존 position interpolation과 달리 고주파 성분의 손실을 막고, 여기에 스케일을 구간별로 동적으로 바꾸는 `dynamic NTK-aware interpolation`을 더해 성능 저하를 줄였다. 층에 따라 컨텍스트 확장 민감도가 다르다는 관찰도 함께 보고한다.'},
 {h:'14B가 이전 세대 13B급을 전 벤치마크에서 앞섰지만 GPT-4엔 못 미친다',
  lead:'MMLU·C-Eval·GSM8K 등 12개 벤치마크에서 이전 13B SOTA를 넘지만 GPT-3.5·4엔 아직 뒤진다.',
  d:'14B 모델이 MMLU 66.3, C-Eval 72.1, GSM8K 61.3으로 동급 이전 오픈소스 모델(InternLM-20B, Baichuan2-13B 등)을 앞서고, LLaMA 2-70B의 GSM8K 63.3·MATH 13.5에 견줄 만한 51.7·11.6~24.8 구간의 성능을 파라미터 5분의 1 규모로 낸다. 다만 저자들 스스로 GPT-3.5·GPT-4와의 격차는 인정한다(원문 Figure 2).'},
 {h:'RLHF와 도구 사용까지 포함한 정렬 파이프라인',
  lead:'SFT 위에 보상 모델을 학습시켜 RLHF로 정렬하고, 코드 인터프리터 등 도구 사용 능력을 더한다.',
  d:'SFT로 챗·도구사용·에이전트·안전 관련 큐레이션 데이터를 학습시킨 뒤, 인간 선호를 모사하는 보상 모델(RM)을 별도로 학습해 RLHF를 적용했다. 코드 인터프리터를 호출해 복잡한 계산을 수행하는 등 에이전트형 태스크에서 경쟁력을 보였고, 코드 특화 `Code-Qwen`, 수학 특화 `Math-Qwen-Chat` 파생 모델도 같은 베이스에서 함께 내놓았다.'}
],

diagram:{type:'flow', cap:'Qwen 파이프라인 — 하나의 베이스 모델에서 정렬·특화 모델이 갈라진다.',
 nodes:[
  {t:'3조 토큰', s:'웹·백과사전·책·코드'},
  {t:'BPE 152K', s:'cl100k+중국어 증강', a:'토크나이즈'},
  {t:'Qwen Base', s:'1.8B/7B/14B', acc:true},
  {t:'SFT+RLHF', s:'Qwen-Chat'},
  {t:'특화 파생', s:'Code-Qwen·Math-Qwen'}
 ]},

math:[
 {expr:'compression ratio(model) = tokens(XLM-R) / tokens(model), 기준 1.0',
  tex:'\\text{compression ratio} = \\frac{\\text{tokens}_{\\text{XLM-R}}}{\\text{tokens}_{\\text{model}}}',
  d:'XLM-R 토크나이저를 기준값 1로 놓고, 같은 문서를 몇 개의 토큰으로 쪼개는지 비교한 상대 압축률. 값이 클수록 같은 텍스트를 더 적은 토큰으로 표현한다.'}
],

numbers:[
 {k:'사전학습 데이터', v:'최대 3조 토큰', d:'웹 문서·백과사전·책·코드, 영어·중국어 위주 다국어'},
 {k:'모델 구성', v:'1.8B/7B/14B', d:'hidden 2048/4096/5120, 학습 토큰 2.2T/2.4T/3.0T — Table 1'},
 {k:'어휘 크기', v:'약 152K', d:'tiktoken cl100k_base + 중국어·다국어 토큰 증강'},
 {k:'14B MMLU (5-shot)', v:'66.3', d:'동급 최고이던 InternLM-20B(62.1) 상회 — Table 2'},
 {k:'14B GSM8K (8-shot)', v:'61.3', d:'LLaMA 2-70B(63.3)에 근접, 파라미터는 5분의 1 — Table 2'},
 {k:'학습 컨텍스트', v:'2048(사전학습) → 8192(SFT)', d:'추론 시 NTK-aware interpolation으로 추가 확장'}
],

impact:'이 보고서는 "다국어, 특히 중국어를 잘 다루려면 토크나이저 설계부터 다시 해야 한다"는 것을 구체적인 압축률 비교로 보여줬고, 이후 알리바바의 후속 시리즈([Qwen2](#/p/qwen2), [Qwen2.5](#/p/qwen25), [Qwen3](#/p/qwen3))가 이 데이터·토크나이저·정렬 파이프라인을 이어받아 확장하는 출발점이 됐다. 오픈 가중치 생태계에서 LLaMA 계열과 별개로 다국어 성능을 앞세운 대안 계보를 만든 사례이기도 하다.',

legacy:[
 '[Qwen2](#/p/qwen2)가 [GQA](#/p/gqa)와 [RoPE](#/p/rope) 개선을 더해 이 보고서의 구조를 확장',
 '[Qwen2.5](#/p/qwen25)가 데이터·정렬 파이프라인을 대규모로 재현·확대',
 '[Qwen3](#/p/qwen3)이 이 계보를 [DeepSeek-V3](#/p/deepseek-v3) 수준의 최신 아키텍처와 결합',
 '다국어 토크나이저 압축률 비교라는 평가 방식이 이후 중국어권 LLM 보고서들의 표준 비교 축이 됨'
],

pitfalls:[
 '**데이터 구성 비율이 공개되지 않는다.** "웹 문서·백과사전·책·코드"라고만 밝히고 각 소스의 정확한 비율이나 필터링 임계값은 기술 보고서에 나오지 않는다 — 재현하려는 연구자가 부딪히는 전형적인 한계다.',
 '**RLHF 보상 모델·정책 학습의 세부 하이퍼파라미터가 제한적으로만 공개된다.** SFT 데이터 규모나 RM 학습 데이터셋 구성은 개략적으로만 서술된다.',
 '**"14B가 LLaMA2-70B에 필적한다"는 벤치마크별로 다르다.** GSM8K는 근접하지만 MATH·C-Eval 등에서는 격차가 벤치마크마다 다르게 벌어지므로, 단일 숫자로 "동급"이라 단정하면 안 된다.'
],

figures:[
 {f:'fig2-radar.png',
  cap:'12개 벤치마크를 방사형으로 배치한 레이더 차트. 빨간 선(Qwen-14B)이 초록 선(이전 13B급 SOTA)을 거의 모든 축에서 감싸지만, 주황 점선(GPT-4)에는 MMLU·GSM8K·HumanEval 등 여러 축에서 아직 못 미친다.',
  src:'원문 Figure 2, p.5'},
 {f:'fig3-compression.png',
  cap:'막대가 낮을수록 같은 문서를 더 적은 토큰으로 표현한다는 뜻. 분홍색(Qwen)이 태국어(th)·히브리어(he)·아랍어(ar) 등 비영어권 언어 대부분에서 LLaMA·Baichuan·ChatGLM2·InternLM보다 낮은 막대(= 높은 압축률)를 보인다.',
  src:'원문 Figure 3, p.6'}
],

quotes:[
 {t:'The final vocabulary size is approximately 152K.',
  src:'Section 2.2, p.6'}
],

links:[
 {t:'arXiv 2309.16609 — Qwen Technical Report', u:'https://arxiv.org/abs/2309.16609'},
 {t:'GitHub — QwenLM/Qwen', u:'https://github.com/QwenLM/Qwen'}
]
});
