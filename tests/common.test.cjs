const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const MarineCore = require("../js/core.js");
function boot(storage) {
  const nodes = new Map();
  const doc = {
    body: { dataset: { page: "home" } },
    documentElement: {},
    querySelectorAll: () => [],
    querySelector: () => ({ value: "" }),
    getElementById: (id) => {
      if (!nodes.has(id))
        nodes.set(id, {
          innerHTML: "",
          textContent: "",
          showModal() {},
          close() {},
        });
      return nodes.get(id);
    },
  };
  const c = {
    MarineCore,
    MarineData: { categories: [], products: [] },
    MarineI18n: { language: ["English", "中文"] },
    document: doc,
    location: { search: "", href: "http://127.0.0.1/index.html" },
    URLSearchParams,
    URL,
    history: { replaceState() {} },
    setTimeout: () => {},
    window: { dispatchEvent() {} },
    Event: function () {},
  };
  Object.defineProperty(c, "localStorage", {
    get: () => {
      if (storage instanceof Error) throw storage;
      return storage;
    },
  });
  vm.createContext(c);
  vm.runInContext(fs.readFileSync("js/common.js", "utf8"), c);
  return { u: c.window.MarineUI, nodes };
}
test("corrupt inquiries cannot be overwritten or report success", () => {
  let raw = "{bad";
  let writes = 0;
  const { u } = boot({
    getItem: (key) => (key === "rfq_drafts" ? raw : null),
    setItem: (key, v) => {
      raw = v;
      writes++;
    },
  });
  u.read("rfq_drafts");
  assert.equal(u.write("rfq_drafts", []), false);
  assert.equal(writes, 0);
  assert.equal(raw, "{bad");
});
test("blocked browser storage does not crash startup", () => {
  assert.doesNotThrow(() => boot(Error("Denied")));
});
test("parseable but invalid RFQ records rejected", () => {
  assert.throws(() =>
    MarineCore.readArray(
      { getItem: () => JSON.stringify([null]) },
      "rfq_drafts",
    ),
  );
});
test("checkbox group validation marks every option without crashing", () => {
  const { u } = boot({ getItem: () => null });
  let marked = 0;
  const options = [0, 1].map(() => ({
    classList: {
      add() {
        marked++;
      },
    },
    setAttribute() {},
  }));
  const target = { innerHTML: "" };
  const form = {
    elements: { namedItem: () => options },
    querySelectorAll: () => [],
    querySelector: (s) => (s.includes("data-error") ? target : null),
  };
  assert.equal(u.errors(form, { main_categories: "required" }), false);
  assert.equal(marked, 2);
  assert.match(target.innerHTML, /required/);
});
test("return page query merges without second question mark", () => {
  const { u } = boot({ getItem: () => null });
  const v = u.url("rfq.html?product=p01&v=prd3", { lang: "en" });
  assert.equal(v.split("?").length, 2);
  const url = new URL(v, "http://localhost/");
  assert.equal(url.searchParams.get("product"), "p01");
  assert.equal(url.searchParams.get("v"), "prd3");
});
test("validation scrolls the first invalid field into view before focusing", () => {
  const { u } = boot({ getItem: () => null });
  const calls = [];
  const input = { classList: { add() {} }, setAttribute() {}, scrollIntoView() { calls.push('scroll'); }, focus() { calls.push('focus'); } };
  const form = { elements: { namedItem: () => input }, querySelectorAll: () => [], querySelector: (s) => s === '.invalid' ? input : null };
  assert.equal(u.errors(form, { email: 'required' }), false);
  assert.deepEqual(calls, ['scroll', 'focus']);
});
