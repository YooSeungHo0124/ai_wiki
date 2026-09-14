WIKI.paper({
slug:'qwen-image',
venue:'arXiv 2025 (Alibaba)',
authors:'Qwen Team (Alibaba)',
arxiv:'2508.02324',

tldr:'복잡한 텍스트 렌더링(특히 한자 같은 표어문자)과 편집 일관성 두 가지를 정면 목표로 삼은 이미지 생성 파운데이션 모델. 점진적 커리큘럼 학습과 의미·재구성 이중 인코딩으로 GenEval·ChineseWord 등에서 경쟁 모델을 앞섰다.',

context:'2025년 기준 GPT Image 1, Seedream 3.0 같은 상용 최상위 모델조차 여러 줄 텍스트, 특정 위치에 텍스트 삽입, 그리고 무엇보다 **표어문자(한자 등)** 렌더링에서 무너졌다. 알파벳 언어는 자모 26개 조합이라 diffusion 모델이 글자 형태를 어느 정도 암기·조합할 수 있지만, 한자는 자주 쓰는 글자만 수천 자이고 특히 저빈도 글자는 학습 데이터에 노출될 기회 자체가 희박한 long-tail 분포다. 자연 발생 텍스트 이미지만으로 학습하면 이 저빈도 글자를 충분히 볼 수 없다는 것이 핵심 병목이다. 동시에 이미지 편집에서는 "국소 수정 후 나머지가 그대로 유지되는가"(시각적 일관성)와 "구조가 바뀌어도 의미가 유지되는가"(의미적 일관성)를 동시에 만족시키기 어려웠다.',

ideas:[
 {h:'텍스트 인식 합성 데이터 파이프라인',
  lead:'자연 발생 텍스트만으론 저빈도 한자를 못 보므로, 순수/합성/복합 렌더링 3단계로 인공 데이터를 만든다.',
  d:'Pure Rendering(단순 배경에 글자만), Compositional Rendering, Complex Rendering 세 전략을 조합한 multi-stage 합성 파이프라인을 쓴다. 특히 상용한자표(List of Commonly Used Standard Chinese Characters) 기준으로 저빈도 글자까지 고르게 노출시켜, 자연 데이터의 long-tail 분포로는 닿지 않는 글자들을 인위적으로 보충한다.'},
 {h:'비텍스트→텍스트, 단순→복잡의 커리큘럼',
  lead:'글자 없는 이미지로 기본 생성 능력을 먼저 학습한 뒤, 단순 단어에서 문단 단위 텍스트로 점진적으로 난이도를 올린다.',
  d:'처음에는 텍스트가 없는 일반 이미지로 시각적 생성 능력을 잡고, 이후 자연 배경 위에 렌더링된 텍스트를 점진적으로 섞어 텍스트 렌더링 능력을 얹는다. 동시에 해상도도 낮은 단계에서 최종 1328×1328까지 단계적으로 올린다. 이 커리큘럼이 "복잡한 텍스트 렌더링"을 가능하게 한 핵심 학습 전략이다.'},
 {h:'이중 인코딩: 의미(Qwen2.5-VL)와 재구성(VAE)을 분리',
  lead:'원본 이미지를 Qwen2.5-VL과 VAE 인코더에 각각 따로 넣어 의미 특징과 저수준 재구성 특징을 모두 조건으로 쓴다.',
  d:'편집에서 "시각적 일관성"(픽셀 단위 보존)과 "의미적 일관성"(전역 의미 유지)은 서로 다른 정보가 필요하다. [Qwen2.5-VL](#/p/qwen25-vl)은 고수준 장면 이해를, VAE 인코더는 저수준 시각 디테일을 뽑아 둘 다 [MMDiT](#/p/sd3) 아키텍처의 조건 신호로 함께 넣는다. T2I·I2I·TI2I 세 태스크를 하나의 멀티태스크 학습 프레임으로 묶어 이 latent 표현을 정렬한다.'},
 {h:'MSRoPE: 이미지·텍스트 위치를 함께 인코딩',
  lead:'Multimodal Scalable RoPE로 이미지 패치와 텍스트 토큰의 위치 정보를 하나의 스킴으로 통합한다.',
  d:'MMDiT 블록 내부에서 self-attention 전에 QK-Norm(RMSNorm)과 함께 MSRoPE를 적용해, 이미지 패치 시퀀스와 텍스트 토큰 시퀀스가 서로 다른 위치 인코딩 규칙을 따로 쓰지 않고 하나의 scalable RoPE로 정렬된다.'},
 {h:'Producer-Consumer 분산 학습 인프라',
  lead:'TensorPipe로 VAE 인코딩·데이터 I/O(Producer)와 Megatron 기반 분산 학습(Consumer)을 분리한다.',
  d:'대규모 학습에서 전처리(VAE 인코딩, 데이터 로딩)가 GPU 학습을 기다리게 하는 병목을 막기 위해, Producer가 전처리를 전담하고 Consumer가 [Megatron](#/p/megatron) 프레임워크로 분산 학습만 전담하는 구조로 나눴다.'}
],

diagram:{type:'flow', cap:'시스템 프롬프트+유저 프롬프트를 Qwen2.5-VL이, 원본 이미지를 VAE가 인코딩해 MMDiT 조건으로 함께 들어간다.',
 nodes:[
  {t:'프롬프트', s:'system+user'},
  {t:'Qwen2.5-VL', s:'의미 특징 추출', acc:true},
  {t:'VAE 인코더', s:'재구성 특징'},
  {t:'MMDiT ×N', s:'MSRoPE + QK-Norm'},
  {t:'UnPatchify', s:'출력 이미지'}
 ]},

numbers:[
 {k:'GenEval Overall', v:'0.87 (base) / 0.91 (RL)', d:'Table 4 — Seedream 3.0·GPT Image 1[High](각 0.84) 상회, RL 버전은 0.9 넘은 유일한 모델'},
 {k:'ChineseWord Overall', v:'58.30', d:'Table 9 — Seedream 3.0(33.05)·GPT Image 1[High](36.14) 대비, Level-1 정확도 97.29%'},
 {k:'학습 해상도 단계', v:'저해상도 → 1328×1328', d:'§3.4 — progressive training으로 점진적으로 해상도를 올림'},
 {k:'입력 이미지 이중 인코딩', v:'Qwen2.5-VL(의미) + VAE(재구성)', d:'§1 — 편집 시 두 표현을 함께 MMDiT 조건으로 사용'},
 {k:'평가 태스크 범위', v:'T2I(GenEval·DPG·OneIG) + 편집(GEdit·ImgEdit·GSO)', d:'§Abstract — 생성·편집 벤치마크 전반에서 SOTA 주장'}
],

impact:'표어문자 텍스트 렌더링이라는, 서구 중심 벤치마크에서 잘 드러나지 않던 문제를 정면으로 다루고 ChineseWord라는 전용 벤치마크까지 새로 만들어 정량화했다. 의미·재구성 이중 인코딩으로 편집의 두 가지 일관성 요구(시각적 vs 의미적)를 분리해 다루는 접근은 이후 통합 생성·편집 모델의 설계에 참조점을 남겼다.',

legacy:[
 '**표어문자 렌더링을 벤치마크화** — ChineseWord처럼 한자 렌더링을 글자 빈도 등급별로 재는 벤치마크가 이후 T2I 모델 평가에 참조 지표로 쓰임',
 '**이중 인코딩(의미+재구성) 조건화** — [FLUX.1 Kontext](#/p/flux-kontext)의 시퀀스 결합과 다른 절충으로, 통합 생성·편집 모델의 조건화 설계에 대안 축을 제공',
 '**텍스트 인식 합성 데이터 파이프라인** — long-tail 글자 노출 문제를 합성 렌더링으로 보충하는 방식이 다국어·다문자 T2I 데이터 구축에 참조됨'
],

pitfalls:[
 '**GenEval 0.91은 RL 파인튜닝 이후 버전(Qwen-Image-RL)의 점수다.** 베이스 Qwen-Image는 0.87이며, 이 둘을 같은 모델처럼 인용하면 안 된다.',
 '**ChineseWord는 Qwen팀이 자체 제안한 벤치마크다.** 제3자 벤치마크와 같은 무게로 인용하지 말고, "우리가 제안한 벤치마크에서 우리가 1위"라는 맥락을 함께 적어야 한다.',
 '**"SOTA"는 GenEval·ChineseWord 등 명시된 벤치마크에 한정된 주장이다.** 상용 폐쇄형 모델(GPT Image 1, Seedream 3.0 등)과 비교한 표의 범위를 벗어나 일반화하지 않는다.'
],

figures:[
 {f:'fig6-architecture.png',
  cap:'아래에서 위로: VAE Encoder가 원본 이미지를, Qwen2.5-VL(동결)이 system/user 프롬프트를 각각 인코딩한다. 노이즈와 VAE latent가 더해진 뒤 Patchify를 거쳐, 텍스트 조건과 함께 MMDiT Block을 N번 통과하고 UnPatchify로 출력 이미지를 만든다.',
  src:'원문 Figure 6, p.7'}
],

quotes:[
 {t:'Our evaluation reveals that even state-of-the-art commercial models such as GPT Image 1 and Seedream 3.0 struggle when faced with tasks requiring multi-line text rendering, non-alphabetic languages rendering (e.g., Chinese), localized text insertions, or seamless integration of text and visual elements.',
  src:'Section 1, p.6'}
],

links:[
 {t:'arXiv 2508.02324 — Qwen-Image Technical Report', u:'https://arxiv.org/abs/2508.02324'},
 {t:'GitHub — QwenLM/Qwen-Image', u:'https://github.com/QwenLM/Qwen-Image'}
]
});
