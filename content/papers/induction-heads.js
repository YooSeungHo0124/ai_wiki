WIKI.paper({
slug:'induction-heads',
venue:'Transformer Circuits Thread (Anthropic), 2022',
authors:'Catherine Olsson, Nelson Elhage, Neel Nanda et al. (Anthropic)',
arxiv:'2209.11895',

tldr:'학습 도중 어느 시점에 `[A][B] … [A] → [B]` 를 수행하는 attention head 쌍이 **갑자기** 형성되고, 바로 그 순간 모델의 in-context learning 능력이 급등한다. 성능 곡선의 계단이 내부 회로의 상전이(phase change)와 시점상 일치함을 보인, 기계적 해석가능성의 대표 사례다.',

context:'[GPT-3](#/p/gpt3) 이후 "few-shot 프롬프트만으로 새 과제를 푼다"는 in-context learning은 대형 모델의 핵심 성질로 자리 잡았지만, 그것이 **모델 안에서 무엇으로 구현되는지**는 공백이었다. 한편 Anthropic의 *A Mathematical Framework for Transformer Circuits*(2021)는 attention-only 소형 모델을 분해하다가, 2층 모델에만 나타나는 특정 회로 — 앞 토큰을 가리키는 head와 그 출력을 읽어 "이전에 이 토큰 뒤에 오던 것"을 복사하는 head의 조합 — 를 발견하고 **induction head**라 이름 붙였다. 이 논문은 그 장난감 관찰을 실제 크기의 모델로 끌고 가서, 회로의 형성 시점과 능력의 등장 시점을 **같은 시간축 위에서** 비교한다.',

ideas:[
 {h:'induction head가 실행하는 규칙: 이전 등장 패턴의 복사',
  lead:'A 다음에 예전에 등장했던 토큰 B를 찾아 그대로 예측으로 민다.',
  d:'문맥 안에서 현재 토큰 $A$ 를 찾아, **과거에 $A$ 가 나왔던 자리의 바로 다음 토큰** $B$ 를 찾아 그것을 예측으로 밀어넣는다. 문자열 매칭에 가까운 동작이지만, 임베딩 공간에서 이루어지므로 정확한 반복뿐 아니라 "비슷한 것 다음에 비슷한 것"으로 **부드럽게 일반화**된다. 이 유연함이 단순 반복 감지를 넘어 few-shot 패턴 모방까지 설명하는 근거가 된다.'},
 {h:'최소 2층이 필요한 조합 회로',
  lead:'1층이 앞 토큰 정보를 쓰고 2층이 그것을 키로 읽어 매칭한다.',
  d:'1층에서 **previous-token head**가 각 위치에 "내 앞 토큰이 무엇이었는지"를 써 넣고, 2층의 induction head가 그 정보를 **키(key)로 읽어** 매칭한다. 한 head의 출력이 다른 head의 Q/K를 바꾸는 이 관계를 K-composition이라 부른다. 1층 attention-only 모델에는 원리적으로 만들 수 없고, 이것이 "능력이 층 수에 따라 불연속적으로 생긴다"는 관찰의 구조적 이유다.'},
 {h:'상전이: 손실 곡선의 눈에 보이는 혹',
  lead:'학습 초반 좁은 구간에서 회로 지표와 ICL 능력이 함께 급등한다.',
  d:'학습 초반의 좁은 구간에서 induction head의 지표(prefix-matching score)가 급상승하고, 동시에 in-context learning 점수가 급등하며, 전체 학습 손실 곡선에도 **작은 혹(bump)**이 남는다. 세 가지가 같은 구간에 몰려 있다는 것이 이 논문의 핵심 관측이며, 손실 곡선이 매끄러워 보여도 그 아래에서는 이산적인 사건이 일어나고 있음을 보여준다.'},
 {h:'능력을 숫자 하나로 정의한다 — in-context learning score',
  lead:'문맥 뒤쪽과 앞쪽 손실의 차이로 능력을 하나의 스칼라로 정의한다.',
  d:'문맥의 **500번째 토큰의 손실에서 50번째 토큰의 손실을 뺀 값**으로 정의한다. 음수일수록 "문맥이 길어질수록 더 잘 맞춘다"는 뜻이다. 상전이 이전 모델은 토큰 50 근처에서 손실 개선이 멈추지만, 이후 모델은 계속 좋아진다. 애매한 능력 개념을 **모델 크기와 학습 스텝에 걸쳐 비교 가능한 단일 스칼라**로 만든 것이 이 논문의 방법론적 기여다.'},
 {h:'인과성을 여섯 갈래로 나눠 검증한다',
  lead:'시점 일치부터 개입 실험까지 여러 증거를 겹쳐 인과를 검증한다.',
  d:'상관만으로는 부족하므로 논문은 여섯 개의 논거를 병렬로 쌓는다 — 시점 일치, 아키텍처 개입(head 간 정보 흐름을 인위적으로 바꾸면 상전이가 이동한다), head를 지웠을 때의 능력 손실, 소형 모델에서의 완전한 회로 해부 등. 소형 모델에서는 **엄밀한 증명에 가깝고**, 대형 모델에서는 **정황 증거**라는 강도 차이를 논문 스스로 명시한다.'}
],

diagram:{type:'flow', cap:'induction head가 실행하는 연산. 문맥 안에서 같은 토큰의 이전 등장을 찾아 그 다음 토큰을 복사한다.',
 nodes:[
  {t:'문맥', s:'… [A] [B] … [A]'},
  {t:'1층: 이전토큰 head', s:'각 위치에 "앞 토큰" 기록'},
  {t:'2층: induction', s:'현재 [A]로 과거 [A]를 매칭', acc:true},
  {t:'값 복사', s:'[A] 다음에 있던 [B]를 읽음'},
  {t:'출력 logit', s:'다음 토큰 = [B] 상향'}
 ]},

math:[
 {expr:'ICL score = loss(500번째 토큰) − loss(50번째 토큰)',
  tex:'\\text{ICL score}=\\text{loss}_{500}-\\text{loss}_{50}',
  d:'값이 작을(더 음수일) 수록 문맥을 잘 활용한다는 뜻. 학습 스텝을 x축에 두고 이 값을 그리면, 어느 구간에서 급격히 떨어지는 계단이 나타난다.'},
 {expr:'K-composition:  Q·Kᵀ 의 K 가 이전 층 head 출력의 함수',
  tex:'K^{(2)}=f\\!\\left(h^{(1)}\\right)',
  d:'residual stream을 공용 버스로 보면, 1층 head가 거기에 쓴 정보를 2층 head가 key로 읽는 구조다. head들이 독립적인 부품이 아니라 **읽고 쓰는 파이프라인**으로 조합된다는 [Transformer](#/p/transformer) 해석의 기본 문법이 여기서 쓰인다.'}
],

numbers:[
 {k:'상전이 구간', v:'학습 토큰 2.5×10⁹ ~ 5×10⁹', d:'전체 학습의 아주 초반. 모델 크기가 달라도 대체로 이 좁은 구간에 몰린다'},
 {k:'회로 최소 깊이', v:'2층', d:'1층 attention-only 모델에서는 induction head가 원리적으로 형성되지 않는다'},
 {k:'ICL 측정 위치', v:'토큰 50 → 500', d:'상전이 이전 모델은 토큰 50 근처에서 손실 개선이 사실상 멈춘다'},
 {k:'인과 논거 수', v:'6개', d:'소형 모델은 회로 수준 해부, 대형 모델은 시점 일치·개입 실험 — 증거 강도가 다름을 논문이 구분해 서술'}
],

figures:[
 {f:'fig1-phase-change.png',
  cap:'x축은 학습 토큰 수, y축은 in-context learning score(50번째 토큰 손실 − 500번째 토큰 손실, 더 음수일수록 문맥 활용을 잘함). 1층 모델(왼쪽)은 완만하게 내려갈 뿐이지만, 2층·3층 모델(가운데·오른쪽)은 주황색으로 표시된 좁은 구간에서 수직으로 꺾여 급락한다 — 이 구간이 곧 induction head가 형성되는 상전이 지점이다.',
  src:'원문 "Models with more than one layer..." 그림, p.9'}
],

quotes:[
 {t:'We find that induction heads develop at precisely the same point as a sudden sharp increase in in-context learning ability, visible as a bump in the training loss.',
  src:'Abstract'}
],

impact:'**(1) "창발"에 기계적 후보가 생겼다.** [창발 능력](#/p/emergent) 논쟁이 "곡선이 왜 계단인가"를 두고 벌어질 때, 이 논문은 적어도 in-context learning에 대해서는 "특정 회로가 특정 시점에 생기기 때문"이라는 구체적 서술을 제공했다. **(2) 회로 단위 분석이 표준 도구가 되었다.** head 단위 지표(prefix-matching score, copying score), 정보 흐름 차단(ablation·path patching), residual stream을 버스로 보는 관점이 이후 해석가능성 연구의 공통 어휘가 되었다. **(3) 학습 동역학을 관측 대상으로 만들었다.** 최종 체크포인트가 아니라 **학습 궤적 전체**를 스캔하며 내부 구조의 등장 시점을 찾는 실험 설계가 널리 복제되었다.',

legacy:[
 '**회로 해부의 확산** — IOI(간접 목적어 식별) 회로, 사실 회상 회로처럼 특정 과제의 회로를 head 단위로 특정하는 연구군이 형성되고, 개입 기법(activation patching)이 표준화됨',
 '**특징 단위로의 이동** — head/뉴런 단위 분석의 한계(중첩, 다의성)가 드러나면서 [희소 오토인코더](#/p/sae)로 분석 단위를 특징(feature)으로 옮기는 흐름으로 이어짐',
 '**학습 동역학 해석과의 접점** — 학습 도중 갑작스러운 능력 변화를 회로 형성으로 설명하는 틀이 [grokking](#/p/grokking) 연구와 상호 인용되며 "언제 무엇이 생기는가"라는 공통 질문을 만듦',
 '**긴 문맥 설계에 대한 실용적 영향** — 복사·검색 회로가 in-context 성능의 큰 부분을 떠받친다는 관점이 검색 증강([RAG](#/p/rag))이나 위치 인코딩 외삽([RoPE](#/p/rope), [ALiBi](#/p/alibi)) 평가에서 "복사 능력이 유지되는가"를 보는 습관을 만듦'
],

pitfalls:[
 '**"in-context learning = induction head"는 논문의 주장이 아니다.** 소형 attention-only 모델에서는 강한 인과 주장이 가능하지만, 대형 모델에 대해서는 "상당 부분을 설명한다"는 정황 증거 수준이라고 논문 스스로 못 박는다. 실제 few-shot 추론에는 induction 외의 회로도 관여한다.',
 '**prefix-matching score가 높다고 그 head가 induction head라는 보장은 없다.** 지표는 행동의 대리(proxy)이고, 같은 지표를 만족시키는 다른 동작이 존재할 수 있다. 지표로 후보를 좁힌 뒤 개입 실험으로 확인하는 두 단계가 필요하다.',
 '**상전이 시점의 수치를 다른 학습 설정에 그대로 옮기면 안 된다.** 2.5B~5B 토큰이라는 구간은 이 논문의 데이터·토크나이저·최적화 설정에 딸린 값이며, 데이터 분포가 바뀌면 시점도 이동한다.'
],

links:[
 {t:'In-context Learning and Induction Heads (Transformer Circuits)', u:'https://transformer-circuits.pub/2022/in-context-learning-and-induction-heads/index.html'},
 {t:'arXiv 2209.11895', u:'https://arxiv.org/abs/2209.11895'},
 {t:'A Mathematical Framework for Transformer Circuits (2021)', u:'https://transformer-circuits.pub/2021/framework/index.html'}
]
});
