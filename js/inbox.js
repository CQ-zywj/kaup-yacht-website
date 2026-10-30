/* 卖家询盘收件箱：多轮会话线程、结构化报价、已读回执、业务员分配 */
(function () {
  if (!AccountUI.requireSupplier()) return;
  if (typeof MarineMessages === "undefined") return;

  const MM = MarineMessages;
  const state = { filter: "all", q: "", activeId: "" };
  const FILTERS = ["all", "unread", "waiting", "quoted", "closed"];
  const FILTER_LABEL = {
    all: "threadAll",
    unread: "threadUnread",
    waiting: "threadWaiting",
    quoted: "threadQuotedFilter",
    closed: "threadClosedFilter",
  };

  function scopeId() {
    const user = AccountUI.getUser();
    let id = "";
    try {
      id = MarineAccounts.readProfile(localStorage).id || "";
    } catch {}
    return id || user?.id || "";
  }
  function profile() {
    try {
      return MarineAccounts.readProfile(localStorage) || {};
    } catch {
      return {};
    }
  }
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
  function patch(thread) {
    const list = allThreads();
    const index = list.findIndex((row) => row.id === thread.id);
    if (index < 0) return false;
    list[index] = thread;
    return U.write("rfq_drafts", list);
  }
  function visible(list) {
    const id = scopeId();
    /* 公开 RFQ 主帖对所有供应商可见，但收件箱只显示各自报价生成的子线程。 */
    return list.filter((row) =>
      row.supplier_id ? row.supplier_id === id : row.mode !== "rfq",
    );
  }
  function rows() {
    return visible(allThreads());
  }
  function productOf(row) {
    return row.product_id ? U.product(row.product_id) : null;
  }
  function productTitle(row) {
    const p = productOf(row);
    return p
      ? U.bi({ zh: p.i18n.zh.title, en: p.i18n.en.title })
      : U.tr(row.mode === "rfq" ? "rfqModePublic" : "general");
  }
  function relTime(value) {
    const diff = Date.now() - Date.parse(value || 0);
    if (!Number.isFinite(diff)) return "—";
    const minutes = Math.round(diff / 60000);
    if (minutes < 1) return "1 min";
    if (minutes < 60) return minutes + " min";
    const hours = Math.round(minutes / 60);
    if (hours < 24) return hours + " h";
    return Math.round(hours / 24) + " d";
  }
  function excerpt(text, max = 46) {
    const value = String(text || "").replace(/\s+/g, " ").trim();
    return value.length > max ? value.slice(0, max) + "…" : value;
  }
  function statusBadge(row) {
    return `<span class="status ${U.e(row.status)}">${U.tr(MM.statusKey(row.status))}</span>`;
  }

  function filtered() {
    let list = rows();
    if (state.filter === "unread")
      list = list.filter((row) => MM.unreadCount(row, "supplier") > 0);
    else if (state.filter === "waiting")
      list = list.filter((row) => MM.lastMessage(row)?.from === "buyer");
    else if (state.filter === "quoted")
      list = list.filter((row) => ["quoted", "accepted"].includes(row.status));
    else if (state.filter === "closed")
      list = list.filter((row) => row.status === "closed");
    const q = state.q.trim().toLowerCase();
    if (q)
      list = list.filter((row) =>
        [
          row.buyer?.company,
          row.buyer?.country,
          row.message,
          MM.lastMessage(row)?.body,
          productOf(row)?.i18n?.zh?.title,
          productOf(row)?.i18n?.en?.title,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    return list.sort(
      (a, b) => Date.parse(b.updated_at || 0) - Date.parse(a.updated_at || 0),
    );
  }

  function renderShell() {
    document.getElementById("main").innerHTML = `<div class="container inbox-page"><div class="page-intro"><div class="eyebrow">${U.tr("supplierMode")}</div><h1>${U.tr("inboxTitle")}</h1><p>${U.tr("emailReplyHint")}</p></div><div class="inbox-metrics"><div class="metric"><strong id="m-unread">0</strong><span>${U.tr("metricUnread")}</span></div><div class="metric"><strong id="m-waiting">0</strong><span>${U.tr("metricWaiting")}</span></div><div class="metric"><strong id="m-rate">0%</strong><span>${U.tr("metricResponseRate")}</span></div><div class="metric"><strong id="m-hours">0h</strong><span>${U.tr("metricAvgHours")}</span></div></div><div class="message-layout"><aside class="thread-list panel"><div class="thread-toolbar"><div class="thread-tabs">${FILTERS.map(
      (key) =>
        `<button type="button" data-filter="${key}" class="${state.filter === key ? "active" : ""}">${U.tr(FILTER_LABEL[key])}<b data-count="${key}">0</b></button>`,
    ).join("")}</div><div class="field"><label class="sr-only" for="thread-search">${U.tr("search")}</label><input id="thread-search" type="search" value="${U.e(state.q)}" placeholder="${U.t("threadSearch")}"></div></div><div id="thread-items" aria-live="polite"></div></aside><section class="thread-panel panel" id="thread-panel" aria-live="polite"></section></div><p class="inline-note">${U.tr("emailNotifyHint")}</p></div>`;
    document.querySelectorAll("[data-filter]").forEach((button) => {
      button.onclick = () => {
        state.filter = button.dataset.filter;
        document
          .querySelectorAll("[data-filter]")
          .forEach((node) =>
            node.classList.toggle("active", node.dataset.filter === state.filter),
          );
        renderList();
      };
    });
    const search = document.getElementById("thread-search");
    search.oninput = () => {
      state.q = search.value;
      renderList();
    };
    U.translate();
  }

  function renderList() {
    const list = rows();
    const shown = filtered();
    const stats = MM.responseStats(list);
    const unread = MM.unreadTotal(list, "supplier");
    const waiting = list.filter(
      (row) => MM.lastMessage(row)?.from === "buyer",
    ).length;
    const set = (id, value) => {
      const node = document.getElementById(id);
      if (node) node.textContent = value;
    };
    set("m-unread", unread);
    set("m-waiting", waiting);
    set("m-rate", stats.rate + "%");
    set("m-hours", stats.avgHours + "h");
    const counts = {
      all: list.length,
      unread: list.filter((row) => MM.unreadCount(row, "supplier") > 0).length,
      waiting,
      quoted: list.filter((row) => ["quoted", "accepted"].includes(row.status))
        .length,
      closed: list.filter((row) => row.status === "closed").length,
    };
    document.querySelectorAll("[data-count]").forEach((node) => {
      node.textContent = counts[node.dataset.count] ?? 0;
    });
    const target = document.getElementById("thread-items");
    target.innerHTML = shown.length
      ? shown.map(item).join("")
      : U.empty("noThreadMatch", "threadSearch", "rfq.html", "generalRfq");
    target.querySelectorAll("[data-thread]").forEach((button) => {
      button.onclick = () => openThread(button.dataset.thread);
    });
    if (!shown.length) state.activeId = "";
    else if (!shown.some((row) => row.id === state.activeId))
      state.activeId = shown[0].id;
    renderPanel();
    U.translate();
  }

  function item(row) {
    const last = MM.lastMessage(row);
    const unread = MM.unreadCount(row, "supplier");
    const quotes = (row.quotes || []).length;
    const owner = row.assignee_name
      ? `<span>${U.e(row.assignee_name[U.lang] || row.assignee_name.zh)}</span>`
      : `<span class="muted">${U.tr("unassigned")}</span>`;
    return `<button type="button" class="thread-item ${row.id === state.activeId ? "active" : ""} ${unread ? "is-unread" : ""}" data-thread="${U.e(row.id)}"><span class="thread-avatar">${U.e((row.buyer?.company || "?").slice(0, 1))}</span><span class="thread-main"><span class="thread-top"><strong>${U.e(row.buyer?.company || "")}</strong><time>${U.e(relTime(row.updated_at))}</time></span><span class="thread-sub">${productTitle(row)} · ${U.e(row.buyer?.country || "—")}</span><span class="thread-last">${last?.type === "quote" ? `<em>${U.tr("quote")}</em>` : ""}${U.e(excerpt(last?.body || row.message || ""))}</span><span class="thread-flags">${statusBadge(row)}${quotes ? `<span class="chip">${quotes} ${U.tr("quoteCount")}</span>` : ""}<span class="chip">${owner}</span></span></span>${unread ? `<span class="thread-dot">${unread}</span>` : ""}</button>`;
  }

  function quoteCard(message, thread) {
    const quote = message.quote || {};
    const accepted = thread.accepted_quote_id === message.id;
    return `<div class="quote-card ${accepted ? "is-accepted" : ""}"><div class="quote-head"><strong>${U.tr("quoteCard")}</strong>${accepted ? `<span class="status accepted">${U.tr("quoteAcceptedBadge")}</span>` : ""}</div><dl><div><dt>${U.tr("quotePrice")}</dt><dd>${U.e(quote.currency || "USD")} ${Number(quote.price || 0).toLocaleString()}</dd></div><div><dt>${U.tr("quoteMoq")}</dt><dd>${U.e(quote.moq)}</dd></div><div><dt>${U.tr("quoteLeadTime")}</dt><dd>${U.e(quote.lead_time)}</dd></div><div><dt>${U.tr("terms")}</dt><dd>${U.e(quote.incoterms)}</dd></div>${quote.valid_until ? `<div><dt>${U.tr("quoteValidUntil")}</dt><dd>${U.e(quote.valid_until)}</dd></div>` : ""}</dl></div>`;
  }
  function bubble(message, thread) {
    if (message.type === "system")
      return `<div class="msg-system">${U.tr(message.from === "buyer" ? "quoteAccepted" : "quoteAcceptedBadge")}</div>`;
    const mine = message.from === "supplier";
    return `<div class="msg-row ${mine ? "mine" : "theirs"}"><div class="msg-bubble">${message.type === "quote" ? quoteCard(message, thread) : ""}${message.body ? `<p>${U.e(message.body)}</p>` : ""}${message.attachments?.length ? U.filesHtml(message.attachments) : ""}<div class="msg-meta">${message.sender_name ? `<span>${U.e(message.sender_name)}</span>` : ""}<time>${U.e(U.date(message.created_at))}</time>${mine ? `<span class="read-flag">${message.read_at ? `${U.tr("readReceipt")} · ${U.e(U.date(message.read_at))}` : U.tr("unreadReceipt")}</span>` : ""}</div></div></div>`;
  }

  function buyerPanel(row) {
    const sameBuyer = rows().filter(
      (item) => item.buyer?.id && item.buyer.id === row.buyer?.id,
    ).length;
    const seed = String(row.buyer?.company || "x")
      .split("")
      .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    let account = null;
    try {
      account = U.read("accounts").find((a) => a.id === row.buyer?.id) || null;
    } catch {}
    const email = row.buyer?.email || account?.email || "";
    const revealed = (row.quotes || []).length || row.contact_revealed;
    return `<div class="buyer-panel"><h3>${U.tr("buyerProfile")}</h3><dl><div><dt>${U.tr("company")}</dt><dd>${U.e(row.buyer?.company || "—")}</dd></div><div><dt>${U.tr("buyerCountry")}</dt><dd>${U.e(row.buyer?.country || "—")}</dd></div><div><dt>${U.tr("buyerTypeLabel")}</dt><dd>${U.tr(sameBuyer > 1 ? "buyerTypeRepeat" : "buyerTypeNew")}</dd></div><div><dt>${U.tr("buyerInquiries")}</dt><dd>${sameBuyer}</dd></div><div><dt>${U.tr("buyerViews90")}</dt><dd>${(seed % 24) + 6}</dd></div><div><dt>${U.tr("contact")}</dt><dd>${revealed && email ? `<a class="text-link" href="mailto:${U.e(email)}">${U.e(email)}</a>` : revealed ? `<span class="muted">${U.tr("inPlatformOnly")}</span>` : `<span class="muted">${U.tr("contactHidden")}</span>`}</dd></div></dl><p class="inline-note">${revealed ? U.tr("contactRevealed") : U.tr("contactHiddenHint")}</p></div>`;
  }

  function renderPanel() {
    const panel = document.getElementById("thread-panel");
    if (!panel) return;
    const row = rows().find((item) => item.id === state.activeId);
    if (!row) {
      panel.innerHTML = U.empty("selectThread", "inboxDesc");
      U.translate();
      return;
    }
    let firstReply = U.tr("noReplyYet");
    if (row.first_reply_at) {
      const hours = Math.max(
        1,
        Math.round(
          (Date.parse(row.first_reply_at) - Date.parse(row.created_at)) / 3600000,
        ),
      );
      firstReply = `${U.tr("firstResponse")} · ${U.e(U.t("firstResponseHours").replace("{n}", String(hours)))}`;
    }
    panel.innerHTML = `<div class="thread-head"><div><div class="thread-head-title"><strong>${U.e(row.buyer?.company || "")}</strong>${statusBadge(row)}<span class="chip">${U.tr(row.mode === "rfq" ? "rfqPublicBadge" : "rfqDirectBadge")}</span></div><p class="muted">${productTitle(row)} · ${U.e(row.buyer?.country || "—")} · ${U.tr("lastActive")} ${U.e(U.date(row.updated_at))}</p><p class="muted">${firstReply}</p></div><div class="thread-head-actions"><label class="inline-field"><span>${U.tr("assignTo")}</span><select id="assign-select"><option value="">${U.t("unassigned")}</option>${MM.MEMBERS.map((member) => `<option value="${member.id}" ${row.assignee_id === member.id ? "selected" : ""}>${U.e(member.name[U.lang] || member.name.zh)}</option>`).join("")}</select></label><button type="button" class="link-button" id="assign-auto">${U.tr("assignAuto")}</button>${row.status === "closed" ? `<button type="button" class="button secondary" id="reopen-thread">${U.tr("reopenThread")}</button>` : `<button type="button" class="link-button" id="close-thread">${U.tr("closeThread")}</button>`}</div></div><div class="thread-body"><div class="message-stream">${(row.messages || []).map((message) => bubble(message, row)).join("")}</div>${buyerPanel(row)}</div>${row.status === "closed" ? `<p class="notice-line">${U.tr("threadClosedNotice")}</p>` : ""}<div class="reply-box"><div class="reply-tabs"><button type="button" data-reply-mode="reply" class="active">${U.tr("reply")}</button><button type="button" data-reply-mode="quote">${U.tr("sendQuote")}</button></div><form id="reply-form" novalidate><div class="field"><label class="sr-only" for="reply-message">${U.tr("reply")}</label><textarea id="reply-message" rows="3" placeholder="${U.t("replyPlaceholder")}"></textarea></div><div class="field"><label for="reply-attachments">${U.tr("attachments")}</label><input type="file" id="reply-attachments" multiple><div id="reply-files"></div></div><button class="button" type="submit">${U.tr("sendReply")}</button></form><form id="quote-form" novalidate hidden><div class="form-grid"><div class="field"><label for="quote-price">${U.tr("quotePrice")} <b>*</b></label><input id="quote-price" type="number" min="0.01" step="any" required value="${U.e(productOf(row)?.trade?.price_min || "")}"></div><div class="field"><label for="quote-moq">${U.tr("quoteMoq")} <b>*</b></label><input id="quote-moq" type="number" min="1" step="1" required value="${U.e(row.quantity || "")}"></div><div class="field"><label for="quote-lead">${U.tr("quoteLeadTime")}</label><input id="quote-lead" type="number" min="1" step="1" value="${U.e(productOf(row)?.trade?.lead_time || "")}"></div><div class="field"><label for="quote-terms">${U.tr("terms")}</label><select id="quote-terms">${["EXW", "FOB", "CIF", "DAP"].map((term) => `<option ${row.incoterms === term ? "selected" : ""}>${term}</option>`).join("")}</select></div><div class="field"><label for="quote-valid">${U.tr("quoteValidUntil")}</label><input id="quote-valid" type="date"></div><div class="field full"><label for="quote-note">${U.tr("quoteNote")}</label><textarea id="quote-note" rows="2"></textarea></div></div><button class="button" type="submit">${U.tr("quoteSendAction")}</button><p class="inline-note">${U.e(U.t("emailNotified").replace("{email}", profile().email || ""))}</p></form></div>`;
    bindPanel(row);
    U.translate();
  }

  function bindPanel(row) {
    document.getElementById("assign-select").onchange = (event) => {
      if (patch(MM.assign(row, event.target.value))) renderList();
    };
    document.getElementById("assign-auto").onclick = () => {
      if (patch(MM.autoAssign(row, rows()))) renderList();
    };
    const closeButton = document.getElementById("close-thread");
    if (closeButton)
      closeButton.onclick = () => {
        if (!window.confirm(U.t("closeThreadConfirm"))) return;
        if (patch(MM.close(row, "supplier"))) renderList();
      };
    const reopenButton = document.getElementById("reopen-thread");
    if (reopenButton)
      reopenButton.onclick = () => {
        if (patch(MM.reopen(row))) renderList();
      };
    document.querySelectorAll("[data-reply-mode]").forEach((button) => {
      button.onclick = () => {
        const mode = button.dataset.replyMode;
        document
          .querySelectorAll("[data-reply-mode]")
          .forEach((node) => node.classList.toggle("active", node === button));
        document.getElementById("reply-form").hidden = mode !== "reply";
        document.getElementById("quote-form").hidden = mode !== "quote";
      };
    });
    let attachments = [];
    let replyPicked = [];
    const replyInput = document.getElementById("reply-attachments");
    const replyBox = document.getElementById("reply-files");
    function paintReplyFiles() {
      attachments = U.attachments(replyPicked);
      replyBox.innerHTML = U.filesHtml(attachments, true);
      replyBox.querySelectorAll("[data-remove-file]").forEach((button) => {
        button.onclick = () => {
          replyPicked.splice(Number(button.dataset.removeFile), 1);
          if (typeof DataTransfer !== "undefined") {
            const transfer = new DataTransfer();
            replyPicked.forEach((file) => transfer.items.add(file));
            replyInput.files = transfer.files;
          }
          paintReplyFiles();
        };
      });
    }
    replyInput.onchange = (event) => {
      replyPicked = [...event.target.files];
      paintReplyFiles();
    };
    document.getElementById("reply-form").onsubmit = (event) => {
      event.preventDefault();
      const area = document.getElementById("reply-message");
      if (!area.value.trim()) {
        area.focus();
        return;
      }
      const updated = MM.appendMessage(row, {
        from: "supplier",
        type: "reply",
        body: area.value,
        attachments,
        sender_id: AccountUI.getUser()?.id || "",
        sender_name: profile().contact || "",
      });
      if (row.status === "closed") updated.status = "replied";
      if (patch(updated)) {
        replyPicked = [];
        paintReplyFiles();
        U.notice("replySent");
        renderList();
      }
    };
    document.getElementById("quote-form").onsubmit = (event) => {
      event.preventDefault();
      const quote = {
        price: Number(document.getElementById("quote-price").value),
        moq: Number(document.getElementById("quote-moq").value),
        lead_time: Number(document.getElementById("quote-lead").value) || 30,
        incoterms: document.getElementById("quote-terms").value,
        valid_until: document.getElementById("quote-valid").value,
        currency: "USD",
        unit: "unit",
      };
      if (
        !Number.isFinite(quote.price) ||
        quote.price <= 0 ||
        !Number.isFinite(quote.moq) ||
        quote.moq <= 0
      ) {
        U.notice("quoteError");
        return;
      }
      try {
        const updated = MM.addQuote(
          row,
          quote,
          document.getElementById("quote-note").value,
          [],
          {
            id: AccountUI.getUser()?.id || "",
            name: profile().contact || "",
          },
        );
        if (patch(updated)) {
          U.notice("quoteSent");
          renderList();
        }
      } catch {
        U.notice("quoteError");
      }
    };
  }

  function openThread(id) {
    state.activeId = id;
    const row = rows().find((item) => item.id === id);
    if (!row) return;
    if (MM.unreadCount(row, "supplier") > 0) patch(MM.markRead(row, "supplier"));
    renderList();
  }

  renderShell();
  const initial = filtered();
  if (initial.length) state.activeId = initial[0].id;
  renderList();

  window.addEventListener("storage", (event) => {
    if (["rfq_drafts", "current_user", "draft_products"].includes(event.key))
      renderList();
  });
  window.addEventListener("focus", renderList);
  window.addEventListener("languagechange", () => {
    renderShell();
    renderList();
  });
})();
