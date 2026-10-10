const qp = new URLSearchParams(location.search);
let filters = {
  industry: qp.get("industry") || (qp.get("category") ? (U.industry(qp.get("category"))?.id || MarineCore.industryForCategory(qp.get("category"))) : ""),
  category: U.industry(qp.get("category")) ? "" : qp.get("category") || "",
  supplier: qp.get("supplier") || "",
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
  for (const k of ["industry", "category", "subcategory", "supplier", "q"])
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
  const industry = U.industry(filters.industry);
  const groups = MarineData.categories.filter(c => !industry || industry.category_ids.includes(c.id));
  if (industry?.category_ids.length === 1) filters.category = industry.category_ids[0];
  const c = U.cat(filters.category);
  const supplierProducts = U.products().filter(p => !filters.industry || MarineCore.industryForCategory(p.category_id) === filters.industry || (p.supplier_id || p.supplier.id) === filters.supplier);
  const suppliers = [...new Map(supplierProducts.map(p => [p.supplier_id || p.supplier.id, { id: p.supplier_id || p.supplier.id, name: p.supplier.name }])).values()];
  const certs = filters.industry && filters.industry !== 'marine' ? ['ISO 9001', 'SGS', 'CE'] : ['CCS', 'ABS', 'DNV', 'ISO 9001', 'SGS', 'CE'];
  document.getElementById("filter-panel").innerHTML =
    `<div class="filter-top"><h3>${U.tr("filters")}</h3><div class="filter-top-actions"><button type="button" class="link-button" id="reset">${U.tr("reset")}</button><button type="button" class="filter-close" data-close-filters data-i18n-aria="closeFilters" aria-label="${U.t("closeFilters")}">×</button></div></div><div class="filter-group"><h4>${U.tr("industry")}</h4><select id="industry-filter" aria-label="${U.t("industry")}"><option value="">${U.t("all")}</option>${U.options(MarineData.industries, filters.industry)}</select></div>${!industry || groups.length > 1 ? `<div class="filter-group"><h4>${U.tr("productGroup")}</h4><select id="category" aria-label="${U.t("productGroup")}"><option value="">${U.t("all")}</option>${U.options(groups, filters.category)}</select></div>` : ''}${c ? `<div class="filter-group"><h4>${U.tr("productType")}</h4><select id="subcategory" aria-label="${U.t("productType")}"><option value="">${U.t("all")}</option>${U.options(c.subcategories, filters.subcategory)}</select></div>${c.fields.map(paramFilter).join("")}` : ""}<div class="filter-group"><h4>${U.tr("supplierInfo")}</h4><select id="supplier-filter" aria-label="${U.t("supplierInfo")}"><option value="">${U.t("all")}</option>${U.options(suppliers, filters.supplier)}</select></div><div class="filter-group"><h4>${U.tr("certs")}</h4>${certs.map(t => `<label class="check"><input data-cert type="checkbox" value="${t}" ${filters.cert.includes(t) ? 'checked' : ''}>${t}</label>`).join('')}</div><button type="button" class="button filter-apply" data-close-filters>${U.tr('showResults')}</button>`;
  document.getElementById("industry-filter").onchange = e => {
    filters.industry = e.target.value;
    filters.category = ''; filters.subcategory = ''; filters.supplier = ''; filters.params = {}; filters.cert = [];
    currentPage = 1; renderFilters(); renderResults();
  };
  document.getElementById("supplier-filter").onchange = e => { filters.supplier = e.target.value; currentPage = 1; renderResults(); };
  document.getElementById("reset").onclick = reset;
  document.getElementById("category")?.addEventListener("change", (e) => {
    filters.category = e.target.value;
    if (filters.category) filters.industry = MarineCore.industryForCategory(filters.category);
    filters.subcategory = "";
    filters.params = {};
    currentPage = 1;
    renderFilters();
    renderResults();
  });
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
  filters = { industry: "", category: "", subcategory: "", supplier: "", q: "", cert: [], params: {} };
  currentPage = 1;
  document.getElementById("catalog-search").value = "";
  document.getElementById("global-search").value = "";
  renderFilters();
  renderResults();
}
function renderActiveFilters() {
  const chips = [];
  const add = (key, label) => chips.push(`<button type="button" class="filter-chip" data-clear-filter="${U.e(key)}" aria-label="${U.e(U.t('removeFilter'))}: ${U.e(label)}"><span>${U.e(label)}</span><b aria-hidden="true">×</b></button>`);
  if (filters.industry) add('industry', U.industry(filters.industry)?.name[U.lang] || filters.industry);
  if (filters.category && filters.category !== filters.industry) add('category', U.cat(filters.category)?.name[U.lang] || filters.category);
  if (filters.subcategory) add('subcategory', U.cat(filters.category)?.subcategories.find(c=>c.id===filters.subcategory)?.name[U.lang] || filters.subcategory);
  if (filters.q) add('q', filters.q);
  if (filters.supplier) add('supplier', U.products().find(p=>(p.supplier_id || p.supplier.id)===filters.supplier)?.supplier.name[U.lang] || filters.supplier);
  filters.cert.forEach(cert=>add('cert:'+cert,cert));
  for (const [key,value] of Object.entries(filters.params)) {
    const field = U.cat(filters.category)?.fields.find(f=>f.key===key);
    if (!field) continue;
    const text = Array.isArray(value) ? value.map(v=>field.options?.find(o=>o.value===v)?.label[U.lang] || v).join(', ') : [value.min ?? '',value.max ?? ''].join(' – ');
    if ((Array.isArray(value) && value.length) || (!Array.isArray(value) && [value.min,value.max].some(bound=>bound !== undefined && bound !== null && bound !== ''))) add('param:'+key, field.label[U.lang] + ': ' + text);
  }
  const target = document.getElementById('active-filters');
  target.hidden = !chips.length;
  target.innerHTML = `<span class="filter-chip-label">${U.tr('selectedFilters')}</span>${chips.join('')}`;
  target.querySelectorAll('[data-clear-filter]').forEach(button=>button.onclick=()=>{
    const key = button.dataset.clearFilter;
    if (key==='industry') {filters.industry='';filters.category='';filters.subcategory='';filters.params={};filters.cert=[];filters.supplier='';}
    else if (key==='category') {filters.category='';filters.subcategory='';filters.params={};}
    else if (key.startsWith('cert:')) filters.cert=filters.cert.filter(c=>c!==key.slice(5));
    else if (key.startsWith('param:')) delete filters.params[key.slice(6)];
    else filters[key]='';
    if (key==='q') {document.getElementById('catalog-search').value='';document.getElementById('global-search').value='';}
    currentPage=1; renderFilters(); renderResults();
    document.getElementById('catalog-search').focus({preventScroll:true});
  });
}
function renderResults() {
  renderActiveFilters();
  const items = MarineCore.sortProducts(
    MarineCore.filterProducts(U.products(), filters),
    sort,
    filters.q,
  );
  const pages = Math.max(1, Math.ceil(items.length / size));
  currentPage = Math.min(currentPage, pages);
  document.getElementById("result-count").innerHTML =
    `<b>${items.length}</b> ${U.tr("results")}`;
  document.getElementById("results").innerHTML = items.length
    ? `<div class="product-grid">${items
        .slice((currentPage - 1) * size, currentPage * size)
        .map((p) => U.card(p))
        .join("")}</div>`
    : U.empty(
      filters.industry && !MarineCore.filterProducts(U.products(), { industry: filters.industry }).length ? 'noIndustryProducts' : 'noResults',
      'emptyIndustryHint',
      AccountUI.permissions().role === 'supplier' ? U.url('publish.html', { industry: filters.industry }) : U.url('rfq.html', { industry: filters.industry }),
      AccountUI.permissions().role === 'supplier' ? 'publish' : 'generalRfq'
    );
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
  `<div class="container"><div class="page-intro" id="catalog-top"><div class="eyebrow">${U.tr("marineMarketplace")}</div><h1>${U.tr("market")}</h1><p>${U.tr("featuredDesc")}</p></div><button type="button" class="button secondary mobile-filter-button" id="toggle-filters" aria-expanded="false">${U.tr("filters")} ☰</button><div class="catalog-layout"><aside class="filters" id="filter-panel"></aside><section><form id="catalog-form" class="header-search" style="max-width:none;margin-bottom:16px"><label class="sr-only" for="catalog-search">${U.tr("search")}</label><input id="catalog-search" data-i18n-placeholder="search" placeholder="${U.t("search")}" value="${U.e(filters.q)}"><button>${U.tr("searchButton")}</button></form><div class="catalog-toolbar"><span class="count" id="result-count" aria-live="polite"></span><label>${U.tr("sort")} <select id="sort"><option value="updated" data-i18n="updated"></option><option value="relevance" data-i18n="relevance"></option><option value="price" data-i18n="priceSort"></option></select></label></div><div class="active-filters" id="active-filters"></div><div id="results"></div><div class="pagination" id="pagination"></div></section></div></div>`;
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
