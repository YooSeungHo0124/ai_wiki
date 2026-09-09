/* ===== 라우터 + 뷰 ===== */
(function(W){
  var app=document.getElementById('app');

  /* ---------- 테마 ---------- */
  var t=localStorage.getItem('wiki-theme')||'dark';
  document.documentElement.setAttribute('data-theme',t);
  document.getElementById('themeBtn').onclick=function(){
    var n=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';
    document.documentElement.setAttribute('data-theme',n);
    localStorage.setItem('wiki-theme',n);
  };

  /* ---------- 검색 / 커맨드 팔레트 필터 문법 (UX-SPEC 3.4) ----------
     field:llm  track:attn  year:2023  year:>=2023
     parents:0  children:0  children:>=3  note:no / note:yes
     자유어와 결합 가능, 전부 AND. 필터만 있고 자유어가 없으면(작업 큐 용도)
     12개 캡을 풀고 전체를 스크롤 리스트로 보여준다. */
  var si=document.getElementById('q'), sr=document.getElementById('res'), sel=-1, cur=[];
  var FILTER_KEYS=['field','track','year','parents','children','note'];

  function parseQuery(raw){
    var tokens=raw.trim().split(/\s+/).filter(Boolean);
    var filters=[], free=[];
    tokens.forEach(function(tok){
      var m=tok.match(/^([a-z]+):(.+)$/i);
      if(m && FILTER_KEYS.indexOf(m[1].toLowerCase())>=0){ filters.push({key:m[1].toLowerCase(), raw:m[2]}); }
      else free.push(tok);
    });
    return {filters:filters, free:free.join(' ').toLowerCase()};
  }
  function numOp(raw){
    var m=String(raw).match(/^(>=|<=|>|<|=)?(-?\d+)$/);
    if(!m) return null;
    return {op:m[1]||'=', val:parseInt(m[2],10)};
  }
  function cmpOp(v,o){
    switch(o.op){ case '>=':return v>=o.val; case '<=':return v<=o.val; case '>':return v>o.val; case '<':return v<o.val; default:return v===o.val; }
  }
  function matchFilter(m,ft){
    var g=W.graphOf(m.slug);
    switch(ft.key){
      case 'field': return m.field===ft.raw.toLowerCase();
      case 'track': return m.track===ft.raw.toLowerCase();
      case 'year': { var o=numOp(ft.raw); return o? cmpOp(m.year,o) : true; }
      case 'parents': { var o=numOp(ft.raw); return o? cmpOp(m.parents.length,o) : true; }
      case 'children': { var o=numOp(ft.raw); return o? cmpOp(W.childrenOf(m.slug).length,o) : true; }
      case 'note': {
        if(!g||!g.stage) return true; /* graph.json 없으면 판정 불가 — 필터를 무시(전부 통과) */
        var has = g.stage!=='seed';
        return ft.raw.toLowerCase()==='no' ? !has : has;
      }
      default: return true;
    }
  }
  function unknownFieldHint(ft){
    if(ft.key!=='field') return '';
    if(W.field(ft.raw.toLowerCase())) return '';
    return ' — 알 수 없는 분야 "'+W.esc(ft.raw)+'". 가능한 값: '+W.FIELDS.map(function(f){return f.id;}).join(', ');
  }

  var lastQuery={filters:[],free:''}, lastFull=[];
  function search(raw){
    var q=parseQuery(raw);
    lastQuery=q;
    if(!q.filters.length && !q.free) return [];
    var matched=W.META.filter(function(m){
      if(q.free && (m.slug+' '+m.title+' '+m.ko).toLowerCase().indexOf(q.free)<0) return false;
      return q.filters.every(function(ft){ return matchFilter(m,ft); });
    });
    lastFull=matched;
    /* 필터만 있고 자유어가 없으면(작업 큐) 캡 없이 전부 */
    return (q.filters.length && !q.free) ? matched : matched.slice(0,12);
  }
  function drawRes(){
    if(!lastQuery.filters.length && !lastQuery.free){ sr.classList.remove('on'); return; }
    var queryOnly = lastQuery.filters.length && !lastQuery.free;
    if(!cur.length){
      var hints=lastQuery.filters.map(unknownFieldHint).filter(Boolean).join('');
      sr.innerHTML='<div class="r-empty">일치하는 논문이 없습니다.'+hints+'</div>';
      sr.classList.add('on');
      return;
    }
    var head = queryOnly ? '<div class="r-count">'+lastFull.length+'편 · 스크롤해서 전부 보기</div>' : '';
    sr.innerHTML=head+cur.map(function(m,i){
      var f=W.field(m.field), stage=W.stageIcon(m.slug);
      return '<div class="r'+(i===sel?' sel':'')+'" data-slug="'+m.slug+'"><b>'+W.esc(m.ko)+'</b> '+stage
        +'<span>· '+m.year+' · '+W.esc(f?f.name:'')+'</span><br><span>'+W.esc(m.title)+'</span></div>';
    }).join('');
    sr.classList.toggle('query-open', !!queryOnly);
    sr.classList.add('on');
  }
  si.addEventListener('input',function(){ cur=search(si.value); sel=-1; drawRes(); });
  si.addEventListener('keydown',function(e){
    if(e.key==='ArrowDown'){sel=Math.min(sel+1,cur.length-1);drawRes();e.preventDefault();}
    else if(e.key==='ArrowUp'){sel=Math.max(sel-1,0);drawRes();e.preventDefault();}
    else if(e.key==='Enter'&&cur.length){ W.go('#/p/'+cur[Math.max(sel,0)].slug); si.blur(); sr.classList.remove('on'); si.value=''; }
    else if(e.key==='Escape'){ si.blur(); sr.classList.remove('on'); }
  });
  sr.addEventListener('click',function(e){
    var r=e.target.closest('.r'); if(!r) return;
    W.go('#/p/'+r.dataset.slug); sr.classList.remove('on'); si.value='';
  });
  document.addEventListener('click',function(e){ if(!e.target.closest('.searchbox')) sr.classList.remove('on'); });
  document.addEventListener('keydown',function(e){
    if(e.key==='/'&&document.activeElement!==si){ e.preventDefault(); si.focus(); }
  });

  /* ---------- 그래프 줌 컨트롤 (대안 A, UX-SPEC 6장) ----------
     graph.js는 svg의 width/height == viewBox 크기로 그린다. 그 두 속성만
     같이 줄이거나 늘리면 뷰포트 안에서 화면비를 유지한 채 확대/축소된다. */
  function wireZoom(root){
    var vp=root.querySelector('.graph-viewport'), svg=vp&&vp.querySelector('svg');
    if(!svg) return;
    var vb=(svg.getAttribute('viewBox')||'').split(' ').map(Number);
    if(vb.length<4) return;
    var baseW=vb[2], baseH=vb[3], scale=1;
    var pctEl=root.querySelector('.zoom-pct');
    function apply(){
      svg.setAttribute('width', Math.round(baseW*scale));
      svg.setAttribute('height', Math.round(baseH*scale));
      if(pctEl) pctEl.textContent=Math.round(scale*100)+'%';
    }
    root.querySelectorAll('[data-zoom]').forEach(function(btn){
      btn.addEventListener('click',function(){
        var a=btn.dataset.zoom;
        if(a==='in') scale=Math.min(1.6, scale*1.2);
        else if(a==='out') scale=Math.max(0.32, scale/1.2);
        else scale=1;
        apply();
      });
    });
    apply();
  }
  function zoomToolbar(){
    return '<div class="graph-toolbar"><div class="zoom-ctl">'
      +'<button data-zoom="out" aria-label="축소">−</button>'
      +'<span class="zoom-pct">100%</span>'
      +'<button data-zoom="in" aria-label="확대">+</button>'
      +'<button data-zoom="reset" aria-label="원래 크기">⟲</button>'
      +'</div><span style="color:var(--muted);font-size:12px">드래그 대신 스크롤 · 버튼으로 확대/축소 · 노드는 클릭하면 선택됩니다</span></div>';
  }

  /* ---------- 그래프 선택 (GRAPH-INTERACTION.md) ----------
     클릭 = 선택(1홉 부모/자식 강조), 이동은 정보 카드의 버튼으로만.
     svgHost: <svg>를 담은 요소. cardEl: 정보 카드가 들어갈 빈 컨테이너(형제 요소,
     노드 좌표를 따라다니지 않고 그래프 컨테이너 하단에 고정). */
  function graphCardHTML(slug){
    var m=W.byId(slug); if(!m) return '';
    var stage=W.stageBadge(slug);
    var pCount=m.parents.length, cCount=W.childrenOf(slug).length;
    return '<div class="graph-card-inner">'
      +'<button type="button" class="graph-card-close" aria-label="닫기" data-card-close>×</button>'
      +'<div class="graph-card-title">'+W.esc(m.ko)+'</div>'
      +'<div class="graph-card-meta"><span class="chip-year">'+m.year+'</span>'+stage+'</div>'
      +'<div class="graph-card-counts">부모 <b class="cnt-parent">'+pCount+'</b> · 자식 <b class="cnt-child">'+cCount+'</b></div>'
      +'<button type="button" class="graph-card-move" data-go="#/p/'+slug+'">이 논문으로 이동 →</button>'
      +'</div>';
  }
  function wireGraphSelection(svgHost, cardEl){
    var svg=svgHost&&svgHost.querySelector('svg');
    if(!svg||!cardEl) return;
    var selected=null;
    function nodesOf(){ return svg.querySelectorAll('.node[data-slug]'); }
    function edgesOf(){ return svg.querySelectorAll('.edge'); }
    function render(){
      if(!selected){
        nodesOf().forEach(function(n){ n.classList.remove('sel-node','sel-parent','sel-child','sel-dim'); n.setAttribute('aria-pressed','false'); });
        edgesOf().forEach(function(e){ e.classList.remove('sel-parent','sel-child','sel-dim'); });
        cardEl.hidden=true; cardEl.innerHTML='';
        return;
      }
      var m=W.byId(selected);
      var parentSlugs = m? m.parents.slice() : [];
      var childSlugs = W.childrenOf(selected).map(function(c){return c.slug;});
      nodesOf().forEach(function(n){
        var s=n.dataset.slug;
        n.classList.remove('sel-node','sel-parent','sel-child','sel-dim');
        n.setAttribute('aria-pressed', s===selected?'true':'false');
        if(s===selected) n.classList.add('sel-node');
        else if(parentSlugs.indexOf(s)>=0) n.classList.add('sel-parent');
        else if(childSlugs.indexOf(s)>=0) n.classList.add('sel-child');
        else n.classList.add('sel-dim');
      });
      edgesOf().forEach(function(e){
        var from=e.dataset.from, to=e.dataset.to;
        e.classList.remove('sel-parent','sel-child','sel-dim');
        if(to===selected && parentSlugs.indexOf(from)>=0) e.classList.add('sel-parent');
        else if(from===selected && childSlugs.indexOf(to)>=0) e.classList.add('sel-child');
        else e.classList.add('sel-dim');
      });
      cardEl.hidden=false;
      cardEl.innerHTML=graphCardHTML(selected);
    }
    function toggle(slug){ selected=(selected===slug)?null:slug; render(); }
    function clear(){ if(selected){ selected=null; render(); } }
    svgHost.addEventListener('click',function(e){
      var n=e.target.closest('.node[data-slug]');
      if(n){ toggle(n.dataset.slug); return; }
      if(e.target.closest('svg')) clear();
    });
    svgHost.addEventListener('keydown',function(e){
      if(e.key==='Enter'||e.key===' '){
        var n=e.target.closest('.node[data-slug]');
        if(n){ e.preventDefault(); toggle(n.dataset.slug); }
      } else if(e.key==='Escape'){
        clear();
      }
    });
    cardEl.addEventListener('click',function(e){
      if(e.target.closest('[data-card-close]')) clear();
    });
  }

  /* ---------- 뷰: 홈 ---------- */
  var homeFieldFilter=null;   /* null = 전체, 배열이면 그 field id만 그래프에 표시 */
  var homeGraphOpen=false;    /* 전체 계보도는 보조 뷰 — 기본 접힘, 한 번 펼치면 재렌더링에도 유지 */

  function widgetRow(){
    var g=W.GRAPH; if(!g) return '';
    var papers=g.papers;
    /* 최근 갱신 — graph.json의 mtime(파일 최종 수정일) 기준 상위 3편.
       mtime이 없는(미작성) 논문은 대상에서 제외한다. */
    var withMtime=Object.keys(papers).filter(function(s){return papers[s].mtime;})
      .map(function(s){ return {slug:s, mtime:papers[s].mtime}; })
      .sort(function(a,b){ return b.mtime.localeCompare(a.mtime); }).slice(0,3);
    var recentHtml = withMtime.length ? withMtime.map(function(r){
      var m=W.byId(r.slug); if(!m) return '';
      return '<a class="widget-item" href="#/p/'+m.slug+'">'+W.esc(m.ko)+'<span class="wd">'+r.mtime+'</span></a>';
    }).join('') : '<div class="widget-empty">아직 갱신 기록 없음</div>';

    /* 오늘의 씨앗 — 아직 노트가 없는 논문 중 하나를 날짜 기준으로 고정 선택
       (매번 렌덤이면 새로고침마다 바뀌어 "오늘의"라는 말이 무색해진다) */
    var seeds=Object.keys(papers).filter(function(s){ return papers[s].stage==='seed'; });
    var seedHtml;
    if(seeds.length){
      var day=new Date().toISOString().slice(0,10);
      var h=0; for(var i=0;i<day.length;i++) h=(h*31+day.charCodeAt(i))>>>0;
      var pick=seeds[h%seeds.length];
      var sm=W.byId(pick);
      seedHtml = sm ? '<a class="widget-item seed" href="#/p/'+sm.slug+'">🌱 '+W.esc(sm.ko)+'<span class="wd">정리하러 가기 ›</span></a>' : '';
    } else {
      seedHtml = '<div class="widget-empty">씨앗 없음 — 전부 정리됨 🎉</div>';
    }

    return '<div class="widget-grid">'
      +'<div class="widget"><h4>최근 갱신</h4>'+recentHtml+'</div>'
      +'<div class="widget"><h4>오늘의 씨앗</h4>'+seedHtml+'</div>'
      +'</div>';
  }

  function viewHome(){
    var byField={}; W.META.forEach(function(m){ (byField[m.field]=byField[m.field]||[]).push(m); });
    var stats=W.GRAPH&&W.GRAPH.stats;
    var cards=W.FIELDS.map(function(f){
      var n=(byField[f.id]||[]).length;
      var yrs=(byField[f.id]||[]).map(function(m){return m.year});
      var fs=stats&&stats.byField&&stats.byField[f.id];
      var completion=fs? '<div class="n">노트 '+fs.written+'/'+fs.total+'편 정리됨</div>'
          +'<div class="completion"><i style="width:'+(fs.total? Math.round(100*fs.written/fs.total):0)+'%;background:'+f.color+'"></i></div>' : '';
      return '<div class="card" tabindex="0" role="link" data-go="#/f/'+f.id+'"><div class="bar" style="background:'+f.color+'"></div>'
        +'<div class="en">'+W.esc(f.en)+'</div><h3>'+W.esc(f.name)+'</h3>'
        +'<p>'+W.esc(f.blurb)+'</p>'
        +'<div class="n">논문 '+n+'편 · '+Math.min.apply(null,yrs)+'–'+Math.max.apply(null,yrs)+' · 트랙 '+f.tracks.length+'개</div>'
        +completion+'</div>';
    }).join('');

    var activeFields=homeFieldFilter||W.FIELDS.map(function(f){return f.id});
    var lanes=W.FIELDS.filter(function(f){return activeFields.indexOf(f.id)>=0;})
      .map(function(f){return {id:f.id,name:f.name,color:f.color}});
    var items=W.META.filter(function(m){return activeFields.indexOf(m.field)>=0;});
    var chips=W.FIELDS.map(function(f){
      var on=activeFields.indexOf(f.id)>=0;
      return '<span class="chip'+(on?' on':'')+'" data-field-chip="'+f.id+'" style="'+(on?'background:'+f.color+';border-color:'+f.color:'')+'">'
        +'<span class="dot" style="background:'+f.color+'"></span>'+W.esc(f.name)+'</span>';
    }).join('');

    app.innerHTML='<div class="wrap wide">'
      +'<div class="hero"><h2>인공지능 논문 계보</h2>'
      +'<p>분야를 나누고, 각 분야에서 실제로 흐름을 바꾼 논문만 골라, 그 논문이 <b>무엇을 해결했고 무엇을 남겼는지</b>를 한 장씩 정리한 개인 위키입니다. '
      +'전체 '+W.META.length+'편 중 지금까지 '+(stats?stats.written:'?')+'편이 정리됐습니다. '
      +'<span class="kbd">/</span> 키로 검색.</p></div>'
      +widgetRow()
      +'<div class="grid">'+cards+'</div>'
      +'<details class="graph-collapse" style="margin-top:26px" id="homeGraph"'+(homeGraphOpen?' open':'')+'>'
      +'<summary>전체 계보도 — 150편을 연도축 위에 한 장으로 (보조 뷰, 펼쳐서 보기)</summary>'
      +'<div class="field-chips">'+chips+'</div>'
      +zoomToolbar()
      +'<div class="graph-viewport" id="gbox">'+(items.length? W.graph(items,lanes,function(m){return m.field},{}) : '<div class="stub">최소 한 분야는 선택해야 합니다.</div>')+'</div>'
      +'<div class="graph-card" id="homeGraphCard" hidden aria-live="polite"></div>'
      +'</details>'
      +'</div>';

    var det=document.getElementById('homeGraph');
    det.addEventListener('toggle',function(){ homeGraphOpen=det.open; });
    det.querySelectorAll('[data-field-chip]').forEach(function(chip){
      chip.setAttribute('tabindex','0'); chip.setAttribute('role','checkbox');
      chip.setAttribute('aria-checked', chip.classList.contains('on')?'true':'false');
      function toggle(){
        var id=chip.dataset.fieldChip;
        var cur=homeFieldFilter||W.FIELDS.map(function(f){return f.id});
        var idx=cur.indexOf(id);
        var next=cur.slice();
        if(idx>=0){ if(next.length<=1) return; next.splice(idx,1); } else next.push(id);
        homeFieldFilter=next;
        homeGraphOpen=true;
        viewHome();
      }
      chip.addEventListener('click',toggle);
      chip.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); toggle(); } });
    });
    if(items.length){ wireZoom(det); wireGraphSelection(document.getElementById('gbox'), document.getElementById('homeGraphCard')); }
  }

  /* ---------- 뷰: 분야 ---------- */
  function viewField(id){
    var f=W.field(id); if(!f) return viewHome();
    var items=W.META.filter(function(m){return m.field===id});
    var lanes=f.tracks.map(function(t){return {id:t.id,name:t.name,color:f.color}});
    var list=f.tracks.map(function(tr){
      var mine=items.filter(function(m){return m.track===tr.id}).sort(function(a,b){return a.year-b.year});
      if(!mine.length) return '';
      return '<h3 class="sec">'+W.esc(tr.name)+' <span style="color:var(--muted);font-size:12px">'+mine.length+'편</span></h3>'
        +'<div class="grid">'+mine.map(function(m){
          var stage=W.stageIcon(m.slug);
          return '<div class="card" tabindex="0" role="link" data-go="#/p/'+m.slug+'"><div class="bar" style="background:'+f.color+'"></div>'
            +(stage?'<div class="card-stage">'+stage+'</div>':'')
            +'<div class="en">'+m.year+'</div><h3>'+W.esc(m.ko)+'</h3>'
            +'<p style="font-size:12.5px">'+W.esc(m.title)+'</p></div>';
        }).join('')+'</div>';
    }).join('');

    app.innerHTML='<div class="wrap wide">'
      +'<div class="crumb"><a href="#/">전체 지도</a> › '+W.esc(f.name)+'</div>'
      +'<div class="hero"><h2>'+W.esc(f.name)+' <span style="color:var(--muted);font-size:15px">'+W.esc(f.en)+'</span></h2>'
      +'<p>'+W.esc(f.blurb)+'</p></div>'
      +zoomToolbar()
      +'<div class="graph-viewport graph-box" id="fgbox" style="margin-top:0">'+W.graph(items,lanes,function(m){return m.track},{})+'</div>'
      +'<div class="graph-card" id="fieldGraphCard" hidden aria-live="polite"></div>'
      +list+'</div>';
    wireZoom(app);
    wireGraphSelection(document.getElementById('fgbox'), document.getElementById('fieldGraphCard'));
  }

  /* ---------- 뷰: 논문 ---------- */
  function buildHead(m,f,tr,p){
    var stage=W.stageBadge(m.slug);
    /* 태그 삼종 — 분야 → 트랙 → 연도, 강도를 다르게(DESIGN-SYSTEM §5.4).
       분야만 색을 가진 칩, 트랙은 색 없는 아웃라인, 연도는 칩 자체가 없다.
       venue/authors/arxiv는 본문(p)에만 있는 정보라 로드 전에는 생략된다 —
       renderPaper가 p를 들고 다시 부를 때 자연스럽게 채워진다. */
    return '<div class="crumb"><a href="#/">전체 지도</a> › <a href="#/f/'+f.id+'">'+W.esc(f.name)+'</a> › '+W.esc(tr?tr.name:'')+'</div>'
      +'<h2 class="ptitle">'+W.esc(m.ko)+'</h2>'
      +'<p class="psub">'+W.esc(m.title)+'</p>'
      +'<div class="pmeta">'
      +'<span class="chip-field" style="color:'+f.color+';border-color:color-mix(in srgb,'+f.color+' 45%,transparent);background:color-mix(in srgb,'+f.color+' 12%,var(--surface))">'+W.esc(f.name)+'</span>'
      +(tr?'<span class="chip-track">'+W.esc(tr.name)+'</span>':'')
      +stage
      +(p&&p.venue?'<span class="chip-track">'+W.esc(p.venue)+'</span>':'')
      +(p&&p.authors?'<span class="chip-track">'+W.esc(p.authors)+'</span>':'')
      +(p&&p.arxiv?'<a class="chip-track" href="https://arxiv.org/abs/'+W.esc(p.arxiv)+'" target="_blank" rel="noopener">arXiv:'+W.esc(p.arxiv)+'</a>':'')
      +'<span class="chip-year">'+m.year+'</span>'
      +'</div>';
  }

  function viewPaper(slug){
    var m=W.byId(slug); if(!m) return viewHome();
    var f=W.field(m.field), tr=W.track(m.field,m.track);
    /* 헤더(브레드크럼·제목·메타)는 인덱스 데이터만으로 즉시 그릴 수 있다.
       본문(content/papers/<slug>.js)만 lazy 로드 대상이므로 그 부분만 스켈레톤. */
    app.innerHTML='<div class="wrap"><div>'+buildHead(m,f,tr)
      +'<div class="tldr skeleton">불러오는 중…</div></div></div>';
    window.scrollTo(0,0);
    W.load(slug).then(function(p){ renderPaper(m,f,tr,p); });
  }

  function sec(n,t,body){ return body? '<h3 class="sec" id="s'+n+'"><span class="num">'+n+'</span>'+t+'</h3>'+body : ''; }

  function guideBox(m){
    return '<div class="guide"><h4>🌱 이 논문의 정리 노트는 아직 없습니다</h4>'
      +'<p style="margin:0 0 4px"><code>content/papers/'+W.esc(m.slug)+'.js</code> 를 만들면 이 자리에 채워집니다.</p>'
      +'<p style="margin:0">규격: <code>AUTHORING.md</code> · 필수 섹션: tldr · context · ideas(3~5) · diagram · impact · legacy · pitfalls</p>'
      +'<div class="links"><a href="AUTHORING.md" target="_blank" rel="noopener">AUTHORING.md 보기</a>'
      +'<a href="content/papers/transformer.js" target="_blank" rel="noopener">예시: transformer.js</a></div></div>';
  }

  function lineageSection(m){
    var par=m.parents.map(W.byId).filter(Boolean), ch=W.childrenOf(m.slug);
    function pills(a){ return a.length? a.map(function(x){
      var xf=W.field(x.field), crossField=xf&&xf.id!==m.field;
      return '<span class="pill" tabindex="0" role="link" data-go="#/p/'+x.slug+'">'
        +(crossField?'<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:'+xf.color+';margin-right:5px"></span>':'')
        +W.esc(x.ko)+' <span style="color:var(--muted)">'+x.year+'</span></span>';
    }).join('') : '<span style="color:var(--muted);font-size:13px">—</span>'; }

    var lg=W.localGraph? W.localGraph(m.slug) : null;
    var lgHtml='';
    if(lg){
      lgHtml='<div class="localgraph"><h4 style="margin:0 0 6px;font-size:12px;color:var(--muted)">로컬 그래프 (부모는 위 · 자식은 아래)</h4>'
        +'<div class="lg-box" id="lgBox">'+lg.svg+'</div>'
        +'<div class="graph-card" id="lgCard" hidden aria-live="polite"></div>'
        +(lg.truncated? '<div class="note">주변 연결이 많아 1홉만 표시했습니다. 전체는 <a href="#/f/'+m.field+'">분야 그래프</a>에서.</div>':'')
        +'</div>';
    }
    return '<div class="lineage"><div><h4 style="margin:0 0 6px;font-size:12px;color:var(--muted)">이 논문이 딛고 선 것</h4>'+pills(par)+'</div>'
      +'<div><h4 style="margin:0 0 6px;font-size:12px;color:var(--muted)">이 논문 위에 선 것</h4>'+pills(ch)+'</div></div>'
      +lgHtml;
  }

  function backlinksSection(m){
    var g=W.graphOf(m.slug);
    if(!g||!g['in']||!g['in'].length) return '';
    var items=g['in'].map(W.byId).filter(Boolean);
    if(!items.length) return '';
    return '<p style="margin:0 0 8px;color:var(--muted);font-size:12.5px">이 논문의 본문에서 언급한(위키링크로 연결한) 다른 노트들 — 계보(부모/자식)와는 다른, 본문 참조 기준입니다.</p>'
      +'<div class="backlinks">'+items.map(function(x){
        return '<span class="pill" tabindex="0" role="link" data-go="#/p/'+x.slug+'">'+W.esc(x.ko)+' <span style="color:var(--muted)">'+x.year+'</span></span>';
      }).join('')+'</div>';
  }

  function togetherSection(m,prevSlug,nextSlug){
    var withScore=W.META.filter(function(x){ return x.slug!==m.slug; }).map(function(x){
      var inter=x.parents.filter(function(p){ return m.parents.indexOf(p)>=0; });
      return {m:x, score:inter.length, why:inter.length? '공통 부모 '+inter.length+'개':null};
    }).filter(function(o){ return o.score>0; }).sort(function(a,b){ return b.score-a.score || a.m.year-b.m.year; });

    var picks=withScore.slice(0,4);
    if(picks.length<4){
      var have={}; picks.forEach(function(o){ have[o.m.slug]=1; });
      have[m.slug]=1;
      W.META.filter(function(x){ return x.field===m.field&&x.track===m.track&&!have[x.slug]; })
        .sort(function(a,b){ return Math.abs(a.year-m.year)-Math.abs(b.year-m.year); })
        .forEach(function(x){ if(picks.length<4){ picks.push({m:x, why:'같은 트랙'}); have[x.slug]=1; } });
    }
    picks=picks.filter(function(o){ return o.m.slug!==prevSlug && o.m.slug!==nextSlug; });
    if(!picks.length) return '';
    return '<div class="together">'+picks.map(function(o){
      return '<a class="tcard" href="#/p/'+o.m.slug+'">'+W.esc(o.m.ko)+' <span style="color:var(--muted);font-size:12px">'+o.m.year+'</span>'
        +(o.why?'<span class="why">'+W.esc(o.why)+'</span>':'')+'</a>';
    }).join('')+'</div>';
  }

  function renderPaper(m,f,tr,p){
    var head=buildHead(m,f,tr,p);

    /* 같은 분야 앞뒤 논문 (씨앗 페이지에도 필요하므로 먼저 계산) */
    var sib=W.META.filter(function(x){return x.field===m.field}).sort(function(a,b){return a.year-b.year||a.slug.localeCompare(b.slug)});
    var i=sib.map(function(x){return x.slug}).indexOf(m.slug);
    var prev=sib[i-1], next=sib[i+1];
    var pn='<div class="pagenav"><div>'+(prev?'<a href="#/p/'+prev.slug+'">‹ '+W.esc(prev.ko)+'</a>':'')+'</div>'
      +'<div>'+(next?'<a href="#/p/'+next.slug+'">'+W.esc(next.ko)+' ›</a>':'')+'</div></div>';

    if(!p){
      /* 씨앗 페이지 — 빈 화면 금지: 계보·백링크·이전/다음 내비는 인덱스만으로 항상 그릴 수 있다 */
      app.innerHTML='<div class="wrap">'+head+guideBox(m)
        +'<h3 class="sec" style="margin-top:28px">계보상 위치</h3>'+lineageSection(m)
        +(backlinksSection(m)? '<h3 class="sec">백링크</h3>'+backlinksSection(m) : '')
        +pn+'</div>';
      wireGraphSelection(document.getElementById('lgBox'), document.getElementById('lgCard'));
      return;
    }

    var secs=[], nav=[];
    function add(t,body){ if(!body) return; var n=secs.length+1; secs.push(sec(n,t,body)); nav.push('<a href="#s'+n+'">'+t+'</a>'); }

    var body='<div class="tldr">'+W.fmt(p.tldr||'')+'</div>';
    if(p.deep) body+='<a class="deeplink" href="'+p.deep.url+'">🧭 <b>'+W.esc(p.deep.t)+'</b><br><span style="color:var(--text-dim);font-size:13.5px">'+W.esc(p.deep.d)+'</span></a>';

    add('그 전까지의 문제', p.context? '<div class="callout">'+W.fmt(p.context)+'</div>':'');
    add('핵심 아이디어', (p.ideas||[]).map(function(i){
      return '<div class="idea"><h4>'+W.esc(i.h)+'</h4>'
        + (i.lead?'<p class="lead">'+W.fmt(i.lead)+'</p>':'')
        + '<p>'+W.fmt(i.d)+'</p></div>';
    }).join(''));
    add('구조 한눈에', p.diagram? W.diagram(p.diagram):'');
    add('원문에서 가져온 그림', (p.figures||[]).length? (p.figures||[]).map(function(g){
      return '<figure class="paperfig">'
        +'<img src="content/figures/'+W.esc(m.slug)+'/'+W.esc(g.f)+'" alt="'+W.esc(g.cap||'')+'" loading="lazy">'
        +'<figcaption>'+W.fmt(g.cap||'')
        +(g.src?' <span class="src">'+W.esc(g.src)+'</span>':'')+'</figcaption></figure>';
    }).join(''):'');
    add('수식으로', (p.math||[]).map(function(x){
      /* tex 필드가 있으면 KaTeX로 조판, 없으면 기존 expr 를 그대로(하위 호환) */
      var body = x.tex ? '<div class="e tex">'+W.tex(x.tex,true)+'</div>'
                       : '<div class="e">'+W.esc(x.expr||'')+'</div>';
      return '<div class="math">'+body+'<div class="d">'+W.fmt(x.d)+'</div></div>';
    }).join(''));
    add('숫자로 보기', (p.numbers||[]).length? '<table class="nums"><tr><th>항목</th><th>값</th><th>메모</th></tr>'
      +p.numbers.map(function(n){return '<tr><td>'+W.esc(n.k)+'</td><td class="v">'+W.esc(n.v)+'</td><td style="color:var(--muted)">'+W.fmt(n.d||'')+'</td></tr>';}).join('')
      +'</table>':'');
    add('원문 인용', (p.quotes||[]).length? (p.quotes||[]).map(function(q){
      return '<blockquote class="quote">'+W.fmt(q.t)
        +(q.src?'<cite>'+W.esc(q.src)+'</cite>':'')+'</blockquote>';
    }).join(''):'');
    add('무엇이 바뀌었나', p.impact? '<div class="callout">'+W.fmt(p.impact)+'</div>':'');
    add('이후로 이어진 것', (p.legacy||[]).length? '<ul class="plain">'+p.legacy.map(function(l){return '<li>'+W.fmt(l)+'</li>'}).join('')+'</ul>':'');
    add('흔한 오해 · 함정', (p.pitfalls||[]).length? '<div class="callout warn"><ul class="plain">'+p.pitfalls.map(function(l){return '<li>'+W.fmt(l)+'</li>'}).join('')+'</ul></div>':'');
    add('계보', lineageSection(m));
    add('백링크', backlinksSection(m));
    add('함께 읽으면 좋은', togetherSection(m, prev&&prev.slug, next&&next.slug));
    add('더 읽기', (p.links||[]).length? '<ul class="plain">'+p.links.map(function(l){return '<li><a href="'+W.esc(l.u)+'" target="_blank" rel="noopener">'+W.esc(l.t)+'</a></li>'}).join('')+'</ul>':'');

    app.innerHTML='<div class="wrap"><div class="paper"><div>'+head+body+secs.join('')+pn+'</div>'
      +'<aside class="side"><h4>목차</h4>'+nav.join('')+'</aside></div></div>';
    wireGraphSelection(document.getElementById('lgBox'), document.getElementById('lgCard'));
  }

  /* ---------- 라우팅 ---------- */
  /* 그래프 노드는 더 이상 여기서 처리하지 않는다 — 클릭은 선택(관계 강조)이고
     이동은 정보 카드의 "이동하기" 버튼(data-go)뿐이다 (GRAPH-INTERACTION.md).
     노드 자체의 클릭/키보드 처리는 wireGraphSelection()이 그래프별로 담당한다. */
  app.addEventListener('click',function(e){
    var g=e.target.closest('[data-go]'); if(g){ W.go(g.dataset.go); }
  });
  app.addEventListener('keydown',function(e){
    if(e.key!=='Enter'&&e.key!==' ') return;
    var g=e.target.closest('[data-go]');
    if(g){ e.preventDefault(); W.go(g.dataset.go); }
  });
  document.querySelector('.brand').onclick=function(){ W.go('#/'); };
  document.querySelector('.brand').addEventListener('keydown',function(e){
    if(e.key==='Enter'||e.key===' '){ e.preventDefault(); W.go('#/'); }
  });

  function route(){
    var h=location.hash.replace(/^#/,'');
    if(h.indexOf('/p/')===0) return viewPaper(h.slice(3));
    if(h.indexOf('/f/')===0) return viewField(h.slice(3));
    if(h && h[0]!=='/'){ document.getElementById(h.replace(/^#/,''))?.scrollIntoView(); return; }
    viewHome();
  }
  window.addEventListener('hashchange',route);
  /* graph.json(백링크·성장단계·태그)은 한 번만 받는 작은 정적 산출물이다.
     첫 진입 시 이걸 기다렸다가 그리면 배지·백링크가 처음부터 맞게 뜬다.
     실패해도 loadGraph()는 null로 resolve하므로 사이트는 정상 동작한다. */
  W.loadGraph().then(route);
})(window.WIKI);
