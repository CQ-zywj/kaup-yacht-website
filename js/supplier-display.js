(function (root) {
  function profile(id) {
    const accounts = MarineAccounts.read(localStorage, 'accounts', []);
    const saved = MarineAccounts.readProfile(localStorage);
    const known = accounts.find(row => row.id === id && row.role === 'supplier') || (saved?.id === id ? saved : null);
    if (known) return known;
    const supplier = U.products().find(product => (product.supplier_id || product.supplier?.id) === id)?.supplier;
    return supplier ? {id,company:supplier.name?.zh || '',company_en:supplier.name?.en || '',country:supplier.country,
      verification_status:supplier.verified ? 'verified' : 'pending',intro:supplier.profile?.intro || {}} : null;
  }
  function certificates(id, owner = false) {
    const rows = SupplierCore.certs(localStorage, id);
    const p = profile(id);
    for (const [index, old] of (p?.certifications || []).entries()) {
      if (!rows.some(row => row.no === old.number)) rows.push({id:'legacy-'+index,supplier_id:id,
        name:old.type,no:old.number,category:'product',status:'pending',visibility:'public',files:old.image ? [old.image] : []});
    }
    return owner ? rows : SupplierData.publicCertificates(rows,id);
  }
  function cards(rows) {
    return rows.length ? `<div class="cert-grid shared-certificates">${rows.map(cert => `<button type="button" class="cert-card certificate-open" data-shared-cert="${U.e(cert.id)}"><div><strong>${U.e(cert.name)}</strong><p>${U.e(cert.no || '')}</p><p class="muted">${U.e(cert.issuer || '')}</p><span class="badge">${U.tr(cert.status === 'verified' ? 'certVerified' : cert.status === 'rejected' ? 'certRejected' : 'certUploaded')}</span> <span class="badge muted-badge">${U.tr(SupplierData.visibility(cert) === 'public' ? 'visibilityPublic' : 'visibilityPrivate')}</span>${cert.valid_to ? `<p class="muted">${U.tr('certValidTo')} ${U.e(cert.valid_to)}</p>` : ''}<p class="text-link">${U.tr('viewCertificate')} · ${(cert.files || []).length}</p></div></button>`).join('')}</div>` : `<p class="muted">${U.tr('noData')}</p>`;
  }
  async function open(cert, owner = false) {
    const dialog = document.createElement('dialog'); dialog.className = 'certificate-viewer';
    dialog.innerHTML = `<div class="drawer-header"><h2>${U.e(cert.name)}</h2><button class="button secondary" type="button" data-close>${U.tr('close')}</button></div><p>${U.e(cert.no || '')} · ${U.e(cert.issuer || '')}</p><p>${U.tr(cert.status === 'verified' ? 'certVerified' : 'certUploaded')}</p><p>${U.e(cert.valid_from || '—')} → ${U.e(cert.valid_to || '—')}</p><div data-cert-files></div>${owner && cert.auth_files?.length ? `<h3>${U.tr('certAuthFiles')}</h3><div data-auth-files></div>` : ''}`;
    document.body.append(dialog); dialog.showModal();
    dialog.querySelector('[data-close]').onclick = () => dialog.close();
    dialog.addEventListener('close', () => dialog.remove(), {once:true});
    try {
      await SupplierFiles.links(cert.files,dialog.querySelector('[data-cert-files]'));
      if (owner && cert.auth_files?.length) await SupplierFiles.links(cert.auth_files,dialog.querySelector('[data-auth-files]'));
    } catch { dialog.querySelector('[data-cert-files]').textContent = U.t('storageError'); }
  }
  function bind(scope, rows, owner = false) {
    scope.querySelectorAll('[data-shared-cert]').forEach(button => {
      button.onclick = () => { const cert = rows.find(row => row.id === button.dataset.sharedCert); if (cert) open(cert,owner); };
    });
  }
  function teamMarkup(team = []) {
    return team.length ? `<div class="team-grid">${team.map(person => `<article class="panel team-card">${person.photo?.id ? `<img data-local-file="${U.e(person.photo.id)}" alt="${U.e(person.name)}">` : ''}<h3>${U.e(person.name)}</h3><p class="muted">${U.e(person.position || '')}</p><p>${U.e(person.intro || '')}</p></article>`).join('')}</div>` : `<p class="muted">${U.tr('noData')}</p>`;
  }
  root.SupplierDisplay = {profile,certificates,cards,open,bind,teamMarkup};
})(window);
