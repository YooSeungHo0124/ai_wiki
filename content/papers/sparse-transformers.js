WIKI.paper({
slug:'sparse-transformers',
venue:'arXiv 2019 (OpenAI)',
authors:'Child, Gray, Radford, Sutskever (OpenAI)',
arxiv:'1904.10509',

tldr:'[Transformer](#/p/transformer)의 self-attention을 $O(n^2)$ 에서 $O(n\\sqrt{n})$ 로 줄이는 **희소 attention 패턴**을 제안하고, 같은 구조로 이미지·오디오·텍스트를 통째로 생성해 보인 논문. 수백 층을 쌓아도 안정적으로 학습되게 만드는 잔차 블록 재설계와 메모리 재계산 기법도 함께 내놓았다.',

context:'2017년 [Transformer](#/p/transformer)는 임의의 두 위치를 $O(1)$ 경로로 잇는 대신 대가를 남겼다 — self-attention이 모든 토큰 쌍의 유사도를 계산하므로 시간·메모리가 시퀀스 길이 $n$ 의 제곱에 비례한다. 저자들이 128층 attention 네트워크를 CIFAR-10(3072바이트 시퀀스)에 학습시켜 관찰해 보니, 초반 층은 합성곱처럼 **국소 패턴**을, 중반 층은 **행·열로 나뉜 패턴**을, 후반 층은 드물게 활성화되는 **희소 패턴**을 스스로 학습하고 있었다. 즉 attention 행렬은 실제로는 대부분 낭비되는 계산이었다. 질문은 단순했다 — 이 관찰된 희소성을 학습 후가 아니라 **아키텍처 자체에 미리 박아 넣으면** 성능 손실 없이 시퀀스 길이를 훨씬 늘릴 수 있지 않을까.',

ideas:[
 {h:'Strided attention: 격자 구조에 맞춘 두 갈래 분해',
  lead:'한 head는 최근 l개 위치를, 다른 head는 l칸마다 하나씩 봐서 전체를 커버한다.',
  d:'2차원 factorized attention의 첫 번째 방식이다. 한 attention head는 직전 $l$ 개 위치에 attend하고, 다른 head는 $l$ 의 배수 위치에만 attend한다. $l$ 을 $\\sqrt{n}$ 근처로 잡으면 두 head를 순차로 거쳐 임의의 과거 위치에 닿을 수 있다. 이미지처럼 데이터가 실제로 격자(행·열) 구조를 가질 때 잘 맞지만, 텍스트처럼 주기성이 없는 데이터에서는 위치 좌표와 의미적 관련성이 일치하지 않아 정보가 잘 전달되지 않았다.'},
 {h:'Fixed attention: 요약 셀을 통한 전역 전파',
  lead:'블록마다 고정된 몇 개 위치가 요약을 맡아 이후 모든 위치에 전파한다.',
  d:'텍스트처럼 주기 구조가 없는 데이터를 위한 대안이다. 시퀀스를 길이 $l$ 블록으로 나누고, 각 블록의 마지막 $c$ 개 위치($c \\in \\{8,16,32\\}$)만 이후 모든 위치가 attend할 수 있게 한다. 이 소수의 "요약 셀"이 블록 전체 정보를 압축해 전달하는 역할을 한다. $c=1$ 이면 표현력이 크게 떨어지므로 실무에서는 8 이상을 썼다.'},
 {h:'Pre-activation 잔차 블록으로 수백 층까지 확장',
  lead:'정규화를 attention/FFN **앞**에 두는 pre-LN 배치로 깊은 네트워크를 안정시킨다.',
  d:'원 Transformer의 post-LN 구성은 층을 깊게 쌓으면 학습이 불안정했다. 이 논문은 [ResNet](#/p/resnet) 계열의 pre-activation 방식을 가져와 `x ← x + Sublayer(Norm(x))` 순서로 바꾸고, 부가 손실(auxiliary loss) 없이도 최대 128층까지 안정적으로 학습시켰다. 오늘날 거의 모든 대형 Transformer가 이 pre-LN 배치를 그대로 물려받았다.'},
 {h:'attention 재계산으로 메모리를 시간과 맞바꾼다',
  lead:'backward 때 attention 가중치를 저장 대신 다시 계산해 GPU 메모리를 크게 아낀다.',
  d:'긴 시퀀스에서는 attention 행렬 자체가 각 층마다 $n^2$ 크기라 메모리를 지배한다. gradient checkpointing을 확장해, attention 가중치와 FFN 활성화를 저장하지 않고 backward 시점에 다시 계산한다. 이 재계산만으로도 수백 층 dense attention 모델을 학습할 수 있었고, 여기에 희소 커널을 더해 백만 timestep급 시퀀스까지 다룰 수 있었다.'},
 {h:'이미지·오디오·텍스트를 같은 바이트 시퀀스로',
  lead:'모달리티별 구조 없이 원시 바이트를 그대로 하나의 자기회귀 모델에 넣는다.',
  d:'CIFAR-10 픽셀, EnWik8 텍스트, 12kHz 클래식 음악 파형을 전부 이산 토큰 시퀀스로만 취급해 같은 decoder-only 아키텍처로 모델링했다. 데이터 종류마다 다른 inductive bias(합성곱·순환 구조)를 설계하는 대신, "충분히 긴 attention이면 구조를 스스로 찾는다"는 가설을 세 도메인에서 동시에 검증한 것이다.'}
],

diagram:{type:'compare', cap:'같은 6×6 격자에서 세 attention 패턴의 연결성 비교. 파란 칸이 attend 가능한 위치.',
 left:{t:'Dense attention', items:['모든 이전 위치를 attend','비용 O(n²)','128층에서 학습 불안정']},
 right:{t:'Sparse Transformer', items:['head별로 부분집합만 attend','비용 O(n√n)','두 head 합치면 전체 도달 O(1)홉']}},

math:[
 {expr:'strided: A_i^(1) = {i-l, ..., i},  A_i^(2) = {j : (i-j) mod l = 0}',
  tex:'A_i^{(1)}=\\{t,\\dots,i\\}\\ (t=\\max(0,i-l)),\\qquad A_i^{(2)}=\\{j: (i-j)\\bmod l = 0\\}',
  d:'첫 head는 최근 $l$ 개, 둘째 head는 $l$ 의 배수 위치. $l$ 을 $\\sqrt{n}$ 근처로 잡으면 두 head를 거쳐 임의 위치에 닿는다.'},
 {expr:'fixed: A_i^(1) = {j : floor(j/l) = floor(i/l)},  A_i^(2) = {j : j mod l ∈ [l-c, l]}',
  tex:'A_i^{(1)}=\\{j:\\lfloor j/l\\rfloor=\\lfloor i/l\\rfloor\\},\\qquad A_i^{(2)}=\\{j: j\\bmod l \\in \\{l-c,\\dots,l\\}\\}',
  d:'같은 블록 내부 전체를 보는 head 하나와, 각 블록의 마지막 $c$ 개 "요약 위치"만 보는 head 하나를 합친다.'},
 {expr:'유효 연산량: O(n · n^(1/p)),  p=2일 때 O(n√n)',
  tex:'O\\!\\left(n\\cdot n^{1/p}\\right)\\ \\xrightarrow{p=2}\\ O(n\\sqrt{n})',
  d:'$p$ 는 factorized attention head의 개수. 이 논문은 $p=2$ 로 실험했지만 더 높은 차원으로도 확장 가능하다고 언급한다.'}
],

numbers:[
 {k:'복잡도', v:'O(n√n)', d:'기존 dense self-attention의 $O(n^2)$ 대비'},
 {k:'Enwik8', v:'0.99 bits/byte', d:'95M 파라미터 fixed 패턴, 당시 Transformer-XL 88M(1.03)을 능가'},
 {k:'CIFAR-10', v:'2.80 bits/dim', d:'59M 파라미터 strided 패턴, 이전 SOTA 2.85를 경신'},
 {k:'ImageNet 64×64', v:'3.44 bits/dim', d:'152M 파라미터, 48층 strided, 이전 SOTA 3.52 경신'},
 {k:'최대 실험 시퀀스', v:'100만+ timestep', d:'클래식 음악 데이터, 단 파라미터는 300만 개로 극히 작음'},
 {k:'속도', v:'Enwik8 기준 iter당 최대 3.7배', d:'Sparse(fixed) 0.55s vs Dense 1.31s, 12288 컨텍스트'}
],

impact:'이 논문은 $O(n^2)$ 이 attention의 물리 법칙이 아니라 **설계 선택**임을 처음으로 실증했다. 구조화된 희소 패턴만으로 성능 손실 없이(오히려 일부 개선되며) 시퀀스 길이를 자릿수 단위로 늘릴 수 있음을 보였고, pre-LN 잔차 블록과 attention 재계산은 이후 대부분의 대형 Transformer 구현에 그대로 남았다. 다만 strided/fixed 패턴은 미리 정해진 고정 구조라 데이터 특성에 맞춰 손으로 설계해야 한다는 한계가 있었고, 이는 곧 학습된 희소성이나 근사 기법을 찾는 다음 세대 연구로 이어졌다.',

legacy:[
 '**고정 패턴에서 학습된 패턴으로** — [Longformer/BigBird](#/p/sparse-attn)가 국소+전역 attention을 일반화하고, 태스크별 수작업 설계 없이도 긴 문서에 적용 가능하게 만듦',
 '**근사 대신 정확한 attention 가속** — [FlashAttention](#/p/flashattention)은 희소화 없이 메모리 접근 패턴만 바꿔 같은 목표(긴 컨텍스트)를 다른 방식으로 달성',
 '**pre-LN·재계산의 표준화** — 이 논문에서 검증된 pre-activation 잔차 블록과 gradient checkpointing은 이후 [GPT-2](#/p/gpt2) 이후 대부분의 decoder-only 모델 구현에 정착',
 '**바이트 단위 통합 생성 모델** — 모달리티 구분 없이 원시 시퀀스를 다루는 접근은 이후 이미지·오디오·텍스트를 함께 다루는 멀티모달 autoregressive 모델들의 초기 증거가 됨'
],

pitfalls:[
 '**strided 패턴이 항상 낫다는 뜻이 아니다.** 텍스트처럼 위치와 의미가 주기적으로 대응하지 않는 데이터에서는 strided가 오히려 정보를 놓치고, 그 경우엔 fixed 패턴을 써야 한다 — 논문 스스로 도메인별로 다른 패턴을 골라 썼다.',
 '**$O(n\\sqrt{n})$ 은 고정된 sparsity 패턴의 이론적 계산량이지, 실제 wall-clock 속도 향상의 전부가 아니다.** 이 논문이 강조한 또 다른 축은 **메모리** — 재계산 기법 없이는 깊은 모델 자체가 GPU에 올라가지 않았다.',
 '**"attention을 줄여도 성능이 떨어지지 않았다"는 이 세 데이터셋·이 규모에서의 결과다.** 100만 timestep 실험은 파라미터가 300만 개뿐이라는 단서가 붙는다 — 긴 컨텍스트와 큰 모델을 동시에 만족시킨 실험은 아니다.'
],

figures:[
 {f:'fig3-connectivity.png',
  cap:'세 연결성 행렬(행=출력, 열=입력)을 나란히 비교. (a) dense는 대각선 아래 전체가 파랗다. (b) strided는 대각선 근처 띠 + 일정 간격의 세로줄. (c) fixed는 계단식 블록 + 블록 끝의 세로줄(요약 위치). 파란 칸 개수가 곧 계산량이다.',
  src:'원문 Figure 3, p.3'},
 {f:'fig4-resblock.png',
  cap:'회색 배경 = 체크포인트되어 GPU에 남는 텐서, 흰 배경 = backward 때 재계산되는 텐서(attention·FFN 활성화). norm이 attention/feed-forward **앞**에 오는 pre-LN 순서를 확인할 수 있다.',
  src:'원문 Figure 4, p.5'}
],

quotes:[
 {t:'In this paper we introduce sparse factorizations of the attention matrix which reduce this to O(n√n).',
  src:'Abstract, p.1'},
 {t:'We found that, in addition to running significantly faster than full attention, sparse patterns also converged to lower error.',
  src:'Section 7, p.5'}
],

links:[
 {t:'arXiv 1904.10509 — Generating Long Sequences with Sparse Transformers', u:'https://arxiv.org/abs/1904.10509'},
 {t:'OpenAI Blog — Sparse Transformer', u:'https://openai.com/research/sparse-transformer'}
]
});
