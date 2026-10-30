/* Local import: preview, correct, explicitly confirm, then persist drafts. */
(function () {
 const shell=SupplierShell.mount("consoleBulk"); if(!shell)return;
 const {body,id,profile}=shell, B=BulkCore, COLUMNS=B.columns.map(k=>[k,k!=="incoterms"&&k!=="image"]), INCOTERMS=["EXW","FOB","CIF","DAP"];
 let parsed=null, matrix=null, workbook=null, revision=0, mode='table';
 const tr=k=>U.tr(k), e=v=>U.e(String(v??''));
 function authorized(){try{const user=JSON.parse(localStorage.getItem('current_user')||'null');return user?.role==='supplier'&&user.id===id;}catch{return false;}}
  function validateRow(record, line) {
    const errors = [];
    const category = U.cat(record.category_id);
    if (!category) errors.push("category_id");
    if (category && !category.subcategories.some((s) => s.id === record.subcategory_id))
      errors.push("subcategory_id");
    ["title_zh", "title_en", "description_zh", "description_en", "unit"].forEach((key) => {
      if (!String(record[key] || "").trim()) errors.push(key);
    });
    const numbers = {
      moq: Number(record.moq),
      lead_time: Number(record.lead_time),
      price_min: Number(record.price_min),
      price_max: Number(record.price_max),
    };
    Object.entries(numbers).forEach(([key, value]) => {
      if (!Number.isFinite(value) || value <= 0) errors.push(key);
    });
    if (
      Number.isFinite(numbers.price_min) &&
      Number.isFinite(numbers.price_max) &&
      numbers.price_max < numbers.price_min
    )
      errors.push("price_max");
    const incoterms = String(record.incoterms || "").trim().toUpperCase() || "FOB";
    if (!INCOTERMS.includes(incoterms)) errors.push("incoterms");
    return {
      line,
      record,
      errors: [...new Set(errors)],
      numbers,
      incoterms,
      valid: errors.length === 0,
    };
  }

  function rowToProduct(row) {
    const record = row.record;
    const category = record.category_id;
    return {
      id: "draft-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      industry_id: MarineCore.industryForCategory(category),
      category_id: category,
      subcategory_id: record.subcategory_id,
      i18n: {
        zh: { title: record.title_zh, description: record.description_zh },
        en: { title: record.title_en, description: record.description_en },
      },
      media: [record.image || "assets/media/" + category + ".jpg"],
      parameters: {},
      compliance: {},
      certifications: [],
      supplier_id: id,
      supplier: {
        ...MarineAccounts.supplier(profile),
        products_count: 1,
      },
      trade: {
        moq: row.numbers.moq,
        lead_time: row.numbers.lead_time,
        price_min: row.numbers.price_min,
        price_max: row.numbers.price_max,
        unit: record.unit,
        incoterms: [row.incoterms],
        currency: "USD",
      },
      status: "draft",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }


 function invalidate(){revision++;parsed=null;document.getElementById('bulk-summary').innerHTML='';document.getElementById('bulk-preview').innerHTML='';}
 function render(){body.innerHTML=`<div class="console-head"><div><h2>${tr('bulkTitle')}</h2><p>${tr('bulkLocalHint')}</p></div><div class="bulk-head-links"><a class="text-link" href="${U.url('publish.html')}">← ${tr('backToPublish')}</a><a class="button secondary" href="${U.url('supplier.html')}">${tr('myProducts')}</a></div></div>
 <div class="bulk-mode"><button class="button" id="mode-table">${tr('bulkTableMode')}</button><button class="button secondary" id="mode-materials">${tr('bulkMaterialsMode')}</button></div>
 <section class="panel" id="bulk-table"><h3>${tr('bulkStep1')}</h3><button class="button secondary" id="bulk-download">${tr('bulkDownload')}</button><div class="field"><label for="bulk-file">CSV / Excel (.xlsx, .xls)</label><input id="bulk-file" type="file" accept=".csv,.xlsx,.xls"></div><div id="bulk-sheets"></div><div class="field"><label for="bulk-text">${tr('bulkPasteLabel')}</label><textarea id="bulk-text" rows="5"></textarea></div><button id="bulk-parse" class="button">${tr('bulkParse')}</button><div id="bulk-mapping"></div></section>
 <section class="panel" id="bulk-materials" hidden><h3>${tr('bulkMaterialsMode')}</h3><p>${tr('bulkMaterialsHint')}</p><div class="bulk-drop" id="bulk-drop" tabindex="0">${tr('bulkDrop')}<div class="field"><label for="bulk-material-files">${tr('bulkFiles')}</label><input type="file" id="bulk-material-files" multiple accept=".docx,.html,.htm,.txt,.pdf,.doc,.zip,.jpg,.jpeg,.png,.webp,.gif"></div><div class="field"><label for="bulk-folder">${tr('bulkFolder')}</label><input id="bulk-folder" type="file" multiple webkitdirectory></div></div><div id="bulk-file-results" role="status"></div></section>
 <section class="panel bulk-result"><h3>${tr('bulkStep3')}</h3><div id="bulk-summary" aria-live="polite"></div><div id="bulk-preview"></div></section>`;
 document.getElementById('bulk-download').onclick=download;
 document.getElementById('bulk-file').onchange=onFile;
 document.getElementById('bulk-text').oninput=()=>{invalidate();matrix=null;workbook=null;document.getElementById('bulk-mapping').innerHTML='';document.getElementById('bulk-sheets').innerHTML='';};
 document.getElementById('bulk-parse').onclick=()=>{invalidate();try{setMatrix(B.parseCsv(document.getElementById('bulk-text').value));}catch(err){message(err.message);}};
 ['table','materials'].forEach(m=>{document.getElementById('mode-'+m).setAttribute('aria-pressed',String(mode===m));document.getElementById('mode-'+m).onclick=()=>{invalidate();mode=m;['table','materials'].forEach(v=>{const button=document.getElementById('mode-'+v);button.setAttribute('aria-pressed',String(v===m));button.classList.toggle('secondary',v!==m);});document.getElementById('bulk-table').hidden=m!=='table';document.getElementById('bulk-materials').hidden=m!=='materials';};});
 U.translate();
 BulkMaterials.mount({invalidate,authorized,getRevision:()=>revision,show:rows=>{parsed={rows,missing:[]};paint();},message});
 }
 function message(text){document.getElementById('bulk-summary').textContent=text;}
 function download(){const csv='\ufeff'+B.columns.join(',')+'\r\nboats,yacht,游艇,Yacht,产品描述,Product description,1,30,100,200,unit,FOB,';const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='product-import-template.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 async function onFile(ev){invalidate();if(!authorized()){message(U.t('bulkAccountChanged'));return;}matrix=null;workbook=null;document.getElementById('bulk-text').value='';document.getElementById('bulk-mapping').innerHTML='';document.getElementById('bulk-sheets').innerHTML='';const token=revision,file=ev.target.files[0];if(!file)return;try{if(file.size>20*1024*1024)throw Error(U.t('bulkLimit'));if(/\.csv$/i.test(file.name)){const text=await file.text();if(token!==revision||!authorized())return;document.getElementById('bulk-text').value=text;setMatrix(B.parseCsv(text));}else if(/\.xlsx?$/i.test(file.name)){const data=await file.arrayBuffer();if(token!==revision||!authorized())return;workbook=XLSX.read(data,{type:'array'});const box=document.getElementById('bulk-sheets');box.innerHTML=`<label for="bulk-sheet">${tr('bulkSheet')}</label><select id="bulk-sheet">${workbook.SheetNames.map(n=>`<option>${e(n)}</option>`).join('')}</select>`;const select=document.getElementById('bulk-sheet');select.onchange=()=>{invalidate();loadSheet(select.value);};loadSheet(select.value);}else throw Error(U.t('bulkFileTypes'));}catch(err){if(token===revision)message(err.message);}}
 function loadSheet(name){setMatrix(XLSX.utils.sheet_to_json(workbook.Sheets[name],{header:1,defval:'',raw:false}));}
 function setMatrix(rows){matrix=rows;if(!rows.length){message(U.t('bulkEmpty'));return;}const map=B.mapping(rows[0]);document.getElementById('bulk-mapping').innerHTML=`<h4>${tr('bulkMap')}</h4><div class="bulk-map">${COLUMNS.map(([key,req])=>`<label>${e(key)}${req?' *':''}<select data-map="${key}"><option value="">—</option>${rows[0].map((h,i)=>`<option value="${i}" ${map[key]===i?'selected':''}>${e(h||('#'+(i+1)))}</option>`).join('')}</select></label>`).join('')}</div><button class="button" id="bulk-validate">${tr('bulkParse')}</button>`;document.querySelectorAll('[data-map]').forEach(el=>el.onchange=invalidate);document.getElementById('bulk-validate').onclick=validateTable;validateTable();}
 function validateTable(){invalidate();const map={};document.querySelectorAll('[data-map]').forEach(el=>{if(el.value!=='')map[el.dataset.map]=Number(el.value);});const missing=COLUMNS.filter(([k,r])=>r&&map[k]===undefined).map(([k])=>k);const indices=Object.values(map);if(new Set(indices).size!==indices.length){message(U.t('bulkDuplicateMap'));return;}parsed={missing,rows:missing.length?[]:matrix.slice(1).filter(c=>c.some(v=>String(v).trim())).map((cells,i)=>{const record={};B.columns.forEach(k=>record[k]=String(cells[map[k]]??'').trim());return validateRow(record,i+2);})};paint();}
 function paint(){const summary=document.getElementById('bulk-summary'),preview=document.getElementById('bulk-preview');if(!parsed)return;if(parsed.missing.length){message(U.t('bulkHeaderError').replace('{cols}',parsed.missing.join(', ')));return;}const ok=parsed.rows.filter(r=>r.valid).length;summary.innerHTML=`<p>${tr('bulkValid')}: ${ok} · ${tr('bulkInvalid')}: ${parsed.rows.length-ok}</p><label><input type="checkbox" id="bulk-confirm"> ${tr('bulkConfirm')}</label><button class="button" id="bulk-run" disabled>${tr('bulkSaveDrafts')}</button>`;
 preview.innerHTML=mode==='materials'?BulkMaterials.preview(parsed.rows):`<div class="scroll-x"><table class="console-table"><thead><tr><th>${tr('bulkRowNo')}</th><th>${tr('titleZh')}</th><th>${tr('productGroup')}</th><th>${tr('bulkTradePreview')}</th><th>${tr('status')}</th></tr></thead><tbody>${parsed.rows.map(r=>`<tr><td>${r.line}</td><td>${e(r.record.title_zh||r.record.title_en)}</td><td>${e(r.record.category_id)} / ${e(r.record.subcategory_id)}</td><td>${e(r.record.price_min)}–${e(r.record.price_max)} USD / ${e(r.record.unit)} · MOQ ${e(r.record.moq)} · ${e(r.record.lead_time)} ${tr('bulkDays')}</td><td>${r.valid?tr('bulkValid'):e(r.errors.join(', '))}</td></tr>`).join('')}</tbody></table></div>`;
 if(mode==='materials')BulkMaterials.bind(parsed.rows,validateRow,()=>paint());document.getElementById('bulk-confirm').onchange=ev=>document.getElementById('bulk-run').disabled=!ev.target.checked||!ok;document.getElementById('bulk-run').onclick=save;}
 function save(){if(!authorized()){let error=document.getElementById('bulk-account-error');if(!error){error=document.createElement('p');error.id='bulk-account-error';document.getElementById('bulk-summary').prepend(error);}error.textContent=U.t('bulkAccountChanged');return;}if(!parsed||!document.getElementById('bulk-confirm').checked)return;try{const existing=MarineCore.readArray(localStorage,'draft_products');let rejected=0;const incoming=parsed.rows.filter(r=>r.valid).map(r=>{const p=rowToProduct(r);const review=window.ReviewRules?window.ReviewRules.run('product',p,{existing}):{pass:true,code:'',rule:''};p.status=review.pass?'active':'rejected';if(!review.pass)rejected+=1;p.review={code:review.code,rule:review.rule,at:new Date().toISOString()};p.import_key=r.import_key||'table:'+JSON.stringify(B.columns.map(k=>r.record[k]||''));if(r.html)p.description_html=r.html;if(r.images?.length)p.media=r.images;return p;});const result=B.merge(existing,incoming);if(!U.write('draft_products',result.products))return;parsed=null;document.getElementById('bulk-preview').innerHTML='';message(U.t('bulkSaved').replace('{ok}',result.added).replace('{skip}',result.skipped)+(rejected?' · '+U.t('bulkRejectedCount').replace('{n}',rejected):''));}catch(err){message(U.t('bulkStorageFailed'));}}
 render();
})();
