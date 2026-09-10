WIKI.paper({
slug:'deep-compression',
venue:'ICLR 2016 (Best Paper)',
authors:'Han, Mao, Dally (Stanford · Tsinghua · NVIDIA)',
arxiv:'1510.00149',

tldr:'가지치기·가중치 공유·허프만 코딩을 순서대로 쌓아 정확도 손실 없이 AlexNet을 **35배**, VGG-16을 **49배** 압축한 논문. 세 단계가 서로 방해하지 않고 곱으로 쌓인다는 것을 실측으로 보였다.',

context:'2015년의 CNN은 정확도를 위해 계속 커졌다. AlexNet Caffe 모델이 240MB, VGG-16은 552MB로, 모바일 앱 스토어의 "100MB 이상은 Wi-Fi 연결 전까지 다운로드 불가" 같은 제약에 그대로 걸렸다. 더 근본적인 문제는 에너지다 — 45nm 공정에서 32bit DRAM 접근 한 번이 덧셈 연산의 약 700배(640pJ 대 0.9pJ) 에너지를 쓰고, 큰 모델은 온칩 SRAM에 들어가지 않아 매 추론마다 이 비싼 DRAM 접근을 반복한다. [AlexNet](#/p/alexnet) 자체를 건드리지 않고 저장 공간과 에너지를 동시에 줄이는 방법이 필요했다.',

ideas:[
 {h:'가지치기: 작은 가중치를 지우고 재학습',
  lead:'절댓값이 작은 연결을 잘라낸 뒤 남은 희소 연결만 다시 학습한다.',
  d:'정상적으로 학습된 네트워크에서 임계값보다 작은 가중치의 연결을 전부 제거한다. 그다음 남은 희소 연결만으로 재학습해 정확도를 원래 수준으로 회복시킨다. 이 단계만으로 AlexNet은 파라미터 수가 **9배**, VGG-16은 **13배** 줄었고, 정확도 손실은 없었다.'},
 {h:'Trained quantization: 값 대신 인덱스를 저장',
  lead:'k-means로 가중치를 소수의 centroid로 묶고 인덱스만 저장한 뒤 centroid를 미세조정한다.',
  d:'가지치기 후 남은 가중치를 레이어별로 k-means 클러스터링해 `k`개의 centroid로 묶는다. 각 연결은 32bit 실수 대신 $\\log_2(k)$ bit짜리 인덱스만 저장하고, 실제 값 테이블(codebook)은 레이어당 한 번만 둔다. 역전파 때는 같은 클러스터에 속한 가중치들의 gradient를 모두 더해 centroid 하나를 갱신하는 방식으로 codebook 자체를 재학습한다. AlexNet 기준 CONV층은 8bit(256개 centroid), FC층은 5bit(32개 centroid)로도 정확도 손실이 없었다.'},
 {h:'Centroid 초기화가 정확도를 좌우한다',
  lead:'선형 초기화가 큰 가중치를 대표하는 centroid를 살아남게 해 정확도가 가장 좋다.',
  d:'가지치기 후 가중치 분포는 두 봉우리를 가진 bimodal 분포가 된다. Forgy(무작위)와 밀도 기반 초기화는 이 두 봉우리 주변에 centroid가 몰려, 개수는 적지만 영향력이 큰 극단값 가중치를 대표하는 centroid가 거의 남지 않는다. 최소~최대 구간을 균등 분할하는 선형 초기화는 이 문제가 없어 실험적으로 가장 정확도가 높았다.'},
 {h:'허프만 코딩으로 마지막 한 번 더 압축',
  lead:'양자화된 가중치와 희소 인덱스 모두 값의 분포가 균일하지 않다는 것을 이용한다.',
  d:'양자화 후 남은 가중치 인덱스와 CSR/CSC 형식의 희소 인덱스 모두 특정 값 주변에 몰려 있는 편향된 분포를 가진다. 허프만 코딩으로 자주 나오는 값에 짧은 코드를 배정해 추가로 20~30%를 더 줄인다. 학습이 필요 없고 미세조정이 끝난 뒤 오프라인으로 한 번만 적용한다.'},
 {h:'세 단계가 서로 간섭하지 않고 곱으로 쌓인다',
  lead:'가지치기가 만든 희소성과 양자화가 만든 저비트 표현이 서로를 방해하지 않는다.',
  d:'가지치기만으로는 9~13배, 양자화까지 더하면 27~31배, 허프만 코딩까지 더하면 35~49배로 압축률이 단계마다 곱해지듯 커진다. 저자들은 이것이 "놀라울 정도로 높은 압축률"의 핵심 통찰이라고 밝힌다. 이 조합 압축 결과를 바탕으로 이후 압축된 모델 전용 하드웨어 가속기 EIE가 나왔다.'}
],

diagram:{type:'flow', cap:'Figure 1의 3단계 파이프라인. 각 단계 뒤 화살표 위 숫자가 그 시점까지 누적된 압축률.',
 nodes:[
  {t:'원본 네트워크', s:'240MB (AlexNet)'},
  {t:'가지치기', s:'재학습 포함', acc:true, a:'9~13x'},
  {t:'양자화+공유', s:'k-means, 미세조정', a:'27~31x'},
  {t:'허프만 코딩', s:'오프라인 1회', a:'35~49x'},
  {t:'압축 모델', s:'6.9MB (AlexNet)'}
 ]},

math:[
 {expr:'compression rate r = nb / (n log2(k) + kb)',
  tex:'r=\\dfrac{nb}{n\\log_2(k)+kb}',
  d:'연결 수 $n$, 원래 비트 수 $b$, 클러스터 수 $k$ 일 때의 압축률. 분모의 $n\\log_2(k)$ 가 인덱스 저장 비용, $kb$ 가 codebook 저장 비용이다.'},
 {expr:'k-means objective: argmin_C Σ_i Σ_{w∈c_i} |w - c_i|²',
  tex:'\\arg\\min_{C}\\sum_{i=1}^{k}\\sum_{w\\in c_i}|w-c_i|^{2}',
  d:'레이어 안의 원래 가중치들을 $k$ 개 클러스터로 묶어 클러스터 내 분산(WCSS)을 최소화한다. 레이어 간 가중치 공유는 하지 않는다.'}
],

numbers:[
 {k:'AlexNet 압축률', v:'35×', d:'240MB → 6.9MB, top-1/top-5 정확도 변화 없음(42.78%/19.70%)'},
 {k:'VGG-16 압축률', v:'49×', d:'552MB → 11.3MB, top-1 31.50%→31.17%로 오히려 약간 개선'},
 {k:'단계별 누적 압축률', v:'9~13× → 27~31× → 35~49×', d:'가지치기 → +양자화 → +허프만 코딩 순서의 누적치(Figure 1/Table 1)'},
 {k:'비트폭 (AlexNet)', v:'CONV 8bit · FC 5bit', d:'CONV는 256개, FC는 32개 centroid로 양자화, 정확도 손실 0'},
 {k:'레이어웨이 속도/에너지', v:'3~4× 속도, 3~7× 에너지 절감', d:'배치 크기 1 기준, CPU/GPU/모바일 GPU(Jetson TK1) 벤치마크'},
 {k:'LeNet-5 압축률', v:'39×', d:'MNIST, 1720KB → 44KB, 정확도 오히려 0.06%p 개선(0.80%→0.74%)'}
],

impact:'모델 크기를 아키텍처 변경 없이 줄이는 표준 레시피가 됐다. 가지치기·양자화·엔트로피 코딩을 순서대로 쌓는 이 3단계 구조는 이후 나온 대부분의 모델 압축 파이프라인의 골격이 됐고, [양자화 서베이](#/p/quantization-survey)가 정리하는 저비트 양자화 계열 연구의 출발점 중 하나다. 압축된 모델이 온칩 SRAM에 들어간다는 관찰은 같은 저자들의 EIE 하드웨어 가속기로 바로 이어졌다. 또한 "가지치기 후 재학습"이라는 절차 자체가 이후 희소 네트워크 학습 연구 전반의 표준 실험 프로토콜이 되었다.',

legacy:[
 '**희소성의 의미를 재해석** — [lottery-ticket](#/p/lottery-ticket)은 가지치기로 남은 부분망이 처음부터 그 초기값으로 학습 가능했는지를 묻는 질문으로 이 논문의 가지치기 절차를 뒤집어 사용',
 '**저비트 양자화 계열로 일반화** — [양자화 서베이](#/p/quantization-survey)가 다루는 균일/비균일 양자화, per-channel 양자화 연구들이 이 논문의 codebook 방식을 출발점으로 확장',
 '**가지치기의 언어모델 이식** — [movement-pruning](#/p/movement-pruning)이 같은 가지치기 아이디어를 BERT류 파인튜닝 시나리오에 맞게 재설계',
 '**지식 증류와 상보적인 축** — [distillation](#/p/distillation)이 "작은 모델을 새로 학습"하는 방향이라면 이 논문은 "큰 모델을 그대로 압축"하는 반대 방향의 축을 이룬다'
],

pitfalls:[
 '**"35배 압축"은 세 단계를 다 합친 최종 수치다.** 가지치기만으로는 9~13배에 그친다 — 어느 단계의 숫자인지 확인 없이 인용하면 과장된다.',
 '**압축률 계산에 희소 인덱스 메타데이터가 이미 포함되어 있다.** 저자들이 논문에서 직접 강조하는 지점으로, 가중치 저장량만 따로 계산하면 실제보다 높은 압축률을 얻는 착시가 생긴다.',
 '**속도·에너지 이득은 배치 크기 1(실시간 추론) 조건에서만 유효하다.** 배치를 키워 행렬-행렬 곱으로 바뀌면 메모리 접근 대비 연산 비율이 달라져 희소 가지치기의 이점이 사라진다고 논문이 명시한다.'
],

figures:[
 {f:'fig1-pipeline.png', cap:'왼쪽부터 가지치기 → 양자화(클러스터링→codebook 생성→양자화→codebook 재학습 루프) → 허프만 코딩. 화살표 위 숫자가 그 단계까지 누적된 압축률(9~13× → 27~31× → 35~49×).', src:'원문 Figure 1, p.2'},
 {f:'fig3-weight-sharing.png', cap:'4×4 가중치 행렬(왼쪽 위)을 4개 색(클러스터)으로 양자화해 2bit 인덱스 행렬(가운데)과 centroid 테이블(오른쪽)만 남긴다. 아래 줄은 같은 색끼리 gradient를 group-by한 뒤 합산(reduce)해 학습률을 곱해 centroid를 갱신하는 과정.', src:'원문 Figure 3, p.3'}
],

quotes:[
 {t:'Our main insight is that, pruning and trained quantization are able to compress the network without interfering each other, thus lead to surprisingly high compression rate.', src:'Section 1, p.2'},
 {t:'This allows fitting the model into on-chip SRAM cache rather than off-chip DRAM memory.', src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1510.00149 — Deep Compression', u:'https://arxiv.org/abs/1510.00149'},
 {t:'EIE: Efficient Inference Engine (후속 하드웨어 가속기)', u:'https://arxiv.org/abs/1602.01528'}
]
});
