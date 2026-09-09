/* =============================================================================
 * viz.js — SVG 시각화 프리미티브 모음
 * 행렬(matrix), 막대(bars), 토큰 칩(chip), 화살표(arrow), 색상 스케일 등
 * ===========================================================================*/
(function (global) {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";

  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    if (attrs) {
      for (const k in attrs) {
        if (k === "text") n.textContent = attrs[k];
        else if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
      }
    }
    if (parent) parent.appendChild(n);
    return n;
  }

  function svg(width, height, parent) {
    const s = el("svg", {
      viewBox: `0 0 ${width} ${height}`,
      preserveAspectRatio: "xMidYMid meet",
      class: "viz-svg",
    }, parent);
    const defs = el("defs", null, s);
    // 화살표 머리
    [["arrowhead", "var(--line)"], ["arrowhead-hot", "var(--hot)"],
     ["arrowhead-cool", "var(--cool)"]].forEach(([id, fill]) => {
      const m = el("marker", {
        id, viewBox: "0 0 10 10", refX: 8, refY: 5,
        markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
      }, defs);
      el("path", { d: "M 0 0 L 10 5 L 0 10 z", fill }, m);
    });
    return s;
  }

  function group(parent, x, y, cls) {
    return el("g", { transform: `translate(${x || 0},${y || 0})`, class: cls || null }, parent);
  }

  /* ------------------------------------------------------------- 색상 스케일 */
  function mix(c1, c2, t) {
    return [0, 1, 2].map((i) => Math.round(c1[i] + (c2[i] - c1[i]) * t));
  }
  const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;

  const COOL = [72, 132, 232];   // 음수
  const NEUTRAL = [30, 38, 56];  // 0
  const HOT = [232, 116, 62];    // 양수
  const SEQ0 = [24, 32, 48];
  const SEQ1 = [64, 208, 190];

  /** 부호 있는 값: 파랑(-) ~ 배경(0) ~ 주황(+) */
  function diverging(v, max) {
    const m = max || 1;
    const t = Math.max(-1, Math.min(1, v / m));
    return t >= 0 ? rgb(mix(NEUTRAL, HOT, t)) : rgb(mix(NEUTRAL, COOL, -t));
  }
  /** 0~1 값(확률/attention): 어두움 ~ 청록 */
  function sequential(v, max) {
    const t = Math.max(0, Math.min(1, v / (max || 1)));
    return rgb(mix(SEQ0, SEQ1, Math.pow(t, 0.65)));
  }
  function absMax(mat) {
    let m = 0;
    for (const row of mat) for (const v of row) {
      if (isFinite(v)) m = Math.max(m, Math.abs(v));
    }
    return m || 1;
  }

  /* ------------------------------------------------------------------- 행렬 */
  /**
   * 2차원 배열을 셀 격자로 그린다.
   * opts: {cell, gap, scale:'div'|'seq', max, rowLabels, colLabels, values(bool),
   *        decimals, title, maxCols, maxRows, cls, onHover}
   * 반환: {node, cells:[[rect]], width, height, cellAt(i,j)}
   */
  function matrix(parent, data, opts) {
    opts = opts || {};
    const cell = opts.cell || 22;
    const gap = opts.gap === undefined ? 2 : opts.gap;
    const step = cell + gap;
    const rowLabels = opts.rowLabels || null;
    const colLabels = opts.colLabels || null;
    const showValues = !!opts.values;
    const dec = opts.decimals === undefined ? 2 : opts.decimals;
    const scale = opts.scale || "div";
    const max = opts.max || (scale === "seq" ? 1 : absMax(data));

    const rows = data.length, cols = data[0].length;
    const padL = rowLabels ? (opts.labelW || 74) : 0;
    const padT = colLabels ? (opts.labelH || 58) : 0;

    const g = group(parent, opts.x || 0, opts.y || 0, "matrix " + (opts.cls || ""));

    if (opts.title) {
      el("text", {
        x: padL, y: -8, class: "mx-title", text: opts.title,
      }, g);
    }

    const cells = [];
    for (let i = 0; i < rows; i++) {
      const rowCells = [];
      for (let j = 0; j < cols; j++) {
        const v = data[i][j];
        const finite = isFinite(v);
        const r = el("rect", {
          x: padL + j * step, y: padT + i * step, width: cell, height: cell,
          rx: 3,
          fill: !finite ? "var(--masked)" :
            scale === "seq" ? sequential(v, max) : diverging(v, max),
          class: "mx-cell",
          "data-i": i, "data-j": j,
        }, g);
        if (opts.onHover) {
          r.addEventListener("mouseenter", () => opts.onHover(i, j, v, r));
        }
        rowCells.push(r);
        if (showValues) {
          el("text", {
            x: padL + j * step + cell / 2, y: padT + i * step + cell / 2 + 4,
            class: "mx-val", "text-anchor": "middle",
            text: !finite ? "-∞" : fmt(v, dec),
          }, g);
        }
      }
      cells.push(rowCells);
      if (rowLabels) {
        el("text", {
          x: padL - 8, y: padT + i * step + cell / 2 + 4,
          class: "mx-label row", "text-anchor": "end", text: rowLabels[i],
        }, g);
      }
    }
    if (colLabels) {
      for (let j = 0; j < cols; j++) {
        const cx = padL + j * step + cell / 2;
        el("text", {
          x: cx, y: padT - 10, class: "mx-label col", "text-anchor": "start",
          transform: `rotate(-55 ${cx} ${padT - 10})`, text: colLabels[j],
        }, g);
      }
    }

    return {
      node: g,
      cells,
      x: opts.x || 0, y: opts.y || 0,
      padL, padT, step, cell,
      width: padL + cols * step,
      height: padT + rows * step,
      /** 셀의 (부모 좌표계 기준) 중심점 */
      center(i, j) {
        return {
          x: (opts.x || 0) + padL + j * step + cell / 2,
          y: (opts.y || 0) + padT + i * step + cell / 2,
        };
      },
      highlightRow(i, on) {
        cells.forEach((row, ri) =>
          row.forEach((c) => c.classList.toggle("dim", on && ri !== i)));
      },
      highlightCol(j, on) {
        cells.forEach((row) =>
          row.forEach((c, cj) => c.classList.toggle("dim", on && cj !== j)));
      },
      markRow(i, cls) {
        (cells[i] || []).forEach((c) => c.classList.add(cls || "mark"));
      },
      markCol(j, cls) {
        cells.forEach((row) => row[j] && row[j].classList.add(cls || "mark"));
      },
    };
  }

  /* ------------------------------------------------------------------- 막대 */
  /**
   * 가로 막대 그래프. opts: {w,h,rowH,labels,max,color,values,decimals,pct}
   */
  function bars(parent, values, opts) {
    opts = opts || {};
    const rowH = opts.rowH || 20;
    const barW = opts.w || 220;
    const labelW = opts.labelW || 70;
    const max = opts.max || Math.max.apply(null, values.map(Math.abs)) || 1;
    const g = group(parent, opts.x || 0, opts.y || 0, "bars");
    if (opts.title) el("text", { x: 0, y: -10, class: "mx-title", text: opts.title }, g);
    const nodes = [];
    values.forEach((v, i) => {
      const y = i * rowH;
      if (opts.labels) {
        el("text", {
          x: labelW - 8, y: y + rowH * 0.5 + 4, class: "bar-label",
          "text-anchor": "end", text: opts.labels[i],
        }, g);
      }
      el("rect", {
        x: labelW, y: y + 2, width: barW, height: rowH - 6, rx: 3, class: "bar-bg",
      }, g);
      const w = Math.max(1, (Math.abs(v) / max) * barW);
      const r = el("rect", {
        x: labelW, y: y + 2, width: w, height: rowH - 6, rx: 3,
        fill: opts.color || (v < 0 ? rgb(COOL) : "var(--accent)"),
        class: "bar-fill",
      }, g);
      nodes.push(r);
      if (opts.values !== false) {
        el("text", {
          x: labelW + barW + 8, y: y + rowH * 0.5 + 4, class: "bar-value",
          text: opts.pct ? (v * 100).toFixed(v >= 0.0995 ? 1 : 2) + "%"
                         : fmt(v, opts.decimals === undefined ? 2 : opts.decimals),
        }, g);
      }
    });
    return { node: g, nodes, height: values.length * rowH, width: labelW + barW + 60 };
  }

  /**
   * 세로 막대 그래프(차원이 가로축). opts:{w,h,max,color,baseline,labels,cls}
   */
  function vbars(parent, values, opts) {
    opts = opts || {};
    const w = opts.w || 320, h = opts.h || 110;
    const n = values.length;
    const bw = w / n;
    const max = opts.max || Math.max.apply(null, values.map(Math.abs)) || 1;
    const g = group(parent, opts.x || 0, opts.y || 0, "vbars " + (opts.cls || ""));
    if (opts.title) el("text", { x: 0, y: -10, class: "mx-title", text: opts.title }, g);
    const mid = h / 2;
    el("line", { x1: 0, y1: mid, x2: w, y2: mid, class: "axis" }, g);
    const nodes = [];
    values.forEach((v, i) => {
      const bh = Math.max(1, (Math.abs(v) / max) * (h / 2 - 2));
      const r = el("rect", {
        x: i * bw + 1, y: v >= 0 ? mid - bh : mid, width: Math.max(1, bw - 2), height: bh,
        fill: opts.color || (v >= 0 ? "var(--hot)" : "var(--cool)"), class: "vbar",
      }, g);
      r.appendChild(el("title", { text: `d${i} = ${fmt(v, 3)}` }));
      nodes.push(r);
    });
    if (opts.footer) {
      el("text", { x: w / 2, y: h + 18, class: "vlabel small", "text-anchor": "middle", text: opts.footer }, g);
    }
    g.__h = h; g.__w = w;
    return { node: g, nodes, width: w, height: h };
  }

  /* --------------------------------------------------------------- 토큰 칩 */
  function chip(parent, text, x, y, opts) {
    opts = opts || {};
    const w = opts.w || Math.max(58, text.length * 15 + 20);
    const h = opts.h || 32;
    const g = group(parent, x, y, "chip " + (opts.cls || ""));
    el("rect", {
      x: 0, y: 0, width: w, height: h, rx: 7,
      class: "chip-box", fill: opts.fill || null,
    }, g);
    el("text", {
      x: w / 2, y: h / 2 + 5, "text-anchor": "middle", class: "chip-text", text,
    }, g);
    if (opts.sub !== undefined && opts.sub !== null) {
      el("text", {
        x: w / 2, y: h + 15, "text-anchor": "middle", class: "chip-sub", text: opts.sub,
      }, g);
    }
    g.__w = w; g.__h = h;
    return g;
  }

  /* ---------------------------------------------------------------- 화살표 */
  function arrow(parent, x1, y1, x2, y2, opts) {
    opts = opts || {};
    const d = opts.curve
      ? `M ${x1} ${y1} C ${x1 + opts.curve} ${y1}, ${x2 - opts.curve} ${y2}, ${x2} ${y2}`
      : `M ${x1} ${y1} L ${x2} ${y2}`;
    return el("path", {
      d, fill: "none", class: "arrow " + (opts.cls || ""),
      stroke: opts.stroke || "var(--line)",
      "stroke-width": opts.width || 1.6,
      "stroke-dasharray": opts.dash || null,
      "marker-end": opts.head === false ? null : `url(#${opts.marker || "arrowhead"})`,
      opacity: opts.opacity === undefined ? null : opts.opacity,
    }, parent);
  }

  function label(parent, x, y, text, opts) {
    opts = opts || {};
    return el("text", {
      x, y, class: "vlabel " + (opts.cls || ""),
      "text-anchor": opts.anchor || "middle", text,
    }, parent);
  }

  /** 여러 줄 텍스트 */
  function multiline(parent, x, y, lines, opts) {
    opts = opts || {};
    const lh = opts.lh || 17;
    const g = group(parent, 0, 0);
    lines.forEach((t, i) => {
      el("text", {
        x, y: y + i * lh, class: "vlabel " + (opts.cls || ""),
        "text-anchor": opts.anchor || "start", text: t,
      }, g);
    });
    return g;
  }

  /** 설명용 상자(수식 카드) */
  function card(parent, x, y, w, lines, opts) {
    opts = opts || {};
    const lh = opts.lh || 20;
    const h = lines.length * lh + 20;
    const g = group(parent, x, y, "card " + (opts.cls || ""));
    el("rect", { x: 0, y: 0, width: w, height: h, rx: 8, class: "card-box" }, g);
    lines.forEach((t, i) => {
      el("text", {
        x: 14, y: 24 + i * lh, class: "card-text" + (i === 0 ? " head" : ""), text: t,
      }, g);
    });
    g.__h = h;
    return g;
  }

  /* ------------------------------------------------------------------ 유틸 */
  function fmt(v, dec) {
    if (!isFinite(v)) return v > 0 ? "∞" : "-∞";
    if (dec === 0) return String(Math.round(v));
    const s = v.toFixed(dec);
    return s === "-" + (0).toFixed(dec) ? (0).toFixed(dec) : s;
  }

  /** 요소들을 순서대로 fade-in 시킨다. */
  function stagger(nodes, step, startDelay) {
    step = step || 55;
    nodes.forEach((n, i) => {
      if (!n) return;
      n.classList.add("fade-in");
      n.style.animationDelay = (startDelay || 0) + i * step + "ms";
    });
  }

  /** 점선 경로를 따라 흐르는 입자 애니메이션 */
  function flow(parent, path, opts) {
    opts = opts || {};
    const p = el("path", {
      d: path, fill: "none", class: "flow-path",
      stroke: opts.stroke || "var(--accent)",
      "stroke-width": opts.width || 2.5,
    }, parent);
    const len = p.getTotalLength ? p.getTotalLength() : 200;
    p.style.strokeDasharray = `${opts.dash || 8} ${opts.gap || 10}`;
    p.style.animation = `dashmove ${opts.dur || 1.2}s linear infinite`;
    p.__len = len;
    return p;
  }

  global.Viz = {
    NS, el, svg, group, matrix, bars, chip, arrow, label, multiline, card,
    diverging, sequential, absMax, fmt, stagger, flow, rgb, COOL, HOT, vbars,
  };
})(window);
