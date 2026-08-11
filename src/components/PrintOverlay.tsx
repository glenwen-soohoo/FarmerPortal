import { useEffect, useState } from 'react'
import { PRINT_COUNT_FROM_MS, PRINT_SLOW_MS } from '../utils/print'

/**
 * 印單等待面板。單筆卡片／商品批次／企業批次共用這一份，且由 store 的 printBusy 驅動。
 *
 * 為什麼不留在各呼叫端的 local state（原本三份幾乎一樣的 JSX）：失敗提示條上的「重試」按鈕
 * 在 FarmerLayout，重試時呼叫端元件的 printing state 不會被設起來 —— 面板跳不出來，農友按了
 * 重試看不到任何反應。狀態收到 store 之後，不管從哪裡發起印單都會開同一個面板。
 *
 * 為什麼要跳秒數：黑貓偶爾要 20 秒以上，靜止不動的面板讓農友以為卡住 → 按第二次或直接離開。
 * 秒數從 PRINT_COUNT_FROM_MS 才出現，免得幾秒就完成的正常情況被強調成「很慢」。
 */
export default function PrintOverlay({ title, detail }: { title: string; detail: string }) {
  const [ms, setMs] = useState(0)

  useEffect(() => {
    const t0 = Date.now()
    // 用真實時間差而非累加計數：平板休眠／WebView 被降頻時 interval 會被拉長，累加會嚴重低估。
    const id = window.setInterval(() => setMs(Date.now() - t0), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div
      className="anim-fade fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'var(--scrim)' }}
    >
      <div
        role="status"
        className="anim-pop rounded-card bg-white px-10 py-8 text-center"
        style={{ boxShadow: 'var(--l3)' }}
      >
        <p className="text-2xl font-bold text-ink">{title}</p>
        <p className="mt-2 text-base text-ink-sub">{detail}</p>
        {/* 秒數 aria-hidden：role=status 會把每次變動唸出來，讀屏使用者會被每秒一次的「已等 N 秒」淹掉。 */}
        {ms >= PRINT_COUNT_FROM_MS && (
          <p className="mt-3 text-base font-bold text-ink" aria-hidden>
            已等 {Math.floor(ms / 1000)} 秒
          </p>
        )}
        {/* 這句只出現一次，讓它被唸出來是對的：它要阻止「重按一次」這個動作。 */}
        {ms >= PRINT_SLOW_MS && <p className="mt-2 text-base text-notice">黑貓有時候要久一點，請不要關掉或重按</p>}
      </div>
    </div>
  )
}
