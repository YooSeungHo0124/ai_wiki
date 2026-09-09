WIKI.paper({
slug:'refinedweb',
venue:'ICML 2023 (arXiv-only 발표)',
authors:'Penedo et al. (TII, Abu Dhabi — Falcon 팀)',
arxiv:'2306.01116',

tldr:'큐레이션된 고품질 코퍼스를 섞지 않고, CommonCrawl 웹 데이터만 엄격히 필터링·중복제거해도 [The Pile](#/p/the-pile) 기반 모델을 능가할 수 있음을 보인 논문. Falcon LLM의 학습 데이터가 된 RefinedWeb을 공개했다.',

context:'2020년대 초 LLM 데이터 구성의 정설은 "웹 데이터만으로는 부족하다"였다. [GPT-3](#/p/gpt3)나 [The Pile](#/p/the-pile)은 위키피디아·책·논문·코드 같은 큐레이션 소스를 웹 스크랩에 섞어 넣었고, 이 다양성이 품질의 핵심으로 여겨졌다. 문제는 [Chinchilla](#/p/chinchilla) 스케일링 법칙이다. 모델을 계속 키우려면 파라미터 수에 비례해 토큰도 수조 개 단위로 필요한데, 책·논문 같은 고품질 소스는 절대량이 유한해 곧 고갈된다. 반면 CommonCrawl은 매달 새로 쌓이며 사실상 무한에 가깝다. 이 논문은 정설 자체를 뒤집는다 — 필터링을 충분히 엄격하게 하면 **웹 데이터만으로도** 큐레이션 혼합 데이터를 이긴다는 것이다.',

ideas:[
 {h:'MDR: 5단계 파이프라인으로 CommonCrawl을 정제한다',
  lead:'URL 필터링 → 텍스트 추출 → 언어 식별 → 필터링 휴리스틱 → 중복제거를 대규모로 돌린다.',
  d:'MacroData Refinement(MDR)는 원시 WARC 파일(HTML 응답 그대로)에서 시작한다. WET 파일(전처리된 텍스트)은 메뉴·광고 같은 잡음이 많아 버리고, `trafilatura` 라이브러리로 본문만 직접 추출한다. 이후 fastText 기반 언어 식별, 문서/줄 단위 필터링, 그리고 exact·fuzzy 중복제거가 순차적으로 이어진다.'},
 {h:'설계 원칙: scale first, strict dedup, neutral filtering',
  lead:'ML 기반 품질 분류기를 쓰지 않고 규칙과 휴리스틱만으로 대규모·중립적으로 거른다.',
  d:'세 원칙을 명시한다. (1) 사람이 개입하는 큐레이션 대신 CommonCrawl 하나에 집중해 3~6조 토큰 규모를 노린다. (2) 중복제거는 다른 연구보다 훨씬 공격적인 설정을 쓴다. (3) 언어 식별을 제외하면 ML 분류기를 쓰지 않는다 — 학습된 품질 분류기가 특정 집단의 글쓰기를 체계적으로 걸러내는 편향을 만들 수 있다는 우려 때문이다.'},
 {h:'줄 단위 교정: 문서가 아니라 줄을 고친다',
  lead:'본문 추출 후 남는 소셜 카운터·내비게이션 문구를 줄 단위로 잘라낸다.',
  d:'trafilatura로 뽑아도 "3 likes", 내비게이션 버튼 같은 군더더기 줄이 섞여 나온다. 대문자만인 줄, 숫자만인 줄, 단어 하나짜리 줄 등을 줄 단위 규칙으로 제거하거나 편집한다. 이 교정이 문서 단어의 5%를 넘게 잘라내면 문서 자체를 통째로 버린다.'},
 {h:'중복제거를 문서 레벨과 줄 레벨 모두에서, 그리고 exact + fuzzy로',
  lead:'MinHash 유사 문서 제거와 접미사 배열 기반 정확 부분문자열 제거를 이중으로 적용한다.',
  d:'fuzzy 중복제거는 문서당 9,000개 해시(5-gram 기준, 20버킷×450해시)의 MinHash로 유사 문서를 찾아 제거한다. exact 중복제거는 접미사 배열로 50토큰 이상 이어지는 정확히 같은 부분문자열을 찾아 잘라낸다. 저자들은 이 설정이 [The Pile](#/p/the-pile)이나 기존 연구보다 훨씬 높은 제거율로 이어진다고 밝힌다.'},
 {h:'고의로 고품질 소스를 웹 데이터에서 배제한다',
  lead:'위키피디아·arXiv 같은 흔한 큐레이션 소스를 URL 단계에서 미리 걸러낸다.',
  d:'RefinedWeb이 큐레이션 코퍼스와 나중에 합쳐 쓰일 것을 염두에 두고, 애초에 위키피디아·arXiv 등 이미 잘 알려진 고품질 소스를 URL 필터링 단계에서 제외한다. 이는 "웹 데이터만으로 얼마나 갈 수 있는가"라는 실험의 순수성을 지키기 위한 선택이다.'}
],

diagram:{type:'flow', cap:'MDR 파이프라인. Figure 2 실측: CommonCrawl 100% → 문서 준비 후 96.3% → 필터링 후 23% → 중복제거 후 최종 RefinedWeb ~10%대.',
 nodes:[
  {t:'URL 필터링', s:'블록리스트 4.6M'},
  {t:'텍스트 추출', s:'trafilatura'},
  {t:'언어 식별', s:'fastText, θ=0.65'},
  {t:'필터링 휴리스틱', s:'문서+줄 단위', acc:true},
  {t:'중복제거', s:'MinHash + exact', acc:true}
 ]},

numbers:[
 {k:'최종 RefinedWeb 규모', v:'5조 토큰', d:'CommonCrawl 하나에서만 추출, 공개용 추출본은 이 중 6,000억 토큰'},
 {k:'필터링 후 생존 문서', v:'23%', d:'CommonCrawl 원본 문서 중 문서/줄 필터링을 통과한 비율 (Figure 2)'},
 {k:'언어 식별 통과율', v:'50.66%', d:'영어가 아니라고 판정돼 버려지는 문서가 절반가량 (Figure 2)'},
 {k:'최종 kept rate', v:'~10%대', d:'중복제거까지 마친 뒤 CommonCrawl 원본 대비 남는 문서 비율, 논문은 "거의 90% 제거"로 요약'},
 {k:'1B@27GT 제로샷 정확도', v:'RefinedWeb 56.2% vs Pile 53.4%', d:'동일 아키텍처·하이퍼파라미터에서 RefinedWeb이 Pile·C4·OSCAR를 모두 앞섬 (Table 4)'},
 {k:'MinHash 설정', v:'9,000 hash / 문서', d:'5-gram 기준 20버킷×450해시, Pile의 10해시보다 훨씬 공격적'}
],

impact:'RefinedWeb과 이를 학습한 Falcon 모델은 "웹 데이터는 근본적으로 열등하다"는 업계의 암묵적 전제를 실측으로 반박했다. 이는 이후 데이터 파이프라인 연구의 무게중심을 "어떤 소스를 섞을까"에서 "얼마나 정교하게 필터링·중복제거할까"로 옮기는 계기가 됐다. 동시에 데이터 준비 과정 자체(줄 단위 교정, 대규모 fuzzy+exact dedup)가 하나의 독립된 연구 대상으로 부상했다. Falcon-40B/7B는 오픈 라이선스로 공개되며 웹 전용 데이터로 학습된 모델도 경쟁력이 있다는 것을 실증했다.',

legacy:[
 '공개된 6,000억 토큰 추출본(`tiiuae/falcon-refinedweb`)이 이후 여러 오픈소스 LLM 프로젝트의 사전학습 데이터 구성 요소로 재사용됐다',
 'MDR의 줄 단위 교정·대규모 이중 중복제거 레시피는 이후 웹 스케일 코퍼스 구축 파이프라인들이 참조하는 표준 관행이 됐다',
 '"필터링만 잘하면 큐레이션 없이도 된다"는 주장은 이후 데이터 필터링을 학습 목표에 맞춰 최적화하는 흐름(모델 기반 품질 분류기 재도입 등)과 계속 긴장 관계에 있다',
 '[Chinchilla](#/p/chinchilla) 스케일링 법칙이 요구하는 "수조 토큰"이라는 물리적 제약이 이 논문의 존재 이유였고, 데이터가 곧 병목이 된다는 문제의식은 이후 데이터 제약 스케일링 연구로 이어진다'
],

pitfalls:[
 '**공개본은 전체가 아니다.** 논문이 보고하는 5조 토큰 중 실제로 공개된 것은 6,000억 토큰뿐이라, 논문의 최종 규모를 그대로 재현할 수는 없다.',
 '**"웹만으로 충분하다"는 보편 법칙이 아니라 이 파이프라인·이 스케일에서의 실험 결과다.** MDR의 구체적인 URL 블록리스트·줄 단위 규칙·MinHash 설정에 결과가 강하게 의존하며, 느슨한 필터링이나 다른 스케일에서 같은 결론이 재현된다는 보장은 없다.',
 '**ML 기반 품질 분류기를 의도적으로 배제**한 것은 편향 완화를 위한 설계 선택이지, 품질 분류기가 성능에 도움이 안 된다는 주장이 아니다. 이후 연구들은 오히려 학습된 품질 필터를 재도입하는 방향으로 갈라졌다.'
],

figures:[
 {f:'fig2-pipeline-funnel.png',
  cap:'왼쪽부터 오른쪽으로 문서 준비(URL 필터링→텍스트 추출→언어 식별) → 필터링(반복 제거→문서/줄 필터링) → 중복제거(fuzzy→exact) 단계를 지날 때마다 막대가 줄어든다. 회색 곁가지 숫자가 그 단계에서 버려진 비율, 막대 안 숫자가 이전 단계 대비 남은 비율. 언어 식별 단계에서 절반이, 필터링에서 다시 절반 가까이 사라지는 것이 보인다.',
  src:'원문 Figure 2, p.4'},
 {f:'table4-results.png',
  cap:'같은 아키텍처·학습 설정에서 데이터셋만 바꿔 학습한 1B/3B 모델의 제로샷 평균 정확도. OSCAR·C4 같은 순수 웹 데이터셋과 RW-Raw(정제 전)·RW-Filtered(필터링만)·RefinedWeb(필터링+dedup 완료)을 나란히 놓고, The Pile(큐레이션)과 비교한다. RefinedWeb이 모든 열 중 가장 높다.',
  src:'원문 Table 4, p.7'}
],

quotes:[
 {t:'At variance with previous beliefs, we show that properly filtered and deduplicated web data alone can lead to powerful models; even significantly outperforming models from the state-of-the-art trained on The Pile.',
  src:'Abstract, p.1'},
 {t:'We stick to simple rules and heuristics, and use only URL filtering for adult content.',
  src:'Section 3, Design principles, p.3'}
],

links:[
 {t:'arXiv 2306.01116 — The RefinedWeb Dataset for Falcon LLM', u:'https://arxiv.org/abs/2306.01116'},
 {t:'HuggingFace Dataset — tiiuae/falcon-refinedweb', u:'https://huggingface.co/datasets/tiiuae/falcon-refinedweb'}
]
});
