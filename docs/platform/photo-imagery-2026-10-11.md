# 配图写真化改版（2026-10-11）

## 依据与范围

用户要求：所有配图不再使用卡通/线稿风格，改为更像实物的图片。本轮把 `assets/media/` 下的扁平矢量插画全部替换为写实照片，并同步调整引用路径、轮播与文章首图的适配样式。仍是纯静态实现，无后端、无构建、无外链图片请求。

## 素材改动

| 类别 | 数量 | 说明 |
| --- | --- | --- |
| 轮播主视觉 | 3 | `banner-platform.jpg`、`banner-precision.jpg`、`banner-agriculture.jpg`，1280×720 |
| 类目默认图 | 8 | `boats`、`equipment`、`coatings`、`services` 各自的卡片图与详情图，1024×768 |
| 其它行业占位图 | 5 | `chemicals`、`bearings`、`machine-tools`、`agriculture`、`forestry`，供发布无图商品时的类目兜底 |
| 商品实拍图 | 16 | `p01.jpg`–`p16.jpg`，与 16 件示例商品一一对应，1024×768 |

- 共 32 张 JPEG（progressive，质量 82），`assets/media/` 合计约 3.0 MB。
- 被替换的 16 个 SVG 已删除；`assets/media/hero.svg` 未被任何页面引用，本轮未替换。
- 商品图与详情图分离：卡片使用 `pNN.jpg`，商品页画廊第二张仍为对应类目详情图。

## 引用与样式

- `mock/data.js`、`mock/products.json` 的 `media` 路径改为 `.jpg`，并把每件商品的首图改为专属 `pNN.jpg`。
- `js/common.js`（类目兜底）、`js/publish.js`（发布无图兜底）、`js/inbox.js`、`js/my-rfq.js`（询盘缩略图兜底）、`js/content.js`、`js/home.js`（轮播与资讯图）同步改为 `.jpg`。
- `assets/styles.css`：`.carousel-art` 由 `contain` 圆形装饰改为全幅 `cover` 照片，新增按幻灯片配色的 `--hero-scrim` 渐变压暗层；`.article-cover img` 由 `contain` 改为 `cover`，避免宽幅照片出现上下留白。
- 桌面端 `.slide-copy` 宽度收窄到 62%，保证标题落在压暗层上。

## 验证

- `node --test tests/*.test.cjs`：60 项通过，0 失败（含商品 media 文件存在性断言）。
- 渲染检查（Chromium 1440px）：首页、商品列表、商品详情（p01 / p12）、发布、供应商目录、资讯列表、展会列表、资讯详情、展会详情共 10 个页面，图片 `naturalWidth` 全部大于 0，无 4xx/5xx 请求，无残留 `.svg` 图片引用。
- 商品卡片首图核对：p01/p02/p08/p09/p15/p16 等各自渲染对应 `pNN.jpg`。
- 轮播文字对比度（白字对压暗层背景，取样于标题与正文包围盒）：桌面 11.43 / 11.54 / 8.02:1，390px 视口 12.14 / 11.87 / 8.43:1，均高于 4.5:1。
- 照片属性抽样：各图在 200×200 缩样下的独立颜色数为 12k–31k，符合摄影图特征（原矢量插画通常低于 1k）。

## 局限

- 生成素材为 AI 摄影风格图片，非真实商品实拍；上线需替换为供应商实拍。
- 本轮以尺寸、颜色分布、对比度、渲染与路径断言做客观验证，未对每张图的画面内容逐张人工核对。

## 截图

- `docs/screenshots/photos-home-desktop.png`、`photos-hero-platform.png`：首页与轮播首屏。
- `docs/screenshots/photos-products-desktop.png`、`photos-product-detail.png`：列表商品图与商品页画廊。
- `docs/screenshots/photos-news-list.png`、`photos-home-mobile.png`：资讯列表图与 390px 首页。

## 提示词留档

生成使用的提示词见 `docs/platform/photo-prompts-2026-10-11.json`，模型为 MiniMax `image-01`（`aspect_ratio` 16:9 用于轮播、4:3 用于卡片与详情，`prompt_optimizer=false`，统一追加“写实商业摄影、无文字水印、非插画/非渲染/非卡通”约束）。
