/* Local document conversion shared by article and product imports. */
(function(root){
  const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const allowed = new Set('p div span br hr h1 h2 h3 h4 h5 h6 strong b em i u s blockquote ul ol li table thead tbody tfoot tr th td a img pre code sub sup'.split(' '));
  const ignored = new Set('script style noscript template iframe object embed svg math form input button select textarea link meta head base audio video source'.split(' '));
  function safeUrl(value,image=false){
    const url=String(value||'').trim();
    if(/[\u0000-\u0020\u007f\\]/.test(url))return '';
    if(/^https?:\/\//i.test(url))return url;
    if(image && /^data:image\/(png|jpeg|gif|webp);base64,[a-z\d+/=]+$/i.test(url))return url;
    if(!image && /^(mailto:|tel:|#)/i.test(url))return url;
    if(/^(?:\.\/)?assets\/[a-z\d_./%-]+$/i.test(url)&&!url.includes('..'))return url;
    if(image && /^blob:https?:\/\//.test(url))return url;
    return '';
  }
  function sanitize(html){
    const doc=new DOMParser().parseFromString(String(html),'text/html');
    function clean(node){
      if(node.nodeType===3)return escape(node.textContent);
      if(node.nodeType!==1)return '';
      const tag=node.localName.toLowerCase();
      if(ignored.has(tag))return '';
      const children=()=>[...node.childNodes].map(clean).join('');
      if(!allowed.has(tag))return children();
      let attrs='';
      if(tag==='img'){
        const src=safeUrl(node.getAttribute('src'),true);if(!src)return '';
        return `<img src="${escape(src)}" alt="${escape(node.getAttribute('alt')||'')}">`;
      }
      if(tag==='a'){
        const href=safeUrl(node.getAttribute('href'));if(!href)return children();
        attrs=` href="${escape(href)}" rel="noopener noreferrer"`;
      }
      if(tag==='td'||tag==='th')for(const name of ['colspan','rowspan']){
        const n=Number(node.getAttribute(name));if(Number.isInteger(n)&&n>1&&n<=20)attrs+=` ${name}="${n}"`;
      }
      if(tag==='ol'){
        const start=Number(node.getAttribute('start'));if(Number.isInteger(start)&&start>0&&start<10000)attrs+=` start="${start}"`;
      }
      if(['br','hr'].includes(tag))return `<${tag}>`;
      return `<${tag}${attrs}>${children()}</${tag}>`;
    }
    return [...doc.body.childNodes].map(clean).join('');
  }
  function textHtml(text){
    return String(text).replace(/\r\n?/g,'\n').split(/\n\s*\n/).filter(part=>part.trim()).map(part=>`<p>${escape(part.trim()).replace(/\n/g,'<br>')}</p>`).join('');
  }
  async function read(file){
    if(!file || !/\.(docx|html?|txt)$/i.test(file.name))throw Error('documentFormatError');
    if(file.size>20*1024*1024)throw Error('documentSizeError');
    const extension=file.name.split('.').pop().toLowerCase();let html='',title='',messages=[];
    if(extension==='docx'){
      const result=await root.mammoth.convertToHtml({arrayBuffer:await file.arrayBuffer()},{
        styleMap:["p[style-name='Title'] => h1:fresh"],
        convertImage:root.mammoth.images.imgElement(async image=>({src:/^image\/(png|jpeg|gif|webp)$/.test(image.contentType)?`data:${image.contentType};base64,${await image.read('base64')}`:''}))
      });html=result.value;messages=result.messages.map(message=>message.message);
    }else{
      const text=await file.text();
      if(extension==='txt'){
        const lines=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/);
        title=lines.shift()?.trim()||'';html=textHtml(lines.join('\n').trim()||title);
      }else{
        const doc=new DOMParser().parseFromString(text,'text/html');title=doc.querySelector('title')?.textContent.trim()||'';html=doc.body.innerHTML;
      }
    }
    html=sanitize(html);
    const doc=new DOMParser().parseFromString(html,'text/html');
    const first=doc.body.firstElementChild;
    if(first?.matches('h1')&&first.textContent.trim()){
      title=first.textContent.trim();first.remove();
    }
    title=title||file.name.replace(/\.[^.]+$/,'');
    html=doc.body.innerHTML;
    const text=doc.body.textContent.trim();
    if(!text && !doc.querySelector('img'))throw Error('documentEmptyError');
    if(html.length>3*1024*1024)throw Error('documentContentLarge');
    return {title,html,text,messages};
  }
  root.DocumentImport={read,sanitize,safeUrl,textHtml};
})(window);
