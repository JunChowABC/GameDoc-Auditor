# GameDoc Auditor V0.9

纯浏览器本地运行的游戏策划文档审校器。无需 AI、密钥或服务器。支持 64 条规则、多文档冲突检测、关联画布、自定义规则和字段别名、DOCX/PDF/Markdown 上传、Markdown 表格阅读。

**源码说明：** 本 V0.9 基于 V0.8 功能复原工程，**不是**原 Sites 在线版的原始部署源码。见归档内 `README-V08-RECOVERY.md`。

## 获取完整源码

完整的已脱敏源码位于 [GameDoc-Auditor-v0.9-public.zip](GameDoc-Auditor-v0.9-public.zip)。仓库的 Actions 工作流会尝试将归档解压到根目录，方便直接在线浏览源码。

本地运行（解压归档，进入项目目录）：

```sh
python -m http.server 8010 --directory dist
```

浏览器访问 http://localhost:8010。

源码和示例均为公开演示版本，没有个人项目文档。第三方 PDF.js 与 Mammoth 组件按各自许可证分发。

## GitHub Pages

源码解包到仓库根目录后，前往 Settings → Pages，设置 Source 为 **GitHub Actions**；推送 main 分支或手动运行 Pages 工作流。

MIT License.
