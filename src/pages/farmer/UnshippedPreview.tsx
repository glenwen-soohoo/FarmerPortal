import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useStore } from '../../store'
import type { Order } from '../../types'
import { isInShippablePage, isInUpcomingPage, orderTimeTag, needsReprint } from '../../utils/shipDate'
import Tag, { type TagTone } from '../../components/Tag'
import type { FarmerOutletCtx } from './FarmerLayout'

// 清洗後的產品名（優先用 AI 清洗品種名 variety，退回原始 productName）
const productName = (o: Order) => (o.variety && o.variety.trim()) || o.productName

interface SpecRow {
  spec: string
  qty: number
  tags: { label: string; tone: TagTone }[]
}
interface ProductGroup {
  product: string
  specs: SpecRow[]
  total: number
}

// 依產品聚合，產品內再依規格加總數量；並收集該規格底下訂單的狀態標籤（時間相關 + 重印）
function groupByProduct(list: Order[], today: string): ProductGroup[] {
  const map = new Map<string, Map<string, { qty: number; tags: Map<string, TagTone> }>>()
  for (const o of list) {
    const p = productName(o)
    if (!map.has(p)) map.set(p, new Map())
    const specs = map.get(p)!
    if (!specs.has(o.spec)) specs.set(o.spec, { qty: 0, tags: new Map() })
    const s = specs.get(o.spec)!
    s.qty += o.qty
    const tt = orderTimeTag(o, today)
    // 總覽標籤精簡：去掉尾字「出貨」（指定今日出貨→指定今日、指定 06/13 出貨→指定 06/13）
    if (tt) s.tags.set(tt.label.replace(/\s*出貨$/, ''), tt.tone)
    if (needsReprint(o)) s.tags.set('重印', 'orange')
  }
  return [...map.entries()]
    .map(([product, specsMap]) => {
      const specs = [...specsMap.entries()].map(([spec, s]) => ({
        spec,
        qty: s.qty,
        tags: [...s.tags.entries()].map(([label, tone]) => ({ label, tone })),
      }))
      return { product, specs, total: specs.reduce((a, s) => a + s.qty, 0) }
    })
    .sort((a, b) => a.product.localeCompare(b.product))
}

function ProductCard({ g }: { g: ProductGroup }) {
  return (
    <div
      className="preview-card mx-auto w-2/3 rounded-card bg-white p-4"
      style={{ border: '1px solid #E5E1D8', boxShadow: '0 1px 3px rgba(43,43,38,0.06)' }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xl font-bold text-ink">{g.product}</span>
        <span className="text-base text-ink2">
          合計 <span className="text-xl font-bold text-brand">{g.total}</span>
        </span>
      </div>
      {/* 規格：分隔線 + 中間放狀態標籤 + 數量靠右 */}
      <div className="mt-2 space-y-1">
        {g.specs.map((s) => (
          <div key={s.spec} className="flex items-center gap-2 border-t border-line pt-1 text-base">
            <span className="shrink-0 text-ink2">{s.spec}</span>
            <span className="flex flex-1 flex-wrap items-center gap-1">
              {s.tags.map((t) => (
                <Tag key={t.label} tone={t.tone} size="sm">
                  {t.label}
                </Tag>
              ))}
            </span>
            <span className="shrink-0 whitespace-nowrap text-lg font-bold text-ink">× {s.qty}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Block({
  title,
  tone,
  groups,
  emptyMsg,
}: {
  title: string
  tone: 'shippable' | 'upcoming' | 'printed'
  groups: ProductGroup[]
  emptyMsg: string
}) {
  const totalQty = groups.reduce((a, g) => a + g.total, 0)
  const chipCls = tone === 'shippable' ? 'bg-brand' : tone === 'printed' ? 'bg-[#1E6FA8]' : 'bg-muted'
  return (
    <section>
      <div className="mb-3 flex items-baseline gap-3">
        <span className={`inline-block rounded px-3 py-1 text-lg font-bold text-white ${chipCls}`}>{title}</span>
        <span className="text-base text-ink2">
          {groups.length} 種產品 · 共 {totalQty} 件
        </span>
      </div>
      {groups.length === 0 ? (
        <div className="rounded-card border border-line bg-white px-4 py-8 text-center text-muted">{emptyMsg}</div>
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <ProductCard key={g.product} g={g} />
          ))}
        </div>
      )}
    </section>
  )
}

const MODES = [
  { key: 'normal', label: '一般' },
  { key: 'printed', label: '印單未出' },
] as const
type Mode = (typeof MODES)[number]['key']

export default function UnshippedPreview() {
  const { orders, currentFarmerId } = useStore()
  const { today } = useOutletContext<FarmerOutletCtx>()
  const [mode, setMode] = useState<Mode>('normal')

  const mine = orders.filter((o) => o.farmerId === currentFarmerId)
  const shippable = groupByProduct(mine.filter((o) => isInShippablePage(o, today)), today)
  const upcoming = groupByProduct(mine.filter((o) => isInUpcomingPage(o, today)), today)
  // 印單未出：農友已按印單、但黑貓尚未收走（仍是「已印單」，還沒變「已出貨」）
  const printed = groupByProduct(mine.filter((o) => o.shipStatus === '已印單'), today)

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {/* 模式切換：置中的左右 switch（方形分段，選中那段填色） */}
      <div className="flex justify-center">
        <div className="inline-flex rounded border-2 border-line bg-white p-0.5">
          {MODES.map((m) => {
            const active = mode === m.key
            return (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`rounded-sm px-6 py-1.5 text-base font-bold transition-colors ${
                  active ? 'bg-brand text-white' : 'text-ink2'
                }`}
              >
                {m.label}
              </button>
            )
          })}
        </div>
      </div>

      {mode === 'normal' ? (
        <>
          <p className="text-lg text-ink2">依產品彙總目前未出貨的訂單數量，方便一次備貨。</p>
          {/* 需出貨 / 出貨預告：桌機兩欄並排、手機單欄 */}
          <div className="preview-grid">
            <Block title="需出貨" tone="shippable" groups={shippable} emptyMsg="目前沒有需出貨的產品" />
            <Block title="出貨預告" tone="upcoming" groups={upcoming} emptyMsg="目前沒有預告中的產品" />
          </div>
        </>
      ) : (
        <>
          <p className="text-lg text-ink2">已按印單、但黑貓尚未收走（未出貨）的訂單，依產品彙總。</p>
          <Block title="印單未出" tone="printed" groups={printed} emptyMsg="目前沒有印單未出的訂單" />
        </>
      )}
    </div>
  )
}
