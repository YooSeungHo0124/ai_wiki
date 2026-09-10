WIKI.paper({
slug:'mip-nerf',
venue:'ICCV 2021',
authors:'Barron, Mildenhall, Tancik, Srinivasan, Hedman, Zhang (Google)',
arxiv:'2103.13415',

tldr:'[NeRF](#/p/nerf)가 광선 하나를 **점**으로 샘플링해서 생기는 앨리어싱을, 픽셀이 실제로 덮는 **원뿔대(conical frustum)**를 적분해 인코딩하는 방식으로 없앤 논문. 여러 해상도·거리에서 같은 장면을 봐야 하는 실사용 환경에서 NeRF 오차를 크게 줄였다.',

context:'[NeRF](#/p/nerf)는 카메라에서 픽셀 중심을 지나는 **광선 하나**를 쏘고, 그 위의 점들을 이산적으로 샘플링해 위치 인코딩 $\\gamma(\\mathbf{x})$를 MLP에 넣는다. 그런데 실제 픽셀은 점이 아니라 **원뿔 모양의 입체각**을 덮는다 — 카메라에 가까운 물체는 픽셀 하나가 좁은 영역을, 먼 물체는 넓은 영역을 대표한다. NeRF는 이 사실을 무시하고 모든 거리에서 똑같은 주파수의 위치 인코딩을 쓰기 때문에, 같은 장면을 여러 해상도나 여러 카메라 거리에서 렌더링하면 계단 현상(앨리어싱)과 흐림이 동시에 나타난다. 표준 그래픽스 해법인 밉맵(mipmap)처럼 여러 해상도의 사전계산 버전을 저장할 수 없다는 것도 문제다 — NeRF는 연속 함수이지 이산 텍스처가 아니기 때문이다.',

ideas:[
 {h:'광선 대신 원뿔을 추적한다',
  lead:'점이 아니라 픽셀이 덮는 3D 원뿔대를 정의해 그 안을 적분한다.',
  d:'카메라 원점에서 픽셀의 footprint(반지름 $\\dot{r}$)에 맞춰 원뿔을 쏘고, 그 원뿔을 $t_0, t_1$ 구간으로 잘라 만든 **원뿔대(conical frustum)** 하나가 NeRF의 점 샘플 하나를 대체한다. 원뿔대의 크기는 카메라로부터의 거리에 비례해 커지므로, 가까운 물체는 좁고 세밀하게, 먼 물체는 넓고 뭉뚱그려 표현된다.'},
 {h:'통합 위치 인코딩(IPE): 인코딩 자체를 적분한다',
  lead:'원뿔대 내부 위치들의 위치 인코딩 기댓값을 닫힌 형태로 계산해 특징으로 쓴다.',
  d:'원뿔대를 정확히 적분하는 대신, 그 안의 좌표 분포를 다변량 가우시안 $\\mathcal{N}(\\mu,\\Sigma)$로 근사한다. 그러면 위치 인코딩 $\\gamma(\\mathbf{x})$의 기댓값 $E[\\gamma(\\mathbf{x})]$가 sin/cos의 성질 덕분에 **닫힌 형태**로 나온다 — 평균 위치의 sin/cos에 분산에 비례하는 감쇠 항을 곱한 것과 같다. 이렇게 얻은 IPE는 원뿔대가 클수록(먼 거리·거친 스케일일수록) 고주파 성분이 자동으로 줄어드는, 즉 **스스로 앤티앨리어싱되는** 특징이 된다.'},
 {h:'다중 스케일을 위한 파라미터 하나',
  lead:'스케일마다 다른 네트워크 없이 단일 MLP가 IPE로 스케일 정보를 함께 받는다.',
  d:'원 NeRF는 coarse·fine 두 개의 별도 MLP를 계층적으로 학습시켰다. Mip-NeRF는 IPE가 이미 원뿔대의 크기(=스케일) 정보를 인코딩에 담고 있으므로, **단일 MLP** 하나로 coarse·fine 양쪽 역할을 다 수행하게 한다. 그 결과 파라미터 수가 NeRF의 약 절반(612K vs 1,191K)으로 줄고 학습도 약간 더 빨라졌다.'}
],

diagram:{type:'compare', cap:'점 샘플링 기반 위치 인코딩(NeRF)과 원뿔대 적분 기반 IPE(Mip-NeRF) 비교.',
 left:{t:'NeRF: 점 + PE', items:['광선 위 이산 점 샘플링','점마다 고정 주파수 sin/cos','스케일·거리 정보 없음','여러 해상도에서 앨리어싱']},
 right:{t:'Mip-NeRF: 원뿔대 + IPE', items:['픽셀 footprint를 원뿔대로 추적','가우시안 근사 후 기댓값 적분','분산이 클수록 고주파 자동 감쇠','단일 MLP로 다중 스케일 처리']}},

math:[
 {expr:'gamma(x) = [sin(x), cos(x), ..., sin(2^(L-1) x), cos(2^(L-1) x)]',
  tex:'\\gamma(\\mathbf{x}) = \\big[\\sin(\\mathbf{x}), \\cos(\\mathbf{x}), \\ldots, \\sin(2^{L-1}\\mathbf{x}), \\cos(2^{L-1}\\mathbf{x})\\big]^{\\top}',
  d:'[NeRF](#/p/nerf)의 원래 위치 인코딩. $L$개의 주파수 대역으로 좌표를 고차원으로 펼친다. 모든 거리·스케일에서 똑같이 적용된다는 것이 문제의 근원이다.'},
 {expr:'E[gamma(x)] = [ sin(mu) ⊙ exp(-1/2 diag(Sigma)),  cos(mu) ⊙ exp(-1/2 diag(Sigma)) ]',
  tex:'\\operatorname{E}_{\\mathbf{x}\\sim\\mathcal{N}(\\boldsymbol{\\mu}_\\gamma,\\boldsymbol{\\Sigma}_\\gamma)}\\!\\left[\\gamma(\\mathbf{x})\\right] = \\begin{bmatrix}\\sin(\\boldsymbol{\\mu}_\\gamma)\\circ\\exp\\!\\big({-}\\tfrac{1}{2}\\operatorname{diag}(\\boldsymbol{\\Sigma}_\\gamma)\\big)\\\\ \\cos(\\boldsymbol{\\mu}_\\gamma)\\circ\\exp\\!\\big({-}\\tfrac{1}{2}\\operatorname{diag}(\\boldsymbol{\\Sigma}_\\gamma)\\big)\\end{bmatrix}',
  d:'통합 위치 인코딩(IPE)의 핵심 식. 원뿔대 내부 좌표를 평균 $\\mu$, 분산 $\\Sigma$인 가우시안으로 보고 $\\gamma(\\mathbf{x})$의 기댓값을 계산하면, 원래 sin/cos 값에 분산 크기만큼 지수적으로 줄어드는 감쇠 항이 곱해진다. 분산이 클수록(원뿔대가 클수록) 고주파 성분이 저절로 사라진다.'},
 {expr:'diag(Sigma) = sigma_t^2 (d⊙d) + sigma_r^2 (1 - (d⊙d)/||d||^2)',
  tex:'\\operatorname{diag}(\\boldsymbol{\\Sigma}) = \\sigma_t^2(\\mathbf{d}\\circ\\mathbf{d}) + \\sigma_r^2\\!\\left(\\mathbf{1}-\\frac{\\mathbf{d}\\circ\\mathbf{d}}{\\|\\mathbf{d}\\|_2^2}\\right)',
  d:'원뿔대를 다변량 가우시안으로 근사할 때, 광선 방향 $\\mathbf{d}$를 따라가는 분산 $\\sigma_t^2$과 원뿔 단면 방향의 분산 $\\sigma_r^2$을 원뿔대의 기하(광선 원점·방향·기저 반지름·구간 $t_0,t_1$)로부터 닫힌 형태로 유도한다.'}
],

numbers:[
 {k:'단일스케일 Blender PSNR', v:'NeRF 31.74 → Mip-NeRF 33.09', d:'원본 NeRF 논문의 단일 해상도 Blender 데이터셋(Table 2), 오차 **17%** 감소'},
 {k:'다중스케일 Blender 오차', v:'평균 오차 **60%** 감소', d:'저자들이 만든 4단계 다운샘플(1×,1/2,1/4,1/8) 데이터셋에서 NeRF 대비(Table 1)'},
 {k:'학습 속도', v:'NeRF 대비 약 **7% 빠름**', d:'단일 MLP·파라미터 절반(612K vs 1,191K)의 효과, 학습시간 2.89±0.01시간(Mip-NeRF) vs 3.05±0.01시간(NeRF)'},
 {k:'슈퍼샘플링 대비', v:'동등 정확도, **22배 빠름**', d:'무차별 슈퍼샘플링으로 앤티앨리어싱한 NeRF(SS NeRF)와 비교(Table 3)'},
 {k:'IPE 제거 ablation', v:'단일 33.09→32.48, 다중 32.63→29.88', d:'IPE를 보통 PE로 되돌린 `w/o IPE` 행. 단일스케일(Table 2)에서는 0.6 손실에 그치지만 다중스케일 최고해상도(Table 1 첫 열)에서는 2.75가 무너진다 — 앤티앨리어싱 이득이 IPE에서 온다는 증거'}
],

impact:'NeRF가 "한 해상도·한 거리"에서만 잘 작동한다는 실사용 최대 약점을 인코딩 레벨에서 해결했다. 원뿔대를 가우시안으로 근사하고 위치 인코딩의 기댓값을 닫힌 형태로 구한다는 아이디어는 이후 나온 여러 NeRF 개선 연구가 그대로 물려받는 표준 전처리가 됐다. 특히 [Instant-NGP](#/p/instant-ngp)를 비롯한 후속 연구들이 이 IPE 아이디어를 자신들의 인코딩과 결합하며(예: Zip-NeRF 등) 속도와 앤티앨리어싱을 동시에 잡는 흐름으로 이어졌다.',

legacy:[
 '**[Instant-NGP](#/p/instant-ngp)와의 결합** — 다중해상도 해시 인코딩에 원뿔대·IPE 개념을 접목한 Zip-NeRF 등 후속 연구로 이어짐',
 '**Mip-NeRF 360** — 무한/실외 장면으로 확장하며 좌표 공간을 압축하는 후속 논문의 직접적 기반',
 '**앤티앨리어싱을 인코딩으로 처리한다는 발상의 확산** — 렌더링 시점의 후처리가 아니라 특징 표현 자체에 스케일을 내장하는 설계가 이후 3D 표현 연구 전반에 참조됨',
 '**단일 MLP·다중스케일 학습**이라는 단순화가 이후 경량 NeRF 변종들의 기본 가정이 됨'
],

pitfalls:[
 '**IPE는 원뿔대를 정확히 적분한 게 아니라 가우시안 근사다.** 실제 원뿔대 분포와 가우시안이 다르지만, 저자들은 이 근사가 실용적으로 충분하다는 것을 실험으로만 보였다 — 엄밀한 적분이 아니다.',
 '**"NeRF보다 항상 좋다"는 다중스케일 데이터셋에서 특히 두드러진 결과다.** 단일 스케일(원래 Blender) 데이터셋에서는 개선폭이 17%로 상대적으로 작고, 다중스케일(60% 감소)에서 효과가 극적으로 커진다 — 두 수치를 섞어 인용하면 안 된다.',
 '**여전히 광선당 여러 번 MLP를 호출하는 볼륨 렌더링 구조는 그대로다.** IPE는 인코딩 품질 문제를 풀 뿐, [NeRF](#/p/nerf)가 가진 느린 렌더링·학습 속도 문제 자체는 해결하지 않는다 — 그 문제는 [Instant-NGP](#/p/instant-ngp) 등 별도 계열이 다룬다.'
],

figures:[
 {f:'fig-cone-vs-ray.png',
  cap:'NeRF(위)는 광선을 따라 점을 이산 샘플링하고 각 점에 같은 주파수의 PE를 적용한다. Mip-NeRF(아래)는 픽셀의 원뿔대를 여러 구간으로 나눠 각 구간을 가우시안으로 근사하고 그 구간의 크기에 맞춰 감쇠된 IPE를 적용한다 — 원뿔대가 커질수록(카메라에서 멀수록) 흐려지는 표현이 되는 것이 핵심.',
  src:'원문 Figure 3, p.4'},
 {f:'fig-results-pyramid.png',
  cap:'같은 장면을 4단계 해상도로 잘라 이미지 피라미드로 보여준다. 각 축소판 오른쪽 아래 숫자가 SSIM. NeRF(가운데)는 스케일이 바뀔수록 흐려지거나 계단현상이 나는데, Mip-NeRF(오른쪽)는 모든 스케일에서 SSIM이 가장 높게(빨간 글씨) 유지된다.',
  src:'원문 Figure 5, p.7'}
],

quotes:[
 {t:'Mip-NeRF casts cones, encodes the positions and sizes of conical frustums, and trains a single neural network that models the scene at multiple scales.',
  src:'Section 5 (Conclusion), p.8'}
],

links:[
 {t:'arXiv 2103.13415 — Mip-NeRF', u:'https://arxiv.org/abs/2103.13415'},
 {t:'공식 프로젝트 페이지', u:'https://jonbarron.info/mipnerf/'},
 {t:'공식 구현 (jaxnerf 기반)', u:'https://github.com/google/mipnerf'}
]
});
