const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:1298,height:872}});
 const page=await context.newPage(); page.setDefaultTimeout(4000);
 const base='http://127.0.0.1:4173/'; const failures=[]; const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 async function check(name,fn){try{await fn();console.log('PASS: '+name)}catch(e){failures.push(name+': '+e.message);console.error('FAIL: '+name)}}
 try {
  await page.goto(base+'supplier-auth.html?lang=zh');
  await page.locator('#demo-fill').click();await page.locator('#auth-form button[type=submit]').click();
  await page.waitForURL('**/seller-dashboard.html*');
  await page.evaluate(()=>{localStorage.setItem('certifications','[]');localStorage.setItem('articles','[]')});
  await check('empty certificate upload opens dialog',async()=>{
   await page.goto(base+'certifications.html?lang=zh');await page.locator('#cert-grid .empty .button').click();
   await page.waitForSelector('#cert-dialog[open]');
  });
  await check('empty article action opens editor',async()=>{
   await page.goto(base+'supplier-articles.html?lang=zh');await page.locator('#article-list .empty .button').click();
   await page.waitForSelector('#article-form');
  });
  await check('English-only editor and compact related checkboxes',async()=>{
   await page.goto(base+'supplier-articles.html?lang=zh');await page.locator('#article-new').click();
   assert.equal(await page.locator('#title_zh, #body_zh').count(),0);
   const box=await page.locator('[name=related]').first().boundingBox();assert.ok(box.width<=20&&box.height<=20,JSON.stringify(box));
   await page.locator('[data-save=published]').click();
   assert.ok(await page.locator('[data-error=content_en]').innerText());
   await page.locator('#title_en').fill('Tester English article');await page.locator('#body_en').fill('English article body for regression.');
   await page.locator('[name=related]').first().check();
   await page.locator('[data-save=published]').click();
   await page.waitForSelector('#article-list');
   const article=await page.evaluate(()=>JSON.parse(localStorage.articles).find(a=>a.title.en==='Tester English article'));
   assert.ok(article);assert.ok((await page.locator('#article-list').innerText()).includes(article.title.en));
   await page.locator('#feedback button').click();
   await page.locator(`[data-edit="${article.id}"]`).click();
   await page.locator('#article-form').screenshot({path:'docs/screenshots/tester-article-editor-desktop.png'});
   await page.setViewportSize({width:390,height:844});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   const mobileBox=await page.locator('[name=related]').first().boundingBox();assert.equal(mobileBox.width,18);assert.equal(mobileBox.height,18);
   await page.locator('#article-form').screenshot({path:'docs/screenshots/tester-article-editor-mobile.png'});
   await page.setViewportSize({width:1298,height:872});
   await page.goto(base+'content.html?lang=zh&type=article&id='+article.id);
   assert.equal(await page.locator('.article-body h1').innerText(),article.title.en);
   assert.ok((await page.locator('.article-paragraphs').innerText()).includes('English article body'));
  });
  await check('company draft survives certification navigation including incomplete values',async()=>{
   await page.goto(base+'company.html?lang=zh');await page.locator('#edit-company').click();
   await page.locator('[name=supplier_city]').fill('自动保存测试城市');
   await page.locator('[name=supplier_contact]').fill('');
   await page.locator('#team-add').click();await page.locator('[name=team_position]').fill('未填姓名的成员草稿');
   const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=400;c.height=400;return c.toDataURL().split(',')[1]});
   const photo={name:'draft-photo.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')};
   await page.locator('[name=team_photo]').setInputFiles(photo);
   await page.locator('[name=company_logo_upload]').setInputFiles({...photo,name:'draft-logo.png'});
   await page.locator('#company-photos').setInputFiles({...photo,name:'draft-workshop.png'});
   await page.locator('#company-form a[href*="certifications.html"]').click();
   await page.waitForURL('**/certifications.html*');await page.goto(base+'company.html?lang=zh');
   assert.equal(await page.locator('[name=supplier_city]').inputValue(),'自动保存测试城市');
   assert.equal(await page.locator('[name=supplier_contact]').inputValue(),'');
   assert.equal(await page.locator('[name=team_position]').inputValue(),'未填姓名的成员草稿');
   const profile=await page.evaluate(()=>JSON.parse(localStorage.supplier_profile));assert.notEqual(profile.city,'自动保存测试城市');
   await page.waitForFunction(()=>document.querySelector('.team-editor-photo')?.naturalWidth===400);
   assert.ok((await page.locator('#company-form').innerText()).includes('draft-logo.png'));
   assert.ok((await page.locator('#company-form').innerText()).includes('draft-workshop.png'));
   await page.locator('[name=supplier_contact]').fill('Test contact');await page.locator('[name=team_name]').fill('Designer');
   await page.locator('#company-form button[type=submit]').click();await page.waitForSelector('#edit-company');
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.supplier_profile).city),'自动保存测试城市');
   assert.equal(await page.evaluate(()=>localStorage.getItem('company_edit_draft:'+JSON.parse(localStorage.current_user).id)),null);
   await page.locator('#feedback button').click();
   await page.reload();await page.locator('#edit-company').click();
   await page.locator('[name=supplier_city]').fill('应取消的草稿');
   await page.locator('#company-form a[href*="certifications.html"]').click();await page.waitForURL('**/certifications.html*');
   await page.goto(base+'company.html?lang=zh');
   await page.locator('#cancel-company').click();await page.reload();assert.equal(await page.locator('#company-form').count(),0);
  });
  await check('failed draft persistence keeps user on form with entered values',async()=>{
   await page.goto(base+'company.html?lang=zh');
   if(!await page.locator('#company-form').count())await page.locator('#edit-company').click();
   await page.locator('[name=supplier_city]').fill('保存失败时保留');
   await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Quota exceeded','QuotaExceededError')}});
   await page.locator('#company-form a[href*="certifications.html"]').click();
   await page.waitForFunction(()=>document.querySelector('#company-summary')?.textContent.trim());
   assert.ok(page.url().includes('company.html'));assert.equal(await page.locator('[name=supplier_city]').inputValue(),'保存失败时保留');
  });
  assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
