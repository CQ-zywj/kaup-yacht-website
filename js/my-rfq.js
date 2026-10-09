(function (root) {
  const BuyerRfq = {
    select(records, user, state = {}) {
      if (user?.role !== 'buyer' || typeof user.id !== 'string' || !user.id.trim()) return [];
      return records.filter(r => r.buyer?.id === user.id && (!state.status || r.status === state.status))
        .sort((a, b) => (state.sort === 'oldest' ? 1 : -1) * (Date.parse(a.created_at) - Date.parse(b.created_at)));
    },
  };
  root.MarineBuyerRfq = BuyerRfq;
  if (typeof module !== 'undefined') module.exports = BuyerRfq;
  if (typeof document === 'undefined') return;

  const state = { status: '', sort: 'newest' };
  let selectedId = null;
  const statuses = { submitted: 'buyerSubmitted', viewed: 'buyerViewed', replied: 'buyerReplied' };
  const main = document.getElementById('main');
  function closeDrawer() {
    const drawer = document.getElementById('buyer-inquiry-drawer');
    if (drawer?.open) drawer.close();
    selectedId = null;
  }
  function readOwned() {
    const user = MarineAccounts.user(localStorage);
    if (user?.role !== 'buyer' || !user.id) return null;
    return BuyerRfq.select(MarineCore.readArray(localStorage, 'rfq_drafts'), user);
  }
  function showLogin() {
    closeDrawer();
    main.innerHTML = `<div class="container section">${U.empty('buyerTrackingTitle', 'buyerTrackingAuthHint', 'buyer-auth.html', 'buyerSignIn')}</div>`;
    main.querySelector('.empty a').href = U.url('buyer-auth.html', { return: location.pathname.split('/').pop() + location.search });
    U.translate();
  }
  function showStorageError() {
    closeDrawer();
    main.innerHTML = `<div class="container section">${U.empty('storageError', 'inquiryStorageHint')}<button class="button secondary" type="button" id="retry-inquiries">${U.tr('retry')}</button></div>`;
    document.getElementById('retry-inquiries').onclick = refresh;
    U.translate();
  }
  function buildPage() {
    main.innerHTML = `<div class="container buyer-inquiries"><div class="page-intro"><div class="eyebrow">${U.tr('buyerMode')}</div><h1>${U.tr('myInquiries')}</h1><p>${U.tr('myInquiriesDesc')}</p></div><div class="metrics"><div class="metric"><strong id="buyer-total">0</strong><span>${U.tr('allInquiries')}</span></div><div class="metric"><strong id="buyer-replied">0</strong><span>${U.tr('buyerReplied')}</span></div></div><div class="panel buyer-inquiry-toolbar"><div class="field"><label for="buyer-status-filter">${U.tr('status')}</label><select id="buyer-status-filter"><option value="" data-i18n="all">${U.t('all')}</option>${Object.entries(statuses).map(([value, key]) => `<option value="${value}" ${state.status === value ? 'selected' : ''} data-i18n="${key}">${U.e(U.t(key))}</option>`).join('')}</select></div><div class="field"><label for="buyer-time-sort">${U.tr('sort')}</label><select id="buyer-time-sort">${['newest','oldest'].map(value => `<option value="${value}" ${state.sort === value ? 'selected' : ''} data-i18n="${value}">${U.e(U.t(value))}</option>`).join('')}</select></div><a class="button" href="${U.url('rfq.html')}">${U.tr('publishPurchase')} →</a></div><section id="buyer-inquiry-list" aria-live="polite"></section></div><dialog class="drawer" id="buyer-inquiry-drawer" aria-label="${U.t('yourInquiry')}"></dialog>`;
    for (const [id, key] of [['buyer-status-filter','status'],['buyer-time-sort','sort']]) {
      document.getElementById(id).onchange = e => { state[key] = e.target.value; refresh(); };
    }
    document.getElementById('buyer-inquiry-drawer').addEventListener('close', () => selectedId = null);
  }
  function title(row) {
    const p = row.product_id ? U.product(row.product_id) : null;
    return p ? U.bi({zh: p.i18n.zh.title, en: p.i18n.en.title}) : U.tr('general');
  }
  function refresh() {
    let owned;
    try { owned = readOwned(); } catch { showStorageError(); return; }
    if (!owned) { showLogin(); return; }
    if (!document.getElementById('buyer-inquiry-list')) buildPage();
    document.getElementById('buyer-total').textContent = owned.length;
    document.getElementById('buyer-replied').textContent = owned.filter(r => r.status === 'replied').length;
    const list = BuyerRfq.select(owned, MarineAccounts.user(localStorage), state);
    document.getElementById('buyer-inquiry-list').innerHTML = list.length ? list.map(row => {
      const p = row.product_id ? U.product(row.product_id) : null;
      return `<button type="button" class="inquiry-item" data-buyer-inquiry="${U.e(row.id)}"><img src="${U.e(p ? U.img(p) : 'assets/media/services.svg')}" alt=""><div><h3>${title(row)}</h3><p>${row.category_id ? U.bi(U.cat(row.category_id)?.name) : U.e(row.buyer.company)}</p></div><div class="inquiry-meta"><p>${U.tr('quantity')} ${U.e(row.quantity)} · ${U.tr('targetCountry')} ${U.e(row.target_country || '—')}</p><p>${U.e(U.date(row.created_at))}</p></div><div class="status-cell"><span class="status ${U.e(row.status)}">${U.tr(statuses[row.status])}</span></div></button>`;
    }).join('') : owned.length ? U.empty('noFilteredInquiries', 'changeInquiryFilter') : U.empty('noBuyerInquiries', 'startBuyerInquiry', 'products.html', 'backBrowse');
    main.querySelectorAll('[data-buyer-inquiry]').forEach(button => button.onclick = () => openInquiry(button.dataset.buyerInquiry));
    if (selectedId) {
      const row = owned.find(r => r.id === selectedId);
      if (row) renderDrawer(row); else closeDrawer();
    }
    U.translate();
    AccountUI.refreshContext();
  }
  function openInquiry(id) {
    let owned;
    try { owned = readOwned(); } catch { showStorageError(); return; }
    if (!owned) { showLogin(); return; }
    const row = owned.find(r => r.id === id);
    if (!row) { closeDrawer(); refresh(); return; }
    selectedId = id;
    renderDrawer(row);
  }
  function renderDrawer(row) {
    const drawer = document.getElementById('buyer-inquiry-drawer');
    const product = row.product_id ? U.product(row.product_id) : null;
    const category = U.cat(row.category_id);
    const subcategory = category?.subcategories.find(c => c.id === row.subcategory_id);
    const fields = [['company', row.buyer.company], ['buyerCountry', row.buyer.country], ['category',category?.name?.[U.lang]], ['subcategory',subcategory?.name?.[U.lang]], ['quantity', row.quantity], ['targetCountry', row.target_country], ['delivery', row.expected_delivery], ['terms', row.incoterms], ['sentAt', U.date(row.created_at)]];
    drawer.innerHTML = `<div class="drawer-header"><h2>${U.tr('yourInquiry')}</h2><button type="button" class="language" id="buyer-drawer-language" data-i18n="language">${U.t("language")}</button><button type="button" class="button secondary" id="close-buyer-inquiry">${U.tr('close')}</button></div><span class="status ${U.e(row.status)}">${U.tr(statuses[row.status])}</span><div class="buyer-inquiry-context">${U.context(product)}</div><table class="param-table"><tbody>${fields.map(([key,value]) => `<tr><th scope="row">${U.tr(key)}</th><td>${U.e(value ?? '—') || '—'}</td></tr>`).join('')}</tbody></table><h3>${U.tr('message')}</h3><p class="inquiry-message">${U.e(row.message || '—')}</p><h3>${U.tr('attachments')}</h3>${row.attachments?.length ? U.filesHtml(row.attachments) : `<p class="muted">${U.tr('noData')}</p>`}<section class="buyer-reply"><h3>${U.tr('supplierReply')}</h3>${row.reply ? `<div class="reply-block"><p>${U.e(row.reply.message || '—')}</p>${row.reply.attachments?.length ? U.filesHtml(row.reply.attachments) : `<p class="muted">${U.tr('noData')}</p>`}<small>${U.tr('replyTime')} · ${U.e(row.reply.created_at ? U.date(row.reply.created_at) : '—')}</small></div>` : `<p class="waiting-reply">${U.tr('waitingReply')}</p>`}</section>`;
    document.getElementById('close-buyer-inquiry').onclick = closeDrawer;
    document.getElementById('buyer-drawer-language').onclick = U.switchLanguage;
    if (!drawer.open) drawer.showModal();
    U.translate();
  }
  window.addEventListener('storage', e => {
    if (['rfq_drafts','current_user','accounts','draft_products'].includes(e.key) || e.key === null) refresh();
  });
  window.addEventListener('focus', refresh);
  window.addEventListener('languagechange', refresh);
  refresh();
})(typeof window !== 'undefined' ? window : globalThis);
