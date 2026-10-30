/* GameDoc Auditor · local text, Word and PDF extraction; no document upload to servers. */
(function(){
 'use strict';
 const TYPES={'.md':'Markdown','.txt':'TXT','.json':'JSON','.docx':'Word','.pdf':'PDF'};
 const LIMIT=12*1024*1024,MAX_PDF_PAGES=120;
 const typeOf=name=>String(name||'').toLowerCase().match(/\.[a-z0-9]+$/)?.[0]||'';
 let mammothPromise=null,pdfPromise=null;
 function loadMammoth(){if(window.mammoth)return Promise.resolve(window.mammoth);
  if(!mammothPromise)mammothPromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='./vendor/mammoth.browser.min.js';script.async=true;
    script.onload=()=>window.mammoth?resolve(window.mammoth):reject(new Error('Word 解析模块加载失败'));
    script.onerror=()=>reject(new Error('Word 解析模块加载失败，请检查静态资源是否完整'));
    document.head.appendChild(script);
  }).catch(error=>{mammothPromise=null;throw error;});
  return mammothPromise;
 }
 function loadPdf(){if(!pdfPromise)pdfPromise=import('./vendor/pdf.mjs').then(lib=>{
    lib.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdf.worker.mjs',document.baseURI).href;return lib;
  }).catch(error=>{pdfPromise=null;throw new Error('PDF 解析模块加载失败，请检查静态资源是否完整');});return pdfPromise;}
 function reconstructPage(items){const lines=[];let current='',lastY=null;
  const flush=()=>{if(current.trim())lines.push(current.trim());current='';};
  for(const item of items){if(typeof item.str!=='string'||!item.str)continue;
    const y=Array.isArray(item.transform)?Number(item.transform[5]):null;
    if(lastY!==null&&y!==null&&Number.isFinite(y)&&Math.abs(y-lastY)>2.5)flush();
    const chunk=item.str.replace(/[\r\n]+/g,' ').trim();if(chunk){
      const spacing=current&&/[A-Za-z0-9]$/.test(current)&&/^[A-Za-z0-9]/.test(chunk)?' ':'';
      current+=spacing+chunk;
    }
    if(y!==null&&Number.isFinite(y))lastY=y;
    if(item.hasEOL){flush();lastY=null;}
  }
  flush();return lines.join('\n');
 }
 async function parsePdf(file,onProgress){const lib=await loadPdf(),buffer=await file.arrayBuffer();let task,pdf;
  try{task=lib.getDocument({data:new Uint8Array(buffer),cMapUrl:new URL('./vendor/cmaps/',document.baseURI).href,cMapPacked:true,standardFontDataUrl:new URL('./vendor/standard_fonts/',document.baseURI).href});pdf=await task.promise;
    if(pdf.numPages>MAX_PDF_PAGES)throw new Error(`PDF 共 ${pdf.numPages} 页，超过当前单文件 ${MAX_PDF_PAGES} 页限制`);
    const pages=[];let empty=0;
    for(let p=1;p<=pdf.numPages;p++){
      onProgress?.(`正在读取 PDF 第 ${p}/${pdf.numPages} 页`);
      const page=await pdf.getPage(p),content=await page.getTextContent(),text=reconstructPage(content.items);
      if(!text.trim())empty++;pages.push(`# 第 ${p} 页\n${text}`);page.cleanup();
    }
    const result=pages.join('\n\n');if(result.replace(/# 第 \d+ 页/g,'').trim().length<10)throw new Error('没有识别到可审校文字，可能是扫描版 PDF。请先进行 OCR 转文字后上传');
    return {text:result,warning:empty?`${empty}/${pdf.numPages} 页未提取到文字，可能为扫描页；本工具不提供 OCR。`:`PDF ${pdf.numPages} 页已提取为文本，行号以提取结果为准。`};
  }catch(error){if(error?.name==='PasswordException')throw new Error('PDF 已加密，请先使用有权限的方式解除密码保护再导入');if(error?.name==='InvalidPDFException')throw new Error('不是有效的 PDF 文件');throw error;
  }finally{await pdf?.destroy?.();}
 }
 async function parseWord(file){const mammoth=await loadMammoth();const out=await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});
  const text=String(out.value||'').trim();if(!text)throw new Error('Word 文档没有可读取的文字，可能只包含图片');
  return {text,warning:'Word 已转成纯文本；表格样式、图片和复杂排版不会保留。'};
 }
 async function readFile(file,onProgress){const ext=typeOf(file?.name);if(!TYPES[ext])throw new Error('不支持该格式。请选择 .docx / .pdf / .md / .txt / .json');
  if(file.size>LIMIT)throw new Error('文件超过 12 MB 限制');if(file.size===0)throw new Error('文件为空');
  if(ext==='.docx')return parseWord(file);
  if(ext==='.pdf')return parsePdf(file,onProgress);
  const text=(await file.text()).replace(/^\uFEFF/,'');if(!text.trim())throw new Error('文件没有可读取的文字');return {text,warning:''};
 }
 window.GameDocImporter={readFile,typeOf,TYPES,LIMIT,MAX_PDF_PAGES,reconstructPage};
})();
