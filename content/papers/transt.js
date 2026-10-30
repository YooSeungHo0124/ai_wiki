WIKI.paper({
slug:'transt',
venue:'CVPR 2021',
authors:'Chen, Yan et al. (Dalian Univ. of Technology · Peng Cheng Lab · Remark AI)',
arxiv:'2103.15436',

tldr:'Siamese 트래커가 템플릿과 검색 영역을 섞던 상호상관(correlation)을 걷어내고, self-attention(ECA)과 cross-attention(CFA)만으로 두 특징을 융합한 **TransT**. LaSOT AUC 64.9, TrackingNet AUC 81.4, GOT-10k AO 72.3을 약 50 FPS로 냈다.',

context:'[SiamFC](#/p/siamfc) 에서 [SiamRPN++](#/p/siamrpn-pp) 에 이르기까지 Siamese 트래커의 공통 부품은 템플릿과 검색 영역을 섞는 상관 연산이었다. 저자들은 이 연산이 국소적인 선형 매칭이라서 의미 정보가 일부 사라지고 지역 최적에 빠지기 쉽다고 본다. 그동안은 상관의 약점을 새 구조, 부가 모듈, 온라인 업데이터 같은 것으로 보완해 왔다. 저자들은 보완 대신 융합 방식을 갈아엎는 쪽을 택해 "상관보다 나은 융합 방법이 없는가"를 묻는다. 배경에는 [Transformer](#/p/transformer) 의 attention과 [DETR](#/p/detr) 이 검출에서 보인 성공이 있다.',

ideas:[
 {h:'상관 대신 attention으로만 융합',
  lead:'상관 연산을 완전히 빼고, 두 가지의 특징을 attention만으로 섞는다.',
  d:'backbone이 템플릿과 검색 영역을 따로 임베딩하면, 1×1 conv로 채널을 256으로 줄이고 공간을 펴서 벡터 집합으로 만든다. 이 두 벡터 집합이 융합 네트워크를 거쳐 하나의 특징 맵이 된다. 융합은 ECA 두 개와 CFA 두 개를 한 층으로 묶어 $N=4$ 번 반복하고, 마지막에 CFA 하나를 더 붙여 검색 영역 쪽으로 디코딩한다. 상관과 달리 먼 위치 사이의 연관도 만들 수 있고, 출력이 유사도 맵 하나가 아니라 의미를 담은 특징 맵이다.'},
 {h:'ECA: 자기 문맥을 attention으로 보강',
  lead:'각 가지 안에서 multi-head self-attention으로 위치 간 문맥을 모은다.',
  d:'ECA는 한 가지 안에서 위치를 서로 참조하는 self-attention을 잔차 형태로 더한다. attention은 위치 정보가 없으므로 DETR을 따라 사인 함수 기반 공간 위치 인코딩을 query와 key에 더한다. 시각화에서 첫 층의 ECA는 환경과 다른 물체를 두루 본다. 템플릿 정보가 섞이기 전이라 타깃 후보를 구분하지 못한다는 것이 저자들의 해석이다.'},
 {h:'CFA: cross-attention으로 두 가지를 섞기',
  lead:'한 가지의 특징을 query로, 다른 가지를 key·value로 삼아 서로를 반영한다.',
  d:'CFA는 자기 가지의 특징 $X_q$ 를 query로, 다른 가지의 $X_{kv}$ 를 key와 value로 하는 multi-head cross-attention에 FFN을 잔차로 더한다. 템플릿 쪽과 검색 쪽에서 각각 쌍으로 쓰여 서로의 정보를 교환한다. 원래 Transformer의 encoder-decoder를 그대로 쓰지 않고 이렇게 설계한 이유는, 추적에서는 두 입력의 융합이 핵심이기 때문이라고 논문이 설명한다.'},
 {h:'앵커 없는 단순 헤드와 window penalty',
  lead:'융합 특징의 벡터마다 분류와 정규화 좌표를 바로 예측해 앵커와 후처리 튜닝을 줄였다.',
  d:'헤드는 은닉 차원 256의 3층 MLP 두 개(분류, 회귀)이다. 융합 특징 $H_x W_x$ 개의 벡터 각각에서 전경/배경 확률과 검색 영역 기준 정규화 좌표를 예측해 앵커 박스를 쓰지 않는다. 학습은 정답 상자 안의 위치만 양성으로 두고, 분류 손실은 BCE, 회귀 손실은 $\\ell_1$ 과 GIoU의 합이다. 온라인에서는 Hanning window 하나만 후처리로 쓰므로 SiamRPN 계열처럼 세 하이퍼파라미터를 맞출 필요가 없다.'}
],

diagram:{type:'flow', cap:'TransT의 구조. 백본 특징을 벡터 집합으로 펴 attention 층 N번으로 융합하고, 헤드가 위치마다 분류와 좌표를 예측한다.',
 nodes:[
  {t:'템플릿·검색', s:'128² / 256²'},
  {t:'ResNet-50', s:'stage4, 1024ch'},
  {t:'ECA', s:'self-attention', a:'각 가지'},
  {t:'CFA', s:'cross-attention', acc:true, a:'×4 + 1'},
  {t:'예측 헤드', s:'cls + box, 1024개'}
 ]},

math:[
 {expr:'X_CF = X̃ + FFN(X̃),   X̃ = X_q + MultiHead(X_q + P_q, X_kv + P_kv, X_kv)',
  tex:'X_{CF}=\\tilde X+\\text{FFN}(\\tilde X),\\qquad \\tilde X=X_q+\\text{MultiHead}\\big(X_q+P_q,\\;X_{kv}+P_{kv},\\;X_{kv}\\big)',
  d:'$X_q$ 는 모듈이 속한 가지의 입력, $X_{kv}$ 는 반대 가지의 입력, $P$ 는 사인 공간 위치 인코딩이다. $X_q=X_{kv}$ 로 두고 FFN을 빼면 ECA의 식과 같아진다.'},
 {expr:'L_reg = Σ_j 1{y_j=1} [ λ_G L_GIoU(b_j, b̂) + λ_1 L_1(b_j, b̂) ],  λ_G=2, λ_1=5',
  tex:'\\mathcal{L}_{reg}=\\sum_j \\mathbb{1}_{\\{y_j=1\\}}\\Big[\\lambda_G\\,\\mathcal{L}_{GIoU}(b_j,\\hat b)+\\lambda_1\\,\\mathcal{L}_{1}(b_j,\\hat b)\\Big],\\quad \\lambda_G=2,\\ \\lambda_1=5',
  d:'회귀 손실은 양성 위치에서만 계산한다. 분류 손실은 모든 위치가 기여하되 음성 손실을 16배 줄여 양/음 불균형을 완화한다.'}
],

numbers:[
 {k:'LaSOT 테스트 AUC / Pnorm / P', v:'64.9 / 73.8 / 69.0', d:'Table 1. SiamR-CNN은 64.8이지만 저자들 머신에서 5 FPS 미만이고, TransT는 약 50 FPS. SiamRPN++는 49.6'},
 {k:'TrackingNet 테스트 AUC / Pnorm / P', v:'81.4 / 86.7 / 80.3', d:'Table 1. SiamR-CNN 81.2 / 85.4 / 80.0, SiamRPN++ 73.3 / 80.0 / 69.4'},
 {k:'GOT-10k AO / SR0.5 / SR0.75', v:'72.3 / 82.4 / 68.2', d:'Table 1. GOT-10k 학습셋만 쓴 TransT-GOT은 67.1 / 76.8 / 60.9로 SiamR-CNN(AO 64.9)보다 2.2 높음'},
 {k:'융합 방식 ablation (LaSOT AUC, 후처리 포함)', v:'ECA+CFA 64.9 · CFA만 62.9 · ECA+상관 57.7 · 상관만 47.7', d:'Table 3. 마지막 CFA를 depth-wise 상관으로 바꾸고 ECA도 빼면 후처리 없이는 35.3까지 내려간다'},
 {k:'원본 Transformer로 교체 (LaSOT AUC / GOT-10k AO)', v:'62.3 / 70.3 (제안 구조 64.9 / 72.3)', d:'Table 2. 템플릿을 encoder, 검색을 decoder에 넣은 변형. 그래도 상관 기반인 SiamRPN++보다 크게 높다'},
 {k:'소규모 벤치마크 AUC (NFS / OTB / UAV123)', v:'65.7 / 69.4 / 69.1', d:'Table 4. NFS는 PrDiMP 63.5를 2.2 앞섬. OTB는 PrDiMP·SiamRPN++의 69.6과 비슷한 수준'}
],

impact:'TransT는 Siamese 추적에서 사실상 표준이던 상관 융합을 attention으로 대체해도, 오히려 더 좋아진다는 것을 보인 논문이다. 같은 백본·같은 헤드에서 융합 부분만 바꿔도 LaSOT AUC가 47.7(상관만)에서 64.9로 오른다는 ablation이 핵심 증거다. 추적기가 [ResNet](#/p/resnet) 백본 위에 attention 융합을 얹는 구조가 되면서, 이후 백본과 융합을 하나의 [ViT](#/p/vit) 로 합치는 [MixFormer](#/p/mixformer) 와 [OSTrack](#/p/ostrack) 이 이어졌다.',

legacy:[
 '**[MixFormer](#/p/mixformer)**: 백본과 융합을 분리하던 구조를 합쳐 attention 안에서 특징 추출과 융합을 동시에 수행',
 '**[OSTrack](#/p/ostrack)**: 템플릿과 검색 영역을 하나의 시퀀스로 합쳐 ViT 한 줄기로 처리하는 one-stream 구조',
 '**앵커 없는 단순 헤드**: 앵커 박스 대신 위치별 분류와 정규화 좌표를 바로 예측하고, 후처리는 window penalty 하나로 줄임',
 '**융합 연산 자체를 ablation 대상으로**: ECA·CFA·상관을 하나씩 켜고 끄는 Table 3 구성으로 융합 연산이 성능을 좌우함을 보임'
],

pitfalls:[
 '**attention이 상관보다 낫다는 결론은 이 논문의 설정에서의 결과다.** 비교 변형은 같은 백본·헤드에서 마지막 CFA를 depth-wise 상관으로 바꾼 것이다. Table 3에는 후처리 포함(TransT)과 제외(TransT-np) 줄이 섞여 있어, 같은 종류의 줄끼리 비교해야 한다.',
 '**후처리(window penalty)의 비중을 구분해 읽는다.** 상관만 쓴 변형은 후처리를 빼면 LaSOT AUC가 35.3까지 떨어지고, 제안 구조도 후처리 포함 64.9, 제외 62.9로 차이가 난다.',
 '**템플릿은 첫 프레임에서 잘라 쓴다.** 논문은 템플릿 패치를 첫 프레임의 타깃 주변(한 변의 2배)으로 정의한다. 장기 추적이나 큰 외형 변화에 대한 별도 대응은 이 논문에서 다루지 않는다.'
],

figures:[
 {f:'fig2-architecture.png',
  cap:'왼쪽의 두 가지(템플릿, 검색 영역)가 같은 백본을 거쳐 벡터 집합이 된다. 붉은 점선 안이 융합 네트워크로 ECA(초록)와 CFA(주황)가 엇갈려 N번 반복된다. 마지막 CFA 출력이 헤드로 가서 위치별 분류와 박스를 낸다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'However, the correlation operation itself is a local linear matching process, leading to lose semantic information and fall into local optimum easily, which may be the bottleneck of designing high-accuracy tracking algorithms.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2103.15436 — Transformer Tracking', u:'https://arxiv.org/abs/2103.15436'},
 {t:'GitHub — chenxin-dlut/TransT', u:'https://github.com/chenxin-dlut/TransT'}
]
});
