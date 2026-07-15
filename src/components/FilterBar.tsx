import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

// 訂單類別切換（左）＋ 篩選（右）的排版。一般並排；空間太擠時篩選換到下一行並改成全寬。
// 換行判斷用「固定寬度計算」而非量測目前位置，避免全寬後回不去（量測會被自己撐開的寬度卡住）。
const FILTER_MIN = 384 // 篩選並排時的寬度（max-w-sm = 24rem）
const GAP = 12 // gap-3

export default function FilterBar({ toggle, filter }: { toggle: ReactNode; filter: ReactNode }) {
  const rowRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLDivElement>(null)
  const [wrapped, setWrapped] = useState(false)

  useLayoutEffect(() => {
    const check = () => {
      const row = rowRef.current
      if (!row) return
      const containerW = row.clientWidth
      const toggleW = toggleRef.current?.getBoundingClientRect().width ?? 0
      // 有切換鈕且「切換鈕 + 間距 + 篩選最小寬」放不下整列 → 換行改全寬
      setWrapped(toggleW > 0 && toggleW + GAP + FILTER_MIN > containerW)
    }
    check()
    const ro = new ResizeObserver(check)
    if (rowRef.current) ro.observe(rowRef.current)
    window.addEventListener('resize', check)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', check)
    }
  })

  return (
    <div ref={rowRef} className="mb-4 flex flex-wrap items-start gap-3">
      <div ref={toggleRef} className="shrink-0">
        {toggle}
      </div>
      <div className={`ml-auto w-full ${wrapped ? '' : 'max-w-sm'}`}>{filter}</div>
    </div>
  )
}
