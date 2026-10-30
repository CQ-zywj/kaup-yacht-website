let companyProfile = {},
  editing = false,
  photos = [],
  certs = [];
let profileFailed = false;
let companyDraft = null;
const draftKey = id => "company_edit_draft:" + id;
const companyEditFields = ["company", "company_en", "country", "contact", "email", "city", "phone", "website", "intro", "business_type", "position", "founded", "employees", "tagline", "theme", "address", "video", "main_categories", "team", "logo_file", "banner_files", "photo_files", "photos"];
const TAGLINE_MAX = 40;
const BANNER_MAX = 3;
const THEMES = ["theme-ocean", "theme-slate", "theme-sand"];
function draftFields(profile) {
  return Object.fromEntries(companyEditFields.filter(key => Object.hasOwn(profile, key)).map(key => [key, profile[key]]));
}
try {
  companyProfile = MarineAccounts.readProfile(localStorage);
  const savedDraft = JSON.parse(localStorage.getItem(draftKey(companyProfile.id)) || "null");
  if (savedDraft?.id === companyProfile.id && AccountUI.getUser()?.id === companyProfile.id) {
    companyDraft = { ...companyProfile, ...draftFields(savedDraft) };
    editing = true;
  }
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
  photos = [...((editing && companyDraft ? companyDraft : companyProfile).photos || [])];
  const status = companyProfile.verification_status || "pending";
  document.getElementById("main").innerHTML =
    `<div class="container company-container"><div class="page-intro"><div class="eyebrow">${U.tr("identitySupplier")}</div><h1>${U.tr("myStore")}</h1><p>${U.tr("loginDemo")}</p></div>${completenessBar()}<div class="company-heading panel"><div class="company-avatar">${companyProfile.logo_file?.id ? `<img data-local-file="${U.e(companyProfile.logo_file.id)}" alt="${U.e(companyProfile.company)}">` : U.e(companyProfile.company.slice(0, 1))}</div><div><h2>${U.e(companyProfile.company)}</h2><p>${U.e(companyProfile.company_en || "")}</p><span class="badge">${U.tr(status === "verified" ? "verifiedStatus" : status === "rejected" ? "rejectedStatus" : "pendingStatus")}</span></div><div class="company-actions">${!editing ? `<button type="button" class="button" id="edit-company">${U.tr("edit")}</button>${status !== "verified" ? `<button type="button" class="button secondary" id="verify-company">${U.tr("simulateVerify")}</button>` : ""}<a class="button secondary" href="${U.url("certifications.html")}">${U.tr("companyManageCerts")}</a><a class="button secondary" href="${U.url("storefront.html", { supplier_id: companyProfile.id })}">${U.tr("companyStorefrontPreview")} ↗</a>` : ""}</div></div>${editing ? editMarkup() : readMarkup() + storefrontRead(companyProfile)}<div class="form-actions"><a class="text-link" href="${U.url("seller-dashboard.html")}">${U.tr("consoleOverview")} →</a><a class="text-link" href="${U.url("supplier.html")}">${U.tr("myProducts")} →</a><a class="text-link" href="${U.url("inbox.html")}">${U.tr("inbox")} →</a><a class="text-link" href="${U.url("publish.html")}">${U.tr("publish")} →</a></div></div>`;
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
      try { localStorage.removeItem(draftKey(companyProfile.id)); }
      catch { document.getElementById("company-summary").textContent = U.t("storageError"); return; }
      companyDraft = null;
      editing = false;
      profileView();
    };
    CompanyTeam.bind();
    bindPreview(form);
    AccountUI.preview(
      document.getElementById("company-photos"),
      document.getElementById("photo-previews"),
    );
    form.onsubmit = async (e) => {
      e.preventDefault();
      try {
        const p = await collectCompany(form, false);
        if (p) saveProfile(p);
      } catch (error) { document.getElementById('company-summary').textContent = error.message || U.t('storageError'); }
    };
    if (companyDraft) document.getElementById("company-summary").textContent = U.t("companyDraftRestored");
  }
  SupplierDisplay.bind(document.getElementById('main'),SupplierDisplay.certificates(companyProfile.id,true),true);
  SupplierFiles.hydrate(document.getElementById('main'));
  U.translate();
}
async function collectCompany(form, draft) {
  const user = AccountUI.getUser();
  if (user?.id !== companyProfile.id || user?.role !== "supplier") throw Error(U.t("supplierAccessHint"));
  const previous = companyDraft || companyProfile;
  const p = AccountUI.collectProfile(form, previous);
  if (!draft && !U.errors(form, AccountUI.profileErrors(MarineAccounts.validateProfile(p)))) return null;
  const d = Object.fromEntries(new FormData(form));
  for (const k of ["business_type", "position", "founded", "employees", "tagline", "theme", "address", "video"])
    p[k] = (d[k] || "").trim();
  p.main_categories = [...form.querySelectorAll("[name=main_categories]:checked")].map(input => input.value);
  if (!draft && !p.main_categories.length) {
    document.getElementById("company-summary").textContent = U.t("required");
    form.querySelector("[name=main_categories]")?.focus();
    return null;
  }
  if ((p.tagline || "").length > TAGLINE_MAX) {
    document.getElementById("company-summary").textContent = U.t("taglineLengthError");
    form.elements.tagline?.focus();
    return null;
  }
  const logos = [...form.elements.company_logo_upload.files];
  const banners = [...form.elements.company_banner_upload.files];
  const teamFiles = [...document.getElementById("company-photos").files];
  if (banners.length > BANNER_MAX) {
    document.getElementById("company-summary").textContent = U.t("bannerCountError");
    return null;
  }
  /* Validate every chosen file before writing any of them: a rejected banner must
     not leave an already stored logo behind as an orphan blob. */
  await SupplierFiles.check(logos, "logo");
  await SupplierFiles.check(banners, "banner");
  await SupplierFiles.check(teamFiles, "team");
  p.team = await CompanyTeam.collect(form, previous.team || [], p.id, {draft});
  if (logos.length) p.logo_file = (await SupplierFiles.putMany(logos, p.id, "logo"))[0];
  else if (d.company_clear_logo) {
    delete p.logo_file;
    p.logo = "";
  }
  if (banners.length) {
    p.banner_files = await SupplierFiles.putMany(banners, p.id, "banner");
    p.banner = "";
  } else if (d.company_clear_banners) {
    p.banner_files = [];
    p.banner = "";
  }
  if (teamFiles.length) {
    p.photo_files = await SupplierFiles.putMany(teamFiles, p.id, "team");
    p.photos = teamFiles.map(file => file.name);
  }
  return p;
}
let savingCompanyDraft = false;
document.getElementById("main").addEventListener("click", async event => {
  const link = event.target.closest('a[href]');
  if (!editing || !link || new URL(link.href).pathname.split('/').pop() !== 'certifications.html') return;
  event.preventDefault();
  if (savingCompanyDraft) return;
  savingCompanyDraft = true;
  const form = document.getElementById("company-form");
  form.setAttribute("aria-busy", "true");
  document.getElementById("company-summary").textContent = "";
  try {
    const draft = await collectCompany(form, true);
    if (AccountUI.getUser()?.id !== draft.id) throw Error(U.t("supplierAccessHint"));
    localStorage.setItem(draftKey(draft.id), JSON.stringify({id: draft.id, ...draftFields(draft)}));
    // Keep entered fields private until the complete profile is explicitly saved.
    location.assign(link.href);
  } catch (error) {
    document.getElementById("company-summary").textContent = error.message || U.t("storageError");
  } finally { savingCompanyDraft = false; form.removeAttribute("aria-busy"); }
});
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
/* Storefront appearance now lives on this page: logo, banners, tagline, theme and
   company video are edited together with the company profile (single edit entry). */
function shopFrontSection(p) {
  const themes = ["", "theme-ocean", "theme-slate", "theme-sand"];
  const field = (labelKey, name, hintKey) =>
    `<div class="field"><label for="company-${name}">${U.tr(labelKey)}</label><input id="company-${name}" name="${name}" type="text" value="${U.e(p[name] || "")}">${hintKey ? `<small class="muted">${U.tr(hintKey)}</small>` : ""}</div>`;
  const logoName = p.logo_file?.name || p.logo || "";
  const bannerNames = (p.banner_files || []).map(file => file?.name || "").filter(Boolean);
  return `<section class="panel" id="company-shopfront"><h2>${U.tr("companyStorefront")}</h2><p class="muted">${U.tr("decorationHint")}</p><div class="form-grid"><div class="field"><label for="company-tagline">${U.tr("companyTagline")}</label><input id="company-tagline" name="tagline" type="text" maxlength="${TAGLINE_MAX}" value="${U.e(p.tagline || "")}" data-tagline-input><small class="muted" data-tagline-count>${(p.tagline || "").length}/${TAGLINE_MAX}</small></div><div class="field"><label for="company-theme">${U.tr("companyTheme")}</label><select id="company-theme" name="theme" data-theme-select>${themes.map((value) => `<option value="${value}" ${(p.theme || "") === value ? "selected" : ""}>${U.t(themeKey(value))}</option>`).join("")}</select></div><div class="field"><label for="company-logo-upload">${U.tr('companyLogo')}</label><input type="file" id="company-logo-upload" name="company_logo_upload" accept=".png,.svg,image/png,image/svg+xml"><small>${U.tr('logoUploadHint')}</small>${logoName ? `<small>${U.e(logoName)}</small><label class="check-label"><input type="checkbox" name="company_clear_logo">${U.tr("removeLogo")}</label>` : ''}</div><div class="field"><label for="company_banner_upload">${U.tr("companyBanner")}</label><input type="file" id="company_banner_upload" name="company_banner_upload" accept=".jpg,.jpeg,.png,image/jpeg,image/png" multiple><small>${U.tr('bannerUploadHint')}</small>${bannerNames.length ? `<small>${U.e(bannerNames.join(" · "))}</small><label class="check-label"><input type="checkbox" name="company_clear_banners">${U.tr("removeBanners")}</label>` : ''}</div>${field("companyVideo", "video")}</div></section>`;
}
/* Live storefront preview: reuses the storefront banner gradients so what the
   supplier sees here matches the public store page. */
function previewMarkup(p) {
  const theme = THEMES.includes(p.theme) ? p.theme : "";
  const initial = (p.company || "?").slice(0, 1);
  return `<aside class="shop-preview" aria-label="${U.e(U.t("storePreview"))}"><div class="shop-preview-card"><h2>${U.tr("storePreview")}</h2><div class="shop-preview-frame"><div class="shop-preview-banner ${theme}" data-preview-banner></div><div class="shop-preview-body"><span class="shop-preview-logo" data-preview-logo>${p.logo_file?.id ? `<img data-local-file="${U.e(p.logo_file.id)}" alt="${U.e(p.company || "")}">` : U.e(initial)}</span><span class="shop-preview-text"><strong data-preview-name>${U.e(p.company || "")}</strong><span class="muted" data-preview-tagline>${U.e(p.tagline || U.t("notSet"))}</span></span></div></div><a class="button secondary" href="${U.url("storefront.html", { supplier_id: p.id })}">${U.tr("companyStorefrontPreview")} ↗</a><p class="inline-note">${U.tr("storePreviewHint")}</p></div></aside>`;
}
function bindPreview(form) {
  const banner = form.querySelector("[data-preview-banner]");
  const nameNode = form.querySelector("[data-preview-name]");
  const taglineNode = form.querySelector("[data-preview-tagline]");
  const logoNode = form.querySelector("[data-preview-logo]");
  const countNode = form.querySelector("[data-tagline-count]");
  const taglineInput = form.elements.tagline;
  const themeSelect = form.elements.theme;
  const companyInput = form.elements.supplier_company;
  const logoInput = form.elements.company_logo_upload;
  const bannerInput = form.elements.company_banner_upload;
  const objects = [];
  const track = (url) => { objects.push(url); return url; };
  function paintBanner(url) {
    if (!banner) return;
    banner.style.backgroundImage = url ? `url("${url}")` : "";
    banner.style.backgroundSize = url ? "cover" : "";
    banner.style.backgroundPosition = url ? "center" : "";
  }
  function paintTagline() {
    const value = (taglineInput?.value || "").trim();
    if (taglineNode) taglineNode.textContent = value || U.t("notSet");
    if (countNode) countNode.textContent = `${value.length}/${TAGLINE_MAX}`;
  }
  themeSelect?.addEventListener("change", () => {
    THEMES.forEach((value) => banner?.classList.toggle(value, value === themeSelect.value));
  });
  taglineInput?.addEventListener("input", paintTagline);
  companyInput?.addEventListener("input", () => {
    if (nameNode) nameNode.textContent = companyInput.value.trim();
  });
  logoInput?.addEventListener("change", () => {
    const file = logoInput.files?.[0];
    if (!file || !logoNode) return;
    const image = document.createElement("img");
    image.alt = file.name;
    image.src = track(URL.createObjectURL(file));
    logoNode.replaceChildren(image);
  });
  bannerInput?.addEventListener("change", () => {
    const file = bannerInput.files?.[0];
    if (file) paintBanner(track(URL.createObjectURL(file)));
  });
  window.addEventListener("pagehide", () => objects.forEach((url) => URL.revokeObjectURL(url)));
}
function storefrontRead(p) {
  return `<section class="panel"><h2>${U.tr("companyStorefront")}</h2><table class="param-table"><tbody>${[
    ["companyTagline", p.tagline],
    ["companyTheme", p.theme ? U.t(themeKey(p.theme)) : ""],
    ["companyLogo", p.logo_file?.name || p.logo],
    ["companyBanner", p.banner_files?.map(file => file.name).join(', ') || p.banner],
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
    ["companyAddress", p.address],
  ]
    .map(
      ([k, v]) =>
        `<tr><th>${U.tr(k)}</th><td>${k === "businessType" ? v : U.e(v || "—")}</td></tr>`,
    )
    .join(
      "",
    )}</tbody></table><h3>${U.tr("mainCategories")}</h3><div class="cert-row">${(p.main_categories || []).map((id) => `<span class="badge">${U.bi((U.industry(id) || U.cat(id))?.name)}</span>`).join("") || U.tr("noData")}</div><h3>${U.tr("introZh")}</h3><p>${U.e(p.intro?.zh || "—")}</p><h3>${U.tr("introEn")}</h3><p>${U.e(p.intro?.en || "—")}</p></section><section class="panel"><h2>${U.tr("certs")}</h2>${SupplierDisplay.cards(SupplierDisplay.certificates(p.id,true))}<p><a class="text-link" href="${U.url('certifications.html')}">${U.tr('companyManageCerts')} →</a></p></section><section><h2>${U.tr('companyTeam')}</h2>${SupplierDisplay.teamMarkup(p.team)}</section><section class="panel"><h2>${U.tr("companyPhotos")}</h2><p>${U.tr("profilePreviewHint")}</p>${photos.map((f) => `<div class="file-item">${U.e(f)} · ${U.tr("previewNotSaved")}</div>`).join("") || U.tr("noData")}</section>`;
}
function editMarkup() {
  const p = companyDraft || companyProfile;
  return `<form id="company-form" novalidate><div class="shop-edit-layout"><div class="shop-edit-main">${AccountUI.supplierSection(p, true)}<section class="panel" id="company-basic"><h2>${U.tr("basic")}</h2><div class="form-grid"><div class="field"><label for="business_type">${U.tr("businessType")}</label><select id="business_type" name="business_type">${["manufacturer", "trader", "agent", "serviceProvider"].map((k) => `<option value="${k}" data-i18n="${k}" ${p.business_type === k ? "selected" : ""}>${U.e(U.t(k))}</option>`).join("")}</select></div>${U.field("position", "position", "text", p.position || "")}${U.field("founded", "founded", "text", p.founded || "")}${U.field("employees", "employees", "text", p.employees || "")}${U.field("companyAddress", "address", "text", p.address || "")}${categories(p.main_categories || [])}</div></section>${shopFrontSection(p)}${CompanyTeam.editor(p.team || [])}<section class="panel" id="company-photos-panel"><h2>${U.tr("companyPhotos")}</h2><label for="company-photos">${U.tr("companyPhotos")}</label><input type="file" id="company-photos" multiple accept="image/*"><div class="previews" id="photo-previews"></div><p class="muted">${U.tr("profilePreviewHint")}</p>${photos.map((f) => `<div class="file-item">${U.e(f)}</div>`).join("")}</section><section class="panel" id="company-certs"><h2>${U.tr('certs')}</h2><a class="button secondary" href="${U.url('certifications.html')}">${U.tr('companyManageCerts')}</a><p class="muted">${U.tr('companyDraftHint')}</p></section><p class="error" id="company-summary" role="alert"></p><div class="form-actions"><button class="button" type="submit">${U.tr("saveCompany")}</button><button class="button secondary" id="cancel-company" type="button">${U.tr("cancel")}</button></div></div>${previewMarkup(p)}</div></form>`;
}
function categories(selected) {
  return `<div class="field full"><fieldset class="category-checks"><legend>${U.tr("mainCategories")}</legend>${MarineData.industries.map((c) => `<label><input type="checkbox" name="main_categories" value="${c.id}" ${selected.some(id => MarineCore.industryForCategory(id) === c.id) ? "checked" : ""}>${U.bi(c.name)}</label>`).join("")}</fieldset></div>`;
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
    localStorage.removeItem(draftKey(p.id));
    companyDraft = null;
    editing = false;
    profileView();
    AccountUI.refreshHeader();
    U.notice("savedCompany");
  } catch {
    U.notice("storageError");
  }
}
window.addEventListener("storage", (e) => {
  if (["current_user", "accounts", "supplier_profile", "certifications"].includes(e.key)) {
    if (editing && AccountUI.getUser()?.id === companyProfile.id) return;
    try {
      companyProfile = MarineAccounts.readProfile(localStorage);
      companyDraft = null;
      editing = false;
      profileView();
    } catch {
      profileFailed = true;
      profileView();
    }
  }
});
profileView();
