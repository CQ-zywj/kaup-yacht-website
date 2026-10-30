(function () {
  const shell=SupplierShell.mount('consoleCustomers');if(!shell)return;
  const {body,id}=shell;const C=CustomerCore;
  const fields=['company','country','contact','email','phone','notes'];
  const labels={company:'customerCompany',country:'customerCountry',contact:'customerContact',email:'customerEmail',phone:'customerPhone',notes:'customerNotes'};
  const state={q:''};
  function errorText(error){return U.t(['customerSession','customerDataError','customerMissing','customerCompanyRequired','validEmail','customerTooLong'].includes(error.message)?error.message:'customerStorageError');}
  function profiles(query=''){
    let user;try{user=JSON.parse(localStorage.getItem('current_user'));}catch{}
    if(user?.role!=='supplier'||user.id!==id)throw Error('customerSession');
    return C.list(localStorage,id,inquiries(),query);
  }
  function inquiries(){try{return MarineCore.readArray(localStorage,'rfq_drafts');}catch{throw Error('customerDataError');}}
  function showError(error,target=document.getElementById('customer-error')){target.textContent=errorText(error);}
  body.innerHTML=`<div class="page-intro"><div class="eyebrow">${U.tr('identitySupplier')}</div><h1>${U.tr('customersTitle')}</h1><p>${U.tr('customersDesc')}</p></div><div class="panel"><div class="customer-toolbar"><div><strong>${U.tr('customersTitle')}</strong><p class="inline-note">${U.tr('customerEmptyHint')}</p></div><button class="button" type="button" id="customer-new">${U.tr('customerAdd')}</button></div><div class="field customer-search-field"><label for="customer-search">${U.tr('customerSearch')}</label><input id="customer-search" type="search" maxlength="300"></div><p id="customer-error" class="customer-error" role="alert"></p><p id="customer-status" role="status"></p><div class="customer-grid" id="customer-grid"></div></div><dialog id="customer-dialog" aria-label="${U.e(U.t('customerDetail'))}"></dialog>`;
  const dialog=document.getElementById('customer-dialog');
  function renderGrid(){
    const target=document.getElementById('customer-grid');document.getElementById('customer-error').textContent='';
    try{
      const list=profiles(state.q);
      target.innerHTML=list.length?list.map(profile=>`<button type="button" class="customer-card" data-customer="${U.e(profile.key)}"><span class="avatar">${U.e(profile.company.slice(0,1))}</span><h3>${U.e(profile.company)}</h3><p class="muted">${U.e(profile.country||'—')}</p><p>${U.e(profile.contact||profile.email||'—')}</p><span class="badge muted-badge">${U.tr(profile.kind==='manual'?'customerManual':'customerDerived')}</span><dl><dt>${U.tr('customerInquiries')}</dt><dd>${profile.rows.length}</dd><dt>${U.tr('customerReplies')}</dt><dd>${profile.rows.filter(r=>r.status==='replied').length}</dd></dl></button>`).join(''):`<p class="muted">${U.tr(state.q.trim()?'customerNoMatches':'customerEmpty')}</p>`;
    }catch(error){target.innerHTML='';showError(error);}
    U.translate();
  }
  function open(){if(!dialog.open)dialog.showModal();U.translate();}
  function header(key){return `<div class="drawer-header"><h2>${U.tr(key)}</h2><button type="button" class="button secondary" data-close>${U.tr('close')}</button></div>`;}
  function bindClose(){dialog.querySelector('[data-close]').onclick=()=>dialog.close();}
  function edit(key=null){
    document.getElementById('customer-status').textContent='';
    let profile={};try{if(key){profile=profiles().find(p=>p.key===key);if(!profile)throw Error('customerMissing');}else profiles();}catch(error){showError(error);return;}
    dialog.innerHTML=header(key?'customerEdit':'customerAdd')+`<form id="customer-form"><div class="customer-form-grid">${fields.map(field=>`<div class="field ${field==='notes'?'customer-wide':''}"><label for="customer-${field}">${U.tr(labels[field])}${field==='company'?' *':''}</label>${field==='notes'?`<textarea id="customer-${field}" name="${field}" maxlength="5000" rows="4">${U.e(profile[field]||'')}</textarea>`:`<input id="customer-${field}" name="${field}" type="${field==='email'?'email':field==='phone'?'tel':'text'}" maxlength="300" ${field==='company'?'required':''} value="${U.e(profile[field]||'')}">`}</div>`).join('')}</div><p class="customer-error" id="customer-form-error" role="alert"></p><div class="form-actions"><button type="submit" class="button">${U.tr('customerSave')}</button><button type="button" class="button secondary" data-cancel>${U.tr('customerCancel')}</button></div></form>`;
    bindClose();dialog.querySelector('[data-cancel]').onclick=()=>dialog.close();
    dialog.querySelector('form').onsubmit=event=>{
      event.preventDefault();const form=event.currentTarget;const errorTarget=document.getElementById('customer-form-error');errorTarget.textContent='';
      try{C.save(localStorage,id,key,Object.fromEntries(new FormData(form)),inquiries());dialog.close();renderGrid();document.getElementById('customer-status').textContent=U.t('customerSaved');}catch(error){showError(error,errorTarget);}
    };
    open();dialog.querySelector('[name=company]').focus();
  }
  function details(key){
    let profile;try{profile=profiles().find(p=>p.key===key);if(!profile)throw Error('customerMissing');}catch(error){showError(error);return;}
    dialog.innerHTML=header('customerDetail')+`<h3>${U.e(profile.company)}</h3><span class="badge muted-badge">${U.tr(profile.kind==='manual'?'customerManual':'customerDerived')}</span><dl class="customer-details">${fields.slice(1).map(field=>`<dt>${U.tr(labels[field])}</dt><dd>${U.e(profile[field]||'—')}</dd>`).join('')}</dl><h3>${U.tr('customerHistory')}</h3>${profile.rows.length?`<div class="customer-history"><table class="console-table"><thead><tr><th>${U.tr('product')}</th><th>${U.tr('quantity')}</th><th>${U.tr('sentAt')}</th><th>${U.tr('status')}</th></tr></thead><tbody>${profile.rows.slice().sort((a,b)=>(Date.parse(b.created_at)||0)-(Date.parse(a.created_at)||0)).map(row=>{
      const product=row.product_id?U.product(row.product_id):null;
      return `<tr><td>${product?U.bi({zh:product.i18n?.zh?.title||'—',en:product.i18n?.en?.title||'—'}):U.tr('publicInquiry')}</td><td>${U.e(row.quantity??'—')}</td><td>${row.created_at?U.e(U.date(row.created_at)):'—'}</td><td>${U.tr(row.status||'draft')}</td></tr>`;
    }).join('')}</tbody></table></div>`:`<p class="muted">${U.tr('customerNoHistory')}</p>`}<div class="form-actions"><button type="button" class="button" data-edit>${U.tr('customerEdit')}</button><button type="button" class="button secondary" data-delete>${U.tr('customerDelete')}</button><a class="button secondary" href="${U.url('inbox.html')}">${U.tr('customerGoInbox')}</a></div><div class="customer-delete-confirm" hidden><p>${U.tr('customerDeleteHint')}</p><div class="form-actions"><button type="button" class="button" data-confirm-delete>${U.tr('customerConfirmDelete')}</button><button type="button" class="button secondary" data-cancel-delete>${U.tr('customerCancel')}</button></div></div><p id="customer-detail-error" class="customer-error" role="alert"></p>`;
    bindClose();dialog.querySelector('[data-edit]').onclick=()=>edit(key);
    const confirmation=dialog.querySelector('.customer-delete-confirm');
    dialog.querySelector('[data-delete]').onclick=()=>{confirmation.hidden=false;dialog.querySelector('[data-confirm-delete]').focus();};
    dialog.querySelector('[data-cancel-delete]').onclick=()=>{confirmation.hidden=true;dialog.querySelector('[data-delete]').focus();};
    dialog.querySelector('[data-confirm-delete]').onclick=()=>{
      try{C.remove(localStorage,id,key,inquiries());dialog.close();renderGrid();document.getElementById('customer-status').textContent=U.t('customerDeleted');}catch(error){showError(error,document.getElementById('customer-detail-error'));}
    };open();
  }
  document.getElementById('customer-new').onclick=()=>edit();
  document.getElementById('customer-search').oninput=event=>{state.q=event.target.value;renderGrid();};
  document.getElementById('customer-grid').onclick=event=>{const button=event.target.closest('[data-customer]');if(button)details(button.dataset.customer);};
  window.addEventListener('storage',event=>{if([null,'rfq_drafts','current_user','supplier_profile',C.storageKey(id)].includes(event.key)){if(dialog.open&&['current_user',null].includes(event.key))dialog.close();renderGrid();}});
  window.addEventListener('languagechange',()=>{renderGrid();document.getElementById('customer-status').textContent='';});
  renderGrid();
})();
