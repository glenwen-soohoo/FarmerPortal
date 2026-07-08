import { useState } from 'react'
import type { Order } from '../types'
import { useStore } from '../store'
import BigButton from './BigButton'
import TempLayerTag from './TempLayerTag'
import CleanRemark from './CleanRemark'
import Tag from './Tag'
import BtnLabel from './BtnLabel'
import ConfirmDialog from './ConfirmDialog'
import FailDialog from './FailDialog'
import { EARLY_SHIP_WARNING, isNearDue, isOverdue } from '../utils/shipDate'

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
  today?: string // 測試日期 'YYYY-MM-DD'，用來判定指定出貨日是否為「今日」
}

function windowText(o: Order) {
  if (o.shipWindow) return `${o.shipWindow[0]}–${o.shipWindow[1]}`
  return o.shippableDate ?? '—'
}

export default function OrderCard({ order, upcoming, selectable, selected, onToggleSelect, selectDisabled, earlyEligible, hideProduct, today }: Props) {
  const { printOrder, failOrder } = useStore()
  const [printing, setPrinting] = useState(false)
  const [printStep, setPrintStep] = useState<'preparing' | 'done'>('preparing')
  const [askReprint, setAskReprint] = useState(false)
  const [askEarly, setAskEarly] = useState(false)
  const [askSupplement, setAskSupplement] = useState(false)
  const [askFail, setAskFail] = useState(false)
  const [failNotice, setFailNotice] = useState(false)
  const [showRecipient, setShowRecipient] = useState(false) // 收件資訊預設收合

  const printed = order.shipStatus === '已印單'
  const shipped = order.shipStatus === '已出貨'
  const needsReprint = order.shipStatus === '改單待重印' || !!order.isUpdated
  const forced = !!order.forcedShipDate // 指定出貨
  // 指定出貨日是否正好是「今日」（today 為 'YYYY-MM-DD'，forcedShipDate 為 'MM/DD'）
  const todayMMDD = today ? `${today.slice(5, 7)}/${today.slice(8, 10)}` : null
  const forcedIsToday = forced && order.forcedShipDate === todayMMDD
  // 快到期 / 逾期：僅需出貨頁（非預告）
  const nearDue = !upcoming && !!today && isNearDue(order, today)
  const overdue = !upcoming && !!today && isOverdue(order, today)

  // 時間相關標籤「互斥、一次一個」，優先序：逾期 > 指定出貨日 > 快到期
  const timeTag: { tone: 'danger' | 'amber'; label: string } | null = overdue
    ? { tone: 'danger', label: '逾期未出' }
    : forced
    ? { tone: 'danger', label: forcedIsToday ? '指定今日出貨' : `指定 ${order.forcedShipDate} 出貨` }
    : nearDue
    ? { tone: 'amber', label: '快到期' }
    : null

  // 群組容器內的一列：不用左邊色條 / 整列上色強調（見 #24 迭代）；狀態一律靠徽章表達。
  const rowCls = selectable && selected ? 'bg-mutedbg' : '' // 批次選中：中性淺底
  const dimmed = selectable && selectDisabled

  // 已印單 / 已出貨：接在「預計出貨」後面同一行（whitespace-nowrap 不折行）
  const statusNode = printed ? (
    <span className="whitespace-nowrap text-lg font-bold text-muted">
      已印單 ✓<span className="ml-2 text-sm font-normal text-muted">{order.printedAt}</span>
    </span>
  ) : shipped ? (
    <span className="whitespace-nowrap text-lg font-bold text-muted">
      已出貨 ✓<span className="ml-2 text-sm font-normal text-muted">{order.printedAt}</span>
    </span>
  ) : null

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
    <div className={`flex items-stretch gap-4 p-5 ${rowCls}`} style={{ opacity: dimmed ? 0.45 : 1 }}>
      {/* 左：訂單資訊。順序依「對農友的重要性」：規格數量 → 出貨提醒 → 出貨日 → (收合)收件資訊 */}
      <div className="min-w-0 flex-1">
        {(timeTag || needsReprint) && (
          <div className="mb-3 flex flex-wrap gap-2">
            {/* 時間相關標籤：互斥，一次只一個 */}
            {timeTag && <Tag tone={timeTag.tone}>{timeTag.label}</Tag>}
            {/* 更新重印：非時間標籤，可與時間標籤並存 */}
            {needsReprint && <Tag tone="orange">已更新，請重印</Tag>}
          </div>
        )}

        <div
          className={selectable && !selectDisabled ? 'w-full cursor-pointer text-left' : 'w-full text-left'}
          onClick={selectable && !selectDisabled ? () => onToggleSelect?.() : undefined}
        >
          {!hideProduct && (
            <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-2xl font-bold text-ink">{order.productName}</span>
              <TempLayerTag layer={order.tempLayer} />
            </div>
          )}

          {/* 預計出貨：放最上面（指定今日出貨時不顯示，避免與「今日」混淆）；已印單接在其後同一行 */}
          {!forced ? (
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-base text-muted">預計出貨</span>
              <span className="text-2xl font-bold text-brand">{windowText(order)}</span>
              {statusNode}
            </div>
          ) : (
            statusNode && <div>{statusNode}</div>
          )}

          {/* 規格 × 數量：自己一行、最大（與預計出貨分行，規格再長也不擠壓） */}
          <div className="mt-2 text-3xl font-bold text-ink">
            {order.spec}　×{order.qty}
          </div>

          {/* 出貨提醒 */}
          <div className="mt-3">
            <CleanRemark text={order.cleanRemark} />
          </div>
        </div>

        {/* 4. 收件資訊：預設收合（都印在出貨單上，螢幕不搶版面） */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowRecipient((v) => !v)
          }}
          className="mt-3 inline-flex items-center gap-1 rounded bg-mutedbg px-3 py-1.5 text-base font-medium text-ink active:opacity-80"
        >
          {showRecipient ? '收合收件資訊' : '顯示收件資訊'}
          <span className="text-ink2">{showRecipient ? '▴' : '▾'}</span>
        </button>
        {showRecipient && (
          <div className="mt-2">
            <div className="text-base">
              <span className="font-normal text-muted">訂單編號 </span>
              <span className="font-bold text-ink">{order.orderNumber}</span>
            </div>
            <div className="mt-1 text-lg font-bold text-ink">
              {order.recipient}
              <span className="ml-2 text-base font-normal text-ink2">{order.phone}</span>
            </div>
            <div className="mt-1 text-base text-ink2">{order.address}</div>
            <div className="mt-1 text-base">
              <span className="font-normal text-muted">出貨備註(給司機) </span>
              <span className="text-ink">{order.shipRemark || '無'}</span>
            </div>
          </div>
        )}
      </div>

      {/* 右：動作區。已出貨=唯讀無按鈕；批次勾選模式下隱藏 */}
      {!selectable && !shipped && (
        <div className="oc-action flex shrink-0 flex-col gap-2">
          {printed ? (
            <>
              {/* 已印單（含提早印單）：重印＝綠框、追加補單＝黃框，皆撐滿高度；無法出貨壓最底 */}
              <button
                onClick={onPrintClick}
                className="flex-1 rounded border-2 border-brand text-xl font-bold text-brand active:bg-brand/5"
                style={{ minHeight: 60 }}
              >
                <BtnLabel parts={['重印', '相同貨單']} />
              </button>
              <button
                onClick={() => setAskSupplement(true)}
                className="flex-1 rounded border-2 border-accent text-xl font-bold text-amberink active:bg-accent/5"
                style={{ minHeight: 60 }}
              >
                <BtnLabel parts={['多箱', '追加補單']} />
              </button>
              <BigButton variant="danger" size="md" className="oc-fail" style={{ minHeight: 44, height: 44 }} onClick={() => setAskFail(true)}>
                無法出貨
              </BigButton>
            </>
          ) : upcoming ? (
            earlyEligible ? (
              <>
                {/* 有提早出貨資格：提早印單＝此頁主要動作，用主色綠（按下先跳警告） */}
                <button
                  onClick={() => setAskEarly(true)}
                  className="flex-1 rounded bg-brand text-2xl font-bold text-white active:bg-brand-dark"
                  style={{ minHeight: 120 }}
                >
                  <BtnLabel parts={['提早', '印單']} />
                </button>
                <BigButton variant="danger" size="md" style={{ minHeight: 44, height: 44 }} onClick={() => setAskFail(true)}>
                  無法出貨
                </BigButton>
              </>
            ) : (
              <>
                {/* 無提早資格：不可操作的說明 */}
                <div
                  className="flex flex-1 items-center justify-center rounded bg-mutedbg text-center text-xl font-bold leading-snug text-muted"
                  style={{ minHeight: 120 }}
                >
                  尚未到出貨時間
                </div>
                <BigButton variant="danger" size="md" style={{ minHeight: 44, height: 44 }} onClick={() => setAskFail(true)}>
                  無法出貨
                </BigButton>
              </>
            )
          ) : (
            <>
              {/* 未印：印單＝唯一主鈕，最大最醒目 */}
              <button
                onClick={onPrintClick}
                className="flex-1 rounded bg-brand text-3xl font-bold text-white active:bg-brand-dark"
                style={{ minHeight: 120 }}
              >
                印單
              </button>
              <BigButton variant="danger" size="md" className="oc-fail" style={{ minHeight: 44, height: 44 }} onClick={() => setAskFail(true)}>
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
