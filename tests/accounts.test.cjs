const { test } = require("node:test");
const assert = require("node:assert/strict");
const A = require("../js/accounts-core.js");
function storage() {
  const m = new Map();
  return {
    getItem: (k) => m.get(k) || null,
    setItem: (k, v) => m.set(k, v),
    removeItem: (k) => m.delete(k),
  };
}
test("supplier fields required and email website validated", () => {
  assert.deepEqual(Object.keys(A.validateProfile({})).sort(), [
    "company",
    "contact",
    "country",
    "email",
  ]);
  assert.equal(
    A.validateProfile({
      company: "A",
      contact: "B",
      country: "China",
      email: "bad",
    }).email,
    "validEmail",
  );
});
test("draft profile does not overwrite reusable profile", () => {
  const s = storage();
  const old = {
    id: "s1",
    company: "Old",
    contact: "A",
    country: "China",
    email: "a@b.com",
  };
  A.writeProfile(s, old);
  assert.equal(A.readProfile(s).company, "Old");
});
test("profile submission binds supplier and synchronizes account", () => {
  const s = storage();
  s.setItem(
    "accounts",
    JSON.stringify([{ id: "s1", role: "supplier", company: "Old" }]),
  );
  s.setItem("current_user", JSON.stringify({ id: "s1", role: "supplier" }));
  const p = A.writeProfile(s, {
    company: "New",
    country: "Germany",
    contact: "A",
    email: "a@b.com",
  });
  assert.equal(p.id, "s1");
  assert.equal(JSON.parse(s.getItem("accounts"))[0].company, "New");
  assert.equal(A.supplier(p).country, "Germany");
});
test("current supplier never receives another company reusable profile", () => {
  const s = storage();
  s.setItem(
    "supplier_profile",
    JSON.stringify({ id: "other", company: "Other" }),
  );
  s.setItem(
    "accounts",
    JSON.stringify([
      {
        id: "mine",
        role: "supplier",
        company: "Mine",
        country: "China",
        contact: "M",
        email: "m@b.com",
      },
    ]),
  );
  s.setItem("current_user", JSON.stringify({ id: "mine", role: "supplier" }));
  assert.equal(A.readProfile(s).company, "Mine");
});
test("malformed profiles cannot be silently overwritten", () => {
  const s = storage();
  s.setItem("supplier_profile", "{bad");
  assert.throws(() => A.writeProfile(s, { company: "A" }));
  assert.equal(s.getItem("supplier_profile"), "{bad");
});
test("registration validation terms categories and passwords", () => {
  const e = A.validateRegistration({
    role: "supplier",
    company: "A",
    country: "China",
    contact: "A",
    email: "a@b.com",
    password: "demo1234",
    confirm_password: "wrong",
    main_categories: [],
    terms: false,
  });
  assert.equal(e.confirm_password, "passwordMismatch");
  assert.equal(e.main_categories, "required");
  assert.equal(e.terms, "agreeRequired");
});
test("safe return only accepts local html pages", () => {
  assert.equal(A.safeReturn("https://evil.test"), "index.html");
  assert.equal(A.safeReturn("//evil.test"), "index.html");
  assert.equal(A.safeReturn("rfq.html?product=p01"), "rfq.html?product=p01");
  assert.equal(A.safeReturn("foo.html?next=https://x"), "index.html");
});
test("profile write failure rolls back linked account", () => {
  const s = storage();
  s.setItem(
    "accounts",
    JSON.stringify([{ id: "s1", role: "supplier", company: "Old" }]),
  );
  s.setItem("current_user", JSON.stringify({ id: "s1", role: "supplier" }));
  s.setItem("supplier_profile", JSON.stringify({ id: "s1", company: "Old" }));
  const set = s.setItem;
  s.setItem = (k, v) => {
    if (k === "supplier_profile") throw Error("quota");
    set(k, v);
  };
  assert.throws(() => A.writeProfile(s, { company: "New" }));
  assert.equal(JSON.parse(s.getItem("accounts"))[0].company, "Old");
});
test("supplier cannot write another supplier profile", () => {
  const s = storage();
  s.setItem("current_user", JSON.stringify({ id: "b", role: "supplier" }));
  s.setItem(
    "accounts",
    JSON.stringify([{ id: "b", role: "supplier", company: "Beta" }]),
  );
  assert.throws(() => A.writeProfile(s, { id: "a", company: "Alpha" }));
  assert.equal(JSON.parse(s.getItem("accounts"))[0].company, "Beta");
});
test("parseable invalid profile types rejected before rendering", () => {
  for (const p of [
    { company: 42 },
    { company: "A", main_categories: "boats" },
    { company: "A", photos: [null] },
    { company: "A", intro: { zh: 2 } },
  ]) {
    const s = storage();
    s.setItem("supplier_profile", JSON.stringify(p));
    assert.throws(() => A.readProfile(s));
  }
});
test("editing company never deletes the account password hash", () => {
  const s = storage();
  s.setItem(
    "accounts",
    JSON.stringify([
      {
        id: "s1",
        role: "supplier",
        company: "Old",
        password_hash: "credential",
      },
    ]),
  );
  s.setItem("current_user", JSON.stringify({ id: "s1", role: "supplier" }));
  A.writeProfile(s, { id: "s1", company: "New", password_hash: undefined });
  assert.equal(
    JSON.parse(s.getItem("accounts"))[0].password_hash,
    "credential",
  );
  assert.equal(Object.hasOwn(A.readProfile(s), "password_hash"), false);
});
test("draft edits restore unless reusable company profile was updated", () => {
  const active = { id: "s1", company: "Alpha", profile_revision: "1" };
  const draft = { ...active, company: "Draft edit" };
  assert.equal(A.resolveProfile(active, draft).company, "Draft edit");
  assert.equal(
    A.resolveProfile(
      { ...active, company: "Beta", profile_revision: "2" },
      draft,
    ).company,
    "Beta",
  );
  assert.equal(A.resolveProfile({}, draft).company, "Draft edit");
});
test('role policy gives buyers procurement and suppliers selling actions', () => {
  assert.deepEqual(A.permissions({ role: 'buyer' }), { role: 'buyer', buy: true, sell: false });
  assert.deepEqual(A.permissions({ role: 'supplier' }), { role: 'supplier', buy: false, sell: true });
  assert.deepEqual(A.permissions(null), { role: 'guest', buy: true, sell: false });
  assert.deepEqual(A.permissions({ role: 'unknown' }), { role: 'guest', buy: true, sell: false });
});
