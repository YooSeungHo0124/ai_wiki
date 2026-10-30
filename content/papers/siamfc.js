WIKI.paper({
slug:'siamfc',
venue:'ECCV 2016 Workshops',
authors:'Bertinetto, Valmadre et al. (Oxford)',
arxiv:'1606.09549',

tldr:'추적 대상을 첫 프레임의 템플릿으로 주고, 검색 이미지 전체를 상호상관(cross-correlation) 한 번으로 훑어 위치를 찾는 **fully-convolutional Siamese 네트워크**. 오프라인에서 유사도 함수만 학습하고 온라인에서는 업데이트 없이 평가만 해서 58~86 FPS로 돈다.',

context:'임의의 물체를 첫 프레임의 상자 하나만으로 추적하는 단일 객체 추적(SOT)은 오랫동안 영상 자체에서 외형 모델을 온라인으로 학습하는 방식(TLD, Struck, KCF)이 주류였다. 영상 하나에서 얻는 데이터로는 단순한 모델밖에 못 배운다. 딥 conv-net을 쓰려면 추적 중 SGD로 가중치를 갱신하거나(SO-DLT, MDNet) 사전학습 특징 위에 얕은 필터를 얹었는데, 전자는 프레임레이트를 못 맞추고 후자는 end-to-end 학습의 이점을 살리지 못한다. 저자들은 대규모 영상 검출 데이터셋(ImageNet Video)이 생긴 만큼 오프라인에서 "두 이미지가 같은 물체인가"를 학습해 두면 된다고 본다.',

ideas:[
 {h:'추적을 유사도 학습으로 재정의',
  lead:'f(z, x)가 같은 물체면 높은 점수를 내도록 오프라인에서 학습하고, 추적 중에는 그대로 쓴다.',
  d:'템플릿 이미지 $z$ 와 같은 크기의 후보 $x$ 를 비교하는 함수 $f(z,x)$ 를 학습한다. 추적 때는 모든 위치를 검색해 점수가 가장 높은 곳을 고른다. 실험에서는 첫 프레임의 모습만 템플릿으로 쓰고 모델 업데이트도, 광류나 색 히스토그램도, 박스 회귀도 쓰지 않는다. 논문이 강조하는 것은 알고리즘이 아니라 오프라인 유사도 함수만으로 이만큼 된다는 점이다.'},
 {h:'검색 이미지에 fully-convolutional: 한 번의 상관으로 전 위치 평가',
  lead:'임베딩의 두 출력을 상호상관하면 모든 이동 sub-window의 유사도가 한 번의 forward로 나온다.',
  d:'임베딩 $\\varphi$ 는 패딩 없는 합성곱이라 이동에 대해 교환 가능하다(fully-convolutional). 그래서 $127\\times127$ 템플릿은 $6\\times6\\times128$, $255\\times255$ 검색 이미지는 $22\\times22\\times128$ 특징이 되고, 둘을 상호상관하면 $17\\times17$ 점수 맵이 나온다. 이는 후보 sub-window마다 따로 내적하는 것과 수학적으로 같지만 한 번의 평가로 끝난다. 점수 맵의 최대 위치에 stride(8)를 곱하면 프레임 간 이동량이 된다.'},
 {h:'점수 맵 전체를 학습 샘플로: 로지스틱 손실',
  lead:'검색 이미지 하나가 점수 맵의 모든 위치를 양/음 샘플로 바꿔 한 쌍에서 많은 학습 신호를 얻는다.',
  d:'점수 맵 각 위치에 중심 반경 $R$ 이내면 +1, 아니면 -1 라벨을 주고 위치별 로지스틱 손실의 평균을 최소화한다. 양성과 음성의 불균형은 가중치로 보정한다. 같은 영상에서 최대 $T$ 프레임 떨어진 두 프레임을 뽑아 쌍을 만들고 물체 클래스는 쓰지 않는다. 훈련은 ImageNet Video 4,417개 영상(200만 개 이상의 박스)으로 50 epoch, epoch당 50,000쌍, 배치 8이다.'},
 {h:'AlexNet식 임베딩 + 단순한 온라인 규칙',
  lead:'5층 AlexNet 유사 구조에 코사인 윈도와 5스케일 탐색만 얹는다.',
  d:'임베딩은 AlexNet의 합성곱 부분과 비슷한 5층(conv1~conv5)이고, 내부에 padding이 없으며 최종 stride는 8이다. 온라인에서는 이전 크기의 약 4배 영역에서만 찾고, 점수 맵에 코사인 윈도를 더해 큰 이동을 억제한다. 스케일은 $1.025^{\\{-2,-1,0,1,2\\}}$ 다섯 개를 한 배치로 처리하고 스케일 갱신은 0.35 계수로 감쇠한다. 점수 맵은 17×17에서 272×272로 bicubic 업샘플해 위치 정밀도를 올린다.'}
],

diagram:{type:'flow', cap:'SiamFC의 추론 흐름. 템플릿은 첫 프레임에서 한 번만 임베딩하고, 매 프레임 검색 이미지의 특징과 상호상관해 17×17 점수 맵을 얻는다.',
 nodes:[
  {t:'템플릿 z', s:'127×127×3'},
  {t:'공유 임베딩 φ', s:'6×6×128'},
  {t:'상호상관 *', s:'검색 22×22×128', acc:true},
  {t:'점수 맵', s:'17×17×1'},
  {t:'최대 위치', s:'이동 = 위치 × 8'}
 ]},

math:[
 {expr:'f(z, x) = φ(z) * φ(x) + b·1',
  tex:'f(z,x)=\\varphi(z)\\ast\\varphi(x)+b\\,\\mathbb{1}',
  d:'$\\ast$ 는 상호상관이다. $\\varphi(z)$ 의 특징 맵이 커널이 되어 $\\varphi(x)$ 위를 미끄러진다. 출력은 스칼라가 아니라 위치마다 유사도를 담은 점수 맵이다.'},
 {expr:'ℓ(y, v) = log(1 + exp(-y v)),  L(y, v) = (1/|D|) Σ_u ℓ(y[u], v[u])',
  tex:'\\ell(y,v)=\\log\\!\\big(1+e^{-yv}\\big),\\qquad L(y,v)=\\frac{1}{|D|}\\sum_{u\\in D}\\ell\\big(y[u],v[u]\\big)',
  d:'위치 $u$ 마다 로지스틱 손실을 구해 점수 맵 $D$ 전체에서 평균한다. 라벨 $y[u]$ 는 중심에서 반경 $R$ 이내면 +1이다.'}
],

numbers:[
 {k:'VOT-15 expected average overlap (SiamFC-3s / SiamFC)', v:'0.2889 / 0.2743', d:'Table 2. 같은 표에서 MDNet은 0.3575(1 fps), DeepSRDCF는 0.3033, SRDCF는 0.2743(5 fps). 논문은 상위권 트래커 중 프레임레이트로 도는 것은 이 둘뿐이라고 보고한다'},
 {k:'속도 (Titan X)', v:'3스케일 86 FPS · 5스케일 58 FPS', d:'전체 온라인 파이프라인 기준'},
 {k:'OTB-13 OPE 성공률 AUC (SiamFC)', v:'0.612', d:'Figure 3. LCT도 0.612, Staple 0.600. 3스케일 버전은 0.608. TRE 0.621, SRE 0.554'},
 {k:'학습 데이터 크기 효과 (VOT-15 expected average overlap)', v:'2%(88개 영상) 0.168 → 100%(4417개) 0.274', d:'Table 3. 데이터를 늘릴수록 꾸준히 오른다. 저자들은 더 큰 영상 데이터가 있으면 더 오를 것이라고 본다'},
 {k:'VOT-16 expected overlap (SiamFC / SiamFC-3s)', v:'0.3876 / 0.4051', d:'대회 보고서와 다른 값. 제출한 것이 이 논문의 예비 버전이었다고 논문이 밝힌다'}
],

impact:'SiamFC는 "추적 중에는 학습하지 않는다"는 선택으로 딥러닝 추적의 속도 병목을 풀었다. 온라인 SGD 없이 오프라인 유사도 함수 하나가 당시 실시간 트래커들을 앞섰고, 1 fps짜리 MDNet 대비 58~86배 빠르면서 VOT-15 overlap 0.27~0.29를 냈다. 템플릿과 검색 영역을 공유 백본으로 임베딩해 상관하는 이 구조는 이후 Siamese 계열 추적기의 기본 틀이 되었다. 임베딩 구조는 [AlexNet](#/p/alexnet) 의 합성곱 부분을 거의 그대로 가져와 단순하다.',

legacy:[
 '**[SiamRPN++](#/p/siamrpn-pp)**: SiamFC 구조에 region proposal을 얹은 SiamRPN 위에서, 왜 깊은 백본이 안 통했는지(padding이 깨는 이동 불변성)를 풀어 ResNet-50을 붙임',
 '**[TransT](#/p/transt)**: SiamFC 이래 쓰이던 상호상관 융합 자체를 attention으로 교체함',
 '**단순 트래킹 규칙의 표준화**: 코사인 윈도, 다중 스케일 탐색, 첫 프레임 템플릿 고정이 후속 Siamese 트래커의 기본 구성으로 이어짐',
 '**영상 검출 데이터로 추적 학습**: ImageNet Video로 학습해 ALOV/OTB/VOT 도메인에서 테스트하는 방식이 벤치마크 영상을 학습에 쓰지 않고도 되는 사례로 제시됨'
],

pitfalls:[
 '**템플릿을 갱신하지 않아서 비슷한 물체(distractor)에 취약하다.** 논문도 첫 모습과 닮은 모든 윈도에 높은 점수가 나와 혼잡한 장면에서 실패한다고 인정한다(Fig. 6).',
 '**padding을 넣으면 구조의 전제가 깨진다.** 이 논문의 임베딩은 의도적으로 padding이 없고, 식 (1)의 이동 교환성에 기대어 한 번의 상관이 가능하다. 깊은 백본으로 바꾸려면 [SiamRPN++](#/p/siamrpn-pp) 가 지적한 문제를 따로 풀어야 한다.',
 '**박스 회귀가 없어 바운딩 박스는 스케일 탐색 5단계로만 바뀐다.** 종횡비 변화나 정밀한 형상 추정은 이 논문의 범위 밖이며, 점수 맵 위치의 해상도도 17×17 업샘플에 의존한다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'위쪽 가지가 템플릿 z, 아래 가지가 검색 이미지 x. 같은 φ를 통과한 특징을 상호상관(*)해 17×17 점수 맵을 만든다. x 안의 빨강·파랑 sub-window가 점수 맵의 빨강·파랑 점에 대응한다.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'We advocate an alternative approach in which a deep conv-net is trained to address a more general similarity learning problem in an initial offline phase, and then this function is simply evaluated online during tracking.',
  src:'Introduction, p.2'}
],

links:[
 {t:'arXiv 1606.09549 — SiamFC', u:'https://arxiv.org/abs/1606.09549'},
 {t:'프로젝트 페이지 (Oxford)', u:'http://www.robots.ox.ac.uk/~luca/siamese-fc.html'}
]
});
