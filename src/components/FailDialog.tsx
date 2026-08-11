import { useState } from 'react'
import BigButton from './BigButton'
import { useDialog } from './useDialog'

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
  // Esc：第二步先退回第一步，第一步才整個關掉（與點遮罩的行為一致）。
  // 第二個參數傳 confirming：兩步的容器是同一個 DOM 節點（React 位置相同、同型別 → 重用），
  // 只有子樹被換掉，原本聚焦的鈕消失後焦點會掉到 body。傳它才會在切步時重新聚焦容器。
  const panelRef = useDialog(() => (confirming ? setConfirming(false) : onCancel()), confirming)

  if (confirming) {
    return (
      // 點遮罩＝返回上一步（與第一步的「點遮罩關閉」一致）。少了這個 onClick，農友只能找「返回」鈕。
      <div
        className="anim-fade fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'var(--scrim)' }}
        onClick={() => setConfirming(false)}
      >
        <div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="確認回報無法出貨"
          className="anim-pop w-full max-w-md overflow-y-auto rounded-card bg-white p-6"
          style={{ boxShadow: 'var(--l3)', maxHeight: '85vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-2xl font-bold text-ink">確認回報無法出貨</h3>
          <p className="mt-4 text-lg text-ink-sub">
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
    <div className="anim-fade fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--scrim)' }} onClick={onCancel}>
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="無法出貨"
        className="anim-pop w-full max-w-md overflow-y-auto rounded-card bg-white p-6"
          style={{ boxShadow: 'var(--l3)', maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-2xl font-bold text-ink">無法出貨</h3>
        <p className="mt-3 text-lg text-ink-sub">請選擇原因：</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              aria-pressed={reason === r}
              className={`rounded-full border px-4 text-lg ${
                reason === r ? 'border-act text-act font-bold' : 'border-hairline text-ink'
              }`}
              style={{ minHeight: 56 }}
            >
              {r}
            </button>
          ))}
        </div>
        <label className="mt-4 block text-base text-ink-sub">
          可出貨替代日（選填）
          <input
            value={altDate}
            onChange={(e) => setAltDate(e.target.value)}
            placeholder="例：06/20"
            className="mt-1 w-full rounded-full border border-edge px-3 text-lg"
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
