/* 买家我的询盘：多轮会话、结构化报价对比、接受报价 */
(function (root) {
  const BuyerRfq = {
    select(records, user, state = {}) {
      if (user?.role !== "buyer" || typeof user.id !== "string" || !user.id.trim())
        return [];
      return records
        .filter(
          (r) =>
            r.buyer?.id === user.id &&
            (!state.status || r.status === state.status),
        )
        .sort(
          (a, b) =>
            (state.sort === "oldest" ? 1 : -1) *
            (Date.parse(a.created_at) - Date.parse(b.created_at)),
        );
    },
  };
  root.MarineBuyerRfq = BuyerRfq;
  if (typeof module !== "undefined") module.exports = BuyerRfq;
  if (typeof document === "undefined") return;

  const MM = root.MarineMessages;
  const state = { status: "", sort: "newest" };
  let selectedId = null;
  const main = document.getElementById("main");

  function allThreads() {
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
  function save(list) {
    return U.write("rfq_drafts", list);
  }
  function patch(thread) {
    const list = allThreads();
    const index = list.findIndex((row) => row.id === thread.id);
    if (index < 0) return false;
    list[index] = thread;
    return save(list);
  }
  function user() {
    return MarineAccounts.user(localStorage);
  }
  /** 买家可见：一对一询盘 + 自己发布的公开 RFQ 主帖（不含各家的报价线程）。 */
  function owned() {
    const me = user();
    if (me?.role !== "buyer" || !me.id) return null;
    return BuyerRfq.select(allThreads(), me, {}).filter(
      (row) => !row.supplier_id || row.mode === "inquiry",
    );
  }
  function quotesOf(masterId) {
    return MM.relatedQuotes(allThreads(), masterId);
  }
  function closeDrawer() {
    const drawer = document.getElementById("buyer-inquiry-drawer");
    if (drawer?.open) drawer.close();
    selectedId = null;
  }
  function showLogin() {
    closeDrawer();
    main.innerHTML = `<div class="container section">${U.empty("buyerTrackingTitle", "buyerTrackingAuthHint", "buyer-auth.html", "buyerSignIn")}</div>`;
    main.querySelector(".empty a").href = U.url("buyer-auth.html", {
      return: location.pathname.split("/").pop() + location.search,
    });
    U.translate();
  }
  function showStorageError() {
    closeDrawer();
    main.innerHTML = `<div class="container section">${U.empty("storageError", "inquiryStorageHint")}<button class="button secondary" type="button" id="retry-inquiries">${U.tr("retry")}</button></div>`;
    document.getElementById("retry-inquiries").onclick = refresh;
    U.translate();
  }

  function buildPage() {
    main.innerHTML = `<div class="container buyer-inquiries"><div class="page-intro"><div class="eyebrow">${U.tr("buyerMode")}</div><h1>${U.tr("myInquiries")}</h1><p>${U.tr("myInquiriesDesc")}</p></div><div class="metrics"><div class="metric"><strong id="buyer-total">0</strong><span>${U.tr("allInquiries")}</span></div><div class="metric"><strong id="buyer-quoted">0</strong><span>${U.tr("rfqQuotes")}</span></div><div class="metric"><strong id="buyer-accepted">0</strong><span>${U.tr("statusAccepted")}</span></div></div><div class="panel buyer-inquiry-toolbar"><div class="field"><label for="buyer-status-filter">${U.tr("status")}</label><select id="buyer-status-filter"><option value="" data-i18n="all">${U.t("all")}</option>${MM.STATUSES.map((value) => `<option value="${value}" ${state.status === value ? "selected" : ""}>${U.e(U.t(MM.statusKey(value)))}</option>`).join("")}</select></div><div class="field"><label for="buyer-time-sort">${U.tr("sort")}</label><select id="buyer-time-sort">${["newest", "oldest"].map((value) => `<option value="${value}" ${state.sort === value ? "selected" : ""} data-i18n="${value}">${U.e(U.t(value))}</option>`).join("")}</select></div><a class="button" href="${U.url("rfq.html")}">${U.tr("publishPurchase")} →</a></div><section id="buyer-inquiry-list" aria-live="polite"></section></div><dialog class="drawer" id="buyer-inquiry-drawer" aria-label="${U.t("yourInquiry")}"></dialog>`;
    for (const [id, key] of [
      ["buyer-status-filter", "status"],
      ["buyer-time-sort", "sort"],
    ]) {
      document.getElementById(id).onchange = (event) => {
        state[key] = event.target.value;
        refresh();
      };
    }
    document
      .getElementById("buyer-inquiry-drawer")
      .addEventListener("close", () => (selectedId = null));
  }

  function title(row) {
    const p = row.product_id ? U.product(row.product_id) : null;
    return p
      ? U.bi({ zh: p.i18n.zh.title, en: p.i18n.en.title })
      : U.tr(row.mode === "rfq" ? "rfqModePublic" : "general");
  }
  function relTime(value) {
    const diff = Date.now() - Date.parse(value || 0);
    if (!Number.isFinite(diff)) return "—";
    const minutes = Math.round(diff / 60000);
    if (minutes < 60) return Math.max(1, minutes) + " min";
    const hours = Math.round(minutes / 60);
    return hours < 24 ? hours + " h" : Math.round(hours / 24) + " d";
  }

  function refresh() {
    let list;
    try {
      list = owned();
    } catch {
      showStorageError();
      return;
    }
    if (!list) {
      showLogin();
      return;
    }
    if (!document.getElementById("buyer-inquiry-list")) buildPage();
    const unread = list.reduce((sum, row) => sum + MM.unreadCount(row, "buyer"), 0);
    const quoteCount = list.reduce((sum, row) => sum + quotesOf(row.id).length, 0);
    document.getElementById("buyer-total").textContent = list.length;
    document.getElementById("buyer-quoted").textContent = quoteCount;
    document.getElementById("buyer-accepted").textContent = list.filter(
      (row) => row.status === "accepted",
    ).length;
    const shown = BuyerRfq.select(list, user(), state);
    document.getElementById("buyer-inquiry-list").innerHTML = shown.length
      ? shown.map(item).join("")
      : list.length
        ? U.empty("noFilteredInquiries", "changeInquiryFilter")
        : U.empty("noBuyerInquiries", "startBuyerInquiry", "products.html", "backBrowse");
    main
      .querySelectorAll("[data-buyer-inquiry]")
      .forEach((button) => (button.onclick = () => openInquiry(button.dataset.buyerInquiry)));
    if (selectedId) {
      const row = list.find((r) => r.id === selectedId);
      if (row) renderDrawer(row);
      else closeDrawer();
    }
    U.translate();
    AccountUI.refreshContext();
  }

  function item(row) {
    const product = row.product_id ? U.product(row.product_id) : null;
    const quotes = quotesOf(row.id).length + (row.quotes || []).length;
    const unread = MM.unreadCount(row, "buyer");
    const last = MM.lastMessage(row);
    return `<button type="button" class="inquiry-item" data-buyer-inquiry="${U.e(row.id)}"><img src="${U.e(product ? U.img(product) : "assets/media/services.jpg")}" alt=""><div><h3>${title(row)}</h3><p>${row.category_id ? U.bi(U.cat(row.category_id)?.name) : U.e(row.buyer.company)}${quotes ? ` · ${quotes} ${U.tr("quoteCount")}` : ""}</p><p class="muted">${U.e(String(last?.body || row.message || "").slice(0, 60))}</p></div><div class="inquiry-meta"><p>${U.tr("quantity")} ${U.e(row.quantity)} · ${U.e(row.buyer.country)}</p><p>${U.e(relTime(row.updated_at))}</p></div><div class="status-cell"><span class="status ${U.e(row.status)}">${U.tr(MM.statusKey(row.status))}</span>${unread ? `<span class="thread-dot">${unread}</span>` : ""}</div></button>`;
  }

  function quoteRow(thread, message, masterId) {
    const quote = message.quote || {};
    const accepted =
      thread.status === "accepted" || thread.accepted_quote_id === message.id;
    const name = thread.supplier_name || U.tr("supplier");
    return `<div class="quote-compare-row ${accepted ? "is-accepted" : ""}"><div class="quote-compare-main"><strong>${U.e(name)}</strong><span class="status ${U.e(thread.status)}">${U.tr(MM.statusKey(thread.status))}</span></div><dl><div><dt>${U.tr("quotePrice")}</dt><dd>${U.e(quote.currency || "USD")} ${Number(quote.price || 0).toLocaleString()}</dd></div><div><dt>${U.tr("quoteMoq")}</dt><dd>${U.e(quote.moq)}</dd></div><div><dt>${U.tr("quoteLeadTime")}</dt><dd>${U.e(quote.lead_time)}</dd></div><div><dt>${U.tr("terms")}</dt><dd>${U.e(quote.incoterms)}</dd></div></dl>${accepted ? `<span class="badge verified-badge">${U.tr("quoteAcceptedBadge")}</span>` : `<button type="button" class="button secondary" data-accept-quote="${U.e(message.id)}" data-quote-thread="${U.e(thread.id)}" data-master="${U.e(masterId)}">${U.tr("quoteAccept")}</button>`}</div>`;
  }

  function bubble(message, thread) {
    if (message.type === "system")
      return `<div class="msg-system">${U.tr("quoteAccepted")}</div>`;
    const mine = message.from === "buyer";
    return `<div class="msg-row ${mine ? "mine" : "theirs"}"><div class="msg-bubble">${message.type === "quote" ? quoteInline(message) : ""}${message.body ? `<p>${U.e(message.body)}</p>` : ""}${message.attachments?.length ? U.filesHtml(message.attachments) : ""}<div class="msg-meta">${message.sender_name ? `<span>${U.e(message.sender_name)}</span>` : ""}<time>${U.e(U.date(message.created_at))}</time>${mine ? `<span class="read-flag">${message.read_at ? `${U.tr("readReceipt")} · ${U.e(U.date(message.read_at))}` : U.tr("unreadReceipt")}</span>` : ""}</div></div></div>`;
  }
  function quoteInline(message) {
    const quote = message.quote || {};
    return `<div class="quote-card"><div class="quote-head"><strong>${U.tr("quoteCard")}</strong></div><dl><div><dt>${U.tr("quotePrice")}</dt><dd>${U.e(quote.currency || "USD")} ${Number(quote.price || 0).toLocaleString()}</dd></div><div><dt>${U.tr("quoteMoq")}</dt><dd>${U.e(quote.moq)}</dd></div><div><dt>${U.tr("quoteLeadTime")}</dt><dd>${U.e(quote.lead_time)}</dd></div><div><dt>${U.tr("terms")}</dt><dd>${U.e(quote.incoterms)}</dd></div>${quote.valid_until ? `<div><dt>${U.tr("quoteValidUntil")}</dt><dd>${U.e(quote.valid_until)}</dd></div>` : ""}</dl></div>`;
  }

  /** 成交后会话落在中选的报价子线程里；未成交前留在主帖。 */
  function conversationOf(row) {
    const list = allThreads();
    const fork = row.accepted_thread_id
      ? list.find((item) => item.id === row.accepted_thread_id)
      : null;
    if (!fork) return { thread: row, messages: row.messages || [] };
    const seen = new Set();
    const messages = [];
    for (const message of [...(row.messages || []), ...(fork.messages || [])]) {
      if (seen.has(message.id)) continue;
      seen.add(message.id);
      messages.push(message);
    }
    messages.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
    return { thread: fork, messages };
  }

  function renderDrawer(row) {
    const drawer = document.getElementById("buyer-inquiry-drawer");
    const product = row.product_id ? U.product(row.product_id) : null;
    const conv = conversationOf(row);
    const category = U.cat(row.category_id);
    const subcategory = category?.subcategories.find((c) => c.id === row.subcategory_id);
    const compared = row.mode === "rfq" ? quotesOf(row.id) : [];
    const quoteBlocks = compared
      .map((thread) => {
        const quoteMessage = (thread.messages || []).find((m) => m.type === "quote");
        return quoteMessage ? quoteRow(thread, quoteMessage, row.id) : "";
      })
      .join("");
    const fields = [
      ["company", row.buyer.company],
      ["buyerCountry", row.buyer.country],
      ["category", category?.name?.[U.lang]],
      ["subcategory", subcategory?.name?.[U.lang]],
      ["quantity", row.quantity],
      ["targetCountry", row.target_country],
      ["delivery", row.expected_delivery],
      ["terms", row.incoterms],
      ["sentAt", U.date(row.created_at)],
    ];
    drawer.innerHTML = `<div class="drawer-header"><h2>${U.tr("yourInquiry")}</h2><button type="button" class="language" id="buyer-drawer-language" data-i18n="language">${U.t("language")}</button><button type="button" class="button secondary" id="close-buyer-inquiry">${U.tr("close")}</button></div><div class="buyer-inquiry-head"><span class="status ${U.e(row.status)}">${U.tr(MM.statusKey(row.status))}</span><span class="chip">${U.tr(row.mode === "rfq" ? "rfqPublicBadge" : "rfqDirectBadge")}</span></div><div class="buyer-inquiry-context">${U.context(product)}</div><table class="param-table"><tbody>${fields.map(([key, value]) => `<tr><th scope="row">${U.tr(key)}</th><td>${U.e(value ?? "—") || "—"}</td></tr>`).join("")}</tbody></table><h3>${U.tr("message")}</h3><p class="inquiry-message">${U.e(row.message || "—")}</p><h3>${U.tr("attachments")}</h3>${row.attachments?.length ? U.filesHtml(row.attachments) : `<p class="muted">${U.tr("noData")}</p>`}${compared.length ? `<section class="quote-compare"><h3>${U.tr("rfqQuotes")}</h3><p class="inline-note">${U.tr("rfqMarketDesc")}</p>${quoteBlocks || `<p class="muted">${U.tr("rfqNoQuotes")}</p>`}</section>` : ""}<section class="buyer-thread"><h3>${U.tr("conversation")}</h3><div class="message-stream compact">${conv.messages.map((message) => bubble(message, conv.thread)).join("")}</div><form id="buyer-reply-form" novalidate><div class="field"><label class="sr-only" for="buyer-reply-message">${U.tr("reply")}</label><textarea id="buyer-reply-message" rows="3" placeholder="${U.t("replyPlaceholder")}"></textarea></div><button class="button" type="submit">${U.tr("sendReply")}</button></form></section>`;
    document.getElementById("close-buyer-inquiry").onclick = closeDrawer;
    document.getElementById("buyer-drawer-language").onclick = U.switchLanguage;
    document.getElementById("buyer-reply-form").onsubmit = (event) => {
      event.preventDefault();
      const area = document.getElementById("buyer-reply-message");
      if (!area.value.trim()) return;
      const updated = MM.appendMessage(conv.thread, {
        from: "buyer",
        type: "reply",
        body: area.value,
        sender_id: user()?.id || "",
        sender_name: row.buyer.contact || row.buyer.company || "",
      });
      if (patch(updated)) {
        U.notice("messageSent");
        refresh();
      }
    };
    drawer.querySelectorAll("[data-accept-quote]").forEach((button) => {
      button.onclick = () => {
        const quoteThread = allThreads().find(
          (t) => t.id === button.dataset.quoteThread,
        );
        if (!quoteThread) return;
        acceptQuoteOn(quoteThread, button.dataset.acceptQuote, button.dataset.master);
      };
    });
    if (!drawer.open) drawer.showModal();
    U.translate();
  }

  function acceptQuoteOn(quoteThread, messageId, masterId) {
    const list = allThreads();
    const map = new Map(list.map((row) => [row.id, row]));
    /* 接受报价即视为已读该报价线程，避免未读角标虚高 */
    const updated = MM.markRead(MM.acceptQuote(quoteThread, messageId, "buyer"), "buyer");
    map.set(updated.id, updated);
    const master = map.get(masterId);
    if (master && master.id !== updated.id) {
      map.set(masterId, {
        ...master,
        status: "accepted",
        accepted_quote_id: messageId,
        accepted_thread_id: updated.id,
        updated_at: new Date().toISOString(),
      });
    } else if (master && master.id === updated.id) {
      map.set(masterId, { ...updated, status: "accepted" });
    }
    if (save([...map.values()])) {
      U.notice("quoteAccepted");
      refresh();
    }
  }

  function openInquiry(id) {
    let list;
    try {
      list = owned();
    } catch {
      showStorageError();
      return;
    }
    if (!list) {
      showLogin();
      return;
    }
    let row = list.find((r) => r.id === id);
    if (!row) {
      closeDrawer();
      refresh();
      return;
    }
    selectedId = id;
    let changed = false;
    if (MM.unreadCount(row, "buyer") > 0) {
      const read = MM.markRead(row, "buyer");
      if (patch(read)) {
        row = read;
        changed = true;
      }
    }
    const fork = row.accepted_thread_id
      ? allThreads().find((item) => item.id === row.accepted_thread_id)
      : null;
    if (fork && MM.unreadCount(fork, "buyer") > 0) {
      if (patch(MM.markRead(fork, "buyer"))) changed = true;
    }
    if (changed) refresh();
    renderDrawer(row);
  }

  window.addEventListener("storage", (event) => {
    if (
      ["rfq_drafts", "current_user", "accounts", "draft_products"].includes(
        event.key,
      ) ||
      event.key === null
    )
      refresh();
  });
  window.addEventListener("focus", refresh);
  window.addEventListener("languagechange", refresh);
  refresh();
})(typeof window !== "undefined" ? window : globalThis);
