WIKI.paper({
slug:'multinli',
venue:'NAACL 2018 (arXiv 2017)',
authors:'Williams, Nangia, Bowman (New York University)',
arxiv:'1704.05426',

tldr:'문장 하나(전제)와 문장 하나(가설)의 관계를 entailment/neutral/contradiction 세 가지로 분류하는 자연어추론(NLI) 데이터셋을 **10개 장르**로 확장했다. SNLI가 이미지 캡션 한 장르에 갇혀 있던 것과 달리, matched(훈련에 나온 장르)와 mismatched(안 나온 장르) 두 테스트셋을 나눠 **장르 간 일반화**를 직접 측정하게 만들었다.',

context:'SNLI(Bowman et al., 2015)는 사람이 라벨링한 최초의 대규모 NLI 코퍼스로 attention·memory·구문 구조 기반 표현학습 연구를 여럿 촉발했지만 한계가 뚜렷했다. 전제 문장이 전부 Flickr 이미지 캡션 한 장르에서만 나와서 시제·믿음·양상(modality) 같은 현상이 거의 등장하지 않고 문장도 짧고 단순했다. 그 결과 최고 모델의 정확도가 사람 수준에 근접해 버려 모델 간 미세한 비교를 할 여지가 남지 않았다. 이 논문은 "같은 태스크라도 장르를 바꾸면 훨씬 어려워지는가"라는 질문을 설계 자체에 박아 넣는다.',

ideas:[
 {h:'10개 장르로 전제 문장을 수집한다',
  lead:'구어·문어를 섞은 10개 출처 텍스트에서 전제 문장을 뽑아 언어의 실제 다양성을 반영한다.',
  d:'소설(FICTION), 정부 보고서(GOVERNMENT), 잡지 기사(SLATE), 전화 대화 전사(TELEPHONE), 여행 안내서(TRAVEL), 9/11 위원회 보고서(9/11), 대면 대화(FACE-TO-FACE), 서간문(LETTERS), 학술 출판물(OUP), 언어학 블로그(VERBATIM) 10개 장르에서 전제 문장을 가져온다. 이 중 5개 장르만 훈련셋에 포함되고 나머지 5개는 개발·테스트셋에만 등장한다.'},
 {h:'SNLI와 동일한 수집 절차를 그대로 재사용한다',
  lead:'전제를 주고 사람이 가설 3개(참·불확실·거짓)를 새로 쓰게 하는 SNLI 방식을 그대로 따른다.',
  d:'크라우드워커에게 전제 문장 하나를 주고 "확실히 맞는 문장", "맞을 수도 있는 문장", "확실히 틀린 문장"을 각각 쓰게 해서 entailment·neutral·contradiction 가설을 만든다. 각 쌍은 검증 단계에서 4명이 추가로 라벨을 매겨 총 5개 라벨 중 다수결로 최종 gold label을 정한다.'},
 {h:'matched/mismatched로 장르 일반화를 분리 측정한다',
  lead:'훈련에 나온 5개 장르(matched)와 안 나온 5개 장르(mismatched) 테스트셋을 따로 채점한다.',
  d:'모델이 훈련 장르 안에서만 잘하는지, 완전히 새로운 장르(mismatched)에서도 버티는지를 하나의 벤치마크에서 동시에 확인할 수 있다. 이 구분이 나중에 [GLUE](#/p/glue)의 리더보드에 그대로 두 항목(MNLI-m/MNLI-mm)으로 올라간다.'},
 {h:'433k 규모로 SNLI보다 훨씬 어려운 과제를 만든다',
  lead:'크기는 SNLI(약 55만)에 필적하면서 장르 다양성 때문에 같은 모델의 정확도가 크게 떨어진다.',
  d:'ESIM 같은 SNLI 최고 수준 모델을 그대로 MultiNLI에 학습·평가하면 정확도가 크게 낮아진다. 반대로 라벨 신뢰도(annotator agreement)는 SNLI와 거의 같은 수준으로 유지되도록 장르별 프롬프트를 조정해서, "어려워진 이유가 데이터 품질 저하가 아니라 언어 자체의 복잡성"임을 보였다.'}
],

diagram:{type:'compare', cap:'SNLI와 MultiNLI의 수집 설계 차이. 장르 수를 늘리고 테스트셋을 matched/mismatched로 쪼갠 것이 핵심.',
 left:{t:'SNLI', items:['전제가 이미지 캡션 1장르뿐','문장 짧고 단순','최고 모델이 사람 수준 근접']},
 right:{t:'MultiNLI', items:['전제가 10개 장르','훈련 5장르 · 평가 10장르','matched/mismatched로 일반화 측정']}
},

numbers:[
 {k:'전체 쌍 수', v:'433k', d:'훈련 392,702 + 개발/테스트 각 20,000'},
 {k:'ESIM · matched 정확도', v:'72.3%', d:'MultiNLI로만 학습, SNLI 자체 성능(86.7%)보다 크게 낮음'},
 {k:'ESIM · mismatched 정확도', v:'72.1%', d:'matched와 거의 차이 없음 — 장르 격차가 예상보다 작았음'},
 {k:'unanimous gold label 비율', v:'58.2%', d:'SNLI 58.3%와 거의 동일 — annotator agreement 유지 확인'},
 {k:'개별 라벨 = gold 비율', v:'88.7%', d:'SNLI 89.0%와 근접, 라벨 신뢰도가 떨어지지 않았음을 뒷받침'},
 {k:'SNLI만으로 학습 후 MultiNLI 평가', v:'ESIM 60.7% (matched)', d:'MultiNLI로 직접 학습한 72.3%보다 약 12%p 낮아 도메인 이전의 한계를 보여줌'}
],

impact:'NLI를 단일 장르 벤치마크에서 다장르·교차도메인 평가 틀로 바꿨다. 특히 matched/mismatched 분리 설계는 이후 [GLUE](#/p/glue)에 MNLI 과제로 그대로 채택되며 사전학습 모델 비교의 표준 축이 됐다. 데이터 자체의 새로운 학습 알고리즘은 없지만, "일반화를 어떻게 측정할 것인가"라는 벤치마크 설계 문제에 대한 답을 제시했다.',

legacy:[
 '**[GLUE](#/p/glue)** 9개 과제 중 하나로 편입되어 사전학습 모델 비교의 표준 벤치마크가 됨',
 '이후 등장한 ANLI, XNLI(다국어 확장) 등 NLI 계열 벤치마크가 MultiNLI의 장르 다양화·matched/mismatched 설계를 계승',
 '**annotation artifact** 연구(가설 문장만 보고도 라벨을 맞히는 표면 단서 문제)가 SNLI/MultiNLI 양쪽에서 발견되며 NLI 벤치마크 신뢰성 논쟁의 재료가 됨',
 '[BERT](#/p/bert) 이후 MNLI 파인튜닝이 문장 표현의 전이 성능을 가늠하는 사실상의 표준 중간 과제로 널리 쓰임'
],

pitfalls:[
 '**"어려운 벤치마크"의 의미가 제한적이다.** matched와 mismatched 정확도 차이가 실제로는 크지 않았다(ESIM 기준 72.3% vs 72.1%) — 장르 다양성이 더해졌다고 곧바로 도메인 전이가 어려워진 것은 아니었다.',
 '**annotator agreement가 SNLI와 비슷하다고 데이터 품질이 같은 수준이라는 뜻은 아니다.** 장르별 프롬프트를 따로 설계해서 맞춘 결과이며, 저자들도 이를 명시적으로 공학적 성과로 서술한다.',
 '**SNLI 슬러그가 없으므로 링크하지 않고 평문으로 표기했다** — 이 위키에서 SNLI를 다시 언급할 때도 마찬가지다.'
],

quotes:[
 {t:'MultiNLI accomplishes this by offering data from ten distinct genres of written and spoken English, making it possible to evaluate systems on nearly the full complexity of the language.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1704.05426 — MultiNLI', u:'https://arxiv.org/abs/1704.05426'},
 {t:'공식 데이터셋 페이지', u:'https://cims.nyu.edu/~sbowman/multinli/'},
 {t:'GLUE 벤치마크', u:'https://gluebenchmark.com/'}
]
});
