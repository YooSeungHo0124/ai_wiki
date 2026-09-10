WIKI.paper({
slug:'billion-scale-ssl',
venue:'arXiv 2019 (Facebook AI)',
authors:'Yalniz, Jégou, Chen, Paluri, Mahajan (Facebook AI)',
arxiv:'1905.00546',

tldr:'라벨 없는 이미지를 최대 **10억 장**까지 동원하는 teacher/student 준지도학습 파이프라인을 제안해, 순수 [ResNet-50](#/p/resnet) 하나로 ImageNet top-1 **81.2%**를 달성한 논문. 무엇이 성능을 끌어올리는지(데이터 규모·teacher 용량·fine-tuning·학습 길이)를 하나씩 떼어내 정량적으로 보여준다.',

context:'2019년 당시 웹 스케일 데이터로 정확도를 올리는 방법은 주로 **약지도학습(weakly-supervised)**이었다 — 인스타그램 해시태그 같은 태그를 곧바로 라벨처럼 쓰는 방식이다. 문제는 태그가 이미지 내용과 무관하거나 누락되는 경우가 많아 잡음이 크고, 흔한 라벨에 태그가 쏠리는 Zipf 분포 때문에 꼬리 클래스(희귀 범주) 성능이 나쁘며,애초에 대상 과제에 맞는 대규모 약지도 데이터셋이 항상 존재하는 것도 아니다. 이 논문은 신경망 규모의 **준지도학습(semi-supervised)**을 시도한다 — 라벨이 붙은 작은 데이터셋(예: ImageNet)으로 교사(teacher) 모델을 먼저 학습시키고, 그 교사가 라벨 없는 방대한 이미지 더미를 직접 걸러 학생(student) 모델의 학습 데이터를 만드는 방식이다. 이런 시도가 신경망 규모(최대 10억 장)에서 검증된 적이 없었다는 것이 이 논문의 출발점이다.',

ideas:[
 {h:'teacher가 순위를 매겨 클래스마다 균형 잡힌 데이터셋을 직접 만든다',
  lead:'라벨 데이터로 교사를 학습시킨 뒤, 그 예측 점수로 라벨 없는 이미지를 클래스별로 정렬해 상위 K개만 뽑는다.',
  d:'약지도학습처럼 태그를 그대로 라벨로 쓰지 않는다. 먼저 라벨 데이터 $D$로 교사 모델을 학습시키고, 라벨 없는 대규모 집합 $U$의 모든 이미지에 대해 교사의 클래스별 예측 점수를 계산한 뒤, **각 클래스마다** 점수가 가장 높은 top-K개 이미지를 뽑아 새 학습 데이터 $\\hat{D}$를 구성한다. 클래스마다 같은 수를 뽑기 때문에 태그 기반 약지도학습이 겪는 long-tail 불균형이 애초에 생기지 않는다 — 희귀 클래스도 $U$ 안에 충분히 존재하기만 하면 교사가 찾아낸다.'},
 {h:'student를 $\\hat{D}$로 사전학습한 뒤 원본 라벨로 다시 fine-tune',
  lead:'노이즈가 섞인 대규모 데이터로 먼저 학습시키고, 마지막에 깨끗한 원본 라벨로 짧게 보정한다.',
  d:'student는 teacher가 고른 $\\hat{D}$(수천만~수억 장, 교사의 예측이라는 잡음 섞인 감독 신호)로 먼저 사전학습된다. 이후 원본의 깨끗한 라벨 데이터 $D$로 다시 fine-tune하는 단계가 빠지면 정확도가 크게 떨어진다는 것을 실험으로 확인했다 — teacher의 예측 오류가 누적되는 것을 이 마지막 단계가 바로잡는다.'},
 {h:'student는 teacher와 다른(대개 더 작은) 아키텍처여도 된다',
  lead:'teacher는 정확도를 위해 크게, student는 추론 비용을 위해 원하는 아키텍처로 고정한다.',
  d:'이 구도는 self-training(같은 모델)이나 distillation과 형태가 겹치지만, 목적이 다르다 — 이 논문은 **목표 아키텍처(예: 순수 ResNet-50)의 정확도를 최대로 끌어올리는 것**이 목적이므로 student를 고정하고 teacher만 최대한 강하게 키운다. 실험적으로 teacher와 student가 둘 다 ResNet-50이어도(사실상 self-training) 지도학습 대비 약 1%p 개선을 얻지만, 더 강한 teacher를 쓰는 정식 teacher/student 구도가 일관되게 더 좋다.'},
 {h:'무엇이 이득을 만드는지 하나씩 떼어 측정한다',
  lead:'데이터 규모·teacher 용량·K·학습 반복 수를 각각 고정하고 나머지만 바꿔 기여도를 분리한다.',
  d:'단순히 "많이 넣으면 좋다"가 아니라, 라벨 없는 집합 크기를 25M~1B로 바꿔가며 성능을 재고(로그-선형 구간과 그 소멸점을 확인), teacher 용량을 ResNet-18부터 ResNeXt-101-32x16까지 바꿔가며 student 성능이 어디서 멈추는지 재고, 클래스당 이미지 수 K를 4k~64k로 바꿔가며 최적 구간을 찾는다. 이 개별 실험들을 표 1의 6개 권장사항으로 정리한 것이 논문의 실질적 기여다.'}
],

diagram:{type:'flow', cap:'라벨 데이터로 학습한 teacher가 라벨 없는 최대 10억 장에서 클래스별 상위 K개를 골라 student의 학습 데이터를 만든다.',
 nodes:[
  {t:'라벨 데이터', s:'ImageNet 등'},
  {t:'teacher 학습', s:'ResNeXt-101-32x48'},
  {t:'예측·순위', s:'라벨 없는 최대 1B장', acc:true, note:'클래스별 top-K 선택'},
  {t:'student 사전학습', s:'선택된 D̂'},
  {t:'fine-tune', s:'원본 라벨로 재학습', a:'최종'}
 ]},

numbers:[
 {k:'ResNet-50 top-1 (YFCC100M 준지도)', v:'79.1%', d:'라벨만 쓰는 지도학습 76.4% 대비 +2.7%p, YFCC100M을 U로 사용'},
 {k:'ResNet-50 top-1 (IG-1B-Targeted 준지도)', v:'81.2%', d:'해시태그로 수집한 10억 장 규모 U 사용, fine-tuning 포함'},
 {k:'teacher 용량 상한', v:'ResNeXt-101 32x16 부근', d:'그 이상 키워도 ImageNet 자체가 작아 teacher 정확도가 포화되고 student도 더 못 오름'},
 {k:'데이터 규모 효과', v:'25M까지 로그-선형 증가', d:'그 이상은 같은 YFCC 분포 내에서 이득이 급격히 줄어듦(saturation)'},
 {k:'클래스당 이미지 수 K', v:'4k~32k 구간에서 안정', d:'K가 너무 크면 라벨 노이즈가 커져 정확도가 오히려 떨어짐'},
 {k:'video 행동 인식(R(2+1)D-18)', v:'top-1 76.7%', d:'같은 준지도 레시피를 영상에 적용, 완전지도 69.3% 대비 개선'}
],

impact:'"라벨 없는 데이터를 그냥 많이 쓴다"가 아니라 **teacher가 능동적으로 선별한 균형 잡힌 대규모 데이터로 학습한 뒤 깨끗한 라벨로 되돌아와 보정한다**는 구체적 레시피를 제시하고, 각 단계가 실제로 기여하는지를 소거 실험으로 검증했다. ResNet-50 같은 표준 아키텍처의 순수 성능을 끌어올린 결과는 "라벨 데이터가 부족해도 라벨 없는 웹 이미지가 충분히 크면 대체할 수 있다"는 근거를 구체적 수치로 제공했고, 이후 teacher/student 기반 self-training·distillation 계열 연구와 대규모 자기지도학습(self-supervised) 연구 모두가 이 결과를 데이터 스케일링의 참조점으로 인용한다.',

legacy:[
 '**대규모 사전학습이 ImageNet 미세조정 성능을 얼마나 올리는지의 참조점** — [BiT](#/p/bit)가 지도학습으로, 이 논문이 준지도학습으로 같은 질문("데이터를 키우면 어디까지 가나")에 답함',
 '**teacher가 데이터를 능동적으로 큐레이션하는 구도** — [DINO](#/p/dino)·[DINOv2](#/p/dinov2)의 self-distillation 기반 대규모 사전학습이 라벨 없는 이미지를 다루는 방식에 참조 전례를 제공',
 '**"데이터 규모의 이득이 어디서 꺾이는가"를 실측으로 보인 초기 사례** — 이후 스케일링 법칙 논의에서 준지도/약지도 데이터에도 포화 구간이 있다는 근거로 인용',
 '**video·전이학습 등 이미지 분류 밖으로 레시피를 그대로 확장** — 같은 teacher/student 파이프라인이 행동 인식·세밀 분류(fine-grained classification)에도 적용됨을 같은 논문 안에서 보임'
],

pitfalls:[
 '**"많은 데이터 = 항상 더 좋다"가 아니다.** 논문이 직접 보이듯 라벨 없는 데이터 규모의 이득은 로그-선형이다가 약 25M 근처에서 꺾이고, 이후로는 같은 YFCC100M 분포 안에서 더 뽑아도 거의 늘지 않는다. 10억 장에서의 81.2%는 YFCC100M이 아니라 **더 다양한 분포의 IG-1B-Targeted**(해시태그로 수집)를 썼기 때문에 나온 수치다.',
 '**teacher 용량을 무한정 키운다고 student가 계속 좋아지지 않는다.** ResNeXt-101-32x16 부근에서 teacher 자체의 ImageNet 정확도가 포화되고, 그 이상 teacher를 키워도 student 성능에 영향이 없다고 논문이 명시한다.',
 '**self-training(teacher=student)과 이 논문의 기본 설정(teacher≠student, 대개 teacher가 더 큼)을 혼동하면 안 된다.** 둘 다 실험했고 self-training도 효과가 있지만(ResNet-50 기준 약 +1%p), 논문의 핵심 수치(81.2%)는 훨씬 강한 별도 teacher를 쓴 정식 teacher/student 결과다.'
],

figures:[
 {f:'fig1-teacher-student.png',
  cap:'왼쪽 위 회색 더미가 라벨 없는 이미지 최대 10억 장, 오른쪽 위가 라벨 데이터. Step 1에서 라벨 데이터로 teacher(파란 네트워크)를 학습하고, Step 2에서 teacher가 라벨 없는 더미 전체를 예측·정렬해 Step 3에서 클래스별 top-K(아래 초록 박스, golden bridge/bike/bird 등)를 뽑아 student(빨간 네트워크)를 사전학습시킨다. Step 4가 원본 라벨로 되돌아가는 최종 fine-tuning.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'To the best of our knowledge, semi-supervised learning with neural networks has not been explored before at this scale.',
  src:'Section 1 (Introduction), p.1'}
],

links:[
 {t:'arXiv 1905.00546 — Billion-scale semi-supervised learning for image classification', u:'https://arxiv.org/abs/1905.00546'}
]
});
