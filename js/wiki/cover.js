/* ===== cover: 표지 카드 (책을 꺼내면 보이는 표지) =====
 * 참고 문서: design/LIBRARY-CONCEPT.md §6(표지 정보 위계·이미지 처리),
 *           design/SHELF-SPEC.md §2(하단 슬라이드업 패널·열고 닫는 규칙),
 *           design/TYPOGRAPHY.md §2(저자 표기 규칙), design/A11Y-PERF.md §3(이미지 예산·CLS).
 *
 * 공개 API
 *   W.cover(slug, opts) -> HTML 문자열. 표지 카드 "내용"만 돌려준다 — 패널의
 *     위치·열림 애니메이션은 통합 담당(shelf.js)이 정한다. 라우팅은 하지 않는다:
 *     "펼쳐보기"/"계보 보기"는 진짜 <a href="#/..."> 라 클릭하면 해시가 바뀌고,
 *     그 뒤 라우터가 반응하는 건 app.js 쪽 책임이다.
 *   W.wireCover(rootEl, opts) -> { open(slug, triggerEl), close(), isOpen() }
 *     rootEl 안에 카드를 렌더링/제거하고 닫기(×)·Esc·포커스 복귀만 배선한다.
 *     "책장 빈 공간 클릭", "같은 책 재클릭 시 토글" 은 책등을 아는 shelf.js의
 *     책임이므로 여기서는 다루지 않는다(SHELF-SPEC §2 표 참고).
 *
 * 이 파일은 core.js(W.esc, W.byId, W.field, W.stageBadge)와 fields.js(WIKI.FIELDS/META)
 * 가 이미 로드돼 있다고 가정한다. content/meta.json, content/covers/index.json,
 * content/covers/_missing.json은 이 파일이 직접, 한 번만 fetch한다(core.js의
 * loadGraph와 동일한 캐시 패턴 — 없거나 실패해도 화면은 폴백으로 정상 동작).
 */
window.WIKI = window.WIKI || {};
(function(W){

  /* ---------------------------------------------------------------
   * 데이터 로딩 — meta.json(저자·연도·게재처·arxiv), covers/index.json(w,h,bytes),
   * covers/_missing.json(이미지 없는 슬러그 목록). 셋 다 실패해도 폴백으로 그린다.
   * ------------------------------------------------------------- */
  var metaPromise=null, coverIdxPromise=null, coverMissPromise=null;

  W.META_INFO = W.META_INFO || null;          // slug -> {authors,published,venue,arxiv,title}
  W.COVER_INDEX = W.COVER_INDEX || null;       // slug -> {w,h,bytes}
  W.COVER_MISSING = W.COVER_MISSING || null;   // {slug:true,...}

  W.loadCoverMeta = function(){
    if(metaPromise) return metaPromise;
    metaPromise = fetch('content/meta.json?v='+(W.V||1))
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){ W.META_INFO = j || {}; return W.META_INFO; })
      .catch(function(){ W.META_INFO = {}; return W.META_INFO; });
    return metaPromise;
  };
  W.loadCoverIndex = function(){
    if(coverIdxPromise) return coverIdxPromise;
    coverIdxPromise = fetch('content/covers/index.json?v='+(W.V||1))
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){ W.COVER_INDEX = j || {}; return W.COVER_INDEX; })
      .catch(function(){ W.COVER_INDEX = {}; return W.COVER_INDEX; });
    return coverIdxPromise;
  };
  W.loadCoverMissing = function(){
    if(coverMissPromise) return coverMissPromise;
    coverMissPromise = fetch('content/covers/_missing.json?v='+(W.V||1))
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){
        var set={}; (j||[]).forEach(function(s){ set[s]=true; });
        W.COVER_MISSING = set; return set;
      })
      .catch(function(){ W.COVER_MISSING = {}; return W.COVER_MISSING; });
    return coverMissPromise;
  };
  /* 표지 카드가 등장할 즈음(호버/포커스/클릭)에는 이미 로드가 끝나 있도록
     스크립트 로드 시점에 바로 시작한다 — 실패해도 위 캐치가 빈 객체로 막는다. */
  W.loadCoverMeta(); W.loadCoverIndex(); W.loadCoverMissing();

  /* 아직 로딩 중이면 null/undefined를 주는 동기 getter.
     W.cover()는 이 값들이 없어도 깨지지 않고 그 조각만 생략한다. */
  W.coverMetaOf = function(slug){ return (W.META_INFO && W.META_INFO[slug]) || null; };
  W.coverDimsOf = function(slug){ return (W.COVER_INDEX && W.COVER_INDEX[slug]) || null; };
  W.coverImageMissing = function(slug){ return !!(W.COVER_MISSING && W.COVER_MISSING[slug]); };

  /* ---------------------------------------------------------------
   * 저자 표기 — TYPOGRAPHY.md §2, 표지(카드) 열의 규칙 그대로.
   * ------------------------------------------------------------- */
  var ORG_WORD_RE = /\b(team|collaboration|group|consortium|initiative|community)\b/i;
  var KNOWN_ORGS = {openai:1,deepmind:1,anthropic:1,meta:1,google:1,microsoft:1};

  function isOrgAuthor(name){
    name = String(name||'').trim();
    if(!name) return false;
    if(ORG_WORD_RE.test(name)) return true;
    if(KNOWN_ORGS[name.toLowerCase().replace(/\s+/g,'')]) return true;
    var tokens = name.split(/\s+/).filter(Boolean);
    return tokens.length>=3; /* §2.2 휴리스틱: 공백 토큰 3개 이상 */
  }
  function surname(name){
    var parts = String(name||'').trim().split(/\s+/).filter(Boolean);
    return parts.length ? parts[parts.length-1] : name;
  }

  /* 표지(카드)용 저자 줄. authors가 없거나 빈 배열이면 null을 돌려주고,
   * 호출부는 null이면 그 줄 자체를 DOM에서 생략한다(빈 문자열로 렌더링 금지). */
  function authorsLineForCover(authors){
    if(!authors || !authors.length) return null;
    var n = authors.length;
    var first = authors[0];
    if(isOrgAuthor(first)){
      return n<=1 ? W.esc(first) : W.esc(first)+' (외 '+(n-1)+'인 공동연구)';
    }
    if(n===1) return W.esc(authors[0]);
    if(n===2) return W.esc(authors[0])+' · '+W.esc(authors[1]);
    if(n<=4) return authors.map(W.esc).join(', ');
    var named = authors.slice(0,3).map(surname).map(W.esc).join(', ');
    return named+' 외 '+(n-3)+'인';
  }

  /* ---------------------------------------------------------------
   * 표지 카드 렌더링
   * ------------------------------------------------------------- */
  var DEFAULT_ASPECT = [800,270]; /* 실측 index.json 값의 대표 비율(§ 근거: 표본 대부분 800×259~296) */

  function fieldChip(f){
    if(!f) return '';
    return '<span class="chip-field" style="color:'+f.color+';border-color:color-mix(in srgb,'+f.color+' 45%,transparent);'
      +'background:color-mix(in srgb,'+f.color+' 12%,var(--surface))">'+W.esc(f.name)+'</span>';
  }

  /* 대체 표지용 2글자 모노그램 — 분야 영문명(`en`)에서 뽑는다. 실측 21개 전부
   * 라틴 대문자 2글자로 정리 가능(Vision->VI, LLM->LL, Foundations->FO 등). */
  function fieldMonogram(f){
    if(!f) return '';
    var src = String(f.en||f.name||'').replace(/[^A-Za-z가-힣]/g,'');
    return src.slice(0,2).toUpperCase();
  }

  function fallbackMarkup(m, f, hidden){
    /* 원문 렌더가 없거나 <img> 로드 자체가 실패했을 때 쓰는 "조판된 표지".
     * 제목·저자·연도는 바로 아래 카드 본문(.cover-body)에 이미 나오므로 여기서
     * 다시 쓰면 같은 문장이 카드 안에 두 번 보이는 중복이 생긴다(실측으로 발견,
     * 특히 perceptron·sae처럼 저자가 1명뿐이거나 없는 짧은 카드에서 두드러짐).
     * 대신 분야 밴드 + 큰 모노그램만으로 "사진이 아니라 의도된 조판"임을
     * 보여주는 자체완결 그래픽으로 만든다 — 정보는 실제 헤딩(h3)이 전달하므로
     * 이 블록 전체를 장식으로 접어 스크린리더에서 건너뛰게 한다. */
    return '<div class="cover-fallback"'+(hidden?' hidden':'')+' aria-hidden="true" style="--cover-field-color:'+(f?f.color:'var(--text-tertiary)')+'">'
      +'<div class="cover-fallback-band"></div>'
      +'<div class="cover-fallback-body">'
      +'<span class="cover-fallback-mono">'+W.esc(fieldMonogram(f))+'</span>'
      +'</div></div>';
  }

  function mediaMarkup(m, f){
    var missing = W.coverImageMissing(m.slug);
    var dims = W.coverDimsOf(m.slug);
    var w = dims ? dims.w : DEFAULT_ASPECT[0];
    var h = dims ? dims.h : DEFAULT_ASPECT[1];
    var inner;
    /* _missing.json에 이미 올라 있으면 <img>조차 만들지 않는다 — 404 요청 자체를
     * 내지 않아 콘솔 에러 예산을 지킨다(A11Y-PERF §3 정신 + 이번 작업의 "콘솔 에러 0" 요구). */
    if(missing){
      inner = fallbackMarkup(m, f, false);
    } else {
      inner = '<img class="cover-img" src="content/covers/'+encodeURIComponent(m.slug)+'.webp" '
        +'width="'+w+'" height="'+h+'" alt="'+W.esc(m.ko)+' 표지" loading="lazy" decoding="async" '
        +'onerror="this.hidden=true;var f=this.nextElementSibling;if(f)f.hidden=false;">'
        +fallbackMarkup(m, f, true);
    }
    /* 이미지 유무와 무관하게 같은 비율의 자리를 미리 잡아 레이아웃 시프트를 0으로 만든다
     * (A11Y-PERF §3.4). 실측 치수가 없으면(결측 슬러그) 카탈로그 표준 비율로 대체. */
    return '<div class="cover-media-frame" style="aspect-ratio:'+w+'/'+h+'">'+inner+'</div>';
  }

  /* opts:
   *   closable   (기본 true)  — ×(닫기) 버튼을 그린다. 논문 페이지 헤더 재사용 시 false.
   *   showExpand (기본 true)  — "펼쳐보기 →" 링크. 이미 그 논문 페이지라면 false로 끈다.
   *   showLineage(기본 true)  — "이 분야 계보 보기 →" 링크.
   */
  W.cover = function(slug, opts){
    opts = opts || {};
    var closable   = opts.closable   !== false;
    var showExpand = opts.showExpand !== false;
    var showLineage= opts.showLineage!== false;

    var m = W.byId(slug);
    if(!m) return '<div class="cover-card cover-missing">해당 논문을 찾을 수 없습니다.</div>';
    var f = W.field(m.field);
    var meta = W.coverMetaOf(slug); /* null이면 아직 로딩 중이거나 결측(예: sae) */
    var authors = meta ? meta.authors : null;
    var authorsLine = authorsLineForCover(authors);
    var stage = W.stageBadge ? W.stageBadge(slug) : '';

    var metaBits = [];
    if(meta && meta.venue) metaBits.push('<span class="chip-track">'+W.esc(meta.venue)+'</span>');
    if(meta && meta.arxiv) metaBits.push('<a class="chip-track" href="https://arxiv.org/abs/'+W.esc(meta.arxiv)+'" target="_blank" rel="noopener">arXiv:'+W.esc(meta.arxiv)+'</a>');

    var html = '<div class="cover-card" data-slug="'+W.esc(slug)+'">';
    if(closable){
      html += '<button type="button" class="graph-card-close cover-close" data-cover-close aria-label="닫기">×</button>';
    }
    html += mediaMarkup(m, f);
    html += '<div class="cover-body">';
    html += '<div class="cover-toprow">'+fieldChip(f)+stage+'</div>';
    html += '<h3 class="cover-title">'+W.esc(m.ko)+'</h3>';
    if(m.title && m.title!==m.ko) html += '<p class="cover-subtitle">'+W.esc(m.title)+'</p>';
    if(authorsLine) html += '<p class="cover-authors">'+authorsLine+'</p>';
    html += '<div class="cover-metaline">'+metaBits.join('')+'<span class="cover-year">'+m.year+'</span></div>';

    if(showExpand || showLineage){
      html += '<div class="cover-actions">';
      if(showLineage && f) html += '<a class="cover-lineage" href="#/f/'+W.esc(f.id)+'">이 분야 계보 보기 →</a>';
      if(showExpand) html += '<a class="graph-card-move cover-expand" href="#/p/'+W.esc(slug)+'">펼쳐보기 →</a>';
      html += '</div>';
    }
    html += '</div></div>';
    return html;
  };

  /* ---------------------------------------------------------------
   * 배선 — SHELF-SPEC §2: 닫기(×)/Esc는 카드를 닫고 트리거로 포커스를 되돌린다.
   * 포커스 트랩은 걸지 않는다(그래프 정보 카드와 같은 "곁다리 패널" 취급 —
   * 모달이 아니라 언제든 Tab으로 빠져나갈 수 있는 보조 패널).
   * "빈 공간 클릭으로 닫기"/"같은 책 재클릭 시 토글"은 책등을 아는 shelf.js가
   * open()/close()를 호출해 구현한다 — 여기서는 원자적인 열기/닫기만 제공한다.
   * ------------------------------------------------------------- */
  W.wireCover = function(rootEl, opts){
    opts = opts || {};
    var state = { slug:null, trigger:null };

    function render(slug){
      rootEl.innerHTML = W.cover(slug, opts.coverOpts);
      rootEl.hidden = false;
    }

    function doOpen(slug, triggerEl){
      state.slug = slug;
      state.trigger = triggerEl || document.activeElement || null;
      render(slug);
      if(typeof opts.onOpen==='function') opts.onOpen(slug);
    }

    function doClose(){
      if(!state.slug) return;
      var closedSlug = state.slug, trig = state.trigger;
      rootEl.hidden = true;
      rootEl.innerHTML = '';
      state.slug = null; state.trigger = null;
      if(typeof opts.onClose==='function') opts.onClose(closedSlug);
      /* Esc든 ×든 결과는 같다: 포커스는 방금 선택했던 책등으로 돌아온다(SHELF-SPEC §2). */
      if(trig && typeof trig.focus==='function') trig.focus();
    }

    rootEl.addEventListener('click', function(e){
      if(e.target.closest('[data-cover-close]')){ e.preventDefault(); doClose(); }
    });
    document.addEventListener('keydown', function(e){
      if(e.key==='Escape' && state.slug){ doClose(); }
    });

    return {
      open: doOpen,
      close: doClose,
      isOpen: function(){ return !!state.slug; },
      current: function(){ return state.slug; }
    };
  };

})(window.WIKI);
