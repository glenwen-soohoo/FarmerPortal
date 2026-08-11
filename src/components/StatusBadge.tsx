import type { JudgeStatus, ShipStatus, Order } from '../types'

// 兩軸狀態共用；對應 GoX .gox-tag 語意樣式
const MAP: Record<JudgeStatus | ShipStatus, string> = {
  // 判定狀態
  尚未判定: '',
  AI判定完成: 'is-info',
  'AI判定完成(低信心)': 'is-danger',
  AI判定失敗: 'is-danger',
  人工修正判定: 'is-success',
  // 出貨狀態
  未付款: '',
  未達出貨時間: '',
  可出貨: 'is-success',
  已印單: 'is-info',
  改單待重印: 'is-warning',
  已出貨: 'is-success',
  已到貨: 'is-success',
  逾期未出: 'is-danger',
  無法出貨: 'is-danger',
  訂單失敗: '',
  取消: '',
}

export default function StatusBadge({ status }: { status: JudgeStatus | ShipStatus }) {
  return <span className={`gox-tag ${MAP[status] ?? ''}`}>{status}</span>
}

// 「曾取新號重印」歷史標記：不是狀態（不進 ShipStatus），是派單狀態旁的附註，提醒後台這張的物流編號曾換過。
// 用 is-warning（琥珀）跟一般狀態區隔；兩者可並存（先改單後又過期，反之亦然）。
export function ReprintHistoryTags({ order }: { order: Pick<Order, 'reprintedForChange' | 'reprintedForExpiry'> }) {
  if (!order.reprintedForChange && !order.reprintedForExpiry) return null
  return (
    <>
      {order.reprintedForChange && <span className="gox-tag is-warning">曾改單重印</span>}
      {order.reprintedForExpiry && <span className="gox-tag is-warning">曾過期重印</span>}
    </>
  )
}
