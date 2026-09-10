WIKI.paper({
slug:'swinir',
venue:'ICCVW 2021',
authors:'Liang et al. (ETH Zürich · KU Leuven)',
arxiv:'2108.10257',

tldr:'[Swin Transformer](#/p/swin)를 초해상·잡음 제거·JPEG 아티팩트 제거에 그대로 적용해, CNN 계열 SOTA보다 파라미터를 최대 67% 줄이면서도 PSNR을 0.14~0.45dB 더 올렸다. 복원 과제에서도 "패치 단위 전역 attention"이 아니라 "윈도우 지역 attention + shift"가 통한다는 것을 보였다.',

context:'2021년까지 초해상·복원은 여전히 CNN이 지배적이었다. 합성곱은 두 가지 근본적 한계가 있다 — (1) 커널이 위치와 무관하게 동일해서(content-independent) 이미지 영역마다 다른 처리를 하기 어렵고, (2) 지역 연산이라 장거리 의존성을 모델링하려면 층을 아주 깊게 쌓아야 한다. IPT처럼 표준 [Transformer](#/p/transformer)를 복원에 적용한 시도도 있었지만, 이미지를 48×48 같은 고정 패치로 잘라 **패치 단위로만** attention을 계산해 패치 경계에 아티팩트가 남았고, 1억 파라미터·110만 장 규모의 데이터가 있어야 성능이 나왔다. SwinIR은 이 절충을 [Swin Transformer](#/p/swin)의 윈도우 지역 attention으로 다시 짠다.',

ideas:[
 {h:'얕은 특징 + 깊은 특징의 이중 경로',
  lead:'conv 한 층으로 저주파를 바로 전달하고, Transformer 블록들은 고주파 복원에만 집중시킨다.',
  d:'입력을 3×3 conv 한 층으로 얕은 특징 $F_0$을 뽑아 재구성 모듈로 **직접** 넘긴다. 동시에 $F_0$을 K개의 RSTB(아래)에 통과시켜 깊은 특징 $F_{DF}$를 뽑는다. 마지막에 $F_0+F_{DF}$를 합쳐 복원하므로, 저주파 정보는 손실 없이 유지되고 Transformer 블록들은 고주파 디테일 복원에만 집중할 수 있다.'},
 {h:'RSTB: Swin 블록을 residual로 묶고 conv로 마무리한다',
  lead:'Swin Transformer Layer 여러 개를 residual block처럼 묶고 conv 한 층으로 지역 특징을 보강한다.',
  d:'RSTB(Residual Swin Transformer Block)는 STL(Swin Transformer Layer)을 L개 쌓은 뒤 conv 한 층을 더하고 residual 연결로 감싼다. conv를 추가한 이유는 두 가지다 — attention만으로는 위치 불변(translation invariance) 귀납 편향이 약한데 conv가 이를 보강하고, residual 경로가 서로 다른 깊이의 특징을 재구성 모듈까지 직접 전달하는 지름길을 만든다.'},
 {h:'윈도우 지역 attention + shift로 전역 문맥을 확보한다',
  lead:'고정 패치 대신 겹치는 윈도우로 attention을 계산해 경계 아티팩트와 파라미터 폭증을 동시에 피한다.',
  d:'STL은 [Swin Transformer](#/p/swin)와 동일하게 이미지를 겹치지 않는 로컬 윈도우로 나눠 그 안에서만 self-attention을 계산하고, 층마다 윈도우 경계를 절반씩 어긋나게(shift) 배치해 윈도우 간 정보 교환을 만든다. IPT식 고정 패치 attention과 달리 윈도우가 이미지 전체를 겹침 없이 덮으므로 패치 경계 아티팩트가 생기지 않는다.'},
 {h:'과제별로 재구성 모듈만 바꾼다',
  lead:'특징 추출 모듈은 그대로 두고 업샘플링 유무·손실 함수만 과제에 맞게 교체한다.',
  d:'초해상은 sub-pixel conv로 업샘플링하며 $L_1$ 손실(또는 실세계 SR은 GAN+지각 손실 추가)을, 잡음 제거·JPEG 아티팩트 제거는 업샘플링 없이 conv 한 층과 Charbonnier 손실을 쓴다. 세 과제 모두 얕은/깊은 특징 추출 모듈은 완전히 동일해서, 하나의 백본으로 복원 과제 전반을 커버한다는 것이 이 논문의 실용적 기여다.'}
],

diagram:{type:'stack', cap:'SwinIR 전체 구조. 얕은 특징이 재구성 모듈로 바로 이어지는 우회 경로(residual)가 핵심.',
 layers:[
  {t:'입력 LQ 이미지', s:'H×W×C_in'},
  {t:'얕은 특징 추출', s:'conv 3×3 → F_0'},
  {t:'RSTB × K', s:'STL 여러 개 + conv', acc:true, note:'윈도우 지역 attention'},
  {t:'conv', s:'F_K → F_DF'},
  {t:'특징 합산', s:'F_0 + F_DF'},
  {t:'HQ 재구성', s:'sub-pixel conv (SR만)'}
 ]},

math:[
 {expr:'F_i,out = H_CONVi(F_i,L) + F_i,0',
  tex:'F_{i,out} = H_{CONV_i}(F_{i,L}) + F_{i,0}',
  d:'RSTB 내부: STL을 L번 통과시킨 특징 $F_{i,L}$에 conv를 적용한 뒤, 블록 입력 $F_{i,0}$과 다시 더한다. 이 residual 덕분에 서로 다른 깊이의 특징이 재구성 모듈까지 손실 없이 전달된다.'},
 {expr:'L(SR) = ||I_RHQ − I_HQ||_1 ,  L(denoise/JPEG) = sqrt(||I_RHQ − I_HQ||² + ε²)',
  tex:'\\mathcal{L}_{SR}=\\|I_{RHQ}-I_{HQ}\\|_1,\\qquad \\mathcal{L}_{denoise}=\\sqrt{\\|I_{RHQ}-I_{HQ}\\|^2+\\epsilon^2}',
  d:'초해상은 단순 $L_1$ 픽셀 손실을, 잡음 제거·JPEG 압축 복원은 미분 가능한 절댓값 근사인 Charbonnier 손실($\\epsilon=10^{-3}$)을 쓴다.'}
],

numbers:[
 {k:'Set5 ×2 PSNR', v:'38.42dB (DIV2K+Flickr2K)', d:'같은 조건 RCAN 대비 near-SOTA, IPT(38.37dB)보다 높음'},
 {k:'Urban100 ×4 PSNR', v:'27.07dB', d:'동일 데이터 RCAN(26.82dB)·HAN(26.85dB) 대비 개선'},
 {k:'IPT 파라미터', v:'115.5M · 이미지 110만 장', d:'SwinIR 대비 데이터·모델 규모가 훨씬 크지만 PSNR은 대등하거나 낮음'},
 {k:'파라미터 절감', v:'최대 67%', d:'동급 CNN 모델 대비, 과제에 따라 편차 있음'},
 {k:'성능 개선폭', v:'0.14~0.45dB', d:'세 과제(SR·잡음 제거·JPEG) 전반에서 기존 SOTA 대비'}
],

impact:'"attention이 통하려면 데이터와 파라미터가 아주 커야 한다"는 IPT식 통념을 깼다 — 윈도우 지역 attention이라는 귀납 편향 설계만으로 복원 과제에서 적은 파라미터로도 CNN을 이겼다. 복원 백본을 초해상·잡음 제거·JPEG 아티팩트 제거에 **동일한 구조로** 적용할 수 있다는 것을 보여, 이후 복원 연구가 과제별 아키텍처 대신 공용 Transformer 백본 위에서 손실·헤드만 바꾸는 방향으로 수렴하는 계기가 됐다.',

legacy:[
 '**[Real-ESRGAN](#/p/real-esrgan)과 나란히 실세계 복원의 두 축(CNN vs Transformer)을 대표** — 같은 시기 발표돼 서로 비교 대상이 된다',
 '**복원용 Transformer 백본의 표준** — 이후 SwinIR 구조를 그대로 가져가거나 변형한 복원 모델이 다수 등장',
 '**"윈도우 지역 attention이 저수준 비전에도 통한다"는 선례** — Swin의 계층적 attention이 분류를 넘어 dense prediction 전반에 적용 가능함을 재확인',
 '**공용 백본 + 과제별 헤드 패턴의 정착** — 재구성 모듈만 바꿔 여러 복원 과제를 커버하는 설계가 이후 논문의 기본 형식이 됨'
],

pitfalls:[
 '**"항상 CNN보다 좋다"가 아니라 파라미터 대비 효율이 좋다는 것.** 같은 파라미터 규모에서 절대 PSNR 1위가 아닌 벤치마크·배율 조합도 있다 — Set5/Set14/Urban100/Manga109을 배율(×2/×3/×4)별로 따로 봐야 한다.',
 '**클래식 SR 설정 자체가 bicubic 다운샘플링 가정이다.** [Real-ESRGAN](#/p/real-esrgan)식 실세계 저품질에는 별도의 실세계 SR 설정(GAN+지각 손실)을 써야 하며, 논문 본문의 주요 표는 이상적인 bicubic 열화 기준이다.',
 '**윈도우 크기·shift 설정이 성능에 민감하다.** 과제(SR vs JPEG 아티팩트 제거)에 따라 윈도우 크기를 다르게 썼다는 점을 옮겨 쓸 때 놓치기 쉽다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'전체 구조(위)와 내부 두 블록(아래). RSTB(왼쪽 아래)는 STL 여러 개 뒤에 conv를 붙인 residual block, STL(오른쪽 아래)은 LayerNorm→MSA→LayerNorm→MLP를 각각 residual로 감싼 표준 Transformer 층.',
  src:'원문 Figure 2, p.3'},
 {f:'fig2-psnr-vs-params.png',
  cap:'Set5 ×4 기준 PSNR(y축) 대 파라미터 수(x축). SwinIR(빨간 별)이 왼쪽 위(적은 파라미터·높은 PSNR)에 위치해, 오른쪽의 IPT(1.15억 파라미터)와 비슷한 PSNR을 훨씬 적은 파라미터로 달성했음을 한눈에 보여준다.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'Experimental results demonstrate that SwinIR outperforms state-of-the-art methods on different tasks by up to 0.14~0.45dB, while the total number of parameters can be reduced by up to 67%.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2108.10257 — SwinIR', u:'https://arxiv.org/abs/2108.10257'},
 {t:'GitHub — JingyunLiang/SwinIR', u:'https://github.com/JingyunLiang/SwinIR'}
]
});
