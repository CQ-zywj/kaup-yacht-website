# 文件与日期控件语言验证

日期：2026-10-10。

## 问题与修复

英文询盘页的原生文件按钮、空文件提示及日期提示受浏览器/系统语言影响，出现中文。新增共享 `js/form-controls.js`：文件按钮与文件名提示使用平台翻译字典，保留原文件 input、accept、multiple 与 change 处理；日期使用平台日历，可手输 YYYY-MM-DD，存储仍为 YYYY-MM-DD，期望交期保持选填。

供应商注册、企业资料、发布商品和回复询盘的文件控件同步使用该组件，动态添加认证时也会初始化。网页控件语言由平台控制，操作系统弹出的文件窗口仍使用系统语言。

## 验证结果

- `node --test tests/*.test.cjs`：44 项通过，包含非法日期、闰年日期与空交期的回归测试。
- JavaScript 语法检查与 `git diff --check` 通过。
- 浏览器中确认英文文件按钮为 Choose files、空文件提示为 No files selected，日历月份、星期、Today / Clear date 均为英文。
- 日期从 October 切换到 November，选择 2026-11-15，切换中文后日期保留；中文日历显示中文月份、星期与按钮。
- 键盘右方向键与 Enter 将日期选为 2026-11-16；切回英文后日期仍保留。
- 通过文件选择按钮选取 README.md，文件名提示与原有附件列表均更新。
- 截图：`docs/screenshots/rfq-en-localized-controls.png`。
