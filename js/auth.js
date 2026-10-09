const role =
  document.body.dataset.page === "supplier-auth" ? "supplier" : "buyer";
const query = new URLSearchParams(location.search);
let tab = query.get("tab") === "register" ? "register" : "login";
const returnTo = MarineAccounts.safeReturn(query.get("return"));
function categories(selected = []) {
  return `<div class="field full"><fieldset class="category-checks"><legend>${U.tr("mainCategories")} <b>*</b></legend>${MarineData.categories.map((c) => `<label><input type="checkbox" name="main_categories" value="${U.e(c.id)}" ${selected.includes(c.id) ? "checked" : ""}>${U.bi(c.name)}</label>`).join("")}</fieldset><small class="error" data-error="main_categories"></small></div>`;
}
function renderAuth() {
  document.getElementById("main").innerHTML =
    `<div class="container auth-container"><div class="page-intro"><div class="eyebrow">${U.tr(role === "supplier" ? "identitySupplier" : "identityBuyer")}</div><h1>${U.tr(role === "supplier" ? "supplierLogin" : "buyerLogin")}</h1><p>${U.tr("loginDemo")}</p><a class="text-link" href="${U.url(role === "supplier" ? "buyer-auth.html" : "supplier-auth.html")}">${U.tr(role === "supplier" ? "buyerEntry" : "supplierEntry")} →</a></div><div class="auth-layout"><section class="panel"><div class="auth-tabs" role="tablist" aria-label="${U.t("login")}">${["login", "register"].map((t) => `<button type="button" role="tab" aria-selected="${tab === t}" class="${tab === t ? "selected" : ""}" data-tab="${t}">${U.tr(t)}</button>`).join("")}</div><form id="auth-form" novalidate><div class="form-grid">${tab === "login" ? `${U.field("email", "email", "text", "", true)}${U.field("password", "password", "password", "", true)}${role === "buyer" ? `<label class="field full check-label"><input type="checkbox" name="remember">${U.tr("remember")}</label>` : ""}` : role === "buyer" ? `${U.field("name", "name", "text", "", true)}${U.field("companyName", "company", "text", "", true)}${U.field("email", "email", "email", "", true)}${AccountUI.country("country")}${U.field("password", "password", "password", "", true)}${U.field("confirmPassword", "confirm_password", "password", "", true)}` : `${U.field("companyZh", "company", "text", "", true)}${U.field("companyEn", "company_en", "text", "", true)}${AccountUI.country("country")}${U.field("city", "city", "text", "", true)}${U.field("website", "website", "url")}<div class="field"><label for="business_type">${U.tr("businessType")}</label><select id="business_type" name="business_type">${["manufacturer", "trader", "agent", "serviceProvider"].map((k) => `<option value="${k}" data-i18n="${k}">${U.e(U.t(k))}</option>`).join("")}</select></div>${U.field("contact", "contact", "text", "", true)}${U.field("position", "position", "text", "", true)}${U.field("phone", "phone", "tel", "", true)}${U.field("email", "email", "email", "", true)}${categories()}<div class="field full"><label for="license">${U.tr("license")}</label><input id="license" type="file" accept="image/*"><div class="previews" id="license-preview"></div><p class="muted">${U.tr("profilePreviewHint")}</p></div>${U.field("password", "password", "password", "", true)}${U.field("confirmPassword", "confirm_password", "password", "", true)}`}${tab === "register" ? `<div class="field full"><label class="check-label"><input type="checkbox" name="terms">${U.tr("termsConsent")}</label><small class="error" data-error="terms"></small>${role === "supplier" ? `<label class="check-label"><input type="checkbox" name="supplier_terms">${U.tr("supplierConsent")}</label><small class="error" data-error="supplier_terms"></small>` : ""}<button type="button" class="text-link terms-placeholder">${U.tr("termsConsent")}</button></div>` : ""}</div><p id="auth-error" class="error" role="alert"></p><button class="button full-width" type="submit">${U.tr(tab === "login" ? "login" : role === "supplier" ? "registrationSubmit" : "register")}</button></form>${tab === "login" ? `<div class="auth-extras"><button type="button" class="text-link" id="forgot">${U.tr("forgot")}</button><button type="button" class="button secondary" id="demo-fill">${U.tr("demoFill")}</button></div><p class="muted">${role}@marinex.demo · Demo123!</p>` : ""}${role === "buyer" ? `<div class="oauth-buttons"><button class="button secondary" type="button" data-oauth>Google</button><button class="button secondary" type="button" data-oauth>LinkedIn</button></div>` : ""}</section><aside class="form-note"><h3>${U.tr(role === "supplier" ? "supplierInformation" : "buyerEntry")}</h3><p>${U.tr(role === "supplier" ? "reviewPeriod" : "buyerAuthHint")}</p><p>${U.tr("loginDemo")}</p></aside></div></div>`;
  document.querySelectorAll("[data-tab]").forEach(
    (b) =>
      (b.onclick = () => {
        tab = b.dataset.tab;
        const url = new URL(location.href);
        url.searchParams.set("tab", tab);
        history.replaceState(null, "", url);
        renderAuth();
      }),
  );
  document
    .querySelectorAll("[data-oauth],#forgot")
    .forEach((b) => (b.onclick = () => U.notice("oauthPlaceholder")));
  document
    .querySelectorAll(".terms-placeholder")
    .forEach((b) => (b.onclick = () => U.notice("termsDetails")));
  document.getElementById("demo-fill")?.addEventListener("click", () => {
    const f = document.getElementById("auth-form");
    f.elements.email.value = role + "@marinex.demo";
    f.elements.password.value = "Demo123!";
  });
  const license = document.getElementById("license");
  if (license)
    AccountUI.preview(license, document.getElementById("license-preview"));
  document.getElementById("auth-form").onsubmit = submitAuth;
  U.translate();
}
async function submitAuth(e) {
  e.preventDefault();
  const f = e.target,
    d = Object.fromEntries(new FormData(f));
  d.role = role;
  d.email = d.email?.trim().toLowerCase();
  d.main_categories = [
    ...f.querySelectorAll("[name=main_categories]:checked"),
  ].map((i) => i.value);
  d.terms = !!f.elements.terms?.checked;
  d.supplier_terms = !!f.elements.supplier_terms?.checked;
  const errors =
    tab === "register"
      ? { ...U.validate(f), ...MarineAccounts.validateRegistration(d) }
      : U.validate(f);
  if (!U.errors(f, errors)) return;
  const button = f.querySelector("[type=submit]");
  button.disabled = true;
  const error = document.getElementById("auth-error");
  error.textContent = "";
  try {
    const accounts = MarineAccounts.read(localStorage, "accounts", []);
    const hash = await MarineAccounts.hash(d.password);
    let a;
    if (tab === "register") {
      if (accounts.some((a) => a.role === role && a.email === d.email)) {
        error.innerHTML = U.tr("duplicateEmail");
        return;
      }
      const { password, confirm_password, ...safe } = d;
      a = {
        ...safe,
        id: role + "-" + Date.now(),
        name: role === "buyer" ? d.name : d.contact,
        password_hash: hash,
        created_at: new Date().toISOString(),
        verification_status: role === "supplier" ? "pending" : undefined,
        license: f.querySelector("#license")?.files[0]?.name || "",
        certifications: [],
        photos: [],
      };
      accounts.push(a);
    } else {
      a = accounts.find(
        (a) =>
          a.role === role &&
          (a.email === d.email || a.phone === d.email) &&
          a.password_hash === hash,
      );
      // Repair only the built-in demo account from an earlier prototype test.
      const builtIn = accounts.find(
        (item) =>
          item.id === "demo-" + role &&
          item.email === role + "@marinex.demo" &&
          item.role === role,
      );
      if (
        !a &&
        builtIn &&
        !builtIn.password_hash &&
        d.email === builtIn.email &&
        d.password === "Demo123!"
      ) {
        a = { ...builtIn, password_hash: hash };
        accounts[accounts.indexOf(builtIn)] = a;
      }
      if (
        !a &&
        d.email === role + "@marinex.demo" &&
        d.password === "Demo123!" &&
        !accounts.some((a) => a.role === role && a.email === d.email)
      ) {
        a = {
          id: "demo-" + role,
          role,
          email: d.email,
          name: role === "buyer" ? "Alex Morgan" : "王海",
          company:
            role === "buyer" ? "Bluewater Procurement" : "海岚船艇制造有限公司",
          company_en:
            role === "buyer"
              ? "Bluewater Procurement"
              : "Hailan Marine Manufacturing",
          country: role === "buyer" ? "Germany" : "China",
          city: "Shanghai",
          contact: "王海",
          position: "Sales Manager",
          phone: "+86 13800000000",
          business_type: "manufacturer",
          main_categories: ["boats", "equipment"],
          password_hash: hash,
          verification_status: role === "supplier" ? "pending" : undefined,
          certifications: [],
          photos: [],
          created_at: new Date().toISOString(),
        };
        accounts.push(a);
      }
      if (!a) {
        error.innerHTML = U.tr("loginError");
        return;
      }
    }
    const keys = ["accounts", "current_user", "supplier_profile"],
      old = keys.map((k) => localStorage.getItem(k));
    try {
      localStorage.setItem("accounts", JSON.stringify(accounts));
      localStorage.setItem(
        "current_user",
        JSON.stringify({
          id: a.id,
          role: a.role,
          name: a.name,
          company: a.company,
        }),
      );
      if (role === "supplier") {
        const { password_hash, ...profile } = a;
        localStorage.setItem("supplier_profile", JSON.stringify(profile));
      } else localStorage.removeItem("supplier_profile");
    } catch (err) {
      for (let i = 0; i < keys.length; i++) {
        try {
          old[i] === null
            ? localStorage.removeItem(keys[i])
            : localStorage.setItem(keys[i], old[i]);
        } catch {}
      }
      throw err;
    }
    AccountUI.refreshHeader();
    f.reset();
    const target = query.has("return")
      ? returnTo
      : role === "supplier"
        ? "supplier.html"
        : "index.html";
    U.notice(
      tab === "register" && role === "supplier"
        ? "joinSuccess"
        : "loginSuccess",
      role === "supplier" && tab === "register" ? "joinHint" : null,
      target,
      "continue",
    );
  } catch {
    error.innerHTML = U.tr("storageError");
  } finally {
    button.disabled = false;
  }
}
renderAuth();
