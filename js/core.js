(function(root){
 const text=p=>Object.values(p.i18n||{}).map(v=>`${v.title} ${v.description||''}`).join(' ').toLowerCase();
 const score=(p,q)=>text(p).includes((q||'').toLowerCase())?1:0;
 const api={
 filterProducts(products,f={}){return products.filter(p=>{
 if(f.category&&p.category_id!==f.category)return false;
 if(f.subcategory&&p.subcategory_id!==f.subcategory)return false;
 if(f.q&&!text(p).includes(f.q.trim().toLowerCase()))return false;
 if(f.cert?.length&&!f.cert.some(c=>p.certifications?.some(v=>v.type===c)))return false;
 return Object.entries(f.params||{}).every(([k,v])=>{const val=p.parameters?.[k]??p.compliance?.[k];if(Array.isArray(v))return !v.length||v.includes(String(val));if(v&&typeof v==='object'){if(val==null||val==='')return false;const n=Number(val);return Number.isFinite(n)&&(v.min===''||v.min==null||n>=Number(v.min))&&(v.max===''||v.max==null||n<=Number(v.max))}return !v||String(val)===v});
 })},
 sortProducts(products,sort,q){return [...products].sort((a,b)=>sort==='price'?(Number(a.trade?.price_min)||0)-(Number(b.trade?.price_min)||0):sort==='relevance'?score(b,q)-score(a,q):Date.parse(b.updated_at)-Date.parse(a.updated_at))},
 validateProduct(p){const e=[];for(const l of ['zh','en'])for(const k of ['title','description'])if(!p.i18n?.[l]?.[k]?.trim())e.push(`${k}_${l}`);if(p.category_id==='coatings')for(const k of ['afs','voc','msds','un_number','hazard_class','transport'])if(!String(p.compliance?.[k]??'').trim())e.push(k);return e},
 viewRfq(r){return {...r,status:r.status==='submitted'?'viewed':r.status}},
 replyRfq(r,message,attachments=[]){if(!message.trim())throw Error('empty reply');return {...r,status:'replied',reply:{message:message.trim(),attachments,created_at:new Date().toISOString()}}},
 readArray(storage,key){const value=JSON.parse(storage.getItem(key)||'[]');if(!Array.isArray(value))throw Error('invalid storage');return value},
 writeArray(storage,key,value){storage.setItem(key,JSON.stringify(value));return true}
 };root.MarineCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
