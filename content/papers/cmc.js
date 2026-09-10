WIKI.paper({
slug:'cmc',
venue:'ECCV 2020 (arXiv 2019)',
authors:'Tian, Krishnan, Isola (MIT CSAIL · Google Research)',
arxiv:'1906.05849',

tldr:'대조학습의 "양성 쌍"을 시간·공간이 아니라 **같은 장면을 보는 여러 감각 채널**(밝기·색·깊이·표면법선)로 정의한 논문. 뷰가 2개에서 4개로 늘수록 표현이 계속 좋아진다는 것을 보였고, 이후 [SimCLR](#/p/simclr)의 데이터 증강 뷰·[CLIP](#/p/clip)의 이미지-텍스트 뷰로 이어지는 "무엇을 양성 쌍으로 삼을 것인가" 논쟁의 원형이 되었다.',

context:'[CPC](#/p/cpc)는 하나의 신호(오디오·이미지 패치) 안에서 미래나 이웃 위치를 예측하도록 대조학습을 걸어 표현을 얻었다. 그런데 이 방식은 예측 방향이 정해져 있다 — 시간의 미래, 공간의 아래쪽처럼. 한편 인지과학에는 오래된 가설이 하나 있다: 뇌가 좋다고 여기는 정보는 **여러 감각에 공통으로 나타나는 것**이다. "개"는 보이고 들리고 만져지지만, "카메라 각도"는 촉각·청각에 아무 흔적도 남기지 않는다. 이 논문은 이 가설을 그대로 학습 신호로 바꾼다. CPC에서 순환망을 걷어내고, 예측 방향 대신 **같은 장면의 서로 다른 채널**(예: Lab 색공간의 L채널과 ab채널)을 양성 쌍으로 쓴다.',

ideas:[
 {h:'뷰 = 같은 장면의 다른 감각/채널',
  lead:'루미넌스·크로미넌스·깊이·표면법선처럼 한 장면을 나타내는 서로 다른 채널을 뷰로 취급한다.',
  d:'RGB 이미지를 Lab 색공간으로 바꾸면 L(밝기)과 ab(색)이라는 두 개의 서로 다른 뷰가 공짜로 생긴다. NYU RGBD 데이터셋에서는 밝기·색·깊이·표면법선까지 4개 뷰를 동시에 쓴다. 같은 순간(비디오라면 이미지·광류)을 서로 다른 채널로 쪼갤 수 있으면 전부 CMC의 입력이 된다.'},
 {h:'대조 손실: 같은 장면은 가깝게, 다른 장면은 멀게',
  lead:'두 인코더 $f_{\\theta_1}, f_{\\theta_2}$ 의 출력 코사인 유사도로 (m+1)-way 분류를 푼다.',
  d:'뷰 $V_1, V_2$ 각각을 별도 인코더로 임베딩한 뒤, 같은 장면에서 온 $(v_1,v_2)$ 쌍은 양성으로, 다른 장면에서 온 $v_2$ 는 음성(메모리 뱅크에서 $m$개 샘플링)으로 놓고 softmax 분류를 학습한다. 이 손실을 최소화하는 것이 두 뷰 표현 사이의 상호정보량 $I(z_1;z_2)$ 의 하한을 최대화하는 것과 같다는 것을 증명한다(식 6). $m$ 이 클수록 이 하한이 타이트해지고, 실제로 음성 샘플 수를 64에서 8192로 늘리면 ImageNet-100 정확도가 계속 오르다 약 4096에서 60.3%로 포화된다.'},
 {h:'뷰가 늘수록 표현이 좋아진다',
  lead:'NYU-Depth 실험에서 뷰를 1개에서 4개로 늘릴수록 분할 정확도가 단조 증가한다.',
  d:'L 채널을 core view로 놓고 ab·depth·surface normal을 순서대로 추가하며 의미분할(semantic segmentation) 품질을 측정하면, 뷰가 늘어날 때마다 mIoU와 픽셀 정확도가 꾸준히 오른다(Random 45.5%→CMC(4뷰) 57.0%→Supervised 57.8% pixel accuracy). 이 논문 스스로 "다중 뷰가 표현 품질을 높인다는 것을 명시적으로 보인 첫 연구"라고 주장한다.'},
 {h:'core view vs full graph — 뷰가 많을 때의 확장 방식',
  lead:'기준 뷰 하나만 다른 모든 뷰와 짝짓거나(core view), 모든 쌍을 다 짝짓는다(full graph).',
  d:'뷰가 $M$개면 가능한 쌍은 $\\binom{M}{2}$ 개다. core view는 그중 기준 뷰 하나가 낀 $M-1$ 쌍만 최적화해 계산량을 선형으로 유지하고, full graph는 전체 쌍을 다 쓴다. 두 방식 다 "여러 뷰가 공유하는 정보일수록 손실에서 더 많이 반영된다"는 성질을 갖고, full graph 쪽이 결측 뷰 처리에도 더 유연하다.'},
 {h:'예측(predictive) 학습보다 대조 학습이 낫다',
  lead:'한 뷰에서 다른 뷰의 픽셀을 직접 예측하는 대신 대조 학습이 더 좋은 표현을 만든다.',
  d:'[SplitBrain](https://arxiv.org/abs/1611.09842) 류의 방법은 L에서 ab를 회귀로 직접 예측한다. CMC를 같은 조건에서 예측 방식과 head-to-head로 비교하면(STL-10 전이, Table 5), {L,Depth} 55.5→58.3, {L,Normal} 58.4→60.1, {L,Seg.Map} 57.7→59.2로 대조 학습이 모든 뷰 쌍에서 예측 학습을 이긴다.'}
],

diagram:{type:'flow', cap:'같은 장면(예: NYU RGBD)의 서로 다른 채널 4개를 각자 인코더에 통과시킨 뒤, 같은 장면의 임베딩끼리는 가깝게 다른 장면과는 멀게 대조학습한다.',
 nodes:[
  {t:'밝기(L)', s:'view 1'},
  {t:'색(ab)', s:'view 2'},
  {t:'깊이', s:'view 3'},
  {t:'표면 법선', s:'view 4'},
  {t:'대조 손실', s:'같은 장면=양성', acc:true, note:'메모리 뱅크서 음성 샘플링'}
 ]},

math:[
 {expr:'L_contrast = -E[ log( h(v1,v2) / Σ h(v1,v2_j) ) ]',
  tex:'\\mathcal{L}_{contrast}^{V_1,V_2}=-\\mathbb{E}\\left[\\log\\frac{h_\\theta(\\{v_1^1,v_2^1\\})}{\\sum_{j=1}^{k+1}h_\\theta(\\{v_1^1,v_2^{j}\\})}\\right]',
  d:'하나의 양성 쌍과 $k$개의 음성 쌍 사이의 (k+1)-way softmax 분류. CPC의 InfoNCE와 형태가 같지만 시간축 대신 뷰(채널) 축을 예측 대상으로 바꾼 것.'},
 {expr:'h(v1,v2) = exp( cos(f1(v1), f2(v2)) / τ )',
  tex:'h_\\theta(\\{v_1,v_2\\})=\\exp\\!\\left(\\frac{f_{\\theta_1}(v_1)\\cdot f_{\\theta_2}(v_2)}{\\lVert f_{\\theta_1}(v_1)\\rVert\\,\\lVert f_{\\theta_2}(v_2)\\rVert}\\cdot\\frac{1}{\\tau}\\right)',
  d:'두 뷰의 인코더 출력을 코사인 유사도로 비교하고 temperature $\\tau$ (기본 0.07~0.1)로 분포의 뾰족한 정도를 조절한다.'},
 {expr:'I(z1;z2) ≥ log(k) - L_contrast',
  tex:'I(z_i;z_j)\\ge \\log(k)-\\mathcal{L}_{contrast}',
  d:'대조 손실을 최소화하는 것이 두 뷰 표현 사이 상호정보량의 하한을 최대화하는 것과 같다는 핵심 증명. $k$(음성 샘플 수)가 클수록 하한이 타이트해진다.'}
],

numbers:[
 {k:'ImageNet 선형평가(top-1)', v:'70.6%', d:'{Y,DbDr}+RandAugment, ResNet-50×2 두 인코더 (Table 1)'},
 {k:'뷰 1→4개 (NYU-Depth)', v:'45.5%→57.0%', d:'무작위 초기화 대비 pixel accuracy, core view 4뷰 사용 시 (Supervised 상한 57.8%)'},
 {k:'ImageNet-100 (MoCo·PIRL과 결합)', v:'75.6%→81.5%', d:'CMC 단독 75.6%에서 [MoCo](#/p/moco)+PIRL+RandAugment 결합 시 81.5%까지 상승 (Table 9)'},
 {k:'STL-10 대조 vs 예측', v:'+2~3%p', d:'같은 뷰 쌍에서 대조 학습이 예측(회귀) 학습을 모든 경우에 앞섬 (Table 5)'},
 {k:'음성 샘플 수 m', v:'4096에서 포화', d:'ImageNet-100 부분집합, 64→8192로 늘려도 60.3% 부근에서 정체 (Fig. 6)'}
],

impact:'대조학습이 다룰 수 있는 "양성 쌍"의 정의를 시간·공간적 이웃에서 **임의의 감각 채널 조합**으로 넓혔다. 이후 [SimCLR](#/p/simclr)은 뷰를 데이터 증강(크롭·색상 왜곡)으로 대체해 라벨 없는 단일 이미지에서도 다중 뷰를 만들어냈고, [CLIP](#/p/clip)은 이미지와 텍스트라는 서로 다른 모달리티를 뷰로 놓아 이 아이디어를 언어-비전 정렬로 확장했다. "뷰가 많을수록 좋다"는 결론은 이후 멀티모달 사전학습 전반의 기본 전제가 되었다.',

legacy:[
 '**증강 기반 뷰로 대체** — [SimCLR](#/p/simclr)이 감각 채널 대신 data augmentation을 뷰로 써서 단일 RGB 이미지만으로도 다중 뷰 대조학습을 가능하게 함',
 '**메모리 뱅크의 후속** — [MoCo](#/p/moco)가 이 논문과 같은 메모리 뱅크 방식의 정체(stale feature) 문제를 모멘텀 인코더로 해결, CMC+MoCo 결합 실험(Table 9)이 그 호환성을 직접 보여줌',
 '**모달리티 간 대조로 확장** — [CLIP](#/p/clip)의 이미지-텍스트 대조가 "임의의 두 뷰 사이 상호정보 최대화"라는 CMC의 틀을 언어-비전 쌍으로 일반화',
 '**정보량 관점의 자기지도학습 계열** — 상호정보량 하한으로서의 대조 손실이라는 해석은 [CPC](#/p/cpc)-CMC-InfoNCE 계열 이론적 논의의 표준 틀이 됨'
],

pitfalls:[
 '**"뷰가 늘면 무조건 좋아진다"는 무한정 성립하지 않는다.** 논문도 상호정보량 하한(식 6)이 느슨할 수 있다는 후속 연구([47])를 인용하며, 정보량 최대화와 다운스트림 성능이 항상 정비례하지는 않는다고 명시한다.',
 '**core view와 full graph는 "뷰 개수가 3개 이상"일 때만 의미 있는 구분이다.** 뷰가 2개(예: L·ab)면 두 공식이 동일해지므로, ImageNet 실험 대부분은 사실 이 구분과 무관한 2-뷰 실험이다.',
 '**메모리 뱅크 방식은 특징이 느리게 갱신되는 지연(stale feature) 문제를 안고 있다.** 논문 저자들도 이를 인지해 후속 실험에서 MoCo의 모멘텀 인코더로 교체했을 때 성능이 더 오르는 것을 확인했다(73.5→75.6% 방향이 아니라 CMC+MoCo 77.2%로 상승).'
],

figures:[
 {f:'fig1-multiview.png',
  cap:'왼쪽 4개 사다리꼴이 4개 뷰(밝기·색·깊이·표면법선 등)를 각각 인코딩하는 $f_{\\theta_1..4}$. 같은 장면에서 온 임베딩(녹색 계열)은 구 위에서 서로 가깝게, 다른 장면에서 온 뷰(오른쪽 빨간 $z_1^j$, "Unmatching view")는 멀리 떨어지도록 학습한다.',
  src:'원문 Figure 1, p.1'},
 {f:'fig3-graphs.png',
  cap:'뷰가 4개(M=4)일 때 두 확장 방식의 차이. (a) core view는 $v_1$ 하나만 다른 셋과 쌍을 이뤄 3개 objective만 쓰고, (b) full graph는 6개 쌍 전부를 쓴다. 아래 벤 다이어그램의 숫자는 각 정보 조각이 몇 개의 objective에 반영되는지를 보여준다 — 4개 뷰가 공유하는 정보(중앙)는 full graph에서 6, core view에서 3으로 가중치가 다르다.',
  src:'원문 Figure 3, p.4'}
],

quotes:[
 {t:'Our conjecture in this paper is that some bits are in fact better than others. Some bits code important properties like semantics, physics, and geometry, while others code attributes that we might consider less important, like incidental lighting conditions or thermal noise in a camera’s sensor.',
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 1906.05849 — Contrastive Multiview Coding', u:'https://arxiv.org/abs/1906.05849'},
 {t:'Official code (HobbitLong/CMC)', u:'https://github.com/HobbitLong/CMC'}
]
});
