/* Customer profiles are supplier-private overlays; inquiry history is never written here. */
(function(root){
  const fields=['company','country','contact','email','phone','notes'];
  const storageKey=id=>'customer_profiles:'+encodeURIComponent(id);
  function fail(key){throw Error(key);}
  function read(storage,id){
    try {
      const raw=storage.getItem(storageKey(id));
      const rows=raw===null?[]:JSON.parse(raw);
      if(!Array.isArray(rows)) fail('customerDataError');
      const seen=new Set();
      for(const row of rows){
        if(!row||typeof row.key!=='string'||!row.key||seen.has(row.key)||row.supplier_id!==id||!['manual','inquiry'].includes(row.kind)||fields.some(f=>typeof row[f]!=='string')||typeof row.hidden!=='boolean'||!row.company.trim()||(row.kind==='manual'?!row.key.startsWith('manual:'):!row.key.startsWith('inquiry:'))) fail('customerDataError');
        seen.add(row.key);
      }
      return rows;
    } catch {fail('customerDataError');}
  }
  function guard(storage,id){
    let user;
    try {user=JSON.parse(storage.getItem('current_user'));}catch{}
    if(!id||user?.role!=='supplier'||user.id!==id) fail('customerSession');
  }
  function text(v){return typeof v==='string'?v.trim():'';}
  function inquiryKey(row){
    const buyer=row.buyer||{}; const id=row.buyer_id||buyer.id;
    return 'inquiry:'+JSON.stringify(id?['id',String(id)]:['company',text(buyer.company),text(buyer.country)]);
  }
  function list(storage,id,inquiries=[],query=''){
    const records=read(storage,id);const map=new Map();
    if(!Array.isArray(inquiries)||inquiries.some(r=>!r||typeof r!=='object'||Array.isArray(r))) fail('customerDataError');
    for(const row of inquiries){
      if(row.supplier_id&&row.supplier_id!==id) continue;
      const key=inquiryKey(row);const buyer=row.buyer||{};
      if(!map.has(key))map.set(key,{key,kind:'inquiry',supplier_id:id,company:text(buyer.company)||'—',country:text(buyer.country),contact:text(buyer.contact)||text(buyer.name),email:text(buyer.email),phone:text(buyer.phone),notes:'',rows:[]});
      map.get(key).rows.push(row);
    }
    for(const record of records){
      const derived=map.get(record.key);
      map.set(record.key,{...derived,...record,rows:derived?.rows||[]});
    }
    const needle=text(query).toLocaleLowerCase();
    return [...map.values()].filter(row=>!row.hidden&&(!needle||fields.some(f=>row[f].toLocaleLowerCase().includes(needle))))
      .sort((a,b)=>a.company.localeCompare(b.company));
  }
  function validate(data){
    const result=Object.fromEntries(fields.map(f=>[f,text(data[f])]));
    if(!result.company) fail('customerCompanyRequired');
    if(result.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) fail('validEmail');
    if(fields.some(f=>result[f].length>(f==='notes'?5000:300))) fail('customerTooLong');
    return result;
  }
  function save(storage,id,key,data,inquiries=[]){
    guard(storage,id); const records=read(storage,id); const value=validate(data);
    const previous=key?list(storage,id,inquiries).find(r=>r.key===key):null;
    if(key&&!previous) fail('customerMissing');
    const record={...value,key:key||'manual:'+(root.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)),supplier_id:id,kind:previous?.kind||'manual',hidden:false};
    const next=records.filter(r=>r.key!==record.key);next.push(record);
    guard(storage,id);storage.setItem(storageKey(id),JSON.stringify(next));return record;
  }
  function remove(storage,id,key,inquiries=[]){
    guard(storage,id);const records=read(storage,id);
    const previous=list(storage,id,inquiries).find(r=>r.key===key);if(!previous) fail('customerMissing');
    const next=records.filter(r=>r.key!==key);
    if(previous.kind==='inquiry')next.push({...Object.fromEntries(fields.map(f=>[f,previous[f]])),key,supplier_id:id,kind:'inquiry',hidden:true});
    guard(storage,id);storage.setItem(storageKey(id),JSON.stringify(next));
  }
  const api={storageKey,list,save,remove,validate};root.CustomerCore=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
