WIKI.paper({
slug:'qwen2',
venue:'Technical Report (arXiv)',
authors:'An Yang et al. (Qwen Team, Alibaba Group)',
arxiv:'2407.10671',

tldr:'0.5B~72B 밀집 모델 4종과 57B-A14B [MoE](#/p/moe-shazeer) 1종으로 구성된 공개 가중치 LLM 시리즈. 7T 토큰 사전학습과 강화된 다국어·코드·수학 데이터, [YARN](#/p/yarn)+Dual Chunk Attention 기반 128K 문맥으로 동급 최고 성능을 냈다.',

context:'2024년 중반 [Llama 2](#/p/llama2)와 Mistral이 공개 가중치 진영을 이끌었지만, 중국어·한국어를 포함한 비영어권 성능은 대개 부차적으로 다뤄졌다. 직전 세대 Qwen1.5는 3T 토큰으로 학습했고 MHA 기반이라 긴 문맥에서 KV 캐시 부담이 컸다. 같은 시기 Llama-3가 공개 가중치의 최상단을 GPT-4급으로 끌어올리면서, 단일 파라미터대가 아니라 0.5B부터 72B까지 **배포 시나리오 전체를 커버하는 시리즈**를 내놓는 것이 경쟁의 축이 됐다. Qwen2가 답한 질문은 "다국어·긴 문맥·다양한 배포 규모를 동시에 만족하는 공개 시리즈를 어떻게 설계하는가"였다.',

ideas:[
 {h:'GQA로 시리즈 전체의 KV 캐시를 줄인다',
  lead:'모든 크기에 [GQA](#/p/gqa)를 적용해 추론 처리량과 긴 문맥 메모리를 동시에 개선한다.',
  d:'전작 Qwen1.5의 표준 MHA 대신 전 모델 라인업에 [GQA](#/p/gqa)를 채택했다. 0.5B는 14개 쿼리 헤드에 2개 KV 헤드, 72B는 64개 쿼리 헤드에 8개 KV 헤드로 쿼리:KV 비율을 유지한다. 토큰당 KV 크기가 줄어드는 만큼 128K 같은 긴 문맥에서 메모리 병목이 먼저 완화된다.'},
 {h:'미세 전문가(fine-grained expert) MoE',
  lead:'전문가를 잘게 쪼개고 더 많이 활성화해 같은 파라미터로 더 다양한 조합을 만든다.',
  d:'Mixtral처럼 원래 FFN 크기 그대로 8개 중 2개를 쓰는 대신, FFN 중간 차원을 잘게 나눠 64개의 작은 라우팅 전문가와 8개의 공유 전문가를 두고 토큰마다 8개를 활성화한다. 57B 총 파라미터 중 14B만 활성화되면서도, 전문가 조합의 경우의 수가 늘어 표현력이 커진다. 초기화는 밀집 7B 모델을 복제·셔플한 뒤 절반을 재초기화하는 upcycling 방식이다.'},
 {h:'7T 토큰, 그러나 "더 많으면 좋다"는 아니다',
  lead:'12T 토큰까지 늘려봤지만 7T 대비 유의미한 개선이 없어 7T를 채택했다.',
  d:'Qwen1.5의 3T 토큰에서 7T로 늘리면서 코드·수학·다국어 데이터의 양과 질을 함께 강화했다. 품질 기준을 더 낮춰 12T까지 확장하는 실험도 했지만 성능이 유의미하게 오르지 않아, 데이터 양 자체보다 품질 임계값이 병목이라고 판단하고 대형 모델은 7T로 학습했다(0.5B만 예외적으로 12T 사용).'},
 {h:'YARN + Dual Chunk Attention으로 128K 확장',
  lead:'사전학습 마지막 단계에서 문맥을 4K→32K로 늘리고 [YARN](#/p/yarn)·DCA로 128K까지 추론 확장한다.',
  d:'사전학습 후반부에 문맥 길이를 4,096에서 32,768로 늘리고 [RoPE](#/p/rope) 기본 주파수를 10,000에서 1,000,000으로 올려 장거리 위치 구분력을 확보했다. 여기에 긴 시퀀스를 관리 가능한 청크로 나누는 Dual Chunk Attention과 [YARN](#/p/yarn)의 길이 외삽을 얹어, 학습은 32K로 하고 추론은 128K까지 처리한다.'},
 {h:'약 30개 언어를 겨냥한 데이터·평가 설계',
  lead:'중국어·한국어·아랍어 등 약 30개 언어 데이터를 늘리고 언어별 전문 평가자로 검증한다.',
  d:'토크나이저는 전작과 동일한 바이트 수준 BPE, 151,643개 정규 토큰을 유지하되 사전학습 데이터 자체의 다국어 비중을 키웠다. 평가에서는 자동 벤치마크(C-Eval·CMMLU 등 중국어 특화 포함) 외에 언어별 전공 평가자가 5점 척도로 채점하는 사람 평가를 병행해, 벤치마크 수치만으로 가려지는 실제 언어 품질을 확인했다.'}
],

diagram:{type:'split', cap:'Qwen2-57B-A14B의 MoE 레이어. 공유 전문가는 항상 켜지고, 라우팅 전문가는 게이트가 고른 8개만 켜진다.',
 from:{t:'토큰 표현', s:'d=3,584'},
 branches:[
  {t:'공유 전문가', s:'8개, 항상 활성'},
  {t:'라우팅 전문가', s:'64개 중 top-8'}
 ],
 join:'가중합 후 다음 층으로'},

math:[
 {expr:'p = softmax(G(x)),   y = Σ_{i∈topk(p)} p_i · E_i(x)',
  tex:'p=\\text{softmax}(G(x)),\\qquad y=\\sum_{i\\in \\text{topk}(p)} p_i\\, E_i(x)',
  d:'게이트 $G$가 토큰 $x$에 대해 전문가별 확률 $p$를 계산하고, 상위 $k$개 전문가 $E_i$의 출력만 그 확률로 가중합해 $y$를 만든다. 나머지 전문가는 이번 토큰에 대해 계산되지 않는다.'}
],

numbers:[
 {k:'사전학습 토큰', v:'7T (0.5B는 12T)', d:'Qwen1.5의 3T에서 확대. 12T 확장은 유의미한 이득 없어 폐기'},
 {k:'MoE 구성', v:'57B 총 · 14B 활성', d:'64 라우팅 + 8 공유 전문가, top-8 활성'},
 {k:'MMLU · Qwen2-72B', v:'84.2', d:'GPQA 37.9 · HumanEval 64.6 · GSM8K 89.5 (base 모델)'},
 {k:'중국어 벤치 · Qwen2-72B', v:'C-Eval 91.0 · CMMLU 90.1', d:'Qwen1.5-72B(84.1/83.5) 대비 상승'},
 {k:'다국어 사람 평가 평균', v:'3.93 / 5', d:'GPT-4-Turbo 3.98에 근접, Korean 4.14로 GPT-4-Turbo(4.24)에 근접'},
 {k:'문맥 길이', v:'4,096 → 32,768 학습 · 128K 추론', d:'RoPE base 10,000→1,000,000 + YARN + DCA'}
],

impact:'Qwen2는 "한 파라미터대"가 아니라 0.5B~72B 전 구간과 MoE까지 한 번에 공개하며 공개 가중치 진영의 선택지를 넓혔다. 특히 중국어·한국어를 포함한 약 30개 언어에서 동급 공개 모델 대비 뚜렷한 격차를 보이면서, 서구어 중심이던 오픈 LLM 벤치마크 관행에 다국어·비영어권 평가 비중을 끌어올리는 계기가 됐다. GQA를 시리즈 전체 기본값으로 삼고 YARN·DCA로 128K를 실용적 비용에서 지원한 것도 이후 공개 모델들의 표준 구성으로 자리잡았다.',

legacy:[
 '**Qwen2.5·Qwen3로 이어지는 시리즈화** — 여러 크기·MoE·특화 모델(코드·수학)을 한 세대에 동시 공개하는 릴리스 방식이 이후 세대에서도 유지됨',
 '**fine-grained expert MoE의 확산** — 전문가를 잘게 쪼개고 공유 전문가를 두는 설계가 [DeepSeek-V3](#/p/deepseek-v3) 등 후속 공개 MoE 모델의 기본형이 됨',
 '**다국어 평가의 표준화 압력** — 벤치마크 수치와 별개로 언어별 사람 평가를 병행하는 방식이 이후 공개 모델 리포트에서 흔해짐',
 '**GQA + 긴 문맥 확장 조합의 정착** — [GQA](#/p/gqa)를 기본값으로 삼고 [YARN](#/p/yarn) 계열로 128K를 만드는 조합이 이후 공개 모델의 표준 레시피가 됨'
],

pitfalls:[
 '**"72B가 모든 벤치마크에서 최고"가 아니다.** 다국어 사람 평가에서는 최신 proprietary 모델(GPT-4o·Claude-3-Opus)에 여전히 못 미친다고 논문 스스로 밝힌다.',
 '**토큰 수를 늘린다고 항상 좋아지지 않는다.** 12T로 늘린 실험이 7T 대비 개선이 없었다는 결과는 스케일링이 데이터 품질 임계값에 의해 제한될 수 있음을 보여준다.',
 '**MoE의 57B-A14B라는 이름을 유효 파라미터로 오독하기 쉽다.** 총 파라미터 57B 중 14B만 활성화되므로 메모리(가중치 저장)는 57B급, 연산 비용은 14B급으로 서로 다른 축의 숫자다.'
],

figures:[
 {f:'fig1-niah.png',
  cap:'Needle-in-a-Haystack 히트맵. 가로축이 문맥 길이(최대 128K), 세로축이 사실을 숨긴 위치. 초록이 100% 검색 정확도, 노랑이 낮은 정확도. Qwen2-72B-Instruct는 128K 전 구간이 초록이지만, 57B-A14B·7B는 특정 길이·깊이 조합에서 노란 얼룩(검색 실패)이 보인다.',
  src:'원문 Figure 1, p.17'}
],

quotes:[
 {t:'This report introduces the Qwen2 series, the latest addition to our large language models and large multimodal models. We release a comprehensive suite of foundational and instruction-tuned language models, encompassing a parameter range from 0.5 to 72 billion, featuring dense models and a Mixture-of-Experts model.',
  src:'Abstract, p.1'},
 {t:'It is suspected that increasing the volume of data does not necessarily benefit model pre-training.',
  src:'Section 3.1, p.5'}
],

links:[
 {t:'arXiv 2407.10671 — Qwen2 Technical Report', u:'https://arxiv.org/abs/2407.10671'},
 {t:'Qwen2 (Hugging Face)', u:'https://huggingface.co/Qwen'},
 {t:'QwenLM/Qwen2 (GitHub)', u:'https://github.com/QwenLM/Qwen2'}
]
});
