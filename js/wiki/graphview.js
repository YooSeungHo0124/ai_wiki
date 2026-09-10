/* ===== 계보 그래프 전체 화면 뷰어 (GRAPH-REFERENCES.md 권고 1·5) =====
   홈/분야 인라인 그래프와 #/graph 라우트가 공통으로 쓰는 전체 화면 셸.
   레이아웃 자체(노드 배치·엣지)는 만들지 않는다 — js/wiki/graph.js의
   W.graphFull(있으면)/W.graph(폴백)이 만든 SVG를 그대로 담아 팬·줌·미니맵·
   레인 접기·검색·키보드 조작만 얹는다. 선택/카드 로직은 app.js가 이미
   GRAPH-INTERACTION.md 규약대로 구현해 둔 W._wireGraphSelection을 그대로
   재사용한다(새 선택 규칙을 만들지 않는다).

   Esc 우선순위(GRAPH-REFERENCES.md §권고1 "구현 주의" 그대로 따름):
   브라우저 네이티브 전체 화면 중에는 Esc가 전체 화면 종료에 이미 쓰이고
   있어(스크립트로 취소 불가 — 브라우저의 "탈출구" 보장 정책), 여기서는
   그 경우 Esc를 가로채지 않는다(선택이 있어도 그대로 브라우저가 전체
   화면을 끝내고, fullscreenchange를 받아 뷰어도 함께 닫는다 — 선택은
   URL에도 반영 안 하는 임시 상태이므로 뷰어가 닫히며 함께 사라지는 것이
   자연스럽다, GRAPH-INTERACTION §9). 반대로 폴백 오버레이(position:fixed)
   에서는 Esc를 온전히 우리가 처리하므로 문서가 요구한 우선순위를 그대로
   지킨다: 선택이 있으면 선택 해제만, 없으면 뷰어를 닫는다. 카드의 × 버튼과
   배경 클릭은 두 모드 모두에서 항상 동작하는 확실한 대체 수단이다. */
(function(W){
  var active=null;

  function reduceMotion(){
    try{ return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; }
  }
  function degreeOf(slug){
    var m=W.byId(slug); if(!m) return 0;
    var kids = (typeof W.childrenOf==='function') ? W.childrenOf(slug).length : 0;
    return (m.parents?m.parents.length:0) + kids;
  }
  function fsEl(){ return document.fullscreenElement || document.webkitFullscreenElement || null; }
  function requestFs(el){
    var fn = el.requestFullscreen || el.webkitRequestFullscreen;
    if(!fn) return Promise.reject(new Error('unsupported'));
    try{ var r=fn.call(el); return r&&r.then? r : Promise.resolve(); }catch(e){ return Promise.reject(e); }
  }
  function exitFs(){
    var fn = document.exitFullscreen || document.webkitExitFullscreen;
    if(!fn) return Promise.resolve();
    try{ var r=fn.call(document); return r&&r.then? r : Promise.resolve(); }catch(e){ return Promise.resolve(); }
  }

  /* items/lanes와 무관하게 항상 같은 방식으로 그래프 마크업을 얻는다 —
     레이아웃 담당의 W.graphFull(items,lanes,laneOf,opt)이 있으면 그걸 쓰고
     (opt.zoom/collapsed/focus를 그대로 전달해 시맨틱 줌·레인 접기를 맡긴다),
     없으면 기존 W.graph(items,lanes,laneOf,{})로 폴백한다. 폴백일 때는
     레이아웃이 줌/접기를 모르므로 이 파일이 CSS+속성 조작으로 근사한다
     (아래 applyLegacyZoom, hideLegacyCollapsed 참조). */
  function buildMarkup(items, lanes, laneOf, opt){
    if(typeof W.graphFull==='function'){
      try{
        var r=W.graphFull(items, lanes, laneOf, opt);
        if(r && typeof r.svg==='string') return {svg:r.svg, width:r.width||null, height:r.height||null, lanes:r.lanes||null, years:r.years||null, legacy:false};
      }catch(e){ /* 레이아웃 쪽 에러여도 뷰어 자체는 폴백으로 계속 동작해야 한다 */ }
    }
    var out = W.graph(items, lanes, laneOf, {});
    var svg = typeof out==='string' ? out : (out&&out.svg)||'';
    return {svg:svg, width:null, height:null, lanes:null, years:null, legacy:true};
  }

  function markHubs(canvasEl, items){
    var bySlug={}; items.forEach(function(m){ bySlug[m.slug]=m; });
    canvasEl.querySelectorAll('.node[data-slug]').forEach(function(n){
      var s=n.dataset.slug;
      if(bySlug[s] && degreeOf(s)>=8) n.classList.add('hub'); else n.classList.remove('hub');
    });
  }

  function applyLegacyZoom(canvasEl, level){
    var svg=canvasEl.querySelector('svg'); if(!svg) return;
    var vb=(svg.getAttribute('viewBox')||'').split(' ').map(Number);
    if(vb.length<4) return;
    var scale = level==='far' ? 0.30 : level==='near' ? 1.4 : 0.75;
    svg.setAttribute('width', Math.round(vb[2]*scale));
    svg.setAttribute('height', Math.round(vb[3]*scale));
  }

  function esc(s){ return W.esc ? W.esc(s) : String(s==null?'':s); }

  W.openGraphFull = function(opts){
    opts = opts || {};
    if(active){ active.close(); }
    if(!opts.items || !opts.items.length || !opts.lanes || typeof opts.laneOf!=='function') return null;

    var items=opts.items, lanes=opts.lanes, laneOf=opts.laneOf;
    var title=opts.title || '전체 계보 그래프';
    var onClose = typeof opts.onClose==='function' ? opts.onClose : function(){};
    var lastFocusEl = document.activeElement;

    var zoomLevel = 'mid';
    var collapsed = {};     /* laneId -> true (W.graphFull이 있을 때만 실제 레이아웃에 반영) */
    var hiddenLanes = {};   /* laneId -> true (완전히 숨김 — 폴백에서 "접기"의 대체 수단으로도 씀) */
    var isNative=false, closed=false, ctl=null;

    var root=document.createElement('div');
    root.className='gfv-root';
    root.setAttribute('role','dialog');
    root.setAttribute('aria-modal','true');
    root.setAttribute('aria-label', title+' — 전체 화면 보기');
    root.innerHTML =
      '<div class="gfv-topbar">'
        +'<button type="button" class="gfv-close" data-gfv-close>✕ <span>닫기</span></button>'
        +'<div class="gfv-title">'+esc(title)+'</div>'
        +'<div class="gfv-search-wrap">'
          +'<input type="text" id="gfvSearch" class="gfv-search" placeholder="논문 검색 ( / )" autocomplete="off" aria-label="그래프에서 논문 찾기" role="combobox" aria-expanded="false" aria-controls="gfvSearchRes">'
          +'<div class="gfv-search-res" id="gfvSearchRes" role="listbox" hidden></div>'
        +'</div>'
        +'<div class="gfv-zoom-ctl" role="group" aria-label="확대/축소">'
          +'<button type="button" data-gfv-zoom="out" aria-label="축소">−</button>'
          +'<span class="gfv-zoom-label" id="gfvZoomLabel">기본</span>'
          +'<button type="button" data-gfv-zoom="in" aria-label="확대">+</button>'
          +'<button type="button" data-gfv-zoom="reset" aria-label="원래 배율(0)">⟲</button>'
        +'</div>'
        +'<button type="button" class="gfv-toggle-btn" data-gfv-list-toggle aria-pressed="false">목록으로 보기</button>'
        +'<button type="button" class="gfv-toggle-btn" data-gfv-help aria-pressed="false">⌨ 도움말 (?)</button>'
      +'</div>'
      +'<div class="gfv-chips" id="gfvChips"></div>'
      +'<div class="gfv-body">'
        +'<aside class="gfv-lanes" id="gfvLanes" aria-label="분야·레인 접기·숨기기"></aside>'
        +'<div class="gfv-scrollwrap">'
          +'<div class="gfv-scroll" id="gfvScroll" tabindex="0" aria-label="그래프 캔버스 — 방향키로 이동, +/-로 확대/축소, Tab으로 논문 이동">'
            +'<div class="gfv-canvas z-mid" id="gfvCanvas"></div>'
          +'</div>'
          +'<div class="gfv-minimap" id="gfvMinimap" aria-hidden="true"></div>'
        +'</div>'
      +'</div>'
      +'<div class="gfv-list" id="gfvList" hidden></div>'
      +'<div class="graph-card gfv-card" id="gfvCard" hidden aria-live="polite"></div>'
      +'<div class="gfv-help-panel" id="gfvHelpPanel" hidden>'
        +'<h3>키보드 단축키</h3>'
        +'<ul>'
          +'<li><kbd>Tab</kbd> / <kbd>Shift+Tab</kbd> — 다음/이전 논문으로 이동</li>'
          +'<li><kbd>Enter</kbd> / <kbd>Space</kbd> — 포커스된 논문 선택(연결 강조)</li>'
          +'<li><kbd>Esc</kbd> — 선택 해제(선택이 없으면 뷰어 닫기)</li>'
          +'<li>방향키 — 뷰어(캔버스)에 포커스 있을 때 화면 이동</li>'
          +'<li><kbd>+</kbd> / <kbd>-</kbd> / <kbd>0</kbd> — 확대 / 축소 / 기본 배율</li>'
          +'<li><kbd>/</kbd> — 논문 검색창 포커스</li>'
          +'<li><kbd>?</kbd> — 이 도움말 열고 닫기</li>'
        +'</ul>'
        +'<button type="button" class="gfv-toggle-btn" data-gfv-help-close>닫기</button>'
      +'</div>'
      +'<div class="gfv-sr-only" aria-live="polite" id="gfvLive"></div>';

    document.body.appendChild(root);

    var scrollEl=root.querySelector('#gfvScroll');
    var canvasEl=root.querySelector('#gfvCanvas');
    var cardEl=root.querySelector('#gfvCard');
    var chipsEl=root.querySelector('#gfvChips');
    var lanesEl=root.querySelector('#gfvLanes');
    var mmEl=root.querySelector('#gfvMinimap');
    var listEl=root.querySelector('#gfvList');
    var zoomLabelEl=root.querySelector('#gfvZoomLabel');
    var liveEl=root.querySelector('#gfvLive');
    var helpPanel=root.querySelector('#gfvHelpPanel');
    var searchInput=root.querySelector('#gfvSearch');
    var searchRes=root.querySelector('#gfvSearchRes');

    /* ---------- 렌더 ---------- */
    function isLegacy(){ return typeof W.graphFull!=='function'; }
    function visibleItems(){ return items.filter(function(m){ return !hiddenLanes[laneOf(m)]; }); }

    function applyZoom(preserveFocus){
      var focusSlug = preserveFocus!==false ? (ctl && ctl.get()) : null;
      var vis=visibleItems();
      var opt={ zoom:zoomLevel, collapsed:collapsed, focus:focusSlug||null };
      var result = buildMarkup(vis, lanes, laneOf, opt);
      canvasEl.innerHTML = result.svg || '<div class="stub">표시할 논문이 없습니다 — 레인 필터를 확인하세요.</div>';
      canvasEl.className = 'gfv-canvas z-'+zoomLevel + (result.legacy?' gfv-legacy-zoom':'');
      markHubs(canvasEl, vis);
      if(result.legacy) applyLegacyZoom(canvasEl, zoomLevel);
      ctl = W._wireGraphSelection(canvasEl, cardEl);
      if(ctl && focusSlug) ctl.select(focusSlug);
      zoomLabelEl.textContent = zoomLevel==='far'?'조망':zoomLevel==='near'?'정독':'기본';
      liveEl.textContent = zoomLevel==='far' ? '조망 보기 · 라벨은 주요 논문만 표시됩니다'
        : zoomLevel==='near' ? '정독 보기 · 모든 라벨이 표시됩니다' : '기본 보기';
      buildMinimap(vis, result);
      updateMinimapViewportRect();
    }

    function setZoom(level){
      if(['far','mid','near'].indexOf(level)<0) return;
      if(level===zoomLevel) return;
      zoomLevel=level;
      applyZoom();
    }
    function stepZoom(dir){
      var order=['far','mid','near'];
      var i=order.indexOf(zoomLevel);
      var next=order[Math.max(0, Math.min(order.length-1, i+dir))];
      setZoom(next);
    }

    /* ---------- 분야 칩 + 레인 패널 ---------- */
    function renderChipsAndLanes(){
      chipsEl.innerHTML = lanes.map(function(ln){
        var on=!hiddenLanes[ln.id];
        return '<span class="chip'+(on?' on':'')+'" data-gfv-chip="'+ln.id+'" role="checkbox" tabindex="0" aria-checked="'+on+'" '
          +'style="'+(on?'background:'+(ln.color||'var(--muted)')+';border-color:'+(ln.color||'var(--muted)'):'')+'">'
          +'<span class="dot" style="background:'+(ln.color||'var(--muted)')+'"></span>'+esc(ln.name)+'</span>';
      }).join('');
      lanesEl.innerHTML = '<div class="gfv-lanes-title">레인</div>' + lanes.map(function(ln){
        var isCollapsed=!!collapsed[ln.id], isHidden=!!hiddenLanes[ln.id];
        return '<div class="gfv-lane-row'+(isHidden?' is-hidden':'')+'">'
          +'<span class="gfv-lane-dot" style="background:'+(ln.color||'var(--muted)')+'"></span>'
          +'<span class="gfv-lane-name">'+esc(ln.name)+'</span>'
          +'<button type="button" data-lane-collapse="'+ln.id+'" aria-pressed="'+isCollapsed+'" aria-expanded="'+(!isCollapsed)+'" '
            +(isLegacy()?'title="레이아웃 업데이트 후 지원 — 지금은 숨기기로 대체됩니다"':'title="레인 접기/펼치기"')+'>'+(isCollapsed?'▸ 펼치기':'▾ 접기')+'</button>'
          +'</div>';
      }).join('');
    }
    function toggleHideLane(id){
      var visCount = lanes.filter(function(l){ return !hiddenLanes[l.id]; }).length;
      if(!hiddenLanes[id] && visCount<=1) return; /* 최소 한 레인은 남긴다 */
      hiddenLanes[id]=!hiddenLanes[id];
      if(ctl) ctl.clear();
      renderChipsAndLanes();
      applyZoom(false);
    }
    function toggleCollapseLane(id){
      if(isLegacy()){ toggleHideLane(id); return; } /* W.graphFull 없으면 접기는 숨기기로 대체(문서화된 폴백) */
      collapsed[id]=!collapsed[id];
      if(ctl) ctl.clear();
      renderChipsAndLanes();
      applyZoom(false);
    }
    chipsEl.addEventListener('click', function(e){
      var c=e.target.closest('[data-gfv-chip]'); if(c) toggleHideLane(c.dataset.gfvChip);
    });
    chipsEl.addEventListener('keydown', function(e){
      if(e.key!=='Enter'&&e.key!==' ') return;
      var c=e.target.closest('[data-gfv-chip]'); if(!c) return;
      e.preventDefault(); toggleHideLane(c.dataset.gfvChip);
    });
    lanesEl.addEventListener('click', function(e){
      var b=e.target.closest('[data-lane-collapse]'); if(b) toggleCollapseLane(b.dataset.laneCollapse);
    });

    /* ---------- 미니맵 (권고 5 — 전체 화면에서만, 레인 띠 + 허브 점만) ---------- */
    function buildMinimap(vis, result){
      var svg=canvasEl.querySelector('svg');
      if(!svg){ mmEl.innerHTML=''; mmEl.hidden=true; return; }
      var vb=(svg.getAttribute('viewBox')||'').split(' ').map(Number);
      if(vb.length<4){ mmEl.innerHTML=''; mmEl.hidden=true; return; }
      var totalW=vb[2], totalH=vb[3];
      mmEl.hidden=false;
      mmEl.dataset.totalW=totalW; mmEl.dataset.totalH=totalH;

      var laneBands='';
      var bgEls=svg.querySelectorAll('.lanebg'), nameEls=svg.querySelectorAll('.lane');
      for(var i=0;i<bgEls.length;i++){
        var r=bgEls[i], nm=nameEls[i]? nameEls[i].textContent : '';
        var ln=null;
        for(var j=0;j<lanes.length;j++){ if(lanes[j].name===nm){ ln=lanes[j]; break; } }
        laneBands += '<rect x="'+r.getAttribute('x')+'" y="'+r.getAttribute('y')+'" width="'+r.getAttribute('width')+'" height="'+r.getAttribute('height')+'" '
          +'fill="'+(ln&&ln.color?ln.color:'var(--graph-lane-bg)')+'" opacity="0.4"/>';
      }
      var hubDots='';
      svg.querySelectorAll('.node[data-slug]').forEach(function(n){
        var slug=n.dataset.slug;
        if(degreeOf(slug)<8) return;
        var rect=n.querySelector('rect'); if(!rect) return;
        var cx=parseFloat(rect.getAttribute('x'))+parseFloat(rect.getAttribute('width'))/2;
        var cy=parseFloat(rect.getAttribute('y'))+parseFloat(rect.getAttribute('height'))/2;
        hubDots += '<circle cx="'+cx+'" cy="'+cy+'" r="'+Math.max(3,totalH*0.006)+'" class="gfv-mm-hub" data-slug="'+slug+'"></circle>';
      });
      mmEl.innerHTML = '<svg viewBox="0 0 '+totalW+' '+totalH+'" width="260" height="200" preserveAspectRatio="xMidYMid meet" role="presentation">'
        + laneBands + hubDots
        + '<rect id="gfvMmViewport" class="gfv-mm-viewport" x="0" y="0" width="1" height="1"></rect>'
        + '</svg>';
    }
    function updateMinimapViewportRect(){
      var mmSvg=mmEl.querySelector('svg'); var vpRect=mmEl.querySelector('#gfvMmViewport');
      var mainSvg=canvasEl.querySelector('svg');
      if(!mmSvg||!vpRect||!mainSvg) return;
      var totalW=parseFloat(mmEl.dataset.totalW||0), totalH=parseFloat(mmEl.dataset.totalH||0);
      if(!totalW||!totalH) return;
      var renderedW = mainSvg.width && mainSvg.width.baseVal ? mainSvg.width.baseVal.value : mainSvg.getBoundingClientRect().width;
      var renderedH = mainSvg.height && mainSvg.height.baseVal ? mainSvg.height.baseVal.value : mainSvg.getBoundingClientRect().height;
      if(!renderedW||!renderedH) return;
      var uX=totalW/renderedW, uY=totalH/renderedH;
      vpRect.setAttribute('x', Math.max(0, scrollEl.scrollLeft*uX));
      vpRect.setAttribute('y', Math.max(0, scrollEl.scrollTop*uY));
      vpRect.setAttribute('width', Math.min(totalW, scrollEl.clientWidth*uX));
      vpRect.setAttribute('height', Math.min(totalH, scrollEl.clientHeight*uY));
    }
    var mmDragging=false;
    function mmNavigate(e){
      var mmSvg=mmEl.querySelector('svg'); var mainSvg=canvasEl.querySelector('svg');
      if(!mmSvg||!mainSvg||!mmSvg.createSVGPoint) return;
      var pt=mmSvg.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY;
      var ctm=mmSvg.getScreenCTM(); if(!ctm) return;
      var loc=pt.matrixTransform(ctm.inverse());
      var totalW=parseFloat(mmEl.dataset.totalW||0), totalH=parseFloat(mmEl.dataset.totalH||0);
      var renderedW = mainSvg.width && mainSvg.width.baseVal ? mainSvg.width.baseVal.value : mainSvg.getBoundingClientRect().width;
      var renderedH = mainSvg.height && mainSvg.height.baseVal ? mainSvg.height.baseVal.value : mainSvg.getBoundingClientRect().height;
      if(!totalW||!totalH) return;
      var px = loc.x/totalW*renderedW, py=loc.y/totalH*renderedH;
      scrollEl.scrollLeft = px - scrollEl.clientWidth/2;
      scrollEl.scrollTop = py - scrollEl.clientHeight/2;
    }
    mmEl.addEventListener('pointerdown', function(e){ mmDragging=true; mmNavigate(e); try{mmEl.setPointerCapture(e.pointerId);}catch(err){} });
    mmEl.addEventListener('pointermove', function(e){ if(mmDragging) mmNavigate(e); });
    mmEl.addEventListener('pointerup', function(){ mmDragging=false; });
    mmEl.addEventListener('pointercancel', function(){ mmDragging=false; });

    /* ---------- 팬 · 줌 (휠/드래그/핀치) ---------- */
    scrollEl.addEventListener('scroll', function(){
      requestAnimationFrame(updateMinimapViewportRect);
    });
    scrollEl.addEventListener('wheel', function(e){
      if(e.ctrlKey){ e.preventDefault(); stepZoom(e.deltaY>0?-1:1); }
    }, {passive:false});

    var dragging=false, dragX=0, dragY=0, startL=0, startT=0;
    scrollEl.addEventListener('pointerdown', function(e){
      if(e.pointerType==='touch') return; /* 터치는 브라우저 기본 스크롤 + 아래 핀치 핸들러로 처리 */
      if(e.target.closest('.node')) return; /* 노드 클릭은 선택 — 팬과 경쟁하지 않는다 */
      dragging=true; dragX=e.clientX; dragY=e.clientY; startL=scrollEl.scrollLeft; startT=scrollEl.scrollTop;
      scrollEl.classList.add('gfv-dragging');
      try{ scrollEl.setPointerCapture(e.pointerId); }catch(err){}
    });
    scrollEl.addEventListener('pointermove', function(e){
      if(!dragging) return;
      scrollEl.scrollLeft = startL - (e.clientX-dragX);
      scrollEl.scrollTop = startT - (e.clientY-dragY);
    });
    function endDrag(){ dragging=false; scrollEl.classList.remove('gfv-dragging'); }
    scrollEl.addEventListener('pointerup', endDrag);
    scrollEl.addEventListener('pointercancel', endDrag);

    var pinchDist=null;
    function touchDist(t){ var dx=t[0].clientX-t[1].clientX, dy=t[0].clientY-t[1].clientY; return Math.sqrt(dx*dx+dy*dy); }
    scrollEl.addEventListener('touchstart', function(e){ if(e.touches.length===2) pinchDist=touchDist(e.touches); }, {passive:true});
    scrollEl.addEventListener('touchmove', function(e){
      if(e.touches.length===2 && pinchDist!=null){
        var d=touchDist(e.touches);
        if(Math.abs(d-pinchDist)>44){ stepZoom(d>pinchDist?1:-1); pinchDist=d; }
      }
    }, {passive:true});
    scrollEl.addEventListener('touchend', function(e){ if(e.touches.length<2) pinchDist=null; });

    root.querySelectorAll('[data-gfv-zoom]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var a=btn.dataset.gfvZoom;
        if(a==='in') stepZoom(1); else if(a==='out') stepZoom(-1); else setZoom('mid');
      });
    });

    /* ---------- 검색 ---------- */
    function runSearch(q){
      q=q.trim().toLowerCase();
      if(!q){ searchRes.hidden=true; searchRes.innerHTML=''; searchInput.setAttribute('aria-expanded','false'); return; }
      var hits=items.filter(function(m){ return (m.ko+' '+m.title+' '+m.slug).toLowerCase().indexOf(q)>=0; }).slice(0,8);
      if(!hits.length){ searchRes.innerHTML='<div class="r-empty">일치하는 논문이 없습니다.</div>'; searchRes.hidden=false; searchInput.setAttribute('aria-expanded','true'); return; }
      searchRes.innerHTML=hits.map(function(m,i){
        return '<div class="r" role="option" id="gfvres-'+i+'" data-slug="'+m.slug+'"><b>'+esc(m.ko)+'</b><span>· '+m.year+'</span></div>';
      }).join('');
      searchRes.hidden=false;
      searchInput.setAttribute('aria-expanded','true');
    }
    function jumpTo(slug){
      var m=W.byId(slug); if(!m) return;
      if(hiddenLanes[laneOf(m)]){ hiddenLanes[laneOf(m)]=false; renderChipsAndLanes(); }
      applyZoom(false);
      requestAnimationFrame(function(){
        var node=canvasEl.querySelector('.node[data-slug="'+slug+'"]');
        if(!node) return;
        var sBox=scrollEl.getBoundingClientRect(), nBox=node.getBoundingClientRect();
        scrollEl.scrollLeft += (nBox.left+nBox.width/2)-(sBox.left+sBox.width/2);
        scrollEl.scrollTop += (nBox.top+nBox.height/2)-(sBox.top+sBox.height/2);
        if(ctl) ctl.select(slug);
        if(node.focus) node.focus();
      });
      searchRes.hidden=true; searchInput.value='';
    }
    searchInput.addEventListener('input', function(){ runSearch(searchInput.value); });
    searchInput.addEventListener('keydown', function(e){
      if(e.key==='Enter'){
        var first=searchRes.querySelector('.r'); if(first) jumpTo(first.dataset.slug);
      } else if(e.key==='Escape'){
        e.stopPropagation(); searchRes.hidden=true; searchInput.blur();
      }
    });
    searchRes.addEventListener('click', function(e){
      var r=e.target.closest('.r'); if(r) jumpTo(r.dataset.slug);
    });

    /* ---------- 목록(접근성 폴백) 토글 ---------- */
    function buildTextList(){
      var byLane={};
      items.forEach(function(m){ var l=laneOf(m); (byLane[l]=byLane[l]||[]).push(m); });
      return lanes.map(function(ln){
        var arr=(byLane[ln.id]||[]).slice().sort(function(a,b){return a.year-b.year;});
        if(!arr.length) return '';
        return '<div class="gfv-list-lane"><h4>'+esc(ln.name)+' · '+arr.length+'편</h4><ul>'+arr.map(function(m){
          return '<li><a href="#/p/'+m.slug+'">'+esc(m.ko)+'</a> <span class="gfv-list-yr">'+m.year+'</span></li>';
        }).join('')+'</ul></div>';
      }).join('');
    }
    listEl.innerHTML = buildTextList();
    var listBtn=root.querySelector('[data-gfv-list-toggle]');
    listBtn.addEventListener('click', function(){
      var showing = !listEl.hidden;
      listEl.hidden = showing;
      root.querySelector('.gfv-body').hidden = !showing;
      chipsEl.hidden = !showing;
      lanesEl.hidden = !showing; /* .gfv-body가 이미 lanesEl을 담고 있어 중복이지만 hidden 상속 안전망 */
      listBtn.setAttribute('aria-pressed', String(!showing));
      listBtn.textContent = showing ? '목록으로 보기' : '그래프로 보기';
    });

    /* ---------- 도움말 ---------- */
    var helpBtn=root.querySelector('[data-gfv-help]');
    function toggleHelp(force){
      var open = force!=null ? force : helpPanel.hidden;
      helpPanel.hidden=!open;
      helpBtn.setAttribute('aria-pressed', String(open));
    }
    helpBtn.addEventListener('click', function(){ toggleHelp(); });
    root.querySelector('[data-gfv-help-close]').addEventListener('click', function(){ toggleHelp(false); });

    /* ---------- 닫기 ---------- */
    root.querySelector('[data-gfv-close]').addEventListener('click', function(){ close(); });

    function onFsChange(){
      if(fsEl()!==root && isNative){
        /* 네이티브 전체 화면을 벗어났다(Esc 포함) — 뷰어 전체를 함께 닫는다.
           브라우저의 전체 화면 종료는 스크립트로 취소할 수 없으므로, 선택
           상태만 지키고 전체 화면은 유지하는 것은 이 모드에서 불가능하다
           (GRAPH-REFERENCES.md §권고1 "구현 주의"). */
        isNative=false;
        close();
      }
    }
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);

    function onHashChange(){ close(); }
    window.addEventListener('hashchange', onHashChange);

    /* Esc는 캡처 단계에서 먼저 가로챈다. W._wireGraphSelection(svgHost=canvasEl)이
       이미 자체 keydown 리스너로 "Esc = 선택 해제"를 버블 단계에서 처리하는데
       (GRAPH-INTERACTION.md §4/§6, 기존 홈·분야·로컬 그래프와 동일 동작),
       그 리스너는 stopPropagation을 하지 않는다. 만약 이 뷰어의 우선순위 판단을
       버블 단계(root)에서 하면 canvasEl의 리스너가 먼저 실행돼 선택을 지워버린
       "뒤"에 root가 판단하게 되어 "선택이 있었다"는 사실 자체를 알 수 없게
       된다(선택 있어도 항상 "없음"으로 보여 곧장 닫혀버리는 버그). 캡처 단계에서
       먼저 판단하고 stopPropagation으로 canvasEl의 중복 처리를 막아야
       "선택이 있으면 해제만, 없으면 닫기" 우선순위가 실제로 성립한다. */
    root.addEventListener('keydown', function(e){
      if(e.key!=='Escape') return;
      if(e.target===searchInput && !searchRes.hidden) return; /* 검색 드롭다운이 열려 있으면 그 자체의 Esc 처리(닫기)에 양보 */
      if(!isNative){
        if(ctl && ctl.get()){ e.preventDefault(); e.stopPropagation(); ctl.clear(); return; }
        e.preventDefault(); e.stopPropagation(); close(); return;
      }
      /* 네이티브 전체 화면: 브라우저가 Esc를 전체 화면 종료에 이미 쓰고 있어
         스크립트로 취소할 수 없다(GRAPH-REFERENCES.md §권고1) — 가로채지 않고
         그대로 흘려보낸다. 전체 화면이 끝나면 onFsChange가 뷰어를 맞춰 닫는다. */
    }, true);

    root.addEventListener('keydown', function(e){
      var tag=(e.target.tagName||'').toLowerCase();
      var typing = tag==='input'||tag==='textarea';
      if(e.key==='Escape') return; /* 위 캡처 리스너가 이미 처리했다 */
      if(typing) return;
      if(e.key==='?'){ e.preventDefault(); e.stopPropagation(); toggleHelp(); return; }
      if(e.key==='/'){ e.preventDefault(); e.stopPropagation(); searchInput.focus(); return; }
      if(e.key==='+'||e.key==='='){ e.preventDefault(); e.stopPropagation(); stepZoom(1); return; }
      if(e.key==='-'||e.key==='_'){ e.preventDefault(); e.stopPropagation(); stepZoom(-1); return; }
      if(e.key==='0'){ e.preventDefault(); e.stopPropagation(); setZoom('mid'); return; }
      if(e.key==='ArrowLeft'||e.key==='ArrowRight'||e.key==='ArrowUp'||e.key==='ArrowDown'){
        if(e.target.closest('.node')) return; /* 노드에 포커스 있을 때 방향키는 정의하지 않는다(GRAPH-INTERACTION §6) */
        e.preventDefault(); e.stopPropagation();
        var STEP=140;
        if(e.key==='ArrowLeft') scrollEl.scrollLeft-=STEP;
        if(e.key==='ArrowRight') scrollEl.scrollLeft+=STEP;
        if(e.key==='ArrowUp') scrollEl.scrollTop-=STEP;
        if(e.key==='ArrowDown') scrollEl.scrollTop+=STEP;
      }
    });

    function close(){
      if(closed) return; closed=true;
      var state={ focus: ctl? ctl.get() : null };
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
      window.removeEventListener('hashchange', onHashChange);
      if(fsEl()===root) exitFs();
      document.documentElement.classList.remove('gfv-lock');
      if(root.parentNode) root.parentNode.removeChild(root);
      active=null;
      try{ if(lastFocusEl && lastFocusEl.focus) lastFocusEl.focus(); }catch(e){}
      onClose(state);
    }

    /* ---------- 초기 진입: 네이티브 전체 화면 시도, 실패하면 폴백 오버레이 ---------- */
    renderChipsAndLanes();
    applyZoom(false);
    if(opts.focus) requestAnimationFrame(function(){ if(ctl) ctl.select(opts.focus); });

    requestFs(root).then(function(){
      isNative=true; root.classList.add('gfv-native');
    }, function(){
      isNative=false; root.classList.add('gfv-fallback');
      document.documentElement.classList.add('gfv-lock');
    });

    scrollEl.focus();

    active = {
      close: close,
      root: root,
      select: function(slug){ if(ctl) ctl.select(slug); }
    };
    return active;
  };
})(window.WIKI);
