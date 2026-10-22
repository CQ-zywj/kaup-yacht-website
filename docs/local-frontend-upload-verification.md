# 本地上传与展示联动

日期：2026-10-21。范围：本地前端，不改 GitHub 或 Vercel。

## 入口

- 认证中心：`certifications.html`，上传一份认证的多张图片/多份 PDF，编辑公开设置、关联产品、查看与下载。
- 公司管理：`company.html`，读取认证中心的数据，编辑团队介绍与照片、上传公司 Logo。
- 店铺装修：`store-decoration.html`，Logo、1–3 张 Banner、标语和主题。
- 财务中心：`finance.html`，开户名称、银行、账号、SWIFT、可选银行证明。
- 店铺：`storefront.html?supplier_id=供应商ID`，公开认证、Logo、Banner、团队。
- 公司公开页：`company-public.html?supplier_id=供应商ID`，从店铺内「公司资料」按钮进入，买家/卖家/游客均可浏览。
- 产品：认证中心关联产品后，公开且在有效期内的认证出现在该产品详情页，可打开附件。

## 展示规则

新上传认证默认私有，可在认证编辑中勾选公开。企业资质、授权类证件始终私有；授权附件只在所属供应商的管理详情中出现。公开认证不要求先模拟核验，未核验资料明确标记状态。已驳回、未生效和过期证书不在公开页面展示。旧版公司认证兼容显示，只有文件名的历史记录提示重新上传。

银行信息单独保存在 IndexedDB 的 finance store，不写入公开公司资料。管理页面按当前供应商读取。该机制只用于前端流程演示，不能替代服务端鉴权。

文件保存在当前浏览器 IndexedDB。重新打开页面仍可读取；换浏览器、换设备、换端口或域名不会共享。浏览器清理站点数据会删除文件。Blob URL 仅在使用时生成，不作为永久地址保存。

## 文件要求

| 类型 | 格式 | 限制 |
| --- | --- | --- |
| 银行证明 | JPG/PDF | 5MB |
| 认证附件 | JPG/PNG/PDF | 图片5MB、PDF10MB |
| Logo | PNG/SVG | 至少400×400px，2MB；拒绝含主动内容的SVG |
| Banner | JPG/PNG | 1920×480px，每张3MB，最多3张 |
| 团队照片 | JPG/PNG | 5MB |

## 验证方式

启动本地服务：`python3 -m http.server 4173 --bind 127.0.0.1`。

自动化逻辑与资源检查：`node --test tests/*.test.cjs`。

浏览器集成验收：`node tests/browser-supplier-flow.cjs`，需要可用的 Playwright 和 Chromium。Playwright 在独立运行时中时，通过 `PLAYWRIGHT_MODULE_PATH` 指定它的绝对模块目录；不要求为网站安装运行依赖。

集成验收使用独立浏览器上下文及假资料，检查多PDF上传、刷新后读取与下载、关联产品、买家公司与店铺展示、Logo/团队/多Banner、格式拦截、银行资料私有展示、跨标签隐藏/重新公开/删除、英文界面及390px移动布局。不改日常浏览器数据。
