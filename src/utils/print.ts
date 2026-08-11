/**
 * 印單前端超時。後端黑貓 HttpClient 給 2 分鐘、主站回寫給 4 分鐘，疊起來最壞情況農友會盯著
 * 面板等好幾分鐘（前端原本完全沒有超時，只能等後端或瀏覽器放棄）。90 秒是「黑貓偶爾比較慢」
 * 與「不讓人站著白等」之間的折衷。
 *
 * ⚠️ 提早放棄之所以安全：ShipmentPrintService 刻意**先把單號持久化**（Mongo OBT+FileNo、回寫
 * 主站 Orders.BlackCatNum）才下載 PDF，所以同一張單再打一次會走重用路徑、不再向黑貓取新號
 * —— 前端中止後重試不會多印一張。
 *
 * ⚠️ **唯一例外是補單**：它每次都取 count 個新號（新 FileNo）累加，重試會真的多出箱數。
 * 因此補單失敗不給重試按鈕，見 store 的 supplementOrder。
 */
export const PRINT_TIMEOUT_MS = 90_000

/** 等超過這麼久才在面板顯示「已等 N 秒」：幾秒就完成的正常情況跳秒數，反而像在強調很慢。 */
export const PRINT_COUNT_FROM_MS = 3_000

/** 等超過這麼久才補上「黑貓有時候要久一點」：越過一般人的耐心線，要明講不要重按。 */
export const PRINT_SLOW_MS = 20_000

/**
 * 最短顯示時間：讓「正在產生出貨單…」至少出現 ms 毫秒，避免請求很快時面板閃一下。
 *
 * ⚠️ 這和「先延遲再發請求」是兩件相反的事。延遲計時器與 work 是**並行**的，
 * 所以不增加總耗時；原本的寫法是 setTimeout(…, 2000) 之後才呼叫 API，
 * 固定延遲與真實耗時相加，農友每次印單都白等 2 秒、而且面板在真正的等待開始前就消失。
 *
 * 用 try/finally 而非 Promise.all：work 若 reject，Promise.all 會立刻 reject、
 * 最短顯示時間就失效；這裡不論成敗都等滿再往下，並原樣往外拋。
 */
export async function withMinDuration<T>(work: Promise<T>, ms = 400): Promise<T> {
  const floor = new Promise<void>((resolve) => window.setTimeout(resolve, ms))
  try {
    return await work
  } finally {
    await floor
  }
}

/**
 * 把黑貓託運單 PDF 交給列印。
 * - Android WebView 殼：若殼注入了原生列印橋接（window.FarmerPrint.printPdf(base64)），優先走它 → 系統列印框架（Mopria）。
 * - 一般瀏覽器（含開發 / Playwright）：開新分頁預覽，使用者可自行列印。
 */
export async function printPdfBlob(blob: Blob): Promise<void> {
  const bridge = (window as unknown as { FarmerPrint?: { printPdf?: (base64: string) => void } }).FarmerPrint
  if (bridge?.printPdf) {
    const base64 = await blobToBase64(blob)
    bridge.printPdf(base64)
    return
  }

  // 一般瀏覽器：開新分頁預覽（PDF 檢視器可列印或下載）；被彈窗擋（手機常見）則退成直接下載檔案。
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (!win) {
    const a = document.createElement('a')
    a.href = url
    a.download = '出貨單.pdf'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }
  // 延遲釋放，讓新分頁 / 下載有時間讀取
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const result = reader.result as string
      // data:application/pdf;base64,XXXX → 取 base64 本體
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.readAsDataURL(blob)
  })
}
