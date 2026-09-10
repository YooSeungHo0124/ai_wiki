WIKI.paper({
slug:'pangu-alpha',
venue:'Technical Report, 2021 (arXiv)',
authors:"Zeng, Ren, Su, Wang et al. (Huawei Noah's Ark Lab · Peng Cheng Lab · MindSpore Team)",
arxiv:'2104.12369',

tldr:'화웨이가 2,000억 파라미터 중국어 자기회귀 언어모델을 자체 하드웨어([Ascend](https://e.huawei.com) 910)·자체 프레임워크(MindSpore)만으로 학습한 사례. **[GPT-3](#/p/gpt3) 규모의 모델이 OpenAI·NVIDIA 스택 밖에서도 재현 가능하다**는 것을 처음 보였고, 중국어 대형 코퍼스 구축과 5차원 자동 병렬화 전략을 상세히 공개했다.',

context:'2020년의 [GPT-3](#/p/gpt3)는 1,750억 파라미터로 few-shot 능력을 증명했지만 API로만 제한적으로 공개됐고, 학습 데이터의 92.6%가 영어였다. 중국어 코퍼스는 100GB급이 최대치였고([CLUECorpus2020](https://arxiv.org/) 등), 이는 GPT-3급 모델을 학습시키기엔 턱없이 부족했다. 또한 GPT-3·[Megatron](#/p/megatron)-Turing 같은 초대형 모델은 모두 NVIDIA GPU와 [Megatron](#/p/megatron)/DeepSpeed 스택 위에서 학습됐다. 화웨이의 질문은 두 가지였다 — **중국어로 GPT-3급 모델을 만들려면 얼마나 큰 코퍼스가 필요한가**, 그리고 **NVIDIA 생태계 밖(Ascend + MindSpore)에서도 2,000억 파라미터를 학습시킬 수 있는가**.',

ideas:[
 {h:'Query Layer: 다음 토큰 예측을 명시적으로 유도',
  lead:'Transformer 스택 위에 위치 임베딩을 쿼리로 쓰는 층을 하나 더 얹어 다음 토큰 생성을 직접 겨냥한다.',
  d:'표준 [GPT](#/p/gpt1) 디코더는 위치 $n$의 은닉 상태로 위치 $n+1$의 토큰을 예측한다. PanGu-α는 마지막 Transformer 층 위에 **query layer**를 추가해, 다음 위치의 위치 임베딩 $p_n$ 자체를 attention의 쿼리로 사용하고 이전 층 전체 출력을 키·값으로 삼는다. "무엇을 예측해야 하는가"라는 목표를 아키텍처에 한 겹 더 명시한 것이며, 저자들은 이 구조가 200B까지 안정적으로 스케일된다고 보고한다.'},
 {h:'80TB 원본에서 1.1TB 정제 코퍼스로',
  lead:'백과사전·전자책·뉴스·Common Crawl 80TB를 규칙 기반+모델 기반 필터링으로 1.1TB까지 정제한다.',
  d:'중국어 코퍼스는 클리닝(규칙 기반) → 필터링(작은 PanGu-α-350M 모델로 품질 점수 매김) → 퍼지 중복제거의 3단계를 거친다. 8대의 고성능 노드로 구성된 Spark/Hadoop 기반 빅데이터 플랫폼에서 20TB 클리닝에 70시간 이상이 걸렸다. **모델로 데이터를 거른다**는 이 순환 구조(작은 모델 → 필터 → 더 나은 데이터 → 다음 모델)가 이후 대형 코퍼스 구축의 표준 패턴이 됐다.'},
 {h:'5차원 자동 병렬화로 2,048개 Ascend를 하나처럼 쓴다',
  lead:'데이터·op-level·파이프라인·옵티마이저 병렬화와 rematerialization을 MindSpore Auto-parallel이 자동 결합한다.',
  d:'[Megatron](#/p/megatron)이 텐서·파이프라인 병렬화를 수동으로 코드에 짜 넣는 것과 달리, PanGu-α는 MindSpore의 **Auto-parallel** 모듈이 5가지 병렬화 차원(데이터, 연산자 단위 모델, 파이프라인, 옵티마이저, 재계산)을 표준 단일 GPU 코드에 애노테이션만 추가해 자동으로 조합한다. 200B 모델은 2,048개 Ascend 910 프로세서에서 이 조합으로 학습됐다.'},
 {h:'세 크기(2.6B/13B/200B)로 스케일링을 직접 확인',
  lead:'같은 아키텍처를 2.6B·13B·200B 세 크기로 학습해 손실·퍼플렉시티·few-shot 성능이 함께 개선됨을 보인다.',
  d:'세 모델 모두 같은 1.1TB 코퍼스, 같은 query layer 구조, 시퀀스 길이 1024로 학습됐다. 학습 손실은 2.6B가 2.64, 13B가 2.58, 200B가 2.49로 수렴했고 학습이 끝날 때도 여전히 감소 중이어서 **아직 undertrained** 상태임을 저자들이 직접 인정한다. few-shot 성능도 모델이 커질수록 대부분의 태스크에서 함께 개선됐다.'}
],

diagram:{type:'stack', cap:'PanGu-α 블록. 표준 pre-LN Transformer 스택 위에 query layer가 하나 더 얹힌다.',
 layers:[
  {t:'토큰+위치 임베딩', s:'BOS the cat sat...'},
  {t:'Transformer 층', s:'L개 pre-LN 블록', note:'MHA + FFN(GeLU)'},
  {t:'Query Layer', s:'다음 위치 임베딩이 쿼리', acc:true, note:'다음 토큰 직접 예측'},
  {t:'Softmax + CE', s:'W^o, b^o'}
 ]},

math:[
 {expr:'a_h = p_n W_h^q (W_h^k)ᵀ H_Lᵀ',
  tex:'a_h = p_n W_h^{q} (W_h^{k})^{\\top} H_L^{\\top}',
  d:'query layer의 attention score. 표준 Transformer라면 쿼리가 $H_L$ 자신에서 나오지만, 여기서는 **다음 위치의 위치 임베딩** $p_n$ 을 쿼리로 써서 "다음 토큰을 생성하라"는 목표를 어텐션 단계에 직접 주입한다.'},
 {expr:'MHA(H_{l-1}) = Σ_h Attention_h(H_{l-1}) W_h^m,   H_l^MHA = H_{l-1} + MHA(LayerNorm(H_{l-1}))',
  tex:'\\text{MHA}(H_{l-1})=\\sum_{h=1}^{N_h}\\text{Attention}_h(H_{l-1})W_h^{m},\\quad H_l^{\\text{MHA}}=H_{l-1}+\\text{MHA}(\\text{LayerNorm}(H_{l-1}))',
  d:'[Transformer](#/p/transformer)와 동일한 multi-head attention이지만 **pre-LN**(LayerNorm을 서브층 입력 전에 적용)을 채택해 200B 규모에서도 학습이 발산하지 않게 했다.'}
],

numbers:[
 {k:'최대 파라미터 수', v:'207.0B', d:'64층 · hidden 16384 · FFN 65536 · head 128 (PanGu-α 200B)'},
 {k:'학습 클러스터', v:'2,048 × Ascend 910', d:'MindSpore + CANN, 5차원 Auto-parallel'},
 {k:'정제 코퍼스', v:'1.1TB (원본 80TB)', d:'백과사전·전자책·뉴스·Common Crawl 등에서 규칙+모델 필터링'},
 {k:'BPE 어휘 크기', v:'40,000', d:'시퀀스 길이 1024로 학습'},
 {k:'학습 손실 수렴값', v:'2.49 (200B) / 2.58 (13B) / 2.64 (2.6B)', d:'세 모델 모두 학습 종료 시점까지 손실이 계속 감소 — undertrained로 저자들이 명시'},
 {k:'CPM 2.6B 대비 개선', v:'16개 태스크 중 14개(few-shot)', d:'PanGu-α 2.6B가 CPM 2.6B를 능가, 생성 태스크는 평균 +6점'}
],

impact:'영어 중심이던 초대형 언어모델 경쟁에 중국어·비(非)NVIDIA 스택이라는 두 축을 동시에 들여왔다. GPT-3급 파라미터 수를 Ascend·MindSpore라는 완전히 다른 하드웨어·소프트웨어 스택에서 재현할 수 있음을 보여, "대형 모델 학습에는 특정 벤더의 GPU·프레임워크가 필수"라는 암묵적 전제를 깼다. 동시에 80TB 원본에서 1.1TB 고품질 코퍼스를 뽑아내는 데이터 파이프라인 전체를 공개해, 이후 중국어(및 비영어권) 대형 코퍼스 구축의 참조 사례가 되었다.',

legacy:[
 '**중국어 대형 모델 계열의 시작점** — 이후 [Qwen2](#/p/qwen2), ChatGLM, ERNIE 등 중국 기업들의 자체 LLM 개발이 이어지며 PanGu-α가 제시한 데이터·병렬화 레시피가 참조됨',
 '**PanGu-Σ / PanGu-α 후속작** — 같은 팀이 MoE 구조로 확장하며 query layer 대신 표준 디코더로 회귀, query layer 자체는 후속 모델에서 널리 계승되지 않음',
 '**비NVIDIA 학습 스택의 실증** — Ascend+MindSpore, 이후 다른 자체 실리콘(TPU 기반 [PaLM](#/p/palm) 등)으로도 "GPU 없이도 초대형 모델 학습 가능"이라는 선례로 이어짐',
 '**모델 기반 데이터 필터링** — 작은 모델로 대형 코퍼스를 거르는 방식이 이후 [GPT-3](#/p/gpt3)류 데이터 파이프라인·[LLaMA](#/p/llama) 데이터 정제 관행에도 유사하게 등장'
],

pitfalls:[
 '**"200B 모델"이라는 표제만 보고 성능까지 GPT-3급이라 단정하면 안 된다.** 논문 스스로 세 모델 모두 학습 종료 시점까지 손실이 감소 중이던 **undertrained** 상태였다고 밝힌다. 파라미터 수와 실제 최적화 정도는 별개다.',
 '**few-shot 비교 대상이 CPM 2.6B 하나뿐이다.** 200B 모델을 GPT-3와 벤치마크 대 벤치마크로 직접 비교한 표는 없고, 대부분의 정량 비교는 2.6B/13B 규모에서만 이뤄졌다.',
 '**query layer는 이 논문의 독창적 기법이지만 이후 표준으로 자리잡지 않았다.** 후속 대형 모델 대부분은 표준 GPT식 디코더로 되돌아갔으므로, "PanGu 계열 = query layer"라고 일반화하면 안 된다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'맨 아래 토큰+위치 임베딩에서 시작해 녹색 Transformer 층을 쌓아 올린 뒤, 맨 위 파란 상자가 query layer다. 이 층만 다음 위치의 position embedding(우측 원 "6")을 쿼리로 받아 "mat"이라는 다음 토큰을 직접 겨냥해 예측한다.',
  src:'원문 Figure 1, p.4'}
],

quotes:[
 {t:'To promote the public research of Chinese PLMs, we propose training a very large-scale Chinese PLM named PanGu-α with number of parameters up to 200 billion.',
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 2104.12369 — PanGu-α', u:'https://arxiv.org/abs/2104.12369'},
 {t:'MindSpore', u:'https://www.mindspore.cn/en'}
]
});
