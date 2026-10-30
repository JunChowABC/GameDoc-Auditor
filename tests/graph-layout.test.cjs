const test=require('node:test');
const assert=require('node:assert/strict');
const G=require('../dist/graph-layout.js');
function dataset(n){const nodes=Array.from({length:n},(_,i)=>({id:`d${i}`,name:`文档${i}`}));const edges=nodes.slice(1).map((n,i)=>({id:`edge-${i}`,a:'d0',b:n.id,conflicts:0,explicit:1,strong:1,total:2,details:[{type:'reference'}]}));return{nodes,edges};}
function noOverlaps(nodes,coords,card){for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++)assert.equal(G.intersects(coords.get(nodes[i].id),coords.get(nodes[j].id),card,0),false,`nodes ${i},${j} overlap`);}
for (const n of [1,2,7,12,21,30,50]){
 test(`Overview layout ${n} nodes has no overlap and fits view`,()=>{
   const data=dataset(n),map=G.overview(data.nodes);assert.equal(map.size,n);noOverlaps(data.nodes,map,G.CARD.normal);
   const ft=G.fit(map); assert.ok(ft.scale>0&&ft.scale<=1);
   for(let i of map.values())assert.ok(i.x*ft.scale+ft.tx>=G.CARD.normal.w/2*ft.scale&&i.x*ft.scale+ft.tx<=1080-G.CARD.normal.w/2*ft.scale);
 });
 test(`Focused layout ${n} nodes shows <=8 neighbors without overlap`,()=>{
   const data=dataset(n),v=G.focus(data,{type:'node',id:'d0'},data.edges);assert.equal(v.nodes.length,Math.min(n,9));assert.ok(v.edges.length<=8);noOverlaps(v.nodes,v.positions,G.CARD.focused);
   assert.equal(v.omitted,Math.max(0,n-1-8));
 });
}
test('edge focus keeps exactly two nodes and one edge',()=>{
 const data=dataset(21);const v=G.focus(data,{type:'edge',id:'edge-2'},data.edges);
 assert.equal(v.nodes.length,2);assert.equal(v.edges.length,1);assert.equal(v.mode,'edge');noOverlaps(v.nodes,v.positions,G.CARD.focused);
});
test('drag collision prevention',()=>{
 const data=dataset(7),map=G.overview(data.nodes);assert.equal(G.canMove('d1',map.get('d0'),map),false);assert.equal(G.canMove('d1',{x:5000,y:5000},map),true);
});
test('weak topic and conflict edge filters',()=>{
 const data=dataset(3);data.edges[0].strong=0;data.edges[1].conflicts=1;
 assert.equal(G.filteredEdges(data,{hideWeak:true}).length,1);
 assert.equal(G.filteredEdges(data,{filter:'conflict'}).length,1);
});
