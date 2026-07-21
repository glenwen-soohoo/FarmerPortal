import type { Order } from '../types'

// 出貨總表（未出）資料層：把「印單未出」清單整理成一品項一張的表格資料。
// 格式沿用主站既有出貨清單（見規劃文件 F2 §3-1）：
//   標題＝{列印日} {品項}、一個品項一張；
//   欄位＝序號／收件人／手機／地址／品項／規格／數量／單位／農友備註／客人訂購日期／最後出貨日期；
//   農友備註（farmerRemark，AI 給農友的作業指示）＝紅字、且有農友備註的列才套黃底。
//   （司機備註 driverRemark 是給司機的配送指示、印在物流單，不放這張農友備貨表。）
// 版面與列印由 ShippingListModal 呈現；此檔只負責取值／分組。

export const listProductName = (o: Order) => (o.variety && o.variety.trim()) || o.productName

// 單位：從規格字串取量詞（「1盒(5斤裝)」→ 盒），取不到退回「件」（Demo 推導）
export function unitOf(spec: string): string {
  const m = spec.match(/\d+\s*([盒箱包袋串顆瓶罐台件組份把])/)
  return m ? m[1] : '件'
}

// 客人訂購日期：Demo 從訂單編號前六碼 YYMMDD 推（「260525…」→ 2026/05/25）；推不出留空
export function orderDate(o: Order): string {
  const s = o.orderNumber.slice(0, 6)
  return /^\d{6}$/.test(s) ? `20${s.slice(0, 2)}/${s.slice(2, 4)}/${s.slice(4, 6)}` : ''
}

// 農友備註：AI 給農友的作業指示（品種/數量/出貨動作）＝農友端該印、該強調（紅字）的備註
export function farmerRemarkOf(o: Order): string {
  return (o.farmerRemark && o.farmerRemark.trim()) || ''
}

// 最後出貨日期＝可出貨區間迄日
export const lastShipDate = (o: Order) => (o.shipWindow ? o.shipWindow[1] : '')

export interface ShippingListGroup {
  product: string
  spec: string | null // 該組只有單一規格時帶入標題，否則 null
  rows: Order[]
}

// 依品項分組（一品項一張）；同品項若只有單一規格，規格併進標題。
// ⭐ 保留「傳入順序」：呼叫端應先用 sortForFarmer（與需出貨同一套）排好再傳進來，
//   分頁順序＝各品項首次出現順序、列順序＝傳入順序，才能與需出貨排序一致。
export function buildShippingSheets(orders: Order[]): ShippingListGroup[] {
  const map = new Map<string, Order[]>()
  for (const o of orders) {
    const p = listProductName(o)
    if (!map.has(p)) map.set(p, [])
    map.get(p)!.push(o)
  }
  return [...map.entries()].map(([product, rows]) => {
    const specs = new Set(rows.map((r) => r.spec))
    return { product, spec: specs.size === 1 ? [...specs][0] : null, rows }
  })
}
