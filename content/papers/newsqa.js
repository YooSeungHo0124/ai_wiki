WIKI.paper({
slug:'newsqa',
venue:'RepL4NLP Workshop @ ACL 2017 (arXiv)',
authors:'Trischler, Wang, Yuan et al. (Maluuba Research)',
arxiv:'1611.09830',

tldr:'CNN 뉴스 기사 12,744편에 크라우드워커가 직접 질문·답을 만든 독해 데이터셋. **질문을 만드는 사람이 기사 본문을 보지 못하게** 분리한 4단계 수집 절차로 단순 단어 매칭으로는 못 푸는 질문 비율을 [SQuAD](#/p/squad)보다 끌어올렸고, 사람-모델 성능 격차(F1 0.198)로 그 어려움을 입증했다.',

context:'2016년 무렵 독해(MC) 데이터셋은 두 부류로 갈려 있었다. `MCTest`처럼 사람이 정성껏 만들었지만 너무 작아 딥러닝 학습에 못 쓰는 것과, CNN/Daily Mail·[CBT](#/p/cbt)처럼 빈칸을 자동으로 뚫어 대량으로 만들 수 있지만 질문이 자연스럽지 않고 단순 개체 인식에 가까운 것이다. [SQuAD](#/p/squad)가 크라우드워커에게 자연어 질문을 직접 쓰게 하면서 이 둘의 절충안을 냈지만, 이 논문은 SQuAD조차 질문 작성자가 답이 있는 문단을 보면서 질문을 쓰기 때문에 **원문 어휘를 그대로 베끼는 질문**이 많이 섞인다고 지적한다. NewsQA는 그 격차를 더 벌리기 위해 질문 작성 단계에서 아예 본문을 가리는 절차를 설계했다.',

ideas:[
 {h:'질문 작성자는 헤드라인과 요약만 본다',
  lead:'본문을 가린 채 질문을 쓰게 해서, 원문 문장을 그대로 베끼는 질문을 원천 차단한다.',
  d:'Questioner는 기사의 제목과 CNN이 제공하는 요약(bullet point)만 보고 질문을 만든다. 본문을 못 보므로 궁금증에 기반한 질문을 쓰게 되고, 요약과 겹치는 단어가 많은 질문은 걸러낸다. 이는 어휘·통사 구조가 답 문장과 다른("lexical and syntactic divergence") 질문을 의도적으로 늘리는 설계다.'},
 {h:'질문·답변·검증을 분리한 4단계 수집',
  lead:'Questioner-Answerer-Validator 세 그룹이 각각 다른 크라우드워커로 나뉜다.',
  d:'질문 작성(본문 비공개) → 답변 선택(Answerer가 전체 기사를 보고 답 span을 클릭, 또는 null 답 선택) → 검증(Validator가 답 후보 중 최선을 고르거나 전부 기각)의 순서를 거친다. 답변 없음(null span), 질문 기각 옵션까지 갖춰 "답이 없는 질문"이 데이터셋에 자연스럽게 섞이게 했다.'},
 {h:'후보 없는 자유 span, 답 없는 질문도 포함',
  lead:'선택지도 없고, 정답이 아예 본문에 없을 수도 있다 — CBT·CNN/Daily Mail과 결정적으로 다른 지점.',
  d:'CBT·CNN/Daily Mail은 개체명 하나를 고르는 빈칸 채우기이지만, NewsQA는 임의 길이의 텍스트 span이 답이고 후보 목록 자체가 없다. 검증 후에도 9.5%는 합의된 null 답으로, 4.5%는 끝내 합의가 안 된 채로 남는다. 모델이 "이 질문엔 답이 없다"를 판단해야 하는 경우를 처음부터 포함한 설계다.'},
 {h:'추론 유형 분포로 난이도를 정량화',
  lead:'단어매칭·바꿔쓰기·추론·종합 네 단계로 1000문항씩 수작업 라벨링해 SQuAD와 직접 비교했다.',
  d:'단순 단어매칭 비율은 NewsQA 32.7% vs SQuAD 39.8%로 낮고, 여러 문장을 종합해야 하는 synthesis는 20.7% vs 11.9%로 NewsQA가 훨씬 높다. inference와 synthesis를 합치면 NewsQA 33.9% vs SQuAD 20.5%로, 단순 매칭으로 못 푸는 질문의 비중이 확연히 크다.'}
],

diagram:{type:'compare', cap:'질문 작성 단계에서 원문 공개 여부가 SQuAD와 NewsQA를 가른다.',
 left:{t:'SQuAD', items:['작성자가 문단을 보며 질문 작성','후보 없음, 답은 span','답 없는 질문은 미포함(v1)']},
 right:{t:'NewsQA', items:['작성자는 헤드라인·요약만 봄','후보 없음, 답은 임의 길이 span','9.5%는 답 없음(null span)']}},

math:[
 {expr:'S* = argmax_i Σ_{w∈Si∩Q} isf(w)',
  tex:'S_{*}=\\arg\\max_{i}\\sum_{w\\in S_i\\cap Q} isf(w)',
  d:'inverse sentence frequency(isf) 기반 문장 매칭 baseline. 질문 $Q$와 겹치는 단어의 idf 가중치 합이 가장 큰 문장을 답이 있는 문장으로 추정한다. SQuAD에서는 79.4% 맞히지만 NewsQA에서는 35.4%에 그쳐, 단순 단어 매칭이 훨씬 덜 통한다는 것을 보여주는 도구로 쓰였다.'}
],

numbers:[
 {k:'질문-답 쌍 수', v:'119,633개', d:'기사 12,744편에서 수집 — [SQuAD](#/p/squad)(107,785쌍·536편)보다 많은 질문, 더 적은 문서당 밀도'},
 {k:'사람 F1 (NewsQA vs SQuAD)', v:'0.694 vs 0.807', d:'같은 4명의 사람, 같은 평가 방식(1,000문항)으로 직접 비교 — NewsQA가 더 어렵다는 근거'},
 {k:'사람-모델 F1 격차', v:'0.198 (NewsQA) vs 0.098 (SQuAD)', d:'BARB 모델 기준 — NewsQA의 격차가 SQuAD의 두 배'},
 {k:'모델(BARB) F1, dev/test', v:'0.496 / 0.482', d:'mLSTM도 비슷한 0.496/0.500 — SQuAD에서의 0.70대와 대조'},
 {k:'단어매칭만으로 풀리는 질문 비율', v:'32.7% (NewsQA) vs 39.8% (SQuAD)', d:'1,000문항 수작업 라벨링 결과, inference+synthesis는 NewsQA가 33.9% vs SQuAD 20.5%'},
 {k:'문장 단위 정답 위치 찾기(isf) 정확도', v:'35.4% (NewsQA) vs 79.4% (SQuAD)', d:'문서 길이를 맞춰도(표5) 격차 유지 — 긴 글이라서가 아니라 질문 자체가 어렵다는 근거'}
],

impact:'"크라우드워커가 답 문단을 안 보고 질문을 쓰게 한다"는 절차 하나로, 같은 크라우드소싱 방식이라도 질문의 난이도가 크게 달라질 수 있음을 보였다. 이는 이후 독해 데이터셋 설계에서 "질문 작성자에게 무엇을 보여줄 것인가"가 데이터셋 난이도를 좌우하는 핵심 변수라는 인식을 굳혔다. 동시에 모델(mLSTM·BARB)과 사람의 격차를 정량 지표로 못박아, 이후 모델 성능이 이 격차를 얼마나 좁히는지가 연구 진척의 척도가 되었다.',

legacy:[
 '**답 없는 질문(null span) 아이디어가 [SQuAD 2.0](#/p/squad2)으로 이어짐** — "답을 모른다고 답하는 것"을 정식 평가 대상에 넣는 흐름의 초기 사례',
 '**MRQA 등 후속 다중 데이터셋 벤치마크에 NewsQA가 포함** — 여러 독해 데이터셋을 함께 섞어 일반화 능력을 재는 흐름에서 표준 구성원이 됨',
 '**질문·답변자 분리 절차가 이후 크라우드소싱 QA 수집의 참조 설계가 됨** — "작성자가 정답 문맥을 보면 질문이 쉬워진다"는 문제의식이 데이터셋 설계 체크리스트에 자리잡음',
 '**[CBT](#/p/cbt)·CNN/Daily Mail 계열(빈칸 채우기)에서 사람이 직접 쓰는 질문 계열로의 전환**을 [SQuAD](#/p/squad)와 함께 완성한 논문 중 하나'
],

pitfalls:[
 '**"NewsQA가 SQuAD보다 어렵다"는 주장은 사람 대 사람 F1 비교(0.694 vs 0.807)에 근거한다.** 둘 다 같은 4명의 평가자·같은 방식으로 잰 수치이며, 원 SQuAD 논문이 보고한 사람 F1(0.905)과는 방법론이 달라 직접 비교하면 안 된다.',
 '**모델 성능(mLSTM/BARB) 표는 답 합의가 된 부분집합(9만여 문항)만 쓴다.** null span·비합의 문항은 이 논문의 주 실험에서 제외됐고, 저자들도 "답 없음 판별은 향후 과제"라고 명시한다.',
 '**isf 문장매칭 실험(0.354 vs 0.794)을 단순 단어수 차이로 오해하기 쉽다.** 저자들은 SQuAD 문서를 인위적으로 이어붙여 길이를 맞춘 대조 실험(표5)까지 수행해, 격차가 문서 길이가 아니라 질문 자체의 난이도 때문임을 보였다.'
],

figures:[
 {f:'fig1-stratified.png',
  cap:'왼쪽: 답 유형별(Person·Location·Clause Phrase 등) F1·EM. 오른쪽: 추론 유형별(Word Matching→Synthesis로 갈수록 어려움) F1을 NewsQA(진한 막대)와 SQuAD(연한 막대)로 나란히 비교 — 오른쪽 아래로 갈수록(더 어려운 추론일수록) NewsQA 막대가 SQuAD보다 짧아지는 간격이 벌어진다.',
  src:'원문 Figure 1, p.9'}
],

quotes:[
 {t:'The performance gap between humans and machines (0.198 in F1) indicates that significant progress can be made on NewsQA through future research.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1611.09830 — NewsQA', u:'https://arxiv.org/abs/1611.09830'},
 {t:'NewsQA 데이터셋 (Maluuba)', u:'https://www.microsoft.com/en-us/research/project/newsqa-dataset/'}
]
});
