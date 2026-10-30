/* GameDoc Auditor · deterministic relationship discovery. No AI, no network. */
(function(){
 'use strict';
 const TOPICS=[
  ['体力/行动资源',/体力|行动点|行动力/],['金币经济',/金币|货币收益|经营收益/],['钻石货币',/钻石|付费货币/],
  ['关卡挑战',/关卡|关卡挑战|副本|过关/],['战斗系统',/战斗|伤害|攻击力|自动战斗/],['任务系统',/任务|任务链|成就任务/],
  ['背包/道具',/背包|道具|物品栏|仓库/],['商店/购买',/商店|购买|商城|兑换商店/],['成长升级',/等级|升级|经验值|成长线/],
  ['剧情/对话',/剧情|对话|分支选项/],['新手引导',/新手引导|教程引导/],['好友/社交',/好友|社交|公会/],
  ['匹配/PVP',/匹配|PVP|竞技场/],['排行榜',/排行榜|排名奖励/],['活动',/限时活动|运营活动|活动任务/],
  ['广告变现',/激励广告|看广告|广告复活/],['存档/同步',/存档|服务器同步|保存进度/],['UI/交互',/按钮|界面|弹窗|页签/],
  ['掉落/随机',/随机掉落|抽卡|概率掉落|掉落池/],['资源配置',/配置表|数据表|配置ID|表驱动/]
 ];
 const RESOURCES=['金币','钻石','体力','材料','经验','道具'];
 const lines=text=>String(text||'').replace(/\r\n?/g,'\n').split('\n');
 const firstLine=(doc,re)=>{const a=lines(doc.text),i=a.findIndex(s=>re.test(s));return i===-1?null:{line:i+1,evidence:a[i].trim().slice(0,180)};};
 const truncate=(s,len=85)=>s.length>len?s.slice(0,len)+'…':s;
 function normName(name){return String(name||'').replace(/\.(?:md|txt|json)$/i,'').replace(/^\d+[_-]/,'').replace(/[《》\s]/g,'').toLowerCase();}
 function resources(doc){const result={};for(const resource of RESOURCES){const span='[^。；，,\\r\\n]{0,12}';const gain=new RegExp('(?:获得|获取|产出|奖励|掉落|领取|发放|生产)'+span+resource+'|'+resource+span+'(?:来源|产出|获取|奖励|收入)');const spend=new RegExp('(?:消耗|扣除|支付|花费|购买|使用)'+span+resource+'|'+resource+span+'(?:消耗|扣除|支付|花费|购买|使用|升级)');result[resource]={gain:firstLine(doc,gain),spend:firstLine(doc,spend)};}return result;}
 function buildRelations(rawDocs,customization={}){const docs=(Array.isArray(rawDocs)?rawDocs:[]).filter(d=>d&&String(d.text||'').trim()).map((d,i)=>({id:String(d.id||'doc-'+i),name:String(d.name||'文档'+(i+1)),text:String(d.text)}));
  const aliases=window.GameDocEngine?.validateCustomization?.(customization)?.config.aliases||[];
  const claimFn=window.GameDocEngine?.extractClaims;const claimMap=new Map(docs.map(d=>[d.id,claimFn?claimFn(d,aliases):[]]));
  const topicMap=new Map(docs.map(d=>[d.id,TOPICS.map(([name,re])=>({name,hit:firstLine(d,re)})).filter(t=>t.hit)]));
  const resourceMap=new Map(docs.map(d=>[d.id,resources(d)]));
  const edges=[];
  for(let i=0;i<docs.length;i++)for(let j=i+1;j<docs.length;j++){
    const a=docs[i],b=docs[j],details=[],seen=new Set();
    function add(item){const key=[item.type,item.label,item.from,item.to,item.status||''].join('|');if(seen.has(key))return;seen.add(key);details.push(item);}
    const ca=claimMap.get(a.id),cb=claimMap.get(b.id),mapB=new Map();cb.forEach(c=>{if(!mapB.has(c.key))mapB.set(c.key,c);});
    for(const claim of ca){const other=mapB.get(claim.key);if(!other||other.kind!==claim.kind)continue;
      const unitMismatch=claim.kind==='numeric'&&claim.unitGroup!==other.unitGroup;
      const conflict=!unitMismatch&&claim.canon!==other.canon;
      add({type:'field',label:claim.key,status:conflict?'conflict':unitMismatch?'uncertain':'consistent',from:a.id,to:b.id,
       fromLine:claim.line,toLine:other.line,fromEvidence:claim.evidence,toEvidence:other.evidence,
       summary:conflict?`定义冲突：${claim.display} ↔ ${other.display}`:unitMismatch?`单位待统一：${claim.display} ↔ ${other.display}`:`共同定义：${claim.display}`});
    }
    // Explicit references: only link when the source line names the other document and uses a citation verb.
    for(const [source,target] of [[a,b],[b,a]]){
      const targetName=normName(target.name);if(targetName.length<3)continue;
      const hit=firstLine(source,/参考|参照|详见|依据|引用|见《|关联文档/);
      if(!hit)continue;const targetLine=lines(source.text).findIndex(s=>/参考|参照|详见|依据|引用|见《|关联文档/.test(s)&&s.replace(/[《》\s]/g,'').toLowerCase().includes(targetName));
      if(targetLine<0)continue;add({type:'reference',label:'显式文档引用',status:'explicit',from:source.id,to:target.id,fromLine:targetLine+1,toLine:1,fromEvidence:lines(source.text)[targetLine].trim(),toEvidence:target.name,summary:`《${source.name}》明确引用《${target.name}》`});
    }
    // Resource flow is a candidate relationship, not proof of an actual implementation dependency.
    for(const resource of RESOURCES){const ra=resourceMap.get(a.id)[resource],rb=resourceMap.get(b.id)[resource];
      if(ra.gain&&rb.spend)add({type:'flow',label:resource+' 产出→消耗',status:'candidate',from:a.id,to:b.id,fromLine:ra.gain.line,toLine:rb.spend.line,fromEvidence:ra.gain.evidence,toEvidence:rb.spend.evidence,summary:`《${a.name}》出现${resource}产出，《${b.name}》出现${resource}消耗（候选流向）`});
      if(rb.gain&&ra.spend)add({type:'flow',label:resource+' 产出→消耗',status:'candidate',from:b.id,to:a.id,fromLine:rb.gain.line,toLine:ra.spend.line,fromEvidence:rb.gain.evidence,toEvidence:ra.spend.evidence,summary:`《${b.name}》出现${resource}产出，《${a.name}》出现${resource}消耗（候选流向）`});
    }
    const topicsA=topicMap.get(a.id),topicsB=new Map(topicMap.get(b.id).map(t=>[t.name,t.hit]));
    for(const t of topicsA){const other=topicsB.get(t.name);if(!other)continue;add({type:'topic',label:t.name,status:'candidate',from:a.id,to:b.id,fromLine:t.hit.line,toLine:other.line,fromEvidence:t.hit.evidence,toEvidence:other.evidence,summary:`两份文档均提及「${t.name}」；仅代表主题共现`});}
    if(!details.length)continue;
    const priority={field:4,reference:3,flow:2,topic:1};details.sort((x,y)=>(x.status==='conflict'?-100:0)-(y.status==='conflict'?-100:0)||priority[y.type]-priority[x.type]);
    const conflicts=details.filter(d=>d.status==='conflict').length,explicit=details.filter(d=>d.type==='reference').length;
    const dominant=conflicts?'conflict':explicit?'reference':details.some(d=>d.type==='field')?'field':details.some(d=>d.type==='flow')?'flow':'topic';
    const strong=details.filter(d=>d.type!=='topic').length;
    const directional=details.filter(d=>d.type==='reference'||d.type==='flow');const direction=directional.length&&directional.every(d=>d.from===directional[0].from&&d.to===directional[0].to)?{from:directional[0].from,to:directional[0].to}:null;
    edges.push({id:`edge-${i}-${j}`,a:a.id,b:b.id,dominant,conflicts,explicit,strong,total:details.length,direction,details});
  }
  edges.sort((a,b)=>b.conflicts-a.conflicts||b.strong-a.strong||b.total-a.total);
  return {nodes:docs.map(d=>({id:d.id,name:d.name,chars:d.text.length,topics:topicMap.get(d.id).map(t=>t.name)})),edges,
   summary:{documents:docs.length,pairs:edges.length,relations:edges.reduce((n,e)=>n+e.total,0),conflictPairs:edges.filter(e=>e.conflicts>0).length,explicitPairs:edges.filter(e=>e.explicit>0).length},
   method:'deterministic-document-relations',version:'0.3.0'};
 }
 window.GameDocRelations={TOPICS,RESOURCES,buildRelations};
})();
