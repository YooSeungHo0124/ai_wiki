WIKI.paper({
slug:'adapter',
venue:'ICML 2019',
authors:'Houlsby et al. (Google Research · Jagiellonian University)',
arxiv:'1902.00751',

tldr:'사전학습 모델의 가중치를 통째로 얼려두고, 각 Transformer 층 사이에 **작은 병목 모듈(adapter)만 끼워 넣어 학습**하는 방식. 태스크당 3.6%의 파라미터만 추가하고도 [BERT](#/p/bert) 전체 미세조정 대비 GLUE 점수 0.4% 이내를 유지했다. "태스크마다 모델 사본 하나"라는 전제를 처음으로 정면 공격한 논문이다.',

context:'[BERT](#/p/bert) 이후의 표준 레시피는 "대규모 사전학습 → 다운스트림 태스크마다 전체 미세조정"이었다. 성능은 좋지만 회계가 끔찍하다. 태스크가 $N$ 개면 **110M 파라미터짜리 모델 사본이 $N$ 개** 생긴다. 태스크가 하나 추가될 때마다 수백 MB의 체크포인트가 늘고, 서빙 시에는 그 모두를 메모리에 올리거나 스와핑해야 한다. 당시의 대안은 마지막 층만 학습하는 **feature-based** 방식이었는데, 이건 파라미터는 아끼지만 정확도가 눈에 띄게 떨어졌다. 이 논문의 질문은 이것이다 — **전체 미세조정의 성능을 유지하면서 태스크당 저장 비용만 1/30로 줄일 수 있는가?**',

ideas:[
 {h:'층 사이에 병목 모듈을 삽입한다',
  lead:'sublayer 출력 뒤에 d→m→d로 줄였다 펴는 작은 모듈만 새로 끼워 학습한다.',
  d:'Transformer 블록의 각 sublayer(attention, FFN) **출력 직후, residual 합산 직전**에 adapter를 하나씩 넣는다. adapter는 $d$ 차원을 $m$ 차원으로 눌렀다가($m \\ll d$) 비선형을 거쳐 다시 $d$ 로 펴는 두 개의 선형 층이다. 원래 모델의 가중치는 단 하나도 건드리지 않고, 학습되는 것은 이 얇은 모듈과 LayerNorm 파라미터뿐이다.'},
 {h:'항등 함수 근처에서 시작하도록 초기화한다',
  lead:'투영 행렬을 0 근처로 초기화해 학습 시작 시점엔 항등 함수처럼 동작하게 한다.',
  d:'adapter가 학습 초기부터 큰 값을 뱉으면 사전학습으로 얻은 표현이 망가진다. 그래서 두 투영 행렬을 **거의 0에 가깝게** 초기화하고 residual 연결을 걸어, 학습 시작 시점의 adapter가 사실상 항등 함수가 되게 만든다. 학습이 진행되면서 필요한 만큼만 원래 표현에서 벗어난다. 이 "0에서 출발하는 residual 모듈"이라는 설계는 이후 [LoRA](#/p/lora)까지 그대로 계승된다.'},
 {h:'병목 차원 $m$ 하나로 성능–용량을 조절한다',
  lead:'병목 차원 $m$ 하나만 조절해도 태스크 적응에 필요한 자유도가 충분히 나온다.',
  d:'adapter의 파라미터 수는 층당 대략 $2md + d + m$ 이다. $m$ 을 키우면 표현력이 늘고 저장 비용도 는다. 논문은 $m$ 을 바꿔가며 전체의 **0.5%~8%** 범위를 훑었고, 8배 넘는 구간에서도 성능이 완만하게만 변한다는 것을 보였다 — 즉 태스크 적응에 필요한 자유도가 생각보다 훨씬 작다는 실증이다.'},
 {h:'태스크가 늘어도 이전 태스크를 다시 안 봐도 된다',
  lead:'백본을 공유하고 태스크별 델타를 완전히 분리해 파국적 망각을 구조적으로 없앤다.',
  d:'백본이 공유되고 태스크별 델타가 완전히 분리돼 있으므로, 새 태스크를 추가할 때 기존 태스크의 데이터나 성능을 신경 쓸 필요가 없다. 멀티태스크 학습이나 순차 미세조정에서 고질적인 **파국적 망각(catastrophic forgetting)** 문제가 구조적으로 사라진다. 논문은 26개 텍스트 분류 태스크에 이 성질을 실증했다.'}
],

diagram:{type:'stack', cap:'Adapter가 삽입된 Transformer 블록. Multi-Head Attention과 Feed-Forward는 얼려져 있고(frozen), 학습되는 것은 강조된 두 Adapter 모듈과 LayerNorm뿐이다.',
 layers:[
  {t:'입력 x', s:'n × d'},
  {t:'Self-Attention', s:'frozen'},
  {t:'Adapter', s:'d→m→d, m≈8~256', acc:true, note:'← 학습되는 부분'},
  {t:'Add & Norm', s:'LN만 학습'},
  {t:'Feed-Forward', s:'frozen, d→4d→d'},
  {t:'Adapter', s:'별도 파라미터', acc:true},
  {t:'Add & Norm', s:'→ 다음 블록'}
 ]},

math:[
 {expr:'Adapter(h) = h + W_up · σ( W_down · h ),   W_down ∈ R^{m×d},  W_up ∈ R^{d×m}',
  tex:'\\text{Adapter}(h) = h + W_{\\text{up}}\\,\\sigma(W_{\\text{down}}\\,h),\\quad W_{\\text{down}}\\in\\mathbb{R}^{m\\times d},\\ W_{\\text{up}}\\in\\mathbb{R}^{d\\times m}',
  d:'다운 투영 → 비선형 → 업 투영에 residual을 더한 것이 전부다. $W_{up}$ 을 0 근처로 초기화하면 초기 출력이 $h$ 와 같아진다.'},
 {expr:'파라미터 수 ≈ 2md + d + m   (층·sublayer 당)',
  tex:'\\text{params} \\approx 2md + d + m \\quad(\\text{sublayer당})',
  d:'$m \\ll d$ 이므로 원래 sublayer의 $O(d^2)$ 에 비해 무시할 만하다. $d=768$, $m=64$ 이면 sublayer당 약 10만 개.'}
],

numbers:[
 {k:'GLUE 성능 격차', v:'0.4% 이내', d:'BERT-Large 전체 미세조정 대비'},
 {k:'태스크당 추가 파라미터', v:'3.6%', d:'전체 미세조정은 정의상 **100%**'},
 {k:'평가 태스크 수', v:'26개', d:'GLUE 포함 다양한 텍스트 분류'},
 {k:'탐색한 adapter 크기', v:'전체의 0.5% ~ 8%', d:'이 구간에서 성능 변화가 완만'}
],

impact:'"미세조정 = 모델 전체 복제"라는 암묵적 전제를 깨고 **PEFT(parameter-efficient fine-tuning)** 라는 연구 계열을 열었다. 백본은 하나, 태스크별 델타는 수 MB — 이 회계 구조가 이후 모든 PEFT 방법의 공통 골격이 되었다. 동시에 이 논문은 중요한 부작용도 함께 남겼다. adapter는 **네트워크에 층을 실제로 더 쌓는 것**이라 추론 시 순차 연산이 늘고, 특히 배치가 작고 모델 병렬이 걸린 서빙 환경에서 지연이 눈에 띄게 증가한다. 이 단점을 정면으로 지목하며 나온 것이 [LoRA](#/p/lora)다.',

legacy:[
 '**PEFT 계열의 출발점** — [Prefix-Tuning](#/p/prefix-tuning), [LoRA](#/p/lora), [QLoRA](#/p/qlora)로 이어지는 "백본 동결 + 작은 델타" 패러다임의 원형',
 '**추론 지연이라는 반례** — adapter의 직렬 구조가 남긴 지연 문제가 LoRA의 "병합 가능한 델타"라는 설계 동기를 직접 만들어냈다',
 '**모듈 조합 연구** — AdapterFusion, AdapterHub 등 태스크별 adapter를 언어·도메인 단위로 갈아끼우고 합성하는 흐름으로 확장',
 '**멀티태스크 서빙** — 백본 하나에 태스크별 경량 모듈을 얹는 구조는 오늘날 다중 테넌트 LLM 서빙([vLLM](#/p/vllm)의 멀티 LoRA 등)의 원리 그대로다'
],

pitfalls:[
 '**"파라미터가 적으니 학습도 빠르다"는 오해다.** 역전파는 여전히 네트워크 전체를 통과해야 하므로 forward/backward 연산량은 거의 줄지 않는다. 절약되는 것은 **옵티마이저 상태와 체크포인트 저장 공간**이지 계산 시간이 아니다.',
 '**adapter는 추론 시 제거하거나 병합할 수 없다.** 비선형이 끼어 있어 원래 가중치에 흡수시킬 방법이 없고, 그래서 배포 시 항상 추가 지연을 안고 간다. 지연에 민감한 서비스라면 [LoRA](#/p/lora) 쪽이 맞다.',
 '**adapter는 학습률에 민감하다.** 전체 미세조정보다 훨씬 큰 학습률(보통 $10^{-4}$ 대)이 필요한 경우가 많아, 전체 미세조정 하이퍼파라미터를 그대로 옮기면 학습이 거의 진행되지 않는 것처럼 보인다.'
],

figures:[
 {f:'fig2-adapter-architecture.png',
  cap:'왼쪽이 하나의 Transformer 레이어. 원래 있던 "Multi-headed attention"과 "Feed-forward layer" 바로 뒤, skip-connection이 다시 합쳐지기 **전**에 회색 "Adapter" 박스가 직렬로 끼어든 것이 보인다(레이어당 두 번). 오른쪽이 그 Adapter 내부 — 위아래 원(○)이 원래 차원 $d$, 가운데 두 원이 훨씬 작은 병목 차원 $m$이다. Feedforward down-project로 $d \\to m$ 으로 줄였다가 비선형을 거쳐 up-project로 다시 $d$ 로 늘리고, 맨 위에서 skip-connection(+)과 더해진다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'On GLUE, we attain within 0.4% of the performance of full fine-tuning, adding only 3.6% parameters per task.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1902.00751 — Parameter-Efficient Transfer Learning for NLP', u:'https://arxiv.org/abs/1902.00751'},
 {t:'AdapterHub — adapter 구현과 사전학습 모듈 저장소', u:'https://adapterhub.ml/'},
 {t:'Hugging Face PEFT 문서', u:'https://huggingface.co/docs/peft'}
]
});
