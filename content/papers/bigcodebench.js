WIKI.paper({
slug:'bigcodebench',
venue:'ICLR 2025',
authors:'Zhuo et al. (Monash Univ. · BigCode Project · 다수 기관)',
arxiv:'2406.15877',

tldr:'[HumanEval](#/p/humaneval)류 벤치마크가 짧고 자기완결적인 알고리즘 문제로 포화됐다는 문제의식에서, **139개 라이브러리·7개 도메인의 함수 호출을 조합**해야 풀리는 1,140개 실전형 과제로 코드 생성을 재평가한 벤치마크. 최고 모델도 60%를 넘기지 못해 사람(97%)과 큰 격차를 보였다.',

context:'[HumanEval](#/p/humaneval)과 MBPP는 문제 하나가 짧고 자기완결적인 알고리즘 퍼즐이라, 모델들이 이미 90% 안팎까지 점수를 끌어올려 변별력을 잃었다. `[EvalPlus](#/p/evalplus)`는 같은 문제에 테스트 케이스를 늘려 **거짓 통과**를 걸러내는 방향으로 벤치마크를 강화했지만, 문제 자체의 난이도(여러 라이브러리를 조합해야 하는 실전 과제인지)는 그대로였다. BigCodeBench는 문제 난이도 쪽에서 같은 문제의식을 밀고 나간다 — 실제 소프트웨어 작업은 SSL 소켓 연결처럼 **여러 라이브러리의 함수를 정확한 순서로 조합**해야 하는데, 기존 벤치마크는 이런 요구를 전혀 담지 못한다는 것이다.',

ideas:[
 {h:'139개 라이브러리·723개 함수 호출을 요구하는 과제 설계',
  lead:'표준 라이브러리와 서드파티 패키지를 넘나드는 함수 호출을 조합해야 풀리게 만든다.',
  d:'1,140개 과제 각각이 평균적으로 여러 라이브러리의 함수 호출을 요구하도록 설계했다. 데이터 분석·네트워킹·시각화 등 7개 도메인에 걸쳐 있고, 사람이 GitHub 코드 조각을 시드로 삼아 GPT-4와 반복적으로 상호작용하며 docstring·테스트 케이스를 다듬는 과정을 거쳤다. 단일 함수 하나만 맞으면 통과하는 문제가 아니라, **여러 도구를 올바른 순서로 엮는 능력**을 직접 측정한다.'},
 {h:'Complete와 Instruct 두 트랙으로 분리',
  lead:'구조화된 docstring으로 푸는 Complete와, 자연어 지시만으로 푸는 Instruct를 나눠 평가한다.',
  d:'BigCodeBench-Complete는 Parameters·Returns·Raises·Examples가 갖춰진 구조화된 docstring을 프롬프트로 준다. BigCodeBench-Instruct는 같은 과제를 규칙 기반으로 변환해 **핵심 정보만 남긴 자연어 지시문**으로 바꾼 버전이라, 모델이 비본질적 세부사항 없이도 요구사항을 정확히 추론해 함수 호출을 선택해야 한다. 두 트랙의 점수 차이 자체가 "지시를 정밀하게 따르는 능력"의 별도 척도가 된다.'},
 {h:'평균 브랜치 커버리지 99%의 테스트 스위트',
  lead:'과제당 평균 5.6개 테스트 케이스로 실행 경로의 99%를 검증해 거짓 통과를 최소화한다.',
  d:'`[EvalPlus](#/p/evalplus)`가 HumanEval에 테스트를 대폭 늘려 거짓 양성을 잡아낸 것과 같은 방향으로, BigCodeBench도 과제마다 setup/teardown을 포함한 테스트 클래스를 만들어 예외 처리 경로(예: SSL 핸드셰이크 실패)까지 검증한다. 표본 33개를 사람이 직접 검토했을 때 97%(32/33)가 모든 테스트를 통과하는 정답으로 확인됐다.'},
 {h:'예산 제약용 BigCodeBench-Hard 부분집합',
  lead:'라이브러리 3개 이상을 요구하는 과제만 추려 더 어렵고 저비용인 평가 세트를 함께 낸다.',
  d:'전체 1,140개를 매번 평가하기엔 API 비용이 크므로, 라이브러리 2개 초과를 요구하는 과제만 추린 Hard 부분집합을 별도로 공개한다. 별도의 비공개 리더보드(SEAL-Coding)와 순위를 비교해 Hard 세트가 실사용자 체감 난이도와 더 잘 맞는다는 것을 검증했다.'}
],

diagram:{type:'compare', cap:'기존 코드 벤치마크와 BigCodeBench가 요구하는 능력의 차이.',
 left:{t:'HumanEval/MBPP', items:['알고리즘 퍼즐 1문제 1함수','외부 라이브러리 불필요','상위 모델 90%+ 포화']},
 right:{t:'BigCodeBench', items:['139개 라이브러리 조합','평균 5.6개 테스트·커버리지 99%','최고 모델도 60% 미만']}},

numbers:[
 {k:'과제 수 · 라이브러리 · 도메인', v:'1,140개 · 139개 · 7개', d:'723개 함수 호출을 커버'},
 {k:'테스트 스위트', v:'과제당 평균 5.6개, 브랜치 커버리지 99%', d:'거짓 통과를 줄이기 위한 실행 기반 검증'},
 {k:'최고 모델 Complete 점수', v:'GPT-4o 약 60%', d:'BigCodeBench-Complete, calibrated Pass@1'},
 {k:'최고 모델 Instruct 점수', v:'50% 미만', d:'같은 모델이 자연어 지시 트랙에서는 더 낮음'},
 {k:'사람 성능', v:'97%', d:'프로그래밍 지식이 있는 평가자 기준'},
 {k:'Complete→Instruct 평균 하락', v:'약 8.5%p', d:'구조화 docstring 없이 자연어만 주면 대부분 모델 성능이 떨어짐'}
],

impact:'"짧은 알고리즘 문제 통과율"이 실전 코딩 능력의 대리 지표로 부적절하다는 것을 대규모 실측으로 보여, 이후 코드 벤치마크들이 다중 라이브러리·복합 지시 시나리오를 갖추도록 압박했다. 60개 이상의 공개·비공개 LLM을 동일 조건에서 비교한 결과가 코드 모델 리더보드의 기준점 중 하나가 됐고, Complete/Instruct 분리 평가 방식은 "정답을 아는가"와 "요구사항을 정확히 읽어내는가"를 나눠 보는 관행을 남겼다.',

legacy:[
 '`[EvalPlus](#/p/evalplus)`의 테스트 강화 방향과 나란히, 문제 자체의 실전성을 높이는 벤치마크 강화 계열을 형성',
 'Complete/Instruct 이중 트랙 설계가 이후 코드 벤치마크의 "지시 따르기 vs 순수 구현" 분리 평가 관행에 영향',
 '비용 제약 상황을 위한 Hard 부분집합 공개가 이후 벤치마크의 경량 평가 세트 관행으로 이어짐'
],

pitfalls:[
 '**Complete와 Instruct 점수를 같은 잣대로 비교하면 안 된다.** 같은 모델이라도 지시문 형식에 따라 8.5%p 이상 차이가 나므로, 리더보드 인용 시 어느 트랙인지 반드시 밝혀야 한다.',
 '**calibrated Pass@1**이라는 보정된 지표를 쓴다는 점에 유의해야 한다 — 원점수와 다를 수 있으며, 논문은 일부 모델이 긴 프롬프트의 앞부분(모듈 임포트 등)을 누락해 실패하는 현상까지 반영해 보정했다.',
 '**GPT-4 계열은 특정 요청에서 거부(refusal) 응답을 내는 경우가 있다**고 저자들이 명시한다 — 낮은 점수가 항상 능력 부족이 아니라 거부로 인한 것일 수 있다.'
],

figures:[
 {f:'fig1-task-example.png',
  cap:'왼쪽이 실제 과제 하나의 docstring(HTTPS GET 요청 함수) — Parameters·Returns·Raises·Requirements·Examples가 구조화돼 있다. 오른쪽 Test Case Class에 setup/teardown과 함께 정상 경로·에러 경로(SSL 핸드셰이크 실패 등)를 검증하는 개별 테스트 메서드들이 나열돼 있다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'LLMs are not yet capable of following complex instructions to use function calls precisely, with scores up to 60%, significantly lower than the human performance of 97%.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2406.15877 — BigCodeBench', u:'https://arxiv.org/abs/2406.15877'},
 {t:'프로젝트 페이지 — bigcode-bench.github.io', u:'https://bigcode-bench.github.io/'}
]
});
