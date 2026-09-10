WIKI.paper({
slug:'vnet',
venue:'3DV 2016',
authors:'Milletari, Navab, Ahmadi (TU München · Johns Hopkins · LMU München)',
arxiv:'1606.04797',

tldr:'[U-Net](#/p/unet)의 encoder-decoder 구조를 **3차원 볼륨**(MRI·CT)에 그대로 적용하고, 전경 복셀이 극소수인 의료 영상에서 교차 엔트로피 대신 쓸 **Dice 손실**을 도입한 논문. 슬라이스 단위 2D 처리 대신 볼륨 전체를 한 번에 예측한다.',

context:'2016년 시점 의료 영상 분할은 대부분 3D 볼륨을 2D 슬라이스로 잘라 [U-Net](#/p/unet) 같은 2D 네트워크에 통과시킨 뒤 다시 쌓는 방식이었다. 이는 슬라이스 사이의 문맥(위아래 단면의 연속성)을 버리는 것과 같다. 게다가 전립선·장기 분할처럼 전경 영역이 전체 볼륨의 극히 일부만 차지하는 과제에서 표준 교차 엔트로피(또는 multinomial logistic loss)를 쓰면, 학습이 배경만 찍어도 손실이 낮아지는 쪽으로 수렴해 전경이 부분적으로만 검출되거나 아예 사라지는 문제가 있었다. 기존 대응은 클래스별 샘플 재가중치였는데, 데이터셋마다 가중치를 손으로 맞춰야 했다.',

ideas:[
 {h:'볼륨 전체를 3D 컨볼루션으로 처리',
  lead:'슬라이스별 2D 처리 대신 5×5×5 3D 커널로 볼륨 전체를 한 번에 본다.',
  d:'입력·중간 특징·출력 전부 3차원 텐서다. 모든 컨볼루션은 $5\\times5\\times5$ 복셀 커널을 쓰고, 해상도를 줄일 때는 max-pooling 대신 stride 2의 $2\\times2\\times2$ 컨볼루션을 쓴다. 저자들은 max-pooling을 없애면 역전파에 필요한 switch(풀링 위치 기억)가 없어 메모리도 줄고, 학습 가능한 다운샘플링이 더 나은 표현을 배운다고 본다.'},
 {h:'Dice 손실: 클래스 불균형을 재가중치 없이 다룬다',
  lead:'전경-배경 겹침 비율(Dice 계수)을 직접 미분해 손실로 쓴다.',
  d:'Dice 계수 $D$ 는 예측과 정답 마스크가 얼마나 겹치는지를 0~1로 재는 지표다. 이것을 그대로 미분 가능한 형태로 만들어 손실 함수로 쓰면, 배경이 90% 이상을 차지해도 전경 복셀 각각의 기여가 비율로 정규화되어 살아남는다. 샘플 재가중치가 전혀 필요 없다는 것이 핵심 주장이고, 같은 네트워크를 multinomial logistic loss로 학습한 대조군보다 확연히 좋은 결과를 얻었다(Fig. 6 비교).'},
 {h:'각 스테이지가 잔차 함수를 학습',
  lead:'각 해상도 단계 입력을 출력에 더해 [ResNet](#/p/resnet)처럼 잔차를 학습시킨다.',
  d:'compression path의 각 스테이지는 1~3개 컨볼루션을 거친 뒤 스테이지 입력을 그대로 더한다. 저자들은 이 구성이 잔차를 학습하지 않는 동일 구조보다 훨씬 빠르게 수렴한다고 관찰했다. decompression path(디컨볼루션으로 해상도를 복원하는 쪽)도 같은 잔차 구성을 쓴다.'},
 {h:'Fine-grained feature forwarding',
  lead:'각 해상도의 compression 특징을 대응하는 decompression 단계로 직접 전달한다.',
  d:'[U-Net](#/p/unet)의 skip connection과 같은 역할이다. 다운샘플링 과정에서 손실되는 미세한 경계 정보를 압축 경로의 같은 해상도 지점에서 복원 경로로 직접 넘겨, 최종 분할 경계를 더 정밀하게 만든다. 그림에서 주황색 화살표로 표시된 경로다.'}
],

diagram:{type:'stack', cap:'V자 형태의 3D encoder-decoder. 왼쪽이 압축 경로, 오른쪽이 복원 경로, 가로 화살표가 fine-grained feature forwarding.',
 layers:[
  {t:'입력 볼륨', s:'128×128×64×1'},
  {t:'3D Conv 스테이지', s:'5×5×5, 잔차 학습', note:'해상도 5단계로 압축'},
  {t:'Down-conv', s:'2×2×2, stride 2', note:'max-pool 대신'},
  {t:'병목', s:'256채널 · 8×8×4', acc:true, note:'가장 압축된 표현'},
  {t:'De-conv 복원', s:'해상도 5단계 복원'},
  {t:'1×1×1 Conv', s:'→ Softmax, 2채널'}
 ]},

math:[
 {expr:'D = 2 Σ p_i g_i / (Σ p_i² + Σ g_i²)',
  tex:'D=\\frac{2\\sum_{i}^{N}p_ig_i}{\\sum_i^N p_i^2+\\sum_i^N g_i^2}',
  d:'$p_i$ 는 예측 확률, $g_i$ 는 정답 이진 마스크. $N$ 복셀 전체에 대한 겹침 비율이며 완전 일치 시 1, 겹침 없음이면 0. 이 논문은 손실이 아니라 최대화할 계수로 정의하고 $1-D$ 를 최소화한다.'},
 {expr:'∂D/∂p_j = 2[ g_j(Σp²+Σg²) − 2p_j(Σp·g) ] / (Σp²+Σg²)²',
  tex:'\\frac{\\partial D}{\\partial p_j}=2\\left[\\frac{g_j\\left(\\sum_i^N p_i^2+\\sum_i^N g_i^2\\right)-2p_j\\left(\\sum_i^N p_ig_i\\right)}{\\left(\\sum_i^N p_i^2+\\sum_i^N g_i^2\\right)^2}\\right]',
  d:'복셀 $j$ 에 대한 gradient가 분모의 전체 합(∝ 전경+배경 크기)으로 정규화돼 있다. 그래서 전경이 배경의 1% 밖에 안 돼도 전경 복셀의 gradient가 죽지 않는다 — 재가중치를 손으로 넣지 않아도 되는 이유다.'}
],

numbers:[
 {k:'Dice · PROMISE12 전립선 MRI', v:'0.869 ± 0.033', d:'Dice 손실로 학습한 V-Net. 같은 구조를 multinomial logistic loss로 학습하면 0.739로 떨어짐'},
 {k:'Hausdorff distance', v:'5.71 ± 1.20 mm', d:'같은 과제, Dice 손실 기준. logistic loss는 10.55mm로 2배 가까이 나쁨'},
 {k:'PROMISE12 챌린지 점수', v:'82.39', d:'당시 상위권 방법(Imorphics 84.36, ScrAutoProstate 83.49)에 근접'},
 {k:'추론 시간', v:'약 1초', d:'처음 보는 볼륨 1개를 분할하는 데 걸린 시간(GTX 1080)'},
 {k:'학습 시간', v:'48시간 · 약 3만 iteration', d:'단일 GTX 1080(8GB) 기준'}
],

impact:'2D 슬라이스 처리가 표준이던 의료 영상 분할에 **볼륨 자체를 입력으로 받는 3D CNN**이라는 선택지를 확립했고, Dice 손실은 이후 거의 모든 의료 분할 논문의 기본 손실 함수가 되었다. 클래스 불균형을 손으로 재가중치하지 않고 손실 함수 설계로 해결한다는 접근은 의료 영상뿐 아니라 불균형 분할 과제 전반에 퍼졌다. [nnU-Net](#/p/nnunet)을 포함해 이후 대부분의 분할 파이프라인이 Dice 손실(또는 Dice+CE 결합)을 기본값으로 쓴다.',

legacy:[
 '**Dice 손실의 표준화** — 이후 의료 분할 논문 대부분이 Dice 손실 또는 Dice+cross-entropy 결합을 기본으로 채택',
 '**3D 세그멘테이션 계열** — [nnU-Net](#/p/nnunet)이 3D U-Net·V-Net 계열을 데이터셋 적응형 파이프라인으로 통합',
 '**U-Net 3D 변형들** — 3D U-Net, [UNet++](#/p/unetpp) 등 공식 3D 확장 연구가 뒤따름',
 '**의료 영상 벤치마크 지표 정착** — Dice 계수와 Hausdorff distance가 분할 논문의 표준 보고 지표로 굳음'
],

pitfalls:[
 '**전립선 MRI 단일 과제·30개 테스트 볼륨 결과다.** "3D 분할이 2D보다 항상 낫다"는 일반화된 주장이 아니라, 데이터가 적고 GPU 메모리가 제한적이던 2016년 하드웨어에서의 특정 결과다. 실제로 GPU 메모리 제약 때문에 입력 볼륨을 패치로 잘라 넣는 경우가 많아 "완전한 3D 문맥"이 항상 보장되진 않는다.',
 '**Dice 손실이 항상 재가중치보다 우월한 건 아니다.** 극단적으로 작은 전경(예: 미세 병변)에서는 Dice 손실도 여전히 불안정할 수 있어, 이후 연구들은 Dice+CE, focal loss 등 결합형을 쓴다.',
 '**PReLU·custom Caffe 구현**이라 당시 재현이 쉽지 않았다 — 최신 프레임워크의 3D U-Net 구현들과 세부 하이퍼파라미터가 다를 수 있다.'
],

figures:[
 {f:'fig2-architecture.png',
  cap:'왼쪽 절반이 compression path(해상도 128³→8³로 5단계 압축), 오른쪽이 decompression path. 파란 상자 묶음이 5×5×5 컨볼루션, ⊕가 잔차 덧셈, 주황 화살표가 같은 해상도 단계를 잇는 fine-grained feature forwarding(U-Net의 skip과 동일 역할). 맨 오른쪽 Softmax가 2채널(전경/배경) 확률을 낸다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'We introduce a novel objective function, that we optimise during training, based on Dice coefficient. In this way we can deal with situations where there is a strong imbalance between the number of foreground and background voxels.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1606.04797 — V-Net', u:'https://arxiv.org/abs/1606.04797'},
 {t:'PROMISE12 챌린지', u:'https://promise12.grand-challenge.org/'}
]
});
