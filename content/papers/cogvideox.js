WIKI.paper({
slug:'cogvideox',
venue:'ICLR 2025',
authors:'Yang, Teng et al. (Tsinghua University · Zhipu AI)',
arxiv:'2408.06072',

tldr:'텍스트로 **10초·16fps·768×1360** 해상도의 일관된 영상을 생성하는 대규모 diffusion transformer. 3D VAE로 영상을 시공간째 압축하고, 텍스트·영상을 함께 처리하는 expert Transformer를 붙여 상용 수준 품질의 오픈소스 영상 생성 모델을 처음 공개했다.',

context:'2024년 초 text-to-video는 [Video LDM](#/p/videoldm)류의 2D VAE + 시간축 별도 처리 구조가 주류였다. 2D VAE는 프레임을 독립적으로 압축하므로 프레임 사이 flicker가 남고, spatial attention과 temporal attention을 분리해 계산하는 구조는 인접 프레임 사이 큰 움직임을 배경 패치를 거쳐 **암묵적으로만** 전달해야 했다. 그 결과 기존 모델은 움직임이 작고 영상 길이가 짧았다. [DiT](#/p/dit)가 이미지 생성에서 diffusion transformer의 확장성을 보였지만, 영상에 그대로 옮기면 시퀀스 길이가 폭발하고 텍스트·영상 두 모달리티를 어떻게 한 Transformer 안에서 정렬할지가 풀리지 않은 문제였다.',

ideas:[
 {h:'3D Causal VAE: 시공간을 함께 압축',
  lead:'3D convolution으로 영상을 공간·시간 축 모두에서 압축해 시퀀스 길이와 flicker를 동시에 줄인다.',
  d:'기존처럼 2D VAE를 프레임마다 돌리는 대신, 인코더·디코더에 3D convolution을 넣어 $F\\times H\\times W$ 영상을 $8\\times8\\times4$ 비율로 압축한다. 시간축은 causal convolution을 써서 패딩을 앞쪽에만 둬 미래 프레임이 현재·과거 예측에 섞이지 않게 한다. 161프레임 같은 긴 영상은 GPU 여러 대에 시간축을 나눠 처리하는 context parallel로 감당한다.'},
 {h:'Expert Transformer: 텍스트·영상을 한 시퀀스로, 변조는 따로',
  lead:'텍스트·영상 임베딩을 이어붙여 함께 attention을 계산하되, LayerNorm 변조 파라미터는 모달리티별로 분리한다.',
  d:'T5로 인코딩한 텍스트 임베딩 $z_{text}$ 와 3D VAE 잠재를 patchify한 $z_{vision}$ 을 시퀀스 축으로 concat해 하나의 Transformer에 넣는다. 두 모달리티는 값의 스케일이 크게 달라, timestep을 입력으로 받는 AdaLN의 scale·shift·gate 파라미터를 텍스트용·비전용으로 따로 둔 **Expert AdaLN**만 분리하고 attention 가중치는 공유한다. 파라미터를 크게 늘리지 않으면서 두 모달리티를 정렬하는 절충이다.'},
 {h:'3D Full Attention: 분리 attention을 버린다',
  lead:'공간·시간 attention을 나누지 않고 모든 패치가 서로를 직접 참조하게 한다.',
  d:'분리된 spatial/temporal attention에서는 프레임 $i$ 의 특정 위치가 프레임 $i+1$ 의 같은 위치를 직접 보지 못하고 배경을 거쳐야만 정보가 전달돼, 큰 움직임에서 일관성이 깨진다. CogVideoX는 모든 시공간 패치를 하나의 attention에 넣는 3D full attention을 쓰고, [FlashAttention](#/p/flashattention)으로 그 계산 비용을 감당한다. 위치 정보는 $(x,y,t)$ 3좌표에 [RoPE](#/p/rope)를 독립적으로 적용해 채널을 3/8·3/8·2/8로 나눠 이어붙인 3D-RoPE로 준다.'},
 {h:'Progressive training과 frame packing',
  lead:'저해상도부터 고해상도로 단계를 올리고, 다양한 길이의 영상을 한 배치에 묶어 학습 효율을 높인다.',
  d:'인터넷 영상은 저해상도가 많아 고해상도로 바로 학습하면 비싸고 비효율적이다. 256px에서 시작해 512px, 목표 해상도까지 순차적으로 올리며, 마지막에 고품질 데이터로 파인튜닝한다. 서로 다른 프레임 수·해상도의 영상을 같은 배치에 묶는 multi-resolution frame packing으로 짧은 영상도 버리지 않고 활용한다.'},
 {h:'영상 캡션 파이프라인과 Explicit Uniform Sampling',
  lead:'GPT-4로 프레임 캡션을 요약해 dense 영상 캡션을 만들고, 학습 스텝마다 timestep을 고르게 뽑는다.',
  d:'인터넷 영상의 원본 캡션은 짧고 부정확해, 프레임별 이미지 캡션을 CogVLM으로 만든 뒤 GPT-4로 요약해 dense 영상 캡션을 생성하는 파이프라인을 따로 구축했다(이후 end-to-end 캡션 모델로 증류). 또한 diffusion timestep을 매 배치 무작위로 뽑는 대신 data-parallel rank마다 $1$~$T$ 구간을 나눠 고르게 샘플링하는 Explicit Uniform Sampling으로 loss curve를 안정시키고 수렴을 앞당겼다.'}
],

diagram:{type:'flow', cap:'텍스트와 영상을 각각 인코딩해 이어붙이고, Expert Transformer를 N번 통과시킨 뒤 VAE 디코더로 복원한다.',
 nodes:[
  {t:'영상', s:'F×H×W'},
  {t:'3D Causal VAE', s:'8×8×4 압축', acc:true},
  {t:'텍스트', s:'T5 인코딩'},
  {t:'시퀀스 결합', s:'z_text + z_vision'},
  {t:'Expert TF', s:'3D Full Attn ×N', acc:true},
  {t:'VAE 디코더', s:'잠재 → 영상'}
 ]},

math:[
 {expr:'Compression: F×H×W → (F/4+1)×H/8×W/8 (8×8×4)',
  tex:'(F\\times H\\times W)\\ \\xrightarrow{3D\\ VAE}\\ \\left(\\tfrac{F}{4}+1\\right)\\times\\tfrac{H}{8}\\times\\tfrac{W}{8}',
  d:'시간축은 4배, 공간축은 각 8배 압축해 latent를 만든다. causal convolution이라 첫 프레임은 따로 취급돼 $(f+1)$ 형태가 된다.'},
 {expr:'z_seq = concat(z_text, z_vision) along sequence axis',
  tex:'z_{\\text{seq}} = \\text{concat}(z_{\\text{text}},\\, z_{\\text{vision}})',
  d:'Transformer에 들어가는 실제 입력. attention은 이 결합 시퀀스 전체에 대해 한 번에 계산되고, LayerNorm 변조만 모달리티별 Expert AdaLN으로 나뉜다.'}
],

numbers:[
 {k:'생성 스펙', v:'10초 · 16fps · 768×1360', d:'CogVideoX-5B/2B 공통 목표 사양'},
 {k:'모델 크기', v:'5B / 2B', d:'두 크기를 공개, 5B가 7개 지표 중 5개에서 최고 성능'},
 {k:'VAE 압축률', v:'8×8×4', d:'Table 1 ablation의 variant B, 채널 16에서 PSNR 28.7'},
 {k:'학습 데이터', v:'약 35M 클립 · 평균 6초', d:'필터링 후 남은 single-shot 영상 클립 수, 2B 이미지 데이터도 함께 사용'},
 {k:'VAE 학습 프레임', v:'17→161 프레임', d:'짧은 시퀀스로 먼저 학습 후 context parallel로 긴 영상에 파인튜닝'},
 {k:'인간 평가 승률', v:'Kling 대비 우위', d:'Table 4, Sensory Quality·Instruction Following 등 다수 항목에서 CogVideoX-5B 우세'}
],

impact:'오픈소스 text-to-video를 상용 폐쇄형 모델([Kling](#/p/videoldm) 등)과 겨룰 수준으로 끌어올린 첫 공개 모델 중 하나였다. 3D causal VAE로 시공간을 함께 압축하는 방식과 텍스트·영상을 한 시퀀스에 넣고 변조만 분리하는 Expert Transformer 설계는 이후 영상 생성 모델들의 표준 구성이 되었다. 코드·체크포인트를 모두 공개해 커뮤니티가 영상 diffusion transformer를 직접 재현·수정할 수 있는 기준점을 만들었다.',

legacy:[
 '**시공간 통합 압축의 표준화** — 2D VAE + 프레임별 처리 대신 3D causal VAE가 이후 오픈 영상 모델의 기본 선택지가 됨',
 '**Expert 구조의 확산** — 모달리티별 AdaLN만 분리하고 attention은 공유하는 절충이 이후 멀티모달 diffusion transformer 설계에 참조됨',
 '**영상 캡션 파이프라인의 중요성 부각** — 데이터 캡션 품질이 text-video 정렬의 병목이라는 인식이 후속 연구의 데이터 파이프라인 투자로 이어짐',
 '오픈 웨이트 공개로 [Sora](#/p/dit) 류 폐쇄형 모델과 비교·재현 가능한 기준선을 제공'
],

pitfalls:[
 '**"3D VAE니까 무조건 좋다"는 아니다.** Table 1 ablation에서 압축률을 16×16×8까지 올리면 채널을 128로 늘려도 수렴 자체가 어려워졌다 — 압축률에는 한계가 있다.',
 '**Expert AdaLN은 파라미터 공유 절충이지 완전한 두 개의 Transformer가 아니다.** attention 가중치는 텍스트·영상이 공유하므로, 두 모달리티를 완전히 독립적으로 다루는 MMDiT류와는 다른 설계다.',
 '**공개 스펙(10초·16fps)은 최종 파인튜닝 이후 수치다.** 학습은 17프레임 저해상도에서 시작해 점진적으로 늘어난 progressive training의 결과이며, 처음부터 이 해상도로 학습한 것이 아니다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'아래에서 위로 흐름을 본다. 텍스트는 Text Encoder(T5)로, 영상은 3D Causal VAE로 각각 z_text·z_vision을 만들어 이어붙인다. 이후 Scale&Shift(모달리티별 Expert AdaLN 변조) → 3D Full Attention(텍스트·영상 통합) → Gate → Feed Forward의 블록이 N번 반복된다. 왼쪽 열(첨자 t)이 텍스트 경로, 오른쪽 열(첨자 v)이 영상 경로다.',
  src:'원문 Figure 3, p.3'},
 {f:'fig2-vae.png',
  cap:'인코더(왼쪽 하늘색)는 2×Downsample 스테이지를 거치며 처음엔 공간·시간을 함께, 마지막 한 단계는 공간만 줄인다. 디코더(오른쪽 노란색)는 대칭으로 업샘플링한다. 가운데 KL Regularizer가 잠재 분포를 정규화하고, 그 결과 잠재는 $(f+1)\\times h\\times w$ 모양이 된다.',
  src:'원문 Figure 4(a), p.4'}
],

quotes:[
 {t:'We present CogVideoX, a large-scale text-to-video generation model based on diffusion transformer, which can generate 10-second continuous videos that align seamlessly with text prompts, with a frame rate of 16 fps and resolution of 768 × 1360 pixels.',
  src:'Abstract, p.1'},
 {t:'This mechanism not only achieves better results but can also be easily adapted to various parallel acceleration methods.',
  src:'Section 2.2, p.5'}
],

links:[
 {t:'arXiv 2408.06072 — CogVideoX', u:'https://arxiv.org/abs/2408.06072'},
 {t:'GitHub — THUDM/CogVideo', u:'https://github.com/THUDM/CogVideo'}
]
});
