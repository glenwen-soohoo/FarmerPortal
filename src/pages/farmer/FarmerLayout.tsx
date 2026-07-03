import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import SegmentedNav from '../../components/SegmentedNav'
import { useStore } from '../../store'
import DevPanel from '../../dev/DevPanel'
import { DEFAULT_DEV_TODAY, isInShippablePage, isInUpcomingPage } from '../../utils/shipDate'

// 給子頁（Shippable 等）用：鎖住上方分頁（批次列印模式）、開發用測試日期、提早出貨資格
export interface FarmerOutletCtx {
  setNavLocked: (v: boolean) => void
  today: string // 'YYYY-MM-DD' 測試日期
  earlyEligible: boolean // 農友是否有提早出貨資格
}

export default function FarmerLayout() {
  const { orders, currentFarmerId, farmers } = useStore()
  const loc = useLocation()
  const navigate = useNavigate()
  const me = farmers.find((f) => f.id === currentFarmerId)
  const [navLocked, setNavLocked] = useState(false)
  const [today, setToday] = useState(DEFAULT_DEV_TODAY)
  const [printerConnected, setPrinterConnected] = useState(true) // mock：點指示燈可切換連線狀態
  const [earlyEligible, setEarlyEligible] = useState<boolean>(me?.earlyShip ?? true) // 提早出貨資格（開發面板可切換）

  const mine = orders.filter((o) => o.farmerId === currentFarmerId)
  // 依測試日期分桶（可出貨 / 出貨預告都由日期決定）
  const shippableCount = mine.filter((o) => isInShippablePage(o, today)).length
  const upcomingCount = mine.filter((o) => isInUpcomingPage(o, today)).length

  const TABS = ['/farmer/shippable', '/farmer/upcoming', '/farmer/history', '/farmer/all', '/farmer/preview']
  const isMain = TABS.includes(loc.pathname)

  return (
    <div className="farmer-scope flex h-screen flex-col bg-white">
      <header className="flex items-center justify-between px-4 py-3 border-b border-line">
        <div className="text-xl font-bold text-brand">農友出貨平台</div>

        <div className="flex items-center gap-4">
          <span className="text-base text-ink2">{me?.farm}</span>

          {/* 印表機連線指示燈（mock：可點擊切換狀態） */}
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
            <span className="text-sm font-medium" style={{ color: printerConnected ? '#2E7D32' : '#C0392B' }}>
              {printerConnected ? '印表機已連線' : '印表機未連線'}
            </span>
          </button>

          {/* 設定 */}
          <button
            onClick={() => !navLocked && navigate('/farmer/me')}
            disabled={navLocked}
            className="rounded border border-line px-4 py-1.5 text-base font-medium text-ink disabled:opacity-40"
          >
            設定
          </button>
        </div>
      </header>

      {isMain && (
        <SegmentedNav
          locked={navLocked}
          items={[
            { to: '/farmer/preview', label: '未出預覽' },
            { to: '/farmer/shippable', label: '可出貨', count: shippableCount },
            { to: '/farmer/upcoming', label: '出貨預告', count: upcomingCount },
            { to: '/farmer/history', label: '出貨紀錄' },
            { to: '/farmer/all', label: '所有訂單' },
          ]}
        />
      )}

      <main className="flex-1 overflow-auto bg-cream p-4">
        <Outlet context={{ setNavLocked, today, earlyEligible } satisfies FarmerOutletCtx} />
      </main>

      {/* 開發用：切換測試日期 / 提早出貨資格 */}
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
