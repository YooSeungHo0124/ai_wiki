WIKI.paper({
slug:'craft',
venue:'CVPR 2019',
authors:'Baek, Lee, Han, Yun, Lee (Clova AI Research, NAVER Corp.)',
arxiv:'1904.01941',

tldr:'단어 상자를 직접 회귀하지 않고, **글자 하나하나의 영역(region)**과 **글자 사이 연결(affinity)** 두 히트맵만 예측해 임의 모양의 텍스트를 바닥부터 이어 붙인다. 글자 단위 라벨이 없는 실사진은 학습 중인 모델 스스로 글자 상자를 추정해 채워 넣는다.',

context:'2019년 이전 딥러닝 기반 장면 텍스트 검출은 대부분 **단어 단위 bounding box**를 직접 회귀하거나([SSD](#/p/ssd)·[Faster R-CNN](#/p/faster-rcnn) 계열을 텍스트에 맞게 개조), 단어 영역을 픽셀 단위로 분할했다. 두 방식 모두 휘어지거나(curved) 매우 길거나 임의 방향인 텍스트를 사각형 하나로 표현하려다 실패하는 경우가 많았다. 글자 단위로 보면 이 문제가 자연스럽게 풀리지만, 공개 데이터셋 대부분이 **단어 단위 주석만** 제공해 글자 단위 라벨을 만드는 비용이 걸림돌이었다.',

ideas:[
 {h:'Region score와 Affinity score, 두 히트맵',
  lead:'글자 중심을 가리키는 지도와 글자 사이 공간을 가리키는 지도를 따로 예측한다.',
  d:'네트워크 출력은 두 채널뿐이다. **region score**는 각 픽셀이 글자 중심일 확률, **affinity score**는 인접한 두 글자 사이 공간의 중심일 확률이다. 두 히트맵을 이진화해 연결 요소(connected component)로 묶으면 글자가 자연스럽게 하나의 텍스트로 이어진다 — 단어 상자를 한 번에 회귀하는 대신 **바닥에서부터(bottom-up) 붙여나가는** 접근이다.'},
 {h:'2D 가우시안을 투영해 만드는 소프트 라벨',
  lead:'이진 마스크 대신 가우시안 열지도로 글자 중심의 확신도를 부드럽게 표현한다.',
  d:'글자 상자마다 등방성 2D 가우시안을 원근 변환(perspective transform)으로 왜곡시켜 박아 넣는 방식으로 region/affinity 정답을 만든다. affinity 상자는 인접한 두 글자 상자의 대각선이 만드는 위·아래 삼각형 중심을 꼭짓점으로 잡아 정의한다. 딱딱한 분할 마스크보다 이 표현이 [U-Net](#/p/unet) 스타일 디코더의 학습을 안정시킨다.'},
 {h:'약지도 학습으로 글자 단위 라벨을 스스로 만든다',
  lead:'단어 단위 라벨만 있는 실사진에서, 학습 중인 모델이 글자 경계를 추정해 의사(pseudo) 정답을 생성한다.',
  d:'단어 상자를 잘라낸 이미지에 학습 중인 모델을 돌려 region score를 얻고, watershed 알고리즘으로 글자 영역을 분리해 글자 상자를 만든다. 이렇게 만든 pseudo-GT의 신뢰도는 예측된 글자 수와 실제 단어 길이(전사 텍스트에서 얻음)의 비율로 계산해, 신뢰도가 낮은 샘플은 손실 가중치를 낮추거나 글자 폭을 균등 분할로 대체한다. SynthText로 먼저 50k 스텝을 학습한 뒤 이 절차로 실사진에 파인튜닝한다.'},
 {h:'NMS 없는 후처리 — 연결요소만으로 상자를 만든다',
  lead:'영역 문턱값을 넘는 픽셀을 연결요소로 묶고 최소외접사각형을 씌우면 끝난다.',
  d:'region score가 $\\tau_r$을, affinity score가 $\\tau_a$를 넘는 픽셀을 이진 맵으로 합친 뒤 Connected Component Labeling을 하고, 각 성분에 최소 면적 회전사각형(`minAreaRect`)을 씌운다. Non-Maximum Suppression 같은 별도 후처리가 필요 없다는 것이 저자들이 강조하는 실무적 이점이다. 곡선 텍스트는 글자 영역의 로컬 극대점을 따라가는 중심선을 만들어 다각형(polygon)으로도 뽑아낼 수 있다.'}
],

diagram:{type:'flow', cap:'VGG16-BN 인코더 + U-Net식 디코더가 region·affinity 두 히트맵을 뱉고, 후처리가 이를 상자로 묶는다.',
 nodes:[
  {t:'이미지', s:'h×w×3'},
  {t:'VGG16-BN 인코더', s:'6단 conv stage'},
  {t:'U-Net 디코더', s:'skip 연결', acc:true, a:'업샘플'},
  {t:'출력 히트맵', s:'h/2×w/2×2'},
  {t:'CCL + 최소외접사각형', s:'NMS 불필요'}
 ]},

math:[
 {expr:'confidence(w) = (l(w) - min(l(w), |l(w) - l_c(w)|)) / l(w)',
  tex:'s_{conf}(w)=\\frac{l(w)-\\min\\bigl(l(w),\\,|l(w)-l_c(w)|\\bigr)}{l(w)}',
  d:'실제 단어 길이 $l(w)$와 모델이 추정한 글자 수 $l_c(w)$가 가까울수록 1에 가깝다. 0.5 미만이면 그 pseudo-GT를 신뢰하지 않고 글자 폭을 균등 분할로 대체한다.'},
 {expr:'L = Σ_p Sc(p) · ( ||Sr(p) − Sr*(p)||² + ||Sa(p) − Sa*(p)||² )',
  tex:'L=\\sum_{p} S_c(p)\\cdot\\Bigl(\\lVert S_r(p)-S_r^{*}(p)\\rVert_2^2+\\lVert S_a(p)-S_a^{*}(p)\\rVert_2^2\\Bigr)',
  d:'픽셀별 confidence map $S_c$로 가중된 region·affinity 회귀 손실. 합성 데이터는 정확한 라벨이 있으므로 $S_c=1$로 고정한다.'}
],

numbers:[
 {k:'ICDAR2013 H-mean', v:'95.2%', d:'해상도 960 기준, 종전 최고 Mask TextSpotter 91.0% 대비 대폭 상승'},
 {k:'ICDAR2015 H-mean', v:'86.9%', d:'해상도 2240 기준. 검출만 비교한 수치'},
 {k:'TotalText H-mean', v:'83.6%', d:'곡선 텍스트 데이터셋. TextSnake 78.4% 대비 우세, 파인튜닝 없이 달성'},
 {k:'CTW-1500 H-mean', v:'83.5%', d:'LinkRefiner라는 소형 보조망을 affinity 대신 붙여 line-level 주석에 대응'},
 {k:'추론 속도', v:'8.6 FPS', d:'ICDAR2013, 해상도 960 기준 — 논문은 "단순한 후처리 덕분"이라고 명시'}
],

impact:'단어 상자 회귀·픽셀 분할 양쪽의 한계였던 "임의 모양 텍스트"를 글자 단위 표현으로 우회한 것이 이후 텍스트 검출 연구의 한 축이 됐다. 글자 단위 주석이 없어도 학습이 가능하다는 것을 약지도 학습으로 증명해, 데이터가 부족한 언어·서체에도 같은 레시피를 적용할 길을 열었다. 오픈소스 구현이 [EasyOCR](https://github.com/JaidedAI/EasyOCR)의 검출 단계로 그대로 쓰이면서 실무에서 가장 널리 쓰인 텍스트 검출기 중 하나가 됐다.',

legacy:[
 '**EasyOCR의 기본 검출기** — CRAFT 가중치가 그대로 배포돼 다국어 OCR 파이프라인의 표준 구성요소가 됨',
 '**"검출 후처리를 학습 가능하게" 흐름과 대비** — 같은 해 나온 [DBNet](#/p/dbnet)은 반대로 이진화 문턱값 자체를 미분 가능하게 만들어 후처리를 없애는 방향으로 감',
 '**글자 단위 약지도 학습 레시피** — 단어 라벨에서 글자 라벨을 추정하는 절차가 이후 텍스트 인식·스포팅 연구에서 재사용됨',
 '**곡선/임의 방향 텍스트 벤치마크(TotalText·CTW-1500)를 주류 평가 기준으로 정착**시키는 데 기여'
],

pitfalls:[
 '**CRAFT는 인식(recognition)을 하지 않는다.** 순수 검출기이고, Table 3에서 end-to-end 방법(FOTS 등)과 비교한 것도 "검출만 따로 뗀" 수치와의 비교다.',
 '**단어 상자가 아니라 글자 상자가 1차 산출물이다.** 최종 QuadBox/Polygon은 후처리에서 연결한 결과이므로, 문턱값 $\\tau_r$·$\\tau_a$ 설정에 따라 붙는 글자 범위가 달라진다.',
 '**CTW-1500에는 CRAFT 단독이 아니라 LinkRefiner라는 별도 소형 망이 추가로 필요하다.** line-level 주석·공백 미표시라는 이 데이터셋의 특성 때문이며, 원래 affinity 개념(공백=0)과 맞지 않아 별도 훈련이 들어간다.'
],

figures:[
 {f:'fig1-heatmaps.png',
  cap:'왼쪽 열이 CRAFT가 예측한 region/affinity 히트맵이 겹쳐진 원본, 오른쪽 열이 최종 검출 결과. 위부터 수평·곡선·임의 모양 텍스트 — 글자 단위로 보기 때문에 사각형이 아닌 텍스트도 그대로 따라간다.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-architecture.png',
  cap:'왼쪽이 VGG16-BN 인코더(Stage1~6), 오른쪽 위가 UpConv Block을 반복해 만드는 디코더. Stage4~1의 특징을 skip 연결(⊕: Concat)로 끌어와 합치는 구조가 U-Net과 같고, 마지막에 두 갈래로 갈라져 region score·affinity score를 각각 낸다.',
  src:'원문 Figure 2, p.2'}
],

quotes:[
 {t:'Note that an advantage of CRAFT is that it does not need any further post-processing methods, like Non-Maximum Suppression (NMS).',
  src:'Section 3.3, p.4'}
],

links:[
 {t:'arXiv 1904.01941 — CRAFT', u:'https://arxiv.org/abs/1904.01941'},
 {t:'GitHub — clovaai/CRAFT-pytorch', u:'https://github.com/clovaai/CRAFT-pytorch'}
]
});
