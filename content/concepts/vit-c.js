WIKI.concept({
slug:'vit-c',

tldr:'이미지를 겹치지 않는 고정 크기 패치로 잘라 각 패치를 토큰처럼 선형 투영한 뒤, 표준 Transformer 인코더에 그대로 넣어 분류·특징 추출을 하는 아키텍처다.',

why:'CNN이 당연시하던 지역성·평행이동 불변성 같은 가정을 걷어내고도 이미지 인식이 되는지 확인한 실험이었고, 실제로 됐다 — 다만 그 대가로 데이터가 훨씬 많이 필요하다는 것이 실무에서 ViT를 쓸지 CNN을 쓸지 가르는 첫 번째 질문이다. 오늘날 CLIP·DINOv2·SAM 같은 비전 파운데이션 모델 대부분이 ViT 계열을 기본 백본으로 삼는 이유도 이 트레이드오프에서 나온다.',

sections:[
 {h:'이미지를 토큰처럼', d:'[ViT](#/p/vit)는 $H\\times W$ 이미지를 $P\\times P$ 크기의 겹치지 않는 패치로 자른다(예: $224\\times224$ 이미지를 $16\\times16$ 패치로 자르면 $14\\times14=196$개 패치). 각 패치를 펼쳐서(flatten) 하나의 선형 레이어로 $d$차원 벡터로 투영하면, 이제 이미지가 "토큰 196개짜리 시퀀스"가 된다. 여기에 학습 가능한 [CLS] 토큰을 하나 앞에 붙이고 [positional encoding](#/c/positional-encoding)을 더한 뒤, [self-attention](#/c/self-attention)과 FFN으로 이루어진 표준 [Transformer 블록](#/c/transformer-block)을 그대로 통과시킨다 — NLP용으로 설계된 아키텍처를 이미지에 옮기면서 이미지 특화 구조를 거의 추가하지 않았다는 것이 핵심이다.'},
 {h:'귀납 편향을 버린 대가', d:'CNN은 커널을 이미지 전체에 공유해서 쓰기 때문에("[파라미터 공유](#/c/parameter-sharing)") 평행이동 불변성(translation invariance)과 지역성(locality, 가까운 픽셀이 더 관련 있다는 가정)이 아키텍처 자체에 내장돼 있다. ViT의 self-attention은 모든 패치 쌍의 관계를 처음부터 동등하게 계산할 수 있어 이런 가정이 없다 — 이는 유연하지만, 동시에 "가까운 것이 더 관련 있다"는 유용한 사전 지식을 데이터로부터 처음부터 다시 배워야 한다는 뜻이다. [ViT 원 논문](#/p/vit)은 중간 규모 데이터셋(ImageNet 단독)에서는 비슷한 크기의 CNN([BiT](#/p/bit) 등 ResNet 계열)보다 성능이 낮았지만, JFT-300M처럼 훨씬 큰 데이터로 사전학습하면 CNN을 앞지른다는 것을 스케일 실험으로 보였다 — "ViT는 데이터가 많아야 CNN을 이긴다"는 통설이 여기서 나온다.'},
 {h:'DeiT·Swin의 완화책', d:'대규모 사전학습 데이터 없이도 ViT를 쓸 수 있게 만든 두 갈래 해법이 있다. [DeiT](#/p/deit)는 아키텍처는 그대로 두고 knowledge distillation(CNN 교사 모델의 지식을 증류 토큰으로 전달)과 강한 데이터 증강만으로 ImageNet 단독 학습에서도 CNN급 성능을 냈다 — 데이터가 부족하면 학습 절차로 보완한 것이다. [Swin Transformer](#/p/swin)는 반대로 아키텍처를 바꿔, 전체 이미지에 대한 전역 self-attention 대신 작은 윈도우 안에서만 어텐션을 계산하고 층마다 윈도우를 옮기는 방식으로 지역성 편향을 다시 구조에 집어넣었다 — CNN처럼 계층적 특징 맵을 만들어 검출·분할 같은 dense task에도 잘 붙는다.'},
 {h:'실무에서', d:'데이터가 충분히 크거나(수백만 장 이상) 강력한 사전학습 체크포인트를 그대로 파인튜닝해 쓸 수 있다면 ViT류가 유리하고, 데이터가 작고 처음부터 학습해야 한다면 CNN이나 DeiT식 증류·증강이 여전히 안전한 선택이다. 오늘날 CLIP·DINOv2 같은 대규모 비전 파운데이션 모델이 대부분 ViT 계열인 이유는, 애초에 인터넷 규모 데이터로 사전학습하는 전제라 ViT의 약점(데이터 갈증)이 문제가 되지 않기 때문이다.'}
],

math:[
 {tex:'x_p\\in\\mathbb{R}^{P^2 \\cdot C}\\ \\to\\ z_0=[x_{cls};\\,x_p^1 E;\\,\\dots;\\,x_p^N E] + E_{pos}',
  expr:'패치 임베딩', d:'이미지를 $N=HW/P^2$개의 패치로 나누고 각 패치를 펼친 벡터($P^2\\cdot C$차원, $C$는 채널 수)에 학습된 선형 투영 $E$를 곱해 $d$차원 토큰으로 만든다. $x_{cls}$는 분류용으로 붙이는 학습 가능한 토큰, $E_{pos}$는 위치 임베딩이다.'}
],

code:{lang:'python', d:'패치 임베딩만 CNN 대신 "잘라서 선형 투영"으로 하고, 나머지는 표준 Transformer 인코더 그대로다.',
 src:`patches = split_into_patches(image, P)      # (N, P*P*C)
tokens = patches @ E                        # (N, d) 선형 투영
tokens = concat([cls_token, tokens]) + pos_emb
for _ in range(L):
    tokens = transformer_block(tokens)      # self-attn + FFN
logits = head(tokens[0])                    # CLS 토큰만 사용`},

diagram:{type:'flow', cap:'ViT: 이미지 → 패치 토큰 → 표준 Transformer 인코더.',
 nodes:[
  {t:'이미지', s:'H×W×C'},
  {t:'패치 분할', s:'P×P 조각'},
  {t:'선형 투영', s:'+ CLS + pos'},
  {t:'Transformer', s:'인코더 L층'},
  {t:'CLS 출력', s:'분류 헤드'}
 ]},

confuse:[
 {a:'ViT', b:'CNN', d:'CNN은 지역 커널과 파라미터 공유로 지역성·평행이동 불변성을 구조에 내장한다. ViT는 self-attention으로 모든 패치 쌍을 동등하게 다뤄 이런 편향이 없다 — 유연하지만 데이터로 그 역할을 대신 배워야 해서 데이터 갈증이 크다.'},
 {a:'ViT', b:'Swin Transformer', d:'ViT는 매 층에서 전체 패치 사이 전역 self-attention을 계산한다($O(N^2)$). Swin은 작은 윈도우 안에서만 어텐션을 계산하고 층마다 윈도우를 옮겨(shifted window) 지역성과 계산 효율을 되찾은 계층형 변형이다.'},
 {a:'패치(patch)', b:'토큰(token)', d:'패치는 이미지를 자른 픽셀 조각 자체(원본 공간의 단위)이고, 토큰은 그 패치를 선형 투영해 만든 $d$차원 벡터(모델 내부 표현의 단위)다. "패치 임베딩"이라는 말은 이 변환 전체를 가리킨다.'}
],

pitfalls:[
 '"ViT가 CNN보다 항상 낫다"는 전제는 틀렸다 — 원 논문 자체가 중간 규모 데이터에서는 ViT가 CNN보다 못했다는 것을 보고했고, 그 격차가 사라지는 지점은 데이터 규모가 충분히 커진 뒤부터다.',
 'ViT에 positional encoding이 없어도 될 것이라 생각하기 쉽지만, self-attention 자체는 순서를 모르므로(순열 불변) 패치의 공간적 위치 정보를 주려면 위치 임베딩이 반드시 필요하다.',
 'ViT를 detection·segmentation에 그대로 쓰려 하면 해상도가 커질수록 $O(N^2)$ 어텐션 비용이 CNN보다 훨씬 빨리 커진다는 점을 놓치기 쉽다 — Swin 같은 계층형·윈도우 변형이 이런 dense task에 더 자주 쓰이는 이유다.',
 '패치 크기를 단순한 하이퍼파라미터로 여기기 쉽지만, 패치가 작을수록 토큰 수가 늘어 계산량이 커지는 대신 세밀한 표현이 가능해지는 트레이드오프라는 점에서 모델 크기·데이터 규모와 함께 조정해야 하는 설계 변수다.'
],

papers:['vit','deit','swin','bit'],
terms:['self-attention','transformer-block','parameter-sharing','positional-encoding']
});
