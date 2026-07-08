import type { ReactNode } from 'react'

// 狀態標籤（膠囊）：淺底 + 深字。新增色系時只要在 TONE 加一列即可。
export type TagTone = 'danger' | 'orange' | 'amber' | 'brand' | 'muted'

const TONE: Record<TagTone, string> = {
  danger: 'bg-danger/10 text-danger', // 紅：指定今日 / 逾期
  orange: 'bg-orangebg text-orangeink', // 橘：更新重印
  amber: 'bg-accent/15 text-amberink', // 黃：快到期 / 出貨提醒
  brand: 'bg-brand/10 text-brand', // 綠
  muted: 'bg-mutedbg text-ink2', // 中性灰
}

export default function Tag({
  tone = 'muted',
  className = '',
  children,
}: {
  tone?: TagTone
  className?: string
  children: ReactNode
}) {
  return (
    <span className={`inline-flex items-center rounded-full px-4 py-1 text-lg font-bold ${TONE[tone]} ${className}`}>
      {children}
    </span>
  )
}
