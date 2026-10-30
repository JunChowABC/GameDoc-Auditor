const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const context={window:{}};
for(const file of ['engine.js','relations.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../dist',file),'utf8'),context);
const engine=context.window.GameDocEngine,relations=context.window.GameDocRelations;
const doc=(id,text)=>({id,name:id+'.md',text});
const rule=(kind,fields={})=>({id:'XTEST_001',title:'项目质量规则',kind,severity:'medium',enabled:true,trigger:'',required:'',field:'',fix:'请补充明确规则',...fields});
const settings=(rules=[],aliases=[])=>({version:1,rules,aliases});

test('条件必备：触发词出现但缺少说明时提示，并准确定位行号',()=>{
 const config=settings([rule('requiredWhen',{trigger:'消耗体力',required:'恢复体力'})]);
 const bad=engine.auditDocuments([doc('a','玩家开始挑战。\n每次战斗消耗体力。')],config);
 assert.equal(bad.issues.find(i=>i.ruleId==='XTEST_001').line,2);
 const good=engine.auditDocuments([doc('a','每次战斗消耗体力。\n每小时恢复体力。')],config);
 assert.ok(!good.issues.some(i=>i.ruleId==='XTEST_001'));
});
test('禁止用语：按字面匹配，不执行任意正则',()=>{
 const config=settings([rule('forbidden',{trigger:'.*'})]);
 const good=engine.auditDocuments([doc('a','任务规则待定。')],config);
 assert.ok(!good.issues.some(i=>i.ruleId==='XTEST_001'));
 const bad=engine.auditDocuments([doc('a','不推荐使用 .* 作为规则。')],config);
 assert.ok(bad.issues.some(i=>i.ruleId==='XTEST_001'));
});
test('必填字段：缺失报警，字段别名存在时通过',()=>{
 const aliases=[{canonical:'体力上限',terms:['最高体力','行动力容量']}];
 const config=settings([rule('requiredField',{field:'体力上限'})],aliases);
 assert.ok(engine.auditDocuments([doc('a','玩家挑战关卡。')],config).issues.some(i=>i.ruleId==='XTEST_001'));
 assert.ok(!engine.auditDocuments([doc('a','最高体力：20')],config).issues.some(i=>i.ruleId==='XTEST_001'));
});
test('数值范围：与字段别名联动，超出上限产生规则问题',()=>{
 const config=settings([rule('numericRange',{field:'体力上限',min:0,max:100})],[{canonical:'体力上限',terms:['最高体力']}]);
 const bad=engine.auditDocuments([doc('a','最高体力：150')],config);
 assert.ok(bad.issues.some(i=>i.ruleId==='XTEST_001'&&i.line===1&&i.reason.includes('150')));
 const good=engine.auditDocuments([doc('a','最高体力：50')],config);
 assert.ok(!good.issues.some(i=>i.ruleId==='XTEST_001'));
});
test('跨文档：自定义别名同时被审校与关系画布识别',()=>{
 const aliases=[{canonical:'心情上限',terms:['情绪容量']}],config=settings([],aliases);
 const docs=[doc('a','心情上限：50'),doc('b','情绪容量：80')];
 assert.ok(engine.auditDocuments(docs,config).issues.some(i=>i.ruleId==='C01'));
 const graph=relations.buildRelations(docs,config);
 assert.ok(graph.edges[0].details.some(d=>d.label==='心情上限'&&d.status==='conflict'));
});
test('停用自定义规则后保留配置，但不产生问题',()=>{
 const config=settings([rule('forbidden',{trigger:'待定',enabled:false})]);
 const output=engine.auditDocuments([doc('a','功能待定。')],config);
 assert.ok(!output.issues.some(i=>i.ruleId==='XTEST_001'));
 assert.equal(output.customRuleCount,0);
 assert.equal(output.totalRules,engine.RULES.length);
});
test('校验拒绝重复别名及矛盾区间',()=>{
 const aliases=[{canonical:'体力上限',terms:['容量']},{canonical:'金币上限',terms:['容量']}];
 assert.ok(engine.validateCustomization(settings([],aliases)).errors.length);
 const invalid=settings([rule('numericRange',{field:'等级',min:20,max:3})]);
 assert.ok(engine.validateCustomization(invalid).errors.some(s=>s.includes('范围')));
 assert.throws(()=>engine.auditDocuments([doc('a','等级：10')],invalid));
});
test('合法配置可序列化，且原有默认调用行为不变',()=>{
 const config=settings([rule('forbidden',{trigger:'待定'})],[{canonical:'体力上限',terms:['最高体力']}]);
 const checked=engine.validateCustomization(config);
 assert.equal(checked.errors.length,0);
 assert.equal(JSON.parse(JSON.stringify(checked.config)).rules.length,1);
 assert.ok(engine.auditDocuments([doc('a','初始金币：100'),doc('b','初始金币：200')]).issues.some(i=>i.ruleId==='C01'));
});
test('示例自定义规则配置可直接导入并通过校验',()=>{
 const example=JSON.parse(fs.readFileSync(path.join(__dirname,'../examples/自定义规则与字段别名.example.json'),'utf8'));
 const checked=engine.validateCustomization(example);
 assert.equal(checked.errors.length,0);
 assert.equal(checked.config.rules.length,2);
 assert.equal(checked.config.aliases.length,1);
});
