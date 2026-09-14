WIKI.paper({
slug:'blt',
venue:'arXiv preprint (2024, FAIR at Meta)',
authors:'Pagnoni, Pasunuru, Rodriguez et al. (FAIR at Meta · U. Washington · U. Chicago)',
arxiv:'2412.09871',

tldr:'고정 어휘로 문장을 미리 쪼개는 [토크나이저](#/p/sentencepiece)를 아예 없애고, 바이트를 **다음 바이트 예측의 엔트로피**에 따라 동적으로 묶은 패치를 계산 단위로 쓰는 아키텍처. 8B·4T바이트까지의 flop 통제 스케일링 연구에서 처음으로 바이트 수준 모델이 토큰 기반 모델과 대등한 성능을 내면서 추론 flop은 최대 50% 줄인다.',

context:'거의 모든 LLM은 토크나이저라는 전처리를 거쳐 학습된다. 토큰은 문자열을 압축하는 방식을 사람이 미리 정해 편향을 주는데, 이 때문에 도메인·모달리티에 민감하고, 입력 노이즈에 약하고, 철자 지식이 부족하고, 언어에 따라 불공평하게 쪼개진다는 문제가 계속 지적돼 왔다. 바이트를 직접 학습하면 이런 문제가 사라지지만, 시퀀스 길이가 훨씬 길어져 대규모에서는 학습 비용이 감당하기 어려웠다 — 트랜스포머의 비용은 attention이 아니라 모든 바이트마다 도는 거대한 FFN 층이 지배하기 때문이다. 이 논문은 "그렇다면 모든 바이트에 똑같은 계산을 줄 필요가 있는가"를 묻는다.',

ideas:[
 {h:'엔트로피 기반 동적 패치',
  lead:'다음 바이트를 예측하기 어려운 지점(엔트로피가 높은 지점)에서 패치 경계를 끊는다.',
  d:'작은 바이트 단위 자기회귀 LM을 따로 학습시켜 각 바이트의 다음 바이트 엔트로피 $H(x_i)$ 를 계산하고, 이 값이 전역 임계값 $\\theta_g$ 를 넘는 지점을 새 패치의 시작으로 삼는다. "George R.R. Martin"처럼 흔한 고유명사는 낮은 엔트로피가 이어져 큰 패치 하나로 묶이지만, 새 단어·문장의 첫 글자처럼 예측하기 어려운 지점은 그 자체로 짧은 패치가 된다. 고정 크기로 자르는 MegaByte나 공백마다 자르는 SpaceByte와 달리, 실제 정보 밀도에 따라 패치 크기가 늘었다 줄었다 한다.'},
 {h:'경량 로컬 인코더/디코더 + 대형 잠재 트랜스포머',
  lead:'비싼 계산은 패치 단위로만 돌리고, 바이트 단위 작업은 작은 모델에 맡긴다.',
  d:'BLT는 세 모듈로 이뤄진다 — 바이트를 패치 표현으로 인코딩하는 경량 Local Encoder, 패치 표현 위에서 다음 패치를 예측하는 계산 집약적 Latent Transformer, 패치를 다시 바이트로 풀어내는 경량 Local Decoder. 전체 계산 비용을 좌우하는 것은 패치 개수이므로, 패치를 길게 잡을수록(예측 가능한 구간일수록) Latent Transformer가 도는 횟수가 줄고 그만큼 아낀 계산을 모델 크기를 키우는 데 돌릴 수 있다.'},
 {h:'byte n-gram 해시 임베딩과 cross-attention',
  lead:'로컬 인코더가 바이트 n-gram 해시 임베딩과 cross-attention으로 잠재 트랜스포머와 정보를 주고받는다.',
  d:'토큰 임베딩 테이블이 없는 대신, 3~8바이트 n-gram을 해시 함수로 고정 크기 임베딩 테이블에 매핑해 각 바이트 임베딩에 더해준다. 로컬 인코더/디코더와 Latent Transformer 사이의 정보 교환은 cross-attention으로 이뤄져, 패치 경계가 매 시퀀스마다 달라져도(동적 마스크) 바이트 수준 정보에 계속 접근할 수 있다.'},
 {h:'고정 추론 예산 안에서 모델 크기와 패치 크기를 동시에 키우기',
  lead:'토큰 기반 모델은 추론 예산이 곧 모델 크기를 정하지만, BLT는 패치 크기라는 새 축을 하나 더 얻는다.',
  d:'토큰 기반 아키텍처에서 고정된 추론 flop 예산은 사실상 모델 크기를 결정한다. BLT에서는 평균 패치 크기를 늘리면 그만큼 Latent Transformer 호출 횟수가 줄어 절약된 계산을 모델 크기 증가로 재배분할 수 있다. 그 결과 같은 추론 예산 안에서 "모델 크기 ↑ + 패치 크기 ↑"를 동시에 할 수 있는 새로운 스케일링 축이 열린다.'}
],

diagram:{type:'stack', cap:'로컬 인코더가 엔트로피로 바이트를 패치로 묶고, 비싼 Latent Transformer는 패치 단위로만 돈다.',
 layers:[
  {t:'입력 바이트열', s:'고정 어휘 없음'},
  {t:'Local Encoder', s:'경량, n-gram 해시', note:'바이트→패치 표현'},
  {t:'엔트로피 기반 패칭', s:'H(x)>θg 에서 경계', acc:true},
  {t:'잠재 트랜스포머', s:'대형, 패치 단위', note:'계산 비용 대부분 여기'},
  {t:'Local Decoder', s:'경량', note:'패치→다음 바이트'}
 ]},

math:[
 {expr:'H(x_i) = - sum_v p_e(x_i=v|x<i) * log p_e(x_i=v|x<i)',
  tex:'H(x_i)=-\\sum_{v\\in\\mathcal V} p_e(x_i=v\\mid x_{<i})\\log p_e(x_i=v\\mid x_{<i})',
  d:'작은 바이트 LM의 분포 $p_e$ 아래서 계산한 바이트 $x_i$ 의 다음 바이트 엔트로피. 이 값이 패치 경계를 결정한다.'},
 {expr:'boundary if H(x_t) > theta_g   (global constraint)',
  tex:'H(x_t) > \\theta_g \\quad\\text{또는}\\quad H(x_t)-H(x_{t-1}) > \\theta_r',
  d:'전역 임계값 방식(global constraint)과, 직전 바이트 대비 엔트로피 증가량으로 판단하는 근사 단조성 방식(approx. monotonic constraint) 두 가지로 경계를 정할 수 있다.'}
],

numbers:[
 {k:'추론 flop 절감', v:'최대 50%', d:'8B 규모에서 Llama 3와 학습 flop 통제 성능이 동등하면서'},
 {k:'평균 패치 크기', v:'6~8 바이트', d:'Llama 2·3 토크나이저의 평균 토큰 크기(3.7·4.4바이트)보다 큼'},
 {k:'8B, BLT-1T 데이터셋 평균 정확도', v:'Llama3 60.0 vs BLT-Entropy 61.1', d:'ARC·HellaSwag·PIQA·MMLU·MBPP·HumanEval 평균 (Table 1)'},
 {k:'노이즈 강건성 평균 우위', v:'+8점', d:'문자 단위 노이즈(대문자화·문자 삭제 등)를 준 분류 태스크에서 동일 데이터 학습 Llama 3 대비'},
 {k:'스케일링 검증 규모', v:'최대 8B 파라미터, 4T 학습 바이트', d:'flop 통제 스케일링 연구 최초로 이 규모까지 바이트 모델을 검증'}
],

impact:'토크나이저라는, 30년 가까이 당연하게 여겨진 전처리 단계를 없앨 수 있다는 것을 대규모(8B)에서 처음 실증했다. "어디에 계산을 더 쓸지"를 사람이 정한 어휘가 아니라 데이터 자체의 엔트로피가 정하게 만든 것이 핵심 전환이다. 이후 바이트/패치 기반 아키텍처 연구 전반(BLT의 속도 문제를 겨냥한 [Fast BLT](#/p/fast-blt) 포함)의 출발점이 되었고, 토크나이저 의존성이 큰 다국어·저자원 언어·오타 강건성 문제에 구조적 대안을 제시했다.',

legacy:[
 '[Fast BLT](#/p/fast-blt)가 이 아키텍처의 느린 바이트 단위 순차 생성 문제를 정면으로 겨냥해 후속 연구를 시작함',
 '엔트로피 기반 동적 패칭이라는 아이디어는 이후 패치/토큰 경계를 데이터 기반으로 정하는 다른 아키텍처에도 참조점이 됨',
 '[Transformer](#/p/transformer) 이후 사실상 고정됐던 "토크나이즈 후 임베딩"이라는 전제 자체를 재검토하게 만든 사례'
],

pitfalls:[
 '**"토크나이저가 완전히 사라졌다"는 것은 아니다.** 패치 경계를 정하는 작은 바이트 LM 자체가 여전히 별도로 학습돼야 하고, 그 LM의 엔트로피 추정 품질이 전체 시스템의 패치 품질을 좌우한다.',
 '**추론은 여전히 로컬 디코더 단에서 바이트 단위로 순차 생성된다.** 패치 단위 계산은 절약되지만, 바이트를 하나씩 뽑아내는 자기회귀 과정 자체는 남아 있다 — 이 문제를 정면으로 다룬 것이 [Fast BLT](#/p/fast-blt)다.',
 '50% flop 절감은 패치 크기를 6~8바이트로 늘렸을 때의 수치이며, 그만큼 초기(1B 규모)에는 같은 패치 크기의 BLT가 BPE Llama 2보다 오히려 성능이 낮게 출발한다 — 이점이 두드러지는 것은 7B 이상 규모부터다.'
],

figures:[
 {f:'fig2-architecture.png',
  cap:'아래에서 위로: 바이트 임베딩 → Local Encoder(엔트로피로 패치 경계 결정, 하단 꺾은선 그래프) → cross-attention으로 패치 표현 추출 → Latent Transformer → 다시 cross-attention으로 unpatch → Local Decoder가 다음 바이트를 예측.',
  src:'원문 Figure 2, p.3'},
 {f:'fig4-entropy-patch.png',
  cap:'"Daenerys Targeryen is in Game of Thrones..." 문장의 바이트별 다음 바이트 엔트로피. 빨간 점선이 임계값 θg. "G"에서 엔트로피가 튀어 새 패치가 시작되지만, 이후 "eorge R.R. Martin"은 엔트로피가 낮게 유지되어 패치가 끊기지 않고 이어진다.',
  src:'원문 Figure 4, p.4'}
],

quotes:[
 {t:'We introduce the Byte Latent Transformer (BLT), a new byte-level LLM architecture that, for the first time, matches tokenization-based LLM performance at scale with significant improvements in inference efficiency and robustness.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2412.09871 — Byte Latent Transformer: Patches Scale Better Than Tokens', u:'https://arxiv.org/abs/2412.09871'},
 {t:'GitHub: facebookresearch/blt', u:'https://github.com/facebookresearch/blt'}
]
});
