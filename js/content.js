(() => {
  const params=new URLSearchParams(location.search);
  const mode=document.body.dataset.page;
  const main=document.getElementById('main');
  const listPage=type=>type==='exhibitions'?'exhibitions.html':'news.html';
  const detailURL=(type,id)=>U.url('content.html',{type,id});
  function card(type,r){return `<article class="content-card"><a href="${detailURL(type,r.id)}" class="editorial-art" aria-label="${U.e(r.title[U.lang])}"><img src="assets/media/banner-${U.e(r.art)}.jpg" alt=""></a><div><span class="editorial-tag">${U.tr(type==='news'?'demoEditorial':'demoEvent')}</span><h2><a href="${detailURL(type,r.id)}">${U.bi(r.title)}</a></h2><p>${U.bi(r.summary)}</p><small>${U.e(r.date)}${r.location?' · '+U.bi(r.location):''}</small><a class="text-link" href="${detailURL(type,r.id)}">${U.tr(type==='news'?'readMore':'eventDetails')} →</a></div></article>`;}
  function articleRows(){
    try{
      const rows=JSON.parse(localStorage.getItem('articles')||'[]');
      return Array.isArray(rows)?rows.filter(row=>row&&row.status==='published'):[];
    }catch{return [];}
  }
  function articleBody(article){
    const html=String((article.content_html&&(article.content_html[U.lang]||article.content_html.en||article.content_html.zh))||'');
    return html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/\son\w+="[^"]*"/gi,'');
  }
  function renderArticle(){
    const list=articleRows(), article=list.find(row=>row.id===params.get('id'));
    if(!article){missing('index.html');return;}
    let supplier=null;
    try{supplier=MarineAccounts.read(localStorage,'accounts',[]).find(a=>a.id===article.supplier_id&&a.role==='supplier')||null;}catch{}
    const store=U.url('storefront.html',{supplier_id:article.supplier_id});
    document.title=(article.title[U.lang]||article.title.en||article.title.zh)+' | '+U.t('brandName');
    const others=list.filter(row=>row.supplier_id===article.supplier_id&&row.id!==article.id).slice(0,4);
    main.innerHTML=`<div class="container content-shell"><div class="breadcrumbs"><a href="${U.url('index.html')}">${U.tr('home')}</a> / <a href="${store}">${U.tr('consoleStorefront')}</a> / ${U.bi(article.title)}</div><div class="content-detail-grid"><article class="panel article-body"><span class="editorial-tag">${U.tr('homeSupplierArticles')}</span><h1>${U.bi(article.title)}</h1><p class="article-meta">${U.e(U.date(article.publish_at||article.created_at))}${supplier?' · '+U.e(supplier.company):''}</p>${article.cover?`<div class="article-cover editorial-art"><img src="${U.e(article.cover)}" alt=""></div>`:''}<div class="article-paragraphs">${articleBody(article)}</div>${(article.tags||[]).length?`<div class="cert-row">${article.tags.map(t=>`<span class="badge">${U.e(t)}</span>`).join('')}</div>`:''}<p class="content-disclaimer">${U.tr('demoEditorial')}</p></article><aside class="content-aside panel"><h2>${U.tr('relatedContent')}</h2>${others.map(row=>`<a class="related-story" href="${detailURL('article',row.id)}"><strong>${U.bi(row.title)}</strong><small>${U.e(U.date(row.publish_at||row.created_at))}</small></a>`).join('')||`<p class="muted">${U.tr('noData')}</p>`}<a class="button full-width" href="${store}">${U.tr('homeBrowseStore')}</a><a class="text-link" href="${U.url('rfq.html',{supplier_id:article.supplier_id})}">${U.tr('generalRfq')} →</a></aside></div></div>`;
  }
  function render(){
    if(mode==='content'){
      if(params.get('type')==='article'){renderArticle();U.translate();AccountUI.refreshContext();return;}
      const type=params.get('type')==='exhibitions'?'exhibitions':'news', r=PlatformContent.find(type,params.get('id'));
      if(!r){missing(listPage(type));return;}
      const event=type==='exhibitions';
      document.title=r.title[U.lang]+' | '+U.t('brandName');
      main.innerHTML=`<div class="container content-shell"><div class="breadcrumbs"><a href="${U.url('index.html')}">${U.tr('home')}</a> / <a href="${U.url(listPage(type))}">${U.tr(event?'exhibitionsNav':'newsNav')}</a></div><div class="content-detail-grid"><article class="panel article-body"><span class="editorial-tag">${U.tr(event?'demoEvent':'demoEditorial')}</span><h1>${U.bi(r.title)}</h1><p class="article-meta">${U.e(r.date)} · ${U.bi(U.industry(r.industry).name)}</p><div class="article-cover editorial-art"><img src="assets/media/banner-${r.art}.jpg" alt=""></div>${event?`<dl class="event-facts"><div><dt>${U.tr('eventDate')}</dt><dd>${r.date} — ${r.end}</dd></div><div><dt>${U.tr('eventLocation')}</dt><dd>${U.bi(r.location)}</dd></div></dl>`:''}<p class="article-intro">${U.bi(r.summary)}</p><div class="article-paragraphs">${r.body.map(p=>`<p>${U.bi(p)}</p>`).join('')}</div><p class="content-disclaimer">${U.tr(event?'demoEvent':'demoEditorial')}</p><a class="text-link" href="${U.url(listPage(type))}">← ${U.tr('backList')}</a></article><aside class="content-aside panel"><h2>${U.tr('relatedContent')}</h2>${PlatformContent[type].filter(x=>x.id!==r.id).map(x=>`<a class="related-story" href="${detailURL(type,x.id)}"><strong>${U.bi(x.title)}</strong><small>${x.date}</small></a>`).join('')}<a class="button full-width" href="${U.url('rfq.html',{industry:r.industry})}">${U.tr('generalRfq')} →</a><a class="text-link" href="${U.url('products.html',{industry:r.industry})}">${U.tr('channelOpen')} →</a></aside></div></div>`;
    }else{
      const type=mode==='exhibitions'?'exhibitions':'news',event=type==='exhibitions';
      const q=params.get('q')||'', industry=params.get('industry')||'';
      const items=PlatformContent[type].filter(r=>(!industry||r.industry===industry)&&(!q||(r.title[U.lang]+' '+r.summary[U.lang]).toLowerCase().includes(q.toLowerCase())));
      document.title=U.t(event?'exhibitionsNav':'newsNav')+' | '+U.t('brandName');
      main.innerHTML=`<div class="container content-shell content-list-page"><div class="content-list-heading"><div class="page-intro"><div class="eyebrow">${U.t('brandName')} · ${U.tr('contentAll')}</div><h1>${U.tr(event?'exhibitionsNav':'newsNav')}</h1><p>${U.tr(event?'eventsHint':'newsHint')}</p></div><span class="content-demo-note">${U.tr(event?'demoEvent':'demoEditorial')}</span></div><section class="content-discovery" aria-label="${U.t('contentSearch')}"><div class="content-list-toolbar"><form action="${listPage(type)}" class="header-search"><label class="sr-only" for="content-search">${U.tr('contentSearch')}</label><input id="content-search" type="search" name="q" value="${U.e(q)}" placeholder="${U.t('searchContent')}"><input type="hidden" name="lang" value="${U.lang}"><input type="hidden" name="industry" value="${U.e(industry)}"><button>${U.tr('searchButton')}</button></form><span class="muted">${items.length} ${U.tr(event?'eventCount':'newsCount')}</span></div><div class="news-category-links"><a href="${U.url(listPage(type),{q})}" ${!industry?'aria-current="page"':''}>${U.tr('all')}</a>${[...new Set(PlatformContent[type].map(row=>row.industry))].map(id=>`<a href="${U.url(listPage(type),{industry:id,q})}" ${industry===id?'aria-current="page"':''}>${U.bi(U.industry(id).name)}</a>`).join('')}</div></section><div class="content-grid">${items.map(r=>card(type,r)).join('') || U.empty('contentMissing','contentMissingHint',listPage(type),'backList')}</div></div>`;
    }
    U.translate();AccountUI.refreshContext();
  }
  function missing(back){main.innerHTML=`<div class="container content-shell">${U.empty('contentMissing','contentMissingHint',back,'backList')}</div>`;U.translate();}
  render();window.addEventListener('languagechange',render);
  window.addEventListener('storage',event=>{if(event.key==='current_user')render();});
})();
