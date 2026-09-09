WIKI.paper({
slug:'deepseek-coder',
venue:'arXiv 2024',
authors:'Guo, Zhu et al. (DeepSeek-AI · Peking University)',
arxiv:'2401.14196',

tldr:'파일 하나가 아니라 **저장소 전체**를 학습 단위로 삼은 오픈소스 코드 LLM. 파일 사이의 import 의존관계를 위상정렬로 배열해 문맥에 넣고, 여기에 FIM과 16K 문맥을 더해 1.3B~33B 규모에서 당시 오픈소스 코드 모델 중 최고 성능을 냈다.',

context:'2023년의 오픈소스 코드 모델 — [StarCoder](#/p/starcoder), [Code Llama](#/p/codellama) — 는 대부분 GitHub 파일을 **개별 문서**로 취급해 섞어서 학습했다. 문제는 실제 코드가 그렇게 존재하지 않는다는 점이다. 한 저장소 안에서 `utils.py`는 `main.py`가 `import`하고, 클래스 정의는 다른 파일의 상속에 쓰이는 식으로 파일들이 서로 얽혀 있다. 파일을 무작위 순서로 섞어 학습하면 모델은 눈앞의 한 파일 안의 패턴만 배우고, 정작 실무에서 필요한 **크로스파일 문맥**(다른 파일에 정의된 함수 시그니처를 보고 호출부를 완성하는 능력)은 배우지 못한다. DeepSeek-Coder는 이 저장소 수준 구조를 사전학습 데이터 구성 단계에서부터 정면으로 다룬 첫 시도라고 주장한다.',

ideas:[
 {h:'저장소 수준 사전학습: 파일이 아니라 프로젝트가 단위',
  lead:'저장소 안 파일 간 import 의존관계를 위상정렬해 문맥 순서를 정한다.',
  d:'정규식으로 Python의 `import`, C#의 `using`, C의 `include` 같은 파일 간 참조를 추출해 의존 그래프를 만든다. 이 그래프를 위상정렬(topological sort)해 "의존되는 파일이 의존하는 파일보다 앞에 오도록" 배열한 뒤, 같은 저장소의 파일들을 이 순서로 이어 붙여 하나의 학습 샘플로 만든다. 순환 의존이 있으면 in-degree가 가장 작은 노드부터 뽑는 변형 위상정렬로 처리한다. 각 파일 앞에는 파일 경로를 주석으로 붙여 구조 정보를 보존한다.'},
 {h:'왜 파일 단위 학습으로는 부족한가',
  lead:'실제 코드는 여러 파일에 걸쳐 있어 파일 하나만 보면 호출부의 근거가 사라진다.',
  d:'함수 A가 다른 파일에 정의된 클래스 B를 상속하거나, 다른 모듈의 헬퍼 함수를 호출하는 경우가 실제 저장소에서는 오히려 표준적이다. 파일을 뒤섞어 학습하면 모델은 "이 함수가 어디서 왔는지" 배울 기회 자체가 없고, 추론 시 정의되지 않은 API를 지어내는(hallucinate) 경향이 커진다. 저장소 수준 배열은 정의가 사용보다 먼저 나오게 만들어, `import`로 끌어온 대상을 실제로 먼저 "읽고" 나서 사용하는 자연스러운 코딩 순서를 문맥에 재현한다.'},
 {h:'Fill-in-the-Middle: 코드는 끝에서부터 쓰지 않는다',
  lead:'앞뒤 문맥이 모두 주어진 빈칸 채우기(PSM)를 다음 토큰 예측과 함께 학습한다.',
  d:'IDE에서 코드를 작성할 때는 커서 앞뒤에 이미 코드가 있는 상태에서 중간을 채우는 경우가 대부분이다. 순수 다음 토큰 예측만으로는 이 능력이 생기지 않는다. 텍스트를 prefix·middle·suffix 세 조각으로 나눠 `Prefix, Suffix, Middle`(PSM) 순서로 재배열해 학습한다. 100% FIM 비율이 채우기 성능은 최고지만 일반 코드 생성 능력을 깎아먹는 트레이드오프가 있어, 절충으로 0.5의 FIM 비율을 채택했다.'},
 {h:'16K 문맥과 RoPE 재조정',
  lead:'저장소 수준 문맥을 실제로 담기 위해 문맥 길이를 16K로 늘리고 RoPE를 재구성했다.',
  d:'저장소 하나를 통째로 넣으려면 문맥이 길어야 한다. 문맥을 4K에서 16K로 늘리면서 [RoPE](#/p/rope)의 베이스 주파수를 재조정해 긴 시퀀스에서도 위치 인코딩이 무너지지 않게 했다. 16K는 이후 코드 모델들이 문맥 길이를 늘리는 출발선이 되었다.'},
 {h:'저장소 단위 근접중복 제거',
  lead:'파일 단위가 아니라 저장소 전체를 하나의 샘플로 보고 근접중복을 제거한다.',
  d:'기존 연구는 파일 단위로 중복을 제거했는데, 이러면 저장소 안 일부 파일만 빠져 구조가 깨질 수 있다. DeepSeek-Coder는 저장소 전체를 이어 붙인 것을 하나의 단위로 근접중복 검사를 해, 저장소 구조의 완결성을 지킨다.'}
],

diagram:{type:'compare', cap:'기존 파일 단위 사전학습 vs DeepSeek-Coder의 저장소 수준 사전학습.',
 left:{t:'파일 단위 (StarCoder 등)', items:['저장소 내 파일을 무작위 순서로 섞음','import 의존관계 무시','크로스파일 문맥 학습 안 됨']},
 right:{t:'저장소 수준 (DS-Coder)', items:['import를 파싱해 의존 그래프 생성','위상정렬로 정의를 사용보다 앞에 배치','파일 경로 주석으로 구조 보존']}},

math:[
 {expr:'inDegree(f) = 개수의 파일이 f에 의존',
  tex:'\\text{file} = \\arg\\min_{f \\in \\text{subgraph} \\setminus \\text{results}} \\text{inDegree}(f)',
  d:'표준 위상정렬은 in-degree가 0인 노드만 뽑지만, 이 논문은 **in-degree가 최소인** 노드를 뽑는 변형을 쓴다. 그래야 순환 의존(A가 B를 import하고 B도 A를 import하는 경우)이 있어도 정렬이 끝까지 진행된다.'}
],

numbers:[
 {k:'모델 규모', v:'1.3B / 6.7B / 33B', d:'Base·Instruct 각각 존재, 33B는 [GQA](#/p/gqa) 적용'},
 {k:'학습 토큰', v:'2조(2T) 토큰', d:'87개 프로그래밍 언어, scratch부터 학습'},
 {k:'원본 데이터', v:'798GB · 6.03억 파일', d:'GitHub 수집 후 필터링·중복제거·정제 결과'},
 {k:'문맥 길이', v:'16K', d:'RoPE 재조정으로 저장소 수준 문맥을 수용'},
 {k:'HumanEval pass@1 (33B)', v:'56.1%', d:'Base 모델 기준, 오픈소스 최고'},
 {k:'HumanEval pass@1 (33B Instruct)', v:'79.3%', d:'GPT-3.5-Turbo(76.2%)를 상회'}
],

impact:'DeepSeek-Coder는 코드 사전학습 데이터 구성의 표준을 "파일 모음"에서 "저장소 그래프"로 옮겼다. 33B 모델이 5배 큰 [Code Llama](#/p/codellama)-34B와 맞먹거나 앞서는 결과를 보이면서, 파라미터 수보다 데이터 구성 방식이 코드 이해 능력에 더 크게 기여할 수 있음을 보였다. 또한 GPT-3.5를 다수 벤치마크에서 넘어선 최초의 오픈소스 코드 모델 계열 중 하나로, "닫힌 모델만 실용적"이라는 인식을 흔들었다. LeetCode 신규 문제(사전학습 컷오프 이후 출제)로 데이터 오염 우려 없이 측정한 결과에서도 오픈소스 최고를 기록해, 벤치마크 오염 논란에 대한 반박 사례로도 자주 인용된다.',

legacy:[
 '**저장소 수준 학습의 표준화** — 이후 코드 모델들이 파일을 그대로 학습에 쓰지 않고 의존관계·프로젝트 구조를 반영하는 것을 기본으로 삼기 시작',
 '**DeepSeek 계열의 시작점** — 같은 팀이 이 레시피를 일반 LLM으로 확장해 [DeepSeek-V3](#/p/deepseek-v3), 추론 전문 [DeepSeek-R1](#/p/deepseek-r1)로 이어짐 (연대상 DeepSeek-Coder가 V3보다 먼저 나온 초기 실험)',
 '**DeepSeek-Coder-v1.5로 진화** — 코드 전용 목적함수 대신 일반 LLM(DeepSeek-LLM-7B)에서 이어 사전학습해 자연어·수학 추론 능력을 함께 강화',
 '**FIM 하이퍼파라미터 연구의 참조점** — FIM 비율·PSM/SPM 모드에 대한 체계적 소거 실험이 이후 코드 모델의 FIM 설정 관례로 자리잡음'
],

pitfalls:[
 '**저장소 수준 학습 ≠ 저장소 전체를 항상 한 문맥에 넣는다는 뜻이 아니다.** 16K를 넘는 대형 저장소는 여전히 잘리며, 위상정렬은 파싱 가능한 import 관계에만 의존해 동적 임포트·리플렉션 기반 의존은 잡지 못한다.',
 '**HumanEval/MBPP 점수는 단일 함수 생성 과제라 저장소 수준 학습 효과를 직접 보여주지 못한다.** 크로스파일 능력은 별도의 cross-file completion 벤치마크(Table 7)에서 확인해야 한다.',
 '**33B의 GQA 적용은 1.3B·6.7B에는 없다.** 아키텍처가 모델 크기별로 동일하지 않으므로 "33B가 더 낫다"는 이유를 파라미터 수만으로 설명하면 안 된다.'
],

figures:[
 {f:'fig1-performance.png', cap:'왼쪽 레이더 차트: 언어별 HumanEval pass@1, DeepSeek-Coder-33B(굵은 보라)가 거의 모든 언어에서 CodeLlama-34B·StarCoder를 감싼다. 오른쪽 막대그래프: 사전학습 컷오프 이후 출제된 LeetCode 신규 문제로 오염 없이 측정한 pass@1 — DeepSeek-Coder-33B-Instruct(28.9%)가 GPT-3.5-Turbo(23.3, 녹색 점선)를 넘는다.',
  src:'원문 Figure 1, p.1'},
 {f:'fig3-fim.png', cap:'FIM 비율별 학습 곡선(x축 스텝). 왼쪽 HumanEval-Pass@1은 fim_1.0(파랑, 100% FIM)이 가장 낮고 fim_0(검정)·fim_0.5(빨강)가 높다 — 반대로 가운데 HumanFIM-Pass@1은 fim_1.0이 가장 높다. 채우기 성능과 일반 생성 성능이 서로 상충함을 보여준다.',
  src:'원문 Figure 3, p.7'}
],

quotes:[
 {t:'We make the first attempt to incorporate repository-level data construction during the pre-training phase of our models. We find that it can significantly boost the capability of cross-file code generation.',
  src:'Introduction, p.2'}
],

links:[
 {t:'arXiv 2401.14196 — DeepSeek-Coder', u:'https://arxiv.org/abs/2401.14196'},
 {t:'GitHub — deepseek-ai/DeepSeek-Coder', u:'https://github.com/deepseek-ai/DeepSeek-Coder'},
 {t:'Code Llama (계보상 비교 대상)', u:'#/p/codellama'}
]
});
