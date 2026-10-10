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
window.renderPortalWorkspace = () => {
  const target = document.getElementById('portal-workspace');
  if (!target) return;
  const quickDraft = Object.fromEntries([...target.querySelectorAll('#quick-request [name]')].map(input=>[input.name,input.value]));
  const user = AccountUI.getUser(), seller = user?.role === 'supplier';
  if (seller) {
    const received=U.read('rfq_drafts');
    const unread=received.filter(row=>row.status==='submitted').length;
    target.innerHTML=`<div class="workspace-label">${U.tr('supplierMode')}</div><h2>${U.tr('sellerWelcome')}</h2><p>${U.tr('sellerWelcomeHint')}</p><div class="workspace-stat"><strong>${unread}</strong><span>${U.tr('unread')}</span></div><a class="button full-width" href="${U.url('inbox.html')}">${U.tr('inbox')} →</a><a class="button secondary full-width" href="${U.url('publish.html')}">${U.tr('publish')} →</a><div class="workspace-shortcuts"><a href="${U.url('supplier.html')}">${U.tr('myProducts')}</a><a href="${U.url('company.html')}">${U.tr('companyProfile')}</a></div>`;
  } else {
    target.innerHTML=`<div class="workspace-label">${U.tr('buyerEntryNav')}</div><h2>${U.tr('quickRequest')}</h2><p>${U.tr('quickHint')}</p><form id="quick-request"><label for="quick-product">${U.tr('wantedProduct')}</label><input id="quick-product" name="wanted" required maxlength="120" placeholder="${U.t('wantedProduct')}"><label for="quick-industry">${U.tr('industry')}</label><select id="quick-industry" name="industry" required><option value="">${U.t('select')}</option>${U.options(MarineData.industries,'')}</select><label for="quick-quantity">${U.tr('quantity')}</label><input id="quick-quantity" name="quantity" type="number" min="1" step="1" required placeholder="${U.t('quantity')}"><button class="button full-width" type="submit">${U.tr('continueRequest')} →</button></form>`;
    for(const [name,value] of Object.entries(quickDraft)) {const input=target.querySelector('form').elements.namedItem(name);if(input)input.value=value;}
    target.querySelector('form').onsubmit=event=>{event.preventDefault();const d=new FormData(event.currentTarget);location.href=U.url('rfq.html',{industry:d.get('industry'),wanted:d.get('wanted'),quantity:d.get('quantity')});};
  }
  const receivedStrip=document.getElementById('home-received');
  if(receivedStrip){
    receivedStrip.hidden=!seller;
    const all=seller?U.read('rfq_drafts'):[],recent=all.slice().sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at)).slice(0,3);
    receivedStrip.innerHTML=seller?`<div class="received-heading"><h2>${U.tr('receivedInquiries')} <span class="unread-badge">${all.filter(row=>row.status==='submitted').length} ${U.tr('unread')}</span></h2><a class="text-link" href="${U.url('inbox.html')}">${U.tr('viewMore')} →</a></div><div class="received-list">${recent.length?recent.map(r=>`<a href="${U.url('inbox.html',{inquiry:r.id})}"><strong>${U.e(r.buyer.company)}</strong><span>${U.e(r.message.slice(0,66))}</span><small>${U.e(U.date(r.created_at))} · ${U.tr(r.status)}</small></a>`).join(''):`<p class="muted">${U.tr('noInquiries')}</p>`}</div>`:'';
  }
  const leads=document.getElementById('home-leads');
  if(leads){leads.hidden=!seller;leads.innerHTML=seller?`<div class="platform-section-head"><div><h2>${U.tr('supplierLeads')}</h2><p>${U.tr('leadHint')}</p></div><a class="text-link" href="${U.url('inbox.html')}">${U.tr('receivedInquiries')} →</a></div><div class="lead-grid">${PlatformContent.leads.map(r=>`<a class="lead-card" href="${U.url('inquiry-detail.html',{id:r.id})}"><span class="editorial-tag">${U.tr('demoLead')}</span><h3>${U.bi(r.title)}</h3><p>${U.bi(r.country)} · ${U.bi(r.quantity)}</p><small>${U.tr('leadDetails')} →</small></a>`).join('')}</div>`:'';}
};

document.getElementById('main').innerHTML = `<div class="container platform-home">
<h1 class="sr-only">${U.tr("portalTitle")}</h1><section class="portal-top">
<aside class="industry-directory" id="industries"><h2>${U.tr('allIndustries')}</h2>${MarineData.industries.map(i => `<div class="directory-entry"><a href="${industryLink(i.id)}">${industryIcon(i.id)}<span>${U.bi(i.name)}<small>${U.bi(i.description)}</small></span></a><button type="button" class="directory-toggle" aria-expanded="false" aria-controls="menu-${i.id}" data-i18n-aria="expandIndustry" aria-label="${U.t('expandIndustry')}">›</button><div class="industry-flyout" id="menu-${i.id}" hidden><div class="flyout-head"><h3>${U.bi(i.name)}</h3><a class="text-link" href="${industryLink(i.id)}">${U.tr('industryBrowse')} →</a></div>${i.category_ids.map(id=>`<div class="flyout-group"><a class="flyout-group-name" href="${industryLink(i.id,id)}">${U.bi(U.cat(id).name)}</a><div>${U.cat(id).subcategories.map(c=>`<a href="${U.url('products.html',{industry:i.id,category:id,subcategory:c.id})}">${U.bi(c.name)}</a>`).join('')}</div></div>`).join('')}</div></div>`).join('')}</aside>
<div class="portal-center"><section class="portal-carousel" aria-roledescription="carousel" data-i18n-aria="carousel" aria-label="${U.t('carousel')}" tabindex="0" aria-describedby="carousel-key-help"><span class="sr-only" id="carousel-key-help">${U.tr("carouselKeys")}</span><div class="carousel-window">${[
  {key:'Sourcing',art:'platform',industry:''}, {key:'Precision',art:'precision',industry:'machine-tools',type:'exhibitions',id:'manufacturing-connect'}, {key:'Agriculture',art:'agriculture',industry:'agriculture'}
].map((slide,index)=>`<article class="carousel-slide slide-${slide.art}" data-slide="${index}" data-title-key="slide${slide.key}" ${index?'hidden':''}><img class="carousel-art" src="assets/media/banner-${slide.art}.svg" alt=""><div class="slide-copy"><div class="eyebrow">${U.tr(index?'slide'+slide.key:'platformNote')}</div><h2>${U.tr('slide'+slide.key+'Title')}</h2><p>${U.tr('slide'+slide.key+'Desc')}</p><a class="slide-cta" href="${slide.type?U.url('content.html',{type:slide.type,id:slide.id}):industryLink(slide.industry)}">${U.tr(slide.type?'eventDetails':index?'channelOpen':'browse')} <span aria-hidden="true">→</span></a></div></article>`).join('')}</div><div class="carousel-controls"><div class="carousel-dots">${['Sourcing','Precision','Agriculture'].map((key,index)=>`<button type="button" data-slide-to="${index}" data-title-key="slide${key}" aria-pressed="${index===0}" aria-label="${U.t('carouselShow')}: ${U.t('slide'+key)}"><span class="dot-mark" aria-hidden="true"></span><span class="dot-label">${U.tr('slide'+key)}</span></button>`).join('')}</div><div class="carousel-arrows"><button type="button" data-carousel="previous" data-i18n-aria="carouselPrevious" aria-label="${U.t('carouselPrevious')}">‹</button><button type="button" data-carousel="next" data-i18n-aria="carouselNext" aria-label="${U.t('carouselNext')}">›</button></div></div><span class="sr-only" id="carousel-status" aria-live="polite" aria-atomic="true"></span></section>
</div>
<aside class="portal-workspace" id="portal-workspace"></aside>
</section>
<section class="received-strip" id="home-received" hidden></section>
<section class="platform-section supplier-lead-section" id="home-leads" hidden></section>
<div class="platform-benefits">${['certified','compliant','worldwide'].map((key,i) => `<div><span aria-hidden="true">${['⌕','▦','↗'][i]}</span><p><strong>${U.tr(key)}</strong><small>${U.tr('trustDesc'+(i+1))}</small></p></div>`).join('')}</div>
<section class="platform-section editorial-home" id="market-updates"><div class="editorial-news"><div class="platform-section-head"><div><h2>${U.tr('newsNav')}</h2><p>${U.tr('newsHint')}</p></div><a class="text-link" href="${U.url('news.html')}">${U.tr('viewMore')} →</a></div><div class="news-category-links">${['machine-tools','agriculture','bearings'].map(id=>`<a href="${U.url('news.html',{industry:id})}">${U.bi(U.industry(id).name)}</a>`).join('')}</div><div class="news-home-grid">${PlatformContent.news.map((r,index)=>`<a class="news-home-card ${index?'':'news-featured'}" href="${U.url('content.html',{type:'news',id:r.id})}">${index?'':`<div class="editorial-art"><img src="assets/media/banner-${r.art}.svg" alt=""></div>`}<div><span class="editorial-tag">${U.tr('demoEditorial')}</span><h3>${U.bi(r.title)}</h3><p>${U.bi(r.summary)}</p><small>${U.e(r.date)} · ${U.tr('readMore')} →</small></div></a>`).join('')}</div></div><div class="editorial-events"><div class="platform-section-head"><div><h2>${U.tr('exhibitionsNav')}</h2><p>${U.tr('eventsHint')}</p></div><a class="text-link" href="${U.url('exhibitions.html')}">${U.tr('viewMore')} →</a></div>${PlatformContent.exhibitions.map(r=>`<a class="event-home-card" href="${U.url('content.html',{type:'exhibitions',id:r.id})}"><div class="event-calendar"><strong>${r.date.slice(8)}</strong><small>${r.date.slice(0,7)}</small></div><div><span class="editorial-tag">${U.tr('demoEvent')}</span><h3>${U.bi(r.title)}</h3><p>${U.bi(r.location)}</p><small>${U.tr('eventDetails')} →</small></div></a>`).join('')}</div></section>
<section class="platform-section" id="industry-channels"><div class="platform-section-head"><div><h2>${U.tr('industryChannels')}</h2><p>${U.tr('industryChannelsDesc')}</p></div><a class="text-link" href="${U.url('products.html')}">${U.tr('viewAll')} →</a></div><div class="industry-channel-grid">${MarineData.industries.map(i => `<a class="industry-channel" href="${industryLink(i.id)}"><div class="industry-channel-icon">${industryIcon(i.id)}</div><div><h3>${U.bi(i.name)}</h3><p>${U.bi(i.description)}</p><small>${U.tr('channelOpen')} →</small></div></a>`).join('')}</div></section>
<section class="platform-section" id="suppliers"><div class="platform-section-head"><div><h2>${U.tr('supplierSelection')}</h2><p>${U.tr('supplierSelectionDesc')}</p></div><a class="text-link" href="${U.url('suppliers.html')}">${U.tr('viewAllSuppliers')} →</a></div><div class="portal-supplier-grid">${suppliers.slice(0,4).map(s=>`<article class="portal-supplier"><div class="supplier-avatar" aria-hidden="true">${U.e(s.name.en.slice(0,1))}</div><h3>${U.bi(s.name)}</h3><p>${U.e(s.country)} · ${U.tr('activeProducts')} ${products.filter(p=>(p.supplier_id || p.supplier.id)===s.id).length}</p><div class="supplier-category">${[...new Set(products.filter(p=>(p.supplier_id || p.supplier.id)===s.id).map(p=>U.industryOf(p.category_id)?.id))].map(id=>U.bi(U.industry(id)?.name)).join(' · ')}</div><a class="text-link" href="${U.url('products.html',{supplier:s.id})}">${U.tr('viewSupplierProducts')} →</a></article>`).join('')}</div></section>
<section class="platform-section"><div class="quote-banner"><div><h2>${U.tr('quoteTitle')}</h2><p>${U.tr('quoteDesc')}</p></div><a class="button dark" href="${U.url('rfq.html')}">${U.tr('generalRfq')} →</a></div></section>
</div>`;
window.renderPortalWorkspace();
U.translate();
AccountUI.refreshContext();

const serviceItems=[['▦','browse','products.html'],['⌕','suppliersNav','suppliers.html'],['↗','generalRfq','rfq.html'],['▤','newsNav','news.html'],['▣','exhibitionsNav','exhibitions.html'],['◎','buyerEntryNav','buyer-auth.html'],['▥','supplierEntryNav','supplier-auth.html']];
const serviceNav=document.createElement('nav');serviceNav.className='portal-service-nav';serviceNav.setAttribute('aria-label',U.t('home'));
serviceNav.innerHTML=`<div class="container">${serviceItems.map(([icon,label,url])=>`<a href="${U.url(url)}"><span class="service-icon" aria-hidden="true">${icon}</span>${U.tr(label)}</a>`).join('')}</div>`;
document.getElementById('header').append(serviceNav);

const headerSearch=document.querySelector('.main-header .header-search');
const searchScopes=document.createElement('div');searchScopes.className='search-scope-nav';
searchScopes.innerHTML=`<a class="active" href="${U.url('products.html')}">${U.tr('browse')}</a><a href="${U.url('news.html')}">${U.tr('newsNav')}</a><a href="${U.url('exhibitions.html')}">${U.tr('exhibitionsNav')}</a>`;
const searchGroup=document.createElement('div');searchGroup.className='home-search-group';
headerSearch.before(searchGroup);searchGroup.append(searchScopes,headerSearch);
const headerActions=document.createElement('div');headerActions.className='home-header-actions';
const languageControl=document.getElementById('language'),publishControl=document.getElementById('primary-action');
languageControl.before(headerActions);headerActions.append(languageControl,publishControl);
const accountControl=document.querySelector("[data-account-nav]");
if(accountControl) headerActions.append(accountControl);

window.addEventListener('storage',event=>{if(event.key==='rfq_drafts'){window.renderPortalWorkspace();U.translate();}});
window.addEventListener('focus',()=>{if(AccountUI.getUser()?.role==='supplier'){window.renderPortalWorkspace();U.translate();}});
