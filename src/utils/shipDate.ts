import type { Order } from '../types'

// 假資料日期都是同一年（2026）的 'MM/DD'；統一轉成 ISO 'YYYY-MM-DD' 方便字典序比較。
const YEAR = '2026'
export function mmddToIso(mmdd: string): string {
  const [m, d] = mmdd.split('/')
  return `${YEAR}-${m}-${d}`
}

// 測試日期是否已達該單的出貨起始日（優先用 shipWindow 起日，否則 shippableDate）
export function isShipReached(order: Order, todayIso: string): boolean {
  const start = order.shipWindow?.[0] ?? order.shippableDate
  if (!start) return true
  return todayIso >= mmddToIso(start)
}

// 進行中的出貨生命週期狀態（會受「出貨起始日」閘門影響是否可出貨）
const ACTIVE_SHIP_STATUS = ['可出貨', '已印單', '改單待重印', '未達出貨時間'] as const

/**
 * 依「測試日期」決定進行中訂單應顯示在哪一區：
 *   - 今天 ≥ 出貨起始日 → 'shippable'（可出貨）
 *   - 今天 < 出貨起始日 → 'upcoming'（出貨預告）
 * 已印單 / 改單待重印 也一併過日期閘門（出貨起始日還沒到，就算印過也先歸預告）。
 * 非進行中狀態（已出貨 / 已到貨 / 無法出貨 / 逾期未出 / 未付款 / 訂單失敗）回傳 null。
 */
export function timeBucket(order: Order, todayIso: string): 'shippable' | 'upcoming' | null {
  if (!ACTIVE_SHIP_STATUS.includes(order.shipStatus as (typeof ACTIVE_SHIP_STATUS)[number])) return null
  return isShipReached(order, todayIso) ? 'shippable' : 'upcoming'
}

// 農友「可出貨」頁應顯示：進行中且已達出貨起始日的單
export function isInShippablePage(order: Order, todayIso: string): boolean {
  return timeBucket(order, todayIso) === 'shippable'
}

// 農友「出貨預告」頁應顯示：進行中但尚未達出貨起始日的單
export function isInUpcomingPage(order: Order, todayIso: string): boolean {
  return timeBucket(order, todayIso) === 'upcoming'
}

// 農友清單排序：同品名聚在一起、同規格相鄰（每張單仍獨立、不合併）。
// 排序鍵：品名(清洗後 variety→productName) → 規格 → 盒數多優先 → 訂單號。
export function sortForFarmer(list: Order[]): Order[] {
  const name = (o: Order) => (o.variety && o.variety.trim()) || o.productName
  return [...list].sort(
    (a, b) =>
      name(a).localeCompare(name(b), 'zh-Hant') ||
      a.spec.localeCompare(b.spec, 'zh-Hant') ||
      b.qty - a.qty ||
      a.orderNumber.localeCompare(b.orderNumber)
  )
}

// 提早印單警告（個別 / 批次 按下去都先跳這則確認）
export const EARLY_SHIP_WARNING =
  '今日尚未到達出貨時間，本功能僅提早印單，請到出貨區間再進行出貨。如因提早出貨而導致客訴損失，需自行負擔相關損失。'

// 預設測試日期（挑一個能同時看到可出貨與預告的日子）
export const DEFAULT_DEV_TODAY = '2026-06-12'
