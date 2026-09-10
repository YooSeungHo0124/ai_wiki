WIKI.paper({
slug:'instructblip',
venue:'NeurIPS 2023',
authors:'Dai, Li et al. (Salesforce Research · HKUST · NTU)',
arxiv:'2305.06500',

tldr:'[BLIP-2](#/p/blip2)의 Q-Former를 **지시문 인식형**으로 바꾸고, 26개 시각-언어 데이터셋을 instruction-tuning 형식으로 통일해 학습한 모델. 13개로 학습하고 나머지 13개로 zero-shot 평가해, 본 적 없는 데이터셋에서도 BLIP-2와 더 큰 [Flamingo](#/p/flamingo)를 넘어섰다.',

context:'[BLIP-2](#/p/blip2)는 이미지 인코더와 LLM을 모두 얼려두고 Q-Former만 학습해 시각-언어 연결 비용을 크게 줄였다. 하지만 Q-Former는 **어떤 질문이 들어올지 모른 채** 이미지 전체를 고정된 방식으로 요약했다. 반면 [Flan](#/p/flan) 계열은 언어모델을 다양한 지시문으로 학습시키면 한 번도 본 적 없는 과제에도 일반화된다는 것을 텍스트 영역에서 보였다. 이 논문은 그 instruction tuning을 시각-언어 모델로 옮기면서, 텍스트만이 아니라 **이미지에서 무엇을 뽑아낼지도 지시문에 따라 달라져야 한다**는 문제를 제기한다.',

ideas:[
 {h:'26개 데이터셋을 하나의 지시문 형식으로 통일',
  lead:'11개 과제 범주·26개 공개 데이터셋을 자연어 지시문-응답 쌍으로 변환한다.',
  d:'이미지 캡셔닝, 시각 추론, 지식 기반 VQA, 읽기 이해 VQA, 영상 QA, 시각 대화, 이미지 분류 등 11개 범주에 걸친 26개 데이터셋 각각에 과제별 10~15개의 지시문 템플릿을 수작업으로 만들었다. 장면 텍스트가 있는 데이터셋에는 OCR 토큰을 지시문에 추가로 넣는다.'},
 {h:'held-in / held-out 분할로 진짜 일반화를 측정',
  lead:'13개로 학습하고 13개는 학습 중 전혀 노출하지 않은 채 zero-shot 평가한다.',
  d:'held-out은 두 종류다 — (1) 과제 자체는 held-in에 있지만 데이터셋은 처음 보는 경우, (2) 시각 추론·영상 QA·시각 대화·이미지 분류처럼 **과제 범주 자체를 통째로** 학습에서 뺀 경우다. 같은 과제의 다른 데이터셋이 held-in 학습셋에 섞이지 않도록 데이터 오염도 별도로 관리했다.'},
 {h:'Instruction-aware Q-Former: 지시문이 시각 특징 추출에 관여',
  lead:'지시문 토큰을 Q-Former의 self-attention에도 넣어 쿼리가 지시문을 참조하게 한다.',
  d:'BLIP-2의 Q-Former는 `K`개의 학습 가능한 쿼리 임베딩이 이미지 인코더 출력과 cross-attention만으로 상호작용했다. InstructBLIP은 여기에 지시문 텍스트를 추가 입력으로 넣어, 쿼리가 self-attention을 통해 지시문을 보고 **과제와 관련된 이미지 영역**에 집중하도록 만든다. 이미지 인코더와 LLM은 여전히 얼려두고 Q-Former만 미세조정한다.'},
 {h:'제곱근 균형 샘플링으로 데이터셋 크기 불균형을 완화',
  lead:'데이터셋 크기의 제곱근에 비례해 샘플링해 큰 데이터셋 쏠림을 줄인다.',
  d:'26개 데이터셋의 크기 차이가 커서 균등 샘플링을 하면 작은 데이터셋은 과적합되고 큰 데이터셋은 덜 학습된다. 샘플링 확률을 $p_d=\\sqrt{S_d}/\\sum_i\\sqrt{S_i}$ 로 두고, 객관식 위주인 A-OKVQA는 가중치를 낮추고 개방형 생성이 필요한 OKVQA는 높이는 수동 조정을 더했다.'},
 {h:'두 계열 LLM으로 검증: FlanT5와 Vicuna',
  lead:'인코더-디코더 FlanT5와 디코더 전용 Vicuna 양쪽에 같은 레시피를 적용했다.',
  d:'FlanT5(XL 3B, XXL 11B)는 [T5](#/p/t5)를 [Flan](#/p/flan) 방식으로 지시학습한 모델이고, Vicuna(7B, 13B)는 [LLaMA](#/p/llama)를 대화 데이터로 미세조정한 디코더 전용 모델이다. 두 계열 모두에서 zero-shot 성능이 오르는 것을 보여, instruction-aware Q-Former가 LLM 종류에 의존하지 않는 개선이라는 것을 확인했다.'}
],

diagram:{type:'flow', cap:'InstructBLIP 추론 흐름. 지시문이 LLM뿐 아니라 Q-Former 쪽에도 들어가는 것이 BLIP-2와의 차이.',
 nodes:[
  {t:'이미지', s:'224×224'},
  {t:'이미지 인코더', s:'frozen'},
  {t:'Q-Former', s:'지시문도 함께 입력', acc:true, a:'K개 쿼리'},
  {t:'선형 투영', s:'soft prompt로'},
  {t:'LLM', s:'FlanT5·Vicuna, frozen'}
 ]},

math:[
 {expr:'p_d = sqrt(S_d) / Σ_i sqrt(S_i)',
  tex:'p_d = \\frac{\\sqrt{S_d}}{\\sum_{i=1}^{D}\\sqrt{S_i}}',
  d:'$D$개 데이터셋 중 크기 $S_d$ 인 데이터셋 $d$ 가 한 학습 스텝에서 뽑힐 확률. 크기에 비례가 아니라 **제곱근에 비례**시켜 큰 데이터셋의 지배력을 줄인다.'}
],

numbers:[
 {k:'데이터셋 구성', v:'26개 → held-in 13 / held-out 13', d:'11개 과제 범주, 일부는 과제 범주째로 held-out'},
 {k:'held-out(FlanT5-XL)', v:'NoCaps 119.9 CIDEr · VSR 64.8 · HM 56.6', d:'셋 다 held-out 13개 중 일부(Table 1) — 같은 크기 BLIP-2(FlanT5-XL) 대비 전 항목 상승'},
 {k:'held-out iVQA(Vicuna-7B)', v:'52.2', d:'BLIP-2(Vicuna-7B) 27.5 대비 거의 2배 — Table 1'},
 {k:'ScienceQA(이미지 문맥) 파인튜닝', v:'90.7%', d:'개별 다운스트림 과제로 미세조정했을 때 SOTA'},
 {k:'학습 파라미터', v:'1.2B → 188M', d:'다운스트림 미세조정 시 비전 인코더까지 열던 기존 방식 대비, 인코더를 계속 얼려 절감'}
],

impact:'BLIP-2 이후 "얼린 인코더 + 얼린 LLM + 작은 연결 모듈"이라는 레시피에 **지시문 자체가 시각 특징 추출에 관여해야 한다**는 조건을 더했다. held-in/held-out을 엄격히 나눈 평가 설계는 이후 시각-언어 모델이 정말 새 과제로 일반화하는지를 보여주는 표준 검증 방식이 됐다. FlanT5·Vicuna 두 백본 모두에서 재현되는 개선이라는 점이 instruction-aware Q-Former가 특정 LLM의 우연한 효과가 아님을 뒷받침한다.',

legacy:[
 '**Q-Former 계열 vision-language 어댑터**가 [BLIP-2](#/p/blip2) → InstructBLIP으로 이어지며, 이미지를 LLM의 소프트 프롬프트로 넣는 방식이 표준화됐다',
 '**시각-언어 instruction tuning**이 이후 [LLaVA](#/p/llava)·[Qwen-VL](#/p/qwen-vl) 등 대부분의 멀티모달 LLM이 학습 마지막 단계에 포함하는 절차가 됐다',
 '**held-in/held-out 평가 프로토콜**이 이후 멀티모달 벤치마크에서 "학습에 쓰인 데이터셋과 겹치지 않는 zero-shot 평가"를 요구하는 관행으로 남았다',
 '**얼린 비전 인코더로 미세조정**하는 접근(1.2B→188M)이 이후 파라미터 효율적 VLM 파인튜닝의 근거로 인용된다'
],

pitfalls:[
 '**held-out 수치와 held-in 수치를 섞으면 안 된다.** 논문의 대표 성능(Table 1, 예: NoCaps 119.9)은 전부 **held-out zero-shot** 값이고, held-in 평가는 별도 표에 있다 — 둘 다 "InstructBLIP 성능"으로 뭉뚱그리면 zero-shot 일반화라는 핵심 주장이 왜곡된다.',
 '**이미지 인코더와 LLM은 끝까지 얼려있다.** 학습되는 것은 Q-Former(및 미세조정 시 LLM에 붙는 소량의 어댑터)뿐이라, "InstructBLIP을 학습했다"는 표현이 LLM 자체를 학습했다는 뜻이 아니다.',
 '**FlanT5와 Vicuna 결과를 같은 표에서 비교할 때 과제 성향 차이를 무시하면 안 된다.** 논문 자체가 FlanT5는 짧고 정확한 답, Vicuna는 개방형 생성에 강하다고 밝히고 있어 벤치마크별 우열이 갈린다.'
],

figures:[
 {f:'fig3-architecture.png',
  cap:'왼쪽: 이미지 인코더(frozen)→Q-Former→Fully Connected→LLM(frozen)로 이어지는 전체 흐름. 지시문(Instruction) 텍스트가 Q-Former와 LLM 양쪽에 동시에 들어가는 것이 핵심. 오른쪽 확대도: Q-Former 내부에서 쿼리(Queries)와 지시문(Instruction)이 Self Attention을 같이 통과한 뒤 Cross Attention으로 이미지 임베딩을 참조한다.',
  src:'원문 Figure 3, p.5'}
],

quotes:[
 {t:'Trained on 13 held-in datasets, InstructBLIP attains state-of-the-art zero-shot performance across all 13 held-out datasets, substantially outperforming BLIP-2 and larger Flamingo models.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2305.06500 — InstructBLIP', u:'https://arxiv.org/abs/2305.06500'},
 {t:'공식 구현 (LAVIS)', u:'https://github.com/salesforce/LAVIS/tree/main/projects/instructblip'}
]
});
