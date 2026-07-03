import { useState } from 'react'
import type { Order } from '../types'
import { useStore } from '../store'
import BigButton from './BigButton'
import TempLayerTag from './TempLayerTag'
import CleanRemark from './CleanRemark'
import ConfirmDialog from './ConfirmDialog'
import FailDialog from './FailDialog'
import { EARLY_SHIP_WARNING } from '../utils/shipDate'

interface Props {
  order: Order
  upcoming?: boolean
  // 批次勾選模式（批次列印出貨單 / 批次黑貓收貨）
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: () => void
  selectDisabled?: boolean // 此模式下該單不可勾選（如批次收貨時的非已印單）
  earlyEligible?: boolean // 有提早出貨資格：出貨預告的單可「提早印單」
  hideProduct?: boolean // 商品分組大卡片內：小卡不再顯示產品名 / 溫層（已在大卡標題）
}

function windowText(o: Order) {
  if (o.shipWindow) return `${o.shipWindow[0]}–${o.shipWindow[1]}`
  return o.shippableDate ?? '—'
}

export default function OrderCard({ order, upcoming, selectable, selected, onToggleSelect, selectDisabled, earlyEligible, hideProduct }: Props) {
  const { printOrder, failOrder } = useStore()
  const [printing, setPrinting] = useState(false)
  const [printStep, setPrintStep] = useState<'preparing' | 'done'>('preparing')
  const [askReprint, setAskReprint] = useState(false)
  const [askEarly, setAskEarly] = useState(false)
  const [askSupplement, setAskSupplement] = useState(false)
  const [askFail, setAskFail] = useState(false)
  const [failNotice, setFailNotice] = useState(false)

  const printed = order.shipStatus === '已印單'
  const shipped = order.shipStatus === '已出貨'
  const needsReprint = order.shipStatus === '改單待重印' || !!order.isUpdated
  const forced = !!order.forcedShipDate // 指定出貨

  // 卡片底色 / 邊框：批次選中(綠) > 指定出貨(淺紅) > 改單待重印(琥珀) > 一般
  let cardBg = '#fff'
  let cardBorderColor = '#E5E1D8'
  let cardBorderW = 1
  if (selectable && selected) {
    cardBg = '#EAF3EC'
    cardBorderColor = '#1F6E43'
    cardBorderW = 2
  } else if (forced) {
    cardBg = '#FDEBEC'
    cardBorderColor = '#D98080'
    cardBorderW = 2
  } else if (needsReprint) {
    cardBg = '#FDF3E0'
    cardBorderColor = '#D99A2B'
    cardBorderW = 2
  }
  const dimmed = selectable && selectDisabled

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

  // 多箱追加補單：多印一張補單，不改變訂單狀態
  const doSupplement = () => {
    setAskSupplement(false)
    setPrinting(true)
    setPrintStep('preparing')
    window.setTimeout(() => setPrintStep('done'), 1200)
    window.setTimeout(() => setPrinting(false), 2000)
  }

  return (
    <div
      className="flex items-stretch gap-4 rounded-card p-5"
      style={{
        background: cardBg,
        border: `${cardBorderW}px solid ${cardBorderColor}`,
        boxShadow: '0 1px 3px rgba(43,43,38,0.06)',
        opacity: dimmed ? 0.45 : 1,
      }}
    >
      {/* 左：訂單資訊（點擊展開）。順序依「對農友的重要性」：產品 → 預計出貨 → 收件人 → 出貨提醒 */}
      <div className="min-w-0 flex-1">
        {forced && (
          <div className="mb-3 inline-block rounded px-3 py-1 text-lg font-bold text-white" style={{ background: '#C0392B' }}>
            指定今日出貨
          </div>
        )}
        {needsReprint && (
          <div className="mb-3 inline-block rounded px-3 py-1 text-lg font-bold text-white" style={{ background: '#D99A2B' }}>
            已更新，請重印
          </div>
        )}

        <div
          className={selectable && !selectDisabled ? 'w-full cursor-pointer text-left' : 'w-full text-left'}
          onClick={selectable && !selectDisabled ? () => onToggleSelect?.() : undefined}
        >
          {/* 1. 產品 / 溫層（分組大卡內隱藏，已顯示在大卡標題） */}
          {!hideProduct && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-2xl font-bold text-ink">{order.productName}</span>
              <TempLayerTag layer={order.tempLayer} />
            </div>
          )}
          <div className={`${hideProduct ? '' : 'mt-1'} text-2xl font-bold text-ink`}>
            {order.spec}　×{order.qty}
          </div>

          {/* 2. 預計出貨日（已印單 / 已出貨 狀態放右邊） */}
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-base text-muted">預計出貨</span>
            <span className="text-xl font-bold text-brand">{windowText(order)}</span>
            {printed && (
              <span className="text-lg font-bold text-ok">
                已印單 ✓<span className="ml-2 text-sm font-normal text-muted">{order.printedAt}</span>
              </span>
            )}
            {shipped && (
              <span className="text-lg font-bold text-ok">
                已出貨 ✓<span className="ml-2 text-sm font-normal text-muted">{order.printedAt}</span>
              </span>
            )}
          </div>

          {/* 3. 訂單編號 / 姓名、電話 / 地址 — 訂單編號與姓名全黑粗體 */}
          <div className="mt-6 text-base">
            <span className="font-normal text-muted">訂單編號 </span>
            <span className="font-bold text-ink">{order.orderNumber}</span>
          </div>
          <div className="mt-1 text-lg font-bold text-ink">
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
            printed ? (
              <>
                {/* 已提早印單：印過但仍未到出貨時間 */}
                <div
                  className="flex flex-1 flex-col items-center justify-center rounded text-center text-lg font-bold leading-snug"
                  style={{ minHeight: 120, background: '#C8D194', color: '#3A401A' }}
                >
                  <span>已提早印單 ✓</span>
                  <span className="text-sm font-normal" style={{ color: '#5C5F3F' }}>尚未到出貨時間</span>
                </div>
                <BigButton variant="danger" size="md" style={{ minHeight: 44, height: 44 }} onClick={() => setAskFail(true)}>
                  無法出貨
                </BigButton>
              </>
            ) : earlyEligible ? (
              <>
                {/* 有提早出貨資格：可提早印單（按下先跳警告） */}
                <button
                  onClick={() => setAskEarly(true)}
                  className="flex-1 rounded text-2xl font-bold"
                  style={{ minHeight: 120, background: '#C8D194', color: '#3A401A' }}
                >
                  提早印單
                </button>
                <BigButton variant="danger" size="md" style={{ minHeight: 44, height: 44 }} onClick={() => setAskFail(true)}>
                  無法出貨
                </BigButton>
              </>
            ) : (
              <>
                {/* 無提早資格：不可操作的說明 */}
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
            )
          ) : printed ? (
            <>
              {/* 已印單：黑貓收貨改由系統抓貨態自動判斷。兩顆主鈕撐滿高度，無法出貨壓到最底 */}
              <button
                onClick={onPrintClick}
                className="flex-1 rounded bg-brand text-xl font-bold text-white active:bg-brand-dark"
                style={{ minHeight: 72 }}
              >
                重印相同貨單
              </button>
              <button
                onClick={() => setAskSupplement(true)}
                className="flex-1 rounded text-xl font-bold text-white"
                style={{ minHeight: 72, background: '#7A5230' }}
              >
                多箱追加補單
              </button>
              <BigButton variant="danger" size="md" style={{ minHeight: 44, height: 44 }} onClick={() => setAskFail(true)}>
                無法出貨
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

      {/* 批次模式：右上大勾選框（此模式不可選的單顯示禁用） */}
      {selectable && (
        <button
          onClick={selectDisabled ? undefined : onToggleSelect}
          disabled={selectDisabled}
          aria-label="勾選此訂單"
          className="flex shrink-0 items-center justify-center self-start rounded"
          style={{
            width: 40,
            height: 40,
            border: `2px solid ${selected ? '#1F6E43' : '#B9B6AC'}`,
            background: selected ? '#1F6E43' : '#fff',
            cursor: selectDisabled ? 'not-allowed' : 'pointer',
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
      {askEarly && (
        <ConfirmDialog
          title="提早印單"
          message={EARLY_SHIP_WARNING}
          confirmText="我了解，仍要提早印單"
          onConfirm={() => {
            setAskEarly(false)
            doPrint()
          }}
          onCancel={() => setAskEarly(false)}
        />
      )}
      {askSupplement && (
        <ConfirmDialog
          title="多箱追加補單"
          message={`為「${order.recipient} 的訂單」多印一張補單（追加箱數用）？不會改變訂單狀態。`}
          confirmText="列印補單"
          onConfirm={doSupplement}
          onCancel={() => setAskSupplement(false)}
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
