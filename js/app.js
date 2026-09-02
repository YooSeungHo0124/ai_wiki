/* =============================================================================
 * app.js — 챕터 이동, 컨트롤, 상태 관리
 * ===========================================================================*/
(function (global) {
  "use strict";
  const M = global.Model;
  const CH = global.CHAPTERS;

  // 어휘 그룹 (문장 만들기 컨트롤용)
  const GROUPS = {
    subject: M.VOCAB.slice(0, 4),
    place: M.VOCAB.slice(4, 8),
    object: M.VOCAB.slice(8, 13),
    adverb: M.VOCAB.slice(13, 17),
  };

  const ctx = {
    tokens: ["고양이가", "부엌에서", "생선을", "맛있게"],
    trace: null,
    layer: 0,
    head: 2,
    query: 3,
    temp: 1.0,
    mode: "topp",
    k: 3,
    p: 0.9,
    genstep: 0,
    predpos: 3,
    rolled: null,
    rollValue: 0,
    sampleProbs: null,
    goto: goto_,
    rerender: () => rerender(),
  };

  let idx = 0;

  const $ = (s) => document.querySelector(s);
  const canvas = $("#canvas");
  const controlsEl = $("#controls");
  const narrationEl = $("#narration");
  const tocEl = $("#toc");

  function recompute() {
    ctx.trace = M.forward(ctx.tokens);
    if (ctx.query > ctx.trace.T - 1) ctx.query = ctx.trace.T - 1;
    if (ctx.genstep > ctx.trace.T - 1) ctx.genstep = ctx.trace.T - 1;
    if (ctx.predpos > ctx.trace.T - 1) ctx.predpos = ctx.trace.T - 1;
  }

  /* ------------------------------------------------------------------ 목차 */
  function buildToc() {
    let html = "";
    let lastGroup = null;
    CH.forEach((c, i) => {
      if (c.group !== lastGroup) {
        html += `<div class="toc-group">${c.group}</div>`;
        lastGroup = c.group;
      }
      html += `<a data-i="${i}"><span class="num">${String(i + 1).padStart(2, "0")}</span>`
        + `<span>${c.title.split(" — ")[0]}</span></a>`;
    });
    tocEl.innerHTML = html;
    tocEl.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => show(+a.dataset.i)));
  }

  /* -------------------------------------------------------------- 컨트롤바 */
  function seg(label, options, current, onPick) {
    const d = document.createElement("div");
    d.className = "ctl";
    d.innerHTML = `<label>${label}</label>`;
    const box = document.createElement("div");
    box.className = "seg";
    options.forEach((o) => {
      const b = document.createElement("button");
      b.textContent = o.label;
      if (o.value === current) b.classList.add("on");
      b.addEventListener("click", () => { onPick(o.value); rerender(); });
      box.appendChild(b);
    });
    d.appendChild(box);
    return d;
  }

  function slider(label, min, max, step, value, fmt, onInput) {
    const d = document.createElement("div");
    d.className = "ctl";
    d.innerHTML = `<label>${label}</label>`;
    const r = document.createElement("input");
    r.type = "range"; r.min = min; r.max = max; r.step = step; r.value = value;
    const v = document.createElement("span");
    v.className = "val"; v.textContent = fmt(value);
    r.addEventListener("input", () => {
      v.textContent = fmt(+r.value);
      onInput(+r.value);
      renderStage();
    });
    d.appendChild(r); d.appendChild(v);
    return d;
  }

  function select(label, options, current, onPick) {
    const d = document.createElement("div");
    d.className = "ctl";
    d.innerHTML = `<label>${label}</label>`;
    const s = document.createElement("select");
    options.forEach((o) => {
      const op = document.createElement("option");
      op.value = o; op.textContent = o;
      if (o === current) op.selected = true;
      s.appendChild(op);
    });
    s.addEventListener("change", () => { onPick(s.value); rerender(); });
    d.appendChild(s);
    return d;
  }

  function buildControls(ch) {
    controlsEl.innerHTML = "";
    const want = ch.controls || [];
    const T = ctx.trace.T;

    if (want.includes("sentence")) {
      const slots = [["주어", "subject", 0], ["장소", "place", 1], ["목적어", "object", 2], ["부사", "adverb", 3]];
      slots.forEach(([lab, grp, pos]) => {
        controlsEl.appendChild(select(lab, GROUPS[grp], ctx.tokens[pos], (v) => {
          ctx.tokens[pos] = v; recompute();
        }));
      });
    }
    if (want.includes("layer")) {
      controlsEl.appendChild(seg("layer",
        [0, 1].map((i) => ({ label: String(i), value: i })), ctx.layer,
        (v) => (ctx.layer = v)));
    }
    if (want.includes("head")) {
      controlsEl.appendChild(seg("head",
        [0, 1, 2].map((i) => ({ label: String(i), value: i })), ctx.head,
        (v) => (ctx.head = v)));
    }
    if (want.includes("query")) {
      controlsEl.appendChild(seg("토큰",
        ctx.tokens.map((t, i) => ({ label: t, value: i })), ctx.query,
        (v) => (ctx.query = v)));
    }
    if (want.includes("predpos")) {
      controlsEl.appendChild(seg("예측 지점",
        ctx.tokens.map((tk, i) => ({ label: `“${tk}” 다음`, value: i })), ctx.predpos,
        (v) => { ctx.predpos = v; ctx.rolled = null; }));
    }
    if (want.includes("temp")) {
      controlsEl.appendChild(slider("temperature", 0.05, 10, 0.05, ctx.temp,
        (v) => v.toFixed(2), (v) => (ctx.temp = v)));
    }
    if (want.includes("mode")) {
      controlsEl.appendChild(seg("방식", [
        { label: "greedy", value: "greedy" },
        { label: "pure", value: "pure" },
        { label: "top-k", value: "topk" },
        { label: "top-p", value: "topp" },
      ], ctx.mode, (v) => { ctx.mode = v; ctx.rolled = null; }));
      if (ctx.mode === "topk") {
        controlsEl.appendChild(slider("k", 1, 10, 1, ctx.k, (v) => String(v), (v) => (ctx.k = v)));
      }
      if (ctx.mode === "topp") {
        controlsEl.appendChild(slider("p", 0.1, 1, 0.05, ctx.p, (v) => v.toFixed(2), (v) => (ctx.p = v)));
      }
    }
    if (want.includes("roll")) {
      const d = document.createElement("div");
      d.className = "ctl";
      const b = document.createElement("button");
      b.className = "action";
      b.textContent = "🎲 주사위 굴리기";
      b.addEventListener("click", () => {
        const probs = ctx.sampleProbs
          || M.applyTemperature(ctx.trace.logits[ctx.predpos], ctx.temp);
        ctx.rollValue = Math.random();
        ctx.rolled = M.sampleFrom(probs, () => ctx.rollValue);
        renderStage();
      });
      d.appendChild(b);
      controlsEl.appendChild(d);
    }
    if (want.includes("genstep")) {
      controlsEl.appendChild(seg("생성 스텝",
        ctx.tokens.map((_, i) => ({ label: String(i + 1), value: i })), ctx.genstep,
        (v) => (ctx.genstep = v)));
      controlsEl.appendChild(seg("head",
        [0, 1, 2].map((i) => ({ label: String(i), value: i })), ctx.head,
        (v) => (ctx.head = v)));
    }
  }

  /* -------------------------------------------------------------- 렌더링 */
  function renderStage() {
    const ch = CH[idx];
    try {
      ch.render(canvas, ctx);
    } catch (e) {
      canvas.innerHTML = `<p style="color:var(--hot)">렌더링 오류: ${e.message}</p>`;
      console.error(e);
    }
  }

  function rerender() {
    buildControls(CH[idx]);
    renderStage();
  }

  function show(i) {
    idx = Math.max(0, Math.min(CH.length - 1, i));
    const ch = CH[idx];
    ctx.rolled = null;
    narrationEl.innerHTML =
      `<div class="kicker">${String(idx + 1).padStart(2, "0")} · ${ch.group}</div>`
      + `<h2>${ch.title}</h2>` + ch.body;
    narrationEl.scrollTop = 0;
    tocEl.querySelectorAll("a").forEach((a) =>
      a.classList.toggle("active", +a.dataset.i === idx));
    $("#prevBtn").disabled = idx === 0;
    $("#nextBtn").disabled = idx === CH.length - 1;
    $("#progressFill").style.width = ((idx + 1) / CH.length) * 100 + "%";
    $("#progressText").textContent = `${idx + 1} / ${CH.length}`;
    if (location.hash.slice(1) !== ch.id) history.replaceState(null, "", "#" + ch.id);
    rerender();
  }

  function goto_(id) {
    const i = CH.findIndex((c) => c.id === id);
    if (i >= 0) show(i);
  }

  /* ------------------------------------------------------------------ 초기화 */
  function init() {
    recompute();
    buildToc();

    $("#prevBtn").addEventListener("click", () => show(idx - 1));
    $("#nextBtn").addEventListener("click", () => show(idx + 1));
    $("#tocToggle").addEventListener("click", (e) => {
      tocEl.classList.toggle("hidden");
      e.currentTarget.classList.toggle("closed");
    });
    $("#themeBtn").addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme");
      const next = cur === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("attn-theme", next); } catch (e) { /* 무시 */ }
      renderStage();
    });
    try {
      const saved = localStorage.getItem("attn-theme");
      if (saved) document.documentElement.setAttribute("data-theme", saved);
    } catch (e) { /* 무시 */ }

    global.addEventListener("hashchange", () => {
      const i = CH.findIndex((c) => c.id === location.hash.slice(1));
      if (i >= 0 && i !== idx) show(i);
    });

    document.addEventListener("keydown", (e) => {
      if (e.target.tagName === "SELECT" || e.target.tagName === "INPUT") return;
      if (e.key === "ArrowRight") show(idx + 1);
      if (e.key === "ArrowLeft") show(idx - 1);
    });

    const hash = location.hash.slice(1);
    const start = CH.findIndex((c) => c.id === hash);
    show(start >= 0 ? start : 0);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
