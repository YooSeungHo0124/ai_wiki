WIKI.paper({
slug:'diffmot',
venue:'CVPR 2024',
authors:'Lv, Huang et al. (Shanghai Univ. · NUDT · PAII)',
arxiv:'2403.02075',

tldr:'칼만 필터가 못 따라가는 비선형 움직임(춤, 스포츠)을 **확산 모델로 예측**하는 트래커. 확산 과정을 둘로 쪼개 샘플링을 **1 step**으로 줄여 22.7 FPS로 돌리면서 DanceTrack 62.3 HOTA, SportsMOT 76.2 HOTA를 기록했다.',

context:'[SORT](#/p/sort) 이래 tracking-by-detection 트래커는 칼만 필터(KF)로 다음 프레임 위치를 예측하고 검출과 맞춰 왔다. KF는 짧은 시간 동안 속도와 방향이 일정하다고 가정하므로 보행자 위주의 MOT17에서는 잘 맞는다. 그러나 [DanceTrack](#/p/dancetrack)의 무용수나 SportsMOT의 선수는 가속·감속과 급격한 방향 전환이 잦아 예측이 빗나간다. LSTM·MLP 같은 단순 신경망은 성능이 모자랐고, optical flow나 Transformer 기반 예측기는 FPS가 낮았다. 필요한 것은 비선형 움직임을 정확히 맞히면서도 실시간으로 도는 모션 예측기였다. 한편 확산 모델은 분포를 잘 맞추지만 원래 샘플링에 수백~수천 step이 필요해 추적 루프에 넣기 어려웠다.',

ideas:[
 {h:'모션 예측을 조건부 생성 문제로',
  lead:'다음 프레임의 박스 변화량을 노이즈에서 생성하고, 과거 궤적을 조건으로 준다.',
  d:'박스 $B_f=(x,y,w,h)$ 의 프레임 간 차이 $M_f=B_f-B_{f-1}$ 를 깨끗한 데이터로 보고, 표준 정규 분포 샘플에서 이 $M_f$ 를 복원하도록 학습한다. 조건은 직전 $n=5$ 프레임의 박스와 변화량을 이은 $C_f\\in\\mathbb{R}^{n\\times 8}$ 이다. 개별 궤적 하나를 외삽하는 대신 데이터셋 전체의 움직임 분포를 학습하고, 추론 때 그 객체의 이력으로 분포를 좁힌다.'},
 {h:'D²MP: 분리된 확산으로 1-step 샘플링',
  lead:'데이터→노이즈 과정을 "데이터→0"과 "0→노이즈"로 쪼개 역과정을 해석적으로 푼다.',
  d:'기존 DDM(decoupled diffusion)을 따라 순방향을 $M_{f,t}=M_{f,0}+t\\,c+\\sqrt{t}\\,z$ 로 쓴다. 앞 항은 데이터를 0으로 줄이는 결정적 감쇠이고, 뒤 항은 0에 노이즈를 더하는 부분이다. 상수 $c=-M_{f,0}$ 로 두면 $t=1$ 에서 데이터가 0이 되어 순수 노이즈만 남는다. 역과정이 해석적이므로 수천 step의 수치 적분 없이 한 번에 샘플링할 수 있다.'},
 {h:'한 갈래만 학습하는 단순화',
  lead:'원래는 $c$ 와 $z$ 두 갈래를 학습하지만, $z$ 를 $c$ 로 표현해 한 갈래로 줄인다.',
  d:'$M_{f,t}$ 식에서 $z$ 를 $M_{f,t}$ 와 $c$ 로 풀어 쓸 수 있으므로 네트워크는 $c_\\Theta$ 하나만 예측하면 된다. 이 한 갈래(OB) 구조는 두 갈래(TB)보다 빠를 뿐 아니라 성능도 높았다. 손실은 $c_\\Theta$ 와 정답 $c$ 사이의 smooth L1이다.'},
 {h:'HMINet: 이력을 조건으로 주입하는 네트워크',
  lead:'self-attention으로 이력을 요약한 뒤 노이즈 입력에 scale·shift로 섞는다.',
  d:'$C_f$ 에 학습 가능한 class token(512차원)을 붙여 6층 MHSA에 통과시키고, 갱신된 토큰을 조건 임베딩 $E_{ce}$ 로 쓴다. motion fusion layer가 $E_{ce}$ 에서 scale·shift 계수를 뽑아 노이즈 섞인 모션 특징을 변조하고, 다시 MHSA와 MLP를 거쳐 $c_\\Theta$ 를 낸다. 모듈 전체가 작아 추적 한 프레임당 비용이 크지 않다.'},
 {h:'연관은 ByteTrack 방식을 그대로',
  lead:'예측 박스를 높은 점수 검출과 먼저, 낮은 점수 검출과 IoU로 다시 매칭한다.',
  d:'연관 단계는 [ByteTrack](#/p/bytetrack)과 같은 2단계 구조이고 임계값은 $\\tau_{high}=0.6$, $\\tau_{low}=0.4$ 이다. 1단계 비용은 Re-ID 거리와 IoU를 섞고 [BoT-SORT](#/p/botsort)의 동적 외형 갱신·적응형 가중을 쓴다. 이 논문이 바꾼 부분은 연관이 아니라 예측기 하나이다.'}
],

diagram:{type:'flow', cap:'DiffMOT의 프레임당 처리. 칼만 필터 자리에 D²MP가 들어가고, 정규 분포 샘플 한 번으로 다음 박스를 만든다.',
 nodes:[
  {t:'YOLOX 검출', s:'프레임 f'},
  {t:'과거 궤적', s:'직전 n=5 프레임', a:'조건'},
  {t:'D²MP', s:'1-step 샘플링', acc:true, a:'예측 박스'},
  {t:'2단계 매칭', s:'ByteTrack 방식'},
  {t:'궤적 갱신', s:'다음 프레임으로'}
 ]},

math:[
 {tex:'M_{f,t}=M_{f,0}+t\\,c+\\sqrt{t}\\,z,\\quad c=-M_{f,0},\; z\\sim\\mathcal{N}(0,I)',
  expr:'M_t = M_0 + t·c + √t·z, c = -M_0',
  d:'순방향 과정. 두 번째 항이 데이터를 선형으로 0까지 줄이고, 세 번째 항이 노이즈를 키운다. $t=1$ 에서 $M_{f,1}=z$ 이다.'},
 {tex:'\\mu_\\Theta=\\frac{t-\\Delta t}{t}M_{f,t}-\\frac{\\Delta t}{t}\\,c_\\Theta',
  expr:'μ_Θ = ((t-Δt)/t)·M_t - (Δt/t)·c_Θ',
  d:'역과정 한 걸음의 평균. $z_\\Theta$ 를 $c_\\Theta$ 로 치환한 결과라 네트워크 출력이 $c_\\Theta$ 하나뿐이다.'}
],

numbers:[
 {k:'DanceTrack test · HOTA/IDF1/AssA', v:'62.3 / 63.0 / 47.2', d:'YOLOX-X, RTX 3090에서 22.7 FPS. 같은 표의 Deep OC-SORT는 61.3 / 61.5 / 45.8'},
 {k:'SportsMOT test · HOTA (검출기를 train+val로 학습)', v:'76.2', d:'MixSort-OC 74.1, OC-SORT 73.7. train만으로 학습한 설정에서는 72.1 (OC-SORT 71.9)'},
 {k:'MOT17 test · HOTA/IDF1', v:'64.5 / 79.3', d:'보행자 위주 데이터에서는 SOTA급이되 우위는 아니다. Deep OC-SORT 64.9, SparseTrack 65.1이 더 높다'},
 {k:'모션 모델 비교 (DanceTrack val · HOTA)', v:'KF 46.8 · LSTM 51.2 · Transformer 54.6 · D²MP 55.7', d:'같은 연관 구조에서 예측기만 바꾼 ablation'},
 {k:'샘플링 step (val · HOTA / FPS)', v:'TB 20 step 54.6 / 7.5, OB 1 step 55.7 / 22.7', d:'두 갈래(TB)는 step을 늘려도 한 갈래 1 step을 넘지 못하고 느리다'},
 {k:'검출기별 (test · HOTA / FPS)', v:'YOLOX-S 53.3 / 30.3, YOLOX-X 62.3 / 22.7', d:'검출기를 작게 하면 속도는 오르지만 HOTA가 크게 내려간다'}
],

impact:'DiffMOT는 확산 모델을 MOT의 모션 예측기로 가져온 초기 사례 중 하나이며, 논문 스스로 최초라고 주장한다(동시기 DiffusionTrack은 박스 쌍의 관계를 모델링해 목표가 다르다고 구분한다). 핵심은 확산의 비용을 1-step으로 줄여 추적 루프에 넣을 수 있게 한 점이다. 비선형 움직임이 많은 데이터에서는 KF 계열([OC-SORT](#/p/ocsort) 포함)보다 앞섰다. 반면 MOT17처럼 선형에 가까운 데이터에서는 이득이 작았다.',

legacy:[
 '[OC-SORT](#/p/ocsort)가 KF를 보정해 비선형 문제를 다뤘다면, DiffMOT는 예측기를 학습 모델로 갈아끼우는 방향을 택했다',
 '모션 예측만 학습 모델로 바꾸고 연관은 [ByteTrack](#/p/bytetrack) 그대로 쓴 구조라 다른 SORT 계열에도 같은 식으로 이식할 수 있다',
 '같은 해 나온 [MambaTrack](#/p/mambatrack)도 같은 DanceTrack·SportsMOT 설정에서 학습형 모션 예측기를 쓴다(확산 대신 상태 공간 모델)',
 '[DanceTrack](#/p/dancetrack)의 비선형·유사 외형 환경이 모션 모델 연구의 표준 시험대가 되었다'
],

pitfalls:[
 '**"확산 모델이니 느리다"는 이 논문에는 해당하지 않는다.** 1-step 샘플링이라 느린 것은 오히려 검출기(YOLOX-X)다. 단, 같은 표에서 두 갈래 구조를 20 step 돌리면 7.5 FPS로 떨어진다.',
 '**성능 이득은 예측기뿐 아니라 연관 설정에도 걸려 있다.** 연관은 BoT-SORT의 외형 갱신·적응형 가중을 쓰므로, ablation(예측기만 교체)의 숫자와 test 표의 숫자를 섞어 비교하면 안 된다.',
 '**MOT17에서는 최고가 아니다.** 저자도 비선형 움직임용으로 설계했다고 밝히며 보행자 데이터에서는 비슷한 수준(64.5 HOTA)이라고 쓴다.'
],

figures:[
 {f:'fig2-overall.png',
  cap:'왼쪽 위가 검출, 아래가 과거 궤적. 가운데 D²MP가 궤적을 조건으로 받아 표준 정규 분포에서 샘플링해 예측 박스를 만들고, 오른쪽 연관 단계에서 검출과 매칭해 궤적을 갱신한다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'In these cases, motion predictors based on the constant-velocity assumption may not be accurate anymore.',
  src:'Introduction, p.2'}
],

links:[
 {t:'arXiv 2403.02075 — DiffMOT', u:'https://arxiv.org/abs/2403.02075'},
 {t:'프로젝트 페이지', u:'https://diffmot.github.io/'}
]
});
