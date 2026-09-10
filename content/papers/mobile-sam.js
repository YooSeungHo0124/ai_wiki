WIKI.paper({
slug:'mobile-sam',
venue:'arXiv 2023',
authors:'Zhang et al. (Kyung Hee University)',
arxiv:'2306.14289',

tldr:'[SAM](#/p/sam)의 무거운 ViT-H 이미지 인코더 하나만 지식 증류로 통째로 바꾼 논문. 프롬프트 기반 구조와 mask decoder는 SAM 원본 그대로 두고, 인코더 파라미터를 632M→5.78M로 줄여 모바일에서 쓸 수 있게 만들었다.',

context:'SAM은 이미지 인코더(ViT-H, 632M)와 prompt-guided mask decoder(3.87M) 두 부분으로 나뉜다. 공식 데모가 보여주듯 이미지 임베딩만 미리 만들어 두면 mask decoder는 가벼워서 엣지 기기에서도 돌아가지만, 그 임베딩을 만드는 인코더 자체가 전체 연산의 대부분을 차지한다. [SAM](#/p/sam) 저자들도 ViT-L·ViT-B로 축소한 버전을 제시했지만, 이들도 원래 학습 파이프라인 그대로 SA-1B 전체를 128개 GPU로 며칠씩 재학습해야 만들 수 있었다. 이 논문의 질문은 "굳이 SAM 전체를 처음부터 다시 학습해야 하는가, 인코더만 따로 떼어 바꿀 수는 없는가"이다.',

ideas:[
 {h:'디커플드 증류: 인코더만 떼어 증류한다',
  lead:'mask decoder는 그대로 얼리고, ViT-H가 만드는 이미지 임베딩만 작은 인코더가 모방하게 학습한다.',
  d:'인코더와 decoder를 한 쌍으로 묶어 focal loss·dice loss로 같이 학습하면(coupled), 둘 다 부실한 상태에서 서로에게 의존하는 최적화라 수렴이 어렵다. 이 논문은 decoder를 아예 학습 루프에서 빼 버리고, 작은 인코더가 ViT-H 인코더와 **같은 이미지 임베딩**을 내도록 단순 MSE loss로만 증류한다. mask decoder는 SAM 원본을 복사해 그대로 쓰거나(옵션으로 미세조정도 가능) 완전히 고정해도 된다.'},
 {h:'왜 decoder를 묶으면 더 어려운가',
  lead:'decoder를 학습 루프에 넣으면 프롬프트가 매번 랜덤이라 최적화 목표 자체가 흔들린다.',
  d:'먼저 인코더+decoder를 함께 학습하는 fully-coupled 방식과, decoder를 원본 그대로 얼려서 인코더만 학습하는 semi-coupled 방식을 비교했다. semi-coupled조차도 매 스텝 프롬프트(점·박스)가 무작위로 바뀌어 decoder의 출력이 계속 변하는 타깃이 되고, 이는 인코더 학습을 더 어렵게 만든다. 그래서 decoder를 아예 계산에서 제외하고 **이미지 임베딩 자체**를 증류 타깃으로 삼는 완전 디커플드 방식으로 옮겨간다.'},
 {h:'작은 GPU 예산으로도 충분하다',
  lead:'SA-1B 11M장의 0.1%(1.1만 장)·GPU 2대·55k 스텝만으로 coupled 방식보다 나은 mIoU를 얻는다.',
  d:'디커플드 증류를 ViT-B 학생 인코더로 예비 검증한 결과, SA-1B 전체(11M장)를 128 GPU·180k 스텝으로 coupled 학습한 것보다 **1% 미만의 연산량**(2 GPU·11K장·55k 스텝)으로도 teacher-student mIoU가 0.72→0.75로 더 좋았다. 인코더 임베딩만 맞추면 되므로 이미지 임베딩을 미리 한 번 계산해 캐싱해두고 재사용할 수 있어 학습이 더 빨라진다.'},
 {h:'실제 학생 인코더는 TinyViT',
  lead:'ViT-B(86M)도 모바일엔 부담이라 5M 파라미터의 TinyViT로 최종 인코더를 만든다.',
  d:'ViT-B로 개념 검증을 마친 뒤, 실제 배포용 학생 인코더로는 합성곱 블록(초반 2단계)과 transformer 블록(후반 2단계)을 섞은 TinyViT를 쓴다. ImageNet-1K에서 비슷한 크기의 DeiT-Tiny(72.2%)보다 TinyViT(79.1%)가 더 정확해 선택했다. 마지막 다운샘플링 stride를 1로 바꿔 최종 해상도를 ViT-H 인코더 출력과 맞춘 것만 원 TinyViT 설계에서 바꿨다.'}
],

diagram:{type:'compare', cap:'SAM을 가볍게 만드는 두 갈래 길. MobileSAM은 프롬프트 구조를 유지한 채 인코더만 증류로 바꾸고, [FastSAM](#/p/fastsam)은 파이프라인 자체를 검출 기반으로 바꾼다.',
 left:{t:'FastSAM: 구조 교체', items:['YOLOv8-seg로 전체 인스턴스 먼저 분할','프롬프트는 사후 선택 기준일 뿐','원본 SAM 구조와 완전히 다른 파이프라인']},
 right:{t:'MobileSAM: 부분 증류', items:['프롬프트 기반 구조는 SAM과 동일','ViT-H 인코더만 5.78M 학생으로 교체','mask decoder는 원본 그대로 재사용', 'FastSAM 대비 7배 작고 5배 빠름']}},

math:[
 {expr:'L = || E_teacher(x) - E_student(x) ||²  (MSE, focal/dice loss 불필요)',
  tex:'\\mathcal{L}_{\\text{distill}} = \\left\\lVert E_{\\text{ViT\\text{-}H}}(x) - E_{\\text{student}}(x) \\right\\rVert_2^2',
  d:'teacher(ViT-H)와 student 인코더가 같은 이미지 $x$ 에서 뽑은 임베딩 사이의 단순 MSE. mask를 직접 예측하는 게 아니라 **임베딩 자체를 맞추는** 목적함수라서 SAM 원래 학습에 쓰던 focal loss·dice loss 조합이 필요 없다.'}
],

numbers:[
 {k:'인코더 파라미터', v:'632M → 5.78M', d:'ViT-H(SAM) 대비 **약 100배** 축소, TinyViT 학생 기준'},
 {k:'전체 파라미터', v:'632M → 9.66M', d:'인코더+decoder+prompt encoder 합계, SAM 대비 **약 60배** 축소'},
 {k:'인코더 추론 속도', v:'452ms → 8ms', d:'단일 GPU 기준(원문에 GPU 모델명 미기재), decoder 포함 총 약 10ms(인코더 8ms+decoder 4ms 근사)'},
 {k:'학습 자원', v:'GPU 2대 · 1.1만 장 · 55k 스텝', d:'SA-1B의 0.1%만 사용, 단일 GPU로 하루 이내 재현 가능'},
 {k:'teacher-student mIoU', v:'0.75 (디커플드) vs 0.72 (coupled)', d:'같은 프롬프트 점에서 ViT-H 마스크와 비교, coupled 대비 연산량 1% 미만으로 더 높은 값'},
 {k:'FastSAM 대비', v:'크기 7배 작음 · 속도 5배 빠름', d:'MobileSAM 9.66M/12ms vs [FastSAM](#/p/fastsam) 68M/64ms(segment-everything mIoU도 MobileSAM이 큰 차이로 우세)'}
],

impact:'SAM 경량화를 "처음부터 다시 학습"이 아니라 "이미 학습된 teacher의 임베딩을 흉내내는 증류"로 바꿔, 단일 GPU·하루 안에 재현 가능한 문제로 낮췄다. 구조 자체를 유지했기 때문에 SAM 생태계의 프롬프트 인터페이스·downstream 파이프라인(Grounded-SAM 등)이 인코더 교체만으로 그대로 재사용된다. 이후 [지식 증류](#/p/distillation)로 대형 vision foundation model을 가볍게 만드는 후속 작업들의 참조점이 됐다.',

legacy:[
 '**mobile SAM 계열 경쟁** — 같은 문제를 다른 방식(검출 기반 재설계)으로 푼 [FastSAM](#/p/fastsam)과 함께 "SAM 경량화"라는 하위 분야를 열었다',
 '**증류 타깃의 단순화** — mask 예측이 아니라 임베딩 자체를 맞추는 방식이 이후 vision backbone 경량화 작업에서 반복 채택됐다',
 '**모바일 SAM 배포** — ONNX/Core ML 변환, 모바일 앱(iOS 데모 포함) 등 실제 온디바이스 세그멘테이션 응용의 출발점이 됐다',
 '**SAM 2 이전의 과도기 해법** — 이후 [SAM 2](#/p/sam2)가 비디오까지 아우르는 새 아키텍처로 등장하기 전, 정적 이미지 SAM을 가볍게 쓰는 실무 표준 중 하나로 자리잡았다'
],

pitfalls:[
 '**FastSAM과 혼동하기 쉽다.** FastSAM은 파이프라인 자체를 YOLOv8-seg 기반으로 바꾼 "구조 교체"이고, MobileSAM은 SAM의 프롬프트 구조·mask decoder를 그대로 두고 **인코더만 증류로 교체**한 것이다. 속도·크기 수치가 비슷한 범주라 같은 접근이라고 오해하기 쉽지만 근본적으로 다른 해법이다.',
 '**mIoU 비교의 기준이 "원본 SAM 마스크"라는 점을 놓치기 쉽다.** 논문의 mIoU 수치는 사람이 라벨링한 정답이 아니라 ViT-H 원본 SAM이 만든 마스크를 기준으로 한 것이다. MobileSAM이 원본 SAM을 얼마나 잘 흉내내는지의 지표이지, 절대적인 분할 정확도 지표가 아니다.',
 '**속도 수치에 GPU 모델명이 안 붙어 있다.** 원문 Table 3의 8ms/452ms 비교는 "단일 GPU" 라고만 적혀 있고 정확한 GPU 모델은 명시되지 않는다. 다른 논문·벤치마크와 절대 수치를 직접 비교할 때 주의해야 한다.'
],

figures:[
 {f:'fig1-sam-overview.png',
  cap:'SAM의 구조를 파라미터 수로 그대로 보여준다. 이미지 인코더(632M, Heavyweight)가 이미지 임베딩을 만들고, prompt encoder(0.006M)와 mask decoder(3.87M)는 Lightweight로 표시돼 있다 — MobileSAM이 손대는 곳은 왼쪽 초록 상자 하나뿐이다.',
  src:'원문 Figure 1, p.2'},
 {f:'fig3-decoupled-distillation.png',
  cap:'위쪽 ViT-based(large)가 teacher, 아래 ViT-based(small)가 학생. 빨간 화살표(distillation)가 mask decoder를 거치지 않고 image embedding 단계에서 바로 걸린다는 것이 핵심 — 오른쪽 점선 박스(mask decoder)는 "Finetuning (optional)"이라 아예 학습에서 빠질 수 있다.',
  src:'원문 Figure 3, p.4'}
],

quotes:[
 {t:'The resulting MobileSAM reduces the encoder parameters by 100 times and total parameters by 60 times yet. Surprisingly, such a lightweight MobileSAM performs on par with the original heavyweight SAMs.',
  src:'Introduction, p.1-2'},
 {t:'It is worth highlighting that our MobileSAM is around 5 times faster and 7 times smaller than the concurrent FastSAM, while achieving superior performance.',
  src:'Introduction, p.2'}
],

links:[
 {t:'arXiv 2306.14289 — Faster Segment Anything: Towards Lightweight SAM for Mobile Applications', u:'https://arxiv.org/abs/2306.14289'},
 {t:'MobileSAM GitHub', u:'https://github.com/ChaoningZhang/MobileSAM'}
]
});
