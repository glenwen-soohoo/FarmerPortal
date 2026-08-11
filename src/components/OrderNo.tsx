interface Props {
  value: string
  className?: string
  strike?: boolean // 舊標籤作廢：整串紅字刪除線（改單重印時用來標「這個編號已失效」）
}

// 訂單編號 / 物流編號的統一顯示：前面所有字灰（text-ink-faint、細），最後 4 碼黑粗（font-bold text-ink）。
// 讓農友一眼對出「後四碼」——實務上他們就是靠尾碼核對貨單，前面的固定前綴反而是雜訊。
// ⚠️ 一律「拆成 後 4 碼 vs 其餘」，不寫死 9：編號長度不保證是 13 碼。
export default function OrderNo({ value, className, strike }: Props) {
  const s = value ?? ''
  const head = s.length > 4 ? s.slice(0, -4) : ''
  const tail = s.length > 4 ? s.slice(-4) : s

  if (strike) {
    return <span className={`text-urgent line-through ${className ?? ''}`}>{s}</span>
  }

  return (
    <span className={className}>
      {head && <span className="font-normal text-ink-faint">{head}</span>}
      <span className="font-bold text-ink">{tail}</span>
    </span>
  )
}
