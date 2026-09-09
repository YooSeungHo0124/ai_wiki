WIKI.paper({
slug:'mobile-aloha',
venue:'arXiv 2024 (Stanford)',
authors:'Fu*, Zhao* et al. (Stanford University)',
arxiv:'2401.02117',

tldr:'바퀴 달린 이동 베이스에 양팔 [ACT](#/p/act) 원격조작 시스템을 얹어, 사람이 온몸(base+양팔)을 동시에 조종하며 데이터를 모으는 **$32k짜리** 저가 이동 조작 시스템. 기존 정적 ALOHA 데이터로 co-training하면 태스크당 **50회 시연**만으로 성공률을 최대 90%p까지 끌어올릴 수 있음을 보였다.',

context:'[ACT/ALOHA](#/p/act)는 저가 하드웨어로 양팔 정밀 조작을 모방학습으로 익혔지만 로봇이 바닥에 고정된 **테이블탑** 작업에 한정됐다. 냉장고에서 재료를 꺼내 요리하거나 엘리베이터를 부르는 등 실제 가사 작업은 이동(base)과 양팔 조작이 동시에 필요한데, 이런 전신 원격조작을 지원하는 저가 하드웨어가 없었다 — PR2·TIAGo 같은 상용 이동 조작 로봇은 대당 20만 달러를 넘는다. 또한 [Diffusion Policy](#/p/diffusion-policy)류 표현력 높은 정책이 이동 조작처럼 자유도가 늘어난 상황에서도 잘 작동하는지, 그리고 소수의 시연만으로 학습이 가능한지가 불분명했다.',

ideas:[
 {h:'Mobile ALOHA: 사람이 통째로 밀고 다니는 원격조작대',
  lead:'조작자의 허리를 이동 베이스에 물리적으로 묶어(tether) 두 손은 팔을, 몸은 베이스를 동시에 조종한다.',
  d:'ALOHA의 두 leader 팔에 이미 양손이 점유돼 있으므로, 별도 입력장치 대신 조작자를 AgileX Tracer 이동 베이스에 허리로 결속해 몸을 움직이면 베이스가 그 힘으로 backdrive되게 했다. 바퀴 마찰력은 약 13N으로 사람이 밀 수 있는 수준이다. 이 결과 베이스 속도와 4개 팔의 관절 위치를 **동시에, 같은 시연에서** 기록하는 전신 원격조작 데이터가 나온다.'},
 {h:'행동을 14+2차원 벡터로 이어붙여 기존 알고리즘을 그대로 쓴다',
  lead:'양팔 14자유도와 베이스 선·각속도 2차원을 하나의 벡터로 concat해 알고리즘 수정 없이 학습한다.',
  d:'새 정책 구조를 설계하는 대신, 팔 관절 목표 위치 14차원(그리퍼 포함)과 베이스의 선속도·각속도 2차원을 단순히 이어붙여 16차원 행동으로 만든다. 이렇게 하면 [ACT](#/p/act)·[Diffusion Policy](#/p/diffusion-policy)·VINN 같은 기존 모방학습 알고리즘을 구조 변경 없이 그대로 이동 조작에 적용할 수 있다.'},
 {h:'정적 ALOHA 데이터와의 co-training',
  lead:'전혀 다른 태스크의 기존 테이블탑 시연 825개를 섞어 학습하면 이동 조작 성능이 오른다.',
  d:'RT-X를 통해 공개된 기존 정적 ALOHA 데이터셋(지퍼백 밀봉·포크 집기 등 825개 에피소드, Mobile ALOHA와 겹치지 않는 태스크·다른 팔 장착 위치)을 매 배치 50%의 확률로 섞어 학습한다. 정적 데이터에는 베이스 행동이 없으므로 행동 라벨을 0으로 패딩하고, 정적 데이터에만 있는 정면 카메라는 무시해 두 데이터셋의 관측·행동 차원을 맞춘다. 태스크·형상이 전혀 다른데도 거의 모든 이동 조작 태스크에서 양의 전이가 관찰됐다.'},
 {h:'50개 시연 규모에서의 데이터 효율',
  lead:'태스크당 50회 시연 + co-training만으로 여러 복합 태스크에서 80% 이상의 성공률을 낸다.',
  d:'Rinse Pan·Call Elevator처럼 정밀한 서브태스크(수도꼭지 돌리기, 엘리베이터 버튼 누르기)가 포함된 7개 태스크에서, co-training 없이는 서브태스크 성공률이 0~5%까지 떨어지는 경우가 있었지만 co-training을 적용하면 80~100%로 올랐다. 평균적으로 절대 성공률이 34%p 개선됐고, 개선 폭이 가장 큰 태스크에서는 90%p에 달했다.'}
],

diagram:{type:'flow', cap:'허리로 이동 베이스에 묶인 조작자가 양팔·베이스를 동시에 조종해 전신 시연 데이터를 모으고, 정적 ALOHA 데이터와 섞어 학습한다.',
 nodes:[
  {t:'전신 원격조작', s:'허리 tether', acc:true},
  {t:'전신 시연', s:'50개/태스크'},
  {t:'정적 ALOHA 데이터', s:'825개 에피소드'},
  {t:'Co-training', s:'배치 절반씩 샘플'},
  {t:'모방학습 정책', s:'16차원 행동 출력'}
 ]},

math:[
 {expr:'a = concat(a_arms ∈ R^14, a_base ∈ R^2)  — 16차원 행동',
  tex:'a = \\big[\\, a_{\\text{arms}} \\in \\mathbb{R}^{14},\\ \\ a_{\\text{base}} \\in \\mathbb{R}^{2} \\,\\big]',
  d:'양팔 각 7자유도(그리퍼 포함) 목표 관절 위치 14차원과 베이스의 선·각속도 2차원을 이어붙인 것이 정책의 출력 전부다. 구조 변경 없이 기존 모방학습 알고리즘에 그대로 넣을 수 있다.'},
 {expr:'L_cotrain = E[L(a_arms,a_base,π(o)) | D_mobile] + E[L(a_arms,[0,0],π(o)) | D_static]',
  tex:'\\mathbb{E}_{D_{\\text{mobile}}}\\!\\big[L(a_{\\text{arms}},a_{\\text{base}},\\pi(o))\\big] + \\mathbb{E}_{D_{\\text{static}}}\\!\\big[L(a_{\\text{arms}},[0,0],\\pi(o))\\big]',
  d:'매 배치를 Mobile ALOHA 데이터와 정적 ALOHA 데이터에서 절반씩 뽑는다. 정적 데이터는 베이스 행동이 없으므로 $[0,0]$ 으로 0-패딩해 두 손실을 같은 형태로 합산한다.'}
],

numbers:[
 {k:'시스템 비용', v:'$32,000', d:'Franka Emika Panda 한 대와 비슷한 가격, 온보드 전원·컴퓨트 포함'},
 {k:'이동 베이스', v:'AgileX Tracer, $7,000', d:'최대 속도 1.6m/s, 페이로드 100kg, 유사 스펙 AGV 대비 5배 저렴'},
 {k:'시연 수', v:'태스크당 50개 (High Five는 20개)', d:'co-training과 결합했을 때의 기준 시연 수'},
 {k:'co-training 개선', v:'평균 +34%p, 최대 +90%p', d:'7개 이동 조작 태스크의 ACT 성공률, co-train 없음 대비'},
 {k:'배터리·연속 가동', v:'1.26kWh · 12시간', d:'요리·청소 등 장시간 시연 세션을 가능하게 함'},
 {k:'정적 데이터 규모', v:'825개 에피소드', d:'RT-X로 공개된 기존 ALOHA 테이블탑 데이터, Mobile ALOHA와 태스크 불일치'}
],

impact:'테이블탑에 갇혀 있던 저가 원격조작 모방학습을 이동 조작으로 확장한 최초의 실용적 시스템이다. "다른 태스크·다른 형상의 기존 데이터를 섞기만 해도 데이터 효율이 오른다"는 결과는 로봇 학습에서 co-training을 표준 관행으로 만드는 데 기여했고, [Open X-Embodiment](#/p/open-x)가 보여준 이종 로봇 간 전이 효과가 **같은 연구실의 다른 태스크 데이터** 수준에서도 성립함을 보였다. 온보드 전원·컴퓨트를 갖춘 완전 무선 시스템이라는 점도 이후 저가 이동 조작 하드웨어 설계의 기준이 되었다.',

legacy:[
 '**이동 조작용 원격조작 하드웨어의 참조 설계** — 허리 tether 방식과 부품 목록·조립 튜토리얼이 공개돼 이후 저가 이동 조작 연구의 출발점이 됨',
 '**co-training이 기본 관행으로 정착** — 로봇 정책 학습에서 관련 없는 기존 데이터를 섞는 것이 표준 절차가 됨, [Open X-Embodiment](#/p/open-x)와 같은 문제의식을 단일 연구실 규모에서 확인',
 '**정책 구조 불문의 결론** — ACT뿐 아니라 [Diffusion Policy](#/p/diffusion-policy)·VINN에도 co-training 이득이 재현되며 특정 알고리즘에 종속되지 않음을 보임',
 '이후 전신(whole-body) 모방학습 연구들이 이 논문의 16차원 행동 concat 방식을 기본 베이스라인으로 채택'
],

pitfalls:[
 '**co-training이 모든 알고리즘에 똑같이 도움되지 않는다.** VINN + Chunking은 co-training으로 오히려 태스크에 따라 결과가 엇갈렸다 — 검색 기반 방법은 표현 학습 방식이 달라 이득이 일정하지 않다.',
 '**50개 시연은 diffusion 계열에는 적을 수 있다.** 논문은 Diffusion Policy가 보통 250개 이상 시연으로 학습되는데 여기서는 50개뿐이라, Wipe Wine 등 일부 태스크에서 성능이 낮게 나온 원인으로 이를 지목한다.',
 '**정적 ALOHA 데이터와 Mobile ALOHA 데이터는 태스크·팔 장착 위치가 다르다.** "같은 로봇의 다른 데이터"가 아니라 형상·과제가 어긋난 데이터에서도 전이가 일어난다는 것이 핵심 주장이며, 완전히 동일한 setup 간 전이를 보인 실험이 아니다.'
],

figures:[
 {f:'fig1-overview.png',
  cap:'왼쪽: 조작자가 허리로 이동 베이스에 묶인 채 냉장고에서 재료를 꺼내는 시연 장면 — 두 손은 ALOHA 팔을, 몸은 베이스를 동시에 조종한다. 오른쪽 6장: 학습된 정책이 자율 실행으로 수행하는 새우 조리·의자 밀기·캐비닛 사용·와인 닦기·엘리베이터 호출·하이파이브 태스크.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-hardware.png',
  cap:'왼쪽: 손목 카메라 2개·상단 카메라 1개, 노트북과 배터리팩까지 전부 온보드에 실은 구성. 오른쪽: 원격조작용 리더 팔을 제거하면 자율 실행 시에는 ViperX 300 두 대만 남는다 — 높이 65~200cm, 베이스에서 100cm까지 팔을 뻗을 수 있다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'With 50 demonstrations for each task, co-training can increase success rates by up to 90%, allowing Mobile ALOHA to autonomously complete complex mobile manipulation tasks.',
  src:'Abstract, p.1'},
 {t:'To our knowledge, we are the first to find that co-training with static manipulation datasets improves the performance and data efficiency of mobile manipulation policies.',
  src:'Section 2, p.3'}
],

links:[
 {t:'arXiv 2401.02117 — Mobile ALOHA', u:'https://arxiv.org/abs/2401.02117'},
 {t:'프로젝트 페이지 — mobile-aloha.github.io', u:'https://mobile-aloha.github.io/'}
]
});
