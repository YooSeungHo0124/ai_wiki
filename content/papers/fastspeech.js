WIKI.paper({
slug:'fastspeech',
venue:'NeurIPS 2019',
authors:'Ren et al. (Zhejiang University · Microsoft Research)',
arxiv:'1905.09263',

tldr:'attention 기반 자기회귀 decoder를 통째로 없애고, 음소별 **길이(duration)를 예측해 병렬로 mel spectrogram을 만드는** TTS 모델. mel 생성 속도를 270배 높이면서 [Tacotron 2](#/p/tacotron2) 계열이 겪던 단어 반복·생략 문제까지 함께 줄였다.',

context:'[Tacotron 2](#/p/tacotron2)와 Transformer TTS 같은 자기회귀 seq2seq 모델은 프레임을 하나씩 순차 생성해야 해서 문장이 길어질수록 지연이 비례해 커졌고, GPU 병렬성을 살릴 수 없었다. 더 심각한 문제는 **강건성**이었다 — attention이 인코더 입력을 스스로 정렬해야 하는데, 이 정렬이 실패하면 특정 단어를 건너뛰거나 반복해서 발음하는 오류가 실제 서비스에서 자주 발생했다. 이 논문의 질문은 attention 기반 [seq2seq](#/p/seq2seq) 구조 자체를 버리고 **"음소 하나가 mel 프레임 몇 개에 대응하는지"만 알면 병렬로 채워 넣을 수 있지 않을까**였다.',

ideas:[
 {h:'Feed-Forward Transformer(FFT): 자기회귀 decoder를 없앤다',
  lead:'self-attention과 1D conv로만 이뤄진 블록을 쌓아 mel 전체를 한 번에 출력한다.',
  d:'[Transformer](#/p/transformer)의 self-attention과 position-wise FFN 자리에 1D convolution을 섞은 FFT 블록을 인코더·디코더 양쪽에 동일하게 쌓는다. RNN도 자기회귀 decoder도 없어서, 학습은 물론 **추론까지 완전히 병렬**이다. 문제는 인코더가 만드는 음소 시퀀스 길이와 mel 프레임 시퀀스 길이가 다르다는 것 — 이를 length regulator로 해결한다.'},
 {h:'Length regulator: duration만큼 음소 hidden을 복제',
  lead:'음소 하나의 hidden 벡터를 예측된 duration만큼 그대로 반복해 프레임 길이를 맞춘다.',
  d:'음소 $i$ 가 mel 프레임 $d_i$ 개에 대응한다고 하면, 그 음소의 hidden state를 $d_i$ 번 복제해 늘어놓는 것만으로 음소 시퀀스를 mel 프레임 길이로 바꾼다. attention으로 정렬을 "추론"하는 대신 duration이라는 **명시적 하드 정렬**을 쓰는 것이라, 정렬이 어긋나 단어를 통째로 건너뛰는 실패 모드가 구조적으로 사라진다.'},
 {h:'Duration predictor: teacher 모델의 attention에서 정답을 뽑는다',
  lead:'별도 학습된 자기회귀 Transformer TTS의 attention 정렬에서 음소별 duration을 추출해 지도 학습한다.',
  d:'FastSpeech 자체에는 정답 duration이 없으므로, 먼저 자기회귀 Transformer TTS를 teacher로 학습시켜 그 encoder-decoder attention의 가장 집중된 위치를 음소별 길이로 환산해 duration 정답으로 쓴다. 이 duration predictor는 conv층 두 개로 이뤄진 작은 회귀 모델이며 MSE로 학습되고, **추론 시에는 teacher 없이 predictor의 예측값만으로** length regulator를 구동한다.'},
 {h:'Knowledge distillation으로 mel target 자체를 순화',
  lead:'ground truth mel 대신 teacher가 생성한 mel을 학습 타깃으로 써서 다봉 분포 문제를 줄인다.',
  d:'같은 텍스트라도 실제 발화는 억양·속도가 다양해 target mel 분포가 다봉(multi-modal)이 된다. 병렬 모델이 이 분산을 평균 내버리면 흐릿한(over-smoothed) mel이 나온다. teacher 모델이 생성한 mel을 distillation target으로 쓰면 teacher가 이미 하나의 그럴듯한 경로로 분포를 좁혀 놓았기 때문에 FastSpeech가 더 선명한 mel을 학습한다.'},
 {h:'속도 조절: duration에 계수를 곱하기만 하면 된다',
  lead:'예측된 duration 전체에 배율을 곱해 발화 속도를 이산 단계 없이 조절한다.',
  d:'duration $d_i$ 에 스칼라 $\\alpha$ 를 곱하면 발화 속도가 통째로 빨라지거나 느려진다. 자기회귀 모델은 이런 전역적 속도 제어가 자연스럽지 않지만, 명시적 duration을 쓰는 FastSpeech에서는 한 줄의 곱셈으로 해결된다. 음소 사이에 공백 duration을 늘리면 단어 사이 휴지(break)도 조절할 수 있다.'}
],

diagram:{type:'flow', cap:'Teacher(자기회귀 Transformer TTS)의 attention에서 duration을 뽑아 FastSpeech를 지도 학습한다. 추론 시 teacher는 빠지고 duration predictor만 남는다.',
 nodes:[
  {t:'음소 시퀀스', s:'입력'},
  {t:'FFT 인코더', s:'self-attn+conv'},
  {t:'Duration 예측', s:'teacher가 지도', acc:true},
  {t:'길이 조절', s:'hidden 복제'},
  {t:'FFT 디코더', s:'mel 병렬 출력'}
 ]},

math:[
 {expr:'LR(H, D, alpha) — 음소 hidden h_i를 round(d_i * alpha)번 복제',
  tex:'\\text{LR}(\\mathcal{H},\\mathcal{D},\\alpha)=[\\underbrace{h_1,\\dots,h_1}_{\\alpha d_1},\\dots,\\underbrace{h_n,\\dots,h_n}_{\\alpha d_n}]',
  d:'length regulator의 정의. 음소 인코더 출력 $\\mathcal{H}=[h_1,\\dots,h_n]$ 를 duration $\\mathcal{D}=[d_1,\\dots,d_n]$ 만큼 반복해 mel 프레임 길이의 시퀀스로 늘린다. $\\alpha$ 는 속도 제어 계수.'},
 {expr:'L_duration = MSE(duration_predictor(H), d_teacher)',
  tex:'\\mathcal{L}_{\\text{dur}}=\\lVert \\hat{d}-d^{\\text{teacher}} \\rVert_2^2',
  d:'duration predictor는 teacher의 attention에서 뽑은 음소별 길이 $d^{teacher}$ 를 MSE로 회귀 학습한다. log 스케일로 예측한 뒤 지수화해 정수 duration으로 반올림한다.'}
],

numbers:[
 {k:'mel 생성 속도', v:'270x', d:'자기회귀 Transformer TTS 대비(269.40배, 원문 Table 2)'},
 {k:'end-to-end 음성 생성 속도', v:'38x', d:'WaveGlow vocoder 포함 전체 파이프라인 기준(38.30배)'},
 {k:'MOS · FastSpeech', v:'3.84 ± 0.08', d:'Mel + WaveGlow. Tacotron 2(3.86)·Transformer TTS(3.88)와 근접'},
 {k:'MOS · Ground Truth', v:'4.41 ± 0.08', d:'상한선'},
 {k:'FFT 블록 수', v:'6개(인코더) + 6개(디코더)', d:'hidden 차원 384, head 2개'},
 {k:'단어 skip/repeat 비율', v:'0%대로 급감', d:'50개 어려운 문장 세트에서 Transformer TTS 대비 크게 감소(원문 §4.3)'}
],

impact:'FastSpeech는 TTS를 "attention이 정렬까지 배우는 seq2seq 문제"에서 "duration을 예측하고 병렬로 채우는 회귀 문제"로 재정의했다. 그 결과 속도(270배)와 강건성(반복·생략 감소)을 동시에 얻었지만, teacher 모델을 먼저 학습해야 하는 2단계 파이프라인이라는 새로운 복잡도가 생겼다. 이 duration-based 병렬 생성 패러다임은 이후 FastSpeech 2가 teacher 없이 직접 duration·pitch·energy를 추출하는 방식으로 단순화했고, [HiFi-GAN](#/p/hifi-gan)·[VITS](#/p/vits)까지 이어지는 "비자기회귀 음성 합성"이라는 트랙의 출발점이 됐다.',

legacy:[
 '**duration 기반 정렬이 표준 대안으로 자리잡음** — attention 정렬 대신 명시적 duration을 쓰는 방식이 이후 대다수 비자기회귀 TTS의 기본 골격이 됨',
 '**teacher-student 구조의 단순화** — FastSpeech 2는 teacher 모델을 없애고 forced alignment로 duration을 직접 추출해 파이프라인을 1단계로 줄임',
 '**vocoder 쪽 병렬화와 결합** — 자기회귀 WaveNet vocoder는 [HiFi-GAN](#/p/hifi-gan) 같은 GAN 기반 병렬 vocoder로 대체되며 mel 생성과 파형 생성 양쪽 모두 비자기회귀가 됨',
 '**duration predictor 자체가 [VITS](#/p/vits)의 stochastic duration predictor로 발전** — 결정론적 길이 예측을 확률적 분포로 일반화'
],

pitfalls:[
 '**teacher 없이는 학습되지 않는다.** duration 정답이 자기회귀 Transformer TTS의 attention에서 나오므로, teacher 모델을 먼저 처음부터 학습시켜야 한다. 이 논문만으로는 "attention 없는 순수 end-to-end 학습"이 아니다.',
 '**MOS가 teacher를 능가하지 못한다.** 속도는 압도적으로 빠르지만 음질은 Tacotron 2·Transformer TTS와 비슷하거나 약간 낮다(3.84 vs 3.86/3.88) — 이 논문의 기여는 음질 향상이 아니라 속도와 강건성이다.',
 '**duration이 정수로 반올림된다는 것의 의미.** 하드 정렬이라 attention처럼 부드러운 재정렬이 불가능하며, duration predictor가 틀리면 음소 하나가 과도하게 늘어지거나 짧아지는 오류가 생길 수 있다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'(a) 전체 구조: 음소가 FFT 인코더 → Length Regulator → FFT 디코더를 거쳐 mel이 된다. (b) FFT 블록 내부는 Multi-Head Attention과 Conv1D를 residual+LayerNorm으로 감싼 것. (c) Length Regulator가 duration만큼 hidden을 복제하는 모습. (d) Duration Predictor는 Conv1D+Norm을 쌓은 뒤 스칼라 duration을 회귀한다.',
  src:'원문 Figure 1, p.4'}
],

quotes:[
 {t:'Experiments on the LJSpeech dataset show that FastSpeech nearly matches the autoregressive Transformer model in terms of speech quality, nearly eliminates the problem of word skipping and repeating in particularly hard cases, and can adjust voice speed smoothly.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1905.09263 — FastSpeech: Fast, Robust and Controllable Text to Speech', u:'https://arxiv.org/abs/1905.09263'}
]
});
