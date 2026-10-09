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
      ? `<details class="account-menu"><summary aria-label="${U.t("accountMenu")}">${U.e(u.role === "supplier" ? u.company || u.name : u.name)} <small>${U.tr(u.role === "supplier" ? "identitySupplier" : "identityBuyer")}</small></summary><div>${u.role === "supplier" ? `<a href="${U.url("company.html")}">${U.tr("companyProfile")}</a><a href="${U.url("supplier.html")}">${U.tr("myProducts")}</a><a href="${U.url("inbox.html")}">${U.tr("inbox")}</a>` : `<button type="button" class="link-button" id="personal-center">${U.tr("personalCenter")}</button>`}<button type="button" id="sign-out" class="link-button">${U.tr("logout")}</button></div></details>`
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
    U.translate();
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
window.addEventListener("languagechange", () => AccountUI.refreshHeader());
window.addEventListener("storage", (e) => {
  if (["accounts", "current_user"].includes(e.key)) AccountUI.refreshHeader();
});
