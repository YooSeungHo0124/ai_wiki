/* =============================================================================
 * model.js — 초소형 GPT(TinyGPT)의 forward pass를 "모든 중간값을 기록하면서" 실행한다.
 * 가중치는 data/weights.js 에 들어있는 실제 학습된 값이다.
 * 구조는 GPT-2/GPT-3와 동일한 pre-LayerNorm decoder-only Transformer.
 * ===========================================================================*/
(function (global) {
  "use strict";

  const SRC = global.TINY_GPT;
  const CFG = SRC.config;
  const VOCAB = SRC.vocab;
  const W = SRC.weights;
  const STOI = {};
  VOCAB.forEach((w, i) => (STOI[w] = i));

  /* ---------------------------------------------------------------- 선형대수 */
  const zeros = (r, c) => Array.from({ length: r }, () => new Array(c).fill(0));

  function matmul(A, B) {
    const n = A.length, m = B.length, p = B[0].length;
    const C = zeros(n, p);
    for (let i = 0; i < n; i++) {
      const Ai = A[i], Ci = C[i];
      for (let k = 0; k < m; k++) {
        const a = Ai[k];
        if (a === 0) continue;
        const Bk = B[k];
        for (let j = 0; j < p; j++) Ci[j] += a * Bk[j];
      }
    }
    return C;
  }
  const addBias = (A, b) => A.map((r) => r.map((v, j) => v + b[j]));
  const addMat = (A, B) => A.map((r, i) => r.map((v, j) => v + B[i][j]));
  const transpose = (A) => A[0].map((_, j) => A.map((r) => r[j]));

  function layerNorm(A, g, b, eps) {
    eps = eps === undefined ? 1e-5 : eps;
    return A.map((row) => {
      const n = row.length;
      const mu = row.reduce((s, v) => s + v, 0) / n;
      const va = row.reduce((s, v) => s + (v - mu) * (v - mu), 0) / n;
      const inv = 1 / Math.sqrt(va + eps);
      return row.map((v, j) => (v - mu) * inv * g[j] + b[j]);
    });
  }
  function layerNormStats(row) {
    const n = row.length;
    const mu = row.reduce((s, v) => s + v, 0) / n;
    const va = row.reduce((s, v) => s + (v - mu) * (v - mu), 0) / n;
    return { mean: mu, variance: va, std: Math.sqrt(va + 1e-5) };
  }

  const C_GELU = Math.sqrt(2 / Math.PI);
  const gelu = (x) => 0.5 * x * (1 + Math.tanh(C_GELU * (x + 0.044715 * x * x * x)));

  function softmaxRow(row) {
    const mx = Math.max.apply(null, row);
    const e = row.map((v) => Math.exp(v - mx));
    const s = e.reduce((a, b) => a + b, 0);
    return e.map((v) => v / s);
  }

  /* ------------------------------------------------------------ forward pass */
  /**
   * @param {string[]} tokens  어휘에 있는 토큰 문자열 배열
   * @returns {object} trace — 모든 중간 텐서를 담은 기록
   */
  function forward(tokens) {
    const D = CFG.d_model, H = CFG.n_head, DH = CFG.d_head, L = CFG.n_layer;
    const ids = tokens.map((t) => STOI[t]);
    const T = ids.length;

    const tokEmb = ids.map((i) => W.tok_emb[i].slice());
    const posEmb = W.pos_emb.slice(0, T).map((r) => r.slice());
    let x = addMat(tokEmb, posEmb);

    const trace = {
      tokens: tokens.slice(),
      ids: ids,
      T: T,
      tokEmb: tokEmb,
      posEmb: posEmb,
      xEmbed: x.map((r) => r.slice()),
      layers: [],
    };

    for (let l = 0; l < L; l++) {
      const p = (k) => W["b" + l + "." + k];
      const rec = { index: l, xIn: x.map((r) => r.slice()) };

      // --- 1) LayerNorm ---
      rec.ln1 = layerNorm(x, p("ln1_g"), p("ln1_b"));
      rec.ln1Stats = x.map(layerNormStats);

      // --- 2) Q, K, V 투영 ---
      const qkv = addBias(matmul(rec.ln1, p("w_qkv")), p("b_qkv")); // (T, 3D)
      rec.qkv = qkv;
      rec.Q = qkv.map((r) => r.slice(0, D));
      rec.K = qkv.map((r) => r.slice(D, 2 * D));
      rec.V = qkv.map((r) => r.slice(2 * D, 3 * D));

      // --- 3) head 분할 & self-attention ---
      rec.heads = [];
      const headOut = []; // (T, D)
      for (let t = 0; t < T; t++) headOut.push(new Array(D).fill(0));

      for (let h = 0; h < H; h++) {
        const s = h * DH;
        const q = rec.Q.map((r) => r.slice(s, s + DH));
        const k = rec.K.map((r) => r.slice(s, s + DH));
        const v = rec.V.map((r) => r.slice(s, s + DH));

        const raw = zeros(T, T);   // q·k
        const scaled = zeros(T, T); // /sqrt(dh)
        const masked = zeros(T, T);
        for (let i = 0; i < T; i++) {
          for (let j = 0; j < T; j++) {
            let d = 0;
            for (let z = 0; z < DH; z++) d += q[i][z] * k[j][z];
            raw[i][j] = d;
            scaled[i][j] = d / Math.sqrt(DH);
            masked[i][j] = j > i ? -Infinity : scaled[i][j];
          }
        }
        const attn = masked.map((row, i) => {
          const vis = row.slice(0, i + 1);
          const sm = softmaxRow(vis);
          const out = new Array(T).fill(0);
          for (let j = 0; j <= i; j++) out[j] = sm[j];
          return out;
        });
        const out = zeros(T, DH);
        for (let i = 0; i < T; i++)
          for (let j = 0; j <= i; j++)
            for (let z = 0; z < DH; z++) out[i][z] += attn[i][j] * v[j][z];

        for (let t = 0; t < T; t++)
          for (let z = 0; z < DH; z++) headOut[t][s + z] = out[t][z];

        rec.heads.push({ index: h, q, k, v, raw, scaled, masked, attn, out });
      }

      rec.concat = headOut.map((r) => r.slice());
      rec.attnProj = addBias(matmul(rec.concat, p("w_o")), p("b_o"));
      rec.xAfterAttn = addMat(x, rec.attnProj);
      x = rec.xAfterAttn.map((r) => r.slice());

      // --- 4) MLP ---
      rec.ln2 = layerNorm(x, p("ln2_g"), p("ln2_b"));
      rec.ffnPre = addBias(matmul(rec.ln2, p("w_fc")), p("b_fc"));
      rec.ffnHidden = rec.ffnPre.map((r) => r.map(gelu));
      rec.ffnOut = addBias(matmul(rec.ffnHidden, p("w_proj")), p("b_proj"));
      rec.xOut = addMat(x, rec.ffnOut);
      x = rec.xOut.map((r) => r.slice());

      trace.layers.push(rec);
    }

    trace.lnf = layerNorm(x, W.lnf_g, W.lnf_b);
    trace.logits = matmul(trace.lnf, transpose(W.tok_emb));
    trace.probs = trace.logits.map(softmaxRow);
    trace.last = {
      logits: trace.logits[T - 1].slice(),
      probs: trace.probs[T - 1].slice(),
    };
    return trace;
  }

  /* --------------------------------------------------------- 샘플링 유틸리티 */
  function applyTemperature(logits, temp) {
    const t = Math.max(temp, 1e-6);
    return softmaxRow(logits.map((v) => v / t));
  }

  function topK(probs, k) {
    const idx = probs.map((p, i) => i).sort((a, b) => probs[b] - probs[a]);
    const keep = new Set(idx.slice(0, k));
    const out = probs.map((p, i) => (keep.has(i) ? p : 0));
    const s = out.reduce((a, b) => a + b, 0);
    return out.map((v) => v / s);
  }

  function topP(probs, p) {
    const idx = probs.map((_, i) => i).sort((a, b) => probs[b] - probs[a]);
    const out = new Array(probs.length).fill(0);
    let cum = 0;
    for (const i of idx) {
      out[i] = probs[i];
      cum += probs[i];
      if (cum >= p) break;
    }
    const s = out.reduce((a, b) => a + b, 0);
    return out.map((v) => v / s);
  }

  function sampleFrom(probs, rand) {
    const r = (rand || Math.random)();
    let acc = 0;
    for (let i = 0; i < probs.length; i++) {
      acc += probs[i];
      if (r <= acc) return i;
    }
    return probs.length - 1;
  }

  global.Model = {
    CFG, VOCAB, STOI, W,
    forward, matmul, transpose, layerNorm, softmaxRow, gelu,
    applyTemperature, topK, topP, sampleFrom,
  };
})(window);
