import { useState } from 'react'
import type { Order } from '../types'
import { useStore } from '../store'
import ConfirmDialog from './ConfirmDialog'
import { EARLY_SHIP_WARNING } from '../utils/shipDate'

// 企業送禮專用密集卡片（需出貨／出貨預告）：
// 一張卡片＝同一企業＋同一水果；卡內再依「相同規格＋出貨區間＋備註（名片）」分子群。
// 子群一單一行（收件人／展開收件資訊／物流編號／印單）。
// 批次列印在【子群】層級：子群標頭「批次列印」勾選＝整個子群全選，各行「印單」切換成數量切換器。

const productKey = (o: Order) => (o.variety && o.variety.trim()) || o.productName
const cardKeyOf = (o: Order) => `${o.enterpriseName ?? ''}｜${productKey(o)}`
const subKeyOf = (o: Order) => `${o.spec}｜${o.shipWindow ? o.shipWindow.join('–') : ''}｜${o.farmerRemark || ''}`

interface SubGroup {
  fullKey: string
  spec: string
  window: string
  remark: string
  orders: Order[]
  qty: number
}
interface Card {
  key: string
  enterprise: string
  product: string
  orders: Order[]
  subs: SubGroup[]
  totalQty: number
  uniformSpec?: string // 整卡規格一致時帶入（子群標頭就不再重複顯示）
  uniformWindow?: string // 整卡出貨區間一致時帶入
}

function toCards(orders: Order[]): Card[] {
  const m = new Map<string, Order[]>()
  for (const o of orders) {
    const k = cardKeyOf(o)
    if (!m.has(k)) m.set(k, [])
    m.get(k)!.push(o)
  }
  return [...m.entries()].map(([key, os]) => {
    const sm = new Map<string, Order[]>()
    for (const o of os) {
      const sk = subKeyOf(o)
      if (!sm.has(sk)) sm.set(sk, [])
      sm.get(sk)!.push(o)
    }
    const subs: SubGroup[] = [...sm.entries()].map(([sk, sos]) => ({
      fullKey: `${key}¦${sk}`,
      spec: sos[0].spec,
      window: sos[0].shipWindow ? sos[0].shipWindow.join('–') : '',
      remark: sos[0].farmerRemark || '',
      orders: sos,
      qty: sos.reduce((a, b) => a + b.qty, 0),
    }))
    const specs = new Set(os.map((o) => o.spec))
    const wins = new Set(os.map((o) => (o.shipWindow ? o.shipWindow.join('–') : '')))
    return {
      key,
      enterprise: os[0].enterpriseName ?? '',
      product: productKey(os[0]),
      orders: os,
      subs,
      totalQty: os.reduce((a, b) => a + b.qty, 0),
      uniformSpec: specs.size === 1 ? [...specs][0] : undefined,
      uniformWindow: wins.size === 1 ? [...wins][0] : undefined,
    }
  })
}

interface Props {
  orders: Order[] // 已篩選（皆企業送禮）＋已排序
  mode: 'print' | 'early'
  earlyEligible?: boolean
  today?: string
}

export default function EnterpriseGroupList({ orders, mode, earlyEligible, today }: Props) {
  const { printOrder } = useStore()
  const cards = toCards(orders)

  const [openInfo, setOpenInfo] = useState<Set<string>>(new Set())
  const [batchSubs, setBatchSubs] = useState<Set<string>>(new Set()) // 進入批次的子群
  const [sel, setSel] = useState<Map<string, number>>(new Map()) // orderId → 份數
  const [confirmSub, setConfirmSub] = useState<SubGroup | null>(null)
  const [printing, setPrinting] = useState(false)

  const canBatch = mode === 'print' || !!earlyEligible
  const defaultQty = (o: Order) => Math.max(1, o.trackingNos?.length ?? 0) || 1

  const toggleInfo = (id: string) =>
    setOpenInfo((prev) => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

  // 子群「批次列印」勾選：整個子群全選（進批次）／取消（退批次）
  const toggleBatch = (sub: SubGroup) => {
    const on = batchSubs.has(sub.fullKey)
    setBatchSubs((prev) => {
      const n = new Set(prev)
      on ? n.delete(sub.fullKey) : n.add(sub.fullKey)
      return n
    })
    setSel((prev) => {
      const n = new Map(prev)
      if (on) sub.orders.forEach((o) => n.delete(o.id))
      else sub.orders.forEach((o) => n.set(o.id, defaultQty(o)))
      return n
    })
  }
  const rowToggle = (o: Order) =>
    setSel((prev) => {
      const n = new Map(prev)
      n.has(o.id) ? n.delete(o.id) : n.set(o.id, defaultQty(o))
      return n
    })
  const addQty = (id: string, d: number) =>
    setSel((prev) => {
      if (!prev.has(id)) return prev
      const n = new Map(prev)
      n.set(id, Math.max(1, (prev.get(id) ?? 1) + d))
      return n
    })

  const printIds = (ids: [string, number][]) => {
    setPrinting(true)
    window.setTimeout(() => {
      ids.forEach(([id, qty]) => printOrder(id, qty, today))
      setPrinting(false)
    }, 1200)
  }
  const printOne = (o: Order) => printIds([[o.id, 1]])
  const doPrintSub = (sub: SubGroup) => {
    setConfirmSub(null)
    const ids = sub.orders.filter((o) => sel.has(o.id)).map((o) => [o.id, sel.get(o.id) ?? 1] as [string, number])
    if (ids.length) printIds(ids)
    setBatchSubs((prev) => {
      const n = new Set(prev)
      n.delete(sub.fullKey)
      return n
    })
    setSel((prev) => {
      const n = new Map(prev)
      sub.orders.forEach((o) => n.delete(o.id))
      return n
    })
  }

  return (
    <div className="space-y-5">
      {cards.map((card) => (
        <section
          key={card.key}
          className="pg-section flex rounded-card border border-line bg-white"
          style={{ boxShadow: '0 1px 3px rgba(43,43,38,0.08)' }}
        >
          {/* 左側（白底）：企業名＝標籤（第二大）；品名／規格最大；出貨只有數字綠色 */}
          <aside className="oc-aside shrink-0 rounded-l-card border-r border-line bg-white">
            <div className="sticky top-0 p-4">
              <span className="inline-block rounded bg-mutedbg px-2 py-0.5 text-xl font-bold text-ink2">
                {card.enterprise}
              </span>
              <div className="mt-2 text-2xl font-bold leading-tight text-ink">{card.product}</div>
              {card.uniformSpec && <div className="mt-1 text-2xl font-bold text-ink">{card.uniformSpec}</div>}
              {card.uniformWindow && (
                <div className="mt-1 text-lg font-bold text-ink2">
                  出貨 <span className="text-brand">{card.uniformWindow}</span>
                </div>
              )}
              <div className="mt-2 text-base font-bold text-ink2">
                共 {card.orders.length} 單 · {card.totalQty} 件
              </div>
            </div>
          </aside>

          {/* 右側：依「規格／區間／備註」分子群，批次列印在子群層級 */}
          <div className="min-w-0 flex-1 space-y-3 overflow-hidden rounded-r-card bg-white p-3">
            {card.subs.map((sub) => {
              const inBatch = batchSubs.has(sub.fullKey)
              const selCount = sub.orders.filter((o) => sel.has(o.id)).length
              const selQty = sub.orders.reduce((a, o) => a + (sel.get(o.id) ?? 0), 0)
              return (
                <div key={sub.fullKey} className="overflow-hidden rounded-card border border-line bg-white">
                  {/* 子群標頭：以「備註（名片）」為主標；整卡一致的規格/區間不重複，只在子群不同時才標 */}
                  <div className="border-b border-line bg-mutedbg px-4 py-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-lg font-bold text-ink">{sub.remark || sub.spec}</span>
                      {!card.uniformSpec && <span className="text-sm text-ink2">{sub.spec}</span>}
                      {sub.window && !card.uniformWindow && <span className="text-sm text-ink2">出貨 {sub.window}</span>}
                      <span className="text-sm text-ink2">{sub.orders.length} 單 / {sub.qty} 件</span>
                      {canBatch && (
                        <label className="ml-auto flex cursor-pointer items-center gap-2 text-base font-bold text-ink">
                          <input
                            type="checkbox"
                            checked={inBatch}
                            onChange={() => toggleBatch(sub)}
                            style={{ width: 18, height: 18, accentColor: '#1F6E43' }}
                          />
                          批次列印
                        </label>
                      )}
                    </div>
                    {inBatch && (
                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-sm text-ink2">已勾選 {selCount} 筆 · {selQty} 張</span>
                        <button
                          disabled={selCount === 0}
                          onClick={() => setConfirmSub(sub)}
                          className="ml-auto rounded bg-brand px-5 text-base font-bold text-white transition-colors disabled:opacity-40 active:bg-brand-dark"
                          style={{ minHeight: 40 }}
                        >
                          {mode === 'early' ? '提早列印' : '列印'}勾選
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 一單一行 */}
                  <div className="divide-y divide-line">
                    {sub.orders.map((o) => {
                      const infoOpen = openInfo.has(o.id)
                      const selected = sel.has(o.id)
                      const nums = o.trackingNos ?? []
                      return (
                        <div key={o.id} className={`px-4 py-2.5 ${selected ? 'bg-brand/[0.04]' : ''}`}>
                          <div className="flex items-center gap-3">
                            {inBatch && (
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => rowToggle(o)}
                                style={{ width: 18, height: 18, accentColor: '#1F6E43' }}
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-lg font-bold text-ink">{o.recipient}</span>
                                <button
                                  onClick={() => toggleInfo(o.id)}
                                  className="shrink-0 text-sm font-medium text-brand"
                                >
                                  {infoOpen ? '收合 ▴' : '收件資訊 ▾'}
                                </button>
                              </div>
                              {infoOpen && (
                                <div className="mt-0.5 space-y-0.5 text-sm text-ink2">
                                  <div>{o.phone} · {o.address}</div>
                                  <div>訂單編號：{o.orderNumber}</div>
                                  {o.driverRemark && <div>給司機備註：{o.driverRemark}</div>}
                                </div>
                              )}
                            </div>
                            <span className="shrink-0 whitespace-nowrap text-base font-bold text-ink">×{o.qty}</span>
                            {nums.length ? (
                              <span className="hidden shrink-0 flex-col items-end gap-0.5 sm:flex" style={{ maxWidth: 170 }}>
                                {nums.map((t) => (
                                  <span key={t} className="rounded bg-mutedbg px-2 py-0.5 text-sm text-ink2">
                                    {t}
                                  </span>
                                ))}
                              </span>
                            ) : (
                              <span className="hidden shrink-0 text-sm text-muted sm:inline">尚未取號</span>
                            )}
                            <span className="shrink-0">
                              {inBatch && selected ? (
                                <span className="inline-flex items-center overflow-hidden rounded border-2 border-line">
                                  <button onClick={() => addQty(o.id, -1)} className="px-2.5 text-lg font-bold text-ink" style={{ minHeight: 36 }}>
                                    −
                                  </button>
                                  <span className="min-w-8 px-1 text-center text-lg font-bold text-ink">{sel.get(o.id) ?? 1}</span>
                                  <button onClick={() => addQty(o.id, 1)} className="px-2.5 text-lg font-bold text-ink" style={{ minHeight: 36 }}>
                                    ＋
                                  </button>
                                </span>
                              ) : inBatch ? (
                                <span className="text-sm text-muted">未勾選</span>
                              ) : (
                                <button
                                  onClick={() => printOne(o)}
                                  className="rounded bg-brand px-4 text-base font-bold text-white active:bg-brand-dark"
                                  style={{ minHeight: 36 }}
                                >
                                  印單
                                </button>
                              )}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}

      {confirmSub && (
        <ConfirmDialog
          title={mode === 'early' ? '提早印單' : '批次列印出貨單'}
          message={mode === 'early' ? EARLY_SHIP_WARNING : `確定要列印這個子群勾選的訂單嗎？`}
          confirmText={mode === 'early' ? '我了解，仍要提早印單' : '開始列印'}
          onConfirm={() => doPrintSub(confirmSub)}
          onCancel={() => setConfirmSub(null)}
        />
      )}

      {printing && (
        <div className="anim-fade fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(43,43,38,0.4)' }}>
          <div className="anim-pop rounded-card bg-white px-10 py-8 text-center">
            <p className="text-2xl font-bold text-ink">列印中…</p>
            <p className="mt-2 text-base text-ink2">請至印表機取單</p>
          </div>
        </div>
      )}
    </div>
  )
}
