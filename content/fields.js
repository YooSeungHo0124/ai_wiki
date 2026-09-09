/* ============================================================
   AI Wiki — 분야(계보) 정의 + 논문 인덱스
   각 논문의 본문은 content/papers/<slug>.js 에 있습니다.
   ============================================================ */
window.WIKI = window.WIKI || {};

WIKI.FIELDS = [
  { id:'foundations', name:'기초 · 학습 알고리즘', en:'Foundations',
    color:'#8b8f9a',
    blurb:'신경망을 "학습 가능한 것"으로 만든 알고리즘들. 역전파, 정규화, 옵티마이저처럼 모든 분야가 공유하는 바닥돌.',
    tracks:[
      {id:'learning', name:'학습의 발명'},
      {id:'stabilize', name:'깊게 쌓기 위한 장치'},
      {id:'data',      name:'데이터와 벤치마크'}
    ]},

  { id:'vision', name:'컴퓨터 비전', en:'Vision',
    color:'#3fb27f',
    blurb:'"픽셀에서 의미로". CNN이 특징 설계를 대체하고, detection·segmentation으로 확장되고, 결국 Transformer에 흡수되기까지.',
    tracks:[
      {id:'cnn',     name:'CNN 백본 계보'},
      {id:'detect',  name:'객체 탐지'},
      {id:'seg',     name:'분할(Segmentation)'},
      {id:'vit',     name:'Vision Transformer'},
      {id:'selfsup', name:'자기지도 학습'},
      {id:'dense',   name:'포즈 · 깊이 · 흐름'}
    ]},

  { id:'nlp', name:'언어 표현 (Transformer 이전)', en:'Classic NLP',
    color:'#d99a2b',
    blurb:'단어를 벡터로, 문장을 시퀀스로. RNN·LSTM·seq2seq·attention이 Transformer로 가는 길을 깔았다.',
    tracks:[
      {id:'repr', name:'단어 표현'},
      {id:'seq',  name:'시퀀스 모델링'}
    ]},

  { id:'llm', name:'Transformer · 대규모 언어모델', en:'LLM',
    color:'#5b8def',
    blurb:'attention 하나로 아키텍처를 통일한 뒤, 사전학습 → 스케일링 → 정렬(alignment)로 이어진 현대 LLM의 본류.',
    tracks:[
      {id:'core',     name:'아키텍처 원점'},
      {id:'pretrain', name:'사전학습 패러다임'},
      {id:'scale',    name:'스케일링 법칙'},
      {id:'align',    name:'정렬 · 지시 학습'},
      {id:'open',     name:'오픈 웨이트 모델'},
      {id:'context',  name:'긴 문맥'}
    ]},

  { id:'efficiency', name:'효율 · 시스템', en:'Efficiency & Systems',
    color:'#8b5cf6',
    blurb:'같은 모델을 더 싸게, 더 길게, 더 빠르게. 커널·위치인코딩·PEFT·양자화·서빙·상태공간 모델.',
    tracks:[
      {id:'attn',  name:'attention 개조'},
      {id:'peft',  name:'파라미터 효율 미세조정'},
      {id:'quant', name:'양자화 · 압축'},
      {id:'serve', name:'학습 · 서빙 시스템'},
      {id:'ssm',   name:'attention 대안 (SSM)'}
    ]},

  { id:'generative', name:'생성 모델', en:'Generative Models',
    color:'#e0568c',
    blurb:'분포를 배워 새로 만들어 내기. GAN → VAE → Diffusion으로 이어진 이미지 생성의 주류 교체, 그리고 3D.',
    tracks:[
      {id:'gan',       name:'GAN 계보'},
      {id:'vae',       name:'VAE · 이산 잠재'},
      {id:'diffusion', name:'Diffusion 계보'},
      {id:'threeD',    name:'3D · 뉴럴 렌더링'}
    ]},

  { id:'multimodal', name:'멀티모달 · VLM', en:'Multimodal',
    color:'#22b8cf',
    blurb:'이미지·오디오를 언어와 같은 공간에 올리기. 대조학습으로 시작해 LLM에 눈을 붙이는 방향으로 수렴했다.',
    tracks:[
      {id:'contrastive', name:'대조학습 정렬'},
      {id:'vlm',         name:'Vision-Language 모델'}
    ]},

  { id:'rl', name:'강화학습', en:'Reinforcement Learning',
    color:'#f0674a',
    blurb:'보상으로 배우는 계보. Atari에서 바둑, 그리고 사람 선호(RLHF)를 거쳐 LLM 추론 학습까지 이어진다.',
    tracks:[
      {id:'value',  name:'가치 기반'},
      {id:'policy', name:'정책 경사'},
      {id:'search', name:'탐색 + 학습'},
      {id:'rlhf',   name:'사람 피드백 · LLM RL'},
      {id:'world',  name:'세계 모델'}
    ]},

  { id:'agent', name:'추론 · 도구 · 검색', en:'Reasoning & Agents',
    color:'#4bb3d4',
    blurb:'모델을 "쓰는 법"이 곧 능력이 된 영역. 사고 사슬로 추론을 끌어내고, 도구를 쥐여 주고, 결국 추론 자체를 학습시키기까지.',
    tracks:[
      {id:'reason',    name:'추론 유도'},
      {id:'tool',      name:'도구 · 에이전트'}
    ]},

  { id:'interp', name:'해석 · 평가', en:'Interpretability & Eval',
    color:'#9aa04b',
    blurb:'모델 안에서 무슨 일이 일어나는지, 그리고 잘하는지 어떻게 재는지. 성능 경쟁 뒤편의 인프라. 안전은 별도 분야로 다룬다.',
    tracks:[
      {id:'interp', name:'내부 해석'},
      {id:'eval',   name:'벤치마크'},
      {id:'xai',    name:'설명가능성(XAI)'}
    ]},

  { id:'speech', name:'음성 · 오디오', en:'Speech & Audio',
    color:'#d4885f',
    blurb:'파형을 이해하고 만들어 내기. 음성 인식이 자기지도로 라벨 갈증을 푼 흐름과, 합성이 보코더 → 종단간 → 코덱 언어모델로 옮겨간 흐름이 나란히 간다.',
    tracks:[
      {id:'asr',   name:'음성 인식'},
      {id:'tts',   name:'음성 합성'},
      {id:'codec', name:'뉴럴 코덱 · 오디오 LM'}
    ]},

  { id:'graph', name:'그래프 신경망', en:'Graph Neural Networks',
    color:'#6fb3a0',
    blurb:'격자도 시퀀스도 아닌 데이터. 이웃에게 메시지를 보내 자기를 갱신한다는 한 가지 원리가 분자·소셜·추천·지식그래프로 퍼졌다.',
    tracks:[
      {id:'embed',      name:'그래프 임베딩'},
      {id:'conv',       name:'그래프 합성곱'},
      {id:'expressive', name:'표현력 · Transformer'}
    ]},

  { id:'recsys', name:'추천 시스템', en:'Recommender Systems',
    color:'#c96f9e',
    blurb:'가장 오래됐고 가장 돈이 되는 응용. 행렬 분해에서 딥러닝으로, 다시 사용자 행동을 시퀀스로 보는 방향으로 옮겨왔다.',
    tracks:[
      {id:'cf',   name:'협업 필터링'},
      {id:'deep', name:'딥러닝 추천'},
      {id:'seq',  name:'순차 추천'}
    ]},

  { id:'ir', name:'정보검색 · 임베딩', en:'Retrieval & Embeddings',
    color:'#7a8fd8',
    blurb:'"의미가 비슷한 것을 빨리 찾기". 문장을 벡터로 만드는 쪽과 수십억 벡터에서 근사 최근접을 찾는 쪽이 함께 발전해, 검색 증강(RAG)이라는 오늘날의 표준 구성으로 모였다.',
    tracks:[
      {id:'dense', name:'밀집 검색 · RAG'},
      {id:'embed', name:'문장 임베딩'},
      {id:'late',  name:'후기 상호작용 · 희소'},
      {id:'index', name:'벡터 인덱스'}
    ]},

  { id:'code', name:'코드 AI', en:'Code AI',
    color:'#7fa650',
    blurb:'코드는 실행해서 정답을 판정할 수 있는 드문 영역이다. 그 성질이 평가 방식과 강화학습·에이전트 연구를 다른 분야보다 빠르게 밀어붙였다.',
    tracks:[
      {id:'pretrain', name:'코드 사전학습'},
      {id:'bench',    name:'평가'},
      {id:'agent',    name:'소프트웨어 에이전트'}
    ]},

  { id:'video', name:'비디오 · 시공간', en:'Video',
    color:'#b07fd8',
    blurb:'시간 축이 하나 더 붙는 순간 연산량과 데이터 요구가 폭증한다. 이해 쪽과 생성 쪽 모두 "시간을 어떻게 다룰 것인가"의 답을 찾아왔다.',
    tracks:[
      {id:'understand', name:'비디오 이해'},
      {id:'generate',   name:'비디오 생성'}
    ]},

  { id:'robotics', name:'로보틱스 · 구현 AI', en:'Robotics & Embodied AI',
    color:'#d9a441',
    blurb:'인터넷 데이터로 배운 능력을 몸을 가진 기계로 옮기기. 언어모델이 계획을 세우고 정책이 몸을 움직이는 구조로 수렴하고 있다.',
    tracks:[
      {id:'imitation', name:'모방학습 정책'},
      {id:'vla',       name:'비전-언어-행동 모델'}
    ]},

  { id:'science', name:'과학을 위한 AI', en:'AI for Science',
    color:'#4fa3b8',
    blurb:'벤치마크가 아니라 실제 자연을 맞히는 분야. 단백질 구조·기상·재료·수학에서 기존 수치해석을 대체하거나 앞지른 사례들.',
    tracks:[
      {id:'bio',  name:'생명 · 단백질'},
      {id:'phys', name:'물리 · 기상'},
      {id:'math', name:'수학 · 재료'}
    ]},

  { id:'data', name:'데이터 중심 AI', en:'Data-Centric AI',
    color:'#a88b6a',
    blurb:'모델을 바꾸는 대신 데이터를 바꾼다. 무엇을 얼마나 넣느냐가 아키텍처보다 성능을 좌우한다는 것이 드러난 뒤 생긴 연구 계열.',
    tracks:[
      {id:'corpus', name:'대규모 코퍼스'},
      {id:'curate', name:'정제 · 선별'},
      {id:'synth',  name:'합성 데이터'}
    ]},

  { id:'theory', name:'학습 이론 · 일반화', en:'Learning Theory',
    color:'#8f8fa8',
    blurb:'왜 되는지 모르는 채로 잘 되던 것들에 설명을 붙이려는 시도. 고전 통계학습 이론이 딥러닝 앞에서 깨진 자리에서 시작한다.',
    tracks:[
      {id:'general', name:'일반화의 수수께끼'},
      {id:'optim',   name:'최적화 · 배치 크기'}
    ]},

  { id:'privacy', name:'프라이버시 · 공격 · 안전', en:'Privacy & Security',
    color:'#c9605f',
    blurb:'모델은 학습 데이터를 기억하고, 사람은 모델을 속인다. 데이터를 지키는 쪽과 모델을 뚫는 쪽이 서로를 밀어 온 계보.',
    tracks:[
      {id:'dp',     name:'차등 프라이버시'},
      {id:'fed',    name:'연합학습'},
      {id:'attack', name:'공격 · 감사'},
      {id:'safety', name:'모델 안전'}
    ]}
];

/* ------------------------------------------------------------
   분야 묶음 — 21개 분야는 서로 다른 기준으로 나뉜다.
   모달리티(무엇을 다루는가) · 응용(어디에 쓰는가) · 횡단(모든 분야를 가로지름).
   한 논문이 여러 곳에 정당하게 속할 수 있으므로, 분야는 배타적 분류가 아니라
   탐색용 서랍으로 본다. 지식의 실제 구조는 WIKI.INDEX 의 계보 그래프에 있다.
   ------------------------------------------------------------ */
WIKI.GROUPS = [
  { id:'base',  name:'기반',
    desc:'모든 분야가 딛고 서는 학습 알고리즘과, 그것이 왜 되는지를 묻는 이론.',
    fields:['foundations','theory'] },
  { id:'modal', name:'모달리티 · 응용',
    desc:'무엇을 다루는가(이미지·언어·음성·영상·그래프)와 어디에 쓰는가(추천·코드·로봇·과학).',
    fields:['vision','nlp','llm','generative','multimodal','speech','video',
            'graph','rl','robotics','recsys','ir','code','science'] },
  { id:'cross', name:'가로지르는 관심사',
    desc:'특정 모달리티에 속하지 않고 전 분야를 관통하는 문제 — 효율, 데이터, 추론 방식, 해석, 안전.',
    fields:['efficiency','data','agent','interp','privacy'] }
];

/* ------------------------------------------------------------
   논문 인덱스
   [slug, year, 원제, 통칭/한줄, field, track, parents[]]
   parents = 직접적인 지적 선행 논문 (계보 화살표)
   ------------------------------------------------------------ */
WIKI.INDEX = [
// ── foundations ────────────────────────────────────────────
['perceptron',1958,'The Perceptron: A Probabilistic Model for Information Storage','퍼셉트론','foundations','learning',[]],
['backprop',1986,'Learning Representations by Back-Propagating Errors','역전파','foundations','learning',['perceptron']],
['lstm',1997,'Long Short-Term Memory','LSTM','nlp','seq',['backprop']],
['imagenet',2009,'ImageNet: A Large-Scale Hierarchical Image Database','ImageNet','foundations','data',[]],
['dropout',2014,'Dropout: A Simple Way to Prevent Neural Networks from Overfitting','드롭아웃','foundations','stabilize',['alexnet']],
['batchnorm',2015,'Batch Normalization','배치 정규화','foundations','stabilize',['dropout']],
['adam',2015,'Adam: A Method for Stochastic Optimization','Adam 옵티마이저','foundations','learning',['backprop']],
['layernorm',2016,'Layer Normalization','레이어 정규화','foundations','stabilize',['batchnorm']],
['distillation',2015,'Distilling the Knowledge in a Neural Network','지식 증류','foundations','learning',['dropout']],

// ── vision ─────────────────────────────────────────────────
['lenet',1998,'Gradient-Based Learning Applied to Document Recognition','LeNet-5','vision','cnn',['backprop']],
['alexnet',2012,'ImageNet Classification with Deep CNNs','AlexNet','vision','cnn',['lenet','imagenet']],
['vgg',2014,'Very Deep Convolutional Networks (VGG)','VGG','vision','cnn',['alexnet']],
['googlenet',2014,'Going Deeper with Convolutions (GoogLeNet/Inception)','Inception','vision','cnn',['alexnet']],
['resnet',2015,'Deep Residual Learning for Image Recognition','ResNet','vision','cnn',['vgg','googlenet','batchnorm']],
['densenet',2017,'Densely Connected Convolutional Networks','DenseNet','vision','cnn',['resnet']],
['mobilenet',2017,'MobileNets: Efficient CNNs for Mobile Vision','MobileNet','vision','cnn',['resnet']],
['efficientnet',2019,'EfficientNet: Rethinking Model Scaling for CNNs','EfficientNet','vision','cnn',['mobilenet','resnet']],
['convnext',2022,'A ConvNet for the 2020s','ConvNeXt','vision','cnn',['resnet','swin']],
['rcnn',2014,'Rich Feature Hierarchies for Accurate Object Detection (R-CNN)','R-CNN','vision','detect',['alexnet']],
['faster-rcnn',2015,'Faster R-CNN: Towards Real-Time Object Detection with RPN','Faster R-CNN','vision','detect',['rcnn','vgg']],
['yolo',2016,'You Only Look Once: Unified, Real-Time Object Detection','YOLO','vision','detect',['rcnn']],
['ssd',2016,'SSD: Single Shot MultiBox Detector','SSD','vision','detect',['yolo','faster-rcnn']],
['fpn',2017,'Feature Pyramid Networks for Object Detection','FPN','vision','detect',['faster-rcnn']],
['focal-loss',2017,'Focal Loss for Dense Object Detection (RetinaNet)','Focal Loss','vision','detect',['ssd','fpn']],
['detr',2020,'End-to-End Object Detection with Transformers','DETR','vision','detect',['faster-rcnn','transformer']],
['fcn',2015,'Fully Convolutional Networks for Semantic Segmentation','FCN','vision','seg',['vgg']],
['unet',2015,'U-Net: Convolutional Networks for Biomedical Image Segmentation','U-Net','vision','seg',['fcn']],
['mask-rcnn',2017,'Mask R-CNN','Mask R-CNN','vision','seg',['faster-rcnn','fpn']],
['deeplab',2017,'DeepLab: Atrous Convolution for Semantic Segmentation','DeepLab','vision','seg',['fcn']],
['sam',2023,'Segment Anything','SAM','vision','seg',['mask-rcnn','vit','clip']],
['vit',2020,'An Image is Worth 16x16 Words (ViT)','ViT','vision','vit',['transformer','resnet']],
['deit',2021,'Training Data-Efficient Image Transformers (DeiT)','DeiT','vision','vit',['vit','distillation']],
['swin',2021,'Swin Transformer: Hierarchical Vision Transformer','Swin','vision','vit',['vit','fpn']],
['mae',2021,'Masked Autoencoders Are Scalable Vision Learners','MAE','vision','vit',['vit','bert']],
['dino',2021,'Emerging Properties in Self-Supervised Vision Transformers (DINO)','DINO','vision','selfsup',['vit','byol']],
['dinov2',2023,'DINOv2: Learning Robust Visual Features without Supervision','DINOv2','vision','selfsup',['dino','mae']],
['simclr',2020,'A Simple Framework for Contrastive Learning (SimCLR)','SimCLR','vision','selfsup',['resnet']],
['moco',2020,'Momentum Contrast for Unsupervised Visual Representation Learning','MoCo','vision','selfsup',['resnet']],
['byol',2020,'Bootstrap Your Own Latent (BYOL)','BYOL','vision','selfsup',['simclr','moco']],

// ── nlp ────────────────────────────────────────────────────
['nnlm',2003,'A Neural Probabilistic Language Model','신경망 언어모델','nlp','repr',['backprop']],
['word2vec',2013,'Efficient Estimation of Word Representations in Vector Space','word2vec','nlp','repr',['nnlm']],
['glove',2014,'GloVe: Global Vectors for Word Representation','GloVe','nlp','repr',['word2vec']],
['fasttext',2016,'Enriching Word Vectors with Subword Information','fastText','nlp','repr',['word2vec']],
['bpe',2016,'Neural Machine Translation of Rare Words with Subword Units','BPE 토크나이저','nlp','repr',['seq2seq']],
['elmo',2018,'Deep Contextualized Word Representations (ELMo)','ELMo','nlp','repr',['lstm','word2vec']],
['seq2seq',2014,'Sequence to Sequence Learning with Neural Networks','seq2seq','nlp','seq',['lstm']],
['bahdanau',2015,'Neural Machine Translation by Jointly Learning to Align and Translate','Bahdanau attention','nlp','seq',['seq2seq']],

// ── llm ────────────────────────────────────────────────────
['transformer',2017,'Attention Is All You Need','Transformer','llm','core',['bahdanau','layernorm','resnet']],
['gpt1',2018,'Improving Language Understanding by Generative Pre-Training','GPT-1','llm','pretrain',['transformer','elmo']],
['bert',2018,'BERT: Pre-training of Deep Bidirectional Transformers','BERT','llm','pretrain',['transformer','elmo','gpt1']],
['gpt2',2019,'Language Models are Unsupervised Multitask Learners','GPT-2','llm','pretrain',['gpt1']],
['roberta',2019,'RoBERTa: A Robustly Optimized BERT Pretraining Approach','RoBERTa','llm','pretrain',['bert']],
['t5',2019,'Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer','T5','llm','pretrain',['bert','transformer']],
['gpt3',2020,'Language Models are Few-Shot Learners','GPT-3','llm','pretrain',['gpt2','scaling-laws']],
['scaling-laws',2020,'Scaling Laws for Neural Language Models','스케일링 법칙','llm','scale',['gpt2']],
['chinchilla',2022,'Training Compute-Optimal Large Language Models','Chinchilla','llm','scale',['scaling-laws','gpt3']],
['palm',2022,'PaLM: Scaling Language Modeling with Pathways','PaLM','llm','scale',['gpt3']],
['emergent',2022,'Emergent Abilities of Large Language Models','창발 능력','llm','scale',['gpt3','palm']],
['moe-shazeer',2017,'Outrageously Large Neural Networks: Sparsely-Gated MoE','Sparse MoE','llm','scale',['lstm']],
['switch',2021,'Switch Transformers: Scaling to Trillion Parameter Models','Switch Transformer','llm','scale',['moe-shazeer','t5']],
['instructgpt',2022,'Training Language Models to Follow Instructions with Human Feedback','InstructGPT','llm','align',['gpt3','summarize-hf','ppo']],
['flan',2022,'Finetuned Language Models Are Zero-Shot Learners (FLAN)','instruction tuning','llm','align',['t5','gpt3']],
['dpo',2023,'Direct Preference Optimization','DPO','llm','align',['instructgpt']],
['gpt4',2023,'GPT-4 Technical Report','GPT-4','llm','pretrain',['gpt3','instructgpt']],
['llama',2023,'LLaMA: Open and Efficient Foundation Language Models','LLaMA','llm','open',['chinchilla','gpt3','rope']],
['llama2',2023,'Llama 2: Open Foundation and Fine-Tuned Chat Models','Llama 2','llm','open',['llama','instructgpt','gqa']],
['mistral',2023,'Mistral 7B','Mistral 7B','llm','open',['llama','gqa']],
['mixtral',2024,'Mixtral of Experts','Mixtral 8x7B','llm','open',['mistral','switch']],
['deepseek-v3',2024,'DeepSeek-V3 Technical Report','DeepSeek-V3','llm','open',['mixtral','llama2']],

// ── efficiency ─────────────────────────────────────────────
['mqa',2019,'Fast Transformer Decoding: One Write-Head is All You Need','MQA','efficiency','attn',['transformer']],
['sparse-attn',2020,'Longformer / Big Bird: Sparse Attention for Long Documents','희소 attention','efficiency','attn',['transformer']],
['rope',2021,'RoFormer: Enhanced Transformer with Rotary Position Embedding','RoPE','efficiency','attn',['transformer']],
['alibi',2021,'Train Short, Test Long: Attention with Linear Biases (ALiBi)','ALiBi','efficiency','attn',['transformer']],
['flashattention',2022,'FlashAttention: Fast and Memory-Efficient Exact Attention','FlashAttention','efficiency','attn',['transformer']],
['gqa',2023,'GQA: Training Generalized Multi-Query Transformer Models','GQA','efficiency','attn',['mqa','flashattention']],
['adapter',2019,'Parameter-Efficient Transfer Learning for NLP (Adapters)','Adapter','efficiency','peft',['bert']],
['prefix-tuning',2021,'Prefix-Tuning: Optimizing Continuous Prompts for Generation','Prefix Tuning','efficiency','peft',['adapter','gpt2']],
['lora',2021,'LoRA: Low-Rank Adaptation of Large Language Models','LoRA','efficiency','peft',['adapter','prefix-tuning']],
['qlora',2023,'QLoRA: Efficient Finetuning of Quantized LLMs','QLoRA','efficiency','peft',['lora','llm-int8']],
['llm-int8',2022,'LLM.int8(): 8-bit Matrix Multiplication for Transformers at Scale','LLM.int8()','efficiency','quant',['gpt3']],
['gptq',2022,'GPTQ: Accurate Post-Training Quantization for Generative Transformers','GPTQ','efficiency','quant',['llm-int8']],
['awq',2023,'AWQ: Activation-aware Weight Quantization','AWQ','efficiency','quant',['gptq']],
['zero',2019,'ZeRO: Memory Optimizations Toward Training Trillion Parameter Models','ZeRO / DeepSpeed','efficiency','serve',['transformer']],
['megatron',2019,'Megatron-LM: Training Multi-Billion Parameter Models with Model Parallelism','Megatron-LM','efficiency','serve',['transformer']],
['vllm',2023,'Efficient Memory Management for LLM Serving with PagedAttention (vLLM)','vLLM / PagedAttention','efficiency','serve',['flashattention','gpt3']],
['speculative',2023,'Fast Inference from Transformers via Speculative Decoding','Speculative Decoding','efficiency','serve',['gpt3']],
['s4',2021,'Efficiently Modeling Long Sequences with Structured State Spaces (S4)','S4','efficiency','ssm',['lstm','transformer']],
['mamba',2023,'Mamba: Linear-Time Sequence Modeling with Selective State Spaces','Mamba','efficiency','ssm',['s4','flashattention']],
['rwkv',2023,'RWKV: Reinventing RNNs for the Transformer Era','RWKV','efficiency','ssm',['lstm','transformer']],

// ── generative ─────────────────────────────────────────────
['vae',2013,'Auto-Encoding Variational Bayes (VAE)','VAE','generative','vae',['backprop']],
['gan',2014,'Generative Adversarial Networks','GAN','generative','gan',['backprop']],
['dcgan',2015,'Unsupervised Representation Learning with Deep Convolutional GANs','DCGAN','generative','gan',['gan','alexnet']],
['pix2pix',2016,'Image-to-Image Translation with Conditional Adversarial Networks','pix2pix','generative','gan',['dcgan','unet']],
['wgan',2017,'Wasserstein GAN','WGAN','generative','gan',['gan']],
['cyclegan',2017,'Unpaired Image-to-Image Translation (CycleGAN)','CycleGAN','generative','gan',['pix2pix']],
['stylegan',2019,'A Style-Based Generator Architecture for GANs (StyleGAN)','StyleGAN','generative','gan',['dcgan','wgan']],
['vqvae',2017,'Neural Discrete Representation Learning (VQ-VAE)','VQ-VAE','generative','vae',['vae']],
['vqgan',2021,'Taming Transformers for High-Resolution Image Synthesis (VQGAN)','VQGAN','generative','vae',['vqvae','gan','transformer']],
['dalle',2021,'Zero-Shot Text-to-Image Generation (DALL·E)','DALL·E','generative','vae',['vqvae','gpt3']],
['ddpm',2020,'Denoising Diffusion Probabilistic Models','DDPM','generative','diffusion',['diffusion-original','vae','unet']],
['score-sde',2021,'Score-Based Generative Modeling through SDEs','Score SDE','generative','diffusion',['ddpm']],
['ddim',2021,'Denoising Diffusion Implicit Models','DDIM','generative','diffusion',['ddpm']],
['cfg',2022,'Classifier-Free Diffusion Guidance','Classifier-Free Guidance','generative','diffusion',['ddpm']],
['ldm',2022,'High-Resolution Image Synthesis with Latent Diffusion Models','Stable Diffusion (LDM)','generative','diffusion',['ddpm','vqgan','cfg','clip']],
['dit',2023,'Scalable Diffusion Models with Transformers (DiT)','DiT','generative','diffusion',['ldm','vit']],
['flow-matching',2023,'Flow Matching for Generative Modeling','Flow Matching','generative','diffusion',['score-sde']],
['consistency',2023,'Consistency Models','Consistency Models','generative','diffusion',['ddim','score-sde']],
['nerf',2020,'NeRF: Representing Scenes as Neural Radiance Fields','NeRF','generative','threeD',['backprop']],
['3dgs',2023,'3D Gaussian Splatting for Real-Time Radiance Field Rendering','3D Gaussian Splatting','generative','threeD',['nerf']],

// ── multimodal ─────────────────────────────────────────────
['clip',2021,'Learning Transferable Visual Models From Natural Language Supervision','CLIP','multimodal','contrastive',['vit','transformer','simclr']],
['align',2021,'Scaling Up Visual and Vision-Language Representation Learning (ALIGN)','ALIGN','multimodal','contrastive',['clip']],
['siglip',2023,'Sigmoid Loss for Language Image Pre-Training (SigLIP)','SigLIP','multimodal','contrastive',['clip']],
['flamingo',2022,'Flamingo: a Visual Language Model for Few-Shot Learning','Flamingo','multimodal','vlm',['clip','gpt3']],
['blip',2022,'BLIP: Bootstrapping Language-Image Pre-training','BLIP','multimodal','vlm',['clip']],
['blip2',2023,'BLIP-2: Bootstrapping Vision-Language Pre-training with Frozen Encoders','BLIP-2','multimodal','vlm',['blip','flamingo']],
['llava',2023,'Visual Instruction Tuning (LLaVA)','LLaVA','multimodal','vlm',['clip','instructgpt','llama']],
['qwen-vl',2023,'Qwen-VL: A Versatile Vision-Language Model','Qwen-VL','multimodal','vlm',['blip2','llava']],
['wav2vec2',2020,'wav2vec 2.0: Self-Supervised Learning of Speech Representations','wav2vec 2.0','speech','asr',['transformer','bert']],
['whisper',2022,'Robust Speech Recognition via Large-Scale Weak Supervision (Whisper)','Whisper','speech','asr',['transformer','wav2vec2']],

// ── rl ─────────────────────────────────────────────────────
['dqn',2015,'Human-Level Control through Deep Reinforcement Learning (DQN)','DQN','rl','value',['backprop','alexnet']],
['ddpg',2016,'Continuous Control with Deep Reinforcement Learning (DDPG)','DDPG','rl','policy',['dqn']],
['a3c',2016,'Asynchronous Methods for Deep Reinforcement Learning (A3C)','A3C','rl','policy',['dqn']],
['trpo',2015,'Trust Region Policy Optimization','TRPO','rl','policy',['backprop']],
['ppo',2017,'Proximal Policy Optimization Algorithms','PPO','rl','policy',['trpo','a3c']],
['sac',2018,'Soft Actor-Critic','SAC','rl','policy',['ddpg']],
['alphago',2016,'Mastering the Game of Go with Deep Neural Networks and Tree Search','AlphaGo','rl','search',['dqn','resnet']],
['alphazero',2017,'Mastering Chess and Shogi by Self-Play (AlphaZero)','AlphaZero','rl','search',['alphago']],
['muzero',2020,'Mastering Atari, Go, Chess and Shogi by Planning with a Learned Model','MuZero','rl','search',['alphazero']],
['rlhf-prefs',2017,'Deep Reinforcement Learning from Human Preferences','RLHF 원형','rl','rlhf',['trpo','a3c']],
['summarize-hf',2020,'Learning to Summarize with Human Feedback','요약 RLHF','rl','rlhf',['rlhf-prefs','gpt3','ppo']],
['grpo',2024,'DeepSeekMath: GRPO and Reasoning-Oriented RL','GRPO','rl','rlhf',['ppo','instructgpt']],

// ── agent ──────────────────────────────────────────────────
['cot',2022,'Chain-of-Thought Prompting Elicits Reasoning in LLMs','Chain-of-Thought','agent','reason',['gpt3','palm']],
['self-consistency',2022,'Self-Consistency Improves Chain of Thought Reasoning','Self-Consistency','agent','reason',['cot']],
['tot',2023,'Tree of Thoughts: Deliberate Problem Solving with LLMs','Tree of Thoughts','agent','reason',['cot','alphazero']],
['deepseek-r1',2025,'DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via RL','DeepSeek-R1','agent','reason',['cot','grpo','deepseek-v3']],
['react',2022,'ReAct: Synergizing Reasoning and Acting in Language Models','ReAct','agent','tool',['cot']],
['toolformer',2023,'Toolformer: Language Models Can Teach Themselves to Use Tools','Toolformer','agent','tool',['gpt3','react']],
['dpr',2020,'Dense Passage Retrieval for Open-Domain QA','DPR','ir','dense',['bert']],
['realm',2020,'REALM: Retrieval-Augmented Language Model Pre-Training','REALM','ir','dense',['bert','dpr']],
['rag',2020,'Retrieval-Augmented Generation for Knowledge-Intensive NLP','RAG','ir','dense',['dpr','bert']],

// ── interp ─────────────────────────────────────────────────
['lottery',2019,'The Lottery Ticket Hypothesis','로또 티켓 가설','interp','interp',['dropout']],
['induction-heads',2022,'In-context Learning and Induction Heads','Induction Heads','interp','interp',['transformer','gpt3']],
['grokking',2022,'Grokking: Generalization Beyond Overfitting','Grokking','interp','interp',['transformer']],
['sae',2023,'Towards Monosemanticity: Decomposing Language Models with Dictionary Learning','Sparse Autoencoder','interp','interp',['induction-heads']],
['mmlu',2021,'Measuring Massive Multitask Language Understanding (MMLU)','MMLU','interp','eval',['gpt3']],
['gsm8k',2021,'Training Verifiers to Solve Math Word Problems (GSM8K)','GSM8K','interp','eval',['gpt3']],
['humaneval',2021,'Evaluating Large Language Models Trained on Code (Codex/HumanEval)','HumanEval','interp','eval',['gpt3']],
['bigbench',2022,'Beyond the Imitation Game (BIG-bench)','BIG-bench','interp','eval',['gpt3','mmlu']],
['constitutional',2022,'Constitutional AI: Harmlessness from AI Feedback','Constitutional AI','privacy','safety',['instructgpt']],
['chatbot-arena',2024,'Chatbot Arena: An Open Platform for Evaluating LLMs by Human Preference','Chatbot Arena','interp','eval',['mmlu','instructgpt']],
// ── speech ─────────────────────────────────────────────────
['wavenet',2016,'WaveNet: A Generative Model for Raw Audio','WaveNet','speech','tts',['backprop']],
['tacotron2',2018,'Natural TTS Synthesis by Conditioning WaveNet on Mel Spectrogram Predictions','Tacotron 2','speech','tts',['wavenet','seq2seq','bahdanau']],
['fastspeech',2019,'FastSpeech: Fast, Robust and Controllable Text to Speech','FastSpeech','speech','tts',['tacotron2','transformer']],
['hifi-gan',2020,'HiFi-GAN: Generative Adversarial Networks for Efficient and High Fidelity Speech Synthesis','HiFi-GAN','speech','tts',['wavenet','gan']],
['hubert',2021,'HuBERT: Self-Supervised Speech Representation Learning by Masked Prediction','HuBERT','speech','asr',['wav2vec2','bert']],
['vits',2021,'Conditional VAE with Adversarial Learning for End-to-End Text-to-Speech (VITS)','VITS','speech','tts',['fastspeech','vae','hifi-gan']],
['soundstream',2021,'SoundStream: An End-to-End Neural Audio Codec','SoundStream','speech','codec',['wavenet','vqvae']],
['encodec',2022,'High Fidelity Neural Audio Compression (EnCodec)','EnCodec','speech','codec',['soundstream','vqvae']],
['audiolm',2022,'AudioLM: a Language Modeling Approach to Audio Generation','AudioLM','speech','codec',['encodec','hubert','gpt2']],
['vall-e',2023,'Neural Codec Language Models are Zero-Shot Text to Speech Synthesizers (VALL-E)','VALL-E','speech','codec',['encodec','audiolm','gpt3']],

// ── graph ──────────────────────────────────────────────────
['deepwalk',2014,'DeepWalk: Online Learning of Social Representations','DeepWalk','graph','embed',['word2vec']],
['node2vec',2016,'node2vec: Scalable Feature Learning for Networks','node2vec','graph','embed',['deepwalk','word2vec']],
['gcn',2017,'Semi-Supervised Classification with Graph Convolutional Networks','GCN','graph','conv',['backprop','lenet']],
['graphsage',2017,'Inductive Representation Learning on Large Graphs (GraphSAGE)','GraphSAGE','graph','conv',['gcn']],
['mpnn',2017,'Neural Message Passing for Quantum Chemistry','MPNN','graph','conv',['gcn']],
['gat',2018,'Graph Attention Networks','GAT','graph','conv',['gcn','bahdanau']],
['gin',2019,'How Powerful are Graph Neural Networks? (GIN)','GIN','graph','expressive',['gcn','graphsage']],
['graphormer',2021,'Do Transformers Really Perform Bad for Graph Representation? (Graphormer)','Graphormer','graph','expressive',['gat','transformer']],

// ── recsys ─────────────────────────────────────────────────
['mf',2009,'Matrix Factorization Techniques for Recommender Systems','행렬 분해','recsys','cf',[]],
['youtube-dnn',2016,'Deep Neural Networks for YouTube Recommendations','YouTube DNN','recsys','deep',['mf','word2vec']],
['wide-deep',2016,'Wide & Deep Learning for Recommender Systems','Wide & Deep','recsys','deep',['mf']],
['ncf',2017,'Neural Collaborative Filtering','NCF','recsys','deep',['mf']],
['deepfm',2017,'DeepFM: A Factorization-Machine based Neural Network for CTR Prediction','DeepFM','recsys','deep',['wide-deep']],
['din',2018,'Deep Interest Network for Click-Through Rate Prediction','DIN','recsys','deep',['deepfm','bahdanau']],
['sasrec',2018,'Self-Attentive Sequential Recommendation','SASRec','recsys','seq',['transformer','mf']],
['bert4rec',2019,'BERT4Rec: Sequential Recommendation with Bidirectional Transformer','BERT4Rec','recsys','seq',['sasrec','bert']],
['two-tower',2019,'Sampling-Bias-Corrected Neural Modeling for Large Corpus Item Recommendations','투 타워','recsys','deep',['youtube-dnn','ncf']],

// ── ir ─────────────────────────────────────────────────────
['hnsw',2016,'Efficient and Robust Approximate Nearest Neighbor Search Using HNSW Graphs','HNSW','ir','index',[]],
['faiss',2017,'Billion-Scale Similarity Search with GPUs (FAISS)','FAISS','ir','index',['hnsw']],
['sentence-bert',2019,'Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks','Sentence-BERT','ir','embed',['bert']],
['colbert',2020,'ColBERT: Efficient and Effective Passage Search via Late Interaction','ColBERT','ir','late',['bert','dpr']],
['simcse',2021,'SimCSE: Simple Contrastive Learning of Sentence Embeddings','SimCSE','ir','embed',['sentence-bert','simclr']],
['splade',2021,'SPLADE: Sparse Lexical and Expansion Model for Information Retrieval','SPLADE','ir','late',['bert','colbert']],
['e5',2022,'Text Embeddings by Weakly-Supervised Contrastive Pre-training (E5)','E5','ir','embed',['simcse','sentence-bert']],
['bge',2023,'C-Pack: Packed Resources For General Chinese Embeddings (BGE)','BGE','ir','embed',['e5']],

// ── code ───────────────────────────────────────────────────
['codebert',2020,'CodeBERT: A Pre-Trained Model for Programming and Natural Languages','CodeBERT','code','pretrain',['bert','roberta']],
['codet5',2021,'CodeT5: Identifier-aware Unified Pre-trained Encoder-Decoder Models for Code','CodeT5','code','pretrain',['t5','codebert']],
['alphacode',2022,'Competition-Level Code Generation with AlphaCode','AlphaCode','code','pretrain',['transformer','humaneval']],
['starcoder',2023,'StarCoder: may the source be with you!','StarCoder','code','pretrain',['codet5','llama']],
['codellama',2023,'Code Llama: Open Foundation Models for Code','Code Llama','code','pretrain',['llama2','starcoder']],
['swe-bench',2023,'SWE-bench: Can Language Models Resolve Real-World GitHub Issues?','SWE-bench','code','bench',['humaneval','gpt4']],
['deepseek-coder',2024,'DeepSeek-Coder: When the Large Language Model Meets Programming','DeepSeek-Coder','code','pretrain',['codellama','deepseek-v3']],
['swe-agent',2024,'SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering','SWE-agent','code','agent',['swe-bench','react']],

// ── video ──────────────────────────────────────────────────
['two-stream',2014,'Two-Stream Convolutional Networks for Action Recognition in Videos','Two-Stream','video','understand',['alexnet']],
['i3d',2017,'Quo Vadis, Action Recognition? A New Model and the Kinetics Dataset (I3D)','I3D','video','understand',['two-stream','googlenet']],
['slowfast',2019,'SlowFast Networks for Video Recognition','SlowFast','video','understand',['i3d','resnet']],
['timesformer',2021,'Is Space-Time Attention All You Need for Video Understanding? (TimeSformer)','TimeSformer','video','understand',['vit','i3d']],
['video-diffusion',2022,'Video Diffusion Models','Video Diffusion','video','generate',['ddpm','unet']],
['videomae',2022,'VideoMAE: Masked Autoencoders are Data-Efficient Learners for Video','VideoMAE','video','understand',['mae','timesformer']],
['make-a-video',2022,'Make-A-Video: Text-to-Video Generation without Text-Video Data','Make-A-Video','video','generate',['video-diffusion','dalle']],
['videoldm',2023,'Align your Latents: High-Resolution Video Synthesis with Latent Diffusion Models','Video LDM','video','generate',['ldm','video-diffusion']],
['svd',2023,'Stable Video Diffusion: Scaling Latent Video Diffusion Models to Large Datasets','Stable Video Diffusion','video','generate',['videoldm','ldm']],

// ── robotics ───────────────────────────────────────────────
['gato',2022,'A Generalist Agent (Gato)','Gato','robotics','vla',['transformer','dqn']],
['saycan',2022,'Do As I Can, Not As I Say: Grounding Language in Robotic Affordances (SayCan)','SayCan','robotics','vla',['palm','cot']],
['rt1',2022,'RT-1: Robotics Transformer for Real-World Control at Scale','RT-1','robotics','vla',['gato','efficientnet']],
['act',2023,'Learning Fine-Grained Bimanual Manipulation with Low-Cost Hardware (ACT / ALOHA)','ACT · ALOHA','robotics','imitation',['transformer','vae']],
['diffusion-policy',2023,'Diffusion Policy: Visuomotor Policy Learning via Action Diffusion','Diffusion Policy','robotics','imitation',['ddpm','act']],
['rt2',2023,'RT-2: Vision-Language-Action Models Transfer Web Knowledge to Robotic Control','RT-2','robotics','vla',['rt1','clip','palm']],
['openvla',2024,'OpenVLA: An Open-Source Vision-Language-Action Model','OpenVLA','robotics','vla',['rt2','llava']],
['pi0',2024,'π0: A Vision-Language-Action Flow Model for General Robot Control','π0','robotics','vla',['openvla','diffusion-policy','flow-matching']],

// ── science ────────────────────────────────────────────────
['fno',2021,'Fourier Neural Operator for Parametric Partial Differential Equations','FNO','science','phys',['backprop']],
['alphafold',2021,'Highly Accurate Protein Structure Prediction with AlphaFold','AlphaFold 2','science','bio',['transformer','resnet']],
['esmfold',2023,'Evolutionary-Scale Prediction of Atomic-Level Protein Structure with a Language Model','ESMFold','science','bio',['alphafold','bert']],
['graphcast',2023,'GraphCast: Learning Skillful Medium-Range Global Weather Forecasting','GraphCast','science','phys',['gcn','mpnn']],
['pangu-weather',2023,'Accurate Medium-Range Global Weather Forecasting with 3D Neural Networks','Pangu-Weather','science','phys',['vit','fno']],
['gnome',2023,'Scaling Deep Learning for Materials Discovery (GNoME)','GNoME','science','math',['gcn','mpnn']],
['alphageometry',2024,'Solving Olympiad Geometry without Human Demonstrations','AlphaGeometry','science','math',['transformer','alphazero']],
['alphafold3',2024,'Accurate Structure Prediction of Biomolecular Interactions with AlphaFold 3','AlphaFold 3','science','bio',['alphafold','ddpm']],

// ── data ───────────────────────────────────────────────────
['the-pile',2020,'The Pile: An 800GB Dataset of Diverse Text for Language Modeling','The Pile','data','corpus',['gpt3']],
['dedup',2022,'Deduplicating Training Data Makes Language Models Better','중복 제거','data','curate',['the-pile','gpt2']],
['laion5b',2022,'LAION-5B: An Open Large-Scale Dataset for Training Next Generation Image-Text Models','LAION-5B','data','corpus',['clip']],
['self-instruct',2022,'Self-Instruct: Aligning Language Models with Self-Generated Instructions','Self-Instruct','data','synth',['gpt3','flan']],
['refinedweb',2023,'The RefinedWeb Dataset for Falcon LLM','RefinedWeb','data','curate',['the-pile','chinchilla']],
['datacomp',2023,'DataComp: In Search of the Next Generation of Multimodal Datasets','DataComp','data','curate',['laion5b','clip']],
['phi-textbooks',2023,'Textbooks Are All You Need (phi-1)','교과서 데이터','data','synth',['self-instruct','chinchilla']],
['data-constrained',2023,'Scaling Data-Constrained Language Models','데이터 제약 스케일링','data','curate',['chinchilla','scaling-laws']],

// ── theory ─────────────────────────────────────────────────
['rethinking-generalization',2017,'Understanding Deep Learning Requires Rethinking Generalization','일반화 재고','theory','general',['dropout','batchnorm']],
['large-batch',2017,'On Large-Batch Training for Deep Learning: Generalization Gap and Sharp Minima','큰 배치의 함정','theory','optim',['adam','batchnorm']],
['lr-scaling',2017,'Accurate, Large Minibatch SGD: Training ImageNet in 1 Hour','선형 스케일링 규칙','theory','optim',['large-batch','resnet']],
['ntk',2018,'Neural Tangent Kernel: Convergence and Generalization in Neural Networks','신경 접선 커널','theory','general',['backprop']],
['empirical-batch',2018,'An Empirical Model of Large-Batch Training','임계 배치 크기','theory','optim',['large-batch','adam']],
['double-descent',2019,'Deep Double Descent: Where Bigger Models and More Data Hurt','이중 하강','theory','general',['rethinking-generalization','lottery']],

// ── privacy ────────────────────────────────────────────────
['dp-sgd',2016,'Deep Learning with Differential Privacy (DP-SGD)','DP-SGD','privacy','dp',['backprop']],
['fedavg',2017,'Communication-Efficient Learning of Deep Networks from Decentralized Data (FedAvg)','FedAvg','privacy','fed',['backprop']],
['membership-inference',2017,'Membership Inference Attacks Against Machine Learning Models','멤버십 추론 공격','privacy','attack',['dp-sgd']],
['extracting-training-data',2021,'Extracting Training Data from Large Language Models','학습 데이터 추출','privacy','attack',['gpt2','membership-inference']],
['red-teaming',2022,'Red Teaming Language Models to Reduce Harms','레드팀','privacy','safety',['instructgpt']],
['watermark',2023,'A Watermark for Large Language Models','LLM 워터마크','privacy','safety',['gpt3']],
['universal-jailbreak',2023,'Universal and Transferable Adversarial Attacks on Aligned Language Models','범용 탈옥 공격','privacy','attack',['llama2','gpt4']],
['sleeper-agents',2024,'Sleeper Agents: Training Deceptive LLMs that Persist Through Safety Training','슬리퍼 에이전트','privacy','safety',['constitutional','instructgpt']],

// ── llm / 긴 문맥 ──────────────────────────────────────────
['position-interpolation',2023,'Extending Context Window of Large Language Models via Positional Interpolation','위치 보간','llm','context',['rope','llama']],
['lost-in-the-middle',2023,'Lost in the Middle: How Language Models Use Long Contexts','중간을 잃다','llm','context',['gpt4','rag']],
['yarn',2023,'YaRN: Efficient Context Window Extension of Large Language Models','YaRN','llm','context',['rope','position-interpolation']],
['ring-attention',2023,'Ring Attention with Blockwise Transformers for Near-Infinite Context','Ring Attention','llm','context',['flashattention','transformer']],

// ── agent / 도구 추가 ──────────────────────────────────────
['reflexion',2023,'Reflexion: Language Agents with Verbal Reinforcement Learning','Reflexion','agent','tool',['react','cot']],
['voyager',2023,'Voyager: An Open-Ended Embodied Agent with Large Language Models','Voyager','agent','tool',['react','gpt4']],
['generative-agents',2023,'Generative Agents: Interactive Simulacra of Human Behavior','생성 에이전트','agent','tool',['react','gpt4']],

// ════════ 2차 확장 ════════
// ── vision ─────────────────────────────────────────────────
['spatial-transformer',2015,'Spatial Transformer Networks','Spatial Transformer','vision','cnn',['alexnet','backprop']],
['openpose',2017,'Realtime Multi-Person 2D Pose Estimation using Part Affinity Fields','OpenPose','vision','dense',['fcn','vgg']],
['senet',2018,'Squeeze-and-Excitation Networks','SENet','vision','cnn',['resnet','googlenet']],
['mixup',2018,'mixup: Beyond Empirical Risk Minimization','mixup','vision','cnn',['resnet','dropout']],
['raft',2020,'RAFT: Recurrent All-Pairs Field Transforms for Optical Flow','RAFT','vision','dense',['fcn','lstm']],
['depth-anything',2024,'Depth Anything: Unleashing the Power of Large-Scale Unlabeled Data','Depth Anything','vision','dense',['dinov2','sam']],

// ── nlp / llm ──────────────────────────────────────────────
['sentencepiece',2018,'SentencePiece: A Simple and Language Independent Subword Tokenizer','SentencePiece','nlp','repr',['bpe']],
['bart',2019,'BART: Denoising Sequence-to-Sequence Pre-training','BART','llm','pretrain',['bert','t5','transformer']],
['electra',2020,'ELECTRA: Pre-training Text Encoders as Discriminators Rather Than Generators','ELECTRA','llm','pretrain',['bert','gan']],
['qwen2',2024,'Qwen2 Technical Report','Qwen2','llm','open',['llama2','gqa','rope']],
['olmo',2024,'OLMo: Accelerating the Science of Language Models','OLMo','llm','open',['llama','the-pile']],

// ── efficiency ─────────────────────────────────────────────
['flashattention2',2023,'FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning','FlashAttention-2','efficiency','attn',['flashattention']],
['medusa',2024,'Medusa: Simple LLM Inference Acceleration with Multiple Decoding Heads','Medusa','efficiency','serve',['speculative','vllm']],
['sglang',2024,'SGLang: Efficient Execution of Structured Language Model Programs','SGLang','efficiency','serve',['vllm','flashattention']],
['mamba2',2024,'Transformers are SSMs: Generalized Models and Efficient Algorithms (Mamba-2)','Mamba-2','efficiency','ssm',['mamba','flashattention']],

// ── generative ─────────────────────────────────────────────
['imagen',2022,'Photorealistic Text-to-Image Diffusion Models with Deep Language Understanding','Imagen','generative','diffusion',['ddpm','cfg','t5']],
['dreambooth',2023,'DreamBooth: Fine Tuning Text-to-Image Diffusion Models for Subject-Driven Generation','DreamBooth','generative','diffusion',['ldm','imagen']],
['controlnet',2023,'Adding Conditional Control to Text-to-Image Diffusion Models (ControlNet)','ControlNet','generative','diffusion',['ldm','cfg']],
['sdxl',2023,'SDXL: Improving Latent Diffusion Models for High-Resolution Image Synthesis','SDXL','generative','diffusion',['ldm','cfg']],

// ── multimodal ─────────────────────────────────────────────
['pali',2022,'PaLI: A Jointly-Scaled Multilingual Language-Image Model','PaLI','multimodal','vlm',['vit','t5','clip']],
['chameleon',2024,'Chameleon: Mixed-Modal Early-Fusion Foundation Models','Chameleon','multimodal','vlm',['vqgan','llama2']],
['internvl',2024,'InternVL: Scaling up Vision Foundation Models and Aligning for Generic Visual-Linguistic Tasks','InternVL','multimodal','vlm',['clip','llava','qwen-vl']],

// ── rl ─────────────────────────────────────────────────────
['world-models',2018,'World Models','World Models','rl','world',['vae','lstm']],
['rainbow',2018,'Rainbow: Combining Improvements in Deep Reinforcement Learning','Rainbow','rl','value',['dqn']],
['alphastar',2019,'Grandmaster Level in StarCraft II using Multi-Agent Reinforcement Learning','AlphaStar','rl','search',['alphazero','lstm','ppo']],
['dreamer',2020,'Dream to Control: Learning Behaviors by Latent Imagination (Dreamer)','Dreamer','rl','world',['world-models','muzero']],

// ── agent ──────────────────────────────────────────────────
['pal',2022,'PAL: Program-aided Language Models','PAL','agent','reason',['cot','humaneval']],
['least-to-most',2022,'Least-to-Most Prompting Enables Complex Reasoning in Large Language Models','Least-to-Most','agent','reason',['cot']],
['self-refine',2023,'Self-Refine: Iterative Refinement with Self-Feedback','Self-Refine','agent','reason',['cot','reflexion']],

// ── interp ─────────────────────────────────────────────────
['lime',2016,'Why Should I Trust You? Explaining the Predictions of Any Classifier (LIME)','LIME','interp','xai',['backprop']],
['grad-cam',2017,'Grad-CAM: Visual Explanations from Deep Networks via Gradient-based Localization','Grad-CAM','interp','xai',['vgg','resnet']],
['shap',2017,'A Unified Approach to Interpreting Model Predictions (SHAP)','SHAP','interp','xai',['lime']],
['attention-not-explanation',2019,'Attention is not Explanation','attention은 설명이 아니다','interp','xai',['bahdanau','transformer']],
['helm',2022,'Holistic Evaluation of Language Models (HELM)','HELM','interp','eval',['mmlu','bigbench']],

// ── speech · graph · ir ────────────────────────────────────
['conformer',2020,'Conformer: Convolution-augmented Transformer for Speech Recognition','Conformer','speech','asr',['transformer','resnet']],
['pinsage',2018,'Graph Convolutional Neural Networks for Web-Scale Recommender Systems (PinSage)','PinSage','graph','conv',['graphsage','mf']],
['bm25',1994,'Okapi at TREC-3 (BM25)','BM25','ir','late',[]],
['monobert',2019,'Passage Re-ranking with BERT','monoBERT','ir','late',['bert','bm25']],

// ── video · robotics · data · theory · privacy ─────────────
['cogvideox',2024,'CogVideoX: Text-to-Video Diffusion Models with An Expert Transformer','CogVideoX','video','generate',['dit','videoldm']],
['open-x',2023,'Open X-Embodiment: Robotic Learning Datasets and RT-X Models','Open X-Embodiment','robotics','vla',['rt1','rt2']],
['mobile-aloha',2024,'Mobile ALOHA: Learning Bimanual Mobile Manipulation with Low-Cost Whole-Body Teleoperation','Mobile ALOHA','robotics','imitation',['act','diffusion-policy']],
['dolma',2024,'Dolma: an Open Corpus of Three Trillion Tokens for Language Model Pretraining','Dolma','data','corpus',['the-pile','refinedweb']],
['fineweb',2024,'The FineWeb Datasets: Decanting the Web for the Finest Text Data at Scale','FineWeb','data','curate',['refinedweb','dedup']],
['information-bottleneck',2017,'Opening the Black Box of Deep Neural Networks via Information','정보 병목','theory','general',['backprop','rethinking-generalization']],
['sam-optimizer',2021,'Sharpness-Aware Minimization for Efficiently Improving Generalization','SAM 옵티마이저','theory','optim',['large-batch','adam']],
['machine-unlearning',2021,'Machine Unlearning','기계 망각','privacy','dp',['dp-sgd','membership-inference']],

// ════════ 3차 확장 — 원문 참고문헌에서 캐낸 빈 자리 ════════
// (tools/mine_refs.py 로 250편의 참고문헌을 훑어, 우리 위키가 공통으로
//  참조하는데 없던 논문을 참조 빈도 순으로 추린 것)
['adamw',2017,'Decoupled Weight Decay Regularization (AdamW)','AdamW','foundations','learning',['adam']],
['gelu',2016,'Gaussian Error Linear Units (GELUs)','GELU','foundations','stabilize',['backprop','dropout']],
['graves-rnn',2013,'Generating Sequences With Recurrent Neural Networks','Graves RNN','nlp','seq',['lstm']],
['gnmt',2016,"Google's Neural Machine Translation System",'GNMT','nlp','seq',['seq2seq','bahdanau','bpe']],
['sparse-transformers',2019,'Generating Long Sequences with Sparse Transformers','Sparse Transformer','efficiency','attn',['transformer']],
['gopher',2021,'Scaling Language Models: Methods, Analysis & Insights from Training Gopher','Gopher','llm','scale',['gpt3','scaling-laws']],
['lamda',2022,'LaMDA: Language Models for Dialog Applications','LaMDA','llm','align',['transformer','gpt3']],
['opt',2022,'OPT: Open Pre-trained Transformer Language Models','OPT','llm','open',['gpt3']],
['bloom',2022,'BLOOM: A 176B-Parameter Open-Access Multilingual Language Model','BLOOM','llm','open',['gpt3','opt']],
['flan-t5',2022,'Scaling Instruction-Finetuned Language Models (Flan-T5)','Flan-T5','llm','align',['flan','t5','cot']],
['general-assistant',2021,'A General Language Assistant as a Laboratory for Alignment','범용 어시스턴트','llm','align',['gpt3']],
['anthropic-hh',2022,'Training a Helpful and Harmless Assistant with RLHF','HH-RLHF','llm','align',['instructgpt','summarize-hf','general-assistant']],
['glide',2022,'GLIDE: Text-Guided Diffusion for Image Generation and Editing','GLIDE','generative','diffusion',['ddpm','cfg','clip']],
['dalle2',2022,'Hierarchical Text-Conditional Image Generation with CLIP Latents (DALL·E 2)','DALL·E 2','generative','diffusion',['clip','glide','ddpm']],
['cpc',2018,'Representation Learning with Contrastive Predictive Coding','CPC','vision','selfsup',['word2vec','backprop']],
['arc-bench',2018,'Think you have Solved Question Answering? Try ARC','ARC','interp','eval',['elmo']],
['hellaswag',2019,'HellaSwag: Can a Machine Really Finish Your Sentence?','HellaSwag','interp','eval',['bert','gpt2']],
['math-dataset',2021,'Measuring Mathematical Problem Solving With the MATH Dataset','MATH','interp','eval',['gpt3','gsm8k']],
['bbh',2022,'Challenging BIG-Bench Tasks and Whether Chain-of-Thought Can Solve Them','BIG-Bench Hard','interp','eval',['bigbench','cot']],
['mbpp',2021,'Program Synthesis with Large Language Models (MBPP)','MBPP','code','bench',['humaneval']],
['foundation-models',2021,'On the Opportunities and Risks of Foundation Models','파운데이션 모델 보고서','interp','eval',['gpt3','bert','clip']],

// ════════ 4차 확장 — 참고문헌 채굴 2회차 ════════
['diffusion-original',2015,'Deep Unsupervised Learning using Nonequilibrium Thermodynamics','확산 모델의 원조','generative','diffusion',['vae','backprop']],
['grad-checkpointing',2016,'Training Deep Nets with Sublinear Memory Cost','gradient 체크포인팅','efficiency','serve',['backprop','resnet']],
['mixed-precision',2017,'Mixed Precision Training','혼합 정밀도 학습','efficiency','serve',['adam','batchnorm']],
['scaling-predictable',2017,'Deep Learning Scaling is Predictable, Empirically','예측 가능한 스케일링','llm','scale',['resnet','lstm']],
['lm-limits',2016,'Exploring the Limits of Language Modeling','언어모델의 한계 탐색','nlp','seq',['lstm','nnlm']],
['decoder-only-wiki',2018,'Generating Wikipedia by Summarizing Long Sequences','decoder-only Transformer','llm','core',['transformer']],
['glue',2018,'GLUE: A Multi-Task Benchmark for Natural Language Understanding','GLUE','interp','eval',['elmo']],
['superglue',2019,'SuperGLUE: A Stickier Benchmark for General-Purpose Language Understanding','SuperGLUE','interp','eval',['glue','bert']],
['decanlp',2018,'The Natural Language Decathlon: Multitask Learning as Question Answering','decaNLP','interp','eval',['seq2seq','elmo']],
['xlnet',2019,'XLNet: Generalized Autoregressive Pretraining for Language Understanding','XLNet','llm','pretrain',['bert','transformer']],
['glu-variants',2020,'GLU Variants Improve Transformer (SwiGLU)','SwiGLU','llm','core',['transformer','t5']],
['scratchpad',2021,'Show Your Work: Scratchpads for Intermediate Computation','Scratchpad','agent','reason',['transformer','gpt3']],
['retro',2021,'Improving Language Models by Retrieving from Trillions of Tokens (RETRO)','RETRO','ir','dense',['rag','realm','gopher']],
['truthfulqa',2021,'TruthfulQA: Measuring How Models Mimic Human Falsehoods','TruthfulQA','interp','eval',['gpt3']],
['boolq',2019,'BoolQ: Exploring the Surprising Difficulty of Natural Yes/No Questions','BoolQ','interp','eval',['bert','glue']],
['triviaqa',2017,'TriviaQA: A Large Scale Distantly Supervised Challenge Dataset','TriviaQA','interp','eval',['seq2seq']],
['openbookqa',2018,'Can a Suit of Armor Conduct Electricity? Open Book Question Answering','OpenBookQA','interp','eval',['arc-bench']],
['carbon',2021,'Carbon Emissions and Large Neural Network Training','학습의 탄소 배출','llm','scale',['gpt3','scaling-laws']],
['ethical-risks',2021,'Ethical and Social Risks of Harm from Language Models','언어모델의 위해 분류','privacy','safety',['gpt3','gopher']],
['gpt-neox',2022,'GPT-NeoX-20B: An Open-Source Autoregressive Language Model','GPT-NeoX-20B','llm','open',['gpt3','the-pile']],
['ul2',2022,'UL2: Unifying Language Learning Paradigms','UL2','llm','pretrain',['t5','bart','xlnet']],
['cascaded-diffusion',2021,'Cascaded Diffusion Models for High Fidelity Image Generation','Cascaded Diffusion','generative','diffusion',['ddpm','sr3']],
['sr3',2021,'Image Super-Resolution via Iterative Refinement (SR3)','SR3','generative','diffusion',['ddpm']],
['coco-captions',2015,'Microsoft COCO Captions: Data Collection and Evaluation Server','COCO Captions','data','corpus',['imagenet']],
['ucf101',2012,'UCF101: A Dataset of 101 Human Action Classes From Videos in The Wild','UCF101','video','understand',['imagenet']]
];

WIKI.META = WIKI.INDEX.map(function(r){
  return { slug:r[0], year:r[1], title:r[2], ko:r[3], field:r[4], track:r[5], parents:r[6] };
});
