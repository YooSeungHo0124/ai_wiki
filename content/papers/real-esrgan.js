WIKI.paper({
slug:'real-esrgan',
venue:'ICCV 2021 Workshops (AIM)',
authors:'Wang, Xie, Dong, Shan (Tencent ARC · SIAT-CAS · Shanghai AI Lab)',
arxiv:'2107.10833',

tldr:'실제 저품질 이미지는 bicubic 다운샘플링 한 번으로 열화되지 않는다는 문제를 정면으로 풀었다. 블러·리사이즈·노이즈·JPEG 압축을 **두 번 반복**하는 고차 열화 모델로 합성 데이터를 만들고, 그 데이터만으로 [ESRGAN](#/p/esrgan) 생성기를 학습시켜 실제 사진에 바로 쓸 수 있게 만들었다.',

context:'[SRGAN](#/p/srgan)·[ESRGAN](#/p/esrgan)을 비롯한 대부분의 초해상 모델은 고해상도 이미지를 **bicubic으로 한 번 다운샘플링**해 저해상도-고해상도 쌍을 만들고 학습한다. 그런데 실제 사진의 저품질은 그렇게 생기지 않는다 — 오래된 카메라의 센서 노이즈, 여러 번의 편집·리사이즈, 인터넷을 오가며 반복된 JPEG 압축이 뒤섞여 쌓인 결과다. 이 **열화 불일치(degradation mismatch)** 때문에 bicubic으로 학습한 모델을 실제 저품질 사진에 쓰면 노이즈를 오히려 증폭시키거나 아티팩트를 만든다. 문제는 실세계 저해상도-고해상도 정합 쌍을 대량으로 모으는 것 자체가 사실상 불가능하다는 점이다.',

ideas:[
 {h:'고차(high-order) 열화 모델: 같은 열화 과정을 두 번 반복한다',
  lead:'블러→리사이즈→노이즈→JPEG의 고전 열화 과정을 서로 다른 하이퍼파라미터로 두 번 겹쳐 합성한다.',
  d:'고전 열화 모델은 $x=[(y \\circledast k)\\downarrow_r + n]_{JPEG}$처럼 열화를 **한 번**만 적용한다. Real-ESRGAN은 이 전체 과정을 $n$번 반복하는 $n$차 모델을 제안하고, 실무적으로는 2차(second-order)로 충분함을 확인했다. 편집·업로드·재압축이 여러 번 겹치는 실제 이미지의 변질 과정을 더 가깝게 흉내 낸다.'},
 {h:'sinc 필터로 링잉·오버슈트 아티팩트까지 합성한다',
  lead:'2D sinc 필터를 블러·리사이즈 단계에 섞어 실제 사진에 흔한 링잉·오버슈트를 재현한다.',
  d:'실제 사진에는 날카로운 경계 주변에 밴드처럼 보이는 링잉(ringing), 경계에서 신호가 과도하게 튀는 오버슈트(overshoot) 아티팩트가 흔하다. 둘 다 신호가 고주파 성분 없이 대역제한(band-limited)될 때 생기는데, 논문은 2D sinc 필터를 블러 커널과 리사이즈 단계에 섞어 이 아티팩트를 합성 데이터에도 일부러 만들어 넣는다.'},
 {h:'U-Net 판별기 + spectral normalization',
  lead:'VGG 스타일 판별기를 U-Net 구조로 바꿔 픽셀 단위 사실성 피드백을 주고, spectral norm으로 안정화한다.',
  d:'[ESRGAN](#/p/esrgan)의 판별기는 이미지 전체에 대해 하나의 진위 점수만 낸다. Real-ESRGAN은 [U-Net](#/p/unet) 판별기를 써서 픽셀(영역) 단위로 진짜/가짜를 판단하게 해 국소적인 디테일 복원을 더 정확히 지도한다. 고차 열화로 학습 데이터의 난이도가 올라간 만큼 판별기의 학습이 불안정해지기 쉬운데, spectral normalization으로 이를 억제한다.'},
 {h:'실제 쌍이 전혀 없는 순수 합성 데이터만으로 학습한다',
  lead:'실세계 정합 쌍 없이 고해상도 이미지에서 합성한 저품질 이미지만으로 블라인드 초해상을 학습한다.',
  d:'실세계 LR-HR 정합 쌍을 모으는 대신, 고해상도 이미지 하나에 고차 열화 파이프라인을 적용해 그에 대응하는 저해상도 이미지를 즉석에서 만들어낸다. 이 "pure synthetic data" 접근이 논문 제목의 핵심 주장이며, 실무에서 데이터 수집 병목 없이 바로 적용 가능한 모델을 만드는 이유다.'}
],

diagram:{type:'flow', cap:'2차 열화 과정. 같은 네 단계(블러→리사이즈→노이즈→JPEG)를 서로 다른 파라미터로 두 번 반복해 HR에서 합성 LR을 만든다.',
 nodes:[
  {t:'HR 이미지', s:'y'},
  {t:'1차 열화', s:'블러→리사이즈→노이즈→JPEG', a:'1회'},
  {t:'2차 열화', s:'+ sinc 필터', acc:true, a:'반복', note:'링잉·오버슈트 합성'},
  {t:'합성 LR', s:'x = D²(y)'}
 ]},

math:[
 {expr:'x = D(y) = [(y ⊛ k) ↓_r + n]_JPEG',
  tex:'x=\\mathcal{D}(y)=\\big[(y\\circledast k)\\!\\downarrow_r + n\\big]_{JPEG}',
  d:'고전 열화 모델 한 번. 블러 커널 $k$로 컨볼루션 후 $r$배 다운샘플링하고 노이즈 $n$을 더한 뒤 JPEG 압축한다.'},
 {expr:'x = D^n(y) = (D_n ∘ … ∘ D_2 ∘ D_1)(y)',
  tex:'x=\\mathcal{D}^{n}(y)=(\\mathcal{D}_n\\circ\\cdots\\circ\\mathcal{D}_2\\circ\\mathcal{D}_1)(y)',
  d:'고전 열화를 $n$번 합성한 고차 열화. 각 $\\mathcal{D}_i$는 같은 절차를 서로 다른 하이퍼파라미터로 수행한다. 논문은 $n=2$(2차)가 실무적으로 대부분의 실제 사례를 해결한다고 보고한다.'}
],

numbers:[
 {k:'열화 차수', v:'2차(second-order)', d:'대부분의 실세계 패턴을 커버하면서 단순성 유지'},
 {k:'NIQE · OST300', v:'4.44(bicubic) → 2.87(Real-ESRGAN)', d:'무기준 지표, **낮을수록** 좋음'},
 {k:'NIQE · DRealSR', v:'6.58(bicubic) → 4.98(Real-ESRGAN)', d:'다른 벤치마크에서도 일관되게 개선'},
 {k:'노이즈 종류', v:'가우시안 + 포아송, 컬러/그레이', d:'채널별 독립 샘플링 여부로 컬러 노이즈 구분'},
 {k:'리사이즈 방식', v:'area·bilinear·bicubic 랜덤 선택', d:'nearest-neighbor는 정렬 문제로 제외'}
],

impact:'"충분히 다양한 합성 데이터만 있으면 실세계 정합 쌍 없이도 블라인드 초해상을 풀 수 있다"는 것을 실증했다. 이 관점은 이후 실사 이미지·애니메이션 업스케일링 도구 전반의 표준 데이터 생성 레시피가 됐고, 특히 오픈소스 생태계(Real-ESRGAN GitHub)에서 가장 널리 쓰이는 초해상 모델 중 하나로 자리잡았다. GAN 기반 모델답게 텍스처를 "만들어내는" 특성은 유지되므로, 사실성보다 선명함이 중요한 실사용에 특히 잘 맞는다.',

legacy:[
 '**실사용 초해상의 사실상 표준** — Stable Diffusion 업스케일러, 애니메이션 리마스터, 오래된 사진 복원 도구 등에 광범위하게 재사용',
 '**합성 열화 파이프라인의 정착** — 이후 블라인드 복원 논문 다수가 "고차 열화" 또는 유사한 반복 합성 방식을 기본값으로 채택',
 '**[SwinIR](#/p/swinir)과의 병행 발전** — 같은 시기 CNN 계열(Real-ESRGAN)과 Transformer 계열(SwinIR)이 각자 실세계 복원을 겨냥하며 서로 참조',
 '**[CodeFormer](#/p/codeformer)의 얼굴 특화 후속** — 얼굴처럼 구조가 강한 도메인에서는 일반 열화 모델을 넘어 코드북 사전이 필요하다는 다음 문제로 이어짐'
],

pitfalls:[
 '**"실사 사진에 만능"이 아니다.** 고차 열화 모델도 실제 열화 공간 전체를 커버하지 못한다 — 저자들도 부록에서 실패 사례(극단적 압축, 특이한 센서 패턴)를 명시한다.',
 '**출력이 원본보다 과도하게 선명해질 수 있다(oversharpening).** GAN 특유의 텍스처 생성 경향과 오버슈트 합성 학습이 겹쳐, 특히 평탄한 영역에 인공적인 질감이 생기는 경우가 보고된다.',
 '**NIQE 등 무기준 지표는 "실제 인간 선호"의 근사일 뿐이다.** 논문 스스로도 이 지표가 세밀한 스케일에서 사람의 지각 선호를 완전히 반영하지 못한다고 밝힌다.'
],

figures:[
 {f:'fig1-realworld-comparison.png',
  cap:'실제 사진(피규어 눈·나뭇가지·간판 글자) 세 사례에서 bicubic·ESRGAN·RealSR·Real-ESRGAN을 비교. ESRGAN은 bicubic 열화로 학습돼 실사진에서 오히려 아티팩트를 만들고, Real-ESRGAN만 디테일을 살리면서 잡음은 제거한다.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-degradation-pipeline.png',
  cap:'위 줄(first order)과 아래 줄(second order)이 같은 블러→리사이즈→노이즈→JPEG 절차를 두 번 반복하는 구조. 각 상자 아래 점선 목록이 그 단계에서 실제로 무작위 선택되는 구체적 방법들(예: 노이즈는 가우시안·포아송·컬러·그레이 중 샘플링).',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'Though many attempts have been made in blind super-resolution to restore low-resolution images with unknown and complex degradations, they are still far from addressing general real-world degraded images.',
  src:'Abstract, p.1'},
 {t:'We highlight that the high-order degradation process is the key, indicating that not all the shuffled degradations are necessary.',
  src:'Section 3.2, p.4'}
],

links:[
 {t:'arXiv 2107.10833 — Real-ESRGAN', u:'https://arxiv.org/abs/2107.10833'},
 {t:'GitHub — xinntao/Real-ESRGAN', u:'https://github.com/xinntao/Real-ESRGAN'}
]
});
