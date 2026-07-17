// AI 判定測試台型別（對齊「規劃文件(新) F3 §3-2 / §3-3」）
// 這一層只服務「規劃階段本地測試」，與正式 Order 型別分開，貼近未來後端要送 / 收的 JSON。

// 母單子項（一張子單，對應 §3-2 items[]）
export interface MasterItem {
  orderId: number
  subOrderNo: string
  farm: string
  productName: string
  spec: string
  qty: number
  tempLayer: string // 常溫 / 冷藏 / 冷凍
  defaultShipWindow: [string, string] // [起, 迄] MM/DD
}

// 母單輸入（一張母單一個 AI 請求，§3-2）
export interface MasterInput {
  masterOrderId: number
  masterOrderNo: string
  orderDate: string // YYYY-MM-DD
  rawRemark: string // = Orders.Remarks 原文（AI 唯一自由文字來源）
  carrierLeadDays: number // 黑貓到貨天數，供到貨日反推出貨日
  items: MasterItem[]
}

// AI 逐子單輸出（§3-3；shipWindow 平移決策併入 AI，見 F2 §2-5）
export interface JudgeItem {
  orderId: number
  subOrderNo?: string
  farmerRemark: string
  driverRemark: string
  blockedDates: string[]
  forcedShipDate: string | null
  // 出貨區間平移：AI 依備註決定「要不要平移、平移幾步」，系統執行固定長度後移
  shiftSteps: number // 0 = 不平移；1 = 整段後移一個區間長度；2 = 兩個…（F2 §2-5）
  shipWindow: [string, string] // 平移後的可出貨區間 [起, 迄]（MM/DD）
  confidence: number
  needsHuman: boolean
  reason: string
}
export interface JudgeResponse {
  results: JudgeItem[]
}

// Provider（§3-1 provider 可插拔）
export type Provider = 'gemini' | 'openai' | 'anthropic'

export interface AiConfig {
  provider: Provider
  models: Record<Provider, string>
  apiKeys: Record<Provider, string>
  temperature: number
  confidenceThreshold: number // 低於此值 → 低信心（§3-5，門檻可調）
}

// 一次呼叫的完整結果（含透明化：送出的 payload / 原始回覆）
export interface CallResult {
  ok: boolean
  provider: Provider
  model: string
  ms: number
  rawText: string // AI 原始回覆文字
  parsed?: JudgeResponse // 解析成功才有
  parseError?: string // JSON 解析失敗訊息
  error?: string // 呼叫層錯誤（網路 / 金鑰 / HTTP）
  usage?: string // token 用量摘要（各家格式不同，統一成字串）
  requestBody: string // 實際送出的 body（除錯用；已隱去金鑰）
}
