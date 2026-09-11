WIKI.concept({
slug:'bleu-rouge',

tldr:'BLEU 는 생성문과 참조문의 n-gram 정밀도를, ROUGE 는 n-gram 재현율을 재는 겹침 기반 지표로 번역·요약 평가에 쓰인다.',

why:'두 지표 모두 표면적인 단어 겹침만 보기 때문에 의미가 같아도 표현이 다르면 점수가 깎이고, 반대로 그 지표 자체를 학습 목표로 직접 최적화하면 의미와 무관하게 점수만 오르는 일이 실제로 일어난다. 논문의 BLEU/ROUGE 점수를 볼 때 이 한계를 모르면 숫자를 과신하게 된다.',

sections:[
 {h:'BLEU: n-gram 정밀도', d:'기계 번역 평가를 위해 만들어졌다. 생성문의 n-gram(보통 1~4-gram)이 참조문에 얼마나 등장하는지를 정밀도로 재고, 여러 n 에 대한 정밀도를 기하평균 낸다. 같은 n-gram 을 반복해서 점수를 부풀리는 것을 막기 위해 참조문에 등장하는 횟수로 클리핑하고, 생성문이 참조문보다 너무 짧으면 간결성 페널티(brevity penalty)를 곱해 점수를 깎는다.'},
 {h:'ROUGE: n-gram 재현율', d:'요약 평가를 위해 만들어졌고 방향이 반대다 — 참조 요약의 n-gram 중 생성 요약이 몇 %를 포함하는지(재현율 중심)를 잰다. ROUGE-N 은 n-gram 겹침, ROUGE-L 은 최장 공통 부분수열(LCS) 기반이라 순서는 지키되 연속하지 않아도 되는 겹침을 허용한다. BLEU 가 정밀도, ROUGE 가 재현율에 가깝다는 비대칭은 두 작업의 성격 차이(번역은 군더더기를 넣지 않는 게 중요, 요약은 핵심을 빠뜨리지 않는 게 중요)를 반영한다.'},
 {h:'표면 겹침의 근본적 한계', d:'두 지표 모두 단어·구의 표면 형태만 비교하므로 동의어나 어순 재배치로 같은 의미를 다르게 표현하면 점수가 깎인다. "그는 빠르게 뛰었다"와 "그는 빨리 달렸다"는 의미가 거의 같지만 n-gram 이 거의 안 겹쳐 점수가 낮게 나올 수 있다. 반대로 원문을 그대로 복사-붙여넣기 하면 점수가 매우 높게 나오는데, 이는 요약이나 번역의 질과는 무관한 현상이다.'},
 {h:'지표를 직접 최적화하면 지표만 오른다', d:'[요약 RLHF](#/p/rl-summarization) 연구가 보여준 것처럼, ROUGE 를 보상으로 강화학습을 돌리면 ROUGE 점수는 오르지만 사람이 읽었을 때의 요약 품질은 그만큼 따라 오르지 않는다 — 모델이 지표를 속이는 표면적 패턴(참조문의 단어를 그대로 재배치하는 등)을 찾아내기 때문이다. [포인터 생성 요약](#/p/pointer-generator) 논문은 원문의 앞 세 문장을 그대로 잘라내는 단순한 lead-3 베이스라인이 정교한 신경망 요약 모델과 ROUGE 에서 거의 대등하거나 더 높게 나온다는 것을 보였는데, 이는 ROUGE 가 "좋은 요약"보다 "원문 앞부분과 겹치는 정도"에 취약하다는 뜻이다.'}
],

math:[
 {tex:'p_n=\\dfrac{\\sum_{\\text{ngram}} \\min(\\text{count}_{\\text{gen}},\\text{count}_{\\text{ref}})}{\\sum_{\\text{ngram}} \\text{count}_{\\text{gen}}}', expr:'클리핑된 n-gram 정밀도', d:'생성문의 n-gram 이 참조문에도 나오는 만큼만(참조문 등장 횟수로 상한을 걸어) 인정한다. 같은 단어를 반복해서 점수를 부풀리는 것을 막는다.'},
 {tex:'\\text{BLEU}=\\text{BP}\\cdot\\exp\\Big(\\sum_{n=1}^N w_n\\log p_n\\Big)', expr:'BLEU', d:'보통 $N=4$, $w_n=1/N$ 로 균등 가중. BP(brevity penalty)는 생성문이 참조문보다 짧을 때만 1보다 작게 곱해져 점수를 깎는다 — 짧게 써서 정밀도만 올리는 편법을 막는다.'},
 {tex:'\\text{ROUGE-N}=\\dfrac{\\sum_{\\text{ngram}\\in ref}\\min(\\text{count}_{\\text{gen}},\\text{count}_{\\text{ref}})}{\\sum_{\\text{ngram}\\in ref}\\text{count}_{\\text{ref}}}', expr:'ROUGE-N 재현율', d:'분모가 참조문의 n-gram 총수라서, 참조문의 핵심 내용을 생성문이 얼마나 "회수"했는지를 잰다. BLEU 의 분모(생성문 기준)와 정반대 방향이다.'}
],

diagram:{type:'compare', cap:'BLEU 와 ROUGE 는 같은 n-gram 겹침을 서로 다른 방향(정밀도 vs 재현율)으로 잰다.',
 left:{t:'BLEU (번역, 정밀도 중심)', items:['생성문 n-gram 중 맞은 비율','짧게 쓰면 불리(BP)','군더더기 없는지가 중요']},
 right:{t:'ROUGE (요약, 재현율 중심)', items:['참조문 n-gram 을 회수한 비율','ROUGE-L 은 LCS 기반','핵심을 빠뜨렸는지가 중요']}},

confuse:[
 {a:'BLEU', b:'ROUGE', d:'BLEU 는 생성문 기준 정밀도(번역이 과하게 늘어나지 않았는지), ROUGE 는 참조문 기준 재현율(요약이 핵심을 놓치지 않았는지)이 중심이다. 같은 n-gram 겹침 개념이지만 분모가 반대다.'},
 {a:'ROUGE-N', b:'ROUGE-L', d:'ROUGE-N 은 연속된 n-gram 이 정확히 일치해야 세고, ROUGE-L 은 최장 공통 부분수열이라 단어 순서만 지키면 중간에 다른 단어가 끼어도 인정한다 — 후자가 더 관대하다.'},
 {a:'표면 겹침 지표(BLEU/ROUGE)', b:'학습된 평가 지표(BERTScore 류)', d:'BLEU/ROUGE 는 단어 문자열 겹침만 보고, 임베딩 기반 지표는 의미적 유사도를 반영한다. 다만 후자도 완벽하지 않고 이 사전의 논의 범위 밖이다.'}
],

pitfalls:[
 'BLEU/ROUGE 점수가 높다고 사람이 보기에 좋은 번역·요약이라고 단정할 수 없다 — 표면 겹침과 실제 품질은 상관이 있지만 완전히 일치하지 않는다.',
 '지표를 보상으로 직접 최적화(RL, reward shaping)하면 지표는 오르지만 실제 품질은 정체되거나 오히려 나빠질 수 있다([요약 RLHF](#/p/rl-summarization)).',
 '단순한 추출 베이스라인(lead-3 등)이 정교한 모델과 ROUGE 에서 비슷하게 나올 수 있다는 것을 모르면, 표의 숫자만 보고 모델이 실제로 "요약을 이해했다"고 오해하게 된다.'
],

papers:['seq2seq','pointer-generator','rl-summarization'],
terms:['fid-is','benchmark-pitfall','data-leakage']
});
