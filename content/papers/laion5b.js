WIKI.paper({
slug:'laion5b',
venue:'NeurIPS 2022 (Datasets and Benchmarks Track)',
authors:'Schuhmann, Beaumont, Vencu et al. (LAION · Stability AI · EleutherAI)',
arxiv:'2210.08402',

tldr:'Common Crawl 전체를 훑어 이미지와 alt-text를 쌍으로 뽑고 **[CLIP](#/p/clip) 코사인 유사도로 걸러** 만든 58.5억 쌍짜리 이미지-텍스트 데이터셋. CLIP·DALL-E급 모델을 학습할 수 있는 규모의 데이터를 처음으로 완전히 공개했다.',

context:'2021년 [CLIP](#/p/clip)과 DALL-E는 웹에서 긁은 수억~수십억 규모의 노이즈 섞인 이미지-텍스트 쌍만으로도 강력한 zero-shot 모델을 만들 수 있음을 보였다. 문제는 그 데이터가 전부 비공개였다는 것이다. OpenAI의 CLIP은 4억 쌍, Google의 ALIGN은 18억 쌍, BASIC은 66억 쌍을 썼다고만 밝혔을 뿐 데이터 자체는 공개하지 않았다. 이 때문에 외부 연구자는 이런 모델의 스케일링 거동을 재현하거나 검증할 방법이 없었다. LAION-5B는 이 데이터를 처음부터 다시 만들어 완전히 공개하는 것을 목표로 한다.',

ideas:[
 {h:'alt-text를 caption으로 재활용',
  lead:'Common Crawl WAT 파일에서 `<img>` 태그의 alt-text를 추출해 이미지-텍스트 쌍을 만든다.',
  d:'사람이 새로 캡션을 다는 대신, 스크린리더·검색엔진용으로 이미 웹페이지에 존재하는 `alt` 속성을 텍스트로 쓴다. 이렇게 하면 사람 손을 거치지 않고 Common Crawl 규모(월 약 30억 페이지) 그대로 캡션 있는 이미지를 뽑아낼 수 있다. 대신 alt-text 품질은 제각각이라 별도의 필터링이 필요해진다.'},
 {h:'CLIP 코사인 유사도로 관련 없는 쌍을 버린다',
  lead:'OpenAI CLIP ViT-B/32로 이미지·텍스트 임베딩을 만들고 코사인 유사도가 낮은 쌍을 제거한다.',
  d:'alt-text 중 상당수는 이미지 내용과 무관하다("사진1.jpg" 같은 파일명, SEO용 키워드 등). 원본 50억 장짜리 후보에서 이미지와 텍스트를 각각 CLIP으로 인코딩해 코사인 유사도를 계산하고, 영어는 0.28 미만, 비영어는 0.26 미만인 쌍을 버렸다. 이 한 단계로 후보의 약 90%가 걸러졌다.'},
 {h:'언어별로 세 개의 서브셋으로 쪼갠다',
  lead:'CLD3로 언어를 판별해 영어·다국어·미판별 세 서브셋으로 나눠 배포한다.',
  d:'alt-text에 언어 판별기 CLD3를 돌려 영어(laion2B-en), 100개 이상 언어가 섞인 다국어(laion2B-multi), 신뢰도 낮아 언어를 특정 못한 세트(laion1B-nolang)로 나눈다. 다국어 쌍은 영어 CLIP 대신 다국어 CLIP(mCLIP)으로 유사도를 계산했다. 이렇게 나누면 영어 전용 모델을 학습할 때 불필요한 언어를 쉽게 걷어낼 수 있다.'},
 {h:'제거하지 않고 태그만 붙인다',
  lead:'NSFW·워터마크 콘텐츠를 삭제하지 않고 CLIP 기반 분류기 점수를 메타데이터로 함께 배포한다.',
  d:'유해하거나 저작권 소지가 있는 콘텐츠를 사전에 판단해 지우는 대신, 자체 학습한 NSFW 분류기와 워터마크 분류기의 점수(0~1)를 각 쌍에 태그로 붙여 배포한다. 어떤 서브셋을 쓸지는 데이터를 가져다 쓰는 쪽이 직접 결정하게 하려는 설계다. 다만 저자들도 이 분류기가 완벽하지 않다고 명시한다.'},
 {h:'URL만 배포하고 이미지 자체는 배포하지 않는다',
  lead:'저작권 문제를 피하려 메타데이터(URL, 캡션, 점수)만 CC-BY-4.0으로 공개하고 이미지는 각자 다운로드하게 한다.',
  d:'LAION은 이미지 파일이 아니라 URL·캡션·해상도·유사도 점수가 담긴 Parquet 메타데이터만 배포한다. 실제 이미지는 사용자가 URL을 따라 직접 내려받아야 한다. 이 구조 덕분에 LAION 자신은 저작권이 있는 이미지 자체를 소유·유통하지 않는다고 주장할 수 있지만, 반대로 원본 웹페이지가 사라지면 그 쌍은 재현할 수 없게 된다.'}
],

diagram:{type:'flow', cap:'논문 Figure 2 그대로의 5단계 파이프라인. Common Crawl → 웹페이지 필터링(alt-text 추출) → 이미지 다운로드 → CLIP 기반 콘텐츠 필터링 → Parquet 메타데이터 저장.',
 nodes:[
  {t:'Common Crawl', s:'월간 스냅샷, ~3B 페이지'},
  {t:'웹페이지 필터링', s:'<img alt> 추출 + 언어판별'},
  {t:'이미지 다운로드', s:'비동기, worker 300개'},
  {t:'CLIP 필터링', s:'유사도 < 임계값 제거', acc:true},
  {t:'메타데이터 저장', s:'URL + 점수, Parquet'}
 ]},

math:[
 {expr:'sim(img, txt) = cos(CLIP_img(img), CLIP_txt(txt))',
  tex:'\\text{sim}(\\text{img},\\text{txt}) = \\cos\\!\\big(f_{\\text{img}}(\\text{img}),\\, f_{\\text{txt}}(\\text{txt})\\big)',
  d:'CLIP ViT-B/32로 인코딩한 이미지·텍스트 벡터의 코사인 유사도. 영어 쌍은 $\\text{sim} \\ge 0.28$, 비영어·미판별 쌍은 $\\text{sim} \\ge 0.26$ 인 것만 남긴다. 이 한 부등식이 원본 후보의 약 90%를 걸러냈다.'}
],

numbers:[
 {k:'전체 쌍 수', v:'5.85B', d:'원본 웹 이미지 후보 약 500억 장 중 CLIP 필터링 후 남은 수'},
 {k:'laion2B-en', v:'2.32B', d:'영어 alt-text, `cos ≥ 0.28`'},
 {k:'laion2B-multi', v:'2.26B', d:'100개+ 언어, 상위는 러시아어(10.6%)·프랑스어(7.4%)·독일어(6.6%)'},
 {k:'laion1B-nolang', v:'1.27B', d:'CLD3로 언어를 확정 못한 alt-text(제품명·SEO 키워드성 문구가 많음)'},
 {k:'CLIP 필터 임계값', v:'0.28 (en) / 0.26 (기타)', d:'코사인 유사도 미달 쌍은 통째로 제거, 원본의 약 90% 탈락'},
 {k:'NSFW 태그 비율', v:'약 3%', d:'삭제하지 않고 태그만 부여 — 사용자가 필터링 여부를 직접 선택'}
],

impact:'LAION-5B는 [CLIP](#/p/clip)·DALL-E급 모델을 학습할 수 있는 규모의 데이터를 처음으로 완전히 공개하면서, 대형 이미지-텍스트 모델 연구를 소수 기업 밖으로 끌어냈다. 저자들은 이 데이터로 OpenCLIP을 재현해 원본 CLIP과 견줄 만한 성능을 보였고, 데이터가 커질수록 zero-shot 정확도가 오르는 스케일링 거동을 직접 검증했다. 무엇보다 이 데이터셋은 곧바로 [Stable Diffusion(LDM)](#/p/ldm) 학습에 쓰이면서, 공개된 대규모 웹 데이터가 공개된 대형 생성모델을 가능하게 한다는 것을 실증했다.',

legacy:[
 '**[Stable Diffusion(LDM)](#/p/ldm)** — laion2B-en과 그 미학 점수 서브셋(laion-aesthetics)이 실제 학습 데이터로 쓰였다',
 '**OpenCLIP** — LAION-5B로 재학습한 오픈소스 CLIP 계열이 표준 백본으로 자리잡음',
 '**[DataComp](#/p/datacomp)** — "고정 파이프라인으로 데이터를 모으기"에서 "필터링 방법 자체를 벤치마크하기"로 문제를 한 단계 더 밀고 감',
 '**데이터셋 투명성 논쟁의 기준점** — alt-text 기반 CLIP 필터링 레시피가 이후 web-scale 데이터셋 구축의 사실상 표준 절차가 됨'
],

pitfalls:[
 '**이미지 자체를 배포하지 않는다.** LAION은 URL·캡션·점수만 담긴 메타데이터를 CC-BY-4.0으로 공개하고, 실제 이미지는 각 URL에서 직접 받아야 한다. 원본 웹페이지가 사라지면(링크 부패) 그 쌍은 다시 만들 수 없어 시간이 지날수록 재현 가능한 데이터 비율이 줄어든다.',
 '**저작권·프라이버시는 논문이 회피한 문제다.** 저자들도 "이미지나 텍스트의 저작권을 소유하지 않는다"고 명시하며 삭제 요청 창구만 제공했을 뿐, 웹크롤링된 이미지 대부분은 저작권자 동의 없이 수집된 것이다.',
 '**이후 감사에서 아동 성 착취물(CSAM) 링크가 발견됐다.** 논문 발표 이후인 2023년 스탠퍼드 인터넷관측소 등의 외부 감사에서 LAION-5B에 CSAM으로 의심되는 링크가 다수 포함된 것이 드러났고, LAION은 해당 버전을 내리고 재검증된 버전으로 교체했다 — 이는 논문 자체가 인정한 한계가 아니라 이후 스크루티니로 밝혀진 문제다.'
],

figures:[
 {f:'fig2-pipeline.png',
  cap:'다섯 단계 파이프라인: Common Crawl → alt-text 추출(웹페이지 필터링) → 이미지 비동기 다운로드 → CLIP 유사도 기반 콘텐츠 필터링(임계값 이상만 저장) → Parquet 메타데이터 저장. 화살표 사이 각 단계가 원문 3절의 서술 순서와 그대로 대응한다.',
  src:'원문 Figure 2, p.5'}
],

quotes:[
 {t:'we present LAION-5B - a dataset consisting of 5.85 billion CLIP-filtered image-text pairs, of which 2.32B contain English language.',
  src:'Abstract, p.1'},
 {t:'we refrain from removing potentially offensive samples and tag them instead. The user can decide whether to include content depending on their task.',
  src:'Section 3.2, p.5'}
],

links:[
 {t:'arXiv 2210.08402 — LAION-5B', u:'https://arxiv.org/abs/2210.08402'},
 {t:'LAION-5B 데이터셋 / knn5 탐색기', u:'https://laion.ai/blog/laion-5b/'},
 {t:'LAION-AI GitHub', u:'https://github.com/LAION-AI'}
]
});
