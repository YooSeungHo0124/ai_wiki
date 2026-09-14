WIKI.paper({
slug:'bagel',
venue:'arXiv 2025 (ByteDance Seed)',
authors:'Deng, Zhu, Li et al. (ByteDance Seed)',
arxiv:'2505.14683',

tldr:'이해와 생성을 **병목 없이 공유된 self-attention**으로 한 트랜스포머에 통합한 오픈소스 모델. 대규모 인터리브 멀티모달 데이터로 스케일을 키우자 자유형 이미지 편집·미래 프레임 예측 같은 능력이 사전학습 후반에야 나타나는 것을 학습 토큰 수 대비 곡선으로 직접 측정했다.',

context:'GPT-4o·Gemini 2.0 같은 폐쇄형 시스템은 이해와 생성을 한 모델에서 자연스럽게 오가지만, 그 방식은 공개되지 않았다. 오픈소스 통합 모델 다수는 두 갈래로 절충했다 — (1) 이산 토크나이저로 이미지를 텍스트처럼 다음 토큰 예측하는 방식은 생성 품질이 diffusion보다 떨어지고, (2) LLM이 만든 소수의 latent 토큰을 외부 diffusion 모듈에 넘기는 방식은 그 latent가 **병목**이 되어 긴 문맥의 멀티모달 추론에서 정보 손실이 생긴다. BAGEL은 두 절충 모두를 버리고, 학습 비용이 더 들더라도 모든 트랜스포머 블록에서 이해·생성 토큰이 같은 self-attention을 공유하는 구조를 택해 이 병목을 아예 없앤다.',

ideas:[
 {h:'Mixture-of-Transformer-Experts: 두 expert가 attention을 공유',
  lead:'이해용·생성용 두 트랜스포머 expert가 QKV·FFN은 따로 두되 self-attention은 함께 계산한다.',
  d:'텍스트와 언더스탠딩 인코더 출력은 Und. Expert가, 생성 인코더 출력은 Gen. Expert가 각자의 QKV·FFN으로 처리하지만, 모든 토큰이 **하나의 multi-modal self-attention**을 통과한다. 이 덕분에 별도의 어댑터나 latent 병목 없이 이해와 생성이 같은 문맥을 직접 주고받는다. 언더스탠딩 출력은 next-token prediction으로, 생성 출력은 velocity prediction([flow matching](#/p/flow-matching))으로 학습된다.'},
 {h:'두 개의 비전 인코더: 의미용과 픽셀용을 분리',
  lead:'이해에는 의미 특징(ViT)을, 생성에는 저수준 픽셀 정보(VAE)를 따로 인코딩해 넣는다.',
  d:'이해 과제는 이미지의 의미적 내용이 중요하고 생성/편집 과제는 픽셀 단위 정보가 보존돼야 하므로, Und Encoder(ViT 계열)와 Gen Encoder(VAE)를 별도로 둔다. 편집 과제에서 ViT 토큰을 제거하면 GEdit-Bench는 거의 영향이 없지만 IntelligentBench(복합 추론 편집)는 16% 떨어져, 의미 정보가 복잡한 편집 추론에만 특히 중요함을 보였다.'},
 {h:'스케일에 따라 순서대로 나타나는 능력',
  lead:'학습 토큰 수 대비 성능 곡선에서 이해→생성→기본 편집→지능형 편집 순으로 늦게 포화한다.',
  d:'사전학습 토큰 수를 0T~5T대까지 늘려가며 여섯 개 이해 벤치마크 평균, GenEval, GEdit-Bench, 그리고 자체 IntelligentBench를 계속 측정했다(Figure 7). 각 태스크가 **피크 성능의 85%**에 도달하는 데 필요한 토큰 수를 지표로 삼아, 이해는 0.18T, 생성은 0.68T, 고전적 이미지 편집은 2.64T, 복합 추론이 필요한 지능형 편집은 3.61T가 걸린다는 것을 직접 측정했다. 이것이 "스케일에 따라 나타나는 능력"의 원문 근거다.'},
 {h:'IntelligentBench: 자유형 편집을 재는 새 벤치마크',
  lead:'질문 이미지·텍스트·정답 이미지 350개를 GPT-4o가 채점해 편집의 추론 깊이를 잰다.',
  d:'기존 GEdit-Bench는 단순 편집 지시(객체 교체·배경 변경)를 측정하지만, "이 그림에서 물리적으로 말이 안 되는 부분을 고쳐라" 같은 **세계 지식이 필요한 편집**은 구분하지 못한다. IntelligentBench는 GPT-4o(2024-11-20)가 질문 이미지·질문·정답 이미지·모델 생성 이미지 네 개를 함께 보고 요청 충족도·시각적 일관성·지식 기반 창의성을 0~2점으로 채점해 100점 만점으로 정규화한다.'},
 {h:'미래 프레임 예측·월드 내비게이션도 같은 체계로',
  lead:'비디오 데이터로 학습해 미래 프레임 예측·3D 조작·월드 내비게이션 같은 정성적 능력도 관찰한다.',
  d:'인터리브 학습 데이터에 비디오·웹 데이터를 포함시킨 결과, 정량 벤치마크에 없는 미래 프레임 예측·다시점 합성·월드 내비게이션 같은 태스크에서도 정성적으로 그럴듯한 출력을 낸다고 보고한다. 다만 이 부분은 Figure 7처럼 토큰 수 대비 곡선으로 정량화되지 않고 Figure 14의 사례 시연으로만 제시된다.'}
],

diagram:{type:'split', cap:'모든 토큰이 공유된 self-attention을 통과하되, FFN·QKV는 이해(Und.)와 생성(Gen.) expert로 갈라진다.',
 from:{t:'멀티모달 토큰', s:'텍스트+이미지+비디오'},
 branches:[
  {t:'Und. Expert', s:'next-token 예측'},
  {t:'Gen. Expert', s:'velocity 예측', acc:true}
 ],
 join:'공유 self-attention'},

math:[
 {expr:'Gen. Expert objective: velocity prediction (flow matching)',
  tex:'\\mathcal{L}_{\\text{gen}} = \\mathbb{E}\\left[\\lVert v_\\theta(x_t, t, c) - (x_1 - x_0) \\rVert^2\\right]',
  d:'생성 expert는 [flow matching](#/p/flow-matching) 방식으로 velocity를 예측하도록 학습된다. 언더스탠딩 expert의 next-token 교차엔트로피와는 손실 형태 자체가 다르지만, 같은 self-attention 문맥을 공유한다.'}
],

numbers:[
 {k:'파라미터', v:'7B 활성 / 14B 전체', d:'§1 — MoT 구조로 이해·생성 expert를 합친 총합'},
 {k:'IntelligentBench', v:'44.9', d:'Table 8 — 오픈소스 Step1X-Edit 대비 +30, GPT-4o 318/350·Gemini 2.0 349/350만 응답'},
 {k:'이해 능력 85% 도달', v:'0.18T 토큰', d:'Figure 7(a) — MME-S·MMBench·MMMU·MMVet·MathVista·MMVP 평균'},
 {k:'생성 능력 85% 도달', v:'0.68T 토큰', d:'Figure 7(b) — GenEval 기준'},
 {k:'고전 이미지 편집 85% 도달', v:'2.64T 토큰', d:'Figure 7(c) — GEdit-Bench Overall Score, VAE+ViT 기준'},
 {k:'지능형 편집 85% 도달', v:'3.61T 토큰', d:'Figure 7(d) — IntelligentBench, 3T 토큰 이후 점수가 15→45로 3배 상승'},
 {k:'ViT 토큰 제거 영향', v:'GEdit 거의 무영향 / IntelligentBench −16%', d:'§7.3 — 의미 정보가 복합 추론 편집에만 특히 중요함을 보이는 ablation'}
],

impact:'이해·생성 사이의 병목을 없앤 통합 아키텍처가 실제로 대규모 인터리브 데이터에서 확장 가능함을 보였고, 무엇보다 "스케일에 따라 어떤 능력이 언제 나타나는가"를 토큰 수 대비 성능 곡선으로 직접 측정해 정량화했다. IntelligentBench는 이후 통합 모델의 자유형 편집·추론 능력을 재는 참조 벤치마크로 쓰이기 시작했고, 코드·체크포인트 공개로 이해+생성 통합 모델 연구의 재현 가능한 기준선이 되었다.',

legacy:[
 '**병목 없는 공유 attention 설계의 확산** — latent 어댑터로 잇는 방식 대신 self-attention을 직접 공유하는 통합 아키텍처가 이후 연구의 선택지로 자리잡음',
 '**IntelligentBench의 채택** — 자유형·지식 기반 편집을 재는 벤치마크로 후속 통합 모델 평가에 인용됨',
 '**"창발은 후반에 온다"는 실증** — 이해·생성이 먼저 포화되고 복합 추론 편집이 가장 늦게(3T+ 토큰) 나타난다는 관찰이, 통합 모델 학습 예산을 어디에 쓸지에 대한 참조 데이터가 됨',
 '[Janus-Pro](#/p/janus-pro)·[Chameleon](#/p/chameleon) 계열과 함께 이해+생성 통합 모델의 아키텍처 스펙트럼(병목형 vs 병목없음)을 비교하는 기준점 제공'
],

pitfalls:[
 '**"창발"은 벤치마크 점수 곡선의 관찰이지, 급격한 상전이를 수학적으로 증명한 것은 아니다.** Figure 7의 곡선은 완만하게 이어지는 개선이며, 저자들도 이를 [Emergent Abilities](#/p/emergent) 논문의 패턴과 "유사(akin to)"하다고만 표현한다.',
 '**미래 프레임 예측·월드 내비게이션·3D 조작은 정량 벤치마크가 아니라 정성적 사례(Figure 14)로만 제시된다.** Figure 7 같은 토큰 수 대비 정량 곡선이 이 능력들에는 없다 — 수치로 인용하면 안 된다.',
 '**IntelligentBench는 BAGEL 저자들이 자체 제안한 벤치마크다.** 350개 예시의 초기 릴리스 버전이고 GPT-4o를 채점자로 쓰므로, 제3자 벤치마크와 같은 무게로 인용하지 않는다.'
],

figures:[
 {f:'fig2-architecture.png',
  cap:'왼쪽(초록) 언더스탠딩 경로: Text Tokenizer + Und Encoder → Und. Expert → next-token 예측. 오른쪽(보라) 생성 경로: Gen Encoder → Gen. Expert → velocity 예측. 가운데 "Multi-modal Self Attention" 한 줄이 두 expert를 관통한다 — 이 한 줄이 병목 없는 통합의 핵심.',
  src:'원문 Figure 2, p.4'},
 {f:'fig7-emerging.png',
  cap:'네 그래프 모두 x축이 학습 토큰 수(T), 세모 표시가 "피크 성능의 85%" 도달 지점. (a)이해 0.18T → (b)생성 0.68T → (c)고전 편집 2.64T → (d)지능형 편집 3.61T 순으로 점점 늦게 포화한다. (d)는 3T 근처에서 점수가 15에서 45로 뛰는 것이 눈에 띈다.',
  src:'원문 Figure 7, p.13'}
],

quotes:[
 {t:'We argue that unified models have the capacity to learn richer multi-modal capabilities from large-scale interleaved multi-modal data—emergent abilities that are not captured by traditional benchmarks.',
  src:'Section 2.1, p.4'}
],

links:[
 {t:'arXiv 2505.14683 — Emerging Properties in Unified Multimodal Pretraining', u:'https://arxiv.org/abs/2505.14683'},
 {t:'Project Page — bagel-ai.org', u:'https://bagel-ai.org/'}
]
});
