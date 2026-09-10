WIKI.paper({
slug:'vilbert',
venue:'NeurIPS 2019 (arXiv preprint 2019)',
authors:'Lu, Batra, Parikh, Lee (Georgia Tech · Facebook AI Research · Oregon State)',
arxiv:'1908.02265',

tldr:'[BERT](#/p/bert)를 이미지와 텍스트를 위한 **두 갈래(two-stream)** 구조로 확장하고, 두 갈래를 co-attentional transformer 층으로 이어 시각-언어 공동 표현을 사전학습한 논문. VQA·VCR·referring expression·이미지 검색 네 과제 모두에서 과제별 전용 모델을 앞섰다.',

context:'2019년 이전 vision-and-language 모델들은 대부분 과제마다 따로 설계됐다. 이미지는 이미 학습된 CNN/detector로, 텍스트는 이미 학습된 언어모델로 각각 인코딩한 뒤, VQA면 VQA용, 캡션 검색이면 검색용으로 **그 과제 데이터 안에서만** 두 모달리티를 잇는 attention을 새로 학습시켰다. 문제는 이 grounding이 과제별 학습 데이터에 갇혀서, 데이터가 적거나 편향되면 일반화가 잘 안 된다는 점이다. 같은 시기 NLP에서는 [BERT](#/p/bert)가 대규모 텍스트로 언어 표현을 먼저 사전학습한 뒤 여러 과제에 전이하는 방식으로 판도를 바꿨다. ViLBERT의 질문은 단순하다 — **시각적 grounding도 과제 학습 중에 배우지 말고, BERT처럼 먼저 사전학습해서 여러 과제에 전이하면 어떨까?**',

ideas:[
 {h:'Two-stream: 시각·언어를 따로 처리한다',
  lead:'이미지와 텍스트를 각각 별도의 BERT류 스택으로 처리하고 일부 층에서만 교환한다.',
  d:'BERT를 그대로 확장해 이미지 영역을 텍스트 토큰처럼 한 시퀀스에 섞어 넣는 방법도 있지만, 저자들은 이를 거부한다. 영역 특징은 이미 깊은 CNN을 거친 고수준 표현이라 텍스트만큼 많은 문맥화 층이 필요 없고, 두 모달리티를 한 스트림에 섞으면 사전학습된 BERT 가중치가 손상되기 쉽다. 그래서 시각 스트림과 언어 스트림을 **별도의 transformer 블록(TRM)** 으로 쌓고, 일부 층에서만 co-attention으로 교환한다. 언어 스트림이 시각 스트림보다 층이 더 깊다(그림의 `L-k` vs `k`) — 텍스트 쪽 문맥화가 더 많이 필요하다는 판단이다.'},
 {h:'Co-Attentional Transformer: Q는 그대로, K·V를 맞바꾼다',
  lead:'표준 transformer 블록에서 key·value 행렬만 상대 모달리티 것으로 교체한다.',
  d:'표준 encoder 블록은 같은 $H$ 에서 Q·K·V를 모두 뽑는다. co-attention 층은 시각 스트림의 Query에 **언어 스트림의 K·V**를, 언어 스트림의 Query에 **시각 스트림의 K·V**를 먹인다. 그러면 시각 쪽 attention pooling은 "이 단어들에 비추어 어느 영역이 중요한가"를, 언어 쪽은 "이 영역들에 비추어 어느 단어가 중요한가"를 계산하게 된다. 나머지(residual add, FFN)는 표준 블록과 동일해서, 기존 transformer 구현에 K·V 소스만 바꾸면 되는 최소한의 변형이다.'},
 {h:'시각 입력은 [Faster R-CNN](#/p/faster-rcnn) 영역 특징',
  lead:'이미지를 패치가 아니라 detector가 찾은 물체 영역들의 집합으로 표현한다.',
  d:'CLIP 이전 시대답게 이미지를 균일한 패치가 아니라 **object detector가 제안한 bounding box들**로 표현한다. Visual Genome으로 사전학습한 Faster R-CNN(ResNet-101)으로 신뢰도 임계값을 넘는 영역을 10~36개 뽑고, 각 영역의 mean-pooled conv 특징을 시각 토큰으로 쓴다. 영역은 순서가 없으므로 위치 인코딩 대신 bbox 좌표+면적 비율로 만든 5차원 공간 벡터를 더한다. 전체 이미지를 대표하는 `<IMG>` 토큰도 별도로 둔다(BERT의 `<CLS>`에 대응).'},
 {h:'사전학습 과제 1: masked multi-modal modelling',
  lead:'단어와 영역을 동시에 마스킹하고, 영역은 좌표가 아니라 의미 클래스 분포를 맞히게 한다.',
  d:'단어·영역 각각 약 15%를 마스킹한다. 마스킹된 영역은 90% 확률로 특징 자체를 0으로 지우고 10%는 그대로 둔다. 텍스트는 BERT와 동일하게 `<MASK>`/무작위 단어/원문 유지를 80/10/10으로 섞는다. 핵심은 영역 쪽 손실 설계다 — 픽셀이나 conv 특징 값을 직접 회귀시키지 않고, **같은 detector가 원래 출력했던 의미 클래스 분포**와의 KL divergence를 최소화한다. 언어가 영역의 정확한 시각 특징까지 복원할 수는 없다는 판단에서다.'},
 {h:'사전학습 과제 2: multi-modal alignment prediction',
  lead:'`<IMG>`와 `<CLS>` 출력을 원소별 곱해 이미지-캡션이 맞는 쌍인지 이진 분류한다.',
  d:'`{IMG, v1..vT, CLS, w1..wT, SEP}` 형태로 이미지-캡션 쌍을 넣고, 최종 `h_IMG`와 `h_CLS`를 원소별 곱(element-wise product)한 뒤 선형층으로 정렬 여부를 맞힌다. Conceptual Captions에는 정답 쌍만 있어서, 이미지 또는 캡션을 무작위로 바꿔치기해 negative를 만든다. BERT의 next-sentence-prediction에 대응하는 자리를 이미지-텍스트 정렬로 바꾼 것이다.'}
],

diagram:{type:'split', cap:'ViLBERT 두 스트림. Q는 자기 모달리티 것을 쓰고 K·V만 상대 것으로 바꾼 co-attention 층에서 정보를 교환한다.',
 from:{t:'BERT 사전학습', s:'텍스트만'},
 branches:[
  {t:'언어 스트림', s:'TRM×(L-k), BERT 초기화'},
  {t:'co-attention', s:'Q 고정, K·V만 교차', acc:true},
  {t:'시각 스트림', s:'TRM×k, R-CNN 영역'}
 ],
 join:'VQA·VCR·RefCOCO+·이미지검색으로 미세조정'},

math:[
 {expr:'head_V = Attention(Q_V, K_W, V_W),  head_W = Attention(Q_W, K_V, V_V)',
  tex:'\\text{head}_V=\\text{Attention}(Q_V,K_W,V_W),\\quad \\text{head}_W=\\text{Attention}(Q_W,K_V,V_V)',
  d:'co-attention의 전부다. 시각 스트림의 attention은 자신의 Query와 **언어 스트림의 K·V**로 값을 섞고, 언어 스트림은 그 반대로 한다. 표준 self-attention $\\text{Attention}(Q,K,V)=\\text{softmax}(QK^\\top/\\sqrt{d_k})V$ 식 자체는 그대로이고 K·V의 출처만 바뀐다.'},
 {expr:'L_mask = KL( p_detector(region) ‖ p_model(region) )',
  tex:'\\mathcal{L}_{\\text{mask}}=\\mathrm{KL}\\!\\left(p_{\\text{detector}}(\\text{region})\\,\\|\\,p_{\\text{model}}(\\text{region})\\right)',
  d:'마스킹된 영역에 대해 모델이 예측한 의미 클래스 분포를, 같은 detector가 그 영역에 대해 원래 냈던 분포에 맞추도록 KL divergence를 최소화한다. 좌표나 픽셀 값을 직접 회귀하지 않는다.'}
],

numbers:[
 {k:'사전학습 데이터', v:'Conceptual Captions ~3.1M쌍', d:'공개 3.3M 중 링크 깨진 것 제외'},
 {k:'영역 특징', v:'Faster R-CNN(ResNet-101), 10~36개/이미지', d:'Visual Genome으로 사전학습된 detector'},
 {k:'학습 규모', v:'TitanX GPU 8장 · batch 512 · 10 epoch', d:'Adam, lr 1e-4, warm-up 후 선형 감쇠'},
 {k:'VQA 2.0 test-std', v:'70.92', d:'DFAF(당시 SOTA) 70.34 대비 +0.58'},
 {k:'VCR Q→AR', v:'54.8', d:'R2C(당시 SOTA) 44.0 대비 대폭 상승'},
 {k:'RefCOCO+ testA', v:'78.52', d:'MAttNet(당시 SOTA) 71.62 대비 +6.9'},
 {k:'Zero-shot 이미지 검색 R@1', v:'31.86', d:'미세조정 없이 Flickr30k에 적용, 사전학습 없는 ViLBERT†는 0.00'}
],

impact:'ViLBERT는 vision-and-language를 "과제마다 새로 배우는 grounding"에서 "먼저 사전학습하고 전이하는 표현"으로 옮겼다. 같은 base 구조에 분류층 하나만 얹어 VQA·VCR·referring expression·이미지 검색 네 과제 전부에서 과제별 전용 모델을 이겼고, 특히 Flickr30k zero-shot 이미지 검색처럼 미세조정 없이도 작동하는 결과는 사전학습만으로 어느 정도의 시각-언어 정렬이 실제로 학습됨을 보여줬다. 같은 해 나온 [LXMERT](#/p/lxmert)(언어·객체·교차 3개 인코더 구조)와 함께 이 조합 — detector 영역 특징 + BERT류 사전학습 — 이 2019~2021년 vision-and-language 모델들의 표준 레시피가 됐다. 저자들은 단일 스트림 baseline과도 비교해 two-stream 구조 자체의 이득(사전학습 여부와 무관하게)을 분리해 보였다.',

legacy:[
 '**detector 기반 시대의 정점** — VQA·VCR·RefCOCO+ 모두에서 Faster R-CNN 영역 특징 + BERT류 사전학습 조합이 표준이 됐고, [LXMERT](#/p/lxmert)·VisualBERT·UNITER 등 같은 시기 경쟁작들이 세부 구조만 바꿔 뒤따랐다',
 '**region feature의 종말** — [ViLT](#/p/vilt)가 detector를 아예 없애고 patch embedding만으로 vision-language를 풀면서, 느리고 무거운 region feature 추출 단계가 병목으로 지목됐다',
 '**대조학습으로의 전환** — [CLIP](#/p/clip)이 정렬 예측을 수백만~수십억 규모 이미지-텍스트 쌍의 대조학습으로 대체하면서, ViLBERT식 masked modelling 사전학습 계열은 점차 스케일 면에서 밀려났다',
 '**멀티태스크 확장** — 후속 연구(12-in-1)가 ViLBERT 구조를 여러 vision-language 과제를 한 번에 학습하는 방향으로 확장했다'
],

pitfalls:[
 '**region feature ≠ patch embedding.** ViLBERT의 시각 토큰은 Faster R-CNN이 미리 찾은 10~36개 bounding box다 — ViT/CLIP류처럼 이미지를 균일 그리드로 자른 patch가 아니다. detector 품질과 클래스 커버리지에 성능이 종속된다.',
 '**co-attention은 모든 층에서 일어나지 않는다.** Figure 1의 점선 상자가 보여주듯 언어 스트림은 `L-k`개 TRM을 먼저 거친 뒤에야 co-attention에 들어간다 — 두 스트림이 처음부터 끝까지 대칭으로 상호작용하는 구조가 아니다.',
 '**[LXMERT](#/p/lxmert)와 혼동 주의.** 둘 다 같은 해 나온 detector+BERT류 2-modality 사전학습이지만, LXMERT는 언어 인코더·객체 인코더·교차 인코더의 **3개 스택**을 쓰고 ViLBERT는 co-attention으로 연결된 **2개 스택**을 쓴다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'위 줄이 시각 스트림(초록, 영역 특징 v0..vT), 아래 줄이 언어 스트림(보라, 토큰 w0..wT). 언어 스트림은 TRM을 L-k번 거친 뒤에야 점선 상자 안의 Co-TRM에서 시각 스트림과 만나고, 이 교환이 k번 반복된다.',
  src:'원문 Figure 1, p.2'},
 {f:'fig2-coattention.png',
  cap:'co-attention 블록 내부. Multi-Head Attention 아래 화살표를 보면 시각 스트림(왼쪽)은 자신의 Q_V에 언어 스트림의 K_W·V_W를 곱하고, 언어 스트림(오른쪽)은 그 반대로 Q_W에 시각 스트림의 K_V·V_V를 곱한다.',
  src:'원문 Figure 2(b), p.3'}
],

quotes:[
 {t:'Our work represents a shift away from learning groundings between vision and language only as part of task training and towards treating visual grounding as a pretrainable and transferable capability.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1908.02265 — ViLBERT', u:'https://arxiv.org/abs/1908.02265'},
 {t:'ViLBERT 공식 구현 (facebookresearch/vilbert-multi-task)', u:'https://github.com/facebookresearch/vilbert-multi-task'}
]
});
