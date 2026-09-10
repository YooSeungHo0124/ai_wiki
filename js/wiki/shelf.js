/* ===== 책장(bookshelf) 렌더러 =====
 * design/LIBRARY-CONCEPT.md(치수 확정안) · design/SHELF-SPEC.md(상태기계·키보드·SR)
 * design/TYPOGRAPHY.md(세로 조판) · design/MOTION.md(모션) 를 그대로 구현한다.
 *
 * 순수 함수: W.shelf(opts) 는 데이터를 받아 HTML 문자열을 돌려줄 뿐 DOM을
 * 직접 만지거나 라우팅하지 않는다. 로빙 tabindex 등 "상태"가 필요한 부분만
 * W.wireShelf(rootEl) 로 분리했다 — 실제 이벤트 배선(카드 열기·방문 기록 등)은
 * 통합 담당의 몫이며, 이 파일은 표준 커스텀 이벤트(shelf:select 등)만 쏜다.
 */
window.WIKI = window.WIKI || {};
(function(W){
  'use strict';

  /* ----------------------------------------------------------------
   * §1.1 폭 = bytes 분위수 매핑 (13~29px, clamp)
   * "런타임에 매번 계산하지 말고 모듈 로드시 1회 계산해 캐시" 요구사항:
   * 분위수 경계는 446편 전체 bytes 배열에 의존하므로 데이터가 도착해야
   * 계산 가능하다(그래프 데이터는 core.js 가 비동기 fetch). 그래서 "모듈
   * 파싱 시점"이 아니라 "이 모듈이 처음으로 실제 렌더에 쓰이는 시점(=최초
   * W.shelf 호출)"에 1회만 계산해 클로저에 캐시하고, 이후 호출은 전부
   * 캐시를 재사용한다 — 계산 자체는 정확히 1번만 일어난다는 점에서 스펙의
   * 의도를 지킨다. (design/SHELF-SPEC.md·LIBRARY-CONCEPT.md 어디에도 그래프
   * 데이터를 동기로 갖고 있으라는 요구는 없음.)
   * ---------------------------------------------------------------- */
  var SPINE_W_MIN=13, SPINE_W_MAX=29;
  var SPINE_H_MIN=108, SPINE_H_MAX=176, SPINE_H_K=15;
  var SPINE_BAND_H=22; /* --spine-band-h 와 동일 값, 레이아웃 계산에도 필요해 상수 보유 */

  var widthMapCache=null, widthMapKey=null;

  function computeWidthMap(papers, slugs){
    var entries=[];
    slugs.forEach(function(slug){
      var p=papers[slug];
      var bytes=(p&&typeof p.bytes==='number')? p.bytes : null;
      entries.push({slug:slug, bytes:bytes});
    });
    var known=entries.filter(function(e){return e.bytes!=null});
    known.sort(function(a,b){return a.bytes-b.bytes});
    var n=known.length;
    var rankOf={};
    if(n>1){
      var i=0;
      while(i<n){
        var j=i;
        while(j+1<n && known[j+1].bytes===known[i].bytes) j++;
        var avgIdx=(i+j)/2;
        for(var k=i;k<=j;k++) rankOf[known[k].slug]=avgIdx/(n-1);
        i=j+1;
      }
    } else if(n===1){
      rankOf[known[0].slug]=0.5;
    }
    var map={};
    entries.forEach(function(e){
      var r = (e.bytes!=null) ? rankOf[e.slug] : 0.5; /* bytes 결측 시 중간폭으로 폴백 */
      map[e.slug]=Math.round(SPINE_W_MIN + r*(SPINE_W_MAX-SPINE_W_MIN));
    });
    return map;
  }

  function getWidthMap(graph, index){
    var papers=(graph&&graph.papers)||{};
    var slugs=index.map(function(m){return m.slug});
    var key=slugs.length+':'+slugs[0]+':'+slugs[slugs.length-1];
    if(!widthMapCache || widthMapKey!==key){
      widthMapCache=computeWidthMap(papers, slugs);
      widthMapKey=key;
    }
    return widthMapCache;
  }

  /* §1.2 높이 = in(백링크) 로그 매핑, clamp 108~176 — 스칼라 공식이라 캐시 불필요 */
  function inCountOf(graphEntry){
    if(!graphEntry) return 0;
    var v=graphEntry['in'];
    if(Array.isArray(v)) return v.length;
    if(typeof v==='number') return v;
    return 0;
  }
  function heightFor(inCount){
    var h = SPINE_H_MIN + SPINE_H_K*Math.log(1+inCount);
    return Math.max(SPINE_H_MIN, Math.min(SPINE_H_MAX, Math.round(h)));
  }

  /* ----------------------------------------------------------------
   * TYPOGRAPHY.md §1 — 세로 책등 조판
   * 폭이 고정 슬롯이 아니라 bytes 분위수로 연속 분포하므로(§1.1), 여기서는
   * 문서의 "8자/14자 상한"을 그대로 판정 기준으로 쓰고 실제 줄바꿈은
   * §1.3 우선순위(공백>슬래시>가운뎃점>하이픈>글자)를 그대로 구현한다.
   * ---------------------------------------------------------------- */
  var HANGUL_RE=/[가-힣]/;
  function isHangulHeavy(s){ return HANGUL_RE.test(s); }

  function findBreak(s, limit){
    var breakers=[' ','/','·','-']; /* 공백, 슬래시, 가운뎃점, 하이픈 */
    var upto=Math.min(limit, s.length-1);
    for(var bi=0; bi<breakers.length; bi++){
      for(var p=upto; p>0; p--){
        if(s[p]===breakers[bi]) return p;
      }
    }
    return -1;
  }

  /* 최대 2줄, 그래도 안 되면 말줄임. 결과: 표시용 문자열 배열(1~2개) */
  function wrapSpineTitle(raw){
    var s=String(raw==null?'':raw).trim();
    var limit = isHangulHeavy(s) ? 8 : 14;
    if(s.length<=limit) return [s];
    var pos=findBreak(s, limit);
    var line1, rest;
    if(pos>0){ line1=s.slice(0,pos).trim(); rest=s.slice(pos+1).trim(); }
    else { line1=s.slice(0,limit); rest=s.slice(limit); }
    if(!rest) return [line1];
    if(rest.length<=limit) return [line1, rest];
    return [line1, rest.slice(0, Math.max(0,limit-1))+'…'];
  }

  /* ----------------------------------------------------------------
   * TYPOGRAPHY.md §2 — 저자 표기 (저자 없는 60편에서도 절대 깨지지 않게:
   * authors 가 없거나 빈 배열이면 항상 빈 문자열을 돌려주고, 호출부는
   * 그 값이 falsy 면 해당 요소 자체를 렌더링하지 않는다)
   * ---------------------------------------------------------------- */
  function isOrgAuthor(name){
    if(!name) return false;
    if(/collaboration|team|group|consortium|initiative/i.test(name)) return true;
    var tokens=name.trim().split(/\s+/).filter(Boolean);
    return tokens.length>=3;
  }
  function surnameOf(name){
    var tokens=String(name||'').trim().split(/\s+/).filter(Boolean);
    return tokens.length ? tokens[tokens.length-1] : String(name||'');
  }

  /* mode: 'spine'(짧게, 성 위주) | 'cover'(풀네임 위주) */
  function formatAuthors(authors, mode){
    if(!authors || !authors.length) return '';
    var n=authors.length;
    var first=authors[0];
    var firstIsOrg=isOrgAuthor(first);
    if(n===1){
      return (mode==='spine' && !firstIsOrg) ? surnameOf(first) : first;
    }
    if(n===2){
      return authors[0]+' · '+authors[1];
    }
    if(n<=4){
      return authors.join(', ');
    }
    /* 5인 이상: 1저자(혹은 조직명 전체) + "외 N인" */
    var shown = mode==='cover' ? authors.slice(0,3) : authors.slice(0,1);
    var names = shown.map(function(a,i){
      return (i===0 && firstIsOrg) ? a : surnameOf(a);
    });
    var rest = n - shown.length;
    return names.join(', ')+' 외 '+rest+'인';
  }

  /* 스크린리더 문장 조립용 — SHELF-SPEC §4 */
  function authorsSentence(authors){
    if(!authors || !authors.length) return '';
    return formatAuthors(authors, 'cover')+' 외';
  }

  /* ----------------------------------------------------------------
   * 상태(성장 단계) — DESIGN-SYSTEM §5.1 을 SHELF-SPEC §1 의 책등 규칙으로
   * 이식. 현재 데이터는 evergreen/growing 뿐이지만(seed/sprout 0편, §6
   * 정정) 미래를 위해 4단계 전부 지원한다.
   * ---------------------------------------------------------------- */
  var STAGE_CLASS={ seed:'stage-seed', sprout:'stage-sprout', growing:'stage-growing', evergreen:'' };
  var STAGE_LABEL={ seed:'씨앗 단계', sprout:'새싹 단계', growing:'자라는 중 단계', evergreen:'상록수 단계' };

  function esc(s){ return W.esc ? W.esc(s) : String(s==null?'':s); }

  /* ----------------------------------------------------------------
   * 책등 하나 렌더 — DOM: <a> + band + title + year (LIBRARY-CONCEPT §5.1
   * 예산). 여러 줄 제목은 <br> 로 표현(각 줄이 vertical-rl 에서 새 세로줄이
   * 되어 자연스럽게 "칸"이 나뉜다).
   * ---------------------------------------------------------------- */
  function renderSpine(m, field, graph, meta, widthMap, visited){
    var g = graph && graph.papers ? graph.papers[m.slug] : null;
    var stage = (g && g.stage) || 'evergreen';
    var inCount = inCountOf(g);
    var width = widthMap[m.slug] || SPINE_W_MIN;
    var height = heightFor(inCount);
    var authorsRaw = (meta && meta[m.slug] && meta[m.slug].authors) || null;
    var lines = wrapSpineTitle(m.ko);
    var titleHtml = lines.map(esc).join('<br>');
    var yearShort = "'"+String(m.year).slice(-2);
    var isVisited = !!(visited && visited[m.slug]);

    var cls='spine';
    if(STAGE_CLASS[stage]) cls+=' '+STAGE_CLASS[stage];
    if(isVisited) cls+=' is-visited';

    var labelParts=[m.ko];
    if(m.title && m.title!==m.ko) labelParts.push(m.title);
    var authSentence=authorsSentence(authorsRaw);
    if(authSentence) labelParts.push(authSentence);
    labelParts.push(m.year+'년');
    labelParts.push(STAGE_LABEL[stage]||stage);
    if(stage==='seed') labelParts.push('아직 정리 노트 없음');
    if(isVisited) labelParts.push('이전에 봤음');
    var ariaLabel=labelParts.join(', ');

    var fieldColor = field ? field.color : 'var(--border-strong)';
    var bandStyle = (stage==='seed'||stage==='sprout')
      ? 'background:transparent'
      : 'background:'+fieldColor;

    return '<a class="'+cls+'" href="#/p/'+esc(m.slug)+'" role="option" aria-selected="false" '
      +'tabindex="-1" data-slug="'+esc(m.slug)+'" data-field="'+esc(m.field)+'" data-year="'+m.year+'" '
      +'data-search="'+esc((m.ko||'').toLowerCase())+'" '
      +'style="width:'+width+'px;height:'+height+'px;--field-color:'+fieldColor+';'
      +((stage==='seed'||stage==='sprout')?'border-color:'+fieldColor+';':'')
      +'" aria-label="'+esc(ariaLabel)+'">'
      +'<span class="spine-band" style="'+bandStyle+'"></span>'
      +'<span class="spine-title">'+titleHtml+'</span>'
      +'<span class="spine-year">'+esc(yearShort)+'</span>'
      +'</a>';
  }

  /* §4.5 미채움 트랙 — 34px 점선 슬롯, 클릭 불가. 현재 데이터엔 0개지만
   * 미래(새 트랙 추가)를 위해 지원한다. */
  function renderEmptyTrackSlot(trackName, fieldColor){
    return '<div class="track-slot" style="border-color:'+fieldColor+'" '
      +'aria-hidden="true" title="'+esc(trackName)+' · 0편">'
      +'<span class="track-slot-label">'+esc(trackName)+' · 0편</span>'
      +'</div>';
  }

  /* 한 서가(분야 또는 연대) 블록 — 헤더 + shelf-row(listbox) */
  function renderShelfBlock(opts){
    var label=opts.label, papers=opts.papers, colorForItem=opts.colorForItem;
    var graph=opts.graph, meta=opts.meta, widthMap=opts.widthMap, visited=opts.visited;
    var emptySlots=opts.emptySlots||[]; /* [{name,color}] */
    var blockClass=opts.blockClass||'field-shelf';
    var dataAttr=opts.dataAttr||'';

    var rowHtml='';
    papers.forEach(function(m){
      rowHtml+=renderSpine(m, colorForItem(m), graph, meta, widthMap, visited);
    });
    emptySlots.forEach(function(sl){
      rowHtml+=renderEmptyTrackSlot(sl.name, sl.color);
    });

    return '<div class="'+blockClass+'" '+dataAttr+' style="content-visibility:auto;contain-intrinsic-size:0 200px">'
      +'<div class="shelf-header">'
        +'<h3 class="shelf-block-title">'+esc(label)+'</h3>'
        +'<span class="shelf-block-count">'+papers.length+'권</span>'
      +'</div>'
      +'<div class="shelf-row" role="listbox" aria-label="'+esc(label)+' 서가, '+papers.length+'권">'
        +rowHtml
      +'</div>'
    +'</div>';
  }

  function fieldColorLookup(fieldById){
    return function(m){ return fieldById[m.field]; };
  }

  function emptyTracksFor(field, papers){
    if(!field || !field.tracks) return [];
    var counts={};
    papers.forEach(function(m){ if(m.field===field.id) counts[m.track]=(counts[m.track]||0)+1; });
    var out=[];
    field.tracks.forEach(function(t){
      if(!counts[t.id]) out.push({name:t.name, color:field.color});
    });
    return out;
  }

  function byYearThenSlug(a,b){ return (a.year-b.year) || (a.slug<b.slug?-1:a.slug>b.slug?1:0); }

  /* ---------------- 그룹→분야 축 (기본) ---------------- */
  function renderFieldAxis(groups, fields, index, graph, meta, widthMap, visited){
    var fieldById={}; fields.forEach(function(f){ fieldById[f.id]=f; });
    var byField={};
    index.forEach(function(m){ (byField[m.field]=byField[m.field]||[]).push(m); });
    Object.keys(byField).forEach(function(k){ byField[k].sort(byYearThenSlug); });

    var html='';
    groups.forEach(function(g){
      html+='<section class="shelf-group" data-group="'+esc(g.id)+'">';
      html+='<h2 class="shelf-group-title">'+esc(g.name)+'</h2>';
      g.fields.forEach(function(fid){
        var field=fieldById[fid]; if(!field) return;
        var papers=byField[fid]||[];
        html+=renderShelfBlock({
          label:field.name,
          papers:papers,
          colorForItem: function(){ return field; },
          graph:graph, meta:meta, widthMap:widthMap, visited:visited,
          emptySlots: emptyTracksFor(field, index),
          blockClass:'field-shelf',
          dataAttr:'data-field="'+esc(fid)+'"'
        });
      });
      html+='</section>';
    });
    return html;
  }

  /* ---------------- 연대순 축 (전환) ---------------- */
  function renderDecadeAxis(fields, index, graph, meta, widthMap, visited){
    var fieldById={}; fields.forEach(function(f){ fieldById[f.id]=f; });
    var byDecade={};
    index.forEach(function(m){
      var d=Math.floor(m.year/10)*10;
      (byDecade[d]=byDecade[d]||[]).push(m);
    });
    var decades=Object.keys(byDecade).map(Number).sort(function(a,b){return a-b});
    var html='<section class="shelf-group" data-group="decade">';
    decades.forEach(function(d){
      var papers=byDecade[d].slice().sort(byYearThenSlug);
      html+=renderShelfBlock({
        label:d+'년대',
        papers:papers,
        colorForItem:function(m){ return fieldById[m.field]; },
        graph:graph, meta:meta, widthMap:widthMap, visited:visited,
        emptySlots:[],
        blockClass:'decade-shelf',
        dataAttr:'data-decade="'+d+'"'
      });
    });
    html+='</section>';
    return html;
  }

  /* ----------------------------------------------------------------
   * SHELF-SPEC §6/§7 — 좁은 화면(<768px) 대체: 분야 카드 → 드릴다운 리스트.
   * 네이티브 <details>/<summary> 로 구현해 JS 없이도 펼침/접힘이 동작한다.
   * CSS 미디어쿼리가 폭에 따라 이 블록과 데스크톱 그리드 중 하나만 보여준다
   * (display:none 인 쪽은 접근성 트리에서도 제외되므로 스크린리더가 두 번
   * 읽는 일은 없다).
   * ---------------------------------------------------------------- */
  function renderMobileList(groups, fields, index, graph, meta){
    var fieldById={}; fields.forEach(function(f){ fieldById[f.id]=f; });
    var byField={};
    index.forEach(function(m){ (byField[m.field]=byField[m.field]||[]).push(m); });
    Object.keys(byField).forEach(function(k){ byField[k].sort(byYearThenSlug); });

    var html='<div class="shelf-mobile" role="list" aria-label="논문 서가 목록, '+index.length+'권">';
    groups.forEach(function(g){
      g.fields.forEach(function(fid){
        var field=fieldById[fid]; if(!field) return;
        var papers=byField[fid]||[];
        html+='<details class="mobile-field" data-field="'+esc(fid)+'">'
          +'<summary style="border-left-color:'+field.color+'">'
            +'<span class="mf-name">'+esc(field.name)+'</span>'
            +'<span class="mf-count">'+papers.length+'편</span>'
          +'</summary>'
          +'<ul class="mobile-list">'
          +papers.map(function(m){
            var g2=graph&&graph.papers?graph.papers[m.slug]:null;
            var stage=(g2&&g2.stage)||'evergreen';
            var authorsRaw=(meta&&meta[m.slug]&&meta[m.slug].authors)||null;
            var authTxt=formatAuthors(authorsRaw,'cover');
            return '<li><a class="mobile-item" href="#/p/'+esc(m.slug)+'" data-slug="'+esc(m.slug)+'">'
              +'<span class="mi-title">'+esc(m.ko)+'</span>'
              +(authTxt?'<span class="mi-authors">'+esc(authTxt)+'</span>':'')
              +'<span class="mi-year">'+m.year+(stage==='seed'?' · 씨앗':'')+'</span>'
              +'</a></li>';
          }).join('')
          +'</ul>'
        +'</details>';
      });
    });
    html+='</div>';
    return html;
  }

  /* ================== 공개 API: W.shelf(opts) ================== */
  W.shelf = function(opts){
    opts = opts||{};
    var index = opts.index || (W.META||[]);
    var fields = opts.fields || (W.FIELDS||[]);
    var groups = opts.groups || (W.GROUPS||[]);
    var graph = opts.graph || W.GRAPH || {papers:{}};
    var meta = opts.meta || {};
    var axis = opts.axis==='decade' ? 'decade' : 'field';
    var visited = opts.visited || {};

    var widthMap=getWidthMap(graph, index);

    var body = axis==='decade'
      ? renderDecadeAxis(fields, index, graph, meta, widthMap, visited)
      : renderFieldAxis(groups, fields, index, graph, meta, widthMap, visited);

    var desktop='<div class="shelf shelf-axis-'+axis+'" role="region" '
      +'aria-label="논문 서가, '+index.length+'권">'+body+'</div>';

    var mobile = renderMobileList(groups, fields, index, graph, meta);

    return desktop+mobile;
  };

  /* 테스트/디버그 및 다른 컴포넌트(정렬 토글 등)에서 재사용할 수 있게
   * 순수 헬퍼도 일부 노출해둔다. 렌더링 계약은 W.shelf 하나뿐이다. */
  W.shelfHelpers = {
    widthFor: function(bytesMap, slug){ return getWidthMap({papers:bytesMap}, Object.keys(bytesMap).map(function(s){return {slug:s};})); },
    heightFor: heightFor,
    wrapSpineTitle: wrapSpineTitle,
    formatAuthors: formatAuthors
  };

  /* ================== 배선: W.wireShelf(rootEl) ==================
   * SHELF-SPEC §3(로빙 tabindex + 방향키 + 타입어헤드) 을 구현한다.
   * 이 함수는 상태(현재 활성 인덱스, 타입어헤드 버퍼)를 rootEl 에 딸린
   * 클로저로 들고 있을 뿐 카드 UI 는 만들지 않는다 — 선택/해제는
   * 커스텀 이벤트로만 알린다:
   *   'shelf:select'   detail:{slug,field,el}  — 책이 선택됨(카드를 열 시점)
   *   'shelf:deselect' detail:{slug,field,el}  — 선택 해제(카드를 닫을 시점)
   * 두 이벤트 모두 bubbles:true, cancelable:false — 정보 통지용이며
   * 실제 이동(navigate)은 통합 담당이 만들 카드의 버튼이 담당한다(§0).
   */
  W.wireShelf = function(root){
    if(!root) return;
    var spines = Array.prototype.slice.call(root.querySelectorAll('.spine'));
    if(!spines.length) return;

    var activeIdx=0;
    var selectedEl=null;
    var typeBuf='', typeTimer=null;

    function setTabbable(idx){
      spines.forEach(function(el,i){ el.setAttribute('tabindex', i===idx?'0':'-1'); });
      activeIdx=idx;
    }
    setTabbable(0);

    function focusIdx(idx){
      if(idx<0) idx=0;
      if(idx>=spines.length) idx=spines.length-1;
      setTabbable(idx);
      spines[idx].focus();
    }

    function fieldOf(i){ return spines[i].getAttribute('data-field'); }

    function nextFieldBoundary(dir){
      var f=fieldOf(activeIdx);
      var i=activeIdx;
      if(dir>0){
        while(i<spines.length-1 && fieldOf(i)===f) i++;
        if(fieldOf(i)===f) return i; /* 마지막 서가, 더 못 감 */
        /* i 는 다음 서가 첫 책 */
        return i;
      } else {
        while(i>0 && fieldOf(i)===f) i--;
        if(fieldOf(i)===f) return 0;
        var boundaryField=fieldOf(i);
        while(i>0 && fieldOf(i-1)===boundaryField) i--;
        return i;
      }
    }

    function select(el){
      if(selectedEl===el){
        deselect();
        return;
      }
      if(selectedEl){
        selectedEl.classList.remove('is-selected');
        selectedEl.setAttribute('aria-selected','false');
      }
      selectedEl=el;
      el.classList.add('is-selected');
      el.setAttribute('aria-selected','true');
      el.dispatchEvent(new CustomEvent('shelf:select', {
        bubbles:true, detail:{ slug:el.dataset.slug, field:el.dataset.field, el:el }
      }));
    }
    function deselect(){
      if(!selectedEl) return;
      var el=selectedEl;
      el.classList.remove('is-selected');
      el.setAttribute('aria-selected','false');
      selectedEl=null;
      el.dispatchEvent(new CustomEvent('shelf:deselect', {
        bubbles:true, detail:{ slug:el.dataset.slug, field:el.dataset.field, el:el }
      }));
    }

    function isModifiedClick(e){
      return e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button===1;
    }

    root.addEventListener('click', function(e){
      var el=e.target.closest ? e.target.closest('.spine') : null;
      if(!el || !root.contains(el)){
        /* 빈 공간 클릭 — 선택 해제(SHELF-SPEC §2) */
        if(!e.target.closest('.spine')) deselect();
        return;
      }
      if(isModifiedClick(e)) return; /* 새 탭 열기 등 기본 동작 존중 */
      e.preventDefault();
      var i=spines.indexOf(el);
      if(i>=0) setTabbable(i);
      select(el);
    });

    root.addEventListener('keydown', function(e){
      var el=e.target.closest ? e.target.closest('.spine') : null;
      if(!el) return;
      var i=spines.indexOf(el);
      if(i<0) return;

      switch(e.key){
        case 'ArrowRight': case 'ArrowDown':
          e.preventDefault(); focusIdx(i+1); return;
        case 'ArrowLeft': case 'ArrowUp':
          e.preventDefault(); focusIdx(i-1); return;
        case 'Home':
          e.preventDefault(); focusIdx(0); return;
        case 'End':
          e.preventDefault(); focusIdx(spines.length-1); return;
        case 'PageDown':
          e.preventDefault(); focusIdx(nextFieldBoundary(1)); return;
        case 'PageUp':
          e.preventDefault(); focusIdx(nextFieldBoundary(-1)); return;
        case 'Enter': case ' ': case 'Spacebar':
          e.preventDefault(); select(el); return;
        case 'Escape':
          if(selectedEl){ e.preventDefault(); deselect(); }
          return;
        default:
          if(e.key && e.key.length===1 && /[a-zA-Z0-9가-힣]/.test(e.key)){
            typeBuf += e.key.toLowerCase();
            clearTimeout(typeTimer);
            typeTimer=setTimeout(function(){ typeBuf=''; }, 500);
            var n=spines.length;
            for(var k=1;k<=n;k++){
              var idx=(i+k)%n;
              var t=(spines[idx].dataset.search||'');
              if(t.indexOf(typeBuf)===0){ focusIdx(idx); break; }
            }
          }
      }
    });

    /* 마우스로 다른 책에 포커스가 옮겨간 경우(탭으로 들어온 뒤 클릭 등)
     * 로빙 tabindex 커서를 그 위치로 맞춰준다. */
    root.addEventListener('focusin', function(e){
      var el=e.target.closest ? e.target.closest('.spine') : null;
      if(!el) return;
      var i=spines.indexOf(el);
      if(i>=0 && i!==activeIdx) setTabbable(i);
    });
  };

})(window.WIKI);
