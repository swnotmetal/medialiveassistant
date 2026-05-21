import React, { useState, useRef, useCallback, useEffect, CSSProperties } from 'react'
import { AppSettings, PromptItem, TokenUsage } from '../types'
import { callGemini } from '../utils/gemini'
import { fetchArticle, estimateTokens, MAX_ARTICLE_CHARS } from '../utils/fetchUrl'
import { loadTokenUsage, saveTokenUsage, clearSession } from '../utils/storage'
import SettingsModal from './SettingsModal'

interface Props {
  settings: AppSettings
  onSettingsUpdate: (s: AppSettings) => void
}

const PHI = 1.618

type EditState   = { prompt: PromptItem; isNew: boolean } | null
type InputMode   = 'text' | 'url'
type FetchStatus = 'idle' | 'fetching' | 'done' | 'error'

export default function MainWorkspace({ settings, onSettingsUpdate }: Props) {
  // Core
  const [inputText,      setInputText]      = useState('')
  const [outputText,     setOutputText]     = useState('')
  const [activeId,       setActiveId]       = useState<string | null>(null)
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState('')
  const [tokenUsage,     setTokenUsage]     = useState<TokenUsage>(loadTokenUsage)
  const [showSettings,   setShowSettings]   = useState(false)
  const [outputExpanded, setOutputExpanded] = useState(false)
  const [inputFocused,   setInputFocused]   = useState(false)

  // Input mode: text or URL
  const [inputMode,      setInputMode]      = useState<InputMode>('text')
  const [urlValue,       setUrlValue]       = useState('')
  const [fetchedContent, setFetchedContent] = useState('')
  const [fetchStatus,    setFetchStatus]    = useState<FetchStatus>('idle')
  const [fetchError,     setFetchError]     = useState('')

  // Inline prompt editor
  const [editing,    setEditing]    = useState<EditState>(null)
  const [editLabel,  setEditLabel]  = useState('')
  const [editPrompt, setEditPrompt] = useState('')

  const abortRef  = useRef<AbortController | null>(null)
  const labelRef  = useRef<HTMLInputElement>(null)
  const urlRef    = useRef<HTMLInputElement>(null)

  // Which text is actually being sent to the model
  const activeText = inputMode === 'url' ? fetchedContent : inputText

  useEffect(() => {
    if (outputText.length > 180 && !inputFocused) setOutputExpanded(true)
    if (!outputText) setOutputExpanded(false)
  }, [outputText, inputFocused])

  useEffect(() => {
    if (editing) setTimeout(() => labelRef.current?.focus(), 60)
  }, [editing])

  useEffect(() => {
    if (inputMode === 'url') setTimeout(() => urlRef.current?.focus(), 60)
  }, [inputMode])

  /* ── URL fetch ── */
  const handleFetch = async () => {
    if (!urlValue.trim()) return
    setFetchStatus('fetching')
    setFetchError('')
    setFetchedContent('')
    try {
      const text = await fetchArticle(urlValue)
      setFetchedContent(text)
      setFetchStatus('done')
    } catch (e: any) {
      setFetchError(e?.message ?? '抓取失败')
      setFetchStatus('error')
    }
  }

  /* ── Prompt CRUD ── */
  const openNew   = () => { setEditing({ prompt: { id: '', label: '', prompt: '' }, isNew: true }); setEditLabel(''); setEditPrompt('') }
  const openEdit  = (p: PromptItem) => { setEditing({ prompt: p, isNew: false }); setEditLabel(p.label); setEditPrompt(p.prompt) }
  const closeEdit = () => setEditing(null)
  const saveEdit  = () => {
    if (!editLabel.trim() || !editPrompt.trim()) return
    const prompts = editing!.isNew
      ? [...settings.prompts, { id: Date.now().toString(), label: editLabel.trim(), prompt: editPrompt.trim() }]
      : settings.prompts.map(p => p.id === editing!.prompt.id ? { ...p, label: editLabel.trim(), prompt: editPrompt.trim() } : p)
    onSettingsUpdate({ ...settings, prompts })
    closeEdit()
  }
  const deletePrompt = (id: string) => { onSettingsUpdate({ ...settings, prompts: settings.prompts.filter(p => p.id !== id) }); closeEdit() }

  /* ── AI call ── */
  const handleProcess = useCallback(async (prompt: PromptItem) => {
    const text = inputMode === 'url' ? fetchedContent : inputText
    if (!text.trim()) {
      setError(inputMode === 'url' ? '请先抓取一个链接' : '请先输入需要处理的文字')
      return
    }
    if (!settings.apiKey) { setError('请在设置中填入 API Key'); setShowSettings(true); return }

    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setActiveId(prompt.id); setLoading(true); setError(''); setOutputText('')

    try {
      const result = await callGemini(
        settings.apiKey, settings.model, prompt.prompt, text,
        t => setOutputText(t),
        abortRef.current.signal,
      )
      const prev    = loadTokenUsage()
      const updated = {
        inputTokens:  prev.inputTokens  + (result.inputTokens  || Math.ceil((prompt.prompt.length + text.length) / 2)),
        outputTokens: prev.outputTokens + (result.outputTokens || Math.ceil(result.text.length / 2)),
        requestCount: prev.requestCount + 1,
      }
      setTokenUsage(updated); saveTokenUsage(updated)
    } catch (e: any) {
      if (e?.name !== 'AbortError') setError(e?.message ?? '请求失败，请检查 API Key 及网络')
    } finally { setLoading(false); setActiveId(null) }
  }, [inputText, fetchedContent, inputMode, settings])

  const handleStop  = () => { abortRef.current?.abort(); setLoading(false) }
  const pasteText   = async () => { try { setInputText(await navigator.clipboard.readText()) } catch {} }
  const copyOutput  = async () => { if (outputText) await navigator.clipboard.writeText(outputText) }
  const pasteUrl    = async () => { try { setUrlValue(await navigator.clipboard.readText()) } catch {} }

  /* ── Layout: golden-ratio flex-grow transition ── */
  const panelBase: CSSProperties = { transition: 'flex-grow 0.55s cubic-bezier(0.4,0,0.2,1)', flexShrink: 1, flexBasis: '0%', minHeight: 0, overflow: 'hidden' }
  const inputPanelStyle:  CSSProperties = { ...panelBase, flexGrow: outputExpanded ? 1 / PHI : 1 }
  const outputPanelStyle: CSSProperties = { ...panelBase, flexGrow: 1 }

  const editingId = editing && !editing.isNew ? editing.prompt.id : null

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-zinc-950">

      {/* ── Header ── */}
      <header className="h-12 shrink-0 flex items-center justify-between px-5 border-b border-zinc-800/70">
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-zinc-500">媒体AI助手</span>
          <span className="hidden sm:block text-zinc-700 text-xs">·</span>
          <span className="hidden sm:block text-zinc-700 text-xs">{settings.model}</span>
        </div>
        <div className="flex items-center">
          <button onClick={() => setShowSettings(true)} className="btn-ghost flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            设置
          </button>
          <button onClick={() => { clearSession(); window.location.reload() }} className="btn-ghost">退出</button>
        </div>
      </header>

      {/* ── Prompt toolbar ── */}
      <div className="shrink-0 flex items-center gap-2 px-5 py-3 border-b border-zinc-800/50 overflow-x-auto">
        {settings.prompts.map(p => {
          const isActive  = loading && activeId === p.id
          const isEditing = editingId === p.id
          return (
            <div key={p.id} className="relative group/pill shrink-0">
              <button
                onClick={() => !isEditing && handleProcess(p)}
                disabled={loading}
                className={isActive || isEditing ? 'prompt-pill-active' : 'prompt-pill'}
              >
                {isActive && <span className="spinner" />}
                {p.label}
              </button>
              {!loading && (
                <button
                  onClick={() => isEditing ? closeEdit() : openEdit(p)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full
                             bg-zinc-700 hover:bg-zinc-600 text-zinc-400
                             flex items-center justify-center
                             opacity-0 group-hover/pill:opacity-100
                             transition-opacity duration-100 cursor-pointer"
                >
                  {isEditing
                    ? <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    : <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" /></svg>
                  }
                </button>
              )}
            </div>
          )
        })}

        <button
          onClick={() => editing?.isNew ? closeEdit() : openNew()}
          className="shrink-0 btn-ghost border border-dashed border-zinc-700 hover:border-zinc-600 rounded-full px-4 py-2 text-sm"
        >
          {editing?.isNew ? '取消' : '+ 添加'}
        </button>

        {loading && <button onClick={handleStop} className="shrink-0 btn-ghost text-red-400 hover:bg-red-900/20">停止</button>}
        {error    && <span className="shrink-0 text-red-400 text-xs font-medium">{error}</span>}
      </div>

      {/* ── Inline prompt editor ── */}
      {editing && (
        <div className="shrink-0 px-5 py-3 bg-zinc-900/60 border-b border-zinc-800 animate-slide-down">
          <div className="flex items-end gap-3">
            <div className="w-36 shrink-0">
              <label className="section-label block mb-1.5" htmlFor="edit-label">按钮名称</label>
              <input ref={labelRef} id="edit-label" value={editLabel} onChange={e => setEditLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveEdit()} placeholder="如：快速摘要" className="field-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="section-label block mb-1.5" htmlFor="edit-prompt">操作指令</label>
              <input id="edit-prompt" value={editPrompt} onChange={e => setEditPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveEdit()} placeholder="如：请用3句话总结以下内容：" className="field-sm" />
            </div>
            <div className="flex items-center gap-2 shrink-0 pb-px">
              <button onClick={saveEdit} disabled={!editLabel.trim() || !editPrompt.trim()} className="btn-primary px-4 py-2 text-xs">保存</button>
              <button onClick={closeEdit} className="btn-secondary px-4 py-2 text-xs">取消</button>
              {!editing.isNew && (
                <button onClick={() => deletePrompt(editing.prompt.id)} className="btn-ghost text-red-400 hover:bg-red-900/20 px-2 py-2">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Panels area ── */}
      <div className="flex-1 flex flex-col min-h-0">

        {/* ── Input panel ── */}
        <div
          style={inputPanelStyle}
          className="flex flex-col px-5 pt-4 pb-2"
          onFocus={() => { setInputFocused(true); setOutputExpanded(false) }}
          onBlur={()  => setInputFocused(false)}
        >
          {/* Label row: mode tabs on left, actions on right */}
          <div className="flex items-center justify-between mb-2 shrink-0">
            {/* Segmented mode control */}
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => setInputMode('text')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold tracking-[0.1em] uppercase transition-all duration-150 ${
                  inputMode === 'text' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-400'
                }`}
              >
                文字输入
              </button>
              <button
                onClick={() => setInputMode('url')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold tracking-[0.1em] uppercase transition-all duration-150 ${
                  inputMode === 'url' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-400'
                }`}
              >
                链接抓取
              </button>
            </div>

            {/* Actions: only relevant ones per mode */}
            {inputMode === 'text' ? (
              <div className="flex gap-1">
                <button onClick={pasteText} className="btn-ghost flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                  </svg>
                  粘贴
                </button>
                <button onClick={() => setInputText('')} className="btn-ghost">清空</button>
              </div>
            ) : (
              fetchedContent && (
                <button
                  onClick={() => { setFetchedContent(''); setFetchStatus('idle'); setFetchError('') }}
                  className="btn-ghost"
                >
                  清除
                </button>
              )
            )}
          </div>

          {/* ── Content area: swaps between textarea and URL panel ── */}
          {inputMode === 'text' ? (

            /* Text mode — plain textarea */
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={"粘贴或输入需要处理的文字…\n\n支持新闻稿、采访记录、外文内容等。"}
              className="flex-1 min-h-0 w-full bg-zinc-900 border border-zinc-800 rounded-2xl
                         px-5 py-4 text-zinc-100 text-sm leading-relaxed resize-none
                         placeholder-zinc-600 focus:outline-none focus:border-zinc-700
                         transition-colors duration-200"
            />

          ) : (

            /* URL mode — fetch input + content preview */
            <div className="flex-1 min-h-0 flex flex-col gap-2">

              {/* URL input row */}
              <div className="shrink-0 flex gap-2">
                <input
                  ref={urlRef}
                  value={urlValue}
                  onChange={e => setUrlValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleFetch()}
                  placeholder="粘贴新闻链接，如 https://www.bbc.com/news/..."
                  className="field flex-1"
                />
                <button
                  onClick={pasteUrl}
                  className="btn-secondary px-3 shrink-0"
                  aria-label="粘贴链接"
                  title="粘贴剪贴板链接"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                  </svg>
                </button>
                <button
                  onClick={handleFetch}
                  disabled={!urlValue.trim() || fetchStatus === 'fetching'}
                  className="btn-primary shrink-0 flex items-center gap-2"
                >
                  {fetchStatus === 'fetching'
                    ? <><span className="spinner" />抓取中</>
                    : <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                        </svg>
                        抓取
                      </>
                  }
                </button>
              </div>

              {/* Content preview area */}
              <div className={`flex-1 min-h-0 overflow-y-auto rounded-2xl px-5 py-4 border transition-colors duration-200 ${
                fetchStatus === 'done'    ? 'bg-zinc-900 border-zinc-800' :
                fetchStatus === 'error'   ? 'bg-zinc-900 border-red-900/40' :
                fetchStatus === 'fetching'? 'bg-zinc-900 border-sky-500/20' :
                                            'bg-zinc-900/50 border-zinc-800/50'
              }`}>
                {fetchStatus === 'fetching' && (
                  <div className="flex items-center gap-2 text-sky-500 text-sm">
                    <span className="spinner" />
                    正在抓取正文…
                  </div>
                )}
                {fetchStatus === 'error' && (
                  <p className="text-red-400 text-sm">{fetchError}</p>
                )}
                {fetchStatus === 'done' && fetchedContent && (
                  <>
                    <p className="text-zinc-100 text-sm leading-relaxed whitespace-pre-wrap">{fetchedContent}</p>
                    {/* Token efficiency info */}
                    <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center gap-3 text-[11px] text-zinc-500">
                      <span>{fetchedContent.length.toLocaleString()} 字</span>
                      <span>·</span>
                      <span>约 {estimateTokens(fetchedContent).toLocaleString()} tokens</span>
                      {fetchedContent.includes('[文章较长，已截取') && (
                        <><span>·</span><span className="text-amber-500">已截取（最多 {MAX_ARTICLE_CHARS.toLocaleString()} 字）</span></>
                      )}
                    </div>
                  </>
                )}
                {fetchStatus === 'idle' && (
                  <p className="text-zinc-600 text-sm select-none leading-relaxed">
                    支持 BBC、CNN、纽约时报、财新、澎湃等主流新闻网站。<br />
                    通过 Jina Reader 抓取正文，免费且节省 token。
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="shrink-0 h-px bg-zinc-800/70 mx-5" />

        {/* ── Output panel ── */}
        <div style={outputPanelStyle} className="flex flex-col px-5 pt-3 pb-3">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <div className="flex items-center gap-3">
              <span className="section-label">处理结果</span>
              {loading && (
                <span className="flex items-center gap-1.5 text-sky-500 text-[11px] font-semibold">
                  <span className="spinner" />生成中
                </span>
              )}
            </div>
            {outputText && !loading && (
              <div className="flex gap-1">
                <button onClick={() => setOutputExpanded(v => !v)} className="btn-ghost flex items-center gap-1.5">
                  {outputExpanded
                    ? <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" /></svg>收起</>
                    : <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>展开</>
                  }
                </button>
                <button onClick={copyOutput} className="btn-ghost flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                  </svg>
                  复制
                </button>
              </div>
            )}
          </div>
          <div className={`flex-1 min-h-0 overflow-y-auto bg-zinc-900 rounded-2xl px-5 py-4
              text-zinc-100 text-sm leading-relaxed border transition-colors duration-200
              ${loading ? 'border-sky-500/20' : 'border-zinc-800'}`}
          >
            {outputText
              ? <p className={`whitespace-pre-wrap ${loading ? 'typing-dot' : ''}`}>{outputText}</p>
              : <p className="text-zinc-600 select-none">{loading ? '' : '点击上方按钮，结果将显示在这里。'}</p>
            }
          </div>
        </div>

      </div>

      {/* ── Footer ── */}
      <footer className="h-8 shrink-0 flex items-center justify-between px-5 border-t border-zinc-800/70">
        <div className="flex items-center gap-4 text-[11px] text-zinc-600">
          <span>今日</span>
          <span>输入&nbsp;<b className="text-zinc-400">{tokenUsage.inputTokens.toLocaleString()}</b></span>
          <span>输出&nbsp;<b className="text-zinc-400">{tokenUsage.outputTokens.toLocaleString()}</b></span>
          <span>请求&nbsp;<b className="text-zinc-400">{tokenUsage.requestCount}</b>&nbsp;/&nbsp;1500</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-14 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-sky-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((tokenUsage.requestCount / 1500) * 100, 100)}%` }} />
          </div>
          {tokenUsage.requestCount >= 1400 && <span className="text-red-400 text-[10px] font-semibold">接近上限</span>}
        </div>
      </footer>

      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdate={s => { onSettingsUpdate(s); setShowSettings(false) }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
