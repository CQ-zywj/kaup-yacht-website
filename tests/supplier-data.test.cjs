const { test } = require('node:test');
const assert = require('node:assert/strict');
const Data = require('../js/supplier-data.js');
test('public certificates isolate suppliers, hide private, rejected and expired records, and retain unverified uploads', () => {
  const rows = [
    {id:'public',supplier_id:'a',category:'product',status:'pending',valid_to:'2099-01-01'},
    {id:'license',supplier_id:'a',category:'company',status:'verified'},
    {id:'private',supplier_id:'a',category:'product',visibility:'private'},
    {id:'expired',supplier_id:'a',category:'product',valid_to:'2020-01-01'},
    {id:'rejected',supplier_id:'a',category:'product',status:'rejected'},
    {id:'other',supplier_id:'b',category:'product'},
  ];
  assert.deepEqual(Data.publicCertificates(rows,'a','2026-10-21').map(x=>x.id),['public']);
  assert.equal(rows[0].status,'pending');
});
test('public company projection excludes bank details, private certificates and account credentials', () => {
  const profile = {id:'a',company:'Boat Co',email:'private@example.com',phone:'123',password_hash:'secret',bank_account:'12345',finance:{bank:'private'},intro:{en:'Shipyard'},team:[{name:'Sam',position:'Designer',intro:'Boats',photo:{id:'photo'}}]};
  const publicProfile = Data.publicProfile(profile);
  assert.equal(publicProfile.company,'Boat Co');
  assert.equal(publicProfile.team[0].name,'Sam');
  for (const key of ['email','phone','password_hash','bank_account','finance']) assert.equal(publicProfile[key],undefined);
});
test('bank proof rejects wrong formats and oversized documents', () => {
  assert.equal(Data.fileError({type:'application/pdf',size:5*1024*1024},'bank'),'');
  assert.ok(Data.fileError({type:'application/pdf',size:5*1024*1024+1},'bank'));
  assert.ok(Data.fileError({type:'image/png',size:200},'bank'));
  assert.equal(Data.fileError({type:'image/png',size:200},'certificate'),'');
});
test('future and private-category certificates cannot appear as current public credentials', () => {
  assert.deepEqual(Data.publicCertificates([
    {id:'future',supplier_id:'a',category:'product',valid_from:'2099-01-01',visibility:'public'},
    {id:'license',supplier_id:'a',category:'company',visibility:'public'},
    {id:'authorization',supplier_id:'a',category:'authorization',visibility:'public'},
  ],'a','2026-10-21'),[]);
});
