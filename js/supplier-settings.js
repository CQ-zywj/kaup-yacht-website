/* 财务中心。
   店铺装修（logo / banner / 标语 / 主题）已并入 company.html「我的店铺」，
   本文件只负责银行资料与开户凭证。 */
(async function () {
  const shell = SupplierShell.mount('consoleFinance');
  if (!shell) return;
  const {body,id} = shell;
  let bank;
  try { bank = await SupplierFiles.getFinance(id) || {}; }
  catch { body.innerHTML = `<p role="alert">${U.tr('storageError')}</p>`; return; }
  function field(key,name,value) { return `<div class="field"><label for="${name}">${U.tr(key)}</label><input id="${name}" name="${name}" value="${U.e(value || '')}"></div>`; }
  function upload(key,name,hint,accept) { return `<div class="field"><label for="${name}">${U.tr(key)}</label><input id="${name}" name="${name}" type="file" accept="${accept}"><small>${U.tr(hint)}</small></div>`; }
  function render() {
    body.innerHTML = `<div class="page-intro"><h1>${U.tr('consoleFinance')}</h1><p>${U.tr('financePrivateHint')}</p></div><form id="settings-form"><section class="panel"><div class="form-grid">${field('bankHolder','holder',bank.holder)}${field('bankName','bank',bank.bank)}${field('bankAccount','account',bank.account)}${field('bankSwift','swift',bank.swift)}${upload('bankProof','proof','bankProofHint','.jpg,.jpeg,.pdf')}</div><div id="saved-files" class="settings-files"></div><label class="check-label"><input type="checkbox" name="clear_proof">${U.tr('removeProof')}</label></section><p class="error" id="settings-error" role="alert"></p><p id="settings-status" role="status"></p><div class="form-actions"><button class="button" type="submit">${U.tr('saveSettings')}</button><a class="button secondary" href="${U.url('company.html')}">${U.tr('myStore')}</a></div></form>`;
    SupplierFiles.links(bank.proof || [],document.getElementById('saved-files')).catch(()=> { document.getElementById('settings-error').textContent = U.t('storageError'); });
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
      const chosen = [...form.elements.proof.files];
      const proof = chosen.length ? await SupplierFiles.putMany(chosen,id,'bank') : form.elements.clear_proof.checked ? [] : bank.proof || [];
      bank = {supplier_id:id,holder:form.elements.holder.value.trim(),bank:form.elements.bank.value.trim(),account:form.elements.account.value.trim(),swift:form.elements.swift.value.trim(),proof};
      await SupplierFiles.saveFinance(bank);
      render(); document.getElementById('settings-status').textContent = U.t('settingsSaved');
    } catch (e) { error.textContent = e.message || U.t('storageError'); }
    finally { button.disabled = false; }
  }
  render();
})();
