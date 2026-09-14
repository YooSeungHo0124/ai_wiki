WIKI.paper({
slug:'magistral',
venue:'arXiv 2025',
authors:'Mistral AI',
arxiv:'2506.10910',

tldr:'Mistral의 첫 추론 모델이자, 기존 RL 구현이나 다른 모델의 추론 흔적(distillation)을 전혀 빌리지 않고 **처음부터 끝까지 자체 RL 파이프라인만으로** 학습했다는 보고서. 가장 눈에 띄는 발견은 "텍스트만으로 RL을 해도 멀티모달 능력이 사라지지 않고 오히려 개선된다"는 관찰이다.',

context:'[DeepSeek-R1](#/p/deepseek-r1)이 검증 가능 보상 기반 RL(RLVR)로 추론 모델을 만드는 레시피의 틀을 제시한 이후, 많은 추종 모델은 R1 계열이 생성한 추론 흔적을 distillation해 콜드스타트로 삼았다. Magistral은 이 경로를 의도적으로 피한다 — 자사의 사전학습 체크포인트(Mistral Medium 3/Small 3)에 **순수 RL만**을 적용해 추론 능력이 어디까지 올라가는지, 그리고 그 과정에서 원래 모델이 갖고 있던 멀티모달·툴콜·지시 따르기 같은 능력이 어떻게 되는지를 직접 관찰하는 것이 이 보고서의 실험 설계다.',

ideas:[
 {h:'콜드스타트 없이 순수 RL만으로 Magistral Medium을 학습',
  lead:'다른 추론 모델의 distillation 없이 RL만으로 AIME-24를 거의 50%p 끌어올렸다.',
  d:'Magistral Medium은 Mistral Medium 3 위에 **RL만**으로 학습됐다 — 사전 추론 데이터로 SFT 콜드스타트를 거치지 않는다. 이 순수 RL만으로 AIME-24 pass@1이 초기 체크포인트 대비 거의 50%p 상승했다고 보고하며, 다수결(majority voting) 적용 시 90%에 도달한다. Small 모델(24B, 오픈소스)은 여기에 Magistral Medium이 만든 콜드스타트 데이터를 추가로 사용한 버전이라, "순수 RL"과 "distillation 보강 RL"을 같은 보고서 안에서 대조할 수 있다.'},
 {h:'RL이 텍스트만 봐도 멀티모달 능력이 유지·개선된다',
  lead:'텍스트 전용 RL 데이터로 학습해도 이미지 기반 벤치마크 성능이 떨어지지 않고 오히려 올랐다.',
  d:'학습에 쓰인 초기 체크포인트는 비전 인코더를 가진 멀티모달 모델인데, RL 단계는 텍스트 데이터만 사용한다. 상식적으로는 안 쓰는 능력이 퇴화(catastrophic forgetting)할 것으로 예상되지만, MMMU(+5%p, 70%), MMMU-Pro-Standard(+4.4%p, 57.9%), MMMU-Pro-Vision(+12%p, 52.1%)에서 오히려 개선됐다(Figure 10). 텍스트로 학습한 확장된 사고 과정이 시각 문제에도 그대로 전이된다는 것이 저자들의 해석이다.'},
 {h:'언어 일관성 보상: 사고와 답을 같은 언어로 강제',
  lead:'문제·사고·답의 언어가 fastText 분류기로 모두 일치할 때만 추가 보상 0.1을 준다.',
  d:'제약 없이 수학·코드 문제에 RL을 하면 영어·중국어·러시아어가 뒤섞인 응답이 자주 나온다. Magistral은 영어 문제의 10%를 프랑스어·스페인어·이탈리아어·독일어·중국어·러시아어로 번역해 학습에 섞고, (문제, 사고, 답) 세 부분을 LaTeX·코드 블록을 제거한 뒤 [fastText](#/p/fasttext)로 언어를 판별해 **셋이 모두 같은 언어일 때만** 0.1의 추가 보상을 준다. 몇 개 언어만 번역했는데도 임의의 언어로 사고 사슬을 생성하는 능력이 일반화됐다고 보고한다.'},
 {h:'비동기 RL 인프라로 온폴리시성과 효율을 절충',
  lead:'생성기를 중단하지 않고 자주 갱신하는 비동기 구조로 대규모 온라인 RL을 지속한다.',
  d:'생성(rollout) 워커를 학습 때문에 멈추지 않고, 대신 가중치를 자주 갱신해 온폴리시성(on-policyness)과 처리량 사이의 균형을 맞추는 분산 RL 시스템을 구축했다. 기존 구현을 그대로 쓰지 않고 자체 인프라로 이를 구성했다는 점을 "ground up 접근"의 핵심 근거로 든다.'},
 {h:'실패한 시도도 함께 공개한다',
  lead:'코드 부분 보상 등 시도했지만 성능이 오르지 않아 채택하지 않은 방법을 별도 절로 남긴다.',
  d:'예를 들어 경쟁 코딩 문제의 이진 보상(통과/실패) 대신 테스트 통과 비율에 비례하는 부분 보상을 시도했지만, 24B 모델 250스텝 ablation에서 기대한 개선을 보이지 않아 채택하지 않았다고 밝힌다. 이렇게 "안 된 것"을 별도 절(7.4)로 남기는 것은 실무적으로 드문 투명성이다.'}
],

diagram:{type:'compare', cap:'Magistral Medium(순수 RL)과 Magistral Small(distillation 보강)의 차이.',
 left:{t:'Magistral Medium', items:['콜드스타트 SFT 없음','RL만으로 학습','AIME-24 +50%p(RL 전후)']},
 right:{t:'Magistral Small (오픈)', items:['Medium이 만든 콜드스타트 사용','24B, Apache 2.0 공개','distillation + RL 병행']}
},

math:[
 {expr:'R_length(y) = −0.1 · (|y| − l_max + l_cache) / l_cache   (l_max − l_cache < |y| ≤ l_max),  −0.1 (|y| > l_max)',
  tex:'R_{\\text{length}}(y)=\\begin{cases}-0.1\\cdot\\dfrac{|y|-l_{\\max}+l_{\\text{cache}}}{l_{\\text{cache}}}, & l_{\\max}-l_{\\text{cache}}<|y|\\le l_{\\max}\\\\[4pt]-0.1, & l_{\\max}<|y|\\end{cases}',
  d:'응답 길이가 상한 $l_{max}$ 에 가까워지면 완만하게, 넘으면 고정 페널티로 불이익을 주는 길이 보상. 지나치게 긴 응답을 억제하면서도 갑작스러운 절벽형 페널티는 피한다.'}
],

numbers:[
 {k:'AIME-24 pass@1 향상', v:'약 +50%p', d:'Magistral Medium, RL만으로(콜드스타트 없이), Abstract'},
 {k:'AIME-24 (다수결)', v:'90%', d:'Magistral Medium, majority voting 적용 시, Fig.1 설명'},
 {k:'MMMU', v:'65.0% → 70.0%', d:'Mistral Medium 3 → Magistral Medium, Figure 10'},
 {k:'MMMU-Pro-Vision', v:'39.7% → 52.1%', d:'+12%p, Figure 10 — 텍스트만으로 RL했는데도 비전 벤치마크 향상'},
 {k:'함수 호출 (내부 벤치)', v:'87.2 → 87.4', d:'RL 전후 거의 유지, Table 6'},
 {k:'다국어 AIME 저하', v:'영어 대비 4.3~9.9%p 낮음', d:'프랑스어·스페인어 등 번역판, Sec.5.4 — 기반 모델과 유사한 수준의 저하'}
],

impact:'"추론 RL은 다른 능력을 갉아먹는다"는 통념에 대한 반례를 제공한다. 텍스트 전용 RL이 멀티모달·툴콜·지시 따르기를 훼손하지 않고 오히려 개선한다는 관찰은, 추론 특화 후처리를 별도 모델로 분리하지 않고 기존 멀티모달 모델 위에 바로 얹을 수 있다는 근거가 된다. 동시에 distillation 없는 순수 RL만으로도 유의미한 향상이 가능함을 대형 모델 규모에서 보여, [DeepSeek-R1](#/p/deepseek-r1) 이후 "다른 모델의 추론 흔적이 필수"라는 가정에 의문을 던진다.',

legacy:[
 '**"텍스트 RL이 멀티모달을 해치지 않는다"는 관찰의 참조 사례** — 이후 멀티모달 추론 모델 설계에서 반복 인용될 소지',
 '**언어 일관성 보상 설계** — fastText 기반 3중 언어 일치 보상이 다국어 추론 모델의 코드스위칭 억제 기법 사례로 남음',
 '**실패 사례 공개 관행** — 시도했지만 채택하지 않은 방법을 별도로 문서화하는 투명성이 이후 보고서의 참조점'
],

pitfalls:[
 '**"순수 RL만으로 50%p 향상"은 이미 강한 사전학습 체크포인트(Mistral Medium 3) 위에서의 결과다.** 임의의 약한 베이스 모델에 같은 방식을 적용해도 같은 폭의 향상이 보장되지 않는다.',
 '**멀티모달 개선(Figure 10)은 추론이 필요한 벤치마크(MathVista, MMMU 등) 기준이다.** 단순 인식 위주의 비전 과제에도 같은 효과가 있는지는 원문이 별도로 검증하지 않는다.',
 '**언어 일관성 보상은 10%의 문제만 번역해 학습한 결과다.** 번역하지 않은 언어로의 일반화가 항상 보장된다는 뜻은 아니며, 원문도 "관찰했다"는 수준으로 서술한다.'
],

figures:[
 {f:'fig10-multimodal.png',
  cap:'MMMU·MathVista·MMMU-Pro 두 변형에서 Mistral Small 3.1/Magistral Small, Mistral Medium 3/Magistral Medium 네 모델의 정확도 비교. 텍스트 전용 RL을 거친 Magistral 계열(진한 주황)이 원래 체크포인트(연한 주황)보다 모든 벤치마크에서 같거나 더 높다 — 특히 MMMU-Pro-Vision에서 격차가 가장 크다(39.7%→52.1%).',
  src:'원문 Figure 10, p.14'}
],

quotes:[
 {t:'We find that RL on text maintains or improves multimodal understanding, instruction following and function calling.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2506.10910 — Magistral', u:'https://arxiv.org/abs/2506.10910'},
 {t:'MiniMax-M1', u:'#/p/minimax-m1'},
 {t:'gpt-oss', u:'#/p/gpt-oss'}
]
});
