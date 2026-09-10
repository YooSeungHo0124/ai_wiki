WIKI.paper({
slug:'bevdet',
venue:'arXiv 2021 (PhiGent Robotics)',
authors:'Huang, Huang, Zhu, Ye, Du (PhiGent Robotics)',
arxiv:'2112.11790',

tldr:'`[LSS](#/p/lss)` 식 이미지→BEV 변환을 카메라 전용 3D 검출 파이프라인으로 정리하고, **BEV 공간 전용 데이터 증강**과 크기 인지 NMS(Scale-NMS)를 더해 당시 이미지뷰 기반 검출기(FCOS3D)를 mAP +9.8%p, NDS +10.0%p 앞선 논문. 단일 프레임·카메라 전용이며 시간 정보는 쓰지 않는다.',

context:'`[LSS](#/p/lss)`가 카메라 이미지를 BEV로 들어올리는 변환을 보였지만 그 목적은 BEV 분할과 계획이었다. 같은 시기 [nuScenes](#/p/nuscenes) 3D 검출 리더보드는 FCOS3D·DETR3D처럼 **이미지 평면에서 직접 3D 상자를 회귀**하는 방식이 주도했는데, 이런 방식은 BEV 분할 계열과 다른 파이프라인을 쓰다 보니 두 태스크를 하나의 프레임워크로 묶기 어려웠다. BEVDet의 질문은 단순하다 — 검출도 BEV 공간에서 하면, `[CenterPoint](#/p/centerpoint)` 같은 라이다 검출 헤드를 그대로 재사용할 수 있고 분할과도 파이프라인을 공유할 수 있지 않은가. 문제는 단순히 이미지 증강을 붙이는 것만으로는 성능이 오르지 않았다는 점이었다.',

ideas:[
 {h:'4모듈 파이프라인으로 카메라 검출을 정리',
  lead:'이미지뷰 인코더·뷰 변환기·BEV 인코더·헤드로 기존 구성요소를 재사용해 조립한다.',
  d:'이미지뷰 인코더(백본+neck)가 카메라별 특징을 뽑고, `[LSS](#/p/lss)`식 뷰 변환기가 깊이 분류맵과 외적(outer product)으로 이를 BEV 점구름에 대응시켜 풀링한다. 이후 BEV 인코더가 BEV 특징을 한 번 더 다듬고, `[CenterPoint](#/p/centerpoint)` 스타일 헤드가 3D 상자를 예측한다. 새 모듈을 발명하지 않고 **기존에 검증된 모듈을 BEV라는 공용 공간에서 잇는 것**이 기여의 핵심이다.'},
 {h:'BEV 공간 증강이 이미지 증강과 따로 필요하다',
  lead:'이미지뷰 증강(IDA)만으로는 과적합을 못 줄이고, BEV 공간 증강(BDA)이 성능 향상의 대부분을 만든다.',
  d:'이미지에 회전·크롭·플립 같은 표준 증강(IDA)을 걸어도 뷰 변환기를 통과하면 BEV 특징의 다양성은 거의 늘지 않는다 — 이미지 픽셀의 변형이 3D 기하 관계를 깨지 않게 다시 보정되기 때문이다. 반대로 BEV 특징 자체에 직접 회전·스케일·평행이동·플립(BDA)을 걸면 헤드가 보는 입력 분포가 실제로 넓어진다. 저자들은 두 증강을 함께 켜야만 이득이 난다는 것도 보인다 — BDA 단독은 기준 대비 +3.2%p mAP, IDA+BDA 조합은 +8.6%p mAP까지 오른다(20 epoch 학습 중 피크 기준). BDA 없이 IDA만 켜면 오히려 성능이 떨어질 수 있다.'},
 {h:'Scale-NMS: 카테고리별로 상자를 키운 뒤 NMS',
  lead:'보행자·라바콘처럼 작은 물체는 NMS 전에 상자를 카테고리별로 확대해 겹침을 인위적으로 키운다.',
  d:'표준 NMS는 IoU로 중복 상자를 지우는데, 작은 물체는 살짝만 어긋나도 IoU가 0에 가까워져 중복 예측이 전부 살아남는 문제가 있다. Scale-NMS는 NMS를 돌리기 **전에** 카테고리별로 정해진 배율만큼 상자 크기를 키워 IoU 분포를 정상 범위로 되돌린 다음 표준 NMS를 적용한다. 학습 없이 후처리 규칙 하나만 바꾼 것인데 작은 카테고리에서 눈에 띄는 향상을 만든다.'}
],

diagram:{type:'flow', cap:'BEVDet의 4모듈: 이미지 인코더 → 뷰 변환기(LSS식) → BEV 인코더 → 검출 헤드. 증강은 이미지 단계와 BEV 단계에 각각 따로 건다.',
 nodes:[
  {t:'카메라 N장', s:'이미지'},
  {t:'이미지뷰 인코더', s:'백본+neck', a:'IDA 증강'},
  {t:'뷰 변환기', s:'LSS식 깊이+풀링'},
  {t:'BEV 인코더', s:'BEV 특징 정제', acc:true, a:'BDA 증강'},
  {t:'검출 헤드', s:'CenterPoint식'}
 ]},

numbers:[
 {k:'nuScenes val · BEVDet-Tiny', v:'31.2 mAP / 39.2 NDS', d:'`704×256` 입력, FCOS3D(29.5/37.2) 대비 우세하면서 연산량은 11%'},
 {k:'nuScenes val · BEVDet-Base', v:'39.3 mAP / 47.2 NDS', d:'FCOS3D 대비 **+9.8%p mAP, +10.0%p NDS**'},
 {k:'BDA 단독 효과', v:'+3.2%p mAP', d:'베이스라인(증강 없음) 대비, 20epoch 학습 피크 기준'},
 {k:'IDA+BDA 결합 효과', v:'+8.6%p mAP', d:'BDA 단독보다 크게 상승 — 두 증강이 상호보완적'},
 {k:'BEV 인코더(BE) 효과', v:'+1.7%p mAP', d:'BEV 인코더 유무 비교(BDA·IDA 고정)'},
 {k:'BEVDet-Tiny 추론 속도', v:'15.6 FPS', d:'FCOS3D 대비 9.2배 빠름, GFLOPs는 215.3의 약 11%'}
],

impact:'`[LSS](#/p/lss)`의 뷰 변환을 검출까지 확장하면서, 카메라 전용 3D 검출을 BEV 표현 위의 문제로 재정의했다. **이미지 증강과 BEV 증강을 분리**해야 한다는 발견은 이후 카메라 BEV 검출기 대부분의 학습 레시피에 표준으로 자리잡았다 — 이 구분이 없으면 성능이 크게 떨어진다는 것을 후속 연구들이 재확인한다. `[CenterPoint](#/p/centerpoint)` 헤드를 라이다에서 카메라 BEV로 그대로 옮겨 쓸 수 있다는 것을 보인 것도 검출기 설계를 모듈 조합 문제로 만드는 데 기여했다.',

legacy:[
 '**BEV 증강이 카메라 3D 검출의 표준 레시피가 됨** — 이후 BEV 검출기 다수가 IDA/BDA를 구분해 보고',
 '**`[CenterPoint](#/p/centerpoint)` 헤드의 카메라 이식 선례** — 라이다 검출 헤드가 BEV 특징이라면 모달리티를 가리지 않는다는 것을 실증',
 '**시간 정보 부재라는 다음 과제를 남김** — 단일 프레임만 쓰는 한계가 `[BEVFormer](#/p/bevformer)`의 시간 self-attention 도입으로 직접 이어짐',
 '**모듈형 4단계 파이프라인이 이후 비교의 기본 골격** — 이미지 인코더/뷰 변환기/BEV 인코더/헤드 구분이 후속 논문들의 설명 틀로 굳어짐'
],

pitfalls:[
 '**BEVDet은 시간 정보를 쓰지 않는다.** 단일 프레임·카메라 전용 검출기이며, 과거 프레임을 융합하는 시간 모듈이 없다 — 이 점에서 시간 self-attention을 쓰는 `[BEVFormer](#/p/bevformer)`와 다른 세대다(후속 BEVDet4D는 이 논문과 별개).',
 '**IDA와 BDA를 같은 것으로 뭉뚱그리지 않는다.** 이미지 단계 증강(IDA)만으로는 오히려 성능이 나빠질 수 있고, BEV 공간 증강(BDA)이 있어야 IDA도 도움이 된다 — 순서와 조합이 논문의 핵심 발견이다.',
 '**BEVDet-Tiny와 BEVDet-Base의 수치를 섞지 않는다.** 입력 해상도·GFLOPs·mAP/NDS가 서로 다른 별개 설정이며, "BEVDet의 성능"이라고 뭉뚱그려 인용하면 어느 버전인지 불명확해진다.'
],

figures:[
 {f:'fig1-framework.png',
  cap:'왼쪽부터 이미지뷰 인코더(회색)가 카메라 특징을 뽑고, 뷰 변환기(중앙)가 Depth Classification Map과 Camera Model로 point cloud를 만들어 outer product·pooling으로 BEV 특징(분홍)을 채운다. 이후 BEV 인코더가 이를 다듬어 검출 헤드로 보낸다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'We merely reuse existing modules to build its framework but substantially develop its performance by constructing an exclusive data augmentation strategy and upgrading the Non-Maximum Suppression strategy.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2112.11790 — BEVDet', u:'https://arxiv.org/abs/2112.11790'},
 {t:'BEVDet 공식 코드', u:'https://github.com/HuangJunJie2017/BEVDet'}
]
});
