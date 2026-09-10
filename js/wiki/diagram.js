/* ===== 선언형 다이어그램 렌더러 (HTML + CSS) =====
   지원 타입: flow | stack | compare | loop | split | matrix
   콘텐츠 스키마는 그대로 두고 출력만 SVG → HTML로 바꿨다.
   이유: SVG <text>는 폭을 측정하지 않고, 기존 줄바꿈 로직이 공백 기준이라
        공백이 적은 한국어 라벨이 상자 밖으로 흘러넘쳤다(전체 라벨의 49%).
        HTML은 브라우저가 CJK 줄바꿈과 폭 계산을 대신 해 준다.
   스타일은 css/diagram.css. 색·크기는 전부 css/tokens.css의 --dia-* 토큰만
   쓴다(하드코딩 금지) — 토큰 목록은 diagram.css 상단 주석 참고.

   2026-09 품질 라운드에서 고친 것 (렌더러만, 스키마는 하위호환):
   - compare: 좁은 화면(≤700px)에서 화살표(dvs)가 그리드 컬럼 전체 폭으로
     늘어난 뒤 90도 회전해 옆 카드 내용과 겹치는 실제 버그를 수정(css).
   - split: from(분기 시작) 노드에 무조건 acc 클래스를 강제하던 걸 없앴다.
     AUTHORING.md는 "acc:true는 다이어그램 하나에 정확히 1곳만"이라 규정하는데,
     from을 무조건 강조하면 저자가 branches[].acc:true로 핵심 갈래를 따로
     표시한 4개 논문(switch, moe-shazeer, the-pile, stochastic-parrots-risk)
     에서 강조 상자가 2개가 되어 "핵심 기여 한 곳"이라는 신호가 깨졌다.
   - matrix: mix-blend-mode:difference로 셀 숫자 색을 정하던 방식이 라이트
     테마에서 실측 대비 3.2~3.3:1로 WCAG AA(4.5:1) 미달이었다(진한 청록 위
     어두운 텍스트 vs difference 혼합 둘 다 확인, 스크린샷으로 실제 안 보이는
     것도 확인). 셀의 실제 불투명도(a)로 배경 밝기를 이미 알고 있으므로,
     a가 높은 칸은 --surface(테마별 극단값)로, 낮은 칸은 --dia-text로 직접
     스위치한다 — 라이트 전 구간 4.1:1 이상(a≥0.9에서 4.5:1↑), 다크는
     a≥0.6에서 4.5:1↑, 나머지도 3:1(그래픽 요소 기준) 이상을 만족한다.
     0 값 셀은 DESIGN-SYSTEM.md §6.6대로 칠하지 않고 숫자도 생략한다.
   - flow/loop 화살표 라벨(nodes[].a, 스키마엔 있었지만 지금까지 쓰인 적
     없고 AUTHORING.md에도 없던 필드): 전체가 aria-hidden 안에 있어서
     라벨 텍스트가 스크린리더에서 완전히 사라지는 접근성 버그였다. 장식
     선(<i>)만 aria-hidden 처리하고, 라벨이 있으면 컨테이너는 노출한다.
   - <figure>에 다이어그램 종류 + 캡션을 요약한 aria-label을 붙였다 —
     이전엔 role="group"만 있고 스크린리더가 "그룹"이라고만 읽었다.
   - split branches[].off(신규, 선택): 비활성 갈래의 연결선을 40% 불투명도로
     낮춘다(DESIGN-SYSTEM.md §6.5). 기존 파일은 안 써도 그대로 동작한다.
================================================== */
(function(W){
  function esc(s){ return W.esc(s); }
  function fmt(s){ return W.fmt(s); }

  /* aria-label 등 속성값에 쓸 순수 텍스트 — 마크업 기호를 걷어내고
     &/</>/" 만 이스케이프한다(속성 안이므로 큰따옴표까지 막아야 한다). */
  function plain(s){
    s = String(s==null?'':s);
    return s
      .replace(/\$([^$]+)\$/g,'$1')
      .replace(/\*\*([^*]+)\*\*/g,'$1')
      .replace(/`([^`]+)`/g,'$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g,'$1');
  }
  function attrEsc(s){
    return String(s==null?'':s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* 상자 하나 */
  function node(n){
    if(!n) return '';
    return '<div class="dnode'+(n.acc?' acc':'')+'">'
      + '<b>'+fmt(n.t)+'</b>'
      + (n.s?'<span class="ds">'+esc(n.s)+'</span>':'')
      + '</div>';
  }
  /* 화살표. label(선택)이 있으면 그 텍스트는 실제 내용이므로 스크린리더에
     노출한다 — 장식용 선(<i>)만 aria-hidden. label이 없으면 통째로 장식. */
  function arrow(label, dir){
    var hasLabel = !!label;
    return '<div class="darr darr-'+(dir||'r')+'"'+(hasLabel?'':' aria-hidden="true"')+'>'
      + '<i aria-hidden="true"></i>'
      + (hasLabel?'<em>'+esc(label)+'</em>':'')
      + '</div>';
  }

  var R = {};

  /* 가로 파이프라인: 입력 → 처리 → 출력 */
  R.flow = function(d){
    var n=d.nodes||[], out='';
    n.forEach(function(nd,i){
      out += node(nd);
      if(i<n.length-1) out += arrow(nd.a,'r');
    });
    return '<div class="dia-body dia-flow">'+out+'</div>';
  };

  /* 세로 스택: layers[0]이 입력(아래), 위로 쌓인다 */
  R.stack = function(d){
    var L=(d.layers||[]), out='';
    for(var i=L.length-1;i>=0;i--){
      var nd=L[i];
      out += '<div class="drow">'+node(nd)
           + (nd.note?'<span class="dnote">'+fmt(nd.note)+'</span>':'')+'</div>';
      if(i>0) out += arrow('','u');
    }
    return '<div class="dia-body dia-stack">'+out+'</div>';
  };

  /* 이전 방식 vs 이 논문 */
  R.compare = function(d){
    function col(c,acc){
      return '<div class="dcol'+(acc?' acc':'')+'">'
        + '<h5>'+fmt(c.t)+'</h5>'
        + '<ul>'+(c.items||[]).map(function(x){return '<li>'+fmt(x)+'</li>'}).join('')+'</ul>'
        + '</div>';
    }
    return '<div class="dia-body dia-compare">'
      + col(d.left||{t:''},false)
      + '<div class="dvs" aria-hidden="true">→</div>'
      + col(d.right||{t:''},true)
      + '</div>';
  };

  /* 순환: 가로로 늘어놓고 아래에 되돌아가는 화살표를 그린다.
     (원형 배치는 라벨이 서로 겹쳐서 폐기 — 위 파일 주석 참고) */
  R.loop = function(d){
    var n=d.nodes||[], out='';
    n.forEach(function(nd,i){
      out += node(nd);
      if(i<n.length-1) out += arrow(nd.a,'r');
    });
    return '<div class="dia-body dia-loop">'
      + '<div class="dloop-row">'+out+'</div>'
      + '<div class="dloop-back"><span>↺ '+esc(d.center||'반복')+'</span></div>'
      + '</div>';
  };

  /* 하나에서 여러 갈래. branches[].off:true(선택) — 비활성 갈래 표시 */
  R.split = function(d){
    var br=d.branches||[];
    return '<div class="dia-body dia-split">'
      + '<div class="dsplit-top">'+node(d.from)+'</div>'
      + '<div class="dsplit-rail" aria-hidden="true"><i></i></div>'
      + '<div class="dsplit-branches">'
      +   br.map(function(b){
            return '<div class="dbranch'+(b&&b.off?' off':'')+'"><i aria-hidden="true"></i>'+node(b)+'</div>';
          }).join('')
      + '</div>'
      + (d.join?'<div class="dsplit-join">'+fmt(d.join)+'</div>':'')
      + '</div>';
  };

  /* 히트맵 표. 0 값은 칠하지 않고 숫자도 생략한다(DESIGN-SYSTEM.md §6.6).
     칸 배경이 진해질수록(a↑) 글자색을 --dia-text 대신 --surface로 바꿔
     WCAG 대비를 지킨다(위 파일 상단 주석 — 실측 근거). */
  R.matrix = function(d){
    var cols=d.cols||[], rows=d.rows||[];
    var h='<tr><td></td>'+cols.map(function(c){return '<th scope="col">'+esc(c)+'</th>'}).join('')+'</tr>';
    var b=rows.map(function(r){
      return '<tr><th scope="row" class="rh">'+esc(r.t)+'</th>'
        + (r.v||[]).map(function(v){
            var a=Math.max(0,Math.min(1,Number(v)||0));
            if(a<=0) return '<td class="cell cell-zero"></td>';
            var hi = a>=0.5;
            return '<td class="cell'+(hi?' cell-hi':'')+'"><span style="opacity:'+(0.12+0.88*a).toFixed(2)+'"></span>'
                 + '<em>'+(a>=0.995?'1.0':a.toFixed(2).replace(/^0/,''))+'</em></td>';
          }).join('')
        + '</tr>';
    }).join('');
    return '<div class="dia-body dia-matrix"><table>'+h+b+'</table></div>';
  };

  var TYPE_LABEL = {
    flow:'가로 흐름도', stack:'계층 구조도', compare:'대조표',
    loop:'순환 구조도', split:'분기 구조도', matrix:'히트맵'
  };

  W.diagram = function(d){
    if(!d || !R[d.type]) return '';
    var body='';
    try{ body=R[d.type](d); }catch(e){ return ''; }
    var label = TYPE_LABEL[d.type] || '구조 다이어그램';
    if(d.cap) label += ': '+plain(d.cap);
    return '<figure class="dia dia-t-'+esc(d.type)+'" role="group" aria-label="'+attrEsc(label)+'">'
      + body
      + (d.cap?'<figcaption>'+fmt(d.cap)+'</figcaption>':'')
      + '</figure>';
  };
})(window.WIKI);
