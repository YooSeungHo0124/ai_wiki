WIKI.paper({
slug:'kimi-vl',
venue:'arXiv 2025 (Moonshot AI)',
authors:'Kimi Team (Moonshot AI)',
arxiv:'2504.07491',

tldr:'전체 16B 파라미터 중 **언어 디코더 활성 파라미터가 2.8B**뿐인 MoE 비전-언어 모델. 네이티브 해상도 인코더 MoonViT와 128K 컨텍스트로, 훨씬 큰 활성 파라미터를 쓰는 모델들과 효율 대비 경쟁력 있는 성능을 낸다.',

context:'2024년 후반 오픈소스 VLM은 GPT-4o-mini급 성능을 내려면 보통 dense 7B~12B 언어 모델을 통째로 활성화해야 했다. 추론 비용은 활성 파라미터 수에 비례하므로, 같은 성능을 더 적은 활성 파라미터로 내는 것이 실질적인 배포 비용을 결정한다. 동시에 기존 VLM 다수는 이미지를 고정 크기 타일로 잘라 붙이는 방식(LLaVA-OneVision류)을 썼는데, 이는 UI 스크린샷처럼 세로로 긴 이미지나 작은 텍스트가 있는 이미지에서 정보 손실을 일으킨다. Kimi-VL은 "MoE로 활성 파라미터를 줄이면서, 해상도는 타일링 없이 네이티브로 처리한다"는 두 축을 동시에 공략한다.',

ideas:[
 {h:'MoE 언어 디코더: 16B 중 2.8B만 활성화',
  lead:'Moonlight MoE를 언어 디코더로 써서 전체 16B 중 2.8B만 토큰마다 활성화한다.',
  d:'언어 모델은 자체 개발한 [Moonlight](#/p/moe-shazeer) MoE([DeepSeek-V3](#/p/deepseek-v3)와 유사한 구조)로, 총 16B 파라미터 중 토큰당 2.8B만 활성화된다. 순수 텍스트 5.2T 토큰으로 사전학습된 중간 체크포인트에서 초기화해, 텍스트 능력을 잃지 않은 채로 멀티모달 학습을 이어간다.'},
 {h:'MoonViT: 타일링 없는 네이티브 해상도 인코더',
  lead:'NaViT 방식으로 이미지를 패치→1D 시퀀스로 펴서 가변 해상도를 그대로 처리한다.',
  d:'이미지를 정해진 타일 크기로 자르는 대신, [NaViT](#/p/vit)의 패킹 방식을 가져와 이미지를 패치로 나누고 평평하게 편 뒤 1D 시퀀스로 이어붙인다. 이 덕분에 [FlashAttention](#/p/flashattention)의 가변 길이 attention을 그대로 재사용해 해상도가 달라도 학습 처리량이 떨어지지 않는다. [SigLIP](#/p/siglip)-SO-400M에서 초기화하고, 원래의 고정 크기 절대 위치 임베딩에 2D RoPE를 더해 고해상도에서도 위치 정보를 세밀하게 표현한다.'},
 {h:'CoCa 스타일 ViT 사전학습',
  lead:'대조 손실과 캡션 생성 손실을 합쳐 작은 언어 디코더로 ViT를 먼저 학습시킨다.',
  d:'MoonViT는 SigLIP 대조 손실 $L_{siglip}$ 과, 작은 언어 디코더로 캡션을 생성하는 교차엔트로피 손실 $L_{caption}$ 을 합친 CoCa 방식으로 먼저 2.0T→0.1T 토큰 단계로 학습된다. 이후 실제 MoE 언어 모델에 정렬시키는 0.1T 토큰 단계를 거쳐 본 학습에 투입된다.'},
 {h:'4단계 사전학습으로 128K 컨텍스트까지 확장',
  lead:'Joint pre-training → cooldown → long-context 3단계로 언어 능력을 유지하며 멀티모달·긴 문맥을 확장한다.',
  d:'텍스트 전용 5.2T 사전학습 이후, (1) 최대 40% 멀티모달 비율의 joint pre-training 1.4T 토큰, (2) 고품질 텍스트·멀티모달 혼합의 joint cooldown 0.6T 토큰, (3) RoPE base를 50,000→800,000으로 올려 긴 텍스트·비디오·문서를 학습하는 joint long-context 0.3T 토큰, 총 4.4T 토큰을 거쳐 128K 컨텍스트에 도달한다. 모든 단계가 언어 모델도 함께 갱신하는 joint 학습이라 텍스트 능력이 깎이지 않는다.'},
 {h:'Muon 옵티마이저의 분산 구현',
  lead:'weight decay를 더한 개선 Muon을 ZeRO-1 방식으로 분산 구현해 통신 오버헤드를 줄인다.',
  d:'원래 Muon 옵티마이저에 weight decay를 추가하고 파라미터별 업데이트 스케일을 조정한 개선판을 ViT·프로젝터·언어 모델 전체에 일관되게 적용한다. ZeRO-1 방식의 분산 구현으로 메모리 효율과 통신 비용을 함께 잡았다.'}
],

diagram:{type:'flow', cap:'이미지·비디오·UI스크린샷을 MoonViT가 네이티브 해상도로 인코딩하고, MoE 언어 디코더가 토큰당 일부 expert만 활성화해 응답을 생성한다.',
 nodes:[
  {t:'가변 해상도 입력', s:'이미지·비디오·UI'},
  {t:'MoonViT', s:'패치→1D 패킹', acc:true},
  {t:'MLP 프로젝터', s:'pixel shuffle 2x'},
  {t:'MoE 디코더', s:'16B 중 2.8B 활성', acc:true, a:'라우팅'},
  {t:'응답', s:'128K 컨텍스트'}
 ]},

math:[
 {expr:'L = L_siglip + L_caption',
  tex:'\\mathcal{L} = \\mathcal{L}_{\\text{siglip}} + \\mathcal{L}_{\\text{caption}}',
  d:'MoonViT 단독 사전학습 손실. 대조 손실(SigLIP)과 캡션 생성 교차엔트로피를 더한 CoCa 방식으로, 이미지-텍스트 정합과 언어 생성 능력을 동시에 ViT에 심는다.'}
],

numbers:[
 {k:'활성/전체 파라미터', v:'2.8B / 16B', d:'§Abstract — Kimi-VL-A3B, 언어 디코더 MoE 기준'},
 {k:'사전학습 총 토큰', v:'4.4T (텍스트 5.2T 별도)', d:'Figure 4 — ViT 학습 2.0T~0.1T 포함 언어모델과의 joint 단계 총합'},
 {k:'컨텍스트 윈도우', v:'128K', d:'RoPE base 50,000→800,000로 확장, LongVideoBench 64.5 / MMLongBench-Doc 35.1'},
 {k:'MMMU (validation)', v:'57.0%', d:'§4.1.1 — DeepSeek-VL2(51.1%)보다 높고 [Qwen2.5-VL](#/p/qwen25-vl)-7B(58.6%)와 비슷, 활성 파라미터는 더 적음'},
 {k:'MoonViT 해상도 확장', v:'최대 320만 픽셀', d:'Kimi-VL-A3B-Thinking-2506에서 추가 학습으로 기존 대비 4배 확장'},
 {k:'InfoVQA / ScreenSpot-Pro', v:'83.2 / 34.5', d:'Abstract — 고해상도 OCR·UI grounding 벤치마크'}
],

impact:'"활성 파라미터를 줄이면서 해상도는 타협하지 않는다"는 조합으로, 오픈소스 VLM에서 추론 비용과 성능을 분리해 최적화할 수 있음을 보였다. NaViT 패킹 기반 네이티브 해상도 인코더와 MoE 언어 디코더의 결합은 이후 경량 VLM 설계의 참조 구조가 되었고, Kimi-VL-Thinking으로 이어지며 소형 모델의 long-CoT 추론 가능성도 함께 보여줬다.',

legacy:[
 '**MoE + 네이티브 해상도의 결합** — 활성 파라미터를 줄이는 MoE와 타일링 없는 비전 인코더를 함께 쓰는 설계가 이후 경량 VLM에 참조됨',
 '**Kimi-VL-Thinking-2506로 계승** — 같은 아키텍처에 long-CoT SFT·RL을 얹어 약 3B 활성 파라미터로 MMMU 64.0 등 추론 벤치마크를 끌어올림',
 '**활성 파라미터 대비 성능 비교의 표준화** — "몇 B 활성"으로 VLM을 비교하는 관행이 이 계열 보고서 이후 더 명시적으로 자리잡음'
],

pitfalls:[
 '**"2.8B 모델"이라는 표현은 전체 크기가 아니라 활성 파라미터다.** 총 파라미터는 16B이고, MoE 라우팅 오버헤드·메모리 사용량은 활성 파라미터만으로 설명되지 않는다.',
 '**Kimi-VL과 Kimi-VL-Thinking을 혼동하지 말 것.** 기본 Kimi-VL은 long-CoT SFT·RL을 거치지 않은 버전이고, MMMU 64.0·MathVision 56.9 같은 추론 벤치마크 수치는 Thinking-2506 버전의 결과다.',
 '**MoonViT의 4배 해상도 확장(320만 픽셀)은 기본 모델이 아니라 Thinking-2506에서 추가 학습된 결과다.** 기본 Kimi-VL의 해상도 한계와 혼동하지 않는다.'
],

figures:[
 {f:'fig3-architecture.png',
  cap:'왼쪽 아래 네 종류 입력(작은 이미지·긴 비디오·세밀한 사진·UI 스크린샷)이 해상도 그대로 MoonViT에 들어간다. MoonViT 출력은 MLP Projector를 거쳐 MoE 언어 디코더로 들어가고, 디코더 내부(확대 상자)에서 Router가 입력마다 일부 expert(붉은 테두리)만 선택해 활성화한다.',
  src:'원문 Figure 3, p.3'}
],

quotes:[
 {t:'We present Kimi-VL, an efficient open-source Mixture-of-Experts (MoE) vision-language model (VLM) that offers advanced multimodal reasoning, long-context understanding, and strong agent capabilities—all while activating only 2.8B parameters in its language decoder.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2504.07491 — Kimi-VL Technical Report', u:'https://arxiv.org/abs/2504.07491'},
 {t:'GitHub — MoonshotAI/Kimi-VL', u:'https://github.com/MoonshotAI/Kimi-VL'}
]
});
