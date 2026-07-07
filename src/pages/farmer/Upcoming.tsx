import { useOutletContext } from 'react-router-dom'
import { useStore } from '../../store'
import ProductGroupList from '../../components/ProductGroupList'
import { EmptyState } from '../../components/States'
import { useListFilter } from '../../components/ListFilter'
import { isInUpcomingPage, sortForFarmer } from '../../utils/shipDate'
import type { FarmerOutletCtx } from './FarmerLayout'

export default function Upcoming() {
  const { orders, currentFarmerId } = useStore()
  const { today, earlyEligible, setNavLocked } = useOutletContext<FarmerOutletCtx>()

  const list = sortForFarmer(
    orders.filter((o) => o.farmerId === currentFarmerId && isInUpcomingPage(o, today))
  )
  const { filtered, filterButton, filterPanel } = useListFilter(list)

  return (
    <div>
      <p className="mb-3 text-lg text-ink2">這些還沒到出貨時間，先看就好，時間到會自動跳到「需出貨」。</p>
      <div className="mb-4">
        {filterButton}
        {filterPanel}
      </div>
      {filtered.length === 0 ? (
        <EmptyState message={list.length === 0 ? '目前沒有預告中的單' : '沒有符合篩選的單'} />
      ) : (
        <ProductGroupList orders={filtered} mode="early" earlyEligible={earlyEligible} setNavLocked={setNavLocked} today={today} />
      )}
    </div>
  )
}
