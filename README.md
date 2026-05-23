# 貉捷 · Tanuki

<p align="center">
  <img src="src/assets/logo/tanukilogo-removebg.png" width="128" height="128" alt="貉捷 Tanuki" />
</p>

<p align="center">
  <b>貉捷如影，巧思万千</b><br>
  <i>Crafty, like your neighborhood's tanuki</i>
</p>

<p align="center">
  <a href="https://tanuki-media-assistant.swbuilds.workers.dev">🔗 在线使用</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/swnotmetal/tanuki-media-assistant/releases/tag/v1.1.0">v1.1.0</a>
</p>

---

专为媒体人设计的轻量 AI 文字助手。一键摘要、翻译、改写，完全运行于浏览器本地，无账号、无后端、无数据上传。

## 功能

- **双引擎支持** — 同时接入 Google Gemini 与 OpenAI，按需切换模型
- **一键操作按钮** — 自定义常用指令，悬停即可编辑，无需弹窗
- **链接抓取** — 粘贴新闻链接，通过 Jina Reader 自动提取正文
- **流式输出** — 结果逐字生成，实时可见
- **黄金比例布局** — 输出面板随内容增长自适应扩展
- **Token 计数** — 跟踪每次请求用量

## 隐私与安全

无后端。除调用 Gemini / OpenAI API 时的请求外，没有任何数据离开你的浏览器。你的 API Key 经 AES-256-GCM 加密后存入 `localStorage`，密钥由你的密码通过 PBKDF2（100,000 次迭代）派生；登录状态以同一体系的哨兵值验证，不存储原始密码或其哈希。

> **建议使用 VPN**：每次调用 AI API，你的 IP 地址、请求时间及输入内容都会经过网络传输到 Google / OpenAI 的服务器。使用可信 VPN 可以隐藏你的真实 IP，避免网络运营商或公共 Wi-Fi 记录你的请求目标，为 API Key 和对话内容多加一层保护——尤其在处理敏感题材或使用公共网络时。

## 快速开始

1. 访问[在线地址](https://tanuki-media-assistant.swbuilds.workers.dev)，首次使用时设置本地密码
2. 进入**设置**，粘贴 [Gemini API Key](https://aistudio.google.com/app/apikey)（免费）和/或 OpenAI API Key
3. 在模型选择器中选择目标模型，点击操作按钮处理输入内容

## 部署（Cloudflare Workers）

```
Build command : npm run build
Output dir    : dist
Node version  : 18
```

Push 到 `main` 分支后由 GitHub Actions 自动构建并部署。

## 技术栈

React 18 · TypeScript · Vite · Tailwind CSS 3 · Google Gemini API · OpenAI API · Jina Reader · Cloudflare Workers
