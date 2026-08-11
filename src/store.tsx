import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { AuditEntry, Farmer, Order, Product } from './types'
import { useAuth } from './auth'
import { seedOrders } from './mocks/orders'
import { seedFarmers } from './mocks/farmers'
import { seedProducts } from './mocks/products'

/**
 * 【DEMO 專屬】mock store。
 *
 * 對外露出與工程師版農友端**完全相同**的 Store 介面（useStore / OrdersProvider），
 * 但實作全部改吃 src/mocks 的 seed 資料、沒有 fetch / SignalR / 後端：
 *   loading=false、error=null、offline=false、connected=true（永遠「連線正常、載入完成」）。
 *   retryNow / clearActionError / reload 都是 no-op（或立即 resolve），actionError / actionRetry 恆 null。
 *   印單類動作直接改本地 orders 陣列（產生示範物流編號、標已印單、記印單時間），並在過程中
 *   短暫把 printBusy 設起來（setTimeout），讓 FarmerLayout 的 PrintOverlay 出現後再收掉、回傳已解決的 Promise。
 *
 * 同時是後台/外殼所需 demo 方法的 SUPERSET（farmers / products / manualEdit / setAccountStatus /
 * setEarlyShip / setRemoteAgent / bindProduct / shipOrder / dismissCancel），讓 admin 三頁維持可編譯。
 */

/** 印單等待面板文字（null＝目前沒有進行中的印單）。由 FarmerLayout 統一渲染 PrintOverlay。 */
export interface PrintPanel {
  title: string
  detail: string
}

interface Store {
  // ── 農友端（對齊工程師版 Store）──
  orders: Order[]
  currentFarmerId: number
  loading: boolean
  error: string | null
  offline: boolean
  retryAttempt: number
  nextRetryAt: number | null
  retryNow: () => void
  actionError: string | null
  actionRetry: (() => void) | null
  clearActionError: () => void
  connected: boolean
  printBusy: PrintPanel | null
  reload: () => Promise<void>
  printOrder: (id: string, count?: number) => Promise<void>
  printOrders: (ids: string[], qtyById?: Map<string, number>, panel?: PrintPanel) => Promise<void>
  reprintOrder: (id: string, obts: string[]) => Promise<void>
  refreshExpiredLabel: (id: string, count?: number) => Promise<void>
  supplementOrder: (id: string, count?: number) => Promise<void>
  failOrder: (id: string, reason: string, altDate?: string) => void

  // ── demo 後台/外殼 SUPERSET ──
  farmers: Farmer[]
  products: Product[]
  setCurrentFarmerId: (id: number) => void
  dismissCancel: (id: string) => void
  shipOrder: (id: string) => void
  // 後台出貨軸人工動作（不動判定狀態）：取消 / 復原 / 標記改單待重印 / 標記已到貨
  cancelOrder: (id: string, reason?: string) => void
  reactivateOrder: (id: string) => void
  requestReprint: (id: string) => void
  arriveOrder: (id: string) => void
  manualEdit: (id: string, patch: Partial<Order>, editor: string) => void
  bindProduct: (productId: string, farmerId: number | undefined) => void
  setAccountStatus: (farmerId: number, status: Farmer['status']) => void
  setEarlyShip: (farmerId: number, allow: boolean) => void
  setRemoteAgent: (farmerId: number, on: boolean) => void
}

// 印單時間文字：'YYYY-MM-DD HH:mm'（對齊工程師版備貨總覽 printMMDD 的解析）。
function nowPrintedAt(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

// 舊號作廢留存：改單重印 / 超時重印都會把舊物流編號寫進客服備註（csRemark），方便後台意外時追查。
function voidNote(reason: string, oldNos: string[], freshNos: string[]): string {
  return `[${nowPrintedAt()}] ${reason}，原物流編號 ${oldNos.join('、') || '（無）'} 作廢，改用新號 ${freshNos.join('、')}`
}
function appendCs(existing: string | undefined, note: string): string {
  return existing ? `${existing}\n${note}` : note
}

const Ctx = createContext<Store | null>(null)

export function OrdersProvider({ children }: { children: ReactNode }) {
  const { farmer, currentFarmerId, setCurrentFarmerId } = useAuth()
  const [orders, setOrders] = useState<Order[]>(seedOrders)
  const [farmers, setFarmers] = useState<Farmer[]>(seedFarmers)
  const [products, setProducts] = useState<Product[]>(seedProducts)
  const [printBusy, setPrintBusy] = useState<PrintPanel | null>(null)

  // currentFarmerId 沿用工程師版語意：由「目前登入農友」決定（這裡來自 mock auth）。
  const effectiveFarmerId = farmer?.id ?? currentFarmerId

  const patch = useCallback(
    (id: string, fn: (o: Order) => Order) => setOrders((prev) => prev.map((o) => (o.id === id ? fn(o) : o))),
    []
  )

  // 印單共用外殼：秀出等待面板 → 短暫延遲（讓 PrintOverlay 現身）→ 套用本地變更 → 收面板。
  const runPrint = useCallback(async (panel: PrintPanel, apply: () => void) => {
    setPrintBusy(panel)
    try {
      await new Promise((r) => setTimeout(r, 600))
      apply()
    } finally {
      setPrintBusy(null)
    }
  }, [])

  const value = useMemo<Store>(() => {
    // 印單：即時要 count 個新物流編號、標「已印單」、記印單時間（mirror demo 舊 store 的編號生成）。
    const printOrder = (id: string, count = 1) =>
      runPrint({ title: '正在產生出貨單…', detail: '向黑貓取號中，請稍候' }, () =>
        patch(id, (o) => {
          const nums = Array.from(
            { length: Math.max(1, count) },
            (_, i) => `9010${o.id.padStart(3, '0')}${String(i + 1).padStart(3, '0')}`
          )
          // 改單待重印→重印：舊號作廢、寫進客服備註；第一次印（可出貨、無舊號）則不寫。
          const csRemark =
            o.shipStatus === '改單待重印' && (o.trackingNos?.length ?? 0) > 0
              ? appendCs(o.csRemark, voidNote('改單重印', o.trackingNos!, nums))
              : o.csRemark
          return { ...o, shipStatus: '已印單', printedAt: nowPrintedAt(), trackingNos: nums, csRemark }
        })
      )

    // 批次印單：對每一列各自取號、標已印單（demo 無子單 orderId，直接以列 id 操作）。
    // ⚠️ 已印過 N 個號、又設定印 N+M 張 → 沿用既有 N 個、只「追加」M 個新號（多印的是補單，不是重印全換）。
    //   ・未印（無號）→ 取 count 個新號（9010 系列）、轉已印單。
    //   ・改單待重印 → 舊號作廢、重新取 count 個新號（9010 系列）。
    //   ・已印且 count > 既有 → 追加 (count − 既有) 個補單號（9009 系列）沿用既有。
    //   ・已印且 count ≤ 既有 → 重印既有號，資料不變。
    const printOrders = (ids: string[], qtyById?: Map<string, number>, panel?: PrintPanel) =>
      runPrint(panel ?? { title: '批次列印中…', detail: '向黑貓取號中，請稍候' }, () =>
        setOrders((prev) =>
          prev.map((o) => {
            if (!ids.includes(o.id)) return o
            const count = Math.max(1, qtyById?.get(o.id) ?? 1)
            const existing = o.trackingNos ?? []
            if (o.shipStatus === '改單待重印' || existing.length === 0) {
              const nums = Array.from(
                { length: count },
                (_, i) => `9010${o.id.padStart(3, '0')}${String(i + 1).padStart(3, '0')}`
              )
              // 改單待重印→重印：舊號作廢、寫進客服備註；第一次印（無舊號）不寫。
              const csRemark =
                o.shipStatus === '改單待重印' && existing.length > 0
                  ? appendCs(o.csRemark, voidNote('改單重印', existing, nums))
                  : o.csRemark
              return { ...o, shipStatus: '已印單', printedAt: nowPrintedAt(), trackingNos: nums, csRemark }
            }
            if (count > existing.length) {
              const added = Array.from(
                { length: count - existing.length },
                (_, i) => `9009${o.id.padStart(3, '0')}${String(existing.length + i + 1).padStart(3, '0')}`
              )
              return { ...o, printedAt: nowPrintedAt(), trackingNos: [...existing, ...added] }
            }
            return o // count ≤ 既有：重印既有號，資料不變
          })
        )
      )

    // 勾選重印：沿用原號、不取新號、不改狀態 —— demo 只需秀出列印面板，不動資料。
    const reprintOrder = (_id: string, _obts: string[]) =>
      runPrint({ title: '正在重印出貨單…', detail: '沿用原本的物流編號，請稍候' }, () => {})

    // 超時重印：黑貓標籤印出超過 24h → 舊號失效。作廢舊號、重新取新號（張數由農友選，9011 系列與原印/補單區隔）、
    // 印單時間更新為現在（重新起算 24h）。舊號寫進客服備註（csRemark）保留，方便後台意外時追查（第 4 點）。
    const refreshExpiredLabel = (id: string, count = 1) =>
      runPrint({ title: '正在重新取號…', detail: '舊號已失效，向黑貓重新取號中，請稍候' }, () =>
        patch(id, (o) => {
          const old = o.trackingNos ?? []
          const n = Math.max(1, count)
          const fresh = Array.from(
            { length: n },
            (_, i) => `9011${o.id.padStart(3, '0')}${String(i + 1).padStart(3, '0')}`
          )
          return { ...o, trackingNos: fresh, printedAt: nowPrintedAt(), csRemark: appendCs(o.csRemark, voidNote('標籤超過24小時失效', old, fresh)) }
        })
      )

    // 多箱追加補單：每補一張多要一個新物流編號（append），不改狀態（mirror demo 舊 store）。
    const supplementOrder = (id: string, count = 1) =>
      runPrint({ title: '正在補印出貨單…', detail: `向黑貓多要 ${count} 個號，請稍候` }, () =>
        patch(id, (o) => {
          const existing = o.trackingNos ?? []
          const added = Array.from(
            { length: Math.max(1, count) },
            (_, i) => `9009${o.id.padStart(3, '0')}${String(existing.length + i + 1).padStart(3, '0')}`
          )
          return { ...o, trackingNos: [...existing, ...added] }
        })
      )

    return {
      orders,
      farmers,
      products,
      currentFarmerId: effectiveFarmerId,
      setCurrentFarmerId,
      // 靜態狀態（demo 無後端）
      loading: false,
      error: null,
      offline: false,
      retryAttempt: 0,
      nextRetryAt: null,
      retryNow: () => {},
      actionError: null,
      actionRetry: null,
      clearActionError: () => {},
      connected: true,
      printBusy,
      reload: async () => {},
      printOrder,
      printOrders,
      reprintOrder,
      refreshExpiredLabel,
      supplementOrder,
      failOrder: (id, reason, altDate) =>
        patch(id, (o) => ({
          ...o,
          shipStatus: '無法出貨',
          failReason: altDate ? `${reason}（可出貨日 ${altDate}）` : reason,
        })),
      dismissCancel: (id) => patch(id, (o) => ({ ...o, cancelDismissed: true })),
      shipOrder: (id) => patch(id, (o) => ({ ...o, shipStatus: '已出貨' })),
      cancelOrder: (id, reason) => patch(id, (o) => ({ ...o, shipStatus: '取消', cancelReason: reason })),
      reactivateOrder: (id) => patch(id, (o) => ({ ...o, shipStatus: '可出貨', cancelReason: undefined, failReason: undefined })),
      requestReprint: (id) => patch(id, (o) => ({ ...o, shipStatus: '改單待重印' })),
      arriveOrder: (id) => patch(id, (o) => ({ ...o, shipStatus: '已到貨' })),
      manualEdit: (id, p, editor) =>
        patch(id, (o) => {
          const at = new Date().toLocaleString('zh-TW')
          const audits: AuditEntry[] = []
          for (const [k, v] of Object.entries(p) as [keyof Order, unknown][]) {
            const from = o[k]
            if (String(from ?? '') !== String(v ?? '')) {
              audits.push({ by: editor, at, field: String(k), from: String(from ?? '（空）'), to: String(v ?? '（空）') })
            }
          }
          if (audits.length === 0) return o
          if (o.judgeStatus !== '人工修正判定') {
            audits.push({ by: editor, at, field: 'judgeStatus', from: o.judgeStatus, to: '人工修正判定' })
          }
          return { ...o, ...p, judgeStatus: '人工修正判定', auditLog: [...(o.auditLog ?? []), ...audits] }
        }),
      bindProduct: (productId, farmerId) =>
        setProducts((prev) => prev.map((pr) => (pr.id === productId ? { ...pr, farmerId } : pr))),
      setAccountStatus: (farmerId, status) =>
        setFarmers((prev) => prev.map((f) => (f.id === farmerId ? { ...f, status } : f))),
      setEarlyShip: (farmerId, allow) =>
        setFarmers((prev) => prev.map((f) => (f.id === farmerId ? { ...f, earlyShipAllowed: allow } : f))),
      setRemoteAgent: (farmerId, on) =>
        setFarmers((prev) =>
          prev.map((f) => (f.id === farmerId ? { ...f, remoteAgentCode: on ? f.remoteAgentCode || '待設定' : undefined } : f))
        ),
    }
  }, [orders, farmers, products, effectiveFarmerId, setCurrentFarmerId, printBusy, patch, runPrint])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore must be used within OrdersProvider')
  return v
}
