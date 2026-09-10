WIKI.paper({
slug:'carbon',
venue:'arXiv 2021 (Google · UC Berkeley)',
authors:'Patterson, Gonzalez, Le, Liang, Munguia, Rothchild, So, Texier, Dean (Google · UC Berkeley)',
arxiv:'2104.10350',

tldr:'대형 NLP 모델(T5·Meena·GShard·Switch Transformer·[GPT-3](#/p/gpt3)) 학습의 에너지와 탄소 배출을 실측하고, **모델·데이터센터·프로세서 선택만으로 배출량이 최대 100~1000배 차이 난다**는 것을 계산 방법론과 함께 제시한 논문.',

context:'2019년 [Strubell et al.]의 추정치는 NAS(신경망 구조 탐색) 학습 비용을 실제보다 과대평가해 "AI가 자동차 5대 평생 배출량을 학습 한 번에 낸다"는 식의 보도로 퍼졌다. 문제는 데이터센터 위치·전력원·하드웨어 세대 같은 세부 정보가 논문에 보고되지 않아 **사후에 정확히 추정하기 어렵다**는 점이었다. 저자들은 Google 내부에서 실제로 측정 가능한 데이터를 갖고, 같은 모델이라도 어떤 조건에서 학습했는지에 따라 탄소 배출이 얼마나 달라지는지 직접 재현해 보였다.',

ideas:[
 {h:'4단계 분해로 실제 개선 폭을 재구성한다',
  lead:'모델·프로세서·데이터센터 효율·전력원 4가지 요인을 하나씩 곱해 총 개선폭을 계산한다.',
  d:'Transformer(Big)를 미국 평균 데이터센터의 P100 GPU에서 학습하던 것을, Evolved Transformer(Medium)를 Google Iowa 데이터센터의 TPU v2에서 학습하는 것으로 바꾸면 CO2e가 **57배** 준다. 이 개선을 (1) 아키텍처 교체 1.3배, (2) TPU v2로 교체 시 누적 7.4배, (3) 데이터센터 PUE 반영 시 10.5배, (4) 그 데이터센터의 순 탄소배출계수 반영 시 56.5배로 단계별로 분해했다.'},
 {h:'희소 활성화 모델은 파라미터가 많아도 에너지가 적다',
  lead:'MoE 기반 GShard·Switch Transformer는 파라미터가 GPT-3보다 많아도 실제 연산량은 훨씬 적다.',
  d:'GShard-600B는 GPT-3보다 파라미터가 많지만, 토큰마다 일부 expert만 활성화되므로 총 FLOPS는 훨씬 작다. 저자들은 조밀(dense)한 GPT-3 대비 GShard가 **가속기-연도 기준 약 45배, 에너지 약 55배 적고, 순 CO2e는 약 130배 적다**고 계산했다. "파라미터 수 = 비용"이라는 통념에 반하는 결과다.'},
 {h:'지리적 위치가 같은 조직 안에서도 5~10배 차이를 만든다',
  lead:'같은 회사 안에서도 데이터센터가 어디에 있는지에 따라 탄소 배출 계수가 크게 갈린다.',
  d:'전력망에 포함된 재생에너지·원자력 비중이 지역마다 다르기 때문에, 같은 kWh를 쓰더라도 실제 탄소 배출량(gross vs net CO2e/kWh)은 지역에 따라 5~10배 벌어진다. 그래서 저자들은 학습 작업을 탄소가 적은 시간·장소에 스케줄링하는 것이 모델 자체를 바꾸는 것 못지않게 중요하다고 말한다.'},
 {h:'다섯 개 대형 모델의 실측 CO2e 표를 공개한다',
  lead:'T5·Meena·GShard·Switch Transformer·GPT-3의 에너지·CO2e를 한 표로 나란히 제시한다.',
  d:'GPT-3는 175B 파라미터에 1287 MWh, 552 tCO2e로 다섯 모델 중 압도적으로 크다. 반면 GShard-600B는 24 MWh, 순 4.3 tCO2e에 그친다. GPT-3의 수치는 OpenAI가 측정한 V100 성능·전력과 Microsoft Azure의 미국 평균 CO2e/kWh를 결합해 계산됐다.'},
 {h:'NAS 비용은 한 번 지불하면 여러 모델이 나눠 쓴다',
  lead:'Evolved Transformer 탐색 비용을 재계산하니 기존 추정보다 88배 작았고, Meena 재사용으로 15배 이상 회수됐다.',
  d:'기존 추정([Strubell et al.])은 탐색에 쓰인 프록시 태스크의 규모를 오해해 실제보다 크게 잡았다. 재계산 결과 Evolved Transformer NAS의 실제 배출은 기존 추정의 약 1/88이었고, 이 탐색으로 찾은 아키텍처를 Meena 학습에 재사용하면서 절약한 48.5 tCO2e는 탐색 자체의 비용보다 15배 컸다 — NAS는 "모델 하나당 한 번"이 아니라 "문제 영역당 한 번" 지불하는 비용이라는 점을 강조한다.'}
],

diagram:{type:'flow', cap:'같은 학습 작업의 탄소 배출은 이 네 선택이 겹쳐 결정된다 — 하나만 바꿔도 수 배, 넷을 겹치면 수백~수천 배가 갈린다.',
 nodes:[
  {t:'모델 구조', s:'조밀 vs MoE'},
  {t:'프로세서', s:'GPU vs TPU 세대'},
  {t:'데이터센터 PUE', s:'냉각·전력 효율'},
  {t:'전력망 탄소계수', s:'지역·시간대', acc:true}
 ]},

math:[
 {expr:'Footprint = (energy_train + queries × energy_inference) × CO2e_datacenter/KWh',
  tex:'\\text{Footprint} = \\left(E_{\\text{train}} + \\text{queries}\\times E_{\\text{inference}}\\right)\\times \\frac{\\text{CO}_2e_{\\text{datacenter}}}{\\text{KWh}}',
  d:'탄소 발자국을 학습·추론 에너지와 데이터센터의 kWh당 탄소계수의 곱으로 분해한 단순화 공식. 이 논문은 추론량 산정이 어려워 학습 항만 집중적으로 다루지만, 실제 배포에서는 추론이 전체 에너지의 80~90%를 차지한다는 점을 함께 지적한다.'}
],

numbers:[
 {k:'GPT-3 학습 에너지·CO2e', v:'1,287 MWh · 552 tCO2e', d:'V100 GPU, Microsoft Azure, 다섯 모델 중 최대'},
 {k:'GShard-600B 학습 CO2e', v:'24 MWh · 순 4.3 tCO2e', d:'GPT-3 대비 가속기-연도 약 45배, 에너지 약 55배 적음'},
 {k:'예제 개선 총합', v:'57배', d:'Transformer(Big)/P100/미국 평균 DC → Evolved Transformer(Medium)/TPU v2/Google Iowa DC'},
 {k:'클라우드 데이터센터 효율', v:'~1.4~2배', d:'전형적 데이터센터 대비 PUE 개선'},
 {k:'ML 전용 가속기 효율', v:'~2~5배', d:'범용 하드웨어 대비'},
 {k:'NAS 재추정 오차', v:'기존 추정의 최대 88배 과대평가', d:'Google 등 에너지 효율적 조직 기준, Appendix D'}
],

impact:'이 논문 이후 대형 모델 논문에서 에너지·CO2e를 보고하는 것이 서서히 관행이 되었고, 저자들이 촉구한 대로 MLPerf 등 업계 표준 벤치마크에 에너지 측정이 편입되는 계기가 됐다. "파라미터 수"나 "GPU-시간"만으로 환경 비용을 추정하는 단순화가 왜 위험한지—희소 모델의 존재, 지역별 전력망 차이, 데이터센터 세대 차이 때문에 수십~수백 배 틀릴 수 있다는 것—를 구체적 수치로 보여준 것이 핵심 기여다.',

legacy:[
 '[OPT](#/p/opt)·[BLOOM](#/p/bloom) 등 이후 대형 모델 논문들이 학습 에너지·탄소 배출을 명시적으로 보고하는 관행의 참고 기준이 됨',
 'MLPerf 등 업계 표준 벤치마크가 에너지 사용량을 측정 항목으로 논의하는 계기 중 하나',
 '희소 활성화(MoE) 모델의 에너지 이점이 [Switch Transformer](#/p/switch) 계열 연구의 부수적 근거로 인용됨',
 '모델 훈련 위치·시점을 탄소가 적은 시간·지역으로 스케줄링하는 "탄소 인지 컴퓨팅" 실무의 초기 사례'
],

pitfalls:[
 '**파라미터 수로 에너지를 추정하면 안 된다.** GShard-600B는 GPT-3보다 파라미터가 많지만 에너지는 훨씬 적다 — 희소 활성화 때문이다.',
 '**gross와 net CO2e를 혼동하면 안 된다.** net은 24시간 실시간 무탄소 전력 구매를 반영한 값으로, 같은 데이터센터라도 gross 대비 수 배 낮게 나올 수 있다(Table 1: 0.1357t → 0.0177t).',
 '**이 논문은 추론(inference) 비용을 다루지 않는다.** 저자들 스스로 실제 배포에서는 추론이 전체 에너지의 대부분(80~90%)을 차지한다고 명시하며, 학습 비용만 보는 것의 한계를 인정한다.'
],

figures:[
 {f:'fig1-co2e-improvement.png',
  cap:'세로축은 로그 스케일의 CO2e 개선 배수. 왼쪽부터 아키텍처만 바꾸면 1.3배, 여기에 TPU v2로 하드웨어를 바꾸면 누적 7.4배, Google Iowa 데이터센터의 PUE를 반영하면 10.5배, 그 데이터센터의 순 탄소계수까지 반영하면 최종 56.5배 — 네 요인이 곱으로 누적된다는 것을 보여준다.',
  src:'원문 Figure 1, p.3'},
 {f:'fig3-model-comparison.png',
  cap:'다섯 개 대형 NLP 모델의 가속기-연도(파랑)·에너지 소비 MWh(빨강)·순 CO2e 톤(노랑)을 나란히 비교. GPT-3(V100)가 세 지표 모두에서 압도적으로 크고, GShard-600B(TPUv3)는 파라미터 수가 더 많음에도 막대가 가장 작다 — 희소 활성화의 효과를 한눈에 보여준다.',
  src:'원문 Figure 3, p.7'}
],

quotes:[
 {t:'Remarkably, the choice of DNN, datacenter, and processor can reduce the carbon footprint up to ~100-1000X.',
  src:'Abstract, p.1'},
 {t:'The most sustainable energy is the energy you don\u2019t use.',
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 2104.10350 — Carbon Emissions and Large Neural Network Training', u:'https://arxiv.org/abs/2104.10350'}
]
});
