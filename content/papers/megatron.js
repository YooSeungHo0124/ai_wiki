WIKI.paper({
slug:'megatron',
venue:'arXiv 2019 (NVIDIA)',
authors:'Shoeybi, Patwary, Puri, LeGresley, Casper, Catanzaro (NVIDIA)',
arxiv:'1909.08053',

tldr:'[Transformer](#/p/transformer) 블록 안의 행렬곱을 **열 방향과 행 방향으로 번갈아 쪼개면**, 레이어당 단 두 번의 all-reduce만으로 여러 GPU가 하나의 레이어를 나눠 계산할 수 있다는 것을 보인 논문. 컴파일러도 새 프레임워크도 없이 PyTorch에 통신 연산 몇 줄을 끼워 넣어 8.3B 모델을 학습했다.',

context:'2019년까지 "모델이 GPU 한 장에 안 들어간다"의 표준 해법은 **파이프라인 병렬**이었다. 레이어를 층 단위로 잘라 GPU에 나눠 배치하는 방식인데, 마이크로배치를 잘게 쪼개도 파이프라인이 채워지고 비워지는 동안의 유휴 시간(bubble)이 남고, 옵티마이저 상태 관리도 까다롭다. 근본적으로 파이프라인은 **레이어 하나가 GPU 한 장에 들어간다**는 전제를 깔고 있다. 그런데 hidden size를 키우면 FFN 하나의 가중치만 수 GB가 된다. 그렇다면 레이어 자체를 가로로 갈라야 하는데, 당시 이를 위한 도구(Mesh-TensorFlow 등)는 전용 프레임워크와 모델 재작성을 요구했다. Megatron-LM의 주장은 단순하다 — **transformer 블록의 구조를 이용하면 그런 도구 없이도 통신을 거의 안 늘리고 가로로 쪼갤 수 있다.**',

ideas:[
 {h:'MLP: 첫 행렬은 열로, 둘째 행렬은 행으로 쪼갠다',
  lead:'열 분할 뒤 GeLU, 행 분할 뒤 합산 순서로 통신을 한 번으로 줄인다.',
  d:'FFN은 `Y = GeLU(X A)`, `Z = Y B` 두 개의 행렬곱이다. $A$ 를 **열 방향**으로 $[A_1, A_2]$ 로 쪼개면 $XA_1$, $XA_2$ 를 각 GPU가 독립적으로 계산할 수 있고, GeLU가 원소별 함수이므로 **중간에 통신이 전혀 필요 없다**. 이어서 $B$ 를 **행 방향**으로 쪼개면 각 GPU가 $Y_i B_i$ 를 만들고 이들을 더하기만 하면 된다. 즉 MLP 전체에 all-reduce가 **딱 한 번**. 순서를 반대로(행 먼저) 하면 GeLU 앞에서 동기화가 필요해져 통신이 두 배가 된다 — 이 순서가 논문의 핵심이다.'},
 {h:'Self-attention: head 단위로 자연스럽게 갈린다',
  lead:'head가 이미 독립 연산이라 head 단위로 GPU에 나누면 그만이다.',
  d:'multi-head attention은 이미 head별로 독립적인 연산이다. $W_Q, W_K, W_V$ 를 열 방향으로 쪼개 head들을 GPU에 배분하면 각 GPU가 자기 head의 attention을 통째로 수행한다. 출력 투영 $W_O$ 는 행 방향으로 쪼개서 결과를 더한다. 여기도 all-reduce **한 번**. 구조가 병렬화에 이미 맞춰져 있었던 셈이다.'},
 {h:'통신은 f / g 두 개의 conjugate 연산으로 추상화된다',
  d:'구현은 identity와 all-reduce를 forward/backward에서 뒤집은 한 쌍의 연산자로 끝난다. $f$ 는 forward에서 identity, backward에서 all-reduce. $g$ 는 그 반대. transformer 블록 하나당 forward 2회 + backward 2회, 총 **4번의 all-reduce**가 전부다. 옵티마이저도, 스케줄러도 손댈 필요가 없다.',
  lead:'forward/backward에서 identity와 all-reduce를 뒤집는 연산자 쌍으로 구현한다.'},
 {h:'노드 안에서만 쓴다 — 텐서 병렬의 사용 규칙',
  lead:'레이어마다 통신이 있어 텐서 병렬은 NVLink로 묶인 노드 안에서만 쓴다.',
  d:'레이어마다 all-reduce가 들어가므로 텐서 병렬은 대역폭에 극도로 민감하다. 실무 규칙은 **텐서 병렬 차수 ≤ 노드 내 GPU 수**(NVLink로 묶인 8장)이고, 그 이상의 확장은 파이프라인 병렬이나 [ZeRO](#/p/zero) 데이터 병렬로 처리한다. 논문의 8.3B 실험도 8-way 텐서 병렬 × 64-way 데이터 병렬 = 512 GPU 구성이다.'},
 {h:'LayerNorm 위치와 vocab 병렬',
  lead:'post-LN을 pre-LN으로 바꾸고 vocab 차원도 쪼개 logit을 분산 계산한다.',
  d:'논문은 부수적으로 두 가지를 정리했다. 하나는 깊은 모델에서 post-LN이 발산해 **pre-LN**([layer normalization](#/p/layernorm)을 sublayer 앞으로)으로 바꿔야 했다는 것. 다른 하나는 출력 임베딩(vocab × hidden)도 vocab 차원으로 쪼개고, cross-entropy를 분산 계산해 $b \\times s \\times v$ 크기의 logit 텐서를 통째로 모으지 않는 것이다. 어휘가 커질수록 이 최적화의 비중이 커진다.'}
],

diagram:{type:'flow', cap:'transformer 블록 하나의 텐서 병렬 분할. 열 → 행 순서 덕분에 GeLU와 softmax 사이에는 통신이 없다.',
 nodes:[
  {t:'입력 X', s:'모든 GPU가 동일 사본'},
  {t:'QKV 열 분할', s:'head를 GPU에 배분', acc:true},
  {t:'head-attention', s:'통신 없음'},
  {t:'W_O 행 분할', s:'부분합 생성'},
  {t:'all-reduce (g)', s:'블록당 forward 1회'},
  {t:'MLP 열→행 분할', s:'A:열 GeLU B:행'}
 ]},

math:[
 {expr:'Y = GeLU(X [A₁ A₂]) = [GeLU(XA₁)  GeLU(XA₂)]',
  tex:'Y = \\mathrm{GeLU}(X[A_1\\ A_2]) = [\\mathrm{GeLU}(XA_1)\\ \\ \\mathrm{GeLU}(XA_2)]',
  d:'열 분할이 GeLU와 교환된다는 것이 전부다. 비선형이 원소별이므로 쪼갠 상태 그대로 통과시킬 수 있고, 따라서 여기서 동기화할 이유가 없다.'},
 {expr:'Z = Y B = [Y₁ Y₂] [B₁ ; B₂] = Y₁B₁ + Y₂B₂  →  all-reduce',
  tex:'Z = YB = [Y_1\\ Y_2]\\begin{bmatrix}B_1\\\\ B_2\\end{bmatrix} = Y_1B_1 + Y_2B_2\\ \\to\\ \\text{all-reduce}',
  d:'앞에서 열로 쪼갠 출력이 이번엔 행 분할 입력에 그대로 맞아떨어진다. 각 GPU가 부분합을 만들고 한 번 더하면 끝. 이 열→행 페어링이 MLP 통신을 1회로 압축한다.'}
],

numbers:[
 {k:'최대 모델', v:'8.3B 파라미터', d:'72층 · hidden 3072 · head 32. 당시 최대 규모'},
 {k:'구성', v:'512 GPU (8-way TP × 64-way DP)', d:'V100 32GB. 텐서 병렬은 노드 안에서만'},
 {k:'전체 처리량', v:'15.1 PetaFLOPs', d:'단일 GPU 기준 대비 **76% 스케일링 효율**'},
 {k:'단일 GPU 베이스라인', v:'39 TeraFLOPs', d:'1.2B 모델 기준, V100 피크의 약 30%'},
 {k:'WikiText103 perplexity', v:'10.8', d:'이전 SOTA 15.8'},
 {k:'LAMBADA 정확도', v:'66.5%', d:'이전 SOTA 63.2%'},
 {k:'블록당 통신', v:'all-reduce 4회', d:'forward 2 + backward 2 — 레이어당 고정'}
],

figures:[
 {f:'fig3-tensor-parallel-split.png',
  cap:'(a) MLP는 첫 GEMM의 가중치 A를 열(column) 방향으로 A1·A2 두 GPU에 나눠 GeLU까지 각자 계산하고, 두 번째 GEMM의 가중치 B는 행(row) 방향으로 잘라 두어 GPU 출력을 더하기만 하면(g, all-reduce) 합쳐지게 만든다. (b) Self-Attention은 애초에 head 단위로 Q·K·V가 나뉘므로 각 GPU가 자기 head를 통째로 계산하고 출력만 all-reduce한다. 두 경우 모두 f/g 두 지점에서만 통신이 일어나고 중간 계산은 GPU끼리 서로 기다리지 않는다.',
  src:'원문 Figure 3, p.4'}
],

quotes:[
 {t:'We present our techniques for training very large transformer models and implement a simple, efficient intra-layer model parallel approach that enables training transformer models with billions of parameters.',
  src:'Abstract, p.1'}
],

impact:'텐서 병렬은 이 논문 이후 사실상 **NVIDIA의 분할 방식 그대로** 업계 표준이 됐다. 코드 수정 비용이 낮다는 점이 결정적이었다 — 새 프레임워크로 이주하지 않고 선형 레이어 클래스만 `ColumnParallelLinear` / `RowParallelLinear`로 교체하면 됐기 때문이다. 이후 Megatron-LM은 파이프라인 병렬과 [ZeRO](#/p/zero) 데이터 병렬을 함께 다루는 **3D 병렬** 프레임워크로 확장되어(2021년 후속 논문에서 3072장의 A100으로 1조 파라미터 규모 학습을 측정) [PaLM](#/p/palm)·[GPT-3](#/p/gpt3)급 학습의 실질적 레퍼런스가 되었다. 오늘날 대형 모델 학습 코드에서 `tp_size`, `pp_size`, `dp_size` 세 숫자를 고르는 관행이 여기서 시작됐다.',

legacy:[
 '**3D 병렬 레시피** — 텐서(노드 안) × 파이프라인(노드 간) × 데이터([ZeRO](#/p/zero))의 조합이 100B+ 학습의 정석으로 굳어짐',
 '**Megatron-DeepSpeed** — NVIDIA의 텐서 병렬과 Microsoft의 ZeRO를 합친 스택이 BLOOM 등 대규모 오픈 모델 학습에 사용',
 '**추론으로의 이식** — 텐서 병렬은 그대로 서빙에도 쓰인다. [vLLM](#/p/vllm)을 비롯한 추론 엔진의 다중 GPU 모드가 이 분할 방식을 그대로 채택',
 '**[MoE](#/p/switch)와의 결합** — expert 병렬이 네 번째 축으로 추가되면서 [Mixtral](#/p/mixtral)·[DeepSeek-V3](#/p/deepseek-v3) 같은 희소 모델의 학습 구성이 만들어짐'
],

pitfalls:[
 '**텐서 병렬 차수를 노드 밖으로 넘기지 마라.** 레이어마다 all-reduce가 있으므로, NVLink(수백 GB/s)를 벗어나 InfiniBand·이더넷으로 넘어가는 순간 통신이 계산을 압도한다. TP=16을 두 노드에 걸쳐 쓰는 구성은 거의 항상 잘못된 선택이다.',
 '**텐서 병렬은 활성값을 줄이지만 완전히 나누지는 않는다.** all-reduce 지점의 입출력 텐서는 각 GPU에 전체 크기로 존재한다. 이 중복까지 없애려면 sequence parallelism 같은 추가 기법이 필요하며, 이는 후속 연구에서 다뤄졌다.',
 '**작은 모델에 켜면 손해다.** GPU 한 장에 들어가는 모델에 TP를 걸면 통신 오버헤드만 추가된다. 우선순위는 (1) [ZeRO](#/p/zero) stage 2 → (2) 그래도 안 들어가면 노드 내 텐서 병렬 → (3) 그래도 안 되면 파이프라인 병렬 순이다.'
],

links:[
 {t:'arXiv 1909.08053 — Megatron-LM', u:'https://arxiv.org/abs/1909.08053'},
 {t:'arXiv 2104.04473 — Efficient Large-Scale LM Training on GPU Clusters (3D 병렬)', u:'https://arxiv.org/abs/2104.04473'},
 {t:'NVIDIA/Megatron-LM (GitHub)', u:'https://github.com/NVIDIA/Megatron-LM'}
]
});
