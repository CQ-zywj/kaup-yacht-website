/* 批量导入商品：CSV 模板下载 → 解析校验 → 逐行结果 → 写入本地草稿 */
(function () {
  const shell = SupplierShell.mount("consoleBulk");
  if (!shell) return;
  const { body, id, profile } = shell;

  const COLUMNS = [
    ["category_id", true],
    ["subcategory_id", true],
    ["title_zh", true],
    ["title_en", true],
    ["description_zh", true],
    ["description_en", true],
    ["moq", true],
    ["lead_time", true],
    ["price_min", true],
    ["price_max", true],
    ["unit", true],
    ["incoterms", false],
    ["image", false],
  ];
  const REQUIRED = COLUMNS.filter(([, required]) => required).map(([key]) => key);
  const INCOTERMS = ["EXW", "FOB", "CIF", "DAP"];
  const SAMPLE = [
    ["boats", "yacht", "38 英尺豪华游艇", "38ft Luxury Yacht", "双柴油机，适合近海巡航。", "Twin diesel engines for coastal cruising.", "1", "120", "180000", "260000", "unit", "FOB", ""],
    ["equipment", "engine", "舷外机 300HP", "Outboard Engine 300HP", "四冲程电喷，含数字油门。", "Four-stroke EFI with digital throttle.", "2", "30", "12000", "16000", "unit", "CIF", ""],
  ];

  let parsed = null;
  let source = "";

  function csvCell(value) {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }
  function toCsv(rows) {
    return "\ufeff" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  }
  function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (quoted) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i++;
          } else quoted = false;
        } else field += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ",") {
        row.push(field);
        field = "";
      } else if (ch === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (ch !== "\r") field += ch;
    }
    if (field.length || row.length) {
      row.push(field);
      rows.push(row);
    }
    return rows.filter((r) => r.some((cell) => String(cell).trim() !== ""));
  }

  function validateRow(record, line) {
    const errors = [];
    const category = U.cat(record.category_id);
    if (!category) errors.push("category_id");
    if (category && !category.subcategories.some((s) => s.id === record.subcategory_id))
      errors.push("subcategory_id");
    ["title_zh", "title_en", "description_zh", "description_en", "unit"].forEach((key) => {
      if (!String(record[key] || "").trim()) errors.push(key);
    });
    const numbers = {
      moq: Number(record.moq),
      lead_time: Number(record.lead_time),
      price_min: Number(record.price_min),
      price_max: Number(record.price_max),
    };
    Object.entries(numbers).forEach(([key, value]) => {
      if (!Number.isFinite(value) || value <= 0) errors.push(key);
    });
    if (
      Number.isFinite(numbers.price_min) &&
      Number.isFinite(numbers.price_max) &&
      numbers.price_max < numbers.price_min
    )
      errors.push("price_max");
    const incoterms = String(record.incoterms || "").trim().toUpperCase() || "FOB";
    if (!INCOTERMS.includes(incoterms)) errors.push("incoterms");
    return {
      line,
      record,
      errors: [...new Set(errors)],
      numbers,
      incoterms,
      valid: errors.length === 0,
    };
  }

  function build(text) {
    const rows = parseCsv(text);
    if (!rows.length) return { rows: [], missing: REQUIRED, header: [] };
    const header = rows[0].map((cell) => String(cell).trim().toLowerCase());
    const missing = REQUIRED.filter((key) => !header.includes(key));
    if (missing.length) return { rows: [], missing, header };
    const data = rows.slice(1).map((cells, index) => {
      const record = {};
      header.forEach((key, column) => {
        record[key] = String(cells[column] ?? "").trim();
      });
      return validateRow(record, index + 2);
    });
    return { rows: data, missing: [], header };
  }

  function rowToProduct(row) {
    const record = row.record;
    const category = record.category_id;
    return {
      id: "draft-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      industry_id: MarineCore.industryForCategory(category),
      category_id: category,
      subcategory_id: record.subcategory_id,
      i18n: {
        zh: { title: record.title_zh, description: record.description_zh },
        en: { title: record.title_en, description: record.description_en },
      },
      media: [record.image || "assets/media/" + category + ".jpg"],
      parameters: {},
      compliance: {},
      certifications: [],
      supplier_id: id,
      supplier: {
        ...MarineAccounts.supplier(profile),
        products_count: 1,
      },
      trade: {
        moq: row.numbers.moq,
        lead_time: row.numbers.lead_time,
        price_min: row.numbers.price_min,
        price_max: row.numbers.price_max,
        unit: record.unit,
        incoterms: [row.incoterms],
        currency: "USD",
      },
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  function render() {
    body.innerHTML = `<div class="console-head"><div><h2>${U.tr("bulkTitle")}</h2><p class="muted">${U.tr("bulkDesc")}</p></div><div class="console-actions"><a class="button secondary" href="${U.url("supplier.html")}">${U.tr("myProducts")}</a></div></div><div class="bulk-grid"><section class="panel"><h3>${U.tr("bulkStep1")}</h3><p class="muted">${U.tr("bulkColumnGuide")}</p><button type="button" class="button secondary" id="bulk-download">${U.tr("bulkDownload")}</button><table class="param-table bulk-guide"><thead><tr><th>${U.tr("bulkCol")}</th><th>${U.tr("bulkColRequired")}</th></tr></thead><tbody>${COLUMNS.map(([key, required]) => `<tr><th scope="row">${U.e(key)}</th><td>${U.tr(required ? "bulkColYes" : "bulkColNo")}</td></tr>`).join("")}</tbody></table></section><section class="panel"><h3>${U.tr("bulkStep2")}</h3><div class="field"><label for="bulk-file">${U.tr("bulkChooseFile")}</label><input type="file" id="bulk-file" accept=".csv,text/csv"></div><div class="field"><label for="bulk-text">${U.tr("bulkPasteLabel")}</label><textarea id="bulk-text" rows="8" placeholder="${U.e(COLUMNS.map(([k]) => k).join(","))}"></textarea><small class="muted">${U.tr("bulkPasteHint")}</small></div><button type="button" class="button" id="bulk-parse">${U.tr("bulkParse")}</button></section><section class="panel bulk-result"><h3>${U.tr("bulkStep3")}</h3><p class="muted">${U.tr("bulkImportHint")}</p><div id="bulk-summary"></div><div id="bulk-preview"></div></section></div>`;
    document.getElementById("bulk-download").onclick = download;
    document.getElementById("bulk-file").onchange = onFile;
    document.getElementById("bulk-parse").onclick = () => {
      const text = document.getElementById("bulk-text").value;
      run(text, "paste");
    };
    if (parsed) paint();
    U.translate();
  }

  function download() {
    const header = COLUMNS.map(([key]) => key);
    const csv = toCsv([header, ...SAMPLE]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "product-import-template.csv";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function onFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) {
      U.notice("bulkFileError");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      document.getElementById("bulk-text").value = String(reader.result || "");
      run(String(reader.result || ""), file.name);
    };
    reader.onerror = () => U.notice("storageError");
    reader.readAsText(file, "utf-8");
  }

  function run(text, name) {
    source = name || "";
    if (!String(text || "").trim()) {
      parsed = null;
      U.notice("bulkEmpty");
      paint();
      return;
    }
    parsed = build(text);
    paint();
  }

  function paint() {
    const summary = document.getElementById("bulk-summary");
    const preview = document.getElementById("bulk-preview");
    if (!summary || !preview) return;
    if (!parsed) {
      summary.innerHTML = `<p class="muted">${U.tr("bulkEmpty")}</p>`;
      preview.innerHTML = "";
      return;
    }
    if (parsed.missing.length) {
      summary.innerHTML = `<div class="warning">${U.t("bulkHeaderError").replace("{cols}", parsed.missing.join(", "))}</div>`;
      preview.innerHTML = "";
      return;
    }
    if (!parsed.rows.length) {
      summary.innerHTML = `<div class="warning">${U.tr("bulkNoRows")}</div>`;
      preview.innerHTML = "";
      return;
    }
    const ok = parsed.rows.filter((row) => row.valid).length;
    const bad = parsed.rows.length - ok;
    summary.innerHTML = `<div class="bulk-summary-row"><span class="status verified">${U.tr("bulkValid")} <b>${ok}</b></span><span class="status rejected">${U.tr("bulkInvalid")} <b>${bad}</b></span><button type="button" class="button" id="bulk-run"${ok ? "" : " disabled"}>${U.tr("bulkRun")}</button></div>`;
    preview.innerHTML = `<div class="scroll-x"><table class="console-table"><thead><tr><th>${U.tr("bulkRowNo")}</th><th>${U.tr("titleZh")}</th><th>${U.tr("productGroup")}</th><th>${U.tr("status")}</th><th>${U.tr("bulkResultTitle")}</th></tr></thead><tbody>${parsed.rows
      .map(
        (row) =>
          `<tr class="${row.valid ? "" : "row-invalid"}"><td>${row.line}</td><td>${U.e(row.record.title_zh || row.record.title_en || "—")}</td><td>${U.e(row.record.category_id || "—")}</td><td><span class="status ${row.valid ? "verified" : "rejected"}">${U.tr(row.valid ? "bulkValid" : "bulkInvalid")}</span></td><td>${row.valid ? `${U.e(row.record.unit)} · $${row.numbers.price_min}–$${row.numbers.price_max}` : U.e(row.errors.join(", "))}</td></tr>`,
      )
      .join("")}</tbody></table></div>`;
    const runButton = document.getElementById("bulk-run");
    if (runButton) runButton.onclick = () => importRows(ok, bad);
    U.translate();
  }

  function importRows(ok, bad) {
    const rows = U.read("draft_products");
    parsed.rows
      .filter((row) => row.valid)
      .forEach((row) => rows.push(rowToProduct(row)));
    if (!U.write("draft_products", rows)) return;
    U.notice(
      U.t("bulkDone").replace("{ok}", String(ok)).replace("{skip}", String(bad)),
      null,
      "supplier.html",
      "myProducts",
    );
    parsed = null;
    paint();
  }

  render();
  window.addEventListener("languagechange", () => {
    render();
  });
})();
