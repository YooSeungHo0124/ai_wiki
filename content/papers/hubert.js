WIKI.paper({
slug:'hubert',
venue:'IEEE/ACM TASLP 2021',
authors:'Hsu, Bolte, Tsai, Lakhotia, Salakhutdinov, Mohamed (Facebook AI)',
arxiv:'2106.07447',

tldr:'음성에서도 [BERT](#/p/bert)처럼 마스킹 예측으로 사전학습하되, "정답 토큰"을 대조학습이 아니라 **k-means 클러스터링을 반복 정제**해서 만든 논문. 클러스터 100개짜리 거친 타깃으로 시작해도, 반복할수록 표현이 좋아지고 결국 [wav2vec 2.0](#/p/wav2vec2)과 동급이거나 더 나은 성능에 도달한다.',

context:'[wav2vec 2.0](#/p/wav2vec2)은 연속 파형에 BERT식 마스킹을 적용하는 문제를 대조학습으로 풀었다 — 코드북과 표현을 동시에 학습시켜 "이산 정답"을 즉석에서 만들어낸다. 그런데 이 방식은 구조가 복잡하다. 코드북 붕괴를 막을 다양성 손실, distractor 샘플링, Gumbel softmax까지 손실 함수 자체에 여러 장치가 얽혀 있다. HuBERT 저자들은 다른 길을 택한다 — **정답을 손실 함수 안에서 즉석으로 만들지 말고, 학습 밖에서 미리 만들어 두자.** 문제는 음성에는 텍스트의 어휘집 같은 것이 없고(사전에 정해진 이산 단위 부재), 음소 경계도 모르고(가변 길이·비분절), 한 발화에 여러 음향 단위가 동시에 섞여 있다는 점이다(CV의 단일 인스턴스 분류 가정이 깨짐). HuBERT는 이 세 문제를 "타깃 라벨이 완벽하지 않아도, **일관되기만 하면** 모델이 알아서 언어모델을 배운다"는 관찰로 우회한다.',

ideas:[
 {h:'타깃은 정답이 아니라 일관된 신호면 된다',
  lead:'k-means 라벨이 틀려도 일관되면 모델이 스스로 음향·언어 모델을 학습한다.',
  d:'MFCC 39차원에 k-means를 돌린 클러스터 100개는 음소와 대충만 겹치는 거친 라벨이다. 그런데도 이 라벨을 맞히려면 모델은 가려지지 않은 구간에서 좋은 표현을 뽑아 마스킹된 구간의 라벨을 **문맥으로 추론**해야 한다. 라벨의 정답률보다 라벨의 **일관성**이 학습을 이끄는 핵심이라는 것이 저자들의 주장이고, 실제로 거친 MFCC 타깃만으로 학습을 시작해도 무너지지 않는다.'},
 {h:'BERT의 마스킹을 연속 신호로 옮기는 법',
  lead:'CNN 인코더 출력을 프레임 단위로 마스킹하고 손실은 마스킹된 자리에만 건다.',
  d:'[BERT](#/p/bert)는 이산 토큰 자리를 `[MASK]`로 바꾸고 그 자리의 어휘 인덱스를 맞히는 분류 문제다. HuBERT는 CNN 인코더가 뽑은 연속 프레임 시퀀스에서 시작 지점의 $p\\%$를 뽑아 길이 $l$짜리 구간을 학습된 마스크 임베딩으로 치환한다. 손실은 마스킹된 프레임에만 거는 $L_m$과 마스킹 안 된 프레임까지 포함하는 $L_u$의 가중합 $L=\\alpha L_m+(1-\\alpha)L_u$이며, $\\alpha$를 크게 잡을수록 "가려진 곳을 문맥으로 추론"하는 신호가 강해진다.'},
 {h:'클러스터 앙상블: 여러 개의 나쁜 타깃이 하나의 좋은 신호를 만든다',
  lead:'서로 다른 k-means 앙상블 결과를 곱집합으로 합쳐 타깃 노이즈를 상쇄한다.',
  d:'클러스터링 모델 하나는 개별적으로 형편없을 수 있어도, 서로 다른 클러스터 개수·시드로 만든 여러 클러스터링의 곱집합(product quantization)을 타깃으로 쓰면 각 클러스터링의 노이즈가 서로 다르게 걸려 상쇄된다. 각 클러스터링 $k$마다 별도 projection 행렬 $A^{(k)}$을 두고, 훈련 시 이 모든 타깃을 동시에 맞히게 한다.'},
 {h:'반복 정제 — 타깃 자체를 계속 갈아 끼운다',
  lead:'1차는 MFCC k-means, 2차부터는 이전 모델의 은닉층을 다시 클러스터링한다.',
  d:'1차 반복은 39차원 MFCC에 클러스터 100개로 k-means를 돌린 거친 타깃으로 시작한다. 2차 반복부터는 **1차에서 학습된 HuBERT 모델의 중간 transformer층(6번째 층) 출력**을 다시 클러스터링(500개)해 더 정교한 타깃을 만들고, 그 타깃으로 처음부터 다시 학습한다. 층별 분석을 보면 중간층으로 갈수록 음소 순도(phone purity)와 PNMI가 올라갔다가 다시 떨어지는데, 그 정점 근처 층을 다음 반복의 타깃으로 쓰는 것이 이 논문의 핵심 엔진이다.'},
 {h:'양자화가 아니라 클러스터링, 대조학습이 아니라 분류',
  lead:'코드북을 학습하는 대신 오프라인 k-means로 타깃을 고정하고 교차엔트로피로 맞힌다.',
  d:'[wav2vec 2.0](#/p/wav2vec2)은 코드북·인코더를 **동시에** 학습하며 대조 손실로 진짜 코드를 K개의 distractor 중에서 골라내게 한다. HuBERT는 타깃 생성을 학습 루프 밖으로 완전히 분리한다 — k-means는 학습 시작 전에 고정되고, 모델은 단순 교차엔트로피로 그 라벨(BASE 기준 100~500개 클래스)을 분류한다. 대조 손실의 negative 샘플링·다양성 손실 같은 장치가 필요 없어지는 대신, 타깃의 질이 학습 내내 고정된다는 대가를 치른다 — 그래서 "반복"이 필요하다.'}
],

diagram:{type:'loop', cap:'1차: MFCC를 k-means(100클러스터)로 타깃을 만들어 HuBERT를 학습. 2차: 그 모델의 6번째 층 출력을 다시 k-means(500클러스터)로 클러스터링해 더 정교한 타깃을 만들고 처음부터 재학습.',
 center:'타깃 재클러스터링',
 nodes:[
  {t:'MFCC 특징', s:'39차원'},
  {t:'k-means 클러스터링', s:'100 → 500 클러스터', acc:true},
  {t:'마스킹 예측 학습', s:'BERT식 교차엔트로피'},
  {t:'중간층 출력 추출', s:'6번째 transformer층'}
 ]},

math:[
 {expr:'L_m(f; X, M, Z) = Σ_{t∈M} log p_f(z_t | X̃, t)',
  tex:'L_m(f;X,M,Z)=\\sum_{t\\in M}\\log p_f(z_t \\mid \\tilde{X}, t)',
  d:'마스킹된 시점 집합 $M$에서만 계산하는 손실. $z_t$는 k-means가 부여한 $C$-클래스 범주형 타깃, $\\tilde{X}$는 마스킹된 입력이다. 마스킹 안 된 시점의 손실 $L_u$도 같은 형태로 정의되고, 최종 손실은 $L=\\alpha L_m+(1-\\alpha)L_u$.'},
 {expr:'PNMI = [H(k-means label) − H(k-means label | phone)] / H(k-means label)',
  tex:'\\text{PNMI}=\\frac{H(z)-H(z\\mid y)}{H(z)}',
  d:'phone-normalized mutual information. k-means 라벨 $z$와 실제 음소 $y$ 사이 상호정보량을 정규화한 지표로, 클러스터가 음소 정보를 얼마나 담고 있는지를 측정한다. 이 값이 반복마다 올라가는 것이 "타깃이 정제된다"는 근거다.'}
],

numbers:[
 {k:'클러스터 수 (1차/2차)', v:'100 → 500', d:'1차는 MFCC, 2차는 1차 모델 6번째 층 출력에 k-means'},
 {k:'모델 크기', v:'BASE 90M · LARGE 300M · X-LARGE 1B', d:'세 규모 모두 학습해 스케일 효과를 확인'},
 {k:'X-LARGE WER 개선', v:'최대 19% (dev-other) · 13% (test-other)', d:'LARGE 대비 상대적 감소, Libri-light 60k 사전학습 기준'},
 {k:'test-clean WER (Large, 960h ft)', v:'1.8~1.9%', d:'Libri-light 60k 사전학습 + 960h 전체 라벨로 미세조정'},
 {k:'PNMI (HuBERT 특징 vs MFCC)', v:'0.68 vs 0.29 (500클러스터)', d:'같은 k-means라도 HuBERT 중간층 특징을 쓰면 음소 정보량이 2배 이상'},
 {k:'사전학습 데이터', v:'LibriSpeech 960h · Libri-light 60,000h', d:'wav2vec 2.0과 동일 벤치마크로 직접 비교'}
],

impact:'HuBERT는 "완벽한 타깃 없이도 반복 정제만으로 표현을 개선할 수 있다"는 것을 음성 도메인에서 실증했다. 이후 음성 코드를 다루는 대부분의 연구가 **k-means 이산 단위**를 표준 재료로 채택했다 — [AudioLM](#/p/audiolm)의 semantic token, GSLM 같은 textless NLP 파이프라인이 모두 HuBERT 코드를 그대로 가져다 쓴다. 대조학습 기반 [wav2vec 2.0](#/p/wav2vec2)과 클러스터링 기반 HuBERT라는 두 갈래가 이후 음성 자기지도학습의 두 표준 레시피로 굳어졌다.',

legacy:[
 '**이산 음성 토큰의 표준 재료** — [AudioLM](#/p/audiolm)이 "semantic token"으로 HuBERT 코드를 그대로 채택해, 음향 코덱([EnCodec](#/p/encodec))과 조합하는 2단 계층 구조의 절반을 차지',
 '**textless NLP** — GSLM 등 전사 텍스트 없이 음성만으로 언어모델을 학습하는 계열이 HuBERT 코드를 어휘로 사용',
 '**대안 노선과의 공존** — [Whisper](#/p/whisper)는 반대로 자기지도 사전학습 없이 68만 시간의 약지도(weak supervision) 전사 데이터를 정면 돌파해, "라벨 부족을 어떻게 우회할까"라는 같은 질문에 다른 답을 내놓음',
 '**반복 정제 아이디어의 확산** — 클러스터를 한 번에 확정 짓지 않고 모델·타깃을 번갈아 개선하는 self-distillation 스타일이 이후 음성·비전 자기지도학습 전반에서 반복적으로 재등장'
],

pitfalls:[
 '**k-means 타깃이 "음소를 인식한다"는 뜻이 아니다.** 클러스터는 화자·억양·MFCC 패턴에 따라 갈리는 거친 근사치일 뿐이고, 논문 자체도 PNMI가 1.0에 한참 못 미친다는 것을 보여준다. 표현이 좋아지는 것은 타깃의 정확도가 아니라 일관성 덕분이다.',
 '**반복 학습은 매번 처음부터 다시 돈다.** 2차·3차 HuBERT는 이전 모델 위에서 이어 학습하는 것이 아니라, 새 타깃으로 **처음부터 재학습**한다. wav2vec 2.0보다 절차가 단순하다는 인상과 달리, 총 학습 비용은 반복 횟수만큼 배가된다.',
 '**중간층 선택은 경험적 튜닝이다.** "6번째 층 출력을 재클러스터링" 같은 선택은 층별 PNMI 곡선을 보고 정한 것이라, 모델 구조나 데이터가 바뀌면 최적 층도 달라질 수 있다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'맨 위 빨간 박스가 k-means 같은 "Acoustic Unit Discovery System"으로, CNN 인코더 출력에서 오프라인으로 타깃 $z_1..z_6$을 만든다(점선 화살표 — 학습 루프 밖에서 미리 계산). 가운데 노란/주황 박스가 CNN 인코더 출력이고, 주황색 [MSK]가 마스킹된 프레임. Transformer는 마스킹된 자리($z_2,z_3,z_4$)의 타깃만 맞히면 된다.',
  src:'원문 Figure 1, p.2'},
 {f:'fig2-pnmi-layers.png',
  cap:'가로축이 transformer 층 번호(0=입력). 위부터 Cluster Purity·Phone Purity·PNMI 세 지표 모두 중간층(6~8층) 근처에서 정점을 찍고 이후 하락한다 — 파란 계열(1차 모델, BASE-it1)보다 빨간 계열(2차 모델, BASE-it2)의 정점이 더 높다. 이것이 "반복할수록 타깃이 정제된다"는 주장의 직접적 근거다.',
  src:'원문 Figure 2, p.7'}
],

quotes:[
 {t:'HuBERT relies primarily on the consistency of the unsupervised clustering step rather than the intrinsic quality of the assigned cluster labels.',
  src:'Abstract, p.1'},
 {t:'Starting with a simple k-means teacher of 100 clusters, and using two iterations of clustering, the HuBERT model either matches or improves upon the state-of-the-art wav2vec 2.0 performance.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2106.07447 — HuBERT', u:'https://arxiv.org/abs/2106.07447'},
 {t:'공식 코드 (fairseq)', u:'https://github.com/pytorch/fairseq/tree/main/examples/hubert'}
]
});
