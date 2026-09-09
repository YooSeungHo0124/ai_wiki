/* ===== core: 레지스트리 · 텍스트 포매터 · 유틸 ===== */
window.WIKI = window.WIKI || {};
(function(W){
  W.PAPERS = {};          // slug -> content
  var pending = {};       // slug -> promise

  W.paper = function(o){ W.PAPERS[o.slug] = o; };

  W.byId = function(slug){ return W.META.filter(function(m){return m.slug===slug})[0]; };
  W.field = function(id){ return W.FIELDS.filter(function(f){return f.id===id})[0]; };
  W.track = function(fid,tid){
    var f=W.field(fid); if(!f) return null;
    return f.tracks.filter(function(t){return t.id===tid})[0];
  };
  W.childrenOf = function(slug){
    return W.META.filter(function(m){return m.parents.indexOf(slug)>=0});
  };

  /* 논문 본문 파일을 필요할 때만 로드 */
  W.load = function(slug){
    if(W.PAPERS[slug]) return Promise.resolve(W.PAPERS[slug]);
    if(pending[slug]) return pending[slug];
    pending[slug] = new Promise(function(res){
      var s=document.createElement('script');
      s.src='content/papers/'+slug+'.js?v='+(W.V||1);
      s.onload=function(){ res(W.PAPERS[slug]||null); };
      s.onerror=function(){ res(null); };
      document.head.appendChild(s);
    });
    return pending[slug];
  };

  /* 아주 작은 인라인 마크업: **굵게**, `코드`, [글자](주소), $수식$ */
  W.esc = function(s){
    return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  };
  /* 수식 한 조각을 KaTeX로. KaTeX가 없거나 파싱에 실패하면 원문을 모노스페이스로. */
  W.tex = function(src, display){
    src = String(src==null?'':src);
    if(window.katex){
      try{
        return window.katex.renderToString(src, {
          displayMode: !!display, throwOnError: false, strict: false,
          output: 'html', trust: false
        });
      }catch(e){ /* 아래 폴백 */ }
    }
    return '<span class="mono tex-fallback">'+W.esc(src)+'</span>';
  };

  W.fmt = function(s){
    s = String(s==null?'':s);
    /* $...$ 안은 이스케이프 전에 떼어내야 KaTeX가 원본을 받는다 */
    var math=[];
    s = s.replace(/\$([^$]+)\$/g, function(_,m){
      math.push(m); return '\u0000M'+(math.length-1)+'\u0000';
    });
    s = W.esc(s)
      .replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>')
      .replace(/`([^`]+)`/g,'<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
    return s.replace(/\u0000M(\d+)\u0000/g, function(_,i){ return W.tex(math[+i], false); });
  };
  W.el = function(html){ var d=document.createElement('div'); d.innerHTML=html; return d.firstElementChild; };
  W.go = function(hash){ location.hash = hash; };

  /* ----------------------------------------------------------------
   * graph.json 소비 계층
   * tools/build-graph.js 가 생성하는 정적 산출물(백링크·태그·성장단계).
   * 파일이 없거나 fetch 실패해도 사이트는 정상 동작해야 한다 — 그 경우
   * 이 아래 헬퍼들은 전부 null/폴백을 돌려주고, 화면 쪽은 항상
   * "값이 없으면 그 조각만 숨긴다"는 규칙으로 대응한다.
   * ---------------------------------------------------------------- */
  var graphPromise = null;
  W.loadGraph = function(){
    if(graphPromise) return graphPromise;
    graphPromise = fetch('content/graph.json?v='+(W.V||1))
      .then(function(r){ return r.ok ? r.json() : null; })
      .catch(function(){ return null; });
    return graphPromise;
  };
  /* 동기적으로 즉시 쓸 수 있는 캐시(로드가 끝난 뒤부터 유효) */
  W.GRAPH = null;
  W.loadGraph().then(function(g){ W.GRAPH = g; });
  W.graphOf = function(slug){ return (W.GRAPH && W.GRAPH.papers[slug]) || null; };

  /* 성장 단계 배지 — DESIGN-SYSTEM.md §5.1 4단계.
     tools/build-graph.js 가 내려주는 stage 값(seed|sprout|growing|evergreen)을
     그대로 신뢰한다. graph.json이 없으면(아직 안 만들어졌거나 fetch 실패)
     배지 자체를 그리지 않는다(추측으로 상태를 지어내지 않음). */
  W.STAGE_INFO = {
    seed:      {icon:'🌱', label:'씨앗'},
    sprout:    {icon:'🌿', label:'새싹'},
    growing:   {icon:'🪴', label:'자라는 중'},
    evergreen: {icon:'🌳', label:'여문 글'}
  };
  /* 논문 페이지 상단 메타 줄용 — 축약 없이 아이콘+라벨 전체 */
  W.stageBadge = function(slug){
    var g=W.graphOf(slug); if(!g||!g.stage) return '';
    var info=W.STAGE_INFO[g.stage]||{icon:'🌱',label:g.stage};
    return '<span class="tag stage stage-'+W.esc(g.stage)+'" title="성장 단계: '+W.esc(info.label)+'">'
      +info.icon+' '+W.esc(info.label)+'</span>';
  };
  /* 카드·검색 결과용 — 아이콘만 작게, 나머지는 title 툴팁으로 (§5.1 배치 규칙) */
  W.stageIcon = function(slug){
    var g=W.graphOf(slug); if(!g||!g.stage) return '';
    var info=W.STAGE_INFO[g.stage]||{icon:'🌱',label:g.stage};
    return '<span class="stage-ic stage-'+W.esc(g.stage)+'" title="성장 단계: '+W.esc(info.label)+'" aria-label="성장 단계: '+W.esc(info.label)+'">'+info.icon+'</span>';
  };
})(window.WIKI);
