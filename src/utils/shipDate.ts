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

// 預設測試日期（挑一個能同時看到可出貨與預告的日子）
export const DEFAULT_DEV_TODAY = '2026-06-12'
