WIKI.paper({
slug:'nemotron-h',
venue:'Technical Report 2025 (NVIDIA)',
authors:'NVIDIA (Waleffe, Byeon, Riach, Norick et al.)',
arxiv:'2504.03624',

tldr:'self-attention 레이어의 **대부분**(약 92%)을 [Mamba-2](#/p/mamba2) 블록으로 교체하고, 나머지 소수(8B 모델 4개, 56B 모델 10개)만 attention으로 남긴 8B/56B/47B 하이브리드 모델군. 같은 크기의 Transformer(Qwen-2.5, Llama-3.1)와 동등 이상의 정확도를 유지하면서 긴 문맥·큰 배치 조건에서 추론 처리량이 최대 몇 배 빨라졌다.',

context:'추론 시점에 더 많은 토큰을 생성해 답을 개선하는 reasoning 모델이 대두하면서, [self-attention](#/p/transformer)의 시퀀스 길이에 비례하는 계산량과 KV 캐시가 모델 지능 자체의 병목이 될 수 있다는 문제의식이 커졌다. [Mamba](#/p/mamba)·[Mamba-2](#/p/mamba2)는 토큰당 상수 계산·상수 메모리를 제공하지만, 순수 SSM만으로 Transformer급 범용 정확도를 낼 수 있는지는 불확실했다. Nemotron-H는 앞선 경험적 연구([Waleffe et al. 2024](#/p/mamba2))가 제안한 "대부분을 Mamba로, 소수만 attention으로" 비율을 8B·56B 규모에서 최대 20조 토큰까지 실증한다.',

ideas:[
 {h:'레이어의 약 8%만 self-attention으로 남긴다',
  lead:'전체 레이어 중 self-attention은 8B에서 4개(52개 중), 56B에서 10개(118개 중)뿐이다.',
  d:'나머지는 Mamba-2와 FFN이 번갈아 쌓인 블록이다. 모델의 첫 레이어는 항상 Mamba-2, 마지막 레이어는 항상 FFN이고, attention 레이어는 등간격으로 분산 배치되며 항상 바로 다음에 FFN이 온다 — 표준 Transformer 블록의 attention→FFN 순서를 그대로 따른다. 이 8% 비율 자체는 새로 도출한 것이 아니라 선행 경험적 연구의 권고를 그대로 따른 것이다.'},
 {h:'왜 전부 Mamba로 가지 않는가: 소수의 attention을 남기는 이유',
  lead:'순수 SSM은 상태 크기가 고정돼 있어 정밀한 문맥 검색이 필요한 태스크에서 손해를 본다는 것이 하이브리드 설계의 전제다.',
  d:'Mamba-2 레이어는 토큰당 상수 크기의 recurrent state만 유지하므로, 과거 특정 토큰을 정확히 복사·검색해야 하는 연산에서 구조적으로 불리하다. self-attention은 KV 캐시 전체를 보존해 이런 연산에 강하다. Nemotron-H는 이 둘을 8:92 비율 정도로 섞어, **대부분의 계산은 Mamba-2의 상수 비용으로 처리하고 정밀 검색이 필요한 소수의 연산만 attention에 맡기는** 절충을 택했다.'},
 {h:'FP8 사전학습: 텐서 단위 current scaling',
  lead:'텐서 전체를 하나의 스케일로 FP8 양자화하되 처음·끝 4개 GEMM만 BF16으로 남긴다.',
  d:'56B 모델은 Nemotron 계열 최초로 FP8만으로 전체 사전학습을 마쳤다. 텐서의 최댓값을 보존하도록 스케일 하나를 정하고 그보다 작은 값은 0으로 버리는 coarse-grained 방식이며, 학습 안정성을 위해 모델의 첫·마지막 4개 GEMM은 BF16으로 남겼다. 8B 모델의 소규모 ablation(최대 15조 토큰)에서 FP8이 BF16과 동등하거나 더 나은 다운스트림 정확도를 냈다.'},
 {h:'MiniPuzzle: 가지치기+증류로 56B를 47B로 압축',
  lead:'레이어·FFN 중요도를 측정해 가지치고, 63B 토큰만으로 증류해 56B와 동등한 정확도의 47B를 만든다.',
  d:'Minitron의 단순함과 Puzzle의 유연성을 결합한 압축 파이프라인으로, 레이어와 FFN 각각의 중요도 점수를 측정한 뒤(제거했을 때 전체 모델과의 MSE) 메모리·지연시간 제약에 맞는 후보를 탐색한다. 이렇게 만든 Nemotron-H-47B-Base는 63B 토큰의 FP8 증류만으로 56B와 비슷한 정확도를 내면서 20% 더 빠르다.'}
],

diagram:{type:'stack', cap:'Nemotron-H-8B 블록 구성. Mamba-2·FFN이 반복되는 사이에 attention이 드문드문 끼어든다(전체 52층 중 4층).',
 layers:[
  {t:'Mamba-2 + FFN', s:'x3, 입력 쪽'},
  {t:'혼합 블록', s:'Mamba-2+Attn+FFN x4', acc:true, note:'attention은 8%뿐'},
  {t:'Mamba-2 + FFN', s:'x1, 출력 쪽'}
 ]},

numbers:[
 {k:'모델 구성', v:'8B(52층·attn 4개) / 56B(118층·attn 10개) / 47B', d:'attention 비율 약 8%, 균등 분산 배치'},
 {k:'사전학습 규모', v:'최대 20조 토큰', d:'56B는 FP8로 전체 사전학습한 최초의 Nemotron 모델'},
 {k:'정확도 비교', v:'56B가 17개 과제 중 16개에서 Llama-3.1-70B 상회', d:'유사 크기 오픈소스 Transformer(Qwen-2.5, Llama-3.1) 대비'},
 {k:'추론 처리량(56B, H100)', v:'Qwen-2.5-72B·Llama-3.1-70B 대비 2.4×, Llama-3.1-405B 대비 19.6×', d:'입력 65536 토큰·출력 1024 토큰, GPU당 초당 출력 토큰 수 기준(Figure 7)'},
 {k:'추론 처리량(8B, H100)', v:'Qwen-2.5-7B 대비 1.8×, Llama-3.1-8B 대비 3×', d:'같은 긴 문맥(65536 입력) 조건'},
 {k:'MiniPuzzle 압축', v:'63B 토큰 증류로 56B→47B, 정확도 유지·20% 가속', d:'FP4로 RTX 5090(32GiB) 1장에 배치 가능'}
],

impact:'Nemotron-H는 "대부분을 Mamba로 바꾸고 소수만 attention으로 남긴다"는 설계를 8B~56B 규모, 최대 20조 토큰까지 실측으로 검증해, 하이브리드 아키텍처가 실험실 스케일을 넘어 실제 대형 오픈소스 모델의 표준 옵션이 될 수 있음을 보였다. FP8 사전학습 레시피와 MiniPuzzle 압축 기법은 하이브리드 모델을 만들고 다양한 배포 조건에 맞게 줄이는 재사용 가능한 엔지니어링 스택을 제공했다.',

legacy:[
 '레이어의 소수만 attention으로 남기는 비율(약 8%)이 이후 하이브리드 아키텍처의 기본 참조값으로 인용됨',
 '[Jet-Nemotron](#/p/jet-nemotron)이 같은 NVIDIA 팀에서 이 하이브리드 레이아웃을 재학습 없이 탐색하는 PostNAS로 발전',
 'MiniPuzzle이 하이브리드 모델 전용 가지치기·증류 파이프라인의 선례가 됨 — attention/Mamba-2/FFN 각 레이어를 개별적으로 가지치기할 수 있다는 것을 보임',
 'FP8 per-tensor current scaling 레시피가 이후 대형 하이브리드 모델의 저정밀도 학습 참조 사례로 인용됨'
],

pitfalls:[
 '**"3배 빠르다"는 수치는 조건부다.** 입력 65536 토큰·출력 1024 토큰, H100 GPU, 최대 배치 크기로 처리량을 최대화한 조건에서 나온 숫자다 — 짧은 문맥이나 낮은 배치에서는 Mamba-2의 이점이 줄어든다.',
 '**8% attention 비율은 이 논문이 새로 도출한 값이 아니라 선행 연구(Waleffe et al. 2024)의 권고를 따른 것이다.** 이 논문 자체는 그 비율의 최적성을 재검증하는 별도 ablation을 크게 강조하지 않는다.',
 '**FP8 학습은 처음·마지막 4개 GEMM을 BF16으로 남겨야 안정적이다.** 전체를 FP8로 밀어붙이면 학습이 불안정해질 수 있다는 뜻으로, "완전 FP8"이 아니다.'
],

figures:[
 {f:'fig2-hybrid-layout.png',
  cap:'8B(위)·56B(아래) 모델의 레이어 배치. 처음/끝의 Mamba-2+FFN 블록 사이에 "Mamba-2→Attention→FFN"이 반복되는 블록이 끼어 있다 — attention(빨강)은 이 반복 블록 안에 하나씩만, 전체로 보면 소수다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'We show that Nemotron-H models offer either better or on-par accuracy compared to other similarly-sized state-of-the-art open-sourced Transformer models, while being up to 3× faster at inference.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2504.03624 — Nemotron-H: A Family of Accurate and Efficient Hybrid Mamba-Transformer Models', u:'https://arxiv.org/abs/2504.03624'},
 {t:'Hugging Face — nvidia/Nemotron-H-56B-Base', u:'https://huggingface.co/nvidia/Nemotron-H-56B-Base-8K'}
]
});
