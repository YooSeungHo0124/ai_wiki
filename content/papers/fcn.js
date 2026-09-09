WIKI.paper({
slug:'fcn',
venue:'CVPR 2015 (Best Paper Honorable Mention)',
authors:'Jonathan Long, Evan Shelhamer, Trevor Darrell (UC Berkeley)',
arxiv:'1411.4038',

tldr:'분류용 CNN의 **완전연결층을 1×1 convolution으로 재해석**해서, 임의 크기의 이미지를 넣으면 임의 크기의 예측 맵이 나오는 네트워크를 만든 논문. 여기에 upsampling과 얕은 층의 skip 연결을 더해 **픽셀 단위 예측을 end-to-end로 학습**하는 방식을 확립했고, 이후 모든 시맨틱 세그멘테이션 구조의 출발점이 됐다.',

context:'2014년까지 세그멘테이션에 CNN을 쓰는 방식은 **패치 단위 분류**였다. 각 픽셀 주변을 잘라내 CNN에 넣고 그 픽셀의 클래스를 맞히는 식이다. 문제가 뻔했다 — 이웃 픽셀들의 패치가 거의 겹치는데도 계산을 처음부터 다시 하니 **엄청나게 느렸고**, 패치 크기가 곧 문맥 크기라 지역 정보와 전역 정보의 균형을 맞추기 어려웠으며, 후처리(superpixel, CRF, region proposal)가 반드시 필요했다. 한편 [AlexNet](#/p/alexnet)·[VGG](#/p/vgg) 같은 분류망은 강력한 표현을 이미 학습해두고 있었지만, 마지막 완전연결층이 입력 크기를 224×224로 고정하고 공간 정보를 벡터로 뭉개버려 그대로 쓸 수 없었다. 이 논문의 질문은 **"완전연결층을 꼭 완전연결층으로 봐야 하는가"** 였다.',

ideas:[
 {h:'완전연결층은 사실 커널이 큰 convolution이다',
  lead:'fc 가중치를 그대로 reshape해 conv로 봐서 입력 크기 제약을 없앤다.',
  d:'VGG의 7×7×512 feature를 받는 4096차원 fc 층은, 커널 크기 7×7·출력 채널 4096인 convolution과 **완전히 같은 연산**이다. 가중치를 그대로 reshape하기만 하면 된다. 이렇게 보는 순간 입력 크기 제약이 사라진다 — 500×500 이미지를 넣으면 fc가 아니라 conv로 동작하며 여러 위치에 대한 출력이 **한 장의 맵**으로 나온다. 게다가 겹치는 영역의 계산이 자동으로 공유되므로, 패치를 하나씩 돌리는 것보다 압도적으로 빠르다.'},
 {h:'"convolution화"는 사전학습 자산을 그대로 가져온다',
  lead:'분류망 가중치를 그대로 초기값 삼아 세그멘테이션 데이터 부족을 우회한다.',
  d:'ImageNet에서 학습된 분류망의 가중치를 **하나도 버리지 않고** 세그멘테이션 모델의 초기값으로 쓸 수 있다는 것이 실용적으로 결정적이었다. 세그멘테이션 라벨은 픽셀마다 칠해야 해서 데이터가 극히 비싼데, 표현 학습의 대부분을 분류 데이터셋에서 빌려올 수 있게 된 것이다. 논문은 AlexNet·VGG·GoogLeNet을 모두 변환해 비교하고 VGG-16이 가장 좋다고 보고한다.'},
 {h:'Upsampling = 학습되는 transposed convolution',
  lead:'고정 보간 대신 학습되는 역방향 conv로 해상도를 되돌린다.',
  d:'conv와 pooling을 거치면 출력 맵은 입력의 1/32로 줄어든다. 이를 원본 해상도로 되돌릴 때 논문은 고정된 보간 대신 **역방향 stride convolution(deconvolution / transposed conv)**을 쓰고, 그 커널까지 함께 학습시킨다. 초기값은 bilinear 보간으로 두어 학습 초반의 안정성을 확보한다. 이로써 다운샘플링부터 업샘플링까지 전 과정이 하나의 미분 가능한 네트워크가 된다.'},
 {h:'Skip 연결: 깊은 층의 "무엇"과 얕은 층의 "어디"를 합친다',
  lead:'깊은 층의 의미와 얕은 층의 위치 정보를 더해 경계를 선명하게 만든다.',
  d:'깊은 층은 의미는 잘 알지만 위치가 뭉개져 있고(1/32 해상도), 얕은 층은 위치는 정확하지만 의미가 약하다. FCN은 pool5의 예측을 2배 업샘플해 pool4의 예측과 더하고(FCN-16s), 다시 2배 업샘플해 pool3와 더한다(FCN-8s). 단순한 덧셈이지만 경계가 눈에 띄게 선명해진다 — 32s는 59.4, 16s는 62.4, 8s는 62.7 mean IU다. **이 "깊은 의미 + 얕은 위치" 결합이 이후 세그멘테이션 구조의 기본 문법**이 된다.'},
 {h:'손실도 픽셀 단위로, 학습도 통째로',
  lead:'모든 픽셀의 손실을 합산해 한 이미지를 픽셀 수만큼의 학습 예제로 쓴다.',
  d:'출력 맵의 모든 픽셀에서 softmax cross entropy를 계산해 더한다. 즉 **이미지 한 장이 픽셀 개수만큼의 학습 예제**로 작동하므로 배치 크기가 작아도 학습이 된다. 패치 샘플링을 따로 하는 것과 비교 실험까지 해서, 전체 이미지 학습이 더 효율적임을 보인다.'}
],

figures:[
 {f:'fig1-pixelwise-prediction.png',
  cap:'왼쪽 입력 이미지가 conv 블록(96→256→384→384→256→4096→4096→21)을 통과하는 과정 — 블록이 점점 얇아지는 것이 해상도가 줄어드는 것을 나타낸다. 마지막 21채널(PASCAL 클래스 수)짜리 얇은 블록이 다시 원래 크기로 업샘플되어 오른쪽의 색칠된 segmentation 결과(고양이=보라, 배경=초록)가 된다. fc층까지 전부 conv로 바꿨기 때문에 이 전체 경로가 끊김 없이 한 번의 forward/backward로 학습된다는 것이 화살표(forward/inference, backward/learning)가 보여주는 요점이다.',
  src:'원문 Figure 1, p.1'},
 {f:'fig3-skip-fusion.png',
  cap:'같은 네트워크에서 세 가지 예측을 뽑아내는 경로. 실선(FCN-32s)은 가장 깊은 pool5 예측을 32배 한 번에 업샘플 — 거칠다. 점선(FCN-16s)은 pool4의 얕은 예측을 2배 업샘플된 pool5 예측과 더한(Σ) 뒤 16배 업샘플 — 더 세밀하다. 점선(FCN-8s)은 pool3 예측까지 한 번 더 더해 8배 업샘플한다. 즉 격자 칸이 성긴 것(pool5)일수록 "의미"가 강하고, 촘촘한 것(pool3)일수록 "위치"가 정확하다는 트레이드오프를 층을 더할수록 완화해 가는 구조다.',
  src:'원문 Figure 3, p.6'}
],

quotes:[
 {t:'Our key insight is to build "fully convolutional" networks that take input of arbitrary size and produce correspondingly-sized output with efficient inference and learning.',
  src:'Abstract, p.1'}
],

diagram:{type:'flow', cap:'VGG-16을 통째로 convolution화한 뒤 업샘플하고, pool4·pool3의 얕은 예측과 더해(FCN-16s→8s) 경계를 살린다.',
 nodes:[
  {t:'임의 크기 입력', s:'H × W × 3'},
  {t:'VGG-16 백본', s:'conv 스택 → pool5, H/32'},
  {t:'fc → 1×1 conv', s:'fc6·fc7, 4096ch', acc:true},
  {t:'score conv', s:'1×1, 클래스 수 채널'},
  {t:'upsample+skip', s:'32s → 16s → 8s'},
  {t:'픽셀별 클래스 맵', s:'H × W'}
 ]},

math:[
 {expr:'y_ij = f_ks( { x_(si+δi), (sj+δj) }  for 0 ≤ δi, δj < k )',
  tex:'y_{ij} = f_{ks}\\big(\\{x_{si+\\delta i,\\ sj+\\delta j}\\}_{0\\le \\delta i,\\delta j<k}\\big)',
  d:'conv·pool·활성화가 모두 이 형태(커널 $k$, stride $s$)로 표현되고, 이런 층의 합성은 다시 같은 형태가 된다. 논문이 말하는 **"네트워크 전체가 하나의 거대한 비선형 필터"**라는 관점이 여기서 나온다.'},
 {expr:'L(x; θ) = Σ_ij  ℓ( f(x; θ)_ij ,  y_ij )',
  tex:'L(x;\\theta) = \\sum_{ij} \\ell\\big(f(x;\\theta)_{ij},\\, y_{ij}\\big)',
  d:'손실을 출력 맵의 모든 위치에서 합산한다. 이 합산 구조 덕분에 전체 이미지에 대한 한 번의 학습이 곧 모든 패치에 대한 학습과 같아진다.'}
],

numbers:[
 {k:'PASCAL VOC 2012 test', v:'62.2% mean IU', d:'직전 최고(SDS 51.6%) 대비 **상대 20% 개선**'},
 {k:'skip 단계별 (VOC 2011 val)', v:'32s 59.4 → 16s 62.4 → 8s 62.7', d:'얕은 층을 더할수록 경계가 선명해진다'},
 {k:'추론 시간', v:'약 175 ms / 이미지', d:'Tesla K40c. 패치 기반 방식 대비 수백 배 빠름'},
 {k:'NYUDv2 (RGB-HHA)', v:'34.0% mean IU', d:'FCN-16s. 깊이 정보를 채널로 추가'},
 {k:'SIFT Flow', v:'39.5% mean IU (semantic) · 94.3% acc (geometric)', d:'하나의 네트워크로 두 라벨 체계를 동시에 예측'},
 {k:'학습 시간', v:'FCN-32s 3일, 이후 각 1일', d:'단일 GPU 미세조정'}
],

impact:'첫째, **세그멘테이션이 "분류 + 후처리"에서 "하나의 네트워크"로 바뀌었다.** superpixel, region proposal, 다단계 파이프라인이 필요 없어지고 문제 정의가 단순해졌다. 둘째, 분류망의 사전학습 가중치를 밀집 예측에 전용하는 것이 표준 관행이 됐고, 이는 세그멘테이션 라벨의 희소성이라는 현실적 제약을 우회하는 방법이 됐다. 셋째, "인코더로 줄이고 디코더로 늘리며 skip으로 잇는다"는 구조가 사실상 밀집 예측의 기본형이 되어, 세그멘테이션은 물론 깊이 추정·광학 흐름·이미지 변환까지 같은 골격으로 다뤄지게 됐다. 넷째, 1/32까지 줄였다가 되돌리는 데서 오는 해상도 손실이라는 **명확한 다음 과제**를 남겼다.',

legacy:[
 '**U자 구조로의 발전** — 같은 해에 [U-Net](#/p/unet)이 skip을 덧셈이 아닌 채널 concat으로, 디코더를 인코더와 대칭으로 키워 저데이터 의료영상에서 압도적 결과를 냈다',
 '**해상도 손실과의 싸움** — [DeepLab](#/p/deeplab)이 pooling으로 줄이는 대신 atrous(dilated) convolution으로 해상도를 유지한 채 수용 영역을 키우는 대안을 제시했다',
 '**인스턴스 단위로 확장** — [Mask R-CNN](#/p/mask-rcnn)이 검출 박스마다 작은 FCN 헤드를 붙여 시맨틱 세그멘테이션을 인스턴스 세그멘테이션으로 끌어올렸다',
 '**밀집 예측 일반의 골격** — 인코더–디코더 + skip 구조는 [pix2pix](#/p/pix2pix)의 생성기, [DDPM](#/p/ddpm)의 노이즈 예측망 등 세그멘테이션 바깥에서도 반복해서 재사용된다'
],

pitfalls:[
 '**FCN이 "완전연결층 없는 CNN"을 처음 만든 것은 아니다.** conv로 밀집 출력을 얻는 아이디어 자체는 이전에도 있었다. 이 논문의 기여는 **사전학습 분류망의 변환 + 학습되는 업샘플링 + skip 결합을 하나의 end-to-end 학습 레시피로 정리한 것**이다.',
 '**skip 연결은 무한정 도움이 되지 않는다.** 논문 스스로 pool2·pool1까지 더해봤지만 개선이 미미했다고 보고한다. 얕은 층은 의미 정보가 너무 약해서, 더할수록 좋아지는 구조가 아니다.',
 '**8배 업샘플의 경계는 여전히 뭉툭하다.** 원 논문 결과물은 물체 경계가 부정확해 당시 실무에서는 CRF 후처리를 얹는 경우가 많았다. 이 해상도 문제는 dilated convolution 계열이 나오기 전까지 남아 있던 한계다.'
],

links:[
 {t:'arXiv 1411.4038 — Fully Convolutional Networks for Semantic Segmentation', u:'https://arxiv.org/abs/1411.4038'},
 {t:'shelhamer/fcn.berkeleyvision.org — 공식 Caffe 구현과 모델', u:'https://github.com/shelhamer/fcn.berkeleyvision.org'},
 {t:'torchvision — FCN-ResNet50/101 사전학습 모델', u:'https://pytorch.org/vision/stable/models/fcn.html'}
]
});
