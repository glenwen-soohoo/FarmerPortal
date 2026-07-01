import { useMemo, useState, type ReactNode } from 'react'
import type { Order } from '../types'

const uniq = (arr: string[]) => Array.from(new Set(arr))

// 出貨日區間比對：MM/DD 字串同年度下字典序＝時間序，可直接字串比較。
// 未輸入起 → 不限開始；未輸入迄 → 不限結束。
function inDayRange(day: string | undefined, from: string, to: string) {
  if (!from && !to) return true
  if (!day) return false
  if (from && day < from) return false
  if (to && day > to) return false
  return true
}

/**
 * 三個列表分頁（可出貨 / 出貨預告 / 出貨紀錄）共用的篩選。
 * 回傳 filterButton（篩選按鈕，可與其他動作鈕排同一列）與 filterPanel（展開面板）。
 * 可篩：出貨日(區間)、商品名、規格。
 *
 * ⚠️⚠️ 「商品名」與「規格」的選項判定邏輯【尚未定案】⚠️⚠️
 *
 * 規格(spec)：目前 specOptions 用「訂單 spec 原字串去重」當選項（naive）。
 *   真實 spec 很碎（"1盒(5斤裝)"/"1盒(3斤裝)"/"1箱(大果4斤裝)"…），候選維度：
 *   (a) 完整原字串（現況）(b) 抽斤數分級 (c) 抽包裝單位 (d) 後台維護正規化分類。
 *
 * 商品名(productName)：目前 nameOptions 也用原字串去重（naive）。
 *   但真實 productName 常含行銷前綴 / 括號 / 農場名，例如：
 *   "早鳥預購 荔枝季【鮮採帶枝玉荷包荔枝】鐵人夫婦"。
 *   要「篩商品名」得先決定用什麼當比對鍵，候選：
 *   (a) 完整原字串（現況，選項雜） (b) 取【】內主體 (c) 對應到後台的「品項/品種」主檔
 *   (d) 用 order.variety（AI 清洗後品種名）當基準。
 *
 * → 待業務 / PM 拍板後，改 nameOptions / specOptions 的產生方式與對應 match 函式即可，UI 不動。
 */
export function useListFilter(orders: Order[]): {
  filtered: Order[]
  filterButton: ReactNode
  filterPanel: ReactNode
  activeCount: number
} {
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [name, setName] = useState('') // 商品名，'' = 全部
  const [spec, setSpec] = useState('') // 規格，'' = 全部

  // ⚠️ 見檔頭：商品名選項判定邏輯未定，暫用原字串去重
  const nameOptions = useMemo(() => uniq(orders.map((o) => o.productName).filter(Boolean)), [orders])
  // ⚠️ 見檔頭：規格選項判定邏輯未定，暫用原字串去重
  const specOptions = useMemo(() => uniq(orders.map((o) => o.spec).filter(Boolean)), [orders])

  const filtered = orders.filter(
    (o) =>
      inDayRange(o.shippableDate, from.trim(), to.trim()) &&
      (!name || o.productName === name) && // ⚠️ 比對方式待商品名邏輯定案
      (!spec || o.spec === spec) // ⚠️ 比對方式待規格邏輯定案
  )
  const activeCount = (from || to ? 1 : 0) + (name ? 1 : 0) + (spec ? 1 : 0)

  const filterButton = (
    <button
      onClick={() => setOpen((v) => !v)}
      className="inline-flex items-center gap-2 rounded border border-line bg-white px-4 text-base font-medium text-ink"
      style={{ minHeight: 44 }}
    >
      篩選
      {activeCount > 0 && <span className="rounded-full bg-brand px-2 text-sm text-white">{activeCount}</span>}
    </button>
  )

  const filterPanel = open ? (
    <div className="mt-2 space-y-3 rounded-card border border-line bg-white p-4">
      <div className="flex items-center gap-2">
        <label className="w-20 shrink-0 text-base text-ink2">出貨日</label>
        <input
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="起 例06/05"
          className="min-w-0 flex-1 rounded border border-line px-3 text-base"
          style={{ minHeight: 44 }}
        />
        <span className="text-ink2">～</span>
        <input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="迄 例06/20"
          className="min-w-0 flex-1 rounded border border-line px-3 text-base"
          style={{ minHeight: 44 }}
        />
      </div>

      <div className="flex items-center gap-3">
        <label className="w-20 shrink-0 text-base text-ink2">商品名</label>
        <select
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded border border-line px-3 text-base"
          style={{ minHeight: 44 }}
        >
          <option value="">全部</option>
          {nameOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <label className="w-20 shrink-0 text-base text-ink2">規格</label>
        <select
          value={spec}
          onChange={(e) => setSpec(e.target.value)}
          className="flex-1 rounded border border-line px-3 text-base"
          style={{ minHeight: 44 }}
        >
          <option value="">全部</option>
          {specOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {activeCount > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              setFrom('')
              setTo('')
              setName('')
              setSpec('')
            }}
            className="text-base font-medium text-brand"
          >
            清除篩選
          </button>
        </div>
      )}
    </div>
  ) : null

  return { filtered, filterButton, filterPanel, activeCount }
}
