/* content/ 전체 검증: 문법 · 스키마 · 내부 링크 · 커버리지
   사용: node tools/check.js            */
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT=path.join(__dirname,'..');
const ctx={}; ctx.window=ctx; ctx.console=console; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT,'content/fields.js'),'utf8'),ctx);
const META=ctx.WIKI.META, SLUGS=new Set(META.map(m=>m.slug));
const REQ=['tldr','context','ideas','diagram','impact','legacy','pitfalls'];
const DTYPES=['flow','stack','compare','loop','split','matrix'];
let err=[], warn=[], have=0;

META.forEach(m=>{
  const f=path.join(ROOT,'content/papers',m.slug+'.js');
  if(!fs.existsSync(f)){ warn.push('MISSING  '+m.slug); return; }
  have++;
  const src=fs.readFileSync(f,'utf8');
  const c={}; c.window=c; c.WIKI={paper:o=>{c._p=o}}; vm.createContext(c);
  try{ vm.runInContext(src,c); }catch(e){ err.push('SYNTAX   '+m.slug+': '+e.message); return; }
  const p=c._p;
  if(!p){ err.push('NOCALL   '+m.slug+': WIKI.paper() 호출 없음'); return; }
  if(p.slug!==m.slug) err.push('SLUG     '+m.slug+': slug 불일치 ('+p.slug+')');
  REQ.forEach(k=>{ if(!p[k]||(Array.isArray(p[k])&&!p[k].length)) err.push('FIELD    '+m.slug+': '+k+' 없음'); });
  if(p.diagram && DTYPES.indexOf(p.diagram.type)<0) err.push('DIAGRAM  '+m.slug+': 알 수 없는 타입 '+p.diagram.type);
  /* v2: 다이어그램 라벨 길이 상한 — 넘으면 도식이 아니라 목록이 된다 */
  if(p.diagram){
    var d=p.diagram, L=[];
    (d.nodes||[]).concat(d.layers||[]).concat(d.branches||[]).concat(d.from?[d.from]:[])
      .forEach(function(n){
        if(n.t) L.push(['t',n.t,14]);
        if(n.s) L.push(['s',n.s,22]);
        if(n.note) L.push(['note',n.note,28]);
      });
    [d.left,d.right].forEach(function(c){
      if(!c) return;
      if(c.t) L.push(['col',c.t,20]);
      (c.items||[]).forEach(function(x){ L.push(['item',x,30]); });
    });
    L.forEach(function(x){
      if(String(x[1]).length>x[2])
        err.push('LABEL    '+m.slug+': '+x[0]+' '+String(x[1]).length+'자 (상한 '+x[2]+') — "'+String(x[1]).slice(0,34)+'…"');
    });
  }
  /* v2: 수식은 tex 필드 권장 */
  (p.math||[]).forEach(function(x,i){
    if(!x.tex) warn.push('NOTEX    '+m.slug+': math['+i+'] 에 tex(LaTeX) 없음');
    else if(/(^|[^\\])\\[a-zA-Z]/.test(x.tex)===false && /[\\]/.test(x.tex))
      warn.push('TEXQ     '+m.slug+': math['+i+'] tex 이스케이프 확인 필요');
  });
  /* v2: 아이디어 요약문 */
  (p.ideas||[]).forEach(function(x,i){
    if(!x.lead) warn.push('NOLEAD   '+m.slug+': ideas['+i+'] 에 lead 없음');
  });
  if(p.ideas && p.ideas.length<3) warn.push('THIN     '+m.slug+': ideas '+p.ideas.length+'개');
  if(src.length<3500) warn.push('SHORT    '+m.slug+': '+src.length+' bytes');
  // 내부 링크 검사
  const links=[...src.matchAll(/\(#\/p\/([a-z0-9-]+)\)/g)].map(x=>x[1]);
  [...new Set(links)].forEach(s=>{ if(!SLUGS.has(s)) err.push('DEADLINK '+m.slug+' -> #/p/'+s+'   (오타이거나, 아직 없는 논문이다 — 후자라면 인덱스에 추가할 후보)'); });
  if(links.includes(m.slug)) warn.push('SELFLINK '+m.slug);
});
console.log('논문 '+META.length+'편 중 작성 '+have+'편 ('+(100*have/META.length).toFixed(0)+'%)');
if(warn.length){ console.log('\n-- 경고 '+warn.length+' --'); warn.forEach(w=>console.log('  '+w)); }
if(err.length){ console.log('\n-- 오류 '+err.length+' --'); err.forEach(e=>console.log('  '+e)); process.exit(1); }
console.log('\n오류 없음.');
