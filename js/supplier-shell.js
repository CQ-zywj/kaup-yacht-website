/* Supplier console shell: shared navigation, scope helpers and media picker. */
(function (root) {
  /* 侧栏按「每天要做的事」分 7 组，而不是按「系统有几个模块」平铺 12 项。
     单项组直接是一级链接（询盘、资质、客户都只有一个页面）；
     多项组折叠，默认只展开当前页所在组，避免每次都要扫全表。 */
  const GROUPS = [
    { key: "consoleOverview", items: [["consoleOverview", "seller-dashboard.html"]] },
    {
      key: "navGroupProducts",
      items: [
        ["consoleProducts", "supplier.html"],
        ["consolePublish", "publish.html"],
      ],
    },
    { key: "consoleInbox", items: [["consoleInbox", "inbox.html"]] },
    {
      key: "navGroupStore",
      items: [
        ["myStore", "company.html"],
        ["consoleStorefront", "storefront.html"],
        ["consoleFinance", "finance.html"],
      ],
    },
    { key: "consoleCerts", items: [["consoleCerts", "certifications.html"]] },
    {
      key: "navGroupContent",
      items: [
        ["consoleArticles", "supplier-articles.html"],
        ["consoleMedia", "media-library.html"],
      ],
    },
    { key: "consoleCustomers", items: [["consoleCustomers", "customers.html"]] },
  ];
  /* 不在导航里、但仍属于某组的页面（批量导入已降为「发布商品」页内入口），
     让它的所在组依然展开，只是不高亮任何子项。 */
  const GROUP_ALIAS = { consoleBulk: "navGroupProducts" };
  /* 扁平视图保留给需要整表的调用方（面包屑、冒烟检查等），顺序与侧栏一致。 */
  const ITEMS = GROUPS.flatMap((group) => group.items);
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
  /* 未读口径与收件箱一致：公开 RFQ 主帖不进供应商视图，按买家未读消息计数。 */
  function unreadInquiries(rows) {
    const visible = (rows || []).filter((row) =>
      row.supplier_id ? row.supplier_id === currentId() : row.mode !== "rfq",
    );
    if (root.MarineMessages)
      return root.MarineMessages.unreadTotal(visible, "supplier");
    return visible.reduce(
      (sum, row) =>
        sum +
        (row.messages || []).filter(
          (m) => m.from === "buyer" && !m.read_at && m.type !== "system",
        ).length,
      0,
    );
  }
  function statusBadge(status) {
    const key = root.SupplierCore.statusKey(status);
    return `<span class="status ${root.MarineUI.e(status)}">${root.MarineUI.tr(key)}</span>`;
  }
  function navLink([key, page], active, id, unread) {
    const ui = root.MarineUI;
    const href = page === "storefront.html" ? storefrontUrl(id) : ui.url(page);
    const badge =
      key === "consoleInbox" && unread
        ? `<span class="console-badge">${unread}</span>`
        : "";
    const current = key === active ? ' aria-current="page"' : "";
    return `<a href="${href}"${current}><span>${ui.tr(key)}</span>${badge}</a>`;
  }
  function navMarkup(active, id, unread) {
    const ui = root.MarineUI;
    return GROUPS.map((group, index) => {
      if (group.items.length === 1) return navLink(group.items[0], active, id, unread);
      const hasItem = group.items.some(([key]) => key === active);
      const current = hasItem || GROUP_ALIAS[active] === group.key;
      const unreadInGroup = group.items.some(([key]) => key === "consoleInbox" && unread);
      return `<div class="console-group"${current ? " data-open" : ""}${hasItem ? " data-current" : ""}><button type="button" class="console-group-toggle" aria-expanded="${current}" aria-controls="nav-group-${index}"><span>${ui.tr(group.key)}</span>${unreadInGroup ? `<span class="console-badge">${unread}</span>` : ""}<i class="console-caret" aria-hidden="true"></i></button><div class="console-group-items" id="nav-group-${index}">${group.items.map((item) => navLink(item, active, id, unread)).join("")}</div></div>`;
    }).join("");
  }
  /* 展开状态不做持久化：进入任一页面时只展开当前组，符合「先看我在哪、再挑去哪」。 */
  function bindGroups(nav) {
    if (!nav) return;
    nav.querySelectorAll(".console-group-toggle").forEach((button) => {
      button.onclick = () => {
        const group = button.closest(".console-group");
        button.setAttribute("aria-expanded", String(group.toggleAttribute("data-open")));
      };
    });
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
    const unread = unreadInquiries(root.MarineUI.read("rfq_drafts"));
    const verification = profile.verification_status || "pending";
    const main = document.getElementById("main");
    main.innerHTML = `<div class="container"><div class="supplier-console"><aside class="console-nav" aria-label="${root.MarineUI.t("identitySupplier")}"><h2>${root.MarineUI.tr("supplier")}</h2>${navMarkup(active, id, unread)}<div class="console-sep"></div><a href="${root.MarineUI.url("index.html")}"><span>${root.MarineUI.tr("home")}</span></a><button type="button" class="link-button" id="console-logout">${root.MarineUI.tr("consoleLogout")}</button></aside><div class="console-main"><div class="console-context"><div><strong>${root.MarineUI.e(profile.company || user.company || "")}</strong> <span class="status ${verification === "verified" ? "verified" : "pending"}">${root.MarineUI.tr(verification === "verified" ? "verifiedStatus" : verification === "rejected" ? "rejectedStatus" : "pendingStatus")}</span></div><span class="inline-note">${root.MarineUI.tr("consoleDemoNote")}</span></div><div id="console-body"></div></div></div></div>`;
    bindGroups(main.querySelector(".console-nav"));
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
    GROUPS,
    ITEMS,
    currentId,
    storefrontUrl,
    scopedInquiries,
    unreadInquiries,
    statusBadge,
    mount,
    mediaPicker,
  };
})(typeof window !== "undefined" ? window : globalThis);
