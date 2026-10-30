/* GameDoc Auditor · editable local rule and alias workspace; no AI or network. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id),KEY='gamedoc-customization-v1';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const validate=window.GameDocEngine.validateCustomization;
 const blank=()=>({version:1,rules:[],aliases:[]});
 const types={requiredWhen:'条件缺漏',forbidden:'禁止用语',requiredField:'必填字段',numericRange:'数值范围'};
 const hints={requiredWhen:'出现触发关键词后，全文必须出现另一项；按字面匹配，不执行正则表达式。',forbidden:'发现指定词句即提示；每份文档最多列出 8 处匹配位置。',requiredField:'要求存在“字段名称：具体值”格式；字段别名也能匹配。',numericRange:'限定“字段名称：数字”的范围；按原文数字比较，不做单位换算。'};
 let config=blank(),counter=1;
 function toast(s){const t=$('toast');t.textContent=s;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),3200);}
 try{const stored=JSON.parse(localStorage.getItem(KEY)||'null');if(stored){const r=validate(stored);if(!r.errors.length)config=r.config;}}catch{}
 function notifyChange(){window.dispatchEvent(new CustomEvent('gamedoc:settings-changed',{detail:{rules:config.rules.length,aliases:config.aliases.length}}));}
 function save(next,notice){const result=validate(next);if(result.errors.length){toast(result.errors[0]);return false;}
   config=result.config;try{localStorage.setItem(KEY,JSON.stringify(config));}catch{toast('保存到浏览器失败，请导出 JSON 备份配置');}
   render();notifyChange();if(notice)toast(notice);return true;
 }
 function updateRuleType(){const type=$('customRuleType').value;$('customRuleHint').textContent=hints[type];
   $('ruleKeywordRow').classList.toggle('hidden',!['requiredWhen','forbidden'].includes(type));
   $('ruleRequiredWrap').classList.toggle('hidden',type!=='requiredWhen');
   $('ruleFieldRow').classList.toggle('hidden',!['requiredField','numericRange'].includes(type));
   $('ruleMinWrap').classList.toggle('hidden',type!=='numericRange');$('ruleMaxWrap').classList.toggle('hidden',type!=='numericRange');
 }
 function clearRule(){ $('customRuleId').value='';$('customRuleSave').textContent='＋ 添加规则';updateRuleType(); }
 function clearAlias(){ $('aliasEditIndex').value='';$('aliasSave').textContent='＋ 添加别名组'; }
 function showRuleEditor(rule){$('customRuleId').value=rule.id;$('customRuleTitle').value=rule.title;$('customRuleType').value=rule.kind;$('customRuleSeverity').value=rule.severity;
   $('customRuleTrigger').value=rule.trigger||'';$('customRuleRequired').value=rule.required||'';$('customRuleField').value=rule.field||'';
   $('customRuleMin').value=rule.min??'';$('customRuleMax').value=rule.max??'';$('customRuleFix').value=rule.fix||'';
   $('customRuleSave').textContent='✓ 保存修改';updateRuleType();$('customRuleForm').scrollIntoView({block:'center',behavior:'smooth'});$('customRuleTitle').focus();
 }
 function showAliasEditor(index){const group=config.aliases[index];if(!group)return;
   $('aliasEditIndex').value=String(index);$('aliasCanonical').value=group.canonical;$('aliasTerms').value=group.terms.join('\n');$('aliasSave').textContent='✓ 保存修改';
   $('aliasForm').scrollIntoView({block:'center',behavior:'smooth'});$('aliasCanonical').focus();
 }
 function render(){
   const enabled=config.rules.filter(r=>r.enabled).length;
   $('customRuleCount').textContent=`${enabled} 启用 / ${config.rules.length} 条`;
   $('aliasCount').textContent=`${config.aliases.length} 组`;
   $('customRuleList').innerHTML=config.rules.length?config.rules.map(rule=>`<article class="config-item"><div class="config-item-main"><div class="config-item-name"><b>${esc(rule.title)}</b><span class="severity ${rule.severity}">${{high:'严重',medium:'中等',low:'提示'}[rule.severity]}</span></div><p>${types[rule.kind]} · ${esc(rule.kind==='requiredWhen'?`${rule.trigger} → ${rule.required}`:rule.kind==='forbidden'?rule.trigger:rule.field)}</p></div><div class="config-item-actions"><label class="config-switch"><input type="checkbox" data-rule-toggle="${esc(rule.id)}" ${rule.enabled?'checked':''} />启用</label><button data-rule-edit="${esc(rule.id)}">编辑</button><button data-rule-delete="${esc(rule.id)}" class="danger-text">删除</button></div></article>`).join(''):'<p class="config-empty">还没有自定义规则。上方可以添加第一条项目检查规范。</p>';
   $('aliasList').innerHTML=config.aliases.length?config.aliases.map((group,i)=>`<article class="config-item"><div class="config-item-main"><div class="config-item-name"><b>${esc(group.canonical)}</b><span class="config-alias-count">${group.terms.length} 个别名</span></div><p>${group.terms.map(esc).join(' · ')}</p></div><div class="config-item-actions"><button data-alias-edit="${i}">编辑</button><button data-alias-delete="${i}" class="danger-text">删除</button></div></article>`).join(''):'<p class="config-empty">还没有自定义别名组。默认内置别名仍然有效。</p>';
 }
 function download(name,data){const blob=new Blob([data],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
 function bind(){
   $('customRuleType').addEventListener('change',updateRuleType);
   $('customRuleForm').addEventListener('reset',()=>{setTimeout(clearRule,0);});
   $('aliasForm').addEventListener('reset',()=>{setTimeout(clearAlias,0);});
   $('customRuleForm').addEventListener('submit',event=>{event.preventDefault();const editId=$('customRuleId').value;
     const rule={id:editId||`X${Date.now().toString(36).toUpperCase()}${counter++}`,title:$('customRuleTitle').value.trim(),kind:$('customRuleType').value,severity:$('customRuleSeverity').value,
       enabled:editId?(config.rules.find(r=>r.id===editId)?.enabled!==false):true,trigger:$('customRuleTrigger').value.trim(),required:$('customRuleRequired').value.trim(),field:$('customRuleField').value.trim(),
       min:$('customRuleMin').value,max:$('customRuleMax').value,fix:$('customRuleFix').value.trim()};
     const rules=editId?config.rules.map(r=>r.id===editId?rule:r):[...config.rules,rule];
     if(save({...config,rules},editId?'规则已更新，请重新审校文档':'自定义规则已添加'))$('customRuleForm').reset();
   });
   $('aliasForm').addEventListener('submit',event=>{event.preventDefault();const index=$('aliasEditIndex').value,group={canonical:$('aliasCanonical').value.trim(),terms:$('aliasTerms').value.split(/[\n,，;；]/).map(s=>s.trim()).filter(Boolean)};
     const aliases=index!==''?config.aliases.map((g,i)=>i===Number(index)?group:g):[...config.aliases,group];
     if(save({...config,aliases},index!==''?'别名组已更新':'别名组已添加'))$('aliasForm').reset();
   });
   $('customRuleList').addEventListener('click',event=>{const edit=event.target.closest('[data-rule-edit]'),del=event.target.closest('[data-rule-delete]');
     if(edit){const r=config.rules.find(x=>x.id===edit.dataset.ruleEdit);if(r)showRuleEditor(r);}
     if(del){const r=config.rules.find(x=>x.id===del.dataset.ruleDelete);if(r&&confirm(`确定删除「${r.title}」吗？`)){if(save({...config,rules:config.rules.filter(x=>x.id!==r.id)},'已删除规则'))$('customRuleForm').reset();}}
   });
   $('customRuleList').addEventListener('change',event=>{const id=event.target.dataset.ruleToggle;if(!id)return;
     save({...config,rules:config.rules.map(r=>r.id===id?{...r,enabled:event.target.checked}:r)},event.target.checked?'规则已启用':'规则已停用');
   });
   $('aliasList').addEventListener('click',event=>{const edit=event.target.closest('[data-alias-edit]'),del=event.target.closest('[data-alias-delete]');
     if(edit)showAliasEditor(Number(edit.dataset.aliasEdit));
     if(del){const index=Number(del.dataset.aliasDelete),g=config.aliases[index];if(g&&confirm(`确定删除「${g.canonical}」的自定义别名吗？`)){if(save({...config,aliases:config.aliases.filter((_,i)=>i!==index)},'已删除别名组'))$('aliasForm').reset();}}
   });
   $('configExport').addEventListener('click',()=>download('GameDoc-自定义规则与别名.json',JSON.stringify(config,null,2)));
   $('configImportFile').addEventListener('change',async event=>{const file=event.target.files?.[0];event.target.value='';if(!file)return;
     if(file.size>200*1024){toast('配置文件不能超过 200 KB');return;}
     try{const parsed=JSON.parse(await file.text());if(!Array.isArray(parsed.rules)||!Array.isArray(parsed.aliases)){toast('不是有效的规则配置：需要 rules 和 aliases 数组');return;}
       const checked=validate(parsed);if(checked.errors.length){toast('导入失败：'+checked.errors[0]);return;}
       if((config.rules.length||config.aliases.length)&&!confirm('导入将覆盖当前浏览器的自定义规则和别名词典，是否继续？'))return;
       if(save(checked.config,'配置导入成功，重新审校即可应用')){$('customRuleForm').reset();$('aliasForm').reset();}
     }catch{toast('JSON 解析失败，文件可能已损坏');}
   });
 }
 bind();updateRuleType();render();window.GameDocCustomization={getConfig:()=>JSON.parse(JSON.stringify(config)),render};
})();
