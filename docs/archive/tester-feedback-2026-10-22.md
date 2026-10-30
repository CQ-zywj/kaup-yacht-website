# 测试反馈修复：2026-10-22

- 认证列表及文章列表的空状态按钮从当前页链接改为操作按钮，分别打开上传证书窗口和文章编辑器；搜索筛选产生空状态时也可使用。
- 文章编辑仅保留英文标题与英文正文，两者必填。空标签、换行及空格不算有效正文。已有文章的历史中文数据保留；新英文文章在中文界面也显示英文内容。
- 关联商品及热门商品复选框固定为 18 × 18px，点击区域至少 44px；桌面两列、手机单列。认证空状态占满列表宽度。
- 公司编辑中点击“管理认证与资质”，先保存当前供应商的本机草稿，再跳转。返回公司信息页自动恢复，包括未完成的字段、团队成员、Logo 和公司图片。上传文件存入 IndexedDB，草稿仅记录文件引用。
- 草稿不修改对外资料；正式保存仍校验完整信息，成功后清理草稿。“取消”会丢弃草稿。保存失败时不跳转，保留原表单并显示错误。草稿只包含可编辑公司字段，不包含账号密码和认证状态。

## 验证

先添加回归用例，确认五项场景均失败，再完成修复。

```sh
node --test tests/*.test.cjs
PLAYWRIGHT_MODULE_PATH=/Users/qijianxin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright node tests/browser-tester-regressions.cjs
PLAYWRIGHT_MODULE_PATH=/Users/qijianxin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright node tests/browser-supplier-flow.cjs
```

浏览器测试使用独立上下文，不修改用户浏览器内已有资料。新回归覆盖空状态操作、英文文章发布和公开详情、1298px/390px 布局、草稿恢复与附件、最终保存、取消、存储失败。原上传联动覆盖证书上传下载、产品/店铺/公司页联动、买卖家可见性、财务私有资料及跨标签同步。

界面截图：`screenshots/tester-article-editor-desktop.png`、`screenshots/tester-article-editor-mobile.png`。

前端资源缓存版本更新至 `ui20261022a`。仅修改本地，未推送仓库，未修改 Excel 文件。
