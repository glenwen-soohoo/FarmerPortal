// 自動吃新版（Kiosk 平板零操作）：定時比對「線上 bundle 版本 vs 目前執行版本」，
// 發現新版且閒置時 location.reload()。主力＝定時器（螢幕恆亮不休眠也照跑），另在回前景時補查。
// 搭配後端 index.html no-cache（reload 才真的抓到新 bundle）。只在 production build 生效（dev 走 Vite HMR）。

const POLL_MS = 90_000 // 每 90 秒查一次有無新版
const IDLE_MS = 30_000 // 最近 30 秒無操作才視為閒置、才自動重載（避免打斷農友批次/列印）

// Vite 產物進入點 <script type="module" src="/assets/index-<hash>.js">；hash 隨內容變 → 當版本指紋。
const ENTRY_RE = /\/assets\/index-[A-Za-z0-9_-]+\.js/

function normEntry(text: string | null | undefined): string {
  return text?.match(ENTRY_RE)?.[0] ?? ''
}

function currentEntry(): string {
  const el = document.querySelector('script[type="module"][src*="/assets/index-"]')
  return normEntry(el?.getAttribute('src'))
}

async function deployedEntry(): Promise<string> {
  try {
    const res = await fetch('/', { cache: 'no-store' })
    return res.ok ? normEntry(await res.text()) : ''
  } catch {
    return '' // 離線／暫時失敗 → 下次再查
  }
}

export function initAutoUpdate(): void {
  // 【DEMO 專屬】此站是 gh-pages 靜態 demo、沒有後端也沒有部署輪替，
  // 自動吃新版一律關閉：避免向站台根路徑輪詢、或在無對應 bundle 時觸發重載迴圈。
  // 正式（農友出貨平台）環境保留下方原始邏輯。
  return
  if (import.meta.env.DEV) return // 本機 dev 走 Vite HMR，不輪詢
  const mine = currentEntry()
  if (!mine) return

  let lastInteraction = Date.now()
  const bump = () => {
    lastInteraction = Date.now()
  }
  for (const ev of ['click', 'keydown', 'touchstart', 'pointerdown']) {
    window.addEventListener(ev, bump, { passive: true })
  }

  let updatePending = false
  const check = async () => {
    if (!updatePending) {
      const live = await deployedEntry()
      if (live && live !== mine) updatePending = true
    }
    if (!updatePending) return
    // 後台（/admin）同仁可能正在編輯 → 不強制重載；閒置足夠才重載。後端 index.html no-cache 讓重載抓到新 bundle。
    const onAdmin = location.hash.startsWith('#/admin')
    if (!onAdmin && Date.now() - lastInteraction > IDLE_MS) location.reload()
  }

  window.setInterval(() => void check(), POLL_MS)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void check()
  })
  window.addEventListener('focus', () => void check())
}
