(function(root){
  function bind({onCover}){
    const form=document.getElementById('article-form');
    const owner=AccountUI.getUser()?.id;
    const sameUser=()=>AccountUI.getUser()?.role==='supplier'&&AccountUI.getUser()?.id===owner;
    form.insertAdjacentHTML('afterbegin',`<section class="panel article-import-panel"><h2>${U.tr('articleImport')}</h2><p class="muted">${U.tr('articleImportHint')}</p><div class="field"><label for="article-import-file">${U.tr('articleImportFile')}</label><input type="file" id="article-import-file" accept=".docx,.html,.htm,.txt"><p class="inline-note" id="article-import-status" role="status" aria-live="polite"></p></div></section>`);
    form.insertAdjacentHTML('afterend',`<dialog id="article-import-preview" aria-labelledby="import-heading"><div class="drawer-header"><h2 id="import-heading">${U.tr('articleImportPreview')}</h2><button type="button" class="button secondary" id="import-cancel">${U.tr('cancel')}</button></div><p class="muted">${U.tr('articleImportReview')}</p><div class="form-grid"><div class="field full"><label for="import-title">${U.tr('articleTitleEn')}</label><input id="import-title"></div><div class="field"><label for="import-mode">${U.tr('articleImportMode')}</label><select id="import-mode"><option value="replace">${U.t('articleImportReplace')}</option><option value="append">${U.t('articleImportAppend')}</option></select></div><div class="field"><label class="check-label"><input type="checkbox" id="import-cover">${U.tr('articleImportCover')}</label></div></div><p id="import-warnings" class="inline-note"></p><div class="article-paragraphs document-preview" id="import-body" contenteditable="true" role="textbox" aria-label="${U.t('articleBodyEn')}" aria-multiline="true"></div><p class="error" id="import-error" role="alert"></p><div class="form-actions"><button type="button" class="button" id="import-apply">${U.tr('articleImportApply')}</button></div></dialog>`);
    const input=document.getElementById('article-import-file'),status=document.getElementById('article-import-status'),dialog=document.getElementById('article-import-preview');
    let generation=0;
    document.getElementById('import-cancel').onclick=()=>dialog.close();
    input.onchange=async()=>{
      const token=++generation,file=input.files[0];if(!file)return;
      if(!sameUser()){status.textContent=U.t('articleSessionChanged');input.value='';return;}
      status.textContent=U.t('documentReading');input.disabled=true;
      try{
        const document=await DocumentImport.read(file);
        if(token!==generation||!form.isConnected)return;
        if(!sameUser())throw Error('articleSessionChanged');
        root.document.getElementById('import-title').value=document.title;
        root.document.getElementById('import-body').innerHTML=document.html;
        const image=root.document.getElementById('import-body').querySelector('img');
        root.document.getElementById('import-cover').checked=Boolean(image);
        root.document.getElementById('import-cover').disabled=!image;
        root.document.getElementById('import-mode').value='replace';
        root.document.getElementById('import-error').textContent='';
        root.document.getElementById('import-warnings').textContent=document.messages.length?U.t('documentWarnings'):'';
        status.textContent=file.name;dialog.showModal();U.translate();
      }catch(error){
        if(form.isConnected)status.textContent=U.t(MarineI18n[error.message]?error.message:'documentReadError');
      }finally{input.disabled=false;input.value='';}
    };
    document.getElementById('import-apply').onclick=()=>{
      if(!sameUser()){document.getElementById('import-error').textContent=U.t('articleSessionChanged');return;}
      const html=DocumentImport.sanitize(document.getElementById('import-body').innerHTML);
      const text=new DOMParser().parseFromString(html,'text/html').body.textContent.trim();
      const title=document.getElementById('import-title').value.trim();
      const append=document.getElementById('import-mode').value==='append';
      if(!text||(!append&&!title)){document.getElementById('import-error').textContent=U.t('required');return;}
      const editor=document.getElementById('body_en');
      if(append)editor.innerHTML=DocumentImport.sanitize(editor.innerHTML)+'<p><br></p>'+html;
      else{document.getElementById('title_en').value=title;editor.innerHTML=html;}
      if(document.getElementById('import-cover').checked){
        const src=new DOMParser().parseFromString(html,'text/html').querySelector('img')?.getAttribute('src');
        if(src)onCover(src);
      }
      form.querySelectorAll('[data-error="title_en"],[data-error="content_en"]').forEach(node=>node.textContent='');
      form.querySelectorAll('.invalid').forEach(node=>{node.classList.remove('invalid');node.removeAttribute('aria-invalid')});
      dialog.close();status.textContent=U.t('articleImportApplied');editor.focus();
    };
  }
  root.ArticleDocumentUI={bind};
})(window);
