WIKI.paper({
slug:'jet-nemotron',
venue:'arXiv 2025 (NVIDIA)',
authors:'Yuxian Gu, Qinghao Hu, Shang Yang, Haocheng Xi, Junyu Chen, Song Han, Han Cai (NVIDIA)',
arxiv:'2508.15884',

tldr:'**PostNAS(Post Neural Architecture Search)**로 이미 학습된 full-attention 모델의 MLP 가중치는 동결한 채 attention 블록만 재설계하는 파이프라인. 이렇게 만든 Jet-Nemotron-2B는 Qwen3-1.7B-Base와 동등 이상의 정확도를 내면서, H100·64K 문맥·동일 하드웨어에서 최대로 밀어붙인 배치 크기 기준 생성 처리량이 47배 빠르다.',

context:'[Mamba](#/p/mamba)·[Nemotron-H](#/p/nemotron-h) 같은 하이브리드 아키텍처는 대개 **처음부터 다시 사전학습**해야 했다 — 새 구조를 검증하려면 그때마다 막대한 학습 비용이 든다는 뜻이다. 이 비용은 대형 조직 밖에서 아키텍처를 탐색하기 어렵게 만드는 진입장벽이었다. Jet-Nemotron은 질문을 바꾼다 — **이미 학습된 full-attention 모델의 지식(MLP 가중치)을 재사용하면서, attention 블록만 선형/하이브리드로 바꿔치기할 수 있는가?**',

ideas:[
 {h:'PostNAS: 사전학습된 모델의 MLP를 얼리고 attention만 재설계',
  lead:'MLP 가중치는 고정한 채 attention 블록의 배치·종류·세부 설계만 탐색해 재학습 비용을 크게 줄인다.',
  d:'기존 NAS는 아키텍처 후보마다 새로 사전학습해야 해서 비용이 막대했다. PostNAS는 이미 학습된 full-attention 모델에서 **MLP 가중치를 그대로 가져와 동결**하고, attention 관련 부분만 네 단계로 탐색한다 — 이렇게 하면 탐색 결과가 소규모 proxy 모델이 아니라 실제 최종 모델 정확도에 바로 반영된다.'},
 {h:'Full attention 배치·제거: super network로 "어디에 남길지"를 학습',
  lead:'once-for-all super network를 학습해, 몇 개의 attention 레이어를 어디에 남겨야 정확도가 최대인지 빔서치로 찾는다.',
  d:'모든 레이어를 attention 후보(EAttn·linear attention 병렬 경로)로 만든 super network를 학습한 뒤, 레이어 하나씩을 full-attention으로 바꿔가며 부분망의 정확도를 측정해 히트맵으로 시각화한다. 발견: **모든 attention 레이어가 동등하게 중요하지 않다** — MMLU에는 2개 레이어, retrieval에는 2~3개 레이어만 결정적이고, 과제마다 중요한 레이어가 다르다. 이 학습된 배치가 균등 배치보다 확실히 낫다.'},
 {h:'Linear attention 블록 선택과 JetBlock: 동적 컨볼루션을 곱한다',
  lead:'RWKV7·RetNet·Mamba2·GLA·DeltaNet·Gated DeltaNet을 같은 조건에서 비교하고, 여기에 입력 조건부 동적 컨볼루션을 더한 JetBlock을 새로 설계한다.',
  d:'비교 결과 데이터 종속 게이팅과 델타 규칙을 모두 가진 **Gated DeltaNet**이 가장 우수했다. JetBlock은 여기서 한 걸음 더 나아가, Q·K에 쓰던 정적 컨볼루션은 제거하고 V에는 입력 특징으로부터 커널 생성기가 만든 **동적 인과 컨볼루션**을 적용한다 — 정적 커널은 입력에 따라 특징 추출 패턴을 바꿀 수 없다는 한계를 겨냥한 설계다.'},
 {h:'Hardware-aware 탐색: 파라미터 수가 아니라 KV 캐시 크기가 처리량을 결정한다',
  lead:'파라미터 수를 늘려도 KV 캐시 크기를 고정하면 처리량은 거의 그대로라는 관찰에서 하이퍼파라미터를 다시 고른다.',
  d:'전통적으로 파라미터 수를 효율의 대리 지표로 썼지만, 실제 하드웨어에서는 **KV 캐시 크기가 생성 처리량을 좌우하는 더 결정적인 요인**이다. 이 관찰을 바탕으로 KV 캐시 크기를 원 설계와 맞춰 고정한 채 헤드 수·차원 같은 아키텍처 하이퍼파라미터를 그리드 탐색해, 파라미터는 더 쓰면서 처리량은 유지하고 정확도를 올린다.'}
],

diagram:{type:'flow', cap:'PostNAS 파이프라인 4단계. MLP는 처음부터 끝까지 동결된 상태로 유지된다.',
 nodes:[
  {t:'사전학습 모델', s:'MLP 동결'},
  {t:'배치·제거', s:'super network+빔서치', acc:true},
  {t:'선형블록 선택', s:'Gated DeltaNet 등 비교'},
  {t:'JetBlock 설계', s:'동적 컨볼루션'},
  {t:'HW 인지 탐색', s:'KV 캐시 크기 고정'}
 ]},

numbers:[
 {k:'생성 처리량', v:'Jet-Nemotron-2B가 Qwen3-1.7B-Base 대비 47×', d:'NVIDIA H100, 문맥 길이 64K, 모델별 최대 배치 크기로 밀어붙인 조건'},
 {k:'생성 처리량(4B)', v:'Qwen3-1.7B-Base 대비 21×', d:'같은 H100·64K 조건, 정확도는 Jet-Nemotron-4B가 더 높음'},
 {k:'256K 문맥 가속', v:'prefill 6.14× · decode 53.6×', d:'Qwen3-1.7B-Base 대비, H100 기준(Figure 6) — 문맥이 길수록 격차 확대'},
 {k:'MMLU 개선(PostNAS 단계별)', v:'52.8 → 55.8 → 55.6 → 56.3 → 58.1', d:'baseline→attn배치→선형블록선택→JetBlock→HW탐색 누적 적용(Figure 3)'},
 {k:'attention 레이어 수', v:'critical layer 소수(MMLU 2개, retrieval 2~3개)', d:'과제마다 다른 레이어가 중요, 균등 배치보다 학습된 배치가 우수'},
 {k:'JetBlock 학습/추론 처리량', v:'233 / 2,885 (token/s)', d:'Gated DeltaNet(247/2,980) 대비 소폭의 오버헤드로 MMLU·Math·Retrieval·Commonsense 전 지표에서 우위(Table 1)'}
],

impact:'PostNAS는 "새 아키텍처를 검증하려면 처음부터 사전학습해야 한다"는 하이브리드 아키텍처 연구의 진입장벽을 낮췄다. 이미 학습된 모델의 MLP를 재사용하는 전략 덕분에, 탐색 결과가 소규모 proxy가 아니라 최종 크기 모델의 실제 정확도에 바로 대응한다는 점이 핵심이다. "KV 캐시 크기가 파라미터 수보다 처리량을 더 잘 설명한다"는 관찰은 효율적 LM 설계에서 무엇을 최적화해야 하는지에 대한 관행을 바꿨다.',

legacy:[
 '[Nemotron-H](#/p/nemotron-h)류의 "레이어 일부만 attention" 설계를 재학습 없이 탐색하는 방법으로 확장 — 같은 NVIDIA 팀의 후속',
 'KV 캐시 크기를 효율의 1차 지표로 삼는 관점이 이후 하이브리드·선형 attention 설계의 평가 기준으로 자리잡음',
 'JetBlock의 "V에만 동적 컨볼루션" 설계가 선형 attention에 컨볼루션을 결합하는 다른 시도들과 비교되는 참조점이 됨',
 'once-for-all super network로 attention 배치를 학습하는 방식이, 이후 아키텍처 탐색에서 "균등 배치"를 대체하는 기본 관행으로 인용됨'
],

pitfalls:[
 '**47배라는 수치는 H100 GPU·문맥 길이 64K·모델별로 최적화된 최대 배치 크기라는 조건에서 나온 것이다.** 다른 하드웨어, 짧은 문맥, 작은 배치에서는 이 배수가 훨씬 작다 — 실제로 짧은 문맥(4K·8K)에서 prefill 가속은 1.14~1.15배에 불과하다.',
 '**"MLP를 얼린다"는 전략은 처음부터 학습하는 것보다 최적이 아닐 수 있음을 저자들도 인정한다.** 처음부터 학습했을 때 최고 성능이 나온다는 보장은 없고, 효율-정확도 트레이드오프에서 실용적 이득을 얻는 전략이다.',
 '**비교 대상은 어디까지나 특정 시점의 오픈소스 full-attention 모델(Qwen2.5/3, Gemma3, Llama3.2)이다.** 다른 계열·다른 학습 데이터의 모델에 PostNAS를 적용했을 때 같은 배수의 이득이 나온다는 보장은 없다.'
],

figures:[
 {f:'fig2-postnas-roadmap.png',
  cap:'왼쪽 사전학습 full-attention 모델(거북이 = 느림)에서 MLP를 동결한 채 attention 배치(#1)→선형블록 선택(#2)→JetBlock 설계(#3)→하드웨어 인지 탐색(#4)을 거쳐 Jet-Nemotron(로켓 = 빠름)이 나온다.',
  src:'원문 Figure 2, p.2'},
 {f:'fig3-accuracy-breakdown.png',
  cap:'PostNAS 4단계를 순서대로 누적 적용할 때 MMLU·Math·Retrieval·Commonsense 정확도가 모두 단조 증가한다 — 흰색(baseline)에서 빨강(전체 적용)까지.',
  src:'원문 Figure 3, p.3'}
],

quotes:[
 {t:'PostNAS begins with a pre-trained full-attention model and freezes its MLP weights, allowing efficient exploration of attention block designs.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2508.15884 — Jet-Nemotron: Efficient Language Model with Post Neural Architecture Search', u:'https://arxiv.org/abs/2508.15884'},
 {t:'GitHub — NVlabs/Jet-Nemotron', u:'https://github.com/NVlabs/Jet-Nemotron'}
]
});
