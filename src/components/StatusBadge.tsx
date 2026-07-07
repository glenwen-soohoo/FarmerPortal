import type { JudgeStatus, ShipStatus } from '../types'

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
}

export default function StatusBadge({ status }: { status: JudgeStatus | ShipStatus }) {
  return <span className={`gox-tag ${MAP[status] ?? ''}`}>{status}</span>
}
