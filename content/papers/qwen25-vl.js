WIKI.paper({
slug:'qwen25-vl',
venue:'arXiv 2025 (Technical Report)',
authors:'Qwen Team, Alibaba Group',
arxiv:'2502.13923',

tldr:'[Qwen2-VL](#/p/qwen2-vl)의 동적 해상도·M-RoPE를 그대로 이어받되, ViT에 **window attention**을 넣어 연산량을 줄이고 시간 축 위치 ID를 **절대 시간에 정렬**해 시간 단위(초) 사건 로컬라이제이션과 문서 파싱을 정조준한다.',

context:'[Qwen2-VL](#/p/qwen2-vl)은 동적 해상도와 M-RoPE로 임의 크기 이미지·영상을 처리할 수 있었지만, 저자들은 여전히 세 가지 병목을 지적한다 — ViT가 전체 이미지에 대해 dense attention을 계산해 연산량이 크고, 긴 영상에서 프레임 수만큼 시간 위치 ID가 늘어나 사건의 실제 발생 시각과 위치 ID가 어긋나며, 세밀한 객체 위치 지정·문서 구조 파싱은 별도로 강화되지 않았다. Qwen2.5-VL은 "정확도를 유지하면서 계산을 줄이고, 위치 ID가 실제 시계와 어긋나지 않게 하자"는 문제의식에서 출발한다.',

ideas:[
 {h:'Window Attention: ViT 대부분을 지역 attention으로',
  lead:'ViT 블록 대부분에 윈도우 단위 attention을 쓰고 소수 층만 full attention을 유지한다.',
  d:'재설계한 ViT는 대부분의 블록에서 8×8 패치 윈도우 안에서만 attention을 계산하는 window attention을 쓰고, 일부 층(논문 구성상 4개 층)만 전체 시퀀스에 대한 full attention을 유지한다. 나머지는 그대로 FFN에 SwiGLU, 정규화에 RMSNorm을 쓴 표준 LLM 블록 구성으로 바꿨다. 이 조합으로 네이티브 해상도를 유지하면서도 ViT 연산 비용을 크게 낮췄다.'},
 {h:'MRoPE Aligned to Absolute Time: 위치 ID를 초 단위 시계로',
  lead:'프레임 순번이 아니라 실제 재생 시각(초)에 비례하도록 시간 위치 ID를 매긴다.',
  d:'[Qwen2-VL](#/p/qwen2-vl)의 M-RoPE는 시간 ID가 프레임 개수에 묶여 있어, FPS가 다른 두 영상에서 같은 시간 ID가 서로 다른 실제 시각을 가리켰다. Qwen2.5-VL은 시간 ID 간격을 절대 시간 간격에 맞춰, "8초 지점의 사건"을 프레임 수와 무관하게 같은 위치 ID로 표현한다. 이 덕분에 초 단위 사건 로컬라이제이션과 다양한 프레임레이트 학습(dynamic FPS sampling)이 자연스럽게 맞물린다.'},
 {h:'동적 FPS 샘플링으로 긴 영상을 몇 시간까지',
  lead:'학습 시 영상마다 다른 FPS로 샘플링해 초 단위 절대시간 정렬과 결합한다.',
  d:'영상을 0.5/1/2 FPS 등 다양한 프레임레이트로 샘플링해 학습하고, Conv3D로 2배 시간 병합을 적용한다. 절대 시간 정렬 M-RoPE와 합쳐져, 수 시간짜리 영상에서도 특정 사건이 몇 초에 일어났는지 짚어낼 수 있다.'},
 {h:'문서 파싱을 위한 구조화 출력(QwenVL HTML)',
  lead:'표·손글씨·화학식·악보까지 포함한 문서를 구조화 형식으로 출력하도록 학습한다.',
  d:'OCR을 넘어 표·양식·차트·손글씨·화학식·악보까지 다루는 "omni-document parsing"을 지향한다. 절대 좌표와 JSON 형식을 동시에 지원해 객체 검출·포인팅·개수 세기 같은 공간 추론 결과를 구조화된 형식으로 뽑아낸다.'},
 {h:'사전학습 코퍼스 1.2T → 4.1T 토큰',
  lead:'데이터 규모를 3배 이상 늘리고 고품질 필터링을 강화한다.',
  d:'모델 구조 변경과 별개로, 사전학습 데이터를 1.2조 토큰에서 4.1조 토큰으로 늘렸다. 3B/7B/72B 세 크기를 유지하되, 데이터 큐레이션 품질을 높인 것이 함께 보고된 핵심 기여로 명시된다.'}
],

diagram:{type:'compare', cap:'Qwen2-VL 대비 Qwen2.5-VL이 ViT와 시간 위치 인코딩에서 바꾼 지점.',
 left:{t:'Qwen2-VL', items:['ViT 전역 dense attention','시간 ID = 프레임 순번','고정 FPS 가정']},
 right:{t:'Qwen2.5-VL', items:['대부분 window attention','시간 ID = 절대 시간(초)','동적 FPS 샘플링']}
},

numbers:[
 {k:'사전학습 토큰', v:'1.2T → 4.1T', d:'Qwen2-VL 대비 3배 이상 확대'},
 {k:'모델 크기', v:'3B / 7B / 72B', d:'2B 대신 3B로 최소 크기 변경'},
 {k:'MMMU (val), 72B', v:'70.2', d:'Qwen2-VL-72B 64.5, GPT-4o 69.1보다 높음 (Table 3)'},
 {k:'MathVista (mini), 72B', v:'74.8', d:'Qwen2-VL-72B 70.5 대비 개선 (Table 3)'},
 {k:'DocVQA (test), 72B', v:'96.4', d:'Qwen2-VL-72B 96.5와 거의 동급, 이전 오픈소스 SoTA 95.2 상회 (Table 5)'},
 {k:'OCRBench, 72B', v:'885', d:'Qwen2-VL-72B 854 대비 개선 (Table 5)'}
],

impact:'Window attention으로 ViT 연산을 줄이면서 성능을 유지한 것은, "네이티브 해상도를 위해서는 비용을 감수해야 한다"는 Qwen2-VL식 트레이드오프에 대한 답이 됐다. 절대 시간 정렬 M-RoPE는 긴 영상 이해를 "몇 번째 프레임"이 아니라 "몇 초 지점"으로 다루는 방향을 열어, 시간 단위 사건 검색·요약이 벤치마크 항목으로 자리잡는 데 기여했다. 문서 파싱·그라운딩 강화는 VLM을 순수 QA 모델에서 OCR·에이전트 파이프라인의 대체재로 미는 흐름을 가속했다.',

legacy:[
 '**Window attention의 재확인** — ViT 전역이 아니라 지역 연산으로 충분하다는 관찰이 이후 오픈 VLM 인코더 설계에 반영됨',
 '**절대 시간 정렬 위치 인코딩** — 프레임 수 종속을 없앤 시간 인코딩 방식이 긴 영상 이해 모델 전반의 참고 설계가 됨',
 '**문서·에이전트 특화 VLM** — OCR을 넘어선 구조화 문서 파싱과 화면 조작 에이전트가 이후 VLM 로드맵의 표준 항목이 됨',
 '**데이터 스케일 경쟁** — 1.2T→4.1T 토큰 확장이 오픈 VLM 사전학습 코퍼스 규모 경쟁을 재점화'
],

pitfalls:[
 '**"window attention이 항상 더 빠르고 손실 없다"는 단순화다.** 전 층이 아니라 대부분의 층에만 적용하고 일부 층은 여전히 full attention을 유지하는 하이브리드 설계다 — 전부 지역화한 것이 아니다.',
 '**벤치마크 표(Table 3, 5)의 비교 모델 목록이 논문마다 다르다.** InternVL2.5-78B처럼 파라미터 규모가 다른 모델과 나란히 비교되므로, 크기를 맞추지 않은 채 점수만 비교하면 잘못된 결론에 이르기 쉽다.',
 '**절대 시간 정렬은 FPS 메타데이터가 정확할 때만 의미가 있다.** 영상의 실제 재생 속도 정보가 없거나 잘못되면 "절대 시간"이라는 전제 자체가 깨진다.'
],

figures:[
 {f:'fig-arch.png', cap:'왼쪽 파이프라인은 이미지·영상이 각기 다른 토큰 수(11427/8/1125/644~2576)로 압축되는 과정이고, 가운데 "Align with Absolute Time"이 프레임 순번이 아닌 초 단위로 MRoPE 시간 ID를 매기는 부분이다. 오른쪽 인코더 블록은 대부분 Window Attention(×M), 일부만 Full Attention(×1)을 쓰는 구성을 보여준다.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'Notably, MRoPE aligns time IDs with absolute time along the temporal dimension, enabling the model to better comprehend temporal dynamics, such as the pace of events and precise moment localization.',
  src:'Figure 1 caption, p.3'}
],

links:[
 {t:'arXiv 2502.13923 — Qwen2.5-VL Technical Report', u:'https://arxiv.org/abs/2502.13923'},
 {t:'GitHub — QwenLM/Qwen2.5-VL', u:'https://github.com/QwenLM/Qwen2.5-VL'}
]
});
