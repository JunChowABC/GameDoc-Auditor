/* GameDoc Auditor — reconstructed focus layout based on the V0.8 feature specification.
 * Pure geometry; works in browsers and Node.js without dependencies.
 */
(function(root, factory) {
  const api=factory();
  if (typeof module!=='undefined' && module.exports) module.exports=api;
  root.GameDocGraphLayout=api;
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const VW=1080, VH=650;
 const MAX_PEERS=8;
 const CARD={normal:{w:208,h:88},focused:{w:228,h:104}};
 function overview(nodes){
   const count=nodes.length, cols=count<=2?count:Math.min(5,Math.ceil(Math.sqrt(count*1.45))), rows=Math.ceil(count/Math.max(cols,1));
   const gapX=238,gapY=133,originX=142,originY=118;
   const map=new Map();
   for(let i=0;i<count;i++)map.set(nodes[i].id,{x:originX+(i%cols)*gapX,y:originY+Math.floor(i/cols)*gapY});
   return map;
 }
 function filteredEdges(data,{filter='all',hideWeak=false}={}){
   if(!data) return [];
   return data.edges.filter(e=>(!hideWeak||e.strong)&&(
     filter==='all'||filter==='conflict'&&e.conflicts>0||
     e.details.some(d=>d.type===filter)
   ));
 }
 function focus(data,selection,edges,maxPeers=MAX_PEERS){
   if(!data?.nodes?.length)return{positions:new Map(),nodes:[],edges:[],omitted:0,mode:'empty'};
   const allNodes=data.nodes;
   if(selection?.type==='edge'){
      const edge=edges.find(e=>e.id===selection.id);
      if(edge){return{positions:new Map([[edge.a,{x:285,y:325}],[edge.b,{x:795,y:325}]]),nodes:allNodes.filter(n=>n.id===edge.a||n.id===edge.b),edges:[edge],omitted:0,mode:'edge'};}
   }
   const center=allNodes.find(n=>n.id===selection?.id)||allNodes[0];
   const candidates=edges.filter(e=>e.a===center.id||e.b===center.id).sort((a,b)=>b.conflicts-a.conflicts||b.explicit-a.explicit||b.strong-a.strong||b.total-a.total);
   const active=candidates.slice(0,maxPeers),positions=new Map([[center.id,{x:540,y:325}]]);
   const left=active.filter((_,i)=>i%2===0),right=active.filter((_,i)=>i%2===1);
   function add(side,x){for(let i=0;i<side.length;i++){
      const e=side[i],peer=e.a===center.id?e.b:e.a;
      positions.set(peer,{x,y:325+(i-(side.length-1)/2)*138});
   }}
   add(left,183);add(right,897);
   return{positions,nodes:allNodes.filter(n=>positions.has(n.id)),edges:active,omitted:Math.max(0,candidates.length-active.length),mode:'node',center:center.id};
 }
 function intersects(a,b,card=CARD.normal,padding=18){return Math.abs(a.x-b.x)<card.w+padding&&Math.abs(a.y-b.y)<card.h+padding;}
 function canMove(nodeId,p,positions,card=CARD.normal){for(const [key,other] of positions){if(key!==nodeId&&intersects(p,other,card))return false;}return true;}
 function fit(positions,card=CARD.normal){const pts=[...positions.values()];if(!pts.length)return{scale:1,tx:0,ty:0};
   const minX=Math.min(...pts.map(p=>p.x))-card.w/2-35,maxX=Math.max(...pts.map(p=>p.x))+card.w/2+35;
   const minY=Math.min(...pts.map(p=>p.y))-card.h/2-35,maxY=Math.max(...pts.map(p=>p.y))+card.h/2+35;
   const scale=Math.min(1, (VW-44)/(maxX-minX),(VH-44)/(maxY-minY));
   return{scale,tx:(VW-(minX+maxX)*scale)/2,ty:(VH-(minY+maxY)*scale)/2};
 }
 return{VW,VH,MAX_PEERS,CARD,overview,filteredEdges,focus,intersects,canMove,fit};
});
