WIKI.paper({
slug:'patient-consistent',
venue:'arXiv 2021 (Google Research, Brain Team)',
authors:'Beyer, Zhai, Royer, Markeeva, Anil & Kolesnikov (Google Research)',
arxiv:'2106.05237',

tldr:'증류가 잘 안 된다는 인상은 대개 **설정 실수** 때문이라고 주장한다. 교사와 학생에게 같은 이미지 뷰를 주고(consistent), 상식보다 훨씬 오래 학습시키면(patient), 압축된 ResNet-50이 10배 큰 [BiT](#/p/bit) 교사와 사실상 같은 정확도(82.8% ImageNet top-1)에 도달한다. "증류는 새 손실함수를 발명하는 문제가 아니라 함수를 맞추는 최적화 문제"라는 재해석이 핵심이다.',

context:'2021년 시점 컴퓨터 비전은 거대 모델(BiT, ViT 계열)이 SOTA를 갈아치우지만 실제로 배포되는 건 여전히 작은 ResNet-50이라는 괴리가 커지고 있었다. [Hinton의 증류](#/p/distillation)가 이 간극을 메울 표준 해법으로 꼽혔지만, [efficacy-kd](#/p/efficacy-kd)나 [does-kd-work](#/p/does-kd-work) 같은 최근 연구들은 증류가 기대만큼 안정적이지 않다고 보고했다. 이 논문은 증류 실패의 원인을 새로운 손실 항이 아니라 **암묵적인 설정 선택**(교사·학생이 같은 augmentation을 보는지, 몇 에폭을 도는지)에서 찾는다. 관점 자체도 바꾼다 — 증류를 "정답을 맞히는 문제"가 아니라 교사와 학생이라는 **두 함수를 입력 공간 전체에서 일치시키는 문제**(function matching)로 본다.',

ideas:[
 {h:'Consistent teaching: 교사와 학생에게 같은 크롭·증강을 준다',
  lead:'교사 로짓을 미리 계산해 캐싱하는 관행이 증류를 망가뜨린다.',
  d:'흔한 구현은 학생이 볼 이미지를 정한 뒤 교사의 예측을 오프라인으로 미리 계산해 저장(precompute)해 재사용한다. 이러면 교사는 원본 이미지를, 학생은 무작위로 크롭·증강된 이미지를 보게 되어 **같은 입력에 대한 함수 매칭이 애초에 성립하지 않는다.** 매 스텝 교사에게도 학생과 동일한 augmentation을 실시간으로 적용하는 것만으로 최종 정확도가 크게 개선된다.'},
 {h:'Function matching: mixup으로 지지집합을 넓힌다',
  lead:'입력 사이 선형 보간(mixup)까지 같이 줘서 원본 분포 밖 지점에서도 함수를 맞춘다.',
  d:'consistent teaching을 넘어, 학습 이미지 쌍을 **aggressive [mixup](#/p/mixup)**(계수를 [0,1] 전체에서 균등 샘플링)으로 섞어 교사·학생 모두에게 먹인다. 목표는 두 함수가 원본 데이터 매니폴드뿐 아니라 그 사이의 점들에서도 일치하도록 지지집합을 넓히는 것 — 정답 레이블이 없는 mixup 지점에서는 교사의 출력이 유일한 학습 신호가 된다.'},
 {h:'Patient teaching: 자릿수가 다른 학습 스케줄',
  lead:'보통 학습(수백 에폭)과 달리 증류는 과적합 없이 최대 9600에폭까지 계속 좋아진다.',
  d:'Flowers102 같은 소규모 데이터셋에서 30, 90, 300, 1200, 4800, 9600 에폭으로 스케줄을 늘려가며 세 설정(fixed teacher, consistent teaching, function matching)을 비교했다. fixed teacher는 어느 지점(수백 에폭)에서 정체·과적합되지만, consistent teaching과 function matching은 **9600에폭까지도 과적합 징후 없이 계속 개선된다.** 짧은 스케줄에서 최적이던 하이퍼파라미터가 긴 스케줄에서는 최적이 아닐 수 있다는 점도 지적한다.'},
 {h:'ImageNet: ResNet-50이 BiT-M-R152x2를 따라잡는다',
  lead:'교사 정확도 83.0%에 ResNet-50 학생이 82.8%까지 근접한다.',
  d:'교사는 ImageNet-21k로 사전학습한 BiT-M-R152x2(연산량 기준 ResNet-50의 약 10배), 학생은 표준 ResNet-50(BatchNorm 대신 group norm 사용) 구조다. 9600 에폭 증류로 이 학생이 82.8% top-1을 찍는데, 이는 당시 문헌상 최고의 ResNet-50 결과보다 2.2%p 높다. fixed teacher 설정은 600에폭 근방에서 이미 과적합되어 훨씬 낮은 정확도에 머문다.'},
 {h:'해상도를 바꿔도 일관성은 유지할 수 있다',
  lead:'교사·학생에게 서로 다른 해상도를 주더라도 같은 원본 크롭에서 파생시키면 일관성이 깨지지 않는다.',
  d:'교사와 학생이 반드시 같은 해상도를 볼 필요는 없다 — 같은 원본 이미지·크롭에서 각각의 해상도로 리사이즈하면 "일관된 뷰"라는 조건은 유지된다. 이 유연성 덕분에 연산 비용이 큰 교사는 낮은 해상도로, 학생은 필요한 해상도로 돌리는 식의 최적화가 가능하다.'}
],

diagram:{type:'compare', cap:'증류를 어떻게 설정하느냐에 따라 같은 교사-학생 쌍의 결과가 완전히 달라진다.',
 left:{t:'실패하기 쉬운 설정', items:['교사 로짓을 미리 계산해 캐싱','서로 다른 랜덤 크롭','수백 에폭에서 조기 종료']},
 right:{t:'이 논문의 레시피', items:['매 스텝 교사·학생 같은 augmentation','aggressive mixup으로 지지집합 확장','최대 9600 에폭까지 patient 학습']}
},

math:[
 {expr:'KL(pt || ps) = Σ_i [ -pt,i log ps,i + pt,i log pt,i ]',
  tex:'KL(p_t\\Vert p_s)=\\sum_{i\\in C}\\big[-p_{t,i}\\log p_{s,i}+p_{t,i}\\log p_{t,i}\\big]',
  d:'학생이 맞추는 목표는 hard label이 아니라 교사 분포 $p_t$ 자체다. 원 논문의 temperature와 달리, 이 논문은 온도 $T$ 를 하이퍼파라미터로 스윕하되 **일관된 입력**을 주는 것이 온도보다 더 중요한 변수임을 보인다.'}
],

numbers:[
 {k:'ImageNet 학생 top-1', v:'82.8%', d:'ResNet-50, 9600 에폭 증류 결과 (당시 문헌 최고 ResNet-50 대비 +2.2%p)'},
 {k:'교사 정확도', v:'83.0%', d:'BiT-M-R152x2 (ImageNet-21k 사전학습, 152층 · 폭 2배)'},
 {k:'교사 대비 연산량', v:'약 10배', d:'BiT-M-R152x2가 학생 ResNet-50보다 요구하는 추론 연산량'},
 {k:'학습 스케줄 범위', v:'30~9600 에폭', d:'Figure 1에서 스캔한 전체 구간 — 표준 지도학습 대비 자릿수가 다름'},
 {k:'배치 크기', v:'512 (ImageNet은 4096)', d:'Adam + cosine schedule, weight decay·LR·온도까지 전부 스윕'}
],

impact:'"증류가 잘 안 된다"는 다수의 부정적 결과가 새로운 알고리즘이 아니라 **설정의 문제**였을 가능성을 열었다. function matching이라는 프레이밍은 이후 지식 증류를 확산 모델의 스텝 압축([progressive-distillation](#/p/progressive-distillation))이나 LLM 증류 논의에서도 "교사·학생이 같은 입력 분포에서 같은 함수를 배우게 하라"는 원칙으로 재등장한다.',

legacy:[
 '[efficacy-kd](#/p/efficacy-kd)가 지적한 "큰 교사가 오히려 해롭다"는 결과에, 학습 방식만 바꾸면 큰 교사도 문제없다는 반례를 제시',
 '[does-kd-work](#/p/does-kd-work)가 진단한 최적화 실패를, 오래·일관되게 학습하는 것으로 실무적으로 우회하는 경로를 보임',
 '"모델 압축=증류"라는 등식이 실무에서 신뢰를 회복하는 계기가 되어 이후 비전 백본 배포 파이프라인에서 표준 레시피로 채택'
],

pitfalls:[
 '**교사 로짓을 미리 계산해 캐싱하는 최적화가 오히려 성능을 깎는다.** 계산 비용을 아끼려는 흔한 관행이 이 논문의 핵심 실패 원인 중 하나다.',
 '**"몇백 에폭이면 충분하다"는 일반 지도학습의 직관을 그대로 옮기면 안 된다.** 증류는 자릿수가 다른 스케줄(수천 에폭)에서도 과적합 없이 계속 개선된다.',
 '**연산 예산이 매우 제한적이면 이 레시피의 이득이 작아진다.** 9600에폭 증류는 그 자체로 비싸며, 논문도 "제한된 예산에서는 최적이 아닐 수 있다"고 명시한다.'
],

figures:[
 {f:'fig1-epochs-vs-accuracy.png',
  cap:'ImageNet top-1 정확도(y축)를 학습 에폭 수(x축, 30~9600, 로그 스케일)에 대해 그린 그래프. 검은 fixed teacher(교사 로짓 캐싱)는 1200에폭 근방에서 정체·하락하는 반면, 파랑 consistent teaching과 초록 function matching은 9600에폭까지 계속 상승해 교사 정확도(수평선 83)에 근접한다. 화살표의 "4x"는 같은 정확도에 도달하는 데 필요한 에폭 배수 차이.',
  src:'원문 Figure 1, p.1'}
],

links:[
 {t:'arXiv 2106.05237 — A good teacher is patient and consistent', u:'https://arxiv.org/abs/2106.05237'}
]
});
