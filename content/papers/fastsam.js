WIKI.paper({
slug:'fastsam',
venue:'arXiv 2023 (CVPR Workshop)',
authors:'Zhao et al. (Institute of Automation, Chinese Academy of Sciences)',
arxiv:'2306.12156',

tldr:'`[SAM](#/p/sam)`의 프롬프트-분할 방식 자체를 버리고, YOLOv8-seg로 이미지의 모든 인스턴스를 먼저 통째로 분할한 뒤 프롬프트로 원하는 마스크를 사후에 골라내는 구조. 같은 GPU에서 SAM보다 약 50배 빠르다.',

context:'2023년 초 `[SAM](#/p/sam)`이 나오며 "무엇이든 분할"이 가능해졌지만, ViT-H 이미지 인코더가 입력마다 무거운 Transformer forward를 요구해 실시간 산업 적용이 어려웠다. 계산의 대부분은 고해상도 입력에서 돌아가는 Transformer 구조에서 나온다. FastSAM은 SAM의 정확도를 유지하면서 이 병목을 없앨 방법을 찾는다. 질문은 단순하다 — 프롬프트가 매 순간 분할을 유도해야 하는가, 아니면 분할을 미리 다 해 두고 프롬프트는 결과를 고르는 데만 쓰면 안 되는가?',

ideas:[
 {h:'과제 분해: 전체 분할과 프롬프트 선택을 분리',
  lead:'분할(무엇이 있는가)과 선택(무엇을 원하는가)을 서로 다른 두 단계로 떼어낸다.',
  d:'segment-anything 과제를 all-instance segmentation과 prompt-guided selection 두 단계로 분해한다. 첫 단계는 이미지 안의 모든 객체·영역을 한 번에 분할하는 CNN 검출기이고, 둘째 단계는 그 결과에서 프롬프트에 맞는 마스크를 사후에(post-hoc) 골라내는 순수 후처리다. 이 분리가 실시간 구현을 가능하게 만드는 핵심 설계다.'},
 {h:'인코더를 CNN으로: YOLOv8-seg 통째로 재사용',
  lead:'ViT-H 인코더 대신 검증된 인스턴스 분할기 YOLOv8-seg를 그대로 학습시킨다.',
  d:'`[YOLOv7](#/p/yolov7)`계열의 최신형인 YOLOv8을 검출-분할 겸용(YOLOv8-seg, YOLACT 방식)으로 그대로 가져와, SA-1B 데이터의 2%(1/50)만으로 100 epoch 학습시킨다. 새로운 아키텍처를 설계하지 않고 잘 만들어진 CNN 인스턴스 분할기에 사람이 설계한 귀납 편향(inductive bias)을 실어, Transformer가 데이터로 배워야 했던 것을 구조로 대신한다.'},
 {h:'프롬프트는 유도가 아니라 사후 선택',
  lead:'점·박스·텍스트 프롬프트는 분할 결과를 만드는 게 아니라 그 중 하나를 고르는 데만 쓰인다.',
  d:'점 프롬프트는 그 점이 속한 마스크를 찾고, 박스 프롬프트는 IoU가 가장 높은 마스크를 고르며, 텍스트 프롬프트는 CLIP으로 이미지·텍스트 임베딩 유사도가 가장 높은 마스크를 고른다. 세 경우 모두 인코더를 다시 태우지 않고 이미 나온 마스크 후보 집합 위에서 매칭만 한다.'},
 {h:'구조에 우선순위(priors)를 넣어 데이터를 줄인다',
  lead:'검출·분할이라는 과제 구조를 CNN에 미리 새겨 넣어 학습 데이터와 연산을 함께 줄인다.',
  d:'SAM은 Transformer가 대규모 데이터(SA-1B 전체, 11M 이미지)에서 비전 귀납 편향을 스스로 배우게 했다. FastSAM은 그 편향(객체는 지역적이고, FPN 다중 스케일로 잡힌다는 것 등)을 아키텍처에 미리 심어, 데이터의 2%만으로 비슷한 객체 제안 성능에 도달한다. 모델 압축의 한 경로로서 "구조에 사전지식을 넣으면 데이터·연산을 줄일 수 있다"는 것을 보여준다.'}
],

diagram:{type:'compare', cap:'SAM은 프롬프트가 분할 자체를 유도하지만(분할 전에 프롬프트가 필요), FastSAM은 먼저 전부 분할해 두고 프롬프트로는 고르기만 한다.',
 left:{t:'SAM: 프롬프트-유도 분할', items:['ViT-H 인코더로 임베딩','프롬프트가 디코더 조건으로 입력','프롬프트마다 마스크 생성']},
 right:{t:'FastSAM: 분할 후 선택', items:['YOLOv8-seg로 전량 선분할', 'k개 프로토타입 + 마스크 계수', '프롬프트는 후보 중 매칭만']}},

math:[
 {expr:'mask = threshold( sum_i coeff_i(x) * proto_i )',
  tex:'\\text{mask} = \\sigma\\!\\left(\\sum_{i=1}^{k} c_i \\cdot P_i\\right),\\quad k=32',
  d:'YOLACT 방식의 인스턴스 마스크 합성. 검출 헤드가 내놓는 $k$개의 마스크 계수 $c_i \\in [-1,1]$ 를 ProtoNet이 만든 $k$개의 프로토타입 $P_i$ 와 가중합해 인스턴스별 마스크를 만든다. FastSAM은 $k=32$ 를 기본값으로 쓴다.'}
],

numbers:[
 {k:'속도 (Everything, 32×32 프롬프트)', v:'40ms vs 2099ms', d:'단일 **RTX 3090**, FastSAM(68M) vs SAM-H(0.6G) — 약 **52배**'},
 {k:'파라미터', v:'68M vs 636M(SAM-H)', d:'YOLOv8-x 기반, SAM-H 대비 약 1/9'},
 {k:'학습 데이터', v:'SA-1B의 2%(1/50)', d:'입력 해상도 1024, 100 epoch'},
 {k:'COCO Box AR@1000', v:'63.7', d:'SAM(32×32 point prompt) 대비 +1.2, RTX 3090에서 50배 빠름'},
 {k:'속도 불변성', v:'프롬프트 수와 무관하게 40ms', d:'SAM은 프롬프트 수·Everything 격자 크기에 따라 446ms~6972ms로 증가'}
],

impact:'SAM 이후 "가벼운 SAM"이라는 새 하위 분야를 사실상 연 논문이다. ViT 인코더 없이도 실시간 segment-anything이 가능함을 보이며, 산업 현장(엣지·모바일·실시간 파이프라인)에서 SAM급 마스크가 필요한 곳에 CNN 기반 대안을 제시했다. 다만 이 방법은 SAM을 "가볍게 만든" 것이 아니라 **다른 방식으로 같은 과제를 푼** 것이라, 이후 등장한 `[MobileSAM](#/p/mobile-sam)`(SAM 구조를 그대로 두고 인코더만 증류)과 함께 두 갈래 접근으로 자리잡았다.',

legacy:[
 '**경량 SAM 계열의 시초 중 하나** — 같은 달(2023-06) 나온 `[MobileSAM](#/p/mobile-sam)`과 함께 "SAM을 실시간으로" 흐름의 출발점',
 '**CNN 검출기 재사용이라는 선례** — 새 백본을 설계하지 않고 성숙한 YOLO 계열을 그대로 목적에 맞게 재활용하는 방식이 이후 경량화 논문들의 기본 전략이 됨',
 '**segment-then-select 패턴의 확산** — 프롬프트를 생성이 아니라 선택에만 쓰는 구조가 이후 실시간 분할 파이프라인에서 반복적으로 채택됨',
 '**TensorRT 배포가 기본값으로** — 논문 자체가 PyTorch/TensorRT 두 조건을 비교해, 경량 분할 모델 논문이 배포 수치를 같이 보고하는 관행을 강화'
],

pitfalls:[
 '**"SAM을 가볍게 만든 것"이 아니다.** SAM은 프롬프트가 인코더·디코더의 조건으로 들어가 분할 자체를 유도하지만(prompt-guided segmentation), FastSAM은 프롬프트 없이 이미지 전체를 먼저 분할해 두고 프롬프트로는 그 중 하나를 고르기만 한다(segment-then-select). 두 방식은 구조가 다르지 근본적으로 같은 모델의 압축판이 아니다.',
 '**세밀한 프롬프트 상호작용에서 품질이 떨어질 수 있다.** 경계가 애매한 영역에서 점 하나로 정교하게 분할을 유도하는 SAM 특유의 상호작용을, 사후 선택 방식은 재현하기 어렵다 — 이미 고정된 후보 마스크 집합 안에서만 고를 수 있기 때문이다.',
 '**속도 수치는 측정 조건을 반드시 함께 봐야 한다.** Table 1의 40ms는 단일 RTX 3090, 입력 1024, PyTorch 추론 기준이며 TensorRT 사용 시 더 빨라진다. GPU·해상도·배치가 다르면 배수는 달라진다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'All-instance Segmentation 단계. CNN Backbone → FPN이 P3~P5 세 스케일 특징을 뽑고, 각 스케일마다 Detect(박스)와 Mask Coeff.(마스크 계수)를 병렬로 낸다. 아래 Mask Branch에서 ProtoNet이 만든 프로토타입들을 마스크 계수로 가중합(+0.0137, -0.0342, +0.6846…)해 최종 인스턴스 마스크를 합성한다. 이 단계는 프롬프트 없이 이미지 전체에 대해 한 번만 실행된다.',
  src:'원문 Figure 2 상단, p.3'},
 {f:'fig2-prompt-selection.png',
  cap:'Prompt-guided Selection 단계. 왼쪽부터 점 프롬프트(별표), 박스 프롬프트(초록 사각형), 텍스트 프롬프트("The black dog")가 이미 만들어진 마스크 후보 중 하나를 고른다. 텍스트 프롬프트는 CLIP의 Image/Text Encoder로 임베딩을 만들어 유사도가 가장 높은 마스크를 선택한다 — 이 단계에서는 새로 분할을 하지 않는다.',
  src:'원문 Figure 2 하단, p.3'}
],

quotes:[
 {t:'By reformulating the task as segments-generation and prompting, we find that a regular CNN detector with an instance segmentation branch can also accomplish this task well.',
  src:'Abstract, p.1'},
 {t:'With our method, we achieve a comparable performance with the SAM method at 50x higher run-time speed.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2306.12156 — Fast Segment Anything', u:'https://arxiv.org/abs/2306.12156'},
 {t:'GitHub — CASIA-IVA-Lab/FastSAM', u:'https://github.com/CASIA-IVA-Lab/FastSAM'}
]
});
