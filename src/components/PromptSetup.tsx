import React from 'react'
import { PromptItem, DEFAULT_PROMPTS } from '../types'

interface Props { onDone: (prompts: PromptItem[]) => void }

export default function PromptSetup({ onDone }: Props) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[460px] animate-fade-in">

        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500">首次设置</span>
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
  )
}
