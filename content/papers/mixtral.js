WIKI.paper({
slug:'mixtral',
venue:'arXiv 2024 (Mistral AI)',
authors:'Jiang et al. (Mistral AI)',
arxiv:'2401.04088',

tldr:'[Mistral 7B](#/p/mistral) 블록의 FFN을 전문가 8개로 늘리고 **토큰마다 2개만 켜는** sparse MoE 모델. 총 47B 파라미터를 갖되 토큰당 13B만 계산해, 13B급 추론 비용으로 [Llama 2](#/p/llama2) 70B를 대부분 벤치마크에서 앞섰다. MoE가 Apache 2.0 가중치로 풀린 첫 사례다.',

context:'2024년 초의 오픈 모델은 "성능을 올리려면 파라미터를 늘려야 하고, 파라미터를 늘리면 추론 비용이 그만큼 오른다"는 선형 관계에 묶여 있었다. [Switch Transformer](#/p/switch)와 [Sparse MoE](#/p/moe-shazeer)가 이미 이 연결을 끊는 법 — 파라미터는 늘리되 토큰마다 일부만 활성화 — 을 보였지만, 문제는 그 계열의 모델이 전부 연구 내부용이었다는 점이다. 공개된 것은 [T5](#/p/t5) 기반 인코더-디코더였고, 실제로 쓸 만한 decoder-only MoE 채팅 모델은 아무도 만져본 적이 없었다. Mixtral은 그 빈칸을 검증된 밀집 모델 위에 얹어서 채운다.',

ideas:[
 {h:'FFN만 전문가로 쪼갠다',
  lead:'FFN만 8개 전문가로 늘리고 attention은 그대로 공유한다.',
  d:'MoE로 바뀌는 것은 각 층의 **feed-forward 블록뿐**이다. attention은 그대로 공유된다. 이유는 비용 구조에 있다 — 파라미터의 대부분이 FFN에 몰려 있으므로 여기만 8배로 늘리면 총 용량이 크게 커지고, attention을 건드리지 않으므로 KV 캐시와 [GQA](#/p/gqa) 구조는 밀집 모델과 동일하게 유지된다.'},
 {h:'토큰 단위 top-2 라우팅',
  lead:'토큰마다 라우터가 8개 전문가 중 상위 2개만 골라 가중합한다.',
  d:'각 층에서 라우터(단일 선형 층)가 토큰의 은닉 벡터를 받아 8개 전문가에 대한 점수를 내고, **상위 2개만 골라** softmax 가중합한다. 라우팅은 시퀀스가 아니라 **토큰마다·층마다** 독립적으로 일어나므로, 같은 문장 안의 토큰들이 서로 다른 전문가로 흩어지고 다음 층에서 다시 재배치된다.'},
 {h:'총 47B vs 활성 13B — 두 숫자를 분리해서 읽는다',
  lead:'메모리는 47B를 요구하지만 실제 연산은 토큰당 13B만 쓴다.',
  d:'전문가 8개를 다 합치면 47B(attention 등 공유 부분 포함)지만, 한 토큰이 실제로 통과하는 경로는 13B다. **메모리는 47B분을 요구하고 FLOPs는 13B분만 쓴다.** 이 비대칭이 MoE의 핵심 거래 조건이다 — VRAM은 비싸지고 지연시간(latency)과 처리량은 싸진다. 배치를 크게 돌리는 서버 환경에서 특히 유리하고, VRAM이 빠듯한 로컬 환경에서는 오히려 불리해진다.'},
 {h:'전문가는 "도메인 전문가"가 아니다',
  lead:'전문가 분화는 주제가 아니라 토큰 위치·구문 패턴을 따른다.',
  d:'논문이 직접 확인한 흥미로운 음성 결과다. The Pile의 수학·생물학·철학·코드 등 도메인별로 라우팅 분포를 재봤는데, **주제에 따른 전문가 분화가 관찰되지 않았다.** 대신 연속된 위치의 토큰이 같은 전문가로 가는 **위치적 지역성**이 뚜렷했고, 들여쓰기 같은 구문적 패턴에서 분화가 보였다. 라우터가 배우는 것은 의미 범주가 아니라 표층적·구문적 신호에 가깝다.'},
 {h:'32k 전체 문맥 — sliding window를 버렸다',
  lead:'sliding window 대신 32k 전체 문맥에 대해 attention을 계산한다.',
  d:'[Mistral 7B](#/p/mistral)의 sliding window attention 대신 32768 전체 문맥에 대한 attention을 쓴다. passkey retrieval 테스트에서 문맥 전 구간·모든 삽입 위치에 대해 100% 정확도를 보고했다. 즉 이 계열의 긴 문맥 전략은 한 세대 만에 "윈도우를 좁힌다"에서 "전부 본다"로 바뀌었다.'}
],

diagram:{type:'split', cap:'각 층의 FFN 자리. 라우터가 토큰마다 8개 중 2개를 고른다.',
 from:{t:'토큰 은닉 벡터', s:'d = 4096'},
 branches:[
  {t:'Expert 1'},{t:'Expert 2'},{t:'Expert 3'},{t:'…'},{t:'Expert 8'}
 ],
 join:'top-2만 활성 · 총 47B 중 토큰당 13B만 계산'},

math:[
 {expr:'y = Σ_i softmax( TopK(x·W_g, k=2) )_i · Expert_i(x)',
  tex:'y = \\sum_i \\text{softmax}\\big(\\text{TopK}(xW_g, k=2)\\big)_i \\cdot \\text{Expert}_i(x)',
  d:'라우터 로짓 $x W_g$ 에서 상위 2개만 남기고 나머지를 $-\\infty$ 로 만든 뒤 softmax를 건다. 따라서 선택되지 않은 6개 전문가의 가중치는 정확히 0이고, 그 전문가의 행렬곱은 **아예 실행되지 않는다**. 이것이 FLOPs가 줄어드는 지점이다.'},
 {expr:'Expert_i(x) = SwiGLU_i(x)',
  tex:'\\text{Expert}_i(x) = \\text{SwiGLU}_i(x)',
  d:'각 전문가는 [Mistral 7B](#/p/mistral)/[LLaMA](#/p/llama)와 동일한 SwiGLU FFN이다. 새 연산자를 도입한 것이 아니라 검증된 블록을 8벌 복제한 구조라, 기존 커널과 파인튜닝 도구가 거의 그대로 재사용된다.'}
],

numbers:[
 {k:'총 / 활성 파라미터', v:'47B / 토큰당 13B', d:'메모리는 47B분, 연산은 13B분'},
 {k:'전문가 구성', v:'층당 8개 · top-2 라우팅', d:'FFN에만 적용 · attention은 공유'},
 {k:'문맥 길이', v:'32768', d:'passkey retrieval 전 구간 100% 정확도'},
 {k:'아키텍처', v:'dim 4096 · 32층 · q-head 32 / kv-head 8', d:'attention 구조는 Mistral 7B와 동일'},
 {k:'MMLU', v:'70.6%', d:'Llama 2 70B를 상회'},
 {k:'MT-Bench (Instruct)', v:'8.30', d:'당시 GPT-3.5 수준의 오픈 채팅 모델'},
 {k:'라이선스', v:'Apache 2.0', d:'베이스·instruct 모두 · 상업적 이용 무제한'}
],

impact:'**(1) 비용 곡선의 재정의.** "성능은 70B급, 계산은 13B급"이라는 조합이 실물로 확인되면서, 오픈 모델의 경쟁 축이 파라미터 수에서 **활성 파라미터 대비 성능**으로 옮겨갔다. 이후 모델 스펙 시트에 총/활성 파라미터를 나란히 적는 관행이 자리 잡았다. **(2) MoE 서빙 인프라의 형성.** 전문가 병렬화, 전문가 오프로딩, MoE 인지 양자화 등이 실제 배포 문제로 대두되면서 [vLLM](#/p/vllm) 같은 서빙 스택이 MoE를 1급 시민으로 지원하기 시작했다. **(3) 해석 가능성 관점의 수정.** "전문가가 도메인을 나눠 맡을 것"이라는 직관적 기대가 데이터로 반박되면서, MoE를 모듈화된 지식 구조로 읽는 해석은 근거를 잃었다.',

legacy:[
 '**MoE 세분화** — [DeepSeek-V3](#/p/deepseek-v3)가 전문가를 더 잘게 쪼개고 공유 전문가를 두는 방향으로 발전시켜 활성 비율을 671B 중 37B까지 낮춤',
 '**오픈 MoE의 기본형** — Qwen·DBRX 등 이후 오픈 모델들이 decoder-only + top-k FFN 라우팅이라는 이 구성을 그대로 채택',
 '**총/활성 파라미터 표기의 정착** — 모델 크기를 하나의 숫자로 말하던 관행이 두 숫자로 바뀜',
 '**라우팅 연구의 재점화** — [Switch](#/p/switch) 이후 잠잠했던 부하 균형·라우터 붕괴 문제가 실제 배포 환경의 문제로 다시 다뤄짐'
],

pitfalls:[
 '**"8x7B"는 56B가 아니고, 8개 모델의 앙상블도 아니다.** attention과 임베딩은 전문가들이 공유하므로 총합은 47B다. 또한 독립된 7B 모델 8개를 투표시키는 구조가 전혀 아니며, 라우팅은 층마다·토큰마다 새로 일어난다.',
 '**활성 13B라고 13B 모델처럼 배포되지 않는다.** 어느 전문가가 선택될지 미리 알 수 없으므로 **47B 전체를 메모리에 올려야 한다.** VRAM이 병목인 환경에서는 이득이 없고, 배치를 키워 처리량을 뽑는 서버 환경에서 이득이 나온다.',
 '**전문가를 떼어내 쓸 수 없다.** 도메인 분화가 없다는 논문의 관찰이 여기에 직결된다. "수학 전문가만 추출해 경량 모델을 만든다" 같은 발상은 실제 라우팅 통계와 맞지 않는다.'
],

figures:[
 {f:'fig1-moe-layer.png',
  cap:'router가 입력마다 8개 expert(주황 상자, 겹쳐 그려진 것이 8개를 의미) 중 2개에게만 게이트를 열어(점선 화살표가 gating weights) 그 둘의 출력만 가중합(⊕)해 내보낸다. 나머지 6개 expert는 이번 토큰에 대해 아예 계산되지 않는다 — 파라미터는 8개 몫을 다 갖고 있지만 계산은 2개 몫만 쓰는 것이 sparse MoE의 핵심.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'Even though each token only sees two experts, the selected experts can be different at each timestep. As a result, each token has access to 47B parameters, but only uses 13B active parameters during inference.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2401.04088 — Mixtral of Experts', u:'https://arxiv.org/abs/2401.04088'},
 {t:'Mistral AI — Mixtral of experts', u:'https://mistral.ai/news/mixtral-of-experts'},
 {t:'Hugging Face — Mixture of Experts Explained', u:'https://huggingface.co/blog/moe'}
]
});
