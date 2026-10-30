/* GameDoc Auditor — MIT License. Multi-document UI; no external services or API keys. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const {RULES,auditDocuments}=window.GameDocEngine;
 const sampleA=`# 《星光小镇》玩法与经济规则

## 核心循环
玩家点击建筑领取收益，消耗金币升级建筑，完成挑战解锁新区域，再继续经营。
游戏的核心循环是：经营 → 获得资源 → 升级 → 挑战 → 解锁。
完成订单获得金币；关卡数值与失败流程参考《02_关卡与系统细则》。

## 经济与体力
初始金币：100
体力上限：20
每日挑战次数：5次
升级建筑消耗金币 50 点，每次关卡挑战消耗体力 3 点。

## 关卡与操作
关卡时长：60秒
自动战斗：开启
失败后处理：返回主界面
通关成功后进入结算界面，失败后允许重试。
点击开始按钮进入关卡，按钮不可点击时置灰。

## 研发说明
奖励和升级价格采用配置表，含配置ID、字段名和数值类型。`;
 const sampleB=`# 《星光小镇》关卡与系统细则

## 关卡参数
体力上限：30
每日挑战次数：10次
关卡时长：1分钟
初始金币：200

## 操作及结算
自动战斗：关闭
失败后处理：原地重试
完成关卡目标判定胜利，失败后弹出结果弹窗。

## 随机奖励
玩家胜利后可以随机掉落材料，候选奖励池包括花种、木材和装饰品。
每日奖励次数上限：3次。
购买道具消耗金币 10 点。

## 其他
部分资源规则待定，后续补充。`;
 let uid=1;const nextId=()=>`doc-${Date.now()}-${uid++}`;
 const newDoc=(name='未命名策划文档',text='')=>({id:nextId(),name,text});
 const state={docs:[newDoc()],activeId:null,report:null,filter:'all',selected:null,highlight:null,history:[],editorTab:'edit'};
 state.activeId=state.docs[0].id;
 const active=()=>state.docs.find(d=>d.id===state.activeId)||state.docs[0];
 const fmtDate=d=>new Date(d).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
 function toast(message){const t=$('toast');t.textContent=message;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),3000);}
 function page(name){document.querySelectorAll('.page').forEach(e=>e.classList.toggle('active',e.id==='page-'+name));document.querySelectorAll('.nav').forEach(e=>e.classList.toggle('active',e.dataset.page===name));$('crumbCurrent').textContent={audit:'文档审校',graph:'关联画布',rules:'规则库',history:'审校历史'}[name];if(name==='history')renderHistory();if(name==='graph')window.GameDocGraph?.refresh(state.docs);}
 function updateCount(){const t=$('docInput').value;$('charCount').textContent=`${t.length.toLocaleString()} 字 · ${t.split('\n').length} 行`;}
 function docChanged(){if(state.report)$('resultSubtitle').textContent='文档内容已变更 · 建议重新审校';}
 function renderTabs(){const e=$('docTabs');e.innerHTML=state.docs.map((d,i)=>`<button class="doc-chip ${d.id===state.activeId?'active':''}" data-doc="${esc(d.id)}" title="${esc(d.name)}"><span class="doc-index">${String(i+1).padStart(2,'0')}</span><span class="doc-chip-name">${esc(d.name)}</span></button>`).join('');
  e.querySelectorAll('[data-doc]').forEach(el=>el.addEventListener('click',()=>switchDoc(el.dataset.doc)));
  $('docSetInfo').textContent=`${state.docs.length} 份文档 · 多文档对照检查`;
  $('removeDoc').disabled=state.docs.length===1&&!active().text;
 }
 function switchDoc(id){if(!state.docs.some(d=>d.id===id))return;state.activeId=id;$('docName').value=active().name;$('docInput').value=active().text;updateCount();renderTabs();if(state.editorTab==='preview')renderLines();window.dispatchEvent(new CustomEvent('gamedoc:doc-switched',{detail:{docId:id}}));}
 function addDoc(name,text){if(state.docs.length>=30){toast('最多支持同时检查 30 份文档');return null;}const d=newDoc(name,text);state.docs.push(d);switchDoc(d.id);docChanged();return d;}
 function removeDoc(){const d=active();if(d.text.trim()&&!confirm(`确定移除「${d.name}」吗？该操作不影响已生成的历史报告。`))return;
  if(state.docs.length===1){d.text='';d.name='未命名策划文档';switchDoc(d.id);}else{const i=state.docs.findIndex(x=>x.id===d.id);state.docs.splice(i,1);switchDoc(state.docs[Math.max(0,i-1)].id);}docChanged();toast('已移除当前文档');}
 function setEditorTab(tab){window.GameDocMarkdownView?.hide();state.editorTab=tab;document.querySelectorAll('[data-editor-tab]').forEach(e=>e.classList.toggle('active',e.dataset.editorTab===tab));$('editPane').classList.toggle('hidden',tab!=='edit');$('previewPane').classList.toggle('hidden',tab!=='preview');if(tab==='preview')renderLines();}
 function renderLines(){const lines=active().text.replace(/\r\n?/g,'\n').split('\n');let lineNo=state.highlight?.docId===state.activeId?state.highlight.line:0;
  $('sourceLines').innerHTML=lines.map((s,i)=>`<div class="source-line ${lineNo===i+1?'highlight':''}" data-line="${i+1}"><span class="ln">${i+1}</span><span class="source-text">${esc(s)||'&nbsp;'}</span></div>`).join('');
  if(lineNo)$('sourceLines').querySelector('.highlight')?.scrollIntoView({block:'center',behavior:'smooth'});
 }
 function locate(docId,line){if(!state.docs.some(d=>d.id===docId)){toast('该文档已不在当前工作区，请恢复对应历史');return;}state.highlight={docId,line};switchDoc(docId);setEditorTab('preview');}
 function renderStats(r){$('statRules').textContent=r.totalRules;$('statIssues').textContent=r.issues.length;$('statCross').textContent=r.crossCount;$('statHigh').textContent=r.counts.high;$('statIssuesNote').textContent=`已检查 ${r.documentCount} 份文档`;}
 function renderReport(){const r=state.report;if(!r)return;
  $('emptyResult').classList.add('hidden');$('resultContent').classList.remove('hidden');$('copySummary').disabled=false;$('downloadMd').disabled=false;renderStats(r);
  $('resultSubtitle').textContent=`完成 ${fmtDate(r.checkedAt)} · ${r.documentCount} 份文档 · 本地规则`;
  $('reportHeadline').textContent=r.issues.length?`发现 ${r.issues.length} 项待核对问题`:'当前规则未发现明显问题';
  $('reportSummary').textContent=`跨文档冲突 ${r.crossCount} 项 · 严重 ${r.counts.high} · 中等 ${r.counts.medium} · 提示 ${r.counts.low}。点击问题查看双方依据。`;
  $('scoreValue').textContent=r.risk;$('scoreRing').style.setProperty('--ring',(100-r.risk)+'%');
  $('countAll').textContent=r.issues.length;$('countCross').textContent=r.crossCount;$('countHigh').textContent=r.counts.high;$('countMedium').textContent=r.counts.medium;$('countLow').textContent=r.counts.low;
  $('reportTime').textContent=`${r.documentCount} 份文档 · ${r.totalRules} 条规则 · ${r.applicableCount} 条触发适用条件`;
  document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b.dataset.filter===state.filter));renderIssues();
 }
 function renderIssues(){const r=state.report;if(!r)return;const severityText={high:'严重',medium:'中等',low:'提示'};
  const items=r.issues.filter(i=>state.filter==='all'||(state.filter==='cross'?i.scope==='cross':i.severity===state.filter));
  $('issueList').innerHTML=items.length?items.map(i=>`<article class="issue-card ${i.dismissed?'reviewed':''} ${state.selected===i.id?'selected':''} ${i.scope==='cross'?'cross-issue':''}" data-issue="${esc(i.id)}"><div class="issue-header"><span class="severity ${i.severity}"><i></i>${severityText[i.severity]}</span>${i.scope==='cross'?'<span class="scope-tag">⇄ 跨文档</span>':''}<span class="issue-category">${esc(i.category)} · ${esc(i.ruleId)}</span></div><h4>${esc(i.title)}</h4><p>${esc(i.reason)}</p><div class="issue-source">${esc(i.docName)} · 第 ${i.line} 行 ${i.related?' ↔ '+esc(i.related.docName)+' · 第 '+i.related.line+' 行':''}</div><div class="issue-more"><div class="quote"><span>原文依据 A</span><code>${esc(i.evidence||'文档整体')}</code><button class="locate-btn" data-locate="primary">定位原文 ↗</button></div>${i.related?`<div class="quote second"><span>原文依据 B · ${esc(i.related.docName)}</span><code>${esc(i.related.evidence)}</code><button class="locate-btn" data-locate="related">定位另一份文档 ↗</button></div>`:''}<div class="suggestion"><b>✦ 建议处理</b><p>${esc(i.fix)}</p></div><div class="issue-bottom"><span>${esc(i.confidence)}</span><button class="review-btn" data-reviewed="${esc(i.id)}">${i.dismissed?'✓ 已核对':'○ 标记已核对'}</button></div></div></article>`).join(''):'<div class="filter-empty">当前筛选下没有问题。<br><small>规则只能发现部分候选风险，仍需策划人工确认。</small></div>';
  $('issueList').querySelectorAll('.issue-card').forEach(el=>el.addEventListener('click',event=>{
    const issue=r.issues.find(i=>i.id===el.dataset.issue);if(!issue)return;
    const reviewed=event.target.closest('[data-reviewed]');if(reviewed){event.stopPropagation();issue.dismissed=!issue.dismissed;renderIssues();toast('已更新人工核对状态');return;}
    const target=event.target.closest('[data-locate]');if(target){event.stopPropagation();const related=target.dataset.locate==='related'&&issue.related;if(related)locate(related.docId,related.line);else locate(issue.docId,issue.line);return;}
    const opened=state.selected===issue.id;state.selected=opened?null:issue.id;if(!opened)locate(issue.docId,issue.line);renderIssues();
  }));
 }
 function runAudit(){const docs=state.docs.filter(d=>d.text.trim());if(!docs.length||docs.every(d=>d.text.trim().length<40)){toast('至少需要一份不少于 40 字的策划文档');return;}
  const btn=$('runAudit');btn.disabled=true;btn.textContent='正在运行本地规则…';
  setTimeout(()=>{try{state.report=auditDocuments(docs,window.GameDocCustomization?.getConfig()||{});state.filter='all';state.selected=null;state.highlight=null;renderReport();saveHistory();toast(`审校完成：${docs.length} 份文档，发现 ${state.report.crossCount} 项跨文档冲突`);}catch(err){console.error(err);toast('审校失败，请检查文档或自定义规则配置');}finally{btn.disabled=false;btn.innerHTML='✦ 重新审校全部 <span class="arrow">→</span>';}},120);
 }
 function reportText(){const r=state.report;if(!r)return'';return `GameDoc Auditor 审校结果\n检查文档：${r.documents.map(d=>d.name).join('、')}\n问题：${r.issues.length}，跨文档：${r.crossCount}，严重：${r.counts.high}\n\n`+r.issues.map((i,n)=>`${n+1}. [${i.ruleId}] ${i.title}\n${i.docName}:${i.line}${i.related?' ↔ '+i.related.docName+':'+i.related.line:''}\n${i.reason}\n建议：${i.fix}`).join('\n\n');}
 function reportMd(){const r=state.report;let md=`# GameDoc Auditor — 游戏策划文档审校报告\n\n- 文档数：${r.documentCount}\n- 规则数：${r.totalRules}\n- 时间：${fmtDate(r.checkedAt)}\n- 引擎：纯规则 ${r.engineVersion}（无 AI，无 API）\n- 待核对：${r.issues.length} 项，其中跨文档 ${r.crossCount} 项\n- 严重：${r.counts.high}，中等：${r.counts.medium}，提示：${r.counts.low}\n- 风险指数：${r.risk}/100（仅为命中加权提示）\n\n**文档清单**\n${r.documents.map(d=>`- ${d.name} (${d.lines} 行)`).join('\n')}\n\n> 所有结果均为启发式规则候选，可能误报和漏报，须由策划人工核实。\n\n`;
  r.issues.forEach((i,index)=>{md+=`## ${index+1}. [${i.scope==='cross'?'跨文档 / ':''}${{high:'严重',medium:'中等',low:'提示'}[i.severity]}] ${i.title}\n\n- 规则：${i.ruleId} · ${i.category}\n- 文档 A：${i.docName}，第 ${i.line} 行\n- 原文 A：${i.evidence}\n`;
    if(i.related)md+=`- 文档 B：${i.related.docName}，第 ${i.related.line} 行\n- 原文 B：${i.related.evidence}\n`;
    md+=`- 原因：${i.reason}\n- 建议：${i.fix}\n- 状态：${i.dismissed?'已人工核对':'待人工核对'}\n\n`;});return md;
 }
 function download(name,content,type){const blob=new Blob([content],{type:type||'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
 function saveHistory(){const item={id:Date.now(),docs:state.docs.map(d=>({...d})),report:state.report};try{state.history=[item,...state.history].slice(0,10);localStorage.setItem('gamedoc-audit-history-v2',JSON.stringify(state.history));}catch{toast('审校完成，但浏览器存储空间不足，历史记录可能未保存');}}
 function loadHistory(){try{state.history=JSON.parse(localStorage.getItem('gamedoc-audit-history-v2')||'[]');if(!Array.isArray(state.history))state.history=[];}catch{state.history=[];}}
 function renderHistory(){$('historyList').innerHTML=state.history.length?state.history.map(item=>`<button class="history-card" data-history="${item.id}"><div class="history-icon">▤</div><div><b>${esc(item.docs.map(d=>d.name).join(' / '))}</b><p>${item.docs.length} 份文档 · ${fmtDate(item.report.checkedAt)}</p></div><div class="history-metrics"><strong>${item.report.crossCount||0}</strong><span>跨文档冲突</span></div><span class="history-arrow">↗</span></button>`).join(''):'<div class="history-empty">暂无审校历史。先载入双文档示例体验一下吧。</div>';
  $('historyList').querySelectorAll('[data-history]').forEach(el=>el.addEventListener('click',()=>{const item=state.history.find(x=>String(x.id)===el.dataset.history);if(!item)return;state.docs=item.docs.map(d=>({...d}));state.activeId=state.docs[0].id;state.report=item.report;state.filter='all';state.selected=null;state.highlight=null;switchDoc(state.activeId);setEditorTab('edit');renderReport();page('audit');toast('已恢复整组文档和审校结果');}));}
 function renderRules(){const q=$('ruleSearch').value.trim().toLowerCase(),filtered=RULES.filter(r=>[r.id,r.title,r.category,r.detail].join(' ').toLowerCase().includes(q));$('ruleCount').textContent=`${filtered.length} / ${RULES.length} 条规则`;
  $('ruleGrid').innerHTML=filtered.map(r=>`<div class="rule-card"><div class="rule-top"><span class="rule-id">${r.id}</span><span class="severity ${r.severity}"><i></i>${{high:'严重',medium:'中等',low:'提示'}[r.severity]}</span></div><h3>${esc(r.title)}</h3><p>${esc(r.detail)}</p><div class="rule-footer"><span class="rule-cat">${esc(r.category)}</span><span class="rule-kind">${r.kind==='cross'?'跨文档':r.kind==='missing'?'规则缺失':'数值/逻辑'}</span></div></div>`).join('')||'<div class="history-empty">没有找到匹配规则。</div>';
 }
 function uploadFeedback(items,working=false){const area=$('uploadFeedback');area.classList.remove('hidden');
  area.innerHTML=`<div class="upload-feedback-title"><strong>${working?'正在本地读取文档…':'本次导入结果'}</strong><span>${items.filter(x=>x.ok).length} 成功 · ${items.filter(x=>x.ok===false).length} 失败</span></div>`+
   `<div class="upload-feedback-list">${items.map(item=>`<div class="upload-feedback-item ${item.ok===false?'is-error':item.ok?'is-success':'is-progress'}"><span>${item.ok===false?'✕':item.ok?'✓':'◌'}</span><b>${esc(item.name)}</b><small>${esc(item.message)}</small></div>`).join('')}</div>`;
 }
 let importBusy=false;
 async function importFiles(files){if(!files.length)return;if(importBusy){toast('正在处理上一批文档，请稍候');return;}importBusy=true;const importer=window.GameDocImporter;
  const items=[];let count=0;
  for(const f of files){const item={name:f.name,ok:null,message:'等待读取'};items.push(item);uploadFeedback(items,true);
    if(state.docs.length>=30&&!(state.docs.length===1&&!state.docs[0].text.trim()&&state.docs[0].name==='未命名策划文档')){item.ok=false;item.message='工作区最多 30 份文档';continue;}
    try{item.message='正在解析文件…';uploadFeedback(items,true);
      const result=await importer.readFile(f,progress=>{item.message=progress;uploadFeedback(items,true);});
      if(state.docs.length===1&&!state.docs[0].text.trim()&&state.docs[0].name==='未命名策划文档'){
        state.docs[0].name=f.name;state.docs[0].text=result.text;switchDoc(state.docs[0].id);
      }else if(!addDoc(f.name,result.text))throw new Error('工作区已达到文档数量上限');
      item.ok=true;item.message=result.warning||`已提取 ${result.text.length.toLocaleString()} 字`;count++;docChanged();
    }catch(error){item.ok=false;item.message=error?.message||'读取失败，请确认文件格式和内容';}
    uploadFeedback(items,true);
  }
  importBusy=false;uploadFeedback(items,false);if(count){setEditorTab('edit');toast(`成功导入 ${count} 份文档，可继续审校或查看关联画布`);}else toast('没有成功导入文档，请查看文件格式或错误提示');
 }
 function loadSample(){if(state.docs.some(d=>d.text.trim())&&!confirm('载入双文档示例会替换当前工作区，是否继续？'))return;state.docs=[newDoc('01_玩法与经济规则.md',sampleA),newDoc('02_关卡与系统细则.md',sampleB)];state.activeId=state.docs[0].id;state.report=null;state.selected=null;state.highlight=null;switchDoc(state.activeId);setEditorTab('edit');$('resultContent').classList.add('hidden');$('emptyResult').classList.remove('hidden');$('resultSubtitle').textContent='示例已准备 · 点击审校全部文档';['statIssues','statCross','statHigh'].forEach(id=>$(id).textContent='—');toast('已载入 2 份包含跨文档冲突的演示文档');}
 function bind(){document.querySelectorAll('.nav').forEach(b=>b.addEventListener('click',()=>page(b.dataset.page)));
  $('openGraph').addEventListener('click',()=>page('graph'));
  document.querySelectorAll('[data-editor-tab]').forEach(b=>b.addEventListener('click',()=>setEditorTab(b.dataset.editorTab)));
  document.querySelectorAll('.filter').forEach(b=>b.addEventListener('click',()=>{state.filter=b.dataset.filter;document.querySelectorAll('.filter').forEach(x=>x.classList.toggle('active',x===b));renderIssues();}));
  $('docInput').addEventListener('input',()=>{active().text=$('docInput').value;updateCount();docChanged();});
  $('docName').addEventListener('input',()=>{active().name=$('docName').value||'未命名策划文档';renderTabs();docChanged();});
  $('addDoc').addEventListener('click',()=>{const d=addDoc();if(d){setEditorTab('edit');$('docInput').focus();}});
  $('removeDoc').addEventListener('click',removeDoc);$('loadSample').addEventListener('click',loadSample);
  $('fileInput').addEventListener('change',async e=>{const files=Array.from(e.target.files||[]);e.target.value='';await importFiles(files);});
  const zone=$('uploadZone');['dragenter','dragover'].forEach(type=>zone.addEventListener(type,event=>{event.preventDefault();zone.classList.add('dragging');}));
  ['dragleave','drop'].forEach(type=>zone.addEventListener(type,event=>{event.preventDefault();zone.classList.remove('dragging');}));
  zone.addEventListener('drop',event=>importFiles(Array.from(event.dataTransfer?.files||[])));
  zone.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target===zone){event.preventDefault();$('fileInput').click();}});
  $('runAudit').addEventListener('click',runAudit);$('ruleSearch').addEventListener('input',renderRules);
  $('downloadMd').addEventListener('click',()=>{if(state.report)download('GameDoc审校报告.md',reportMd(),'text/markdown;charset=utf-8');});
  $('downloadJson').addEventListener('click',()=>{if(state.report)download('GameDoc审校报告.json',JSON.stringify({documents:state.docs,...state.report},null,2),'application/json;charset=utf-8');});
  $('copySummary').addEventListener('click',async()=>{if(!state.report)return;try{await navigator.clipboard.writeText(reportText());toast('已复制审校摘要');}catch{toast('复制失败，可导出报告');}});
 }
 window.GameDocBridge={getDocs:()=>state.docs.map(d=>({...d})),openDoc:(id,line)=>{page('audit');locate(id,line||1);}};
 window.addEventListener('gamedoc:settings-changed',()=>{const config=window.GameDocCustomization?.getConfig()||{rules:[]};$('statRules').textContent=RULES.length+config.rules.filter(r=>r.enabled).length;
   if(state.report)$('resultSubtitle').textContent='审校规范已更改 · 请重新审校';});
 loadHistory();bind();switchDoc(state.activeId);renderRules();updateCount();$('statRules').textContent=RULES.length+(window.GameDocCustomization?.getConfig()?.rules.filter(r=>r.enabled).length||0);
})();
