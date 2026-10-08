import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import { useAuth } from '../../auth'
import { usePullToRefresh } from '../../hooks/usePullToRefresh'
import { useNewOrderAlert } from '../../hooks/useNewOrderAlert'
import { initAudioUnlock } from '../../utils/newOrderAlert'
import DevPanel from '../../dev/DevPanel'
import PrintOverlay from '../../components/PrintOverlay'
import OfflineNotice from '../../components/OfflineNotice'
import { isInShippablePage, isInUpcomingPage, orderTimeTag } from '../../utils/shipDate'

// 字體大小級距：預設 16px，可調小一級、調大兩級（rem 基準，內容區塊會等比縮放）
export const FONT_LEVELS = [
  { label: '小', px: 14 },
  { label: '預設', px: 16 },
  { label: '大', px: 18 },
]

// 字級要跨開關 App 記住：農友多為高齡，調完字級每次重開又回預設等於這個設定沒用。
// 存本機即可（個人裝置偏好，比照 fp.newOrderAlert；不需跟著帳號跨裝置）。
const FONT_KEY = 'fp.fontPx'
const DEFAULT_FONT_PX = 16
function readFontPx(): number {
  const n = Number(localStorage.getItem(FONT_KEY))
  // 只認清單內的級距：擋掉手改 localStorage 或舊值造成的怪字級
  return FONT_LEVELS.some((lv) => lv.px === n) ? n : DEFAULT_FONT_PX
}

// 給子頁用：鎖住底部分頁（批次模式）、開發用測試日期、提早出貨資格、字體大小
export interface FarmerOutletCtx {
  setNavLocked: (v: boolean) => void
  today: string
  earlyEligible: boolean
  fontPx: number
  setFontPx: (v: number) => void
}

const TITLES: Record<string, string> = {
  '/farmer/shippable': '需出貨',
  '/farmer/upcoming': '出貨預告',
  '/farmer/preview': '備貨總覽',
  '/farmer/all': '所有訂單',
  '/farmer/me': '我的設定',
}

// 「更多」收納的低頻分頁（≥560 底部分頁用）
const MORE_ROUTES = ['/farmer/all', '/farmer/me']
const MORE_ITEMS = [
  { to: '/farmer/all', label: '所有訂單查詢' },
  { to: '/farmer/me', label: '我的設定' },
]

/**
 * 底部分頁的圖示。手寫 inline SVG、不引套件 —— 只有四個，一組圖示庫的維護成本換不到東西。
 * 24 格座標、單一 path、吃 currentColor，所以選中／鎖定的顏色不必另外處理。
 * ⚠️ 這裡是農友端唯一用 SVG 當圖示的地方；其餘符號（☰ ✕ ▴ ▾ ‹ › ✓ ＋ −）仍走 Unicode。
 */
const TAB_ICON: Record<string, string> = {
  // 箱子：需出貨
  box: 'M12 2.6 3.2 6.9v10.2L12 21.4l8.8-4.3V6.9L12 2.6Zm0 2.1 6.1 3-6.1 3-6.1-3 6.1-3ZM5.1 8.9l5.9 2.9v6.4l-5.9-2.9V8.9Zm7.8 9.3v-6.4l5.9-2.9v6.4l-5.9 2.9Z',
  // 日曆：出貨預告
  cal: 'M6.6 2v2H4.9A1.9 1.9 0 0 0 3 5.9v13.2A1.9 1.9 0 0 0 4.9 21h14.2a1.9 1.9 0 0 0 1.9-1.9V5.9A1.9 1.9 0 0 0 19.1 4h-1.7V2h-2v2H8.6V2h-2Zm12.5 7.6v9.5H4.9V9.6h14.2ZM7 12h3v3H7Zm5 0h3v3h-3Z',
  // 清單板：備貨總覽
  list: 'M15.6 2H8.4a1.9 1.9 0 0 0-1.8 1.3H5.4A1.9 1.9 0 0 0 3.5 5.2v14.9A1.9 1.9 0 0 0 5.4 22h13.2a1.9 1.9 0 0 0 1.9-1.9V5.2a1.9 1.9 0 0 0-1.9-1.9h-1.2A1.9 1.9 0 0 0 15.6 2Zm2.9 3.3v14.8H5.4V5.3h1.2v1.3h10.8V5.3h1.1ZM7.6 9h8.8v1.7H7.6Zm0 3.6h8.8v1.7H7.6Zm0 3.6h5.6v1.7H7.6Z',
}

/** 三點（更多）另外畫：三個圓比 path 清楚，也不必為它硬湊一條路徑。 */
function TabIcon({ name }: { name: string }) {
  if (name === 'more')
    return (
      <svg className="fp-tb-ic" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="5.5" cy="12" r="2.1" fill="currentColor" />
        <circle cx="12" cy="12" r="2.1" fill="currentColor" />
        <circle cx="18.5" cy="12" r="2.1" fill="currentColor" />
      </svg>
    )
  return (
    <svg className="fp-tb-ic" viewBox="0 0 24 24" aria-hidden="true">
      <path d={TAB_ICON[name]} fill="currentColor" />
    </svg>
  )
}

// 今日日期顯示：'YYYY-MM-DD' → 'M/D'
function formatToday(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  return `${m}/${d}`
}

export default function FarmerLayout() {
  const {
    orders,
    currentFarmerId,
    connected,
    offline,
    retryAttempt,
    retryNow,
    reload,
    loading,
    actionError,
    actionRetry,
    clearActionError,
    printBusy,
  } = useStore()
  const { farmer } = useAuth()
  const loc = useLocation()
  const navigate = useNavigate()
  const [navLocked, setNavLocked] = useState(false)
  // 出貨判定基準。正式版用真實今天 todayIso()；DEMO 版固定 2026-06-12 對齊 6 月假資料（開發面板可覆寫）。
  const [today, setToday] = useState('2026-06-12')
  const [earlyEligible, setEarlyEligible] = useState<boolean>(farmer?.earlyShipAllowed ?? false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [fontPx, setFontPxState] = useState(readFontPx)
  // useCallback：這個函式會進 Outlet context，每次 render 換新參照會讓所有子頁重繪（見下方 ctx 的註解）
  const setFontPx = useCallback((v: number) => {
    setFontPxState(v)
    try {
      localStorage.setItem(FONT_KEY, String(v))
    } catch {
      // 私密模式 / 儲存額度滿：字級當次仍生效，只是不留存，不該讓設定頁報錯
    }
  }, [])
  const [isNarrow, setIsNarrow] = useState(false) // 手機版：寬 < 560px
  const [drawerOpen, setDrawerOpen] = useState(false) // 手機版漢堡選單

  // 連線中斷橫幅：連線掉了持續 >3s 才顯示，避免瞬斷 / 初次連線的閃爍。
  const [showDisconnected, setShowDisconnected] = useState(false)
  useEffect(() => {
    if (connected) {
      setShowDisconnected(false)
      return
    }
    const t = window.setTimeout(() => setShowDisconnected(true), 3000)
    return () => window.clearTimeout(t)
  }, [connected])

  // 下拉重整（掛在 <main> 捲動根；批次模式停用），兼作 SignalR 斷線時的手動同步。
  const { scrollRef, pull, refreshing, threshold } = usePullToRefresh(reload, navLocked)

  // 新訂單提醒：偵測「新出現且今天要出貨」的單 → 震動 + 提示音 + 頂部提示條。
  const { newCount, dismiss: dismissNewOrder } = useNewOrderAlert(orders, currentFarmerId, today, loading)
  // 首次使用者手勢解鎖音訊（Web Audio fallback 用；殼走原生橋不受影響）。
  useEffect(() => initAudioUnlock(), [])

  // 監聽是否進入手機版（<560px）
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 559px)')
    const on = () => setIsNarrow(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  // 調整 <html> 基準字級 → 農友端所有 rem 文字/間距/寬度等比縮放；離開還原。
  // ⚠️ 移除了原本的「手機版再縮 0.8 倍、下限 11px」。實測那條會把最小的字級壓到不可讀：
  //    「小」＋手機時 html=11px，`.oc-cta-sub`（取新物流編號）只有 6.8px、
  //    `.oc-det-k`（收件資訊欄名）7.3px。而 <560px 時版面本來就已經改成單欄堆疊
  //    （.oc-row 轉 column、.oc-l1 開 flex-wrap），字不需要再縮才放得下——
  //    那個 0.8 只是在既有的重排之上又疊一次縮小，純粹是可讀性損失。
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontPx}px`
    return () => {
      document.documentElement.style.fontSize = ''
    }
  }, [fontPx])

  // ⚠️ 這個物件必須 memo：它是 OutletContext 的 value，每次 render 換新參照就會讓所有
  // useOutletContext 的子頁重繪 —— 而本元件的 state 變動很頻繁（下拉位移每帧、connected、
  // newCount、moreOpen、drawerOpen、isNarrow、fontPx）。子頁重繪會重跑未 memo 的
  // filter + sortForFarmer（實測 n=300 為 7.97ms、平板約 30–60ms），把下拉重整推進掉帧區。
  const ctx = useMemo<FarmerOutletCtx>(
    () => ({ setNavLocked, today, earlyEligible, fontPx, setFontPx }),
    [today, earlyEligible, fontPx, setFontPx]
  )

  const mine = orders.filter((o) => o.farmerId === currentFarmerId)
  const shippableCount = mine.filter((o) => isInShippablePage(o, today)).length
  const upcomingCount = mine.filter((o) => isInUpcomingPage(o, today)).length
  // 需出貨標題右側的急迫度統計標籤（逾期未出／指定今日／今日到期／快到期，各帶 ×N；只顯示非零）。
  const urgencyBadges = (() => {
    let overdue = 0, forcedToday = 0, dueToday = 0, nearDue = 0
    for (const o of mine) {
      if (!isInShippablePage(o, today)) continue
      const t = orderTimeTag(o, today)
      if (!t) continue
      if (t.label === '逾期未出') overdue++
      else if (t.label === '客人指定今日出貨') forcedToday++
      else if (t.label === '今日到期') dueToday++
      else if (t.label === '快到期') nearDue++
    }
    const arr: { label: string; n: number; tone: 'urgent' | 'notice' }[] = []
    if (overdue) arr.push({ label: '逾期未出', n: overdue, tone: 'urgent' })
    if (forcedToday) arr.push({ label: '指定今日', n: forcedToday, tone: 'urgent' })
    if (dueToday) arr.push({ label: '今日到期', n: dueToday, tone: 'urgent' })
    if (nearDue) arr.push({ label: '快到期', n: nearDue, tone: 'notice' })
    return arr
  })()

  const tabs = [
    { to: '/farmer/shippable', label: '需出貨', count: shippableCount, icon: 'box' },
    { to: '/farmer/upcoming', label: '出貨預告', count: upcomingCount, icon: 'cal' },
    { to: '/farmer/preview', label: '備貨總覽', icon: 'list' },
  ]
  // 手機版漢堡選單：完整分頁清單
  const drawerNav: { to: string; label: string; count?: number }[] = [
    { to: '/farmer/shippable', label: '需出貨', count: shippableCount },
    { to: '/farmer/upcoming', label: '出貨預告', count: upcomingCount },
    { to: '/farmer/preview', label: '備貨總覽' },
    { to: '/farmer/all', label: '所有訂單查詢' },
    { to: '/farmer/me', label: '我的設定' },
  ]
  const pageTitle = TITLES[loc.pathname] ?? '農友出貨平台'
  const moreActive = MORE_ROUTES.includes(loc.pathname)

  const go = (to: string) => {
    if (navLocked) return
    setMoreOpen(false)
    setDrawerOpen(false)
    navigate(to)
  }

  return (
    <div className="farmer-scope flex h-dvh flex-col overflow-hidden bg-page">
      {/* 頂部薄 header：頁名（用影子與內容區分隔） */}
      <header className="fp-hd relative z-40 flex shrink-0 items-center justify-between border-b border-hairline">
        {/* flex-wrap：標籤多到擠不下時整排換行，而不是把每顆標籤壓窄（壓窄會讓「逾期未出 ×12」斷字）。
            每顆標籤 shrink-0 + whitespace-nowrap 保證自身不被壓縮、不斷行。 */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {/* 最左：今日日期（與頁名同大、深綠色）＋分隔線 */}
          <span className="fp-hd-dt whitespace-nowrap text-ink">{formatToday(today)}</span>
          <span className="h-7 w-px shrink-0 bg-hairline" aria-hidden />
          <h1 className="fp-hd-ti text-ink-sub">{pageTitle}</h1>
          {loc.pathname === '/farmer/shippable' &&
            urgencyBadges.map((b) => (
              <span
                key={b.label}
                className={`fp-hd-badge inline-flex shrink-0 items-center whitespace-nowrap rounded-full ${
                  b.tone === 'urgent' ? 'bg-urgent/10 text-urgent' : 'bg-notice/10 text-notice'
                }`}
              >
                {b.label} ×{b.n}
              </span>
            ))}
        </div>
        {isNarrow ? (
          /* 手機版漢堡鈕：<560 時底部分頁整條不渲染，這是唯一的換頁入口，所以必須有 44px 方框
             （原本是裸 button 只有 text-3xl，實測小字級時只有 18.5×20.6px）。
             批次模式下鎖定：改用原生 disabled（會自動離開 tab 序列並被 AT 播報）＋ text-muted，
             不用 opacity —— 那會把字壓到 2.53:1。 */
          <button
            onClick={() => !navLocked && setDrawerOpen((v) => !v)}
            aria-label={drawerOpen ? '關閉選單' : '開啟選單'}
            aria-expanded={drawerOpen}
            disabled={navLocked}
            className={`grid place-items-center text-3xl leading-none ${navLocked ? 'text-ink-faint' : 'text-ink'}`}
            style={{ minWidth: 'max(2.75rem, 44px)', minHeight: 'max(2.75rem, 44px)' }}
          >
            {drawerOpen ? '✕' : '☰'}
          </button>
        ) : (
          /* 右上：農園名稱 */
          <span className="fp-hd-farm whitespace-nowrap text-ink-sub">{farmer?.name}</span>
        )}

        {/* 手機版漢堡展開的選單（蓋在內容上、含所有分頁） */}
        {isNarrow && drawerOpen && (
          <>
            <div className="anim-fade fixed inset-0 z-30" onClick={() => setDrawerOpen(false)} aria-hidden />
            <div
              className="anim-slide-down absolute left-0 right-0 top-full z-40 max-h-[70vh] overflow-y-auto border-b border-hairline bg-white"
              style={{ boxShadow: 'var(--l2)' }}
            >
              {/* 農園名稱 */}
              <div className="border-b border-hairline px-5 py-3 text-lg font-bold text-ink">{farmer?.name}</div>
              {drawerNav.map((it) => (
                <button
                  key={it.to}
                  onClick={() => go(it.to)}
                  className={`flex w-full items-center justify-between border-b border-hairline px-5 text-lg font-bold ${
                    loc.pathname === it.to ? 'bg-act text-white' : 'text-ink'
                  }`}
                  style={{ minHeight: 56 }}
                >
                  <span>{it.label}</span>
                  {typeof it.count === 'number' && <span className="text-base font-normal">{it.count} 單</span>}
                </button>
              ))}
            </div>
          </>
        )}
      </header>

      {/* ── 四條橫幅都是 live region ──
          ⚠️ 容器必須常駐 DOM：live region 若和內容一起條件 render，插入時輔助科技不會播報。
          所以外層 <div> 永遠存在（無內容時不套 .fp-bn，高度為 0），只有內部條件 render。
          role 分工：操作失敗用 alert（assertive，印單失敗要立刻打斷）；
          連線中斷與新訂單用 status（polite，不打斷正在進行的印單）。 */}

      {/* 後端連不上、但手上還有上一次抓到的清單：留著清單、只掛一條橫幅。
          農友可能正照著螢幕撿貨，把畫面清空比讓他看到（已標明是舊的）資料更糟。
          手上沒清單時走另一條路——內容區換成 OfflineNotice（見下方 <main>）。
          ⚠️ 沒有倒數：倒數要每秒 tick，而這裡是 FarmerLayout，每秒重繪整個外殼不划算；
          「它還在動」由自動遞增的重試次數與那顆鈕承擔。倒數留給 OfflineNotice（它自己 tick）。 */}
      <div role="status" aria-live="polite" className={offline && orders.length > 0 ? 'fp-bn is-warn shrink-0' : undefined}>
        {offline && orders.length > 0 && (
          <>
            <span className="fp-bn-t">暫時連不上</span>
            <span className="fp-bn-m">
              畫面是剛才的資料，正在自動重試{retryAttempt > 0 && `（已試 ${retryAttempt} 次）`}
            </span>
            <button className="fp-bn-b is-pri" onClick={retryNow}>
              立即重試
            </button>
          </>
        )}
      </div>

      {/* 連線中斷橫幅（SignalR 掉線 >3s）：提示可下拉重整。
          ⚠️ offline 時不顯示：後端掛掉時 SignalR 一定也斷，兩條會同時出現、講同一件事，
          而上面那條資訊更多（會自己重試、還有按鈕）。留一條就好。 */}
      <div role="status" aria-live="polite" className={showDisconnected && !offline ? 'fp-bn is-warn shrink-0' : undefined}>
        {showDisconnected && !offline && (
          <>
            <span className="fp-bn-t">連線中斷</span>
            <span className="fp-bn-m">正在重新連線，可下拉重新整理</span>
          </>
        )}
      </div>

      {/* 動作失敗提示條（印單／批次／重印／補單）：只跳提示，清單保持原樣 —— 不可再用 store.error 取代整份清單。 */}
      <div role="alert" className={actionError ? 'fp-bn is-err anim-slide-down shrink-0' : undefined}>
        {actionError && (
          <>
            <span className="fp-bn-t">⚠ 操作失敗</span>
            <span className="fp-bn-m">{actionError}</span>
            {/* 重試只在後端會沿用原單號時出現（印單／批次／重印）；補單會取新號，store 給 null。
                先取出再 clear：clearActionError 會把 actionRetry 一起清成 null。 */}
            {actionRetry && (
              <button
                className="fp-bn-b is-pri"
                onClick={() => {
                  const retry = actionRetry
                  clearActionError()
                  retry()
                }}
              >
                重試
              </button>
            )}
            <button className="fp-bn-b" onClick={clearActionError}>
              知道了
            </button>
          </>
        )}
      </div>

      {/* 新訂單提示條：偵測到「新出現且今天要出貨」的單時顯示（震動/提示音已同時發生）。 */}
      <div role="status" aria-live="polite" className={newCount > 0 ? 'fp-bn is-new anim-slide-down shrink-0' : undefined}>
        {newCount > 0 && (
          <>
          <span className="fp-bn-t">🔔 有新訂單 {newCount} 筆</span>
          <span className="fp-bn-m">今天要出貨</span>
          <button
            className="fp-bn-b is-pri"
            onClick={() => {
              dismissNewOrder()
              go('/farmer/shippable')
            }}
          >
            查看
          </button>
          <button className="fp-bn-b" onClick={dismissNewOrder}>
            知道了
          </button>
          </>
        )}
      </div>

      {/* 下拉重整指示（固定於頂部、不擋操作）。
          內層刻意保留 rounded-full：這是隨手勢短暫浮現的 toast，用圓形與常駐的方角標籤區隔。 */}
      {(pull > 0 || refreshing) && (
        <div
          className="pointer-events-none fixed left-1/2 z-40 -translate-x-1/2"
          style={{ top: 64, opacity: refreshing ? 1 : Math.min(1, pull / threshold) }}
        >
          <div
            className="rounded-full bg-white px-4 py-2 text-base font-medium text-act"
            style={{
              boxShadow: 'var(--l2)',
              transform: `translateY(${refreshing ? 8 : Math.max(0, pull - 16)}px)`,
            }}
          >
            {refreshing ? '更新中…' : pull >= threshold ? '放開更新' : '下拉更新'}
          </div>
        </div>
      )}

      {/* 內容區（獨立捲動）。內層限寬 960px（60rem，隨字體縮放）、置中 */}
      <main ref={scrollRef} className="isolate flex-1 overflow-y-auto overflow-x-hidden">
        <div className="relative mx-auto w-full p-4" style={{ maxWidth: '60rem' }}>
          {/* 批次模式：半透明深色遮罩罩住「選中商品以外」的內容（隨內容捲動、不蓋 header/選單） */}
          {navLocked && <div className="anim-fade absolute inset-0 z-30" style={{ background: 'var(--scrim)' }} aria-hidden />}
          {/* 連不上且**手上沒有清單**時，內容區換成維護畫面（外殼與分頁留著）。
              有清單的情況走上面那條橫幅，畫面不動——兩條路的取捨見橫幅處的註解。
              放在 layout 而不是各頁：每一頁的資料都來自同一次抓取，逐頁各寫一份只會漏掉其中幾頁。
              ⚠️「我的設定」除外——它整頁不打 API（字級與提醒開關都存 localStorage），
              後端掛掉時它仍然完全可用，蓋掉等於平白拿掉一個還能用的功能。 */}
          {offline && orders.length === 0 && loc.pathname !== '/farmer/me' ? (
            <OfflineNotice />
          ) : (
            <Outlet context={ctx} />
          )}
        </div>
      </main>

      {/* 底部 Tab Bar（≥560 才顯示；<560 改用 header 漢堡選單）。批次模式鎖定 */}
      {!isNarrow && (
      <nav
        className="fp-tabs relative z-10 flex shrink-0 border-t border-hairline"
        style={
          // 批次模式：整條選單改灰底、不可點（文字再淺由 .fp-tb.is-locked 的 ink-faint 承擔）。
          // ⚠️ 不要疊 opacity 讓它「看起來鎖住」——整條半透明會把文字對比壓到 2.26:1。
          // 「鎖住」已經由 is-locked 的 ink-faint 與 pointer-events: none 講清楚了。
          navLocked ? { pointerEvents: 'none', background: 'var(--c-inset)' } : undefined
        }
      >
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            onClick={() => setMoreOpen(false)}
            className={({ isActive }) =>
              `fp-tb ${navLocked ? 'is-locked' : isActive ? 'is-on' : ''}`
            }
          >
            <span className="fp-tb-w">
              <TabIcon name={t.icon} />
              {/* 0 不渲染角標（慣例）；沒有角標＝今天沒有這一類 */}
              {typeof t.count === 'number' && t.count > 0 && <span className="fp-tb-b">{t.count}</span>}
            </span>
            <span>{t.label}</span>
          </NavLink>
        ))}

        {/* 更多：彈出低頻分頁 */}
        <button
          onClick={() => setMoreOpen((v) => !v)}
          className={`fp-tb ${navLocked ? 'is-locked' : moreActive || moreOpen ? 'is-on' : ''}`}
        >
          {/* 展開狀態不靠圖示切換講：面板本身就在畫面上，加上 is-on 的綠膠囊已經夠 */}
          <span className="fp-tb-w"><TabIcon name="more" /></span>
          <span>更多</span>
        </button>

        {moreOpen && (
          <div
            /* 浮動面板＝表面級圓角（rounded-t-card），不是控制級 8px。只圓上緣：下緣要貼齊分頁條 */
            className="anim-slide-up absolute bottom-full right-0 mb-0 w-64 overflow-hidden rounded-t-card border border-hairline bg-white"
            style={{ boxShadow: 'var(--l2)' }}
          >
            {MORE_ITEMS.map((it) => (
              <button
                key={it.to}
                onClick={() => go(it.to)}
                className={`flex w-full items-center px-5 text-lg font-bold ${
                  loc.pathname === it.to ? 'bg-act text-white' : 'text-ink'
                }`}
                style={{ minHeight: 60 }}
              >
                {it.label}
              </button>
            ))}
          </div>
        )}
      </nav>
      )}

      {/* 印單等待面板：單筆／批次／企業批次與提示條上的「重試」共用這一份（狀態在 store） */}
      {printBusy && <PrintOverlay title={printBusy.title} detail={printBusy.detail} />}

      {/* 開發面板：本 repo 為 demo 站，正式 build（gh-pages）也顯示，供展示時切換測試日／提早出貨等 */}
      <DevPanel
        today={today}
        onChange={setToday}
        shippableCount={shippableCount}
        upcomingCount={upcomingCount}
        earlyEligible={earlyEligible}
        onToggleEarly={() => setEarlyEligible((v) => !v)}
      />
    </div>
  )
}
