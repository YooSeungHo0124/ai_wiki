WIKI.paper({
slug:'flashattention2',
venue:'arXiv 2023 (Princeton · Stanford)',
authors:'Tri Dao',
arxiv:'2307.08691',

tldr:'[FlashAttention](#/p/flashattention)의 알고리즘은 그대로 두고 **GPU 작업 배분만** 다시 짜서 이론 최대 FLOPs 대비 활용률을 25-40%에서 50-73%까지 끌어올린 논문. 커널을 다시 발명한 게 아니라 스레드블록·warp에 일을 나누는 방식을 고쳤을 뿐이다.',

context:'[FlashAttention](#/p/flashattention)은 타일링과 온라인 softmax로 $O(n^2)$ 메모리를 $O(n)$ 으로 줄이고 표준 구현보다 2-4배 빠르게 만들었다. 하지만 저자가 직접 프로파일링해 보니 forward pass가 A100 이론 최대 FLOPs/s의 30-50%, backward는 25-35%밖에 못 썼다. 반면 잘 최적화된 GEMM(단순 행렬곱)은 80-90%에 도달한다. 즉 알고리즘의 연산량 자체는 이미 최적에 가까운데, 그 연산을 스레드블록과 warp에 나누는 방식이 서툴러서 GPU를 놀리고 있었다. 이 논문의 질문은 "같은 알고리즘으로 GEMM에 가까운 효율을 낼 수 있는가"이다.',

ideas:[
 {h:'non-matmul FLOP 줄이기',
  lead:'행렬곱이 아닌 연산(재척도)을 최대한 뒤로 미뤄 매 스텝의 나눗셈을 없앤다.',
  d:'A100의 Tensor Core는 FP16 matmul을 312 TFLOPs/s로 처리하지만 non-matmul 연산(지수·나눗셈)은 19.5 TFLOPs/s에 그친다. **matmul이 아닌 FLOP 하나가 matmul FLOP보다 16배 비싸다.** 기존 FlashAttention은 온라인 softmax의 각 블록마다 누적 출력을 `diag(ℓ)⁻¹`로 재척도했는데, FlashAttention-2는 이 재척도를 마지막 블록까지 미루고 중간에는 비정규화 값만 누적한다. 역전파도 행별 최댓값과 합을 따로 저장하던 것을 `logsumexp` 하나로 합쳐 저장량과 재계산을 줄였다.'},
 {h:'시퀀스 길이 축으로도 병렬화',
  lead:'배치·head가 적어도 시퀀스를 쪼개 thread block에 나눠 GPU 점유율을 채운다.',
  d:'기존 FlashAttention은 배치 크기 × head 수만큼만 thread block을 만들어 SM(A100에 108개)에 배정했다. 긴 시퀀스를 다루려고 배치를 줄이면 thread block 수가 SM 수보다 적어져 GPU 대부분이 논다. FlashAttention-2는 forward pass의 바깥 루프(행 블록)가 서로 독립이라는 점을 이용해 **시퀀스 길이 축도 thread block으로 쪼갠다.** backward는 열 블록 단위로 나누고 `dQ` 갱신만 atomic add로 합친다.'},
 {h:'warp 간 작업 분할: split-K를 버리고 split-Q로',
  lead:'K·V를 warp에 나누던 방식을 Q를 나누는 방식으로 바꿔 warp 간 통신을 없앤다.',
  d:'기존 FlashAttention은 한 thread block 안에서 K·V를 4개 warp에 나누는 "split-K" 방식을 썼다. 각 warp가 `QKᵀ` 조각을 계산한 뒤 `V`와 곱하려면 다른 warp의 중간 결과가 필요해, shared memory에 쓰고 동기화하고 다시 읽어야 했다. FlashAttention-2는 반대로 **Q를 4개 warp에 나누고 K·V는 모든 warp가 공유**한다. 각 warp가 자기 몫의 `QKᵀ`를 계산해 공유된 `V`와 바로 곱하면 끝나므로, warp 사이에 아무 통신도 필요 없다.'}
],

diagram:{type:'compare', cap:'FlashAttention과 FlashAttention-2의 GPU 작업 배분 차이. 알고리즘의 수학은 동일하다.',
 left:{t:'FlashAttention', items:['배치×head 수만큼만 병렬화','긴 시퀀스에서 SM 점유율 낮음','warp가 K·V를 나눠 갖는 split-K']},
 right:{t:'FlashAttention-2', items:['시퀀스 길이 축도 병렬화','non-matmul 재척도 최소화','warp가 Q를 나눠 갖는 split-Q']}},

math:[
 {expr:'각 non-matmul FLOP ≈ matmul FLOP의 16배 비용 (A100: 312 TFLOPs/s matmul vs 19.5 TFLOPs/s non-matmul)',
  tex:'\\frac{312\\ \\text{TFLOPs/s (matmul)}}{19.5\\ \\text{TFLOPs/s (non-matmul)}} \\approx 16\\times',
  d:'GPU는 Tensor Core로 행렬곱만 특별히 빠르다. softmax의 지수·나눗셈 같은 non-matmul 연산은 총 FLOP에서 차지하는 비중이 작아도 실행 시간은 훨씬 크게 잡아먹는다. 이 비대칭이 최적화의 출발점이다.'},
 {expr:'O(j) = P(j) V_j (비정규화 누적, 마지막에 한 번만 diag(ℓ)⁻¹ 적용)',
  tex:'\\mathbf{O}^{(j)} = \\mathbf{P}^{(j)}\\mathbf{V}_j,\\qquad \\mathbf{O}_{\\text{final}} = \\text{diag}(\\ell)^{-1}\\mathbf{O}^{(T_c)}',
  d:'FlashAttention은 매 블록마다 누적 출력을 재척도했지만, FlashAttention-2는 정규화 상수 `ℓ`로 나누는 연산을 루프 마지막까지 미룬다. 매 스텝 나눗셈 한 번씩을 없애는 것이 non-matmul FLOP 절감의 핵심이다.'}
],

numbers:[
 {k:'속도 향상', v:'약 2×', d:'FlashAttention 대비, 표준 attention 대비로는 **3-10×**'},
 {k:'forward 활용률', v:'50-73%', d:'A100 이론 최대 FLOPs/s 대비. FlashAttention은 25-40%'},
 {k:'backward 활용률', v:'최대 63%', d:'forward보다 여전히 낮음 — 의존성이 더 복잡해서'},
 {k:'end-to-end 학습 속도', v:'최대 225 TFLOPs/s', d:'A100 1장당 GPT 스타일 모델 학습, **모델 FLOPs 활용률 72%**'},
 {k:'H100 결과', v:'최대 335 TFLOPs/s', d:'H100 신기능(TMA·4세대 Tensor Core) 없이 같은 커널 그대로 돌린 수치'},
 {k:'non-matmul 비용비', v:'16×', d:'A100에서 non-matmul FLOP 하나가 matmul FLOP보다 16배 비쌈'}
],

impact:'FlashAttention-2는 알고리즘을 하나도 바꾸지 않고 순수하게 **GPU 작업 배분(occupancy·통신)** 만 다시 설계해서 GEMM에 근접한 효율을 냈다. 이후 이 커널이 사실상 모든 주요 프레임워크(PyTorch, vLLM, HF Transformers)의 기본 attention 구현이 되었고, 긴 컨텍스트 학습·추론의 실용적 하한선을 다시 그었다. "알고리즘의 FLOP 수"와 "실제 걸리는 시간"이 다르다는 것, 그리고 GPU 최적화가 알고리즘 설계와 별개의 축이라는 점을 이 논문이 명확히 보여줬다.',

legacy:[
 '**FlashAttention-3**가 H100의 TMA·FP8·비동기 실행까지 활용해 이 논문이 미뤄둔 "새 하드웨어 기능"을 마저 파고듦',
 '**vLLM**([vLLM](#/p/vllm))·SGLang 등 서빙 엔진이 FlashAttention-2 커널을 KV 캐시 attention의 기본값으로 채택',
 '**MQA/GQA**와의 결합이 이 논문에서부터 명시적으로 다뤄지며, 이후 대부분의 LLM이 FlashAttention 커널 + GQA 조합을 표준으로 삼음',
 '이 논문이 보여준 "occupancy 병목" 프레임은 이후 [Mamba-2](#/p/mamba2) 같은 SSM 커널 설계에도 그대로 이어짐'
],

pitfalls:[
 '**"FlashAttention-2가 새 알고리즘"이 아니다.** 수학적으로는 [FlashAttention](#/p/flashattention)과 동일한 결과($O(N^2d)$ FLOPs, $O(N)$ 메모리)를 내며, 바뀐 것은 순수하게 GPU 상의 작업 스케줄링이다.',
 '**블록 크기는 자동 튜닝이 아니라 수동 선택이다.** 논문 스스로 head 차원별로 4가지 블록 크기 조합을 수동으로 고른다고 밝히며, 오토튜닝은 후속 과제로 남겼다.',
 '**backward pass는 forward만큼 효율이 안 나온다.** `Q, K, V, O, dO, dQ, dK, dV` 사이 의존성이 더 복잡해서, split-Q로 바꿔도 backward는 forward보다 낮은 활용률(최대 63%)에 머문다.'
],

figures:[
 {f:'fig1-parallelism.png',
  cap:'왼쪽(forward): 시퀀스를 5개 블록(행)으로 나눠 Worker 1~5가 각자 자기 행 블록을 처음부터 끝까지 독립적으로 처리한다 — 서로 통신이 필요 없다. 오른쪽(backward): 이번엔 열 블록 단위로 나누고, 색이 겹치는 부분(예: Worker 5는 전체 행)이 `dQ`를 여러 worker가 함께 갱신해야 하는 지점이다.',
  src:'원문 Figure 2, p.8'},
 {f:'fig2-warp.png',
  cap:'(a) 기존 FlashAttention: K·V를 4개 warp가 나눠 갖고(주황), Q는 전체가 공유(파랑) — 각 warp가 만든 `QKᵀ` 조각을 합치려면 shared memory를 거쳐야 한다. (b) FlashAttention-2: 반대로 Q를 4개 warp가 나눠 갖고 K·V를 전체가 공유 — 각 warp가 자기 몫을 끝까지 독립적으로 계산해 warp 간 통신이 사라진다.',
  src:'원문 Figure 3, p.9'}
],

quotes:[
 {t:'We observe that the inefficiency is due to suboptimal work partitioning between different thread blocks and warps on the GPU, causing either low-occupancy or unnecessary shared memory reads/writes.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2307.08691 — FlashAttention-2', u:'https://arxiv.org/abs/2307.08691'},
 {t:'GitHub — Dao-AILab/flash-attention', u:'https://github.com/Dao-AILab/flash-attention'}
]
});
