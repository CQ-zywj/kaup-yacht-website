(function () {
  const shell = SupplierShell.mount("consoleCerts");
  if (!shell) return;
  const { body, id } = shell;
  const state = { category: "", q: "" };
  const categoryKey = {
    company: "certCompany",
    product: "certProduct",
    test: "certTest",
    system: "certSystem",
    ip: "certIp",
    other: "certOther",
    authorization: "certAuthorization",
  };
  const statusClass = { pending: "pending", verified: "verified", rejected: "rejected" };
  function daysLeft(value) {
    if (!value) return null;
    const diff = Date.parse(value + "T23:59:59") - Date.now();
    return Math.ceil(diff / 86400000);
  }
  function expiryBadge(cert) {
    const days = daysLeft(cert.valid_to);
    if (days === null) return "";
    if (days < 0)
      return ` <span class="status rejected">${U.tr("certExpired")}</span>`;
    if (days <= 30)
      return ` <span class="status pending">${U.tr("certExpiring")} · ${days}d</span>`;
    return "";
  }
  function filtered() {
    let rows = SupplierCore.certs(localStorage, id);
    if (state.category) rows = rows.filter((cert) => cert.category === state.category);
    const needle = state.q.trim().toLowerCase();
    if (needle)
      rows = rows.filter((cert) =>
        [cert.name, cert.no, cert.issuer]
          .map((value) => String(value || "").toLowerCase())
          .some((value) => value.includes(needle)),
      );
    return rows.sort(
      (a, b) => Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0),
    );
  }
  function card(cert) {
    const products = (cert.product_ids || []).length;
    return `<article class="cert-card"><div class="cert-thumb">CERT<small>${U.tr(categoryKey[cert.category] || "certOther")}</small></div><div class="cert-card-main"><div><span class="badge">${U.tr(categoryKey[cert.category] || "certOther")}</span> <span class="status ${statusClass[cert.status] || "pending"}">${U.tr(SupplierCore.certStatusKey(cert.status))}</span>${expiryBadge(cert)}</div><h3>${U.e(cert.name)}</h3><p class="cert-no">${U.e(cert.no)}</p><dl><dt>${U.tr("certIssuer")}</dt><dd>${U.e(cert.issuer || "—")}</dd><dt>${U.tr("certValidFrom")}</dt><dd>${U.e(cert.valid_from)} → ${U.e(cert.valid_to)}</dd><dt>${U.tr("certOwnership")}</dt><dd>${U.tr(cert.ownership === "authorized" ? "certOwnAuthorized" : "certOwnOwn")}</dd><dt>${U.tr("certProducts")}</dt><dd>${products ? products + " " + U.t("certProductCount") : U.tr("certNoProducts")}</dd></dl><div class="cert-actions">${
      cert.status !== "verified"
        ? `<button type="button" class="link-button" data-verify="${U.e(cert.id)}">${U.tr("certVerify")}</button>`
        : `<span class="badge verified-badge">${U.tr("certVerifiedNote")}</span>`
    }${
      cert.status !== "rejected"
        ? `<button type="button" class="link-button" data-reject="${U.e(cert.id)}">${U.tr("certReject")}</button>`
        : ""
    }<button type="button" class="link-button" data-link="${U.e(cert.id)}">${U.tr("certSelectProducts")}</button><button type="button" class="link-button danger" data-delete="${U.e(cert.id)}">${U.tr("certDelete")}</button></div></div></article>`;
  }
  function renderGrid() {
    const rows = filtered();
    const target = document.getElementById("cert-grid");
    if (!target) return;
    target.innerHTML = rows.length
      ? rows.map(card).join("")
      : U.empty("certEmpty", "certEmptyHint", "certifications.html", "certUpload");
    document.getElementById("cert-count").textContent = rows.length;
    U.translate();
  }
  function renderTabs() {
    const all = SupplierCore.certs(localStorage, id);
    const tabs = [{ id: "", label: "certFilterAll", count: all.length }].concat(
      SupplierCore.CERT_CATEGORIES.map((category) => ({
        id: category,
        label: categoryKey[category],
        count: all.filter((cert) => cert.category === category).length,
      })),
    );
    document.getElementById("cert-tabs").innerHTML = tabs
      .map(
        (tab) =>
          `<button type="button" data-category="${tab.id}" aria-pressed="${state.category === tab.id}">${U.tr(tab.label)} ${tab.count}</button>`,
      )
      .join("");
    document.querySelectorAll("[data-category]").forEach((button) => {
      button.onclick = () => {
        state.category = button.dataset.category;
        renderTabs();
        renderGrid();
      };
    });
  }
  function openEditor(cert) {
    const dialog = document.getElementById("cert-dialog");
    dialog.innerHTML = `<form id="cert-form" novalidate><div class="drawer-header"><h2>${U.tr("certUpload")}</h2><button type="button" class="button secondary" data-close>${U.tr("close")}</button></div><div class="cert-editor"><div class="form-grid"><div class="field"><label for="cert-category">${U.tr("certCategory")} <b>*</b></label><select id="cert-category" name="category">${SupplierCore.CERT_CATEGORIES.map(
      (category) =>
        `<option value="${category}" ${cert?.category === category ? "selected" : ""}>${U.t(categoryKey[category])}</option>`,
    ).join("")}</select><small class="error" data-error="category"></small></div><div class="field"><label for="cert-name">${U.tr("certName")} <b>*</b></label><input id="cert-name" name="name" value="${U.e(cert?.name || "")}"><small class="error" data-error="name"></small></div><div class="field"><label for="cert-no">${U.tr("certNo")} <b>*</b></label><input id="cert-no" name="no" value="${U.e(cert?.no || "")}"><small class="error" data-error="no"></small></div><div class="field"><label for="cert-issuer">${U.tr("certIssuer")} <b>*</b></label><input id="cert-issuer" name="issuer" value="${U.e(cert?.issuer || "")}"><small class="error" data-error="issuer"></small></div><div class="field"><label for="cert-from">${U.tr("certValidFrom")} <b>*</b></label><input id="cert-from" name="valid_from" type="date" value="${U.e(cert?.valid_from || "")}"><small class="error" data-error="valid_from"></small></div><div class="field"><label for="cert-to">${U.tr("certValidTo")} <b>*</b></label><input id="cert-to" name="valid_to" type="date" value="${U.e(cert?.valid_to || "")}"><small class="error" data-error="valid_to"></small></div><div class="field"><label for="cert-ownership">${U.tr("certOwnership")}</label><select id="cert-ownership" name="ownership"><option value="own" ${cert?.ownership !== "authorized" ? "selected" : ""}>${U.t("certOwnOwn")}</option><option value="authorized" ${cert?.ownership === "authorized" ? "selected" : ""}>${U.t("certOwnAuthorized")}</option></select></div><div class="field"><label for="cert-files">${U.tr("certFiles")}</label><input id="cert-files" name="files" type="file" multiple accept="image/jpeg,image/png,application/pdf"><small class="inline-note">${U.tr("certFileHint")}</small></div><div class="field"><label for="cert-auth-files">${U.tr("certAuthFiles")}</label><input id="cert-auth-files" name="auth_files" type="file" multiple accept="image/jpeg,image/png,application/pdf"><small class="inline-note">${U.tr("certAuthHint")}</small><small class="error" data-error="auth_files"></small></div><div class="field full"><label class="check-label"><input type="checkbox" name="commitment" ${cert?.commitment !== false ? "checked" : ""}>${U.tr("certCommit")}</label><small class="error" data-error="commitment"></small></div></div></div><div class="form-actions"><button class="button" type="submit">${U.tr("confirm")}</button><button class="button secondary" type="button" data-close>${U.tr("cancel")}</button></div></form>`;
    dialog.querySelectorAll("[data-close]").forEach(
      (button) => (button.onclick = () => dialog.close()),
    );
    dialog.querySelector("#cert-form").onsubmit = (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = Object.fromEntries(new FormData(form));
      const files = [...form.elements.files.files].map((file) => file.name);
      const authFiles = [...form.elements.auth_files.files].map((file) => file.name);
      const next = {
        id: cert?.id || "cert-" + Date.now(),
        supplier_id: id,
        category: data.category,
        name: String(data.name || "").trim(),
        no: String(data.no || "").trim(),
        issuer: String(data.issuer || "").trim(),
        valid_from: data.valid_from,
        valid_to: data.valid_to,
        ownership: data.ownership,
        status: cert?.status || "pending",
        product_ids: cert?.product_ids || [],
        files: files.length ? files : cert?.files || [],
        auth_files: authFiles.length ? authFiles : cert?.auth_files || [],
        commitment: !!form.elements.commitment.checked,
        created_at: cert?.created_at || new Date().toISOString(),
        verified_at: cert?.verified_at || "",
      };
      const errors = SupplierCore.validateCert(next);
      if (!U.errors(form, errors)) return;
      try {
        SupplierCore.saveCert(localStorage, next);
        dialog.close();
        renderTabs();
        renderGrid();
        U.notice("certSaved");
      } catch {
        U.notice("storageError");
      }
    };
    dialog.showModal();
    MarineFormControls.enhance();
    U.translate();
  }
  function openLinker(cert) {
    const dialog = document.getElementById("cert-link-dialog");
    const products = U.products().filter(
      (product) => (product.supplier_id || product.supplier.id) === id,
    );
    dialog.innerHTML = `<form id="cert-link-form"><div class="drawer-header"><h2>${U.tr("certSelectProducts")}</h2><button type="button" class="button secondary" data-close>${U.tr("close")}</button></div><p class="inline-note">${U.tr("certProductCount")}: ${products.length}</p><div class="check-list">${products
      .map(
        (product) =>
          `<label><input type="checkbox" name="product" value="${U.e(product.id)}" ${(cert.product_ids || []).includes(product.id) ? "checked" : ""}><span>${U.bi({ zh: product.i18n.zh.title, en: product.i18n.en.title })}</span></label>`,
      )
      .join("") || `<p class="muted">${U.tr("noProducts")}</p>`}</div><div class="form-actions"><button class="button" type="submit">${U.tr("certSaveProducts")}</button><button class="button secondary" type="button" data-close>${U.tr("cancel")}</button></div></form>`;
    dialog.querySelectorAll("[data-close]").forEach(
      (button) => (button.onclick = () => dialog.close()),
    );
    dialog.querySelector("form").onsubmit = (event) => {
      event.preventDefault();
      cert.product_ids = [...formElements(dialog, "product")]
        .filter((input) => input.checked)
        .map((input) => input.value);
      try {
        SupplierCore.saveCert(localStorage, cert);
        dialog.close();
        renderGrid();
        U.notice("certLinkSaved");
      } catch {
        U.notice("storageError");
      }
    };
    dialog.showModal();
    U.translate();
  }
  function formElements(scope, name) {
    return [...scope.querySelectorAll(`[name="${name}"]`)];
  }
  body.innerHTML = `<div class="page-intro"><div class="eyebrow">${U.tr("identitySupplier")}</div><h1>${U.tr("certsTitle")}</h1><p>${U.tr("certsDesc")}</p></div><div class="console-actions"><button type="button" class="button" id="cert-new">+ ${U.tr("certUpload")}</button><a class="button secondary" href="${U.url("company.html")}">${U.tr("consoleCompany")}</a></div><div class="cert-tabs" id="cert-tabs" role="group" aria-label="${U.t("certCategory")}"></div><div class="panel"><div class="section-head" style="margin-bottom:14px"><div><strong>${U.tr("certFilterAll")} <span id="cert-count">0</span></strong><p class="inline-note">${U.tr("certManageHint")}</p></div><div class="field" style="max-width:260px"><label class="sr-only" for="cert-search">${U.tr("certSearch")}</label><input id="cert-search" type="search" placeholder="${U.t("certSearch")}"></div></div><div class="cert-grid" id="cert-grid"></div></div><dialog id="cert-dialog" aria-label="${U.t("certUpload")}"></dialog><dialog id="cert-link-dialog" aria-label="${U.t("certSelectProducts")}"></dialog>`;
  document.getElementById("cert-new").onclick = () => openEditor(null);
  document.getElementById("cert-search").oninput = (event) => {
    state.q = event.target.value;
    renderGrid();
  };
  document.getElementById("cert-grid").addEventListener("click", (event) => {
    const verify = event.target.closest("[data-verify]");
    const reject = event.target.closest("[data-reject]");
    const link = event.target.closest("[data-link]");
    const remove = event.target.closest("[data-delete]");
    const certs = SupplierCore.certs(localStorage, id);
    if (verify) {
      const cert = certs.find((row) => row.id === verify.dataset.verify);
      if (!cert) return;
      cert.status = "verified";
      cert.verified_at = new Date().toISOString();
      SupplierCore.saveCert(localStorage, cert);
      renderTabs();
      renderGrid();
    } else if (reject) {
      const cert = certs.find((row) => row.id === reject.dataset.reject);
      if (!cert) return;
      cert.status = "rejected";
      SupplierCore.saveCert(localStorage, cert);
      renderTabs();
      renderGrid();
    } else if (link) {
      const cert = certs.find((row) => row.id === link.dataset.link);
      if (cert) openLinker(cert);
    } else if (remove) {
      if (!window.confirm(U.t("certDeleteConfirm"))) return;
      SupplierCore.removeCert(localStorage, remove.dataset.delete);
      renderTabs();
      renderGrid();
    }
  });
  renderTabs();
  renderGrid();
  window.addEventListener("storage", (event) => {
    if (["certifications", "current_user"].includes(event.key)) {
      renderTabs();
      renderGrid();
    }
  });
  window.addEventListener("languagechange", () => {
    renderTabs();
    renderGrid();
  });
})();
