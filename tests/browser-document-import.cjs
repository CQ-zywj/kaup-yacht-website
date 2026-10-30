const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert=require('node:assert/strict');
const JSZip=require('../js/vendor/jszip.min.js');
async function wordFile(){
 const zip=new JSZip();
 zip.file('[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
 zip.file('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
 zip.file('word/document.xml','<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Launch announcement</w:t></w:r></w:p><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Bold opening</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>Length</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>42ft</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:body></w:document>');
 zip.file('word/styles.xml','<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/></w:style></w:styles>');
 const xml=await zip.file('word/document.xml').async('string');
 zip.file('word/document.xml',xml.replace('<w:document ', '<w:document xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" ').replace('</w:body>', '<w:p><w:r><w:drawing><wp:inline><a:graphic><a:graphicData><pic:pic><pic:blipFill><a:blip r:embed="image1"/></pic:blipFill></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p></w:body>'));
 zip.file('word/_rels/document.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="image1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image.png"/></Relationships>');
 zip.file('word/media/image.png',Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jVZkAAAAASUVORK5CYII=','base64'));
 return {name:'launch.docx',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',buffer:await zip.generateAsync({type:'nodebuffer'})};
}
async function run(){
 const browser=await chromium.launch({headless:true});
 try{
 const page=await browser.newPage({viewport:{width:1298,height:900}});page.setDefaultTimeout(5000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const base='http://127.0.0.1:4173/';
 await page.goto(base+'supplier-auth.html?lang=zh');await page.locator('#demo-fill').click();await page.locator('#auth-form button[type=submit]').click();await page.waitForURL('**/seller-dashboard.html*');
 await page.goto(base+'supplier-articles.html?lang=zh');await page.locator('#article-new').click();
 await page.locator('#title_en').fill('Keep my title');await page.locator('#body_en').fill('Keep my existing text.');
 await page.locator('#article-import-file').setInputFiles(await wordFile());
 await page.waitForSelector('#article-import-preview[open]');
 assert.equal(await page.locator('#import-title').inputValue(),'Launch announcement');
 assert.equal(await page.locator('#import-body strong').innerText(),'Bold opening');
 assert.equal(await page.locator('#import-body table').count(),1);
 await page.locator('#import-cancel').click();assert.equal(await page.locator('#body_en').innerText(),'Keep my existing text.');
 await page.locator('#article-import-file').setInputFiles(await wordFile());await page.waitForSelector('#article-import-preview[open]');
 await page.locator('#article-import-preview').screenshot({path:'docs/screenshots/optimization-article-import-desktop.png'});
 await page.setViewportSize({width:390,height:844});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.ok(await page.locator('#article-import-preview').evaluate(d=>d.scrollWidth<=d.clientWidth));
 await page.locator('#article-import-preview').screenshot({path:'docs/screenshots/optimization-article-import-mobile.png'});
 await page.setViewportSize({width:1298,height:900});
 await page.locator('#import-apply').click();assert.equal(await page.locator('#title_en').inputValue(),'Launch announcement');
 assert.equal(await page.locator('#body_en strong').count(),1);assert.equal(await page.locator('#body_en table').count(),1);
 assert.equal(await page.locator('#body_en img').count(),1);assert.ok((await page.locator('#cover-preview').getAttribute('src')).startsWith('data:image/png'));
 await page.locator('#language').click();assert.equal(await page.locator('#title_en').inputValue(),'Launch announcement');assert.equal(await page.locator('#body_en table').count(),1);
 const before=await page.locator('#body_en').innerHTML();
 await page.locator('#article-import-file').setInputFiles({name:'bad.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF')});
 await page.waitForFunction(()=>document.querySelector('#article-import-status')?.textContent.trim());
 assert.equal(await page.locator('#body_en').innerHTML(),before);
 await page.locator('#article-import-file').setInputFiles({name:'safe.html',mimeType:'text/html',buffer:Buffer.from('<h1>Safe heading</h1><p onclick="window.BAD=1">Hello <em>world</em></p><script>window.BAD=1</script><iframe srcdoc="bad"></iframe><a href="javascript:alert(1)">unsafe</a><img src=x onerror="window.BAD=1"><ul><li>Point</li></ul>')});
 await page.waitForSelector('#article-import-preview[open]');assert.equal(await page.locator('#import-body script,#import-body iframe,#import-body [onclick],#import-body [onerror],#import-body [href^="javascript:"]').count(),0);
 assert.equal(await page.evaluate(()=>window.BAD),undefined);await page.locator('#import-mode').selectOption('append');await page.locator('#import-apply').click();
 assert.equal(await page.locator('#title_en').inputValue(),'Launch announcement');assert.equal(await page.locator('#body_en table').count(),1);assert.equal(await page.locator('#body_en ul').count(),1);
 await page.locator('[data-save=published]').click();await page.waitForSelector('#article-list');
 const article=await page.evaluate(()=>JSON.parse(localStorage.articles).find(a=>a.title.en==='Launch announcement'));
 await page.goto(base+'content.html?type=article&lang=en&id='+article.id);assert.equal(await page.locator('.article-paragraphs table').count(),1);assert.equal(await page.locator('.article-paragraphs ul').count(),1);
 await page.goto(base+'supplier-articles.html?lang=en');await page.locator('#article-new').click();await page.locator('#title_en').fill('Preserve text');await page.locator('#body_en').fill('Existing text');
 await page.evaluate(()=>{window.savedUser=localStorage.current_user;window.originalRead=DocumentImport.read;DocumentImport.read=()=>new Promise(resolve=>window.resolveImport=resolve)});
 await page.locator('#article-import-file').setInputFiles({name:'wait.txt',mimeType:'text/plain',buffer:Buffer.from('Heading\n\nBody')});
 await page.waitForFunction(()=>typeof window.resolveImport==='function');
 await page.evaluate(()=>{localStorage.current_user=JSON.stringify({id:'other',role:'supplier'});window.resolveImport({title:'Wrong owner',html:'<p>Do not apply</p>',text:'Do not apply',messages:[]})});
 await page.waitForFunction(()=>!document.querySelector('#article-import-file').disabled);
 assert.equal(await page.locator('#article-import-preview').evaluate(d=>d.open),false);assert.equal(await page.locator('#body_en').innerText(),'Existing text');
 await page.locator('[data-save=published]').click();assert.equal(await page.locator('#article-form').count(),1);
 assert.deepEqual(errors,[]);console.log('PASS: Word formatting/title/table; preview cancellation; replacement/append; unsupported-file preservation; sanitized HTML; publication persistence');
 }finally{await browser.close()}
}
if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1});
module.exports={wordFile};
