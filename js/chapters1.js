/* =============================================================================
 * chapters1.js — 1~10장: 입력 → 임베딩 → Q/K/V → attention score → 가중합
 * ===========================================================================*/
(function (global) {
  "use strict";
  const V = global.Viz;
  const CH = (global.CHAPTERS = global.CHAPTERS || []);

  /* ------------------------------------------------------------- 공통 헬퍼 */
  function stage(host, w, h) {
    host.innerHTML = "";
    const s = V.svg(w, h, host);
    s.dataset.w = w;
    return s;
  }
  global.VizStage = stage;

  const dimLabels = (n, p) => Array.from({ length: n }, (_, i) => (p || "d") + i);

  /* ============================== 1. 전체 조감도 ============================ */
  CH.push({
    id: "overview",
    group: "들어가며",
    title: "전체 흐름 한눈에 보기",
    body: `
      <p>LLM이 하는 일은 딱 하나입니다. <b>지금까지의 토큰들을 보고, 바로 다음에 올 토큰 하나의 확률분포를 계산하는 것</b>. 그게 전부입니다.
      긴 문장을 쓰는 것처럼 보이는 건 이 한 걸음을 계속 반복하기 때문입니다.</p>
      <p>이 사이트에서는 실제로 학습시킨 아주 작은 GPT(<span class="tw">TinyGPT</span>, 파라미터 15,168개)를 씁니다.
      화면에 보이는 <b>모든 숫자는 실제 연산 결과</b>이고, 가짜로 만들어 넣은 값이 하나도 없습니다.</p>
      <p>예시 문장은 이것입니다:</p>
      <p class="example">고양이가 · 부엌에서 · 생선을 · 맛있게 → <b>?</b></p>
      <p>모델은 마지막 자리에 올 단어를 맞춰야 합니다. 이 문제를 풀려면 모델은 반드시
      <b>“생선을”</b> 이라는 목적어를 다시 쳐다봐야 합니다. 그 “쳐다보는” 동작이 바로
      <span class="tw">attention</span> 입니다.</p>
      <p class="tip">오른쪽 그림의 상자를 클릭하면 해당 챕터로 바로 이동합니다.</p>`,
    render(host, ctx) {
      const W = 940, H = 720;
      const s = stage(host, W, H);
      const t = ctx.trace;

      // 입력 토큰
      const gTop = V.group(s, 0, 16);
      const chipW = 96, gapC = 12;
      const totalW = t.tokens.length * (chipW + gapC) - gapC;
      let x0 = (W - totalW) / 2;
      t.tokens.forEach((tok, i) => {
        V.chip(gTop, tok, x0 + i * (chipW + gapC), 0, { w: chipW, sub: "id " + t.ids[i] });
      });

      const boxes = [
        ["Tokenization", "문장 → 토큰 → ID", "tokenize", "(4)"],
        ["Embedding (+ Position)", "ID → 벡터", "embedding", "(4 × 24)"],
        ["Transformer Block × 2", "LayerNorm → Self-Attention → MLP", "qkv", "(4 × 24)"],
        ["Final LayerNorm", "마지막 정규화", "logits", "(4 × 24)"],
        ["Unembedding → logits", "벡터 → 어휘 23개의 점수", "logits", "(23)"],
        ["Softmax (+ temperature)", "점수 → 확률", "temperature", "(23)"],
        ["Sampling", "확률 → 토큰 하나 선택", "sampling", "(1)"],
      ];
      const bw = 380, bh = 52, gap = 24;
      const startY = 108;
      const bx = (W - bw) / 2;
      const nodes = [];
      boxes.forEach((b, i) => {
        const y = startY + i * (bh + gap);
        const g = V.group(s, bx, y, "flowbox");
        g.style.cursor = "pointer";
        g.addEventListener("click", () => ctx.goto(b[2]));
        V.el("rect", { x: 0, y: 0, width: bw, height: bh, rx: 10, class: "flow-box" }, g);
        V.el("text", { x: 16, y: 22, class: "flow-title", text: b[0] }, g);
        V.el("text", { x: 16, y: 40, class: "flow-sub", text: b[1] }, g);
        V.el("text", { x: bx + bw + 14, y: y + bh / 2 + 5, class: "shape-tag", text: b[3] }, s);
        nodes.push(g);
        if (i < boxes.length - 1) {
          V.arrow(s, W / 2, y + bh + 3, W / 2, y + bh + gap - 4, { width: 2 });
        }
      });
      V.arrow(s, W / 2, 68, W / 2, startY - 6, { width: 2 });

      // 결과
      const yEnd = startY + boxes.length * (bh + gap) + 6;
      const best = t.last.probs.indexOf(Math.max.apply(null, t.last.probs));
      const g = V.group(s, W / 2 - 70, yEnd);
      V.el("rect", { x: 0, y: 0, width: 140, height: 44, rx: 10, class: "flow-box result" }, g);
      V.el("text", { x: 70, y: 28, "text-anchor": "middle", class: "result-text",
        text: global.Model.VOCAB[best] }, g);
      V.el("text", { x: W / 2, y: yEnd + 62, "text-anchor": "middle", class: "vlabel small",
        text: `확률 ${(t.last.probs[best] * 100).toFixed(2)}%` }, s);

      V.stagger(nodes, 90, 100);
    },
  });

  /* ============================== 2. Tokenization ========================== */
  CH.push({
    id: "tokenize",
    group: "입력 만들기",
    title: "Tokenization — 문장을 숫자로",
    body: `
      <p>모델은 글자를 모릅니다. 숫자만 압니다. 그래서 첫 단계는 문장을 <span class="tw">token</span>이라는
      조각으로 자르고, 각 조각에 어휘 사전에서의 번호(<span class="tw">token ID</span>)를 붙이는 것입니다.</p>
      <p>여기 TinyGPT의 <span class="tw">vocabulary</span>는 23개뿐입니다. 어절 하나가 토큰 하나입니다.
      실제 GPT-4 계열은 <span class="tw">BPE</span>(Byte-Pair Encoding) 방식으로
      약 10만 개의 토큰을 쓰고, 한글은 보통 한 글자가 1~3개의 토큰으로 쪼개집니다.</p>
      <p>중요한 점: <b>토큰 ID는 그냥 이름표일 뿐, 아무 의미도 없습니다.</b>
      1번과 2번이 비슷한 뜻이라는 보장은 전혀 없습니다. 의미는 다음 단계인
      <span class="tw">embedding</span>에서 생깁니다.</p>`,
    render(host, ctx) {
      const W = 940, H = 560;
      const s = stage(host, W, H);
      const t = ctx.trace;
      const M = global.Model;

      V.el("text", { x: W / 2, y: 44, "text-anchor": "middle", class: "big-sentence",
        text: t.tokens.join(" ") }, s);
      V.el("text", { x: W / 2, y: 68, "text-anchor": "middle", class: "vlabel small",
        text: "입력 문장" }, s);

      const chipW = 110, gapC = 22;
      const total = t.tokens.length * (chipW + gapC) - gapC;
      const x0 = (W - total) / 2;
      const chips = [];
      t.tokens.forEach((tok, i) => {
        const cx = x0 + i * (chipW + gapC);
        V.arrow(s, W / 2, 82, cx + chipW / 2, 122, { width: 1.4, opacity: 0.6 });
        chips.push(V.chip(s, tok, cx, 126, { w: chipW, h: 38 }));
        V.el("text", { x: cx + chipW / 2, y: 200, "text-anchor": "middle", class: "id-badge",
          text: t.ids[i] }, s);
        V.el("text", { x: cx + chipW / 2, y: 220, "text-anchor": "middle", class: "vlabel small",
          text: "token ID" }, s);
        V.el("text", { x: cx + chipW / 2, y: 108, "text-anchor": "middle", class: "vlabel small",
          text: "위치 " + i }, s);
      });
      V.stagger(chips, 120, 0);

      // 어휘 사전 전체
      V.el("text", { x: 40, y: 274, class: "mx-title", text: "TinyGPT의 vocabulary (23개)" }, s);
      const cols = 5, cw = 132, chh = 34;
      const gv = V.group(s, 40, 290);
      M.VOCAB.forEach((w, i) => {
        const c = i % cols, r = (i - c) / cols;
        const used = t.ids.indexOf(i) >= 0;
        const g = V.group(gv, c * cw, r * chh);
        V.el("rect", { x: 0, y: 0, width: cw - 8, height: chh - 8, rx: 5,
          class: "vocab-box" + (used ? " used" : "") }, g);
        V.el("text", { x: 8, y: 18, class: "vocab-id", text: i }, g);
        V.el("text", { x: 32, y: 18, class: "vocab-word", text: w }, g);
      });
      V.card(s, 40 + cols * cw + 20, 290, 210, [
        "실제 GPT는?",
        "· vocab ≈ 100,000",
        "· BPE로 부분 단어까지 분해",
        "· \"고양이\" → 2~3 토큰",
        "· 여기서는 어절 = 토큰",
      ], {});
    },
  });

  /* ============================== 3. Embedding ============================= */
  CH.push({
    id: "embedding",
    group: "입력 만들기",
    title: "Embedding — 번호를 의미 있는 벡터로",
    body: `
      <p><span class="tw">token embedding table</span>은 (어휘 수 × 차원) 크기의 커다란 조회표입니다.
      여기서는 <b>23 × 24</b>. 토큰 ID가 <code>8</code>이면 그냥 <b>8번째 행</b>을 꺼내옵니다.
      학습을 거치면서 비슷한 뜻의 토큰들은 비슷한 행을 갖게 됩니다.</p>
      <p>그런데 이 표에는 <b>순서 정보가 없습니다.</b> "고양이가 생선을"과 "생선을 고양이가"가
      똑같아져 버립니다. 그래서 위치마다 다른 <span class="tw">positional embedding</span>을 더해 줍니다.</p>
      <p class="formula">x = tok_emb[ id ] + pos_emb[ 위치 ]</p>
      <p>이렇게 만들어진 <b>4 × 24</b> 행렬이 앞으로 모든 층을 통과할 <b>residual stream</b>의 출발점입니다.
      가로 한 줄이 토큰 하나, 세로 24칸이 그 토큰의 “의미 벡터”입니다.</p>
      <p class="tip">칸 색은 값의 부호와 크기입니다. <span class="sw hot"></span> 양수,
      <span class="sw cool"></span> 음수.</p>`,
    render(host, ctx) {
      const W = 940, H = 620;
      const s = stage(host, W, H);
      const t = ctx.trace, M = global.Model;

      // 왼쪽: 전체 임베딩 테이블
      const TC = 10, TS = 12, TLW = 66;
      const tbl = V.matrix(s, M.W.tok_emb, {
        x: 30, y: 46, cell: TC, gap: TS - TC, rowLabels: M.VOCAB, labelW: TLW,
        title: "token embedding table (23 × 24)", cls: "dense",
      });
      t.ids.forEach((id) => {
        tbl.markRow(id, "picked");
        V.el("rect", {
          x: 30 + TLW - 3, y: 46 + id * TS - 2, width: 24 * TS + 4, height: TC + 4,
          class: "pick-outline", rx: 3,
        }, s);
      });

      const RX = 480, cell = 12, step = 13, LW = 76;
      const mw = 24 * step;

      const mTok = V.matrix(s, t.tokEmb, {
        x: RX, y: 60, cell, gap: 1, rowLabels: t.tokens, labelW: LW,
        title: "① 뽑아온 token embedding (4 × 24)",
      });
      const mPos = V.matrix(s, t.posEmb, {
        x: RX, y: 210, cell, gap: 1, rowLabels: t.tokens.map((_, i) => "위치 " + i), labelW: LW,
        title: "② positional embedding (4 × 24)",
      });
      const mSum = V.matrix(s, t.xEmbed, {
        x: RX, y: 380, cell, gap: 1, rowLabels: t.tokens, labelW: LW,
        title: "③ x = ① + ②  → residual stream 시작 (4 × 24)",
      });

      V.el("text", { x: RX + LW + mw / 2, y: 190, "text-anchor": "middle", class: "op-sign", text: "+" }, s);
      V.el("text", { x: RX + LW + mw / 2, y: 356, "text-anchor": "middle", class: "op-sign", text: "=" }, s);

      // 조회 화살표: 사전의 해당 행 → 뽑아온 행
      t.ids.forEach((id, i) => {
        const from = tbl.center(id, 23);
        const to = mTok.center(i, 0);
        V.arrow(s, from.x + TC / 2 + 6, from.y, to.x - cell / 2 - 8, to.y,
          { curve: 80, width: 1.4, marker: "arrowhead-hot", stroke: "var(--hot)", opacity: 0.8 });
      });

      V.stagger([mTok.node, mPos.node, mSum.node], 160, 80);
    },
  });

  /* ============================== 4. LayerNorm ============================= */
  CH.push({
    id: "layernorm",
    group: "Transformer Block",
    title: "LayerNorm — 계산 전에 눈금 맞추기",
    body: `
      <p>Transformer block에 들어가기 직전, 각 토큰 벡터를 따로따로 정규화합니다.
      (토큰끼리 섞지 않습니다. 벡터 <b>한 줄 안에서만</b> 평균과 분산을 구합니다.)</p>
      <p class="formula">x̂ = (x − 평균) / √(분산 + ε)&nbsp;&nbsp;→&nbsp;&nbsp;out = γ · x̂ + β</p>
      <p>왜 필요할까요? 층을 지날수록 값의 크기가 제멋대로 커지거나 작아지면 학습이 망가집니다.
      LayerNorm은 매 층 입구에서 <b>“평균 0, 표준편차 1”</b>로 눈금을 다시 맞춰 줍니다.
      그 다음 학습 가능한 <span class="tw">γ(gain)</span>과 <span class="tw">β(bias)</span>로
      필요한 만큼 다시 늘리고 옮깁니다.</p>
      <p>GPT-2 이후로는 이렇게 <b>블록 입구</b>에서 정규화하는 <span class="tw">pre-LN</span> 방식을 씁니다.
      덕분에 residual stream은 손대지 않고 그대로 흐를 수 있습니다.</p>
      <p class="tip">아래 컨트롤에서 토큰을 바꿔가며 확인해 보세요.</p>`,
    controls: ["query"],
    render(host, ctx) {
      const W = 940, H = 560;
      const s = stage(host, W, H);
      const t = ctx.trace;
      const L = t.layers[ctx.layer];
      const i = ctx.query;
      const raw = L.xIn[i], st = L.ln1Stats[i], out = L.ln1[i];
      const norm = raw.map((v) => (v - st.mean) / st.std);
      const M = global.Model;
      const g = M.W["b" + ctx.layer + ".ln1_g"], b = M.W["b" + ctx.layer + ".ln1_b"];

      V.el("text", { x: 40, y: 34, class: "stage-caption",
        text: `토큰 "${t.tokens[i]}" 의 24차원 벡터 (layer ${ctx.layer})` }, s);

      const bw = 820, bh = 96;
      const items = [
        ["① 입력 x", raw, `평균 = ${V.fmt(st.mean, 3)},  표준편차 = ${V.fmt(st.std, 3)}`],
        ["② 정규화 x̂ = (x − 평균) / √(분산+ε)", norm, "평균 = 0.000,  표준편차 = 1.000"],
        ["③ 출력 = γ · x̂ + β", out, "학습된 γ, β 로 다시 스케일 · 이동"],
      ];
      const nodes = [];
      items.forEach((it, k) => {
        const y = 76 + k * 150;
        const r = V.vbars(s, it[1], { x: 60, y, w: bw, h: bh, title: it[0], footer: it[2] });
        nodes.push(r.node);
        if (k < 2) V.arrow(s, 60 + bw / 2, y + bh + 26, 60 + bw / 2, y + bh + 48, { width: 2 });
      });
      // 눈금
      [0, 1, 2].forEach((k) => {
        const y = 76 + k * 150;
        V.el("text", { x: 48, y: y + 6, "text-anchor": "end", class: "vlabel tiny", text: "+" }, s);
        V.el("text", { x: 48, y: y + bh, "text-anchor": "end", class: "vlabel tiny", text: "−" }, s);
      });
      V.el("text", { x: 60 + bw / 2, y: H - 10, "text-anchor": "middle", class: "vlabel small",
        text: "가로축 = 24개의 차원(d0 … d23) · 막대에 마우스를 올리면 값이 보입니다" }, s);
      V.stagger(nodes, 260);
    },
  });

  /* ============================== 5. Q, K, V =============================== */
  CH.push({
    id: "qkv",
    group: "Self-Attention",
    title: "Query · Key · Value 만들기",
    body: `
      <p>Self-attention의 핵심 비유는 <b>도서관 검색</b>입니다. 토큰 하나하나가 세 가지 역할을 동시에 맡습니다.</p>
      <ul>
        <li><b><span class="tw">Query</span> (질문)</b> — “나는 지금 어떤 정보가 필요한가?”<br>
            <span class="q">맛있게</span>: “내 앞의 목적어가 뭐였지?”</li>
        <li><b><span class="tw">Key</span> (색인)</b> — “나는 어떤 정보를 가진 토큰인가?”<br>
            <span class="q">생선을</span>: “나는 목적어야.”</li>
        <li><b><span class="tw">Value</span> (내용)</b> — “나를 선택하면 실제로 건네줄 내용”<br>
            <span class="q">생선을</span>: “먹는 것과 관련된 명사.”</li>
      </ul>
      <p>세 가지 모두 <b>같은 입력 벡터에 서로 다른 가중치 행렬을 곱해서</b> 만듭니다.
      GPT는 효율을 위해 세 행렬을 하나로 합친 <code>W_qkv</code> (24 × 72) 한 번의 행렬곱으로 처리합니다.</p>
      <p class="formula">[Q | K | V] = LayerNorm(x) @ W_qkv + b_qkv</p>
      <p class="tip">결과 행렬의 칸에 마우스를 올려 보세요. 그 값이 <b>왼쪽 행 × 위쪽 열의 내적</b>으로
      만들어진다는 걸 보여줍니다.</p>`,
    render(host, ctx) {
      const W = 940, H = 560;
      const s = stage(host, W, H);
      const t = ctx.trace, M = global.Model;
      const L = t.layers[ctx.layer];
      const cell = 8, step = 9;
      const A = L.ln1, B = M.W["b" + ctx.layer + ".w_qkv"], C = L.qkv;

      const CX = 266, CY = 340, BY = 84;
      const mB = V.matrix(s, B, { x: CX, y: BY, cell, gap: 1,
        title: "W_qkv  (24 × 72)  — 학습된 가중치" });
      const mA = V.matrix(s, A, { x: 20, y: CY, cell, gap: 1,
        title: "LayerNorm(x)  (4 × 24)" });
      const mC = V.matrix(s, C, { x: CX, y: CY, cell, gap: 1,
        title: "결과 [Q | K | V]  (4 × 72)" });

      V.el("text", { x: 246, y: CY + 26, class: "op-sign small", text: "@" }, s);
      t.tokens.forEach((tok, i) => {
        V.el("text", { x: 14, y: CY + i * step + 7, "text-anchor": "end",
          class: "vlabel tiny", text: String(i + 1) }, s);
      });
      V.el("text", { x: 20, y: CY + 4 * step + 20, class: "vlabel tiny",
        text: `행 1~4 = ${t.tokens.join(" / ")}` }, s);

      // W_qkv 의 열 구간 = 결과의 열 구간 (Q | K | V)
      const seg = [["Q", 0, "var(--q)"], ["K", 24, "var(--k)"], ["V", 48, "var(--v)"]];
      seg.forEach(([nm, off, col]) => {
        const x1 = CX + off * step, x2 = CX + (off + 24) * step - 1;
        V.el("rect", { x: x1 - 2, y: BY - 3, width: x2 - x1 + 4, height: 24 * step + 4, rx: 4,
          fill: "none", stroke: col, "stroke-width": 1.6, opacity: 0.7 }, s);
        V.el("rect", { x: x1 - 3, y: CY - 4, width: x2 - x1 + 6, height: 4 * step + 6, rx: 4,
          fill: "none", stroke: col, "stroke-width": 2, opacity: 0.95 }, s);
        V.el("text", { x: (x1 + x2) / 2, y: CY + 4 * step + 24, "text-anchor": "middle",
          class: "seg-label", fill: col, text: nm + "  (4 × 24)" }, s);
        V.arrow(s, (x1 + x2) / 2, BY + 24 * step + 6, (x1 + x2) / 2, CY - 12,
          { width: 1.4, opacity: 0.45, stroke: col, dash: "4 4" });
      });

      // 호버 인터랙션
      const info = V.card(s, 20, 424, 900, ["칸에 마우스를 올려 보세요", ""], {});
      const infoTexts = info.querySelectorAll("text");
      mC.cells.forEach((row, i) => row.forEach((r, j) => {
        r.addEventListener("mouseenter", () => {
          mA.highlightRow(i, true); mB.highlightCol(j, true);
          mA.cells[i].forEach((c) => c.classList.add("mark"));
          mB.cells.forEach((rr) => rr[j].classList.add("mark"));
          let dot = 0;
          for (let z = 0; z < 24; z++) dot += A[i][z] * B[z][j];
          const which = j < 24 ? "Q" : j < 48 ? "K" : "V";
          infoTexts[0].textContent =
            `${which}[${t.tokens[i]}][${j % 24}]  =  ${V.fmt(C[i][j], 4)}`;
          infoTexts[1].textContent =
            `= (LayerNorm(x) 의 "${t.tokens[i]}" 행 24개) · (W_qkv 의 ${j}번 열 24개) + bias`
            + `  =  ${V.fmt(dot, 4)} + ${V.fmt(M.W["b" + ctx.layer + ".b_qkv"][j], 4)}`;
        });
        r.addEventListener("mouseleave", () => {
          mA.highlightRow(0, false); mB.highlightCol(0, false);
          s.querySelectorAll(".mark").forEach((c) => c.classList.remove("mark"));
        });
      }));

      V.el("text", { x: 20, y: 44, class: "stage-caption",
        text: `layer ${ctx.layer} · 한 번의 행렬곱으로 Q, K, V 를 동시에 만든다` }, s);
    },
  });

  /* ============================== 6. Multi-head ============================ */
  CH.push({
    id: "heads",
    group: "Self-Attention",
    title: "Multi-Head — 24차원을 3개의 눈으로 쪼개기",
    body: `
      <p>Q, K, V는 각각 24차원입니다. 이걸 통째로 쓰지 않고 <b>8차원씩 3조각</b>으로 잘라
      서로 독립적인 <span class="tw">head</span> 3개를 만듭니다.</p>
      <p class="formula">n_head = 3,&nbsp; d_head = 8,&nbsp; d_model = 3 × 8 = 24</p>
      <p>왜 쪼갤까요? head마다 <b>서로 다른 관계</b>를 찾게 하기 위해서입니다.
      한 head는 “바로 앞 단어”를, 다른 head는 “문장의 목적어”를, 또 다른 head는 “주어”를 보는 식입니다.
      쪼개지 않으면 모든 관계가 한 덩어리로 뭉뚱그려집니다.</p>
      <p>실제로 이 모델에서 <b>layer 0 · head 2</b>가 “동사를 예측하려면 목적어를 보라”는
      규칙을 학습했습니다. 뒤에서 직접 확인합니다.</p>
      <p class="note">참고: GPT-3는 d_model = 12288을 96개 head로 쪼갭니다 (head당 128차원).</p>`,
    render(host, ctx) {
      const W = 940, H = 600;
      const s = stage(host, W, H);
      const t = ctx.trace;
      const L = t.layers[ctx.layer];
      const COL = ["var(--h0)", "var(--h1)", "var(--h2)"];
      const cell = 12, step = 13;

      const names = [["Q", L.Q], ["K", L.K], ["V", L.V]];
      names.forEach(([nm, mat], r) => {
        const y = 60 + r * 175;
        const m = V.matrix(s, mat, {
          x: 40, y, cell, gap: 1, rowLabels: t.tokens, labelW: 74,
          title: `${nm}  (4 × 24)`,
        });
        for (let h = 0; h < 3; h++) {
          const x1 = 40 + 74 + h * 8 * step;
          V.el("rect", { x: x1 - 1, y: y - 3, width: 8 * step, height: 4 * step + 6, rx: 4,
            fill: "none", stroke: COL[h], "stroke-width": 2 }, s);
          V.el("text", { x: x1 + 4 * step, y: y + 4 * step + 18, "text-anchor": "middle",
            class: "seg-label", fill: COL[h], text: "head " + h }, s);

          // 오른쪽으로 분리된 head
          const sub = mat.map((row) => row.slice(h * 8, h * 8 + 8));
          const sx = 580 + h * 118;
          V.matrix(s, sub, { x: sx, y, cell, gap: 1,
            title: r === 0 ? `head ${h}  (4 × 8)` : null });
          V.el("rect", { x: sx - 3, y: y - 3, width: 8 * step + 4, height: 4 * step + 6, rx: 4,
            fill: "none", stroke: COL[h], "stroke-width": 2 }, s);
        }
        V.el("text", { x: 520, y: y + 2 * step + 6, "text-anchor": "middle",
          class: "op-sign small", text: "→" }, s);
        V.el("text", { x: 580, y: y + 4 * step + 18, class: "vlabel tiny",
          text: `${nm} 를 8차원씩 3조각으로 나눈 결과` }, s);
      });
      V.el("text", { x: 40, y: 32, class: "stage-caption",
        text: `layer ${ctx.layer} · head 끼리는 서로 정보를 주고받지 않고 완전히 따로 계산된다` }, s);
    },
  });

  /* ============================== 7. Score ================================= */
  CH.push({
    id: "scores",
    group: "Self-Attention",
    title: "Attention Score — 얼마나 관련 있나?",
    body: `
      <p>이제 “누가 누구를 봐야 하는가”를 점수로 매깁니다. 방법은 단순합니다.
      <b>Query 벡터와 Key 벡터의 내적(dot product)</b>. 두 벡터가 같은 방향을 가리킬수록 값이 큽니다.</p>
      <p class="formula">score[i][j] = ( q<sub>i</sub> · k<sub>j</sub> ) / √d_head</p>
      <p>여기서 <b>i</b>는 “질문하는 토큰”, <b>j</b>는 “대답 후보 토큰”입니다.
      4개 토큰이면 4 × 4 = 16개의 점수가 나옵니다.</p>
      <p><b>왜 √d_head 로 나눌까요?</b> 8차원 벡터의 내적은 차원 수에 비례해 커집니다.
      그대로 두면 softmax에 아주 큰 값이 들어가 확률이 0 아니면 1로 극단화되고,
      gradient가 거의 0이 되어 학습이 멈춥니다. √8 ≈ 2.83으로 나눠 크기를 눌러 줍니다.
      이것이 <span class="tw">scaled dot-product attention</span>이라는 이름의 유래입니다.</p>
      <p class="tip">아래 점수 칸을 클릭하면 그 값이 어떤 두 벡터의 내적인지 보여줍니다.</p>`,
    controls: ["layer", "head"],
    render(host, ctx) {
      const W = 940, H = 700;
      const s = stage(host, W, H);
      const t = ctx.trace;
      const hd = t.layers[ctx.layer].heads[ctx.head];

      const mQ = V.matrix(s, hd.q, {
        x: 90, y: 106, cell: 26, gap: 2, rowLabels: t.tokens, labelW: 80,
        title: "Q  (4 × 8)  — 각 토큰의 질문 벡터",
      });
      const mK = V.matrix(s, hd.k, {
        x: 520, y: 106, cell: 26, gap: 2, rowLabels: t.tokens, labelW: 80,
        title: "K  (4 × 8)  — 각 토큰의 색인 벡터",
      });

      const mS = V.matrix(s, hd.scaled, {
        x: 300, y: 300, cell: 50, gap: 4, values: true, decimals: 2,
        rowLabels: t.tokens, labelW: 86, colLabels: t.tokens, labelH: 74,
        title: "score = Q·Kᵀ / √8   (4 × 4)",
      });
      V.el("text", { x: 300 + 86, y: 300 + 74 + 4 * 54 + 22, class: "vlabel small",
        text: "행 = 질문하는 토큰(Query) · 열 = 보이는 대상(Key)" }, s);

      const info = V.card(s, 90, 604, 760, ["점수 칸을 클릭해 보세요", ""], {});
      const it = info.querySelectorAll("text");
      mS.cells.forEach((row, i) => row.forEach((r, j) => {
        r.style.cursor = "pointer";
        r.addEventListener("click", () => {
          s.querySelectorAll(".mark,.sel").forEach((c) => c.classList.remove("mark", "sel"));
          mQ.cells[i].forEach((c) => c.classList.add("mark"));
          mK.cells[j].forEach((c) => c.classList.add("mark"));
          r.classList.add("sel");
          let d = 0;
          for (let z = 0; z < 8; z++) d += hd.q[i][z] * hd.k[j][z];
          it[0].textContent =
            `"${t.tokens[i]}" 의 Query  ·  "${t.tokens[j]}" 의 Key`;
          it[1].textContent =
            `q · k = ${V.fmt(d, 3)}   →   ÷ √8 (= 2.828)   →   score = ${V.fmt(hd.scaled[i][j], 3)}`;
        });
      }));
      V.el("text", { x: 90, y: 52, class: "stage-caption",
        text: `layer ${ctx.layer} · head ${ctx.head} — 모든 (질문, 대상) 쌍의 내적을 구한다` }, s);
    },
  });

  /* ============================== 8. Causal Mask =========================== */
  CH.push({
    id: "mask",
    group: "Self-Attention",
    title: "Causal Mask — 미래를 훔쳐보지 못하게",
    body: `
      <p>GPT는 <b>다음 토큰을 맞히는 것</b>으로 학습합니다. 그런데 방금 만든 4 × 4 점수표에는
      “첫 번째 토큰이 네 번째 토큰을 보는 점수”까지 들어 있습니다. 그대로 두면
      모델은 정답을 미리 보고 베끼는 셈이 되어 아무것도 배우지 못합니다.</p>
      <p>그래서 <b>대각선 위쪽(미래 방향)을 전부 −∞ 로 덮어씌웁니다.</b>
      다음 단계인 softmax에서 <code>exp(−∞) = 0</code>이 되므로 가중치가 정확히 0이 됩니다.</p>
      <p class="formula">masked[i][j] = ( j &gt; i ) ? −∞ : score[i][j]</p>
      <p>이 삼각형 모양 덕분에 GPT는 <span class="tw">causal</span>(인과적) 혹은
      <span class="tw">autoregressive</span> 모델이라 불립니다.
      BERT처럼 양방향을 다 보는 모델에는 이 mask가 없습니다.</p>
      <p>덤: 이 성질 덕분에 학습할 때 <b>한 번의 forward로 모든 위치의 예측을 동시에</b> 채점할 수 있습니다.
      GPT 학습이 그토록 효율적인 이유입니다.</p>`,
    controls: ["layer", "head"],
    render(host, ctx) {
      const W = 940, H = 520;
      const s = stage(host, W, H);
      const t = ctx.trace;
      const hd = t.layers[ctx.layer].heads[ctx.head];
      const cell = 54;

      V.matrix(s, hd.scaled, {
        x: 120, y: 130, cell, gap: 3, values: true, decimals: 2,
        rowLabels: t.tokens, labelW: 80, colLabels: t.tokens, labelH: 76,
        title: "① mask 적용 전",
      });
      const mm = V.matrix(s, hd.masked, {
        x: 570, y: 130, cell, gap: 3, values: true, decimals: 2,
        colLabels: t.tokens, labelH: 76,
        title: "② mask 적용 후",
      });
      V.el("text", { x: 510, y: 240, "text-anchor": "middle", class: "op-sign", text: "→" }, s);
      V.el("text", { x: 510, y: 264, "text-anchor": "middle", class: "vlabel tiny", text: "+ mask" }, s);

      // 삼각형 강조
      for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
        mm.cells[i][j].classList.add("masked-cell");
      }
      V.card(s, 120, 430, 740, [
        "읽는 법: i번째 행 = i번째 토큰이 질문할 때, j번째 열 = j번째 토큰을 볼 수 있는가",
        "0번 토큰 “고양이가”는 자기 자신만 볼 수 있고, 3번 토큰 “맛있게”는 4개 모두 볼 수 있다.",
      ], {});
    },
  });

  /* ============================== 9. Softmax =============================== */
  CH.push({
    id: "softmax",
    group: "Self-Attention",
    title: "Softmax — 점수를 “주의력 배분”으로",
    body: `
      <p>점수는 아직 그냥 실수입니다. 이걸 <b>합이 1인 비율</b>로 바꿔야
      “주의력을 어떻게 나눠 쓸지”가 됩니다. 그 변환이 <span class="tw">softmax</span>입니다.</p>
      <p class="formula">softmax(s)<sub>j</sub> = exp(s<sub>j</sub>) / Σ<sub>k</sub> exp(s<sub>k</sub>)</p>
      <p>exp를 씌우기 때문에 <b>큰 점수는 훨씬 더 크게</b> 부풀려집니다. 점수 차이가 2.0이면
      확률 비는 약 7.4배가 됩니다. 그래서 softmax는 “부드러운 최댓값 고르기”라는 이름을 얻었습니다.</p>
      <p>결과는 각 행의 합이 정확히 1인 <span class="tw">attention weight</span> 행렬입니다.
      아래 히트맵의 밝은 칸이 “거기를 본다”는 뜻입니다.</p>
      <p class="tip"><b>layer 0 · head 2</b>를 골라 마지막 행(“맛있게”)을 보세요.
      주의력의 <b>86%</b>가 “생선을”에 쏠려 있습니다. 모델이 동사를 맞히기 위해
      목적어를 찾아간 순간이 바로 이 숫자입니다.</p>`,
    controls: ["layer", "head", "query"],
    render(host, ctx) {
      const W = 940, H = 640;
      const s = stage(host, W, H);
      const t = ctx.trace;
      const hd = t.layers[ctx.layer].heads[ctx.head];
      const i = ctx.query;
      const vis = hd.masked[i].slice(0, i + 1);
      const ex = vis.map(Math.exp);
      const sum = ex.reduce((a, b) => a + b, 0);

      V.el("text", { x: 40, y: 34, class: "stage-caption",
        text: `layer ${ctx.layer} · head ${ctx.head} · "${t.tokens[i]}" 행의 softmax 계산` }, s);

      const rows = t.tokens.slice(0, i + 1);
      const colW = 150, x0 = 60;
      const heads = ["대상 토큰", "masked score", "exp(score)", `÷ 합계 ${V.fmt(sum, 3)}`, "attention weight"];
      heads.forEach((h, c) => {
        V.el("text", { x: x0 + c * colW + 60, y: 74, "text-anchor": "middle",
          class: "mx-title", text: h }, s);
      });
      rows.forEach((tok, j) => {
        const y = 104 + j * 42;
        const w = hd.attn[i][j];
        const cells = [tok, V.fmt(hd.masked[i][j], 3), V.fmt(ex[j], 3), "", (w * 100).toFixed(1) + "%"];
        cells.forEach((txt, c) => {
          if (c === 3) return;
          V.el("rect", { x: x0 + c * colW, y, width: 120, height: 32, rx: 5,
            class: "cellbox" + (c === 4 ? " out" : ""),
            fill: c === 4 ? V.sequential(w, 1) : null }, s);
          V.el("text", { x: x0 + c * colW + 60, y: y + 21, "text-anchor": "middle",
            class: "cellbox-text", text: txt }, s);
        });
        V.arrow(s, x0 + 120 + 4, y + 16, x0 + colW - 4, y + 16, { width: 1.2, opacity: 0.5 });
        V.arrow(s, x0 + colW + 120 + 4, y + 16, x0 + 2 * colW - 4, y + 16, { width: 1.2, opacity: 0.5 });
        V.arrow(s, x0 + 2 * colW + 120 + 4, y + 16, x0 + 4 * colW - 4, y + 16,
          { width: 1.2, opacity: 0.5, curve: 40 });
        // 막대
        V.el("rect", { x: x0 + 4 * colW + 130, y: y + 6, width: 240, height: 20, rx: 4, class: "bar-bg" }, s);
        V.el("rect", { x: x0 + 4 * colW + 130, y: y + 6, width: Math.max(2, w * 240), height: 20,
          rx: 4, fill: V.sequential(w, 1), class: "fade-in" }, s);
      });
      V.el("text", { x: x0, y: 104 + (i + 1) * 42 + 24, class: "vlabel small",
        text: `합계 = 1.000  (마스킹된 미래 토큰은 exp(−∞) = 0 이라 자동으로 제외됨)` }, s);

      // 전체 attention 히트맵
      const yH = 104 + 4 * 42 + 70;
      const mA = V.matrix(s, hd.attn, {
        x: 120, y: yH, cell: 52, gap: 3, values: true, decimals: 2, scale: "seq", max: 1,
        rowLabels: t.tokens, labelW: 80, colLabels: t.tokens, labelH: 70,
        title: "attention weight 전체 (행 합 = 1)",
      });
      mA.cells[i].forEach((c) => c.classList.add("sel"));
      V.card(s, 560, yH + 40, 340, [
        "히트맵 읽는 법",
        "행 = 질문하는 토큰 (Query)",
        "열 = 정보를 주는 토큰 (Key)",
        "밝을수록 강하게 주목한다는 뜻",
      ], {});
    },
  });

  /* ============================== 10. 가중합 =============================== */
  CH.push({
    id: "weighted",
    group: "Self-Attention",
    title: "Value 가중합 — 실제로 정보를 가져오기",
    body: `
      <p>attention weight는 “얼마나 볼지”만 정했을 뿐, 아직 아무 정보도 옮기지 않았습니다.
      마지막 단계는 그 비율대로 <b>Value 벡터들을 섞는 것</b>입니다.</p>
      <p class="formula">out<sub>i</sub> = Σ<sub>j</sub> attention[i][j] · v<sub>j</sub></p>
      <p>이것이 attention의 전부입니다. 나머지는 전부 이 한 줄을 위한 준비 작업이었습니다.
      정리하면:</p>
      <p class="formula big">Attention(Q,K,V) = softmax( Q Kᵀ / √d<sub>k</sub> + mask ) V</p>
      <p>여기서 결정적으로 중요한 사실: 이 연산은 <b>토큰들이 서로 대화하는 유일한 곳</b>입니다.
      LayerNorm도, 뒤에 나올 MLP도 토큰 하나하나를 따로 처리합니다.
      문장의 문맥이 섞이는 지점은 오직 이 self-attention뿐입니다.</p>
      <p class="tip">아래에서 “맛있게”의 출력 벡터가 사실상 “생선을”의 Value를
      거의 그대로 복사해 온 것임을 확인해 보세요.</p>`,
    controls: ["layer", "head", "query"],
    render(host, ctx) {
      const W = 940, H = 600;
      const s = stage(host, W, H);
      const t = ctx.trace;
      const hd = t.layers[ctx.layer].heads[ctx.head];
      const i = ctx.query;
      const cell = 26, step = 29;

      V.el("text", { x: 40, y: 34, class: "stage-caption",
        text: `layer ${ctx.layer} · head ${ctx.head} · "${t.tokens[i]}" 의 출력 만들기` }, s);

      const y0 = 90;
      for (let j = 0; j <= i; j++) {
        const y = y0 + j * 78;
        const w = hd.attn[i][j];
        // 가중치
        V.el("text", { x: 130, y: y + 20, "text-anchor": "end", class: "tok-name", text: t.tokens[j] }, s);
        V.el("rect", { x: 142, y: y + 2, width: 90, height: 24, rx: 5,
          fill: V.sequential(w, 1), class: "cellbox out" }, s);
        V.el("text", { x: 187, y: y + 19, "text-anchor": "middle", class: "cellbox-text",
          text: (w * 100).toFixed(1) + "%" }, s);
        V.el("text", { x: 248, y: y + 19, class: "op-sign small", text: "×" }, s);
        // Value 벡터
        V.matrix(s, [hd.v[j]], { x: 276, y: y, cell, gap: 2, });
        V.el("text", { x: 276 + 8 * step + 10, y: y + 19, class: "vlabel tiny",
          text: `v(${t.tokens[j]})` }, s);
        // 화살표
        V.arrow(s, 276 + 4 * step, y + cell + 4, 700, y0 + (i + 1) * 78 + 30,
          { curve: 60, width: 1 + w * 4, opacity: 0.25 + w * 0.7,
            stroke: "var(--accent)", marker: "arrowhead-hot" });
      }
      const yOut = y0 + (i + 1) * 78 + 40;
      V.el("text", { x: 130, y: yOut + 19, "text-anchor": "end", class: "tok-name bold", text: "출력" }, s);
      const mo = V.matrix(s, [hd.out[i]], { x: 276, y: yOut, cell, gap: 2 });
      mo.cells[0].forEach((c) => c.classList.add("sel"));
      V.el("text", { x: 276 + 8 * step + 10, y: yOut + 19, class: "vlabel tiny",
        text: "= 가중 평균된 Value (8차원)" }, s);

      V.el("text", { x: 40, y: H - 26, class: "vlabel small",
        text: "화살표 굵기 = attention weight. 가장 굵은 화살표가 어떤 토큰에서 나오는지 보세요." }, s);
    },
  });
})(window);
