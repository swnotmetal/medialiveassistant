# 貉捷 · Tanuki

<p align="center">
  <img src="src/assets/logo/tanukilogo-removebg.png" width="128" height="128" alt="貉捷 Tanuki" />
</p>

<p align="center">
  <b>貉捷如影，巧思万千</b><br>
  <i>Crafty, like your neighborhood's tanuki</i>
</p>

---

专为媒体人设计的轻量 AI 文字助手。一键摘要、翻译、改写，完全运行于浏览器本地，无账号、无后端、无数据上传。

## 功能

- **一键操作按钮** — 自定义常用指令，悬停即可编辑，无需弹窗
- **链接抓取** — 粘贴新闻链接，通过 Jina Reader 自动提取正文
- **流式输出** — 结果逐字生成，实时可见
- **黄金比例布局** — 输出面板随内容增长自适应扩展
- **Token 计数** — 跟踪每日用量，对照 Gemini 免费额度（1500 次/天）

## 隐私与安全

无后端。除调用 Google Gemini API 时的请求外，没有任何数据离开你的浏览器。你的 API Key 经 AES-256-GCM 加密后存入 `localStorage`，密钥由你的密码通过 PBKDF2（100,000 次迭代）派生。

## 快速开始

1. 访问部署地址，首次使用时设置本地密码
2. 进入**设置**，粘贴 [Gemini API Key](https://aistudio.google.com/app/apikey)（免费）
3. 点击操作按钮处理输入内容

## 部署（Cloudflare Pages）

```
Build command : npm run build
Output dir    : dist
Node version  : 18
```

## 技术栈

React 18 · TypeScript · Vite · Tailwind CSS 3 · Google Gemini API · Jina Reader
