WIKI.paper({
slug:'coatnet',
venue:'NeurIPS 2021',
authors:'Dai, Liu, Le, Tan (Google Research, Brain Team)',
arxiv:'2106.04803',

tldr:'합성곱과 attention을 **경쟁 관계가 아니라 보완 관계**로 보고, 왜·어디서·어떻게 섞어야 하는지를 일반화(generalization)와 용량(capacity)이라는 두 축으로 실험해 답한 논문. 결론은 깊이 방향으로 "합성곱 두 단계 다음 attention 두 단계(C-C-T-T)"를 쌓는 것.',

context:'[ViT](#/p/vit)는 attention이 합성곱보다 표현력(용량)은 크지만, 이미지 특유의 귀납 편향(inductive bias)이 없어 데이터가 적으면 [EfficientNet](#/p/efficientnet) 같은 ConvNet에 진다는 것이 알려져 있었다. 이후 연구들은 대부분 "ViT에 합성곱스러운 요소를 조금 섞자"는 식의 임의적 시도였고, **어떤 조합이 왜 더 나은지**에 대한 원리적 설명이 없었다. 이 논문은 두 가지를 묻는다 — 합성곱과 attention을 수식 차원에서 **하나의 연산으로 통합**할 수 있는가, 그리고 통합된 블록을 네트워크 안에서 **어느 깊이에** 배치해야 하는가.',

ideas:[
 {h:'깊이별 합성곱과 attention은 같은 형태의 연산이다',
  lead:'둘 다 "위치 i의 출력 = 주변 값의 가중합"이라는 같은 수식 틀에 들어간다.',
  d:'깊이별 합성곱은 $y_i=\\sum_{j\\in L(i)} w_{i-j}x_j$, self-attention은 $y_i=\\sum_{j\\in G} A_{i,j}x_j$ 로 쓴다. 전자는 가중치 $w_{i-j}$ 가 **입력과 무관한 고정값**(이동 등변성을 줌)이고, 후자는 $A_{i,j}$ 가 **입력에 따라 동적으로 계산**된다(용량을 줌). 두 항을 softmax 정규화 전에 더하면($x_i^\\top x_j + w_{i-j}$), 정적 커널의 일반화와 동적 가중치의 용량을 **하나의 attention 식 안에서 동시에** 얻는다.'},
 {h:'상대 attention: 최소 비용으로 합성곱의 이점을 얹는다',
  lead:'전역 정적 커널 $w_{i-j}$ 를 attention score에 더하기만 하면 추가 계산이 거의 없다.',
  d:'$w_{i-j}$ 를 벡터가 아니라 스칼라로 두면, 모든 $(i,j)$ 쌍의 $w_{i-j}$ 를 구하는 계산이 이미 attention이 계산하는 pairwise dot-product에 자연히 얹힌다. 추론 시에는 한 번만 계산해 캐시하면 되므로 거의 공짜다. 이 변형은 입력에 의존하지 않는 상대 위치 파라미터라는 점에서 [T5](#/p/t5)의 상대 위치 편향과 비슷하지만, 층마다 파라미터를 공유하지 않고 지역 윈도로 제한하지도 않는다(전역).'},
 {h:'다운샘플링 방식: 전역 attention을 쓰려면 먼저 해상도를 줄여야 한다',
  lead:'ViT식 한 번에 16배 축소 대신, ConvNet처럼 5단계로 점진적으로 줄인다.',
  d:'attention을 원본 픽셀에 바로 걸면 $O(n^2)$ 이 감당이 안 된다. 지역 attention([Swin](#/p/swin) 계열)은 TPU에서 메모리 접근 패턴이 느려 오히려 손해였고, 선형 attention은 성능이 부족했다. 그래서 ConvNet처럼 S0~S4 5단계로 해상도를 1/2, 1/4, 1/8, 1/16, 1/32로 점진적으로 줄이면서, 뒤쪽 단계(S3, S4)에서만 **전역** 상대 attention을 쓴다.'},
 {h:'C-C-T-T: 어느 깊이부터 attention을 쓸지는 실험으로 정한다',
  lead:'S0~S4를 합성곱(C)/attention(T)으로 채우는 5가지 조합을 일반화·용량 두 기준으로 비교한다.',
  d:'ImageNet-1K(적은 데이터)에서는 일반화 격차가 `C-C-C-C ≈ C-C-C-T ≥ C-C-T-T > C-T-T-T > ViT_REL` 순으로, 합성곱이 많을수록 유리했다. JFT(방대한 데이터)에서는 용량이 `C-C-T-T ≈ C-T-T-T > ViT_REL > C-C-C-T > C-C-C-C` 순으로, attention이 많을수록 유리했다. 두 기준을 모두 만족하는 지점이 **C-C-T-T**이고, 전이 성능 테스트(Table 2)에서도 C-T-T-T보다 확실히 앞서 최종 채택됐다.'},
 {h:'MBConv와 FFN은 이미 같은 골격이다',
  lead:'둘 다 채널을 4배로 확장했다 되돌리는 "역병목(inverted bottleneck)" 구조를 공유한다.',
  d:'[EfficientNet](#/p/efficientnet) 계열의 MBConv 블록(깊이별 합성곱 기반)과 Transformer의 FFN은 형태가 같아서, C 단계와 T 단계를 이어 붙여도 구조적 이질감이 적다. 이 유사성이 합성곱-attention 통합을 자연스럽게 만든 두 번째 근거다.'}
],

diagram:{type:'stack', cap:'CoAtNet의 5단계 구조. 앞쪽은 합성곱(공간 축소), 뒤쪽은 전역 상대 attention(용량).',
 layers:[
  {t:'S0: Conv Stem', s:'1/2 해상도, 2층', note:'ViT의 패치 분할 대체'},
  {t:'S1: MBConv', s:'1/4, 깊이별 conv'},
  {t:'S2: MBConv', s:'1/8, 깊이별 conv', note:'전체 연산량 큰 비중'},
  {t:'S3: Attention', s:'1/16, 상대 attention', acc:true, note:'전역 · 용량 담당'},
  {t:'S4: Attention', s:'1/32, 상대 attention', acc:true}
 ]},

math:[
 {expr:'y_i = Σ_{j∈G} [ exp(x_i·x_j) / Σ_k exp(x_i·x_k) ] x_j   (self-attention, 재정렬)',
  tex:'y_i=\\sum_{j\\in G}\\underbrace{\\frac{\\exp(x_i^{\\top}x_j)}{\\sum_{k\\in G}\\exp(x_i^{\\top}x_k)}}_{A_{i,j}}x_j',
  d:'깊이별 합성곱 $y_i=\\sum_{j\\in L(i)}w_{i-j}x_j$ 과 비교하면, 차이는 가중치가 **고정 커널**이냐 **입력 의존 attention**이냐, 그리고 이웃 범위가 **지역** $L(i)$ 이냐 **전역** $G$ 이냐 뿐이다.'},
 {expr:'y_i = Σ_j [ exp(x_i·x_j + w_{i-j}) / Σ_k exp(x_i·x_k + w_{i-k}) ] x_j   (상대 attention)',
  tex:'y_i^{\\text{pre}}=\\sum_{j\\in G}\\frac{\\exp\\!\\left(x_i^{\\top}x_j+w_{i-j}\\right)}{\\sum_{k\\in G}\\exp\\!\\left(x_i^{\\top}x_k+w_{i-k}\\right)}x_j',
  d:'softmax 안에서 입력 의존 점수 $x_i^\\top x_j$ 에 위치만으로 정해지는 정적 항 $w_{i-j}$ 를 더한다. 이것이 CoAtNet이 실제로 쓰는 relative attention이고, 정규화 전에 더하는(pre-normalization) 버전이 정규화 후에 더하는 버전보다 성능이 좋았다.'}
],

numbers:[
 {k:'IN-1K only · CoAtNet-3', v:'86.0% top-1', d:'384² 입력, 168M 파라미터, 추가 데이터 없이 NFNet-F5와 동급'},
 {k:'IN-21K→IN-1K · 최고', v:'88.56% top-1', d:'512² · 275M · PT-RA-E150. ViT-H/14(632M, JFT-300M 사전학습)의 88.55%를 **23배 적은 사전학습 데이터**로 동률'},
 {k:'JFT-3B · CoAtNet-7', v:'90.88% top-1', d:'2.44B 파라미터, 512², 당시 신기록. ViT-G/14(1.84B) 대비 연산량 1.5배 적은 CoAtNet-6가 90.45%로 동률'},
 {k:'IN-21K 사전학습 규모', v:'1270만 장', d:'JFT-300M(3억 장) 대비 23배 작음'},
 {k:'가장 작은 모델', v:'CoAtNet-0 · 25M', d:'IN-1K only 81.6% top-1 (224²)'},
 {k:'상대 attention 효과', v:'+0.5%p (IN-21K 전이)', d:'Table 6 ablation: 상대 attention 있음 87.9% vs 없음 87.4% (사전학습 정확도는 거의 동일 — 용량이 아니라 일반화 개선)'}
],

impact:'"Transformer가 ConvNet을 이긴다"가 아니라 **"어떤 조합이 어떤 데이터 규모에 맞는가"** 로 질문을 바꿨다. 이후 비전 백본 설계에서 "앞은 합성곱, 뒤는 attention"이라는 계층적 하이브리드 배치가 하나의 표준 패턴으로 자리잡았고, 소규모 데이터에서 ViT가 약한 이유(귀납 편향 부재)와 그 해법(정적 위치 항을 attention에 주입)을 정량적으로 보여준 참고 사례가 되었다. JFT-3B 스케일 실험은 이후 [ViT-22B](#/p/vit)류 초대형 비전 모델 스케일링 논의의 비교 기준점 중 하나가 되었다.',

legacy:[
 '**계층적 하이브리드 배치의 표준화** — "앞단 conv, 뒷단 attention" 레시피가 이후 여러 비전 백본 설계의 기본 선택지가 됨',
 '**상대 attention의 재발견** — [T5](#/p/t5)식 상대 위치 편향을 비전에 적용해, 위치 인코딩을 attention score에 더하는 방식이 이후 표준 도구가 됨',
 '**데이터 규모별 설계 원칙** — "얼마나 큰 데이터로 학습하는지가 최적 아키텍처를 바꾼다"는 관점이 이후 스케일링 연구의 공통 전제가 됨',
 '**[EfficientNet](#/p/efficientnet)과 [ViT](#/p/vit)의 접점** — MBConv와 attention을 원리적으로 이어붙인 첫 사례로, 이후 [InternImage](#/p/internimage) 같은 "ViT 대안" 논의에서도 비교 대상으로 인용됨'
],

pitfalls:[
 '**"CoAtNet은 합성곱+attention을 섞은 모델"이라고만 알면 절반만 아는 것이다.** 핵심은 섞는 방식이 아니라, 일반화·용량이라는 두 기준으로 **어느 깊이에 무엇을 둘지 실험으로 결정**한 방법론이다. C-C-T-T는 결론이지 전제가 아니다.',
 '**ImageNet 수치를 인용할 때 사전학습 데이터를 반드시 함께 적어야 한다.** 86.0%(IN-1K only), 88.56%(IN-21K), 90.88%(JFT-3B)는 완전히 다른 학습 조건의 결과이며, 데이터 없이 숫자만 옮기면 오해를 낳는다.',
 '**상대 attention은 T5식과 완전히 같지 않다.** 층 간 파라미터를 공유하지 않고 버킷팅도 쓰지 않는 입력 독립(input-independent) 변형이라는 점이 원문에 명시돼 있다.'
],

figures:[
 {f:'fig-scaling-curve.png',
  cap:'ImageNet-21K→1K 전이 시 파라미터 수 대비 정확도. 빨간 선(CoAtNet)이 같은 파라미터에서 CvT·SwinTFM·ViT보다 항상 위에 있고, 275M에서 88.56%로 ViT-H/14(632M, JFT-300M)의 88.55%를 앞지른다 — x축이 파라미터 수임에 주의.',
  src:'원문 Figure 3, p.7'}
],

quotes:[
 {t:'Transformers have attracted increasing interests in computer vision, but they still fall behind state-of-the-art convolutional networks. In this work, we show that while Transformers tend to have larger model capacity, their generalization can be worse than convolutional networks due to the lack of the right inductive bias.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2106.04803 — CoAtNet', u:'https://arxiv.org/abs/2106.04803'},
 {t:'Google AI Blog — CoAtNet', u:'https://research.google/blog/coatnet-fast-and-accurate-models-for-large-scale-image-recognition/'}
]
});
