WIKI.paper({
slug:'codesearchnet',
venue:'arXiv 2019 (GitHub · Microsoft Research)',
authors:'Husain, Wu, Gazit (GitHub), Allamanis, Brockschmidt (Microsoft Research)',
arxiv:'1909.09436',

tldr:'자연어 질의로 코드를 찾는 **semantic code search** 과제를 위해 600만 함수 규모의 코퍼스와 사람이 라벨링한 평가셋(CodeSearchNet Challenge)을 함께 공개한 논문. 정답이 없던 이 과제에 처음으로 대규모 학습 데이터와 표준 평가 절차를 준 것이 핵심 기여다.',

context:'코드 검색은 자연어 문서 검색과 달리 질의(자연어)와 결과(코드) 사이에 **공유 어휘가 거의 없다** — `deserialize_JSON_obj_from_stream` 같은 함수명이 "JSON 데이터 읽기"라는 질의의 정답이어도 표면적으로 겹치는 단어가 없다. 더 큰 문제는 평가였다. 이 과제를 위한 대규모 데이터셋이 없어서 연구자들이 포럼 질문과 답변 코드 조각을 짜맞춘 소규모 대용 데이터로 버텨왔다. 저자들은 "학습용 대규모 프록시 데이터"와 "평가용 소규모 정밀 라벨"을 분리해서 두 문제를 각각 해결했다.',

ideas:[
 {h:'문서화 주석을 자연어 라벨로 쓰는 프록시 학습 데이터',
  lead:'전문가 라벨링은 비용이 커서, GitHub 함수와 그 docstring을 자동으로 짝지어 대규모 학습 코퍼스를 만든다.',
  d:'라이선스가 명확한 non-fork 공개 저장소를 인기도(star·fork)로 정렬해 수집하고, TreeSitter로 6개 언어(Go·Java·JavaScript·PHP·Python·Ruby)의 함수를 파싱한 뒤 정규식 휴리스틱으로 문서화 주석을 추출해 짝짓는다. 너무 짧은 설명·생성자·보일러플레이트 테스트는 제거하는 등 여러 필터링 휴리스틱을 거친다.'},
 {h:'CodeSearchNet Challenge: 전문가 라벨 평가셋',
  lead:'99개 실제 질의에 대해 사람이 0~3점 관련도를 매긴 약 4천 건의 정밀 평가셋을 별도로 만든다.',
  d:'학습 데이터의 docstring-함수 짝은 노이즈가 있어 평가 기준으로 쓰기 부적합하다. 그래서 실제 있을 법한 질의 99개를 뽑아, 각 언어의 베이스라인 모델이 추린 후보 함수를 사람 전문가가 0(전혀 무관)~3(정확히 일치) 척도로 직접 채점했다. 891개 중복 라벨링 쌍의 Cohen `κ`는 0.47로, 이 과제가 본질적으로 **모호하다**는 점도 함께 드러났다.'},
 {h:'인코더 두 개 + 거리로 검색을 근사',
  lead:'코드 인코더와 질의 인코더를 각각 128차원 벡터로 사상해 내적을 유사도로 쓴다.',
  d:'코드 토큰과 질의 토큰을 각각 시퀀스 인코더(NBoW·양방향 RNN·1D CNN·self-attention)에 통과시켜 128차원 임베딩을 얻고, 같은 짝의 코드·질의 벡터는 가깝게, 서로 다른 짝(distractor)은 멀게 하는 대조 손실로 학습한다. 벡터 하나만 저장하면 되어 색인과 검색이 효율적이라는 실용적 이유로 이 구조를 택했다.'},
 {h:'NDCG의 두 변형으로 커버리지 편향을 통제',
  lead:'라벨된 부분만 보는 "Within"과 코퍼스 전체를 보는 "All" 두 방식으로 NDCG를 나눠 보고한다.',
  d:'사람이 라벨링한 함수는 코퍼스 전체의 일부일 뿐이라, 전체 코퍼스 기준으로 순위를 매기면 라벨되지 않은 진짜 관련 결과를 "틀렸다"고 오판할 수 있다. 두 지표를 나란히 보고해 이 편향을 명시적으로 드러냈다.'}
],

diagram:{type:'flow', cap:'baseline 모델 구조. 코드와 질의를 각자 시퀀스 인코더에 통과시켜 얻은 두 임베딩 사이의 거리로 관련도를 판단한다.',
 nodes:[
  {t:'코드 토큰', s:'서브토큰 분할'},
  {t:'코드 인코더', s:'NBoW/RNN/CNN/SelfAttn'},
  {t:'거리 비교', s:'내적 유사도', acc:true},
  {t:'질의 인코더', s:'BPE 서브워드'},
  {t:'질의 토큰', s:'자연어 docstring'}
 ]},

math:[
 {expr:'L = -(1/N) Σ_i log( exp(E_c(c_i)ᵀE_q(d_i)) / Σ_j exp(E_c(c_j)ᵀE_q(d_i)) )',
  tex:'\\mathcal{L}=-\\frac{1}{N}\\sum_i \\log\\!\\left(\\frac{\\exp(E_c(\\mathbf{c}_i)^{\\top}E_q(\\mathbf{d}_i))}{\\sum_j \\exp(E_c(\\mathbf{c}_j)^{\\top}E_q(\\mathbf{d}_i))}\\right)',
  d:'같은 짝 $(c_i, d_i)$ 의 코드-질의 내적은 키우고, 배치 안 다른 코드 $c_j$ ($j \\ne i$, distractor)와의 내적은 낮추는 대조 학습 목적함수. 테스트에서는 짝마다 999개의 distractor를 두고 순위를 매긴다.'}
],

numbers:[
 {k:'코퍼스 규모', v:'약 600만 함수', d:'6개 언어(Go·Java·JavaScript·PHP·Python·Ruby) 오픈소스에서 수집'},
 {k:'문서화 짝(학습용)', v:'약 200만 함수', d:'함수-docstring 자동 추출 짝'},
 {k:'평가 질의 수', v:'99개', d:'CodeSearchNet Challenge 버전 1.0'},
 {k:'전문가 라벨 수', v:'약 4천 건', d:'0(무관)~3(정확 일치) 관련도 점수'},
 {k:'annotator 합치도', v:'Cohen κ = 0.47', d:'891개 중복 라벨링 쌍 기준 — 모호한 과제임을 시사'},
 {k:'baseline 최고 성능', v:'NBoW(All 기준) / Self-Attention(distractor 999 랭킹)', d:'평가 방식에 따라 가장 단순한 모델과 가장 큰 모델이 각각 우세'}
],

impact:'코드-자연어 매칭을 위한 대규모 공개 코퍼스와 표준 평가 절차가 처음으로 갖춰지면서, 이후 코드 표현 학습 연구가 임의의 소규모 데이터 대신 이 벤치마크로 수렴했다. 특히 함수-docstring 짝이라는 프록시 학습 신호는 이후 [CodeBERT](#/p/codebert) 등 코드 사전학습 모델의 학습·평가 데이터로 그대로 흡수됐다. NDCG의 Within/All 구분처럼 "라벨되지 않은 정답이 있을 수 있다"는 문제의식도 이후 검색 벤치마크 설계에 영향을 줬다.',

legacy:[
 '**[CodeBERT](#/p/codebert)** 등 코드-자연어 사전학습 모델의 학습·평가 데이터로 CodeSearchNet 코퍼스가 직접 재사용됨',
 '**CodeXGLUE** 등 후속 코드 이해 벤치마크 모음이 CodeSearchNet의 code search task를 그대로 하위 과제로 편입',
 '함수-docstring 자동 페어링이라는 데이터 수집 레시피가 이후 대규모 코드-텍스트 데이터셋 구축의 표준 패턴이 됨',
 'Weights & Biases 리더보드 운영 방식이 이후 커뮤니티 벤치마크 챌린지의 참고 사례가 됨'
],

pitfalls:[
 '**학습 데이터(docstring 짝)와 평가 데이터(전문가 라벨)는 품질이 다르다.** 논문 스스로 문서화 주석 기반 짝을 "저품질 프록시"라고 명시했다 — 학습에서 높은 점수가 곧 실제 검색 품질을 보장하지 않는다.',
 '**NDCG "All"과 "Within" 수치를 섞어 비교하면 안 된다.** 같은 모델도 두 지표에서 순위가 달라질 수 있다(NBoW가 All에서 강세, self-attention이 distractor 랭킹에서 강세).',
 '**Cohen κ=0.47은 낮은 편이다.** 이 과제의 "정답"이 사람 사이에서도 완전히 합의되지 않는다는 뜻이므로, 이 벤치마크의 절대 점수를 다른 정밀 라벨 과제와 같은 잣대로 비교하면 안 된다.'
],

figures:[
 {f:'fig3-dualencoder.png',
  cap:'위쪽이 코드 토큰을 인코더에 통과시켜 얻은 Code Embedding, 아래쪽이 질의 토큰을 같은 구조의 별도 인코더에 통과시켜 얻은 Query Embedding. 두 벡터 사이의 Distance(내적)가 관련도 점수가 된다 — 코드와 질의가 하나의 공유 벡터 공간에 사상된다는 것이 이 구조의 핵심.',
  src:'원문 Figure 3, p.4'}
],

quotes:[
 {t:'Semantic code search is the task of retrieving relevant code given a natural language query.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1909.09436 — CodeSearchNet Challenge', u:'https://arxiv.org/abs/1909.09436'},
 {t:'CodeSearchNet GitHub', u:'https://github.com/github/CodeSearchNet'}
]
});
