import { useEffect, useState } from 'react'
import type { Order } from '../types'
import { useStore } from '../store'
import ConfirmDialog from './ConfirmDialog'
import OrderNo from './OrderNo'
import QtyInput from './QtyInput'
import { EARLY_SHIP_WARNING, shipWindowText } from '../utils/shipDate'
import { productKey } from '../utils/product'

// 企業送禮專用密集卡片（需出貨／出貨預告）：
// 一張卡片＝同一企業＋同一水果；卡內再依「相同規格＋出貨區間＋作業指示（名片/配送/指定日）」分子群。
// 子群一單一行（收件人／展開收件資訊／物流編號／印單）。
// 批次列印在【子群】層級：子群標頭「批次列印」勾選＝整個子群全選，各行「印單」切換成數量切換器。

// ⚠️ productKey 走 utils/product.ts：需出貨頁的品項篩選用的是同一把 key，不可各自定義。
const cardKeyOf = (o: Order) => `${o.enterpriseName ?? ''}｜${productKey(o)}`
// 子群 key 納入 名片(farmerRemark)＋配送(driverRemark)＋指定日(forcedShipDate)：
// 一個子群＝農友一次作業的單位（一起印、貼同一種名片、同一組配送指示），
// 所以作業指示只要有一項不同就得分群，否則會把 A 的名片貼到 B 的箱子。
const subKeyOf = (o: Order) =>
  `${o.spec}｜${shipWindowText(o.shipWindow)}｜${o.farmerRemark || ''}｜${o.driverRemark || ''}｜${o.forcedShipDate || ''}`

interface SubGroup {
  fullKey: string
  spec: string
  window: string
  remark: string // farmerRemark（名片/包裝）
  driverRemark: string // 配送指示（代收/時段…）
  forcedShipDate: string // 指定出貨日 MM/DD
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

// 子群標頭要讓農友一眼看出「這一疊怎麼作業」，所以作業指示優先於規格：
// 名片＋指定日＋（配送指示）串成一句；三者皆無時才退回規格當識別。
function subHeaderText(sub: SubGroup): string {
  const parts: string[] = []
  if (sub.remark) parts.push(sub.remark)
  if (sub.forcedShipDate) parts.push(`指定 ${sub.forcedShipDate} 出貨`)
  if (sub.driverRemark) parts.push(`（${sub.driverRemark}）`)
  return parts.join(' ') || sub.spec
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
      window: shipWindowText(sos[0].shipWindow),
      remark: sos[0].farmerRemark || '',
      driverRemark: sos[0].driverRemark || '',
      forcedShipDate: sos[0].forcedShipDate || '',
      orders: sos,
      qty: sos.reduce((a, b) => a + b.qty, 0),
    }))
    const specs = new Set(os.map((o) => o.spec))
    const wins = new Set(os.map((o) => shipWindowText(o.shipWindow)))
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
  setNavLocked?: (v: boolean) => void // 批次進行中鎖底部分頁＋讓 FarmerLayout 蓋遮罩（比照一般訂單）
  today?: string // 保留供呼叫端相容（本元件印單走 store，不再需要）
}

export default function EnterpriseGroupList({ orders, mode, earlyEligible, setNavLocked }: Props) {
  const { printOrder, printOrders, reprintOrder } = useStore()
  const cards = toCards(orders)

  const [openInfo, setOpenInfo] = useState<Set<string>>(new Set())
  const [batchSub, setBatchSub] = useState<string | null>(null) // 目前進入批次的「單一」子群（比照一般訂單：一次只能一組）
  const [sel, setSel] = useState<Map<string, number>>(new Map()) // orderId → 份數
  const [confirmSub, setConfirmSub] = useState<SubGroup | null>(null)
  const [printTarget, setPrintTarget] = useState<Order | null>(null) // 單筆印單：選張數彈窗
  const [printQty, setPrintQty] = useState(1)

  const canBatch = mode === 'print' || !!earlyEligible
  const defaultQty = (o: Order) => Math.max(1, o.trackingNos?.length ?? 0) || 1

  // 批次進行中 → 鎖底部分頁＋FarmerLayout 蓋遮罩（作用中的子群卡片會自己 z-40 浮出遮罩之上）
  useEffect(() => {
    setNavLocked?.(batchSub !== null)
    return () => setNavLocked?.(false)
  }, [batchSub, setNavLocked])

  const toggleInfo = (id: string) =>
    setOpenInfo((prev) => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

  // 進入批次（整個子群預設全選、帶預設份數）；一次只能一組（single active）。
  const enterBatch = (sub: SubGroup) => {
    setBatchSub(sub.fullKey)
    setSel(() => {
      const n = new Map<string, number>()
      sub.orders.forEach((o) => n.set(o.id, defaultQty(o)))
      return n
    })
  }
  const exitBatch = () => {
    setBatchSub(null)
    setSel(new Map())
  }
  const toggleAll = (sub: SubGroup) =>
    setSel((prev) => {
      if (sub.orders.every((o) => prev.has(o.id))) return new Map() // 全選中→取消全選（仍在批次）
      const n = new Map<string, number>()
      sub.orders.forEach((o) => n.set(o.id, prev.get(o.id) ?? defaultQty(o)))
      return n
    })
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
  // 直接鍵入份數（例如 50 箱，不必按 49 次＋）
  const setQty = (id: string, value: number) =>
    setSel((prev) => {
      if (!prev.has(id)) return prev
      const n = new Map(prev)
      n.set(id, Math.max(1, value))
      return n
    })

  // 批次合併成一份 PDF、只列印一次（避免多分頁被彈窗擋，比照 ProductGroupList）。
  // ⚠️ 帶各單份數 qtyById：印超過既有號會追加（store.printOrders 處理）——原本漏傳、每單只印 1 張。
  const doPrintSub = (sub: SubGroup) => {
    setConfirmSub(null)
    const ids = sub.orders.filter((o) => sel.has(o.id)).map((o) => o.id)
    const qty = new Map<string, number>()
    ids.forEach((id) => qty.set(id, sel.get(id) ?? 1))
    const total = [...qty.values()].reduce((a, b) => a + b, 0)
    if (ids.length) void printOrders(ids, qty, { title: '列印中…', detail: `向黑貓取號中，共 ${total} 張，請稍候` })
    exitBatch()
  }
  // 單筆印單：開「選印幾張」彈窗（比照一般 OrderCard；大量單農友自己選、分裝自行判斷）。
  const openPrintOne = (o: Order) => {
    setPrintQty(1)
    setPrintTarget(o)
  }
  const doPrintOne = () => {
    const o = printTarget
    if (!o) return
    setPrintTarget(null)
    void printOrder(o.id, printQty)
  }

  return (
    <div className="space-y-5">
      {cards.map((card) => {
        // 這張企業卡是否有子群正在批次 → 讓品名表頭一起浮出遮罩之上（否則品名被 scrim 壓暗）
        const cardHasBatch = batchSub !== null && card.subs.some((s) => s.fullKey === batchSub)
        return (
        <section key={card.key} className="pg-grp">
          {/* 頂部表頭（原左側 aside 移到上面，比照一般訂單）：企業名（標籤）＋品名＋規格＋數量＋出貨日。
              沿用 .pg-gh／.pg-nm／.pg-mt，與一般訂單的商品表頭同一套（吸頂、上下細線分隔）。
              批次時本卡表頭 z-40 浮出遮罩、品名保持亮。 */}
          <div className="pg-gh" style={cardHasBatch ? { zIndex: 40 } : undefined}>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="inline-block rounded-full bg-inset px-2 py-0.5 text-base font-bold text-ink-sub">
                  {card.enterprise}
                </span>
                <span className="pg-nm text-ink">{card.product}</span>
                {card.uniformSpec && <span className="text-lg font-bold text-ink">{card.uniformSpec}</span>}
              </div>
              {/* 數量在前、出貨區間在後；日期稍微加大＋粗體黑字（0805 回饋） */}
              <div className="pg-mt mt-0.5 text-ink-faint">
                共 {card.orders.length} 單 · {card.totalQty} 件
                {card.uniformWindow && (
                  <> · 出貨 <span className="text-base font-bold text-ink">{card.uniformWindow}</span></>
                )}
              </div>
            </div>
          </div>

          {/* 子群：撐滿容器寬度（原本擠在右半部）；個別卡片維持原樣 */}
          <div className="space-y-3">
            {card.subs.map((sub) => {
              const inBatch = batchSub === sub.fullKey
              const otherBatchActive = batchSub !== null && !inBatch // 有別的子群在批次 → 這組鎖住
              const selCount = sub.orders.filter((o) => sel.has(o.id)).length
              const selQty = sub.orders.reduce((a, o) => a + (sel.get(o.id) ?? 0), 0)
              const allSel = sub.orders.length > 0 && sub.orders.every((o) => sel.has(o.id))
              return (
                <div
                  key={sub.fullKey}
                  className="overflow-hidden rounded-card border border-hairline bg-white"
                  /* 作用中的子群浮到遮罩（FarmerLayout 的 z-30 scrim）之上，其餘被遮罩蓋住＝鎖住 */
                  style={inBatch ? { position: 'relative', zIndex: 40 } : undefined}
                >
                  {/* 規格與出貨區間在整卡一致時不逐群重印，否則同一張卡每個子群都在講同一件事 */}
                  <div className="border-b border-hairline bg-white px-4 py-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      {/* 備註（名片/作業指示）改白底＋底線，與一般訂單的「出貨提醒」同一種強調 */}
                      <span
                        className="text-lg font-bold text-ink"
                        style={{
                          textDecorationLine: 'underline',
                          textDecorationColor: 'var(--c-tint-notice)',
                          textDecorationThickness: '3px',
                          textUnderlineOffset: '3px',
                        }}
                      >
                        {subHeaderText(sub)}
                      </span>
                      {!card.uniformSpec && <span className="text-sm text-ink-sub">{sub.spec}</span>}
                      {sub.window && !card.uniformWindow && <span className="text-sm text-ink-sub">出貨 {sub.window}</span>}
                      <span className="text-sm text-ink-sub">{sub.orders.length} 單 / {sub.qty} 件</span>
                      {/* 批次列印＝白底邊框按鈕（非勾選）；別的子群在批次時鎖住不可進（一次只能一組） */}
                      {canBatch && !inBatch && (
                        <button
                          onClick={() => enterBatch(sub)}
                          disabled={otherBatchActive}
                          className="ml-auto rounded-full border-2 border-hairline bg-white px-5 text-base font-bold text-ink-sub disabled:opacity-40"
                          style={{ minHeight: 'max(2.75rem, 44px)' }}
                        >
                          批次列印
                        </button>
                      )}
                      {/* 批次中：「已勾選 N 筆 · N 張」放在原批次列印按鈕位置、與「N 單/M 件」同一行 */}
                      {inBatch && (
                        <span className="ml-auto text-sm font-bold text-act">已勾選 {selCount} 筆 · {selQty} 張</span>
                      )}
                    </div>
                    {inBatch && (
                      <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                        <button
                          onClick={() => toggleAll(sub)}
                          className="rounded-full border-2 border-hairline bg-white px-4 text-sm font-bold text-ink-sub"
                          style={{ minHeight: 'max(2.75rem, 44px)' }}
                        >
                          {allSel ? '取消全選' : '全選'}
                        </button>
                        <button
                          onClick={exitBatch}
                          className="rounded-full border-2 border-hairline bg-white px-4 text-sm font-bold text-ink-sub"
                          style={{ minHeight: 'max(2.75rem, 44px)' }}
                        >
                          取消批次
                        </button>
                        <button
                          disabled={selCount === 0}
                          onClick={() => setConfirmSub(sub)}
                          className="rounded-full bg-act px-5 text-sm font-bold text-white transition-colors disabled:border-hairline disabled:bg-inset disabled:text-ink-faint active:bg-act-deep"
                          style={{ minHeight: 'max(2.75rem, 44px)' }}
                        >
                          {mode === 'early' ? '提早列印' : '列印'}勾選
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 一單一行 */}
                  <div className="divide-y divide-hairline">
                    {sub.orders.map((o) => {
                      const infoOpen = openInfo.has(o.id)
                      const selected = sel.has(o.id)
                      const nums = o.trackingNos ?? []
                      const printed = o.shipStatus === '已印單' // 印過→按鈕改「重印」（比照一般訂單）
                      return (
                        <div key={o.id} className={`px-4 py-2.5 ${selected ? 'bg-act/[0.04]' : ''}`}>
                          <div className="flex items-center gap-3">
                            {inBatch && (
                              /* 包一層 label 才撐得起可點區（checkbox 是 replaced element、不渲染 ::after）。
                                 這顆是整列唯一的勾選入口——該列本身沒有 onClick——原本只有 18×18。
                                 順帶補 aria-label：裸 checkbox 沒有可及名稱，讀屏只會唸「核取方塊」。 */
                              <label className="tap44 flex shrink-0 cursor-pointer items-center">
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() => rowToggle(o)}
                                  aria-label={`勾選 ${o.recipient}`}
                                  style={{ width: 18, height: 18, accentColor: 'var(--c-act)' }}
                                />
                              </label>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-lg font-bold text-ink">{o.recipient}</span>
                                <button
                                  onClick={() => toggleInfo(o.id)}
                                  aria-expanded={infoOpen}
                                  className="shrink-0 px-1 text-sm font-medium text-act"
                                  style={{ minHeight: 'max(2.75rem, 44px)' }}
                                >
                                  {infoOpen ? '收合 ▴' : '收件資訊 ▾'}
                                </button>
                              </div>
                              {infoOpen && (
                                <div className="mt-0.5 space-y-0.5 text-sm text-ink-sub">
                                  <div>{o.phone} · {o.address}</div>
                                  <div>訂單編號：<OrderNo value={o.orderNumber} /></div>
                                  {/* 物流編號一律放收合區（窄版列上放不下）：一號一行，多號時第一個標「主要編號」，沒號標「尚無單號」 */}
                                  <div className="flex flex-wrap items-baseline gap-x-1">
                                    <span>物流編號：</span>
                                    {nums.length ? (
                                      <span className="inline-flex flex-col gap-y-0.5">
                                        {nums.map((t, i) => (
                                          <span key={t} className="inline-flex items-baseline gap-x-1">
                                            <OrderNo value={t} />
                                            {i === 0 && nums.length > 1 && (
                                              <span className="rounded bg-act/10 px-1 text-xs font-bold text-act">主要編號</span>
                                            )}
                                          </span>
                                        ))}
                                      </span>
                                    ) : (
                                      <span className="text-ink-faint/60">尚無單號</span>
                                    )}
                                  </div>
                                  {o.driverRemark && <div>配送提醒：{o.driverRemark}</div>}
                                </div>
                              )}
                            </div>
                            <span className="shrink-0 whitespace-nowrap text-base font-bold text-ink">×{o.qty}</span>
                            {nums.length ? (
                              <span className="hidden shrink-0 flex-col items-end gap-0.5 min-[560px]:flex" style={{ maxWidth: 170 }}>
                                {/* 3 張以上只列第一張＋…＋最後一張，末行補「共 N 張」，避免一長串佔滿列 */}
                                {(nums.length <= 2 ? nums : [nums[0], nums[nums.length - 1]]).map((t, i) => (
                                  <span key={t} className="inline-flex flex-col items-end">
                                    {nums.length > 2 && i === 1 && <span className="leading-none text-ink-faint">⋯</span>}
                                    {/* 列表上只留末四碼（溝通都念後四碼）；完整號在展開的收件資訊區 */}
                                    <span className="rounded-full bg-inset px-2 py-0.5 text-sm font-bold text-ink">
                                      {t.slice(-4)}
                                    </span>
                                  </span>
                                ))}
                                {nums.length >= 3 && <span className="text-xs text-ink-sub">共 {nums.length} 張</span>}
                              </span>
                            ) : (
                              <span className="hidden shrink-0 text-sm text-ink-faint/60 min-[560px]:inline">尚無單號</span>
                            )}
                            <span className="shrink-0">
                              {inBatch && selected ? (
                                <span className="inline-flex items-center overflow-hidden rounded-full border-2 border-hairline">
                                  <button onClick={() => addQty(o.id, -1)} className="px-2.5 text-lg font-bold text-ink" style={{ minHeight: 'max(2.75rem, 44px)' }} aria-label="減少份數">
                                    −
                                  </button>
                                  {/* 可直接鍵入份數（例如 50），可清空再輸入，不必狂按＋ */}
                                  <QtyInput
                                    value={sel.get(o.id) ?? 1}
                                    onChange={(n) => setQty(o.id, n)}
                                    className="w-12 border-x-2 border-hairline text-center text-lg font-bold text-ink"
                                    style={{ minHeight: 'max(2.75rem, 44px)' }}
                                    ariaLabel="份數"
                                  />
                                  <button onClick={() => addQty(o.id, 1)} className="px-2.5 text-lg font-bold text-ink" style={{ minHeight: 'max(2.75rem, 44px)' }} aria-label="增加份數">
                                    ＋
                                  </button>
                                </span>
                              ) : inBatch ? (
                                <span className="text-sm text-ink-faint">未勾選</span>
                              ) : printed ? (
                                // 已印單：改「重印」描邊鈕（沿用原號、不取新號），比照一般訂單
                                <button
                                  onClick={() => void reprintOrder(o.id, o.trackingNos ?? [])}
                                  className="rounded-full border-2 border-hairline bg-white px-4 text-base font-bold text-ink-sub active:opacity-80"
                                  style={{ minHeight: 'max(2.75rem, 44px)' }}
                                >
                                  重印
                                </button>
                              ) : mode === 'early' && !earlyEligible ? (
                                // 出貨預告 + 無提早資格：比照一般卡片,灰掉不可按(先前漏做→按了後端擋、靜默失敗)
                                <span
                                  className="inline-flex items-center rounded-full bg-inset px-3 text-center text-sm font-bold text-ink-faint"
                                  style={{ minHeight: 'max(2.75rem, 44px)' }}
                                >
                                  尚未到出貨時間
                                </span>
                              ) : (
                                <button
                                  onClick={() => openPrintOne(o)}
                                  className="rounded-full bg-act px-4 text-base font-bold text-white active:bg-act-deep"
                                  style={{ minHeight: 'max(2.75rem, 44px)' }}
                                >
                                  {mode === 'early' ? '提早印單' : '印單'}
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
        )
      })}

      {/* 單筆印單：選印幾張（比照一般 OrderCard；大量單／分裝由農友自己決定） */}
      {printTarget && (
        <ConfirmDialog
          title={mode === 'early' ? '提早印單' : '列印出貨單'}
          message={
            <div>
              {mode === 'early' && <p className="mb-3 font-bold text-urgent">{EARLY_SHIP_WARNING}</p>}
              <p>每印一張單就會向黑貓要一個物流編號。</p>
              <div className="mt-5 flex items-center gap-4">
                <span className="text-lg text-ink">印</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPrintQty((q) => Math.max(1, q - 1))}
                    disabled={printQty <= 1}
                    className="rounded-full border-2 border-hairline bg-white text-2xl font-bold text-ink disabled:border-hairline disabled:bg-inset disabled:text-ink-faint"
                    style={{ width: 48, height: 48 }}
                    aria-label="減少張數"
                  >
                    −
                  </button>
                  <QtyInput
                    value={printQty}
                    onChange={setPrintQty}
                    className="w-16 rounded border-2 border-edge text-center text-3xl font-bold text-ink"
                    style={{ height: 48 }}
                    ariaLabel="列印張數"
                  />
                  <button
                    onClick={() => setPrintQty((q) => q + 1)}
                    className="rounded-full border-2 border-hairline bg-white text-2xl font-bold text-ink"
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
          confirmText={mode === 'early' ? `我了解，仍要提早印單（${printQty} 張）` : `列印（${printQty} 張）`}
          onConfirm={doPrintOne}
          onCancel={() => setPrintTarget(null)}
        />
      )}

      {confirmSub && (
        <ConfirmDialog
          title={mode === 'early' ? '提早印單' : '批次列印出貨單'}
          message={(() => {
            const rows = confirmSub.orders.filter((o) => sel.has(o.id))
            const sheets = rows.reduce((a, o) => a + (sel.get(o.id) ?? 1), 0)
            return `將列印勾選的 ${rows.length} 筆訂單，共 ${sheets} 張`
          })()}
          confirmText={mode === 'early' ? '我了解，仍要提早印單' : '開始列印'}
          onConfirm={() => doPrintSub(confirmSub)}
          onCancel={() => setConfirmSub(null)}
        />
      )}

    </div>
  )
}
