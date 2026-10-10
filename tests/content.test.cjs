const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const content=require('../mock/editorial-data.js');
test('content lookup rejects unknown and inherited type names without exposing records',()=>{
  for(const type of ['missing','__proto__','constructor']) assert.equal(content.find(type,'precision-sourcing'),null);
  assert.equal(content.find('news','not-found'),null);
});
test('news, exhibitions and procurement leads have stable bilingual detail data',()=>{
  const industries=JSON.parse(fs.readFileSync('mock/industries.json')).map(x=>x.id);
  for(const type of ['news','exhibitions','leads']){
    const ids=new Set();
    for(const row of content[type]){
      assert.ok(!ids.has(row.id));ids.add(row.id);
      assert.equal(content.find(type,row.id),row);
      assert.ok(industries.includes(row.industry));
      for(const language of ['zh','en']){
        assert.ok(row.title[language]);
        if(type==='leads') assert.ok(row.quantity[language] && row.country[language] && row.brief[language]);
        else {assert.ok(row.summary[language] && row.body.length);for(const paragraph of row.body) assert.ok(paragraph[language]);}
      }
      if(type!=='leads') assert.ok(fs.existsSync(`assets/media/banner-${row.art}.jpg`));
      if(type==='exhibitions') assert.ok(row.date<=row.end && row.location.zh && row.location.en);
    }
  }
});
