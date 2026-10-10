const id = new URLSearchParams(location.search).get("id");
const p = U.product(id);
function value(f, v) {
  if (v && typeof v === "object") return U.bi(v);
  const option = f.options?.find((o) => o.value === String(v));
  return option
    ? U.bi(option.label)
    : v != null && v !== ""
      ? U.e(v)
      : U.tr("missing");
}
if (!p) {
  document.getElementById("main").innerHTML =
    `<div class="container section">${U.empty("notFound", "adjust", "products.html", "backBrowse")}</div>`;
} else {
  const c = U.cat(p.category_id);
  const missing =
    c.id === "coatings" && c.fields.some((f) => !p.compliance[f.key]);
  document.getElementById("main").innerHTML =
    `<div class="container"><div class="breadcrumb"><a href="${U.url("index.html")}">${U.tr("home")}</a> / <a href="${U.url("products.html", { industry: U.industryOf(c.id)?.id })}">${U.bi(U.industryOf(c.id)?.name)}</a> / <a href="${U.url("products.html", { category: c.id })}">${U.bi(c.name)}</a> / ${U.bi({ zh: p.i18n.zh.title, en: p.i18n.en.title })}</div><div class="detail-top"><div><div class="gallery-main"><img id="main-image" data-alt-zh="${U.e(p.i18n.zh.title)}" data-alt-en="${U.e(p.i18n.en.title)}" src="${U.e(U.img(p))}" alt="${U.e(p.i18n[U.lang].title)}"></div><div class="thumbnails">${p.media.map((src, i) => `<button type="button" data-image="${i}" data-aria-zh="产品图片 ${i + 1}" data-aria-en="Product image ${i + 1}" class="${i === 0 ? "selected" : ""}" aria-label="${U.t("gallery")} ${i + 1}"><img src="${U.e(src)}" alt=""></button>`).join("")}</div></div><section class="detail-info"><div class="eyebrow">${U.bi(c.name)}</div><h1>${U.bi({ zh: p.i18n.zh.title, en: p.i18n.en.title })}</h1><div class="cert-row">${U.badges(p)}</div><div class="price-panel"><div class="muted">${U.tr("price")} · USD</div><div class="price">$${Number(p.trade.price_min).toLocaleString()} – $${Number(p.trade.price_max).toLocaleString()}</div><small>${U.tr("demo")}</small></div><div class="detail-trade"><div><small>${U.tr("moq")}</small><strong>${U.e(p.trade.moq)} ${U.tr("unit_" + p.trade.unit)}</strong></div><div><small>${U.tr("lead")}</small><strong>${U.e(p.trade.lead_time)} ${U.tr("days")}</strong></div><div><small>${U.tr("terms")}</small><strong>${p.trade.incoterms.map(U.e).join(" / ")}</strong></div></div><a class="button full-width" href="${U.url("rfq.html", { product: p.id })}">${U.tr("rfq")} →</a></section></div><div class="detail-bottom"><div><section class="panel"><h2>${U.tr("description")}</h2><p>${U.bi({ zh: p.i18n.zh.description, en: p.i18n.en.description })}</p></section><section class="panel"><h2>${U.tr("parameters")}</h2><table class="param-table"><tbody>${c.fields
      .filter((f) => c.id !== "coatings")
      .map(
        (f) =>
          `<tr><th scope="row">${U.bi(f.label)}</th><td>${value(f, p.parameters[f.key])}</td></tr>`,
      )
      .join(
        "",
      )}${(p.parameters.specs || []).map((s) => `<tr><th scope="row">${U.e(s.key)}</th><td>${U.e(s.value)}</td></tr>`).join("")}${c.id === "coatings" ? `<tr><th>AFS</th><td>${value(c.fields[0], p.compliance.afs)}</td></tr><tr><th>VOC</th><td>${value(c.fields[1], p.compliance.voc)}</td></tr>` : ""}</tbody></table></section><section class="panel"><h2>${U.tr("certs")}</h2><div class="cert-row">${p.certifications.map((v, i) => `<button type="button" class="cert-button" data-cert-index="${i}"><strong>${U.e(v.type)}</strong><small>${U.e(v.number)}</small></button>`).join("") || U.tr("noData")}</div></section>${c.id === "coatings" ? `<section class="panel compliance-panel"><h2>${U.tr("compliance")}</h2>${missing ? `<div class="warning">${U.tr("missingCompliance")}</div>` : ""}<table class="param-table"><tbody>${c.fields.map((f) => `<tr><th scope="row">${U.bi(f.label)}</th><td>${f.key === "msds" && p.compliance.msds ? `<a class="text-link" href="${/^(https?:|assets\/)/.test(p.compliance.msds) ? U.e(p.compliance.msds) : "#"}" target="_blank" rel="noopener">${U.tr("viewMsds")} ↗</a>` : value(f, p.compliance[f.key])}</td></tr>`).join("")}</tbody></table><p class="muted" style="margin-top:20px">${U.tr("complianceHint")}</p></section>` : ""}</div><aside><section class="panel supplier-card"><div class="supplier-mark">M</div><div class="eyebrow">${U.tr("supplierInfo")}</div><h3 style="margin-top:10px">${U.bi(p.supplier.name)}</h3><span class="badge">${U.tr(p.supplier.verified ? "verified" : "unverified")}</span><p style="margin-top:18px">${U.e(p.supplier.country || "")}<br>${U.tr("activeProducts")}：${p.supplier.products_count}</p><a class="button secondary full-width" href="${U.url("rfq.html", { product: p.id })}">${U.tr("rfq")}</a></section><div class="form-note">${U.tr("demo")}</div></aside></div>${
      U.products().filter(
        (v) => v.category_id === p.category_id && v.id !== p.id,
      ).length
        ? `<section class="section"><div class="section-head"><h2>${U.tr("related")}</h2></div><div class="product-grid">${U.products()
            .filter((v) => v.category_id === p.category_id && v.id !== p.id)
            .slice(0, 3)
            .map((v) => U.card(v))
            .join("")}</div></section>`
        : ""
    }</div><dialog id="certificate-modal" aria-label="${U.t("certificate")}"></dialog>`;
  document.querySelectorAll("[data-image]").forEach(
    (b) =>
      (b.onclick = () => {
        document.getElementById("main-image").src =
          p.media[Number(b.dataset.image)];
        document
          .querySelectorAll("[data-image]")
          .forEach((x) => x.classList.toggle("selected", x === b));
      }),
  );
  document.querySelectorAll("[data-cert-index]").forEach(
    (b) =>
      (b.onclick = () => {
        const v = p.certifications[Number(b.dataset.certIndex)],
          d = document.getElementById("certificate-modal");
        d.innerHTML = `<div class="modal-body"><h2>${U.tr("certificate")}</h2><h3>${U.e(v.type)}</h3><p>${U.e(v.number)}</p><p>${U.tr("certificateHint")}</p><button type="button" class="button secondary" id="close-cert">${U.tr("close")}</button></div>`;
        d.showModal();
        document.getElementById("close-cert").onclick = () => d.close();
      }),
  );
}
U.translate();
