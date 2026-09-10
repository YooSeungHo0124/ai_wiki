/* 링크로 걸렸어야 하는데 텍스트로만 있는 논문 이름을 찾는다.
   사용: node tools/find_missed_links.js

   사서가 노트를 쓰는 시점에 아직 인덱스에 없던 논문은 죽은 링크를 피하려고
   텍스트로 강등된다. 그 논문이 나중에 추가돼도 링크는 복구되지 않는다.
   check.js 의 DEADLINK 는 이런 경우를 잡지 못하므로 따로 훑는다.        */
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT=path.join(__dirname,'..');
const ctx={}; ctx.window=ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT,'content/fields.js'),'utf8'),ctx);
const META=ctx.WIKI.META;

/* 한국어 통칭이 너무 짧거나 흔한 말이면 오탐이 많아 제외 */
const STOP=new Set(['GRU','MoE','SAM','T0','E5','BGE','UL2','ARC','MATH','CoLA','SR3','FNO','LIME','SHAP','ACT','Gato','PaLI','BM25','GLUE','Caffe','LSUN','MBPP','Adam','GELU','CPC','DIN','MF']);
const names=META.filter(m=>!STOP.has(m.ko)&&m.ko.length>=4)
  .map(m=>({slug:m.slug, ko:m.ko}));

let hits=[];
fs.readdirSync(path.join(ROOT,'content/papers')).filter(f=>f.endsWith('.js')).forEach(f=>{
  const me=f.slice(0,-3);
  const src=fs.readFileSync(path.join(ROOT,'content/papers',f),'utf8');
  names.forEach(n=>{
    if(n.slug===me) return;
    if(src.includes('#/p/'+n.slug)) return;          // 이미 어딘가 링크돼 있음
    const esc=n.ko.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const re=new RegExp('(?<!\\[)'+esc+'(?!\\])','');
    if(re.test(src)) hits.push({from:me, to:n.slug, ko:n.ko});
  });
});
if(!hits.length){ console.log('링크로 올릴 만한 텍스트 언급 없음.'); process.exit(0); }
const byFrom={};
hits.forEach(h=>{ (byFrom[h.from]=byFrom[h.from]||[]).push(h.ko+'('+h.to+')'); });
console.log('노트가 이름만 쓰고 링크는 안 건 곳 '+hits.length+'건:');
Object.entries(byFrom).sort().forEach(([f,a])=>console.log('  '+f.padEnd(24)+a.join(', ')));
console.log('\n전부 링크로 바꿔야 하는 것은 아니다 — 문맥상 비교 대상으로만 언급했다면 그대로 둔다.');
