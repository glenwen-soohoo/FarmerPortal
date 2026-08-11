import { useId, useMemo, useState, type ReactNode } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useStore } from '../../store'
import type { Order } from '../../types'
import { isInShippablePage, isInUpcomingPage, orderTimeTag, needsReprint, sortForFarmer } from '../../utils/shipDate'
import Tag, { type TagTone } from '../../components/Tag'
import { fetchSummaryPdf } from '../../api/shipments'
import { TimeoutError } from '../../api/client'
import { printPdfBlob } from '../../utils/print'
import { useDialog } from '../../components/useDialog'
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
    if (needsReprint(o)) s.tags.set('重印', 'changed')
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
      style={{ border: '1px solid var(--c-hairline)', boxShadow: 'var(--l1)' }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xl font-bold text-ink">{g.product}</span>
        <span className="text-base text-ink-sub">
          合計 <span className="text-xl font-bold text-act">{g.total}</span>
        </span>
      </div>
      {/* 規格：分隔線 + 中間放狀態標籤 + 數量靠右 */}
      <div className="mt-2 space-y-1">
        {g.specs.map((s) => (
          <div key={s.spec} className="flex items-center gap-2 border-t border-hairline pt-1 text-base">
            <span className="shrink-0 text-ink-sub">{s.spec}</span>
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
  // #8A877C 是色票明確汰換掉的值（在頁面底上只有 3.24:1，貼著非文字 3:1 門檻）→ 改 ink-faint（4.84:1）
  const barColor = tone === 'shippable' ? 'var(--c-act)' : tone === 'printed' ? 'var(--c-chill)' : 'var(--c-ink-faint)'
  return (
    <section className="space-y-5">
      {/* 摘要標頭：無底色、與下方白底產品卡分層；彙總標題（+ 右側列印出貨總表）在上、說明文字在下 */}
      <div className="preview-card mx-auto w-2/3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="flex items-center gap-2">
            {/* 膠囊,與訂單卡的 .oc-sev 同形狀——兩頁的色條不該一個方一個圓 */}
            <span className="inline-block h-5 w-1.5 rounded-full" style={{ background: barColor }} />
            <span className="text-xl font-bold text-ink">{title}</span>
          </span>
          <span className="text-base text-ink-sub">
            {groups.length} 種產品 · 共 {totalQty} 件
          </span>
          {action && <span className="ml-auto">{action}</span>}
        </div>
        <p className="mt-3 text-base text-ink-sub">{desc}</p>
      </div>
      {groups.length === 0 ? (
        <div className="rounded-card border border-hairline bg-white px-4 py-8 text-center text-ink-faint">{emptyMsg}</div>
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

/**
 * 列印出貨總表（F9 A7③／F10）彈窗：把「目前備貨總覽畫面顯示的所有未出訂單」出成 A4 PDF
 * （一品項＋規格一頁）→ 走與黑貓託運單相同的列印流程（WebView 殼原生列印 / 瀏覽器開新分頁）。
 * ⚠️ 不再選日期區間：總表就是把當下畫面的清單整份印出來（F10 定案），不另外挑日期。
 */
function SummaryPrintModal({ onClose }: { onClose: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const panelRef = useDialog(onClose)
  const titleId = `${useId()}-title`

  const doPrint = async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const pdf = await fetchSummaryPdf()
      await printPdfBlob(pdf)
      onClose()
    } catch (e) {
      // 超時（PRINT_TIMEOUT_MS）在這裡不需要特別的重試說明：總表只是讀資料出 PDF、不向黑貓取號，
      // 重按「列印出貨總表」不會有任何副作用。按鈕本身就是重試入口，所以不另外做一顆。
      setError(e instanceof TimeoutError ? '產生出貨總表等太久，請再按一次。' : e instanceof Error ? e.message : '列印出貨總表失敗')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'var(--scrim)' }}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-card bg-white p-6"
        style={{ boxShadow: 'var(--l3)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id={titleId} className="text-2xl font-bold text-ink">
          列印出貨總表
        </h3>
        <p className="mt-1 text-base text-ink-sub">將列印本畫面顯示的所有訂單詳細總表。</p>
        {error && <p className="mt-3 text-base font-medium text-urgent">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-full border-2 border-hairline bg-white px-6 text-base font-bold text-ink-sub"
            style={{ minHeight: 48 }}
          >
            取消
          </button>
          <button
            onClick={doPrint}
            disabled={busy}
            className="rounded-full bg-act px-6 text-base font-bold text-white disabled:border-hairline disabled:bg-inset disabled:text-ink-faint"
            style={{ minHeight: 48 }}
          >
            {busy ? '產生中…' : '列印出貨總表'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function UnshippedPreview() {
  const { orders, currentFarmerId } = useStore()
  const { today } = useOutletContext<FarmerOutletCtx>()
  const [mode, setMode] = useState<Mode>('shippable')
  const [listOpen, setListOpen] = useState(false) // 列印出貨總表彈窗（接後端 PDF）
  const [dayPickerOpen, setDayPickerOpen] = useState(false) // 印單日複選彈窗
  // 被取消勾選的印單日（空＝全部顯示）；用「排除集合」對切換農友、資料變動較穩健
  const [excludedDays, setExcludedDays] = useState<Set<string>>(new Set())

  // ── 以下衍生值全部 memo ──
  // 原本每次 render 都重跑：一次 filter + sortForFarmer + 三次 groupByProduct。
  // 這頁的 state（mode / listOpen / dayPickerOpen / excludedDays）與 context 變動都會觸發 render，
  // 而 sortForFarmer 實測 n=300 為 7.97ms（桌機）／平板約 30–60ms。
  // 依賴刻意分層：只有 excludedDays 變時才重算 printed，切 mode 不重算任何彙總。
  const mine = useMemo(() => orders.filter((o) => o.farmerId === currentFarmerId), [orders, currentFarmerId])
  // 需出貨：與「需出貨」頁同套排序（sortForFarmer）
  const shippableOrders = useMemo(
    () => sortForFarmer(mine.filter((o) => isInShippablePage(o, today)), today),
    [mine, today]
  )
  const shippable = useMemo(() => groupByProduct(shippableOrders, today), [shippableOrders, today])
  const upcoming = useMemo(
    () => groupByProduct(mine.filter((o) => isInUpcomingPage(o, today)), today),
    [mine, today]
  )
  // 印單未出：農友已按印單、但黑貓尚未收走（仍是「已印單」，還沒變「已出貨」）
  const allPrinted = useMemo(() => mine.filter((o) => o.shipStatus === '已印單'), [mine])
  // 印單日選項：有印單未出訂單的印單日（MM/DD），去重排序
  const printDayOptions = useMemo(
    () => [...new Set(allPrinted.map(printMMDD).filter((d): d is string => !!d))].sort(),
    [allPrinted]
  )
  // 依印單日篩選（被排除者不顯示；沒有印單日的一律保留）
  const printedOrders = useMemo(
    () =>
      allPrinted.filter((o) => {
        const d = printMMDD(o)
        return d ? !excludedDays.has(d) : true
      }),
    [allPrinted, excludedDays]
  )
  const printed = useMemo(() => groupByProduct(printedOrders, today), [printedOrders, today])

  // 列印出貨總表：需出貨／印單未出才提供
  const canPrintList = mode === 'shippable' || mode === 'printed'
  // 目前顯示天數（供篩選按鈕標示 N/總數）
  const shownDayCount = printDayOptions.filter((d) => !excludedDays.has(d)).length
  const filtered = shownDayCount < printDayOptions.length

  const toggleDay = (d: string) =>
    setExcludedDays((prev) => {
      const next = new Set(prev)
      next.has(d) ? next.delete(d) : next.add(d)
      return next
    })

  // 列印出貨總表按鈕（放進標頭右側；需出貨／印單未出才有）。按下開日期區間彈窗→後端 A4 PDF。
  const printListBtn = canPrintList ? (
    <button
      onClick={() => setListOpen(true)}
      className="rounded-full bg-act px-5 text-base font-bold text-white transition-colors"
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
        {/* 同心圓角：外框與內層都用 rounded-full，靠 p-0.5 自動產生正確的半徑差。
            外框半徑 = 外高/2，內層半徑 = (外高−4)/2 = 外框半徑 − 2px ＝ 剛好等於 padding。
            ⚠️ 內層一定要跟著外框走膠囊。原本是 `rounded-md`（6px，搭配舊的 8px 外框），
            外框改膠囊之後兩者不再同心，選中的色塊在軌道兩端會露出月牙形的空隙。 */}
        <div className="inline-flex rounded-full border-2 border-hairline bg-white p-0.5 sm:justify-self-center">
          {MODES.map((m) => {
            const active = mode === m.key
            return (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                aria-pressed={active}
                /* tap44：軌道式分段控制的視覺高度刻意收斂（再高會撐開整條軌道），可點區撐到 44 */
                className={`tap44 rounded-full px-5 py-1.5 text-base font-bold transition-colors ${
                  active ? 'bg-act text-white' : 'text-ink-sub'
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
              className={`rounded-full border-2 px-4 py-1.5 text-base font-bold transition-colors ${
                filtered ? 'border-act bg-act text-white' : 'border-hairline bg-white text-ink-sub'
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
          desc="目前所有可出訂單，相同規格放一起看總量。"
          action={printListBtn}
        />
      )}
      {mode === 'upcoming' && (
        <Block
          title="出貨預告"
          tone="upcoming"
          groups={upcoming}
          emptyMsg="目前沒有預告中的產品"
          desc="目前還不能出的訂單，相同規格放一起看總量。"
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
              已經印單、但黑貓尚未收走的訂單，相同規格放一起看總量。
              <br />
              當黑貓收到貨，並在他們的系統切換貨態後才會消失。
            </>
          }
          action={printListBtn}
        />
      )}

      {listOpen && <SummaryPrintModal onClose={() => setListOpen(false)} />}

      {/* 抽成元件是為了讓 useDialog 隨彈窗開關掛載／卸載（hook 不能寫在 `dayPickerOpen &&` 裡）。
          列的計算留在這裡，因為 excludedDays / allPrinted 都是本頁的狀態。 */}
      {dayPickerOpen && (
        <DayFilterModal
          rows={printDayOptions.map((d) => ({
            day: d,
            checked: !excludedDays.has(d),
            count: allPrinted.filter((o) => printMMDD(o) === d).length,
          }))}
          onToggle={toggleDay}
          onSelectAll={() => setExcludedDays(new Set())}
          onClearAll={() => setExcludedDays(new Set(printDayOptions))}
          onClose={() => setDayPickerOpen(false)}
        />
      )}
    </div>
  )
}

function DayFilterModal({
  rows,
  onToggle,
  onSelectAll,
  onClearAll,
  onClose,
}: {
  rows: { day: string; checked: boolean; count: number }[]
  onToggle: (day: string) => void
  onSelectAll: () => void
  onClearAll: () => void
  onClose: () => void
}) {
  const panelRef = useDialog(onClose)
  const titleId = `${useId()}-title`
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'var(--scrim)' }}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-card bg-white p-6"
        style={{ boxShadow: 'var(--l3)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id={titleId} className="text-2xl font-bold text-ink">
          印單日篩選
        </h3>
        <p className="mt-1 text-base text-ink-sub">勾選要顯示的印單日（可複選）</p>
        <div className="mt-3 flex gap-2">
          {/* tap44：這兩顆視覺上是輕量小鈕（py-1 約 32px），可點區撐到 44 */}
          <button onClick={onSelectAll} className="tap44 rounded-full border-2 border-hairline bg-white px-3 py-1 text-base font-bold text-ink-sub">
            全選
          </button>
          <button onClick={onClearAll} className="tap44 rounded-full border-2 border-hairline bg-white px-3 py-1 text-base font-bold text-ink-sub">
            取消全選
          </button>
        </div>
        <div className="mt-3 max-h-[50vh] space-y-2 overflow-y-auto">
          {rows.map((r) => (
            <label
              key={r.day}
              className="flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3"
              style={{ borderColor: r.checked ? 'var(--c-act)' : 'var(--c-hairline)' }}
            >
              <input
                type="checkbox"
                checked={r.checked}
                onChange={() => onToggle(r.day)}
                style={{ width: 20, height: 20, accentColor: 'var(--c-act)' }}
              />
              <span className="text-lg font-bold text-ink">{r.day}</span>
              <span className="ml-auto text-base text-ink-sub">{r.count} 單</span>
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="rounded-full bg-act px-6 text-base font-bold text-white" style={{ minHeight: 44 }}>
            完成
          </button>
        </div>
      </div>
    </div>
  )
}
