import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import DevPanel from '../../dev/DevPanel'
import { DEFAULT_DEV_TODAY, isInShippablePage, isInUpcomingPage } from '../../utils/shipDate'

// 字體大小級距：預設 16px，可調小一級、調大兩級（rem 基準，內容區塊會等比縮放）
export const FONT_LEVELS = [
  { label: '小', px: 14 },
  { label: '預設', px: 16 },
  { label: '大', px: 18 },
]

// 給子頁用：鎖住底部分頁（批次模式）、開發用測試日期、提早出貨資格、印表機、字體大小
export interface FarmerOutletCtx {
  setNavLocked: (v: boolean) => void
  today: string
  earlyEligible: boolean
  printerConnected: boolean
  setPrinterConnected: (v: boolean) => void
  fontPx: number
  setFontPx: (v: number) => void
}

const TITLES: Record<string, string> = {
  '/farmer/shippable': '需出貨',
  '/farmer/upcoming': '出貨預告',
  '/farmer/preview': '備貨總覽',
  '/farmer/all': '所有訂單',
  '/farmer/printer': '印表機設定',
  '/farmer/me': '我的設定',
}

// 「更多」收納的低頻分頁（≥560 底部分頁用）
const MORE_ROUTES = ['/farmer/all', '/farmer/printer', '/farmer/me']
const MORE_ITEMS = [
  { to: '/farmer/all', label: '所有訂單查詢' },
  { to: '/farmer/printer', label: '印表機設定' },
  { to: '/farmer/me', label: '我的設定' },
]

// 今日日期顯示：'YYYY-MM-DD' → 'M/D'
function formatToday(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  return `${m}/${d}`
}

// 印表機狀態圖示（連線＝綠、未連線＝紅）
function PrinterIcon({ connected }: { connected: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={connected ? '#2E7D32' : '#C0392B'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 9V3h12v6" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="7" rx="1" />
    </svg>
  )
}

export default function FarmerLayout() {
  const { orders, currentFarmerId, farmers, setCurrentFarmerId } = useStore()
  const loc = useLocation()
  const navigate = useNavigate()
  const me = farmers.find((f) => f.id === currentFarmerId)
  const [navLocked, setNavLocked] = useState(false)
  const [today, setToday] = useState(DEFAULT_DEV_TODAY)
  const [printerConnected, setPrinterConnected] = useState(true)
  const [earlyEligible, setEarlyEligible] = useState<boolean>(me?.earlyShipAllowed ?? false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [fontPx, setFontPx] = useState(16)
  const [isNarrow, setIsNarrow] = useState(false) // 手機版：寬 < 560px
  const [drawerOpen, setDrawerOpen] = useState(false) // 手機版漢堡選單

  // 監聽是否進入手機版（<560px）
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 559px)')
    const on = () => setIsNarrow(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  // 調整 <html> 基準字級 → 農友端所有 rem 文字/間距/寬度等比縮放；手機版再縮 0.8 倍；離開還原
  useEffect(() => {
    const px = isNarrow ? Math.max(11, Math.round(fontPx * 0.8)) : fontPx
    document.documentElement.style.fontSize = `${px}px`
    return () => {
      document.documentElement.style.fontSize = ''
    }
  }, [fontPx, isNarrow])

  const mine = orders.filter((o) => o.farmerId === currentFarmerId)
  const shippableCount = mine.filter((o) => isInShippablePage(o, today)).length
  const upcomingCount = mine.filter((o) => isInUpcomingPage(o, today)).length
  const todayMMDD = `${today.slice(5, 7)}/${today.slice(8, 10)}`
  const forcedTodayCount = mine.filter((o) => isInShippablePage(o, today) && o.forcedShipDate === todayMMDD).length

  const tabs = [
    { to: '/farmer/shippable', label: '需出貨', count: shippableCount },
    { to: '/farmer/upcoming', label: '出貨預告', count: upcomingCount },
    { to: '/farmer/preview', label: '備貨總覽' },
  ]
  // 手機版漢堡選單：完整分頁清單
  const drawerNav: { to: string; label: string; count?: number }[] = [
    { to: '/farmer/shippable', label: '需出貨', count: shippableCount },
    { to: '/farmer/upcoming', label: '出貨預告', count: upcomingCount },
    { to: '/farmer/preview', label: '備貨總覽' },
    { to: '/farmer/all', label: '所有訂單查詢' },
    { to: '/farmer/printer', label: '印表機設定' },
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
    <div className="farmer-scope flex h-dvh flex-col overflow-hidden bg-canvas">
      {/* 頂部薄 header：頁名 + 印表機連線燈（用影子與內容區分隔） */}
      <header
        className="relative z-40 flex shrink-0 items-center justify-between border-b border-line bg-white px-5 py-3"
        style={{ boxShadow: '0 3px 8px rgba(43,43,38,0.08)' }}
      >
        <div className="flex items-center gap-3">
          {/* 最左：今日日期（與頁名同大、深綠色） */}
          <span className="whitespace-nowrap text-2xl font-bold text-brand">{formatToday(today)}</span>
          <span className="h-7 w-px shrink-0 bg-line" aria-hidden />
          <h1 className="text-2xl font-bold text-ink">{pageTitle}</h1>
          {loc.pathname === '/farmer/shippable' && forcedTodayCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-danger/10 px-3 py-1 text-lg font-bold text-danger">
              指定今日 {forcedTodayCount} 單
            </span>
          )}
        </div>
        {isNarrow ? (
          /* 手機版：漢堡選單鈕（批次模式下鎖定） */
          <button
            onClick={() => !navLocked && setDrawerOpen((v) => !v)}
            aria-label="選單"
            className="text-3xl leading-none text-ink"
            style={{ opacity: navLocked ? 0.4 : 1 }}
          >
            {drawerOpen ? '✕' : '☰'}
          </button>
        ) : (
          /* 右上：果園名稱 + 印表機狀態圖示（已連線＝綠圖示；未連線＝紅圖示＋左側文字） */
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPrinterConnected((v) => !v)}
              className="flex items-center gap-2"
              aria-label={printerConnected ? '印表機已連線' : '印表機未連線'}
            >
              {!printerConnected && (
                <span className="whitespace-nowrap text-base font-medium text-danger">印表機未連線</span>
              )}
              <PrinterIcon connected={printerConnected} />
            </button>
            <span className="whitespace-nowrap text-lg font-bold text-ink">{me?.farm}</span>
          </div>
        )}

        {/* 手機版漢堡展開的選單（蓋在內容上、含所有分頁與印表機狀態） */}
        {isNarrow && drawerOpen && (
          <>
            <div className="anim-fade fixed inset-0 z-30" onClick={() => setDrawerOpen(false)} aria-hidden />
            <div
              className="anim-slide-down absolute left-0 right-0 top-full z-40 max-h-[70vh] overflow-y-auto border-b border-line bg-white"
              style={{ boxShadow: '0 8px 20px rgba(43,43,38,0.18)' }}
            >
              {/* 果園名稱 */}
              <div className="border-b border-line px-5 py-3 text-lg font-bold text-ink">{me?.farm}</div>
              {drawerNav.map((it) => (
                <button
                  key={it.to}
                  onClick={() => go(it.to)}
                  className={`flex w-full items-center justify-between border-b border-line px-5 text-lg font-bold ${
                    loc.pathname === it.to ? 'bg-brand text-white' : 'text-ink'
                  }`}
                  style={{ minHeight: 56 }}
                >
                  <span>{it.label}</span>
                  {typeof it.count === 'number' && <span className="text-base font-normal">{it.count} 單</span>}
                </button>
              ))}
              <button
                onClick={() => setPrinterConnected((v) => !v)}
                className="flex w-full items-center justify-between px-5 text-base"
                style={{ minHeight: 52 }}
              >
                <span className="text-ink2">印表機</span>
                <span className="flex items-center gap-2">
                  {!printerConnected && <span className="font-medium text-danger">未連線</span>}
                  <PrinterIcon connected={printerConnected} />
                </span>
              </button>
            </div>
          </>
        )}
      </header>

      {/* 內容區（獨立捲動）。內層限寬 960px（60rem，隨字體縮放）、置中 */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="relative mx-auto w-full p-4" style={{ maxWidth: '60rem' }}>
          {/* 批次模式：半透明深色遮罩罩住「選中商品以外」的內容（隨內容捲動、不蓋 header/選單） */}
          {navLocked && <div className="anim-fade absolute inset-0 z-30" style={{ background: 'rgba(43,43,38,0.55)' }} aria-hidden />}
          <Outlet
            context={{ setNavLocked, today, earlyEligible, printerConnected, setPrinterConnected, fontPx, setFontPx } satisfies FarmerOutletCtx}
          />
        </div>
      </main>

      {/* 底部 Tab Bar（≥560 才顯示；<560 改用 header 漢堡選單）。批次模式鎖定 */}
      {!isNarrow && (
      <nav
        className="relative z-10 flex shrink-0 border-t border-line bg-white"
        style={{ boxShadow: '0 -3px 8px rgba(43,43,38,0.08)', ...(navLocked ? { pointerEvents: 'none' } : {}) }}
      >
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            onClick={() => setMoreOpen(false)}
            className={({ isActive }) =>
              `flex flex-1 flex-row items-center justify-center gap-2 whitespace-nowrap text-xl font-bold ${
                navLocked ? 'text-muted' : isActive ? 'bg-brand text-white' : 'text-ink2'
              }`
            }
            style={{ minHeight: 64 }}
          >
            <span>{t.label}</span>
            {typeof t.count === 'number' && <span>{t.count} 單</span>}
          </NavLink>
        ))}

        {/* 更多：彈出低頻分頁 */}
        <button
          onClick={() => setMoreOpen((v) => !v)}
          className={`flex flex-1 flex-row items-center justify-center gap-2 whitespace-nowrap text-xl font-bold ${
            navLocked ? 'text-muted' : moreActive ? 'bg-brand text-white' : moreOpen ? 'text-brand' : 'text-ink2'
          }`}
          style={{ minHeight: 64 }}
        >
          <span>更多</span>
          <span>{moreOpen ? '▾' : '▴'}</span>
        </button>

        {moreOpen && (
          <div
            className="anim-slide-up absolute bottom-full right-0 mb-0 w-64 overflow-hidden rounded-t-lg border border-line bg-white"
            style={{ boxShadow: '0 -4px 16px rgba(43,43,38,0.12)' }}
          >
            {MORE_ITEMS.map((it) => (
              <button
                key={it.to}
                onClick={() => go(it.to)}
                className={`flex w-full items-center px-5 text-lg font-bold ${
                  loc.pathname === it.to ? 'bg-brand text-white' : 'text-ink'
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

      <DevPanel
        today={today}
        onChange={setToday}
        shippableCount={shippableCount}
        upcomingCount={upcomingCount}
        earlyEligible={earlyEligible}
        onToggleEarly={() => setEarlyEligible((v) => !v)}
        farmers={farmers}
        currentFarmerId={currentFarmerId}
        onChangeFarmer={setCurrentFarmerId}
      />
    </div>
  )
}
