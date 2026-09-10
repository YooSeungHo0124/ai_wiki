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

  /* ----------------------------------------------------------------
   * 검색 매칭 엔진 (자유어 부분)
   * 현재 app.js의 search()는 filter(field:/track:/year:/parents:/
   * children:/note:)는 이미 잘 처리하고, 자유어 매칭만 "slug+title+ko를
   * 통째로 소문자 substring 비교"라 (1) 저자, (2) 한글⇄영문 교차,
   * (3) 오타, (4) 여러 낱말, (5) 순위가 전혀 안 된다. 이 섹션은 그 빈
   * 자리를 채우는 W.freeTextMatches / W.rankScore 두 함수만 공개한다 —
   * filter 파싱·렌더링(app.js 소유)은 건드리지 않는다.
   *
   * 통합 방법(app.js 쪽, 다른 담당자가 반영): search() 안의
   *   if(q.free && (m.slug+' '+m.title+' '+m.ko).toLowerCase().indexOf(q.free)<0) return false;
   * 를
   *   if(q.free && !W.freeTextMatches(m,q.free)) return false;
   * 로 바꾸고, filter까지 통과한 matched 배열을 slice(0,12) 하기 전에
   *   if(q.free) matched.sort(function(a,b){ return W.rankScore(b,q.free)-W.rankScore(a,q.free); });
   * 한 줄만 추가하면 된다. q.free는 parseQuery()가 이미 소문자로 합쳐
   * 넘겨준다(자유어 여러 낱말이면 공백으로 이어진 하나의 문자열).
   * ---------------------------------------------------------------- */

  /* 저자 색인 — content/search-index.json(tools/build-search-index.js가
     content/meta.json에서 저자 이름만 뽑아 만든 산출물, ~127KB). 홈 초기
     전송 예산(A11Y-PERF.md §2.1, 500KB)을 지키려고 core.js 로드 시점에는
     받지 않고, 검색이 실제로 쓰이는 첫 순간(첫 keystroke)에만 가져온다.
     로드가 끝나기 전에 입력된 글자는 저자 매칭 없이 처리되고(기존 W.GRAPH
     null 가드와 동일한 타협), 로드가 끝나면 다음 keystroke부터 자동 반영된다. */
  W.AUTHOR_INDEX = null;
  var authorIdxPromise = null;
  function ensureAuthorIndex(){
    if(authorIdxPromise) return authorIdxPromise;
    authorIdxPromise = fetch('content/search-index.json?v='+(W.V||1))
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){ W.AUTHOR_INDEX = (j && j.authors) || {}; return W.AUTHOR_INDEX; })
      .catch(function(){ W.AUTHOR_INDEX = {}; return W.AUTHOR_INDEX; });
    return authorIdxPromise;
  }

  /* 한글 표기(음차/의역) ⇄ 영문 용어. 이 코퍼스(446편 제목·설명)에 실제로
     등장하는 개념 중 자주 검색될 법한 것만 손으로 골랐다 — 기계적 음차
     생성기가 아니라 정확도 우선의 짧은 표(관리 비용이 크면 P2). 양방향으로
     안 넣고 한→영 단방향만 둔다: title/ko 필드 자체가 이미 영문 위주라
     반대 방향(영→한)은 필요성이 낮다. */
  var KO_SYN = {
    '트랜스포머':'transformer','어텐션':'attention','디퓨전':'diffusion',
    '확산모델':'diffusion','버트':'bert','지피티':'gpt','생성모델':'generative',
    '이미지생성':'generation','강화학습':'reinforcement learning','정렬':'alignment',
    '증류':'distillation','양자화':'quantization','사전학습':'pretraining',
    '미세조정':'fine-tuning','파인튜닝':'fine-tuning','임베딩':'embedding',
    '토크나이저':'tokenizer','분류':'classification','탐지':'detection',
    '분할':'segmentation','합성곱':'convolution','신경망':'neural network',
    '오토인코더':'autoencoder','인코더':'encoder','디코더':'decoder',
    '역전파':'backpropagation','정규화':'normalization','옵티마이저':'optimizer',
    '스케일링':'scaling','멀티모달':'multimodal','비전':'vision',
    '컨트라스티브':'contrastive','대조학습':'contrastive',
    '지식증류':'knowledge distillation','전이학습':'transfer learning',
    '자기지도':'self-supervised','비지도':'unsupervised','지도학습':'supervised',
    '판별모델':'discriminative','생성적적대신경망':'gan',
    '확산':'diffusion', /* 기존 ko 필드에 이미 부분적으로 등장(§진단) — 명시적으로도 등록 */
    '이미지':'image','생성':'generation','텍스트':'text','음성':'speech',
    '비디오':'video','영상':'video','로봇':'robot','추론':'reasoning',
    '검색증강':'retrieval augmented','에이전트':'agent','안전성':'safety',
    '해석가능성':'interpretability','희소':'sparse','효율':'efficient'
  };

  /* 편집 거리(Levenshtein) ≤ max. 짧은 토큰 쌍에만 호출되므로 풀 DP로 충분히
     빠르다(446편 규모 실측 기준 — README/보고서 참고). */
  function editDistLE(a,b,max){
    var la=a.length, lb=b.length;
    if(Math.abs(la-lb)>max) return false;
    if(la===0||lb===0) return Math.max(la,lb)<=max;
    var prev=new Array(lb+1); for(var j=0;j<=lb;j++) prev[j]=j;
    for(var i=1;i<=la;i++){
      var cur=[i]; var rowMin=cur[0];
      for(j=1;j<=lb;j++){
        var cost = a.charAt(i-1)===b.charAt(j-1) ? 0 : 1;
        var v = Math.min(prev[j]+1, cur[j-1]+1, prev[j-1]+cost);
        cur[j]=v; if(v<rowMin) rowMin=v;
      }
      if(rowMin>max) return false; /* 이 행 전체가 이미 한계 초과 — 더 볼 필요 없음 */
      prev=cur;
    }
    return prev[lb]<=max;
  }

  var TOKEN_RE = /[^a-z0-9가-힣]+/;
  var blobCache=null, blobBySlug=null, blobAuthorVer=false;
  function ensureBlobs(){
    var haveAuthors = !!W.AUTHOR_INDEX;
    if(blobCache && blobAuthorVer===haveAuthors) return blobBySlug;
    blobBySlug = {};
    blobCache = W.META.map(function(m){
      var authors = (W.AUTHOR_INDEX && W.AUTHOR_INDEX[m.slug]) || [];
      var authorsLower = authors.join(' ').toLowerCase();
      var titleLower = String(m.title||'').toLowerCase();
      var koLower = String(m.ko||'').toLowerCase();
      var titleText = m.slug+' '+titleLower+' '+koLower;
      var text = titleText+' '+authorsLower;
      var b = {
        slug:m.slug, titleLower:titleLower, koLower:koLower,
        authorsLower:authorsLower, text:text,
        /* 오타 허용(편집거리)은 제목/한글표기/슬러그 토큰에만 건다 — 저자
           이름까지 퍼지 매칭하면 우연히 편집거리가 가까운 남의 이름과
           false positive가 잦고(예: 5글자 인명), 토큰 수도 크게 늘어나
           446편 규모에서 keystroke마다 예산(16ms)을 넘기기 쉽다. 저자는
           정확 substring 매칭(위 text/authorsLower)만 지원한다. */
        titleTokens: titleText.split(TOKEN_RE).filter(Boolean)
      };
      blobBySlug[m.slug]=b;
      return b;
    });
    blobAuthorVer = haveAuthors;
    return blobBySlug;
  }

  function wordMatches(w, m, blob){
    if(!w) return true;
    if(blob.text.indexOf(w)>=0) return true;
    var syn = KO_SYN[w];
    if(syn && blob.text.indexOf(syn)>=0) return true;
    var ym = w.match(/^(\d{4})(년)?$/);
    if(ym && String(m.year)===ym[1]) return true;
    if(w.length>=4){
      var maxD = w.length<=5 ? 1 : 2; /* 짧을수록 편집거리를 좁혀 오검출을 줄인다 */
      for(var i=0;i<blob.titleTokens.length;i++){
        var tok=blob.titleTokens[i];
        if(tok.length<3) continue; /* 짧은 토큰은 오타 허용 시 오검출이 너무 잦다 */
        if(editDistLE(w,tok,maxD)) return true;
      }
    }
    return false;
  }

  /* 자유어(이미 소문자, 여러 낱말이면 공백 결합) 매칭. 낱말은 전부 AND —
     "이미지 생성"처럼 두 낱말이면 각 낱말이 (원문 substring이든, KO_SYN
     번역이든, 연도든, 오타 허용 편집거리든) 이 논문 어딘가에서 따로 맞아야
     한다. */
  W.freeTextMatches = function(m, freeLower){
    if(!freeLower) return true;
    ensureAuthorIndex(); /* 첫 호출에서 트리거만, 결과는 기다리지 않는다 */
    var blobs = ensureBlobs();
    var blob = blobs[m.slug];
    if(!blob) return false;
    if(blob.text.indexOf(freeLower)>=0) return true; /* 통짜 구절 그대로 있으면 낱말 분해 없이 바로 통과 */
    var words = freeLower.split(/\s+/).filter(Boolean);
    for(var i=0;i<words.length;i++){ if(!wordMatches(words[i],m,blob)) return false; }
    return true;
  };

  /* 순위 규칙(요구사항 4): 제목 정확 일치 > 제목/한글표기 앞부분 일치 >
     본문(제목+ko+슬러그) 구절 포함 > 저자 일치 > 그 외(낱말 단위·오타·
     번역 매칭만 통과) 순. 동점이면 계보상 중요도(들어오는 백링크 수,
     graph.json의 in)로 살짝 밀어올린다 — "허브 논문"이 먼저 보이게. */
  W.rankScore = function(m, freeLower){
    var blobs = ensureBlobs();
    var blob = blobs[m.slug];
    var score = 0;
    if(blob){
      if(blob.titleLower===freeLower || blob.koLower===freeLower) score += 1000;
      else if(blob.titleLower.indexOf(freeLower)===0 || blob.koLower.indexOf(freeLower)===0) score += 500;
      else if(freeLower && blob.text.indexOf(freeLower)>=0) score += 200;
      else score += 80; /* freeTextMatches를 통과했지만 통짜 구절은 아님 — 낱말/오타/번역 매칭 */
      if(freeLower && blob.authorsLower && blob.authorsLower.indexOf(freeLower)>=0) score += 150;
    }
    var g=W.graphOf(m.slug);
    if(g && g.in) score += Math.min(g.in.length,10)*2;
    return score;
  };
})(window.WIKI);
