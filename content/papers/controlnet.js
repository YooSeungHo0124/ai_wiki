WIKI.paper({
slug:'controlnet',
venue:'ICCV 2023',
authors:'Zhang, Rao, Agrawala (Stanford University)',
arxiv:'2302.05543',

tldr:'거대 확산모델을 얼린 채 **복제한 인코더 + zero convolution**만 추가로 학습시켜, 엣지·포즈·깊이 같은 공간 조건으로 이미지 생성을 제어하는 방법. 수만 장 데이터와 한 대의 소비자용 GPU로도 [Stable Diffusion](#/p/ldm) 규모 모델을 망가뜨리지 않고 미세조정할 수 있게 했다.',

context:'2023년 초, [LDM](#/p/ldm)/Stable Diffusion은 텍스트 프롬프트만으로 이미지를 생성했지만 "이 정확한 구도로, 이 포즈로" 같은 공간적 요구는 텍스트로 표현하기 어려웠다. 문제는 데이터 규모의 격차다. Stable Diffusion은 LAION-5B로 학습됐는데, 엣지맵·포즈·깊이맵처럼 특정 조건이 붙은 이미지 쌍 데이터셋은 이보다 **최대 5만 배 작다**. 이런 작은 데이터로 전체 모델을 직접 미세조정하면 과적합과 **catastrophic forgetting**으로 원래의 생성 품질이 무너진다. 질문은 이것이다 — 큰 모델의 지식은 그대로 두고, 작은 데이터로 새 조건만 안전하게 얹을 방법은 없는가?',

ideas:[
 {h:'원본을 얼리고 인코더를 통째로 복제',
  lead:'사전학습 가중치는 고정하고, 인코더 블록의 학습 가능한 복제본만 따로 둔다.',
  d:'Stable Diffusion U-Net의 12개 인코더 블록과 미들 블록을 그대로 복제해 **trainable copy**를 만든다. 원본(locked copy)은 파라미터를 전혀 갱신하지 않아 gradient 계산도 필요 없다. 복제본만 새 조건 이미지를 입력으로 받아 학습되고, 그 결과를 원본 디코더의 skip-connection에 더해준다. 수십억 장으로 학습된 backbone은 그대로 보존된 채 새 능력만 붙는 구조다.'},
 {h:'zero convolution: 0에서 시작해 해치지 않는다',
  lead:'가중치·바이어스를 0으로 초기화한 1×1 conv로 복제본을 연결해 초기 학습을 무해하게 만든다.',
  d:'복제본의 입력과 출력을 원본에 연결하는 두 개의 1×1 conv(zero convolution)를 가중치와 bias 모두 0으로 초기화한다. 학습 첫 스텝에는 이 항이 0이라 $y_c = y$, 즉 ControlNet을 붙이기 전과 완전히 같은 출력이 나온다. 학습이 진행되며 이 conv가 서서히 0이 아닌 값을 학습해 조건 신호를 점진적으로 주입하므로, 초기 gradient에 실린 무작위 잡음(harmful noise)이 backbone을 훼손할 일이 없다.'},
 {h:'조건마다 별도의 ControlNet',
  lead:'Canny 엣지·사람 포즈·깊이·세그멘테이션 등 조건 종류별로 독립적으로 학습한다.',
  d:'하나의 ControlNet은 하나의 조건 종류(Canny edge, HED soft edge, Openpose 사람 포즈, depth map, normal map, semantic segmentation, scribble 등)에 대해 학습된다. 조건 이미지는 512×512로 변환된 뒤 작은 conv 네트워크로 U-Net과 같은 latent 크기로 인코딩돼 입력에 더해진다. 여러 ControlNet의 출력을 그대로 더하면 조건을 조합해 동시에 걸 수도 있다.'},
 {h:'작은 데이터·한 GPU로도 안전하게',
  lead:'1천 장에서도 붕괴하지 않고, 소비자용 GPU 한 대로 대형 모델을 미세조정한다.',
  d:'학습 데이터셋 크기를 1천~300만 장까지 바꿔가며 실험한 결과, 1천 장 규모에서도 학습이 붕괴하지 않고 조건을 따르는 결과를 냈다(원문 Figure 10). 실사용 실험에서는 20만 장, NVIDIA RTX 3090Ti 한 대, 5일 학습만으로 대형 산업용 모델(Stable Diffusion V2 Depth-to-Image, 수천 GPU시간·1200만 장 이상 학습)과 사용자가 거의 구분하지 못하는 결과를 냈다.'},
 {h:'CFG와 결합해 조건 없이도 동작',
  lead:'프롬프트 없이도 [classifier-free guidance](#/p/cfg)의 무조건 항을 조건 이미지로 대체해 생성을 유도한다.',
  d:'텍스트 프롬프트가 비어 있거나 부실할 때, [CFG](#/p/cfg)의 negative(무조건) 쪽 예측에 원본이 아닌 조건 이미지를 넣어 guidance 강도를 강제로 끌어올리는 방법(CFG Resolution Weighting)을 함께 제시한다. 이 덕분에 프롬프트가 전혀 없어도 조건 이미지만으로 안정적인 생성이 가능하다.'}
],

diagram:{type:'compare', cap:'기존의 직접 미세조정과 ControlNet 구조의 차이.',
 left:{t:'직접 미세조정', items:['전체 가중치 갱신','작은 데이터에 과적합','원 모델 품질 훼손 위험']},
 right:{t:'ControlNet', items:['원본 완전 동결','인코더만 복제해 학습','zero conv로 무해하게 시작']}},

math:[
 {expr:'y = F(x; Θ)   (기존 블록)',
  tex:'\\boldsymbol{y}=\\mathcal{F}(\\boldsymbol{x};\\Theta)',
  d:'사전학습된 신경망 블록 하나는 입력 feature map $x$를 파라미터 $\\Theta$로 변환해 $y$를 만든다. ControlNet은 이 $\\Theta$를 전부 고정한다.'},
 {expr:'yc = F(x;Θ) + Z( F(x + Z(c;Θz1); Θc); Θz2 )',
  tex:'\\boldsymbol{y}_c=\\mathcal{F}(\\boldsymbol{x};\\Theta)+\\mathcal{Z}\\big(\\mathcal{F}(\\boldsymbol{x}+\\mathcal{Z}(\\boldsymbol{c};\\Theta_{z1});\\Theta_c);\\Theta_{z2}\\big)',
  d:'$\\Theta_c$가 복제본, $\\mathcal{Z}(\\cdot;\\Theta_z)$가 zero convolution이다. 학습 시작 시 $\\Theta_{z1}=\\Theta_{z2}=0$이므로 두 항이 모두 0이 되어 $y_c=y$, 즉 원본과 완전히 같은 출력에서 학습이 시작된다.'}
],

numbers:[
 {k:'조건 데이터셋 vs LAION-5B', v:'최대 1/50,000', d:'엣지·포즈 등 조건 붙은 이미지 쌍 데이터셋이 Stable Diffusion 원 학습 데이터보다 최대 5만 배 작음'},
 {k:'추가 GPU 메모리·시간', v:'+23% / +34%', d:'A100 40GB 기준, ControlNet을 붙였을 때 원본 대비 학습 오버헤드'},
 {k:'depth 조건 학습 데이터·GPU', v:'20만 장 · RTX 3090Ti 1대 · 5일', d:'산업용 모델(SDv2-D2I, 1200만 장·A100 클러스터) 수준 결과를 훨씬 적은 자원으로 재현'},
 {k:'구분 실험 정확도', v:'0.52 ± 0.17', d:'사용자 12명이 ControlNet과 산업용 모델의 생성 결과를 구분하지 못함(우연 수준)'},
 {k:'최소 학습 데이터', v:'1,000장', d:'이 규모에서도 학습이 붕괴하지 않고 조건을 따름'}
],

impact:'확산모델을 다루는 방식이 "프롬프트 엔지니어링"에서 "구조적 조건화"로 넓어졌다. 사전학습 모델을 건드리지 않고 복제본 + zero conv만 붙이는 패턴은 이후 다양한 조건 주입 방법(어댑터류)의 표준 레시피가 됐고, [DreamBooth](#/p/dreambooth) 같은 대상 학습과 결합해 "이 사람을, 이 포즈로" 같은 정밀한 제어를 실사용 워크플로(포즈 리깅, 건축 스케치, 만화 채색)에 들여왔다. zero convolution은 이후 "새 능력을 기존 가중치를 해치지 않고 붙인다"는 아이디어의 대표 사례로 자주 인용된다.',

legacy:[
 '**T2I-Adapter, IP-Adapter** 등 더 가벼운 어댑터 구조로 이어지며 "얼린 backbone + 소형 조건 모듈" 패턴이 확산모델 생태계의 기본값이 됨',
 '**[SDXL](#/p/sdxl)** 등 후속 대형 모델에도 ControlNet 변형이 그대로 이식되어, 크기·크롭 조건화와 별개로 공간 조건을 다루는 표준 도구로 자리잡음',
 '**멀티모달 조건 조합** — 여러 ControlNet 출력을 단순 덧셈으로 합성하는 방식이 이후 조건 조합 연구의 baseline이 됨',
 '**커뮤니티 확산** — Canny·pose·depth·scribble 등 사전학습된 ControlNet 체크포인트가 공개되며 Stable Diffusion 생태계의 사실상 표준 확장으로 정착'
],

pitfalls:[
 '**zero convolution이 "0으로 초기화된 층"이라고 학습이 안 될 것 같지만 아니다.** 초기 출력만 0일 뿐 gradient 자체는 0이 아니라서(원문 부록에서 증명) 정상적으로 학습이 진행된다.',
 '**"인코더만 복제한다"는 디코더는 원본을 그대로 재사용한다는 뜻이다.** 복제본은 12개 인코더 블록 + 미들 블록뿐이고, 디코더는 잠긴 원본의 skip-connection에 조건 신호가 더해지는 구조라는 점을 놓치기 쉽다.',
 '**적은 데이터로도 되는 것이지, 데이터 품질이 필요 없다는 뜻은 아니다.** 원문은 1천 장에서도 붕괴하지 않는다고 보였지만 이는 조건-이미지 쌍이 깨끗하게 정렬된 경우이며, 노이즈가 큰 페어 데이터에서는 별개 문제다.'
],

figures:[
 {f:'fig2-zeroconv.png',
  cap:'(a) 원래 블록은 x→y 그대로. (b) 원본 블록을 잠그고(자물쇠 아이콘) 옆에 trainable copy를 두어, 입력 쪽과 출력 쪽을 각각 zero convolution으로 연결한 뒤 더한다. 학습 시작 시 이 zero convolution의 출력이 0이라 (b)는 (a)와 정확히 같은 함수에서 출발한다.',
  src:'원문 Figure 2, p.3'},
 {f:'fig1-canny-example.png',
  cap:'같은 Canny 엣지 입력(맨 왼쪽)에서 프롬프트만 바꿔가며 생성한 결과들. 엣지가 정해주는 사슴의 윤곽·자세는 그대로 유지되면서 스타일·배경·조명만 프롬프트를 따라 바뀐다.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'To add a ControlNet to such a pre-trained neural block, we lock (freeze) the parameters Θ of the original block and simultaneously clone the block to a trainable copy with parameters Θc.',
  src:'Section 3.1, p.4'},
 {t:'In this way, harmful noise cannot influence the hidden states of the neural network layers in the trainable copy when the training starts.',
  src:'Section 3.1, p.4'}
],

links:[
 {t:'arXiv 2302.05543 — Adding Conditional Control to Text-to-Image Diffusion Models', u:'https://arxiv.org/abs/2302.05543'},
 {t:'ControlNet 공식 GitHub', u:'https://github.com/lllyasviel/ControlNet'}
]
});
