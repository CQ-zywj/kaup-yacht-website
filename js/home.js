const icons = [
  `<path d="m4 25 7 6h19l6-10-16 2Z"/><path d="M13 23V6l13 13H13M6 35q5-4 10 0t10 0t10 0"/>`,
  `<rect x="5" y="8" width="30" height="22" rx="3"/><path d="m12 22 5-8 6 9 5-5M15 35h12M20 30v5"/>`,
  `<path d="M8 12h24l-2 23H10ZM12 12V8a8 8 0 0 1 16 0v4M9 21h22"/>`,
  `<path d="M8 35V7h22v28M4 35h32M14 14h10M14 21h10M14 28h10"/>`,
];
document.getElementById("main").innerHTML =
  `<section class="hero"><div class="container"><img class="hero-art" src="assets/media/hero.svg" alt=""><div class="hero-copy"><div class="eyebrow">${U.tr("heroNote")}</div><h1>${U.tr("heroTitle")}</h1><p>${U.tr("heroDesc")}</p><div class="hero-actions"><a class="button" href="${U.url("products.html")}">${U.tr("browse")} <span>→</span></a><a class="button secondary" href="${U.url("rfq.html")}">${U.tr("generalRfq")}</a></div><div class="hero-rule"><span>VESSELS</span><span>EQUIPMENT</span><span>COATINGS</span><span>SERVICES</span></div></div><div class="hero-caption">${U.tr("heroCaption")}</div></div></section><div class="trust-strip"><div class="container trust-grid">${["certified", "compliant", "worldwide"].map((k, i) => `<div class="trust-item"><div class="trust-symbol">${["✓", "≋", "↗"][i]}</div><div><h3>${U.tr(k)}</h3><p>${U.tr("trustDesc" + (i + 1))}</p></div></div>`).join("")}</div></div><section class="section container"><div class="section-head"><div><div class="section-tag">${U.tr("marineCategories")}</div><h2>${U.tr("explore")}</h2><p>${U.tr("exploreDesc")}</p></div><a class="text-link" href="${U.url("products.html")}">${U.tr("viewAll")} →</a></div><div class="category-grid">${MarineData.categories.map((c, i) => `<a class="category-card" href="${U.url("products.html", { category: c.id })}"><svg viewBox="0 0 40 40" aria-hidden="true">${icons[i]}</svg><span class="arrow">↗</span><h3>${U.bi(c.name)}</h3><p>${U.bi(c.description)}</p></a>`).join("")}</div></section><section class="section container"><div class="section-head"><div><div class="section-tag">${U.tr("selectedProject")}</div><h2>${U.tr("featured")}</h2><p>${U.tr("featuredDesc")}</p></div><a class="text-link" href="${U.url("products.html")}">${U.tr("viewAll")} →</a></div><div class="product-grid">${
    U.products()
      .filter((p) => ["p01", "p02", "p05", "p09", "p13", "p14"].includes(p.id))
      .map((p) => U.card(p))
      .join("") || U.empty("noData", "adjust")
  }</div></section><section class="section container"><div class="quote-banner"><div><h2>${U.tr("quoteTitle")}</h2><p>${U.tr("quoteDesc")}</p></div><a class="button dark" href="${U.url("rfq.html")}">${U.tr("generalRfq")} →</a></div></section>`;
U.translate();
