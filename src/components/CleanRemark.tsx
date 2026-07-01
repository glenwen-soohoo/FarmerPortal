export default function CleanRemark({ text }: { text: string }) {
  const empty = !text || !text.trim()

  // 無提醒：顯示「出貨提醒 · 無」（平淡，不加強調底）
  if (empty) {
    return (
      <div className="text-base text-ink2">
        <span className="font-bold text-muted">出貨提醒</span>
        <span className="mx-2 text-muted">·</span>
        無
      </div>
    )
  }

  return (
    <div className="rounded px-3 py-2 text-ink" style={{ background: '#FBF3E2' }}>
      <span className="font-bold" style={{ color: '#A8741A' }}>
        出貨提醒
      </span>
      <span className="mx-2 text-muted">·</span>
      {text}
    </div>
  )
}
