const {test} = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../js/supplier-core.js');
test('English-only articles can publish without Chinese fields', () => {
  assert.deepEqual(Core.validateArticle({title:{en:'Yacht delivery'},content_html:{en:'<p>Delivered today.</p>'},status:'published',product_ids:[]}),{});
});
test('English title and meaningful English body are required', () => {
  for (const html of ['', '<p><br></p>', '<p>&nbsp; &#160; &#xA0;</p>']) {
    const errors=Core.validateArticle({title:{zh:'中文'},content_html:{zh:'正文',en:html},status:'draft'});
    assert.equal(errors.title_en,'required');
    assert.equal(errors.content_en,'required');
  }
});
