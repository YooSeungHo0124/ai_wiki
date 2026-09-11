WIKI.paper({
slug:'movie-gen',
venue:'Technical Report 2024 (Meta)',
authors:'The Movie Gen team @ Meta',
arxiv:'2410.13720',

tldr:'텍스트-영상·오디오·편집·개인화를 하나의 파운데이션 모델 묶음으로 학습시킨 Meta의 30B 규모 보고서. 새로운 알고리즘 하나를 제안하기보다, **어떤 조합의 설계·데이터·학습 레시피가 실제로 사람 평가에서 이기는지**를 산업 규모에서 검증해 공개했다는 것이 이 문서의 가치다.',

context:'2024년 초까지 텍스트-투-비디오 모델은 [imagen-video](#/p/imagen-video)처럼 cascaded diffusion으로 저해상도→고해상도를 순차 보간하거나, 짧고 낮은 화질의 클립 생성에 머물러 있었다. 이미지 쪽에서는 [LDM](#/p/ldm) 계열이 이미 잠재공간 diffusion으로 고해상도를 실용 속도로 뽑아냈지만, 시간 축이 추가되는 비디오는 토큰 수가 폭증해 같은 레시피를 그대로 스케일업하기 어려웠다. Movie Gen은 이 문제에 새 구조를 발명하는 대신 **LLaMa3 스타일 transformer 백본 + flow matching + 강한 시공간 압축 오토인코더**라는, 개별로는 이미 알려진 조합을 30B까지 밀어붙이면 무엇이 되는지 확인한다. 목표는 알고리즘 혁신이 아니라 **재현 가능한 스케일링 레시피**를 만드는 것이다.',

ideas:[
 {h:'이미지와 비디오를 한 모델의 같은 토큰으로 취급',
  lead:'이미지를 프레임 1개짜리 비디오로 보고 하나의 joint 모델로 text-to-image/video를 함께 학습한다.',
  d:'페어링된 이미지-텍스트 데이터가 비디오-텍스트 데이터보다 훨씬 풍부하고 다양하다. Movie Gen Video는 이미지를 "프레임이 1개인 비디오"로 취급해 같은 모델이 이미지·비디오 생성을 함께 배우게 하고, 256px 이미지 사전학습 → 256~768px 이미지+비디오 공동학습 → 고품질 비디오로 미세조정하는 단계적 레시피를 쓴다. 공동학습이 비디오 단독 학습보다 일반화가 좋다는 것이 저자들의 관찰이다.'},
 {h:'TAE: 8×8×8 시공간 압축 오토인코더',
  lead:'시간·공간 세 축 모두 8배 압축해 긴 고해상도 비디오도 transformer가 감당할 토큰 수로 줄인다.',
  d:'[LDM](#/p/ldm)의 이미지 오토인코더 구조를 비디오로 "부풀려"(inflate) 2D conv 뒤에 1D 시간 conv를, 2D attention 뒤에 1D 시간 attention을 추가한 TAE(Temporal AutoEncoder)를 새로 학습한다. $T\\times3\\times H\\times W$ 픽셀 비디오를 $T/8\\times C\\times H/8\\times W/8$ 잠재로 압축하며 채널 $C=16$ 을 씀으로써, 별도의 프레임 보간 모델 없이도 원본 프레임레이트의 긴 비디오를 직접 인코딩·생성할 수 있게 했다.'},
 {h:'Flow matching으로 30B까지 스케일',
  lead:'[Flow Matching](#/p/flow-matching) 목표로 LLaMa3 백본을 30B 파라미터·73K 비디오 토큰 컨텍스트까지 학습한다.',
  d:'생성 목표는 diffusion 대신 [Flow Matching](#/p/flow-matching)을 쓰고, 백본은 [LLaMa3](#/p/llama3) 아키텍처(RMSNorm, [SwiGLU](#/p/glu-variants))를 그대로 가져와 이미지·비디오 생성에 맞게 조정한다. 최대 모델은 30B 파라미터, 최대 컨텍스트 73K 비디오 토큰으로, 4~16초 길이의 768×768 비디오를 다양한 종횡비(1:1, 9:16, 16:9)로 직접 생성한다. 별도의 Spatial Upsampler(7B)가 이를 1080p까지 올린다.'},
 {h:'선형-이차 시간 스케줄로 추론을 압축',
  lead:'초반 diffusion step은 촘촘히, 후반은 성기게 밟는 스케줄로 추론 단계 수를 줄인다.',
  d:'추론 시 노이즈 제거 궤적 초반(구조가 크게 바뀌는 구간)은 시간 간격을 촘촘하게, 구조가 이미 정해진 후반부는 성기게 밟는 linear-quadratic 시간 스케줄을 도입했다. transformer block의 입출력 변화량을 관찰해 이 비대칭이 실제로 존재함을 확인하고, 이를 이용해 적은 추론 스텝으로도 품질을 유지한다.'},
 {h:'개인화·편집은 사전학습 모델의 후속 미세조정',
  lead:'같은 30B 백본을 인물 이미지 조건, 명령어 기반 편집으로 각각 미세조정해 별도 태스크로 확장한다.',
  d:'Personalized Movie Gen은 사람 이미지를 추가 조건으로 넣어 그 인물이 등장하는 비디오를 생성하도록 미세조정한 버전이고, Movie Gen Edit은 텍스트 명령으로 기존 비디오를 국소적으로 편집하도록 학습한 버전이다. 둘 다 새 아키텍처가 아니라 **동일한 사전학습 파운데이션 모델의 후속 학습 단계**로 자리매김된다.'}
],

diagram:{type:'flow', cap:'Movie Gen Video의 4단계 학습 레시피. 이미지로 시작해 점점 더 크고 긴 비디오로, 이후 세 방향(개인화·편집·미세조정)으로 갈라진다.',
 nodes:[
  {t:'텍스트→이미지', s:'256px 사전학습'},
  {t:'이미지+비디오', s:'256→768px, 16s'},
  {t:'고품질 미세조정', s:'768px 비디오'},
  {t:'후속 태스크', s:'개인화 · 편집', acc:true}
 ]},

math:[
 {expr:'X_t = (1-t) X_0 + t X_1,   v_θ(X_t, t) ≈ X_1 - X_0',
  tex:'X_t=(1-t)X_0+t\\,X_1,\\qquad v_\\theta(X_t,t)\\approx X_1-X_0',
  d:'Flow matching 학습 목표. $X_0$ 는 가우시안 노이즈, $X_1$ 은 TAE로 인코딩된 실제 이미지·비디오 잠재.'}
],

numbers:[
 {k:'최대 모델', v:'30B 파라미터', d:'Movie Gen Video 파운데이션 모델'},
 {k:'컨텍스트 길이', v:'최대 73K 비디오 토큰', d:'긴 고해상도 비디오를 한 번에 처리'},
 {k:'생성 해상도·길이', v:'768×768px · 4~16초', d:'Spatial Upsampler(7B)로 1080p까지 확장'},
 {k:'TAE 압축비', v:'8×8×8', d:'시간·가로·세로 세 축 모두 8배'},
 {k:'TAE 채널', v:'C=16', d:'채널을 늘릴수록 재구성·생성 품질이 함께 개선됨을 확인'},
 {k:'평가 방식', v:'사람 평가 (net win rate)', d:'Runway Gen3·LumaLabs·Sora·Kling1.5와 비교, [-100,100] 범위'}
],

impact:'Movie Gen은 30B급 비디오 파운데이션 모델의 아키텍처·데이터·학습 절차를 상세히 공개한 보고서로서, 텍스트-투-비디오 연구가 소규모 실험 논문 단계를 지나 **산업 규모 레시피 공유**로 넘어가는 계기 중 하나가 되었다. 특히 이미지-비디오 공동학습, TAE의 채널 확장, linear-quadratic 스케줄 같은 공학적 디테일이 이후 오픈소스 프로젝트들의 참고 자료가 되었다. 다만 모델 가중치나 학습 코드는 공개되지 않았고, 성능 비교의 핵심 근거는 대부분 자동 지표가 아닌 **사람 평가**라는 점을 함께 봐야 한다.',

legacy:[
 '이미지-비디오 joint 학습과 TAE 설계가 [hunyuan-video](#/p/hunyuan-video) 등 후속 오픈 모델의 설계 논의에서 비교 기준으로 인용됨',
 '**LLaMa3 백본 + [Flow Matching](#/p/flow-matching)** 조합이 이후 비디오 생성 모델들에서 반복되는 표준 조합 중 하나로 자리잡음',
 '사람 평가 기반 net win rate 비교 방법론이 비디오 생성 모델 벤치마킹의 참고 형식이 됨',
 '개인화·편집을 별도 아키텍처가 아니라 후속 미세조정으로 설계하는 방식이 이후 상용 비디오 생성 서비스의 일반적 패턴이 됨'
],

pitfalls:[
 '**이 보고서는 오픈 웨이트 공개가 아니다.** 아키텍처·데이터·레시피는 상세히 기술되어 있지만 모델 가중치·학습 코드·데이터셋은 공개되지 않았고, 재현은 문서에 의존해야 한다.',
 '**핵심 비교 지표가 사람 평가(net win rate)라는 점을 놓치기 쉽다.** GenEval·FVD 같은 자동 지표 위주로 이 논문을 인용하면 실제 보고 내용과 어긋난다.',
 '**"30B 파라미터"는 TAE·텍스트 인코더를 제외한 transformer 본체만의 수치다.** 전체 파이프라인(업샘플러 7B 포함)은 이보다 훨씬 크다.'
],

figures:[
 {f:'fig3-pipeline.png',
  cap:'왼쪽 상단이 사람이 준 텍스트 프롬프트, 왼쪽 하단이 가우시안 노이즈. 둘 다 TAE 인코더로 압축된 잠재공간에서 Nx Transformer Blocks(가운데)가 timestep과 cross-attention으로 UL2/Long-prompt MetaCLIP/ByT5 세 텍스트 인코더의 조건을 받아 처리하고, 오른쪽 TAE 디코더가 최종 이미지/비디오를 복원한다.',
  src:'원문 Figure 3, p.5'}
],

quotes:[
 {t:'Our foundation text-to-video generation model, Movie Gen Video, consists of 30B parameters, while our largest foundation model is trained jointly on images and videos.',
  src:'p.1'}
],

links:[
 {t:'arXiv 2410.13720 — Movie Gen', u:'https://arxiv.org/abs/2410.13720'},
 {t:'Meta AI — Movie Gen', u:'https://ai.meta.com/research/movie-gen/'}
]
});
