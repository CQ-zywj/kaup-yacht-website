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
  /** 站内未读：供应商看收件箱，买家看我的询盘，含公开 RFQ 的报价线程。 */
  unreadBadge() {
    const user = this.getUser();
    if (!user?.role) return 0;
    let rows = [];
    try {
      rows = U.read("rfq_drafts");
    } catch {
      return 0;
    }
    const incoming = user.role === "supplier" ? "buyer" : "supplier";
    const messagesOf = (row) =>
      typeof MarineMessages !== "undefined"
        ? MarineMessages.normalize(row).messages
        : Array.isArray(row.messages)
          ? row.messages
          : [
              row.message
                ? {
                    from: "buyer",
                    read_at:
                      row.status === "submitted"
                        ? null
                        : row.first_reply_at || row.reply?.created_at || null,
                  }
                : null,
              row.reply?.message
                ? { from: "supplier", read_at: row.reply_read_at || null }
                : null,
            ].filter(Boolean);
    const countIn = (list) =>
      list.reduce(
        (sum, row) =>
          sum +
          messagesOf(row).filter(
            (m) => m.from === incoming && !m.read_at && m.type !== "system",
          ).length,
        0,
      );
    if (user.role === "supplier") {
      let id = "";
      try {
        id = MarineAccounts.readProfile(localStorage).id || "";
      } catch {}
      id = id || user.id || "";
      return countIn(
        rows.filter((row) =>
          row.supplier_id ? row.supplier_id === id : row.mode !== "rfq",
        ),
      );
    }
    return countIn(
      rows.filter((row) => row.buyer?.id && row.buyer.id === user.id),
    );
  },
  paintUnread() {
    const target = this.permissions().role === "supplier" ? "inbox.html" : "my-rfq.html";
    const count = this.unreadBadge();
    for (const link of document.querySelectorAll("a[href]")) {
      const filename = new URL(link.href, location.href).pathname.split("/").pop();
      if (filename !== target) continue;
      link.querySelector("[data-unread]")?.remove();
      if (!count) continue;
      const badge = document.createElement("span");
      badge.dataset.unread = "";
      badge.className = "nav-badge";
      badge.setAttribute("data-i18n-aria", "metricUnread");
      badge.setAttribute("aria-label", U.t("metricUnread"));
      badge.textContent = count > 99 ? "99+" : String(count);
      link.append(badge);
    }
  },
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
      nav.closest(".main-nav").hidden = document.body.dataset.page === "home";
      nav.querySelector('[data-buyer-nav]')?.remove();
      nav.querySelector('[data-market-nav]')?.remove();
      /* 市场是「找供应商的公开需求」的地方，只对供应商与游客有意义；
         买家自己的需求与报价都在「我的询盘」，不该再给第二个市场入口。 */
      if (policy.role !== 'buyer' && document.body.dataset.page !== 'home') {
        const market = document.createElement('a');
        market.dataset.marketNav = '';
        market.href = U.url('rfq-market.html');
        market.innerHTML = U.tr('rfqMarket');
        market.classList.toggle('active', document.body.dataset.page === 'rfq-market');
        nav.insertBefore(market, nav.querySelector('.nav-spacer'));
      }
      if (policy.role === 'buyer' && document.body.dataset.page !== 'home') {
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
      : `<h4>${U.tr("supplier")}</h4><a href="${U.url("seller-dashboard.html")}">${U.tr("consoleOverview")}</a><a href="${U.url("certifications.html")}">${U.tr("consoleCerts")}</a><a href="${U.url("supplier-articles.html")}">${U.tr("consoleArticles")}</a><a href="${U.url("media-library.html")}">${U.tr("consoleMedia")}</a><a href="${U.url("publish.html")}">${U.tr("publish")}</a><a href="${U.url("rfq-market.html")}">${U.tr("rfqMarket")}</a><a href="${U.url("inbox.html")}">${U.tr("inbox")}</a><a href="${U.url("supplier.html")}">${U.tr("myProducts")}</a>`;
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
      if (filename === "supplier-auth.html" && policy.role === "supplier") link.href = U.url(MarineAccounts.serviceEntry(this.getUser(), "supplier"));
      if (filename === "buyer-auth.html" && policy.role === "buyer") link.href = U.url(MarineAccounts.serviceEntry(this.getUser(), "buyer"));
      // Public browsing stays available to both roles. Work actions follow identity.
      if (["publish.html", "supplier.html", "bulk-import.html", "inbox.html", "company.html", "seller-dashboard.html", "certifications.html", "supplier-articles.html", "media-library.html", "customers.html", "finance.html", "store-decoration.html"].includes(filename)) link.hidden = !policy.sell;
      if (filename === "rfq.html") link.hidden = !policy.buy;
      if (filename === "rfq-market.html") link.hidden = policy.role === "buyer";
      if (filename === "my-rfq.html") link.hidden = policy.role !== "buyer";
    }
    this.paintUnread();
    U.translate();
  },
  refreshHeader() {
    const nav = document.querySelector(".main-nav .container");
    if (!nav) return;
    document.querySelector("[data-account-nav]")?.remove();
    const u = this.getUser();
    const a = document.createElement("div");
    a.dataset.accountNav = "";
    a.className = "account-nav";
    const authPage = document.body.dataset.page === "supplier-auth" ? "supplier-auth.html" : "buyer-auth.html";
    const source = new URLSearchParams(location.search).get("return");
    const authParams = source ? { return: MarineAccounts.safeReturn(source) } : {};
    a.innerHTML = u
      ? `<details class="account-menu"><summary aria-label="${U.t("accountMenu")}"><span class="account-avatar" aria-hidden="true">${U.e((u.name || u.company || "U").slice(0,1))}</span><span class="account-identity"><span class="account-name" title="${U.e(u.role === "supplier" ? u.company || u.name : u.name)}">${U.e(u.role === "supplier" ? u.company || u.name : u.name)}</span><small>${U.tr(u.role === "supplier" ? "identitySupplier" : "identityBuyer")}</small></span><span class="account-chevron" aria-hidden="true">⌄</span></summary><div>${u.role === "supplier" ? `<a href="${U.url("seller-dashboard.html")}">${U.tr("consoleOverview")}</a><a href="${U.url("supplier.html")}">${U.tr("myProducts")}</a><a href="${U.url("inbox.html")}">${U.tr("inbox")}</a><a href="${U.url("certifications.html")}">${U.tr("consoleCerts")}</a><a href="${U.url("supplier-articles.html")}">${U.tr("consoleArticles")}</a><a href="${U.url("media-library.html")}">${U.tr("consoleMedia")}</a><a href="${U.url("company.html")}">${U.tr("companyProfile")}</a><a href="${U.url("customers.html")}">${U.tr("consoleCustomers")}</a>` : `<a href="${U.url("my-rfq.html")}">${U.tr("myInquiries")}</a><a href="${U.url("rfq.html")}">${U.tr("generalRfq")}</a>`}<button type="button" id="sign-out" class="link-button">${U.tr("logout")}</button></div></details>`
      : `<a href="${U.url(authPage, { ...authParams, tab: "login" })}">${U.tr("login")}</a><a href="${U.url(authPage, { ...authParams, tab: "register" })}">${U.tr("register")}</a>`;
    (document.body.dataset.page === "home" ? document.querySelector(".home-header-actions") || nav : nav).append(a);
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
