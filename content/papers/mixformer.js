WIKI.paper({
slug:'mixformer',
venue:'CVPR 2022',
authors:'Cui, Jiang, Wang, Wu (Nanjing University)',
arxiv:'2203.11082',

tldr:'특징 추출과 템플릿-탐색영역 정보 통합을 **하나의 attention 연산(MAM)** 으로 합쳐, 백본과 박스 헤드만 남은 단순한 end-to-end 트래커를 만들었다. 별도 통합 모듈 없이 LaSOT·TrackingNet·VOT2020 등 5개 벤치마크에서 당시 최고 성능을 냈다.',

context:'당시 트래커는 거의 모두 "백본 → 통합 모듈 → 헤드" 3단 구조였다. 백본(대개 CNN)이 템플릿과 탐색 영역의 특징을 따로 뽑고, 통합 모듈(상관 연산이나 Transformer)이 둘을 섞은 뒤, 헤드가 박스를 예측한다. [SiamFC](#/p/siamfc)·[SiamRPN++](#/p/siamrpn-pp)는 상관 연산으로, [TransT](#/p/transt)와 STARK는 attention으로 통합했지만 특징 추출 단계는 여전히 타깃을 모르는 CNN이었다. 저자들은 이 CNN 표현이 일반 물체 인식용으로 사전학습돼 추적에 필요한 세밀한 구조를 놓치고, 국소 커널이라 전역 모델링도 약하다고 진단한다. 그래서 attention의 유연성을 이용해 추출과 통합을 한 단계로 묶자고 제안한다.',

ideas:[
 {h:'MAM: self-attention과 cross-attention을 한 번에',
  lead:'템플릿·탐색 토큰을 이어 붙여 attention하면 자기 특징 추출과 상호 통합이 동시에 된다.',
  d:'MAM은 템플릿 토큰과 탐색 토큰 각각이 query가 되어, key·value는 두 시퀀스를 이어 붙인 것에 대해 attention한다. 같은 시퀀스 안에서는 self-attention(자기 특징 추출), 다른 시퀀스를 향해서는 cross-attention(타깃-탐색 소통)이 된다. 입력 토큰은 먼저 2D 맵으로 되돌려 depth-wise conv로 q·k·v를 만든다. 위치 인코딩은 쓰지 않고 이 conv가 공간 구조를 담당한다.'},
 {h:'3단 계층 백본: 매 층에서 타깃을 안다',
  lead:'Patch Embedding과 MAM을 3개 stage로 쌓아 모든 깊이에서 타깃 정보가 섞이게 했다.',
  d:'백본은 CvT를 따른 3 stage 구조로, 각 stage는 overlapped patch embedding(stride 4, 이후 2배씩 축소)과 $N_i$개의 MAM+MLP로 이루어진다. 입력은 128×128 템플릿 T장과 320×320 탐색 영역이다. 특징이 층마다 타깃 조건부로 만들어지므로 마지막에 따로 통합할 필요가 없다. 멀티스케일 특징 집계도 쓰지 않고 마지막 stage의 탐색 토큰만 헤드로 보낸다.'},
 {h:'비대칭 MAM: 템플릿→탐색 attention 제거',
  lead:'템플릿 query가 탐색 영역을 보지 않게 막아 템플릿 특징을 고정하고 비용을 줄인다.',
  d:'저자들은 템플릿에서 탐색 영역으로 향하는 cross-attention이 중요하지 않고 방해물(distractor)의 영향만 받을 수 있다고 본다. 이를 제거하면 템플릿 토큰이 탐색 프레임과 무관하게 불변이 되어, 온라인 템플릿을 여러 장 쓰는 비용이 줄어든다. 탐색 query는 템플릿과 탐색 양쪽을 그대로 본다.'},
 {h:'점수 예측 모듈로 온라인 템플릿 선별',
  lead:'score token이 템플릿 품질을 예측해 나쁜 온라인 템플릿으로 갱신하지 않는다.',
  d:'SPM은 학습 가능한 score token이 탐색 RoI 토큰과 초기 템플릿 토큰에 차례로 attend한 뒤 MLP와 sigmoid로 점수를 낸다. 점수가 0.5 미만이면 부정적 템플릿으로 본다. 추론 때는 갱신 주기(기본 200 프레임) 동안 점수가 가장 높은 샘플을 새 온라인 템플릿으로 쓴다. SPM은 백본 학습이 끝난 뒤 별도로 학습한다.'}
],

diagram:{type:'compare', cap:'기존 3단 파이프라인과 MixFormer의 비교. 핵심은 통합 모듈이 사라지고 백본 안에서 추출과 통합이 함께 일어난다는 점이다.',
 left:{t:'기존: 3단 구조', items:['CNN이 템플릿·탐색 따로 추출','별도 통합 모듈(상관/attention)','헤드가 박스 예측','추출 특징은 타깃을 모름']},
 right:{t:'MixFormer', items:['MAM 백본이 추출+통합 동시에','통합 모듈 없음','코너 헤드 하나로 박스 예측','매 층 특징이 타깃 조건부']}},

math:[
 {tex:'\\begin{aligned}k_m&=[k_t;k_s],\\; v_m=[v_t;v_s]\\\\ \\text{Attn}_t&=\\text{softmax}\\!\\left(\\frac{q_t k_m^{\\top}}{\\sqrt{d}}\\right)v_m,\\;\\; \\text{Attn}_s=\\text{softmax}\\!\\left(\\frac{q_s k_m^{\\top}}{\\sqrt{d}}\\right)v_m\\end{aligned}',
  expr:'k_m=[k_t;k_s], v_m=[v_t;v_s]; Attn_t=softmax(q_t k_mᵀ/√d)v_m; Attn_s=softmax(q_s k_mᵀ/√d)v_m',
  d:'Mixed attention. 아래 첨자 t는 템플릿, s는 탐색 영역이다. $q_t k_t^{\\top}$ 항이 템플릿 자기 특징, $q_t k_s^{\\top}$ 항이 템플릿-탐색 소통이다.'},
 {tex:'\\text{Attn}_t=\\text{softmax}\\!\\left(\\frac{q_t k_t^{\\top}}{\\sqrt{d}}\\right)v_t',
  expr:'Attn_t = softmax(q_t k_tᵀ/√d) v_t',
  d:'비대칭 MAM에서 바뀌는 부분. 템플릿 query는 템플릿 key·value만 본다. 탐색 쪽 식은 그대로다.'},
 {tex:'L_{loc}=\\lambda_{L1}L_1(B,\\hat B)+\\lambda_{giou}L_{giou}(B,\\hat B)',
  expr:'L_loc = 5·L1 + 2·GIoU',
  d:'박스 회귀 손실. 논문은 $\\lambda_{L1}=5$, $\\lambda_{giou}=2$ 를 쓴다.'}
],

numbers:[
 {k:'LaSOT · MixFormer-L (AUC / PNorm)', v:'70.1 / 79.9', d:'Table 3. STARK 대비 PNorm +2.9%라고 본문이 밝힌다. 멀티레이어 특징 집계 없이 얻은 값'},
 {k:'TrackingNet · MixFormer-L (AUC / PNorm)', v:'83.9 / 88.9', d:'Table 3. 초록 요약의 88.9%는 이 PNorm 값'},
 {k:'VOT2020 · MixFormer-L EAO', v:'0.555', d:'Table 1. AlphaRefine으로 마스크를 예측한 설정. STARK는 0.505'},
 {k:'속도 (GTX 1080Ti)', v:'MixFormer 25 FPS / MixFormer-L 18 FPS', d:'Table 2. 입력 템플릿 128×128, 탐색 320×320'},
 {k:'통합 방식 ablation (LaSOT AUC)', v:'분리 60.5 → 동시 68.4', d:'Table 4 #2(SAM 백본+CAM 3개) 대비 #8(MAM 21개). 매개변수와 FLOPs는 오히려 더 작다'},
 {k:'비대칭 MAM 효과', v:'19 → 25 FPS, AUC 68.4 → 68.1', d:'Table 5. 약간의 정확도를 주고 속도를 얻는 선택'}
],

impact:'추출과 통합을 분리하지 않아도, 아니 분리하지 않을 때 더 좋다는 것을 보여 SOT의 표준 구조를 흔들었다. CNN 백본 + Transformer 통합이라는 하이브리드를 벗어나 하나의 Transformer 백본이 템플릿과 탐색 영역을 함께 처리하는 흐름을 열었다. 같은 시기에 나온 [OSTrack](#/p/ostrack)이 이 방향을 더 단순한 ViT로 구현했고, 이후 [SUTrack](#/p/sutrack) 같은 통합 트래커도 이 계열을 이었다.',

legacy:[
 '**[OSTrack](#/p/ostrack)**: 같은 문제의식을 이어 CvT 대신 평범한 ViT와 MAE 사전학습으로 one-stream 구조를 구현했다',
 '**[SUTrack](#/p/sutrack)**: 단일 모델로 여러 추적 과제를 다루는 통합 트래커로, OSTrack과 함께 MixFormer를 부모로 삼는다',
 '**one-stream 비교의 표준 항목**: [SAMURAI](#/p/samurai) 논문의 비교표에서도 MixFormer288이 지도학습 트래커로 올라 있다',
 '**[TransT](#/p/transt)의 후속**: 두 단계 attention(ECA+CFA)을 한 번의 mixed attention으로 대체한 구조라는 점에서 한 단계 더 단순화했다'
],

pitfalls:[
 '**"CNN을 쓰지 않는다"는 아니다.** 백본은 CvT 계열(convolutional token embedding과 depth-wise conv 투영)이라 conv가 곳곳에 남아 있다. 순수 attention 네트워크는 아니다.',
 '**Table 2의 "MACs 35.61 M"은 표기 오류에 가깝다.** Table 4의 매개변수 수(Base 35.97M)와 비슷한 값이라 파라미터 수로 읽는 편이 자연스럽다. FLOPs는 23.04G다.',
 '**VOT2020 수치는 박스 추적기가 아니라 마스크 출력 설정이다.** 저자들이 AlphaRefine으로 마스크를 예측했으므로 다른 벤치마크의 박스 지표와 같은 축으로 비교하면 안 된다.'
],

figures:[
 {f:'fig3-architecture.png',
  cap:'왼쪽부터 3개 stage. 각 stage에서 템플릿(분홍)과 탐색(청록) 토큰을 이어 붙여 Target-Search MAM에 넣고, 마지막에 코너 헤드가 박스를 낸다. 토큰 해상도가 H/4→H/8→H/16, 채널이 C→3C→6C로 변하는 점을 본다.',
  src:'원문 Figure 3, p.4'}
],

quotes:[
 {t:'Our core idea is to utilize this flexibility of attention operation, and present a mixed attention module (MAM) that performs both of feature extraction and mutual interaction of target template and search area at the same time.',
  src:'Introduction, p.2'}
],

links:[
 {t:'arXiv 2203.11082 — MixFormer', u:'https://arxiv.org/abs/2203.11082'},
 {t:'GitHub — MCG-NJU/MixFormer', u:'https://github.com/MCG-NJU/MixFormer'}
]
});
