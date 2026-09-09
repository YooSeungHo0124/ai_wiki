WIKI.paper({
slug:'llama2',
venue:'arXiv 2023 (Meta GenAI)',
authors:'Touvron, Martin, Stone et al. (Meta GenAI)',
arxiv:'2307.09288',

tldr:'[LLaMA](#/p/llama)를 2T 토큰으로 다시 학습시키고, 여기에 **[RLHF](#/p/instructgpt) 파이프라인 전체를 논문으로 공개**하면서 상업적 이용까지 허용한 모델. 정렬(alignment) 레시피가 처음으로 재현 가능한 형태로 문서화됐다.',

context:'[LLaMA](#/p/llama) 1은 베이스 모델만 연구용 라이선스로 나왔다. 그래서 두 개의 빈칸이 남았다. 첫째, **채팅 모델이 없다** — Alpaca·Vicuna 같은 파생물이 [GPT](#/p/gpt4) 출력을 증류해 그 자리를 메웠지만 이는 라이선스상으로도 품질상으로도 임시방편이었다. 둘째, **정렬 방법론이 블랙박스다** — [InstructGPT](#/p/instructgpt)가 RLHF의 뼈대를 보였지만 실제로 프로덕션 채팅 모델을 만들 때 데이터를 몇 개 모으는지, 보상 모델이 몇 개인지, 몇 라운드를 도는지는 어디에도 없었다. Llama 2는 이 두 빈칸을 동시에 채운다.',

ideas:[
 {h:'헬프풀니스와 세이프티를 분리된 두 보상 모델로',
  lead:'Helpfulness RM과 Safety RM을 분리해 서로의 트레이드오프를 줄인다.',
  d:'하나의 보상 모델로 "도움됨"과 "무해함"을 동시에 맞추면 둘이 서로를 갉아먹는다 — 안전을 조이면 무해하지만 쓸모없는 답이, 도움을 조이면 위험한 답이 나온다. 그래서 **Helpfulness RM과 Safety RM을 따로 학습**시키고 최종 보상에서 결합한다. 각 RM은 사전학습된 체크포인트에서 출발하므로 정책 모델과 같은 지식을 공유한다.'},
 {h:'다섯 라운드의 반복 RLHF',
  lead:'정책과 보상 모델을 5라운드 반복 갱신해 최신 분포를 따라잡는다.',
  d:'한 번에 끝내지 않는다. RLHF-V1부터 V5까지, 매 라운드마다 **현재 정책으로 새 응답을 생성 → 사람이 선호 비교 → 보상 모델 갱신 → 정책 갱신**을 돌린다. 보상 모델이 정책의 최신 분포를 보지 못하면 곧 낡아버리기 때문이다. 앞쪽 라운드는 **rejection sampling**(N개 샘플 중 보상 최고를 골라 SFT)으로, 마지막 두 라운드는 rejection sampling 뒤에 [PPO](#/p/ppo)를 얹어 진행했다.'},
 {h:'GAtt — 시스템 지시를 여러 턴에 걸쳐 붙잡아 두기',
  lead:'지시문을 턴마다 복제해 학습하되 그 loss는 0으로 지워 흔적을 없앤다.',
  d:'"항상 하이쿠로 답하라" 같은 지시는 두세 턴만 지나면 잊힌다. Ghost Attention은 **학습 데이터를 조작해서 이를 고친다**: 대화의 모든 사용자 턴 앞에 지시문을 인위적으로 복제해 붙여 응답을 생성한 뒤, 학습 시에는 그 복제된 지시문의 loss를 0으로 만들어 없앤 것처럼 취급한다. 모델은 "첫 턴에만 있는 지시를 끝까지 참조하도록" 학습된다. 아키텍처 변경이 아니라 데이터 트릭이다.'},
 {h:'품질 우선의 SFT 데이터',
  lead:'공개 데이터 수백만 건보다 직접 검수한 2.7만 건이 더 나았다.',
  d:'공개 instruction 데이터셋 수백만 건보다, **직접 검수한 27,540건**이 더 좋았다는 관찰이 나온다. 어노테이터가 쓴 답변과 모델 샘플을 비교했을 때 몇천 건 규모부터 모델 출력이 사람 것과 구분되지 않기 시작했고, 이후로는 어노테이션 예산을 SFT가 아니라 선호 비교 쪽으로 옮겼다.'},
 {h:'[GQA](#/p/gqa)로 큰 모델의 KV 캐시를 줄인다',
  lead:'34B·70B에만 GQA를 적용해 query head가 KV head를 공유하게 한다.',
  d:'34B·70B 모델에만 [GQA](#/p/gqa)를 적용했다. 문맥이 4096으로 늘어나면 KV 캐시가 배치 크기에 비례해 부풀어 추론 처리량의 병목이 되는데, 여러 query head가 KV head를 공유해 이 메모리를 줄인다. 7B·13B는 원래의 MHA를 유지했다 — 이 크기에서는 KV 캐시가 아직 병목이 아니기 때문이다.'}
],

diagram:{type:'loop', cap:'반복 RLHF. 정책이 바뀌면 보상 모델도 다시 학습해야 한다 — 5라운드를 돈 이유.',
 center:'RLHF-V1 → V5',
 nodes:[
  {t:'정책이 응답 생성', s:'같은 프롬프트 2개 샘플'},
  {t:'사람이 선호 비교', s:'4단계 선호도+안전 라벨'},
  {t:'RM 갱신', s:'Helpfulness·Safety 분리', acc:true},
  {t:'거부 샘플링', s:'N개 중 보상 최고 SFT'},
  {t:'PPO 적용', s:'마지막 라운드'}
 ]},

math:[
 {expr:'L_ranking = -log( σ( r(x, y_c) - r(x, y_r) - m(r) ) )',
  tex:'\\mathcal{L}_{\\text{ranking}} = -\\log\\!\\left(\\sigma\\big(r(x,y_c)-r(x,y_r)-m(r)\\big)\\right)',
  d:'표준 선호 학습 loss에 **마진 항 $m(r)$** 을 추가했다. 어노테이터가 "훨씬 낫다"고 표시한 쌍에는 큰 마진을, "간신히 낫다"에는 작은 마진을 준다. 선호 강도 정보를 버리지 않는 것이 보상 모델 정확도를 눈에 띄게 올렸다.'}
],

numbers:[
 {k:'모델 크기', v:'7B / 13B / 70B 공개', d:'34B도 학습했으나 안전성 검토 미완으로 미공개'},
 {k:'사전학습 토큰', v:'2T', d:'[LLaMA](#/p/llama) 1의 1.0~1.4T 대비 증가'},
 {k:'문맥 길이', v:'4096', d:'LLaMA 1의 2048에서 2배'},
 {k:'SFT 어노테이션', v:'27,540건', d:'양보다 질 — 공개 데이터셋 대량 투입보다 나았다'},
 {k:'선호 비교 데이터', v:'1,418,091쌍 (Meta 자체 수집)', d:'공개 데이터셋과 합쳐 총 약 290만 쌍'},
 {k:'사전학습 비용', v:'3,311,616 GPU-hours', d:'A100-80GB 기준 · 539 tCO2eq (전량 상쇄)'}
],

impact:'**(1) 라이선스** — 월간 활성 사용자 7억 명 이하면 상업적 사용이 허용되면서, 사실상 모든 스타트업이 자체 가중치 위에서 제품을 만들 수 있게 됐다. 이 조건부 개방 모델은 이후 다른 회사들의 라이선스 설계에도 그대로 복제됐다. **(2) 정렬 레시피의 문서화** — 두 개의 보상 모델, 반복 라운드, rejection sampling과 [PPO](#/p/ppo)의 역할 분담, 마진 loss까지 공개되면서 RLHF가 학계에서 재현 가능한 대상이 됐고, 곧이어 [DPO](#/p/dpo) 같은 더 단순한 대안이 이 파이프라인을 기준선으로 삼아 등장했다. **(3) 안전성 평가의 관행화** — red teaming 절차, 위반율(violation percentage) 지표, 안전성-유용성 트레이드오프 곡선을 논문에 실은 것이 이후 오픈 모델 릴리스의 표준 구성 요소가 됐다.',

legacy:[
 '**RLHF 단순화** — 보상 모델과 [PPO](#/p/ppo)를 통째로 걷어내는 [DPO](#/p/dpo)가 이 파이프라인의 복잡도를 직접적인 문제 제기로 삼음',
 '**체급 경쟁의 기준선** — [Mistral 7B](#/p/mistral)와 [Mixtral](#/p/mixtral)이 "Llama 2 13B / 70B 대비"를 성능 표의 축으로 사용하며 오픈 모델 비교의 좌표계가 됨',
 '**GQA의 표준화** — 70B에서의 채택 이후 [GQA](#/p/gqa)가 사실상 모든 대형 오픈 모델의 기본 attention이 됨',
 '**평가의 이동** — 정렬된 채팅 모델이 흔해지면서 정적 벤치마크만으로는 순위가 안 나오게 되고 [Chatbot Arena](#/p/chatbot-arena) 같은 인간 선호 기반 평가가 부상'
],

pitfalls:[
 '**"오픈소스"가 아니라 "오픈 웨이트"다.** Llama 2 Community License는 MAU 7억 명 제한, 출력물로 다른 LLM을 학습시키는 것 금지 등 OSI 정의에 어긋나는 조항을 포함한다. 가중치를 받아 쓸 수 있다는 것과 오픈소스 라이선스는 다른 이야기다.',
 '**학습 데이터는 공개되지 않았다.** 아키텍처와 정렬 방법은 상세히 공개됐지만 2T 토큰의 구성은 "공개적으로 이용 가능한 출처"라는 서술 이상으로 밝혀지지 않았다. [LLaMA](#/p/llama) 1이 데이터 믹스 비율을 표로 공개했던 것에서 오히려 후퇴했다.',
 '**안전 튜닝의 과잉 거부는 실측된 부작용이다.** 논문 스스로 안전성을 강화할수록 무해한 요청까지 거부하는 경향이 나타남을 보고한다. 실무에서 Llama 2-Chat이 "지나치게 조심스럽다"고 느껴지는 것은 튜닝 실패가 아니라 이 트레이드오프의 의도된 위치다.'
],

figures:[
 {f:'fig1-helpfulness-winrate.png',
  cap:'가로 막대 하나가 Llama 2-Chat 대 경쟁 모델의 사람 평가 대결. 진한 파랑(Win)+연한 파랑(Tie)+하늘색(Loss) 합이 100%. 위 두 줄은 ChatGPT·PaLM-Bison 같은 폐쇄형 모델과의 대결로 Win이 Loss와 비슷하거나 밀리고, 아래로 갈수록(Falcon·Vicuna·MPT 등 오픈소스 대결) Win 비중이 압도적으로 커진다 — "오픈소스 중 최고, 폐쇄형과는 대등"이라는 주장의 근거.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'On the series of helpfulness and safety benchmarks we tested, Llama 2-Chat models generally perform better than existing open-source models. They also appear to be on par with some of the closed-source models, at least on the human evaluations we performed.',
  src:'Introduction, p.3'}
],

links:[
 {t:'arXiv 2307.09288 — Llama 2: Open Foundation and Fine-Tuned Chat Models', u:'https://arxiv.org/abs/2307.09288'},
 {t:'Llama 2 Community License', u:'https://ai.meta.com/llama/license/'},
 {t:'Meta AI — Llama 2 소개', u:'https://ai.meta.com/blog/llama-2/'}
]
});
