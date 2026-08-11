import type { Order } from '../types'

// 出貨日期在系統裡有兩種形狀，統一轉成 ISO 'YYYY-MM-DD' 方便字典序比較：
//   ・API 的 shipWindow 起迄是完整 ISO（後端由 SQL datetime 直接格式化）
//   ・AI 判定產物（forcedShipDate / blockedDates）是 'MM/DD'，沒有年份
// （CalendarPicker 也曾輸出 'MM/DD'，現已改為直接給完整 ISO —— 它知道使用者點的是哪一年，
//   沒有理由丟掉再讓下游猜。所以下面補年份的邏輯現在只服務 AI 判定產物。）
const pad2 = (s: string) => s.padStart(2, '0')

/**
 * 沒有年份的 'MM/DD' 補年份：取「離基準日最近」的那一年（前年／當年／明年三選一）。
 *
 * ⚠️ 原本是硬寫 const YEAR = '2026'。出貨區間只有幾天，但跨年時同一個 MM/DD 的正解會落在不同年：
 * 12/28 在 1/2 看是**去年**、01/05 在 12/28 看是**明年** —— 固定年份這兩種都會錯整整 365 天。
 * 實際後果是 2027 起 isShipReached 把「客人指定 01/10 出貨」判成已達出貨時間（因為
 * '2027-01-05' >= '2026-01-10'），出貨閘門靜默失效。
 *
 * 為什麼不只改成 new Date().getFullYear()：那只解決「今年不是 2026」，上面跨年的兩種還是錯的。
 */
function nearYearIso(mm: string, dd: string, refIso: string): string {
  const refY = Number(refIso.slice(0, 4))
  const refT = Date.parse(`${refIso}T00:00:00`)
  let best = `${refY}-${mm}-${dd}`
  let bestGap = Infinity
  for (const y of [refY - 1, refY, refY + 1]) {
    const iso = `${y}-${mm}-${dd}`
    const t = Date.parse(`${iso}T00:00:00`)
    if (Number.isNaN(t)) continue // 02/29 落在非閏年 → 跳過，由相鄰的閏年勝出
    const gap = Math.abs(t - refT)
    if (gap < bestGap) {
      bestGap = gap
      best = iso
    }
  }
  return best
}

/**
 * 支援兩種輸入：完整 ISO（'YYYY-MM-DD'…）→ 取日期部分；'MM/DD' → 依 refIso 就近補上年份。
 *
 * refIso 預設真實今天，但**有測試日期時務必傳進來**：DevPanel 可以把「今天」調到別的日子，
 * 不傳會讓比較的兩邊用不同基準（一邊測試日期、一邊真實今天）。
 */
export function mmddToIso(s: string, refIso: string = todayIso()): string {
  if (s.includes('-')) return s.slice(0, 10)
  const [m, d] = s.split('/')
  return nearYearIso(pad2(m), pad2(d), refIso)
}

// 顯示用：把 'YYYY-MM-DD' 或 'MM/DD' 統一成 'MM/DD'（卡片上不顯示年份）。
export function mmdd(s: string): string {
  if (s.includes('-')) {
    const p = s.slice(0, 10).split('-')
    return `${p[1]}/${p[2]}`
  }
  return s
}

// 測試日期是否已達該單的出貨起始日。
// 指定出貨日(forcedShipDate)優先：客人指定當天才出，所以指定日＝可出貨起始日；
// 否則用 shipWindow 起日。
export function isShipReached(order: Order, todayIso: string): boolean {
  const start = order.forcedShipDate ?? order.shipWindow?.[0]
  if (!start) return true
  // forcedShipDate 是 'MM/DD'（AI 判定產物）→ 年份要以 todayIso 為基準就近推算，不能用真實今天
  return todayIso >= mmddToIso(start, todayIso)
}

// 進行中的出貨生命週期狀態（會受「出貨起始日」閘門影響是否可出貨）
// ⚠️ 必須含「逾期未出」：後端 DeriveShipStatus 會產出它，漏掉會讓該單 timeBucket=null
// → 從需出貨／出貨預告／備貨總覽三頁一起消失，且 daysToDue 恆 null 使 isOverdue() 永遠 false（拿不到逾期紅）。
const ACTIVE_SHIP_STATUS = ['可出貨', '已印單', '改單待重印', '未達出貨時間', '逾期未出'] as const

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

/**
 * 出貨區間顯示文字。三種形狀分開講，不要折成同一種：
 *   有起有迄且不同   → 「08/03–08/11」
 *   有起有迄但同一天 → 「08/03」（不寫成 08/03–08/03，同一天重複兩次讀起來像有區間）
 *   只有起日         → 「08/03~」（主站未指定最後出貨日 ＝ 沒有截止日）
 */
export function shipWindowText(w?: [string, string | null] | null): string {
  if (!w) return '—'
  const [start, end] = w
  if (!end) return `${mmdd(start)}~`
  return mmdd(start) === mmdd(end) ? mmdd(start) : `${mmdd(start)}–${mmdd(end)}`
}

// 今天距「出貨區間迄日」的天數（可出貨中才算；非可出貨回傳 null）。
// 迄日為 null（主站未指定最後出貨日）→ 回 null，於是 isNearDue / isDueToday / isOverdue 全部 false，
// 那些單不會有任何時間急迫度標記 —— 這是刻意的：沒有截止日就沒有「快到期／逾期」可言。
function daysToDue(order: Order, todayIso: string): number | null {
  const end = order.shipWindow?.[1]
  if (!end || !isInShippablePage(order, todayIso)) return null
  return Math.round((new Date(mmddToIso(end, todayIso)).getTime() - new Date(todayIso).getTime()) / 86400000)
}

// 快到期：距迄日 1~3 天（黃）。迄日當天由 isDueToday 接（d===0），逾期由 isOverdue 接（d<0）。
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

// 黑貓標籤時效：印出後超過 24 小時，舊的物流編號即失效，重印必須向黑貓「重新取號」（不可沿用原號）。
export const LABEL_TTL_HOURS = 24

// 標籤是否已超時（＝這張已印單需要「重新取號重印」而非「沿用原號重印」）。
// ⚠️ demo 沒有真後端時鐘：以「釘住的展示日 today 的中午」當作「現在」來比對 printedAt。
//   ・只有『已印單』的單會遇到（改單待重印本來就要取新號；其餘狀態沒印過、沒有時效問題）。
//   ・printedAt 缺漏或無法解析 → 視為未超時（寧可不擋）。
export function isLabelExpired(order: Order, todayIso: string): boolean {
  if (order.shipStatus !== '已印單' || !order.printedAt) return false
  const printed = new Date(order.printedAt.replace(' ', 'T')) // 'YYYY-MM-DD HH:mm' → ISO
  if (Number.isNaN(printed.getTime())) return false
  const now = new Date(`${todayIso}T12:00`)
  const hours = (now.getTime() - printed.getTime()) / 3_600_000
  return hours > LABEL_TTL_HOURS
}

// 一張訂單「時間相關」狀態標籤（互斥、一次一個）。優先序：逾期 > 指定今日 > 今日到期 > 指定日期 > 快到期
export function orderTimeTag(order: Order, todayIso: string): { label: string; tone: 'urgent' | 'notice' } | null {
  const todayMMDD = `${todayIso.slice(5, 7)}/${todayIso.slice(8, 10)}`
  if (isOverdue(order, todayIso)) return { label: '逾期未出', tone: 'urgent' }
  if (order.forcedShipDate && order.forcedShipDate === todayMMDD && isInShippablePage(order, todayIso))
    return { label: '客人指定今日出貨', tone: 'urgent' }
  if (isDueToday(order, todayIso)) return { label: '今日到期', tone: 'urgent' }
  if (order.forcedShipDate) return { label: `客人指定 ${order.forcedShipDate} 出貨`, tone: 'urgent' }
  if (isNearDue(order, todayIso)) return { label: '快到期', tone: 'notice' }
  return null
}

// 農友「出貨預告」頁應顯示：進行中但尚未達出貨起始日的單
export function isInUpcomingPage(order: Order, todayIso: string): boolean {
  return timeBucket(order, todayIso) === 'upcoming'
}

/**
 * 農友端「出貨提醒」要顯示的文字 = AI 判到了什麼。
 * AI 判定產物依內容分寫多欄：作業指示→farmerRemark、日期→forcedShipDate/blockedDates。
 * 優先自由文字備註(farmerRemark)；farmerRemark 空但有結構化判定(指定出貨日/不可出貨日)時，
 * 由這些欄組出衍生提醒，讓「AI 有判到就不會顯示無」。皆無 → 回 null（UI 再依 needsHuman 顯示「客服確認中」或「無」）。
 * 客人原始備註(rawRemark)不入此處，維持不外流原話原則。
 */
const WEEKDAY_NAMES = ['一', '二', '三', '四', '五'] // ISO 1..5（六日本來就不出貨，不需名稱）

/**
 * 把「不可出貨的星期」翻成農友讀得懂的「可出貨星期」。
 * 用可出貨而非不可出貨表達：客人說「只有週五能出」時 blockedWeekdays 是 [1,2,3,4,6,7]，
 * 唸成「週一二三四六日不可出貨」很難讀，「僅週五可出貨」才是他要表達的那件事。
 * 只在週一~五裡算——週六日本來就不收件，AI 把 6/7 一起列進來也不影響結果。
 */
function allowedWeekdayText(blocked: number[] | undefined): string | null {
  if (!blocked?.length) return null
  const allowed = [1, 2, 3, 4, 5].filter((d) => !blocked.includes(d))
  if (allowed.length === 5) return null // 只擋到六日 ＝ 沒有額外限制，不必提醒
  if (allowed.length === 0) return '平日皆不可出貨'
  // 連續三天以上收成「週一至週四」，其餘列舉「週一、週三」
  const runs: number[][] = []
  for (const d of allowed) {
    const last = runs.length ? runs[runs.length - 1] : null
    if (last && d === last[last.length - 1] + 1) last.push(d)
    else runs.push([d])
  }
  const text = runs
    .map((r) =>
      r.length >= 3
        ? `週${WEEKDAY_NAMES[r[0] - 1]}至週${WEEKDAY_NAMES[r[r.length - 1] - 1]}`
        : r.map((d) => `週${WEEKDAY_NAMES[d - 1]}`).join('、')
    )
    .join('、')
  return `僅${text}可出貨`
}

/**
 * 出貨提醒：客人特別交代過才會有，系統不自己生。
 * farmerRemark（AI 清洗後的作業指示）與日期/星期限制是**互補**的，要一起顯示——
 * 先前是 farmerRemark 有值就 return，於是「挑大顆的」會把「八月不可出貨」整個蓋掉。
 * 這在 prompt 改成「日期與星期走專用欄位、不要寫進 farmerRemark」之後更容易踩到。
 */
export function shipReminderText(order: Order): string | null {
  const parts: string[] = []
  const remark = order.farmerRemark?.trim()
  if (remark) parts.push(remark)
  if (order.forcedShipDate) parts.push(`指定 ${order.forcedShipDate} 出貨`)
  // 最早出貨日是下限：出貨區間已由後端整段滑到以它為起日，所以卡片上的區間本身就是對的。
  // 這句提醒是講「為什麼是這個區間」——不寫的話農友只看到區間變晚、不知道是客人要求的。
  if (order.earliestShipDate) parts.push(`客人指定 ${order.earliestShipDate} 之後再出貨`)
  if (order.blockedDates?.length) parts.push(`${order.blockedDates.join('、')} 不可出貨`)
  const weekday = allowedWeekdayText(order.blockedWeekdays)
  if (weekday) parts.push(weekday)
  return parts.length ? parts.join('；') : null
}

// F9 A7 取消卡片「知道了」dismiss：存 localStorage（個人裝置提示、不需跨裝置；後端另有保留 7 天過濾）。
const CANCEL_DISMISS_KEY = 'fp.cancelDismissed'
export function isCancelDismissed(orderId: string): boolean {
  try {
    return (JSON.parse(localStorage.getItem(CANCEL_DISMISS_KEY) || '[]') as string[]).includes(orderId)
  } catch {
    return false
  }
}
export function dismissCancel(orderId: string): void {
  try {
    const arr = JSON.parse(localStorage.getItem(CANCEL_DISMISS_KEY) || '[]') as string[]
    if (!arr.includes(orderId)) {
      arr.push(orderId)
      localStorage.setItem(CANCEL_DISMISS_KEY, JSON.stringify(arr))
    }
  } catch {
    /* localStorage 不可用時略過（下次仍會顯示） */
  }
}

// 兩個 ISO 日期相差幾天（a − b，四捨五入到整天）
function daysBetween(aIso: string, bIso: string): number {
  return Math.round((new Date(aIso).getTime() - new Date(bIso).getTime()) / 86400000)
}

// 已取消卡片是否還要顯示：有取消日、未按「知道了」、且取消後 7 天內（F0 §3-3 保留 7 天）
export function isCancelActive(order: Order, todayIso: string): boolean {
  if (!order.cancelledAt || order.cancelDismissed) return false
  return daysBetween(todayIso, mmddToIso(order.cancelledAt, todayIso)) <= 7
}

// 已取消但「該收起了」（已按知道了 或 超過 7 天）→ 從清單隱藏
export function isCancelHidden(order: Order, todayIso: string): boolean {
  return !!order.cancelledAt && !isCancelActive(order, todayIso)
}

// 訂單「急迫度」排名（數字小＝優先）：逾期 > 指定出貨 > 改單重印 > 快到期 > 一般(下單日)
// 逾期必須排最前：它是唯一「已經遲到」的狀態，若沿用一般排序會被壓到清單最底、農友最不容易看到。
function urgencyRank(o: Order, todayIso: string): number {
  if (isOverdue(o, todayIso)) return 0 // 逾期未出
  if (o.forcedShipDate) return 1 // 指定出貨
  if (needsReprint(o)) return 2 // 改單重印
  if (isNearDue(o, todayIso)) return 3 // 快到期
  return 4 // 一般 → 依下單日
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

// 今天（本地時區，平板在台灣即台灣時間）的 'YYYY-MM-DD'；api 模式用真實今天當出貨判定基準。
export function todayIso(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
