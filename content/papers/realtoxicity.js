WIKI.paper({
slug:'realtoxicity',
venue:'EMNLP Findings 2020',
authors:'Gehman et al. (University of Washington · Allen Institute for AI)',
arxiv:'2009.11462',

tldr:'무해해 보이는 문장으로만 프롬프트를 줘도 [GPT-2](#/p/gpt2) 같은 언어모델이 상당한 확률로 독성 텍스트를 이어 쓴다는 것을, 10만 개 프롬프트로 구성된 REALTOXICITYPROMPTS로 실증한 논문. 원인을 추적해 사전학습 웹 코퍼스 자체에 독성 문서가 섞여 있음을 보였다.',

context:'2020년 시점의 언어모델 평가는 대부분 perplexity나 다운스트림 정확도에 집중했고, 유해성은 "명백히 독성인 프롬프트를 주면 독성 답이 나온다"는 정도의 산발적 관찰에 머물러 있었다. 문제는 실제 배포 환경에서는 사용자가 굳이 욕설이나 혐오 표현으로 시작하지 않는다는 점이다. 자동완성·챗봇처럼 **일상적이고 무해한 문장**만 주어져도 모델이 스스로 독성으로 미끄러져 들어갈 수 있는지는 체계적으로 측정된 적이 없었다. 이 논문은 이를 대규모로, 정량적으로 확인하는 것을 목표로 삼는다.',

ideas:[
 {h:'REALTOXICITYPROMPTS: 자연 발생 문장을 반으로 잘라 프롬프트를 만든다',
  lead:'웹 코퍼스 문장을 독성 점수 4구간으로 층화 추출해 프롬프트/이어쓰기로 반씩 나눈다.',
  d:'OpenWebTextCorpus에서 문장을 가져와 [0,.25), [.25,.5), [.5,.75), [.75,1] 네 구간에서 각 25K씩, 총 10만 개를 뽑고 문장을 절반으로 잘라 앞은 prompt, 뒤는 continuation으로 쓴다. 두 조각 모두 **PERSPECTIVE API**로 독성 점수를 매긴다. 그 결과 프롬프트 중 21,744개가 독성(≥0.5), 77,272개가 비독성으로 나뉘었다.'},
 {h:'무프롬프트 상태에서도 독성이 나온다',
  lead:'시작 토큰만 주고 생성만 반복해도 GPT-1/2/3·CTRL 전부 독성 0.5를 넘긴다.',
  d:'프롬프트 없이 문장 시작 토큰(`<|endoftext|>` 등)만 주고 생성을 반복한 뒤, $n$개 생성 중 최댓값의 기댓값을 부트스트랩으로 추정한다("Expected Maximum Toxicity"). 다섯 모델 모두 **100번 생성 안에 독성 0.5를 넘고, 1000번이면 대부분 0.9를 넘는다.** 프롬프트가 전혀 없는데도 모델이 스스로 독성 텍스트로 흘러간다는 뜻이다.'},
 {h:'비독성 프롬프트도 절반 가까이 독성 생성을 유발한다',
  lead:'토xicity ≥ 0.5인 비독성 프롬프트에서도 25회 생성 중 최대 0.5 확률이 GPT-2 기준 48%다.',
  d:'REALTOXICITYPROMPTS의 비독성 프롬프트(문장 자체는 PERSPECTIVE 기준 무해)를 넣고 25회씩 생성했을 때도, 모든 모델의 **toxicity probability**(25회 중 한 번이라도 독성 생성이 나올 확률)가 0.5 근방이었다(GPT-2 0.48, GPT-1 0.60). 겉보기 무해함이 안전을 보장하지 않는다는 것이 이 논문의 핵심 실증이다.'},
 {h:'해독 기법을 시도하지만 완전히 막지는 못한다',
  lead:'금칙어 필터·control token·비독성 데이터 추가 사전학습을 비교하되 전부 실패 사례가 남는다.',
  d:'단순한 금칙어 필터(swearword blacklist)는 욕설 없이도 독성이 발생하는 경우를 못 잡고, CTRL의 control token 방식도 부분적으로만 효과가 있다. 가장 효과적인 방법은 **비독성 서브셋으로 추가 사전학습(DAPT)** 하는 것이었지만, 이 방법으로도 여전히 고독성 생성이 나오는 사례가 남아 "완전히 안전한(failsafe) 방법은 없다"고 결론짓는다.'},
 {h:'원인 추적: 사전학습 코퍼스 자체가 독성이다',
  lead:'GPT-2의 학습 코퍼스(OpenAI-WT)와 그 공개 복제본(OWTC)을 직접 스캔해 독성 비율을 측정한다.',
  d:'OWTC 문서의 2.1%, OpenAI-WT 문서의 4.3%가 PERSPECTIVE 기준 독성(≥0.5)이었다. 또 이 문서들의 URL 출처를 역추적해, 사실 신뢰도가 낮은 뉴스 사이트나 밴/격리된 서브레딧에서 흘러온 비중이 무시할 수 없게 높다는 것도 보였다. 모델의 독성은 신비한 창발이 아니라 **학습 데이터에 있던 것이 그대로 재현된 것**이라는 결론이다.'}
],

diagram:{type:'flow', cap:'REALTOXICITYPROMPTS 생성부터 측정까지의 파이프라인.', nodes:[
 {t:'웹 문장', s:'OpenWebTextCorpus'},
 {t:'독성 점수 매기기', s:'PERSPECTIVE API'},
 {t:'절반 분할', s:'prompt / continuation'},
 {t:'LM에 prompt 입력', s:'GPT-1/2/3·CTRL', acc:true},
 {t:'25회 생성', s:'nucleus p=0.9'},
 {t:'EMT·독성확률 집계', s:'생성 결과 재채점'}
]},

math:[
 {expr:'EMT(n) = E[ max( TOXICITY(g_1), ..., TOXICITY(g_n) ) ]',
  tex:'\\text{EMT}(n) = \\mathbb{E}\\big[\\max\\big(\\text{TOXICITY}(g_1),\\dots,\\text{TOXICITY}(g_n)\\big)\\big]',
  d:'Expected Maximum Toxicity. $n$개 생성 중 최댓값의 기댓값으로, 10K 생성 풀에서 복원추출로 1000회 부트스트랩해 추정한다. "이 모델을 $n$번 돌리면 최악의 경우 얼마나 독성일까"를 답한다.'},
 {expr:'ToxicityProb = P( ∃ i ≤ k : TOXICITY(g_i) ≥ 0.5 )',
  tex:'\\text{ToxicityProb} = P\\big(\\exists\\, i \\le k : \\text{TOXICITY}(g_i) \\ge 0.5\\big)',
  d:'$k=25$회 생성 중 한 번이라도 독성 임계값을 넘길 경험적 확률. EMT가 "최악의 강도"를 본다면 이 값은 "발생 빈도"를 본다.'}
],

numbers:[
 {k:'REALTOXICITYPROMPTS 규모', v:'100K 프롬프트', d:'독성 21,744 · 비독성 77,272개, 평균 11.7±4.2 토큰'},
 {k:'GPT-2 EMT (100회 생성, 무프롬프트)', v:'0.65', d:'프롬프트 없이 100번만 생성해도 기대 최대 독성이 0.65'},
 {k:'GPT-2 비독성 프롬프트 toxicity prob.', v:'0.48', d:'25회 생성 중 최소 1회 독성(≥0.5) 발생 확률'},
 {k:'GPT-1 비독성 프롬프트 toxicity prob.', v:'0.60', d:'다섯 모델 중 가장 높음 — 사전학습 코퍼스(BookCorpus) 자체 독성과 연관'},
 {k:'OWTC 독성 문서 비율', v:'2.1%', d:'PERSPECTIVE TOXICITY ≥ 0.5 기준, 약 8M 문서 중'},
 {k:'OpenAI-WT 독성 문서 비율', v:'4.3%', d:'GPT-2 실제 학습 코퍼스, OWTC보다 높음'}
],

impact:'평가 관점에서는 "명시적으로 독성인 입력에만 대응하면 된다"는 가정을 깼다 — 무해한 입력도 위험할 수 있다는 것을 표준 벤치마크(REALTOXICITYPROMPTS)로 만들어, 이후 대부분의 안전성 논문·모델 카드가 이 데이터셋으로 독성을 보고하게 됐다. 또한 "모델의 문제가 아니라 데이터의 문제"라는 진단은 이후 사전학습 데이터를 필터링·[중복 제거](#/p/dedup)하려는 연구 흐름과 직접 연결된다.',

legacy:[
 '**표준 독성 벤치마크화** — REALTOXICITYPROMPTS는 이후 [InstructGPT](#/p/instructgpt), [HH-RLHF](#/p/anthropic-hh) 등 정렬 논문들의 안전성 평가 지표로 반복 사용됨',
 '**데이터 감사로의 전환** — 모델 출력만 보던 안전성 연구가 사전학습 코퍼스 자체를 감사하는 방향으로 확장, [The Pile](#/p/the-pile) 이후 데이터 문서화·필터링 관행에 영향',
 '**레드팀 계열의 선행 연구** — 특정 프롬프트가 모델을 체계적으로 무너뜨릴 수 있다는 관찰은 이후 [레드팀](#/p/red-teaming) 방법론의 문제의식으로 이어짐',
 '**해독(detoxification) 연구의 기준선** — DAPT·control code·decoding-time steering 비교 실험은 이후 controllable generation 연구의 표준 비교군이 됨'
],

pitfalls:[
 '**PERSPECTIVE API는 완벽한 진리값이 아니다.** 논문 스스로도 소수자 정체성 언급이 있는 문장을 과대추정하는 편향을 인정한다 — "독성 0.5"는 자동 분류기의 판단이지 절대 기준이 아니다.',
 '**"방법 X가 독성을 줄였다"는 "없앴다"가 아니다.** DAPT가 가장 효과적이었지만 논문은 명시적으로 "no current method is failsafe"라고 못박는다. 잔여 위험이 항상 있다.',
 '**독성 비율(2.1%/4.3%)을 전체 유해성 지표로 오해하면 안 된다.** 이는 PERSPECTIVE 기준 명시적 독성만 잡은 것이고, 사실 왜곡·편향처럼 이 지표로 안 잡히는 해악은 별도다.'
],

figures:[
 {f:'fig2-emt.png',
  cap:'x축은 로그스케일 생성 횟수, y축은 기대 최대 독성(EMT). 다섯 곡선 모두 우상향하며, 점선이 가리키는 지점이 "GPT-2는 100번만 생성해도 EMT 0.65"라는 본문의 핵심 주장. 음영은 부트스트랩 분산.',
  src:'원문 Figure 2, p.3'},
 {f:'fig3-corpus-toxicity.png',
  cap:'위는 OWTC, 아래는 GPT-2 실제 학습 코퍼스 OpenAI-WT의 문서별 독성 점수 히스토그램(y축 로그스케일). 점선(0.5) 오른쪽 빨간 영역의 넓이가 "독성 문서" 비율이고, 괄호 위 수치(2.1%/4.3%)가 그 비율이다 — 사전학습 데이터 자체에 독성이 있다는 §6의 증거.',
  src:'원문 Figure 3, p.6'}
],

quotes:[
 {t:'While data- or compute-intensive methods (e.g., adaptive pretraining on non-toxic data) are more effective at steering away from toxicity than simpler solutions (e.g., banning "bad" words), no current method is failsafe against neural toxic degeneration.',
  src:'Abstract, p.1'},
 {t:'These results suggest that models acquire toxicity from their pretraining data, which we analyze further in §6.',
  src:'§3.1, p.3'}
],

links:[
 {t:'arXiv 2009.11462 — RealToxicityPrompts', u:'https://arxiv.org/abs/2009.11462'},
 {t:'프로젝트 페이지 (toxicdegeneration.allenai.org)', u:'http://toxicdegeneration.allenai.org/'}
]
});
