(() => {
  if (!AccountUI.requireSupplier()) return;
  const params = new URLSearchParams(location.search);
  let draftId = params.get("draft");
  const stored = U.read("draft_products");
  const existing = stored.find((p) => p.id === draftId);
  let media = existing?.media || [];
  let currentCategory = existing?.category_id || U.industry(params.get("industry"))?.category_ids[0] || "boats";
  function template(category, values = {}) {
    const c = U.cat(category);
    return c.fields
      .map((f) => {
        const v = values[f.key] ?? "";
        const name = f.key;
        const label = `<label for="${name}">${U.bi(f.label)}${f.required ? " <b>*</b>" : ""}</label>`;
        const options =
          f.type === "enum"
            ? `<select id="${name}" name="${name}" ${f.required ? "required" : ""}><option value="" data-i18n="select">${U.t("select")}</option>${U.options(f.options, v)}</select>`
            : f.type === "textarea"
              ? `<textarea id="${name}" name="${name}" ${f.required ? "required" : ""}>${U.e(typeof v === "object" ? v[U.lang] : v)}</textarea>`
              : `<input id="${name}" name="${name}" type="${f.type === "number" ? "number" : f.type === "url" ? "url" : "text"}" ${f.type === "number" ? 'min="0.01" step="any"' : ""} value="${U.e(v)}" ${f.required ? "required" : ""}>`;
        return `<div class="field ${f.type === "textarea" ? "full" : ""}">${label}${options}<small class="error" data-error="${name}"></small></div>`;
      })
      .join("");
  }
  function renderTemplate(values = {}) {
    const c = U.cat(currentCategory);
    document.getElementById("parameter-fields").innerHTML = template(
      currentCategory,
      values,
    );
    document.getElementById("compliance-note").hidden =
      currentCategory !== "coatings";
    document.getElementById("spec-panel").hidden =
      currentCategory !== "equipment";
    document.getElementById("sub-category").innerHTML = U.options(
      c.subcategories,
      existing?.subcategory_id || "",
    );
    U.translate();
  }
  let supplierProfile = {};
  try {
    const activeProfile = MarineAccounts.readProfile(localStorage);
    const owner = existing?.supplier_id || existing?.supplier?.profile?.id;
    const user = AccountUI.getUser();
    const registeredOwner =
      owner &&
      MarineAccounts.read(localStorage, "accounts", []).some(
        (a) => a.id === owner && a.role === "supplier",
      );
    if (owner && owner !== activeProfile.id && (user || registeredOwner)) {
      document.getElementById("main").innerHTML =
        `<div class="container section">${U.empty("wrongSupplier", "loginDemo", "supplier-auth.html", "supplierLogin")}</div>`;
      return;
    }
    supplierProfile = MarineAccounts.resolveProfile(
      activeProfile,
      existing?.supplier?.profile,
    );
  } catch {
    U.notice("storageError");
  }
  const titles = existing?.i18n || { zh: {}, en: {} };
  const trade = existing?.trade || {};
  document.getElementById("main").innerHTML =
    `<div class="container"><div class="page-intro"><div class="eyebrow">${U.tr("supplierMode")}</div><h1>${U.tr("publishTitle")}</h1><p>${U.tr("publishDesc")}</p></div><div class="form-layout"><form id="publish-form" novalidate><section class="panel" id="publish-basic"><h2>${U.tr("basic")}</h2><div class="form-grid">${U.industryField("publish", currentCategory)}<div class="field"><label for="publish-category">${U.tr("productGroup")} <b>*</b></label><select id="publish-category" name="category_id">${U.options(MarineData.categories, currentCategory)}</select></div><div class="field"><label for="sub-category">${U.tr("productType")} <b>*</b></label><select id="sub-category" name="subcategory_id"></select></div>${U.field("titleZh", "title_zh", "text", titles.zh.title || "", true)}${U.field("titleEn", "title_en", "text", titles.en.title || "", true)}${U.area("descriptionZh", "description_zh", titles.zh.description || "", true)}${U.area("descriptionEn", "description_en", titles.en.description || "", true)}<div class="field full"><label for="images">${U.tr("images")}</label><div class="upload"><input type="file" id="images" accept="image/png,image/jpeg,image/webp,image/svg+xml" multiple><p class="muted" style="margin:12px 0 0">${U.tr("imageHint")}</p><div class="upload-actions"><button type="button" class="button secondary" id="pick-media">${U.tr("pickFromMedia")}</button><a class="text-link" href="${U.url("media-library.html")}">${U.tr("consoleMedia")} ↗</a></div></div><div class="previews" id="previews"></div></div></div></section>${AccountUI.supplierSection(supplierProfile)}<section class="panel" id="publish-parameters"><h2>${U.tr("parameters")}</h2><div class="warning" id="compliance-note">${U.tr("complianceHint")}</div><div class="form-grid" id="parameter-fields"></div><div id="spec-panel"><div id="spec-rows"></div><button class="button secondary" id="add-spec" type="button">+ ${U.tr("addSpec")}</button></div></section><section class="panel" id="publish-certificates"><h2>${U.tr("certs")}</h2><div id="cert-rows"></div><button class="button secondary" id="add-cert" type="button">+ ${U.tr("addCert")}</button></section><section class="panel" id="publish-trade"><h2>${U.tr("trade")}</h2><div class="form-grid">${U.field("moq", "moq", "number", trade.moq || "", true)}${U.field("leadDays", "lead_time", "number", trade.lead_time || "", true)}${U.field("priceMin", "price_min", "number", trade.price_min || "", true)}${U.field("priceMax", "price_max", "number", trade.price_max || "", true)}<div class="field"><label for="incoterms">${U.tr("terms")}</label><select id="incoterms" name="incoterms">${["EXW", "FOB", "CIF"].map((v) => `<option ${trade.incoterms?.[0] === v ? "selected" : ""}>${v}</option>`).join("")}</select></div><div class="field"><label for="unit">${U.tr("unit")}</label><select id="unit" name="unit">${["set", "kg", "service"].map((v) => `<option value="${v}" data-i18n="unit_${v}" ${trade.unit === v ? "selected" : ""}>${U.t("unit_" + v)}</option>`).join("")}</select></div></div></section><p id="form-summary" role="alert" class="error"></p><div class="form-actions publish-actions"><div class="save-state"><strong id="draft-state" role="status">${U.tr("draftEditing")}</strong><small>${U.tr("draftNextHint")}</small></div><button id="save-draft" type="button" class="button secondary">${U.tr("saveDraft")}</button><button class="button" type="submit">${U.tr("submitProduct")} →</button></div></form><aside class="form-aside"><nav class="steps" aria-label="${U.t("publishTitle")}">${[["basic", "step1"], ["supplier", "stepSupplier"], ["parameters", "stepParameters"], ["certificates", "stepCertificates"], ["trade", "stepTrade"]].map(([id, key]) => `<a href="#publish-${id}" data-section="publish-${id}">${U.tr(key)}</a>`).join("")}</nav><div class="form-note"><h3>${U.tr("supplier")}</h3><p>${U.tr("publishDesc")}</p></div><a class="text-link" href="${U.url("supplier.html")}" style="display:block;margin-top:20px">${U.tr("myProducts")} →</a></aside></div></div>`;
  const form = document.getElementById("publish-form");
  form.querySelector(".supplier-information").id = "publish-supplier";
  let dirty = false;
  function markDirty() {
    dirty = true;
    document.getElementById("draft-state").innerHTML = U.tr("unsavedChanges");
  }
  form.addEventListener("input", markDirty);
  form.addEventListener("change", markDirty);
  window.addEventListener("beforeunload", e => {
    if (dirty) { e.preventDefault(); e.returnValue = ""; }
  });
  const sections = [...form.querySelectorAll(":scope > section")];
  document.querySelectorAll("[data-section]").forEach(link => link.onclick = e => {
    e.preventDefault();
    const section = document.getElementById(link.dataset.section);
    section.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    section.querySelector("input,select,textarea,button")?.focus({ preventScroll: true });
  });
  const updateStep = () => {
    const active = sections.filter(section => section.getBoundingClientRect().top <= 150).at(-1) || sections[0];
    document.querySelectorAll("[data-section]").forEach(link => {
      const selected = link.dataset.section === active.id;
      link.classList.toggle("active", selected);
      selected ? link.setAttribute("aria-current", "step") : link.removeAttribute("aria-current");
    });
  };
  window.addEventListener("scroll", updateStep, { passive: true });
  updateStep();
  const observer = new MutationObserver(records => {
    if (records.some(r => r.type === "childList")) markDirty();
  });
  function specRow(s = {}) {
    const row = document.createElement("div");
    row.className = "dynamic-row";
    row.innerHTML = `<div class="field"><label>${U.tr("specKey")}<input data-spec-key value="${U.e(s.key || "")}"></label></div><div class="field"><label>${U.tr("specValue")}<input data-spec-value value="${U.e(s.value || "")}"></label></div><button type="button" class="remove" data-i18n-aria="remove" aria-label="${U.t("remove")}">×</button>`;
    row.querySelector("button").onclick = () => row.remove();
    document.getElementById("spec-rows").append(row);
  }
  let certSequence = 0;
  function certRow(c = {}) {
    const certName = "cert_number_" + certSequence++;
    const row = document.createElement("div");
    row.className = "dynamic-row cert";
    row.dataset.certImage = c.image || "";
    row.innerHTML = `<div class="field"><label>${U.tr("certType")}<select data-cert-type>${["CCS", "ABS", "DNV", "ISO 9001", "SGS", "CE"].map((v) => `<option ${c.type === v ? "selected" : ""}>${v}</option>`).join("")}</select></label></div><div class="field"><label>${U.tr("certNumber")}<input name="${certName}" data-cert-number required value="${U.e(c.number || "")}"></label><small class="error" data-error="${certName}"></small></div><div class="field cert-file"><label>${U.tr("certImage")}<input type="file" data-cert-file accept="image/*"></label>${c.image ? `<small>${U.e(c.image)}</small>` : ""}</div><button type="button" class="remove" data-i18n-aria="remove" aria-label="${U.t("remove")}">×</button>`;
    row.querySelector("button").onclick = () => row.remove();
    document.getElementById("cert-rows").append(row);
    U.translate();
  }
  function previews() {
    document.getElementById("previews").innerHTML = media
      .map(
        (src, i) =>
          `<div class="preview"><img src="${U.e(src)}" alt="${U.t("gallery")} ${i + 1}"><small>${i === 0 ? U.tr("cover") : i + 1}</small><button type="button" class="link-button" data-remove-image="${i}">${U.tr("remove")}</button></div>`,
      )
      .join("");
    document.querySelectorAll("[data-remove-image]").forEach(
      (b) =>
        (b.onclick = () => {
          media.splice(Number(b.dataset.removeImage), 1);
          previews();
        }),
    );
  }
  form.querySelector("#publish-category").onchange = (e) => {
    currentCategory = e.target.value;
    renderTemplate();
  };
  document.getElementById("add-spec").onclick = () => specRow();
  document.getElementById("add-cert").onclick = () => certRow();
  document.getElementById("pick-media").onclick = () => {
    if (typeof SupplierShell === "undefined") return U.notice("storageError");
    SupplierShell.mediaPicker({
      multiple: true,
      titleKey: "productPickMedia",
      onPick(urls) {
        media = [...media, ...urls].slice(0, 4);
        previews();
        markDirty();
      },
    });
  };
  document.getElementById("images").onchange = async (e) => {
    const files = [...e.target.files];
    if (
      files.length > 4 ||
      files.some((f) => !f.type.startsWith("image/") || f.size > 1024 * 1024)
    ) {
      U.notice("imageError");
      e.target.value = "";
      return;
    }
    try {
      media = await Promise.all(
        files.map(
          (f) =>
            new Promise((resolve, reject) => {
              const r = new FileReader();
              r.onload = () => resolve(r.result);
              r.onerror = reject;
              r.readAsDataURL(f);
            }),
        ),
      );
      previews();
    } catch {
      U.notice("imageError");
    }
  };
  function collect() {
    const d = Object.fromEntries(new FormData(form));
    const c = U.cat(currentCategory);
    const values = Object.fromEntries(
      c.fields.map((f) => [
        f.key,
        f.type === "number" ? Number(d[f.key]) : d[f.key],
      ]),
    );
    const certs = [...document.querySelectorAll("#cert-rows .cert")].map(
      (row) =>
        MarineCore.certificateRecord(
          row.querySelector("[data-cert-type]").value,
          row.querySelector("[data-cert-number]").value,
          row.dataset.certImage,
          row.querySelector("[data-cert-file]").files[0],
        ),
    );
    const specs = [...document.querySelectorAll("#spec-rows .dynamic-row")]
      .map((row) => ({
        key: row.querySelector("[data-spec-key]").value,
        value: row.querySelector("[data-spec-value]").value,
      }))
      .filter((s) => s.key || s.value);
    return {
      id: draftId || "draft-" + Date.now(),
      industry_id: MarineCore.industryForCategory(currentCategory),
      category_id: currentCategory,
      subcategory_id: d.subcategory_id,
      i18n: {
        zh: { title: d.title_zh, description: d.description_zh },
        en: { title: d.title_en, description: d.description_en },
      },
      media: media.length
        ? media
        : ["assets/media/" + currentCategory + ".jpg"],
      parameters:
        currentCategory === "coatings"
          ? {}
          : {
              ...values,
              ...(currentCategory === "equipment" ? { specs } : {}),
            },
      compliance: currentCategory === "coatings" ? values : {},
      certifications: certs,
      supplier_id:
        supplierProfile.id || existing?.supplier_id || "supplier-" + Date.now(),
      supplier: {
        ...MarineAccounts.supplier(
          AccountUI.collectProfile(form, supplierProfile),
        ),
        products_count: 1,
      },
      trade: {
        moq: Number(d.moq),
        lead_time: Number(d.lead_time),
        price_min: Number(d.price_min),
        price_max: Number(d.price_max),
        unit: d.unit,
        incoterms: [d.incoterms],
        currency: "USD",
      },
      updated_at: new Date().toISOString(),
    };
  }
  function save(submit) {
    const p = collect();
    p.supplier.id = p.supplier_id;
    p.supplier.profile.id = p.supplier_id;
    let errors = {};
    if (submit) {
      errors = {
        ...U.validate(form),
        ...AccountUI.profileErrors(
          MarineAccounts.validateProfile(p.supplier.profile),
        ),
      };
      MarineCore.validateProduct(p).forEach((k) => (errors[k] = "required"));
      if (p.trade.price_max < p.trade.price_min)
        errors.price_max = "validRange";
      for (const row of document.querySelectorAll("#cert-rows .cert")) {
        const n = row.querySelector("[data-cert-number]");
        n.classList.toggle("invalid", !n.value.trim());
        if (!n.value.trim()) errors[n.name] = "required";
      }
    }
    if (!U.errors(form, errors)) {
      document.getElementById("form-summary").innerHTML = U.tr("validation");
      return;
    }
    p.status = submit ? "published" : "draft";
    const drafts = U.read("draft_products");
    const index = drafts.findIndex((v) => v.id === p.id);
    if (index >= 0) drafts[index] = p;
    else drafts.push(p);
    let saved = false;
    try {
      if (submit) {
        if (
          Object.keys(MarineAccounts.validateProfile(p.supplier.profile)).length
        )
          return;
        MarineAccounts.read(localStorage, "supplier_profile");
        MarineAccounts.read(localStorage, "accounts", []);
      }
      const original = localStorage.getItem("draft_products");
      if (!U.write("draft_products", drafts)) return;
      try {
        if (submit)
          supplierProfile = MarineAccounts.writeProfile(
            localStorage,
            p.supplier.profile,
          );
        saved = true;
      } catch (error) {
        if (original === null) localStorage.removeItem("draft_products");
        else localStorage.setItem("draft_products", original);
        throw error;
      }
    } catch {
      U.notice("storageError");
    }
    if (saved) {
      supplierProfile = p.supplier.profile;
      const u = AccountUI.getUser();
      if (submit && u?.id === p.supplier_id) {
        try {
          localStorage.setItem(
            "current_user",
            JSON.stringify({ ...u, company: supplierProfile.company }),
          );
        } catch {}
        AccountUI.refreshHeader();
      }
      draftId = p.id;
      const url = new URL(location.href);
      url.searchParams.set("draft", draftId);
      history.replaceState(null, "", url);
      document.getElementById("form-summary").textContent = "";
      dirty = false;
      document.getElementById("draft-state").innerHTML = U.tr("draftSavedInline");
      if (!submit) return;
      U.notice(
        submit ? "productSubmitted" : "draftSaved",
        submit ? "productSubmittedDesc" : null,
        "supplier.html",
        "myProducts",
      );
    }
  }
  form.onsubmit = (e) => {
    e.preventDefault();
    save(true);
  };
  document.getElementById("save-draft").onclick = () => save(false);
  document.querySelector('#publish-industry option[value=""]').remove();
  U.bindIndustrySelect("publish", document.getElementById("publish-category"));
  renderTemplate(
    existing?.category_id === "coatings"
      ? existing.compliance
      : existing?.parameters || {},
  );
  (existing?.certifications || []).forEach(certRow);
  (existing?.parameters?.specs || []).forEach(specRow);
  previews();
  ["cert-rows", "spec-rows", "previews"].forEach(id => observer.observe(document.getElementById(id), { childList: true }));
  window.addEventListener("languagechange", () => { document.getElementById("draft-state").innerHTML = U.tr(dirty ? "unsavedChanges" : "draftEditing"); });
  U.translate();
})();
