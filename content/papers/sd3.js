WIKI.paper({
slug:'sd3',
venue:'ICML 2024',
authors:'Esser, Kulal, Blattmann et al. (Stability AI)',
arxiv:'2403.03206',

tldr:'diffusion 표준이던 $\\epsilon$-예측을 버리고 **rectified flow**(직선 확률 경로)로 학습 목표를 바꾸고, 텍스트와 이미지를 위한 **가중치를 따로 두되 attention에서만 합치는 MMDiT** 구조로 이미지를 생성하는 8B 모델. 두 변경 모두 통제된 스케일링 실험으로 검증했다는 점이 논문의 무게중심이다.',

context:'[LDM](#/p/ldm)/[SDXL](#/p/sdxl) 계열은 [U-Net](#/p/unet) 백본에 $\\epsilon$-예측 diffusion loss를 쓰고, 텍스트 조건은 cross-attention으로 U-Net에 주입하는 구조였다. [DiT](#/p/dit)가 U-Net을 transformer로 교체할 수 있음을 보였지만 클래스 조건 생성에 그쳤고, 텍스트-이미지 결합은 여전히 단방향 cross-attention에 의존했다. 한편 [Flow Matching](#/p/flow-matching)과 독립적으로 제안된 rectified flow는 노이즈-데이터 직선 경로를 회귀하는 더 단순한 목표를 제시했지만, 어느 노이즈 스케줄·시간 샘플링이 실제로 더 나은지는 정리돼 있지 않았다. 이 논문은 두 질문을 동시에 다룬다 — **rectified flow가 정말 기존 diffusion 공식들보다 나은가**, 그리고 **텍스트와 이미지 표현을 어떻게 섞어야 둘 다 잃지 않는가**.',

ideas:[
 {h:'Rectified flow + logit-normal 시간 샘플링',
  lead:'노이즈-데이터를 직선으로 잇고 중간 시간대를 더 자주 샘플링해 학습을 집중시킨다.',
  d:'$x_t=(1-t)x_0+tx_1$ 직선 경로 위에서 속도 $x_1-x_0$ 를 회귀하는 것은 [Flow Matching](#/p/flow-matching)/rectified flow와 같다. 이 논문의 기여는 61가지 손실·스케줄 조합(엡실론/속도 예측 × 여러 노이즈 스케줄 × RF 변형)을 ImageNet과 CC12M에서 직접 비교한 것이다. 그 결과 시간 $t$ 를 균등 샘플링하지 않고 중간 구간(가장 어려운 노이즈 수준)에 확률을 더 싣는 **logit-normal 샘플러**를 쓴 RF가 FID·CLIP score 양쪽에서 가장 일관되게 좋았다.'},
 {h:'MMDiT: 두 세트의 가중치, 하나의 attention',
  lead:'텍스트와 이미지 토큰을 각자 다른 가중치로 처리하다가 attention에서만 합쳐 양방향으로 섞는다.',
  d:'텍스트와 이미지는 통계적으로 다른 모달리티이므로, 하나의 [DiT](#/p/dit) 블록을 공유하는 대신 **모달리티마다 독립된 LayerNorm·QKV·MLP 가중치**를 둔다. 두 시퀀스는 self-attention 연산 직전에만 concat되어 하나의 attention을 함께 계산하고, 그 뒤 다시 갈라져 각자의 MLP를 탄다. 결과적으로 텍스트 표현도 diffusion 과정에서 계속 갱신되며 이미지 쪽 정보를 받는다 — 텍스트가 조건으로 고정된 채 이미지 쪽에서 일방적으로 읽어가는 cross-attention과 다른 지점이다.'},
 {h:'세 텍스트 인코더를 섞어 쓰고, 필요하면 하나를 뺀다',
  lead:'CLIP-G/L과 T5-XXL을 함께 조건으로 쓰되 T5는 추론 시 생략 가능하게 설계한다.',
  d:'풀링된 [CLIP](#/p/clip) 임베딩은 timestep 변조(modulation) 경로로, CLIP과 T5-XXL의 토큰 시퀀스는 concat되어 MMDiT의 텍스트 스트림으로 들어간다. T5-XXL(4.7B)은 타이포그래피처럼 긴 텍스트 렌더링 품질에 크게 기여하지만, 학습 때 일정 비율로 드롭아웃해 두면 **추론 시 T5 없이 CLIP 두 개만으로도** 동작해 메모리를 아낄 수 있다.'},
 {h:'검증 손실이 벤치마크 점수와 상관한다',
  lead:'모델 크기·학습 스텝에 따라 매끈하게 좋아지는 validation loss가 사람 선호와도 함께 움직인다.',
  d:'depth(=attention head 수이자 hidden size 배수) 15에서 38까지 스케일을 올리며 검증 손실을 재면, 이 손실이 GenEval·T2I-CompBench·사람 선호 평가와 **매끈한 상관관계**로 함께 개선된다는 것을 확인했다. 이는 SD3 개발 과정에서 값비싼 사람 평가 없이도 validation loss만으로 스케일링 결정을 내릴 수 있었다는 실무적 근거가 된다.'},
 {h:'QK-Norm으로 8B까지 발산 없이 키운다',
  lead:'attention logit이 커지는 고해상도 구간에서 Q·K에 RMS-Norm을 넣어 학습을 안정화한다.',
  d:'혼합정밀도로 해상도를 올리며 모델을 키우면 attention entropy가 무너져 손실이 발산하는 현상이 나타났다. Q와 K에 RMS-Norm을 적용해 attention logit의 크기를 억누르는 QK-Norm을 추가하자 이 발산이 사라졌고, 이 조치 덕분에 8B·1024px까지 별다른 학습 불안정 없이 스케일을 올릴 수 있었다.'}
],

diagram:{type:'flow', cap:'MMDiT 한 블록. 이미지·텍스트가 각자 가중치로 정규화·투영된 뒤 attention에서만 합쳐지고, 다시 갈라져 각자의 MLP를 탄다.',
 nodes:[
  {t:'이미지 토큰', s:'패치 + 위치인코딩'},
  {t:'텍스트 토큰', s:'CLIP+T5 임베딩'},
  {t:'개별 정규화·QKV', s:'모달리티별 가중치'},
  {t:'합쳐진 Attention', s:'concat 후 계산', acc:true},
  {t:'개별 MLP', s:'다시 분리', a:'분리'}
 ]},

math:[
 {expr:'x_t = (1-t) x_0 + t x_1,   dx_t/dt = x_1 - x_0',
  tex:'x_t=(1-t)x_0+t\\,x_1,\\qquad \\frac{d x_t}{dt}=x_1-x_0',
  d:'rectified flow의 직선 경로. $x_0$ 는 노이즈, $x_1$ 은 데이터이고, 모델은 이 상수 속도 $x_1-x_0$ 를 각 $t$ 에서 회귀하도록 학습된다.'},
 {expr:'L = E_{t~π(t), x0, x1} [ ||v_θ(x_t, t) - (x_1 - x_0)||² ]',
  tex:'\\mathcal{L}=\\mathbb{E}_{t\\sim\\pi(t),\\,x_0,x_1}\\big[\\lVert v_\\theta(x_t,t)-(x_1-x_0)\\rVert^2\\big]',
  d:'학습 손실. $\\pi(t)$ 가 균등분포 대신 logit-normal이면 중간 노이즈 수준에 학습이 더 집중돼 성능이 오른다.'}
],

numbers:[
 {k:'최대 모델', v:'8B', d:'depth=38, MMDiT 블록 반복'},
 {k:'학습 연산', v:'≈5×10²² FLOPs', d:'8B 모델 기준'},
 {k:'DPO 미세조정', v:'2B/8B 각 2k/4k step', d:'128 프롬프트 사람 선호 평가로 aesthetic 개선'},
 {k:'T5 제거 시 win rate', v:'aesthetic 50% · adherence 46% · 문자생성 38%', d:'T5 없어도 미학·순응도는 거의 그대로, 텍스트 렌더링만 크게 저하'},
 {k:'텍스트 인코더', v:'CLIP-G/14 + CLIP-L/14 + T5-XXL', d:'T5는 추론 시 드롭 가능'},
 {k:'평가 지표', v:'GenEval · T2I-CompBench · 사람 선호', d:'자동 지표와 사람 평가를 함께 보고'}
],

impact:'MMDiT는 이후 [movie-gen](#/p/movie-gen)·[hunyuan-video](#/p/hunyuan-video) 등 대규모 비디오 생성 모델의 텍스트-비디오 결합 방식에도 영향을 준 설계로, 단방향 cross-attention 대신 **두 모달리티를 대칭적으로 취급하는 attention**이 하나의 표준 선택지가 되었다. rectified flow 채택은 diffusion 커뮤니티가 $\\epsilon$-예측에서 flow 기반 목표로 옮겨가는 흐름을 상용급 모델 규모에서 확인시킨 사례로 자주 인용된다. 또한 통제된 61종 비교 실험 방법론 자체가, "새 손실을 제안할 때 스케줄·샘플링까지 함께 통제해 비교해야 한다"는 이후 논문들의 실험 관행에 참고가 되었다.',

legacy:[
 '**MMDiT 구조 확산** — 이후 다수의 이미지·비디오 diffusion transformer가 단일 cross-attention 대신 대칭적 양방향 attention을 채택',
 '**rectified flow의 상용화** — [flow-matching](#/p/flow-matching) 계열 목표가 대규모 텍스트-이미지 모델에서도 diffusion을 대체할 수 있음을 확인',
 'DPO 기반 사람 선호 미세조정이 T2I 모델 후처리 단계의 표준 절차로 자리잡는 계기',
 '텍스트 인코더를 여러 개 섞고 추론 시 일부를 생략 가능하게 설계하는 방식이 이후 오픈 모델([flux] 등)에도 이어짐'
],

pitfalls:[
 '**MMDiT는 텍스트-이미지 attention을 없앤 것이 아니라 대칭화한 것이다.** 여전히 하나의 attention 연산 안에서 두 시퀀스가 상호작용하며, cross-attention 자체가 사라진 것은 아니다.',
 '**rectified flow의 이득은 "직선 경로" 자체보다 시간 샘플링(logit-normal)과 결합했을 때 가장 크게 나타난다.** 균등 시간 샘플링 RF만으로는 기존 공식 대비 우위가 논문의 비교에서처럼 크지 않다.',
 '**보고된 성능 비교의 상당 부분이 사람 평가(human preference) 기반이다.** GenEval 등 자동 지표만 보고 결론을 옮기면 논문의 실제 주장과 어긋날 수 있다.'
],

figures:[
 {f:'fig2-mmdit.png',
  cap:'왼쪽(a)이 전체 파이프라인, 오른쪽(b)이 MM-DiT 블록 내부. (b)에서 c(텍스트)와 x(이미지) 두 경로가 각자 LayerNorm·Linear를 거치다가 가운데 초록 박스 "Q K V Attention" 한 곳에서만 합쳐지고, 그 다음 다시 갈라져 각자의 MLP로 간다 — 이 갈라졌다 합쳐지는 지점이 MMDiT의 핵심.',
  src:'원문 Figure 2, p.5'}
],

quotes:[
 {t:'We use separate weights for the two modalities... this is equivalent to having two independent transformers for each modality, but joining the sequences of the two modalities for the attention operation.',
  src:'p.5'}
],

links:[
 {t:'arXiv 2403.03206 — Scaling Rectified Flow Transformers', u:'https://arxiv.org/abs/2403.03206'},
 {t:'Stability AI — Stable Diffusion 3', u:'https://stability.ai/news/stable-diffusion-3'}
]
});
