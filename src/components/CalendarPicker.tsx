import { useId, useState } from 'react'
import { useDialog } from './useDialog'

const WEEK = ['日', '一', '二', '三', '四', '五', '六']
const pad = (n: number) => String(n).padStart(2, '0')

interface Props {
  title: string
  value: string // ISO 'YYYY-MM-DD' 或 ''
  onSelect: (iso: string) => void
  onClose: () => void
}

/**
 * 出貨日選擇。輸出完整 ISO 'YYYY-MM-DD'。
 *
 * ⚠️ 原本硬寫 const YEAR = 2026、月份鎖在 0~11 出不去，輸出 'MM/DD'：日曆固定停在 2026 年，
 * 而且丟掉了「使用者點的是哪一年」這個它唯一確定知道的資訊，讓下游只能猜年份。
 * 改成輸出完整 ISO 之後，篩選比對兩邊都是 ISO，不必再推算年份。
 */
export default function CalendarPicker({ title, value, onSelect, onClose }: Props) {
  // 初始顯示月：有值就跳到該值的年月，否則今天所在的年月（原本預設寫死 6 月＝假資料集中的月份）
  const [ym, setYm] = useState(() => {
    const d = value ? new Date(`${value}T00:00:00`) : new Date()
    const base = Number.isNaN(d.getTime()) ? new Date() : d
    return { y: base.getFullYear(), m: base.getMonth() }
  })
  const panelRef = useDialog(onClose)
  const titleId = `${useId()}-title`

  // 上／下個月用 Date 正規化，跨年自然滾到 12 月←→1 月（不再 clamp 在同一年內）
  const shiftMonth = (delta: number) =>
    setYm(({ y, m }) => {
      const d = new Date(y, m + delta, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })

  const firstDay = new Date(ym.y, ym.m, 1).getDay()
  const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div
      /* p-2 在窄螢幕：360px 下 7 個日期格擠不出 44px（見下方日期格註解），overlay 的
         左右 padding 是唯一能還出來的空間。≥640px 回到 p-4。 */
      className="anim-fade fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4"
      style={{ background: 'var(--scrim)' }}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="anim-pop w-full max-w-md rounded-card bg-white"
        style={{ maxHeight: '85vh', overflowY: 'auto', boxShadow: 'var(--l3)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
          {/* 原本是 span：讀屏既拿不到彈窗名稱、也數不到標題。Tailwind preflight 已重置
              heading 的字級與字重，換成 h3 加同一組 class 外觀不變。 */}
          <h3 id={titleId} className="text-xl font-bold text-ink">
            {title}
          </h3>
          {/* 純圖示：✕ 在彈窗右上是通用慣例，不需要「關閉」兩個字。刻意用中性色不用 urgent ——
              關閉篩選不是危險動作，染紅會讀成刪除／警告，而紅 X 是視窗軟體的慣例、不是 App 的。
              字級跟標題同級（text-xl）才讀得出是圖示而不是一個標點。 */}
          <button
            onClick={onClose}
            aria-label="關閉"
            className="flex items-center justify-center text-xl font-medium text-ink-sub"
            style={{ minWidth: 44, minHeight: 44, lineHeight: 1 }}
          >
            <span aria-hidden>✕</span>
          </button>
        </div>

        {/* 月份切換（可跨年，不再 disabled 在 1 月／12 月） */}
        <div className="flex items-center justify-between px-5 py-3">
          <button
            onClick={() => shiftMonth(-1)}
            className="rounded-full border border-hairline px-4 text-lg font-bold text-ink"
            style={{ minHeight: 44 }}
            aria-label="上個月"
          >
            ‹
          </button>
          <span className="text-lg font-bold text-ink" aria-live="polite">
            {ym.y} 年 {ym.m + 1} 月
          </span>
          <button
            onClick={() => shiftMonth(1)}
            className="rounded-full border border-hairline px-4 text-lg font-bold text-ink"
            style={{ minHeight: 44 }}
            aria-label="下個月"
          >
            ›
          </button>
        </div>

        {/* 星期列。px 必須與下方日期格同步，否則兩排欄位左右緣對不齊 */}
        <div className="grid grid-cols-7 px-1 text-center text-sm text-ink-faint sm:px-3">
          {WEEK.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>

        {/* 日期格。⚠️ 窄螢幕收緊 px 與 gap 是為了讓格子寬度過 44px：
            360px × 7 欄的算法是（360 − overlay p 左右 − 這裡的 px 左右 − 6 個 gap）÷ 7。
            原本 p-4/px-3/gap-1 在三個字級下只有 38.6 / 40.0 / 41.4px，全部破線；
            改成 p-2/px-1/gap-0.5 之後是 45.6 / 46.3 / 46.9px。
            ⚠️ 這裡不能用 .tap44 補：格子彼此只隔一個 gap，往外撐 44 會讓相鄰日期的可點區
            重疊（38.6px 時各撐 2.7px、gap 只有 4px → 重疊 1.4px），點邊緣會選到隔天。
            日期選錯就是出貨日選錯，所以必須真的把格子做寬，不是擴大可點區。 */}
        <div className="grid grid-cols-7 gap-0.5 px-1 pb-3 sm:gap-1 sm:px-3">
          {cells.map((d, i) => {
            if (d === null) return <div key={`b${i}`} />
            const iso = `${ym.y}-${pad(ym.m + 1)}-${pad(d)}`
            const active = iso === value
            return (
              <button
                key={iso}
                onClick={() => {
                  onSelect(iso)
                  onClose()
                }}
                className="flex items-center justify-center rounded-full text-lg"
                style={{
                  minHeight: 48,
                  background: active ? 'var(--c-act)' : 'var(--c-page)',
                  color: active ? 'var(--c-white)' : 'var(--c-ink)',
                  fontWeight: active ? 700 : 400,
                }}
              >
                {d}
              </button>
            )
          })}
        </div>

        {/* 清除 */}
        <div className="border-t border-hairline px-5 py-3">
          <button
            onClick={() => {
              onSelect('')
              onClose()
            }}
            className="w-full rounded-full border border-hairline text-base font-medium text-ink-sub"
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
