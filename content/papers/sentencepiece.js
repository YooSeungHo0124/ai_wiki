WIKI.paper({
slug:'sentencepiece',
venue:'EMNLP 2018 (System Demonstrations)',
authors:'Kudo, Richardson (Google, Inc.)',
arxiv:'1808.06226',

tldr:'공백 기반 사전 토크나이즈 없이 **원문 자체에서 직접** 서브워드 모델을 학습하는 언어 독립 토크나이저. [BPE](#/p/bpe)와 unigram LM을 같은 인터페이스로 지원하고, 학습·인코딩·디코딩을 하나의 자기완결형(self-contained) 모델 파일로 묶었다.',

context:'[BPE](#/p/bpe) 같은 서브워드 분할 기법은 공백으로 미리 나눈 단어 시퀀스를 입력으로 가정한다. 이 가정은 영어 같은 공백-분리 언어에서는 자연스럽지만, 한국어·일본어·중국어처럼 단어 경계가 공백으로 표시되지 않는 언어에는 별도의 언어별 사전 분절기(예: 일본어 KyTea, 중국어 형태소 분석기)가 먼저 필요하다. 이는 두 가지 문제를 낳는다 — (1) 언어마다 다른 전처리 규칙을 관리해야 해서 다국어 NMT 시스템 구축이 번거로워지고, (2) 토크나이즈된 결과가 원문과 **가역적으로(reversibly)** 복원되지 않아 전처리·후처리 사이에 정보가 새어나간다.',

ideas:[
 {h:'공백을 특수 기호로 취급해 원문에서 직접 학습',
  lead:'입력을 유니코드 문자열 그대로 다뤄 공백조차 하나의 일반 기호로 취급한다.',
  d:'사전 토크나이즈 없이 raw text를 그대로 받아 서브워드 모델을 학습·적용한다. 공백은 메타 기호 `▁`(U+2581)로 이스케이프되어 다른 문자와 동등하게 취급되고, 이 덕분에 언어별 분절 규칙 없이도 어떤 언어의 원문이든 같은 파이프라인에 넣을 수 있다.'},
 {h:'Lossless tokenization: 디코딩이 정규화 결과와 정확히 같다',
  lead:'`Decode(Encode(Normalize(text))) = Normalize(text)` 를 보장해 정보 손실을 없앤다.',
  d:'공백 정보가 토큰 경계에 흡수돼 사라지는 기존 방식과 달리, 공백을 `▁`로 인코딩해 토큰 시퀀스 안에 그대로 보존한다. 그 결과 `\'\'.join(tokens).replace(\'▁\', \' \')` 같은 단순 연산만으로 원문을 정확히 복원할 수 있다 — 저자들은 이를 "무손실 토크나이제이션"이라 부른다.'},
 {h:'BPE와 unigram LM을 같은 API 뒤에 통합',
  lead:'두 서로 다른 서브워드 알고리즘을 하나의 학습·추론 인터페이스로 감싼다.',
  d:'[BPE](#/p/bpe)(병합 기반)와 unigram language model(확률 기반 가지치기, Kudo 2018) 두 알고리즘을 모두 구현하고, `--model_type` 플래그 하나로 선택하게 했다. BPE가 병합 횟수를 파라미터로 쓰는 반면 SentencePiece는 최종 어휘 크기를 직접 지정하게 해, 알고리즘이 바뀌어도 같은 방식으로 어휘 크기를 통제할 수 있다.'},
 {h:'모델 파일 하나에 정규화 규칙까지 self-contained',
  lead:'정규화 규칙을 유한상태 변환기로 컴파일해 모델 파일 안에 통째로 저장한다.',
  d:'문자 정규화(예: 유니코드 NFKC, 전각→반각)는 보통 손으로 짠 규칙으로 따로 관리돼 재현성이 떨어졌다. SentencePiece는 정규화 규칙을 Aho-Corasick 오토마톤으로 컴파일해 모델(Protocol Buffer) 파일 안에 함께 저장한다. 모델 파일 하나만 배포하면 정규화·분절·어휘 매핑까지 정확히 재현되어, "같은 모델인데 다른 전처리로 다른 결과가 나오는" 문제를 없앤다.'},
 {h:'C++ 코어 + on-the-fly 라이브러리 API',
  lead:'오프라인 전처리 도구가 아니라 학습 루프 안에서 바로 부를 수 있는 라이브러리로 제공한다.',
  d:'기존 서브워드 도구는 학습 전에 텍스트를 한 번 오프라인으로 분절해두는 전처리 스크립트였다. SentencePiece는 C++ 코어에 Python·TensorFlow 바인딩을 붙여, NMT 학습 루프 안에서 실시간으로 인코딩할 수 있게 했다. 이 덕분에 매 스텝 다른 서브워드 분할을 샘플링하는 subword regularization 같은 동적 데이터 증강이 가능해진다.'}
],

diagram:{type:'compare', cap:'기존 파이프라인은 언어별 사전 분절기가 있어야 하고 원문 복원이 불가능하지만, SentencePiece는 원문에서 바로 학습해 무손실 복원이 가능하다.',
 left:{t:'기존: 사전 토크나이즈', items:['언어별 분절기 필요(KyTea 등)','공백 정보가 토큰 경계에서 소실','원문 복원 불가능']},
 right:{t:'SentencePiece', items:['공백을 ▁ 기호로 그대로 보존','원문에서 직접 서브워드 학습','디코딩이 정규화 결과와 정확히 일치']}
},

math:[
 {expr:'Decode(Encode(Normalize(text))) = Normalize(text)',
  tex:'\\text{Decode}\\big(\\text{Encode}(\\text{Normalize}(\\text{text}))\\big) = \\text{Normalize}(\\text{text})',
  d:'무손실 토크나이제이션의 정의. 인코딩된 서브워드 시퀀스가 정규화된 원문을 재구성하는 데 필요한 정보를 전부 담고 있어야 한다는 뜻이다. 공백까지 문자 취급하는 설계가 이 등식을 성립시킨다.'},
 {expr:'BPE: O(N²) naive, SentencePiece O(N log N) via binary heap',
  tex:'\\text{BPE(naive)}: O(N^2) \\;\\longrightarrow\\; \\text{SentencePiece}: O(N\\log N)',
  d:'병합할 기호 쌍을 매 반복마다 전부 다시 스캔하면 길이 $N$ 인 입력에 대해 $O(N^2)$ 이 든다. SentencePiece는 병합 후보를 이진 힙(우선순위 큐)으로 관리해 $O(N\\log N)$ 으로 낮췄고, unigram LM 쪽은 학습·분절 복잡도가 입력 크기에 선형이다.'}
],

numbers:[
 {k:'영어→일본어 BLEU, 단어모델 대비', v:'20.06 → 21.62', d:'8k 공유 어휘 SentencePiece, 사전분절 없이 단어모델(80k/80k) 상회'},
 {k:'일본어→영어 BLEU', v:'28.24 → 29.55~29.85', d:'사전분절 유무와 무관하게 SentencePiece가 단어모델보다 우수'},
 {k:'분절 속도(사전분절 없이, 일본어)', v:'subword-nmt 대비 약 380배', d:'같은 BPE 알고리즘이라도 사전분절을 생략하면 SentencePiece가 훨씬 빠름'},
 {k:'온더플라이 처리 속도', v:'영어 약 21k문장/초, 일본어 약 74k문장/초', d:'학습 루프 내 실시간 호출이 가능한 수준이라고 저자들이 명시'},
 {k:'실험 설정', v:'KFTT 코퍼스(440k문장), GNMT 기반', d:'영어-일본어 위키피디아 번역 과제로 검증'}
],

impact:'SentencePiece는 서브워드 분할을 "영어 중심 전처리 스크립트"에서 "언어 독립 라이브러리"로 바꿨다. 사전 토크나이즈 의존을 없앰으로써 다국어·비분절 언어 NMT 파이프라인을 단순화했고, 무손실 토크나이제이션과 self-contained 모델 파일이라는 설계는 재현성 문제(같은 코드인데 전처리 버전에 따라 BLEU가 달라지는 문제)를 상당 부분 해소했다. 오늘날 [BERT](#/p/bert) 이후 세대의 다국어·비영어권 언어모델 다수가 SentencePiece(또는 그 unigram LM 변형)를 토크나이저로 채택한다.',

legacy:[
 '**다국어 LLM의 기본 토크나이저** — mT5, XLM-R, LLaMA 계열 등 다국어·비영어 대응이 필요한 모델 다수가 SentencePiece를 채택',
 '**unigram LM의 확산** — 같은 저자(Kudo, 2018)의 subword regularization과 함께, 결정적 병합이 아닌 확률적 서브워드 선택이라는 대안이 자리잡음',
 '**분절-독립 사고방식의 정착** — "토크나이저는 언어별 전처리가 아니라 데이터로부터 배우는 것"이라는 관점이 이후 [byte-level BPE](#/p/bpe) 등 후속 토크나이저 설계에 이어짐',
 '**재현성 논의에 기여** — 모델 파일에 정규화 규칙까지 담는 self-contained 설계가, 사전학습 코드 공개만으로는 재현이 안 되는 문제에 대한 실용적 해법으로 참조됨'
],

pitfalls:[
 '**BPE 자체를 새로 발명한 논문이 아니다.** SentencePiece는 [BPE](#/p/bpe)와 unigram LM이라는 기존 알고리즘을 "원문에서 직접, 언어 독립적으로" 돌리는 시스템·엔지니어링 논문(EMNLP 데모 트랙)이지, 새로운 분할 알고리즘을 제안한 논문이 아니다.',
 '**공백 표현 방식(`▁`) 하나만으로 완전한 무손실이 보장되진 않는다.** 논문 스스로 밝히듯, 연속된 공백이 여러 개일 때 등 일부 엣지 케이스는 표현 방식에 따라 모호성이 남을 수 있다.',
 '**BPE vs unigram LM의 성능 차이는 이 논문에서 크지 않다고 보고된다.** 저자들은 두 알고리즘이 "거의 비슷한 성능을 보였다"고 명시하므로, "unigram LM이 항상 더 낫다"고 일반화하면 안 된다.'
],

figures:[
 {f:'fig1-cli.png',
  cap:'`spm_encode`가 "Hello world."를 `_He ll o _world .`로 쪼갠다 — 공백이 사라지지 않고 `_`(▁) 토큰으로 남는 것에 주목. `--output_format=id`로 정수 ID 시퀀스를 바로 얻고, `spm_decode`로 다시 원문을 정확히 복원한다(무손실 토크나이제이션의 실제 동작).',
  src:'원문 Figure 1, p.2'},
 {f:'fig2-regularization.png',
  cap:'같은 입력 "New York"을 `SampleEncodeAsPieces`로 다섯 번 반복 호출한 결과. 매번 다른 서브워드 분할(`N/e/w/_York`, `New/_York`, `New/_Y/o/r/k` 등)이 확률적으로 샘플링된다 — 결정적 분할이 아니라 subword regularization용 동적 샘플링이 가능함을 보여준다.',
  src:'원문 Figure 6, p.5'}
],

quotes:[
 {t:'While existing subword segmentation tools assume that the input is pre-tokenized into word sequences, SentencePiece can train subword models directly from raw sentences, which allows us to make a purely end-to-end and language independent system.',
  src:'Abstract, p.1'},
 {t:'SentencePiece employs several speed-up techniques both for training and segmentation to make lossless tokenization with a large amount of raw data.',
  src:'Section 3.2, p.3'}
],

links:[
 {t:'arXiv 1808.06226 — SentencePiece', u:'https://arxiv.org/abs/1808.06226'},
 {t:'공식 코드 (google/sentencepiece)', u:'https://github.com/google/sentencepiece'}
]
});
