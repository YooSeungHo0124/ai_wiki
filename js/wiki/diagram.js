/* ===== 선언형 다이어그램 렌더러 (HTML + CSS) =====
   지원 타입: flow | stack | compare | loop | split | matrix
   콘텐츠 스키마는 그대로 두고 출력만 SVG → HTML로 바꿨다.
   이유: SVG <text>는 폭을 측정하지 않고, 기존 줄바꿈 로직이 공백 기준이라
        공백이 적은 한국어 라벨이 상자 밖으로 흘러넘쳤다(전체 라벨의 49%).
        HTML은 브라우저가 CJK 줄바꿈과 폭 계산을 대신 해 준다.
   스타일은 css/diagram.css.
================================================== */
(function(W){
  function esc(s){ return W.esc(s); }
  function fmt(s){ return W.fmt(s); }

  /* 상자 하나 */
  function node(n, extra){
    if(!n) return '';
    return '<div class="dnode'+(n.acc?' acc':'')+(extra?' '+extra:'')+'">'
      + '<b>'+fmt(n.t)+'</b>'
      + (n.s?'<span class="ds">'+esc(n.s)+'</span>':'')
      + '</div>';
  }
  function arrow(label, dir){
    return '<div class="darr darr-'+(dir||'r')+'" aria-hidden="true">'
      + '<i></i>' + (label?'<em>'+esc(label)+'</em>':'') + '</div>';
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
     (원형 배치는 라벨이 서로 겹쳐서 폐기) */
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

  /* 하나에서 여러 갈래 */
  R.split = function(d){
    var br=d.branches||[];
    return '<div class="dia-body dia-split">'
      + '<div class="dsplit-top">'+node(d.from,'acc')+'</div>'
      + '<div class="dsplit-rail" aria-hidden="true"><i></i></div>'
      + '<div class="dsplit-branches">'
      +   br.map(function(b){ return '<div class="dbranch"><i aria-hidden="true"></i>'+node(b)+'</div>'; }).join('')
      + '</div>'
      + (d.join?'<div class="dsplit-join">'+fmt(d.join)+'</div>':'')
      + '</div>';
  };

  /* 히트맵 표 */
  R.matrix = function(d){
    var cols=d.cols||[], rows=d.rows||[];
    var h='<tr><td></td>'+cols.map(function(c){return '<th>'+esc(c)+'</th>'}).join('')+'</tr>';
    var b=rows.map(function(r){
      return '<tr><th class="rh">'+esc(r.t)+'</th>'
        + (r.v||[]).map(function(v){
            var a=Math.max(0,Math.min(1,Number(v)||0));
            return '<td class="cell"><span style="opacity:'+(0.10+0.9*a).toFixed(2)+'"></span>'
                 + '<em>'+(a>=0.995?'1.0':a.toFixed(2).replace(/^0/,''))+'</em></td>';
          }).join('')
        + '</tr>';
    }).join('');
    return '<div class="dia-body dia-matrix"><table>'+h+b+'</table></div>';
  };

  W.diagram = function(d){
    if(!d || !R[d.type]) return '';
    var body='';
    try{ body=R[d.type](d); }catch(e){ return ''; }
    return '<figure class="dia dia-t-'+esc(d.type)+'" role="group">'
      + body
      + (d.cap?'<figcaption>'+fmt(d.cap)+'</figcaption>':'')
      + '</figure>';
  };
})(window.WIKI);
