const AccountUI = {
  countries: [
    "China",
    "Germany",
    "United States",
    "United Kingdom",
    "Netherlands",
    "Singapore",
    "Australia",
    "France",
    "Italy",
    "Japan",
    "United Arab Emirates",
    "Other",
  ],
  country(name, value = "", required = true) {
    const all = [...new Set([...this.countries, ...(value ? [value] : [])])];
    return `<div class="field"><label for="${name}">${U.tr("countryRegion")}${required ? " <b>*</b>" : ""}</label><select id="${name}" name="${name}" ${required ? "required" : ""}><option value="" data-i18n="select">${U.t("select")}</option>${all.map((v) => `<option value="${U.e(v)}" data-i18n="country_${{ "United States": "US", "United Kingdom": "UK", "United Arab Emirates": "UAE" }[v] || v}" ${v === value ? "selected" : ""}>${U.e(U.t("country_" + ({ "United States": "US", "United Kingdom": "UK", "United Arab Emirates": "UAE" }[v] || v)))}</option>`).join("")}</select><small class="error" data-error="${name}"></small></div>`;
  },
  profileErrors(errors) {
    return Object.fromEntries(
      Object.entries(errors).map(([k, v]) => ["supplier_" + k, v]),
    );
  },
  supplierSection(p = {}, editingCompany = false) {
    return `<section class="panel supplier-information"><div class="section-head"><div><div class="eyebrow">${U.tr("identitySupplier")}</div><h2>${U.tr("supplierInformation")}</h2></div>${editingCompany ? "" : `<a class="text-link" href="${U.url("company.html")}">${U.tr("editCompany")} →</a>`}</div><p class="muted">${U.tr("supplierFormHint")}</p>${p.company && !editingCompany ? `<div class="identity-strip"><span>${U.tr("publishingAs")}：<strong>${U.e(p.company)}</strong></span></div>` : ""}<div class="form-grid">${U.field("companyName", "supplier_company", "text", p.company || "", true)}${U.field("companyEn", "supplier_company_en", "text", p.company_en || "")}${this.country("supplier_country", p.country || "")}${U.field("contact", "supplier_contact", "text", p.contact || "", true)}${U.field("email", "supplier_email", "email", p.email || "", true)}${U.field("city", "supplier_city", "text", p.city || "")}${U.field("phone", "supplier_phone", "tel", p.phone || "")}${U.field("website", "supplier_website", "url", p.website || "")}${U.area("introZh", "supplier_intro_zh", p.intro?.zh || "")}${U.area("introEn", "supplier_intro_en", p.intro?.en || "")}</div></section>`;
  },
  collectProfile(form, p = {}) {
    const d = Object.fromEntries(new FormData(form));
    return {
      ...p,
      company: d.supplier_company?.trim() || "",
      company_en: d.supplier_company_en?.trim() || "",
      country: d.supplier_country || "",
      contact: d.supplier_contact?.trim() || "",
      email: d.supplier_email?.trim().toLowerCase() || "",
      city: d.supplier_city?.trim() || "",
      phone: d.supplier_phone?.trim() || "",
      website: d.supplier_website?.trim() || "",
      intro: { zh: d.supplier_intro_zh || "", en: d.supplier_intro_en || "" },
    };
  },
  getUser() {
    try {
      return MarineAccounts.user(localStorage);
    } catch {
      return null;
    }
  },
  permissions() { return MarineAccounts.permissions(this.getUser()); },
  requireSupplier() {
    if (this.getUser()?.role === "supplier") return true;
    document.querySelectorAll("dialog[open]").forEach(dialog=>dialog.close());
    document.getElementById("main").innerHTML = `<div class="container section">${U.empty("sellerOnlyTitle", "supplierAccessHint", "supplier-auth.html", "switchSupplier")}</div>`;
    document.querySelector("#main .empty a").href = U.url("supplier-auth.html", {return:location.pathname.split("/").pop()+location.search});
    U.translate();
    return false;
  },
  refreshContext() {
    const policy = this.permissions();
    const nav = document.querySelector(".main-nav .container");
    if (nav) {
      nav.querySelector('[data-buyer-nav]')?.remove();
      if (policy.role === 'buyer') {
        const link = document.createElement('a');
        link.dataset.buyerNav = '';
        link.href = U.url('my-rfq.html');
        link.innerHTML = U.tr('myInquiries');
        link.classList.toggle('active', document.body.dataset.page === 'my-rfq');
        nav.insertBefore(link, nav.querySelector('.nav-spacer'));
      }
    }
    const mainAction = document.getElementById("primary-action");
    if (mainAction) {
      mainAction.href = U.url(policy.role === "buyer" ? "rfq.html" : "publish.html");
      mainAction.innerHTML = `${U.tr(policy.role === "buyer" ? "publishPurchase" : "publish")} <span>↗</span>`;
    }
    const footer = document.getElementById("workspace-links");
    if (footer) footer.innerHTML = policy.role === "guest"
      ? `<h4>${U.tr("accountMenu")}</h4><a href="${U.url("buyer-auth.html")}">${U.tr("buyerEntryNav")}</a><a href="${U.url("supplier-auth.html")}">${U.tr("supplierEntryNav")}</a>`
      : policy.role === "buyer"
      ? `<h4>${U.tr("buyerWorkspace")}</h4><a href="${U.url("my-rfq.html")}">${U.tr("myInquiries")}</a><a href="${U.url("products.html")}">${U.tr("browse")}</a><a href="${U.url("rfq.html")}">${U.tr("generalRfq")}</a>`
      : `<h4>${U.tr("supplier")}</h4><a href="${U.url("company.html")}">${U.tr("companyProfile")}</a><a href="${U.url("publish.html")}">${U.tr("publish")}</a><a href="${U.url("inbox.html")}">${U.tr("inbox")}</a><a href="${U.url("supplier.html")}">${U.tr("myProducts")}</a>`;
    if (document.body.dataset.page === "home") {
      window.renderPortalWorkspace?.();
      const supplier = policy.role === "supplier";
      for (const [selector, buyerKey, sellerKey] of [[".hero-copy .eyebrow", "heroNote", "supplierHeroNote"], [".hero-copy h1", "heroTitle", "supplierHeroTitle"], [".hero-copy > p", "heroDesc", "supplierHeroDesc"], [".quote-banner h2", "quoteTitle", "supplierQuoteTitle"], [".quote-banner p", "quoteDesc", "supplierQuoteDesc"]]) {
        const node = document.querySelector(selector);
        if (node) node.innerHTML = U.tr(supplier ? sellerKey : buyerKey);
      }
      const heroActions = document.querySelector(".hero-actions");
      if (heroActions) heroActions.innerHTML = `<a class="button" href="${U.url(supplier ? "publish.html" : "products.html")}">${U.tr(supplier ? "publish" : "browse")} →</a><a class="button secondary" href="${U.url(supplier ? "inbox.html" : "rfq.html")}">${U.tr(supplier ? "inbox" : "generalRfq")}</a>`;
      const quote = document.querySelector(".quote-banner > a");
      if (quote) { quote.href = U.url(supplier ? "publish.html" : "rfq.html"); quote.innerHTML = U.tr(supplier ? "publish" : "generalRfq") + " →"; }
    }
    for (const link of document.querySelectorAll('a[href]')) {
      const filename = new URL(link.href, location.href).pathname.split('/').pop();
      // Public browsing stays available to both roles. Work actions follow identity.
      if (["publish.html", "supplier.html", "inbox.html", "company.html"].includes(filename)) link.hidden = !policy.sell;
      if (filename === "rfq.html") link.hidden = !policy.buy;
      if (filename === "my-rfq.html") link.hidden = policy.role !== "buyer";
    }
    U.translate();
  },
  refreshHeader() {
    const nav = document.querySelector(".main-nav .container");
    if (!nav) return;
    nav.querySelector("[data-account-nav]")?.remove();
    const u = this.getUser();
    const a = document.createElement("div");
    a.dataset.accountNav = "";
    a.className = "account-nav";
    const authPage = document.body.dataset.page === "supplier-auth" ? "supplier-auth.html" : "buyer-auth.html";
    const source = new URLSearchParams(location.search).get("return");
    const authParams = source ? { return: MarineAccounts.safeReturn(source) } : {};
    a.innerHTML = u
      ? `<details class="account-menu"><summary aria-label="${U.t("accountMenu")}">${U.e(u.role === "supplier" ? u.company || u.name : u.name)} <small>${U.tr(u.role === "supplier" ? "identitySupplier" : "identityBuyer")}</small></summary><div>${u.role === "supplier" ? `<a href="${U.url("company.html")}">${U.tr("companyProfile")}</a><a href="${U.url("supplier.html")}">${U.tr("myProducts")}</a><a href="${U.url("inbox.html")}">${U.tr("inbox")}</a>` : `<a href="${U.url("my-rfq.html")}">${U.tr("myInquiries")}</a><a href="${U.url("rfq.html")}">${U.tr("generalRfq")}</a>`}<button type="button" id="sign-out" class="link-button">${U.tr("logout")}</button></div></details>`
      : `<a href="${U.url(authPage, { ...authParams, tab: "login" })}">${U.tr("login")}</a><a href="${U.url(authPage, { ...authParams, tab: "register" })}">${U.tr("register")}</a>`;
    nav.append(a);
    a.querySelector("#personal-center")?.addEventListener("click", () =>
      U.notice("buyerAuthHint"),
    );
    a.querySelector("#sign-out")?.addEventListener("click", () => {
      try {
        localStorage.removeItem("current_user");
        localStorage.removeItem("supplier_profile");
        location.href = U.url("index.html");
      } catch {
        U.notice("storageError");
      }
    });
    this.refreshContext();
  },
  preview(input, target) {
    input.onchange = () => {
      const files = [...input.files];
      target.innerHTML = "";
      if (
        files.length > 4 ||
        files.some((f) => !f.type.startsWith("image/") || f.size > 1024 * 1024)
      ) {
        input.value = "";
        U.notice("imageError");
        return;
      }
      for (const f of files) {
        const url = URL.createObjectURL(f);
        const img = document.createElement("img");
        img.src = url;
        img.alt = f.name;
        img.onload = () => URL.revokeObjectURL(url);
        const fig = document.createElement("figure");
        fig.append(img);
        const cap = document.createElement("figcaption");
        cap.textContent = f.name;
        fig.append(cap);
        target.append(fig);
      }
    };
  },
};
AccountUI.refreshHeader();
let renderedRole = AccountUI.permissions().role;
document.addEventListener("DOMContentLoaded", () => AccountUI.refreshContext());
window.addEventListener("languagechange", () => AccountUI.refreshHeader());
window.addEventListener("storage", (e) => {
  if (["accounts", "current_user"].includes(e.key)) {
    if (renderedRole !== AccountUI.permissions().role) location.reload();
    else AccountUI.refreshHeader();
  }
});
