/* ===== 계보 그래프 (연도 = 가로축, 트랙/분야 = 레인) =====
   레이아웃 엔진 재작성 (권고 2·3·4, design/GRAPH-REFERENCES.md 참조).
   - W.graph(items,lanes,laneOf,opt)  : 기존 계약 그대로 — SVG 문자열 반환. 홈·분야 페이지가 사용.
   - W.graphFull(items,lanes,laneOf,opt) : 신규. 전체 화면 셸이 사용.
     opt = {zoom:'far'|'mid'|'near', collapsed:{laneId:true}, focus:slug|null}
     반환 { svg, width, height, lanes:[{id,name,top,h,count}], years:[{year,x,w,n}] }
   두 함수 모두 아래 공용 레이아웃 계산(computeLayout)을 공유한다 — 그래서 barycenter
   행 배정과 압축 연도축은 W.graph(홈·분야)에도 자동으로 적용된다(레이아웃 개선이므로
   반환 타입/DOM 클래스 계약은 바뀌지 않는다). */
(function(W){
  var BW=126, BH=40, VGAP=10, PADL=132, PADT=34;

  /* 연도축: 논문 수에 따라 칸 폭을 sqrt 스케일로 다르게 준다.
     1958~2012(10편, 2.2%)은 하나의 압축 밴드로 묶어 "가로 절반 낭비"를 없애고,
     2013년부터는 연도별 폭을 count에 따라 살짝 벌려 2021~2023 쏠림을 완화한다.
     완전 비례(폭 ∝ count)로 가면 2023(65편)이 축을 지배해 "연대 감각"이 또 깨지므로
     sqrt + clamp로 절충한다 — 최대/최소 폭 비율을 2.5배 이내로 묶어 둔다. */
  var BAND_CUTOFF=2013, BAND_STEP=34, BAND_GAP=30;
  var YEAR_MIN_W=92, YEAR_MAX_W=232, YEAR_K=17.4;
  var HUB_DEGREE=8;      /* §0.6 실측: 차수>=8 = 32편(7%) — far 줌에서 남기는 "계보의 뼈대" */
  var BARY_ITERS=4;      /* Sugiyama barycenter 반복 횟수(권고 4b) — 결정론 유지를 위해 고정 */

  function clip(s,n){ s=String(s||''); return s.length>n? s.slice(0,n-1)+'…' : s; }

  /* ----------------------------------------------------------------
   * 공용 레이아웃 계산 — pos(x,y), 레인 메타, 연도축 메타를 만든다.
   * items: META 배열, laneOf: fn(meta)->laneId, lanes: [{id,name,color}]
   * opt.collapsed: {laneId:true} — 접힌 레인은 1행 요약 스트립으로만 높이를 잡는다.
   * ---------------------------------------------------------------- */
  function computeLayout(items, lanes, laneOf, opt){
    opt=opt||{};
    var collapsed=opt.collapsed||{};
    if(!items.length) return null;

    var existSlug={}; items.forEach(function(m){ existSlug[m.slug]=1; });
    var childrenOf={};
    items.forEach(function(m){
      m.parents.forEach(function(p){ if(existSlug[p]) (childrenOf[p]=childrenOf[p]||[]).push(m.slug); });
    });
    var degree={};
    items.forEach(function(m){
      var ind=m.parents.filter(function(p){return existSlug[p];}).length;
      degree[m.slug]=ind+(childrenOf[m.slug]||[]).length;
    });
    var hubSet={};
    items.forEach(function(m){ if(degree[m.slug]>=HUB_DEGREE) hubSet[m.slug]=1; });

    /* barycenter용 무방향 인접 목록(계보 엣지만 — 언급은 그래프 자체에 없음) */
    var neighbors={};
    items.forEach(function(m){ neighbors[m.slug]=[]; });
    items.forEach(function(m){
      m.parents.forEach(function(p){
        if(!existSlug[p]) return;
        neighbors[m.slug].push(p); neighbors[p].push(m.slug);
      });
    });

    /* ---- 연도축 ---- */
    var counts={};
    items.forEach(function(m){ counts[m.year]=(counts[m.year]||0)+1; });
    var years=Object.keys(counts).map(Number).sort(function(a,b){return a-b;});
    var bandYears=years.filter(function(y){return y<BAND_CUTOFF;});
    var normYears=years.filter(function(y){return y>=BAND_CUTOFF;});

    var xStart={}, yearW={}, cursor=PADL, bandInfo=null;
    if(bandYears.length){
      var bx=cursor;
      bandYears.forEach(function(y,i){ xStart[y]=bx+i*BAND_STEP; yearW[y]=BAND_STEP; });
      var bandWidth=(bandYears.length-1)*BAND_STEP+BW+16;
      bandInfo={x:bx,w:bandWidth,years:bandYears.slice(),
        count:bandYears.reduce(function(s,y){return s+counts[y];},0)};
      cursor=bx+bandWidth+BAND_GAP;
    }
    normYears.forEach(function(y){
      var w=Math.max(YEAR_MIN_W, Math.min(YEAR_MAX_W, YEAR_MIN_W+YEAR_K*Math.sqrt(counts[y])));
      xStart[y]=cursor; yearW[y]=w; cursor+=w;
    });
    var W0=cursor+BW+40;
    function xOf(yr){ return xStart[yr]; }

    /* ---- 레인 내 행 배정: interval-packing + Sugiyama barycenter ---- */
    var laneMine={};
    lanes.forEach(function(ln){
      laneMine[ln.id]=items.filter(function(m){return laneOf(m)===ln.id;});
    });
    function packOrder(order){
      var rows=[], p={};
      order.forEach(function(m){
        var x=xOf(m.year), r=0;
        while(rows[r]!==undefined && rows[r] > x-8) r++;
        rows[r]=x+BW;
        p[m.slug]={x:x,row:r};
      });
      return {p:p, rows:rows.length};
    }
    function packAll(orderMap){
      var rowsBy={}, posBy={};
      lanes.forEach(function(ln){
        var order=orderMap[ln.id]; if(!order||!order.length) return;
        var res=packOrder(order); rowsBy[ln.id]=res.rows; posBy[ln.id]=res.p;
      });
      var top={}, cursorY=PADT;
      lanes.forEach(function(ln){
        if(!rowsBy[ln.id]) return;
        var isCollapsed=!!collapsed[ln.id];
        var h=isCollapsed?(BH+VGAP):rowsBy[ln.id]*(BH+VGAP);
        top[ln.id]=cursorY; cursorY+=h+16;
      });
      var pos={};
      lanes.forEach(function(ln){
        if(!posBy[ln.id]) return;
        var isCollapsed=!!collapsed[ln.id];
        Object.keys(posBy[ln.id]).forEach(function(s){
          pos[s]={x:posBy[ln.id][s].x, row:posBy[ln.id][s].row, lane:ln.id,
            y: top[ln.id]+(isCollapsed?0:posBy[ln.id][s].row*(BH+VGAP))};
        });
      });
      return {pos:pos, top:top, rowsBy:rowsBy, H:cursorY+16};
    }

    var orderMap={};
    lanes.forEach(function(ln){
      orderMap[ln.id]=laneMine[ln.id].slice().sort(function(a,b){
        return a.year-b.year || a.slug.localeCompare(b.slug);
      });
    });
    var state=packAll(orderMap);
    for(var it=0; it<BARY_ITERS; it++){
      lanes.forEach(function(ln){
        if(collapsed[ln.id]) return;
        var order=orderMap[ln.id]; if(!order||order.length<2) return;
        var bc={};
        order.forEach(function(m){
          var ns=neighbors[m.slug]||[], vals=[];
          ns.forEach(function(s){ if(state.pos[s]) vals.push(state.pos[s].y); });
          bc[m.slug]=vals.length? vals.reduce(function(a,b){return a+b;},0)/vals.length
                                 : (state.pos[m.slug]?state.pos[m.slug].y:0);
        });
        orderMap[ln.id]=order.slice().sort(function(a,b){
          if(a.year!==b.year) return a.year-b.year;
          var d=bc[a.slug]-bc[b.slug]; if(d) return d;
          return a.slug.localeCompare(b.slug);
        });
      });
      state=packAll(orderMap);
    }

    var laneMeta=[];
    lanes.forEach(function(ln){
      var mine=laneMine[ln.id]; if(!mine.length) return;
      var ys=mine.map(function(m){return m.year;});
      laneMeta.push({
        id:ln.id, name:ln.name, color:ln.color, top:state.top[ln.id],
        h:(collapsed[ln.id]?(BH+VGAP):state.rowsBy[ln.id]*(BH+VGAP)),
        count:mine.length, yearMin:Math.min.apply(null,ys), yearMax:Math.max.apply(null,ys),
        collapsed:!!collapsed[ln.id], yearCounts:(function(){
          var c={}; mine.forEach(function(m){ c[m.year]=(c[m.year]||0)+1; }); return c;
        })()
      });
    });

    var yearMeta=years.map(function(y){
      return {year:y, x:xStart[y], w:yearW[y], n:counts[y], compressed:y<BAND_CUTOFF};
    });

    return {W0:W0, H:state.H, pos:state.pos, laneMeta:laneMeta, years:yearMeta,
      bandInfo:bandInfo, degree:degree, hubSet:hubSet};
  }

  /* ----------------------------------------------------------------
   * SVG 렌더링 — computeLayout 결과를 문자열로 그린다.
   * zoom: null(레거시 W.graph, 클래스 없음) | 'far'|'mid'|'near'(graphFull)
   * focus: slug|null — 있으면 부모/자식 1홉을 선택 강조 클래스로 미리 표시
   *   (app.js의 wireGraphSelection과 동일한 클래스 어휘: sel-node/sel-parent/sel-child/sel-dim)
   * ---------------------------------------------------------------- */
  function renderSVG(L, items, opt){
    opt=opt||{};
    var zoom=opt.zoom||null, focus=opt.focus||null, collapsed=opt.collapsed||{};
    var pos=L.pos, laneMeta=L.laneMeta, years=L.years, W0=L.W0, H=L.H, hubSet=L.hubSet;

    var parentSlugs=[], childSlugs=[];
    if(focus){
      var fm=items.filter(function(m){return m.slug===focus;})[0];
      if(fm) parentSlugs=fm.parents.slice();
      items.forEach(function(m){ if(m.parents.indexOf(focus)>=0) childSlugs.push(m.slug); });
    }

    var b='<defs><marker id="gah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">'
      +'<path d="M0,1 L9,5 L0,9 z" fill="var(--line)"/></marker></defs>';

    /* 압축 연도 밴드 배경 — "말 없는 비선형 축"이 되지 않도록 배경을 다르게 칠하고 라벨을 명시 */
    if(L.bandInfo){
      b+='<rect class="year-band" x="'+(L.bandInfo.x-8)+'" y="18" width="'+(L.bandInfo.w+16)+'" height="'+(H-26)+'"/>';
    }

    /* 레인 배경 + 이름 (+ 접힌 레인은 요약 스트립) */
    laneMeta.forEach(function(ln){
      if(ln.collapsed){
        b+='<rect class="lanebg lanebg-collapsed" x="8" y="'+(ln.top-6)+'" width="'+(W0-16)+'" height="'+(ln.h)+'" rx="8"/>';
        b+='<text class="lane" x="16" y="'+(ln.top+14)+'" style="fill:'+(ln.color||'var(--muted)')+';font-weight:600">'+W.esc(ln.name)+'</text>';
        b+='<text class="lane-sum" x="'+(W0-16)+'" y="'+(ln.top+14)+'" text-anchor="end">'+ln.count+'편 · '+ln.yearMin+'–'+ln.yearMax+'</text>';
        /* 연도별 미니 막대 — 접힌 레인도 어느 시기에 몰려있는지 정도는 보이게 */
        var maxN=0; Object.keys(ln.yearCounts).forEach(function(y){ if(ln.yearCounts[y]>maxN) maxN=ln.yearCounts[y]; });
        years.forEach(function(yr){
          var n=ln.yearCounts[yr.year]; if(!n) return;
          var bh=Math.max(2, Math.round((n/maxN)*(ln.h-10)));
          b+='<rect class="lane-spark" x="'+(yr.x+2)+'" y="'+(ln.top+ln.h-6-bh)+'" width="6" height="'+bh+'"/>';
        });
      } else {
        b+='<rect class="lanebg" x="8" y="'+(ln.top-10)+'" width="'+(W0-16)+'" height="'+(ln.h+4)+'" rx="8"/>';
        b+='<text class="lane" x="16" y="'+(ln.top+6)+'" style="fill:'+(ln.color||'var(--muted)')+';font-weight:600">'+W.esc(ln.name)+'</text>';
      }
    });

    /* 연도 눈금 — 압축 밴드 안은 붐비므로 첫/끝 해만 라벨을 찍고 "~"로 압축을 명시 */
    years.forEach(function(yr,i){
      var x=yr.x+BW/2;
      var isBandEdge=!yr.compressed || i===0 || (years[i-1]&&!years[i-1].compressed);
      var showLabel = !yr.compressed || i===0 || i===years.length-1 ||
        (years[i-1]&&!years[i-1].compressed) || (years[i+1]&&!years[i+1].compressed);
      b+='<line class="axis" x1="'+x+'" y1="18" x2="'+x+'" y2="'+(H-8)+'"/>';
      if(showLabel){
        b+='<text class="axis-t" x="'+x+'" y="12" text-anchor="middle">'+(yr.compressed&&i===0?'~':'')+yr.year+'</text>';
      }
    });

    /* 엣지 — 진단(GRAPH-DIAGNOSIS §1.4) 실측: 10년 이상 간선 70개(8.8%) 중 63개가
       backprop·LSTM 단 둘에서 나와 화면을 대각선으로 가로지르며 다른 레인 배경 위를
       지나간다. 이 "장거리" 간선은 직선 대각선 대신 캔버스 하단 여백을 지나는
       기립 경로로 우회시켜, 교차가 중간 레인 전체가 아니라 출발/도착 x열 근처로만
       모이게 한다. 기본 불투명도도 낮춰(선택 시에만 또렷) 시각적 "빗자루"를 줄인다. */
    var bySlug={}; items.forEach(function(m){bySlug[m.slug]=m});
    var set=bySlug;
    items.forEach(function(m){
      m.parents.forEach(function(p){
        if(!set[p]||!pos[p]||!pos[m.slug]) return;
        var a=pos[p], c=pos[m.slug];
        var span=m.year-set[p].year;
        var aHidden=collapsed[a.lane], cHidden=collapsed[c.lane];
        var cls='edge'+(span>=10?' edge-long':'')
                +(focus&&c.slug===focus&&parentSlugs.indexOf(p)>=0?' sel-parent':'')
                +(focus&&p===focus&&childSlugs.indexOf(m.slug)>=0?' sel-child':'')
                +(focus&&!(c.slug===focus||p===focus)?' sel-dim':'');
        if(aHidden&&cHidden) return; /* 양끝 다 접힘 — 그릴 대상이 없음 */
        if(aHidden||cHidden){
          /* 접힌 레인 쪽은 "여기로 이어진다"는 짧은 스텁만 — 개별 곡선을 그리지 않는다 */
          var laneRow=laneMeta.filter(function(l){return l.id===(aHidden?a.lane:c.lane);})[0];
          if(!laneRow) return;
          var midY=laneRow.top+laneRow.h/2;
          if(aHidden){
            var stubX=c.x; var y2=c.y+BH/2;
            var dir = midY<y2 ? -1:1;
            b+='<path class="edge edge-stub" data-from="'+p+'" data-to="'+m.slug+'" marker-end="url(#gah)" '
              +'d="M'+stubX+','+(midY)+' L'+stubX+','+(y2+dir*10)+'"/>';
          } else {
            var stubX2=a.x+BW; var y1=a.y+BH/2;
            b+='<path class="edge edge-stub" data-from="'+p+'" data-to="'+m.slug+'" '
              +'d="M'+stubX2+','+y1+' L'+stubX2+','+(midY)+'"/>';
          }
          return;
        }
        var x1=a.x+BW, y1=a.y+BH/2, x2=c.x, y2=c.y+BH/2, d;
        if(x2<x1){ x1=a.x+BW/2; y1=a.y+(y2>y1?BH:0); var mx0=(x1+x2)/2; d='M'+x1+','+y1+' C'+mx0+','+y1+' '+mx0+','+y2+' '+(x2-3)+','+y2; }
        else if(span>=10){
          var hwy=H-14;
          d='M'+x1+','+y1+' C'+x1+','+hwy+' '+x2+','+hwy+' '+(x2-3)+','+y2;
        } else {
          var mx=(x1+x2)/2;
          d='M'+x1+','+y1+' C'+mx+','+y1+' '+mx+','+y2+' '+(x2-3)+','+y2;
        }
        b+='<path class="'+cls+'" data-from="'+p+'" data-to="'+m.slug+'" marker-end="url(#gah)" d="'+d+'"/>';
      });
    });

    /* 노드 — 분야색은 레인 배경·레이블만으로 전달한다(DESIGN-SYSTEM §7).
       성장 단계는 테두리 스타일로만 보조 신호를 준다: seed=점선, 그 외=기본 실선.
       hub(차수>=8, §0.6)는 테두리만 굵게 — 색·크기 채널은 건드리지 않는다(§5.3). */
    items.forEach(function(m){
      var p=pos[m.slug]; if(!p) return;
      if(collapsed[p.lane]) return; /* 접힌 레인은 요약 스트립이 대신한다 */
      var g=W.graphOf?W.graphOf(m.slug):null, stage=g&&g.stage;
      var stageCls = stage==='seed' ? ' node-seed' : (stage&&stage!=='evergreen' ? ' node-'+stage : '');
      var hubCls = hubSet[m.slug] ? ' hub' : '';
      var selCls='';
      if(focus){
        if(m.slug===focus) selCls=' sel-node';
        else if(parentSlugs.indexOf(m.slug)>=0) selCls=' sel-parent';
        else if(childSlugs.indexOf(m.slug)>=0) selCls=' sel-child';
        else selCls=' sel-dim';
      }
      var pressed = focus && m.slug===focus ? 'true':'false';
      b+='<g class="node'+stageCls+hubCls+selCls+'" tabindex="0" role="button" aria-pressed="'+pressed+'" aria-label="'+W.esc(m.ko)+' ('+m.year+'), 선택하면 연결된 논문이 강조됩니다" data-slug="'+m.slug+'" style="cursor:pointer">'
        +'<rect x="'+p.x+'" y="'+p.y+'" width="'+BW+'" height="'+BH+'"/>'
        +'<text x="'+(p.x+10)+'" y="'+(p.y+17)+'">'+W.esc(clip(m.ko,16))+'</text>'
        +'<text class="yr" x="'+(p.x+10)+'" y="'+(p.y+31)+'">'+m.year+'</text>'
        +'<title>'+W.esc(m.title)+'</title></g>';
    });

    var cls=zoom?(' class="z-'+zoom+'"'):'';
    return '<svg'+cls+' viewBox="0 0 '+W0+' '+H+'" width="'+W0+'" height="'+H+'" role="img" aria-label="논문 계보 그래프, 연도축 × 분야 레인">'+b+'</svg>';
  }

  /* items: META 배열, laneOf: fn(meta)->laneId, lanes: [{id,name,color}] */
  W.graph = function(items, lanes, laneOf, opt){
    opt=opt||{};
    if(!items.length) return '';
    var L=computeLayout(items, lanes, laneOf, {});
    if(!L) return '';
    return renderSVG(L, items, {});
  };

  /* 전체 화면 셸용 — 시맨틱 줌 단계 · 레인 접기 · 포커스(선택) 강조를 받아
     SVG와 함께 미니맵/레인 접기 UI가 쓸 메타데이터(lanes, years)를 돌려준다. */
  W.graphFull = function(items, lanes, laneOf, opt){
    opt=opt||{};
    if(!items.length) return {svg:'', width:0, height:0, lanes:[], years:[]};
    var collapsed=opt.collapsed||{};
    var L=computeLayout(items, lanes, laneOf, {collapsed:collapsed});
    if(!L) return {svg:'', width:0, height:0, lanes:[], years:[]};
    var svg=renderSVG(L, items, {zoom:opt.zoom||'near', collapsed:collapsed, focus:opt.focus||null});
    return {
      svg:svg, width:L.W0, height:L.H,
      lanes:L.laneMeta.map(function(ln){ return {id:ln.id, name:ln.name, top:ln.top, h:ln.h, count:ln.count}; }),
      years:L.years.map(function(y){ return {year:y.year, x:y.x, w:y.w, n:y.n}; })
    };
  };

  /* ----------------------------------------------------------------
   * 로컬 그래프 (논문 페이지, UX-SPEC 4.2)
   * 중심 논문 기준 부모(위) · 자식(아래) 1~2홉. 형제는 포함 안 함.
   * 2홉까지 펼쳤을 때 노드가 20개를 넘으면 1홉만 남기고 truncated=true.
   * ---------------------------------------------------------------- */
  /* 1홉 상한 — GRAPH-DIAGNOSIS §1.6/§3-7 버그 수정: 기존 truncation은 2홉만 버리고
     1홉(직계 자식)은 그대로 둬서, transformer(자식 48)·gpt3(46)·bert(36) 같은 허브에서
     "20개 이하로 억제"라는 원래 의도가 완전히 무력화됐다(52노드까지 그려짐).
     부모는 데이터상 최대 4개뿐이라 실제로 걸릴 일이 거의 없지만 방어적으로 같은
     함수를 쓴다. 넘치는 나머지는 "제 자식을 가장 많이 낳은(=계보상 영향이 큰) 것"
     순으로 남기고, 잘린 개수는 로컬 그래프 안에 "+N개 더" 요약 상자로 보여준다
     (전체 목록은 GRAPH-INTERACTION.md §8이 이미 truncated=true일 때 노출하는
     "전체 계보도에서 보기" 링크가 담당한다 — 여기서는 중복 UI를 만들지 않는다). */
  var HOP1_CAP=14;
  function capHop1(arr){
    if(arr.length<=HOP1_CAP) return {kept:arr, extra:0};
    var ranked=arr.slice().sort(function(a,b){
      return W.childrenOf(b.slug).length-W.childrenOf(a.slug).length || a.year-b.year || a.slug.localeCompare(b.slug);
    });
    return {kept:ranked.slice(0,HOP1_CAP), extra:arr.length-HOP1_CAP};
  }

  W.localGraph = function(slug){
    var center=W.byId(slug); if(!center) return null;
    var p1r=capHop1(center.parents.map(W.byId).filter(Boolean));
    var c1r=capHop1(W.childrenOf(slug));
    var p1=p1r.kept, c1=c1r.kept;
    var hop1Truncated = p1r.extra>0 || c1r.extra>0;
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

    var total=1+p1.length+c1.length+p2.length+c2.length, truncated=hop1Truncated;
    if(total>20){ p2=[]; c2=[]; p2edges=[]; c2edges=[]; truncated=true; }

    var BW=132, BH=40, GAPX=16, ROWH=78;
    /* 한 줄에 너무 많으면 접어서 여러 줄로 — 안 그러면 SVG 폭이 3000px를 넘어
       페이지 전체에 가로 스크롤이 생긴다 (1홉 상한(HOP1_CAP=14)을 넘는 허브는
       위에서 이미 걸러졌으므로 여기서는 최대 14개 기준으로만 접으면 된다) */
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
    if(p1r.extra>0) rows.push([{slug:'__more_p__',isMore:true,ko:'+'+p1r.extra+'개 더',year:''}]);
    rows.push([center]);
    fold(c1).forEach(function(r){rows.push(r)});
    if(c1r.extra>0) rows.push([{slug:'__more_c__',isMore:true,ko:'+'+c1r.extra+'개 더',year:''}]);
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
        var pp=pos[m.slug];
        if(m.isMore){
          b+='<g class="node node-more" aria-hidden="true">'
            +'<rect x="'+pp.x+'" y="'+pp.y+'" width="'+BW+'" height="'+BH+'" rx="7"/>'
            +'<text x="'+(pp.x+BW/2)+'" y="'+(pp.y+24)+'" text-anchor="middle">'+W.esc(m.ko)+'</text></g>';
          return;
        }
        var isCenter=(m.slug===slug);
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

  /* 테스트/실측 스크립트 전용 — 브라우저 코드 경로에는 영향 없음 */
  W._graphInternals = {computeLayout:computeLayout, renderSVG:renderSVG};
})(window.WIKI);
