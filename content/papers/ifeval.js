WIKI.paper({
slug:'ifeval',
venue:'arXiv 2023 (Google)',
authors:'Zhou et al. (Google · Yale)',
arxiv:'2311.07911',

tldr:'"500단어 이상으로 써라", "JSON으로만 답하라"처럼 **프로그램으로 자동 검증 가능한 지시**만 모아, 사람 평가도 LLM 평가자도 없이 지시 따르기 능력을 객관적으로 재는 벤치마크. 25종의 검증 가능한 지시로 약 500개 프롬프트를 만들었다.',

context:'2023년 LLM의 지시 따르기 능력을 재는 방법은 크게 두 가지였다 — 사람이 응답을 읽고 채점하거나([InstructGPT](#/p/instructgpt) 류의 인간 평가), 더 강한 LLM에게 채점을 맡기는 것([Chatbot Arena](#/p/chatbot-arena) 류). 둘 다 비싸고 느리며, 사람마다 "지시를 따랐다"의 기준이 달라 재현이 안 되고, LLM 평가자는 자기 편향을 그대로 판정에 반영한다. 저자들은 애초에 **정답이 있는지 없는지가 아니라 규칙을 지켰는지**만 확인하면 되는 지시라면, 사람도 LLM도 필요 없이 코드로 검증할 수 있다는 데 착안했다.',

ideas:[
 {h:'검증 가능한 지시라는 개념',
  lead:'"500단어 이상", "키워드 3번 포함"처럼 프로그램이 참/거짓을 판정할 수 있는 지시만 고른다.',
  d:'"재미있게 써라" 같은 지시는 사람마다 판단이 다르지만, "단어 수 500개 이상"·"모두 대문자로"·"JSON 형식만 출력"·"쉼표를 쓰지 마라" 같은 지시는 정규식이나 간단한 파서로 자동 판정할 수 있다. 25종의 이런 지시를 카테고리화했다(키워드, 언어, 길이, 형식, 대소문자, 시작/끝 문구, 구두점 등).'},
 {h:'프롬프트 합성: 충돌을 피하며 다양성 확보',
  lead:'기반 프롬프트에 1~3개 지시를 무작위로 붙인 뒤 few-shot으로 걸러내고 재구성한다.',
  d:'지시를 단순히 이어붙이면 "5문단 이하"와 "20단어 이상" 같은 상충 조건이 생긴다. 이를 few-shot 프롬프팅으로 비논리적인 조합을 걸러내고, 다시 few-shot으로 문구를 다양하게 바꿔 쓴 뒤 사람이 수작업으로 최종 검토한다. 이렇게 541개 프롬프트를 만들었다.'},
 {h:'strict vs loose: 오탐(false negative)을 보정하는 이중 채점',
  lead:'문자열 그대로 검증하는 strict와, 마크다운 등 흔한 변형을 허용하는 loose 두 지표를 함께 쓴다.',
  d:'"P.S. I do like the cake로 끝내라"는 지시를 모델이 "**P.S. I do like the cake**"처럼 마크다운 굵게로 지켰다면 strict 검증은 실패로 오판한다. loose 채점은 응답에 마크다운 기호 제거, 첫/마지막 줄 삭제 같은 몇 가지 변형을 적용해 그 중 하나라도 통과하면 성공으로 인정한다. 두 지표를 나란히 보고하는 이유는 loose가 반대로 위양성(false positive)을 늘릴 수 있기 때문이다.'},
 {h:'프롬프트 단위와 지시 단위, 두 층의 정확도',
  lead:'"프롬프트 전체 통과율"과 "지시 하나하나의 통과율"을 따로 집계한다.',
  d:'프롬프트 하나에 지시가 여러 개 있을 수 있으므로, 모든 지시를 다 지켜야 성공으로 치는 prompt-level accuracy와, 지시 단위로 쪼개 채점하는 instruction-level accuracy를 둘 다 보고한다. 전자가 더 엄격하다.'}
],

diagram:{type:'flow', cap:'프롬프트 하나가 만들어지고 채점되는 과정. 사람도 LLM 평가자도 개입하지 않는다.',
 nodes:[
  {t:'기반 프롬프트', s:'+ 지시 1~3개'},
  {t:'모델 응답', s:'GPT-4 · PaLM 2', a:'생성'},
  {t:'프로그램 검증', s:'정규식·파서', acc:true, note:'strict/loose'},
  {t:'정확도 집계', s:'prompt/inst 단위'}
 ]},

numbers:[
 {k:'검증 가능한 지시 종류', v:'25개', d:'키워드·언어·길이·형식·대소문자 등 카테고리'},
 {k:'프롬프트 수', v:'약 541개', d:'각 1~3개의 검증 가능한 지시 포함'},
 {k:'GPT-4 prompt-level strict', v:'76.89%', d:'loose 기준으론 79.30%'},
 {k:'PaLM 2 S prompt-level strict', v:'43.07%', d:'같은 시기 GPT-4 대비 크게 낮음'},
 {k:'GPT-4 instruction-level strict', v:'83.57%', d:'지시 단위로는 더 관대해짐(loose 85.37%)'}
],

impact:'IFEval은 사람도 LLM 평가자도 없이 지시 따르기를 잴 수 있다는 것을 보여, 이후 대부분의 오픈 LLM 리더보드(Hugging Face Open LLM Leaderboard 등)에 표준 항목으로 채택됐다. 지시 따르기라는 애매한 능력을 "자동으로 검증 가능한 부분집합"으로 좁혀 측정 가능하게 만든 방법론 자체가, 이후 다른 능력(안전성, 형식 준수)을 재는 벤치마크 설계에도 영향을 줬다.',

legacy:[
 '**리더보드 표준 지표화** — 오픈소스 LLM 평가 스위트 다수가 IFEval을 기본 포함',
 '**검증 가능한 태스크 설계의 확산** — RLHF·RLAIF 보상 설계에서 "규칙 기반 검증 가능 보상"이라는 개념으로 이어짐',
 '**[MMLU-Pro](#/p/mmlu-pro)·[GPQA](#/p/gpqa)와 나란히** — 지식 정답이 아니라 형식/절차 준수를 재는 축으로 평가 스위트를 보완'
],

pitfalls:[
 '**strict 점수가 낮다고 지시를 정말 안 지킨 것은 아니다.** 마크다운 등 사소한 포맷 차이로 오탐되는 경우가 있어 loose 지표를 함께 봐야 한다.',
 '**25종의 지시는 "검증 가능한" 것만 고른 부분집합이다.** 문체·논리적 타당성처럼 검증 불가능한 지시 따르기는 이 벤치마크가 재지 않는다.',
 '**모델 두 개([GPT-4](#/p/gpt4), [PaLM 2](#/p/palm2))만 평가한 2023년 논문이다.** 수치 자체보다 "검증 가능한 지시"라는 설계 방법론이 이 논문의 핵심 기여다.'
],

quotes:[
 {t:"It focuses on a set of “verifiable instructions” such as “write in more than 400 words” and “mention the keyword of AI at least 3 times”.",
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2311.07911 — IFEval', u:'https://arxiv.org/abs/2311.07911'},
 {t:'Google Research GitHub — instruction_following_eval', u:'https://github.com/google-research/google-research/tree/master/instruction_following_eval'}
]
});
