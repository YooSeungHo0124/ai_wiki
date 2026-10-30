WIKI.paper({
slug:'cutie',
venue:'CVPR 2024',
authors:'Cheng, Oh, Price, Lee, Schwing (UIUC · Adobe Research)',
arxiv:'2310.12982',

tldr:'[XMem](#/p/xmem)의 픽셀 단위 메모리 읽기 위에 **객체 쿼리 기반 object transformer**를 얹어, 방해물이 많은 어려운 영상에서 분할이 흔들리지 않게 한 VOS 모델. 어려운 MOSE에서 XMem 대비 J&F +8.7을 얻으면서 속도는 비슷하다.',

context:'메모리 기반 VOS는 과거 프레임을 메모리에 저장하고 새 프레임이 attention으로 읽어 마스크를 만든다. 이때 질의 픽셀 하나하나를 메모리 픽셀의 선형 결합으로 독립적으로 매핑하기 때문에 높은 수준의 일관성이 없고, 비슷하게 생긴 방해물(distractor)이 있으면 매칭 노이즈에 취약하다. 실제로 XMem이나 DeAOT류는 쉬운 DAVIS-2017보다 어려운 MOSE에서 J&F가 20점 넘게 낮다고 저자들은 지적한다. 그래서 하향식(top-down)으로 "객체 전체"를 요약한 표현을 읽기 과정에 끼워 넣자고 제안한다.',

ideas:[
 {h:'Object transformer: 객체 쿼리와 픽셀 특징의 양방향 소통',
  lead:'소수의 객체 쿼리가 노이즈 낀 픽셀 읽기 결과를 반복적으로 보정한다.',
  d:'XMem식 픽셀 메모리에서 얻은 초기 읽기 결과 $R_0$ 를 $N$ 개의 학습된 객체 쿼리와 $L$ 개의 transformer 블록으로 소통시킨다. 각 블록은 쿼리가 픽셀을 읽는 masked cross-attention, 쿼리끼리의 self-attention과 FFN, 다시 픽셀이 쿼리를 읽는 cross-attention, 픽셀 FFN 순이다. 고해상도 픽셀끼리의 self-attention은 계산이 크므로 의도적으로 뺐고, 쿼리를 매개로 전역 소통을 한다. 기본 설정은 $C=256$, $L=3$, $N=16$ 이다.'},
 {h:'전경-배경 masked attention',
  lead:'쿼리 절반은 전경만, 나머지 절반은 배경만 보게 막아 의미를 깨끗이 분리한다.',
  d:'기존 masked attention(Mask2Former)은 전경만 본다. Cutie는 첫 절반 쿼리를 전경, 나머지 절반을 배경에 할당한다. 각 층의 예측 마스크 $M_l$ 이 0.5 이상이면 전경 쿼리가 허용되고, 미만이면 배경 쿼리가 허용된다. 그래도 이어지는 self-attention에서 전경·배경 쿼리가 소통해 전역 상호작용은 유지한다. 방해물이 많은 추적에서 특히 배경을 따로 보는 것이 도움이 된다고 한다.'},
 {h:'컴팩트한 객체 메모리',
  lead:'모든 메모리 프레임의 특징을 $N$ 개 마스크로 풀링한 요약 벡터를 스트리밍 평균으로 유지한다.',
  d:'객체 메모리 $S$ 는 $N$ 개의 풀링 마스크로 객체 특징을 마스크 풀링한 $N$ 개 벡터다. 풀링 마스크도 전경·배경으로 나뉘며 위치 임베딩이 더해진다. 추론 때는 스트리밍 평균으로 갱신해 영상 길이와 무관하게 상수 시간·메모리를 쓴다. 가려져서 풀링 가중치가 0이면 해당 벡터는 바뀌지 않아 특징 표류를 막는다. 이 $S$ 는 정적 쿼리 $X$ 에 더해져 대상별 정보를 쿼리에 실어 준다.'},
 {h:'XMem 픽셀 메모리 재사용',
  lead:'픽셀 메모리는 XMem의 작업·감각 기억에서 가져오고 새 기여를 주장하지 않는다.',
  d:'픽셀 메모리의 키·값 attention과 GRU 은닉 상태는 XMem에서 그대로 파생했다. 긴 영상에서는 XMem의 장기 기억을 재학습 없이 선택적으로 쓸 수 있다. 질의 인코더는 small은 ResNet-18, base는 ResNet-50이고, 마스크 인코더는 ResNet-18이다. 그래서 Cutie-base는 XMem과 같은 백본 구성이 된다.'}
],

diagram:{type:'compare', cap:'픽셀 수준 읽기만 하는 기존 방식과 객체 수준 읽기를 더한 Cutie의 비교.',
 left:{t:'XMem: 픽셀 매칭', items:['질의 픽셀이 독립적으로 매칭','방해물에서 매칭 노이즈','객체 수준 일관성 없음','MOSE 같은 어려운 영상에 약함']},
 right:{t:'Cutie: 객체 읽기 추가', items:['객체 쿼리 N개가 상위 요약','전경·배경 masked attention','객체 메모리로 대상별 특징','고해상도 특징은 그대로 유지']}},

math:[
 {tex:'X_l\'=\\text{softmax}(M_l+Q_lK_l^{\\top})V_l+X_l',
  expr:"X_l' = softmax(M_l + Q_l K_lᵀ) V_l + X_l",
  d:'전경-배경 masked cross-attention. $M_l \\in \\{0,-\\infty\\}^{N\\times HW}$ 가 허용 여부를 정한다. 전경 쿼리는 예측 마스크가 0.5 이상인 픽셀만, 배경 쿼리는 0.5 미만인 픽셀만 본다.'},
 {tex:'S_q=\\frac{\\sum_{i=1}^{THW}U(i)\\,W_q(i)}{\\sum_{i=1}^{THW}W_q(i)}',
  expr:'S_q = Σ_i U(i)·W_q(i) / Σ_i W_q(i)',
  d:'객체 메모리. $U$ 는 객체 특징, $W_q$ 는 $q$번째 풀링 마스크의 가중치다. 분모가 0이면 갱신하지 않아 가려진 동안 값이 유지된다.'}
],

numbers:[
 {k:'MOSE val · Cutie-base J&F (MOSE 포함 학습)', v:'68.3', d:'Table 1. 같은 조건의 XMem은 59.6(+8.7), DeAOT-R50은 64.1(+4.2)'},
 {k:'속도 · YouTubeVOS (V100)', v:'Cutie-small 45.5 / base 36.4 FPS', d:'Table 1. XMem 22.6, DeAOT 11.7 FPS. 초록 요약의 "3배 빠르다"는 DeAOT 대비 base 기준'},
 {k:'DAVIS-17 val · Cutie-base J&F', v:'88.8', d:'Table 1. MOSE 포함/미포함 모두 88.8. XMem은 86.2/86.0'},
 {k:'BURST val · 메모리 (FIFO)', v:'Cutie-small 1.35G', d:'Table 2. XMem FIFO는 3.03G. All HOTA는 56.8 대 52.9'},
 {k:'object transformer 블록 수 L (small, MOSE)', v:'L=0 65.2 → L=3 67.4', d:'Table 3. 속도는 56.6 → 45.5 FPS로 줄어든다'},
 {k:'마스크 어텐션 ablation (MOSE J&F)', v:'전경+배경 67.3 / 전경만 66.7 / 없음 63.8', d:'Table 6. small 모델, 기본 시드의 평균±표준편차 값'}
],

impact:'픽셀 매칭 위주였던 VOS에 객체 수준 추론을 끼워 넣어, 방해물과 가림이 많은 MOSE 같은 어려운 벤치마크에서 큰 폭의 개선을 보였다. 쉬운 벤치마크(DAVIS, YouTubeVOS)에서는 경쟁력을 유지하면서 실시간에 가까운 속도를 지켰다. 쿼리를 매개로 소통해 고해상도 픽셀끼리의 attention을 피한 설계가 효율의 핵심이다. 저자들은 이 견고함이 Segment Anything 기반의 범용 영상 분할 파이프라인에 유용하다고 주장한다.',

legacy:[
 '**[XMem](#/p/xmem) 계보의 직접 후속**: 같은 저자가 XMem의 픽셀 메모리·장기 기억을 그대로 두고 읽기 단계만 객체 수준으로 확장했다',
 '**쿼리 기반 분할의 VOS 이식**: Mask2Former식 masked attention과 object query를 메모리 기반 VOS 안으로 가져왔다',
 '**긴 영상 설정**: BURST·LVOS에서 FIFO 또는 XMem의 장기 기억을 선택해 쓸 수 있고, 장기 기억 쪽이 정확도는 높다',
 '**범용 분할 파이프라인의 부품**: 논문이 Tracking Anything·DEVA 같은 자동 영상 분할에 쓰일 수 있다고 직접 언급한다'
],

pitfalls:[
 '**MOSE 수치는 "MOSE를 학습에 넣은 설정"과 "넣지 않은 설정"이 따로 있다.** 같은 표에서 Cutie-base가 64.0(미포함)과 68.3(포함)으로 다르므로 XMem +8.7의 비교는 포함 설정끼리다.',
 '**쉬운 벤치마크에서는 압도적이지 않다.** DAVIS-17 val에서 XMem 86.2 대 Cutie-base 88.8이고 YouTubeVOS-2019 G는 Cutie-base 86.1~86.5 대 XMem 85.5~85.6으로 차이가 작다. 이득은 어려운 데이터에서 크다.',
 '**여전히 준지도 VOS다.** 첫 프레임 마스크가 필요하다. 마스크 없이 개념이나 텍스트로 대상을 찾는 모델이 아니다.'
],

figures:[
 {f:'fig2-overview.png',
  cap:'위쪽: 질의 프레임에서 얻은 픽셀 읽기 $R_0$ 가 객체 쿼리·객체 메모리와 함께 object transformer를 거쳐 객체 읽기 $R_L$ 이 되어 디코더로 간다. 아래쪽: 블록 하나의 구조로, masked cross-attention → self-attention → FFN → 쿼리-픽셀 cross-attention → 픽셀 FFN 순이다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'Pixel-level matching maps every query pixel independently to a linear combination of memory pixels (e.g., with an attention layer).',
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 2310.12982 — Cutie', u:'https://arxiv.org/abs/2310.12982'},
 {t:'프로젝트 페이지 — Cutie', u:'https://hkchengrex.github.io/Cutie'}
]
});
