/* GameDoc Auditor — V0.8 feature reconstruction: overview + document focus + edge focus.
 * All relation evidence is supplied by the original deterministic V0.5 engine.
 */
(function(){
 'use strict';
 const $=id=>document.getElementById(id), W=1080,H=650;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const {buildRelations}=window.GameDocRelations,Geo=window.GameDocGraphLayout;
 const state={data:null,positions:new Map(),selected:null,filter:'all',hideWeak:false,focusMode:false,
   scale:1,tx:0,ty:0,gesture:null,view:null};
 const colors={conflict:'#ec6475',reference:'#8a70f1',field:'#597feb',flow:'#27b9a9',topic:'#b9c3d4'};
 const labels={field:'共同字段',reference:'明确引用',flow:'候选资源流向',topic:'主题共现'};
 const svg=$('relationCanvas');
 function toast(message){const t=$('toast');t.textContent=message;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),2700);}
 function ellipsis(s,maxUnits=22){const chars=[...String(s||'')];let used=0,out='';for(const ch of chars){const w=/[\u2e80-\u9fff\uac00-\ud7af]/.test(ch)?2:1.2;if(used+w>maxUnits-2){return out+'…';}out+=ch;used+=w;}return out;}
 function fullEdges(){return Geo.filteredEdges(state.data,{filter:state.filter,hideWeak:state.hideWeak});}
 function view(){if(!state.data)return{nodes:[],edges:[],positions:new Map(),mode:'empty',omitted:0};
   if(state.focusMode)return Geo.focus(state.data,state.selected,fullEdges());
   return{nodes:state.data.nodes,edges:fullEdges(),positions:state.positions,mode:'overview',omitted:0};
 }
 function boundsFit(){const v=view();const fitted=Geo.fit(v.positions,v.mode==='overview'?Geo.CARD.normal:Geo.CARD.focused);state.scale=fitted.scale;state.tx=fitted.tx;state.ty=fitted.ty;}
 function edgePath(e,v){const a=v.positions.get(e.a),b=v.positions.get(e.b);if(!a||!b)return'';
   const card=v.mode==='overview'?Geo.CARD.normal:Geo.CARD.focused,sign=b.x>=a.x?1:-1;
   // Connect at the actual horizontal card boundaries, not at the center or under a card.
   const x1=a.x+sign*(card.w/2+2),y1=a.y,x2=b.x-sign*(card.w/2+2),y2=b.y;
   const control=Math.max(38,Math.abs(x2-x1)*.36),c1=x1+sign*control,c2=x2-sign*control;
   return `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${c1.toFixed(1)} ${y1.toFixed(1)} ${c2.toFixed(1)} ${y2.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
 }
 function renderNode(n,i,p,v){const focus=v.mode!=='overview',w=focus?228:208,h=focus?104:88,half=w/2;
   const active=state.selected?.type==='node'&&state.selected.id===n.id,
      linked=v.edges.filter(e=>e.a===n.id||e.b===n.id).length;
   const num=state.data.nodes.findIndex(x=>x.id===n.id)+1;
   return `<g class="graph-node" data-node-id="${esc(n.id)}" transform="translate(${p.x} ${p.y})" style="cursor:${focus?'pointer':'grab'}">
     <rect x="-${half}" y="-${h/2}" width="${w}" height="${h}" rx="15" fill="#fff" stroke="${active?'#685cf2':'#dce3f0'}" stroke-width="${active?3:1.5}" />
     <rect x="${-half+12}" y="${-h/2+13}" width="32" height="32" rx="9" fill="#eeedff"/>
     <text x="${-half+28}" y="${-h/2+35}" text-anchor="middle" font-size="16" font-weight="800" fill="#6d61e9">${num}</text>
     <text x="${-half+51}" y="${-h/2+25}" font-size="12" font-weight="800" fill="#22304d">${esc(ellipsis(n.name,focus?24:21))}</text>
     <text x="${-half+51}" y="${-h/2+44}" font-size="10" fill="#94a1b8">${n.chars} 字 · ${n.topics.length} 个主题</text>
     <rect x="${-half+12}" y="${h/2-26}" width="${w-24}" height="16" rx="7" fill="#f7f8fc"/>
     <text x="0" y="${h/2-14}" text-anchor="middle" font-size="10" fill="#73819d">${linked} 个关联文档</text>
     <title>${esc(n.name)}</title></g>`;
 }
 function draw(){if(!state.data)return;const v=view();state.view=v;
  const defs=`<defs><pattern id="relGrid" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#dce3f0" opacity=".75"/></pattern><marker id="relArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#6c7ca4"/></marker></defs>`;
  const selectedEdgeId=state.selected?.type==='edge'?state.selected.id:null;
  const links=v.edges.map(e=>{
    const path=edgePath(e,v),active=e.id===selectedEdgeId,color=colors[e.dominant]||colors.topic;
    if(!path)return'';
    const p=v.positions.get(e.a),q=v.positions.get(e.b),label=v.mode==='edge'||(v.mode==='node'&&v.edges.length<=4);
    return `<g class="relation-edge" data-edge-group="${esc(e.id)}"><path d="${path}" fill="none" stroke="${color}" stroke-width="${active?4:2.6}" stroke-opacity="${active?1:.91}" stroke-linecap="round" ${active?'stroke-dasharray="8 5"':''}/>
      <path d="${path}" data-edge-id="${esc(e.id)}" fill="none" stroke="transparent" stroke-width="22" style="cursor:pointer;pointer-events:stroke" />
      ${label?`<g transform="translate(${((p.x+q.x)/2).toFixed(1)},${((p.y+q.y)/2-12).toFixed(1)})" style="pointer-events:none"><rect x="-24" y="-11" width="48" height="22" rx="10" fill="white" stroke="${color}" stroke-opacity=".3"/><text x="0" y="4" text-anchor="middle" font-size="10" font-weight="700" fill="${color}">${e.total} 项</text></g>`:''}</g>`;
  }).join('');
  const nodes=v.nodes.map((n,i)=>renderNode(n,i,v.positions.get(n.id),v)).join('');
  svg.innerHTML=defs+`<rect width="${W}" height="${H}" fill="#f9fbff"/><rect width="${W}" height="${H}" fill="url(#relGrid)"/>`+
   `<g id="graphWorld" transform="translate(${state.tx.toFixed(2)} ${state.ty.toFixed(2)}) scale(${state.scale.toFixed(3)})">${links}${nodes}</g>`;
  $('graphEmpty').classList.toggle('hidden',v.nodes.length>0);
  const help=$('graphFocusHint');if(help)help.textContent=state.focusMode?(v.mode==='edge'?'单条关系：仅展示两个文档与连线':`文档聚焦：${v.nodes.length} 个节点 · ${v.omitted?`另有 ${v.omitted} 个关联未显示，调整关系筛选或进入总览`:'点击右侧关联可查看双方依据'}`):'完整关系图：可拖动节点，点击某个节点聚焦';
 }
 function inspectorWelcome(){return `<div class="graph-welcome"><span>◇</span><b>选择节点或连线</b><p>点击连线查看字段、资源或主题关系；点击节点查看该文档在关系网中的位置。</p></div>`;}
 function renderInspector(){const holder=$('graphInspector'),data=state.data;if(!data||!state.selected){holder.innerHTML=inspectorWelcome();$('graphInspectHint').textContent='点击节点或连线';return;}
  if(state.selected.type==='node'){
   const node=data.nodes.find(n=>n.id===state.selected.id);if(!node){holder.innerHTML=inspectorWelcome();return;}
   const connected=fullEdges().filter(e=>e.a===node.id||e.b===node.id);
   $('graphInspectHint').textContent='文档节点';holder.innerHTML=`<div class="graph-inspect-title">▤ ${esc(node.name)}</div><p class="graph-inspect-summary">${node.chars} 字 · 当前筛选显示 ${connected.length} 份关联文档</p><button class="graph-open-doc" data-jump-doc="${esc(node.id)}" data-jump-line="1">查看这份文档 ↗</button><h4>识别到的主题</h4><div class="graph-topic-list">${node.topics.map(t=>`<span>${esc(t)}</span>`).join('')||'<span>暂无命中</span>'}</div><h4>关联文档</h4><div class="graph-peer-list">${connected.map(e=>{const other=data.nodes.find(n=>n.id===(e.a===node.id?e.b:e.a));return `<button data-select-edge="${esc(e.id)}"><span>${esc(other?.name||'')}</span><b>${e.total} 条依据</b></button>`;}).join('')||'<p>当前筛选下没有匹配的关联。</p>'}</div>`;
   bindInspector();return;
  }
  const edge=data.edges.find(e=>e.id===state.selected.id);if(!edge){holder.innerHTML=inspectorWelcome();return;}
  const a=data.nodes.find(n=>n.id===edge.a),b=data.nodes.find(n=>n.id===edge.b);
  const details=state.filter==='all'?edge.details:edge.details.filter(d=>state.filter==='conflict'?d.status==='conflict':d.type===state.filter);
  $('graphInspectHint').textContent=`${details.length} 条当前关联依据`;
  const tags=details.map(d=>`<span class="graph-rel-tag ${d.status==='conflict'?'is-conflict':''}">${d.status==='conflict'?'冲突':labels[d.type]}</span>`).join('');
  holder.innerHTML=`<div class="graph-inspect-title">${esc(a?.name||'')} <span>⇄</span> ${esc(b?.name||'')}</div><p class="graph-inspect-summary">当前筛选 ${details.length} 条关联线索${state.filter==='all'?`（含 ${edge.conflicts} 项参数冲突）`:''}；每条均可回到原文核对。</p><div class="graph-rel-tags">${tags}</div>`+
   (details.map(d=>`<article class="graph-rel-detail"><div class="graph-rel-heading"><span class="graph-rel-type ${d.status==='conflict'?'danger':''}">${d.status==='conflict'?'⚠ 规则冲突':esc(labels[d.type])}</span><b>${esc(d.label)}</b></div><p>${esc(d.summary)}</p><div class="graph-evidence"><small>文档 A · ${esc(data.nodes.find(n=>n.id===d.from)?.name||'')} · 第 ${d.fromLine} 行</small><blockquote>${esc(d.fromEvidence)}</blockquote><button data-jump-doc="${esc(d.from)}" data-jump-line="${d.fromLine}">定位 A ↗</button></div><div class="graph-evidence"><small>文档 B · ${esc(data.nodes.find(n=>n.id===d.to)?.name||'')} · 第 ${d.toLine} 行</small><blockquote>${esc(d.toEvidence)}</blockquote><button data-jump-doc="${esc(d.to)}" data-jump-line="${d.toLine}">定位 B ↗</button></div></article>`).join('')||'<p class="graph-inspect-summary">该文档对不包含当前类型的关联，请调整筛选条件。</p>');bindInspector();
 }
 function bindInspector(){document.querySelectorAll('#graphInspector [data-jump-doc]').forEach(b=>b.addEventListener('click',()=>window.GameDocBridge?.openDoc(b.dataset.jumpDoc,Number(b.dataset.jumpLine))));
  document.querySelectorAll('#graphInspector [data-select-edge]').forEach(b=>b.addEventListener('click',()=>select('edge',b.dataset.selectEdge)));}
 function select(type,id){state.selected={type,id};if(state.focusMode)boundsFit();if(type==='node'){const el=$('graphFocusDoc');if(el)el.value=id;}draw();renderInspector();}
 function refresh(docs){const oldIds=state.data?.nodes.map(n=>n.id).join('|');state.data=buildRelations(docs||window.GameDocBridge?.getDocs()||[],window.GameDocCustomization?.getConfig()||{});
  if(oldIds!==state.data.nodes.map(n=>n.id).join('|')){state.positions=Geo.overview(state.data.nodes);state.focusMode=state.data.nodes.length>12;$('graphFocusMode').checked=state.focusMode;}
  const defaultId=state.data.nodes.slice().sort((a,b)=>fullEdges().filter(e=>e.a===b.id||e.b===b.id).length-fullEdges().filter(e=>e.a===a.id||e.b===a.id).length)[0]?.id;
  if(!state.selected||state.selected.type==='edge'&&!state.data.edges.some(e=>e.id===state.selected.id)||state.selected.type==='node'&&!state.data.nodes.some(n=>n.id===state.selected.id))state.selected=defaultId?{type:'node',id:defaultId}:null;
  $('graphNodeCount').textContent=state.data.summary.documents;$('graphEdgeCount').textContent=state.data.summary.pairs;$('graphRelationCount').textContent=state.data.summary.relations;$('graphConflictCount').textContent=state.data.summary.conflictPairs;
  if(state.data.nodes.length>8&&!state.hideWeak){state.hideWeak=true;$('graphHideWeak').checked=true;}
  const dropdown=$('graphFocusDoc');dropdown.innerHTML=`<option value="">选择文档</option>`+state.data.nodes.map(n=>`<option value="${esc(n.id)}">${esc(n.name)}</option>`).join('');
  if(state.selected?.type==='node')dropdown.value=state.selected.id;
  boundsFit();draw();renderInspector();
 }
 function resetView(){state.positions=Geo.overview(state.data?.nodes||[]);if(state.focusMode&&state.selected?.type==='edge'&&!fullEdges().some(e=>e.id===state.selected.id))state.selected={type:'node',id:state.data?.nodes[0]?.id};boundsFit();draw();renderInspector();}
 function screenPoint(event){const r=svg.getBoundingClientRect();return{x:(event.clientX-r.left)*W/r.width,y:(event.clientY-r.top)*H/r.height};}
 function onPointerDown(event){if(event.button!==0)return;const node=event.target.closest('[data-node-id]'),edge=event.target.closest('[data-edge-id]'),id=node?.getAttribute('data-node-id');state.gesture={type:id?'node':edge?'edge':'pan',id:id||edge?.getAttribute('data-edge-id'),start:screenPoint(event),last:screenPoint(event),moved:false};svg.setPointerCapture?.(event.pointerId);}
 function onPointerMove(event){const g=state.gesture;if(!g||g.type==='edge')return;const p=screenPoint(event),dx=p.x-g.last.x,dy=p.y-g.last.y;if(Math.hypot(p.x-g.start.x,p.y-g.start.y)>4)g.moved=true;if(!g.moved)return;
  if(g.type==='node'&&!state.focusMode){const old=state.positions.get(g.id);if(old){const next={x:old.x+dx/state.scale,y:old.y+dy/state.scale};if(Geo.canMove(g.id,next,state.positions))state.positions.set(g.id,next);}}
  else if(g.type==='pan'){state.tx+=dx;state.ty+=dy;}
  g.last=p;draw();}
 function onPointerUp(event){const g=state.gesture;if(!g)return;state.gesture=null;try{svg.releasePointerCapture?.(event.pointerId);}catch{}
  if(!g.moved&&g.type==='node')select('node',g.id);if(!g.moved&&g.type==='edge')select('edge',g.id);}
 function onWheel(event){event.preventDefault();const p=screenPoint(event),b=(p.x-state.tx)/state.scale,bY=(p.y-state.ty)/state.scale;state.scale=Math.max(.32,Math.min(2.6,state.scale*(event.deltaY>0?.9:1.1)));state.tx=p.x-b*state.scale;state.ty=p.y-bY*state.scale;draw();}
 function download(name,content,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
 function exportSvg(){if(!state.data?.nodes.length){toast('没有可导出的画布');return;}const clone=svg.cloneNode(true);clone.setAttribute('xmlns','http://www.w3.org/2000/svg');clone.setAttribute('width',W);clone.setAttribute('height',H);download('GameDoc-文档关联图.svg','<?xml version="1.0" encoding="UTF-8"?>\n'+new XMLSerializer().serializeToString(clone),'image/svg+xml;charset=utf-8');}
 function bind(){svg.addEventListener('pointerdown',onPointerDown);svg.addEventListener('pointermove',onPointerMove);svg.addEventListener('pointerup',onPointerUp);svg.addEventListener('pointercancel',()=>{state.gesture=null;});svg.addEventListener('wheel',onWheel,{passive:false});
  $('graphRefresh').addEventListener('click',()=>{refresh(window.GameDocBridge?.getDocs()||[]);toast('已根据当前文档重新识别关联');});
  $('graphReset').addEventListener('click',resetView);
  $('graphType').addEventListener('change',e=>{state.filter=e.target.value;if(state.selected?.type==='edge'&&!fullEdges().some(x=>x.id===state.selected.id))state.selected={type:'node',id:state.data.nodes[0]?.id};boundsFit();draw();renderInspector();});
  $('graphHideWeak').addEventListener('change',e=>{state.hideWeak=e.target.checked;boundsFit();draw();renderInspector();});
  $('graphFocusMode').addEventListener('change',e=>{state.focusMode=e.target.checked;if(state.focusMode&&!state.selected)state.selected={type:'node',id:state.data.nodes[0]?.id};boundsFit();draw();renderInspector();});
  $('graphFocusDoc').addEventListener('change',e=>{if(!e.target.value)return;state.focusMode=true;$('graphFocusMode').checked=true;select('node',e.target.value);});
  $('graphExportSvg').addEventListener('click',exportSvg);
  $('graphExportJson').addEventListener('click',()=>{if(!state.data)return;download('GameDoc-关联分析.json',JSON.stringify(state.data,null,2),'application/json;charset=utf-8');});
 }
 bind();window.GameDocGraph={refresh,resetView,select,getView:()=>state.view};
})();
