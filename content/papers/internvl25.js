WIKI.paper({
slug:'internvl25',
venue:'arXiv 2024 (Technical Report)',
authors:'Chen, Wang, Cao et al. (Shanghai AI Laboratory · SenseTime · Tsinghua · CUHK 등)',
arxiv:'2412.05271',

tldr:'[InternVL](#/p/internvl)의 ViT-MLP-LLM 구조는 그대로 두고, **큰 비전 인코더가 학습 데이터 의존도를 줄인다**는 관찰과 **엄격한 데이터 필터링**, 그리고 **CoT + 다수결 투표로 여는 테스트타임 스케일링**을 더해 오픈소스 최초로 MMMU 70%를 넘겼다.',

context:'[InternVL](#/p/internvl) 계열과 [Qwen-VL](#/p/qwen-vl) 계열은 오픈소스 MLLM의 성능을 끌어올렸지만 GPT-4o·Claude-3.5-Sonnet 같은 폐쇄형 모델과는 여전히 격차가 있었다. 저자들은 이 격차를 메우는 방법을 아키텍처 재설계가 아니라 **스케일링 축을 체계적으로 통제하는 실험**에서 찾는다 — 비전 인코더 크기, 언어모델 크기, 데이터셋 크기, 추론 시 연산량(test-time compute)이 각각 성능에 어떻게 기여하는지를 갈라서 본다. 특히 오픈소스 MLLM 다수가 **CoT를 쓰면 오히려 성능이 떨어지는** 현상이 알려져 있었는데, 이 논문은 그 원인을 파인튜닝 데이터의 반복 패턴 같은 이상치로 지목한다.',

ideas:[
 {h:'큰 비전 인코더가 학습 데이터 의존도를 줄인다',
  lead:'6B 비전 인코더를 쓰면 600M급 인코더보다 훨씬 적은 토큰으로 같은 성능에 도달한다.',
  d:'InternViT-6B를 쓴 InternVL2.5-78B는 [Qwen2-VL](#/p/qwen2-vl)-72B(약 600M 비전 인코더)가 1.4조 토큰을 쓴 것과 달리 약 1200억 토큰만으로 비슷하거나 더 나은 성능에 도달했다. 결론은 "비전 인코더가 크면 사전학습 데이터 탐색 비용이 줄어든다"는 것 — 모델을 스케일업할 때 데이터보다 인코더 크기를 먼저 키우는 것이 비용 효율적일 수 있다는 실험적 근거다.'},
 {h:'데이터 품질 필터링: 반복 패턴이 CoT를 망가뜨린다',
  lead:'파인튜닝 데이터의 반복적·이상치 샘플을 걸러내면 CoT 추론 성능이 크게 개선된다.',
  d:'InternVL 2.0에서 2.5로 오며 데이터셋 크기를 두 배로 늘렸지만, 동시에 LLM 기반 품질 점수·반복 탐지·휴리스틱 규칙 필터링 세 단계 파이프라인(Figure 8)으로 이상 샘플을 걸러냈다. 특히 텍스트가 반복되는 패턴의 샘플이 모델을 장문 생성이나 CoT 추론에서 루프에 빠뜨리는 주범으로 지목되며, 이를 제거한 뒤 MMMU·OlympiadBench 같은 어려운 벤치마크에서 개선이 뚜렷했다.'},
 {h:'테스트타임 스케일링: CoT + 다수결 투표',
  lead:'같은 문제를 CoT로 여러 번 풀고 다수결로 답을 고르면 어려운 문제에서 추가 이득이 난다.',
  d:'MMMU 같은 어려운 멀티모달 QA에서 InternVL2.5-78B는 CoT 추론을 쓰면 직접 답변보다 3.7점 높은 70.1%를 기록한다. 여기에 다수결 투표(여러 CoT 샘플 중 가장 많이 나온 답 채택)를 결합하면 추가로 점수가 오르는 것을 확인했다 — 학습을 더 하지 않고 추론 시 연산을 늘리는 것만으로 성능이 오르는 경로를 오픈소스 MLLM에서 처음 체계적으로 보였다.'},
 {h:'ViT-MLP-LLM 구조와 dynamic high resolution은 유지',
  lead:'구조 혁신 없이 InternViT-6B/300M + MLP + LLM 조합을 그대로 쓴다.',
  d:'아키텍처는 [InternVL](#/p/internvl) 1.5/2.0과 동일한 "ViT-MLP-LLM" 패러다임을 유지한다. 이미지는 448×448 타일로 잘라 dynamic resolution으로 처리하고, pixel unshuffle로 타일당 1024개 비주얼 토큰을 256개로 압축한다. 즉 이 논문의 기여는 새 블록이 아니라 **스케일링 축의 조합**이다.'},
 {h:'다양한 LLM 백본에 동일 비전 인코더를 붙여 비교',
  lead:'InternLM2.5·Qwen2.5 등 여러 LLM에 같은 InternViT를 붙여 스케일링 곡선을 그린다.',
  d:'1B부터 78B까지 여러 크기의 모델을 InternLM2.5 또는 Qwen2.5 LLM과 InternViT-300M/6B 조합으로 만들어, 모델 크기·벤치마크 점수 간 관계를 OpenCompass 리더보드 기준으로 체계적으로 제시한다(Figure 1).'}
],

diagram:{type:'flow', cap:'InternVL 2.5의 데이터 전처리(왼쪽)와 ViT-MLP-LLM 추론 경로(오른쪽).',
 nodes:[
  {t:'입력 이미지', s:'800×1300 등'},
  {t:'448×448 타일링', s:'비율에 맞춰 분할', a:'동적 해상도'},
  {t:'InternViT', s:'300M/6B, 타일당 1024토큰'},
  {t:'토큰 압축', s:'1024→256 (unshuffle)', acc:true},
  {t:'MLP Projector', s:'2층'},
  {t:'LLM 디코더', s:'InternLM2.5/Qwen2.5'}
 ]},

numbers:[
 {k:'MMMU (val), 78B + CoT', v:'70.1%', d:'오픈소스 최초 70% 돌파, 직접 답변보다 +3.7점'},
 {k:'사전학습 토큰, 78B', v:'약 120B', d:'비교 대상 Qwen2-VL-72B의 1.4T 대비 약 1/10'},
 {k:'MMMU 개선폭 (78B vs 이전 InternVL2-Llama3-76B)', v:'+7.4점', d:'62.7 → 70.1 이상으로 향상'},
 {k:'비전 인코더', v:'InternViT-6B (5.9B) / 300M', d:'448×448 타일 입력, dynamic high resolution'},
 {k:'모델 크기 범위', v:'1B ~ 78B', d:'동일 InternViT를 여러 LLM 크기에 결합해 스케일링 곡선 확보'}
],

impact:'InternVL 2.5는 "더 큰 비전 인코더가 데이터 효율을 개선한다"는 관찰과 "테스트타임 연산을 늘리는 것도 스케일링 축"이라는 관찰을 오픈소스 MLLM에서 정량적으로 보여줬다. MMMU 70% 돌파는 오픈 웨이트 모델이 GPT-4o급 벤치마크 성능에 근접했다는 상징적 이정표로 인용됐고, 데이터 필터링 파이프라인은 이후 MLLM 파인튜닝 데이터 정제의 참고 사례가 됐다. CoT+다수결 투표 조합은 이후 오픈소스 VLM 리포트에서 테스트타임 스케일링을 별도 절로 다루는 관행을 확산시켰다.',

legacy:[
 '**비전 인코더 크기 vs 데이터 효율** — 이후 오픈 VLM 리포트들이 인코더 크기를 데이터량과 함께 스케일링 변수로 명시적으로 보고하기 시작',
 '**데이터 필터링 파이프라인 공개** — 반복 패턴 탐지·LLM 품질 스코어링 조합이 후속 MLLM 데이터 큐레이션의 참조 레시피가 됨',
 '**테스트타임 스케일링의 정착** — CoT+다수결 투표가 학습 없이 성능을 올리는 표준 옵션으로 오픈소스 MLLM 벤치마크 보고에 편입',
 '**InternVL 시리즈의 지속** — 이후 InternVL3 등에서 같은 ViT-MLP-LLM 골격에 native multimodal pretraining 등을 추가로 얹음'
],

pitfalls:[
 '**"CoT는 항상 성능을 올린다"는 오해다.** 논문 스스로 대부분의 기존 오픈소스 MLLM은 CoT를 쓰면 오히려 성능이 떨어진다고 지적하며, 이는 InternVL 2.5가 특별히 데이터 필터링으로 해결한 문제다.',
 '**"1/10 토큰으로 동급 성능"은 특정 비교(Qwen2-VL-72B vs InternVL2.5-78B)에 한정된 수치다.** 두 모델은 파라미터 수·비전 인코더 크기·학습 레시피가 모두 달라 토큰 수만으로 효율을 일반화하면 안 된다.',
 '**아키텍처 자체는 새롭지 않다.** ViT-MLP-LLM과 dynamic resolution은 [InternVL](#/p/internvl) 1.5/2.0에서 이미 쓰던 것이고, 이 논문의 기여는 스케일링 실험과 데이터·테스트타임 절차다.'
],

figures:[
 {f:'fig-arch.png', cap:'왼쪽(a)은 입력 이미지를 미리 정의된 비율표에 맞춰 448×448 타일+썸네일로 나누는 전처리, 오른쪽(b)은 InternViT → Pixel Unshuffle(1024→256토큰) → MLP Projector → LLM으로 이어지는 경로. 불꽃 아이콘이 학습되는 모듈(InternViT, MLP Projector, LLM)을 표시한다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'It is the first open-source MLLM to surpass 70% on the MMMU validation set, setting a new benchmark and highlighting the potential of open-source solutions in advancing multimodal AI.',
  src:'Introduction, p.3'}
],

links:[
 {t:'arXiv 2412.05271 — InternVL 2.5', u:'https://arxiv.org/abs/2412.05271'},
 {t:'GitHub — OpenGVLab/InternVL', u:'https://github.com/OpenGVLab/InternVL'}
]
});
