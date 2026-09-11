WIKI.concept({
slug:'inference-params',

tldr:'생성 API 호출 시 넘기는 temperature·top_p·top_k·max_tokens·stop·penalty·seed·n 등, 출력의 다양성·길이·비용을 조절하는 파라미터들의 모음.',

why:'같은 프롬프트라도 이 파라미터 조합에 따라 출력이 결정적이었다가 창의적으로, 짧았다가 길게, 반복적이었다가 다양하게 바뀐다. 파라미터마다 무엇을 조절하는지, 그리고 여러 개를 같이 쓸 때 **어떤 순서로 적용되는지**를 모르면 "top_p 를 낮췄는데 왜 결과가 안 바뀌지"처럼 원인을 못 찾는 디버깅에 빠진다.',

sections:[
 {h:'분포를 바꾸는 파라미터', d:'[temperature](#/c/temperature) 는 logit 을 나눠 분포의 뾰족함 자체를 바꾸고, [top_p·top_k](#/c/top-k-top-p) 는 그 분포에서 후보로 남길 토큰 집합을 자른다. 세 파라미터는 서로 다른 축(모양 vs 후보 집합)을 조절하므로 함께 쓰는 것이 일반적이며, 자세한 정의와 극단값 동작은 각 문서를 참고한다. frequency_penalty·presence_penalty 는 이미 나온 토큰의 logit 을 깎아 반복을 줄이는 파라미터다 — frequency_penalty 는 등장 횟수에 비례해 깎고, presence_penalty 는 한 번이라도 나왔으면 등장 횟수와 무관하게 고정폭으로 깎는다는 차이가 있다.'},
 {h:'적용 순서', d:'대부분의 구현에서 한 스텝의 토큰 확률은 다음 순서로 만들어진다. (1) 모델이 원시 logit 을 낸다. (2) frequency_penalty·presence_penalty 로 이미 나온 토큰의 logit 을 깎는다. (3) temperature 로 전체 logit 을 나눠 분포 모양을 바꾼다. (4) top_k 로 상위 k 개만 남긴다. (5) 남은 후보에서 top_p 로 누적 확률 기준을 다시 자른다. (6) 최종 분포에서 샘플링한다. 이 순서가 중요한 이유는, 예를 들어 penalty 를 temperature 이후에 적용하는 구현이라면 같은 penalty 값이라도 체감 효과가 달라지기 때문이다 — 실제 순서는 API·프레임워크마다 다를 수 있으므로 문서로 확인하는 것이 안전하다.'},
 {h:'길이·종료 조절', d:'max_tokens 는 생성할 수 있는 최대 토큰 수의 상한이다 — 이 값에 도달하면 문장이 끝나지 않아도 강제로 끊긴다. stop 은 지정한 문자열(또는 토큰 시퀀스)이 나오면 그 즉시 생성을 멈추는 조건으로, 형식이 정해진 출력(예: 특정 구분자까지만 생성)을 만들 때 유용하다. 둘 다 비용(토큰 수)과 직결되므로, max_tokens 를 너무 낮게 잡으면 답이 중간에 잘리고 너무 높게 잡으면 불필요한 비용이 든다.'},
 {h:'재현성과 다중 생성', d:'seed 는 같은 입력·같은 파라미터에서 같은 (혹은 거의 같은) 출력을 재현하도록 난수 생성을 고정하는 값이다 — 디버깅이나 A/B 비교 시 유용하지만, 모델·인프라 구현에 따라 완전한 결정성을 보장하지 않을 수 있다. n 은 한 번의 요청으로 서로 다른 완성(completion)을 여러 개 받는 파라미터로, [Self-Consistency](#/p/self-consistency) 같은 다수결 기법에 쓰인다 — 다만 n 개를 받으면 비용도 n 배로 든다는 점을 감안해야 한다.'},
 {h:'실무에서', d:'정답이 정해진 작업(코드, 함수 호출, 분류)은 temperature 를 낮추고 top_p 는 기본값 근처로 두는 조합이 흔한 관행이다. 반복이 심한 출력에는 frequency_penalty 를 먼저 의심하고, 응답이 중간에 끊긴다면 max_tokens 부터 확인하는 것이 순서다. seed 는 재현이 필요한 평가·디버깅 파이프라인에서, n 은 다수결 기반 품질 향상이 필요할 때 켜는 식으로 목적에 맞춰 조합한다.'}
],

diagram:{type:'matrix', cap:'추론 파라미터가 조절하는 축과 적용 위치.',
 cols:['조절하는 것','적용 순서상 위치'],
 rows:[
  {label:'frequency/presence penalty', cells:['반복 억제','logit 단계 초반']},
  {label:'temperature', cells:['분포 뾰족함','logit 나누기']},
  {label:'top_k / top_p', cells:['후보 집합 크기','분포 이후 절단']},
  {label:'max_tokens / stop', cells:['출력 길이·종료','샘플링과 무관']},
  {label:'seed / n', cells:['재현성·다중생성','샘플링 절차 자체']}
 ]},

confuse:[
 {a:'frequency_penalty', b:'presence_penalty', d:'frequency_penalty 는 토큰이 나온 횟수에 비례해 logit 을 깎아 여러 번 반복될수록 더 강하게 억제하고, presence_penalty 는 한 번이라도 등장했으면 횟수와 무관하게 고정폭으로만 깎는다. 반복 억제가 목적이면 frequency, 이미 언급한 주제를 다시 꺼내지 않게 하는 게 목적이면 presence 가 더 맞는 손잡이다.'},
 {a:'max_tokens', b:'stop', d:'max_tokens 는 토큰 개수라는 상한으로 강제 종료시키는 것이고, stop 은 특정 문자열이 나타나는 순간 의미상 자연스럽게 종료시키는 것이다. 형식을 통제하려면 stop 을, 비용 상한을 걸려면 max_tokens 를 쓴다 — 보통 둘 다 함께 설정한다.'},
 {a:'seed', b:'temperature=0', d:'temperature=0 은 매 스텝 가장 확률 높은 토큰만 고르는 탐욕적 디코딩에 가깝게 만들어 다양성을 없애는 것이고, seed 는 무작위성 자체가 있는 샘플링(temperature>0) 상황에서 그 난수를 고정해 반복 실행 시 같은 결과가 나오게 하는 것이다. 목적이 다르다 — 완전한 결정성을 원하면 temperature 를 낮추고, 다양성은 유지하되 재현만 원하면 seed 를 고정한다.'}
],

pitfalls:[
 'top_p 를 낮췄는데 결과가 안 바뀐다면 temperature 가 이미 0에 가까워 후보 집합 자체가 하나뿐인 경우일 수 있다 — 두 파라미터의 상호작용을 먼저 의심해야 한다.',
 'max_tokens 를 넉넉히 크게 잡아도 안전하다고 생각하기 쉽지만, 모델이 종료 토큰을 안 내면 그 상한까지 다 채워 비용이 커질 수 있다.',
 'seed 를 고정하면 항상 100% 같은 출력이 나온다고 기대하기 쉽지만, 부동소수점 연산이나 배치 구성 차이로 완전한 재현이 보장되지 않는 구현도 있다.',
 'n 을 늘려 여러 완성을 받으면 품질이 좋아진다고만 생각하기 쉽지만, 비용이 n 배로 늘고 그 중 무엇을 최종 답으로 고를지(다수결, 랭킹 등) 별도 로직이 필요하다.',
 'penalty·temperature·top_p 를 동시에 극단값으로 몰아넣으면 서로의 효과가 상쇄되거나 증폭돼 예측하기 어려운 출력이 나올 수 있다 — 한 번에 하나씩 바꿔가며 영향을 확인하는 편이 안전하다.',
 '파라미터 기본값이 모든 API 제공자에서 같다고 가정하기 쉽지만, 같은 이름의 파라미터라도 기본값·적용 범위(예: penalty가 로그 스케일인지 선형인지)가 제공자마다 달라 API를 바꿀 때 결과가 달라질 수 있다.'
],

code:{lang:'text', d:'한 스텝의 토큰 확률이 만들어지는 순서를 의사코드로 표현한 것.', src:
'logits = model.forward(input)\n'+
'logits = apply_penalty(logits, freq_penalty, presence_penalty, history)\n'+
'logits = logits / temperature\n'+
'candidates = top_k(logits, k)\n'+
'candidates = top_p(candidates, p)\n'+
'token = sample(candidates, seed=seed)\n'+
'# stop 문자열 도달 또는 길이==max_tokens 이면 종료'},

papers:['nucleus-sampling','ifeval','self-consistency'],
terms:['temperature','top-k-top-p','test-time-compute']
});
