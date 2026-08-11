/**
 * 【DEMO 專屬】mock API client 型別 stub。
 *
 * 正式（農友出貨平台）版的 api/client 會實際打後端 /api、處理 JWT 與逾時中止。
 * 本 demo 完全走 mock store、沒有後端，只需保留農友端檔案 import 到的錯誤型別，
 * 讓 Login / UnshippedPreview 的 `instanceof ApiError` / `instanceof TimeoutError` 分支可編譯。
 */

/** API 錯誤：帶 HTTP 狀態碼與後端回的訊息。 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** 前端主動中止：等超過 timeout 都沒回應。 */
export class TimeoutError extends Error {
  constructor(message = '等太久沒有回應') {
    super(message)
    this.name = 'TimeoutError'
  }
}

/** 連不上伺服器（DNS / 斷線 / 部署期間連線被拒）。 */
export class NetworkError extends Error {
  constructor(message = '連不上伺服器') {
    super(message)
    this.name = 'NetworkError'
  }
}

/** 這個錯誤是不是「整個後端連不上／掛了」。demo 無後端，一律 false。 */
export function isOfflineError(e: unknown): boolean {
  if (e instanceof NetworkError) return true
  return e instanceof ApiError && e.status >= 500
}
