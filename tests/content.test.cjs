const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const content=require('../mock/editorial-data.js');
test('content lookup rejects unknown and inherited type names without exposing records',()=>{
  for(const type of ['missing','__proto__','constructor']) assert.equal(content.find(type,'precision-sourcing'),null);
  assert.equal(content.find('news','not-found'),null);
});
test('news and exhibitions have stable bilingual detail data, demo leads stay removed',()=>{
  const industries=JSON.parse(fs.readFileSync('mock/industries.json')).map(x=>x.id);
  for(const type of ['news','exhibitions']){
    const ids=new Set();
    for(const row of content[type]){
      assert.ok(!ids.has(row.id));ids.add(row.id);
      assert.equal(content.find(type,row.id),row);
      assert.ok(industries.includes(row.industry));
      for(const language of ['zh','en']){
        assert.ok(row.title[language]);
        assert.ok(row.summary[language] && row.body.length);
        for(const paragraph of row.body) assert.ok(paragraph[language]);
      }
      assert.ok(fs.existsSync(`assets/media/banner-${row.art}.jpg`));
      if(type==='exhibitions') assert.ok(row.date<=row.end && row.location.zh && row.location.en);
    }
  }
  /* 首页那 3 条「演示采购线索」是原型期填充物：买家不存在，点"联系"什么也不发生。
     2026-10-29 下线，数据与 inquiry-detail.html 详情一起移除，不允许被加回来。 */
  assert.equal(content.leads,undefined);
  assert.equal(content.find('leads','bearing-lead'),null);
});
