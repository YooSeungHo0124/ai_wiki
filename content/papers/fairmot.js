WIKI.paper({
slug:'fairmot',
venue:'IJCV 2021',
authors:'Zhang, Wang, Wang, Zeng, Liu (HUST · Microsoft Research Asia)',
arxiv:'2004.01888',

tldr:'검출과 re-ID 를 한 네트워크로 합칠 때 re-ID 가 검출에 "불공정하게" 밀리는 원인을 앵커·특징·차원 세 가지로 분석하고, 앵커 없는 [CenterNet](#/p/centernet) 위에 **물체 중심점에서 뽑은 저차원 re-ID 특징**을 얹어 해결한 원샷 트래커. 당시 MOT15·16·17·20 에서 공개 순위 1위를 보고했다.',

context:'[JDE](#/p/jde) 같은 원샷 트래커는 검출 헤드와 임베딩 헤드를 한 네트워크에 두어 속도를 얻었지만, 투 스텝 방식보다 ID 스위치가 많고 정확도가 낮았다. 이 논문은 그 이유가 "검출이 우선, re-ID 는 부차적"인 앵커 기반 설계에 있다고 본다. 앵커 하나가 여러 사람을 덮거나, 여러 앵커가 한 사람을 가리켜 re-ID 학습 신호가 모호해지기 때문이다. 또 re-ID 연구의 관행인 512~1024 차원 특징이 검출과 경쟁한다고 주장한다. 저자들은 단순한 결합이 아니라 세부 설계가 중요하다고 강조한다.',

ideas:[
 {h:'앵커가 re-ID 를 흐린다',
  lead:'앵커 기반에서는 한 앵커에 여러 ID, 한 ID 에 여러 앵커가 대응해 임베딩 학습이 모호해진다.',
  d:'Track R-CNN 은 RoI-Align 으로, JDE 는 양성 앵커 중심에서 특징을 뽑는데, 샘플링 위치가 다른 사람이나 배경에 걸리기 쉽다. 같은 ID 에 인접 앵커 여럿이 겹쳐 대응되고, 데이터 증강으로 이미지가 조금 흔들리면 같은 앵커가 다른 ID 를 맡기도 한다. 또 특징맵 stride 8/16/32 는 물체 중심과 어긋난다. 이를 피하려고 물체 중심 한 점에서만 특징을 뽑는다.'},
 {h:'stride 4 고해상도 두 동형 분기',
  lead:'DLA-34 로 stride 4 특징을 만들고, 검출과 re-ID 를 같은 구조의 두 분기로 병렬 처리한다.',
  d:'ResNet-34 에 다층 융합(DLA-34, 업샘플링은 deformable conv)을 붙여 $H/4\\times W/4$ 특징을 만든다. 검출 분기는 히트맵·박스 크기·중심 오프셋 세 헤드, re-ID 분기는 각 위치에 128 차원 임베딩을 낸다. 두 분기가 대등하게 같은 특징맵을 쓰는 것이 "공정"의 핵심이다. 다층 융합이 없는 백본(ResNet-34/50)은 TPR 90.9~91.9 에 머물렀다(Table 3).'},
 {h:'낮은 차원의 re-ID 특징',
  lead:'MOT 에서는 인접 프레임의 소수 후보만 매칭하므로 64~128 차원이 오히려 낫다.',
  d:'검출 출력 차원이 낮은데 re-ID 만 512 차원이면 두 태스크가 경쟁한다는 가설이다. Table 6 에서 FairMOT 은 512 → 64 로 줄였을 때 MOTA 68.5 → 69.2, ID 스위치 312 → 283, FPS 24.1 → 26.8 이었다. JDE 도 같은 방향이지만 MOTA 차이는 0.4 로 작았다.'},
 {h:'손실 균형과 단일 이미지 학습',
  lead:'불확실성 가중으로 두 태스크를 맞추고, CrowdHuman 같은 박스 데이터로 re-ID 도 사전학습한다.',
  d:'$L_{total}$ 은 검출 손실과 ID 분류 손실을 학습 가능한 $w_1,w_2$ 로 가중한다. 단일 이미지 학습은 박스마다 고유 ID 를 부여해 한 장을 변형하며 학습하는 방법이다. CrowdHuman 으로 사전학습한 뒤 MOT17 로 미세조정하면 검증 MOTA 71.1, IDF1 75.6 이 됐다(Table 8).'},
 {h:'2단계 온라인 연결',
  lead:'외형 + 모션 융합 비용으로 먼저 매칭하고, 남은 것은 IoU 로 다시 매칭한다.',
  d:'MOTDT 를 따라, 1단계에서는 칼만 필터 마할라노비스 거리와 re-ID 코사인 거리를 $D=\\lambda D_r+(1-\\lambda)D_m$ ($\\lambda=0.98$)로 합쳐 헝가리안(임계 0.4)으로 푼다. 2단계는 남은 박스를 IoU(임계 0.5)로 맞춘다. 외형 특징은 매 스텝 갱신하고, 미매칭 트랙은 30프레임 보관한다. '}
],

diagram:{type:'split', cap:'공유 고해상도 특징맵에서 두 분기가 동등하게 갈라진다. re-ID 는 앵커 없이 검출된 중심점 위치의 특징을 쓴다.',
 from:{t:'DLA-34 특징', s:'stride 4'},
 branches:[
  {t:'히트맵', s:'물체 중심'},
  {t:'박스 크기·오프셋', s:'2채널씩'},
  {t:'re-ID 임베딩', s:'128차원', acc:true}
 ],
 join:'중심점의 임베딩으로 연결'},

math:[
 {expr:'L_total = ½ ( e^{-w1} L_det + e^{-w2} L_id + w1 + w2 )',
  tex:'L_{total}=\\frac{1}{2}\\left(\\frac{1}{e^{w_1}}L_{detection}+\\frac{1}{e^{w_2}}L_{identity}+w_1+w_2\\right)',
  d:'$L_{detection}=L_{heat}+L_{box}$, $L_{identity}$ 는 중심점 임베딩에 FC+softmax 를 건 ID 분류 손실이다. 학습 가능한 $w_1,w_2$ 가 두 손실의 크기를 맞춘다. GradNorm 이 IDF1 은 더 높았지만(73.8) 학습이 느려 이 단순한 방식을 썼다.'},
 {expr:'D = λ D_r + (1−λ) D_m,  λ = 0.98',
  tex:'D=\\lambda D_r+(1-\\lambda)D_m,\\qquad \\lambda=0.98',
  d:'$D_r$ 는 re-ID 코사인 거리, $D_m$ 은 칼만 예측과의 마할라노비스 거리다. 외형 비중이 압도적이고 모션은 큰 이동을 걸러내는 보조 역할이다.'}
],

numbers:[
 {k:'MOT17 테스트 (private 검출)', v:'MOTA 73.7 / IDF1 72.3', d:'Table 10. 25.9 FPS, ID 스위치 3,303. 같은 표의 CenterTrack 은 MOTA 67.8, IDF1 64.7'},
 {k:'MOT16 테스트', v:'MOTA 74.9 / IDF1 72.8', d:'Table 10. JDE 는 64.4 / 55.8'},
 {k:'JDE 와 직접 비교 (2DMOT15 6개 영상)', v:'ID 스위치 218 → 80', d:'Table 9, 같은 학습셋. MOTA 67.5 → 77.2, IDF1 66.7 → 79.8, 30.9 FPS'},
 {k:'특징 추출 위치 (MOT17 검증)', v:'Center IDF1 72.8 / TPR 94.4', d:'Table 1. RoI-Align 71.0 / 93.1, 양성 앵커 70.3 / 93.9, 2단계 68.2 / 90.5'},
 {k:'학습 데이터 (MOT17 테스트)', v:'MOT17만 69.8 → +MIX+CH 73.7', d:'Table 11. MOT17 단독도 이미 다른 방법을 넘었다고 주장'}
],

impact:'원샷 MOT 의 약점이 "합쳤기 때문"이 아니라 앵커·특징·차원의 설계에 있음을 실험으로 분해해 보였고, 앵커 프리 중심점 + 저차원 re-ID 구성이 JDE 의 약점을 크게 줄였다. 같은 학습셋(JDE 와 동일)으로 MOT15 평가에서 ID 스위치를 218 에서 80 으로 줄였다. 한편 저자들은 [CenterTrack](#/p/centertrack) 과 달리 외형으로 장기 재연결이 가능하다는 점을 차별점으로 든다. 이후 외형을 쓰는 방식과 쓰지 않는 방식을 비교하는 논문들에서 FairMOT 은 단골 비교 대상이 됐다.',

legacy:[
 '**[ByteTrack](#/p/bytetrack)** — FairMOT 같은 re-ID 기반 트래커를 포함한 여러 트래커에 BYTE 연결을 그대로 끼워 넣어 효과를 검증',
 '**[DanceTrack](#/p/dancetrack)** — 외형이 비슷한 군무 영상에서 FairMOT 의 HOTA 가 MOT17 59.3 에서 39.7 로 떨어지는 것이 보고됨',
 '**[StrongSORT](#/p/strongsort)** — 외형 임베딩 연결 계열을 개선해 MOT17·MOT20 상위권으로 되돌린 후속 연구'
],

pitfalls:[
 '**버전과 수치가 다르다.** 이 노트의 수치는 arXiv v6(IJCV 2021)를 기준으로 하고, 2020년 초기 버전(v1)과 표·숫자가 다를 수 있다.',
 '**private 검출 프로토콜의 수치다.** Table 10 은 공개 검출이 아니라 private 검출·추가 데이터를 쓰는 순위라, [Tracktor](#/p/tracktor) 처럼 공개 검출을 쓰는 방법과 공정 비교가 아니다.',
 '**"저차원이 항상 낫다"로 일반화하기 어렵다.** Table 6 의 FairMOT MOTA 차이는 0.7(68.5 → 69.2)이고, 저자도 re-ID 검색 같은 다른 과제는 고차원이 필요하다고 구분한다. MOT 의 소수 일대일 매칭이라는 전제 아래의 결과다.'
],

figures:[
 {f:'fig1-overview.png',
  cap:'왼쪽 아래의 인코더-디코더가 stride 4 특징맵을 만들고, 오른쪽에서 검출(히트맵·박스 크기·중심 오프셋)과 re-ID 임베딩이 같은 구조의 두 분기로 병렬 출력된다. 임베딩은 예측된 중심점 위치에서 뽑는다.',
  src:'원문 Figure 1, p.3'},
 {f:'fig2-anchor-vs-center.png',
  cap:'Track R-CNN 과 JDE(빨간 상자·점은 양성 앵커)는 한 물체에 여러 앵커가 겹쳐 대응되고 한 앵커가 여러 사람을 덮는다. FairMOT(오른쪽)은 물체 중심의 한 점에서만 re-ID 를 뽑아 이 모호함을 피한다.',
  src:'원문 Figure 2(a), p.6'}
],

quotes:[
 {t:'However, we find that the two tasks tend to compete with each other which need to be carefully addressed.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2004.01888 — FairMOT', u:'https://arxiv.org/abs/2004.01888'},
 {t:'공식 코드 (ifzhang/FairMOT)', u:'https://github.com/ifzhang/FairMOT'}
]
});
