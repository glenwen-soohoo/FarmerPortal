import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useStore } from '../../store'
import ProductGroupList from '../../components/ProductGroupList'
import EnterpriseGroupList from '../../components/EnterpriseGroupList'
import { useBulkTypeFilter } from '../../components/BulkTypeToggle'
import { EmptyState } from '../../components/States'
import { useListFilter } from '../../components/ListFilter'
import { isInUpcomingPage, isCancelHidden, sortForFarmer } from '../../utils/shipDate'
import type { FarmerOutletCtx } from './FarmerLayout'

export default function Upcoming() {
  const { orders, currentFarmerId } = useStore()
  const { today, earlyEligible, setNavLocked } = useOutletContext<FarmerOutletCtx>()

  // memo：理由同 Shippable —— 未 memo 時每次 context 變動都會重跑整份排序
  const list = useMemo(
    () =>
      sortForFarmer(
        orders.filter((o) => o.farmerId === currentFarmerId && isInUpcomingPage(o, today) && !isCancelHidden(o, today)),
        today
      ),
    [orders, currentFarmerId, today]
  )
  // 先依訂單類別（一般 / 7-11 / 企業送禮）切換，再套關鍵字篩選
  const { bulkType, filtered: byType, toggle } = useBulkTypeFilter(list)
  const { filtered, filterButton, filterPanel } = useListFilter(byType, { keyword: true })

  return (
    <div>
      <p className="mb-3 text-lg text-ink-sub">這些還不能出，時間到會自動移動到「需出貨」。</p>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        {toggle}
        <div className="ml-auto w-full max-w-sm">
          {filterButton}
          {filterPanel}
        </div>
      </div>
      {filtered.length === 0 ? (
        <EmptyState message={list.length === 0 ? '目前沒有預告中的單' : '沒有符合篩選的單'} />
      ) : bulkType === '企業送禮' ? (
        <EnterpriseGroupList orders={filtered} mode="early" earlyEligible={earlyEligible} setNavLocked={setNavLocked} today={today} />
      ) : (
        <ProductGroupList orders={filtered} mode="early" earlyEligible={earlyEligible} setNavLocked={setNavLocked} today={today} />
      )}
    </div>
  )
}
