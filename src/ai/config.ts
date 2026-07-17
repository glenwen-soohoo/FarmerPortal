import { useEffect, useState } from 'react'
import type { AiConfig } from './types'
import { DEFAULT_MODELS } from './providers'

// AI 設定存本機 localStorage（含金鑰）。⚠️ 僅存瀏覽器本機、不上傳、不進版控。
const LS_KEY = 'farmerportal.ai.config.v1'

const DEFAULT_CONFIG: AiConfig = {
  provider: 'gemini',
  models: { ...DEFAULT_MODELS },
  apiKeys: { gemini: '', openai: '', anthropic: '' },
  temperature: 0.2,
  confidenceThreshold: 0.7,
}

function load(): AiConfig {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return DEFAULT_CONFIG
    const saved = JSON.parse(raw) as Partial<AiConfig>
    return {
      ...DEFAULT_CONFIG,
      ...saved,
      models: { ...DEFAULT_CONFIG.models, ...(saved.models ?? {}) },
      apiKeys: { ...DEFAULT_CONFIG.apiKeys, ...(saved.apiKeys ?? {}) },
    }
  } catch {
    return DEFAULT_CONFIG
  }
}

// 設定狀態 + 自動持久化
export function useAiConfig(): [AiConfig, (patch: Partial<AiConfig>) => void] {
  const [cfg, setCfg] = useState<AiConfig>(load)
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(cfg))
    } catch {
      /* 私密模式 / 容量滿：忽略 */
    }
  }, [cfg])
  const update = (patch: Partial<AiConfig>) => setCfg((prev) => ({ ...prev, ...patch }))
  return [cfg, update]
}
