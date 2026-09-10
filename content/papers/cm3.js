WIKI.paper({
slug:'cm3',
venue:'arXiv 2022 (Facebook AI Research)',
authors:'Aghajanyan, Huang, Ross, Karpukhin, Xu, Goyal, Okhonko, Joshi, Ghosh, Lewis, Zettlemoyer (Meta AI)',
arxiv:'2201.07520',

tldr:'HTML 문서를 텍스트·하이퍼링크·이미지 토큰이 원래 순서 그대로 섞인 하나의 시퀀스로 두고, 일부 구간만 문서 끝으로 옮겨 생성하는 **causally masked** 목적함수로 학습한 decoder-only 멀티모달 모델. 캡션 없이 순수 HTML 구조만으로 [DALL·E](#/p/dalle)식 이미지 생성·캡셔닝·개체 연결을 전부 zero-shot으로 흉내 낸다.',

context:'2022년 초 시점에 텍스트 사전학습은 두 갈래로 갈려 있었다 — [BERT](#/p/bert)류 masked LM은 fine-tuning 판별 과제에 강하지만 학습 중 예측하는 토큰이 전체의 15% 정도뿐이고, [GPT](#/p/gpt1)류 causal LM은 모든 토큰을 예측해 효율적이지만 왼쪽 문맥만 볼 수 있어 프롬프트 중간을 채워 넣는 작업에 약하다. 같은 팀의 앞선 연구 HTLM(Aghajanyan et al. 2021)은 HTML 구조를 그대로 학습 데이터로 써서 강한 zero-shot 성능을 보였지만 BART식 encoder-decoder 구조였다. 한편 이미지 쪽에서는 [CLIP](#/p/clip)·DALL·E가 사람이 정성껏 큐레이션한 이미지-캡션 쌍으로 학습했다. CM3는 두 흐름을 합친다 — **큐레이션된 쌍이 아니라 웹에 실제로 존재하는 HTML 문서**(이미지가 `<img src=...>` 로 텍스트 사이에 자연스럽게 끼어 있는)를 그대로 학습 데이터로 쓰고, decoder-only 구조에서 masked LM의 양방향성을 흉내 낼 방법을 찾는다.',

ideas:[
 {h:'Causally masked objective: 마스크 구간을 문서 끝으로 옮겨 생성',
  lead:'일부 구간을 <mask:i> 토큰으로 치환해 끝으로 이동시킨 뒤, 좌→우로 전체를 생성하며 그 구간도 끝에서 채운다.',
  d:'문서 길이 $s$에서 평균적으로 짧은 개수(포아송(1), 1~16으로 클램프)의 비교적 긴 구간을 무작위로 골라 `<mask:0>`, `<mask:1>` 같은 번호 토큰으로 치환하고, 원래 그 구간의 내용은 문서 맨 끝에 순서대로 이어 붙인다. 모델은 여전히 순수 causal LM처럼 좌→우로 전 토큰을 예측하지만, 마스크된 구간을 채울 때는 그 구간 **뒤쪽 문맥까지 이미 앞에서 다 본 상태**라 사실상 양방향 정보를 쓴다. masked LM처럼 15%만 학습 신호로 쓰는 낭비 없이 모든 토큰에 loss를 건다.'},
 {h:'HTML 구조를 지우지 않고 최소화해서 그대로 토큰 시퀀스로',
  lead:'DOM에서 의미 없는 요소만 걷어내고 텍스트·링크·이미지 태그는 원문 순서 그대로 남긴다.',
  d:'header·footer·form·iframe처럼 본문과 무관한 요소는 제거하지만, `<a href=...>` 링크와 `<img src=...>` 이미지 태그는 원래 위치에 남긴다. 이미지는 256×256으로 잘라 VQVAE-GAN으로 256개 토큰의 문자열로 바꾼 뒤 그 문자열을 `src` 속성 값 자리에 그대로 끼워 넣는다 — 이미지가 "첨부"가 아니라 **문서 텍스트의 일부**가 된다.'},
 {h:'캡션-이미지 쌍이 아니라 CC-NEWS + 위키백과 전체를 학습 데이터로',
  lead:'사람이 고른 이미지-캡션 쌍 대신, 이미지가 원래 박혀 있던 뉴스·백과 문서 전체(약 1TB)를 그대로 쓴다.',
  d:'Common Crawl 전체를 쓰면 노골적으로 유해한 이미지-텍스트 쌍이 섞인다는 선행 비판(Birhane et al. 2021)을 근거로, CC-NEWS 일부와 영어 위키백과 전체만 선택했다. 문서 6,100만 개, 이미지 2,500만 장, 토큰 2,230억 개 규모다. 이미지 개수·위치에 제약을 두지 않아 한 문서에 이미지가 여러 장 섞인 경우도 그대로 학습된다.'},
 {h:'하나의 모델로 여러 zero-shot 과제를 프롬프트만 바꿔 흉내',
  lead:'같은 가중치를 `<img src="`로 프롬프트하면 이미지 생성, `alt=`를 채우게 하면 캡셔닝이 된다.',
  d:'생성 방향을 문서 구조로 통제한다. `<img src="` 뒤를 비우고 생성시키면 이미지 토큰이 나와 DALL·E식 조건부/무조건 이미지 생성이 되고, 이미지 뒤 `alt`나 `title` 속성을 마스크해 채우게 하면 캡셔닝이 된다. 위키백과의 링크 구조를 그대로 학습했기 때문에 `<a href=`를 채우는 프롬프트만으로 개체 연결(entity linking)·개체 명확화도 별도 헤드 없이 zero-shot으로 수행한다.'}
],

diagram:{type:'compare', cap:'같은 마스크 하나를 두고 causal LM은 뒤 문맥을 못 보지만, masked LM은 위치 정보를 잃고, causally masked는 둘을 절충한다.',
 left:{t:'기존: MLM vs causal LM', items:['MLM: 양방향이지만 15%만 예측','causal LM: 전토큰 예측이지만 좌측 문맥뿐','둘 다 이미지-텍스트 쌍 큐레이션 필요']},
 right:{t:'CM3: causally masked', items:['마스크 구간을 문서 끝으로 이동 후 생성','전 토큰 예측 + 사실상 양방향 문맥','HTML 문서 그대로, 큐레이션 불필요']}},

math:[
 {expr:'n ~ Clamp(Poisson(1), 1, 16),  m ~ (Uniform(0,s), Uniform(0,s))',
  tex:'n \\sim \\text{Clamp}(\\text{Poisson}(1),\\,1,\\,16),\\qquad m \\sim \\big(\\text{Uniform}(0,s),\\ \\text{Uniform}(0,s)\\big)',
  d:'길이 $s$인 문서에서 마스크 개수 $n$과 각 마스크의 구간 $m$을 뽑는 방식. 겹치지 않는 상대적으로 적고 긴 구간을 고르도록 설계했다.'}
],

numbers:[
 {k:'학습 데이터', v:'CC-NEWS+위키 843GB · 2230억 토큰', d:'문서 6,100만 개, 이미지 2,500만 장(이미지당 256토큰)'},
 {k:'모델 크기', v:'125M / 800M / 2.7B / 13B', d:'다운스트림 평가는 2.7B(CM3-Medium)·13B(CM3-Large)만 사용'},
 {k:'시퀀스 길이', v:'2048 토큰', d:'GPU당 배치 8, Adam(β1=0.9, β2=0.98)'},
 {k:'zero-shot 캡셔닝(MS-COCO) BERTScore F1', v:'0.864', d:'CLIP으로 32개 샘플 중 재선별(CM3-Caption-CLIP) 시. beam search만 쓰면 0.785'},
 {k:'zero-shot 요약(CNN/DM) ROUGE-1/2/L', v:'38.88/16.27/34.16', d:'CM3-Large, 뉴스 기반 3개 요약 벤치마크에서 당시 SOTA'},
 {k:'zero-shot 개체 명확화(평균)', v:'약 80% 부근', d:'과제별로 76.2~82.8%, 지도학습 모델(약 88~95%)에는 못 미치지만 비지도로는 유의미'}
],

impact:'"큐레이션된 이미지-텍스트 쌍" 없이도 웹 문서의 자연스러운 구조만으로 멀티모달 생성·이해를 동시에 학습할 수 있음을 보였다. 하나의 decoder-only 가중치가 프롬프트만 바꿔 이미지 생성·캡셔닝·개체 연결·요약을 넘나드는 것은, 이후 "범용 멀티모달 시퀀스 모델"이라는 설계 방향(입력·출력 형식을 아키텍처가 아니라 프롬프트로 구분)의 초기 실증이 됐다. causally masked objective는 인필링(infilling)을 순수 decoder-only causal LM 안에서 구현하는 표준적인 방법 중 하나로 자리잡았다.',

legacy:[
 '**causal masking을 코드 인필링에 적용** — [InCoder](#/p/incoder)가 같은 구간-이동 마스킹 방식을 코드 생성/삽입에 채택',
 '**HTML 구조를 그대로 학습 데이터로 쓰는 계보 확장** — [Chameleon](#/p/chameleon)이 토큰화된 이미지·텍스트를 완전히 통합한 단일 시퀀스 모델로 발전',
 '**프롬프트로 생성/이해 과제를 오가는 단일 모델 설계** — [Flamingo](#/p/flamingo)·[DALL·E 2](#/p/dalle2) 등 후속 멀티모달 생성 모델의 비교·인용 대상',
 '**"이미지-캡션 쌍 큐레이션 없이도 된다"는 실증** — 대규모 노이즈 웹 데이터로도 멀티모달 사전학습이 가능하다는 방향에 힘을 실음'
],

pitfalls:[
 '**size hint(마스크 길이 힌트)는 오히려 성능을 떨어뜨렸다.** 선행 HTLM은 `<mask>12`처럼 마스크 크기를 명시적으로 줬지만, CM3에서는 이 힌트가 perplexity와 zero-shot 성능을 모두 악화시켜 제거했다 — "더 많은 정보를 주면 좋다"는 직관이 여기선 틀렸다.',
 '**125M·800M 모델은 하이퍼파라미터 탐색용으로 "충분히 학습되지 않았다"고 저자가 명시한다.** 모든 다운스트림 비교는 2.7B(Medium)·13B(Large)로만 이뤄지므로, 작은 모델의 수치를 본체 성능과 혼동하면 안 된다.',
 '**Reddit TIFU 요약에서는 CM3가 HTLM보다 뚜렷이 낮다.** 학습 데이터가 CC-NEWS·위키뿐이라 Reddit 특유의 비격식 요약 스타일을 못 배웠기 때문이라고 저자들이 직접 설명한다 — "더 큰 모델이 항상 더 잘한다"는 가정이 데이터 도메인 불일치 앞에서 깨지는 사례다.'
],

figures:[
 {f:'fig1-causal-masking.png',
  cap:'세 목적함수를 같은 문장으로 비교. 맨 위(Causally Masked)는 마스크 구간(주황)을 문서 끝으로 옮겨 생성하되 전체를 좌→우로 생성한다. 가운데(Masked)는 <mask> 하나로 뭉개고 그 내용은 따로 예측한다(15%만 학습). 맨 아래(순수 causal LM)는 왼쪽 문맥만으로 예측하므로 뒤쪽에 있는 위키 링크(주황)를 애초에 생성할 수 없다.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'The casual masking object provides a type of hybrid of the more common causal and masked language models, by enabling full generative modeling while also providing bidirectional context when generating the masked spans.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2201.07520 — CM3: A Causal Masked Multimodal Model of the Internet', u:'https://arxiv.org/abs/2201.07520'}
]
});
