WIKI.paper({
slug:'pali',
venue:'ICLR 2023',
authors:'Chen, Wang, Changpinyo et al. (Google Research)',
arxiv:'2209.06794',

tldr:'언어와 비전을 각각 사전학습된 대형 모델(mT5, ViT)에서 가져와 이어붙이되, **두 쪽을 함께 스케일업**해야 성능이 오른다는 것을 보인 논문. 100개 이상 언어의 웹 이미지-텍스트 데이터(WebLI)로 이를 검증했다.',

context:'2022년의 비전-언어 모델은 대개 언어 모델은 수십억~수천억 파라미터인데 비전 인코더는 10억 파라미터 안팎에 머물러 있었다. [CLIP](#/p/clip)이나 [Flamingo](#/p/flamingo)도 비전 인코더 쪽 용량이 언어 모델에 비해 작았다. 문제는 이 불균형이 당연한 설계가 아니라 **관성**이었다는 점이다 — 비전 트랜스포머의 스케일링 이득이 분류 과제(ImageNet)에서는 빨리 포화되는 것처럼 보였기 때문에, 아무도 비전 인코더를 언어 모델만큼 키우지 않았다. PaLI는 "비전 쪽을 정말 키우면 어떻게 되는가"를 직접 실험한다.',

ideas:[
 {h:'기존 단일 모달 백본을 그대로 재사용',
  lead:'ViT와 mT5를 각자 사전학습된 상태로 가져와 이어붙여 학습 비용을 아낀다.',
  d:'PaLI는 새 아키텍처를 만드는 대신 이미 학습된 [ViT](#/p/vit) 계열(ViT-G, 1.8B)과 다국어 [T5](#/p/t5) 계열(mT5-XXL, 13B)을 가져와 encoder-decoder 구조로 잇는다. 이미지는 ViT를 거쳐 토큰 시퀀스가 되고, 이 토큰이 텍스트 토큰과 함께 mT5 encoder에 들어간다. 처음부터 학습하지 않고 기존 단일 모달 능력을 물려받는 것이 핵심 절약 포인트다.'},
 {h:'모든 과제를 "이미지+질문 → 답" 하나의 인터페이스로',
  lead:'캡셔닝·VQA·OCR·검출을 전부 텍스트 생성 과제로 통일한다.',
  d:'캡셔닝, VQA, scene-text 이해, object detection까지 전부 "이미지와 질의 텍스트를 입력하면 답 텍스트를 생성한다"는 하나의 VQA류 인터페이스로 표현한다. 과제마다 다른 출력 헤드를 만들 필요가 없어지고, 서로 다른 과제 사이에 지식이 전이된다. 8가지 사전학습 과제(캡셔닝, split-captioning, OCR, VQA, VQG, object-aware VQA, object detection, 텍스트 전용 span corruption)를 섞어 학습한다.'},
 {h:'비전과 언어를 함께 키운다',
  lead:'언어만 13B로 키우기보다 비전도 함께 키울 때 이득이 더 크다.',
  d:'PaLI-15B(언어 13B + 비전 1.8B)와 PaLI-17B(언어 13B + 비전 4B ViT-e)를 비교하면, 비전 쪽을 2.2배 키운 것만으로 COCO 캡셔닝에서 CIDEr가 약 3점 더 오른다. 반면 ViT-e는 ImageNet 분류 정확도에서는 ViT-G 대비 거의 차이가 없다 — **분류 벤치마크만 보면 비전 스케일링이 포화된 것처럼 보이지만, 비전-언어 과제에서는 그렇지 않다**는 것이 이 논문의 핵심 반증이다.'},
 {h:'ViT-e: 4B 파라미터짜리 순정 ViT',
  lead:'구조 변경 없이 ViT-G 레시피를 그대로 4B까지 늘린 모델.',
  d:'ViT-e는 새로운 아키텍처가 아니라 1.8B ViT-G와 동일한 구조·학습 레시피를 4B 파라미터로 늘린 것이다. 학습 안정성을 위해 learning rate cool-down을 두 번(inception crop augmentation 사용·미사용) 수행하고 두 체크포인트의 가중치를 평균("souping")한다. 이 논문 시점 기준 가장 큰 순정 ViT였다.'},
 {h:'WebLI: 100개 이상 언어의 대규모 이미지-텍스트 데이터',
  lead:'109개 언어, 100억 장 이미지로 다국어 비전-언어 성능을 동시에 확보한다.',
  d:'WebLI는 웹에서 수집한 100억 장 이미지와 120억 개의 alt-text, 그리고 자동 OCR로 얻은 290억 쌍의 image-OCR 데이터로 구성된다. 품질 필터링으로 상위 10%(약 10억 쌍)만 남겨 학습에 쓴다. 언어를 영어에만 국한하지 않음으로써, PaLI는 언어 능력을 유지하면서도 다국어 캡셔닝·VQA에서 동시에 SOTA급 성능을 낸다.'}
],

diagram:{type:'flow', cap:'PaLI 구조. ViT가 이미지를 토큰화하고, mT5 encoder-decoder가 이미지 토큰+텍스트 질의를 받아 답 텍스트를 생성한다.',
 nodes:[
  {t:'이미지', s:'임의 해상도'},
  {t:'ViT-e', s:'4B · 이미지→토큰', acc:true},
  {t:'텍스트 질의', s:'"Answer in EN: …"'},
  {t:'mT5 Encoder', s:'13B'},
  {t:'mT5 Decoder', s:'→ 답 텍스트'}
 ]},

math:[
 {expr:'params(PaLI-17B) = mT5-XXL(13B) + ViT-e(4B), ViT-e / total ≈ 25%',
  tex:'\\text{ViT-e}/\\text{total} \\approx \\frac{4\\text{B}}{13\\text{B}+4\\text{B}} \\approx 25\\%',
  d:'PaLI-17B는 비전 컴포넌트가 전체 파라미터의 약 25%를 차지한다. 이전 대형 비전-언어 모델들은 언어와 비전 스케일 격차가 훨씬 컸는데, PaLI는 이 비율을 의도적으로 맞췄다.'}
],

numbers:[
 {k:'WebLI 규모', v:'100억 이미지 · 109개 언어', d:'그중 상위 10%(약 10억 쌍)만 필터링해 학습에 사용'},
 {k:'ViT-e', v:'4B 파라미터', d:'ViT-G(1.8B) 대비 ImageNet은 거의 동일, COCO CIDEr는 +3점'},
 {k:'PaLI-17B 언어 컴포넌트', v:'mT5-XXL 13B', d:'PaLI-3B는 mT5-Large 1B + ViT-G 1.8B'},
 {k:'COCO Captions CIDEr', v:'149.1', d:'Karpathy split, cross-entropy 학습 모델 중 최고'},
 {k:'VQAv2 정확도', v:'84.3%', d:'개방형 텍스트 생성 방식으로 당시 SOTA'},
 {k:'사전학습 혼합 데이터', v:'16억 예시 · 과제 8종', d:'캡셔닝·OCR·VQA·VQG·검출·텍스트전용 span corruption 혼합'}
],

impact:'PaLI는 "비전-언어 모델을 키운다"는 것이 언어 쪽만 키우는 게 아니라 **양쪽을 비례해서** 키우는 문제임을 실증했다. 이후 비전 인코더를 대형화하는 흐름([InternVL](#/p/internvl)의 6B ViT가 직접적인 후속)에 근거를 제공했다. 또한 모든 비전-언어 과제를 "이미지+텍스트 → 텍스트" 하나의 인터페이스로 통일하는 방식은 이후 [Qwen-VL](#/p/qwen-vl)류 VLM의 표준 인터페이스가 되었다. 기존 사전학습된 단일 모달 백본을 재사용해 학습 비용을 낮추는 전략도, 처음부터 전부 새로 학습하는 대안(예: [Chameleon](#/p/chameleon))과 대비되는 한 축을 이룬다.',

legacy:[
 '**비전 인코더 대형화** — [InternVL](#/p/internvl)이 6B ViT까지 스케일업하며 이 논문의 발견("비전-언어 과제에서는 비전 스케일링이 포화되지 않는다")을 더 밀어붙임',
 '**기존 백본 재사용 전략** — 처음부터 학습하는 [Chameleon](#/p/chameleon)의 early fusion과 대비되는, "사전학습된 단일 모달 모델을 이어붙이는" 접근의 대표 사례',
 '**통일 인터페이스** — "이미지+질의 → 텍스트"라는 프레이밍이 이후 [Qwen-VL](#/p/qwen-vl) 등 다목적 VLM의 기본 형태로 자리잡음',
 '**다국어 비전-언어 데이터셋** — WebLI는 이후 SigLIP 등 구글의 비전-언어 연구에서 반복적으로 재사용되는 데이터 자산이 됨'
],

pitfalls:[
 '**"비전 스케일링은 포화됐다"는 결론은 분류 과제에만 해당한다.** ViT-e가 ImageNet에서 ViT-G와 거의 같은 것만 보고 비전 확장이 무의미하다고 결론내리면 틀린다 — 비전-언어 과제에서는 명확한 이득이 있었다.',
 '**비전 컴포넌트는 학습 대부분 구간에서 얼려둔다(frozen).** 언어 컴포넌트만 업데이트하는 것이 기본이며, PaLI-17B만 마지막에 고해상도 단계에서 전체 파라미터를 업데이트한다. 논문 제목만 보고 "함께 스케일업"을 "함께 처음부터 학습"으로 오해하면 안 된다.',
 '**100개 언어를 지원한다고 언어별 성능이 균등하지 않다.** 크로스모달-3600 평가에서 언어별 CIDEr 편차가 크며, 이는 WebLI 자체의 언어별 데이터 불균형을 반영한다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'ViT가 이미지를 받아 시각 토큰을 만들고, 이 토큰이 텍스트 질의와 함께 Transformer Encoder에 들어가 Decoder가 답을 생성한다. 전체 파이프라인이 "이미지+텍스트 → 텍스트" 하나로 통일된다.',
  src:'원문 Figure 1, p.4'},
 {f:'fig2-scaling.png',
  cap:'막대 3개(파랑=3B, 빨강=15B, 노랑=17B)가 언어·비전을 함께 키울 때 7개 과제 전반에서 점수가 계속 오르는 것을 보여준다. 특히 17B(비전만 4B로 확장)가 15B(언어만 13B, 비전은 그대로) 대비 추가로 오르는 폭이, 비전 확장의 몫이 작지 않음을 말한다.',
  src:'원문 Figure 2, p.8'}
],

quotes:[
 {t:'We find that joint scaling of the vision and language components is important. Since existing Transformers for language are much larger than their vision counterparts, we train a large, 4-billion parameter ViT (ViT-e) to quantify the benefits from even larger-capacity vision models.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2209.06794 — PaLI', u:'https://arxiv.org/abs/2209.06794'},
 {t:'Google AI Blog: PaLI', u:'https://research.google/blog/pali-scaling-language-image-learning-in-100-languages/'}
]
});
