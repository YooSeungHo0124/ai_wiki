WIKI.paper({
slug:'deit',
venue:'ICML 2021',
authors:'Touvron et al. (Facebook AI Research · Sorbonne University)',
arxiv:'2012.12877',

tldr:'[ViT](#/p/vit)가 요구했던 3억 장짜리 비공개 데이터셋 없이, **ImageNet-1k 120만 장과 GPU 8장 사흘**만으로 같은 아키텍처를 경쟁력 있게 학습시킨 논문. 강한 증강·정규화 레시피와, **증류 토큰**이라는 새 입력 토큰이 그 방법이다.',

context:'[ViT](#/p/vit)는 "패치를 토큰으로 보면 CNN 없이도 된다"를 증명했지만, 동시에 **그것이 JFT-300M 규모에서만 성립한다**는 각주를 달아버렸다. ImageNet-1k만으로 학습한 ViT-B는 77.9%로 같은 크기 [ResNet](#/p/resnet)보다 못했다. 이 상태에서 ViT는 구글 밖에서는 쓸 수 없는 결과였다 — JFT는 비공개이고, 재현하려면 수천 TPU-day가 든다. 그래서 남은 질문은 하나다. **CNN이 아키텍처로 공짜로 갖던 귀납적 편향을, 데이터가 아니라 학습 절차로 대체할 수 있는가?** DeiT의 답은 두 갈래다 — 하나는 증강과 정규화를 극단까지 밀어붙이는 것, 다른 하나는 이미 그 편향을 학습해 둔 CNN 교사에게서 [지식을 증류](#/p/distillation)받는 것이다.',

ideas:[
 {h:'증류 토큰: 교사의 신호를 위한 별도 입력 자리',
  lead:'[CLS] 옆에 [distillation] 토큰을 추가해 교사의 예측을 이 토큰 하나에만 맞춘다.',
  d:'기존 [증류](#/p/distillation)는 학생의 출력 로짓에 교사 로짓을 맞추는 손실 항이었다. DeiT는 대신 **시퀀스에 토큰을 하나 더 추가한다**. `[CLS]` 옆에 학습 가능한 `[distillation]` 토큰을 붙이고, 이 토큰의 최종 출력만 교사의 예측에 맞춘다. 두 토큰은 같은 self-attention을 통과하며 서로와 패치들을 보지만, 목적이 달라 학습 후 코사인 유사도가 0.06에서 0.93으로 수렴하되 끝까지 동일해지지는 않는다 — 즉 상보적인 두 개의 분류기가 한 몸에서 자란다.'},
 {h:'하드 증류가 소프트 증류보다 낫다',
  lead:'온도로 부드럽게 만든 분포 대신 교사의 argmax 레이블 하나를 정답처럼 쓴다.',
  d:'[Hinton의 증류](#/p/distillation)는 온도를 높인 교사의 **소프트 분포**를 KL로 맞추는 것이 요점이었다. DeiT는 실험적으로 교사의 **argmax 한 개 레이블**을 정답처럼 쓰는 하드 증류가 더 좋다고 보고한다. 하이퍼파라미터(온도 $\\tau$, 가중치 $\\lambda$)도 사라져 튜닝이 간단해진다. 추론 시에는 `[CLS]`와 `[distillation]` 두 head의 softmax를 더해서 쓴다.'},
 {h:'교사가 CNN일 때 더 잘 배운다',
  lead:'같은 정확도의 Transformer 교사보다 CNN 교사에게 배울 때 학생이 더 좋아진다.',
  d:'같은 정확도의 Transformer 교사보다 **convnet 교사**(RegNetY-16GF, 82.9%)에게 배운 학생이 더 좋다. 저자들의 해석은 학생이 교사의 정답만이 아니라 **CNN의 귀납적 편향까지 상속받는다**는 것이다. 실제로 증류된 DeiT는 오분류 패턴이 교사 CNN 쪽에 더 가깝다. "편향을 버리는 대신 데이터로 메운다"는 ViT의 노선을, "편향을 다른 모델에서 빌려온다"로 바꾼 셈이다.'},
 {h:'레시피 자체가 기여다',
  lead:'증류 없이 강한 증강·정규화 레시피만으로도 원조 ViT-B보다 4%p 가까이 오른다.',
  d:'증류를 빼고 봐도 DeiT-B는 ImageNet-1k만으로 81.8%에 도달한다 — 같은 아키텍처의 원조 ViT-B(77.9%)보다 4%p 가깝게 높다. 차이는 전부 학습 절차다. RandAugment, Mixup, CutMix, random erasing, stochastic depth, repeated augmentation, AdamW, 300 에폭, 그리고 낮은 해상도로 학습한 뒤 384로 파인튜닝. **아키텍처를 안 건드리고 레시피만 바꿔도 이만큼 움직인다**는 것이 이후 [ConvNeXt](#/p/convnext)류 재평가 연구의 출발점이 됐다.'}
],

diagram:{type:'compare', cap:'ViT는 데이터를 늘려 편향의 부재를 메웠고, DeiT는 교사 모델과 증강으로 메운다.',
 left:{t:'ViT (2020): 데이터로 메운다', items:['JFT-300M · 3억 장 비공개','ImageNet-1k만 쓰면 77.9%','수천 TPUv3-core-day','귀납적 편향을 데이터로부터 학습']},
 right:{t:'DeiT (2021): 레시피+교사', items:['ImageNet-1k · 120만 장만','증류 토큰 추가 → 83.4%','8×GPU · 3일 미만','CNN 교사에게서 편향을 상속']}},

math:[
 {expr:'L_hard = ½ · CE(ψ(Z_s), y) + ½ · CE(ψ(Z_s), y_t),   y_t = argmax_c Z_t(c)',
  tex:'L_{\\text{hard}}=\\tfrac12\\,\\text{CE}(\\psi(Z_s),y)+\\tfrac12\\,\\text{CE}(\\psi(Z_s),y_t),\\quad y_t=\\arg\\max_c Z_t(c)',
  d:'하드 라벨 증류 목적함수. $Z_s$·$Z_t$ 는 학생과 교사의 로짓, $y$ 는 실제 정답, $y_t$ 는 교사의 예측 레이블이다. 온도 $\\tau$ 가 없다.'},
 {expr:'z₀ = [ x_class ; x_distill ; x¹_p E ; … ; x^N_p E ] + E_pos',
  tex:'z_0=\\left[x_{\\text{class}};\\,x_{\\text{distill}};\\,x_p^1E;\\,\\dots;\\,x_p^NE\\right]+E_{pos}',
  d:'입력 시퀀스가 [ViT](#/p/vit)와 딱 한 토큰 다르다. 이 토큰 하나가 아키텍처 변경의 전부이며, 나머지는 그대로다.'}
],

numbers:[
 {k:'ImageNet top-1 · DeiT-B', v:'81.8%', d:'증류 없이 ImageNet-1k만. 원조 ViT-B 동일 조건 77.9%'},
 {k:'ImageNet top-1 · DeiT-B ⚗', v:'83.4%', d:'증류 토큰 사용 (224×224)'},
 {k:'ImageNet top-1 · DeiT-B ⚗↑384', v:'85.2%', d:'384 해상도로 파인튜닝한 최고 결과'},
 {k:'DeiT-Ti / DeiT-S', v:'72.2% / 79.8%', d:'각각 5M / 22M 파라미터 — ResNet-18·50 급 예산'},
 {k:'학습 비용', v:'8 GPU · 3일 미만', d:'단일 노드 한 대로 완결. ViT의 TPU 팜 대비 진입 장벽 붕괴'},
 {k:'교사 모델', v:'RegNetY-16GF · 82.9%', d:'같은 데이터·같은 증강으로 학습시킨 convnet'}
],

figures:[
 {f:'fig2-distillation-token.png',
  cap:'아래쪽 입력 시퀀스에 class token(원)·patch token(네모)과 나란히 distillation token(원)이 하나 더 붙는다. 이 토큰도 self-attention을 거치며 다른 토큰과 정보를 주고받지만, 맨 위 출력에서 class token은 실제 정답(L_CE)을, distillation token은 **교사 모델의 예측(L_teacher)** 을 맞히도록 별도로 학습된다 — 두 토큰이 서로 다른 목표를 향해 gradient를 받는다는 것이 핵심.',
  src:'원문 Figure 2, p.7'}
],

quotes:[
 {t:'We train them on a single computer in less than 3 days. Our reference vision transformer (86M parameters) achieves top-1 accuracy of 83.1% (single-crop) on ImageNet with no external data.',
  src:'Abstract, p.1'},
 {t:'Interestingly, we observe that the learned class and distillation tokens converge towards different vectors: the average cosine similarity between these tokens equal to 0.06.',
  src:'Section 4, p.7'}
],

impact:'ViT를 연구실 밖으로 꺼냈다. 사흘·GPU 8장이면 누구나 ViT를 처음부터 학습시킬 수 있게 되면서, 비전 Transformer 연구의 참여자 수가 급격히 늘었다. 더 중요한 건 결론의 성격이다 — **ViT의 약점은 아키텍처가 아니라 학습 절차였다**. 이 관점은 두 방향으로 퍼졌다. 하나는 DeiT의 증강·정규화 레시피가 이후 거의 모든 비전 Transformer([Swin](#/p/swin) 포함)의 기본 학습 설정이 된 것이고, 다른 하나는 "그럼 CNN도 같은 레시피로 다시 학습시켜보자"는 [ConvNeXt](#/p/convnext)식 재검증이다. 또한 증류 토큰은 "감독 신호마다 전용 토큰을 준다"는 설계 패턴을 남겼다.',

legacy:[
 '**학습 레시피의 표준화** — RandAugment·Mixup·CutMix·stochastic depth·AdamW 조합이 비전 Transformer의 사실상 기본값이 됨',
 '**데이터 효율 경쟁의 다음 단계** — 여전히 레이블 120만 장이 필요하다는 한계가 남아, [MAE](#/p/mae)·[DINO](#/p/dino)의 레이블 없는 자기지도 사전학습으로 이어짐',
 '**CNN의 반격을 촉발** — "레시피가 차이였다"는 결론이 [ConvNeXt](#/p/convnext)로 이어져, 같은 학습법을 적용한 CNN이 [Swin](#/p/swin)과 대등함을 보임',
 '**전용 토큰 패턴** — 태스크별 토큰을 시퀀스에 추가해 감독 신호를 분리하는 설계가 이후 여러 멀티태스크 비전 모델에 재사용됨'
],

pitfalls:[
 '**증류 토큰이 없어도 대부분의 이득은 나온다.** 81.8% → 83.4%가 토큰의 몫이고, 77.9% → 81.8%는 순전히 증강·정규화 레시피의 몫이다. "DeiT = 증류"로 요약하면 더 큰 절반을 놓친다.',
 '**교사 CNN을 먼저 학습시켜야 하므로 총 비용은 표에 적힌 것보다 크다.** 논문의 3일은 학생 학습 시간이며, RegNetY-16GF 교사 학습 비용은 별도다. 공개 사전학습 교사를 쓰면 되지만 그 경우 "ImageNet-1k만 사용"이라는 조건은 교사 학습까지 포함해서 따져야 한다.',
 '**강한 증강은 소규모 데이터셋에 그대로 옮기면 역효과가 난다.** DeiT 레시피는 120만 장·300에폭을 전제로 조율돼 있어, 수만 장짜리 데이터셋에 그대로 쓰면 과도한 정규화로 underfit되기 쉽다.'
],

links:[
 {t:'arXiv 2012.12877 — Training data-efficient image transformers & distillation through attention', u:'https://arxiv.org/abs/2012.12877'},
 {t:'facebookresearch/deit (공식 코드)', u:'https://github.com/facebookresearch/deit'}
]
});
