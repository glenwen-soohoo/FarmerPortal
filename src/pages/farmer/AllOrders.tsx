import { useMemo } from 'react'
import { useStore } from '../../store'
import StatusBadge from '../../components/StatusBadge'
import { EmptyState } from '../../components/States'
import { useListFilter } from '../../components/ListFilter'

function windowText(a?: [string, string], d?: string) {
  if (a) return `${a[0]}–${a[1]}`
  return d ?? '—'
}

export default function AllOrders() {
  const { orders, currentFarmerId } = useStore()
  const mine = useMemo(
    () => orders.filter((o) => o.farmerId === currentFarmerId),
    [orders, currentFarmerId]
  )

  // 沿用需出貨的篩選面板，額外開啟關鍵字與出貨狀態（預設「已出貨」）
  const { filtered, filterButton, filterPanel } = useListFilter(mine, { keyword: true, status: true })

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 w-full">
        {filterButton}
        {filterPanel}
      </div>

      <div className="mb-2 text-base text-ink2">共 {filtered.length} 筆</div>

      {filtered.length === 0 ? (
        <EmptyState message="沒有符合條件的訂單" />
      ) : (
        <div className="space-y-2">
          {filtered.map((o) => (
            <div key={o.id} className="rounded-card border border-line bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="flex flex-wrap items-baseline gap-x-4 text-sm text-muted">
                  <span>訂單編號 {o.orderNumber}</span>
                  <span>
                    物流編號{' '}
                    <span className="font-bold text-ink">
                      {o.trackingNos && o.trackingNos.length > 0 ? o.trackingNos.join('、') : '尚無'}
                    </span>
                  </span>
                </span>
                <StatusBadge status={o.shipStatus} />
              </div>
              <div className="mt-1 text-lg font-bold text-ink">
                {o.productName}
                <span className="ml-6 text-base font-bold text-ink2">{o.spec}　×{o.qty}</span>
              </div>
              <div className="mt-1 text-base text-ink2">預計出貨 {windowText(o.shipWindow)}</div>
              {o.farmerRemark?.trim() && (
                <div className="mt-1 text-base leading-snug text-ink2">出貨提醒 {o.farmerRemark}</div>
              )}
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
