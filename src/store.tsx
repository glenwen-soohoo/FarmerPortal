import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { AuditEntry, Farmer, Order, Product } from './types'
import { seedOrders } from './mocks/orders'
import { seedFarmers } from './mocks/farmers'
import { seedProducts } from './mocks/products'

interface Store {
  orders: Order[]
  farmers: Farmer[]
  products: Product[]
  currentFarmerId: number
  setCurrentFarmerId: (id: number) => void // 開發用：切換目前登入農友
  cardStyle: 'fill' | 'outline' // 開發用：卡片急迫度呈現＝底色版 / 線框版（給使用者 A/B 測試）
  setCardStyle: (s: 'fill' | 'outline') => void
  // 印單：每次都即時要新號（count 張＝count 個新物流編號），覆蓋既有號。
  // devToday（'YYYY-MM-DD'）＝【DEMO 專屬】用開發面板測試日期當印單日，見下方實作註解
  printOrder: (id: string, count?: number, devToday?: string) => void
  // 多箱追加補單：每補一張就多要一個物流編號（append，不改訂單狀態）
  supplementOrder: (id: string, count?: number) => void
  // 已取消卡片：農友按「知道了」→ 提早收起（F0 §3-3）
  dismissCancel: (id: string) => void
  shipOrder: (id: string) => void
  failOrder: (id: string, reason: string, altDate?: string) => void
  // 手動改單：覆寫欄位、判定狀態自動標「人工修正判定」、記稽核
  manualEdit: (id: string, patch: Partial<Order>, editor: string) => void
  bindProduct: (productId: string, farmerId: number | undefined) => void
  setAccountStatus: (farmerId: number, status: Farmer['status']) => void
  // 提早出貨資格：業務確認後才開放給特定農友
  setEarlyShip: (farmerId: number, allow: boolean) => void
}

const Ctx = createContext<Store | null>(null)

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(seedOrders)
  const [farmers, setFarmers] = useState<Farmer[]>(seedFarmers)
  const [products, setProducts] = useState<Product[]>(seedProducts)
  const [currentFarmerId, setCurrentFarmerId] = useState(6)
  const [cardStyle, setCardStyle] = useState<'fill' | 'outline'>('fill')

  const patch = (id: string, fn: (o: Order) => Order) =>
    setOrders((prev) => prev.map((o) => (o.id === id ? fn(o) : o)))

  const value = useMemo<Store>(
    () => ({
      orders,
      farmers,
      products,
      currentFarmerId,
      setCurrentFarmerId,
      cardStyle,
      setCardStyle,
      printOrder: (id, count = 1, devToday) =>
        patch(id, (o) => {
          // 每次印單即時要新號：產生 count 個新的黑貓物流編號，覆蓋原本的
          const nums = Array.from(
            { length: Math.max(1, count) },
            (_, i) => `9010${o.id.padStart(3, '0')}${String(i + 1).padStart(3, '0')}`
          )
          // 【DEMO 專屬邏輯】此為測試機：印單日改用「開發面板的測試日期」而非真實今天，
          // 否則備貨總覽「印單未出」用測試日期篩「印單日」會抓不到剛印的單（真實日期 ≠ 測試日期）。
          // 正式環境請拿掉 devToday、一律用 new Date()。時間仍取真實時分讓顯示自然。
          const now = new Date()
          const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
          const printedAt = devToday ? `${devToday} ${hhmm}` : now.toLocaleString('zh-TW')
          return { ...o, shipStatus: '已印單', printedAt, trackingNos: nums }
        }),
      supplementOrder: (id, count = 1) =>
        patch(id, (o) => {
          const existing = o.trackingNos ?? []
          // 每補一張＝多一個黑貓物流編號；示範號依現有數量遞增
          const added = Array.from(
            { length: count },
            (_, i) => `9009${o.id.padStart(3, '0')}${String(existing.length + i + 1).padStart(3, '0')}`
          )
          return { ...o, trackingNos: [...existing, ...added] }
        }),
      dismissCancel: (id) => patch(id, (o) => ({ ...o, cancelDismissed: true })),
      shipOrder: (id) => patch(id, (o) => ({ ...o, shipStatus: '已出貨' })),
      failOrder: (id, reason, altDate) =>
        patch(id, (o) => ({
          ...o,
          shipStatus: '無法出貨',
          failReason: altDate ? `${reason}（可出貨日 ${altDate}）` : reason,
        })),
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
          // 判定狀態也算一次變更（若原本不是人工修正）
          if (o.judgeStatus !== '人工修正判定') {
            audits.push({ by: editor, at, field: 'judgeStatus', from: o.judgeStatus, to: '人工修正判定' })
          }
          return { ...o, ...p, judgeStatus: '人工修正判定', auditLog: [...(o.auditLog ?? []), ...audits] }
        }),
      bindProduct: (productId, farmerId) =>
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, farmerId } : p))
        ),
      setAccountStatus: (farmerId, status) =>
        setFarmers((prev) => prev.map((f) => (f.id === farmerId ? { ...f, status } : f))),
      setEarlyShip: (farmerId, allow) =>
        setFarmers((prev) => prev.map((f) => (f.id === farmerId ? { ...f, earlyShipAllowed: allow } : f))),
    }),
    [orders, farmers, products, currentFarmerId, cardStyle]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore must be used within OrdersProvider')
  return v
}

// 可出貨排序：① 盒數多 ② 有備註往後 ③ 訂單號（平日/假日偏好已改由 blockedDates 表達，不再獨立排序）
export function sortShippable(list: Order[]): Order[] {
  return [...list].sort((a, b) => {
    if (b.qty !== a.qty) return b.qty - a.qty
    const aHas = a.farmerRemark.trim().length > 0
    const bHas = b.farmerRemark.trim().length > 0
    if (aHas !== bHas) return aHas ? 1 : -1
    return a.orderNumber.localeCompare(b.orderNumber)
  })
}
