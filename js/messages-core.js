/* 会话线程数据层：一对一询盘 / 公开 RFQ 共用同一线程模型。
   thread.messages 保存多轮消息（询盘、回复、报价、系统备注），不再单条 reply 覆盖。 */
(function (root) {
  const STATUSES = ["submitted", "viewed", "replied", "quoted", "accepted", "closed"];
  const MESSAGE_TYPES = ["inquiry", "reply", "quote", "system"];
  const MEMBERS = [
    { id: "staff-1", name: { zh: "王海", en: "Wang Hai" }, region: "EU" },
    { id: "staff-2", name: { zh: "李婷", en: "Li Ting" }, region: "NA" },
    { id: "staff-3", name: { zh: "陈默", en: "Chen Mo" }, region: "APAC" },
  ];
  const STATUS_KEY = {
    submitted: "statusSubmitted",
    viewed: "statusViewed",
    replied: "statusReplied",
    quoted: "statusQuoted",
    accepted: "statusAccepted",
    closed: "statusClosed",
  };

  function uid(prefix) {
    return (
      prefix +
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 6)
    );
  }
  function now() {
    return new Date().toISOString();
  }
  function normalizeMessage(m, fallbackFrom) {
    const body = typeof m?.body === "string" ? m.body : String(m?.body || "");
    return {
      id: typeof m?.id === "string" && m.id ? m.id : uid("msg-"),
      from: m?.from === "supplier" ? "supplier" : fallbackFrom || "buyer",
      type: MESSAGE_TYPES.includes(m?.type) ? m.type : "reply",
      body,
      attachments: Array.isArray(m?.attachments) ? m.attachments : [],
      quote: m?.quote && typeof m.quote === "object" ? m.quote : null,
      sender_id: typeof m?.sender_id === "string" ? m.sender_id : "",
      sender_name: typeof m?.sender_name === "string" ? m.sender_name : "",
      created_at:
        m?.created_at && Number.isFinite(Date.parse(m.created_at))
          ? m.created_at
          : now(),
      read_at:
        m?.read_at && Number.isFinite(Date.parse(m.read_at)) ? m.read_at : null,
    };
  }
  /** 旧记录（message + 单条 reply）升级为消息数组，并补齐新字段。 */
  function normalize(thread) {
    if (!thread || typeof thread !== "object") throw Error("invalid thread");
    const row = { ...thread };
    row.mode = thread.mode === "rfq" ? "rfq" : "inquiry";
    row.status = STATUSES.includes(thread.status) ? thread.status : "submitted";
    if (Array.isArray(thread.messages) && thread.messages.length) {
      row.messages = thread.messages.map((m) => normalizeMessage(m));
    } else {
      const messages = [];
      if (thread.message)
        messages.push(
          normalizeMessage(
            {
              id: "msg-" + thread.id + "-0",
              from: "buyer",
              type: "inquiry",
              body: thread.message,
              attachments: thread.attachments || [],
              created_at: thread.created_at,
              read_at:
                thread.status === "submitted"
                  ? null
                  : thread.first_reply_at || thread.reply?.created_at || null,
            },
            "buyer",
          ),
        );
      if (thread.reply?.message)
        messages.push(
          normalizeMessage(
            {
              id: "msg-" + thread.id + "-1",
              from: "supplier",
              type: "reply",
              body: thread.reply.message,
              attachments: thread.reply.attachments || [],
              created_at: thread.reply.created_at,
              read_at: thread.reply_read_at || null,
            },
            "supplier",
          ),
        );
      row.messages = messages;
    }
    row.assignee_id =
      typeof thread.assignee_id === "string" ? thread.assignee_id : "";
    row.assignee_name =
      thread.assignee_name && typeof thread.assignee_name === "object"
        ? thread.assignee_name
        : null;
    row.quotes = row.messages.filter((m) => m.type === "quote" && m.quote);
    row.contact_revealed = !!thread.contact_revealed || row.quotes.length > 0;
    row.created_at =
      thread.created_at && Number.isFinite(Date.parse(thread.created_at))
        ? thread.created_at
        : row.messages[0]?.created_at || now();
    const supplierMessages = row.messages.filter((m) => m.from === "supplier");
    row.first_reply_at =
      thread.first_reply_at ||
      (supplierMessages.length ? supplierMessages[0].created_at : null);
    row.updated_at =
      thread.updated_at ||
      row.messages[row.messages.length - 1]?.created_at ||
      row.created_at;
    return row;
  }
  function normalizeAll(rows) {
    return (Array.isArray(rows) ? rows : []).map(normalize);
  }
  function lastMessage(thread) {
    const list = thread?.messages || [];
    return list.length ? list[list.length - 1] : null;
  }
  function unreadCount(thread, role) {
    const incoming = role === "supplier" ? "buyer" : "supplier";
    return (thread?.messages || []).filter(
      (m) => m.from === incoming && !m.read_at && m.type !== "system",
    ).length;
  }
  function unreadTotal(rows, role) {
    return (rows || []).reduce((sum, row) => sum + unreadCount(row, role), 0);
  }
  function markRead(thread, role, at = now()) {
    const incoming = role === "supplier" ? "buyer" : "supplier";
    const row = { ...thread };
    row.messages = (thread.messages || []).map((m) =>
      m.from === incoming && !m.read_at ? { ...m, read_at: at } : m,
    );
    if (role === "supplier" && row.status === "submitted") row.status = "viewed";
    row.updated_at = at;
    return row;
  }
  function appendMessage(thread, message) {
    const row = { ...thread };
    const entry = normalizeMessage(
      { ...message, id: message?.id || uid("msg-"), created_at: now() },
      message?.from === "supplier" ? "supplier" : "buyer",
    );
    if (!entry.body.trim() && !entry.quote)
      throw Error("empty message");
    row.messages = [...(thread.messages || []), entry];
    row.updated_at = entry.created_at;
    if (entry.from === "supplier") {
      if (!row.first_reply_at) row.first_reply_at = entry.created_at;
      if (row.status !== "accepted" && row.status !== "closed")
        row.status = entry.type === "quote" ? "quoted" : "replied";
      if (entry.type === "quote") {
        row.contact_revealed = true;
        row.quotes = [...(row.quotes || []), entry];
      }
    } else if (row.status !== "closed" && row.status !== "accepted") {
      row.status = (row.quotes || []).length ? "quoted" : "submitted";
    }
    return row;
  }
  function addQuote(thread, quote, note = "", attachments = [], sender = {}) {
    const clean = {
      price: Number(quote.price),
      currency: quote.currency || "USD",
      unit: quote.unit || "unit",
      moq: Number(quote.moq),
      lead_time: Number(quote.lead_time),
      incoterms: quote.incoterms || "FOB",
      valid_until: quote.valid_until || "",
      note: String(note || "").trim(),
    };
    if (!Number.isFinite(clean.price) || clean.price <= 0)
      throw Error("invalid price");
    if (!Number.isFinite(clean.moq) || clean.moq <= 0)
      throw Error("invalid moq");
    return appendMessage(thread, {
      from: "supplier",
      type: "quote",
      body: clean.note || "",
      attachments,
      quote: clean,
      sender_id: sender.id || "",
      sender_name: sender.name || "",
    });
  }
  function acceptQuote(thread, messageId, by = "buyer") {
    const quote = (thread.messages || []).find(
      (m) => m.id === messageId && m.type === "quote",
    );
    if (!quote) throw Error("quote not found");
    const row = { ...thread, status: "accepted", accepted_quote_id: messageId };
    row.messages = [
      ...(thread.messages || []),
      normalizeMessage(
        { from: by, type: "system", body: "", created_at: now() },
        by,
      ),
    ];
    row.updated_at = now();
    return row;
  }
  function close(thread, by = "supplier") {
    return { ...thread, status: "closed", closed_by: by, updated_at: now() };
  }
  function reopen(thread) {
    return {
      ...thread,
      status: (thread.quotes || []).length ? "quoted" : "replied",
      closed_by: "",
      updated_at: now(),
    };
  }
  function assign(thread, memberId) {
    const member = MEMBERS.find((m) => m.id === memberId);
    return {
      ...thread,
      assignee_id: member ? member.id : "",
      assignee_name: member ? member.name : null,
      assigned_at: now(),
    };
  }
  /** 系统自动分配：历史归属 > 区域归属 > 平均分配。 */
  function autoAssign(thread, rows) {
    const sameBuyer = (rows || []).find(
      (row) =>
        row.id !== thread.id &&
        row.buyer?.id &&
        row.buyer.id === thread.buyer?.id &&
        row.assignee_id,
    );
    if (sameBuyer) return assign(thread, sameBuyer.assignee_id);
    const country = String(thread.buyer?.country || "").toLowerCase();
    const region = /german|france|italy|netherland|spain|europe|uk|united kingdom/.test(
      country,
    )
      ? "EU"
      : /united states|canada|mexico|brazil/.test(country)
        ? "NA"
        : "APAC";
    const member =
      MEMBERS.find((m) => m.region === region) || MEMBERS[0];
    return assign(thread, member.id);
  }
  function responseStats(rows) {
    const list = (rows || []).filter((row) => row.messages?.length);
    const replied = list.filter((row) => row.first_reply_at);
    const within3d = replied.filter(
      (row) =>
        Date.parse(row.first_reply_at) - Date.parse(row.created_at) <=
        3 * 24 * 3600 * 1000,
    );
    const hours = replied.map(
      (row) =>
        (Date.parse(row.first_reply_at) - Date.parse(row.created_at)) / 3600000,
    );
    return {
      total: list.length,
      replied: replied.length,
      waiting: list.length - replied.length,
      within3d: within3d.length,
      rate: list.length ? Math.round((within3d.length / list.length) * 100) : 0,
      avgHours: hours.length
        ? Math.round((hours.reduce((a, b) => a + b, 0) / hours.length) * 10) / 10
        : 0,
    };
  }
  /** 供应商对公开 RFQ 报价：为每家生成独立线程，互相不可见。 */
  function forkForSupplier(master, supplierId, supplierName, quote, note = "") {
    if (!supplierId) throw Error("missing supplier");
    const base = normalize(master);
    const thread = {
      ...base,
      id: uid("rfq-"),
      mode: "rfq",
      supplier_id: supplierId,
      supplier_name: supplierName || "",
      public_of: base.id,
      status: "quoted",
      assignee_id: "",
      assignee_name: null,
      accepted_quote_id: "",
      messages: (base.messages || [])
        .filter((m) => m.from === "buyer")
        .slice(0, 1)
        .map((m) => ({ ...m, read_at: now() })),
      quotes: [],
      contact_revealed: false,
      contact_pending: true,
      created_at: now(),
      updated_at: now(),
    };
    const quoted = addQuote(thread, quote, note, [], {
      id: supplierId,
      name: supplierName || "",
    });
    quoted.contact_revealed = false;
    quoted.contact_pending = true;
    return quoted;
  }
  function relatedQuotes(rows, masterId) {
    return (rows || []).filter(
      (row) => row.public_of === masterId && row.supplier_id,
    );
  }
  function statusKey(status) {
    return STATUS_KEY[status] || STATUS_KEY.submitted;
  }
  function memberName(member) {
    return member ? member.name : null;
  }
  const api = {
    STATUSES,
    MESSAGE_TYPES,
    MEMBERS,
    uid,
    normalize,
    normalizeAll,
    lastMessage,
    unreadCount,
    unreadTotal,
    markRead,
    appendMessage,
    addQuote,
    acceptQuote,
    close,
    reopen,
    assign,
    autoAssign,
    responseStats,
    forkForSupplier,
    relatedQuotes,
    statusKey,
    memberName,
  };
  root.MarineMessages = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
