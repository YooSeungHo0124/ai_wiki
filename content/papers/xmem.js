WIKI.paper({
slug:'xmem',
venue:'ECCV 2022',
authors:'Cheng, Schwing (UIUC)',
arxiv:'2207.07115',

tldr:'인간 기억 이론(Atkinson-Shiffrin)을 따라 **감각·작업·장기 기억** 세 저장소를 두고, 자주 쓰인 작업 기억을 컴팩트한 장기 기억으로 압축하는 VOS 모델. 몇 천 프레임짜리 긴 영상에서도 GPU 메모리가 폭발하지 않고 정확도가 거의 떨어지지 않는다.',

context:'준지도 비디오 객체 분할(VOS)은 첫 프레임 마스크를 받아 이후 프레임의 같은 객체를 분할한다. STM 이후 주류는 과거 프레임의 특징을 메모리에 쌓고 새 프레임이 attention으로 읽는 방식이다. 이 메모리는 프레임마다 늘어나 1분 이상의 영상에서는 소비자용 GPU로 감당하기 어렵다. 메모리를 병합·압축하는 긴 영상 전용 방법(AFB-URR 등)은 고해상도 특징을 곧바로 압축해 단기 정확도가 낮았다. 저자들은 문제를 "메모리가 한 종류뿐이라 메모리 소비와 정확도가 묶인다"로 보고, 시간 척도가 다른 여러 저장소로 분리한다.',

ideas:[
 {h:'세 종류의 기억 저장소',
  lead:'감각(매 프레임)·작업(고해상도 단기)·장기(압축)로 역할을 나눈다.',
  d:'감각 기억은 GRU의 은닉 표현으로 매 프레임 갱신되어 위치 같은 저수준 정보와 시간적 매끄러움을 준다. 작업 기억은 STCN 스타일의 키-값 뱅크로 $r$ 프레임마다 새 특징을 넣는다. 장기 기억은 작업 기억이 가득 찼을 때 압축된 프로토타입만 받아 쌓는다. 새 프레임의 질의는 작업·장기 기억에서 attention으로 정보를 읽고, 감각 기억과 함께 디코더로 마스크를 만든다.'},
 {h:'기억 강화(consolidation)와 potentiation',
  lead:'작업 기억에서 자주 읽힌 키를 프로토타입으로 뽑고, 값은 주변 후보를 평균해 풍부하게 만든다.',
  d:'작업 기억이 $T_{max}$ 프레임에 도달하면 첫 프레임과 최근 $T_{min}-1$ 프레임은 남기고 나머지를 후보로 삼는다. 누적 attention 확률 질량(usage)이 큰 상위 $P$개 키를 프로토타입으로 고른다. 그 키만 뽑으면 값이 샘플링 앨리어싱에 취약하므로, 키 공간에서 유사한 후보 값들을 softmax 가중 평균해 프로토타입 값을 만든다. 영상 평면이 아닌 키 공간에서 필터링해 경계가 흐려지지 않는다.'},
 {h:'비등방 L2 유사도',
  lead:'키마다 신뢰도(shrinkage), 질의마다 채널 가중(selection)을 두어 STCN의 L2를 확장한다.',
  d:'STCN의 L2 유사도는 안정적이지만 메모리 원소의 신뢰도를 표현하지 못한다. XMem은 키에 shrinkage 항 $s \\in [1,\\infty)$ 를, 질의에 selection 항 $e \\in [0,1]$ 을 붙인다. shrinkage가 크면 그 키의 영향 범위가 좁아지고, selection은 변별력 있는 채널에 attention을 집중시킨다. 둘 다 1이면 원래 L2와 같다.'},
 {h:'장기 기억의 크기 상한',
  lead:'최소 사용 빈도(LFU) 방식으로 오래된 프로토타입을 지워 GPU 메모리를 고정한다.',
  d:'장기 기억도 영원히 자랄 수는 없다. 상한에 도달하면 사용량(상위 k 필터링 후 누적 affinity)이 가장 낮은 원소를 제거한다. 논문은 장기 기억 원소 수를 최대 10,000개로 두어 GPU 메모리가 1.4GB를 넘지 않는다고 한다. 6GB 예산에서는 약 34,000 프레임까지 문제없이 처리했다고 밝힌다.'}
],

diagram:{type:'stack', cap:'XMem의 세 기억 저장소와 갱신 주기. 아래에서 위로 갈수록 오래 보존되고 더 압축된다.',
 layers:[
  {t:'새 프레임 질의', s:'query encoder'},
  {t:'감각 기억', s:'GRU 은닉 상태', note:'← 매 프레임 갱신'},
  {t:'작업 기억', s:'T_min~T_max 프레임', note:'← r 프레임마다 삽입'},
  {t:'기억 강화', s:'usage 상위 P개 선택', acc:true, note:'← 가득 차면 압축'},
  {t:'장기 기억', s:'프로토타입 키·값', note:'← LFU로 상한 유지'}
 ]},

math:[
 {tex:'S(k,q)_{ij}=-s_i\\sum_{c=1}^{C^k} e_{cj}\\,(k_{ci}-q_{cj})^2',
  expr:'S_ij = −s_i · Σ_c e_cj (k_ci − q_cj)²',
  d:'비등방 L2 유사도. $s_i$ 는 i번째 키의 shrinkage, $e_{cj}$ 는 j번째 질의의 채널 c 가중. 모두 1이면 STCN의 L2와 같다.'},
 {tex:'F=v\\,W(k,q),\\qquad v^{p}=v^{c}\\,W(k^{c},k^{p})',
  expr:'F = v·W(k,q);  v_p = v_c·W(k_c,k_p)',
  d:'앞 식은 메모리 읽기: $W$ 는 유사도 행렬에 softmax를 취한 affinity다. 뒤 식은 potentiation으로, 같은 식을 후보 키와 프로토타입 키 사이에 다시 써서 프로토타입 값을 만든다.'}
],

numbers:[
 {k:'Long-time Video 3× · XMem J&F', v:'90.0', d:'Table 1. STCN은 1×에서 87.3, 3×에서 84.6으로 떨어지지만 XMem은 89.8 → 90.0'},
 {k:'YouTubeVOS 2018 val · XMem G / FPS', v:'85.7 / 22.6', d:'Table 2. V100 기준. STCN 83.0(13.2 FPS), AOT 85.5(6.4 FPS)'},
 {k:'DAVIS 2017 val · XMem J&F / FPS', v:'86.2 / 22.6', d:'Table 2. BL30K 사전학습을 쓰면 87.7'},
 {k:'DAVIS 2016 val · XMem J&F / FPS', v:'91.5 / 29.6', d:'Table 2'},
 {k:'작업→장기 압축률', v:'6328%', d:'$T_{min}=5$, $T_{max}=10$, $P=128$ 기본 설정에서의 값'},
 {k:'GPU 메모리 상한', v:'1.4GB 이하', d:'장기 기억 원소를 최대 10,000개로 둘 때. 본문의 서술값'}
],

impact:'긴 영상 VOS를 "메모리를 어떻게 줄이되 정확도를 지키느냐"의 문제로 정리하고, 단기와 장기를 분리하는 설계가 통한다는 것을 보였다. 단기 데이터셋에서는 당시 최고 수준을 유지하면서 속도도 STCN의 약 1.7배 수준이다. 이후 [Track Anything](#/p/track-anything)이 [SAM](#/p/sam)과 결합하는 전파 엔진으로, [Cutie](#/p/cutie)가 메모리 읽기 방식을 객체 수준으로 확장하는 기반으로 XMem을 가져다 썼다. 백본은 [ResNet](#/p/resnet)(질의 인코더 ResNet-50, 값 인코더 ResNet-18)이다.',

legacy:[
 '**[Track Anything](#/p/track-anything)**: XMem을 SAM의 클릭 마스크로 초기화해 클릭 기반 대화형 영상 추적 도구를 만들었다',
 '**[Cutie](#/p/cutie)**: XMem의 픽셀 메모리·장기 기억을 그대로 쓰고 그 위에 객체 쿼리 기반 읽기를 얹었다',
 '**긴 영상 평가의 기준 모델**: Cutie의 BURST·LVOS 긴 영상 실험은 XMem의 장기 기억을 재학습 없이 그대로 가져다 쓰고, XMem을 주된 비교 대상으로 삼는다',
 '**단기·장기 분리 설계**: 작업 기억은 STCN 방식 그대로 두고 장기 기억만 압축한다는 구성은 이후 VOS 메모리 설계에서 하나의 참고 구조가 됐다'
],

pitfalls:[
 '**장기 기억은 오래된 것을 영원히 보존하지 않는다.** 상한에 도달하면 LFU로 버리므로 매우 긴 영상에서 아주 옛 정보가 사라질 수 있다. 논문의 "34,000프레임"은 6GB 예산의 서술값이다.',
 '**긴 영상 실험은 합성 확장이 섞여 있다.** Long-time Video 3×는 원본을 앞뒤로 되돌려 재생해 늘린 변형이라, 진짜 장기 장면 변화를 모두 포함하지는 않는다.',
 '**XMem은 준지도 VOS라 첫 프레임 마스크가 필요하다.** 마스크 없이 임의의 물체를 추적하는 도구가 아니며, Track Anything에서 SAM이 그 초기화를 맡는다.'
],

figures:[
 {f:'fig2-overview.png',
  cap:'프레임이 지날 때마다 메모리 읽기(노랑)가 세 저장소를 참조한다. 초록 화살표는 감각 기억, 파랑은 작업 기억, 주황은 장기 기억 경로다. 점선은 r프레임마다 일어나는 조건부 갱신과 기억 강화를 뜻한다.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'Prior work on video object segmentation typically only uses one type of feature memory. For videos longer than a minute, a single feature memory model tightly links memory consumption and accuracy.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2207.07115 — XMem', u:'https://arxiv.org/abs/2207.07115'},
 {t:'GitHub — hkchengrex/XMem', u:'https://github.com/hkchengrex/XMem'}
]
});
