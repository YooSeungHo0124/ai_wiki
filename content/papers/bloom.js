WIKI.paper({
slug:'bloom',
venue:'arXiv 2022 (BigScience Workshop)',
authors:'BigScience Workshop (Le Scao, Fan, Akiki et al. · Hugging Face + 국제 협업)',
arxiv:'2211.05100',

tldr:'176B 다국어 언어모델을 **60여 개국 1,200여 명이 참여한 공개 협업**으로 만든 논문. 성능 자체보다 "누가, 어떤 절차로, 어떤 라이선스로 대형 모델을 만드는가"라는 거버넌스 질문을 앞세운 것이 [OPT](#/p/opt)와의 결정적 차이다.',

context:'[OPT](#/p/opt)가 175B급 가중치 공개의 물꼬를 텄지만, 여전히 소수 조직 내부의 결정이었고 학습 데이터는 사실상 영어 중심이었다. BLOOM을 만든 BigScience는 다른 질문을 던진다 — 대형 모델의 설계·데이터·라이선스 결정을 소수 엔지니어가 아니라 **언어학자·법학자·사회학자를 포함한 넓은 커뮤니티**가 함께 내릴 수 있는가. 프랑스 정부의 슈퍼컴퓨터 자원(GENCI의 Jean Zay 배정)을 계기로 Hugging Face와 프랑스 NLP 커뮤니티가 시작해, 38개국 1,200여 명이 등록하는 규모로 확장됐다.',

ideas:[
 {h:'거버넌스 자체를 연구 대상으로 삼는다',
  lead:'윤리 헌장을 먼저 만들고, 워킹그룹 조직으로 데이터·평가·법률 결정을 분산했다.',
  d:'BigScience는 모델을 만들기 전에 **윤리 헌장(Ethical Charter)**을 제정하고, 데이터·아키텍처·평가·법률 등 주제별 워킹그룹으로 조직을 나눴다. 참여자는 머신러닝뿐 아니라 언어학·통계학·사회문화인류학·철학·법학 등 다양한 배경을 가졌다. "모델을 누가 만드는가"라는 질문에 조직 구조 자체로 답한 셈이다.'},
 {h:'ROOTS 코퍼스: 46개 자연어 + 13개 프로그래밍 언어',
  lead:'저자원 언어를 의도적으로 포함해 46개 자연어·13개 프로그래밍 언어 코퍼스를 직접 큐레이션했다.',
  d:'크라우드소싱된 데이터셋(456개 웹사이트 직접 선정)과 Common Crawl 기반 OSCAR를 결합해 만들었다. 영어·프랑스어 등 고자원 언어에 쏠리지 않도록 각 언어마다 원어민이 품질 지표 임계값을 직접 정했고, 개인식별정보 제거·중복 제거를 거쳤다. Indo-European과 Sino-Tibetan 어족이 여전히 절대량을 차지하지만, 니제르콩고어족처럼 0.4GB 수준의 소수 언어도 명시적으로 포함했다.'},
 {h:'ALiBi + Embedding LayerNorm으로 안정성을 확보',
  lead:'위치 인코딩은 ALiBi, 임베딩 직후 LayerNorm을 추가해 bfloat16 학습 안정성을 높였다.',
  d:'사전 실험(Le Scao et al., 2022)에서 학습된 위치 인코딩과 [RoPE](#/p/rope)보다 [ALiBi](#/p/alibi)가 더 안정적이고 다운스트림 성능도 좋다는 것을 확인해 채택했다. 여기에 bitsandbytes의 StableEmbedding에서 착안한 **임베딩 직후 LayerNorm**을 더해 float16보다 안정적인 bfloat16 혼합정밀도로 176B 모델을 학습했다. 그 결과 3.5개월 학습 동안 loss spike는 단 한 번뿐이었다고 보고한다 — OPT의 35회 이상 수동 재시작과 대비된다.'},
 {h:'RAIL 라이선스: 공개와 책임 사용의 절충',
  lead:'모델 가중치에 13개 행동 제약 조항을 건 Responsible AI License(RAIL)로 공개했다.',
  d:'소스코드는 Apache 2.0으로 완전 개방하되, 모델 가중치는 **RAIL 라이선스**로 별도 공개했다. RAIL은 "소스코드"와 "모델"의 라이선스를 분리하고, 프롬프팅·파인튜닝·distillation·로짓 사용까지 포함하도록 "사용"과 "파생물"을 상세히 정의한 뒤, 유해 사용 사례를 막는 13개 행동 제약 조항을 건다. 무료로 쓸 수 있지만 무제한은 아니라는 절충이다.'},
 {h:'다국어 토크나이저와 xP3 멀티태스크 파인튜닝',
  lead:'250,680개 어휘의 바이트 수준 BPE 토크나이저로 저자원 언어의 과분절을 줄였다.',
  d:'단일 언어 토크나이저 대비 각 언어의 fertility(단어당 서브워드 수)가 10%p 이상 나빠지지 않도록 언어별 표본 비율을 조정해 어휘 25만 개를 학습했다. 이후 ROOTS와 같은 언어 분포를 갖는 xP3 데이터셋으로 멀티태스크 프롬프트 파인튜닝을 적용해, 사전학습만으로는 약한 zero-shot 일반화를 끌어올렸다.'}
],

diagram:{type:'compare', cap:'같은 "175B급 공개"라는 목표를, 조직 구조 자체가 다른 방식으로 풀었다.',
 left:{t:'OPT: 단일 조직 공개', items:['Meta AI 내부 팀 결정','영어 중심 코퍼스','신청제 접근(175B)']},
 right:{t:'BLOOM: 다자간 협업', items:['38개국 1,200여 명 참여','46개 자연어+13개 코드','RAIL 행동 제약 라이선스']}},

math:[
 {expr:'ALiBi: 어텐션 점수에서 거리에 비례해 페널티를 뺌',
  tex:'\\text{score}(q_i,k_j) = q_i \\cdot k_j - m \\cdot |i-j|,\\quad m = 2^{-8i/n}',
  d:'위치 임베딩을 입력에 더하는 대신, 쿼리·키 사이 거리 $|i-j|$ 에 비례한 페널티를 어텐션 점수에서 직접 빼는 방식이다. 헤드마다 다른 기울기 $m$ 을 기하급수적으로 배정해($n$은 헤드 수), 어떤 헤드는 가까운 토큰에, 어떤 헤드는 먼 토큰에 민감하게 만든다.'}
],

numbers:[
 {k:'파라미터', v:'176,247M (176B)', d:'70층 · 은닉차원 14336 · 헤드 112'},
 {k:'학습 데이터', v:'ROOTS 341B 토큰 → 총 366B 학습', d:'46개 자연어 + 13개 프로그래밍 언어'},
 {k:'참여 규모', v:'1,200여 명 · 38개국', d:'등록 참여자 기준, 수백 명이 실제 산출물에 기여'},
 {k:'학습 인프라', v:'Jean Zay · A100 384장 (48노드)', d:'프랑스 국립 슈퍼컴퓨터, 3.5개월 학습'},
 {k:'어휘 크기', v:'250,680', d:'바이트 수준 BPE, 언어별 fertility 격차 최소화'},
 {k:'탄소 배출', v:'CO2eq 약 81톤', d:'학습 에너지 25톤 + 유휴 소비 45톤 + 장비 제조 11톤'}
],

impact:'BLOOM은 "성능이 곧 정당성"이라는 암묵적 전제에 조직·데이터·라이선스라는 세 축의 대안을 제시했다. 다국어·저자원 언어를 처음부터 설계에 포함시킨 코퍼스 구축 방식은 이후 다국어 LLM 프로젝트의 참고 사례가 됐고, RAIL은 완전 개방(Apache/MIT)과 완전 비공개 사이의 제3의 라이선스 범주를 실제로 정착시켰다. 무엇보다, "1,000명 넘는 사람이 합의로 모델을 만들 수 있는가"라는 실험 자체가 이후 오픈소스 AI 거버넌스 논의의 준거점이 됐다.',

legacy:[
 '**다국어 코퍼스 설계의 전례** — ROOTS의 언어별 원어민 품질 검증 방식이 이후 다국어 LLM 데이터 파이프라인의 참고 사례가 됨',
 '**RAIL 계열 라이선스의 확산** — 행동 제약을 포함한 책임 라이선스가 이후 여러 오픈 모델(StableLM 등)의 공개 방식으로 이어짐',
 '**ALiBi 채택 사례** — 176B 규모에서 [ALiBi](#/p/alibi)의 안정성을 실증하면서 이후 여러 오픈 모델의 위치 인코딩 선택에 참고 사례가 됨',
 '**공개 계보의 거버넌스 축** — [OPT](#/p/opt)가 연 접근 공개를 [LLaMA](#/p/llama)·[OLMo](#/p/olmo)가 성능·투명성 축으로 이었다면, BLOOM은 "누가 참여해 결정하는가"라는 축을 남김'
],

pitfalls:[
 '**"완전 오픈소스"는 아니다.** 코드는 Apache 2.0이지만 모델 가중치는 RAIL의 13개 행동 제약을 받는다. 상업적 유해 활용을 막는 조건이 상용 라이선스와는 다르다.',
 '**영어 벤치마크 성능만으로 평가하면 저평가된다.** 데이터의 상당 부분이 저자원 언어에 배분됐기 때문에, 동급 파라미터의 영어 전용 모델과 단순 비교하면 BLOOM이 불리해 보일 수 있다.',
 '**탄소 배출 비교는 전력망 차이를 반영한다.** BLOOM의 CO2eq가 [OPT](#/p/opt)보다 낮게 나온 데는 프랑스 전력망의 낮은 탄소 집약도(원자력 비중)가 크게 작용했다 — 학습 효율만의 차이가 아니다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'왼쪽: 토큰 임베딩 직후에 LayerNorm(LN)을 하나 더 끼워 넣은 것이 표준 decoder 블록과의 차이다. 오른쪽: ALiBi mask 행렬 — 대각선에서 멀어질수록 $k_{head}$ 배수로 점점 더 큰 음수 페널티가 곱해져 어텐션 점수에 더해진다. 헤드마다 이 기울기가 다르게 배정된다.',
  src:'원문 Figure 5, p.16'},
 {f:'fig2-roots-languages.png',
  cap:'왼쪽 트리맵: 사각형 면적이 바이트 수에 비례한다. Indo-European(로망스·게르만어)과 Sino-Tibetan(중국어)이 압도적으로 크고, 저자원 언어는 가장자리의 얇은 띠로만 보인다 — "포함은 했지만 양은 불균등하다"는 것을 그대로 드러낸다. 오른쪽 와플플롯: 정사각형 하나가 약 200MB, 13개 프로그래밍 언어의 상대적 비중이다.',
  src:'원문 Figure 3, p.13'}
],

quotes:[
 {t:'While these capabilities have led to widespread adoption, most LLMs are developed by resource-rich organizations and are frequently kept from the public. As a step towards democratizing this powerful technology, we present BLOOM.',
  src:'Abstract, p.1'},
 {t:'A distinguishing aspect of the RAIL license developed for BLOOM is that it separates licensing of the "source code" and "model," as referenced by its trained parameters.',
  src:'Section 2.2, p.15'}
],

links:[
 {t:'arXiv 2211.05100 — BLOOM: A 176B-Parameter Open-Access Multilingual Language Model', u:'https://arxiv.org/abs/2211.05100'},
 {t:'BLOOM 모델 카드 + RAIL 라이선스 (Hugging Face)', u:'https://huggingface.co/bigscience/bloom'}
]
});
