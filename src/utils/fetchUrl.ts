// Jina Reader (r.jina.ai) — free service, no API key required.
// Strips nav/ads/JS and returns clean article text, keeping token usage low.
// Max chars we pass to the model to avoid burning the free quota.
export const MAX_ARTICLE_CHARS = 8_000

export async function fetchArticle(rawUrl: string): Promise<string> {
  let url = rawUrl.trim()
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url
  }

  // Validate early so we give a useful error before hitting the network
  try { new URL(url) } catch { throw new Error('链接格式不正确') }

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 25_000) // 25-second ceiling

  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        Accept: 'text/plain',
        'X-Return-Format': 'text', // plain text, not markdown — saves tokens
      },
      signal: ctrl.signal,
    })

    if (!res.ok) {
      if (res.status === 422) throw new Error('无法解析该链接，请确认地址正确')
      if (res.status === 429) throw new Error('抓取过频，请稍等片刻')
      throw new Error(`抓取失败（HTTP ${res.status}）`)
    }

    const text = (await res.text()).trim()
    if (!text) throw new Error('未获取到正文，该页面可能需要登录或付费订阅')

    if (text.length > MAX_ARTICLE_CHARS) {
      return text.slice(0, MAX_ARTICLE_CHARS) + `\n\n[文章较长，已截取前 ${MAX_ARTICLE_CHARS.toLocaleString()} 字]`
    }
    return text
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new Error('抓取超时，请检查网络或稍后重试')
    throw e
  } finally {
    clearTimeout(timer)
  }
}

/** Rough token estimate: Chinese ~1.5 chars/token, English ~4 chars/token → use 2.5 as mixed average */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 2.5)
}
