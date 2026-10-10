(function(root){
  const directory={
    collect(products,industryForCategory){
      const rows=new Map();
      for(const p of products){
        const id=p.supplier_id||p.supplier?.id;
        if(!id||!p.supplier)continue;
        if(!rows.has(id))rows.set(id,{id,name:p.supplier.name,country:p.supplier.country||'',verified:!!p.supplier.verified,industries:[],products:[]});
        const row=rows.get(id),industry=industryForCategory(p.category_id);
        if(industry&&!row.industries.includes(industry))row.industries.push(industry);
        if(!row.products.some(x=>x.id===p.id))row.products.push(p);
      }
      return [...rows.values()];
    },
    search(rows,{q='',industry='',page=1}={},size=6){
      const needle=q.trim().toLocaleLowerCase();
      const matches=rows.filter(s=>(!industry||s.industries.includes(industry))&&(!needle||[s.name?.zh,s.name?.en,s.country].some(v=>String(v||'').toLocaleLowerCase().includes(needle))));
      const pages=Math.max(1,Math.ceil(matches.length/size));
      const current=Math.min(pages,Math.max(1,Math.floor(Number(page)||1)));
      return {total:matches.length,pages,page:current,items:matches.slice((current-1)*size,current*size)};
    }
  };
  if(typeof module==='object'&&module.exports)module.exports=directory;
  else root.SupplierDirectory=directory;
})(typeof window==='undefined'?globalThis:window);
