WIKI.paper({
slug:'sam3',
venue:'arXiv 2025 (Meta Superintelligence Labs)',
authors:'Carion, Gustafson, Hu, Debnath, Hu, Suris et al. (Meta Superintelligence Labs)',
arxiv:'2511.16719',

tldr:'[SAM](#/p/sam)·[SAM 2](#/p/sam2)가 점·박스·마스크 같은 **기하 프롬프트로 객체 하나**를 분할했다면, SAM 3는 짧은 명사구나 예시 이미지 같은 **개념 프롬프트로 그 개념에 맞는 모든 인스턴스**를 이미지·비디오에서 찾아 분할·추적한다. 이 새 과제를 Promptable Concept Segmentation(PCS)로 정식화하고, 전용 벤치마크 SA-Co를 함께 공개했다.',

context:'[SAM](#/p/sam)과 [SAM 2](#/p/sam2)는 "무엇이든 분할한다"는 이름과 달리 실제로는 프롬프트 한 번에 객체 하나만 골라내는 **Promptable Visual Segmentation(PVS)** 과제였다 — 점을 찍거나 박스를 그리면 그 위치의 물체 하나가 나온다. 그런데 실무에서 자주 필요한 것은 "이 영상에 나오는 노란 스쿨버스를 전부 찾아줘" 같은, **개념 하나에 대응하는 모든 인스턴스**를 찾는 일이다. 이는 기존의 개방어휘 검출기(OWLv2 등)가 다루던 영역이지만, 그런 모델들은 SAM류의 정교한 마스크 품질이나 비디오 추적을 갖추지 못했다. SAM 3는 이 두 계보 — 프롬프트 가능한 분할과 개방어휘 검출 — 를 하나의 과제로 합친다.',

ideas:[
 {h:'PCS: "이 개념에 맞는 것 전부"라는 새 과제',
  lead:'짧은 명사구·이미지 예시(양성/음성)를 프롬프트로 받아 매칭되는 모든 인스턴스에 마스크와 고유 ID를 반환한다.',
  d:'Promptable Concept Segmentation(PCS)은 텍스트(짧은 명사구, 긴 지시 표현이나 다중 속성 조합은 범위 밖)나 이미지 예시(양성/음성 박스), 또는 둘의 조합을 입력받아 이미지·비디오 전체에서 그 개념에 해당하는 모든 인스턴스의 마스크와 고유 identity를 반환한다. 기존 PVS(점·박스로 객체 하나)와 달리 "존재하는 모든 인스턴스를 찾는" 열거형 과제라는 점이 근본적으로 다르다.'},
 {h:'Presence token: "있는지"와 "어디인지"를 분리',
  lead:'전역 존재 여부를 판단하는 토큰을 따로 두어, 각 proposal query는 지역적 매칭만 풀게 한다.',
  d:'DETR 스타일 디코더의 각 proposal query가 "이 개념이 전역적으로 존재하는가"와 "이 query 위치가 그 개념과 매칭되는가"를 동시에 풀도록 강제하면, 전역 문맥 이해가 지역적 위치 추정과 충돌해 성능이 떨어진다. 그래서 존재 여부만 전담하는 **presence token**을 별도로 두고, 각 query의 최종 점수는 (query의 매칭 점수) × (presence 점수)로 계산한다. 이 분리 하나로 검출 정확도가 크게 오른다.'},
 {h:'이미지 예시는 인스턴스 하나가 아니라 부류 전체를 지정한다',
  lead:'개 한 마리에 양성 박스를 찍으면 이미지의 모든 개가 검출된다 — SAM 1/2의 단일 인스턴스 프롬프트와 다르다.',
  d:'양성/음성 라벨이 붙은 바운딩박스 쌍을 exemplar encoder가 위치·라벨 임베딩과 ROI-pooled 시각 특징으로 인코딩해 텍스트 프롬프트와 결합한다. 현재 검출 결과의 오류를 보고 예시를 대화식으로 추가해 결과를 정제할 수도 있다.'},
 {h:'검출기와 추적기를 분리해 과제 충돌을 피한다',
  lead:'이미지 검출기와 SAM 2 스타일 메모리 기반 추적기가 하나의 backbone(Perception Encoder)을 공유하되 역할은 나눈다.',
  d:'이미지 레벨 검출은 [DETR](#/p/detr) 계열 인코더-디코더가, 비디오 추적은 [SAM 2](#/p/sam2)에서 가져온 메모리 attention·메모리 뱅크 구조가 맡는다. 검출과 추적을 한 모델에 억지로 합치는 대신 역할을 나눠, 새 객체 탐지가 기존 추적 대상에 영향을 주지 않게 한다. 비디오 추론에서는 매 프레임 SAM 2 스타일 masklet을 전 객체에 대해 유지하므로 연산량이 추적 대상 수에 비례해 늘어난다.'},
 {h:'사람+AI 데이터 엔진으로 4백만 개념 라벨을 확보',
  lead:'AI가 명사구·hard negative를 제안하고 사람이 검증하는 루프를 반복해 SA-Co 데이터셋을 짓는다.',
  d:'4단계로 진화하는 데이터 엔진: (1) 사람이 직접 검증 → (2) 사람 라벨로 파인튜닝한 Llama 3.2 기반 AI 검증기가 사람 작업을 절반으로 줄임 → (3) Wikidata 기반 2240만 노드 온톨로지로 라벨 다양성과 난이도(hard negative)를 확장 → (4) 비디오로 확장. 이 과정으로 5.2M 이미지·4M 고유 명사구를 담은 SA-Co/HQ와 52.5K 비디오의 SA-Co/VIDEO를 구축했다.'}
],

diagram:{type:'compare', cap:'SAM/SAM 2의 기하 프롬프트 대비 SAM 3의 개념 프롬프트.',
 left:{t:'SAM · SAM 2 (PVS)', items:['점·박스·마스크로 프롬프트','한 번에 객체 하나만 분할','"어디"만 지정하면 충분']},
 right:{t:'SAM 3 (PCS)', items:['명사구·이미지 예시로 프롬프트', '매칭되는 모든 인스턴스 + ID', 'presence token으로 존재 여부 분리']}
},

math:[
 {expr:'score(q_i) = p(NP present in input) * p(q_i matches | NP present)',
  tex:'\\text{score}(q_i)=p(\\text{NP present})\\cdot p(q_i\\ \\text{matches}\\mid \\text{NP present})',
  d:'각 proposal query $q_i$의 최종 점수는 presence token이 내는 전역 존재 확률과, query 자신의 지역 매칭 확률의 곱이다. 두 판단을 분리해 서로의 목적이 충돌하지 않게 한다.'},
 {expr:'cgF1 = 100 * pmF1 * IL_MCC',
  tex:'\\text{cgF1}=100\\cdot \\text{pmF1}\\cdot \\text{IL\\_MCC}',
  d:'SA-Co의 주 평가지표. pmF1(positive micro F1)은 마스크 위치 정확도, IL_MCC(image-level Matthews 상관계수)는 "그 개념이 있는지 없는지"의 분류 정확도를 각각 담당하고, 둘을 곱해 위치와 존재판단을 함께 강제한다.'}
],

numbers:[
 {k:'SA-Co/Gold cgF1', v:'54.1', d:'가장 강력한 기존 방법 OWLv2⋆(24.6)의 2배 이상. 사람 성능(72.8)의 74% 수준'},
 {k:'LVIS mask AP', v:'48.5', d:'박스 프롬프트 기반 OWLv2⋆(43.4), APE-D⋆(53.0, LVIS 학습 포함) 대비 zero-shot 조건'},
 {k:'ADE-847 / PC-59 의미분할', v:'13.8 / 60.8 mIoU', d:'제로샷 개방어휘 조건. Cityscapes는 65.2 mIoU'},
 {k:'모델 크기', v:'약 8.5억 파라미터', d:'비전·텍스트 인코더(Perception Encoder 기반) 약 7.5억 + 검출·추적기 약 1억'},
 {k:'SA-Co 벤치마크 규모', v:'20.7만 고유 명사구 · 12.1만 이미지/비디오', d:'Gold(3인 중복 라벨)·Silver·Bronze·Bio 4개 분할, 300만 이상 media-phrase 쌍'},
 {k:'비디오 실시간 처리', v:'H200 8장으로 최대 64개 객체 · 30FPS', d:'추적 대상 수에 비례해 연산량 증가, GPU 분산으로 실시간 유지'}
],

impact:'SAM 계열의 정체성을 "정교한 마스크를 만드는 도구"에서 "언어로 지정한 개념을 이미지·비디오 전체에서 열거하는 도구"로 확장했다. cgF1 기준으로 최강 개방어휘 검출기의 2배라는 격차는, 기존 개방어휘 검출이 SAM류의 마스크 정밀도·비디오 추적 능력 없이 박스 수준에 머물러 있었다는 것과 대비된다. SA-Co 벤치마크와 4M 명사구 데이터셋 공개는 PCS라는 과제 자체를 표준화해, 이후 개방어휘 분할 연구의 평가 기준점이 될 가능성이 크다.',

legacy:[
 '**개방어휘 검출 계보와의 합류** — OWLv2·GroundingDino류의 텍스트 프롬프트 검출이 SAM의 마스크 정밀도·추적 능력과 결합됨',
 '**Perception Encoder를 백본으로 재사용** — [Perception Encoder](#/p/perception-encoder)가 SAM 3의 비전·텍스트 인코더로 그대로 들어가, PE의 "중간층에 좋은 임베딩이 있다"는 설계가 실제 응용에 쓰인 사례',
 '**AI 검증기를 데이터 엔진에 넣는 패턴의 확산** — 사람 라벨로 파인튜닝한 LLM이 데이터 검증을 대신해 사람 작업량을 절반으로 줄이는 구조가, 이후 대규모 라벨링 파이프라인의 참조 사례가 될 가능성'
],

pitfalls:[
 '**복잡한 지시 표현은 지원 범위 밖이다.** PCS는 "짧은 명사구"로 설계되어 있어 "왼쪽에서 두 번째 빨간 셔츠를 입은 사람" 같은 다중 속성·참조 표현은 직접 처리하지 못한다. 논문은 MLLM과 결합한 SAM 3 Agent로 이 문제를 우회한다.',
 '**cgF1 숫자만 보면 개선폭을 오해하기 쉽다.** "2배 이상"은 SA-Co/Gold라는 특정 벤치마크·특정 baseline(OWLv2⋆) 조건이다. LVIS·COCO 같은 폐쇄어휘 벤치마크에서는 격차가 이보다 작다.',
 '**비디오 다중 객체 추적 비용이 대상 수에 선형 비례한다.** 현재 구조는 객체 간 공유 컨텍스트가 없어, 객체 수가 늘면 GPU를 늘려 병렬화하는 것이 유일한 대응이다.'
],

figures:[
 {f:'fig10-architecture.png',
  cap:'검출기(왼쪽)는 텍스트·기하 프롬프트를 받아 DETR류 디코더로 마스크·박스·점수를 내고, 오른쪽 Exemplar Encoder가 이미지 예시(박스+라벨)를 같은 프롬프트 공간으로 인코딩해 합류한다. 노란 상자가 SAM 3에서 새로 추가된 구성요소, 파란 상자가 SAM 2에서 가져온 부분.',
  src:'원문 Figure 10, p.19'}
],

quotes:[
 {t:'Promptable Concept Segmentation (PCS) takes such prompts and returns segmentation masks and unique identities for all matching object instances.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2511.16719 — SAM 3: Segment Anything with Concepts', u:'https://arxiv.org/abs/2511.16719'},
 {t:'facebookresearch/sam3 (공식 구현)', u:'https://github.com/facebookresearch/sam3'}
]
});
