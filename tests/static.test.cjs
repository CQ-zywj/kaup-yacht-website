const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
test("all pages use existing local classic scripts and stylesheet without build", () => {
  for (const page of [
    "index",
    "products",
    "product",
    "publish",
    "rfq",
    "my-rfq",
    "inbox",
    "supplier",
    "buyer-auth",
    "supplier-auth",
    "company",
    "news",
    "exhibitions",
    "content",
    "inquiry-detail",
    "suppliers",
  ]) {
    const html = fs.readFileSync(page + ".html", "utf8");
    assert.match(html, /name="viewport"/);
    assert.doesNotMatch(html, /type="module"/);
    for (const [, path] of html.matchAll(
      /(?:src|href)="((?:js|mock|assets)\/[^"?]+)(?:\?[^"\s]*)?"/g,
    ))
      assert.ok(fs.existsSync(path), page + ": " + path);
  }
});
test("public pages and scripts use the KAUP LINK brand consistently", () => {
  const pages = [
    "index",
    "products",
    "product",
    "publish",
    "rfq",
    "my-rfq",
    "inbox",
    "supplier",
    "buyer-auth",
    "supplier-auth",
    "company",
    "news",
    "exhibitions",
    "content",
    "inquiry-detail",
    "suppliers",
  ];
  for (const page of pages) {
    const html = fs.readFileSync(page + ".html", "utf8");
    assert.match(html, /<title>KAUP LINK \|/, page);
    assert.match(
      html,
      /<meta name="description" content="智贸无疆多行业跨境 B2B 平台"/,
      page,
    );
    assert.doesNotMatch(html, /NORTHLINK|北贸汇|智联无疆/, page);
  }
  const scripts = ["js/i18n.js", "js/common.js", "js/content.js"]
    .map((path) => fs.readFileSync(path, "utf8"))
    .join("\n");
  assert.doesNotMatch(scripts, /NORTHLINK|北贸汇|Lanyu Trade|智联无疆/);
  const readme = fs.readFileSync("README.md", "utf8");
  assert.match(readme, /^# kaup-link$/m);
  assert.match(readme, /智贸无疆 \/ KAUP LINK/);
  const c = { window: {} };
  vm.createContext(c);
  vm.runInContext(fs.readFileSync("js/i18n.js", "utf8"), c);
  assert.deepEqual(JSON.parse(JSON.stringify(c.window.MarineI18n.brandName)), [
    "智贸无疆",
    "KAUP LINK",
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(c.window.MarineI18n.footerCopy)), [
    "© 2026 智御无疆",
    "© 2026 KAUP",
  ]);
});
test("seed JS equals JSON references and retains marine seed products and empty new industries", () => {
  const c = { window: {} };
  vm.createContext(c);
  vm.runInContext(fs.readFileSync("mock/data.js", "utf8"), c);
  const d = JSON.parse(JSON.stringify(c.window.MarineData));
  assert.deepEqual(
    d.products,
    JSON.parse(fs.readFileSync("mock/products.json")),
  );
  assert.deepEqual(
    d.categories,
    JSON.parse(fs.readFileSync("mock/categories.json")),
  );
  assert.deepEqual(d.industries, JSON.parse(fs.readFileSync("mock/industries.json")));
  assert.equal(d.industries.length, 6);
  assert.equal(d.products.length, 16);
  for (const cat of d.categories) {
    assert.equal(d.products.filter((p) => p.category_id === cat.id).length, cat.industry_id === "marine" ? 4 : 0);
    assert.ok(cat.subcategories.length);
    for (const f of cat.fields) assert.ok(f.label.zh && f.label.en);
  }
  for (const p of d.products)
    for (const file of p.media) assert.ok(fs.existsSync(file));
});
test("all centralized UI dictionary entries have Chinese and English", () => {
  const c = { window: {} };
  vm.createContext(c);
  vm.runInContext(fs.readFileSync("js/i18n.js", "utf8"), c);
  for (const [key, pair] of Object.entries(c.window.MarineI18n)) {
    assert.equal(pair.length, 2, key);
    assert.ok(
      pair.every((v) => typeof v === "string" && v.length > 0),
      key,
    );
  }
});
