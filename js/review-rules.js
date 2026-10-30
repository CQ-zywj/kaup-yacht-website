/* 机审规则引擎 —— 二值判定（通过 / 驳回）
 *
 * 规则编号即驳回码，与《机审规则清单》一一对应，不做二次映射。
 * 约定：test(payload, ctx) 返回 null 表示通过，返回 { field?, detail? } 表示驳回。
 * 未提供 test 的规则只作登记（依赖 OCR / 工商接口 / 图像识别），
 * 后端能力接入后补上 test 即生效，调用方无需改动。
 *
 * 执行顺序 = 数组顺序，命中第一条即返回（只告诉用户一个原因，避免一次驳回一串）。
 */
(function (root) {
  const ui = () => root.MarineUI || null;
  const lang = () => (ui() ? ui().lang : "en");
  const pick = (pair) => pair[lang() === "en" ? 1 : 0];
  const trim = (v) => String(v == null ? "" : v).trim();

  function stripHtml(html) {
    return String(html || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* 统一社会信用代码（GB 32100-2015）校验位算法，纯本地计算 */
  const USCC_CHARS = "0123456789ABCDEFGHJKLMNPQRTUWXY";
  const USCC_WEIGHTS = [1, 3, 9, 27, 19, 26, 16, 17, 20, 29, 25, 13, 8, 24, 10, 30, 28];
  function validUSCC(code) {
    const v = trim(code).toUpperCase();
    if (!/^[0-9A-HJ-NPQRTUWXY]{18}$/.test(v)) return false;
    let sum = 0;
    for (let i = 0; i < 17; i += 1) sum += USCC_CHARS.indexOf(v[i]) * USCC_WEIGHTS[i];
    const c = 31 - (sum % 31);
    return USCC_CHARS[c === 31 ? 0 : c] === v[17];
  }

  /* 联系方式：B2B 平台最常见的逃单路径。
   * 手机号不靠正则边界判断——出海场景普遍写 +86 / 86 前缀，也会用空格、短横分隔，
   * 统一取数字串去做归一化比对更稳。 */
  const CONTACT_RES = [
    { re: /[\w.+-]+@[\w-]+\.[a-z]{2,}/i, label: "邮箱" },
    { re: /(?:https?:\/\/|www\.)[^\s<>"']+/i, label: "网址" },
    { re: /(?:微信|wechat|whatsapp|skype|telegram|line|qq)\s*[:：]?\s*([a-z0-9_.+-]{4,})/i, label: "即时通讯号" },
    { re: /(?:电话|手机|联系|tel|phone|mobile|contact)\s*[:：]?\s*(\+?[\d\s()-]{7,})/i, label: "电话" },
  ];

  function normalizeDigits(text) {
    return String(text || "")
      .replace(/[\uFF10-\uFF19]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
      .replace(/[\uFF0B]/g, "+");
  }

  /* 从任意文本里挑出手机号：11 位 1[3-9] 开头，或带 86 前缀的 13 位 */
  function findPhone(text) {
    const runs = normalizeDigits(text).match(/\d[\d\s()-]{6,}\d/g) || [];
    for (const run of runs) {
      const digits = run.replace(/\D/g, "");
      if (/^1[3-9]\d{9}$/.test(digits)) return digits;
      const local = digits.replace(/^0+/, "");
      if (/^861[3-9]\d{9}$/.test(local)) return local;
      if (/^1[3-9]\d{9}$/.test(local)) return local;
    }
    return "";
  }

  /* 广告法极限词。注意刻意排除「最大 / 最高」：
   * 游艇参数里「最大航速、最大载客、最大功率」是标准术语，不能一刀切。 */
  const BANNED_ZH = [
    "最好", "最佳", "最强", "最高级", "最先进", "最低价", "全网最低",
    "第一品牌", "全国第一", "行业第一", "唯一指定", "顶级", "国家级",
    "世界级", "史无前例", "绝对领先", "完美无瑕", "100%保证",
  ];
  const BANNED_EN = [
    "best in class", "world-class", "world class", "number one", "no.1",
    "#1", "leading brand", "100% guaranteed", "perfect quality",
  ];

  function findContact(text) {
    const s = normalizeDigits(text);
    for (const item of CONTACT_RES) {
      const m = s.match(item.re);
      if (m) return { label: item.label, value: trim(m[1] || m[0]) };
    }
    const phone = findPhone(s);
    return phone ? { label: "手机号", value: phone } : null;
  }
  function findBanned(text) {
    const s = String(text || "").toLowerCase();
    for (const w of BANNED_ZH) if (s.includes(w.toLowerCase())) return w;
    for (const w of BANNED_EN) if (s.includes(w)) return w;
    return "";
  }

  function productText(p) {
    const i = p && p.i18n ? p.i18n : {};
    return [i.zh?.title, i.zh?.description, i.en?.title, i.en?.description]
      .filter(Boolean)
      .join(" \n ");
  }
  function articleText(a) {
    return [a?.title?.zh, a?.title?.en, stripHtml(a?.content_html?.zh), stripHtml(a?.content_html?.en)]
      .filter(Boolean)
      .join(" \n ");
  }

  const RULES = [
    /* ================= 企业主体 ================= */
    {
      id: "S01",
      target: "profile",
      rule: "统一社会信用代码校验",
      msg: ["统一社会信用代码校验未通过，请对照营业执照重新填写", "The unified social credit code failed validation."],
      test(p) {
        if (!trim(p && p.uscc)) return null; // 当前表单尚无该字段，留待后端补充
        return validUSCC(p.uscc) ? null : { field: "uscc", detail: trim(p.uscc) };
      },
    },
    {
      id: "S03",
      target: "profile",
      rule: "公司名称有效",
      msg: ["公司名称缺失，或使用了「test / demo / 暂无」之类的占位内容", "Company name is missing or a placeholder."],
      test(p) {
        const name = trim(p && p.company);
        if (!name) return { field: "company" };
        if (name.length < 4) return { field: "company", detail: name };
        if (/^(test|demo|abc|xxx|暂无|待定|未填写|公司|企业)$/i.test(name)) return { field: "company", detail: name };
        return null;
      },
    },
    { id: "S02", target: "profile", rule: "营业执照图片可读", msg: ["营业执照照片不清晰，请重新拍摄（四角完整、文字可辨）", "Business licence photo is not legible."] },
    { id: "S04", target: "profile", rule: "登记状态正常", msg: ["营业执照状态异常（注销 / 吊销 / 停业），无法入驻", "Business registration is not active."] },
    { id: "S05", target: "profile", rule: "经营范围含船舶相关", msg: ["经营范围未包含船舶制造或销售，请变更后再提交", "Business scope does not cover boat building or sales."] },
    { id: "S06", target: "profile", rule: "营业执照在有效期内", msg: ["营业执照已过期", "Business licence has expired."] },
    { id: "S07", target: "profile", rule: "未列入经营异常名录", msg: ["主体存在经营异常记录，请联系平台说明情况", "The company has an abnormal-operation record."] },
    { id: "S08", target: "profile", rule: "法人与注册地址一致", msg: ["法定代表人或注册地址与登记信息不一致", "Legal representative or address does not match registration."] },

    /* ================= 商品 ================= */
    {
      id: "P01",
      target: "product",
      rule: "必填项完整",
      msg: ["有必填项未填写，请补全后重新提交", "Some required fields are empty."],
      test(p) {
        const i = p.i18n || {};
        const t = p.trade || {};
        const miss = [];
        if (!trim(i.zh?.title)) miss.push("title_zh");
        if (!trim(i.zh?.description)) miss.push("description_zh");
        if (!trim(p.category_id)) miss.push("subcategory_id");
        if (!(Number(t.moq) > 0)) miss.push("moq");
        if (!(Number(t.lead_time) > 0)) miss.push("lead_time");
        if (!(Number(t.price_min) > 0)) miss.push("price_min");
        if (!(Number(t.price_max) > 0)) miss.push("price_max");
        if (!trim(t.unit)) miss.push("unit");
        return miss.length ? { field: miss[0], detail: miss.join(" / ") } : null;
      },
    },
    {
      id: "P04",
      target: "product",
      rule: "价格区间逻辑",
      msg: ["价格区间有误：最高价不得低于最低价，且均须大于 0", "Price range is invalid: max must be at least min and both above zero."],
      test(p) {
        const t = p.trade || {};
        const min = Number(t.price_min);
        const max = Number(t.price_max);
        return max >= min && min > 0 ? null : { field: "price_max", detail: `${min} → ${max}` };
      },
    },
    {
      id: "P07",
      target: "product",
      rule: "联系方式检测",
      /* 业务决定：平台允许商品内出现站外联系方式，本条不拦截。
       * 保留 test 与文案，需要恢复管控时把 disabled 去掉即可。 */
      disabled: true,
      msg: ["内容含联系方式或站外链接，请删除后重新提交", "Content contains contact details or off-site links."],
      test(p) {
        const hit = findContact(productText(p));
        return hit ? { detail: `${hit.label}：${hit.value}` } : null;
      },
    },
    {
      id: "P08",
      target: "product",
      rule: "广告法极限词",
      /* 业务决定：商品描述中的极限词不拦截。注意这是广告法第九条明令禁止的表述，
       * 放开意味着合规风险回到供应商侧（平台仍保留下架权）。需要恢复时去掉 disabled。 */
      disabled: true,
      msg: ["含广告法禁用表述，请改为客观描述", "Contains advertising-law restricted wording."],
      test(p) {
        const word = findBanned(productText(p));
        return word ? { detail: word } : null;
      },
    },
    {
      id: "P09",
      target: "product",
      rule: "主图数量",
      msg: ["请至少上传 1 张产品图片", "Upload at least one product image."],
      test(p) {
        return (p.media || []).filter(Boolean).length ? null : { field: "images" };
      },
    },
    {
      id: "P16",
      target: "product",
      rule: "中英文同时存在",
      msg: ["出海商品需同时提供英文标题与英文描述", "Listings need both English title and description."],
      test(p) {
        if (!trim(p.i18n?.en?.title)) return { field: "title_en" };
        if (!trim(stripHtml(p.i18n?.en?.description))) return { field: "description_en" };
        return null;
      },
    },
    {
      id: "P17",
      target: "product",
      rule: "重复铺货",
      msg: ["与已发布商品重复，请勿重复铺货", "Duplicate of an existing listing."],
      test(p, ctx) {
        const key = (s) => trim(s).toLowerCase().replace(/\s+/g, " ");
        const mine = key(p.i18n?.zh?.title || p.i18n?.en?.title);
        if (!mine) return null;
        const dup = (ctx && ctx.existing ? ctx.existing : []).find(
          (row) => row && row.id !== p.id && key(row.i18n?.zh?.title || row.i18n?.en?.title) === mine,
        );
        return dup ? { detail: dup.id } : null;
      },
    },
    {
      id: "P02",
      target: "product",
      rule: "标题长度",
      msg: ["标题长度不符合要求（中文 8–80 字，英文 10–120 字符）", "Title length is out of range (Chinese 8–80, English 10–120)."],
      test(p) {
        const zh = trim(p.i18n?.zh?.title);
        const en = trim(p.i18n?.en?.title);
        if (zh && (zh.length < 8 || zh.length > 80)) return { field: "title_zh", detail: `${zh.length}` };
        if (en && (en.length < 10 || en.length > 120)) return { field: "title_en", detail: `${en.length}` };
        return null;
      },
    },
    {
      id: "P03",
      target: "product",
      rule: "描述长度",
      msg: ["描述过短，请补充规格与应用场景（中文 ≥50 字，英文 ≥80 字符）", "Description is too short (Chinese ≥50 characters, English ≥80)."],
      test(p) {
        const zh = trim(stripHtml(p.i18n?.zh?.description));
        const en = trim(stripHtml(p.i18n?.en?.description));
        if (zh && zh.length < 50) return { field: "description_zh", detail: `${zh.length}` };
        if (en && en.length < 80) return { field: "description_en", detail: `${en.length}` };
        return null;
      },
    },
    { id: "P05", target: "product", rule: "数量与交期有效", msg: ["MOQ 或交期必须大于 0", "MOQ and lead time must be greater than zero."] },
    { id: "P06", target: "product", rule: "HS 编码格式", msg: ["HS 编码应为 6–10 位数字", "HS code must be 6–10 digits."] },
    { id: "P10", target: "product", rule: "图片分辨率", msg: ["图片分辨率过低（短边需 ≥800px）", "Image resolution too low (short edge ≥800px)."] },
    { id: "P11", target: "product", rule: "图片格式与大小", msg: ["图片格式或大小不符合要求（单张 ≤5MB）", "Image format or size not allowed (≤5MB each)."] },
    { id: "P12", target: "product", rule: "图片含联系方式", msg: ["图片中含联系方式，请更换图片", "Image contains contact details."] },
    { id: "P13", target: "product", rule: "图片含第三方平台水印", msg: ["图片含其他平台水印，请更换为自有图片", "Image carries another platform's watermark."] },
    { id: "P14", target: "product", rule: "总长与类目匹配", msg: ["总长与所选类目不符，请检查类目或参数", "Overall length does not match the category."] },
    { id: "P15", target: "product", rule: "参数单位一致", msg: ["参数单位缺失或不统一", "Parameter units missing or inconsistent."] },
    { id: "P18", target: "product", rule: "产品视频规格", msg: ["视频格式或大小不符合要求", "Video format or size not allowed."] },

    /* ================= 文章 ================= */
    {
      id: "A01",
      target: "article",
      rule: "标题与正文非空",
      msg: ["请填写文章标题与英文正文", "Article title and English body are required."],
      test(a) {
        if (!trim(a.title?.en)) return { field: "title_en" };
        if (!stripHtml(a.content_html?.en)) return { field: "body_en" };
        return null;
      },
    },
    {
      id: "A02",
      target: "article",
      rule: "英文正文词数",
      msg: ["英文正文不少于 10 词", "English body must be at least 10 words."],
      test(a) {
        const words = stripHtml(a.content_html?.en).split(/\s+/).filter(Boolean).length;
        return words >= 10 ? null : { field: "body_en", detail: `${words} words` };
      },
    },
    {
      id: "A03",
      target: "article",
      rule: "联系方式与外链",
      /* 业务决定：文章允许出现联系方式与站外 URL，本条不拦截。 */
      disabled: true,
      msg: ["文章含联系方式或站外链接，请删除后重新提交", "Article contains contact details or external links."],
      test(a) {
        const hit = findContact(articleText(a));
        return hit ? { detail: `${hit.label}：${hit.value}` } : null;
      },
    },
    {
      id: "A04",
      target: "article",
      rule: "广告法极限词",
      /* 业务决定：文章中的极限词不拦截，与商品口径一致（P08）。
       * 词库与判定逻辑保留，恢复管控去掉 disabled 即可。 */
      disabled: true,
      msg: ["含广告法禁用表述，请改为客观描述", "Contains advertising-law restricted wording."],
      test(a) {
        const word = findBanned(articleText(a));
        return word ? { detail: word } : null;
      },
    },
    { id: "A05", target: "article", rule: "封面图规格", msg: ["封面图尺寸或大小不符合要求（1200×630，≤2MB）", "Cover image must be 1200×630 and ≤2MB."] },
    { id: "A06", target: "article", rule: "正文配图规格", msg: ["正文配图格式或大小不符合要求（≤2MB）", "Body images must be ≤2MB."] },

    /* ================= 认证资质 ================= */
    {
      id: "C01",
      target: "cert",
      rule: "证书在有效期内",
      msg: ["证书已过期，请更新后重新提交", "The certificate has expired."],
      test(c) {
        const to = trim(c.valid_to);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(to)) return { field: "valid_to" };
        const today = new Date().toISOString().slice(0, 10);
        return to >= today ? null : { field: "valid_to", detail: to };
      },
    },
    {
      id: "C03",
      target: "cert",
      rule: "证书编号合规",
      msg: ["证书编号缺失或格式不正确", "Certificate number is missing or malformed."],
      test(c) {
        const no = trim(c.no);
        return no.length >= 4 && /^[A-Za-z0-9\-/]+$/.test(no) ? null : { field: "no", detail: no };
      },
    },
    {
      id: "C05",
      target: "cert",
      rule: "CE 设计类别合法",
      msg: ["CE 设计类别应为 A / B / C / D", "CE design category must be A, B, C or D."],
      test(c) {
        const v = trim(c.design_category);
        if (!v) return null;
        return ["A", "B", "C", "D"].includes(v.toUpperCase()) ? null : { field: "design_category", detail: v };
      },
    },
    { id: "C02", target: "cert", rule: "证书图片可读", msg: ["证书图片不清晰，请上传完整页面的扫描件", "Certificate scan is not legible."] },
    { id: "C04", target: "cert", rule: "艇长与 CE 适用性", msg: ["24 米以上游艇不适用 RCD，请改提交船级社证书", "RCD does not apply to craft of 24m and over."] },
    { id: "C06", target: "cert", rule: "证书文件规格", msg: ["文件超出大小或数量限制（图片 ≤5MB / PDF ≤10MB）", "File exceeds the size or count limit."] },
    { id: "C07", target: "cert", rule: "证书类型与类目匹配", msg: ["证书类型与主营类目不匹配", "Certificate type does not match the category."] },
    { id: "C08", target: "cert", rule: "颁发机构非占位词", msg: ["请填写真实的证书颁发机构", "Please enter the real issuing body."] },

    /* ================= 素材 ================= */
    {
      id: "M02",
      target: "media",
      rule: "文件大小上限",
      msg: ["文件超出大小上限（图片 ≤5MB，视频 ≤200MB）", "File exceeds the size limit (image ≤5MB, video ≤200MB)."],
      test(m) {
        const limit = m.type === "video" ? 200 * 1024 * 1024 : 5 * 1024 * 1024;
        return Number(m.size || 0) > limit ? { detail: `${Math.round(Number(m.size) / 1024 / 1024)}MB` } : null;
      },
    },
    { id: "M01", target: "media", rule: "文件类型白名单", msg: ["不支持该文件类型", "This file type is not supported."] },
    { id: "M03", target: "media", rule: "视频编码", msg: ["视频需为 MP4（H.264）格式", "Video must be MP4 (H.264)."] },
    /* 业务决定：图片仍拦——含联系方式或其他平台水印一律驳回（与 P12/P13 同口径）。
     * 依赖 OCR / 图像识别，接入后补上 test 即生效。 */
    { id: "M04", target: "media", rule: "图片含联系方式或水印", msg: ["图片含联系方式或其他平台水印，请更换", "Image contains contact details or another platform's watermark."] },
    { id: "M05", target: "media", rule: "图片分辨率", msg: ["图片分辨率过低（短边需 ≥800px）", "Image resolution too low (short edge ≥800px)."] },
  ];

  function run(target, payload, ctx) {
    const list = RULES.filter(
      (r) => r.target === target && !r.disabled && typeof r.test === "function",
    );
    for (const rule of list) {
      const hit = rule.test(payload || {}, ctx || {});
      if (hit) {
        return {
          pass: false,
          code: rule.id,
          rule: rule.rule,
          message: rule.msg,
          field: hit.field || "",
          detail: hit.detail || "",
        };
      }
    }
    return { pass: true, code: "", rule: "", message: ["", ""], field: "", detail: "" };
  }

  function messageOf(code) {
    const rule = RULES.find((r) => r.id === code);
    return rule ? pick(rule.msg) : "";
  }

  /* 驳回提示：只给中文原因，不向用户暴露规则编号以外的技术细节 */
  function showRejection(result, opts) {
    const U = ui();
    const modal = typeof document !== "undefined" ? document.getElementById("feedback") : null;
    if (!U || !modal || !result) return false;
    const options = opts || {};
    modal.innerHTML = `<div class="modal-body"><div class="success-icon">!</div><h2>${U.tr("rvTitle")}</h2><p>${U.e(pick(result.message))}</p>${result.detail ? `<p class="muted">${U.e(result.detail)}</p>` : ""}<p class="muted"><small>${U.e(result.code)}</small></p><div class="actions">${options.link ? `<a class="button" href="${U.url(options.link.page, options.link.params || {})}">${U.tr(options.link.label)}</a>` : ""}<button type="button" class="button secondary" id="close-feedback">${U.tr("close")}</button></div></div>`;
    modal.showModal();
    const close = document.getElementById("close-feedback");
    if (close) close.onclick = () => modal.close();
    return true;
  }

  const api = {
    RULES,
    run,
    messageOf,
    showRejection,
    validUSCC,
    findContact,
    findPhone,
    findBanned,
    stripHtml,
    implemented: (target) =>
      RULES.filter((r) => r.target === target && !r.disabled && typeof r.test === "function").map((r) => r.id),
    pending: (target) =>
      RULES.filter((r) => r.target === target && !r.disabled && typeof r.test !== "function").map((r) => r.id),
    disabled: (target) =>
      RULES.filter((r) => (!target || r.target === target) && r.disabled).map((r) => r.id),
  };

  root.ReviewRules = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
