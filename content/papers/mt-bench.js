WIKI.paper({
slug:'mt-bench',
venue:'NeurIPS 2023 (Datasets and Benchmarks Track)',
authors:'Zheng, Chiang, Sheng et al. (UC Berkeley · UC San Diego · CMU · Stanford)',
arxiv:'2306.05685',

tldr:'사람 대신 강한 LLM([GPT-4](#/p/gpt4))에게 다른 모델의 답을 채점시키는 **"LLM-as-a-judge"** 방식이 실제로 사람 평가와 얼마나 일치하는지를 정면으로 측정한 논문. MT-bench(80개 멀티턴 질문)와 Chatbot Arena(크라우드소싱 배틀)라는 두 벤치마크로 GPT-4 판정과 사람 판정의 일치율이 사람-사람 일치율과 같은 수준임을 보였다.',

context:'[InstructGPT](#/p/instructgpt) 이후 RLHF로 정렬된 챗봇들이 쏟아졌지만, 이들의 사용자 선호도는 [HELM](#/p/helm)이나 [MMLU](#/p/mmlu) 같은 기존 벤치마크 점수와 잘 맞지 않았다. 객관식·검색형 문제로는 "이 답변이 얼마나 도움이 되는가"를 잴 수 없기 때문이다. 사람이 직접 평가하는 것이 정답이지만 느리고 비싸서 모델을 반복 개선하는 루프에 쓸 수 없다. 저자들은 이미 RLHF로 사람 선호에 정렬된 GPT-4 자체를 채점자로 쓰면 어떨까라는 질문을 던지고, 그 신뢰성을 검증하기 전에 먼저 **편향과 한계를 체계적으로 측정**했다.',

ideas:[
 {h:'MT-bench: 멀티턴 질문 80개로 대화 능력을 시험',
  lead:'글쓰기·역할극·추론·수학·코딩 등 8개 범주에서 2턴짜리 질문 80개를 수작업 설계했다.',
  d:'각 질문은 첫 턴 질문과 그에 대한 답을 전제로 한 후속 질문(둘째 턴)으로 구성된다. 단답형 벤치마크와 달리 **지시 따르기와 문맥 유지**를 동시에 시험한다. 6개 모델(GPT-4·GPT-3.5·Claude-v1·Vicuna 등)의 답을 모아 전문가 약 3천 표를 수집했다.'},
 {h:'세 가지 채점 방식과 그 한계',
  lead:'pairwise 비교·단일 답변 채점·정답 참조 채점 세 방식을 비교하고 각각의 실패 모드를 짚었다.',
  d:'두 답을 나란히 놓고 우열을 묻는 **pairwise comparison**은 비교 대상이 늘면 비용이 제곱으로 커진다. 답 하나에 점수를 매기는 **single-answer grading**은 미묘한 차이를 못 잡는다. 수학·코딩처럼 정답이 명확한 문제는 GPT-4가 스스로 문제를 풀게 한 뒤 그 답을 기준으로 채점하는 **reference-guided judge**로 보완했다.'},
 {h:'세 가지 편향을 정량으로 잡아냈다',
  lead:'위치·장황함·자기선호 편향을 실제로 측정하고 각각의 완화책을 제시했다.',
  d:'**위치 편향**: 대부분의 LLM 판정자가 먼저 제시된 답을 선호한다. **장황함 편향**: 내용이 같아도 답을 반복해서 길게 늘리면 GPT-3.5·Claude-v1 판정자는 더 높은 점수를 준다(GPT-4만 이 공격에 상대적으로 강했다). **자기선호 편향**: 판정자가 자신과 같은 계열의 모델이 낸 답을 더 후하게 평가하는 경향. 완화책으로 답의 순서를 바꿔 두 번 채점하는 position swapping과 few-shot 예시를 제시했다.'},
 {h:'수학·추론에서는 판정 능력 자체가 약하다',
  lead:'GPT-4도 수학 문제를 스스로 못 풀면 틀린 답에 높은 점수를 준다.',
  d:'기본 프롬프트만으로는 GPT-4가 수학 문제의 정오를 제대로 가리지 못했다. [Chain-of-Thought](#/p/cot)처럼 판정자에게 먼저 스스로 풀게 하고 그 풀이를 참조해 채점하게 하는 reference-guided 방식을 쓰자 정확도가 개선됐다.'},
 {h:'Chatbot Arena: 실사용자 배틀로 검증',
  lead:'익명 크라우드소싱 배틀에서 나온 3만 건의 실사용자 대화로 같은 결론을 다시 확인했다.',
  d:'사용자가 두 모델과 동시에 대화하고 어느 쪽이 나은지 직접 투표한다. 통제된 MT-bench와 통제되지 않은 실사용 데이터라는 서로 다른 조건에서도 GPT-4 판정과 사람 선호의 일치율이 비슷하게 높게 나와, 결론이 특정 세팅에 국한되지 않음을 보였다.'}
],

diagram:{type:'flow', cap:'MT-bench의 pairwise judge 파이프라인. 같은 질문에 대한 두 모델의 답을 GPT-4가 나란히 비교해 판정한다.',
 nodes:[
  {t:'멀티턴 질문', s:'8개 범주 · 80개'},
  {t:'모델 A 답변', s:'2턴 대화'},
  {t:'모델 B 답변', s:'2턴 대화'},
  {t:'GPT-4 판정', s:'3가지 채점 방식', acc:true},
  {t:'승패·타이', s:'사람 표와 대조'}
 ]},

numbers:[
 {k:'MT-bench 질문 수', v:'80개 · 8개 범주', d:'글쓰기·역할극·추출·추론·수학·코딩·STEM·인문학, 각 2턴'},
 {k:'수집 표(vote) 수', v:'약 3K(통제) + 3만(Arena)', d:'전문가 통제 투표 3천, 크라우드소싱 실사용 대화 3만 건'},
 {k:'GPT-4–사람 일치율(비타이만)', v:'85%', d:'MT-bench 1턴, setup S2(타이 제외) 기준'},
 {k:'사람–사람 일치율', v:'81%', d:'같은 S2 기준 — GPT-4가 이보다 같거나 높은 수준'},
 {k:'few-shot 판정의 일관성', v:'65.0% → 77.5%', d:'position bias에 대한 GPT-4 pairwise 판정의 일관성, few-shot 예시 추가 후'},
 {k:'전체 결론 수치', v:'80% 이상 일치', d:'Abstract에서 제시한 GPT-4 판정 vs 사람 선호 전체 일치율'}
],

impact:'이 논문 이후 "LLM에게 채점시킨다"가 정식 평가 방법론으로 자리잡았다. **MT-bench**는 대화형 모델의 사실상 표준 리더보드 중 하나가 됐고, 같은 팀의 [Chatbot Arena](#/p/chatbot-arena)는 사람 선호를 직접 수집하는 장기 운영 플랫폼으로 성장했다. 동시에 이 논문이 스스로 측정한 위치·장황함·자기선호 편향 수치는, 이후 "LLM 평가자를 쓰려면 편향을 어떻게 통제했는지 밝혀라"라는 암묵적 기준이 됐다.',

legacy:[
 '**LLM-as-a-judge의 표준 레퍼런스** — 이후 벤치마크 논문들이 GPT-4 채점을 쓸 때 이 논문의 편향 완화 기법(순서 교체, reference-guided)을 인용',
 '**AlpacaEval·Arena-Hard 등 후속 LLM 판정 벤치마크**가 이 논문의 pairwise 비교 설계를 계승',
 '**자기선호 편향 문제**는 이후 여러 모델을 판정자로 섞어 쓰는 ensemble judge 연구로 이어짐',
 '**Chatbot Arena**가 독립 플랫폼으로 성장해 Elo 기반 모델 랭킹의 사실상 표준이 됨'
],

pitfalls:[
 '**"GPT-4 판정 = 사람 판정"이 무조건 성립하지 않는다.** 논문이 보인 85% 일치율은 사람-사람 일치율(81%)과 비슷한 수준이라는 뜻이지, 둘이 완전히 같다는 뜻이 아니다. 수학·추론처럼 판정자 자신이 약한 영역에서는 신뢰도가 떨어진다.',
 '**장황한 답이 실제로 더 좋아서가 아니라 길어서 이길 수 있다.** GPT-3.5·Claude-v1을 판정자로 쓸 때 특히 그렇다 — 판정자로 어떤 모델을 쓰느냐에 따라 편향의 크기가 다르다.',
 '**위치를 고정하고 한 번만 채점하면 위치 편향을 그대로 안고 간다.** 논문은 순서를 바꿔 두 번 채점하는 것을 기본 완화책으로 제시했다.'
],

figures:[
 {f:'fig-winrate.png',
  cap:'Chatbot Arena에서 9개 모델의 평균 승률을 GPT-4 판정·GPT-3.5 판정·사람 판정·GPT-4 단일채점으로 각각 그린 것. 네 곡선이 거의 겹친다는 것이 이 논문의 핵심 증거 — 판정자를 바꿔도 모델 순위가 거의 그대로 유지된다.',
  src:'원문 Figure 4, p.8'}
],

quotes:[
 {t:'Our results reveal that strong LLM judges like GPT-4 can match both controlled and crowdsourced human preferences well, achieving over 80% agreement, the same level of agreement between humans.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2306.05685 — Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena', u:'https://arxiv.org/abs/2306.05685'},
 {t:'FastChat / MT-bench GitHub', u:'https://github.com/lm-sys/FastChat/tree/main/fastchat/llm_judge'}
]
});
