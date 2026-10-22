# 北贸汇 / NORTHLINK

## 本地文件上传与页面联动（2026-10-21）

- 顶部供应商账户菜单、工作台侧栏新增「财务中心」「店铺装修」。财务中心只维护开户资料与银行证明，不进行支付或结算。
- 认证支持保存图片/PDF 文件内容、查看和下载。上传时勾选「公开展示」，即可在店铺、公司公开页及关联产品中查看；待审核资料标注「已上传·未核验」。企业证件与授权类保持私有，授权附件不公开。
- 公司信息增加团队照片、姓名、职位和简介；Logo 可在公司信息或店铺装修上传，Banner 在店铺装修上传。
- 从店铺的「公司资料」进入买家与游客可访问的 `company-public.html?supplier_id=...`；管理用 `company.html` 仍仅供应商可进入。
- 文件内容存在 IndexedDB，轻量资料仍在 localStorage。仅同一浏览器、同一来源共享；清除站点数据会删除文件。旧记录如果只保存了文件名，必须重新上传才能打开。
- 此为前端演示的展示权限，不构成真实安全隔离。请勿在演示中使用真实银行或合同资料。未部署或推送本次改动。

运行及验收说明见 [本地上传联动验收](docs/local-frontend-upload-verification.md)。

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
- 旧版计划中的需求大厅、报价会话、API 仓库等不属于这次新版第三部分的交付范围；此次以新版 PRD 和用户指定发布页调整为准。验收证据见 docs/prd3-verification.md。

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
| company.html | 公司资料展示、编辑、资质与图片预览 |

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

无需安装 npm 包；Node 只用于开发验收，不是运行原型的依赖。验收过程与限制见 docs/verification.md；截图见 docs/screenshots/。

## 买家我的询盘

- 买家登录后，主导航、账户菜单及页脚提供“我的询盘”；提交成功同时提供查看询盘和返回产品列表入口。
- 仅展示 buyer.id 与当前买家 id 严格相同的记录。无 buyer.id 的旧记录不归属于任何账号，不迁移或补写。
- 买家页面只读取 rfq_drafts；查看详情不会改变询盘状态。已发送、已查看、已回复状态来自供应商操作。
- storage 事件和页面重新聚焦会更新列表及已打开详情。该静态原型的所有标签页共享同一个登录态；买家与供应商切换需要重新登录。
- 附件仅展示元数据，缺失目标市场、交期等字段显示“—”。登录失效引导重新登录并返回原页面，存储异常提示重试。
- 本轮验证见 docs/my-rfq-verification.md。

## 多行业平台改版

首页提供行业目录、采购入口、行业专区与多供应商展示。船舶与游艇、轴承、机床、农产品、木材与林产、石化与化工为六个一级行业；除船舶外，当前种子商品为空。发布表单与列表支持各行业独立参数模板。

`mock/industries.json` 是一级行业目录，`mock/categories.json` 是专业分类与参数模板。旧船舶分类 ID 和本地记录保持兼容，新增记录包含 `industry_id`。浏览列表支持 `industry` 与 `supplier` URL 参数；模拟账号与存储键名保持兼容。

## 资讯门户首页（2026-10-10）

- 首页移除独立船舶游艇专区，仍保留船舶行业分类、产品列表与详情。
- 新闻列表 news.html、展会列表 exhibitions.html、内容详情 content.html?type=news&id=precision-sourcing。
- 供应商首页显示本地询盘与演示采购线索；inquiry-detail.html 展示演示线索详情。
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
- 所有页面脚本缓存版本统一为 `?v=ws20261021`，避免旧脚本与旧样式混用。

演示账号首次进入控制台会自动写入 5 条演示素材、4 张证书与 3 篇文章（`demo_supplier_seeded` 为幂等标记），便于直接查看各页面效果。截图见 `docs/screenshots/`（console / products / bulk / certs / articles / media / customers / storefront / company / home）。
