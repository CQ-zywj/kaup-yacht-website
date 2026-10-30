(function () {
  const shell = SupplierShell.mount("consoleOverview");
  if (!shell) return;
  const { body, id, profile } = shell;
  const ownProducts = () =>
    U.products().filter((p) => (p.supplier_id || p.supplier.id) === id);
  const ownDrafts = () =>
    U.read("draft_products").filter((p) => !p.supplier_id || p.supplier_id === id);
  const statusOf = (p) => SupplierCore.normalizeProductStatus(p);
  const statusLabel = (status) => U.tr(SupplierCore.statusKey(status));
  const href = {
    consoleCompany: "company.html",
    consoleCerts: "certifications.html",
    consoleProducts: "supplier.html",
    consoleArticles: "supplier-articles.html",
  };
  function missingCompliance(products) {
    return products.filter(
      (p) =>
        p.category_id === "coatings" &&
        U.cat("coatings").fields.some((f) => !String(p.compliance?.[f.key] ?? "").trim()),
    );
  }
  function setStatus(productId, status) {
    const rows = U.read("draft_products");
    const index = rows.findIndex((row) => row.id === productId);
    if (index < 0) return;
    rows[index] = { ...rows[index], status, updated_at: new Date().toISOString() };
    if (U.write("draft_products", rows)) render();
  }
  function render() {
    const products = ownProducts();
    const drafts = ownDrafts();
    const rows = SupplierShell.scopedInquiries(U.read("rfq_drafts"), id).filter(
      (row) => (row.supplier_id ? row.supplier_id === id : row.mode !== "rfq"),
    );
    const unread = SupplierShell.unreadInquiries(U.read("rfq_drafts"));
    const active = products.filter((p) => statusOf(p) === "active").length;
    const draftCount = products.filter((p) => statusOf(p) === "draft").length;
    const rejectedCount = products.filter((p) => statusOf(p) === "rejected").length;
    const score = SupplierCore.completeness(localStorage, profile, id);
    const missing = missingCompliance(products);
    const publishedArticles = SupplierCore.articles(localStorage, id).filter(
      (article) => article.status === "published",
    ).length;
    const recent = rows
      .slice()
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
      .slice(0, 5);
    const todos = [];
    if (unread)
      todos.push({
        key: "todoUnread",
        params: unread,
        page: "inbox.html",
        label: "consoleInbox",
      });
    if ((profile.verification_status || "pending") !== "verified")
      todos.push({ key: "todoVerify", page: "company.html", label: "consoleCompany" });
    if (SupplierCore.certs(localStorage, id).filter((c) => c.status === "verified").length < 2)
      todos.push({ key: "todoCerts", page: "certifications.html", label: "consoleCerts" });
    if (missing.length)
      todos.push({
        key: "todoCompliance",
        params: missing.length,
        page: "supplier.html",
        label: "consoleProducts",
      });
    if (!publishedArticles)
      todos.push({
        key: "todoArticles",
        page: "supplier-articles.html",
        label: "consoleArticles",
      });
    const recentProducts = products
      .slice()
      .sort((a, b) => Date.parse(b.updated_at || 0) - Date.parse(a.updated_at || 0))
      .slice(0, 4);
    body.innerHTML = `<div class="page-intro"><div class="eyebrow">${U.tr("identitySupplier")}</div><h1>${U.tr("dashboardTitle")}</h1><p>${U.tr("dashboardDesc")}</p></div><div class="console-actions"><a class="button" href="${U.url("publish.html")}">+ ${U.tr("consolePublish")}</a><a class="button secondary" href="${U.url("inbox.html")}">${U.tr("consoleInbox")}${unread ? " · " + unread : ""}</a><a class="button secondary" href="${SupplierShell.storefrontUrl(id)}">${U.tr("viewStorefront")}</a></div><div class="kpi-grid">${[
      ["dashboardKpiViews", 186],
      ["dashboardKpiVisitors", 64],
      ["dashboardKpiInquiries", rows.length],
      ["dashboardKpiProducts", active],
    ]
      .map(
        ([key, value], index) =>
          `<div class="kpi-card"><small>${U.tr(key)}</small><strong>${value || "--"}</strong><em>${
            index < 2 ? U.tr("statDemoHint") : ""
          }</em></div>`,
      )
      .join("")}</div><div class="console-grid"><section class="panel"><h2>${U.tr("completenessTitle")}</h2><p class="inline-note">${U.tr("completenessDesc")}</p><div class="score-total"><strong>${score.score}</strong><span>/ 100</span></div>${score.sections
      .map(
        (section) =>
          `<div class="score-row"><span>${U.tr(section.key)}</span><span class="score-bar"><i style="width:${section.percent}%"></i></span><b>${section.score}</b></div><p class="score-hint">${U.tr(section.hint)} · <a href="${U.url(href[section.key])}">${U.tr("completenessGo")}</a></p>`,
      )
      .join("")}</section><section class="panel"><h2>${U.tr("todoTitle")}</h2>${
      todos.length
        ? `<ul class="todo-list">${todos
            .map(
              (todo) =>
                `<li><span class="dot" aria-hidden="true"></span><span>${
                  todo.params
                    ? `<b>${todo.params}</b> ${U.tr(todo.key)}`
                    : U.tr(todo.key)
                }</span><a href="${U.url(todo.page)}">${U.tr(todo.label)} →</a></li>`,
            )
            .join("")}</ul>`
        : `<p class="muted">${U.tr("allGood")}</p>`
    }</section></div><div class="console-grid"><section class="panel"><h2>${U.tr("recentInquiries")}</h2>${
      recent.length
        ? `<table class="console-table"><thead><tr><th>${U.tr("company")}</th><th>${U.tr("product")}</th><th>${U.tr("sentAt")}</th><th>${U.tr("status")}</th></tr></thead><tbody>${recent
            .map((row) => {
              const product = row.product_id ? U.product(row.product_id) : null;
              return `<tr><td>${U.e(row.buyer.company)}<br><small class="muted">${U.e(row.buyer.country)}</small></td><td>${product ? U.bi({ zh: product.i18n.zh.title, en: product.i18n.en.title }) : U.tr("publicInquiry")}</td><td>${U.e(U.date(row.created_at))}</td><td><span class="status ${U.e(row.status)}">${U.tr(row.status)}</span></td></tr>`;
            })
            .join("")}</tbody></table><div class="mini-actions" style="margin-top:12px"><a href="${U.url("inbox.html")}">${U.tr("viewMore")} →</a></div>`
        : `<p class="muted">${U.tr("noInquiries")}</p><a class="text-link" href="${U.url("inbox.html")}">${U.tr("consoleInbox")} →</a>`
    }</section><section class="panel"><h2>${U.tr("productOverview")}</h2><div class="cert-row" style="margin-bottom:12px"><span class="status active">${U.tr("activeProductsCount")} ${active}</span><span class="status draft">${U.tr("draftProductsCount")} ${draftCount}</span><span class="status rejected">${U.tr("statusRejected")} ${rejectedCount}</span></div>${
      recentProducts.length
        ? `<table class="console-table"><tbody>${recentProducts
            .map((product) => {
              const editable = drafts.find((row) => row.id === product.id);
              const status = statusOf(product);
              return `<tr><td><a href="${U.url("product.html", { id: product.id })}">${U.bi({ zh: product.i18n.zh.title, en: product.i18n.en.title })}</a></td><td>${statusLabel(status)}</td><td class="mini-actions">${
                editable
                  ? `<a href="${U.url("publish.html", { draft: product.id })}">${U.tr("edit")}</a>${
                      status === "active"
                        ? `<button type="button" class="link-button" data-status="inactive" data-product="${U.e(product.id)}">${U.tr("productDeactivate")}</button>`
                        : `<button type="button" class="link-button" data-status="active" data-product="${U.e(product.id)}">${U.tr("productActivate")}</button>`
                    }`
                  : `<span class="badge muted-badge">${U.tr("demo")}</span>`
              }</td></tr>`;
            })
            .join("")}</tbody></table>`
        : `<p class="muted">${U.tr("noProducts")}</p>`
    }<div class="mini-actions" style="margin-top:12px"><a href="${U.url("supplier.html")}">${U.tr("consoleProducts")} →</a></div></section></div><section class="panel"><h2>${U.tr("consoleStorefront")}</h2><div class="section-head" style="margin-bottom:0"><div><strong>${U.e(profile.company || "")}</strong><p class="inline-note">${U.e(profile.tagline || profile.intro?.zh || "")}</p></div><div class="mini-actions"><a class="button secondary" href="${SupplierShell.storefrontUrl(id)}">${U.tr("viewStorefront")}</a><a class="button" href="${U.url("company.html")}">${U.tr("editStorefront")}</a></div></div></section>`;
    body.querySelectorAll("[data-status]").forEach((button) => {
      button.onclick = () => setStatus(button.dataset.product, button.dataset.status);
    });
    U.translate();
  }
  render();
  window.addEventListener("storage", (event) => {
    if (["rfq_drafts", "draft_products", "current_user"].includes(event.key)) render();
  });
  window.addEventListener("focus", render);
  window.addEventListener("languagechange", render);
})();
