(function (root) {
  const CERT_CATEGORIES = [
    "company",
    "product",
    "test",
    "system",
    "ip",
    "other",
    "authorization",
  ];
  /* 商品状态：二值机审，无「待审核」停留态。active = 机审通过并上架 */
  const PRODUCT_STATUSES = ["draft", "active", "inactive", "rejected"];
  const ARTICLE_STATUSES = ["draft", "published", "scheduled", "rejected"];
  const FOLDERS = ["product", "article", "company"];
  const keys = {
    certifications: "certifications",
    articles: "articles",
    media: "media_library",
    sidebar: "blog_sidebar",
  };

  function read(storage, key) {
    const raw = storage.getItem(key);
    if (raw === null) return [];
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) throw Error("invalid storage: " + key);
    return value;
  }
  function write(storage, key, rows) {
    if (!Array.isArray(rows)) throw Error("invalid rows: " + key);
    storage.setItem(key, JSON.stringify(rows));
    return rows;
  }
  function readSidebar(storage) {
    const raw = storage.getItem(keys.sidebar);
    if (raw === null) return {};
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw Error("invalid sidebar");
    return value;
  }
  function writeSidebar(storage, value) {
    storage.setItem(keys.sidebar, JSON.stringify(value));
    return value;
  }
  function scoped(rows, supplierId) {
    if (!supplierId) return [];
    return rows.filter((row) => row && row.supplier_id === supplierId);
  }
  function myId(storage) {
    try {
      return root.MarineAccounts.readProfile(storage).id || "";
    } catch {
      return "";
    }
  }
  function normalizeProductStatus(p) {
    if (!p) return "draft";
    if (p.status === "published") return "active"; // 兼容旧数据（含旧版 bug 写入的 published）
    if (p.status === "pending") return "draft"; // 旧数据的待审态无从判断结果，退回草稿由用户重提
    /* 未知状态一律落到 draft：不能让脏数据自动变成对外可见 */
    return PRODUCT_STATUSES.includes(p.status) ? p.status : "draft";
  }
  function statusKey(status) {
    return (
      {
        draft: "statusDraft",
        active: "statusActive",
        published: "statusActive",
        inactive: "statusInactive",
        rejected: "statusRejected",
      }[status] || "statusDraft"
    );
  }
  function certStatusKey(status) {
    return (
      { pending: "certPending", verified: "certVerified", rejected: "certRejected" }[
        status
      ] || "certPending"
    );
  }
  function articleStatusKey(status) {
    return (
      {
        draft: "articleDraft",
        published: "articlePublished",
        scheduled: "articleScheduled",
        rejected: "articleRejected",
      }[status] || "articleDraft"
    );
  }
  function validDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
  }
  function validateCert(c) {
    const e = {};
    if (!c.category || !CERT_CATEGORIES.includes(c.category)) e.category = "required";
    if (!String(c.name || "").trim()) e.name = "required";
    if (!String(c.no || "").trim()) e.no = "required";
    if (!String(c.issuer || "").trim()) e.issuer = "required";
    if (!validDate(c.valid_from)) e.valid_from = "required";
    if (!validDate(c.valid_to)) e.valid_to = "required";
    else if (c.valid_from && c.valid_to < c.valid_from) e.valid_to = "validRange";
    if (!["own", "authorized"].includes(c.ownership)) e.ownership = "required";
    if (c.ownership === "authorized" && !(c.auth_files || []).length)
      e.auth_files = "required";
    if (!c.commitment) e.commitment = "agreeRequired";
    return e;
  }
  function validateArticle(a) {
    const e = {};
    if (!String(a.title?.en || "").trim()) e.title_en = "required";
    const text = String(a.content_html?.en || "").replace(/<[^>]*>/g, "").replace(/&(?:nbsp|#0*160|#x0*a0);/gi, " ").trim();
    if (!text) e.content_en = "required";
    if (!["draft", "published", "scheduled", "rejected"].includes(a.status))
      e.status = "required";
    if (a.status === "scheduled" && !a.publish_at) e.publish_at = "required";
    if (a.status === "scheduled" && a.publish_at && Date.parse(a.publish_at) < Date.now())
      e.publish_at = "futureRequired";
    if ((a.product_ids || []).length > 6) e.product_ids = "tooManyProducts";
    return e;
  }
  function validateMedia(m) {
    const e = {};
    if (!["image", "video"].includes(m.type)) e.type = "required";
    if (!FOLDERS.includes(m.folder)) e.folder = "required";
    if (!String(m.name || "").trim()) e.name = "required";
    if (m.type === "image" && !String(m.url || "").startsWith("data:image"))
      e.url = "required";
    return e;
  }
  function completeness(storage, profile, supplierId) {
    const p = profile || {};
    const companyChecks = [
      !!String(p.company || "").trim(),
      !!String(p.company_en || "").trim(),
      !!String(p.country || "").trim(),
      !!String(p.city || "").trim(),
      !!String(p.contact || "").trim(),
      !!String(p.email || "").trim(),
      !!String(p.phone || "").trim(),
      !!String(p.intro?.zh || "").trim(),
      !!String(p.logo || "").trim(),
      !!String(p.address || "").trim(),
    ];
    let certs = [];
    let products = [];
    let articles = [];
    try {
      certs = scoped(read(storage, keys.certifications), supplierId);
      articles = scoped(read(storage, keys.articles), supplierId);
      products = read(storage, "draft_products")
        .filter((row) => !row.supplier_id || row.supplier_id === supplierId)
        .filter((row) => ["active", "published"].includes(normalizeProductStatus(row)));
    } catch {
      certs = [];
      articles = [];
      products = [];
    }
    const sections = [
      {
        key: "consoleCompany",
        weight: 30,
        ratio: companyChecks.filter(Boolean).length / companyChecks.length,
        hint: "completenessCompanyHint",
      },
      {
        key: "consoleCerts",
        weight: 25,
        ratio: Math.min(certs.filter((c) => c.status === "verified").length / 2, 1),
        hint: "completenessCertsHint",
      },
      {
        key: "consoleProducts",
        weight: 25,
        ratio: Math.min(products.length / 3, 1),
        hint: "completenessProductsHint",
      },
      {
        key: "consoleArticles",
        weight: 20,
        ratio: Math.min(articles.filter((a) => a.status === "published").length / 2, 1),
        hint: "completenessArticlesHint",
      },
    ];
    sections.forEach((section) => {
      section.score = Math.round(section.weight * section.ratio);
      section.percent = Math.round(section.ratio * 100);
    });
    return {
      sections,
      score: sections.reduce((sum, section) => sum + section.score, 0),
      todos: sections.filter((section) => section.ratio < 1),
    };
  }

  function mediaRefs(storage, media, supplierId) {
    let count = 0;
    try {
      const articles = scoped(read(storage, keys.articles), supplierId);
      const products = read(storage, "draft_products").filter(
        (p) => !p.supplier_id || p.supplier_id === supplierId,
      );
      const profile = root.MarineAccounts.readProfile(storage);
      for (const article of articles) if (article.cover === media.url) count += 1;
      for (const product of products)
        if ((product.media || []).includes(media.url)) count += 1;
      if ((profile.photos || []).includes(media.name)) count += 1;
    } catch {
      return count;
    }
    return count;
  }
  function addToMedia(storage, supplierId, file, meta = {}) {
    const rows = read(storage, keys.media);
    const row = {
      id: "media-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      supplier_id: supplierId,
      type: meta.type || "image",
      folder: meta.folder || "product",
      name: file.name,
      url: meta.url || "",
      size: file.size || 0,
      tags: meta.tags || [],
      created_at: new Date().toISOString(),
    };
    rows.push(row);
    write(storage, keys.media, rows);
    return row;
  }
  function pickerHtml(rows, type = "image") {
    const list = rows.filter((row) => !type || row.type === type);
    return list.length
      ? `<div class="media-picker-grid">${list
          .map(
            (row) =>
              `<button type="button" class="media-pick" data-pick-media="${row.id}" data-media-url="${U.e(row.url)}"><span class="media-thumb">${
                row.type === "image"
                  ? `<img src="${U.e(row.url)}" alt="${U.e(row.name)}">`
                  : `<span class="media-video">▶</span>`
              }</span><small>${U.e(row.name)}</small></button>`,
          )
          .join("")}</div>`
      : `<p class="muted">${U.tr("mediaEmpty")}</p>`;
  }
  const api = {
    CERT_CATEGORIES,
    PRODUCT_STATUSES,
    ARTICLE_STATUSES,
    FOLDERS,
    keys,
    read,
    write,
    readSidebar,
    writeSidebar,
    scoped,
    myId,
    normalizeProductStatus,
    statusKey,
    certStatusKey,
    articleStatusKey,
    validateCert,
    validateArticle,
    validateMedia,
    completeness,
    mediaRefs,
    addToMedia,
    pickerHtml,
    certs(storage, id) {
      return scoped(read(storage, keys.certifications), id);
    },
    articles(storage, id) {
      return scoped(read(storage, keys.articles), id);
    },
    media(storage, id) {
      return scoped(read(storage, keys.media), id);
    },
    saveCert(storage, cert) {
      const rows = read(storage, keys.certifications);
      const index = rows.findIndex((row) => row.id === cert.id);
      if (index >= 0) rows[index] = cert;
      else rows.push(cert);
      write(storage, keys.certifications, rows);
      return cert;
    },
    removeCert(storage, id) {
      write(
        storage,
        keys.certifications,
        read(storage, keys.certifications).filter((row) => row.id !== id),
      );
    },
    saveArticle(storage, article) {
      const rows = read(storage, keys.articles);
      const index = rows.findIndex((row) => row.id === article.id);
      if (index >= 0) rows[index] = article;
      else rows.push(article);
      write(storage, keys.articles, rows);
      return article;
    },
    removeArticle(storage, id) {
      write(
        storage,
        keys.articles,
        read(storage, keys.articles).filter((row) => row.id !== id),
      );
    },
    removeMedia(storage, id) {
      write(
        storage,
        keys.media,
        read(storage, keys.media).filter((row) => row.id !== id),
      );
    },
  };
  root.SupplierCore = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
