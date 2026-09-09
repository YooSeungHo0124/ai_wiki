WIKI.paper({
slug:'chameleon',
venue:'arXiv 2024 (Meta FAIR)',
authors:'Chameleon Team (FAIR at Meta)',
arxiv:'2405.09818',

tldr:'이미지를 이산 토큰으로 바꿔 텍스트 토큰과 **하나의 시퀀스**로 처음부터 학습하는 early-fusion 모델. [LLaVA](#/p/llava)류가 사전학습된 비전 인코더를 언어 모델에 나중에 붙이는 것과 정반대로, 처음부터 단일 트랜스포머가 이미지와 텍스트를 구분 없이 다룬다.',

context:'2024년 초 VLM의 주류는 [CLIP](#/p/clip) 같은 사전학습 비전 인코더의 출력을 선형 투영이나 Q-Former로 언어 모델에 "나중에" 붙이는 late fusion이었다([LLaVA](#/p/llava), [Qwen-VL](#/p/qwen-vl), [BLIP-2](#/p/blip2)). 이 방식은 안정적이지만 이미지 이해와 텍스트 생성이 별도 모듈로 남아, 이미지와 텍스트가 임의 순서로 섞인 문서(이미지 사이에 텍스트, 텍스트 사이에 이미지)를 하나의 모델이 생성하기는 어렵다. Chameleon은 질문을 뒤집는다 — 이미지도 언어처럼 토큰이라면, 왜 굳이 나중에 붙이는가?',

ideas:[
 {h:'이미지도 텍스트와 같은 토큰으로',
  lead:'512×512 이미지를 8192 코드북의 이산 토큰 1024개로 양자화해 텍스트와 같은 어휘에 섞는다.',
  d:'[VQGAN](#/p/vqgan) 계열 이미지 토크나이저로 이미지를 1024개의 이산 토큰으로 바꾸고, 이 토큰을 65,536 크기 BPE 어휘(텍스트 토큰 + 8192개 이미지 코드북 토큰)에 합친다. 이렇게 되면 "텍스트-이미지-텍스트"가 그냥 하나의 토큰 시퀀스가 되어, 별도의 비전 인코더나 이미지 디코더 없이 표준 autoregressive 트랜스포머 하나로 이해와 생성을 모두 다룰 수 있다.'},
 {h:'Early fusion: 처음부터 하나의 시퀀스로 학습',
  lead:'후발 융합과 달리 처음부터 전체 파라미터가 이미지·텍스트 토큰을 함께 학습한다.',
  d:'[LLaVA](#/p/llava)나 [Qwen-VL](#/p/qwen-vl)은 언어 모델을 먼저 학습해두고 비전 인코더의 출력을 붙이는 late fusion이다. Chameleon은 이 구분 자체를 없앤다 — 이미지·텍스트·코드가 섞인 데이터로 트랜스포머 전체를 처음부터 학습한다(text-only 2.9T 토큰의 [Llama 2](#/p/llama2) 대비, Chameleon-34B는 5배인 약 9.2T 토큰). 모든 가중치가 두 모달리티에 공유되기 때문에 표현이 자연히 통합되지만, 대신 학습 안정성이 근본적으로 어려워진다.'},
 {h:'불안정성의 원인: softmax의 이동 불변성',
  lead:'모달리티마다 엔트로피가 달라 서로 norm을 키우며 경쟁해 발산한다.',
  d:'$softmax(z) = softmax(z+c)$이므로 모든 가중치를 공유하는 상태에서 이미지와 텍스트 모달리티가 각자 유리하도록 norm을 계속 키우는 방향으로 학습이 흘러간다. 학습 초반에는 문제가 없다가, bf16의 표현 범위를 벗어나는 시점(대개 전체 학습의 20~30%를 지난 뒤)에 갑자기 발산한다. 저자들은 출력 norm의 통제되지 않은 증가가 이후 발산을 예측하는 강한 신호임을 관찰했다.'},
 {h:'QK-Norm + norm 재배치 + dropout/z-loss로 안정화',
  lead:'attention의 query·key에 LayerNorm을 적용해 softmax 입력의 norm 성장을 직접 통제한다.',
  d:'attention 내부에서 query·key 벡터에 layer norm을 적용하는 QK-Norm으로 softmax 입력 norm 성장을 억제하고, Swin 스타일로 정규화 위치를 sublayer 뒤로 재배치([Llama 2](#/p/llama2)의 pre-LN과 다름)해 SwiGLU의 곱셈적 norm 폭증을 억제한다. 여기에 최종 softmax의 logit shift 문제를 잡기 위해 z-loss 정규화를 추가한다. 7B는 QK-Norm+dropout+z-loss가, 34B는 QK-Norm+norm 재배치+z-loss(dropout 없이)가 필요했다 — 모델 크기마다 필요한 안정화 조합이 달랐다.'},
 {h:'정렬(alignment)도 텍스트 전용 레시피를 그대로 확장',
  lead:'이미지·텍스트 혼합 SFT 데이터에 동일한 autoregressive 목적함수를 적용한다.',
  d:'사전학습 후 supervised fine-tuning 단계에서도 새 목적함수를 만들지 않고, 텍스트 전용 LLM에서 쓰던 SFT 레시피(프롬프트 토큰의 손실을 마스킹하는 autoregressive 학습)를 이미지·텍스트가 섞인 데이터에 그대로 적용한다. 이 재사용 가능성 자체가 "이미지가 그냥 토큰"이라는 설계의 이점을 보여준다.'}
],

diagram:{type:'compare', cap:'후발 융합(LLaVA류)과 Chameleon의 early fusion 비교.',
 left:{t:'후발 융합 (LLaVA류)', items:['CLIP 등 별도 비전 인코더','언어모델은 텍스트로 사전학습','투영층으로 나중에 접합','이미지는 이해 전용, 생성 불가']},
 right:{t:'Chameleon: early fusion', items:['이미지도 이산 토큰으로 변환','텍스트+이미지 토큰 처음부터 공동학습','별도 인코더·디코더 없음','임의 순서 이미지+텍스트 생성 가능']}},

math:[
 {expr:'z-loss: L += 1e-5 * log(Z)^2, where Z = sum_i exp(z_i)',
  tex:'\\mathcal{L}_{z} = 10^{-5}\\,\\log^{2}Z,\\qquad Z=\\sum_i e^{z_i}',
  d:'softmax의 분배함수 $Z$ 를 직접 정규화해 최종 출력 logit이 임의로 이동(shift)하는 것을 억제한다. QK-Norm이 attention 내부 softmax를 안정화하는 것과 별개로, 마지막 출력 softmax의 안정화를 위해 추가된 항이다.'},
 {expr:'Chameleon: h = x + attention_norm(attention(x)); out = h + ffn_norm(ffn(h))',
  tex:'\\begin{aligned} h &= x + \\text{attn\\_norm}(\\text{attention}(x)) \\\\ \\text{out} &= h + \\text{ffn\\_norm}(\\text{ffn}(h)) \\end{aligned}',
  d:'[Llama 2](#/p/llama2)의 pre-LN(정규화를 sublayer 진입 전에)과 달리, Chameleon-34B는 정규화를 sublayer 출력 뒤로 재배치한다(Swin 방식). FFN의 SwiGLU가 만드는 곱셈적 norm 폭증을 이 위치 변경이 직접 억제한다.'}
],

numbers:[
 {k:'이미지 토크나이저', v:'512×512 → 토큰 1024개', d:'코드북 크기 8192, [VQGAN](#/p/vqgan) 계열 기반'},
 {k:'전체 어휘', v:'65,536', d:'텍스트 BPE + 이미지 코드북 8192 토큰 통합'},
 {k:'학습 토큰', v:'약 9.2T (34B 기준)', d:'[Llama 2](#/p/llama2)의 text-only 2.9T 대비 약 5배'},
 {k:'text-image 사전학습 데이터', v:'14억 쌍 → 1.5T 토큰', d:'인터리브드 텍스트·이미지 데이터는 별도로 4천억 토큰'},
 {k:'인간 평가 승률', v:'Gemini+ 대비 60.4%, GPT-4V+ 대비 51.6%', d:'혼합 모달 장문 생성 과제에서 34B 모델 기준'},
 {k:'COCO 캡셔닝 CIDEr', v:'120.2 (2-shot, 사전학습) / 140.8 (SFT)', d:'34B 모델, Flamingo-80B·IDEFICS-80B보다 적은 파라미터로 경쟁'}
],

impact:'Chameleon은 "이미지와 텍스트를 하나의 토큰 공간에서 처음부터 함께 학습할 수 있는가"라는 질문에 실용적인 답을 냈다. 이전에도 토큰 기반 이미지 생성([VQGAN](#/p/vqgan), DALL-E)이 있었지만, 텍스트·이미지 이해와 생성을 하나의 autoregressive 모델로 통합해 34B까지 안정적으로 스케일한 것은 새로운 성과였다. QK-Norm과 z-loss로 정리한 불안정성 원인 분석은 이후 다른 멀티모달 early-fusion 모델(Meta의 후속 Llama 4 등)에도 재사용되는 표준 처방이 되었다.',

legacy:[
 '**early fusion 계열의 기준점** — 이후 멀티모달 파운데이션 모델에서 "이미지를 토큰화해 처음부터 같이 학습"하는 설계의 대표 사례로 인용됨',
 '**학습 안정화 레시피의 표준화** — QK-Norm·norm 재배치·z-loss 조합이 멀티모달 대규모 사전학습의 공통 처방으로 자리잡음',
 '**혼합 모달 문서 생성 평가** — 이미지·텍스트가 임의로 섞인 응답을 사람이 직접 비교하는 평가 방법론을 제시, 이후 유사 벤치마크에 영향',
 '**PaLI·InternVL과 다른 축** — [PaLI](#/p/pali)·[InternVL](#/p/internvl)이 "사전학습된 단일 모달 백본을 잇는다"는 노선이라면, Chameleon은 "처음부터 하나로 학습한다"는 반대 극단을 대표'
],

pitfalls:[
 '**"이미지도 토큰이니 late fusion보다 항상 낫다"는 아니다.** VQAv2 등 일부 벤치마크에서는 파인튜닝을 더 많이 거친 LLaVA-1.5가 Chameleon-34B를 앞선다 — early fusion의 강점은 정확도 그 자체보다 혼합 모달 생성 유연성에 있다.',
 '**불안정성은 특정 스케일 이상에서만 드러난다.** 논문 스스로 "8B 파라미터·1T 토큰을 넘기면서 어려워졌다"고 명시한다 — 작은 모델의 안정성만 보고 레시피를 검증했다고 오해하면 안 된다.',
 '**이미지 생성 기능은 공개 체크포인트에서 빠져 있다.** 안전상의 이유로 Meta가 공개한 Chameleon 가중치는 이미지 생성 능력이 제거된 이해 전용 버전이다.'
],

figures:[
 {f:'fig-norm-growth.png',
  cap:'세 곡선 모두 학습 초반엔 비슷하게 출발하지만, QK-Norm과 dropout이 모두 없으면(하늘색) output norm이 걷잡을 수 없이 커진다. 이 norm 폭증이 이후 loss 발산의 선행 신호라는 것이 저자들의 핵심 진단 도구다.',
  src:'원문 Figure 5(a), p.6'},
 {f:'fig-divergence.png',
  cap:'34B 모델은 norm 재배치를 켜도(하늘색) dropout만으로는 발산 스파이크를 못 막는다. norm 재배치 없이(검정)는 5천 스텝 근처에서 loss가 치솟아 완전히 발산한다 — 7B에서 통했던 처방이 34B에서는 그대로 통하지 않았다는 증거.',
  src:'원문 Figure 6(c), p.7'}
],

quotes:[
 {t:'We present Chameleon, a family of early-fusion token-based mixed-modal models capable of understanding and generating images and text in any arbitrary sequence.',
  src:'Abstract, p.1'},
 {t:'We introduce novel modifications to the transformer architecture, such as query-key normalization and revised placement of layer norms, which we find to be crucial for stable training in the mixed-modal setting.',
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 2405.09818 — Chameleon', u:'https://arxiv.org/abs/2405.09818'},
 {t:'Meta AI: Chameleon 공개', u:'https://ai.meta.com/blog/meta-fair-research-new-releases/'}
]
});
