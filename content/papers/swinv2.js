WIKI.paper({
slug:'swinv2',
venue:'CVPR 2022',
authors:'Liu, Hu, Lin, Yao, Xie et al. (Microsoft Research Asia)',
arxiv:'2111.09883',

tldr:'[Swin](#/p/swin)을 그대로 키우면 학습이 발산하고, 저해상도로 배운 위치 편향이 고해상도로 안 옮겨지고, 메모리가 못 버틴다는 것을 확인하고 각각을 고친 스케일링 논문. 30억 파라미터·1536×1536 해상도까지 키워 당시 최대 밀집(dense) 비전 모델을 만들었다.',

context:'2021년 말 기준 언어모델은 5300억(dense)·1.6조(sparse) 파라미터까지 쌓였는데, 비전 모델은 [ViT](#/p/vit)-G 등 1~2억 수준에 겨우 도달한 상태였다. 문제는 파라미터를 늘리는 방법 자체가 아니라, 늘렸을 때 **실제로 학습이 되는가**였다. 원조 [Swin Transformer](#/p/swin)를 단순히 크게 만들면 세 가지가 무너졌다 — 학습이 발산하거나, 작은 해상도로 사전학습한 모델을 큰 해상도로 옮기면 성능이 떨어지거나, GPU 메모리가 모자랐다. 이 논문은 새 아키텍처가 아니라 **이 세 가지 고장을 구체적으로 진단하고 고치는 것**이 전부다.',

ideas:[
 {h:'문제 1 — 활성값이 층이 깊어질수록 폭주한다',
  lead:'pre-norm 구조는 residual 본류에 출력이 그대로 누적돼 깊은 층의 활성값이 얕은 층보다 $10^4$ 배 커진다.',
  d:'Swin V1은 [Transformer](#/p/transformer) 표준인 pre-LN을 썼는데, 각 residual 블록의 출력이 정규화 없이 그대로 본류에 더해지므로 층을 지날수록 진폭이 누적된다. large 모델에서 이미 층 간 진폭 격차가 $10^4$ 에 달했고, 6.58억 파라미터 huge 모델은 아예 학습이 끝까지 가지 못하고 발산했다(Figure 3).'},
 {h:'해법 1 — res-post-norm + scaled cosine attention',
  lead:'정규화를 블록 출력 뒤로 옮기고, attention 유사도를 내적 대신 코사인으로 바꿔 진폭을 억제한다.',
  d:'LayerNorm을 각 서브레이어(attention, MLP) **뒤**로 옮겨 본류에 합쳐지기 전에 크기를 정규화한다(res-post-norm). 거기에 attention 점수를 $q\\cdot k$ 내적 대신 $\\cos(q,k)/\\tau$ 로 계산하는 scaled cosine attention을 더한다 — 코사인은 자체적으로 정규화돼 있어 몇몇 픽셀 쌍이 attention을 독점하는 현상을 줄인다. 30억 모델에서는 6블록마다 추가 LayerNorm까지 넣어 더 안정화했다.'},
 {h:'문제 2 — 작은 window에서 배운 상대위치 편향이 큰 window로 안 옮겨진다',
  lead:'윈도우 크기가 바뀌면 원래의 구간별(bucket) 위치 편향 표를 보간해야 하는데 성능이 크게 떨어진다.',
  d:'Swin V1은 상대 위치마다 학습 가능한 파라미터를 직접 두는 parameterized RPB를 썼다. 8×8 window로 학습한 모델을 16×16 이상으로 옮기면 이 표를 bi-cubic 보간으로 늘려야 하는데, 표가 이산적이라 큰 폭의 외삽에서 정확도가 크게 떨어졌다.'},
 {h:'해법 2 — log-spaced continuous position bias (Log-CPB)',
  lead:'좌표를 로그 스케일로 압축한 뒤 작은 MLP가 편향값을 생성하게 해, 어떤 window 크기든 매끄럽게 이어 쓴다.',
  d:'상대좌표 $(\\Delta x,\\Delta y)$ 를 직접 표에 저장하는 대신, 좌표를 $\\widehat{\\Delta x}=\\text{sign}(\\Delta x)\\log(1+|\\Delta x|)$ 로 로그 압축한 뒤 2층 MLP $G$ 에 넣어 편향값을 만든다. 로그 압축 덕분에 8×8→16×16 전이 시 외삽 비율이 선형 좌표의 1.14배에서 0.33배로, **약 4배** 줄어든다. 추론 시에는 좌표별 편향값을 미리 계산해 캐시하므로 속도 손해가 없다.'},
 {h:'문제 3·해법 3 — 메모리와 데이터 기아',
  lead:'ZeRO·활성값 체크포인팅·순차 self-attention으로 메모리를, SimMIM으로 라벨 기아를 해결한다.',
  d:'30억 파라미터를 fp32 AdamW로 일반 data-parallel로 학습하면 GPU 1장당 48GB가 필요하다. **ZeRO**(옵티마이저 상태 분산)로 이를 나눠 줄이고, **활성값 체크포인팅**(속도는 최대 30% 느려짐)으로 중간 특징맵 메모리를 줄이고, 1536×1536·32×32 window에서는 self-attention 자체가 병목이라 **순차 계산**으로 우회했다. 데이터는 JFT-3B 같은 라벨 데이터 대신 [MAE](#/p/mae)류의 마스크 복원 사전학습 기법인 SimMIM으로 7천만 장만 쓰고도 SOTA를 냈다 — JFT-3B의 1/40.'}
],

diagram:{type:'compare', cap:'Swin V1 블록(왼쪽)과 V2 블록(오른쪽)의 차이 — 정규화 위치와 attention 유사도 계산만 바뀌었다.',
 left:{t:'V1: pre-norm 블록', items:['LayerNorm → Attention → 잔차','내적 attention: q·kᵀ','파라미터 표 기반 RPB']},
 right:{t:'V2: res-post-norm 블록', items:['Attention → LayerNorm → 잔차','코사인 attention: cos(q,k)/τ','로그좌표 MLP 기반 CPB']}},

math:[
 {expr:'Sim(qi, kj) = cos(qi, kj) / τ + Bij',
  tex:'\\text{Sim}(q_i,k_j)=\\cos(q_i,k_j)/\\tau + B_{ij}',
  d:'$\\tau$ 는 head·층마다 따로 학습되는 스칼라(0.01 이상으로 제한). 코사인은 값의 범위가 이미 $[-1,1]$ 로 정규화돼 있어, 내적처럼 특정 head가 극단적으로 큰 값을 만들어 attention을 독점하는 일이 줄어든다.'},
 {expr:'Δx̂ = sign(Δx)·log(1+|Δx|),  Δŷ = sign(Δy)·log(1+|Δy|),  B = G(Δx̂, Δŷ)',
  tex:'\\widehat{\\Delta x}=\\text{sign}(\\Delta x)\\log(1+|\\Delta x|),\\quad B(\\Delta x,\\Delta y)=G(\\widehat{\\Delta x},\\widehat{\\Delta y})',
  d:'$G$ 는 ReLU를 낀 작은 2층 MLP. 좌표를 로그로 압축한 뒤 이 MLP에 넣어 임의의 상대 위치에 대한 편향값을 연속 함수로 생성하므로, window 크기가 달라져도 표를 보간할 필요 없이 같은 함수를 재평가하면 된다.'}
],

numbers:[
 {k:'최대 모델', v:'SwinV2-G · 30억 파라미터', d:'C=512, block수 {2,2,42,4} + 추가 정규화 레이어, IN-22K-ext-70M으로 사전학습'},
 {k:'최대 해상도·윈도우', v:'1536×1536, window 32×32', d:'COCO 검출·Kinetics-400 영상 분류에 사용, A100-40G에서 순차 self-attention으로 학습'},
 {k:'ImageNet-V2 top-1', v:'84.0%', d:'당시 최고 기록(83.3%) 대비 +0.7%p. 같은 표의 ImageNet-1K-V1은 90.17%(ViT-G 90.45%·CoAtNet-7 90.88%보다는 낮음)'},
 {k:'ADE20K 분할', v:'63.1 / 54.4 mIoU(box/mask AP 표기 원문 그대로)', d:'SwinV2-G 기준, 당시 SOTA'},
 {k:'Kinetics-400 영상 분류', v:'86.8% top-1', d:'SwinV2-G, Video-Swin 계열 확장 적용'},
 {k:'사전학습 데이터 효율', v:'JFT-3B의 1/40', d:'라벨 7천만 장(SimMIM 자기지도) vs JFT-3B의 30억 장 — 학습 시간도 구글 모델 대비 1/40'}
],

impact:'"모델을 더 키우면 된다"는 스케일링 논의를 비전에서 **실제로 실행 가능하게** 만든 논문이다. 새 구조를 제안한 게 아니라, 큰 모델을 학습할 때 반드시 부딪히는 불안정성·해상도 전이·메모리라는 세 가지 공학 문제에 각각 구체적인 처방을 내렸다는 점이 핵심이다. res-post-norm과 log-spaced CPB는 이후 여러 대형 ViT 계열 구현에서 재사용되는 표준 기법이 되었고, ZeRO·활성값 체크포인팅 조합은 비전 모델 학습에서도 대규모 언어모델 학습 인프라를 그대로 가져다 쓸 수 있음을 보여주었다.',

legacy:[
 '**res-post-norm의 확산** — pre-LN의 발산 문제에 대한 대안으로 이후 여러 대형 Transformer 학습 레시피에 채택',
 '**연속 위치 편향(CPB)의 일반화** — 표 대신 작은 MLP로 위치 편향을 생성하는 방식이 해상도·window 크기가 가변적인 후속 비전 모델에 재사용됨',
 '**ZeRO + 활성값 체크포인팅의 비전 이식** — LLM 학습 인프라가 비전 대형 모델 학습에도 그대로 통한다는 것을 실증',
 '**자기지도 사전학습으로 데이터 기아 회피** — SimMIM 채택이 이후 대형 비전 모델에서 라벨 데이터 의존을 낮추는 선례가 됨, [EVA](#/p/eva)의 마스크 사전학습 스케일업과 같은 방향'
],

pitfalls:[
 '**SwinV2-G의 IN-1K(V1) 90.17%는 당대 최고가 아니다.** 같은 시기 ViT-G(90.45%)·[CoAtNet](#/p/coatnet)-7(90.88%)이 더 높다 — SwinV2의 기록은 ImageNet-**V2**(84.0%, +0.7%p 갱신)·ADE20K·Kinetics-400·COCO에서다. 어떤 벤치마크의 어떤 기록인지 구분해서 인용해야 한다.',
 '**res-post-norm은 post-LN과 다르다.** 원 Transformer의 post-LN(서브레이어 뒤에 정규화, 잔차 이후 위치)과 헷갈리기 쉬운데, res-post-norm은 서브레이어 출력을 본류에 합치기 **직전**에 정규화해 진폭 누적 자체를 막는 구조다.',
 '**세 기법은 서로 다른 문제를 푸는 독립적인 처방이다.** res-post-norm+scaled cosine attention(안정성), log-CPB(해상도 전이), ZeRO 등(메모리)을 하나의 "SwinV2 기법"으로 뭉뚱그리면 각 기법이 실제로 겨냥한 문제를 놓친다.'
],

figures:[
 {f:'fig1-v1-v2-block.png',
  cap:'위: V1 블록 — LayerNorm이 attention/MLP **앞**에 있고(pre-norm), q·kᵀ 내적으로 유사도를 계산한다. 아래: V2 블록 — LayerNorm이 attention/MLP **뒤**로 옮겨졌고(주황 테두리), cos(q,k)/τ 로 유사도를 계산하며 위치 편향도 Log-CPB(로그좌표+MLP)로 바뀌었다.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'Through these techniques, this paper successfully trained a 3 billion-parameter Swin Transformer V2 model, which is the largest dense vision model to date, and makes it capable of training with images of up to 1,536×1,536 resolution.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2111.09883 — Swin Transformer V2', u:'https://arxiv.org/abs/2111.09883'},
 {t:'GitHub — microsoft/Swin-Transformer', u:'https://github.com/microsoft/Swin-Transformer'}
]
});
