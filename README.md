# kaup-link

品牌：**智贸无疆 / KAUP LINK**

一个多行业跨境 B2B 平台前端交互原型，覆盖商品发现、供应商入驻、商品发布、询盘收发和行业资讯。项目使用原生 HTML、CSS 和 JavaScript，无需安装依赖或构建，所有业务数据均为本地演示数据，没有后端。

## 快速开始

macOS 可以直接双击 `start.command`。也可以在项目目录运行：

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

然后访问 [http://127.0.0.1:4173/index.html](http://127.0.0.1:4173/index.html)。

请使用 HTTP 方式打开。页面通过同源 `localStorage` 保存登录态、商品和询盘，直接打开 `index.html` 时，不同浏览器对本地文件来源的处理可能不同。

## 演示账号

登录页可以自动填入以下演示账号：

| 角色 | 邮箱 | 密码 |
| --- | --- | --- |
| 买家 | `buyer@marinex.demo` | `Demo123!` |
| 供应商 | `supplier@marinex.demo` | `Demo123!` |

也可以使用任意模拟信息注册。演示账号只用于本地浏览，不提供生产环境认证能力。

## 功能概览

- 中英文界面切换，支持桌面端和移动端布局。
- 按行业、类目、参数、认证、价格和关键词筛选商品，筛选条件可写入 URL。
- 查看商品参数、认证、合规信息、供应商和媒体内容。
- 买家注册登录、供应商注册入驻和公司资料维护。
- 供应商使用行业模板发布商品，支持图片预览、草稿和模拟提交。
- 买家发起采购询盘，供应商查看、标记已读并回复；状态保存在本地浏览器。
- 浏览供应商目录、行业新闻、展会和演示采购线索。

一条完整的询盘演示路径是：买家登录 → 打开商品并发起询盘 → 切换到供应商查看收件箱并回复 → 切回买家查看回复。

## 页面

| 页面 | 用途 |
| --- | --- |
| `index.html` | 首页、行业入口、搜索、精选内容和采购线索 |
| `products.html` | 商品列表、条件筛选、排序和分页 |
| `product.html` | 商品详情、参数、认证、合规信息和询盘入口 |
| `suppliers.html` | 供应商目录 |
| `rfq.html` | 商品询盘或通用采购需求 |
| `my-rfq.html` | 买家询盘列表、状态和供应商回复 |
| `inbox.html` | 供应商询盘收件箱、已读状态和回复 |
| `publish.html` | 按行业模板发布供应商品 |
| `supplier.html` | 供应商商品、草稿和提交记录 |
| `buyer-auth.html` | 买家登录和注册 |
| `supplier-auth.html` | 供应商登录和入驻 |
| `company.html` | 公司资料、认证和展示图片 |
| `news.html` | 行业资讯列表 |
| `exhibitions.html` | 展会列表 |
| `content.html` | 资讯、展会和采购线索详情 |
| `inquiry-detail.html` | 采购线索详情 |

## 项目结构

```text
.
├── assets/       # 样式与本地图片
├── js/           # 页面逻辑和共享组件
├── mock/         # 页面实际加载的演示数据
├── tests/        # Node.js 自动化测试
├── *.html        # 静态页面
└── start.command # macOS 本地启动脚本
```

页面加载 `mock/data.js` 中的商品、类目和行业数据。`mock/categories.json`、`mock/products.json` 与 `mock/industries.json` 提供同内容的 JSON 参考；修改数据时需同步更新对应的 JS 数据源。

## 本地存储

主要存储键如下：

| 键 | 内容 |
| --- | --- |
| `accounts` | 模拟账户和演示密码摘要 |
| `current_user` | 当前登录用户 |
| `supplier_profile` | 供应商公司资料 |
| `draft_products` | 商品草稿和模拟提交记录 |
| `rfq_drafts` | 买家询盘、状态和供应商回复 |
| `marine_lang` | 中英文语言偏好 |

清空该站点的浏览器存储即可重置演示数据。存储被禁用、损坏或空间不足时，页面不会伪造保存成功。

## 测试

```sh
node --test tests/*.test.cjs
```

Node.js 只用于测试，不是运行原型的前置依赖。

## 原型边界

商品、价格、公司、认证、新闻、展会和采购线索均为演示内容。项目不发送真实邮件或通知，不上传附件，也不提供真实身份认证和后台服务。接入生产环境前，账户、权限、数据存储、文件上传和询盘通知都需要由后端接管。


## Fork 保留功能

本分支保留供应商工作台、认证文件、店铺装修、财务资料、文章导入、客户管理及产品批量导入功能；数据仍保存在浏览器本地。

- [平台优化与验收说明](docs/platform-optimization-2026-10-26.md)
- [文件上传与页面联动说明](docs/local-frontend-upload-verification.md)
- [界面布局验收说明](docs/supplier-ui-layout-verification.md)
- [测试人员反馈修复说明](docs/tester-feedback-2026-10-22.md)
