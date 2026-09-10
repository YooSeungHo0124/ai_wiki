WIKI.paper({
slug:'ibot',
venue:'ICLR 2022',
authors:'Zhou et al. (ByteDance · Johns Hopkins · SJTU · UC Santa Cruz)',
arxiv:'2111.07832',

tldr:'[BERT](#/p/bert)식 마스크 예측을 이미지에 적용하되, **토크나이저를 미리 고정해 두지 않고 teacher 네트워크 자신이 온라인 토크나이저 역할을 하도록** 만든 논문. [DINO](#/p/dino)의 자기증류와 [BEiT](#/p/beit)의 마스크 이미지 모델링을 한 목적함수로 합쳤다.',

context:'[BEiT](#/p/beit)는 텍스트의 성공을 이미지로 옮기며 마스크 패치를 예측하게 했지만, 그러려면 먼저 DALL-E 인코더 같은 **이산 시각 토크나이저를 별도 단계로 사전학습**해 두어야 했다. 이 토크나이저는 한 번 고정되면 학습 내내 바뀌지 않는다. 반면 [DINO](#/p/dino)는 토크나이저 없이 `[CLS]` 토큰 수준의 자기증류만으로 좋은 표현을 얻었지만, 패치 단위의 국소적(local) 의미는 명시적으로 학습하지 않는다. iBOT의 질문은 — **토큰 예측의 이점과 토크나이저 사전학습 없는 편리함을 동시에 가질 수 없는가?**',

ideas:[
 {h:'온라인 토크나이저: teacher가 곧 토크나이저',
  lead:'별도 사전학습 없이 teacher 네트워크의 출력 분포를 마스크 예측의 정답으로 쓴다.',
  d:'BEiT는 dVAE(DALL-E 인코더)를 이미지 전체에 대해 미리 학습시켜 놓고 그 출력을 고정된 정답 토큰으로 쓴다. iBOT은 그 자리에 **student와 같은 구조를 공유하는 teacher 네트워크**를 놓는다. teacher가 만드는 패치 토큰의 softmax 분포 자체가 정답이 되고, 이 teacher는 MIM 목표와 **동시에** 학습되므로 별도의 토크나이저 학습 단계나 파이프라인이 필요 없다.'},
 {h:'두 손실을 한 프레임워크에: CLS 증류 + 패치 증류',
  lead:'CLS 토큰 자기증류로 전역 의미를, 마스크 패치 토큰 증류로 국소 의미를 동시에 학습한다.',
  d:'이미지 $x$ 에서 만든 두 뷰 $u,v$ 를 각각 student $f_s$·teacher $f_t$ 에 통과시킨다. $\\mathcal{L}_{[\\text{CLS}]}$ 는 두 뷰의 `[CLS]` 표현을 서로 맞히는 DINO 방식 자기증류이고, $\\mathcal{L}_{\\text{MIM}}$ 은 student 쪽 입력에서만 일부 패치를 `e_[MASK]` 로 가려 놓고 그 자리의 teacher 출력을 student가 맞히게 한다. 두 손실을 스케일 없이 그냥 더한다.'},
 {h:'헤드 공유가 의미를 패치로 전이시킨다',
  lead:'CLS용 투영 헤드와 패치용 투영 헤드를 같은 파라미터로 공유해 전역 의미를 패치에 심는다.',
  d:'`[CLS]` 증류에서 학습된 "이미지 전체의 의미를 구분하는 능력"을 패치 토큰 쪽에도 재사용하기 위해, $h^{[\\text{CLS}]}$ 와 $h^{\\text{patch}}$ 를 완전히 같은 3층 MLP 파라미터로 둔다. 별도 헤드를 쓰는 것보다 이 공유가 실험적으로 더 좋은 성능을 냈다.'},
 {h:'정답은 one-hot이 아니라 확률 분포',
  lead:'토큰을 이산 id로 확정하지 않고 softmax 분포 그대로를 지도 신호로 쓴다.',
  d:'텍스트 단어는 의미가 거의 고정돼 있지만 이미지 패치 하나는 여러 해석이 가능한 모호한 단위다. 그래서 iBOT은 teacher 출력을 argmax로 이산화한 토큰 id가 아니라 **softmax 분포 그대로**를 정답으로 쓴다. 이 선택이 정답을 고정된 사전(vocabulary)으로 만들지 않는 핵심이다.'}
],

diagram:{type:'compare', cap:'BEiT의 고정 토크나이저와 iBOT의 온라인 토크나이저 비교. 오른쪽 강조가 iBOT이 바꾼 지점.',
 left:{t:'BEiT: 고정 토크나이저', items:['dVAE를 별도 단계로 사전학습','학습 내내 토크나이저 동결','정답이 이산 토큰 id']},
 right:{t:'iBOT: 온라인 토크나이저', items:['teacher 네트워크가 토크나이저 역할','MIM과 동시에 학습·갱신','정답이 softmax 분포'], acc:true}},

math:[
 {expr:'L_MIM = -sum_i P_teacher(u_i)^T log P_student(u_hat_i)   (마스크된 패치 i에 대해)',
  tex:'\\mathcal{L}_{\\text{MIM}} = -\\sum_{i \\in \\text{mask}} P_{t}^{\\text{patch}}(u_i)^{\\top}\\log P_{s}^{\\text{patch}}(\\hat u_i)',
  d:'마스크된 위치마다 teacher의 패치 토큰 분포(정답)와 student의 예측 분포 사이 cross-entropy를 합산한다. student 입력의 해당 위치는 `e_[MASK]` 로 치환돼 있다.'},
 {expr:'L_[CLS] = -P_teacher(v_CLS)^T log P_student(u_CLS)   (cross-view CLS 증류, stop-grad on teacher)',
  tex:'\\mathcal{L}_{[\\text{CLS}]} = -P_{t}^{[\\text{CLS}]}(v)^{\\top}\\log P_{s}^{[\\text{CLS}]}(u)',
  d:'DINO와 같은 형태의 cross-view 자기증류다. teacher 쪽은 `stop-grad` 로 역전파를 막고 EMA로만 갱신되며, teacher 파라미터가 student의 지수이동평균이라는 점은 DINO에서 그대로 가져왔다.'}
],

numbers:[
 {k:'선형 프로빙 · ImageNet-1K', v:'79.5% (ViT-B/16)', d:'IN-1K만 사전학습, Table 1. ViT-S/16은 77.9%, ViT-L/16은 81.0%'},
 {k:'선형 프로빙 · IN-22K 사전학습', v:'82.3% (ViT-L/16)', d:'Table 1 iBOT‡ 행 — 이전 SOTA(EsViT, Swin-B/14) 81.3%를 앞섬'},
 {k:'미세조정 · ImageNet-1K', v:'84.0% (ViT-B/16)', d:'Table 2. ViT-S/16은 82.3%, ViT-L/16은 84.8% — **선형 프로빙 수치와 혼동 주의**'},
 {k:'미세조정 · IN-22K 사전학습 + 512px', v:'87.8% (ViT_512-L/16)', d:'Table 3, 초록에 인용된 대표 수치'},
 {k:'COCO 검출·분할 · ViT-B/16', v:'APb 51.2 · APm 44.2', d:'Table 6, Cascade Mask R-CNN, [DINO](#/p/dino) 대비 우위'},
 {k:'ADE20K 의미 분할 · ViT-B/16', v:'mIoU 50.0', d:'Table 6, UperNet 전체 미세조정 기준'}
],

impact:'iBOT은 "마스크 예측에는 좋은 토크나이저가 필요하다"는 BEiT의 전제를 유지하면서, 그 토크나이저를 **사전학습 대상이 아니라 학습 중에 함께 자라는 것**으로 바꿨다. 이 덕분에 파이프라인이 단일 단계로 줄었고, ImageNet 분류·강건성·검출·분할 전반에서 당시 최고 성능을 냈다. 무엇보다 이 설계 — 자기증류 teacher를 온라인 타깃 생성기로 쓰는 방식 — 가 이후 [DINOv2](#/p/dinov2)에서 그대로 확장되며, 오늘날 범용 시각 특징 추출기 계열의 직접적인 출발점이 되었다.',

legacy:[
 '[DINOv2](#/p/dinov2)가 iBOT의 패치 수준 MIM 손실과 DINO의 CLS 손실을 그대로 물려받아 대규모 큐레이션 데이터에 결합',
 '온라인 토크나이저 발상이 이후 여러 마스크 이미지 모델링 변종에서 "고정 dVAE 대신 EMA teacher" 표준 선택지로 자리잡음',
 '패치 토큰의 국소 의미가 처음으로 정량 평가돼(part-wise linear probing) 이후 dense prediction용 자기지도 학습 평가의 표준 항목이 됨'
],

pitfalls:[
 '**선형 프로빙과 미세조정 수치를 같은 표로 착각하기 쉽다.** ViT-B/16 기준 선형 프로빙은 79.5%, 미세조정은 84.0%로 표가 다르다(Table 1 vs Table 2).',
 '**abstract의 82.3%/87.8%는 IN-1K 단독 학습 결과가 아니다.** 82.3%는 ViT-L/16 + IN-22K 사전학습의 선형 프로빙, 87.8%는 같은 사전학습에 512px 미세조정까지 더한 값이다.',
 '[DINO](#/p/dino)와 달리 iBOT은 patch-level 손실이 추가돼 학습 비용이 늘어난다 — "DINO에 MIM만 더한 것"으로 단순화하면 헤드 공유 같은 세부 설계를 놓치게 된다.'
],

figures:[
 {f:'fig3-framework.png',
  cap:'두 뷰 u·v가 각각 student($f_s$)·teacher($f_t$)를 통과한다. 오른쪽 대각선 화살표 쌍이 $\\mathcal{L}_{[CLS]}$(CLS끼리 교차 증류)이고, 안쪽 짧은 화살표 쌍이 $\\mathcal{L}_{MIM}$(패치끼리 같은 뷰 안에서 증류). student 입력의 빗금 칸이 `e_[MASK]`로 가려진 패치, teacher 쪽 회색 박스 라벨 "online tokenizer"가 이 논문의 핵심 위치.',
  src:'원문 Figure 3, p.4'}
],

quotes:[
 {t:'We present a self-supervised framework iBOT that can perform masked prediction with an online tokenizer.',
  src:'Abstract, p.1'},
 {t:"A visual tokenizer parameterized by online θ' instead of pre-fixed φ thus arises naturally.",
  src:'Sec. 3, p.3'}
],

links:[
 {t:'arXiv 2111.07832 — iBOT: Image BERT Pre-Training with Online Tokenizer', u:'https://arxiv.org/abs/2111.07832'},
 {t:'GitHub — bytedance/ibot', u:'https://github.com/bytedance/ibot'}
]
});
