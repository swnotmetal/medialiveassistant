# 媒体AI助手 / Media Live Assistant

A lightweight, fully client-side AI text tool for journalists and broadcasters — summarise, translate, and rewrite articles in seconds.

## Features

- **Prompt buttons** — save custom one-click instructions, edit inline, no modals
- **URL fetch** — paste a news link; the article body is extracted automatically via Jina Reader
- **Streaming output** — results appear word-by-word as they generate
- **Golden-ratio layout** — output panel expands proportionally as results grow
- **Token counter** — tracks daily usage against Gemini's free-tier limit (1 500 req / day)
- **All Chinese output** by default; explicit language instructions in prompts take precedence

## Privacy & Security

- No backend. Zero data leaves your browser except the API call to Google.
- Your Gemini API Key is **AES-256-GCM encrypted** in `localStorage` using a key derived from your password via PBKDF2 (100 000 iterations). Someone with access to your browser storage cannot read your key without your password.
- Each browser / device has its own independent password and encrypted storage.

## Quick Start

1. Visit the deployed URL; set a local password on first visit.
2. Open **Settings** and paste your [Gemini API Key](https://aistudio.google.com/app/apikey) (free).
3. Click a prompt button to process whatever is in the input panel.

## Deploy (Cloudflare Pages)

```
Build command : npm run build
Output dir    : dist
Node version  : 18
```

## Stack

React 18 · TypeScript · Vite · Tailwind CSS 3 · Google Gemini API · Jina Reader
