// Loads every content/papers/*.js note via the real WIKI.paper() call shape,
// capturing the object argument, and dumps all notes as one JSON array.
// Does NOT modify any file - read only.
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'content', 'papers');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort();

const notes = [];
const errors = [];

global.WIKI = {
  paper(obj) { notes.push(obj); }
};

for (const f of files) {
  const full = path.join(dir, f);
  const src = fs.readFileSync(full, 'utf8');
  try {
    // Evaluate in a function scope; the file calls WIKI.paper({...}) at top level.
    const fn = new Function('WIKI', src + '\n//# sourceURL=' + f);
    fn(global.WIKI);
  } catch (e) {
    errors.push({file: f, error: String(e && e.message || e)});
  }
}

fs.writeFileSync(path.join(__dirname, 'notes_dump.json'), JSON.stringify(notes, null, 0));
fs.writeFileSync(path.join(__dirname, 'notes_errors.json'), JSON.stringify(errors, null, 2));
console.log('notes:', notes.length, 'errors:', errors.length);
