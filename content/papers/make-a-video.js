WIKI.paper({
slug:'make-a-video',
venue:'arXiv 2022 (Meta AI)',
authors:'Singer, Polyak, Hayes, Yin et al. (Meta AI)',
arxiv:'2209.14792',

tldr:'텍스트-비디오 쌍 데이터 없이 텍스트→비디오를 생성한 논문. 사전학습된 텍스트→이미지(T2I) diffusion 모델에 라벨 없는 비디오만으로 학습되는 **시간 층**을 끼워 넣어, "무엇을 그릴지"는 이미지에서, "어떻게 움직이는지"는 비디오에서 따로 배우게 분리했다.',

context:'2022년 T2I 생성은 [DALL·E](#/p/dalle) 계열과 diffusion 계열이 웹에서 긁은 수십억 장의 (텍스트, 이미지) 쌍으로 이미 고품질에 도달해 있었다. 반면 T2V는 뒤처져 있었는데, 이유는 단순하다 — 그만한 규모의 (텍스트, 비디오) 쌍 데이터가 존재하지 않는다. CogVideo나 [Video Diffusion Models](#/p/video-diffusion)(VDM) 같은 동시대 연구는 자체적으로 1000만 개 규모의 비공개 텍스트-비디오 쌍을 수집해서 이 문제를 정면 돌파했다. 이 논문의 질문은 다르다 — 애초에 텍스트-비디오 쌍이 왜 필요한가? 이미지는 정지된 비디오 한 프레임일 뿐이고, "무엇을 그릴지"는 이미 T2I 모델이 알고 있다. 남은 건 "어떻게 움직이는지"뿐이고, 그건 텍스트 라벨 없는 비디오만 봐도 배울 수 있다.',

ideas:[
 {h:'T2I와 T2V의 데이터를 분리한다',
  lead:'그림 그리기는 이미지 쌍에서, 움직임은 라벨 없는 비디오에서 따로 학습한다.',
  d:'전체 파이프라인 $\\hat{y}_t = SR_h \\circ SR_l^t \\circ {\\uparrow}_F \\circ D^t \\circ P(\\hat{x}, C_x(x))$ 에서 텍스트를 실제로 입력받는 구성요소는 prior $P$ 하나뿐이고, 이것은 텍스트-이미지 쌍만으로 학습된다. 나머지 시공간 디코더·프레임 보간·초해상도 네트워크는 전부 **비디오만** 보고 학습되며 텍스트를 아예 보지 않는다. 텍스트-비디오 쌍 데이터셋 자체가 필요 없어지는 구조.'},
 {h:'Pseudo-3D conv: 시간 축을 1D conv로 덧붙인다',
  lead:'2D conv 뒤에 1D 시간 conv를 이어 붙여 3D conv의 연산 폭증을 피한다.',
  d:'$Conv_{P3D}(h) := Conv_{1D}(Conv_{2D}(h) \\circ T) \\circ T$ — 기존 T2I의 2D conv 층은 그대로 두고, 그 뒤에 시간 축만 보는 1D conv를 새로 추가한다. 3D conv를 통째로 쓰는 것보다 계산량이 훨씬 적고, 무엇보다 사전학습된 2D 가중치와 새로 학습할 1D 가중치가 물리적으로 분리돼 있어 "이미 아는 것"과 "새로 배울 것"의 경계가 명확하다.'},
 {h:'Pseudo-3D attention도 같은 방식으로 분해한다',
  lead:'공간 attention 뒤에 시간 attention을 이어 붙여 전체 3D attention을 근사한다.',
  d:'3D attention을 직접 계산하면 메모리가 감당이 안 되므로, $ATTN_{P3D}(h) = unflatten(ATTN_{1D}(ATTN_{2D}(flatten(h)) \\circ T) \\circ T)$ 형태로 공간 attention과 시간 attention을 순차적으로 근사한다. VDM이 시간 정보를 상대적 위치 임베딩으로 주입한 것과 달리, 이 논문은 매 conv마다 3×1×1 투영을 추가로 통과시켜 시간 정보가 더 자주 섞이게 한다.'},
 {h:'항등 초기화로 이미지 능력을 그대로 물려받는다',
  lead:'새 시간 층을 항등 함수로 초기화해 학습 시작점을 원래 T2I 모델과 같게 만든다.',
  d:'새로 추가되는 1D conv는 항등 함수로, 시간 attention의 출력 투영은 0으로 초기화한다. 그 결과 학습 시작 시점의 네트워크는 원래 T2I 모델과 정확히 같은 함수이고(단, 프레임마다 노이즈가 달라 시간적 일관성만 없다), 학습이 진행되며 시간 층만 서서히 켜진다. 이 초기화 덕분에 T2V 학습이 이미지 생성 능력을 잃지 않고 시작된다.'},
 {h:'프레임 보간/외삽 네트워크로 해상도·프레임률을 늘린다',
  lead:'마스킹된 프레임 보간 모델로 16프레임을 76프레임까지 늘린다.',
  d:'디코더 $D^t$는 저해상도 64×64 프레임 16장만 생성한다. 여기에 마스크된 프레임 보간 네트워크 $\\uparrow_F$(중간 프레임을 마스킹하고 채우도록 미세조정)를 적용해 프레임 스킵 5로 76프레임까지 늘리고, 시공간 초해상도 $SR_l^t$(256×256)와 공간 초해상도 $SR_h$(768×768)를 순서대로 적용한다. 같은 네트워크를 앞뒤로 마스킹하면 이미지 애니메이션(정지 이미지 → 비디오)도 그대로 된다.'}
],

diagram:{type:'flow', cap:'텍스트에서 최종 고해상도 비디오까지의 5단계 파이프라인. Prior만 텍스트를 직접 본다.',
 nodes:[
  {t:'Prior P', s:'텍스트→이미지 임베딩', acc:true},
  {t:'시공간 디코더 D^t', s:'16 × 64×64 프레임'},
  {t:'프레임 보간 ↑F', s:'16 → 76 프레임'},
  {t:'시공간 초해상도', s:'→ 256×256'},
  {t:'공간 초해상도', s:'→ 768×768'}
 ]},

math:[
 {expr:'Conv_P3D(h) = Conv1D( Conv2D(h) ∘ T ) ∘ T',
  tex:'Conv_{P3D}(h) := Conv_{1D}\\!\\big(Conv_{2D}(h)\\circ T\\big)\\circ T',
  d:'$\\circ T$ 는 공간·시간 축을 뒤바꾸는 transpose. 2D conv는 사전학습된 T2I 가중치로, 1D conv는 항등 함수로 초기화한다.'},
 {expr:'ATTN_P3D(h) = unflatten( ATTN1D( ATTN2D(flatten(h)) ∘ T ) ∘ T )',
  tex:'ATTN_{P3D}(h) = unflatten\\!\\Big(ATTN_{1D}\\big(ATTN_{2D}(flatten(h))\\circ T\\big)\\circ T\\Big)',
  d:'공간 attention 뒤에 시간 attention을 이어 붙여 전체 3D attention을 두 단계로 근사한다. flatten은 공간 차원 $H{\\times}W$ 를 한 축으로 접는 연산.'}
],

numbers:[
 {k:'MSR-VTT FID / CLIPSIM', v:'13.17 / 0.3049', d:'zero-shot 기준 CogVideo(영어, FID 23.59)를 큰 폭으로 앞섬'},
 {k:'UCF-101 FVD (fine-tune)', v:'81.25', d:'TATS-base(278±11) 대비 대폭 개선, 같은 세팅 zero-shot 대비도 큰 폭 향상'},
 {k:'사람 평가 · vs CogVideo', v:'품질 73~77% 선호', d:'DrawBench 200개 + 자체 수집 300개 프롬프트 기준'},
 {k:'학습 비디오', v:'WebVid-10M + HD-VILA-10M', d:'텍스트 없이 비디오만 사용 — CogVideo/VDM의 비공개 1000만 쌍과 대비'},
 {k:'프레임 구성', v:'16프레임 → 76프레임', d:'프레임 스킵 5의 마스킹 보간으로 확장'},
 {k:'평가 프롬프트', v:'300개 자체 수집 세트', d:'AMT로 5개 카테고리(동물·판타지·사람·자연·음식)에서 수집, 공개 예정'}
],

impact:'"텍스트-비디오 쌍이 있어야 T2V를 학습할 수 있다"는 당시의 암묵적 전제를 깼다. 이미지 생성 능력과 움직임 학습을 아키텍처 수준에서 분리함으로써, 이후 비디오 생성 연구 대부분이 **사전학습된 이미지 diffusion 모델에 시간 층만 추가로 얹는** 이 레시피를 그대로 물려받았다. [Video LDM](#/p/videoldm)이 같은 아이디어를 잠재 공간으로 옮겼고, 그 계보가 [Stable Video Diffusion](#/p/svd)까지 이어진다.',

legacy:[
 '**"이미지 능력 재사용 + 시간 층만 새로 학습"** 패턴이 [Video LDM](#/p/videoldm)·[SVD](#/p/svd)를 포함한 이후 T2V 연구의 표준 틀이 됨',
 '**Pseudo-3D 분해**(공간 처리 후 시간 처리를 별도 층으로 근사)가 3D conv/attention의 메모리 폭증을 피하는 표준 기법으로 자리잡음',
 '프레임 보간·초해상도를 별도 diffusion 모델로 캐스케이드하는 구조가 이후 고해상도·고프레임률 비디오 생성 파이프라인의 원형이 됨',
 '텍스트-비디오 쌍 없이 공개 데이터만으로 재현 가능하다는 점을 강조하며, 이후 연구들이 비공개 대규모 쌍 데이터 수집 경쟁 대신 공개 비디오 활용으로 방향을 트는 데 기여'
],

pitfalls:[
 '**FVD·IS 같은 자동 지표가 실제 지각 품질과 잘 맞지 않는다.** 이 논문도 UCF-101 FVD 평가가 16프레임(0.5초)이라는 비현실적으로 짧은 클립을 요구한다고 스스로 지적하며, 결국 AMT 사람 평가(품질·충실도 다수결)를 주 평가 수단으로 쓴다.',
 '**텍스트만으로는 학습할 수 없는 동작이 있다.** "손을 좌우로 흔든다"처럼 방향성이 비디오에서만 드러나는 현상은 정지 이미지-텍스트 쌍에서 배울 수 없다는 한계를 논문이 직접 인정한다.',
 '**해상도 체인이 길다.** 64×64 → 256×256 → 768×768로 이어지는 다단계 초해상도 때문에 각 단계의 오차가 누적될 수 있고, 최종 출력은 다시 512로 다운샘플링한다(논문 각주에서 "미래 과제"로 남김).'
],

figures:[
 {f:'fig2-pipeline.png', cap:'왼쪽부터: prior P가 텍스트를 이미지 임베딩으로 바꾸고, 시공간 디코더 D^t가 16프레임을 생성, 프레임 보간(초록)·시공간 초해상도(보라)·공간 초해상도(검정 SR_h)가 순서대로 이어진다. Fixed Noise 박스는 프레임 간 노이즈를 공유해 깜빡임을 줄이는 장치.',
  src:'원문 Figure 2, p.4'},
 {f:'fig3-pseudo3d.png', cap:'왼쪽: 2D conv(초록) 뒤에 1D 시간 conv가 붙는 구조, 점선 화살표가 항등 초기화를 뜻한다. 오른쪽: 공간 attention(빨강) 다음에 시간 attention(파랑)이 이어지고, 시간 투영이 0으로 초기화돼(우측 상단 "Projection k0=0") 학습 시작 시 항등 함수가 된다.',
  src:'원문 Figure 3, p.5'}
],

quotes:[
 {t:'Our intuition is simple: learn what the world looks like and how it is described from paired text-image data, and learn how the world moves from unsupervised video footage.',
  src:'Abstract, p.1'},
 {t:'it does not require paired text-video data',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2209.14792 — Make-A-Video', u:'https://arxiv.org/abs/2209.14792'},
 {t:'프로젝트 페이지 (make-a-video.github.io)', u:'https://make-a-video.github.io/'}
]
});
