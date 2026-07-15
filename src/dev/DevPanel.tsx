import { useState } from 'react'

// 開發用面板：切換「測試日期」以驗證可出貨 / 出貨預告是否正確依日期切換。
// 非產品 UI，樣式刻意做成明顯的開發工具外觀。
function shiftDay(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + delta)
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${dt.getFullYear()}-${mm}-${dd}`
}

interface Props {
  today: string // 'YYYY-MM-DD'
  onChange: (iso: string) => void
  shippableCount: number
  upcomingCount: number
  earlyEligible: boolean
  onToggleEarly: () => void
  farmers: { id: number; farm: string }[]
  currentFarmerId: number
  onChangeFarmer: (id: number) => void
}

export default function DevPanel({
  today,
  onChange,
  shippableCount,
  upcomingCount,
  earlyEligible,
  onToggleEarly,
  farmers,
  currentFarmerId,
  onChangeFarmer,
}: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-20 right-4 z-40" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
      {open ? (
        <div
          className="w-72 rounded-lg p-3 text-white shadow-lg"
          style={{ background: '#2B2B26' }}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold tracking-wide">開發面板</span>
            <button onClick={() => setOpen(false)} className="text-sm text-gray-300" aria-label="收合">
              ✕
            </button>
          </div>

          {/* 切換登入農友（驗證各農友資料，如文旦 7-11／企業匯單） */}
          <div className="mb-3">
            <div className="mb-1 text-xs text-gray-400">目前登入農友</div>
            <select
              value={currentFarmerId}
              onChange={(e) => onChangeFarmer(Number(e.target.value))}
              className="w-full rounded px-2 py-1 text-base text-ink"
              style={{ background: '#fff' }}
            >
              {farmers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.id}. {f.farm}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-1 text-xs text-gray-400">測試日期</div>
          <input
            type="date"
            value={today}
            onChange={(e) => e.target.value && onChange(e.target.value)}
            className="w-full rounded px-2 py-1 text-base text-ink"
            style={{ background: '#fff' }}
          />

          <div className="mt-2 flex gap-2">
            <button
              onClick={() => onChange(shiftDay(today, -1))}
              className="flex-1 rounded bg-gray-600 py-1 text-sm active:bg-gray-500"
            >
              − 前一天
            </button>
            <button
              onClick={() => onChange(shiftDay(today, 1))}
              className="flex-1 rounded bg-gray-600 py-1 text-sm active:bg-gray-500"
            >
              後一天 +
            </button>
          </div>

          <div className="mt-3 space-y-0.5 text-sm">
            <div>
              目前測試日：<span className="font-bold">{today.replace(`${today.slice(0, 4)}-`, '').replace('-', '/')}</span>
            </div>
            <div className="text-gray-300">
              可出貨 <span className="font-bold text-white">{shippableCount}</span> 筆 · 出貨預告{' '}
              <span className="font-bold text-white">{upcomingCount}</span> 筆
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-400">改日期後，兩區會依「出貨起始日」重新分配</div>

          <div className="mt-3 border-t border-gray-600 pt-3">
            <button
              onClick={onToggleEarly}
              className="w-full rounded py-1.5 text-sm font-bold"
              style={{ background: earlyEligible ? '#1F6E43' : '#6b6b5f', color: '#fff' }}
            >
              提早出貨資格：{earlyEligible ? '有' : '無'}（點擊切換）
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg px-3 py-2 text-sm font-bold text-white shadow-lg"
          style={{ background: '#2B2B26' }}
        >
          開發面板
        </button>
      )}
    </div>
  )
}
