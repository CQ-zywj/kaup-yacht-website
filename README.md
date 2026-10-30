# 北贸汇 / NORTHLINK

多品类跨境 B2B 平台前端静态原型（船舶 / 游艇为一个行业），按所附 PRD v0.3 实现。无需安装依赖、无需构建，没有后端。

## 打开与演示

推荐在项目目录执行：

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

访问 http://127.0.0.1:4173/index.html 。此方式让各页面与标签页使用同一来源，稳定共享 localStorage。服务仅监听本机。

也可尝试直接双击 index.html：脚本为普通 script、资源均为本地相对路径，没有模块加载或 fetch。不同浏览器对 file URL 的 localStorage 共享规则可能不同；完整询盘闭环推荐使用上述 HTTP 方式。当前测试浏览器禁止访问 file 协议，因此直接双击模式未做运行实测。

1. 首页切换中英，选择整艇，按材质、长度、动力、认证或关键词筛选。
2. 打开商品详情，查看参数、认证编号、涂装安全信息和画廊。
3. 买家登录后点击发起询盘，选择产品类目与子类目，填写买家公司、所在国家、数量及说明；交期可留空。发送后点击“查看我的询盘”。
4. 切换供应商演示账号，打开询盘收件箱，查看详情并回复；再切回原买家账号，在“我的询盘”查看状态与回复。
5. 发布供应页选择四类模板。涂装缺 MSDS、UN 或其他合规字段时不能提交。
6. 保存草稿或提交后在“我的商品”查看，继续编辑。已提交商品也进入买家列表。

## 新版 PRD 第三部分（2026-10-09）

- 买家登录/注册：buyer-auth.html；供应商登录/入驻：supplier-auth.html；公司资料：company.html。均为静态模拟，无后端。
- 登录页点击“使用演示账号”后登录：buyer@marinex.demo 或 supplier@marinex.demo，演示密码均为 Demo123!。也可以填写假信息注册。
- 买家登录后可发起询盘，未登录时保留商品上下文并引导登录。供应商登录后顶部账户菜单提供公司资料、我的商品、询盘和退出。
- 发布页顺序按用户最新要求调整为：基本信息 → 供应商信息 → 技术参数 → 认证 → 贸易信息。
- 供应商表单必填公司名称、国家/地区、联系人、邮箱；选填城市、电话、官网、中英简介及英文名称。登录供应商自动回填；没有可复用资料时留空。
- 提交商品保存 supplier_id 和供应商资料，同时写回 supplier_profile 并同步 accounts；草稿只保存 draft_products。编辑旧商品优先读取当前公司资料，不回写旧资料覆盖公司修改。
- 公司页可编辑、取消、保存资料，增删认证、本地图片预览、模拟审核通过。实拍和证书保存文件名，不上传真实文件。
- accounts 保存模拟账户（密码仅存摘要）；current_user 保存登录态；supplier_profile 保存可复用公司资料。浏览器模拟角色不是真实鉴权，上线必须由后端接管。
- 旧版计划中的需求大厅、报价会话、API 仓库等不属于这次新版第三部分的交付范围；此次以新版 PRD 和用户指定发布页调整为准。验收证据见 docs/archive/prd3-verification.md。

## 页面

| 文件 | 用途 |
| --- | --- |
| index.html | 首页、搜索、四类入口、精选供应 |
| products.html | 多条件精准筛选、URL 同步、排序分页 |
| product.html | 参数、媒体、认证、合规和供应商 |
| publish.html | 四类发布模板、图片预览、草稿、校验 |
| rfq.html | 关联商品或通用采购需求 |
| my-rfq.html | 买家自己的询盘、状态筛选、时间排序、详情与供应商回复 |
| inbox.html | 询盘筛选、已读、回复与跨标签同步 |
| supplier.html | P1 我的商品、草稿与提交记录、继续编辑 |
| buyer-auth.html | 买家注册登录、模拟角色和登录态 |
| supplier-auth.html | 供应商注册登录及企业入驻 |
| company.html | 我的店铺：公司资料 + 门面（logo / 横幅 / 标语 / 主题）统一编辑，右侧实时预览 |
| company-public.html | 对外公开的公司主页（简介、公开证书、团队） |
| store-decoration.html | 已并入 company.html，仅保留跳转 |
| finance.html | 财务中心：开户名、银行、账号、SWIFT 与开户凭证 |
| storefront.html | 供应商店铺主页（按 `supplier_id` 访问） |
| customers.html | 客户管理：手工建档 + 从询盘派生、搜索、软删除 |
| certifications.html | 证书管理：类目、有效期、公开/私密、文件上传 |
| supplier-articles.html | 内容中心：文章编辑、DOCX/HTML/TXT 导入 |
| media-library.html | 媒体库：图片与文件分组管理 |
| bulk-import.html | 批量导入：表格（CSV/XLSX）+ 资料包（ZIP/DOCX/图片） |
| seller-dashboard.html | 控制台总览：商品状态、资料完整度、待办 |
| rfq-market.html | 公开 RFQ 市场（供应商专用）：发现新机会、一键报价；买家访问自动接管到 my-rfq |
| suppliers.html | 供应商目录：企业搜索与行业筛选 |

## 数据与语言

- mock/data.js 为实际页面加载的数据；mock/categories.json 和 mock/products.json 是同内容的独立替换参考。
- 16 件手写示例商品，每类 4 件；p12 为涂装合规缺项样例。
- js/i18n.js 集中维护中英文案，类目及枚举双语字段在 mock/categories.json 中。
- 修改 JSON 后同步更新 mock/data.js 中的对应数组，页面不通过网络读取 JSON。
- draft_products 存储商品草稿与模拟提交；rfq_drafts 存储用户运行时提交的询盘；marine_lang 存储语言偏好。
- 默认语言为英文；首次访问或 marine_lang 无有效值时按英文渲染，切换后写入 marine_lang，也可用 `?lang=zh` 直接进入中文。
- 询盘状态为 submitted（未读）、viewed（已读）、replied（已回复）。已回复条目再次查看不会降级。
- 询盘和商品均未预置于 localStorage。测试演示时创建的记录只在测试所用浏览器内。
- 存储损坏会提示并阻止覆盖；存储被禁用或配额不足时不显示保存成功。请备份原有内容后再自行修复损坏的存储键。

## 演示边界

商品、价格、供应商、认证编号和 MSDS 全是样例。不会发送真实通知或邮件。询盘和回复附件仅记录文件元数据，无真实下载；商品图片保存为本地 Data URL，每张最多 1 MB、最多 4 张，证书图片仅记录文件名。

外部详细模型 PRD-P0-详细需求.md 和品牌 design-system 未提供，数据结构对齐当前 DOCX 可见字段。ECHEMI 用于信息结构参考；其浏览器端滑动验证阻止了完整视觉核对。未部署到公网。新版 PRD 的 P1 注册登录及公司资料已补充。

## 验证

```sh
node --test tests/*.test.cjs
```

无需安装 npm 包；Node 只用于开发验收，不是运行原型的依赖。验收过程与限制见 docs/archive/verification.md；现行功能清单见 docs/功能清单-当前原型.md，截图见 docs/screenshots/。

## 买家我的询盘

- 买家登录后，主导航、账户菜单及页脚提供“我的询盘”；提交成功同时提供查看询盘和返回产品列表入口。
- 仅展示 buyer.id 与当前买家 id 严格相同的记录。无 buyer.id 的旧记录不归属于任何账号，不迁移或补写。
- 买家页面只读取 rfq_drafts；查看详情不会改变询盘状态。已发送、已查看、已回复状态来自供应商操作。
- storage 事件和页面重新聚焦会更新列表及已打开详情。该静态原型的所有标签页共享同一个登录态；买家与供应商切换需要重新登录。
- 附件仅展示元数据，缺失目标市场、交期等字段显示“—”。登录失效引导重新登录并返回原页面，存储异常提示重试。
- 本轮验证见 docs/archive/my-rfq-verification.md。

## 多行业平台改版

首页提供行业目录、采购入口、行业专区与多供应商展示。船舶与游艇、轴承、机床、农产品、木材与林产、石化与化工为六个一级行业；除船舶外，当前种子商品为空。发布表单与列表支持各行业独立参数模板。

`mock/industries.json` 是一级行业目录，`mock/categories.json` 是专业分类与参数模板。旧船舶分类 ID 和本地记录保持兼容，新增记录包含 `industry_id`。浏览列表支持 `industry` 与 `supplier` URL 参数；模拟账号与存储键名保持兼容。

## 资讯门户首页（2026-10-10）

- 首页移除独立船舶游艇专区，仍保留船舶行业分类、产品列表与详情。
- 新闻列表 news.html、展会列表 exhibitions.html、内容详情 content.html?type=news&id=precision-sourcing。
- 供应商首页显示本地询盘与演示采购线索；`inquiry-detail.html` 展示演示线索详情。
  > 2026-10-29 更新：演示线索已整块下线（假买家，点“联系”无动作），`inquiry-detail.html` 改为跳回首页，见「删掉假线索、死代码与自动播种」一节。
- 新闻为演示编辑内容；展会与线索不是实时业务数据。

## 供应商控制台补齐（2026-10-21）

按 `docs/未实现功能清单.md` 的 M1–M11 补齐缺口，仍为纯静态原型。供应商登录后落地 `seller-dashboard.html`。

| 文件 | 对应缺口 | 用途 |
| --- | --- | --- |
| seller-dashboard.html | M1 | 店铺总览：KPI、资料完善度评分、待办、最近询盘、商品概览、店铺卡 |
| supplier.html | M6 | 我的商品：全部/在售/待审核/已下架/草稿/已驳回 六态筛选、上下架、删除 |
| bulk-import.html | M6 | 批量导入：CSV 模板下载、文件或粘贴解析、逐行校验与结果 |
| certifications.html | M3 | 认证与资质：7 类分组、有效期预警、模拟验真/驳回、关联产品 |
| supplier-articles.html | M4 | 内容中心：富文本编辑、封面、标签、定时发布、侧栏配置 |
| media-library.html | M5 | 素材库：按文件夹分类、标签、引用计数、删除前校验 |
| storefront.html | M2 | 店铺主页：Banner 主题、认证墙、文章与商品聚合，公开可访问 |
| customers.html | M11 | 客户管理：按买家公司聚合询盘与回复记录 |

配套改动：

- `js/supplier-core.js` 统一四类新数据（certifications / articles / media_library / blog_sidebar）的读写、校验与完善度计算；`js/supplier-shell.js` 提供控制台外壳与素材选择器。
- M7 询盘定向：`rfq.html?supplier_id=` 显示目标供应商卡片并写入 `rfq_drafts.supplier_id`；收件箱只显示定向给当前供应商的记录与未定向的公共询盘。
- M8 公司资料新增店铺门面字段：`tagline` / `theme` / `banner` / `logo` / `address` / `video`，可写入后再由店铺主页读取。
- M6 发布页支持从素材库选图；商品状态机为 `draft / pending / active / inactive / rejected`，旧 `published` 自动视为 `active`。
- M10 首页新增「进入店铺工作台」、精选商品与供应商资讯区块；`content.html?type=article&id=` 支持文章详情。
- 种子商品（`s1` 名下 4 件）在我的商品中标记为「演示」且只读；用户自己的草稿/导入商品可完整管理。
- 新增存储键：`certifications`、`articles`、`media_library`、`blog_sidebar`、`storefront_favorites`、`demo_supplier_seeded`。
  > 2026-10-29 更新：`demo_supplier_seeded` 已随 `seedDemo()` 一起删除，控制台不再自动播种演示数据。
- 所有页面脚本缓存版本统一为 `?v=ws20261021`，避免旧脚本与旧样式混用。

演示账号首次进入控制台会自动写入 5 条演示素材、4 张证书与 3 篇文章（`demo_supplier_seeded` 为幂等标记），便于直接查看各页面效果。
  > 2026-10-29 更新：该自动播种已删除，新环境进控制台是空状态（证书 / 文章 / 素材三页带引导按钮），要演示内容请手工新建。截图见 `docs/screenshots/`（console / products / bulk / certs / articles / media / customers / storefront / company / home）。

## 买卖双方沟通机制（2026-10-29）

按《主流外贸平台买卖双方沟通机制（精简版）》补齐 Alibaba / Made-in-China / ECHEMI / DHgate 的通用骨架，仍是纯前端原型，数据全部落在 `localStorage["rfq_drafts"]`。

| 能力 | 落地位置 | 说明 |
| --- | --- | --- |
| 多轮消息线程 | `js/messages-core.js` | `thread.messages[]` 保存每一轮消息，回复不再覆盖上一条；旧记录（`message` + 单条 `reply`）在读取时就地升级 |
| 公开 RFQ / 一对一询盘 | `rfq.html`、`rfq-market.html` | 表单顶部切换两种模式；公开模式写入 `supplier_id: null` 并进入 RFQ 市场，定向模式沿用供应商卡片与自动分配 |
| 报价互不可见 | `js/rfq-market.js` | 每家供应商报价时 `forkForSupplier()` 生成以 `public_of` 关联的独立子线程，买家侧用 `relatedQuotes()` 聚合比价 |
| 未读角标 / 已读回执 | `js/accounts-ui.js`、收件箱与我的询盘 | 导航、页脚、账户菜单统一挂未读角标；每条消息有 `read_at`，自己发出的消息显示「已读 / 未读」 |
| 邮件通知（模拟） | `inbox.html`、`rfq-market.html` | 报价与回复后弹层提示「已邮件通知」，仅文案模拟，不实际发信 |
| 询盘分配 / 业务员归属 | 收件箱 | 负责人下拉 +「自动分配」；策略为历史归属 > 区域 > 默认，`assignee_id/assignee_name` 写入线程 |
| 结构化报价 | 收件箱「发送报价」、RFQ 市场「我要报价」 | 单价、起订量、交期、贸易条款、有效期、说明；校验 `price > 0 && moq > 0` 后入库 |
| 比价与成交 | `my-rfq.html` | 横向比价卡（`quote-compare`），买家「接受报价」后主帖记 `accepted_thread_id`，会话转入中选子线程 |
| 回复率与响应时效 | 收件箱顶部四指标 | 未读、待回复、3 天响应率、平均首响，口径来自 `responseStats()` |
| 会话生命周期 | 收件箱 | `submitted → viewed → replied → quoted → accepted → closed`，关闭后仍可查看历史，回复会重新打开 |

配套改动：

- 线程状态机与消息类型（`inquiry / reply / quote / system`）集中在 `js/messages-core.js`，导出 `normalize`、`markRead`、`appendMessage`、`addQuote`、`acceptQuote`、`close`、`reopen`、`assign`、`autoAssign`、`responseStats`、`forkForSupplier`、`relatedQuotes`。（`toPublicRfq` 已于 2026-10-29 删除：注释声称“1440 分钟无人回复自动转公开”，实际无调度器、无调用方。）
- `js/core.js` 的 `rfq_drafts` 校验扩展到新状态与 `messages[]` 结构，损坏记录仍会在渲染前被拦下。
- 收件箱只显示定向给当前供应商的记录与各自报价的子线程；公开 RFQ 主帖不出现在任何供应商的收件箱里。
- 系统提示消息（接受报价等）不计入未读。
- 新增 i18n 键约 130 条，覆盖状态、报价、分配、RFQ 市场与买家画像。
- 新增 `tests/messages.test.cjs`（10 例）与 `tests/core.test.cjs` 线程校验用例，全量测试 71 通过。
- 样式新增收件箱双栏、消息气泡、报价卡、比价行、RFQ 双模式切换与市场卡片等区块；静态资源缓存版本统一为 `?v=ws20261029a`。
- 截图见 `docs/screenshots/`：`market.png`、`market-quote.png`、`market-quoted.png`、`market-guest.png`、`inbox.png`、`inbox-thread.png`、`my-rfq.png`、`my-rfq-thread.png`。

演示路径：买家 `rfq.html?mode=public` 发布需求 → 供应商在 `rfq-market.html` 报价 → 供应商 `inbox.html` 看线程与指标 → 买家 `my-rfq.html` 比价并接受 → 双方继续多轮对话，未读角标随之增减。

## 供应商端能力合并（2026-10-29）

把上一版供应商端分支（财务中心、店铺装修、公开公司主页、真实文件存储、证书可见性、客户管理、文档导入、批量导入升级、机审规则）合并进本版本，并保持上一节的多轮沟通机制不变。

研发交接文档：`docs/研发交接-供应商端能力合并-2026-10-29.md`（同目录另有 `.docx` 与 `.html` 版本，可直接转发）。

| 能力 | 落地位置 | 说明 |
| --- | --- | --- |
| 真实文件存储 | `js/supplier-files.js` | IndexedDB 数据库 `northlink-supplier-files`，`files` 存 Blob、`finance` 存银行资料；页面只保留 `{id,name,type,size}` 引用，`hydrate()` 回填 `img[data-local-file]` |
| 上传校验 | `js/supplier-data.js`、`js/supplier-files.js` | 按种类校验 MIME 与体积（银行 5MB / 证书 10MB、图片 5MB / logo 2MB / 横幅 3MB / 团队 5MB）；logo ≥400×400、横幅必须 1920×480；SVG 拒绝 `script/foreignObject/on*/外部 href/url()` |
| 财务中心 | `finance.html` + `js/supplier-settings.js` | 开户名、开户行、账号、SWIFT、开户凭证上传与下载；资料只存本机，不进公开投影 |
| 店铺门面 | `company.html`「我的店铺」+ `js/company.js` | logo、最多 3 张横幅、≤40 字标语、三套主题（ocean/slate/sand）随公司资料一起编辑，右侧实时预览；`storefront.html` 按 `theme` 套用横幅配色 |
| 公开公司主页 | `company-public.html` + `js/company-public.js` | 只渲染 `SupplierData.publicProfile()` 白名单字段与 `publicCertificates()`，银行资料、私密证书、账号凭证一律排除 |
| 证书可见性 | `js/supplier-data.js` | `company` / `authorization` 类目强制私密；公开证书还需 `status !== rejected` 且落在有效期内 |
| 证书预览器 | `js/supplier-display.js` | 证书卡片、文件预览弹层、团队卡片统一由 `cards()/open()/bind()/teamMarkup()` 生成，商品页与店铺页共用 |
| 团队管理 | `js/company-team.js` | 公司资料页维护成员头像与职位，公开页只读展示 |
| 客户管理 | `customers.html` + `js/customer-core.js` | 手工建档与询盘派生合并去重；键为 `customer_profiles:<supplierId>`；删除为 `hidden` 软删，询盘历史保留 |
| 文档导入 | `js/document-import.js`、`js/article-import.js` | DOCX 走 mammoth，HTML/TXT 直接解析；导入前弹层预览，可选「替换正文」或「追加」，图片可一键设为封面 |
| 批量导入 | `bulk-import.html` + `js/bulk-core.js`、`js/bulk-materials.js` | 表格模式支持 CSV/XLSX（自动列映射、逐行校验、去重合并）；资料包模式按文件夹把 DOCX/图片成组 |
| 机审规则 | `js/review-rules.js` | 商品 P01–P04/P09/P16/P17、文章 A01–A06 二值机审（必填、标题/描述长度、价格区间、USCC、联系方式与违禁词）；通过即 `active`，驳回带规则码与中文原因 |
| 统一表格/资料 UI | `assets/supplier-ui.css`、`assets/customer-ui.css`、`assets/bulk-ui.css` | 控制台侧栏、客户卡片、批量导入映射表、文档预览与富文本表格样式 |

配套改动：

- 供应商侧栏新增「我的店铺」「财务中心」，控制台未读角标与总览页「询盘」计数改按消息 `read_at` 统计，并排除公开 RFQ 主帖，与收件箱口径一致。
- 接受报价时同步把该报价线程标记为已读，避免买家未读角标虚高。
- 商品状态收敛为二值机审：`draft / active / inactive / rejected`，不再有「待审核」停留态；文章状态增加 `rejected`。
- `js/i18n.js` 合并为 916 个键，新增财务、装修、客户、批量导入、机审、团队等文案，中英成对校验仍为 0 异常。
- 静态资源缓存版本统一为 `?v=ws20261029a`，品牌字面量统一为 NORTHLINK / 北贸汇。
- 新增测试 `tests/article-validation`、`tests/bulk-core`、`tests/customer-core`、`tests/supplier-data`；`tests/static.test.cjs` 页面清单加入 `finance`、`store-decoration`、`company-public`；全量 **87 项通过**。

浏览器实测（Chromium，0 控制台错误）：

- 财务中心：填写四项 + 上传 PDF → 保存 → 刷新后字段与凭证仍在；上传 PNG 被格式校验拦下。
- 店铺装修：logo + 1920×480 横幅 + 标语 + `theme-sand` 保存成功；800×300 横幅报「尺寸不符」，带 `script` 的 SVG 报「含活动内容」。
- 店铺主页与公开主页：主题色、logo、横幅、标语生效；公开页不出现银行信息，`company` 类私密证书不外泄。
- 证书：公开 `product` 类证书出现在公开页，`company` 类自动私密且可见性开关禁用；商品页认证弹层可打开文件预览。
- 客户：新增、编辑、搜索、软删除全通，删除后提示「询盘历史已保留」。
- 导入：DOCX 识别标题与 3 个二级标题、772 字正文，可应用回编辑器并保存草稿；CSV/XLSX 映射 13 列，违规行按机审码驳回。
- 沟通链路回归：公开 RFQ → 市场报价 → 买家比价接受 → 双向多轮 → 侧栏角标 1 → 回复后清零。

截图见 `docs/screenshots/`：`console-finance.png`、`storefront-decorated.png`、`console-certifications.png`、`console-cert-upload.png`、`console-customers.png`、`console-bulk-import.png`、`console-docx-import.png`。

另有两张历史截图 `console-store-decoration.png` 与 `company-public.png`，对应页面已分别并入 `company.html` 与 `storefront.html`，无法再复现；文件保留作历史对照，不作为当前界面依据。

## 我的店铺合并（2026-10-29 收口）

「店铺装修」和「公司资料」原本是两套入口、两套字段、两次保存：同一个人要维护同一批门面信息，却要在两个页面之间来回跳。本轮按「编辑公司信息时顺手把门面填完」的思路合并为唯一的「我的店铺」，改动记录见 `docs/改动记录-我的店铺合并-2026-10-29.md`。

| 改动点 | 文件 | 说明 |
| --- | --- | --- |
| 入口唯一 | `js/supplier-shell.js`、`store-decoration.html` | 侧栏 13 项减为 12 项，「店铺装修」并入「我的店铺」；旧文件改为跳转页，老链接与书签不会 404 |
| 四分区布局 | `js/company.js` | 企业信息 / 店铺门面 / 团队成员 / 实拍 / 认证资质；`address` 归位到企业信息区 |
| 门面并入编辑 | `js/company.js` | 标语（≤40 字，带计数器）、主题（ocean/slate/sand）、logo（≥400×400）、横幅（≤3 张，必须 1920×480）、店铺视频 |
| 实时预览 | `js/company.js`、`assets/supplier-ui.css` | 右侧 sticky 预览卡随输入更新，保存前就能看到店铺页效果；宽度 ≤960px 时折叠为顶部条 |
| 先校验后写盘 | `js/supplier-files.js` | 新增 `check(files, kind)`，`putMany()` 复用；整张表单的文件全部通过才写库，避免「logo 存了、横幅被拒」留下孤儿 Blob |
| 草稿白名单 | `js/company.js` | 补 `banner_files`，修复「传横幅 → 去认证页 → 返回，横幅丢失」 |
| 财务中心瘦身 | `js/supplier-settings.js` | 移除装修分支，只保留开户名/银行/账号/SWIFT/凭证；底部加「我的店铺」引导 |
| 本地库自愈 | `js/supplier-files.js` | 同名库缺表时不报死：检测缺表后升一版补建 `files` / `finance`，避免历史残留导致所有上传失败 |

配套改动：

- `js/i18n.js` 新增 `myStore` / `storePreview` / `storePreviewHint` 三键，`saveCompany` 文案改为「保存店铺资料」；中英成对校验仍为 0 异常。
- `company.html` 标题改为 `NORTHLINK | My store`，静态资源缓存版本统一升级为 `?v=ws20261029c`。
- 单元测试 **88 项通过**（新增一条「属性位置不得使用 `${U.tr(`」守卫）；浏览器端到端验收 **42 项全部通过**（含"800×300 横幅被拦且不写盘"、"草稿往返不丢横幅"、"缺表库自愈后仍能上传"）。
- 界面见 `docs/screenshots/console-my-store-edit.png`。

## 供应商侧栏分组（2026-10-29）

侧栏原来 12 项平铺，按"系统有几个模块"排；改成按"每天要做的事"分 7 组，页面一个没合并。改动记录见 `docs/改动记录-侧栏分组-2026-10-29.md`。

| 分组 | 组内页面 | 形态 |
| --- | --- | --- |
| 总览 | 店铺总览 | 单项直达 |
| 商品 | 我的商品、发布商品、批量导入 | 折叠组 |
| 询盘 | 询盘收件箱（未读角标） | 单项直达 |
| 店铺 | 我的店铺、店铺主页、财务中心 | 折叠组 |
| 资质 | 认证与资质 | 单项直达 |
| 内容 | 内容中心、素材库 | 折叠组 |
| 客户 | 客户管理 | 单项直达 |

实现要点：

- `js/supplier-shell.js` 的 `ITEMS` 平铺数组改为 `GROUPS`，新增 `navLink()` / `navMarkup()` / `bindGroups()`；展平的 `ITEMS` 仍导出，供需要整表的调用方使用。
- 当前组默认展开、其它组折叠，展开状态不持久化——否则用久了会退化成"全都展开"，等于回到 12 项平铺。
- 组标题是 `<button>` + `aria-expanded`/`aria-controls`，沿用 44px 触达高度；窄屏（≤1023px）自动摊平为原来的 12 个 chip。
- i18n 新增 `navGroupProducts` / `navGroupStore` / `navGroupContent` 三个组标题键，并把 `consoleProducts`、`consoleArticles` 的英文改成 `My products`、`Content center`，避免与组名撞字。
- 单元测试 **88 项通过**；浏览器验收 **17 项全通过**；上一轮「我的店铺」42 项同步回归 0 失败。截图 `docs/screenshots/console-nav-groups.png`。

> 遗留：`publish.html` 与 `inbox.html` 本来就不渲染控制台侧栏（走 `AccountUI.requireSupplier()` 而不是 `SupplierShell.mount()`），从组里进去后侧栏会消失。要么按"专注模式"接受现状，要么单独一轮把两页接进外壳并重做收件箱双栏宽度。详见改动记录第六节。

## 使用反馈修复（2026-10-29）

| 问题 | 改动 | 落点 |
| --- | --- | --- |
| 店铺页出现两个「发起询盘」，白的「联系与询盘」卡片多余 | 删除整张卡片，只留头部主按钮；简介区由两列改单列 | `js/storefront.js`、`assets/styles.css`、`js/i18n.js` |
| 询盘附件选中后无法删除，选错只能刷新重填 | 附件条目加移除按钮；删除后重建 `input.files`，避免再选时被删文件"复活"。收件箱回复附件同款处理 | `js/common.js`（`filesHtml` 支持可移除）、`js/rfq.js`、`js/inbox.js`、`assets/styles.css` |

- 单元测试 **88 项通过**；本轮验收 **12 项全通过**；侧栏 17 项、入口合并 18 项、我的店铺 42 项同步回归 0 失败。
- 截图：`docs/screenshots/storefront-buyer.png`、`docs/screenshots/rfq-attachments-removable.png`。

## 对外主页与新建商品入口收敛（2026-10-29）

第 2、3 组，都是"少一个入口"，不删能力。记录见 `docs/改动记录-入口合并-第2第3组-2026-10-29.md`。

| 改动 | 落点 | 说明 |
| --- | --- | --- |
| 公司主页并入店铺主页 | `company-public.html`、`js/company-public.js`、`js/storefront.js` | 带 `supplier_id` 跳到 `storefront.html`，否则退到供应商目录；店铺页删掉指向它的「公司信息」按钮，并吸收 `preserve-lines` 多行简介排版 |
| 批量导入降为页内入口 | `js/supplier-shell.js`、`js/publish.js`、`js/bulk-import.js` | 侧栏「商品」组收敛为 2 项，入口移到发布页页头；批量导入页加「← 返回发布商品」；进页时「商品」组仍展开但不误标当前项 |

- 侧栏业务页 12 → 11，页面总数仍 27（`bulk-import.html` / `company-public.html` 都保留文件，只是改了角色）。
- 单元测试 **88 项通过**；新增浏览器验收 **18 项全通过**；侧栏 17 项与「我的店铺」42 项同步回归 0 失败。
- 未按方案下线 `bulk-import.html` 的「资料包」模式：它是页内 tab 而非并列入口，下线属于削功能，单独另议。

## RFQ 市场只服务供应商（2026-10-29）

第 4 组。改之前买家在 `rfq-market.html` 和 `my-rfq.html` 看的是同一批需求的两个副本（数量口径还不一致），供应商在市场和收件箱各有一份"我报过的"列表。本轮让市场只回答"有什么新机会"，并且**买家端整体退出**——买家进「我的询盘」就能看到自己发布的全部询盘与报价。记录见 `docs/改动记录-市场拆分第4组-2026-10-29.md`。

| 角色 | 问的问题 | 唯一答案 |
| --- | --- | --- |
| 买家 | 我的采购在哪 | `my-rfq.html` |
| 供应商 | 谁找我 | `inbox.html` |
| 供应商 | 有什么新机会 | `rfq-market.html` |

| 改动 | 落点 | 说明 |
| --- | --- | --- |
| 买家端退出市场 | `js/accounts-ui.js` | 导航不再插入市场项（`role !== 'buyer'`）、页脚买家列表去掉市场、全局 `hidden` 规则兜住页面内所有链接 |
| 买家访问市场被接管 | `js/rfq-market.js` | `renderBuyer()` 改为 `location.replace(my-rfq.html)`，书签/老链接不落空 |
| 发布成功提示改向 | `js/rfq.js` | 公开 RFQ 发布后主按钮跳「我的询盘」、次按钮回「浏览产品」，不再跳市场 |
| 删「已报价」筛选 | `js/rfq-market.js` | `FILTERS`、`state.filter`、`.market-tabs` 容器一并移除，`state` 收敛为 `{ q: "" }`，工具栏只剩搜索 + 收件箱入口 |
| 报价后不跳 tab | `js/rfq-market.js` | `submitQuote()` 成功后原地重渲染，卡片就地变 `is-quoted` 并显示金额，报价线程进收件箱 |

- 买家发布需求路径没减少：`my-rfq.html` 工具栏右侧有「发布采购需求 →」，落到 `rfq.html` 且无 `supplier_id` 时默认就是公开 RFQ 模式。
- 游客保留市场入口，进去是"登录后使用 RFQ 市场"的双入口页——市场是平台对外开放的能力展示。
- 与方案原文的偏差：方案「验收」行要求"报价后需求从市场消失"，「改造」行要求"保留 `is-quoted` 标记"，二者不能同时成立，取后者（留列表 + 打标）。想改成消失只需在 `renderSupplier()` 的 `open` 过滤里加 `&& !myQuoteOf(row.id, rows)`。
- 单元测试 **88 项通过**（第 6、7 组删掉 1 条死代码用例后为 87 项）；本轮浏览器验收 **23 项全通过**；侧栏 17 项、入口合并 18 项、使用反馈 12 项同步回归 0 失败。
- 截图：`docs/screenshots/my-rfq-buyer.png`、`buyer-nav-no-market.png`、`rfq-market-supplier.png`。

## 删掉假线索、死代码与自动播种（2026-10-29）

第 6、7 组。前五组删的是**重复**，这两组删的是**不真实**：假商机、假注释、假数据。用户选择「三处全删，接受空状态」。记录见 `docs/改动记录-删假数据第6第7组-2026-10-29.md`。

| 对象 | 为什么删 | 落点 |
| --- | --- | --- |
| 首页 3 条演示采购线索 | 买家不存在，点"联系"只弹一句说明。平台卖的是"帮你找买家"，首页摆 3 条不存在的买家需求是信任风险，不只是冗余 | `js/home.js` 删渲染分支与结构；`mock/editorial-data.js` 删 `leads` 数组 |
| `inquiry-detail.html` | 只为那 3 条假线索存在 | 整体改为跳转页 → `index.html`（保留 `lang`）；`js/content.js` 删 `inquiry-detail` 渲染分支 |
| `toPublicRfq()` | 注释声称"1440 分钟无人回复自动转公开"，实际无调度器、无调用方，是误导 | `js/messages-core.js` 删函数与导出；测试改用 `publicMaster()` fixture |
| `seedDemo()` | 每次挂载控制台自动写 4 证书 / 3 文章 / 5 素材，没人同意就写用户数据，写的是无法解释的假营业执照 | `js/supplier-shell.js` 删调用；`js/supplier-core.js` 删整个函数（228 行，文件 546 → 319） |

- **接受空状态的实测**：新环境登录演示供应商，`localStorage` 只有 `accounts` / `current_user` / `supplier_profile`；证书、内容中心、素材库三页显示空状态并带引导按钮；店铺主页认证/动态/团队显示「暂无数据」，商品橱窗 4 件种子商品仍在（那是 `mock/data.js` 静态数据，不依赖播种）；首页只剩「收到的询盘 0」。
- i18n 删 9 个失效键（`supplierLeads`、`leadHint`、`leadDetails`、`leadBrief`、`demoLead`、`contactBuyer`、`demoContact`、`demoContactHint`、`buyerRegion`），键数 914 → **905**。
- `tests/content.test.cjs` 不再遍历 `leads`，并新增两条防回归断言：`content.leads` 必须是 `undefined`、`find('leads','bearing-lead')` 必须返回 `null`。
- 单测 **87 项通过**（原 88，删掉 1 条死代码用例）；本轮浏览器验收 **22 项全通过**；市场 23、侧栏 17、入口合并 18、使用反馈 12 同步回归 0 失败。
- 截图：`docs/screenshots/storefront-empty-state.png`。
- 代价：演示成本上升，要展示证书墙 / 文章 / 素材得手工建数据。若将来要恢复"一键演示"，正确做法是显式导入（上传 demo JSON 或"载入示例数据"按钮），而不是回到"进页面就偷偷写"。

## 入口收敛各组现状

`docs/入口收敛方案-2026-10-29.md` 共七组重复入口，另有第 8 组「入口错配」。**第 1–8 组全部完成**：

| 组 | 落地情况 |
| --- | --- |
| 第 1–7 组 | 重复入口已合并或下线，下线页统一改为跳转页（保留文件，老链接不 404），详见 `docs/改动记录-*.md` |
| 第 8 组 | 导航与主按钮已全部按角色渲染，集中在 `js/accounts-ui.js` 的 `refreshContext()`：主按钮买家→「我要采购」`rfq.html`、其余→「发布供应」`publish.html`；市场项只对供应商与游客插入；买家导航项固定为「我的询盘」；`js/accounts-ui.js:185-188` 的 `hidden` 规则已改为吃 `policy.sell` / `policy.buy`，不再是硬编码清单 |
