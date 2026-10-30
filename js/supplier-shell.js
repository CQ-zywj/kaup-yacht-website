/* Supplier console shell: shared navigation, scope helpers and media picker. */
(function (root) {
  const ITEMS = [
    ["consoleOverview", "seller-dashboard.html"],
    ["consoleProducts", "supplier.html"],
    ["consolePublish", "publish.html"],
    ["consoleBulk", "bulk-import.html"],
    ["consoleInbox", "inbox.html"],
    ["consoleCerts", "certifications.html"],
    ["consoleArticles", "supplier-articles.html"],
    ["consoleMedia", "media-library.html"],
    ["consoleCompany", "company.html"],
    ["consoleDecoration", "store-decoration.html"],
    ["consoleFinance", "finance.html"],
    ["consoleStorefront", "storefront.html"],
    ["consoleCustomers", "customers.html"],
  ];
  function accountsApi() {
    return (
      root.AccountUI || (typeof AccountUI !== "undefined" ? AccountUI : null)
    );
  }
  function currentId() {
    try {
      return root.MarineAccounts.readProfile(localStorage).id || "";
    } catch {
      return "";
    }
  }
  function storefrontUrl(id) {
    return root.MarineUI.url("storefront.html", { supplier_id: id || "" });
  }
  function scopedInquiries(rows, id) {
    return (rows || []).filter((row) => !row.supplier_id || row.supplier_id === id);
  }
  function statusBadge(status) {
    const key = root.SupplierCore.statusKey(status);
    return `<span class="status ${root.MarineUI.e(status)}">${root.MarineUI.tr(key)}</span>`;
  }
  function mount(active) {
    const accounts = accountsApi();
    if (!accounts || !accounts.requireSupplier()) return null;
    const user = accounts.getUser();
    let profile = {};
    try {
      profile = root.MarineAccounts.readProfile(localStorage) || {};
    } catch {
      profile = {};
    }
    const id = profile.id || user.id;
    try {
      root.SupplierCore.seedDemo(localStorage, id, profile);
    } catch {}
    const unread = scopedInquiries(root.MarineUI.read("rfq_drafts"), id).filter(
      (row) => row.status === "submitted",
    ).length;
    const verification = profile.verification_status || "pending";
    const main = document.getElementById("main");
    main.innerHTML = `<div class="container"><div class="supplier-console"><aside class="console-nav" aria-label="${root.MarineUI.t("identitySupplier")}"><h2>${root.MarineUI.tr("supplier")}</h2>${ITEMS.map(
      ([key, page]) => {
        const href =
          page === "storefront.html"
            ? storefrontUrl(id)
            : root.MarineUI.url(page);
        const badge =
          key === "consoleInbox" && unread
            ? `<span class="console-badge">${unread}</span>`
            : "";
        const current = key === active ? ' aria-current="page"' : "";
        return `<a href="${href}"${current}><span>${root.MarineUI.tr(key)}</span>${badge}</a>`;
      },
    ).join("")}<div class="console-sep"></div><a href="${root.MarineUI.url("index.html")}"><span>${root.MarineUI.tr("home")}</span></a><button type="button" class="link-button" id="console-logout">${root.MarineUI.tr("consoleLogout")}</button></aside><div class="console-main"><div class="console-context"><div><strong>${root.MarineUI.e(profile.company || user.company || "")}</strong> <span class="status ${verification === "verified" ? "verified" : "pending"}">${root.MarineUI.tr(verification === "verified" ? "verifiedStatus" : verification === "rejected" ? "rejectedStatus" : "pendingStatus")}</span></div><span class="inline-note">${root.MarineUI.tr("consoleDemoNote")}</span></div><div id="console-body"></div></div></div></div>`;
    document.getElementById("console-logout").onclick = () => {
      try {
        localStorage.removeItem("current_user");
        localStorage.removeItem("supplier_profile");
        location.href = root.MarineUI.url("index.html");
      } catch {
        root.MarineUI.notice("storageError");
      }
    };
    root.MarineUI.translate();
    return {
      body: document.getElementById("console-body"),
      profile,
      id,
      user,
      unread,
    };
  }
  function mediaPicker(options = {}) {
    const type = options.type || "image";
    const multiple = !!options.multiple;
    const rows = root.SupplierCore.media(localStorage, currentId());
    const dialog = document.createElement("dialog");
    dialog.className = "picker-dialog";
    dialog.innerHTML = `<div class="drawer-header"><h2>${root.MarineUI.tr(options.titleKey || "productPickMedia")}</h2><button type="button" class="button secondary" data-close>${root.MarineUI.tr("close")}</button></div>${root.SupplierCore.pickerHtml(rows, type)}<div class="form-actions"><button type="button" class="button" data-confirm ${rows.length ? "" : "disabled"}>${root.MarineUI.tr("mediaPickConfirm")}</button></div>`;
    document.body.append(dialog);
    const selected = new Set();
    dialog.querySelectorAll("[data-pick-media]").forEach((button) => {
      button.onclick = () => {
        const id = button.dataset.pickMedia;
        if (multiple) {
          if (selected.has(id)) selected.delete(id);
          else selected.add(id);
          button.setAttribute("aria-pressed", String(selected.has(id)));
        } else {
          dialog
            .querySelectorAll("[data-pick-media]")
            .forEach((node) =>
              node.setAttribute(
                "aria-pressed",
                String(node.dataset.pickMedia === id),
              ),
            );
          selected.clear();
          selected.add(id);
        }
      };
    });
    dialog.querySelector("[data-close]").onclick = () => {
      dialog.close();
      dialog.remove();
    };
    dialog.querySelector("[data-confirm]").onclick = () => {
      const urls = [...selected]
        .map(
          (id) =>
            rows.find((row) => row.id === id)?.url ||
            rows.find((row) => row.id === id)?.name ||
            "",
        )
        .filter(Boolean);
      options.onPick?.(multiple ? urls : urls[0] || "");
      dialog.close();
      dialog.remove();
    };
    root.MarineUI.translate();
    dialog.showModal();
  }
  root.SupplierShell = {
    ITEMS,
    currentId,
    storefrontUrl,
    scopedInquiries,
    statusBadge,
    mount,
    mediaPicker,
  };
})(typeof window !== "undefined" ? window : globalThis);
