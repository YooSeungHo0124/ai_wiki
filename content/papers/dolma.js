WIKI.paper({
slug:'dolma',
venue:'ACL 2024 (arXiv-only 최초 공개)',
authors:'Soldaini, Kinney, Bhagia et al. (Allen Institute for AI)',
arxiv:'2402.00159',

tldr:'3조 토큰 규모의 영어 사전학습 코퍼스를 공개하면서, **데이터 구성의 모든 결정마다 ablation으로 근거를 남기고** 그 처리 파이프라인 자체(Dolma Toolkit)까지 오픈소스로 낸 논문. [OLMo](#/p/olmo)의 학습 데이터다.',

context:'2024년 초까지 강력한 언어모델의 학습 데이터는 대부분 블랙박스였다. GPT-4·Claude 같은 상용 모델은 데이터 구성을 전혀 밝히지 않았고, Llama 2처럼 모델 가중치를 공개한 경우도 학습 데이터나 재현 레시피는 함께 내놓지 않았다. [The Pile](#/p/the-pile)이나 [RefinedWeb](#/p/refinedweb) 같은 이전 공개 코퍼스도 최종 데이터셋만 던져줄 뿐, 각 필터링·중복제거 단계가 실제로 모델 성능에 얼마나 기여하는지는 대부분 근거 없이 서술로만 남겼다. 이런 불투명성은 "학습 데이터 구성이 모델 능력에 어떤 영향을 주는가"라는 과학적 질문 자체를 연구 불가능하게 만든다. Dolma는 데이터·코드·중간 산출물·ablation 결과를 전부 공개해 이 공백을 메우려 한다.',

ideas:[
 {h:'6개 소스, 3조 토큰, 200TB에서 11TB로',
  lead:'CommonCrawl·GitHub·Reddit·Semantic Scholar·구텐베르크·위키피디아를 섞은 다중 소스 코퍼스.',
  d:'Common Crawl 웹페이지(2.48T 토큰)를 뼈대로, GitHub 코드(411B), Reddit 소셜미디어(89B), Semantic Scholar 논문(70B), 퍼블릭 도메인 도서(6B), 위키피디아·위키북스(4.3B)를 더한다. 원본 약 200TB 텍스트를 정제해 최종 11TB, 3조 토큰(LLaMA 토크나이저 기준)으로 줄였다. 소스 구성 자체는 [The Pile](#/p/the-pile)의 다중 소스 철학을 잇지만 규모가 한 자릿수 이상 크다.'},
 {h:'모든 파이프라인 선택을 1B 모델 ablation으로 검증한다',
  lead:'필터·중복제거·PII 처리 방식마다 실제로 학습해 HellaSwag 등에서 효과를 비교한다.',
  d:'품질 필터 규칙 하나를 넣을지 뺄지, PII를 스페셜 토큰으로 치환할지 문서째 지울지 같은 세부 결정마다 1B 모델을 학습시켜 다운스트림 성능을 측정한다. 예를 들어 Gopher 규칙 전체 + C4의 구두점 규칙 하나(C4 NoPunc)를 결합한 조합이 C4 규칙 전체보다 나은 결과를 냈다는 식으로, "우리 선택이 왜 이것인가"에 실측 근거가 붙는다.'},
 {h:'CommonCrawl 파이프라인: CCNet 이후 URL→문서→단락 3단 중복제거',
  lead:'exact URL dedup → exact 문서 dedup → 단락 dedup 순으로 겹치는 텍스트를 걷어낸다.',
  d:'CCNet 출력을 받아 URL 단위 정확 중복제거(문서의 53.2% 제거)를 가장 먼저 돌려 이후 단계의 처리량을 크게 줄인다. 이어서 URL-dedup 결과 중 14.9%를 문서 단위로, 18.7%의 단락을 단락 단위로 추가 제거한다. 단락 제거를 맨 마지막에 두는 이유는 너무 일찍 하면 내용 분석(문서 길이·언어 판정 등)이 흐트러지기 때문이다. 품질·콘텐츠 필터링과 겹겹이 쌓았을 때 HellaSwag 정확도가 각 단계마다 순증가하는 압축 효과를 Figure 3에서 확인한다.'},
 {h:'toxic·PII 필터링을 분류기가 아니라 룰·경량 분류기로',
  lead:'Presidio급 PII 탐지기는 규모 때문에 못 쓰고, 정규식과 경량 분류기로 대신한다.',
  d:'3조 토큰 규모에서 모델 기반 PII 탐지기는 계산 비용이 감당되지 않아, 이메일·IP·전화번호 세 종류만 정밀도 높은 정규식으로 잡는다. PII 스팬이 5개 이하인 문서는 스페셜 토큰으로 치환하고(문서의 0.02%), 밀도가 높으면 문서째 삭제한다(0.001%). ablation 결과 이 세부 처리 방식(치환 vs 삭제)은 학습 결과에 사실상 영향을 주지 않았다 — 대상 비율 자체가 워낙 작기 때문이다.'},
 {h:'Dolma Toolkit: 데이터 자체가 아니라 만드는 도구를 공개한다',
  lead:'필터링·태깅·믹싱을 Rust로 병렬화한 고성능 툴킷을 Apache 2.0으로 낸다.',
  d:'C4 레시피를 자체 구현으로 재현하는 내부 테스트에서 TB당 122 CPU시간의 처리 속도를 냈고, 이 속도면 200TB 원본 전체를 192 vCPU 인스턴스 한 대로 5일 안에 처리할 수 있다고 밝힌다. 데이터셋 그 자체보다 "어떻게 만드는가"를 재현 가능하게 만든 것이 이 논문의 또 다른 축이다.'}
],

diagram:{type:'flow', cap:'CommonCrawl 웹 서브셋 파이프라인. CCNet 출력에서 시작해 3단 중복제거와 필터링을 순서대로 통과한다.',
 nodes:[
  {t:'CCNet 출력', s:'언어·품질 태깅'},
  {t:'URL 중복제거', s:'-53.2% 문서', acc:true},
  {t:'문서 중복제거', s:'-14.9%'},
  {t:'품질·콘텐츠 필터', s:'Gopher+C4 NoPunc'},
  {t:'단락 중복제거', s:'-18.7% 단락'}
 ]},

math:[
 {expr:'Gopher All + C4 NoPunc > C4 All ≈ Gopher All (HellaSwag ablation)',
  tex:'\\text{Gopher\\_All} + \\text{C4\\_NoPunc} \\;>\\; \\text{C4\\_All} \\;\\approx\\; \\text{Gopher\\_All}',
  d:'수식이라기보다 ablation의 핵심 발견을 정리한 부등식이다. Gopher 규칙 전체(UTF-8 문자의 15.23% 태깅)에 C4 규칙 중 구두점으로 끝나지 않는 단락만 지우는 규칙(22.73% 태깅) 하나를 얹은 조합이, C4 규칙 전체를 쓰는 것보다도 HellaSwag에서 나은 결과를 냈다.'}
],

numbers:[
 {k:'총 규모', v:'3조 토큰 · 11.5TB · 4.37억 문서', d:'LLaMA 토크나이저 기준, 원본 약 200TB에서 정제 (Table 1)'},
 {k:'Common Crawl 비중', v:'2.48조 토큰 (81%)', d:'9,812GB, 37.3억 문서 — 최대 소스'},
 {k:'GitHub 코드', v:'411B 토큰', d:'the Stack 기반, RedPajama v1·StarCoder 규칙으로 필터링'},
 {k:'URL 중복제거 제거율', v:'53.2%', d:'CCNet 출력 문서 중 URL 단위로 걸러지는 비율, 3단계 중 가장 큼'},
 {k:'처리 속도', v:'122 CPU시간/TB', d:'C4 레시피 재현 테스트 기준, 200TB 전량을 192 vCPU 1대로 5일 내 처리 가능'},
 {k:'PII 영향 문서 비율', v:'스페셜 토큰 치환 0.02% · 전체 삭제 0.001%', d:'ablation상 처리 방식 차이가 성능에 미치는 영향은 무시할 수준'}
],

impact:'Dolma는 "3조 토큰짜리 코퍼스를 냈다"는 규모 자체보다, **각 데이터 처리 결정에 ablation 근거를 붙이는 관행**을 공개 LLM 데이터셋 연구의 표준으로 밀어올렸다. 이전까지 "Gopher 규칙을 썼다" 식의 서술에 그치던 부분이, 이 논문 이후로는 "이 규칙 조합이 저 조합보다 HellaSwag에서 몇 % 낫다"는 실측으로 뒷받침되어야 한다는 기대가 생겼다. Dolma Toolkit이라는 처리 인프라 자체를 공개한 것도, 후속 연구가 데이터셋 결과물뿐 아니라 재현 가능한 파이프라인을 함께 내는 관행으로 이어졌다. [OLMo](#/p/olmo)가 이 데이터로 학습되어 완전히 투명한 오픈 언어모델 스택(데이터·코드·가중치·로그)의 첫 완성형이 되었다.',

legacy:[
 '[OLMo](#/p/olmo) 시리즈의 사전학습 데이터로 쓰이며, "데이터·코드·가중치·중간 체크포인트를 전부 공개한다"는 완전 개방 LLM 스택의 한 축이 됨',
 'Dolma Toolkit(Rust 기반 필터링·믹싱 파이프라인)이 이후 여러 오픈 코퍼스 프로젝트의 처리 인프라로 참조됨',
 '"필터링 규칙 하나하나에 ablation을 남긴다"는 방법론이 이후 [FineWeb](#/p/fineweb) 등 후속 데이터셋 논문의 표준 절차로 자리잡음',
 'PromptSource 등 평가 벤치마크와의 오염(contamination) 비율을 논문 안에서 직접 정량화해 공개한 것이 데이터셋 문서화의 관례를 한 단계 끌어올림'
],

pitfalls:[
 '**1B 모델 ablation 결과가 더 큰 모델에 그대로 전이된다는 보장은 없다.** 논문이 사용한 필터·중복제거 비교는 전부 1B 규모 모델·수백억 토큰 학습에서 나온 것이며, OLMo 본 학습(수십B 파라미터급)에서 같은 순위가 재현되는지는 별도로 검증돼야 한다.',
 '**공개 = 오염 없음이 아니다.** 논문 스스로 PromptSource 벤치마크와의 오염 비율을 정량화해 공개했는데, 이는 역설적으로 대규모 웹 코퍼스에는 어떤 필터링을 거쳐도 벤치마크 문항이 섞여 들어온다는 사실을 보여준다. Dolma로 학습한 모델의 벤치마크 점수를 읽을 때 이 점을 감안해야 한다.',
 '**Reddit·CommonCrawl 소스는 저작권·개인정보 관련 법적 회색지대에 있다.** 정규식 기반 PII 필터링은 이메일·IP·전화번호 같은 명시적 패턴만 잡을 뿐, 재구성 가능한 개인정보나 저작권 콘텐츠 자체를 걸러내지는 못한다.'
],

figures:[
 {f:'table1-composition.png',
  cap:'6개 소스별 원본 용량(GB)·문서 수·유니코드 단어 수·LLaMA 토큰 수. Common Crawl 한 소스가 전체 3조 토큰 중 2.48조(81%)를 차지하고, 나머지 5개 소스가 코퍼스의 다양성을 담당한다는 것이 숫자로 드러난다.',
  src:'원문 Table 1, p.2'},
 {f:'fig3-ablation.png',
  cap:'가로축이 학습 토큰 수, 세로축이 HellaSwag 정확도. 파란 baseline(무필터) 위에 품질 필터(주황)를 얹고, 중복제거(초록)를 더하고, 콘텐츠 필터까지 쌓은 빨강이 매 단계 위로 벌어진다 — 필터링·중복제거가 서로 상쇄되지 않고 누적된다는 것이 이 그래프의 핵심이다.',
  src:'원문 Figure 3, p.6'}
],

quotes:[
 {t:'Information about pretraining corpora used to train the current best-performing language models is seldom discussed: commercial models rarely detail their data, and even open models are often released without accompanying training data or recipes to reproduce them.',
  src:'Abstract, p.1'},
 {t:'We open source the Dolma Toolkit, a high-performance, portable tool designed to efficiently curate large datasets for language model pretraining.',
  src:'Section 1, p.2'}
],

links:[
 {t:'arXiv 2402.00159 — Dolma', u:'https://arxiv.org/abs/2402.00159'},
 {t:'HuggingFace Dataset — allenai/dolma', u:'https://huggingface.co/datasets/allenai/dolma'},
 {t:'GitHub — allenai/dolma (Toolkit)', u:'https://github.com/allenai/dolma'}
]
});
