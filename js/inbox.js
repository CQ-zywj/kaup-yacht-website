(() => {
if (!AccountUI.requireSupplier()) return;
let state = { status: "", from: "", to: "", sort: "newest" };
let selectedId = null;
document.getElementById("main").innerHTML =
  `<div class="container"><div class="page-intro"><div class="eyebrow">${U.tr("supplierMode")}</div><h1>${U.tr("inboxTitle")}</h1><p>${U.tr("inboxDesc")}</p></div><div class="metrics"><div class="metric"><strong id="unread-count">0</strong><span>${U.tr("unread")}</span></div><div class="metric"><strong id="all-count">0</strong><span>${U.tr("allInquiries")}</span></div></div><div class="panel"><div class="inbox-toolbar"><div class="field"><label for="status-filter">${U.tr("status")}</label><select id="status-filter"><option value="" data-i18n="all"></option>${["submitted", "viewed", "replied"].map((s) => `<option value="${s}" data-i18n="${s}"></option>`).join("")}</select></div>${U.field("dateFrom", "date-from", "date")}${U.field("dateTo", "date-to", "date")}<div class="field"><label for="time-sort">${U.tr("sort")}</label><select id="time-sort"><option value="newest" data-i18n="newest"></option><option value="oldest" data-i18n="oldest"></option></select></div></div></div><section id="inquiry-list" aria-live="polite"></section></div><dialog class="drawer" id="inquiry-drawer" aria-label="${U.t("inquiryDetails")}"></dialog>`;
function rows() {
  return AccountUI.getUser()?.role === "supplier" ? U.read("rfq_drafts") : [];
}
function renderList() {
  if (!AccountUI.requireSupplier()) return;
  const all = rows();
  document.getElementById("unread-count").textContent = all.filter(
    (r) => r.status === "submitted",
  ).length;
  document.getElementById("all-count").textContent = all.length;
  const list = all
    .filter(
      (r) =>
        (!state.status || r.status === state.status) &&
        (!state.from || r.created_at.slice(0, 10) >= state.from) &&
        (!state.to || r.created_at.slice(0, 10) <= state.to),
    )
    .sort(
      (a, b) =>
        (state.sort === "newest" ? -1 : 1) *
        (Date.parse(a.created_at) - Date.parse(b.created_at)),
    );
  document.getElementById("inquiry-list").innerHTML = list.length
    ? list
        .map((r) => {
          const p = U.product(r.product_id);
          return `<button type="button" class="inquiry-item" data-inquiry="${U.e(r.id)}"><img src="${U.e(p ? U.img(p) : "assets/media/services.jpg")}" alt=""><div><h3>${p ? U.bi({ zh: p.i18n.zh.title, en: p.i18n.en.title }) : U.tr("general")}</h3><p>${U.e(r.buyer.company)} · ${U.e(r.buyer.country)}</p></div><div class="inquiry-meta"><p>${U.tr("quantity")} ${U.e(r.quantity)} · ${U.e(r.target_country || "")}</p><p>${U.e(U.date(r.created_at))}</p></div><div class="status-cell"><span class="status ${U.e(r.status)}">${U.tr(r.status)}</span></div></button>`;
        })
        .join("")
    : U.empty("noInquiries", "noInquiriesHint", "rfq.html", "generalRfq");
  document
    .querySelectorAll("[data-inquiry]")
    .forEach((b) => (b.onclick = () => openInquiry(b.dataset.inquiry)));
  U.translate();
}
function openInquiry(id) {
  if (!AccountUI.requireSupplier()) return;
  selectedId = id;
  const list = rows();
  let row = list.find((r) => r.id === id);
  if (!row) return;
  const updated = MarineCore.viewRfq(row);
  if (updated.status !== row.status) {
    list[list.indexOf(row)] = updated;
    if (!U.write("rfq_drafts", list)) return;
    row = updated;
    renderList();
  }
  const p = U.product(row.product_id),
    drawer = document.getElementById("inquiry-drawer");
  drawer.innerHTML = `<div class="drawer-header"><h2>${U.tr("inquiryDetails")}</h2><button id="drawer-language" type="button" class="language" data-i18n="language">${U.tr("language")}</button><button id="close-inquiry" type="button" class="button secondary">${U.tr("close")}</button></div><span class="status ${U.e(row.status)}">${U.tr(row.status)}</span><div style="margin-top:17px">${U.context(p)}</div><table class="param-table"><tbody>${[
    ["company", row.buyer.company],
    ["buyerCountry", row.buyer.country],
    ["quantity", row.quantity],
    ...(row.target_country ? [["targetCountry", row.target_country]] : []),
    ...(row.category_id ? [["category", U.cat(row.category_id)?.name?.[U.lang] || row.category_id], ["subcategory", U.cat(row.category_id)?.subcategories.find(c => c.id === row.subcategory_id)?.name?.[U.lang] || row.subcategory_id]] : []),
    ["delivery", row.expected_delivery || "—"],
    ["terms", row.incoterms],
    ["sentAt", U.date(row.created_at)],
  ]
    .map(
      ([k, v]) => `<tr><th scope="row">${U.tr(k)}</th><td>${U.e(v)}</td></tr>`,
    )
    .join(
      "",
    )}</tbody></table><h3 style="margin-top:25px">${U.tr("message")}</h3><p style="white-space:pre-wrap;overflow-wrap:anywhere">${U.e(row.message)}</p><h3>${U.tr("attachments")}</h3>${row.attachments?.length ? U.filesHtml(row.attachments) : `<p class="muted">${U.tr("noData")}</p>`}${row.reply ? `<div class="reply-block"><strong>${U.tr("yourReply")}</strong><p>${U.e(row.reply.message)}</p>${U.filesHtml(row.reply.attachments || [])}<small>${U.e(U.date(row.reply.created_at))}</small></div>` : ""}<form id="reply-form" novalidate><h3 style="margin-top:25px">${U.tr("reply")}</h3>${U.area("replyMessage", "reply_message", "", true, "replyHint")}<div class="field"><label for="reply-attachments">${U.tr("attachments")}</label><input type="file" id="reply-attachments" multiple><p class="muted">${U.tr("attachmentHint")}</p><div id="reply-files"></div></div><button class="button full-width" type="submit" style="margin-top:20px">${U.tr("sendReply")}</button></form>`;
  if (!drawer.open) drawer.showModal();
  document.getElementById("close-inquiry").onclick = () => drawer.close();
  document.getElementById("drawer-language").onclick = () => U.switchLanguage();
  let attachments = [];
  document.getElementById("reply-attachments").onchange = (e) => {
    attachments = U.attachments(e.target.files);
    document.getElementById("reply-files").innerHTML = U.filesHtml(attachments);
  };
  document.getElementById("reply-form").onsubmit = (e) => {
    e.preventDefault();
    if (!AccountUI.requireSupplier()) return;
    if (!U.errors(e.target, U.validate(e.target))) return;
    const list = rows(),
      index = list.findIndex((r) => r.id === id);
    if (index < 0) return;
    list[index] = MarineCore.replyRfq(
      list[index],
      e.target.elements.reply_message.value,
      attachments,
    );
    if (U.write("rfq_drafts", list)) {
      drawer.close();
      renderList();
      U.notice("replySuccess");
    }
  };
  U.translate();
}
for (const [id, key] of [
  ["status-filter", "status"],
  ["date-from", "from"],
  ["date-to", "to"],
  ["time-sort", "sort"],
])
  document.getElementById(id).onchange = (e) => {
    state[key] = e.target.value;
    renderList();
  };
window.addEventListener("storage", (e) => {
  if (e.key === "current_user" && !AccountUI.requireSupplier()) return;
  if (e.key === "rfq_drafts" || e.key === "draft_products") renderList();
});
window.addEventListener("focus", renderList);
window.addEventListener("languagechange", renderList);
renderList();
const requestedInquiry=new URLSearchParams(location.search).get("inquiry");
if(requestedInquiry && rows().some(row=>row.id===requestedInquiry)) openInquiry(requestedInquiry);

})();
