import { useEffect, useState } from 'react'
import { useStore } from '../store'
import BigButton from './BigButton'

/**
 * 連不上後端、**且手上沒有任何清單**時取代內容區的維護畫面。頂部日期列與底部分頁留著——
 * 整個 App 都不見了會讓農友以為機器壞掉，而實際上只是後端在上版。
 *
 * ⚠️ 已經有清單時不走這裡，改由 FarmerLayout 掛一條橫幅、清單原封不動：
 * 農友可能正照著螢幕撿貨，把畫面清掉比讓他看到（已標明是舊的）資料更糟。
 * 這裡是「沒東西可保留」的那條路，所以話要講滿。
 *
 * 文案刻意不寫「系統維護中」：前端分不出「計畫中的部署」與「後端真的掛了」，兩者都是 5xx／連不上，
 * 寫成維護在真故障時是說謊。主標只講農友看得到的事實，副標用「可能」帶出最常見的原因。
 * 「不用關掉 App」是整段裡最重要的一句——那是農友唯一會做錯的動作（關掉重開只會更慢）。
 *
 * ⚠️ 沒有轉圈圈：`prefers-reduced-motion` 下動畫會被停掉（見 index.css 檔尾），
 * 停住的圈圈比沒有圈圈更糟。倒數本身每秒在變，已經足夠表達「它還在動」，而且比圈圈多給了資訊。
 */
export default function OfflineNotice() {
  const { retryAttempt, nextRetryAt, retryNow } = useStore()

  // 倒數在這裡 tick，不放 store：放 store 會讓整棵樹每秒重繪一次。
  // 500ms 而非 1s：用 1s 取樣一個以秒為單位的倒數，顯示會偶爾卡住或跳號。
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(t)
  }, [])

  const left = nextRetryAt ? Math.max(0, Math.ceil((nextRetryAt - now) / 1000)) : null

  return (
    // role="status"：讀屏會念出來，但不打斷（polite）。與既有三條橫幅同一套分工。
    <div role="status" aria-live="polite" className="flex justify-center py-10">
      <div
        className="anim-fade w-full max-w-md rounded-card border border-hairline bg-white px-6 py-8 text-center"
        style={{ boxShadow: 'var(--l1)' }}
      >
        <p className="text-2xl font-bold text-ink">暫時連不上</p>
        <p className="mt-3 text-lg leading-relaxed text-ink-sub">
          可能正在更新，通常一兩分鐘就好。
          <br />
          畫面會自己回來，不用關掉 App。
        </p>

        <div className="mt-6 flex justify-center">
          <BigButton onClick={retryNow}>立即重試</BigButton>
        </div>

        {/* 次數與倒數是「它真的在做事」的證據。第一次還沒重試過時不顯示次數，
            免得一進畫面就寫著「已自動重試 0 次」。 */}
        <p className="mt-4 text-base text-ink-faint">
          {retryAttempt > 0 && <>已自動重試 {retryAttempt} 次</>}
          {retryAttempt > 0 && left !== null && ' · '}
          {left !== null && <>{left} 秒後再試</>}
        </p>
      </div>
    </div>
  )
}
