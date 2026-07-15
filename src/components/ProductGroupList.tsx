import { useEffect, useState } from 'react'
import type { Order } from '../types'
import { useStore } from '../store'
import OrderCard from './OrderCard'
import BigButton from './BigButton'
import TempLayerTag from './TempLayerTag'
import ConfirmDialog from './ConfirmDialog'
import { EARLY_SHIP_WARNING } from '../utils/shipDate'

// 商品分區依「清洗後名稱」（variety→productName）
const productKey = (o: Order) => (o.variety && o.variety.trim()) || o.productName

const FAIL_REASONS = ['缺貨', '品質不良', '數量不足', '其他']

interface Group {
  product: string
  orders: Order[]
  totalQty: number
}
function toGroups(orders: Order[]): Group[] {
  const m = new Map<string, Order[]>()
  for (const o of orders) {
    const k = productKey(o)
    if (!m.has(k)) m.set(k, [])
    m.get(k)!.push(o)
  }
  return [...m.entries()].map(([product, os]) => ({
    product,
    orders: os,
    totalQty: os.reduce((a, b) => a + b.qty, 0),
  }))
}

interface Props {
  orders: Order[] // 已篩選 + 已排序
  mode: 'print' | 'early' // print=可出貨批次列印；early=出貨預告批次提早印單
  earlyEligible?: boolean // early 模式：有資格才顯示批次鈕、且個別卡可提早印單
  setNavLocked: (v: boolean) => void
  today?: string // 傳給 OrderCard 判定「指定今日」
}

export default function ProductGroupList({ orders, mode, earlyEligible, setNavLocked, today }: Props) {
  const { printOrder, supplementOrder, failOrder } = useStore()
  const groups = toGroups(orders)

  // 批次只能針對「同一商品」→ 用 batchProduct 鎖定目前批次的商品
  const [batchProduct, setBatchProduct] = useState<string | null>(null)
  // 勾選內容：id → 份數（1=原印，>1=含補印）
  const [sel, setSel] = useState<Map<string, number>>(new Map())
  const [confirming, setConfirming] = useState(false)
  const [failing, setFailing] = useState(false) // 批次無法出貨的原因選擇彈窗
  const [printing, setPrinting] = useState(false)

  useEffect(() => {
    setNavLocked(batchProduct !== null)
    return () => setNavLocked(false)
  }, [batchProduct, setNavLocked])

  const showBatch = mode === 'print' || !!earlyEligible
  const labelCount = [...sel.values()].reduce((a, b) => a + b, 0) // 總張數（含補印）

  const enter = (p: string) => {
    setBatchProduct(p)
    setSel(new Map())
  }
  const cancel = () => {
    setBatchProduct(null)
    setSel(new Map())
    setConfirming(false)
    setFailing(false)
  }
  // 批次預設份數＝該單已取的物流編號數量（先印舊單）；尚無號者至少 1 張
  const defaultQty = (id: string) => {
    const o = orders.find((x) => x.id === id)
    return Math.max(1, o?.trackingNos?.length ?? 0)
  }
  const toggle = (id: string) =>
    setSel((prev) => {
      const n = new Map(prev)
      n.has(id) ? n.delete(id) : n.set(id, defaultQty(id))
      return n
    })
  const addQty = (id: string, delta: number) =>
    setSel((prev) => {
      if (!prev.has(id)) return prev
      const n = new Map(prev)
      n.set(id, Math.max(1, (prev.get(id) ?? 1) + delta))
      return n
    })

  const doPrint = () => {
    setConfirming(false)
    setPrinting(true)
    const entries = [...sel.entries()]
    window.setTimeout(() => {
      entries.forEach(([id, qty]) => {
        const o = orders.find((x) => x.id === id)
        const existing = o?.trackingNos?.length ?? 0
        if (existing === 0) {
          printOrder(id, qty) // 尚無號：首印，產生 qty 個新號、轉已印單
        } else if (qty > existing) {
          supplementOrder(id, qty - existing) // 先印舊單、超出既有號的部分才補新號
        }
        // qty ≤ existing：沿用既有號重印，資料不變
      })
      setPrinting(false)
      cancel()
    }, 1600)
  }
  const doFail = (reason: string) => {
    const ids = [...sel.keys()]
    ids.forEach((id) => failOrder(id, reason))
    cancel()
  }

  const batchLabel = mode === 'early' ? '批次提早印單' : '批次列印'
  const confirmLabel = mode === 'early' ? '提早列印勾選' : '列印勾選'

  return (
    <>
      <div className="space-y-6">
        {groups.map((g) => {
          const active = batchProduct === g.product
          const otherActive = batchProduct !== null && !active
          const allSelected = active && g.orders.length > 0 && g.orders.every((o) => sel.has(o.id))
          const toggleAll = () =>
            setSel(() => {
              if (allSelected) return new Map()
              const n = new Map<string, number>()
              g.orders.forEach((o) => n.set(o.id, sel.get(o.id) ?? defaultQty(o.id)))
              return n
            })
          const temps = [...new Set(g.orders.map((o) => o.tempLayer))]
          // 依規格切成子區塊：同品名下不同規格各自成獨立圓角區塊（左緣仍接同一品名欄）
          const specBlocks: { spec: string; orders: Order[] }[] = []
          g.orders.forEach((o) => {
            const last = specBlocks[specBlocks.length - 1]
            if (last && last.spec === o.spec) last.orders.push(o)
            else specBlocks.push({ spec: o.spec, orders: [o] })
          })

          return (
            <section
              key={g.product}
              className={`pg-section flex rounded-card border bg-white ${active ? 'border-brand' : 'border-line'}`}
              style={{
                borderWidth: active ? 2 : 1,
                boxShadow: '0 1px 3px rgba(43,43,38,0.08)',
                position: active ? 'relative' : undefined,
                zIndex: active ? 40 : undefined,
              }}
            >
              {/* 左側：白底商品欄（商品名 sticky） */}
              <aside className="oc-aside shrink-0 rounded-l-card border-r border-line bg-white">
                <div className="pg-aside-inner sticky top-0 p-4">
                  <div className="pg-aside-info">
                    <div className="text-3xl font-bold leading-tight text-ink">{g.product}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                      {temps.map((t) => (
                        <TempLayerTag key={t} layer={t} />
                      ))}
                    </div>
                    <div className="mt-1 text-base text-ink2">
                      {g.orders.length} 張 · {g.totalQty} 件
                    </div>
                  </div>

                  {/* 批次控制 */}
                  <div className="pg-aside-batch mt-3 flex flex-col gap-2">
                    {active ? (
                      <>
                        <span className="text-base text-ink2">
                          已勾選 {sel.size} 筆 · {labelCount} 張
                        </span>
                        {/* 列印勾選：主要動作、最大 */}
                        <BigButton size="lg" disabled={sel.size === 0} onClick={() => setConfirming(true)}>
                          {confirmLabel}
                        </BigButton>
                        <BigButton size="md" variant="secondary" onClick={toggleAll}>
                          {allSelected ? '取消全選' : '全選'}
                        </BigButton>
                        <BigButton size="md" variant="secondary" onClick={cancel}>
                          取消
                        </BigButton>
                        {/* 批次無法出貨：次要、較小 */}
                        <button
                          disabled={sel.size === 0}
                          onClick={() => setFailing(true)}
                          className="rounded border-2 border-danger text-sm font-bold text-danger disabled:opacity-40"
                          style={{ minHeight: 38 }}
                        >
                          批次無法出貨
                        </button>
                      </>
                    ) : showBatch ? (
                      <BigButton size="md" variant="secondary" onClick={() => enter(g.product)} disabled={otherActive}>
                        {batchLabel}
                      </BigButton>
                    ) : null}
                  </div>
                </div>
              </aside>

              {/* 右側：依規格分成獨立圓角區塊，區塊間用暖灰間隔，右側邊角圓角像分開的卡片 */}
              <div className="pg-orders min-w-0 flex-1 space-y-2 overflow-hidden rounded-r-card bg-canvas">
                {specBlocks.map((blk, bi) => (
                  <div key={`${blk.spec}_${bi}`} className="pg-specblock divide-y divide-line overflow-hidden rounded-r-card bg-white">
                    {blk.orders.map((o) => (
                      <OrderCard
                        key={o.id}
                        order={o}
                        hideProduct
                        upcoming={mode === 'early'}
                        earlyEligible={earlyEligible}
                        selectable={active}
                        selected={sel.has(o.id)}
                        selectedQty={sel.get(o.id) ?? 1}
                        onToggleSelect={() => toggle(o.id)}
                        onQtyChange={(d) => addQty(o.id, d)}
                        today={today}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </section>
          )
        })}

        {confirming && (
          <ConfirmDialog
            title={mode === 'early' ? '提早印單' : '批次列印出貨單'}
            message={
              mode === 'early'
                ? `${EARLY_SHIP_WARNING}（本次共 ${sel.size} 筆、${labelCount} 張）`
                : `確定要列印勾選的 ${sel.size} 筆（共 ${labelCount} 張）出貨單嗎？`
            }
            confirmText={mode === 'early' ? '我了解，仍要提早印單' : '開始列印'}
            onConfirm={doPrint}
            onCancel={() => setConfirming(false)}
          />
        )}

        {/* 批次無法出貨：選原因 */}
        {failing && <BatchFailDialog count={sel.size} onConfirm={doFail} onCancel={() => setFailing(false)} />}

        {printing && (
          <div className="anim-fade fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(43,43,38,0.4)' }}>
            <div className="anim-pop rounded-card bg-white px-10 py-8 text-center">
              <p className="text-2xl font-bold text-ink">{mode === 'early' ? '提早列印中…' : '批次列印中…'}</p>
              <p className="mt-2 text-base text-ink2">請至印表機取單（共 {labelCount} 張）</p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// 批次無法出貨：選共同原因後一次回報
function BatchFailDialog({ count, onConfirm, onCancel }: { count: number; onConfirm: (reason: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState('')
  return (
    <div className="anim-fade fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onCancel}>
      <div className="anim-pop w-full max-w-md rounded-card bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-2xl font-bold text-ink">批次無法出貨</h3>
        <p className="mt-3 text-lg text-ink2">將把勾選的 {count} 筆訂單一併回報無法出貨，請選擇原因：</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {FAIL_REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`rounded border px-4 text-lg ${reason === r ? 'border-brand font-bold text-brand' : 'border-line text-ink'}`}
              style={{ minHeight: 56 }}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <BigButton variant="secondary" onClick={onCancel}>
            取消
          </BigButton>
          <BigButton variant="danger" disabled={!reason} onClick={() => onConfirm(reason)}>
            確定回報
          </BigButton>
        </div>
      </div>
    </div>
  )
}
