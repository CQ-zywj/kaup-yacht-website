# MARINEX Buyer Seller Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成已确认第二版设计中的买卖双方静态业务平台和未来后端接入准备。

**Architecture:** 保留多页面和现有海事风格，新增统一 Promise 仓库、版本化数据、演示身份及工作台组件。页面调用仓库而非直接操作业务 localStorage，公开数据与企业私有数据分开；API 适配器与模拟仓库同签名。先实现共享业务模型，再沿采购、沟通、发布流程接入页面。

**Tech Stack:** HTML、CSS、普通 JavaScript、localStorage 模拟持久化；Node 内置测试用于开发验收，无产品运行依赖或构建步骤。

**Spec:** docs/superpowers/specs/2026-10-08-marine-platform-v2-design.md

**Execution:** 当前会话实施，沿用用户既有选择；本计划待审阅。

## Global Constraints

- 保持纯 HTML/CSS/JS 静态交付，准备未来后端接入。
- 静态身份切换仅是演示，清晰标注，不能作为生产权限安全证明。
- 买家仅可见本企业需求、发出的定向询盘、收到的报价和参与会话；卖家仅可见本企业商品、收到的定向询盘及自己提交的报价会话。
- 新版本追加，旧版本可查看；不抹掉已发送版本。
- 列表接口统一返回 items、total、page、pageSize，错误统一包含 code、message、fieldErrors。
- 首次升级备份原 draft_products/rfq_drafts 后迁移，保留旧键，不静默覆盖损坏数据。
- 保留原 URL 筛选、分页、中英切换和涂装缺项样例。
- 新旧页面在 375、768、1280 宽度无整页溢出。
- 不实际部署后端或公网，不发送通知邮件，不实现在线支付、物流履约、真实成员邀请或真实认证审核。

## Review Focus

1. 查看私有会话后切换成无权限身份，页面应立即移除原内容并拒绝后续提交（任务 2、3）。
2. 迁移备份成功但主数据写入失败，原键必须保留且重试不复制记录（任务 1）。
3. 卖家同时修订报价或连击发送，不得覆盖旧版本或重复处理同一提交（任务 3）。
4. 商品被下架后旧详情 URL、收藏和对比仍应明确提示状态，跨企业不能编辑（任务 5、6）。
5. 不同币种、面议及过期报价不能被错误比较成最低价或有效报价（任务 3、5）。

## File Responsibilities and Interface Contract

- `js/platform-model.js`：模型校验、迁移、纯权限与状态转换；导出 CommonJS 供测试，并暴露 MarinePlatformModel。
- `mock/platform-seed.js`：企业、用户、成员、需求等明确标注的演示种子；保留原商品类目与 16 个种子。
- `js/platform-repository.js`：版本化存储、异步模拟仓库、事务式变更、身份会话；暴露 MarinePlatform.createRepository({storage,seed,clock,idFactory})。
- `js/api-repository.js`：同签名 fetch 适配器；默认仍使用模拟仓库，错误结构一致。
- `js/platform-ui.js`：异步加载/失败/重试、工作台、身份切换、日期币种、通用列表及提交反馈。
- `js/common.js`：保留语言和安全渲染等公共能力，改造导航、卡片、上下文，不再承担业务数据仓库。
- 新增页面脚本与 HTML 一一对应；旧页面脚本分阶段迁移。字典仍由 `js/i18n.js` 集中维护，样式增加至 `assets/styles.css`。

仓库全部方法返回 Promise。上下文由 `session.get(): {userId,companyId,roles}` 和 `session.select(userId): Promise<Session>` 提供，方法从当前会话检查权限；调用方不得靠传入 companyId 获取额外权限。

方法约定：products.list({scope:'public'|'mine',q,category,filters,sort,page,pageSize})、products.get(id,{preview:false})、products.save(product,{submit:false,expectedRevision})、products.action(id,{action,reason,expectedRevision})；companies.list/get/update；requests.list/get/save/close；inquiries.create({productId,message,quantity,unit,...})；conversations.list/get/markRead；messages.send(conversationId,{text,attachments,requestId})；quotes.list/save/respond；favorites.list/toggle；notifications.list。get 返回实体，变更返回保存实体；list 使用统一分页结构。quotes.save 使用 requestId、conversationId、expectedRevision，respond 仅允许买方且状态为 interested/rejected；消息与报价附 clientRequestId 保证重试幂等。

### Task 1: 数据模型、版本化仓库和迁移

**Files:** Create `js/platform-model.js`, `mock/platform-seed.js`, `js/platform-repository.js`, `tests/platform-model.test.cjs`, `tests/platform-repository.test.cjs`.

**Interfaces:** Produces `MarinePlatformModel.migrateLegacy({products,rfqs,seed,now})` 及上述仓库接口；存储键 marine_platform_v2，备份 marine_legacy_backup_v1。持久化包含 schemaVersion:2、revision、entities；旧来源 ID 转换为确定的迁移 ID。

- [ ] 编写失败测试：两买两卖身份齐全；迁移前后商品、询盘、原回复文本和时间保持；通用询盘转换为历史需求；二次初始化实体数量不变；损坏来源抛 STORAGE_CORRUPT 且不覆盖；写入失败源键保持不变；半途失败可重试。
- [ ] 执行 `node --test tests/platform-model.test.cjs tests/platform-repository.test.cjs`，确认缺实现导致失败。
- [ ] 实现模型、归属映射、迁移备份、校验、持久化；验证修改按最新存储版本提交并拒绝过期 revision。开发测试使用内存存储和固定时钟，不清空用户浏览器数据。
- [ ] 重跑任务测试，确认全部通过，提交本任务。

### Task 2: 演示身份、共享异步 UI 和工作台

**Files:** Create `js/platform-ui.js`, `buyer.html`, `seller.html`, `account.html`, `js/buyer.js`, `js/seller.js`, `js/account.js`, `tests/platform-access.test.cjs`; Modify `js/common.js`, `js/i18n.js`, `assets/styles.css`.

**Interfaces:** Consumes Task 1 repository；Produces `PlatformUI.run(load,render)`、`PlatformUI.submit(form,operation)`、`PlatformUI.workspace(role,content)` 与 `identitychange` 事件。run 处理 loading/error/retry，submit 锁定直到完成且失败保留表单。

- [ ] 编写失败测试：买家 A/B 和卖家 A/B 列表互相隔离；非参与者 get 会话拒绝 FORBIDDEN；买方操作卖方接口失败；资料更新不得自授认证；双重角色成员可切工作台；提交失败能重试。
- [ ] 执行 `node --test tests/platform-access.test.cjs`，确认失败。
- [ ] 实现导航、三对象搜索、身份选择、响应式工作台、企业资料和成员权限说明；买家概览显示需求/会话/报价，卖家概览显示待办/商品/有效报价。旧页面逐步加载共享仓库；身份切换及 storage 事件重载私有内容。
- [ ] 跑任务 1、2 测试；浏览器确认身份切换即时移除无权内容、加载失败反馈有重试入口，提交本任务。

### Task 3: 定向询盘、双向消息及报价版本

**Files:** Create `conversation.html`, `js/conversation.js`, `tests/platform-conversation.test.cjs`; Modify `rfq.html`, `js/rfq.js`, `js/inbox.js`, `js/core.js`, `js/i18n.js`.

**Interfaces:** Consumes Task 1–2；inquiries.create 返回 `{inquiry,conversation}`，messages.send 返回追加的 Message，quotes.save 返回新版本 Quote。conversations.get 返回参与者公开信息、关联对象、messages 和允许读取的 quotes；已读保存 userId 时间。

- [ ] 编写失败测试：商品 p01 询盘仅其卖家收到；三次消息追加后历史长度增加三且原文本不变；重复 clientRequestId 不增加记录；过期 revision 抛 CONFLICT；非参与者读写拒绝；两用户未读独立；报价第二版保留第一版；已过期报价不计入有效数；感兴趣不产生订单。
- [ ] 执行 `node --test tests/platform-conversation.test.cjs`，确认失败。
- [ ] 将 rfq 定向提交改为进入 conversation；inbox 改为企业收件会话；实现时间线、双方消息、附件元数据、报价表单及版本、买家反馈。切身份再次校验提交权限，不保留上一身份私有 DOM。
- [ ] 重跑相关测试；实际浏览器完成买方发询盘→卖方回复报价→买方追问→卖方回复→刷新与跨标签计数，提交本任务。

### Task 4: 采购需求大厅与多卖家独立报价

**Files:** Create `requests.html`, `request.html`, `js/requests.js`, `js/request.js`, `tests/platform-requests.test.cjs`; Modify `js/rfq.js`, `js/buyer.js`, `js/seller.js`, `js/i18n.js`.

**Interfaces:** Consumes前置仓库；requests.save(input,{expectedRevision}) 返回 BuyingRequest；quotes.save 对 requestId 创建或关联该买卖双方的会话。公开 list/get 移除私人字段，所有卖家报价聚合仅返回给需求所属买家。

- [ ] 编写失败测试：公开需求必须有标题、类目、数量单位和有效期；A 需求不能被 B 编辑关闭；已关闭/过期需求拒绝新报价；两卖家独立报价、彼此不可读；买家可见两家报价；不同币种不自动排序为价格高低。
- [ ] 执行 `node --test tests/platform-requests.test.cjs`，确认失败。
- [ ] 完成通用需求表单、需求列表筛选分页与 URL、详情、卖家报价、买方修改关闭和报价比较；按类目选择单位，公开界面不泄露私人联系字段。
- [ ] 跑测试并在浏览器演示两家卖家报价与权限隔离，提交本任务。

### Task 5: 商品工作台、状态与分步发布

**Files:** Create `tests/platform-products.test.cjs`; Modify `js/supplier.js`, `js/publish.js`, `js/products.js`, `js/product.js`, `js/common.js`, `mock/categories.json`, `mock/data.js`, `js/i18n.js`, `assets/styles.css`.

**Interfaces:** Consumes products repository；action 支持 copy/approve/reject/unpublish/republish，approve/reject 仅显式 demoReview 操作模式，必须标注演示；copy 创建新的本企业草稿。save submit 进入 pending_review，保存草稿不需要完整发布字段。

- [ ] 编写失败测试：跨企业编辑失败；发布待审核不公开、通过后公开、下架后移除；驳回须有原因；复制不修改原商品；面议允许没有数值价；范围价拒绝反向区间；USD/EUR/CNY 保留；恢复草稿保留证书文件名；四类额外字段和涂装合规校验有效。
- [ ] 执行 `node --test tests/platform-products.test.cjs`，确认失败。
- [ ] 实现带筛选商品表格与演示审核面板；四步发布、完成度、预览、草稿和错误定位；增加 spec 中行业字段、贸易币种/价格方式/地点/付款字段；详情和卡片使用真实数据国家币种单位。旧详情 URL 下架时显示不可采购状态，卖家可授权预览。
- [ ] 重跑原 core/static 测试与本任务；浏览器逐类发布、审核、编辑、复制、下架验证，提交本任务。

### Task 6: 公开供应商、店铺、收藏对比与首页

**Files:** Create `suppliers.html`, `store.html`, `favorites.html`, `js/suppliers.js`, `js/store.js`, `js/favorites.js`, `tests/platform-discovery.test.cjs`; Modify `js/home.js`, `js/common.js`, `js/product.js`, `js/i18n.js`, `assets/styles.css`.

**Interfaces:** Consumes companies/products/requests/favorites repository；favorites.toggle({kind:'product'|'company',id}) 返回收藏状态；最多四件对比保存在当前用户偏好，公开 get 不返回企业私有字段。

- [ ] 编写失败测试：国家/类型/类目/认证筛选及分页；企业更新反映公开店铺；收藏按身份区分且幂等；第五件对比拒绝；下架与失效收藏保留明确提示；不同类目参数缺项显示不可比较而非零值。
- [ ] 执行 `node --test tests/platform-discovery.test.cjs`，确认失败。
- [ ] 实现供应商列表、店铺和联系入口；商品/企业收藏、对比视图；首页缩减 hero 并加供应商和近期需求；手机详情询盘入口。保留现有本地 SVG，真实照片无授权来源时不擅自替换。
- [ ] 跑测试和中英浏览器检查，提交本任务。

### Task 7: API 适配器和接口合同

**Files:** Create `js/api-repository.js`, `docs/api-contract.md`, `tests/api-repository.test.cjs`; Modify `README.md`.

**Interfaces:** Produces `MarinePlatform.createApiRepository({baseUrl,fetchImpl})`，实现上述同签名方法；会话权限由服务端身份决定，客户端 companyId 不作为可信鉴权信息。API 不默认启用。

- [ ] 编写失败测试：筛选参数和分页正确编码；请求方法/路径/正文与合同一致；401/403/409/422 和网络失败统一错误；非 JSON 错误不导致二次解析崩溃；发送重试携 clientRequestId；任何私有响应不缓存到公共数据。
- [ ] 执行 `node --test tests/api-repository.test.cjs`，确认失败。
- [ ] 实现 fetch 适配器并写每个方法的请求/响应、错误、权限、文件 asset_id 和服务端职责；记录模拟与生产差异、版本迁移和未来接入步骤。
- [ ] 使用 mock fetch 跑通过契约测试；说明本轮未验证真实后端，提交本任务。

### Task 8: 整体回归、响应式、审查与交付

**Files:** Modify `tests/static.test.cjs`, `README.md`, `docs/acceptance.md`; Create `docs/v2-verification.md`、`docs/screenshots/v2-*`。

**Interfaces:** 使用前面全部页面和测试；验收证据一一对应 spec 九项验收。

- [ ] 更新静态检查覆盖全部 16 页面与双语资源；编写失败的静态引用检查后修正缺失引用。
- [ ] 跑 `node --test tests/*.test.cjs`、所有 JS 的 `node --check` 和 `zsh -n start.command`，均需通过。
- [ ] 浏览器完成两买两卖全部闭环、身份切换无权 URL、两报价独立、状态与草稿、旧功能和失败反馈；所有页面逐一验证实际 375/768/1280 宽度、标签、焦点及弹层。记录存储迁移与失败测试证据，不清空用户数据。
- [ ] 保存并视觉检查首页、买家/卖家、会话、需求与发布截图；更新 README 演示路径、接口与限制。file 协议若被工具限制，不绕过、不声称实测。
- [ ] 按 executing-plans 做一次独立全分支审查，修复已确认问题并跑对应回归，记录无遗留重大问题及实际限制；提交最终成果。

## Self Review

已将 spec 页面、身份、买家、卖家、会话、兼容与九项验收映射到任务 1–8；Review Focus 五项均在对应任务增加测试要求。统一方法签名只定义一次，任务使用同一接口，不自行新增独立存储旁路。新页面数量为九、加原七共十六；没有把成员说明扩成真实账号服务，没有将兴趣反馈当成订单。实际实现须以验收证据完成勾选，不能用此计划代替运行验证。
