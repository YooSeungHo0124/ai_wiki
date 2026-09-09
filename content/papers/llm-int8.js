WIKI.paper({
slug:'llm-int8',
venue:'NeurIPS 2022',
authors:'Dettmers, Lewis, Belkada, Zettlemoyer (U. Washington · Meta AI · Hugging Face)',
arxiv:'2208.07339',

tldr:'175B 모델을 성능 손실 없이 8비트로 돌리려면 **모든 값을 똑같이 다루면 안 된다**는 것을 보인 논문. 6.7B 부근에서 갑자기 나타나는 극단적 크기의 **outlier feature**가 int8 양자화를 망가뜨리는 범인임을 밝히고, 전체 차원의 0.1%뿐인 그 차원들만 fp16으로 떼어내 따로 곱하는 혼합정밀 분해로 메모리를 절반으로 줄였다.',

context:'2022년 [GPT-3](#/p/gpt3) 급 모델은 fp16으로만 350GB였다. 175B를 서빙하려면 A100 80GB가 5장 필요했고, 이는 곧 "가중치를 int8로 줄이면 절반이 된다"는 명백한 유혹으로 이어진다. 그런데 실제로 해보면 이상한 일이 벌어졌다. 350M·1.3B 모델은 int8로 바꿔도 멀쩡한데, **모델을 키울수록 성능이 무너졌고 6.7B를 넘기면 완전히 붕괴**했다. 당시 통설은 "큰 모델은 양자화에 더 민감하다" 정도의 막연한 설명이었다. 이 논문은 그 붕괴가 점진적 열화가 아니라 **특정 규모에서 일어나는 상전이(phase shift)** 이며, 원인이 극소수의 특이 차원이라는 것을 통계적으로 추적했다.',

ideas:[
 {h:'Outlier feature — 규모가 커지면 갑자기 튀어나오는 소수의 차원',
  lead:'약 6.7B에서 상전이가 일어나 소수 차원이 극단적으로 큰 값을 갖기 시작한다.',
  d:'hidden state의 어떤 **특정 feature 차원**들이 다른 차원보다 20배 이상 큰 값을 갖는 현상이다. 작은 모델에서는 일부 층에만 산발적으로 나타나다가, 논문의 관측에 따르면 **약 6.7B 파라미터에서 상전이가 일어나 모든 transformer 층과 시퀀스 차원의 75%가 영향을 받는다**. 중요한 점은 이 차원들이 랜덤하지 않고 **체계적**이라는 것이다 — 6.7B 규모에서 시퀀스당 15만 개의 outlier가 발생하지만 그것들은 전체 transformer에서 단 **6개 feature 차원**에 집중되어 있다.'},
 {h:'왜 outlier 하나가 텐서 전체를 망가뜨리는가',
  lead:'단일 스케일 상수가 이상치에 끌려가 나머지 값들의 유효 비트를 빼앗는다.',
  d:'absmax 양자화는 텐서의 최댓값을 int8의 127에 매핑한다. 한 차원의 값이 나머지보다 20배 크면 스케일 상수가 그 값에 끌려가고, 나머지 99.9%의 값은 int8 격자의 아주 좁은 구간에 뭉개진다. 즉 outlier는 **자기 자신이 아니라 주변의 평범한 값들의 유효 비트 수를 빼앗는다**. 그리고 이 outlier 차원들은 attention 스코어에 결정적으로 기여하므로, 뭉개지는 순간 모델 전체가 무너진다.'},
 {h:'벡터 단위 양자화 — 스케일 상수를 하나가 아니라 행·열마다',
  lead:'행·열마다 스케일 상수를 따로 둬 이상치의 영향을 그 행/열로 국소화한다.',
  d:'행렬 전체에 스케일 상수 하나를 쓰는 대신, **입력 hidden state의 각 행과 가중치 행렬의 각 열에 서로 다른 상수**를 부여한다. 내적 결과는 행·열 정규화 상수의 외적으로 나눠 복원한다. 이것만으로도 이상치의 영향 범위가 하나의 행/열로 국소화되지만, 6.7B 이상에서는 여전히 부족했다.'},
 {h:'혼합정밀 분해 — 0.1%만 fp16으로 떼어낸다',
  lead:'임계값을 넘는 소수 차원만 fp16으로 따로 곱하고 나머지는 int8로 처리한다.',
  d:'핵심 기여다. 임계값 $\\alpha$ 를 넘는 크기를 가진 feature 차원들만 골라 **별도의 fp16 행렬곱**으로 계산하고, 나머지 99.9%는 int8로 곱한 뒤 두 결과를 더한다. outlier 차원 집합은 소수(≈0.1%)이므로 fp16 부분의 연산량은 무시할 만하다. 논문은 $\\alpha=6.0$ 이면 성능 저하가 거의 0에 수렴한다고 보고한다. "모든 것을 저정밀로"가 아니라 **"틀리면 안 되는 곳만 고정밀로"** 라는 발상의 전환이다.'},
 {h:'학습이 아니라 로딩 시점의 변환',
  lead:'재학습·캘리브레이션 없이 기존 fp16 체크포인트를 로드하며 바로 int8로 바꾼다.',
  d:'재학습·캘리브레이션 데이터·미세조정이 필요 없다. 이미 배포된 fp16 체크포인트를 로드하면서 바로 int8로 바꿔 쓸 수 있고, 이 실용성 덕분에 `bitsandbytes` 한 줄(`load_in_8bit=True`)로 흡수되어 사실상 오픈소스 LLM 생태계의 기본 옵션이 되었다.'}
],

diagram:{type:'split', cap:'하나의 행렬곱을 두 갈래로 쪼갠다. 0.1%의 outlier 차원만 fp16, 나머지는 int8.',
 from:{t:'hidden state X', s:'s × h  (fp16)'},
 branches:[
  {t:'outlier 차원', s:'|x|>6.0 · fp16 그대로'},
  {t:'나머지 차원', s:'99.9% · 벡터단위 int8'}
 ],
 join:'두 결과를 더해 원래 출력 복원 — 메모리는 절반, 성능은 fp16과 동일'},

math:[
 {expr:'X_i8 = round( 127 · X_f16 / absmax(X_f16) )',
  tex:'X_{i8} = \\text{round}\\!\\left(\\frac{127\\cdot X_{f16}}{\\text{absmax}(X_{f16})}\\right)',
  d:'absmax 양자화. 분모가 텐서 전체의 최댓값 하나면, 그 최댓값이 이상치일 때 나머지 값들의 유효 표현 범위가 통째로 줄어든다. 벡터 단위 양자화는 이 분모를 행/열별로 따로 둔다.'},
 {expr:'C ≈ Σ_{h∈O} X_{f16}[:,h] · W_{f16}[h,:]  +  S · Σ_{h∉O} X_{i8}[:,h] · W_{i8}[h,:]',
  tex:'C \\approx \\sum_{h\\in O} X_{f16}[:,h]\\,W_{f16}[h,:] \\;+\\; S\\!\\!\\sum_{h\\notin O} X_{i8}[:,h]\\,W_{i8}[h,:]',
  d:'혼합정밀 분해의 전부다. $O$ 는 임계값 $\\alpha$ 를 넘는 outlier 차원 집합이고, $S$ 는 행·열 정규화 상수의 외적. 앞항은 차원이 극소수라 비용이 거의 없고, 뒷항이 연산의 대부분을 int8로 처리한다.'}
],

numbers:[
 {k:'상전이 지점', v:'약 6.7B 파라미터', d:'이 규모부터 **모든 층**과 시퀀스 차원의 **75%** 가 outlier의 영향을 받는다'},
 {k:'outlier 차원 비율', v:'≈0.1%', d:'나머지 **99.9%** 의 값은 8비트로 곱해진다'},
 {k:'outlier 집중도', v:'6개 feature 차원', d:'6.7B에서 시퀀스당 15만 개의 outlier가 단 6개 차원에 몰려 있다 — 랜덤이 아니라 체계적'},
 {k:'임계값 α', v:'6.0', d:'이 값이면 성능 저하가 0에 가깝다고 보고'},
 {k:'추론 메모리', v:'약 1/2', d:'fp16 대비. 175B를 소비자용 GPU가 달린 단일 서버에서 구동 가능하게 만든 수치'}
],

impact:'세 가지가 바뀌었다. **(1) 접근성** — OPT-175B·BLOOM-176B 같은 모델을 성능 손실 없이 절반의 하드웨어로 돌릴 수 있게 되면서, 대형 모델 실험이 대기업 밖으로 나왔다. **(2) 문제 정의** — "LLM 양자화의 적은 평균 오차가 아니라 소수의 극단값"이라는 프레임이 확립됐고, 이후 [GPTQ](#/p/gptq)·[AWQ](#/p/awq)는 모두 이 outlier를 어떻게 다룰 것인가에 대한 서로 다른 답변이다. **(3) 도구화** — `bitsandbytes` 구현이 Hugging Face에 통합되면서 양자화가 연구 주제에서 기본 설정으로 내려왔고, 여기서 4비트 NF4로 확장한 것이 [QLoRA](#/p/qlora)다.',

legacy:[
 '**outlier 중심 관점의 정착** — [GPTQ](#/p/gptq)는 2차 정보로 오차를 보정하고, [AWQ](#/p/awq)는 활성값 분포로 중요 채널을 스케일 보존하는 식으로, 모두 이 논문이 지목한 문제를 각자 방식으로 푼다',
 '**4비트로의 하강** — 동일 저자 계열의 NF4 양자화와 [QLoRA](#/p/qlora)가 "양자화된 모델 위에서 [LoRA](#/p/lora) 학습"이라는 조합을 열었다',
 '**활성값 양자화 분기** — 가중치만이 아니라 활성값까지 int8로 내리려는 SmoothQuant 계열이 outlier를 가중치 쪽으로 "밀어내는" 방식으로 갈라져 나왔다',
 '**서빙 스택 흡수** — bitsandbytes / [vLLM](#/p/vllm) 등 실서비스 스택이 양자화를 기본 옵션으로 제공하게 되면서, 모델 배포의 첫 질문이 "몇 비트로 돌릴까"가 되었다'
],

pitfalls:[
 '**int8이 항상 더 빠른 것은 아니다.** 이 논문의 목표는 속도가 아니라 **메모리**다. 혼합정밀 분해는 매 행렬곱마다 outlier 차원을 찾아 분리·재조립하는 오버헤드가 있어서, 작은 모델이나 배치가 작은 상황에서는 fp16보다 **느릴 수 있다**. 속도가 목적이라면 [GPTQ](#/p/gptq)/[AWQ](#/p/awq)의 전용 커널 쪽이 맞다.',
 '**"8비트니까 4비트도 그냥 되겠지"가 아니다.** LLM.int8()은 가중치와 활성값을 int8로 다루면서 outlier만 예외 처리하는 구조이고, 4비트 이하로 내려가면 격자가 너무 성겨서 이 전략만으로는 부족하다. 그래서 3~4비트 영역은 오차 보정(GPTQ)이나 스케일 재배치(AWQ)라는 다른 도구가 필요하다.',
 '**outlier는 버그가 아니라 학습된 구조다.** 이 차원들을 잘라내거나 0으로 만들면 모델이 망가진다. 논문의 관측은 "이상치를 제거하자"가 아니라 "이상치는 정보를 담고 있으니 정밀도를 지켜주자"에 가깝다.'
],

figures:[
 {f:'fig2-mixed-precision-decomposition.png',
  cap:'입력 X와 가중치 W(왼쪽, FP16)에서 노란 칸이 크기가 비정상적으로 큰 outlier 차원, 하늘색이 나머지 정상 값이다. 이 둘을 물리적으로 **분리**해서 서로 다른 경로로 보낸다 — 위 "8-bit Vector-wise Quantization" 경로는 하늘색(정상 값)만 모아 Int8로 양자화·행렬곱·역양자화하고, 아래 "16-bit Decomposition" 경로는 노란 outlier 칸만 모아 원래 정밀도(FP16) 그대로 행렬곱한다. 두 결과를 마지막에 더해(+) 하나의 FP16 출력으로 합치는 것이 이 그림의 핵심 — outlier 0.1%를 지켜주는 대가로 나머지 99.9%를 8-bit로 내릴 수 있다는 뜻이다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'This is made possible by understanding and working around properties of highly systematic emergent features in transformer language models that dominate attention and transformer predictive performance.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2208.07339 — LLM.int8(): 8-bit Matrix Multiplication for Transformers at Scale', u:'https://arxiv.org/abs/2208.07339'},
 {t:'bitsandbytes (구현체)', u:'https://github.com/bitsandbytes-foundation/bitsandbytes'},
 {t:'A Gentle Introduction to 8-bit Matrix Multiplication (Hugging Face)', u:'https://huggingface.co/blog/hf-bitsandbytes-integration'}
]
});
