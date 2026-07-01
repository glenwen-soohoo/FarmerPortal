import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import SegmentedNav from '../../components/SegmentedNav'
import { useStore } from '../../store'

// 給子頁（Shippable 等）用來鎖住上方分頁（批次列印模式）
export interface FarmerOutletCtx {
  setNavLocked: (v: boolean) => void
}

export default function FarmerLayout() {
  const { orders, currentFarmerId, farmers } = useStore()
  const loc = useLocation()
  const navigate = useNavigate()
  const me = farmers.find((f) => f.id === currentFarmerId)
  const [navLocked, setNavLocked] = useState(false)

  const mine = orders.filter((o) => o.farmerId === currentFarmerId)
  // 可出貨頁含「可出貨（未印）＋ 已印單（待黑貓收貨）」
  const shippableCount = mine.filter((o) => o.shipStatus === '可出貨' || o.shipStatus === '已印單').length
  const upcomingCount = mine.filter((o) => o.shipStatus === '未達出貨時間').length

  const TABS = ['/farmer/shippable', '/farmer/upcoming', '/farmer/history', '/farmer/all']
  const isMain = TABS.includes(loc.pathname)

  return (
    <div className="farmer-scope flex h-screen flex-col bg-white">
      <header className="flex items-center justify-between px-4 py-3 border-b border-line">
        <div className="text-xl font-bold text-brand">農友出貨平台</div>
        <button
          onClick={() => !navLocked && navigate('/farmer/me')}
          disabled={navLocked}
          className="text-base text-ink2 disabled:opacity-40"
        >
          {me?.farm ?? '我的'}
        </button>
      </header>

      {isMain && (
        <SegmentedNav
          locked={navLocked}
          items={[
            { to: '/farmer/shippable', label: '可出貨', count: shippableCount },
            { to: '/farmer/upcoming', label: '出貨預告', count: upcomingCount },
            { to: '/farmer/history', label: '出貨紀錄' },
            { to: '/farmer/all', label: '所有訂單' },
          ]}
        />
      )}

      <main className="flex-1 overflow-auto bg-cream p-4">
        <Outlet context={{ setNavLocked } satisfies FarmerOutletCtx} />
      </main>
    </div>
  )
}
