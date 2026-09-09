WIKI.paper({
slug:'phi-textbooks',
venue:'arXiv 2023 (Microsoft Research)',
authors:'Gunasekar et al. (Microsoft Research)',
arxiv:'2306.11644',

tldr:'코드 생성 모델 phi-1은 파라미터 1.3B, 학습 토큰 7B 남짓이라는 작은 규모로도 HumanEval pass@1 50.6%를 찍어, 훨씬 큰 모델들을 앞질렀다. 핵심은 데이터의 양이 아니라 **"교과서 수준"의 질**이라는 주장이다.',

context:'[Chinchilla](#/p/chinchilla) 이후 업계의 상식은 "모델 크기와 토큰 수를 정해진 비율로 같이 키우면 손실이 예측 가능하게 줄어든다"는 스케일링 법칙이었다. 코드 생성 쪽도 마찬가지여서, Codex·CodeGen·StarCoder처럼 수백억~1조 토큰의 GitHub 코드를 수십억~수백억 파라미터 모델에 밀어 넣는 경쟁이었다. 문제는 웹에서 긁은 코드 대부분이 학습 자료로는 나쁘다는 점이다. 변수명이 의미 없고, 알고리즘 로직이 뒤섞여 있고, 특이 케이스만 다루는 파일이 많아 "기초 코딩 개념을 가르치는" 자료로서는 비효율적이다. 이 논문은 [Self-Instruct](#/p/self-instruct)류의 LLM 기반 합성 데이터 생성을 코드 도메인에 끌어와, 데이터의 질을 끌어올리면 스케일링 법칙이 요구하는 양을 우회할 수 있는지를 묻는다.',

ideas:[
 {h:'분류기로 웹 코드를 "교육적 가치"로 거른다',
  lead:'GPT-4로 소량 라벨링한 뒤 random forest 분류기를 학습시켜 The Stack 전체를 거른다.',
  d:'The Stack의 Python 서브셋과 StackOverflow, 합쳐서 35B 토큰 중 약 10만 개 샘플만 GPT-4에게 "기초 코딩 개념을 배우는 학생에게 교육적 가치가 있는가"를 판정시킨다. 이 라벨로 random forest 분류기를 학습시켜 나머지 파일 전체의 점수를 매기고, 상위 점수 파일만 남긴다. GPT-4는 소량 라벨링에만 쓰고 대량 생성에는 쓰지 않아 비용을 억제했다.'},
 {h:'GPT-3.5로 교과서 자체를 새로 쓴다',
  lead:'기존 코드를 거르는 것을 넘어, 다양성을 강제한 프롬프트로 교과서 텍스트를 통째로 합성한다.',
  d:'단순히 "좋은 코드를 골라내는" 것만으로는 주제가 한쪽으로 쏠린다. 그래서 무작위 주제·대상 독자·문체 조합을 프롬프트에 섞어 GPT-3.5로 1B 토큰 미만의 Python 교과서 텍스트를 새로 생성한다. 이렇게 만든 다양성이 없으면 합성 데이터가 서로 비슷해져 학습 효과가 떨어진다는 것을 저자들이 별도로 확인했다.'},
 {h:'CodeTextbook + CodeExercises 2단계 학습',
  lead:'필터링+합성 교과서로 사전학습한 뒤, 합성 연습문제로 짧게 파인튜닝한다.',
  d:'필터링된 웹 코드와 합성 교과서를 합쳐 "CodeTextbook"(7B 토큰 미만)을 만들고, 여기서 1.3B 파라미터 phi-1-base를 약 8 epoch(총 50B 토큰 남짓) 사전학습한다. 이 단계만으로 HumanEval 29%가 나온다. 이후 GPT-3.5로 생성한 "CodeExercises"(약 180M 토큰, 독스트링→함수 형식의 짧은 연습문제) 로 짧게 파인튜닝해 phi-1을 얻는다.'},
 {h:'파인튜닝이 단순 성능 향상이 아니라 능력을 "풀어준다"',
  lead:'CodeExercises 파인튜닝 후 학습에 없던 라이브러리 사용·체이닝 능력까지 나타난다.',
  d:'CodeExercises 자체는 200M 토큰이 안 되고 다루는 함수 형식도 제한적인데, 파인튜닝 후 phi-1은 CodeExercises에 없던 API 사용, 여러 함수를 잇는 체이닝 등을 수행한다. 저자들은 이를 사전학습에서 이미 습득했지만 표면화되지 않았던 능력이 파인튜닝으로 "풀려난" 것으로 해석한다.'},
 {h:'오염 의혹을 스스로 검증한다',
  lead:'n-gram 중복 검사와 CodeExercises 40%+ 제거 재학습으로 HumanEval 유출 가능성을 직접 반박한다.',
  d:'작은 모델이 큰 모델을 이기면 가장 먼저 나오는 의심이 "테스트셋 유출"이다. 저자들은 HumanEval 문항과 CodeExercises 사이 13-gram 중복을 검사하고(모두 우연의 일치로 판정), 나아가 임베딩·AST 유사도로 HumanEval과 비슷한 항목을 40% 이상 제거한 뒤 재학습해도 StarCoder를 여전히 능가함을 보인다. 또 GPT-4 채점 기반의 새 50문항 벤치마크로 교차 검증도 수행했다.'}
],

diagram:{type:'flow', cap:'CodeTextbook로 사전학습한 phi-1-base(29%)를 CodeExercises로 짧게 파인튜닝하면 HumanEval이 51%까지 뛴다.',
 nodes:[
  {t:'The Stack + SO', s:'35B 토큰 웹 코드'},
  {t:'품질 분류기', s:'GPT-4 라벨 → RF'},
  {t:'CodeTextbook', s:'필터링+합성, <7B', acc:true},
  {t:'phi-1-base', s:'1.3B, HumanEval 29%'},
  {t:'CodeExercises', s:'GPT-3.5 합성, 180M'},
  {t:'phi-1', s:'1.3B, HumanEval 51%', acc:true}
 ]},

numbers:[
 {k:'phi-1 파라미터', v:'1.3B', d:'24층, hidden 2048'},
 {k:'학습 토큰', v:'7B(CodeTextbook)', d:'약 8 epoch 반복해 총 50B+ 토큰 소비, 파인튜닝은 180M(CodeExercises) 추가'},
 {k:'학습 자원', v:'8×A100, 4일', d:'phi-1 체크포인트 기준 770 GPU시간'},
 {k:'HumanEval pass@1', v:'50.6%', d:'phi-1-base(파인튜닝 전)는 29%'},
 {k:'MBPP pass@1', v:'55.5%', d:'StarCoder(15.5B, 1T 토큰) 52.7%보다 높음'},
 {k:'StarCoder 대비', v:'15.5B·1T 토큰 · HumanEval 33.6%', d:'phi-1은 파라미터 1/12, 토큰 1/140 수준으로 이를 앞섬'}
],

impact:'phi-1은 "모델·데이터를 함께 키우면 손실이 예측대로 줄어든다"는 스케일링 법칙 논의에 **데이터의 질이라는 축을 하나 더 추가**했다. 같은 구조·같은 파라미터 수라도 어떤 데이터로 학습하느냐에 따라 HumanEval이 12%에서 30%까지 벌어진다는 것(Figure 2.1의 첫 두 막대)을 정량으로 보였다. 이후 GPT류 모델의 합성 데이터로 소형 모델을 가르치는 접근("데이터 증류")이 코드 도메인을 넘어 범용 LLM 학습 파이프라인의 표준 재료로 자리잡는 계기가 됐다.',

legacy:[
 '**소형·고품질 데이터 계열의 시작점** — Microsoft는 이후 phi-1.5, phi-2, phi-3로 이 레시피를 텍스트 전반으로 확장했다',
 '**합성 데이터 학습 논쟁의 기폭제** — "교사 LLM(GPT-3.5/4)의 지식을 학생 모델에 증류하는 것이 스케일링 법칙을 정말 깨는가, 아니면 다른 형태의 규모인가"라는 질문을 코드 도메인에서 처음 정량적으로 제기했다',
 '**데이터 필터링·큐레이션의 표준화** — 분류기 기반 웹 데이터 필터링은 [RefinedWeb](#/p/refinedweb) 같은 대규모 코퍼스 정제 작업과 함께 "사전학습 전에 데이터 품질을 자동으로 매기는" 파이프라인을 일반화시켰다',
 '**벤치마크 오염 검증 방법론** — n-gram/임베딩/AST 유사도로 학습-평가 중복을 직접 제거하고 재학습하는 검증 절차가 이후 소형 모델 논문들의 관례가 됐다'
],

pitfalls:[
 '**논문 스스로가 오염 가능성을 인정하고 검증한 것이지, 의혹이 없는 것은 아니다.** 저자들은 n-gram·임베딩 유사도 검사와 재학습 실험으로 직접 오염을 반박했지만, CodeExercises 자체가 GPT-3.5로 생성됐다는 점에서 "GPT-3.5가 학습 과정에서 흡수한 HumanEval류 문제 패턴이 간접적으로 phi-1에 전이됐을 가능성"은 데이터 생성 프롬프트·소스가 공개되지 않아 외부에서 완전히 재현·반증하기 어렵다는 비판이 뒤따랐다.',
 '**"작은 모델이 큰 모델을 이겼다"는 HumanEval·MBPP라는 좁은 코딩 벤치마크에 국한된 결과다.** phi-1은 Python 함수 작성이라는 단일 과제에 특화되어 학습됐고, 일반 대화·다국어·수학 추론 등에서 같은 결론이 성립한다고 확장 해석할 근거는 이 논문 안에 없다.',
 '**합성 데이터 비중이 커지는 학습에는 model collapse 위험이 따른다.** 교사 모델(GPT-3.5/4)의 편향·오류·스타일 쏠림이 그대로 상속되며, 데이터 생성에 쓰인 프롬프트와 원본 코퍼스가 비공개라 phi-1의 재현성 자체도 제한적이다.'
],

figures:[
 {f:'fig2.1-scaling.png',
  cap:'세 그룹 모두 데이터셋(막대 색)만 바꾼 비교다. 주황(The Stack+ 원본 웹 코드)에서 하늘색(CodeTextbook)으로만 바꿔도 HumanEval이 11~17%대에서 20~45%로 뛴다. 가장 오른쪽 진한 남색이 CodeExercises 파인튜닝까지 마친 phi-1(51%)로, 모델·토큰 수를 키우지 않고 데이터만 바꿔 얻은 격차다.',
  src:'원문 Figure 2.1, p.3'}
],

quotes:[
 {t:'phi-1 is a Transformer-based model with 1.3B parameters, trained for 4 days on 8 A100s, using a selection of “textbook quality” data from the web (6B tokens) and synthetically generated textbooks and exercises with GPT-3.5 (1B tokens).',
  src:'Abstract, p.1'},
 {t:'We believe that such data pruning experiment is a fair way to evaluate performance, and is more insightful than standard “contamination” studies in the literature.',
  src:'Section 5, p.12'}
],

links:[
 {t:'arXiv 2306.11644 — Textbooks Are All You Need', u:'https://arxiv.org/abs/2306.11644'},
 {t:'Microsoft phi-1 모델 카드 (Hugging Face)', u:'https://huggingface.co/microsoft/phi-1'}
]
});
