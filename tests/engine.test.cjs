/* Repeatable, dependency-free tests for pure rule engine. Run: node --test tests/engine.test.cjs */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../dist/engine.js'),'utf8'),context);
const {RULES,auditDocuments,extractClaims}=context.window.GameDocEngine;
const doc=(id,text)=>({id,name:`${id}.md`,text});
const cross=items=>auditDocuments(items).issues.filter(i=>i.scope==='cross');

test('规则库不少于 60 条且 ID 唯一',()=>{
  assert.ok(RULES.length>=60);
  assert.equal(new Set(RULES.map(x=>x.id)).size,RULES.length);
  assert.ok(RULES.every(r=>r.title&&r.category&&r.fix&&r.detail));
});
test('跨文档：同字段数值矛盾，返回双方位置',()=>{
  const result=cross([doc('玩法','体力上限：20'),doc('系统','体力上限：30')]);
  const issue=result.find(i=>i.ruleId==='C01');
  assert.ok(issue);
  assert.equal(issue.docId,'玩法');
  assert.equal(issue.related.docId,'系统');
  assert.equal(issue.line,1);
  assert.equal(issue.related.line,1);
});
test('跨文档：不同叫法的同一字段归一化',()=>{
  const result=cross([doc('a','最大体力：20'),doc('b','体力上限：30')]);
  assert.ok(result.some(i=>i.ruleId==='C01'));
});
test('跨文档：单位转换后相等，不产生冲突',()=>{
  const result=cross([doc('a','关卡时长：60秒'),doc('b','单局时长：1分钟')]);
  assert.ok(!result.some(i=>i.ruleId==='C01'));
});
test('跨文档：相同字段缺少单位，产生单位提示',()=>{
  const result=cross([doc('a','关卡时长：60'),doc('b','单局时长：60秒')]);
  assert.ok(result.some(i=>i.ruleId==='C04'));
});
test('跨文档：开关启用与禁用冲突',()=>{
  const result=cross([doc('a','自动战斗：开启'),doc('b','自动战斗：关闭')]);
  assert.ok(result.some(i=>i.ruleId==='C02'));
});
test('跨文档：流程结果不同',()=>{
  const result=cross([doc('a','失败后处理：返回主界面'),doc('b','失败后处理：原地重试')]);
  assert.ok(result.some(i=>i.ruleId==='C03'));
});
test('单文档重复字段冲突只算同文档，不算跨文档',()=>{
  const r=auditDocuments([doc('a','初始金币：100\n初始金币：200')]);
  assert.ok(r.issues.some(i=>i.ruleId==='S05'));
  assert.equal(r.crossCount,0);
});
test('明确概率超出 100% 检出；普通攻击加成不误报',()=>{
  const r=auditDocuments([doc('a','掉落概率：120%\n攻击加成：200%')]);
  const errors=r.issues.filter(i=>i.ruleId==='S03');
  assert.equal(errors.length,1);
  assert.ok(errors[0].reason.includes('120%'));
});
test('同文档待定规则被定位',()=>{
  const r=auditDocuments([doc('a','任务奖励：待定\n体力恢复：TODO')]);
  const issues=r.issues.filter(i=>i.ruleId==='S01');
  assert.equal(issues.length,2);
  assert.equal(issues.map(i=>i.line).join(','),'1,2');
});
test('资源来源与消耗需匹配同一种资源',()=>{
  const r=auditDocuments([doc('a','消耗金币升级建筑。\n打败敌人掉落材料。')]);
  assert.ok(r.issues.some(i=>i.ruleId==='E01'&&i.reason.includes('金币')));
});
test('已定义金币收入时不报警金币缺乏来源',()=>{
  const r=auditDocuments([doc('a','消耗金币升级建筑。\n完成订单获得金币。')]);
  assert.ok(!r.issues.some(i=>i.ruleId==='E01'&&i.reason.includes('金币')));
});
test('多个文档中只有一个冲突字段时不重复报告',()=>{
  const r=auditDocuments([doc('a','体力上限：20'),doc('b','体力上限：30'),doc('c','体力上限：30')]);
  const conflicts=r.issues.filter(i=>i.ruleId==='C01');
  assert.ok(conflicts.length>=1);
  assert.ok(conflicts.length<=2);
});
test('空文档不会产生虚构问题',()=>{
  const r=auditDocuments([doc('empty',''),doc('blank','  ')]);
  assert.equal(r.documentCount,0);
  assert.equal(r.issues.length,0);
});
test('没有联网或 API 依赖，输出可序列化',()=>{
  const r=auditDocuments([doc('a','初始金币：100'),doc('b','初始金币：200')]);
  assert.ok(JSON.stringify(r).includes('C01'));
  assert.equal(r.method,'deterministic-multi-document-rules');
  assert.ok(extractClaims(doc('x','初始金币：100')).length>=1);
});
