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
      {id:'selfsup', name:'자기지도 학습'}
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
      {id:'open',     name:'오픈 웨이트 모델'}
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
      {id:'vlm',         name:'Vision-Language 모델'},
      {id:'speech',      name:'음성 · 오디오'}
    ]},

  { id:'rl', name:'강화학습', en:'Reinforcement Learning',
    color:'#f0674a',
    blurb:'보상으로 배우는 계보. Atari에서 바둑, 그리고 사람 선호(RLHF)를 거쳐 LLM 추론 학습까지 이어진다.',
    tracks:[
      {id:'value',  name:'가치 기반'},
      {id:'policy', name:'정책 경사'},
      {id:'search', name:'탐색 + 학습'},
      {id:'rlhf',   name:'사람 피드백 · LLM RL'}
    ]},

  { id:'agent', name:'추론 · 도구 · 검색', en:'Reasoning & Agents',
    color:'#4bb3d4',
    blurb:'모델을 "쓰는 법"이 곧 능력이 된 영역. 사고 사슬, 도구 호출, 검색 증강, 그리고 추론 자체를 학습하는 모델.',
    tracks:[
      {id:'reason',    name:'추론 유도'},
      {id:'tool',      name:'도구 · 에이전트'},
      {id:'retrieval', name:'검색 증강(RAG)'}
    ]},

  { id:'interp', name:'해석 · 평가 · 안전', en:'Interpretability & Eval',
    color:'#9aa04b',
    blurb:'모델 안에서 무슨 일이 일어나는지, 그리고 잘하는지 어떻게 재는지. 성능 경쟁 뒤편의 인프라.',
    tracks:[
      {id:'interp', name:'내부 해석'},
      {id:'eval',   name:'벤치마크'},
      {id:'safety', name:'안전 · 정렬 연구'}
    ]}
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
['ddpm',2020,'Denoising Diffusion Probabilistic Models','DDPM','generative','diffusion',['vae','unet']],
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
['wav2vec2',2020,'wav2vec 2.0: Self-Supervised Learning of Speech Representations','wav2vec 2.0','multimodal','speech',['transformer','bert']],
['whisper',2022,'Robust Speech Recognition via Large-Scale Weak Supervision (Whisper)','Whisper','multimodal','speech',['transformer','wav2vec2']],

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
['dpr',2020,'Dense Passage Retrieval for Open-Domain QA','DPR','agent','retrieval',['bert']],
['realm',2020,'REALM: Retrieval-Augmented Language Model Pre-Training','REALM','agent','retrieval',['bert','dpr']],
['rag',2020,'Retrieval-Augmented Generation for Knowledge-Intensive NLP','RAG','agent','retrieval',['dpr','bert']],

// ── interp ─────────────────────────────────────────────────
['lottery',2019,'The Lottery Ticket Hypothesis','로또 티켓 가설','interp','interp',['dropout']],
['induction-heads',2022,'In-context Learning and Induction Heads','Induction Heads','interp','interp',['transformer','gpt3']],
['grokking',2022,'Grokking: Generalization Beyond Overfitting','Grokking','interp','interp',['transformer']],
['sae',2023,'Towards Monosemanticity: Decomposing Language Models with Dictionary Learning','Sparse Autoencoder','interp','interp',['induction-heads']],
['mmlu',2021,'Measuring Massive Multitask Language Understanding (MMLU)','MMLU','interp','eval',['gpt3']],
['gsm8k',2021,'Training Verifiers to Solve Math Word Problems (GSM8K)','GSM8K','interp','eval',['gpt3']],
['humaneval',2021,'Evaluating Large Language Models Trained on Code (Codex/HumanEval)','HumanEval','interp','eval',['gpt3']],
['bigbench',2022,'Beyond the Imitation Game (BIG-bench)','BIG-bench','interp','eval',['gpt3','mmlu']],
['constitutional',2022,'Constitutional AI: Harmlessness from AI Feedback','Constitutional AI','interp','safety',['instructgpt']],
['chatbot-arena',2024,'Chatbot Arena: An Open Platform for Evaluating LLMs by Human Preference','Chatbot Arena','interp','eval',['mmlu','instructgpt']]
];

WIKI.META = WIKI.INDEX.map(function(r){
  return { slug:r[0], year:r[1], title:r[2], ko:r[3], field:r[4], track:r[5], parents:r[6] };
});
