// 07/01 兩軸狀態：判定狀態（AI/人工判定進度）× 出貨狀態（出貨流程位置）
export type JudgeStatus =
  | '尚未判定'
  | 'AI判定完成'
  | 'AI判定完成(低信心)'
  | 'AI判定失敗'
  | '人工修正判定'

export type ShipStatus =
  | '未付款'
  | '未達出貨時間'
  | '可出貨'
  | '已印單'
  | '改單待重印'
  | '已出貨'
  | '已到貨'
  | '逾期未出'
  | '無法出貨'
  | '訂單失敗'

export type TempLayer = '常溫' | '冷藏' | '冷凍'

// 手動改單稽核
export interface AuditEntry {
  by: string
  at: string
  field: string
  from: string
  to: string
}

export interface Order {
  id: string
  orderNumber: string
  farmerId: number
  recipient: string
  phone: string
  address: string
  productName: string
  spec: string
  qty: number
  tempLayer: TempLayer
  rawRemark: string // 原始主單備註（客人母單原文，唯讀）
  cleanRemark: string // 給農友備註（AI 清洗+分段後）
  shipRemark?: string // 出貨備註（印在貨單上、給司機 / 物流看）
  variety?: string // AI 清洗後品種名
  judgeStatus: JudgeStatus
  shipStatus: ShipStatus
  shipWindow?: [string, string] // 預定出貨區間 [起, 迄]（訂單本身可出貨日期）
  shippableDate?: string // 農友端顯示用（區間起日；沿用）
  blockedDates?: string[] // 不可出貨日（AI 判定，可複數：單日 "06/07" 或區間 "06/07–06/11"）
  forcedShipDate?: string // 強制指定出貨日（客人指定，MM/DD）
  remoteAgentCode?: string // 偏遠地區客代
  isUpdated?: boolean
  printedAt?: string
  trackingNos?: string[] // 黑貓物流單號（跟黑貓要號後才有；補單可多筆）
  isWeekendPref?: boolean
  isWeekdayPref?: boolean
  failReason?: string
  auditLog?: AuditEntry[]
}

export interface Farmer {
  id: number
  name: string // 聯絡人姓名
  farm: string // 農場/品牌
  phone: string
  status: '未開通' | '已開通' | '已停用'
  lastLogin?: string
  earlyShip?: boolean // 提早出貨資格：可在未達出貨時間時提早印單
  // 詳細資料（Farmer 主檔，master 在 Enzo，唯讀）
  brand?: string
  origin?: string // 產地
  cert?: string // 認證
  bank?: string // 銀行帳戶
  lineId?: string
}

export interface Product {
  id: string
  name: string
  spec: string
  isTransform: boolean // 產地直送
  boundFarmerId?: number
}
