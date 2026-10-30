# GameDoc Auditor · V0.9

纯规则驱动的游戏策划文档审校工具。浏览器本地运行，无需 AI、API Key 或后端服务。

> **版本来源：** 此开源 V0.9 由 V0.8 功能复原工程升级而来，不是原 Sites 在线部署版本的逐字节源码备份。详见 [V0.8 来源说明](README-V08-RECOVERY.md) 与 [V0.9 升级说明](README-V09-UPGRADE.md)。

## 功能

- 支持 Markdown、TXT、JSON、DOCX 和可提取文字的 PDF 批量导入
- 64 条内置审校规则；支持自定义规则和字段别名
- 多文档数值、配置及流程冲突检测，关联画布与原文证据定位
- 左侧可搜索文档列表、固定两行导入结果栏、Markdown 表格阅读
- 全部本地处理，支持 JSON / Markdown 检查报告与 SVG 关系图导出

## 运行

直接下载本仓库，或者下载 [完整脱敏源码 ZIP](GameDoc-Auditor-v0.9-public.zip)。

Windows 可运行 `start-windows.bat`，也可执行：

```sh
python -m http.server 8010 --directory dist
```

浏览器打开 http://localhost:8010。

## 自动测试

```sh
node --test tests/*.test.cjs
```

GitHub Actions 的 `Validate GameDoc Auditor` 工作流在推送时运行测试。

## GitHub Pages

前往 **Settings → Pages**，把 Source 设为 **GitHub Actions**；然后在 Actions 页面重跑 `Publish static demo to GitHub Pages`。发布的是 `dist/` 静态页面。

## 隐私与版权

项目仅包含公开示例，不含实际业务文档或私有配置。浏览器中导入的文件不会上传服务器。公开分享审校导出报告之前，请检查是否包含原文。详见 [PRIVACY.md](PRIVACY.md)。

PDF.js、Mammoth 及字体资源依各自原始许可证分发。项目代码采用 [MIT License](LICENSE)。
