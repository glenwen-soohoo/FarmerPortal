import { useState, type ReactNode } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useStore } from '../../store'
import type { Order } from '../../types'
import { isInShippablePage, isInUpcomingPage, orderTimeTag, needsReprint, sortForFarmer } from '../../utils/shipDate'
import Tag, { type TagTone } from '../../components/Tag'
import ShippingListModal from '../../components/ShippingListModal'
import type { FarmerOutletCtx } from './FarmerLayout'

// 清洗後的產品名（優先用 AI 清洗品種名 variety，退回原始 productName）
const productName = (o: Order) => (o.variety && o.variety.trim()) || o.productName

// 從 printedAt 取出印單日 'MM/DD'（相容 'YYYY-MM-DD HH:mm' 與 toLocaleString 的 'YYYY/M/D …'）
function printMMDD(o: Order): string | undefined {
  const p = o.printedAt
  if (!p) return undefined
  let m = p.match(/\d{4}-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}/${m[2]}`
  m = p.match(/\d{4}\/(\d{1,2})\/(\d{1,2})/)
  if (m) return `${m[1].padStart(2, '0')}/${m[2].padStart(2, '0')}`
  return undefined
}

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
    // 總覽標籤精簡：去掉「客人」前綴與尾字「出貨」（客人指定今日出貨→指定今日、客人指定 06/13 出貨→指定 06/13）
    if (tt) s.tags.set(tt.label.replace(/^客人/, '').replace(/\s*出貨$/, ''), tt.tone)
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
  desc,
  action,
}: {
  title: string
  tone: 'shippable' | 'upcoming' | 'printed'
  groups: ProductGroup[]
  emptyMsg: string
  desc: ReactNode
  action?: ReactNode
}) {
  const totalQty = groups.reduce((a, g) => a + g.total, 0)
  // 標題用「左側小色條 + 純文字」的區段標題樣式（非填滿膠囊），避免被誤認為按鈕
  const barColor = tone === 'shippable' ? '#1F6E43' : tone === 'printed' ? '#1E6FA8' : '#8A877C'
  return (
    <section className="space-y-5">
      {/* 摘要區：無底色、無 padding，內容直接切齊容器邊界（寬度對齊下方產品卡），做成「非卡片」的標頭。
          彙總標題（+ 右側列印出貨總表）在上、說明文字在下 */}
      <div className="preview-card mx-auto w-2/3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="flex items-center gap-2">
            <span className="inline-block h-5 w-1.5 rounded-full" style={{ background: barColor }} />
            <span className="text-xl font-bold text-ink">{title}</span>
          </span>
          <span className="text-base text-ink2">
            {groups.length} 種產品 · 共 {totalQty} 件
          </span>
          {action && <span className="ml-auto">{action}</span>}
        </div>
        <p className="mt-3 text-base text-ink2">{desc}</p>
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
  { key: 'shippable', label: '需出貨' },
  { key: 'upcoming', label: '出貨預告' },
  { key: 'printed', label: '印單未出' },
] as const
type Mode = (typeof MODES)[number]['key']

export default function UnshippedPreview() {
  const { orders, currentFarmerId } = useStore()
  const { today } = useOutletContext<FarmerOutletCtx>()
  const [mode, setMode] = useState<Mode>('shippable')
  const [listOpen, setListOpen] = useState(false) // 出貨總表預覽疊層
  const [dayPickerOpen, setDayPickerOpen] = useState(false) // 印單日複選彈窗
  // 被取消勾選的印單日（空＝全部顯示）；用「排除集合」對切換農友、資料變動較穩健
  const [excludedDays, setExcludedDays] = useState<Set<string>>(new Set())

  const mine = orders.filter((o) => o.farmerId === currentFarmerId)
  // 需出貨：與「需出貨」頁同套排序（sortForFarmer），出貨總表沿用同一份清單
  const shippableOrders = sortForFarmer(mine.filter((o) => isInShippablePage(o, today)), today)
  const shippable = groupByProduct(shippableOrders, today)
  const upcoming = groupByProduct(mine.filter((o) => isInUpcomingPage(o, today)), today)
  // 印單未出：農友已按印單、但黑貓尚未收走（仍是「已印單」，還沒變「已出貨」）
  const allPrinted = mine.filter((o) => o.shipStatus === '已印單')
  // 印單日選項：有印單未出訂單的印單日（MM/DD），去重排序
  const printDayOptions = [...new Set(allPrinted.map(printMMDD).filter((d): d is string => !!d))].sort()
  // 依印單日篩選（被排除者不顯示；沒有印單日的一律保留）
  const printedOrders = allPrinted.filter((o) => {
    const d = printMMDD(o)
    return d ? !excludedDays.has(d) : true
  })
  const printed = groupByProduct(printedOrders, today)
  // 列印日標籤用今天（＝實際列印那天）
  const todayLabel = `${today.slice(5, 7)}/${today.slice(8, 10)}`

  // 列印出貨總表：需出貨→shippableOrders；印單未出→依印單日篩選後的 printedOrders；出貨預告→無
  const canPrintList = mode === 'shippable' || mode === 'printed'
  const listOrders = mode === 'shippable' ? shippableOrders : printedOrders
  // 目前顯示天數（供篩選按鈕標示 N/總數）
  const shownDayCount = printDayOptions.filter((d) => !excludedDays.has(d)).length
  const filtered = shownDayCount < printDayOptions.length

  const toggleDay = (d: string) =>
    setExcludedDays((prev) => {
      const next = new Set(prev)
      next.has(d) ? next.delete(d) : next.add(d)
      return next
    })

  // 列印出貨總表按鈕（放進小卡片右側；需出貨／印單未出才有）
  const printListBtn = canPrintList ? (
    <button
      onClick={() => setListOpen(true)}
      disabled={listOrders.length === 0}
      className="rounded bg-brand px-5 text-base font-bold text-white transition-colors disabled:opacity-40"
      style={{ minHeight: 44 }}
    >
      列印出貨總表
    </button>
  ) : undefined

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {/* 切換列：手機時篩選鈕落到第二行（置中）；平板／桌機時篩選鈕在切換鈕右側同一行。
          ≥sm 用三欄 grid（1fr｜切換鈕｜1fr）維持切換鈕置中、篩選鈕靠左貼在其右側 */}
      <div className="flex flex-col items-center gap-3 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-3">
        <div className="hidden sm:block" />
        <div className="inline-flex rounded border-2 border-line bg-white p-0.5 sm:justify-self-center">
          {MODES.map((m) => {
            const active = mode === m.key
            return (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`rounded-sm px-5 py-1.5 text-base font-bold transition-colors ${
                  active ? 'bg-brand text-white' : 'text-ink2'
                }`}
              >
                {m.label}
              </button>
            )
          })}
        </div>
        {mode === 'printed' && printDayOptions.length > 0 && (
          <div className="min-w-0 sm:justify-self-start">
            <button
              onClick={() => setDayPickerOpen(true)}
              className={`rounded border-2 px-4 py-1.5 text-base font-bold transition-colors ${
                filtered ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink2'
              }`}
              style={{ minHeight: 44 }}
            >
              印單日篩選{filtered ? `（勾選 ${shownDayCount} 日）` : ''}
            </button>
          </div>
        )}
      </div>

      {mode === 'shippable' && (
        <Block
          title="需出貨"
          tone="shippable"
          groups={shippable}
          emptyMsg="目前沒有需出貨的產品"
          desc="依產品彙總目前需出貨的訂單數量，方便一次備貨。"
          action={printListBtn}
        />
      )}
      {mode === 'upcoming' && (
        <Block
          title="出貨預告"
          tone="upcoming"
          groups={upcoming}
          emptyMsg="目前沒有預告中的產品"
          desc="還沒到出貨時間的訂單，先預告彙總，時間到了會移到「需出貨」。"
        />
      )}
      {mode === 'printed' && (
        <Block
          title="印單未出"
          tone="printed"
          groups={printed}
          emptyMsg="目前沒有印單未出的訂單"
          desc={
            <>
              已按印單、但黑貓尚未收走的訂單，依產品彙總。
              <br />
              當黑貓收貨並於黑貓系統切換貨態後，此處的未出單就會自動消失。
            </>
          }
          action={printListBtn}
        />
      )}

      {listOpen && (
        <ShippingListModal orders={listOrders} printLabel={todayLabel} onClose={() => setListOpen(false)} />
      )}

      {dayPickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(43,43,38,0.5)' }}
          onClick={() => setDayPickerOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-card bg-white p-6"
            style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.28)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-ink">印單日篩選</h3>
            <p className="mt-1 text-base text-ink2">勾選要顯示的印單日（可複選）</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setExcludedDays(new Set())}
                className="rounded border-2 border-line bg-white px-3 py-1 text-base font-bold text-ink2"
              >
                全選
              </button>
              <button
                onClick={() => setExcludedDays(new Set(printDayOptions))}
                className="rounded border-2 border-line bg-white px-3 py-1 text-base font-bold text-ink2"
              >
                取消全選
              </button>
            </div>
            <div className="mt-3 max-h-[50vh] space-y-2 overflow-y-auto">
              {printDayOptions.map((d) => {
                const checked = !excludedDays.has(d)
                const count = allPrinted.filter((o) => printMMDD(o) === d).length
                return (
                  <label
                    key={d}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3"
                    style={{ borderColor: checked ? '#1F6E43' : '#E5E1D8' }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDay(d)}
                      style={{ width: 20, height: 20, accentColor: '#1F6E43' }}
                    />
                    <span className="text-lg font-bold text-ink">{d}</span>
                    <span className="ml-auto text-base text-ink2">{count} 單</span>
                  </label>
                )
              })}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setDayPickerOpen(false)}
                className="rounded bg-brand px-6 text-base font-bold text-white"
                style={{ minHeight: 44 }}
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
