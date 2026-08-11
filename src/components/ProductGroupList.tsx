import { useEffect, useState } from 'react'
import type { Order } from '../types'
import { useStore } from '../store'
import OrderCard from './OrderCard'
import BigButton from './BigButton'
import TempLayerTag from './TempLayerTag'
import ConfirmDialog from './ConfirmDialog'
import { COMPANY_TEL } from '../constants'
import { productKey } from '../utils/product'
import { useDialog } from './useDialog'

// 商品分區依「清洗後名稱」（variety→productName）。
// ⚠️ 這把 key 與需出貨頁的品項篩選共用（utils/product.ts），兩邊不可各自定義。

const FAIL_REASONS = ['缺貨', '品質不良', '數量不足', '其他']

interface Group {
  product: string
  orders: Order[]
  totalQty: number
}

// 表頭第二行：N 種規格 · N 張單 · N 件貨（0805 回饋：不再列各規格明細 chip）
function specSummary(g: Group): string {
  const kinds = new Set(g.orders.map((o) => o.spec || '—')).size
  return `${kinds} 種規格 · ${g.orders.length} 張單 · ${g.totalQty} 件貨`
}
/**
 * 勾選的列**實際會印出幾張**標籤。原本是「把勾選張數加總」，那個數字在兩種情況下都會少算：
 *
 * ① **已印單的單是重印，會印出那張單全部的物流編號**（後端 PrintBatchAsync 的 reuseObts：
 *    「重印要印這張單全部的號」，多箱不漏；勾選張數對已印單不適用，那是追加補單的事）。
 *    所以勾兩張、其中一張已經是兩箱 → 實際印三張，而畫面卻寫「共 2 張」。
 * ② **一列＝一個品項，不是一張訂單**（`id` 是 OrderDetailId、`orderId` 才是子單 Orders.Id）。
 *    同一張訂單的兩個品項是兩列，但印單以訂單為單位、`store.printOrders` 也會依 orderId 去重
 *    → 勾兩列只會印出一份標籤。這裡跟著去重，並比照 printOrders 對同一訂單取 max。
 *
 * ⚠️「改單待重印」不算已印：後端對它一律重新取號（舊標籤地址已過期），張數照勾選走。
 */
function sheetsOf(rows: Order[], sel: Map<string, number>): number {
  // demo 的假資料沒有 orderId，退回用列 id 當 key（否則整份都被跳過、張數恆為 0）。
  const byOrder = new Map<string, number>()
  for (const o of rows) {
    if (!sel.has(o.id)) continue
    const key = o.orderId != null ? `oid:${o.orderId}` : `id:${o.id}`
    const sq = sel.get(o.id) ?? 1
    const reprintsAll = o.shipStatus !== '改單待重印' && (o.trackingNos?.length ?? 0) > 0
    // 已印：重印既有 N 張＋（設定超過 N 時）追加的張數 → 取 max(既有, 勾選張數)
    const n = reprintsAll ? Math.max(o.trackingNos!.length, sq) : sq
    byOrder.set(key, reprintsAll ? n : Math.max(byOrder.get(key) ?? 1, n))
  }
  return [...byOrder.values()].reduce((a, b) => a + b, 0)
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
  const { printOrders, failOrder } = useStore()
  const groups = toGroups(orders)

  // 批次只能針對「同一商品」→ 用 batchProduct 鎖定目前批次的商品
  const [batchProduct, setBatchProduct] = useState<string | null>(null)
  // 勾選內容：id → 份數（1=原印，>1=含補印）
  const [sel, setSel] = useState<Map<string, number>>(new Map())
  const [confirming, setConfirming] = useState(false)
  const [failing, setFailing] = useState(false) // 批次無法出貨的原因選擇彈窗
  const [failedCount, setFailedCount] = useState(0) // >0＝顯示「已回報 N 筆」收據

  useEffect(() => {
    setNavLocked(batchProduct !== null)
    return () => setNavLocked(false)
  }, [batchProduct, setNavLocked])

  const showBatch = mode === 'print' || !!earlyEligible
  const labelCount = sheetsOf(orders, sel)

  // 進批次的預設份數：沒印過→1；已印過幾張（trackingNos）→就預設幾張（0805 回饋 #7）
  const defaultQty = (o: Order) => Math.max(1, o.trackingNos?.length ?? 0)
  // 進批次模式＝預設全選、各單帶預設份數
  const enter = (p: string) => {
    setBatchProduct(p)
    const grp = groups.find((g) => g.product === p)
    const n = new Map<string, number>()
    grp?.orders.forEach((o) => n.set(o.id, defaultQty(o)))
    setSel(n)
  }
  const cancel = () => {
    setBatchProduct(null)
    setSel(new Map())
    setConfirming(false)
    setFailing(false)
  }
  const toggle = (id: string) =>
    setSel((prev) => {
      const n = new Map(prev)
      if (n.has(id)) n.delete(id)
      else {
        const o = orders.find((x) => x.id === id)
        n.set(id, o ? defaultQty(o) : 1)
      }
      return n
    })
  const addQty = (id: string, delta: number) =>
    setSel((prev) => {
      if (!prev.has(id)) return prev
      const n = new Map(prev)
      n.set(id, Math.max(1, (prev.get(id) ?? 1) + delta))
      return n
    })
  // 直接鍵入份數（比照企業匯單）
  const setQty = (id: string, value: number) =>
    setSel((prev) => {
      if (!prev.has(id)) return prev
      const n = new Map(prev)
      n.set(id, Math.max(1, value))
      return n
    })

  // 立刻發請求；面板存在的時間＝真實等待的時間（原本是白等 1.6 秒才發）。
  // 面板與最短顯示時間由 store 的 runPrint 負責，panel 文字在這裡給（張數只有這裡算得出來）。
  const doPrint = async () => {
    setConfirming(false)
    const ids = [...sel.keys()]
    const qty = new Map(sel) // 快照：請求進行中若 cancel() 清空 sel，張數不會跟著丟失
    const panel = {
      title: mode === 'early' ? '提早列印中…' : '批次列印中…',
      detail: `向黑貓取號中，共 ${labelCount} 張，請稍候`, // 也要在 cancel() 清空 sel 之前算好
    }
    try {
      // 批次合併成一份 PDF、只列印一次（不再 forEach 開多分頁被彈窗擋）
      await printOrders(ids, qty, panel)
    } finally {
      cancel()
    }
  }
  const doFail = (reason: string) => {
    const ids = [...sel.keys()]
    ids.forEach((id) => failOrder(id, reason))
    // 先記筆數再 cancel()——cancel() 會清空 sel，之後就取不到數量了。
    // 批次原本送出後什麼都不跳：畫面直接恢復正常，農友無從確認「到底送出了幾筆、有沒有成功」，
    // 而批次的後果比單筆大。單筆送出後有「已回報」收據，這裡補上同一份、並帶上筆數。
    setFailedCount(ids.length)
    cancel()
  }

  const batchLabel = mode === 'early' ? '批次提早印單' : '批次列印'
  const confirmLabel = mode === 'early' ? '提早列印勾選' : '列印勾選'

  return (
    <>
      {/* 組間距由 index.css 的 .pg-grp 單一管理；此處不再宣告 space-y-6（兩者 margin collapse，
          會讓「改較小的那一個」完全沒反應）。 */}
      <div>
        {groups.map((g) => {
          const active = batchProduct === g.product
          const otherActive = batchProduct !== null && !active
          const allSelected = active && g.orders.length > 0 && g.orders.every((o) => sel.has(o.id))
          const toggleAll = () =>
            setSel(() => {
              if (allSelected) return new Map()
              const n = new Map<string, number>()
              g.orders.forEach((o) => n.set(o.id, sel.get(o.id) ?? defaultQty(o)))
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
              className="pg-grp"
              style={{
                position: active ? 'relative' : undefined,
                zIndex: active ? 40 : undefined,
              }}
            >
              {/* 商品表頭（吸頂）：品名 + 溫層 + 總計/規格小計 + 批次控制。
                  改自原先的「左側 13rem 商品欄」——把橫向空間全留給訂單卡，捲動時表頭仍在，
                  不會不知道現在在哪個商品（避免撿錯貨）。 */}
              <div className={`pg-gh ${active ? 'pg-gh-on' : ''}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="pg-nm text-ink">{g.product}</span>
                    {temps.map((t) => (
                      <TempLayerTag key={t} layer={t} />
                    ))}
                  </div>
                  <div className="pg-mt mt-0.5 text-ink-faint">{specSummary(g)}</div>
                </div>

                {/* 批次模式的「已勾選 N 筆」放回原本「批次列印」鈕的位置（第一列右側，與品名同排），
                    不要獨佔一列把動作鈕往下擠。動作鈕仍走 .pg-gh-act 換到第二列。 */}
                {active && (
                  <span className="pg-mt shrink-0 self-start font-bold text-act">已勾選 {sel.size} 筆</span>
                )}

                {/* 批次控制 */}
                <div className="pg-gh-act">
                  {active ? (
                    <>
                      {/* 無法出貨靠左；全選／取消／列印勾選靠右（0805 回饋 #5） */}
                      <button
                        disabled={sel.size === 0}
                        onClick={() => setFailing(true)}
                        className="pg-hbtn pg-hbtn-dgr"
                        style={{ marginRight: 'auto' }}
                      >
                        批次無法出貨
                      </button>
                      <button onClick={toggleAll} className="pg-hbtn">
                        {allSelected ? '取消全選' : '全選'}
                      </button>
                      <button onClick={cancel} className="pg-hbtn">
                        取消批次
                      </button>
                      <button
                        disabled={sel.size === 0}
                        onClick={() => setConfirming(true)}
                        className="pg-hbtn pg-hbtn-pri"
                      >
                        {confirmLabel}
                      </button>
                    </>
                  ) : showBatch ? (
                    <button onClick={() => enter(g.product)} disabled={otherActive} className="pg-hbtn">
                      {batchLabel}
                    </button>
                  ) : null}
                </div>
              </div>

              {/* 訂單卡：依規格分成獨立區塊（同品名下不同規格各自成塊） */}
              <div className="pg-rows min-w-0">
                {specBlocks.map((blk, bi) => (
                  <div key={`${blk.spec}_${bi}`} className="pg-specblock">
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
                        onQtySet={(v) => setQty(o.id, v)}
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
            message={`將列印勾選的 ${sel.size} 筆訂單，共 ${labelCount} 張`}
            confirmText={mode === 'early' ? '我了解，仍要提早印單' : '開始列印'}
            onConfirm={doPrint}
            onCancel={() => setConfirming(false)}
          />
        )}

        {/* 批次無法出貨：選原因 */}
        {failing && <BatchFailDialog count={sel.size} onConfirm={doFail} onCancel={() => setFailing(false)} />}

        {/* 送出後的收據。文案與單筆的「已回報」同一份，只多帶筆數——批次一次動好幾張單，
            更需要一個明確的「送出了幾筆」。⚠️ 這只補了「事後確認」，批次仍然是一步送出、
            單筆是兩步，摩擦力梯度依舊是反的（那是另一件事，不是這個收據能解的）。 */}
        {failedCount > 0 && (
          <ConfirmDialog
            title="已回報"
            message={`已回報 ${failedCount} 筆，已通知業務處理。急件請另外電聯公司 ${COMPANY_TEL}，謝謝`}
            confirmText="我知道了"
            cancelText="關閉"
            onConfirm={() => setFailedCount(0)}
            onCancel={() => setFailedCount(0)}
          />
        )}

      </div>
    </>
  )
}

// 批次無法出貨：選共同原因 → 再確認 → 一次回報。
// ⚠️ 兩步是刻意的，與單筆的 FailDialog 對齊。原本批次只有一步（選原因就送出），
// 而單筆要兩步——摩擦力梯度是反的：批次一次動好幾張單、後果更大，卻更容易誤送。
// 「無法出貨」在農友端無法復原（只有後台能改回來），所以送出前要有一次「你正在做什麼」的複述。
function BatchFailDialog({ count, onConfirm, onCancel }: { count: number; onConfirm: (reason: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState('')
  const [confirming, setConfirming] = useState(false)
  // 第二個參數傳 confirming：兩步的容器是同一個 DOM 節點（同型別 div、位置相同 → React 重用），
  // 只有子樹被換掉，原本聚焦的鈕消失後焦點會掉回 <body>、讀屏也不知道換了一步。
  // 傳它才會在切步時重新聚焦容器、重念一次標題。同 FailDialog 的處理。
  const panelRef = useDialog(() => (confirming ? setConfirming(false) : onCancel()), confirming)

  if (confirming) {
    return (
      // 點遮罩＝返回上一步（與第一步的「點遮罩關閉」一致）。少了這個 onClick，農友只能找「返回」鈕。
      <div
        className="anim-fade fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'var(--scrim)' }}
        onClick={() => setConfirming(false)}
      >
        <div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="確認批次回報無法出貨"
          className="anim-pop w-full max-w-md overflow-y-auto rounded-card bg-white p-6"
          style={{ boxShadow: 'var(--l3)', maxHeight: '85vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-2xl font-bold text-ink">確認批次回報無法出貨</h3>
          <p className="mt-4 text-lg text-ink-sub">
            將把勾選的 <span className="font-bold text-ink">{count} 筆</span>訂單一併回報「
            <span className="font-bold text-ink">{reason}</span>」。回報後這些單就不會出貨了，確定嗎？
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <BigButton variant="secondary" onClick={() => setConfirming(false)}>
              返回
            </BigButton>
            <BigButton variant="danger" onClick={() => onConfirm(reason)}>
              確定回報
            </BigButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="anim-fade fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--scrim)' }} onClick={onCancel}>
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="批次無法出貨"
        className="anim-pop w-full max-w-md overflow-y-auto rounded-card bg-white p-6"
        style={{ boxShadow: 'var(--l3)', maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-2xl font-bold text-ink">批次無法出貨</h3>
        <p className="mt-3 text-lg text-ink-sub">將把勾選的 {count} 筆訂單一併回報無法出貨，請選擇原因：</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {FAIL_REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              aria-pressed={reason === r}
              className={`rounded-full border px-4 text-lg ${reason === r ? 'border-act font-bold text-act' : 'border-hairline text-ink'}`}
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
          <BigButton variant="danger" disabled={!reason} onClick={() => setConfirming(true)}>
            下一步
          </BigButton>
        </div>
      </div>
    </div>
  )
}
