import React from 'react'
import { PromptItem, DEFAULT_PROMPTS } from '../types'
import tanukilogo from '../assets/logo/tanukilogo-removebg.png'

interface Props { onDone: (prompts: PromptItem[]) => void }

export default function PromptSetup({ onDone }: Props) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[460px] animate-fade-in">

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative w-10 h-10 shrink-0">
              <img
                src={tanukilogo}
                alt="貉捷 Tanuki"
                className="w-full h-full object-contain"
                style={{ filter: 'drop-shadow(0 2px 8px rgba(255,255,255,0.06))' }}
              />
              <div className="absolute bottom-0 right-0 w-[22%] h-[22%] bg-zinc-950" />
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-[0.12em] text-zinc-400">貉捷</p>
              <p className="text-[10px] text-zinc-600 tracking-[0.06em]">首次设置</p>
            </div>
          </div>
          <h1 className="text-[2rem] font-extrabold text-white leading-tight tracking-tight">
            已为你准备<br />4 个常用操作
          </h1>
          <p className="text-zinc-500 text-sm mt-3 leading-relaxed">
            进入后可随时在主界面直接添加、修改操作按钮。
          </p>
        </div>

        <div className="space-y-0 mb-8">
          {DEFAULT_PROMPTS.map((p, i) => (
            <div key={p.id} className="flex items-start gap-4 py-3.5 border-b border-zinc-800 last:border-0">
              <span className="text-zinc-600 text-sm font-mono w-4 shrink-0 mt-px">{i + 1}</span>
              <div>
                <p className="text-zinc-100 text-sm font-semibold">{p.label}</p>
                <p className="text-zinc-500 text-xs mt-0.5 leading-relaxed">
                  {p.prompt.replace(/\n/g, '').slice(0, 60)}…
                </p>
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => onDone(DEFAULT_PROMPTS)} className="btn-primary w-full py-3 text-base">
          开始使用
        </button>
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
