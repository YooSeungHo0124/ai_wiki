WIKI.concept({
slug:'flash-attention-c',

tldr:'GPU의 느린 HBM과 빠른 SRAM 사이 메모리 이동을 타일링·재계산으로 줄여, 근사 없이 수학적으로 정확한 어텐션을 더 빠르고 적은 메모리로 계산하는 알고리즘.',

why:'"FlashAttention이 왜 빠른가"를 "계산을 줄여서"라고 답하면 틀린다. [셀프 어텐션](#/c/self-attention)의 연산량($O(n^2 d)$)은 그대로인데도 실측 속도가 몇 배씩 빨라지는 이유를 모르면, GPU 커널 최적화가 왜 근사 기법과 다른 층위의 해법인지, 왜 [Reformer](#/p/reformer)·[Performer](#/p/performer) 같은 근사 방법들이 실무에서 밀려났는지를 이해할 수 없다.',

sections:[
 {h:'병목은 연산이 아니라 이동', d:'GPU에는 속도가 다른 두 종류의 메모리가 있다. 용량은 크지만 느린 HBM(High Bandwidth Memory, GPU의 "주메모리")과, 용량은 작지만 훨씬 빠른 SRAM(연산 유닛 바로 옆의 캐시)이다. 표준 어텐션 구현은 $QK^\\top$ 로 $n\\times n$ 행렬을 만들어 HBM에 통째로 써넣고, softmax 를 위해 다시 읽어오고, 그 결과를 또 HBM에 썼다가 $V$ 와 곱하려고 다시 읽는다 — 행렬 하나를 두고 HBM을 여러 번 왕복한다. 모던 GPU에서는 연산 유닛(FLOPs)이 메모리 대역폭보다 훨씬 빠르게 발전해 왔기 때문에, 어텐션처럼 큰 중간 행렬을 오가는 연산에서는 실제 병목이 "얼마나 계산하는가"가 아니라 "HBM을 몇 번 왕복하는가"에 있다.'},
 {h:'타일링의 핵심', d:'FlashAttention은 $Q,K,V$ 를 작은 블록(타일)으로 쪼개 SRAM에 올린 뒤, $n\\times n$ 짜리 전체 어텐션 행렬을 HBM에 한 번도 통째로 쓰지 않고 타일 단위로 부분합을 갱신해 나간다. softmax 는 분모(정규화 상수)를 알아야 계산할 수 있는데, 전체 행을 다 봐야 분모를 알 수 있을 것 같지만, 온라인 softmax 기법으로 타일을 하나씩 볼 때마다 지금까지 본 부분의 최댓값과 합을 재조정하며 누적할 수 있다. 그 결과 SRAM 안에서 계산이 끝나고 HBM에는 최종 출력만 써서, 중간 $n\\times n$ 행렬을 HBM에 왕복시키는 비용 자체를 없앤다.'},
 {h:'역전파는 재계산으로 해결', d:'표준 구현은 역전파에 필요한 어텐션 가중치 행렬을 순전파 때 저장해 뒀다가 재사용한다. FlashAttention은 그 행렬을 아예 저장하지 않고, 역전파 때 순전파 입력($Q,K,V$)과 타일 단위 통계(최댓값·합)만으로 필요한 부분을 다시 계산한다. 메모리를 아끼는 대신 연산을 조금 더 쓰는 셈인데, 그 추가 연산이 HBM 왕복을 줄여서 버는 시간보다 훨씬 작기 때문에 전체적으로는 순이득이다 — 이것도 gradient checkpointing과 같은 "메모리와 연산을 맞바꾼다"는 발상이지만, 대상이 활성값 전체가 아니라 어텐션 행렬 하나로 국소적이다.'},
 {h:'근사가 아니라 정확한 결과', d:'여기서 가장 중요한 지점은 FlashAttention이 계산 순서와 메모리 접근 패턴만 바꿨을 뿐, 수학적으로 표준 어텐션과 **완전히 동일한 값**을 낸다는 것이다. 이는 시퀀스를 지역 윈도우·랜덤 연결로만 근사해 계산량 자체를 줄이는 [Reformer](#/p/reformer)의 LSH 어텐션이나 [Performer](#/p/performer)의 커널 근사와는 다른 층위의 해법이다. 근사 기법들은 정확도를 일부 포기하는 대가로 이론적 계산량을 줄이지만, FlashAttention은 정확도를 하나도 포기하지 않고 "같은 계산을 어떤 순서로, 어디서 하느냐"만 바꿔 실측 속도를 올린다.'}
],

math:[
 {tex:'\\ell_{\\text{new}}=\\ell_{\\text{old}}\\, e^{\\,m_{\\text{old}}-m_{\\text{new}}} + \\sum_j e^{\\,x_j-m_{\\text{new}}}',
  expr:'online softmax 갱신식', d:'$m$ 은 지금까지 본 값들의 최댓값, $\\ell$ 은 그 최댓값 기준으로 정규화한 지수합이다. 새 타일 $x_j$ 를 볼 때마다 최댓값이 갱신될 수 있으므로, 예전 최댓값 $m_{\\text{old}}$ 기준으로 쌓아둔 합 $\\ell_{\\text{old}}$ 을 새 최댓값 $m_{\\text{new}}$ 기준으로 다시 스케일한 뒤 새 타일의 기여분을 더한다. 이 재조정 덕분에 전체 행을 한 번에 보지 않고도 타일 단위로 정확한 softmax 분모를 누적할 수 있다.'}
],

diagram:{type:'compare', cap:'표준 구현은 큰 중간 행렬을 HBM에 여러 번 왕복시키고, FlashAttention은 타일 단위로 SRAM 안에서 끝낸다.',
 left:{t:'표준 어텐션', items:['QKᵀ n×n을 HBM에 저장','softmax 위해 재로드','다시 HBM에 쓰고 V와 곱함','HBM 왕복 여러 번']},
 right:{t:'FlashAttention', items:['Q,K,V를 타일로 SRAM에 로드','온라인 softmax로 부분합 갱신','n×n 행렬 HBM 미생성','최종 출력만 HBM에 기록']}},

confuse:[
 {a:'FlashAttention', b:'[Reformer](#/p/reformer)·[Performer](#/p/performer)', d:'Reformer·Performer는 어텐션을 근사해 이론적 계산량 자체를 $O(n^2)$ 미만으로 줄이는 알고리즘 층위의 해법이다. FlashAttention은 계산량은 그대로 두고 GPU 메모리 이동 패턴만 바꾸는 구현 층위의 해법이며, 수학적으로 정확한 결과를 낸다는 점이 결정적으로 다르다.'},
 {a:'FlashAttention', b:'[sparse attention](#/p/sparse-attn)', d:'sparse attention은 어텐션 행렬의 일부 칸을 아예 계산하지 않기로(마스킹) 정해 계산량을 줄인다. FlashAttention은 어떤 칸을 계산할지는 표준 어텐션과 똑같이 전부 계산하고, 그 계산을 어떤 순서로 메모리에 오가며 하느냐만 바꾼다.'},
 {a:'타일링(FlashAttention)', b:'배치(batching)', d:'배치는 여러 입력 샘플을 한 번에 처리해 GPU 활용률을 높이는 것이고, 타일링은 하나의 어텐션 연산 안에서 큰 행렬을 작은 조각으로 나눠 SRAM에 맞춰 처리하는 것이다. 둘은 독립적으로 함께 적용된다.'}
],

pitfalls:[
 '"연산량을 줄인 게 아니니 속도 이득이 없을 것"이라고 생각하기 쉽지만, 실제로는 메모리 대역폭이 병목인 상황에서 이동량을 줄이는 것이 연산량을 줄이는 것보다 실측 성능에 더 크게 기여하는 경우가 많다.',
 'FlashAttention은 GPU 하드웨어(SRAM 크기, 텐서 코어 구조)에 맞춘 커널 구현이라 CPU나 오래된 GPU에서는 같은 이득을 못 보거나 지원 자체가 안 될 수 있다.',
 '역전파에서 어텐션 행렬을 재계산한다는 것을 "느려지는 손해"로만 보면 안 된다 — 메모리 왕복을 줄여 버는 시간이 재계산 비용보다 커서 전체 학습 속도는 오히려 빨라진다.'
],

code:{lang:'text', d:'타일 하나를 처리할 때마다 온라인 softmax 통계(최댓값 m, 지수합 l, 출력 O)를 갱신하는 흐름의 의사코드.',
 src:'for each K,V 타일 j:\n    S_j = Q_i @ K_j.T / sqrt(d_k)      # SRAM 안에서만 존재\n    m_new = max(m_old, rowmax(S_j))\n    l_new = l_old * exp(m_old-m_new) + rowsum(exp(S_j-m_new))\n    O_new = O_old * exp(m_old-m_new) + exp(S_j-m_new) @ V_j\n    m_old, l_old, O_old = m_new, l_new, O_new\n# 루프가 끝나면 O_old / l_old 가 이 쿼리 블록의 최종 출력'},

papers:['flashattention','memory-efficient-attn','reformer','performer'],
terms:['self-attention','kv-cache','attention-variants']
});
