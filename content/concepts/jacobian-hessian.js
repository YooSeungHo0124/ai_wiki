WIKI.concept({
slug:'jacobian-hessian',

tldr:'야코비안은 벡터를 벡터로 보내는 함수의 1차 미분을 모은 행렬이고, 헤세 행렬은 스칼라 함수의 2차 미분(곡률)을 모은 행렬이다.',

why:'역전파 프레임워크(autograd)가 각 연산마다 실제로 계산·전파하는 것이 야코비안이다. 헤세 행렬은 2차 최적화([Sophia](#/p/sophia) 같은 optimizer)와 왜 손실 곡면에 [안장점](#/c/convexity)이 문제가 되는지를 설명하는 도구다. 둘 다 직접 계산할 일은 드물지만, "1차 미분의 다음 단계가 무엇인가"를 모르면 2차 optimizer 논문이나 곡률 관련 논의를 못 따라간다.',

sections:[
 {h:'야코비안: 1차 미분', d:'함수 $f:\\mathbb{R}^n\\to\\mathbb{R}^m$(입력 $n$ 차원, 출력 $m$ 차원)일 때, 야코비안 $J\\in\\mathbb{R}^{m\\times n}$ 은 $J_{ij}=\\partial f_i/\\partial x_j$ — "출력의 $i$ 번째 성분이 입력의 $j$ 번째 성분에 얼마나 민감한가"를 모든 조합에 대해 모은 행렬이다. 신경망의 한 층 $y=f(x)$ 자체가 벡터를 벡터로 보내는 함수이므로, 역전파는 사실 각 층의 야코비안을 [연쇄 법칙](#/c/derivative)으로 곱해나가는 과정이다(단, autograd 는 야코비안 전체를 만들지 않고 벡터-야코비안 곱만 계산해서 메모리를 아낀다).'},
 {h:'헤세 행렬: 2차 미분', d:'손실 $L:\\mathbb{R}^n\\to\\mathbb{R}$(여러 가중치를 입력받아 스칼라 하나를 출력)일 때, 헤세 행렬 $H\\in\\mathbb{R}^{n\\times n}$ 은 $H_{ij}=\\partial^2 L/\\partial w_i\\partial w_j$ — 손실 곡면이 각 방향으로 얼마나 휘어 있는지(곡률)를 담는다. gradient 가 "어느 방향으로 내려가야 하는가"를 알려준다면, 헤세 행렬은 "그 방향으로 얼마나 빨리 다시 평평해지는가"를 알려준다.'},
 {h:'고윳값으로 극점 구분', d:'gradient 가 0인 지점(임계점)에서 헤세 행렬의 [고윳값](#/c/eigen-svd)이 전부 양수면 지역 최솟값, 전부 음수면 지역 최댓값, 양수와 음수가 섞여 있으면 안장점(saddle point)이다. 고차원 신경망 손실 곡면에서는 모든 방향이 동시에 위로 휘는 지역 최솟값보다, 일부는 위로 일부는 아래로 휘는 안장점이 압도적으로 더 많다 — [convexity](#/c/convexity) 문서에서 이어서 다룬다.'},
 {h:'2차 optimizer', d:'Newton 법은 gradient 를 헤세 행렬의 역행렬로 보정해 한 번에 곡률까지 고려한 걸음을 걷는다 — 평평한 방향으로는 크게, 가파른 방향으로는 작게 움직인다. 문제는 파라미터가 수십억 개인 신경망에서 $n\\times n$ 헤세 행렬을 저장·역행렬 계산하는 건 불가능하다는 것이다. [Sophia](#/p/sophia) 같은 optimizer 는 헤세 행렬의 대각 성분만 근사해서 이 비용을 감당 가능한 수준으로 줄인다.'}
],

math:[
 {tex:'J_{ij}=\\frac{\\partial f_i}{\\partial x_j},\\quad J\\in\\mathbb{R}^{m\\times n}',
  expr:'야코비안 행렬', d:'$f:\\mathbb{R}^n\\to\\mathbb{R}^m$ 의 야코비안. 출력이 스칼라($m=1$)면 야코비안은 gradient(행벡터)로 줄어든다 — gradient 는 야코비안의 특수한 경우다.'},
 {tex:'H_{ij}=\\frac{\\partial^2 L}{\\partial w_i \\partial w_j},\\quad H\\in\\mathbb{R}^{n\\times n}',
  expr:'헤세 행렬', d:'스칼라 손실 $L$ 의 2차 편미분을 모은 대칭 행렬. 대각 성분 $H_{ii}=\\partial^2L/\\partial w_i^2$ 는 $w_i$ 방향으로만 본 곡률, 비대각 성분은 두 가중치가 곡률에 서로 얽혀 있는 정도다.'}
],

diagram:{type:'compare', cap:'1차 미분과 2차 미분이 무엇을 묻는가.',
 left:{t:'야코비안(1차)', items:['벡터→벡터 함수','출력 민감도 표','역전파가 매 층 전파']},
 right:{t:'헤세 행렬(2차)', items:['스칼라 손실의 곡률','고윳값으로 안장점 판별','2차 optimizer 의 재료']}},

confuse:[
 {a:'gradient', b:'야코비안', d:'gradient 는 출력이 스칼라 하나일 때만 정의되는 벡터다. 야코비안은 출력이 벡터(여러 개)일 때의 일반화된 행렬이다 — 손실 함수는 gradient 로, 신경망의 각 층(입출력이 둘 다 벡터)은 야코비안으로 다룬다.'},
 {a:'1차 정보(gradient)', b:'2차 정보(헤세 행렬)', d:'1차 정보는 "어느 방향으로"만 알려주고, 2차 정보는 "그 방향이 얼마나 가파른지·얼마나 빨리 평평해지는지"까지 알려준다. Adam 같은 1차 optimizer 가 대부분인 이유는 헤세 행렬 계산·저장이 너무 비싸기 때문이지, 2차 정보가 덜 유용해서가 아니다.'}
],

pitfalls:[
 '"딥러닝은 1차 미분만 쓴다"는 말을 "2차 미분이 필요 없다"로 오해하기 쉽지만, 실제로는 계산 비용 때문에 못 쓰는 것에 가깝다 — momentum 이나 Adam 의 적응적 학습률도 넓게 보면 곡률 정보를 근사하려는 시도다.',
 '안장점을 "지역 최솟값에 갇혔다"고 뭉뚱그려 말하는 경우가 많은데, 고차원에서는 진짜 지역 최솟값보다 안장점이 훨씬 흔하다 — 학습이 정체되는 원인을 진단할 때 이 구분이 중요하다.',
 '헤세 행렬이 대칭이라서 "고윳값이 항상 실수"라는 사실을 당연하게 여기지 않으면 판별 논리 자체를 헷갈리게 된다 — 대칭행렬만이 고윳값이 전부 실수임이 보장되고, 그래서 부호로 극점 종류를 나눌 수 있는 것이다.'
],

code:{lang:'python', d:'autograd 로 스칼라 함수의 헤세 행렬을 직접 계산.',
 src:'import torch\nfrom torch.autograd.functional import hessian\ndef L(w):\n    return (w[0]**2 * w[1] + w[1]**3).sum()\nw = torch.tensor([1.0, 2.0])\nH = hessian(L, w)\nprint(H)  # 2x2 대칭 행렬, 고윳값 부호로 극점 종류 판별'},

papers:['sophia','adam'],
terms:['derivative','eigen-svd','convexity']
});
