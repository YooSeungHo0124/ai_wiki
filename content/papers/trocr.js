WIKI.paper({
slug:'trocr',
venue:'AAAI 2023 (arXiv 2021)',
authors:'Li et al. (Microsoft Corporation · Beihang University)',
arxiv:'2109.10282',

tldr:'CNN 인코더 + RNN/CTC 디코더로 짜여 있던 전통 OCR 파이프라인을 **순수 Transformer 하나**로 대체한 모델. [ViT](#/p/vit)/DeiT/BEiT 계열 이미지 인코더와 [RoBERTa](#/p/roberta) 계열 텍스트 디코더를 각각 사전학습된 가중치로 초기화한 뒤 이어 붙인다.',

context:'2021년까지 텍스트 인식(text recognition)의 표준 구조는 CRNN류였다 — CNN이 이미지에서 시각 특징을 뽑고, RNN(주로 [LSTM](#/p/lstm)/GRU)이 그 특징을 문자 시퀀스로 바꾸고, CTC loss로 정렬 문제를 풀고, 마지막에 별도의 언어모델을 후처리로 붙여 정확도를 다듬었다. 이 논문의 문제의식은 이 파이프라인 자체다. **[ViT](#/p/vit)로 이미지를, [BERT](#/p/bert)류로 텍스트를 다루는 사전학습 모델이 이미 각자 성숙했는데, 왜 OCR만 CNN+RNN+CTC+외부 LM이라는 4단 조합을 유지하는가?** TrOCR은 텍스트 인식(글자를 읽는 것)만을 다루고, 이미지에서 텍스트 영역을 찾는 텍스트 검출(detection)은 범위 밖에 둔다 — 이 점에서 [LayoutLM](#/p/layoutlm)처럼 OCR 이후 단계를 전제하는 것과는 다르지만, "이미지 전체에서 바로 구조화된 결과를 낸다"는 [Donut](#/p/donut)의 목표와도 다르다.',

ideas:[
 {h:'CNN 없이, 패치 시퀀스로 이미지를 읽는다',
  lead:'텍스트 라인 이미지를 16×16 패치로 잘라 ViT/[DeiT](#/p/deit)/[BEiT](#/p/beit) 인코더에 그대로 넣는다.',
  d:'입력 텍스트 라인 이미지를 384×384로 리사이즈한 뒤 16×16 패치로 나눠 평탄화하고 선형 투영해 인코더에 넣는다. CNN 특유의 지역적 귀납 편향이 전혀 없고, 이미지 전체를 [Transformer](#/p/transformer) self-attention으로 바로 처리한다. 인코더는 [ViT](#/p/vit)/DeiT/BEiT 사전학습 가중치로 초기화된다.'},
 {h:'디코더는 텍스트 사전학습 가중치를 그대로 물려받는다',
  lead:'[RoBERTa](#/p/roberta)/MiniLM 가중치로 디코더를 초기화해 언어 지식을 그대로 재사용한다.',
  d:'디코더는 표준 Transformer 디코더 구조이고, wordpiece 단위(BPE/[SentencePiece](#/p/sentencepiece))로 텍스트를 생성한다. 디코더 가중치는 [RoBERTa](#/p/roberta) 또는 MiniLM에서 초기화하는데, 이는 곧 "글자를 읽는 능력"과 "그럴듯한 문장을 만드는 능력"을 별도 언어모델 후처리 없이 디코더 자체에 내장한다는 뜻이다. 외부 LM을 붙이지 않고도 IAM 데이터셋에서 SOTA CER을 기록한 것이 이 설계의 근거다.'},
 {h:'2단계 사전학습: 합성 데이터로 규모를, 실제 데이터로 정밀도를',
  lead:'1단계는 684M줄 규모의 인쇄체 합성 데이터, 2단계는 손글씨·영수증 등 태스크별 데이터로 나눈다.',
  d:'1단계 사전학습은 공개 PDF에서 뽑은 인쇄체 텍스트 줄 **6.84억 개**로 대규모 일반 인식 능력을 기른다. 2단계는 손글씨체 폰트로 합성한 데이터(17.9M줄)와 실제 영수증 OCR 결과(약 53K장) 등 태스크에 가까운 데이터로 미세하게 맞춘다. 사람이 라벨링한 데이터 없이도 이 경로만으로 높은 성능에 도달한다.'},
 {h:'OCR 파이프라인 전체가 아니라 인식(recognition)만 대체한다',
  lead:'텍스트 검출은 범위 밖에 두고, 잘려 나온 텍스트 줄 이미지를 문자열로 바꾸는 일만 한다.',
  d:'TrOCR은 "이미지 → 텍스트 줄 위치 찾기(검출)"는 다루지 않는다. 이미 잘려 있는 텍스트 라인 이미지를 입력으로 받아 문자열을 출력하는 인식 모델이다. 따라서 실제 서비스에서는 별도 검출기([YOLO](#/p/yolo)류·DBNet 등)와 조합해서 써야 한다 — 이 점에서 "이미지 한 장에서 바로 구조화된 출력"을 내는 [Donut](#/p/donut)과 파이프라인의 범위 자체가 다르다.'}
],

diagram:{type:'flow', cap:'텍스트 라인 이미지를 패치로 잘라 ViT류 인코더에, 그 표현을 RoBERTa류 디코더에 넣어 문자열을 생성한다.',
 nodes:[
  {t:'텍스트 라인 이미지', s:'384×384 리사이즈'},
  {t:'패치 분할', s:'16×16', a:'flatten'},
  {t:'이미지 인코더', s:'ViT/DeiT/BEiT 초기화', acc:true},
  {t:'텍스트 디코더', s:'RoBERTa/MiniLM 초기화'},
  {t:'wordpiece 출력', s:'BPE/SentencePiece'}
 ]},

math:[
 {expr:'CER = (S + D + I) / N',
  tex:'\\text{CER} = \\frac{S+D+I}{N}',
  d:'Character Error Rate. 정답 문자열 대비 치환(S)·삭제(D)·삽입(I) 횟수의 합을 정답 길이 $N$ 으로 나눈 값으로, IAM 손글씨 벤치마크의 표준 평가지표다.'}
],

numbers:[
 {k:'SROIE Task2 F1', v:'96.58', d:'TrOCR-LARGE, word-level — CRNN 베이스라인 36.09 대비 큰 격차'},
 {k:'IAM 손글씨 CER', v:'2.89', d:'TrOCR-LARGE, 외부 언어모델 없이 기록한 당시 SOTA'},
 {k:'사전학습 규모', v:'1단계 6.84억 줄', d:'공개 PDF에서 추출한 인쇄체 텍스트 라인'},
 {k:'모델 크기', v:'SMALL 62M / BASE 334M / LARGE 558M', d:'BASE=BEiT-BASE 인코더+RoBERTa-LARGE 디코더'},
 {k:'추론 속도', v:'SMALL 89.2 tok/s vs LARGE 47.9 tok/s', d:'IAM 데이터셋 기준, SMALL이 정확도 큰 손실 없이 약 2배 빠름'}
],

impact:'OCR을 "CNN 특징 추출 + RNN 시퀀스 모델링 + CTC + 외부 LM"이라는 4단 조합에서 "사전학습된 두 Transformer를 이어 붙이는" 문제로 재정의했다. 인쇄체·손글씨·장면 텍스트(scene text) 세 영역 모두에서 복잡한 전/후처리 없이 SOTA급 성능을 보이며, "비전-언어 두 사전학습 모델을 인코더-디코더로 결합한다"는 레시피가 OCR 밖의 이미지-투-텍스트 태스크 전반에 재사용 가능함을 보였다. 이후 이 레시피는 [Donut](#/p/donut)에서 "OCR 결과 없이 문서 전체를 바로 구조화된 텍스트로" 생성하는 방향으로 한 걸음 더 나아간다.',

legacy:[
 '**인코더-디코더 사전학습 결합 레시피의 확산** — 비전 인코더+언어 디코더를 각각 사전학습해 잇는 방식이 이미지 캡셔닝·문서 이해 전반의 표준 패턴이 됨',
 '**[Donut](#/p/donut)으로의 전환** — TrOCR이 대체한 것은 CNN+RNN 파이프라인이지 OCR 자체가 아니다. Donut은 한 걸음 더 나아가 OCR(검출+인식) 자체를 제거하는 정반대 노선을 취함',
 '**다국어 확장의 용이성** — 디코더 쪽만 다국어 사전학습 모델로 바꾸면 되므로, 언어별로 새 인식 모델을 처음부터 설계할 필요가 줄어듦',
 '**실무 OCR 엔진에 흡수** — 여러 상용·오픈소스 OCR 도구가 CRNN 대신 TrOCR류 Transformer 인식기를 채택'
],

pitfalls:[
 '**TrOCR은 텍스트 검출을 하지 않는다.** 이미 잘려 있는 텍스트 줄 이미지를 입력으로 가정하므로, 실제 사용에는 별도의 검출 단계가 필요하다. "TrOCR 하나로 문서 전체를 처리한다"는 서술은 원 논문 범위를 벗어난다.',
 '**SROIE 수치를 비교할 때 평가 조건이 다르다.** Table 3의 TrOCR 수치는 정답 바운딩 박스로 미리 잘라낸(cropped ground-truth) 텍스트 줄에 대한 것이다. 검출까지 포함한 종단 간(end-to-end) 파이프라인 수치나, [Donut](#/p/donut)처럼 검출·인식을 함께 하는 OCR-free 모델의 수치와 같은 줄에 놓고 비교하면 조건이 다르다.',
 '**IAM CER 비교 시 외부 언어모델 사용 여부를 확인해야 한다.** Table 4에는 외부 LM을 쓴 방법과 안 쓴 방법이 섞여 있다(예: Bluche & Messina 2017은 외부 LM 사용, CER 3.2). TrOCR은 외부 LM 없이 2.89를 기록했다는 점이 핵심 주장이므로, "외부 LM 없는 방법 중 최고"라는 조건을 빼면 비교가 부정확해진다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'왼쪽이 인코더(이미지 패치 → position/patch embedding → Multi-Head Attention·Feed Forward를 N번), 오른쪽이 디코더(텍스트 wordpiece를 Masked Attention + 인코더 출력에 대한 cross-attention으로 생성). 맨 아래 "LICENSEE OF MCDONALD\'S" 이미지가 그대로 패치로 잘려 들어가는 흐름을 보여준다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'TrOCR does not require any convolutional network for the backbone and does not introduce any image-specific inductive biases, which makes the model very easy to implement and maintain.',
  src:'Introduction, p.2'}
],

links:[
 {t:'arXiv 2109.10282 — TrOCR', u:'https://arxiv.org/abs/2109.10282'},
 {t:'TrOCR (Microsoft, code & models)', u:'https://aka.ms/trocr'}
]
});
