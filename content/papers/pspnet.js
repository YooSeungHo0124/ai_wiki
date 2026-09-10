WIKI.paper({
slug:'pspnet',
venue:'CVPR 2017',
authors:'Zhao et al. (CUHK · SenseTime)',
arxiv:'1612.01105',

tldr:'물 위의 배를 "차"로, 마천루의 일부를 "빌딩"과 "스카이스크래퍼"로 동시에 예측하는 식의 오류가 **전역 문맥을 못 보기 때문**이라고 진단하고, 여러 크기로 평균 풀링한 특징을 이어붙이는 **피라미드 풀링 모듈**로 해결한 논문.',

context:'[FCN](#/p/fcn)과 그 뒤를 이은 dilated network들은 수용영역을 키워 픽셀 단위 예측을 했지만, 여전히 국소적인 외형만 보고 판단했다. [ResNet](#/p/resnet)의 이론적 수용영역은 입력 이미지보다 크지만, 실제 유효 수용영역은 그보다 훨씬 작다는 것이 알려져 있었다. 그 결과 복잡한 장면에서 문맥을 무시한 오분류가 반복됐다. ADE20K처럼 150개 클래스와 1,038개 장면 레이블이 섞인 데이터셋에서는 이 문제가 특히 두드러졌다.',

ideas:[
 {h:'세 가지 실패 유형을 먼저 관찰한다',
  lead:'문맥 없는 FCN이 실제로 어디서 왜 틀리는지 세 범주로 분류했다.',
  d:'**Mismatched Relationship**: 강 위의 물체를 "boat"가 아니라 "car"로 예측 — 배는 강 위에 있을 수 있지만 자동차는 거의 없다는 상식(공기연관 패턴)을 모델이 쓰지 못한다. **Confusion Categories**: "building"과 "skyscraper"처럼 외형이 비슷한 클래스가 한 물체 안에서 섞여 예측된다. **Inconspicuous Classes**: 베개와 침대 시트처럼 작고 색·질감이 비슷한 물체가 무시된다. 세 유형 모두 원인은 하나, **전역 문맥 정보의 부재**다.'},
 {h:'피라미드 풀링 모듈: 4단계로 문맥을 압축한다',
  lead:'1×1부터 6×6까지 네 크기로 평균 풀링해 전역·지역 문맥을 함께 만든다.',
  d:'마지막 conv 특징 맵을 1×1(전역 하나), 2×2, 3×3, 6×6 빈으로 각각 평균 풀링한다. 각 단계에 1×1 conv를 적용해 채널 수를 1/N로 줄이고(전역 특징의 비중을 유지하기 위해), bilinear 업샘플로 원래 크기로 되돌린 뒤 원본 특징 맵과 **이어붙인다(concat)**. 결과적으로 각 픽셀은 자기 주변의 국소 정보와 이미지 전체의 절반·전체를 아우르는 문맥을 동시에 갖는다.'},
 {h:'전역 평균 풀링 하나로는 부족하다는 것을 실험으로 보인다',
  lead:'단일 전역 풀링보다 4단계 피라미드가, max보다 average 풀링이 더 낫다.',
  d:'기존에도 전역 평균 풀링을 문맥 prior로 쓴 시도가 있었지만(ParseNet), 복잡한 장면에서는 하나의 벡터로 압축하면 공간 관계가 사라져 표현력이 부족했다. ablation에서 average pooling이 max pooling보다, 4단계(B1236)가 1단계(B1)보다, 차원 축소(DR)를 넣은 쪽이 일관되게 더 높은 mIoU를 냈다.'},
 {h:'ResNet에 보조 손실을 달아 깊은 네트워크를 더 잘 학습시킨다',
  lead:'res4b22 블록 뒤에 보조 분류기를 달아 두 개의 손실로 동시에 최적화한다.',
  d:'깊은 ResNet은 최적화가 어렵다. res4b22(4번째 스테이지) 출력에 보조 softmax 손실을 추가로 걸고, 최종 예측의 주 손실과 가중합(보조 손실 가중치 α=0.4)으로 함께 역전파한다. 추론 시에는 보조 분기를 버리고 주 분기만 쓴다. 이 자체가 PSPNet의 핵심 기여는 아니지만, 피라미드 풀링과 결합했을 때 더 깊은 ResNet(101, 269)을 안정적으로 학습시키는 데 쓰였다.'}
],

diagram:{type:'flow', cap:'입력 이미지 → CNN 특징 맵 → 피라미드 풀링(4단계) → concat → conv로 최종 예측. (c)의 4개 줄이 1×1/2×2/3×3/6×6 풀링.',
 nodes:[
  {t:'입력 이미지', s:'H×W×3'},
  {t:'CNN 특징 맵', s:'1/8 해상도', a:'ResNet'},
  {t:'피라미드 풀링', s:'1×1·2×2·3×3·6×6', acc:true, a:'4단계'},
  {t:'업샘플+concat', s:'원본과 이어붙임'},
  {t:'conv', s:'→ 픽셀별 클래스'}
 ]},

math:[
 {expr:'AuxLoss = MainLoss + α · Loss(res4b22 branch),  α = 0.4',
  tex:'\\mathcal{L} = \\mathcal{L}_{\\text{main}} + \\alpha\\,\\mathcal{L}_{\\text{aux}},\\quad \\alpha=0.4',
  d:'주 분기(최종 예측)의 softmax 손실에 res4b22 지점의 보조 softmax 손실을 가중합한다. 추론 시 보조 항은 버린다.'}
],

numbers:[
 {k:'ADE20K val mIoU', v:'41.68%', d:'baseline(ResNet50+dilated) 37.23% 대비 +4.45'},
 {k:'ADE20K val (ResNet269)', v:'mIoU 44.94% · Pixel Acc 81.69%', d:'멀티스케일 추론(MS) 포함, ImageNet Scene Parsing Challenge 2016 1위'},
 {k:'PASCAL VOC 2012 test mIoU', v:'85.4%', d:'20개 클래스 중 19개에서 최고 성능(MS-COCO 사전학습 포함)'},
 {k:'Cityscapes test 정확도', v:'80.2%', d:'fine+coarse 라벨 함께 학습(‡ 표기)'},
 {k:'ADE20K 전문가 라벨링 오차', v:'17.60% 픽셀 오류', d:'confusion category가 얼마나 근본적인 어려움인지 보여주는 기준선'},
 {k:'보조 손실 가중치 α', v:'0.4', d:'0.3~0.9 사이에서 실험한 값 중 최적'}
],

impact:'"수용영역이 이론상 충분하다"와 "실제로 문맥을 반영한다"가 다르다는 것을 실패 사례로 명확히 보이고, **여러 크기로 평균 풀링해 이어붙인다**는 단순한 해법으로 해결한 것이 이후 분할 모델의 표준 부품이 됐다. 피라미드 풀링 자체는 계산량을 거의 늘리지 않으면서 ADE20K·VOC·Cityscapes 세 벤치마크 모두에서 동시에 1위를 기록해, "전역 문맥 모듈 하나를 백본 위에 얹는다"는 설계 패턴을 정착시켰다.',

legacy:[
 '**ASPP와의 수렴** — 비슷한 시기의 [DeepLab](#/p/deeplab) 계열은 atrous(팽창) 합성곱으로 다중 스케일을 만들었고, [DeepLabv3+](#/p/deeplabv3plus)는 사실상 PSP의 풀링 아이디어와 ASPP를 함께 쓰는 쪽으로 수렴한다',
 '**전역 문맥 모듈의 일반화** — 이후 attention 기반 문맥 모듈(non-local, self-attention)들이 "모든 위치가 모든 위치를 본다"는 더 유연한 형태로 피라미드 풀링을 대체해 나갔다',
 '**Cityscapes/ADE20K 리더보드의 표준 백본** — PSPNet의 ResNet+dilated+보조손실 조합은 이후 여러 분할 논문의 baseline 설정으로 굳어졌다',
 '**Transformer 시대에도 남은 질문** — [SegFormer](#/p/segformer)의 MLP 디코더도 결국 여러 스테이지의 특징을 모아 문맥을 합성한다는 점에서, "다중 스케일 문맥을 어떻게 합칠 것인가"라는 PSPNet의 질문은 아키텍처가 바뀌어도 반복된다'
],

pitfalls:[
 '**피라미드 풀링은 attention이 아니다.** 각 빈은 고정된 사각 영역의 평균일 뿐, 위치별로 가중치를 학습하지 않는다. "문맥을 본다"는 표현이 뜻하는 바가 나중의 self-attention 기반 문맥 모듈과는 다르다.',
 '**보조 손실은 PSPNet의 핵심 기여가 아니다.** 피라미드 풀링 모듈과 별개로 ResNet 학습을 돕는 보조 장치이며, 두 기여를 섞어서 "PSPNet = 보조손실"로 요약하면 틀린다.',
 '**mIoU 41.68%는 ResNet50 기준값이다.** 44.94%(ResNet269 + 멀티스케일)와 혼동하기 쉽다 — 어떤 백본·설정인지 반드시 함께 밝혀야 한다.'
],

figures:[
 {f:'fig3-architecture.png',
  cap:'(b) 마지막 conv 특징 맵을 (c)에서 4가지 크기(1×1·2×2·3×3·6×6)로 각각 average pooling한 뒤 conv로 채널을 줄이고, 원본 크기로 업샘플해 concat한다. (d) 그 결과에 conv 하나만 더해 픽셀별 클래스를 예측한다 — 구조 전체가 "풀링 4번 + 이어붙이기"로 요약된다.',
  src:'원문 Figure 3, p.4'},
 {f:'fig2-failures.png',
  cap:'세 행이 각각 다른 실패 유형. 1행: 노란 박스 안 배가 FCN(c)에서는 파란(car) 계열로 잘못 칠해졌지만 PSPNet(d)은 올바른 색으로 고친다. 2행: FCN이 마천루 내부를 건물(분홍)과 스카이스크래퍼(회색)로 나눠 칠하는 것을 PSPNet이 하나로 통일한다. 3행: 베개(하늘색)를 FCN이 놓치지만 PSPNet은 박스 안에서 잡아낸다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'FCN predicts the boat in the yellow box as a "car" based on its appearance. But the common knowledge is that a car is seldom over a river.',
  src:'Section 3.1, p.3'}
],

links:[
 {t:'arXiv 1612.01105 — Pyramid Scene Parsing Network', u:'https://arxiv.org/abs/1612.01105'},
 {t:'공식 코드 (hszhao/PSPNet)', u:'https://github.com/hszhao/PSPNet'}
]
});
