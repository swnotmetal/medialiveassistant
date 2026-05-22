import React, { useState, useEffect } from 'react'
import {
  getStoredHash, setupPassword, loginWithPassword, isSessionAuthed,
} from '../utils/storage'
import tanukilogo from '../assets/logo/tanukilogo-removebg.png'

interface Props { onLogin: () => void }

const STEPS = [
  {
    n: '01',
    title: '获取免费 API Key',
    body: '前往 Google AI Studio，注册后即可免费获取 Gemini API Key。进入工具后在「设置」中粘贴。',
  },
  {
    n: '02',
    title: '设置操作按钮',
    body: '将常用指令保存为一键按钮，如「快速摘要」「智能翻译」。悬停按钮可随时编辑。',
  },
  {
    n: '03',
    title: '粘贴文字或抓取链接',
    body: '直接粘贴稿件、采访记录，或切换到「链接抓取」输入新闻网址，自动提取正文。',
  },
  {
    n: '04',
    title: '一键处理',
    body: '点击操作按钮，结果即时流式输出。同一内容可反复用不同指令处理。',
  },
]

export default function LoginPage({ onLogin }: Props) {
  const [isFirst, setIsFirst] = useState(false)
  const [pw,      setPw]      = useState('')
  const [pw2,     setPw2]     = useState('')
  const [err,     setErr]     = useState('')
  const [busy,    setBusy]    = useState(false)

  useEffect(() => { setIsFirst(!getStoredHash()) }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      if (isFirst) {
        if (pw.length < 4)  { setErr('密码至少 4 位'); return }
        if (pw !== pw2)      { setErr('两次输入不一致'); return }
        await setupPassword(pw)
        onLogin()
      } else {
        const ok = await loginWithPassword(pw)
        if (!ok) { setErr('密码错误'); return }
        onLogin()
      }
    } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
    <div className="flex-1 flex flex-col md:flex-row">

      {/* ── Left column: login form ── */}
      <div className="w-full md:w-2/5 flex flex-col justify-center px-10 py-16 md:border-r border-zinc-800">
        <div className="max-w-xs mx-auto w-full">

          {/* ── Hero brand block ── */}
          <div className="flex flex-col items-center text-center mb-10">
            {/* Logo — removebg, floats on dark bg */}
            <div className="relative mb-5">
              <img
                src={tanukilogo}
                alt="貉捷 Tanuki"
                className="w-36 h-36 object-contain"
                style={{ filter: 'drop-shadow(0 8px 32px rgba(255,255,255,0.06))' }}
              />
              {/* Mask Gemini badge at bottom-right */}
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-zinc-950" />
            </div>

            <p className="text-xl font-extrabold tracking-[0.15em] text-white mb-1.5">貉捷</p>
            <p className="text-[11px] text-zinc-600 tracking-[0.08em] leading-relaxed">
              Crafty, like your neighborhood's tanuki
            </p>
          </div>

          {/* ── Form section ── */}
          <div>
            <h1 className="text-2xl font-extrabold text-white leading-tight tracking-tight mb-1">
              {isFirst ? '创建密码' : '输入密码'}
            </h1>
            <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
              {isFirst
                ? '密码只存储在你的本地浏览器，用于加密你的 API Key。'
                : '继续使用前请验证身份。'}
            </p>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="section-label block mb-2" htmlFor="pw">
                  {isFirst ? '设置密码（至少 4 位）' : '密码'}
                </label>
                <input
                  id="pw" type="password" value={pw}
                  onChange={e => setPw(e.target.value)}
                  placeholder="••••••••"
                  className="field"
                  autoFocus autoComplete={isFirst ? 'new-password' : 'current-password'}
                />
              </div>

              {isFirst && (
                <div>
                  <label className="section-label block mb-2" htmlFor="pw2">确认密码</label>
                  <input
                    id="pw2" type="password" value={pw2}
                    onChange={e => setPw2(e.target.value)}
                    placeholder="••••••••"
                    className="field" autoComplete="new-password"
                  />
                </div>
              )}

              {err && <p className="text-red-400 text-xs font-medium">{err}</p>}

              <button type="submit" disabled={busy} className="btn-primary w-full mt-2">
                {busy && <span className="spinner" />}
                {isFirst ? '创建并进入' : '进入'}
              </button>
            </form>

            {!isFirst && (
              <p className="text-zinc-600 text-[11px] mt-6 leading-relaxed">
                忘记密码？在浏览器控制台执行{' '}
                <code className="text-zinc-500 font-mono bg-zinc-900 px-1 py-0.5 rounded text-[10px]">
                  localStorage.clear()
                </code>{' '}
                后刷新页面重新设置（API Key 需重新输入）。
              </p>
            )}
          </div>

        </div>
      </div>

      {/* ── Right column: usage guide ── */}
      <div className="hidden md:flex w-3/5 flex-col justify-center px-16 py-16 relative overflow-hidden">

        {/* Background logo watermark */}
        <div
          className="absolute inset-0 flex items-center justify-end pr-8 pointer-events-none select-none"
          aria-hidden="true"
        >
          <div className="relative w-[55%] aspect-square opacity-[0.04]">
            <img src={tanukilogo} alt="" className="w-full h-full object-contain" />
            <div className="absolute bottom-0 right-0 w-[20%] h-[20%] bg-zinc-950" />
          </div>
        </div>

        <div className="max-w-lg relative z-10">

          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-600 mb-6">
            使用说明
          </p>
          <h2 className="text-2xl font-extrabold text-white leading-tight tracking-tight mb-3">
            专为媒体人设计的<br />轻量 AI 文字助手
          </h2>
          <p className="text-zinc-500 text-sm leading-relaxed mb-12">
            在直播准备、采访整理和资讯跟踪中快速完成摘要、翻译、改写。
            完全运行于浏览器本地，没有后端，没有账号体系。
          </p>

          {/* Steps */}
          <div className="space-y-8">
            {STEPS.map(s => (
              <div key={s.n} className="flex gap-6">
                <span className="text-[11px] font-bold tabular-nums text-zinc-700 w-6 shrink-0 mt-0.5">
                  {s.n}
                </span>
                <div>
                  <p className="text-zinc-200 text-sm font-semibold mb-1">{s.title}</p>
                  <p className="text-zinc-500 text-sm leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Divider + privacy note */}
          <div className="mt-12 pt-8 border-t border-zinc-800">
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-zinc-600 mb-3">
              隐私与安全
            </p>
            <p className="text-zinc-500 text-sm leading-relaxed">
              你的 API Key 经 AES-256 加密后才存入浏览器，密码即密钥。
              每台设备的密码和数据完全独立，互不干扰。
              除调用 Google Gemini API 时发送你的文字外，没有任何数据离开你的浏览器。
            </p>
          </div>

        </div>
      </div>
    </div>

    {/* ── Author footer ── */}
    <footer className="shrink-0 flex items-center justify-center gap-2.5 py-3 border-t border-zinc-900">
      <span className="text-[10px] text-zinc-600">@Shuang Wu 2026 All rights reserved</span>
      <span className="text-zinc-800 text-[10px]">·</span>
      <a
        href="https://github.com/swnotmetal"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub"
        className="text-zinc-700 hover:text-zinc-400 transition-colors duration-150"
      >
        <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
        </svg>
      </a>
    </footer>

    </div>
  )
}
