import { useId } from 'react'
import { useDialog } from './useDialog'

export interface PickerOption {
  label: string
  value: string
}

// 彈窗選擇器：底部彈出，選項為大塊可點列（觸控友善）。
// 觸發鈕不在這裡——ListFilter 用自己的 Trigger（原本這裡另有一顆 PickerField，全 repo 0 使用，已移除）。
export function Picker({
  title,
  options,
  value,
  onSelect,
  onClose,
}: {
  title: string
  options: PickerOption[]
  value: string
  onSelect: (v: string) => void
  onClose: () => void
}) {
  const panelRef = useDialog(onClose)
  const titleId = `${useId()}-title`
  return (
    <div
      className="anim-fade fixed inset-0 z-[60] flex items-center justify-center p-4"
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
        style={{ maxHeight: '80vh', overflowY: 'auto', boxShadow: 'var(--l3)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-hairline bg-white px-5 py-4">
          {/* 見 CalendarPicker 的同一處註解：span → h3，外觀不變、讀屏才拿得到彈窗名稱 */}
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
        <div>
          {options.map((opt) => {
            const active = opt.value === value
            return (
              <button
                key={opt.value || '__all__'}
                onClick={() => {
                  onSelect(opt.value)
                  onClose()
                }}
                className="flex w-full items-center justify-between px-5 text-left text-lg"
                style={{
                  minHeight: 60,
                  // 分隔線用 hairline token：原本用的是 inset（卡內下凹區的底色），對白底只有 1.09:1，等於沒有線。
                  borderBottom: '1px solid var(--c-hairline)',
                  color: active ? 'var(--c-act)' : 'var(--c-ink)',
                  fontWeight: active ? 700 : 400,
                }}
              >
                {opt.label}
                {active && <span>✓</span>}
              </button>
            )
          })}
        </div>
        <div style={{ height: 8 }} />
      </div>
    </div>
  )
}
