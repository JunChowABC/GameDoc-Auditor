const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../dist/importer.js'),'utf8'),context);
const importer=context.window.GameDocImporter;
const fake=(name,text)=>({name,size:new TextEncoder().encode(text).length,text:async()=>text});

test('支持 docx、pdf、Markdown、TXT、JSON，拒绝旧版 doc',()=>{
 assert.equal(Object.keys(importer.TYPES).length,5);
 for(const ext of ['.docx','.pdf','.md','.txt','.json'])assert.ok(importer.TYPES[ext]);
 assert.equal(importer.typeOf('玩法设计.DOCX'),'.docx');
 assert.equal(importer.typeOf('规划.doc'),'.doc');
});
test('文本文件读取保持内容与行号，自动去除 UTF-8 BOM',async()=>{
 const r=await importer.readFile(fake('设定.md','\uFEFF体力上限：20\n初始金币：100'));
 assert.equal(r.text,'体力上限：20\n初始金币：100');
});
test('不支持文件、空文件和过大文件给出明确错误',async()=>{
 await assert.rejects(importer.readFile(fake('旧版.doc','Hello')),/不支持/);
 await assert.rejects(importer.readFile(fake('空.txt','')),/为空/);
 await assert.rejects(importer.readFile({name:'大.pdf',size:importer.LIMIT+1}),/12 MB/);
});
test('PDF 文本重组：同一行拼接，位置变化与 EOL 换行',()=>{
 const lines=importer.reconstructPage([
  {str:'体力上限：',transform:[1,0,0,1,0,100]},
  {str:'20',transform:[1,0,0,1,30,100],hasEOL:true},
  {str:'初始金币：',transform:[1,0,0,1,0,80]},
  {str:'100',transform:[1,0,0,1,30,80]}
 ]);
 assert.equal(lines,'体力上限：20\n初始金币：100');
});
