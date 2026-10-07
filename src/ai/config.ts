import { useEffect, useState } from 'react'
import type { AiConfig } from './types'
import { DEFAULT_MODELS } from './providers'

// AI 設定存本機 localStorage（含金鑰）。⚠️ 僅存瀏覽器本機、不上傳、不進版控。
const LS_KEY = 'farmerportal.ai.config.v1'

const DEFAULT_CONFIG: AiConfig = {
  // 對齊 production farmer-portal：預設走 OpenAI gpt-5.4-mini、temperature 0
  provider: 'openai',
  models: { ...DEFAULT_MODELS },
  apiKeys: { gemini: '', openai: '', anthropic: '' },
  temperature: 0,
  confidenceThreshold: 0.7,
}

function load(): AiConfig {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return DEFAULT_CONFIG
    const saved = JSON.parse(raw) as Partial<AiConfig>
    const cfg: AiConfig = {
      ...DEFAULT_CONFIG,
      ...saved,
      models: { ...DEFAULT_CONFIG.models, ...(saved.models ?? {}) },
      apiKeys: { ...DEFAULT_CONFIG.apiKeys, ...(saved.apiKeys ?? {}) },
    }
    // 遷移：把舊預設 gpt-4o-mini 升級為 production 的 gpt-5.4-mini（保留使用者金鑰與其餘設定）
    if (cfg.models.openai === 'gpt-4o-mini') cfg.models.openai = 'gpt-5.4-mini'
    return cfg
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
