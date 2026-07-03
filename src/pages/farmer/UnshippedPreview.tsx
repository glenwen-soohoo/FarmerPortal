import { useOutletContext } from 'react-router-dom'
import { useStore } from '../../store'
import type { Order } from '../../types'
import { isInShippablePage, isInUpcomingPage } from '../../utils/shipDate'
import type { FarmerOutletCtx } from './FarmerLayout'

// 清洗後的產品名（優先用 AI 清洗品種名 variety，退回原始 productName）
const productName = (o: Order) => (o.variety && o.variety.trim()) || o.productName

interface SpecRow {
  spec: string
  qty: number
}
interface ProductGroup {
  product: string
  specs: SpecRow[]
  total: number
  orders: number
}

// 依產品聚合，產品內再依規格加總數量
function groupByProduct(list: Order[]): ProductGroup[] {
  const map = new Map<string, { specs: Map<string, number>; orders: number }>()
  for (const o of list) {
    const p = productName(o)
    if (!map.has(p)) map.set(p, { specs: new Map(), orders: 0 })
    const g = map.get(p)!
    g.specs.set(o.spec, (g.specs.get(o.spec) ?? 0) + o.qty)
    g.orders += 1
  }
  return [...map.entries()]
    .map(([product, g]) => {
      const specs = [...g.specs.entries()].map(([spec, qty]) => ({ spec, qty }))
      return { product, specs, total: specs.reduce((a, s) => a + s.qty, 0), orders: g.orders }
    })
    .sort((a, b) => a.product.localeCompare(b.product))
}

function ProductCard({ g }: { g: ProductGroup }) {
  return (
    <div
      className="rounded-card bg-white p-4"
      style={{ border: '1px solid #E5E1D8', boxShadow: '0 1px 3px rgba(43,43,38,0.06)' }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xl font-bold text-ink">{g.product}</span>
        <span className="text-base text-ink2">
          合計 <span className="text-xl font-bold text-brand">{g.total}</span>
        </span>
      </div>
      <div className="mt-3 space-y-1">
        {g.specs.map((s) => (
          <div key={s.spec} className="flex items-baseline justify-between border-t border-line pt-1 text-base">
            <span className="text-ink2">{s.spec}</span>
            <span className="text-lg font-bold text-ink">× {s.qty}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Block({
  title,
  accent,
  groups,
  emptyMsg,
}: {
  title: string
  accent: string
  groups: ProductGroup[]
  emptyMsg: string
}) {
  const totalQty = groups.reduce((a, g) => a + g.total, 0)
  return (
    <section>
      <div className="mb-3 flex items-baseline gap-3">
        <span className="inline-block rounded px-3 py-1 text-lg font-bold text-white" style={{ background: accent }}>
          {title}
        </span>
        <span className="text-base text-ink2">
          {groups.length} 種產品 · 共 {totalQty} 件
        </span>
      </div>
      {groups.length === 0 ? (
        <div className="rounded-card border border-line bg-white px-4 py-8 text-center text-muted">{emptyMsg}</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {groups.map((g) => (
            <ProductCard key={g.product} g={g} />
          ))}
        </div>
      )}
    </section>
  )
}

export default function UnshippedPreview() {
  const { orders, currentFarmerId } = useStore()
  const { today } = useOutletContext<FarmerOutletCtx>()

  const mine = orders.filter((o) => o.farmerId === currentFarmerId)
  const shippable = groupByProduct(mine.filter((o) => isInShippablePage(o, today)))
  const upcoming = groupByProduct(mine.filter((o) => isInUpcomingPage(o, today)))

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <p className="text-base text-ink2">依產品彙總目前未出貨的訂單數量，方便一次備貨。</p>

      {/* 上：可出貨 */}
      <Block title="可出貨" accent="#1F6E43" groups={shippable} emptyMsg="目前沒有可出貨的產品" />

      {/* 明顯的分隔 */}
      <div className="border-t-2 border-line" />

      {/* 下：出貨預告 */}
      <Block title="出貨預告" accent="#9E9E9E" groups={upcoming} emptyMsg="目前沒有預告中的產品" />
    </div>
  )
}
