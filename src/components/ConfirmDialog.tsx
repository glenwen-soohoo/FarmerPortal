import type { ReactNode } from 'react'
import BigButton from './BigButton'
import { useDialog } from './useDialog'

interface Props {
  title: string
  message: ReactNode
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'primary' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  title,
  message,
  confirmText = '確定',
  cancelText = '取消',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}: Props) {
  const panelRef = useDialog(onCancel)
  return (
    <div
      className="anim-fade fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'var(--scrim)' }}
      onClick={onCancel}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="anim-pop flex w-full max-w-md flex-col rounded-card bg-white"
        /* max-height + 內容區獨立捲動：多箱重印時內容會很高（實測 8 個物流編號 → 755px，
           大字級 873px），原本沒有上限也不能捲，確認鈕會被推出視窗外且按不到。
           動作列放在 flex 的最後一格、不參與捲動，所以永遠看得到。 */
        style={{ boxShadow: 'var(--l3)', maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <h3 className="text-2xl font-bold text-ink">{title}</h3>
          <div className="mt-4 text-lg text-ink-sub leading-relaxed">{message}</div>
        </div>
        <div className="flex shrink-0 justify-end gap-3 border-t border-hairline p-4">
          <BigButton variant="secondary" onClick={onCancel}>
            {cancelText}
          </BigButton>
          <BigButton variant={confirmVariant} onClick={onConfirm}>
            {confirmText}
          </BigButton>
        </div>
      </div>
    </div>
  )
}
