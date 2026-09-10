WIKI.paper({
slug:'instance-norm',
venue:'arXiv 2016 (short note; full version arXiv:1701.02096)',
authors:'Ulyanov, Vedaldi, Lempitsky (Skoltech · Yandex · Oxford)',
arxiv:'1607.08022',

tldr:'스타일 변환 생성망에서 [BatchNorm](#/p/batchnorm)을 **이미지 한 장 단위로 정규화하는 InstanceNorm**으로 바꿨더니 품질이 크게 좋아졌다는 짧은 리포트. 배치 통계가 아니라 각 이미지 자신의 H×W 픽셀만으로 평균·분산을 구한다는 한 줄 차이가 전부다.',

context:'2016년 Gatys의 스타일 변환(신경망 특징 통계를 반복 최적화로 맞추는 방식)은 512×512 이미지 한 장에 수 분이 걸렸다. Ulyanov(2016)와 Johnson(2016)은 이를 순전파 한 번으로 대체하는 생성망을 학습시켰지만, 결과 품질이 느린 최적화 방법에 못 미쳤다. 특히 학습 이미지 수를 늘릴수록 오히려 결과가 나빠지는 역설이 있었다 — 수천 장보다 **16장**으로 학습한 모델이 더 나은 결과를 냈다. 저자들은 이 학습 목표 자체가 표준 CNN 구조로는 배우기 어려운 무언가를 요구한다고 의심했다.',

ideas:[
 {h:'스타일 변환에서 대비(contrast)는 콘텐츠와 무관해야 한다',
  lead:'스타일화 결과의 대비는 콘텐츠 이미지가 아니라 스타일 이미지가 결정해야 한다.',
  d:'저자들은 콘텐츠 이미지의 대비를 인위적으로 낮춘 뒤 같은 스타일을 입혀 보였다(원문 Figure 2). 저대비 원본을 넣어도 스타일화 결과의 대비는 거의 변하지 않았다 — **스타일화 결과의 대비는 스타일 이미지가 결정하고 콘텐츠 대비와는 거의 무관하다**는 관찰이다. 즉 생성망은 학습 과정에서 콘텐츠 이미지의 **instance-specific한 대비 정보를 버리는 법**을 배워야 하는데, 표준 conv+pooling+ReLU 조합만으로는 이런 비선형 정규화 함수를 표현하기가 쉽지 않다.'},
 {h:'대비 정규화를 층으로 직접 박아 넣는다',
  lead:'배우게 하기 어려운 대비 제거를 아예 정규화 층으로 구조에 넣어버린다.',
  d:'식으로 표현하면 "대비 정규화"는 각 이미지의 각 채널을 자기 자신의 공간 합으로 나누는 연산이다. 이런 함수를 ReLU와 conv의 조합으로 근사하게 학습시키는 대신, 저자들은 정규화 층 자체를 그 역할을 하도록 설계했다. 생성망이 배워야 할 것을 아키텍처가 대신 해주는 선택이다.'},
 {h:'InstanceNorm: 배치가 아니라 이미지 1장의 H×W로 정규화',
  lead:'배치 전체가 아니라 이미지 한 장의 H×W 픽셀만으로 평균·분산을 구한다.',
  d:'[BatchNorm](#/p/batchnorm)은 배치의 $T$장 전부와 $H \\times W$ 공간 위치를 모두 합쳐 채널별 평균·분산을 낸다. InstanceNorm은 이 합산 범위에서 **배치 축 $T$를 빼고 이미지 한 장의 $H \\times W$ 만** 남긴다. 그 결과 이미지마다, 채널마다 독립적인 평균·분산으로 정규화되며, 이는 곧 "각 이미지 자신의 대비·밝기 정보를 지운다"는 뜻이다. 논문은 이를 "instance normalization (also known as contrast normalization)"이라 부른다.'},
 {h:'학습·테스트 양쪽에서 인스턴스 통계를 그대로 쓴다',
  lead:'BatchNorm처럼 이동평균을 얼려 테스트에 쓰지 않고, 테스트 때도 그 이미지 자신의 통계를 다시 계산한다.',
  d:'BatchNorm은 학습 중 이동평균한 배치 통계를 테스트 때 고정값으로 얼려 쓴다. InstanceNorm은 애초에 통계가 그 이미지 자신의 것이므로 이런 단순화가 불필요하고, 저자들은 **테스트 시점에도 매 입력마다 통계를 새로 계산**하도록 그대로 남겼다. 이것이 이 논문에서 실제로 바꾼 유일한 구조적 변경이다.'},
 {h:'경량 변경으로 두 기존 생성망 모두 개선',
  lead:'Ulyanov(2016)와 Johnson(2016) 두 생성망 모두에서 BatchNorm을 InstanceNorm으로 바꾸기만 해도 품질이 개선됐다.',
  d:'저자들은 두 아키텍처(Ulyanov 2016, Johnson 2016)를 각각 재현하고, 다른 하이퍼파라미터는 그대로 둔 채 정규화 층만 교체해 재학습했다. 두 아키텍처 모두 눈에 띄게 개선됐고(원문 Figure 5), 그중 Johnson의 residual 구조가 더 효율적이어서 이후 결과에 채택됐다.'}
],

diagram:{type:'compare', cap:'같은 텐서 x ∈ R^(T×C×H×W)에서 평균·분산을 구하는 축이 다르다 — 무엇을 "하나의 통계 단위"로 보는지의 차이.',
 left:{t:'BatchNorm', items:['배치 T장 + H×W 전부로 평균/분산','채널마다 배치 전체의 공동 통계','학습 시 이동평균, 테스트 시 고정값 사용']},
 right:{t:'InstanceNorm', items:['이미지 1장의 H×W만으로 평균/분산','이미지·채널마다 독립적인 통계','테스트 때도 매번 새로 계산, 고정 안 함']}},

math:[
 {expr:'BatchNorm: y_tijk = (x_tijk - mu_i) / sqrt(sigma_i^2 + eps),  mu_i, sigma_i^2 은 t(배치)와 l,m(공간) 전부에 대한 평균',
  tex:'y_{tijk}=\\frac{x_{tijk}-\\mu_i}{\\sqrt{\\sigma_i^2+\\epsilon}},\\quad \\mu_i=\\frac{1}{HWT}\\sum_{t=1}^{T}\\sum_{l=1}^{W}\\sum_{m=1}^{H}x_{tilm}',
  d:'채널 $i$ 하나마다 배치 $T$장과 공간 $H\\times W$ 전부를 합쳐 평균·분산을 낸다. 같은 채널이라도 배치 구성이 바뀌면 통계가 바뀐다.'},
 {expr:'InstanceNorm: y_tijk = (x_tijk - mu_ti) / sqrt(sigma_ti^2 + eps),  mu_ti, sigma_ti^2 은 l,m(공간)만의 평균',
  tex:'y_{tijk}=\\frac{x_{tijk}-\\mu_{ti}}{\\sqrt{\\sigma_{ti}^2+\\epsilon}},\\quad \\mu_{ti}=\\frac{1}{HW}\\sum_{l=1}^{W}\\sum_{m=1}^{H}x_{tilm}',
  d:'평균·분산에 배치 인덱스 $t$가 그대로 남아, 이미지 $t$의 채널 $i$마다 **따로** 계산된다. BatchNorm 식과 비교하면 합산 범위에서 $\\sum_t$ 하나가 빠진 것이 전부다.'}
],

numbers:[
 {k:'학습 이미지 수 (개선 전)', v:'16장 > 수천 장', d:'BatchNorm 시절엔 학습 이미지를 늘릴수록 결과가 오히려 나빠지는 역설이 있었음'},
 {k:'구조 변경', v:'정규화 층 1곳', d:'생성망 g 안의 batch norm을 instance norm으로 교체 — 그 외 구조·하이퍼파라미터 동일'},
 {k:'테스트 시 동작', v:'통계를 매번 재계산', d:'BatchNorm처럼 이동평균을 얼려 쓰지 않고 입력마다 새로 정규화'},
 {k:'검증 아키텍처', v:'2종 (Ulyanov 2016 · Johnson 2016)', d:'서로 다른 생성망 구조 둘 다에서 개선을 확인'}
],

impact:'딱 한 줄, 정규화 축에서 배치 차원을 빼는 것만으로 스타일 변환 품질이 "확연히" 좋아진다는 것을 보였다. 이후 스타일 변환·이미지 생성 계열에서 [BatchNorm](#/p/batchnorm) 대신 InstanceNorm을 기본값으로 쓰는 관행이 자리 잡았다. 핵심 메시지는 좁지만 분명하다 — **정규화가 무엇을 "하나의 단위"로 보는지(배치 vs 인스턴스)가 태스크에 따라 결과를 크게 바꾼다**는 것이며, 이는 이후 [LayerNorm](#/p/layernorm)·GroupNorm 등 "배치를 쓰지 않는 정규화" 계열 연구의 출발점 중 하나가 됐다.',

legacy:[
 '**스타일 변환/이미지 생성 표준 부품** — [pix2pix](#/p/pix2pix)와 [CycleGAN](#/p/cyclegan)의 생성망은 InstanceNorm을 기본 정규화로 채택해, "이미지 변환 GAN에는 BatchNorm보다 InstanceNorm"이 관행으로 굳어졌다',
 '**AdaIN·스타일 주입 기법의 토대** — 인스턴스 통계(평균·분산)를 스타일 신호로 다루는 발상은 이후 정규화 파라미터 자체로 스타일을 주입하는 기법들의 출발점이 됐다',
 '**배치와 무관한 정규화 계열** — [LayerNorm](#/p/layernorm)과 함께 "배치 크기에 의존하지 않는 정규화"라는 방향을 연 초기 사례로 인용된다',
 '**순수 conv 구조에서의 재조명** — [ConvNeXt](#/p/convnext)를 비롯한 최근 conv 아키텍처 논의에서도 정규화 층 선택(배치/레이어/인스턴스 단위) 비교의 한 축으로 다시 언급된다'
],

pitfalls:[
 '**InstanceNorm이 BatchNorm의 상위호환은 아니다.** 대비를 지우는 것이 유리한 스타일 변환·이미지 생성 태스크에서 통했다는 것이지, 분류처럼 이미지 자체의 밝기·대비가 클래스 판별에 도움이 되는 태스크에 일반적으로 더 낫다는 근거는 이 논문에 없다.',
 '**배치 크기가 작아서 InstanceNorm을 쓰는 것과는 동기가 다르다.** GroupNorm 등은 "배치가 작아 BatchNorm 통계가 불안정하다"는 문제를 풀지만, 이 논문의 동기는 배치 크기와 무관하게 **각 이미지의 대비 정보 자체를 지우는 것**이 스타일 변환에 유리하다는 것이다.',
 '**테스트 시에도 통계를 다시 구한다는 점을 놓치기 쉽다.** BatchNorm 구현에 익숙하면 "학습 때 얼린 통계를 테스트에 쓴다"고 가정하기 쉬운데, InstanceNorm은 그 이미지 자신의 통계이므로 얼릴 이동평균 자체가 없다.'
],

figures:[
 {f:'fig2-contrast.png',
  cap:'위 행(a,b)은 원본 대비의 콘텐츠 이미지와 그 스타일화 결과, 아래 행(c,d)은 대비를 낮춘 같은 콘텐츠 이미지와 그 스타일화 결과. 콘텐츠 대비가 달라도 (b)와 (d)의 대비는 거의 같다 — 스타일화 결과의 대비를 콘텐츠가 아니라 스타일이 결정한다는 관찰의 근거.',
  src:'원문 Figure 2, p.2'}
],

quotes:[
 {t:'Intuitively, the normalization process allows to remove instance-specific contrast information from the content image, which simplifies generation.',
  src:'Section 1, p.2'}
],

links:[
 {t:'arXiv 1607.08022 — Instance Normalization', u:'https://arxiv.org/abs/1607.08022'},
 {t:'arXiv 1701.02096 — 전체 버전', u:'https://arxiv.org/abs/1701.02096'},
 {t:'공식 구현 (texture_nets)', u:'https://github.com/DmitryUlyanov/texture_nets'}
]
});
