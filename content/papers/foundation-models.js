WIKI.paper({
slug:'foundation-models',
venue:'Stanford CRFM 입장 보고서 (arXiv 2021)',
authors:'Bommasani, Hudson, Liang et al. (Stanford Center for Research on Foundation Models, 100명 이상)',
arxiv:'2108.07258',

tldr:'[BERT](#/p/bert)·[GPT-3](#/p/gpt3)·[CLIP](#/p/clip)류 모델을 아우르는 **"파운데이션 모델"이라는 용어 자체를 만들어낸** 214쪽짜리 스탠퍼드 입장 보고서. 새 알고리즘을 제안한 논문이 아니라, 이미 벌어지고 있던 패러다임 전환에 이름을 붙이고 그 능력·기술·응용·사회적 영향을 100명 이상의 저자가 26개 절로 나눠 정리한 선언문에 가깝다.',

context:'2021년 중반, [GPT-3](#/p/gpt3)의 175B 파라미터와 few-shot 능력, [CLIP](#/p/clip)의 비전-언어 정렬, 코드 생성 모델 Codex까지 "하나의 거대 사전학습 모델을 다양한 하위 작업에 적응시킨다"는 패턴이 언어·비전·코드 전반에서 동시다발적으로 나타나고 있었다. 문제는 이를 부르는 이름이 없었다는 점이다. `pretrained model`이나 `self-supervised model`은 기술적 절차만 가리킬 뿐 이 모델들이 만들어내는 **사회적·경제적 파급**을 담지 못했고, `language model`은 언어 바깥으로 확장된 현실을 좁게 규정했다. 스탠퍼드 HAI 산하 CRFM은 2021년 워크숍을 열어 이 현상 전체를 규정할 이름과 틀을 만들기로 했다.',

ideas:[
 {h:'"파운데이션 모델"이라는 이름을 새로 만든다',
  lead:'base model·platform model 등 여러 후보를 검토한 끝에 "foundation"을 택했다.',
  d:'저자들은 `pretrained model`(기술 절차만 지칭), `general-purpose model`(미완성 성격을 못 담음), `task-agnostic model`(하위 응용에 대한 함의 부족) 등을 검토하고 기각했다. "foundation(토대)"을 고른 이유는 이중적이다 — 그 자체로는 미완성이지만 그 위에 수많은 응용이 지어진다는 점, 그리고 부실한 토대가 그 위 모든 것을 위태롭게 한다는 경고를 동시에 담기 위해서다.'},
 {h:'핵심은 두 단어 — emergence(창발)와 homogenization(획일화)',
  lead:'능력이 설계가 아니라 규모에서 저절로 나타나고, 그 하나의 모델이 모든 응용의 공통 기반이 된다.',
  d:'`[창발](#/p/emergent)`은 시스템의 행동이 명시적으로 설계되지 않았는데도 나타나는 것 — in-context learning이 대표 사례다. Homogenization은 머신러닝이 로지스틱 회귀로, 딥러닝이 CNN 아키텍처로 수렴했듯, 이제 여러 태스크가 **하나의 파운데이션 모델**로 수렴하는 현상이다. 이 결합이 위험한 이유는, 모델 하나의 결함이 그 위에 지어진 모든 하위 응용에 그대로 상속되는 **단일 실패점**을 만들기 때문이다.'},
 {h:'능력·응용·기술·사회를 한 보고서에 욱여넣는다',
  lead:'26개 절을 100명 이상이 나눠 써 언어부터 법률·환경까지 하나의 틀로 묶는다.',
  d:'2장 능력(언어·비전·로보틱스·추론·상호작용·이해의 철학), 3장 응용(의료·법률·교육), 4장 기술(모델링·훈련·적응·평가·시스템·데이터·보안·강건성·안전·이론·해석가능성), 5장 사회(불평등·오용·환경·법·경제·규모의 윤리)로 나뉜다. 개별 절의 깊이는 전문 논문에 못 미치지만, **한 현상을 이만큼 넓게 한 틀로 엮은 시도 자체가 이 문서의 기여**다.'},
 {h:'연구와 배포를 구분해야 한다',
  lead:'논문·데모로 알려진 "연구"와 실제 제품에 들어간 "배포"는 사회적 위험이 다르다.',
  d:'GitHub Copilot처럼 새 제품으로 배포되는 경우도 있지만, 더 흔한 경로는 구글 검색에 BERT가 조용히 편입되듯 기존 서비스에 스며드는 것이다. 저자들은 연구 단계 모델과 실사용에 노출된 배포 모델에 요구되는 검증 수준이 달라야 한다고 강조하며, 데이터 생성 → 데이터 큐레이션 → 훈련 → 적응 → 배포로 이어지는 파이프라인 전체에서 **사람이 양 끝에 있다**는 점을 프레임의 축으로 삼는다.'},
 {h:'우리는 이 모델을 실제로는 잘 모른다는 것을 전제로 한다',
  lead:'해석가능성·이론·평가 절 전체가 "왜 되는지 모른다"는 고백에서 출발한다.',
  d:'보고서는 낙관과 경고를 같은 비중으로 배치한다. 의료·법률·교육에서의 기회를 서술하는 동시에, 불평등 심화·환경 비용·저작권과 법적 책임·소수 사업자로의 권력 집중 같은 위험을 나열한다. "이 모델이 신뢰할 만한 토대인지 아직 판단할 수 없다"는 문장이 결론부에 반복되는데, 이것이 보고서 전체의 인식론적 태도다.'}
],

diagram:{type:'flow', cap:'하나의 파운데이션 모델이 여러 모달리티의 데이터를 흡수해 다양한 하위 태스크로 갈라진다 — 원문 Fig. 2의 구조.',
 nodes:[
  {t:'다중 모달 데이터', s:'텍스트·이미지·음성 등'},
  {t:'대규모 사전학습', s:'self-supervision'},
  {t:'파운데이션 모델', s:'단일 공통 기반', acc:true},
  {t:'적응(Adaptation)', s:'fine-tuning · 프롬프트'},
  {t:'하위 태스크', s:'QA·분류·캡셔닝 등'}
 ]},

numbers:[
 {k:'저자 수', v:'100명 이상', d:'스탠퍼드 CRFM 소속 연구자들이 26개 절을 나눠 집필'},
 {k:'분량', v:'214쪽', d:'개별 논문이 아니라 보고서(report) 형식'},
 {k:'GPT-3 파라미터', v:'175B', d:'전작 GPT-2(1.5B) 대비 100배 이상 — 본문이 규모의 예시로 직접 인용'},
 {k:'구조', v:'4부 · 26개 절', d:'능력(6) · 응용(3) · 기술(11) · 사회(6) 절로 구성'},
 {k:'핵심 개념어', v:'emergence · homogenization', d:'저자들이 보고서 전체의 의의를 요약한 두 단어'}
],

impact:'이 보고서 이후 "foundation model"은 학계·업계·정책 문서에서 [GPT](#/p/gpt1) 계열·[BERT](#/p/bert) 계열·확산 모델을 아우르는 표준 용어로 굳어졌고, 이후 EU AI Act 등 규제 문서에도 이 명명이 반영됐다. 동시에 이 보고서는 CRFM이라는 조직 자체의 존재 근거가 되어, 이후 [Foundation Model Transparency Index](https://arxiv.org/abs/2310.12941)·Ecosystem Graphs 등 같은 그룹의 후속 감시·평가 프로젝트로 이어졌다.',

legacy:[
 '**용어의 정착** — 이후 거의 모든 대형 사전학습 모델 보고서·정책 문서가 "foundation model"을 표준 용어로 채택',
 '**투명성·거버넌스 감시로 확장** — 같은 CRFM 그룹이 Foundation Model Transparency Index, Ecosystem Graphs 등으로 이어감',
 '**정책 문서에 반영** — EU AI Act를 비롯한 여러 AI 규제 논의에서 "foundation model"을 법적·정책적 범주로 채택',
 '**"거대 담론 보고서" 장르의 원형** — 이후 유사한 다저자 입장 보고서(예: 안전·정렬 관련 컨센서스 문서)의 형식적 참고가 됨'
],

pitfalls:[
 '**이 문서는 새 방법론을 제안하지 않는다.** 벤치마크 수치나 알고리즘이 아니라 용어와 프레임을 제안하는 입장문이라, "논문을 읽었는데 무슨 실험을 했는지 모르겠다"는 반응은 이 문서의 성격을 오해한 것이다.',
 '**"foundation model"이라는 이름 자체가 논쟁적이다.** AI Now Institute의 Meredith Whittaker 등은 "이미 large language model이라는 이름이 있는데 새로 이름 붙였을 뿐"이라며, 스탠퍼드가 산업계와 가까운 위치에서 용어를 주도한 것에 문제를 제기했다. 이름이 중립적 학술 용어가 아니라 **특정 관점을 담은 프레이밍**이라는 점을 감안해야 한다.',
 '**보고서 저자 다수가 파운데이션 모델을 만드는 산업계와 밀접하다.** 이해관계가 없는 제3자의 규정이 아니라, 이 패러다임을 추진하는 진영 내부에서 나온 이름과 낙관·경고의 균형이라는 점을 유의해야 한다.'
],

figures:[
 {f:'fig1-emergence-homog.png',
  cap:'가로축은 시간의 흐름. 머신러닝은 "어떻게 풀지(how)"를, 딥러닝은 특징(feature)을, 파운데이션 모델은 기능(functionality) 자체를 창발시킨다는 저자들의 3단계 서사 — 동시에 각 단계마다 무엇이 획일화됐는지(학습 알고리즘 → 아키텍처 → 모델 자체)를 짝지어 보여준다.',
  src:'원문 Fig. 1, p.3'},
 {f:'fig2-centralize.png',
  cap:'왼쪽의 다양한 모달리티 데이터가 하나의 파운데이션 모델로 모이고(Training), 오른쪽의 서로 다른 하위 태스크로 각각 적응(Adaptation)된다. 화살표 방향이 "하나에서 여럿으로" 퍼지는 구조를 보여준다 — 이 한 장이 보고서 전체가 말하는 homogenization의 그림이다.',
  src:'원문 Fig. 2, p.6'}
],

quotes:[
 {t:'AI is undergoing a paradigm shift with the rise of models... trained on broad data that can be adapted to a wide range of downstream tasks. We call these models foundation models to underscore their critically central yet incomplete character.',
  src:'Abstract, p.1'},
 {t:'The significance of foundation models can be summarized by two words: emergence and homogenization.',
  src:'Section 1.1, p.3'}
],

links:[
 {t:'arXiv 2108.07258 — On the Opportunities and Risks of Foundation Models', u:'https://arxiv.org/abs/2108.07258'},
 {t:'CRFM (Stanford Center for Research on Foundation Models)', u:'https://crfm.stanford.edu/'},
 {t:'Emerging Tech Brew — 명명 논쟁 보도', u:'https://www.emergingtechbrew.com/stories/2021/08/30/stanfords-foundation-models-workshop-large-language-model-debate-resurfaces'}
]
});
