WIKI.paper({
slug:'flamingo',
venue:'NeurIPS 2022',
authors:'Alayrac et al. (DeepMind)',
arxiv:'2204.14198',

tldr:'이미 학습이 끝난 비전 인코더와 언어 모델을 **둘 다 얼려 놓은 채**, 그 사이에 Perceiver Resampler와 gated cross-attention이라는 새 부품만 끼워 넣어 이미지-텍스트가 뒤섞인 시퀀스를 처리하게 만든 모델. 시각 과제를 "few-shot 프롬프트로 푸는 것"으로 바꿔 놓았다.',

context:'2022년 초의 비전-언어 모델은 대체로 두 갈래였다. 하나는 [CLIP](#/p/clip)처럼 이미지와 텍스트를 같은 공간에 정렬시키는 대조학습 계열로, 분류·검색은 잘하지만 **문장을 생성하지 못한다**. 다른 하나는 과제마다 수만 장의 라벨로 파인튜닝하는 VQA·캡셔닝 전용 모델로, 새 과제마다 새 데이터와 새 학습이 필요했다. 한편 텍스트 쪽에서는 [GPT-3](#/p/gpt3)가 "예시 몇 개를 프롬프트에 넣으면 그냥 푼다"는 in-context learning을 보여준 뒤였다. Flamingo의 질문은 그 능력을 **이미지까지 확장할 수 있는가**이다. 문제는 언어 모델을 이미지로 파인튜닝하면 이미 갖고 있던 언어 능력과 in-context learning이 무너진다는 점(catastrophic forgetting)이었다.',

ideas:[
 {h:'양쪽을 다 얼린다 — 학습되는 것은 "다리"뿐',
  lead:'비전 인코더와 LLM을 고정하고 그 사이 연결 모듈만 새로 학습한다.',
  d:'대조학습으로 미리 학습한 NFNet-F6 비전 인코더와 [Chinchilla](#/p/chinchilla) 언어 모델의 가중치를 **전부 고정**한다. 새로 학습되는 것은 Perceiver Resampler와 언어 모델 층 사이에 삽입된 gated cross-attention 층뿐이다. Flamingo-80B의 경우 70B는 얼어 있고 새로 학습되는 파라미터가 약 10B이다. 이 설계가 이후 VLM 설계 공간의 기본 축 — **무엇을 얼리고 무엇을 새로 배우는가** — 을 정의했다.'},
 {h:'Perceiver Resampler: 가변 개수의 시각 특징 → 고정 64 토큰',
  lead:'학습되는 쿼리 64개가 시각 특징을 cross-attend해 토큰 수를 고정한다.',
  d:'이미지 한 장, 혹은 비디오 여러 프레임에서 나오는 특징 맵은 개수가 제각각이고 양이 많다. Perceiver Resampler는 학습되는 **latent query 벡터 64개**가 시각 특징을 cross-attend해서 항상 정확히 64개의 시각 토큰을 뽑아낸다. 입력이 1장이든 8프레임 비디오든 언어 모델이 보는 토큰 수가 일정해지므로, 언어 모델 쪽 계산 비용이 이미지 해상도·프레임 수와 분리된다.'},
 {h:'gated cross-attention: tanh 게이트로 0에서 출발한다',
  lead:'게이트를 0으로 초기화해 학습 시작 시점엔 얼린 LM과 완전히 동일하게 동작한다.',
  d:'얼린 LM 블록들 사이에 `GATED XATTN-DENSE` 층을 끼워 넣는다. 핵심은 출력에 곱해지는 스칼라 게이트를 $\\tanh(\\alpha)$ 형태로 두고 $\\alpha$ 를 **0으로 초기화**하는 것이다. 학습 시작 시점에서 새 층의 기여가 정확히 0이므로 모델은 원래의 순수 언어 모델과 동일하게 동작하고, 학습이 진행되며 시각 정보가 서서히 주입된다. 얼린 LM을 망가뜨리지 않고 새 modality를 붙이는 안정화 장치다.'},
 {h:'인터리브 시퀀스와 이미지-텍스트 인과 마스크',
  lead:'각 텍스트 토큰은 직전 이미지 하나만 보도록 마스킹해 few-shot 구조를 만든다.',
  d:'웹페이지 4,300만 장에서 긁은 M3W 코퍼스는 이미지와 텍스트가 자연스럽게 섞인 문서다. 각 텍스트 토큰은 cross-attention에서 **바로 직전에 등장한 이미지 하나만** 보도록 마스킹된다. 이 단순한 규칙 덕에 "이미지-답, 이미지-답, …, 이미지-?" 형태의 few-shot 프롬프트가 구조적으로 성립한다. 학습 때는 최대 5장까지만 봤지만 추론 시 32-shot까지 확장된다.'},
 {h:'few-shot이 파인튜닝을 이긴 지점',
  lead:'가중치 갱신 없이 프롬프트 예시만으로 여러 파인튜닝 SOTA를 넘어선다.',
  d:'단일 Flamingo 모델이 과제별 가중치 변경 없이, 프롬프트에 예시 32개를 넣는 것만으로 16개 벤치마크 중 **6개에서 파인튜닝된 SOTA를 넘겼다**. 그 SOTA들은 수천 배 많은 과제 전용 라벨로 학습된 모델이었다. 시각 과제 해결의 단위가 "데이터셋 + 학습 루프"에서 "프롬프트"로 옮겨간 첫 사례에 가깝다.'}
],

figures:[
 {f:'fig3-architecture-overview.png',
  cap:'맨 아래 "강아지 사진+문장, 고양이 사진+문장" 인터리브 입력이 위로 올라가며, 각 이미지는 자신의 Vision Encoder → Perceiver Resampler를 거쳐 고정 개수 토큰이 되고, 화살표를 따라 해당 텍스트 위치의 GATED XATTN-DENSE 층에 꽂힌다. 파란 블록(눈꽃 표시)은 얼려 있고 보라 블록만 새로 학습된다는 것이 이 그림의 핵심 구분이다.',
  src:'원문 Figure 3, p.4'},
 {f:'fig4-gated-xattn-dense.png',
  cap:'왼쪽 큰 그림에서 얼린 LM layer 사이에 GATED XATTN-DENSE(보라)가 끼워진 것을 보고, 가운데 확대도에서 그 내부를 본다 — cross attention과 FFW 각각의 출력에 "tanh gating"이 곱해진 뒤 residual로 더해진다. 오른쪽 의사코드의 `alpha_xattn`, `alpha_dense`가 0으로 초기화되는 지점이 바로 "학습 시작 시 얼린 LM과 동일하게 동작한다"는 주장의 근거다.',
  src:'원문 Figure 4, p.5'}
],

diagram:{type:'stack', cap:'Flamingo 층 구성. 파란 상자만 학습되고 나머지는 얼어 있다. NFNet-F6·Perceiver Resampler(query 64개)·GATED XATTN-DENSE·Chinchilla LM.',
 layers:[
  {t:'이미지/비디오 프레임', s:'가변 개수'},
  {t:'NFNet-F6 인코더', s:'frozen', note:'← 대조학습으로 사전학습'},
  {t:'Resampler', s:'쿼리 64개→64 토큰', acc:true, note:'← 학습됨'},
  {t:'XATTN-DENSE', s:'tanh 게이트 α=0 시작', note:'← 학습됨 · 80B는 7층마다'},
  {t:'LM 블록×N', s:'Chinchilla frozen 70B', note:'← 언어 능력 그대로 보존'},
  {t:'다음 텍스트 토큰', s:'자기회귀 생성'}
 ]},

quotes:[
 {t:'They are trained on a carefully chosen mixture of complementary large-scale multimodal data coming only from the web, without using any data annotated for machine learning purposes.',
  src:'Section 1, p.4'}
],

math:[
 {expr:'y ← y + tanh(α) · XAttn(y, X_vis),   α 초기값 = 0',
  tex:'y \\leftarrow y + \\tanh(\\alpha) \\cdot \\text{XAttn}(y, X_{\\text{vis}}), \\quad \\alpha_{\\text{init}} = 0',
  d:'새로 삽입된 cross-attention의 출력은 학습 가능한 스칼라 $\\alpha$ 의 $\\tanh$ 로 스케일된다. $\\alpha=0$ 이면 $\\tanh(0)=0$ 이라 층 전체가 항등 함수가 되고, 얼린 LM의 초기 동작이 정확히 보존된다.'},
 {expr:'p(y | x) = Π_ℓ p(y_ℓ | y_<ℓ, x_≤ℓ)',
  tex:'p(y \\mid x) = \\prod_{\\ell} p(y_\\ell \\mid y_{<\\ell},\\, x_{\\le \\ell})',
  d:'텍스트 토큰 $y_\\ell$ 은 앞선 모든 텍스트와, 그 위치보다 앞에 나온 이미지들 $x_{\\le \\ell}$ 에 조건부다. 실제 cross-attention에서는 **직전 이미지 하나**만 보도록 마스킹한다.'}
],

numbers:[
 {k:'모델 크기', v:'3B / 9B / 80B', d:'각각 Chinchilla 1.4B · 7B · 70B 위에 올림'},
 {k:'새로 학습되는 파라미터', v:'약 10B (80B 모델)', d:'나머지 70B는 전부 frozen'},
 {k:'Perceiver Resampler 출력', v:'시각 토큰 64개', d:'입력 이미지 수·해상도와 무관하게 고정'},
 {k:'gated xattn 삽입 간격', v:'3B는 매 층 · 9B는 4층마다 · 80B는 7층마다', d:'큰 모델일수록 성글게 넣어 비용을 줄임'},
 {k:'M3W 코퍼스', v:'웹페이지 4,300만 장', d:'이미지-텍스트 인터리브 문서. 학습 시 한 시퀀스당 최대 5장'},
 {k:'few-shot SOTA', v:'16개 중 6개에서 파인튜닝 SOTA 초과', d:'32-shot 프롬프트만으로, 과제별 가중치 갱신 없이'}
],

impact:'Flamingo는 "LLM에 눈을 붙이는 법"의 설계 공간을 처음으로 명시적으로 그렸다. **얼린 비전 인코더 + 얼린 LM + 학습되는 연결 모듈**이라는 삼분할은 이후 거의 모든 오픈 VLM이 물려받은 틀이며, 차이는 연결 모듈이 무엇이냐로 좁혀졌다 — [BLIP-2](#/p/blip2)의 Q-Former, [LLaVA](#/p/llava)의 선형 투영, [Qwen-VL](#/p/qwen-vl)의 위치 인식 어댑터가 전부 이 자리를 채우는 서로 다른 답이다. 또한 시각 과제를 프롬프트로 푸는 방식이 자리 잡으면서 VLM 평가가 "데이터셋별 파인튜닝 점수"에서 "zero/few-shot 일반화"로 이동했다. 가중치도 학습 데이터도 공개되지 않았지만, 재현 시도인 OpenFlamingo와 인터리브 학습 데이터셋 계열이 여기서 파생됐다.',

legacy:[
 '**연결 모듈 경량화** — [BLIP-2](#/p/blip2)가 10B짜리 cross-attention 뭉치를 188M Q-Former로 대체하며 "다리는 훨씬 작아도 된다"를 보임',
 '**극단적 단순화** — [LLaVA](#/p/llava)는 cross-attention을 아예 버리고 시각 토큰을 텍스트 토큰과 같은 자리에 이어붙이는(prefix) 선형 투영 한 층으로 회귀',
 '**인터리브 데이터 자체가 자산** — 이미지-텍스트 교차 문서 코퍼스가 멀티모달 few-shot의 전제 조건임이 확인되며 공개 인터리브 데이터셋 구축이 뒤따름',
 '**얼린 backbone + 소량 학습 모듈**이라는 발상은 [Adapter](#/p/adapter)·[LoRA](#/p/lora) 계열과 같은 계보 위에 있으며, 멀티모달 확장에서 특히 표준이 됨'
],

pitfalls:[
 '**"얼렸으니 싸다"가 아니다.** Flamingo-80B에서 새로 학습되는 파라미터만 약 10B로, 웬만한 LLM 전체보다 크다. 얼린 설계의 이점은 학습 비용 절감이 아니라 **언어 능력 보존**과 사전학습 자산 재활용 쪽에 있다.',
 '**few-shot 성능이 곧 in-context "이해"는 아니다.** 32-shot 이득의 상당 부분은 출력 형식·라벨 분포를 맞추는 효과에서 오며, 논문 자신도 shot 수를 늘렸을 때 과제별로 이득 폭이 크게 갈리는 것을 보고한다.',
 '**cross-attention 삽입은 LM 내부를 건드린다.** 얼린 가중치를 쓴다고 해도 층 사이에 새 블록을 끼우므로 추론 그래프가 바뀌고, 기존 LLM 서빙 스택을 그대로 재사용하기 어렵다. 이 부담이 LLaVA식 prefix 방식이 퍼진 이유 중 하나다.'
],

links:[
 {t:'arXiv 2204.14198 — Flamingo: a Visual Language Model for Few-Shot Learning', u:'https://arxiv.org/abs/2204.14198'},
 {t:'DeepMind Blog — Tackling multiple tasks with a single visual language model', u:'https://deepmind.google/discover/blog/tackling-multiple-tasks-with-a-single-visual-language-model/'},
 {t:'OpenFlamingo — 오픈소스 재현 구현', u:'https://github.com/mlfoundations/open_flamingo'}
]
});
