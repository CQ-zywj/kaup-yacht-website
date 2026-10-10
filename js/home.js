const industryIcons = {
  marine: '<path d="m4 25 7 6h19l6-10-16 2Z"/><path d="M13 23V6l13 13H13M6 35q5-4 10 0t10 0t10 0"/>',
  bearings: '<circle cx="20" cy="20" r="16"/><circle cx="20" cy="20" r="7"/><circle cx="20" cy="8" r="2"/><circle cx="20" cy="32" r="2"/><circle cx="8" cy="20" r="2"/><circle cx="32" cy="20" r="2"/><path d="m10 10 3 3m14 14 3 3m0-20-3 3M13 27l-3 3"/>',
  'machine-tools': '<path d="M4 33h32V13H24V6H7v27M7 24h16M25 13v13M20 29h12M10 10h7M10 16h7"/><circle cx="28" cy="18" r="2"/>',
  agriculture: '<path d="M20 36V7m0 20C8 26 6 18 8 14c8 0 12 7 12 13Zm0-7c12-1 14-9 12-13-8 0-12 7-12 13ZM10 36h20"/>',
  forestry: '<path d="m20 4 10 13h-5l9 12H6l9-12h-5ZM17 29v7h6v-7"/>',
  chemicals: '<path d="M14 4h12M16 4v13L7 31a3 3 0 0 0 3 5h20a3 3 0 0 0 3-5l-9-14V4M11 26h18"/><circle cx="18" cy="30" r="1"/><circle cx="23" cy="22" r="1"/>',
};
const industryIcon = id => `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${industryIcons[id] || industryIcons.bearings}</svg>`;
const industryLink = (id, category) => U.url('products.html', { industry: id, ...(category ? { category } : {}) });
const products = U.products();
const suppliers = [...new Map(products.map(p => [p.supplier_id || p.supplier.id, p.supplier])).values()];
const chosen = products.filter(p => ['p01','p02','p05','p09','p13','p14'].includes(p.id));
window.renderPortalWorkspace = () => {
  const target = document.getElementById('portal-workspace');
  if (!target) return;
  const user = AccountUI.getUser(), role = user?.role;
  const key = role === 'supplier' ? 'sellerWelcome' : role === 'buyer' ? 'buyerWelcome' : 'guestWelcome';
  target.innerHTML = `<div class="workspace-avatar" aria-hidden="true">${role ? U.e((user.name || user.company || '').slice(0,1)) : '↗'}</div><h2>${U.tr(key)}</h2><p>${U.tr(key + 'Hint')}</p>${role === 'supplier' ? `<a class="button full-width" href="${U.url('publish.html')}">${U.tr('publish')}</a><div class="workspace-shortcuts"><a href="${U.url('supplier.html')}">${U.tr('myProducts')}</a><a href="${U.url('inbox.html')}">${U.tr('inbox')}</a><a href="${U.url('company.html')}">${U.tr('companyProfile')}</a></div>` : `<a class="button full-width" href="${U.url('rfq.html')}">${U.tr('publishPurchase')}</a>${role === 'buyer' ? `<a class="button secondary full-width" href="${U.url('my-rfq.html')}">${U.tr('myInquiries')}</a>` : `<div class="workspace-shortcuts"><a href="${U.url('buyer-auth.html')}">${U.tr('login')}</a><a href="${U.url('buyer-auth.html', {tab:'register'})}">${U.tr('register')}</a></div><a class="supplier-entry" href="${U.url('supplier-auth.html', {tab:'register'})}">${U.tr('joinSuppliers')} →</a>`}`}`;
};
function emptyIndustry(id) {
  const i = U.industry(id);
  const available = MarineCore.filterProducts(products, {industry:id});
  if (available.length) return `<article class="industry-preview"><div class="platform-section-head"><h3>${U.bi(i.name)}</h3><a class="text-link" href="${industryLink(id)}">${U.tr('viewAll')} →</a></div><div class="product-grid">${available.slice(0,2).map(p=>U.card(p)).join('')}</div></article>`;
  return `<article class="empty-industry"><div class="empty-industry-icon">${industryIcon(id)}</div><div><small>${U.tr('emptyChannel')}</small><h3>${U.bi(i.name)}</h3><p>${U.tr('emptyChannelHint')}</p><div class="industry-chips">${U.cat(i.category_ids[0]).subcategories.map(c => `<a href="${U.url('products.html', {industry:id,category:i.category_ids[0],subcategory:c.id})}">${U.bi(c.name)}</a>`).join('')}</div></div><a class="text-link" href="${industryLink(id)}">${U.tr('channelOpen')} →</a></article>`;
}
document.getElementById('main').innerHTML = `<div class="container platform-home">
<section class="portal-top">
<aside class="industry-directory" id="industries"><h2>${U.tr('allIndustries')}</h2>${MarineData.industries.map(i => `<a href="${industryLink(i.id)}">${industryIcon(i.id)}<span>${U.bi(i.name)}<small>${U.bi(i.description)}</small></span><b aria-hidden="true">›</b></a>`).join('')}</aside>
<div class="portal-center"><section class="portal-banner"><div class="eyebrow">${U.tr('platformNote')}</div><h1>${U.tr('portalTitle')}</h1><p>${U.tr('portalDesc')}</p><form class="portal-search" action="products.html"><label class="sr-only" for="portal-search">${U.tr('search')}</label><input id="portal-search" name="q" data-i18n-placeholder="search" placeholder="${U.t('search')}"><input type="hidden" name="lang" id="portal-search-language" value="${U.lang}"><button type="submit">${U.tr('searchButton')}</button></form><div class="hot-search"><span>${U.tr('hotSearch')}</span>${['bearings','machine-tools','agriculture'].map(id => `<a href="${industryLink(id)}">${U.bi(U.industry(id).name)}</a>`).join('')}</div><div class="portal-art" aria-hidden="true">${industryIcon('bearings')}${industryIcon('machine-tools')}${industryIcon('agriculture')}</div></section>
<div class="focus-strip"><div><small>${U.tr('industrialFocus')}</small><p>${U.tr('industrialFocusDesc')}</p></div><a class="text-link" href="#industry-channels">${U.tr('explore')} →</a></div></div>
<aside class="portal-workspace" id="portal-workspace"></aside>
</section>
<div class="platform-benefits">${['certified','compliant','worldwide'].map((key,i) => `<div><span aria-hidden="true">${['⌕','▦','↗'][i]}</span><p><strong>${U.tr(key)}</strong><small>${U.tr('trustDesc'+(i+1))}</small></p></div>`).join('')}</div>
<section class="platform-section" id="industry-channels"><div class="platform-section-head"><div><h2>${U.tr('industryChannels')}</h2><p>${U.tr('industryChannelsDesc')}</p></div><a class="text-link" href="${U.url('products.html')}">${U.tr('viewAll')} →</a></div><div class="industry-channel-grid">${MarineData.industries.map(i => `<a class="industry-channel" href="${industryLink(i.id)}"><div class="industry-channel-icon">${industryIcon(i.id)}</div><div><h3>${U.bi(i.name)}</h3><p>${U.bi(i.description)}</p><small>${U.tr('channelOpen')} →</small></div></a>`).join('')}</div></section>
<section class="platform-section marine-floor"><div class="platform-section-head"><div><h2>${U.tr('marineChannel')}</h2><p>${U.tr('marineChannelDesc')}</p></div><a class="text-link" href="${industryLink('marine')}">${U.tr('viewAll')} →</a></div><div class="floor-groups">${U.industry('marine').category_ids.map(id => `<a href="${industryLink('marine',id)}">${U.bi(U.cat(id).name)}</a>`).join('')}</div><div class="product-grid">${chosen.length ? chosen.map(p=>U.card(p)).join('') : U.empty('noIndustryProducts','emptyIndustryHint')}</div></section>
<section class="platform-section"><div class="platform-section-head"><div><h2>${U.tr('industrialFocus')}</h2><p>${U.tr('industrialFocusDesc')}</p></div></div><div class="empty-industry-grid">${['bearings','machine-tools','agriculture','forestry','chemicals'].map(emptyIndustry).join('')}</div></section>
<section class="platform-section" id="suppliers"><div class="platform-section-head"><div><h2>${U.tr('supplierSelection')}</h2><p>${U.tr('supplierSelectionDesc')}</p></div><small class="muted">${U.tr('platformTrust')}</small></div><div class="portal-supplier-grid">${suppliers.slice(0,4).map(s=>`<article class="portal-supplier"><div class="supplier-avatar" aria-hidden="true">${U.e(s.name.en.slice(0,1))}</div><h3>${U.bi(s.name)}</h3><p>${U.e(s.country)} · ${U.tr('activeProducts')} ${products.filter(p=>(p.supplier_id || p.supplier.id)===s.id).length}</p><div class="supplier-category">${[...new Set(products.filter(p=>(p.supplier_id || p.supplier.id)===s.id).map(p=>U.industryOf(p.category_id)?.id))].map(id=>U.bi(U.industry(id)?.name)).join(' · ')}</div><a class="text-link" href="${U.url('products.html',{supplier:s.id})}">${U.tr('viewSupplierProducts')} →</a></article>`).join('')}</div></section>
<section class="platform-section"><div class="quote-banner"><div><h2>${U.tr('quoteTitle')}</h2><p>${U.tr('quoteDesc')}</p></div><a class="button dark" href="${U.url('rfq.html')}">${U.tr('generalRfq')} →</a></div></section>
</div>`;
window.renderPortalWorkspace();
U.translate();
AccountUI.refreshContext();
window.addEventListener('languagechange', () => {
  document.getElementById('portal-search-language').value = U.lang;
});
