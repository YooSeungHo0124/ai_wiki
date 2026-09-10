WIKI.paper({
slug:'t2i-adapter',
venue:'arXiv 2023 (AAAI 2024)',
authors:'Mou et al. (Peking University · ARC Lab, Tencent PCG)',
arxiv:'2302.08453',

tldr:'얼린 [Stable Diffusion](#/p/ldm)에 U-Net 인코더와 같은 해상도의 특징을 뽑는 **작은 어댑터**만 붙여, 스케치·깊이·세그멘테이션·색 같은 구조 조건을 텍스트 없이 정확히 줄 수 있게 만든 논문. 파라미터 약 77M, 학습 4×V100으로 3일.',

context:'2022년 말 [LDM/Stable Diffusion](#/p/ldm)은 텍스트 프롬프트만으로 놀라운 생성 품질을 보였지만, 텍스트는 "구조"를 정확히 전달하는 수단이 못 됐다. "날개 달린 자동차"처럼 학습 데이터에 흔치 않은 구도를 요청하면 결과가 불안정했다. 저자들은 이것이 SD가 그런 구조를 생성할 능력이 없어서가 아니라, 텍스트가 그 능력을 끌어낼 **정확한 안내를 주지 못하기 때문**이라고 본다. 이 문제를 풀려면 SD 자체를 다시 학습시키는 것이 아니라, SD가 이미 내부에 가진 지식과 외부 조건 신호를 **정렬(align)**시키는 작은 모듈만 있으면 된다는 것이 출발점이다. 같은 시기 동일한 문제의식에서 나온 것이 `[ControlNet](#/p/controlnet)`이며, 논문은 이를 "동시대 연구"로 명시한다.',

ideas:[
 {h:'조건 인코더가 U-Net 인코더와 같은 4단 해상도로 특징을 만든다',
  lead:'조건 맵을 4개 스케일로 인코딩해 U-Net 인코더 특징에 그대로 더한다.',
  d:'입력 조건 맵(512×512)을 pixel unshuffle로 64×64까지 내린 뒤, 각 스케일마다 Conv 1개 + ResBlock 2개로 특징 $F_c^k$ 를 뽑고 3번 다운샘플해 4개 스케일 $\\{F_c^1,F_c^2,F_c^3,F_c^4\\}$ 을 만든다. 이 텐서 모양이 SD U-Net 인코더의 중간 특징 $F_{enc}$ 와 정확히 같아서, 덧셈 한 번($\\hat F_{enc}^i = F_{enc}^i + F_c^i$)으로 주입이 끝난다. 별도의 cross-attention이나 복사된 디코더가 없다.'},
 {h:'SD는 완전히 얼리고 어댑터만 학습한다',
  lead:'SD 가중치는 고정한 채 조건별 어댑터 하나만 새로 학습시킨다.',
  d:'학습 대상은 어댑터 파라미터뿐이다. 스케치·깊이·세그멘테이션·키포즈·색 팔레트마다 독립된 어댑터를 하나씩 학습시키고, SD 본체는 손대지 않는다. 그 결과 SD의 원래 생성 능력과 커스텀 체크포인트(같은 SD에서 파인튜닝된 모델) 호환성이 그대로 보존된다.'},
 {h:'여러 조건을 학습 없이 그냥 더해서 합성한다',
  lead:'가중합 $F_c=\\sum_k \\omega_k F_{AD}^k(C_k)$ 로 여러 어댑터를 추가 학습 없이 합친다.',
  d:'스케치 어댑터와 색 어댑터를 각각 조정 가능한 가중치 $\\omega_k$ 로 더하면, 구조는 스케치가 색은 팔레트가 맡는 식으로 조건을 조합할 수 있다. 이 합성이 되는 이유는 각 어댑터의 출력이 같은 좌표계(U-Net 인코더 특징 공간)에 살기 때문이다.'},
 {h:'가이던스는 초반 디노이징 스텝에서만 중요하다',
  lead:'DDIM 초반 단계에만 조건을 줘도 되고, 후반엔 거의 무의미함을 실험으로 확인했다.',
  d:'DDIM 샘플링을 초·중·후반 3구간으로 나눠 각 구간에만 가이던스를 넣어보면, 결과의 구조는 **초반 구간**에서 거의 결정되고 중·후반에 넣은 가이던스는 결과에 거의 영향이 없다. 이는 전체 구조 정보가 디노이징 초기에 이미 확정된다는 관찰이다.'},
 {h:'큐빅 시간 샘플링으로 학습을 초반 구간에 집중시킨다',
  lead:'학습 시 시간 스텝을 $t=(1-(t/T)^3)T$ 로 뽑아 초반 구간을 더 자주 학습한다.',
  d:'위 관찰 때문에 시간 스텝을 균등 샘플링하면 손실 대부분이 "가이던스가 이미 무의미한" 후반 구간에서 나와 학습 신호가 약해진다. 큐빅 함수로 초반 구간이 더 자주 뽑히게 하면 색 가이던스처럼 약한 신호가 특히 개선된다 — 이는 어댑터에 시간 임베딩을 아예 넣지 않고도(그래서 매 스텝 재계산할 필요가 없이) 문제를 해결하는 학습 스케줄 트릭이다.'}
],

diagram:{type:'flow', cap:'조건 맵 하나가 T2I-Adapter를 거쳐 얼린 U-Net 인코더 특징에 스케일별로 더해진다.',
 nodes:[
  {t:'조건 맵', s:'512×512, 스케치/깊이 등'},
  {t:'Pixel언셔플', s:'→ 64×64'},
  {t:'Conv+RB×2', s:'스케일별 반복 4회', acc:true, note:'유일한 학습 대상'},
  {t:'4스케일 특징', s:'F_c¹…F_c⁴'},
  {t:'U-Net 인코더에 덧셈', s:'F̂=F_enc+F_c', a:'스케일별'}
 ]},

math:[
 {expr:'F_c = F_AD(C);   F̂_enc^i = F_enc^i + F_c^i,  i∈{1,2,3,4}',
  tex:'\\mathbf{F}_c=\\mathcal{F}_{AD}(\\mathbf{C}),\\qquad \\hat{\\mathbf{F}}_{enc}^{i}=\\mathbf{F}_{enc}^{i}+\\mathbf{F}_{c}^{i},\\ i\\in\\{1,2,3,4\\}',
  d:'조건 $C$ 를 어댑터 $F_{AD}$ 로 인코딩해 4개 스케일에서 U-Net 인코더 특징에 그대로 더한다. 학습 손실은 SD의 표준 노이즈 예측 손실과 같은 형태다.'},
 {expr:'t = (1 − (t/T)³) × T,  t ~ U(0,T)',
  tex:'t=\\left(1-\\left(\\frac{t}{T}\\right)^{3}\\right)\\times T,\\quad t\\sim U(0,T)',
  d:'균등분포에서 뽑은 $t$ 를 이 큐빅 함수로 재매핑해, 확산 과정 초반(구조가 결정되는 구간)의 스텝이 더 자주 학습되게 한다.'}
],

numbers:[
 {k:'어댑터 파라미터', v:'약 77M', d:'저장 용량 약 300M — SD 본체는 동결'},
 {k:'스케일별 파라미터', v:'5M~77M', d:'Table에서 스케일 수를 줄인 경량 버전도 실험 (20M~300M 저장)'},
 {k:'학습 비용', v:'4×V100 32G · 3일', d:'배치 8 · 10 epoch · Adam lr $1\\times10^{-5}$'},
 {k:'FID (text+sketch)', v:'17.36', d:'COCO val, text-only SD(24.68)보다 큰 폭 개선'},
 {k:'FID (text+segmentation)', v:'16.78', d:'비교 대상 SPADE(23.44)·PITI(19.36)보다 낮음'},
 {k:'CLIP Score (text+sketch)', v:'0.2666', d:'ViT-L/14 기준, text-only SD(0.2648)보다 높음'}
],

impact:'이후 ComfyUI·A1111 등 생성형 UI에서 "조건 하나당 가벼운 플러그인"이라는 실무 패턴이 자리잡는 데 `[ControlNet](#/p/controlnet)`과 함께 기여했다. `[ControlNet](#/p/controlnet)`이 U-Net 인코더를 통째로 복제해 무겁지만 표현력이 큰 쪽이라면, T2I-Adapter는 얕은 conv 블록만으로 같은 문제를 훨씬 적은 파라미터로 푸는 쪽을 택했다. 이 "조건 종류마다 작은 어댑터 하나"라는 발상은 뒤이어 `[IP-Adapter](#/p/ip-adapter)`가 이미지 프롬프트에도 적용하게 된다.',

legacy:[
 '**경량 조건 주입의 표준 축** — `[ControlNet](#/p/controlnet)`(무겁지만 강함) vs T2I-Adapter(가볍고 빠름)라는 두 갈래가 지금도 실무 선택 기준으로 남아 있다',
 '**어댑터 콘셉트의 확산** — 같은 "얼린 백본 + 작은 플러그인" 발상이 `[IP-Adapter](#/p/ip-adapter)`의 이미지 프롬프트, `[LoRA](#/p/lora)`의 가중치 어댑터와 함께 확산모델 생태계의 기본 패턴이 됨',
 '**SDXL 버전으로 계승** — 커뮤니티에서 T2I-Adapter-SDXL이 나오며 대형 백본에도 같은 경량 설계가 유효함을 재확인',
 '**시간 스텝 샘플링 재조명** — 균등 시간 샘플링이 항상 최선이 아니라는 관찰이 이후 가이던스·distillation 계열 연구에서 반복적으로 재등장'
],

pitfalls:[
 '**"ControlNet보다 그냥 가벼운 버전"이 아니다.** 구조가 다르다 — ControlNet은 U-Net 인코더를 복제해 조건을 그 안에서 처리하지만, T2I-Adapter는 U-Net 바깥의 별도 소형 네트워크로 조건 특징을 미리 만들어 덧셈만 한다. 그래서 파라미터 차이가 크다(수백M vs 77M).',
 '**색 팔레트 어댑터는 구조가 아니라 hue/분포만 조절한다.** 64배 다운·업샘플로 의도적으로 구조 정보를 지운 조건이므로, 세밀한 색 위치 제어를 기대하면 안 된다.',
 '**후반 스텝에 조건을 넣어도 소용없다는 관찰은 이 논문의 학습 스케줄 설계 근거이지, "가이던스 스케일을 아무 때나 꺼도 된다"는 일반 법칙은 아니다.** 어댑터·조건 종류에 따라 다를 수 있다.'
],

figures:[
 {f:'fig3-architecture.png',
  cap:'위쪽 파란 박스가 얼린 SD(텍스트 인코더+U-Net+디코더), 아래 노란 사다리꼴들이 학습 대상 T2I-Adapter. 각 조건 c1,c2,…가 독립된 어댑터를 거쳐 가중치 ω로 더해진 뒤 U-Net 인코더의 여러 스케일에 주입된다(굵은 화살표). 오른쪽 아래 점선 박스가 어댑터 내부 — Pixel Unshuffle로 해상도를 낮춘 뒤 Conv+RB×2를 스케일마다 반복한다.',
  src:'원문 Figure 3, p.4'}
],

quotes:[
 {t:'We propose to learn simple and lightweight T2I-Adapters to align internal knowledge in T2I models with external control signals, while freezing the original large T2I models.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2302.08453 — T2I-Adapter', u:'https://arxiv.org/abs/2302.08453'},
 {t:'GitHub — TencentARC/T2I-Adapter', u:'https://github.com/TencentARC/T2I-Adapter'}
]
});
