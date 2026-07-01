import { useState } from 'react'
import type { Order } from '../types'
import { useStore } from '../store'
import BigButton from './BigButton'
import TempLayerTag from './TempLayerTag'
import CleanRemark from './CleanRemark'
import ConfirmDialog from './ConfirmDialog'
import FailDialog from './FailDialog'

interface Props {
  order: Order
  upcoming?: boolean
  // 批次勾選模式（批次列印出貨單）
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: () => void
}

function windowText(o: Order) {
  if (o.shipWindow) return `${o.shipWindow[0]}–${o.shipWindow[1]}`
  return o.shippableDate ?? '—'
}

export default function OrderCard({ order, upcoming, selectable, selected, onToggleSelect }: Props) {
  const { printOrder, shipOrder, failOrder } = useStore()
  const [printing, setPrinting] = useState(false)
  const [printStep, setPrintStep] = useState<'preparing' | 'done'>('preparing')
  const [askReprint, setAskReprint] = useState(false)
  const [askShip, setAskShip] = useState(false)
  const [askFail, setAskFail] = useState(false)
  const [failNotice, setFailNotice] = useState(false)

  const printed = order.shipStatus === '已印單'
  const shipped = order.shipStatus === '已出貨'

  const doPrint = () => {
    setAskReprint(false)
    setPrinting(true)
    setPrintStep('preparing')
    window.setTimeout(() => setPrintStep('done'), 1200)
    window.setTimeout(() => {
      setPrinting(false)
      printOrder(order.id)
    }, 2000)
  }
  const onPrintClick = () => (printed ? setAskReprint(true) : doPrint())

  return (
    <div
      className="flex items-stretch gap-4 rounded-card p-5"
      style={{
        background: selectable && selected ? '#EAF3EC' : '#fff',
        border: `${selectable && selected ? 2 : 1}px solid ${
          selectable && selected ? '#1F6E43' : order.isUpdated ? '#D99A2B' : '#E5E1D8'
        }`,
        boxShadow: '0 1px 3px rgba(43,43,38,0.06)',
      }}
    >
      {/* 左：訂單資訊（點擊展開）。順序依「對農友的重要性」：產品 → 預計出貨 → 收件人 → 出貨提醒 */}
      <div className="min-w-0 flex-1">
        {order.isUpdated && (
          <div className="mb-3 inline-block rounded px-3 py-1 font-bold text-white" style={{ background: '#D99A2B' }}>
            已更新，請重印
          </div>
        )}

        <div
          className={selectable ? 'w-full cursor-pointer text-left' : 'w-full text-left'}
          onClick={selectable ? () => onToggleSelect?.() : undefined}
        >
          {/* 1. 產品 / 規格 / 溫層（主角，字最大） */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-2xl font-bold text-ink">{order.productName}</span>
            <TempLayerTag layer={order.tempLayer} />
          </div>
          <div className="mt-1 text-2xl text-ink2">{order.spec}　×{order.qty}</div>

          {/* 2. 預計出貨日 */}
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base text-muted">預計出貨</span>
            <span className="text-xl font-bold text-brand">{windowText(order)}</span>
          </div>

          {printed && (
            <div className="mt-2 text-lg font-bold text-ok">
              已印單 ✓<span className="ml-2 text-sm font-normal text-muted">{order.printedAt}</span>
            </div>
          )}
          {shipped && (
            <div className="mt-2 text-lg font-bold text-ok">
              已出貨 ✓<span className="ml-2 text-sm font-normal text-muted">{order.printedAt}</span>
            </div>
          )}

          {/* 3. 訂單編號 / 收件人（次要，字較小）— 用較大間距與上方分隔 */}
          <div className="mt-6 text-sm text-muted">訂單編號 {order.orderNumber}</div>
          <div className="mt-1 text-lg font-semibold text-ink">
            {order.recipient}
            <span className="ml-2 text-base font-normal text-ink2">{order.phone}</span>
          </div>
          <div className="mt-1 text-base text-ink2">{order.address}</div>
        </div>

        {/* 出貨提醒（用較大間距與上方分隔）；無提醒也顯示「無」 */}
        <div className="mt-6">
          <CleanRemark text={order.cleanRemark} />
        </div>
      </div>

      {/* 右：超大主按鈕（撐滿卡片高度）。已出貨=唯讀無按鈕；批次勾選模式下隱藏 */}
      {!selectable && !shipped && (
        <div className="flex w-40 shrink-0 flex-col gap-2">
          {upcoming ? (
            <>
              {/* 出貨預告：主區塊為不可操作的說明；下方仍可回報無法出貨 */}
              <div
                className="flex flex-1 items-center justify-center rounded text-center text-xl font-bold leading-snug"
                style={{ minHeight: 120, background: '#F0EDE6', color: '#9E9E9E' }}
              >
                尚未到出貨時間
              </div>
              <BigButton variant="danger" size="md" style={{ minHeight: 44, height: 44 }} onClick={() => setAskFail(true)}>
                無法出貨
              </BigButton>
            </>
          ) : printed ? (
            <>
              {/* 已印單：等黑貓來收 → 按「黑貓收貨」完成出貨；或「重新印單」 */}
              <button
                onClick={() => setAskShip(true)}
                className="flex-1 rounded text-2xl font-bold text-white"
                style={{ minHeight: 120, background: '#7A5230' }}
              >
                黑貓收貨
              </button>
              <BigButton variant="secondary" size="md" onClick={onPrintClick}>
                重新印單
              </BigButton>
            </>
          ) : (
            <>
              <button
                onClick={onPrintClick}
                className="flex-1 rounded bg-brand text-3xl font-bold text-white active:bg-brand-dark"
                style={{ minHeight: 120 }}
              >
                印單
              </button>
              <BigButton variant="danger" size="md" style={{ minHeight: 44, height: 44 }} onClick={() => setAskFail(true)}>
                無法出貨
              </BigButton>
            </>
          )}
        </div>
      )}

      {/* 批次模式：右上大勾選框 */}
      {selectable && (
        <button
          onClick={onToggleSelect}
          aria-label="勾選此訂單"
          className="flex shrink-0 items-center justify-center self-start rounded"
          style={{
            width: 40,
            height: 40,
            border: `2px solid ${selected ? '#1F6E43' : '#B9B6AC'}`,
            background: selected ? '#1F6E43' : '#fff',
          }}
        >
          {selected && <span className="text-2xl font-bold text-white">✓</span>}
        </button>
      )}

      {/* 列印動畫 */}
      {printing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(43,43,38,0.4)' }}>
          <div className="rounded-card bg-white px-10 py-8 text-center">
            <p className="text-2xl font-bold text-ink">{printStep === 'preparing' ? '準備中…' : '請至印表機取單'}</p>
          </div>
        </div>
      )}

      {askReprint && (
        <ConfirmDialog
          title="重新列印"
          message="確定要再印一次嗎？"
          confirmText="再印一次"
          onConfirm={doPrint}
          onCancel={() => setAskReprint(false)}
        />
      )}
      {askShip && (
        <ConfirmDialog
          title="黑貓收貨"
          message={`確認「${order.recipient} 的訂單」黑貓已來收貨？確認後即完成出貨，不能再修改囉。`}
          confirmText="確認收貨"
          onConfirm={() => {
            setAskShip(false)
            shipOrder(order.id)
          }}
          onCancel={() => setAskShip(false)}
        />
      )}
      {askFail && (
        <FailDialog
          recipient={order.recipient}
          onCancel={() => setAskFail(false)}
          onConfirm={(reason, altDate) => {
            failOrder(order.id, reason, altDate)
            setAskFail(false)
            setFailNotice(true)
          }}
        />
      )}
      {failNotice && (
        <ConfirmDialog
          title="已回報"
          message="已通知業務處理。請務必另外電聯業務 0X-XXXXXXXX，以免漏接。"
          confirmText="我知道了"
          cancelText="關閉"
          onConfirm={() => setFailNotice(false)}
          onCancel={() => setFailNotice(false)}
        />
      )}
    </div>
  )
}
