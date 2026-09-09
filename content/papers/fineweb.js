WIKI.paper({
slug:'fineweb',
venue:'NeurIPS 2024 (Datasets and Benchmarks Track)',
authors:'Penedo, Kydlíček, Ben Allal et al. (Hugging Face)',
arxiv:'2406.17557',

tldr:'96개 CommonCrawl 스냅샷을 정제해 15조 토큰 코퍼스를 만들면서, **필터를 하나씩 추가하며 소형 모델로 그 효과를 실측하는 방법론**을 그대로 공개한 논문. 교육적 가치로 다시 거른 FineWeb-Edu(1.3조 토큰)가 훨씬 작은 규모로도 지식·추론 벤치마크를 크게 끌어올렸다.',

context:'[RefinedWeb](#/p/refinedweb)이 "웹 데이터만으로도 충분하다"는 것을 보였지만, 공개된 것은 6,000억 토큰 추출본뿐이었고 파이프라인의 각 선택이 왜 그렇게 정해졌는지는 서술적 근거에 머물렀다. [Dolma](#/p/dolma)는 ablation을 남겼지만 CommonCrawl 스냅샷 하나 분량, 3조 토큰 규모였다. 문제는 [Chinchilla](#/p/chinchilla) 최적 학습에 필요한 토큰 수가 모델을 키울수록 기하급수로 늘어나는데, 공개 웹 코퍼스 중 15조 토큰급으로 검증까지 마친 것은 없었다는 점이다. FineWeb은 이 공백을 CommonCrawl 96개 스냅샷 전체로 메우면서, "이 필터를 넣을지 뺄지"를 매번 1.71B 모델을 학습시켜 판단하는 절차를 논문의 중심에 놓는다.',

ideas:[
 {h:'96개 스냅샷 → 15조 토큰, 필터 하나마다 소형 모델로 검증',
  lead:'WARC 원문 추출부터 커스텀 필터까지 각 단계를 1.71B 모델 ablation으로 확정한다.',
  d:'2013년부터 누적된 CommonCrawl 96개 스냅샷의 WARC(가공 전 원본 HTML 응답) 파일에서 시작해, trafilatura 텍스트 추출 → 언어 필터링(fastText, 임계값 0.65) → 개별 스냅샷별 MinHash 중복제거 → [The Pile](#/p/the-pile)식 C4 규칙 선별 적용 → 자체 휴리스틱 필터 순으로 쌓는다. 각 단계는 1.71B 파라미터 모델을 28B~350B 토큰으로 학습시켜 8개 벤치마크 평균 점수가 실제로 오르는지 확인한 뒤에만 채택된다.'},
 {h:'전역(global) MinHash가 아니라 스냅샷별(individual) MinHash를 쓴다',
  lead:'96개 스냅샷을 통째로 합쳐 중복제거하면 오히려 저품질 데이터가 상대적으로 늘어난다.',
  d:'처음에는 최신 스냅샷부터 과거로 거슬러 올라가며 전체 데이터에 대해 하나의 MinHash 중복 제거를 적용했다. 그런데 이 방식은 자주 재크롤링되는 고품질 페이지(뉴스·백과사전 등)를 과도하게 솎아내고, 드물게만 나타나는 저품질 페이지의 비중을 상대적으로 키우는 부작용을 낳았다 — 결과적으로 350B 토큰 ablation에서 성능이 base filtering 대비 거의 개선되지 않았다. 스냅샷을 하나씩 독립적으로 중복제거하는 방식으로 바꾸자 [RefinedWeb](#/p/refinedweb) 수준의 성능을 회복했다.'},
 {h:'C4 필터 중 "터미널 구두점" 규칙 하나가 대부분의 효과를 낸다',
  lead:'C4의 여러 휴리스틱 중 문장이 구두점으로 끝나는지 보는 규칙 하나가 가장 크게 기여한다.',
  d:'C4 필터 전체(All)를 적용하면 HellaSwag에서 base filtering을 크게 앞서는데, 이를 개별 규칙으로 쪼개 ablation한 결과 terminal_punctuation 규칙 하나가 전체 효과의 대부분을 설명했다. curly-brace 규칙 등 나머지는 효과 대비 제거량이 크거나(과잉 삭제) 기여가 작아, 최종적으로는 C4 규칙 전체를 그대로 채택했다.'},
 {h:'FineWeb-Edu: LLM이 매긴 교육적 가치 점수로 다시 거른다',
  lead:'Llama-3-70B로 46만 페이지를 0~5점 채점하고, 그 라벨로 경량 분류기를 학습해 15조 토큰 전체에 적용한다.',
  d:'Llama-3-70B-Instruct에게 페이지가 초·중등 교육 수준에서 얼마나 유용한지 0~5점으로 매기게 하고(단계별로 기준을 쌓아가는 additive 프롬프트 사용), 이 46만 개 합성 라벨로 `Snowflake-arctic-embed-m` 임베딩 위에 얹은 선형회귀 분류기를 학습한다. 검증 F1 82%를 낸 이 분류기를 15조 토큰 전체에 돌리는 데 H100 GPU 6,000시간이 들었고, 점수 3점 이상만 남긴 것이 FineWeb-Edu(1.3조 토큰)다.'},
 {h:'FineWeb-Edu가 지식·추론 벤치마크에서 토큰 효율을 10배 가까이 끌어올린다',
  lead:'MMLU에서 FineWeb-Edu는 38B 토큰만으로 다른 데이터셋이 300B 토큰에서 내는 점수를 낸다.',
  d:'FineWeb-Edu로 학습한 모델은 MMLU 정확도가 33%→37%(상대 12% 개선), ARC가 46%→57%(상대 24% 개선)로 뛴다. 특히 MMLU에서는 Matrix 데이터셋이 300B 토큰으로 도달하는 정확도(33.6%)를 FineWeb-Edu는 38B 토큰만으로 도달한다 — LLM이 매긴 합성 라벨이 대규모 데이터 필터링에 실제로 쓸모 있다는 것을 실증한 사례로 제시된다.'}
],

diagram:{type:'flow', cap:'FineWeb 파이프라인. 각 화살표를 지날 때마다 1.71B 모델 ablation으로 효과를 확인한 뒤 다음 단계를 확정했다.',
 nodes:[
  {t:'WARC 추출', s:'trafilatura'},
  {t:'언어 필터링', s:'fastText θ=0.65'},
  {t:'스냅샷별 MinHash', s:'전역 dedup 아님', acc:true},
  {t:'C4 필터', s:'terminal_punct 핵심'},
  {t:'커스텀 휴리스틱', s:'FineWeb 최종', acc:true}
 ]},

math:[
 {expr:'8 hash/band × 14 band = 112 hash, band 매치 시 후보 중복으로 취급 후 union-find로 전이 병합',
  tex:'112 = 8 \\times 14 \\quad\\text{(hash functions per document)}',
  d:'MinHash 중복 후보는 5-그램 기준 112개 해시를 14개 밴드×8개 해시로 나눠, 한 밴드라도 일치하면 후보 쌍으로 잡는다. A-B, B-C가 각각 후보면 A-B-C를 모두 중복으로 묶는 union-find 방식이라, 직접 8개 해시가 안 겹쳐도 전이적으로 제거될 수 있다.'}
],

numbers:[
 {k:'FineWeb 규모', v:'15조 토큰 · 96개 스냅샷', d:'GPT-2 토크나이저 기준, CommonCrawl 전체 히스토리 사용'},
 {k:'FineWeb-Edu 규모', v:'1.3조 토큰', d:'교육적 가치 분류기 임계값 3점 이상만 통과'},
 {k:'분류기 검증 F1', v:'82%', d:'Llama-3-70B 합성 라벨을 정답으로 한 held-out 검증 (임계값 3)'},
 {k:'분류 적용 비용', v:'H100 GPU 6,000시간', d:'15조 토큰 전체에 교육 분류기를 돌리는 데 소요'},
 {k:'MMLU 개선', v:'33% → 37%', d:'FineWeb 대비 FineWeb-Edu, 상대 개선 약 12% (동일 350B 토큰 ablation)'},
 {k:'ARC 개선', v:'46% → 57%', d:'FineWeb 대비 FineWeb-Edu, 상대 개선 약 24%'}
],

impact:'FineWeb은 "필터를 추가할 때마다 실제로 측정한다"는 절차를 대규모 웹 코퍼스 구축의 기본값으로 만들었다 — 전역 MinHash가 오히려 성능을 깎는다는, 직관과 반대되는 발견도 이 절차 덕에 논문에 남을 수 있었다. FineWeb-Edu는 LLM이 매긴 합성 품질 라벨을 경량 분류기로 증류해 페타바이트급 데이터에 적용하는 레시피를 공개 재현 가능한 형태로 처음 대규모로 실증했다(같은 아이디어를 쓴 Llama 3·Phi-3의 필터는 비공개였다). 두 데이터셋과 함께 처리 라이브러리(datatrove)·ablation에 쓰인 전 모델을 공개해, 이후 데이터셋 논문들이 "무엇을 공개하는가"의 기준선을 다시 끌어올렸다.',

legacy:[
 '"교육적 가치 필터"라는 아이디어를 [phi-textbooks](#/p/phi-textbooks) 계열의 폐쇄적 실험에서 꺼내 대규모·재현 가능한 형태로 공개해, 이후 여러 오픈 코퍼스가 LLM 기반 품질 분류기를 재도입하는 흐름을 이끔',
 'FineWeb-Edu는 이후 SmolLM 등 소형 모델 계열의 핵심 사전학습 데이터로 재사용됨',
 '"전역 dedup보다 스냅샷별 dedup"이라는 반직관적 발견이 이후 웹 코퍼스 구축 시 중복제거 스코프를 다시 검토하게 만듦',
 '데이터셋과 함께 공개한 datatrove 처리 라이브러리·전체 ablation 모델이 [OLMo](#/p/olmo)·[Dolma](#/p/dolma) 계열과 함께 완전 개방형 데이터 파이프라인의 참조 구현으로 자리잡음'
],

pitfalls:[
 '**벤치마크 오염 위험을 논문 스스로 인정한다.** Paloma 도메인 적합도 실험에서 저자들은 "의도적으로 탈오염(decontamination)을 하지 않았다"고 명시하는데, 이는 역으로 FineWeb류 웹 코퍼스에 벤치마크 문항이 섞여 있을 가능성을 시사한다.',
 '**모든 ablation은 1.71B 모델·최대 350B 토큰 규모다.** 필터 순위(예: C4 terminal_punct가 최선)가 수십B 파라미터·수조 토큰 규모의 실제 프론티어 모델 학습에서도 같은 순서로 이득을 준다는 보장은 없다.',
 '**FineWeb-Edu의 "교육적"이라는 기준 자체가 Llama-3-70B의 판단을 그대로 물려받는다.** 저자들은 이 분류기가 Education·History·Culture 주제를 과대표집하고 Business·Entertainment·여행 주제를 축소한다는 편향을 직접 보고했으며, 이는 필터링 목표가 좁아질수록 데이터 다양성이 희생될 수 있음을 보여준다.',
 '**웹 스크랩 데이터 특유의 법적·윤리적 문제는 필터링으로 해결되지 않는다.** trafilatura로 본문만 추출해도 저작권이 있는 텍스트나 개인정보가 통계적 필터를 통과해 섞여 들어갈 수 있다.'
],

figures:[
 {f:'fig9-compounding.png',
  cap:'가로축이 학습 토큰 수, 세로축이 8개 벤치마크 평균 정확도. 초록(기본 필터)→분홍(스냅샷별 MinHash 추가)→파랑(C4 필터 추가)→주황(FineWeb 최종, 커스텀 휴리스틱까지 추가) 순으로 매 단계가 위로 벌어진다 — 파이프라인 각 단계가 실제로 누적 이득을 낸다는 근거.',
  src:'원문 Figure 9, p.8'},
 {f:'fig10-comparison.png',
  cap:'FineWeb(회색)이 이미 C4·RefinedWeb·Dolma·The Pile 등 기존 공개 데이터셋(같은 그래프의 다른 색 선들)을 대부분 앞서고, FineWeb-Edu(주황, 맨 위)는 전 구간에서 나머지를 전부 능가한다. 곡선이 갈라지는 정도가 곧 데이터 품질 차이다.',
  src:'원문 Figure 10, p.8'}
],

quotes:[
 {t:'We introduce FineWeb, a 15-trillion token dataset derived from 96 Common Crawl snapshots that produces better-performing LLMs than other open pretraining datasets.',
  src:'Abstract, p.1'},
 {t:'Applying the classifier to the 15 trillion tokens of FineWeb required 6,000 H100 GPU hours.',
  src:'Section 4, p.8'}
],

links:[
 {t:'arXiv 2406.17557 — The FineWeb Datasets', u:'https://arxiv.org/abs/2406.17557'},
 {t:'HuggingFace Dataset — HuggingFaceFW/fineweb', u:'https://huggingface.co/datasets/HuggingFaceFW/fineweb'},
 {t:'HuggingFace Dataset — HuggingFaceFW/fineweb-edu', u:'https://huggingface.co/datasets/HuggingFaceFW/fineweb-edu'}
]
});
