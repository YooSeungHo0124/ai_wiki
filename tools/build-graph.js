/* content/papers/*.js 를 전부 읽어 브라우저가 쓸 정적 인덱스를 만든다.
   출력: content/graph.json  (저장소에 커밋되는 산출물)
   사용: node tools/build-graph.js
   ※ 논문 노트를 추가·수정한 뒤에는 반드시 다시 실행할 것.

   graph.json 구조
   {
     "generated": "2026-09-09",
     "papers": {
       "<slug>": {
         "stage": "seed|sprout|growing|evergreen",   // 디지털 가든 성장 단계
         "bytes": 8292,                               // 노트 파일 크기
         "mtime": "2026-09-09",                       // 노트 최종 수정일 (없으면 미작성)
         "sections": ["math","numbers","deep",...],   // 실제로 채워진 선택 섹션
         "out": ["bert","gpt3"],                      // 본문 위키링크 (나가는 링크)
         "in":  ["vit","mae"],                        // 본문 위키링크 (백링크)
         "tags": ["llm","pretrain","2018"],           // 인덱스에서 파생한 구조적 태그
         "diagram": "stack",
         "extLinks": 3
       }, ...
     },
     "stats": { "total":150, "written":111, "byStage":{...}, "byField":{...} }
   }
*/
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT=path.join(__dirname,'..');
const ctx={}; ctx.window=ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT,'content/fields.js'),'utf8'),ctx);
const META=ctx.WIKI.META, SLUGS=new Set(META.map(m=>m.slug));

const OPT=['venue','authors','arxiv','math','numbers','links','deep'];
const papers={};

META.forEach(m=>{
  const file=path.join(ROOT,'content/papers',m.slug+'.js');
  const rec={stage:'seed',bytes:0,sections:[],out:[],in:[],diagram:null,extLinks:0,
             tags:[m.field,m.track,String(m.year)]};
  papers[m.slug]=rec;
  if(!fs.existsSync(file)) return;
  const src=fs.readFileSync(file,'utf8');
  rec.bytes=Buffer.byteLength(src);
  rec.mtime=fs.statSync(file).mtime.toISOString().slice(0,10);
  const c={}; c.window=c; c.WIKI={paper:o=>{c._p=o}}; vm.createContext(c);
  try{ vm.runInContext(src,c); }catch(e){ rec.stage='seed'; rec.error=e.message; return; }
  const p=c._p; if(!p) return;

  rec.diagram=p.diagram?p.diagram.type:null;
  rec.extLinks=(p.links||[]).length;
  rec.sections=OPT.filter(k=>p[k]&&(!Array.isArray(p[k])||p[k].length));
  rec.out=[...new Set([...src.matchAll(/\(#\/p\/([a-z0-9-]+)\)/g)].map(x=>x[1]))]
            .filter(s=>SLUGS.has(s) && s!==m.slug);

  /* 성장 단계: 분량 + 핵심 섹션 충실도로 판정 */
  const ideas=(p.ideas||[]).length, legacy=(p.legacy||[]).length, pit=(p.pitfalls||[]).length;
  const full = ideas>=3 && legacy>=3 && pit>=2 && p.diagram && p.impact && p.context;
  const rich = full && (p.math||[]).length>=1 && (p.numbers||[]).length>=3 && rec.bytes>=6000;
  rec.stage = rich ? 'evergreen' : full ? 'growing' : 'sprout';
});

/* 백링크 = out 의 역인덱스 */
Object.keys(papers).forEach(s=>papers[s].out.forEach(t=>{
  if(papers[t] && papers[t].in.indexOf(s)<0) papers[t].in.push(s);
}));

const byStage={}, byField={};
META.forEach(m=>{
  const st=papers[m.slug].stage;
  byStage[st]=(byStage[st]||0)+1;
  byField[m.field]=byField[m.field]||{total:0,written:0};
  byField[m.field].total++;
  if(st!=='seed') byField[m.field].written++;
});
const written=META.length-(byStage.seed||0);
const out={generated:new Date().toISOString().slice(0,10),papers,
           stats:{total:META.length,written,byStage,byField}};
fs.writeFileSync(path.join(ROOT,'content/graph.json'), JSON.stringify(out,null,1));
console.log('content/graph.json 생성 — 논문 '+META.length+'편, 노트 '+written+'편');
console.log('성장 단계:', byStage);
const linkCount=Object.values(papers).reduce((s,p)=>s+p.out.length,0);
console.log('본문 위키링크 '+linkCount+'개, 백링크가 있는 문서 '+Object.values(papers).filter(p=>p.in.length).length+'편');
