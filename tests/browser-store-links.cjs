const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1298,height:900}});const base='http://127.0.0.1:4173/';const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const lang of ['zh','en']){
   for(const source of ['index.html','suppliers.html']){
    await page.goto(base+source+'?lang='+lang);
    const cards=page.locator(source==='index.html'?'.portal-supplier':'.directory-company');assert.ok(await cards.count());
    for(const card of await cards.all()){
     const store=card.locator('.supplier-store-link');assert.equal(await store.count(),1);
     const href=await store.getAttribute('href');const query=new URL(href,base).searchParams;assert.ok(query.get('supplier_id'));assert.equal(query.get('lang'),lang);
     const products=card.locator('a[href*="products.html"]').first();assert.equal(new URL(await products.getAttribute('href'),base).searchParams.get('supplier'),query.get('supplier_id'));
    }
    if(source==='suppliers.html'&&lang==='en')await page.locator('.supplier-directory-grid').screenshot({path:'docs/screenshots/optimization-store-links.png'});
    await cards.first().locator('.supplier-store-link').click();assert.ok(page.url().includes('storefront.html'));assert.ok(await page.locator('main h1').count());
    assert.equal(await page.locator('#auth-form').count(),0);
   }
  }
  await page.setViewportSize({width:390,height:844});await page.goto(base+'suppliers.html?lang=en');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.ok(await page.locator('.supplier-store-link').first().isVisible());
  assert.deepEqual(errors,[]);console.log('PASS: bilingual featured/directory store links preserve supplier IDs; guest access; mobile layout');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
