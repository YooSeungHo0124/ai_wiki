WIKI.paper({
slug:'siamrpn-pp',
venue:'CVPR 2019 (arXiv 2018)',
authors:'Li, Wu, Wang et al. (SenseTime · CASIA · ICT)',
arxiv:'1812.11703',

tldr:'Siamese 트래커에 ResNet-50 같은 깊은 백본이 안 통하던 원인을 padding이 깨는 이동 불변성으로 짚고, 학습 때 타깃 위치를 무작위로 흔드는 샘플링으로 해결했다. 여기에 layer-wise 융합과 depth-wise 상관을 더해 VOT2018 등 5개 벤치마크에서 최고 성적을 35 FPS로 냈다.',

context:'[SiamFC](#/p/siamfc) 이후 Siamese 트래커는 템플릿과 검색 영역의 특징을 상호상관해 위치를 찾는 구조로 자리 잡았고, SiamRPN은 여기에 Faster R-CNN류의 region proposal을 붙여 박스 회귀까지 했다. 그런데 이 계열은 거의 전부 [AlexNet](#/p/alexnet) 과 비슷한 얕은 백본을 썼다. [ResNet](#/p/resnet) 같은 깊은 백본으로 바꿔도 성능이 오르지 않았고, OTB2015에서는 ECO나 MDNet 같은 최고 트래커와 정확도 차이가 컸다. 저자들은 이것을 백본 용량 문제가 아니라 학습 구조의 문제로 본다.',

ideas:[
 {h:'padding이 깨는 이동 불변성이 진짜 원인',
  lead:'깊은 네트워크는 padding이 필요한데, 그것이 템플릿 상관의 엄밀한 이동 불변성을 깨 중심 편향을 만든다.',
  d:'상관 기반 추적이 성립하려면 특징 추출기가 엄밀히 이동 불변이어야 한다. padding 없는 수정 AlexNet은 만족하지만, 깊은 네트워크는 padding이 불가피해 이 성질이 깨진다. 저자들은 학습 때 타깃을 항상 중심에 두면 네트워크가 "중심에 있는 것이 타깃"이라는 편향을 배운다고 가설을 세우고 시뮬레이션으로 확인한다. 이동 범위 0이면 가장자리의 양성 확률이 0으로 사라지고, 범위를 ±16, ±32로 늘릴수록 분포가 고르게 퍼진다.'},
 {h:'공간 인식 샘플링으로 ResNet-50 학습',
  lead:'학습 시 타깃을 검색 영역 안에서 균일 분포로 무작위 이동시켜 중심 편향을 없앤다.',
  d:'데이터 증강에서 타깃 위치를 ±shift 범위로 무작위 이동한다. VOT2018에서 shift를 0으로 두면 EAO가 0.14까지 떨어지고, 적절한 범위(±64 픽셀)가 깊은 Siamese 트래커 학습에 필수라고 Fig. 2에서 보인다. ResNet-50은 conv4·conv5의 stride를 1로 줄이고 dilated convolution을 써 stride를 8로 맞추고, 각 블록 출력에 1×1 conv를 붙여 채널을 256으로 줄인다. 템플릿 특징은 가운데 7×7만 잘라 쓰며 백본 학습률은 헤드의 1/10이다.'},
 {h:'Layer-wise 융합: conv3·4·5를 각각 RPN에 넣어 가중합',
  lead:'세 층의 출력에 각각 Siamese RPN을 붙이고 학습 가능한 가중치로 합친다.',
  d:'ResNet의 얕은 층은 색·모양 같은 저수준 정보로 위치 정밀도를, 깊은 층은 의미 정보로 블러나 변형 상황의 강건함을 준다. 세 층의 RPN 출력은 해상도가 같아 $S_{all}=\\sum_{l=3}^{5}\\alpha_l S^l$ 처럼 바로 가중합한다. 분류와 회귀는 서로 다른 가중치($\\alpha$, $\\beta$)를 쓰며 가중치도 end-to-end로 학습된다. 특징을 직접 합치지 않고 분류기와 회귀기를 층별로 따로 학습해 합치는 점이 이전 방식과 다르다.'},
 {h:'Depth-wise 상관: 파라미터는 10분의 1, 채널은 의미를 가진다',
  lead:'채널별로 따로 상관을 구해 템플릿 가지의 파라미터 폭주를 막고 학습을 안정시킨다.',
  d:'SiamRPN의 UP-XCorr는 템플릿 특징의 채널을 늘리는 거대한 conv를 써서 RPN 모듈이 20M, 특징 추출기는 4M 파라미터로 불균형이 심했다. DW-XCorr는 템플릿·검색 가지에 공유하지 않는 conv를 하나씩 통과시킨 뒤 채널별로 상관을 구하고 conv-bn-relu로 융합하며, 파라미터가 UP-XCorr의 약 10분의 1이다. 부수적으로, 같은 범주의 물체는 같은 채널에 높은 반응을 보이는 직교에 가까운 성질이 관찰된다(Fig. 5).'}
],

diagram:{type:'stack', cap:'SiamRPN++의 구조. 세 층의 특징마다 Siamese RPN을 붙이고 depth-wise 상관으로 분류·회귀 맵을 만든 뒤 가중합한다.',
 layers:[
  {t:'템플릿·검색 입력', s:'127² / 255²'},
  {t:'ResNet-50', s:'stride 8, dilation', note:'← 공간 인식 샘플링으로 학습'},
  {t:'conv3·4·5 특징', s:'1×1 conv → 256ch', note:'← 층별 융합(layer-wise)'},
  {t:'DW-XCorr × 3', s:'채널별 상관', acc:true, note:'← 파라미터 약 1/10'},
  {t:'가중합', s:'α, β 학습', note:'← 분류·회귀 따로'},
  {t:'cls / box 출력', s:'25×25 · 앵커 5개'}
 ]},

math:[
 {expr:'S_all = Σ_{l=3..5} α_l · S^l,   B_all = Σ_{l=3..5} β_l · B^l',
  tex:'S_{all}=\\sum_{l=3}^{5}\\alpha_l\\,S^{l},\\qquad B_{all}=\\sum_{l=3}^{5}\\beta_l\\,B^{l}',
  d:'$S^l$ 은 층 $l$ 의 분류 점수 맵, $B^l$ 은 박스 회귀 맵이다. 분류용 가중치 $\\alpha$ 와 회귀용 $\\beta$ 를 따로 두고 네트워크와 함께 오프라인으로 학습한다.'}
],

numbers:[
 {k:'VOT2018 EAO / Accuracy / Robustness', v:'0.414 / 0.600 / 0.234', d:'Table 2. 대회 1위 LADCF는 EAO 0.389. 기반 모델 DaSiamRPN은 0.326. 정확도와 AO 지표에서도 비교군 중 1위'},
 {k:'백본·상관 ablation (VOT2018 EAO)', v:'AlexNet+UP 0.332 → ResNet-50 3층+finetune+DW 0.414', d:'Table 1. ResNet-50에서 finetune 없이 DW만 쓴 3층 융합은 0.395, UP-XCorr+finetune은 0.390. conv4 단독은 0.374'},
 {k:'TrackingNet 테스트 AUC / P / Pnorm', v:'73.3 / 69.4 / 80.0', d:'Table 3. 2위 DaSiamRPN은 63.8 / 59.1 / 73.3'},
 {k:'LaSOT 테스트 AUC', v:'49.6', d:'논문은 원 논문에서 가장 좋았던 MDNet 대비 AUC가 상대적으로 24.9% 높다고 보고'},
 {k:'UAV123 success', v:'0.613', d:'DaSiamRPN 0.586, ECO 0.525'},
 {k:'속도', v:'35 FPS (Titan Xp)', d:'MobileNetv2·ResNet-18 변형은 정확도가 거의 비슷하면서 70 FPS 이상'}
],

impact:'SiamRPN++는 Siamese 트래커가 얕은 백본에서 벗어날 수 있음을 보인 논문이다. 실패의 원인을 용량이 아니라 중심 편향이라는 학습 설계로 진단하고, 단순한 샘플링 수정으로 [ResNet](#/p/resnet)-50을 end-to-end로 학습시켰다. 저자들은 OTB2015에서 Siamese 트래커가 최고 수준과 비교 가능해진 것이 처음이라고 주장한다. 속도를 유지한 채 정확도를 높인 레시피(깊은 백본, 층별 융합, depth-wise 상관)는 이후 [TransT](#/p/transt) 같은 후속 연구가 주요 비교 대상으로 삼았다.',

legacy:[
 '**[TransT](#/p/transt)**: SiamRPN++ 같은 상관 기반 트래커가 쓰던 상관 융합(DW-XCorr 등)을 attention 융합으로 대체. TransT 논문의 LaSOT 표에서 SiamRPN++ AUC 49.6에 대해 TransT는 64.9',
 '**깊은 백본의 정착**: ResNet 계열 백본을 Siamese 트래커에 쓰는 방식이 이후 비교 표(TransT 등)의 기본 구성이 됨',
 '**상관 융합과의 직접 대조**: TransT는 마지막 CFA를 depth-wise 상관으로 바꾼 변형을 만들어 attention 융합이 상관보다 낫다는 ablation을 제시(Table 3)',
 '**상관의 한계 제기**: TransT는 상관이 국소 선형 매칭이라 의미 정보를 잃는다고 지적하며 attention 기반 융합을 제안'
],

pitfalls:[
 '**"깊은 백본을 쓰면 된다"가 아니라 "깊은 백본을 쓰려면 위치 샘플링을 바꿔야 한다"는 논문이다.** shift를 0으로 두고 ResNet-50을 학습하면 VOT2018 EAO가 0.14까지 내려간다. 같은 백본이라도 데이터 증강이 없으면 이득이 사라진다.',
 '**robustness는 여전히 약점이다.** 저자들도 템플릿 적응이 없어 온라인 갱신을 쓰는 correlation filter 계열에 robustness에서 못 미친다고 인정한다. 정확도(Accuracy)와 구분해서 읽어야 한다.',
 '**속도·성능 수치는 설정마다 다르다.** VOT2018 장기(long-term) 결과는 장기 전략을 붙인 21 FPS 버전이고, 본 구조의 35 FPS와 다르다.'
],

figures:[
 {f:'fig4-correlation-layers.png',
  cap:'(a) SiamFC의 XCorr는 단일 채널 응답. (b) SiamRPN의 UP-XCorr는 큰 conv로 템플릿 채널을 늘려 파라미터가 한쪽에 몰린다. (c) 이 논문의 DW-XCorr는 채널별로 상관해 다채널 응답을 얻는다.',
  src:'원문 Figure 4, p.5'},
 {f:'fig5-channel-semantics.png',
  cap:'conv4 depth-wise 상관의 세 채널. 맨 위가 입력 6장, 아래 세 줄이 각각 148번(자동차), 222번(사람), 226번(얼굴) 채널의 응답. 범주별로 반응하는 채널이 다르다.',
  src:'원문 Figure 5, p.5'}
],

quotes:[
 {t:'we prove the core reason comes from the lack of strict translation invariance.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1812.11703 — SiamRPN++', u:'https://arxiv.org/abs/1812.11703'},
 {t:'프로젝트 페이지', u:'https://lb1100.github.io/SiamRPN++'}
]
});
