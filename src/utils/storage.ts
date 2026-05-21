/**
 * Security model
 * ──────────────
 * Password verification : SHA-256 hash in localStorage  (mai_auth)
 * Key derivation        : PBKDF2(password, salt, 100k iter, SHA-256) → AES-256-GCM key
 * Salt                  : random 16 bytes, stored in localStorage   (mai_salt)
 * API key               : AES-GCM encrypted blob in localStorage    (inside mai_settings)
 * Session key           : derived key exported as JWK in sessionStorage (mai_ckey)
 *                         cleared automatically when the tab closes
 *
 * A visitor who dumps localStorage sees an encrypted blob — the API key
 * cannot be recovered without the password.
 */

import { AppSettings, TokenUsage, DEFAULT_PROMPTS } from '../types'

const AUTH_KEY     = 'mai_auth'
const SALT_KEY     = 'mai_salt'
const SETTINGS_KEY = 'mai_settings'
const TOKEN_KEY    = 'mai_tokens'
const SESSION_FLAG = 'mai_session'
const SESSION_CKEY = 'mai_ckey'   // JWK of AES-GCM session key

// ── Low-level crypto helpers ──────────────────────────────────────────────────

function b64encode(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}
// Returns Uint8Array backed by a plain ArrayBuffer (required by WebCrypto APIs)
function b64decode(s: string): Uint8Array<ArrayBuffer> {
  const bin   = atob(s)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

async function pbkdf2Key(password: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  )
}

async function aesEncrypt(plaintext: string, key: CryptoKey): Promise<string> {
  const iv  = new Uint8Array(12)         // plain ArrayBuffer — required by WebCrypto
  crypto.getRandomValues(iv)
  const enc = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext),
  )
  return b64encode(iv.buffer) + ':' + b64encode(enc)
}

async function aesDecrypt(stored: string, key: CryptoKey): Promise<string> {
  const [ivB64, dataB64] = stored.split(':')
  const dec = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64decode(ivB64) }, key, b64decode(dataB64),
  )
  return new TextDecoder().decode(dec)
}

/** Retrieve the AES key that was cached in sessionStorage at login time. */
async function sessionKey(): Promise<CryptoKey | null> {
  const raw = sessionStorage.getItem(SESSION_CKEY)
  if (!raw) return null
  try {
    return await crypto.subtle.importKey(
      'jwk', JSON.parse(raw), { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
    )
  } catch { return null }
}

// ── Password / session ────────────────────────────────────────────────────────

export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return b64encode(buf)
}

export function getStoredHash(): string | null { return localStorage.getItem(AUTH_KEY) }
export function isSessionAuthed(): boolean     { return sessionStorage.getItem(SESSION_FLAG) === '1' }

/** Called on first-ever setup: create salt, derive key, hash password, open session. */
export async function setupPassword(password: string): Promise<void> {
  const salt = new Uint8Array(16)
  crypto.getRandomValues(salt)
  const key  = await pbkdf2Key(password, salt)
  const jwk  = await crypto.subtle.exportKey('jwk', key)

  localStorage.setItem(AUTH_KEY, await sha256(password))
  localStorage.setItem(SALT_KEY, b64encode(salt.buffer))
  sessionStorage.setItem(SESSION_CKEY, JSON.stringify(jwk))
  sessionStorage.setItem(SESSION_FLAG, '1')
}

/** Called on every login: verify password, re-derive key, open session. */
export async function loginWithPassword(password: string): Promise<boolean> {
  const stored = localStorage.getItem(AUTH_KEY)
  if (!stored || (await sha256(password)) !== stored) return false

  const saltB64 = localStorage.getItem(SALT_KEY)
  if (!saltB64) return false                // pre-encryption install; treat as wrong password

  const key = await pbkdf2Key(password, b64decode(saltB64))
  const jwk = await crypto.subtle.exportKey('jwk', key)
  sessionStorage.setItem(SESSION_CKEY, JSON.stringify(jwk))
  sessionStorage.setItem(SESSION_FLAG, '1')
  return true
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_FLAG)
  sessionStorage.removeItem(SESSION_CKEY)
}

// ── Settings (API key encrypted, rest plaintext) ──────────────────────────────

interface StoredSettings {
  model: string
  prompts: import('../types').PromptItem[]
  encApiKey?: string   // AES-GCM ciphertext; absent if key not yet saved
}

const DEFAULTS: AppSettings = {
  apiKey: '',
  model: 'gemini-2.0-flash',
  prompts: DEFAULT_PROMPTS,
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULTS }
    const s: StoredSettings = JSON.parse(raw)

    let apiKey = ''
    if (s.encApiKey) {
      const key = await sessionKey()
      if (key) {
        try { apiKey = await aesDecrypt(s.encApiKey, key) } catch { /* wrong key / corrupted */ }
      }
    }
    return { model: s.model ?? DEFAULTS.model, prompts: s.prompts ?? DEFAULTS.prompts, apiKey }
  } catch { return { ...DEFAULTS } }
}

export function saveSettings(settings: AppSettings): void {
  // Save prompts + model immediately (no sensitive data).
  const stored: StoredSettings = { model: settings.model, prompts: settings.prompts }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(stored))

  // Encrypt API key asynchronously and re-save if a key is present.
  if (settings.apiKey) {
    sessionKey().then(key => {
      if (!key) return
      aesEncrypt(settings.apiKey, key).then(enc => {
        stored.encApiKey = enc
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(stored))
      }).catch(() => {})
    }).catch(() => {})
  }
}

// ── Token usage (no sensitive data) ──────────────────────────────────────────

export function loadTokenUsage(): TokenUsage {
  const today = new Date().toDateString()
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (raw) {
      const { date, usage } = JSON.parse(raw)
      if (date === today) return usage
    }
  } catch {}
  return { inputTokens: 0, outputTokens: 0, requestCount: 0 }
}

export function saveTokenUsage(usage: TokenUsage): void {
  localStorage.setItem(TOKEN_KEY, JSON.stringify({ date: new Date().toDateString(), usage }))
}
