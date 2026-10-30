/* 我的商品：状态机（草稿 / 上架中 / 已下架 / 未通过）—— 二值机审，无待审核态 */
(function () {
  const shell = SupplierShell.mount("consoleProducts");
  if (!shell) return;
  const { body, id } = shell;
  const state = { status: "", q: "" };
  const TABS = ["", "active", "inactive", "draft", "rejected"];
  /* 草稿与未通过都不能直接上架：必须回发布页重新提交并过机审 */
  const LOCKED = ["draft", "rejected"];

  function all() {
    const seeds = (MarineData.products || [])
      .filter((p) => (p.supplier_id || p.supplier?.id) === id)
      .map((p) => ({
        ...p,
        _status: SupplierCore.normalizeProductStatus(p),
        _seed: true,
      }));
    const drafts = U.read("draft_products")
      .filter((p) => !p.supplier_id || p.supplier_id === id)
      .map((p) => ({
        ...p,
        _status: SupplierCore.normalizeProductStatus(p),
        _seed: false,
      }));
    const merged = new Map(seeds.map((p) => [p.id, p]));
    drafts.forEach((p) => merged.set(p.id, p));
    return [...merged.values()].sort(
      (a, b) =>
        Date.parse(b.updated_at || b.created_at || 0) -
        Date.parse(a.updated_at || a.created_at || 0),
    );
  }
  function title(p) {
    return U.bi({
      zh: p.i18n?.zh?.title || MarineI18n.draft[0],
      en: p.i18n?.en?.title || MarineI18n.draft[1],
    });
  }
  function haystack(p) {
    return [
      p.i18n?.zh?.title,
      p.i18n?.en?.title,
      U.cat(p.category_id)?.name?.zh,
      U.cat(p.category_id)?.name?.en,
      p.id,
    ]
      .map((v) => String(v || "").toLowerCase())
      .join(" ");
  }
  function matches(p) {
    if (state.status && p._status !== state.status) return false;
    const needle = state.q.trim().toLowerCase();
    return !needle || haystack(p).includes(needle);
  }

  function toggleStatus(pid) {
    const rows = U.read("draft_products");
    const index = rows.findIndex((r) => r.id === pid);
    if (index < 0) return;
    const now = SupplierCore.normalizeProductStatus(rows[index]);
    if (LOCKED.includes(now)) return;
    rows[index] = {
      ...rows[index],
      status: now === "active" ? "inactive" : "active",
      updated_at: new Date().toISOString(),
    };
    if (U.write("draft_products", rows)) {
      render();
      U.notice("productStatusUpdated");
    }
  }
  function removeProduct(pid) {
    if (!window.confirm(U.t("productDeleteConfirm"))) return;
    const rows = U.read("draft_products").filter((r) => r.id !== pid);
    if (U.write("draft_products", rows)) render();
  }

  function card(p) {
    const st = p._status;
    const cat = U.cat(p.category_id);
    const price = `$${Number(p.trade?.price_min || 0).toLocaleString()} – $${Number(p.trade?.price_max || 0).toLocaleString()}`;
    const meta = [price, `MOQ ${U.e(p.trade?.moq || "—")}`]
      .concat(p.updated_at ? [U.e(U.date(p.updated_at))] : [])
      .join(" · ");
    const note =
      st === "rejected"
        ? `<p class="warning">${U.tr("productRejectedNote")}</p>`
        : "";
    const actions = p._seed
      ? `<span class="badge muted-badge">${U.tr("demo")}</span><a class="link-button" href="${U.url("product.html", { id: p.id })}">${U.tr("preview")}</a>`
      : `<a class="link-button" href="${U.url("publish.html", { draft: p.id })}">${U.tr("edit")}</a>${st === "active" || st === "inactive" ? `<button type="button" class="link-button" data-toggle="${U.e(p.id)}">${U.tr(st === "active" ? "productSwitchToInactive" : "productSwitchToActive")}</button>` : ""}${st === "active" ? `<a class="link-button" href="${U.url("product.html", { id: p.id })}">${U.tr("preview")}</a>` : ""}<button type="button" class="link-button danger" data-delete="${U.e(p.id)}">${U.tr("delete")}</button>`;
    return `<article class="product-admin-card"><img src="${U.e(U.img(p))}" alt=""><div class="product-admin-body"><div class="product-admin-top"><span class="status ${st}">${U.tr(SupplierCore.statusKey(st))}</span><span class="muted">${cat ? U.bi(cat.name) : ""}</span></div><h3>${title(p)}</h3><p class="muted">${meta}</p>${note}<div class="mini-actions">${actions}</div></div></article>`;
  }

  function render() {
    const rows = all();
    const list = rows.filter(matches);
    body.innerHTML = `<div class="console-head"><div><h2>${U.tr("myProducts")}</h2><p class="muted">${U.tr("productStatusHint")}</p></div><div class="console-actions"><a class="button secondary" href="${U.url("bulk-import.html")}">${U.tr("consoleBulk")}</a><a class="button" href="${U.url("publish.html")}">+ ${U.tr("consolePublish")}</a></div></div><div class="cert-tabs">${TABS.map((s) => `<button type="button" class="${state.status === s ? "active" : ""}" data-tab="${s}">${U.tr(s ? SupplierCore.statusKey(s) : "productFilterAll")} <b>${s ? rows.filter((p) => p._status === s).length : rows.length}</b></button>`).join("")}</div><div class="inbox-toolbar"><div class="field"><label for="product-search">${U.tr("search")}</label><input id="product-search" type="search" value="${U.e(state.q)}" placeholder="${U.t("searchPlaceholder")}"></div></div>${list.length ? `<div class="product-admin-grid">${list.map(card).join("")}</div>` : U.empty("productEmptyFilter", "startPublish", "publish.html", "consolePublish")}`;
    body.querySelectorAll("[data-tab]").forEach((button) => {
      button.onclick = () => {
        state.status = button.dataset.tab;
        render();
      };
    });
    const input = document.getElementById("product-search");
    if (input)
      input.oninput = (event) => {
        state.q = event.target.value;
        render();
        const next = document.getElementById("product-search");
        if (next) {
          next.focus();
          next.setSelectionRange(state.q.length, state.q.length);
        }
      };
    body
      .querySelectorAll("[data-toggle]")
      .forEach((button) => (button.onclick = () => toggleStatus(button.dataset.toggle)));
    body
      .querySelectorAll("[data-delete]")
      .forEach((button) => (button.onclick = () => removeProduct(button.dataset.delete)));
    U.translate();
  }

  render();
  window.addEventListener("storage", (event) => {
    if (["draft_products", "current_user", "supplier_profile"].includes(event.key))
      render();
  });
  window.addEventListener("focus", render);
  window.addEventListener("languagechange", render);
})();
