WIKI.paper({
slug:'coco-captions',
venue:'arXiv 2015 (evaluation server 논문, TPAMI 계열)',
authors:'Chen, Fang, Lin, Vedantam, Gupta, Dollár, Zitnick (CMU · Washington · Cornell · Virginia Tech · Berkeley · FAIR · MSR)',
arxiv:'1504.00325',

tldr:'이미지 한 장에 사람이 쓴 캡션을 **5개씩** 달아 33만 장 규모로 모으고, 채점을 통일하기 위한 **자동 평가 서버**까지 함께 낸 논문. 논문 자체의 방법론적 기여는 작지만, 이후 5년간 이미지 캡셔닝·비전-언어 연구의 벤치마크 인프라를 통째로 정의했다.',

context:'2014년까지 이미지 캡셔닝은 Flickr8k·Flickr30k 같은 소규모 데이터셋에서 학습·평가됐고, 데이터셋마다 다른 기준으로 채점하니 논문 간 비교가 불가능했다. 게다가 BLEU·METEOR·ROUGE·CIDEr 같은 지표의 **구현체가 논문마다 미묘하게 달라서** 같은 이름의 지표도 값이 어긋나는 일이 흔했다. [ImageNet](#/p/imagenet)이 분류 문제에서 한 것처럼 — 하나의 데이터·하나의 채점 서버로 순위를 강제 통일하는 것 — 캡셔닝에도 같은 인프라가 필요했다. MS COCO 데이터셋(2014, 33만 장 이미지·80개 객체 카테고리) 위에 캡션을 얹는 것이 이 논문의 출발점이다.',

ideas:[
 {h:'이미지당 5개 독립 캡션',
  lead:'같은 이미지를 서로 다른 사람 5명이 독립적으로 묘사하게 해 표현의 다양성을 확보한다.',
  d:'한 사람이 쓰는 캡션은 특정 어휘·구문에 편향되므로, Amazon Mechanical Turk에서 **서로 다른 작업자 5명**에게 같은 이미지를 독립적으로 묘사하게 했다. 학습·검증·테스트 전체에 대해 이 c5(5개 캡션) 세트를 만들고, 테스트의 일부 5,000장에는 지표와 사람 판단의 상관을 높이려고 40개 캡션을 더한 c40 세트를 별도로 만들었다.'},
 {h:'테스트 정답은 공개하지 않는다',
  lead:'테스트셋 참조 캡션을 비공개로 두고 서버 채점만 허용해 지표 과최적화를 막는다.',
  d:'검증셋의 참조 캡션은 공개하지만 **테스트셋 참조 캡션은 끝까지 비공개**로 남겨, 참가자가 후보 캡션 JSON만 서버에 제출하면 서버가 채점한다. [ImageNet](#/p/imagenet) Challenge와 같은 구조로, 지표를 보면서 손으로 맞추는 과최적화(overfitting to the metric)를 원천 차단한다.'},
 {h:'문장 작성 가이드라인으로 데이터 품질을 통제한다',
  lead:'"There is로 시작 금지" 같은 8가지 규칙으로 캡션의 형식을 표준화한다.',
  d:'중요한 부분만 묘사, 최소 8단어 이상, 미래/과거 추측 금지, 사람 이름 금지 등 8가지 지침을 작업자에게 강제했다. 자유 서술형 크라우드소싱 데이터의 잡음을 줄이는 실무적 선택이며, 이후 나온 캡션 데이터셋들도 비슷한 지침을 재사용한다.'},
 {h:'네 가지 지표를 한 서버에서 동시에 채점',
  lead:'BLEU·ROUGE-L·METEOR·CIDEr-D를 같은 전처리·같은 구현으로 나란히 계산한다.',
  d:'후보·참조 캡션 모두 Stanford PTBTokenizer로 토큰화하고 구두점을 제거한 뒤, 동일한 코드로 BLEU-1~4, ROUGE-L, METEOR, CIDEr-D를 계산한다. "구현이 논문마다 다르다"는 문제를 지표를 하나 더 만드는 대신 **서버를 하나 만드는 것**으로 해결했다.'},
 {h:'사람 자신도 지표로 재보면 완벽하지 않다',
  lead:'사람이 쓴 캡션끼리 서로 채점해 지표별 상한선(사람 성능)을 실측한다.',
  d:'테스트 이미지마다 추가로 캡션 1개를 더 모아 "사람이 쓴 캡션"을 후보로 놓고 나머지 참조들과 채점했다. c5에서 CIDEr-D 0.854, BLEU-4는 0.217에 불과해 — **사람이 사람을 묘사해도 지표가 만점을 주지 않는다**는 것을 수치로 보였고, 이는 지표 자체의 한계를 드러내는 근거로 쓰인다.'}
],

diagram:{type:'flow', cap:'데이터 수집부터 채점까지 파이프라인. 참조 캡션이 공개되는지 여부가 핵심 분기.',
 nodes:[
  {t:'COCO 이미지', s:'33만 장 · 80 카테고리'},
  {t:'AMT 작업자 5명', s:'독립 캡션 5개', acc:true},
  {t:'검증셋 캡션', s:'공개'},
  {t:'테스트셋 캡션', s:'비공개 · 서버만 채점'},
  {t:'평가 서버', s:'BLEU·METEOR·CIDEr', acc:true}
 ]},

math:[
 {expr:'BLEU_N = b(C,S) · exp( Σ w_n log CP_n(C,S) )',
  tex:'\\text{BLEU}_N = b(C,S)\\cdot\\exp\\!\\left(\\sum_{n=1}^{N} w_n \\log CP_n(C,S)\\right)',
  d:'클리핑된 n-gram 정밀도 $CP_n$ 의 가중 기하평균에 짧은 문장을 벌점 주는 $b(C,S)$(brevity penalty)를 곱한다. 원래 기계번역용 지표라 코퍼스 단위로 집계되며, 문장 하나짜리 캡션 비교에는 상대적으로 약하다.'},
 {expr:'CIDEr_n(c_i, S_i) = (1/m) Σ_j [ g^n(c_i)·g^n(s_ij) / (‖g^n(c_i)‖ ‖g^n(s_ij)‖) ]',
  tex:'\\text{CIDEr}_n(c_i,S_i)=\\frac{1}{m}\\sum_{j} \\frac{g^n(c_i)\\cdot g^n(s_{ij})}{\\lVert g^n(c_i)\\rVert\\,\\lVert g^n(s_{ij})\\rVert}',
  d:'각 n-gram을 TF-IDF로 가중한 벡터 $g^n$ 의 코사인 유사도. IDF 항이 "이미지 대부분에서 반복되는 흔한 단어"의 가중치를 깎아, **이 이미지에서만 두드러지는 표현**에 점수를 더 준다. 이 논문에서 이 값을 표준 서버 지표(CIDEr-D)로 채택했다.'}
],

numbers:[
 {k:'이미지 수', v:'33만+ 장', d:'완성 시 목표 규모, COCO 원본 이미지 재사용'},
 {k:'캡션 수', v:'102만 6,459개', d:'training 41.4만 · val 20.3만 · test 37.9만(c5+c40 포함)'},
 {k:'이미지당 참조 캡션', v:'c5=5개 · c40=40개', d:'c40은 테스트 5,000장에만 추가 수집'},
 {k:'객체 카테고리', v:'80개', d:'Flickr에서 카테고리·장면 조합으로 이미지 수집'},
 {k:'사람 캡션의 BLEU-4', v:'0.217 (c5)', d:'사람이 사람을 묘사해도 지표는 22%에 그침 — 지표 자체의 한계'},
 {k:'사람 캡션의 CIDEr-D', v:'0.854 (c5) · 0.910 (c40)', d:'참조가 많을수록(c40) 사람 일치도 점수도 올라간다'}
],

impact:'캡션 생성 논문들이 처음으로 **같은 숫자**로 비교되기 시작했다. 서버 제출 방식은 [ImageNet](#/p/imagenet) Challenge의 리더보드 문화를 캡셔닝·이후 VQA·비전-언어 태스크 전반으로 옮겨왔다. 동시에 이 논문이 실측으로 보인 "사람도 BLEU 만점을 못 받는다"는 결과는, 캡셔닝 품질을 n-gram 지표만으로 재는 것의 한계를 공식화했고 — 이는 훗날 [CLIP](#/p/clip) 기반 임베딩 유사도(CLIPScore류)나 사람 평가로 넘어가는 계기가 된다. COCO Captions는 [BLIP](#/p/blip)·[Flamingo](#/p/flamingo) 같은 이후 비전-언어 모델들의 표준 fine-tuning·평가 벤치마크로 거의 10년간 쓰였다.',

legacy:[
 '**표준 벤치마크 지위** — 2015~2021년 사이 이미지 캡셔닝 논문 대부분이 COCO Captions의 Karpathy split을 학습·평가에 그대로 사용',
 '**평가 서버 모델의 확산** — CodaLab 기반 비공개 테스트셋 채점 방식이 VQA·이미지 검색 등 다른 비전-언어 벤치마크로 표준화',
 '**지표 한계 인식이 CLIP류 평가로 이어짐** — n-gram 겹침 대신 임베딩 유사도로 캡션을 채점하는 흐름의 출발점이 됐고, [CLIP](#/p/clip) 등장 이후 이 방식이 사실상 대체',
 '**대규모 비전-언어 사전학습의 재료** — [BLIP](#/p/blip)·[Flamingo](#/p/flamingo) 등은 COCO Captions를 fine-tuning·평가에 그대로 사용하되, 사전학습 자체는 훨씬 큰 웹 규모 이미지-텍스트 쌍으로 옮겨감'
],

pitfalls:[
 '**BLEU·ROUGE·METEOR는 표면적 n-gram 겹침**만 본다. "고양이가 소파 위에서 잔다"와 "소파 위 고양이가 자고 있다"처럼 뜻은 같아도 어순·단어가 다르면 낮은 점수가 나올 수 있다.',
 '**CIDEr-D도 데이터셋 통계(IDF)에 의존**한다. COCO 학습 코퍼스 밖의 도메인(예: 의료 영상 캡션)에 그대로 적용하면 TF-IDF 가중치가 그 도메인의 실제 중요도를 반영하지 못한다.',
 '**사람 성능 자체가 지표 상한이 아니다.** 이 논문이 보인 것처럼 지표 값 자체가 사람 캡션에도 낮게 나오므로, 모델 점수를 "사람과 비교해 몇 %"로 해석할 때 지표의 이런 구조적 한계를 감안해야 한다.'
],

figures:[
 {f:'fig1-examples.png',
  cap:'같은 이미지라도 사람마다 다른 부분(배경 여부, 인물 수, 사물 이름)을 언급한다는 것을 보여준다 — 이것이 이미지당 캡션 5개를 모은 이유다.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-ui.png',
  cap:'오른쪽 지침 목록이 작업자에게 강제된 8가지 규칙. "There is로 시작 금지", "최소 8단어" 같은 형식 제약이 데이터의 잡음을 줄인다.',
  src:'원문 Figure 2, p.2'}
],

quotes:[
 {t:'When completed, the dataset will contain over one and a half million captions describing over 330,000 images.',
  src:'Abstract, p.1'},
 {t:'To ensure consistency in evaluation of automatic caption generation algorithms, an evaluation server is used.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1504.00325 — Microsoft COCO Captions', u:'https://arxiv.org/abs/1504.00325'},
 {t:'COCO Captions 공식 웹사이트', u:'https://cocodataset.org/#captions-2015'}
]
});
