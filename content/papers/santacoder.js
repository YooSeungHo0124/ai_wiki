WIKI.paper({
slug:'santacoder',
venue:'arXiv-only (Tech report, 2023) · BigCode project',
authors:'Ben Allal, Li, Kocetkov et al. (BigCode: Hugging Face · ServiceNow Research 등 40여 기관)',
arxiv:'2301.03988',

tldr:'BigCode 프로젝트가 낸 1.1B 파라미터 코드 모델 기술보고서. 모델 크기 경쟁 대신 **데이터 정제(중복 제거·PII·필터링)와 FIM(fill-in-the-middle) 학습**을 정밀하게 소거법(ablation)으로 검증해, 훨씬 큰 InCoder(6.7B)·CodeGen(2.7B)을 뛰어넘었다. [StarCoder](#/p/starcoder)의 전신이자 데이터 파이프라인의 시험판이다.',

context:'2022년 말 코드 생성 모델은 Codex·CodeGen·InCoder처럼 성능은 공개해도 **학습 데이터와 전처리 방법은 비공개**인 경우가 대부분이었다. 상업적 가치와 데이터 배포의 법적 불확실성이 이유였다. BigCode는 [BigScience](https://arxiv.org/abs/2211.05100)(BLOOM)를 본떠 만든 코드 버전의 개방형 협업 프로젝트로, 데이터 수집·PII 처리·평가·윤리까지 전 과정을 공개하는 것을 목표로 했다. SantaCoder는 이 프로젝트가 최종적으로 15B [StarCoder](#/p/starcoder)를 내놓기 전, **1.1B 규모에서 먼저 아키텍처와 데이터 파이프라인의 선택지를 저비용으로 검증**하는 중간 보고서다.',

ideas:[
 {h:'PII 정제 파이프라인을 먼저 구축한다',
  lead:'이메일·IP·키를 정규식과 검증 규칙으로 찾아 무작위 문자열로 치환한다.',
  d:'The Stack(공개 GitHub 코드 모음)에서 사람 이름·비밀번호는 추후 과제로 미뤄두고, 우선 이메일·IP 주소·API 키만 탐지해 치환한다. IP는 단순 정규식만 쓰면 패키지 버전 번호 같은 오탐이 쏟아지므로, 사설 IP·DNS 서버는 제외하고 `dns`/`server` 문맥이 있을 때만 한 자리 숫자로 된 주소도 잡는 식으로 규칙을 다듬었다. 모든 학습은 이 PII 치환이 끝난 버전으로만 수행한다.'},
 {h:'근접 중복 제거(near-deduplication)가 정확 일치 제거보다 강하다',
  lead:'MinHash 기반 근접 중복 제거를 완전 일치 제거보다 더 공격적으로 적용하면 성능이 오른다.',
  d:'Codex·CodeGen 등 기존 모델은 대개 해시나 정확 일치(sha-256, 알파벳순 토큰열 등)로만 중복을 걸렀다(Table 4). 이 논문은 [The Stack](#/p/starcoder) 저자들의 근접 중복 제거를 5-gram·유사도 임계값 0.7까지 더 공격적으로 밀어붙였고, 이미 중복 제거된 데이터에서도 추가로 16~20%의 파일을 더 제거하면서 HumanEval 성능이 오히려 1~3%p 개선됐다.'},
 {h:'"별점 5개 이상 필터"는 역효과였다',
  lead:'GitHub 스타 수로 고품질 저장소를 거르는 직관적 필터가 성능을 크게 떨어뜨렸다.',
  d:'"인기 저장소의 코드가 더 좋을 것"이라는 가설로 5+ 스타 저장소만 남기면 데이터 볼륨의 60% 이상이 사라지고, HumanEval/MBPP pass@100이 큰 폭으로 하락했다(Table 6, Java 0.64→0.54). 코멘트-코드 비율 필터나 토크나이저 fertility 필터는 영향이 미미했던 것과 대비된다. 데이터를 줄이는 필터는 "그럴듯해 보여도" 실측 없이는 위험하다는 것을 직접 보여준 사례다.'},
 {h:'FIM은 왼쪽→오른쪽 생성 능력을 거의 해치지 않는다',
  lead:'문서를 무작위로 prefix/middle/suffix로 잘라 middle을 끝으로 옮겨 학습해도 좌→우 생성력이 거의 유지된다.',
  d:'FIM-rate 0.5로 SPM+PSM을 함께 학습한 모델은 좌→우 생성(pass@100)에서 No-FIM 대비 2~4%p만 하락하면서, 대신 코드 중간 채우기(single-line exact match)에서 39~44%p라는 압도적 이득을 얻는다(Java 기준 No-FIM 대비 채우기 능력 자체가 없음 → FIM 모델 0.62). "FIM-for-free"라는 선행 주장(Bavarian et al., 2022)만큼 완전히 공짜는 아니었지만, 그 비용을 처음으로 정량화했다.'},
 {h:'MQA는 성능을 조금 내주고 추론 속도를 얻는다',
  lead:'Multi Query Attention은 Multi Head Attention보다 pass@100이 1~4%p 낮지만 생성 시 메모리 대역폭이 줄어든다.',
  d:'[MQA](https://arxiv.org/abs/1911.02150)는 모든 head가 key·value를 공유해 head 수만큼 커지던 KV 캐시를 줄인다. 같은 하이퍼파라미터에서 MHA 모델(1.3B)이 MQA 모델(1.1B)보다 HumanEval 기준 1~4%p, MBPP 기준 1~3%p 높았지만, 이 논문은 실서비스 추론 속도 이득이 그 손해를 상쇄한다고 보고 최종 모델에 MQA를 채택했다.'}
],

diagram:{type:'flow', cap:'The Stack 원본에서 SantaCoder 학습 데이터로 가는 정제 파이프라인. 각 단계가 개별 ablation으로 검증됐다.',
 nodes:[
  {t:'The Stack v1.1', s:'Java·JS·Python'},
  {t:'PII 치환', s:'이메일·IP·키'},
  {t:'근접 중복 제거', s:'5-gram, 임계값 0.7', acc:true, note:'추가로 16~20% 제거'},
  {t:'라인길이·필터', s:'stars·comment비율'},
  {t:'벤치마크 오염 제거', s:'HumanEval 등 유출 방지'},
  {t:'FIM+MQA 학습', s:'1.1B · 118B 토큰'}
 ]},

math:[
 {expr:'pass@k: k번 샘플 중 정답이 하나라도 있을 확률의 unbiased 추정',
  tex:'\\text{pass@}k = \\mathbb{E}_{\\text{problems}}\\left[1-\\binom{n-c}{k}\\Big/\\binom{n}{k}\\right]',
  d:'n개의 후보를 생성해 그중 정답 c개가 있을 때, k개를 뽑아 적어도 하나가 맞을 확률을 [Codex/HumanEval](#/p/humaneval)이 제안한 방식대로 추정한다. 이 논문은 온도 0.2로 pass@1, 온도 0.8로 pass@10·pass@100을 추정한다.'}
],

numbers:[
 {k:'모델 크기·구조', v:'1.1B · 24층 · head 16 · d=2048', d:'decoder-only Transformer, FIM+MQA, float16 학습'},
 {k:'학습 데이터', v:'118B 토큰 (268GB)', d:'The Stack v1.1의 Python·Java·JavaScript 서브셋, PII 치환·중복 제거 후'},
 {k:'학습 비용', v:'3.1일 × V100 96장', d:'1.05×10²¹ FLOPs, 300K iteration, 배치 192'},
 {k:'HumanEval pass@100 (Python)', v:'0.49', d:'InCoder 6.7B와 동률, CodeGen-mono 2.7B(0.57)·Codex 2.5B(0.60)보다는 낮음 (Table 7)'},
 {k:'FIM 채우기(Java, exact match)', v:'0.62', d:'InCoder 6.7B(0.49)보다 높음 — 크기가 1/6인데도 채우기 과제는 앞섬'},
 {k:'GitHub 스타 필터의 손해', v:'Java pass@100 0.64→0.54', d:'"인기 저장소만 남기기" 필터의 역효과 (Table 6)'}
],

impact:'"모델을 키우는 대신 데이터를 정밀하게 다듬는다"는 이 보고서의 태도가 이후 BigCode 프로젝트의 정체성이 되었다. 특히 GitHub 스타 필터의 실패 사례는 "직관적으로 그럴듯한 필터"도 반드시 ablation으로 검증해야 한다는 교훈을 코드 LLM 커뮤니티에 남겼다. FIM 학습·MQA·근접 중복 제거라는 세 가지 선택이 그대로 이어져 15B 규모의 [StarCoder](#/p/starcoder)의 기본 레시피가 되었고, PII 치환 파이프라인 역시 The Stack 후속 버전에 계승됐다.',

legacy:[
 '**직접적 후속** — 같은 BigCode 팀이 데이터·아키텍처 선택을 그대로 키운 15B 모델 [StarCoder](#/p/starcoder)로 이어짐',
 '**FIM 학습의 표준화** — SantaCoder에서 검증된 FIM 레시피가 이후 [StarCoder](#/p/starcoder)·Code Llama 등 코드 모델 대부분의 기본 학습 목표로 정착',
 '**데이터 필터 검증 관행** — "그럴듯한 필터도 ablation 없이는 못 믿는다"는 이 논문의 GitHub 스타 필터 실패 사례가 이후 데이터 큐레이션 논문들의 표준 경고 사례로 인용됨',
 '**MQA의 코드 LLM 실전 채택** — 추론 비용을 낮추는 MQA를 성능 손해를 감수하고 채택한 선례가 이후 코드 생성 서비스용 모델들의 관성적 선택이 됨'
],

pitfalls:[
 '**SantaCoder가 모든 벤치마크에서 더 크고 이름값 있는 모델을 이긴 것은 아니다.** Python left-to-right pass@100은 0.49로 CodeGen-mono(0.57)·Codex(0.60)보다 낮다. 이 논문의 주장은 "InCoder·CodeGen-multi처럼 비슷한 다국어·오픈소스 계열 대비 더 작은 크기로 경쟁력 있다"는 것이지, 모든 코드 모델을 이겼다는 뜻이 아니다.',
 '**MHA vs MQA 비교는 파라미터 수가 다르다(1.1B vs 1.3B)는 조건을 붙여 읽어야 한다.** 저자들도 "완전히 공정한 비교는 아니다"라고 명시한다.',
 '**이 논문은 정식 학회 논문이 아니라 진행 상황을 알리는 tech report다.** BigCode 프로젝트가 2022년 말 시점까지 검증한 내용을 정리한 중간 보고서 성격이 강하며, 최종 결론은 이후 StarCoder 논문에서 갱신된다.'
],

figures:[
 {f:'fig3-training-curve.png',
  cap:'가로축은 학습 중 처리한 토큰 수(B), 세로축은 HumanEval pass@100. 맨 아래 굵은 파란선(350M 소형 모델)을 제외하면 나머지는 전부 1.1B 규모 ablation들이다. 주황 "stars" 필터 선(짧게 끊긴 갈색 선)이 다른 곡선보다 낮은 위치에서 정체하는 것이 GitHub 스타 필터의 손해를 보여준다. 맨 위 연노랑 "Final"이 근접중복제거+코멘트 필터를 합친 최종 데이터 구성.',
  src:'원문 Figure 3, p.10'}
],

quotes:[
 {t:'We find that more aggressive filtering of near-duplicates can further boost performance and, surprisingly, that selecting files from repositories with 5+ GitHub stars deteriorates performance significantly.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2301.03988 — SantaCoder: Don\'t Reach for the Stars!', u:'https://arxiv.org/abs/2301.03988'},
 {t:'BigCode project (Hugging Face)', u:'https://huggingface.co/bigcode'}
]
});
