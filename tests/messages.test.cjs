const { test } = require("node:test");
const assert = require("node:assert/strict");
const M = require("../js/messages-core.js");

const legacy = () => ({
  id: "rfq-legacy",
  product_id: "p01",
  supplier_id: "s1",
  category_id: "boats",
  subcategory_id: "yacht",
  quantity: 2,
  message: "Need two yachts",
  attachments: [],
  buyer: { id: "buyer-1", company: "Bluewater", country: "Germany", type: "buyer" },
  status: "replied",
  created_at: "2026-10-20T02:00:00.000Z",
  reply: {
    message: "We can deliver in Q2.",
    attachments: [],
    created_at: "2026-10-20T06:00:00.000Z",
  },
});

test("legacy single-reply record upgrades into an ordered message thread", () => {
  const row = M.normalize(legacy());
  assert.equal(row.mode, "inquiry");
  assert.equal(row.messages.length, 2);
  assert.deepEqual(
    row.messages.map((m) => [m.from, m.type]),
    [
      ["buyer", "inquiry"],
      ["supplier", "reply"],
    ],
  );
  assert.equal(row.first_reply_at, "2026-10-20T06:00:00.000Z");
  assert.equal(row.messages[0].read_at, "2026-10-20T06:00:00.000Z");
  assert.equal(row.messages[1].read_at, null);
  assert.equal(M.unreadCount(row, "buyer"), 1);
  assert.equal(M.unreadCount(row, "supplier"), 0);
});

test("replying appends instead of overwriting and keeps history", () => {
  let row = M.normalize(legacy());
  row = M.appendMessage(row, { from: "buyer", body: "Can you add a trailer?" });
  row = M.appendMessage(row, { from: "supplier", body: "Yes, +USD 1,800." });
  assert.equal(row.messages.length, 4);
  assert.equal(row.messages[1].body, "We can deliver in Q2.");
  assert.equal(row.status, "replied");
  assert.equal(M.unreadCount(row, "supplier"), 1);
  assert.equal(M.unreadCount(row, "buyer"), 2);
});

test("marking read clears only the other side messages and moves submitted to viewed", () => {
  let row = M.normalize({ ...legacy(), status: "submitted", reply: undefined });
  assert.equal(row.status, "submitted");
  assert.equal(M.unreadCount(row, "supplier"), 1);
  row = M.markRead(row, "supplier", "2026-10-21T00:00:00.000Z");
  assert.equal(M.unreadCount(row, "supplier"), 0);
  assert.equal(row.messages[0].read_at, "2026-10-21T00:00:00.000Z");
  assert.equal(row.status, "viewed");
});

test("structured quote stores price, MOQ, lead time, terms and reveals contact", () => {
  let row = M.normalize(legacy());
  row = M.addQuote(
    row,
    { price: 185000, moq: 1, lead_time: 90, incoterms: "CIF", valid_until: "2026-11-30" },
    "FOB Dalian, 90 days",
    [],
    { id: "staff-1", name: "Wang Hai" },
  );
  assert.equal(row.status, "quoted");
  assert.equal(row.contact_revealed, true);
  const quote = M.lastMessage(row);
  assert.equal(quote.type, "quote");
  assert.equal(quote.quote.price, 185000);
  assert.equal(quote.quote.incoterms, "CIF");
  assert.equal(quote.sender_name, "Wang Hai");
  assert.throws(() => M.addQuote(row, { price: 0, moq: 1 }), /invalid price/);
});

test("buyer accepts a quote and the thread becomes accepted", () => {
  let row = M.normalize(legacy());
  row = M.addQuote(row, { price: 120000, moq: 1, lead_time: 60 }, "ok");
  const quoteId = M.lastMessage(row).id;
  row = M.acceptQuote(row, quoteId);
  assert.equal(row.status, "accepted");
  assert.equal(row.accepted_quote_id, quoteId);
  assert.equal(M.unreadCount(row, "supplier"), 0, "系统提示不算未读");
  assert.throws(() => M.acceptQuote(row, "missing"), /quote not found/);
});

test("assignment prefers the same buyer history before region", () => {
  const first = M.autoAssign(M.normalize(legacy()), []);
  assert.ok(first.assignee_id);
  assert.equal(first.assignee_id, "staff-1");
  const second = M.autoAssign(
    M.normalize({ ...legacy(), id: "rfq-2", buyer: { ...legacy().buyer, country: "United States" } }),
    [first],
  );
  assert.equal(second.assignee_id, first.assignee_id);
});

test("response stats count first reply within three days", () => {
  const quick = M.normalize(legacy());
  const slow = M.normalize({
    ...legacy(),
    id: "rfq-slow",
    created_at: "2026-01-01T00:00:00.000Z",
    reply: { message: "late", attachments: [], created_at: "2026-01-10T00:00:00.000Z" },
    first_reply_at: undefined,
  });
  const waiting = M.normalize({
    ...legacy(),
    id: "rfq-wait",
    status: "submitted",
    reply: undefined,
  });
  const stats = M.responseStats([quick, slow, waiting]);
  assert.equal(stats.total, 3);
  assert.equal(stats.replied, 2);
  assert.equal(stats.waiting, 1);
  assert.equal(stats.within3d, 1);
  assert.equal(stats.rate, 33);
  assert.equal(stats.avgHours > 0, true);
});

/* 公开 RFQ 主帖的写法：买家发出的需求去掉供应商绑定，等待各家报价。
   （原 toPublicRfq() 已删除——它注释声称"1440 分钟无人回复自动转公开"，
   实际没有调度器也没有调用方，是死代码。） */
const publicMaster = () => ({
  ...M.normalize(legacy()),
  id: "rfq-public-1",
  mode: "rfq",
  supplier_id: null,
  public_of: null,
  status: "submitted",
});

test("public RFQ forks one private thread per supplier and hides rival prices", () => {
  const master = publicMaster();
  const a = M.forkForSupplier(
    master,
    "s1",
    "Dalian yard",
    { price: 100000, moq: 1, lead_time: 60 },
    "CIF Rotterdam",
  );
  const b = M.forkForSupplier(
    master,
    "s2",
    "Qingdao yard",
    { price: 90000, moq: 2, lead_time: 90 },
    "FOB Qingdao",
  );
  assert.notEqual(a.id, b.id);
  assert.equal(a.supplier_id, "s1");
  assert.equal(a.public_of, master.id);
  assert.equal(a.status, "quoted");
  assert.equal(a.contact_revealed, false);
  assert.equal(a.messages.filter((m) => m.type === "quote").length, 1);
  assert.ok(a.messages[0].read_at, "报价方已读过原始需求");
  assert.equal(
    a.messages.some((m) => m.quote && m.quote.price === 90000),
    false,
  );
  const rows = [master, a, b];
  assert.equal(M.relatedQuotes(rows, master.id).length, 2);
  assert.equal(M.relatedQuotes(rows, "rfq-unknown").length, 0);
  assert.throws(
    () => M.forkForSupplier(master, "", "no id", { price: 1, moq: 1 }),
    /missing supplier/,
  );
});

test("status keys cover every lifecycle state and fall back safely", () => {
  for (const status of M.STATUSES)
    assert.match(M.statusKey(status), /^status[A-Z]/);
  assert.equal(M.statusKey("unknown"), "statusSubmitted");
});
