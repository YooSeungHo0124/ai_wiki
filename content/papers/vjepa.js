WIKI.paper({
slug:'vjepa',
venue:'arXiv 2024 (FAIR at Meta)',
authors:'Adrien Bardes, Quentin Garrido, Yann LeCun, Mahmoud Assran, Nicolas Ballas et al. (Meta AI · Inria · NYU)',
arxiv:'2404.08471',

tldr:'[I-JEPA](#/p/ijepa)를 영상으로 확장한 논문. 마스킹된 영상 구간의 **픽셀을 복원하는 대신 표현 공간의 특징을 예측**하도록만 학습시키고도, 얼린 백본 그대로 동작(motion)과 외형(appearance) 과제 모두에서 경쟁력 있는 표현을 얻는다는 것을 보인다.',

context:'영상 자기지도학습의 지배적 레시피는 [MAE](#/p/mae) 계열의 **마스킹 후 픽셀 복원**이었다([VideoMAE](#/p/videomae) 등). 문제는 영상이 이미지보다 훨씬 예측하기 쉬운 저수준 디테일(조명 변화, 텍스처, 노이즈)로 가득하다는 것이다. 모델이 이런 예측 불가능하거나 무관한 픽셀 디테일까지 복원하려고 용량을 쓰면, 정작 의미 있는 표현을 배우는 데는 손해다. 대조학습(contrastive)은 이 문제를 negative sample과 데이터 증강으로 우회하지만 설계가 복잡하다. [I-JEPA](#/p/ijepa)는 이미지에서 "픽셀이 아니라 표현을 예측"하는 것으로 이 딜레마를 풀었는데, 질문은 **이 아이디어가 시간축이 추가된 영상에서도 그대로 통하는가**였다.',

ideas:[
 {h:'픽셀 대신 표현 공간에서 예측',
  lead:'x-인코더·y-인코더·예측기로 구성된 JEPA 구조를 영상에 그대로 적용한다.',
  d:'영상 클립에서 일부 시공간 블록을 마스킹해 x로, 나머지를 y로 삼는다. x-인코더가 보이는 토큰만 처리하고, predictor가 그 출력과 학습 가능한 mask token을 받아 y 위치의 **표현**을 예측한다. 타깃은 픽셀이 아니라 **y-인코더가 만든 표현 벡터**이고, $L_1$ 손실로 predictor 출력을 그 표현에 맞춘다.'},
 {h:'왜 표현 예측이 픽셀 복원보다 나은가',
  lead:'저수준의 예측 불가능한 디테일을 걸러내고 의미 있는 정보만 남기기 때문이다.',
  d:'픽셀 공간에서 예측하면 모델은 조명·질감·노이즈처럼 다음 프레임을 봐도 예측 불가능하거나 downstream에 무관한 세부까지 재현하려 애쓴다. 표현 공간에서는 인코더가 이런 저수준 잡음을 걸러낸 자리에서 예측이 이뤄지므로, 학습 신호가 **의미 있는 시공간 구조**에 집중된다는 것이 저자들의 핵심 논거다.'},
 {h:'EMA 타깃 인코더로 붕괴를 막는다',
  lead:'y-인코더를 x-인코더의 exponential moving average로 두어 자명한 해로 무너지는 것을 막는다.',
  d:'JEPA류 구조는 "항상 같은 상수 벡터를 출력"하는 자명한 해로 붕괴(collapse)할 위험이 있다. y-인코더 가중치를 x-인코더의 EMA로 천천히 따라가게 하면, predictor가 더 빨리 적응하면서도 타깃이 안정적으로 유지돼 붕괴가 방지된다. stop-gradient로 y-인코더 쪽 경로는 역전파를 막는다.'},
 {h:'짧고 긴 마스크를 함께 쓴다',
  lead:'전체 시간축을 관통하는 넓은 블록을 마스킹해 시간적 정보 누출을 차단한다.',
  d:'프레임 각각을 따로 마스킹하면 인접 프레임에서 정보가 새어 들어가 과제가 쉬워진다. V-JEPA는 공간적으로 연속된 블록을 뽑아 **전체 시간축에 반복 적용**하는 방식으로, 평균 약 90%를 가리는 짧은/긴 범위 마스크를 함께 써서 시간적 지름길을 차단한다.'},
 {h:'얼린 평가로 표현의 범용성을 직접 잰다',
  lead:'인코더 가중치를 전혀 건드리지 않고 attentive probing만으로 여러 과제를 평가한다.',
  d:'미세조정은 표현이 나빠도 task-specific하게 만회할 여지를 준다. V-JEPA는 사전학습 후 **인코더를 완전히 얼린 채** 작은 attentive probe만 얹어 Kinetics-400(외형 중심)과 Something-Something-v2(동작 중심) 양쪽에서 같은 백본으로 평가한다 — 표현 자체의 범용성을 직접 재는 프로토콜이다.'}
],

diagram:{type:'flow', cap:'V-JEPA 학습 파이프라인. y-인코더는 x-인코더의 EMA이고 역전파는 predictor·x-인코더 쪽에만 흐른다.',
 nodes:[
  {t:'영상 클립', s:'T프레임 → L토큰'},
  {t:'마스킹', s:'~90% 블록 제거', a:'제거'},
  {t:'x-인코더', s:'ViT, 보이는 토큰만', acc:true},
  {t:'Predictor', s:'mask token 결합'},
  {t:'y-인코더', s:'x-인코더의 EMA', note:'stop-grad'}
 ]},

math:[
 {expr:'L = E[ ||Pφ(Eθ(x), Δy) - sg(Eθ̄(y))||_1 ]',
  tex:'\\mathcal{L}=\\mathbb{E}\\left[\\left\\lVert P_\\phi\\big(E_\\theta(x),\\Delta_y\\big)-\\text{sg}\\big(E_{\\bar\\theta}(y)\\big)\\right\\rVert_1\\right]',
  d:'predictor $P_\\phi$ 는 x의 표현과 위치정보 $\\Delta_y$ 를 받아 y의 표현을 예측하고, 타깃은 stop-gradient가 걸린 EMA 인코더 $E_{\\bar\\theta}$ 의 출력이다. $L_1$ 손실로 두 표현을 맞춘다.'},
 {expr:'θ̄ ← τ·θ̄ + (1-τ)·θ',
  tex:'\\bar\\theta \\leftarrow \\tau\\bar\\theta + (1-\\tau)\\theta',
  d:'y-인코더 가중치는 x-인코더를 느리게 뒤따르는 지수이동평균이다. predictor가 인코더보다 빠르게 변하면서 타깃이 안정적으로 유지돼 표현 붕괴를 막는다.'}
],

numbers:[
 {k:'사전학습 데이터', v:'VideoMix2M, 약 200만 개 영상', d:'HowTo100M + Kinetics-400/600/700 + Something-Something-v2 결합, 검증셋과 중복 제거'},
 {k:'최대 모델', v:'ViT-H/16', d:'video 데이터로만 학습된 가장 큰 구성'},
 {k:'Kinetics-400 (frozen)', v:'81.9%', d:'ViT-H/16, attentive probing'},
 {k:'Something-Something-v2 (frozen)', v:'72.2%', d:'동작 중심 과제, ViT-H/16'},
 {k:'ImageNet-1K (frozen)', v:'77.9%', d:'영상으로만 학습했는데 이미지 과제에도 전이됨'},
 {k:'클립 길이·프레임레이트', v:'16프레임, frame-skip 4', d:'약 3초 클립, 패치는 16×16 픽셀 × 2프레임'}
],

impact:'표현 예측이 영상에서도 픽셀 복원과 대등하거나 그 이상이며, **더 짧은 학습 스케줄로** 그렇게 된다는 것을 보였다. 특히 동작 이해가 필요한 Something-Something-v2에서 픽셀 예측·이미지 기반 모델 대비 우위를 보여, "표현 공간 예측이 시간적 동역학을 더 잘 담는다"는 [JEPA](#/p/ijepa) 가설을 영상 도메인으로 확장했다. 얼린 백본 하나로 동작·외형 과제를 동시에 잡았다는 점도 이후 범용 영상 인코더 연구의 기준점이 되었다.',

legacy:[
 '**JEPA 계열의 영상 확장 완성** — 이미지([I-JEPA](#/p/ijepa)), 영상(V-JEPA), 이후 V-JEPA 2로 이어지는 계보의 중간 지점',
 '**얼린 평가 프로토콜의 정착** — attentive probing으로 백본을 안 건드리고 표현력을 재는 방식이 이후 영상 자기지도학습 논문들의 표준 비교축이 됨',
 '**세계 모델 연구와의 접점** — 표현 공간 예측이라는 아이디어는 이후 [Genie](#/p/genie) 등 영상 기반 세계 모델의 "픽셀을 직접 다루지 않는다"는 설계와 문제의식을 공유',
 '**월별 대규모 영상 데이터셋 조합(VideoMix2M) 레시피**가 이후 영상 사전학습 데이터 구성의 참조가 됨'
],

pitfalls:[
 '**"픽셀 예측보다 항상 낫다"는 아니다.** 완전 미세조정(fine-tuning) 조건에서는 픽셀 예측 방식과 경쟁적인 수준이지 압도적 우위가 아니다 — 우위는 주로 **얼린 평가**에서 나타난다.',
 '**Something-Something-v2 우위를 "동작 이해를 처음 풀었다"로 과장하면 안 된다.** 여전히 얼린 backbone + probing 조건에서의 상대적 우위이며, 절대 정확도가 task-specific 미세조정 SOTA를 넘는 것은 아니다.',
 '**EMA·stop-gradient 없이 구현하면 표현 붕괴로 무너진다.** JEPA류 구조는 이 붕괴 방지 장치가 핵심 설계 요소지, 생략 가능한 디테일이 아니다.'
],

figures:[
 {f:'fig3-architecture.png',
  cap:'왼쪽부터: 마스킹된 토큰을 제거한 뒤 x-인코더 통과 → predictor가 mask token과 결합해 M개 위치의 표현을 예측 → stop-gradient가 걸린 y-인코더의 실제 표현과 $L_1$ 손실로 비교. y-인코더는 별도로 학습되지 않고 x-인코더의 EMA로만 갱신된다.',
  src:'원문 Figure 3, p.4'},
 {f:'fig1-frozen-eval.png',
  cap:'x축 Kinetics-400(외형), y축 Something-Something-v2(동작), 둘 다 같은 얼린 backbone으로 측정. 파란 원(Video Feature Pred., 즉 V-JEPA)이 같은 크기의 픽셀 예측 모델(네모)·이미지 모델(세모)보다 왼쪽-위로 벗어나 있을수록 두 과제를 동시에 더 잘한다는 뜻.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'This paper explores feature prediction as a stand-alone objective for unsupervised learning from video and introduces V-JEPA, a collection of vision models trained solely using a feature prediction objective, without the use of pretrained image encoders, text, negative examples, reconstruction, or other sources of supervision.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2404.08471 — Revisiting Feature Prediction for Learning Visual Representations from Video', u:'https://arxiv.org/abs/2404.08471'},
 {t:'GitHub: facebookresearch/jepa', u:'https://github.com/facebookresearch/jepa'}
]
});
