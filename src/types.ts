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

// 訂單類別（程式判定、非 AI；711 優先），見 F3 §2-2。企業送禮＝原「企業匯單」，前台一律顯示「企業送禮」
export type BulkOrderType = '一般' | '統一711' | '企業送禮'

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
  masterOrderId?: number // 母單 Orders.Id（同母單分組/重判用；本 id = 子單 Orders.Id）
  recipient: string
  phone: string
  address: string
  productName: string
  spec: string
  qty: number
  tempLayer: TempLayer
  // 備註分兩層：rawRemark 是 SQL Orders.Remarks 原文（唯讀）；farmerRemark / driverRemark 是 AI 判定產物、存 Mongo（非 Orders 欄位、另開 Mongo 判定/衍生層）。
  rawRemark: string // 客人原始備註（= Orders.Remarks 原文，含到貨日中文句，唯讀；AI 判定唯一自由文字來源）
  farmerRemark: string // AI 產（Mongo）：給農友的作業備註（品種/數量/出貨動作）；農友端唯一顯示的備註
  driverRemark?: string // AI 產（Mongo）：印在物流單、給司機/物流的配送指示（放哪/電聯/易碎）
  csRemark?: string // SQL Orders.CustomerServiceRemark（客服備註、非 AI、不動）；補單記錄也續記於此
  variety?: string // 清洗後品種名（程式取品名【】內文字、非 AI，見 F3 §2-1）
  bulkOrderType?: BulkOrderType // 訂單類別（程式判定、711 優先）：統一711=品名開頭「711」；企業送禮=品名開頭「企業送禮」且客服備註能抓到企業名稱（抓不到退回一般）；一般=消費者單。見 F3 §2-2
  enterpriseName?: string // 企業送禮專用：從客服備註抓到的企業名稱（同企業＋同水果會整併顯示）
  judgeReason?: string // AI 判定理由（唯讀，對應 AI 回傳的 reason）
  confidence?: number // AI 判定信心 0–1（< 門檻 → 低信心）；judgeStatus 由 confidence + needsHuman 映射（見 F3 §3-3）
  needsHuman?: boolean // AI 標記需人工（true → 判定失敗 / 轉人工）
  judgeStatus: JudgeStatus
  shipStatus: ShipStatus
  shipWindow?: [string, string] // 預定出貨區間 [起, 迄]（起日即農友端顯示的可出貨起始）
  blockedDates?: string[] // 不可出貨日（AI 判定，可複數：單日 "06/07" 或區間 "06/07–06/11"）
  forcedShipDate?: string // 強制指定出貨日（客人指定，MM/DD）
  remoteAgentCode?: string // 偏遠客代（衍生自農友農園 Farmer.remoteAgentCode、非看收件地；見 F4 §5）
  printedAt?: string
  trackingNos?: string[] // 黑貓物流單號（跟黑貓要號後才有；補單可多筆）
  failReason?: string // 農友回報「無法出貨」原因
  rescheduledShipDate?: string // 貓咪改的新出貨日（配 failReason，MM/DD）
  // 未印單被取消（F0 §3-3 軟刪除）：不再無聲消失，改標「已取消」灰卡、留原分頁、保留 7 天
  cancelledAt?: string // 取消日期（MM/DD）；有值＝已取消
  cancelDismissed?: boolean // 農友已按「知道了」→ 提早收起
  orderAmount?: number // 訂單金額（結算冗餘，非判定；真值以 SQL 為準）
  auditLog?: AuditEntry[]
}

export interface Farmer {
  id: number
  farm: string // 農場/主體名稱（對應 Farmer.Name）
  phone: string
  status: '未開通' | '已開通' | '已停用'
  lastLogin?: string
  earlyShipAllowed?: boolean // 提早出貨資格：可在未達出貨時間時提早印單
  remoteAgentCode?: string // 偏遠客代（綁農園、依農園地址判定；偏遠農園才有，見 F4 §5）
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
