WIKI.paper({
slug:'datasheets',
venue:'Communications of the ACM 2021 (arXiv 2018)',
authors:'Gebru et al. (Black in AI · Microsoft Research · U. Washington)',
arxiv:'1803.09010',

tldr:'데이터셋에도 전자부품처럼 **명세서(datasheet)**를 붙이자는 제안. 수집 동기·구성·수집 절차·전처리·권장 용도·배포·유지보수를 정해진 질문 목록으로 답하게 해, 데이터셋을 가져다 쓰는 사람이 그 안에 무엇이 들어 있고 무엇을 위해 만들어졌는지 알 수 있게 한다.',

context:'2018년의 머신러닝 커뮤니티는 데이터셋을 문서화하는 표준 절차가 없었다. [ImageNet](#/p/imagenet) 같은 대형 데이터셋도 수집 방식·라벨링 기준·알려진 편향이 논문 몇 줄에만 흩어져 있거나 아예 기록되지 않았다. 데이터베이스 커뮤니티는 오래전부터 **데이터 출처(provenance)**를 연구해 왔지만 머신러닝 쪽에는 이 관행이 넘어오지 않았다. 그 결과 모델이 배포 환경과 다른 분포의 데이터로 학습되거나, 데이터셋에 담긴 사회적 편향이 그대로 모델에 옮겨붙는 사고가 반복됐다. 전자부품 업계에서는 아무리 단순한 부품에도 동작 특성·시험 결과·권장 사용법을 적은 datasheet가 따라붙는다는 데서 저자들은 착안했다.',

ideas:[
 {h:'7단계 질문지로 데이터셋 생애주기를 훑는다',
  lead:'Motivation부터 Maintenance까지 데이터셋이 태어나 쓰이고 늙는 전 과정을 질문으로 덮는다.',
  d:'**Motivation**(왜 만들었나) → **Composition**(무엇이 들어있나) → **Collection Process**(어떻게 모았나) → **Preprocessing/cleaning/labeling** → **Uses**(어디에 써도 되나) → **Distribution**(어떻게 배포하나) → **Maintenance**(누가 관리하나), 이렇게 7개 절로 나뉜다. 순서 자체가 데이터셋이 만들어지고 배포되는 실제 흐름을 따라간다.'},
 {h:'개인정보 관련 질문은 따로 묶는다',
  lead:'사람과 관련된 데이터셋에만 해당하는 질문을 절 끝에 별도로 모아 GDPR류 규제 대응을 돕는다.',
  d:'Composition과 Collection Process 절 끝에는 "이 데이터셋이 사람과 관련이 있는가"에만 해당하는 질문들 — 하위집단 식별 가능 여부, 개인 재식별 가능성, 동의 절차, 동의 철회 메커니즘 — 을 따로 묶었다. 사람과 무관한 데이터셋(예: 센서 로그)을 만드는 사람은 이 블록을 건너뛰면 된다.'},
 {h:'예/아니오로 답하지 못하게 서술형으로 설계',
  lead:'제품팀 실사용 관찰을 반영해 질문을 예/아니오가 아니라 설명을 요구하는 형태로 다듬었다.',
  d:'두 개 대형 기술기업의 제품팀에 초안을 배포해 실제로 어디서 질문이 목적을 달성하지 못하는지 관찰했다. 그 결과 "예/아니오"로 끝나버리는 질문은 서술을 요구하는 형태로 다시 썼고, 처음에 따로 뒀던 "법적·윤리적 고려사항" 절은 없애고 각 단계별 질문 안에 녹여 넣었다 — 팀들이 맥락 없이 던져진 법률 질문에는 잘 답하지 않았기 때문이다.'},
 {h:'문서화는 자동화하지 않는다',
  lead:'datasheet 작성을 의도적으로 수작업으로 남겨, 만드는 사람이 데이터를 되돌아보게 한다.',
  d:'자동으로 통계를 뽑아 채우는 문서화 도구가 더 편하겠지만, 저자들은 이를 의도적으로 거부한다. datasheet를 쓰는 과정 자체가 데이터셋 제작자가 자신의 수집·전처리 결정을 **되짚어보는 계기**여야 한다는 것이 목적이기 때문이다.'}
],

diagram:{type:'flow', cap:'하나의 datasheet가 훑는 7개 절. 왼쪽이 데이터셋이 태어나는 시점, 오른쪽이 배포 이후.',
 nodes:[
  {t:'Motivation', s:'왜 만들었나'},
  {t:'Composition', s:'무엇이 들어있나', acc:true},
  {t:'Collection', s:'어떻게 모았나'},
  {t:'Preprocessing', s:'정제·라벨링'},
  {t:'Uses', s:'권장/금지 용도'},
  {t:'Distribution', s:'배포 방식·라이선스'},
  {t:'Maintenance', s:'갱신·연락처'}
 ]},

numbers:[
 {k:'개발 기간', v:'약 2년', d:'초안 배포 후 피드백을 반복 수집하며 질문지를 다듬은 기간'},
 {k:'시험 데이터셋', v:'2개', d:'Labeled Faces in the Wild, Pang & Lee의 polarity dataset(영화 리뷰 감성 극성)에 예시 datasheet를 직접 작성해 검증'},
 {k:'질문지 배포', v:'미국 대형 기술기업 2곳', d:'제품팀에 실제로 배포해 질문이 목적을 달성하지 못하는 지점을 관찰'},
 {k:'절 구성 변화', v:'"Uses" 절 신설, "법적·윤리적 고려사항" 절 삭제', d:'제품팀 피드백을 반영해 초안에서 최종안으로 바뀐 부분'}
],

impact:'데이터셋 문서화를 연구자 개인의 선의에 맡기지 않고 **표준 절차**로 제도화하는 첫걸음이 됐다. 이후 구글은 모델 버전의 datasheet 격인 Model Cards를 냈고, [ImageNet](#/p/imagenet)·[LAION-5B](#/p/laion5b)·[Dolma](#/p/dolma) 같은 대형 데이터셋 논문들이 수집 동기·구성·알려진 한계를 이 틀에 맞춰 서술하는 관행을 따르게 됐다. Data Nutrition Project, IBM의 FactSheets 등 인접 제안들도 이 틀을 흡수했다.',

legacy:[
 '**Model Cards** — 구글이 datasheets의 대상을 데이터셋에서 학습된 모델로 옮겨 발표한 자매 문서 규격',
 '**대형 데이터셋 논문의 관행화** — [LAION-5B](#/p/laion5b), [Dolma](#/p/dolma) 등이 수집 절차·필터링·라이선스를 별도 절로 서술하는 근거가 됨',
 '**감사(audit) 연구의 출발점** — 데이터셋에 명시적으로 기록된 한계가 있어야 이후의 편향 감사·재현 연구가 가능해짐'
],

pitfalls:[
 '**법적 구속력이 있는 규격이 아니다.** datasheet는 자발적 문서화 프레임워크이고, 작성을 강제하거나 내용을 검증하는 기구는 없다 — 실제로 어떤 데이터셋에 datasheet가 있다고 해서 그 내용이 정확하거나 최신이라는 보장은 없다.',
 '**질문 목록이 고정된 체크리스트가 아니다.** 저자들은 도메인·조직에 따라 질문을 가감해도 된다고 명시한다. 모든 datasheet가 논문의 질문을 토씨 하나 안 틀리고 따라야 한다는 것은 오해다.',
 '**동적으로 계속 갱신되는 데이터셋에는 잘 맞지 않는다.** 논문 스스로 이 한계를 인정하며, 자주 바뀌지 않는 데이터셋에 버전별 datasheet를 붙이는 방식을 권한다.'
],

quotes:[
 {t:'In the electronics industry, every component, no matter how simple or complex, is accompanied with a datasheet describing its operating characteristics, test results, recommended usage, and other information.',
  src:'Introduction, p.1'},
 {t:'We emphasize that the process of creating a datasheet is not intended to be automated.',
  src:'Section 1.1, p.3'}
],

links:[
 {t:'arXiv 1803.09010 — Datasheets for Datasets', u:'https://arxiv.org/abs/1803.09010'},
 {t:'Communications of the ACM (2021) 판', u:'https://cacm.acm.org/research/datasheets-for-datasets/'}
]
});
