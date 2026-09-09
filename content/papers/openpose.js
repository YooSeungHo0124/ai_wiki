WIKI.paper({
slug:'openpose',
venue:'CVPR 2017',
authors:'Cao, Simon, Wei, Sheikh (Carnegie Mellon University)',
arxiv:'1611.08050',

tldr:'여러 사람의 2D 관절을 **한 번의 forward pass**로 검출하고 연결하는 상향식(bottom-up) 방법. Part Affinity Fields라는 벡터장으로 "이 팔꿈치와 이 손목이 같은 사람 것"을 계산해, 사람 수가 늘어도 실행 시간이 거의 늘지 않는다.',

context:'2017년 이전 다중 인물 자세 추정은 대부분 **하향식(top-down)**이었다. 사람 검출기로 각자를 박스로 자른 뒤, 박스마다 단일 인물 자세 추정기를 돌린다. 문제는 두 가지다. 검출기가 겹친 사람을 놓치면 그 사람은 처음부터 복구가 불가능하고, 계산량이 **사람 수에 비례**해 늘어난다. [Pishchulin](#/p/fcn) 계열의 상향식 시도도 있었지만, 관절 후보를 사람별로 묶는 마지막 단계가 완전 그래프 위의 정수계획법(ILP)이라 이미지 한 장에 수 분이 걸렸다. 관절을 빠르고 정확하게 검출하는 것과, 그것들을 사람별로 묶는 것 — 이 두 문제를 **동시에, 빠르게** 푸는 방법이 없었다.',

ideas:[
 {h:'Part Affinity Fields: 관절 사이를 잇는 방향 벡터장',
  lead:'각 팔다리마다 위치와 방향을 담은 2D 벡터장을 예측해 연결 후보를 점수로 채점한다.',
  d:'단순히 "이 팔꿈치와 저 손목이 같은 사람"이라고 이진 분류하는 대신, 팔다리를 잇는 선분 위 모든 픽셀에 그 팔다리의 방향을 가리키는 2D 벡터를 채운다. 두 관절 후보를 잇는 선분을 따라 PAF를 선적분하면, 실제 팔다리 위를 지날 때는 방향이 일치해 값이 크고 엉뚱한 조합은 값이 작다. 팔이 겹쳐도 각 팔의 벡터장이 분리돼 있어 헷갈리지 않는다.'},
 {h:'두 branch·다단계 CNN으로 검출과 연결을 동시에 학습',
  lead:'같은 네트워크의 두 branch가 각각 관절 신뢰도맵과 PAF를 병렬로 반복 정제한다.',
  d:'[VGG-19](#/p/vgg)의 앞 10개 층으로 얻은 특징맵 F 위에, branch 1은 관절별 신뢰도맵 $S^t$, branch 2는 팔다리별 PAF $L^t$ 를 예측한다. 각 stage의 출력과 원본 특징 F를 이어붙여 다음 stage에 넣는 방식으로 [Convolutional Pose Machines](#/p/fcn) 의 반복 정제 구조를 그대로 물려받았다. 두 branch가 같은 특징을 공유하므로 신체 부위끼리의 전역 맥락이 자연스럽게 섞인다.'},
 {h:'이분 매칭으로 그리디하게 사람을 조립한다',
  lead:'완전 그래프 대신 트리 구조로 문제를 쪼개 이분 매칭을 팔다리별로 독립 실행한다.',
  d:'모든 관절 쌍을 완전 그래프로 묶으면 NP-hard ILP가 된다. 이 논문은 사람 골격을 트리로 근사하고, PAF 점수가 가장 큰 조합을 팔다리 종류별로 독립적인 **이분 매칭** 문제로 풀어 그리디하게 연결한다. 전역 최적해가 아님에도 CNN의 넓은 수용영역 덕분에 비인접 관절 사이의 관계까지 PAF에 이미 녹아있어, 정확도 손실 없이 계산량을 완전 그래프 대비 수 자릿수 줄인다.'},
 {h:'런타임이 사람 수와 거의 무관하다',
  lead:'CNN 처리는 $O(1)$, 파싱만 $O(n^2)$인데 파싱 비중이 CNN 대비 두 자릿수 작다.',
  d:'하향식 방법은 사람이 늘수록 단일 인물 추정을 그만큼 더 돌려야 해 런타임이 사람 수에 비례한다. 이 방법은 이미지 전체를 한 번만 CNN에 통과시키므로 CNN 처리 시간이 사람 수와 무관한 $O(1)$이다. 사람 수에 의존하는 이분 매칭 파싱 단계는 $O(n^2)$ 이지만 CNN 처리 시간보다 두 자릿수 작아 전체 런타임을 거의 좌우하지 못한다.'}
],

diagram:{type:'flow', cap:'입력 이미지 한 장이 두 branch를 거쳐 사람별 골격으로 조립되는 과정.',
 nodes:[
  {t:'입력 이미지', s:'w × h'},
  {t:'VGG-19 특징', s:'앞 10개 층'},
  {t:'신뢰도맵 branch', s:'관절 위치 S'},
  {t:'PAF branch', s:'팔다리 벡터장 L', acc:true},
  {t:'이분 매칭', s:'그리디 연결'},
  {t:'사람별 골격', s:'수 무관 실시간'}
 ]},

math:[
 {expr:'E = ∫[u=0..1] Lc(p(u)) · (d_j2 - d_j1)/|d_j2 - d_j1| du',
  tex:'E=\\int_{u=0}^{1} L_c\\big(p(u)\\big)\\cdot\\frac{d_{j2}-d_{j1}}{\\lVert d_{j2}-d_{j1}\\rVert}\\,du',
  d:'두 관절 후보 $d_{j1}, d_{j2}$ 를 잇는 선분 $p(u)$ 위에서 PAF $L_c$ 를 선분 방향으로 선적분한 값이 그 연결의 점수 $E$ 다. 실제 팔다리 위에서는 PAF 방향과 선분 방향이 일치해 적분값이 크다.'},
 {expr:'f_S^t = Σ_j Σ_p W(p)·‖S_j^t(p) − S_j*(p)‖²,  f_L^t = Σ_c Σ_p W(p)·‖L_c^t(p) − L_c*(p)‖²',
  tex:'f_{S}^{t}=\\sum_j\\sum_p W(p)\\lVert S_j^{t}(p)-S_j^{*}(p)\\rVert^2,\\quad f_{L}^{t}=\\sum_c\\sum_p W(p)\\lVert L_c^{t}(p)-L_c^{*}(p)\\rVert^2',
  d:'각 stage 끝마다 두 branch에 각각 $L_2$ loss를 걸어 중간 감독(intermediate supervision)을 준다. $W(p)$는 라벨이 없는 영역의 손실을 0으로 죽이는 공간 가중치.'}
],

numbers:[
 {k:'MPII mAP (스케일 탐색)', v:'75.6%', d:'스케일 탐색(×0.7, ×1, ×1.3) 적용 시. 무탐색이어도 기존 최고 대비 **+13%p**'},
 {k:'MPII 288장 서브셋 대비', v:'+8.5% mAP', d:'기존 상향식 최고 방법 대비, 추론 시간은 **6자릿수** 더 짧음'},
 {k:'COCO 2016 challenge', v:'1위', d:'첫 회 COCO keypoints challenge 우승'},
 {k:'백본', v:'VGG-19 앞 10층', d:'특징 추출 F. 이후 두 branch로 분기'},
 {k:'파싱 vs CNN 시간', v:'9명 기준 0.58ms', d:'CNN 처리 시간 대비 **두 자릿수** 작음(GTX-1080)'}
],

impact:'"검출 따로, 연결 따로"였던 다중 인물 자세 추정을 **하나의 완전 컨볼루션 forward pass**로 합쳤다. 사람 수에 실행 시간이 거의 영향받지 않는다는 점이 실용성을 결정지어, 이후 스포츠 분석·모션 캡처·행동 인식 파이프라인의 표준 전처리로 자리잡았다. PAF라는 "관계를 벡터장으로 인코딩한다"는 아이디어 자체도 자세 추정을 넘어 다른 관계 추정 문제에 참고 사례가 됐다.',

legacy:[
 '**하향식과의 경쟁 구도** — 이후 자세 추정 연구는 상향식(OpenPose 계열)과 하향식(HRNet 등)으로 계속 갈라져 발전',
 '**멀티태스크 dense 예측의 원형** — "한 백본에서 여러 종류의 dense map을 동시에 뽑는다"는 구조가 [RAFT](#/p/raft)의 흐름장, [Depth Anything](#/p/depth-anything)의 깊이맵처럼 픽셀 단위 회귀 과제 전반의 표준 패턴이 됨',
 '**전신 캡처로 확장** — 손·얼굴 keypoint까지 더한 OpenPose 후속 버전이 모션 캡처 없이 영상만으로 전신을 복원하는 실무 도구로 정착',
 '**Vision Transformer 이후에도 생존** — [ViT](#/p/vit) 기반 pose 모델이 나온 뒤에도 PAF의 "관계를 벡터장으로 표현한다"는 발상은 keypoint 연결 문제의 참고 표준으로 남음'
],

pitfalls:[
 '**"완전한 실시간"은 원 논문 기준 저해상도·특정 GPU 조건이다.** 368×654로 리사이즈한 뒤 GTX-1080 기준 수치이며, 고해상도 원본이나 최신 대형 모델 기준으로 그대로 일반화할 수 없다.',
 '**그리디 파싱은 전역 최적이 아니다.** 트리 근사와 이분 매칭은 계산량을 크게 줄이지만, 심하게 겹친 사람들에서는 팔다리가 다른 사람에게 잘못 연결되는 실패가 실제로 보고된다(원문 Fig. 9).',
 '**PAF가 곧 3D 자세는 아니다.** 이 논문은 2D 이미지 평면 위의 keypoint와 연결만 다루며, 깊이·3D 관절 각도는 별도 후처리나 다른 모델의 몫이다.'
],

figures:[
 {f:'fig2-pipeline.png',
  cap:'(a) 입력 이미지 한 장이 (b) 관절별 신뢰도맵과 (c) 팔다리별 PAF로 동시에 나온 뒤 (d) 이분 매칭으로 연결 후보를 고르고 (e) 사람별 골격으로 조립되는 전체 파이프라인. PAF(c)의 화살표가 팔다리 방향을 인코딩한다는 점이 핵심.',
  src:'원문 Figure 2, p.2'},
 {f:'fig3-architecture.png',
  cap:'위 branch 1(주황)은 신뢰도맵 $S^t$, 아래 branch 2(파랑)는 PAF $L^t$ 를 예측한다. Stage 1(왼쪽)의 출력과 원본 특징 F가 합쳐져 Stage t(오른쪽, 점선 박스가 반복 단위)로 들어가며 반복적으로 정제된다.',
  src:'원문 Figure 3, p.2'}
],

quotes:[
 {t:'We present an approach to efficiently detect the 2D pose of multiple people in an image. The approach uses a non-parametric representation, which we refer to as Part Affinity Fields (PAFs), to learn to associate body parts with individuals in the image.',
  src:'Abstract, p.1'},
 {t:'the runtime of our bottom-up approach increases relatively slowly with the increasing number of people.',
  src:'Section 3.3, p.9'}
],

links:[
 {t:'arXiv 1611.08050 — Realtime Multi-Person 2D Pose Estimation using Part Affinity Fields', u:'https://arxiv.org/abs/1611.08050'},
 {t:'CMU-Perceptual-Computing-Lab/openpose (공식 코드)', u:'https://github.com/CMU-Perceptual-Computing-Lab/openpose'}
]
});
