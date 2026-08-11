import type { ReactNode } from 'react'

// 狀態標籤（膠囊）：淺底 + 深字。新增色系時只要在 TONE 加一列即可。
// ⚠️ tone 名刻意與色票 token 同名：這一層是「語意 → 色票」的唯一對照表，兩邊同名才對得起來。
export type TagTone = 'urgent' | 'changed' | 'notice' | 'act' | 'faint'

const TONE: Record<TagTone, string> = {
  urgent: 'bg-urgent/10 text-urgent', // 紅：指定今日 / 逾期
  changed: 'bg-tint-changed text-changed', // 橘：更新重印
  // 黃：快到期 / 出貨提醒。淡底壓到 8%——tint-notice 加深後若維持 15%，深字在上面反而掉到 4.5 以下
  notice: 'bg-tint-notice/[0.08] text-notice',
  act: 'bg-act/10 text-act', // 綠
  faint: 'bg-inset text-ink-sub', // 中性灰
}

export default function Tag({
  tone = 'faint',
  size = 'chip',
  className = '',
  children,
}: {
  tone?: TagTone
  size?: 'chip' | 'sm'
  className?: string
  children: ReactNode
}) {
  // 兩階、一律全圓膠囊。原本有 chip/sm/md/lg 四階，但 md/lg 零使用；
  // 曾一度改成 4px 方角（理由是「藥丸會跟規格數量搶視線」），已按使用者決定復原成膠囊——
  // 記號類元件維持膠囊當作親切的視覺裝飾。兩階仍要統一，否則同一枚標籤在兩頁是兩種形狀。
  // ⚠️ 左右 padding 比方角版加寬（1.5→2.5 / 2→3）：膠囊的圓弧會吃掉字的邊界，不加寬會顯得擁擠。
  // ⚠️ 兩階的字級現在都是 text-sm，只差 padding。chip 原本是 text-xs，但那在「小」字級下
  //    只有 10.5px（移除手機 0.8 倍前更低到 8.3px），已統一拉到 text-sm。
  //    這也解掉先前「稽核說 text-xs 太小、驗證者說保留」那個互相矛盾的待決事項。
  const sizing =
    size === 'sm' ? 'px-3 py-0.5 text-sm rounded-full' : 'px-2.5 py-0.5 text-sm rounded-full'
  return (
    <span className={`inline-flex items-center font-bold ${sizing} ${TONE[tone]} ${className}`}>
      {children}
    </span>
  )
}
