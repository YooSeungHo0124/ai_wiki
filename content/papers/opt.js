WIKI.paper({
slug:'opt',
venue:'arXiv 2022 (Meta AI)',
authors:'Zhang, Roller, Goyal et al. (Meta AI)',
arxiv:'2205.01068',

tldr:'[GPT-3](#/p/gpt3) 급(175B) 언어모델의 가중치를 처음으로 폭넓게 공개한 논문. 결과 자체보다 **학습 로그북을 통째로 공개**해 대형 모델 학습이 실제로 얼마나 지저분한 과정인지를 드러낸 것이 더 오래 남은 기여다.',

context:'2022년 시점 175B급 모델은 [GPT-3](#/p/gpt3), Jurassic-1, [Gopher](#/p/gopher), [PaLM](#/p/palm) 등 여럿 존재했지만 전부 API 뒤에 숨어 있거나 아예 비공개였다. 논문 저자들은 이를 "소수의 자원이 풍부한 연구소만 전체 모델에 접근할 수 있는" 상태로 규정한다. API로는 gradient도, 중간 표현도, 실패한 학습 시도도 볼 수 없어 왜 LLM이 작동하는지에 대한 연구 자체가 막혀 있었다. OPT의 목표는 새로운 아키텍처가 아니라 **GPT-3와 비슷한 성능·크기의 모델을 처음부터 끝까지 재현 가능한 형태로 공개**하는 것이었다.',

ideas:[
 {h:'가중치 공개: 125M부터 175B까지 전 구간',
  lead:'125M~66B는 즉시 전면 공개, 175B는 연구자 신청 시 접근을 허용했다.',
  d:'8개 크기의 decoder-only Transformer를 [GPT-3](#/p/gpt3)와 거의 같은 하이퍼파라미터로 학습했다. 125M부터 66B까지는 가중치를 바로 공개하고, 175B는 학계·정부·시민단체·산업 연구소 소속 연구자에게 신청을 받아 접근을 허용하는 절충안을 택했다. 완전 무제한 공개가 아니라는 점이 이후 [LLaMA](#/p/llama)의 단계적 공개 정책과 비슷한 전례가 되었다.'},
 {h:'로그북 공개: 실패까지 포함한 학습 기록',
  lead:'하드웨어 고장·손실 발산·수동 재시작을 시간순으로 기록한 로그북을 그대로 공개했다.',
  d:'175B 학습 중 하드웨어 장애로 **최소 35회의 수동 재시작**과 100대 이상의 호스트 교체가 발생했고, 자동 재시작까지 합치면 70회 이상으로 추정된다. 손실이 발산하면 학습률을 낮추고 이전 체크포인트에서 재시작하는 식으로 대응했으며, 학습률 스케줄 자체가 이런 사후 조정으로 울퉁불퉁하게 남았다(그림 참조). 논문 결과 섹션이 아니라 **운영 로그**를 논문의 일부로 취급한 최초 사례에 가깝다.'},
 {h:'탄소 발자국을 수치로 보고한다',
  lead:'992개 A100 GPU로 학습해 GPT-3 대비 **1/7 수준의 탄소 배출**을 보고했다.',
  d:'992개의 80GB A100 GPU로 학습해 GPU당 최대 147 TFLOP/s의 활용률을 달성했다. 최신 세대 하드웨어와 효율적 구현 덕분에 GPT-3 대비 1/7의 탄소 배출(CO2eq 75톤)로 175B 모델을 만들 수 있었다고 보고한다. 이 수치를 논문 초록에 명시한 것 자체가, 모델을 키우는 비용을 감추지 않고 계량화해야 한다는 규범을 만든 사례다.'},
 {h:'AdamW·FSDP 등 최신 학습 관행을 그대로 채택',
  lead:'옵티마이저는 AdamW, 병렬화는 Fully Sharded Data Parallel + Megatron 텐서 병렬을 조합했다.',
  d:'가중치 초기화·레이어 수·학습률 스케줄은 [GPT-3](#/p/gpt3)의 설정을 거의 그대로 따랐고, 대신 배치 크기를 모델 크기에 맞게 조정해 계산 효율을 높였다. Adam 상태는 FP32로 유지하되 가중치는 FP16으로 두는 혼합정밀도, 그리고 오버플로 위험을 줄이기 위한 gradient predivide 트릭 등 공학적 디테일까지 상세히 공개했다.'},
 {h:'평가는 GPT-3 재현이 목적, 새 벤치마크가 아니다',
  lead:'GPT-3 논문과 같은 프롬프트·설정으로 16개 과제를 재실행해 직접 비교했다.',
  d:'HellaSwag·PIQA·SuperGLUE 등 16개 표준 NLP 과제에서 GPT-3와 같은 프롬프트·평가 방식을 그대로 재현했다. zero-shot 평균은 GPT-3 추세를 대체로 따라가지만, few-shot(1-shot·32-shot)에서는 OPT가 GPT-3보다 낮은 경향을 보인다고 스스로 인정한다 — 공개 모델이 비공개 모델을 전 영역에서 이긴다고 과장하지 않은 점이 이례적이다.'}
],

diagram:{type:'flow', cap:'OPT가 공개한 것: 결과가 아니라 과정. 로그북이 두 번째 상자를 가능하게 한다.',
 nodes:[
  {t:'175B 학습 실행', s:'992× A100'},
  {t:'하드웨어 고장', s:'35+ 수동 재시작', acc:true},
  {t:'손실 발산 대응', s:'LR 하향·재시작'},
  {t:'로그북+가중치 공개', s:'재현 가능한 기록'}
 ]},

math:[
 {expr:'표준 크기 조정: 층수 L, 은닉차원 d, 헤드수 h를 GPT-3와 동일 스케일로',
  tex:'d_{\\text{model}} \\in \\{768,\\dots,12288\\},\\quad L \\in \\{12,\\dots,96\\}',
  d:'125M부터 175B까지 8단계 모두 [GPT-3](#/p/gpt3)와 같은 스케일링 규칙(층수·차원·헤드 수를 동시에 키움)을 따른다. 175B 모델은 96층·$d_{model}=12288$·헤드 96개로 GPT-3-175B와 사실상 동일 구성이다.'}
],

numbers:[
 {k:'최대 모델 크기', v:'175B', d:'96층 · d 12288 · 헤드 96, GPT-3-175B와 동일 구성'},
 {k:'공개 범위', v:'125M~66B 즉시 공개', d:'175B는 연구자 신청 시 접근'},
 {k:'학습 GPU', v:'992× A100 80GB', d:'147 TFLOP/s per GPU 활용률'},
 {k:'학습 데이터', v:'약 180B 토큰 (800GB)', d:'[RoBERTa](#/p/roberta)·[The Pile](#/p/the-pile)·PushShift Reddit 혼합'},
 {k:'수동 재시작', v:'35회 이상', d:'하드웨어 고장으로 2개월간 호스트 100대 이상 교체'},
 {k:'탄소 배출', v:'CO2eq 75톤', d:'GPT-3 대비 **1/7** 수준이라고 보고'}
],

impact:'OPT 이후 "175B급 모델을 공개할 수 있는가"라는 질문의 답이 "예"로 바뀌었다. 연구자들이 API 뒤가 아니라 실제 가중치·activation·gradient를 만질 수 있게 되면서 bias·toxicity·emergent capability 연구가 재현 가능한 기반 위에 서게 됐다. 동시에 **로그북 공개**라는 관행이 이후 공개 모델 프로젝트들의 표준 관례가 되기 시작했다 — 모델 카드가 "무엇을 만들었는가"를 적는다면 로그북은 "어떻게 실패했는가"를 적는다는 차이를 만들었다.',

legacy:[
 '**공개 계보의 시작점** — [BLOOM](#/p/bloom)이 다국어·거버넌스 축으로, [LLaMA](#/p/llama)가 효율·성능 축으로, [OLMo](#/p/olmo)가 데이터·학습 과정 전체 공개 축으로 이 문제의식을 이어받았다',
 '**로그북이라는 장르** — 학습 중 손실 발산·재시작 기록을 논문의 일부로 공개하는 관행이 이후 여러 오픈소스 LLM 프로젝트에서 반복됐다',
 '**탄소 발자국 보고의 정착** — 모델 카드에 CO2eq 수치를 명시하는 것이 이후 대형 모델 논문의 사실상 관례가 됐다',
 '**단계적 공개 정책의 전례** — 소형 모델은 전면 공개, 최대 모델은 신청제라는 절충이 이후 공개 정책 설계의 참고점이 됐다'
],

pitfalls:[
 '**"GPT-3와 동급"은 zero-shot 평균 얘기다.** few-shot(특히 32-shot)에서는 OPT가 GPT-3보다 낮은 경향을 논문 스스로 보고한다. 과제별 편차도 크다.',
 '**로그북이 다루는 건 인프라 실패지, 데이터·평가의 결함이 아니다.** 이후 공개된 bias·toxicity 평가에서 OPT-175B는 GPT-3 Davinci보다 더 높은 toxicity를 보이기도 했다 — "공개됐다"와 "안전하다"는 별개 축이다.',
 '**즉시 전면 공개된 것은 66B까지다.** 175B 접근은 신청·승인 절차를 거쳐야 했으므로, "OPT는 완전 오픈소스"라는 서술은 정확하지 않다.'
],

figures:[
 {f:'fig1-training-chaos.png',
  cap:'위: 실제로 쓰인 학습률 스케줄 — 매끈한 코사인 감쇠가 아니라 손실 발산 대응으로 여러 번 꺾이고 튀는 계단 모양이다. 아래: 그 조정이 검증 perplexity에 남긴 흔적. 두 그래프를 겹쳐 보면 로그북에 적힌 "몇 스텝에서 재시작했는가"가 그대로 곡선의 굴절점으로 나타난다.',
  src:'원문 Figure 1·2, p.3'},
 {f:'fig2-zeroshot.png',
  cap:'x축은 파라미터 수(로그), y축은 14개 NLP 과제 zero-shot 평균 정확도. 실선(OPT)과 점선(GPT-3)이 거의 겹치는 것이 "공개 모델도 동급 성능"이라는 핵심 주장의 근거 그래프다.',
  src:'원문 Figure 3, p.4'}
],

quotes:[
 {t:'We present Open Pre-trained Transformers (OPT), a suite of decoder-only pre-trained transformers ranging from 125M to 175B parameters, which we aim to fully and responsibly share with interested researchers.',
  src:'Abstract, p.1'},
 {t:'We are also releasing both the logbook of our model creation as well as our codebase, metaseq, which enabled training OPT-175B on 992 80GB A100 GPUs, reaching 147 TFLOP/s utilization per GPU.',
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 2205.01068 — OPT: Open Pre-trained Transformer Language Models', u:'https://arxiv.org/abs/2205.01068'},
 {t:'metaseq 코드베이스 + 학습 로그북 (GitHub)', u:'https://github.com/facebookresearch/metaseq'}
]
});
