WIKI.paper({
slug:'mambatrack',
venue:'ACM MM 2024',
authors:'Xiao, Cao, Luo, Lan (NUDT · JD Explore Academy)',
arxiv:'2408.09178',

tldr:'칼만 필터를 **양방향 Mamba 모션 예측기(MTP)**로 바꾸고, 놓친 트랙을 자기회귀로 이어 가는 패칭 모듈을 얹은 단순한 베이스라인. 외형 없이 IoU 매칭만으로 DanceTrack test 56.8 HOTA를 기록했다.',

context:'[SORT](#/p/sort) 계열은 칼만 필터로 위치를 예측하는데, 춤·스포츠처럼 움직임이 비선형이고 외형이 비슷한 장면에서는 외형 단서도 모션 단서도 믿기 어렵다. [OC-SORT](#/p/ocsort)는 KF의 한계를 보정했지만 여전히 선형 가정 위에 있다. 학습형 모션 예측기를 쓴다면 LSTM은 학습이 비효율적이고 장기 모델링이 약하며, Transformer는 시퀀스 길이에 대해 제곱 복잡도를 가진다는 것이 저자들의 문제의식이다. 선택적 상태 공간 모델인 [Mamba](#/p/mamba)는 선형에 가까운 복잡도로 시퀀스를 다룰 수 있어 후보가 되었다.',

ideas:[
 {h:'MTP: 궤적을 입력으로 받는 Mamba 예측기',
  lead:'박스 변화량 시퀀스를 토큰으로 바꿔 bi-Mamba 층에 통과시키고 다음 오프셋을 낸다.',
  d:'입력은 최근 $q=10$ 프레임의 정규화된 변화량 $[\\delta c_x,\\delta c_y,\\delta w,\\delta h]$ 이고, 선형 층이 이를 $d_m=512$ 차원 토큰으로 바꾼다. 인코더는 bi-Mamba 블록 $L=3$ 개이며 출력은 평균 풀링 뒤 두 층짜리 FC 헤드로 다음 오프셋을 낸다. 손실은 smooth L1이다. 외형 특징은 쓰지 않는다.'},
 {h:'Bi-Mamba: 앞뒤 방향을 둘 다 읽는다',
  lead:'Mamba는 단방향이라, 한 블록에 정방향·역방향 모듈을 두고 합친다.',
  d:'블록 안에서 정방향 Mamba와 역방향 Mamba의 출력을 더한 뒤 MLP와 LayerNorm을 거치는 잔차 구조다. 저자들은 입력 궤적의 정보를 충분히 쓰기 위한 설계라고 설명한다. 이력이 짧아도 양방향으로 훑는 편이 낫다는 것이 ablation의 결론이다.'},
 {h:'TPM: 놓친 트랙을 자기회귀로 이어 간다',
  lead:'매칭 실패한 트랙의 빈 프레임을 MTP 자신의 예측으로 메우며 계속 전진시킨다.',
  d:'가림이나 블러로 검출이 끊기면, 직전 예측 박스 $\\hat b$ 를 실제 관측처럼 이력에 넣고 다음 위치를 다시 예측한다. 이렇게 모은 lost 트랙의 예측 박스는 신뢰도가 낮으므로 active 트랙을 먼저 매칭하고, 남은 검출만 lost 트랙과 두 번째로 매칭한다. 30프레임 동안 갱신이 없으면 트랙을 삭제한다.'},
 {h:'divide-and-conquer 연관',
  lead:'active와 lost를 나눠 IoU 헝가리안을 두 번 돌리는 단순한 구조다.',
  d:'1차: active 트랙의 MTP 예측 박스와 검출 간 IoU로 매칭. 2차: 남은 검출과 lost 트랙의 패치 박스를 IoU로 매칭한다. 남은 검출 중 점수 0.6 초과인 것은 새 트랙이 된다. 베이스라인이라는 이름처럼 이 단계에는 별다른 장치가 없다.'}
],

diagram:{type:'flow', cap:'MambaTrack의 프레임당 흐름. active 트랙은 MTP가, lost 트랙은 TPM이 박스를 예측하고 두 번 순서대로 IoU 매칭한다.',
 nodes:[
  {t:'궤적 이력', s:'q=10 프레임'},
  {t:'MTP', s:'bi-Mamba × 3', acc:true, a:'예측 박스'},
  {t:'1차 IoU 매칭', s:'active 트랙'},
  {t:'TPM 패칭', s:'lost 트랙 자기회귀', a:'남은 검출'},
  {t:'2차 IoU 매칭', s:'트랙 갱신'}
 ]},

math:[
 {tex:'\\hat X_{fwd}=\\text{Mamba}(X_{l-1}),\;\\hat X_{bwd}=\\text{Mamba}_{bwd}(X_{l-1}),\;X_l=\\hat Y+\\text{LN}(\\text{MLP}(\\hat Y)),\;\\hat Y=\\hat X_{fwd}+\\hat X_{bwd}',
  expr:'Y = Mamba(X) + Mamba_bwd(X); X_next = Y + LN(MLP(Y))',
  d:'bi-Mamba 블록 한 층. 정방향·역방향 출력을 더한 뒤 잔차로 쌓는다.'},
 {tex:'\\hat p^{\\,i}_{t+1}=\\text{MTP}\\big(\\mathcal{T}_{past},\\,\\hat p^{\\,i}_{t}\\big)',
  expr:'p_{t+1} = MTP(과거 궤적, p_t)',
  d:'TPM의 자기회귀. 매칭되지 못한 프레임에서는 직전 예측 $\\hat p_t$ 를 관측으로 삼아 한 프레임씩 더 전진시킨다.'}
],

numbers:[
 {k:'DanceTrack test · HOTA/IDF1/AssA', v:'56.8 / 57.8 / 39.8', d:'OC-SORT는 54.6 / 54.6 / 40.2. AssA는 OC-SORT가 근소하게 높다'},
 {k:'SportsMOT test · HOTA/IDF1', v:'72.6 / 72.8', d:'OC-SORT 71.9 / 72.2, ByteTrack 62.8 / 69.8'},
 {k:'ablation (DanceTrack val · HOTA)', v:'KF 45.9 → +MTP 54.9 → +TPM 55.1', d:'MTP가 +9.0을 가져오고 TPM은 IDF1 +1.6, AssA +0.7을 더한다'},
 {k:'모션 모델 비교 (val · HOTA)', v:'LSTM 51.3 · Transformer 52.5 · MTP 54.9', d:'같은 궤적 특징을 입력으로 쓴 비교'},
 {k:'bi-Mamba vs 단방향 Mamba (val · HOTA)', v:'52.4 → 54.9', d:'블록 수는 L=3에서 최고(L=1 52.1, L=4 52.1)'},
 {k:'추론 시간 (노트북 RTX 4060)', v:'프레임당 67 ms (17 FPS)', d:'트래킹 11.37 ms(19%), 검출 48.41 ms(81%)'}
],

impact:'MambaTrack은 상태 공간 모델을 MOT의 모션 예측기로 가져온 베이스라인이다. 저자들은 자신을 이 방향의 첫 번째가 아니라 "최초 중 하나"로 쓰며, 같은 시기 바닐라 Mamba 블록으로 모션을 예측한 선행 연구가 있다고 밝힌다. MTP를 SORT·ByteTrack·MixSort에 꽂았을 때도 HOTA가 각각 +9.0, +6.8, +5.7 오른다는 점은 예측기를 갈아끼우는 방식의 일반성을 보여 준다. 다만 외형을 쓰지 않으므로 외형이 중요한 일반 보행자 데이터에서의 성능은 이 논문이 다루지 않는다.',

legacy:[
 '[OC-SORT](#/p/ocsort)의 "KF를 보정"하는 접근에서 "KF를 학습 모델로 교체"하는 접근으로 이어진 계열이다',
 '[Mamba](#/p/mamba)를 객체 추적의 모션 모델에 적용한 초기 사례 중 하나다(저자 표현)',
 '[DiffMOT](#/p/diffmot)와 같은 해에 같은 벤치마크(DanceTrack, SportsMOT)를 겨냥해 학습형 모션 예측기를 내놓았다(서로 직접 비교하지는 않는다)',
 '놓친 트랙을 예측으로 메우는 TPM 아이디어는 모션 모델이 있는 어떤 SORT 계열에도 붙일 수 있다'
],

pitfalls:[
 '**ablation의 baseline은 KF 기반 SORT형 구조다.** 표의 +9.0 HOTA는 val 셋에서 KF를 MTP로 바꾼 값이고, test의 OC-SORT와의 차이(+2.2)와 다른 숫자다.',
 '**DanceTrack에서 AssA는 OC-SORT보다 낮다**(39.8 대 40.2). DetA도 80.1 대 80.4로 근소하게 낮아, "모든 지표에서 우세"로 읽으면 안 된다. 앞서는 지표는 HOTA·IDF1·MOTA다.',
 '**속도는 노트북 GPU 기준 17 FPS이며 대부분이 검출기 비용이다.** 논문도 최적화를 거쳐야 실시간이 가능하다고 쓴다.'
],

figures:[
 {f:'fig1-overall.png',
  cap:'위쪽은 과거 프레임들. 왼쪽 active 트랙은 MTP가 예측한 박스로 검출과 먼저 매칭하고, 오른쪽 lost 트랙은 TPM이 자기회귀로 만든 박스로 남은 검출과 다시 매칭한다. 두 결과를 합쳐 최종 트랙을 얻는다.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'To the best of our knowledge, we are among the first to utilize the Mamba architecture for multi-object tracking.',
  src:'Related Work 2.3, p.3'}
],

links:[
 {t:'arXiv 2408.09178 — MambaTrack', u:'https://arxiv.org/abs/2408.09178'},
 {t:'ACM DL (MM 2024)', u:'https://doi.org/10.1145/3664647.3680944'}
]
});
