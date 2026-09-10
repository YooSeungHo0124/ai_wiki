WIKI.paper({
slug:'lxmert',
venue:'EMNLP 2019',
authors:'Tan, Bansal (UNC Chapel Hill)',
arxiv:'1908.07490',

tldr:'[ViLBERT](#/p/vilbert)와 같은 시기, 다른 설계로 같은 문제를 푼 시각-언어 사전학습 모델. 두 스트림 대신 **세 개의 encoder**(객체 관계, 언어, 교차 모달)를 두고, **다섯 가지** 사전학습 과제로 학습한다.',

context:'2019년 중반, [BERT](#/p/bert)식 사전학습을 시각-언어로 확장하려는 시도가 여러 연구실에서 동시에 나왔다. [ViLBERT](#/p/vilbert)가 시각·언어 두 스트림을 co-attention으로 잇는 방식을 택한 것과 거의 같은 시기에, LXMERT는 세 개의 별도 encoder로 문제를 분해했다. 두 논문 모두 이미지를 [Faster R-CNN](#/p/faster-rcnn)이 뽑은 영역 특징으로 표현한다는 점은 같다. LXMERT가 강조하는 차이는 단일 모달 인코딩(객체 간 관계, 단어 간 관계)을 교차 모달 인코딩과 분리해, 각 단계가 무엇을 학습하는지 더 명시적으로 통제한다는 점이다.',

ideas:[
 {h:'객체 관계 · 언어 · 교차 모달, 세 개의 encoder',
  lead:'단일 모달 encoder 두 개가 먼저 내부 관계를 학습한 뒤 교차 모달 encoder로 합쳐진다.',
  d:'객체-관계 encoder는 영역 특징들 사이의 self-attention만으로 $N_R$ 층을 쌓아 이미지 내부의 객체 관계를 학습한다. 언어 encoder는 동일한 방식으로 $N_L$ 층을 쌓아 문장 내부 관계를 학습한다. 이 둘의 출력이 교차 모달 encoder로 들어가 $N_X$ 층의 cross-attention + self-attention을 거친다. 논문은 $N_L=9$, $N_R=5$, $N_X=5$ 로 설정했다. ViLBERT의 두 스트림이 처음부터 co-attention으로 얽히는 것과 달리, LXMERT는 단일 모달 표현을 먼저 안정시킨 뒤 섞는다.'},
 {h:'교차 모달 층 하나 = 양방향 cross-attention + self-attention',
  lead:'언어→비전, 비전→언어 두 방향의 cross-attention을 먼저 적용한 뒤 각자 self-attention을 돈다.',
  d:'교차 모달 encoder의 각 층은 먼저 양방향 cross-attention("Cross") 서브층을 거친다 — 언어가 비전을 보는 방향과 비전이 언어를 보는 방향을 모두 계산한다. 그 다음 각 모달리티가 자신의 self-attention("Self")과 FFN을 거친다. 이 구조가 $N_X$ 번 반복되며, 최종적으로 vision output·cross-modality output·language output 세 갈래를 낸다.'},
 {h:'다섯 가지 사전학습 과제를 동시에 쓴다',
  lead:'마스킹 언어모델링·영역 특징 회귀·영역 라벨 분류·이미지-문장 매칭·이미지 질의응답을 함께 학습한다.',
  d:'(1) masked cross-modality LM — BERT의 마스킹 언어모델링과 유사하지만 마스킹된 단어를 언어 문맥뿐 아니라 정렬된 이미지 영역에서도 추론할 수 있어 저자들은 이를 "masked cross-modality LM"이라 명명한다. (2) RoI-feature 회귀로 마스킹된 영역의 2048차원 특징을 복원하고, (3) 탐지기가 매긴 객체 라벨을 분류한다. (4) 이미지-문장이 실제 짝인지 판별하는 cross-modality matching. (5) 이미지 질의응답(VQA/GQA/VG-QA)을 사전학습 과제 자체로 포함시켜 데이터 규모를 키운다.'},
 {h:'9.18M 이미지-문장 쌍으로 사전학습 데이터를 모은다',
  lead:'MS COCO·Visual Genome 기반 다섯 데이터셋(캡션+QA)을 합쳐 이미지 180K장을 확보한다.',
  d:'COCO-Caption, VG-Caption, VQA, GQA, VG-QA 다섯 소스를 이미지 단위로 병합해 총 180K개 이미지에 대해 9.18M개의 이미지-문장(질문 포함) 쌍을 만든다. QA 데이터를 언어 전용이 아니라 시각적으로 답이 갈리는 질문으로 제한해, 사전학습이 실제로 두 모달리티를 다 필요로 하게 만든다.'},
 {h:'NLVR2로 사전학습 표현의 일반화를 검증한다',
  lead:'사전학습에 쓰지 않은 이미지로 구성된 NLVR2에서 정확도를 54%에서 76%로 끌어올린다.',
  d:'NLVR2는 두 이미지와 한 문장이 주어졌을 때 문장의 참/거짓을 판별하는 과제로, LXMERT 사전학습 데이터에 포함되지 않은 실사 이미지를 쓴다. 사전학습된 LXMERT를 미세조정만으로 이 과제에 적용해 기존 최고 성능을 절대 22%p 끌어올린 것은, 사전학습이 특정 데이터 분포에 국한되지 않는 표현을 학습했다는 근거로 제시된다.'}
],

diagram:{type:'compare', cap:'같은 시기 2-stream 계열의 결합 방식 차이 — LXMERT는 늦은 결합에 encoder를 하나 더 쓴다.',
 left:{t:'ViLBERT: 2-stream', items:['시각·언어 스트림이 대칭 공유','co-attention층이 바로 섞음','encoder는 사실상 2개']},
 right:{t:'LXMERT: 3-encoder', items:['시각·언어를 완전히 독립 인코딩','늦게 cross-modality encoder 투입','Cross 뒤에 Self 재적용']}},

math:[
 {expr:'Att_{X→Y}(x, {y_j}) = Σ_j softmax(score(x,y_j)) · y_j',
  tex:'\\text{Att}_{X\\to Y}(x,\\{y_j\\}) = \\sum_j \\alpha_j y_j,\\quad \\alpha_j=\\frac{\\exp(a_j)}{\\sum_k \\exp(a_k)},\\quad a_j=\\text{score}(x,y_j)',
  d:'LXMERT는 이 일반화된 attention 정의를 self-attention(query와 context가 같은 모달)과 cross-attention(query와 context가 다른 모달)에 공통으로 적용해 encoder를 조립한다.'},
 {expr:'v_j = (LayerNorm(W_F f_j + b_F) + LayerNorm(W_P p_j + b_P)) / 2',
  tex:'v_j = \\frac{\\text{LayerNorm}(W_F f_j + b_F) + \\text{LayerNorm}(W_P p_j + b_P)}{2}',
  d:'객체 $j$의 2048차원 RoI 특징 $f_j$ 와 위치(바운딩 박스 좌표) $p_j$ 를 각각 정규화한 뒤 평균을 내 하나의 위치-인지 시각 임베딩을 만든다.'}
],

numbers:[
 {k:'인코더 층수', v:'N_L=9, N_X=5, N_R=5', d:'언어·cross-modality·물체-관계 encoder 층수, hidden size는 BERT-base와 같은 768'},
 {k:'사전학습 데이터', v:'이미지 180K · 쌍 9.18M', d:'COCO-Caption+VG-Caption+VQA+GQA+VG-QA 병합'},
 {k:'VQA test-standard', v:'72.5%', d:'직전 SOTA 70.4% 대비 +2.1%p'},
 {k:'GQA test-standard', v:'60.3%', d:'직전 SOTA 57.1% 대비 우세, Binary/Open 전 항목에서 향상'},
 {k:'NLVR2 Test-U 정확도', v:'76.2%', d:'직전 SOTA 53.5%에서 절대 +22.7%p, 상대 오류 약 48% 감소'},
 {k:'NLVR2 일관성(Cons)', v:'42.1%', d:'직전 SOTA 12.0% 대비 30%p 상승 — 관련 문장 여러 개를 동시에 맞혀야 하는 지표'},
 {k:'사전학습 과제 수', v:'5개', d:'masked LM·RoI 회귀·라벨 분류·이미지-문장 매칭·이미지 QA'}
],

impact:'ViLBERT와 거의 동시에, 서로 다른 아키텍처(두 스트림 co-attention vs. 세 encoder)로 "영역 특징 + BERT식 사전학습이 시각-언어 태스크에 통한다"는 결론에 함께 도달하면서, 이 접근이 특정 설계의 우연이 아니라 일반적으로 성립하는 방법론임을 뒷받침했다. 특히 NLVR2처럼 사전학습 데이터에 없는 이미지 분포로도 성능이 전이된다는 결과는, 시각-언어 사전학습이 태스크 특화 트릭이 아니라 진짜 표현 학습임을 보여준 초기 증거로 인용된다.',

legacy:[
 '**세 encoder 분해 방식** — 단일 모달 encoder를 먼저 두고 교차 모달 encoder를 뒤에 두는 구조가 이후 여러 VLM 설계에서 재사용됨',
 '**다중 사전학습 과제 조합** — 여러 목적함수를 동시에 쓰는 방식이 이후 시각-언어 사전학습의 관행으로 자리잡음',
 '**영역 특징 파이프라인의 정점** — [ViLBERT](#/p/vilbert)와 함께 Faster R-CNN 기반 사전학습의 대표작이 되었고, 이 무거운 파이프라인은 [ViLT](#/p/vilt)가 패치 임베딩으로 대체하며 저물기 시작함',
 '**NLVR2 스타일 분포 전이 검증** — 사전학습 도메인 밖 데이터로 일반화를 입증하는 평가 관행에 영향을 줌'
],

pitfalls:[
 '**ViLBERT와 "누가 먼저"를 가리기 어렵다.** 두 논문 모두 2019년 8월 arXiv에 2주 남짓 간격으로 올라왔고(ViLBERT 1908.02265, LXMERT 1908.07490), LXMERT 원문도 co-attention이 새로운 개념은 아니라고 전제한다 — 경쟁작이 아니라 병행 연구로 이해하는 것이 정확하다.',
 '**Table 2의 State-of-the-Art 비교 대상은 태스크마다 다르다.** VQA·GQA·NLVR2 각각 "당시" 최고 성능 task-specific 모델과 비교한 것이지, 단일 통합 베이스라인이 아니다.',
 '**다섯 사전학습 과제가 전부 똑같이 중요하지 않다.** 원문 Table 3~5의 ablation에서 과제를 하나씩 빼보면 기여도가 다르게 나타나므로, "다섯 개를 다 넣어야 한다"는 식으로 단순화하면 안 된다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'왼쪽 위: 영역 특징(RoI Feat)+위치(Pos Feat) → Object-Relationship Encoder(N_R층). 왼쪽 아래: 단어 임베딩 → Language Encoder(N_L층). 가운데 점선 박스가 Cross-Modality Encoder(N_X층)로, Cross(교차 attention)가 X자로 교차하는 화살표가 언어↔비전 양방향 참조를 나타낸다. 오른쪽 끝 세 출력이 Vision/Cross-Modality/Language Output.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'We build a large-scale Transformer model that consists of three encoders: an object relationship encoder, a language encoder, and a cross-modality encoder.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1908.07490 — LXMERT', u:'https://arxiv.org/abs/1908.07490'},
 {t:'LXMERT 공식 코드 (airsplay/lxmert)', u:'https://github.com/airsplay/lxmert'}
]
});
