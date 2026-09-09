WIKI.paper({
slug:'alphastar',
venue:'Nature 575, 350–354 (2019)',
authors:'Vinyals et al. (DeepMind)',
tldr:'불완전 정보·실시간·거대 행동공간을 가진 StarCraft II 전체 게임에서 인간 온라인 대전으로 그랜드마스터 등급(상위 0.2% 이내)에 도달한 논문. 자기대국이 순환·과적합에 빠지는 다중 에이전트 게임의 근본 문제를, 서로 다른 역할의 에이전트 집단을 함께 학습시키는 **리그 학습(league training)**으로 해결했다.',

context:'StarCraft II는 [AlphaGo](#/p/alphago)·[AlphaZero](#/p/alphazero)가 정복한 바둑과 근본적으로 다른 세 가지 난점을 동시에 가진다. 첫째, 상대의 위치와 생산 상태를 카메라 시야 밖에서는 볼 수 없는 **불완전 정보** 게임이다. 둘째, 수만 스텝에 걸쳐 실시간으로 진행되며 매 순간 어떤 행동 종류·대상·목표 지점·타이밍을 고를지 정해야 해 매 스텝 선택지가 약 $10^{26}$ 개에 달하는 **결합적 행동 공간**을 갖는다. 셋째, 전략들이 가위바위보처럼 서로를 이기고 지는 **비추이적(non-transitive)** 관계를 이뤄, [AlphaZero](#/p/alphazero)식 순수 자기대국(self-play)만으로는 특정 전략에 과적합되거나 이미 이긴 상대에게 계속 지는 순환에 빠지기 쉽다. 이전의 강한 봇들은 대개 게임의 일부를 단순화하거나(맵 축소, 종족 제한) 초인적인 조작 속도(APM)에 의존했다.',

ideas:[
 {h:'구조화된 행동을 what·who·where·when으로 분해',
  lead:'행동 하나를 유형·대상·목표·다음 행동 시점의 네 가지 결정으로 자기회귀적으로 생성한다.',
  d:'각 스텝의 행동은 무엇을(수백 가지 유형 중 하나) 누구에게(임의의 유닛 부분집합) 어디에(맵 위 좌표나 유닛) 언제(다음 행동까지의 지연) 적용할지로 이뤄진다. 이 조합이 스텝당 약 $10^{26}$ 개의 선택지를 만들고, 정책은 이를 자기회귀 방식과 순환 포인터 네트워크로 순차적으로 생성해 다룬다.'},
 {h:'self-attention + LSTM으로 유닛 집합과 시간을 함께 처리',
  lead:'가변 개수 유닛은 self-attention으로, 시간에 걸친 부분관측은 [LSTM](#/p/lstm)으로 통합한다.',
  d:'플레이어와 상대 유닛 목록은 개수가 매 순간 바뀌므로 self-attention으로 유닛 간 관계를 인코딩하고, 공간 정보와 비공간 정보를 잇는 scatter connection으로 미니맵과 유닛 정보를 결합한다. 이렇게 만든 관측 임베딩을 깊은 LSTM에 순차로 흘려, 카메라 밖의 과거 정보까지 기억하는 부분관측 MDP를 처리한다.'},
 {h:'지도학습으로 시작해 인간다움을 유지한다',
  lead:'익명화된 인간 리플레이로 먼저 모방학습해 다양한 전략의 기반을 만든다.',
  d:'강화학습을 처음부터 시작하면 탐색 공간이 너무 커 아무 전략도 못 찾는다. 그래서 공개된 인간 리플레이 데이터셋으로 정책이 각 상황에서 인간의 행동을 예측하도록 먼저 지도학습시키고, 빌드오더 같은 전략을 요약한 통계 $z$ 를 조건으로 줘 다양한 인간 스타일을 재현하게 한다. 이후 강화학습 단계에서도 지도학습 정책과의 KL divergence를 손실에 남겨 인간다운 행동에서 크게 벗어나지 않게 붙잡아 둔다.'},
 {h:'리그 학습: 세 종류의 에이전트가 서로를 단련시킨다',
  lead:'main agent·main exploiter·league exploiter가 각기 다른 목적으로 서로를 상대한다.',
  d:'**main agent**는 자기 자신을 포함한 과거의 모든 플레이어를 상대로 우선순위 가상 자기대국(PFSP)을 하며 가장 문제였던 상대를 더 자주 만난다. **main exploiter**는 오직 현재의 main agent만을 노려 그 약점을 찾아내고, **main agent**는 이를 방어하며 강해진다. **league exploiter**는 리그 전체의 체계적 약점을 찾도록 과거 모든 플레이어를 상대하지만 main exploiter의 표적이 되지는 않는다. 이 세 역할이 44일간 3개 종족 × 3개 main agent를 포함해 거의 900명의 서로 다른 플레이어를 만들어냈다.'},
 {h:'off-policy 액터-크리틱을 V-trace·UPGO·TD(λ)로 안정화',
  lead:'비동기로 재생된 경험을 V-trace로 보정하고 UPGO로 자기모방까지 더한다.',
  d:'경험이 비동기적으로 여러 액터에서 수집·재생되므로 정책이 이미 바뀐 뒤의 데이터를 학습해야 하는 off-policy 문제가 생긴다. 중요도샘플링 기반 V-trace로 이를 보정하고, 좋은 결과로 이어진 행동을 더 강화하는 자기모방 알고리즘 UPGO를 더해 안정성과 학습 신호를 모두 확보했다.'}
],

diagram:{type:'loop', cap:'세 역할의 에이전트가 리그 안에서 서로 다른 상대를 상대로 강화학습하며 계속 새 플레이어를 리그에 추가한다.', center:'44일간 반복',
 nodes:[
  {t:'main agent', s:'PFSP: 과거 전체+자신', acc:true},
  {t:'main exploiter', s:'현재 main agent만 공략'},
  {t:'리그 exploiter', s:'리그 전체 약점 탐색'},
  {t:'리그에 복사본 추가', s:'다음 세대 상대 풀 확장'}
 ]},

math:[
 {tex:'\\pi_\\theta(a_t \\mid s_t, z) = \\mathbb{P}[a_t \\mid s_t, z]',
  expr:'π_θ(a_t | s_t, z) = P[a_t | s_t, z]',
  d:'정책은 게임 시작부터의 전체 관측·행동 이력 $s_t=(o_{1:t},a_{1:t-1})$ 뿐 아니라, 인간 데이터에서 뽑은 전략 요약 통계 $z$(예: 빌드오더)에도 조건화된다. $z$ 를 다양하게 샘플링하는 것 자체가 탐색을 다양화하는 장치다.'},
 {tex:'\\mathrm{RPP}(P_{\\bullet\\bullet}) = \\mathrm{Nash}(P_{\\bullet\\bullet})^{\\top} P_{\\bullet\\bullet}\\,\\mathrm{Nash}(P_{\\bullet\\bullet})',
  expr:'RPP(P) = Nash(P)ᵀ P Nash(P)',
  d:'상대 population performance(RPP). 두 리그 사이의 전적 행렬 $P$ 에 대해 각자의 내쉬 균형 혼합전략으로 대전시켰을 때의 기대 승률로, 리그 전체의 상대적 강함을 게임이론적으로 정의한다.'}
],

numbers:[
 {k:'최종 등급', v:'그랜드마스터, 상위 0.15%', d:'세 종족(Protoss·Terran·Zerg) 모두 Battle.net 공식 등급'},
 {k:'MMR(Terran 기준 예시)', v:'6196~6297', d:'상대 종족별 MMR, 6000대는 최상위 그랜드마스터 구간'},
 {k:'학습 인프라', v:'TPU v3 32개 × 44일', d:'main·exploiter 에이전트 각각에 배정된 자원'},
 {k:'생성된 서로 다른 플레이어 수', v:'약 900명', d:'44일 리그 학습 동안 리그에 추가된 스냅샷 총합'},
 {k:'스텝당 행동 조합 수', v:'약 10²⁶', d:'행동 유형×대상×위치×타이밍의 결합 공간'},
 {k:'APM(유효 행동/분) 평균', v:'약 180~210', d:'AlphaStar Final, 인간 평균과 비슷하거나 낮은 수준으로 제한'}
],

impact:'완전한 규칙 단순화 없이 실시간·불완전정보·거대 행동공간 게임에서 인간 최상위층과 동등한 수준에 도달한 첫 사례로, "게임에서 초인적 능력(APM, 시야)에 의존하지 않고도 이길 수 있는가"라는 질문에 실증적으로 답했다. 특히 리그 학습은 자기대국의 순환·과적합 문제에 대한 일반적인 해법으로 제시되어, 이후 비추이적 전략 공간을 가진 다중 에이전트 문제 전반의 참조 설계가 되었다. 아키텍처 측면에서도 self-attention으로 가변 개수 개체를 다루는 방식이 이후 다중 에이전트·로보틱스 연구에 널리 재사용됐다.',

legacy:[
 '**리그 학습(league training)** — 자기대국의 순환·망각 문제에 대한 일반해로 자리잡아, 이후 다른 비추이적 다중 에이전트 게임 연구의 표준 구성요소가 됨',
 '**PFSP(우선순위 가상 자기대국)** — "가장 어려운 상대를 더 자주 만난다"는 원리가 커리큘럼·적대적 훈련 설계 전반에 재사용',
 '**대규모 self-attention + LSTM 에이전트 아키텍처** — 가변 개수 개체(유닛)를 다루는 설계가 이후 [Gato](#/p/gato) 등 범용 에이전트·다중 개체 시스템에 영향',
 '**인간 데이터 + RL의 결합 레시피** — 지도학습 초기화와 KL 정칙화로 탐색 공간을 인간다운 영역으로 좁히는 방식이 이후 게임/로봇 RL의 공통 패턴이 됨'
],

pitfalls:[
 '**"완전히 공정한 비교"는 아니다.** APM을 인간 수준으로 제한했지만 반응 지연·정보 접근(불완전하지만 화면 전환 없이 유닛 리스트로 접근) 방식은 인간과 다르며, 저자들도 이 제약이 전문 선수의 승인을 받은 절충안임을 명시한다.',
 '**지도학습 데이터 없이는 성립하지 않는 레시피다.** 처음부터 순수 강화학습만으로 학습한 것이 아니라, 공개 인간 리플레이로 초기화한 뒤 리그 학습을 얹은 것 — "RL만으로 초인적 성능"이라는 서술은 과장이다.',
 '**리그 학습에 드는 자원이 방대하다.** 에이전트 하나당 TPU 32개를 44일간 사용했고, 리그 전체로는 main·exploiter를 합쳐 훨씬 큰 규모의 계산이 필요해 재현 비용이 매우 높다.'
],

figures:[
 {f:'fig1c-league.png',
  cap:'왼쪽 "Supervised players"에서 시작해 시간(가로축)이 흐르며 각 세로줄이 main agent·main exploiter·league exploiter 계보다. 점선 화살표(matchmaking target)가 어떤 과거 플레이어를 상대로 학습하는지를 보여주고, 오른쪽 "Current players"가 지금 이 순간 리그에 남아있는 활성 에이전트들이다.',
  src:'원문 Figure 1C, p.7'},
 {f:'fig2a-mmr.png',
  cap:'x축은 Battle.net 전체 플레이어의 백분위, y축은 MMR 등급점수. AlphaStar Supervised(지도학습만)는 상위 16%인 반면, 리그 학습을 거친 AlphaStar Mid·Final은 확대된 오른쪽 구간(상위 0.5%, 0.15%)에서 그랜드마스터(주황) 문턱을 넘는다.',
  src:'원문 Figure 2A, p.8'}
],

quotes:[
 {t:'AlphaStar was rated at Grandmaster level for all three StarCraft races and above 99.8% of officially ranked human players.',
  src:'Abstract, p.1'},
 {t:'AlphaStar is the first agent to achieve Grandmaster level in StarCraft II, and the first to reach the highest league of human players in a widespread professional esport without any game restrictions.',
  src:'Discussion, p.5'}
],

links:[
 {t:'Nature: Grandmaster level in StarCraft II', u:'https://www.nature.com/articles/s41586-019-1724-z'},
 {t:'논문 PDF (DeepMind 공개본)', u:'https://storage.googleapis.com/deepmind-media/research/alphastar/AlphaStar_unformatted.pdf'},
 {t:'DeepMind 블로그: AlphaStar', u:'https://deepmind.google/blog/alphastar-grandmaster-level-in-starcraft-ii-using-multi-agent-reinforcement-learning/'}
]
});
