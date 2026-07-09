import { useState } from 'react'
import BigButton from './BigButton'

const REASONS = ['缺貨', '品質不良', '數量不足', '其他']

interface Props {
  recipient: string
  onConfirm: (reason: string, altDate?: string) => void
  onCancel: () => void
}

export default function FailDialog({ recipient, onConfirm, onCancel }: Props) {
  const [reason, setReason] = useState('')
  const [altDate, setAltDate] = useState('')
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <div className="anim-fade fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
        <div className="anim-pop w-full max-w-md rounded-card bg-white p-6">
          <h3 className="text-2xl font-bold text-ink">確認回報無法出貨</h3>
          <p className="mt-4 text-lg text-ink2">
            「{recipient} 的訂單」原因：{reason}
            {altDate && `，可出貨日 ${altDate}`}。確定要回報嗎？
          </p>
          <div className="mt-6 flex gap-3 justify-end">
            <BigButton variant="secondary" onClick={() => setConfirming(false)}>
              返回
            </BigButton>
            <BigButton variant="danger" onClick={() => onConfirm(reason, altDate || undefined)}>
              確定回報
            </BigButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="anim-fade fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onCancel}>
      <div className="anim-pop w-full max-w-md rounded-card bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-2xl font-bold text-ink">無法出貨</h3>
        <p className="mt-3 text-lg text-ink2">請選擇原因：</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`rounded border px-4 text-lg ${
                reason === r ? 'border-brand text-brand font-bold' : 'border-line text-ink'
              }`}
              style={{ minHeight: 56 }}
            >
              {r}
            </button>
          ))}
        </div>
        <label className="mt-4 block text-base text-ink2">
          可出貨替代日（選填）
          <input
            value={altDate}
            onChange={(e) => setAltDate(e.target.value)}
            placeholder="例：06/20"
            className="mt-1 w-full rounded border border-line px-3 text-lg"
            style={{ minHeight: 48 }}
          />
        </label>
        <div className="mt-6 flex gap-3 justify-end">
          <BigButton variant="secondary" onClick={onCancel}>
            取消
          </BigButton>
          <BigButton variant="danger" disabled={!reason} onClick={() => setConfirming(true)}>
            下一步
          </BigButton>
        </div>
      </div>
    </div>
  )
}
