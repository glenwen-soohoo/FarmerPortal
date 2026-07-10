import type { Order } from '../types'

// 假資料日期都是同一年（2026）的 'MM/DD'；統一轉成 ISO 'YYYY-MM-DD' 方便字典序比較。
const YEAR = '2026'
export function mmddToIso(mmdd: string): string {
  const [m, d] = mmdd.split('/')
  return `${YEAR}-${m}-${d}`
}

// 測試日期是否已達該單的出貨起始日。
// 指定出貨日(forcedShipDate)優先：客人指定當天才出，所以指定日＝可出貨起始日；
// 否則用 shipWindow 起日。
export function isShipReached(order: Order, todayIso: string): boolean {
  const start = order.forcedShipDate ?? order.shipWindow?.[0]
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

// 今天距「出貨區間迄日」的天數（可出貨中才算；非可出貨回傳 null）
function daysToDue(order: Order, todayIso: string): number | null {
  const end = order.shipWindow?.[1]
  if (!end || !isInShippablePage(order, todayIso)) return null
  return Math.round((new Date(mmddToIso(end)).getTime() - new Date(todayIso).getTime()) / 86400000)
}

// 快到期：距迄日 2~3 天（黃）
export function isNearDue(order: Order, todayIso: string): boolean {
  const d = daysToDue(order, todayIso)
  return d !== null && d >= 1 && d <= 3
}

// 今日到期：今天正好是迄日（紅）
export function isDueToday(order: Order, todayIso: string): boolean {
  return daysToDue(order, todayIso) === 0
}

// 逾期未出：今天已超過迄日（紅）
export function isOverdue(order: Order, todayIso: string): boolean {
  const d = daysToDue(order, todayIso)
  return d !== null && d < 0
}

// 「重印」判定：改單後需重新列印
export function needsReprint(order: Order): boolean {
  return order.shipStatus === '改單待重印'
}

// 一張訂單「時間相關」狀態標籤（互斥、一次一個）。優先序：逾期 > 指定今日 > 今日到期 > 指定日期 > 快到期
export function orderTimeTag(order: Order, todayIso: string): { label: string; tone: 'danger' | 'amber' } | null {
  const todayMMDD = `${todayIso.slice(5, 7)}/${todayIso.slice(8, 10)}`
  if (isOverdue(order, todayIso)) return { label: '逾期未出', tone: 'danger' }
  if (order.forcedShipDate && order.forcedShipDate === todayMMDD && isInShippablePage(order, todayIso))
    return { label: '指定今日出貨', tone: 'danger' }
  if (isDueToday(order, todayIso)) return { label: '今日到期', tone: 'danger' }
  if (order.forcedShipDate) return { label: `指定 ${order.forcedShipDate} 出貨`, tone: 'danger' }
  if (isNearDue(order, todayIso)) return { label: '快到期', tone: 'amber' }
  return null
}

// 農友「出貨預告」頁應顯示：進行中但尚未達出貨起始日的單
export function isInUpcomingPage(order: Order, todayIso: string): boolean {
  return timeBucket(order, todayIso) === 'upcoming'
}

// 訂單「急迫度」排名（數字小＝優先）：指定出貨 > 改單重印 > 快到期 > 一般(下單日)
function urgencyRank(o: Order, todayIso: string): number {
  if (o.forcedShipDate) return 0 // 指定出貨
  if (needsReprint(o)) return 1 // 改單重印
  if (isNearDue(o, todayIso)) return 2 // 快到期
  return 3 // 一般 → 依下單日
}

// 農友清單排序（每張單仍獨立、不合併）。優先序：
//   同品名聚一起 → 同規格聚一起（規格組彼此依「組內最急迫者」排序）→
//   規格內依 指定出貨 > 改單重印 > 快到期 > 下單日（訂單號遞增當下單日 proxy）。
export function sortForFarmer(list: Order[], todayIso: string): Order[] {
  const name = (o: Order) => (o.variety && o.variety.trim()) || o.productName
  const specKey = (o: Order) => `${name(o)}|${o.spec}`
  // 每個「品名|規格」組的最急迫排名，決定規格組之間的先後（讓有指定/重印/快到期的規格往前）
  const specBest = new Map<string, number>()
  for (const o of list) {
    const k = specKey(o)
    const r = urgencyRank(o, todayIso)
    if (!specBest.has(k) || r < specBest.get(k)!) specBest.set(k, r)
  }
  return [...list].sort(
    (a, b) =>
      name(a).localeCompare(name(b), 'zh-Hant') || // 同品名聚一起
      specBest.get(specKey(a))! - specBest.get(specKey(b))! || // 規格組依急迫度
      a.spec.localeCompare(b.spec, 'zh-Hant') || // 確保同規格相鄰
      urgencyRank(a, todayIso) - urgencyRank(b, todayIso) || // 規格內依急迫度
      a.orderNumber.localeCompare(b.orderNumber) // 下單日
  )
}

// 提早印單警告（個別 / 批次 按下去都先跳這則確認）
export const EARLY_SHIP_WARNING =
  '今日尚未到達出貨時間，本功能僅提早印單，請到出貨區間再進行出貨。如因提早出貨而導致客訴損失，需自行負擔相關損失。'

// 預設測試日期（挑一個能同時看到可出貨與預告的日子）
export const DEFAULT_DEV_TODAY = '2026-06-12'
