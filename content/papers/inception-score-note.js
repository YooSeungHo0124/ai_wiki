WIKI.paper({
slug:'inception-score-note',
venue:'ICML 2018 워크숍(제출) — Theoretical Foundations and Applications of Deep Generative Models',
authors:'Barratt, Sharma (Stanford)',
arxiv:'1801.01973',

tldr:'[GAN](#/p/gan) 평가에 가장 널리 쓰이던 Inception Score(IS)가 **가정부터 계산 방식까지** 여러 결함을 안고 있다는 것을 조목조목 지적한 짧은 비판 논문. IS만 보고 모델을 비교하지 말라는 경고가 핵심이다.',

context:'2018년까지 [GAN](#/p/gan)·[DCGAN](#/p/dcgan) 계열 논문 대다수는 Salimans et al.(2016)이 제안한 Inception Score 하나로 샘플 품질을 요약해 우열을 매겼다. 문제는 GAN 같은 암묵적 생성 모델(implicit generative model)이 $p_g(x)$를 명시적으로 계산할 수 없어 우도 비교가 불가능하고, 그 대신 ImageNet으로 학습된 Inception 분류망의 출력 통계를 대리 지표로 쓴다는 점이다. 저자들은 "인간 판단과 상관관계가 있다"는 사실 하나만으로 이 대리 지표를 무비판적으로 신뢰해도 되는지를 검증한다.',

ideas:[
 {h:'IS는 상호정보량과 같다',
  lead:'IS의 로그값이 생성 이미지 $x$와 예측 클래스 $y$ 사이의 상호정보량 $I(y;x)$와 정확히 같다.',
  d:'$\\ln(IS(G)) = \\mathbb{E}_{x\\sim p_g}[D_{KL}(p(y|x)\\,\\|\\,p(y))]$ 를 전개하면 $H(y)-H(y|x)$, 즉 상호정보량이 된다. 이는 IS가 "이미지가 선명해 $p(y|x)$가 저엔트로피"이고 "생성 분포가 다양해 $p(y)$가 고엔트로피"인 두 조건을 동시에 요구한다는 원래 설계 의도를 정확히 재확인해 준다.'},
 {h:'최댓값 1000이라는 상한이 무의미하다',
  lead:'IS는 $[1,1000]$ 범위를 갖지만, 극단값에 가까운 분포일수록 오히려 실제 데이터와 멀다.',
  d:'논문은 1차원 장난감 예시로 보인다 — 두 정규분포로 구성된 진짜 데이터보다, 균등분포 $U(-100,100)$처럼 완전히 다른 분포가 더 높은 IS를 받을 수 있다. 즉 IS를 최대화하는 최적해가 실제 데이터 분포와 일치한다는 보장이 전혀 없다.'},
 {h:'네트워크 가중치·분할수(nsplits)에 민감하다',
  lead:'같은 이미지 집합인데도 Inception 구현(Keras/Torch/TF)과 nsplits 값에 따라 점수가 크게 흔들린다.',
  d:'분류 정확도가 거의 같은 세 가지 Inception 구현으로 같은 CIFAR-10 50k 이미지를 평가했더니 IS가 최대 11.5% 차이 났다(Table 1). 또 원 논문의 관행대로 $n_{splits}=10$을 쓰면, 분할 수를 1에서 200까지 바꾸는 것만으로 평균 점수가 9.91에서 9.09로 흔들린다(Table 2) — "SOTA 갱신"이라 주장되는 차이의 상당수가 이 잡음 범위 안에 있을 수 있다.'},
 {h:'ImageNet 이외 데이터셋에 쓰면 전제가 깨진다',
  lead:'CIFAR-10처럼 ImageNet과 다른 데이터셋에 적용하면 클래스 대응이 어긋나 지표의 근거가 무너진다.',
  d:'IS의 전제는 사전학습된 Inception 분류기가 생성 이미지의 진짜 클래스 분포 $p(y)$·$p(y|x)$를 잘 추정한다는 것이다. 그런데 CIFAR-10에서 상위 예측 클래스는 "이삭"·"탈곡기" 같은 ImageNet 특유의 엉뚱한 범주이고(Table 3), 학습 이미지에 대한 조건부 엔트로피(4.66비트)조차 무작위 픽셀 이미지의 조건부 엔트로피(6.51비트)에 가까워 저엔트로피 가정 자체가 약하게만 성립한다.'},
 {h:'지표를 직접 최적화하면 적대적 예제가 나온다',
  lead:'IS를 높이는 방향으로 이미지를 gradient로 직접 조작하면 사람 눈에는 그냥 노이즈인데 점수는 900을 넘는다.',
  d:'Inception 분류기가 미분 가능하다는 점을 이용해, 무작위 이미지 또는 사전학습된 WGAN 출력을 특정 클래스 확률이 1이 되도록 FGSM 방식으로 반복 수정하면 최대 900점대의 IS를 얻는다(최댓값 1000). 이 이미지들은 자연 이미지처럼 보이지 않는데도 점수만 거의 완벽하다 — 지표를 (간접적으로라도) 모델 선택·조기 종료 기준으로 쓰면 같은 함정에 빠질 수 있다.'}
],

diagram:{type:'compare', cap:'Inception Score의 두 축 결함 — 지표 자체의 결함과 관행적 오용.',
 left:{t:'지표 자체의 결함', items:['가중치·구현체에 민감','nsplits로 값이 흔들림','상한 1000이 무의미']},
 right:{t:'사용 관행의 문제', items:['ImageNet 외 데이터셋 오용','과적합 여부 미보고','직접·간접 최적화 시 적대적예제']}},

math:[
 {expr:'IS(G) = exp( E_{x~pg} DKL( p(y|x) || p(y) ) )',
  tex:'IS(G) = \\exp\\!\\Big(\\mathbb{E}_{x\\sim p_g}\\, D_{KL}\\big(p(y|x)\\,\\|\\,p(y)\\big)\\Big)',
  d:'생성 이미지 $x$의 조건부 클래스 분포 $p(y|x)$가 주변분포 $p(y)$에서 얼마나 먼지를 평균낸 값. exp는 원 저자들이 보기 편하게 넣은 장식일 뿐 본질과 무관하다.'},
 {expr:'ln(IS(G)) = I(y;x) = H(y) - H(y|x)',
  tex:'\\ln(IS(G)) = I(y;x) = H(y) - H(y\\mid x)',
  d:'IS의 로그값은 정확히 상호정보량이다. $H(y|x)$가 항상 0 이상이고 $H(y)\\le\\ln(1000)$이므로 $1\\le IS(G)\\le 1000$ 이 유도된다.'},
 {expr:'S(G) = (1/N) Σ_i DKL( p(y|x_i) || p̂(y) )',
  tex:'S(G) = \\frac{1}{N}\\sum_{i=1}^{N} D_{KL}\\big(p(y\\mid x^{(i)})\\,\\|\\,\\hat p(y)\\big)',
  d:'저자들이 제안한 개선판. exp를 빼고 전체 데이터셋에 대해 한 번에 평균을 내면 nsplits 파라미터에 대한 의존성이 사라지고 상호정보량으로서의 해석도 유지된다.'}
],

numbers:[
 {k:'IS 상한/하한', v:'1 ~ 1000', d:'ImageNet 클래스 수 1000에서 유도된 이론적 범위'},
 {k:'구현체 간 편차', v:'최대 11.5%', d:'CIFAR-10 50k 이미지, Keras/Torch/TF Inception 구현 비교'},
 {k:'nsplits 민감도', v:'평균 9.91 → 9.09', d:'같은 이미지 집합, nsplits=1→200으로 바꿨을 때 (Table 2)'},
 {k:'조건부 엔트로피 · CIFAR', v:'4.664 bit', d:'무작위 픽셀 이미지의 6.512 bit에 근접 — 저엔트로피 가정이 약함'},
 {k:'조건부 엔트로피 · ImageNet', v:'1.97 bit', d:'같은 지표를 원래 학습 도메인에 적용했을 때의 참고값'},
 {k:'적대적 예제 IS', v:'900.15 / 986.10', d:'WGAN 출력 미세조작 / 무작위 초기화 미세조작 — 둘 다 자연 이미지로 보이지 않음'}
],

impact:'단일 스칼라 지표로 생성 모델을 서열화하는 관행 전체에 경고를 던졌다. 이후 연구자들은 IS 단독 보고를 지양하고 FID·precision/recall 같은 보조 지표를 함께 쓰는 쪽으로 옮겨갔으며, 특히 ImageNet 이외 데이터셋에서 IS를 그대로 쓰는 관행이 크게 줄었다. 지표 하나에 의존한 "SOTA 경쟁"이 그 지표의 잡음·결함을 학습해버리는 문제는 이후 [BigGAN](#/p/biggan) 등 GAN 평가 전반에서 FID와 나란히 조심스럽게 다뤄지는 계기가 됐다.',

legacy:[
 '**FID·precision-recall과의 병기** — 이후 GAN 논문 대부분이 IS 단독이 아니라 FID(Fréchet Inception Distance)와 함께 보고하는 관행이 정착',
 '**[BigGAN](#/p/biggan)** 등 대규모 GAN 연구가 IS 하나로 "품질"을 주장하는 대신 truncation trick으로 IS-FID 트레이드오프 곡선 자체를 보고하는 방식으로 발전',
 '**평가 지표 자체에 대한 비판적 검토가 하나의 연구 흐름으로 정착** — 확산 모델 시대에도 FID·CLIP Score 등 새 지표가 나올 때마다 유사한 오용 가능성 검증이 뒤따름',
 '**"지표 하나로 다른 클래스의 모델을 비교하지 말라"는 원칙** — GAN vs VAE vs diffusion 비교 연구들이 이후 여러 지표를 나란히 보고하는 표준 관행으로 이어짐'
],

pitfalls:[
 '**"IS가 높다 = 좋은 모델이다"가 아니다.** 논문의 장난감 예시와 적대적 예제 둘 다, IS를 극대화하는 분포가 실제 데이터 분포와 전혀 다를 수 있음을 보여준다. IS는 필요조건의 근사일 뿐 충분조건이 아니다.',
 '**nsplits·구현체를 명시하지 않은 IS 비교는 신뢰할 수 없다.** 같은 이미지 집합도 이 두 선택만으로 두 자릿수 % 차이가 나므로, 논문 간 IS 수치를 그대로 줄 세워 비교하면 안 된다.',
 '**ImageNet 이외 데이터셋(CIFAR-10, 얼굴, 침실 사진 등)에 IS를 적용하는 것은 원 설계 전제를 벗어난 사용이다.** 저자들은 이런 경우 해당 데이터셋으로 직접 학습한 분류기를 쓰라고 권고한다.'
],

figures:[
 {f:'fig2-adversarial-samples.png', cap:'IS를 gradient로 직접 최적화해 만든 이미지. (a)는 무작위 초기화에서, (b)는 사전학습된 WGAN 출력에서 시작해 미세조작한 결과로, 둘 다 IS가 900점대(최댓값 1000)에 달하지만 사람 눈에는 자연 이미지로 보이지 않는다 — 지표 자체를 목적함수로 삼으면 안 되는 이유를 그대로 보여준다.',
  src:'원문 Figure 2, p.9'}
],

quotes:[
 {t:'We provide new insights into the Inception Score, a recently proposed and widely used evaluation metric for generative models, and demonstrate that it fails to provide useful guidance when comparing models.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1801.01973 — A Note on the Inception Score', u:'https://arxiv.org/abs/1801.01973'},
 {t:'원조 Inception Score 논문 (Salimans et al. 2016)', u:'https://arxiv.org/abs/1606.03498'}
]
});
