WIKI.paper({
slug:'internvl3',
venue:'arXiv 2025 (Shanghai AI Laboratory)',
authors:'Zhu, Wang, Chen, Liu, Ye et al. (Shanghai AI Laboratory · SenseTime · Tsinghua · CUHK)',
arxiv:'2504.10479',

tldr:'"텍스트 전용 LLM을 먼저 만들고 시각 어댑터를 나중에 붙이는" 기존 방식 대신, 언어와 멀티모달 데이터를 **처음부터 한 사전학습 단계에서 함께** 학습시키는 네이티브 멀티모달 사전학습을 쓴다. 가변 시각 위치 인코딩(V2PE)과 개선된 후처리를 더해 InternVL3-78B가 오픈소스 MLLM 중 MMMU 72.2점으로 새 기준을 세웠다.',

context:'대부분의 MLLM은 "언어 사전학습 → 언어 후처리 → 시각 모듈을 붙여 재정렬"이라는 사후 적응(post-hoc adaptation) 파이프라인을 쓴다. 이 방식은 텍스트 전용 LLM이 이미 텍스트 분포에만 맞춰 최적화된 뒤에 시각 정보를 끼워 넣는 것이라, 모달리티 간 정렬에 별도의 공학(특정 도메인용 보조 데이터, 파라미터 동결, 다단계 파인튜닝 스케줄)이 필요하고 그 과정에서 언어 능력이 손상되기 쉽다. InternVL3는 이 순서 자체를 바꿔, 언어 코퍼스와 멀티모달 데이터를 사전학습 단계부터 함께 노출시키면 이 정렬 문제를 근본적으로 줄일 수 있는지를 검증한다.',

ideas:[
 {h:'네이티브 멀티모달 사전학습: 언어와 정렬을 한 단계로',
  lead:'텍스트 전용 사전학습 뒤에 멀티모달 정렬을 얹는 대신, 처음부터 텍스트·이미지-텍스트·비디오-텍스트를 함께 섞어 학습한다.',
  d:'기존 방식처럼 텍스트 전용 언어모델을 먼저 완성하고 시각 인코더를 나중에 붙여 재정렬하는 대신, 사전학습 단계에서부터 순수 텍스트 코퍼스와 이미지-텍스트·비디오-텍스트·interleaved 이미지-텍스트 시퀀스를 함께 노출시킨다. 이렇게 하면 모델이 언어 능력과 멀티모달 능력을 같은 단계에서 통합적으로 습득해, 별도의 정렬 단계에서 생기는 복잡도와 정렬 문제를 줄인다.'},
 {h:'ViT-MLP-LLM 골격은 유지하되 가중치는 사전학습된 것으로 초기화',
  lead:'InternViT(300M/6B)와 [Qwen2.5](#/p/qwen25)·InternLM3 계열 LLM을 사전학습된 가중치로 초기화해 계산 비용을 줄인다.',
  d:'네이티브 사전학습이 원칙적으로는 처음부터 학습도 가능하게 하지만, 실제로는 ViT(InternViT-300M 또는 6B)와 LLM([Qwen2.5](#/p/qwen25) 계열 또는 InternLM3-8B, 단 instruction-tuned 버전이 아닌 base 모델)을 사전학습된 가중치로 초기화해 계산 비용을 줄인다. MLP 커넥터만 무작위 초기화한다. 고해상도 처리를 위해 pixel unshuffle로 시각 토큰 수를 1/4로 줄여, 448×448 타일 하나를 256개 시각 토큰으로 표현한다.'},
 {h:'V2PE: 시각 토큰에는 더 작은 위치 증가폭을 준다',
  lead:'텍스트 토큰은 위치가 1씩 늘지만 시각 토큰은 δ<1만큼만 늘려, 같은 문맥 길이로 더 많은 시각 토큰을 담는다.',
  d:'표준 위치 인코딩은 토큰마다 균일하게 위치 인덱스를 1씩 증가시키는데, 시각 토큰이 텍스트보다 훨씬 많은 멀티모달 입력에서는 이것이 문맥 길이를 빠르게 소진시킨다. Variable Visual Position Encoding(V2PE)은 텍스트 토큰에는 증가폭 1을, 시각 토큰에는 $\\delta<1$(학습 중 $\\{1,\\tfrac12,\\tfrac14,\\dots,\\tfrac1{256}\\}$ 중 무작위 선택)을 적용해, 한 이미지 내에서는 $\\delta$를 고정한 채 상대적 위치 관계는 보존하면서 긴 멀티모달 문맥을 더 효율적으로 담는다. $\\delta=1$이면 InternVL2.5의 기존 방식으로 되돌아간다.'},
 {h:'SFT 다음에 MPO로 사고 과정의 분포 이탈을 보정한다',
  lead:'학습 때는 정답 토큰을 보고 다음 토큰을 맞히지만 추론 때는 자기 출력을 봐야 하는 불일치를, 선호쌍 학습으로 줄인다.',
  d:'SFT는 이전 정답 토큰을 조건으로 다음 토큰을 예측하도록 학습하지만, 실제 추론에서는 모델이 자신이 만든 이전 토큰을 조건으로 삼아야 해서 분포 차이(distribution shift)가 생기고 이는 특히 사고사슬(CoT) 추론을 해친다. Mixed Preference Optimization(MPO)은 DPO 기반 선호 손실, 절대 품질을 학습하는 BCO 기반 품질 손실, 생성 손실 세 가지를 가중합해 채택·기각 응답 쌍으로 추가 학습시켜 이 이탈을 줄인다.'},
 {h:'테스트타임 스케일링과 인프라 최적화를 함께',
  lead:'추론 시점에 더 많은 연산을 쓰는 전략과 학습 인프라 개선을 결합해 효율과 성능을 동시에 높인다.',
  d:'SFT·MPO 후처리에 더해 테스트타임 스케일링 전략과 최적화된 학습 인프라를 결합한다. SFT 데이터는 InternVL2.5의 1630만 샘플에서 도구 사용·3D 장면 이해·GUI 조작·과학 도표·창작 등을 더해 2170만 샘플로 늘었고, MPO 데이터는 약 30만 개 선호쌍을 8B/38B/78B의 SFT 버전으로 생성한 rollout에서 구성한다.'}
],

diagram:{type:'compare', cap:'기존 사후 적응 파이프라인과 InternVL3의 네이티브 멀티모달 사전학습 대비.',
 left:{t:'기존: 사후 적응', items:['텍스트 전용 LLM 먼저 완성','시각 모듈을 나중에 붙여 정렬','보조 데이터·동결·다단계 필요']},
 right:{t:'InternVL3: 네이티브', items:['텍스트+멀티모달을 한 단계에 학습','V2PE로 긴 시각 문맥 지원','SFT 뒤 MPO로 CoT 이탈 보정']}
},

math:[
 {expr:'p_i = p_{i-1} + 1 (텍스트 토큰) 또는 p_{i-1} + δ (시각 토큰), δ<1',
  tex:'p_i = p_{i-1} + \\begin{cases} 1, & x_i\\ \\text{텍스트}\\\\ \\delta, & x_i\\ \\text{시각},\\ \\delta<1 \\end{cases}',
  d:'V2PE의 위치 인덱스 갱신 규칙. 시각 토큰마다 증가폭을 줄여, 같은 위치 범위 안에 더 많은 시각 토큰을 담을 수 있게 한다.'},
 {expr:'L = w_p L_p + w_q L_q + w_g L_g',
  tex:'\\mathcal{L}=w_p\\mathcal{L}_p+w_q\\mathcal{L}_q+w_g\\mathcal{L}_g',
  d:'MPO의 전체 손실. DPO 기반 선호 손실 $L_p$, BCO 기반 절대 품질 손실 $L_q$, 표준 언어모델링 생성 손실 $L_g$의 가중합이다.'}
],

numbers:[
 {k:'MMMU (78B)', v:'72.2%', d:'오픈소스 MLLM 중 최고로 보고. InternVL2.5(78B) 대비 +2.1%p'},
 {k:'MathVista (78B)', v:'79.6%', d:'InternVL2.5 대비 +7.3%p, 폐쇄형 모델 GPT-4o(71.6%)·Claude-3.5(65.1%) 상회'},
 {k:'OCRBench (78B)', v:'906', d:'InternVL2.5 대비 +52'},
 {k:'모델 라인업', v:'0.9B~78.4B, 7종', d:'InternViT-300M/6B + Qwen2.5 계열 또는 InternLM3-8B'},
 {k:'SFT 데이터 규모', v:'2170만 샘플', d:'InternVL2.5의 1630만에서 확장'}
],

impact:'"먼저 언어, 나중에 시각"이라는 MLLM 구축의 기본 순서 자체에 의문을 제기하고, 사전학습 단계부터 통합하는 대안이 실제로 작동함을 78B 규모까지 검증했다. MMMU 72.2점은 GPT-4o(72.9)·Gemini-2.5-Pro(74.7) 같은 폐쇄형 모델에 근접한 수준으로 보고되어, 오픈소스 MLLM이 학습 파이프라인 설계만으로도 격차를 좁힐 수 있음을 보여준 사례로 인용된다. V2PE는 이후 시각 토큰이 많은 멀티모달 모델들의 위치 인코딩 설계에 참고점을 제공한다.',

legacy:[
 '**[Qwen3-VL](#/p/qwen3-vl) 등과의 경쟁·비교축** — 오픈소스 MLLM 최상위권 자리를 두고 InternVL·Qwen-VL 계열이 서로를 baseline으로 반복 인용',
 '**네이티브 멀티모달 사전학습이라는 대안 패러다임의 실증** — 사후 적응 방식이 지배적이던 MLLM 구축 순서에 구체적 대안을 78B 규모까지 보임',
 '**V2PE의 위치 인코딩 설계 참고 사례화** — 시각 토큰이 텍스트보다 훨씬 많은 상황에서의 위치 증가폭 조정이 후속 장문맥 멀티모달 모델에 참고점 제공'
],

pitfalls:[
 '**논문 제목은 "Native Multimodal Pre-Training"이 아니다.** 원제는 "InternVL3: Exploring Advanced Training and Test-Time Recipes for Open-Source Multimodal Models"이며, 네이티브 멀티모달 사전학습은 그 안의 핵심 기법 중 하나다.',
 '**"네이티브 사전학습"이 "처음부터 학습"을 뜻하지 않는다.** 실제로는 ViT·LLM 모두 사전학습된 가중치로 초기화하고 MLP 커넥터만 무작위 초기화한다 — 완전한 from-scratch 학습이 아니다.',
 '**OpenCompass 점수는 저자들의 로컬 테스트 결과다.** 표 1의 점수는 논문이 자체 측정한 값이라고 명시되어 있어, 공식 리더보드 수치와 재현 조건이 다를 수 있다.'
],

quotes:[
 {t:'We introduce a native multimodal pre-training approach that consolidates language pre-training and multi-modal alignment training into a single pre-training stage.',
  src:'Section 2.2, p.4'},
 {t:'InternVL3-78B achieves a score of 72.2 on the MMMU benchmark, setting a new state-of-the-art among open-source MLLMs.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2504.10479 — InternVL3', u:'https://arxiv.org/abs/2504.10479'},
 {t:'OpenGVLab/InternVL (공식 구현)', u:'https://github.com/OpenGVLab/InternVL'}
]
});
