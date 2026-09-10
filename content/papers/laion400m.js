WIKI.paper({
slug:'laion400m',
venue:'NeurIPS 2021 Workshop (Data Centric AI)',
authors:'Schuhmann et al. (LAION)',
arxiv:'2111.02114',

tldr:'CLIP로 이미지-텍스트 쌍의 관련성을 직접 채점해 걸러낸 **4억 쌍**의 웹 데이터셋을 통째로 공개한 논문. [CLIP](#/p/clip)이나 [DALL·E](#/p/dalle) 급 모델을 훈련하려면 필요했던 "수억 장짜리 사유 데이터"를 누구나 받을 수 있게 만든 첫 사례다.',

context:'2021년 [CLIP](#/p/clip)과 DALL·E는 웹에서 긁은 수억 장의 이미지-텍스트 쌍으로 학습됐지만, 그 데이터는 OpenAI 내부에만 있었다. 공개된 이미지-텍스트 데이터셋은 Conceptual Captions(약 300만~1200만 쌍)처럼 규모가 두 자릿수는 작았고, 그마저도 이미지 자체가 아니라 URL만 배포하는 정도였다. 결과적으로 대규모 언어-비전 모델 연구는 대형 연구소 몇 곳의 전유물이었다. 이 논문의 저자들(LAION, 비영리 커뮤니티)은 "긁어온 alt-text가 이미지 내용과 실제로 맞는지"를 어떻게 대량으로 걸러낼 것인가라는 문제에 집중한다.',

ideas:[
 {h:'CLIP 코사인 유사도로 쌍을 필터링',
  lead:'이미지와 alt-text의 CLIP 임베딩 코사인 유사도가 0.3 미만이면 버린다.',
  d:'Common Crawl의 WAT 파일에서 `<img>` 태그의 alt-text를 캡션 후보로 뽑는다. 이 alt-text는 사람이 검수한 라벨이 아니라 대부분 SEO용으로 대충 붙인 텍스트라 이미지와 무관한 경우가 많다. 저자들은 [CLIP](#/p/clip)으로 이미지·텍스트 임베딩을 각각 구한 뒤 코사인 유사도가 0.3 미만인 쌍을 통째로 버린다. 사람이 직접 라벨을 달지 않고도 "그럴듯한 쌍"만 남기는 자동 필터다.'},
 {h:'경량 규칙으로 먼저 솎아낸다',
  lead:'alt-text 5자 미만·이미지 5KB 미만은 CLIP을 돌리기 전에 먼저 제거한다.',
  d:'alt-text 길이 5자 미만, 이미지 용량 5KB 미만인 샘플은 애초에 캡션이 없거나 이미지가 아이콘·배너일 가능성이 높아 CLIP 계산 전에 값싼 규칙으로 먼저 뺀다. URL과 alt-text에 대한 bloom filter로 중복도 제거한다. CLIP 임베딩 계산이 가장 비싼 단계이므로, 그 앞에 저렴한 필터를 두는 순서 자체가 페타바이트 규모 처리의 핵심이다.'},
 {h:'img2dataset: 다운로드 자체를 라이브러리로 만든다',
  lead:'수억 장의 URL을 노드 하나로 하루 만에 내려받는 비동기 다운로더를 함께 배포한다.',
  d:'URL 목록만 있어도 실제로 이미지를 받아 학습 가능한 형태(webdataset)로 저장하는 일 자체가 큰 공학 문제다. 저자들은 1Gbps·32GB RAM·16코어 단일 노드로 1억 장을 20시간에 받는 `img2dataset` 라이브러리를 함께 공개해, 누구나 데이터셋 전체 또는 일부를 재현할 수 있게 했다.'},
 {h:'이미지 자체가 아니라 URL과 임베딩을 배포',
  lead:'저작권 문제를 피해 이미지 URL·CLIP 임베딩·kNN 인덱스만 배포하고 이미지는 각자 내려받게 한다.',
  d:'4억 장의 이미지를 직접 재배포하면 저작권 문제가 크다. 대신 URL·메타데이터·CLIP 임베딩·유사도 검색용 kNN 인덱스를 parquet로 배포하고, 실제 이미지는 각 연구자가 `img2dataset`으로 내려받는다. 이 방식이 이후 [LAION-5B](#/p/laion5b)까지 그대로 이어지는 배포 관행이 됐다.'}
],

diagram:{type:'flow', cap:'Common Crawl의 원시 HTML에서 최종 400M 쌍까지 이어지는 정제 파이프라인.',
 nodes:[
  {t:'Common Crawl', s:'페타바이트급 원시 웹'},
  {t:'alt-text 파싱', s:'img 태그 추출'},
  {t:'경량 필터', s:'길이·용량·중복'},
  {t:'CLIP 유사도 필터', s:'cos < 0.3 제거', acc:true},
  {t:'img2dataset', s:'다운로드+저장'}
 ]},

math:[
 {expr:'cos(E_image(x), E_text(t)) ≥ 0.3',
  tex:'\\cos\\!\\big(E_{\\text{image}}(x),\\,E_{\\text{text}}(t)\\big)\\ge 0.3',
  d:'CLIP의 이미지 인코더 $E_{image}$와 텍스트 인코더 $E_{text}$가 만드는 두 벡터의 코사인 유사도. 이 값이 0.3 미만인 이미지-텍스트 쌍은 관련이 없다고 보고 버린다. 임계값 0.3은 사람이 직접 표본을 눈으로 검수해 정한 값이다.'}
],

numbers:[
 {k:'최종 쌍 수', v:'약 4.13억', d:'CLIP 필터를 통과한 고유 이미지-텍스트 쌍(Table 1의 413M)'},
 {k:'NSFW 비율', v:'< 1%', d:'CLIP으로 자동 태깅. 태그만 붙이고 데이터셋에는 남겨 사용자가 직접 거르게 함'},
 {k:'고해상도 비중', v:'9.6M', d:'가로·세로 모두 1024px 이상인 이미지 수(전체의 약 2%)'},
 {k:'다운로드 처리량', v:'1억 장 / 20시간', d:'단일 노드(1Gbps, 32GB RAM, 16코어 i7)에서 `img2dataset` 기준'},
 {k:'유사도 필터 임계값', v:'cos ≥ 0.3', d:'CLIP ViT 기반 임베딩, 사람 검수로 결정'}
],

impact:'이 논문의 핵심 기여는 새 모델이 아니라 **재현 가능한 대규모 데이터**다. LAION-400M 이후 DALL·E·Stable Diffusion류 text-to-image 모델을 대학 연구실 수준에서도 처음부터 학습해 볼 수 있게 됐고, "CLIP 점수로 웹 데이터를 거른다"는 방법 자체가 표준 레시피가 됐다. 저자들은 실제로 이 데이터의 720만 장 부분집합으로 DALL·E 재현체를 학습시켜 데이터의 유효성을 검증했다.',

legacy:[
 '**[LAION-5B](#/p/laion5b)** — 같은 팀이 규모를 40억+로 키운 후속 데이터셋. 필터링 방법론은 그대로 계승',
 '**Stable Diffusion([LDM](#/p/ldm))** — LAION 계열 데이터로 학습된 대표적 공개 text-to-image 모델',
 '**[DataComp](#/p/datacomp)** — "데이터를 어떻게 고를 것인가" 자체를 벤치마크로 만든 후속 연구, LAION의 필터링 방식을 비교 대상으로 삼음',
 '**CLIP 점수 필터링의 일반화** — 이미지-텍스트뿐 아니라 다른 모달리티 데이터셋 정제에도 "임베딩 유사도로 거른다"는 패턴이 퍼짐'
],

pitfalls:[
 '**"공개 데이터셋" ≠ "저작권이 정리된 데이터셋".** URL만 배포하고 저작권 검수를 하지 않았기 때문에, 이후 저작권·아동안전 관련 논란(특히 후속작 LAION-5B에서)의 시발점이 됐다.',
 '**CLIP 유사도 0.3은 "관련 있음"이지 "정확한 캡션"이 아니다.** alt-text는 여전히 사람이 검수한 캡션보다 노이즈가 훨씬 크고, 이는 학습된 모델의 텍스트 이해 편향으로 이어질 수 있다.',
 '**URL 기반 배포는 시간이 지나면 깨진다.** 원본 웹페이지가 사라지면 해당 쌍은 재현 불가능해지므로, 시점에 따라 실제로 받을 수 있는 데이터 양이 논문의 수치보다 적을 수 있다.'
],

figures:[
 {f:'fig1-acquisition.png',
  cap:'왼쪽 위 워커들이 Common Crawl을 분산 처리해 URL·caption 후보를 만들고, GPU 추론 노드에서 CLIP 유사도를 계산해 Bloom Filter로 중복·저품질을 거른 뒤 최종 STORAGE에 쌓는다. 오른쪽 IMG2DATASET이 이 저장소에서 실제 이미지를 내려받는 별도 단계임을 보여준다.',
  src:'원문 Figure 2, p.3'},
 {f:'fig2-samples.png',
  cap:'웹 데모에서 "blue cat", "cat with blue eyes" 같은 짧은 텍스트 질의로 검색한 결과. CLIP 임베딩 기반 유사도 검색만으로도 색상·개체·표정 같은 세부 속성까지 맞춰 찾아온다는 것을 보여준다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'Despite this trend, to date there has been no publicly available datasets of sufficient scale for training such models from scratch.',
  src:'Abstract, p.1'},
 {t:'By releasing an openly available dataset that contains 400 million image-text pairs, we have closed the gap to proprietary large scale datasets that were necessary to train state-of-the-art language-vision models such as DALL-E and CLIP.',
  src:'Conclusion, p.4'}
],

links:[
 {t:'arXiv 2111.02114 — LAION-400M', u:'https://arxiv.org/abs/2111.02114'},
 {t:'LAION-400M 프로젝트 페이지', u:'https://laion.ai/blog/laion-400-open-dataset/'},
 {t:'img2dataset (GitHub)', u:'https://github.com/rom1504/img2dataset'}
]
});
