import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import DevPanel from '../../dev/DevPanel'
import { DEFAULT_DEV_TODAY, isInShippablePage, isInUpcomingPage } from '../../utils/shipDate'

// 給子頁用：鎖住側邊選單（批次模式）、開發用測試日期、提早出貨資格
export interface FarmerOutletCtx {
  setNavLocked: (v: boolean) => void
  today: string
  earlyEligible: boolean
}

const TITLES: Record<string, string> = {
  '/farmer/preview': '未出預覽',
  '/farmer/shippable': '可出貨',
  '/farmer/upcoming': '出貨預告',
  '/farmer/history': '出貨紀錄',
  '/farmer/all': '所有訂單',
  '/farmer/me': '我的',
}

export default function FarmerLayout() {
  const { orders, currentFarmerId, farmers } = useStore()
  const loc = useLocation()
  const navigate = useNavigate()
  const me = farmers.find((f) => f.id === currentFarmerId)
  const [navLocked, setNavLocked] = useState(false)
  const [today, setToday] = useState(DEFAULT_DEV_TODAY)
  const [printerConnected, setPrinterConnected] = useState(true)
  const [earlyEligible, setEarlyEligible] = useState<boolean>(me?.earlyShip ?? true)

  const mine = orders.filter((o) => o.farmerId === currentFarmerId)
  const shippableCount = mine.filter((o) => isInShippablePage(o, today)).length
  const upcomingCount = mine.filter((o) => isInUpcomingPage(o, today)).length

  const navItems = [
    { to: '/farmer/preview', label: '未出預覽' },
    { to: '/farmer/shippable', label: '可出貨', count: shippableCount },
    { to: '/farmer/upcoming', label: '出貨預告', count: upcomingCount },
    { to: '/farmer/history', label: '出貨紀錄' },
    { to: '/farmer/all', label: '所有訂單' },
  ]
  const pageTitle = TITLES[loc.pathname] ?? '農友出貨平台'

  return (
    <div className="farmer-scope flex h-screen overflow-hidden bg-white">
      {/* 左側固定側邊欄（獨立捲動，不隨右側內容滑動） */}
      <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-line bg-white">
        <div className="border-b border-line px-4 py-4">
          <div className="text-xl font-bold text-brand">農友出貨平台</div>
          <div className="mt-1 text-base text-ink2">{me?.farm}</div>
        </div>

        {/* 選單（批次模式鎖定）；自身可捲動 */}
        <nav
          className="flex-1 overflow-y-auto py-2"
          style={navLocked ? { pointerEvents: 'none', opacity: 0.4 } : undefined}
        >
          {navItems.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-4 text-xl font-bold ${
                  isActive ? 'bg-brand text-white' : 'text-ink2'
                }`
              }
              style={{ minHeight: 60 }}
            >
              <span>{it.label}</span>
              {typeof it.count === 'number' && <span className="text-base">（{it.count}）</span>}
            </NavLink>
          ))}
        </nav>

        {/* 底部：印表機指示燈 + 設定 */}
        <div className="border-t border-line px-4 py-3">
          <button
            onClick={() => setPrinterConnected((v) => !v)}
            className="flex w-full items-center gap-2"
            style={{ minHeight: 44 }}
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
            <span className="text-sm font-medium" style={{ color: printerConnected ? '#2E7D32' : '#C0392B' }}>
              {printerConnected ? '印表機已連線' : '印表機未連線'}
            </span>
          </button>
          <button
            onClick={() => !navLocked && navigate('/farmer/me')}
            disabled={navLocked}
            className="mt-2 w-full rounded-lg border border-line text-base font-medium text-ink disabled:opacity-40"
            style={{ minHeight: 48 }}
          >
            設定
          </button>
        </div>
      </aside>

      {/* 右側：標題 + 內容（獨立捲動） */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-line bg-white px-6 py-4">
          <h1 className="text-2xl font-bold text-ink">{pageTitle}</h1>
        </header>
        <main className="flex-1 overflow-y-auto bg-cream p-4">
          <Outlet context={{ setNavLocked, today, earlyEligible } satisfies FarmerOutletCtx} />
        </main>
      </div>

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
