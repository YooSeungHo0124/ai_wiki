WIKI.paper({
slug:'blip2',
venue:'ICML 2023',
authors:'Li et al. (Salesforce Research)',
arxiv:'2301.12597',

tldr:'얼린 이미지 encoder와 얼린 LLM 사이를 **188M짜리 Q-Former 하나**로만 잇고, 2단계로 나눠 학습해 [Flamingo](#/p/flamingo)-80B를 zero-shot VQAv2에서 8.7%p 앞섰다. 학습 파라미터는 54분의 1이다.',

context:'[Flamingo](#/p/flamingo)가 "양쪽을 얼리고 다리만 학습한다"는 틀을 세웠지만, 그 다리가 약 10B 파라미터였다. 얼린 두 모델을 그대로 쓰면서도 연결 비용을 실제로 낮추려면 다른 접근이 필요했다. 문제의 본질은 **modality gap**이다. 이미지 encoder가 뽑은 특징은 LLM이 한 번도 본 적 없는 좌표계에 있고, LLM은 얼려 있으니 그쪽으로 마중 나올 수 없다. 두 모델을 다 열고 end-to-end로 학습하면 정렬은 되지만 비용이 크고 LLM의 언어 능력이 손상된다(catastrophic forgetting). BLIP-2는 정렬 부담을 **전부 중간 모듈 하나에 몰아넣는다**.',

figures:[
 {f:'fig1-qformer-overview.png',
  cap:'왼쪽 상자가 1단계(표현 학습), 오른쪽 상자가 2단계(생성 학습). 가운데 노란 박스가 Q-Former 하나뿐이고, 눈꽃 아이콘(얼린 파라미터)이 이미지 encoder와 LLM 양쪽에 붙어 있다 — 학습되는 건 그 사이의 Q-Former와 쿼리뿐이라는 것이 한눈에 보인다.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-qformer-detail.png',
  cap:'Q-Former 내부. 학습되는 쿼리(맨 아래 색깔 사각형)가 Self Attention으로 서로 소통하고, Cross Attention으로 얼린 Image Encoder를 N번 반복해 읽는다. 위쪽 세 손실(ITM/ITC/ITG)이 같은 구조를 공유하되 attention 마스크만 다르게 걸어 서로 다른 정렬 목표를 학습시킨다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'This paper proposes BLIP-2, a generic and efficient pre-training strategy that bootstraps vision-language pre-training from off-the-shelf frozen pre-trained image encoders and frozen large language models.',
  src:'Abstract, p.1'}
],

ideas:[
 {h:'Q-Former: 학습되는 쿼리 32개가 전부다',
  lead:'학습 가능한 쿼리 32개만 cross-attention으로 이미지 특징을 32토큰으로 압축한다.',
  d:'Q-Former는 BERT-base 크기의 트랜스포머인데, 입력이 이미지가 아니라 **학습 가능한 쿼리 임베딩 32개**(각 768차원)다. 이 쿼리들이 self-attention으로 서로 소통하고, cross-attention으로 얼린 이미지 encoder의 특징을 읽어들여, 최종적으로 32×768 텐서를 내놓는다. 이미지 특징이 몇 개든(ViT-g는 패치 수백 개) 출력은 항상 32개로 압축된다. 정보 병목을 좁게 설계한 것이 핵심이다 — 쿼리 수가 적을수록 **언어와 무관한 시각 정보가 통과하지 못한다**.'},
 {h:'1단계: LLM 없이 표현부터 정렬한다',
  lead:'ITC·ITG·ITM 세 손실로 쿼리가 텍스트로 표현 가능한 시각 정보만 뽑도록 훈련한다.',
  d:'얼린 이미지 encoder에만 붙여 놓고 [BLIP](#/p/blip)에서 온 세 손실 — ITC(대조), ITG(이미지 조건부 텍스트 생성), ITM(매칭) — 을 함께 최적화한다. 손실마다 attention 마스크를 다르게 걸어 쿼리와 텍스트가 서로 얼마나 보이는지를 조절한다(ITC는 서로 못 보게, ITG는 causal, ITM은 완전 개방). 이 단계가 끝나면 32개 쿼리는 **텍스트로 표현 가능한 시각 정보만** 뽑도록 훈련된 상태가 된다.'},
 {h:'2단계: 그 32개를 LLM의 입력 토큰으로 밀어 넣는다',
  lead:'투영한 32개 쿼리를 soft prompt처럼 얼린 LLM 입력 앞에 붙인다.',
  d:'Q-Former 출력에 선형 층 하나를 붙여 LLM 임베딩 차원으로 투영한 뒤, 텍스트 프롬프트 앞에 **soft prompt**처럼 붙인다. 얼린 LLM은 이것을 그냥 토큰으로 읽는다. decoder 계열(OPT)에는 언어 모델링 손실을, encoder-decoder 계열(FlanT5)에는 prefix LM 손실을 쓴다. 1단계에서 이미 쓸모없는 시각 정보를 걸러 놓았기 때문에 이 단계가 짧고 안정적으로 수렴한다.'},
 {h:'2단계로 나누는 것 자체가 기여다',
  lead:'표현 추출과 LLM 언어로 말하기를 분리해야 작은 모듈만으로 충분해진다.',
  d:'논문의 ablation은 1단계를 건너뛰고 곧장 LLM에 연결하면 성능이 크게 떨어지고 학습이 불안정해진다는 것을 보인다. 얼린 두 모델을 잇는 문제를 **"무엇을 뽑을지 배우기"와 "LLM 언어로 말하기"** 두 단계로 분해한 것이, 작은 모듈만으로 충분한 이유다.'},
 {h:'연결 모듈이 작으면 백본을 갈아끼울 수 있다',
  lead:'같은 Q-Former 레시피로 여러 비전·LLM 조합을 그대로 갈아끼울 수 있다.',
  d:'같은 Q-Former 레시피로 ViT-L/ViT-g, OPT-2.7B/6.7B, FlanT5-XL/XXL을 조합해도 전부 동작한다. 이미지 쪽이든 언어 쪽이든 더 좋은 모델이 나오면 다리만 다시 학습하면 되므로, VLM이 두 분야의 발전을 **거의 공짜로 상속**하는 구조가 만들어진다.'}
],

diagram:{type:'compare', cap:'연결 모듈의 크기와 위치 — Flamingo와 BLIP-2의 설계 차이',
 left:{t:'Flamingo (2022)', items:[
  'LM 층 사이 gated x-attn 삽입',
  '시각 토큰이 LM 내부로 들어감',
  '학습 파라미터 약 10B',
  'LM 추론 그래프가 바뀜',
  'Perceiver Resampler → 64 토큰']},
 right:{t:'BLIP-2 (2023)', items:[
  'LM 앞단에 Q-Former 하나만',
  '시각 토큰이 프롬프트 prefix로 들어감',
  '학습 파라미터 188M (54× 감소)',
  'LM은 손대지 않은 채 그대로',
  '학습 쿼리 32개 → 32 토큰']}},

math:[
 {expr:'Z = QFormer(Q, ImageEnc(I)),   Q ∈ R^{32×768}',
  tex:'Z = \\text{QFormer}(Q, \\text{ImageEnc}(I)), \\quad Q \\in \\mathbb{R}^{32 \\times 768}',
  d:'쿼리 $Q$ 는 이미지와 무관한 학습 파라미터다. cross-attention을 통해서만 이미지 정보가 들어오므로, 출력 $Z$ 의 크기는 이미지 해상도·패치 수와 완전히 분리된다.'},
 {expr:'LLM 입력 = [ W·Z ;  텍스트 프롬프트 임베딩 ]',
  tex:'\\text{LLM 입력} = [\\, W \\cdot Z \\;;\\; \\text{텍스트 프롬프트 임베딩} \\,]',
  d:'$W$ 는 Q-Former 출력 차원을 LLM 임베딩 차원으로 맞추는 선형 투영. 얼린 LLM 입장에서 시각 토큰은 그냥 앞에 붙은 32개의 임베딩일 뿐이다 — 이 "prefix로 붙인다"는 인터페이스를 [LLaVA](#/p/llava)가 그대로 이어받는다.'},
 {expr:'Stage 1: L = L_ITC + L_ITG + L_ITM',
  tex:'\\text{Stage 1}: \\mathcal{L} = \\mathcal{L}_{ITC} + \\mathcal{L}_{ITG} + \\mathcal{L}_{ITM}',
  d:'세 손실이 각각 다른 attention 마스킹을 쓴다. ITC는 쿼리-텍스트 상호 차단(정보 누출 방지), ITG는 causal 마스크, ITM은 양방향 개방.'}
],

numbers:[
 {k:'Q-Former 파라미터', v:'188M', d:'유일하게 학습되는 부분. 이미지 encoder와 LLM은 전부 frozen'},
 {k:'학습 쿼리', v:'32개 × 768차원', d:'이미지 하나가 LLM에 전달되는 토큰 수'},
 {k:'zero-shot VQAv2', v:'65.0 (ViT-g + FlanT5-XXL)', d:'Flamingo-80B의 56.3 대비 **+8.7%p**'},
 {k:'학습 파라미터 비교', v:'Flamingo-80B의 1/54', d:'같은 zero-shot VQAv2에서 더 높은 점수'},
 {k:'백본 조합', v:'ViT-L/ViT-g × OPT / FlanT5', d:'같은 레시피로 여러 조합 검증'}
],

impact:'BLIP-2는 VLM 학습의 경제학을 바꿨다. 대형 LLM 사전학습을 감당할 수 없는 팀도, 공개된 비전 encoder와 공개 LLM을 가져다 **다리 하나만 학습해서** 경쟁력 있는 VLM을 만들 수 있게 됐다. Q-Former는 "시각 토큰을 몇 개로 압축하고 어디에 붙일 것인가"를 명시적 설계 변수로 만들었고, 이 32라는 숫자는 이후 여러 모델에서 조정 대상이 된다. 동시에 한계도 분명히 드러냈다. 32개 토큰의 병목은 OCR·세밀한 공간 관계처럼 정보량이 많은 과제에서 손실이 크고, Q-Former 자체를 안정적으로 학습시키는 것이 생각보다 까다로웠다. 이 두 지점이 곧바로 다음 세대의 문제 설정이 된다.',

legacy:[
 '**더 단순한 다리로** — [LLaVA](#/p/llava)가 Q-Former를 통째로 버리고 **선형 투영 한 층 + 패치 토큰 전부**로 더 좋은 결과를 내면서, 오픈 VLM의 주류 레시피가 갈아엎어짐',
 '**압축을 유지하되 위치를 살린다** — [Qwen-VL](#/p/qwen-vl)은 쿼리를 256개로 늘리고 2D 위치 인코딩을 넣어 grounding·OCR에서의 정보 손실을 보완',
 '**얼린 백본 재활용** 전략이 [Adapter](#/p/adapter)·[LoRA](#/p/lora)의 멀티모달판으로 자리 잡으며, 백본 교체가 곧 성능 향상이 되는 모듈식 개발이 표준화',
 '**2단계 학습**(표현 정렬 → 지시 정렬)이라는 골격은 이후 거의 모든 VLM에 남았고, [Qwen-VL](#/p/qwen-vl)에서는 3단계로 확장됨'
],

pitfalls:[
 '**"학습 파라미터 188M = 학습이 싸다"는 과장이다.** 역전파는 얼린 ViT-g와 LLM을 모두 통과해야 하므로 forward/backward 연산량과 activation 메모리는 여전히 크다. 줄어드는 것은 옵티마이저 상태와 저장할 가중치이지 계산량이 아니다.',
 '**32개 토큰의 병목이 실제로 아프다.** 문서 이미지의 글자, 여러 객체의 상대 위치처럼 공간 정보가 촘촘한 입력은 32개 쿼리로 압축되며 상당 부분 소실된다. BLIP-2가 OCR·grounding에 약한 이유는 데이터가 아니라 구조 때문이다.',
 '**얼린 LLM은 이미지를 보고 지시를 따르도록 조정된 적이 없다.** BLIP-2의 대화 능력·지시 이행은 사용한 LLM(특히 FlanT5의 [instruction tuning](#/p/flan)) 덕분이며, 시각 지시 데이터로 학습한 것이 아니다. 이 빈자리를 [LLaVA](#/p/llava)가 정확히 겨냥한다.'
],

links:[
 {t:'arXiv 2301.12597 — BLIP-2: Bootstrapping Vision-Language Pre-training with Frozen Image Encoders and Large Language Models', u:'https://arxiv.org/abs/2301.12597'},
 {t:'공식 구현 (LAVIS)', u:'https://github.com/salesforce/LAVIS/tree/main/projects/blip2'}
]
});
