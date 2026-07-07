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
  const { printOrder } = useStore()
  const groups = toGroups(orders)

  // 批次只能針對「同一商品」→ 用 batchProduct 鎖定目前批次的商品
  const [batchProduct, setBatchProduct] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirming, setConfirming] = useState(false)
  const [printing, setPrinting] = useState(false)

  useEffect(() => {
    setNavLocked(batchProduct !== null)
    return () => setNavLocked(false)
  }, [batchProduct, setNavLocked])

  const showBatch = mode === 'print' || !!earlyEligible
  const enter = (p: string) => {
    setBatchProduct(p)
    setSelected(new Set())
  }
  const cancel = () => {
    setBatchProduct(null)
    setSelected(new Set())
  }
  const toggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  const doPrint = () => {
    setConfirming(false)
    setPrinting(true)
    const ids = [...selected]
    window.setTimeout(() => {
      ids.forEach((id) => printOrder(id))
      setPrinting(false)
      cancel()
    }, 1600)
  }

  const batchLabel = mode === 'early' ? '批次提早印單' : '批次列印'
  const confirmLabel = mode === 'early' ? '提早列印勾選' : '列印勾選'

  return (
    <div className="space-y-6">
      {groups.map((g) => {
        const active = batchProduct === g.product
        const otherActive = batchProduct !== null && !active
        const allSelected = active && g.orders.length > 0 && g.orders.every((o) => selected.has(o.id))
        const toggleAll = () => setSelected(allSelected ? new Set() : new Set(g.orders.map((o) => o.id)))
        const temps = [...new Set(g.orders.map((o) => o.tempLayer))]

        return (
          <section
            key={g.product}
            className={`flex rounded-card border bg-white ${active ? 'border-brand' : 'border-line'}`}
            style={{ borderWidth: active ? 2 : 1, boxShadow: '0 1px 3px rgba(43,43,38,0.08)' }}
          >
            {/* 左側：白底商品欄（撐滿群組高度標示分組；商品名 sticky，捲動仍看得到） */}
            <aside className="w-[264px] shrink-0 rounded-l-card border-r border-line bg-white">
              <div className="sticky top-0 p-4">
                <div className="text-3xl font-bold leading-tight text-ink">{g.product}</div>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                  {temps.map((t) => (
                    <TempLayerTag key={t} layer={t} />
                  ))}
                </div>
                <div className="mt-1 text-base text-ink2">
                  {g.orders.length} 張 · {g.totalQty} 件
                </div>

                {/* 批次控制：非批次時一顆次級鈕；進批次才展開 */}
                <div className="mt-3 flex flex-col gap-2">
                  {active ? (
                  <>
                    <span className="text-base text-ink2">已勾選 {selected.size} 筆</span>
                    <BigButton size="md" disabled={selected.size === 0} onClick={() => setConfirming(true)}>
                      {confirmLabel}
                    </BigButton>
                    <BigButton size="md" variant="secondary" onClick={toggleAll}>
                      {allSelected ? '取消全選' : '全選'}
                    </BigButton>
                    <BigButton size="md" variant="secondary" onClick={cancel}>
                      取消
                    </BigButton>
                  </>
                ) : showBatch ? (
                  <BigButton size="md" variant="secondary" onClick={() => enter(g.product)} disabled={otherActive}>
                    {batchLabel}
                  </BigButton>
                  ) : null}
                </div>
              </div>
            </aside>

            {/* 右側：該商品的訂單列（用分隔線區隔，特殊狀態才上底色） */}
            <div className="min-w-0 flex-1 divide-y divide-line overflow-hidden rounded-r-card">
              {g.orders.map((o) => (
                <OrderCard
                  key={o.id}
                  order={o}
                  hideProduct
                  upcoming={mode === 'early'}
                  earlyEligible={earlyEligible}
                  selectable={active}
                  selected={selected.has(o.id)}
                  onToggleSelect={() => toggle(o.id)}
                  today={today}
                />
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
              ? `${EARLY_SHIP_WARNING}（本次共 ${selected.size} 筆）`
              : `確定要列印勾選的 ${selected.size} 筆出貨單嗎？`
          }
          confirmText={mode === 'early' ? '我了解，仍要提早印單' : '開始列印'}
          onConfirm={doPrint}
          onCancel={() => setConfirming(false)}
        />
      )}

      {printing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(43,43,38,0.4)' }}>
          <div className="rounded-card bg-white px-10 py-8 text-center">
            <p className="text-2xl font-bold text-ink">{mode === 'early' ? '提早列印中…' : '批次列印中…'}</p>
            <p className="mt-2 text-base text-ink2">請至印表機取單（共 {selected.size} 張）</p>
          </div>
        </div>
      )}
    </div>
  )
}
