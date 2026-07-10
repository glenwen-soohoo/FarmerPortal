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
  // 三種備註沿用現有 Orders 表欄位（本專案擴充、不另開表）：
  rawRemark: string // 原始主單備註（= Orders.Remarks 原文，含客人填的＋系統塞的到貨日句，唯讀）
  farmerRemark: string // 給農友備註（AI 清洗+分段後；對應 Orders.RemarkFromAdmin「倉庫備註」）
  driverRemark?: string // 出貨備註（印在貨單上、給司機 / 物流看；對應 Orders.Remarks「出貨備註」）
  variety?: string // AI 清洗後品種名
  judgeReason?: string // AI 判定理由（唯讀，對應 AI 回傳的 reason）
  judgeStatus: JudgeStatus
  shipStatus: ShipStatus
  shipWindow?: [string, string] // 預定出貨區間 [起, 迄]（起日即農友端顯示的可出貨起始）
  blockedDates?: string[] // 不可出貨日（AI 判定，可複數：單日 "06/07" 或區間 "06/07–06/11"）
  forcedShipDate?: string // 強制指定出貨日（客人指定，MM/DD）
  remoteAgentCode?: string // 偏遠地區客代
  printedAt?: string
  trackingNos?: string[] // 黑貓物流單號（跟黑貓要號後才有；補單可多筆）
  failReason?: string
  auditLog?: AuditEntry[]
}

export interface Farmer {
  id: number
  name: string // 聯絡人姓名（註：現有 Farmer 主檔無此欄，聯絡方式為 Mobile/Email/LineId；此為 mock 補充）
  farm: string // 農場/主體名稱（對應 Farmer.Name）
  phone: string
  status: '未開通' | '已開通' | '已停用'
  lastLogin?: string
  earlyShipAllowed?: boolean // 提早出貨資格：可在未達出貨時間時提早印單
  // 詳細資料（Farmer 主檔，master 在 Enzo，唯讀）
  brand?: string // 品牌（對應 Farmer.Brand，與農場名 farm 為不同欄位）
  origin?: string // 產地
  cert?: string // 認證
  bank?: string // 銀行帳戶
  lineId?: string
}

export interface Product {
  id: string
  name: string
  spec: string
  isTransform: boolean // 產地直送（沿用現有 Product.IsTransform 欄位命名）
  farmerId?: number // 綁定農友（對應 ProductFarmerMap.FarmerId）
}
