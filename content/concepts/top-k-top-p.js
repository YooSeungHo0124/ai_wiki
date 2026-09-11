WIKI.concept({
slug:'top-k-top-p',

tldr:'[샘플링](#/c/sampling)할 후보 토큰 집합을 확률 낮은 꼬리를 잘라내 좁히는 두 가지 방법 — 고정 개수로 자르느냐(top-k), 누적 확률로 자르느냐(top-p)의 차이.',

why:'순수 샘플링은 확률이 아무리 낮아도 어휘의 모든 토큰이 뽑힐 여지가 있어, 아주 드물게 말이 안 되는 토큰이 튀어나올 위험이 있다. top-k·top-p 는 그 위험한 꼬리를 미리 잘라 "말이 되는 후보들 안에서만" 다양성을 허용한다 — 대부분의 LLM API 가 기본값으로 켜 두는 이유다.',

sections:[
 {h:'공통점: 후보 집합 절단', d:'둘 다 softmax 로 확률을 구한 뒤, 그 확률에 비례해 무작위로 뽑기 전에 "이 밖의 토큰은 후보에서 제외"라는 필터를 먼저 적용한다. 필터를 통과한 후보들끼리 확률을 다시 정규화한 뒤 그 안에서 샘플링한다. 둘 다 [뉴클리어스 샘플링](#/p/nucleus-sampling) 논문이 정리·제안한 흐름 안에 있다.'},
 {h:'차이: 개수 vs 누적확률', d:'top-k 는 확률 순으로 정렬해 상위 $k$개만 남긴다 — $k$가 고정이라 분포가 평평한 상황(후보가 많아야 할 때)에도 딱 $k$개만 남고, 분포가 뾰족한 상황(후보가 적어야 할 때)에도 굳이 $k$개를 채운다. top-p(뉴클리어스 샘플링)는 확률 순으로 정렬한 뒤 누적 확률이 $p$를 넘는 지점까지만 남긴다 — 분포가 뾰족하면 후보가 몇 개 안 되고, 분포가 평평하면 후보가 자동으로 늘어난다. 이 "상황에 따라 후보 개수가 스스로 변한다"는 적응성이 뉴클리어스 샘플링 논문이 top-k 대비 내세운 핵심 장점이다.'},
 {h:'함께 쓸 때 적용 순서', d:'대부분의 구현은 (1) [temperature](#/c/temperature)로 logit 을 나눠 분포 모양을 바꾸고 → (2) 바뀐 분포에서 top-k 또는 top-p 로 후보를 자르고 → (3) 남은 후보 안에서 재정규화해 샘플링하는 순서를 쓴다. 이 순서를 바꾸면(예: 자르고 나서 temperature 를 적용) 결과가 달라진다 — temperature 를 먼저 적용해야 "분포를 원하는 모양으로 만든 뒤 그 모양 기준으로 자른다"는 의도가 지켜진다. API 를 쓸 때는 라이브러리 문서에서 이 순서를 확인하는 게 안전하다.'},
 {h:'min-p 같은 최신 변형', d:'top-k 는 상황에 안 맞는 고정 개수라는 한계가, top-p 는 확률이 다 뭉개진(평평한) 분포에서 후보가 지나치게 많아질 수 있다는 한계가 각각 있다. min-p 샘플링은 최고 확률 토큰의 확률에 비례해 임계값을 정해 이 둘의 단점을 완화하려는 최근 방식으로, 커뮤니티 구현체(llama.cpp 등)에 먼저 들어온 비교적 새로운 시도다.'}
],

diagram:{type:'compare', cap:'같은 확률분포를 top-k 와 top-p 가 다르게 자른다.',
 left:{t:'top-k=3', items:['확률 순위로 상위 3개 고정','분포가 뾰족해도 3개','분포가 평평해도 3개']},
 right:{t:'top-p=0.9', items:['누적 확률 90%까지 채택','뾰족하면 후보 적음(1~2개)','평평하면 후보 많아짐(10개+)']}},

confuse:[
 {a:'top-k', b:'top-p(뉴클리어스)', d:'top-k 는 "몇 개"를 고정하고, top-p 는 "누적 확률 얼마"를 고정해 개수가 상황마다 달라진다. top-p 가 분포 모양에 더 잘 적응한다는 게 [뉴클리어스 샘플링](#/p/nucleus-sampling) 논문의 주장이다.'},
 {a:'top-k·top-p', b:'[temperature](#/c/temperature)', d:'temperature 는 분포의 뾰족함 자체를 바꾸는 스케일링이고, top-k·top-p 는 그 분포에서 후보 집합을 자르는 필터다. 서로 다른 층위의 조작이라 함께 쓰는 게 일반적이다.'},
 {a:'top-p', b:'[빔 서치](#/c/beam-search)', d:'top-p 는 매 스텝에서 하나의 시퀀스를 확률적으로 이어가는 샘플링 계열이고, 빔 서치는 여러 후보 시퀀스를 동시에 유지하며 전체 시퀀스 확률을 최대화하려는 탐색 계열이다. 목적도 결과 성격도 다르다.'}
],

code:{lang:'python', d:'top-k 와 top-p 필터를 순서대로 적용하는 의사코드.', src:
'def filter_logits(logits, temperature=0.8, top_k=50, top_p=0.9):\n'+
'    logits = logits / temperature\n'+
'    # 1) top-k: 상위 k개 밖은 -inf 로\n'+
'    kth_val = sorted(logits)[-top_k]\n'+
'    logits[logits < kth_val] = -float("inf")\n'+
'    # 2) top-p: 누적확률 p를 넘는 지점 밖은 -inf 로\n'+
'    probs = softmax(logits)\n'+
'    cutoff = cumulative_cutoff(probs, top_p)\n'+
'    logits[probs < cutoff] = -float("inf")\n'+
'    return sample(softmax(logits))'},

pitfalls:[
 'top-k 와 top-p 를 둘 다 매우 낮게(또는 매우 좁게) 설정하면 사실상 탐욕적 디코딩과 다를 바 없어져, 다양성을 기대했는데 매번 비슷한 출력만 나올 수 있다.',
 '적용 순서를 착각해 "top-p 로 자른 뒤 temperature 를 적용"하면 의도한 만큼 다양성이 살아나지 않을 수 있다 — 라이브러리 기본 구현을 신뢰하되, 커스텀 디코딩을 짤 때는 순서를 명시적으로 확인해야 한다.',
 '두 파라미터를 동시에 극단으로 조합(예: top_k=1 인데 temperature=1.5)하면 한쪽 설정이 다른 쪽을 무력화할 수 있다 — top_k=1 은 사실상 top-p 값과 무관하게 항상 1개만 남긴다.'
],

papers:['nucleus-sampling'],
terms:['sampling','temperature','beam-search']
});
