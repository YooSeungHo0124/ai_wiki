WIKI.paper({
slug:'layoutlm',
venue:'KDD 2020',
authors:'Xu et al. (Microsoft Research Asia · Harbin Institute of Technology · Beihang University)',
arxiv:'1912.13318',

tldr:'영수증·양식·계약서 같은 문서 이미지를 [BERT](#/p/bert)로 읽되, 텍스트만이 아니라 **각 단어가 종이 위 어디에 있는지(2D 좌표)와 어떻게 생겼는지(이미지)** 까지 함께 사전학습한 모델. OCR로 읽은 텍스트와 그 바운딩 박스를 입력으로 **전제**한다.',

context:'2019년의 문서 AI는 두 갈래로 나뉘어 있었다. 컴퓨터비전 쪽은 문서를 이미지로 보고 레이아웃을 분석했고, NLP 쪽은 OCR로 뽑은 텍스트에 [BERT](#/p/bert) 같은 언어모델을 그대로 적용했다. 문제는 후자다 — "Passport ID:" 라는 키 바로 오른쪽 또는 아래에 값이 온다는 사실은 **텍스트 순서만으로는 알 수 없다.** BERT는 문장을 1차원 토큰 시퀀스로만 보기 때문에, 양식(form)의 표 구조나 영수증의 항목 배치 같은 2차원 정보를 애초에 표현할 방법이 없다. 이 논문의 질문은 단순하다 — **BERT에 "이 단어가 페이지의 어디에 있는가"를 알려주면 어떻게 되는가?**',

ideas:[
 {h:'2D 위치 임베딩: 좌표를 임베딩으로 바꾼다',
  lead:'바운딩 박스 (x0,y0,x1,y1) 네 좌표 각각을 임베딩 테이블에 넣어 더한다.',
  d:'[Transformer](#/p/transformer)의 1D 위치 인코딩을 그대로 두 번(가로·세로) 확장한 것이다. OCR이 뽑아준 각 단어의 바운딩 박스 좌상단 $(x_0,y_0)$ 과 우하단 $(x_1,y_1)$ 을 0~1000 범위로 정규화한 뒤, 네 개의 임베딩 테이블에서 각각 값을 찾아 텍스트 임베딩에 더한다. "키가 값의 왼쪽/위에 온다"는 규칙성을 모델이 attention만으로 배우게 된다.'},
 {h:'이미지 임베딩: 글자 생김새도 신호다',
  lead:'단어별 영역을 Faster R-CNN으로 잘라 그 시각 특징을 텍스트 임베딩에 더한다.',
  d:'같은 단어라도 굵게·밑줄·기울임이면 의미가 다를 수 있다(제목 vs 본문). 각 단어의 바운딩 박스를 [Faster R-CNN](#/p/faster-rcnn) 의 ROI로 잘라 시각 특징을 뽑고, 이를 파인튜닝 단계에서 텍스트+레이아웃 임베딩에 더한다. 사전학습 자체는 텍스트+레이아웃만으로 하고, 이미지 임베딩은 다운스트림 태스크에서 결합한다.'},
 {h:'MVLM: 마스킹해도 좌표는 남겨둔다',
  lead:'단어는 가리되 2D 위치는 그대로 줘서 "주변 배치로 단어를 맞히기"를 학습시킨다.',
  d:'[BERT](#/p/bert)의 Masked Language Model을 확장한 **Masked Visual-Language Model**이다. 입력 토큰 중 일부를 마스킹하되, 그 토큰의 2D 위치 임베딩은 그대로 보존한다. 모델은 "이 위치에, 이 주변 레이아웃 안에 어떤 단어가 와야 하는가"를 맞히면서 텍스트와 레이아웃의 결합 표현을 익힌다. 여기에 문서 전체를 16개 카테고리로 분류하는 Multi-label Document Classification(MDC) 손실을 더해 멀티태스크로 사전학습한다.'},
 {h:'OCR을 대체하지 않고 전제한다',
  lead:'LayoutLM은 OCR 이후 단계다 — 텍스트·좌표는 이미 확보됐다고 가정한다.',
  d:'그림에서 "Pre-built OCR/PDF Parser"가 파이프라인의 첫 단계로 고정돼 있다. LayoutLM은 그 출력(단어열 + 바운딩 박스)을 받아 구조를 이해하는 역할만 한다. 이 설계는 기존 OCR 엔진·PDF 파서를 그대로 재사용할 수 있다는 장점이 있지만, 동시에 **OCR이 틀리면 그 오류가 그대로 전달된다**는 구조적 한계를 물려받는다.'}
],

diagram:{type:'flow', cap:'입력 문서 이미지가 OCR/파서를 거쳐 텍스트+좌표가 되고, 여기에 2D 위치·이미지 임베딩을 더해 BERT 인코더에 넣는다.',
 nodes:[
  {t:'문서 이미지', s:'스캔/PDF'},
  {t:'OCR·PDF 파서', s:'단어 + 바운딩박스', a:'단어열로'},
  {t:'텍스트+2D위치 임베딩', s:'x0,y0,x1,y1 임베딩 합산', acc:true},
  {t:'BERT 인코더', s:'MVLM + MDC로 사전학습'},
  {t:'다운스트림 태스크', s:'분류·정보추출'}
 ]},

math:[
 {expr:'E_final = E_word + E_pos(1D) + E_x0 + E_y0 + E_x1 + E_y1 [+ E_image]',
  tex:'E_{\\text{final}} = E_{\\text{word}} + E_{\\text{pos}} + E_{x_0}+E_{y_0}+E_{x_1}+E_{y_1}\\;[+\\,E_{\\text{image}}]',
  d:'BERT의 (단어+위치+세그먼트) 임베딩에 바운딩 박스 좌표 4개의 임베딩을 추가로 더한다. 파인튜닝 단계에서는 Faster R-CNN 시각 특징 $E_{\\text{image}}$ 까지 더해진다.'}
],

numbers:[
 {k:'사전학습 데이터', v:'IIT-CDIP, 문서 6M+/이미지 11M', d:'스캔 문서 이미지, OCR 텍스트 포함'},
 {k:'FUNSD F1', v:'0.7927', d:'text+layout+image, BASE(11M,2epoch) — text-only [RoBERTa](#/p/roberta) BASE 0.6648 대비 대폭 상승'},
 {k:'SROIE F1', v:'0.9524', d:'text+layout, LARGE(11M,1epoch) — 대회 1위 기록 0.9402를 능가'},
 {k:'RVL-CDIP 정확도', v:'94.42%', d:'문서 이미지 16종 분류, 이미지 임베딩 포함 BASE 모델'},
 {k:'모델 크기', v:'BASE 113M / LARGE 343M', d:'2D 위치 임베딩층만 BERT 대비 추가, 나머지는 BERT와 동일 구조'}
],

impact:'문서 AI에서 "텍스트만 읽는 언어모델"과 "레이아웃만 보는 비전 모델"이라는 두 갈래를 하나의 사전학습 프레임워크로 합쳤다. FUNSD처럼 학습 데이터가 149장뿐인 저자원 태스크에서도 대규모 사전학습이 확실한 이득을 준다는 것을 보였고, 이후 LayoutLMv2/v3가 이미지 임베딩까지 사전학습 단계로 끌어올리며 계보를 이었다. "OCR 텍스트 + 좌표를 BERT에 얹는다"는 레시피는 영수증·송장·양식 자동화 실무의 표준 접근 중 하나로 자리잡았다.',

legacy:[
 '**LayoutLMv2/v3** — 이미지 임베딩을 파인튜닝이 아니라 사전학습 단계부터 결합하고, spatial-aware self-attention을 추가',
 '**OCR 없는 대안의 등장** — 같은 시기 이후 [Donut](#/p/donut)이 "OCR 자체를 없애면 어떤가"라는 정반대 질문을 던지며 계보가 갈라짐',
 '**문서 VQA·정보추출 벤치마크 확산** — DocVQA, CORD 등 후속 벤치마크가 LayoutLM류 모델을 표준 베이스라인으로 채택',
 '**영수증·양식 자동화 산업 적용** — 텍스트+좌표 결합 표현이 RPA·전자문서 처리 파이프라인의 실무 표준이 됨'
],

pitfalls:[
 '**LayoutLM은 OCR 파이프라인을 대체하지 않는다.** 입력 자체가 "OCR로 이미 뽑힌 단어+바운딩박스"이므로, OCR 품질이 나쁘면(흐릿한 스캔, 손글씨) 후단 모델이 아무리 좋아도 성능이 그대로 깎인다. 이 전제 없이 수치를 [Donut](#/p/donut) 같은 OCR-free 모델과 같은 줄에 놓고 비교하면 안 된다 — 전자는 정답 OCR 또는 고품질 OCR을 가정한 수치, 후자는 이미지에서 바로 나온 수치라 조건이 다르다.',
 '**FUNSD·SROIE 수치는 표에서 조건(파라미터 수·사전학습 데이터량·epoch·모달리티)이 다른 여러 행 중 하나다.** 예컨대 SROIE Table 4에는 text-only부터 text+layout+image까지, BASE/LARGE까지 여러 설정이 나열돼 있어 어느 행을 인용하는지 반드시 명시해야 한다.',
 '**이미지 임베딩은 사전학습에 쓰이지 않는다.** 원 논문의 MVLM 사전학습은 텍스트+레이아웃만으로 하고, Faster R-CNN 이미지 특징은 다운스트림 파인튜닝 단계에서만 결합된다 — "이미지까지 처음부터 함께 사전학습했다"는 서술은 v1에는 맞지 않는다(v2부터 해당).'
],

figures:[
 {f:'fig2-architecture.png',
  cap:'가장 아래 4개 줄이 바운딩 박스 좌표(x0,y0,x1,y1)를 각각 임베딩으로 바꿔 텍스트 임베딩에 더하는 부분. 오른쪽의 "Pre-built OCR/PDF Parser"가 입력 전 단계, Faster R-CNN은 파인튜닝 시 이미지 임베딩을 만드는 경로다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'To the best of our knowledge, this is the first time that text and layout are jointly learned in a single framework for document-level pre-training.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1912.13318 — LayoutLM', u:'https://arxiv.org/abs/1912.13318'},
 {t:'LayoutLM (Microsoft, code & models)', u:'https://aka.ms/layoutlm'}
]
});
