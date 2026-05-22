export interface PromptItem {
  id: string
  label: string
  prompt: string
}

export interface AppSettings {
  apiKey: string
  openaiApiKey: string
  model: string
  prompts: PromptItem[]
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  requestCount: number
}

export type Provider = 'gemini' | 'openai'

export const AVAILABLE_MODELS: { id: string; name: string; note: string; provider: Provider }[] = [
  // Gemini 2.5 — current stable generation, free tier available
  { id: 'gemini-2.5-flash',      name: 'Gemini 2.5 Flash',      note: '快速 · 免费 · 推荐',  provider: 'gemini' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', note: '极速 · 最省费',        provider: 'gemini' },
  { id: 'gemini-2.5-pro',        name: 'Gemini 2.5 Pro',        note: '高质量 · 有限免费',    provider: 'gemini' },
  // Gemini 3.x — newest generation
  { id: 'gemini-3.5-flash',      name: 'Gemini 3.5 Flash',      note: '最新旗舰 · 付费',      provider: 'gemini' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', note: '最新轻量 · 付费',      provider: 'gemini' },
  // OpenAI
  { id: 'gpt-4o-mini',           name: 'GPT-4o mini',           note: '快速 · 省费',          provider: 'openai' },
  { id: 'gpt-4o',                name: 'GPT-4o',                note: '均衡 · 通用',          provider: 'openai' },
  { id: 'gpt-4.1-mini',          name: 'GPT-4.1 mini',          note: '指令优化 · 省费',      provider: 'openai' },
  { id: 'o4-mini',               name: 'o4-mini',               note: '深度推理',             provider: 'openai' },
]

// Translation prompt auto-detects language — never translates back to source
export const DEFAULT_PROMPTS: PromptItem[] = [
  {
    id: '1',
    label: '快速摘要',
    prompt: '用3—5句话简明总结以下内容，突出最核心的信息，去掉冗余细节：\n\n',
  },
  {
    id: '2',
    label: '智能翻译',
    prompt: '你是专业翻译。检测输入文字的语言：若为中文则仅输出英文译文；若为英文或其他语言则仅输出简体中文译文。不输出原文，不加任何说明，只输出译文：\n\n',
  },
  {
    id: '3',
    label: '新闻改写',
    prompt: '将以下内容改写为简洁专业的新闻稿风格，突出时间、人物、事件要素，去除口语化表达：\n\n',
  },
  {
    id: '4',
    label: '要点提取',
    prompt: '从以下内容中提取5个关键要点，每条不超过20字，用数字编号列出：\n\n',
  },
]
