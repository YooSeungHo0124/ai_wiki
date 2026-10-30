WIKI.paper({
slug:'motrv2',
venue:'CVPR 2023 (arXiv 2022)',
authors:'Zhang et al. (SJTU · MEGVII)',
arxiv:'2211.09791',

tldr:'MOTR의 detect query를 **사전학습된 [YOLOX](#/p/yolox) 검출 결과로 만든 proposal query**로 갈아 끼워, 검출은 외부 검출기에 맡기고 MOTR는 연관만 배우게 한 end-to-end 트래커. DanceTrack HOTA를 54.2에서 69.9로 올렸다.',

context:'MOTR와 TrackFormer 같은 end-to-end 트래커는 연관이 강한 대신 검출 성능이 tracking-by-detection 방식에 못 미쳤다. 저자들은 그 원인을 한 decoder가 검출과 연관을 동시에 학습할 때 생기는 충돌로 본다. [ByteTrack](#/p/bytetrack)처럼 강한 외부 검출기를 쓰는 방식이 최고 성능을 내던 상황에서, 검출기를 MOTR에 붙이는 방법이 문제였다. TransTrack처럼 예측을 IoU로 맞추는 방법은 검출을 조금 개선할 뿐이고 end-to-end 성격도 잃는다고 저자들은 판단했다.',

ideas:[
 {h:'YOLOX proposal로 detect query를 대체',
  lead:'외부 검출기가 낸 박스를 anchor로 삼는 proposal query가 새 객체 검출을 전담한다.',
  d:'프레임마다 YOLOX가 중심, 크기, 신뢰도를 가진 제안 $N_t$ 개를 낸다. 학습 가능한 shared query 하나를 $N_t$ 개로 복제하고 신뢰도의 sine-cosine 임베딩을 더해 proposal query를 만든다. 박스는 anchor로 쓰이고 decoder는 anchor 대비 상대 오프셋만 예측한다. 놓친 객체를 위해 학습 가능한 anchor 10개도 덧붙인다.'},
 {h:'Anchor 기반 query로 전환',
  lead:'query의 위치 임베딩을 anchor 박스의 sine-cosine 인코딩으로 바꿔 DAB-DETR식 구조로 만든다.',
  d:'detect query의 학습형 positional embedding을 anchor 인코딩으로 대체한 anchor-based MOTR이다. track query도 같은 방식으로 이전 프레임의 예측 박스를 anchor 삼아 상대 오프셋을 낸다. 이 변경으로 검출 문제가 크게 쉬워지고 검출과 연관의 충돌이 완화된다.'},
 {h:'Proposal propagation',
  lead:'proposal query와 track query를 한 decoder에 넣고 self-attention으로 중복 검출을 억제한다.',
  d:'프레임 $t>0$ 에서 이전 프레임의 track query와 현재 proposal query를 이어 붙이고, 이전 예측 박스와 현재 YOLOX 제안을 anchor로 합친다. 같은 객체의 proposal query와 track query 사이에 정보 교환이 일어나는 것을 self-attention 맵으로 보인다. 즉 proposal query는 신생·누락 객체, track query는 기존 객체의 재위치를 맡는다.'},
 {h:'학습 방식의 변경',
  lead:'정답 트랙 대신 점수 0.5 이상 예측 query를 전파해 실제 추론의 오류 상황을 학습 중에 만든다.',
  d:'원래 MOTR는 정답과 짝지어진 track query만 넘기고 인위적으로 지우고 끼워 넣었다. MOTRv2는 점수 0.5를 넘는 query를 그대로 전파해 false positive와 false negative가 자연히 생기게 하고 $p_{drop}=p_{insert}=0$ 으로 둔다. 박스 전체를 anchor로 전파하는 것이 중심점만 전파하는 것보다 낫다는 ablation도 있다.'}
],

diagram:{type:'flow', cap:'YOLOX가 프레임마다 제안을 만들고 MOTR가 proposal query와 track query를 함께 처리해 예측과 다음 프레임의 track query를 낸다.',
 nodes:[
  {t:'입력 프레임', s:'t'},
  {t:'YOLOX', s:'사전학습 검출기', a:'제안 박스'},
  {t:'proposal query', s:'제안 박스 = anchor', acc:true},
  {t:'MOTR 디코더', s:'+ track query', a:'오프셋'},
  {t:'트랙 예측', s:'다음 프레임으로'}
 ]},

math:[
 {tex:'\\hat Y_t = P_t + (\\Delta x,\\Delta y,\\Delta w,\\Delta h)',
  expr:'Ŷ_t = P_t + (Δx, Δy, Δw, Δh)',
  d:'최종 박스는 anchor(YOLOX 제안 또는 이전 프레임 예측) $P_t$ 에 decoder가 낸 상대 오프셋을 더한 값이다. 검출을 처음부터 회귀하지 않고 보정 문제로 바꾼 것이 핵심이다.'}
],

numbers:[
 {k:'DanceTrack test · HOTA / DetA / AssA', v:'69.9 / 83.0 / 59.0', d:'MOTR 54.2 / 73.5 / 40.2, OC-SORT 55.1 / 80.3 / 38.3. 추가 연관·val 학습·4개 앙상블을 더한 MOTRv2*는 HOTA 73.4'},
 {k:'DanceTrack val 누적 개선 · HOTA', v:'51.7 → 54.8 → 57.1 → 63.7 → 64.5', d:'MOTR → 구현 개선 → 박스 전파 → YOLOX와 CrowdHuman → query denoise (Table 5)'},
 {k:'BDD100K val · mMOTA / mIDF1', v:'43.6 / 56.5', d:'MOTR 32.3 / 44.8, Unicorn 41.2 / 54.0. YOLOX 제안 없는 MOTR* 35.5 / 48.2'},
 {k:'MOT17 test · HOTA / IDF1 / MOTA', v:'62.0 / 75.0 / 78.6', d:'MOTR 57.8 / 68.6 / 73.4. ByteTrack은 63.1 / 77.3 / 80.3으로 여전히 앞선다'},
 {k:'MOT20 test · HOTA / MOTA', v:'60.3 / 76.2', d:'MOT17 학습을 더하면 61.0 / 76.2. ByteTrack은 61.3 / 77.8'}
],

impact:'MOTRv2는 end-to-end 트래커의 약점이던 검출을 "사전학습 검출기에 맡기되 연관은 여전히 query로 학습한다"는 절충으로 풀었다. 연관 정확도(AssA)가 DanceTrack에서 59.0까지 올라 휴리스틱 매칭 기반 방법과의 격차를 크게 벌렸고, 챌린지 1위(앙상블 HOTA 73.4)도 차지했다. 반면 이는 외부 검출기가 필요하다는 뜻이므로 순수한 end-to-end와는 거리가 있다.',

legacy:[
 '**검출-연관 분리 흐름** — 이 논문은 검출을 외부로 빼는 설계를 제시했고, [MOTIP](#/p/motip)도 검출과 연관을 두 모듈로 나누되 연관을 ID 예측으로 푼다.',
 '**MOTR 계열의 직접 후속** — [MOTR](#/p/motr)의 track query 전파와 TAN·CAL 위에 anchor와 proposal을 얹은 형태다.',
 '**비교 기준** — MOTIP는 DanceTrack 표에서 MOTRv2를 추가 데이터를 쓰는 쪽에 놓고, 같은 조건의 자기 결과와 비교한다.'
],

pitfalls:[
 '**순수 end-to-end 비교가 아니다.** YOLOX 가중치를 ByteTrack·DanceTrack 공식 것으로 쓰고 모든 박스를 점수 0.05 이상으로 받는다. 검출기 품질이 좋아진 만큼의 향상이 섞여 있다.',
 '**MOT17·MOT20은 여전히 ByteTrack이 앞선다.** 저자들은 이를 MOT17 영상의 총 길이가 215초에 불과해 query 기반 트래커를 학습하기에 작은 탓으로 본다. 큰 성과는 DanceTrack과 BDD100K에서 나왔다.',
 '**73.4는 단일 모델 점수가 아니다.** DanceTrack 73.4 HOTA는 추가 연관 후처리, val 세트 학습, 4개 모델 앙상블을 모두 더한 값이고 단일 모델은 69.9이다.'
],

figures:[
 {f:'fig2-architecture.png',
  cap:'왼쪽 t=0, 오른쪽 t=1 두 프레임이다. 위쪽 경로는 입력 프레임이 MOTR에 직접 들어가 image feature가 되는 길이고, 아래쪽 경로는 YOLOX 박스가 ProposalQ를 만드는 길이다. t=1에서는 t=0 예측에서 넘어온 TrackQ(색 상자)가 ProposalQ 옆에 붙어 함께 디코딩된다.',
  src:'원문 Figure 2, p.2'}
],

quotes:[
 {t:'We attribute the inferior detection performance to the conflict between the joint detection and association processes.',
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 2211.09791 — MOTRv2', u:'https://arxiv.org/abs/2211.09791'},
 {t:'GitHub — megvii-research/MOTRv2', u:'https://github.com/megvii-research/MOTRv2'}
]
});
