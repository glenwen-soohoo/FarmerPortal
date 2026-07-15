import { useState } from 'react'
import type { Order } from '../types'
import { useStore } from '../store'
import BigButton from './BigButton'
import TempLayerTag from './TempLayerTag'
import Tag from './Tag'
import BtnLabel from './BtnLabel'
import ConfirmDialog from './ConfirmDialog'
import FailDialog from './FailDialog'
import { EARLY_SHIP_WARNING, orderTimeTag, needsReprint } from '../utils/shipDate'

interface Props {
  order: Order
  upcoming?: boolean
  // 批次勾選模式（批次列印出貨單 / 批次黑貓收貨）
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: () => void
  selectedQty?: number // 批次列印：此單要印幾張（1=原印，>1=含補印）
  onQtyChange?: (delta: number) => void
  selectDisabled?: boolean // 此模式下該單不可勾選（如批次收貨時的非已印單）
  earlyEligible?: boolean // 有提早出貨資格：出貨預告的單可「提早印單」
  hideProduct?: boolean // 商品分組大卡片內：小卡不再顯示產品名 / 溫層（已在大卡標題）
  today?: string // 測試日期 'YYYY-MM-DD'，用來判定指定出貨日是否為「今日」
}

function windowText(o: Order) {
  if (o.shipWindow) return `${o.shipWindow[0]}–${o.shipWindow[1]}`
  return '—'
}

export default function OrderCard({ order, upcoming, selectable, selected, onToggleSelect, selectedQty = 1, onQtyChange, selectDisabled, earlyEligible, hideProduct, today }: Props) {
  const { printOrder, supplementOrder, failOrder } = useStore()
  const [printing, setPrinting] = useState(false)
  const [printStep, setPrintStep] = useState<'preparing' | 'done'>('preparing')
  const [askPrint, setAskPrint] = useState(false) // 印單彈窗：一次產生 N 個新物流編號
  const [printQty, setPrintQty] = useState(1)
  const [askReprint, setAskReprint] = useState(false) // 重印彈窗：沿用既有單號、可勾選
  const [reprintSel, setReprintSel] = useState<Set<string>>(new Set())
  const [askEarly, setAskEarly] = useState(false)
  const [askSupplement, setAskSupplement] = useState(false)
  const [supQty, setSupQty] = useState(1) // 追加補單：再多補印幾單（每單多一個物流編號）
  const [askFail, setAskFail] = useState(false)
  const [failNotice, setFailNotice] = useState(false)
  const [showRecipient, setShowRecipient] = useState(false) // 收件資訊預設收合

  const printed = order.shipStatus === '已印單'
  const shipped = order.shipStatus === '已出貨'
  const isReprint = needsReprint(order)
  // 時間相關標籤（互斥、一次一個）：逾期 > 指定今日 > 今日到期 > 指定日期 > 快到期
  const timeTag = today ? orderTimeTag(order, today) : null

  // 群組容器內的一列：不用左邊色條 / 整列上色強調（見 #24 迭代）；狀態一律靠徽章表達。
  const rowCls = selectable && selected ? 'bg-mutedbg' : '' // 批次選中：中性淺底
  const dimmed = selectable && selectDisabled

  // 已出貨標記接在「物流編號」後面（已印單標記已移除，狀態改由動作鈕表達）
  const statusNode = shipped ? (
    <span className="whitespace-nowrap text-lg font-bold text-muted">已出貨 ✓</span>
  ) : null

  // 物流編號（黑貓單號）：出貨預告尚未取號→尚無；其餘列出所有單號（補單多筆，一個一行）
  const trackingNos = upcoming ? [] : order.trackingNos ?? []

  // 跑一段「準備中…→取單」列印動畫後執行 after
  const runPrintAnim = (after?: () => void) => {
    setPrinting(true)
    setPrintStep('preparing')
    window.setTimeout(() => setPrintStep('done'), 1200)
    window.setTimeout(() => {
      setPrinting(false)
      after?.()
    }, 2000)
  }
  // 印單：即時產生 count 個新物流編號並列印（狀態→已印單）
  const doPrint = (count: number) => {
    setAskPrint(false)
    setAskEarly(false)
    runPrintAnim(() => printOrder(order.id, count))
  }
  // 重印：沿用勾選的既有單號重印，不產生新號、不改資料
  const doReprint = () => {
    setAskReprint(false)
    runPrintAnim()
  }
  const openPrint = () => {
    setPrintQty(1)
    setAskPrint(true)
  }
  const openReprint = () => {
    setReprintSel(new Set(trackingNos))
    setAskReprint(true)
  }
  const toggleReprint = (no: string) =>
    setReprintSel((prev) => {
      const n = new Set(prev)
      n.has(no) ? n.delete(no) : n.add(no)
      return n
    })

  // 多箱追加補單：多印 N 單補單（每單多要一個物流編號），不改變訂單狀態
  const doSupplement = () => {
    const n = supQty
    setAskSupplement(false)
    runPrintAnim(() => supplementOrder(order.id, n))
  }

  return (
    <div className={`oc-row flex items-stretch gap-4 p-5 ${rowCls}`} style={{ opacity: dimmed ? 0.45 : 1 }}>
      {/* 左：訂單資訊。順序依「對農友的重要性」：規格數量 → 出貨提醒 → 出貨日 → (收合)收件資訊 */}
      <div className="min-w-0 flex-1">
        {(timeTag || isReprint) && (
          <div className="mb-3 flex flex-wrap gap-2">
            {/* 時間相關標籤：互斥，一次只一個 */}
            {timeTag && <Tag tone={timeTag.tone}>{timeTag.label}</Tag>}
            {/* 更新重印：非時間標籤，可與時間標籤並存 */}
            {isReprint && <Tag tone="orange">已更新，請重印</Tag>}
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

          {/* 規格 × 數量：放最上、最大（規格再長也不擠壓） */}
          <div className="text-3xl font-bold text-ink">
            {order.spec}　×{order.qty}
          </div>

          {/* 預計出貨（我們原定出貨區間）；指定出貨也照樣顯示，方便對照原定區間 vs 客人指定日 */}
          {order.shipWindow && (
            <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-base text-muted">預計出貨</span>
              <span className="text-2xl font-bold text-brand">{windowText(order)}</span>
            </div>
          )}

          {/* 出貨提醒：標籤比照「預計出貨」的淡字；內文加略粗淺黃色底線強調 */}
          <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-base text-muted">出貨提醒</span>
            {order.farmerRemark?.trim() ? (
              <span
                className="text-xl leading-relaxed text-ink"
                style={{
                  textDecorationLine: 'underline',
                  textDecorationColor: '#F5DE7A',
                  textDecorationThickness: '3px',
                  textUnderlineOffset: '3px',
                }}
              >
                {order.farmerRemark}
              </span>
            ) : (
              <span className="text-lg text-muted">無</span>
            )}
          </div>

          {/* 物流編號：放出貨提醒下面。尚未取號＝尚無；已取號列出所有黑貓單號。
              批次選中時，號碼後面由上往下標「✓＝即將印出」（份數幾張就前幾張打勾） */}
          <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-base text-muted">物流編號</span>
            {trackingNos.length > 0 ? (
              <span className="inline-flex flex-col gap-y-0.5">
                {trackingNos.map((no, i) => {
                  const marking = selectable && selected // 批次選中才顯示「即將印出」勾選
                  const willPrint = i < selectedQty
                  return (
                    <span key={no} className="inline-flex items-baseline gap-x-2">
                      <span
                        className={`text-xl font-bold tracking-wide ${
                          isReprint ? 'text-danger line-through' : marking && !willPrint ? 'text-muted' : 'text-ink'
                        }`}
                      >
                        {no}
                      </span>
                      {marking && willPrint && (
                        <span className="text-lg font-bold text-brand" aria-hidden>
                          ✓
                        </span>
                      )}
                      {i === 0 && statusNode}
                    </span>
                  )
                })}
                {/* 份數超過既有號：最下面補「＋N 張新號」表示會多要幾個新單號 */}
                {selectable && selected && selectedQty > trackingNos.length && (
                  <span className="text-lg font-bold text-brand">＋{selectedQty - trackingNos.length} 張新號</span>
                )}
              </span>
            ) : selectable && selected ? (
              // 尚無號的單在批次選中時，顯示即將產生的新號張數
              <span className="text-lg font-bold text-brand">＋{selectedQty} 張新號</span>
            ) : (
              <>
                <span className="text-lg text-ink2">尚無</span>
                {statusNode}
              </>
            )}
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
          <div className="anim-slide-down mt-2">
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
              <span className="font-normal text-muted">給司機備註 </span>
              <span className="text-ink">{order.driverRemark || '無'}</span>
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
                onClick={openReprint}
                className="flex-1 rounded border-2 border-brand text-xl font-bold text-brand active:bg-brand/5"
                style={{ minHeight: 60 }}
              >
                <BtnLabel parts={['重印', '相同貨單']} />
              </button>
              <button
                onClick={() => {
                  setSupQty(1)
                  setAskSupplement(true)
                }}
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
              {/* 未印：印單＝唯一主鈕，最大最醒目。改單待重印用土黃色(amberink)區隔（提醒是改過的單） */}
              <button
                onClick={openPrint}
                className={`flex-1 rounded text-3xl font-bold text-white ${
                  isReprint ? 'bg-amberink active:opacity-90' : 'bg-brand active:bg-brand-dark'
                }`}
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

      {/* 批次模式：勾選框 + 補印份數。桌機/平板：＋−上下、勾選框在上；手機：整組移右下、勾選框在右、份數在左 */}
      {selectable && (
        <div className="oc-select flex shrink-0 flex-col items-center gap-4 self-start">
          <button
            onClick={selectDisabled ? undefined : onToggleSelect}
            disabled={selectDisabled}
            aria-label="勾選此訂單"
            className="flex items-center justify-center rounded"
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
          {selected && (
            <div className="oc-stepper flex flex-col items-center gap-2">
              <button
                onClick={() => onQtyChange?.(1)}
                className="rounded border-2 border-line bg-white text-2xl font-bold text-ink"
                style={{ width: 40, height: 40 }}
                aria-label="增加份數"
              >
                ＋
              </button>
              <span className="whitespace-nowrap">
                <span className="text-2xl font-bold text-ink">{selectedQty}</span>
                <span className="ml-1 text-sm text-muted">張</span>
              </span>
              <button
                onClick={() => onQtyChange?.(-1)}
                disabled={selectedQty <= 1}
                className="rounded border-2 border-line bg-white text-2xl font-bold text-ink disabled:opacity-40"
                style={{ width: 40, height: 40 }}
                aria-label="減少份數"
              >
                −
              </button>
            </div>
          )}
        </div>
      )}

      {/* 列印動畫 */}
      {printing && (
        <div className="anim-fade fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(43,43,38,0.4)' }}>
          <div className="anim-pop rounded-card bg-white px-10 py-8 text-center">
            <p className="text-2xl font-bold text-ink">{printStep === 'preparing' ? '準備中…' : '請至印表機取單'}</p>
          </div>
        </div>
      )}

      {/* 印單：一次可產生多張（每張即時要一個新物流編號） */}
      {askPrint && (
        <ConfirmDialog
          title="列印出貨單"
          message={
            <div>
              <p>一次可產生多張出貨單，每張都會即時向黑貓要一個新的物流編號。</p>
              <div className="mt-5 flex items-center gap-4">
                <span className="text-lg text-ink">印</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPrintQty((q) => Math.max(1, q - 1))}
                    disabled={printQty <= 1}
                    className="rounded border-2 border-line bg-white text-2xl font-bold text-ink disabled:opacity-40"
                    style={{ width: 48, height: 48 }}
                    aria-label="減少張數"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-3xl font-bold text-ink">{printQty}</span>
                  <button
                    onClick={() => setPrintQty((q) => q + 1)}
                    className="rounded border-2 border-line bg-white text-2xl font-bold text-ink"
                    style={{ width: 48, height: 48 }}
                    aria-label="增加張數"
                  >
                    ＋
                  </button>
                </div>
                <span className="text-lg text-ink">張</span>
              </div>
            </div>
          }
          confirmText={`列印（${printQty} 張）`}
          onConfirm={() => doPrint(printQty)}
          onCancel={() => setAskPrint(false)}
        />
      )}
      {/* 重印相同貨單：沿用既有單號；多筆時可勾選要重印哪幾張（預設全選） */}
      {askReprint && (
        <div
          className="anim-fade fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setAskReprint(false)}
        >
          <div className="anim-pop w-full max-w-md rounded-card bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-ink">重印相同貨單</h3>
            {trackingNos.length > 1 ? (
              <>
                <p className="mt-3 text-lg text-ink2">勾選要重印的物流編號（沿用原單號、不會產生新號）：</p>
                <div className="mt-3 space-y-2">
                  {trackingNos.map((no) => {
                    const checked = reprintSel.has(no)
                    return (
                      <label
                        key={no}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3"
                        style={{ borderColor: checked ? '#1F6E43' : '#E5E1D8' }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleReprint(no)}
                          style={{ width: 20, height: 20, accentColor: '#1F6E43' }}
                        />
                        <span className="text-xl font-bold tracking-wide text-ink">{no}</span>
                      </label>
                    )
                  })}
                </div>
              </>
            ) : (
              <p className="mt-3 text-lg text-ink2">沿用原單號 {trackingNos[0]} 重印一次（不會產生新號）。</p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <BigButton variant="secondary" onClick={() => setAskReprint(false)}>
                取消
              </BigButton>
              <BigButton disabled={reprintSel.size === 0} onClick={doReprint}>
                {trackingNos.length > 1 ? `重印（${reprintSel.size} 張）` : '重印'}
              </BigButton>
            </div>
          </div>
        </div>
      )}
      {askEarly && (
        <ConfirmDialog
          title="提早印單"
          message={EARLY_SHIP_WARNING}
          confirmText="我了解，仍要提早印單"
          onConfirm={() => doPrint(1)}
          onCancel={() => setAskEarly(false)}
        />
      )}
      {askSupplement && (
        <ConfirmDialog
          title="多箱追加補單"
          message={
            <div>
              <p>
                為「{order.recipient} 的訂單」加印補單（追加箱數用），不會改變訂單狀態；每多補一單會多要一個物流編號。
              </p>
              <div className="mt-5 flex items-center gap-4">
                <span className="text-lg text-ink">再多補印</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSupQty((q) => Math.max(1, q - 1))}
                    disabled={supQty <= 1}
                    className="rounded border-2 border-line bg-white text-2xl font-bold text-ink disabled:opacity-40"
                    style={{ width: 48, height: 48 }}
                    aria-label="減少補印單數"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-3xl font-bold text-ink">{supQty}</span>
                  <button
                    onClick={() => setSupQty((q) => q + 1)}
                    className="rounded border-2 border-line bg-white text-2xl font-bold text-ink"
                    style={{ width: 48, height: 48 }}
                    aria-label="增加補印單數"
                  >
                    ＋
                  </button>
                </div>
                <span className="text-lg text-ink">單</span>
              </div>
            </div>
          }
          confirmText={`列印補單（${supQty} 單）`}
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
