import { useEffect, useState } from 'react'
import type { Order } from '../types'
import { useStore } from '../store'
import OrderCard from './OrderCard'
import BigButton from './BigButton'
import ConfirmDialog from './ConfirmDialog'
import { EARLY_SHIP_WARNING } from '../utils/shipDate'

// 商品分區依「清洗後名稱」（variety→productName）
const productKey = (o: Order) => (o.variety && o.variety.trim()) || o.productName

// 大卡片底色依溫層（深色）：常溫=深綠、冷藏=深藍、冷凍=深藍(更深)
const TEMP_DARK_BG: Record<string, string> = { 常溫: '#1B4D2E', 冷藏: '#123A6B', 冷凍: '#172554' }
// 溫層文字（淺色、無框無底，顯示在深色大卡上）
const TEMP_LIGHT_TEXT: Record<string, string> = { 常溫: '#B7EB8F', 冷藏: '#91CAFF', 冷凍: '#ADC6FF' }

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
}

const EARLY_BTN = { minHeight: 48, background: '#C8D194', color: '#3A401A' } as const

export default function ProductGroupList({ orders, mode, earlyEligible, setNavLocked }: Props) {
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

  const batchLabel = mode === 'early' ? '批次提早印單' : '批次列印出貨單'
  const confirmLabel = mode === 'early' ? '提早列印勾選' : '列印勾選訂單'

  return (
    <div className="space-y-4">
      {groups.map((g) => {
        const active = batchProduct === g.product
        const otherActive = batchProduct !== null && !active
        const allSelected = active && g.orders.length > 0 && g.orders.every((o) => selected.has(o.id))
        const toggleAll = () => setSelected(allSelected ? new Set() : new Set(g.orders.map((o) => o.id)))
        const temps = [...new Set(g.orders.map((o) => o.tempLayer))]
        const cardBg = TEMP_DARK_BG[temps[0]] ?? '#2B2B26'

        return (
          <div key={g.product} className="rounded-card" style={{ background: cardBg }}>
            {/* 大卡片標題列：商品名 + 溫層 + 右上角批次按鈕 / 批次控制 */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-2xl font-bold text-white">{g.product}</span>
                {temps.map((t) => (
                  <span key={t} className="text-base font-bold" style={{ color: TEMP_LIGHT_TEXT[t] }}>
                    {t}
                  </span>
                ))}
                <span className="text-base" style={{ color: '#C9C7BE' }}>
                  {g.orders.length} 張 · {g.totalQty} 件
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {active ? (
                  <>
                    <span className="text-base" style={{ color: '#C9C7BE' }}>已勾選 {selected.size} 筆</span>
                    <BigButton size="md" variant="secondary" onClick={cancel}>
                      取消
                    </BigButton>
                    <BigButton size="md" variant="secondary" onClick={toggleAll}>
                      {allSelected ? '取消全選' : '全選'}
                    </BigButton>
                    {mode === 'early' ? (
                      <button
                        onClick={() => setConfirming(true)}
                        disabled={selected.size === 0}
                        className="rounded px-4 text-base font-bold disabled:opacity-40"
                        style={EARLY_BTN}
                      >
                        {confirmLabel}
                      </button>
                    ) : (
                      <BigButton size="md" disabled={selected.size === 0} onClick={() => setConfirming(true)}>
                        {confirmLabel}
                      </BigButton>
                    )}
                  </>
                ) : showBatch ? (
                  mode === 'early' ? (
                    <button
                      onClick={() => enter(g.product)}
                      disabled={otherActive}
                      className="rounded px-4 text-base font-bold disabled:opacity-40"
                      style={EARLY_BTN}
                    >
                      {batchLabel}
                    </button>
                  ) : (
                    <BigButton size="md" variant="secondary" onClick={() => enter(g.product)} disabled={otherActive}>
                      {batchLabel}
                    </BigButton>
                  )
                ) : null}
              </div>
            </div>

            {/* 小卡片：各規格 / 訂單明細 */}
            <div className="space-y-3 px-4 pb-4">
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
                />
              ))}
            </div>
          </div>
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
