WIKI.paper({
slug:'esmfold',
venue:'bioRxiv 2022 → Science 2023',
authors:'Lin, Akin, Rao, Hie et al. (Meta AI / FAIR)',

tldr:'단백질 서열을 [BERT](#/p/bert)류 언어모델(ESM-2, 최대 150억 파라미터)에 통과시킨 은닉표현만으로 3차원 구조를 직접 예측한다. [AlphaFold](#/p/alphafold)처럼 다중서열정렬(MSA)을 검색할 필요가 없어 정확도는 조금 낮지만 추론이 최대 60배 빠르고, 그 속도로 6억 개가 넘는 메타지놈 서열을 통째로 접어 ESM Metagenomic Atlas를 공개했다.',

context:'AlphaFold2(2021)는 구조 예측 문제를 사실상 풀었지만, 그 정확도는 입력 서열과 비슷한 서열들을 데이터베이스에서 검색해 만드는 MSA에 크게 의존한다. MSA 검색은 서열 하나당 수 분에서 수십 분이 걸리고, 진화적으로 가까운 동족 서열이 적은 orphan 단백질이나 메타지놈에서 새로 발견된 서열에는 애초에 쓸 MSA 자체가 빈약하다. 한편 같은 시기 단백질 언어모델(ESM 계열)은 마스킹된 아미노산을 채우도록 대규모 서열로 사전학습되었을 뿐인데, 그 attention map과 은닉표현 안에 잔기(residue) 간 접촉 정보가 나타난다는 관찰이 쌓이고 있었다. 이 논문의 질문은 단순하다 — **언어모델이 진화 패턴을 이미 압축해 담고 있다면, MSA 검색 없이 서열 하나만으로 구조를 뽑아낼 수 있는가?**',

ideas:[
 {h:'ESM-2: 마스킹 언어모델로 진화 패턴을 흡수',
  lead:'8M~15B 파라미터로 스케일한 단백질 BERT가 구조 정보를 암묵적으로 학습한다.',
  d:'[BERT](#/p/bert)와 동일한 masked language modeling으로 UniRef90의 약 1억 3800만 서열 클러스터를 학습한다. 파라미터를 8M에서 15B까지 네 자릿수 스케일하는 동안 perplexity가 꾸준히 낮아지고, 동시에 언어모델만으로 예측한 접촉맵(contact map) 정확도가 함께 좋아진다. 즉 다음 아미노산을 맞추는 과제가 구조 정보를 부산물로 만들어낸다는 것이 스케일링 실험으로 확인된다.'},
 {h:'Folding trunk: 언어모델 표현을 구조로 변환',
  lead:'ESM-2의 시퀀스·페어 표현을 48개 folding block에 통과시켜 AlphaFold식 구조모듈에 넘긴다.',
  d:'ESM-2의 최종 은닉표현이 folding trunk(48블록)로 들어가 시퀀스 표현과 페어 표현을 번갈아 갱신하고, 그 결과를 AlphaFold2의 구조모듈(SE(3)-equivariant transformer, 8블록)에 넘겨 3차원 좌표와 신뢰도(pLDDT)를 뽑는다. MSA의 row/column attention을 신경망 안에 직접 통합하던 AlphaFold의 Evoformer를 통째로 걷어내고, 그 자리를 사전학습된 언어모델 표현으로 대체한 것이 구조적 핵심이다.'},
 {h:'MSA 없이도 살아남는 정확도',
  lead:'CAMEO TM-score 0.83, CASP14 0.68 — MSA 없는 AlphaFold2(0.41 / 0.38)를 크게 앞선다.',
  d:'MSA를 뺀 AlphaFold2·RoseTTAFold와 비교하면 ESMFold가 압도적으로 우수하다. 다만 원래 조건대로 MSA를 쓴 AlphaFold2(CAMEO 0.88, CASP14 0.85)에는 여전히 못 미친다. 언어모델의 perplexity와 예측 정확도가 강하게 상관되어(CAMEO -0.55, CASP14 -0.67), 언어모델이 "이 서열을 잘 이해했는가"가 구조 예측 성공의 대리 지표로 쓰인다.'},
 {h:'속도가 규모를 가능하게 한다',
  lead:'서열당 초 단위 추론이 6억 개 서열 전체를 2주 만에 접게 해준다.',
  d:'384잔기 서열 기준 V100 GPU 한 장에서 14.2초, AlphaFold2 대비 6배, 짧은 서열에서는 최대 60배 빠르다. MSA 검색(수 분~10분 이상)이 아예 없어지기 때문이다. 이 속도 덕분에 2,000 GPU 클러스터로 MGnify90의 6억 1700만 서열 중 99%를 2주 안에 접었고, 이것이 ESM Metagenomic Atlas가 되었다.'}
],

diagram:{type:'flow', cap:'ESMFold 추론 파이프라인. AlphaFold와 달리 MSA 검색·템플릿 단계가 통째로 사라지고 언어모델 표현이 그 자리를 대신한다.',
 nodes:[
  {t:'단일 서열', s:'아미노산 문자열'},
  {t:'ESM-2', s:'48층, 최대 15B', acc:true},
  {t:'Folding Trunk', s:'48 블록'},
  {t:'구조모듈', s:'SE(3) transformer'},
  {t:'3D 좌표 + pLDDT', s:'원자 해상도'}
 ]},

math:[
 {expr:'perplexity(θ) = exp( -1/N · Σ log p(x_i | x_\\i ; θ) )',
  tex:'\\text{perplexity}(\\theta)=\\exp\\!\\left(-\\frac{1}{N}\\sum_i \\log p(x_i \\mid x_{\\setminus i};\\theta)\\right)',
  d:'ESM-2의 masked language modeling perplexity. 15B 모델은 검증 perplexity 6.37에 도달하며, 이 값이 낮을수록(언어모델이 서열을 잘 "이해"할수록) 구조 예측 TM-score가 높아지는 상관관계가 관찰된다.'}
],

numbers:[
 {k:'ESM-2 최대 크기', v:'15B 파라미터', d:'8M부터 4자릿수 스케일, 논문 당시 최대 단백질 언어모델'},
 {k:'CAMEO TM-score', v:'0.83 (단일서열)', d:'MSA 뺀 AlphaFold2 0.41 · RoseTTAFold 0.47 대비 우세, MSA 포함 AlphaFold2 0.88에는 못 미침'},
 {k:'CASP14 TM-score', v:'0.68 (단일서열)', d:'MSA 뺀 AlphaFold2 0.38 대비 우세, MSA 포함 AlphaFold2 0.85에는 못 미침'},
 {k:'추론 속도', v:'384잔기 14.2초 (V100)', d:'AlphaFold2 대비 6배, 짧은 서열에서 최대 약 60배'},
 {k:'ESM Metagenomic Atlas', v:'6억 1700만 구조', d:'MGnify90의 99%를 2,000 GPU로 2주 만에 예측, 그중 2억 2500만 개가 고신뢰도'}
],

impact:'ESMFold는 구조 예측을 **검색 문제에서 순수 추론 문제**로 바꿨다. MSA 검색·템플릿 없이 서열 하나만 넣으면 되기 때문에 orphan 단백질·설계 단백질·메타지놈 신규 서열처럼 동족 서열이 희박한 대상에도 곧바로 적용할 수 있다. 이 속도가 곧 규모로 이어져 6억 개가 넘는 메타지놈 서열의 구조를 통째로 예측한 ESM Metagenomic Atlas를 낳았고, 이는 실험적으로 규명된 구조가 없던 미지의 단백질 공간을 대량으로 들여다본 첫 사례가 되었다. 동시에 "언어모델이 진화 정보를 암묵적으로 학습한다"는 명제를 스케일링 곡선으로 직접 입증한 사례로도 인용된다.',

legacy:[
 '**ESM Metagenomic Atlas**(esmatlas.com) 공개로 메타지놈 단백질 구조에 대한 대규모 탐색이 가능해짐',
 '단백질 언어모델을 구조·기능 예측 전반의 기반 표현으로 쓰는 후속 연구(ESM-2 임베딩 재사용, de novo 단백질 설계 파이프라인)가 이어짐',
 '**속도-정확도 트레이드오프**를 명시적으로 드러내며, 이후 연구들이 "MSA 의존을 얼마나 줄이면서 정확도를 지킬 것인가"를 별도 축으로 다루게 됨',
 '[AlphaFold3](#/p/alphafold3) 등 후속 AlphaFold 계열도 단일서열/저MSA 상황에 대한 견고성을 평가 항목으로 포함시키는 계기가 됨'
],

pitfalls:[
 '**속도 우위가 모든 서열에 균등하지 않다.** 동족 서열이 풍부한 단백질에서는 MSA 기반 AlphaFold2가 여전히 더 정확하고, 격차는 언어모델 perplexity가 높은(즉 언어모델이 "낯설어하는") 서열일수록 커진다.',
 '"언어모델이 진화 정보를 암묵적으로 학습했다"는 주장은 스케일링 곡선의 상관관계에 근거한 것이지, 모델이 명시적으로 계통·정렬을 재구성한다는 뜻은 아니다.',
 'Metagenomic Atlas의 구조 대부분은 **예측일 뿐 실험적으로 검증되지 않았다.** pLDDT가 높다고 해서 그 서열이 실제로 그 형태로 접힌다는 실험적 증거는 아니며, 고신뢰도 예측 중 상당수는 여전히 기존 UniRef90 서열과 90% 이상 떨어져 있어 검증되지 않은 신규 폴드일 가능성을 그대로 안고 있다.'
],

figures:[
 {f:'fig2a-architecture.png',
  cap:'왼쪽부터: 단일 서열이 마스킹 언어모델로 사전학습된 ESM-2(48층)를 통과하고, 그 표현이 folding trunk(48블록)와 구조모듈(8블록)을 거쳐 3D 구조와 신뢰도로 출력된다. 위쪽 화살표가 recycling(반복 정제) 경로. MSA·템플릿 입력이 아예 없다는 점이 AlphaFold 아키텍처와의 핵심 차이.',
  src:'원문 Figure 2A, p.5'},
 {f:'fig2b-accuracy.png',
  cap:'막대그래프: CAMEO·CASP14에서 단일서열(Single Seq.) 조건일 때 ESMFold(파랑)가 MSA를 뺀 AlphaFold2·RoseTTAFold(회색)보다 크게 앞선다. 다만 오른쪽의 Full(MSA 포함) AlphaFold2 막대와 비교하면 여전히 격차가 있다. 산점도는 ESMFold(x축) vs MSA 있는/없는 AlphaFold2(y축) TM-score를 언어모델 perplexity로 색칠한 것 — 파란(낮은 perplexity) 점일수록 대각선에 가깝다.',
  src:'원문 Figure 2B, p.5'}
],

quotes:[
 {t:'Here we show that direct inference of structure from primary sequence using a large language model enables an order of magnitude speed-up in high resolution structure prediction.',
  src:'Abstract, p.1'},
 {t:'Building on this, we present the ESM Metagenomic Atlas. This is the first large-scale structural characterization of metagenomic proteins, with more than 617 million structures.',
  src:'Abstract, p.1'}
],

links:[
 {t:'bioRxiv 2022.07.20.500902 — Evolutionary-scale prediction of atomic level protein structure with a language model', u:'https://doi.org/10.1101/2022.07.20.500902'},
 {t:'ESM Metagenomic Atlas', u:'https://esmatlas.com'},
 {t:'Science 2023 (published version)', u:'https://www.science.org/doi/10.1126/science.ade2574'}
]
});
