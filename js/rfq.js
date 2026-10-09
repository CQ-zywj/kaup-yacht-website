const productId = new URLSearchParams(location.search).get("product");
const product = productId ? U.product(productId) : null;
const rfqUser = AccountUI.getUser();
if (rfqUser?.role !== "buyer") {
  const back = location.pathname.split("/").pop() + location.search;
  document.getElementById("main").innerHTML =
    `<div class="container section">${U.empty("authRequired", "loginDemo", "buyer-auth.html", "buyerSignIn")}</div>`;
  document.querySelector("#main .empty a").href = U.url("buyer-auth.html", {
    return: back,
  });
} else if (productId && !product) {
  document.getElementById("main").innerHTML =
    `<div class="container section">${U.empty("notFound", "adjust", "products.html", "backBrowse")}</div>`;
} else {
  document.getElementById("main").innerHTML =
    `<div class="container"><div class="page-intro"><div class="eyebrow">${U.tr("rfqEyebrow")}</div><h1>${U.tr("rfqTitle")}</h1><p>${U.tr("rfqDesc")}</p></div><div class="form-layout"><form id="rfq-form" novalidate><div id="rfq-product-context">${U.context(product)}</div><section class="panel"><h2>${U.tr("generalRfq")}</h2><div class="form-grid"><div class="field"><label for="rfq-category">${U.tr("category")} <b>*</b></label><select id="rfq-category" name="category_id" required><option value="" data-i18n="select">${U.t("select")}</option>${U.options(MarineData.categories, product?.category_id || "")}</select><small class="error" data-error="category_id"></small></div><div class="field"><label for="rfq-subcategory">${U.tr("subcategory")} <b>*</b></label><select id="rfq-subcategory" name="subcategory_id" required></select><small class="error" data-error="subcategory_id"></small></div>${U.field("company", "company", "text", rfqUser.company || "", true)}${U.field("buyerCountry", "buyer_country", "text", "", true, "countryHint")}${U.field("quantity", "quantity", "number", "", true)}${U.field("delivery", "expected_delivery", "date", "", false)}<div class="field"><label for="rfq-terms">${U.tr("terms")}</label><select id="rfq-terms" name="incoterms"><option>EXW</option><option selected>FOB</option><option>CIF</option></select></div>${U.area("message", "message", "", true, "messageHint")}<div class="field full"><label for="rfq-attachments">${U.tr("attachments")}</label><input id="rfq-attachments" type="file" multiple><p class="muted">${U.tr("attachmentHint")}</p><div id="rfq-files"></div></div></div></section><div class="form-actions"><button class="button" type="submit">${U.tr("submitRfq")} →</button></div></form><aside class="form-aside"><div class="form-note"><h3>${U.tr("rfq")}</h3><p>${U.tr("quoteDesc")}</p><p>${U.tr("demo")}</p></div></aside></div></div>`;
  const form = document.getElementById("rfq-form");
  const categorySelect = document.getElementById("rfq-category");
  const subcategorySelect = document.getElementById("rfq-subcategory");
  function updateSubcategories(selected = "") {
    const category = U.cat(categorySelect.value);
    subcategorySelect.innerHTML = `<option value="" data-i18n="select">${U.t("select")}</option>` + U.options(category?.subcategories || [], selected);
    subcategorySelect.disabled = !category;
    updateProductContext();
    U.translate();
  }
  function matchesProduct() {
    return product && product.category_id === categorySelect.value && product.subcategory_id === subcategorySelect.value;
  }
  function updateProductContext() { document.getElementById("rfq-product-context").hidden = !!product && !matchesProduct(); }
  categorySelect.onchange = () => updateSubcategories();
  subcategorySelect.onchange = updateProductContext;
  updateSubcategories(product?.subcategory_id || "");
  let files = [];
  document.getElementById("rfq-attachments").onchange = (e) => {
    files = U.attachments(e.target.files);
    document.getElementById("rfq-files").innerHTML = U.filesHtml(files);
  };
  form.onsubmit = (e) => {
    e.preventDefault();
    if (
      AccountUI.getUser()?.id !== rfqUser.id ||
      AccountUI.getUser()?.role !== "buyer"
    ) {
      U.notice("authRequired", "loginDemo", "buyer-auth.html", "buyerSignIn");
      return;
    }
    if (!U.errors(form, U.validate(form))) return;
    const d = Object.fromEntries(new FormData(form));
    const row = {
      id: "rfq-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      product_id: matchesProduct() ? product.id : null,
      category_id: d.category_id,
      subcategory_id: d.subcategory_id,
      buyer: {
        company: d.company.trim(),
        country: d.buyer_country.trim(),
        type: "buyer",
        id: rfqUser.id,
      },
      quantity: Number(d.quantity),
      expected_delivery: d.expected_delivery,
      incoterms: d.incoterms,
      message: d.message.trim(),
      attachments: files,
      status: "submitted",
      created_at: new Date().toISOString(),
    };
    const list = U.read("rfq_drafts");
    list.push(row);
    if (U.write("rfq_drafts", list)) {
      form.reset();
      updateSubcategories(product?.subcategory_id || "");
      files = [];
      document.getElementById("rfq-files").innerHTML = "";
      U.notice("rfqSuccess", "rfqSuccessDesc", "products.html", "backBrowse");
    }
  };
}
U.translate();
