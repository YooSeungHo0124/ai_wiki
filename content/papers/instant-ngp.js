WIKI.paper({
slug:'instant-ngp',
venue:'SIGGRAPH 2022 (ACM Trans. Graph.)',
authors:'Müller, Evans, Schied, Keller (NVIDIA)',
arxiv:'2201.05989',

tldr:'좌표를 신경망에 넣기 전에 **다중해상도 해시 테이블**로 인코딩해서, [NeRF](#/p/nerf) 학습을 몇 시간에서 **몇 초~몇 분**으로 줄인 논문. NeRF·SDF·2D 이미지 근사 등 여러 태스크에 그대로 쓰이는 범용 입력 인코딩이다.',

context:'[NeRF](#/p/nerf)는 좌표 $(x,y,z)$를 그대로 넣으면 거대한 MLP도 고주파 디테일을 못 배우기 때문에, sin/cos 주파수 인코딩으로 입력을 확장한 뒤 8층짜리 MLP에 통과시킨다. 이 MLP가 장면 전체의 디테일을 **혼자** 저장해야 해서 네트워크 한 번 호출(forward)이 무겁고, 픽셀 하나를 렌더링하려면 광선을 따라 수백 번 호출해야 한다. [Mip-NeRF](#/p/mip-nerf)를 포함해 이 계열은 학습에 시간 단위가 걸린다. 반대편에는 명시적 복셀 그리드에 특징을 저장하는 방법들이 있는데, 이들은 빠르지만 해상도를 올릴수록 메모리가 세제곱으로 늘어난다. 이 논문의 질문은 — **네트워크는 작게 유지하면서, 디테일은 어디에 저장할 것인가?**',

ideas:[
 {h:'다중해상도 해시 인코딩',
  lead:'좌표를 L개 해상도 격자에서 해시 테이블 특징 벡터로 조회해 MLP 입력을 만든다.',
  d:'입력 좌표 하나를 $L=16$개의 서로 다른 해상도 격자(가장 성긴 $N_{min}=16$부터 가장 세밀한 $N_{max}$까지 기하급수적으로 증가)에 동시에 걸친다고 본다. 각 해상도에서 좌표를 감싸는 격자 꼭짓점들의 정수 좌표를 해시해 테이블 인덱스를 얻고, 그 인덱스에 저장된 $F$차원 특징 벡터를 조회한 뒤 좌표 내 상대 위치로 선형보간한다. $L$개 레벨의 보간 결과를 이어붙인 것이 MLP의 실제 입력이 된다.'},
 {h:'해시 충돌을 풀지 않고 네트워크에 떠넘긴다',
  lead:'해시 테이블 크기를 격자 크기보다 작게 고정하고, 충돌 처리는 학습에 맡긴다.',
  d:'성긴 레벨은 격자 꼭짓점 수가 테이블 크기 $T$보다 작아 1:1로 매핑되지만, 세밀한 레벨은 꼭짓점 수가 $T$를 넘어서 **여러 좌표가 같은 해시 버킷을 공유**한다. 충돌을 해결하는 자료구조(트리, 체이닝)를 쓰는 대신 **아무 충돌 처리도 하지 않는다** — 충돌한 좌표들의 그래디언트는 평균으로 섞이고, 자주 쓰이는(장면 표면 근처의) 좌표가 경사하강으로 그 충돌을 자연스레 지배하게 둔다. 나머지 미세한 잔여 오차는 뒤에 붙는 작은 MLP가 흡수한다. 이 설계 덕분에 테이블 크기가 $O(T)$로 고정돼 메모리가 해상도에 무관해진다.'},
 {h:'작은 MLP + fully-fused CUDA 커널',
  lead:'인코딩이 디테일을 대신 저장하므로 MLP를 얕고 좁게 줄이고 커널을 통째로 융합한다.',
  d:'디테일 저장 책임이 해시 테이블로 옮겨갔으므로, 뒤따르는 MLP는 은닉층 몇 개짜리의 아주 작은 네트워크로 충분하다. 저자들은 이 작은 MLP의 모든 레이어를 하나의 CUDA 커널로 융합(fully-fused)해서, 레이어마다 GPU 메모리를 오가며 생기는 지연을 없앴다. 인코딩과 네트워크 양쪽의 최적화가 합쳐져 학습 스텝당 시간이 극도로 짧아진다.'},
 {h:'태스크에 무관한 범용 인코딩',
  lead:'같은 인코딩을 NeRF·SDF·기가픽셀 이미지·신경 방사 캐시에 그대로 재사용한다.',
  d:'이 인코딩은 NeRF의 좌표뿐 아니라 부호 거리 함수(SDF), 2D 기가픽셀 이미지 근사, 실시간 경로 추적의 신경 방사 캐시까지 **거의 같은 하이퍼파라미터**로 적용된다. 태스크마다 바꾸는 것은 사실상 해시 테이블 크기 $T$와 최대 해상도 $N_{max}$ 뿐이다.'}
],

diagram:{type:'flow', cap:'좌표 하나가 인코딩을 거쳐 MLP에 들어가는 다섯 단계(원문 Figure 3).',
 nodes:[
  {t:'좌표 x', s:'L개 해상도로 스캔', a:'해싱'},
  {t:'격자 꼭짓점 해싱', s:'정수좌표 → 해시', acc:true, a:'조회'},
  {t:'특징 벡터 조회', s:'테이블당 F차원'},
  {t:'선형 보간', s:'꼭짓점 → 좌표 위치', a:'연결'},
  {t:'레벨 연결', s:'L·F 차원으로 concat'},
  {t:'작은 MLP', s:'fully-fused CUDA'}
 ]},

math:[
 {expr:'h(x) = ( XOR_i x_i * pi_i ) mod T',
  tex:'h(\\mathbf{x}) = \\left(\\bigoplus_{i=1}^{d} x_i \\pi_i\\right) \\bmod T',
  d:'격자 꼭짓점의 정수 좌표 $\\mathbf{x}$를 해시 테이블 인덱스로 바꾸는 공간 해시 함수다. $\\pi_i$는 서로 다른 큰 소수(논문 값: $\\pi_1{=}1$, $\\pi_2{=}2654435761$, $\\pi_3{=}805459861$)이고 XOR로 차원 간 상관을 없앤다. 명시적 충돌 해결이 없다는 것이 핵심 설계다.'},
 {expr:'N_l = floor(N_min * b^l),  b = exp((ln N_max - ln N_min) / (L-1))',
  tex:'N_l := \\lfloor N_{min} \\cdot b^{\\,l} \\rfloor, \\qquad b := \\exp\\!\\left(\\frac{\\ln N_{max} - \\ln N_{min}}{L-1}\\right)',
  d:'$L$개 레벨의 해상도가 $N_{min}$에서 $N_{max}$까지 등비수열로 배치된다. 레벨 수가 많아 성장 인자 $b$는 보통 1.26~2 정도로 작다.'},
 {expr:'y = enc(x; theta) ∈ R^(L·F + E)',
  tex:'y = \\text{enc}(\\mathbf{x};\\theta) \\in \\mathbb{R}^{LF+E}',
  d:'$L$개 레벨의 보간된 특징(각 $F$차원)과 보조 입력 $\\xi \\in \\mathbb{R}^E$(시야 방향 등)를 이어붙인 것이 MLP $m(y;\\Phi)$의 실제 입력이다. 학습 가능한 파라미터는 인코딩 $\\theta$(해시 테이블 값)와 MLP 가중치 $\\Phi$ 둘 다이며, 손실의 그래디언트가 둘 다로 역전파된다.'}
],

numbers:[
 {k:'해시 인코딩 파라미터', v:'L=16, F=2, T=2^14~2^24', d:'레벨 수·특징 차원은 태스크 공통 고정, 테이블 크기 $T$와 최대 해상도만 태스크별 조정'},
 {k:'NeRF 학습 5초', v:'평균 PSNR 29.26 dB', d:'Synthetic-NeRF 8장면 평균, RTX 3090 1장 기준(Table 2)'},
 {k:'NeRF 학습 5분', v:'평균 PSNR 33.18 dB', d:'같은 GPU·같은 장면에서 [Mip-NeRF](#/p/mip-nerf)(수 시간, 33.09 dB)와 대등한 품질에 도달'},
 {k:'해시 vs 주파수 인코딩', v:'20~60배 학습 속도', d:'같은 구현에서 인코딩만 해시로 바꿨을 때의 속도 향상(품질은 유지)'},
 {k:'학습 스텝 비용', v:'약 6ms/step (RTX 3090)', d:'5분에 약 5만 스텝, 이 시점에 모델이 대체로 수렴'},
 {k:'기가픽셀 이미지', v:'4억 6천9백만 화소, PSNR 29.8dB', d:'20000×23466 이미지를 $T=2^{22}$ 해시 인코딩(파라미터 47.5M개, 입력 자유도의 3.4%)으로 근사(Figure 6)'}
],

impact:'NeRF류 방법을 "밤새 돌리는 오프라인 재구성"에서 "몇 초 안에 확인하는 대화형 도구"로 바꿨다. 작은 MLP + 해시 테이블 조합이 이후 거의 모든 빠른 NeRF 변종의 표준 입력 인코딩이 됐고, 동시에 해시 테이블이라는 아이디어 자체가 NeRF를 넘어 좌표 기반 신경 표현(SDF, 이미지, 방사 캐시) 전반의 공용 부품으로 자리잡았다. 학습 시간이 실무 병목에서 벗어나면서 이후 연구의 초점이 "어떻게 더 빨리 학습하나"에서 "어떻게 더 잘 편집·조작하나"로 옮겨가는 계기가 됐다.',

legacy:[
 '**빠른 방사장 계열의 표준 부품** — 이후 대부분의 실시간/준실시간 NeRF 변종이 이 해시 인코딩이나 그 변형을 입력 계층으로 채택',
 '**[3D Gaussian Splatting](#/p/3dgs)과의 경쟁 구도** — instant-ngp가 "암묵적 표현을 빠르게" 밀어붙인 반면, 3DGS는 아예 명시적 표현으로 갈아타 실시간 렌더링까지 달성하며 같은 문제를 다른 방향에서 풂',
 '**tiny-cuda-nn 라이브러리** — fully-fused MLP·해시 인코딩 구현이 공개 라이브러리로 분리돼 다른 연구의 기반 부품이 됨',
 '**학습 없는 충돌 처리라는 발상의 확산** — "명시적으로 풀지 말고 경사하강이 알아서 흡수하게 둔다"는 설계 철학이 이후 다른 공간 자료구조 연구에도 참조됨'
],

pitfalls:[
 '**"해시 충돌이 없다"가 아니라 "해시 충돌을 방치한다"이다.** 세밀한 레벨에서는 여러 좌표가 실제로 같은 버킷을 공유하며, 품질은 그 충돌을 MLP와 최적화가 얼마나 잘 흡수하는지에 달려 있다 — 무결점 해시가 아니다.',
 '**5초/5분 수치를 GPU·장면 조건 없이 인용하지 말 것.** 논문 수치는 전부 **RTX 3090 1장, Synthetic-NeRF 8장면 평균** 기준이다. 다른 GPU·다른 장면에서는 절대 시간이 달라진다.',
 '**작은 MLP는 트레이드오프이지 공짜가 아니다.** Materials처럼 시야 방향에 따라 크게 변하는 복잡한 반사가 있는 장면에서는 MLP를 줄인 대가로 [Mip-NeRF](#/p/mip-nerf)·NSVF보다 오히려 품질이 낮다고 원문이 직접 보고한다.'
],

figures:[
 {f:'fig3-hash-encoding.png',
  cap:'2D 예시. 빨강·파랑 두 해상도 격자에서 좌표 x를 감싸는 꼭짓점을 해싱(1)해 테이블을 조회(2)하고, 좌표 내 상대위치로 보간(3)한 뒤 레벨끼리 이어붙여(4) MLP에 넣는다(5). 격자선이 성긴 레벨(적음)과 촘촘한 레벨(많음)이 같은 크기의 해시 테이블을 공유한다는 점이 이 그림의 핵심.',
  src:'원문 Figure 3, p.4'},
 {f:'fig4-speed-quality.png',
  cap:'x축이 학습 시간(초), y축이 PSNR. 해시 테이블 크기 $T$를 바꿔가며 그린 여러 곡선이 수 초 만에 급격히 올라간 뒤 평평해지는 모양을 보라 — "몇 시간"이 아니라 "몇 초" 스케일의 수렴 곡선이라는 것이 이 논문의 핵심 증거.',
  src:'원문 Figure 4, p.5'}
],

quotes:[
 {t:'We reduce this cost with a versatile new input encoding that permits the use of a smaller network without sacrificing quality, thus significantly reducing the number of floating point and memory access operations.',
  src:'Abstract, p.1'},
 {t:'There is no explicit collision handling. We rely instead on the gradient-based optimization to store appropriate sparse detail in the array, and the subsequent neural network m(y; Φ) for collision resolution.',
  src:'Section 3, p.4'}
],

links:[
 {t:'arXiv 2201.05989 — Instant Neural Graphics Primitives', u:'https://arxiv.org/abs/2201.05989'},
 {t:'NVIDIA 공식 프로젝트 페이지', u:'https://nvlabs.github.io/instant-ngp/'},
 {t:'tiny-cuda-nn (공식 구현 라이브러리)', u:'https://github.com/NVlabs/tiny-cuda-nn'}
]
});
