WIKI.paper({
slug:'ip-adapter',
venue:'arXiv 2023',
authors:'Ye et al. (Tencent AI Lab)',
arxiv:'2308.06721',

tldr:'텍스트 대신 **이미지를 프롬프트**로 쓸 수 있게 하는 어댑터. 텍스트용·이미지용 cross-attention을 아예 **분리**해 이미지 특징이 텍스트 특징에 밀리지 않게 만들었고, 파라미터 22M만으로 이미지 프롬프트 전용으로 처음부터 학습한 대형 모델들과 맞먹는 품질을 낸다.',

context:'텍스트만으로 원하는 스타일·구도를 정확히 지정하기는 어렵다. "이미지로 프롬프트를 주는" 시도는 이미 여럿 있었다 — 처음부터 새로 학습(Open unCLIP, Versatile Diffusion)하거나 [Stable Diffusion](#/p/ldm)을 통째로 파인튜닝(SD Image Variations)하는 방식인데, 둘 다 비용이 크고 커스텀 체크포인트·`[ControlNet](#/p/controlnet)` 같은 기존 도구와 호환되지 않는다. 더 가벼운 어댑터 시도(`[T2I-Adapter](#/p/t2i-adapter)`의 스타일 어댑터, Uni-ControlNet 등)도 있었지만 이미지 특징을 텍스트 특징과 **단순히 이어붙여서(concat)** 같은 cross-attention에 넣는 방식이라 품질이 파인튜닝 모델에 못 미쳤다. 이 논문은 "왜 못 미치는가"를 이미지 특징이 텍스트 cross-attention 경로에 묻혀 세밀한 정보를 전달하지 못하기 때문이라고 짚고, 경로 자체를 분리하는 해법을 낸다.',

ideas:[
 {h:'분리된 cross-attention: 텍스트용과 이미지용을 따로 둔다',
  lead:'이미지 조건마다 새 Key·Value 투영을 하나씩 추가해 텍스트 attention과 독립적으로 계산한다.',
  d:'기존 텍스트 cross-attention은 그대로 두고, 각 cross-attention 층마다 **이미지 전용 cross-attention을 하나씩 병렬로 추가**한다. 두 attention은 같은 Query $Z$ 를 공유하지만 Key·Value는 각각 텍스트 특징 $c_t$·이미지 특징 $c_i$ 에서 따로 나온다. 두 출력은 단순히 더해진다. concat과 달리 이미지 특징이 텍스트 토큰들 사이에서 희석되지 않고 자기 전용 경로를 갖는다.'},
 {h:'학습 대상은 새 Key·Value 투영 행렬뿐',
  lead:'SD 전체를 얼리고 이미지 cross-attention의 $W_k\', W_v\'$ 만 학습한다.',
  d:'이미지 쪽 Query는 텍스트 cross-attention의 Query를 그대로 재사용하므로, 층마다 새로 학습할 파라미터는 $W_k\', W_v\'$ 두 개뿐이다. 수렴을 빠르게 하려고 이 둘은 텍스트 cross-attention의 $W_k, W_v$ 값으로 초기화한다. SD U-Net 16개 cross-attention 층 전부에 이 쌍을 추가해도 총 학습 파라미터는 22M(프로젝션 네트워크 포함)에 그친다.'},
 {h:'이미지 인코더는 CLIP 전역 임베딩 + 작은 투영망',
  lead:'CLIP 이미지 인코더는 얼리고, 전역 임베딩을 길이 4 시퀀스로 펴는 투영망만 학습한다.',
  d:'CLIP(OpenCLIP ViT-H/14) 이미지 인코더는 동결한 채 전역 임베딩 하나를 뽑고, Linear+LayerNorm으로 구성된 작은 투영망이 이를 길이 $N{=}4$ 의 특징 시퀀스로 펼친다. 이 시퀀스의 차원은 텍스트 특징과 같게 맞춰져 있어 위의 분리된 cross-attention에 그대로 들어간다.'},
 {h:'이미지 조건도 classifier-free guidance와 세기 조절이 된다',
  lead:'학습 중 이미지 조건을 무작위로 드롭하고, 추론 시 가중치 λ로 이미지 영향력을 조절한다.',
  d:'학습 때 CLIP 이미지 임베딩을 확률적으로 0으로 채워 이미지 조건 없는 경우도 학습시키면, 추론 시 $[텍스트, 이미지] guidance$ 를 [CFG](#/p/cfg)처럼 쓸 수 있다. 또 텍스트·이미지 attention이 분리돼 있어 이미지 cross-attention의 출력에 가중치 $\\lambda$ 를 곱해 더하는 것만으로 이미지 프롬프트의 영향력을 0(순수 텍스트)부터 강하게까지 연속적으로 조절할 수 있다.'}
],

diagram:{type:'compare', cap:'기존 어댑터는 이미지·텍스트 특징을 이어붙여 하나의 cross-attention에 넣지만, IP-Adapter는 이미지 전용 cross-attention을 따로 둔다.',
 left:{t:'기존: concat 어댑터', items:['이미지+텍스트 특징을 이어붙임','같은 cross-attention 하나 공유','이미지 세부 정보가 희석됨']},
 right:{t:'IP-Adapter: 분리형', items:['텍스트·이미지 cross-attention 별도','Query만 공유, K·V는 독립','출력을 단순히 더함','λ로 이미지 영향력 조절']}
},

math:[
 {expr:"Z_new = Softmax(QKᵀ/√d)V + Softmax(Q(K')ᵀ/√d)V'   where K'=c_i W_k', V'=c_i W_v'",
  tex:"Z_{new}=\\text{Softmax}\\!\\left(\\frac{QK^{\\top}}{\\sqrt d}\\right)V + \\text{Softmax}\\!\\left(\\frac{Q(K')^{\\top}}{\\sqrt d}\\right)V',\\quad K'=c_iW_k',\\ V'=c_iW_v'",
  d:'앞 항이 원래 텍스트 cross-attention, 뒤 항이 새로 추가된 이미지 cross-attention. 같은 Query $Q=ZW_q$ 를 공유하되 Key·Value만 이미지 특징 $c_i$ 에서 독립적으로 만든다.'},
 {expr:"Z_new = Attention(Q,K,V) + λ·Attention(Q,K',V')",
  tex:"Z_{new}=\\text{Attention}(Q,K,V)+\\lambda\\cdot\\text{Attention}(Q,K',V')",
  d:'추론 시 스케일 $\\lambda$ 로 이미지 프롬프트의 세기를 조절한다. $\\lambda{=}0$ 이면 원래의 텍스트 전용 SD로 되돌아간다.'}
],

numbers:[
 {k:'학습 파라미터', v:'약 22M', d:'프로젝션 네트워크 + 16개 층의 K\',V\' 전부 포함'},
 {k:'학습 데이터', v:'약 1000만 쌍', d:'LAION-2B + COYO-700M 서브셋'},
 {k:'학습 비용', v:'8×V100 · 100만 스텝', d:'배치 8/GPU · AdamW lr $1\\times10^{-4}$'},
 {k:'CLIP-I (COCO val)', v:'0.828', d:'890M 파라미터 Open unCLIP(0.858)에 근접, 39M `[T2I-Adapter](#/p/t2i-adapter)` 스타일(0.648)·361M ControlNet Shuffle(0.616)을 크게 상회'},
 {k:'CLIP-T (COCO val)', v:'0.588', d:'비교 대상 전부 중 최고 — 텍스트 정합성도 함께 유지됨을 의미'}
],

impact:'22M이라는 파라미터로 수백M~1B급 전용 모델과 맞먹는 품질을 내면서, "이미지 프롬프트"가 텍스트 프롬프트와 대등한 1급 입력으로 취급되는 계기가 되었다. 무엇보다 SD 본체를 건드리지 않고 새 병렬 경로만 추가하는 구조라 `[ControlNet](#/p/controlnet)`·`[LoRA](#/p/lora)`·커스텀 체크포인트와 동시에 얹어 쓸 수 있고, 이 조합 가능성이 ComfyUI 등에서 IP-Adapter가 널리 쓰이는 실무적 이유다. Face ID·Plus 같은 후속 변형이 같은 분리 cross-attention 골격 위에 다른 이미지 인코더(얼굴 임베딩 등)를 꽂는 식으로 빠르게 파생되었다.',

legacy:[
 '**분리된 cross-attention이 표준 패턴으로 자리잡음** — 이후 다양한 조건(얼굴 ID, 깊이, 여러 참조 이미지)을 주입하는 어댑터들이 concat 대신 이 구조를 채택',
 '**IP-Adapter FaceID·Plus 등 파생 모델** — 같은 골격에 인식 특화 임베딩을 넣어 얼굴 일관성 생성에 특화',
 '**다중 어댑터 동시 사용의 표준화** — `[ControlNet](#/p/controlnet)`·`[LoRA](#/p/lora)`·IP-Adapter를 동시에 얹는 파이프라인이 ComfyUI·diffusers 생태계의 기본 구성이 됨',
 '**SDXL·후속 백본으로 계승** — IP-Adapter-SDXL 등으로 이식되며 어댑터가 백본 세대와 독립적으로 재사용 가능함을 보여줌'
],

pitfalls:[
 '**"이미지 임베딩 하나로 전체 이미지를 설명한다"는 한계가 있다.** CLIP 전역 임베딩은 스타일·전반적 내용은 잘 담지만, 정밀한 공간 구조(포즈·레이아웃)는 `[ControlNet](#/p/controlnet)`류의 조건이 여전히 더 강하다 — 그래서 실무에서는 둘을 같이 쓴다.',
 '**λ가 1 이상으로 크면 텍스트 프롬프트가 무시되는 경향이 있다.** 이미지·텍스트 균형은 태스크마다 재조정이 필요하다.',
 '**22M이라는 숫자는 SD v1.5 기준이다.** 더 큰 U-Net(SDXL 등)으로 옮기면 cross-attention 층 수와 차원이 달라져 파라미터 수도 달라진다.'
],

figures:[
 {f:'fig2-architecture.png',
  cap:'빨간 박스(Linear·LN·이미지 쪽 Cross Attention)만 학습 대상이고 나머지는 전부 동결. 이미지 인코더가 뽑은 임베딩이 Linear+LN을 거쳐 "Image Features" 시퀀스가 되고, 점선 박스 안에서 텍스트 cross-attention과 나란히 분리된 채 U-Net 각 층에 주입된 뒤 더해진다.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'Despite the simplicity of our method, an IP-Adapter with only 22M parameters can achieve comparable or even better performance to some fully fine-tuned image prompt models.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2308.06721 — IP-Adapter', u:'https://arxiv.org/abs/2308.06721'},
 {t:'GitHub — tencent-ailab/IP-Adapter', u:'https://github.com/tencent-ailab/IP-Adapter'}
]
});
