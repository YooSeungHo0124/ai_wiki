WIKI.paper({
slug:'yarn',
venue:'ICLR 2024 (arXiv 2023)',
authors:'Peng, Quesnelle, Fan, Shippole (Nous Research · EleutherAI · U. Geneva)',
arxiv:'2309.00071',

tldr:'[Position Interpolation](#/p/position-interpolation)이 RoPE의 모든 차원을 똑같은 비율로 압축하는 것을 문제 삼아, 차원별 주파수에 따라 다르게 스케일링하고(NTK-by-parts) softmax 앞에 온도 보정을 추가했다. 원본 사전학습 데이터의 **0.1% 미만**으로 미세조정해 당시 최고 성능의 문맥 확장을 달성했다.',

context:'PI가 2048→32768 확장을 보인 뒤, 오픈소스 커뮤니티(bloc97, emozilla 등)에서 "NTK-aware"·"Dynamic NTK" 같은 비공식 개선안이 먼저 나왔다. 이들은 PI가 [RoPE](#/p/rope)의 모든 주파수 차원을 동일한 배율 $s$ 로 누르는 것이 비효율적이라고 지적했다 — 짧은 파장(고주파) 차원은 국소적인 토큰 순서 구분에, 긴 파장(저주파) 차원은 전역적인 위치 구분에 쓰이는데, 이 둘을 같은 비율로 뭉개면 가까운 토큰끼리의 상대 위치 정보가 손상된다. YaRN은 이 커뮤니티 아이디어들을 체계화하고 이론적으로 정리해 하나의 방법으로 묶는다.',

ideas:[
 {h:'파장으로 RoPE 차원을 세 구간으로 나눈다',
  lead:'차원별 파장 $\\lambda_d$ 를 원 문맥 길이 $L$ 과 비교해 보간 정도를 다르게 정한다.',
  d:'RoPE의 $d$ 번째 차원은 파장 $\\lambda_d = 2\\pi/\\theta_d$ 를 가진다. 파장이 $L$ 보다 훨씬 짧은 고주파 차원은 이미 학습 중에 여러 주기를 다 봤으므로 **보간하지 않는다**. 파장이 $L$ 보다 길거나 같은 저주파 차원은 외삽하면 위험하므로 **PI처럼 전부 보간**한다. 그 중간 차원은 둘을 섞는다 — 이것이 "NTK-by-parts"다.'},
 {h:'ramp 함수로 세 구간을 매끄럽게 잇는다',
  lead:'구간 경계에서 값이 튀지 않도록 선형 ramp로 보간 비율을 연속적으로 바꾼다.',
  d:'세 구간을 딱 자르면 경계에서 표현이 불연속으로 튄다. $\\alpha,\\beta$ 두 임계값 사이를 선형 ramp 함수로 이어 저주파에서 고주파로 갈수록 보간 강도가 서서히 줄어들게 만든다. LLaMA 계열에서는 $\\alpha=1$, $\\beta=32$ 가 경험적으로 잘 맞았다.'},
 {h:'attention 온도 보정: softmax 앞에 $1/t$ 를 곱한다',
  lead:'문맥이 길어지면 attention 분포의 엔트로피가 높아지는데, 이를 온도로 상쇄한다.',
  d:'문맥 창을 늘리면 softmax가 더 많은 토큰에 분산돼 attention이 평평해지는(엔트로피 증가) 현상이 나타난다. $QK^T$ 를 $\\sqrt{|D|}$ 뿐 아니라 스케일 $t$ 로 한 번 더 나누면 이 분산을 데이터·위치에 무관하게 균일하게 되돌릴 수 있다. RoPE는 복소수 회전이므로 $q_m, k_n$ 에 $1/\\sqrt{t}$ 를 미리 곱해두는 것만으로 코드 변경 없이 구현된다 — 추론·학습 오버헤드가 0이다.'},
 {h:'경험식 하나로 온도를 스케일 배율에 묶는다',
  lead:'$\\sqrt{1/t} = 0.1\\ln(s) + 1$ 이라는 한 줄 경험식이 여러 모델 크기에서 두루 통한다.',
  d:'LLaMA 7B~65B에서 스케일 배율 $s$ 별 최적 온도를 미세조정 없이 grid search로 찾은 뒤 이 관계식으로 근사했다. 놀랍게도 같은 식이 Llama 2 7B~70B에도 잘 맞아, 이 온도-엔트로피 관계가 모델 간에 어느 정도 보편적임을 시사한다.'},
 {h:'NTK-by-parts와 온도 보정을 합친 것이 YaRN',
  lead:'두 기법을 결합하면 미세조정 유무와 관계없이 이전 모든 보간법을 능가한다.',
  d:'YaRN은 별도 아키텍처 변경이 아니라 위치 인코딩 생성 단계에서 끝나므로 [FlashAttention 2](#/p/flashattention)와 완전히 호환된다. 원 사전학습 데이터의 0.1% 미만, 400스텝 미세조정만으로 Llama 2를 64K 문맥까지 확장했고, 여기서 200스텝을 더 얹어 128K로 외삽(extrapolate)하는 것까지 성공했다.'}
],

diagram:{type:'flow', cap:'YaRN에 이르는 계보. RoPE에서 두 갈래로 갈라진 개선안이 NTK-by-parts로 합쳐지고, 여기에 attention 온도 보정을 더한 것이 YaRN.',
 nodes:[
  {t:'RoPE', s:'모든 위치 그대로 사용'},
  {t:'PI/NTK-aware', s:'균등 압축 vs 주파수 반영'},
  {t:'NTK-by-parts', s:'차원별 ramp 보간', acc:true},
  {t:'YaRN', s:'+ softmax 온도 보정'}
 ]},

math:[
 {expr:'h(θ_d) = (1 − γ(d)) · θ_d/s + γ(d) · θ_d',
  tex:'h(\\theta_d) = \\left(1-\\gamma_{r(d)}\\right)\\frac{\\theta_d}{s} + \\gamma_{r(d)}\\,\\theta_d',
  d:'NTK-by-parts 보간 함수. $\\gamma_{r(d)}\\in[0,1]$ 은 ramp 함수 값으로, 저주파 차원($\\gamma=0$)은 PI처럼 $s$ 로 나누고 고주파 차원($\\gamma=1$)은 원래 $\\theta_d$ 를 그대로 쓴다.'},
 {expr:'softmax( qmᵀkn / (t·√|D|) )',
  tex:'\\text{softmax}\\!\\left(\\frac{\\boldsymbol{q}_m^{\\top}\\boldsymbol{k}_n}{t\\sqrt{|D|}}\\right)',
  d:'attention 온도 보정. $t$ 로 한 번 더 나눠 softmax 분포를 뾰족하게 되돌린다. 실제 구현은 $q,k$ 자체를 $1/\\sqrt{t}$ 로 스케일해 RoPE 계산에 흡수시킨다.'},
 {expr:'sqrt(1/t) = 0.1 ln(s) + 1',
  tex:'\\sqrt{1/t} = 0.1\\ln(s) + 1',
  d:'스케일 배율 $s$ 로부터 최적 온도를 구하는 경험식. LLaMA·Llama 2 여러 크기에서 재사용 가능함을 확인했다.'}
],

numbers:[
 {k:'미세조정 데이터', v:'< 0.1%', d:'원 사전학습 데이터 대비 (PG19 등으로 400스텝)'},
 {k:'128K 확장', v:'400 + 200 스텝', d:'Llama 2 7B/13B를 64K로 미세조정(s=16) 후 200스텝 추가로 128K까지 외삽(s=32)'},
 {k:'PPL·128K, 7B s=32', v:'2.37', d:'Proof-pile 10편, sliding window PPL(S=256)'},
 {k:'NTK-by-parts 임계값', v:'α=1, β=32', d:'LLaMA 계열에서 경험적으로 좋은 ramp 경계'},
 {k:'Dynamic-YaRN', v:'2배 이상 확장', d:'추론 중 동적 스케일링과 결합 시 미세조정 없이도 확장'}
],

impact:'YaRN 이후 오픈소스 LLM의 긴 문맥 확장은 사실상 이 레시피(NTK-by-parts + 온도 보정)를 표준으로 채택했다. Llama 3, Mistral 계열을 비롯한 다수의 커뮤니티 파인튜닝이 YaRN 스케일링을 기본 옵션으로 제공하며, "얼마나 적은 데이터로 문맥을 늘릴 수 있는가" 경쟁에서 하나의 기준점이 됐다. 동시에 커뮤니티(비논문) 아이디어를 학술 논문이 사후에 이론적으로 정리·검증한 사례로도 자주 언급된다.',

legacy:[
 '**차원별 스케일링의 정착** — 이후 등장한 대부분의 RoPE 확장 기법이 "모든 차원 동일 취급"을 하지 않는 것을 기본 전제로 삼게 됨',
 '**추론 시점 동적 스케일링** — Dynamic-YaRN처럼 시퀀스 길이에 맞춰 그때그때 스케일을 계산하는 방식이 서빙 스택에 흡수됨',
 '**분산 처리와의 결합** — 문맥을 늘리는 쪽(YaRN)과 늘어난 문맥을 여러 장치에 분산하는 쪽([Ring Attention](#/p/ring-attention))이 서로 다른 축의 문제로 분리되어 함께 쓰임',
 '**늘린 문맥의 실사용 검증 필요성** — [Lost in the Middle](#/p/lost-in-the-middle)이 지적하듯, YaRN으로 perplexity를 낮춰도 그 창을 실제로 고르게 활용하는지는 별도로 검증해야 함'
],

pitfalls:[
 '**PPL이 낮다고 그 길이의 정보를 다 "활용"한다는 뜻은 아니다.** YaRN의 수치는 언어모델링 perplexity 기준이며, [Lost in the Middle](#/p/lost-in-the-middle)류 검색 태스크에서의 위치 편향까지 해결한다는 보장은 없다.',
 '**경험식 $\\sqrt{1/t}=0.1\\ln(s)+1$ 은 LLaMA/Llama 2 계열에서 튜닝된 값이다.** 다른 아키텍처·다른 base 주파수 설정에 그대로 이식하면 최적이 아닐 수 있다.',
 '**NTK-by-parts의 $\\alpha,\\beta$ 는 모델·목표 확장 배율마다 재탐색이 필요하다고 논문 스스로 명시한다.** "한 번 정하면 끝"이 아니라 case-by-case 튜닝 대상이다.'
],

figures:[
 {f:'fig1-relationship.png',
  cap:'RoPE에서 두 갈래로 갈라진 기존 방법(Position Interpolation·NTK-aware)이 "차원마다 다르게 스케일한다"는 통찰을 거쳐 NTK-by-parts로 합쳐지고, 마지막에 attention 온도 보정을 더한 것이 YaRN이라는 것을 화살표로 보여준다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'YaRN reaches state-of-the-art performances in context window extensions after fine-tuning on less than ∼0.1% of the original pre-training data.',
  src:'Section 2, p.2'}
],

links:[
 {t:'arXiv 2309.00071 — YaRN', u:'https://arxiv.org/abs/2309.00071'},
 {t:'GitHub — jquesnelle/yarn', u:'https://github.com/jquesnelle/yarn'}
]
});
