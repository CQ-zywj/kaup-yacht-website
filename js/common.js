let initialLanguage = "zh";
try {
  initialLanguage = localStorage.getItem("marine_lang") || "zh";
} catch {}
const U = (window.MarineUI = {
  badStorage: new Set(),
  lang: new URLSearchParams(location.search).get("lang") || initialLanguage,
  t(k) {
    const pair = MarineI18n[k];
    return pair ? pair[this.lang === "en" ? 1 : 0] : k;
  },
  e(v) {
    return String(v ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  },
  tr(k) {
    return `<span data-i18n="${k}">${this.e(this.t(k))}</span>`;
  },
  bi(o) {
    if (o == null) return this.tr("missing");
    if (typeof o !== "object") return this.e(o);
    return `<span data-zh="${this.e(o.zh)}" data-en="${this.e(o.en)}">${this.e(o[this.lang] || o.zh)}</span>`;
  },
  url(page, params = {}) {
    const [base, existingQuery = ""] = page.split("?");
    const q = new URLSearchParams(existingQuery);
    for (const [key, value] of Object.entries({
      v: "prd3",
      ...params,
      lang: this.lang,
    }))
      q.set(key, value);
    return `${base}?${q}`;
  },
  read(key) {
    try {
      const data = MarineCore.readArray(localStorage, key);
      this.badStorage.delete(key);
      return data;
    } catch (error) {
      if (!this.badStorage.has(key))
        setTimeout(() => this.notice("storageError"), 0);
      this.badStorage.add(key);
      this.storageFailed = true;
      return [];
    }
  },
  write(key, values) {
    if (this.badStorage.has(key)) {
      this.notice("storageError");
      return false;
    }
    try {
      MarineCore.writeArray(localStorage, key, values);
      return true;
    } catch (error) {
      this.notice("storageError");
      return false;
    }
  },
  products() {
    const products = [
      ...MarineData.products,
      ...this.read("draft_products").filter((x) => x.status === "published"),
    ];
    try {
      const accounts = MarineAccounts.read(localStorage, "accounts", []);
      const profile = MarineAccounts.read(localStorage, "supplier_profile");
      return products.map((p) => {
        const id = p.supplier_id || p.supplier?.id;
        const live =
          accounts.find((a) => a.id === id && a.role === "supplier") ||
          (profile?.id === id ? profile : null);
        return live
          ? {
              ...p,
              supplier: {
                ...p.supplier,
                ...MarineAccounts.supplier(live),
                products_count: products.filter(
                  (item) => (item.supplier_id || item.supplier?.id) === id,
                ).length,
              },
            }
          : p;
      });
    } catch {
      return products;
    }
  },
  product(id) {
    return this.products().find((p) => p.id === id);
  },
  cat(id) {
    return MarineData.categories.find((c) => c.id === id);
  },
  badges(p) {
    return (p.certifications || [])
      .map((c) => `<span class="badge">${this.e(c.type)}</span>`)
      .join("");
  },
  img(p) {
    return (
      p?.media?.[0] || "assets/media/" + (p?.category_id || "boats") + ".svg"
    );
  },
  card(p) {
    return `<article class="product-card"><a class="card-image" href="${this.url("product.html", { id: p.id })}"><img src="${this.e(this.img(p))}" data-alt-zh="${this.e(p.i18n?.zh?.title)}" data-alt-en="${this.e(p.i18n?.en?.title)}" alt="${this.e(p.i18n?.[this.lang]?.title || "")}" loading="lazy"><span class="image-label">${this.bi(this.cat(p.category_id)?.name)}</span></a><div class="card-content"><div class="card-cert">${this.badges(p)}</div><a class="card-title" href="${this.url("product.html", { id: p.id })}">${this.bi({ zh: p.i18n.zh.title, en: p.i18n.en.title })}</a><div class="card-supplier">${this.e(p.supplier.country || "")} · ${this.bi(p.supplier.name)}</div><div class="card-price">$${Number(p.trade.price_min).toLocaleString()} <small>– $${Number(p.trade.price_max).toLocaleString()}</small></div><div class="card-bottom"><span>${this.tr("moq")} ${this.e(p.trade.moq)} ${this.tr("unit_" + p.trade.unit)}</span><a data-i18n-aria="rfq" aria-label="${this.e(this.t("rfq"))}" href="${this.url("rfq.html", { product: p.id })}">↗</a></div></div></article>`;
  },
  empty(title, desc, link = "products.html", label = "browse") {
    return `<div class="empty"><div class="empty-icon">⌁</div><h2>${this.tr(title)}</h2><p>${this.tr(desc)}</p><a class="button" href="${this.url(link)}">${this.tr(label)}</a></div>`;
  },
  translate() {
    document.documentElement.lang = this.lang;
    document
      .querySelectorAll("[data-aria-zh]")
      .forEach((n) =>
        n.setAttribute(
          "aria-label",
          n.dataset[this.lang === "en" ? "ariaEn" : "ariaZh"],
        ),
      );
    document
      .querySelectorAll("[data-i18n-aria]")
      .forEach((n) => n.setAttribute("aria-label", this.t(n.dataset.i18nAria)));
    document
      .querySelectorAll("[data-alt-zh]")
      .forEach(
        (n) => (n.alt = n.dataset[this.lang === "en" ? "altEn" : "altZh"]),
      );
    document
      .querySelectorAll("[data-i18n]")
      .forEach((n) => (n.textContent = this.t(n.dataset.i18n)));
    document
      .querySelectorAll("[data-zh]")
      .forEach((n) => (n.textContent = n.dataset[this.lang] || n.dataset.zh));
    document
      .querySelectorAll("[data-i18n-placeholder]")
      .forEach((n) => (n.placeholder = this.t(n.dataset.i18nPlaceholder)));
    document.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      if (/\.html(?:\?|$)/.test(href)) {
        const [page, q] = href.split("?");
        const params = new URLSearchParams(q);
        params.set("lang", this.lang);
        a.setAttribute("href", page + "?" + params);
      }
    });
    const button = document.getElementById("language");
    if (button) button.textContent = this.t("language");
  },
  notice(key, desc, link, label) {
    const modal = document.getElementById("feedback");
    modal.innerHTML = `<div class="modal-body"><div class="success-icon">✓</div><h2>${this.tr(key)}</h2>${desc ? `<p>${this.tr(desc)}</p>` : ""}<div class="actions">${link ? `<a class="button" href="${this.url(link)}">${this.tr(label)}</a>` : ""}<button type="button" class="button secondary" id="close-feedback">${this.tr("close")}</button></div></div>`;
    modal.showModal();
    document.getElementById("close-feedback").onclick = () => modal.close();
  },
  field(
    key,
    name,
    type = "text",
    value = "",
    required = false,
    placeholder = "",
  ) {
    return `<div class="field"><label for="${name}">${this.tr(key)}${required ? " <b>*</b>" : ""}</label><input id="${name}" name="${name}" type="${type}" ${type === "number" ? 'step="any"' : ""} value="${this.e(value)}" ${required ? "required" : ""} ${placeholder ? `data-i18n-placeholder="${placeholder}" placeholder="${this.e(this.t(placeholder))}"` : ""}><small class="error" data-error="${name}"></small></div>`;
  },
  area(key, name, value = "", required = false, placeholder = "") {
    return `<div class="field full"><label for="${name}">${this.tr(key)}${required ? " <b>*</b>" : ""}</label><textarea id="${name}" name="${name}" ${required ? "required" : ""} ${placeholder ? `data-i18n-placeholder="${placeholder}" placeholder="${this.e(this.t(placeholder))}"` : ""}>${this.e(value)}</textarea><small class="error" data-error="${name}"></small></div>`;
  },
  options(items, selected = "") {
    return items
      .map(
        (i) =>
          `<option value="${this.e(i.value ?? i.id)}" data-zh="${this.e((i.label || i.name).zh)}" data-en="${this.e((i.label || i.name).en)}" ${selected === (i.value ?? i.id) ? "selected" : ""}>${this.e((i.label || i.name)[this.lang])}</option>`,
      )
      .join("");
  },
  errors(form, errors) {
    form.querySelectorAll(".error").forEach((n) => (n.textContent = ""));
    form.querySelectorAll(".invalid").forEach((n) => {
      n.classList.remove("invalid");
      n.removeAttribute("aria-invalid");
    });
    Object.entries(errors).forEach(([name, key]) => {
      const input = form.elements.namedItem(name);
      for (const control of input
        ? input.classList
          ? [input]
          : Array.from(input)
        : []) {
        control.classList.add("invalid");
        control.setAttribute("aria-invalid", "true");
      }
      const target = form.querySelector(`[data-error="${name}"]`);
      if (target) target.innerHTML = this.tr(key);
    });
    if (Object.keys(errors).length) {
      const first = form.querySelector(".invalid");
      first?.scrollIntoView?.({ block: "center", behavior: "instant" });
      first?.focus();
      return false;
    }
    return true;
  },
  validate(form) {
    const errors = {};
    for (const i of form.querySelectorAll("[required]")) {
      if (!i.value.trim()) errors[i.name] = "required";
      else if (
        i.type === "number" &&
        (!Number.isFinite(Number(i.value)) || Number(i.value) <= 0)
      )
        errors[i.name] = "validNumber";
      else if (!i.checkValidity()) errors[i.name] = "validation";
    }
    return errors;
  },
  attachments(files) {
    return Array.from(files || []).map((f) => ({
      name: f.name,
      type: f.type,
      size: f.size,
    }));
  },
  filesHtml(items) {
    return items
      .map(
        (f) =>
          `<div class="file-item">${this.e(f.name)} <small>${Math.round(f.size / 1024)} KB · ${this.tr("filePlaceholder")}</small></div>`,
      )
      .join("");
  },
  context(p) {
    return p
      ? `<div class="context"><img src="${this.e(this.img(p))}" alt=""><div><div class="eyebrow">${this.bi(this.cat(p.category_id)?.name)}</div><h3>${this.bi({ zh: p.i18n.zh.title, en: p.i18n.en.title })}</h3><p>${this.bi(p.supplier.name)}</p></div></div>`
      : `<div class="context"><div class="context-symbol">↗</div><div><h3>${this.tr("general")}</h3><p>${this.tr("rfqDesc")}</p></div></div>`;
  },
  date(v) {
    return new Date(v).toLocaleString(this.lang === "en" ? "en-US" : "zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  },
});
if (!["zh", "en"].includes(U.lang)) U.lang = "zh";
const page = document.body.dataset.page;
document.getElementById("header").innerHTML =
  `<header class="main-header"><div class="container header-row"><a class="brand" href="${U.url("index.html")}"><svg width="38" height="38" viewBox="0 0 40 40" aria-hidden="true"><path d="M6 27 19 6v19l14 2-5 8H12Z" fill="currentColor"/><path d="m22 8 11 15H22Z" fill="#eb7435"/></svg><div>MARINEX<small>海贸通 · MARINE SOURCING</small></div></a><form class="header-search" action="products.html"><label class="sr-only" for="global-search">${U.tr("search")}</label><input id="global-search" name="q" data-i18n-placeholder="search" placeholder="${U.t("search")}" value="${U.e(new URLSearchParams(location.search).get("q") || "")}"><input type="hidden" name="lang" value="${U.lang}"><button data-i18n-aria="searchButton" aria-label="${U.t("searchButton")}">${U.tr("searchButton")}</button></form><button class="language" id="language" type="button">${U.t("language")}</button><a class="button compact" href="${U.url("publish.html")}">${U.tr("publish")} <span>↗</span></a></div></header><nav class="main-nav"><div class="container"><a class="${page === "home" ? "active" : ""}" href="${U.url("index.html")}">${U.tr("home")}</a><a class="${page === "products" || page === "product" ? "active" : ""}" href="${U.url("products.html")}">${U.tr("browse")}</a><a class="${page === "rfq" ? "active" : ""}" href="${U.url("rfq.html")}">${U.tr("generalRfq")}</a><div class="nav-spacer"></div><a class="${page === "supplier" ? "active" : ""}" href="${U.url("supplier.html")}">${U.tr("myProducts")}</a><a class="${page === "inbox" ? "active" : ""}" href="${U.url("inbox.html")}">${U.tr("inbox")}</a></div></nav>`;
document.getElementById("footer").innerHTML =
  `<footer><div class="container footer-grid"><div><a class="footer-brand" href="${U.url("index.html")}">MARINEX<span>海贸通</span></a><p>${U.tr("footerTag")}</p></div><div><h4>${U.tr("category")}</h4>${MarineData.categories.map((c) => `<a href="${U.url("products.html", { category: c.id })}">${U.bi(c.name)}</a>`).join("")}</div><div><h4>${U.tr("supplier")}</h4><a href="${U.url("publish.html")}">${U.tr("publish")}</a><a href="${U.url("inbox.html")}">${U.tr("inbox")}</a><a href="${U.url("supplier.html")}">${U.tr("myProducts")}</a></div></div><div class="container footer-bottom"><span>${U.tr("footerCopy")}</span><span>${U.tr("demo")}</span><button id="footer-language" class="language" type="button" data-i18n="language" style="color:inherit">${U.tr("language")}</button></div></footer>`;
U.switchLanguage = () => {
  U.lang = U.lang === "zh" ? "en" : "zh";
  try {
    localStorage.setItem("marine_lang", U.lang);
  } catch {}
  const url = new URL(location.href);
  url.searchParams.set("lang", U.lang);
  history.replaceState(null, "", url);
  document.querySelector(".header-search [name=lang]").value = U.lang;
  U.translate();
  window.dispatchEvent(new Event("languagechange"));
};
document.getElementById("language").onclick = () => U.switchLanguage();
document.getElementById("footer-language").onclick = () => U.switchLanguage();
U.translate();
if (U.storageFailed) setTimeout(() => U.notice("storageError"), 0);
