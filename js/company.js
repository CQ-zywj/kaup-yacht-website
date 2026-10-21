let companyProfile = {},
  editing = false,
  photos = [],
  certs = [];
let profileFailed = false;
try {
  companyProfile = MarineAccounts.readProfile(localStorage);
} catch {
  profileFailed = true;
}
function profileView() {
  if (!AccountUI.requireSupplier()) return;
  const user = AccountUI.getUser();
  if (profileFailed) {
    document.getElementById("main").innerHTML =
      `<div class="container section">${U.empty("storageError", "profileEmpty", "supplier-auth.html", "supplierLogin")}</div>`;
    return;
  }
  if (user?.role === "buyer" || !companyProfile.company) {
    document.getElementById("main").innerHTML =
      `<div class="container section">${U.empty("companyProfile", "profileEmpty", "supplier-auth.html", "supplierLogin")}<a class="button secondary" href="${U.url("publish.html")}">${U.tr("publish")}</a></div>`;
    return;
  }
  certs = JSON.parse(JSON.stringify(companyProfile.certifications || []));
  photos = [...(companyProfile.photos || [])];
  const status = companyProfile.verification_status || "pending";
  document.getElementById("main").innerHTML =
    `<div class="container company-container"><div class="page-intro"><div class="eyebrow">${U.tr("identitySupplier")}</div><h1>${U.tr("companyProfile")}</h1><p>${U.tr("loginDemo")}</p></div>${completenessBar()}<div class="company-heading panel"><div class="company-avatar">${U.e(companyProfile.company.slice(0, 1))}</div><div><h2>${U.e(companyProfile.company)}</h2><p>${U.e(companyProfile.company_en || "")}</p><span class="badge">${U.tr(status === "verified" ? "verifiedStatus" : status === "rejected" ? "rejectedStatus" : "pendingStatus")}</span></div><div class="company-actions">${!editing ? `<button type="button" class="button" id="edit-company">${U.tr("edit")}</button>${status !== "verified" ? `<button type="button" class="button secondary" id="verify-company">${U.tr("simulateVerify")}</button>` : ""}<a class="button secondary" href="${U.url("certifications.html")}">${U.tr("companyManageCerts")}</a><a class="button secondary" href="${U.url("storefront.html", { supplier_id: companyProfile.id })}">${U.tr("companyStorefrontPreview")} ↗</a>` : ""}</div></div>${editing ? editMarkup() : readMarkup() + storefrontRead(companyProfile)}<div class="form-actions"><a class="text-link" href="${U.url("seller-dashboard.html")}">${U.tr("consoleOverview")} →</a><a class="text-link" href="${U.url("supplier.html")}">${U.tr("myProducts")} →</a><a class="text-link" href="${U.url("inbox.html")}">${U.tr("inbox")} →</a><a class="text-link" href="${U.url("publish.html")}">${U.tr("publish")} →</a></div></div>`;
  document.getElementById("edit-company")?.addEventListener("click", () => {
    editing = true;
    profileView();
  });
  document
    .getElementById("verify-company")
    ?.addEventListener("click", () =>
      saveProfile({ ...companyProfile, verification_status: "verified" }),
    );
  if (editing) {
    const form = document.getElementById("company-form");
    document.getElementById("cancel-company").onclick = () => {
      editing = false;
      profileView();
    };
    document.getElementById("add-company-cert").onclick = () => addCert();
    certs.forEach(addCert);
    AccountUI.preview(
      document.getElementById("company-photos"),
      document.getElementById("photo-previews"),
    );
    form.onsubmit = (e) => {
      e.preventDefault();
      const p = AccountUI.collectProfile(form, companyProfile);
      const errors = AccountUI.profileErrors(MarineAccounts.validateProfile(p));
      if (!U.errors(form, errors)) return;
      const d = Object.fromEntries(new FormData(form));
      for (const k of [
        "business_type",
        "position",
        "founded",
        "employees",
        "tagline",
        "theme",
        "address",
        "logo",
        "banner",
        "video",
      ])
        p[k] = (d[k] || "").trim();
      p.main_categories = [
        ...form.querySelectorAll("[name=main_categories]:checked"),
      ].map((i) => i.value);
      if (!p.main_categories.length) {
        document.getElementById("company-summary").innerHTML = U.tr("required");
        form.querySelector("[name=main_categories]")?.focus();
        return;
      }
      p.certifications = [...form.querySelectorAll(".company-cert")].map(
        (row) => ({
          type: row.querySelector("select").value,
          number: row.querySelector("input[type=text]").value.trim(),
          image:
            row.querySelector("[type=file]").files[0]?.name ||
            row.dataset.image ||
            "",
        }),
      );
      if (p.certifications.some((c) => !c.number)) {
        document.getElementById("company-summary").innerHTML =
          U.tr("validation");
        return;
      }
      const files = document.getElementById("company-photos").files;
      p.photos = files.length ? [...files].map((f) => f.name) : photos;
      saveProfile(p);
    };
  }
  U.translate();
}
function completenessBar() {
  if (typeof SupplierCore === "undefined") return "";
  let score = 0;
  try {
    score =
      SupplierCore.completeness(localStorage, companyProfile, companyProfile.id)
        .score || 0;
  } catch {}
  const safe = Math.max(0, Math.min(100, score));
  return `<section class="panel company-completeness"><div class="score-row"><span>${U.tr("companyCompleteness")}</span><b>${safe}%</b></div><div class="score-bar"><i style="width:${safe}%"></i></div><div class="mini-actions"><a class="link-button" href="${U.url("certifications.html")}">${U.tr("companyManageCerts")}</a><a class="link-button" href="${U.url("supplier-articles.html")}">${U.tr("consoleArticles")}</a><a class="link-button" href="${U.url("seller-dashboard.html")}">${U.tr("consoleOverview")}</a></div></section>`;
}
function themeKey(value) {
  return (
    { "theme-ocean": "themeOcean", "theme-slate": "themeSlate", "theme-sand": "themeSand" }[
      value
    ] || "notSet"
  );
}
function storefrontEdit(p) {
  const themes = ["", "theme-ocean", "theme-slate", "theme-sand"];
  const field = (labelKey, name, hintKey) =>
    `<div class="field"><label for="company-${name}">${U.tr(labelKey)}</label><input id="company-${name}" name="${name}" type="text" value="${U.e(p[name] || "")}">${hintKey ? `<small class="muted">${U.tr(hintKey)}</small>` : ""}</div>`;
  return `<section class="panel"><h2>${U.tr("companyStorefront")}</h2><div class="form-grid">${field("companyTagline", "tagline")}<div class="field"><label for="company-theme">${U.tr("companyTheme")}</label><select id="company-theme" name="theme">${themes.map((value) => `<option value="${value}" ${(p.theme || "") === value ? "selected" : ""}>${U.t(themeKey(value))}</option>`).join("")}</select></div>${field("companyAddress", "address")}${field("companyLogo", "logo", "companyLogoHint")}${field("companyBanner", "banner", "companyBannerHint")}${field("companyVideo", "video")}</div><p class="muted">${U.tr("companySaveFirst")}</p></section>`;
}
function storefrontRead(p) {
  return `<section class="panel"><h2>${U.tr("companyStorefront")}</h2><table class="param-table"><tbody>${[
    ["companyTagline", p.tagline],
    ["companyTheme", p.theme ? U.t(themeKey(p.theme)) : ""],
    ["companyAddress", p.address],
    ["companyLogo", p.logo],
    ["companyBanner", p.banner],
    ["companyVideo", p.video],
  ]
    .map(
      ([k, v]) =>
        `<tr><th>${U.tr(k)}</th><td>${v ? U.e(v) : U.tr("notSet")}</td></tr>`,
    )
    .join(
      "",
    )}</tbody></table><p style="margin-top:14px"><a class="text-link" href="${U.url("storefront.html", { supplier_id: p.id })}">${U.tr("companyStorefrontPreview")} ↗</a></p></section>`;
}
function readMarkup() {
  const p = companyProfile;
  return `<section class="panel"><h2>${U.tr("basic")}</h2><table class="param-table"><tbody>${[
    ["countryRegion", p.country],
    ["city", p.city],
    ["website", p.website],
    ["businessType", U.tr(p.business_type || "manufacturer")],
    ["founded", p.founded],
    ["employees", p.employees],
    ["contact", p.contact],
    ["position", p.position],
    ["email", p.email],
    ["phone", p.phone],
  ]
    .map(
      ([k, v]) =>
        `<tr><th>${U.tr(k)}</th><td>${k === "businessType" ? v : U.e(v || "—")}</td></tr>`,
    )
    .join(
      "",
    )}</tbody></table><h3>${U.tr("mainCategories")}</h3><div class="cert-row">${(p.main_categories || []).map((id) => `<span class="badge">${U.bi((U.industry(id) || U.cat(id))?.name)}</span>`).join("") || U.tr("noData")}</div><h3>${U.tr("introZh")}</h3><p>${U.e(p.intro?.zh || "—")}</p><h3>${U.tr("introEn")}</h3><p>${U.e(p.intro?.en || "—")}</p></section><section class="panel"><h2>${U.tr("certs")}</h2><div class="cert-row">${certs.map((c) => `<div class="cert-button"><strong>${U.e(c.type)}</strong><small>${U.e(c.number)}</small>${c.image ? `<small>${U.e(c.image)} · ${U.tr("filePlaceholder")}</small>` : ""}</div>`).join("") || U.tr("noData")}</div><p style="margin-top:14px"><a class="text-link" href="${U.url("certifications.html")}">${U.tr("companyManageCerts")} ↗</a></p><p class="muted">${U.tr("certManageHint")}</p></section><section class="panel"><h2>${U.tr("companyPhotos")}</h2><p>${U.tr("profilePreviewHint")}</p>${photos.map((f) => `<div class="file-item">${U.e(f)} · ${U.tr("previewNotSaved")}</div>`).join("") || U.tr("noData")}</section>`;
}
function editMarkup() {
  const p = companyProfile;
  return `<form id="company-form" novalidate>${AccountUI.supplierSection(p, true)}<section class="panel"><h2>${U.tr("basic")}</h2><div class="form-grid"><div class="field"><label for="business_type">${U.tr("businessType")}</label><select id="business_type" name="business_type">${["manufacturer", "trader", "agent", "serviceProvider"].map((k) => `<option value="${k}" data-i18n="${k}" ${p.business_type === k ? "selected" : ""}>${U.e(U.t(k))}</option>`).join("")}</select></div>${U.field("position", "position", "text", p.position || "")}${U.field("founded", "founded", "text", p.founded || "")}${U.field("employees", "employees", "text", p.employees || "")}${categories(p.main_categories || [])}</div></section><section class="panel"><h2>${U.tr("certs")}</h2><div id="company-certs"></div><button type="button" class="button secondary" id="add-company-cert">${U.tr("addCert")}</button></section><section class="panel"><h2>${U.tr("companyPhotos")}</h2><label for="company-photos">${U.tr("companyPhotos")}</label><input type="file" id="company-photos" multiple accept="image/*"><div class="previews" id="photo-previews"></div><p class="muted">${U.tr("profilePreviewHint")}</p>${photos.map((f) => `<div class="file-item">${U.e(f)}</div>`).join("")}</section>${storefrontEdit(p)}<p class="error" id="company-summary" role="alert"></p><div class="form-actions"><button class="button" type="submit">${U.tr("saveCompany")}</button><button class="button secondary" id="cancel-company" type="button">${U.tr("cancel")}</button></div></form>`;
}
function categories(selected) {
  return `<div class="field full"><fieldset class="category-checks"><legend>${U.tr("mainCategories")}</legend>${MarineData.industries.map((c) => `<label><input type="checkbox" name="main_categories" value="${c.id}" ${selected.some(id => MarineCore.industryForCategory(id) === c.id) ? "checked" : ""}>${U.bi(c.name)}</label>`).join("")}</fieldset></div>`;
}
function addCert(c = {}) {
  const row = document.createElement("div");
  row.className = "dynamic-row company-cert";
  row.dataset.image = c.image || "";
  row.innerHTML = `<label>${U.tr("certType")}<select>${["CCS", "ABS", "DNV"].map((k) => `<option ${k === c.type ? "selected" : ""}>${k}</option>`).join("")}</select></label><label>${U.tr("certNumber")}<input type="text" required value="${U.e(c.number || "")}"></label><label>${U.tr("certImage")}<input type="file" accept="image/*"><small>${U.e(c.image || "")}</small><div class="previews"></div></label><button type="button" class="remove" aria-label="${U.t("remove")}">×</button>`;
  row.querySelector("button").onclick = () => row.remove();
  AccountUI.preview(
    row.querySelector("[type=file]"),
    row.querySelector(".previews"),
  );
  document.getElementById("company-certs").append(row);
  U.translate();
}
function saveProfile(p) {
  try {
    companyProfile = MarineAccounts.writeProfile(localStorage, p);
    const u = AccountUI.getUser();
    if (u?.id === p.id)
      localStorage.setItem(
        "current_user",
        JSON.stringify({ ...u, company: p.company }),
      );
    editing = false;
    profileView();
    AccountUI.refreshHeader();
    U.notice("savedCompany");
  } catch {
    U.notice("storageError");
  }
}
window.addEventListener("storage", (e) => {
  if (["current_user", "accounts", "supplier_profile"].includes(e.key)) {
    try {
      companyProfile = MarineAccounts.readProfile(localStorage);
      editing = false;
      profileView();
    } catch {
      profileFailed = true;
      profileView();
    }
  }
});
profileView();
