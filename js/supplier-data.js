(function (root) {
  const privateCategories = ['company', 'authorization'];
  function visibility(cert) {
    return privateCategories.includes(cert.category) ? 'private' : cert.visibility || 'public';
  }
  function publicCertificates(rows, supplierId, today = new Date().toLocaleDateString('en-CA')) {
    return rows.filter(c => c.supplier_id === supplierId && visibility(c) === 'public' &&
      c.status !== 'rejected' && (!c.valid_from || c.valid_from <= today) && (!c.valid_to || c.valid_to >= today));
  }
  function publicProfile(profile) {
    const result = {};
    for (const key of ['id','company','company_en','country','city','business_type','founded','employees',
      'intro','main_categories','tagline','theme','logo','logo_file','banner','banner_files','photos','video','team','verification_status']) {
      if (profile[key] !== undefined) result[key] = profile[key];
    }
    return result;
  }
  function fileError(file, kind) {
    const types = {
      bank:['image/jpeg','application/pdf'], certificate:['image/jpeg','image/png','application/pdf'],
      logo:['image/png','image/svg+xml'], banner:['image/jpeg','image/png'], team:['image/jpeg','image/png'],
    };
    const limits = {bank:5,certificate:10,logo:2,banner:3,team:5};
    if (!(types[kind] || []).includes(file.type)) return 'fileFormatError';
    const limit = kind === 'certificate' && file.type.startsWith('image/') ? 5 : limits[kind];
    if (!file.size || file.size > limit*1024*1024) return 'fileSizeError';
    return '';
  }
  const api = {visibility, publicCertificates, publicProfile, fileError};
  root.SupplierData = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
