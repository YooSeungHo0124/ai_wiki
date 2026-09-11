WIKI.paper({
slug:'molmo',
venue:'arXiv 2024',
authors:'Deitke, Clark, Lee et al. (Allen Institute for AI · University of Washington)',
arxiv:'2409.17146',

tldr:'오픈 웨이트 VLM 다수가 실제로는 GPT-4V 같은 폐쇄형 모델이 만든 합성 캡션을 증류한 것이라고 지적하고, **VLM을 전혀 쓰지 않고** 사람이 이미지를 60~90초간 말로 설명하게 해 모은 PixMo 데이터로 처음부터 학습한 VLM을 내놓는다.',

context:'[LLaVA](#/p/llava)는 완전히 공개된 가중치와 데이터로 시작했지만 이후 최고 성능 오픈 VLM들은 점점 덜 열린 데이터에 의존하게 됐다 — 예컨대 ShareGPT4V류 데이터셋은 GPT-4V로 상세 캡션을 생성해 그 결과를 학습하는 방식이라, 사실상 폐쇄형 VLM을 **증류**한 것이다. 그 결과 학계는 "VLM을 처음부터 어떻게 잘 만드는가"에 대한 지식 자체를 잃어가고 있었다. 직접 사람에게 긴 캡션을 쓰게 하는 것도 답이 아니다 — 사람은 몇 가지 두드러진 요소만 짧게 적는 경향이 있고, 긴 문단을 타이핑하는 데 시간이 오래 걸리며, 크라우드워커가 몰래 폐쇄형 VLM의 답을 복사-붙여넣기할 위험도 있다.',

ideas:[
 {h:'음성으로 캡션을 모은다: 말은 길게, 쓰기는 안 시킨다',
  lead:'주석자에게 이미지를 60~90초간 소리내어 설명하게 하고 그 녹음을 텍스트로 옮긴다.',
  d:'글로 쓰라고 하면 짧고 부실한 캡션이 나오지만, **말로 설명하라**고 하면 같은 시간에 훨씬 상세한 묘사가 나온다는 것이 논문의 발견이다. 각 캡션마다 주석자의 실제 음성 녹음이 "영수증"으로 남아, 그 설명이 VLM의 답을 복사한 게 아니라 사람이 직접 만든 것임을 증명한다. 이렇게 모은 PixMo-Cap은 712k장 이미지에 200단어 이상의 상세 캡션을 붙인 사전학습 데이터다.'},
 {h:'2D 포인팅으로 grounding 데이터를 빠르게 모은다',
  lead:'바운딩박스·세그멘테이션 대신 점 찍기로 230만 건의 grounding 주석을 모은다.',
  d:'객체·표현·장면에 점을 찍게 하는 것이 박스를 그리거나 마스크를 칠하는 것보다 훨씬 빠르고 쉬워서, 이 방식으로 230만 건 이상의 grounding 주석을 모았다(PixMo-Points). 이 데이터 덕분에 Molmo는 "질문에 답할 때 근거가 되는 픽셀을 가리키기", 그리고 **점을 찍어서 세는 방식의 카운팅**을 할 수 있게 됐다. 저자들은 이것이 로봇·웹 에이전트가 "가리켜서 행동하는" 미래의 기반이 될 것으로 본다.'},
 {h:'AskModelAnything: LLM과의 상호작용으로 지시-따르기 데이터 생성',
  lead:'사용자가 언어 전용 LLM과 대화하며 응답을 대화식으로 수정해 고품질 지시 데이터를 만든다.',
  d:'73k개 이미지에 대해 162k개의 지시-따르기 주석을 사람이 언어 전용 LLM과 상호작용하며 답을 다듬는 방식으로 모았다. 이미지 캡션·OCR 결과를 LLM에 주고 질문과 초기 답을 만든 뒤, 사람이 편집을 제안하는 루프로 정확도를 높인다.'},
 {h:'VLM 없이 만든 합성 데이터로 특정 스킬 보강',
  lead:'시계 읽기·차트 이해 같은 스킬은 렌더링·코드 생성으로 VLM 개입 없이 합성한다.',
  d:'PixMo-Clocks(합성 시계 이미지), PixMo-Docs(차트·표·다이어그램) 등은 비-VLM 탐지기·LLM·렌더러 조합으로 만들어졌다 — LLM은 쓰지만 이미지-텍스트 쌍을 만드는 데 VLM 자체를 쓰지 않는다는 원칙을 지킨다. 이 데이터가 문서 이해·시계 읽기 같은 세부 스킬을 보완한다.'},
 {h:'단순한 구조: 비전 인코더 + 커넥터 + LLM, 개선은 학습 절차에',
  lead:'CLIP류 비전 인코더에 커넥터·LLM을 붙인 표준 구조를 쓰되 크롭·학습 순서를 개선한다.',
  d:'구조 자체는 CLIP(또는 MetaCLIP/SigLIP) 비전 인코더 + 커넥터 + LLM(OLMo/OLMoE/Qwen2)이라는 표준 조합이다. 다만 이미지를 여러 정사각형으로 겹치게 잘라 타일링하는(overlapping multi-crop) 방식, 2단계 학습 파이프라인, 여러 주석이 달린 이미지를 효율적으로 학습하는 방법 등에서 새로운 개선을 더했다.'}
],

diagram:{type:'compare', cap:'폐쇄형 VLM에 의존한 기존 오픈 VLM 데이터 수집과 PixMo의 무-VLM 수집 방식.',
 left:{t:'기존: VLM 증류', items:['GPT-4V로 캡션 생성','텍스트로 직접 캡션 작성','폐쇄형 모델 답 복제 위험']},
 right:{t:'PixMo: 무-VLM 수집', items:['음성으로 60~90초 설명','점 찍기로 grounding 230만건','합성 데이터도 비-VLM 파이프라인']}
},

numbers:[
 {k:'PixMo-Cap', v:'712k 이미지 · 200+ 단어 캡션', d:'음성 설명 → 텍스트 변환 → LLM 재작성'},
 {k:'PixMo-Points grounding', v:'230만 건 이상', d:'객체·표현·장면에 점 찍기로 수집'},
 {k:'AskModelAnything', v:'162k 주석 · 73k 이미지', d:'사람-LLM 상호작용으로 지시-따르기 데이터 생성'},
 {k:'Molmo-72B academic 평균', v:'81.2', d:'10개 학술 벤치마크 + PixMo-Count 평균, Table 1'},
 {k:'Molmo-72B 인간평가 Elo', v:'1077 (전체 2위)', d:'GPT-4o(1079, 1위) 다음, Claude-3.5 Sonnet(1069)·Gemini 1.5 Pro(1074)보다 높음'},
 {k:'MolmoE-1B', v:'academic 68.6 · Elo 1032', d:'OLMoE-1B-7B MoE 기반, GPT-4V(Elo 1041)에 근접'}
],

impact:'Molmo는 "오픈 웨이트 = 오픈 데이터"가 아니라는 사실을 정면으로 짚었고, 실제로 VLM 없이 처음부터 경쟁력 있는 VLM을 만들 수 있음을 GPT-4o 다음가는 인간평가 순위로 입증했다. 음성 기반 캡션 수집과 포인팅 기반 grounding은 이후 오픈 데이터셋 구축자들에게 "VLM 증류에 의존하지 않는" 대안 레시피를 제공했다. 포인팅을 답변의 근거 제시이자 행동(가리키기)의 기본 단위로 삼은 접근은 VLM을 로봇·에이전트에 연결하는 논의에도 영향을 줬다.',

legacy:[
 '**무-VLM 데이터 수집 레시피의 확산** — 음성 캡션·포인팅 방식이 이후 오픈 데이터셋 프로젝트에서 재사용되는 참조 사례가 됨',
 '**포인팅을 grounding의 1급 시민으로** — 바운딩박스 대신 점을 답변·카운팅의 기본 단위로 쓰는 접근이 이후 에이전트형 VLM 논의에 영향',
 '**PixMo 공개** — 데이터셋 자체가 공개되어 다른 연구팀이 VLM 없이 학습한 모델을 재현·검증할 수 있게 됨',
 '**"오픈 웨이트만으로는 부족하다"는 문제의식 확산** — 이후 VLM 논문들이 데이터 출처(합성 여부·증류 여부)를 명시하는 관행에 영향'
],

pitfalls:[
 '**"완전히 인간이 만든 데이터"라는 말이 LLM을 전혀 안 썼다는 뜻은 아니다.** 음성 전사 후 LLM으로 스타일을 다듬거나(재작성), AskModelAnything에서 언어 전용 LLM을 대화 상대로 쓴다 — 배제한 것은 어디까지나 **VLM**(이미지를 보는 모델)이다.',
 '**추론·reasoning 벤치마크에서는 상대적으로 약하다.** 논문 스스로 학습 데이터 구성이 고급 추론에 초점을 두지 않아 reasoning 과제에서 다른 모델보다 뒤처진다고 인정한다.',
 '**Elo 순위와 academic 벤치마크 순위가 항상 일치하지 않는다.** 논문은 Qwen2-VL 계열이 academic 벤치마크에서는 강하지만 인간평가에서는 상대적으로 낮은 사례를 직접 언급한다 — 벤치마크 종류에 따라 순위가 바뀔 수 있다.'
],

figures:[
 {f:'fig-caption-pipeline.png', cap:'PixMo-Cap 수집 파이프라인: 주석자가 이미지를 음성으로 설명 → 음성을 텍스트로 전사 → LLM이 문체를 다듬어 최종 캡션을 만든다. 글쓰기가 아니라 말하기를 시킨 것이 핵심.',
  src:'원문 Figure 1 (Captions 행), p.2'},
 {f:'fig-pointing.png', cap:'PixMo-Points 수집: 주석자가 카테고리를 고르고 이미지 위에 점을 찍는다(가운데). 바운딩박스·마스크보다 훨씬 빠르게 grounding 데이터를 모으는 방법.',
  src:'원문 Figure 1 (Pointing 행), p.2'}
],

quotes:[
 {t:'The strongest open-weight models rely heavily on synthetic data from proprietary VLMs to achieve good performance, effectively distilling these closed VLMs into open ones.',
  src:'Abstract, p.1'},
 {t:'Instead, we ask annotators to describe images in speech for 60 to 90 seconds.',
  src:'Section 2, p.2'}
],

links:[
 {t:'arXiv 2409.17146 — Molmo and PixMo', u:'https://arxiv.org/abs/2409.17146'},
 {t:'Molmo (Allen Institute for AI)', u:'https://molmo.allenai.org/blog'}
]
});
