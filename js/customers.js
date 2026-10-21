(function () {
  const shell = SupplierShell.mount("consoleCustomers");
  if (!shell) return;
  const { body, id } = shell;
  const state = { q: "" };
  function rows() {
    return SupplierShell.scopedInquiries(U.read("rfq_drafts"), id);
  }
  function groups() {
    const map = new Map();
    for (const row of rows()) {
      const key = `${row.buyer?.company || ""}|${row.buyer?.country || ""}`;
      if (!map.has(key))
        map.set(key, {
          key,
          company: row.buyer?.company || "—",
          country: row.buyer?.country || "",
          rows: [],
        });
      map.get(key).rows.push(row);
    }
    return [...map.values()]
      .map((group) => ({
        ...group,
        last: group.rows.reduce(
          (latest, row) =>
            Date.parse(row.created_at) > Date.parse(latest.created_at) ? row : latest,
          group.rows[0],
        ),
        replied: group.rows.filter((row) => row.status === "replied").length,
      }))
      .sort((a, b) => Date.parse(b.last.created_at) - Date.parse(a.last.created_at));
  }
  function activity(group) {
    const seed = [...group.company].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return {
      views: (seed % 17) + group.rows.length * 4,
      searches: (seed % 7) + 2,
    };
  }
  function card(group) {
    return `<button type="button" class="customer-card" data-customer="${U.e(group.key)}"><span class="avatar">${U.e(group.company.slice(0, 1))}</span><h3>${U.e(group.company)}</h3><p class="muted">${U.e(group.country)}</p><dl><dt>${U.tr("customerInquiries")}</dt><dd>${group.rows.length}</dd><dt>${U.tr("customerReplies")}</dt><dd>${group.replied}</dd><dt>${U.tr("customerLast")}</dt><dd>${U.e(U.date(group.last.created_at))}</dd></dl></button>`;
  }
  function renderGrid() {
    const needle = state.q.trim().toLowerCase();
    const list = groups().filter(
      (group) =>
        !needle ||
        group.company.toLowerCase().includes(needle) ||
        group.country.toLowerCase().includes(needle),
    );
    const target = document.getElementById("customer-grid");
    target.innerHTML = list.length
      ? list.map(card).join("")
      : U.empty("customerEmpty", "customerEmptyHint", "inbox.html", "customerGoInbox");
    U.translate();
  }
  function openCustomer(key) {
    const group = groups().find((item) => item.key === key);
    if (!group) return;
    const dialog = document.getElementById("customer-dialog");
    const stats = activity(group);
    dialog.innerHTML = `<div class="drawer-header"><h2>${U.tr("customerDetail")}</h2><button type="button" class="button secondary" data-close>${U.tr("close")}</button></div><h3 style="margin-top:0">${U.e(group.company)}</h3><p class="muted">${U.e(group.country)} · ${U.tr("customerSince")} ${U.e(
      U.date(group.rows[group.rows.length - 1].created_at).split(",")[0],
    )}</p><div class="cert-row" style="margin:14px 0"><span class="badge">${U.tr("customerInquiries")} ${group.rows.length}</span><span class="badge">${U.tr("customerReplies")} ${group.replied}</span></div><table class="console-table"><thead><tr><th>${U.tr("product")}</th><th>${U.tr("quantity")}</th><th>${U.tr("sentAt")}</th><th>${U.tr("status")}</th></tr></thead><tbody>${group.rows
      .slice()
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
      .map((row) => {
        const product = row.product_id ? U.product(row.product_id) : null;
        return `<tr><td>${product ? U.bi({ zh: product.i18n.zh.title, en: product.i18n.en.title }) : U.tr("publicInquiry")}</td><td>${U.e(row.quantity)}</td><td>${U.e(U.date(row.created_at))}</td><td><span class="status ${U.e(row.status)}">${U.tr(row.status)}</span></td></tr>`;
      })
      .join("")}</tbody></table><h3>${U.tr("customerActivity")}</h3><div class="cert-row"><span class="badge muted-badge">${U.tr("demo")}</span><span class="badge">${U.tr("customerViews")} ${stats.views}</span><span class="badge">${U.tr("customerSearches")} ${stats.searches}</span></div><p class="inline-note">${U.tr("leadHint")}</p><div class="form-actions"><a class="button" href="${U.url("inbox.html")}">${U.tr("customerGoInbox")}</a></div>`;
    dialog.querySelector("[data-close]").onclick = () => dialog.close();
    dialog.showModal();
    U.translate();
  }
  body.innerHTML = `<div class="page-intro"><div class="eyebrow">${U.tr("identitySupplier")}</div><h1>${U.tr("customersTitle")}</h1><p>${U.tr("customersDesc")}</p></div><div class="panel"><div class="section-head" style="margin-bottom:14px"><div><strong>${U.tr("customersTitle")}</strong><p class="inline-note">${U.tr("customerEmptyHint")}</p></div><div class="field" style="max-width:260px"><label class="sr-only" for="customer-search">${U.tr("customerSearch")}</label><input id="customer-search" type="search" placeholder="${U.t("customerSearch")}"></div></div><div class="customer-grid" id="customer-grid"></div></div><dialog id="customer-dialog" aria-label="${U.t("customerDetail")}"></dialog>`;
  document.getElementById("customer-search").oninput = (event) => {
    state.q = event.target.value;
    renderGrid();
  };
  document.getElementById("customer-grid").addEventListener("click", (event) => {
    const target = event.target.closest("[data-customer]");
    if (target) openCustomer(target.dataset.customer);
  });
  renderGrid();
  window.addEventListener("storage", (event) => {
    if (["rfq_drafts", "current_user"].includes(event.key)) renderGrid();
  });
  window.addEventListener("languagechange", () => {
    renderGrid();
  });
})();
