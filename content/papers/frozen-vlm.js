WIKI.paper({
slug:'frozen-vlm',
venue:'arXiv 2021 (DeepMind)',
authors:'Tsimpoukelli, Menick, Cabi et al. (DeepMind)',
arxiv:'2106.13884',

tldr:'거대 언어모델의 가중치를 **완전히 얼린 채**, 이미지를 언어모델이 이미 이해하는 연속 임베딩 시퀀스("visual prefix")로 바꾸는 작은 비전 인코더 하나만 학습한다. 캡션 생성만으로 학습했는데도 VQA·지식 질의·새 단어 학습까지 few-shot으로 전이된다.',

context:'2021년 [GPT-3](#/p/gpt3)는 텍스트만으로도 프롬프트 몇 개를 보여주면 새 태스크를 배우는 few-shot 능력을 보였지만, 언어모델은 이미지를 전혀 볼 수 없었다. 한편 [CLIP](#/p/clip)처럼 이미지와 텍스트를 정렬하는 모델들은 분류·검색에는 강했지만 자유 형식 텍스트를 생성하거나 새 태스크를 few-shot으로 배우지는 못했다. 언어모델을 처음부터 vision-language로 다시 사전학습하려면 수십억 장의 이미지-텍스트 쌍과 막대한 연산이 필요하다. 이 논문의 질문은 **이미 학습된 거대 언어모델의 few-shot 능력을 건드리지 않고 그대로 시각 영역으로 옮길 수 있는가**이다.',

ideas:[
 {h:'언어모델은 얼리고 비전 인코더만 학습',
  lead:'이미지-캡션 쌍으로 vision encoder만 학습하고 언어모델 가중치는 절대 갱신하지 않는다.',
  d:'Conceptual Captions(이미지-캡션 약 300만 쌍)로 캡션의 negative log-likelihood를 최소화하도록 학습하되, 역전파되는 그래디언트는 **언어모델의 self-attention 층을 그대로 통과**해 비전 인코더 파라미터 φ에만 도달한다. 언어모델 파라미터 θ는 갱신하지 않는다. 저자들은 이 방식을 [prefix tuning](#/p/prefix-tuning)을 이미지·텍스트가 섞인 순서열로 확장한 것으로 설명한다.'},
 {h:'Visual prefix: 이미지를 프롬프트 토큰처럼 취급',
  lead:'비전 인코더 출력을 선형 변환해 언어모델 토큰과 같은 차원의 임베딩 n개로 만든다.',
  d:'비전 인코더(NF-ResNet-50) 출력을 `D×n` 채널로 선형 매핑한 뒤 `n`개의 D차원 임베딩으로 reshape한다. 이 시퀀스가 텍스트 토큰 임베딩과 똑같은 자리에서 언어모델에 들어간다는 점이 핵심이다 — 언어모델 입장에서는 이미지든 텍스트든 그냥 앞쪽에 놓인 임베딩 시퀀스일 뿐이다. prefix 토큰 수는 1·2·4를 실험했고 2개가 가장 좋았다.'},
 {h:'학습은 캡셔닝뿐인데 in-context few-shot이 전이된다',
  lead:'단일 이미지-캡션 쌍으로만 학습했지만 추론 시 여러 이미지·텍스트를 이어 붙여 넣을 수 있다.',
  d:'학습은 항상 이미지 하나 + 캡션 하나 쌍으로 이뤄지지만, 언어모델이 원래 임의 길이의 프롬프트를 다루도록 설계돼 있어서 추론 시에는 여러 이미지와 질문-답변 예시를 원하는 순서로 이어 붙일 수 있다. 상대 위치 인코딩을 쓰기 때문에 이미지가 항상 맨 앞에 있지 않아도, 이미지가 여러 장이어도 일반화된다.'},
 {h:'태스크 유도(task induction)와 shot 수를 분리해서 정의',
  lead:'"몇 장 보여줬나"와 "무슨 설명을 붙였나"를 별도 축으로 통제해 효과를 분리한다.',
  d:'저자들은 few-shot 실험을 셋으로 분해한다 — task induction(과제를 말로 설명하는 문장), number of shots(완전한 예시 개수), 그리고 이미지 분류에서는 inner-shot(같은 범주의 다른 사례 수)과 repeat(같은 사례의 반복 횟수)까지 나눈다. 이렇게 쪼갠 덕에 "다른 예시를 보여주는 것"이 "같은 예시를 반복하는 것"보다 실제로 더 효과적이라는 것을 보일 수 있었다.'}
],

diagram:{type:'flow', cap:'학습 시 그래디언트는 언어모델의 self-attention 층을 그대로 통과해 비전 인코더로만 흐른다(언어모델 자체는 갱신되지 않음).',
 nodes:[
  {t:'이미지', s:'224×224'},
  {t:'Vision Encoder', s:'NF-ResNet-50', acc:true, a:'학습됨'},
  {t:'선형 매핑', s:'D×n 채널 → reshape'},
  {t:'Visual Prefix', s:'n=2 임베딩, 토큰과 동일 차원'},
  {t:'Frozen LM', s:'7B, self-attention', note:'가중치 고정'}
 ]},

math:[
 {expr:'log p(y|x) = Σ_l log p(y_l | i_1..i_n, y_1..y_{l-1})',
  tex:'\\log p_{\\theta,\\varphi}(y\\mid x)=\\sum_{l}\\log p_{\\theta,\\varphi}\\bigl(y_l \\mid i_1,\\dots,i_n,\\,y_1,\\dots,y_{l-1}\\bigr)',
  d:'캡션 $y$의 로그우도를 이미지에서 뽑은 prefix 임베딩 $i_1,\\dots,i_n$(비전 인코더 $v_\\varphi$의 출력)을 조건으로 계산한다. 이 목적함수를 최대화하는 파라미터는 비전 인코더 $\\varphi$뿐이고, 언어모델 파라미터 $\\theta$는 미분은 흘려보내되 갱신에서는 제외된다.'}
],

numbers:[
 {k:'언어모델', v:'7B 파라미터', d:'DeepMind 자체 Transformer, C4에서 사전학습(비교용 400M 소형 모델도 병행 실험) — [GPT-3](#/p/gpt3)가 아니다'},
 {k:'비전 인코더', v:'NF-ResNet-50', d:'global pooling 후 최종 벡터를 사용 — [CLIP](#/p/clip)이 아니라 이미지-캡션 쌍으로 처음부터 학습'},
 {k:'VQAv2 zero-shot → 4-shot', v:'29.5% → 38.2%', d:'예시 없이도 zero-shot 전이가 되고, 4개 예시만으로 SGD 풀학습(48.4%) 대비 격차를 절반 가까이 좁힌다'},
 {k:'OKVQA (7B, 0/1/4-shot)', v:'5.9 / 9.7 / 12.6%', d:'외부 지식이 필요한 질의에서도 shot 수가 늘수록 성능이 오름'},
 {k:'OKVQA, 400M 소형 LM', v:'4.0 / 5.9 / 6.6%', d:'같은 조건에서 언어모델 크기만 줄이면 성능이 낮아짐 — 지식은 언어모델 사전학습에서 온다는 증거'},
 {k:'Open-Ended miniImageNet 2-way', v:'53.4→58.9% (1→5 inner-shot)', d:'무작위 추정 50%; 새 단어(dax·blicket)를 이미지 몇 장으로 가르치고 바로 그 단어로 답하게 한 결과'}
],

impact:'Frozen은 "vision-language 모델은 이미지와 텍스트를 처음부터 같이 사전학습해야 한다"는 당시 전제를 깨고, **잘 학습된 언어모델은 건드리지 않고 시각 어댑터만 학습해도 few-shot 능력이 전이된다**는 것을 처음 보였다. 학습 비용은 대형 비전-언어 사전학습에 비해 훨씬 작다 — 캡션 데이터 300만 쌍과 비전 인코더 하나의 학습만 필요하다. 다만 저자들 스스로도 밝히듯 VQA·OKVQA 절대 성능은 SGD로 파인튜닝한 당대 SOTA(Oscar 73.8%, MAVEx 39.4%)에 크게 못 미친다 — 이 논문의 기여는 최고 성능이 아니라 **얼린 언어모델에서 few-shot 능력이 새어나온다는 존재 증명**이다.',

legacy:[
 '**"얼린 LLM + 시각 어댑터" 계보의 출발점** — [Flamingo](#/p/flamingo)가 gated cross-attention으로, [BLIP-2](#/p/blip2)가 Q-Former로, [LLaVA](#/p/llava)가 선형 projection으로 각자 다른 어댑터를 붙였지만 뼈대(LM은 고정, 어댑터만 학습)는 Frozen에서 시작한다',
 '**visual prefix라는 개념 자체가 이후 표준어가 됨** — 이미지를 토큰 임베딩 시퀀스로 바꿔 LM 프롬프트에 얹는 방식은 지금도 대부분의 멀티모달 LLM이 쓰는 기본 인터페이스다',
 '**in-context 멀티모달 few-shot 평가 프로토콜을 제시** — shot 수·task induction·inner-shot을 분리한 실험 설계가 이후 Flamingo 등의 평가 방식에 이어짐',
 '**규모가 지식을 결정한다는 관찰** — 7B vs 400M 비교로 "언어모델을 키우면 시각 과제의 지식 활용도 함께 는다"는 것을 보여, 이후 시각 어댑터 연구가 더 큰 LM에 붙이는 방향으로 수렴하게 만든 근거가 됨'
],

pitfalls:[
 '**GPT-3나 CLIP을 쓴 논문이 아니다.** 두 모델 다 2021년 당시 유명했지만, 이 논문은 DeepMind가 C4로 자체 학습한 7B Transformer와 이미지-캡션 쌍으로 처음부터 학습한 NF-ResNet-50 비전 인코더를 쓴다. "얼린 LLM" 계보를 설명할 때 GPT-3/CLIP 기반이라고 쓰면 틀린 서술이다.',
 '**zero-shot 성능이 시각 정보를 실제로 쓴 결과인지 의심해야 한다.** 저자들도 언어모델의 사전학습 지식만으로 이미지 없이 그럴듯한 답을 낼 위험을 인지해, 이미지를 검게 지운 blind baseline과 비교해서야 비로소 시각 신호가 기여했음을 확인했다.',
 '**5-way 분류로는 일반화되지 않는다.** 2-way에서는 새 이름을 몇 장으로 배워 above-chance 정확도를 보이지만, 5-way(다섯 범주에 새 이름 다섯 개를 한 forward pass에 결합)에서는 유의미한 성능이 나오지 않았다 — few-shot 결합 능력이 범주 수에 취약하다.'
],

figures:[
 {f:'fig2-architecture.png',
  cap:'왼쪽 하단 분홍 상자가 학습되는 비전 인코더 v_φ, 그 오른쪽 노란 상자(텍스트 임베더·self-attention)가 얼린(❄) 언어모델. 빨간 화살표가 그래디언트 흐름 — self-attention 층을 관통해 비전 인코더까지만 내려간다.',
  src:'원문 Figure 2, p.2'},
 {f:'fig3-fewshot-interface.png',
  cap:'추론 시 세 가지 사용 방식. (a) 이미지 하나만 넣는 zero-shot VQA, (b) 예시 하나를 앞에 붙인 outside-knowledge VQA, (c) "This is a dax / This is a blicket" 처럼 새 단어를 이미지와 함께 두 번 보여준 뒤 세 번째 이미지에 그 단어로 답하게 하는 few-shot 분류.',
  src:'원문 Figure 3, p.2'}
],

quotes:[
 {t:'The weights of the language model are kept frozen, but gradients are back-propagated through it to train the image encoder from scratch.',
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 2106.13884 — Multimodal Few-Shot Learning with Frozen Language Models', u:'https://arxiv.org/abs/2106.13884'},
 {t:'DeepMind blog: Multimodal few-shot learning with frozen language models', u:'https://www.deepmind.com/blog/multimodal-few-shot-learning-with-frozen-language-models'}
]
});
