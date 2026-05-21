import React, { useState } from 'react'
import { AppSettings, AVAILABLE_MODELS } from '../types'

interface Props {
  settings: AppSettings
  onUpdate: (s: AppSettings) => void
  onClose: () => void
}

export default function SettingsModal({ settings, onUpdate, onClose }: Props) {
  const [apiKey,  setApiKey]  = useState(settings.apiKey)
  const [model,   setModel]   = useState(settings.model)
  const [show,    setShow]    = useState(false)
  const [testing, setTesting] = useState(false)
  const [testMsg, setTestMsg] = useState('')

  const save = () => { onUpdate({ ...settings, apiKey: apiKey.trim(), model }); onClose() }

  const testKey = async () => {
    if (!apiKey.trim()) { setTestMsg('请先填入 API Key'); return }
    setTesting(true); setTestMsg('')
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }] }) }
      )
      if (res.ok) {
        setTestMsg('连接正常')
      } else {
        const err = await res.json().catch(() => ({}))
        setTestMsg((err as any)?.error?.message ?? `HTTP ${res.status}`)
      }
    } catch (e) {
      setTestMsg('网络错误：' + (e as Error).message)
    } finally { setTesting(false) }
  }

  const testOk = testMsg === '连接正常'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/75"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl p-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-lg tracking-tight">设置</h2>
          <button onClick={onClose} className="btn-icon" aria-label="关闭">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* API Key */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="section-label" htmlFor="api-key">Gemini API Key</label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank" rel="noopener noreferrer"
                className="text-sky-500 text-[11px] font-semibold hover:text-sky-400 transition-colors"
              >
                免费获取 →
              </a>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="api-key"
                  type={show ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="AIza…"
                  className="field pr-10"
                  autoComplete="off"
                />
                <button
                  onClick={() => setShow(s => !s)}
                  className="btn-icon absolute right-2 top-1/2 -translate-y-1/2"
                  aria-label={show ? '隐藏' : '显示'}
                >
                  {show
                    ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  }
                </button>
              </div>
              <button
                onClick={testKey} disabled={testing}
                className="btn-secondary shrink-0 flex items-center gap-1.5"
              >
                {testing && <span className="spinner" />}
                测试
              </button>
            </div>
            {testMsg && (
              <p className={`text-xs font-medium mt-2 ${testOk ? 'text-green-400' : 'text-red-400'}`}>
                {testOk ? '✓ ' : '✗ '}{testMsg}
              </p>
            )}
            <p className="text-zinc-600 text-[11px] mt-1.5">仅保存在本地浏览器，不会上传</p>
          </div>

          {/* Model */}
          <div>
            <label className="section-label block mb-3">模型</label>
            <div className="space-y-1.5">
              {AVAILABLE_MODELS.map(m => (
                <label
                  key={m.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                    model === m.id
                      ? 'border-sky-500/50 bg-sky-500/5'
                      : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800'
                  }`}
                >
                  <input
                    type="radio" name="model" value={m.id}
                    checked={model === m.id} onChange={() => setModel(m.id)}
                    className="accent-sky-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-zinc-100 text-sm font-semibold">{m.name}</p>
                    <p className="text-zinc-500 text-xs">{m.note}</p>
                  </div>
                  {model === m.id && (
                    <svg className="w-4 h-4 text-sky-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-6 pt-5 border-t border-zinc-800">
          <button onClick={save} className="btn-primary flex-1">保存</button>
          <button onClick={onClose} className="btn-secondary">取消</button>
        </div>
      </div>
    </div>
  )
}
