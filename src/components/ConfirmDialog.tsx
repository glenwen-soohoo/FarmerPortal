import type { ReactNode } from 'react'
import BigButton from './BigButton'

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
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-card bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-2xl font-bold text-ink">{title}</h3>
        <div className="mt-4 text-lg text-ink2 leading-relaxed">{message}</div>
        <div className="mt-6 flex gap-3 justify-end">
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
