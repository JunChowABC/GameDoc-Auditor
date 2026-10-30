const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const context={window:{}};
for(const file of ['engine.js','relations.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../dist',file),'utf8'),context);
const {buildRelations}=context.window.GameDocRelations;
const d=(id,text,name=`${id}.md`)=>({id,name,text});

test('共同字段生成具有行号的关系依据',()=>{
 const r=buildRelations([d('a','体力上限：20'),d('b','体力上限：30')]);
 assert.equal(r.summary.pairs,1);
 const rel=r.edges[0].details.find(x=>x.type==='field'&&x.label==='体力上限');
 assert.ok(rel);assert.equal(rel.status,'conflict');assert.equal(rel.fromLine,1);assert.equal(rel.toLine,1);
});
test('同义字段归一化，时间单位换算避免误判',()=>{
 const r=buildRelations([d('a','关卡时长：60秒'),d('b','单局时长：1分钟')]);
 const rel=r.edges[0].details.find(x=>x.type==='field');assert.equal(rel.status,'consistent');
});
test('明确的文档引用形成有向关系',()=>{
 const r=buildRelations([d('a','失败流程参考《战斗系统》。','玩法说明.md'),d('b','战斗规则：需要根据胜负条件结算。','战斗系统.md')]);
 const rel=r.edges[0].details.find(x=>x.type==='reference');assert.ok(rel);
 assert.equal(rel.from,'a');assert.equal(rel.to,'b');
});
test('共同系统关键词只标记主题共现，不标记依赖',()=>{
 const r=buildRelations([d('a','玩家可通过任务获取金币。'),d('b','每日任务奖励金币。')]);
 assert.ok(r.edges[0].details.some(x=>x.type==='topic'&&x.status==='candidate'));
 assert.equal(r.edges[0].conflicts,0);
});
test('资源产出与消耗形成候选流向',()=>{
 const r=buildRelations([d('a','完成订单获得金币。'),d('b','购买道具消耗金币。')]);
 const rel=r.edges[0].details.find(x=>x.type==='flow');assert.ok(rel);
 assert.equal(rel.from,'a');assert.equal(rel.to,'b');assert.equal(rel.status,'candidate');
});
test('产消线索不能跨中文逗号错配到另一种行为',()=>{
 const r=buildRelations([d('a','领取收益，消耗金币升级建筑。\n完成订单获得金币。'),d('b','购买道具消耗金币。')]);
 const rel=r.edges[0].details.find(x=>x.type==='flow');assert.ok(rel);
 assert.equal(rel.fromLine,2);
});
test('没有共同线索的文档保留节点，但不强加连线',()=>{
 const r=buildRelations([d('a','天气晴朗，角色散步。'),d('b','烹饪食谱完成后上传。')]);
 assert.equal(r.nodes.length,2);assert.equal(r.edges.length,0);
});
test('多文档生成稳定的关系图数据并可序列化',()=>{
 const r=buildRelations([d('a','体力上限：20\n玩家获得金币。'),d('b','体力上限：30\n购买物品消耗金币。'),d('c','背包容量：50')]);
 assert.equal(r.nodes.length,3);assert.ok(r.summary.relations>=2);
 assert.ok(JSON.stringify(r).includes('method'));
});
test('空文档不会被当作有效节点',()=>{
 const r=buildRelations([d('a',''),d('b','有效内容')]);
 assert.equal(r.nodes.length,1);
});
