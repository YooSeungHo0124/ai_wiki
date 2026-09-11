WIKI.paper({
slug:'visualbert',
venue:'arXiv 2019 (Work in Progress)',
authors:'Li, Yatskar, Yin, Hsieh & Chang (UCLA · Allen Institute for AI · Peking University)',
arxiv:'1908.03557',

tldr:'이미지 영역 특징과 텍스트 토큰을 **같은 [BERT](#/p/bert) 스택에 그냥 섞어 넣고** self-attention이 둘 사이 정렬을 알아서 배우게 한 모델. 별도의 시각-언어 융합 모듈 없이 VQA·VCR·NLVR2·Flickr30K 네 과제에서 당시 SOTA와 대등하거나 앞섰다.',

context:'2019년 초 시각-언어 모델은 대부분 **두 개의 별도 인코더**를 두고 그 위에 cross-attention이나 bilinear pooling으로 결합하는 구조였다. [BERT](#/p/bert)가 텍스트 쪽에서 사전학습-미세조정 패러다임을 증명한 뒤, "이미지도 그냥 BERT에 토큰처럼 넣으면 되지 않을까"라는 질문이 자연스럽게 따라왔다. 같은 시기 [ViLBERT](#/p/vilbert)는 이미지·텍스트를 별도 스트림으로 인코딩한 뒤 co-attention으로 연결하는 "two-stream" 설계를 택했다. VisualBERT는 그 반대편 극단을 시험한다 — **스트림을 아예 나누지 않고 처음부터 한 Transformer에 합친다.**',

ideas:[
 {h:'단일 스트림: 이미지 영역도 그냥 토큰이다',
  lead:'객체 탐지기가 뽑은 영역 특징을 텍스트 서브워드와 함께 한 Transformer에 넣는다.',
  d:'Faster R-CNN으로 얻은 영역별 시각 특징 $f_o$ 에 segment 임베딩 $f_s$(텍스트가 아니라 이미지임을 표시)와 position 임베딩 $f_p$ 를 더해 시각 임베딩을 만든다. 이걸 텍스트 임베딩과 나란히 같은 12층 Transformer에 넣을 뿐, 이미지 전용 인코더나 별도 융합 층이 없다. 정렬은 self-attention이 학습 과정에서 스스로 찾는다.'},
 {h:'두 개의 시각적 언어모델 목표로 사전학습',
  lead:'COCO 캡션에서 가려진 단어를 이미지 보고 맞추는 objective로 정렬을 학습시킨다.',
  d:'(1) 이미지가 주어진 채 마스킹된 언어모델링 — 텍스트 일부를 가리고 영역 특징을 보면서 복원한다(영역 특징 자체는 가리지 않는다). (2) 문장-이미지 예측 — 두 캡션이 같은 이미지에서 온 진짜 쌍인지, 무작위로 섞은 가짜 쌍인지 이진 분류한다. COCO의 이미지당 5개 캡션 구조를 그대로 활용한 설계다.'},
 {h:'3단계 학습: 과제-비특정 → 과제-특정 → 미세조정',
  lead:'COCO로 한 번, 다시 목표 과제 데이터로 한 번 사전학습한 뒤에야 미세조정한다.',
  d:'BERT식 사전학습-미세조정 2단계에 중간 단계 하나를 더 끼운다 — 목표 도메인(VCR의 영화 장면처럼 COCO와 동떨어진 경우도 포함) 데이터로 다시 한번 마스킹된 언어모델링을 돌려 도메인 적응을 시킨 뒤에 최종 미세조정을 한다.'},
 {h:'조기 융합(early fusion)이 성능에 실제로 기여하는지 분리해서 검증',
  lead:'이미지-텍스트를 첫 층부터 섞은 모델과 마지막 층에서만 합친 모델을 직접 비교한다.',
  d:'`VisualBERT w/o Early Fusion`은 이미지 표현을 스택 전체가 아니라 맨 마지막 층에서만 결합하도록 바꾼 변형이다. `VisualBERT w/o COCO Pre-training`은 과제-비특정 사전학습 단계를 통째로 건너뛴 변형이다. 두 ablation을 전체 모델과 나란히 보고해, 어느 설계 선택이 실제로 성능을 만드는지 분해한다.'}
],

diagram:{type:'stack', cap:'VisualBERT 한 스택. 이미지 영역과 텍스트 서브워드가 입력 단계부터 섞여 같은 Transformer를 통과한다.',
 layers:[
  {t:'텍스트 임베딩', s:'토큰+세그먼트+위치'},
  {t:'영역 임베딩', s:'CNN 특징+세그먼트+위치'},
  {t:'결합 입력 시퀀스', s:'텍스트‖이미지 나란히'},
  {t:'BERT 스택', s:'12층·768d·12head', acc:true, note:'BERTBASE로 초기화'},
  {t:'사전학습', s:'MLM+문장-이미지 예측'},
  {t:'과제별 미세조정', s:'VQA·VCR·NLVR2 등'}
 ]},

math:[
 {expr:'e = e_t + e_s + e_p  (텍스트),   f = f_o + f_s + f_p  (이미지)',
  tex:'e=e_t+e_s+e_p \\quad\\text{(text)},\\qquad f=f_o+f_s+f_p \\quad\\text{(image region)}',
  d:'텍스트 임베딩과 영역 임베딩은 같은 방식으로 조립된다 — 각각 토큰/시각 특징에 세그먼트·위치 임베딩을 더한다. 구조가 같으므로 하나의 Transformer 입력 시퀀스로 이어붙일 수 있다.'}
],

numbers:[
 {k:'VQA 2.0 test-std', v:'71.00', d:'같은 시각 특징을 쓰는 비교군(Pythia v0.3 68.71) 대비 우위, 단 VG 외부데이터·앙상블 모델(75.23)과는 조건이 다름'},
 {k:'VCR Q→AR test', v:'52.4', d:'COCO 사전학습 없는 ablation도 R2C(44.0)를 이미 크게 앞섬 — 아키텍처 자체의 효과'},
 {k:'NLVR2 test-P', v:'67.0', d:'이전 최고 MaxEnt(54.8) 대비 큰 폭 우위'},
 {k:'Flickr30K R@1 test', v:'71.33', d:'BAN(69.69) 대비 근소 우위, 조기 융합 여부의 차이는 거의 없었음'},
 {k:'모델 규모', v:'BERTBASE 동일', s:'12층·768d·12head'},
 {k:'사전학습 데이터', v:'COCO Karpathy split', d:'약 10만 이미지 × 캡션 5개'}
],

impact:'"이미지도 토큰처럼 넣으면 된다"는 가장 단순한 가설이 실제로 작동함을 보여, 이후 시각-언어 사전학습 연구가 복잡한 융합 모듈 설계보다 **데이터·목표·스케일**에 집중하게 만드는 근거가 되었다. Flickr30K를 진단 데이터셋으로 써서 attention head가 실제로 구문 의존관계·상호참조를 포착하는지 분석한 부분은, `[BERT](#/p/bert)` 의 attention 해석 연구를 시각-언어 영역으로 그대로 옮긴 것이다. 다만 논문 자신이 "Work in Progress"로 남겼듯, 같은 시기 `[ViLBERT](#/p/vilbert)` 의 two-stream 설계와 어느 쪽이 우월한지는 이 논문만으로 결론 나지 않았다.',

legacy:[
 '단일 스트림 vs 이중 스트림 논쟁 — VisualBERT는 단일, [ViLBERT](#/p/vilbert)·[LXMERT](#/p/lxmert)는 이중 인코더로 갈라져 이후 몇 년간 두 계열이 공존',
 '텍스트 생성으로 과제를 통일하려는 흐름 — [VL-T5](#/p/vl-t5)가 분류 헤드 자체를 없애는 다음 단계로 이어짐',
 '영역 특징 기반 파이프라인의 한계 — Faster R-CNN 탐지기에 의존하는 구조는 이후 [CLIP](#/p/clip) 계열의 패치 기반 end-to-end 인코더로 대체됨',
 'attention 가중치로 언어-비전 정렬을 진단하는 분석 방법론이 이후 멀티모달 해석가능성 연구의 표준 도구로 자리잡음'
],

pitfalls:[
 '**"early fusion이 항상 이긴다"가 아니다.** Flickr30K에서는 조기 융합 유무의 차이가 거의 없었다 — 논문 스스로 "이 과제는 얕은 구조로도 충분할 수 있다"고 밝힌다.',
 '**영역 특징은 과제마다 다른 탐지기에서 나온다.** VQA는 Visual Genome 사전학습 ResNeXt Faster R-CNN, VCR은 데이터셋 제공 gold box, NLVR2는 Detectron — 성능 비교 시 이 차이를 무시하면 안 된다.',
 '**논문이 "Work in Progress"로 공개되었다.** 정식 학회 출판본이 아니며, 저자들도 [ViLBERT](#/p/vilbert)와의 직접 비교가 조건 차이로 완전하지 않다고 명시한다.'
],

figures:[
 {f:'fig2-architecture.png',
  cap:'오른쪽 위 e1…eN이 텍스트 임베딩, f1…fK가 이미지 영역 임베딩 — 두 종류가 나란히 같은 Transformer 박스로 들어간다. 각 임베딩 아래 회색 막대 3개가 Position·Segment·Token/Image 세 성분의 합. [MASK]가 가려진 단어(Objective 1), 점선 화살표가 문장-이미지 예측(Objective 2)의 지도 신호가 어디서 나오는지를 보여준다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'The core of our idea is to reuse the self-attention mechanism within the Transformer to implicitly align elements of the input text and regions in the input image.',
  src:'Section 3.2, p.3'}
],

links:[
 {t:'arXiv 1908.03557 — VisualBERT', u:'https://arxiv.org/abs/1908.03557'}
]
});
