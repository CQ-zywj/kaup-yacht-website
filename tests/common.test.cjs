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
