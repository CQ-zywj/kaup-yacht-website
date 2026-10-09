const qp = new URLSearchParams(location.search);
let filters = {
  category: qp.get("category") || "",
  subcategory: qp.get("subcategory") || "",
  q: qp.get("q") || "",
  cert: (qp.get("cert") || "").split(",").filter(Boolean),
  params: {},
};
let sort = qp.get("sort") || "updated";
let currentPage = MarineCore.pageNumber(qp.get("page"));
const size = 6;
for (const [key, value] of qp) {
  if (key.startsWith("p_")) filters.params[key.slice(2)] = value.split(",");
  if (key.startsWith("min_") || key.startsWith("max_")) {
    const part = key.startsWith("min_") ? "min" : "max";
    const name = key.slice(4);
    filters.params[name] = { ...(filters.params[name] || {}), [part]: value };
  }
}
function sync() {
  const q = new URLSearchParams({ lang: U.lang });
  for (const k of ["category", "subcategory", "q"])
    if (filters[k]) q.set(k, filters[k]);
  if (filters.cert.length) q.set("cert", filters.cert.join(","));
  q.set("sort", sort);
  q.set("page", currentPage);
  for (const [k, v] of Object.entries(filters.params)) {
    if (Array.isArray(v) && v.length) q.set("p_" + k, v.join(","));
    else if (v && typeof v === "object")
      for (const side of ["min", "max"])
        if (v[side] != null && v[side] !== "") q.set(side + "_" + k, v[side]);
  }
  history.replaceState(null, "", "products.html?" + q);
}
function paramFilter(f) {
  const v = filters.params[f.key];
  if (f.type === "enum")
    return `<div class="filter-group"><h4>${U.bi(f.label)}</h4>${f.options.map((o) => `<label class="check"><input type="checkbox" data-param="${f.key}" value="${o.value}" ${Array.isArray(v) && v.includes(o.value) ? "checked" : ""}>${U.bi(o.label)}</label>`).join("")}</div>`;
  if (f.type === "number")
    return `<div class="filter-group"><h4>${U.bi(f.label)}</h4><div class="range"><input aria-label="${U.e(f.label[U.lang])} ${U.t("min")}" type="number" min="0" data-range="${f.key}" data-side="min" data-i18n-placeholder="min" placeholder="${U.t("min")}" value="${U.e(v?.min || "")}"><input aria-label="${U.e(f.label[U.lang])} ${U.t("max")}" type="number" min="0" data-range="${f.key}" data-side="max" data-i18n-placeholder="max" placeholder="${U.t("max")}" value="${U.e(v?.max || "")}"></div></div>`;
  return "";
}
function renderFilters() {
  const c = U.cat(filters.category);
  document.getElementById("filter-panel").innerHTML =
    `<div class="filter-top"><h3>${U.tr("filters")}</h3><button type="button" class="link-button" id="reset">${U.tr("reset")}</button></div><div class="filter-group"><h4>${U.tr("category")}</h4><select id="category" aria-label="${U.t("category")}"><option value="">${U.t("all")}</option>${U.options(MarineData.categories, filters.category)}</select></div>${c ? `<div class="filter-group"><h4>${U.tr("subcategory")}</h4><select id="subcategory" aria-label="${U.t("subcategory")}"><option value="">${U.t("all")}</option>${U.options(c.subcategories, filters.subcategory)}</select></div>${c.fields.map(paramFilter).join("")}` : ""}<div class="filter-group"><h4>${U.tr("certs")}</h4>${["CCS", "ABS", "DNV"].map((t) => `<label class="check"><input data-cert type="checkbox" value="${t}" ${filters.cert.includes(t) ? "checked" : ""}>${t}</label>`).join("")}</div>`;
  document.getElementById("reset").onclick = reset;
  document.getElementById("category").onchange = (e) => {
    filters.category = e.target.value;
    filters.subcategory = "";
    filters.params = {};
    currentPage = 1;
    renderFilters();
    renderResults();
  };
  document.getElementById("subcategory")?.addEventListener("change", (e) => {
    filters.subcategory = e.target.value;
    currentPage = 1;
    renderResults();
  });
  document.querySelectorAll("[data-param],[data-cert]").forEach(
    (input) =>
      (input.onchange = () => {
        if (input.hasAttribute("data-cert"))
          filters.cert = [
            ...document.querySelectorAll("[data-cert]:checked"),
          ].map((x) => x.value);
        else
          filters.params[input.dataset.param] = [
            ...document.querySelectorAll(
              `[data-param="${input.dataset.param}"]:checked`,
            ),
          ].map((x) => x.value);
        currentPage = 1;
        renderResults();
      }),
  );
  document.querySelectorAll("[data-range]").forEach(
    (input) =>
      (input.oninput = () => {
        filters.params[input.dataset.range] = {
          ...(filters.params[input.dataset.range] || {}),
          [input.dataset.side]: input.value,
        };
        currentPage = 1;
        renderResults();
      }),
  );
  U.translate();
  AccountUI.refreshContext();
}
function reset() {
  filters = { category: "", subcategory: "", q: "", cert: [], params: {} };
  currentPage = 1;
  document.getElementById("catalog-search").value = "";
  document.getElementById("global-search").value = "";
  renderFilters();
  renderResults();
}
function renderResults() {
  const items = MarineCore.sortProducts(
    MarineCore.filterProducts(U.products(), filters),
    sort,
    filters.q,
  );
  const pages = Math.max(1, Math.ceil(items.length / size));
  currentPage = Math.min(currentPage, pages);
  document.getElementById("result-count").innerHTML =
    `<b>${items.length}</b>${U.tr("results")}`;
  document.getElementById("results").innerHTML = items.length
    ? `<div class="product-grid">${items
        .slice((currentPage - 1) * size, currentPage * size)
        .map((p) => U.card(p))
        .join("")}</div>`
    : U.empty("noResults", "adjust", "rfq.html", "generalRfq");
  document.getElementById("pagination").innerHTML = items.length
    ? `<button data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""}>${U.tr("previous")}</button>${Array.from({ length: pages }, (_, i) => `<button data-page="${i + 1}" class="${currentPage === i + 1 ? "active" : ""}">${i + 1}</button>`).join("")}<button data-page="${currentPage + 1}" ${currentPage === pages ? "disabled" : ""}>${U.tr("next")}</button>`
    : "";
  document.querySelectorAll("[data-page]").forEach((b) => {
    if (b.tagName === "BUTTON")
      b.onclick = () => {
        currentPage = Number(b.dataset.page);
        renderResults();
        document
          .getElementById("catalog-top")
          .scrollIntoView({ block: "start" });
      };
  });
  sync();
  U.translate();
  AccountUI.refreshContext();
}
document.getElementById("main").innerHTML =
  `<div class="container"><div class="page-intro" id="catalog-top"><div class="eyebrow">${U.tr("marineMarketplace")}</div><h1>${U.tr("market")}</h1><p>${U.tr("featuredDesc")}</p></div><button type="button" class="button secondary mobile-filter-button" id="toggle-filters" aria-expanded="false">${U.tr("filters")} ☰</button><div class="catalog-layout"><aside class="filters" id="filter-panel"></aside><section><form id="catalog-form" class="header-search" style="max-width:none;margin-bottom:16px"><label class="sr-only" for="catalog-search">${U.tr("search")}</label><input id="catalog-search" data-i18n-placeholder="search" placeholder="${U.t("search")}" value="${U.e(filters.q)}"><button>${U.tr("searchButton")}</button></form><div class="catalog-toolbar"><span class="count" id="result-count" aria-live="polite"></span><label>${U.tr("sort")} <select id="sort"><option value="updated" data-i18n="updated"></option><option value="relevance" data-i18n="relevance"></option><option value="price" data-i18n="priceSort"></option></select></label></div><div id="results"></div><div class="pagination" id="pagination"></div></section></div></div>`;
document.getElementById("sort").value = sort;
document.getElementById("sort").onchange = (e) => {
  sort = e.target.value;
  currentPage = 1;
  renderResults();
};
document.getElementById("catalog-form").onsubmit = (e) => {
  e.preventDefault();
  filters.q = document.getElementById("catalog-search").value;
  document.getElementById("global-search").value = filters.q;
  currentPage = 1;
  renderResults();
};
document.getElementById("toggle-filters").onclick = (e) => {
  const panel = document.getElementById("filter-panel");
  panel.classList.toggle("open");
  e.currentTarget.setAttribute(
    "aria-expanded",
    String(panel.classList.contains("open")),
  );
};
renderFilters();
renderResults();
window.addEventListener("languagechange", () => {
  renderFilters();
  renderResults();
});
