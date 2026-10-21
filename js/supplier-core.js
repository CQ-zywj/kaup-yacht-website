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
  const PRODUCT_STATUSES = ["draft", "pending", "active", "inactive", "rejected"];
  const ARTICLE_STATUSES = ["draft", "published", "scheduled"];
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
    if (p.status === "published") return "active";
    return PRODUCT_STATUSES.includes(p.status) ? p.status : "active";
  }
  function statusKey(status) {
    return (
      {
        draft: "statusDraft",
        pending: "statusPending",
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
    if (!String(a.title?.zh || "").trim()) e.title_zh = "required";
    if (!String(a.title?.en || "").trim()) e.title_en = "required";
    if (!String(a.content_html?.zh || "").trim()) e.content_zh = "required";
    if (!["draft", "published", "scheduled"].includes(a.status))
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
  function seedDemo(storage, supplierId, profile) {
    if (!["s1", "demo-supplier"].includes(supplierId)) return false;
    if (storage.getItem("demo_supplier_seeded") === "1") return false;
    const now = new Date().toISOString();
    const certs = [
      {
        id: "cert-demo-1",
        supplier_id: supplierId,
        category: "company",
        name: "营业执照",
        no: "91210200DEMO1234X",
        issuer: "大连市市场监督管理局",
        valid_from: "2024-01-01",
        valid_to: "2034-01-01",
        ownership: "own",
        status: "verified",
        product_ids: [],
        files: ["business-license.jpg"],
        auth_files: [],
        created_at: now,
        verified_at: now,
      },
      {
        id: "cert-demo-2",
        supplier_id: supplierId,
        category: "product",
        name: "CCS 工厂认可证书",
        no: "CCS-DEMO-2025-018",
        issuer: "中国船级社",
        valid_from: "2025-03-01",
        valid_to: "2028-03-01",
        ownership: "own",
        status: "verified",
        product_ids: ["p01"],
        files: ["ccs-factory.jpg"],
        auth_files: [],
        created_at: now,
        verified_at: now,
      },
      {
        id: "cert-demo-3",
        supplier_id: supplierId,
        category: "system",
        name: "ISO 9001 质量管理体系",
        no: "SGS-CN-DEMO-77821",
        issuer: "SGS",
        valid_from: "2025-01-01",
        valid_to: "2027-12-31",
        ownership: "own",
        status: "verified",
        product_ids: [],
        files: ["iso9001.jpg"],
        auth_files: [],
        created_at: now,
        verified_at: now,
      },
      {
        id: "cert-demo-4",
        supplier_id: supplierId,
        category: "test",
        name: "整艇涂层附着力检测报告",
        no: "TEST-DEMO-2026-04",
        issuer: "第三方检测机构（演示）",
        valid_from: "2026-01-01",
        valid_to: "2028-01-01",
        ownership: "own",
        status: "pending",
        product_ids: ["p02"],
        files: ["msds-report.jpg"],
        auth_files: [],
        created_at: now,
      },
    ];
    const paragraphs = (zh) =>
      `<p>${zh}</p><p>本内容为原型演示文章，用于展示供应商内容中心与店铺主页的联动效果。</p>`;
    const articles = [
      {
        id: "article-demo-1",
        supplier_id: supplierId,
        title: {
          zh: "42 尺飞桥游艇交付前，我们如何做系泊与航行测试",
          en: "How we test a 42ft flybridge yacht before delivery",
        },
        content_html: {
          zh: paragraphs(
            "一条整艇在交付前需要完成系泊试验、航行试验与设备联调。本文按阶段说明我们的检查项与记录方式。",
          ),
          en: paragraphs(
            "Before delivery, every vessel goes through dock trials, sea trials and system commissioning. This note explains our checkpoints.",
          ),
        },
        cover: "assets/media/p01.jpg",
        category: "marine",
        tags: ["整艇", "交付"],
        status: "published",
        publish_at: "2026-10-12T09:00",
        product_ids: ["p01"],
        author: "王海 · 销售经理",
        created_at: now,
        updated_at: now,
        views: 128,
      },
      {
        id: "article-demo-2",
        supplier_id: supplierId,
        title: {
          zh: "整艇出口：交付前要准备哪些合规资料",
          en: "Exporting a yacht: compliance documents before delivery",
        },
        content_html: {
          zh: paragraphs(
            "整艇出口前，船东通常需要 AFS、VOC、船级社证书与设备清单。我们把常见资料整理成一份交付前检查表。",
          ),
          en: paragraphs(
            "Before a yacht is exported, owners usually ask for AFS, VOC, class certificates and an equipment list. Here is our pre-delivery checklist.",
          ),
        },
        cover: "assets/media/p02.jpg",
        category: "marine",
        tags: ["整艇", "合规"],
        status: "published",
        publish_at: "2026-10-08T10:30",
        product_ids: ["p01", "p02"],
        author: "王海 · 销售经理",
        created_at: now,
        updated_at: now,
        views: 86,
      },
      {
        id: "article-demo-3",
        supplier_id: supplierId,
        title: {
          zh: "2026 年秋季展会预告与预约方式",
          en: "Autumn 2026 exhibition schedule and booking",
        },
        content_html: {
          zh: paragraphs("展位与预约信息将在确认后补充，本文为草稿。"),
          en: paragraphs("Booth details will be confirmed later. This is a draft."),
        },
        cover: "assets/media/banner-precision.jpg",
        category: "machine-tools",
        tags: ["展会"],
        status: "draft",
        publish_at: "",
        product_ids: [],
        author: "王海 · 销售经理",
        created_at: now,
        updated_at: now,
        views: 0,
      },
    ];
    const media = [
      {
        id: "media-demo-1",
        supplier_id: supplierId,
        type: "image",
        folder: "product",
        name: "hailan-42-flybridge.jpg",
        url: "assets/media/p01.jpg",
        size: 248000,
        tags: ["整艇", "主图"],
        created_at: now,
      },
      {
        id: "media-demo-2",
        supplier_id: supplierId,
        type: "image",
        folder: "product",
        name: "anti-fouling-coating.jpg",
        url: "assets/media/p09.jpg",
        size: 196000,
        tags: ["涂装"],
        created_at: now,
      },
      {
        id: "media-demo-3",
        supplier_id: supplierId,
        type: "image",
        folder: "company",
        name: "shipyard-overview.jpg",
        url: "assets/media/boats.jpg",
        size: 312000,
        tags: ["工厂实拍"],
        created_at: now,
      },
      {
        id: "media-demo-4",
        supplier_id: supplierId,
        type: "image",
        folder: "article",
        name: "precision-workshop.jpg",
        url: "assets/media/banner-precision.jpg",
        size: 274000,
        tags: ["文章封面"],
        created_at: now,
      },
      {
        id: "media-demo-5",
        supplier_id: supplierId,
        type: "video",
        folder: "company",
        name: "shipyard-tour-demo.mp4",
        url: "",
        size: 18400000,
        tags: ["企业视频", "演示"],
        created_at: now,
      },
    ];
    write(storage, keys.certifications, [
      ...read(storage, keys.certifications),
      ...certs,
    ]);
    write(storage, keys.articles, [...read(storage, keys.articles), ...articles]);
    write(storage, keys.media, [...read(storage, keys.media), ...media]);
    writeSidebar(storage, {
      ...readSidebar(storage),
      [supplierId]: {
        supplier_id: supplierId,
        author_bio: "海岚船艇 · 出口业务团队，专注整艇与配套设备的项目型采购。",
        contact_note: "工作日 9:00–18:00（GMT+8）回复，支持图纸与验厂安排。",
        show_contact: true,
        hot_product_ids: ["p01", "p05"],
        updated_at: now,
      },
    });
    storage.setItem("demo_supplier_seeded", "1");
    return true;
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
    seedDemo,
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
