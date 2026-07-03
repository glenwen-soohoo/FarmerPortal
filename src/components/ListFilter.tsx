import { useMemo, useState, type ReactNode } from 'react'
import type { Order } from '../types'
import { Picker, PickerField, type PickerOption } from './Picker'
import CalendarPicker from './CalendarPicker'

const uniq = (arr: string[]) => Array.from(new Set(arr))
const opt = (arr: string[], allLabel = '全部'): PickerOption[] => [
  { label: allLabel, value: '' },
  ...arr.map((v) => ({ label: v, value: v })),
]

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
  // 目前開著哪個彈窗選擇器
  const [picker, setPicker] = useState<null | 'from' | 'to' | 'name' | 'spec'>(null)

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

  // 篩選＝可展開收合區塊的標題列（整條可點、右側箭頭指示狀態）
  const filterButton = (
    <button
      onClick={() => setOpen((v) => !v)}
      className={`flex w-full items-center justify-between border border-line bg-white px-4 ${
        open ? 'rounded-t-lg border-b-0' : 'rounded-lg'
      }`}
      style={{ minHeight: 56 }}
    >
      <span className="flex items-center gap-2 text-lg font-bold text-ink">
        篩選
        {activeCount > 0 && <span className="rounded-full bg-brand px-2 text-sm font-normal text-white">{activeCount}</span>}
      </span>
      <span className="text-lg text-ink2">{open ? '▲' : '▼'}</span>
    </button>
  )

  const filterPanel = (
    <>
      {open && (
        <div className="space-y-3 rounded-b-lg border border-line bg-white p-4">
          {/* 出貨日：起、迄 同一排 */}
          <div className="flex items-stretch gap-2">
            <div className="flex-1">
              <PickerField label="出貨日（起）" value={from} placeholder="不限" onClick={() => setPicker('from')} />
            </div>
            <div className="flex items-center text-ink2">～</div>
            <div className="flex-1">
              <PickerField label="出貨日（迄）" value={to} placeholder="不限" onClick={() => setPicker('to')} />
            </div>
          </div>
          <PickerField label="商品名" value={name} placeholder="全部" onClick={() => setPicker('name')} />
          <PickerField label="規格" value={spec} placeholder="全部" onClick={() => setPicker('spec')} />

          {activeCount > 0 && (
            <button
              onClick={() => {
                setFrom('')
                setTo('')
                setName('')
                setSpec('')
              }}
              className="w-full rounded-lg border border-line text-base font-medium text-brand"
              style={{ minHeight: 52 }}
            >
              清除篩選
            </button>
          )}
        </div>
      )}

      {picker === 'from' && (
        <CalendarPicker title="出貨日（起）" value={from} onSelect={setFrom} onClose={() => setPicker(null)} />
      )}
      {picker === 'to' && (
        <CalendarPicker title="出貨日（迄）" value={to} onSelect={setTo} onClose={() => setPicker(null)} />
      )}
      {picker === 'name' && (
        <Picker title="商品名" options={opt(nameOptions)} value={name} onSelect={setName} onClose={() => setPicker(null)} />
      )}
      {picker === 'spec' && (
        <Picker title="規格" options={opt(specOptions)} value={spec} onSelect={setSpec} onClose={() => setPicker(null)} />
      )}
    </>
  )

  return { filtered, filterButton, filterPanel, activeCount }
}
