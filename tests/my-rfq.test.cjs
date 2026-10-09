const { test } = require('node:test');
const assert = require('node:assert/strict');
const BuyerRfq = require('../js/my-rfq.js');
const buyer = { id: 'buyer-a', role: 'buyer' };
const records = [
  { id: 'old', buyer: { id: 'buyer-a' }, status: 'submitted', created_at: '2026-10-01T00:00:00Z' },
  { id: 'reply', buyer: { id: 'buyer-a' }, status: 'replied', reply: { message: 'Demo quote' }, created_at: '2026-10-09T00:00:00Z' },
  { id: 'view', buyer: { id: 'buyer-a' }, status: 'viewed', created_at: '2026-10-08T00:00:00Z' },
  { id: 'other', buyer: { id: 'buyer-b' }, status: 'replied', created_at: '2026-10-09T00:00:00Z' },
  { id: 'legacy', buyer: { company: 'Legacy' }, status: 'submitted', created_at: '2026-10-09T00:00:00Z' },
];
test('buyer list isolates owner and excludes legacy inquiries without a buyer id', () => {
 assert.deepEqual(BuyerRfq.select(records, buyer).map(r => r.id), ['reply','view','old']);
});
test('guest, supplier and an empty buyer id cannot read buyer inquiries', () => {
 for (const user of [null, {role:'supplier',id:'buyer-a'}, {role:'buyer'}, {role:'buyer',id:''}]) assert.deepEqual(BuyerRfq.select(records,user), []);
});
test('buyer status filter and ascending date sort work without rewriting shared records', () => {
 const before = JSON.stringify(records);
 assert.deepEqual(BuyerRfq.select(records,buyer,{status:'replied'}).map(r=>r.id),['reply']);
 assert.deepEqual(BuyerRfq.select(records,buyer,{sort:'oldest'}).map(r=>r.id),['old','view','reply']);
 assert.equal(JSON.stringify(records),before);
 assert.equal(records[1].reply.message,'Demo quote');
});
test('legacy optional fields are not required for buyer tracking', () => {
 const row = {id:'missing-fields',buyer:{id:'buyer-a'},status:'submitted',created_at:'2026-10-09T00:00:00Z'};
 assert.equal(BuyerRfq.select([row],buyer)[0],row);
 assert.deepEqual(BuyerRfq.select([row],{role:'buyer',id:'buyer-b'}),[]);
});
