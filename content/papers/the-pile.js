WIKI.paper({
slug:'the-pile',
venue:'arXiv (EleutherAI 기술보고서)',
authors:'Gao, Biderman et al. (EleutherAI)',
arxiv:'2101.00027',

tldr:'22개의 이질적인 출처를 서로 다른 비율로 섞어 만든 **825GiB 영어 텍스트 데이터셋**. Common Crawl 하나에 의존하던 당시 관행 대신, 학술 논문·코드·법률·특허 같은 "웹에 잘 없는" 고품질 도메인을 의도적으로 upweight해서 [GPT-3](#/p/gpt3)급 모델의 일반화 성능을 끌어올리려 했다.',

context:'2020년의 대형 언어모델 학습 데이터는 사실상 Common Crawl 한 종류였다. [GPT-3](#/p/gpt3)도 CC 기반 데이터에 WebText2·Books·Wikipedia를 약간 섞는 정도였고, 비율의 대부분은 여전히 웹 크롤 텍스트였다. 문제는 크롤 데이터가 양은 많아도 **분포가 좁다**는 점이다 — 블로그·뉴스·포럼류 텍스트가 압도적이고, 학술 논문이나 코드, 법률 문서 같은 형식은 거의 없다. 저자들은 여러 개의 작고 질 좋은 도메인 특화 데이터를 섞으면 교차 도메인 일반화가 좋아진다는 선행 관찰(Rosset, 2019)에 기대어, 이를 실제로 큰 규모에서 실행에 옮긴다.',

ideas:[
 {h:'22개 출처를 하나의 분포로 합친다',
  lead:'PubMed·ArXiv·GitHub·FreeLaw 등 이질적 텍스트를 한 데이터셋으로 통합했다.',
  d:'Pile-CC(정제된 Common Crawl), PubMed Central, Books3, OpenWebText2, ArXiv, GitHub, FreeLaw, Stack Exchange, USPTO, PubMed Abstracts, Wikipedia, DM Mathematics 등 22개를 합쳤다. 이 중 14개는 이 논문에서 새로 구축한 데이터셋이다. 장르가 산문·코드·수식·대화·특허 명세서까지 걸쳐 있어, 기존 웹 크롤 데이터에는 거의 없던 형식을 강제로 채워 넣은 셈이다.'},
 {h:'원본 크기가 아니라 품질로 가중치를 준다',
  lead:'작지만 질 좋은 데이터는 여러 번, 큰 저품질 데이터는 한 번만 훑는다.',
  d:'[GPT-3](#/p/gpt3)의 관행을 따라, 원시 바이트 수에 비례해서 샘플링하지 않고 데이터셋마다 다른 epoch 수를 준다. 예컨대 Wikipedia는 원본이 6.38GiB로 작지만 3 epoch을 돌려 최종 분포에서 그만큼 자주 등장하게 만들고, 반대로 95GiB짜리 GitHub는 1 epoch만 돈다. 최종 학습 분포(1254GiB 상당)는 원본 총합(825GiB)보다 크다 — 일부 소스를 반복해서 "부풀렸기" 때문이다.'},
 {h:'GPT-2/GPT-3는 학술 텍스트에서 유독 약하다는 것을 실측한다',
  lead:'기존 모델의 컴포넌트별 perplexity를 재서 데이터 편향의 증거로 제시한다.',
  d:'The Pile의 22개 컴포넌트마다 GPT-2·GPT-3의 bits-per-byte(BPB)를 측정했다. ArXiv·PubMed·PhilPapers 같은 학술 도메인에서 유독 성능이 나쁘고, 반대로 USPTO나 NIH ExPorter처럼 형식화된 텍스트에서는 상대적으로 강했다. 이는 "모델이 못하는 것"이 능력의 한계가 아니라 **학습 데이터에 그 장르가 없었기 때문**이라는 진단이다.'},
 {h:'크기를 맞춘 비교로 다양성의 효과만 분리한다',
  lead:'같은 40GB로 맞춘 뒤 Raw CC·CC-100·Pile을 겨뤄 다양성 자체의 효과를 본다.',
  d:'단순히 The Pile로 학습한 모델이 이긴다고 말하면 데이터 크기 효과와 다양성 효과가 섞인다. 그래서 세 데이터셋을 전부 비슷한 크기로 서브샘플링한 뒤 GPT-2 규모 모델을 새로 학습시켜 비교했다. WikiText·LAMBADA 등에서 The Pile 학습 모델이 CC-100·Raw CC보다 앞서면서, 크기가 아니라 **구성의 다양성**이 만든 차이임을 보였다.'},
 {h:'MinHashLSH로 흐릿한 중복까지 잡아낸다',
  lead:'OpenWebText2·Common Crawl에 근사 Jaccard 유사도 기반 fuzzy dedup을 적용했다.',
  d:'완전히 같은 문서만 지우는 정확 중복 제거로는 부족하다고 보고, OpenWebText2와 Common Crawl 파트에 MinHashLSH(해시 함수 10개, 근사 Jaccard 유사도 0.5 기준)를 적용했다. 그 결과 OpenWebText2에서 28%, Common Crawl에서 26%가 중복으로 걸러졌다 — 웹 크롤 데이터의 실제 중복률이 얼마나 높은지를 수치로 드러낸 것이기도 하다.'}
],

diagram:{type:'split', cap:'22개 출처를 서로 다른 비율로 섞어 하나의 825GiB 학습 분포를 만든다. 상자 크기는 실제 비율이 아니라 대표 5개만 나열.',
 from:{t:'22개 원본 데이터셋', s:'총 825GiB, 크기 제각각'},
 branches:[
  {t:'Pile-CC', s:'227GiB · 1 epoch'},
  {t:'PubMed Central', s:'90GiB · 2 epoch'},
  {t:'Books3', s:'101GiB · 1.5 epoch', acc:true},
  {t:'ArXiv', s:'56GiB · 2 epoch'},
  {t:'Wikipedia(en)', s:'6GiB · 3 epoch'}
 ],
 join:'가중 샘플링 → 1254GiB 학습 분포'},

numbers:[
 {k:'전체 크기', v:'825.18 GiB', d:'표지는 "800GB"지만 본문 공식 수치는 825.18 GiB'},
 {k:'구성 소스 수', v:'22개', d:'그중 14개는 이 논문에서 새로 만든 데이터셋'},
 {k:'최대 비중 소스', v:'Pile-CC 18.11%', d:'227GiB, 1 epoch만 사용'},
 {k:'최고 epoch 소스', v:'Wikipedia(en) 3.0epoch', d:'원본 6.38GiB를 실질 19.13GiB로 upweight'},
 {k:'fuzzy dedup 중복률', v:'OWT2 28% · CC 26%', d:'MinHashLSH, Jaccard 임계값 0.5'},
 {k:'The Pile 학습 모델 WikiText PPL', v:'5.59', d:'같은 40GB급 CC-100(en) 8.27, Raw CC 11.75 대비 우세'}
],

impact:'데이터 구성 자체를 논문 한 편의 연구 대상으로 만들었다. "모델을 어떻게 설계할까"에서 "어떤 데이터를 얼마나 섞을까"로 질문을 옮긴 것이다. 이후 대형 모델 기술보고서마다 데이터 소스 표와 가중치 표를 넣는 관행이 자리잡았고, GPT-NeoX·Pythia 등 EleutherAI 자체 모델은 물론 여러 오픈소스 LLM이 The Pile 또는 그 하위 소스 조합을 그대로 학습 데이터로 채택했다. Books3 포함 여부는 이후 저작권 소송의 핵심 쟁점이 되기도 했다.',

legacy:[
 '**출처 다양성이라는 축을 표준화** — 이후 데이터셋 논문은 크기 하나가 아니라 "어떤 도메인을 얼마나"를 표로 제시하는 것이 관례가 됐다',
 '**가중 샘플링의 선례** — 크기가 아니라 품질로 epoch 수를 정하는 방식이 이후 데이터 큐레이션 연구(예: [RefinedWeb](#/p/refinedweb))의 출발점이 됨',
 '**중복 제거가 별도 연구 주제로 분리** — MinHashLSH로 잡은 26~28% 중복률이 [Deduplicating Training Data](#/p/dedup)류 후속 연구의 동기가 됨',
 '**Common Crawl 단독 의존에 대한 반례** — 이후 웹 크롤 기반 데이터셋들도 필터링·다양성 보존을 explicit하게 신경 쓰기 시작함'
],

pitfalls:[
 '**"800GB"라는 제목과 본문 수치(825.18 GiB)가 다르다.** GiB와 GB 단위 차이 및 반올림이 섞여 있어, 정확한 수치를 인용할 땐 표 1의 825.18 GiB를 쓰는 게 맞다.',
 '**epoch을 늘린 소스는 "더 큰 비중"이지 "더 많은 원본 데이터"가 아니다.** Wikipedia 3 epoch은 데이터를 늘린 게 아니라 같은 6.38GiB를 세 번 반복 노출시킨 것이라, 다양성 확보보다는 특정 도메인에 대한 가중치 조정에 가깝다.',
 '**Books3 등 일부 소스는 저작권 출처가 불분명하다.** 논문도 이를 인지하고 있었고(†로 표시), 이후 이 부분이 실제 법적 분쟁으로 이어졌다 — 데이터 구성 논문을 읽을 때 라이선스 문제를 함께 봐야 한다.'
],

figures:[
 {f:'table1-composition.png',
  cap:'22개 소스의 원본 크기(Raw Size)·최종 비중(Weight)·epoch 수·최종 반영량(Effective Size)을 보여주는 표. Pile-CC가 원본도 가장 크고 비중도 가장 높지만, Wikipedia(en)처럼 원본은 6.38GiB뿐이어도 3 epoch을 줘서 최종 19.13GiB로 부풀린 소스도 있다는 점을 Epochs 열에서 확인할 수 있다.',
  src:'원문 Table 1, p.3'},
 {f:'table3-eval.png',
  cap:'세 데이터셋을 비슷한 크기(약 40GB)로 맞춘 뒤 같은 GPT-2급 모델을 학습시켜 비교한 표. The Pile로 학습한 모델이 WikiText PPL 5.59로 CC-100(8.27)·Raw CC(11.75)를 앞선다 — 크기를 통제했으므로 이 차이는 데이터 구성의 다양성에서 온다.',
  src:'원문 Table 3, p.9'}
],

quotes:[
 {t:'We present the Pile: an 825 GiB English text corpus targeted at training large-scale language models.',
  src:'Abstract, p.1'},
 {t:'These results suggest that by mixing together a large number of smaller, high quality, diverse datasets, we can improve the general cross-domain knowledge and downstream generalization capabilities of the model.',
  src:'Abstract/Introduction, p.1'}
],

links:[
 {t:'arXiv 2101.00027 — The Pile: An 800GB Dataset of Diverse Text for Language Modeling', u:'https://arxiv.org/abs/2101.00027'},
 {t:'The Pile 공식 사이트', u:'https://pile.eleuther.ai/'},
 {t:'GitHub — EleutherAI/the-pile', u:'https://github.com/EleutherAI/the-pile'}
]
});
