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
  | '取消'

export type TempLayer = '常溫' | '冷藏' | '冷凍'

// 企業匯單分類（前端中文 union）：一般 / 統一711 / 企業送禮
export type BulkOrderType = '一般' | '統一711' | '企業送禮'

// 手動改單稽核
export interface AuditEntry {
  by: string
  at: string
  field: string
  from: string
  to: string
}

// Order 為 SUPERSET：同時支援工程師版農友端（orderId / earliestShipDate / blockedWeekdays /
// shipWindow 迄日可 null）與 demo 後台/外殼既有欄位（cancelledAt / cancelDismissed）。
export interface Order {
  id: string // 品項列唯一 key（api 模式 = OrderDetailId）
  orderId?: number // 子單 Orders.Id（印單/無法出貨動作與判定層 key；api 模式填入）
  orderNumber: string
  farmerId: number
  masterOrderId?: number // 母單 Orders.Id（副單以 AddOrderId 指向；同母單分組/重判用）
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
  variety?: string // 清洗後品種名
  bulkOrderType?: BulkOrderType // 企業匯單分類（前台顯示 一般 / 7-11 / 企業送禮；F11）
  enterpriseName?: string // 企業名（企業送禮才有；相同企業整併與顯示）
  judgeReason?: string // AI 判定理由（唯讀，對應 AI 回傳的 reason）
  confidence?: number // AI 判定信心 0–1（< 門檻 → 低信心）
  needsHuman?: boolean // AI 標記需人工（true → 判定失敗 / 轉人工）
  judgeStatus: JudgeStatus
  shipStatus: ShipStatus
  // 預定出貨區間 [起, 迄]（起日即農友端顯示的可出貨起始）。迄日可為 null＝主站未指定最後出貨日 → 沒有截止日、不會逾期。
  shipWindow?: [string, string | null]
  blockedDates?: string[] // 不可出貨日（AI 判定，可複數：單日 "06/07" 或區間 "06/07–06/11"）
  blockedWeekdays?: number[] // 週期性不可出貨的星期（AI 判定，ISO 1=一…7=日）
  forcedShipDate?: string // 強制指定出貨日（客人指定，MM/DD）
  earliestShipDate?: string // 客人要求最早出貨日（下限，MM/DD）
  remoteAgentCode?: string // 偏遠地區客代
  printedAt?: string
  trackingNos?: string[] // 黑貓物流單號（跟黑貓要號後才有；補單可多筆）
  // 曾經「取新號重印」的歷史標記（後台派單狀態旁顯示；舊號另存 csRemark）。兩者可並存（先改單重印、後又過期重印）。
  reprintedForChange?: boolean // 曾因後台改單而重印取新號
  reprintedForExpiry?: boolean // 曾因標籤超過24小時失效而重印取新號
  failReason?: string // 農友回報「無法出貨」原因
  cancelReason?: string // 取消原因（後台取消訂單時填）
  rescheduledShipDate?: string // 貓咪改的新出貨日（配 failReason，MM/DD）
  // 未印單被取消（demo 外殼示範軟刪除卡片用）
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
