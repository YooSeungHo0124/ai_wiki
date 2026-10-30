WIKI.paper({
slug:'taptr',
venue:'arXiv 2024 (preprint)',
authors:'Li et al. (SCUT · IDEA · HKUST · Tsinghua)',
arxiv:'2403.13042',

tldr:'점 추적을 객체 검출과 같은 문제로 보고, 추적할 점 하나하나를 [DETR](#/p/detr)의 **point query**(위치 + 내용)로 바꿔 그대로 디코더에 넣은 모델. cost volume과 윈도 사이의 content feature 갱신을 더해 TAP-Vid-DAVIS에서 [CoTracker](#/p/cotracker)를 넘었다.',

context:'[PIPs](#/p/pips)·[TAPIR](#/p/tapir)·[CoTracker](#/p/cotracker) 같은 반복 정제형 추적기는 한 점을 위치, 광류 벡터, 광류 임베딩, 가시성, 내용 특징, 국소 상관을 전부 이어 붙인 하나의 벡터로 표현한다. 이 벡터를 MLP나 Transformer가 알아서 해독해 주길 기대하는 구조라 각 요소의 역할이 불투명하고, 층마다 cost volume을 다시 계산하는 중복도 있다. 저자들은 프레임 하나만 놓고 보면 점 추적이 "쿼리와 가장 잘 맞는 점을 이미지에서 검출"하는 일이고, 점 사이의 정보 교환은 query 사이의 self-attention이라는 점에 주목한다. DETR 계열이 이미 잘 다듬어 놓은 부품을 그대로 가져다 쓰자는 발상이다.',

ideas:[
 {h:'추적점 = point query (위치 + 내용)',
  lead:'각 프레임·각 추적점마다 위치 부분과 내용 부분으로 이뤄진 query 하나를 둔다.',
  d:'추적점이 처음 나타난 프레임의 멀티스케일 특징을 쿼리 위치에서 bilinear 보간하고 MLP로 합쳐 초기 content feature 를 만든다. 이 값과 쿼리 위치를 모든 프레임의 query에 복사해 초기화한다. 디코더 6개 층을 지나며 위치는 sigmoid 공간에서 $\\Delta l$ 만큼, 내용은 잔차로 갱신되고, 가시성은 마지막 층의 content feature 로만 예측한다. 즉 query의 의미가 DETR과 똑같이 명확하다.'},
 {h:'DETR 디코더 층을 그대로 쓰되 cost volume을 한 번만 계산',
  lead:'cost volume을 디코더 입력 전에 한 번 만들어 정적인 특징 맵처럼 모든 층이 재사용한다.',
  d:'점 추적은 객체 검출보다 저수준 국소 정보가 중요해서 [RAFT](#/p/raft) 식 cost volume을 쓴다. 쿼리 content feature와 각 스케일 특징 맵의 내적으로 cost volume을 만들고, 층마다 현재 위치 주변 $G\\times G$ 격자를 GridSample해서 content feature에 융합한다. 이전 방법처럼 content가 바뀔 때마다 다시 계산하지 않으므로 다층 정제의 목표가 흔들리지 않는다. 여기에 deformable cross-attention이 원본 이미지 특징을 보충한다.'},
 {h:'점 사이 self-attention과 시간 방향 attention',
  lead:'같은 프레임의 query끼리는 위치 임베딩을 더한 self-attention, 같은 점의 query끼리는 시간 attention을 한다.',
  d:'CoTracker도 점 간 attention을 쓰지만 위치 임베딩이 없어 효율이 떨어진다는 것이 저자들의 지적이다. TAPTR은 query에 sinusoidal 위치 임베딩을 더해 이웃 점에 더 주목하게 하고, 점 검출이 객체 검출보다 세밀해야 하므로 temperature $\\tau$ 를 DETR 기본값보다 낮춘다. 시간 attention은 한 윈도 안 같은 점의 $W$ 개 query 사이에서 독립적으로 수행한다.'},
 {h:'윈도 사이로 content feature를 넘기되 확률적으로 끊는다',
  lead:'윈도 사이에 content feature를 전달해 장기 정보를 주고, 랜덤 drop으로 feature drift를 막는다.',
  d:'슬라이딩 윈도(크기 8, 스트라이드 4)는 위치와 가시성만 넘기면 장기 시간 정보를 잃는다. 반대로 content feature를 제한 없이 넘기면 학습 영상(24프레임)보다 긴 추론 영상에서 drift가 쌓인다. 그래서 학습 때는 content 갱신을 확률 0.6으로 무작위로 끄고, 추론 때는 갱신은 유지하되 영상 길이에 비례한 간격으로 feature padding만 건너뛴다.'}
],

diagram:{type:'flow', cap:'TAPTR의 한 윈도 처리 흐름. 모든 프레임의 point query가 병렬로 디코더에 들어가고, 윈도 후처리가 다음 윈도로 위치·가시성·content feature를 넘긴다.',
 nodes:[
  {t:'특징·query 준비', s:'백본+인코더, 보간'},
  {t:'cost volume', s:'한 번만 계산'},
  {t:'point decoder', s:'×6층, 프레임 병렬', acc:true, a:'위치·내용'},
  {t:'가시성 분류', s:'마지막 층만'},
  {t:'윈도 후처리', s:'content 전달·drop'}
 ]},

math:[
 {expr:'l ← Sigmoid( Sigmoid⁻¹(l) + MLP(f) ),  f ← f + MLP(Cat(f, f_e))',
  tex:'l_t^i \\leftarrow \\sigma\\!\\left(\\sigma^{-1}(l_t^i)+\\Delta l_t^i\\right),\\qquad f_t^i \\leftarrow f_t^i + \\Delta f_t^i,\\;\\; \\Delta f_t^i=\\mathrm{MLP}\\!\\left(\\mathrm{Cat}(f_t^i,\\,f_{e_i}^i)\\right)',
  d:'point query 갱신식. 위치는 DETR처럼 sigmoid 역변환 공간에서 보정하고, content는 점이 처음 나타난 시점의 초기 feature $f_{e_i}$ 를 매 층 다시 참조하는 잔차 갱신이다. 초기 feature가 가림·drift에 가장 덜 오염된 신호라는 가정에 따른다.'},
 {expr:'Loss = ω_V CE(V, Ṽ) + Σ_d ω_L L1(L_d, L̃) / N',
  tex:'\\mathcal{L}=\\omega_V\\,\\mathrm{CE}(V,\\tilde V)+\\Big(\\sum_{d=1}^{D}\\omega_L\\,\\mathrm{L1}(L_d,\\tilde L)\\Big)/N',
  d:'윈도마다가 아니라 전체 시퀀스를 얻은 뒤 위치에 L1, 가시성에 cross entropy를 건다. DETR의 보조 손실처럼 모든 디코더 층의 위치를 감독한다.'}
],

numbers:[
 {k:'TAP-Vid-DAVIS · first · AJ / <δ_avg / OA', v:'63.0 / 76.1 / 91.1', d:'표 1. CoTracker2-All 60.7, CoTracker2-Single 62.2. 학습은 Kubric 합성 데이터만 사용'},
 {k:'TAP-Vid-RGB-Stacking · AJ', v:'60.8', d:'표 1의 같은 행에서 TAPIR 55.5'},
 {k:'TAP-Vid-Kinetics · AJ', v:'49.0', d:'TAPIR 49.6, CoTracker-Single 48.7, 추가 영상 1500만 클립으로 학습한 BootsTAP 54.7보다 낮다'},
 {k:'속도 PPS (DAVIS, points/sec)', v:'20.4', d:'CoTracker2-All 15.7(약 1.3배), CoTracker2-Single 0.8(약 25배)'},
 {k:'ablation: cost volume 제거 (DAVIS AJ)', v:'51.6 → 46.8', d:'표 2의 5행 대 6행. 약 4.8 AJ 하락'},
 {k:'ablation: 윈도 간 content 갱신 제한 없음 (DAVIS AJ)', v:'54.7', d:'표 3 1행. 제안한 전략(4행)은 63.0, RGB-Stacking은 23.1 대 60.8로 더 크게 갈린다'}
],

impact:'TAPTR은 새 부품을 발명하기보다 DETR 계열에서 검증된 부품(query, self/cross-attention, 층별 보조 손실)을 점 추적에 대응시켜 구조를 명료하게 만들었다. 한 점의 상태를 위치와 내용으로 나눈 덕에 각 요소를 따로 떼어 ablation할 수 있었고, 논문은 표 2에서 그 기여를 하나씩 보여준다. 윈도 사이 content feature 전달이 장기 정보에는 필요하지만 길이가 어긋나면 drift를 부른다는 관찰도 이후 장기 추적 설계에 참고가 된다. 다만 학습 데이터가 합성에 치우쳐 있다는 한계를 저자들이 직접 인정한다.',

legacy:[
 '**[DETR](#/p/detr)의 query 패러다임을 점 추적으로 확장** — 검출·추적 쪽 설계 어휘가 TAP에 들어오는 다리가 됐다',
 '**[TAPIR](#/p/tapir)류 반복 정제 구조를 query 갱신으로 재해석** — 광류 임베딩 등을 이어 붙인 블랙박스 벡터를 쓰지 않는다',
 '**[CoTracker](#/p/cotracker)의 점 간 attention에 위치 임베딩을 더하는 개선을 제시**',
 '**윈도 간 content feature 전달과 drift 완화는 이후 긴 영상 추적 논의에서 비교 대상으로 남는다**'
],

pitfalls:[
 '**DETR와 똑같은 모델이 아니다.** 디코더 틀만 빌렸고, 점 추적에 맞춰 cost volume, 시간 attention, 윈도 후처리를 새로 넣었다. 검출처럼 Hungarian 매칭을 하는 것도 아니다. 각 query가 자기 추적점에 이미 배정돼 있다.',
 '**표 1의 숫자를 모드별로 구분해 읽어야 한다.** DAVIS 63.0은 first 모드이고, strided 모드(DAVIS-S)에서는 66.3으로 BootsTAP 66.4보다 근소하게 낮다. Kinetics에서도 선두가 아니다.',
 '**추론 때 영상 길이에 따라 padding 간격을 바꾸는 휴리스틱이 들어간다.** 학습 길이 24프레임과 크게 다른 영상에서의 동작은 이 규칙에 의존한다.'
],

figures:[
 {f:'fig2-overview.png',
  cap:'왼쪽은 윈도 내 모든 프레임의 특징·cost volume·초기 query를 준비하는 부분이다. 가운데 큰 상자가 point decoder 한 층으로 아래에서 위로 cost volume 집계, cross attention, self attention, temporal attention 순서로 쌓이고 6번 반복된다. 오른쪽 아래가 가시성 분류와 윈도 후처리다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'Based on the observation that point tracking bears a great resemblance to object detection and tracking, we borrow designs from DETR-like algorithms to address the task of TAP.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2403.13042 — TAPTR', u:'https://arxiv.org/abs/2403.13042'},
 {t:'프로젝트 페이지 — taptr.github.io', u:'https://taptr.github.io'}
]
});
