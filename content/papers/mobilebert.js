WIKI.paper({
slug:'mobilebert',
venue:'ACL 2020',
authors:'Sun, Yu, Song, Liu, Yang, Zhou (CMU · Google Brain)',
arxiv:'2004.02984',

tldr:'미세조정된 교사를 필요로 하는 기존 [BERT](#/p/bert) 압축과 달리, **사전학습 단계에서만** 지식을 옮겨 원본 BERT처럼 어떤 태스크에도 그대로 미세조정할 수 있는 **과제 비의존(task-agnostic)** 경량 모델. 이를 위해 교사 쪽에도 bottleneck 구조를 넣은 전용 모델(IB-BERT)을 새로 만들어 층별로 점진적으로 지식을 옮긴다.',

context:'2019년까지의 BERT 압축은 대부분 두 갈래였다 — [DistilBERT](#/p/distilbert)처럼 사전학습 단계에서 층 수를 줄이거나, [TinyBERT](#/p/tinybert)나 [Patient-KD](#/p/patient-kd)처럼 미세조정된 교사를 대상으로 태스크별 증류를 반복하는 것이다. 후자는 태스크마다 미세조정된 교사를 새로 만들어야 해서 번거롭고, 전자는 층을 줄이는 접근이라 폭(hidden size)을 줄이는 것보다 정확도 손실이 크다는 관찰(Turc et al., 2019)이 있었다. 이 논문은 "층 수는 교사와 같게 유지하면서 폭만 줄이고, 사전학습 단계에서만 증류해도 과제 비의존 경량 모델을 만들 수 있는가"를 묻는다.',

ideas:[
 {h:'Bottleneck과 IB-BERT: 교사도 학생과 같은 모양으로 좁힌다',
  lead:'선형층으로 입출력만 좁혀 얇게 만들고, 교사도 같은 구조에 inverted-bottleneck을 붙여 준비한다.',
  d:'MobileBERT는 표준 Transformer 블록의 입력·출력에 선형변환을 추가해 어텐션·FFN 내부는 넓게 유지한 채 블록 간 연결(feature map) 차원만 좁히는 **bottleneck** 구조를 쓴다. 문제는 학생이 교사(BERTLARGE)를 층 대 층으로 흉내내려면 교사도 같은 좁은 차원을 써야 하는데, 원본 BERTLARGE는 그렇지 않다는 것이다. 그래서 BERTLARGE에 **inverted-bottleneck**(bottleneck과 반대로 확장하는 구조)을 끼워 넣은 IB-BERTLARGE를 교사 전용으로 새로 학습시킨다.'},
 {h:'MHA와 FFN의 파라미터 비율을 bottleneck 이후에도 유지',
  lead:'bottleneck이 만드는 입력 차원 축소가 MHA:FFN 비율을 깨뜨리는 문제를 구조 탐색으로 되돌린다.',
  d:'BERT 원래 설계는 MHA와 FFN의 파라미터 수가 대략 1:2였는데, bottleneck으로 입력 차원이 좁아지면 이 비율이 무너진다. MobileBERT는 여러 헤드 수·FFN 크기 조합을 SQuAD 성능으로 탐색해(Table 2, 3), 이 균형을 다시 맞추는 설정을 찾는다.'},
 {h:'층별 점진 지식 전이(Progressive Knowledge Transfer)',
  lead:'한 층씩 순서대로 고정해 가며 학습해, 하위 층의 오차가 상위 층 학습을 오염시키지 않게 한다.',
  d:'학생이 IB-BERT를 완벽히 모사하지 못하면 그 오차가 위쪽 층 학습에 누적된다는 우려에서, 각 층을 순서대로 학습하고 이전 층은 고정하는 방식을 쓴다. 층별 손실은 feature map transfer(MSE, 정규화된 특징 차이와 통계량 차이로 분해)와 attention transfer(헤드별 어텐션 분포 간 KL divergence)의 선형결합이다.'},
 {h:'과제 비의존: 미세조정된 교사도, 데이터 증강도 필요 없다',
  lead:'사전학습 단계 지식 전이만으로 원본 BERT처럼 바로 다운스트림에 미세조정할 수 있다.',
  d:'TinyBERT·DistilBERT와 달리 MobileBERT는 오직 사전학습 단계에서만 지식 전이를 수행하고, 미세조정된 교사나 태스크별 데이터 증강을 요구하지 않는다. 이 때문에 태스크마다 증류를 반복할 필요가 없고, 원본 BERT를 쓰듯 그냥 미세조정만 하면 된다.'},
 {h:'운영 최적화: LayerNorm 제거와 ReLU 교체',
  lead:'지연시간 분석에서 병목으로 드러난 LayerNorm과 GELU를 단순한 연산으로 바꾼다.',
  d:'실제 기기에서의 지연시간을 분석해, LayerNorm을 원소별 선형변환(NoNorm)으로, GELU를 ReLU로 교체한다. 이 최적화(OPT)만으로 지연시간이 192ms→62ms로 줄어든다.'}
],

diagram:{type:'compare', cap:'미세조정 단계까지 증류가 필요한가, 사전학습만으로 충분한가.',
 left:{t:'TinyBERT·PKD류', items:[
   '미세조정된 교사 필요','태스크마다 증류 반복','데이터 증강 필요']},
 right:{t:'MobileBERT', items:[
   '사전학습 단계만 증류','IB-BERT 전용 교사 별도 학습','원본 BERT처럼 바로 미세조정']}},

math:[
 {expr:'L_AT^l = (1/TA) ΣΣ KL(at_teacher || at_student)',
  tex:'\\mathcal{L}_{AT}^{\\ell} = \\frac{1}{TA}\\sum_{t=1}^{T}\\sum_{a=1}^{A} D_{KL}\\!\\left(at^{tr}_{t,\\ell,a} \\,\\|\\, at^{st}_{t,\\ell,a}\\right)',
  d:'attention transfer 손실. 층 $\\ell$의 헤드별 self-attention 분포 사이 KL divergence를 시퀀스 길이 T와 헤드 수 A에 대해 평균낸다.'},
 {expr:'L_PD = α L_MLM + (1−α) L_KD + L_NSP',
  tex:'\\mathcal{L}_{PD} = \\alpha\\,\\mathcal{L}_{MLM} + (1-\\alpha)\\,\\mathcal{L}_{KD} + \\mathcal{L}_{NSP}',
  d:'사전학습 증류(PD) 손실. 원래의 MLM·NSP 손실에 MLM 지식증류 손실을 선형결합한다. 층별 지식 전이(FMT+AT)와 별개로 추가되는 항.'}
],

numbers:[
 {k:'모델 크기 · 속도', v:'4.3배 작음 · 5.5배 빠름', d:'BERT-Base 대비 (25.3M 파라미터 vs 109M)'},
 {k:'GLUE 점수', v:'77.7', d:'BERT-Base(78.3)보다 단 0.6 낮음, Pixel 4 폰에서 지연시간 62ms'},
 {k:'SQuAD v1.1/v2.0 dev F1', v:'90.0 / 79.2', d:'BERT-Base(88.5 / 77.1)보다 오히려 1.5 / 2.1 높음'},
 {k:'운영 최적화(OPT) 효과', v:'192ms → 62ms', d:'LayerNorm 제거 + ReLU 교체만으로 지연시간 3배 이상 감소, GLUE 점수는 78.5→77.7로 소폭 하락'},
 {k:'MobileBERTTINY 크기', v:'15.1M · 40ms', d:'GLUE 75.8, SQuAD1.1 F1 88.6 — 헤드 수를 4로 줄인 더 작은 변형'},
 {k:'8비트 양자화 후 성능', v:'거의 무손실', d:'MobileBERT를 8-bit 양자화해도 MNLI-m 83.9→83.9, SQuAD F1 90.0→90.0 유지 (Table 6)'}
],

impact:'MobileBERT는 "BERT 압축 = 층을 줄이는 것"이라는 당시의 지배적 접근에 "폭을 줄이는 것이 더 유리하다"는 대안을 제시하면서, 동시에 태스크별 증류 반복이라는 번거로움을 사전학습 단계 지식 전이로 없앴다. 교사 자체를 학생과 같은 모양(bottleneck)으로 다시 설계해서 학습시킨다는 IB-BERT 아이디어는, "증류하기 좋은 교사를 따로 만든다"는 발상을 대중화했다.',

legacy:[
 '**폭 압축이라는 대안 축의 확립** — 이후 경량 encoder 설계에서 "층 수 유지 + 폭 축소"가 층 수 축소와 나란한 선택지로 자리잡음',
 '**과제 비의존 증류의 사실상 표준** — [MiniLM](#/p/minilm)도 이 방향으로 수렴해, 미세조정된 교사 없이 사전학습 단계 증류만으로 임의 크기 학생을 지원',
 '**교사 재설계라는 발상** — "증류하기 쉬운 교사를 별도로 학습시킨다"는 IB-BERT의 접근은 이후 다른 도메인의 증류 파이프라인에서도 재등장'
],

pitfalls:[
 '**MobileBERTTINY와 TinyBERT4의 비교는 원문 스스로도 "공정하지 않을 수 있다"고 명시한다.** 전자는 24층 구조를 과제 비의존적으로, 후자는 4층 구조를 과제별로 증류한 것이라 조건이 다르다.',
 '**"층 수를 유지하면 무조건 좋다"가 아니라, 이 논문의 구체적 결론은 저자들 자신의 비교(Table 1의 head 수 실험 등)에서 "폭을 줄이는 것이 층을 줄이는 것보다 낫다"는 관찰(Turc et al., 2019 인용)에 근거한 설계 선택이다.**',
 '**IB-BERT라는 별도 교사를 학습시키는 비용이 숨어 있다.** 과제별 미세조정이 필요 없는 대신, bottleneck 구조를 가진 교사 자체를 처음부터 사전학습시켜야 하므로 "교사가 이미 있다"는 상황과는 비용 구조가 다르다.'
],

figures:[
 {f:'fig1-bottleneck.png',
  cap:'(a) 표준 BERT. (b) IB-BERT: bottleneck 밖으로 inverted-bottleneck을 덧붙여 원래 폭을 유지한 채 학생과 같은 좁은 인터페이스를 제공하는 교사 전용 구조. (c) MobileBERT: bottleneck으로 얇아진 학생. 점선 화살표가 feature map/attention transfer 경로.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'Like the original BERT, MobileBERT is task-agnostic, that is, it can be generically applied to various downstream NLP tasks via simple fine-tuning.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2004.02984 — MobileBERT', u:'https://arxiv.org/abs/2004.02984'},
 {t:'GitHub — google-research/mobilebert', u:'https://github.com/google-research/google-research/tree/master/mobilebert'}
]
});
