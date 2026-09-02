/* =============================================================================
 * chapters2.js — 11~18장: multi-head 합치기 → MLP → 층 쌓기 → logits →
 *                temperature → sampling → KV cache → 종합 실습
 * ===========================================================================*/
(function (global) {
  "use strict";
  const V = global.Viz;
  const CH = global.CHAPTERS;
  const stage = global.VizStage;

  /* ============================== 11. Multi-head 합치기 ==================== */
  CH.push({
    id: "multihead",
    group: "Self-Attention",
    title: "Head 합치기와 Residual 연결",
    body: `
      <p>head 3개가 각각 8차원 출력을 만들었습니다. 이걸 옆으로 이어 붙여(<span class="tw">concat</span>)
      다시 24차원으로 만들고, 마지막으로 <span class="tw">output projection</span>
      <code>W_o</code>를 한 번 곱합니다.</p>
      <p class="formula">attn_out = concat(head₀, head₁, head₂) @ W_o + b_o</p>
      <p><code>W_o</code>의 역할은 “head들이 각자 가져온 정보를 어떻게 섞어서 쓸지”를 정하는 것입니다.
      이게 없으면 각 head의 정보가 서로 다른 24차원 칸에 갇혀 버립니다.</p>
      <h4>Residual connection</h4>
      <p>그리고 결정적인 한 줄:</p>
      <p class="formula">x ← x + attn_out</p>
      <p>덮어쓰는 게 아니라 <b>더합니다</b>. 그래서 원래 정보는 그대로 남고, attention은
      “보태는 수정치”만 만듭니다. 이 통로를 <span class="tw">residual stream</span>이라 부릅니다.
      층이 100개 쌓여도 gradient가 끝까지 흐를 수 있는 이유이고, 층마다 조금씩 의미를
      다듬어 나가는 구조를 만드는 이유이기도 합니다.</p>`,
    controls: ["layer"],
    render(host, ctx) {
      const W = 940, H = 770;
      const s = stage(host, W, H);
      const t = ctx.trace, M = global.Model;
      const L = t.layers[ctx.layer];
      const COL = ["var(--h0)", "var(--h1)", "var(--h2)"];

      V.el("text", { x: 40, y: 30, class: "stage-caption",
        text: `layer ${ctx.layer} · 3개 head 의 attention 패턴 비교` }, s);
      L.heads.forEach((hd, h) => {
        const m = V.matrix(s, hd.attn, {
          x: 60 + h * 300, y: 96, cell: 40, gap: 3, values: true, decimals: 2,
          scale: "seq", max: 1,
          rowLabels: h === 0 ? t.tokens : null, labelW: 78,
          colLabels: t.tokens, labelH: 62,
          title: `head ${h}`,
        });
        m.node.querySelector(".mx-title").setAttribute("fill", COL[h]);
      });

      // ---- concat @ W_o = attn_out ----
      const cell = 8, step = 9, LW = 78;
      const yW = 400, hW = 24 * step;          // W_o 블록
      const yR4 = yW + (hW - 4 * step) / 2;    // 4행 행렬을 세로 중앙 정렬

      const mC = V.matrix(s, L.concat, {
        x: 90, y: yR4, cell, gap: 1, rowLabels: t.tokens, labelW: LW,
        title: "concat (4 × 24)",
      });
      for (let h = 0; h < 3; h++) {
        V.el("rect", { x: 90 + LW + h * 8 * step - 2, y: yR4 - 3, width: 8 * step + 2,
          height: 4 * step + 6, rx: 4, fill: "none", stroke: COL[h], "stroke-width": 2 }, s);
      }
      V.el("text", { x: 400, y: yR4 + 24, class: "op-sign small", text: "@" }, s);
      V.matrix(s, M.W["b" + ctx.layer + ".w_o"], {
        x: 430, y: yW, cell, gap: 1, title: "W_o (24 × 24)",
      });
      V.el("text", { x: 664, y: yR4 + 24, class: "op-sign small", text: "=" }, s);
      V.matrix(s, L.attnProj, {
        x: 700, y: yR4, cell, gap: 1, title: "attn_out (4 × 24)",
      });

      // ---- residual ----
      const yR = 680;
      V.matrix(s, L.xIn, { x: 90, y: yR, cell, gap: 1, rowLabels: t.tokens, labelW: LW,
        title: "x (블록 입력)" });
      V.el("text", { x: 400, y: yR + 24, class: "op-sign small", text: "+" }, s);
      V.matrix(s, L.attnProj, { x: 430, y: yR, cell, gap: 1, title: "attn_out" });
      V.el("text", { x: 664, y: yR + 24, class: "op-sign small", text: "=" }, s);
      V.matrix(s, L.xAfterAttn, { x: 700, y: yR, cell, gap: 1, title: "새로운 x" });
      V.el("text", { x: 90, y: yR + 4 * step + 30, class: "vlabel small",
        text: "residual connection: 기존 x를 지우지 않고 더한다 → 정보 손실 없이 층을 깊게 쌓을 수 있다" }, s);
    },
  });

  /* ============================== 12. MLP ================================= */
  CH.push({
    id: "mlp",
    group: "Transformer Block",
    title: "MLP (Feed-Forward) — 토큰 혼자만의 생각",
    body: `
      <p>Attention이 “정보를 모아 오는” 단계였다면, <span class="tw">MLP</span>는
      “모아 온 정보로 혼자 생각하는” 단계입니다. 여기서는 <b>토큰끼리 전혀 섞이지 않습니다.</b>
      각 토큰 벡터에 똑같은 2층 신경망을 따로따로 적용합니다.</p>
      <p class="formula">h = GELU( x @ W_fc + b_fc )&nbsp;&nbsp;(24 → 96)<br>
         out = h @ W_proj + b_proj&nbsp;&nbsp;(96 → 24)</p>
      <p>가운데를 <b>4배로 넓혔다가</b> 다시 줄이는 게 핵심입니다. 이 넓은 공간에서
      비선형 활성화 <span class="tw">GELU</span>를 거치며 복잡한 판단이 일어납니다.
      최근 연구들은 이 넓은 층을 <b>“지식이 저장된 key-value 메모리”</b>로 봅니다 —
      “목적어가 생선이면 동사는 먹었다” 같은 규칙이 여기 들어 있습니다.</p>
      <p>파라미터의 약 <b>2/3가 MLP</b>에 있습니다. attention이 유명하지만, 무게중심은 여기입니다.</p>
      <p>그리고 여기서도 마지막은 역시 <span class="tw">residual</span>: <code>x ← x + out</code></p>`,
    controls: ["layer", "query"],
    render(host, ctx) {
      const W = 940, H = 620;
      const s = stage(host, W, H);
      const t = ctx.trace;
      const L = t.layers[ctx.layer];
      const i = ctx.query;

      V.el("text", { x: 40, y: 30, class: "stage-caption",
        text: `layer ${ctx.layer} · 토큰 "${t.tokens[i]}" 한 개에 대한 MLP` }, s);

      const bw = 800;
      const r1 = V.vbars(s, L.ln2[i], { x: 70, y: 70, w: bw / 2, h: 70,
        title: "① LayerNorm(x) — 24차원" });
      V.arrow(s, 70 + bw / 4, 152, 70 + bw / 4, 186, { width: 2 });
      V.el("text", { x: 70 + bw / 4 + 12, y: 174, class: "vlabel tiny", text: "@ W_fc (24×96)" }, s);
      const r2 = V.vbars(s, L.ffnPre[i], { x: 70, y: 196, w: bw, h: 70,
        title: "② 넓힌 층 (96차원, GELU 적용 전)" });
      V.arrow(s, 70 + bw / 2, 278, 70 + bw / 2, 312, { width: 2 });
      V.el("text", { x: 70 + bw / 2 + 12, y: 300, class: "vlabel tiny", text: "GELU" }, s);
      const r3 = V.vbars(s, L.ffnHidden[i], { x: 70, y: 322, w: bw, h: 70,
        title: "③ GELU 통과 후 — 음수는 대부분 0 근처로 눌린다" });
      V.arrow(s, 70 + bw / 2, 404, 70 + bw / 4, 438, { width: 2 });
      V.el("text", { x: 70 + bw / 2 + 12, y: 426, class: "vlabel tiny", text: "@ W_proj (96×24)" }, s);
      const r4 = V.vbars(s, L.ffnOut[i], { x: 70, y: 448, w: bw / 2, h: 70,
        title: "④ MLP 출력 — 24차원" });

      // GELU 곡선
      const gx = 560, gy = 448, gw = 300, gh = 110;
      V.el("rect", { x: gx, y: gy - 24, width: gw, height: gh + 40, rx: 8, class: "card-box" }, s);
      V.el("text", { x: gx + 12, y: gy - 6, class: "mx-title", text: "GELU 활성화 함수" }, s);
      const pts = [];
      for (let k = 0; k <= 60; k++) {
        const xv = -4 + (8 * k) / 60;
        const yv = global.Model.gelu(xv);
        pts.push(`${gx + 12 + ((xv + 4) / 8) * (gw - 24)},${gy + gh - 16 - ((yv + 0.2) / 4.2) * (gh - 20)}`);
      }
      V.el("line", { x1: gx + 12, y1: gy + gh - 16 - (0.2 / 4.2) * (gh - 20),
        x2: gx + gw - 12, y2: gy + gh - 16 - (0.2 / 4.2) * (gh - 20), class: "axis" }, s);
      V.el("polyline", { points: pts.join(" "), fill: "none", stroke: "var(--accent)",
        "stroke-width": 2.2 }, s);
      V.el("text", { x: gx + gw - 14, y: gy + gh + 8, "text-anchor": "end",
        class: "vlabel tiny", text: "ReLU와 비슷하지만 부드럽다" }, s);

      V.stagger([r1.node, r2.node, r3.node, r4.node], 110);
    },
  });

  /* ============================== 13. 층 쌓기 ============================== */
  CH.push({
    id: "blocks",
    group: "Transformer Block",
    title: "Block 쌓기 — 같은 구조의 반복",
    body: `
      <p>지금까지 본 <b>LayerNorm → Self-Attention → residual → LayerNorm → MLP → residual</b>,
      이 한 덩어리가 <span class="tw">Transformer block</span> 하나입니다.
      GPT는 이걸 <b>똑같이 생긴 채로 여러 번 쌓기만</b> 합니다. 층마다 가중치만 다릅니다.</p>
      <p>얕은 층은 문법·위치 같은 표면적 패턴을, 깊은 층은 의미·사실 관계를 다루는 경향이
      관찰됩니다. 아래에서 layer 0과 layer 1의 attention 패턴이 어떻게 다른지 비교해 보세요.</p>
      <table class="scale">
        <tr><th>모델</th><th>layer</th><th>head</th><th>d_model</th><th>파라미터</th></tr>
        <tr class="me"><td>TinyGPT (이 사이트)</td><td>2</td><td>3</td><td>24</td><td>15,168</td></tr>
        <tr><td>GPT-2 small</td><td>12</td><td>12</td><td>768</td><td>124M</td></tr>
        <tr><td>GPT-2 XL</td><td>48</td><td>25</td><td>1600</td><td>1.5B</td></tr>
        <tr><td>GPT-3</td><td>96</td><td>96</td><td>12288</td><td>175B</td></tr>
      </table>
      <p class="note">구조는 똑같습니다. 커지는 건 층 수, head 수, 차원 수뿐입니다.</p>`,
    controls: ["head"],
    render(host, ctx) {
      const W = 940, H = 760;
      const s = stage(host, W, H);
      const t = ctx.trace;

      V.el("text", { x: 40, y: 30, class: "stage-caption",
        text: `head ${ctx.head} 의 attention 이 층마다 어떻게 달라지는가` }, s);
      t.layers.forEach((L, l) => {
        V.matrix(s, L.heads[ctx.head].attn, {
          x: 90 + l * 380, y: 100, cell: 54, gap: 3, values: true, decimals: 2,
          scale: "seq", max: 1, rowLabels: l === 0 ? t.tokens : null, labelW: 78,
          colLabels: t.tokens, labelH: 66,
          title: `layer ${l} · head ${ctx.head}`,
        });
      });

      // 블록 구조도
      const bx = 260, by = 450, bwid = 420;
      const items = [
        ["LayerNorm", "var(--ln)"],
        ["Multi-Head Self-Attention", "var(--accent)"],
        ["+ residual", "var(--muted)"],
        ["LayerNorm", "var(--ln)"],
        ["MLP  (24 → 96 → 24)", "var(--mlp)"],
        ["+ residual", "var(--muted)"],
      ];
      V.el("rect", { x: bx - 20, y: by - 24, width: bwid + 40, height: items.length * 36 + 40,
        rx: 12, class: "block-outline" }, s);
      V.el("text", { x: bx - 20, y: by - 32, class: "mx-title", text: "Transformer block × 2" }, s);
      items.forEach((it, k) => {
        const y = by + k * 36;
        V.el("rect", { x: bx, y, width: bwid, height: 28, rx: 6, class: "flow-box mini" }, s);
        V.el("text", { x: bx + 14, y: y + 19, class: "flow-title small", fill: it[1], text: it[0] }, s);
        if (k < items.length - 1) V.arrow(s, bx + bwid / 2, y + 29, bx + bwid / 2, y + 35, { width: 1.4 });
      });
      V.arrow(s, bx + bwid + 34, by + items.length * 36 + 6, bx + bwid + 34, by - 10,
        { curve: 0, width: 2, stroke: "var(--muted)", dash: "4 4" });
      V.el("text", { x: bx + bwid + 44, y: by + 100, class: "vlabel tiny", text: "반복" }, s);
    },
  });

  /* ============================== 14. Logits ============================== */
  CH.push({
    id: "logits",
    group: "출력 만들기",
    title: "Unembedding — 벡터를 어휘 점수로",
    body: `
      <p>모든 블록을 통과하면 마지막 <span class="tw">LayerNorm</span>을 한 번 더 거칩니다.
      그리고 <b>맨 마지막 토큰의 벡터 하나만</b> 씁니다.
      (다음 토큰을 예측하는 건 마지막 위치니까요. 학습할 때는 모든 위치를 다 쓰지만요.)</p>
      <p>이 24차원 벡터를 어휘 23개에 대한 점수로 바꿔야 합니다. 방법은 놀랍게도
      <b>embedding table을 그대로 재활용</b>하는 것입니다 (<span class="tw">weight tying</span>).</p>
      <p class="formula">logits = x<sub>마지막</sub> @ tok_embᵀ&nbsp;&nbsp;(24 → 23)</p>
      <p>즉 <b>“내 벡터가 각 단어의 embedding과 얼마나 닮았는가”</b>를 내적으로 재는 것입니다.
      가장 닮은 단어의 점수가 가장 높게 나옵니다.</p>
      <p>결과인 <span class="tw">logits</span>는 아직 확률이 아닙니다. 그냥 실수 점수(−∞ ~ +∞)입니다.</p>`,
    render(host, ctx) {
      const W = 940, H = 700;
      const s = stage(host, W, H);
      const t = ctx.trace, M = global.Model;
      const T = t.T;

      V.el("text", { x: 40, y: 30, class: "stage-caption",
        text: `마지막 토큰 "${t.tokens[T - 1]}" 의 벡터로 다음 단어의 점수를 매긴다` }, s);
      V.vbars(s, t.lnf[T - 1], { x: 60, y: 70, w: 380, h: 76,
        title: "Final LayerNorm 출력 (24차원)" });
      V.el("text", { x: 470, y: 112, class: "op-sign small", text: "@" }, s);
      V.matrix(s, M.transpose(M.W.tok_emb), {
        x: 510, y: 62, cell: 6, gap: 1, title: "tok_embᵀ  (24 × 23)",
      });
      V.el("text", { x: 60, y: 196, class: "vlabel small", text: "↓ 내적 23번" }, s);

      const lg = t.last.logits;
      const order = lg.map((_, i) => i).sort((a, b) => lg[b] - lg[a]);
      const top = order.slice(0, 12);
      const b = V.bars(s, top.map((i) => lg[i]), {
        x: 60, y: 250, w: 380, rowH: 30, labelW: 90,
        labels: top.map((i) => M.VOCAB[i]),
        max: Math.max.apply(null, lg.map(Math.abs)),
        title: "logits 상위 12개 (점수 높은 순)", decimals: 2,
      });
      V.card(s, 570, 250, 320, [
        "logits 를 읽는 법",
        `1위: ${M.VOCAB[order[0]]}  (${V.fmt(lg[order[0]], 2)})`,
        `2위: ${M.VOCAB[order[1]]}  (${V.fmt(lg[order[1]], 2)})`,
        `차이: ${V.fmt(lg[order[0]] - lg[order[1]], 2)}`,
        "",
        "차이가 클수록 모델이 확신한다는 뜻.",
        "아직 확률이 아니라 그냥 점수다.",
        "다음 장에서 softmax 로 확률로 바꾼다.",
      ], {});
      V.stagger(b.nodes, 40, 200);
    },
  });

  /* ============================== 15. Temperature ========================== */
  CH.push({
    id: "temperature",
    group: "출력 만들기",
    title: "Softmax와 Temperature — 확신의 세기 조절",
    body: `
      <p>logits를 확률로 바꾸는 건 또 한 번의 <span class="tw">softmax</span>입니다.
      다만 이번엔 나누는 값이 하나 붙습니다.</p>
      <p class="formula">p<sub>i</sub> = exp( logit<sub>i</sub> / T ) / Σ<sub>j</sub> exp( logit<sub>j</sub> / T )</p>
      <p>이 <b>T</b>가 <span class="tw">temperature</span>입니다.</p>
      <ul>
        <li><b>T → 0</b> : 점수 차이가 무한히 벌어짐 → 1등이 100%. 항상 같은 답. 딱딱하고 반복적.</li>
        <li><b>T = 1</b> : 모델이 학습한 확률 그대로.</li>
        <li><b>T &gt; 1</b> : 차이가 눌려서 평평해짐 → 낮은 확률 단어도 잘 나옴. 창의적이지만 헛소리 위험.</li>
      </ul>
      <p>주의할 점: temperature는 <b>순위를 절대 바꾸지 않습니다.</b> 1등은 언제나 1등입니다.
      바뀌는 건 “1등과 나머지의 격차”뿐입니다.</p>
      <p class="tip">두 지점을 꼭 비교해 보세요.<br>
      · <b>“맛있게” 다음</b> (기본값): 모델이 확신하는 자리. T를 올리면 100%였던 확신이
        서서히 무너지고 엉뚱한 단어들이 확률을 나눠 갖습니다.<br>
      · <b>“부엌에서” 다음</b>: 생선을/공을이 <b>정확히 50:50</b>인 자리.
        T를 아무리 내려도 50:50 그대로입니다 — temperature가 순위를 바꾸지 못한다는 걸
        가장 극적으로 보여주는 경우입니다.</p>`,
    controls: ["predpos", "temp"],
    render(host, ctx) {
      const W = 940, H = 600;
      const s = stage(host, W, H);
      const t = ctx.trace, M = global.Model;
      const lg = t.logits[ctx.predpos];
      const p = M.applyTemperature(lg, ctx.temp);
      const order = lg.map((_, i) => i).sort((a, b) => lg[b] - lg[a]);
      const top = order.slice(0, 10);

      const ent = -p.reduce((a, v) => a + (v > 0 ? v * Math.log(v) : 0), 0);
      V.el("text", { x: 40, y: 32, class: "stage-caption",
        text: `“${t.tokens.slice(0, ctx.predpos + 1).join(" ")}” 다음 토큰   ·   T = ${ctx.temp.toFixed(2)}   ·   entropy = ${ent.toFixed(3)} nats` }, s);

      V.bars(s, top.map((i) => lg[i]), {
        x: 50, y: 90, w: 260, rowH: 34, labelW: 90,
        labels: top.map((i) => M.VOCAB[i]),
        max: Math.max.apply(null, lg.map(Math.abs)),
        title: "logits (T와 무관하게 고정)", decimals: 2, color: "var(--muted-bar)",
      });
      V.bars(s, top.map((i) => lg[i] / ctx.temp), {
        x: 470, y: 90, w: 160, rowH: 34, labelW: 10, labels: null,
        max: Math.max.apply(null, lg.map((v) => Math.abs(v))) / Math.max(ctx.temp, 0.05),
        title: "logits ÷ T", decimals: 1, color: "var(--cool2)",
      });
      const bb = V.bars(s, top.map((i) => p[i]), {
        x: 700, y: 90, w: 170, rowH: 34, labelW: 10, labels: null,
        max: 1, title: "softmax → 확률", pct: true, color: "var(--accent)",
      });

      // 게이지
      const gy = 500;
      V.el("text", { x: 50, y: gy - 16, class: "mx-title", text: "temperature 감각 잡기" }, s);
      [["0.1 — 거의 결정적", 0.1], ["0.7 — 대화용 기본값", 0.7], ["1.0 — 학습 그대로", 1.0],
       ["2.5 — 창의적", 2.5], ["6.0 — 거의 무작위", 6.0]].forEach((it, k) => {
        const x = 50 + k * 175;
        const pk = M.applyTemperature(lg, Math.max(it[1], 1e-6));
        const active = Math.abs(ctx.temp - it[1]) < 0.03;
        const g = V.group(s, 0, 0, "preset");
        g.style.cursor = "pointer";
        g.addEventListener("click", () => { ctx.temp = it[1]; ctx.rerender(); });
        V.el("rect", { x, y: gy, width: 160, height: 46, rx: 7,
          class: "flow-box mini" + (active ? " active" : "") }, g);
        V.el("text", { x: x + 10, y: gy + 19, class: "flow-title small", text: it[0] }, g);
        V.el("text", { x: x + 10, y: gy + 36, class: "flow-sub",
          text: `1위 확률 ${(Math.max.apply(null, pk) * 100).toFixed(1)}%` }, g);
      });
      V.stagger(bb.nodes, 30);
    },
  });

  /* ============================== 16. Sampling ============================ */
  CH.push({
    id: "sampling",
    group: "출력 만들기",
    title: "Sampling — 확률에서 토큰 하나 뽑기",
    body: `
      <p>확률분포가 나왔습니다. 이제 진짜 마지막, 여기서 <b>단어 하나를 고릅니다</b>.
      고르는 방식이 답의 성격을 크게 바꿉니다.</p>
      <ul>
        <li><b><span class="tw">greedy</span></b> — 무조건 1등. 항상 같은 답이 나오지만
            길어지면 같은 말을 반복하는 루프에 잘 빠집니다.</li>
        <li><b><span class="tw">pure sampling</span></b> — 확률 그대로 주사위를 굴립니다.
            0.01%짜리 이상한 단어도 언젠가는 튀어나옵니다.</li>
        <li><b><span class="tw">top-k</span></b> — 상위 k개만 남기고 나머지는 버린 뒤 다시 정규화.
            꼬리를 잘라 사고를 막습니다.</li>
        <li><b><span class="tw">top-p</span> (nucleus)</b> — 확률을 큰 순서로 더해 <b>합이 p가 될 때까지</b>만
            남깁니다. 모델이 확신할 땐 후보가 1~2개, 애매할 땐 수십 개로 <b>자동 조절</b>되는 게 장점입니다.
            실전에서 가장 많이 쓰입니다.</li>
      </ul>
      <p class="tip">예측 지점을 <b>“부엌에서” 다음</b>으로 바꾸고 <b>주사위 굴리기</b>를
      눌러 보세요. 생선을/공을이 50:50이라 굴릴 때마다 답이 달라집니다.
      greedy로 바꾸면 항상 같은 답만 나오는 것과 비교해 보세요.
      잘린 후보는 회색으로 표시됩니다.</p>`,
    controls: ["predpos", "temp", "mode", "roll"],
    render(host, ctx) {
      const W = 940, H = 610;
      const s = stage(host, W, H);
      const t = ctx.trace, M = global.Model;
      const base = M.applyTemperature(t.logits[ctx.predpos], ctx.temp);
      let p = base.slice(), note = "";
      if (ctx.mode === "greedy") {
        const b = base.indexOf(Math.max.apply(null, base));
        p = base.map((_, i) => (i === b ? 1 : 0));
        note = "greedy: 1등에 100%";
      } else if (ctx.mode === "topk") {
        p = M.topK(base, ctx.k); note = `top-k: 상위 ${ctx.k}개만 남김`;
      } else if (ctx.mode === "topp") {
        p = M.topP(base, ctx.p); note = `top-p: 누적 확률 ${ctx.p.toFixed(2)} 까지만 남김`;
      } else {
        note = "pure sampling: 확률 그대로";
      }

      const order = base.map((_, i) => i).sort((a, b) => base[b] - base[a]);
      const top = order.slice(0, 10);
      V.el("text", { x: 40, y: 32, class: "stage-caption",
        text: `“${t.tokens.slice(0, ctx.predpos + 1).join(" ")}” 다음   ·   ${note}   ·   T = ${ctx.temp.toFixed(2)}` }, s);

      // 원본 분포
      V.bars(s, top.map((i) => base[i]), {
        x: 60, y: 84, w: 210, rowH: 31, labelW: 96,
        labels: top.map((i) => M.VOCAB[i]), max: 1, pct: true,
        title: "① softmax 확률", color: "var(--muted-bar)",
      });
      // 잘린 분포
      const bars2 = V.bars(s, top.map((i) => p[i]), {
        x: 520, y: 84, w: 210, rowH: 31, labelW: 96,
        labels: top.map((i) => M.VOCAB[i]), max: 1, pct: true,
        title: "② 잘라내고 다시 정규화",
      });
      top.forEach((i, k) => {
        if (p[i] === 0) bars2.nodes[k].classList.add("cut");
      });
      V.el("text", { x: 478, y: 240, "text-anchor": "middle", class: "op-sign", text: "→" }, s);

      // 누적 확률(top-p 이해용)
      let cum = 0;
      const cumY = 440;
      V.el("text", { x: 60, y: cumY - 14, class: "mx-title", text: "누적 확률 (top-p 는 여기를 자른다)" }, s);
      top.forEach((i, k) => {
        const x = 60 + k * 82;
        const prev = cum; cum += base[i];
        const inside = ctx.mode === "topp" ? prev < ctx.p : true;
        V.el("rect", { x, y: cumY, width: 74, height: 42, rx: 6,
          class: "flow-box mini" + (p[i] > 0 ? " active" : " off") }, s);
        V.el("text", { x: x + 37, y: cumY + 18, "text-anchor": "middle",
          class: "flow-title small", text: M.VOCAB[i] }, s);
        V.el("text", { x: x + 37, y: cumY + 34, "text-anchor": "middle",
          class: "flow-sub", text: "Σ " + (cum * 100).toFixed(1) + "%" }, s);
      });

      // 주사위 결과
      if (ctx.rolled !== null && ctx.rolled !== undefined) {
        V.el("text", { x: W / 2, y: 552, "text-anchor": "middle", class: "result-text big",
          text: `선택된 토큰 → ${M.VOCAB[ctx.rolled]}` }, s);
        V.el("text", { x: W / 2, y: 576, "text-anchor": "middle", class: "vlabel small",
          text: `(난수 ${ctx.rollValue.toFixed(4)} 로 뽑음)` }, s);
      } else {
        V.el("text", { x: W / 2, y: 560, "text-anchor": "middle", class: "vlabel small",
          text: "위쪽 “🎲 주사위 굴리기” 버튼을 눌러 보세요" }, s);
      }
      ctx.sampleProbs = p;
    },
  });

  /* ============================== 17. KV Cache ============================ */
  CH.push({
    id: "kvcache",
    group: "생성 루프",
    title: "KV Cache — 같은 계산을 두 번 하지 않기",
    body: `
      <p>토큰을 하나 뽑았으면 그걸 입력 뒤에 붙이고 <b>처음부터 다시</b> 돌립니다.
      이게 <span class="tw">autoregressive generation</span>입니다.</p>
      <p>그런데 여기 엄청난 낭비가 있습니다. 4번째 토큰을 만들 때 이미 계산했던
      1~3번 토큰의 <b>Key와 Value는 절대 변하지 않습니다.</b>
      causal mask 때문에 과거 토큰은 미래를 볼 수 없으니까요.</p>
      <p>그래서 K, V를 메모리에 저장해 두고 재사용합니다. 이것이 <span class="tw">KV cache</span>입니다.
      새 토큰마다 계산할 건 <b>새 토큰 한 개의 Q, K, V</b>뿐입니다.</p>
      <p class="formula">캐시 없이: 매 스텝 O(n²) → 캐시 사용: 매 스텝 O(n)</p>
      <p>대신 메모리를 먹습니다. <code>2 × layer수 × head수 × d_head × 토큰수</code> 만큼요.
      긴 문맥에서 GPU 메모리가 터지는 주범이고, 그래서
      <span class="tw">MQA</span>/<span class="tw">GQA</span>, <span class="tw">PagedAttention</span> 같은
      기법들이 나왔습니다.</p>
      <p class="tip">슬라이더로 생성 스텝을 넘겨 보세요. 초록은 재사용, 주황은 새로 계산하는 부분입니다.</p>`,
    controls: ["genstep"],
    render(host, ctx) {
      const W = 940, H = 560;
      const s = stage(host, W, H);
      const t = ctx.trace, M = global.Model;
      const step = ctx.genstep;               // 0..3 : 몇 개의 토큰이 이미 처리됐는지 -1
      const shown = t.tokens.slice(0, step + 1);
      const cell = 62;

      V.el("text", { x: 40, y: 32, class: "stage-caption",
        text: `생성 스텝 ${step + 1} — 지금까지의 입력: ${shown.join(" ")}` }, s);

      // 토큰 줄
      shown.forEach((tok, i) => {
        V.chip(s, tok, 60 + i * 130, 60, {
          w: 118, h: 36, cls: i === step ? "new" : "cached",
        });
      });
      V.el("text", { x: 60, y: 122, class: "vlabel small",
        text: "주황 = 이번 스텝에 새로 들어온 토큰 / 초록 = 이미 처리된 토큰" }, s);

      // K, V 캐시 표
      ["K cache", "V cache"].forEach((nm, r) => {
        const y = 170 + r * 150;
        V.el("text", { x: 60, y: y - 10, class: "mx-title", text: nm + "  (layer 0 · head " + ctx.head + ")" }, s);
        const mat = r === 0 ? t.layers[0].heads[ctx.head].k : t.layers[0].heads[ctx.head].v;
        for (let i = 0; i <= step; i++) {
          const x = 60 + i * 130;
          const isNew = i === step;
          V.el("rect", { x, y, width: 118, height: 62, rx: 7,
            class: "cache-box " + (isNew ? "new" : "hit") }, s);
          V.matrix(s, [mat[i].slice(0, 8)], { x: x + 8, y: y + 10, cell: 12, gap: 1 });
          V.el("text", { x: x + 59, y: y + 50, "text-anchor": "middle", class: "vlabel tiny",
            text: isNew ? "새로 계산" : "캐시 재사용" }, s);
        }
        for (let i = step + 1; i < 4; i++) {
          V.el("rect", { x: 60 + i * 130, y, width: 118, height: 62, rx: 7,
            class: "cache-box empty" }, s);
        }
      });

      // 비용 비교
      const n = step + 1;
      V.card(s, 60, 476, 400, [
        "이번 스텝의 계산량",
        `캐시 없이 : ${n} 토큰 전부 Q,K,V 계산 (${n * 3} 벡터)`,
        `캐시 사용 : 새 토큰 1개만 계산 (3 벡터)`,
      ], {});
      V.card(s, 500, 476, 380, [
        "캐시 크기",
        `2 × 2 layer × 3 head × 8 dim × ${n} token = ${2 * 2 * 3 * 8 * n} 개의 실수`,
      ], {});
    },
  });

  /* ============================== 18. 종합 실습 ============================ */
  CH.push({
    id: "playground",
    group: "종합",
    title: "직접 해보기 — 문장을 바꿔 가며",
    body: `
      <p>지금까지의 모든 단계를 한 화면에 모았습니다. 문장의 각 자리를 바꾸면
      <b>즉시 전체 forward pass가 다시 계산</b>됩니다.</p>
      <p>꼭 확인해 볼 것:</p>
      <ul>
        <li><b>목적어를 바꾸면</b> 예측되는 동사가 따라 바뀝니다.
            (생선을→먹었다, 책을→읽었다, 공을→굴렸다 …)</li>
        <li><b>주어나 장소를 바꿔도</b> 동사 예측은 거의 그대로입니다.
            모델이 “동사는 목적어가 결정한다”를 배웠기 때문입니다.</li>
        <li>그때 <b>layer 0 · head 2</b>의 마지막 행을 보세요.
            어떤 목적어를 넣든 주의력이 그 목적어 자리로 따라갑니다.
            이것이 <b>attention이 실제로 하는 일</b>입니다.</li>
        <li>두 번째 자리(목적어 예측)에서는 주어가 중요해집니다. 주어를 바꿔 보세요.</li>
      </ul>
      <p class="note">이 모델은 학습 데이터가 이 문장 틀뿐이라 딱 이 규칙만 압니다.
      진짜 GPT는 같은 원리를 수천억 개 파라미터로, 인터넷 규모의 데이터에 대해 할 뿐입니다.</p>`,
    controls: ["sentence", "layer", "head"],
    render(host, ctx) {
      const W = 940, H = 640;
      const s = stage(host, W, H);
      const t = ctx.trace, M = global.Model;
      const hd = t.layers[ctx.layer].heads[ctx.head];

      const mA = V.matrix(s, hd.attn, {
        x: 110, y: 90, cell: 62, gap: 4, values: true, decimals: 2, scale: "seq", max: 1,
        rowLabels: t.tokens, labelW: 90, colLabels: t.tokens, labelH: 74,
        title: `attention weight — layer ${ctx.layer} · head ${ctx.head}`,
      });
      mA.cells[t.T - 1].forEach((c) => c.classList.add("sel"));

      // 각 위치의 예측
      V.el("text", { x: 560, y: 84, class: "mx-title", text: "각 위치에서의 다음 토큰 예측" }, s);
      t.tokens.forEach((tok, i) => {
        const y = 100 + i * 66;
        const pr = t.probs[i];
        const ord = pr.map((_, k) => k).sort((a, b) => pr[b] - pr[a]).slice(0, 3);
        V.el("text", { x: 560, y: y + 16, class: "tok-name", text: `“${tok}” 다음은?` }, s);
        ord.forEach((k, r) => {
          const x = 560 + r * 118;
          V.el("rect", { x, y: y + 24, width: 110, height: 26, rx: 5,
            class: "cellbox" + (r === 0 ? " out" : ""),
            fill: r === 0 ? V.sequential(pr[k], 1) : null }, s);
          V.el("text", { x: x + 55, y: y + 42, "text-anchor": "middle", class: "cellbox-text",
            text: `${M.VOCAB[k]} ${(pr[k] * 100).toFixed(0)}%` }, s);
        });
      });

      // 최종 결과 강조
      const best = t.last.probs.indexOf(Math.max.apply(null, t.last.probs));
      V.el("text", { x: 110, y: H - 76, class: "vlabel small", text: "최종 출력" }, s);
      V.el("text", { x: 110, y: H - 40, class: "result-text big",
        text: `${t.tokens.join(" ")}  →  ${M.VOCAB[best]}` }, s);
      V.el("text", { x: 110, y: H - 16, class: "vlabel small",
        text: `확률 ${(t.last.probs[best] * 100).toFixed(2)}%` }, s);
    },
  });
})(window);
