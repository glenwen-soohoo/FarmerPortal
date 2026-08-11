import { useEffect, useState, type CSSProperties } from 'react'

// 份數輸入框：批次列印 / 印單 / 補單共用。
// ⚠️ 為什麼要 draft string 而不是直接綁數字：直接綁數字時 onChange 會把空字串當 0→夾回 1，
//   使用者「清空再輸入 20」永遠卡在 1（一刪掉就跳回 1、打不進去）。
//   這裡讓輸入框在編輯途中可以是空字串或半成品，只有解析成 ≥min 的整數才回拋，失焦時再夾回。
interface Props {
  value: number
  onChange: (n: number) => void
  min?: number
  className?: string
  style?: CSSProperties
  ariaLabel?: string
}

export default function QtyInput({ value, onChange, min = 1, className, style, ariaLabel }: Props) {
  const [draft, setDraft] = useState(String(value))
  // 外部（＋／−、進批次預設值）改動 value 時同步回輸入框
  useEffect(() => setDraft(String(value)), [value])

  return (
    <input
      type="number"
      inputMode="numeric"
      min={min}
      value={draft}
      onChange={(e) => {
        const raw = e.target.value
        setDraft(raw) // 允許暫時空白／半成品，不立刻夾回
        if (raw === '') return
        const n = Math.floor(Number(raw))
        if (Number.isFinite(n) && n >= min) onChange(n)
      }}
      onBlur={() => {
        const n = Math.floor(Number(draft))
        if (Number.isFinite(n) && n >= min) {
          if (n !== value) onChange(n)
        } else {
          setDraft(String(value)) // 空白／非法 → 復原成目前值
        }
      }}
      onClick={(e) => e.stopPropagation()} // 坐在可點的列裡，點輸入框不該觸發整列（勾選/展開）
      className={className}
      style={style}
      aria-label={ariaLabel}
    />
  )
}
