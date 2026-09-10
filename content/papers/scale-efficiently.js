WIKI.paper({
slug:'scale-efficiently',
venue:'arXiv preprint 2021',
authors:'Tay, Dehghani et al. (Google Research & DeepMind)',
arxiv:'2109.10686',

tldr:'파라미터 수만 같으면 성능도 비슷하다는 통념을 깨고, **같은 파라미터 수라도 모델을 어떤 모양(깊이 vs 너비)으로 만드느냐**가 하류 미세조정 성능을 크게 좌우한다는 것을 200개 넘는 T5 설정으로 실증한 논문. 널리 쓰이던 T5-Base/Large 크기가 파레토 비효율적이라는 것도 함께 보였다.',

context:'[스케일링 법칙](#/p/scaling-laws) (Kaplan et al., 2020)은 언어모델의 사전학습 손실이 파라미터 수에 강하게, 모델 모양에는 약하게 의존한다고 결론지었다. 문제는 그 연구가 **사전학습 perplexity만** 측정했다는 점이다. 실무자는 사전학습된 모델을 그대로 쓰지 않고 하류 과제에 미세조정하는데, 사전학습 손실이 낮은 모델이 미세조정 후에도 좋을지는 확인된 적이 없었다. 이 논문은 GLUE·SuperGLUE·SQuAD 등 17개 하류 과제에 대해 5M~30B 파라미터, 200개 이상의 [T5](#/p/t5) 설정을 사전학습부터 미세조정까지 전부 돌려서 이 공백을 메운다. [스케일링 법칙](#/p/scaling-laws)과 이후의 [Chinchilla](#/p/chinchilla)가 "파라미터 수 대 데이터 양"이라는 축을 다뤘다면, 이 논문은 **같은 파라미터 예산 안에서 그 파라미터를 깊이에 쓸지 너비에 쓸지**라는 전혀 다른 축을 다룬다.',

ideas:[
 {h:'모델 모양이 하류 성능을 가른다',
  lead:'사전학습 손실은 모양과 거의 무관하지만 하류 성능은 모양에 강하게 의존한다.',
  d:'Figure 1에서 33B(XXXL)부터 750M(LG)까지 다양한 깊이로 변형한 십여 개 모델을 비교했다. 사전학습 negative log-perplexity는 파라미터 수와 거의 일직선으로 상관되어 [스케일링 법칙](#/p/scaling-laws)의 결론을 재확인했다. 그런데 같은 모델들을 SuperGLUE로 미세조정하면 이 상관관계가 사실상 사라진다. 파라미터 수가 같아도 깊이를 늘린 쪽(NL 접두어)이 너비만 넓힌 쪽보다 하류에서 뚜렷이 앞선다.'},
 {h:'사전학습 손실은 하류 성능의 기만적인 지표일 수 있다',
  lead:'perplexity가 더 좋은 모델이 하류 과제에서는 더 나쁠 수 있다는 구체적 반례를 제시한다.',
  d:'Table 3의 직접 비교가 핵심 증거다. `NL12-XXL`(12층, $d_{ff}$=65536, 3.6B)은 PPL -1.46으로 `NL32-XL`(32층, $d_{ff}$=16384, 3.8B)의 PPL -1.49보다 사전학습 성능이 더 좋다. 그런데 하류 평균 점수는 NL12-XXL이 85.1/76.5/88.1, NL32-XL이 86.9/79.9/89.5로 **얕고 넓은 모델이 사전학습에서 이기고 깊고 좁은 모델이 하류에서 이기는** 역전이 일어난다. 논문은 이 역전을 명시적으로 보인 것이 이 작업이 처음이라고 주장한다.'},
 {h:'스케일링 전략은 컴퓨트 구간마다 다르게 작동한다',
  lead:'같은 스케일링 조작을 작은 모델과 큰 모델에 적용하면 효과가 달라진다.',
  d:'Small·Base·Large 세 시작점 각각에서 층수(NL)·헤드 수(NH)·$d_{ff}$(FF)·$d_{model}$(DM) 등 개별 축을 스윕한 결과(Figure 2), 파레토 경계에 가장 큰 영향을 주는 축이 모델 크기 구간마다 달랐다. 작은 모델에서 통하던 스케일링 처방을 큰 모델에 그대로 옮기면 통하지 않을 수 있다는 뜻이며, 저컴퓨트 실험으로 얻은 결론을 고컴퓨트로 단순 외삽하는 실무 관행에 대한 경고다.'},
 {h:'T5-Base와 T5-Large는 파레토 비효율적이다',
  lead:'널리 쓰이는 두 표준 크기가 같은 컴퓨트에서 더 나은 대안이 존재하는 지점에 있다.',
  d:'T5-Base·Large 크기는 사실 [BERT](#/p/bert)의 base/large 크기를 그대로 물려받은 것이지 하류 미세조정 기준으로 재설계된 적이 없다. 저자들은 파라미터·FLOPs·속도 세 축 각각에서 파레토 프론티어를 그려, 이 두 표준 크기가 프론티어 안쪽(비효율 지점)에 있고 층수만 조정해도 같은 컴퓨트로 더 나은 하류 점수를 낼 수 있음을 보였다.'},
 {h:'DeepNarrow: 깊이를 우선하되 32~36층에서 멈춘다',
  lead:'폭보다 깊이를 먼저 늘리되 32~36층 근처부터는 파레토 이득이 급격히 줄어든다.',
  d:'실험 전반에서 깊이(NL) 스케일링이 너비($d_{ff}$, FF) 스케일링보다 파레토 경계를 더 크게 밀어냈다. 그래서 다른 축보다 **깊이를 먼저** 늘리라고 권고한다. 다만 절대 성능은 층을 더 쌓아도 계속 오르지만, 파레토 효율(같은 컴퓨트당 성능)의 상대적 이득은 32~36층 부근에서 수렴한다. 층 스케일링은 디바이스 간 병렬화가 안 된다(앞 층의 출력을 기다려야 함)는 한계도 명시한다.'}
],

diagram:{type:'compare', cap:'같은 파라미터 예산을 깊이에 쓸지 너비에 쓸지에 따라 사전학습과 하류 성능의 순위가 달라진다(Table 3 사례 기준).',
 left:{t:'얕고 넓게: NL12-XXL', items:['12층 · d_ff 65536 · 3.6B','PPL -1.46 (더 좋음)','하류 평균 더 낮음: 85.1/76.5/88.1']},
 right:{t:'깊고 좁게: NL32-XL', items:['32층 · d_ff 16384 · 3.8B','PPL -1.49 (더 나쁨)','하류 평균 더 높음: 86.9/79.9/89.5']}
},

numbers:[
 {k:'실험 규모', v:'5M~30B, 200+ 설정', d:'전부 사전학습+미세조정까지 완주, 17개 GLUE/SuperGLUE/SQuAD 과제'},
 {k:'DeepNarrow 절감', v:'파라미터 -50% · 속도 +40%', d:'T5-Base와 동급 하류 품질을 훨씬 적은 비용으로 달성 (초록)'},
 {k:'Small 16L vs Base', v:'파라미터 -50%, FLOPs 63.1%, 속도 +40%', d:'134M(16층)이 223M(12층) Base와 하류 성능 동급'},
 {k:'Large 36L vs XL', v:'파라미터 37%, FLOPs 더 낮음', d:'621M→1.1B(36층) 모델이 2.9B XL을 GLUE/SGLUE/SQuAD 전부에서 앞섬'},
 {k:'Table 3 반례', v:'PPL -1.46 vs -1.49', d:'사전학습 더 좋은 NL12-XXL이 하류에서는 NL32-XL(PPL 더 나쁨)에 뒤짐'},
 {k:'파레토 수렴 지점', v:'32~36층', d:'이 이상 층을 늘려도 절대 성능은 오르지만 컴퓨트 대비 이득은 정체'}
],

impact:'이 논문은 [스케일링 법칙](#/p/scaling-laws)이 다루지 않은 축을 열었다. Kaplan et al.과 이후의 [Chinchilla](#/p/chinchilla)는 "파라미터 수와 데이터 양을 얼마씩 늘릴까"에 집중했지만, 이 논문은 **같은 파라미터 수 안에서 모델을 어떤 형태로 빚을까**를 묻는다. 실무적으로는 T5 계열 모델 설계에 DeepNarrow 전략(깊이 우선, 32~36층에서 수렴)이라는 구체적 처방을 남겼고, 사전학습 손실만으로 모델을 고르는 관행에 경고를 걸었다. 100개 넘는 체크포인트를 공개해 후속 스케일링 연구의 표준 데이터셋 역할도 했다.',

legacy:[
 '**모양(shape)의 재발견** — 스케일링 논의가 "크기" 단일 축에서 "크기 × 모양" 2축으로 확장되는 계기가 됨',
 '**하류 성능 중심 스케일링 연구** — 사전학습 지표만으로 판단하지 말라는 문제의식이 이후 [Chinchilla](#/p/chinchilla) 등 compute-optimal 연구에서도 반복 등장',
 '**DeepNarrow가 이후 T5 파생 모델 설계에 참고 레퍼런스로 남음** — 동시대 Charformer의 "Tall" 전략도 이 아이디어의 변형',
 '**공개 체크포인트 100개+** — 스케일링 거동을 재현·재검증하려는 후속 연구의 데이터 소스가 됨'
],

pitfalls:[
 '**사전학습 perplexity만 보고 모델을 고르면 안 된다.** Table 3처럼 PPL이 더 나쁜 모델이 미세조정 후 모든 하류 과제에서 이길 수 있다 — 이 논문의 가장 중요한 경고다.',
 '**"깊이가 항상 이긴다"가 아니다.** 저자들도 층 스케일링은 디바이스 간 병렬화가 안 되고(앞 층 출력을 기다려야 함), 32~36층을 넘으면 컴퓨트 대비 이득이 줄어든다고 명시한다. 무한정 깊게 쌓으라는 뜻이 아니다.',
 '**작은 컴퓨트 구간에서 찾은 스케일링 처방을 큰 모델에 그대로 외삽하면 안 된다.** 4.2절에서 컴퓨트 구간마다 어느 축이 파레토 경계를 미는지가 다르다는 것을 직접 보였다.'
],

figures:[
 {f:'fig1-upstream-vs-downstream.png',
  cap:'왼쪽: 사전학습 negative log-perplexity는 파라미터 수와 거의 일직선(파란 점들이 깔끔한 상승 곡선). 오른쪽: 같은 모델들을 SuperGLUE로 미세조정하면 순서가 뒤섞인다 — 예컨대 NL32-XL(왼쪽 삼각형)이 왼쪽 그래프에서는 중간 순위지만 오른쪽에서는 최상위로 올라간다.',
  src:'원문 Figure 1, p.5'}
],

quotes:[
 {t:'Our findings show that pre-training perplexity can often be a deceiving indicator of downstream quality and therefore model building based on upstream perplexity can be challenging.',
  src:'Contributions, p.2'},
 {t:'We generally recommend a DeepNarrow strategy where the model’s depth is preferentially increased before considering any other forms of uniform scaling across other dimensions.',
  src:'Section 4.4, p.7'}
],

links:[
 {t:'arXiv 2109.10686 — Scale Efficiently', u:'https://arxiv.org/abs/2109.10686'},
 {t:'google-research/scaling-transformers (체크포인트·코드)', u:'https://github.com/google-research/google-research/tree/master/scaling_transformers'}
]
});
