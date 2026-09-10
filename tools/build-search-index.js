/* content/meta.json(178KB, 저자·연도·게재처·arxiv)에서 검색에 꼭 필요한
   저자 이름만 뽑아 작은 색인을 만든다.
   출력: content/search-index.json (저장소에 커밋되는 산출물)
   사용: node tools/build-search-index.js
   ※ content/meta.json이 갱신된 뒤(예: tools/fetch_authors.py 재실행)에는
     반드시 다시 실행할 것.

   meta.json 전체(178KB)를 검색 시점에 그대로 fetch하면 cover.js가 이미
   쓰고 있는 같은 파일을 또 받아오는 셈이라 낭비이고, meta.json에는 검색에
   안 쓰는 venue/arxiv/published까지 들어 있어 무겁다. 이 스크립트는
   저자 이름(문자열 매칭에 필요한 부분)만 추려 훨씬 작은 파일로 만든다.

   search-index.json 구조
   {
     "generated": "2026-09-10",
     "authors": { "<slug>": ["Ashish Vaswani", "Noam Shazeer", ...], ... }
   }
*/
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');

const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/meta.json'), 'utf8'));

const authors = {};
Object.keys(meta).forEach(function (slug) {
  var rec = meta[slug];
  if (rec && Array.isArray(rec.authors) && rec.authors.length) {
    authors[slug] = rec.authors;
  }
});

const out = {
  generated: new Date().toISOString().slice(0, 10),
  authors: authors
};

const outPath = path.join(ROOT, 'content/search-index.json');
fs.writeFileSync(outPath, JSON.stringify(out));

const bytes = fs.statSync(outPath).size;
console.log('search-index.json 생성: ' + Object.keys(authors).length + '편 저자 정보, ' + bytes + ' bytes');
