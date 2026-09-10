WIKI.paper({
slug:'wav2vec',
venue:'arXiv 2019 (Interspeech 2019)',
authors:'Schneider, Baevski, Collobert, Auli (Facebook AI Research)',
arxiv:'1904.05862',

tldr:'라벨 없는 원시 오디오만으로 표현을 먼저 배운 뒤, 그 위에 소량의 라벨로 음성 인식기를 학습시킨 논문. [CPC](#/p/cpc)의 대조 예측을 음성에 그대로 적용해, 음성에도 자기지도 사전학습이 통한다는 것을 처음으로 큰 벤치마크에서 보였다.',

context:'2019년의 음성 인식은 여전히 라벨 의존적이었다 — [Deep Speech](#/p/deep-speech) 이후 종단간 학습이 자리잡았지만, 성능을 올리려면 결국 더 많은 전사 데이터가 필요했다. 반면 비전·NLP 쪽에서는 [CPC](#/p/cpc)가 "미래를 예측하는 대조 학습"만으로 라벨 없는 데이터에서 쓸모있는 표현을 뽑아낼 수 있음을 보인 상태였다. 음성은 원시 파형이 연속적이고 초당 16000개 샘플이라는 조밀한 신호라, CPC의 아이디어를 그대로 가져오면 되는지가 불분명했다. 이 논문은 "라벨 없는 오디오로 사전학습한 표현을 기존 [Deep Speech](#/p/deep-speech) 스타일 파이프라인의 입력(로그멜 필터뱅크 자리)에 그냥 갈아끼우면 어떻게 되는가"를 묻는다.',

ideas:[
 {h:'인코더-컨텍스트 2단 컨볼루션 구조',
  lead:'5층 CNN으로 원시 파형을 z로 압축하고, 9층 CNN으로 z를 문맥화해 c를 만든다.',
  d:'인코더 네트워크 $f$는 커널 크기 (10,8,4,4,4)·스트라이드 (5,4,2,2,2)의 5층 컨볼루션으로, 16kHz 원시 파형을 약 30ms 구간마다 하나씩, 10ms 간격으로 $z_i$를 뽑는다. 그 위의 컨텍스트 네트워크 $g$는 커널 3·스트라이드 1의 9층 컨볼루션으로 여러 $z$를 묶어 수용영역 약 210ms짜리 문맥 표현 $c_i$를 만든다. 둘 다 causal convolution이라 미래 정보를 보지 않는다.'},
 {h:'미래 샘플 맞히기 — 대조 예측 손실',
  lead:'k스텝 뒤 진짜 z를 negative distractor들 사이에서 골라내도록 학습한다.',
  d:'$c_i$로부터 $k$스텝 뒤의 실제 $z_{i+k}$를 예측하되, 직접 값을 회귀하지 않고 같은 발화에서 무작위로 뽑은 negative 샘플들과 구별하는 이진 분류(noise contrastive estimation)로 바꾼다. 스텝별로 다른 아핀 변환 $h_k(c_i)=W_kc_i+b_k$를 두고, $k=1,\\dots,K$ 각각에 대해 손실을 계산해 합산한다. 데이터 분포 $p(x)$ 자체를 모델링하지 않고 밀도비 $p(z_{i+k}\\mid c_i)/p(z_{i+k})$만 암묵적으로 학습한다는 것이 [CPC](#/p/cpc)에서 물려받은 핵심 트릭이다.'},
 {h:'사전학습 표현을 기존 파이프라인에 그대로 꽂는다',
  lead:'c를 로그멜 필터뱅크 대신 넣기만 하고 음향모델 이후 단계는 손대지 않는다.',
  d:'사전학습이 끝나면 컨텍스트 네트워크의 출력 $c$를 wav2letter++ 음향모델의 입력으로 사용한다 — 아키텍처를 새로 설계하지 않고 **입력 특징만 교체**한 것이라, 기존 종단간 파이프라인 어디에나 붙일 수 있다는 것이 실용적 강점이었다.'},
 {h:'라벨이 적을수록 이득이 커진다',
  lead:'전사 8시간만 있는 저자원 설정에서 WER을 최대 36% 상대 개선한다.',
  d:'WSJ의 라벨 있는 학습 데이터를 8시간까지 줄인 시뮬레이션에서, 사전학습된 표현을 쓴 모델이 로그멜 필터뱅크만 쓴 베이스라인보다 훨씬 큰 격차로 앞선다. 라벨이 풍부할 때는 개선폭이 줄어드는데, 이는 사전학습이 "라벨 부족을 라벨 없는 데이터로 메운다"는 성격임을 보여준다.'}
],

diagram:{type:'stack', cap:'원시 파형이 인코더(5층 CNN)로 z가 되고, 컨텍스트 네트워크(9층 CNN)로 c가 된다. c는 k스텝 뒤 z를 negative 후보들 사이에서 맞히도록 학습된다.',
 layers:[
  {t:'원시 파형', s:'16 kHz'},
  {t:'인코더 CNN', s:'5층, stride 5·4·2·2·2', note:'← 10ms마다 z'},
  {t:'잠재 표현 z', s:'30ms 수용영역'},
  {t:'컨텍스트 CNN', s:'9층, 수용영역 210ms', acc:true, note:'← 문맥화'},
  {t:'문맥 표현 c', s:'대조손실 K스텝 예측'}
 ]},

math:[
 {expr:'L_k = -Σ_i [ log σ(z_{i+k}ᵀ h_k(c_i)) + λ·E_{z̃~p_n}[log σ(-z̃ᵀ h_k(c_i))] ]',
  tex:'\\mathcal{L}_k=-\\sum_{i=1}^{T-k}\\Big[\\log\\sigma\\!\\big(z_{i+k}^{\\top}h_k(c_i)\\big)+\\lambda\\,\\mathbb{E}_{\\tilde z \\sim p_n}\\big[\\log\\sigma\\!\\big(-\\tilde z^{\\top}h_k(c_i)\\big)\\big]\\Big]',
  d:'$k$스텝 앞선 대조 손실. 첫 항은 진짜 미래 $z_{i+k}$를 맞히는 항, 두 번째 항은 negative $\\tilde z$를 아니라고 맞히는 항이다. 전체 손실은 $k=1,\\dots,K$에 대해 $L_k$를 합산한다.'}
],

numbers:[
 {k:'WSJ nov92 WER (Char ConvLM, wav2vec 960h)', v:'2.78%', d:'baseline 3.46% 대비 개선, 표 1'},
 {k:'WSJ nov92 WER (Word ConvLM, wav2vec-large 960h)', v:'2.53%', d:'Deep Speech 2의 3.1%(12000h 지도학습)를 능가 — 논문이 강조하는 핵심 결과'},
 {k:'저자원(8시간 라벨) WER 상대 개선', v:'최대 36%', d:'nov92, 라벨 데이터를 극도로 줄인 시뮬레이션 조건'},
 {k:'사전학습 데이터', v:'Librispeech 960h (+WSJ 81h)', d:'라벨 없이, 오디오만 사용'},
 {k:'인코더/컨텍스트 채널 수', v:'512채널', d:'두 네트워크 모두 causal conv + group norm + ReLU'}
],

impact:'"음성도 라벨 없이 먼저 배우고 나중에 소량의 라벨로 미세조정한다"는 자기지도 사전학습 패러다임을 음성 인식에 성공적으로 들여온 첫 사례다. [BERT](#/p/bert)식 마스킹이 아니라 [CPC](#/p/cpc)식 대조 예측을 골랐다는 점, 그리고 기존 파이프라인의 입력 특징만 바꿔치기하는 최소 침습적 설계였다는 점이 실전 채택을 쉽게 만들었다. 이 성공이 곧바로 이산 코드북과 마스킹을 결합한 [wav2vec 2.0](#/p/wav2vec2)으로 이어진다.',

legacy:[
 '**[wav2vec 2.0](#/p/wav2vec2)** — 연속 대조 예측에 양자화 코드북과 마스킹을 더해 라벨 10분만으로도 학습 가능한 수준까지 발전',
 '**[HuBERT](#/p/hubert)** 등 마스킹 예측 기반 음성 사전학습 계열이 뒤이어 등장하며 대조 학습과 경쟁·공존',
 '음성 표현학습이 "얼마나 적은 라벨로 되는가"를 재는 벤치마크 관행(저자원 시뮬레이션)을 정착시킴',
 '인코더+컨텍스트 네트워크의 2단 컨볼루션 구조가 이후 여러 음성 self-supervised 모델의 프론트엔드 설계에 재사용됨'
],

pitfalls:[
 '**"Deep Speech 2를 능가했다"는 문장을 무조건적으로 받아들이면 안 된다.** 2.53% WER은 wav2vec-large + Librispeech 960h + word convolutional LM 조합의 결과이고, Deep Speech 2의 3.1%는 12000시간의 지도학습 데이터로 낸 결과다 — 데이터 규모와 조건이 다른 비교다.',
 '**clean/noisy, nov92/nov93dev 구분을 놓치기 쉽다.** 표 1에 언어모델 종류(4-gram/Word ConvLM/Char ConvLM)별로 여러 행이 있고, 같은 "wav2vec" 모델도 LM에 따라 WER이 2배 가까이 달라진다.',
 '**wav2vec(v1)과 [wav2vec 2.0](#/p/wav2vec2)을 혼동하기 쉽다.** v1은 연속 표현에 대한 대조 예측만 쓰고 마스킹이나 [Transformer](#/p/transformer)가 없다 — 이산 코드북과 마스킹, Transformer 인코더는 후속작인 wav2vec 2.0에서 추가됐다.'
],

figures:[
 {f:'fig1-pretraining.png',
  cap:'맨 아래 파형이 인코더(연한 파란 사다리꼴, X→Z)를 거쳐 z가 되고, 다시 컨텍스트 네트워크(짙은 파란 사다리꼴, Z→C)를 거쳐 c가 된다. 맨 위 곡선 화살표들이 각 c에서 몇 스텝 뒤의 z를 맞히는 대조 손실 L1·L2·L3 — 스텝마다 별도의 손실이 걸린다는 것을 보여준다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'We avoid this problem by first encoding raw speech samples x into a feature representation z at a lower temporal frequency and then implicitly model a density ratio.',
  src:'Section 2, p.2'}
],

links:[
 {t:'arXiv 1904.05862 — wav2vec: Unsupervised Pre-training for Speech Recognition', u:'https://arxiv.org/abs/1904.05862'}
]
});
