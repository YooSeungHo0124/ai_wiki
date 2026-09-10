WIKI.paper({
slug:'nougat',
venue:'arXiv 2023 (Meta AI)',
authors:'Blecher et al. (Meta AI)',
arxiv:'2308.13418',

tldr:'학술 논문 PDF를 **수식·표까지 살린 마크업(LaTeX 유사 텍스트)**으로 바꾸는 모델. [Donut](#/p/donut)의 Swin 인코더 + 자기회귀 디코더 구조를 그대로 물려받아, 이 위키가 매일 하는 일(논문 PDF를 읽어 정리하는 일)과 가장 직접 맞닿아 있는 논문이다.',

context:'PDF는 사람이 읽기엔 좋지만 기계가 다시 읽기엔 나쁜 포맷이다. 특히 수식은 문제가 심각하다 — [Tesseract](https://github.com/tesseract-ocr) 같은 전통 OCR은 문자를 줄 단위로 인식하기 때문에 위첨자·아래첨자를 본문과 똑같이 취급하고, 분수·행렬처럼 문자의 **상대적 위치 자체가 의미인** 표현을 복원하지 못한다. S2ORC 같은 기존 논문 코퍼스도 GROBID로 본문은 뽑아내지만 수식은 의미 있는 형태로 남기지 못한다. 저자들의 질문은 [Donut](#/p/donut)의 질문을 학술 문서로 좁힌 것이다 — **OCR 없이 이미지에서 바로 마크업을 생성하면, 수식의 구조까지 함께 복원되지 않을까?**',

ideas:[
 {h:'Donut 아키텍처를 학술 도메인에 그대로 이식한다',
  lead:'Swin 인코더 + mBART 디코더 구조를 그대로 쓰고, 학습 대상 언어만 LaTeX 마크업으로 바꾼다.',
  d:'인코더는 [Donut](#/p/donut)과 같은 [Swin Transformer](#/p/swin)로, 문서 페이지 이미지를 여백을 잘라내고 고정 크기(896×672)로 맞춘 뒤 패치 임베딩 시퀀스로 바꾼다. 디코더는 [BART](#/p/bart) 계열인 mBART 구현을 그대로 가져오되, 토크나이저는 과학 텍스트에 특화된 것(Galactica와 동일)을 쓴다. 최대 시퀀스 길이를 4096까지 늘린 것은 논문 표·수식이 토큰을 많이 잡아먹기 때문이다.'},
 {h:'PDF-마크업 쌍을 자동으로 만드는 데이터 파이프라인',
  lead:'arXiv 소스(LaTeX)와 렌더링된 PDF 페이지를 LaTeXML로 정렬해 학습 쌍을 대량 생성한다.',
  d:'논문의 실질적 기여 중 하나는 모델 자체보다 데이터다. arXiv에 올라온 LaTeX 소스를 LaTeXML로 변환해 정규화하고, 이를 PDF 렌더링 결과와 페이지 단위로 정렬해 "페이지 이미지 → 정답 마크업" 쌍을 대규모로 자동 생성했다. 사람이 라벨링할 필요 없이 arXiv 자체가 정답을 제공하는 구조다.'},
 {h:'모드별로 정확도를 쪼개서 잰다',
  lead:'전체 텍스트가 아니라 본문·표·수식을 따로 채점해야 수식 복원력이 드러난다.',
  d:'LaTeX는 같은 수식도 여러 표기로 쓸 수 있어 문자열 비교가 애매하다. 그래서 저자들은 결과를 "전체(All)", "표", "본문", "수식" 네 구간으로 나눠 편집거리(edit distance)·BLEU·METEOR·F1을 각각 계산한다. 이 분리 평가에서 GROBID+LaTeX OCR 조합은 수식 구간에서 F1 9.7까지 떨어지는데, Nougat은 같은 구간에서 76점대를 유지한다.'},
 {h:'반복 붕괴(repetition collapse)를 탐지하고 완화한다',
  lead:'greedy decoding이 같은 문장을 무한 반복하는 실패 모드를, 학습 시 노이즈 주입과 추론 시 로짓 분산 감시로 잡는다.',
  d:'Transformer를 greedy decoding으로 돌리면 특정 실수 이후 같은 문장·문단을 계속 반복하다 회복하지 못하는 현상이 나타난다. 학습 때는 토큰을 무작위로 다른 토큰으로 바꿔치기하는 **anti-repetition augmentation**으로 이런 상태에서 회복하는 법을 가르치고, 추론 때는 각 토큰의 최대 로짓 값의 슬라이딩 윈도 분산이 특정 임계값 아래로 떨어져 있으면 반복 상태로 판단해 생성을 조기 종료한다.'}
],

diagram:{type:'flow', cap:'논문 페이지 이미지가 Swin 인코더를 거쳐 잠재 임베딩이 되고, mBART 디코더가 이를 조건으로 LaTeX 유사 마크업 토큰을 자기회귀 생성한다.',
 nodes:[
  {t:'논문 페이지 이미지', s:'896×672, 96dpi'},
  {t:'Swin 인코더', s:'윈도 self-attention', acc:true},
  {t:'잠재 임베딩 z', s:'d×N 패치열', a:'조건으로'},
  {t:'mBART 디코더', s:'자기회귀, 최대 4096토큰'},
  {t:'마크업 텍스트', s:'수식·표 포함'}
 ]},

math:[
 {expr:'VarWinB[ℓ](x) = 평균( (ℓ_i - 윈도평균)^2 ), i∈[x, x+B]',
  tex:'\\text{Var}^B_{\\text{Win}}[\\ell](x)=\\frac{1}{B}\\sum_{i=x}^{x+B}\\left(\\ell_i-\\frac{1}{B}\\sum_{j=x}^{x+B}\\ell_j\\right)^{2}',
  d:'토큰 위치 $x$ 를 중심으로 크기 $B{=}15$ 의 슬라이딩 윈도에서 최대 로짓 값의 분산을 구한다. 이 분산을 문장 끝까지 다시 한 번 집계한 값이 특정 임계값 아래로 떨어지면 반복 붕괴로 판정해 생성을 조기 종료한다.'}
],

numbers:[
 {k:'arXiv 테스트셋 F1(전체)', v:'92.9~93.1', d:'Nougat small/base — GROBID+LaTeX OCR 조합 F1 73.0 대비 큰 격차'},
 {k:'수식 구간 F1', v:'76.5~76.9', d:'같은 조건에서 GROBID+LaTeX OCR은 9.7까지 하락 — 수식 복원이 이 모델의 핵심 차별점'},
 {k:'모델 크기', v:'small 250M / base 350M', d:'base는 mBART 디코더 10층, small은 4층'},
 {k:'반복 붕괴 발생률', v:'테스트셋 페이지의 1.5%', d:'도메인 밖 문서에서는 빈도가 더 높아짐; anti-repetition augmentation으로 실패 변환 32% 감소'},
 {k:'생성 속도', v:'배치당 약 19.5초(≈1400토큰)', d:'A10G GPU 기준 — GROBID의 초당 10.6 PDF 처리보다 훨씬 느림'}
],

impact:'"OCR 없이 이미지에서 바로 구조화된 텍스트를 생성한다"는 [Donut](#/p/donut)의 레시피를 학술 문서로 좁혀, 그동안 손실되던 수식·표의 의미 구조를 복원해냈다. GROBID+수식OCR 조합 파이프라인이 구간별로 크게 흔들리는 것과 달리 안정적인 성능을 보이면서, 논문 대량 디지털화·검색 가능화의 실용적 도구가 됐다. 동시에 반복 붕괴·환각이라는 자기회귀 생성 모델의 한계를 학술 문서라는 고밀도·고구조 텍스트에서 정면으로 드러낸 사례이기도 하다.',

legacy:[
 '**이 위키 자체가 쓰는 파이프라인과 같은 문제의식** — 논문 PDF를 구조화된 텍스트로 바꾸는 작업이 Nougat이 다루는 문제와 직접 맞닿아 있음',
 '**후속 학술 문서 OCR 모델들의 베이스라인화** — 이후 오픈소스·상용 "PDF to Markdown/LaTeX" 도구들이 Nougat을 비교 기준으로 채택',
 '**반복 붕괴 탐지 기법의 재사용** — 로짓 분산 기반 반복 탐지가 다른 긴 시퀀스 자기회귀 생성 태스크에도 참고 기법으로 인용됨',
 '**페이지 단위 처리의 한계가 다음 연구 과제로 남음** — 논문 전체의 문맥(참고문헌 번호 일관성 등)을 페이지 단위로는 못 잡는다는 한계가 이후 문서 단위 컨텍스트 모델 연구의 동기가 됨'
],

pitfalls:[
 '**환각과 반복 붕괴는 원 논문이 스스로 인정한 한계다.** 특히 참고문헌 목록이나 섹션 번호처럼 반복적인 구조에서 숫자를 건너뛰거나 지어내는 경우가 있고, greedy decoding이 같은 문장을 무한 반복하는 실패 모드가 테스트셋의 1.5%에서 관찰됐다. "Nougat 출력은 그대로 신뢰할 수 있다"고 가정하면 안 된다.',
 '**모델은 페이지 단위로 독립적으로 동작한다.** 문서 전체의 문맥을 보지 않으므로 여러 페이지에 걸친 일관성(참고문헌 스타일, 섹션 번호 등)이 깨질 수 있다 — 이는 속도·병렬화를 위한 설계 선택의 대가로 원문이 명시한 한계다.',
 '**수식 구간 F1 수치를 다른 OCR-free 모델과 비교할 때 평가 방식(구간 분리)이 같은지 확인해야 한다.** Table 1은 전체·표·본문·수식을 따로 채점한다 — "전체 F1"만 보고 비교하면 이 모델의 핵심 강점(수식 복원)이 가려진다. 또한 GROBID+LaTeX OCR처럼 OCR을 전제하는 파이프라인과 Nougat처럼 OCR-free인 모델을 같은 표에 놓을 때는 애초에 전제 조건이 다르다는 점을 밝혀야 한다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'왼쪽 페이지 이미지가 Swin Transformer를 거쳐 잠재 임베딩 z가 되고, Transformer Decoder가 이를 받아 로짓 ℓ을 자기회귀로 생성해 오른쪽 "Example"처럼 마크업 텍스트가 나온다. Donut과 구조가 동일하다는 점이 이 그림의 핵심.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'We notice that the model degenerates into repeating the same sentence over and over again. The model can not recover from this state by itself.',
  src:'Section 5.4, p.8'}
],

links:[
 {t:'arXiv 2308.13418 — Nougat', u:'https://arxiv.org/abs/2308.13418'},
 {t:'Nougat (Meta AI, code & models)', u:'https://github.com/facebookresearch/nougat'}
]
});
