WIKI.paper({
slug:'graphcast',
venue:'Science 2023 (arXiv 2022)',
authors:'Lam, Sanchez-Gonzalez, Willson et al. (Google DeepMind · Google Research)',
arxiv:'2212.12794',

tldr:'지구 표면을 icosahedral 그래프로 표현하고 그 위에서 **GNN 메시지 패싱**을 돌려, 전지구 10일 기상 예보를 단일 TPU에서 1분 이내에 만들어내는 모델. 결정론적 예보 정확도에서 유럽중기예보센터(ECMWF)의 수치예보 시스템 HRES를 처음으로 광범위하게 앞섰다.',

context:'수치예보(NWP)는 물리 방정식을 슈퍼컴퓨터로 직접 적분하는 방식이라, 정확도를 높이려면 더 정밀한 물리 모델과 더 많은 연산이 필요하다. 반세기 넘게 쌓인 [ECMWF](https://www.ecmwf.int)의 재분석 데이터는 이 과정에서 거의 쓰이지 않았다 — 모델 자체가 데이터로부터 학습하는 구조가 아니기 때문이다. GraphCast는 이 문제를 지도학습으로 바꾼다. 격자 위의 대기 상태를 그래프로 보고, [GCN](#/p/gcn)·[MPNN](#/p/mpnn) 계열의 메시지 패싱으로 다음 상태를 예측하도록 39년치 ERA5 재분석 데이터로 직접 학습시킨다. 같은 시기 같은 문제를 푼 [Pangu-Weather](#/p/pangu-weather)가 3D transformer로 격자를 패치 토큰처럼 다뤘다면, GraphCast는 격자를 애초에 **불균일한 그래프**로 재구성해 장거리 상호작용을 메시 계층으로 직접 표현한다는 점이 갈린다.',

ideas:[
 {h:'격자를 다중해상도 icosahedral 메시로 재구성',
  lead:'정이십면체를 6번 세분해 만든 메시 계층으로 지구 표면을 감싼다.',
  d:'위경도 격자(0.25°, 721×1440점)는 극지방으로 갈수록 점이 촘촘해지는 불균일 구조라 그래프 연산에 부적합하다. GraphCast는 정이십면체($M^0$, 노드 12개)를 삼각형마다 4등분하며 6번 세분해 $M^6$(노드 40,962개)까지 만들고, 구면에 투영해 전 지구에 걸쳐 **균일한 해상도**의 메시를 얻는다.'},
 {h:'멀티메시: 여러 세분 단계의 엣지를 한 그래프에 합침',
  lead:'$M^0$부터 $M^6$까지 모든 단계의 엣지를 합쳐 짧고 긴 엣지가 공존하게 한다.',
  d:'가장 성긴 $M^0$의 엣지는 지구 반대편까지 한 홉에 잇는 긴 엣지가 되고, 가장 촘촘한 $M^6$의 엣지는 인접 지역만 잇는 짧은 엣지가 된다. 이 둘을 같은 노드 집합 위에 겹쳐 "멀티메시"를 만들면, 하나의 GNN 층 안에서 국지적 상호작용과 대륙 규모의 장거리 상호작용이 **동시에** 전파된다.'},
 {h:'Encode–Process–Decode: 격자와 메시를 분리',
  lead:'격자→메시(encoder), 메시 위 전파(processor), 메시→격자(decoder)로 역할을 나눈다.',
  d:'encoder는 GNN 1개 층으로 위경도 격자의 지역 값을 가장 가까운 메시 노드에 투영한다. processor는 16개의 서로 다른 가중치를 가진 GNN 층을 멀티메시 위에서 돌려 정보를 전파한다. decoder는 다시 GNN 1개 층으로 메시 특징을 격자로 되돌린다. 무거운 연산(16층 메시지 패싱)을 메시라는 작고 균일한 공간에 몰아넣는 구조다.'},
 {h:'6시간 스텝 autoregressive rollout',
  lead:'6시간 뒤 상태를 잔차로 예측하고, 그 출력을 다시 입력으로 먹여 10일까지 굴린다.',
  d:'모델은 한 번에 6시간만 예측한다. 10일 예보는 이 한 스텝짜리 모델을 40번 반복 적용해서 만든다. 학습 후반부에는 손실을 1스텝이 아니라 최대 12스텝(3일) 굴린 뒤의 누적 오차로 계산해, 자기 예측을 다시 입력으로 받았을 때 오차가 튀지 않도록 만든다.'},
 {h:'227개 변수를 한 모델이 동시에 예측',
  lead:'지표 5개·기압면별 6개×37층 변수를 227차원 벡터로 묶어 한 번에 예측한다.',
  d:'지표 변수(2m 기온, 10m 풍속 등) 5개와, 37개 기압 고도마다 반복되는 대기 변수(지위고도, 기온, 습도, 바람 등) 6개를 합쳐 격자점마다 227개 값을 예측한다. 전체 상태는 격자점 1,038,240개 × 227변수, 약 2억3천만 개 숫자다.'}
],

diagram:{type:'flow', cap:'6시간짜리 한 스텝 예측기를 반복 적용해 10일 예보를 만든다. processor의 메시지 패싱이 유일한 학습 파라미터가 몰린 곳(강조).',
 nodes:[
  {t:'입력 격자', s:'0.25° · 227변수 ×2스텝'},
  {t:'Encoder', s:'GNN 1층, 격자→메시'},
  {t:'Processor', s:'GNN 16층·멀티메시', acc:true},
  {t:'Decoder', s:'GNN 1층, 메시→격자'},
  {t:'+6시간 후 상태', s:'잔차 예측'}
 ]},

math:[
 {expr:'x_(t+1) = x_t + f_θ(x_t, x_(t-1))',
  tex:'x_{t+1} = x_t + f_{\\theta}(x_t,\\,x_{t-1})',
  d:'모델은 절대값이 아니라 **잔차(변화량)**를 예측한다. 직전 두 상태 $x_{t-1}, x_t$ 를 입력받아 6시간 뒤 변화분을 더하는 구조라, 대부분의 변수가 완만하게 변한다는 사전지식을 학습 없이도 반영한다.'},
 {expr:'e_ij\' = φ_e(e_ij, v_i, v_j),   v_i\' = φ_v(v_i, Σ_j e_ij\')',
  tex:'e_{ij}^{\\prime} = \\phi_e(e_{ij}, v_i, v_j), \\qquad v_i^{\\prime} = \\phi_v\\!\\left(v_i, \\sum_{j} e_{ij}^{\\prime}\\right)',
  d:'processor의 각 GNN 층에서 일어나는 표준 메시지 패싱이다. 먼저 엣지 특징을 양 끝 노드로 갱신하고($\\phi_e$, MLP), 그다음 각 노드로 들어오는 엣지 특징을 모두 합해 노드를 갱신한다($\\phi_v$). 이 두 단계를 멀티메시의 모든 엣지에 대해 동시에 수행한다.'}
],

numbers:[
 {k:'입력 해상도', v:'0.25° · 721×1440격자', d:'적도 기준 약 28×28km, 격자점 1,038,240개'},
 {k:'파라미터 수', v:'3670만', d:'단일 TPU/GPU에 올라가는 크기'},
 {k:'멀티메시', v:'M⁰(12노드)~M⁶(40,962노드)', d:'정이십면체를 6회 세분, 모든 단계의 엣지를 합침'},
 {k:'추론 속도', v:'10일 예보 <1분', d:'단일 Google Cloud TPU v4 1개에서'},
 {k:'HRES 대비 우세', v:'1380개 타깃 중 90.3%', d:'그중 89.9%는 통계적으로 유의(p≤0.05)'},
 {k:'학습 데이터·비용', v:'ERA5 39년(1979–2017)', d:'TPU v4 32개로 약 4주 학습'}
],

impact:'결정론적 단일 예보 비교에서 기계학습 모델이 최고 수준 수치예보(HRES)를 광범위한 변수·리드타임에서 앞선 첫 사례로 받아들여졌다. **속도**가 특히 극적이다 — 슈퍼컴퓨터 클러스터에서 몇 시간이 걸리던 예보가 TPU 한 대에서 1분 이내로 끝나면서, 앙상블을 수백 배로 늘리거나 태풍 경로 같은 위험 이벤트에 빠르게 재계산을 돌리는 응용이 열렸다. Science에 게재되며 기상학계 바깥에서도 "AI 기상예보"라는 흐름을 대중적으로 각인시켰다. 이후 [Pangu-Weather](#/p/pangu-weather), FourCastNet, GenCast 등 경쟁·후속 모델이 같은 ERA5/HRES 벤치마크로 줄줄이 비교되는 표준을 만들었다.',

legacy:[
 '**GenCast** — 같은 저자 그룹이 GraphCast의 결정론적 예측을 확산모델 기반 앙상블 예보로 확장, ENS와 직접 경쟁',
 '**아키텍처 다양화** — [Pangu-Weather](#/p/pangu-weather)의 3D transformer, FourCastNet의 Fourier neural operator([FNO](#/p/fno))까지 같은 문제에 서로 다른 귀납적 편향이 경쟁하는 구도가 정착',
 '**메시 기반 시뮬레이터의 일반화** — icosahedral 멀티메시와 GNN 시뮬레이터 조합이 해양·기후 등 다른 지구시스템 모델링으로 확산',
 '**운영 예보 편입 논의 촉발** — ECMWF·NOAA 등이 자체 ML 예보 파이프라인을 구축하며, 기존 물리 기반 예보와의 하이브리드 운용을 검토하기 시작'
],

pitfalls:[
 '**RMSE·ACC 같은 평균 오차 지표는 극한 현상을 잘 못 잡는다.** 태풍의 최대 풍속·중심기압 같은 첨두값이나 국지적 폭우는 공간적으로 흐릿하게(blurred) 예측되는 경향이 있어, "HRES보다 RMSE가 낮다"가 "위험기상 예보력이 항상 더 좋다"를 뜻하지 않는다. 논문도 별도로 태풍 트랙·대기천·극값 예측을 추가 검증한다.',
 '**학습·평가에 쓰인 ERA5는 관측이 아니라 재분석(동화) 데이터다.** 실제 대기 상태가 아니라 물리 모델과 관측을 결합해 재구성한 값이므로, ERA5 자체의 편향(예: 강수량)이 모델에 그대로 스며든다. 논문도 이 때문에 총강수량을 평가에서 제외했다.',
 '**"HRES를 이겼다"는 결정론적 단일 예보끼리의 비교다.** ECMWF의 앙상블 예보 시스템(ENS)이나 확률적 예보와는 별개 비교이며, GraphCast 자체는 앙상블/불확실성 정량화를 제공하지 않는다(이 부분은 후속작 GenCast가 다룬다).'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'왼쪽부터 encoder(초록, 격자 지역을 메시 노드 하나로 투영)→processor(파랑, 멀티메시 위에서 학습된 메시지 패싱)→decoder(자주, 메시 노드를 다시 격자로 분산). 맨 아래 줄이 멀티메시를 이루는 각 세분 단계($M^0$~$M^6$)를 따로 그린 것 — 굵은 엣지일수록 성긴(장거리) 단계.',
  src:'원문 Figure 1(d–g), p.3'},
 {f:'fig2-accuracy.png',
  cap:'z500(500hPa 지위고도) 기준 GraphCast(파랑)와 HRES(검정) 비교. (a) RMSE는 낮을수록 좋음 — 리드타임이 길어질수록 GraphCast가 더 천천히 나빠진다. (b) 같은 비교를 정규화한 skill score, 음수면 GraphCast 우세. (c) ACC(공간 상관)는 1에 가까울수록 좋음. 점선은 HRES 예보 시각이 바뀌는 지점(3.5일).',
  src:'원문 Figure 2(a–c), p.6'}
],

quotes:[
 {t:'It predicts hundreds of weather variables, over 10 days at 0.25° resolution globally, in under one minute.',
  src:'Abstract, p.1'},
 {t:'We show that GraphCast significantly outperforms the most accurate operational deterministic systems on 90% of 1380 verification targets.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2212.12794 — GraphCast: Learning skillful medium-range global weather forecasting', u:'https://arxiv.org/abs/2212.12794'},
 {t:'Science 2023 (게재본)', u:'https://www.science.org/doi/10.1126/science.adi2336'},
 {t:'DeepMind 공식 블로그 — GraphCast', u:'https://deepmind.google/discover/blog/graphcast-ai-model-for-faster-and-more-accurate-global-weather-forecasting/'}
]
});
