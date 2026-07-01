import { useMemo, useState } from 'react'
import { useStore } from '../../store'
import StatusBadge from '../../components/StatusBadge'
import BigButton from '../../components/BigButton'
import { EmptyState } from '../../components/States'

function windowText(a?: [string, string], d?: string) {
  if (a) return `${a[0]}–${a[1]}`
  return d ?? '—'
}

// 出貨日區間比對：MM/DD 字串同年度字典序＝時間序。未輸入起/迄即不限該端。
function inDayRange(day: string | undefined, from: string, to: string) {
  if (!from && !to) return true
  if (!day) return false
  if (from && day < from) return false
  if (to && day > to) return false
  return true
}

interface Query {
  from: string
  to: string
  keyword: string // 同時比對 訂單編號 / 收件人 / 收件地址
}
const EMPTY: Query = { from: '', to: '', keyword: '' }

export default function AllOrders() {
  const { orders, currentFarmerId } = useStore()
  const mine = useMemo(
    () => orders.filter((o) => o.farmerId === currentFarmerId),
    [orders, currentFarmerId]
  )

  // 輸入中的值（form）與「已送出查詢」的值（applied）分開：平板操作，按鈕才查
  const [form, setForm] = useState<Query>(EMPTY)
  const [applied, setApplied] = useState<Query>(EMPTY)

  const results = useMemo(() => {
    const kw = applied.keyword.trim()
    return mine.filter(
      (o) =>
        inDayRange(o.shippableDate, applied.from.trim(), applied.to.trim()) &&
        (!kw || o.orderNumber.includes(kw) || o.recipient.includes(kw) || o.address.includes(kw))
    )
  }, [mine, applied])

  const search = () => setApplied(form)
  const clear = () => {
    setForm(EMPTY)
    setApplied(EMPTY)
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* 查詢條件 */}
      <div className="rounded-card border border-line bg-white p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="w-24 shrink-0 text-base text-ink2">出貨日</label>
            <input
              value={form.from}
              onChange={(e) => setForm({ ...form, from: e.target.value })}
              placeholder="起 例06/05"
              className="min-w-0 flex-1 rounded border border-line px-3 text-base"
              style={{ minHeight: 48 }}
            />
            <span className="text-ink2">～</span>
            <input
              value={form.to}
              onChange={(e) => setForm({ ...form, to: e.target.value })}
              placeholder="迄 例06/20"
              className="min-w-0 flex-1 rounded border border-line px-3 text-base"
              style={{ minHeight: 48 }}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="w-24 shrink-0 text-base text-ink2">關鍵字</label>
            <input
              value={form.keyword}
              onChange={(e) => setForm({ ...form, keyword: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              placeholder="訂單編號 / 收件人 / 地址"
              className="min-w-0 flex-1 rounded border border-line px-3 text-base"
              style={{ minHeight: 48 }}
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button onClick={clear} className="text-base font-medium text-ink2">
              清除
            </button>
            <BigButton size="md" onClick={search}>
              查詢
            </BigButton>
          </div>
        </div>
      </div>

      {/* 結果 */}
      <div className="mt-3 text-base text-ink2">共 {results.length} 筆</div>

      {results.length === 0 ? (
        <EmptyState message="沒有符合條件的訂單" />
      ) : (
        <div className="mt-2 space-y-2">
          {results.map((o) => (
            <div key={o.id} className="rounded-card border border-line bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted">訂單編號 {o.orderNumber}</span>
                <StatusBadge status={o.shipStatus} />
              </div>
              <div className="mt-1 text-lg font-bold text-ink">
                {o.productName}
                <span className="ml-2 text-base font-normal text-ink2">{o.spec}　×{o.qty}</span>
              </div>
              <div className="mt-1 text-base text-ink2">預計出貨 {windowText(o.shipWindow, o.shippableDate)}</div>
              <div className="mt-1 text-base text-ink2">
                {o.recipient}　{o.phone}
              </div>
              <div className="text-base text-ink2">{o.address}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
