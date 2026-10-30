(async function () {
  const finance = document.body.dataset.page === 'finance';
  const shell = SupplierShell.mount(finance ? 'consoleFinance' : 'consoleDecoration');
  if (!shell) return;
  const {body,id} = shell;
  let profile = shell.profile;
  let bank;
  try { bank = finance ? await SupplierFiles.getFinance(id) || {} : {}; }
  catch { body.innerHTML = `<p role="alert">${U.tr('storageError')}</p>`; return; }
  function field(key,name,value) { return `<div class="field"><label for="${name}">${U.tr(key)}</label><input id="${name}" name="${name}" value="${U.e(value || '')}"></div>`; }
  function upload(key,name,hint,accept,multiple = false) { return `<div class="field"><label for="${name}">${U.tr(key)}</label><input id="${name}" name="${name}" type="file" accept="${accept}" ${multiple ? 'multiple' : ''}><small>${U.tr(hint)}</small></div>`; }
  function render() {
    body.innerHTML = `<div class="page-intro"><h1>${U.tr(finance ? 'consoleFinance' : 'consoleDecoration')}</h1><p>${U.tr(finance ? 'financePrivateHint' : 'decorationHint')}</p></div><form id="settings-form"><section class="panel"><div class="form-grid">${finance ?
      field('bankHolder','holder',bank.holder)+field('bankName','bank',bank.bank)+field('bankAccount','account',bank.account)+field('bankSwift','swift',bank.swift)+upload('bankProof','proof','bankProofHint','.jpg,.jpeg,.pdf') :
      upload('companyLogo','logo','logoUploadHint','.png,.svg')+upload('companyBanner','banners','bannerUploadHint','.jpg,.jpeg,.png',true)+field('companyTagline','tagline',profile.tagline)+`<div class="field"><label for="theme">${U.tr('companyTheme')}</label><select name="theme" id="theme">${['theme-ocean','theme-slate','theme-sand'].map(theme=>`<option value="${theme}" ${profile.theme === theme ? 'selected' : ''}>${U.tr({'theme-ocean':'themeOcean','theme-slate':'themeSlate','theme-sand':'themeSand'}[theme])}</option>`).join('')}</select></div>`}
      </div><div id="saved-files" class="settings-files"></div>${!finance ? `<label class="check-label"><input type="checkbox" name="clear_logo">${U.tr('removeLogo')}</label><label class="check-label"><input type="checkbox" name="clear_banners">${U.tr('removeBanners')}</label>` : `<label class="check-label"><input type="checkbox" name="clear_proof">${U.tr('removeProof')}</label>`}</section><p class="error" id="settings-error" role="alert"></p><p id="settings-status" role="status"></p><div class="form-actions"><button class="button" type="submit">${U.tr('saveSettings')}</button>${!finance ? `<a class="button secondary" href="${U.url('storefront.html',{supplier_id:id})}">${U.tr('companyStorefrontPreview')}</a>` : ''}</div></form>`;
    const refs = finance ? bank.proof || [] : [profile.logo_file,...(profile.banner_files || [])].filter(Boolean);
    SupplierFiles.links(refs,document.getElementById('saved-files')).catch(()=> { document.getElementById('settings-error').textContent = U.t('storageError'); });
    document.getElementById('settings-form').onsubmit = save;
    U.translate();
  }
  async function save(event) {
    event.preventDefault();
    const form = event.currentTarget, button = form.querySelector('[type=submit]');
    const error = document.getElementById('settings-error'); error.textContent = '';
    button.disabled = true;
    try {
      if (AccountUI.getUser()?.id !== id || AccountUI.getUser()?.role !== 'supplier') throw Error(U.t('supplierAccessHint'));
      if (finance) {
        const chosen = [...form.elements.proof.files];
        const proof = chosen.length ? await SupplierFiles.putMany(chosen,id,'bank') : form.elements.clear_proof.checked ? [] : bank.proof || [];
        bank = {supplier_id:id,holder:form.elements.holder.value.trim(),bank:form.elements.bank.value.trim(),account:form.elements.account.value.trim(),swift:form.elements.swift.value.trim(),proof};
        await SupplierFiles.saveFinance(bank);
      } else {
        const logos = [...form.elements.logo.files], banners = [...form.elements.banners.files];
        if (banners.length > 3) throw Error(U.t('bannerCountError'));
        if (form.elements.tagline.value.length > 40) throw Error(U.t('taglineLengthError'));
        // Validate every file before persisting any of this form's files.
        for (const [files,kind] of [[logos,'logo'],[banners,'banner']]) for (const file of files) {
          const key = SupplierData.fileError(file,kind); if (key) throw Error(U.t(key));
        }
        profile = MarineAccounts.readProfile(localStorage);
        if (logos.length) profile.logo_file = (await SupplierFiles.putMany(logos,id,'logo'))[0];
        else if (form.elements.clear_logo.checked) { delete profile.logo_file; profile.logo = ''; }
        if (banners.length) profile.banner_files = await SupplierFiles.putMany(banners,id,'banner');
        else if (form.elements.clear_banners.checked) { profile.banner_files = []; profile.banner = ''; }
        profile.tagline = form.elements.tagline.value.trim(); profile.theme = form.elements.theme.value;
        MarineAccounts.writeProfile(localStorage,profile);
      }
      render(); document.getElementById('settings-status').textContent = U.t('settingsSaved');
    } catch (e) { error.textContent = e.message || U.t('storageError'); }
    finally { button.disabled = false; }
  }
  render();
})();
