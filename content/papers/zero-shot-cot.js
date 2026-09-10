WIKI.paper({
slug:'zero-shot-cot',
venue:'NeurIPS 2022',
authors:'Kojima et al. (The University of Tokyo · Google Research)',
arxiv:'2205.11916',

tldr:'예시를 단 하나도 주지 않고, 질문 뒤에 **"Let\'s think step by step"** 한 문장만 붙여도 LLM의 추론 성능이 크게 오른다는 것을 보였다. [CoT](#/p/cot)가 손으로 만든 예시를 필요로 했던 것과 달리, 이 논문은 그 능력이 예시 없이도 프롬프트 한 줄로 열린다는 사실을 보여줬다.',

context:'[CoT](#/p/cot)는 few-shot 예시 안에 "단계별로 풀이한 답"을 넣어주면 LLM이 복잡한 산수·논리 문제를 훨씬 잘 푼다는 것을 보였다. 하지만 그 예시는 과제마다 사람이 직접 만들어야 했고, 이 성공은 흔히 LLM의 **few-shot 학습 능력**에 귀속됐다. 반면 표준 zero-shot 프롬프팅(예시 없이 질문만 던지기)은 여전히 이런 system-2형 추론 과제에서 취약했다. 저자들의 질문은 단순하다 — 예시가 정말 필요한가, 아니면 "단계별로 생각하라"는 지시만으로도 같은 잠재 능력을 끌어낼 수 있는가.',

ideas:[
 {h:'2단계 프롬프팅: 추론 추출과 답 추출을 분리',
  lead:'1차 프롬프트로 추론 과정을 뽑고, 2차 프롬프트로 그 텍스트에서 최종 답만 뽑는다.',
  d:'1차 프롬프트는 "Q: [질문]. A: Let\'s think step by step."으로 끝나고, 모델이 생성한 추론 문장 z를 받는다. 2차 프롬프트는 [1차 프롬프트][z]에 "Therefore, the answer is" 같은 답 추출 트리거를 이어붙여 같은 모델에 다시 넣는다. 자유 형식 추론 텍스트에서 정답 형식(숫자·선택지)을 뽑아내려면 프롬프트를 **두 번** 호출해야 한다는 것이 이 방법의 대가다.'},
 {h:'trigger sentence 하나가 CoT를 재현한다',
  lead:'"Let\'s think step by step" 한 줄이 few-shot 예시 없이 단계별 추론을 유도한다.',
  d:'예시 대신 이 한 문장이 모델로 하여금 문제를 여러 하위 단계로 쪼개 계산하게 만든다. MultiArith에서 표준 zero-shot 17.7%가 78.7%로, GSM8K에서 10.4%가 40.7%로 뛰었다(text-davinci-002 기준). Few-shot-CoT보다는 낮지만, 과제별 예시 설계 없이 **같은 한 줄**을 모든 과제에 그대로 썼다는 점이 핵심이다.'},
 {h:'trigger 문장의 문구가 성능을 좌우한다',
  lead:'16가지 트리거 문장을 비교해 지시적 문구일수록, 그리고 정확한 표현일수록 더 잘 통함을 보였다.',
  d:'MultiArith에서 "Let\'s think step by step."은 78.7%지만, 의미는 비슷해도 "Let\'s think"만 쓰면 57.5%로 떨어지고, "Let\'s think step by step but reach an incorrect answer."처럼 일부러 오답을 유도하는 문장은 18.7%로 zero-shot 기준선(17.7%)과 다를 바 없다. 무관한 문장("By the way, I found a good restaurant nearby.")은 17.5%로 오히려 아무 효과가 없다. **문장의 의미 자체가 결과를 결정**한다는 뜻이다.'},
 {h:'과제 4종에 걸친 일관된 개선',
  lead:'산수·기호추론·기타 논리추론에서 두루 향상되지만 상식추론에서는 아니다.',
  d:'12개 벤치마크 중 산수(MultiArith·GSM8K·AQUA·SVAMP), 기호추론(Last Letter·Coin Flip), 기타 논리추론(Date Understanding·Shuffled Objects, [BIG-bench](#/p/bigbench) 유래)에서는 큰 폭으로 향상됐다. 반면 CommonsenseQA·StrategyQA 같은 상식추론에서는 점수가 오히려 떨어졌는데, 저자들은 모델이 그럴듯한 추론을 만들어내긴 하지만 답을 하나로 좁히지 못하는 경우가 많았다고 분석했다.'},
 {h:'모델 규모가 임계값을 넘어야 나타나는 능력',
  lead:'수십억 파라미터급 이상에서만 이 효과가 뚜렷이 나타나는 창발적 패턴을 보인다.',
  d:'InstructGPT(text-davinci-002)와 540B PaLM처럼 대형·미세조정된 모델에서 효과가 뚜렷했다. 이는 [CoT](#/p/cot) 논문이 보고한, 모델 규모가 커질수록 단계별 추론 능력이 나타나는 [창발](#/p/emergent) 패턴과 같은 결을 공유한다 — 다만 이번엔 예시조차 없이 문장 하나로 그 능력을 건드렸다는 점이 다르다.'}
],

diagram:{type:'flow', cap:'2단계 파이프라인. 1차 호출로 추론 문장을 얻고, 그 문장을 다시 모델에 넣어 형식에 맞는 답만 뽑는다.',
 nodes:[
  {t:'질문 + 트리거', s:'step by step 지시문'},
  {t:'LLM 1차 호출', s:'추론 문장 z 생성'},
  {t:'프롬프트 이어붙이기', s:'질문+z+답 추출 트리거', acc:true},
  {t:'LLM 2차 호출', s:'답 추출 트리거'},
  {t:'최종 답', s:'숫자/선택지 파싱'}
 ]},

math:[
 {expr:'x\' = [X]. [T]   ->   z = LLM(x\')   ->   x\'\' = [x\'][z][A]   ->   ŷ = LLM(x\'\')',
  tex:'x^{\\prime}=[X].[T]\\;\\Rightarrow\\; z=\\mathrm{LLM}(x^{\\prime})\\;\\Rightarrow\\; x^{\\prime\\prime}=[x^{\\prime}][z][A]\\;\\Rightarrow\\; \\hat{y}=\\mathrm{LLM}(x^{\\prime\\prime})',
  d:'[X]는 입력 질문, [T]는 추론 트리거("Let\'s think step by step"), [A]는 답 추출 트리거("Therefore, the answer is"). 2차 프롬프트는 1차 결과를 그대로 포함하는 self-augmented 프롬프트다.'}
],

numbers:[
 {k:'MultiArith (zero-shot→zero-shot-CoT)', v:'17.7% → 78.7%', d:'text-davinci-002, greedy decoding'},
 {k:'GSM8K (zero-shot→zero-shot-CoT)', v:'10.4% → 40.7%', d:'같은 모델·같은 단일 트리거 문장'},
 {k:'AQUA-RAT', v:'22.4% → 33.5%', d:'답 추출 프롬프트를 과제별로 맞췄을 때 기준'},
 {k:'Few-shot-CoT와의 격차', v:'MultiArith 78.7% vs 92.8%', d:'예시를 손으로 만든 Few-shot-CoT가 여전히 더 높다'},
 {k:'trigger 문장 민감도', v:'78.7% → 17.5%', d:'"Let\'s think step by step"과 무관한 문장 사이의 MultiArith 격차'},
 {k:'평가 과제 수', v:'12개', d:'산수 6 · 상식 2 · 기호추론 2 · 기타 논리 2, [BIG-bench](#/p/bigbench) 포함'}
],

impact:'이 논문은 "in-context 능력은 예시로 학습된다"는 통념에 균열을 냈다. 예시 없이 문장 하나로 같은 정성적 효과가 나온다는 것은, 모델이 이미 가진 잠재 능력을 few-shot 예시가 **가르치는** 게 아니라 **꺼내는** 역할만 할 수도 있다는 뜻이다. 실무적으로는 과제별 예시 설계 없이 쓸 수 있는 "최소 강력 zero-shot 기준선"을 제공해, 이후 프롬프트 엔지니어링 연구의 출발점이 됐다. 또한 이 발견은 [rethinking-demos](#/p/rethinking-demos)가 few-shot 예시의 역할 자체를 재검토하게 만든 흐름과 같은 해에 나와 서로를 보강한다.',

legacy:[
 '[Auto-CoT](https://arxiv.org/abs/2210.03493)·[PAL](#/p/pal) 등이 "트리거 문장을 자동 탐색"하거나 "추론을 코드로 대체"하는 후속 연구로 이어짐',
 '2단계 프롬프팅(추론 추출 후 답 추출)은 이후 에이전트 프레임워크([ReAct](#/p/react), [Reflexion](#/p/reflexion))에서 사고와 출력 형식을 분리하는 표준 패턴으로 자리잡음',
 '"프롬프트 문구 자체가 성능을 좌우한다"는 관찰은 이후 프롬프트 민감도·강건성 연구(예: 프롬프트 앙상블, [Self-Consistency](#/p/self-consistency))의 동기가 됨',
 'instruction-tuned 모델([InstructGPT](#/p/instructgpt))이 등장하며 zero-shot-CoT 효과가 더 크게 관찰돼, 사전학습 후 정렬 단계가 이런 잠재 능력을 더 잘 드러낸다는 논의로 이어짐'
],

pitfalls:[
 '**"항상 도움이 된다"가 아니다.** 상식추론(CommonsenseQA·StrategyQA)에서는 zero-shot-CoT가 오히려 정확도를 낮췄다 — 모델이 그럴듯한 근거를 계속 만들어내며 정답 하나로 수렴하지 못하는 경우가 있었다.',
 '**후속 연구에서 재현성 논쟁이 있다.** 이후 강력한 instruction-tuned·RLHF 모델은 트리거 문장 없이도 zero-shot 상태에서 이미 단계별로 답하는 경향이 있어, "step by step" 한 줄의 순수 효과가 모델·과제에 따라 원 논문만큼 크지 않다는 지적이 있다. 트리거 문장에 대한 민감도(Table 4의 큰 편차) 자체도 이 방법이 통계적으로 안정적이지 않을 수 있음을 시사한다.',
 '**두 번 호출하는 비용을 잊기 쉽다.** 추론 추출과 답 추출이 별도 API 호출이라 지연시간과 비용이 표준 zero-shot의 약 2배다. 실무에서는 파싱 규칙을 잘 만들어 1차 호출만으로 끝내는 경우도 많다.'
],

figures:[
 {f:'fig1-four-panel.png',
  cap:'같은 질문에 대한 네 방식의 출력 비교. (a) few-shot과 (c) zero-shot은 예시/트리거 없이 곧장 오답(8)을 내지만, (b) 예시를 손으로 만든 Few-shot-CoT와 (d) "Let\'s think step by step" 한 줄만 붙인 Zero-shot-CoT는 둘 다 파란 글씨의 단계별 풀이를 거쳐 정답(4)에 도달한다.',
  src:'원문 Figure 1, p.2'},
 {f:'fig2-pipeline.png',
  cap:'왼쪽 1차 프롬프트가 "A: Let\'s think step by step."로 끝나 추론 문장을 얻고, 그 문장을 오른쪽 2차 프롬프트에 그대로 이어붙인 뒤 "Therefore, the answer (arabic numerals) is"로 마무리해 최종 숫자만 뽑는다.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'We show that LLMs are decent zero-shot reasoners by simply adding "Let\'s think step by step" before each answer.',
  src:'Abstract, p.1'},
 {t:'This strongly suggests high-level, multi-task broad cognitive capabilities may be extracted by simple prompting.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2205.11916 — Large Language Models are Zero-Shot Reasoners', u:'https://arxiv.org/abs/2205.11916'},
 {t:'공식 코드 (google-research/google-research/zero_shot_cot)', u:'https://github.com/kojima-takeshi188/zero_shot_cot'}
]
});
