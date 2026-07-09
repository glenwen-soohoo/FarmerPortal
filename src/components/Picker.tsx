export interface PickerOption {
  label: string
  value: string
}

// 觸發按鈕：大塊、可點，顯示目前選到的值 + ▾
export function PickerField({
  label,
  value,
  placeholder = '全部',
  onClick,
}: {
  label: string
  value: string
  placeholder?: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-lg border border-line bg-white px-4 text-left"
      style={{ minHeight: 60 }}
    >
      <span className="text-base text-ink2">{label}</span>
      <span className="flex items-center gap-2 text-lg font-medium text-ink">
        {value || placeholder}
        <span className="text-ink2">▾</span>
      </span>
    </button>
  )
}

// 彈窗選擇器：底部彈出，選項為大塊可點列（觸控友善）
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
  return (
    <div
      className="anim-fade fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(43,43,38,0.4)' }}
      onClick={onClose}
    >
      <div
        className="anim-pop w-full max-w-md rounded-2xl bg-white"
        style={{ maxHeight: '80vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-white px-5 py-4">
          <span className="text-xl font-bold text-ink">{title}</span>
          <button onClick={onClose} className="text-base font-medium text-ink2" style={{ minHeight: 44, padding: '0 8px' }}>
            關閉
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
                  borderBottom: '1px solid #F0EDE6',
                  color: active ? '#1F6E43' : '#2B2B26',
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
