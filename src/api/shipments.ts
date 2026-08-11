/**
 * 【DEMO 專屬】mock shipments API stub。
 *
 * 正式版此檔向後端取出貨清單、印單 PDF、出貨總表 PDF 等；本 demo 沒有後端，
 * 出貨清單改由 mock store（src/store.tsx）直接吃 seed 資料，印單也在 store 內以本地陣列模擬。
 * 這裡只保留農友端唯一還會 import 的 `fetchSummaryPdf`（備貨總覽的「列印出貨總表」），
 * 回傳一份即時產生的最小可開啟 PDF，讓 demo 的列印流程看起來可用、又不需任何後端或額外套件。
 */

// 產生一份最小但合法的單頁 PDF（xref offset 於執行期計算，確保各家 PDF 檢視器可開）。
function makeDemoSummaryPdf(): Blob {
  const enc = new TextEncoder()
  const header = '%PDF-1.4\n'
  const objs = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    (() => {
      const stream = 'BT /F1 22 Tf 60 780 Td (Shipping Summary - DEMO) Tj ET\n'
      return `5 0 obj\n<< /Length ${enc.encode(stream).length} >>\nstream\n${stream}endstream\nendobj\n`
    })(),
  ]

  let body = header
  const offsets: number[] = []
  for (const o of objs) {
    offsets.push(enc.encode(body).length)
    body += o
  }
  const xrefStart = enc.encode(body).length
  let xref = `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`
  for (const off of offsets) {
    xref += String(off).padStart(10, '0') + ' 00000 n \n'
  }
  const trailer = `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
  return new Blob([body + xref + trailer], { type: 'application/pdf' })
}

/** 出貨總表（demo）：把目前畫面清單出成一份示意用的最小 PDF（不挑日期）。 */
export async function fetchSummaryPdf(): Promise<Blob> {
  // 模擬後端產表的短暫等待，讓「產生中…」狀態看得到。
  await new Promise((r) => setTimeout(r, 500))
  return makeDemoSummaryPdf()
}
