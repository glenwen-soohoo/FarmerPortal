import { useState } from 'react'

// 假資料統一 2026 年；日曆輸出 'MM/DD' 與 order.shippableDate 一致
const YEAR = 2026
const WEEK = ['日', '一', '二', '三', '四', '五', '六']
const pad = (n: number) => String(n).padStart(2, '0')

interface Props {
  title: string
  value: string // 'MM/DD' 或 ''
  onSelect: (mmdd: string) => void
  onClose: () => void
}

export default function CalendarPicker({ title, value, onSelect, onClose }: Props) {
  // 初始月份：有值就跳到該月，否則預設 6 月（資料集中月份）
  const initMonth = value ? Math.max(0, Math.min(11, Number(value.split('/')[0]) - 1)) : 5
  const [month, setMonth] = useState(initMonth)

  const firstDay = new Date(YEAR, month, 1).getDay()
  const daysInMonth = new Date(YEAR, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col justify-end"
      style={{ background: 'rgba(43,43,38,0.4)' }}
      onClick={onClose}
    >
      <div className="rounded-t-2xl bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <span className="text-xl font-bold text-ink">{title}</span>
          <button onClick={onClose} className="text-base font-medium text-ink2" style={{ minHeight: 44, padding: '0 8px' }}>
            關閉
          </button>
        </div>

        {/* 月份切換 */}
        <div className="flex items-center justify-between px-5 py-3">
          <button
            onClick={() => setMonth((m) => Math.max(0, m - 1))}
            disabled={month === 0}
            className="rounded-lg border border-line px-4 text-lg font-bold text-ink disabled:opacity-30"
            style={{ minHeight: 44 }}
          >
            ‹
          </button>
          <span className="text-lg font-bold text-ink">
            {YEAR} 年 {month + 1} 月
          </span>
          <button
            onClick={() => setMonth((m) => Math.min(11, m + 1))}
            disabled={month === 11}
            className="rounded-lg border border-line px-4 text-lg font-bold text-ink disabled:opacity-30"
            style={{ minHeight: 44 }}
          >
            ›
          </button>
        </div>

        {/* 星期列 */}
        <div className="grid grid-cols-7 px-3 text-center text-sm text-muted">
          {WEEK.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>

        {/* 日期格 */}
        <div className="grid grid-cols-7 gap-1 px-3 pb-3">
          {cells.map((d, i) => {
            if (d === null) return <div key={`b${i}`} />
            const mmdd = `${pad(month + 1)}/${pad(d)}`
            const active = mmdd === value
            return (
              <button
                key={mmdd}
                onClick={() => {
                  onSelect(mmdd)
                  onClose()
                }}
                className="flex items-center justify-center rounded-lg text-lg"
                style={{
                  minHeight: 48,
                  background: active ? '#1F6E43' : '#F7F6F2',
                  color: active ? '#fff' : '#2B2B26',
                  fontWeight: active ? 700 : 400,
                }}
              >
                {d}
              </button>
            )
          })}
        </div>

        {/* 清除 */}
        <div className="border-t border-line px-5 py-3">
          <button
            onClick={() => {
              onSelect('')
              onClose()
            }}
            className="w-full rounded-lg border border-line text-base font-medium text-ink2"
            style={{ minHeight: 48 }}
          >
            不限（清除）
          </button>
        </div>
        <div style={{ height: 8 }} />
      </div>
    </div>
  )
}
