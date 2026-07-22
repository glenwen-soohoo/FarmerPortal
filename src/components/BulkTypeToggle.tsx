import { useState } from 'react'
import type { Order, BulkOrderType } from '../types'

// 訂單類別切換（一般 / 7-11 / 企業送禮）：對應 bulkOrderType（程式判定、711 優先，見 F3 §2-2）
// 放在需出貨 / 出貨預告頁左上角、與右側「篩選」相對；大小比照收合的篩選鈕（高 56、border-2、text-lg）。
const TABS: { key: BulkOrderType; label: string }[] = [
  { key: '一般', label: '一般' },
  { key: '統一711', label: '7-11' },
  { key: '企業送禮', label: '企業送禮' },
]

// 依訂單類別切換 + 過濾。回傳過濾後清單與切換鈕（用法比照 useListFilter）。
// 若清單裡沒有 7-11／企業匯單（全是一般），切換鈕不顯示（toggle=null）、也不過濾。
export function useBulkTypeFilter(list: Order[]) {
  const typeOf = (o: Order): BulkOrderType => o.bulkOrderType ?? '一般'
  const hasSpecial = list.some((o) => typeOf(o) !== '一般')
  // 各類別目前張數（給圓點數字＋鎖住空類別用）
  const counts: Record<BulkOrderType, number> = {
    一般: list.filter((o) => typeOf(o) === '一般').length,
    統一711: list.filter((o) => typeOf(o) === '統一711').length,
    企業送禮: list.filter((o) => typeOf(o) === '企業送禮').length,
  }
  // 預設選第一個有單的類別（避免預設「一般」卻是空的鎖住狀態）
  const firstAvail = TABS.find((t) => counts[t.key] > 0)?.key ?? '一般'
  const [bulkType, setBulkType] = useState<BulkOrderType>(firstAvail)
  // 若目前選的類別已無單（換頁後可能發生），過濾時退回第一個有單的類別
  const effectiveType = counts[bulkType] > 0 ? bulkType : firstAvail
  const filtered = hasSpecial ? list.filter((o) => typeOf(o) === effectiveType) : list

  const toggle = hasSpecial ? (
    <div className="inline-flex shrink-0 overflow-hidden rounded-lg border-2 border-line bg-white">
      {TABS.map((t, i) => {
        const active = effectiveType === t.key
        const count = counts[t.key]
        const locked = count === 0 // 該類別無單 → 鎖住不可選
        return (
          <button
            key={t.key}
            onClick={() => !locked && setBulkType(t.key)}
            disabled={locked}
            className={`flex items-center gap-2 px-5 text-lg font-bold transition-colors ${
              i > 0 ? 'border-l-2 border-line' : ''
            } ${active ? 'bg-brand text-white' : locked ? 'bg-mutedbg text-muted' : 'text-ink2'} ${
              locked ? 'cursor-not-allowed' : ''
            }`}
            style={{ minHeight: 52 }}
          >
            <span style={locked ? { opacity: 0.7 } : undefined}>{t.label}</span>
            <span
              className={`inline-flex items-center justify-center rounded-full px-1.5 text-sm font-bold ${
                locked ? 'bg-line text-muted' : 'bg-danger text-white'
              }`}
              style={{ minWidth: 22, height: 22 }}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  ) : null

  return { bulkType: effectiveType, filtered, toggle }
}
