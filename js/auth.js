const role =
  document.body.dataset.page === "supplier-auth" ? "supplier" : "buyer";
const query = new URLSearchParams(location.search);
let tab = query.get("tab") === "register" ? "register" : "login";
const returnTo = MarineAccounts.safeReturn(query.get("return"));
const authValues = { login: {}, register: {} };
let authBusy = false;
function rememberFields() {
  const form = document.getElementById("auth-form");
  if (!form) return;
  const values = {};
  for (const input of form.elements) {
    if (!input.name || ["password", "confirm_password"].includes(input.name) || ["password", "file", "checkbox", "submit"].includes(input.type)) continue;
    values[input.name] = input.value;
  }
  values.main_categories = [...form.querySelectorAll("[name=main_categories]:checked")].map(i => i.value);
  authValues[tab] = values;
}
function categories(selected = []) {
  return `<div class="field full"><fieldset class="category-checks"><legend>${U.tr("mainCategories")} <b>*</b></legend>${MarineData.industries.map((c) => `<label><input type="checkbox" name="main_categories" value="${U.e(c.id)}" ${selected.some(id => MarineCore.industryForCategory(id) === c.id) ? "checked" : ""}>${U.bi(c.name)}</label>`).join("")}</fieldset><small class="error" data-error="main_categories"></small></div>`;
}
function renderAuth() {
  const existingTarget = MarineAccounts.authRedirect(AccountUI.getUser(), role, query.get("return"));
  if (existingTarget) {
    location.replace(U.url(existingTarget));
    return;
  }
  document.getElementById("main").innerHTML =
    `<div class="container auth-container"><div class="page-intro"><div class="eyebrow">${U.tr(role === "supplier" ? "identitySupplier" : "identityBuyer")}</div><h1>${U.tr(tab === "register" ? "register" : "login")}</h1><p>${U.tr("loginDemo")}</p><nav class="auth-identities" aria-label="${U.t("accountMenu")}">${["buyer", "supplier"].map(r => `<a class="${r === role ? "active" : ""}" ${r === role ? 'aria-current="page"' : ""} href="${U.url(r + "-auth.html", { tab, ...(query.has("return") ? { return: returnTo } : {}) })}">${U.tr(r === "buyer" ? "buyerEntry" : "supplierEntry")}</a>`).join("")}</nav></div><div class="auth-layout"><section class="panel auth-panel"><div class="auth-tabs" role="tablist" aria-label="${U.t("login")}">${["login", "register"].map((t) => `<button type="button" role="tab" aria-selected="${tab === t}" tabindex="${tab === t ? "0" : "-1"}" class="${tab === t ? "selected" : ""}" data-tab="${t}">${U.tr(t)}</button>`).join("")}</div><form id="auth-form" novalidate><p class="form-required">${U.tr("requiredHint")}</p><div class="form-grid">${tab === "login" ? `${U.field("email", "email", "text", "", true)}${U.field("password", "password", "password", "", true)}${role === "buyer" ? `<label class="field full check-label"><input type="checkbox" name="remember">${U.tr("remember")}</label>` : ""}` : role === "buyer" ? `${U.field("name", "name", "text", "", true)}${U.field("companyName", "company", "text", "", true)}${U.field("email", "email", "email", "", true)}${AccountUI.country("country")}${U.field("password", "password", "password", "", true)}${U.field("confirmPassword", "confirm_password", "password", "", true)}` : `${U.field("companyZh", "company", "text", "", true)}${U.field("companyEn", "company_en", "text", "", true)}${AccountUI.country("country")}${U.field("city", "city", "text", "", true)}${U.field("website", "website", "url")}<div class="field"><label for="business_type">${U.tr("businessType")}</label><select id="business_type" name="business_type">${["manufacturer", "trader", "agent", "serviceProvider"].map((k) => `<option value="${k}" data-i18n="${k}">${U.e(U.t(k))}</option>`).join("")}</select></div>${U.field("contact", "contact", "text", "", true)}${U.field("position", "position", "text", "", true)}${U.field("phone", "phone", "tel", "", true)}${U.field("email", "email", "email", "", true)}${categories()}<div class="field full"><label for="license">${U.tr("license")}</label><input id="license" type="file" accept="image/*"><div class="previews" id="license-preview"></div><p class="muted">${U.tr("profilePreviewHint")}</p></div>${U.field("password", "password", "password", "", true)}${U.field("confirmPassword", "confirm_password", "password", "", true)}`}${tab === "register" ? `<div class="field full"><label class="check-label"><input type="checkbox" name="terms">${U.tr("termsConsent")}</label><small class="error" data-error="terms"></small>${role === "supplier" ? `<label class="check-label"><input type="checkbox" name="supplier_terms">${U.tr("supplierConsent")}</label><small class="error" data-error="supplier_terms"></small>` : ""}<button type="button" class="text-link terms-placeholder">${U.tr("viewTerms")}</button></div>` : ""}</div><p id="auth-error" class="error" role="alert"></p><button class="button full-width" type="submit">${U.tr(tab === "login" ? "login" : role === "supplier" ? "registrationSubmit" : "register")}</button></form>${tab === "login" ? `<div class="auth-extras"><button type="button" class="text-link" id="forgot">${U.tr("forgot")}</button><button type="button" class="button secondary" id="demo-fill">${U.tr("demoFill")}</button></div><p class="muted">${role}@marinex.demo · Demo123!</p>` : ""}${role === "buyer" ? `<div class="oauth-buttons"><button class="button secondary" type="button" data-oauth>Google</button><button class="button secondary" type="button" data-oauth>LinkedIn</button></div>` : ""}</section><aside class="auth-story"><div class="eyebrow">${U.tr("brandName")} · GLOBAL SOURCING</div><div class="marine-route" aria-hidden="true"><span></span><i></i><span></span></div><h2>${U.tr(role === "supplier" ? "authSupplierTitle" : "authBuyerTitle")}</h2><p>${U.tr(role === "supplier" ? "authSupplierCopy" : "authBuyerCopy")}</p><ul><li>${U.tr(role === "supplier" ? "authBenefitCompany" : "authBenefitSearch")}</li><li>${U.tr(role === "supplier" ? "authBenefitPublish" : "authBenefitInquiry")}</li></ul><div class="auth-demo-note">${U.tr("loginDemo")}</div></aside></div></div>`;
  document.querySelectorAll("[data-tab]").forEach(
    (b) =>
      (b.onclick = () => {
        if (authBusy) return;
        rememberFields();
        tab = b.dataset.tab;
        const url = new URL(location.href);
        url.searchParams.set("tab", tab);
        history.replaceState(null, "", url);
        renderAuth();
      }),
  );
  const form = document.getElementById("auth-form");
  const values = authValues[tab];
  for (const [name, value] of Object.entries(values)) {
    if (name === "main_categories") {
      form.querySelectorAll("[name=main_categories]").forEach(i => i.checked = value.includes(i.value));
    } else if (form.elements.namedItem(name)) form.elements.namedItem(name).value = value;
  }
  for (const b of document.querySelectorAll("[data-tab]")) b.onkeydown = e => {
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
      e.preventDefault();
      const next = e.key === "Home" ? "login" : e.key === "End" ? "register" : tab === "login" ? "register" : "login";
      document.querySelector(`[data-tab="${next}"]`).click();
      document.querySelector(`[data-tab="${tab}"]`).focus();
    }
  };
  if (tab === "register") {
    const groups = role === "supplier" ? [["company", "enterpriseDetails"], ["contact", "contactDetails"], ["password", "accountDetails"]] : [["name", "contactDetails"], ["password", "accountDetails"]];
    for (const [name, key] of groups) {
      const heading = document.createElement("h3");
      heading.className = "auth-group-title";
      heading.innerHTML = U.tr(key);
      form.elements.namedItem(name).closest(".field").before(heading);
    }
  }
  for (const input of form.querySelectorAll("input")) {
    if (input.type === "password") {
      input.autocomplete = tab === "register" ? "new-password" : "current-password";
      const wrapper = document.createElement("div");
      wrapper.className = "password-control";
      input.before(wrapper);
      wrapper.append(input);
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.innerHTML = U.tr("showPassword");
      toggle.setAttribute("aria-controls", input.id);
      toggle.setAttribute("aria-pressed", "false");
      toggle.onclick = () => {
        const showing = input.type === "password";
        input.type = showing ? "text" : "password";
        toggle.innerHTML = U.tr(showing ? "hidePassword" : "showPassword");
        toggle.setAttribute("aria-pressed", String(showing));
      };
      wrapper.append(toggle);
      if (tab === "register" && input.name === "password") {
        const hint = document.createElement("small");
        hint.className = "input-hint";
        hint.innerHTML = U.tr("passwordHint");
        wrapper.after(hint);
      }
    } else if (input.name === "email") input.autocomplete = "username";
    else if (input.name === "name" || input.name === "contact") input.autocomplete = "name";
    else if (input.name === "company") input.autocomplete = "organization";
  }
  if (query.has("return") && tab === "register") {
    const hint = document.createElement("p");
    hint.className = "auth-return";
    hint.innerHTML = U.tr("authReturnHint");
    form.before(hint);
  }
  if (tab === "register") {
    const hint = document.createElement("button");
    hint.type = "button";
    hint.className = "text-link demo-register-link";
    hint.innerHTML = U.tr("demoAccessHint");
    hint.onclick = () => document.querySelector('[data-tab="login"]').click();
    form.after(hint);
  }
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
  authBusy = true;
  document.querySelectorAll("[data-tab]").forEach(b => b.disabled = true);
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
          (item.id === "demo-" + role || (role === "supplier" && item.id === "s1")) &&
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
          id: role === "supplier" ? "s1" : "demo-buyer",
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
      // Link the built-in supplier demo to the seed supplier s1 so storefront,
      // console and received inquiries stay in one scope.
      if (a && role === "supplier" && a.email === "supplier@marinex.demo" && a.id !== "s1") {
        const index = accounts.indexOf(a);
        a = { ...a, id: "s1" };
        if (index >= 0) accounts[index] = a;
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
    if (tab === "login") {
      location.replace(
        U.url(role === "supplier" ? "seller-dashboard.html" : "index.html"),
      );
      return;
    }
    const target = query.has("return")
      ? returnTo
      : role === "supplier"
        ? "seller-dashboard.html"
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
    authBusy = false;
    document.querySelectorAll("[data-tab]").forEach(b => b.disabled = false);
  }
}
renderAuth();
