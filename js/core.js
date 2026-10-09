(function (root) {
  const text = (p) =>
    Object.values(p.i18n || {})
      .map((v) => `${v.title} ${v.description || ""}`)
      .join(" ")
      .concat(
        " ",
        JSON.stringify(p.parameters || {}),
        " ",
        JSON.stringify(p.supplier?.name || {}),
      )
      .toLowerCase();
  const score = (p, q) => {
    q = (q || "").trim().toLowerCase();
    if (!q) return 0;
    const titles = Object.values(p.i18n || {}).map((v) =>
      (v.title || "").toLowerCase(),
    );
    return (
      (titles.some((v) => v === q)
        ? 100
        : titles.some((v) => v.includes(q))
          ? 50
          : 0) + (text(p).includes(q) ? 10 : 0)
    );
  };
  const api = {
    pageNumber(value) {
      const n = Number(value);
      return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
    },
    certificateRecord(type, number, previousImage, newFile) {
      return { type, number, image: newFile?.name || previousImage || "" };
    },
    filterProducts(products, f = {}) {
      return products.filter((p) => {
        if (f.category && p.category_id !== f.category) return false;
        if (f.subcategory && p.subcategory_id !== f.subcategory) return false;
        if (f.q && !text(p).includes(f.q.trim().toLowerCase())) return false;
        if (
          f.cert?.length &&
          !f.cert.some((c) => p.certifications?.some((v) => v.type === c))
        )
          return false;
        return Object.entries(f.params || {}).every(([k, v]) => {
          const val = p.parameters?.[k] ?? p.compliance?.[k];
          if (Array.isArray(v)) return !v.length || v.includes(String(val));
          if (v && typeof v === "object") {
            if (val == null || val === "") return false;
            const n = Number(val);
            return (
              Number.isFinite(n) &&
              (v.min === "" || v.min == null || n >= Number(v.min)) &&
              (v.max === "" || v.max == null || n <= Number(v.max))
            );
          }
          return !v || String(val) === v;
        });
      });
    },
    sortProducts(products, sort, q) {
      return [...products].sort((a, b) =>
        sort === "price"
          ? (Number(a.trade?.price_min) || 0) -
            (Number(b.trade?.price_min) || 0)
          : sort === "relevance"
            ? score(b, q) - score(a, q)
            : Date.parse(b.updated_at) - Date.parse(a.updated_at),
      );
    },
    validateProduct(p) {
      const e = [];
      for (const l of ["zh", "en"])
        for (const k of ["title", "description"])
          if (!p.i18n?.[l]?.[k]?.trim()) e.push(`${k}_${l}`);
      if (p.category_id === "coatings")
        for (const k of [
          "afs",
          "voc",
          "msds",
          "un_number",
          "hazard_class",
          "transport",
        ])
          if (!String(p.compliance?.[k] ?? "").trim()) e.push(k);
      return e;
    },
    viewRfq(r) {
      return { ...r, status: r.status === "submitted" ? "viewed" : r.status };
    },
    replyRfq(r, message, attachments = []) {
      if (!message.trim()) throw Error("empty reply");
      return {
        ...r,
        status: "replied",
        reply: {
          message: message.trim(),
          attachments,
          created_at: new Date().toISOString(),
        },
      };
    },
    readArray(storage, key) {
      const value = JSON.parse(storage.getItem(key) || "[]");
      if (!Array.isArray(value)) throw Error("invalid storage");
      const str = (v) => typeof v === "string";
      const files = (a) =>
        Array.isArray(a) &&
        a.every((f) => f && str(f.name) && Number.isFinite(f.size));
      if (
        key === "rfq_drafts" &&
        value.some(
          (r) =>
            !r ||
            !str(r.id) ||
            !r.buyer ||
            !str(r.buyer.company) ||
            !str(r.buyer.country) ||
            !str(r.message) ||
            (r.target_country !== undefined && !str(r.target_country)) ||
            !Number.isFinite(r.quantity) ||
            r.quantity <= 0 ||
            !Number.isFinite(Date.parse(r.created_at)) ||
            !["submitted", "viewed", "replied"].includes(r.status) ||
            !files(r.attachments) ||
            (r.reply && (!str(r.reply.message) || !files(r.reply.attachments))),
        )
      )
        throw Error("invalid inquiry records");
      if (
        key === "draft_products" &&
        value.some(
          (p) =>
            !p ||
            !str(p.id) ||
            !p.i18n?.zh ||
            !p.i18n?.en ||
            !str(p.i18n.zh.title) ||
            !str(p.i18n.en.title) ||
            !["boats", "equipment", "coatings", "services"].includes(
              p.category_id,
            ) ||
            !p.trade ||
            !Array.isArray(p.trade.incoterms) ||
            !p.supplier ||
            !p.supplier.name ||
            !Array.isArray(p.media) ||
            !p.media.every(str) ||
            !Array.isArray(p.certifications) ||
            !p.certifications.every((c) => c && str(c.type) && str(c.number)),
        )
      )
        throw Error("invalid product records");
      return value;
    },
    writeArray(storage, key, value) {
      storage.setItem(key, JSON.stringify(value));
      return true;
    },
  };
  root.MarineCore = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
