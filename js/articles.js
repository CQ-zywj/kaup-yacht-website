(function () {
  const shell = SupplierShell.mount("consoleArticles");
  if (!shell) return;
  const { body, id } = shell;
  const state = { status: "", q: "", view: "list", editing: null, cover: "" };
  let activeEditor = null;
  function articles() {
    return SupplierCore.articles(localStorage, id).sort(
      (a, b) => Date.parse(b.updated_at || b.created_at || 0) - Date.parse(a.updated_at || a.created_at || 0),
    );
  }
  function filtered() {
    let rows = articles();
    if (state.status) rows = rows.filter((article) => article.status === state.status);
    const needle = state.q.trim().toLowerCase();
    if (needle)
      rows = rows.filter((article) =>
        [article.title?.zh, article.title?.en]
          .map((value) => String(value || "").toLowerCase())
          .some((value) => value.includes(needle)),
      );
    return rows;
  }
  function row(article) {
    return `<article class="article-admin-row">${
      article.cover
        ? `<img src="${U.e(article.cover)}" alt="">`
        : `<div style="width:96px;height:64px;background:#eef2f4;border-radius:4px;display:grid;place-items:center;font-size:11px;color:#647783">${U.tr("articleNoCover")}</div>`
    }<div><h3>${U.bi(article.title)}</h3><small><span class="status ${
      article.status === "published" ? "active" : article.status === "scheduled" ? "pending" : "draft"
    }">${U.tr(SupplierCore.articleStatusKey(article.status))}</span> · ${
      article.publish_at ? U.e(U.date(article.publish_at)) : U.tr("notSet")
    } · ${U.tr("articleViews")} ${article.views || 0}</small><div class="article-admin-actions" style="justify-content:flex-start;margin-top:8px">${(article.tags || [])
      .map((tag) => `<span class="badge">${U.e(tag)}</span>`)
      .join("")}</div></div><div class="article-admin-actions"><button type="button" class="link-button" data-edit="${U.e(article.id)}">${U.tr("edit")}</button><button type="button" class="link-button" data-preview="${U.e(article.id)}">${U.tr("articlePreview")}</button><button type="button" class="link-button danger" data-delete="${U.e(article.id)}">${U.tr("articleDelete")}</button></div></article>`;
  }
  function renderList() {
    const rows = filtered();
    const target = document.getElementById("article-list");
    if (!target) return;
    target.innerHTML = rows.length
      ? rows.map(row).join("")
      : U.empty("articleEmpty", "articleEmptyHint", "supplier-articles.html", "articleNew", "create-article");
    U.translate();
  }
  function sidebarConfig() {
    const all = SupplierCore.readSidebar(localStorage);
    return all[id] || {};
  }
  function renderPage() {
    state.view = "list";
    const config = sidebarConfig();
    const products = U.products().filter(
      (product) => (product.supplier_id || product.supplier.id) === id,
    );
    body.innerHTML = `<div class="page-intro"><div class="eyebrow">${U.tr("identitySupplier")}</div><h1>${U.tr("articlesTitle")}</h1><p>${U.tr("articlesDesc")}</p></div><div class="console-actions"><button type="button" class="button" id="article-new">+ ${U.tr("articleNew")}</button><a class="button secondary" href="${SupplierShell.storefrontUrl(id)}">${U.tr("viewStorefront")}</a></div><div class="panel"><div class="section-head" style="margin-bottom:14px"><div><strong>${U.tr("articleAllStatus")}</strong></div><div class="mini-actions article-filters"><div class="field" style="min-width:150px"><label class="sr-only" for="article-status">${U.tr("articleStatusLabel")}</label><select id="article-status"><option value="">${U.t("articleAllStatus")}</option>${SupplierCore.ARTICLE_STATUSES.map(
      (status) =>
        `<option value="${status}" ${state.status === status ? "selected" : ""}>${U.t(SupplierCore.articleStatusKey(status))}</option>`,
    ).join("")}</select></div><div class="field" style="min-width:200px"><label class="sr-only" for="article-search">${U.tr("articleSearch")}</label><input id="article-search" type="search" placeholder="${U.t("articleSearch")}" value="${U.e(state.q)}"></div></div></div><div class="article-admin-list" id="article-list"></div></div><section class="panel"><h2>${U.tr("articleSidebarTitle")}</h2><p class="inline-note">${U.tr("articleSidebar")}</p><div class="form-grid"><div class="field full"><label for="sidebar-bio">${U.tr("articleAuthorBio")}</label><textarea id="sidebar-bio" maxlength="200">${U.e(config.author_bio || "")}</textarea></div><div class="field full"><label for="sidebar-note">${U.tr("articleContactNote")}</label><input id="sidebar-note" value="${U.e(config.contact_note || "")}"></div><div class="field full"><label class="check-label"><input type="checkbox" id="sidebar-show" ${config.show_contact !== false ? "checked" : ""}>${U.tr("articleShowContact")}</label></div><div class="field full"><span class="field-label">${U.tr("articleHotProducts")}</span><div class="check-list">${products
      .map(
        (product) =>
          `<label><input type="checkbox" name="hot" value="${U.e(product.id)}" ${(config.hot_product_ids || []).includes(product.id) ? "checked" : ""}><span>${U.bi({ zh: product.i18n.zh.title, en: product.i18n.en.title })}</span></label>`,
      )
      .join("") || `<p class="muted">${U.tr("noProducts")}</p>`}</div><small class="inline-note">${U.tr("articleTooMany")}</small></div></div><div class="form-actions"><button type="button" class="button" id="sidebar-save">${U.tr("confirm")}</button></div></section><dialog id="article-preview" aria-label="${U.t("articlePreview")}"></dialog>`;
    document.getElementById("article-new").onclick = () => renderEditor(null);
    document.getElementById("article-status").onchange = (event) => {
      state.status = event.target.value;
      renderList();
    };
    document.getElementById("article-search").oninput = (event) => {
      state.q = event.target.value;
      renderList();
    };
    document.getElementById("article-list").onclick = (event) => {
      if (event.target.closest('[data-empty-action="create-article"]')) { renderEditor(null); return; }
      const edit = event.target.closest("[data-edit]");
      const preview = event.target.closest("[data-preview]");
      const remove = event.target.closest("[data-delete]");
      if (edit) renderEditor(articles().find((article) => article.id === edit.dataset.edit));
      else if (preview) openPreview(articles().find((article) => article.id === preview.dataset.preview));
      else if (remove) {
        if (!window.confirm(U.t("articleDeleteConfirm"))) return;
        SupplierCore.removeArticle(localStorage, remove.dataset.delete);
        renderList();
      }
    };
    document.getElementById("sidebar-save").onclick = () => {
      const hot = [...document.querySelectorAll('[name="hot"]:checked')]
        .map((input) => input.value)
        .slice(0, 4);
      try {
        const all = SupplierCore.readSidebar(localStorage);
        all[id] = {
          supplier_id: id,
          author_bio: document.getElementById("sidebar-bio").value.trim(),
          contact_note: document.getElementById("sidebar-note").value.trim(),
          show_contact: document.getElementById("sidebar-show").checked,
          hot_product_ids: hot,
          updated_at: new Date().toISOString(),
        };
        SupplierCore.writeSidebar(localStorage, all);
        U.notice("articleSidebarSaved");
      } catch {
        U.notice("storageError");
      }
    };
    renderList();
    U.translate();
  }
  function editorToolbar(target) {
    return `<div class="editor-toolbar" data-toolbar="${target}"><button type="button" data-cmd="bold">${U.tr("articleBold")}</button><button type="button" data-cmd="italic">${U.tr("articleItalic")}</button><button type="button" data-cmd="insertUnorderedList">${U.tr("articleList")}</button><button type="button" data-image="${target}">${U.tr("articleInsertImage")}</button></div>`;
  }
  function renderEditor(article) {
    state.view = "editor";
    state.editing = article;
    state.cover = article?.cover || "";
    const products = U.products().filter(
      (product) => (product.supplier_id || product.supplier.id) === id,
    );
    body.innerHTML = `<div class="page-intro"><div class="eyebrow">${U.tr("identitySupplier")}</div><h1>${U.tr(article ? "edit" : "articleNew")}</h1><p>${U.tr("articleEditorHint")}</p></div><form id="article-form" novalidate><div class="panel"><div class="form-grid"><div class="field full"><label for="title_en">${U.tr("articleTitleEn")} <b>*</b></label><input id="title_en" name="title_en" value="${U.e(article?.title?.en || "")}"><small class="error" data-error="title_en"></small></div><div class="field full"><span class="field-label">${U.tr("articleCover")}</span><div class="editor-cover"><img id="cover-preview" src="${U.e(state.cover || "assets/media/banner-platform.jpg")}" alt=""><button type="button" class="button secondary" id="cover-pick">${U.tr("articleCoverPick")}</button><input type="file" id="cover-file" accept="image/png,image/jpeg,image/webp"><small class="error" data-error="cover"></small></div></div><div class="field"><label for="article-category">${U.tr("articleCategory")}</label><select id="article-category" name="category">${MarineData.industries.map(
      (industry) =>
        `<option value="${industry.id}" ${article?.category === industry.id ? "selected" : ""}>${U.bi(industry.name)}</option>`,
    ).join("")}</select></div><div class="field"><label for="article-tags">${U.tr("articleTags")}</label><input id="article-tags" name="tags" value="${U.e((article?.tags || []).join(", "))}" placeholder="整艇, 交付"></div><div class="field"><label for="publish_at">${U.tr("articleSchedule")}</label><input id="publish_at" name="publish_at" type="datetime-local" value="${U.e(article?.publish_at || "")}"><small class="error" data-error="publish_at"></small></div></div><div class="field full" style="margin-top:18px"><label id="body-en-label" for="body_en">${U.tr("articleBodyEn")} <b>*</b></label>${editorToolbar("body_en")}<div class="rich-editor" id="body_en" contenteditable="true" role="textbox" aria-labelledby="body-en-label" aria-multiline="true" aria-required="true">${article?.content_html?.en || ""}</div><small class="error" data-error="content_en"></small></div><div class="field full" style="margin-top:18px"><span class="field-label">${U.tr("articleRelated")}</span><div class="check-list">${products
      .map(
        (product) =>
          `<label><input type="checkbox" name="related" value="${U.e(product.id)}" ${(article?.product_ids || []).includes(product.id) ? "checked" : ""}><span>${U.bi({ zh: product.i18n.zh.title, en: product.i18n.en.title })}</span></label>`,
      )
      .join("") || `<p class="muted">${U.tr("noProducts")}</p>`}</div><small class="error" data-error="product_ids"></small></div></div><div class="form-actions"><button class="button" type="button" data-save="published">${U.tr("articlePublish")}</button><button class="button secondary" type="button" data-save="scheduled">${U.tr("articleScheduleBtn")}</button><button class="button secondary" type="button" data-save="draft">${U.tr("articleSaveDraft")}</button><button class="button secondary" type="button" id="article-back">${U.tr("back")}</button></div></form>`;
    document.getElementById("article-back").onclick = () => renderPage();
    document.getElementById("cover-pick").onclick = () => {
      SupplierShell.mediaPicker({
        type: "image",
        onPick: (url) => {
          state.cover = url;
          document.getElementById("cover-preview").src = url;
        },
      });
    };
    document.getElementById("cover-file").onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/") || file.size > 1.5 * 1024 * 1024) {
        U.notice("mediaTooLarge");
        event.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        state.cover = reader.result;
        document.getElementById("cover-preview").src = reader.result;
      };
      reader.readAsDataURL(file);
    };
    document.querySelectorAll(".rich-editor").forEach((editor) => {
      editor.addEventListener("focusin", () => (activeEditor = editor));
    });
    document.querySelectorAll("[data-cmd]").forEach((button) => {
      button.onclick = () => {
        const editor = document.getElementById(button.closest("[data-toolbar]")?.dataset.toolbar);
        editor?.focus();
        document.execCommand(button.dataset.cmd, false, null);
      };
    });
    document.querySelectorAll("[data-image]").forEach((button) => {
      button.onclick = () => {
        const editor = document.getElementById(button.dataset.image);
        SupplierShell.mediaPicker({
          type: "image",
          onPick: (url) => {
            editor?.focus();
            document.execCommand("insertImage", false, url);
          },
        });
      };
    });
    document.querySelectorAll("[data-save]").forEach((button) => {
      button.onclick = () => save(button.dataset.save);
    });
    ArticleDocumentUI.bind({onCover: url => { state.cover = url; document.getElementById("cover-preview").src = url; }});
    MarineFormControls.enhance();
    U.translate();
  }
  function save(status) {
    if (AccountUI.getUser()?.role !== "supplier" || AccountUI.getUser()?.id !== id) { U.notice("articleSessionChanged"); return; }
    const form = document.getElementById("article-form");
    const related = [...document.querySelectorAll('[name="related"]:checked')].map(
      (input) => input.value,
    );
    const now = new Date();
    let publishAt = document.getElementById("publish_at").value;
    if (status === "published" && !publishAt)
      publishAt = now.toISOString().slice(0, 16);
    const article = {
      id: state.editing?.id || "article-" + Date.now(),
      supplier_id: id,
      title: {
        zh: state.editing?.title?.zh || "",
        en: document.getElementById("title_en").value.trim(),
      },
      content_html: {
        zh: state.editing?.content_html?.zh || "",
        en: DocumentImport.sanitize(document.getElementById("body_en").innerHTML.trim()),
      },
      cover: state.cover,
      category: document.getElementById("article-category").value,
      tags: document
        .getElementById("article-tags")
        .value.split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 3),
      status,
      publish_at: publishAt,
      product_ids: related,
      author: state.editing?.author || shell.profile.contact || "",
      created_at: state.editing?.created_at || now.toISOString(),
      updated_at: now.toISOString(),
      views: state.editing?.views || 0,
    };
    const errors = SupplierCore.validateArticle(article);
    if (!U.errors(form, errors)) return;
    try {
      SupplierCore.saveArticle(localStorage, article);
      U.notice("articleSaved");
      state.editing = null;
      state.cover = "";
      renderPage();
    } catch {
      U.notice("storageError");
    }
  }
  function openPreview(article) {
    if (!article) return;
    const dialog = document.getElementById("article-preview");
    dialog.innerHTML = `<div class="drawer-header"><h2>${U.tr("articlePreview")}</h2><button type="button" class="button secondary" data-close>${U.tr("close")}</button></div><article class="article-body"><h1>${U.bi(article.title)}</h1><p class="article-meta">${U.e(article.publish_at || "")} · ${U.e(article.author || "")}</p>${article.cover ? `<div class="article-cover"><img src="${U.e(article.cover)}" alt=""></div>` : ""}<div class="article-paragraphs">${article.content_html?.[U.lang] || article.content_html?.en || article.content_html?.zh || ""}</div></article>`;
    dialog.querySelector("[data-close]").onclick = () => dialog.close();
    dialog.showModal();
    U.translate();
  }
  renderPage();
  window.addEventListener("storage", (event) => {
    if (["articles", "blog_sidebar", "current_user"].includes(event.key) && state.view === "list")
      renderList();
  });
  window.addEventListener("languagechange", () => {
    if (state.view === "list") renderPage();
    else U.translate();
  });
})();
