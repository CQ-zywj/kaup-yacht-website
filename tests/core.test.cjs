const { test } = require("node:test");
const assert = require("node:assert/strict");
const C = require("../js/core.js");
const items = [
  {
    id: "a",
    category_id: "boats",
    parameters: { material: "FRP", length: 12 },
    certifications: [{ type: "CCS" }],
    i18n: { zh: { title: "游艇" }, en: { title: "Yacht" } },
    trade: { price_min: 10 },
    updated_at: "2026-10-01",
  },
  {
    id: "b",
    category_id: "boats",
    parameters: { material: "Aluminum", length: 20 },
    certifications: [{ type: "DNV" }],
    i18n: { zh: { title: "工作艇" }, en: { title: "Workboat" } },
    trade: { price_min: 20 },
    updated_at: "2026-10-02",
  },
];
test("AND category/parameter/cert/query", () =>
  assert.deepEqual(
    C.filterProducts(items, {
      category: "boats",
      q: "yacht",
      cert: ["CCS"],
      params: { material: ["FRP"] },
    }).map((x) => x.id),
    ["a"],
  ));
test("OR within field and inclusive range", () =>
  assert.equal(
    C.filterProducts(items, {
      params: { material: ["FRP", "Aluminum"], length: { min: 12, max: 20 } },
    }).length,
    2,
  ));
test("unknown category and invalid range", () => {
  assert.equal(C.filterProducts(items, { category: "bad" }).length, 0);
  assert.equal(
    C.filterProducts(items, { params: { length: { min: 25, max: 12 } } })
      .length,
    0,
  );
});
test("platform industry filters include legacy marine groups and isolate empty new industries", () => {
  assert.deepEqual(C.filterProducts(items, { industry: 'marine' }).map(p => p.id), ['a', 'b']);
  assert.deepEqual(C.filterProducts(items, { industry: 'bearings' }).map(p => p.id), []);
  const bearing = { ...items[0], id: 'bearing', category_id: 'bearings', supplier_id: 'supplier-2' };
  assert.deepEqual(C.filterProducts([...items, bearing], { industry: 'bearings', supplier: 'supplier-2' }).map(p => p.id), ['bearing']);
  assert.deepEqual(C.filterProducts([bearing], { industry: 'bearings', supplier: 'supplier-1' }), []);
});
test("sort uses price, date and relevance", () => {
  assert.equal(C.sortProducts(items, "price", "")[0].id, "a");
  assert.equal(C.sortProducts(items, "updated", "")[0].id, "b");
  assert.equal(C.sortProducts(items, "relevance", "yacht")[0].id, "a");
});
test("coatings compliance required", () => {
  const errors = C.validateProduct({
    category_id: "coatings",
    i18n: {
      zh: { title: "x", description: "x" },
      en: { title: "x", description: "x" },
    },
    compliance: {},
  });
  assert.ok(errors.includes("msds"));
  assert.ok(errors.includes("un_number"));
  assert.ok(errors.includes("afs"));
});
test("replied inquiry never downgraded", () => {
  assert.equal(C.viewRfq({ status: "submitted" }).status, "viewed");
  assert.equal(C.viewRfq({ status: "replied" }).status, "replied");
});
test("reply persists text and attachments", () => {
  const result = C.replyRfq({ status: "viewed" }, "Quotation attached", [
    { name: "quote.pdf" },
  ]);
  assert.equal(result.status, "replied");
  assert.equal(result.reply.message, "Quotation attached");
  assert.equal(result.reply.attachments.length, 1);
});
test("blank reply rejected", () =>
  assert.throws(() => C.replyRfq({}, "  ", [])));
test("storage malformed and quota failures are observable", () => {
  assert.throws(() => C.readArray({ getItem: () => "{bad" }, "x"));
  assert.throws(() =>
    C.writeArray(
      {
        setItem: () => {
          throw Error("Quota");
        },
      },
      "x",
      [],
    ),
  );
  assert.deepEqual(C.readArray({ getItem: () => null }, "x"), []);
});
test("restored certificate keeps its filename when no replacement selected", () =>
  assert.deepEqual(C.certificateRecord("CCS", "123", "saved.png", null), {
    type: "CCS",
    number: "123",
    image: "saved.png",
  }));
test("replacement certificate attachment takes precedence", () =>
  assert.equal(
    C.certificateRecord("ABS", "456", "old.png", { name: "new.png" }).image,
    "new.png",
  ));
test("URL page is a finite positive integer", () => {
  assert.equal(C.pageNumber("1.5"), 1);
  assert.equal(C.pageNumber("Infinity"), 1);
  assert.equal(C.pageNumber("-1"), 1);
});
test("nested corrupt inquiry attachments rejected before rendering", () => {
  const r = {
    id: "x",
    buyer: { company: "Demo", country: "China" },
    quantity: 1,
    target_country: "Germany",
    message: "Demo",
    created_at: "2026-10-08T10:00:00Z",
    status: "submitted",
    attachments: [null],
  };
  assert.throws(() =>
    C.readArray({ getItem: () => JSON.stringify([r]) }, "rfq_drafts"),
  );
});
test("incomplete drafts remain structurally valid", () => {
  const p = require("../mock/products.json")[8];
  p.status = "draft";
  p.compliance = {};
  assert.equal(
    C.readArray({ getItem: () => JSON.stringify([p]) }, "draft_products")
      .length,
    1,
  );
});
test("technical keywords find parameter values", () =>
  assert.equal(C.filterProducts(items, { q: "Aluminum" }).length, 1));
test("relevance prioritizes title match over description-only match", () => {
  const a = {
      ...items[0],
      i18n: { en: { title: "Yacht", description: "Boat" } },
    },
    b = {
      ...items[1],
      i18n: {
        en: { title: "Marine platform", description: "Yacht equipment" },
      },
    };
  assert.equal(C.sortProducts([b, a], "relevance", "yacht")[0].id, "a");
});
test("thread records with multi-round messages and lifecycle statuses stay valid", () => {
  const base = {
    id: "rfq-thread",
    buyer: { company: "Demo", country: "China" },
    quantity: 2,
    status: "quoted",
    attachments: [],
    created_at: new Date().toISOString(),
    messages: [
      { from: "buyer", type: "inquiry", body: "Need 2 units" },
      {
        from: "supplier",
        type: "quote",
        body: "",
        quote: { price: 100, moq: 1, lead_time: 30 },
      },
    ],
  };
  const rows = C.readArray(
    { getItem: () => JSON.stringify([base]) },
    "rfq_drafts",
  );
  assert.equal(rows[0].status, "quoted");
  assert.throws(() =>
    C.readArray(
      {
        getItem: () =>
          JSON.stringify([
            { ...base, messages: [{ from: "buyer", type: "inquiry" }] },
          ]),
      },
      "rfq_drafts",
    ),
  );
  assert.throws(() =>
    C.readArray(
      { getItem: () => JSON.stringify([{ ...base, status: "archived" }]) },
      "rfq_drafts",
    ),
  );
});
test("new inquiries can omit target country and delivery and retain product taxonomy", () => {
 const inquiry = { id:'rfq-taxonomy', buyer:{company:'Demo',country:'China'}, quantity:2, category_id:'boats', subcategory_id:'motor-yacht', message:'Demo request', status:'submitted', attachments:[], created_at:new Date().toISOString() };
 const records = C.readArray({getItem:()=>JSON.stringify([inquiry])},'rfq_drafts');
 assert.equal(records[0].category_id,'boats');
 assert.equal(records[0].expected_delivery,undefined);
});

test("new industry products survive draft storage and join the correct marketplace", () => {
  const seed = require("../mock/products.json")[0];
  for (const category_id of ["bearings", "machine-tools", "agriculture", "forestry", "chemicals"]) {
    const draft = {...seed, id: "new-" + category_id, category_id, industry_id: category_id, status: "published"};
    const restored = C.readArray({getItem: () => JSON.stringify([draft])}, "draft_products");
    assert.equal(C.filterProducts(restored, {industry: category_id}).length, 1);
    assert.equal(C.filterProducts(restored, {industry: "marine"}).length, 0);
  }
});
