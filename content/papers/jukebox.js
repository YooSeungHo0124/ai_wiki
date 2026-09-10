WIKI.paper({
slug:'jukebox',
venue:'arXiv 2020 (OpenAI)',
authors:'Dhariwal, Jun, Payne, Kim, Radford, Sutskever (OpenAI)',
arxiv:'2005.00341',

tldr:'가사가 있는 노래를 **원시 오디오(raw waveform) 그대로** 몇 분 길이로 생성한 첫 모델. 오디오를 3단계로 압축하는 계층적 VQ-VAE와, 그 압축 코드 위에서 돌아가는 [Sparse Transformer](#/p/sparse-transformers) 계열 자기회귀 모델을 결합했다.',

context:'2020년 이전의 음악 생성은 두 갈래로 갈려 있었다. 하나는 피아노롤 같은 **기호(symbolic)** 표현으로 음표·타이밍·악기를 다뤄 문제를 쉽게 만들지만, 표현 가능한 음악의 폭이 정해진 악기·음표 집합으로 제한됐다. 다른 하나는 원시 오디오를 직접 다루는 방식인데, 4분짜리 곡이 44.1kHz 기준 약 1000만 샘플이라 시퀀스가 너무 길어 [WaveNet](#/p/wavenet) 류 모델은 짧은 악기 소품 정도만 다룰 수 있었다. 노래(가사가 있는 보컬)를 원시 오디오로 생성하는 시도는 더 드물었다. 관건은 **1000만 샘플짜리 시퀀스의 장거리 의존성을 어떻게 다룰 수 있는 크기로 압축하면서, 음악적으로 중요한 정보는 잃지 않는가**였다.',

ideas:[
 {h:'다중 해상도 VQ-VAE로 오디오를 3단계 압축',
  lead:'44kHz 오디오를 hop length 8·32·128의 세 코드북으로 각각 독립 압축한다.',
  d:'[VQ-VAE](#/p/vqvae)의 계층 구조를 오디오에 적용해, 원시 오디오를 top(128배)·middle(32배)·bottom(8배) 세 해상도로 압축한다. 각 레벨은 코드북 크기 2048의 **별도** 인코더·디코더를 갖는다. `[Razavi et al.]`의 원조 계층 VQ-VAE처럼 레벨들을 공유 인코더로 묶으면 상위 레벨이 정보를 거의 담지 않는 **코드북 붕괴**가 일어났고, 이를 막기 위해 레벨마다 완전히 분리된 autoencoder를 학습시켰다.'},
 {h:'압축 코드 위에 자기회귀 Transformer를 얹는다',
  lead:'top-level 코드부터 순서대로 생성하고, 하위 레벨은 업샘플러가 채운다.',
  d:'top-level 코드에 대해 [Sparse Transformer](#/p/sparse-transformers) 계열(논문은 "Scalable Transformer"로 단순화)로 prior $p(z^{top})$ 를 학습한다. middle·bottom 레벨은 상위 레벨 코드를 조건으로 받는 업샘플러 Transformer가 순차적으로 채워, $p(z)=p(z^{top})p(z^{mid}|z^{top})p(z^{bot}|z^{mid},z^{top})$ 형태의 결합분포를 계층적으로 근사한다.'},
 {h:'스펙트럴 손실로 고주파를 살린다',
  lead:'샘플 단위 재구성 손실만 쓰면 모델이 저주파만 복원해서 STFT 손실을 더한다.',
  d:'파형의 L2 재구성 손실만 최적화하면 모델은 에너지가 큰 저주파 성분에만 집중하고 고주파 디테일(음색·자음 등)을 버린다. 여러 STFT 해상도에서 스펙트로그램 크기 차이를 벌점으로 주는 $\\mathcal{L}_{spec}$ 를 더해 이를 보완한다. 위상은 애초에 맞추기 어려워 크기만 비교한다.'},
 {h:'아티스트·장르·타이밍·가사로 생성을 조건화한다',
  lead:'top-level prior에 아티스트·장르 레이블과 곡 진행률, 비정렬 가사를 함께 입력한다.',
  d:'아티스트·장르 레이블을 조건으로 주면 예측 엔트로피가 줄어 품질이 오르고, 생성 시 스타일도 지정할 수 있다. 곡의 전체 길이·현재 구간의 시작 시각·진행률을 알려주는 타이밍 신호는 모델이 도입부·후렴·마무리 같은 곡 구조를 배우게 한다. 가사는 시간 정렬 정보 없이 텍스트만 주어지므로, 별도의 인코더가 가사와 노래를 스스로 정렬하도록 학습한다.'},
 {h:'창을 슬라이딩하며 무한히 이어 생성한다',
  lead:'모델의 context 길이를 넘는 곡은 이전 코드를 겹쳐 창을 밀며 이어 붙인다.',
  d:'prior와 업샘플러 모두 최대 8192 코드 토큰의 context만 볼 수 있다(top level 기준 약 24초). 이보다 긴 곡은 이전 생성분의 일부를 겹치는 context로 남긴 채 창을 뒤로 밀어(windowed sampling) 반복 생성한다. 기존 오디오를 이어 부르게 하는 primed sampling도 같은 인코딩 경로로 구현된다.'}
],

diagram:{type:'flow', cap:'top-level 코드부터 아래로 캐스케이드 생성한 뒤 VQ-VAE 디코더로 파형을 복원한다(ancestral sampling).',
 nodes:[
  {t:'조건 정보', s:'장르·아티스트·가사'},
  {t:'Top prior', s:'8192 토큰, 5B', acc:true},
  {t:'Middle 업샘플러', s:'1B'},
  {t:'Bottom 업샘플러', s:'1B'},
  {t:'VQ-VAE 디코더', s:'코드 → 파형'}
 ]},

math:[
 {expr:'L = L_recons + L_codebook + β·L_commit',
  tex:'L = L_{\\text{recons}} + L_{\\text{codebook}} + \\beta L_{\\text{commit}}',
  d:'[VQ-VAE](#/p/vqvae)의 표준 3항 손실. 재구성 손실 + 코드북을 인코더 출력 쪽으로 당기는 항 + 인코더를 코드북 쪽으로 당기는 commitment 항. 코드북 항은 속도를 위해 EMA 갱신으로 대체한다.'},
 {expr:'L_spec = || |STFT(x)| − |STFT(x̂)| ||₂',
  tex:'\\mathcal{L}_{\\text{spec}} = \\big\\| \\,|\\text{STFT}(x)| - |\\text{STFT}(\\hat{x})|\\, \\big\\|_2',
  d:'여러 STFT 창 크기(시간-주파수 해상도 트레이드오프)에 대해 합산해, 특정 STFT 파라미터에 과적합하지 않게 한다.'},
 {expr:'p(z) = p(z_top) · p(z_mid | z_top) · p(z_bot | z_mid, z_top)',
  tex:'p(\\mathbf{z}) = p(\\mathbf{z}^{\\text{top}})\\,p(\\mathbf{z}^{\\text{mid}}\\mid \\mathbf{z}^{\\text{top}})\\,p(\\mathbf{z}^{\\text{bot}}\\mid \\mathbf{z}^{\\text{mid}}, \\mathbf{z}^{\\text{top}})',
  d:'세 레벨의 결합분포를 top→middle→bottom 순서로 조건부 분해해, 각각을 독립된 자기회귀 Transformer로 학습한다.'}
],

numbers:[
 {k:'압축 배율', v:'8x · 32x · 128x', d:'bottom·middle·top 레벨, 코드북 크기는 레벨당 2048로 동일'},
 {k:'context 길이', v:'8192 토큰', d:'top level 기준 약 24초, middle 6초, bottom 1.5초 분량'},
 {k:'top-level prior 크기', v:'50억 파라미터', d:'512 V100 GPU로 4주 학습'},
 {k:'업샘플러 크기', v:'각 10억 파라미터', d:'128 V100 GPU로 2주 학습'},
 {k:'학습 데이터', v:'곡 120만 개', d:'그중 60만 개는 영어 가사 포함'},
 {k:'생성 속도', v:'1분 분량에 약 9시간', d:'top-level 생성 약 1시간 + 업샘플링 약 8시간(순차 처리라 병렬화 안 됨)'}
],

impact:'노래 전체(멜로디·리듬·다양한 악기의 음색·가수의 발성)를 원시 파형에서 통째로 생성할 수 있음을 처음 보였고, 가사·아티스트·장르로 조건화해 원하는 스타일의 보컬 트랙을 뽑아내는 것이 가능함을 입증했다. 동시에 순수 자기회귀 방식으로 오디오를 다루는 것의 한계 — 생성이 극도로 느리고 장거리 구조(후렴 반복 등)를 잡지 못한다는 점 — 를 명확히 드러내, 이후 연구가 더 짧고 병렬화 가능한 오디오 토큰 표현을 찾도록 만든 이정표가 되었다.',

legacy:[
 '**오디오 토큰화 계보** — [VQ-VAE](#/p/vqvae) → Jukebox의 다중 레벨 압축 → [SoundStream](#/p/soundstream)/[EnCodec](#/p/encodec)의 RVQ 코덱 → [AudioLM](#/p/audiolm)/[VALL-E](#/p/vall-e)로 이어지며, 오디오를 이산 토큰으로 바꿔 언어모델처럼 다루는 흐름의 초기 이정표로 남았다',
 '**분리된 생성-압축 역할 분담** — prior는 저해상도 top 코드만 책임지고 세부 복원은 업샘플러/디코더가 맡는 구조는 이후 계층적 오디오·이미지 생성 모델의 공통 패턴이 됐다',
 '**속도 문제가 이후 세대의 핵심 과제로** — 자기회귀 업샘플링의 느림이 [AudioLM](#/p/audiolm) 이후 병렬 디코딩·비자기회귀 코덱 연구를 자극했다',
 '**가사-노래 정렬 학습** — 타이밍 정보 없는 텍스트만으로 가사와 보컬을 정렬시키는 접근은 이후 TTS·노래 합성의 조건화 기법에 참고가 됐다'
],

pitfalls:[
 '**"실시간 생성"으로 오해하면 안 된다.** 1분짜리 곡을 만드는 데 top-level 생성 약 1시간, 업샘플링 약 8시간이 걸린다 — 업샘플링이 시퀀스를 따라 순차적으로 진행되어 병렬화되지 않기 때문이다.',
 '**세 레벨 VQ-VAE는 공유 인코더가 아니라 독립 인코더다.** 원조 계층 VQ-VAE([Razavi et al.])를 그대로 오디오에 썼다고 착각하면 안 된다 — 공유 인코더로 하면 상위 레벨이 정보를 거의 담지 않는 붕괴가 관찰되어, 저자들은 레벨마다 완전히 분리된 autoencoder를 학습시키는 쪽으로 바꿨다.',
 '**8192 토큰 context는 원시 샘플 기준이 아니다.** top level에서는 약 24초에 불과해, 곡 전체의 후렴 반복 같은 장거리 구조는 애초에 모델의 context 안에 들어오지 않는다.'
],

figures:[
 {f:'fig1-vqvae.png',
  cap:'같은 입력 오디오를 세 레벨이 각자 독립적으로 encode → vector quantization(코드북에서 가장 가까운 벡터 선택) → decode 한다. 아래로 갈수록 압축률이 낮아(hop length가 작아) 세밀한 파형을 복원하고, 위로 갈수록 압축률이 높아 더 추상적인 정보만 남긴다. 세 줄이 서로 다른 코드북 $e_k$ 를 공유하지 않는 점에 주목.',
  src:'원문 Figure 1, p.3'},
 {f:'fig2a-ancestral.png',
  cap:'파란 상자가 학습되는 세 Transformer(top prior, middle/bottom upsampler)이고, 회색 막대가 각 단계에서 이미 결정된 코드(옅은 회색)와 지금 막 새로 생성 중인 구간(짙은 회색)이다. top→middle→bottom 순서로 좁은 코드를 조건 삼아 더 촘촘한 코드를 채워가다가, 마지막에 VQ-VAE 디코더가 파형으로 되돌린다.',
  src:'원문 Figure 2(a), p.4'}
],

quotes:[
 {t:'We introduce Jukebox, a model that generates music with singing in the raw audio domain.',
  src:'Abstract, p.1'},
 {t:'The current model takes around an hour to generate 1 minute of top level tokens. The upsampling process is very slow, as it proceeds sequentially through the sample. Currently it takes around 8 hours to upsample one minute of top level tokens.',
  src:'Section 7 (Future work), p.8'}
],

links:[
 {t:'arXiv 2005.00341 — Jukebox: A Generative Model for Music', u:'https://arxiv.org/abs/2005.00341'},
 {t:'OpenAI Jukebox 공식 블로그·샘플', u:'https://openai.com/research/jukebox'},
 {t:'GitHub — openai/jukebox', u:'https://github.com/openai/jukebox'}
]
});
