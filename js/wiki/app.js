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
  function closeRes(){
    sr.classList.remove('on');
    si.setAttribute('aria-expanded','false');
    si.removeAttribute('aria-activedescendant');
  }
  function drawRes(){
    if(!lastQuery.filters.length && !lastQuery.free){ closeRes(); return; }
    var queryOnly = lastQuery.filters.length && !lastQuery.free;
    if(!cur.length){
      var hints=lastQuery.filters.map(unknownFieldHint).filter(Boolean).join('');
      sr.innerHTML='<div class="r-empty">일치하는 논문이 없습니다.'+hints+'</div>';
      sr.classList.add('on');
      si.setAttribute('aria-expanded','true');
      si.removeAttribute('aria-activedescendant');
      return;
    }
    var head = queryOnly ? '<div class="r-count">'+lastFull.length+'편 · 스크롤해서 전부 보기</div>' : '';
    sr.innerHTML=head+cur.map(function(m,i){
      var f=W.field(m.field), stage=W.stageIcon(m.slug);
      return '<div class="r'+(i===sel?' sel':'')+'" id="res-opt-'+i+'" role="option" aria-selected="'+(i===sel?'true':'false')+'" data-slug="'+m.slug+'"><b>'+W.esc(m.ko)+'</b> '+stage
        +'<span>· '+m.year+' · '+W.esc(f?f.name:'')+'</span><br><span>'+W.esc(m.title)+'</span></div>';
    }).join('');
    sr.classList.toggle('query-open', !!queryOnly);
    sr.classList.add('on');
    si.setAttribute('aria-expanded','true');
    if(sel>=0) si.setAttribute('aria-activedescendant','res-opt-'+sel);
    else si.removeAttribute('aria-activedescendant');
  }
  si.addEventListener('input',function(){ cur=search(si.value); sel=-1; drawRes(); });
  si.addEventListener('keydown',function(e){
    if(e.key==='ArrowDown'){sel=Math.min(sel+1,cur.length-1);drawRes();e.preventDefault();}
    else if(e.key==='ArrowUp'){sel=Math.max(sel-1,0);drawRes();e.preventDefault();}
    else if(e.key==='Enter'&&cur.length){ W.go('#/p/'+cur[Math.max(sel,0)].slug); si.blur(); closeRes(); si.value=''; }
    else if(e.key==='Escape'){ si.blur(); closeRes(); }
  });
  sr.addEventListener('click',function(e){
    var r=e.target.closest('.r'); if(!r) return;
    W.go('#/p/'+r.dataset.slug); closeRes(); si.value='';
  });
  document.addEventListener('click',function(e){ if(!e.target.closest('.searchbox')) closeRes(); });
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

  /* ---------- 좌측 내비게이션 트리 (UX-SPEC 2.6) ----------
     그룹(WIKI.GROUPS) → 분야 → 트랙 → 논문 4단계. 전체를 항상 DOM에
     내려보내되(<details> 네이티브 토글로 수동 펼침이 가능해야 하므로),
     펼침 상태(open)만 "현재 보고 있는 논문의 분야·트랙"에 맞춰 계산한다.
     넓은 화면에서만 보이고(css 미디어쿼리), 좁은 화면은 ☰ 토글로 연다. */
  function navTreeHTML(activeSlug, activeFieldId, lite){
    var cur = activeSlug ? W.byId(activeSlug) : null;
    var activeField = cur ? cur.field : (activeFieldId||null);
    var activeTrack = cur ? cur.track : null;
    var groups = (W.GROUPS||[]).length ? W.GROUPS
      : [{id:'all', name:'', fields:W.FIELDS.map(function(f){return f.id;})}];
    var byField={}; W.META.forEach(function(m){ (byField[m.field]=byField[m.field]||[]).push(m); });
    var stats = W.GRAPH && W.GRAPH.stats;

    /* lite 모드 — 홈 전용. 홈은 이미 책장(shelf.js)이 446편 전체를 DOM에
       한 번 그린다(A11Y-PERF 실측 4,226~4,306 노드). 여기서 같은 446편을
       분야→트랙→논문 3단 트리로 또 그리면 예산(6,000)을 넘긴다 — 그래서
       홈의 nav는 분야 21개 링크만 있는 가벼운 목록으로 그린다(그래도
       진짜 <nav> 랜드마크는 유지된다, A11Y-PERF 감사 지적 대응). */
    if(lite){
      var liteBody = groups.map(function(g){
        var fs = g.fields.map(function(id){ return W.field(id); }).filter(Boolean);
        if(!fs.length) return '';
        var itemsHtml = fs.map(function(f){
          return '<li><a class="nav-field-link" href="#/f/'+f.id+'">'+W.esc(f.name)+'</a></li>';
        }).join('');
        return '<li class="nav-group">'+(g.name?'<div class="nav-group-name">'+W.esc(g.name)+'</div>':'')
          +'<ul class="nav-fields">'+itemsHtml+'</ul></li>';
      }).join('');
      return '<nav class="nav-tree" aria-label="분야 내비게이션"><ul class="nav-groups">'+liteBody+'</ul></nav>';
    }

    function paperLi(m){
      var g=W.graphOf(m.slug), seed = g && g.stage==='seed';
      var isCur = m.slug===activeSlug;
      return '<li><a class="nav-paper'+(seed?' nav-seed':'')+(isCur?' nav-current':'')+'" href="#/p/'+m.slug+'"'
        +(isCur?' aria-current="page"':'')+'>'+(seed?'<span aria-hidden="true">🌱</span> ':'')
        +W.esc(m.ko)+' <span class="nav-yr">'+m.year+'</span></a></li>';
    }
    function trackLi(f, tr){
      var mine=(byField[f.id]||[]).filter(function(m){return m.track===tr.id;}).sort(function(a,b){return a.year-b.year;});
      if(!mine.length) return '';
      var open = f.id===activeField && tr.id===activeTrack;
      return '<li><details class="nav-track"'+(open?' open':'')+'>'
        +'<summary>'+W.esc(tr.name)+' <span class="nav-count">'+mine.length+'</span></summary>'
        +'<ul class="nav-papers">'+mine.map(paperLi).join('')+'</ul>'
        +'</details></li>';
    }
    function fieldLi(f){
      var fs = stats && stats.byField && stats.byField[f.id];
      var allSeed = fs && fs.total>0 && fs.written===0;
      var open = f.id===activeField;
      var tracksHtml = f.tracks.map(function(tr){ return trackLi(f,tr); }).join('');
      if(!tracksHtml) return '';
      return '<li><details class="nav-field'+(allSeed?' nav-field-empty':'')+'"'+(open?' open':'')+'>'
        +'<summary>'+W.esc(f.name)+(allSeed?' <span class="nav-seed-badge" title="이 분야는 아직 씨앗 단계입니다" aria-label="이 분야는 아직 씨앗 단계입니다">🌱</span>':'')+'</summary>'
        +'<ul class="nav-tracks">'+tracksHtml+'</ul>'
        +'</details></li>';
    }
    var body = groups.map(function(g){
      var fs = g.fields.map(function(id){ return W.field(id); }).filter(Boolean);
      var fieldsHtml = fs.map(fieldLi).join('');
      if(!fieldsHtml) return '';
      return '<li class="nav-group">'+(g.name?'<div class="nav-group-name">'+W.esc(g.name)+'</div>':'')
        +'<ul class="nav-fields">'+fieldsHtml+'</ul></li>';
    }).join('');
    return '<nav class="nav-tree" aria-label="분야·트랙 내비게이션"><ul class="nav-groups">'+body+'</ul></nav>';
  }
  function navToggleBtn(){
    return '<button type="button" class="nav-toggle" data-nav-toggle aria-expanded="false" aria-label="분야 내비게이션 열기">☰</button>';
  }
  function shell(navHtml, wrapClass, innerHtml){
    return '<div class="shell">'+navHtml+'<div class="'+wrapClass+'">'+innerHtml+'</div></div>';
  }
  var navScrimEl=null, mobileNavEl=null;
  function ensureScrim(){
    if(navScrimEl) return navScrimEl;
    navScrimEl=document.createElement('div');
    navScrimEl.className='nav-scrim';
    document.body.appendChild(navScrimEl);
    navScrimEl.addEventListener('click', closeMobileNav);
    return navScrimEl;
  }
  function closeMobileNav(){
    if(mobileNavEl) mobileNavEl.classList.remove('nav-open');
    if(navScrimEl) navScrimEl.classList.remove('on');
    var btn=document.querySelector('[data-nav-toggle]');
    if(btn) btn.setAttribute('aria-expanded','false');
  }
  function wireNavToggle(root){
    var nav=root.querySelector('.nav-tree');
    var btn=root.querySelector('[data-nav-toggle]');
    if(!nav||!btn){ mobileNavEl=null; return; }
    mobileNavEl=nav;
    btn.addEventListener('click',function(){
      var open=nav.classList.toggle('nav-open');
      btn.setAttribute('aria-expanded', open?'true':'false');
      ensureScrim().classList.toggle('on', open);
    });
  }
  window.addEventListener('hashchange', closeMobileNav);
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeMobileNav(); });

  /* ---------- 이어보기 (localStorage, UX-SPEC 3.1/2.5 P1) ----------
     읽기/쓰기 모두 try/catch — 시크릿 모드 등으로 localStorage 접근이
     막혀도 홈 렌더링에는 영향이 없어야 한다. 인덱스에서 사라진 slug는
     recentSlugs()에서 걸러낸다. */
  var RECENT_KEY='wiki-recent';
  function recordVisit(slug){
    try{
      var raw=localStorage.getItem(RECENT_KEY);
      var arr=raw? JSON.parse(raw) : [];
      if(!Array.isArray(arr)) arr=[];
      arr=arr.filter(function(s){ return s!==slug; });
      arr.unshift(slug);
      localStorage.setItem(RECENT_KEY, JSON.stringify(arr.slice(0,5)));
    }catch(e){ /* 저장 실패는 조용히 무시 — 이어보기 위젯이 빈 상태로 남을 뿐 */ }
  }
  function recentSlugs(){
    try{
      var raw=localStorage.getItem(RECENT_KEY);
      var arr=raw? JSON.parse(raw) : [];
      if(!Array.isArray(arr)) return [];
      return arr.filter(function(s){ return typeof s==='string' && W.byId(s); }).slice(0,5);
    }catch(e){ return []; }
  }
  function continueHtml(){
    var recents=recentSlugs();
    if(!recents.length) return '<div class="widget-empty">아직 본 논문이 없습니다</div>';
    return recents.map(function(s){
      var m=W.byId(s); if(!m) return '';
      return '<a class="widget-item" href="#/p/'+m.slug+'">'+W.esc(m.ko)+'<span class="wd">'+m.year+'</span></a>';
    }).join('');
  }

  /* ---------- 방문 전체 기록 (입문 경로 pill의 체크마크용, HOME-IA §4.3) ----------
     RECENT_KEY(최근 5편, 이어보기 위젯)와는 목적이 다르다 — 여기는 "이 논문을
     한 번이라도 열었는가"만 무기한 기억한다. 시크릿 모드 등에서 실패해도
     조용히 무시(체크마크가 안 뜰 뿐, 코스 렌더링 자체는 항상 된다). */
  var VISITED_KEY='wiki-visited-all';
  function markVisited(slug){
    try{
      var raw=localStorage.getItem(VISITED_KEY);
      var obj=raw? JSON.parse(raw) : {};
      if(!obj || typeof obj!=='object') obj={};
      obj[slug]=1;
      localStorage.setItem(VISITED_KEY, JSON.stringify(obj));
    }catch(e){ /* 무시 */ }
  }
  function isVisited(slug){
    try{
      var raw=localStorage.getItem(VISITED_KEY);
      var obj=raw? JSON.parse(raw) : null;
      return !!(obj && obj[slug]);
    }catch(e){ return false; }
  }

  /* ---------- 문서 제목 (A11Y-PERF 감사 지적: 라우트 전환 시 갱신 안 됨) ---------- */
  function setTitle(sub){
    document.title = sub ? (sub+' — AI Wiki') : 'AI Wiki — 인공지능 논문 계보';
  }

  /* ---------- KaTeX 지연 로드 (A11Y-PERF 감사 지적: 홈에서도 275KB 동기 로드됨) ----------
     홈에는 수식이 없다. index.html은 katex.min.js를 더 이상 <script>로 즉시
     내려받지 않고, 논문 페이지 진입 시에만 이 함수로 요청한다. core.js의
     W.tex()는 window.katex가 없으면 원문을 모노스페이스로 폴백하므로 로드
     전에 렌더가 일어나도 깨지지 않지만, 가능한 한 렌더 전에 로드를 끝내
     실제 수식 조판이 보이게 한다(viewPaper에서 W.load()와 병행 대기). */
  var katexPromise=null;
  function ensureKatex(){
    if(window.katex) return Promise.resolve();
    if(katexPromise) return katexPromise;
    katexPromise=new Promise(function(res){
      var s=document.createElement('script');
      s.src='vendor/katex/katex.min.js?v='+(W.V||1);
      s.onload=function(){ res(); };
      s.onerror=function(){ res(); /* 실패해도 W.tex 폴백이 있으므로 렌더는 계속 */ };
      document.head.appendChild(s);
    });
    return katexPromise;
  }

  /* ---------- 표지(cover) 지연 로드 ----------
     cover.js는 로드되자마자 content/meta.json(178KB)을 즉시 fetch한다(그 파일
     자체 설계). 홈 초기 전송 예산(500KB, A11Y-PERF.md §2.1)을 지키려면 이
     비용은 실제로 표지를 열 때(첫 shelf:select)까지 미루는 게 낫다 —
     index.html도 cover.css/cover.js를 정적으로 싣지 않는다. 로드가 끝나면
     W.loadCoverMeta()가 이미 캐시한 프라미스까지 한 번 더 기다려, 아주 이른
     타이밍에 카드를 열어도 저자 정보가 빠지지 않게 한다. */
  var coverPromise=null;
  function ensureCover(){
    if(typeof W.cover==='function' && typeof W.wireCover==='function') return W.loadCoverMeta();
    if(coverPromise) return coverPromise;
    coverPromise=new Promise(function(res){
      if(!document.querySelector('link[data-cover-css]')){
        var l=document.createElement('link');
        l.rel='stylesheet'; l.href='css/cover.css?v='+(W.V||1); l.setAttribute('data-cover-css','1');
        document.head.appendChild(l);
      }
      var s=document.createElement('script');
      s.src='js/wiki/cover.js?v='+(W.V||1);
      s.onload=function(){ res(); };
      s.onerror=function(){ res(); /* 실패해도 shelf:select 리스너가 조용히 스킵 */ };
      document.head.appendChild(s);
    }).then(function(){
      return (typeof W.loadCoverMeta==='function') ? W.loadCoverMeta() : null;
    });
    return coverPromise;
  }

  /* 방문 전체 집합(VISITED_KEY)을 한 번에 map으로 — shelf.js의 visited 옵션에 그대로 넘긴다 */
  function visitedMapAll(){
    try{
      var raw=localStorage.getItem(VISITED_KEY);
      var obj=raw? JSON.parse(raw) : null;
      return (obj && typeof obj==='object') ? obj : {};
    }catch(e){ return {}; }
  }

  /* 표지 패널(뷰포트 하단 고정) — 싱글턴. 홈을 벗어나면(hashchange) 닫는다. */
  var homeCoverPanel=null, homeCoverCtl=null;
  function ensureHomeCoverPanel(){
    if(homeCoverPanel) return homeCoverPanel;
    homeCoverPanel=document.createElement('div');
    homeCoverPanel.className='cover-panel';
    homeCoverPanel.id='homeCoverPanel';
    homeCoverPanel.hidden=true;
    homeCoverPanel.setAttribute('aria-live','polite');
    document.body.appendChild(homeCoverPanel);
    return homeCoverPanel;
  }
  window.addEventListener('hashchange', function(){ if(homeCoverCtl) homeCoverCtl.close(); });

  /* ---------- 뷰: 홈 ---------- */
  var homeFieldFilter=null;   /* null = 전체, 배열이면 그 field id만 그래프에 표시 */
  var homeGraphOpen=null;     /* null = 아직 결정 안 됨(첫 렌더에서 화면 폭 기준 결정) — 계보 그래프는 이제
                                  홈의 핵심 섹션이라 데스크톱 기본 펼침, 모바일만 기본 접힘(HOME-IA §7.2) */
  var homeGroupState=null;    /* 책장 그룹(3개) 접기 상태 — 첫 렌더에서 화면 폭 기준 결정, 이후 사용자 토글 유지 */

  /* ---------- 입문 경로 — HOME-IA §4.2, 실측 백링크·자식 수 상위권에서만 고른 7편 ---------- */
  var START_COURSE=['resnet','transformer','bert','gpt3','vit','clip','instructgpt'];
  function courseInner(){
    return START_COURSE.map(function(slug,i){
      var m=W.byId(slug); if(!m) return '';
      var done=isVisited(slug);
      return (i? '<span class="course-arrow" aria-hidden="true">→</span>' : '')
        +'<a class="course-pill'+(done?' done':'')+'" href="#/p/'+slug+'">'
        +(done? '<span class="course-check" aria-hidden="true">✓</span>' : '')
        +W.esc(m.ko)+'</a>';
    }).join('');
  }
  function coursePills(){ return '<div class="course-pills">'+courseInner()+'</div>'; }

  /* ---------- 개인화 스트립 — HOME-IA §2·§4.3·§5.2 ----------
     이어보기(재방문자)와 입문 코스(첫 방문자)는 상호 배타적. "성장 중인 노트"
     링크는 seed/sprout가 0인 지금 홈에 남은 유일한 정직한 진행 신호(브리프 §6). */
  function personalStrip(){
    var recents=recentSlugs();
    var stats=W.GRAPH&&W.GRAPH.stats;
    var growingN = stats&&stats.byStage ? (stats.byStage.growing||0) : null;
    var left = recents.length
      ? '<div class="pstrip-block"><h3>이어보기</h3>'+continueHtml()+'</div>'
      : '<div class="pstrip-block pstrip-course"><h3>여기서 시작하세요 — 입문 7편</h3>'+coursePills()+'</div>';
    var growing = growingN==null ? ''
      : (growingN>0
          ? '<a class="widget-item" href="#/growing">성장 중인 노트 '+growingN+'편 →</a>'
          : '<div class="widget-empty">성장 중인 노트 없음</div>');
    return '<div class="pstrip">'+left
      +'<div class="pstrip-block pstrip-growing"><h3>더 자라는 중</h3>'+growing+'</div>'
      +'</div>';
  }

  function viewHome(){
    setTitle(null);
    var stats=W.GRAPH&&W.GRAPH.stats;

    /* 책장 — 전체 렌더는 shelf.js(W.shelf)가 담당한다(분야별 서가 헤더 +
       책등 446개 + 숨겨진 모바일 드릴다운을 한 번에 돌려준다). 감사 실측상
       이것만으로 DOM 4,226~4,306개를 쓰므로(예산 6,000), 예전처럼 21개
       분야를 별도 텍스트 카드 그리드로 "또" 그리면 같은 정보가 중복되고
       예산을 넘는다 — LIBRARY-BRIEF §6 지시대로 중복 블록은 걷어냈다. */
    var recentsForMini=recentSlugs();
    var shelfHeader='<div class="shelf-head"><h2>책장</h2>'
      +'<p>'+W.FIELDS.length+'개 분야, '+W.META.length+'편 — 분야마다 몇 권이 어떤 시기에 꽂혀 있는지 훑어보세요. 책등을 클릭하면 표지가 뜨고, 다시 누르면 그 논문으로 이동합니다.</p>'
      +(recentsForMini.length? '<a class="course-mini" href="#/course">처음이신가요? 입문 7편 코스 보기 →</a>' : '')
      +'</div>';
    var shelfBody='<div class="stub">책장 데이터를 불러오는 중입니다…</div>';
    if(typeof W.shelf==='function'){
      try{
        shelfBody = W.shelf({
          index:W.META, fields:W.FIELDS, groups:(W.GROUPS&&W.GROUPS.length? W.GROUPS: undefined),
          graph:W.GRAPH, meta:(W.META_INFO||{}), visited:visitedMapAll()
        }) || shelfBody;
      }catch(e){ /* 책장 렌더 실패해도 홈 전체는 정상 렌더돼야 한다 */ }
    }
    var shelfHtml = shelfHeader+'<div class="shelf-wrap" id="shelfWrap">'+shelfBody+'</div>'
      +'<p class="shelf-transition">'+W.FIELDS.length+'개 분야, '+W.META.length+'편 — 어디서 왔는지 궁금하면 아래 계보 그래프로, 한 책의 표지를 보고 싶으면 위 책등을 클릭하세요.</p>';

    var activeFields=homeFieldFilter||W.FIELDS.map(function(f){return f.id});
    var lanes=W.FIELDS.filter(function(f){return activeFields.indexOf(f.id)>=0;})
      .map(function(f){return {id:f.id,name:f.name,color:f.color}});
    var items=W.META.filter(function(m){return activeFields.indexOf(m.field)>=0;});
    var chips=W.FIELDS.map(function(f){
      var on=activeFields.indexOf(f.id)>=0;
      return '<span class="chip'+(on?' on':'')+'" data-field-chip="'+f.id+'" style="'+(on?'background:'+f.color+';border-color:'+f.color:'')+'">'
        +'<span class="dot" style="background:'+f.color+'"></span>'+W.esc(f.name)+'</span>';
    }).join('');

    /* 계보 그래프 — LIBRARY-BRIEF §5 "가장 핵심", HOME-IA §2: 책장 바로
       다음, 데스크톱은 기본 펼침. 모바일(<700px)에서만 기본 접힘 +
       "계보 그래프 보기" 버튼으로 되돌린다(§7.2). 사용자가 한 번 토글하면
       그 이후엔 재렌더링에도 그 상태를 유지한다(homeGraphOpen). */
    if(homeGraphOpen===null) homeGraphOpen = (window.innerWidth>=700);
    var growingN = stats&&stats.byStage ? (stats.byStage.growing||0) : null;
    var heroP = stats
      ? ('전체 '+W.META.length+'편, '+W.FIELDS.length+'개 분야 모두 정리돼 있습니다'
         + (growingN? ', 그중 <a href="#/growing">'+growingN+'편은 아직 자라는 중</a>입니다.' : '.'))
      : ('전체 '+W.META.length+'편, '+W.FIELDS.length+'개 분야.');

    var inner='<div class="home-nav-row">'+navToggleBtn()+'</div>'
      +'<div class="hero"><h2>인공지능 논문 계보</h2>'
      +'<p>분야를 나누고, 각 분야에서 실제로 흐름을 바꾼 논문만 골라, 그 논문이 <b>무엇을 해결했고 무엇을 남겼는지</b>를 한 장씩 정리한 개인 위키입니다. '
      +heroP+' <span class="kbd">/</span> 키로 검색.</p></div>'
      +personalStrip()
      +shelfHtml
      +'<section class="lineage-main" aria-labelledby="lineageHeading">'
      +'<h2 id="lineageHeading">전체 계보도 — '+W.META.length+'편을 연도축 위에 한 장으로</h2>'
      +'<details class="graph-collapse lineage-collapse" id="homeGraph"'+(homeGraphOpen?' open':'')+'>'
      +'<summary>계보 그래프 보기</summary>'
      +'<div class="field-chips">'+chips+'</div>'
      +zoomToolbar()
      +'<div class="graph-viewport" id="gbox">'+(items.length? W.graph(items,lanes,function(m){return m.field},{}) : '<div class="stub">최소 한 분야는 선택해야 합니다.</div>')+'</div>'
      +'<div class="graph-card" id="homeGraphCard" hidden aria-live="polite"></div>'
      +'</details>'
      +'</section>';

    app.innerHTML=shell(navTreeHTML(null,null,true), 'wrap wide', inner);
    wireNavToggle(app);

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

    /* 책장 — 그룹/분야 헤더에 소개 문장을 덧붙인다(shelf.js는 이름·권수만
       그린다, LIBRARY-CONCEPT §7 "분야 한 줄 소개"는 여기서 주입). 로빙
       tabindex·키보드·타입어헤드는 W.wireShelf가 담당, 표지 카드 연결은
       shelf:select/shelf:deselect 이벤트를 받아 이 파일이 배선한다(§0
       "이동은 카드 버튼으로"만 지키면 되고 그 카드는 cover.js가 만든다). */
    var shelfWrap=document.getElementById('shelfWrap');
    if(shelfWrap){
      /* W.shelf()는 데스크톱 책장(.shelf, 446 책등)과 숨겨진 모바일 드릴다운
         (.shelf-mobile, CSS로만 전환) 을 항상 같이 돌려준다 — 폭이 바뀌어도
         JS 없이 리플로우되게 하려는 설계다. 다만 지금 화면 폭에서 절대
         보이지 않을 쪽까지 DOM에 남겨두면 홈 하나에 446편이 사실상 두 번
         존재하게 되어(A11Y-PERF 예산 6,000 초과의 가장 큰 원인) 진행 시간에
         쓸모없는 노드만 쌓인다. 렌더 직후 딱 한 번, 지금 화면에서 안 쓰는
         쪽을 제거한다.
         QA-VIEWPORT.md §3: 예전 코드는 이 판단을 독자적인
         matchMedia('(min-width:768px)')로 내렸는데, 이 판단 기준(768px)이
         css/shelf.css:236 의 `@media(max-width:767px)`(767px)와 서로 다른
         값이었다. 정수 DPR에서는 767<768이라 항상 상보적이지만, 비정수
         DPR(예: Windows 125% = DPR 1.25)에서는 두 브레이크포인트가 각자
         다른 서브픽셀 반올림을 거치면서 "둘 다 false"인 767px 데드존이
         생겨 책장이 통째로 사라졌다(실측: QA-VIEWPORT.md §3).
         근본 원인은 "값이 767이냐 768이냐"가 아니라 "두 값을 따로 유지하는
         두 개의 판정 소스가 존재한다"는 것이므로, 값을 맞추는 대신 판정
         소스를 하나로 합친다: 브레이크포인트를 JS에 다시 하드코딩하지
         않고, 실제로 브라우저가 CSS를 어떻게 적용했는지(getComputedStyle)
         를 그대로 물어본다. `.shelf-mobile`이 화면에 보이는 쪽(display가
         'none'이 아님)이면 그 반대쪽을 지운다 — CSS 쪽 media query 판정
         결과를 그대로 읽어오는 것이므로 이 판단은 CSS와 원천적으로 어긋날
         수 없다(같은 값을 두 번 계산하는 게 아니라 한 번 계산된 값을
         그대로 재사용). DOM 예산(6,000)은 그대로 유지된다 — 지우는 시점과
         "안 쓰는 쪽 하나만 남긴다"는 전략 자체는 바뀌지 않았고, 바뀐 것은
         "어느 쪽이 안 쓰는 쪽인지"를 판정하는 방법뿐이다. */
      try{
        var mobileEl = shelfWrap.querySelector('.shelf-mobile');
        var mobileVisible = !!mobileEl && getComputedStyle(mobileEl).display!=='none';
        var dead = shelfWrap.querySelector(mobileVisible ? '.shelf' : '.shelf-mobile');
        if(dead) dead.remove();
      }catch(e){ /* 실패해도 렌더는 계속 — 둘 다 남아도 기능은 정상 */ }

      var groupById={}; (W.GROUPS||[]).forEach(function(g){ groupById[g.id]=g; });
      shelfWrap.querySelectorAll('section.shelf-group[data-group]').forEach(function(sec){
        var g=groupById[sec.dataset.group];
        var h2=sec.querySelector('.shelf-group-title');
        if(g && g.desc && h2 && !sec.querySelector('.shelf-group-desc')){
          var p=document.createElement('p');
          p.className='shelf-group-desc';
          p.textContent=g.desc;
          h2.insertAdjacentElement('afterend', p);
        }
      });
      shelfWrap.querySelectorAll('.field-shelf[data-field]').forEach(function(block){
        var f=W.field(block.dataset.field);
        var header=block.querySelector('.shelf-header');
        if(f && f.blurb && header && !header.querySelector('.shelf-block-blurb')){
          var p=document.createElement('p');
          p.className='shelf-block-blurb';
          p.textContent=f.blurb;
          header.appendChild(p);
        }
      });

      if(typeof W.wireShelf==='function'){
        try{ W.wireShelf(shelfWrap); }catch(e){}
      }
      shelfWrap.addEventListener('shelf:select', function(e){
        var slug=e.detail && e.detail.slug; if(!slug) return;
        ensureCover().then(function(){
          if(typeof W.wireCover!=='function') return;
          var panel=ensureHomeCoverPanel();
          if(!homeCoverCtl) homeCoverCtl=W.wireCover(panel);
          homeCoverCtl.open(slug, e.detail.el);
        });
      });
      shelfWrap.addEventListener('shelf:deselect', function(){
        if(homeCoverCtl) homeCoverCtl.close();
      });
    }
  }

  /* ---------- 뷰: 성장 중인 노트 (HOME-IA §5.2 — "성장 중인 노트 N편" 링크의 목적지) ----------
     검색 팔레트에는 stage: 필터가 없어(core.js 소관, 이번 개편 범위 밖) 그
     문법을 그대로 재사용할 수 없다. 대신 이 전용 뷰가 같은 결과를 낸다:
     stage==='growing'인 논문만 분야 카드 그리드와 같은 모양으로 나열. */
  function viewGrowing(){
    setTitle('성장 중인 노트');
    var g=W.GRAPH;
    var items = g ? W.META.filter(function(m){ var gg=W.graphOf(m.slug); return gg&&gg.stage==='growing'; })
      .sort(function(a,b){ return a.year-b.year; }) : [];
    var list = items.length ? '<div class="grid">'+items.map(function(m){
      var f=W.field(m.field), stage=W.stageIcon(m.slug);
      return '<a class="card" href="#/p/'+m.slug+'"><div class="bar" style="background:'+f.color+'"></div>'
        +(stage?'<div class="card-stage">'+stage+'</div>':'')
        +'<div class="en">'+m.year+' · '+W.esc(f.name)+'</div><h3>'+W.esc(m.ko)+'</h3>'
        +'<p style="font-size:12.5px">'+W.esc(m.title)+'</p></a>';
    }).join('')+'</div>' : '<div class="stub">'+(g? '성장 중인 노트가 없습니다.' : '데이터를 불러오는 중입니다…')+'</div>';
    var inner='<div class="crumb"><a href="#/">전체 지도</a> › 성장 중인 노트'+navToggleBtn()+'</div>'
      +'<div class="hero"><h2>성장 중인 노트</h2>'
      +'<p>노트는 있지만 수식·숫자로 보기·딥다이브 같은 rich 섹션까지는 아직 못 채운 '+items.length+'편입니다(LIBRARY-BRIEF §6). '
      +'분야별 완성률이 아니라 이 목록이 지금 이 위키의 정직한 "자라는 중" 신호입니다.</p></div>'
      +list;
    app.innerHTML=shell(navTreeHTML(null,null,true), 'wrap wide', inner);
    wireNavToggle(app);
  }

  /* ---------- 뷰: 입문 7편 코스 (personalStrip이 재방문자에게 축소해 두는 링크의 목적지) ---------- */
  function viewCourse(){
    setTitle('입문 7편 코스');
    var inner='<div class="crumb"><a href="#/">전체 지도</a> › 입문 7편 코스'+navToggleBtn()+'</div>'
      +'<div class="hero"><h2>AI 위키 첫 걸음 — 7편</h2>'
      +'<p>이 위키 안에서 가장 많이 참조되는 논문들의 최단 이야기 경로입니다. resnet(비전의 정점) → transformer(전체 중심) → '
      +'bert·gpt3(두 갈래 분기) → vit(비전으로 건너감) → clip(합류) → instructgpt(최신 정렬) 순으로, 분기와 합류를 손으로 한 번 걸어봅니다.</p></div>'
      +'<div class="course-pills course-pills-lg">'+courseInner()+'</div>';
    app.innerHTML=shell(navTreeHTML(null,null,true), 'wrap wide', inner);
    wireNavToggle(app);
  }

  /* ---------- 뷰: 분야 ---------- */
  function viewField(id){
    var f=W.field(id); if(!f) return viewHome();
    setTitle(f.name);
    var items=W.META.filter(function(m){return m.field===id});
    var lanes=f.tracks.map(function(t){return {id:t.id,name:t.name,color:f.color}});
    var list=f.tracks.map(function(tr){
      var mine=items.filter(function(m){return m.track===tr.id}).sort(function(a,b){return a.year-b.year});
      if(!mine.length) return '';
      return '<h3 class="sec">'+W.esc(tr.name)+' <span style="color:var(--muted);font-size:12px">'+mine.length+'편</span></h3>'
        +'<div class="grid">'+mine.map(function(m){
          var stage=W.stageIcon(m.slug);
          return '<a class="card" href="#/p/'+m.slug+'"><div class="bar" style="background:'+f.color+'"></div>'
            +(stage?'<div class="card-stage">'+stage+'</div>':'')
            +'<div class="en">'+m.year+'</div><h3>'+W.esc(m.ko)+'</h3>'
            +'<p style="font-size:12.5px">'+W.esc(m.title)+'</p></a>';
        }).join('')+'</div>';
    }).join('');

    var inner='<div class="crumb"><a href="#/">전체 지도</a> › '+W.esc(f.name)+navToggleBtn()+'</div>'
      +'<div class="hero"><h2>'+W.esc(f.name)+' <span style="color:var(--muted);font-size:15px">'+W.esc(f.en)+'</span></h2>'
      +'<p>'+W.esc(f.blurb)+'</p></div>'
      +zoomToolbar()
      +'<div class="graph-viewport graph-box" id="fgbox" style="margin-top:0">'+W.graph(items,lanes,function(m){return m.track},{})+'</div>'
      +'<div class="graph-card" id="fieldGraphCard" hidden aria-live="polite"></div>'
      +list;
    app.innerHTML=shell(navTreeHTML(null, id), 'wrap wide', inner);
    wireZoom(app);
    wireNavToggle(app);
    wireGraphSelection(document.getElementById('fgbox'), document.getElementById('fieldGraphCard'));
  }

  /* ---------- 뷰: 논문 ---------- */
  function buildHead(m,f,tr,p){
    var stage=W.stageBadge(m.slug);
    /* 태그 삼종 — 분야 → 트랙 → 연도, 강도를 다르게(DESIGN-SYSTEM §5.4).
       분야만 색을 가진 칩, 트랙은 색 없는 아웃라인, 연도는 칩 자체가 없다.
       venue/authors/arxiv는 본문(p)에만 있는 정보라 로드 전에는 생략된다 —
       renderPaper가 p를 들고 다시 부를 때 자연스럽게 채워진다. */
    return '<div class="crumb"><a href="#/">전체 지도</a> › <a href="#/f/'+f.id+'">'+W.esc(f.name)+'</a> › '+W.esc(tr?tr.name:'')+navToggleBtn()+'</div>'
      +'<div class="ptitle-row"><h2 class="ptitle">'+W.esc(m.ko)+'</h2>'
      +'<button type="button" class="copy-link-btn" data-copy-slug="'+W.esc(m.slug)+'" aria-live="polite" aria-label="이 논문 링크 복사">'
      +'<span class="cl-icon" aria-hidden="true">🔗</span><span class="cl-label">링크 복사</span></button></div>'
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
    setTitle(m.ko);
    recordVisit(slug);
    markVisited(slug);
    /* 헤더(브레드크럼·제목·메타)는 인덱스 데이터만으로 즉시 그릴 수 있다.
       본문(content/papers/<slug>.js)만 lazy 로드 대상이므로 그 부분만 스켈레톤. */
    app.innerHTML=shell(navTreeHTML(slug), 'wrap', '<div>'+buildHead(m,f,tr)
      +'<div class="tldr skeleton">불러오는 중…</div></div>');
    wireNavToggle(app);
    window.scrollTo(0,0);
    Promise.all([W.load(slug), ensureKatex()]).then(function(r){ renderPaper(m,f,tr,r[0]); });
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
      return '<a class="pill" href="#/p/'+x.slug+'">'
        +(crossField?'<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:'+xf.color+';margin-right:5px"></span>':'')
        +W.esc(x.ko)+' <span style="color:var(--muted)">'+x.year+'</span></a>';
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
        return '<a class="pill" href="#/p/'+x.slug+'">'+W.esc(x.ko)+' <span style="color:var(--muted)">'+x.year+'</span></a>';
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
      app.innerHTML=shell(navTreeHTML(m.slug), 'wrap', head+guideBox(m)
        +'<h3 class="sec" style="margin-top:28px">계보상 위치</h3>'+lineageSection(m)
        +(backlinksSection(m)? '<h3 class="sec">백링크</h3>'+backlinksSection(m) : '')
        +pn);
      wireNavToggle(app);
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

    app.innerHTML=shell(navTreeHTML(m.slug), 'wrap', '<div class="paper"><div>'+head+body+secs.join('')+pn+'</div>'
      +'<aside class="side"><h4>목차</h4>'+nav.join('')+'</aside></div>');
    wireNavToggle(app);
    wireGraphSelection(document.getElementById('lgBox'), document.getElementById('lgCard'));
  }

  /* ---------- 라우팅 ---------- */
  /* 그래프 노드는 더 이상 여기서 처리하지 않는다 — 클릭은 선택(관계 강조)이고
     이동은 정보 카드의 "이동하기" 버튼(data-go)뿐이다 (GRAPH-INTERACTION.md).
     노드 자체의 클릭/키보드 처리는 wireGraphSelection()이 그래프별로 담당한다. */
  app.addEventListener('click',function(e){
    var g=e.target.closest('[data-go]'); if(g){ W.go(g.dataset.go); }
  });

  /* ---------- 링크 복사 버튼 (UX-SPEC S4 / P1) ----------
     현재 페이지가 아니라 버튼에 박힌 slug 기준으로 절대 URL을 만든다
     (버튼이 렌더된 시점의 논문을 가리켜야 하므로 location.hash를 읽지 않는다).
     navigator.clipboard 실패 시 execCommand 폴백, 그마저 실패하면
     버튼 라벨로 실패를 알린다(조용히 실패하지 않음). 2초 후 원상복구. */
  app.addEventListener('click',function(e){
    var btn=e.target.closest('[data-copy-slug]'); if(!btn) return;
    var slug=btn.dataset.copySlug;
    var url=location.origin+location.pathname+'#/p/'+slug;
    var labelEl=btn.querySelector('.cl-label');
    function setState(text, cls){
      if(labelEl) labelEl.textContent=text;
      btn.classList.remove('copy-done','copy-error');
      if(cls) btn.classList.add(cls);
      clearTimeout(btn._copyTimer);
      btn._copyTimer=setTimeout(function(){
        if(labelEl) labelEl.textContent='링크 복사';
        btn.classList.remove('copy-done','copy-error');
      },2000);
    }
    function fallbackCopy(){
      try{
        var ta=document.createElement('textarea');
        ta.value=url; ta.style.position='fixed'; ta.style.opacity='0'; ta.style.pointerEvents='none';
        document.body.appendChild(ta); ta.focus(); ta.select();
        var ok=document.execCommand && document.execCommand('copy');
        document.body.removeChild(ta);
        if(ok) setState('복사됨 ✓','copy-done');
        else setState('복사 실패 — 직접 복사하세요','copy-error');
      }catch(err){ setState('복사 실패 — 직접 복사하세요','copy-error'); }
    }
    if(navigator.clipboard && navigator.clipboard.writeText){
      /* 권한 프롬프트가 응답 없이 걸리는 환경(임베디드 브라우저 등)에서도
         버튼이 영원히 "링크 복사" 상태로 멈추지 않도록 타임아웃과 경쟁시킨다. */
      var settled=false;
      var timeout=setTimeout(function(){ if(!settled){ settled=true; fallbackCopy(); } },1200);
      navigator.clipboard.writeText(url).then(function(){
        if(settled) return; settled=true; clearTimeout(timeout);
        setState('복사됨 ✓','copy-done');
      }, function(){
        if(settled) return; settled=true; clearTimeout(timeout);
        fallbackCopy();
      });
    } else {
      fallbackCopy();
    }
  });

  /* ---------- 링크 호버 프리뷰 (UX-SPEC S4/컨셉 0장, P1) ----------
     본문 안 #/p/<slug> 위키링크에 마우스를 250ms 이상 올리면(또는 키보드
     포커스) 제목·연도·분야·tldr 카드를 띄운다. 터치 기기(hover 불가)에서는
     아예 리스너를 달지 않는다. 좌측 내비 트리는 "본문 링크"가 아니므로 제외. */
  (function(){
    var canHover=true;
    try{ canHover=window.matchMedia('(hover:hover) and (pointer:fine)').matches; }catch(e){ canHover=true; }
    if(!canHover) return;

    var PREVIEW_DELAY=250, el=null, timer=null, curSlug=null;
    function ensureEl(){
      if(el) return el;
      el=document.createElement('div');
      el.className='link-preview';
      el.setAttribute('role','tooltip');
      el.hidden=true;
      document.body.appendChild(el);
      return el;
    }
    function hide(){
      clearTimeout(timer); timer=null; curSlug=null;
      if(el) el.hidden=true;
    }
    function position(anchor){
      var box=ensureEl();
      requestAnimationFrame(function(){
        if(box.hidden) return;
        var r=anchor.getBoundingClientRect();
        var w=box.offsetWidth||280, h=box.offsetHeight||90;
        var x=r.left, y=r.bottom+6;
        if(x+w>window.innerWidth-8) x=Math.max(8, window.innerWidth-w-8);
        if(x<8) x=8;
        if(y+h>window.innerHeight-8) y=r.top-h-6;
        if(y<8) y=8;
        box.style.left=Math.round(x+window.scrollX)+'px';
        box.style.top=Math.round(y+window.scrollY)+'px';
      });
    }
    function show(slug, anchor){
      var m=W.byId(slug); if(!m){ hide(); return; }
      var f=W.field(m.field);
      var box=ensureEl();
      box.innerHTML='<div class="lp-title">'+W.esc(m.ko)+'</div>'
        +'<div class="lp-meta">'+m.year+(f?' · '+W.esc(f.name):'')+'</div>'
        +'<div class="lp-tldr">불러오는 중…</div>';
      box.hidden=false;
      position(anchor);
      W.load(slug).then(function(p){
        if(curSlug!==slug || box.hidden) return; /* 그 사이 다른 링크로 옮겨갔으면 버림 */
        var t=box.querySelector('.lp-tldr');
        if(t) t.textContent = p&&p.tldr ? String(p.tldr).slice(0,220) : '아직 정리 노트가 없습니다.';
        position(anchor);
      });
    }
    function anchorOf(target){
      var a=target.closest && target.closest('a[href^="#/p/"]');
      if(!a || a.closest('.nav-tree') || !app.contains(a)) return null;
      return a;
    }
    function schedule(a){
      var slug=a.getAttribute('href').replace('#/p/','');
      if(!W.byId(slug)) return;
      clearTimeout(timer);
      curSlug=slug;
      timer=setTimeout(function(){ show(slug, a); }, PREVIEW_DELAY);
    }
    document.addEventListener('mouseover',function(e){
      var a=anchorOf(e.target); if(!a) return;
      schedule(a);
    });
    document.addEventListener('mouseout',function(e){
      var a=anchorOf(e.target); if(!a) return;
      if(e.relatedTarget && a.contains(e.relatedTarget)) return;
      hide();
    });
    document.addEventListener('focus',function(e){
      var a=anchorOf(e.target); if(!a) return;
      schedule(a);
    },true);
    document.addEventListener('blur',function(e){
      var a=anchorOf(e.target); if(!a) return;
      hide();
    },true);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('hashchange', hide);
  })();
  app.addEventListener('keydown',function(e){
    if(e.key!=='Enter'&&e.key!==' ') return;
    var g=e.target.closest('[data-go]');
    if(g){ e.preventDefault(); W.go(g.dataset.go); }
  });
  /* .brand 는 이제 진짜 <a href="#/"> 다 — 클릭·Enter·우클릭·새 탭이 브라우저
     기본 동작으로 처리되므로 별도 핸들러가 필요 없다. */

  function route(){
    var h=location.hash.replace(/^#/,'');
    if(h.indexOf('/p/')===0) return viewPaper(h.slice(3));
    if(h.indexOf('/f/')===0) return viewField(h.slice(3));
    if(h==='/growing') return viewGrowing();
    if(h==='/course') return viewCourse();
    if(h && h[0]!=='/'){ document.getElementById(h.replace(/^#/,''))?.scrollIntoView(); return; }
    viewHome();
  }
  window.addEventListener('hashchange',route);
  /* graph.json(백링크·성장단계·태그)은 한 번만 받는 작은 정적 산출물이다.
     첫 진입 시 이걸 기다렸다가 그리면 배지·백링크가 처음부터 맞게 뜬다.
     실패해도 loadGraph()는 null로 resolve하므로 사이트는 정상 동작한다. */
  W.loadGraph().then(route);
})(window.WIKI);
