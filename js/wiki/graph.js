/* ===== 계보 그래프 (연도 = 가로축, 트랙/분야 = 레인) ===== */
(function(W){
  var BW=126, BH=40, VGAP=10, PADL=132, PADT=34, YSCALE=142;

  /* items: META 배열, laneOf: fn(meta)->laneId, lanes: [{id,name,color}] */
  W.graph = function(items, lanes, laneOf, opt){
    opt=opt||{};
    if(!items.length) return '';
    /* 연도 축은 "논문이 존재하는 연도"만 등간격으로 배치해 빈 구간을 압축한다 */
    var years=items.map(function(m){return m.year})
      .filter(function(v,i,a){return a.indexOf(v)===i}).sort(function(a,b){return a-b});
    var idx={}; years.forEach(function(y,i){ idx[y]=i; });
    var xOf=function(yr){ return PADL+idx[yr]*YSCALE; };
    var W0=PADL+(years.length-1)*YSCALE+BW+40;

    var pos={}, laneY={}, cursorY=PADT;
    lanes.forEach(function(ln){
      var mine=items.filter(function(m){return laneOf(m)===ln.id})
                    .sort(function(a,b){return a.year-b.year || a.slug.localeCompare(b.slug)});
      if(!mine.length){ laneY[ln.id]=null; return; }
      var rows=[];
      mine.forEach(function(m){
        var x=xOf(m.year), r=0;
        while(rows[r]!==undefined && rows[r] > x-8) r++;
        rows[r]=x+BW;
        pos[m.slug]={x:x,row:r,lane:ln.id};
      });
      var hRows=rows.length;
      laneY[ln.id]={top:cursorY,h:hRows*(BH+VGAP)};
      mine.forEach(function(m){ pos[m.slug].y=cursorY+pos[m.slug].row*(BH+VGAP); });
      cursorY+=hRows*(BH+VGAP)+16;
    });
    var H=cursorY+16;

    var b='<defs><marker id="gah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">'
      +'<path d="M0,1 L9,5 L0,9 z" fill="var(--line)"/></marker></defs>';

    /* 레인 배경 + 이름 */
    lanes.forEach(function(ln){
      var L=laneY[ln.id]; if(!L) return;
      b+='<rect class="lanebg" x="8" y="'+(L.top-10)+'" width="'+(W0-16)+'" height="'+(L.h+4)+'" rx="8"/>';
      b+='<text class="lane" x="16" y="'+(L.top+6)+'" style="fill:'+(ln.color||'var(--muted)')+';font-weight:600">'+W.esc(ln.name)+'</text>';
    });
    /* 연도 눈금 */
    years.forEach(function(yr){
      var x=xOf(yr)+BW/2;
      b+='<line class="axis" x1="'+x+'" y1="18" x2="'+x+'" y2="'+(H-8)+'"/>';
      b+='<text class="axis-t" x="'+x+'" y="12" text-anchor="middle">'+yr+'</text>';
    });
    /* 엣지 */
    var set={}; items.forEach(function(m){set[m.slug]=1});
    items.forEach(function(m){
      m.parents.forEach(function(p){
        if(!set[p]||!pos[p]||!pos[m.slug]) return;
        var a=pos[p], c=pos[m.slug];
        var x1=a.x+BW, y1=a.y+BH/2, x2=c.x, y2=c.y+BH/2;
        if(x2<x1){ x1=a.x+BW/2; y1=a.y+(y2>y1?BH:0); }
        var mx=(x1+x2)/2;
        b+='<path class="edge" data-from="'+p+'" data-to="'+m.slug+'" marker-end="url(#gah)" d="M'+x1+','+y1+' C'+mx+','+y1+' '+mx+','+y2+' '+(x2-3)+','+y2+'"/>';
      });
    });
    /* 노드 — 분야색은 레인 배경·레이블만으로 전달한다(DESIGN-SYSTEM §7).
       성장 단계는 테두리 스타일로만 보조 신호를 준다: seed=점선, 그 외=기본 실선. */
    items.forEach(function(m){
      var p=pos[m.slug]; if(!p) return;
      var g=W.graphOf?W.graphOf(m.slug):null, stage=g&&g.stage;
      var stageCls = stage==='seed' ? ' node-seed' : (stage&&stage!=='evergreen' ? ' node-'+stage : '');
      b+='<g class="node'+stageCls+'" tabindex="0" role="button" aria-pressed="false" aria-label="'+W.esc(m.ko)+' ('+m.year+'), 선택하면 연결된 논문이 강조됩니다" data-slug="'+m.slug+'" style="cursor:pointer">'
        +'<rect x="'+p.x+'" y="'+p.y+'" width="'+BW+'" height="'+BH+'"/>'
        +'<text x="'+(p.x+10)+'" y="'+(p.y+17)+'">'+W.esc(clip(m.ko,16))+'</text>'
        +'<text class="yr" x="'+(p.x+10)+'" y="'+(p.y+31)+'">'+m.year+' · '+W.esc(clip(m.title,18))+'</text>'
        +'<title>'+W.esc(m.title)+'</title></g>';
    });
    return '<svg viewBox="0 0 '+W0+' '+H+'" width="'+W0+'" height="'+H+'" role="img" aria-label="논문 계보 그래프, 연도축 × 분야 레인">'+b+'</svg>';
  };
  function clip(s,n){ s=String(s||''); return s.length>n? s.slice(0,n-1)+'…' : s; }

  /* ----------------------------------------------------------------
   * 로컬 그래프 (논문 페이지, UX-SPEC 4.2)
   * 중심 논문 기준 부모(위) · 자식(아래) 1~2홉. 형제는 포함 안 함.
   * 2홉까지 펼쳤을 때 노드가 20개를 넘으면 1홉만 남기고 truncated=true.
   * ---------------------------------------------------------------- */
  W.localGraph = function(slug){
    var center=W.byId(slug); if(!center) return null;
    var p1 = center.parents.map(W.byId).filter(Boolean);
    var c1 = W.childrenOf(slug);
    var p1slugs=p1.map(function(m){return m.slug});
    var c1slugs=c1.map(function(m){return m.slug});

    var p2edges=[], p2set={}, p2=[];
    p1.forEach(function(p){
      p.parents.forEach(function(gp){
        if(gp===slug||p1slugs.indexOf(gp)>=0) return;
        var gm=W.byId(gp); if(!gm) return;
        p2edges.push([gp,p.slug]);
        if(!p2set[gp]){ p2set[gp]=1; p2.push(gm); }
      });
    });
    var c2edges=[], c2set={}, c2=[];
    c1.forEach(function(c){
      W.childrenOf(c.slug).forEach(function(gc){
        if(gc.slug===slug||c1slugs.indexOf(gc.slug)>=0) return;
        c2edges.push([c.slug,gc.slug]);
        if(!c2set[gc.slug]){ c2set[gc.slug]=1; c2.push(gc); }
      });
    });

    var total=1+p1.length+c1.length+p2.length+c2.length, truncated=false;
    if(total>20){ p2=[]; c2=[]; p2edges=[]; c2edges=[]; truncated=true; }

    var BW=132, BH=40, GAPX=16, ROWH=78;
    /* 한 줄에 너무 많으면 접어서 여러 줄로 — 안 그러면 SVG 폭이 3000px를 넘어
       페이지 전체에 가로 스크롤이 생긴다 (transformer는 자식이 20편) */
    var PERROW=7;
    function fold(arr){
      if(arr.length<=PERROW) return [arr];
      var out=[], n=Math.ceil(arr.length/Math.ceil(arr.length/PERROW));
      for(var i=0;i<arr.length;i+=n) out.push(arr.slice(i,i+n));
      return out;
    }
    var rows=[];
    fold(p2).forEach(function(r){rows.push(r)});
    fold(p1).forEach(function(r){rows.push(r)});
    rows.push([center]);
    fold(c1).forEach(function(r){rows.push(r)});
    fold(c2).forEach(function(r){rows.push(r)});
    rows=rows.filter(function(r){return r.length;});
    var rowY={}; var y=20;
    rows.forEach(function(r,i){ rowY[i]=y; y+=ROWH; });
    var H=y+14;
    var maxW=Math.max.apply(null, rows.map(function(r){return r.length*(BW+GAPX)-GAPX;}).concat([360]));
    var W0=maxW+40;

    var pos={};
    rows.forEach(function(r,ri){
      var w=r.length*(BW+GAPX)-GAPX, x0=(W0-w)/2;
      r.forEach(function(m,i){ pos[m.slug]={x:x0+i*(BW+GAPX), y:rowY[ri]}; });
    });

    var b='<defs><marker id="lgah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">'
      +'<path d="M0,1 L9,5 L0,9 z" fill="var(--line)"/></marker></defs>';

    function edge(a,c){
      var A=pos[a], C=pos[c]; if(!A||!C) return '';
      var x1=A.x+BW/2, y1=A.y+BH, x2=C.x+BW/2, y2=C.y;
      var my=(y1+y2)/2;
      return '<path class="edge" data-from="'+a+'" data-to="'+c+'" marker-end="url(#lgah)" d="M'+x1+','+y1+' C'+x1+','+my+' '+x2+','+my+' '+x2+','+(y2-3)+'"/>';
    }
    p1.forEach(function(p){ b+=edge(p.slug,slug); });
    c1.forEach(function(c){ b+=edge(slug,c.slug); });
    p2edges.forEach(function(e){ b+=edge(e[0],e[1]); });
    c2edges.forEach(function(e){ b+=edge(e[0],e[1]); });

    rows.forEach(function(r){
      r.forEach(function(m){
        var pp=pos[m.slug], isCenter=(m.slug===slug);
        var g=W.graphOf?W.graphOf(m.slug):null, stage=g&&g.stage;
        var stageCls = !isCenter&&stage==='seed' ? ' node-seed' : (!isCenter&&stage&&stage!=='evergreen' ? ' node-'+stage : '');
        b+='<g class="node'+(isCenter?' node-center':stageCls)+'" '
          +(isCenter?'':'tabindex="0" role="button" aria-pressed="false" ')
          +'aria-label="'+W.esc(m.ko)+' ('+m.year+')'+(isCenter?' — 현재 논문':', 선택하면 연결된 논문이 강조됩니다')+'" '
          +(isCenter?'':'data-slug="'+m.slug+'"')+' style="cursor:'+(isCenter?'default':'pointer')+'">'
          +'<rect x="'+pp.x+'" y="'+pp.y+'" width="'+BW+'" height="'+BH+'"/>'
          +'<text x="'+(pp.x+BW/2)+'" y="'+(pp.y+17)+'" text-anchor="middle">'+W.esc(clip(m.ko,15))+'</text>'
          +'<text class="yr" x="'+(pp.x+BW/2)+'" y="'+(pp.y+31)+'" text-anchor="middle">'+m.year+'</text>'
          +'<title>'+W.esc(m.title)+'</title></g>';
      });
    });

    var svg='<svg viewBox="0 0 '+W0+' '+H+'" width="'+W0+'" height="'+H+'" role="img" aria-label="'
      +W.esc(m2(center))+' 로컬 그래프, 부모는 위 · 자식은 아래">'+b+'</svg>';
    return {svg:svg, truncated:truncated};
    function m2(x){ return x.ko; }
  };
})(window.WIKI);
