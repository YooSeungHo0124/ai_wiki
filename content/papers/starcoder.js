WIKI.paper({
slug:'starcoder',
venue:'TMLR 2023 (BigCode)',
authors:'Li et al. (BigCode · Hugging Face · ServiceNow)',
arxiv:'2305.06161',

tldr:'허가된 라이선스 코드만 골라 만든 **The Stack** 데이터셋으로 15.5B 파라미터 decoder-only 코드 모델을 학습하고, opt-out·PII 제거·귀속 추적까지 데이터 거버넌스 전체를 공개한 논문. 성능 못지않게 "이 모델이 어떤 데이터로 어떻게 만들어졌는지 전부 보여준다"는 것 자체가 기여다.',

context:'2023년 초 GitHub Copilot(codex 기반)은 이미 개발자 수백만 명이 쓰고 있었지만, 학습 데이터의 저작권 출처가 불투명했고 이를 둘러싼 소송까지 제기된 상태였다. [CodeT5](#/p/codet5) 계열은 encoder-decoder 구조로 코드 이해·생성 과제를 span-corruption으로 풀었지만 규모가 작았고, 코드 전용 대규모 decoder-only 모델은 대부분 비공개였다. 한편 [LLaMA](#/p/llama)는 공개 가중치 대규모 LLM이 가능함을 보였지만 코드 전용은 아니었고 학습 데이터 출처의 투명성도 목표가 아니었다. BigCode 커뮤니티의 질문은 단순했다 — **데이터 출처를 전부 공개하고, 저작권자가 빠질 수 있는 opt-out을 실제로 제공하면서도 SOTA급 코드 모델을 만들 수 있는가?**',

ideas:[
 {h:'The Stack: 허가된 라이선스만, opt-out 가능',
  lead:'permissive 라이선스로 감지된 GitHub 코드만 모으고, 저자가 직접 뺄 수 있게 했다.',
  d:'라이선스 탐지기로 permissive(허용적) 라이선스가 붙은 저장소만 골라 6.4TB, 384개 언어를 모았다. "Am I in The Stack" 도구로 개발자가 자기 코드 포함 여부를 확인하고 opt-out할 수 있게 했으며, 데이터 처리 시점까지 44명이 실제로 opt-out했다. 데이터 출처를 논문에서 공개한다는 점이 당시 Copilot·code-davinci류 비공개 모델과 가장 크게 갈리는 지점이다.'},
 {h:'FIM: 왼쪽에서 오른쪽뿐 아니라 "빈칸 채우기"도 학습',
  lead:'문서를 prefix·suffix·middle로 쪼개 순서를 바꿔 중간 삽입을 직접 학습시킨다.',
  d:'일반 언어모델은 이전 토큰만 보고 다음 토큰을 예측하므로 "함수 중간에 코드를 끼워 넣기"는 못 한다. FIM(fill-in-the-middle)은 문서를 임의로 prefix/middle/suffix 세 조각으로 나눈 뒤 `<fim_prefix>prefix<fim_suffix>suffix<fim_middle>middle` 순서로 재배열해 **똑같은 causal LM 손실로** 학습한다. 문자 단위로 FIM-rate 0.5를 적용했고, PSM 모드와 SPM 모드를 절반씩 섞었다. 코드 편집기의 자동완성처럼 커서 앞뒤 문맥이 모두 있는 실제 사용 상황과 맞아떨어진다.'},
 {h:'Multi-Query Attention + FlashAttention으로 8K 문맥',
  lead:'Key/Value를 head 간에 공유해 추론 메모리를 줄이고 8K 문맥을 확보했다.',
  d:'표준 multi-head attention은 head마다 별도의 K·V를 갖지만, MQA는 Query만 head별로 두고 K·V는 전체 head가 공유한다. 이러면 추론 시 KV 캐시 크기가 head 수만큼 줄어 대규모 배치 추론이 빨라진다. 여기에 FlashAttention을 결합해 메모리 병목 없이 **8,192 토큰** 문맥까지 학습을 확장했다. 코드 파일은 자연어 문서보다 길기 때문에(임포트·클래스 정의가 파일 앞쪽, 사용은 뒤쪽) 긴 문맥이 특히 중요하다.'},
 {h:'PII 탐지 모델을 직접 만들어 학습 데이터에서 제거',
  lead:'12,000개 파일에 사람이 직접 라벨링한 PII 데이터셋으로 탐지 모델을 학습해 이름·키·IP를 걸러냈다.',
  d:'주석·문자열에 실수로 남은 이메일, API 키, IP 주소 같은 개인정보를 걸러내려고 encoder 모델 StarEncoder를 별도로 학습시켜 PII 탐지에 썼다. 라이선스 헤더에 자발적으로 적힌 이름과, 실제로 가려야 할 비밀 정보를 구분하는 등 단순 정규식 필터보다 정교한 파이프라인을 구성했다.'},
 {h:'저장소 메타데이터와 커밋 히스토리까지 학습 신호로',
  lead:'저장소명·파일명·star 수·git 커밋 diff를 함께 넣어 실제 개발 맥락을 학습시켰다.',
  d:'각 코드 파일 앞에 `<reponame>`, `<filename>`, `<gh_stars>` 토큰을 (일부는 무작위로 생략하며) 붙이고, GitHub 이슈·Jupyter 노트북·git 커밋 전후 diff까지 별도 포맷으로 학습 데이터에 포함시켰다. 단순 코드 텍스트뿐 아니라 "이 저장소는 인기 있는가", "이 커밋은 무엇을 바꿨는가" 같은 실제 개발 워크플로의 신호를 모델이 흡수하게 한 것이다.'}
],

diagram:{type:'flow', cap:'The Stack에서 학습까지. PII 제거와 FIM 변환이 CodeT5류의 단순 텍스트 학습과 갈라지는 지점이다.',
 nodes:[
  {t:'The Stack', s:'6.4TB · 허가 라이선스'},
  {t:'중복 제거', s:'near-dedup'},
  {t:'PII 마스킹', s:'StarEncoder 탐지', note:'개인정보 제거'},
  {t:'FIM 변환', s:'FIM-rate 0.5', acc:true},
  {t:'15.5B decoder', s:'MQA · 8K 문맥'}
 ]},

math:[
 {expr:'L = -sum_t log P(x_t | x_<t)',
  tex:'\\mathcal{L}=-\\sum_{t}\\log P(x_t \\mid x_{<t})',
  d:'FIM도 결국 이 표준 causal LM 손실 그대로다. 문서를 `<fim_prefix>p<fim_suffix>s<fim_middle>m` 순서로 재배열한 뒤 이 재배열된 시퀀스에 대해 왼쪽에서 오른쪽으로 다음 토큰을 예측하게 만드는 것이 FIM의 전부다 — 새 손실 함수가 아니라 **데이터 재배열**이다.'},
 {expr:'Attention_MQA(Q,K,V): Q는 head별, K·V는 전체 head 공유',
  tex:'\\text{head}_i=\\text{softmax}\\!\\left(\\frac{Q_iK^{\\top}}{\\sqrt{d_k}}\\right)V,\\quad K,V\\ \\text{shared across}\\ i',
  d:'표준 [Transformer](#/p/transformer) multi-head attention은 head마다 $K_i, V_i$ 를 따로 갖지만, MQA는 $K, V$ 를 모든 head가 공유하고 $Q_i$ 만 head별로 둔다. 추론 시 KV 캐시 메모리가 head 수 $h$ 배만큼 줄어든다.'}
],

numbers:[
 {k:'파라미터 수', v:'15.5B', d:'StarCoderBase·StarCoder 공통, SantaCoder(1.1B) 대비 확장'},
 {k:'학습 토큰', v:'1조', d:'The Stack에서 추출한 80개 이상 프로그래밍 언어'},
 {k:'The Stack 크기', v:'6.4TB', d:'384개 언어 · permissive 라이선스만 · opt-out 44명 반영'},
 {k:'문맥 길이', v:'8,192 토큰', d:'FlashAttention + MQA로 확보, 이전 코드 모델 다수는 2K'},
 {k:'HumanEval pass@1', v:'33.6% (StarCoder)', d:'Python 35B 토큰 파인튜닝판, StarCoderBase는 30.4%'},
 {k:'code-cushman-001 비교', v:'33.5%', d:'OpenAI 12B 비공개 모델과 대등 — 논문이 강조하는 핵심 비교'}
],

impact:'StarCoder는 "성능"과 "데이터 거버넌스"를 같은 릴리스 안에 묶은 첫 대규모 코드 모델이었다. HumanEval에서 code-cushman-001과 맞먹는 성능을 내면서도, 어떤 저장소가 학습에 쓰였는지 확인하고 빠질 수 있는 opt-out 메커니즘, PII 제거 파이프라인, 생성물이 학습 데이터를 그대로 복사했는지 확인하는 귀속 추적 도구까지 함께 공개했다. OpenRAIL-M이라는 사용 제한이 걸린 라이선스로 배포해, "오픈 가중치"와 "완전 무제한 오픈소스"를 구분하는 절충안도 제시했다. 이후 [Code Llama](#/p/codellama)를 비롯한 여러 코드 모델이 FIM·긴 문맥·MQA 조합을 표준 레시피로 이어받았다.',

legacy:[
 '**[Code Llama](#/p/codellama)** — [LLaMA 2](#/p/llama2) 가중치에서 출발해 FIM과 긴 문맥 학습을 이어받아 코드 특화 파인튜닝을 반복',
 '**StarCoder2** — The Stack v2로 데이터를 확장하고 커뮤니티 협업 구조를 그대로 유지',
 '**데이터 거버넌스 표준화** — opt-out·PII 제거·귀속 추적 파이프라인이 이후 공개 코드 모델 릴리스의 관행이 됨',
 '**MQA/FIM 조합의 정착** — 이후 코드 모델 다수가 긴 문맥 + 빈칸 채우기 + 공유 KV 캐시를 기본값으로 채택'
],

pitfalls:[
 '**"허가된 라이선스"가 저작권 문제를 완전히 없애지 않는다.** 논문 스스로 밝히듯 permissive 라이선스 코드도 다른 저장소로 복제되며 원 라이선스가 사라질 수 있고, opt-out은 저장소 단위로만 작동해 개인이 낸 PR 코드까지는 걸러내지 못한다.',
 '**FIM은 새로운 아키텍처가 아니라 데이터 포맷 트릭이다.** [CodeT5](#/p/codet5)의 span-corruption과 목적은 비슷해 보이지만, encoder-decoder 구조 없이 순수 decoder-only causal LM 손실만으로 구현했다는 점이 다르다 — 이 차이를 혼동하면 안 된다.',
 '**pass@1 수치는 temperature·샘플 수에 민감하다.** 표에 실린 HumanEval 33.6%는 특정 디코딩 설정에서의 값이며, 다른 논문의 수치와 단순 비교하면 조건이 달라 오차가 생길 수 있다.'
],

figures:[
 {f:'fig2-scaling.png',
  cap:'왼쪽: 학습 토큰(중복 제거 후 데이터 크기)이 늘수록 pass@1이 로그-선형으로 증가한다 — 데이터를 더 모을수록 성능이 예측 가능하게 오른다는 뜻. 오른쪽: 같은 체크포인트를 언어별로 쪼갠 것으로, python·javascript·java 같은 인기 언어가 먼저 올라가고 bash·d·r 같은 희소 언어는 1T 토큰까지도 낮은 수준에 머문다.',
  src:'원문 Figure 2, p.25'}
],

quotes:[
 {t:'StarCoderBase: 15.5B parameter models with 8K context length, infilling capabilities and fast large-batch inference enabled by multi-query attention.',
  src:'Abstract, p.1'},
 {t:'At the time of the data processing, 44 people opted out of The Stack.',
  src:'Section 3.1, p.4'}
],

links:[
 {t:'arXiv 2305.06161 — StarCoder: may the source be with you!', u:'https://arxiv.org/abs/2305.06161'},
 {t:'The Stack (Kocetkov et al., 2022)', u:'https://arxiv.org/abs/2211.15533'},
 {t:'BigCode Project', u:'https://www.bigcode-project.org/'}
]
});
