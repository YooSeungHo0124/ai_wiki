WIKI.paper({
slug:'tinybert',
venue:'EMNLP 2020 (Findings)',
authors:'Jiao, Yin, Shang, Jiang, Chen, Li, Wang, Liu (Huazhong Univ. of Sci. and Tech. · Huawei Noah\'s Ark Lab)',
arxiv:'1909.10351',

tldr:'[BERT](#/p/bert)의 임베딩·어텐션 행렬·은닉 상태·로짓을 **전부** 증류 대상으로 삼는 Transformer distillation을 제안하고, 이를 **사전학습 단계와 미세조정 단계 양쪽**에서 적용하는 2단계 학습 프레임워크로 묶은 논문. 4층 TinyBERT가 교사 성능의 96.8%를 파라미터 13.3%로 달성한다.',

context:'[DistilBERT](#/p/distilbert)는 사전학습 단계 증류만으로 범용 경량 모델을 만들었고, [Patient-KD](#/p/patient-kd)는 미세조정 단계에서 중간 층 [CLS] 표현까지 맞추는 게 효과적임을 보였다. 그런데 실제 BERT 활용은 "대규모 코퍼스로 사전학습 → 태스크별 미세조정"이라는 두 단계로 이뤄지고, 사전학습에서 익힌 지식과 미세조정에서 익힌 태스크별 지식은 서로 다르다. 사전학습 단계만 증류하거나 미세조정 단계만 증류하면 둘 중 하나의 지식만 옮겨진다는 것이 이 논문의 출발점이다.',

ideas:[
 {h:'Transformer distillation: 네 가지 손실로 층 전체를 맞춘다',
  lead:'임베딩·어텐션 행렬·은닉 상태·예측 로짓 네 곳 모두에 정렬 손실을 둔다.',
  d:'임베딩층은 `L_embd`(MSE), Transformer 층은 어텐션 행렬 `L_attn`(정규화 전 A 행렬의 MSE, softmax 이전 값을 쓰는 쪽이 더 잘 수렴)과 은닉 상태 `L_hidn`(선형변환 후 MSE), 마지막 예측층은 `L_pred`(온도 t=1의 소프트 교차엔트로피)로 맞춘다. 어텐션 행렬을 직접 맞추는 이유는, BERT의 어텐션 가중치 자체가 구문·상호참조 같은 언어학적 지식을 담고 있다는 기존 관찰(Clark et al., 2019)에 기반한다.'},
 {h:'2단계 증류: 일반 증류 → 과제별 증류',
  lead:'사전학습 코퍼스로 한 번, 미세조정된 교사로 또 한 번 증류한다.',
  d:'일반 증류(general distillation)는 미세조정하지 않은 원본 BERT를 교사로 대규모 텍스트(위키피디아)에서 수행해 "일반 TinyBERT"를 얻는다 — 이때는 예측층 손실을 생략한다. 과제별 증류(task-specific distillation)는 일반 TinyBERT를 초기값으로 삼아, 특정 태스크로 미세조정된 BERT를 교사로 다시 증류한다. 두 단계가 상호보완적이라, 어느 한쪽만 빼면 성능이 떨어진다(절제 실험).'},
 {h:'데이터 증강으로 과제별 증류의 데이터 부족을 메운다',
  lead:'언어모델과 GloVe 임베딩으로 단어를 교체해 학습 데이터를 불려 증류한다.',
  d:'과제별 증류 단계는 보통 태스크 데이터셋 자체가 작아 교사의 풍부한 지식을 다 옮기기 어렵다. 그래서 단일 조각 단어는 언어모델 예측으로, 여러 조각으로 나뉜 단어는 GloVe 최근접 이웃으로 교체하는 방식으로 문장을 증강한 뒤, 이 증강 데이터 위에서 증류를 수행한다.'},
 {h:'g(m)=3m 층 매핑으로 [Patient-KD](#/p/patient-kd)식 매핑 문제를 구체화',
  lead:'4층 학생의 1층을 교사의 3층에, 2층을 6층에 대응시키는 균등 함수를 쓴다.',
  d:'교사(12층)와 학생(4층 또는 6층)의 층 수가 다르므로 어떤 교사 층을 어떤 학생 층에 대응시킬지 정해야 한다. TinyBERT는 $g(m)=3\\times m$처럼 균등 간격 함수를 쓴다 — Patient-KD의 스킵 전략을 임베딩·어텐션·은닉상태 전체로 일반화한 형태다.'}
],

diagram:{type:'stack', cap:'2단계 학습 흐름. 일반 증류로 얻은 일반 TinyBERT가 과제별 증류의 출발점이 된다.',
 layers:[
  {t:'대규모 텍스트 코퍼스', s:'위키피디아'},
  {t:'일반 증류', s:'원본 BERT 교사', acc:true, note:'임베딩·어텐션·은닉상태만'},
  {t:'일반 TinyBERT', s:'초기화용'},
  {t:'데이터 증강', s:'LM + GloVe로 문장 확장'},
  {t:'과제별 증류', s:'미세조정된 BERT 교사', note:'예측층 손실 추가'},
  {t:'최종 TinyBERT', s:'배포 모델'}
 ]},

math:[
 {expr:'L_attn = (1/h) Σ MSE(A_i^S, A_i^T)',
  tex:'\\mathcal{L}_{attn} = \\frac{1}{h}\\sum_{i=1}^{h} \\text{MSE}(\\mathbf{A}_i^{S}, \\mathbf{A}_i^{T})',
  d:'헤드별 어텐션 행렬(softmax 이전, 정규화 안 된 값)의 평균제곱오차. h는 헤드 수.'},
 {expr:'L_hidn = MSE(H^S W_h, H^T)',
  tex:'\\mathcal{L}_{hidn} = \\text{MSE}(\\mathbf{H}^{S}\\mathbf{W}_h, \\mathbf{H}^{T})',
  d:'학생 은닉 차원이 교사보다 작을 수 있으므로 학습 가능한 선형변환 $W_h$로 같은 공간에 투영한 뒤 맞춘다.'},
 {expr:'L_pred = CE(z^T/t, z^S/t)',
  tex:'\\mathcal{L}_{pred} = \\text{CE}(\\mathbf{z}^{T}/t, \\mathbf{z}^{S}/t)',
  d:'교사·학생 로짓 사이의 온도 $t$ 소프트 교차엔트로피. 실험적으로 $t=1$이 가장 좋았다.'}
],

numbers:[
 {k:'TinyBERT4 GLUE 평균', v:'77.0', d:'BERT-Base 교사(79.5)의 **96.8%**, 파라미터는 14.5M(교사 대비 13.3%), 추론 9.4배 가속'},
 {k:'TinyBERT4 vs BERT-Tiny', v:'77.0 vs 70.2', d:'같은 크기(14.5M)에서 처음부터 사전학습한 BERT-Tiny보다 6.8점 높음 — 두 단계 증류의 효과'},
 {k:'TinyBERT6 GLUE 평균', v:'79.4', d:'BERT-Base 교사(79.5)와 거의 동급, 6층·67M 파라미터로 2.0배 가속'},
 {k:'TinyBERT4 vs BERT4-PKD', v:'77.0 vs 72.6', d:'같은 4층 구조에서 Patient-KD보다 +4.4, DistilBERT4(71.9)보다 +5.1'},
 {k:'일반 증류 제거 시(w/o GD)', v:'75.6 → 72.5', d:'CoLA에서 특히 크게 하락(50.8→40.8) — 일반 증류가 언어 능력 전반에 기여함을 시사'},
 {k:'교사 BERT-Base 규모', v:'109M · 22.5B FLOPs', d:'TinyBERT4(14.5M · 1.2B FLOPs) 대비 9.4배 연산량'}
],

impact:'DistilBERT와 Patient-KD가 각각 "사전학습 단계"와 "중간 층 정렬"이라는 아이디어를 따로 보여줬다면, TinyBERT는 이 둘을 한 프레임워크로 합치고 임베딩·어텐션·은닉상태·로짓 네 종류의 신호를 전부 동원했다. 이후 BERT 압축 연구에서 "두 단계 증류 + 다층 정렬"은 사실상 기본 설계가 됐고, 데이터 증강을 증류 파이프라인에 포함시킨 것도 후속 연구에 자주 재사용됐다.',

legacy:[
 '**어텐션 증류의 정착** — 어텐션 행렬 자체를 증류 대상으로 삼는 접근은 이후 [MiniLM](#/p/minilm)이 어텐션 분포와 value 관계로 발전시킴',
 '**과제 비의존 증류로의 대비축** — [MobileBERT](#/p/mobilebert)는 TinyBERT의 "미세조정 단계 증류"를 필요 없게 만드는 완전한 과제 비의존 설계로 다른 길을 택함',
 '**층 매핑 함수의 표준 예시** — 균등 매핑 $g(m)=3m$은 이후 연구에서 층 매핑 전략을 비교할 때 기준선으로 자주 인용됨'
],

pitfalls:[
 '**"임베딩 손실만 있으면 충분하다"가 아니다.** 어텐션·은닉상태 손실 없이 임베딩과 예측층만 맞추면 언어학적 지식(구문·상호참조)이 거의 전달되지 않는다 — 어텐션 행렬 증류가 이 논문의 핵심 기여다.',
 '**일반 증류와 과제별 증류는 서로 대체재가 아니라 보완재다.** 둘 중 하나만 하면 각각의 절제 실험에서 성능이 떨어지므로, "사전학습 증류만 하면 충분", "미세조정 때만 증류해도 된다" 둘 다 이 논문의 결론과 다르다.',
 '**MobileBERT-Tiny와의 직접 비교는 공정하지 않다.** 원문도 명시하듯 MobileBERT는 24층 구조를 과제 비의존적으로 증류한 반면 TinyBERT4는 4층을 과제별로 증류한 것이라 조건이 다르다.'
],

figures:[
 {f:'fig1-two-stage.png',
  cap:'대규모 텍스트 코퍼스에서 일반 증류로 "General TinyBERT"를 만들고, 이를 초기값 삼아 (증강된) 태스크 데이터에서 과제별 증류로 최종 모델을 얻는다. 데이터 증강은 아래쪽 별도 경로로 들어간다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'By leveraging this new KD method, the plenty of knowledge encoded in a large teacher BERT can be effectively transferred to a small student TinyBERT.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1909.10351 — TinyBERT', u:'https://arxiv.org/abs/1909.10351'},
 {t:'GitHub — huawei-noah/Pretrained-Language-Model (TinyBERT)', u:'https://github.com/huawei-noah/Pretrained-Language-Model/tree/master/TinyBERT'}
]
});
