WIKI.paper({
slug:'pangu-weather',
venue:'Nature 2023 (arXiv 2022)',
authors:'Bi et al. (Huawei Cloud)',
arxiv:'2211.02556',

tldr:'대기를 (높이×위도×경도)의 3D 격자로 보고 [ViT](#/p/vit) 스타일 3D transformer로 인코딩해, 세계 최고 수치예보 시스템 ECMWF IFS보다 **더 정확하면서 1만 배 이상 빠른** 전지구 중기예보를 처음으로 보인 논문이다.',

context:'2022년까지 AI 기반 기상예보(FourCastNet 등)는 속도는 수치예보(NWP)보다 압도적으로 빨랐지만 정확도는 여전히 ECMWF IFS에 못 미쳤다. 당시 한 논문은 "AI가 NWP를 이기려면 근본적 돌파구가 필요하다"고 못 박기도 했다. 기존 AI 예보 모델 대부분은 대기를 2D 격자(위도×경도)에 채널로 쌓은 형태로 다뤄, 기압고도(높이) 사이의 관계를 얕게만 반영했다. 또한 짧은 리드타임(예: 6시간) 모델 하나를 반복 실행해 긴 예보를 만드는 방식이라, 반복할수록 오차가 누적되는 문제가 있었다. Pangu-Weather는 이 두 지점 — **높이 정보의 차원화**와 **오차 누적** — 을 정면으로 다룬다.',

ideas:[
 {h:'3D Earth-Specific Transformer (3DEST)',
  lead:'기압고도를 세 번째 공간축으로 취급해 대기를 3D 볼륨으로 인코딩한다.',
  d:'ERA5의 13개 기압고도(상층 변수)와 지표 변수를 쌓아 (높이×위도×경도) 형태의 큐브를 만들고, [ViT](#/p/vit)의 patch embedding(2×4×4, 4×4)으로 토큰화한다. [Swin](#/p/swin) 스타일 encoder-decoder(각 8층)로 다운샘플·업샘플하며 윈도 attention을 수행한다. 2D로 눌러 채널 취급하던 기존 방식보다 고도 간 상호작용을 더 잘 포착해 정확도가 오른다는 것이 실험으로 확인됐다.'},
 {h:'Earth-specific positional bias',
  lead:'위도마다 다른 대기 특성을 반영해 위치별로 다른 attention 편향을 학습한다.',
  d:'[Swin](#/p/swin)의 상대 위치 편향은 윈도 내부 상대 좌표만 보고 모든 윈도에서 값을 공유한다. 하지만 지구 대기는 적도와 극지방의 기압·바람 패턴이 근본적으로 다르므로, 토큰의 **절대 위치**(위도·경도·고도)에 따라 별도의 편향 $B_{ESP}$ 를 학습한다. 파라미터는 늘지만 추론 비용은 거의 늘지 않는다.'},
 {h:'Hierarchical Temporal Aggregation',
  lead:'1·3·6·24시간 리드타임별로 별도 모델을 학습해 반복 실행 횟수를 최소화한다.',
  d:'6시간 모델 하나를 28번 돌려 7일 예보를 만들면 오차가 빠르게 누적된다. 대신 1시간·3시간·6시간·24시간 리드타임의 모델 4개를 각각 학습하고, 테스트 시 그리디 알고리즘으로 **최소 반복 횟수**의 조합을 고른다(예: 7일 예보는 24시간 모델 7회, 23시간 예보는 6시간×3 + 3시간×1 + 1시간×2). 리드타임을 더 늘리지 않은 이유는 기반 모델 학습 자체가 어려워지기 때문이다.'},
 {h:'ERA5 재분석 데이터로 지도학습',
  lead:'43년치 ERA5 재분석 데이터에서 입력·목표 쌍을 뽑아 순수 지도학습으로 훈련한다.',
  d:'물리 방정식을 푸는 대신, 시점 $t$ 의 대기 상태 $A_t$ 에서 $t+\\Delta t$ 의 상태를 예측하도록 신경망을 직접 회귀 학습시킨다. 학습 데이터는 1979~2017년 ERA5, 검증·평가는 2018~2021년을 쓴다. 물리 제약이 모델 구조에 없다는 점은 뒤에서 다시 나오는 한계이기도 하다.'}
],

diagram:{type:'compare', cap:'같은 트랙의 GraphCast는 대기를 그래프로 보고 GNN 메시지패싱으로 처리하는 반면, Pangu-Weather는 대기를 3D 볼륨으로 보고 transformer attention으로 처리한다.',
 left:{t:'GraphCast: GNN', items:['대기를 메시 그래프로 표현','메시지패싱으로 이웃 정보 전파','인코더-프로세서-디코더 GNN']},
 right:{t:'Pangu-Weather: 3DEST', items:['대기를 3D 볼륨으로','patch + 윈도 attention','리드타임별 4개 모델 분리 학습']}
},

math:[
 {expr:'B_ESP(i, j) — 절대 위치 (위도·경도·고도) 에 따라 달라지는 attention 편향',
  tex:'\\text{Attention}(Q,K,V)=\\text{softmax}\\!\\left(\\frac{QK^{\\top}}{\\sqrt{d}}+B_{ESP}\\right)V',
  d:'표준 attention 수식에 지구-특이적 위치 편향 $B_{ESP}$ 를 더한다. [Swin](#/p/swin)의 상대 위치 편향이 윈도마다 재사용되는 것과 달리, 이 편향은 절대 좌표에 묶여 있어 적도 윈도와 극지방 윈도가 서로 다른 편향 값을 갖는다.'},
 {expr:'greedy(Δt) — 목표 리드타임을 4개 base 모델(1·3·6·24h)의 최소 횟수 합으로 분해',
  tex:'\\Delta t = 24k_{24} + 6k_{6} + 3k_{3} + 1\\cdot k_{1},\\quad \\min (k_{24}+k_{6}+k_{3}+k_{1})',
  d:'예: 7일(168시간) 예보는 24시간 모델을 7번 실행. 23시간 예보는 6시간×3 + 3시간×1 + 1시간×2로 분해해 총 6회만 실행한다.'}
],

numbers:[
 {k:'RMSE · Z500 5일 예보', v:'296.7', d:'ECMWF IFS 333.7, FourCastNet 462.5 대비 최저(단위 $m^2/s^2$)'},
 {k:'추론 시간', v:'1,400ms (GPU 1장)', d:'IFS 대비 **10,000배 이상** 빠름'},
 {k:'파라미터', v:'약 2억 5,600만', d:'리드타임 4개(1·3·6·24h) 모델 합산 총합'},
 {k:'공간 해상도', v:'0.25° × 0.25°', d:'ECMWF IFS와 동급, 위경도 격자 1440×721'},
 {k:'학습 데이터', v:'ERA5 1979–2017 (43년)', d:'2018~2021은 평가용으로 분리'},
 {k:'학습 비용', v:'V100 GPU 192장 × 16일', d:'모델 1개(리드타임 1개) 기준 전체 학습 시간'}
],

impact:'Pangu-Weather는 "AI가 수치예보를 이기려면 근본적 돌파구가 필요하다"던 회의론을 정면으로 반박한 첫 사례로 꼽힌다. RMSE·ACC 두 지표 전부에서, 그리고 1시간부터 7일까지 전 구간에서 IFS를 앞선 것은 이 논문이 처음이다. 이후 [GraphCast](#/p/graphcast), FuXi, FengWu 등 경쟁 모델들이 같은 해~다음 해에 쏟아지며 AI 기상예보가 하나의 독립된 연구 트랙으로 자리잡았고, ECMWF 자신도 AI 예보 시스템(AIFS)을 개발하는 계기가 됐다. 태풍 경로 추적 등 하위 응용에도 파인튜닝 없이 바로 확장 가능함을 보여, "범용 대기 상태 예측기"라는 프레이밍을 제시했다.',

legacy:[
 '**GNN 계열과의 분기** — 같은 시기 [GraphCast](#/p/graphcast)는 메시 그래프 + 메시지패싱으로 같은 문제를 풀며, "격자를 어떻게 표현할 것인가"를 둘러싼 3D-transformer 대 GNN 구도가 형성됐다',
 '**연산자 학습 계열과의 접점** — [FNO](#/p/fno) 기반 FourCastNet이 직전 세대 비교 대상이었고, 이후 PDE 연산자 학습과 attention 기반 예보 모델이 서로 아이디어를 주고받는 흐름이 이어졌다',
 '**리드타임 분리 학습이라는 설계 패턴** — 오차 누적을 모델 개수로 해결하는 방식이 이후 여러 기상 모델의 표준 선택지 중 하나가 됐다',
 '**ECMWF의 대응** — 수치예보 본산인 ECMWF가 자체 AI 예보 시스템(AIFS)을 내놓는 계기 중 하나가 됐다'
],

pitfalls:[
 '**RMSE/ACC는 극한 기상을 과소평가한다.** 이 논문 스스로도 태풍 강도(최저기압)를 지속적으로 과소평가한다고 인정한다 — 결정론적 지표는 "평균적으로 그럴듯한" 스무스한 예측을 선호하는데, 실제로 위험한 것은 국지적 극값이다.',
 '**ERA5는 관측이 아니라 재분석 데이터다.** 모델과 동화 과정이 섞인 산출물이라 실제 관측과는 오차가 있고, Pangu-Weather의 정확도는 결국 ERA5 품질에 의해 상한이 정해진다.',
 '**"수치예보를 대체한다"는 과장이다.** 3DEST에는 물리 법칙(질량·에너지 보존 등)이 구조적으로 들어있지 않아, 물리적으로 불가능한 상태를 만들어낼 수 있다. 또한 리드타임별로 4개의 독립 모델을 저장·운용해야 해서, 단일 모델 시스템보다 배포 비용이 크다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'왼쪽이 encoder, 오른쪽이 decoder. 상층 변수(13×1440×721×5)와 지표 변수(1440×721×4)를 각각 patch embedding한 뒤 merge해 8×360×181×C 큐브로 합치고, 4개 층(다운샘플 2번)을 거쳐 patch recovery로 원래 격자 크기로 복원한다. 가운데 점선 화살표가 down/up-sampling.',
  src:'원문 Figure 2, p.6'},
 {f:'fig2-hierarchical.png',
  cap:'x축은 예보 시간(시간), y축은 Z500의 RMSE. 리드타임 1시간 모델을 168번 반복(연보라)하면 오차가 가장 빨리 폭증하고, 24시간 모델을 7번만 반복(빨강)하면 가장 완만하게 증가한다 — 반복 횟수 자체가 오차 누적의 주범임을 보여준다.',
  src:'원문 Figure 4, p.8'}
],

quotes:[
 {t:'The breakthrough comes much earlier than they thought.',
  src:'Introduction, p.2'},
 {t:'Pangu-Weather still heavily underestimates the intensity of tropical cyclones, arguably due to the same weakness of the ERA5 data.',
  src:'Section 4.2.2, p.17'}
],

links:[
 {t:'arXiv 2211.02556 — Pangu-Weather', u:'https://arxiv.org/abs/2211.02556'},
 {t:'Nature 2023 — Accurate medium-range global weather forecasting with 3D neural networks', u:'https://www.nature.com/articles/s41586-023-06185-3'},
 {t:'Huawei Pangu-Weather GitHub', u:'https://github.com/198808xc/Pangu-Weather'}
]
});
