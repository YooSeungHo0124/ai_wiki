WIKI.paper({
slug:'ul2',
venue:'ICLR 2023 (arXiv 2022)',
authors:'Tay, Dehghani et al. (Google Brain)',
arxiv:'2205.05131',

tldr:'"어떤 사전학습 목적함수와 아키텍처를 써야 하는가"라는 질문에 "다 섞어라"로 답한 논문. [T5](#/p/t5)식 span corruption, prefix-LM, GPT식 언어모델링을 **R·S·X 세 종류의 denoiser로 재분류하고 한 모델 안에서 섞어 학습**하는 Mixture-of-Denoisers(MoD)를 제안했다.',

context:'2022년 무렵 사전학습 방식은 이미 갈라져 있었다 — encoder-only([BERT](#/p/bert)), decoder-only(GPT류), encoder-decoder([T5](#/p/t5)), 목적함수도 마스크 예측·span corruption·다음 토큰 예측으로 제각각이었다. 그런데 각 선택은 결국 특정 다운스트림 과제에서만 강하고 다른 과제에서는 약했다 — span corruption 모델은 판별 과제에 강하지만 개방형 생성엔 약하고, GPT류는 그 반대였다. 이 논문은 "왜 과제에 따라 모델을 골라야 하는가"를 되물으며, **아키텍처 선택과 사전학습 목적함수 선택은 별개 축**이라는 관찰에서 출발한다.',

ideas:[
 {h:'세 denoiser로 재분류: R·S·X',
  lead:'기존에 흩어져 있던 목적함수들을 손상 강도 기준으로 R(약함)·S(순차)·X(극단) 세 범주로 정리한다.',
  d:'**R-denoiser**는 [T5](#/p/t5)의 표준 span corruption(평균 길이 3~8토큰, 손상률 15%) 그대로다. **S-denoiser**는 입력을 앞뒤로 쪼개 뒤쪽만 생성하게 하는 prefix-LM 방식으로, 극단적으로 자르면 GPT식 인과적 언어모델링과 같아진다. **X-denoiser**는 손상률 50%까지 가는 극단적 손상으로, 적은 정보에서 긴 타깃을 생성하는 능력을 훈련한다. 세 범주 모두 "input-to-target" 형식으로 통일해서 표현할 수 있다는 것이 이 논문의 통합 관점이다.'},
 {h:'Mixture-of-Denoisers: 일곱 개 denoiser를 섞어 학습',
  lead:'R·S·X 각각을 하이퍼파라미터를 바꿔 총 7개로 늘려 한 배치 안에서 균등하게 섞는다.',
  d:'R은 평균 span 길이 3과 8, X는 길이·손상률 조합 4가지, S는 1가지로 총 7개 설정을 만들어 거의 동일한 비율로 섞는다. 저자들은 개별 denoiser 하나만 쓰면 성능이 떨어진다는 것을 확인했다 — 예를 들어 원 [T5](#/p/t5) 논문이 시도했던 50% 손상률(X-denoiser에 해당) 단독 학습은 잘 작동하지 않았다. **섞는 것 자체가 핵심**이라는 주장이다.'},
 {h:'Mode switching: 프롬프트 토큰으로 전환',
  lead:'`[R]`,`[S]`,`[X]` 토큰을 입력 맨 앞에 붙여 학습 때 쓴 모드를 미세조정·추론에서도 지정한다.',
  d:'사전학습 때 각 예제 앞에 자신이 어떤 denoiser로 만들어졌는지 알리는 패러다임 토큰을 붙인다. 미세조정·zero/few-shot 추론 때도 같은 토큰을 붙여 "지금 어떤 모드로 풀길 원하는지"를 모델에 알린다 — 판별 과제는 `[R]`, 개방형 생성은 `[S]`처럼. 이 토큰 하나가 다운스트림 행동을 사전학습 때의 특정 목적함수와 다시 연결하는 스위치 역할을 한다.'},
 {h:'아키텍처와 목적함수의 분리',
  lead:'decoder-only냐 encoder-decoder냐는 효율성 문제일 뿐, MoD는 둘 다에 적용 가능하다고 주장한다.',
  d:'저자들은 "encoder-only vs decoder-only" 논쟁이 실은 목적함수 선택과 뒤섞여 있었다고 본다. MoD는 decoder-only든 encoder-decoder든 동일하게 적용되는 목적함수이며, 아키텍처는 계산 효율의 문제로 따로 결정하면 된다는 것이 핵심 주장이다. 논문은 실제로 UL2 decoder와 UL2 encoder-decoder 둘 다 학습해 비교한다.'},
 {h:'20B로 스케일업해 검증',
  lead:'19.5B 파라미터 encoder-decoder로 스케일을 키워 50개 지도학습 과제에서 SOTA급 성능을 확인한다.',
  d:'MoD의 이점이 작은 스케일 ablation에서만 나타나는 우연이 아님을 보이기 위해 20B(정확히는 19.5B) 규모까지 키웠다. 언어 생성·이해·분류·질의응답·상식추론·긴 문맥 추론·구조화 지식·정보검색을 아우르는 50개 과제에서 검증했고, zero-shot SuperGLUE에서 175B [GPT-3](#/p/gpt3)를 능가했다고 보고한다.'}
],

diagram:{type:'split', cap:'하나의 Mixture-of-Denoisers 학습 목적이 R·S·X 세 denoiser로 갈라지고, 각각이 다시 학습·과제 유형과 연결된다.',
 from:{t:'사전학습 목적', s:'input-to-target'},
 branches:[
  {t:'R-denoiser', s:'짧은 span·저손상'},
  {t:'S-denoiser', s:'prefix-LM'},
  {t:'X-denoiser', s:'긴 span·고손상'}
 ],
 join:'`[R]`/`[S]`/`[X]` 토큰으로 미세조정·추론 모드 전환'},

math:[
 {expr:'R: (μ=3, r=0.15) ∪ (μ=8, r=0.15);  S: (μ=L/4, r=0.25);  X: (μ=3,r=0.5) ∪ (μ=8,r=0.5) ∪ (μ=64,r=0.15) ∪ (μ=64,r=0.5)',
  tex:'\\begin{aligned} R &: (\\mu{=}3, r{=}0.15) \\cup (\\mu{=}8, r{=}0.15) \\\\ S &: (\\mu{=}L/4,\\, r{=}0.25) \\\\ X &: (\\mu{=}3, r{=}0.5) \\cup (\\mu{=}8, r{=}0.5) \\cup (\\mu{=}64, r{=}0.15) \\cup (\\mu{=}64, r{=}0.5) \\end{aligned}',
  d:'$\\mu$ 는 손상 구간(span)의 평균 길이, $r$ 은 손상률이다. 이 7개 설정을 거의 균등한 비율로 섞은 것이 논문이 최종적으로 쓰는 Mixture-of-Denoisers다.'}
],

numbers:[
 {k:'최종 모델 규모', v:'약 19.5B', d:'논문은 "20B"로 부르지만 정확히는 19.5B 파라미터, encoder-decoder'},
 {k:'지도학습 평가 과제 수', v:'50개', d:'언어 생성·이해·분류·QA·상식추론·장문 추론·구조화 지식·정보검색을 포괄'},
 {k:'zero-shot SuperGLUE', v:'175B GPT-3 능가', d:'논문에 보고된 GPT-3 공식 논문 수치 기준 비교'},
 {k:'1-shot 요약', v:'T5-XXL 대비 3배', d:'one-shot summarization Rouge 기준, "tripling the performance" (Abstract)'},
 {k:'MoD 목적함수 개수', v:'7개', d:'R×2, S×1, X×4 설정을 섞음 (Table 1)'},
 {k:'FLAN 미세조정 후', v:'FLAN-PaLM 62B급', d:'Flan-UL2 20B가 MMLU·Big-Bench에서 경쟁력 있는 점수 달성'}
],

impact:'UL2는 새로운 아키텍처를 제안한 것이 아니라, **이미 존재하던 목적함수들이 사실 하나의 스펙트럼 위에 있다는 것**을 보여줬다. 그 덕에 이후 사전학습 레시피 논의는 "어느 목적함수가 옳은가" 대신 "어떤 비율로 섞을 것인가"로 옮겨갔다. 공개된 Flax/T5X 체크포인트(UL2 20B, Flan-UL2 20B)는 인코더-디코더 계열에서 여전히 자주 인용되는 오픈 베이스라인으로 남았다.',

legacy:[
 '**목적함수 통합 관점**이 이후 여러 사전학습 레시피 논문에서 "우리도 여러 목적을 섞는다"는 기본값으로 자리잡음',
 '**mode token** 아이디어는 이후 태스크·모드를 프롬프트 토큰으로 지정하는 관행(system prompt·제어 토큰)과 정신적으로 연결됨',
 'Flan-UL2 20B는 [FLAN](#/p/flan) 계열 instruction tuning의 오픈 베이스 모델 중 하나로 계속 쓰임',
 '아키텍처와 목적함수를 분리해서 사고하는 방식은 이후 decoder-only가 사실상 표준이 된 뒤에도 "목적함수 믹스"라는 개념 자체는 유지됨'
],

pitfalls:[
 '**"20B"라는 이름과 달리 정확한 파라미터 수는 19.5B다.** 논문 본문이 스스로 괄호로 정정해 둔 부분이라 인용 시 주의가 필요하다.',
 '**MoD의 이득은 개별 denoiser 성능이 아니라 "섞음" 자체에서 나온다.** X-denoiser 단독은 원 T5 논문에서도 이미 잘 안 되는 것으로 보고된 설정이므로, 구성요소 하나만 떼어 재현하면 논문 결과가 안 나온다.',
 '**decoder-only 대 encoder-decoder 비교는 compute-matched이지 parameter-matched가 아니다.** Figure 1의 EncDec 모델은 Dec 모델보다 파라미터가 두 배이므로 성능 차이를 목적함수만의 효과로 해석하면 안 된다.'
],

figures:[
 {f:'fig1-pareto.png',
  cap:'x축은 1-shot 개방형 생성 성능(Rouge-L), y축은 미세조정 판별 과제 성능(SuperGLUE). 기존 방식들(T5·UniLM·PrefixLM·SpanCorrupt·GPT류)은 한쪽에 강하면 다른 쪽이 약한 트레이드오프 곡선 위에 있는데, UL2(별표)는 EncDec·Dec 두 조건 모두에서 그 곡선을 오른쪽 위로 밀어낸다.',
  src:'원문 Figure 1, p.4'},
 {f:'fig2-mod-overview.png',
  cap:'왼쪽 "Inputs-to-targets"가 decoder-only 또는 encoder-decoder 아키텍처, 가운데 노란 박스가 Mixture-of-Denoisers — X(초록)·R(파랑)·S(주황) 세 denoiser가 병렬로 섞인다. 위쪽 회색 박스들은 X-denoiser의 세부 설정(span 길이·손상률) 변형. 오른쪽은 이 목적함수가 실제로 연결되는 학습 패러다임(지도학습·in-context·zero-shot)과 과제 유형.',
  src:'원문 Figure 2, p.8'}
],

quotes:[
 {t:'We then propose Mixture-of-Denoisers (MoD), a pre-training objective that combines diverse pre-training paradigms together. We furthermore introduce a notion of mode switching, wherein downstream fine-tuning is associated with specific pre-training schemes.',
  src:'Abstract, p.1'},
 {t:'UL2 adopts an architecture-agnostic philosophy... we argue that the choice between both architectures (encoder-decoder vs decoder-only) is more of an efficiency trade-off and that architecture choice should not be conflated with the pretraining objective.',
  src:'Section 3.2, p.10'}
],

links:[
 {t:'arXiv 2205.05131 — UL2: Unifying Language Learning Paradigms', u:'https://arxiv.org/abs/2205.05131'},
 {t:'공식 코드/체크포인트 (google-research/ul2)', u:'https://github.com/google-research/google-research/tree/master/ul2'}
]
});
