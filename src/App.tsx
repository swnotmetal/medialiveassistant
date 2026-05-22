import React, { useState, useEffect } from 'react'
import { AppSettings, PromptItem, DEFAULT_PROMPTS } from './types'
import { loadSettings, saveSettings, isSessionAuthed } from './utils/storage'
import LoginPage from './components/LoginPage'
import PromptSetup from './components/PromptSetup'
import MainWorkspace from './components/MainWorkspace'

type Phase = 'loading' | 'login' | 'setup' | 'workspace'

export default function App() {
  const [phase,    setPhase]    = useState<Phase>('loading')
  const [settings, setSettings] = useState<AppSettings>({
    apiKey: '', openaiApiKey: '', model: 'gemini-2.5-flash', prompts: DEFAULT_PROMPTS,
  })

  // Async init: restore session and decrypt settings from localStorage
  useEffect(() => {
    if (isSessionAuthed()) {
      loadSettings().then(s => {
        setSettings(s)
        setPhase(s.prompts.length > 0 ? 'workspace' : 'setup')
      })
    } else {
      setPhase('login')
    }
  }, [])

  const handleLogin = () => {
    loadSettings().then(s => {
      setSettings(s)
      setPhase(s.prompts.length > 0 ? 'workspace' : 'setup')
    })
  }

  const handleSetupDone = (prompts: PromptItem[]) => {
    const updated = { ...settings, prompts }
    setSettings(updated)
    saveSettings(updated)
    setPhase('workspace')
  }

  const handleSettingsUpdate = (s: AppSettings) => {
    setSettings(s)
    saveSettings(s)
  }

  if (phase === 'loading')   return null  // sub-frame flash; no spinner needed
  if (phase === 'login')     return <LoginPage onLogin={handleLogin} />
  if (phase === 'setup')     return <PromptSetup onDone={handleSetupDone} />
  return (
    <MainWorkspace
      settings={settings}
      onSettingsUpdate={handleSettingsUpdate}
    />
  )
}
