WIKI.paper({
slug:'align',
venue:'ICML 2021',
authors:'Jia, Yang, Xia et al. (Google Research)',
arxiv:'2102.05918',

tldr:'[CLIP](#/p/clip)과 같은 이중 인코더 대조학습을, **정제를 거의 포기한 노이즈 웹 alt-text 18억 쌍**으로 돌린 논문. 데이터 큐레이션에 드는 비용을 규모로 바꿔치기해도 ImageNet zero-shot 76.4%가 나온다는 것을 보이며, "정제보다 규모가 이긴다"를 실증했다.',

context:'CLIP과 같은 해에 나왔지만 강조점이 다르다. 당시 비전-언어 데이터셋의 표준은 Conceptual Captions(CC3M/CC12M) 계열로, 웹에서 긁은 alt-text에 **무거운 필터링·정규화 파이프라인**을 태워 300만~1200만 쌍으로 줄인 것이었다. 이 파이프라인은 이미지 분류기·NER·품사 태거까지 동원해 캡션을 다듬으므로, 데이터를 늘리려 해도 정제 비용이 선형으로 따라 붙어 규모의 상한이 생긴다. CLIP도 4억 쌍을 만들면서 쿼리 기반 균형화라는 나름의 설계를 거쳤다. ALIGN의 질문은 그 반대다 — **필터를 거의 다 끄고 데이터를 두 자릿수 배로 늘리면 어떻게 되는가?**',

ideas:[
 {h:'정제 파이프라인을 걷어내고 규모를 산다',
  lead:'무거운 정제 대신 값싼 빈도 필터만 남기고 데이터를 두 자릿수 배 늘린다.',
  d:'Conceptual Captions의 무거운 정제 단계를 대부분 제거하고, 빈도 기반의 값싼 규칙만 남겼다 — 지나치게 짧거나 긴 alt-text, 1000장 이상의 이미지에 공유되는 상투적 문구, 포르노·저해상도 이미지, 다운스트림 평가셋과 중복되는 이미지를 쳐내는 정도다. 결과는 **18억 쌍**. 남은 캡션의 상당수는 파일명·상품 코드·SEO 키워드 같은 노이즈지만, 노이즈는 무작위에 가까워 평균화되고 신호는 규모에 비례해 쌓인다는 것이 이 논문의 베팅이다.'},
 {h:'구조는 CLIP과 거의 같다 — 바뀐 것은 데이터뿐',
  lead:'새 손실도 새 블록도 없이 이중 인코더 대조학습 구조를 그대로 쓴다.',
  d:'이미지 인코더 EfficientNet-L2(global pooling), 텍스트 인코더 BERT-Large의 `[CLS]` 임베딩. 각각 선형 투영으로 **1376차원 공동 공간**에 올리고 L2 정규화한 뒤, 배치 내 대각선을 정답으로 하는 양방향 softmax 대조 손실을 건다. 새 손실도, 새 블록도 없다. 논문의 주장이 아키텍처가 아니라 데이터에 있다는 것을 구조 자체가 말한다.'},
 {h:'노이즈를 규모로 상쇄하는 조건: 배치가 커야 한다',
  lead:'배치가 작으면 노이즈 쌍의 비중이 커지므로 전역 배치 16,384로 학습한다.',
  d:'대조 손실에서 배치 안의 나머지 항목이 전부 negative이므로, 배치가 작으면 노이즈 쌍 하나가 손실에서 차지하는 비중이 커진다. ALIGN은 TPUv3 코어 1024개에 코어당 16쌍을 얹어 **전역 배치 16,384**로 학습한다. 즉 "노이즈 데이터로도 된다"는 결론에는 대규모 분산 학습이라는 전제가 딸려 있다.'},
 {h:'같은 모델이 분류기이자 검색 엔진이다',
  lead:'하나의 공동 임베딩 공간이 분류·검색·벡터 산술을 동시에 지원한다.',
  d:'학습 결과물은 이미지와 텍스트가 한 좌표계에 놓인 임베딩 공간이므로, 클래스 이름을 넣으면 zero-shot 분류기가 되고 문장을 넣으면 이미지 검색기가 된다. 논문은 여기서 한 걸음 더 나가 **임베딩 산술**을 보인다(Figure 5) — 장미 이미지 임베딩에 "blue" 텍스트 임베딩을 더해 검색하면 파란 장미가 나온다. 두 모달리티가 같은 공간에서 벡터로 합성 가능하다는 뜻이다.'},
 {h:'zero-shot만이 아니라 백본 자체가 강해진다',
  lead:'노이즈 웹 텍스트 감독만으로도 지도학습급 비전 백본이 나온다.',
  d:'CLIP 논문이 zero-shot 전이를 전면에 세운 반면, ALIGN은 학습된 이미지 인코더를 **일반 비전 백본**으로 평가한다. ImageNet fine-tune 88.64%, VTAB 19개 과제 전이에서 당시 최상위권에 올라, 노이즈 웹 텍스트 감독이 대규모 라벨 지도학습(JFT급)과 겨룰 수 있는 사전학습 신호임을 보였다.'}
],

figures:[
 {f:'fig2-noisy-pairs.png',
  cap:'ALIGN 학습셋에서 무작위로 뽑은 이미지-텍스트 쌍 6개. "moustache seamless wallpaper design"처럼 그럴듯한 캡션 사이에 "thumbnail for version as of 21 57 29 june 2010"처럼 파일명·메타데이터가 그대로 캡션으로 쓰인 노이즈 쌍(이탤릭 표시)이 섞여 있다 — 정제를 거의 하지 않았다는 논문의 주장을 눈으로 보여준다.',
  src:'원문 Figure 2, p.3'},
 {f:'fig5-embedding-arithmetic.png',
  cap:'왼쪽 원본 이미지 임베딩에 오른쪽 텍스트 임베딩을 더해(코사인 유사도로) 이미지를 재검색한 결과. 장미 이미지 + "blue" 텍스트를 더하면 파란 장미가, + "purple"을 더하면 보라 장미가 검색된다 — 이미지·텍스트 임베딩이 같은 공간에서 벡터로 합성된다는 증거.',
  src:'원문 Figure 5, p.8'}
],

diagram:{type:'compare', cap:'같은 이중 인코더 대조학습에서 데이터 축만 갈아끼운 실험. 정제 비용이 사라진 자리를 규모가 메운다.',
 left:{t:'기존: 정제된 캡션 데이터셋', items:[
  'CC 계열 3M~12M 쌍',
  '분류기·NER·태거를 태운 무거운 정제',
  '정제 비용이 규모의 상한을 만듦',
  '깨끗하지만 개념 커버리지가 좁음']},
 right:{t:'ALIGN: 날것 alt-text', items:[
  '18억 쌍 — 빈도 기반 값싼 필터만',
  '캡션 상당수가 파일명·SEO 노이즈',
  'ImageNet zero-shot 76.4%',
  'fine-tune 88.64%']}},

quotes:[
 {t:'We show that the scale of our corpus can make up for its noise and leads to state-of-the-art representations even with such a simple learning scheme.',
  src:'Abstract, p.1'}
],

math:[
 {expr:'L_i2t = -1/N Σ_i log[ exp(x_iᵀ y_i / σ) / Σ_j exp(x_iᵀ y_j / σ) ]',
  tex:'\\mathcal{L}_{i2t} = -\\frac{1}{N}\\sum_i \\log\\frac{\\exp(x_i^{\\top} y_i / \\sigma)}{\\sum_j \\exp(x_i^{\\top} y_j / \\sigma)}',
  d:'이미지→텍스트 방향의 in-batch softmax 대조 손실. $x_i$ 는 정규화된 이미지 임베딩, $y_j$ 는 텍스트 임베딩, $\\sigma$ 는 학습되는 온도다. 텍스트→이미지 방향 $L_{t2i}$ 를 대칭으로 만들어 **두 손실의 합**을 최소화한다.'},
 {expr:'query = normalize( emb_image(rose) + emb_text("blue") )',
  tex:'\\text{query}=\\text{normalize}\\big(\\text{emb}_{\\text{image}}(\\text{rose}) + \\text{emb}_{\\text{text}}(\\text{blue})\\big)',
  d:'두 모달리티가 하나의 정규화된 공간을 공유하므로 벡터 덧셈이 의미 합성처럼 작동한다. 이 질의로 최근접 이미지를 뽑으면 파란 장미가 검색된다(Figure 5) — 공동 임베딩 공간이 단순한 매칭 테이블이 아니라는 증거다.'}
],

numbers:[
 {k:'학습 데이터', v:'18억 쌍', d:'값싼 빈도 기반 필터만 적용한 웹 alt-text. Conceptual Captions 대비 100배 이상'},
 {k:'ImageNet zero-shot', v:'76.4% top-1', d:'[CLIP](#/p/clip)의 76.2%와 사실상 동률 — 다른 데이터 전략으로 같은 지점에 도달'},
 {k:'ImageNet fine-tune', v:'88.64% top-1', d:'top-5 98.67%. 백본으로서의 품질도 최상위권'},
 {k:'모델 구성', v:'EfficientNet-L2 + BERT-Large', d:'공동 임베딩 1376차원'},
 {k:'배치 크기', v:'16,384', d:'TPUv3 1024코어 × 코어당 16쌍. 노이즈 상쇄에 큰 배치가 전제'},
 {k:'Flickr30K zero-shot', v:'I→T R@1 88.6% / T→I R@1 75.7%', d:'fine-tune 시 95.3% / 84.9%로 당시 SOTA'},
 {k:'MSCOCO zero-shot', v:'I→T R@1 58.6% / T→I R@1 45.6%', d:'fine-tune 시 77.0% / 59.9%'}
],

impact:'CLIP과 같은 결론에 **다른 경로로** 도달했다는 점이 이 논문의 무게다. 두 팀이 독립적으로 "이중 인코더 + 대규모 이미지-텍스트 대조"에 수렴하면서, 이 레시피가 특정 데이터 큐레이션의 운이 아니라 재현 가능한 방법이라는 것이 확정됐다. 그리고 "데이터를 깨끗하게 만드는 대신 크게 만든다"는 선택지를 명시적으로 정당화하면서, 이후 LAION-5B·WebLI·DataComp 같은 **수십억 규모 웹 코퍼스 구축 경쟁**의 근거가 되었다. 동시에 그 반작용도 낳았다 — 규모만이 답인지 검증하려는 데이터 필터링 연구(DataComp 등)가 정확히 이 주장을 대조군으로 삼는다.',

legacy:[
 '**수십억 규모 코퍼스 시대** — LAION·WebLI·DataComp 등 웹 스케일 이미지-텍스트 데이터 구축이 표준 작업이 됨',
 '**Google 계열 VLM의 백본** — 여기서 만들어진 대규모 웹 이미지-텍스트 학습 관행이 [SigLIP](#/p/siglip)과 이후 PaLI 계열 모델의 출발점이 됨',
 '**캡션 품질을 되묻는 흐름** — [BLIP](#/p/blip)이 노이즈 캡션을 모델로 재생성·필터링(CapFilt)하며 "규모 vs 품질"을 다시 절충한다',
 '**이중 인코더 = 검색 인프라** — 텍스트↔이미지 최근접 검색이 그대로 제품이 되면서 벡터 검색이 멀티모달 시스템의 기본 부품이 됨'
],

pitfalls:[
 '**"정제가 필요 없다"가 아니라 "이 규모에서는 값싼 정제로 충분하다"이다.** 데이터가 100만 쌍대라면 노이즈는 평균화되지 않고 그대로 학습된다. 논문의 결론은 18억 쌍과 16k 배치라는 전제 위에 서 있으므로, 소규모 도메인 데이터에 그대로 옮기면 정반대 결과가 난다.',
 '**재현이 사실상 불가능하다.** ALIGN의 18억 쌍은 공개되지 않았고 학습에는 TPUv3 1024코어급 자원이 든다. 공개된 것은 논문의 주장뿐이라, 후속 연구는 LAION 같은 대체 데이터로 간접 검증할 수밖에 없었다.',
 '**필터를 끈 만큼 편향과 유해 콘텐츠도 그대로 들어온다.** 값싼 규칙은 명시적인 성인물·저품질 이미지 정도만 거를 뿐, 웹의 문화적 편향·상업적 스팸 텍스트·저작권 문제는 걸러지지 않는다. 이 백본을 다운스트림에 얹으면 그 특성이 함께 상속된다.'
],

links:[
 {t:'arXiv 2102.05918 — Scaling Up Visual and Vision-Language Representation Learning With Noisy Text Supervision', u:'https://arxiv.org/abs/2102.05918'},
 {t:'Google Research Blog — ALIGN: Scaling Up Visual and Vision-Language Representation Learning', u:'https://research.google/blog/align-scaling-up-visual-and-vision-language-representation-learning-with-noisy-text-supervision/'},
 {t:'Hugging Face Transformers — ALIGN 모델 문서', u:'https://huggingface.co/docs/transformers/model_doc/align'}
]
});
