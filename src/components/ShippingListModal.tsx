import type { Order } from '../types'
import {
  buildShippingSheets,
  listProductName,
  unitOf,
  orderDate,
  farmerRemarkOf,
  driverRemarkOf,
  lastShipDate,
} from '../utils/shippingList'

// 出貨總表（未出）預覽疊層：A4 版面、一品項一張、有備註列黃底紅字。
// 「列印 / 存成 PDF」呼叫 window.print()；列印時只留 .sheet-print 區、其餘隱藏（見下方 <style>）。
// Demo 用瀏覽器列印產 PDF；正式版由後端直接出 A4 PDF（F2 §3-1）。

const COLS = ['序號', '收件人', '手機', '地址', '品項', '規格', '數量', '單位', '農友備註', '司機備註', '客人訂購日期', '最後出貨日期']

function Sheet({ product, spec, rows, printLabel }: {
  product: string
  spec: string | null
  rows: Order[]
  printLabel: string
}) {
  return (
    <section className="sl-sheet">
      <div className="sl-head">
        <h2>{`${printLabel} ${product}${spec ? ` ${spec}` : ''}`}</h2>
        <span className="sl-count">共 {rows.length} 筆</span>
      </div>
      <table className="sl-table">
        <thead>
          <tr>{COLS.map((c) => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((o, i) => {
            const farmerRemark = farmerRemarkOf(o)
            // 黃底只在「有農友備註」時套（農友備貨要注意的列）
            return (
              <tr key={o.id} className={farmerRemark ? 'sl-has-remark' : ''}>
                <td className="c">{i + 1}</td>
                <td>{o.recipient}</td>
                <td className="nowrap">{o.phone}</td>
                <td>{o.address}</td>
                <td>{listProductName(o)}</td>
                <td>{o.spec}</td>
                <td className="c">{o.qty}</td>
                <td className="c">{unitOf(o.spec)}</td>
                <td className="sl-remark">{farmerRemark}</td>
                <td className="sl-driver">{driverRemarkOf(o)}</td>
                <td className="nowrap c">{orderDate(o)}</td>
                <td className="nowrap c">{lastShipDate(o)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}

export default function ShippingListModal({ orders, printLabel, onClose }: {
  orders: Order[]
  printLabel: string
  onClose: () => void
}) {
  const sheets = buildShippingSheets(orders)
  const totalQty = orders.reduce((a, o) => a + o.qty, 0)

  return (
    <div className="sl-overlay" role="dialog" aria-label="出貨總表預覽">
      <style>{SL_CSS}</style>

      {/* 工具列（列印時隱藏） */}
      <div className="sl-bar sl-noprint">
        <div className="sl-bar-title">
          出貨總表（未出）· {printLabel}
          <span className="sl-bar-sub">{orders.length} 筆 · 共 {totalQty} 件 · {sheets.length} 種品項（每品項一頁）</span>
        </div>
        <div className="sl-bar-actions">
          <button className="sl-btn sl-btn-ghost" onClick={onClose}>關閉</button>
          <button className="sl-btn sl-btn-primary" onClick={() => window.print()}>列印 / 存成 PDF</button>
        </div>
      </div>

      {/* 列印內容 */}
      <div className="sl-scroll">
        <div className="sl-print">
          {sheets.map((g) => (
            <Sheet key={g.product} product={g.product} spec={g.spec} rows={g.rows} printLabel={printLabel} />
          ))}
        </div>
      </div>
    </div>
  )
}

const SL_CSS = `
.sl-overlay { position: fixed; inset: 0; z-index: 60; display: flex; flex-direction: column;
  background: #EDEAE2; font-family: 'Noto Sans TC', system-ui, sans-serif; color: #2B2B26; }
.sl-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 12px 20px; background: #fff; border-bottom: 1px solid #E5E1D8; box-shadow: 0 2px 6px rgba(43,43,38,.08); }
.sl-bar-title { font-size: 18px; font-weight: 700; }
.sl-bar-sub { display: block; margin-top: 2px; font-size: 13px; font-weight: 400; color: #6B6B62; }
.sl-bar-actions { display: flex; gap: 8px; }
.sl-btn { min-height: 44px; padding: 0 20px; font-size: 16px; font-weight: 700; border-radius: 4px; cursor: pointer; }
.sl-btn-primary { color: #fff; background: #1F6E43; border: 0; }
.sl-btn-ghost { color: #2B2B26; background: #fff; border: 2px solid #E5E1D8; }
.sl-scroll { flex: 1; overflow: auto; padding: 20px 16px; }
.sl-print { max-width: 960px; margin: 0 auto; }
.sl-sheet { background: #fff; padding: 20px 24px; margin: 0 auto 20px; border: 1px solid #E5E1D8;
  box-shadow: 0 1px 3px rgba(43,43,38,.06); }
.sl-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 10px; }
.sl-head h2 { margin: 0; font-size: 20px; }
.sl-count { font-size: 13px; color: #6B6B62; }
.sl-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.sl-table th, .sl-table td { border: 1px solid #C9C4B8; padding: 6px 8px; text-align: left; vertical-align: top; }
.sl-table th { background: #F0EDE6; font-weight: 700; white-space: nowrap; }
.sl-table td.c, .sl-table th.c { text-align: center; }
.sl-table .nowrap { white-space: nowrap; }
.sl-table tr.sl-has-remark td { background: #FFF3B0; }
.sl-table td.sl-remark { color: #C0392B; font-weight: 700; }
.sl-table td.sl-driver { color: #6B6B62; }
@media print {
  @page { size: A4 portrait; margin: 12mm; }
  html, body { background: #fff !important; }
  body * { visibility: hidden !important; }
  .sl-overlay, .sl-overlay * { visibility: visible !important; }
  .sl-overlay { position: absolute; inset: 0; background: #fff; }
  .sl-noprint { display: none !important; }
  .sl-scroll { overflow: visible; padding: 0; }
  .sl-print { max-width: none; }
  .sl-sheet { border: 0; box-shadow: none; padding: 0; margin: 0; break-after: page; page-break-after: always; }
  .sl-sheet:last-child { break-after: auto; page-break-after: auto; }
}
`
