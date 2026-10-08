function render() {
  const drafts = U.read("draft_products");
  document.getElementById("main").innerHTML =
    `<div class="container supplier-list"><div class="page-intro"><div class="eyebrow">${U.tr("supplierMode")}</div><h1>${U.tr("myProducts")}</h1><p>${U.tr("publishDesc")}</p></div><div class="section-head"><span class="count"><b>${drafts.length}</b>${U.tr("results")}</span><a class="button" href="${U.url("publish.html")}">+ ${U.tr("resetForm")}</a></div>${drafts.length ? `<div class="product-grid">${drafts.map((p) => `<article class="panel"><img style="height:150px;width:100%;object-fit:cover;margin-bottom:15px" src="${U.e(U.img(p))}" alt=""><span class="status ${p.status === "published" ? "replied" : "viewed"}">${U.tr(p.status === "published" ? "submittedProduct" : "draft")}</span><h3 style="margin-top:12px">${U.bi({ zh: p.i18n.zh.title || MarineI18n.draft[0], en: p.i18n.en.title || MarineI18n.draft[1] })}</h3><p class="muted">${U.bi(U.cat(p.category_id)?.name)}</p><a class="button secondary full-width" href="${U.url("publish.html", { draft: p.id })}">${U.tr("edit")}</a></article>`).join("")}</div>` : U.empty("noProducts", "startPublish", "publish.html", "publish")}</div>`;
  U.translate();
}
render();
window.addEventListener("storage", render);
