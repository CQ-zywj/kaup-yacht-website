const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../js/suppliers-core.js');
test('supplier directory deduplicates companies and counts actual listings across industries',()=>{
 const s={id:'s1',name:{zh:'企业',en:'Example'},country:'China',products_count:99};
 const p=[{id:'a',category_id:'marine',supplier:s},{id:'b',category_id:'bearing',supplier:s},{id:'a',category_id:'marine',supplier:s}];
 const rows=D.collect(p,c=>c);
 assert.equal(rows.length,1);assert.equal(rows[0].products.length,2);assert.deepEqual(rows[0].industries,['marine','bearing']);
});
test('directory searches both languages, filters industries and clamps stale page URLs',()=>{
 const rows=Array.from({length:14},(_,i)=>({id:String(i),name:{zh:'轴承企业'+i,en:'Bearing Supplier '+i},country:'China',industries:['bearings']}));
 assert.equal(D.search(rows,{q:'轴承',industry:'bearings',page:2}).items.length,6);
 assert.equal(D.search(rows,{q:'bearing',page:99}).page,3);
 assert.equal(D.search(rows,{industry:'marine',page:2}).total,0);
 assert.equal(D.search(rows,{q:' SUPPLIER 13 '}).items[0].id,'13');
});
