export default function CleanRemark({ text }: { text: string }) {
  const empty = !text || !text.trim()

  // 無提醒：一行淡字帶過
  if (empty) {
    return (
      <div className="text-base text-muted">
        <span className="font-bold">出貨提醒</span>
        <span className="mx-2">·</span>無
      </div>
    )
  }

  // 有提醒：標題做成淺琥珀膠囊標籤（與其他狀態標籤一致），內文墨黑
  return (
    <div className="text-xl leading-snug text-ink">
      <span className="mr-2 inline-flex items-center rounded-full bg-accent/15 px-3 py-0.5 align-[0.1em] text-lg font-bold text-amberink">
        出貨提醒
      </span>
      {text}
    </div>
  )
}
