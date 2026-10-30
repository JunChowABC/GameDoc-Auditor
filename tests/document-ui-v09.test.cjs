const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..','dist');
const txt=f=>fs.readFileSync(path.join(root,f),'utf8');

test('V0.9 resource references are included without replacing legacy modules',()=>{
  const html=txt('index.html');
  for(const name of ['document-ui-v09.css','document-ui-v09.js','graph-layout.js','graph.js','engine.js','importer.js'])
   assert.ok(html.includes('./'+name),name);
  assert.ok(html.lastIndexOf('document-ui-v09.js')>html.indexOf('graph.js'));
});
test('upload feedback is fixed to two rows with independent scrolling',()=>{
 const css=txt('document-ui-v09.css');
 assert.match(css,/\.upload-feedback-list\s*\{/);
 assert.match(css,/grid-template-columns:\s*repeat\(2/);
 assert.match(css,/height:calc\(var\(--import-row\) \* 2 \+ 6px\)/);
 assert.match(css,/overflow-y:auto/);
});
test('navigator is vertical, searchable, scrollable',()=>{
 const js=txt('document-ui-v09.js'),css=txt('document-ui-v09.css');
 assert.match(js,/doc-search/);assert.match(js,/filterDocs/);
 assert.match(css,/\.doc-navigator \.doc-tabs\{display:flex;flex-direction:column/);
 assert.match(css,/overflow-y:auto/);
});
test('markdown preview includes local safe tables, and preserves edit/line navigation',()=>{
 const js=txt('document-ui-v09.js'),app=txt('app.js');
 assert.match(js,/parseTable/);assert.match(js,/renderMarkdown/);
 assert.match(js,/\.replace\(\/\[&<>"'\]/);
 assert.match(app,/GameDocMarkdownView\?\.hide\(\)/);
 assert.match(app,/gamedoc:doc-switched/);
});
