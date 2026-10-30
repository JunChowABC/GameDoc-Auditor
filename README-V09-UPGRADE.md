# GameDoc Auditor V0.9 · 版本升级说明

> 此包不是 ChatGPT Sites 中的 V0.8 原始源码，而是 **V0.5 真实源码 + V0.8 关系画布功能复原 + V0.9 文档 UI 升级** 的独立可运行源码。原网站仍未更新；不要将此包称作原始 Sites 导出。

## 相对复原版 V0.8 的改动

| 模块 | V0.9 行为 |
| --- | --- |
| 上传反馈 | 标题与统计保持可见；结果列表固定两行；多余项目内部滚动；每项保留成功/错误文本 |
| 文档列表 | 原横向标签改为左侧纵向滚动栏；支持文档搜索、切换、选中状态 |
| Markdown 阅读 | 新增独立阅读模式，支持 GFM 表格、段落、标题、列表、引用、代码、加粗等；表格可横向滚动 |
| 审校定位 | 从结果或关系图进入原文时自动退出阅读模式，切到「按行定位」并高亮目标行 |
| 画布与规则 | 保留 V0.8 复原画布、64 条规则、自定义审校规则、别名词典和多文档冲突能力 |

## 运行

在项目目录：

```bash
python -m http.server 8010 --directory dist
```

然后打开 `http://localhost:8010`，无需账号、API、AI 或后端。Windows 用户可双击 `start-windows.bat`。

## 测试

自动化规则、导入与几何布局：

```bash
node --test tests/*.test.cjs
```

浏览器交互回归（可选：需安装 Python `playwright`、`beautifulsoup4` 与 Chromium）：

```bash
python tests/test_v09_browser.py
```

测试代码通过静态 HTML 注入脚本和样式验证页面，不需要把任何文档上传网络。覆盖批量 14 文档、列表搜索/切换、导入结果高度与滚动、Markdown 表格、HTML 转义、阅读/编辑/行号切换、关联画布节点，以及从画布定位原文。真实浏览器已运行并通过此回归，但不是原在线站点验收。

## 已知限制

- Word/PDF 导入依赖本地打包的第三方解析库；复杂表格在纯文本提取时可能丢失结构，不能自动变成 Markdown 表格。
- 纯规则匹配存在误报与漏报，跨文档关联不等于真实开发依赖。
- 与原 ChatGPT Sites V0.8 提交不保证源码一致；尚未部署到原站点。
- 部分 PDF 标准字体资源未随包提供，个别 PDF 文本提取可能失真。

## 源码文件

- `dist/app.js` — 原审校工作区及与新视图的事件衔接
- `dist/document-ui-v09.js` — Markdown 安全渲染与文档左导航增强
- `dist/document-ui-v09.css` — 新布局、固定两行反馈、表格样式
- `dist/graph.js`、`dist/graph-layout.js` — V0.8 复原关系图
- `tests/test_v09_browser.py` — 浏览器交互回归

许可证：MIT。文档与源码可放到 GitHub 进行个人作品集展示。
