(function () {
  const params = new URLSearchParams(location.search);
  const id = params.get("supplier_id") || "";
  let profile = null;
  let products = [];
  let supplier = null;
  function resolve() {
    try {
      const accounts = MarineAccounts.read(localStorage, "accounts", []);
      profile = accounts.find((account) => account.id === id && account.role === "supplier") || null;
    } catch {}
    if (!profile) {
      try {
        const stored = MarineAccounts.readProfile(localStorage);
        if (stored.id === id) profile = stored;
      } catch {}
    }
    products = U.products().filter(
      (product) => (product.supplier_id || product.supplier.id) === id,
    );
    supplier = products[0]?.supplier || null;
    if (!profile && supplier)
      profile = {
        id,
        company: supplier.name?.zh || "",
        company_en: supplier.name?.en || "",
        country: supplier.country || "",
        main_categories: [
          ...new Set(products.map((product) => U.industryOf(product.category_id)?.id).filter(Boolean)),
        ],
        verification_status: supplier.verified ? "verified" : "pending",
      };
  }
  function themeClass() {
    return ["theme-ocean", "theme-slate", "theme-sand"].includes(profile?.theme)
      ? profile.theme
      : "";
  }
  function favorite() {
    let counts = {};
    let mine = [];
    try {
      counts = JSON.parse(localStorage.getItem("storefront_favorites") || "{}");
      mine = JSON.parse(localStorage.getItem("storefront_favorite_by") || "[]");
    } catch {}
    if (!mine.includes(id)) {
      counts[id] = (counts[id] || 0) + 1;
      mine.push(id);
      try {
        localStorage.setItem("storefront_favorites", JSON.stringify(counts));
        localStorage.setItem("storefront_favorite_by", JSON.stringify(mine));
      } catch {}
      U.notice("storefrontFavoriteSaved");
    } else {
      U.notice("storefrontFavorited");
    }
    render();
  }
  function render() {
    resolve();
    const main = document.getElementById("main");
    if (!id || !profile) {
      main.innerHTML = `<div class="container section">${U.empty("storefrontNotFound", "storefrontNotFoundHint", "suppliers.html", "viewAllSuppliers")}</div>`;
      U.translate();
      return;
    }
    const certs = SupplierCore.certs(localStorage, id).filter((cert) => cert.status === "verified");
    const articles = SupplierCore.articles(localStorage, id).filter(
      (article) => article.status === "published",
    );
    const config = SupplierCore.readSidebar(localStorage)[id] || {};
    let favCount = 0;
    try {
      favCount = JSON.parse(localStorage.getItem("storefront_favorites") || "{}")[id] || 0;
    } catch {}
    const industries = [
      ...new Set(products.map((product) => U.industryOf(product.category_id)?.id).filter(Boolean)),
    ];
    main.innerHTML = `<div class="container storefront"><div class="storefront-banner ${themeClass()}">${
      profile.banner ? `<img src="${U.e(profile.banner)}" alt="">` : ""
    }</div><div class="storefront-head"><div class="storefront-logo">${
      profile.logo
        ? `<img src="${U.e(profile.logo)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:12px">`
        : U.e((profile.company || "S").slice(0, 1))
    }</div><div class="storefront-head-main"><h1>${U.e(profile.company || "")}</h1><p class="muted">${U.e(profile.company_en || "")}</p><div class="cert-row" style="margin-top:8px"><span class="badge">${U.tr(profile.verification_status === "verified" ? "verifiedStatus" : "pendingStatus")}</span>${industries
      .map((industry) => `<span class="badge muted-badge">${U.bi(U.industry(industry)?.name)}</span>`)
      .join("")}</div><div class="storefront-meta"><span>${U.e(profile.country || "")}${profile.city ? " · " + U.e(profile.city) : ""}</span>${
      profile.founded ? `<span>${U.tr("storefrontYears")}: ${U.e(profile.founded)}</span>` : ""
    }${profile.employees ? `<span>${U.tr("storefrontEmployees")}: ${U.e(profile.employees)}</span>` : ""}<span>${U.tr("storefrontProductsCount")}: ${products.length}</span></div>${profile.tagline ? `<p style="margin:10px 0 0">${U.e(profile.tagline)}</p>` : ""}</div><div class="storefront-head-actions"><a class="button" href="${U.url("rfq.html", { supplier_id: id })}">${U.tr("storefrontInquiry")}</a><button type="button" class="button secondary" id="storefront-fav">${U.tr("storefrontFavorite")} · ${favCount}</button></div></div><section class="storefront-section"><h2>${U.tr("storefrontAbout")}</h2><div class="storefront-about"><div class="panel">${(() => {
        const intro = profile.intro?.zh || profile.intro?.en || "";
        if (intro) return `<p>${U.e(intro)}</p>`;
        const first = (profile.main_categories || [])[0];
        const catName = (U.industry(first) || U.cat(first))?.name?.[U.lang] || "";
        return `<p>${U.e(
          U.t("storefrontIntroFallback")
            .replace("{cat}", catName)
            .replace("{n}", String(products.length)),
        )}</p>`;
      })()}${
      (profile.photos || []).length
        ? `<div class="file-list">${profile.photos
            .map((photo) => `<div class="file-item">${U.e(photo)}</div>`)
            .join("")}</div>`
        : `<div>${(profile.main_categories || []).length ? `<div class="cert-row" style="margin-top:12px">${profile.main_categories.map((cid) => `<span class="badge">${U.bi((U.industry(cid) || U.cat(cid))?.name)}</span>`).join("")}</div>` : ""}${profile.website ? `<p style="margin:12px 0 0"><a class="text-link" href="${U.e(profile.website)}" target="_blank" rel="noopener">${U.e(profile.website)} ↗</a></p>` : ""}</div>`
    }</div><div class="panel storefront-contact"><h3 style="margin-top:0">${U.tr("storefrontContact")}</h3><dl><dt>${U.tr("contact")}</dt><dd>${U.e(profile.contact || "—")}${profile.position ? " · " + U.e(profile.position) : ""}</dd><dt>${U.tr("email")}</dt><dd>${U.e(profile.email || "—")}</dd><dt>${U.tr("phone")}</dt><dd>${U.e(profile.phone || "—")}</dd><dt>${U.tr("storefrontAddress")}</dt><dd>${U.e(profile.address || profile.city || "—")}</dd><dt>${U.tr("storefrontBusinessType")}</dt><dd>${profile.business_type ? U.tr(profile.business_type) : "—"}</dd></dl>${config.contact_note ? `<p class="inline-note">${U.e(config.contact_note)}</p>` : ""}</div></div></section><section class="storefront-section"><h2>${U.tr("storefrontCerts")}</h2>${
      certs.length
        ? `<div class="cert-strip">${certs
            .map(
              (cert) =>
                `<div class="cert-button"><strong>${U.e(cert.name)}</strong><small>${U.e(cert.no)}</small><span class="badge verified-badge">${U.tr("certVerified")}</span></div>`,
            )
            .join("")}</div>`
        : `<div class="panel"><p class="muted">${U.tr("storefrontNoCerts")}</p><p class="inline-note">${U.tr("storefrontNoCertsHint")}</p></div>`
    }</section><section class="storefront-section"><h2>${U.tr("storefrontNews")}</h2>${
      articles.length
        ? `<div class="article-card-grid">${articles
            .map(
              (article) =>
                `<article class="article-card">${article.cover ? `<img src="${U.e(article.cover)}" alt="">` : ""}<div><h3><a href="${U.url("content.html", { type: "article", id: article.id })}">${U.bi(article.title)}</a></h3><p>${U.e((article.content_html?.[U.lang] || "").replace(/<[^>]+>/g, "").slice(0, 90))}</p><small>${U.e(article.publish_at || "")}</small></div></article>`,
            )
            .join("")}</div>`
        : `<div class="panel"><p class="muted">${U.tr("storefrontNoArticles")}</p><p class="inline-note">${U.tr("storefrontNoArticlesHint")}</p></div>`
    }</section><section class="storefront-section"><h2>${U.tr("storefrontProducts")}</h2>${
      products.length
        ? `<div class="product-grid">${products.map((product) => U.card(product)).join("")}</div>`
        : `<div class="panel"><p class="muted">${U.tr("noProducts")}</p><p class="inline-note">${U.tr("storefrontMissingHint")}</p></div>`
    }</section><p class="content-disclaimer">${U.tr("storefrontDemoNote")}</p></div>`;
    document.getElementById("storefront-fav").onclick = favorite;
    U.translate();
    AccountUI.refreshContext();
  }
  render();
  window.addEventListener("languagechange", render);
  window.addEventListener("storage", (event) => {
    if (["certifications", "articles", "accounts", "supplier_profile"].includes(event.key)) render();
  });
})();
