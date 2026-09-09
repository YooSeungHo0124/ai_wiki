WIKI.paper({
slug:'timesformer',
venue:'ICML 2021',
authors:'Bertasius, Wang, Torresani (Facebook AI)',
arxiv:'2102.05095',

tldr:'비디오 분류에서 convolution을 완전히 없애고 [ViT](#/p/vit) 스타일 self-attention만으로 시공간을 모델링한 논문. 핵심은 **시간 attention과 공간 attention을 분리**(divided space-time attention)하면 합동(joint) attention보다 빠르면서 정확도도 더 높다는 발견이다.',

context:'2021년 초까지 비디오 인식은 여전히 3D convolution의 영역이었다. [I3D](#/p/i3d)와 [SlowFast](#/p/slowfast)가 최고 성능을 내고 있었지만, 3D conv는 지역적 수용영역(local receptive field)만 보기 때문에 멀리 떨어진 프레임 간의 관계를 포착하려면 층을 아주 깊게 쌓아야 한다. 같은 시기 ViT는 이미지에서 convolution 없이 self-attention만으로 경쟁력 있는 성능을 보였다. 문제는 비디오의 모든 시공간 패치를 하나의 attention에 합동으로 넣으면 패치 수가 프레임 수 $F$ 배로 늘어 계산량이 $O((FN)^2)$ 로 폭발한다는 점이다. 이 논문은 "convolution 없이, 그리고 합동 attention의 비용 없이 시공간을 attention만으로 모델링할 수 있는가"를 묻는다.',

ideas:[
 {h:'Divided Space-Time Attention',
  lead:'시간 attention을 먼저 하고 공간 attention을 이어서 해 계산량을 줄인다.',
  d:'각 블록에서 쿼리 패치가 먼저 **같은 공간 위치의 다른 프레임들**(시간 축)과만 attention을 계산하고, 그 결과를 다시 **같은 프레임 안의 모든 패치**(공간 축)와 attention을 계산한다. 패치당 비교 횟수가 합동 attention의 $NF+1$ 에서 $N+F+2$ 로 줄어든다. 시간·공간마다 별도의 $W_Q, W_K, W_V$ 를 학습해 표현력도 늘어난다.'},
 {h:'ViT의 패치 토큰화를 프레임 시퀀스로 확장',
  lead:'각 프레임을 16×16 패치로 자르고 프레임 인덱스까지 위치 임베딩에 넣는다.',
  d:'$H\\times W\\times 3\\times F$ 클립을 프레임별로 $P\\times P$ 패치로 나눠 선형 투영한 뒤, 공간 위치와 프레임 인덱스를 모두 반영하는 위치 임베딩을 더한다. classification 토큰 하나를 앞에 붙이는 것까지 ViT와 동일하다 — 즉 아키텍처 자체는 새로 만들지 않고, **attention이 보는 이웃(neighborhood)만** 다섯 가지로 바꿔가며 비교한다.'},
 {h:'다섯 가지 attention 이웃을 직접 대조 실험',
  lead:'Space·Joint·Divided·Sparse(L+G)·Axial(T+W+H) 다섯을 같은 조건에서 비교한다.',
  d:'공간만 보는 Space, 전부 합쳐 보는 Joint Space-Time, 시공간을 축별로 나눠 보는 Axial(T+W+H), 지역+전역만 보는 Sparse Local Global, 그리고 제안하는 Divided(T+S)를 Kinetics-400·Something-Something-V2에서 나란히 학습·평가한다. Space는 시간 정보가 아예 없어 SSv2(시간 추론이 필수인 데이터셋)에서 큰 폭으로 뒤처진다.'},
 {h:'이미지 사전학습을 그대로 재사용',
  lead:'ImageNet으로 학습한 ViT 가중치를 초기화로 쓰고 시간 attention만 새로 학습한다.',
  d:'시간 attention의 query/key/value 투영은 0으로 초기화하고, 나머지는 ImageNet-1K/21K로 사전학습된 ViT 가중치를 그대로 가져온다. 비디오 데이터셋만으로 처음부터 학습하기엔 데이터가 부족하다는 문제를, [I3D](#/p/i3d)가 2D 필터를 팽창(inflate)시켰던 것과는 다른 방식 — **가중치는 그대로 두고 새 attention 경로만 추가**하는 방식으로 우회한 것이다.'},
 {h:'긴 영상으로의 확장성',
  lead:'프레임 수가 늘어도 divided attention은 비용이 선형에 가깝게 증가한다.',
  d:'joint attention은 프레임 수·해상도가 늘면 TFLOPs가 급격히 커져 GPU 메모리가 넘치는 반면, divided attention은 완만하게 증가한다. 이 덕분에 TimeSformer는 1분 넘는 길이의 클립까지 한 번에 처리할 수 있음을 보였다 — 3D CNN이 다루기 어려운 영역이다.'}
],

diagram:{type:'compare', cap:'같은 블록 구조에서 attention이 보는 이웃만 다르다. Divided는 Time Att.와 Space Att.를 순서대로 통과시켜 합동 attention보다 비교 횟수를 줄인다.',
 left:{t:'Joint Space-Time', items:['모든 시공간 패치와 한번에 attention','비교 NF+1회, 메모리 폭증','긴 클립에서 OOM 발생']},
 right:{t:'Divided Space-Time', items:['시간 attention 후 공간 attention','비교 N+F+2회로 대폭 절감','정확도도 Joint보다 높음']}},

math:[
 {expr:'α(p,t) = softmax( q(p,t)ᵀ · [k(0,0), {k(p′,t′)}] / √D_h )',
  tex:'\\boldsymbol{\\alpha}_{(p,t)}^{(\\ell,a)}=\\text{SM}\\!\\left(\\frac{\\mathbf{q}_{(p,t)}^{(\\ell,a)\\top}}{\\sqrt{D_h}}\\cdot\\left[\\mathbf{k}_{(0,0)}^{(\\ell,a)}\\left\\{\\mathbf{k}_{(p\\prime,t\\prime)}^{(\\ell,a)}\\right\\}_{p\\prime=1,\\dots,N}^{t\\prime=1,\\dots,F}\\right]\\right)',
  d:'합동 space-time attention의 정의. 쿼리 패치 $(p,t)$ 가 클래스 토큰과 $N\\times F$ 개 패치 전체의 key와 내적한다 — 이 항 하나가 비용의 근원이다.'},
 {expr:'α_time(p,t) = softmax( q(p,t)ᵀ · [k(0,0), {k(p,t′)}_{t′=1..F}] / √D_h )',
  tex:'\\boldsymbol{\\alpha}^{(\\ell,a)\\text{time}}_{(p,t)}=\\text{SM}\\!\\left(\\frac{\\mathbf{q}_{(p,t)}^{(\\ell,a)\\top}}{\\sqrt{D_h}}\\cdot\\left[\\mathbf{k}_{(0,0)}^{(\\ell,a)}\\left\\{\\mathbf{k}_{(p,t\\prime)}^{(\\ell,a)}\\right\\}_{t\\prime=1,\\dots,F}\\right]\\right)',
  d:'divided attention의 시간 단계. 같은 공간 위치 $p$ 를 고정하고 프레임 축 $t\\prime$ 만 훑는다 — 비교 대상이 $F$ 개로 줄어든다. 이 결과가 이어서 공간 attention(같은 프레임 내 $N$개 패치)의 입력이 된다.'}
],

numbers:[
 {k:'Kinetics-400 top-1', v:'78.0%', d:'Divided Space-Time, 파라미터 121.4M — 다섯 스킴 중 최고'},
 {k:'Joint Space-Time', v:'77.4%', d:'파라미터는 Divided보다 적은 85.9M인데도 정확도는 더 낮음'},
 {k:'SSv2 top-1', v:'59.5%', d:'Something-Something-V2. Space-only는 36.6%로 크게 뒤처짐 — 시간 모델링이 필수임을 보여줌'},
 {k:'추론 비용', v:'0.59 TFLOPs', d:'SlowFast R50(1.97 TFLOPs)의 약 1/3, 유사 정확도(76.4% vs 77.4%)에서'},
 {k:'TimeSformer-L', v:'80.7% (K400)', d:'ImageNet-21K 사전학습, 96프레임 사용 — 논문 최고 성능 구성'},
 {k:'학습 시간', v:'416h vs SlowFast 6336h', d:'같은 K400 학습에서 SlowFast R50 대비 약 15배 빠름'}
],

impact:'Convolution 없이 attention만으로 비디오 분류 SOTA급 성능을 낼 수 있음을 보여, 비디오 아키텍처 연구의 무게중심을 3D CNN에서 Transformer로 옮겼다. "이미지 사전학습을 재사용하고 시간 축은 별도 층으로 추가"하는 이 논문의 레시피는 이후 영상 이해뿐 아니라 [video diffusion](#/p/video-diffusion) 계열의 생성 모델에서도 반복적으로 등장하는 패턴이 되었다. Divided attention이 joint attention보다 **정확도까지 더 높다**는 결과는 이후 여러 비디오·3D Transformer 설계에서 시공간 분해가 단순 근사가 아니라 더 나은 귀납 편향일 수 있음을 시사했다.',

legacy:[
 '**마스킹 사전학습으로 확장** — [VideoMAE](#/p/videomae)가 TimeSformer류 space-time attention 백본 위에 극단적 마스킹 자기지도학습을 얹었다',
 '**효율적 attention 분해의 표준화** — ViViT 등 이후 비디오 Transformer들이 공간/시간 분해, factorized encoder 등 유사한 분해 전략을 채택',
 '**Transformer 기반 비디오 생성으로 이식** — 시공간 attention 분해 아이디어가 비디오 diffusion·비디오 생성 모델의 temporal layer 설계에 흘러들어갔다',
 '**긴 시퀀스 처리의 선례** — 1분 이상 클립을 한 모델로 다룰 수 있다는 결과가 이후 장편 비디오 이해 연구의 출발점이 됨'
],

pitfalls:[
 '**Kinetics 정확도만으로 "시간 모델링을 잘한다"고 단정하면 안 된다.** Space-only(시간 정보 전무)도 K400에서 76.9%를 내는데, 이는 Kinetics가 외형(배경·객체)만으로도 상당수 맞힐 수 있는 **외형 편향(appearance bias)**을 갖고 있기 때문이다. 반면 SSv2는 Space-only가 36.6%까지 떨어져 진짜 시간적 추론을 요구한다 — 두 벤치마크를 함께 봐야 한다.',
 '**Joint attention이 파라미터는 더 적은데 정확도가 낮다는 결과를 "얕은 모델이라 그렇다"고 오해하기 쉽다.** 실제로는 divided attention이 시간·공간에 각각 독립된 $W_Q,W_K,W_V$ 를 두어 학습 용량 자체가 더 크기 때문이다.',
 '**TimeSformer가 3D conv보다 항상 저렴한 것은 아니다.** 추론 비용(TFLOPs)은 낮지만, 이는 96프레임처럼 긴 입력에서의 이점이고 짧은 클립·저해상도에서는 격차가 줄어든다.'
],

figures:[
 {f:'fig2-attention-schemes.png',
  cap:'파란 패치가 쿼리, 색칠된 패치가 그 쿼리의 attention 이웃이다. Divided Space-Time(가운데)는 시간축 전체(빨간 세로줄)와 자기 프레임(빨간 격자)을 순서대로 본다 — Joint(왼쪽에서 두 번째)처럼 모든 프레임의 모든 패치를 한 번에 보지 않는다는 차이를 색칠된 영역의 넓이로 비교하라.',
  src:'원문 Figure 2, p.4'},
 {f:'fig1-block-designs.png',
  cap:'다섯 스킴 모두 residual + MLP로 끝나는 같은 블록 규격을 쓴다. 차이는 그 앞의 attention 층 개수와 순서뿐 — Divided(가운데)는 Time Att.와 Space Att. 두 층을 순차로, Axial(오른쪽)은 Time·Width·Height 세 축을 순차로 통과시킨다.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'We propose a more efficient architecture for spatiotemporal attention, named "Divided Space-Time Attention", where temporal attention and spatial attention are separately applied one after the other.',
  src:'Section 3, p.4'}
],

links:[
 {t:'arXiv 2102.05095 — Is Space-Time Attention All You Need for Video Understanding?', u:'https://arxiv.org/abs/2102.05095'},
 {t:'공식 코드 (Facebook Research)', u:'https://github.com/facebookresearch/TimeSformer'}
]
});
