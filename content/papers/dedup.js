WIKI.paper({
slug:'dedup',
venue:'ACL 2022 (arXiv 2021)',
authors:'Lee, Ippolito et al. (Google Research, Brain Team · UPenn)',
arxiv:'2107.06499',

tldr:'C4, RealNews, LM1B, Wiki-40B 같은 표준 LM 학습 데이터셋을 열어보니 **중복 문서가 수두룩했다**는 것을 실측으로 보인 논문. suffix array 기반 정확 부분열 매칭과 MinHash 기반 근사 매칭 두 가지로 중복을 제거하면, 같은 모델이 학습 데이터를 그대로 뱉어내는 빈도가 10배 줄고 학습도 더 적은 스텝으로 끝난다.',

context:'2021년 시점 LM 학습 데이터는 이미 기가바이트에서 테라바이트 단위로 커졌고, [The Pile](#/p/the-pile)처럼 여러 소스를 섞은 대형 코퍼스도 등장한 상태였다. 그런데 이 데이터들은 사람이 일일이 검수하기엔 너무 커서, C4나 RealNews처럼 "이미 중복 제거를 했다"고 명시한 데이터셋조차 실제로는 완벽하지 않았다. 기존 dedup은 URL이나 문서 해시 같은 **거친 기준**으로만 걸러서, 문장 몇 개만 바뀐 근사 중복이나 긴 코퍼스 안에 파묻힌 부분 중복은 통과시켰다. 문제는 단순히 저장 공간 낭비가 아니다 — 중복된 문장은 학습 중 여러 번 반복해서 보이므로 모델이 그 문장을 **암기**하게 되고, 검증셋에 학습셋과 겹치는 문서가 섞이면 평가 점수 자체가 부풀려진다. 이 논문은 "얼마나 심각한가"를 직접 세고, 스케일이 되는 두 가지 제거 도구를 만들어 검증한다.',

ideas:[
 {h:'ExactSubstr: suffix array로 긴 반복 부분열을 찾는다',
  lead:'전체 데이터셋을 하나의 시퀀스로 이어붙여 suffix array를 만들고 50토큰 이상 겹치는 구간을 찾는다.',
  d:'데이터셋 전체 문서를 바이트 단위로 이어붙여 거대한 시퀀스 $S$ 를 만들고, 그 suffix array $A$ 를 구성한다. suffix array에서는 같은 접두어를 공유하는 부분열들이 서로 인접하게 정렬되므로, 배열을 한 번 선형 스캔하면서 **연속한 두 접미사가 얼마나 길게 일치하는지**만 재면 반복 구간을 전부 찾아낼 수 있다. 임계값 이상 겹치는 구간은 한쪽만 남기고 제거한다.'},
 {h:'50토큰 임계값: knee 지점의 2배로 보수적으로 잡는다',
  lead:'우연히 겹칠 확률이 꺾이는 지점(약 10토큰)의 2배인 50토큰을 컷오프로 쓴다.',
  d:'길이 $k$ 부분열이 데이터셋 어딘가에 또 나타날 확률 $m(k)$ 를 실측하면 $k$ 가 커질수록 급격히 떨어지다가 약 10토큰 근방에서 꺾인다(짧은 구절은 우연히도 자주 겹친다). 저자들은 25토큰 매칭을 수작업 검사해 오탐이 없음을 확인한 뒤, 안전 마진을 위해 그 값을 두 배로 늘려 **50토큰**을 최종 임계값으로 정했다.'},
 {h:'NearDup: MinHash로 문서 단위 근사 중복을 잡는다',
  lead:'문서를 n-gram 집합으로 보고 MinHash 서명으로 Jaccard 유사도가 높은 쌍을 스캔 없이 찾는다.',
  d:'ExactSubstr는 글자 하나만 달라도 매칭이 끊긴다. 반면 실제 중복 상당수는 지명·날짜·상품명 몇 개만 바뀐 **거의 같은 문서**다. 이런 경우를 잡기 위해 문서를 5-gram 집합으로 보고 MinHash로 서명을 만들어 두 문서의 Jaccard 유사도를 추정한다. LSH(band-and-row) 구성으로 후보 쌍만 골라낸 뒤, 실제 Jaccard 값이 0.8을 넘고 편집 유사도 조건까지 만족하면 근사 중복으로 판정한다. 서로 연결된 문서들은 하나의 클러스터로 묶어 하나만 남긴다.'},
 {h:'CPU만으로 선형 시간, C4 전체를 12시간에 처리',
  lead:'GPU 없이 병렬 suffix array 알고리즘만으로 350GB C4를 12시간(약 1000 CPU-시간)에 처리한다.',
  d:'350GB짜리 C4의 suffix array를 통째로 메모리에 올리는 대신, 부분 suffix array를 병렬로 만들고 병합하는 divide-and-conquer 절차를 쓴다. suffix array 자체는 원본 텍스트의 약 8배 공간을 차지하지만, 디스크에 두고 스트리밍하는 방식으로 전체 처리를 감당한다. 이 덕분에 제거 작업 자체가 이후 학습에서 절약하는 시간보다 훨씬 짧게 끝난다.'},
 {h:'학습·평가 양쪽에 효과가 있다',
  lead:'중복 제거는 암기 감소뿐 아니라 학습 효율과 평가 신뢰도까지 함께 개선한다.',
  d:'저자들은 세 가지 효과를 따로 측정했다. 첫째 학습 데이터가 최대 19% 줄어 같은 정확도를 더 적은 스텝에 도달한다. 둘째 검증셋에서 학습셋과 겹치는 문서를 골라내면 그 서브셋에서만 인위적으로 낮았던 perplexity가 드러나 **평가 자체가 더 정직**해진다. 셋째 학습셋 안의 중복이 줄면서 모델이 특정 문장을 통째로 암기해 그대로 뱉어내는 빈도가 줄어든다.'}
],

diagram:{type:'compare', cap:'같은 "중복 제거"라도 잡아내는 범위가 다르다. ExactSubstr는 원본 그대로 반복된 긴 구간을, NearDup은 몇 단어만 바뀐 문서 쌍을 잡는다.',
 left:{t:'ExactSubstr', items:['토큰 단위 완전 일치만 탐지','임계값 50토큰 이상 구간 제거','부분 문서 단위 제거 가능']},
 right:{t:'NearDup', items:['n-gram 집합의 Jaccard 유사도','유사도 0.8 이상을 근사 중복 판정','문서 전체 단위로 클러스터 제거']}},

math:[
 {expr:'Jaccard(di, dj) = |di ∩ dj| / |di ∪ dj|',
  tex:'\\text{Jaccard}(d_i, d_j) = \\frac{|d_i \\cap d_j|}{|d_i \\cup d_j|}',
  d:'문서 $d_i$, $d_j$ 를 n-gram 집합으로 볼 때 두 집합의 교집합 대 합집합 비율. NearDup이 "얼마나 겹치는가"를 정의하는 유사도 척도다.'},
 {expr:'Pr[match] = 1 − (1 − s^b)^r',
  tex:'\\Pr(d_i, d_j \\mid \\text{Jaccard}=s_{i,j}) = 1-(1-s_{i,j}^{b})^{r}',
  d:'MinHash 서명을 $b$ 개씩 묶어 $r$ 개 밴드로 LSH 처리할 때, 실제 Jaccard 유사도가 $s_{i,j}$ 인 두 문서가 후보 쌍으로 걸릴 확률. $b$, $r$ 을 조절해 임계값 0.8 근방에서 급격히 갈리도록(S자 곡선) 설계한다.'},
 {expr:'m(k) = Pr[ ∃ j≠i : S[i..i+k] = S[j..j+k] ]',
  tex:'m(k) = \\Pr_{i \\in [N]}\\left[\\exists\\, j \\neq i : S_{i..i+k} = S_{j..j+k}\\right]',
  d:'길이 $k$ 인 부분열이 데이터셋 어딘가에 다시 등장할 확률. 이 곡선이 약 10토큰에서 꺾이는 지점을 근거로 50토큰 임계값을 정했다.'}
],

numbers:[
 {k:'61단어 문장 반복', v:'61,036회', d:'C4 학습셋에 그대로 반복된 한 문장 (검증셋에도 61회, 각 셋의 0.02%)'},
 {k:'무프롬프트 생성 중 암기 비율', v:'1.926% → 0.189%(NearDup) / 0.138%(ExactSubstr)', d:'1.5B XL 모델, 100k개 무프롬프트 생성물 중 50토큰 이상 학습 데이터와 일치하는 비율'},
 {k:'C4 근사 중복 비율', v:'3.04%', d:'학습 예제 기준. RealNews는 13.63%로 네 데이터셋 중 최고'},
 {k:'검증-학습 오버랩', v:'C4 4.60% · RealNews 14.35%', d:'검증셋 예제 중 학습셋에 근사 중복이 있는 비율(NearDup 기준)'},
 {k:'ExactSubstr 토큰 제거량', v:'C4 7.18% · RealNews 19.4%', d:'50토큰 이상 정확 중복 구간에 속한 토큰의 비율'},
 {k:'중복 임계값', v:'50 토큰', d:'우연 일치가 꺾이는 지점(약 10토큰)의 2배로 보수적으로 설정'}
],

impact:'이 논문 이후 대규모 LM 학습 파이프라인에서 dedup은 선택이 아니라 **기본 전처리 단계**가 됐다. [GPT-3](#/p/gpt3) 이후의 대형 모델 보고서 대부분이 데이터 중복 제거 절차를 명시하기 시작했고, 저자들이 공개한 `deduplicate-text-datasets` suffix-array 구현이 이후 여러 코퍼스 정제 파이프라인의 표준 도구로 쓰였다. 무엇보다 "중복 제거는 데이터를 줄이는 손해가 아니라 같은 계산으로 더 나은 모델을 얻는 이득"이라는 것을 실측으로 보여, 데이터 품질 연구를 스케일링 경쟁의 곁가지가 아니라 핵심 축으로 올려놓았다.',

legacy:[
 '[The Pile](#/p/the-pile) 이후 공개 코퍼스들이 문서 해시·MinHash 기반 dedup 단계를 파이프라인에 명시적으로 포함하기 시작',
 '[RefinedWeb](#/p/refinedweb)이 이 논문의 fuzzy dedup을 대규모 CommonCrawl 정제 파이프라인의 핵심 단계로 채택',
 '[Extracting Training Data from Large Language Models](#/p/extracting-training-data)와 함께 "학습 데이터 암기"를 측정 가능한 문제로 만든 두 축의 연구로 자주 같이 인용됨',
 '이후 LLM 기술보고서들이 "데이터 중복 제거"를 사전학습 섹션에 별도 항목으로 기술하는 관행의 시작점'
],

pitfalls:[
 '**"중복 제거 = 데이터가 준다 = 손해"가 아니다.** C4 기준 데이터가 최대 19% 줄어도 같은 정확도를 더 적은 스텝에 도달했고, XL 모델의 LM1B/Wiki-40B perplexity는 오히려 더 낮았다.',
 '**두 방법은 서로 대체재가 아니라 보완재다.** ExactSubstr는 문장 내부의 긴 반복을, NearDup은 문서 전체가 살짝 바뀐 근사 중복을 잡는다 — 실제로 NearDup이 C4에서 제거한 예제의 77%만 ExactSubstr의 50토큰 매칭과 겹친다.',
 '**임계값이 결과를 좌우한다.** 50토큰, Jaccard 0.8은 저자들이 수작업 검사로 정한 값이지 이론적으로 유도된 최적값이 아니다. 다른 도메인·언어에 그대로 적용하면 오탐/누락 비율이 달라질 수 있다.'
],

figures:[
 {f:'table1-examples.png',
  cap:'Wiki-40B·LM1B·C4에서 NearDup이 잡아낸 근사 중복 쌍의 실제 예. 노란 하이라이트가 두 문서의 공통 부분이고, 흰 배경 단어(도시명·연도·국가명 등)만 바뀌었다 — 이런 패턴은 exact matching으로는 못 잡는다.',
  src:'원문 Table 1, p.5'},
 {f:'fig2-perplexity.png',
  cap:'T5 XL을 C4-Original/NearDup/ExactSubstr로 각각 학습시킨 뒤 다섯 검증셋에서 잰 perplexity. "C4 Duplicates"(학습셋과 겹치는 검증 예제)에서만 Original이 유독 낮은 값을 보이는데, 이는 좋은 일반화가 아니라 암기로 부풀려진 점수임을 보여준다.',
  src:'원문 Figure 2, p.6'}
],

quotes:[
 {t:'We find that existing language modeling datasets contain many near-duplicate examples and long repetitive substrings.',
  src:'Abstract, p.1'},
 {t:'Deduplication allows us to train models that emit memorized text ten times less frequently and require fewer training steps to achieve the same or better accuracy.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2107.06499 — Deduplicating Training Data Makes Language Models Better', u:'https://arxiv.org/abs/2107.06499'},
 {t:'GitHub — google-research/deduplicate-text-datasets', u:'https://github.com/google-research/deduplicate-text-datasets'}
]
});
