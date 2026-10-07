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
  // 送 AI 前由系統把 defaultShipWindow 逐日展開、標星期與是否不收件（如 "08/01(六,不收件)"）；
  // 讓 AI 查表判斷曆法、不自己算。編輯範本時不必填，送出時自動補。
  shipWindowDays?: string[]
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

// AI 逐子單輸出：逐字對齊 production AiJudgementResult（三個日期欄分工、無 shiftSteps/shipWindow；區間由後端 F2 算）
export interface JudgeItem {
  orderId: number
  subOrderNo?: string
  farmerRemark: string | null
  driverRemark: string | null
  blockedDates: string[]
  blockedWeekdays: number[] // 週期性不出貨星期（ISO：1=一…7=日）；星期規則用這個、不枚舉日期
  forcedShipDate: string | null // 指定「就那一天」出貨
  earliestShipDate: string | null // 下限（X 之後才出）
  latestShipDate: string | null // 上限（到貨期限反推的最晚出貨日）
  confidence: number
  needsHuman: boolean
  reason: string | null
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
