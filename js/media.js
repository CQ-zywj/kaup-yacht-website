(function () {
  const shell = SupplierShell.mount("consoleMedia");
  if (!shell) return;
  const { body, id } = shell;
  const state = { folder: "all", detail: null };
  const folderKey = {
    product: "mediaFolderProduct",
    article: "mediaFolderArticle",
    company: "mediaFolderCompany",
  };
  function rows() {
    return SupplierCore.media(localStorage, id).sort(
      (a, b) => Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0),
    );
  }
  function readImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  function sizeText(bytes) {
    if (!bytes) return "—";
    if (bytes > 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " MB";
    return Math.round(bytes / 1024) + " KB";
  }
  function card(row) {
    const refs = SupplierCore.mediaRefs(localStorage, row, id);
    return `<button type="button" class="media-card" data-media="${U.e(row.id)}"><span class="media-frame">${
      row.type === "image" && row.url
        ? `<img src="${U.e(row.url)}" alt="${U.e(row.name)}" loading="lazy">`
        : `<span class="media-video">▶</span>`
    }</span><span class="media-body"><strong>${U.e(row.name)}</strong><small>${U.tr(folderKey[row.folder] || "mediaFolderProduct")} · ${sizeText(row.size)} · ${U.tr("mediaRefs")} ${refs}</small></span></button>`;
  }
  function renderGrid() {
    const all = rows();
    const list = all.filter((row) => state.folder === "all" || row.folder === state.folder);
    document.getElementById("media-count").textContent = list.length;
    document.getElementById("media-grid").innerHTML = list.length
      ? list.map(card).join("")
      : U.empty("mediaEmpty", "mediaEmptyHint", "media-library.html", "mediaUpload");
    U.translate();
  }
  function renderTabs() {
    const all = rows();
    const tabs = [{ id: "all", label: "mediaAll", count: all.length }].concat(
      SupplierCore.FOLDERS.map((folder) => ({
        id: folder,
        label: folderKey[folder],
        count: all.filter((row) => row.folder === folder).length,
      })),
    );
    document.getElementById("media-tabs").innerHTML = tabs
      .map(
        (tab) =>
          `<button type="button" data-folder="${tab.id}" aria-pressed="${state.folder === tab.id}">${U.tr(tab.label)} ${tab.count}</button>`,
      )
      .join("");
    document.querySelectorAll("[data-folder]").forEach((button) => {
      button.onclick = () => {
        state.folder = button.dataset.folder;
        renderTabs();
        renderGrid();
      };
    });
  }
  function openDetail(rowId) {
    const row = rows().find((item) => item.id === rowId);
    if (!row) return;
    const refs = SupplierCore.mediaRefs(localStorage, row, id);
    const dialog = document.getElementById("media-dialog");
    dialog.innerHTML = `<div class="drawer-header"><h2>${U.tr("mediaTitle")}</h2><button type="button" class="button secondary" data-close>${U.tr("close")}</button></div><div class="media-detail"><div class="media-preview">${
      row.type === "image" && row.url
        ? `<img src="${U.e(row.url)}" alt="${U.e(row.name)}">`
        : `<div><p>${U.tr("mediaVideoDemo")}</p><small class="muted">${U.e(row.name)}</small></div>`
    }</div><div><h3 style="margin-top:0">${U.e(row.name)}</h3><dl class="param-table"><tbody><tr><th>${U.tr("mediaType")}</th><td>${U.tr(row.type === "video" ? "mediaVideoDemo" : "mediaFolderProduct")}</td></tr><tr><th>${U.tr("mediaFolder")}</th><td>${U.tr(folderKey[row.folder])}</td></tr><tr><th>${U.tr("mediaSize")}</th><td>${sizeText(row.size)}</td></tr><tr><th>${U.tr("mediaRefs")}</th><td>${refs}</td></tr><tr><th>${U.tr("mediaCreated")}</th><td>${U.e(U.date(row.created_at))}</td></tr></tbody></dl><div class="field" style="margin-top:12px"><label for="media-move">${U.tr("mediaMove")}</label><select id="media-move">${SupplierCore.FOLDERS.map(
      (folder) =>
        `<option value="${folder}" ${row.folder === folder ? "selected" : ""}>${U.t(folderKey[folder])}</option>`,
    ).join("")}</select></div><div class="mini-actions" style="margin-top:12px"><button type="button" class="link-button" id="media-copy">${U.tr("mediaCopy")}</button><button type="button" class="link-button danger" id="media-delete">${U.tr("mediaDelete")}</button></div><p class="inline-note" id="media-note">${U.tr("mediaRefHint")}</p></div></div>`;
    dialog.querySelector("[data-close]").onclick = () => dialog.close();
    dialog.querySelector("#media-move").onchange = (event) => {
      const all = SupplierCore.read(localStorage, SupplierCore.keys.media);
      const index = all.findIndex((item) => item.id === row.id);
      if (index < 0) return;
      all[index] = { ...all[index], folder: event.target.value };
      SupplierCore.write(localStorage, SupplierCore.keys.media, all);
      renderTabs();
      renderGrid();
      dialog.close();
    };
    dialog.querySelector("#media-copy").onclick = async () => {
      const note = document.getElementById("media-note");
      try {
        await navigator.clipboard.writeText(row.url || row.name);
        note.textContent = U.t("mediaCopied");
      } catch {
        note.textContent = row.url || row.name;
      }
    };
    dialog.querySelector("#media-delete").onclick = () => {
      if (refs > 0) {
        document.getElementById("media-note").textContent = U.t("mediaDeleteBlocked");
        return;
      }
      if (!window.confirm(U.t("mediaDeleteConfirm"))) return;
      SupplierCore.removeMedia(localStorage, row.id);
      dialog.close();
      renderTabs();
      renderGrid();
    };
    dialog.showModal();
    U.translate();
  }
  body.innerHTML = `<div class="page-intro"><div class="eyebrow">${U.tr("identitySupplier")}</div><h1>${U.tr("mediaTitle")}</h1><p>${U.tr("mediaDesc")}</p></div><div class="upload-strip"><div class="field"><label for="media-folder">${U.tr("mediaFolder")}</label><select id="media-folder">${SupplierCore.FOLDERS.map(
    (folder) => `<option value="${folder}">${U.t(folderKey[folder])}</option>`,
  ).join("")}</select></div><div class="field"><label for="media-tags">${U.tr("mediaTags")}</label><input id="media-tags" placeholder="整艇, 主图"></div><div class="field"><label for="media-files">${U.tr("mediaUpload")}</label><input id="media-files" type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4"></div><button type="button" class="button" id="media-upload">${U.tr("mediaUpload")}</button></div><p class="inline-note">${U.tr("mediaImageHint")} · ${U.tr("mediaVideoHint")}</p><div class="cert-tabs" id="media-tabs" role="group" aria-label="${U.t("mediaFolder")}"></div><div class="panel"><div class="section-head" style="margin-bottom:14px"><div><strong>${U.tr("mediaAll")} <span id="media-count">0</span></strong></div><span class="inline-note">${U.tr("mediaRefHint")}</span></div><div class="media-grid" id="media-grid"></div></div><dialog id="media-dialog" aria-label="${U.t("mediaTitle")}"></dialog>`;
  document.getElementById("media-grid").addEventListener("click", (event) => {
    const target = event.target.closest("[data-media]");
    if (target) openDetail(target.dataset.media);
  });
  document.getElementById("media-upload").onclick = async () => {
    const input = document.getElementById("media-files");
    const files = [...input.files];
    if (!files.length) {
      U.notice("batchNoFile");
      return;
    }
    const folder = document.getElementById("media-folder").value;
    const tags = document
      .getElementById("media-tags")
      .value.split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    let added = 0;
    for (const file of files) {
      const isVideo = file.type.startsWith("video/");
      if (!isVideo && !file.type.startsWith("image/")) continue;
      if (!isVideo && file.size > 2.5 * 1024 * 1024) {
        U.notice("mediaTooLarge");
        continue;
      }
      let url = "";
      if (!isVideo) {
        try {
          url = await readImage(file);
        } catch {
          continue;
        }
      }
      try {
        SupplierCore.addToMedia(localStorage, id, file, {
          type: isVideo ? "video" : "image",
          folder,
          tags,
          url,
        });
        added += 1;
      } catch {
        U.notice("storageError");
        break;
      }
    }
    input.value = "";
    if (added) {
      renderTabs();
      renderGrid();
      U.notice("mediaUploaded");
    }
  };
  renderTabs();
  renderGrid();
  window.addEventListener("storage", (event) => {
    if (["media_library", "articles", "draft_products", "supplier_profile"].includes(event.key)) {
      renderTabs();
      renderGrid();
    }
  });
  window.addEventListener("languagechange", () => {
    renderTabs();
    renderGrid();
  });
})();
