import { useMemo } from 'react'
import { useStore } from '../../store'
import Tag, { type TagTone } from '../../components/Tag'
import { EmptyState } from '../../components/States'
import { useListFilter } from '../../components/ListFilter'
import { shipReminderText, shipWindowText } from '../../utils/shipDate'
import type { ShipStatus } from '../../types'

// 農友端狀態標籤走自家 Tag，不用後台的 StatusBadge（gox-tag）：後者紅款只有 3.66:1，
// 且字級是寫死的 12px、不隨「我的設定 → 字級」縮放。StatusBadge 仍留給後台三個頁面使用。
// 顏色只標例外——正常流程一律去色，符合色票宣言「其餘一律去色」。
const SHIP_TONE: Record<ShipStatus, TagTone> = {
  逾期未出: 'urgent',
  無法出貨: 'urgent',
  改單待重印: 'changed',
  未付款: 'faint',
  未達出貨時間: 'faint',
  可出貨: 'faint',
  已印單: 'faint',
  已出貨: 'faint',
  已到貨: 'faint',
  訂單失敗: 'faint',
  取消: 'faint',
}

// 已出貨/已到貨等沒有出貨區間的單，退回顯示傳入的替代日期（如出貨日）
function windowText(a?: [string, string | null], d?: string) {
  if (a) return shipWindowText(a)
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

      <div className="mb-2 text-base text-ink-sub">共 {filtered.length} 筆</div>

      {filtered.length === 0 ? (
        <EmptyState message="沒有符合條件的訂單" />
      ) : (
        <div className="space-y-2">
          {filtered.map((o) => {
            const reminder = shipReminderText(o)
            return (
            <div key={o.id} className="rounded-card border border-hairline bg-white p-4" style={{ boxShadow: 'var(--l1)' }}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-ink-faint">訂單編號 {o.orderNumber}</span>
                <Tag tone={SHIP_TONE[o.shipStatus]} size="sm">
                  {o.shipStatus}
                </Tag>
              </div>
              <div className="mt-1 text-lg font-bold text-ink">
                {o.productName}
                <span className="ml-6 text-base font-bold text-ink-sub">{o.spec}　×{o.qty}</span>
              </div>
              <div className="mt-1 text-base text-ink-sub">預計出貨 {windowText(o.shipWindow)}</div>
              {reminder ? (
                <div className="mt-1 text-base leading-snug text-ink-sub">出貨提醒 {reminder}</div>
              ) : o.needsHuman ? (
                <div className="mt-1 text-base leading-snug text-notice">出貨提醒 客服確認中</div>
              ) : null}
              <div className="mt-1 text-base text-ink-sub">
                {o.recipient}　{o.phone}
              </div>
              <div className="text-base text-ink-sub">{o.address}</div>
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
