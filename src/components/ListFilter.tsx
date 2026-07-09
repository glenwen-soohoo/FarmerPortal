import { useMemo, useState, type ReactNode } from 'react'
import type { Order } from '../types'
import { Picker } from './Picker'
import CalendarPicker from './CalendarPicker'

const uniq = (arr: string[]) => Array.from(new Set(arr))
const opt = (arr: string[], allLabel = '全部') => [
  { label: allLabel, value: '' },
  ...arr.map((v) => ({ label: v, value: v })),
]

// 出貨日區間比對：MM/DD 同年度字典序＝時間序。未輸入起 → 不限開始；未輸入迄 → 不限結束。
function inDayRange(day: string | undefined, from: string, to: string) {
  if (!from && !to) return true
  if (!day) return false
  if (from && day < from) return false
  if (to && day > to) return false
  return true
}

/**
 * 三個列表分頁（需出貨 / 出貨預告 / 出貨紀錄）共用的篩選。
 * 標籤放左邊、欄位放右邊；出貨日只用一個標籤，但輸入仍分「起 ～ 迄」。
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
  const [name, setName] = useState('')
  const [spec, setSpec] = useState('')
  const [picker, setPicker] = useState<null | 'from' | 'to' | 'name' | 'spec'>(null)

  const nameOptions = useMemo(() => uniq(orders.map((o) => o.productName).filter(Boolean)), [orders])
  const specOptions = useMemo(() => uniq(orders.map((o) => o.spec).filter(Boolean)), [orders])

  const filtered = orders.filter(
    (o) =>
      inDayRange(o.shipWindow?.[0], from.trim(), to.trim()) &&
      (!name || o.productName === name) &&
      (!spec || o.spec === spec)
  )
  const activeCount = (from || to ? 1 : 0) + (name ? 1 : 0) + (spec ? 1 : 0)

  // 觸發鈕（顯示目前值 + ▾）
  const Trigger = ({ value, placeholder, onClick }: { value: string; placeholder: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="flex flex-1 items-center justify-between rounded-lg border border-line bg-white px-3 text-left"
      style={{ minHeight: 52 }}
    >
      <span className="text-lg font-medium text-ink">{value || placeholder}</span>
      <span className="text-ink2">▾</span>
    </button>
  )

  // 左標籤 + 右欄位的一列
  const Row = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-base text-ink2">{label}</span>
      <div className="flex flex-1 items-center gap-2">{children}</div>
    </div>
  )

  const filterButton = (
    <button
      onClick={() => setOpen((v) => !v)}
      className={`flex w-full items-center justify-between border-2 border-line bg-white px-4 ${
        open ? 'rounded-t-lg border-b-0' : 'rounded-lg'
      }`}
      style={{ minHeight: 56 }}
    >
      <span className="flex flex-wrap items-center gap-2 text-lg font-bold text-ink">
        篩選
        {(from || to) && <span className="rounded-full bg-brand/10 px-2 py-0.5 text-sm font-bold text-brand">時間</span>}
        {name && <span className="rounded-full bg-brand/10 px-2 py-0.5 text-sm font-bold text-brand">商品</span>}
        {spec && <span className="rounded-full bg-brand/10 px-2 py-0.5 text-sm font-bold text-brand">規格</span>}
      </span>
      <span className="text-lg text-ink2">{open ? '▲' : '▼'}</span>
    </button>
  )

  const filterPanel = (
    <>
      {open && (
        <div className="anim-slide-down space-y-3 rounded-b-lg border-2 border-line bg-white p-4">
          {/* 出貨日：一個標籤，輸入分起～迄 */}
          <Row label="出貨日">
            <Trigger value={from} placeholder="起" onClick={() => setPicker('from')} />
            <span className="text-ink2">～</span>
            <Trigger value={to} placeholder="迄" onClick={() => setPicker('to')} />
          </Row>
          <Row label="商品名">
            <Trigger value={name} placeholder="全部" onClick={() => setPicker('name')} />
          </Row>
          <Row label="規格">
            <Trigger value={spec} placeholder="全部" onClick={() => setPicker('spec')} />
          </Row>

          {activeCount > 0 && (
            <button
              onClick={() => {
                setFrom('')
                setTo('')
                setName('')
                setSpec('')
              }}
              className="w-full rounded-lg border-2 border-line text-base font-medium text-brand"
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
