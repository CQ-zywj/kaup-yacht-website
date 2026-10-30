(function () {
  const id = new URLSearchParams(location.search).get('supplier_id');
  function render() {
    const main = document.getElementById('main');
    try {
      const source = SupplierDisplay.profile(id);
      if (!source) { main.innerHTML = `<div class="container section">${U.empty('storefrontNotFound','storefrontNotFoundHint','suppliers.html','viewAllSuppliers')}</div>`; return; }
      const p = SupplierData.publicProfile(source), certs = SupplierDisplay.certificates(id);
      main.innerHTML = `<div class="container section company-container"><div class="page-intro"><h1>${U.e(p.company)}</h1><p>${U.e(p.company_en || '')}</p><a class="text-link" href="${U.url('storefront.html',{supplier_id:id})}">${U.tr('consoleStorefront')} →</a></div><section class="panel">${p.logo_file?.id ? `<img class="company-public-logo" data-local-file="${U.e(p.logo_file.id)}" alt="${U.e(p.company)}">` : ''}<h2>${U.tr('storefrontAbout')}</h2><p>${U.e(p.country || '')} · ${U.e(p.city || '')}</p><p class="preserve-lines">${U.e(p.intro?.[U.lang] || p.intro?.en || p.intro?.zh || '')}</p></section><section class="panel"><h2>${U.tr('certs')}</h2>${SupplierDisplay.cards(certs)}</section><section><h2>${U.tr('companyTeam')}</h2>${SupplierDisplay.teamMarkup(p.team)}</section></div>`;
      SupplierDisplay.bind(main,certs); SupplierFiles.hydrate(main); U.translate();
    } catch { main.innerHTML = `<div class="container section"><p role="alert">${U.tr('storageError')}</p></div>`; }
  }
  render(); window.addEventListener('languagechange',render); window.addEventListener('focus',render);
  window.addEventListener('storage',render);
})();
