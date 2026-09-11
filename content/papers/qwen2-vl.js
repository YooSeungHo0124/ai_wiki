WIKI.paper({
slug:'qwen2-vl',
venue:'arXiv 2024',
authors:'Wang et al. (Alibaba Qwen Team)',
arxiv:'2409.12191',

tldr:'이미지를 고정 해상도로 잘라 넣던 관행을 버리고, **네이티브 해상도를 그대로** 가변 개수의 비주얼 토큰으로 인코딩한다. 위치 인코딩도 시간·높이·너비 3축으로 쪼갠 M-RoPE로 바꿔 이미지·영상·텍스트를 한 좌표계에 놓았다.',

context:'[Qwen-VL](#/p/qwen-vl)을 포함해 당시 VLM 대부분은 입력 이미지를 224×224나 448×448 같은 **고정 크기로 리사이즈**한 뒤 ViT에 넣었다. 이 방식은 정사각형이 아닌 사진이나 문서 스캔본에서 비율이 왜곡되고, 저해상도 이미지에 불필요하게 많은 토큰을 쓰거나 고해상도 이미지의 세부를 뭉갠다. 위치 인코딩도 텍스트용 1D-RoPE를 그대로 이미지 패치 시퀀스에 씌워, 2차원 공간 구조나 영상의 시간 축을 제대로 표현하지 못했다. Qwen2-VL은 "왜 이미지를 텍스트처럼 1차원 시퀀스로 취급하면서 크기까지 억지로 맞추는가"라는 질문에서 출발한다.',

ideas:[
 {h:'Naive Dynamic Resolution: 자르지 않고 토큰 수를 바꾼다',
  lead:'ViT의 절대 위치 임베딩을 없애고 2D-RoPE로 바꿔 임의 해상도를 그대로 받는다.',
  d:'ViT에서 절대 위치 임베딩을 제거하고 2D-RoPE를 넣어, 이미지를 원본 비율 그대로 패치 시퀀스로 만든다. 이후 ViT 뒤에 MLP 한 층을 붙여 인접한 2×2 토큰을 하나로 압축한다. 그 결과 224×224 이미지(patch=14)는 66토큰으로 끝나지만, 해상도가 커지면 토큰 수도 그만큼 늘어난다. 추론 시에는 서로 다른 해상도의 이미지들을 `<|vision_start|>`/`<|vision_end|>` 토큰으로 구분해 한 시퀀스에 패킹한다.'},
 {h:'M-RoPE: 위치를 시간·높이·너비 3축으로 분해',
  lead:'회전 위치 인코딩을 temporal·height·width 세 성분으로 쪼개 텍스트·이미지·영상을 같은 좌표계에 둔다.',
  d:'텍스트 토큰은 세 성분이 모두 같은 값을 가져 기존 1D-RoPE와 동일하게 동작한다. 이미지 토큰은 temporal ID가 고정된 채 height·width만 패치 위치에 따라 달라지고, 영상은 프레임마다 temporal ID가 증가한다. 한 시퀀스 안에서 모달리티가 바뀌면 다음 모달리티의 위치 ID를 이전 모달리티의 최대값+1부터 다시 매긴다. 이미지·영상에 쓰이는 위치 ID 값 자체가 작아지는 부수 효과 덕분에 추론 시 더 긴 시퀀스로 외삽하기도 쉬워진다.'},
 {h:'영상은 3D convolution으로 튜브 단위 처리',
  lead:'프레임을 2D 패치가 아니라 depth 2의 3D conv 튜브로 묶어 시퀀스 길이를 줄인다.',
  d:'영상은 초당 2프레임으로 샘플링하고, depth 2의 3D convolution으로 인접 프레임을 하나의 "튜브"로 묶어 처리한다. 이미지는 동일 프레임 2장으로 취급해 영상 파이프라인과 통일한다. 영상 하나당 토큰 총량은 16384개로 제한해 긴 영상 학습과 효율 사이 균형을 맞춘다.'},
 {h:'675M ViT를 2B/7B/72B LLM에 공통으로 붙인다',
  lead:'비전 인코더 크기는 고정하고 언어모델만 스케일링해 스케일링 법칙을 관찰한다.',
  d:'비전 인코더는 세 크기 모델 모두 동일한 675M 파라미터 ViT를 쓰고, [Qwen2](#/p/qwen2) 계열 LLM만 1.5B/7.6B/72B로 바꿔가며 붙인다. ViT 계산량을 LLM 크기와 무관하게 고정해 둔 채, 모델·데이터 규모를 키웠을 때 성능이 어떻게 변하는지를 관찰하는 것이 목적이다.'},
 {h:'3단계 학습: ViT 단독 → 전체 언패치 → LLM만 미세조정',
  lead:'ViT만 학습하는 단계, 전체를 여는 단계, LLM만 instruction-tuning하는 단계로 나눈다.',
  d:'1단계는 ViT만 학습해 시각-의미 정렬을 맞추고, 2단계는 전체 파라미터를 풀어 광범위한 데이터로 학습한다. 3단계는 ViT를 다시 고정하고 LLM만 instruction 데이터로 미세조정한다. 사전학습 코퍼스는 약 6000억 토큰이며 OCR·인터리브드 이미지-텍스트·영상 대화 등을 포함한다.'}
],

diagram:{type:'compare', cap:'고정 해상도로 자르던 기존 방식과 Qwen2-VL의 네이티브 해상도 처리 비교.',
 left:{t:'기존: 고정 해상도', items:['224/448 등으로 리사이즈','비율 왜곡·세부 손실','이미지당 토큰 수 고정']},
 right:{t:'Qwen2-VL: 동적 해상도', items:['원본 비율 그대로 패치화','2×2 토큰 압축 후 가변 길이','M-RoPE로 시간·높이·너비 분리']}
},

math:[
 {expr:'position(text) = (p, p, p),  position(image patch) = (t, h, w)',
  tex:'\\text{pos}_{\\text{text}}=(p,p,p),\\qquad \\text{pos}_{\\text{image}}=(t,h,w)',
  d:'텍스트 토큰은 세 축이 모두 같은 값이라 1D-RoPE와 동등하고, 이미지 패치는 temporal이 고정된 채 height·width가 패치 좌표를 따라 달라진다. 영상은 프레임마다 $t$ 가 증가한다.'}
],

numbers:[
 {k:'모델 크기', v:'2B / 7B(7.6B) / 72B', d:'세 모델 모두 675M ViT 공유, LLM만 스케일'},
 {k:'2×2 토큰 압축', v:'224×224 → 66토큰', d:'ViT 뒤 MLP로 인접 2×2 비주얼 토큰을 1개로 병합'},
 {k:'MMMU (val)', v:'64.5 (72B) / 54.1 (7B)', d:'GPT-4o 69.1 · Claude-3.5 Sonnet 68.3 대비 근접'},
 {k:'DocVQA (test)', v:'96.5 (72B)', d:'당시 이전 SoTA 94.1을 앞섬'},
 {k:'MathVista (testmini)', v:'70.5 (72B)', d:'GPT-4o 63.8, Claude-3.5 Sonnet 67.7보다 높음'},
 {k:'동적 vs 고정 해상도', v:'평균 1924토큰으로 3136토큰 고정 해상도와 동급 성능', d:'InfoVQA·RealWorldQA·OCRBench·MMMU 종합, Table 7'}
],

impact:'Qwen2-VL 이후 VLM 학계에서 "이미지를 몇 픽셀로 리사이즈할지"가 아니라 "몇 토큰까지 허용할지"가 설계 변수가 됐다. 동적 해상도는 이후 대다수 오픈 VLM의 표준 전처리로 자리잡았고, M-RoPE 계열의 위치 분해도 영상 이해 모델에 널리 재사용된다. 72B 모델이 GPT-4o·Claude-3.5 Sonnet과 다수 벤치마크에서 대등한 결과를 낸 것은, 오픈 웨이트 VLM이 폐쇄형 모델을 벤치마크 상에서 따라잡기 시작한 초기 사례로 꼽힌다.',

legacy:[
 '**동적 해상도의 표준화** — [Qwen2.5-VL](#/p/qwen25-vl)이 이 메커니즘을 그대로 이어받아 절대 시간 정렬과 문서 파싱으로 확장',
 '**M-RoPE 계열 확산** — 시간·공간을 분리하는 위치 인코딩 아이디어가 이후 영상-언어 모델 다수에 재사용',
 '**해상도-토큰 트레이드오프 연구** — min_pixels/max_pixels를 벤치마크마다 조정하는 관행이 VLM 평가 재현성 논쟁의 한 원인이 됨',
 '**에이전트형 VLM** — 모바일·로봇 조작 같은 device-control 벤치마크를 함께 보고하며 VLM을 액션 결정에 쓰는 흐름에 합류'
],

pitfalls:[
 '**"동적 해상도 = 무한 확대가 유리하다"는 오해다.** 논문 자체가 min_pixels를 늘리면 InfoVQA·OCRBench는 개선되지만 MMMU에는 영향이 거의 없다고 보고한다(Figure 4) — 병목이 항상 해상도는 아니다.',
 '**벤치마크 점수는 min_pixels/max_pixels 설정에 따라 달라진다.** Table 7처럼 같은 모델도 평균 이미지 토큰 수(64~3136)에 따라 InfoVQA·RealWorldQA 점수가 크게 흔들리므로, 다른 논문과 점수를 단순 비교하려면 이 설정이 같은지 먼저 확인해야 한다.',
 '**M-RoPE는 위치 ID를 재해석한 것이지 attention 자체를 바꾼 게 아니다.** 회전 위치 인코딩의 3축 분해일 뿐, 모델이 실제로 공간 관계를 "이해"하도록 보장하는 장치는 아니다.'
],

figures:[
 {f:'fig-arch.png', cap:'가운데 Vision Encoder가 서로 다른 크기의 이미지(Picture 1~3)와 영상(Video 1)을 각기 다른 개수의 토큰(11427/8/1125/2208)으로 압축해 QwenLM Decoder에 넣는다 — 토큰 수가 이미지마다 다르다는 점이 핵심.',
  src:'원문 Figure 2, p.4'},
 {f:'fig-mrope.png', cap:'왼쪽 격자가 이미지 패치의 (temporal, height, width) 위치 ID. 오른쪽 색 블록이 M-RoPE 임베딩을 세 축으로 나눠 표현한 것. 뒤이은 텍스트 토큰(4,4,4)부터는 이미지의 최대 위치 ID 뒤에서 다시 1씩 증가한다.',
  src:'원문 Figure 3, p.5'}
],

quotes:[
 {t:'Qwen2-VL introduces the Naive Dynamic Resolution mechanism, which enables the model to dynamically process images of varying resolutions into different numbers of visual tokens.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2409.12191 — Qwen2-VL', u:'https://arxiv.org/abs/2409.12191'},
 {t:'GitHub — QwenLM/Qwen2-VL', u:'https://github.com/QwenLM/Qwen2-VL'}
]
});
