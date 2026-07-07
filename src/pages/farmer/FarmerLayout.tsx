import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import DevPanel from '../../dev/DevPanel'
import { DEFAULT_DEV_TODAY, isInShippablePage, isInUpcomingPage } from '../../utils/shipDate'

// 給子頁用：鎖住底部分頁（批次模式）、開發用測試日期、提早出貨資格
export interface FarmerOutletCtx {
  setNavLocked: (v: boolean) => void
  today: string
  earlyEligible: boolean
}

const TITLES: Record<string, string> = {
  '/farmer/shippable': '需出貨',
  '/farmer/upcoming': '出貨預告',
  '/farmer/preview': '備貨總覽',
  '/farmer/history': '出貨紀錄',
  '/farmer/all': '所有訂單',
  '/farmer/me': '設定',
}

// 「更多」收納的低頻分頁
const MORE_ROUTES = ['/farmer/history', '/farmer/all', '/farmer/me']
const MORE_ITEMS = [
  { to: '/farmer/all', label: '所有訂單查詢' },
  { to: '/farmer/history', label: '出貨紀錄' },
  { to: '/farmer/me', label: '設定 / 我的' },
]

export default function FarmerLayout() {
  const { orders, currentFarmerId, farmers } = useStore()
  const loc = useLocation()
  const navigate = useNavigate()
  const me = farmers.find((f) => f.id === currentFarmerId)
  const [navLocked, setNavLocked] = useState(false)
  const [today, setToday] = useState(DEFAULT_DEV_TODAY)
  const [printerConnected, setPrinterConnected] = useState(true)
  const [earlyEligible, setEarlyEligible] = useState<boolean>(me?.earlyShip ?? true)
  const [moreOpen, setMoreOpen] = useState(false)

  const mine = orders.filter((o) => o.farmerId === currentFarmerId)
  const shippableCount = mine.filter((o) => isInShippablePage(o, today)).length
  const upcomingCount = mine.filter((o) => isInUpcomingPage(o, today)).length
  const forcedTodayCount = mine.filter((o) => isInShippablePage(o, today) && !!o.forcedShipDate).length

  const tabs = [
    { to: '/farmer/shippable', label: '需出貨', count: shippableCount },
    { to: '/farmer/upcoming', label: '出貨預告', count: upcomingCount },
    { to: '/farmer/preview', label: '備貨總覽' },
  ]
  const pageTitle = TITLES[loc.pathname] ?? '農友出貨平台'
  const moreActive = MORE_ROUTES.includes(loc.pathname)

  const go = (to: string) => {
    if (navLocked) return
    setMoreOpen(false)
    navigate(to)
  }

  return (
    <div className="farmer-scope flex h-screen flex-col overflow-hidden bg-canvas">
      {/* 頂部薄 header：頁名 + 印表機連線燈 */}
      <header className="flex shrink-0 items-center justify-between border-b border-line bg-white px-5 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-ink">{pageTitle}</h1>
          {loc.pathname === '/farmer/shippable' && forcedTodayCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-danger/10 px-3 py-1 text-lg font-bold text-danger">
              指定今日 {forcedTodayCount} 單
            </span>
          )}
        </div>
        <button
          onClick={() => setPrinterConnected((v) => !v)}
          className="flex items-center gap-2"
          aria-label="印表機連線狀態"
        >
          <span
            className="inline-block rounded-full"
            style={{
              width: 12,
              height: 12,
              background: printerConnected ? '#2E7D32' : '#C0392B',
              boxShadow: `0 0 0 3px ${printerConnected ? 'rgba(46,125,50,0.18)' : 'rgba(192,57,43,0.15)'}`,
            }}
          />
          <span className="text-base font-medium" style={{ color: printerConnected ? '#2E7D32' : '#C0392B' }}>
            {printerConnected ? '印表機已連線' : '印表機未連線'}
          </span>
        </button>
      </header>

      {/* 批次模式提示條：鎖分頁時提醒農友「不是當機」 */}
      {navLocked && (
        <div className="shrink-0 bg-brand px-5 py-2 text-center text-base font-bold text-white">
          批次列印中，完成或按「取消」後即可切換頁面
        </div>
      )}

      {/* 內容區（單欄、獨立捲動、吃滿寬） */}
      <main className="flex-1 overflow-y-auto p-4">
        <Outlet context={{ setNavLocked, today, earlyEligible } satisfies FarmerOutletCtx} />
      </main>

      {/* 底部 Tab Bar（批次模式鎖定）。3 核心分頁 + 更多 */}
      <nav
        className="relative flex shrink-0 border-t border-line bg-white"
        style={navLocked ? { pointerEvents: 'none', opacity: 0.4 } : undefined}
      >
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            onClick={() => setMoreOpen(false)}
            className={({ isActive }) =>
              `flex flex-1 flex-row items-center justify-center gap-2 whitespace-nowrap text-xl font-bold ${
                isActive ? 'bg-brand text-white' : 'text-ink2'
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
            moreActive ? 'bg-brand text-white' : moreOpen ? 'text-brand' : 'text-ink2'
          }`}
          style={{ minHeight: 64 }}
        >
          <span>更多</span>
          <span>{moreOpen ? '▾' : '▴'}</span>
        </button>

        {moreOpen && (
          <div
            className="absolute bottom-full right-0 mb-0 w-64 overflow-hidden rounded-t-lg border border-line bg-white"
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
