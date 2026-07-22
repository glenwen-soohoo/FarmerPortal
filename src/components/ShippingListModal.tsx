import type { Order } from '../types'
import {
  buildShippingSheets,
  unitOf,
  orderDate,
  farmerRemarkOf,
  lastShipDate,
} from '../utils/shippingList'

// 出貨總表（未出）預覽：幾乎滿版彈窗（背景遮罩＋四周留邊），非新分頁。
// 「列印 / 存成 PDF」呼叫 window.print()；列印時只留彈窗內容、其餘隱藏，
// 多個品項各自一頁但同屬一次列印＝同一份 PDF（見下方 @media print）。
// Demo 用瀏覽器列印產 PDF；正式版由後端直接出 A4 PDF（F2 §3-1）。

const COLS = ['序號', '收件人', '手機', '地址', '規格', '數量', '單位', '給農友備註', '客人訂購日期', '最後出貨日期']

function Sheet({ product, rows, printLabel }: {
  product: string
  rows: Order[]
  printLabel: string
}) {
  return (
    <section className="sl-sheet">
      <div className="sl-head">
        <h2>{`${printLabel} ${product}`}</h2>
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
                <td>{o.spec}</td>
                <td className="c">{o.qty}</td>
                <td className="c">{unitOf(o.spec)}</td>
                <td className="sl-remark">{farmerRemark}</td>
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
    <div className="sl-backdrop" role="dialog" aria-modal="true" aria-label="出貨總表預覽" onClick={onClose}>
      <style>{SL_CSS}</style>
      <div className="sl-dialog" onClick={(e) => e.stopPropagation()}>
        {/* 工具列（列印時隱藏） */}
        <div className="sl-bar sl-noprint">
          <div className="sl-bar-title">
            出貨總表（未出）· {printLabel}
            <span className="sl-bar-sub">{orders.length} 筆 · 共 {totalQty} 件 · {sheets.length} 種品項（每品項一頁、同一份 PDF）</span>
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
              <Sheet key={g.product} product={g.product} rows={g.rows} printLabel={printLabel} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const SL_CSS = `
.sl-backdrop { position: fixed; inset: 0; z-index: 60; display: flex; padding: 16px;
  background: rgba(43,43,38,.55); font-family: 'Noto Sans TC', system-ui, sans-serif; color: #2B2B26; }
.sl-dialog { margin: auto; width: 100%; height: 100%; max-width: 1200px; display: flex; flex-direction: column;
  overflow: hidden; background: #fff; border-radius: 8px; box-shadow: 0 12px 40px rgba(0,0,0,.28); }
.sl-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px;
  padding: 12px 20px; background: #fff; border-bottom: 1px solid #E5E1D8; }
.sl-bar-title { font-size: 18px; font-weight: 700; }
.sl-bar-sub { display: block; margin-top: 2px; font-size: 13px; font-weight: 400; color: #6B6B62; }
.sl-bar-actions { display: flex; gap: 8px; }
.sl-btn { min-height: 44px; padding: 0 20px; font-size: 16px; font-weight: 700; border-radius: 8px; cursor: pointer; }
.sl-btn-primary { color: #fff; background: #1F6E43; border: 0; }
.sl-btn-ghost { color: #2B2B26; background: #fff; border: 2px solid #E5E1D8; }
.sl-scroll { flex: 1; overflow: auto; padding: 20px 16px; background: #fff; }
.sl-print { max-width: 960px; margin: 0 auto; }
.sl-sheet { background: #fff; padding: 16px 20px; margin: 0 auto 20px; border: 1px solid #E5E1D8; overflow-x: auto; }
.sl-sheet:last-child { margin-bottom: 0; }
.sl-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
.sl-head h2 { margin: 0; font-size: 20px; }
.sl-count { font-size: 13px; color: #6B6B62; white-space: nowrap; }
/* 窄視窗不擠壓欄位：表格保底寬度，超出時 .sl-sheet 水平捲動 */
.sl-table { width: 100%; min-width: 680px; border-collapse: collapse; font-size: 13px; }
.sl-table th, .sl-table td { border: 1px solid #C9C4B8; padding: 6px 8px; text-align: left; vertical-align: top; }
.sl-table th { background: #F0EDE6; font-weight: 700; white-space: nowrap; }
.sl-table td.c, .sl-table th.c { text-align: center; }
.sl-table .nowrap { white-space: nowrap; }
.sl-table tr.sl-has-remark td { background: #FFF3B0; }
.sl-table td.sl-remark { color: #C0392B; font-weight: 700; }
@media print {
  @page { size: A4 portrait; margin: 12mm; }
  html, body { background: #fff !important; }
  body * { visibility: hidden !important; }
  .sl-backdrop, .sl-backdrop * { visibility: visible !important; }
  .sl-backdrop { position: absolute; inset: 0; padding: 0; background: #fff; display: block; }
  .sl-dialog { max-width: none; height: auto; border-radius: 0; box-shadow: none; overflow: visible; }
  .sl-noprint { display: none !important; }
  .sl-scroll { overflow: visible; padding: 0; }
  .sl-print { max-width: none; margin: 0; }
  .sl-sheet { border: 0; padding: 0; margin: 0; overflow-x: visible; break-after: page; page-break-after: always; }
  .sl-table { min-width: 0; }
  .sl-sheet:last-child { break-after: auto; page-break-after: auto; }
}
`
