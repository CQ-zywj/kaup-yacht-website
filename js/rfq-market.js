/* 公开 RFQ 市场：买家发布需求，供应商匿名报价，各家报价互不可见 */
(function () {
  if (typeof window === "undefined") return;
  const MM = window.MarineMessages;
  const main = document.getElementById("main");
  if (!MM || !main) return;

  /* 市场只回答一个问题：「有什么新机会」。买家不在这里看自己的发布（那是 my-rfq），
     供应商报过的需求留在列表里只打 is-quoted 标记，后续沟通统一去询盘收件箱。 */
  const state = { q: "" };

  function user() {
    return AccountUI.getUser();
  }
  function role() {
    return user()?.role || "guest";
  }
  function profile() {
    try {
      return MarineAccounts.readProfile(localStorage) || {};
    } catch {
      return {};
    }
  }
  function supplierId() {
    const me = user();
    if (me?.role !== "supplier") return "";
    return profile().id || me.id || "";
  }
  function supplierName() {
    const p = profile();
    return p.company || p.contact || "";
  }
  function allRows() {
    let rows = [];
    try {
      rows = U.read("rfq_drafts");
    } catch {
      rows = [];
    }
    let migrated = false;
    const normalized = rows.map((row) => {
      if (!Array.isArray(row.messages)) migrated = true;
      return MM.normalize(row);
    });
    if (migrated) {
      try {
        U.write("rfq_drafts", normalized);
      } catch {}
    }
    return normalized;
  }
  function masters(rows = allRows()) {
    return rows
      .filter((row) => row.mode === "rfq" && !row.supplier_id)
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  }
  function myQuoteOf(masterId, rows = allRows()) {
    const id = supplierId();
    if (!id) return null;
    return (
      rows.find((row) => row.public_of === masterId && row.supplier_id === id) ||
      null
    );
  }
  function relTime(value) {
    const diff = Date.now() - Date.parse(value || 0);
    if (!Number.isFinite(diff)) return "—";
    const minutes = Math.round(diff / 60000);
    if (minutes < 60) return Math.max(1, minutes) + " min";
    const hours = Math.round(minutes / 60);
    return hours < 24 ? hours + " h" : Math.round(hours / 24) + " d";
  }
  function excerpt(text, max = 120) {
    const value = String(text || "").replace(/\s+/g, " ").trim();
    return value.length > max ? value.slice(0, max) + "…" : value;
  }
  function titleOf(row) {
    const category = U.cat(row.category_id);
    const sub = category?.subcategories.find((c) => c.id === row.subcategory_id);
    return [category?.name, sub?.name].filter(Boolean);
  }
  function titleHtml(row) {
    const parts = titleOf(row);
    return parts.length
      ? parts.map((name) => U.bi(name)).join(" · ")
      : U.tr("generalRfq");
  }
  function searchText(row) {
    const parts = titleOf(row).flatMap((name) => [name.zh, name.en]);
    return [
      ...parts,
      row.buyer?.company,
      row.buyer?.country,
      row.target_country,
      row.message,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }
  function filtered(list) {
    const q = state.q.trim().toLowerCase();
    return q ? list.filter((row) => searchText(row).includes(q)) : list;
  }

  function intro(eyebrow) {
    return `<div class="page-intro"><div class="eyebrow">${eyebrow}</div><h1>${U.tr("rfqMarket")}</h1><p>${U.tr("rfqMarketDesc")}</p></div>`;
  }
  function metrics(items) {
    return `<div class="metrics">${items
      .map(
        (item) =>
          `<div class="metric"><strong id="${item.id}">0</strong><span>${U.tr(item.key)}</span></div>`,
      )
      .join("")}</div>`;
  }
  function render() {
    const who = role();
    if (who === "supplier") renderSupplier();
    else if (who === "buyer") renderBuyer();
    else renderGuest();
  }

  function renderGuest() {
    main.innerHTML = `<div class="container section">${intro(U.tr("rfqEyebrow"))}<div class="empty"><div class="empty-icon">⌁</div><h2>${U.tr("rfqMarket")}</h2><p>${U.tr("marketLoginHint")}</p><div class="actions"><a class="button" href="${U.url("buyer-auth.html", { return: "rfq-market.html" })}">${U.tr("buyerSignIn")}</a><a class="button secondary" href="${U.url("supplier-auth.html", { return: "rfq-market.html" })}">${U.tr("supplierSignIn")}</a></div></div></div>`;
    U.translate();
  }

  /* 买家没有「市场」这一站：自己发出的每一条需求（含公开 RFQ 主帖）与收到的报价
     都在 my-rfq.html 里，市场对买家只是同一批数据的第二个副本，因此买家进来直接接管。 */
  function renderBuyer() {
    location.replace(U.url("my-rfq.html"));
  }

  function renderSupplier() {
    const rows = allRows();
    const open = masters(rows).filter(
      (row) => !["accepted", "closed"].includes(row.status),
    );
    const quoted = rows.filter(
      (row) => row.public_of && row.supplier_id === supplierId(),
    );
    main.innerHTML = `<div class="container section rfq-market-page">${intro(U.tr("supplierMode"))}${metrics([
      { id: "mk-a", key: "rfqOpen" },
      { id: "mk-b", key: "rfqAlreadyQuoted" },
      { id: "mk-c", key: "statusAccepted" },
    ])}<div class="market-toolbar"><div class="field"><label class="sr-only" for="market-search">${U.tr("search")}</label><input id="market-search" type="search" value="${U.e(state.q)}" placeholder="${U.t("marketSearch")}"></div><a class="button secondary" href="${U.url("inbox.html")}">${U.tr("inbox")} →</a></div><div class="market-grid" id="market-grid" aria-live="polite"></div><p class="inline-note">${U.tr("contactHiddenHint")}</p></div>`;
    document.getElementById("mk-a").textContent = open.length;
    document.getElementById("mk-b").textContent = quoted.length;
    document.getElementById("mk-c").textContent = quoted.filter(
      (row) => row.status === "accepted",
    ).length;
    const search = document.getElementById("market-search");
    search.oninput = () => {
      state.q = search.value;
      paintSupplier(rows, open);
    };
    paintSupplier(rows, open);
    U.translate();
  }

  function paintSupplier(rows, open) {
    const grid = document.getElementById("market-grid");
    if (!grid) return;
    const shown = filtered(open);
    grid.innerHTML = shown.length
      ? shown.map((row) => supplierCard(row, rows)).join("")
      : U.empty("rfqEmptyMarket", "rfqMarketDesc", "rfq.html", "generalRfq");
    grid.querySelectorAll("[data-quote]").forEach((button) => {
      button.onclick = () => openDialog(button.dataset.quote);
    });
    U.translate();
  }

  function supplierCard(row, rows) {
    const mine = myQuoteOf(row.id, rows);
    const quote = mine?.quotes?.[0]?.quote;
    const facts = [
      ["quantity", row.quantity],
      ["targetCountry", row.target_country],
      ["delivery", row.expected_delivery],
      ["terms", row.incoterms],
    ];
    return `<article class="market-card ${mine ? "is-quoted" : ""}"><div class="market-card-head"><h3>${titleHtml(row)}</h3><span class="status ${U.e(mine ? mine.status : row.status)}">${U.tr(MM.statusKey(mine ? mine.status : row.status))}</span></div><dl class="market-facts">${facts.map(([key, value]) => `<div><dt>${U.tr(key)}</dt><dd>${U.e(value ?? "—") || "—"}</dd></div>`).join("")}</dl><p class="market-message">${U.e(excerpt(row.message))}</p><div class="market-foot"><span class="chip">${U.tr("rfqBuyerHidden")}</span><span class="muted">${U.e(relTime(row.created_at))}</span><span class="market-buyer">${U.e(row.buyer?.country || "—")}</span>${
      mine
        ? `<span class="market-quoted"><span class="status quoted">${U.tr("rfqAlreadyQuoted")}</span>${quote ? `<b>${U.e(quote.currency || "USD")} ${Number(quote.price || 0).toLocaleString()}</b>` : ""}</span>`
        : `<button type="button" class="button" data-quote="${U.e(row.id)}">${U.tr("rfqQuoteAction")}</button>`
    }</div></article>`;
  }

  function openDialog(masterId) {
    const rows = allRows();
    const master = masters(rows).find((row) => row.id === masterId);
    const dialog = document.getElementById("rfq-quote-dialog");
    if (!master || !dialog) return;
    const facts = [
      ["quantity", master.quantity],
      ["targetCountry", master.target_country],
      ["delivery", master.expected_delivery],
      ["terms", master.incoterms],
    ];
    dialog.innerHTML = `<div class="drawer-header"><h2>${U.tr("quoteForm")}</h2><button type="button" class="button secondary" id="close-market-quote">${U.tr("close")}</button></div><div class="market-quote-context"><h3>${titleHtml(master)}</h3><p class="muted">${U.e(excerpt(master.message, 160))}</p><dl class="market-facts">${facts.map(([key, value]) => `<div><dt>${U.tr(key)}</dt><dd>${U.e(value ?? "—") || "—"}</dd></div>`).join("")}</dl><p class="inline-note">${U.tr("rfqBuyerHidden")} · ${U.tr("contactHiddenHint")}</p></div><form id="market-quote-form" novalidate class="panel"><div class="form-grid"><div class="field"><label for="mq-price">${U.tr("quotePrice")} <b>*</b></label><input id="mq-price" name="price" type="number" step="any" min="0.01" required><small class="error" data-error="price"></small></div><div class="field"><label for="mq-moq">${U.tr("quoteMoq")} <b>*</b></label><input id="mq-moq" name="moq" type="number" step="any" min="1" required><small class="error" data-error="moq"></small></div><div class="field"><label for="mq-lead">${U.tr("quoteLeadTime")}</label><input id="mq-lead" name="lead_time" type="number" step="1" min="1" value="30"></div><div class="field"><label for="mq-terms">${U.tr("terms")}</label><select id="mq-terms" name="incoterms"><option>EXW</option><option selected>FOB</option><option>CIF</option></select></div><div class="field"><label for="mq-valid">${U.tr("quoteValidUntil")}</label><input id="mq-valid" name="valid_until" type="date"></div><div class="field"><label for="mq-note">${U.tr("quoteNote")}</label><textarea id="mq-note" name="note" rows="3"></textarea></div></div><div class="form-actions"><button class="button secondary" type="button" id="cancel-market-quote">${U.tr("cancel")}</button><button class="button" type="submit">${U.tr("quoteSendAction")} →</button></div></form>`;
    document.getElementById("close-market-quote").onclick = () => dialog.close();
    document.getElementById("cancel-market-quote").onclick = () =>
      dialog.close();
    document.getElementById("market-quote-form").onsubmit = (event) => {
      event.preventDefault();
      submitQuote(master, event.target, dialog);
    };
    if (!dialog.open) dialog.showModal();
    U.translate();
  }

  function submitQuote(master, form, dialog) {
    const price = Number(form.elements.price.value);
    const moq = Number(form.elements.moq.value);
    if (
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isFinite(moq) ||
      moq <= 0
    ) {
      U.notice("quoteError");
      return;
    }
    const id = supplierId();
    if (!id) {
      U.notice("marketLoginHint", "", "supplier-auth.html", "supplierSignIn");
      return;
    }
    const rows = allRows();
    if (myQuoteOf(master.id, rows)) {
      dialog.close();
      U.notice("rfqAlreadyQuoted");
      return;
    }
    const quote = {
      price,
      moq,
      lead_time: Number(form.elements.lead_time.value) || 30,
      incoterms: form.elements.incoterms.value,
      valid_until: form.elements.valid_until.value,
      currency: "USD",
      unit: "unit",
    };
    let thread;
    try {
      thread = MM.forkForSupplier(
        master,
        id,
        supplierName(),
        quote,
        form.elements.note.value,
      );
    } catch {
      U.notice("quoteError");
      return;
    }
    rows.push(thread);
    if (U.write("rfq_drafts", rows)) {
      dialog.close();
      renderSupplier();
      U.notice("marketQuoteSent", "emailNotifyHint", "inbox.html", "inbox");
    }
  }

  render();
  window.addEventListener("storage", (event) => {
    if (["rfq_drafts", "current_user", "accounts"].includes(event.key))
      render();
  });
  window.addEventListener("focus", render);
  window.addEventListener("languagechange", render);
})();
