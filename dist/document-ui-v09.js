/* GameDoc UI enhancement, dependency-free. Add AFTER app.js/graph.js. MIT. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const editor=$('docTabs')?.closest('.editor-panel');
if(!editor||!$('docInput')||!$('uploadFeedback'))return;
let readerOpen=false, lastMarkdown=null;
const safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Render source markup as text, never as executable HTML. External images are not fetched.
function inline(raw){
 let s=safe(raw);const stash=[];
 const keep=html=>{const id=stash.length;stash.push(html);return '\uE000'+id+'\uE001';};
 s=s.replace(/`([^`\n]+)`/g,(_,c)=>keep('<code>'+c+'</code>'));
 s=s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,(_,alt)=>keep('<span title="图片未加载">▧ '+alt+'</span>'));
 s=s.replace(/\[([^\]]+)\]\(([^)]+)\)/g,(_,label,url)=>{
  const u=url.replace(/&amp;/g,'&').trim();
  if(!/^(https?:\/\/|mailto:|#)/i.test(u))return label;
  return keep('<a href="'+safe(u)+'" target="_blank" rel="noopener noreferrer">'+label+'</a>');
 });
 s=s.replace(/\*\*(.+?)\*\*|__(.+?)__/g,(_,a,b)=>'<strong>'+(a||b)+'</strong>');
 s=s.replace(/~~(.+?)~~/g,'<del>$1</del>');
 s=s.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g,'<em>$1</em>');
 s=s.replace(/(?<!_)_([^_\n]+)_(?!_)/g,'<em>$1</em>');
 return s.replace(/\uE000(\d+)\uE001/g,(_,n)=>stash[Number(n)]||'');
}
function cells(s){
 let t=s.trim();if(t.startsWith('|'))t=t.slice(1);if(t.endsWith('|')&&!t.endsWith('\\|'))t=t.slice(0,-1);
 const result=[];let word='',code=false;
 for(let i=0;i<t.length;i++){
  const c=t[i];
  if(c==='\\'&&i+1<t.length){word+=t[++i];continue;}
  if(c==='`')code=!code;
  if(c==='|'&&!code){result.push(word.trim());word='';}else word+=c;
 }
 result.push(word.trim());return result;
}
function tableSeparator(s){const vals=cells(s);return vals.length>0&&vals.every(t=>/^:?-{3,}:?$/.test(t.replace(/\s+/g,'')));}
function parseTable(lines,i){
 const headers=cells(lines[i]);const align=cells(lines[i+1]).map(c=>c.startsWith(':')?(c.endsWith(':')?'center':'left'):(c.endsWith(':')?'right':'left'));
 let html='<div class="md-table-scroll" role="region" aria-label="表格（可横向滚动）" tabindex="0"><table><thead><tr>';
 headers.forEach((v,j)=>html+='<th style="text-align:'+align[j]+'">'+inline(v)+'</th>');html+='</tr></thead><tbody>';i+=2;
 while(i<lines.length&&lines[i].trim()&&lines[i].includes('|')){
  const row=cells(lines[i]);html+='<tr>';
  headers.forEach((_,j)=>html+='<td style="text-align:'+align[j]+'">'+inline(row[j]||'')+'</td>');html+='</tr>';i++;
 }
 return {html:html+'</tbody></table></div>',next:i};
}
function renderMarkdown(markdown){
 const lines=String(markdown||'').replace(/\r\n?/g,'\n').split('\n');const out=[];
 let i=0,code=false,fence='',codeLines=[],list='',quote=[];
 const closeList=()=>{if(list){out.push('</'+list+'>');list='';}};
 const flushQuote=()=>{if(quote.length){out.push('<blockquote><p>'+inline(quote.join(' '))+'</p></blockquote>');quote=[];}};
 const flushCode=()=>{if(code){out.push('<pre><code>'+safe(codeLines.join('\n'))+'</code></pre>');code=false;fence='';codeLines=[];}};
 while(i<lines.length){const line=lines[i],trim=line.trim();
  if(code){if(trim.startsWith(fence)){flushCode();}else codeLines.push(line);i++;continue;}
  const mFence=trim.match(/^(`{3,}|~{3,})(.*)$/);
  if(mFence){closeList();flushQuote();code=true;fence=mFence[1][0].repeat(mFence[1].length);codeLines=[];i++;continue;}
  if(!trim){closeList();flushQuote();i++;continue;}
  if(/^>\s?/.test(trim)){closeList();quote.push(trim.replace(/^>\s?/,''));i++;continue;}else flushQuote();
  if(lines[i+1]&&line.includes('|')&&tableSeparator(lines[i+1])){closeList();const t=parseTable(lines,i);out.push(t.html);i=t.next;continue;}
  const mh=trim.match(/^(#{1,6})\s+(.+?)(?:\s+#+)?$/);
  if(mh){closeList();const n=mh[1].length;out.push('<h'+n+'>'+inline(mh[2])+'</h'+n+'>');i++;continue;}
  if(/^([-*_]\s*){3,}$/.test(trim)){closeList();out.push('<hr>');i++;continue;}
  const li=trim.match(/^([-+*]|\d+[.)])\s+(.+)$/);
  if(li){const type=/\d/.test(li[1][0])?'ol':'ul';if(list!==type){closeList();out.push('<'+type+'>');list=type;}
   let content=li[2].replace(/^\[([ xX])\]\s+/,(_,v)=>'<span class="md-task">'+(v===' '?'☐':'☑')+'</span>');
   if(li[2]!==content){const tag=content.match(/^<span class="md-task">.*?<\/span>/)?.[0]||'';content=tag+inline(content.slice(tag.length));}else content=inline(content);
   out.push('<li>'+content+'</li>');i++;continue;
  }
  closeList();
  // Paragraphs end on blank lines, headings, table starts, lists or code fences.
  const block=[trim];i++;
  while(i<lines.length&&lines[i].trim()&& !/^(?:#{1,6}\s|>|[-+*]\s|\d+[.)]\s|`{3}|~{3})/.test(lines[i].trim()) && !(lines[i].includes('|')&&lines[i+1]&&tableSeparator(lines[i+1]))) {block.push(lines[i].trim());i++;}
  out.push('<p>'+inline(block.join(' '))+'</p>');
 }
 closeList();flushQuote();flushCode();
 return out.join('\n')||'<p class="md-empty">当前文档没有内容。</p>';
}
const head=editor.querySelector('.panel-head'),foot=editor.querySelector('.panel-foot'),nav=document.createElement('aside'),body=document.createElement('div'),layout=document.createElement('div');
layout.className='doc-workspace';nav.className='doc-navigator';body.className='doc-body';
const tabs=$('docTabs');nav.innerHTML='<div class="doc-navigator-header"><b>文档列表</b><span id="docNavigatorCount">0</span></div><input class="doc-search" id="docSearch" type="search" autocomplete="off" placeholder="搜索文档名称" aria-label="搜索文档" />';
const meta=editor.querySelector('.editor-meta'),mode=editor.querySelector('.tabs'),edit=$('editPane'),lines=$('previewPane');
if(!head||!foot||!meta||!mode||!edit||!lines)return;
head.after(layout);layout.append(nav,body);nav.append(tabs);body.append(meta,mode,edit,lines);
const read=document.createElement('div');read.className='doc-markdown-pane hidden';read.id='markdownPane';
const content=document.createElement('article');content.id='markdownContent';content.className='doc-markdown-body';read.append(content);body.append(read);
const readerBtn=document.createElement('button');readerBtn.className='tab';readerBtn.type='button';readerBtn.id='markdownTab';readerBtn.textContent='Markdown 阅读';readerBtn.setAttribute('aria-label','Markdown 阅读（含表格）');
mode.insertBefore(readerBtn,mode.querySelector('.tab-fill')||null);
const search=$('docSearch');
function filterDocs(){const query=search.value.trim().toLowerCase();let count=0;tabs.querySelectorAll('.doc-chip').forEach(b=>{const ok=!query||(b.title||b.textContent||'').toLowerCase().includes(query);b.hidden=!ok;if(ok)count++;});$('docNavigatorCount').textContent=tabs.querySelectorAll('.doc-chip').length;let empty=nav.querySelector('.doc-empty');if(!count){if(!empty){empty=document.createElement('div');empty.className='doc-empty';empty.textContent='未找到匹配文档';nav.append(empty);}}else empty?.remove();}
function updateReader(){const text=$('docInput').value;if(text===lastMarkdown)return;lastMarkdown=text;content.innerHTML=renderMarkdown(text);read.scrollTop=0;}
function showReader(){readerOpen=true;edit.classList.add('hidden');lines.classList.add('hidden');read.classList.remove('hidden');mode.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b===readerBtn));updateReader();}
function hideReader(){readerOpen=false;read.classList.add('hidden');readerBtn.classList.remove('active');}
readerBtn.addEventListener('click',showReader);
mode.querySelectorAll('[data-editor-tab]').forEach(btn=>btn.addEventListener('click',hideReader));
window.addEventListener('gamedoc:doc-switched',()=>{filterDocs();if(readerOpen)updateReader();});
search.addEventListener('input',filterDocs);
$('docName').addEventListener('input',()=>queueMicrotask(filterDocs));
const listObserver=new MutationObserver(()=>{filterDocs();if(readerOpen)queueMicrotask(updateReader);});
listObserver.observe(tabs,{childList:true});
const feedback=$('uploadFeedback');
const uploadObserver=new MutationObserver(()=>{const header=feedback.querySelector('.upload-feedback-title strong');
 if(header?.textContent?.includes('本次导入结果') && feedback.querySelector('.upload-feedback-item.is-success')){
  if(!readerOpen)showReader();else updateReader();
 }
});
uploadObserver.observe(feedback,{childList:true,subtree:false});
filterDocs();
window.GameDocMarkdownView={renderMarkdown,show:showReader,hide:hideReader};
})();
