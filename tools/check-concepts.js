/* content/concepts/ 전체 검증: 커버리지 · 문법 · 스키마 · 죽은 링크 · 다이어그램 라벨
   tools/check.js(논문용)를 본떴다. 사용: node tools/check-concepts.js */
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT=path.join(__dirname,'..');

const idxCtx={}; idxCtx.window=idxCtx; idxCtx.console=console; vm.createContext(idxCtx);
vm.runInContext(fs.readFileSync(path.join(ROOT,'content/fields.js'),'utf8'),idxCtx);
vm.runInContext(fs.readFileSync(path.join(ROOT,'content/concepts.js'),'utf8'),idxCtx);

const PAPER_SLUGS=new Set(idxCtx.WIKI.META.map(m=>m.slug));
const CONCEPTS=idxCtx.WIKI.CONCEPT_META||[];
const CONCEPT_SLUGS=new Set(CONCEPTS.map(c=>c.slug));
const REQ=['tldr','why','sections'];
const DTYPES=['flow','stack','compare','loop','split','matrix'];

let err=[], warn=[], have=0;

CONCEPTS.forEach(c=>{
  const f=path.join(ROOT,'content/concepts',c.slug+'.js');
  if(!fs.existsSync(f)){ warn.push('MISSING  '+c.slug+' ('+c.ko+')'); return; }
  have++;
  const src=fs.readFileSync(f,'utf8');
  const ctx={}; ctx.window=ctx; ctx.WIKI={concept:o=>{ctx._c=o}}; vm.createContext(ctx);
  try{ vm.runInContext(src,ctx); }catch(e){ err.push('SYNTAX   '+c.slug+': '+e.message); return; }
  const p=ctx._c;
  if(!p){ err.push('NOCALL   '+c.slug+': WIKI.concept() 호출 없음'); return; }
  if(p.slug!==c.slug) err.push('SLUG     '+c.slug+': slug 불일치 ('+p.slug+')');

  REQ.forEach(k=>{
    if(!p[k] || (Array.isArray(p[k]) && !p[k].length))
      err.push('FIELD    '+c.slug+': '+k+' 없음');
  });

  if(p.diagram && DTYPES.indexOf(p.diagram.type)<0)
    err.push('DIAGRAM  '+c.slug+': 알 수 없는 타입 '+p.diagram.type);

  /* 다이어그램 라벨 길이 상한 — tools/check.js와 같은 규칙 */
  if(p.diagram){
    const d=p.diagram, L=[];
    (d.nodes||[]).concat(d.layers||[]).concat(d.branches||[]).concat(d.from?[d.from]:[])
      .forEach(n=>{
        if(!n) return;
        if(n.t) L.push(['t',n.t,14]);
        if(n.s) L.push(['s',n.s,22]);
        if(n.note) L.push(['note',n.note,28]);
      });
    [d.left,d.right].forEach(col=>{
      if(!col) return;
      if(col.t) L.push(['col',col.t,20]);
      (col.items||[]).forEach(x=>{ L.push(['item',x,30]); });
    });
    L.forEach(x=>{
      if(String(x[1]).length>x[2])
        err.push('LABEL    '+c.slug+': '+x[0]+' '+String(x[1]).length+'자 (상한 '+x[2]+') — "'+String(x[1]).slice(0,34)+'…"');
    });
  }

  /* 수식은 tex 필드 권장 */
  (p.math||[]).forEach((x,i)=>{
    if(!x.tex) warn.push('NOTEX    '+c.slug+': math['+i+'] 에 tex(LaTeX) 없음');
  });

  /* confuse — 스키마상 a/b/d 필수 취급 */
  (p.confuse||[]).forEach((x,i)=>{
    if(!x.a||!x.b||!x.d) warn.push('CONFUSE  '+c.slug+': confuse['+i+'] 에 a/b/d 중 누락');
  });

  /* sections — h(14자 이내 권장), d 필수 */
  (p.sections||[]).forEach((s,i)=>{
    if(!s.d) err.push('SECFIELD '+c.slug+': sections['+i+'] 에 d 없음');
    if(s.h && s.h.length>14) warn.push('SECHEAD  '+c.slug+': sections['+i+'].h '+s.h.length+'자 (권장 14자 이내) — "'+s.h+'"');
  });

  /* 죽은 링크 — 논문(#/p/)과 개념(#/c/) 둘 다 검사 */
  const plinks=[...src.matchAll(/\(#\/p\/([a-z0-9-]+)\)/g)].map(x=>x[1]);
  [...new Set(plinks)].forEach(s=>{
    if(!PAPER_SLUGS.has(s)) err.push('DEADLINK '+c.slug+' -> #/p/'+s+'   (오타이거나 아직 없는 논문)');
  });
  const clinks=[...src.matchAll(/\(#\/c\/([a-z0-9-]+)\)/g)].map(x=>x[1]);
  [...new Set(clinks)].forEach(s=>{
    if(!CONCEPT_SLUGS.has(s)) err.push('DEADLINK '+c.slug+' -> #/c/'+s+'   (오타이거나 인덱스에 없는 개념)');
  });

  /* papers[]/terms[] 배열 — 마크다운 링크가 아니라 슬러그 배열이므로 별도 검사 */
  (p.papers||[]).forEach(s=>{
    if(!PAPER_SLUGS.has(s)) err.push('PAPERLINK '+c.slug+' -> papers[] "'+s+'"   (인덱스에 없는 논문 slug)');
  });
  (p.terms||[]).forEach(s=>{
    if(s===c.slug){ warn.push('SELFTERM '+c.slug+': terms[] 가 자기 자신을 가리킴'); return; }
    if(!CONCEPT_SLUGS.has(s)) err.push('TERMLINK '+c.slug+' -> terms[] "'+s+'"   (인덱스에 없는 개념 slug)');
  });

  if(src.length<4096) warn.push('SHORT    '+c.slug+': '+src.length+' bytes (4KB 미만)');
});

/* 캐시 버스터 — content/concepts.js 를 고치고 index.html 의 ?v= 를 안 올리면
   이미 방문한 사람은 옛 색인을 계속 본다 (tools/check.js와 같은 점검). */
try{
  const conceptsM=fs.statSync(path.join(ROOT,'content','concepts.js')).mtimeMs;
  const htmlM=fs.statSync(path.join(ROOT,'index.html')).mtimeMs;
  if(conceptsM > htmlM + 1000)
    warn.push('CACHEBUST content/concepts.js 가 index.html 보다 새롭다 — index.html 의 ?v= 를 올려야 방문자가 새 색인을 받는다');
}catch(e){}

console.log('개념 '+CONCEPTS.length+'개 중 작성 '+have+'개 ('+(100*have/CONCEPTS.length).toFixed(0)+'%)');
if(warn.length){ console.log('\n-- 경고 '+warn.length+' --'); warn.forEach(w=>console.log('  '+w)); }
if(err.length){ console.log('\n-- 오류 '+err.length+' --'); err.forEach(e=>console.log('  '+e)); process.exit(1); }
console.log('\n오류 없음.');
